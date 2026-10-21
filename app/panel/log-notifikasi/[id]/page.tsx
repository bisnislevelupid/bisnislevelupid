import type { CSSProperties } from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getNotificationLog } from "@/lib/admin/managed";

export const dynamic = "force-dynamic";

export default async function LogNotifikasiDetail({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const row = await getNotificationLog(id);
  if (!row) notFound();
  return (
    <div>
      <Link href="/panel/log-notifikasi" style={{ color: "#059669", fontWeight: 700 }}>← Log notifikasi</Link>
      <h1 style={{ fontSize: "1.4rem", fontWeight: 800, margin: "8px 0 16px" }}>{String(row.recipient)}</h1>
      <p>
        {String(row.channel)} · {String(row.status)}
        {row.error_message ? ` · ${String(row.error_message)}` : ""}
      </p>
      <h2 style={{ marginTop: 16 }}>Request</h2>
      <pre style={pre}>{String(row.request_payload ?? "")}</pre>
      <h2>Response</h2>
      <pre style={pre}>{String(row.response_payload ?? "")}</pre>
    </div>
  );
}

const pre: CSSProperties = { whiteSpace: "pre-wrap", background: "#0f172a", color: "#e2e8f0", borderRadius: 12, padding: 16, overflow: "auto" };
