import { randomBytes } from "node:crypto";
import type { Pool } from "@neondatabase/serverless";
import { withPool } from "@/lib/db";
import { getFixedResource, isFixedResource, listFixedResource, mutateFixedResource } from "@/lib/admin/entities";
import { isAdminTable, isReadonlyResource } from "@/lib/admin/resources";
import { relationsFor, sqlIdent, type RelationDef } from "@/lib/admin/relations";
import type { PanelColumn, PanelList, PanelRecord, RelationOption } from "@/lib/admin/panel-types";
import { provisionPaidSessions } from "@/lib/db/orders";
import { notifyOrderPaid, siteOrigin } from "@/lib/email/notify";
import { runLater } from "@/lib/notify/later";

const READONLY = new Set(["id", "created_at", "updated_at", "paid_at", "sent_at"]);
const HIDDEN = new Set(["password_hash", "token_hash"]);
const SKIP_SEARCH = new Set(["password_hash", "token_hash", "request_payload", "response_payload", "qr_string"]);
const ADMIN_ROLES = new Set(["SUPERADMIN", "ADMIN", "FINANCE", "CONTENT", "SUPPORT"]);
const ADMIN_STATUS = new Set(["ACTIVE", "INACTIVE"]);
const FILTER_COLUMNS = new Set(["audit_transition_id", "section_id", "current_section_id"]);

export type ListQuery = {
  page: number;
  limit: number;
  q?: string;
  audit?: string;
  section?: string;
  includeOptions?: boolean;
};

function hideSecrets(row: Record<string, unknown> | null) {
  if (!row) return row;
  const copy = { ...row };
  delete copy.password_hash;
  delete copy.token_hash;
  return copy;
}

function assertDigits(value: string | undefined, label: string) {
  if (!value) return;
  if (!/^\d+$/.test(value)) throw new Error(`${label} tidak valid`);
}

async function loadColumns(pool: Pool, table: string) {
  const cols = await pool.query(
    `SELECT column_name, data_type, is_nullable
     FROM information_schema.columns
     WHERE table_schema = 'public' AND table_name = $1
     ORDER BY ordinal_position`,
    [table],
  );
  const names = cols.rows.map((column) => column.column_name as string);
  const columns: PanelColumn[] = cols.rows
    .filter((column) => !HIDDEN.has(column.column_name))
    .map((column) => ({
      name: column.column_name as string,
      type: column.data_type as string,
      nullable: column.is_nullable === "YES",
      readonly: READONLY.has(column.column_name),
    }));
  const pk = names.includes("id") ? "id" : names[0];
  return { columns, names, pk };
}

function joined(rels: RelationDef[]) {
  return rels.map((rel, index) => {
    const alias = `r${index}`;
    return {
      rel,
      alias,
      join: `LEFT JOIN ${sqlIdent(rel.table)} ${alias} ON ${alias}.id = t.${sqlIdent(rel.column)}`,
      expr: rel.label(alias),
    };
  });
}

async function loadOptions(pool: Pool, rels: RelationDef[]) {
  const unique = new Map<string, RelationDef>();
  for (const rel of rels) unique.set(rel.column, rel);
  const entries = await Promise.all(
    [...unique.values()].map(async (rel) => {
      if (!/^[a-z0-9_, ]+$/i.test(rel.orderBy)) throw new Error("Urutan tidak valid");
      const parent = rel.parentColumn ? `x.${sqlIdent(rel.parentColumn)}::text` : "NULL::text";
      const { rows } = await pool.query(
        `SELECT x.id::text AS id, ${rel.label("x")} AS label, ${parent} AS parent_id
         FROM ${sqlIdent(rel.table)} x
         ORDER BY ${rel.orderBy}`,
      );
      const options: RelationOption[] = rows.map((row) => ({
        id: String(row.id),
        label: String(row.label ?? row.id),
        parentId: row.parent_id == null ? null : String(row.parent_id),
      }));
      return [rel.column, options] as const;
    }),
  );
  return Object.fromEntries(entries) as Record<string, RelationOption[]>;
}

