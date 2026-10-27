import { Pool, neonConfig } from "@neondatabase/serverless";
import { attachDatabasePool } from "@vercel/functions";
import ws from "ws";

neonConfig.webSocketConstructor = ws;

const globalForPool = globalThis as typeof globalThis & { __naikfasePool?: Pool };

function getPool() {
  if (!globalForPool.__naikfasePool) {
    const url = process.env.DATABASE_URL;
    if (!url) throw new Error("DATABASE_URL missing");
    const pool = new Pool({ connectionString: url, idleTimeoutMillis: 10_000 });
    attachDatabasePool(pool);
    globalForPool.__naikfasePool = pool;
  }
  return globalForPool.__naikfasePool;
}

export function createPool() {
  return getPool();
}

export async function withPool<T>(fn: (pool: Pool) => Promise<T>): Promise<T> {
  return fn(getPool());
}
