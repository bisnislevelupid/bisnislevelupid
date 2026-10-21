import type { CSSProperties } from "react";
import Link from "next/link";
import { listMethods } from "@/lib/admin/managed";
import { MethodOrder } from "./method-order";

export const dynamic = "force-dynamic";

export default async function MetodeBayarPage() {
  const rows = await listMethods();
  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
        <div>
          <h1 style={{ fontSize: "1.5rem", fontWeight: 800 }}>Metode bayar</h1>
          <p style={{ color: "#64748b" }}>Geser urutan metode. Urutan yang sama dipakai di form checkout. Instruksi diubah di dalam tiap metode.</p>
        </div>
        <Link href="/panel/metode-bayar/baru" style={add}>Tambah metode</Link>
      </div>
      <div style={card}>
        <div style={{ display: "grid", gridTemplateColumns: "28px 1.4fr .8fr .8fr .6fr .5fr auto", gap: 8, padding: "12px 14px", color: "#64748b", fontSize: "0.8rem" }}>
          <span />
          <span>Nama</span>
          <span>Kode</span>
          <span>Tipe</span>
          <span>Instruksi</span>
          <span>Status</span>
          <span />
        </div>
        <MethodOrder
          rows={rows.map((row) => ({
            id: String(row.id),
            name: String(row.name),
            code: String(row.code),
            type: String(row.type),
            instruction_count: Number(row.instruction_count),
            is_active: Boolean(row.is_active),
          }))}
        />
      </div>
    </div>
  );
}

const add: CSSProperties = { background: "#059669", color: "#fff", borderRadius: 999, padding: "8px 14px", fontWeight: 700 };
const card: CSSProperties = { background: "#fff", border: "1px solid #e2e8f0", borderRadius: 16, overflow: "auto" };
