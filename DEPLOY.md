# RestroReserve — Deployment

Two products come out of this repository, and they are deployed differently.

**`apps/onsite`** is the self-hosted build: SQLite in a single file, one long-lived Node process, running on a machine the restaurant controls. Its whole point is that service continues when the internet does not. This is what is live today.

**`apps/cloud`** is the hosted multi-tenant service: Postgres, many restaurants, subscription. It talks to its database over the network through the pure-JavaScript `pg` driver, so it has none of the native-module trouble the onsite build has to survive, and it deploys anywhere that runs Node. It currently boots and answers `/api/health`; signup and the POS screens are still to come.

Feature code lives in `packages/`, so a fix reaches both. Only the parts that genuinely differ — the database driver, where files are stored, how the process is supervised — live in the apps.

Four situations follow, in the order you are likely to meet them: your own machine, a customer's box, shared hosting, and a VPS.

---

## Running both locally

One install covers every workspace. Run everything from the repository root.

```bash
npm install
```

The two apps run side by side on different ports against different databases, which is the point: a change in `packages/` should show up in both without touching either app.

```bash
npm run onsite -- dev -- -p 3111    # http://localhost:3111
npm run cloud  -- dev -- -p 3222    # http://localhost:3222
```

**Onsite needs nothing else.** SQLite is a file, created for you at `apps/onsite/data/app.db`. Sign in with the seeded owner (see `CREDENTIALS.md`).

**Cloud needs a Postgres to talk to.** Once:

```bash
createdb restroreserve_cloud
cp apps/cloud/.env.example apps/cloud/.env     # set DATABASE_URL and SESSION_SECRET
cd apps/cloud && npx prisma migrate deploy
```

Each app keeps its own `.env` beside it — `apps/onsite/.env`, `apps/cloud/.env`. Next loads the file from the app's own directory, so a `.env` at the repository root is read by nothing. That is a real trap: the dev server starts happily and every database call fails.

### Is it actually working?

Both apps answer a health endpoint without a login, because the question that matters most is usually asked when nobody can log in.

```bash
curl -s localhost:3111/api/health
{"ok":true,"node":"v20","driver":"ok","wasm":"ok","database":"ok"}

curl -s localhost:3222/api/health
{"ok":true,"node":"v20","database":"ok","organizations":0}
```

For onsite, `driver` is whether the compiled SQLite binding loaded, `wasm` is whether Prisma's WebAssembly query compiler could allocate, and `database` is whether the file opened and has an owner account. A failure adds a `reasons` array with a coarse code — `database-file-missing`, `native-binding-missing`, `schema-missing` — which is enough to know what to fix without exposing anything to a stranger. Cloud has no native driver and no Wasm constraint, so it only reports the database.

### Before you push

```bash
npm test          # every workspace
npm run lint
npm run typecheck
npm run db:check  # both schemas still match packages/db/models.prisma
npm run build     # production build of both apps
```

### Changing the data model

Edit **`packages/db/models.prisma`** — never an app's `schema.prisma`, which is generated and will be overwritten.

```bash
npm run db:compose                                        # rewrite both app schemas
cd apps/onsite && npx prisma migrate dev --name what_changed
cd ../cloud    && npx prisma migrate dev --name what_changed
```

Both apps need their own migration: SQLite and Postgres generate different SQL for the same change. `npm run db:check` fails CI if a generated schema was hand-edited, which is what stops the two products quietly growing different columns.

The models avoid enums, arrays and native column types. That began as a SQLite limitation and is now the contract that lets one model file serve both providers — keep it.

---

## Deploying onsite at a customer

A small always-on machine in the restaurant, on the same network as the staff tablets. This is the design target and the only arrangement where an internet outage does not stop the till.

### The machine

A fanless mini-PC: 4 cores, **8 GB RAM**, an NVMe or SATA **SSD** (not eMMC, not an SD card), wired Ethernet. The database is tiny; the RAM is for `next build`, which peaks well above a gigabyte. 4 GB works with swap added; 2 GB gets killed mid-build.

SQLite is crash-safe here — rollback journal with `synchronous=FULL`, so a power cut rolls the in-flight write back — but that guarantee depends on the storage telling the truth about flushing. Consumer SSDs do; eMMC and SD cards often do not, and they wear out under a write-per-order workload. Add a small UPS, and put the router on it too: a running server the tablets cannot reach is the same as no server.

### OS and Node

Debian 12 or 13, server install, no desktop. Then Node **22 LTS**:

