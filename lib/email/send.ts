import { Resend } from "resend";
import { withPool } from "@/lib/db";
import { fillPlaceholders, wrapEmailHtml } from "@/lib/email/html";

type SendInput = {
  event: string;
  to: string | null;
  invoice?: string | null;
  orderId?: string | null;
  sessionId?: string | null;
  values: Record<string, string>;
  attachments?: Array<{ filename: string; content: Buffer }>;
};

export function fromAddress() {
  const domain = process.env.RESEND_EMAIL_DOMAIN || "bisnislevelup.id";
  return `BisnisLevelUp.id <noreply@${domain}>`;
}

export async function dispatchTemplate(input: SendInput) {
  await withPool(async (pool) => {
    const { rows } = await pool.query(
      `SELECT id, channel, subject, message_content
       FROM notification_templates
       WHERE event_trigger = $1 AND is_active = true`,
      [input.event],
    );
    if (!rows.length) {
      await pool.query(
        `INSERT INTO notification_logs (invoice_code, order_id, session_id, recipient, channel, request_payload, response_payload, status, error_message)
         VALUES ($1,$2,$3,$4,'EMAIL',$5,$6,'FAILED',$7)`,
        [input.invoice ?? null, input.orderId ?? null, input.sessionId ?? null, input.to ?? "-", input.event, "Template tidak ditemukan", "Template tidak aktif"],
      );
      return;
    }
    for (const tpl of rows) {
      const message = fillPlaceholders(String(tpl.message_content), input.values);
      const subject = fillPlaceholders(String(tpl.subject ?? "BisnisLevelUp.id"), input.values);
      const recipient = tpl.channel === "EMAIL" ? input.to : null;
      if (tpl.channel !== "EMAIL") {
        await pool.query(
          `INSERT INTO notification_logs (template_id, invoice_code, order_id, session_id, recipient, channel, request_payload, response_payload, status, error_message)
           VALUES ($1,$2,$3,$4,$5,$6,$7,$8,'SKIPPED',$9)`,
          [tpl.id, input.invoice ?? null, input.orderId ?? null, input.sessionId ?? null, recipient ?? "-", tpl.channel, message, "Kanal belum dikirim", "Hanya email yang aktif"],
        );
        continue;
      }
      if (!recipient) {
        await pool.query(
          `INSERT INTO notification_logs (template_id, invoice_code, order_id, session_id, recipient, channel, request_payload, status, error_message)
           VALUES ($1,$2,$3,$4,'-','EMAIL',$5,'FAILED',$6)`,
          [tpl.id, input.invoice ?? null, input.orderId ?? null, input.sessionId ?? null, message, "Email penerima kosong"],
        );
        continue;
      }
      const html = wrapEmailHtml(message);
      const key = process.env.RESEND_API_KEY;
      if (!key) {
        await pool.query(
          `INSERT INTO notification_logs (template_id, invoice_code, order_id, session_id, recipient, channel, request_payload, status, error_message)
           VALUES ($1,$2,$3,$4,$5,'EMAIL',$6,'FAILED',$7)`,
          [tpl.id, input.invoice ?? null, input.orderId ?? null, input.sessionId ?? null, recipient, html, "RESEND_API_KEY belum diset"],
        );
        continue;
      }
      try {
        const resend = new Resend(key);
        const { data, error } = await resend.emails.send({
          from: fromAddress(),
          to: recipient,
          subject,
          html,
          attachments: input.attachments?.map((file) => ({ filename: file.filename, content: file.content })),
        });
        await pool.query(
          `INSERT INTO notification_logs (template_id, invoice_code, order_id, session_id, recipient, channel, request_payload, response_payload, status, error_message, sent_at)
           VALUES ($1,$2,$3,$4,$5,'EMAIL',$6,$7,$8,$9, CASE WHEN $8 = 'SENT' THEN NOW() ELSE NULL END)`,
          [
            tpl.id,
            input.invoice ?? null,
            input.orderId ?? null,
            input.sessionId ?? null,
            recipient,
            html,
            JSON.stringify(error ?? data ?? {}),
            error ? "FAILED" : "SENT",
            error?.message ?? null,
          ],
        );
      } catch (error) {
        await pool.query(
          `INSERT INTO notification_logs (template_id, invoice_code, order_id, session_id, recipient, channel, request_payload, status, error_message)
           VALUES ($1,$2,$3,$4,$5,'EMAIL',$6,'FAILED',$7)`,
          [
            tpl.id,
            input.invoice ?? null,
            input.orderId ?? null,
            input.sessionId ?? null,
            recipient,
            html,
            error instanceof Error ? error.message : "Gagal mengirim",
          ],
        );
      }
    }
  });
}
