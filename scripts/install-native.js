/*
 * Put the right better_sqlite3.node in place, at boot, before anything tries
 * to open the database.
 *
 * Why this exists: better-sqlite3 is a compiled module, and a shared host can
 * fail to provide one in two different ways. Its published prebuilts are
 * linked against glibc 2.29+, so on CentOS/CloudLinux 7 (glibc 2.17) they
 * install fine and then refuse to load. Forcing a source build instead needs
 * python3/make/g++, which such plans usually lack — the build fails and leaves
 * no binary at all, which is what "Could not locate the bindings file" means.
 *
 * So CI compiles the binary against an old glibc for each Node ABI we support
 * and ships it in vendor/. This copies the matching one into the installed
 * package. It runs from server.js on every boot, which matters because the
 * deploy touches tmp/restart.txt: a release fixes the binary by itself, with
 * nobody pressing Run NPM Install.
 *
 * Idempotent and non-fatal: if the module already loads, or there is no
 * matching vendored binary, it does nothing and lets the app report the
 * problem through /api/health.
 */
const fs = require("node:fs");
const path = require("node:path");

function log(msg) {
  console.log(`[native] ${msg}`);
}

function installBetterSqlite3() {
  // Already working? Leave it alone — never overwrite a binary the host built
  // for itself, which is always a better match than ours.
  try {
    const Database = require("better-sqlite3");
    new Database(":memory:").close();
    return;
  } catch {
    // fall through and try to repair
  }

  let pkgDir;
  try {
    pkgDir = path.dirname(require.resolve("better-sqlite3/package.json"));
  } catch {
    log("better-sqlite3 is not installed — run npm install on the host");
    return;
  }

  const abi = process.versions.modules; // 115 = Node 20, 127 = Node 22
  const vendored = path.join(
    __dirname,
    "..",
    "vendor",
    `better_sqlite3-abi${abi}-${process.platform}-${process.arch}.node`,
  );
  if (!fs.existsSync(vendored)) {
    log(`no vendored binary for ABI ${abi} on ${process.platform}-${process.arch}`);
    return;
  }

  const target = path.join(pkgDir, "build", "Release", "better_sqlite3.node");
  try {
    fs.mkdirSync(path.dirname(target), { recursive: true });
    fs.copyFileSync(vendored, target);
    log(`installed ${path.basename(vendored)} -> ${target}`);
  } catch (err) {
    log(`could not install the binary: ${err.message}`);
  }
}

module.exports = { installBetterSqlite3 };
