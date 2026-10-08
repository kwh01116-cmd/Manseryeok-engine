# M1 #12 static audit (2026-10-08)

Status: OPEN / canonical checks NOT RUN. Branch agent/foundation-20261006, PR #1.

## Confirmed test defect
- src/calendar/koreaSolarTermFixtures.ts has 24 events for 2026, 24 for 2027, and one 2025-12-07 DAXUE continuity guard: total 49.
- test/solar-term-timeline.test.mjs incorrectly expected total 48. Corrected test now asserts 48 annual + 1 guard = 49, including guard identity and KASI-only provenance.
- test/year-month-boundaries.test.mjs deliberately filters to 2026/2027 and its 48 annual-event expectation is correct. Removing the 2025 guard would break January 2026 continuity.
- Static source count and independent Node arithmetic pass; local candidate node --check passes. Neither constitutes a canonical test pass.

## Remaining critical-path blockers
1. git ls-remote fails with DNS resolution for github.com in the available local shell. Exact checkout, npm ci, npm run check NOT RUN; do not merge.
2. src/index.ts exports day/hour composition but does not export resolveYearMonthPillars; the inspected code does not expose an integrated Four-Pillars API. M1 #12 cannot close solely on the cardinality fix.
3. The fixture assigns both KASA authority and KASI transcription IDs to minute values. KASA annual notice and KASI data are not independent minute-level transcriptions until the official attached edition is compared.
4. Pinned independent differential checks and complete combined-pipeline adversarial tests remain to be demonstrated.

## Provenance and counterexample
Source files: src/calendar/koreaSolarTermFixtures.ts; test/solar-term-timeline.test.mjs; test/year-month-boundaries.test.mjs; src/index.ts.
KASI 2025 calendar-data: https://astro.kasi.re.kr/kor/life/post/calendarData?search_year=2025 (computational reference, explicitly not the official annual notice).
Counterexample: 48 annual events + 1 prior-year guard must never be asserted as 48 total.
Codeability: EXACT for cardinality; CONDITIONAL for official-minute attribution. No classical interpretation or policy default changed.

## Safe next tasks
1. Obtain exact checkout and run npm ci && npm run check; correct any additional genuine failures.
2. Audit public Four-Pillars composition and differential fixtures before closing M1 #12.
3. Compare KASA official attachments to KASI transcriptions before promoting M1 #13 golden fixtures.

## Runtime policy validation slice (2026-10-08)
- Confirmed from source: invalid DAY_ROLLOVER values previously fell through to the civil-date branch; invalid HOUR_STEM_REFERENCE values fell through to the civil-date stem. TypeScript unions cannot validate untyped JavaScript/JSON at runtime.
- Change: both policy parameters now reject unknown/missing values with `RangeError`, before calculation. No implicit default or interpretation rule was added.
- Adversarial vectors: `ZI_STRAT`, `AUTO`, empty string, `undefined`, `null`, numeric `0`, and lower-case policy spellings. Existing late-Zi policy-divergence tests remain unchanged.
- Source genealogy: direct code audit of `src/calendar/dayRollover.ts` and `src/calendar/dayHourPillars.ts`; software input-safety fact, not a classical or KASA/KASI astronomical claim.
- Codeability: EXACT (enum membership); dispute: NONE for validation; policy selection itself remains DISPUTED/explicit. Preconditions: effective civil/effective-clock input and caller-supplied policy IDs. Exception: invalid ID throws. Boundary: 23:00 late-Zi remains governed by the selected policies.
- Validation: isolated exact-logic Node 22.16.0 / TypeScript 5.8.3 strict check + three targeted tests PASS; full repository `npm run check` NOT RUN because GitHub checkout DNS failed. Keep M1 #12 OPEN and PR draft.
