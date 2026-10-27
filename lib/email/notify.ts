import { put } from "@vercel/blob";
import { withPool } from "@/lib/db";
import { provisionPaidSessionsByInvoice } from "@/lib/db/orders";
import { dispatchTemplate } from "@/lib/email/send";
import { fillPlaceholders, rupiah } from "@/lib/email/html";
import { rememberPdf } from "@/lib/db/portal";
import { getReportDocument, getSupportWhatsapp } from "@/lib/db/report";
import { buildReportPdf } from "@/lib/pdf/report";
import { lookupAuditNames } from "@/lib/db/public";
import { formatAuditScore } from "@/lib/pdf/format";
import { buildReportCtas, ctaEmailHtml, ctaPlainText } from "@/lib/portal/ctas";
import { codesFromUnlocked, formatWib, statusLabel } from "@/lib/portal/labels";

const CHECKOUT_TYPES = new Set(["bank_transfer", "va", "retail_outlet"]);

function formatWhen(value: string | Date | null) {
  return formatWib(value) || "-";
}

export async function instructionHtml(order: {
  payment_method_id?: string;
  methodId?: string;
  va_number: string | null;
  payment_code: string | null;
  account_number: string | null;
  account_holder: string | null;
  total_amount: string;
  method_name: string | null;
}) {
  const methodId = order.methodId ?? order.payment_method_id;
  return withPool(async (pool) => {
    const { rows } = await pool.query(
      `SELECT title, content FROM payment_instructions WHERE payment_method_id = $1 ORDER BY sort_order, id`,
      [methodId],
    );
    const values = {
      va: order.va_number || "nomor VA di halaman pembayaran",
      kode: order.payment_code || "kode bayar di halaman pembayaran",
      rekening: order.account_number || "-",
      atas_nama: order.account_holder || "BisnisLevelUp.id",
      nominal: rupiah(order.total_amount),
      metode: order.method_name || "",
    };
    return rows
      .map((row) => `<h3>${row.title}</h3>${fillPlaceholders(String(row.content), values)}`)
      .join("");
  });
}

async function loadOrder(invoice: string) {
  return withPool(async (pool) => {
    const { rows } = await pool.query(
      `SELECT o.id::text, o.invoice_code, o.customer_name, o.customer_email, o.customer_phone, o.total_amount::text,
              o.va_number, o.payment_code, o.expired_at, o.payment_method_id::text,
              m.name AS method_name, m.type AS method_type, m.account_number, m.account_holder,
              (SELECT product_name FROM order_items WHERE order_id = o.id ORDER BY id LIMIT 1) AS product_name,
              (SELECT string_agg(audit_ids_unlocked, ',') FROM order_items WHERE order_id = o.id) AS audit_ids
       FROM orders o
       LEFT JOIN payment_methods m ON m.id = o.payment_method_id
       WHERE o.invoice_code = $1`,
      [invoice],
    );
    if (!rows[0]) return undefined;
    const order = rows[0] as {
      id: string;
      invoice_code: string;
      customer_name: string | null;
      customer_email: string | null;
      customer_phone: string | null;
      total_amount: string;
      va_number: string | null;
      payment_code: string | null;
      expired_at: string | null;
      payment_method_id: string;
      method_name: string | null;
      method_type: string | null;
      account_number: string | null;
      account_holder: string | null;
      product_name: string | null;
      audit_ids: string | null;
    };
    const names = await lookupAuditNames(pool, codesFromUnlocked(order.audit_ids));
    return { ...order, audit_label: names.join(", ") };
  });
}

function productLine(name: string | null, audit: string | undefined) {
  if (name && audit) return `${name} — ${audit}`;
  return name || audit || "";
}

