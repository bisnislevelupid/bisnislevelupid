import type { CSSProperties } from "react";
import Link from "next/link";
import { listAdmins } from "@/lib/admin/managed";
import { DeleteButton } from "../_components/delete-button";

export const dynamic = "force-dynamic";

export default async function PenggunaPage() {
  const rows = await listAdmins();
  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
        <div>
          <h1 style={{ fontSize: "1.5rem", fontWeight: 800 }}>Pengguna panel</h1>
          <p style={{ color: "#64748b" }}>Email Google yang boleh masuk. Hanya role SUPERADMIN yang membuka panel.</p>
        </div>
        <Link href="/panel/pengguna/baru" style={add}>Tambah pengguna</Link>
      </div>
      <div style={card}>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.9rem" }}>
          <thead>
            <tr>{["Nama", "Email", "Role", "Status", ""].map((head) => <th key={head} style={th}>{head}</th>)}</tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={String(row.id)}>
                <td style={td}>{String(row.name)}</td>
                <td style={td}>{String(row.email)}</td>
                <td style={td}>{String(row.role)}</td>
                <td style={td}>{String(row.status)}</td>
                <td style={td}>
                  <Link href={`/panel/pengguna/${row.id}`} style={{ marginRight: 8, color: "#059669", fontWeight: 700 }}>Ubah</Link>
                  <DeleteButton url={`/api/panel/managed/admins/${row.id}`} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

const add: React.CSSProperties = { background: "#059669", color: "#fff", borderRadius: 999, padding: "8px 14px", fontWeight: 700 };
const card: React.CSSProperties = { background: "#fff", border: "1px solid #e2e8f0", borderRadius: 16, overflow: "auto" };
const th: React.CSSProperties = { textAlign: "left", padding: 12, color: "#64748b", borderBottom: "1px solid #e2e8f0" };
const td: React.CSSProperties = { padding: 12, borderBottom: "1px solid #f1f5f9" };
