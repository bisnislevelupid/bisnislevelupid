import { fixedColumns } from "@/lib/admin/catalog";
import type { PanelList, PanelRecord, RelationOption } from "@/lib/admin/panel-types";

type ListQuery = { page: number; limit: number; q?: string; includeOptions?: boolean };
import {
  deleteCouponCode,
  getCouponCode,
  insertCouponCode,
  listCouponAuthorOptions,
  listCouponCodes,
  updateCouponCode,
} from "@/lib/db/coupon-codes";
import { deletePhase, getPhase, insertPhase, listPhases, updatePhase } from "@/lib/db/phases";
import {
  deleteProduct,
  getProduct,
  insertProduct,
  listProductCategoryOptions,
  listProducts,
  updateProduct,
} from "@/lib/db/products";

export function isFixedResource(table: string) {
  return table === "products" || table === "phases" || table === "coupon_codes";
}

async function optionsFor(table: string): Promise<Record<string, RelationOption[]>> {
  if (table === "products") return { category_id: await listProductCategoryOptions() };
  if (table === "coupon_codes") return { created_by: await listCouponAuthorOptions() };
  return {};
}

async function pageOf(table: string, query: ListQuery) {
  const page = Math.max(1, query.page || 1);
  const limit = Math.min(50, Math.max(1, query.limit || 10));
  const offset = (page - 1) * limit;
  const input = { limit, offset, q: query.q };
  if (table === "products") return { page, limit, ...(await listProducts(input)) };
  if (table === "phases") return { page, limit, ...(await listPhases(input)) };
  return { page, limit, ...(await listCouponCodes(input)) };
}

export async function listFixedResource(table: string, query: ListQuery): Promise<PanelList> {
  const columns = fixedColumns(table);
  if (!columns) throw new Error("unknown table");
  const listed = await pageOf(table, query);
  const relations = query.includeOptions ? await optionsFor(table) : undefined;
  return {
    columns,
    pk: "id",
    data: listed.rows,
    meta: {
      total: listed.total,
      page: listed.page,
      limit: listed.limit,
      total_pages: Math.max(1, Math.ceil(listed.total / listed.limit)),
    },
    readonly: false,
    filters: {},
    relations,
  };
}

export async function getFixedResource(table: string, id: string): Promise<PanelRecord> {
  const columns = fixedColumns(table);
  if (!columns) throw new Error("unknown table");
  const row = table === "products" ? await getProduct(id) : table === "phases" ? await getPhase(id) : await getCouponCode(id);
  return {
    columns,
    pk: "id",
    row,
    readonly: false,
    relations: await optionsFor(table),
  };
}

export async function mutateFixedResource(
  table: string,
  action: "insert" | "update" | "delete",
  body: Record<string, unknown>,
  id?: string,
) {
  if (action === "delete") {
    if (!id) throw new Error("ID wajib");
    if (table === "products") await deleteProduct(id);
    else if (table === "phases") await deletePhase(id);
    else await deleteCouponCode(id);
    return { ok: true };
  }
  if (action === "insert") {
    const created = table === "products" ? await insertProduct(body) : table === "phases" ? await insertPhase(body) : await insertCouponCode(body);
    return { id: created };
  }
  if (!id) throw new Error("ID wajib");
  const saved = table === "products" ? await updateProduct(id, body) : table === "phases" ? await updatePhase(id, body) : await updateCouponCode(id, body);
  return { id: saved };
}
