import { Resend } from "resend";
import { withPool } from "@/lib/db";
import { fillPlaceholders, htmlToText, wrapEmailHtml } from "@/lib/email/html";
import { sendFonnte } from "@/lib/whatsapp/fonnte";

type SendInput = {
  event: string;
  to: string | null;
  phone?: string | null;
  invoice?: string | null;
  orderId?: string | null;
  sessionId?: string | null;
  values: Record<string, string>;
  attachments?: Array<{ filename: string; content: Buffer }>;
  fileUrl?: string | null;
};

function isWhatsApp(channel: string) {
  return channel === "WA" || channel === "WHATSAPP";
}

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
      const raw = fillPlaceholders(String(tpl.message_content), input.values);
      const subject = fillPlaceholders(String(tpl.subject ?? "BisnisLevelUp.id"), input.values);
      if (isWhatsApp(String(tpl.channel))) {
        const message = htmlToText(raw);
        const recipient = input.phone?.trim() || "";
        if (!recipient) {
          await pool.query(
            `INSERT INTO notification_logs (template_id, invoice_code, order_id, session_id, recipient, channel, request_payload, status, error_message)
             VALUES ($1,$2,$3,$4,'-',$5,$6,'FAILED',$7)`,
            [tpl.id, input.invoice ?? null, input.orderId ?? null, input.sessionId ?? null, tpl.channel, message, "Nomor WhatsApp kosong"],
          );
          continue;
        }
        const result = await sendFonnte({ target: recipient, message, fileUrl: input.fileUrl });
        const waStatus = result.ok ? "SENT" : "FAILED";
        await pool.query(
          `INSERT INTO notification_logs (template_id, invoice_code, order_id, session_id, recipient, channel, request_payload, response_payload, status, error_message, sent_at)
           VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10, CASE WHEN $11::varchar = 'SENT' THEN NOW() ELSE NULL END)`,
          [
            tpl.id,
            input.invoice ?? null,
            input.orderId ?? null,
            input.sessionId ?? null,
            recipient,
            tpl.channel,
            message,
            JSON.stringify(result.response ?? {}),
            waStatus,
            result.error,
            waStatus,
          ],
        );
        continue;
      }
      if (tpl.channel !== "EMAIL") continue;
      const message = raw;
      const recipient = input.to?.trim() || "";
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
        const emailStatus = error ? "FAILED" : "SENT";
        await pool.query(
          `INSERT INTO notification_logs (template_id, invoice_code, order_id, session_id, recipient, channel, request_payload, response_payload, status, error_message, sent_at)
           VALUES ($1,$2,$3,$4,$5,'EMAIL',$6,$7,$8,$9, CASE WHEN $10::varchar = 'SENT' THEN NOW() ELSE NULL END)`,
          [
            tpl.id,
            input.invoice ?? null,
            input.orderId ?? null,
            input.sessionId ?? null,
            recipient,
            html,
            JSON.stringify(error ?? data ?? {}),
            emailStatus,
            error?.message ?? null,
            emailStatus,
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
