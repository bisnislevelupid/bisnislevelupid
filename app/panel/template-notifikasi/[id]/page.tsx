import Link from "next/link";
import { notFound } from "next/navigation";
import { getTemplate } from "@/lib/admin/managed";
import { TemplateForm } from "../../_components/template-form";

export const dynamic = "force-dynamic";

export default async function TemplateEditPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const creating = id === "baru";
  const initial = creating ? undefined : await getTemplate(id);
  if (!creating && !initial) notFound();
  return (
    <div>
      <Link href="/panel/template-notifikasi" style={{ color: "#059669", fontWeight: 700 }}>← Template notifikasi</Link>
      <h1 style={{ fontSize: "1.5rem", fontWeight: 800, margin: "8px 0 16px" }}>{creating ? "Tambah template" : "Ubah template"}</h1>
      <TemplateForm id={creating ? undefined : id} initial={initial as never} />
    </div>
  );
}
