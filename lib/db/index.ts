import { createRequire } from "node:module";
import { Pool, neonConfig } from "@neondatabase/serverless";
import { attachDatabasePool } from "@vercel/functions";
import ws from "ws";

neonConfig.webSocketConstructor = ws;

const globalForPool = globalThis as typeof globalThis & { __naikfasePool?: Pool };

function localPostgres(url: string) {
  let host = "";
  try {
    host = new URL(url).hostname;
  } catch {
    host = "";
  }
  return host === "localhost" || host === "127.0.0.1" || host === "";
}

function getPool() {
  if (!globalForPool.__naikfasePool) {
    const url = process.env.DATABASE_URL;
    if (!url) throw new Error("DATABASE_URL missing");
    if (localPostgres(url)) {
      const require = createRequire(import.meta.url);
      const { Pool: PgPool } = require("pg") as { Pool: new (config: { connectionString: string }) => Pool };
      globalForPool.__naikfasePool = new PgPool({ connectionString: url });
    } else {
      const pool = new Pool({ connectionString: url, idleTimeoutMillis: 10_000 });
      attachDatabasePool(pool);
      globalForPool.__naikfasePool = pool;
    }
  }
  return globalForPool.__naikfasePool;
}

export function createPool() {
  return getPool();
}

export async function withPool<T>(fn: (pool: Pool) => Promise<T>): Promise<T> {
  return fn(getPool());
}
