import { notFound, redirect } from "next/navigation";
import { listResource } from "@/lib/admin/crud";
import { isAdminTable, isReadonlyResource } from "@/lib/admin/resources";
import { tableLabel } from "@/lib/admin/labels";
import { ResourceTable, type TableQuery } from "./resource-table";

export const dynamic = "force-dynamic";

const dedicated: Record<string, string> = {
  admins: "/panel/pengguna",
  payment_methods: "/panel/metode-bayar",
  payment_instructions: "/panel/metode-bayar",
  payment_logs: "/panel/log-pembayaran",
  notification_templates: "/panel/template-notifikasi",
  notification_logs: "/panel/log-notifikasi",
  orders: "/panel/orders",
};

function one(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] ?? "" : value ?? "";
}

function digits(value: string) {
  return /^\d+$/.test(value) ? value : "";
}

export default async function ResourcePage({
  params,
  searchParams,
}: {
  params: Promise<{ resource: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { resource } = await params;
  if (dedicated[resource]) redirect(dedicated[resource]);
  if (!isAdminTable(resource)) notFound();
  const search = await searchParams;
  const query: TableQuery = {
    page: Math.max(1, Number(one(search.page)) || 1),
    q: one(search.q).slice(0, 200),
    audit: digits(one(search.audit)),
    section: digits(one(search.section)),
  };
  const payload = await listResource(resource, { ...query, limit: 10 });
  const readonly = isReadonlyResource(resource);
  return (
    <div>
      <div className="mb-4">
        <h1 className="text-2xl font-semibold tracking-tight">{tableLabel(resource)}</h1>
        <p className="text-sm text-muted-foreground">
          {readonly
            ? "Catatan yang ditulis sistem. Tidak bisa ditambah, diubah, atau dihapus dari panel."
            : "Kelola data. Tambah dan ubah dibuka di halaman sendiri."}
        </p>
      </div>
      <ResourceTable resource={resource} payload={payload} query={query} />
    </div>
  );
}
