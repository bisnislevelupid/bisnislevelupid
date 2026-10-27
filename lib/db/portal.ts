import { cachedJson } from "@/lib/cache";
import { withPool } from "@/lib/db";
import { calculateResult, type AnswerCode, type AuditCode } from "@/lib/scoring";
import { AUDIT_BY_PHASE, codesFromUnlocked } from "@/lib/portal/labels";
import { lookupAuditNames } from "@/lib/db/public";

export type PortalCustomer = {
  id: string;
  name: string;
  email: string;
  business_name: string | null;
  business_field: string | null;
  business_start_year: number | null;
};

export type PortalOrder = {
  id: string;
  invoice_code: string;
  total_amount: string;
  status: string;
  paid_at: string | null;
  created_at: string;
  method_name: string | null;
  product_name: string;
  audits: string | null;
  audit_label: string;
};

export type InstrumentSection = {
  id: string;
  code: string;
  name: string;
  description: string | null;
};

export type InstrumentQuestion = {
  id: string;
  sectionId: string;
  number: number;
  text: string;
  guidance: string | null;
  isKey: boolean;
  allowNa: boolean;
};

export type Instrument = {
  auditId: string;
  code: string;
  name: string;
  passingScore: number;
  fromPhase: string;
  toPhase: string;
  crisis: string | null;
  nextPhase: string | null;
  sections: InstrumentSection[];
  questions: InstrumentQuestion[];
};

export type OwnedAudit = {
  code: string;
  name: string;
  orderId: string;
  session: {
    id: string;
    status: string;
    answered: number;
    total: number;
    locked: string[];
  } | null;
};

async function ensureColumns(pool: { query: (q: string) => Promise<unknown> }) {
  await pool.query(
    `ALTER TABLE test_sessions ADD COLUMN IF NOT EXISTS locked_section_ids text NOT NULL DEFAULT ''`,
  );
}

function hasId(id: string) {
  return /^\d+$/.test(id);
}

export async function getPortalCustomer(id: string): Promise<PortalCustomer | null> {
  if (!hasId(id)) return null;
  return withPool(async (pool) => {
    const { rows } = await pool.query(
      `SELECT id::text, name, email, business_name, business_field, business_start_year
       FROM customers WHERE id = $1 AND deleted_at IS NULL`,
      [id],
    );
    return (rows[0] as PortalCustomer | undefined) ?? null;
  });
}

export async function listPortalOrders(customerId: string): Promise<PortalOrder[]> {
  if (!hasId(customerId)) return [];
  return withPool(async (pool) => {
    const { rows } = await pool.query(
      `SELECT o.id::text, o.invoice_code, o.total_amount::text, o.status, o.paid_at::text, o.created_at::text,
              pm.name AS method_name,
              COALESCE(string_agg(oi.product_name, ', '), '') AS product_name,
              string_agg(oi.audit_ids_unlocked, ',') AS audits
       FROM orders o
       LEFT JOIN payment_methods pm ON pm.id = o.payment_method_id
       LEFT JOIN order_items oi ON oi.order_id = o.id
       WHERE o.customer_id = $1
       GROUP BY o.id, pm.name
       ORDER BY o.created_at DESC`,
      [customerId],
    );
    const orders = rows as Array<Omit<PortalOrder, "audit_label">>;
    const codes = [...new Set(orders.flatMap((order) => codesFromUnlocked(order.audits)))];
    const names = await lookupAuditNames(pool, codes);
    const byCode = new Map(codes.map((code, index) => [code, names[index] ?? code]));
    return orders.map((order) => ({
      ...order,
      audit_label: codesFromUnlocked(order.audits)
        .map((code) => byCode.get(code) ?? code)
        .join(", "),
    }));
  });
}

