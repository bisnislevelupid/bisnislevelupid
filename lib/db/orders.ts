import { withPool } from "@/lib/db";
import { codesFromUnlocked } from "@/lib/portal/labels";

type Sql = {
  query: (text: string, params?: unknown[]) => Promise<{ rows: Array<Record<string, unknown>> }>;
};

function isSingleAudit(row: Record<string, unknown>) {
  return row.product_type === "SINGLE_AUDIT" || row.product_code === "audit-satu-fase";
}

/** Opens one NOT_STARTED session for a paid Audit Satu Fase order. Idempotent. */
export async function provisionPaidSessions(db: Sql, invoice: string) {
  const { rows } = await db.query(
    `SELECT o.id AS order_id, o.customer_id,
            oi.audit_ids_unlocked,
            p.type AS product_type, p.code AS product_code,
            c.name, c.business_name, c.business_field, c.business_start_year
     FROM orders o
     JOIN customers c ON c.id = o.customer_id
     JOIN order_items oi ON oi.order_id = o.id
     JOIN products p ON p.id = oi.product_id
     WHERE o.invoice_code = $1 AND o.status = 'PAID'`,
    [invoice],
  );
  for (const row of rows) {
    if (!isSingleAudit(row)) continue;
    const codes = codesFromUnlocked(row.audit_ids_unlocked == null ? null : String(row.audit_ids_unlocked));
    if (codes.length !== 1) continue;
    const audit = await db.query(
      `SELECT a.id,
              (SELECT count(*)::int FROM test_questions q
               WHERE q.audit_transition_id = a.id AND q.is_active = true) AS total
       FROM audit_transitions a
       WHERE a.code = $1 AND a.is_active = true`,
      [codes[0]],
    );
    const found = audit.rows[0];
    if (!found) continue;
    try {
      await db.query(
        `INSERT INTO test_sessions (
           customer_id, order_id, audit_transition_id, respondent_name, company_name,
           business_field, business_start_year, status, total_questions
         )
         SELECT $1, $2, $3, $4, $5, $6, $7, 'NOT_STARTED', $8
         WHERE NOT EXISTS (
           SELECT 1 FROM test_sessions
           WHERE customer_id = $1
             AND audit_transition_id = $3
             AND status IN ('NOT_STARTED', 'IN_PROGRESS')
         )`,
        [
          row.customer_id,
          row.order_id,
          found.id,
          row.name,
          row.business_name,
          row.business_field,
          row.business_start_year,
          found.total ?? 0,
        ],
      );
    } catch (error) {
      if ((error as { code?: string }).code === "23505") continue;
      throw error;
    }
  }
}

export async function provisionPaidSessionsByInvoice(invoice: string) {
  return withPool((pool) => provisionPaidSessions(pool, invoice));
}
