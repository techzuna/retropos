// Fixed-window, in-memory rate limiter. Adequate while the app runs as a
// single Node process (local dev, low-traffic deploys); swap for a durable
// store (e.g. Upstash) before scaling out — see PRD §7 abuse resistance.

const WINDOW_MS = 10 * 60_000;
const MAX_PER_WINDOW = 8;

const hits = new Map<string, { count: number; resetAt: number }>();

/** Returns true when the caller is within limits. */
export function rateLimit(key: string): boolean {
  const now = Date.now();

  if (hits.size > 10_000) {
    for (const [k, v] of hits) if (v.resetAt <= now) hits.delete(k);
  }

  const entry = hits.get(key);
  if (!entry || entry.resetAt <= now) {
    hits.set(key, { count: 1, resetAt: now + WINDOW_MS });
    return true;
  }
  entry.count += 1;
  return entry.count <= MAX_PER_WINDOW;
}
