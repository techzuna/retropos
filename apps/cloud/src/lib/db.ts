import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@/generated/prisma/client";

/**
 * The cloud database handle.
 *
 * Postgres over the pure-JavaScript `pg` driver — deliberately nothing to
 * compile. The self-hosted build ships a native SQLite driver to machines it
 * has never met, which cost a day of glibc and Node-ABI archaeology; a hosted
 * service should not inherit that.
 *
 * Tenancy is not enforced here. Every domain function takes the caller's
 * organizationId and puts it in the WHERE clause, so isolation lives in one
 * layer that is tested, rather than in the goodwill of each route.
 */
function makeClient() {
  return new PrismaClient({
    adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }),
  });
}

const globalForPrisma = globalThis as unknown as { cloudDb?: ReturnType<typeof makeClient> };

export const db = globalForPrisma.cloudDb ?? makeClient();

if (process.env.NODE_ENV !== "production") globalForPrisma.cloudDb = db;
