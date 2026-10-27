import type { CSSProperties } from "react";
import { listSectionNarratives } from "@/lib/db/section-narratives";
import { ApproveSectionButton } from "./approve-button";

export const dynamic = "force-dynamic";

export default async function NarasiSeksiPage() {
  const rows = await listSectionNarratives();
  return (
    <div>
      <div style={{ marginBottom: 16 }}>
        <h1 style={{ fontSize: "1.5rem", fontWeight: 800 }}>Narasi seksi</h1>
        <p style={{ color: "#64748b" }}>
          Semua narasi berstatus draf dan tetap masuk PDF. Setujui satu seksi bila teksnya sudah final.
        </p>
      </div>
      <div style={card}>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr>
              {["Audit", "Seksi", "Nama", "Status", ""].map((head) => (
                <th key={head} style={th}>
                  {head}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.id}>
                <td style={td}>{row.audit_code}</td>
                <td style={td}>{row.section_code}</td>
                <td style={td}>{row.section_name ?? "—"}</td>
                <td style={td}>{row.content_status}</td>
                <td style={td}>
                  <ApproveSectionButton id={row.id} status={row.content_status} />
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
