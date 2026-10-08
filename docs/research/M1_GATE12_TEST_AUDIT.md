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

## Solar-term year/term uniqueness guard (2026-10-08)
- Source-level counterexample: the timeline validator previously checked only strictly increasing timestamps, so two distinct-minute LICHUN events within 2027 passed validation. The year resolver takes the first LICHUN while the month resolver iterates both, potentially producing inconsistent Four-Pillars results from corrupted input. This is a fixture integrity problem, not a classical-policy disagreement.
- New guard: reject duplicate (Gregorian civil year, solar-term code) keys, while permitting the same term across years and the 2025 DAXUE continuity guard. Existing 2026/2027 24-term KASI corpus and the independently published NAOJ 48-record comparison support the one-per-year invariant for the current supported period.
- Codeability: EXACT for finite uniqueness checking; precondition: sorted, valid KST minute events; exception: duplicate term/year throws; boundary: the same term in adjacent years is valid. Dispute: NONE for the current fixture period; not a new astronomy precision or school policy claim.
- New adversarial executable test: 2027 LICHUN 10:46 + 10:47 must fail, while 2026/2027 LICHUN and 2025/2026 DAXUE must pass.
- Checks actually run: isolated TypeScript 5.8.3 strict compilation PASS with a minimal SolarTermEvent type declaration; isolated Node.js 22.16.0 new-test logic 2/2 PASS; test file syntax PASS. Exact repository npm ci / npm run check NOT RUN: shell github.com DNS lookup still fails. Do not mark canonical verified or merge.

## Interior Jie coverage gap (2026-10-09, STATIC FINDING; not patched)

- Evidence: `validateKstMinuteSolarTermTimeline` checks KST, minute shape, chronological order and duplicate (year,term) keys; it does **not** assert expected Jie succession or the completeness of a declared supported coverage interval. `resolveMonthBranchAtJie` simply selects the latest supplied Jie. Thus removing an interior Jie from an otherwise sorted, unique fixture silently changes a month pillar. This is a software-data-integrity finding, not a school dispute.
- Adversarial vector (synthetic corruption, **not** an astronomical claim): start from the 49-event 2025 guard + 2026/2027 corpus, delete only 2027-03-06T04:40 JINGZHE. Query 2027-03-10T12:00 KST. Uncorrupted expected active Jie=JINGZHE, month branch=卯 (丁-year 癸卯); corrupted source-loop behavior selects LICHUN, branch=寅 (丁-year 壬寅). Sortedness and uniqueness still hold. A standalone Node 22.16.0 reproduction of the resolver's selection loop confirms JINGZHE -> LICHUN on deletion; **the actual repository test suite was not run**.
- Proposed narrow gate: check consecutive Jie codes modulo the 12-term sequence **within an explicitly declared covered interval**, and require an independently verified coverage/fixture manifest at edges. A blanket '12 Jie in every represented year' assertion would incorrectly reject the intentionally partial 2025 DAXUE guard and other legitimate partial timelines. Missing terminal events cannot be inferred from adjacency alone.
- Preconditions: finite, source-tagged, KST minute corpus; exceptions: missing interior Jie and unsupported/partial coverage must fail closed for chart resolution, not silently extrapolate. Codeability=EXACT for interior sequence checking; CONDITIONAL for coverage-manifest semantics. Dispute=NONE for data integrity; astronomy source/precision still UNVERIFIED where noted above.
- Follow-up executable change requires a failing regression test and exact-checkout `npm run check` before verification or merge.
