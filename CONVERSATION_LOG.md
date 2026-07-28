# Conversation & Decision Log

Append-only history of working sessions and decisions for RestroReserve. **Newest entries at the top**, directly under the format section. Every agent session that changes the project should add an entry — this is how future sessions (and humans) recover context.

## Entry format

```
### YYYY-MM-DD — Short title
- **Context:** what prompted the session
- **Decisions:** choices made and why (or "none")
- **Changes:** what was created/modified
- **Next:** follow-ups or open items
```

---

### 2026-07-27 — Codebase initialized; public booking MVP built
- **Context:** "let's start creating project" — first implementation session after scaffolding.
- **Decisions:**
  - Next.js 16 scaffolded via create-next-app (Tailwind v4, TypeScript strict); CLAUDE.md became a one-line `@AGENTS.md` import per the new scaffold convention — AGENTS.md now holds the project guide.
  - Prisma 7 (new `prisma-client` generator, `prisma.config.ts`, driver adapter `@prisma/adapter-pg`); client generated to `src/generated/prisma`.
  - Double-booking guard implemented as a Postgres `btree_gist` exclusion constraint (`reservation_no_overlap`, ignores cancelled/no-show) written as raw SQL in the init migration; booking code retries the next candidate table when it fires. Verified with conflicting inserts.
  - Availability engine steps slots in UTC instants (not wall-clock labels) so DST days produce no phantom/duplicate slots; timezone math via `@date-fns/tz`. 15 Vitest tests incl. DST spring-forward/fall-back.
  - Added `currency` (Restaurant) and `slotIntervalMin`/`maxPartySize` beyond the original DESIGN.md sketch.
  - Seeded demo restaurant "Chulho" (Kathmandu, Asia/Kathmandu, NPR, closed Mondays) with 8 tables, 4 menu categories; owner seeded as manager user.
  - Diner API never exposes table ids or internal ids; reservations accessed only by 192-bit `cancelToken`; in-memory rate limit on booking creation (single-process caveat noted in code).
  - Discovered this Next/SWC version drops the space in `{expr} text` JSX — convention added to AGENTS.md.
- **Changes:** full Next.js app (`src/app`, `src/lib`), Prisma schema + 2 migrations + seed, Vitest setup, 5 API routes, 3 public pages with Chulho design system (Young Serif/Figtree, madder/brass palette, dhaka band). Verified: lint, tsc, 15 unit tests, production build, and a 16-check Playwright walkthrough (menu → book → confirm → cancel → rebook) all green.
- **Code review round:** code-review subagent found no criticals. Fixed: non-canonical dates (e.g. "2026-08-81") no longer roll past horizon/closed-date checks (`isCanonicalDate` in engine + Zod refine, now a 400); cancellation cutoff re-checked inside the guarded update; overlap detection also matches Prisma error code P2039; confirmation/cancellation emails no longer block responses (`void`, with a note to use `after()` on serverless); DESIGN.md/AGENTS.md updated to describe the exclusion constraint as the authoritative overlap guard (no extra transaction layer wanted); removed dead `formatDay`. Deferred: the PRD §5.2 concurrency integration test (needs DB-backed test setup — pair with the dashboard session).
- **Next:** staff dashboard (PRD §5.4–5.6) with Auth.js magic-link login; concurrency regression test via test-writer; git history not yet started (repo initialized, nothing committed).

### 2026-07-27 — Project scaffolded
- **Context:** `/bootstrap-project "a resturant app with table booking and online menus"`
- **Decisions:**
  - Single-restaurant web app (not a marketplace) — simplest reading of the description; flagged in PRD §9.1.
  - Stack: Next.js (App Router) + TypeScript + Tailwind + PostgreSQL/Prisma; Auth.js magic-link login for staff only; Resend for email; Vitest + Playwright for tests.
  - Deployment: Vercel + Neon Postgres.
  - MVP cut: public menu, table booking with live availability, tokenized diner cancellation, staff reservations dashboard, menu management, tables/settings. Payments, SMS, diner accounts, multi-restaurant all deferred to PRD §6.
  - Double-booking prevention enforced at the database/transaction level as the core invariant.
- **Changes:** created PRD.md, CLAUDE.md, DESIGN.md, DEPLOY.md, CONVERSATION_LOG.md; added 5 subagents in `.claude/agents/` and 3 commands in `.claude/commands/`; installed skills `frontend-design` and `webapp-testing`.
- **Next:** review PRD.md §9 Open Questions; initialize the codebase per CLAUDE.md.
