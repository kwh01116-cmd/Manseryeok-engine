# M1 historical birth-year expansion: 2000 source gate (2026-10-17)

## Verified primary record

- KASI / Korea Astronomy Observatory, **"2000년 월력요항 발표"**, released **1999-02-23**, archival notice `KAO-PR 9902-1`.
- Direct primary text: https://www.kasi.re.kr/publication/post/newsMaterial/2008
- This primary notice exposes the 24 solar-term KST minute table, Korean lunar month starts / month sizes, and twelve Gregorian first-of-month day pillars in one contemporary edition. It explicitly states that published clocks have no daylight-saving adjustment.
- Its original notices restrict onward distribution and commercial repurposing without permission. **The presence of publicly readable facts is not a commercial reuse clearance.** Do not ship/archive/repackage the full original tables or attached HWP in this product without licensing review; clarify whether independently computed facts are usable independently of the source's publication rights.

## Executed independent historic calendar check

The section "각월의 1일의 일진(2000)" supplies twelve year-2000 Gregorian month-first-day witnesses, independently of this repository's Gregorian date-cycle implementation. `test/day-pillar-kasi-2000.test.mjs` compares the published witnesses with `dayPillarForGregorianDate` and checks the 2000 leap-day-to-March transition. These test expectations are not derived from the implementation's 2000-01-07 cycle anchor. No Zi rollover, historical timezone reinterpretation, or lunar conversion is inferred.

Local *isolated* verification against the day-pillar/domain source logic from PR #1: Node 22.16.0 + TypeScript 5.8.3; TypeScript typecheck/build PASS; the new test file **2/2 PASS**. Direct full repository checkout is DNS-blocked in this environment; **canonical `npm ci && npm run check` NOT RUN**. Do not promote this test to full-suite verified based on isolated execution.

## Product coverage still blocked

- V0 API remains exactly **2026-2027** only. The 2000 day-pillar result does **not** imply that 2000 Four Pillars, lunar conversion, or any historic years are supported.
- To enable a full **2000** Gregorian birth year safely, the current full-year coverage manifest requires a trusted, ordered 2000 twenty-four-term minute corpus **plus 1999 DAXUE guard**. Its lunar input additionally needs contiguous lunar month data that cover required cross-year dates and a published next-year boundary witness.
- Pin independently checked 1999 guard and 2000 corpus with exact source edition, local KST clock, historical offset, precision and licensing status. Do not substitute a generic third-party "1900-2050 terms" engine for the KASI edition without checking discrepancies; the KASI notice has several minute-level differences from secondary calculators.
- Add the 2000 lunar new-year and next-year end witnesses and entire year of leap-month/gap, Lichun/Jie/23:00 crosschecks, then verify API and UI through real integration tests. Preserve fail-closed behavior until the corpus is complete.
- While expansion is pending, **do not** widen the production manifest, publish a '2000 supported' badge, merge PR #1, or ingest historical birth details into a public service.

## Next narrow slice

Find and independently verify edition-specific **1999 DAXUE** in an accessible authoritative source, and prepare source/rights provenance for the 2000 solar-term table. If primary archive cannot be retrieved, leave guard unverified and do not change the supported range. An independent astronomy computation and licensing review are alternatives to embedding KASI's restricted archival work.
