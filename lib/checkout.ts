import { randomBytes } from "node:crypto";
import { withPool } from "@/lib/db";
import { fillPlaceholders, rupiah, sanitizeEmailHtml } from "@/lib/email/html";
import { createXenditPayment } from "@/lib/payment/xendit";
import { createGopaySnap } from "@/lib/payment/midtrans";

function invoiceCode() {
  return `INV-${randomBytes(9).toString("base64url")}`;
}

async function uniqueManualAmount(
  pool: { query: (q: string, p?: unknown[]) => Promise<{ rows: Array<{ unique_amount: string }> }> },
  methodId: string,
  base: number,
) {
  const { rows } = await pool.query(
    `SELECT unique_amount::text FROM orders
     WHERE payment_method_id = $1
       AND status = 'PENDING'
       AND unique_amount IS NOT NULL
       AND (created_at AT TIME ZONE 'Asia/Jakarta')::date = (NOW() AT TIME ZONE 'Asia/Jakarta')::date`,
    [methodId],
  );
  const used = new Set(rows.map((r) => Number(r.unique_amount) % 1000));
  const stem = Math.floor(base / 1000) * 1000;
  for (let i = 0; i < 40; i++) {
    const code = Math.floor(Math.random() * 999) + 1;
    if (!used.has(code)) return stem + code;
  }
  throw new Error("Kode unik transfer habis untuk rekening ini hari ini");
}

export async function quoteCoupon(code: string, productCode: string) {
  return withPool(async (pool) => {
    const product = await pool.query(`SELECT price FROM products WHERE code = $1 AND is_active = true`, [productCode]);
    if (!product.rows[0]) return { ok: false as const, error: "Produk tidak ditemukan" };
    const price = Number(product.rows[0].price);
    const coupon = await pool.query(
      `SELECT discount_type, discount_value, min_purchase, max_discount, usage_limit, usage_count
       FROM coupon_codes
       WHERE upper(code) = upper($1) AND is_active = true
         AND valid_from <= NOW() AND valid_until >= NOW()`,
      [code],
    );
    const row = coupon.rows[0];
    if (!row) return { ok: false as const, error: "Kode promo tidak valid atau kedaluwarsa" };
    if (row.usage_limit != null && row.usage_count >= row.usage_limit) {
      return { ok: false as const, error: "Kupon sudah habis" };
    }
    if (price < Number(row.min_purchase)) {
      return { ok: false as const, error: "Belum mencapai minimum pembelian kupon" };
    }
    let discount =
      row.discount_type === "PERCENTAGE"
        ? Math.round((price * Number(row.discount_value)) / 100)
        : Number(row.discount_value);
    if (row.max_discount) discount = Math.min(discount, Number(row.max_discount));
    return { ok: true as const, discount, total: Math.max(0, price - discount) };
  });
}