export async function participantCanAudit(customerId: string) {
  if (!hasId(customerId)) return false;
  return withPool(async (pool) => {
    const { rows } = await pool.query(
      `SELECT
         EXISTS (SELECT 1 FROM orders WHERE customer_id = $1 AND status = 'PAID') AS paid,
         EXISTS (
           SELECT 1 FROM test_sessions
           WHERE customer_id = $1 AND status IN ('NOT_STARTED', 'IN_PROGRESS')
         ) AS active`,
      [customerId],
    );
    const row = rows[0] as { paid: boolean; active: boolean } | undefined;
    return Boolean(row?.paid || row?.active);
  });
}

export async function listOwnedAudits(customerId: string): Promise<OwnedAudit[]> {
  if (!hasId(customerId)) return [];
  return withPool(async (pool) => {
    await ensureColumns(pool);
    const paid = await pool.query(
      `SELECT o.id::text AS order_id, string_agg(oi.audit_ids_unlocked, ',') AS audits
       FROM orders o
       JOIN order_items oi ON oi.order_id = o.id
       WHERE o.customer_id = $1 AND o.status = 'PAID'
       GROUP BY o.id
       ORDER BY o.paid_at DESC NULLS LAST`,
      [customerId],
    );
    const byCode = new Map<string, string>();
    for (const row of paid.rows as Array<{ order_id: string; audits: string | null }>) {
      for (const code of codesFromUnlocked(row.audits)) {
        if (!byCode.has(code)) byCode.set(code, row.order_id);
      }
    }
    if (byCode.size === 0) return [];
    const transitions = await pool.query(
      `SELECT id::text, code, name FROM audit_transitions WHERE code = ANY($1::text[]) ORDER BY sort_order`,
      [[...byCode.keys()]],
    );
    const sessions = await pool.query(
      `SELECT DISTINCT ON (audit_transition_id)
              id::text, audit_transition_id::text, status, answered_count, total_questions, locked_section_ids
       FROM test_sessions
       WHERE customer_id = $1
       ORDER BY audit_transition_id, created_at DESC`,
      [customerId],
    );
    const sessionByAudit = new Map(
      (sessions.rows as Array<{
        id: string;
        audit_transition_id: string;
        status: string;
        answered_count: number;
        total_questions: number;
        locked_section_ids: string;
      }>).map((row) => [row.audit_transition_id, row]),
    );
    const transitionByCode = new Map(
      (transitions.rows as Array<{ id: string; code: string; name: string }>).map((row) => [row.code, row]),
    );
    return [...byCode.entries()].flatMap(([code, orderId]) => {
      const transition = transitionByCode.get(code);
      if (!transition) return [];
      const session = sessionByAudit.get(transition.id);
      return [
        {
          code,
          name: transition.name,
          orderId,
          session: session
            ? {
                id: session.id,
                status: session.status,
                answered: session.answered_count,
                total: session.total_questions,
                locked: session.locked_section_ids.split(",").filter(Boolean),
              }
            : null,
        },
      ];
    });
  });
}

