import type { CSSProperties } from "react";
import Link from "next/link";
import { listTemplates } from "@/lib/admin/managed";
import { codeLabel } from "@/lib/admin/labels";
import { DeleteButton } from "../_components/delete-button";

export const dynamic = "force-dynamic";

export default async function TemplatePage() {
  const rows = await listTemplates();
  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
        <div>
          <h1 style={{ fontSize: "1.5rem", fontWeight: 800 }}>Template notifikasi</h1>
          <p style={{ color: "#64748b" }}>Pesan email atau kanal lain per event.</p>
        </div>
        <Link href="/panel/template-notifikasi/baru" style={add}>Tambah template</Link>
      </div>
      <div style={card}>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr>{["Event", "Kanal", "Subjek", "Aktif", ""].map((head) => <th key={head} style={th}>{head}</th>)}</tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={String(row.id)}>
                <td style={td}>{codeLabel(String(row.event_trigger ?? ""))}</td>
                <td style={td}>{String(row.channel)}</td>
                <td style={td}>{String(row.subject ?? "—")}</td>
                <td style={td}>{row.is_active ? "Ya" : "Tidak"}</td>
                <td style={td}>
                  <Link href={`/panel/template-notifikasi/${row.id}`} style={{ marginRight: 8, color: "#059669", fontWeight: 700 }}>Ubah</Link>
                  <DeleteButton url={`/api/panel/managed/notification-templates/${row.id}`} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

const add: CSSProperties = { background: "#059669", color: "#fff", borderRadius: 999, padding: "8px 14px", fontWeight: 700 };
const card: CSSProperties = { background: "#fff", border: "1px solid #e2e8f0", borderRadius: 16, overflow: "auto" };
const th: CSSProperties = { textAlign: "left", padding: 12, color: "#64748b", borderBottom: "1px solid #e2e8f0" };
const td: CSSProperties = { padding: 12, borderBottom: "1px solid #f1f5f9" };
