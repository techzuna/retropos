# RestroReserve — Deployment

## Target Platform

**Vercel** (app) + **Neon** (serverless Postgres) — zero-config Next.js hosting with automatic preview deployments per branch/PR. This is a scaffolding assumption; swap for Fly.io/Railway if a long-running server becomes necessary.

## Environments

| Environment | Purpose | URL |
|---|---|---|
| local | development | http://localhost:3000 |
| preview | pre-production checks (auto-created per branch/PR) | *(set after first deploy)* |
| production | live | *(set after first deploy)* |

## Prerequisites

1. Vercel account (free Hobby tier is fine to start) — `npm i -g vercel` and `vercel login`.
2. Neon account with a project — create `production` and `dev` branches of the database; copy each connection string.
3. Resend account — verify the sending domain, create an API key.
4. GitHub repo connected to Vercel (enables deploy-on-push and preview deployments).
5. (Optional, later) custom domain added in Vercel → Domains.

## Environment Variables

| Name | Purpose | Where it's set |
|---|---|---|
| `DATABASE_URL` | Neon Postgres connection string (per-environment branch) | Vercel → Project → Settings → Environment Variables; `.env.local` locally |
| `AUTH_SECRET` | Auth.js session encryption (`npx auth secret` to generate) | same |
| `AUTH_URL` | Canonical app URL for Auth.js callbacks | same (Vercel usually infers; set explicitly in production) |
| `RESEND_API_KEY` | Sending confirmations, cancellations, magic links | same |
| `EMAIL_FROM` | Verified sender, e.g. `bookings@<domain>` | same |

Never commit values — `.env*` stays gitignored; Vercel's Environment Variables UI is the secrets store, with separate values per environment (production / preview / development).

## First Deploy

```bash
# 1. From the project root, link the repo to a Vercel project
vercel link

# 2. Set env vars for production (repeat for preview with the dev DB branch)
vercel env add DATABASE_URL production
vercel env add AUTH_SECRET production
vercel env add AUTH_URL production
vercel env add RESEND_API_KEY production
vercel env add EMAIL_FROM production

# 3. Run migrations against the production database
DATABASE_URL="<neon-production-url>" npx prisma migrate deploy

# 4. Seed the restaurant profile, tables, and menu (idempotent seed only)
DATABASE_URL="<neon-production-url>" npx prisma db seed

# 5. Deploy
vercel --prod
```

Record the resulting URLs in the Environments table above.

## Routine Deploys

Push to a branch → Vercel builds a preview deployment; merge to `main` → production deploy. Run `/deploy` first — it executes the quality and security gates (tests, lint, security-auditor when auth/data code changed) before anything ships. Migrations: `npx prisma migrate deploy` against the target database before or as part of the deploy (add it as a Vercel build step once migrations stabilize).

## Rollback

- **App:** Vercel → Deployments → previous good deployment → **Promote to Production** (or `vercel rollback`). Instant, no rebuild.
- **Database:** migrations are not auto-reverted — roll forward with a corrective migration. For disasters, restore a Neon point-in-time branch and repoint `DATABASE_URL`.

## Post-Deploy Checks

1. Homepage and menu page load over HTTPS; menu shows published items.
2. Availability search for tomorrow returns plausible slots (within opening hours).
3. Complete a real test booking → confirmation email arrives → cancel via the emailed link → cancellation email arrives.
4. Dashboard rejects anonymous access; staff magic-link login works.
5. Vercel → Logs shows no new errors, and no PII appears in any log line.