async function loadInstrument(code: string): Promise<Instrument | null> {
  return withPool(async (pool) => {
    const audit = await pool.query(
      `SELECT a.id::text, a.code, a.name, a.passing_score::text,
              pf.name_label AS from_phase, pt.name_label AS to_phase, pf.crisis_title AS crisis, pt.description AS next_phase
       FROM audit_transitions a
       JOIN phases pf ON pf.id = a.from_phase_id
       JOIN phases pt ON pt.id = a.to_phase_id
       WHERE a.code = $1 AND a.is_active = true`,
      [code],
    );
    const row = audit.rows[0] as
      | {
          id: string;
          code: string;
          name: string;
          passing_score: string;
          from_phase: string;
          to_phase: string;
          crisis: string | null;
          next_phase: string | null;
        }
      | undefined;
    if (!row) return null;
    const sections = await pool.query(
      `SELECT id::text, code, name, description FROM test_sections WHERE audit_transition_id = $1 ORDER BY sort_order, code`,
      [row.id],
    );
    const questions = await pool.query(
      `SELECT id::text, section_id::text, question_number, question_text, guidance_text, is_key, has_not_applicable
       FROM test_questions
       WHERE audit_transition_id = $1 AND is_active = true
       ORDER BY question_number`,
      [row.id],
    );
    return {
      auditId: row.id,
      code: row.code,
      name: row.name,
      passingScore: Number(row.passing_score),
      fromPhase: row.from_phase,
      toPhase: row.to_phase,
      crisis: row.crisis,
      nextPhase: row.next_phase,
      sections: sections.rows as InstrumentSection[],
      questions: (questions.rows as Array<{
        id: string;
        section_id: string;
        question_number: number;
        question_text: string;
        guidance_text: string | null;
        is_key: boolean;
        has_not_applicable: boolean;
      }>).map((question) => ({
        id: question.id,
        sectionId: question.section_id,
        number: question.question_number,
        text: question.question_text,
        guidance: question.guidance_text,
        isKey: question.is_key,
        allowNa: question.has_not_applicable,
      })),
    };
  });
}

export function getInstrument(code: string) {
  return cachedJson(`naikfase:audit:${code}`, 3600, () => loadInstrument(code));
}

export type SavedAnswer = { questionId: string; answer: AnswerCode; note: string | null };

export async function getSessionBundle(customerId: string, sessionId: string) {
  if (!hasId(customerId) || !hasId(sessionId)) return null;
  return withPool(async (pool) => {
    await ensureColumns(pool);
    const { rows } = await pool.query(
      `SELECT s.id::text, s.status, s.respondent_name, s.company_name, s.business_field,
              s.business_start_year, s.external_auditor_name, s.locked_section_ids,
              s.answered_count, s.total_questions, a.code AS audit_code
       FROM test_sessions s
       JOIN audit_transitions a ON a.id = s.audit_transition_id
       WHERE s.id = $1 AND s.customer_id = $2`,
      [sessionId, customerId],
    );
    const session = rows[0] as
      | {
          id: string;
          status: string;
          respondent_name: string | null;
          company_name: string | null;
          business_field: string | null;
          business_start_year: number | null;
          external_auditor_name: string | null;
          locked_section_ids: string;
          answered_count: number;
          total_questions: number;
          audit_code: string;
        }
      | undefined;
    if (!session) return null;
    const answers = await pool.query(
      `SELECT question_id::text, answer, note FROM test_answers WHERE session_id = $1`,
      [sessionId],
    );
    return {
      session: {
        ...session,
        locked: session.locked_section_ids.split(",").filter(Boolean),
      },
      answers: (answers.rows as Array<{ question_id: string; answer: AnswerCode; note: string | null }>).map((row) => ({
        questionId: row.question_id,
        answer: row.answer,
        note: row.note,
      })),
    };
  });
}

