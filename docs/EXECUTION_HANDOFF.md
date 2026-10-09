# Execution handoff

## Current repository truth — 2026-10-09 KST (V0 impossible GanZhi pair rejection)
- Branch: agent/foundation-20261006; PR #1 DRAFT/OPEN; parent HEAD bcc8fa55a96ea5da76187f1b41983d22fb7a4af9; resulting HEAD must be read live after commit. Main last confirmed: 39b6653e4f93169a4b5b51412b72d4710e9da91f.
- This run: fix(v0): reject non-sexagenary stem-branch pairs in Korean chart labels; changed src/calendar/koreanBirthPreview.ts, test/korean-birth-preview.test.mjs, docs/research/V0_KOREAN_BIRTH_CHART_PREVIEW.md and this handoff. No main merge.
- Actual checks: local Node 22.16.0 isolated reconstructed cycle/label tests 3/3 PASS (60 valid, 60 impossible, malformed); shell git ls-remote FAILED DNS. Exact repository npm ci && npm run check NOT RUN; repository regression UNVERIFIED.
- Gate: M1 #12 canonical integration verification OPEN; M1 #13 official KASA source comparison OPEN; V0 preview draft only.
- Next 1–3 safe tasks: (1) exact checkout and canonical npm checks; (2) KASA annex comparison and fixture digest binding; (3) real V0 read-only CLI/browser smoke integration after full check.
- Blockers/disputes: shell GitHub DNS; KASA official minute/source rights, historical DST, Zi rollover and published-minute precision remain unresolved.


## Current repository truth — 2026-10-09 KST (V0 read-only preview)
- Branch: agent/foundation-20261006; PR #1 draft/open; parent HEAD: 9a57b2072f31c5a978865ec34b1f4b5e053730f9. Final HEAD must be read live after the commit. Main prewrite: 39b6653e4f93169a4b5b51412b72d4710e9da91f.
- Commit this run: feat(v0): add Korean birth chart preview (verify new HEAD). Changes: src/calendar/koreanBirthPreview.ts, test/korean-birth-preview.test.mjs, src/index.ts, docs/research/V0_KOREAN_BIRTH_CHART_PREVIEW.md and this handoff. No main merge.
- Checks actually run: shell git ls-remote FAILED (DNS). Exact repository npm ci && npm run check NOT RUN. Isolated Node 22.16.0/TypeScript 5.8.3 strict compile PASS; 6/6 focused tests PASS with stubbed existing collaborators. First isolated harness manifest-negative test was invalid due JS default argument; corrected and rerun PASS. Repo regression tests UNVERIFIED.
- Gate: M1 #12 exact verification OPEN; M1 #13 official KASA lunar/solar fixture verification OPEN. V0 DTO added on draft branch, not shipped.
- Next safe tasks: (1) exact checkout and full npm checks; (2) fixture digests and official KASA annex comparison; (3) V0 read-only form and chart view after verification.
- Blockers/disputes: shell GitHub DNS, KASA edition/reuse rights, published-minute precision, historical DST, Zi rollover. No interpretation defaults added.


## Current repository truth — 2026-10-09 KST
- Branch: agent/foundation-20261006; PR #1 DRAFT/OPEN; parent HEAD: 0d97e4d7d8ad949d4f88cb1f243c490cd318a128; resulting HEAD must be read live from GitHub (commit SHA cannot self-reference). Main prewrite: 39b6653e4f93169a4b5b51412b72d4710e9da91f.
- This run: feat(m1): compose lunar birth inputs with coverage-checked Four Pillars. Five paths: src/calendar/koreanLunarBirthFourPillars.ts, src/index.ts, test/korean-lunar-birth-four-pillars.test.mjs, docs/research/M1_LUNAR_BIRTH_FOUR_PILLARS.md, this handoff. No main merge.
- Actual checks: git ls-remote FAILED (github.com DNS); exact repository npm ci && npm run check NOT RUN. Isolated Node 22.16.0 / TypeScript 5.8.3 strict npm run check PASS, 6/6 focused tests PASS with stubbed converter/chart collaborators. NOT canonical verification.
- Gate: M1 #12 canonical verification OPEN; M1 #13 finite lunar converter implemented but official KASA comparison OPEN; lunar-to-chart adapter added, exact-repo tests UNVERIFIED; V0 not shipped.
- Next safe tasks: (1) exact checkout and canonical npm checks; (2) bind source digest and compare official KASA edition; (3) V0 read-only birth input/chart output with policy/provenance after canonical checks.
- Unresolved: GitHub DNS; official KASA annex, commercial rights, minute rounding and fixture digest; historical Korean DST and Zi/time-basis policies.
- Prior run: 0d97e4d7d8ad949d4f88cb1f243c490cd318a128 added KASI 2025–2027 lunar converter, isolated 6/6 tests and 1,093 daily roundtrips PASS; canonical check NOT RUN. Earlier history: docs/EXECUTION_HANDOFF_HISTORY_20261009.md.
