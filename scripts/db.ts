import { readFileSync } from "node:fs";
import { basename, resolve } from "node:path";
import { Pool, neonConfig } from "@neondatabase/serverless";
import ws from "ws";

neonConfig.webSocketConstructor = ws;

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
  const pool = new Pool({ connectionString: url });
  try {
    await pool.query(sql);
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
