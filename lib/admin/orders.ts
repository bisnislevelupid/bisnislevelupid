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
              m.name AS method_name, m.type AS method_type
       FROM orders o
       LEFT JOIN payment_methods m ON m.id = o.payment_method_id
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
