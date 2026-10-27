import { listOrders } from "@/lib/admin/orders";
import { formatRupiah } from "@/lib/admin/format";
import { formatWib } from "@/lib/portal/labels";
import { OrderGrid, type OrderRow } from "./order-grid";

export const dynamic = "force-dynamic";

function money(total: unknown, uniqueAmount: unknown) {
  const grand = formatRupiah(String(total ?? 0));
  if (uniqueAmount == null || uniqueAmount === "") return grand;
  return `${grand} (unik ${formatRupiah(String(uniqueAmount))})`;
}

export default async function OrdersPage() {
  const rows = await listOrders();
  const data: OrderRow[] = rows.map((row) => ({
    id: String(row.id),
    invoice: String(row.invoice_code ?? ""),
    buyer: String(row.customer_name ?? ""),
    email: String(row.customer_email ?? ""),
    phone: String(row.customer_phone ?? ""),
    product: String(row.product_name ?? ""),
    method: String(row.method_name ?? ""),
    status: String(row.status ?? ""),
    total: money(row.total_amount, row.unique_amount),
    created: formatWib(row.created_at as string | null) || "—",
  }));
  return (
    <div>
      <h1 style={{ fontSize: "1.5rem", fontWeight: 800 }}>Pesanan</h1>
      <p style={{ color: "#64748b", marginBottom: 16 }}>Order masuk, metode bayar, dan grand total.</p>
      <OrderGrid rows={data} />
    </div>
  );
}
