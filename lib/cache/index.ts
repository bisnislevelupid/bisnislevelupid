const TTL_FLOOR = 3600;

async function redisCommand(command: unknown[]): Promise<unknown> {
  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;
  if (!url || !token) return null;
  const response = await fetch(url, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    body: JSON.stringify(command),
    cache: "no-store",
  });
  if (!response.ok) return null;
  const payload = (await response.json()) as { result?: unknown };
  return payload.result ?? null;
}

export async function cachedJson<T>(key: string, ttlSeconds: number, load: () => Promise<T>): Promise<T> {
  try {
    const hit = await redisCommand(["GET", key]);
    if (typeof hit === "string" && hit) return JSON.parse(hit) as T;
  } catch {
    /* cache miss falls through */
  }
  const fresh = await load();
  try {
    await redisCommand(["SET", key, JSON.stringify(fresh), "EX", String(Math.max(ttlSeconds, TTL_FLOOR))]);
  } catch {
    /* serving the database copy is enough */
  }
  return fresh;
}
