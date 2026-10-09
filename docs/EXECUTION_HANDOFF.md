# Execution handoff

## Current repository truth — 2026-10-09 KST
- Branch: agent/foundation-20261006; PR #1 DRAFT/OPEN; parent HEAD: bb9bfdaaefef7af4e417e4a88e8befd9625fd9b0; resolve the resulting HEAD live from GitHub.
- Commit this run: feat(m1): add finite KASI 2025-2027 Korean lunar converter (verify after branch update); no main merge.
- Checks: isolated Node 22.16.0 / TypeScript 5.8.3 strict npm run check PASS, 6/6 test groups and 1,093/1,093 daily roundtrips PASS. Exact repository npm ci && npm run check NOT RUN; github.com DNS failed.
- Gate: M1 #12 Four Pillars canonical verification OPEN; M1 #13 finite lunar conversion implemented, KASA official-golden verification OPEN.
- Next safe tasks: (1) exact checkout and canonical npm checks; (2) source digest and KASA edition comparison; (3) explicit lunar birth-date to checked Four Pillars integration with end-to-end tests.
- Unresolved: KASI corpus is computational-reference only, official KASA annex/rights not cleared; no fixture digest; historical Korean DST and Zi/time-basis policies remain explicit.
- Previous handoff preserved verbatim in docs/EXECUTION_HANDOFF_HISTORY_20261009.md. Review history for earlier decisions and counterexamples.
