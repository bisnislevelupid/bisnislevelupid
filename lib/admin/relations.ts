import type { RelationOption } from "@/lib/admin/panel-types";

export type RelationDef = {
  column: string;
  table: string;
  parentColumn?: string;
  /** Kolom pada baris yang sama yang menyaring pilihan (nilai = parentColumn di tabel acuan). */
  filterBy?: string;
  label: (alias: string) => string;
  orderBy: string;
};

export function sqlIdent(name: string) {
  if (!/^[a-z_][a-z0-9_]*$/.test(name)) throw new Error("Identitas SQL tidak valid");
  return `"${name}"`;
}

const phaseLabel = (alias: string) => `concat_ws(' — ', ${alias}.phase_number::text, ${alias}.name_label)`;
const auditLabel = (alias: string) => `concat_ws(' — ', ${alias}.code, ${alias}.name)`;
const sectionLabel = (alias: string) => `concat_ws(' — ', ${alias}.code, ${alias}.name)`;

export const RELATIONS: RelationDef[] = [
  { column: "audit_transition_id", table: "audit_transitions", label: auditLabel, orderBy: "sort_order, id" },
  {
    column: "section_id",
    table: "test_sections",
    parentColumn: "audit_transition_id",
    filterBy: "audit_transition_id",
    label: sectionLabel,
    orderBy: "audit_transition_id, sort_order, code",
  },
  {
    column: "current_section_id",
    table: "test_sections",
    parentColumn: "audit_transition_id",
    filterBy: "audit_transition_id",
    label: sectionLabel,
    orderBy: "audit_transition_id, sort_order, code",
  },
  { column: "from_phase_id", table: "phases", label: phaseLabel, orderBy: "sort_order, id" },
  { column: "to_phase_id", table: "phases", label: phaseLabel, orderBy: "sort_order, id" },
  {
    column: "question_id",
    table: "test_questions",
    label: (alias) => `concat_ws('. ', ${alias}.question_number::text, left(${alias}.question_text, 90))`,
    orderBy: "id",
  },
  {
    column: "triggered_by_q_id",
    table: "test_questions",
    label: (alias) => `concat_ws('. ', ${alias}.question_number::text, left(${alias}.question_text, 90))`,
    orderBy: "id",
  },
  { column: "recommendation_id", table: "recommendation_library", label: (alias) => `${alias}.title`, orderBy: "title, id" },
  { column: "category_id", table: "product_categories", label: (alias) => `${alias}.name`, orderBy: "sort_order, id" },
  { column: "product_id", table: "products", label: (alias) => `concat_ws(' — ', ${alias}.code, ${alias}.name)`, orderBy: "name, id" },
  { column: "internal_product_id", table: "upsell_items", label: (alias) => `${alias}.name`, orderBy: "sort_order, id" },
  {
    column: "customer_id",
    table: "customers",
    label: (alias) => `concat_ws(' · ', ${alias}.name, ${alias}.email)`,
    orderBy: "name, id",
  },
  { column: "payment_method_id", table: "payment_methods", label: (alias) => `${alias}.name`, orderBy: "sort_order, id" },
  {
    column: "affiliate_id",
    table: "affiliates",
    label: (alias) => `concat_ws(' · ', ${alias}.name, ${alias}.code)`,
    orderBy: "name, id",
  },
  { column: "coupon_code_id", table: "coupon_codes", label: (alias) => `${alias}.code`, orderBy: "code, id" },
  { column: "coupon_id", table: "coupon_codes", label: (alias) => `${alias}.code`, orderBy: "code, id" },
  { column: "order_id", table: "orders", label: (alias) => `coalesce(${alias}.invoice_code, ${alias}.id::text)`, orderBy: "id desc" },
  {
    column: "session_id",
    table: "test_sessions",
    label: (alias) => `concat_ws(' · ', NULLIF(${alias}.company_name, ''), NULLIF(${alias}.respondent_name, ''), '#' || ${alias}.id::text)`,
    orderBy: "id desc",
  },
  {
    column: "template_id",
    table: "notification_templates",
    label: (alias) => `concat_ws(' · ', ${alias}.event_trigger, ${alias}.channel)`,
    orderBy: "event_trigger, channel",
  },
  { column: "result_id", table: "test_results", label: (alias) => `'Hasil #' || ${alias}.id::text`, orderBy: "id desc" },
  { column: "created_by", table: "admins", label: (alias) => `concat_ws(' · ', ${alias}.name, ${alias}.email)`, orderBy: "name, id" },
];

export function relationsFor(columns: string[]) {
  const have = new Set(columns);
  return RELATIONS.filter((rel) => have.has(rel.column));
}

export function relationByColumn(column: string) {
  return RELATIONS.find((rel) => rel.column === column) ?? null;
}

export type { RelationOption };
