import { execFileSync } from "node:child_process";
import { mkdirSync, writeFileSync } from "node:fs";
import path from "node:path";
import { createRequire } from "node:module";
import { calculateResult, type AnswerCode, type AuditCode } from "../lib/scoring";
import { buildReportPdf } from "../lib/pdf/report";
import { getReportDocument } from "../lib/db/report";

const require = createRequire(import.meta.url);
const { Pool } = require("pg") as {
  Pool: new (config: { connectionString: string }) => {
    query: (sql: string, params?: unknown[]) => Promise<{ rows: Array<Record<string, unknown>> }>;
    end: () => Promise<void>;
  };
};

const url = process.env.DATABASE_URL ?? "";
if (!url || /neon\.tech/i.test(url)) throw new Error("Sampel hanya boleh memakai Postgres lokal lewat DATABASE_URL");

type Scenario = {
  marker: string;
  audit: AuditCode;
  statusHint: string;
  answer: (question: { number: number; isKey: boolean; section: string }, indexAmongPlain: { n: number }) => AnswerCode;
  storeZero: boolean;
};

const scenarios: Scenario[] = [
  {
    marker: "Sampel SIAP_NAIK",
    audit: "audit_1_2",
    statusHint: "SIAP_NAIK",
    storeZero: false,
    answer: (question) => (question.number === 47 ? "TIDAK_BERLAKU" : "YA"),
  },
  {
    marker: "Sampel HAMPIR",
    audit: "audit_2_3",
    statusHint: "HAMPIR",
    storeZero: false,
    answer: (question, plain) => {
      if (question.isKey) return "YA";
      plain.n += 1;
      return plain.n % 10 < 7 ? "YA" : "TIDAK";
    },
  },
  {
    marker: "Sampel BELUM_SIAP",
    audit: "audit_3_4",
    statusHint: "BELUM_SIAP",
    storeZero: false,
    answer: (question) => (question.number === 48 ? "TIDAK" : "YA"),
  },
  {
    marker: "Sampel DALAM_BAHAYA",
    audit: "audit_4_5",
    statusHint: "DALAM_BAHAYA",
    storeZero: false,
    answer: (question) => {
      if (question.isKey) return [1, 2, 8].includes(question.number) ? "TIDAK" : "YA";
      return question.number % 5 === 0 ? "YA" : "TIDAK";
    },
  },
  {
    marker: "Sampel PERLU_FONDASI",
    audit: "audit_2_3",
    statusHint: "PERLU_FONDASI",
    storeZero: false,
    answer: (question, plain) => {
      if (question.isKey) return "YA";
      plain.n += 1;
      return plain.n % 5 < 2 ? "YA" : "TIDAK";
    },
  },
  {
    marker: "Sampel TIDAK_DAPAT_DINILAI",
    audit: "audit_4_5",
    statusHint: "TIDAK_DAPAT_DINILAI",
    storeZero: true,
    answer: (question) => (question.isKey ? "YA" : "TIDAK_BERLAKU"),
  },
];

