import { notFound, redirect } from "next/navigation";
import { isAdminTable } from "@/lib/admin/resources";
import { ResourceTable } from "./resource-table";

const dedicated: Record<string, string> = {
  admins: "/panel/pengguna",
  payment_methods: "/panel/metode-bayar",
  payment_instructions: "/panel/metode-bayar",
  payment_logs: "/panel/log-pembayaran",
  notification_templates: "/panel/template-notifikasi",
  notification_logs: "/panel/log-notifikasi",
};

export default async function ResourcePage({
  params,
}: {
  params: Promise<{ resource: string }>;
}) {
  const { resource } = await params;
  if (dedicated[resource]) redirect(dedicated[resource]);
  if (!isAdminTable(resource)) notFound();
  return (
    <div>
      <div className="mb-4">
        <h1 className="text-2xl font-semibold tracking-tight">{resource.replaceAll("_", " ")}</h1>
        <p className="text-sm text-muted-foreground">Kelola data dari tabel. Tambah dan ubah dibuka di halaman sendiri.</p>
      </div>
      <ResourceTable resource={resource} />
    </div>
  );
}
