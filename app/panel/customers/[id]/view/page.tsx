import Link from "next/link";
import { notFound } from "next/navigation";
import { getCustomerProfile } from "@/lib/admin/crud";
import { formatRupiah, statusText } from "@/lib/admin/format";

const fields: { key: string; label: string }[] = [
  { key: "name", label: "Nama lengkap" },
  { key: "email", label: "Email" },
  { key: "phone", label: "Nomor WhatsApp" },
  { key: "business_name", label: "Nama bisnis / brand" },
  { key: "business_field", label: "Bidang bisnis" },
  { key: "business_city", label: "Kota bisnis" },
  { key: "business_start_year", label: "Tahun mulai bisnis" },
  { key: "owner_role", label: "Peran" },
  { key: "employee_range", label: "Jumlah tim" },
  { key: "monthly_revenue", label: "Omzet bulanan" },
  { key: "status", label: "Status akun" },
];

function text(value: unknown) {
  if (value == null || value === "") return "—";
  return String(value);
}

export default async function CustomerDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { customer, orders } = await getCustomerProfile(id);
  if (!customer) notFound();

  return (
    <div className="mx-auto max-w-3xl space-y-4">
      <Link href="/panel/customers" className="text-sm font-medium text-primary">← Kembali ke daftar</Link>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-semibold tracking-tight">{text(customer.name)}</h1>
        <Link href={`/panel/customers/${id}`} className="inline-flex h-9 items-center rounded-full bg-emerald-50 px-4 text-sm font-semibold text-primary">
          Edit
        </Link>
      </div>
      <section className="rounded-lg border border-border bg-card p-4 sm:p-6">
        <h2 className="mb-4 text-base font-semibold">Profil dari checkout</h2>
        <dl className="grid gap-4 sm:grid-cols-2">
          {fields.map((field) => (
            <div key={field.key}>
              <dt className="text-xs font-medium text-muted-foreground">{field.label}</dt>
              <dd className="mt-1 text-sm">{text(customer[field.key])}</dd>
            </div>
          ))}
        </dl>
      </section>
      <section className="overflow-auto rounded-lg border border-border bg-card">
        <h2 className="px-4 pt-4 text-base font-semibold">Pesanan</h2>
        <table className="w-full text-left text-sm">
          <thead className="border-b border-border text-muted-foreground">
            <tr>
              <th className="px-4 py-3 font-medium">Invoice</th>
              <th className="px-4 py-3 font-medium">Paket</th>
              <th className="px-4 py-3 font-medium">Status</th>
              <th className="px-4 py-3 font-medium">Total</th>
            </tr>
          </thead>
          <tbody>
            {orders.length === 0 ? (
              <tr><td colSpan={4} className="px-4 py-4 text-muted-foreground">Belum ada pesanan.</td></tr>
            ) : orders.map((order) => (
              <tr key={String(order.invoice_code)} className="border-b border-border last:border-0">
                <td className="px-4 py-3">{text(order.invoice_code)}</td>
                <td className="px-4 py-3">{text(order.product_name)}</td>
                <td className="px-4 py-3"><span className="rounded-full bg-muted px-2 py-0.5 text-xs font-semibold">{statusText(text(order.status))}</span></td>
                <td className="px-4 py-3">{formatRupiah((order.unique_amount ?? order.total_amount) as string | number | null)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </div>
  );
}
