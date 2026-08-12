<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

# RestroReserve

**Two products, one codebase.** `apps/onsite` is the self-hosted build that runs on a box in a
restaurant (SQLite, one process, keeps serving when the internet drops) — this is what is live
today. `apps/cloud` is the hosted multi-tenant service (Postgres, many restaurants, subscription),
scaffolded and booting but without signup or POS screens yet. Feature code lives in `packages/` so
the two cannot drift: a fix belongs there, not in one app.

A multi-tenant restaurant POS, mobile/tablet-first. Staff seat tables, take and modify orders, settle via payment-QR or cash, print bills; managers maintain menus and read sales reports; owners administer outlets, users, settings, and JSON backups. One organization (owner) can run multiple outlets. Current stage: POS pivot in progress — the v1 diner-booking site is dropped and preserved in git history. **The owner's layout screenshots arrived 2026-07-29 and the screens now follow them (card grids, extras tables, status-chip booking cards, seat diagrams); the Chulho visual language is approved and stays, so take the mockups as layout reference, not palette.**

## Documentation Map

- [PRD.md](PRD.md) — what to build and why; check a feature's acceptance criteria before calling it done
- [DESIGN.md](DESIGN.md) — architecture, data model, RBAC, and design decisions
- [DEPLOY.md](DEPLOY.md) — self-hosted deployment, the `data/` directory, backups
- [CONVERSATION_LOG.md](CONVERSATION_LOG.md) — decision history; append an entry after every working session

## Tech Stack

- **Next.js 16 (App Router) + TypeScript** — one deployable serves UI + API on the restaurant's LAN.
- **SQLite via Prisma 7** (`@prisma/adapter-better-sqlite3`) — local single-file DB at `data/app.db`; no enums/arrays on SQLite, use string constants validated by Zod.
- **Sessions:** `jose` signed JWT cookie + `bcryptjs` hashes. The cookie holds two separable things — the **device pairing** (which outlet, set by an owner/manager password, cleared only by manager-level unpair) and the **acting user** (set/cleared by PIN all shift). Never collapse them: staff have no password, so if sign-out unpaired the device the till would strand until a manager arrived.
- **Tailwind CSS v4** with the Chulho tokens (madder/brass/paper, Young Serif display, dhaka band).
- **Zod 4** on every API input. **@date-fns/tz** for outlet-local report bucketing.
- **Vitest + Playwright** — unit tests for money/orders/extras/reports/tenancy, browser walkthroughs for the POS flow.

## Commands

Run everything from the monorepo root.

- `npm install` — installs every workspace at once
- `npm run onsite -- dev -- -p 3111` — the self-hosted app (3000 is usually taken here)
- `npm run cloud -- dev -- -p 3222` — the hosted app; needs a Postgres and a migrate first
- `npm test` / `npm run lint` / `npm run typecheck` / `npm run build` — across all workspaces
- `npm run db:check` — fails if a generated schema no longer matches `packages/db/models.prisma`
- `npm run db:compose` — rewrite both app schemas after editing the models
- `python3 apps/onsite/tests/browser/no-horizontal-scroll.py` — no sideways scroll at 320–1100px (needs a running dev server)
- Per app: `cd apps/onsite && npx prisma migrate dev` / `npx prisma db seed`

**Changing the data model:** edit `packages/db/models.prisma`, never an app's `schema.prisma` —
those are generated and will be overwritten. Then `npm run db:compose` and generate a migration in
*each* app, because SQLite and Postgres need their own.

## Project Structure

```
restroReserve/
├── apps/
│   ├── onsite/              self-hosted: SQLite, one process, runs in the restaurant
│   │   ├── data/            gitignored: app.db, uploads/, backups/
│   │   ├── prisma/          GENERATED schema + its own migrations
│   │   ├── scripts/         check-host.js (panel preflight), install-native.js
│   │   ├── server.js        Passenger entry point; also sets the V8 wasm flag
│   │   └── src/             app/, components/, lib/
│   └── cloud/               hosted: Postgres via pg, many tenants
│       ├── prisma/          GENERATED schema + its own migrations
│       └── src/             app/, lib/
├── packages/
│   ├── domain/              rules both products obey — no fs, no db driver, no request
│   └── db/                  models.prisma (source of truth) + compose.mjs
└── .github/workflows/       deploy.yml ships apps/onsite only
```

Where code belongs: a rule about money, roles, time or validation goes in `packages/domain`. A
data-model change goes in `packages/db/models.prisma`. Anything that needs a filesystem, a specific
database driver or a hosting quirk stays in the app — that is why `db.ts`, `uploads.ts` and
`backup.ts` are not shared.


## Conventions

