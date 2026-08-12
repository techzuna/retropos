/*
 * Passenger entry point — for cPanel / Plesk "Setup Node.js App" only.
 *
 * Those panels run a *file*, not an npm script, so `npm run start` is not an
 * option there. This is the smallest custom server that boots Next and hands it
 * every request, per node_modules/next/dist/docs/01-app/02-guides/custom-server.md.
 *
 * Deliberately CommonJS: package.json has no `"type": "module"`, and this file
 * does not go through the Next compiler — it runs on the host's bare Node.
 *
 * Nothing else uses it. `npm run dev` and `npm run start` are unchanged, so a
 * LAN or VPS deployment should ignore this file entirely.
 *
 * Passenger provides the port through $PORT; it also accepts a socket path
 * there, which `listen()` handles either way.
 */
/*
 * Make WebAssembly bounds-checked before anything can instantiate it.
 *
 * Prisma 7's query compiler is WASM, and V8 normally reserves a multi-gigabyte
 * guard region per Wasm memory so it can use trap handlers instead of explicit
 * checks. Under CloudLinux LVE, "Max address space" is capped (4 GiB on this
 * host), so that reservation is refused and the process dies on the first
 * query with:
 *   RangeError: WebAssembly.instantiate(): Out of memory
 *   FATAL ERROR: ... JavaScript heap out of memory
 * — misleading, because the heap was only ~27 MB. It is address space, not heap.
 *
 * Explicit bounds checks need no guard region. Slightly slower Wasm, which is
 * irrelevant here. This has to run before `next` is required, and cannot go in
 * NODE_OPTIONS (Node rejects V8 flags there) or on the command line (Passenger
 * runs a file, not a command).
 */
try {
  require("node:v8").setFlagsFromString("--wasm-enforce-bounds-checks");
} catch {
  // Older V8 without the flag: carry on rather than refuse to boot.
}

// Repair the native database driver before Next loads anything that uses it.
// On hosts that can neither run our prebuilt (old glibc) nor compile their own
// (no toolchain), this is what makes the app work at all — and it runs on every
// boot, so a deploy fixes it without anyone touching the hosting panel.
require("./scripts/install-native").installBetterSqlite3();

const { createServer } = require("http");
const next = require("next");

const port = process.env.PORT || 3000;
const dev = process.env.NODE_ENV !== "production";

const app = next({ dev });
const handle = app.getRequestHandler();

app
  .prepare()
  .then(() => {
    createServer((req, res) => handle(req, res)).listen(port, () => {
      // Passenger captures stdout into the app's log, which is the only place
      // you can see whether this got as far as listening.
      console.log(`RestroReserve listening on ${port} (dev=${dev})`);
    });
  })
  .catch((err) => {
    // Without this, a failed boot is a silent 502 with nothing in the log.
    console.error("RestroReserve failed to start:", err);
    process.exit(1);
  });
