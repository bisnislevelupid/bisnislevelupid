"use client";

import { useState } from "react";
import Link from "next/link";
import { GripVertical } from "lucide-react";
import { DndContext, PointerSensor, closestCenter, useSensor, useSensors, type DragEndEvent } from "@dnd-kit/core";
import { SortableContext, arrayMove, useSortable, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { toast } from "sonner";
import { DeleteButton } from "../_components/delete-button";

type Row = {
  id: string;
  name: string;
  code: string;
  type: string;
  instruction_count: number;
  is_active: boolean;
};

export function MethodOrder({ rows }: { rows: Row[] }) {
  const [items, setItems] = useState(rows);
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 6 } }));

  async function onDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const oldIndex = items.findIndex((item) => item.id === active.id);
    const newIndex = items.findIndex((item) => item.id === over.id);
    const next = arrayMove(items, oldIndex, newIndex);
    setItems(next);
    const res = await fetch("/api/panel/managed/payment-order", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ids: next.map((item) => item.id) }),
    });
    if (!res.ok) {
      setItems(items);
      toast.error("Urutan metode gagal disimpan");
      return;
    }
    toast.success("Urutan metode mengikuti form checkout");
  }

  return (
    <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={(event) => void onDragEnd(event)}>
      <SortableContext items={items.map((item) => item.id)} strategy={verticalListSortingStrategy}>
        <div style={{ display: "flex", flexDirection: "column" }}>
          {items.map((row) => (
            <SortableMethod key={row.id} row={row} />
          ))}
        </div>
      </SortableContext>
    </DndContext>
  );
}

function SortableMethod({ row }: { row: Row }) {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id: row.id });
  return (
    <div
      ref={setNodeRef}
      style={{
        transform: CSS.Transform.toString(transform),
        transition,
        display: "grid",
        gridTemplateColumns: "28px 1.4fr .8fr .8fr .6fr .5fr auto",
        gap: 8,
        alignItems: "center",
        padding: "12px 14px",
        borderBottom: "1px solid #f1f5f9",
        background: "#fff",
      }}
    >
      <button type="button" aria-label="Geser urutan" {...attributes} {...listeners} style={{ border: "none", background: "transparent", cursor: "grab", color: "#64748b" }}>
        <GripVertical size={16} />
      </button>
      <span>{row.name}</span>
      <span>{row.code}</span>
      <span>{row.type}</span>
      <span>{row.instruction_count} langkah</span>
      <span>{row.is_active ? "Aktif" : "Nonaktif"}</span>
      <span>
        <Link href={`/panel/metode-bayar/${row.id}`} style={{ marginRight: 8, color: "#059669", fontWeight: 700 }}>Ubah</Link>
        <DeleteButton url={`/api/panel/managed/payment-bundle/${row.id}`} />
      </span>
    </div>
  );
}
