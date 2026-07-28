---
description: Review a pull request against RestroReserve's requirements and conventions
argument-hint: <PR number>
---

Review pull request $ARGUMENTS for RestroReserve.

1. **Gather.** Run `gh pr view $ARGUMENTS` for the description and linked issues, then `gh pr diff $ARGUMENTS` for the changes. Check out the branch if you need to run anything.
2. **Requirements.** If the PR implements a PRD.md feature, check the diff against that feature's acceptance criteria — note any criterion not met.
3. **Code review.** Apply the `code-review` subagent's priorities: correctness, security (booking-overlap integrity, staff-session and token-scoped authorization, PII kept out of logs/URLs), consistency with CLAUDE.md conventions, simplicity.
4. **Security pass.** If the PR touches auth, data handling, the reservation flow, or dependencies, run the `security-auditor` subagent on the changed files.
5. **Tests.** Confirm new behavior has tests and the suite passes; flag weakened or deleted assertions.

Produce a review with: a one-paragraph summary of what the PR does, a verdict (**approve** / **request changes**), and findings ordered by severity with `file:line` references. Only post to GitHub (`gh pr review`) if the user explicitly asked; otherwise present the review here.
