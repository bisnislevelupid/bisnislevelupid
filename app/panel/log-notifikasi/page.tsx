import type { CSSProperties } from "react";
import Link from "next/link";
import { listNotificationLogs } from "@/lib/admin/managed";
import { statusColor, statusText } from "@/lib/admin/format";
import { codeLabel } from "@/lib/admin/labels";
import { maskRecipient } from "@/lib/admin/redact";
import { formatWib } from "@/lib/portal/labels";

export const dynamic = "force-dynamic";

export default async function LogNotifikasiPage() {
  const rows = await listNotificationLogs();
  return (
    <div>
      <h1 style={{ fontSize: "1.5rem", fontWeight: 800 }}>Log notifikasi</h1>
      <p style={{ color: "#64748b", marginBottom: 16 }}>Riwayat kirim. Tidak bisa ditambah, diubah, atau dihapus.</p>
      <div className="panel-as-cards" style={card}>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr>{["Penerima", "Kanal", "Event", "Status", "Invoice", "Waktu", ""].map((head) => <th key={head} style={th}>{head || "Aksi"}</th>)}</tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr><td data-label="" style={td} colSpan={7}>Belum ada catatan notifikasi.</td></tr>
            ) : rows.map((row) => (
              <tr key={String(row.id)}>
                <td data-label="Penerima" style={td}>{maskRecipient(String(row.recipient ?? ""))}</td>
                <td data-label="Kanal" style={td}>{String(row.channel)}</td>
                <td data-label="Event" style={td}>{codeLabel(String(row.event_trigger ?? ""))}</td>
                <td data-label="Status" style={td}>
                  <span style={{ background: statusColor(String(row.status ?? "")), color: "#fff", borderRadius: 999, padding: "3px 10px", fontSize: "0.72rem", fontWeight: 700 }}>
                    {statusText(String(row.status ?? ""))}
                  </span>
                </td>
                <td data-label="Invoice" style={td}><span>{String(row.invoice_code ?? "—")}</span></td>
                <td data-label="Waktu" style={td}>{formatWib(row.created_at as string | null) || "—"}</td>
                <td data-label="Aksi" style={td}>
                  <Link href={`/panel/log-notifikasi/${row.id}`} style={{ color: "#059669", fontWeight: 700 }}>Detail</Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

const card: CSSProperties = { background: "#fff", border: "1px solid #e2e8f0", borderRadius: 16, overflow: "auto" };
const th: CSSProperties = { textAlign: "left", padding: 12, color: "#64748b", borderBottom: "1px solid #e2e8f0" };
const td: CSSProperties = { padding: 12, borderBottom: "1px solid #f1f5f9" };
