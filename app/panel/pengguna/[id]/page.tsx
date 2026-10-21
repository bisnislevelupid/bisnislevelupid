import Link from "next/link";
import { notFound } from "next/navigation";
import { getAdmin } from "@/lib/admin/managed";
import { AdminForm } from "../../_components/admin-form";

export const dynamic = "force-dynamic";

export default async function PenggunaEditPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const creating = id === "baru";
  const initial = creating ? undefined : await getAdmin(id);
  if (!creating && !initial) notFound();
  return (
    <div>
      <Link href="/panel/pengguna" style={{ color: "#059669", fontWeight: 700 }}>← Pengguna panel</Link>
      <h1 style={{ fontSize: "1.5rem", fontWeight: 800, margin: "8px 0 16px" }}>{creating ? "Tambah pengguna" : "Ubah pengguna"}</h1>
      <AdminForm id={creating ? undefined : id} initial={initial ?? undefined} />
    </div>
  );
}
