---
description: Reproduce, fix, test, and log a bug or GitHub issue for RestroReserve
argument-hint: <issue number or bug description>
---

Fix this issue in RestroReserve: $ARGUMENTS

1. **Understand.** If the argument is an issue number and `gh` is available, run `gh issue view <number>` for full details. Otherwise work from the description; check CONVERSATION_LOG.md for related history.
2. **Reproduce.** Write a failing test or follow manual repro steps until you see the failure yourself. If you cannot reproduce it, report what you tried and stop — do not fix blind.
3. **Diagnose.** Use the `debugger` subagent to isolate the root cause.
4. **Fix.** Make the minimal change that addresses the root cause. No unrelated refactoring in the same change.
5. **Protect.** Use the `test-writer` subagent to add a regression test that fails without the fix; run the full suite.
6. **Review.** Run the `code-review` subagent on the diff and address anything Critical or Warning.
7. **Log.** Append an entry to CONVERSATION_LOG.md (root cause, fix, test added). If it was a GitHub issue, add a summary comment via `gh issue comment` and close it only if the user asked.
