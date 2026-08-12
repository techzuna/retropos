// Fixed-window, in-memory rate limiter. Adequate for a single long-running
// Node process, which is exactly this system's deployment model (DEPLOY.md).
//
// Callers must key on something the client cannot choose (a target user id,
// a normalized email). A key derived from a request header can be rotated to
// mint a fresh window per attempt, which defeats the limiter entirely — see
// `clientKeyOf` in src/app/api/respond.ts.

const hits = new Map<string, { count: number; resetAt: number }>();

/** Returns true when the caller is within limits. */
export function rateLimit(key: string, max: number, windowMs: number): boolean {
  const now = Date.now();

  if (hits.size > 10_000) {
    for (const [k, v] of hits) if (v.resetAt <= now) hits.delete(k);
  }

  const entry = hits.get(key);
  if (!entry || entry.resetAt <= now) {
    hits.set(key, { count: 1, resetAt: now + windowMs });
    return true;
  }
  entry.count += 1;
  return entry.count <= max;
}

/**
 * Forget a window after the caller proved they hold the credential. Keeps a
 * busy shift-change from spending a staff member's attempt budget, while a
 * wrong-guess run still accumulates: the keys embed the identity being
 * attempted, so clearing one requires having already entered it correctly.
 */
export function clearRateLimit(...keys: string[]): void {
  for (const key of keys) hits.delete(key);
}
