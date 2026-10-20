import Link from "next/link";
import { dashboardStats } from "@/lib/admin/crud";

function rupiah(value: string | number) {
  return new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(Number(value));
}

export default async function PanelHome() {
  const stats = await dashboardStats();
  const cards = [
    { label: "Total Revenue Masuk", value: rupiah(stats.revenue), color: "#059669", note: "Order berstatus lunas" },
    { label: "Transaksi Lunas (Paid)", value: `${stats.paid_orders} Order`, color: "#0f172a", note: "Konversi dari checkout" },
    { label: "Menunggu Konfirmasi", value: `${stats.pending_orders} Order`, color: "#d97706", note: "Menunggu transfer / VA" },
    { label: "Total Customer", value: `${stats.customers} Peserta`, color: "#0f172a", note: "Akun yang sudah checkout" },
  ];
  return (
    <div>
      <h1 style={{ fontSize: "1.6rem", fontWeight: 800 }}>Ringkasan Eksekutif & Statistik</h1>
      <p style={{ color: "#64748b", marginBottom: 20 }}>Pantau perkembangan penjualan audit, konversi checkout, dan aktivitas pengguna.</p>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 16 }}>
        {cards.map((card) => (
          <article key={card.label} style={{ background: "#fff", border: "1px solid #e2e8f0", borderRadius: 16, padding: 18 }}>
            <p style={{ color: "#64748b", fontSize: "0.82rem" }}>{card.label}</p>
            <p style={{ fontSize: "1.45rem", fontWeight: 800, color: card.color, margin: "8px 0" }}>{card.value}</p>
            <p style={{ color: "#94a3b8", fontSize: "0.75rem" }}>{card.note}</p>
          </article>
        ))}
      </div>
      <section style={{ marginTop: 24, background: "#fff", border: "1px solid #e2e8f0", borderRadius: 16, padding: 18 }}>
        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 12 }}>
          <h2 style={{ fontSize: "1.05rem", fontWeight: 800 }}>Aktivitas Transaksi Terbaru</h2>
          <Link href="/panel/orders" style={{ color: "#059669", fontSize: "0.85rem", fontWeight: 700 }}>
            Lihat Semua Pesanan →
          </Link>
        </div>
        <div style={{ overflow: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.88rem" }}>
            <thead>
              <tr style={{ color: "#64748b", textAlign: "left" }}>
                {["Invoice", "Customer", "Produk", "Nominal", "Metode", "Status"].map((head) => (
                  <th key={head} style={{ padding: "10px 8px", fontWeight: 600 }}>{head}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {stats.recent.map((row: { invoice_code: string; customer_name: string; customer_email: string; product_name: string; total_amount: string; method_name: string; status: string }) => (
                <tr key={row.invoice_code} style={{ borderTop: "1px solid #f1f5f9" }}>
                  <td style={{ padding: "12px 8px", fontWeight: 700 }}>{row.invoice_code}</td>
                  <td style={{ padding: "12px 8px" }}>
                    <div>{row.customer_name}</div>
                    <div style={{ color: "#94a3b8", fontSize: "0.75rem" }}>{row.customer_email}</div>
                  </td>
                  <td style={{ padding: "12px 8px" }}>{row.product_name}</td>
                  <td style={{ padding: "12px 8px" }}>{rupiah(row.total_amount)}</td>
                  <td style={{ padding: "12px 8px" }}>{row.method_name}</td>
                  <td style={{ padding: "12px 8px" }}>
                    <span style={{
                      background: row.status === "PAID" ? "#ecfdf5" : "#fff7ed",
                      color: row.status === "PAID" ? "#059669" : "#d97706",
                      borderRadius: 999,
                      padding: "3px 8px",
                      fontSize: "0.72rem",
                      fontWeight: 800,
                    }}>
                      {row.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
