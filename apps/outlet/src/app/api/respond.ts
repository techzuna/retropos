import { NextResponse } from "next/server";
import { ZodError } from "zod";
import { PosError } from "@restro/domain/errors";

/**
 * Uniform route wrapper: PosError → its status, ZodError → 422, everything
 * else propagates to Next's 500 handling. Routes return plain JSON-able
 * values; `undefined` becomes `{ ok: true }`.
 */
export async function handle(fn: () => Promise<unknown>): Promise<NextResponse> {
  try {
    const result = await fn();
    return NextResponse.json(result === undefined ? { ok: true } : result);
  } catch (err) {
    if (err instanceof PosError) {
      return NextResponse.json({ error: err.message, code: err.code }, { status: err.status });
    }
    if (err instanceof ZodError) {
      return NextResponse.json(
        {
          error: err.issues[0]?.message ?? "Check the input.",
          issues: err.issues.map((i) => ({ field: i.path.join("."), message: i.message })),
        },
        { status: 422 },
      );
    }
    throw err;
  }
}

/**
 * A rate-limit bucket for the caller, or null when we can't trust one.
 *
 * `x-forwarded-for` is client-supplied, and DEPLOY.md runs this as a bare Node
 * process on the restaurant LAN with nothing in front of it — so an attacker
 * can rotate the header to mint a fresh window per attempt, and honest tablets
 * send no header at all and would all share one bucket. Neither is useful, so
 * the header counts only when an operator has actually put a proxy in front
 * and set TRUSTED_PROXY=1. Otherwise callers fall back to per-identity limits
 * (see src/lib/auth.ts), which no header can rotate.
 */
export function clientKeyOf(request: Request): string | null {
  if (process.env.TRUSTED_PROXY !== "1") return null;
  const forwarded = request.headers.get("x-forwarded-for");
  return forwarded ? forwarded.split(",")[0].trim() || null : null;
}
