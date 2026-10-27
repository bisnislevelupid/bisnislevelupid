import { withPool } from "@/lib/db";
import { asBool, mapWriteError, optionalInt, optionalText, requiredNumber, requiredText } from "@/lib/db/write";

const SELECT = `SELECT c.id::text, c.code, c.description, c.discount_type, c.discount_value::text,
  c.min_purchase::text, c.max_discount::text, c.usage_limit, c.usage_count, c.usage_limit_per_user,
  c.applicable_product_ids, c.valid_from::text, c.valid_until::text, c.is_active, c.created_by::text,
  concat_ws(' · ', a.name, a.email) AS created_by__label, c.created_at
  FROM coupon_codes c
  LEFT JOIN admins a ON a.id = c.created_by`;

export async function listCouponAuthorOptions() {
  return withPool(async (pool) => {
    const { rows } = await pool.query(
      `SELECT id::text AS id, concat_ws(' · ', name, email) AS label FROM admins ORDER BY name, id`,
    );
    return rows.map((row) => ({ id: String(row.id), label: String(row.label ?? row.id), parentId: null }));
  });
}

export async function listCouponCodes(input: { limit: number; offset: number; q?: string }) {
  return withPool(async (pool) => {
    const params: unknown[] = [];
    let where = "";
    const q = input.q?.trim();
    if (q) {
      params.push(`%${q}%`);
      where = `WHERE c.code ILIKE $1 OR COALESCE(c.description, '') ILIKE $1`;
    }
    const total = await pool.query(
      `SELECT count(*)::int AS n FROM coupon_codes c LEFT JOIN admins a ON a.id = c.created_by ${where}`,
      params,
    );
    const dataParams = [...params, input.limit, input.offset];
    const data = await pool.query(
      `${SELECT} ${where} ORDER BY c.id DESC LIMIT $${dataParams.length - 1} OFFSET $${dataParams.length}`,
      dataParams,
    );
    return { total: Number(total.rows[0]?.n ?? 0), rows: data.rows as Record<string, unknown>[] };
  });
}

export async function getCouponCode(id: string) {
  return withPool(async (pool) => {
    const { rows } = await pool.query(`${SELECT} WHERE c.id::text = $1`, [id]);
    return (rows[0] as Record<string, unknown> | undefined) ?? null;
  });
}

function couponValues(body: Record<string, unknown>) {
  const discountType = requiredText(body.discount_type, "Jenis diskon");
  if (discountType !== "PERCENTAGE" && discountType !== "FLAT") throw new Error("Jenis diskon tidak dikenal");
  const validFrom = requiredText(body.valid_from, "Berlaku dari");
  const validUntil = requiredText(body.valid_until, "Berlaku sampai");
  if (Number.isNaN(new Date(validFrom).getTime()) || Number.isNaN(new Date(validUntil).getTime())) {
    throw new Error("Tanggal berlaku tidak valid");
  }
  return [
    requiredText(body.code, "Kode").toUpperCase(),
    optionalText(body.description),
    discountType,
    requiredNumber(body.discount_value, "Nilai diskon"),
    optionalInt(body.min_purchase, "Minimum belanja") ?? 0,
    optionalInt(body.max_discount, "Maksimum diskon"),
    optionalInt(body.usage_limit, "Batas pemakaian"),
    optionalInt(body.usage_limit_per_user, "Batas per pengguna") ?? 1,
    optionalText(body.applicable_product_ids),
    validFrom,
    validUntil,
    asBool(body.is_active, true),
    optionalText(body.created_by),
  ];
}

export async function insertCouponCode(body: Record<string, unknown>) {
  const values = couponValues(body);
  try {
    return await withPool(async (pool) => {
      const { rows } = await pool.query(
        `INSERT INTO coupon_codes (
           code, description, discount_type, discount_value, min_purchase, max_discount,
           usage_limit, usage_limit_per_user, applicable_product_ids, valid_from, valid_until,
           is_active, created_by
         ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13)
         RETURNING id::text`,
        values,
      );
      return String(rows[0].id);
    });
  } catch (error) {
    mapWriteError(error);
  }
}

export async function updateCouponCode(id: string, body: Record<string, unknown>) {
  const values = [...couponValues(body), id];
  try {
    return await withPool(async (pool) => {
      const { rows } = await pool.query(
        `UPDATE coupon_codes SET
           code=$1, description=$2, discount_type=$3, discount_value=$4, min_purchase=$5, max_discount=$6,
           usage_limit=$7, usage_limit_per_user=$8, applicable_product_ids=$9, valid_from=$10, valid_until=$11,
           is_active=$12, created_by=$13
         WHERE id::text=$14
         RETURNING id::text`,
        values,
      );
      if (!rows[0]) throw new Error("Kode kupon tidak ditemukan");
      return String(rows[0].id);
    });
  } catch (error) {
    if (error instanceof Error && error.message === "Kode kupon tidak ditemukan") throw error;
    mapWriteError(error);
  }
}

export async function deleteCouponCode(id: string) {
  try {
    return await withPool(async (pool) => {
      const { rowCount } = await pool.query(`DELETE FROM coupon_codes WHERE id::text = $1`, [id]);
      if (!rowCount) throw new Error("Kode kupon tidak ditemukan");
    });
  } catch (error) {
    if (error instanceof Error && error.message === "Kode kupon tidak ditemukan") throw error;
    mapWriteError(error);
  }
}
