# RestroReserve — Onsite (self-hosted)

The single-restaurant build: SQLite in `data/app.db`, one long-lived Node
process, everything on the premises. This is what runs on a box in the shop or
on a small VPS, and it keeps taking orders when the internet does not.

- Run it: `npm run dev -- -p 3111` from here, or `npm run onsite -- dev` from the
  monorepo root.
- Deploy: `.github/workflows/deploy.yml` at the repo root ships *this* app.
- Everything else: `DEPLOY.md`, `DESIGN.md` and `PRD.md` at the repo root.

Feature code it shares with `apps/cloud` lives in `packages/`; anything here is
specific to running unattended in one restaurant.
