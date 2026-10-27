import { listSiteSettings } from "@/lib/admin/settings";
import { formatWib } from "@/lib/portal/labels";
import { SettingsForm } from "./settings-form";

export const dynamic = "force-dynamic";

export default async function SiteSettingsPage() {
  const rows = await listSiteSettings();
  const initial = Object.fromEntries(rows.map((row) => [row.key, row.value]));
  const latest = rows
    .map((row) => row.updatedAt)
    .filter((value): value is string => Boolean(value))
    .sort()
    .at(-1);
  return (
    <div>
      <h1 className="text-2xl font-semibold tracking-tight">Pengaturan situs</h1>
      <p className="mb-4 text-sm text-muted-foreground">
        Judul, deskripsi, dan gambar yang dipakai halaman publik.
        {latest ? ` Terakhir diubah ${formatWib(latest)}.` : " Belum ada nilai tersimpan."}
      </p>
      <SettingsForm initial={initial} />
    </div>
  );
}
