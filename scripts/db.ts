import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { Pool, neonConfig } from "@neondatabase/serverless";
import ws from "ws";

neonConfig.webSocketConstructor = ws;

function loadEnv() {
  const raw = readFileSync(resolve(process.cwd(), ".env.local"), "utf8");
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

export async function runSqlFile(filename: string) {
  loadEnv();
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error("DATABASE_URL missing");
  const sql = readFileSync(resolve(process.cwd(), filename), "utf8");
  const pool = new Pool({ connectionString: url });
  try {
    await pool.query(sql);
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
