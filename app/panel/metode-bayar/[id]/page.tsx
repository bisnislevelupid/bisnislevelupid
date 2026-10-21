import Link from "next/link";
import { notFound } from "next/navigation";
import { getMethod } from "@/lib/admin/managed";
import { MethodForm } from "../../_components/method-form";

export const dynamic = "force-dynamic";

export default async function MetodeEditPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const creating = id === "baru";
  const data = creating ? null : await getMethod(id);
  if (!creating && !data) notFound();
  return (
    <div>
      <Link href="/panel/metode-bayar" style={{ color: "#059669", fontWeight: 700 }}>← Metode bayar</Link>
      <h1 style={{ fontSize: "1.5rem", fontWeight: 800, margin: "8px 0 16px" }}>{creating ? "Tambah metode" : "Ubah metode"}</h1>
      <MethodForm
        id={creating ? undefined : id}
        method={data?.method as never}
        instructions={(data?.instructions ?? []).map((step) => ({
          id: String(step.id),
          title: String(step.title),
          content: String(step.content),
        }))}
      />
    </div>
  );
}