async function assertBelongs(
  pool: Pool,
  childTable: string,
  childId: unknown,
  parentColumn: string,
  parentId: unknown,
  missing: string,
  mismatch: string,
) {
  if (childId == null || childId === "") return;
  const { rows } = await pool.query(
    `SELECT ${sqlIdent(parentColumn)}::text AS parent_id FROM ${sqlIdent(childTable)} WHERE id::text = $1`,
    [String(childId)],
  );
  if (!rows[0]) throw new Error(missing);
  if (parentId != null && parentId !== "" && String(rows[0].parent_id) !== String(parentId)) throw new Error(mismatch);
}

export async function listResource(table: string, query: ListQuery): Promise<PanelList> {
  if (!isAdminTable(table)) throw new Error("unknown table");
  if (isFixedResource(table)) return listFixedResource(table, query);
  assertDigits(query.audit, "Audit");
  assertDigits(query.section, "Seksi");
  const page = Math.max(1, query.page || 1);
  const limit = Math.min(50, Math.max(1, query.limit || 10));
  const offset = (page - 1) * limit;
  return withPool(async (pool) => {
    const loaded = await loadColumns(pool, table);
    const rels = relationsFor(loaded.names);
    const links = joined(rels);
    const joinSql = links.map((link) => link.join).join("\n");
    const params: unknown[] = [];
    const where: string[] = [];
    const q = query.q?.trim();
    if (q) {
      const partsFor = (slot: string) => [
        ...loaded.names
          .filter((name) => !SKIP_SEARCH.has(name))
          .map((name) => `t.${sqlIdent(name)}::text ILIKE ${slot}`),
        ...links.map((link) => `${link.expr} ILIKE ${slot}`),
      ];
      const parts = partsFor("$SEARCH");
      if (parts.length) {
        params.push(`%${q}%`);
        where.push(`(${partsFor(`$${params.length}`).join(" OR ")})`);
      }
    }
    if (query.audit && loaded.names.includes("audit_transition_id")) {
      params.push(query.audit);
      where.push(`t.${sqlIdent("audit_transition_id")}::text = $${params.length}`);
    }
    if (query.section && loaded.names.includes("section_id")) {
      params.push(query.section);
      where.push(`t.${sqlIdent("section_id")}::text = $${params.length}`);
    } else if (query.section && loaded.names.includes("current_section_id")) {
      params.push(query.section);
      where.push(`t.${sqlIdent("current_section_id")}::text = $${params.length}`);
    }
    const whereSql = where.length ? `WHERE ${where.join(" AND ")}` : "";
    const fromSql = `FROM ${sqlIdent(table)} t ${joinSql}`;
    const total = await pool.query(`SELECT count(*)::int AS n ${fromSql} ${whereSql}`, params);
    const labelSelect = links.length
      ? `, ${links.map((link) => `${link.expr} AS ${sqlIdent(`${link.rel.column}__label`)}`).join(", ")}`
      : "";
    const dataParams = [...params, limit, offset];
    const data = await pool.query(
      `SELECT t.* ${labelSelect} ${fromSql} ${whereSql}
       ORDER BY t.${sqlIdent(loaded.pk)} DESC
       LIMIT $${dataParams.length - 1} OFFSET $${dataParams.length}`,
      dataParams,
    );
    const optionRels = query.includeOptions ? rels : rels.filter((rel) => FILTER_COLUMNS.has(rel.column));
    const options = await loadOptions(pool, optionRels);
    const filters: Record<string, RelationOption[]> = {};
    for (const rel of rels) {
      if (FILTER_COLUMNS.has(rel.column) && options[rel.column]) filters[rel.column] = options[rel.column];
    }
    const totalRows = Number(total.rows[0]?.n ?? 0);
    return {
      columns: loaded.columns,
      pk: loaded.pk,
      data: data.rows.map((row) => hideSecrets(row as Record<string, unknown>)) as Record<string, unknown>[],
      meta: {
        total: totalRows,
        page,
        limit,
        total_pages: Math.max(1, Math.ceil(totalRows / limit)),
      },
      readonly: isReadonlyResource(table),
      filters,
      relations: query.includeOptions ? options : undefined,
    };
  });
}

