import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

/**
 * Liveness for the hosted service. Coarse and unauthenticated by design — it
 * says whether the app can reach its database, and nothing a stranger could
 * use. The outlet's equivalent probes a native driver and a WebAssembly
 * allocation too; neither can fail here.
 */
export async function GET() {
  let database: "ok" | "fail" = "fail";
  let organizations: number | undefined;
  try {
    organizations = await db.organization.count();
    database = "ok";
  } catch {
    /* reported as fail */
  }
  return NextResponse.json(
    { ok: database === "ok", node: process.version.split(".")[0], database, organizations },
    { status: database === "ok" ? 200 : 503, headers: { "Cache-Control": "no-store" } },
  );
}
