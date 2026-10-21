import { getPesertaSession } from "@/lib/auth/session";
import { listPortalOrders } from "@/lib/db/portal";
import { rupiah } from "@/lib/portal/labels";

export const dynamic = "force-dynamic";

export default async function InvoicePage() {
  const session = await getPesertaSession();
  if (!session?.id) return null;
  const orders = await listPortalOrders(session.id);
  return (
    <div>
      <h1 style={{ marginTop: 0 }}>Riwayat pembelian dan faktur</h1>
      {orders.length === 0 ? (
        <p>Belum ada invoice.</p>
      ) : (
        <table className="invoice-table">
          <thead>
            <tr style={{ textAlign: "left", color: "#64748b" }}>
              <th>Invoice</th>
              <th>Produk</th>
              <th>Nominal</th>
              <th>Metode</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {orders.map((order) => (
              <tr key={order.id}>
                <td data-label="Invoice" style={{ fontWeight: 800, padding: "12px 8px" }}>{order.invoice_code}</td>
                <td data-label="Produk" style={{ padding: "12px 8px" }}>{order.product_name || "-"}</td>
                <td data-label="Nominal" style={{ padding: "12px 8px" }}>{rupiah(order.total_amount)}</td>
                <td data-label="Metode" style={{ padding: "12px 8px" }}>{order.method_name || "-"}</td>
                <td data-label="Status" style={{ padding: "12px 8px" }}>
                  <span style={{ background: order.status === "PAID" ? "#ecfdf5" : "#f8fafc", color: order.status === "PAID" ? "#047857" : "#334155", borderRadius: 999, padding: "4px 10px", fontWeight: 800 }}>
                    {order.status === "PAID" ? "LUNAS" : order.status}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
