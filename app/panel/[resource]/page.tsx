import { notFound } from "next/navigation";
import { isAdminTable } from "@/lib/admin/resources";
import { ResourceTable } from "./resource-table";

export default async function ResourcePage({
  params,
}: {
  params: Promise<{ resource: string }>;
}) {
  const { resource } = await params;
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
