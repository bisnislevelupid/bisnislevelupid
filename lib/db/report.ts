import type { Pool } from "@neondatabase/serverless";
import { withPool } from "@/lib/db";
import { foundationFor } from "@/lib/portal/foundations";
import { customerGuidance } from "@/lib/pdf/guidance";
import { sectionScoreView } from "@/lib/pdf/format";
import type { ReportDocument, ReportGap, ReportRecommendation, ReportSection } from "@/lib/pdf/types";
import { calculateResult, type AnswerCode, type AuditCode, type GroupIndicator } from "@/lib/scoring";

type Queryable = Pick<Pool, "query">;

function missingSchema(error: unknown) {
  if (!error || typeof error !== "object" || !("code" in error)) return false;
  return (error as { code?: string }).code === "42P01" || (error as { code?: string }).code === "42703";
}

async function optionalRows<T>(pool: Queryable, sql: string, params: unknown[] = []) {
  try {
    const result = await pool.query(sql, params);
    return result.rows as T[];
  } catch (error) {
    if (missingSchema(error)) return [];
    throw error;
  }
}

function asAudit(code: string): AuditCode | null {
  if (code === "audit_1_2" || code === "audit_2_3" || code === "audit_3_4" || code === "audit_4_5") return code;
  return null;
}

export async function getSupportWhatsapp(pool?: Queryable) {
  const fromEnv = process.env.SUPPORT_WHATSAPP?.replace(/\D/g, "") ?? "";
  if (fromEnv) return fromEnv;
  const read = async (db: Queryable) => {
    const rows = await optionalRows<{ value: string | null }>(db, `SELECT value FROM site_settings WHERE key = 'support_whatsapp'`);
    const digits = String(rows[0]?.value ?? "").replace(/\D/g, "");
    return digits || null;
  };
  if (pool) return read(pool);
  return withPool(read);
}

export async function loadSessionIndicators(pool: Queryable, sessionId: string, auditCode: string, passingScore: number) {
  const audit = asAudit(auditCode);
  if (!audit) return { triad: null as GroupIndicator[] | null, agBlock: null as ReportDocument["agBlock"] };
  const rows = await pool.query(
    `SELECT tq.id::text AS id, tq.question_number, ts.code AS section_code, tq.is_key, ta.answer
     FROM test_answers ta
     JOIN test_questions tq ON tq.id = ta.question_id
     JOIN test_sections ts ON ts.id = tq.section_id
     WHERE ta.session_id = $1 AND tq.is_active = true`,
    [sessionId],
  );
  const scored = calculateResult({
    auditCode: audit,
    passingScore,
    questions: rows.rows.map((row) => ({
      id: String(row.id),
      questionNumber: Number(row.question_number),
      sectionCode: String(row.section_code),
      isKey: Boolean(row.is_key),
    })),
    answers: rows.rows.map((row) => ({ questionId: String(row.id), answer: String(row.answer) as AnswerCode })),
  });
  return { triad: scored.triad, agBlock: scored.agBlock };
}

function matchUpsell(condition: string | null, status: string, auditCode: string) {
  if (!condition) return false;
  return condition.split(";").every((part) => {
    const [key, raw] = part.split(":");
    const values = (raw ?? "").split(",").map((item) => item.trim()).filter(Boolean);
    if (key === "status") return values.includes(status);
    if (key === "audit") return values.includes(auditCode);
    if (key === "always") return true;
    return false;
  });
}

type AnswerRow = {
  question_number: number;
  question_text: string;
  guidance_text: string | null;
  guidance_audience: string | null;
  is_key: boolean;
  section_code: string;
  section_name: string;
  section_description: string | null;
  answer: string;
  why_it_matters: string | null;
  risk_if_no: string | null;
  action_steps: string | null;
  education_note: string | null;
  horizon: string | null;
};

