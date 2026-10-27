import { createRequire } from "node:module";
import { readFileSync } from "node:fs";
import { basename, resolve } from "node:path";
import { Pool as NeonPool, neonConfig } from "@neondatabase/serverless";
import ws from "ws";

neonConfig.webSocketConstructor = ws;

type SqlPool = {
  query: <T = Record<string, unknown>>(sql: string, params?: unknown[]) => Promise<{ rows: T[] }>;
  end: () => Promise<void>;
};

function openPool(url: string): SqlPool {
  let host = "";
  try {
    host = new URL(url).hostname;
  } catch {
    host = "";
  }
  if (host === "localhost" || host === "127.0.0.1" || host === "") {
    const require = createRequire(import.meta.url);
    const { Pool } = require("pg") as { Pool: new (config: { connectionString: string }) => SqlPool };
    return new Pool({ connectionString: url });
  }
  return new NeonPool({ connectionString: url });
}

function loadEnv() {
  let raw: string;
  try {
    raw = readFileSync(resolve(process.cwd(), ".env.local"), "utf8");
  } catch (err) {
    if ((err as NodeJS.ErrnoException).code === "ENOENT") return;
    throw err;
  }
  for (const line of raw.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq === -1) continue;
    const key = trimmed.slice(0, eq);
    let value = trimmed.slice(eq + 1);
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    if (!process.env[key]) process.env[key] = value;
  }
}

const QUESTION_BANK_SUMMARY = `
  SELECT a.code, a.total_questions, a.total_key_questions,
         (SELECT count(*)::text FROM test_sections s WHERE s.audit_transition_id = a.id) AS sections,
         (SELECT count(*)::text FROM test_questions q WHERE q.audit_transition_id = a.id AND q.is_active) AS questions
  FROM audit_transitions a
  WHERE a.code IN ('audit_1_2','audit_2_3','audit_3_4','audit_4_5')
  ORDER BY a.sort_order
`;

export async function runSqlFile(filename: string) {
  loadEnv();
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error("DATABASE_URL missing");
  const sql = readFileSync(resolve(process.cwd(), filename), "utf8");
  const pool = openPool(url);
  try {
    await pool.query(sql);
    if (basename(filename) === "seed_report_content.sql") {
      const { rows } = await pool.query(`
        SELECT 'narratives' AS table_name, count(*)::int AS rows FROM report_status_narratives
        UNION ALL SELECT 'sections', count(*)::int FROM section_education
        UNION ALL SELECT 'coaching', count(*)::int FROM question_coaching
        UNION ALL SELECT 'closings', count(*)::int FROM phase_report_closings
        UNION ALL SELECT 'triggers', count(*)::int FROM recommendation_triggers
        UNION ALL SELECT 'status_recs', count(*)::int FROM report_status_recommendations
        UNION ALL SELECT 'draft_coaching', count(*)::int FROM question_coaching WHERE review_status = 'draft'
      `);
      console.table(rows);
    }
    if (basename(filename) === "seed_question_bank.sql") {
      const { rows } = await pool.query<{
        code: string;
        total_questions: number;
        total_key_questions: number;
        sections: string;
        questions: string;
      }>(QUESTION_BANK_SUMMARY);
      console.table(rows);
    }
  } finally {
    await pool.end();
  }
}

const target = process.argv[2];
if (target) {
  runSqlFile(target)
    .then(() => {
      console.log(`applied ${target}`);
    })
    .catch((err) => {
      console.error(err);
      process.exit(1);
    });
}
