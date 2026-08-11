/*
 * Preflight for a cPanel/Passenger host, run from the panel's "Run JS script"
 * button as `check` — the only way to execute anything on a plan with no shell.
 *
 * It answers, in order, the questions that actually go wrong on shared hosting,
 * and stops at the first fatal one:
 *   1. Which Node is this, and where is it running?
 *   2. Does better-sqlite3 LOAD? Installing it is not the same as loading it —
 *      the published prebuilts need glibc 2.29+, and CentOS/CloudLinux 7 ships
 *      2.17, so a "successful" install still dies with ERR_DLOPEN_FAILED on the
 *      first query.
 *   3. Is DATA_DIR outside the web root, present, and writable?
 *   4. Does the database open, and does it have the tables and an owner?
 *
 * Deliberately CommonJS and dependency-free apart from better-sqlite3 itself:
 * it must run before Next does, and it must not import anything from src/,
 * which the release does not ship.
 */
const fs = require("node:fs");
const path = require("node:path");

let failed = false;

function ok(label, detail) {
  console.log(`  OK    ${label}${detail ? " — " + detail : ""}`);
}
function bad(label, detail) {
  failed = true;
  console.log(`  FAIL  ${label}${detail ? " — " + detail : ""}`);
}

console.log("\nRestroReserve host check\n");

// 1. Environment
console.log("Environment");
ok("node", process.version);
// Which node binary, not just which version. cPanel's "Run JS script" can run
// a different Node than the app: the CloudLinux app lives in
// ~/nodevenv/<app>/<major>/, and a native module built for one ABI will not
// load in another. A check that passes under the wrong Node proves nothing.
ok("node binary", process.execPath);
ok("cwd", process.cwd());
const dataDir = process.env.DATA_DIR
  ? path.resolve(process.env.DATA_DIR)
  : path.join(process.cwd(), "data");
const dbUrl = process.env.DATABASE_URL || "(unset)";
console.log(`  ..    DATA_DIR      ${dataDir}${process.env.DATA_DIR ? "" : "  (defaulted)"}`);
console.log(`  ..    DATABASE_URL  ${dbUrl}`);
if (!process.env.SESSION_SECRET) {
  bad("SESSION_SECRET", "not set — every sign-in will fail");
} else {
  ok("SESSION_SECRET", "set");
}
if (!/^https:\/\//.test(process.env.APP_URL || "")) {
  console.log(
    `  WARN  APP_URL is "${process.env.APP_URL || "(unset)"}" — the session cookie is only marked Secure when this starts with https://`,
  );
}

// 2. The native module. This is the one that silently kills shared hosting.
console.log("\nDatabase driver");
// Resolve where better-sqlite3 actually lives — on CloudLinux that is a
// virtualenv far from cwd — and say outright whether its compiled binary is
// there. "Could not locate the bindings file" prints thirteen candidate paths
// and buries the one fact that matters: was anything ever built?
let pkgDir = null;
try {
  pkgDir = path.dirname(require.resolve("better-sqlite3/package.json"));
  ok("installed at", pkgDir);
  const binding = path.join(pkgDir, "build", "Release", "better_sqlite3.node");
  if (fs.existsSync(binding)) {
    const s = fs.statSync(binding);
    ok(
      "compiled binary",
      `${(s.size / 1024).toFixed(0)} KB, built ${s.mtime.toISOString().slice(0, 16)}`,
    );
  } else {
    bad("compiled binary", "missing — nothing was ever built here");
    console.log(
      "\n  The rebuild did not produce a binary. Press Run NPM Install and read\n" +
        "  its output: lines with node-gyp / CXX / SOLINK mean it is compiling,\n" +
        "  while 'gyp ERR!' naming python3, make or g++ means this plan has no\n" +
        "  compiler — and then this app cannot run here, because its database\n" +
        "  driver is a native module.\n",
    );
  }
} catch {
  bad("better-sqlite3", "not installed at all — press Run NPM Install");
}

let Database;
try {
  Database = require("better-sqlite3");
  ok("better-sqlite3 loads");
} catch (err) {
  bad("better-sqlite3 will not load", err.message.split("\n")[0]);
  if (/GLIBC/.test(err.message)) {
    console.log(
      "\n  The prebuilt binary needs a newer glibc than this host has.\n" +
        "  Fix: make sure .npmrc in the application root contains\n" +
        "      build_from_source=true\n" +
        "  then press Run NPM Install again so it compiles here. If that fails\n" +
        "  for want of python3/make/g++, this plan cannot run the app.\n",
    );
  }
  process.exit(1);
}

// 3. The data directory
console.log("\nData directory");
if (!fs.existsSync(dataDir)) {
  bad("does not exist", dataDir);
} else {
  ok("exists");
  try {
    const probe = path.join(dataDir, ".write-probe");
    fs.writeFileSync(probe, "x");
    fs.unlinkSync(probe);
    ok("writable");
  } catch (err) {
    bad("not writable", err.message);
  }
  // Anything under a document root is downloadable; the backups hold every
  // password and PIN hash in the business.
  if (/\.(com|net|org|io|np)(\/|$)/.test(dataDir) || /public_html/.test(dataDir)) {
    bad("looks web-served", `${dataDir} — move it outside the document root`);
  }
}

// 4. The database itself
console.log("\nDatabase");
const dbPath = dbUrl.startsWith("file:") ? dbUrl.slice("file:".length) : null;
if (!dbPath) {
  bad("DATABASE_URL is not a file: URL", dbUrl);
} else if (!fs.existsSync(dbPath)) {
  bad("file does not exist", `${dbPath} — upload app.db there`);
} else {
  ok("file exists", `${(fs.statSync(dbPath).size / 1024).toFixed(0)} KB`);
  try {
    const db = new Database(dbPath, { readonly: true });
    const tables = db
      .prepare("SELECT COUNT(*) c FROM sqlite_master WHERE type='table'")
      .get().c;
    if (tables === 0) {
      bad("no tables", "an empty file was auto-created — the path is probably wrong");
    } else {
      ok("tables", String(tables));
      const owners = db
        .prepare("SELECT COUNT(*) c FROM User WHERE role = 'owner' AND active = 1")
        .get().c;
      if (owners > 0) {
        ok("active owner accounts", String(owners));
      } else {
        bad("no active owner", "nobody can sign in");
      }
    }
    db.close();
  } catch (err) {
    // Print the whole message here, not the first line. "Could not locate the
    // bindings file" lists every path it tried on the following lines, and
    // that list is the entire diagnosis.
    bad("cannot read", err.message.split("\n")[0]);
    for (const line of err.message.split("\n").slice(1)) {
      if (line.trim()) console.log(`        ${line.trim()}`);
    }
    if (/bindings file/.test(err.message)) {
      console.log(
        "\n  The JS wrapper loaded but its compiled binary did not. Either the\n" +
          "  rebuild never produced one, or it was built for a different Node\n" +
          "  major than the one running now — compare 'node binary' above with\n" +
          "  the version in Setup Node.js App, then press Run NPM Install.\n",
      );
    }
  }
}

console.log(
  failed
    ? "\nResult: NOT READY — fix the FAIL lines above, then Restart the app.\n"
    : "\nResult: ready. Restart the app and sign in.\n",
);
process.exit(failed ? 1 : 0);