export async function getResource(table: string, id: string): Promise<PanelRecord> {
  if (!isAdminTable(table)) throw new Error("unknown table");
  if (isFixedResource(table)) return getFixedResource(table, id);
  return withPool(async (pool) => {
    const loaded = await loadColumns(pool, table);
    const rels = relationsFor(loaded.names);
    const links = joined(rels);
    const joinSql = links.map((link) => link.join).join("\n");
    const labelSelect = links.length
      ? `, ${links.map((link) => `${link.expr} AS ${sqlIdent(`${link.rel.column}__label`)}`).join(", ")}`
      : "";
    const row = await pool.query(
      `SELECT t.* ${labelSelect}
       FROM ${sqlIdent(table)} t
       ${joinSql}
       WHERE t.${sqlIdent(loaded.pk)}::text = $1`,
      [id],
    );
    const relations = await loadOptions(pool, rels);
    return {
      columns: loaded.columns,
      pk: loaded.pk,
      row: hideSecrets((row.rows[0] as Record<string, unknown> | undefined) ?? null),
      readonly: isReadonlyResource(table),
      relations,
    };
  });
}

export async function getCustomerProfile(id: string) {
  return withPool(async (pool) => {
    const customer = await pool.query(`SELECT * FROM customers WHERE id::text = $1`, [id]);
    const orders = await pool.query(
      `SELECT DISTINCT ON (o.id) o.invoice_code, o.status, o.total_amount, o.unique_amount, oi.product_name
       FROM orders o
       LEFT JOIN order_items oi ON oi.order_id = o.id
       WHERE o.customer_id::text = $1
       ORDER BY o.id DESC
       LIMIT 10`,
      [id],
    );
    return {
      customer: hideSecrets((customer.rows[0] as Record<string, unknown> | undefined) ?? null),
      orders: orders.rows as Record<string, unknown>[],
    };
  });
}

async function pairWithStored(
  pool: Pool,
  table: string,
  pk: string,
  id: string | undefined,
  payload: Record<string, unknown>,
  child: string,
  parent: string,
) {
  let childId = payload[child];
  let parentId = payload[parent];
  if (id && (childId === undefined || parentId === undefined)) {
    const prev = await pool.query(
      `SELECT ${sqlIdent(child)}::text AS child_id, ${sqlIdent(parent)}::text AS parent_id
       FROM ${sqlIdent(table)} WHERE ${sqlIdent(pk)}::text = $1`,
      [id],
    );
    if (childId === undefined) childId = prev.rows[0]?.child_id ?? null;
    if (parentId === undefined) parentId = prev.rows[0]?.parent_id ?? null;
  }
  return { childId, parentId };
}

