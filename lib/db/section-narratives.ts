import { withPool } from "@/lib/db";

export type SectionNarrativeRow = {
  id: string;
  audit_code: string;
  section_code: string;
  section_name: string | null;
  content_status: string;
  reviewed_at: string | null;
};

export async function listSectionNarratives(): Promise<SectionNarrativeRow[]> {
  return withPool(async (pool) => {
    const { rows } = await pool.query(
      `SELECT se.id::text, se.audit_code, se.section_code, ts.name AS section_name,
              se.content_status, se.reviewed_at::text
       FROM section_education se
       LEFT JOIN audit_transitions a ON a.code = se.audit_code
       LEFT JOIN test_sections ts ON ts.audit_transition_id = a.id AND ts.code = se.section_code
       ORDER BY se.audit_code, se.section_code`,
    );
    return rows as SectionNarrativeRow[];
  });
}

export async function approveSectionNarrative(id: string, reviewer: string) {
  if (!/^\d+$/.test(id)) return { ok: false as const, error: "Seksi tidak ditemukan" };
  return withPool(async (pool) => {
    const client = await pool.connect();
    try {
      await client.query("BEGIN");
      const current = await client.query(
        `SELECT id::text, audit_code, section_code, content_status
         FROM section_education WHERE id = $1`,
        [id],
      );
      const row = current.rows[0] as
        | { id: string; audit_code: string; section_code: string; content_status: string }
        | undefined;
      if (!row) {
        await client.query("ROLLBACK");
        return { ok: false as const, error: "Seksi tidak ditemukan" };
      }
      if (row.content_status !== "APPROVED") {
        const updated = await client.query(
          `UPDATE section_education
           SET content_status = 'APPROVED', edited_in_panel = true, reviewed_by = $2, reviewed_at = NOW()
           WHERE id = $1 AND content_status = 'DRAFT'
           RETURNING id::text`,
          [id, reviewer],
        );
        if (!updated.rows[0]) {
          await client.query("ROLLBACK");
          return { ok: false as const, error: "Status seksi bukan draf" };
        }
        await client.query(
          `UPDATE question_coaching qc
           SET content_status = 'APPROVED', edited_in_panel = true, reviewed_by = $3, reviewed_at = NOW()
           WHERE qc.audit_code = $1
             AND qc.content_status = 'DRAFT'
             AND EXISTS (
               SELECT 1
               FROM test_questions tq
               JOIN test_sections ts ON ts.id = tq.section_id
               JOIN audit_transitions a ON a.id = tq.audit_transition_id
               WHERE a.code = qc.audit_code
                 AND tq.question_number = qc.question_number
                 AND ts.code = $2
             )`,
          [row.audit_code, row.section_code, reviewer],
        );
        await client.query(
          `UPDATE section_band_narratives sbn
           SET content_status = 'APPROVED', edited_in_panel = true, reviewed_by = $3, reviewed_at = NOW()
           WHERE sbn.content_status = 'DRAFT'
             AND sbn.section_id IN (
               SELECT ts.id
               FROM test_sections ts
               JOIN audit_transitions a ON a.id = ts.audit_transition_id
               WHERE a.code = $1 AND ts.code = $2
             )`,
          [row.audit_code, row.section_code, reviewer],
        );
        await client.query(
          `UPDATE question_insights qi
           SET content_status = 'APPROVED', edited_in_panel = true, reviewed_by = $3, reviewed_at = NOW()
           WHERE qi.content_status = 'DRAFT'
             AND qi.question_id IN (
               SELECT tq.id
               FROM test_questions tq
               JOIN test_sections ts ON ts.id = tq.section_id
               JOIN audit_transitions a ON a.id = tq.audit_transition_id
               WHERE a.code = $1 AND ts.code = $2
             )`,
          [row.audit_code, row.section_code, reviewer],
        );
      }
      await client.query("COMMIT");
      return { ok: true as const, status: "APPROVED" as const, auditCode: row.audit_code, sectionCode: row.section_code };
    } catch (error) {
      await client.query("ROLLBACK");
      throw error;
    } finally {
      client.release();
    }
  });
}
