"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

type Column = { name: string; type: string; nullable: boolean; readonly: boolean };

export function ResourceForm({ resource, id }: { resource: string; id?: string }) {
  const router = useRouter();
  const [columns, setColumns] = useState<Column[]>([]);
  const [row, setRow] = useState<Record<string, unknown>>({});
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);

  useEffect(() => {
    const url = id ? `/api/panel/${resource}/${encodeURIComponent(id)}` : `/api/panel/${resource}?page=1&limit=1`;
    void fetch(url)
      .then(async (res) => {
        const json = await res.json();
        if (!res.ok) {
          setError(json.error ?? "Gagal memuat form");
          return;
        }
        setColumns(json.columns ?? []);
        if (id) setRow(json.row ?? {});
      })
      .catch(() => setError("Gagal memuat form"));
  }, [resource, id]);

  async function save(form: FormData) {
    setPending(true);
    setError("");
    const body: Record<string, unknown> = {};
    columns.forEach((col) => {
      if (col.readonly) return;
      if (col.type === "boolean") body[col.name] = form.get(col.name) === "on";
      else {
        const raw = form.get(col.name);
        if (raw === null) return;
        body[col.name] = raw === "" ? null : raw;
      }
    });
    const res = await fetch(id ? `/api/panel/${resource}/${encodeURIComponent(id)}` : `/api/panel/${resource}`, {
      method: id ? "PATCH" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const json = await res.json();
    setPending(false);
    if (!res.ok) {
      setError(json.error ?? "Gagal simpan");
      return;
    }
    router.push(`/panel/${resource}`);
    router.refresh();
  }

  return (
    <form key={id ? JSON.stringify(row) : "baru"} className="mx-auto max-w-3xl space-y-4 rounded-lg border border-border bg-card p-4 sm:p-6" action={save}>
      {error ? <p className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-destructive">{error}</p> : null}
      <div className="grid gap-4 sm:grid-cols-2">
        {columns.filter((col) => !col.readonly).map((col) => (
          <label key={col.name} className={`text-sm font-medium ${col.type === "text" ? "sm:col-span-2" : ""}`}>
            {col.name.replaceAll("_", " ")}
            {col.type === "boolean" ? (
              <input type="checkbox" name={col.name} defaultChecked={Boolean(row[col.name])} className="ml-2 size-4 accent-primary" />
            ) : col.type === "text" ? (
              <textarea name={col.name} defaultValue={String(row[col.name] ?? "")} className="mt-1.5 min-h-28 w-full rounded-md border border-border bg-background px-3 py-2 text-sm font-normal outline-none focus-visible:ring-2 focus-visible:ring-ring" />
            ) : (
              <input name={col.name} defaultValue={row[col.name] == null ? "" : String(row[col.name])} className="mt-1.5 h-9 w-full rounded-md border border-border bg-background px-3 text-sm font-normal outline-none focus-visible:ring-2 focus-visible:ring-ring" />
            )}
          </label>
        ))}
      </div>
      <div className="flex flex-wrap gap-2">
        <button disabled={pending} className="h-9 rounded-full bg-primary px-4 text-sm font-medium text-primary-foreground disabled:opacity-50">
          {pending ? "Menyimpan…" : "Simpan"}
        </button>
        <Link href={`/panel/${resource}`} className="inline-flex h-9 items-center rounded-full border border-border px-4 text-sm font-medium">
          Batal
        </Link>
      </div>
    </form>
  );
}