```bash
sudo apt-get update && sudo apt-get install -y curl ca-certificates git
curl -fsSL https://deb.nodesource.com/setup_22.x | sudo -E bash -
sudo apt-get install -y nodejs
node -v && node -p process.versions.modules   # expect v22.x and ABI 127
```

The Node major matters more than it looks. `better-sqlite3` publishes no prebuilt binary for Node 20's ABI at all, so on Node 20 the install falls through to compiling from source and needs `build-essential` and `python3` present. On Node 22 a prebuilt exists and a modern Debian's glibc is new enough to load it.

If the box has less than 8 GB, add swap before building:

```bash
sudo fallocate -l 4G /swapfile && sudo chmod 600 /swapfile
sudo mkswap /swapfile && sudo swapon /swapfile
echo '/swapfile none swap sw 0 0' | sudo tee -a /etc/fstab
```

### Install

```bash
cd ~ && git clone <repo-url> restroreserve && cd restroreserve
npm ci                                  # the full tree, from the repo root
```

Install everything — `--omit=dev` looks like sensible hardening and breaks three things: `next build` needs `tailwindcss` and `typescript`, `prisma migrate` needs `dotenv` (loaded by `prisma.config.ts`), and `prisma db seed` needs `tsx`. None of it runs at request time.

Now the configuration, in `apps/onsite/.env`:

```ini
DATABASE_URL="file:./data/app.db"
SESSION_SECRET="<openssl rand -base64 32>"
APP_URL="http://192.168.1.50:3000"
```

```bash
chmod 600 apps/onsite/.env    # this file holds the key that signs every session
```

Three things about that file:

**`APP_URL` stays `http://` on a LAN.** Its only effect is one line in `src/lib/session.ts`: the session cookie is marked `Secure` if and only if `APP_URL` begins with `https://`. Set it to `https://` on a plain-http box and browsers refuse to store the cookie — sign-in appears to work and bounces straight back to the login screen, on every tablet, with nothing in the log explaining it. Confusingly it still works in a browser *on the box itself*, because localhost counts as a secure context.

**Leave `DATA_DIR` unset.** It exists for hosts that serve the application directory as static files. Here `next start` serves only `public/` and `.next/static`, so the default — `data/` beside the app — is correct.

**Leave `TRUSTED_PROXY` unset.** There is no reverse proxy on a LAN box, and setting it lets anyone on the shop Wi-Fi forge `x-forwarded-for` and sidestep PIN throttling entirely.

### Database and first owner

```bash
cd apps/onsite
npx prisma migrate deploy      # creates data/ and app.db
npx prisma db seed             # the ONLY way to create the first organization and owner
npm run build                  # 1–3 minutes
```

The seed runs once and skips if an organization already exists. It creates demo content — a fictional restaurant, outlets, menu — because there is no setup wizard; you edit it into the real thing through the owner screens afterwards. **Change the seeded owner password and every PIN before the box goes into service**: those values are public in `prisma/seed.ts`.

### Keeping it running

Passenger and PM2 are not involved here; systemd is enough.

```ini
# /etc/systemd/system/restroreserve.service
[Unit]
Description=RestroReserve POS (onsite)
After=network.target

[Service]
Type=simple
User=restro
WorkingDirectory=/home/restro/restroreserve/apps/onsite
Environment=NODE_ENV=production
Environment=PORT=3000
ExecStart=/usr/bin/npm run start
Restart=always
RestartSec=3

[Install]
WantedBy=multi-user.target
```

`WorkingDirectory` is load-bearing: both `DATABASE_URL` and the default data directory resolve relative to it, so starting from the wrong place silently creates a second, empty database.

```bash
sudo systemctl daemon-reload
sudo systemctl enable --now restroreserve
systemctl status restroreserve
journalctl -u restroreserve -f
```

**Exactly one process.** No PM2 cluster mode, no second unit. The backup scheduler lives inside the process (two would write duplicate backups) and the PIN rate limiter is an in-memory map (two would double the brute-force allowance). If you ever need more, all three of shared rate-limit state, a designated scheduler, and WAL mode have to be solved first.

### Reaching it from the tablets

Staff type the box's address, so it must not move. Pin it with a **DHCP reservation in the router** rather than a static IP on the box — one place to change, and it cannot collide.

mDNS (`http://pos.local:3000`) works from iPhones and iPads out of the box and needs `avahi-daemon` on the box; Android support is unreliable enough that the IP remains the answer you write on a sticker.

### Updating a customer's box

Back up first — that ordering is the only reason step 0 exists.

