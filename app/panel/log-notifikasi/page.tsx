import type { CSSProperties } from "react";
import Link from "next/link";
import { listNotificationLogs } from "@/lib/admin/managed";
import { DeleteButton } from "../_components/delete-button";

export const dynamic = "force-dynamic";

export default async function LogNotifikasiPage() {
  const rows = await listNotificationLogs();
  return (
    <div>
      <h1 style={{ fontSize: "1.5rem", fontWeight: 800 }}>Log notifikasi</h1>
      <p style={{ color: "#64748b", marginBottom: 16 }}>Riwayat kirim. Tidak bisa dibuat manual.</p>
      <div style={card}>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr>{["Penerima", "Kanal", "Status", "Invoice", "Waktu", ""].map((head) => <th key={head} style={th}>{head}</th>)}</tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={String(row.id)}>
                <td style={td}>{String(row.recipient)}</td>
                <td style={td}>{String(row.channel)}</td>
                <td style={td}>{String(row.status)}</td>
                <td style={td}>{String(row.invoice_code ?? "—")}</td>
                <td style={td}>{row.created_at ? new Date(String(row.created_at)).toLocaleString("id-ID") : "—"}</td>
                <td style={td}>
                  <Link href={`/panel/log-notifikasi/${row.id}`} style={{ marginRight: 8, color: "#059669", fontWeight: 700 }}>Detail</Link>
                  <DeleteButton url={`/api/panel/notification_logs/${row.id}`} />
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
