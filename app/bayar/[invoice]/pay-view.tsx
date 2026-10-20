"use client";

import { useEffect, useState } from "react";
import { QRCodeSVG } from "qrcode.react";
import Link from "next/link";

type Order = {
  invoice_code: string;
  status: string;
  total_amount: string;
  va_number: string | null;
  qr_string: string | null;
  payment_code: string | null;
  payment_url: string | null;
  snap_token: string | null;
  method_name: string | null;
  method_code: string | null;
  method_type: string | null;
  provider: string | null;
  logo_url: string | null;
  account_number: string | null;
  account_holder: string | null;
  customer_name: string | null;
  expired_at: string | null;
  instructions: Array<{ title: string; content: string }>;
};

function rupiah(value: string) {
  return new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(
    Number(value),
  );
}

function CopyButton({ value, label = "Salin" }: { value: string; label?: string }) {
  const [done, setDone] = useState(false);
  return (
    <button
      type="button"
      onClick={async () => {
        await navigator.clipboard.writeText(value);
        setDone(true);
        setTimeout(() => setDone(false), 1500);
      }}
      style={{
        border: "1px solid #a7f3d0",
        background: done ? "#059669" : "#ecfdf5",
        color: done ? "#fff" : "#047857",
        borderRadius: 999,
        padding: "6px 12px",
        fontSize: "0.78rem",
        fontWeight: 700,
      }}
    >
      {done ? "Tersalin" : label}
    </button>
  );
}

function stepsFor(order: Order): string[] {
  const bank = order.method_name ?? "bank";
  const va = order.va_number;
  const code = order.payment_code;
  if (order.qr_string) {
    return [
      "Buka aplikasi e-wallet atau mobile banking (GoPay, DANA, OVO, ShopeePay, atau m-banking).",
      "Pilih menu Scan / QRIS.",
      "Arahkan kamera ke kode QR di halaman ini.",
      `Pastikan nominal ${rupiah(order.total_amount)} dan nama merchant sudah benar, lalu masukkan PIN.`,
      "Halaman ini memperbarui status menjadi LUNAS setelah pembayaran masuk.",
    ];
  }
  if (order.provider === "Manual" && order.account_number) {
    return [
      `Buka m-banking atau ATM ${bank}.`,
      "Pilih transfer ke rekening bank yang sama.",
      `Masukkan nomor rekening ${order.account_number} a.n. ${order.account_holder ?? "BisnisLevelUp"}.`,
      `Transfer tepat ${rupiah(order.total_amount)}. Tiga digit terakhir membedakan pembayaran Anda.`,
      "Simpan bukti transfer. Admin mencocokkan nominal unik ini untuk menandai lunas.",
    ];
  }
  if (va) {
    return [
      `Buka aplikasi mobile banking, internet banking, atau ATM ${bank}.`,
      "Pilih Transfer, lalu Virtual Account / pembayaran VA.",
      `Tempel nomor VA ${va}. Jangan potong atau tambah angka.`,
      `Periksa nama penerima dan nominal ${rupiah(order.total_amount)}. Jumlah harus sama persis.`,
      "Konfirmasi dengan PIN. Status di halaman ini berubah menjadi LUNAS otomatis.",
    ];
  }
  if (code) {
    return [
      `Kunjungi kasir ${bank} sebelum kode kedaluwarsa.`,
      `Sebutkan pembayaran Xendit dan tunjukkan kode ${code}.`,
      `Bayar tunai sebesar ${rupiah(order.total_amount)}.`,
      "Simpan struk. Status pesanan diperbarui setelah gerai mengonfirmasi.",
    ];
  }
  if (order.snap_token) {
    return [
      "Popup GoPay Snap terbuka otomatis.",
      "Selesaikan pembayaran di aplikasi GoPay.",
      "Jika popup tertutup, tombol di bawah membuka kembali Snap.",
    ];
  }
  return ["Selesaikan pembayaran sesuai metode yang dipilih.", "Halaman ini memeriksa status setiap beberapa detik."];
}

