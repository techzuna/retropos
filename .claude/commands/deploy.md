---
description: Run pre-deploy checks and deploy RestroReserve following DEPLOY.md
argument-hint: [preview|production]
---

Deploy RestroReserve. Target environment: $ARGUMENTS (if empty, default to preview).

1. **Preflight.** Confirm the working tree is clean (`git status`) and you're on the expected branch. Stop and report if not.
2. **Quality gates.** Run the test suite and linter from CLAUDE.md's Commands section. Stop on any failure — never deploy red.
3. **Security gate.** If anything touching auth, data handling, or the booking/reservation flow changed since the last deploy, run the `security-auditor` subagent and stop on a no-go.
4. **Deploy.** Follow the steps in DEPLOY.md for the target environment exactly (including `prisma migrate deploy` when there are pending migrations). For **production**, confirm with the user before executing the final deploy command unless they already said to proceed.
5. **Verify.** Run the Post-Deploy Checks from DEPLOY.md and report each result.
6. **Log.** Append a deploy entry to CONVERSATION_LOG.md (environment, version/commit, check results).

If any step fails, stop, report exactly what failed, and — for production — follow DEPLOY.md's Rollback section if the failure happened after the deploy step.
