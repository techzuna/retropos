# RestroReserve

A restaurant point of sale, in two builds that share one codebase:

- **`apps/onsite`** — self-hosted on a box in the restaurant. SQLite, one
  process, keeps taking orders when the internet drops. This is what is live
  today.
- **`apps/cloud`** — the hosted multi-tenant service. Postgres, many
  restaurants, subscription. Being built.

Feature code lives in `packages/` so the two cannot drift apart: fix a rounding
bug once and both get it.

## Running it locally

Everything is run from the repository root.

```bash
npm install                      # installs every workspace at once

npm run onsite -- dev -- -p 3111 # self-hosted build  http://localhost:3111
npm run cloud  -- dev -- -p 3222 # hosted service     http://localhost:3222
```

They run side by side on different ports and different databases, which is the
point: a change to `packages/` should be visible in both without touching
either app.

**Outlet** needs nothing beyond `npm install` — SQLite is a file, created for
you at `apps/onsite/data/app.db`. Sign in with the seeded owner,
`yogalajay@gmail.com` / `owner1234` (see CREDENTIALS.md).

**Cloud** needs a Postgres to talk to. Locally:

```bash
createdb restroreserve_cloud
cp apps/cloud/.env.example apps/cloud/.env   # then set DATABASE_URL, SESSION_SECRET
cd apps/cloud && npx prisma migrate deploy
```

Is it healthy? `curl -s localhost:3111/api/health` answers without a login and
names what is broken:

```json
{"ok":true,"node":"v20","driver":"ok","wasm":"ok","database":"ok"}
```

A `database-url-not-a-file` reason means `apps/onsite/.env` is missing —
copy `.env.example` beside it and set `SESSION_SECRET`.

## The checks CI runs

```bash
npm test          # every workspace
npm run lint
npm run typecheck
npm run db:check  # the two schemas still match packages/db/models.prisma
npm run build     # production build
```

## Changing the data model

Edit `packages/db/models.prisma` — never an app's `schema.prisma`, which is
generated and will be overwritten.

```bash
npm run db:compose                                   # rewrite both schemas
cd apps/onsite && npx prisma migrate dev --name what_changed
```

`npm run db:check` fails the build if a generated schema was hand-edited, which
is what stops the outlet and the cloud growing different columns.

## Where things are

| | |
|---|---|
| `PRD.md` | what to build and why |
| `DESIGN.md` | architecture, data model, RBAC |
| `DEPLOY.md` | self-hosted deployment |
| `CONVERSATION_LOG.md` | decision history, newest first |