export function PayView({
  initial,
  clientKey,
  snapSrc,
}: {
  initial: Order;
  clientKey: string;
  snapSrc: string;
}) {
  const [order, setOrder] = useState(initial);
  const [snapReady, setSnapReady] = useState(false);
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    if (order.status !== "PENDING") return;
    const timer = setInterval(async () => {
      const res = await fetch(`/api/orders/${order.invoice_code}`);
      const json = await res.json();
      if (json.data) setOrder(json.data);
    }, 5000);
    return () => clearInterval(timer);
  }, [order.invoice_code, order.status]);

  useEffect(() => {
    if (!order.snap_token) return;
    const script = document.createElement("script");
    script.src = snapSrc;
    script.setAttribute("data-client-key", clientKey);
    script.onload = () => setSnapReady(true);
    document.body.appendChild(script);
    return () => {
      script.remove();
    };
  }, [order.snap_token, clientKey, snapSrc]);

  function openSnap() {
    const snap = (window as unknown as { snap?: { pay: (token: string) => void } }).snap;
    if (order.snap_token) snap?.pay(order.snap_token);
  }

  const steps = stepsFor(order);
  const paid = order.status === "PAID";
  const expiry = order.expired_at
    ? new Date(order.expired_at).toLocaleString("id-ID", { dateStyle: "medium", timeStyle: "short" })
    : null;

  return (
    <div style={{ background: "#f8fafc", minHeight: "100vh", padding: "28px 16px 64px" }}>
      <div style={{ maxWidth: 880, margin: "0 auto" }}>
        <Link href="/" style={{ color: "#64748b", fontWeight: 600, fontSize: "0.9rem" }}>
          ← Kembali ke beranda
        </Link>
        <div style={{ display: "flex", justifyContent: "space-between", gap: 16, alignItems: "flex-end", marginTop: 16, flexWrap: "wrap" }}>
          <div>
            <p style={{ color: "#64748b", fontSize: "0.85rem" }}>Invoice {order.invoice_code}</p>
            <h1 style={{ fontSize: "1.8rem", fontWeight: 800, marginTop: 4 }}>Selesaikan pembayaran</h1>
            <p style={{ color: "#475569", marginTop: 6 }}>
              {order.customer_name ? `${order.customer_name}, ` : ""}
              transfer atau scan sesuai detail di bawah. Jangan ubah nominal.
            </p>
          </div>
          <span
            style={{
              background: paid ? "#ecfdf5" : "#fff7ed",
              color: paid ? "#047857" : "#c2410c",
              borderRadius: 999,
              padding: "6px 12px",
              fontWeight: 800,
              fontSize: "0.8rem",
            }}
          >
            {paid ? "LUNAS" : order.status}
          </span>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 20, marginTop: 24 }}>
          <section style={card}>
            <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 16 }}>
              {order.logo_url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={order.logo_url} alt="" style={{ width: 56, height: 36, objectFit: "contain" }} />
              ) : null}
              <div>
                <p style={{ fontSize: "0.75rem", color: "#64748b" }}>{order.provider}</p>
                <h2 style={{ fontSize: "1.15rem", fontWeight: 800 }}>{order.method_name}</h2>
              </div>
            </div>

            <CopyRow label="Nominal yang harus dibayar" value={rupiah(order.total_amount)} copyValue={String(Number(order.total_amount))} emphasize />
            {order.va_number ? <CopyRow label="Nomor virtual account" value={order.va_number} copyValue={order.va_number} mono /> : null}
            {order.payment_code ? <CopyRow label="Kode bayar di kasir" value={order.payment_code} copyValue={order.payment_code} mono /> : null}
            {order.provider === "Manual" && order.account_number ? (
              <>
                <CopyRow label={`Rekening ${order.account_holder ?? ""}`} value={order.account_number} copyValue={order.account_number} mono />
              </>
            ) : null}
            <Countdown expiredAt={order.expired_at} now={now} paid={paid} />
            {expiry ? <p style={{ marginTop: 8, fontSize: "0.82rem", color: "#64748b" }}>Batas bayar {expiry}</p> : null}

            {order.qr_string ? (
              <div style={{ marginTop: 18, display: "flex", flexDirection: "column", alignItems: "center", background: "#fff", border: "1px dashed #a7f3d0", borderRadius: 16, padding: 16 }}>
                <QRCodeSVG value={order.qr_string} size={220} />
                <p style={{ marginTop: 8, fontSize: "0.82rem", color: "#475569", textAlign: "center" }}>
                  Scan QRIS ini. Jangan screenshot lalu ubah ukuran sampai blur.
                </p>
              </div>
            ) : null}

            {order.snap_token ? (
              <button type="button" onClick={openSnap} disabled={!snapReady} className="btn btn-primary" style={{ width: "100%", marginTop: 16, borderRadius: 999 }}>
                {snapReady ? "Buka popup GoPay" : "Menyiapkan GoPay..."}
              </button>
            ) : null}
            {order.payment_url && order.method_type === "E-Wallet" ? (
              <a href={order.payment_url} className="btn btn-primary" style={{ width: "100%", marginTop: 16, borderRadius: 999 }}>
                Lanjut ke pembayaran
              </a>
            ) : null}
          </section>

          <section style={card}>
            <h2 style={{ fontSize: "1.05rem", fontWeight: 800, marginBottom: 12 }}>Cara membayar</h2>
            <ol style={{ display: "flex", flexDirection: "column", gap: 12, margin: 0, padding: 0, listStyle: "none" }}>
              {steps.map((step, index) => (
                <li key={step} style={{ display: "flex", gap: 10 }}>
                  <span style={{ width: 26, height: 26, borderRadius: "50%", background: "#059669", color: "#fff", display: "inline-flex", alignItems: "center", justifyContent: "center", fontSize: "0.78rem", fontWeight: 800, flexShrink: 0 }}>
                    {index + 1}
                  </span>
                  <span style={{ fontSize: "0.92rem", color: "#334155", lineHeight: 1.5 }}>{step}</span>
                </li>
              ))}
            </ol>
            {order.instructions.length > 0 ? (
              <div style={{ marginTop: 20, borderTop: "1px solid #e2e8f0", paddingTop: 14 }}>
                <p style={{ fontWeight: 700, marginBottom: 8 }}>Panduan kanal</p>
                {order.instructions.map((item) => (
                  <article key={item.title} style={{ marginBottom: 12 }}>
                    <h3 style={{ fontSize: "0.9rem", fontWeight: 700 }}>{item.title}</h3>
                    <p style={{ fontSize: "0.85rem", color: "#475569", whiteSpace: "pre-wrap", marginTop: 4 }}>{item.content}</p>
                  </article>
                ))}
              </div>
            ) : null}
          </section>
        </div>
      </div>
    </div>
  );
}

