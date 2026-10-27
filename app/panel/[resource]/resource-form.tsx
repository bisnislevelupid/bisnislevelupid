"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { columnLabel, fieldOptions, tableLabel } from "@/lib/admin/labels";
import { relationByColumn } from "@/lib/admin/relations";
import type { PanelColumn, RelationOption } from "@/lib/admin/panel-types";

function seedValues(columns: PanelColumn[], row: Record<string, unknown> | null | undefined, id?: string) {
  const createDefaults: Record<string, string> = { weight: "1", sort_order: "0", passing_score: "80", priority: "5", quantity: "1" };
  const initial: Record<string, string> = {};
  for (const column of columns) {
    const raw = id ? row?.[column.name] : undefined;
    if (column.type === "boolean") {
      if (raw == null) initial[column.name] = !id && column.name === "is_active" ? "true" : "false";
      else initial[column.name] = raw === true || raw === "true" ? "true" : "false";
    } else if (!id && raw == null && createDefaults[column.name]) {
      initial[column.name] = createDefaults[column.name];
    } else {
      initial[column.name] = raw == null ? "" : String(raw);
    }
  }
  return initial;
}

export function ResourceForm({
  resource,
  id,
  readOnly = false,
  initial,
}: {
  resource: string;
  id?: string;
  readOnly?: boolean;
  initial?: { columns: PanelColumn[]; relations: Record<string, RelationOption[]>; row?: Record<string, unknown> | null };
}) {
  const router = useRouter();
  const [columns, setColumns] = useState<PanelColumn[]>(initial?.columns ?? []);
  const [relations, setRelations] = useState<Record<string, RelationOption[]>>(initial?.relations ?? {});
  const [values, setValues] = useState<Record<string, string>>(() => seedValues(initial?.columns ?? [], initial?.row, id));
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);
  const [loading, setLoading] = useState(!initial);

  useEffect(() => {
    if (initial) return;
    const url = id
      ? `/api/panel/${resource}/${encodeURIComponent(id)}`
      : `/api/panel/${resource}?page=1&limit=1&options=1`;
    const controller = new AbortController();
    void fetch(url, { signal: controller.signal })
      .then(async (res) => {
        const json = await res.json();
        if (!res.ok) {
          setError(json.error ?? "Gagal memuat form");
          return;
        }
        const nextColumns = (json.columns ?? []) as PanelColumn[];
        setColumns(nextColumns);
        setRelations(json.relations ?? {});
        setValues(seedValues(nextColumns, json.row, id));
      })
      .catch((err: unknown) => {
        if (err instanceof DOMException && err.name === "AbortError") return;
        setError("Gagal memuat form");
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });
    return () => controller.abort();
  }, [resource, id, initial]);

  function setField(name: string, value: string) {
    setValues((prev) => {
      const next = { ...prev, [name]: value };
      for (const column of columns) {
        const meta = relationByColumn(column.name);
        if (meta?.filterBy !== name) continue;
        const current = next[column.name];
        const match = (relations[column.name] ?? []).find((option) => option.id === current);
        if (match && value && match.parentId !== value) next[column.name] = "";
      }
      return next;
    });
  }

  async function save(event: React.FormEvent) {
    event.preventDefault();
    if (readOnly) return;
    for (const column of columns) {
      if (column.readonly || column.nullable || column.type === "boolean") continue;
      if (!String(values[column.name] ?? "").trim()) {
        setError(`${columnLabel(column.name)} wajib diisi`);
        return;
      }
    }
    setPending(true);
    setError("");
    const body: Record<string, unknown> = {};
    columns.forEach((column) => {
      if (column.readonly) return;
      if (column.type === "boolean") body[column.name] = values[column.name] === "true";
      else {
        const raw = values[column.name] ?? "";
        body[column.name] = raw === "" ? null : raw;
      }
    });
    const res = await fetch(id ? `/api/panel/${resource}/${encodeURIComponent(id)}` : `/api/panel/${resource}`, {
      method: id ? "PATCH" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const json = await res.json().catch(() => ({}));
    setPending(false);
    if (!res.ok) {
      setError(json.error ?? "Gagal simpan");
      return;
    }
    toast.success("Tersimpan");
    router.push(`/panel/${resource}`);
    router.refresh();
  }

  if (loading) return <p className="text-sm text-muted-foreground">Memuat formulir…</p>;

  return (
    <form className="mx-auto max-w-3xl space-y-4 rounded-lg border border-border bg-card p-4 sm:p-6" onSubmit={save}>
      {readOnly ? <p className="rounded-md border border-border bg-muted px-3 py-2 text-sm text-muted-foreground">Tabel ini hanya bisa dibaca. Perubahan dari panel ditolak.</p> : null}
      {error ? <p className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-destructive" role="alert">{error}</p> : null}
      <div className="grid gap-4 sm:grid-cols-2">
        {columns.filter((column) => !column.readonly).map((column) => (
          <Field
            key={column.name}
            resource={resource}
            column={column}
            value={values[column.name] ?? ""}
            options={relations[column.name] ?? []}
            parentValue={relationByColumn(column.name)?.filterBy ? values[relationByColumn(column.name)?.filterBy ?? ""] ?? "" : ""}
            readOnly={readOnly}
            onChange={setField}
          />
        ))}
      </div>
      <div className="flex flex-wrap gap-2">
        {readOnly ? null : (
          <button disabled={pending} className="h-9 rounded-full bg-primary px-4 text-sm font-medium text-primary-foreground disabled:opacity-50">
            {pending ? "Menyimpan…" : "Simpan"}
          </button>
        )}
        <Link href={`/panel/${resource}`} className="inline-flex h-9 items-center rounded-full border border-border px-4 text-sm font-medium">
          {readOnly ? "Kembali" : "Batal"}
        </Link>
      </div>
      <p className="sr-only">{tableLabel(resource)}</p>
    </form>
  );
}

function Field({
  resource,
  column,
  value,
  options,
  parentValue,
  readOnly,
  onChange,
}: {
  resource: string;
  column: PanelColumn;
  value: string;
  options: RelationOption[];
  parentValue: string;
  readOnly: boolean;
  onChange: (name: string, value: string) => void;
}) {
  const label = columnLabel(column.name);
  const relation = relationByColumn(column.name);
  const enums = fieldOptions(resource, column.name);
  const wide = column.type === "text" || column.name.endsWith("_text") || column.name.endsWith("_desc");
  const inputClass = "mt-1.5 h-9 w-full rounded-md border border-border bg-background px-3 text-sm font-normal outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:bg-muted";

  let control: React.ReactNode;
  if (column.type === "boolean") {
    control = (
      <input
        type="checkbox"
        name={column.name}
        checked={value === "true"}
        disabled={readOnly}
        onChange={(event) => onChange(column.name, event.target.checked ? "true" : "false")}
        className="ml-2 size-4 accent-primary"
      />
    );
  } else if (relation) {
    const waiting = Boolean(relation.filterBy) && !parentValue;
    const choices = waiting ? [] : options.filter((option) => !relation.filterBy || option.parentId === parentValue);
    control = (
      <select
        name={column.name}
        value={value}
        required={!column.nullable && !readOnly}
        disabled={readOnly || waiting}
        onChange={(event) => onChange(column.name, event.target.value)}
        className={inputClass}
      >
        <option value="">{waiting ? "Pilih audit dulu" : column.nullable ? "— tidak ada —" : "Pilih"}</option>
        {choices.map((option) => (
          <option key={option.id} value={option.id}>{option.label}</option>
        ))}
      </select>
    );
  } else if (enums) {
    control = (
      <select
        name={column.name}
        value={value}
        required={!column.nullable && !readOnly}
        disabled={readOnly}
        onChange={(event) => onChange(column.name, event.target.value)}
        className={inputClass}
      >
        <option value="">{column.nullable ? "— tidak ada —" : "Pilih"}</option>
        {enums.map((option) => (
          <option key={option.value} value={option.value}>{option.label}</option>
        ))}
      </select>
    );
  } else if (column.type === "text" || column.name.endsWith("_text") || column.name.endsWith("_desc")) {
    control = (
      <textarea
        name={column.name}
        value={value}
        disabled={readOnly}
        onChange={(event) => onChange(column.name, event.target.value)}
        className="mt-1.5 min-h-28 w-full rounded-md border border-border bg-background px-3 py-2 text-sm font-normal outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:bg-muted"
      />
    );
  } else {
    control = (
      <input
        name={column.name}
        value={value}
        disabled={readOnly}
        inputMode={column.type.includes("int") || column.type === "numeric" ? "decimal" : undefined}
        onChange={(event) => onChange(column.name, event.target.value)}
        className={inputClass}
      />
    );
  }

  return (
    <label className={`text-sm font-medium ${wide ? "sm:col-span-2" : ""}`}>
      {label}
      {column.nullable || column.type === "boolean" ? null : <span className="text-destructive"> *</span>}
      {control}
    </label>
  );
}
