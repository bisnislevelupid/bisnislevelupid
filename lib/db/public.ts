import { withPool } from "@/lib/db";

export type ProductRow = {
  id: string;
  code: string;
  name: string;
  short_desc: string | null;
  price: string;
  price_strikethrough: string | null;
  is_featured: boolean;
  type: string;
};

export async function listPublicProducts() {
  return withPool(async (pool) => {
    const { rows } = await pool.query<ProductRow>(
      `SELECT id::text, code, name, short_desc, price::text, price_strikethrough::text, is_featured, type
       FROM products WHERE is_active = true ORDER BY sort_order`,
    );
    return rows;
  });
}

export async function listPhases() {
  return withPool(async (pool) => {
    const { rows } = await pool.query(
      `SELECT phase_number, name_short, name_label, crisis_title, description, color_hex
       FROM phases ORDER BY sort_order`,
    );
    return rows as Array<{
      phase_number: number;
      name_short: string;
      name_label: string;
      crisis_title: string;
      description: string;
      color_hex: string;
    }>;
  });
}

export async function listTestimonials() {
  return withPool(async (pool) => {
    const { rows } = await pool.query(
      `SELECT name, role, content, business_type, rating
       FROM testimonials WHERE is_active = true ORDER BY sort_order LIMIT 6`,
    );
    return rows as Array<{
      name: string;
      role: string | null;
      content: string;
      business_type: string | null;
      rating: number;
    }>;
  });
}

export async function listPaymentMethods() {
  return withPool(async (pool) => {
    const { rows } = await pool.query(
      `SELECT id::text, code, name, logo_url, type, provider, is_redirect
       FROM payment_methods
       WHERE is_active = true
       ORDER BY CASE WHEN provider = 'Manual' OR type = 'bank_transfer' THEN 0 ELSE 1 END, sort_order, id`,
    );
    return rows as Array<{
      id: string;
      code: string;
      name: string;
      logo_url: string | null;
      type: string;
      provider: string;
      is_redirect: boolean;
    }>;
  });
}

export async function getSiteSettings() {
  return withPool(async (pool) => {
    const { rows } = await pool.query(`SELECT key, value FROM site_settings`);
    const map: Record<string, string> = {};
    for (const row of rows) map[row.key] = row.value ?? "";
    return map;
  });
}

export type CheckoutProfile = {
  name: string;
  email: string;
  phone: string;
  businessName: string;
  businessField: string;
  businessCity: string;
  businessStartYear: string;
  employeeRange: string;
  monthlyRevenue: string;
  ownerRole: string;
  namaSapaan: string;
};

function missingColumn(error: unknown) {
  return Boolean(error && typeof error === "object" && "code" in error && (error as { code?: string }).code === "42703");
}

function displayPhone(value: string | null) {
  if (!value) return "";
  const compact = value.replace(/[\s-]/g, "");
  if (compact.startsWith("+62")) return `0${compact.slice(3)}`;
  if (compact.startsWith("62")) return `0${compact.slice(2)}`;
  return compact;
}

export async function getCheckoutProfile(customerId: string): Promise<CheckoutProfile | null> {
  if (!/^\d+$/.test(customerId)) return null;
  return withPool(async (pool) => {
    let rows: Array<Record<string, unknown>>;
    try {
      const result = await pool.query(
        `SELECT name, email, phone, business_name, business_field, business_city,
                business_start_year::text, employee_range, monthly_revenue, owner_role, nama_sapaan
         FROM customers
         WHERE id = $1 AND deleted_at IS NULL AND status = 'ACTIVE'`,
        [customerId],
      );
      rows = result.rows;
    } catch (error) {
      if (!missingColumn(error)) throw error;
      const result = await pool.query(
        `SELECT name, email, phone, business_name, business_field, business_city,
                business_start_year::text, employee_range, monthly_revenue, owner_role
         FROM customers
         WHERE id = $1 AND deleted_at IS NULL AND status = 'ACTIVE'`,
        [customerId],
      );
      rows = result.rows;
    }
    const row = rows[0];
    if (!row) return null;
    return {
      name: String(row.name ?? ""),
      email: String(row.email ?? ""),
      phone: displayPhone(row.phone == null ? null : String(row.phone)),
      businessName: String(row.business_name ?? ""),
      businessField: String(row.business_field ?? ""),
      businessCity: String(row.business_city ?? ""),
      businessStartYear: row.business_start_year == null ? "" : String(row.business_start_year),
      employeeRange: String(row.employee_range ?? ""),
      monthlyRevenue: String(row.monthly_revenue ?? ""),
      ownerRole: String(row.owner_role ?? ""),
      namaSapaan: String(row.nama_sapaan ?? ""),
    };
  });
}

export type AuditInstrument = { code: string; name: string };

export async function listAuditInstruments() {
  return withPool(async (pool) => {
    const { rows } = await pool.query<AuditInstrument>(
      `SELECT code, name
       FROM audit_transitions
       WHERE is_active = true
         AND code IN ('audit_1_2', 'audit_2_3', 'audit_3_4', 'audit_4_5')
       ORDER BY sort_order, id`,
    );
    return rows;
  });
}

type Sql = {
  query: (text: string, params?: unknown[]) => Promise<{ rows: Array<{ code: string; name: string }> }>;
};

export async function lookupAuditNames(db: Sql, codes: string[]) {
  if (!codes.length) return [];
  const { rows } = await db.query(
    `SELECT code, name FROM audit_transitions WHERE code = ANY($1::text[]) ORDER BY sort_order, id`,
    [codes],
  );
  const byCode = new Map(rows.map((row) => [row.code, row.name]));
  return codes.map((code) => byCode.get(code) ?? code);
}

export async function getProductByCode(code: string) {
  return withPool(async (pool) => {
    const { rows } = await pool.query(
      `SELECT id::text, code, name, short_desc, price::text, type, includes_audit_ids
       FROM products WHERE code = $1 AND is_active = true`,
      [code],
    );
    return rows[0] as
      | {
          id: string;
          code: string;
          name: string;
          short_desc: string | null;
          price: string;
          type: string;
          includes_audit_ids: string | null;
        }
      | undefined;
  });
}
