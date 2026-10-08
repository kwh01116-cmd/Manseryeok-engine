# Execution handoff

## Latest repository truth (2026-10-08, Asia/Seoul)
- Branch: `agent/foundation-20261006`; PR #1 draft/open, base `main`.
- Main SHA observed: `39b6653e4f93169a4b5b51412b72d4710e9da91f`.
- PR head **before** this run's atomic documentation commit: `948a90a5172198d5493f68af9631f6d7ac0ce270`.
- Final head: the commit containing this handoff; query PR #1 head for its exact SHA (a commit cannot contain its own hash).

## Commits actually applied in this run
- One documentation-only atomic commit: this handoff + narrow KASA authority cross-check section in `docs/research/KOREAN_LUNISOLAR_GOLDEN_CANDIDATES.md`.
- No production source, fixture, or executable test changed. Final commit SHA is the updated PR head.

## Checks actually run
- `git ls-remote https://github.com/kwh01116-cmd/Manseryeok-engine.git HEAD`: **BLOCKED**, DNS `Could not resolve host: github.com`.
- `node --version`: v22.16.0; `tsc -v`: 5.8.3 available in container. These are environment checks, **not** repository compilation.
- Python Gregorian `datetime` adjacency check for 7 KASI month-start/length intervals: **7/7 PASS** (arithmetic consistency only, not an independent calendar verification).
- Direct source read: KASI 2025/2026/2027 calendar-data pages and KASA 2026/2027 agency announcements; KASA directly corroborates only 2026-02-17 and 2027-02-07 lunar 1/1.
- Exact checkout / `npm ci` / canonical `npm run check`: **NOT RUN**. No claim of canonical green; no merge.

## Current milestone / gate
- M1 immediate queue #12: day/hour corpus and 24-Jie + 24-Zhongqi exhaustive boundary test committed previously; **NOT CLOSED** until canonical checkout/check and remaining invariant review.
- M1 #13: lunar leap-month/month-end candidates remain research-only; two New Year's Day anchors now separately corroborated by KASA public announcements, **not** the official edition attachment.

## Next 1-3 safe tasks
1. Re-read main/PR/head/handoff, obtain exact runnable checkout and run `npm ci && npm run check`; resolve failures without weakening tests.
2. If green, assess full Four-Pillars property/differential coverage and close #12 only with evidence.
3. Compare edition-specific KASA 월력요항 PDF/HWPX against KASI 2025 leap-sixth-month and 2026/2027 lunar month-length rows before promoting goldens or implementing a converter.

## Unresolved / disputed / blockers
- DNS/network prevents exact repository checkout; no repository-wide verification.
- KASI calendar-data surface is explicitly non-official; KASA announcements establish only two specific lunar 1/1 dates, not all vectors. 2027 KASI generation date postdates KASA notice. Source-edition and commercial-use reviews remain open.
- Zi rollover, effective time basis and late-Zi hour-stem reference remain explicit caller policies; minute-precision Jie uncertainty is preserved.
- Historical Korean timezone/DST is backlog unless required by an M1 fixture.
- All subsequent writes require a fresh PR head + target blob SHA read and expected-head lease; repository truth overrides conversation.
