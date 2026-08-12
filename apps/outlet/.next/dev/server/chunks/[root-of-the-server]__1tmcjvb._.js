module.exports = [
"[externals]/next/dist/compiled/next-server/app-route-turbo.runtime.dev.js [external] (next/dist/compiled/next-server/app-route-turbo.runtime.dev.js, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("next/dist/compiled/next-server/app-route-turbo.runtime.dev.js", () => require("next/dist/compiled/next-server/app-route-turbo.runtime.dev.js"));

module.exports = mod;
}),
"[externals]/next/dist/compiled/@opentelemetry/api [external] (next/dist/compiled/@opentelemetry/api, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("next/dist/compiled/@opentelemetry/api", () => require("next/dist/compiled/@opentelemetry/api"));

module.exports = mod;
}),
"[externals]/next/dist/compiled/next-server/app-page-turbo.runtime.dev.js [external] (next/dist/compiled/next-server/app-page-turbo.runtime.dev.js, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("next/dist/compiled/next-server/app-page-turbo.runtime.dev.js", () => require("next/dist/compiled/next-server/app-page-turbo.runtime.dev.js"));

module.exports = mod;
}),
"[externals]/next/dist/server/app-render/work-unit-async-storage.external.js [external] (next/dist/server/app-render/work-unit-async-storage.external.js, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("next/dist/server/app-render/work-unit-async-storage.external.js", () => require("next/dist/server/app-render/work-unit-async-storage.external.js"));

module.exports = mod;
}),
"[externals]/next/dist/server/app-render/work-async-storage.external.js [external] (next/dist/server/app-render/work-async-storage.external.js, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("next/dist/server/app-render/work-async-storage.external.js", () => require("next/dist/server/app-render/work-async-storage.external.js"));

module.exports = mod;
}),
"[externals]/next/dist/shared/lib/no-fallback-error.external.js [external] (next/dist/shared/lib/no-fallback-error.external.js, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("next/dist/shared/lib/no-fallback-error.external.js", () => require("next/dist/shared/lib/no-fallback-error.external.js"));

module.exports = mod;
}),
"[externals]/node:module [external] (node:module, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("node:module", () => require("node:module"));

module.exports = mod;
}),
"[externals]/node:fs [external] (node:fs, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("node:fs", () => require("node:fs"));

module.exports = mod;
}),
"[externals]/node:path [external] (node:path, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("node:path", () => require("node:path"));

module.exports = mod;
}),
"[externals]/next/dist/server/app-render/after-task-async-storage.external.js [external] (next/dist/server/app-render/after-task-async-storage.external.js, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("next/dist/server/app-render/after-task-async-storage.external.js", () => require("next/dist/server/app-render/after-task-async-storage.external.js"));

