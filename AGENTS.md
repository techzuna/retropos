<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

# RestroReserve

A self-hosted, multi-tenant restaurant POS, mobile/tablet-first. Staff seat tables, take and modify orders, settle via payment-QR or cash, print bills; managers maintain menus and read sales reports; owners administer outlets, users, settings, and JSON backups. One organization (owner) can run multiple outlets. Current stage: POS pivot in progress — the v1 diner-booking site is dropped and preserved in git history. **The owner's layout screenshots arrived 2026-07-29 and the screens now follow them (card grids, extras tables, status-chip booking cards, seat diagrams); the Chulho visual language is approved and stays, so take the mockups as layout reference, not palette.**

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

- `npm run dev` — dev server on http://localhost:3000 (port 3000 is often taken on this machine — use `npm run dev -- -p 3111`)
- `npm run build` / `npm run start` — production build / serve
- `npm run lint` — ESLint
- `npm test` / `npm run test:watch` — Vitest
- `python3 tests/browser/no-horizontal-scroll.py` — asserts no page scrolls sideways at 320–1100px (needs a running dev server)
- `npx prisma migrate dev` — create/apply migrations (SQLite at `data/app.db` via `DATABASE_URL`)
- `npx prisma db seed` — seed demo org (2 outlets, users, menus, extras, zoned/shaped tables)

## Project Structure

```
restroReserve/
├── data/                    # gitignored: app.db, uploads/ (QR + dish photos), backups/*.json
├── prisma/                  # schema.prisma (SQLite), migrations, seed.ts
├── src/
│   ├── app/
│   │   ├── login/           # email+password: pairs a device, and manager/owner re-entry
│   │   ├── signin/          # floor PIN sign-in & handover (needs only the pairing)
│   │   ├── pos/             # staff: table board (+ manager floor editing), orders, bookings, bill
│   │   ├── manage/          # manager: menu + extras, reports
│   │   ├── admin/           # owner: outlets, users, settings, backups
│   │   └── api/             # route handlers (see DESIGN.md API table)
│   ├── components/          # Dialog.tsx (ask/confirm modals), TableDiagram, PinInput…
│   └── lib/                 # domain core — ALL tenancy scoping lives here
│       ├── db.ts            # Db/OrgContext types + resolveDb(); no client singleton
│       ├── session.ts       # cookie sessions, PIN switch, requireRole()
│       ├── orders.ts        # seat / lines / settle / cancel; derives the table board
│       ├── reservations.ts  # bookings: overlap rule, confirm / seat / cancel / no-show
│       ├── modifiers.ts     # extras catalogue + per-item allow-list
│       ├── tables.ts        # floor plan: add / re-seat / re-zone / re-shape / retire
│       ├── service-periods.ts # Breakfast/Lunch/Dinner windows a booking is taken against
│       ├── outlet.ts        # the paired outlet's profile (name/currency/timezone/QR)
│       ├── reports.ts       # day- and month-bucketed summaries
│       └── backup.ts        # JSON export/import + scheduler
├── tests/                  # Vitest, plus tests/browser/ Playwright checks
└── *.md
```

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
