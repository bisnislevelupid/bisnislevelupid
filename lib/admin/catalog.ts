import type { PanelColumn } from "@/lib/admin/panel-types";

function col(name: string, type: string, nullable: boolean, readonly = false): PanelColumn {
  return { name, type, nullable, readonly };
}

export const PRODUCT_COLUMNS: PanelColumn[] = [
  col("id", "bigint", false, true),
  col("category_id", "bigint", false),
  col("code", "character varying", false),
  col("name", "character varying", false),
  col("short_desc", "character varying", true),
  col("long_desc", "text", true),
  col("type", "character varying", false),
  col("price", "bigint", false),
  col("price_strikethrough", "bigint", true),
  col("includes_audit_ids", "character varying", true),
  col("is_featured", "boolean", false),
  col("is_active", "boolean", false),
  col("sort_order", "smallint", false),
  col("created_at", "timestamp with time zone", false, true),
  col("updated_at", "timestamp with time zone", false, true),
];

export const PHASE_COLUMNS: PanelColumn[] = [
  col("id", "bigint", false, true),
  col("phase_number", "smallint", false),
  col("code", "character varying", false),
  col("name_short", "character varying", false),
  col("name_label", "character varying", false),
  col("crisis_title", "character varying", true),
  col("crisis_desc", "text", true),
  col("description", "text", true),
  col("icon_key", "character varying", true),
  col("color_hex", "character varying", true),
  col("sort_order", "smallint", false),
];

export const COUPON_COLUMNS: PanelColumn[] = [
  col("id", "bigint", false, true),
  col("code", "character varying", false),
  col("description", "character varying", true),
  col("discount_type", "character varying", false),
  col("discount_value", "numeric", false),
  col("min_purchase", "bigint", false),
  col("max_discount", "bigint", true),
  col("usage_limit", "integer", true),
  col("usage_count", "integer", false, true),
  col("usage_limit_per_user", "smallint", false),
  col("applicable_product_ids", "character varying", true),
  col("valid_from", "timestamp with time zone", false),
  col("valid_until", "timestamp with time zone", false),
  col("is_active", "boolean", false),
  col("created_by", "bigint", true),
  col("created_at", "timestamp with time zone", false, true),
];

export function fixedColumns(table: string) {
  if (table === "products") return PRODUCT_COLUMNS;
  if (table === "phases") return PHASE_COLUMNS;
  if (table === "coupon_codes") return COUPON_COLUMNS;
  return null;
}
