# RestroReserve — Deployment

> Rewritten 2026-07-28 for the POS pivot: RestroReserve is **self-hosted and local-first**. The old Vercel/Neon instructions are in git history.

## Target Platform

A machine the restaurant controls, running a single long-lived Node process:

- **Typical:** a mini-PC/NUC or spare laptop in the outlet, on the same Wi-Fi as the staff tablets/phones.
- **Alternative:** a VPS shared by several outlets, or shared with the restaurant's other sites — see [Shared server](#shared-server) below.

The long-running process matters: the in-process backup scheduler (`instrumentation.ts`) only runs while the app runs. Do not deploy to serverless platforms without replacing the scheduler.

## What any server must provide

These are hard requirements, not preferences. Check them before choosing a host.

| Requirement | Why | What breaks otherwise |
|---|---|---|
| **Node 20 minimum, 22 LTS preferred** | `engines` in package.json; `better-sqlite3` prebuilds are per-ABI | Native module fails to load, cryptically. Node 20 is verified working, but a transitive Prisma package declares `>=22`, so `npm ci` warns on 20 |
| **A long-lived process** (`next start`) | The backup scheduler lives in it | Backups silently stop; the app 502s on idle-kill hosts |
| **Exactly one process** | See below — this is the one people get wrong | Duplicate backups, broken rate limiting, SQLite write contention |
| **A native module can install** | `better-sqlite3` runs `prebuild-install \|\| node-gyp rebuild` | Needs a matching prebuilt binary, or `python3` + `make` + `g++` |
| **A writable, persistent `data/`** | `app.db`, `uploads/`, `backups/` | Data lost on redeploy; uploads 500 |
| **A port you can bind** | `next start` honours `$PORT` | — |

### Run exactly one process

No PM2 cluster mode, no Passenger multi-worker, no two containers behind a load balancer. Three separate reasons, all in the current design:

1. **The rate limiter is in-memory** (`src/lib/rate-limit.ts`). Two processes means two independent PIN-attempt counters, so the brute-force limit is effectively doubled per extra worker.
2. **The backup scheduler is in-process** (`instrumentation.ts`). Two processes means two schedulers writing backups on the same schedule.
3. **SQLite has one writer.** The `better-sqlite3` adapter sets a 5-second busy timeout, so concurrent readers wait rather than fail — but the database is in rollback-journal mode, so writes still block readers for the duration of the write.

If you ever need more than one process, all three have to be solved first: shared rate-limit state (Redis or sticky routing), one designated scheduler, and `journal_mode=WAL`. That is the same list as the hosted design in DESIGN.md.

## Shared server

"Shared server" means three different things, and only two of them work.

| What you mean | Verdict |
|---|---|
| A VPS shared by **several outlets of this organization** | Works, and is already supported — one app, one database, outlets separated by the tenancy scoping in `src/lib/` |
| A VPS shared with the restaurant's **other sites** | Works — put RestroReserve on its own subdomain behind the existing reverse proxy |
| **cPanel-style shared hosting** | Usually fails — see the checks below |

Before either of the working options, be clear about the trade: the app was built local-first so that service continues when the internet does not. On a remote server, an internet or host outage stops the till. That is a business decision (see DESIGN.md, "Proposed: Hosted Multi-Tenant Platform"), not a technical detail.

### First release: VPS behind a reverse proxy

```bash
# 1. As a non-root user
git clone <repo-url> restroreserve && cd restroreserve
npm ci
cp .env.example .env
```

Edit `.env` — two settings differ from the LAN setup and both matter:

```ini
DATABASE_URL="file:/srv/restroreserve-data/app.db"   # OUTSIDE the deploy tree
SESSION_SECRET="…"                                    # openssl rand -base64 32
APP_URL="https://pos.example.com"                     # https, or the cookie won't be Secure
TRUSTED_PROXY=1                                       # only because a proxy is in front
```

