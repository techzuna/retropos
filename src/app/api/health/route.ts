import { createRequire } from "node:module";
import { existsSync, statSync } from "node:fs";
import path from "node:path";
import { NextResponse, type NextRequest } from "next/server";
import { dataDir } from "@/lib/paths";

export const dynamic = "force-dynamic";

/**
 * Liveness plus the three things that actually stop this app booting on a
 * constrained host, each probed independently so a failure names itself:
 *
 *   driver — better-sqlite3 is a compiled module. It fails when the host's
 *            glibc is older than the prebuilt binary needs, or when the binary
 *            was built for a different Node ABI, or was never built at all.
 *   wasm   — Prisma 7 compiles queries in WebAssembly. V8 reserves a large
 *            guard region per Wasm memory, and CloudLinux LVE caps address
 *            space, so instantiation can fail on a host with plenty of free RAM.
 *   database — the file exists, opens, and has rows.
 *
 * Deliberately reachable without a session: it exists to diagnose a server
 * nobody can sign in to. The unauthenticated body is coarse on purpose — no
 * paths, no versions beyond the Node major, nothing that is not already
 * evident from the outside. Set HEALTH_TOKEN and pass ?token= to get the
 * detail (paths, versions, error messages) needed to actually fix it.
 */
export async function GET(request: NextRequest) {
  const detailed =
    Boolean(process.env.HEALTH_TOKEN) &&
    request.nextUrl.searchParams.get("token") === process.env.HEALTH_TOKEN;

  const detail: Record<string, unknown> = {};
  // Named anything but `require`: the bundler rewrites that identifier, and
  // its require.resolve returns a numeric module id rather than a path.
  const nodeRequire = createRequire(import.meta.url);

  // 1. The native driver.
  let driver: "ok" | "fail" = "fail";
  let Database: (new (p: string, o?: unknown) => { prepare: (s: string) => { get: () => unknown }; close: () => void }) | null =
    null;
  try {
    Database = nodeRequire("better-sqlite3");
    driver = "ok";
  } catch (err) {
    if (detailed) detail.driverError = err instanceof Error ? err.message.split("\n")[0] : String(err);
  }

  // Locating the compiled binary is a nice-to-have, and its own failure must
  // not be reported as a driver failure — the bundler rewrites `.resolve()`
  // calls to return a numeric module id, which throws here. Kept separate and
  // entirely best-effort.
  if (detailed) {
    try {
      const pkgDir = path.dirname(nodeRequire.resolve("better-sqlite3/package.json"));
      const binding = path.join(pkgDir, "build", "Release", "better_sqlite3.node");
      detail.driverPath = pkgDir;
      detail.binding = existsSync(binding)
        ? `${(statSync(binding).size / 1024).toFixed(0)} KB`
        : "missing";
    } catch {
      detail.driverPath = "(not resolvable from the bundle)";
    }
  }

  // 2. WebAssembly, including a memory large enough to resemble what a real
  //    query compiler asks for — a trivial module can succeed where that fails.
  let wasm: "ok" | "fail" = "fail";
  try {
    const mod = new WebAssembly.Module(new Uint8Array([0, 97, 115, 109, 1, 0, 0, 0]));
    new WebAssembly.Instance(mod);
    new WebAssembly.Memory({ initial: 256 }); // 16 MiB
    wasm = "ok";
  } catch (err) {
    if (detailed) detail.wasmError = err instanceof Error ? err.message.split("\n")[0] : String(err);
  }

  // 3. The database itself, read-only so a probe can never corrupt a shift.
  let database: "ok" | "fail" = "fail";
  const url = process.env.DATABASE_URL ?? "";
  const dbPath = url.startsWith("file:") ? url.slice("file:".length) : null;
  if (detailed) {
    detail.dataDir = dataDir();
    detail.databaseUrl = url || "(unset)";
    detail.sessionSecret = process.env.SESSION_SECRET ? "set" : "MISSING";
    detail.appUrl = process.env.APP_URL ?? "(unset)";
    detail.execPath = process.execPath;
  }
  if (Database && dbPath && existsSync(dbPath)) {
    try {
      const db = new Database(dbPath, { readonly: true });
      const row = db.prepare("SELECT COUNT(*) c FROM User WHERE role = 'owner' AND active = 1").get() as {
        c: number;
      };
      db.close();
      database = row.c > 0 ? "ok" : "fail";
      if (detailed) detail.activeOwners = row.c;
    } catch (err) {
      if (detailed) detail.databaseError = err instanceof Error ? err.message.split("\n")[0] : String(err);
    }
  } else if (detailed) {
    detail.databaseError = dbPath ? `no file at ${dbPath}` : "DATABASE_URL is not a file: URL";
  }

  const ok = driver === "ok" && wasm === "ok" && database === "ok";
  return NextResponse.json(
    {
      ok,
      node: process.version.split(".")[0],
      driver,
      wasm,
      database,
      ...(detailed ? { detail } : {}),
    },
    { status: ok ? 200 : 503, headers: { "Cache-Control": "no-store" } },
  );
}
