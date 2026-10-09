# Execution handoff

## Current repository truth — 2026-10-09 KST
- Branch: agent/foundation-20261006; PR #1 DRAFT/OPEN; parent HEAD: 0d97e4d7d8ad949d4f88cb1f243c490cd318a128; resulting HEAD must be read live from GitHub (commit SHA cannot self-reference). Main prewrite: 39b6653e4f93169a4b5b51412b72d4710e9da91f.
- This run: feat(m1): compose lunar birth inputs with coverage-checked Four Pillars. Five paths: src/calendar/koreanLunarBirthFourPillars.ts, src/index.ts, test/korean-lunar-birth-four-pillars.test.mjs, docs/research/M1_LUNAR_BIRTH_FOUR_PILLARS.md, this handoff. No main merge.
- Actual checks: git ls-remote FAILED (github.com DNS); exact repository npm ci && npm run check NOT RUN. Isolated Node 22.16.0 / TypeScript 5.8.3 strict npm run check PASS, 6/6 focused tests PASS with stubbed converter/chart collaborators. NOT canonical verification.
- Gate: M1 #12 canonical verification OPEN; M1 #13 finite lunar converter implemented but official KASA comparison OPEN; lunar-to-chart adapter added, exact-repo tests UNVERIFIED; V0 not shipped.
- Next safe tasks: (1) exact checkout and canonical npm checks; (2) bind source digest and compare official KASA edition; (3) V0 read-only birth input/chart output with policy/provenance after canonical checks.
- Unresolved: GitHub DNS; official KASA annex, commercial rights, minute rounding and fixture digest; historical Korean DST and Zi/time-basis policies.
- Prior run: 0d97e4d7d8ad949d4f88cb1f243c490cd318a128 added KASI 2025–2027 lunar converter, isolated 6/6 tests and 1,093 daily roundtrips PASS; canonical check NOT RUN. Earlier history: docs/EXECUTION_HANDOFF_HISTORY_20261009.md.
