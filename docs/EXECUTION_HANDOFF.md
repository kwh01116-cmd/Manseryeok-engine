# Execution handoff

## Repository truth — 2026-10-09 04:00 KST (interior-Jie guard)
- Workstream: `agent/foundation-20261006`, PR #1 draft/open. main last read `39b6653e4f93169a4b5b51412b72d4710e9da91f`.
- Pre-write PR HEAD / expected parent: `6cf2dd6fd9aeee04845505f09de58cade854f37d`. A commit cannot contain its own SHA: re-read PR head_sha after the atomic update and verify this parent and changed blobs before treating the commit as applied.
- Before writing, PR HEAD and all existing target-file blob SHAs were re-read; ref update must use expected_sha lease. Never assume a failed ref update succeeded.

## Commits actually applied
- Intended single conditional commit: `fix(m1): reject missing interior month-boundary Jie before chart resolution`, changing `src/calendar/monthPillar.ts`, adding `test/month-boundary-jie-continuity.test.mjs`, updating the M1 audit and this handoff. **Only count it after final PR HEAD/file verification.** No main merge.

## Checks actually run
- Direct GitHub connector: main, PR #1, current branch, recent commits, tree, docs, source, tests and SHA reads.
- Local isolated Node 22.16.0 / TypeScript 5.8.3: strict compilation PASS; focused synthetic interior-Jie/partial-guard tests 4/4 PASS. The reconstructed test uses minimal domain stubs and is **not** a canonical repository run.
- Shell `git ls-remote`: FAIL (github.com DNS). Exact checkout `npm ci` / `npm run check`: NOT RUN. Do not claim full verification or merge.

## Current milestone/gate
- M1 #12 Four Pillars: OPEN. Interior missing-Jie detection implemented provisionally; edge coverage and exact-checkout tests still unresolved.
- M1 #13 lunar/leap-month official-annex comparison: OPEN; no golden fixture promoted.

## Next 1–3 safe tasks
1. Obtain exact checkout and run `npm ci && npm run check`; investigate failures without weakening tests.
2. Specify explicit supported-interval/fixture-manifest semantics and adversarial terminal-missing-Jie tests before enabling full coverage claims.
3. Verify KASA official lunar annex against KASI and review commercial data reuse/attribution separately.

## Unresolved/disputed/blockers
- Shell GitHub DNS blocks canonical checks; PR stays draft/unmerged.
- A missing terminal Jie or sparse single-Jie input is not detectable by adjacency alone; coverage manifest not implemented.
- Published-minute rounding/truncation, true second-level solar boundaries, Zi rollover/hour-stem policy, historical time normalization remain unresolved or explicitly policy-gated.
- KASA publication rights notice is not itself a determination of whether individual independently sourced calendar facts are copyrightable.
