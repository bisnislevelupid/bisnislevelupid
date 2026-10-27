import { Resend } from "resend";
import type { Pool } from "@neondatabase/serverless";
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

type LogRow = {
  templateId: string | number | null;
  invoice: string | null;
  orderId: string | null;
  sessionId: string | null;
  recipient: string;
  channel: string;
  requestPayload: string | null;
  responsePayload: string | null;
  status: string;
  errorMessage: string | null;
  sent: boolean;
};

function isWhatsApp(channel: string) {
  return channel === "WA" || channel === "WHATSAPP";
}

export function fromAddress() {
  const domain = process.env.RESEND_EMAIL_DOMAIN || "bisnislevelup.id";
  return `BisnisLevelUp.id <noreply@${domain}>`;
}

async function insertNotificationLog(pool: Pool, row: LogRow) {
  await pool.query(
    `INSERT INTO notification_logs (
       template_id, invoice_code, order_id, session_id, recipient, channel,
       request_payload, response_payload, status, error_message, sent_at
     ) VALUES (
       $1::bigint, $2::varchar, $3::bigint, $4::bigint, $5::varchar, $6::varchar,
       $7::text, $8::text, $9::varchar, $10::text,
       CASE WHEN $11::varchar = 'SENT' THEN NOW() ELSE NULL END
     )`,
    [
      row.templateId,
      row.invoice,
      row.orderId,
      row.sessionId,
      row.recipient,
      row.channel,
      row.requestPayload,
      row.responsePayload,
      row.status,
      row.errorMessage,
      row.sent ? "SENT" : "FAILED",
    ],
  );
}

async function safeLog(pool: Pool, row: LogRow) {
  try {
    await insertNotificationLog(pool, row);
  } catch (error) {
    console.error("[notification log]", error);
  }
}

export async function dispatchTemplate(input: SendInput) {
  await withPool(async (pool) => {
    const { rows } = await pool.query(
      `SELECT id, channel, subject, message_content
       FROM notification_templates
       WHERE event_trigger = $1 AND is_active = true
       ORDER BY CASE WHEN channel = 'EMAIL' THEN 0 ELSE 1 END, id`,
      [input.event],
    );
    if (!rows.length) {
      await safeLog(pool, {
        templateId: null,
        invoice: input.invoice ?? null,
        orderId: input.orderId ?? null,
        sessionId: input.sessionId ?? null,
        recipient: input.to ?? "-",
        channel: "EMAIL",
        requestPayload: input.event,
        responsePayload: null,
        status: "FAILED",
        errorMessage: "Template tidak aktif",
        sent: false,
      });
      return;
    }
    for (const tpl of rows) {
      if (isWhatsApp(String(tpl.channel))) continue;
      if (tpl.channel !== "EMAIL") continue;
      const message = fillPlaceholders(String(tpl.message_content), input.values);
      const subject = fillPlaceholders(String(tpl.subject ?? "BisnisLevelUp.id"), input.values);
      const recipient = input.to?.trim() || "";
      if (!recipient) {
        await safeLog(pool, {
          templateId: tpl.id,
          invoice: input.invoice ?? null,
          orderId: input.orderId ?? null,
          sessionId: input.sessionId ?? null,
          recipient: "-",
          channel: "EMAIL",
          requestPayload: message,
          responsePayload: null,
          status: "FAILED",
          errorMessage: "Email penerima kosong",
          sent: false,
        });
        continue;
      }
      const html = wrapEmailHtml(message);
      const key = process.env.RESEND_API_KEY;
      if (!key) {
        await safeLog(pool, {
          templateId: tpl.id,
          invoice: input.invoice ?? null,
          orderId: input.orderId ?? null,
          sessionId: input.sessionId ?? null,
          recipient,
          channel: "EMAIL",
          requestPayload: html,
          responsePayload: null,
          status: "FAILED",
          errorMessage: "RESEND_API_KEY belum diset",
          sent: false,
        });
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
        await safeLog(pool, {
          templateId: tpl.id,
          invoice: input.invoice ?? null,
          orderId: input.orderId ?? null,
          sessionId: input.sessionId ?? null,
          recipient,
          channel: "EMAIL",
          requestPayload: html,
          responsePayload: JSON.stringify(error ?? data ?? {}),
          status: emailStatus,
          errorMessage: error?.message ?? null,
          sent: emailStatus === "SENT",
        });
      } catch (error) {
        await safeLog(pool, {
          templateId: tpl.id,
          invoice: input.invoice ?? null,
          orderId: input.orderId ?? null,
          sessionId: input.sessionId ?? null,
          recipient,
          channel: "EMAIL",
          requestPayload: html,
          responsePayload: null,
          status: "FAILED",
          errorMessage: error instanceof Error ? error.message : "Gagal mengirim",
          sent: false,
        });
      }
    }
    for (const tpl of rows) {
      if (!isWhatsApp(String(tpl.channel))) continue;
      try {
        const message = htmlToText(fillPlaceholders(String(tpl.message_content), input.values));
        const recipient = input.phone?.trim() || "";
        if (!recipient) {
          await safeLog(pool, {
            templateId: tpl.id,
            invoice: input.invoice ?? null,
            orderId: input.orderId ?? null,
            sessionId: input.sessionId ?? null,
            recipient: "-",
            channel: String(tpl.channel),
            requestPayload: message,
            responsePayload: null,
            status: "FAILED",
            errorMessage: "Nomor WhatsApp kosong",
            sent: false,
          });
          continue;
        }
        const result = await sendFonnte({ target: recipient, message, fileUrl: input.fileUrl });
        await safeLog(pool, {
          templateId: tpl.id,
          invoice: input.invoice ?? null,
          orderId: input.orderId ?? null,
          sessionId: input.sessionId ?? null,
          recipient,
          channel: String(tpl.channel),
          requestPayload: message,
          responsePayload: JSON.stringify(result.response ?? {}),
          status: result.ok ? "SENT" : "FAILED",
          errorMessage: result.error,
          sent: result.ok,
        });
      } catch (error) {
        console.error("[whatsapp]", error);
        await safeLog(pool, {
          templateId: tpl.id,
          invoice: input.invoice ?? null,
          orderId: input.orderId ?? null,
          sessionId: input.sessionId ?? null,
          recipient: input.phone ?? "-",
          channel: String(tpl.channel),
          requestPayload: input.event,
          responsePayload: null,
          status: "FAILED",
          errorMessage: error instanceof Error ? error.message : "WhatsApp gagal",
          sent: false,
        });
      }
    }
  });
}
