export const SITE_SETTING_FIELDS = [
  { key: "site_title", label: "Judul situs", hint: "Judul yang tampil di tab peramban.", kind: "text" },
  { key: "site_description", label: "Deskripsi situs", hint: "Ringkasan untuk mesin pencari.", kind: "textarea" },
  { key: "og_title", label: "Judul saat dibagikan", hint: "Kosongkan untuk memakai judul situs.", kind: "text" },
  { key: "og_description", label: "Deskripsi saat dibagikan", hint: "Kosongkan untuk memakai deskripsi situs.", kind: "textarea" },
  { key: "favicon_url", label: "Favicon", hint: "Ikon kecil di tab peramban.", kind: "image" },
  { key: "og_image_url", label: "Gambar saat dibagikan", hint: "Gambar pratinjau di media sosial.", kind: "image" },
] as const;

export type SiteSettingKey = (typeof SITE_SETTING_FIELDS)[number]["key"];

const ALLOWED = new Set<string>(SITE_SETTING_FIELDS.map((field) => field.key));

export function isSiteSettingKey(value: string): value is SiteSettingKey {
  return ALLOWED.has(value);
}
