import { withPool } from "@/lib/db";

export async function listOrders() {
  return withPool(async (pool) => {
    const { rows } = await pool.query(
      `SELECT o.id::text, o.invoice_code, o.customer_name, o.customer_email, o.customer_phone,
              o.status, o.total_amount::text, o.unique_amount::text, o.created_at,
              m.name AS method_name,
              (SELECT product_name FROM order_items WHERE order_id = o.id ORDER BY id LIMIT 1) AS product_name
       FROM orders o
       LEFT JOIN payment_methods m ON m.id = o.payment_method_id
       ORDER BY o.created_at DESC
       LIMIT 200`,
    );
    return rows;
  });
}

export async function getOrderDetail(id: string) {
  return withPool(async (pool) => {
    const order = await pool.query(
      `SELECT o.id::text, o.invoice_code, o.customer_name, o.customer_email, o.customer_phone,
              o.status, o.subtotal::text, o.discount_amount::text, o.admin_fee::text,
              o.total_amount::text, o.unique_amount::text, o.va_number, o.payment_code,
              o.payment_url, o.paid_at, o.expired_at, o.created_at, o.transfer_proof_url,
              m.name AS method_name, m.type AS method_type,
              cancel.request_payload AS cancel_reason, cancel.created_at AS cancelled_at
       FROM orders o
       LEFT JOIN payment_methods m ON m.id = o.payment_method_id
       LEFT JOIN LATERAL (
         SELECT request_payload, created_at
         FROM payment_logs
         WHERE order_id = o.id AND type = 'MANUAL_CANCEL'
         ORDER BY id DESC
         LIMIT 1
       ) cancel ON true
       WHERE o.id::text = $1`,
      [id],
    );
    if (!order.rows[0]) return null;
    const items = await pool.query(
      `SELECT id::text, product_name, quantity, unit_price::text, total_price::text
       FROM order_items WHERE order_id::text = $1 ORDER BY id`,
      [id],
    );
    const logs = await pool.query(
      `SELECT id::text, endpoint, type, http_status, created_at
       FROM payment_logs WHERE invoice_code = $1 ORDER BY id DESC`,
      [order.rows[0].invoice_code],
    );
    return { order: order.rows[0], items: items.rows, logs: logs.rows };
  });
}

export async function cancelUnpaidManualOrder(id: string, reason: string) {
  const note = reason.trim();
  if (note.length < 3 || note.length > 500) throw new Error("Alasan pembatalan wajib diisi, 3–500 karakter");
  return withPool(async (pool) => {
    const client = await pool.connect();
    try {
      await client.query("BEGIN");
      const current = await client.query(
        `SELECT o.id, o.invoice_code, o.status, m.type AS method_type
         FROM orders o
         LEFT JOIN payment_methods m ON m.id = o.payment_method_id
         WHERE o.id::text = $1
         FOR UPDATE OF o`,
        [id],
      );
      const row = current.rows[0];
      if (!row) throw new Error("Pesanan tidak ditemukan");
      if (row.status === "PAID") throw new Error("Pesanan yang sudah lunas tidak bisa dibatalkan");
      if (row.status === "CANCELLED") throw new Error("Pesanan sudah dibatalkan");
      if (row.method_type !== "bank_transfer") {
        throw new Error("Tolak/batalkan hanya untuk transfer bank manual yang belum lunas");
      }
      const updated = await client.query(
        `UPDATE orders SET status = 'CANCELLED', updated_at = NOW()
         WHERE id = $1 AND status <> 'PAID'
         RETURNING id::text, invoice_code, status`,
        [row.id],
      );
      if (!updated.rows[0]) throw new Error("Pesanan tidak bisa dibatalkan");
      await client.query(
        `INSERT INTO payment_logs (invoice_code, order_id, endpoint, type, request_payload, response_payload, http_status)
         VALUES ($1, $2, 'panel/orders', 'MANUAL_CANCEL', $3, '{"ok":true}', 200)`,
        [row.invoice_code, row.id, note],
      );
      await client.query("COMMIT");
      return { ...updated.rows[0], cancel_reason: note };
    } catch (err) {
      await client.query("ROLLBACK");
      throw err;
    } finally {
      client.release();
    }
  });
}