async function main() {
  const pool = new Pool({ connectionString: url });
  const outDir = "/opt/cursor/artifacts/sample-pdfs";
  mkdirSync(outDir, { recursive: true });
  const customer = await pool.query(
    `INSERT INTO customers (name, email, business_name) VALUES ('Sampel PDF', 'sample-pdf@bisnislevelup.test', 'Sampel PDF')
     ON CONFLICT (email) DO UPDATE SET name = EXCLUDED.name RETURNING id::text`,
  );
  const customerId = String(customer.rows[0].id);
  const order = await pool.query(
    `INSERT INTO orders (invoice_code, customer_id, subtotal, total_amount, status, customer_name, customer_email, paid_at)
     VALUES ('INV-SAMPLE-PDF', $1, 0, 0, 'PAID', 'Sampel PDF', 'sample-pdf@bisnislevelup.test', NOW())
     ON CONFLICT (invoice_code) DO UPDATE SET status = 'PAID' RETURNING id::text`,
    [customerId],
  );
  const orderId = String(order.rows[0].id);
  const product = await pool.query(`SELECT id::text FROM products WHERE code = 'audit-lengkap'`);
  const productId = String(product.rows[0]?.id ?? "");
  if (!productId) throw new Error("Produk audit-lengkap tidak ada");
  await pool.query(
    `INSERT INTO order_items (order_id, product_id, product_name, product_type, quantity, unit_price, total_price, audit_ids_unlocked)
     SELECT $1, $2, 'Audit Lengkap (4 Instrumen)', 'BUNDLE_AUDIT', 1, 597000, 597000, '1,2,3,4'
     WHERE NOT EXISTS (SELECT 1 FROM order_items WHERE order_id = $1)`,
    [orderId, productId],
  );

  for (const scenario of scenarios) {
    const existing = await pool.query(
      `SELECT s.id::text FROM test_sessions s
       JOIN test_results r ON r.session_id = s.id
       WHERE s.customer_id = $1 AND s.company_name = $2`,
      [customerId, scenario.marker],
    );
    let sessionId = existing.rows[0] ? String(existing.rows[0].id) : "";
    if (!sessionId) {
      const audit = await pool.query(
        `SELECT id::text, from_phase_id::text, to_phase_id::text, passing_score::text FROM audit_transitions WHERE code = $1`,
        [scenario.audit],
      );
      const auditId = String(audit.rows[0].id);
      const questions = await pool.query(
        `SELECT tq.id::text, tq.question_number, tq.is_key, ts.code AS section_code, ts.id::text AS section_id
         FROM test_questions tq
         JOIN test_sections ts ON ts.id = tq.section_id
         WHERE tq.audit_transition_id = $1 AND tq.is_active
         ORDER BY tq.question_number`,
        [auditId],
      );
      const plain = { n: 0 };
      const answers = questions.rows.map((row) => ({
        id: String(row.id),
        number: Number(row.question_number),
        isKey: Boolean(row.is_key),
        section: String(row.section_code),
        sectionId: String(row.section_id),
        answer: scenario.answer(
          { number: Number(row.question_number), isKey: Boolean(row.is_key), section: String(row.section_code) },
          plain,
        ),
      }));
      const scored = calculateResult({
        auditCode: scenario.audit,
        passingScore: Number(audit.rows[0].passing_score),
        questions: answers.map((item) => ({ id: item.id, questionNumber: item.number, sectionCode: item.section, isKey: item.isKey })),
        answers: answers.map((item) => ({ questionId: item.id, answer: item.answer })),
      });
      if (scored.status !== scenario.statusHint) {
        throw new Error(`${scenario.marker} menghasilkan ${scored.status}, diharapkan ${scenario.statusHint}`);
      }
      const created = await pool.query(
        `INSERT INTO test_sessions (
           customer_id, order_id, audit_transition_id, respondent_name, company_name, business_field,
           business_start_year, status, answered_count, total_questions, started_at, completed_at
         ) VALUES ($1,$2,$3,'Sari',$4,'Katering',2022,'COMPLETED',$5,$5,NOW(),'2026-10-27T05:00:00Z')
         RETURNING id::text`,
        [customerId, orderId, auditId, scenario.marker, answers.length],
      );
      sessionId = String(created.rows[0].id);
      for (const item of answers) {
        await pool.query(`INSERT INTO test_answers (session_id, question_id, answer) VALUES ($1,$2,$3)`, [sessionId, item.id, item.answer]);
      }
      const ya = answers.filter((item) => item.answer === "YA").length;
      const tidak = answers.filter((item) => item.answer === "TIDAK").length;
      const na = answers.filter((item) => item.answer === "TIDAK_BERLAKU").length;
      const keyYa = answers.filter((item) => item.isKey && item.answer === "YA").length;
      const keyTidak = answers.filter((item) => item.isKey && item.answer === "TIDAK").length;
      const keyTotal = answers.filter((item) => item.isKey).length;
      const inserted = await pool.query(
        `INSERT INTO test_results (
           session_id, customer_id, audit_transition_id, total_questions, total_key_questions,
           answered_ya, answered_tidak, answered_na, key_ya, key_tidak, overall_score, key_pass,
           status, from_phase_id, to_phase_id, indicator_json
         ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16::jsonb)
         RETURNING id::text`,
        [
          sessionId,
          customerId,
          auditId,
          answers.length,
          keyTotal,
          ya,
          tidak,
          na,
          keyYa,
          keyTidak,
          scenario.storeZero ? 0 : scored.score,
          scored.kunciTidak === 0,
          scored.status,
          audit.rows[0].from_phase_id,
          audit.rows[0].to_phase_id,
          JSON.stringify({ triad: scored.triad, agBlock: scored.agBlock }),
        ],
      );
      const resultId = String(inserted.rows[0].id);
      const sectionIds = new Map<string, string>();
      for (const item of answers) sectionIds.set(item.section, item.sectionId);
      for (const [code, sectionId] of sectionIds) {
        const inSection = answers.filter((item) => item.section === code);
        const part = scored.sections.find((item) => item.sectionCode === code);
        await pool.query(
          `INSERT INTO result_section_scores (
             result_id, section_id, total_questions, total_key, ya_count, tidak_count, na_count,
             key_ya_count, key_tidak_count, score_pct, key_pass
           ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)`,
          [
            resultId,
            sectionId,
            inSection.length,
            inSection.filter((item) => item.isKey).length,
            inSection.filter((item) => item.answer === "YA").length,
            inSection.filter((item) => item.answer === "TIDAK").length,
            inSection.filter((item) => item.answer === "TIDAK_BERLAKU").length,
            inSection.filter((item) => item.isKey && item.answer === "YA").length,
            inSection.filter((item) => item.isKey && item.answer === "TIDAK").length,
            scenario.storeZero && part?.scorePct == null ? 0 : part?.scorePct,
            part?.keyPass ?? true,
          ],
        );
      }
    }
    const report = await getReportDocument(customerId, sessionId, { origin: "https://bisnislevelup.id" });
    if (!report) throw new Error(`Laporan kosong untuk ${scenario.marker}`);
    if (report.status !== scenario.statusHint) throw new Error(`${scenario.marker} terbaca ${report.status}`);
    const pdf = await buildReportPdf(report);
    const file = path.join(outDir, `${scenario.statusHint}.pdf`);
    writeFileSync(file, pdf);
    const info = execFileSync("pdfinfo", [file], { encoding: "utf8" });
    const pages = info.match(/Pages:\s+(\d+)/)?.[1] ?? "?";
    console.log(`${scenario.statusHint} pages=${pages} bytes=${pdf.length} score=${report.score} file=${file}`);
  }
  const audience = await pool.query(`SELECT guidance_audience, count(*)::int AS rows FROM test_questions GROUP BY 1 ORDER BY 1`);
  console.table(audience.rows);
  await pool.end();
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
