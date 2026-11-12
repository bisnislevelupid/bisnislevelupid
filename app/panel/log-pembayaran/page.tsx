import type { CSSProperties } from "react";
import Link from "next/link";
import { listPaymentLogs } from "@/lib/admin/managed";
import { codeLabel } from "@/lib/admin/labels";
import { formatWib } from "@/lib/portal/labels";

export const dynamic = "force-dynamic";

export default async function LogPembayaranPage() {
  const rows = await listPaymentLogs();
  return (
    <div>
      <h1 style={{ fontSize: "1.5rem", fontWeight: 800 }}>Log pembayaran</h1>
      <p style={{ color: "#64748b", marginBottom: 16 }}>Catatan dari webhook dan aksi panel. Tidak bisa ditambah, diubah, atau dihapus.</p>
      <div className="panel-as-cards" style={card}>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr>{["Invoice", "Endpoint", "Tipe", "HTTP", "Waktu", ""].map((head) => <th key={head} style={th}>{head || "Aksi"}</th>)}</tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr><td data-label="" style={td} colSpan={6}>Belum ada catatan pembayaran.</td></tr>
            ) : rows.map((row) => (
              <tr key={String(row.id)}>
                <td data-label="Invoice" style={td}><span>{String(row.invoice_code ?? "—")}</span></td>
                <td data-label="Endpoint" style={td}><span>{String(row.endpoint ?? "—")}</span></td>
                <td data-label="Tipe" style={td}>{codeLabel(String(row.type ?? ""))}</td>
                <td data-label="HTTP" style={td}>{String(row.http_status ?? "—")}</td>
                <td data-label="Waktu" style={td}>{formatWib(row.created_at as string | null) || "—"}</td>
                <td data-label="Aksi" style={td}>
                  <Link href={`/panel/log-pembayaran/${row.id}`} style={{ color: "#059669", fontWeight: 700 }}>Detail</Link>
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
