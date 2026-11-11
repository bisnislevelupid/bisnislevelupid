import { withPool } from "@/lib/db";
import { storedSapaan } from "@/lib/validations/customer";

function missingColumn(error: unknown) {
  return Boolean(error && typeof error === "object" && "code" in error && (error as { code?: string }).code === "42703");
}

export async function getNamaSapaan(customerId: string) {
  if (!/^\d+$/.test(customerId)) return "";
  return withPool(async (pool) => {
    try {
      const { rows } = await pool.query(`SELECT nama_sapaan FROM customers WHERE id = $1 AND deleted_at IS NULL`, [
        customerId,
      ]);
      return String(rows[0]?.nama_sapaan ?? "").trim();
    } catch (error) {
      if (missingColumn(error)) return "";
      throw error;
    }
  });
}

export async function updateNamaSapaan(customerId: string, value: string) {
  if (!/^\d+$/.test(customerId)) return { ok: false as const, error: "Akun tidak ditemukan" };
  const stored = storedSapaan(value);
  return withPool(async (pool) => {
    try {
      const { rowCount } = await pool.query(
        `UPDATE customers SET nama_sapaan = $2, updated_at = NOW() WHERE id = $1 AND deleted_at IS NULL`,
        [customerId, stored],
      );
      if (!rowCount) return { ok: false as const, error: "Akun tidak ditemukan" };
      return { ok: true as const, namaSapaan: stored ?? "" };
    } catch (error) {
      if (missingColumn(error)) return { ok: false as const, error: "Kolom nama sapaan belum tersedia" };
      throw error;
    }
  });
}
