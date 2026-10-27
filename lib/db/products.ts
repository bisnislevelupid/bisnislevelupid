import { withPool } from "@/lib/db";
import { asBool, mapWriteError, optionalInt, optionalText, requiredInt, requiredText } from "@/lib/db/write";

const TYPES = new Set(["SINGLE_AUDIT", "BUNDLE_AUDIT", "COACHING"]);

const SELECT = `SELECT p.id::text, p.category_id::text, c.name AS category_id__label, p.code, p.name,
  p.short_desc, p.long_desc, p.type, p.price::text, p.price_strikethrough::text,
  p.includes_audit_ids, p.is_featured, p.is_active, p.sort_order, p.created_at, p.updated_at
  FROM products p
  LEFT JOIN product_categories c ON c.id = p.category_id`;

export async function listProductCategoryOptions() {
  return withPool(async (pool) => {
    const { rows } = await pool.query(
      `SELECT id::text AS id, name AS label FROM product_categories ORDER BY sort_order, id`,
    );
    return rows.map((row) => ({ id: String(row.id), label: String(row.label ?? row.id), parentId: null }));
  });
}

export async function listProducts(input: { limit: number; offset: number; q?: string }) {
  return withPool(async (pool) => {
    const params: unknown[] = [];
    let where = "";
    const q = input.q?.trim();
    if (q) {
      params.push(`%${q}%`);
      where = `WHERE p.name ILIKE $1 OR p.code ILIKE $1 OR COALESCE(p.short_desc, '') ILIKE $1 OR COALESCE(p.type, '') ILIKE $1 OR COALESCE(c.name, '') ILIKE $1`;
    }
    const total = await pool.query(
      `SELECT count(*)::int AS n FROM products p LEFT JOIN product_categories c ON c.id = p.category_id ${where}`,
      params,
    );
    const dataParams = [...params, input.limit, input.offset];
    const data = await pool.query(
      `${SELECT} ${where} ORDER BY p.id DESC LIMIT $${dataParams.length - 1} OFFSET $${dataParams.length}`,
      dataParams,
    );
    return { total: Number(total.rows[0]?.n ?? 0), rows: data.rows as Record<string, unknown>[] };
  });
}

export async function getProduct(id: string) {
  return withPool(async (pool) => {
    const { rows } = await pool.query(`${SELECT} WHERE p.id::text = $1`, [id]);
    return (rows[0] as Record<string, unknown> | undefined) ?? null;
  });
}

function productValues(body: Record<string, unknown>) {
  const type = requiredText(body.type, "Tipe");
  if (!TYPES.has(type)) throw new Error("Tipe produk tidak dikenal");
  const price = requiredInt(body.price, "Harga");
  if (price < 0) throw new Error("Harga tidak boleh negatif");
  const strike = optionalInt(body.price_strikethrough, "Harga coret");
  return [
    requiredText(body.category_id, "Kategori"),
    requiredText(body.code, "Kode"),
    requiredText(body.name, "Nama"),
    optionalText(body.short_desc),
    optionalText(body.long_desc),
    type,
    price,
    strike,
    optionalText(body.includes_audit_ids),
    asBool(body.is_featured),
    asBool(body.is_active, true),
    optionalInt(body.sort_order, "Urutan") ?? 0,
  ];
}

export async function insertProduct(body: Record<string, unknown>) {
  const values = productValues(body);
  try {
    return await withPool(async (pool) => {
      const { rows } = await pool.query(
        `INSERT INTO products (
           category_id, code, name, short_desc, long_desc, type, price, price_strikethrough,
           includes_audit_ids, is_featured, is_active, sort_order
         ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12)
         RETURNING id::text`,
        values,
      );
      return String(rows[0].id);
    });
  } catch (error) {
    mapWriteError(error);
  }
}

export async function updateProduct(id: string, body: Record<string, unknown>) {
  const values = [...productValues(body), id];
  try {
    return await withPool(async (pool) => {
      const { rows } = await pool.query(
        `UPDATE products SET
           category_id=$1, code=$2, name=$3, short_desc=$4, long_desc=$5, type=$6, price=$7,
           price_strikethrough=$8, includes_audit_ids=$9, is_featured=$10, is_active=$11,
           sort_order=$12, updated_at=NOW()
         WHERE id::text=$13
         RETURNING id::text`,
        values,
      );
      if (!rows[0]) throw new Error("Produk tidak ditemukan");
      return String(rows[0].id);
    });
  } catch (error) {
    if (error instanceof Error && error.message === "Produk tidak ditemukan") throw error;
    mapWriteError(error);
  }
}

export async function deleteProduct(id: string) {
  return withPool(async (pool) => {
    const { rowCount } = await pool.query(`DELETE FROM products WHERE id::text = $1`, [id]);
    if (!rowCount) throw new Error("Produk tidak ditemukan");
  });
}