```bash
# 0. Owner → Admin → Back up now, and copy that JSON off the box. Then a raw snapshot,
#    which is the one that survives a bad migration:
cp -a apps/onsite/data ~/restroreserve-data.$(date +%F)

cd ~/restroreserve
git pull
npm ci
cd apps/onsite && npx prisma migrate deploy
cd ../.. && npm run build --workspace apps/onsite
sudo systemctl restart restroreserve
```

Migrate before building, and never the reverse: a half-finished build leaves `.next` in a state the running process may still be serving from.

### What this does not give you

One machine, one point of failure. If it dies mid-service there is no failover — keep the last backup somewhere you can reach, and know that a spare box needs an OS install before it can take over. The tablets have no offline mode either: they are browsers, so if the box is down, ordering stops. That is the trade for a till that ignores an ISP outage.

---

## Deploying to shared hosting (cPanel and Passenger)

This is where the live deployment runs, and it took a day of archaeology. Most of what follows exists because something specific broke.

### Whether the plan can host it at all

Four checks, in order. Each is cheap and each is fatal.

| Check | Fails when |
|---|---|
| **Setup Node.js App** exists (CloudLinux Node Selector + Passenger) | Plan is PHP-only — then nothing here applies |
| Node **20+** offered | Stuck on 18 or older |
| **Environment variables** can be set in the panel | Panel hides them, so `SESSION_SECRET` cannot be passed |
| App runs as **one process** | Panel insists on several workers — see the one-process rule above |

Notably absent from that list: a compiler. The release now carries its own database binary, which is the next section.

### The three things that make it work

**The build must be webpack, not Turbopack.** `apps/onsite/package.json` runs `next build --webpack` deliberately. Turbopack resolves native packages through content-hashed *symlinks* under `.next/node_modules`, and FTP cannot carry a symlink — so a Turbopack build uploads cleanly and then every page 500s with `Cannot find module 'better-sqlite3-<hash>'`. The webpack build emits no such directory and is about a third the size. Do not "simplify" this back.

**The database driver is compiled for the host, by CI.** `better-sqlite3` publishes no prebuild for Node 20's ABI, and its Node 22 prebuild needs glibc 2.29 while CloudLinux 7 ships 2.17 — prebuilt too new, compiling impossible without a toolchain. So the deploy workflow compiles the binary inside a `manylinux2014` container (which *is* CentOS 7, glibc 2.17) for both ABIs, ships it in `vendor/`, and `apps/onsite/server.js` installs the matching one at boot via `scripts/install-native.js`. Because a deploy touches `tmp/restart.txt`, a release repairs the driver by itself with nobody in the hosting panel.

**WebAssembly is bounds-checked, not guarded.** Prisma's query compiler is Wasm, and V8 normally reserves a multi-gigabyte guard region per Wasm memory. CloudLinux LVE caps address space, so that reservation is refused and the process dies reporting a heap OOM while the heap is 27 MB — it is address space, not heap. `server.js` sets `--wasm-enforce-bounds-checks` before requiring Next. It cannot go in `NODE_OPTIONS` (Node rejects V8 flags there) or on the command line (Passenger runs a file).

### The automated deploy

`.github/workflows/deploy.yml` ships **`apps/onsite` only**, on a push to the `deploy` branch. It typechecks, lints, runs the tests, checks the schemas still match the shared models, builds, assembles an allow-listed release, and uploads over FTPS.

It refuses to ship in several ways on purpose: a release containing `data/`, an `.env`, a `*.db` or a stray `*.node`; an `FTP_REMOTE_PATH` inside `public_html` or one that looks like a document root; and a release whose migrations the live database cannot have applied — because this host has no shell, so `prisma migrate deploy` cannot reach `data/app.db`. After uploading it fetches your public URL and fails the run if the code is downloadable.

Configure under Settings → Secrets and variables → Actions:

| | |
|---|---|
| Secrets | `FTP_SERVER`, `FTP_USERNAME`, `FTP_PASSWORD` |
| Variables | `FTP_REMOTE_PATH` (application root, trailing slash, **not** `public_html`), `APP_ORIGIN`, `NODE_VERSION` |

Releasing is `git push origin main:deploy`. If a release contains a migration, migrate the database by hand first — download `data/app.db`, run `npx prisma migrate deploy` against it locally, upload it back during a closed period — then re-run the workflow with `migrations_already_applied` ticked.

### One-time panel setup

In **Setup Node.js App**: Node 22, Application root a **plain directory** such as `restroreserve`, Application URL your subdomain, startup file **`server.js`**.

