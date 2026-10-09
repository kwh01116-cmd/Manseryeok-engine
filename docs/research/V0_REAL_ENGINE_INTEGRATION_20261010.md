# V0 real-engine runtime integration — 2026-10-10

## Source snapshot and authority
- Working branch: `agent/foundation-20261006`; validated parent HEAD: `d41d0a263935b3df2cb25f05ff7d6dc18341c8a0` (read live PR HEAD before any future edits).
- Restored **65 repository runtime/build/test files** via GitHub connected file reads; compared the GitHub blob SHA returned by the connector and the local independently computed Git blob SHA of **each** file. All 65 matched. The Google Drive intermediate transport is temporary and **not** a source of truth. Existing Drive files were not modified.
- Locally patched only `src/calendar/solarTermTimeline.ts`, `test/solar-term-timeline.test.mjs`, `scripts/chart-preview-cli.mjs`, and `test/chart-preview-cli.test.mjs` before full check.

## Reproduced bugs and corrections
1. Initial canonical `npm run check` stopped on TS2375 at `solarTermTimeline.ts:44,47` with `exactOptionalPropertyTypes:true`: `{previous:undefined}` is not a value of `{previous?: SolarTermEvent}`. Fixed the actual runtime shape by **omitting absent keys**, not by relaxing the TypeScript setting. Counterexamples: before first fixture, after last, empty timeline, and equality with first fixture. Added regression test.
2. With this fixed, the canonical suite uncovered an existing CLI contract contradiction: an out-of-coverage result exited 2 but printed failure JSON on **stdout**, while the regression expected stdout to contain no chart. Fixed by sending non-`OK` structured statuses to **stderr** with exit code 2; successes remain on stdout with code 0. Strengthened the tests to assert exact `OUT_OF_COVERAGE` and `INVALID_LUNAR_DATE` statuses. The web API preserves structured HTTP 422 status responses.

## Checks actually executed (local exact-source reconstruction + reviewed small patches)
- Local Node **v22.16.0**; global TypeScript `tsc` **v5.8.3** matching pinned dev dependency.
- Initial `npm run check`: **FAIL**, 2 TS2375 errors. After first patch `npm run check`: **FAIL**, one existing CLI status test. After both fixes `npm run check`: **PASS, 129/129 Node tests** including TypeScript strict check and full build.
- `npm ci --offline --ignore-scripts`: **FAILED ENOTCACHED**, registry tarball not cached; therefore dependency lock install has not been independently reproduced, and no claim of successful `npm ci`.
- Actual local Node HTTP server at `127.0.0.1`: GET page 200; POST Gregorian 2027-02-05 12:00 = **丁未 壬寅 乙卯 壬午**; equivalent Korean lunar 2026-12-29 identical; 2027-02-04 10:46 retains **two** correlated Lichun candidates; invalid policy and 2028-01-01 return HTTP 422. Integration **PASS**.
- Chromium direct navigation to localhost blocked by administrator, so it was **not** called a normal end-to-end navigation pass. Chromium `page.set_content` loaded the unchanged source HTML, with intercepted requests fulfilled by the **live local Node engine server**. Desktop 1240 px + mobile 390 px both rendered the actual Four Pillars and had no horizontal overflow. This is an **intercepted UI/API integration pass** rather than direct browser URL navigation.
- `main` untouched; full KASA gazette-level calendar cross-check and licensing review remain open.

## Sources and limits
- Current KASI annual calendarData values are computational references, **not** independently certified as transcription of the official KASA gazette annex. The KASI page for 2027 itself warns it is not the official publication: https://astro.kasi.re.kr/kor/life/post/calendarData?year=2027 .
- KASA's 2027 monthly calendar announcement page states **공공누리 유형 2: 출처표시 + 상업적 이용금지** for its publication: https://www.kasa.go.kr/bbs/BBSMSTR_000000000018/view.do?nttId=B000000003234Li6nD2 . Assess data extraction, redistribution and eventual commercial-service permissions separately, before any commercial release. Do not infer that public factual dates themselves necessarily share the document's rights.
- No new school interpretation or unstated Zi rollover policy.

## Next safe tasks
1. Independently repeat `npm ci && npm run check` in a normal networked checkout with dependency lock install, inspect GitHub patch and branch preview.
2. Keep V0 as Draft until KASA official-edition minute comparison and source-rights evaluation; investigate broader birth-year fixture coverage after correctness gates.
3. Proceed to M2 deterministic ChartFacts only after critical M1/V0 checks are stable.
