"use client";

import { useState, type CSSProperties, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { GripVertical } from "lucide-react";
import { DndContext, PointerSensor, closestCenter, useSensor, useSensors, type DragEndEvent } from "@dnd-kit/core";
import { SortableContext, arrayMove, useSortable, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { toast } from "sonner";

type Step = { key: string; id?: string; title: string; content: string };

type Initial = {
  code: string;
  name: string;
  logo_url: string | null;
  type: string;
  provider: string;
  admin_fee_flat: string;
  admin_fee_pct: string;
  is_active: boolean;
  is_redirect: boolean;
  sort_order: number;
  account_number: string | null;
  account_holder: string | null;
};

export function MethodForm({ id, method, instructions }: { id?: string; method?: Initial; instructions: { id?: string; title: string; content: string }[] }) {
  const router = useRouter();
  const [steps, setSteps] = useState<Step[]>(
    (instructions.length ? instructions : [{ title: "", content: "" }]).map((step) => ({
      ...step,
      key: step.id ?? crypto.randomUUID(),
    })),
  );
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 6 } }));

  function onDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    setSteps((current) => {
      const oldIndex = current.findIndex((step) => step.key === active.id);
      const newIndex = current.findIndex((step) => step.key === over.id);
      return arrayMove(current, oldIndex, newIndex);
    });
  }

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    setError("");
    const form = new FormData(event.currentTarget);
    const res = await fetch(id ? `/api/panel/managed/payment-bundle/${id}` : "/api/panel/managed/payment-bundle", {
      method: id ? "PATCH" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        code: form.get("code"),
        name: form.get("name"),
        logoUrl: form.get("logoUrl"),
        type: form.get("type"),
        provider: form.get("provider"),
        adminFeeFlat: form.get("adminFeeFlat"),
        adminFeePct: form.get("adminFeePct"),
        isActive: form.get("isActive") === "on",
        isRedirect: form.get("isRedirect") === "on",
        sortOrder: form.get("sortOrder"),
        accountNumber: form.get("accountNumber"),
        accountHolder: form.get("accountHolder"),
        instructions: steps.filter((step) => step.title.trim() || step.content.trim()),
      }),
    });
    const json = await res.json();
    setPending(false);
    if (!res.ok) {
      const message = json.error ?? "Gagal menyimpan";
      setError(message);
      toast.error(message);
      return;
    }
    toast.success("Metode dan instruksi tersimpan");
    router.push("/panel/metode-bayar");
    router.refresh();
  }

  return (
    <form onSubmit={onSubmit} style={{ display: "grid", gap: 12, maxWidth: 720 }}>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
        <label>Kode<input name="code" required defaultValue={method?.code} style={field} /></label>
        <label>Nama<input name="name" required defaultValue={method?.name} style={field} /></label>
        <label>Tipe<input name="type" required defaultValue={method?.type ?? "BANK_TRANSFER"} style={field} /></label>
        <label>Provider<input name="provider" required defaultValue={method?.provider ?? "MANUAL"} style={field} /></label>
        <label>Biaya tetap<input name="adminFeeFlat" type="number" defaultValue={method?.admin_fee_flat ?? "0"} style={field} /></label>
        <label>Biaya persen<input name="adminFeePct" type="number" step="0.01" defaultValue={method?.admin_fee_pct ?? "0"} style={field} /></label>
        <label>Urutan<input name="sortOrder" type="number" defaultValue={method?.sort_order ?? 0} style={field} /></label>
        <label>Logo URL<input name="logoUrl" defaultValue={method?.logo_url ?? ""} style={field} /></label>
        <label>Nomor rekening<input name="accountNumber" defaultValue={method?.account_number ?? ""} style={field} /></label>
        <label>Atas nama<input name="accountHolder" defaultValue={method?.account_holder ?? ""} style={field} /></label>
      </div>
      <label style={{ display: "flex", gap: 8 }}><input name="isActive" type="checkbox" defaultChecked={method?.is_active ?? true} /> Aktif</label>
      <label style={{ display: "flex", gap: 8 }}><input name="isRedirect" type="checkbox" defaultChecked={method?.is_redirect ?? false} /> Redirect ke payment gateway</label>
      <h2 style={{ fontSize: "1.05rem", marginTop: 8 }}>Instruksi pembayaran</h2>
      <p style={{ color: "#64748b", fontSize: "0.85rem" }}>Tambah, ubah, atau geser langkah. Urutan ini yang tampil di halaman bayar.</p>
      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={onDragEnd}>
        <SortableContext items={steps.map((step) => step.key)} strategy={verticalListSortingStrategy}>
          {steps.map((step, index) => (
            <InstructionStep
              key={step.key}
              step={step}
              onChange={(patch) => setSteps((current) => current.map((item, i) => (i === index ? { ...item, ...patch } : item)))}
              onRemove={() => setSteps((current) => current.filter((item) => item.key !== step.key))}
            />
          ))}
        </SortableContext>
      </DndContext>
      <button type="button" onClick={() => setSteps((current) => [...current, { key: crypto.randomUUID(), title: "", content: "" }])} style={ghost}>Tambah langkah</button>
      {error ? <p style={{ color: "#b91c1c" }}>{error}</p> : null}
      <button disabled={pending} style={button}>{pending ? "Menyimpan..." : "Simpan metode dan instruksi"}</button>
    </form>
  );
}

function InstructionStep({
  step,
  onChange,
  onRemove,
}: {
  step: Step;
  onChange: (patch: Partial<Step>) => void;
  onRemove: () => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id: step.key });
  return (
    <div ref={setNodeRef} style={{ transform: CSS.Transform.toString(transform), transition, border: "1px solid #e2e8f0", borderRadius: 12, padding: 12, display: "grid", gap: 8, background: "#fff" }}>
      <button type="button" aria-label="Geser langkah" {...attributes} {...listeners} style={{ justifySelf: "start", border: "none", background: "transparent", cursor: "grab", color: "#64748b" }}>
        <GripVertical size={16} />
      </button>
      <input value={step.title} placeholder="Judul langkah" onChange={(event) => onChange({ title: event.target.value })} style={field} />
      <textarea value={step.content} placeholder="Isi instruksi" onChange={(event) => onChange({ content: event.target.value })} style={{ ...field, minHeight: 80 }} />
      <button type="button" onClick={onRemove} style={ghost}>Hapus langkah</button>
    </div>
  );
}

const field: CSSProperties = { display: "block", width: "100%", marginTop: 6, border: "1px solid #e2e8f0", borderRadius: 10, padding: "10px 12px" };
const button: CSSProperties = { height: 42, border: "none", borderRadius: 999, background: "#059669", color: "#fff", fontWeight: 700, cursor: "pointer" };
const ghost: CSSProperties = { justifySelf: "start", border: "1px solid #e2e8f0", background: "#fff", borderRadius: 999, padding: "6px 12px", cursor: "pointer" };