The application root must **not** be the subdomain's document root. cPanel names those after the domain (`/home/USER/pos.example.com/`), and anything inside one is served as a static file before Passenger sees the request. Deploying there once made `package.json`, `server.js` and `prisma/schema.prisma` downloadable — and would have exposed `data/app.db`, which is every password hash, PIN hash and customer phone number in the business. Verify with `curl -I https://your-domain/package.json`: 404 is right, 200 is not.

Environment variables go in the panel, not a file — the workflow never uploads `.env`:

```ini
NODE_ENV=production
DATA_DIR=/home/USER/restroreserve-data
DATABASE_URL=file:/home/USER/restroreserve-data/app.db
SESSION_SECRET=<openssl rand -base64 32>
APP_URL=https://pos.example.com
TRUSTED_PROXY=1
```

`DATA_DIR` moves the database directory, uploads **and** backups together. Pointing `DATABASE_URL` somewhere private is not sufficient: uploads and backups resolve from `DATA_DIR` (`src/lib/paths.ts`), so the backup JSONs would stay in the app directory. Those files are a whole-organization dump including every credential hash.

Then press **Run NPM Install**, and **Restart**. The panel's *Run JS script* button can run `check`, a preflight that reports which Node it used, whether the driver loaded, and whether the database opened.

### Can the cloud app run here too?

Not comfortably, and usually not at all.

It has no native module and no Wasm address-space problem, so the two hardest onsite obstacles vanish. But it needs **Postgres**, and shared cPanel plans overwhelmingly offer MySQL only. Without a Postgres you would have to point `DATABASE_URL` at a hosted one (Neon, Supabase) across the public internet, which adds latency to every query on a host already spending ~1.4 s of CPU per request.

That number is the real objection. Measured on this host: a static file takes 42 ms, a request that reaches Node takes about 1.4 s, and the same request locally takes 3 ms. That is survivable for one restaurant whose staff are standing in it. It is a poor foundation for a service you charge other restaurants for. Put the cloud app on a VPS.

---

## Deploying to a VPS

The most flexible option, and the only sensible home for the cloud app. Both can share one box.

### Sizing and base setup

2 vCPU and 2 GB RAM is enough for one app, 4 GB if you run both and build on the box. Add swap if you are at 2 GB. A Hetzner CX22 or equivalent is around €4/month.

```bash
adduser restro && usermod -aG sudo restro     # do not run the app as root
curl -fsSL https://deb.nodesource.com/setup_22.x | sudo -E bash -
sudo apt-get install -y nodejs nginx certbot python3-certbot-nginx git
```

Clone the monorepo once; both apps run from it.

```bash
sudo -u restro -i
git clone <repo-url> restroreserve && cd restroreserve && npm ci
```

### Postgres, for the cloud app

```bash
sudo apt-get install -y postgresql
sudo -u postgres createuser --pwprompt restro
sudo -u postgres createdb -O restro restroreserve_cloud
```

`apps/cloud/.env`:

```ini
DATABASE_URL="postgresql://restro:PASSWORD@localhost:5432/restroreserve_cloud"
SESSION_SECRET="<openssl rand -base64 32>"
APP_URL="https://app.example.com"
TRUSTED_PROXY=1
```

`apps/onsite/.env` on the same box:

```ini
DATABASE_URL="file:./data/app.db"
DATA_DIR="/srv/restroreserve-data"
SESSION_SECRET="<a DIFFERENT openssl rand -base64 32>"
APP_URL="https://pos.example.com"
TRUSTED_PROXY=1
```

**The two apps must not share `SESSION_SECRET`.** It is the key that signs session cookies; a shared value means a cookie minted by one app verifies in the other, and since both read the same claim names, a session from the single-tenant build would be accepted by the multi-tenant one. Different secrets, always.

`TRUSTED_PROXY=1` is correct here — and only here — because nginx really is in front and sets `X-Forwarded-For`. `DATA_DIR` is set for onsite so its database and backups sit outside the deploy tree and survive a `git pull` that replaces the directory.

```bash
cd apps/cloud  && npx prisma migrate deploy && cd ../..
cd apps/onsite && npx prisma migrate deploy && npx prisma db seed && cd ../..
npm run build
```

### Two services

Two units, two ports, same shape as the onsite unit above but with `WorkingDirectory` and `PORT` differing:

```ini
# /etc/systemd/system/restroreserve-onsite.service   → PORT=3000, apps/onsite
# /etc/systemd/system/restroreserve-cloud.service    → PORT=3001, apps/cloud
```

