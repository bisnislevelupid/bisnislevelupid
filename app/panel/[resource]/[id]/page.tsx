import Link from "next/link";
import { notFound } from "next/navigation";
import { isAdminTable } from "@/lib/admin/resources";
import { ResourceForm } from "../resource-form";

export default async function ResourceEditPage({
  params,
}: {
  params: Promise<{ resource: string; id: string }>;
}) {
  const { resource, id } = await params;
  if (!isAdminTable(resource)) notFound();
  const creating = id === "baru";
  return (
    <div>
      <Link href={`/panel/${resource}`} className="text-sm font-medium text-primary">← Kembali ke daftar</Link>
      <h1 className="mb-4 mt-2 text-2xl font-semibold tracking-tight">
        {creating ? "Tambah" : "Ubah"} {resource.replaceAll("_", " ")}
      </h1>
      <ResourceForm resource={resource} id={creating ? undefined : decodeURIComponent(id)} />
    </div>
  );
}