export async function startSession(input: {
  customerId: string;
  auditCode: string;
  orderId: string;
  respondentName: string;
  companyName: string;
  businessField: string;
  businessStartYear: number;
  externalAuditorName: string;
}) {
  const instrument = await getInstrument(input.auditCode);
  if (!instrument) return { ok: false as const, error: "Instrumen tidak ditemukan" };
  return withPool(async (pool) => {
    await ensureColumns(pool);
    const phaseKey = Object.entries(AUDIT_BY_PHASE).find(([, code]) => code === input.auditCode)?.[0] ?? "";
    const owned = await pool.query(
      `SELECT 1 FROM orders o
       JOIN order_items oi ON oi.order_id = o.id
       WHERE o.id = $1 AND o.customer_id = $2 AND o.status = 'PAID'
         AND (
           position(',' || $3 || ',' IN ',' || COALESCE(oi.audit_ids_unlocked, '') || ',') > 0
           OR position(',' || $4 || ',' IN ',' || COALESCE(oi.audit_ids_unlocked, '') || ',') > 0
         )`,
      [input.orderId, input.customerId, phaseKey, input.auditCode],
    );
    if (!owned.rows[0]) return { ok: false as const, error: "Audit ini belum terbuka di akun Anda" };
    const existing = await pool.query(
      `SELECT id::text, status FROM test_sessions
       WHERE customer_id = $1 AND audit_transition_id = $2
       ORDER BY created_at DESC LIMIT 1`,
      [input.customerId, instrument.auditId],
    );
    const prior = existing.rows[0] as { id: string; status: string } | undefined;
    if (prior?.status === "IN_PROGRESS") return { ok: true as const, sessionId: prior.id };
    if (prior?.status === "NOT_STARTED") {
      await pool.query(
        `UPDATE test_sessions
         SET respondent_name = $2, company_name = $3, business_field = $4, business_start_year = $5,
             external_auditor_name = $6, status = 'IN_PROGRESS', started_at = COALESCE(started_at, NOW()),
             total_questions = $7, updated_at = NOW()
         WHERE id = $1`,
        [
          prior.id,
          input.respondentName,
          input.companyName,
          input.businessField,
          input.businessStartYear,
          input.externalAuditorName || null,
          instrument.questions.length,
        ],
      );
      return { ok: true as const, sessionId: prior.id };
    }
    const created = await pool.query(
      `INSERT INTO test_sessions (
         customer_id, order_id, audit_transition_id, respondent_name, company_name, business_field,
         business_start_year, external_auditor_name, status, total_questions, started_at
       ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,'IN_PROGRESS',$9,NOW())
       RETURNING id::text`,
      [
        input.customerId,
        input.orderId,
        instrument.auditId,
        input.respondentName,
        input.companyName,
        input.businessField,
        input.businessStartYear,
        input.externalAuditorName || null,
        instrument.questions.length,
      ],
    );
    return { ok: true as const, sessionId: created.rows[0].id as string };
  });
}

function firstOpenIndex(questions: InstrumentQuestion[], answers: Map<string, AnswerCode>) {
  const index = questions.findIndex((question) => !answers.has(question.id));
  return index === -1 ? questions.length - 1 : index;
}

export async function saveAnswer(input: {
  customerId: string;
  sessionId: string;
  questionId: string;
  answer: AnswerCode;
  note: string;
}) {
  const bundle = await getSessionBundle(input.customerId, input.sessionId);
  if (!bundle) return { ok: false as const, error: "Sesi tidak ditemukan" };
  if (bundle.session.status !== "IN_PROGRESS") return { ok: false as const, error: "Sesi sudah dikunci" };
  const instrument = await getInstrument(bundle.session.audit_code);
  if (!instrument) return { ok: false as const, error: "Instrumen tidak ditemukan" };
  const question = instrument.questions.find((item) => item.id === input.questionId);
  if (!question) return { ok: false as const, error: "Butir tidak termasuk instrumen ini" };
  if (bundle.session.locked.includes(question.sectionId)) {
    return { ok: false as const, error: "Seksi ini sudah selesai dan tidak bisa diubah" };
  }
  if (input.answer === "TIDAK_BERLAKU" && !question.allowNa) {
    return { ok: false as const, error: "Butir ini tidak memiliki pilihan Tidak Berlaku" };
  }
  const inSection = instrument.questions.filter((item) => item.sectionId === question.sectionId);
  const known = new Map(bundle.answers.map((item) => [item.questionId, item.answer]));
  const openAt = firstOpenIndex(inSection, known);
  const targetAt = inSection.findIndex((item) => item.id === question.id);
  if (targetAt > openAt) return { ok: false as const, error: "Jawab butir sebelumnya terlebih dahulu" };

  return withPool(async (pool) => {
    await pool.query(
      `INSERT INTO test_answers (session_id, question_id, answer, note)
       VALUES ($1,$2,$3,$4)
       ON CONFLICT (session_id, question_id)
       DO UPDATE SET answer = EXCLUDED.answer, note = EXCLUDED.note, updated_at = NOW()`,
      [input.sessionId, input.questionId, input.answer, input.note || null],
    );
    await pool.query(
      `UPDATE test_sessions
       SET answered_count = (SELECT COUNT(*) FROM test_answers WHERE session_id = $1),
           status = 'IN_PROGRESS', updated_at = NOW()
       WHERE id = $1`,
      [input.sessionId],
    );
    return { ok: true as const };
  });
}