- **`APP_URL` must start with `https://`.** The session cookie's `Secure` flag is derived from it (`src/lib/session.ts`). Leave it `http://` on an internet-facing host and the session cookie travels unprotected.
- **`TRUSTED_PROXY=1` only when a proxy really is in front.** With a proxy, every request otherwise looks like it came from the proxy's IP, collapsing per-client rate limits into one bucket. Without a proxy, setting it lets a client forge `x-forwarded-for` and dodge throttling entirely.
- **Keep `data/` outside the deploy tree** if your deploy replaces the directory. An absolute `DATABASE_URL` plus a symlinked `data/` is the simplest arrangement; otherwise a `git pull`-style deploy is fine as-is.

```bash
# 2. Migrate, seed, then build
npx prisma migrate deploy
npx prisma db seed        # first deploy only — or restore a backup instead
npm run build
```

```ini
# 3. /etc/systemd/system/restroreserve.service
[Unit]
Description=RestroReserve POS
After=network.target

[Service]
Type=simple
User=restro
WorkingDirectory=/srv/restroreserve
Environment=NODE_ENV=production
Environment=PORT=3000
ExecStart=/usr/bin/npm run start
Restart=always
RestartSec=3

[Install]
WantedBy=multi-user.target
```

```nginx
# 4. Reverse proxy — nginx. Caddy needs only `reverse_proxy localhost:3000`.
server {
  server_name pos.example.com;
  client_max_body_size 8M;              # dish photos are up to 4 MB
  location / {
    proxy_pass http://127.0.0.1:3000;
    proxy_set_header Host $host;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
  }
}
```

Then TLS (`certbot --nginx -d pos.example.com`), and **firewall port 3000 so only the proxy reaches it** — otherwise the app is also served over plain HTTP on the public IP, where the `Secure` cookie won't be sent and staff will appear unable to sign in.

### cPanel-style shared hosting — check these first

Most such hosts fail at least one of these. Test in this order; each is cheap and each is fatal.

1. **`npm install better-sqlite3` succeeds.** No prebuilt binary for the host's Node/libc means it compiles, which needs `python3`, `make` and `g++` — usually absent. Alpine/musl hosts always compile.
2. **Your process is allowed to stay running,** and the host does not spawn multiple workers for it. Passenger's default is several. If you cannot pin it to one, stop here (see [Run exactly one process](#run-exactly-one-process)).
3. **A directory outside the web root is writable and persists across deploys.** `data/` holds the database, the payment QR and dish photos. If it sits under the web root, the backup JSONs — which contain every password and PIN hash — become downloadable.

If any of the three fails, the cheapest working option is the smallest VPS your provider sells. This app needs one process and a disk, not much else.

### FTP-only hosting — this cannot work

If the only access to the server is FTP, RestroReserve cannot run there. Not "awkward" — structurally impossible, for two independent reasons:

1. **FTP moves files; it cannot start a process.** Next.js serves from a live Node process (`next start`). Uploading the app leaves you with files nothing is executing. There is no `.htaccess` or index file that changes this — a PHP/static host has no Node runtime to hand the request to.
2. **The database driver is a compiled binary for one exact platform.** `better-sqlite3` ships `better_sqlite3.node`; the copy in this repo is `Mach-O 64-bit arm64` (built for the dev Mac) and will not load on a Linux host. Producing a matching one means compiling on that platform — which needs a shell, which you don't have.

And two more that follow from the same root: `prisma migrate deploy` can't run, so the schema can never change; and the backup scheduler lives in the process, so there are no automatic backups.

Uploading a pre-built app doesn't rescue it either. Building locally and FTP-ing the result means pushing **~22 MB of build output plus 844 MB of `node_modules` across 31,733 files** — hours over FTP, partial failures likely — and it still ends with a platform-wrong native binary and nothing running it.

If the host has a cPanel **"Setup Node.js App"** panel, there is a path — see the next section.

**What to do instead**, in order of preference:

| Option | Needs | Why it's better |
|---|---|---|
| **Mini-PC/NUC in the restaurant** | a box and the shop Wi-Fi | The design intent: service keeps running when the internet doesn't |
| **Cheapest VPS + a subdomain** | DNS access to point `pos.yourdomain` at it | Keeps the existing shared host serving the website; full shell for releases |

