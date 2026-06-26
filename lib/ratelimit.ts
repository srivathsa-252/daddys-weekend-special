let ratelimit: ((key: string) => Promise<{ success: boolean }>) | null = null;

if (process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN) {
  const { Ratelimit } = require("@upstash/ratelimit");
  const { Redis } = require("@upstash/redis");
  const redis = new Redis({
    url: process.env.UPSTASH_REDIS_REST_URL,
    token: process.env.UPSTASH_REDIS_REST_TOKEN,
  });
  const limiter = new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(10, "1 m"),
    analytics: false,
  });
  ratelimit = (key: string) => limiter.limit(key);
}

// In-memory fallback
const inMemoryStore = new Map<string, { count: number; resetAt: number }>();

function inMemoryLimit(key: string): { success: boolean } {
  const now = Date.now();
  const entry = inMemoryStore.get(key);
  if (!entry || now > entry.resetAt) {
    inMemoryStore.set(key, { count: 1, resetAt: now + 60_000 });
    return { success: true };
  }
  entry.count++;
  if (entry.count > 10) return { success: false };
  return { success: true };
}

export async function checkRateLimit(ip: string): Promise<{ success: boolean }> {
  if (ratelimit) {
    return ratelimit(ip);
  }
  return inMemoryLimit(ip);
}
