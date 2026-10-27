"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { Compass, FileText, Menu, Play, Receipt, Sparkles, TrendingUp, X } from "lucide-react";
import { Wordmark } from "@/components/shared/wordmark";

const items = [
  { href: "/akun", label: "Ringkasan Akun", icon: Compass },
  { href: "/akun/audit", label: "Lembar Simulasi Audit", icon: Play },
  { href: "/akun/laporan", label: "Laporan Hasil & Roadmap", icon: FileText },
  { href: "/akun/layanan", label: "Beli Layanan Lain", icon: Sparkles },
  { href: "/akun/invoice", label: "Riwayat Pembayaran", icon: Receipt },
];

export function PortalShell({
  name,
  email,
  business,
  canAudit,
  children,
}: {
  name: string;
  email: string;
  business: string | null;
  canAudit: boolean;
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const active = (href: string) => (href === "/akun" ? pathname === href : pathname.startsWith(href));

  return (
    <div className="portal">
      {open ? <button className="portal-overlay" aria-label="Tutup menu" onClick={() => setOpen(false)} /> : null}
      <aside className={`portal-sidebar${open ? " open" : ""}`}>
        <div style={{ padding: "20px 18px", borderBottom: "1px solid #f1f5f9", display: "flex", justifyContent: "space-between" }}>
          <Link href="/" style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <span
              aria-hidden="true"
              style={{
                width: 28,
                height: 28,
                borderRadius: 8,
                background: "linear-gradient(135deg,#10b981,#059669)",
                color: "#fff",
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <TrendingUp size={16} />
            </span>
            <Wordmark size="1.05rem" />
          </Link>
          <button className="portal-menu" onClick={() => setOpen(false)} aria-label="Tutup" style={{ border: 0, background: "transparent" }}>
            <X size={18} />
          </button>
        </div>
        <div style={{ margin: 16, padding: 14, borderRadius: 16, background: "#ecfdf5" }}>
          <div style={{ fontSize: 11, fontWeight: 800, color: "#059669" }}>AKUN TERDAFTAR</div>
          <div style={{ fontWeight: 800, marginTop: 4 }}>{name.trim() || "Peserta"}</div>
          <div style={{ color: "#64748b", fontSize: 13 }}>{business?.trim() || "Nama bisnis belum diisi"}</div>
          <div style={{ color: "#64748b", fontSize: 12, marginTop: 2 }}>{email}</div>
        </div>
        <nav style={{ display: "grid", gap: 4, padding: "0 12px" }}>
          {items.map((item) => {
            const Icon = item.icon;
            const on = active(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setOpen(false)}
                style={{
                  display: "flex",
                  gap: 10,
                  alignItems: "center",
                  padding: "12px 12px",
                  borderRadius: 12,
                  background: on ? "#ecfdf5" : "transparent",
                  color: on ? "#047857" : "#334155",
                  fontWeight: 700,
                  minHeight: 44,
                }}
              >
                <Icon size={18} />
                {item.label}
              </Link>
            );
          })}
        </nav>
        <form action="/api/logout" method="post" style={{ marginTop: "auto", padding: 16 }}>
          <input type="hidden" name="realm" value="peserta" />
          <button type="submit" style={{ width: "100%", height: 44, borderRadius: 999, border: "1px solid #e2e8f0", background: "#fff", fontWeight: 700 }}>
            Keluar
          </button>
        </form>
      </aside>
      <div className="portal-main">
        <header className="portal-top">
          <button className="portal-menu" onClick={() => setOpen(true)} aria-label="Menu" style={{ border: "1px solid #e2e8f0", background: "#fff", borderRadius: 12, width: 44, height: 44, alignItems: "center", justifyContent: "center" }}>
            <Menu size={18} />
          </button>
          <div style={{ fontWeight: 800 }}>Portal Pengusaha</div>
          {canAudit ? (
            <Link href="/akun/audit" style={{ background: "#059669", color: "#fff", borderRadius: 999, padding: "10px 14px", fontWeight: 800, fontSize: 14 }}>
              Lanjut pengisian
            </Link>
          ) : (
            <Link href="/#pricing-section" style={{ background: "#059669", color: "#fff", borderRadius: 999, padding: "10px 14px", fontWeight: 800, fontSize: 14 }}>
              Beli paket
            </Link>
          )}
        </header>
        <div className="portal-content">{children}</div>
      </div>
    </div>
  );
}
