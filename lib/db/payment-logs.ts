import { withPool } from "@/lib/db";

export async function getPaymentLogDetail(id: string) {
  return withPool(async (pool) => {
    const { rows } = await pool.query(
      `SELECT l.id::text, l.invoice_code, l.order_id::text, l.endpoint, l.type,
              l.request_payload, l.response_payload, l.http_status, l.created_at,
              o.customer_email, o.customer_phone
       FROM payment_logs l
       LEFT JOIN orders o ON o.id = l.order_id
       WHERE l.id::text = $1`,
      [id],
    );
    return (rows[0] as Record<string, unknown> | undefined) ?? null;
  });
}