export async function lockSection(customerId: string, sessionId: string, sectionId: string) {
  const bundle = await getSessionBundle(customerId, sessionId);
  if (!bundle || bundle.session.status !== "IN_PROGRESS") return { ok: false as const, error: "Sesi tidak bisa dikunci" };
  const instrument = await getInstrument(bundle.session.audit_code);
  if (!instrument) return { ok: false as const, error: "Instrumen tidak ditemukan" };
  const section = instrument.sections.find((item) => item.id === sectionId);
  if (!section) return { ok: false as const, error: "Seksi tidak ditemukan" };
  const prior = instrument.sections.filter((item) => instrument.sections.indexOf(item) < instrument.sections.indexOf(section));
  if (prior.some((item) => !bundle.session.locked.includes(item.id))) {
    return { ok: false as const, error: "Selesaikan seksi sebelumnya terlebih dahulu" };
  }
  const required = instrument.questions.filter((item) => item.sectionId === sectionId);
  const known = new Set(bundle.answers.map((item) => item.questionId));
  if (required.some((item) => !known.has(item.id))) {
    return { ok: false as const, error: "Masih ada butir yang belum dijawab di seksi ini" };
  }
  if (bundle.session.locked.includes(sectionId)) return { ok: true as const };
  const locked = [...bundle.session.locked, sectionId].join(",");
  return withPool(async (pool) => {
    await pool.query(`UPDATE test_sessions SET locked_section_ids = $2, updated_at = NOW() WHERE id = $1`, [
      sessionId,
      locked,
    ]);
    return { ok: true as const };
  });
}