- TypeScript strict; no `any` without a justifying comment.
- Domain logic lives in `src/lib/`, pure where possible and unit-tested — never inline in components or route handlers.
- **Tenancy:** every `src/lib` function takes the session's `organizationId`/`outletId` and includes them in queries. No route touches Prisma directly for tenant data.
- **Database handle:** domain code queries through `ctx.db`, never a module-level client — `src/lib/db.ts` exports no `prisma` singleton, only `resolveDb()`. If you need a handle where there is no context (a scheduler, a script), call `resolveDb()` explicitly and pass `{ db, orgId }` down. Reading an outlet or organization from a page or route means `getOutletProfile()` / `getOrganization()`, not a fresh query.
- **RBAC:** `requireRole("staff" | "manager" | "owner")` server-side on every route; UI hiding is not enforcement.
- **Money:** integer minor units only; prices/names snapshot onto order lines at add-time; totals frozen at settle; nothing recomputes settled money. **Extras snapshot the same way and are priced per unit** — every total goes through `lineTotalCents`/`orderTotalCents`, never an inline sum.
- **The floor plan is edited on `/pos`, not a separate screen** — the board already draws every table in its zone, so a second page would duplicate the layout. Manager+ only, behind an *Edit floor* toggle; staff never see it and the writes 403 regardless.
- **Table occupancy is derived** (open order exists) — never add a status column for it. **"Reserved" is derived too**, from holding reservation rows covering the instant; the two states are independent and neither belongs on `DiningTable`.
- **Bookings never block seating.** Overlap is refused when booking; seating a walk-in at a reserved table is always allowed. The overlap check counts `ACTIVE_RESERVATION_STATUSES` (incoming + confirmed + seated); the board's hold counts only `HOLDING_RESERVATION_STATUSES` (incoming + confirmed).
- **Bookings are taken by `ServicePeriod`, never by a clock time** — the API accepts `servicePeriodId` or `allDay` and nothing else. Each booking snapshots `periodLabel` and its UTC window, so retiming a period never moves a booking already taken.
- **Booking windows are half-open `[startAt, endAt)`** in UTC, converted from the outlet's wall clock at the edge. Back-to-back periods must not collide.
- **A hold covering *now* renders the table as taken** on the board, but the domain still refuses no seating — the board warns, it doesn't lock.
- **Outlet timezone defaults to UTC**, is owner-settable, and is validated with `isValidTimezone()`. It drives report day-bucketing *and* what wall clock a service period means.
- **Booking `completed` is derived** from the linked order being settled (`displayReservationStatus`) — never stored, so a card can't disagree with the bill.
- **Every shared screen must self-sync.** Several tablets touch the same data, so `/pos`, `/pos/reservations` and the order screen all poll every 15s (`components/AutoRefresh.tsx`, or a direct refetch where the data lives in client state — `router.refresh()` cannot reach `useState` seeded from props). Pause polling while a manager is mid-edit, or a refresh discards their edit. A stale screen is never a data risk: the server refuses the conflict (`TABLE_OCCUPIED`, `TABLE_DOUBLE_BOOKED`).
- **Never dead-end an error.** Failures render through `components/ErrorScreen.tsx` (`app/not-found.tsx`, `app/error.tsx`, `app/global-error.tsx`) with plain-language copy and a link back to `/pos`. Don't print `error.message` — production redacts it; show `error.digest` as a reference instead.
- **Client fetch failures go through `lib/fetch-error.ts`** so a dropped LAN connection reads as "can't reach the till" and not as a generic failure. A `null` response means the request never left the device — always handle it.
- **No screen may scroll horizontally.** A flex item defaults to `min-width: auto`, so one un-shrinkable child (a nav, a `shrink-0` block) silently widens the whole document — and `tsc`, ESLint, the build and Vitest all pass, because none of them has a viewport. Give flex children `min-w-0` and let rows `flex-wrap`; put genuinely wide content in its own `overflow-x-auto` box. Guard: `python3 tests/browser/no-horizontal-scroll.py` against a dev server.
- **Density is a requirement on the POS screens**: the menu and the table board must be scannable at a glance and fit one screen. Hide per-item detail behind a tap (progressive disclosure) rather than growing the row.
- **Screen layouts now follow the owner's 2026-07-29 screenshots** (card grids, extras tables, status-chip booking cards, seat diagrams) rendered in the Chulho palette and type. The visual language did not change; only the layouts did.
- Anything added to the schema must also be added to `src/lib/backup.ts` (export, restore, and the round-trip test) — a model missing there is silently lost on restore.
- Timestamps UTC in the DB; outlet IANA timezone at display/report edges only.
- Zod-validate every API input; the API accepts ids and quantities, never client-supplied prices or totals.
- Naming: components `PascalCase`, functions/variables `camelCase`, files `kebab-case.ts` (components `PascalCase.tsx`).
- JSX gotcha in this Next/SWC version: `{expr} text` loses the space after the expression at compile time. Write whole sentences as one template expression or use `{" "}`.
- **Never `window.prompt` or `window.confirm`** — the browser refuses `prompt()` here ("prompt() is not supported"), which turns an inline edit into a runtime error, and both are unstyled and easy to mis-tap on a tablet. Use `useDialog()` from `src/components/Dialog.tsx`: `await ask({ title, fields })` returns the values or `null`, `await confirm({ title, message, danger })` returns a boolean. Render `{dialog}` once in the component.
- Commits: imperative present tense, scoped prefix when useful (e.g. `orders: guard double-settle`).

## Working Rules for Agents

- Read [PRD.md](PRD.md) before starting any feature; implement to its acceptance criteria.
- Don't build anything listed in PRD.md §6 (Later) or §8 (Out of Scope) without being asked.
- Layouts follow the owner's screenshots (see the note at the top). Match their structure and interaction patterns; render them in the Chulho tokens rather than the mockups' colours.
- Append significant decisions and a session summary to [CONVERSATION_LOG.md](CONVERSATION_LOG.md) — newest entry on top.
- Use the subagents in `.claude/agents/`: run **code-review** after non-trivial changes, **test-writer** for new code, **security-auditor** before deploys and after touching auth/tenancy/money, **debugger** for failures, **doc-writer** to keep these docs current.
- Keep this file updated: when the stack, commands, or structure change, change this file in the same session. (CLAUDE.md is a one-line `@AGENTS.md` import — this file is the real content.)