export async function placeOrder(input: {
  productCode: string;
  name: string;
  email: string;
  phone: string;
  businessName: string;
  businessField: string;
  businessCity: string;
  businessStartYear: number;
  employeeRange: string;
  monthlyRevenue: string;
  ownerRole: string;
  paymentMethodId: string;
  coupon?: string;
  origin: string;
}) {
  return withPool(async (pool) => {
    const client = await pool.connect();
    try {
      await client.query("BEGIN");
      const product = await client.query(
        `SELECT id, name, type, price, includes_audit_ids FROM products WHERE code = $1 AND is_active = true`,
        [input.productCode],
      );
      if (!product.rows[0]) throw new Error("Produk tidak ditemukan");
      const method = await client.query(
        `SELECT id, code, name, type, provider, is_redirect, account_number, account_holder, admin_fee_flat
         FROM payment_methods WHERE id = $1 AND is_active = true`,
        [input.paymentMethodId],
      );
      const pm = method.rows[0];
      if (!pm) throw new Error("Metode bayar tidak ditemukan");
      if (pm.provider === "Midtrans" && pm.code !== "GOPAY") {
        throw new Error("Midtrans hanya untuk GoPay");
      }

      let discount = 0;
      let couponId: string | null = null;
      if (input.coupon) {
        const coupon = await client.query(
          `SELECT id, discount_type, discount_value, min_purchase, max_discount, usage_limit, usage_count
           FROM coupon_codes
           WHERE upper(code) = upper($1) AND is_active = true
             AND valid_from <= NOW() AND valid_until >= NOW()`,
          [input.coupon],
        );
        const c = coupon.rows[0];
        if (!c) throw new Error("Kupon tidak berlaku");
        if (c.usage_limit != null && c.usage_count >= c.usage_limit) throw new Error("Kupon habis");
        const price = Number(product.rows[0].price);
        if (price < Number(c.min_purchase)) throw new Error("Belum mencapai minimum kupon");
        discount =
          c.discount_type === "PERCENTAGE"
            ? Math.round((price * Number(c.discount_value)) / 100)
            : Number(c.discount_value);
        if (c.max_discount) discount = Math.min(discount, Number(c.max_discount));
        couponId = c.id;
      }

      const subtotal = Number(product.rows[0].price);
      const fee = Number(pm.admin_fee_flat ?? 0);
      const total = Math.max(0, subtotal - discount + fee);
      const invoice = invoiceCode();

      const existing = await client.query(`SELECT id FROM customers WHERE email = $1`, [input.email.toLowerCase()]);
      let customerId = existing.rows[0]?.id as string | undefined;
      if (!customerId) {
        const created = await client.query(
          `INSERT INTO customers (name, email, phone, business_name, business_field, business_city, business_start_year, employee_range, monthly_revenue, owner_role)
           VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10) RETURNING id`,
          [input.name, input.email.toLowerCase(), input.phone, input.businessName, input.businessField, input.businessCity, input.businessStartYear, input.employeeRange, input.monthlyRevenue, input.ownerRole],
        );
        customerId = created.rows[0].id;
      } else {
        await client.query(
          `UPDATE customers SET name=$1, phone=$2, business_name=$3, business_field=$4, business_city=$5, business_start_year=$6, employee_range=$7, monthly_revenue=$8, owner_role=$9, updated_at=NOW() WHERE id=$10`,
          [input.name, input.phone, input.businessName, input.businessField, input.businessCity, input.businessStartYear, input.employeeRange, input.monthlyRevenue, input.ownerRole, customerId],
        );
      }

      let uniqueAmount: number | null = null;
      let chargeAmount = total;
      if (pm.provider === "Manual") {
        uniqueAmount = await uniqueManualAmount(client, String(pm.id), total);
        chargeAmount = uniqueAmount;
      }

      const order = await client.query(
        `INSERT INTO orders (
           invoice_code, customer_id, payment_method_id, coupon_code_id,
           subtotal, discount_amount, admin_fee, total_amount, unique_amount,
           status, payment_type, customer_name, customer_email, customer_phone, expired_at
         ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,'PENDING',$10,$11,$12,$13, NOW() + INTERVAL '24 hours')
         RETURNING id`,
        [
          invoice,
          customerId,
          pm.id,
          couponId,
          subtotal,
          discount,
          fee,
          chargeAmount,
          uniqueAmount,
          pm.code,
          input.name,
          input.email,
          input.phone,
        ],
      );
      const orderId = order.rows[0].id;
      await client.query(
        `INSERT INTO order_items (order_id, product_id, product_name, product_type, quantity, unit_price, total_price, audit_ids_unlocked)
         VALUES ($1,$2,$3,$4,1,$5,$6,$7)`,
        [
          orderId,
          product.rows[0].id,
          product.rows[0].name,
          product.rows[0].type,
          subtotal,
          subtotal,
          product.rows[0].includes_audit_ids,
        ],
      );
      if (couponId) {
        await client.query(
          `INSERT INTO coupon_usage (coupon_id, customer_id, order_id, discount_applied) VALUES ($1,$2,$3,$4)`,
          [couponId, customerId, orderId, discount],
        );
        await client.query(`UPDATE coupon_codes SET usage_count = usage_count + 1 WHERE id = $1`, [couponId]);
      }

      const returnUrl = `${input.origin}/bayar/${invoice}`;
      let redirect: string | null = null;

      if (pm.provider === "Xendit") {
        const result = await createXenditPayment({
          invoice,
          amount: chargeAmount,
          code: pm.code,
          type: pm.type,
          customerName: input.name,
          phone: input.phone,
          returnUrl,
        });
        await client.query(
          `INSERT INTO payment_logs (invoice_code, order_id, endpoint, type, request_payload, response_payload, http_status)
           VALUES ($1,$2,$3,'PAYMENT_REQUEST',$4,$5,$6)`,
          [invoice, orderId, result.endpoint, JSON.stringify(result.request), JSON.stringify(result.response), result.httpStatus],
        );
        if (result.httpStatus >= 400) {
          throw new Error(
            typeof result.response.message === "string"
              ? result.response.message
              : "Xendit menolak pembayaran",
          );
        }
        await client.query(
          `UPDATE orders SET va_number=$1, qr_string=$2, payment_code=$3, payment_url=$4, payment_ref=$5, updated_at=NOW()
           WHERE id=$6`,
          [result.va ?? null, result.qr ?? null, result.payCode ?? null, result.redirect ?? null, result.ref ?? null, orderId],
        );
        if (pm.is_redirect && result.redirect) redirect = result.redirect;
      } else if (pm.provider === "Midtrans") {
        const result = await createGopaySnap({
          invoice,
          amount: chargeAmount,
          name: input.name,
          email: input.email,
          phone: input.phone,
        });
        await client.query(
          `INSERT INTO payment_logs (invoice_code, order_id, endpoint, type, request_payload, response_payload, http_status)
           VALUES ($1,$2,$3,'PAYMENT_REQUEST',$4,$5,$6)`,
          [invoice, orderId, result.endpoint, JSON.stringify(result.request), JSON.stringify(result.response), result.httpStatus],
        );
        if (!result.token) throw new Error("Snap GoPay gagal dibuat");
        await client.query(`UPDATE orders SET snap_token=$1, payment_ref=$1, updated_at=NOW() WHERE id=$2`, [
          result.token,
          orderId,
        ]);
      }

      await client.query("COMMIT");
      return { invoice, redirect, methodType: String(pm.type) };
    } catch (err) {
      await client.query("ROLLBACK");
      throw err;
    } finally {
      client.release();
    }
  });
}