export async function getReportDocument(customerId: string, sessionId: string, options?: { origin?: string }): Promise<ReportDocument | null> {
  if (!/^\d+$/.test(customerId) || !/^\d+$/.test(sessionId)) return null;
  return withPool(async (pool) => {
    const header = await pool.query(
      `SELECT r.session_id::text, r.status, r.overall_score::text AS overall_score, r.key_tidak, r.key_ya, r.total_key_questions,
              r.answered_ya, r.answered_tidak, r.answered_na, r.total_questions,
              s.completed_at::text, s.company_name, s.respondent_name, s.business_field, s.business_start_year, s.external_auditor_name,
              a.code AS audit_code, a.name AS audit_name, a.gate_desc, a.passing_score::text AS passing_score,
              pf.name_label AS from_phase, pt.name_label AS to_phase, pf.phase_number, pf.crisis_title, pf.crisis_desc, pt.description AS next_phase
       FROM test_results r
       JOIN test_sessions s ON s.id = r.session_id
       JOIN audit_transitions a ON a.id = r.audit_transition_id
       JOIN phases pf ON pf.id = r.from_phase_id
       JOIN phases pt ON pt.id = r.to_phase_id
       WHERE r.session_id = $1 AND r.customer_id = $2`,
      [sessionId, customerId],
    );
    const row = header.rows[0] as
      | {
          session_id: string;
          status: string;
          overall_score: string | null;
          key_tidak: number;
          key_ya: number;
          total_key_questions: number;
          answered_ya: number;
          answered_tidak: number;
          answered_na: number;
          total_questions: number;
          completed_at: string | null;
          company_name: string | null;
          respondent_name: string | null;
          business_field: string | null;
          business_start_year: number | null;
          external_auditor_name: string | null;
          audit_code: string;
          audit_name: string;
          gate_desc: string | null;
          passing_score: string;
          from_phase: string;
          to_phase: string;
          phase_number: number;
          crisis_title: string | null;
          crisis_desc: string | null;
          next_phase: string | null;
        }
      | undefined;
    if (!row) return null;

    const narrativeRows = await optionalRows<{ headline: string; summary: string; implication: string; focus: string }>(
      pool,
      `SELECT headline, summary, implication, focus FROM report_status_narratives WHERE audit_code = $1 AND status = $2`,
      [row.audit_code, row.status],
    );
    const closingRows = await optionalRows<{ closing_text: string; next_phase_title: string; next_phase_preview: string; prepare_text: string }>(
      pool,
      `SELECT closing_text, next_phase_title, next_phase_preview, prepare_text FROM phase_report_closings WHERE audit_code = $1`,
      [row.audit_code],
    );
    const education = await optionalRows<{
      section_code: string;
      measures: string;
      why_it_matters: string;
      concepts: string;
      framework: string;
      common_mistakes: string;
      strength_reading: string;
      gap_reading: string;
    }>(
      pool,
      `SELECT section_code, measures, why_it_matters, concepts, framework, common_mistakes, strength_reading, gap_reading
       FROM section_education WHERE audit_code = $1`,
      [row.audit_code],
    );
    const educationByCode = new Map(education.map((item) => [item.section_code, item]));
    const scoreRows = await pool.query(
      `SELECT ts.code, ts.name, ts.description, ts.sort_order, rss.score_pct::text AS score_pct, rss.key_pass,
              rss.ya_count, rss.tidak_count, rss.key_ya_count, rss.key_tidak_count, rss.total_questions, rss.total_key
       FROM result_section_scores rss
       JOIN test_sections ts ON ts.id = rss.section_id
       JOIN test_results r ON r.id = rss.result_id
       WHERE r.session_id = $1
       ORDER BY ts.sort_order`,
      [sessionId],
    );
    const answerSql = `SELECT tq.question_number, tq.question_text, tq.guidance_text, tq.is_key,
            ts.code AS section_code, ts.name AS section_name, ts.description AS section_description, ta.answer
     FROM test_answers ta
     JOIN test_questions tq ON tq.id = ta.question_id
     JOIN test_sections ts ON ts.id = tq.section_id
     WHERE ta.session_id = $1
     ORDER BY tq.question_number`;
    const richAnswers = await optionalRows<AnswerRow>(
      pool,
      `SELECT tq.question_number, tq.question_text, tq.guidance_text, tq.guidance_audience, tq.is_key,
              ts.code AS section_code, ts.name AS section_name, ts.description AS section_description, ta.answer,
              qc.why_it_matters, qc.risk_if_no, qc.action_steps, qc.education_note, qc.horizon
       FROM test_answers ta
       JOIN test_questions tq ON tq.id = ta.question_id
       JOIN test_sections ts ON ts.id = tq.section_id
       LEFT JOIN question_coaching qc ON qc.audit_code = $2 AND qc.question_number = tq.question_number
       WHERE ta.session_id = $1
       ORDER BY tq.question_number`,
      [sessionId, row.audit_code],
    );
    const basicAnswers = richAnswers.length
      ? richAnswers
      : (
          await pool.query(answerSql, [sessionId])
        ).rows.map((item) => ({ ...item, guidance_audience: null, why_it_matters: null, risk_if_no: null, action_steps: null, education_note: null, horizon: null })) as AnswerRow[];

    const sections = new Map<string, ReportSection>();
    for (const score of scoreRows.rows as Array<{
      code: string;
      name: string;
      description: string | null;
      score_pct: string | null;
      key_pass: boolean;
      ya_count: number;
      tidak_count: number;
      key_ya_count: number;
      key_tidak_count: number;
      total_questions: number;
      total_key: number;
    }>) {
      const view = sectionScoreView({
        score: score.score_pct,
        ya: Number(score.ya_count),
        tidak: Number(score.tidak_count),
        keyYa: Number(score.key_ya_count),
        keyTidak: Number(score.key_tidak_count),
      });
      const edu = educationByCode.get(score.code);
      sections.set(score.code, {
        code: score.code,
        name: score.name,
        description: score.description,
        score: view.score,
        keyPass: score.key_pass,
        tidak: Number(score.tidak_count),
        ya: Number(score.ya_count),
        total: Number(score.total_questions),
        keyTotal: Number(score.total_key),
        keyTidak: Number(score.key_tidak_count),
        measures: edu?.measures ?? null,
        whyItMatters: edu?.why_it_matters ?? null,
        concepts: edu?.concepts ?? null,
        framework: edu?.framework ?? null,
        commonMistakes: edu?.common_mistakes ?? null,
        strengthReading: edu?.strength_reading ?? null,
        gapReading: edu?.gap_reading ?? null,
        video: null,
        strengths: [],
        gaps: [],
      });
    }
    const videoRows = await optionalRows<{ section_code: string; youtube_url: string; title: string }>(
      pool,
      `SELECT section_code, youtube_url, title
       FROM section_videos
       WHERE audit_code = $1 AND is_active = true AND youtube_url LIKE 'https://www.youtube.com/watch?v=%'`,
      [row.audit_code],
    );
    for (const video of videoRows) {
      const section = sections.get(video.section_code);
      if (!section || !video.youtube_url || !video.title) continue;
      section.video = { url: video.youtube_url, title: video.title };
    }

    const skippedKeys: ReportDocument["skippedKeys"] = [];
    for (const answer of basicAnswers) {
      const section = sections.get(answer.section_code);
      if (!section) continue;
      if (answer.answer === "TIDAK_BERLAKU" && answer.is_key) {
        skippedKeys.push({ number: Number(answer.question_number), sectionName: answer.section_name, text: answer.question_text });
        continue;
      }
      if (answer.answer === "YA" && section.strengths.length < 8) {
        section.strengths.push({ number: Number(answer.question_number), text: answer.question_text, isKey: answer.is_key });
      }
      if (answer.answer !== "TIDAK") continue;
      const steps = String(answer.action_steps ?? "")
        .split("\n")
        .map((item) => item.trim())
        .filter(Boolean);
      const gapItem: ReportGap = {
        number: Number(answer.question_number),
        sectionCode: answer.section_code,
        sectionName: answer.section_name,
        text: answer.question_text,
        isKey: answer.is_key,
        guidance: customerGuidance(answer.guidance_text, answer.guidance_audience),
        why: answer.why_it_matters,
        risk: answer.risk_if_no,
        steps,
        education: answer.education_note,
        horizon: answer.horizon || (answer.is_key ? "30" : "60"),
      };
      section.gaps.push(gapItem);
    }
    for (const section of sections.values()) {
      section.strengths.sort((a, b) => Number(b.isKey) - Number(a.isKey) || a.number - b.number);
      section.gaps.sort((a, b) => Number(b.isKey) - Number(a.isKey) || a.number - b.number);
    }

    const triggered = await pool.query(
      `SELECT rl.id::text, rl.type, rl.title, rl.author_or_name, rl.description, rl.external_url, tq.is_key
       FROM test_answers ta
       JOIN test_questions tq ON tq.id = ta.question_id
       JOIN recommendation_triggers rt ON rt.question_id = tq.id AND rt.trigger_on_answer = 'TIDAK' AND rt.is_active = true
       JOIN recommendation_library rl ON rl.id = rt.recommendation_id AND rl.is_active = true
       WHERE ta.session_id = $1 AND ta.answer = 'TIDAK'
       ORDER BY tq.is_key DESC, rt.priority, rl.id`,
      [sessionId],
    );
    const statusRecs = await optionalRows<{ id: string; type: string; title: string; author_or_name: string | null; description: string | null; external_url: string | null }>(
      pool,
      `SELECT rl.id::text, rl.type, rl.title, rl.author_or_name, rl.description, rl.external_url
       FROM report_status_recommendations sr
       JOIN recommendation_library rl ON rl.id = sr.recommendation_id AND rl.is_active = true
       WHERE sr.audit_code = $1 AND sr.status = $2
       ORDER BY sr.sort_order, rl.id`,
      [row.audit_code, row.status],
    );
    const recommendations: ReportRecommendation[] = [];
    const seen = new Set<string>();
    for (const item of triggered.rows as Array<{ id: string; type: string; title: string; author_or_name: string | null; description: string | null; external_url: string | null; is_key: boolean }>) {
      if (seen.has(item.id)) continue;
      seen.add(item.id);
      recommendations.push({
        id: item.id,
        type: item.type,
        title: item.title,
        author: item.author_or_name,
        description: item.description,
        url: item.external_url,
        critical: item.is_key,
      });
    }
    for (const item of statusRecs) {
      if (seen.has(item.id)) continue;
      seen.add(item.id);
      recommendations.push({
        id: item.id,
        type: item.type,
        title: item.title,
        author: item.author_or_name,
        description: item.description,
        url: item.external_url,
        critical: false,
      });
    }

    const upsellRows = await optionalRows<{
      code: string;
      name: string;
      short_desc: string | null;
      price: string;
      cta_label: string | null;
      cta_url: string | null;
      trigger_condition: string | null;
      product_code: string | null;
    }>(
      pool,
      `SELECT u.code, u.name, u.short_desc, u.price::text, u.cta_label, u.cta_url, u.trigger_condition, p.code AS product_code
       FROM upsell_items u
       LEFT JOIN products p ON p.id = u.product_id
       WHERE u.is_active = true
       ORDER BY u.sort_order, u.id`,
    );
    const origin = (options?.origin || "https://bisnislevelup.id").replace(/\/$/, "");
    const upsells = upsellRows
      .filter((item) => row.status !== "TIDAK_DAPAT_DINILAI" && item.code && matchUpsell(item.trigger_condition, row.status, row.audit_code))
      .map((item) => {
        const offer = item.code.startsWith("fondasi-") ? foundationFor(row.audit_code) : null;
        return {
          code: item.code,
          name: item.name,
          summary: item.short_desc,
          modules: offer?.modules ?? null,
          price: Number(item.price),
          ctaLabel: item.cta_label,
          href: item.cta_url?.startsWith("http") ? item.cta_url : `${origin}${item.cta_url || "/akun/layanan"}`,
          productCode: item.product_code,
        };
      });
    const indicators = await loadSessionIndicators(pool, sessionId, row.audit_code, Number(row.passing_score));
    const whatsapp = await getSupportWhatsapp(pool);
    const versionRows = await optionalRows<{ pdf_version: number | null }>(
      pool,
      `SELECT pdf_version FROM test_results WHERE session_id = $1`,
      [sessionId],
    );
    const sapaanRows = await optionalRows<{ nama_sapaan: string | null }>(
      pool,
      `SELECT nama_sapaan FROM customers WHERE id = $1`,
      [customerId],
    );
    const coachRows = await optionalRows<{ name: string; role_line: string; bio: string }>(
      pool,
      `SELECT name, role_line, bio FROM report_coaches WHERE is_active = true ORDER BY id LIMIT 1`,
    );
    const pdfVersion = Number(versionRows[0]?.pdf_version ?? 1) || 1;
    const overall = row.status === "TIDAK_DAPAT_DINILAI" || row.overall_score === null ? null : Number(row.overall_score);

    return {
      sessionId: row.session_id,
      auditCode: row.audit_code,
      auditName: row.audit_name,
      gateDesc: row.gate_desc,
      passingScore: Number(row.passing_score),
      respondent: row.respondent_name,
      salutation: sapaanRows[0]?.nama_sapaan?.trim() || null,
      pdfVersion,
      coach: coachRows[0]
        ? { name: coachRows[0].name, roleLine: coachRows[0].role_line, bio: coachRows[0].bio }
        : null,
      company: row.company_name,
      businessField: row.business_field,
      startYear: row.business_start_year,
      externalAuditor: row.external_auditor_name,
      completedAt: row.completed_at,
      status: row.status,
      score: row.status === "TIDAK_DAPAT_DINILAI" ? null : overall,
      keyTidak: Number(row.key_tidak),
      keyYa: Number(row.key_ya),
      keyTotal: Number(row.total_key_questions),
      ya: Number(row.answered_ya),
      tidak: Number(row.answered_tidak),
      na: Number(row.answered_na),
      total: Number(row.total_questions),
      fromPhase: row.from_phase,
      toPhase: row.to_phase,
      fromPhaseNumber: Number(row.phase_number) || null,
      crisis: row.crisis_title,
      crisisDesc: row.crisis_desc,
      nextPhaseDescription: row.next_phase,
      narrative: narrativeRows[0] ?? null,
      closing: closingRows[0]
        ? {
            closingText: closingRows[0].closing_text,
            nextPhaseTitle: closingRows[0].next_phase_title,
            nextPhasePreview: closingRows[0].next_phase_preview,
            prepareText: closingRows[0].prepare_text,
          }
        : null,
      skippedKeys,
      sections: [...sections.values()],
      recommendations: row.status === "TIDAK_DAPAT_DINILAI" ? recommendations.filter((item) => item.type === "TOOL" || item.type === "BUKU") : recommendations,
      upsells,
      triad: indicators.triad,
      agBlock: indicators.agBlock,
      whatsapp,
      origin,
    };
  });
}
