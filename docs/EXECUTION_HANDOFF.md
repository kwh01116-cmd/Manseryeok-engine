# Execution handoff

## Latest repository truth (2026-10-08, Asia/Seoul)
- Branch: `agent/foundation-20261006`; PR #1 draft/open, base `main`.
- Main SHA observed: `39b6653e4f93169a4b5b51412b72d4710e9da91f`.
- PR head at read/write lease: `f3e670fe33d1701c672dbf9d1b3de478047fa7b0`.
- Final head: **the commit containing this handoff**; fetch PR #1 head for the exact SHA (a Git commit cannot embed its own SHA).

## Commits actually applied in this run
- One small atomic test/research/handoff commit, if the expected-head ref update succeeds.
- Adds three KASI 2025 lunar-month-start **day-pillar** golden checks to `test/day-pillar.test.mjs`; no production code changed.
- Updates `docs/research/DAY_PILLAR_RULES.md` and `SOURCE_REGISTRY.md` with direct KASI 日辰 provenance, exact vectors and limitations.

## Checks actually run
- KASI 2025 calendar-data direct read: Gregorian 2025-06-25=乙丑, 2025-07-25=乙未, 2025-08-23=甲子, from the 日辰 column.
- Independent Python Gregorian date deltas from 2000-01-07: 9301, 9331, 9360 days; mod 60 = 1, 31, 0.
- Node v22.16.0 / TypeScript 5.8.3: **strict TS compile PASS** and **1/1 focused test PASS** in a reconstructed day-pillar dependency slice. This is NOT the full checkout.
- `git ls-remote`: BLOCKED, DNS `Could not resolve host: github.com`; fixed-IP HTTPS also unreachable.
- Exact checkout / `npm ci` / canonical `npm run check`: **NOT RUN**. The committed test is **UNVERIFIED in the canonical repository environment**; do not merge on this evidence.

## Current milestone / gate
- M1 #12 randomized/metamorphic Four-Pillars: **OPEN**; existing 24 Jie + 24 Zhongqi boundary tests and day/hour corpus require canonical check and coverage review.
- M1 #13 lunar/solar/leap month: research candidates only; 2025 leap-sixth-month dates are KASI-only pending KASA official edition comparison.
- KASI 2025 日辰 day-cycle cross-check is a date-only invariant, NOT lunar converter verification.

## Next 1-3 safe tasks
1. Re-read main, PR #1 head, tests, handoff. Obtain exact runnable checkout and execute `npm ci && npm run check`; fix real failures without weakening tests.
2. If green, audit Four-Pillars differential/official golden coverage and close #12 only with evidence.
3. Compare KASA official 2025 lunar leap-sixth-month edition to KASI table; then design explicit leap-flag source-tagged converter fixtures.

## Unresolved / disputed / blockers
- DNS/network blocks canonical checkout and repository-wide verification; no green claim and no unattended merge.
- KASI calendar-data explicitly non-official; KASA 2025 edition attachment still not compared for leap-sixth-month.
- Zi rollover, effective time basis, late-Zi hour-stem reference remain caller-selected; Jie published-minute ambiguity preserved.
- All subsequent writes require fresh PR head + target blob SHA and expected-head lease. Repository state, not chat, is authoritative.

## 2026-10-08 research-only follow-up (pending repository write)
- Direct KASI 2027 table and KASA 2027 public notice corroborate 2027-02-07 lunar New Year; KASI prints Lichun 2027-02-04 10:46 (minute precision). These differ: lunar calendar year ganji is NOT a Lichun/Jie-based Myeongli year pillar.
- Secondary reproductions of KASA directive no. 66 (2026-02-02) report lunar new-moon, month-length and leap rules plus 1896 anchor; official legal text and annexes NOT directly retrieved. No normative golden promotion.
- Independent Node 22.16.0 date-only arithmetic: 1896-01-01 to 2000-01-07 = 37991 days; backwards sexagenary index 49 = 癸丑. NOT a repository check.
- Exact checkout: git ls-remote DNS failure; npm ci / npm run check NOT RUN; M1 #12 OPEN, M1 #13 research only.
- Attempt to commit a small provenance note + registry + handoff was blocked by safety checks before branch update; no commit verified. Next: recover canonical checkout, obtain directive original/annexes and 2025 official annual edition, add leap fixtures only after evidence.
