import { createRequire } from "node:module";
import { Pool, neonConfig } from "@neondatabase/serverless";
import ws from "ws";

neonConfig.webSocketConstructor = ws;

function localPostgres(url: string) {
  let host = "";
  try {
    host = new URL(url).hostname;
  } catch {
    host = "";
  }
  return host === "localhost" || host === "127.0.0.1" || host === "";
}

export function createPool() {
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error("DATABASE_URL missing");
  if (localPostgres(url)) {
    const require = createRequire(import.meta.url);
    const { Pool: PgPool } = require("pg") as { Pool: new (config: { connectionString: string }) => Pool };
    return new PgPool({ connectionString: url });
  }
  return new Pool({ connectionString: url });
}

export async function withPool<T>(fn: (pool: Pool) => Promise<T>): Promise<T> {
  const pool = createPool();
  try {
    return await fn(pool);
  } finally {
    await pool.end();
  }
}