module.exports = mod;
}),
"[project]/apps/outlet/src/lib/paths.ts [app-route] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "backupDir",
    ()=>backupDir,
    "dataDir",
    ()=>dataDir,
    "uploadsDir",
    ()=>uploadsDir
]);
var __TURBOPACK__imported__module__$5b$externals$5d2f$node$3a$path__$5b$external$5d$__$28$node$3a$path$2c$__cjs$29$__ = __turbopack_context__.i("[externals]/node:path [external] (node:path, cjs)");
;
function dataDir() {
    const configured = process.env.DATA_DIR?.trim();
    return configured ? __TURBOPACK__imported__module__$5b$externals$5d2f$node$3a$path__$5b$external$5d$__$28$node$3a$path$2c$__cjs$29$__["default"].resolve(configured) : __TURBOPACK__imported__module__$5b$externals$5d2f$node$3a$path__$5b$external$5d$__$28$node$3a$path$2c$__cjs$29$__["default"].join(process.cwd(), "data");
}
function uploadsDir() {
    return __TURBOPACK__imported__module__$5b$externals$5d2f$node$3a$path__$5b$external$5d$__$28$node$3a$path$2c$__cjs$29$__["default"].join(dataDir(), "uploads");
}
function backupDir() {
    return __TURBOPACK__imported__module__$5b$externals$5d2f$node$3a$path__$5b$external$5d$__$28$node$3a$path$2c$__cjs$29$__["default"].join(dataDir(), "backups");
}
}),
"[project]/apps/outlet/src/app/api/health/route.ts [app-route] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "GET",
    ()=>GET,
    "dynamic",
    ()=>dynamic
]);
var __TURBOPACK__imported__module__$5b$externals$5d2f$node$3a$module__$5b$external$5d$__$28$node$3a$module$2c$__cjs$29$__ = __turbopack_context__.i("[externals]/node:module [external] (node:module, cjs)");
var __TURBOPACK__imported__module__$5b$externals$5d2f$node$3a$fs__$5b$external$5d$__$28$node$3a$fs$2c$__cjs$29$__ = __turbopack_context__.i("[externals]/node:fs [external] (node:fs, cjs)");
var __TURBOPACK__imported__module__$5b$externals$5d2f$node$3a$path__$5b$external$5d$__$28$node$3a$path$2c$__cjs$29$__ = __turbopack_context__.i("[externals]/node:path [external] (node:path, cjs)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/server.js [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$outlet$2f$src$2f$lib$2f$paths$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/apps/outlet/src/lib/paths.ts [app-route] (ecmascript)");
const __TURBOPACK__import$2e$meta__ = {
    get url () {
        return `file://${__turbopack_context__.P("apps/outlet/src/app/api/health/route.ts")}`;
    },
    get turbopackHot () {
        return __turbopack_context__.m.hot;
    }
};
;
;
;
;
;
const dynamic = "force-dynamic";
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
 */ /**
 * Reduce an error to a fixed vocabulary. Safe to return unauthenticated —
 * it names the class of fault without quoting paths or host internals — and
 * it is the difference between "database: fail" and knowing what to fix.
 */ function classify(message) {
    if (/bindings file/i.test(message)) return "native-binding-missing";
    if (/no file at/i.test(message)) return "database-file-missing";
    if (/no such table|does not exist/i.test(message)) return "schema-missing";
    if (/readonly|permission|EACCES/i.test(message)) return "not-readable";
    if (/unable to open|SQLITE_CANTOPEN|directory does not exist/i.test(message)) return "cannot-open";
    if (/GLIBC|ERR_DLOPEN/i.test(message)) return "native-abi-mismatch";
    return "unknown";
}
async function GET(request) {
    const detailed = Boolean(process.env.HEALTH_TOKEN) && request.nextUrl.searchParams.get("token") === process.env.HEALTH_TOKEN;
    const detail = {};
    // Coarse, non-identifying fault codes so the endpoint stays useful without
    // HEALTH_TOKEN — setting an env var needs panel access, which is exactly
    // what you do not have when the app will not start.
    const reasons = [];
    // Named anything but `require`: the bundler rewrites that identifier, and
    // its require.resolve returns a numeric module id rather than a path.
    const nodeRequire = (0, __TURBOPACK__imported__module__$5b$externals$5d2f$node$3a$module__$5b$external$5d$__$28$node$3a$module$2c$__cjs$29$__["createRequire"])(__TURBOPACK__import$2e$meta__.url);
    // 1. The native driver.
    let driver = "fail";
    let Database = null;
    try {
        Database = __turbopack_context__.r("[externals]/better-sqlite3 [external] (better-sqlite3, cjs, [project]/node_modules/better-sqlite3)");
        driver = "ok";
    } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        reasons.push(`driver:${classify(msg)}`);
        if (detailed) detail.driverError = msg.split("\n")[0];
    }
    // Locating the compiled binary is a nice-to-have, and its own failure must
    // not be reported as a driver failure — the bundler rewrites `.resolve()`
    // calls to return a numeric module id, which throws here. Kept separate and
    // entirely best-effort.
    if (detailed) {
        try {
            const pkgDir = __TURBOPACK__imported__module__$5b$externals$5d2f$node$3a$path__$5b$external$5d$__$28$node$3a$path$2c$__cjs$29$__["default"].dirname("[externals]/better-sqlite3/package.json [external] (better-sqlite3/package.json, cjs, [project]/node_modules/better-sqlite3)");
            const binding = __TURBOPACK__imported__module__$5b$externals$5d2f$node$3a$path__$5b$external$5d$__$28$node$3a$path$2c$__cjs$29$__["default"].join(pkgDir, "build", "Release", "better_sqlite3.node");
            detail.driverPath = pkgDir;
            detail.binding = (0, __TURBOPACK__imported__module__$5b$externals$5d2f$node$3a$fs__$5b$external$5d$__$28$node$3a$fs$2c$__cjs$29$__["existsSync"])(binding) ? `${((0, __TURBOPACK__imported__module__$5b$externals$5d2f$node$3a$fs__$5b$external$5d$__$28$node$3a$fs$2c$__cjs$29$__["statSync"])(binding).size / 1024).toFixed(0)} KB` : "missing";
        } catch  {
            detail.driverPath = "(not resolvable from the bundle)";
        }
    }
    // 2. WebAssembly, including a memory large enough to resemble what a real
    //    query compiler asks for — a trivial module can succeed where that fails.
    let wasm = "fail";
    try {
        const mod = new WebAssembly.Module(new Uint8Array([
            0,
            97,
            115,
            109,
            1,
            0,
            0,
            0
        ]));
        new WebAssembly.Instance(mod);
        new WebAssembly.Memory({
            initial: 256
        }); // 16 MiB
        wasm = "ok";
    } catch (err) {
        if (detailed) detail.wasmError = err instanceof Error ? err.message.split("\n")[0] : String(err);
    }
    // 3. The database itself, read-only so a probe can never corrupt a shift.
    let database = "fail";
    const url = process.env.DATABASE_URL ?? "";
    const dbPath = url.startsWith("file:") ? url.slice("file:".length) : null;
    if (detailed) {
        detail.dataDir = (0, __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$outlet$2f$src$2f$lib$2f$paths$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["dataDir"])();
        detail.databaseUrl = url || "(unset)";
        detail.sessionSecret = process.env.SESSION_SECRET ? "set" : "MISSING";
        detail.appUrl = process.env.APP_URL ?? "(unset)";
        detail.execPath = process.execPath;
    }
    if (Database && dbPath && (0, __TURBOPACK__imported__module__$5b$externals$5d2f$node$3a$fs__$5b$external$5d$__$28$node$3a$fs$2c$__cjs$29$__["existsSync"])(dbPath)) {
        try {
            const db = new Database(dbPath, {
                readonly: true
            });
            const row = db.prepare("SELECT COUNT(*) c FROM User WHERE role = 'owner' AND active = 1").get();
            db.close();
            database = row.c > 0 ? "ok" : "fail";
            if (row.c === 0) reasons.push("database:no-owner-account");
            if (detailed) detail.activeOwners = row.c;
        } catch (err) {
            const msg = err instanceof Error ? err.message : String(err);
            reasons.push(`database:${classify(msg)}`);
            if (detailed) detail.databaseError = msg.split("\n")[0];
        }
    } else {
        const msg = dbPath ? `no file at ${dbPath}` : "DATABASE_URL is not a file: URL";
        reasons.push(`database:${dbPath ? classify(msg) : "database-url-not-a-file"}`);
        if (detailed) detail.databaseError = msg;
    }
    const ok = driver === "ok" && wasm === "ok" && database === "ok";
    return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NextResponse"].json({
        ok,
        node: process.version.split(".")[0],
        driver,
        wasm,
        database,
        ...reasons.length ? {
            reasons
        } : {},
        ...detailed ? {
            detail
        } : {}
    }, {
        status: ok ? 200 : 503,
        headers: {
            "Cache-Control": "no-store"
        }
    });
}
}),
];

//# sourceMappingURL=%5Broot-of-the-server%5D__1tmcjvb._.js.map