export async function submitSession(customerId: string, sessionId: string) {
  const bundle = await getSessionBundle(customerId, sessionId);
  if (!bundle || bundle.session.status !== "IN_PROGRESS") return { ok: false as const, error: "Sesi tidak bisa dikirim" };
  const instrument = await getInstrument(bundle.session.audit_code);
  if (!instrument) return { ok: false as const, error: "Instrumen tidak ditemukan" };
  const known = new Map(bundle.answers.map((item) => [item.questionId, item]));
  if (instrument.questions.some((item) => !known.has(item.id))) {
    return { ok: false as const, error: "Semua butir wajib dijawab sebelum submit" };
  }
  if (instrument.sections.some((item) => !bundle.session.locked.includes(item.id))) {
    return { ok: false as const, error: "Selesaikan setiap seksi sebelum submit" };
  }
  const scored = calculateResult({
    auditCode: instrument.code as AuditCode,
    passingScore: instrument.passingScore,
    questions: instrument.questions.map((question) => ({
      id: question.id,
      questionNumber: question.number,
      sectionCode: instrument.sections.find((section) => section.id === question.sectionId)?.code ?? "",
      isKey: question.isKey,
    })),
    answers: bundle.answers.map((item) => ({ questionId: item.questionId, answer: item.answer })),
  });

  return withPool(async (pool) => {
    const client = await pool.connect();
    try {
      await client.query("BEGIN");
      const phase = await client.query(
        `SELECT from_phase_id, to_phase_id FROM audit_transitions WHERE id = $1`,
        [instrument.auditId],
      );
      const counts = { ya: 0, tidak: 0, na: 0, keyYa: 0, keyTidak: 0, keyTotal: 0 };
      for (const question of instrument.questions) {
        const answer = known.get(question.id)?.answer;
        if (question.isKey) counts.keyTotal += 1;
        if (answer === "YA") counts.ya += 1;
        if (answer === "TIDAK") counts.tidak += 1;
        if (answer === "TIDAK_BERLAKU") counts.na += 1;
        if (question.isKey && answer === "YA") counts.keyYa += 1;
        if (question.isKey && answer === "TIDAK") counts.keyTidak += 1;
      }
      const inserted = await client.query(
        `INSERT INTO test_results (
           session_id, customer_id, audit_transition_id, total_questions, total_key_questions,
           answered_ya, answered_tidak, answered_na, key_ya, key_tidak, overall_score, key_pass,
           status, from_phase_id, to_phase_id
         ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15)
         RETURNING id::text`,
        [
          sessionId,
          customerId,
          instrument.auditId,
          instrument.questions.length,
          counts.keyTotal,
          counts.ya,
          counts.tidak,
          counts.na,
          counts.keyYa,
          counts.keyTidak,
          scored.score ?? 0,
          scored.kunciTidak === 0,
          scored.status,
          phase.rows[0].from_phase_id,
          phase.rows[0].to_phase_id,
        ],
      );
      const resultId = inserted.rows[0].id as string;
      for (const section of instrument.sections) {
        const questions = instrument.questions.filter((item) => item.sectionId === section.id);
        const part = scored.sections.find((item) => item.sectionCode === section.code);
        let ya = 0;
        let tidak = 0;
        let na = 0;
        let keyYa = 0;
        let keyTidak = 0;
        let keyTotal = 0;
        for (const question of questions) {
          const answer = known.get(question.id)?.answer;
          if (question.isKey) keyTotal += 1;
          if (answer === "YA") ya += 1;
          if (answer === "TIDAK") tidak += 1;
          if (answer === "TIDAK_BERLAKU") na += 1;
          if (question.isKey && answer === "YA") keyYa += 1;
          if (question.isKey && answer === "TIDAK") keyTidak += 1;
        }
        await client.query(
          `INSERT INTO result_section_scores (
             result_id, section_id, total_questions, total_key, ya_count, tidak_count, na_count,
             key_ya_count, key_tidak_count, score_pct, key_pass
           ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)`,
          [
            resultId,
            section.id,
            questions.length,
            keyTotal,
            ya,
            tidak,
            na,
            keyYa,
            keyTidak,
            part?.scorePct ?? 0,
            part?.keyPass ?? true,
          ],
        );
      }
      const triggers = await client.query(
        `SELECT rl.id::text AS recommendation_id, tq.id::text AS question_id, tq.is_key, ts.code AS section_code, rt.priority
         FROM test_answers ta
         JOIN test_questions tq ON tq.id = ta.question_id
         JOIN test_sections ts ON ts.id = tq.section_id
         JOIN recommendation_triggers rt ON rt.question_id = tq.id AND rt.trigger_on_answer = 'TIDAK' AND rt.is_active = true
         JOIN recommendation_library rl ON rl.id = rt.recommendation_id AND rl.is_active = true
         WHERE ta.session_id = $1 AND ta.answer = 'TIDAK'`,
        [sessionId],
      );
      const gap = new Map<string, number>();
      for (const row of triggers.rows as Array<{ section_code: string }>) {
        gap.set(row.section_code, (gap.get(row.section_code) ?? 0) + 1);
      }
      const ranked = (triggers.rows as Array<{
        recommendation_id: string;
        question_id: string;
        is_key: boolean;
        section_code: string;
        priority: number;
      }>).sort((a, b) => {
        if (a.is_key !== b.is_key) return a.is_key ? -1 : 1;
        if ((gap.get(b.section_code) ?? 0) !== (gap.get(a.section_code) ?? 0)) {
          return (gap.get(b.section_code) ?? 0) - (gap.get(a.section_code) ?? 0);
        }
        return a.priority - b.priority;
      });
      const seen = new Set<string>();
      for (const row of ranked) {
        if (seen.has(row.recommendation_id)) continue;
        seen.add(row.recommendation_id);
        await client.query(
          `INSERT INTO result_recommendations (result_id, recommendation_id, triggered_by_q_id, priority, is_key_trigger)
           VALUES ($1,$2,$3,$4,$5)
           ON CONFLICT (result_id, recommendation_id) DO NOTHING`,
          [resultId, row.recommendation_id, row.question_id, row.priority, row.is_key],
        );
      }
      await client.query(
        `UPDATE test_sessions SET status = 'COMPLETED', completed_at = NOW(), updated_at = NOW() WHERE id = $1`,
        [sessionId],
      );
      await client.query("COMMIT");
      return { ok: true as const, resultId };
    } catch (error) {
      await client.query("ROLLBACK");
      throw error;
    } finally {
      client.release();
    }
  });
}

