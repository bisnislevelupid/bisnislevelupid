import { withPool } from "@/lib/db";
import { isAdminTable } from "@/lib/admin/resources";

const READONLY = new Set(["id", "created_at", "updated_at", "paid_at", "sent_at"]);

export async function listResource(table: string, page: number, limit: number, q?: string) {
  if (!isAdminTable(table)) throw new Error("unknown table");
  const offset = (page - 1) * limit;
  return withPool(async (pool) => {
    const cols = await pool.query(
      `SELECT column_name, data_type, is_nullable
       FROM information_schema.columns
       WHERE table_schema='public' AND table_name=$1
       ORDER BY ordinal_position`,
      [table],
    );
    const names = cols.rows.map((c) => c.column_name as string);
    const pk = names.includes("id") ? "id" : names[0];
    const params: unknown[] = [];
    let where = "";
    if (q) {
      const textCols = cols.rows
        .filter((c) => ["text", "character varying"].includes(c.data_type))
        .map((c) => c.column_name as string);
      if (textCols.length) {
        params.push(`%${q}%`);
        where = `WHERE ${textCols.map((c) => `${c}::text ILIKE $1`).join(" OR ")}`;
      }
    }
    const total = await pool.query(`SELECT count(*)::int AS n FROM ${table} ${where}`, params);
    params.push(limit, offset);
    const data = await pool.query(
      `SELECT * FROM ${table} ${where} ORDER BY ${pk} DESC LIMIT $${params.length - 1} OFFSET $${params.length}`,
      params,
    );
    return {
      columns: cols.rows.map((c) => ({
        name: c.column_name as string,
        type: c.data_type as string,
        nullable: c.is_nullable === "YES",
        readonly: READONLY.has(c.column_name),
      })),
      pk,
      data: data.rows,
      meta: {
        total: total.rows[0].n as number,
        page,
        limit,
        total_pages: Math.max(1, Math.ceil((total.rows[0].n as number) / limit)),
      },
    };
  });
}

export async function getResource(table: string, id: string) {
  if (!isAdminTable(table)) throw new Error("unknown table");
  return withPool(async (pool) => {
    const cols = await pool.query(
      `SELECT column_name, data_type, is_nullable
       FROM information_schema.columns
       WHERE table_schema='public' AND table_name=$1
       ORDER BY ordinal_position`,
      [table],
    );
    const names = cols.rows.map((c) => c.column_name as string);
    const pk = names.includes("id") ? "id" : names[0];
    const row = await pool.query(`SELECT * FROM ${table} WHERE ${pk}::text = $1`, [id]);
    return {
      columns: cols.rows.map((c) => ({
        name: c.column_name as string,
        type: c.data_type as string,
        nullable: c.is_nullable === "YES",
        readonly: READONLY.has(c.column_name),
      })),
      pk,
      row: (row.rows[0] as Record<string, unknown> | undefined) ?? null,
    };
  });
}

export async function mutateResource(
  table: string,
  action: "insert" | "update" | "delete",
  body: Record<string, unknown>,
  id?: string,
) {
  if (!isAdminTable(table)) throw new Error("unknown table");
  return withPool(async (pool) => {
    const cols = await pool.query(
      `SELECT column_name, data_type FROM information_schema.columns
       WHERE table_schema='public' AND table_name=$1 ORDER BY ordinal_position`,
      [table],
    );
    const names = cols.rows.map((c) => c.column_name as string);
    const pk = names.includes("id") ? "id" : "key";
    if (action === "delete") {
      await pool.query(`DELETE FROM ${table} WHERE ${pk} = $1`, [id]);
      return { ok: true };
    }
    const writable = names.filter((n) => !READONLY.has(n) && n !== "id");
    const entries = writable.filter((n) => body[n] !== undefined);
    if (!entries.length) throw new Error("Tidak ada kolom untuk disimpan");
    const values = entries.map((n) => {
      const value = body[n];
      if (value === "" || value === null) return null;
      return value;
    });
    if (action === "insert") {
      const placeholders = entries.map((_, i) => `$${i + 1}`).join(",");
      const inserted = await pool.query(
        `INSERT INTO ${table} (${entries.join(",")}) VALUES (${placeholders}) RETURNING *`,
        values,
      );
      return inserted.rows[0];
    }
    const sets = entries.map((n, i) => `${n}=$${i + 1}`).join(",");
    values.push(id);
    const updated = await pool.query(
      `UPDATE ${table} SET ${sets} WHERE ${pk}=$${values.length} RETURNING *`,
      values,
    );
    return updated.rows[0];
  });
}

export async function dashboardStats() {
  return withPool(async (pool) => {
    const { rows } = await pool.query(`
      SELECT
        (SELECT count(*)::int FROM customers) AS customers,
        (SELECT count(*)::int FROM orders) AS orders,
        (SELECT count(*)::int FROM orders WHERE status='PAID') AS paid_orders,
        (SELECT COALESCE(sum(total_amount),0)::text FROM orders WHERE status='PAID') AS revenue,
        (SELECT count(*)::int FROM orders WHERE status='PENDING') AS pending_orders
    `);
    const recent = await pool.query(
      `SELECT * FROM (
         SELECT DISTINCT ON (o.id) o.invoice_code, o.customer_name, o.customer_email, o.total_amount::text, o.status,
                COALESCE(p.name, o.payment_type) AS product_name, m.name AS method_name, o.created_at
         FROM orders o
         LEFT JOIN order_items oi ON oi.order_id = o.id
         LEFT JOIN products p ON p.id = oi.product_id
         LEFT JOIN payment_methods m ON m.id = o.payment_method_id
         ORDER BY o.id, oi.id
       ) recent
       ORDER BY created_at DESC
       LIMIT 8`,
    );
    return { ...rows[0], recent: recent.rows };
  });
}
