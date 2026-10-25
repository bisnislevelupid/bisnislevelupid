"use client";

import { useState, type CSSProperties } from "react";
import { createPortal } from "react-dom";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

export function MarkPaidButton({ orderId, invoice }: { orderId: string; invoice: string }) {
  const router = useRouter();
  const [pending, setPending] = useState(false);

  async function markPaid(id: string | number) {
    if (pending) return;
    setPending(true);
    const res = await fetch(`/api/panel/orders/${encodeURIComponent(orderId)}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: "PAID" }),
    });
    const json = await res.json().catch(() => ({}));
    setPending(false);
    toast.dismiss(id);
    if (!res.ok) {
      toast.error(json.error ?? "Gagal menandai lunas");
      return;
    }
    toast.success(`${invoice} ditandai lunas`);
    router.refresh();
  }

  function ask() {
    toast.custom(
      (id) =>
        createPortal(
          <>
          <style>{`[data-sonner-toast][data-styled="false"]{background:transparent!important;border:0!important;box-shadow:none!important;padding:0!important;width:0!important;min-height:0!important;height:0!important}`}</style>
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="mark-paid-title"
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
            <div style={{ width: "min(420px, 100%)", background: "#fff", borderRadius: 16, padding: 24, boxShadow: "0 20px 50px rgba(15,23,42,.18)" }}>
              <h2 id="mark-paid-title" style={{ margin: 0, fontSize: "1.15rem" }}>Tandai {invoice} sebagai lunas?</h2>
              <p style={{ color: "#475569", margin: "8px 0 18px" }}>Status menjadi PAID dan email konfirmasi pembayaran dikirim.</p>
              <div style={{ display: "flex", justifyContent: "flex-end", gap: 8 }}>
                <button type="button" onClick={() => toast.dismiss(id)} style={ghost}>Batal</button>
                <button type="button" onClick={() => void markPaid(id)} style={primary}>Ya, tandai lunas</button>
              </div>
            </div>
          </div>
          </>,
          document.body,
        ),
      { duration: Infinity, unstyled: true },
    );
  }

  return (
    <button type="button" disabled={pending} onClick={ask} style={primary}>
      {pending ? "Memproses..." : "Tandai lunas"}
    </button>
  );
}

const primary: CSSProperties = { border: "none", background: "#059669", color: "#fff", borderRadius: 999, padding: "8px 14px", fontWeight: 700, cursor: "pointer" };
const ghost: CSSProperties = { border: "1px solid #e2e8f0", background: "#fff", color: "#0f172a", borderRadius: 999, padding: "8px 14px", fontWeight: 700, cursor: "pointer" };