export async function mutateResource(
  table: string,
  action: "insert" | "update" | "delete",
  body: Record<string, unknown>,
  id?: string,
) {
  if (!isAdminTable(table)) throw new Error("unknown table");
  if (isReadonlyResource(table)) throw new Error("Tabel ini hanya bisa dibaca");
  if (isFixedResource(table)) return mutateFixedResource(table, action, body, id);
  let invoiceJustPaid: string | null = null;
  let provisionInvoice: string | null = null;
  const saved = await withPool(async (pool) => {
    const cols = await pool.query(
      `SELECT column_name, data_type FROM information_schema.columns
       WHERE table_schema='public' AND table_name=$1 ORDER BY ordinal_position`,
      [table],
    );
    const names = cols.rows.map((column) => column.column_name as string);
    const pk = names.includes("id") ? "id" : "key";
    if (action === "delete") {
      await pool.query(`DELETE FROM ${sqlIdent(table)} WHERE ${sqlIdent(pk)} = $1`, [id]);
      return { ok: true };
    }
    const payload = { ...body };
    delete payload.password_hash;
    delete payload.token_hash;
    if (table === "orders" && String(payload.status ?? "") === "CANCELLED") {
      throw new Error("Pembatalan pesanan harus lewat aksi tolak beserta alasannya");
    }
    if (table === "admins") {
      if (payload.role !== undefined && !ADMIN_ROLES.has(String(payload.role))) throw new Error("Role tidak dikenal");
      if (payload.status !== undefined && !ADMIN_STATUS.has(String(payload.status))) throw new Error("Status tidak dikenal");
      if (action === "insert" && !names.includes("password_hash")) {
        throw new Error("Kolom kata sandi tidak ada");
      }
      if (action === "insert") payload.password_hash = `google-sso:${randomBytes(24).toString("hex")}`;
    }
    if (names.includes("section_id") && names.includes("audit_transition_id")) {
      const pair = await pairWithStored(pool, table, pk, id, payload, "section_id", "audit_transition_id");
      await assertBelongs(
        pool,
        "test_sections",
        pair.childId,
        "audit_transition_id",
        pair.parentId,
        "Seksi tidak ditemukan",
        "Seksi tidak termasuk audit yang dipilih",
      );
    }
    if (names.includes("current_section_id") && names.includes("audit_transition_id")) {
      const pair = await pairWithStored(pool, table, pk, id, payload, "current_section_id", "audit_transition_id");
      await assertBelongs(
        pool,
        "test_sections",
        pair.childId,
        "audit_transition_id",
        pair.parentId,
        "Seksi tidak ditemukan",
        "Seksi tidak termasuk audit yang dipilih",
      );
    }
    const writable = names.filter((name) => !READONLY.has(name) && name !== "id" && name !== "token_hash");
    const entries = writable.filter((name) => payload[name] !== undefined);
    if (!entries.length) throw new Error("Tidak ada kolom untuk disimpan");
    const values = entries.map((name) => {
      const value = payload[name];
      if (value === "" || value === null) return null;
      return value;
    });
    if (action === "insert") {
      const placeholders = entries.map((_, index) => `$${index + 1}`).join(",");
      const inserted = await pool.query(
        `INSERT INTO ${sqlIdent(table)} (${entries.map((name) => sqlIdent(name)).join(",")}) VALUES (${placeholders}) RETURNING *`,
        values,
      );
      return hideSecrets(inserted.rows[0] as Record<string, unknown>);
    }
    if (table === "orders" && String(payload.status ?? "") === "PAID" && id) {
      const prev = await pool.query(`SELECT status, invoice_code FROM orders WHERE id::text = $1`, [id]);
      if (prev.rows[0]) {
        provisionInvoice = String(prev.rows[0].invoice_code);
        if (prev.rows[0].status !== "PAID") invoiceJustPaid = provisionInvoice;
      }
    }
    const sets = entries.map((name, index) => `${sqlIdent(name)}=$${index + 1}`).join(",");
    values.push(id);
    const updated = await pool.query(
      `UPDATE ${sqlIdent(table)} SET ${sets} WHERE ${sqlIdent(pk)}=$${values.length} RETURNING *`,
      values,
    );
    if (invoiceJustPaid) {
      await pool.query(
        `UPDATE orders SET paid_at = COALESCE(paid_at, NOW()), updated_at = NOW() WHERE invoice_code = $1`,
        [invoiceJustPaid],
      );
    }
    if (provisionInvoice) await provisionPaidSessions(pool, provisionInvoice);
    return hideSecrets(updated.rows[0] as Record<string, unknown>);
  });
  if (invoiceJustPaid) runLater(() => notifyOrderPaid(invoiceJustPaid as string, siteOrigin()));
  return saved;
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
         SELECT DISTINCT ON (o.id) o.id::text, o.invoice_code, o.customer_name, o.customer_email, o.total_amount::text, o.status,
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
