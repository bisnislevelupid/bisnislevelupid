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
       FROM payment_methods WHERE is_active = true ORDER BY sort_order`,
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
