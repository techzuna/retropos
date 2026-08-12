import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";
import { PrismaClient } from "@/generated/prisma/client";

/**
 * A tenant's database handle.
 *
 * Domain code never imports a module-level client. It receives one on its
 * context as `ctx.db` — the same context that already carries the tenancy ids
 * every query scopes by — and uses that. The reason is forward-looking: the
 * hosted design (DESIGN.md, "Proposed: Hosted Multi-Tenant Platform") gives
 * each organization its own SQLite file, which makes "which database" a
 * per-request question. Keeping the handle on the context means that change
 * lands in `resolveDb()` alone instead of in every query in `src/lib`.
 *
 * There is deliberately **no exported client singleton**. If `import { prisma }`
 * still compiled, one missed call site could quietly read or write the wrong
 * tenant's file — a failure mode worth making impossible to express rather
 * than hoping tests catch it.
 */
export type Db = PrismaClient;

/** The least a function needs to do organization-scoped work. */
export interface OrgContext {
  db: Db;
  orgId: string;
}

export function createDb(url: string): Db {
  return new PrismaClient({ adapter: new PrismaBetterSqlite3({ url }) });
}

// One client per process, reused across dev hot reloads. Single-tenant today;
// the hosted design replaces this with an LRU keyed by tenant id.
const globalForDb = globalThis as unknown as { rrDb?: Db };

/**
 * The database for the current request.
 *
 * Reads `DATABASE_URL` lazily rather than at module load, so tests can point
 * it at a throwaway file before their first query. Async even though nothing
 * here awaits: resolving a tenant will mean a control-plane lookup, and having
 * callers already await keeps that from rippling outward later.
 */
export async function resolveDb(): Promise<Db> {
  globalForDb.rrDb ??= createDb(process.env.DATABASE_URL ?? "file:./data/app.db");
  return globalForDb.rrDb;
}
