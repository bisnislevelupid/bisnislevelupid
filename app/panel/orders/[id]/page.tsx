import type { CSSProperties } from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getOrderDetail } from "@/lib/admin/orders";
import { rupiah } from "@/lib/portal/labels";
import { MarkPaidButton } from "../mark-paid";

export const dynamic = "force-dynamic";

function when(value: unknown) {
  if (!value) return "—";
  return new Date(String(value)).toLocaleString("id-ID");
}

function statusTone(status: string) {
  if (status === "PAID") return { bg: "#059669", label: "Lunas" };
  if (status === "PENDING") return { bg: "#d97706", label: "Menunggu pembayaran" };
  if (status === "EXPIRED") return { bg: "#64748b", label: "Kedaluwarsa" };
  return { bg: "#0369a1", label: status };
}

export default async function OrderDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const detail = await getOrderDetail(id);
  if (!detail) notFound();
  const order = detail.order;
  const status = String(order.status ?? "");
  const tone = statusTone(status);
  const paid = status === "PAID";
  return (
    <div>
      <Link href="/panel/orders" style={{ color: "#059669", fontWeight: 700 }}>← Semua pesanan</Link>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 16, marginTop: 14, flexWrap: "wrap" }}>
        <div>
          <p style={{ margin: 0, color: "#64748b", fontSize: "0.82rem" }}>Invoice</p>
          <h1 style={{ fontSize: "1.7rem", fontWeight: 800, margin: "2px 0 8px" }}>{String(order.invoice_code)}</h1>
          <span style={{ background: tone.bg, color: "#fff", borderRadius: 999, padding: "4px 12px", fontWeight: 700, fontSize: "0.8rem" }}>{tone.label}</span>
        </div>
        {paid ? null : <MarkPaidButton orderId={String(order.id)} invoice={String(order.invoice_code)} />}
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 16, marginTop: 20 }}>
        <section style={card}>
          <h2 style={heading}>Pembeli</h2>
          <Field label="Nama" value={String(order.customer_name ?? "—")} />
          <Field label="Email" value={String(order.customer_email ?? "—")} />
          <Field label="WhatsApp" value={String(order.customer_phone ?? "—")} />
          <Field label="Dibuat" value={when(order.created_at)} />
        </section>
        <section style={card}>
          <h2 style={heading}>Pembayaran</h2>
          <Field label="Metode" value={String(order.method_name ?? "—")} />
          <Field label="Nomor VA" value={String(order.va_number ?? "—")} />
          <Field label="Kode bayar" value={String(order.payment_code ?? "—")} />
          <Field label="Batas bayar" value={when(order.expired_at)} />
          <Field label="Waktu lunas" value={when(order.paid_at)} />
        </section>
        <section style={{ ...card, background: "#f0fdf4", borderColor: "#a7f3d0" }}>
          <h2 style={heading}>Yang harus dibayar</h2>
          <Field label="Subtotal" value={rupiah(String(order.subtotal ?? 0))} />
          <Field label="Diskon" value={rupiah(String(order.discount_amount ?? 0))} />
          <Field label="Biaya admin" value={rupiah(String(order.admin_fee ?? 0))} />
          <div style={{ display: "flex", justifyContent: "space-between", marginTop: 10, paddingTop: 10, borderTop: "1px solid #a7f3d0" }}>
            <strong>Grand total</strong>
            <strong style={{ color: "#059669", fontSize: "1.15rem" }}>{rupiah(String(order.total_amount ?? 0))}</strong>
          </div>
          {order.unique_amount != null && String(order.unique_amount) !== "" ? (
            <p style={{ margin: "8px 0 0", color: "#047857", fontSize: "0.85rem" }}>Nominal unik transfer: {rupiah(String(order.unique_amount))}</p>
          ) : null}
        </section>
      </div>

      <section style={{ ...card, marginTop: 16 }}>
        <h2 style={heading}>Item pesanan</h2>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr>{["Item", "Qty", "Harga", "Total"].map((head) => <th key={head} style={th}>{head}</th>)}</tr>
          </thead>
          <tbody>
            {detail.items.map((item) => (
              <tr key={String(item.id)}>
                <td style={td}>{String(item.product_name)}</td>
                <td style={td}>{String(item.quantity)}</td>
                <td style={td}>{rupiah(String(item.unit_price))}</td>
                <td style={td}>{rupiah(String(item.total_price))}</td>
              </tr>
            ))}
            {!detail.items.length ? <tr><td style={td} colSpan={4}>Tidak ada item.</td></tr> : null}
          </tbody>
        </table>
      </section>

      {order.transfer_proof_url ? (
        <section style={{ ...card, marginTop: 16 }}>
          <h2 style={heading}>Bukti transfer</h2>
          <a href={String(order.transfer_proof_url)} target="_blank" rel="noreferrer">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={String(order.transfer_proof_url)} alt="Bukti transfer" style={{ maxWidth: "100%", maxHeight: 420, borderRadius: 12, objectFit: "contain", background: "#f8fafc" }} />
          </a>
        </section>
      ) : String(order.method_type ?? "") === "bank_transfer" ? (
        <section style={{ ...card, marginTop: 16 }}>
          <h2 style={heading}>Bukti transfer</h2>
          <p style={{ color: "#64748b", margin: 0 }}>Pembeli belum mengirim bukti.</p>
        </section>
      ) : null}

      <section style={{ ...card, marginTop: 16 }}>
        <h2 style={heading}>Jejak pembayaran</h2>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr>{["Endpoint", "Tipe", "HTTP", "Waktu"].map((head) => <th key={head} style={th}>{head}</th>)}</tr>
          </thead>
          <tbody>
            {detail.logs.map((log) => (
              <tr key={String(log.id)}>
                <td style={td}>{String(log.endpoint ?? "—")}</td>
                <td style={td}>{String(log.type ?? "—")}</td>
                <td style={td}>{String(log.http_status ?? "—")}</td>
                <td style={td}>{when(log.created_at)}</td>
              </tr>
            ))}
            {!detail.logs.length ? <tr><td style={td} colSpan={4}>Belum ada catatan dari gateway atau webhook.</td></tr> : null}
          </tbody>
        </table>
      </section>
    </div>
  );
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", gap: 12, padding: "6px 0", borderBottom: "1px solid #f1f5f9" }}>
      <span style={{ color: "#64748b" }}>{label}</span>
      <span style={{ fontWeight: 700, textAlign: "right" }}>{value}</span>
    </div>
  );
}

const card: CSSProperties = { background: "#fff", border: "1px solid #e2e8f0", borderRadius: 16, padding: 16 };
const heading: CSSProperties = { margin: "0 0 8px", fontSize: "1rem" };
const th: CSSProperties = { textAlign: "left", padding: 12, background: "#059669", color: "#fff" };
const td: CSSProperties = { padding: 12, borderBottom: "1px solid #f1f5f9" };
