import type { CSSProperties } from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { statusText } from "@/lib/admin/format";
import { getNotificationLogDetail, notificationProvider } from "@/lib/db/notification-logs";
import { formatWib } from "@/lib/portal/labels";

export const dynamic = "force-dynamic";

function pretty(raw: unknown) {
  if (raw == null || raw === "") return "—";
  const text = String(raw);
  try {
    return JSON.stringify(JSON.parse(text), null, 2);
  } catch {
    return text;
  }
}

export default async function LogNotifikasiDetail({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const row = await getNotificationLogDetail(id);
  if (!row) notFound();
  const channel = String(row.channel ?? "");
  const error = row.error_message ? String(row.error_message) : "";
  return (
    <div>
      <Link href="/panel/log-notifikasi" style={{ color: "#059669", fontWeight: 700 }}>← Log notifikasi</Link>
      <h1 style={{ fontSize: "1.4rem", fontWeight: 800, margin: "8px 0 16px" }}>{String(row.recipient)}</h1>
      <dl style={{ display: "grid", gridTemplateColumns: "160px 1fr", gap: "8px 12px", margin: "0 0 16px" }}>
        <dt style={dt}>Provider</dt>
        <dd style={dd}>{notificationProvider(channel)}</dd>
        <dt style={dt}>Kanal</dt>
        <dd style={dd}>{channel || "—"}</dd>
        <dt style={dt}>Template / event</dt>
        <dd style={dd}>{String(row.event_trigger ?? "—")}{row.subject ? ` · ${String(row.subject)}` : ""}</dd>
        <dt style={dt}>Status</dt>
        <dd style={dd}>{statusText(String(row.status ?? ""))}</dd>
        <dt style={dt}>Invoice</dt>
        <dd style={dd}>{String(row.invoice_code ?? "—")}</dd>
        <dt style={dt}>Waktu</dt>
        <dd style={dd}>Dibuat {formatWib(row.created_at as string | null) || "—"} · Terkirim {formatWib(row.sent_at as string | null) || "—"}</dd>
      </dl>
      {error ? (
        <p role="alert" style={{ background: "#fef2f2", color: "#991b1b", border: "1px solid #fecaca", borderRadius: 12, padding: "12px 14px", whiteSpace: "pre-wrap" }}>
          <strong>Error. </strong>{error}
        </p>
      ) : null}
      <h2 style={{ marginTop: 16 }}>Request</h2>
      <pre style={pre}>{pretty(row.request_payload)}</pre>
      <h2>Response body</h2>
      <pre style={pre}>{pretty(row.response_payload)}</pre>
    </div>
  );
}

const dt: CSSProperties = { color: "#64748b", fontWeight: 700 };
const dd: CSSProperties = { margin: 0 };
const pre: CSSProperties = { whiteSpace: "pre-wrap", background: "#0f172a", color: "#e2e8f0", borderRadius: 12, padding: 16, overflow: "auto" };
