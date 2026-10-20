"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

type Column = { name: string; type: string; nullable: boolean; readonly: boolean };
type Payload = {
  columns: Column[];
  pk: string;
  data: Record<string, unknown>[];
  meta: { total: number; page: number; limit: number; total_pages: number };
};

export function ResourceTable({ resource }: { resource: string }) {
  const [page, setPage] = useState(1);
  const [q, setQ] = useState("");
  const [payload, setPayload] = useState<Payload | null>(null);
  const [error, setError] = useState("");

  async function load(nextPage = page, query = q) {
    const res = await fetch(`/api/panel/${resource}?page=${nextPage}&limit=10&q=${encodeURIComponent(query)}`);
    const json = await res.json();
    if (!res.ok) setError(json.error ?? "Gagal memuat");
    else setPayload(json);
  }

  useEffect(() => {
    void load(1, "");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [resource]);

  async function remove(id: string) {
    if (!confirm("Hapus baris ini?")) return;
    await fetch(`/api/panel/${resource}/${encodeURIComponent(id)}`, { method: "DELETE" });
    await load();
  }

  async function uploadAsset(file: File, key: string) {
    const form = new FormData();
    form.set("file", file);
    form.set("key", key);
    const res = await fetch("/api/panel/upload", { method: "POST", body: form });
    const json = await res.json();
    if (!res.ok) setError(json.error ?? "Upload gagal");
    else await load();
  }

  const visible = (payload?.columns ?? [])
    .filter((col) => col.name === payload?.pk || !col.name.endsWith("_id"))
    .slice(0, 7);

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center">
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Cari teks"
          className="h-9 w-full rounded-md border border-border bg-background px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring sm:w-56"
        />
        <div className="flex gap-2">
          <button type="button" className="h-9 rounded-full border border-border bg-background px-4 text-sm font-medium" onClick={() => { setPage(1); void load(1, q); }}>
            Cari
          </button>
          <Link href={`/panel/${resource}/baru`} className="inline-flex h-9 items-center rounded-full bg-primary px-4 text-sm font-medium text-primary-foreground">
            Tambah
          </Link>
        </div>
      </div>
      {error ? <p className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-destructive">{error}</p> : null}
      {resource === "site_settings" ? (
        <div className="grid gap-3 rounded-lg border border-border bg-card p-4 md:grid-cols-2">
          <label className="text-sm font-medium">
            Favicon
            <input type="file" accept="image/*" className="mt-2 block text-sm" onChange={(e) => e.target.files?.[0] && uploadAsset(e.target.files[0], "favicon_url")} />
          </label>
          <label className="text-sm font-medium">
            Gambar OG
            <input type="file" accept="image/*" className="mt-2 block text-sm" onChange={(e) => e.target.files?.[0] && uploadAsset(e.target.files[0], "og_image_url")} />
          </label>
        </div>
      ) : null}
      <div className="overflow-auto rounded-lg border border-border bg-card">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-border bg-muted text-muted-foreground">
            <tr>
              {visible.map((col) => (
                <th key={col.name} className="px-4 py-3 font-medium">{col.name.replaceAll("_", " ")}</th>
              ))}
              <th className="px-4 py-3 font-medium">Aksi</th>
            </tr>
          </thead>
          <tbody>
            {payload?.data.map((row) => {
              const id = String(row[payload.pk]);
              return (
                <tr key={id} className="border-b border-border last:border-0 hover:bg-muted/70">
                  {visible.map((col) => (
                    <td key={col.name} className="max-w-[240px] truncate px-4 py-3">
                      {col.name === "status" ? (
                        <span className="rounded-full bg-muted px-2 py-0.5 text-xs font-semibold">{String(row[col.name] ?? "")}</span>
                      ) : (
                        String(row[col.name] ?? "")
                      )}
                    </td>
                  ))}
                  <td className="whitespace-nowrap px-4 py-3">
                    <Link href={`/panel/${resource}/${encodeURIComponent(id)}`} className="mr-2 inline-flex rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-primary">Edit</Link>
                    <button type="button" className="inline-flex rounded-full bg-red-50 px-2.5 py-1 text-xs font-semibold text-destructive" onClick={() => remove(id)}>Hapus</button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <div className="flex flex-col gap-2 text-sm text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
        <span>{payload?.meta.total ?? 0} baris · halaman {payload?.meta.page ?? 1}/{payload?.meta.total_pages ?? 1}</span>
        <div className="flex gap-2">
          <button type="button" disabled={page <= 1} className="h-8 rounded-md border border-border bg-background px-3 disabled:opacity-40" onClick={() => { setPage(page - 1); void load(page - 1); }}>Sebelumnya</button>
          <button type="button" disabled={!payload || page >= payload.meta.total_pages} className="h-8 rounded-md border border-border bg-background px-3 disabled:opacity-40" onClick={() => { setPage(page + 1); void load(page + 1); }}>Berikutnya</button>
        </div>
      </div>
    </div>
  );
}