export type ReportView = {
  sessionId: string;
  auditName: string;
  auditCode: string;
  company: string | null;
  respondent: string | null;
  completedAt: string | null;
  status: string;
  score: string;
  keyPass: boolean;
  keyTidak: number;
  keyTotal: number;
  ya: number;
  total: number;
  fromPhase: string;
  toPhase: string;
  crisis: string | null;
  nextPhase: string | null;
  pdfUrl: string | null;
  sections: Array<{ code: string; name: string; score: string; keyPass: boolean; tidak: number; color: string }>;
  gaps: Array<{ number: number; text: string; section: string; isKey: boolean }>;
  recommendations: Array<{ id: string; type: string; title: string; description: string | null; url: string | null; critical: boolean }>;
};

export async function getReport(customerId: string, sessionId: string): Promise<ReportView | null> {
  if (!hasId(customerId) || !hasId(sessionId)) return null;
  return withPool(async (pool) => {
    const { rows } = await pool.query(
      `SELECT r.id::text, r.session_id::text, r.status, r.overall_score::text, r.key_pass, r.key_tidak, r.total_key_questions,
              r.answered_ya, r.total_questions, r.pdf_url, s.completed_at::text, s.company_name, s.respondent_name,
              a.name AS audit_name, a.code AS audit_code, pf.name_label AS from_phase, pt.name_label AS to_phase,
              pf.crisis_title AS crisis, pt.description AS next_phase
       FROM test_results r
       JOIN test_sessions s ON s.id = r.session_id
       JOIN audit_transitions a ON a.id = r.audit_transition_id
       JOIN phases pf ON pf.id = r.from_phase_id
       JOIN phases pt ON pt.id = r.to_phase_id
       WHERE r.session_id = $1 AND r.customer_id = $2`,
      [sessionId, customerId],
    );
    const row = rows[0] as
      | {
          session_id: string;
          status: string;
          overall_score: string;
          key_pass: boolean;
          key_tidak: number;
          total_key_questions: number;
          answered_ya: number;
          total_questions: number;
          pdf_url: string | null;
          completed_at: string | null;
          company_name: string | null;
          respondent_name: string | null;
          audit_name: string;
          audit_code: string;
          from_phase: string;
          to_phase: string;
          crisis: string | null;
          next_phase: string | null;
        }
      | undefined;
    if (!row) return null;
    const sections = await pool.query(
      `SELECT ts.code, ts.name, rss.score_pct::text, rss.key_pass, rss.tidak_count
       FROM result_section_scores rss
       JOIN test_sections ts ON ts.id = rss.section_id
       JOIN test_results r ON r.id = rss.result_id
       WHERE r.session_id = $1
       ORDER BY ts.sort_order`,
      [sessionId],
    );
    const gaps = await pool.query(
      `SELECT tq.question_number, tq.question_text, tq.is_key, ts.name AS section_name
       FROM test_answers ta
       JOIN test_questions tq ON tq.id = ta.question_id
       JOIN test_sections ts ON ts.id = tq.section_id
       WHERE ta.session_id = $1 AND ta.answer = 'TIDAK'
       ORDER BY tq.is_key DESC, tq.question_number`,
      [sessionId],
    );
    const recs = await pool.query(
      `SELECT rl.id::text, rl.type, rl.title, rl.description, rl.external_url, rr.is_key_trigger
       FROM result_recommendations rr
       JOIN recommendation_library rl ON rl.id = rr.recommendation_id
       JOIN test_results r ON r.id = rr.result_id
       WHERE r.session_id = $1
       ORDER BY rr.is_key_trigger DESC, rr.priority`,
      [sessionId],
    );
    return {
      sessionId: row.session_id,
      auditName: row.audit_name,
      auditCode: row.audit_code,
      company: row.company_name,
      respondent: row.respondent_name,
      completedAt: row.completed_at,
      status: row.status,
      score: row.overall_score,
      keyPass: row.key_pass,
      keyTidak: row.key_tidak,
      keyTotal: row.total_key_questions,
      ya: row.answered_ya,
      total: row.total_questions,
      fromPhase: row.from_phase,
      toPhase: row.to_phase,
      crisis: row.crisis,
      nextPhase: row.next_phase,
      pdfUrl: row.pdf_url,
      sections: (sections.rows as Array<{ code: string; name: string; score_pct: string; key_pass: boolean; tidak_count: number }>).map(
        (section) => ({
          code: section.code,
          name: section.name,
          score: section.score_pct,
          keyPass: section.key_pass,
          tidak: section.tidak_count,
          color: Number(section.score_pct) >= 80 ? "#059669" : Number(section.score_pct) >= 60 ? "#d97706" : "#dc2626",
        }),
      ),
      gaps: (gaps.rows as Array<{ question_number: number; question_text: string; is_key: boolean; section_name: string }>).map(
        (gap) => ({ number: gap.question_number, text: gap.question_text, section: gap.section_name, isKey: gap.is_key }),
      ),
      recommendations: (recs.rows as Array<{
        id: string;
        type: string;
        title: string;
        description: string | null;
        external_url: string | null;
        is_key_trigger: boolean;
      }>).map((item) => ({
        id: item.id,
        type: item.type,
        title: item.title,
        description: item.description,
        url: item.external_url,
        critical: item.is_key_trigger,
      })),
    };
  });
}

