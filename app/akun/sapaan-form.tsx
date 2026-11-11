"use client";

import { useState, type FormEvent } from "react";

export function SapaanForm({ initial }: { initial: string }) {
  const [value, setValue] = useState(initial);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (pending) return;
    setPending(true);
    setMessage("");
    setError("");
    try {
      const res = await fetch("/api/akun/profil", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ namaSapaan: value.trim() }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(typeof json.error === "string" ? json.error : "Gagal menyimpan");
        return;
      }
      const saved = typeof json.data?.namaSapaan === "string" ? json.data.namaSapaan : value.trim();
      setValue(saved);
      setMessage(saved ? `Laporan dan email akan menyapa ${saved}.` : "Laporan dan email akan menyapa Anda.");
    } catch {
      setError("Gagal menyimpan. Periksa koneksi lalu coba lagi.");
    } finally {
      setPending(false);
    }
  }

  return (
    <form onSubmit={onSubmit} style={{ background: "#fff", border: "1px solid #e2e8f0", borderRadius: 24, padding: 20 }}>
      <h2 style={{ marginTop: 0 }}>Nama sapaan</h2>
      <p style={{ color: "#64748b", marginTop: 0 }}>
        Opsional. Contoh Pak Irvan. Kosong berarti laporan dan email menyapa Anda.
      </p>
      <label style={{ display: "block", fontWeight: 700 }}>
        Sapaan
        <input
          name="namaSapaan"
          value={value}
          maxLength={80}
          onChange={(event) => setValue(event.target.value)}
          style={{ display: "block", width: "100%", marginTop: 8, border: "1px solid #cbd5e1", borderRadius: 12, padding: "12px 14px" }}
        />
      </label>
      <button
        type="submit"
        disabled={pending}
        style={{ marginTop: 12, background: "#059669", color: "#fff", border: 0, borderRadius: 999, padding: "10px 16px", fontWeight: 800 }}
      >
        {pending ? "Menyimpan..." : "Simpan sapaan"}
      </button>
      {message ? <p style={{ color: "#047857" }}>{message}</p> : null}
      {error ? <p style={{ color: "#b91c1c" }}>{error}</p> : null}
    </form>
  );
}
