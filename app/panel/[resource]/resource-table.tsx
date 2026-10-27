"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { formatCell, statusColor, statusText } from "@/lib/admin/format";
import { columnLabel, pickVisibleColumns, tableLabel } from "@/lib/admin/labels";
import type { PanelList, RelationOption } from "@/lib/admin/panel-types";

export type TableQuery = { page: number; q: string; audit: string; section: string };

function pageNumbers(current: number, pages: number): Array<number | "…"> {
  const shown = new Set<number>([1, pages, current - 2, current - 1, current, current + 1, current + 2]);
  const ordered = [...shown].filter((page) => page >= 1 && page <= pages).sort((a, b) => a - b);
  const items: Array<number | "…"> = [];
  for (const page of ordered) {
    const previous = items.at(-1);
    if (typeof previous === "number" && page - previous > 1) items.push("…");
    items.push(page);
  }
  return items;
}

export function ResourceTable({ resource, payload, query }: { resource: string; payload: PanelList; query: TableQuery }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [q, setQ] = useState(query.q);
  const [audit, setAudit] = useState(query.audit);
  const [section, setSection] = useState(query.section);
  const [applied, setApplied] = useState(query);
  if (applied.q !== query.q || applied.audit !== query.audit || applied.section !== query.section || applied.page !== query.page) {
    setApplied(query);
    setQ(query.q);
    setAudit(query.audit);
    setSection(query.section);
  }

  const audits = payload.filters.audit_transition_id ?? [];
  const sections = payload.filters.section_id ?? payload.filters.current_section_id ?? [];
  const sectionChoices = sections.filter((item) => !audit || item.parentId === audit);
  const visibleNames = pickVisibleColumns(resource, payload.columns.map((column) => column.name), payload.pk);
  const visible = visibleNames
    .map((name) => payload.columns.find((column) => column.name === name))
    .filter((column): column is PanelList["columns"][number] => Boolean(column));
  const readonly = payload.readonly;
  const filtered = Boolean(query.q || query.audit || query.section);

  function push(next: Partial<TableQuery>) {
    const merged = { ...query, ...next };
    const params = new URLSearchParams();
    if (merged.q.trim()) params.set("q", merged.q.trim());
    if (merged.audit) params.set("audit", merged.audit);
    if (merged.section) params.set("section", merged.section);
    if (merged.page > 1) params.set("page", String(merged.page));
    const suffix = params.toString();
    startTransition(() => {
      router.push(suffix ? `/panel/${resource}?${suffix}` : `/panel/${resource}`);
    });
  }

  function applySearch() {
    push({ page: 1, q, audit, section });
  }

  function changeAudit(value: string) {
    const stillValid = sections.some((item) => item.id === section && (!value || item.parentId === value));
    const nextSection = stillValid ? section : "";
    setAudit(value);
    setSection(nextSection);
    push({ page: 1, q, audit: value, section: nextSection });
  }

  function changeSection(value: string) {
    setSection(value);
    push({ page: 1, q, audit, section: value });
  }

  function remove(id: string) {
    toast("Hapus baris ini?", {
      action: {
        label: "Hapus",
        onClick: () =>
          void (async () => {
            const res = await fetch(`/api/panel/${resource}/${encodeURIComponent(id)}`, { method: "DELETE" });
            const json = await res.json().catch(() => ({}));
            if (!res.ok) {
              toast.error(json.error ?? "Gagal menghapus");
              return;
            }
            toast.success("Baris dihapus");
            startTransition(() => router.refresh());
          })(),
      },
      cancel: { label: "Batal", onClick: () => undefined },
    });
  }

  return (
    <div className="space-y-4" aria-busy={pending}>
      <form
        className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-end"
        onSubmit={(event) => {
          event.preventDefault();
          applySearch();
        }}
      >
        <label className="text-sm font-medium">
          Cari
          <input
            value={q}
            onChange={(event) => setQ(event.target.value)}
            placeholder="Teks soal, nama, atau kode"
            className="mt-1.5 block h-9 w-full rounded-md border border-border bg-background px-3 text-sm font-normal outline-none focus-visible:ring-2 focus-visible:ring-ring sm:w-64"
          />
        </label>
        {audits.length ? (
          <label className="text-sm font-medium">
            Audit
            <select
              value={audit}
              onChange={(event) => changeAudit(event.target.value)}
              className="mt-1.5 block h-9 w-full rounded-md border border-border bg-background px-3 text-sm font-normal outline-none focus-visible:ring-2 focus-visible:ring-ring sm:w-64"
            >
              <option value="">Semua audit</option>
              {audits.map((item) => (
                <option key={item.id} value={item.id}>{item.label}</option>
              ))}
            </select>
          </label>
        ) : null}
        {sections.length ? (
          <label className="text-sm font-medium">
            Seksi
            <select
              value={section}
              onChange={(event) => changeSection(event.target.value)}
              className="mt-1.5 block h-9 w-full rounded-md border border-border bg-background px-3 text-sm font-normal outline-none focus-visible:ring-2 focus-visible:ring-ring sm:w-64"
            >
              <option value="">Semua seksi</option>
              {sectionChoices.map((item) => (
                <option key={item.id} value={item.id}>{sectionOptionLabel(item, audit, audits)}</option>
              ))}
            </select>
          </label>
        ) : null}
        <div className="flex gap-2">
          <button type="submit" className="h-9 rounded-full border border-border bg-background px-4 text-sm font-medium">
            Cari
          </button>
          {readonly ? null : (
            <Link href={`/panel/${resource}/baru`} className="inline-flex h-9 items-center rounded-full bg-primary px-4 text-sm font-medium text-primary-foreground">
              Tambah
            </Link>
          )}
        </div>
      </form>
      {pending ? <p className="text-sm text-muted-foreground">Memuat data…</p> : null}
      <div className="overflow-auto rounded-lg border border-border bg-card">
        <table className="w-full text-left text-sm">
          <caption className="sr-only">{tableLabel(resource)}</caption>
          <thead className="border-b border-border">
            <tr>
              <th className="px-4 py-3 font-medium text-white">No</th>
              {visible.map((column) => (
                <th key={column.name} className="px-4 py-3 font-medium text-white">{columnLabel(column.name)}</th>
              ))}
              <th className="px-4 py-3 font-medium text-white">Aksi</th>
            </tr>
          </thead>
          <tbody>
            {payload.data.length === 0 ? (
              <tr>
                <td colSpan={visible.length + 2} className="px-4 py-10 text-center text-muted-foreground">
                  <p className="font-medium text-foreground">{filtered ? "Tidak ada data yang cocok dengan filter." : "Belum ada data."}</p>
                  {readonly || filtered ? null : (
                    <p className="mt-1">
                      Gunakan tombol Tambah untuk membuat data baru.
                    </p>
                  )}
                </td>
              </tr>
            ) : payload.data.map((row, index) => {
              const id = String(row[payload.pk]);
              return (
                <tr key={id} className="border-b border-border last:border-0 hover:bg-muted/70">
                  <td className="px-4 py-3">{(payload.meta.page - 1) * payload.meta.limit + index + 1}</td>
                  {visible.map((column) => {
                    const text = formatCell(column, row[column.name], row[`${column.name}__label`], row);
                    return (
                      <td key={column.name} className="px-4 py-3">
                        {column.name === "status" ? (
                          <span
                            className="inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold text-white"
                            style={{ background: statusColor(String(row[column.name] ?? "")) }}
                          >
                            {statusText(String(row[column.name] ?? ""))}
                          </span>
                        ) : (
                          <div className="max-w-[240px] truncate" title={text}>{text}</div>
                        )}
                      </td>
                    );
                  })}
                  <td className="whitespace-nowrap px-4 py-3">
                    {resource === "customers" ? (
                      <Link href={`/panel/customers/${encodeURIComponent(id)}/view`} className="mr-2 inline-flex rounded-full bg-sky-700 px-2.5 py-1 text-xs font-semibold text-white">Lihat</Link>
                    ) : null}
                    {readonly ? (
                      <Link href={`/panel/${resource}/${encodeURIComponent(id)}`} className="inline-flex rounded-full bg-sky-700 px-2.5 py-1 text-xs font-semibold text-white">Lihat</Link>
                    ) : (
                      <>
                        <Link href={`/panel/${resource}/${encodeURIComponent(id)}`} className="mr-2 inline-flex rounded-full bg-emerald-600 px-2.5 py-1 text-xs font-semibold text-white">Edit</Link>
                        <button type="button" className="inline-flex rounded-full bg-red-600 px-2.5 py-1 text-xs font-semibold text-white" onClick={() => remove(id)}>Hapus</button>
                      </>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <div className="flex flex-col gap-2 text-sm text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
        <span>{payload.meta.total} baris · halaman {payload.meta.page}/{payload.meta.total_pages}</span>
        <div className="flex flex-wrap gap-1">
          <Pager disabled={payload.meta.page <= 1 || pending} onClick={() => push({ page: payload.meta.page - 1 })}>Sebelumnya</Pager>
          {pageNumbers(payload.meta.page, payload.meta.total_pages).map((item, index) =>
            item === "…" ? (
              <span key={`gap-${index}`} className="px-1 leading-8">…</span>
            ) : (
              <Pager key={item} active={item === payload.meta.page} disabled={pending} onClick={() => push({ page: item })}>{item}</Pager>
            ),
          )}
          <Pager disabled={payload.meta.page >= payload.meta.total_pages || pending} onClick={() => push({ page: payload.meta.page + 1 })}>Berikutnya</Pager>
        </div>
      </div>
    </div>
  );
}

function sectionOptionLabel(item: RelationOption, audit: string, audits: RelationOption[]) {
  if (audit) return item.label;
  const parent = audits.find((entry) => entry.id === item.parentId);
  return parent ? `${parent.label} · ${item.label}` : item.label;
}

function Pager({
  children,
  disabled,
  active,
  onClick,
}: {
  children: React.ReactNode;
  disabled?: boolean;
  active?: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      className="h-8 min-w-8 rounded-md border border-border bg-background px-2 text-sm font-medium text-foreground disabled:opacity-40"
      style={active ? { background: "#059669", color: "#fff", borderColor: "#059669" } : undefined}
    >
      {children}
    </button>
  );
}
