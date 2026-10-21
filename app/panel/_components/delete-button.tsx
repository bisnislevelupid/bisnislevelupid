"use client";

import { toast } from "sonner";

export function DeleteButton({ url, redirectTo }: { url: string; redirectTo?: string }) {
  async function remove() {
    const res = await fetch(url, { method: "DELETE" });
    if (!res.ok) {
      const json = await res.json().catch(() => ({}));
      toast.error(json.error ?? "Gagal menghapus");
      return;
    }
    toast.success("Data dihapus");
    if (redirectTo) window.location.href = redirectTo;
    else window.location.reload();
  }

  return (
    <button
      type="button"
      onClick={() =>
        toast("Hapus data ini?", {
          action: { label: "Hapus", onClick: () => void remove() },
          cancel: { label: "Batal", onClick: () => undefined },
        })
      }
      style={{ border: "none", background: "#fef2f2", color: "#b91c1c", borderRadius: 999, padding: "6px 10px", fontWeight: 700, fontSize: "0.75rem", cursor: "pointer" }}
    >
      Hapus
    </button>
  );
}
