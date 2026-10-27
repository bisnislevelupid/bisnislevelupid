import { withPool } from "@/lib/db";

export async function getNotificationLogDetail(id: string) {
  return withPool(async (pool) => {
    const { rows } = await pool.query(
      `SELECT l.id::text, l.recipient, l.channel, l.status, l.error_message, l.invoice_code,
              l.request_payload, l.response_payload, l.sent_at, l.created_at,
              t.event_trigger, t.subject
       FROM notification_logs l
       LEFT JOIN notification_templates t ON t.id = l.template_id
       WHERE l.id::text = $1`,
      [id],
    );
    return (rows[0] as Record<string, unknown> | undefined) ?? null;
  });
}

export function notificationProvider(channel: string) {
  if (channel === "EMAIL") return "Resend";
  if (channel === "WA" || channel === "WHATSAPP") return "Fonnte";
  return channel || "—";
}
