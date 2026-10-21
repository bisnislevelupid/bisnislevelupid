"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import type { OwnedAudit } from "@/lib/db/portal";

export function StartAuditForm({
  options,
  defaults,
}: {
  options: OwnedAudit[];
  defaults: { name: string; company: string; field: string; year: number | null };
}) {
  const router = useRouter();
  const pending = options.filter((item) => item.session?.status !== "COMPLETED");
  const [auditCode, setAuditCode] = useState(pending[0]?.code ?? "");
  const [error, setError] = useState("");
  const [pendingSubmit, setPendingSubmit] = useState(false);
  const selected = pending.find((item) => item.code === auditCode) ?? pending[0];

  async function onSubmit(formData: FormData) {
    if (!selected) return;
    setPendingSubmit(true);
    setError("");
    const response = await fetch("/api/akun/sesi", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        auditCode: selected.code,
        orderId: selected.orderId,
        respondentName: formData.get("respondentName"),
        companyName: formData.get("companyName"),
        businessField: formData.get("businessField"),
        businessStartYear: formData.get("businessStartYear"),
        externalAuditorName: formData.get("externalAuditorName"),
      }),
    });
    const payload = await response.json();
    setPendingSubmit(false);
    if (!response.ok) {
      setError(payload.error ?? "Gagal membuka sesi");
      return;
    }
    router.push(`/akun/audit?sesi=${payload.data.sessionId}`);
    router.refresh();
  }

  if (!options.length) {
    return (
      <p>
        Belum ada instrumen yang lunas. Selesaikan pembayaran dulu, lalu kembali ke halaman ini.
      </p>
    );
  }
  if (!selected) return <p>Semua instrumen yang Anda miliki sudah selesai.</p>;

  return (
    <form
      onSubmit={(event) => {
        event.preventDefault();
        void onSubmit(new FormData(event.currentTarget));
      }}
      style={{ display: "grid", gap: 12, maxWidth: 520 }}
    >
      {pending.length > 1 ? (
        <label style={{ display: "grid", gap: 6, fontWeight: 700 }}>
          Instrumen
          <select name="audit" value={auditCode} onChange={(event) => setAuditCode(event.target.value)} style={fieldStyle}>
            {pending.map((item) => (
              <option key={item.code} value={item.code}>
                {item.name}
              </option>
            ))}
          </select>
        </label>
      ) : (
        <p style={{ margin: 0, fontWeight: 800 }}>{selected.name}</p>
      )}
      <label style={{ display: "grid", gap: 6, fontWeight: 700 }}>
        Nama pengisi
        <input name="respondentName" required defaultValue={defaults.name} style={fieldStyle} />
      </label>
      <label style={{ display: "grid", gap: 6, fontWeight: 700 }}>
        Nama perusahaan
        <input name="companyName" required defaultValue={defaults.company} style={fieldStyle} />
      </label>
      <label style={{ display: "grid", gap: 6, fontWeight: 700 }}>
        Bidang bisnis
        <input name="businessField" required defaultValue={defaults.field} style={fieldStyle} />
      </label>
      <label style={{ display: "grid", gap: 6, fontWeight: 700 }}>
        Tahun mulai bisnis
        <input name="businessStartYear" required type="number" min={1970} max={new Date().getFullYear()} defaultValue={defaults.year ?? 2018} style={fieldStyle} />
      </label>
      <label style={{ display: "grid", gap: 6, fontWeight: 700 }}>
        Penilai eksternal (opsional)
        <input name="externalAuditorName" style={fieldStyle} />
      </label>
      {error ? <p style={{ color: "#dc2626", margin: 0 }}>{error}</p> : null}
      <button disabled={pendingSubmit} style={{ height: 48, border: 0, borderRadius: 999, background: "#059669", color: "#fff", fontWeight: 800 }}>
        {pendingSubmit ? "Membuka sesi..." : "Mulai mengerjakan"}
      </button>
    </form>
  );
}

const fieldStyle = { height: 48, borderRadius: 12, border: "1px solid #e2e8f0", padding: "0 12px", font: "inherit" };
