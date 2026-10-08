# Execution handoff

## Latest repository truth (2026-10-08, Asia/Seoul)
- Branch: `agent/foundation-20261006`
- PR: #1, draft/open, base `main`.
- Main SHA at read: `39b6653e4f93169a4b5b51412b72d4710e9da91f`.
- PR head before this run's write: `43b8ff1d74b11928fe9bf195725f9ee9e775a6e7`.
- Final head: the commit containing **this handoff**; query the branch/PR head for its exact SHA (the commit cannot self-embed its own hash). Never use the pre-write head for a subsequent write.

## Commits actually applied in this run
- One documentation-only commit: this handoff and `docs/research/KOREAN_LUNISOLAR_GOLDEN_CANDIDATES.md`. No production code or tests modified. Exact commit SHA is the branch head after the successful expected-head ref update.

## Checks actually run
- `git ls-remote` against GitHub: **BLOCKED** by `Could not resolve host: github.com`.
- Direct `curl --resolve` network fallback: **BLOCKED** (connection failed); no exact checkout.
- Local Python `datetime.date` adjacency check of 4 KASI month-length intervals: **4/4 PASS** (not a repo test).
- `npm ci` / canonical `npm run check`: **NOT RUN**. Previously added year/month test remains unverified. No merge.

## Current milestone / gate
- M1 immediate queue #12: year/month exhaustive boundary tests and day/hour property corpus exist, but canonical check remains blocked; **#12 NOT CLOSED**.
- M1 #13 research-only start: 2025 leap-sixth-month and 2026/2027 lunar-new-year candidates documented from KASI with derived boundaries, pending official KASA edition comparison.

## Next 1-3 safe tasks
1. Re-read main/PR/head/handoff, recover exact checkout, run `npm ci && npm run check`; investigate failures without weakening tests.
2. If green, review Four-Pillars invariant coverage and close #12 only on recorded evidence.
3. Verify #13 provisional vectors against edition-specific official 월력요항, then add typed, provenance-bearing fixtures/tests as the smallest slice.

## Unresolved / disputed / blockers
- **Verification blocker:** GitHub DNS/network unavailable in the execution container. This is an environment problem, not proof of test failure or success.
- KASI calendar-data pages explicitly say they are not official announcements. The new candidate document is not an official golden corpus; commercial reuse review pending.
- Zi rollover, effective time basis, late-Zi hour-stem reference remain caller-selected. Minute-precision solar-term uncertainty stays explicit.
- Historical Korean timezone/DST remains backlog unless an M1 fixture depends on it.
- The old handoff is preserved in Git history; this file is the latest operational state. All future writes must use fresh PR head + target blob SHA checks and an expected-head lease.