export async function getOrderPublic(invoice: string) {
  return withPool(async (pool) => {
    const { rows } = await pool.query(
      `SELECT o.invoice_code, o.status, o.total_amount::text, o.unique_amount::text, o.subtotal::text,
              o.discount_amount::text, o.va_number, o.qr_string, o.payment_code, o.payment_url,
              o.snap_token, o.expired_at, o.paid_at, o.transfer_proof_url,
              m.code AS method_code, m.name AS method_name, m.type AS method_type, m.provider,
              m.logo_url, m.account_number, m.account_holder, m.is_redirect
       FROM orders o
       LEFT JOIN payment_methods m ON m.id = o.payment_method_id
       WHERE o.invoice_code = $1`,
      [invoice],
    );
    if (!rows[0]) return null;
    const order = rows[0];
    const instructions = await pool.query(
      `SELECT title, content FROM payment_instructions WHERE payment_method_id = (
         SELECT payment_method_id FROM orders WHERE invoice_code = $1
       ) ORDER BY sort_order`,
      [invoice],
    );
    const values = {
      va: String(order.va_number ?? "nomor VA di halaman ini"),
      kode: String(order.payment_code ?? "kode bayar di halaman ini"),
      rekening: String(order.account_number ?? "-"),
      atas_nama: String(order.account_holder ?? "BisnisLevelUp.id"),
      nominal: rupiah(String(order.total_amount ?? "0")),
      metode: String(order.method_name ?? ""),
    };
    return {
      ...order,
      instructions: instructions.rows.map((item) => ({
        title: item.title,
        content: sanitizeEmailHtml(fillPlaceholders(String(item.content), values)),
      })),
    };
  });
}

export async function markPaid(invoice: string, source: string, payload: unknown) {
  return withPool(async (pool) => {
    const current = await pool.query(
      `UPDATE orders SET status='PAID', paid_at=COALESCE(paid_at, NOW()), updated_at=NOW()
       WHERE invoice_code=$1 AND status='PENDING' RETURNING id, customer_name, customer_email, customer_phone, total_amount`,
      [invoice],
    );
    const order = current.rows[0];
    if (!order) return null;
    await pool.query(
      `INSERT INTO payment_logs (invoice_code, order_id, endpoint, type, request_payload, response_payload, http_status)
       VALUES ($1,$2,$3,'WEBHOOK',$4,'{"ok":true}',200)`,
      [invoice, order.id, source, JSON.stringify(payload)],
    );
    return order;
  });
}
