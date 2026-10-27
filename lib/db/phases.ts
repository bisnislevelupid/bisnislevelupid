import { withPool } from "@/lib/db";
import { mapWriteError, optionalInt, optionalText, requiredInt, requiredText } from "@/lib/db/write";

const SELECT = `SELECT id::text, phase_number, code, name_short, name_label, crisis_title, crisis_desc,
  description, icon_key, color_hex, sort_order
  FROM phases`;

export async function listPhases(input: { limit: number; offset: number; q?: string }) {
  return withPool(async (pool) => {
    const params: unknown[] = [];
    let where = "";
    const q = input.q?.trim();
    if (q) {
      params.push(`%${q}%`);
      where = `WHERE name_label ILIKE $1 OR name_short ILIKE $1 OR code ILIKE $1 OR COALESCE(crisis_title, '') ILIKE $1`;
    }
    const total = await pool.query(`SELECT count(*)::int AS n FROM phases ${where}`, params);
    const dataParams = [...params, input.limit, input.offset];
    const data = await pool.query(
      `${SELECT} ${where} ORDER BY sort_order, phase_number LIMIT $${dataParams.length - 1} OFFSET $${dataParams.length}`,
      dataParams,
    );
    return { total: Number(total.rows[0]?.n ?? 0), rows: data.rows as Record<string, unknown>[] };
  });
}

export async function getPhase(id: string) {
  return withPool(async (pool) => {
    const { rows } = await pool.query(`${SELECT} WHERE id::text = $1`, [id]);
    return (rows[0] as Record<string, unknown> | undefined) ?? null;
  });
}

function phaseValues(body: Record<string, unknown>) {
  const phaseNumber = requiredInt(body.phase_number, "Nomor fase");
  if (phaseNumber < 1 || phaseNumber > 5) throw new Error("Nomor fase harus 1 sampai 5");
  return [
    phaseNumber,
    requiredText(body.code, "Kode"),
    requiredText(body.name_short, "Nama singkat"),
    requiredText(body.name_label, "Nama fase"),
    optionalText(body.crisis_title),
    optionalText(body.crisis_desc),
    optionalText(body.description),
    optionalText(body.icon_key),
    optionalText(body.color_hex),
    optionalInt(body.sort_order, "Urutan") ?? phaseNumber,
  ];
}

export async function insertPhase(body: Record<string, unknown>) {
  const values = phaseValues(body);
  try {
    return await withPool(async (pool) => {
      const { rows } = await pool.query(
        `INSERT INTO phases (
           phase_number, code, name_short, name_label, crisis_title, crisis_desc, description, icon_key, color_hex, sort_order
         ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)
         RETURNING id::text`,
        values,
      );
      return String(rows[0].id);
    });
  } catch (error) {
    mapWriteError(error);
  }
}

export async function updatePhase(id: string, body: Record<string, unknown>) {
  const values = [...phaseValues(body), id];
  try {
    return await withPool(async (pool) => {
      const { rows } = await pool.query(
        `UPDATE phases SET
           phase_number=$1, code=$2, name_short=$3, name_label=$4, crisis_title=$5, crisis_desc=$6,
           description=$7, icon_key=$8, color_hex=$9, sort_order=$10
         WHERE id::text=$11
         RETURNING id::text`,
        values,
      );
      if (!rows[0]) throw new Error("Fase tidak ditemukan");
      return String(rows[0].id);
    });
  } catch (error) {
    if (error instanceof Error && error.message === "Fase tidak ditemukan") throw error;
    mapWriteError(error);
  }
}

export async function deletePhase(id: string) {
  try {
    return await withPool(async (pool) => {
      const { rowCount } = await pool.query(`DELETE FROM phases WHERE id::text = $1`, [id]);
      if (!rowCount) throw new Error("Fase tidak ditemukan");
    });
  } catch (error) {
    if (error instanceof Error && error.message === "Fase tidak ditemukan") throw error;
    mapWriteError(error);
  }
}
