"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function ApproveSectionButton({ id, status }: { id: string; status: string }) {
  const router = useRouter();
  const [current, setCurrent] = useState(status);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");

  if (current === "APPROVED") return <span style={{ color: "#047857", fontWeight: 700 }}>Disetujui</span>;

  async function approve() {
    if (pending) return;
    setPending(true);
    setError("");
    try {
      const res = await fetch(`/api/panel/narasi-seksi/${id}`, { method: "POST" });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(typeof json.error === "string" ? json.error : "Gagal");
        return;
      }
      setCurrent("APPROVED");
      router.refresh();
    } catch {
      setError("Gagal");
    } finally {
      setPending(false);
    }
  }

  return (
    <span>
      <button
        type="button"
        onClick={approve}
        disabled={pending}
        style={{ background: "#059669", color: "#fff", border: 0, borderRadius: 999, padding: "6px 12px", fontWeight: 700 }}
      >
        {pending ? "Menyetujui..." : "Setujui"}
      </button>
      {error ? <span style={{ color: "#b91c1c", marginLeft: 8 }}>{error}</span> : null}
    </span>
  );
}
