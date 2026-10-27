import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { getResource, listResource } from "@/lib/admin/crud";
import { isAdminTable, isReadonlyResource } from "@/lib/admin/resources";
import { tableLabel } from "@/lib/admin/labels";
import { ResourceForm } from "../resource-form";

const dedicated: Record<string, string> = {
  admins: "/panel/pengguna",
  payment_methods: "/panel/metode-bayar",
  payment_instructions: "/panel/metode-bayar",
  payment_logs: "/panel/log-pembayaran",
  notification_templates: "/panel/template-notifikasi",
  notification_logs: "/panel/log-notifikasi",
  orders: "/panel/orders",
};

export default async function ResourceEditPage({
  params,
}: {
  params: Promise<{ resource: string; id: string }>;
}) {
  const { resource, id } = await params;
  if (resource === "site_settings") redirect("/panel/site_settings");
  if (dedicated[resource]) redirect(id === "baru" ? `${dedicated[resource]}/baru` : `${dedicated[resource]}/${id}`);
  if (!isAdminTable(resource)) notFound();
  const creating = id === "baru";
  const readOnly = isReadonlyResource(resource);
  const loaded = creating
    ? await listResource(resource, { page: 1, limit: 1, includeOptions: true })
    : await getResource(resource, decodeURIComponent(id));
  if (!creating && !("row" in loaded && loaded.row)) notFound();
  return (
    <div>
      <Link href={`/panel/${resource}`} className="text-sm font-medium text-primary">← Kembali ke daftar</Link>
      <h1 className="mb-4 mt-2 text-2xl font-semibold tracking-tight">
        {readOnly ? "Lihat" : creating ? "Tambah" : "Ubah"} {tableLabel(resource)}
      </h1>
      {creating && readOnly ? (
        <p className="rounded-lg border border-border bg-card px-4 py-6 text-sm text-muted-foreground">
          Tabel ini hanya bisa dibaca. Baris baru tidak bisa dibuat dari panel.
        </p>
      ) : (
        <ResourceForm
          key={`${resource}:${creating ? "baru" : id}`}
          resource={resource}
          id={creating ? undefined : decodeURIComponent(id)}
          readOnly={readOnly}
          initial={{
            columns: loaded.columns,
            relations: loaded.relations ?? {},
            row: "row" in loaded ? loaded.row : null,
          }}
        />
      )}
    </div>
  );
}
