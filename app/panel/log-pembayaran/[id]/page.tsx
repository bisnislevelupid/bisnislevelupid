import type { CSSProperties } from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { maskEmail, maskPaymentPayload, maskPhone } from "@/lib/admin/redact";
import { statusText } from "@/lib/admin/format";
import { getPaymentLogDetail } from "@/lib/db/payment-logs";
import { formatWib } from "@/lib/portal/labels";

export const dynamic = "force-dynamic";

export default async function LogPembayaranDetail({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const row = await getPaymentLogDetail(id);
  if (!row) notFound();
  const email = row.customer_email ? maskEmail(String(row.customer_email)) : "—";
  const phone = row.customer_phone ? maskPhone(String(row.customer_phone)) : "—";
  return (
    <div>
      <Link href="/panel/log-pembayaran" style={{ color: "#059669", fontWeight: 700 }}>← Log pembayaran</Link>
      <h1 style={{ fontSize: "1.4rem", fontWeight: 800, margin: "8px 0 16px" }}>{String(row.invoice_code ?? row.id)}</h1>
      <p>Endpoint: {String(row.endpoint ?? "—")} · Tipe: {statusText(String(row.type ?? ""))} · HTTP {String(row.http_status ?? "—")}</p>
      <p style={{ color: "#64748b" }}>{formatWib(row.created_at as string | null) || "—"}</p>
      <p>Email customer: {email} · Telepon: {phone}</p>
      <p style={{ color: "#64748b", fontSize: "0.85rem" }}>Email, telepon, token Snap, dan URL redirect ditampilkan tersamar.</p>
      <h2 style={{ marginTop: 16 }}>Request</h2>
      <pre style={pre}>{maskPaymentPayload(row.request_payload)}</pre>
      <h2>Response</h2>
      <pre style={pre}>{maskPaymentPayload(row.response_payload)}</pre>
    </div>
  );
}

const pre: CSSProperties = { whiteSpace: "pre-wrap", background: "#0f172a", color: "#e2e8f0", borderRadius: 12, padding: 16, overflow: "auto" };