function Countdown({ expiredAt, now, paid }: { expiredAt: string | null; now: number; paid: boolean }) {
  if (paid) return <p style={{ marginTop: 14, color: "#047857", fontWeight: 800 }}>Pembayaran sudah diterima.</p>;
  const end = expiredAt ? new Date(expiredAt).getTime() : now + 24 * 60 * 60 * 1000;
  const left = Math.max(0, end - now);
  const hours = Math.floor(left / 3600000);
  const minutes = Math.floor((left % 3600000) / 60000);
  const seconds = Math.floor((left % 60000) / 1000);
  const pad = (n: number) => String(n).padStart(2, "0");
  return (
    <div style={{ marginTop: 16, background: left === 0 ? "#fef2f2" : "#fff7ed", borderRadius: 16, padding: 14, textAlign: "center" }}>
      <p style={{ fontSize: "0.75rem", fontWeight: 700, color: "#9a3412" }}>Sisa waktu pembayaran</p>
      <p style={{ fontSize: "1.8rem", fontWeight: 800, letterSpacing: "0.08em", color: left === 0 ? "#b91c1c" : "#c2410c" }}>
        {left === 0 ? "Kedaluwarsa" : `${pad(hours)}:${pad(minutes)}:${pad(seconds)}`}
      </p>
    </div>
  );
}

function CopyRow({
  label,
  value,
  copyValue,
  mono,
  emphasize,
}: {
  label: string;
  value: string;
  copyValue: string;
  mono?: boolean;
  emphasize?: boolean;
}) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", gap: 12, alignItems: "center", background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: 14, padding: "12px 14px", marginTop: 10 }}>
      <div>
        <p style={{ fontSize: "0.75rem", color: "#64748b" }}>{label}</p>
        <p style={{ fontWeight: 800, fontSize: emphasize ? "1.35rem" : "1.05rem", fontFamily: mono ? "ui-monospace, monospace" : "inherit", letterSpacing: mono ? "0.04em" : undefined }}>
          {value}
        </p>
      </div>
      <CopyButton value={copyValue} />
    </div>
  );
}

const card: React.CSSProperties = {
  background: "#fff",
  border: "1px solid #e2e8f0",
  borderRadius: 20,
  padding: 22,
};
