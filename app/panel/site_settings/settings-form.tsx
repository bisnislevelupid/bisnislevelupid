"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { SITE_SETTING_FIELDS } from "@/lib/admin/setting-keys";

export function SettingsForm({ initial }: { initial: Record<string, string> }) {
  const router = useRouter();
  const [values, setValues] = useState(initial);
  const [pending, setPending] = useState(false);
  const [uploading, setUploading] = useState("");
  const [error, setError] = useState("");

  async function upload(file: File, key: string) {
    setUploading(key);
    setError("");
    const form = new FormData();
    form.set("file", file);
    form.set("key", key);
    const res = await fetch("/api/panel/upload", { method: "POST", body: form });
    const json = await res.json().catch(() => ({}));
    setUploading("");
    if (!res.ok) {
      setError(json.error ?? "Upload gagal");
      return;
    }
    const url = String(json.data?.url ?? "");
    setValues((prev) => ({ ...prev, [key]: url }));
    toast.success("Gambar disimpan");
    router.refresh();
  }

  async function save(event: React.FormEvent) {
    event.preventDefault();
    setPending(true);
    setError("");
    const body: Record<string, string> = {};
    for (const field of SITE_SETTING_FIELDS) body[field.key] = values[field.key] ?? "";
    const res = await fetch("/api/panel/managed/site-settings", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const json = await res.json().catch(() => ({}));
    setPending(false);
    if (!res.ok) {
      setError(json.error ?? "Gagal menyimpan");
      return;
    }
    toast.success("Pengaturan disimpan");
    router.refresh();
  }

  return (
    <form onSubmit={save} className="mx-auto max-w-3xl space-y-4 rounded-lg border border-border bg-card p-4 sm:p-6">
      {error ? <p role="alert" className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-destructive">{error}</p> : null}
      {SITE_SETTING_FIELDS.map((field) => (
        <label key={field.key} className="block text-sm font-medium">
          {field.label}
          <span className="mt-0.5 block text-xs font-normal text-muted-foreground">{field.hint}</span>
          {field.kind === "textarea" ? (
            <textarea
              value={values[field.key] ?? ""}
              onChange={(event) => setValues((prev) => ({ ...prev, [field.key]: event.target.value }))}
              className="mt-1.5 min-h-24 w-full rounded-md border border-border bg-background px-3 py-2 text-sm font-normal outline-none focus-visible:ring-2 focus-visible:ring-ring"
            />
          ) : null}
          {field.kind === "text" ? (
            <input
              value={values[field.key] ?? ""}
              onChange={(event) => setValues((prev) => ({ ...prev, [field.key]: event.target.value }))}
              className="mt-1.5 h-9 w-full rounded-md border border-border bg-background px-3 text-sm font-normal outline-none focus-visible:ring-2 focus-visible:ring-ring"
            />
          ) : null}
          {field.kind === "image" ? (
            <span className="mt-1.5 block space-y-2">
              {values[field.key] ? (
                <a href={values[field.key]} target="_blank" rel="noreferrer" className="inline-block">
                  {/* URL gambar situs bisa dari Blob; host-nya tidak didaftarkan di next/image. */}
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={values[field.key]} alt={field.label} className="max-h-24 rounded-md border border-border bg-muted object-contain" />
                </a>
              ) : (
                <span className="block text-sm font-normal text-muted-foreground">Belum ada gambar.</span>
              )}
              <input
                type="file"
                accept="image/*"
                className="block text-sm font-normal"
                onChange={(event) => {
                  const file = event.target.files?.[0];
                  if (file) void upload(file, field.key);
                }}
              />
              {uploading === field.key ? <span className="block text-xs font-normal text-muted-foreground">Mengunggah…</span> : null}
            </span>
          ) : null}
        </label>
      ))}
      <button disabled={pending} className="h-9 rounded-full bg-primary px-4 text-sm font-medium text-primary-foreground disabled:opacity-50">
        {pending ? "Menyimpan…" : "Simpan pengaturan"}
      </button>
    </form>
  );
}