```bash
sudo systemctl enable --now restroreserve-onsite restroreserve-cloud
```

### nginx and TLS

```nginx
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

server {
  server_name app.example.com;
  client_max_body_size 8M;
  location / {
    proxy_pass http://127.0.0.1:3001;
    proxy_set_header Host $host;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
  }
}
```

```bash
sudo certbot --nginx -d pos.example.com -d app.example.com
sudo ufw allow 'Nginx Full' && sudo ufw allow OpenSSH && sudo ufw enable
```

**Firewall ports 3000 and 3001 so only nginx reaches them.** Otherwise the app is also served over plain HTTP on the public IP, where the `Secure` cookie is not sent — and staff will report that sign-in silently fails, with nothing wrong in the logs.

### Releasing

```bash
# 0. Back up first, per app.
cp -a /srv/restroreserve-data /srv/restroreserve-data.$(date +%F)
pg_dump -U restro restroreserve_cloud > ~/cloud-$(date +%F).sql

cd ~/restroreserve
git fetch --tags && git checkout <tag>
npm ci
cd apps/onsite && npx prisma migrate deploy && cd ../cloud && npx prisma migrate deploy && cd ../..
npm run build
sudo systemctl restart restroreserve-onsite restroreserve-cloud
```

`next build` is memory-hungry; on a 2 GB box it can be OOM-killed, leaving `.next` half-written while the old process still serves from it. Add swap, or build elsewhere and copy the result.

---

## Environment variables

| Name | Purpose | Onsite | Cloud |
|---|---|---|---|
| `DATABASE_URL` | SQLite path (`file:…`) or Postgres URL | required | required |
| `SESSION_SECRET` | Signs session cookies. Changing it signs every device out. Never shared between apps | required | required |
| `APP_URL` | The URL users type. **Only** effect: the cookie is marked `Secure` when this starts with `https://` | required | required |
| `TRUSTED_PROXY` | `1` **only** when a reverse proxy sets `x-forwarded-for`. Without one, a client can forge it and dodge rate limits | proxy only | proxy only |
| `DATA_DIR` | Absolute path for the database directory, `uploads/` and `backups/`. Default is `data/` beside the app | when the app root is web-served | n/a |
| `HEALTH_TOKEN` | Optional. Pass `?token=` to `/api/health` for detail (paths, versions, error messages) | optional | n/a |

Never commit `.env` — both are gitignored. There are no third-party API keys in this system.

## Backups and restore

A complete JSON export of an organization — outlets, users including credential hashes, menus, tables, orders — written to `DATA_DIR/backups/`, rotated per the owner's retention setting. The owner sets the schedule (off, daily, weekly) and the app runs it in-process; there is also a manual "Back up now".

Restore from the owner's Backups screen, or `POST /api/backups/restore`. Stopping the app and copying back a whole data directory works too — SQLite is one file.

**Copy them off the machine.** A backup on the same disk as the database protects against mistakes, not against hardware failure. Until remote upload ships, sync `DATA_DIR/backups/` to an external drive or cloud storage on a timer.

## Rollback

**App:** `git checkout <previous-tag> && npm ci && npm run build`, restart the service. On shared hosting, re-run the deploy workflow from the older commit.

**Data:** restore the most recent backup, or a copied data directory. Migrations are forward-only, so code rolls back but the schema does not — if a migration is the problem, roll the code back *and then* restore the pre-release backup. That ordering is why the backup step is not optional.

## Post-deploy checks

1. The site loads over HTTPS (or the LAN address) and `/api/health` reports `ok`.
2. Owner sign-in works.
3. End shift, then a staff member signs back in with their PIN — without a manager present.
4. Seat a table, add an item, settle it, print the bill, confirm the table frees itself.
5. Owner → Admin → Back up now, and the timestamp moves.
6. On an internet-facing host: `curl -I https://your-domain/package.json` returns 404, not 200.

## Dependency advisories

`npm audit` reports high-severity advisories, none in the path this app serves requests from (checked 2026-07-30): the ESLint toolchain (`minimatch` → `brace-expansion`), which is installed but never executed at request time; `postcss`, which is build-time and only ever sees our CSS; and `sharp`, reachable only through Next's image optimizer, which this app never uses — dish photos are served as plain `<img>` from its own storage.

Run `npm audit fix` (non-breaking) before an internet-facing deploy and re-check after any Next upgrade. Do not run `npm audit fix --force`: it moves major versions.