export async function notifyOrderCreated(invoice: string, origin: string) {
  const order = await loadOrder(invoice);
  if (!order || !CHECKOUT_TYPES.has(order.method_type ?? "")) return;
  const instruksi = await instructionHtml(order);
  await dispatchTemplate({
    event: "ORDER_CREATED",
    to: order.customer_email,
    phone: order.customer_phone,
    invoice: order.invoice_code,
    orderId: order.id,
    values: {
      nama: order.customer_name ?? "",
      invoice: order.invoice_code,
      produk: productLine(order.product_name, order.audit_label),
      instrumen: order.audit_label || "-",
      nominal: rupiah(order.total_amount),
      metode: order.method_name ?? "",
      batas: formatWhen(order.expired_at),
      instruksi,
      dashboard_url: `${origin}/akun`,
      bayar_url: `${origin}/bayar/${order.invoice_code}`,
    },
  });
}

export async function notifyOrderPaid(invoice: string, origin: string) {
  await provisionPaidSessionsByInvoice(invoice);
  const order = await loadOrder(invoice);
  if (!order) return;
  await dispatchTemplate({
    event: "ORDER_PAID",
    to: order.customer_email,
    phone: order.customer_phone,
    invoice: order.invoice_code,
    orderId: order.id,
    values: {
      nama: order.customer_name ?? "",
      invoice: order.invoice_code,
      produk: productLine(order.product_name, order.audit_label),
      instrumen: order.audit_label || "-",
      nominal: rupiah(order.total_amount),
      metode: order.method_name ?? "",
      dashboard_url: `${origin}/akun`,
    },
  });
}

export async function notifyTestResult(customerId: string, sessionId: string, origin: string) {
  const report = await getReportDocument(customerId, sessionId, { origin });
  if (!report) return;
  const contact = await withPool(async (pool) => {
    const { rows } = await pool.query(
      `SELECT c.email, c.name, c.phone FROM customers c WHERE c.id = $1`,
      [customerId],
    );
    return rows[0] as { email: string; name: string; phone: string | null } | undefined;
  });
  const pdf = await buildReportPdf(report);
  const downloadUrl = `${origin}/api/akun/laporan/${sessionId}/pdf`;
  let publicUrl: string | null = null;
  if (process.env.BLOB_READ_WRITE_TOKEN) {
    try {
      const stored = await put(`laporan/${sessionId}.pdf`, pdf, {
        access: "public",
        contentType: "application/pdf",
        addRandomSuffix: false,
        allowOverwrite: true,
      });
      publicUrl = stored.url;
      try {
        await rememberPdf(sessionId, stored.url);
      } catch (error) {
        console.error("[pdf blob remember]", error);
      }
    } catch (error) {
      console.error("[pdf blob]", error);
    }
  }
  const label = statusLabel(report.status);
  let whatsapp: string | null = null;
  try {
    whatsapp = await getSupportWhatsapp();
  } catch (error) {
    console.error("[support whatsapp]", error);
  }
  const ctas = buildReportCtas({ status: report.status, auditCode: report.auditCode, origin, whatsapp });
  try {
    await dispatchTemplate({
      event: "TEST_RESULT",
      to: contact?.email ?? null,
      phone: contact?.phone ?? null,
      fileUrl: publicUrl,
      sessionId,
      values: {
        nama: contact?.name ?? report.respondent ?? "",
        audit_name: report.auditName,
        skor: formatAuditScore(report.score, report.status),
        selesai: formatWib(report.completedAt) || "-",
        status: label.title,
        status_arti: label.meaning,
        narasi_judul: report.narrative?.headline ?? label.title,
        pdf_url: downloadUrl,
        dashboard_url: `${origin}/akun/laporan?sesi=${sessionId}`,
        cta_html: ctaEmailHtml(ctas.items),
        cta_text: ctaPlainText(ctas.items),
      },
      attachments: [{ filename: `laporan-${sessionId}.pdf`, content: pdf }],
    });
  } catch (error) {
    console.error("[test result notify]", error);
  }
}

export function siteOrigin(fallback?: string | null) {
  if (fallback) return fallback.replace(/\/$/, "");
  const domain = process.env.RESEND_EMAIL_DOMAIN || "bisnislevelup.id";
  return `https://${domain}`;
}
