"use client";

import { useState, type CSSProperties } from "react";
import { createPortal } from "react-dom";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

export function RejectOrderButton({ orderId, invoice }: { orderId: string; invoice: string }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState("");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");

  async function reject() {
    if (pending) return;
    const note = reason.trim();
    if (note.length < 3) {
      setError("Isi alasan pembatalan, minimal 3 karakter.");
      return;
    }
    setPending(true);
    setError("");
    const res = await fetch(`/api/panel/orders/${encodeURIComponent(orderId)}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "cancel", reason: note }),
    });
    const json = await res.json().catch(() => ({}));
    setPending(false);
    if (!res.ok) {
      setError(json.error ?? "Gagal membatalkan pesanan");
      return;
    }
    toast.success(`${invoice} dibatalkan`);
    setOpen(false);
    router.refresh();
  }

  return (
    <>
      <button type="button" disabled={pending} onClick={() => { setError(""); setOpen(true); }} style={danger}>
        Tolak/Batalkan
      </button>
      {open ? createPortal(
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="reject-order-title"
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 80,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: 16,
            background: "rgba(15,23,42,.28)",
            backdropFilter: "blur(8px)",
          }}
        >
          <div style={{ width: "min(460px, 100%)", background: "#fff", borderRadius: 16, padding: 24, boxShadow: "0 20px 50px rgba(15,23,42,.18)" }}>
            <h2 id="reject-order-title" style={{ margin: 0, fontSize: "1.15rem" }}>Tolak/batalkan {invoice}?</h2>
            <p style={{ color: "#475569", margin: "8px 0 12px" }}>
              Status menjadi dibatalkan. Hanya untuk transfer bank manual yang belum lunas. Pembayaran di gateway tidak diubah.
            </p>
            <label htmlFor="reject-reason" style={{ display: "block", fontWeight: 700, fontSize: "0.9rem" }}>
              Alasan
              <textarea
                id="reject-reason"
                value={reason}
                onChange={(event) => setReason(event.target.value)}
                maxLength={500}
                rows={4}
                autoFocus
                style={{ display: "block", width: "100%", marginTop: 6, border: "1px solid #e2e8f0", borderRadius: 10, padding: 10, font: "inherit" }}
                placeholder="Contoh: nominal tidak sesuai atau bukti tidak terbaca"
              />
            </label>
            {error ? <p role="alert" style={{ color: "#b91c1c", margin: "8px 0 0" }}>{error}</p> : null}
            <div style={{ display: "flex", justifyContent: "flex-end", gap: 8, marginTop: 16 }}>
              <button type="button" onClick={() => setOpen(false)} style={ghost} disabled={pending}>Batal</button>
              <button type="button" onClick={() => void reject()} style={danger} disabled={pending}>
                {pending ? "Memproses..." : "Ya, batalkan"}
              </button>
            </div>
          </div>
        </div>,
        document.body,
      ) : null}
    </>
  );
}

const danger: CSSProperties = { border: "none", background: "#b91c1c", color: "#fff", borderRadius: 999, padding: "8px 14px", fontWeight: 700, cursor: "pointer" };
const ghost: CSSProperties = { border: "1px solid #e2e8f0", background: "#fff", color: "#0f172a", borderRadius: 999, padding: "8px 14px", fontWeight: 700, cursor: "pointer" };
