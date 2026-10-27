import type { CSSProperties } from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getOrderDetail } from "@/lib/admin/orders";
import { formatRupiah, statusText, uniqueTransferCode } from "@/lib/admin/format";
import { formatWib } from "@/lib/portal/labels";
import { OrderHeadline } from "../order-status";

export const dynamic = "force-dynamic";

export default async function OrderDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const detail = await getOrderDetail(id);
  if (!detail) notFound();
  const order = detail.order;
  const manualTransfer = String(order.method_type ?? "") === "bank_transfer";
  const uniqueCode = uniqueTransferCode(order.unique_amount);
  return (
    <div>
      <Link href="/panel/orders" style={{ color: "#059669", fontWeight: 700 }}>← Semua pesanan</Link>
      <OrderHeadline
        status={String(order.status ?? "")}
        orderId={String(order.id)}
        invoice={String(order.invoice_code)}
        manualTransfer={manualTransfer}
      />

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 16, marginTop: 20 }}>
        <section style={card}>
          <h2 style={heading}>Pembeli</h2>
          <Field label="Nama" value={String(order.customer_name ?? "—")} />
          <Field label="Email" value={String(order.customer_email ?? "—")} />
          <Field label="WhatsApp" value={String(order.customer_phone ?? "—")} />
          <Field label="Dibuat" value={formatWib(order.created_at as string | null) || "—"} />
        </section>
        <section style={card}>
          <h2 style={heading}>Pembayaran</h2>
          <Field label="Metode" value={String(order.method_name ?? "—")} />
          <Field label="Nomor VA" value={String(order.va_number ?? "—")} />
          <Field label="Kode bayar" value={String(order.payment_code ?? "—")} />
          <Field label="Batas bayar" value={formatWib(order.expired_at as string | null) || "—"} />
          <Field label="Waktu lunas" value={formatWib(order.paid_at as string | null) || "—"} />
          {order.cancel_reason ? <Field label="Alasan batal" value={String(order.cancel_reason)} /> : null}
          {order.cancelled_at ? <Field label="Dibatalkan" value={formatWib(order.cancelled_at as string | null) || "—"} /> : null}
        </section>
        <section style={{ ...card, background: "#f0fdf4", borderColor: "#a7f3d0" }}>
          <h2 style={heading}>Yang harus dibayar</h2>
          <Field label="Subtotal" value={formatRupiah(String(order.subtotal ?? 0))} />
          <Field label="Diskon" value={formatRupiah(String(order.discount_amount ?? 0))} />
          <Field label="Biaya admin" value={formatRupiah(String(order.admin_fee ?? 0))} />
          <div style={{ display: "flex", justifyContent: "space-between", marginTop: 10, paddingTop: 10, borderTop: "1px solid #a7f3d0" }}>
            <strong>Grand total</strong>
            <strong style={{ color: "#059669", fontSize: "1.15rem" }}>{formatRupiah(String(order.total_amount ?? 0))}</strong>
          </div>
          {uniqueCode != null ? (
            <p style={{ margin: "8px 0 0", color: "#047857", fontSize: "0.85rem" }}>
              Kode unik: {formatRupiah(uniqueCode)}
            </p>
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
                <td style={td}>{formatRupiah(String(item.unit_price))}</td>
                <td style={td}>{formatRupiah(String(item.total_price))}</td>
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
            {/* Bukti dari unggahan pembeli; host-nya tidak tetap, jadi tidak lewat next/image. */}
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={String(order.transfer_proof_url)} alt={`Bukti transfer ${String(order.invoice_code)}`} style={{ maxWidth: "100%", maxHeight: 420, borderRadius: 12, objectFit: "contain", background: "#f8fafc" }} />
          </a>
          <p style={{ margin: "8px 0 0" }}>
            <a href={String(order.transfer_proof_url)} target="_blank" rel="noreferrer" style={{ color: "#059669", fontWeight: 700 }}>Buka file bukti</a>
          </p>
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
                <td style={td}>{statusText(String(log.type ?? ""))}</td>
                <td style={td}>{String(log.http_status ?? "—")}</td>
                <td style={td}>{formatWib(log.created_at as string | null) || "—"}</td>
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
