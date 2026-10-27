import { withPool } from "@/lib/db";
import { isSiteSettingKey, SITE_SETTING_FIELDS, type SiteSettingKey } from "@/lib/admin/setting-keys";

export type SiteSettingRow = {
  key: SiteSettingKey;
  value: string;
  updatedAt: string | null;
};

export async function listSiteSettings() {
  return withPool(async (pool) => {
    const keys = SITE_SETTING_FIELDS.map((field) => field.key);
    const { rows } = await pool.query(
      `SELECT key, value, updated_at
       FROM site_settings
       WHERE key = ANY($1::text[])`,
      [keys],
    );
    const byKey = new Map(rows.map((row) => [String(row.key), row]));
    return SITE_SETTING_FIELDS.map((field) => {
      const row = byKey.get(field.key);
      return {
        key: field.key,
        value: row?.value == null ? "" : String(row.value),
        updatedAt: row?.updated_at ? String(row.updated_at) : null,
      } satisfies SiteSettingRow;
    });
  });
}

export async function saveSiteSettings(input: Record<string, unknown>) {
  const entries = Object.entries(input).filter(([key]) => isSiteSettingKey(key));
  if (!entries.length) throw new Error("Tidak ada pengaturan untuk disimpan");
  for (const [, value] of entries) {
    if (value != null && typeof value !== "string") throw new Error("Nilai pengaturan harus teks");
    if (typeof value === "string" && value.length > 2000) throw new Error("Nilai pengaturan terlalu panjang");
  }
  return withPool(async (pool) => {
    const client = await pool.connect();
    try {
      await client.query("BEGIN");
      for (const [key, value] of entries) {
        const stored = typeof value === "string" ? value.trim() : "";
        await client.query(
          `INSERT INTO site_settings (key, value, updated_at)
           VALUES ($1, $2, NOW())
           ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value, updated_at = NOW()`,
          [key, stored],
        );
      }
      await client.query("COMMIT");
    } catch (err) {
      await client.query("ROLLBACK");
      throw err;
    } finally {
      client.release();
    }
  });
}