export async function listReports(customerId: string) {
  if (!hasId(customerId)) return [];
  return withPool(async (pool) => {
    const { rows } = await pool.query(
      `SELECT r.session_id::text, a.name, r.status, r.overall_score::text AS score, s.company_name, s.completed_at::text
       FROM test_results r
       JOIN test_sessions s ON s.id = r.session_id
       JOIN audit_transitions a ON a.id = r.audit_transition_id
       WHERE r.customer_id = $1
       ORDER BY s.completed_at DESC NULLS LAST`,
      [customerId],
    );
    return rows as Array<{ session_id: string; name: string; status: string; score: string; company_name: string | null; completed_at: string | null }>;
  });
}

export async function listCatalog() {
  return withPool(async (pool) => {
    const { rows } = await pool.query(
      `SELECT id::text, code, name, short_desc, long_desc, type, price::text, price_strikethrough::text, includes_audit_ids
       FROM products WHERE is_active = true ORDER BY sort_order`,
    );
    return rows as Array<{
      id: string;
      code: string;
      name: string;
      short_desc: string | null;
      long_desc: string | null;
      type: string;
      price: string;
      price_strikethrough: string | null;
      includes_audit_ids: string | null;
    }>;
  });
}

export async function rememberPdf(sessionId: string, url: string) {
  return withPool(async (pool) => {
    await pool.query(`UPDATE test_results SET pdf_url = $2, pdf_generated_at = NOW() WHERE session_id = $1`, [sessionId, url]);
  });
}
