<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

# RestroReserve

A web app for a single restaurant: diners browse the online menu and book tables with live availability; staff manage reservations, tables, and the menu from an authenticated dashboard. Current stage: public site MVP built and verified (menu, availability, booking, tokenized cancellation — PRD §5.1–5.3); staff dashboard (§5.4–5.6) not started.

## Documentation Map

- [PRD.md](PRD.md) — what to build and why; check a feature's acceptance criteria before calling it done
- [DESIGN.md](DESIGN.md) — architecture, data model, and design decisions
- [DEPLOY.md](DEPLOY.md) — how to ship to each environment
- [CONVERSATION_LOG.md](CONVERSATION_LOG.md) — decision history; append an entry after every working session

## Tech Stack

- **Next.js 16 (App Router) + TypeScript** — one framework for public site, dashboard, and API routes.
- **Tailwind CSS v4** — utility-first styling, fast iteration for a mobile-first UI.
- **PostgreSQL + Prisma** — relational fits reservations/tables/menus; transactional integrity is what prevents double-bookings.
- **Auth.js (NextAuth v5)** — staff sign-in via email magic links (no password storage); diners don't need accounts.
- **Resend** — transactional email (booking confirmations/cancellations, magic links).
- **Vitest + Playwright** — unit/integration tests and the critical end-to-end booking flow.
- **Vercel + Neon Postgres** — hosting; local dev uses Homebrew postgresql@18 (database `restroreserve`).

## Commands

- `npm run dev` — start the dev server on http://localhost:3000 (port 3000 is often taken by another app on this machine — use `npm run dev -- -p 3100`)
- `npm run build` — production build
- `npm run lint` — ESLint
- `npm test` — Vitest unit/integration tests (single run)
- `npm run test:watch` — Vitest in watch mode
- `npx prisma migrate dev` — create/apply migrations against the local DB
- `npx prisma db seed` — seed restaurant profile, tables, and sample menu

## Project Structure

```
restroReserve/
├── prisma/
│   ├── schema.prisma        # data model (see DESIGN.md)
│   └── seed.ts              # restaurant profile, tables, sample menu
├── src/
│   ├── app/
│   │   ├── (public)/        # menu, booking flow, reservation-by-token pages
│   │   ├── dashboard/       # staff-only: reservations, menu, tables, settings (not built yet)
│   │   └── api/             # route handlers (availability, bookings, auth)
│   ├── components/          # shared UI components
│   └── lib/                 # domain logic: availability, booking, email, auth
│       └── availability.ts  # slot math — keep pure and unit-tested
├── tests/                   # Vitest unit/integration; e2e/ for Playwright
└── *.md                     # the docs in the map above
```

## Conventions

- TypeScript strict mode; no `any` without a comment justifying it.
- Domain logic (availability math, booking rules, cancellation policy) lives in `src/lib/`, pure and unit-testable — never inline in components or route handlers.
- All timestamps stored UTC; convert with the restaurant's IANA timezone only at the display/input edges. Never use bare `new Date()` math for slot logic.
- Double-booking is prevented by the `reservation_no_overlap` Postgres exclusion constraint (authoritative; booking code retries the next table when it fires). Never bypass it, soften its status filter, or wrap inserts in extra locking "just in case" — see DESIGN.md Integrity rules.
- Server-side validation with Zod on every API input; never trust client-provided data.
- Every dashboard route/action checks the staff session server-side; diner reservation access only via unguessable token.
- Naming: components `PascalCase`, functions/variables `camelCase`, files `kebab-case.ts` (components `PascalCase.tsx`).
- JSX gotcha in this Next/SWC version: `{expr} text` loses the space after the expression at compile time. Write whole sentences as one template expression or use `{" "}`.
- Commits: imperative present tense, scoped prefix when useful (e.g. `booking: prevent overlap at txn level`).

## Working Rules for Agents

- Read [PRD.md](PRD.md) before starting any feature; implement to its acceptance criteria.
- Don't build anything listed in PRD.md §6 (Later) or §8 (Out of Scope) without being asked.
- Append significant decisions and a session summary to [CONVERSATION_LOG.md](CONVERSATION_LOG.md) — newest entry on top.
- Use the subagents in `.claude/agents/`: run **code-review** after non-trivial changes, **test-writer** for new code, **security-auditor** before deploys and after touching auth/data handling, **debugger** for failures, **doc-writer** to keep these docs current.
- Keep this file updated: when the stack, commands, or structure change, change this file in the same session. (CLAUDE.md is a one-line `@AGENTS.md` import — this file is the real content.)