Neither costs much more than the shared plan, and both are a straightforward path from here. Keep the FTP host for the public website.

### cPanel-only hosting (no shell) — the workable path

If the panel has **Setup Node.js App** (CloudLinux Node.js Selector + Passenger, standard on most cPanel plans), this app can run without ever opening a shell. It is fiddlier than a VPS and worth doing only if a VPS is genuinely not an option.

**Check these four first. Any failure ends the attempt.**

| Check | Where | Fails when |
|---|---|---|
| Node **20+** offered (22 preferred) | Setup Node.js App → Node version | Plan is stuck on 18 or older |
| You can set **environment variables** | same panel | Panel hides them; you cannot pass `SESSION_SECRET` |
| **Run NPM Install** completes | same panel | `better-sqlite3` has no prebuild for that Node/libc and no compiler is available |
| App runs as **one process** | ask support for `passenger_max_pool_size` / `PASSENGER_MAX_POOL_SIZE=1` | Panel insists on several workers — see [Run exactly one process](#run-exactly-one-process) |

The fourth is the one that quietly bites: several workers means duplicate scheduled backups and a PIN brute-force limit multiplied by the worker count.

**The trick that makes this work: build locally, install on the host.**

- `next build` is memory-hungry and shared plans cap RAM, so build on your own machine and upload `.next`.
- `node_modules` must be installed **on the host**, because `better-sqlite3` is a platform-specific binary — your Mac's copy is `Mach-O arm64` and will not load on their Linux. Never upload `node_modules`; use the panel's **Run NPM Install** button.
- **The build must be a webpack build**, which is why `npm run build` passes `--webpack`. Turbopack resolves native packages through content-hashed *symlinks* it writes into `.next/node_modules` (`better-sqlite3-90e2652d…` → `../../node_modules/better-sqlite3`). FTP cannot carry a symlink, so a Turbopack build uploads "successfully" and then every page 500s with `Cannot find module 'better-sqlite3-<hash>'` — verified by deploying a copy into a clean directory and booting it. The webpack build emits no `.next/node_modules` at all, and is about a third the size (6 MB / ~370 files versus 22 MB / ~860). If you ever build by hand, do not reach for `next build` directly.

**Automated releases.** `.github/workflows/deploy.yml` does all of the below on a push to the `deploy` branch: typecheck, lint, tests, build, assemble the upload tree, and push it over FTPS. It refuses to ship if the release would carry a `data/` directory, an `.env`, a `*.db`, or a compiled `*.node` binary, and it fails the run when a release contains migrations the live database cannot have applied. Configure `FTP_SERVER`/`FTP_USERNAME`/`FTP_PASSWORD` (secrets) and `FTP_REMOTE_PATH`/`NODE_VERSION` (variables) under Settings → Secrets and variables → Actions. The manual steps below remain the reference for the first deploy and for anything the workflow deliberately will not touch — the database and the panel buttons.

**Steps**

1. **Locally:** `npm ci && npm run build`. Then run `npx prisma migrate deploy` against a *fresh* `data/app.db` and `npx prisma db seed` — you are producing a ready-made database file, because you cannot run migrations on the host.
2. **Upload** by File Manager or FTP into the app root (e.g. `/home/USER/restroreserve`), **not** `public_html`:
   - `.next/` (only `server/`, `static/`, `build/` and the manifests — skip `.next/dev`, which is dev-server scratch and can be gigabytes)
   - `public/`, `prisma/`, `src/`, `server.js`, `package.json`, `package-lock.json`, `next.config.ts`, `postcss.config.mjs`, `tsconfig.json`
   - `data/app.db` — the migrated, seeded database from step 1
   - **Not** `node_modules`, **not** `.env`, **not** `.next/dev`
3. **Create the app** in Setup Node.js App:
   - *Application root:* `restroreserve`
   - *Application URL:* your subdomain, e.g. `pos.example.com`
   - *Application startup file:* **`server.js`** — this repo ships one for exactly this purpose. Passenger runs a file, not `npm run start`, and `server.js` is the minimal Next custom server ([Next's documented pattern](https://nextjs.org/docs/app/guides/custom-server)).
4. **Set environment variables** in the panel:

   ```ini
   NODE_ENV=production
   DATABASE_URL=file:/home/USER/restroreserve/data/app.db   # absolute
   SESSION_SECRET=<openssl rand -base64 32>
   APP_URL=https://pos.example.com                          # https, or the cookie isn't Secure
   TRUSTED_PROXY=1                                           # Apache/LiteSpeed sits in front
   ```

5. **Run NPM Install** in the panel. Watch for `better-sqlite3`; if it errors here, stop — see the check table.
6. **Restart** from the panel. Passenger also restarts when `tmp/restart.txt` in the app root changes, which you can `touch` over FTP — handy, since it is the one control you have without the panel.
7. **Enable AutoSSL** for the subdomain, then run the [Post-Deploy Checks](#post-deploy-checks) against the public https URL.

**What was verified here, and what wasn't.** `server.js` was tested locally against a production build: every page and API route served, the 404 boundary returned a real 404, no dev chunks, and — the one that could have silently broken — **`instrumentation.ts` still runs, so scheduled backups work under a custom server** (proved by `[backup] wrote 1 scheduled backup(s)` after a clean boot with a backup due). Passenger itself could not be tested from here; the panel-specific steps are from its documented behaviour.

**Releasing an update afterwards** is the same shape, minus the database: rebuild locally, upload the changed `.next/` and `src/`, press Run NPM Install only if `package.json` changed, then Restart. **If the release contains a migration**, you cannot run it on the host — take the live `data/app.db` down by File Manager, migrate it locally, and upload it back during a closed period. That is the real cost of this hosting: every schema change becomes a manual, offline database swap.

### Dependency advisories

`npm audit` currently reports **12 high-severity advisories, none in the code path this app serves requests from** (checked 2026-07-30):

- **9 are the ESLint toolchain** (`minimatch` → `brace-expansion` DoS). They are *installed* on the server (see below — this app cannot build without devDependencies) but never executed: ESLint runs in development and CI, never in the request path.
- **`postcss`** — build-time CSS processing, and the only CSS it ever sees is ours.
- **`sharp`** — libvips CVEs, reachable only through Next's image optimizer. This app imports `next/image` nowhere (it serves dish photos as plain `<img>` from its own disk), so nothing routes attacker-supplied images into it.

Run `npm audit fix` (non-breaking) before an internet-facing deploy, and re-check after any Next upgrade — a Next minor bump is what clears `postcss` and `sharp`. Do not run `npm audit fix --force`: it will move major versions.

### Releasing to a shared server

The LAN recipe below ([Routine releases](#routine-releases-outlet-box-on-the-lan)) is `git pull && build && restart`. On a shared, internet-facing server the same steps need an order and a couple of facts that are easy to get wrong.

**Install the full dependency tree. `--omit=dev` does not work here** — it looks like an obvious hardening and it breaks three separate things:

| Command | devDependency it needs |
|---|---|
| `npm run build` | `tailwindcss` + `@tailwindcss/postcss` (referenced by `postcss.config.mjs`), `typescript`, `@types/*` |
| `npx prisma migrate deploy` | `dotenv` — `prisma.config.ts` starts with `import "dotenv/config"` |
| `npx prisma db seed` | `tsx` — the seed runs as `npx tsx prisma/seed.ts` |

So either install everything on the server, or build on a machine that has everything and ship the artifact. Nothing in the extra tree is *executed* at request time.

**`next build` is memory-hungry.** On the 512 MB–1 GB VPS tiers, it can be OOM-killed. Add swap or build elsewhere — a build that dies halfway leaves `.next` in a state the old process may still be serving from.

**Release, in this order:**

```bash
# 0. Back up FIRST — before any migration touches the schema.
#    Owner → Admin → Back up now (the API needs an owner session cookie, so the
#    UI is the practical route), then copy that JSON off the box. Plus a raw
#    snapshot, which is the one that survives a bad migration:
cp -a /srv/restroreserve-data /srv/restroreserve-data.$(date +%F)

# 1. Fetch and install
cd /srv/restroreserve
git fetch --tags && git checkout <tag>
npm ci                       # full tree — see above

# 2. Migrate, then build. This order matters (next note).
npx prisma migrate deploy
npm run build

# 3. Swap the process
sudo systemctl restart restroreserve
```

**Why migrate before build, and what that costs.** `prisma migrate deploy` changes the schema while the *old* build is still serving traffic, so for a few seconds the running code sees a newer schema than it was compiled against. That is safe only for additive migrations — a new table, a new column with a default. A rename or a drop will make the old process throw until the restart lands. Every migration in this repo so far has been additive apart from one deliberate data step, but treat it as a rule: **additive-only if you release without a maintenance window**, otherwise stop the service first.

**Restarting drops in-flight requests.** `systemctl restart` is a hard swap, so a tap landing in that window fails. It recovers on its own: the client shows "Can't reach the till", and the board, bookings and order screens each re-poll within 15 seconds. Still, release between services rather than mid-dinner.

**Then run the [Post-Deploy Checks](#post-deploy-checks)** against the public URL, not `localhost` — the two things only the real URL exercises are TLS and the `Secure` cookie, and a wrong `APP_URL` presents exactly as "staff can't sign in".

**Rolling back a shared-server release:**

```bash
git checkout <previous-tag> && npm ci && npm run build
sudo systemctl restart restroreserve
```

Migrations are forward-only, so code rolls back but the schema does not. If the release included a migration you need to undo, restore the pre-release backup from step 0 *after* rolling the code back — that is the only reason step 0 is not optional.

## Environments

| Environment | Purpose | URL |
|---|---|---|
| local dev | development | http://localhost:3111 (3000 is usually taken on the dev machine) |
| outlet server | live, on restaurant LAN | http://&lt;server-ip&gt;:3000 *(record it here after setup)* |
| shared server | live, over the internet | https://&lt;subdomain&gt; *(record it here after setup)* — needs `APP_URL` https and `TRUSTED_PROXY=1` |

## Prerequisites

1. Node.js 20 minimum, 22 LTS preferred — see [What any server must provide](#what-any-server-must-provide).
2. This repo cloned onto it (`git clone … && npm ci`). The full dependency tree, including devDependencies: this app cannot build, migrate or seed without them.
3. A writable `data/` directory holding `app.db`, `uploads/`, `backups/` — created automatically beside the app, or pointed elsewhere with an absolute `DATABASE_URL` (see the shared-server recipe).
4. Staff devices on the same network, with the server's IP reachable (consider a static LAN IP or mDNS name).

## Environment Variables

| Name | Purpose | Where it's set |
|---|---|---|
| `DATABASE_URL` | SQLite location, e.g. `file:./data/app.db` | `.env` on the server |
| `SESSION_SECRET` | Signs session cookies — generate with `openssl rand -base64 32`; changing it logs every device out | `.env` on the server |
| `APP_URL` | The URL staff devices use (for absolute links on bills) | `.env` on the server |
| `TRUSTED_PROXY` | Set to `1` **only** if a reverse proxy in front of the app sets `x-forwarded-for`. Unset (the default, bare `npm run start`) means the header is ignored for rate limiting, because a client could otherwise rotate it to dodge throttling. | `.env` on the server |
| `DATA_DIR` | Absolute path holding the database directory, `uploads/` and `backups/`. Defaults to `data/` beside the app. **Set it whenever the app root is inside a web-served directory** — see below. | `.env`, or the cPanel panel |

### If the app root is web-served, move `DATA_DIR` — not just `DATABASE_URL`

Shared cPanel plans name a subdomain's document root after the domain (`/home/USER/pos.example.com/`), and anything under one is served as a static file by Apache before Passenger sees the request. Deploying there means `https://pos.example.com/package.json` answers 200 — and once the app writes data, `https://pos.example.com/data/backups/<org>_<date>.json` does too. That file is a whole-organization dump: every password hash, every PIN hash, every customer name and phone number.

Pointing `DATABASE_URL` somewhere private is **not sufficient**. Uploads and backups resolve from `DATA_DIR` (`src/lib/paths.ts`), not from the database URL, so they stay in the public folder unless you move them too. Set both, outside every document root:

```ini
DATA_DIR=/home/USER/restroreserve-data
DATABASE_URL=file:/home/USER/restroreserve-data/app.db
```

Better still, put the *application root* itself outside the document root — a plain `restroreserve/` directory, with the Node app's Application URL pointing at the subdomain. Passenger routes the subdomain to the app, and nothing under the app root is ever served statically. Verify either way by fetching `https://<your-domain>/package.json`: a 404 means private, a 200 means still exposed. The deploy workflow performs exactly that check after every upload when the `APP_ORIGIN` variable is set.

Never commit `.env` (gitignored). There are no third-party API keys in this system.

## First release (outlet box on the LAN)

For a shared server use [First release: VPS behind a reverse proxy](#first-release-vps-behind-a-reverse-proxy) instead — the `.env` differs in two ways that matter.

```bash
git clone <repo-url> restroreserve && cd restroreserve
npm ci                  # lockfile is committed — install exactly what was tested
cp .env.example .env    # then edit: set SESSION_SECRET, APP_URL
npx prisma migrate deploy
npx prisma db seed      # first boot only: creates the org/owner — or restore a backup instead
npm run build
npm run start           # add -- -p <port> if 3000 is taken
```

Then from a staff device, open `http://<server-ip>:3000`, sign in as the owner, and set real outlet details, users, and PINs. Before going live, change the seeded owner password (`owner1234`) and the demo manager/staff PINs — the seed values are public in `prisma/seed.ts`. Owner accounts intentionally have no PIN; leave them that way (see DESIGN.md, PIN scope). For unattended operation, wrap `npm run start` in a service:

- **Linux:** a `systemd` unit with `Restart=always` and `WorkingDirectory` set to the repo.
- **macOS:** a `launchd` plist (`KeepAlive`).

## Routine releases (outlet box on the LAN)

For a shared server use [Releasing to a shared server](#releasing-to-a-shared-server), which adds the backup-first ordering and the migration constraint.

```bash
git pull
npm ci
npx prisma migrate deploy
npm run build
# restart the service (systemctl restart restroreserve / launchctl kickstart)
```

Run `/deploy` in Claude Code first — it runs tests, lint, and the security-auditor gate before anything ships. Take a manual backup (owner → Back up now, or `POST /api/backups`) before every update.

## Backups & Restore

- **What:** complete JSON export of the organization (outlets, users incl. credential hashes, menus, tables, orders) written to `data/backups/<org>-<timestamp>.json`, rotated per the owner's retention setting.
- **When:** owner-configured schedule (off/daily/weekly) run by the app itself, plus manual "Back up now".
- **Restore:** owner → Backups → Restore (or `POST /api/backups/restore`); reproduces the org's data exactly. Also fine: stop the app and copy back a whole `data/` directory — SQLite is a single file.
- **Off-machine copies:** until remote upload ships (PRD §6), sync `data/backups/` off the server (external drive, rclone to any cloud) — a backup on the same disk as the database only protects against mistakes, not hardware loss.

## Rollback

- **App:** `git checkout <previous-tag-or-commit> && npm ci && npm run build`, restart the service.
- **Data:** restore the most recent backup JSON (or a copied `data/` snapshot). Migrations are forward-only; if a migration misbehaves, restore data from backup after rolling the code back.

## Post-Deploy Checks

1. `http://<server-ip>:<port>` loads; owner login works.
2. Staff PIN sign-in works on a floor device *without a manager present*: End shift → the PIN screen appears (not first-time setup) → a staff member signs in with name + PIN alone.
3. Seat a test table → add an item → settle (QR shows) → bill prints → table is free again. Cancel the test order's traces are acceptable (it's recorded as settled — use an obvious name like "TEST — ignore").
4. Reports page shows today including the test order.
5. "Back up now" produces a fresh file in `data/backups/` and `lastBackupAt` updates.
