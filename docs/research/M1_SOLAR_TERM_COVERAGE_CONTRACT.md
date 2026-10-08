# M1 solar-term coverage manifest contract (partially executable, not enforced by chart API)

Status: PARTIAL VALIDATOR / NOT ENFORCED BY CHART API / M1 #12 OPEN. Reviewed 2026-10-09 KST.
This document defines the next reversible gate; it does **not** certify the current public API, introduce a policy default, or promote KASI minute transcriptions to official KASA golden data.

## Newly demonstrated terminal-gap failure

Direct source audit:
- `src/calendar/solarTermTimeline.ts` validates ordering, year/term uniqueness, KST and minute precision.
- `src/calendar/monthPillar.ts` validates **adjacent supplied** 12-Jie order, then chooses the last Jie not later than the query.
- `src/calendar/yearPillar.ts` separately requires the queried civil year's LICHUN.
- None of these proves the last required Jie of a declared supported period is present.

Synthetic mutation: remove only `2027-12-07T17:38 DAXUE` from the 49-event fixture, retaining all other events. At `2027-12-31T12:00`, the uncorrupted last Jie is DAXUE -> 子 month, while the corrupted last Jie is LIDONG -> 亥 month. The adjacency guard cannot detect the missing **terminal** Jie because no later Jie remains. For 丁-year this would change 壬子 to 辛亥. This is a data-integrity counterexample, **not** a claim that the published 2027 DAXUE is wrong.

A standalone Node 22.16.0 selection-loop reproduction asserted the 子/亥 difference (2/2 PASS). It is **not** a canonical repository test.

## Candidate manifest scope and schema

A future versioned, immutable `SolarTermCoverageManifest` should bind a *specific fixture digest* to an *explicit half-open query interval* and a declared requirement profile. Suggested fields (interface design, not implemented):

- `schemaVersion`: explicit version, e.g. `m1-solar-term-coverage-v1`;
- `fixtureId` and `fixtureSha256`: digest of canonical serialized term/time/time-basis/precision/source-ID tuples; canonicalization must be documented and tested before assigning a digest;
- `timeBasis: "KST"`, `sourcePrecision: "MINUTE"`;
- `supportedFromInclusive`, `supportedUntilExclusive` as validated Gregorian minute strings;
- `requiredYears`: year-specific expected solar-term codes, **not** inferred from the supplied events;
- `requiredPriorBoundary`: preceding DAXUE guard when supporting January 2026;
- `requirementProfile`: `FULL_24_TERM_YEAR` versus `MONTH_PILLAR_12_JIE` (do not confuse these);
- `sourceIds`, `verificationStatus` and `officialEditionComparisonStatus` separately; fixture completeness is not authority/astronomical precision.

For the **current KASI-transcribed corpus only**, a candidate coverage interval is
`[2026-01-01T00:00, 2028-01-01T00:00)` KST civil minute, with exactly the 24 named term codes in each of 2026 and 2027, plus the 2025 DAXUE continuity guard. This is a proposed *product input domain*, not a claim that every minute is astronomically certain. No 2028 Jie may be inferred. A smaller, explicitly declared month-only partial fixture may remain valid under a distinct profile, but cannot claim full-year coverage.

## Validation contract (proposal)

1. Reject missing/invalid manifest, unsupported query minute, time-basis/precision mismatch, fixture digest mismatch, or unknown profile **before** resolving a chart. Never silently extrapolate.
2. For a full-year profile, compare expected (civil year, term code) sets against actual sets; require 24 distinct codes for each declared full year, and verify the prior guard. This detects missing terminal DAXUE and missing Zhongqi alike.
3. For a 12-Jie profile, validate all declared month-boundary Jie and its explicit left guard. Do not require Zhongqi when not promised; reject undeclared edge coverage.
4. Retain chronological order, uniqueness, term-code validity, source provenance and published-minute boundary ambiguity checks. Manifest validation supplements, not replaces, those checks.
5. Couple any `DEFINITE` label to its stated scope: published-minute comparison **and** independently validated fixture coverage. Actual second-level astronomical accuracy and birth-record precision remain separate and unverified.
6. Avoid breaking the existing partial-fixture test or introducing a hidden default. Before changing the public API, decide whether a new certified entry point or explicit `UNVERIFIED_COVERAGE` result is safer. Current API is not certified.

## Adversarial vectors for the next executable slice

| Fixture/query | Expected future manifest validation |
| --- | --- |
| Full 49-event fixture; 2027-12-31T12:00 | coverage accepted; 子 month under published-minute convention |
| Delete 2027 DAXUE; 2027-12-31T12:00 | **reject** missing terminal Jie (not 辛亥) |
| Delete 2027 JINGZHE; 2027-03-10T12:00 | reject missing interior Jie |
| Delete 2027 DONGZHI with FULL_24_TERM_YEAR | reject missing Zhongqi (full-year promise) |
| Delete 2027 DONGZHI with MONTH_PILLAR_12_JIE | do not reject *solely* for missing Zhongqi |
| Delete 2025 DAXUE guard; 2026-01-01T12:00 | reject missing left guard |
| Full fixture; 2028-01-01T00:00 | reject outside half-open interval |
| `[2025 DAXUE, 2026 XIAOHAN]` under an explicitly scoped partial manifest | accept only the declared narrow interval; never claim 2026/2027 full coverage |
| Correct term set with altered minute or altered source metadata | reject digest mismatch once canonical digest is implemented |

## Evidence taxonomy, uncertainty, and gates

- **Source genealogy:** KASI 2026 calendar-data (generation V1.0a, 2024-07-25), https://astro.kasi.re.kr/kor/life/post/calendarData?search_year=2026 ; KASI 2027 calendar-data (generation V1.0a, 2026-06-30), https://astro.kasi.re.kr/kor/life/post/calendarData?search_year=2027 ; repository fixture `src/calendar/koreaSolarTermFixtures.ts`; KASA official edition comparison remains pending.
- **Independent counterexample:** synthetic fixture deletion; not an independent astronomical observation.
- **Precondition:** a versioned, immutable, source-tagged corpus and declared supported interval.
- **Exception/boundary:** missing first/last/interior event, exact interval end, and an altered event must fail closed.
- **Codeability:** EXACT for finite set/cardinality/digest checks; CONDITIONAL for assigning a trusted supported interval and source edition; INTERPRETIVE not involved.
- **Dispute:** no Myeongli-school dispute. Published-minute rounding/truncation and official-edition transcription are UNVERIFIED.
- **Verification:** only standalone Node selection-loop counterexample 2/2 PASS; GitHub shell checkout failed DNS; `npm ci && npm run check` NOT RUN. No executable code changed and no merge is authorized.

## Implementation order

1. Recover exact checkout and run canonical `npm ci && npm run check` against PR HEAD.
2. Introduce a separate versioned manifest validator + tests for terminal deletion, partial guard and out-of-range queries, keeping existing resolver behavior explicit until the API migration is reviewed.
3. Bind certified API output to the validated manifest and source edition; compare official KASA attachments before any `OFFICIAL_GOLDEN` promotion.

## Executable finite-set slice — 2026-10-09 KST

- Added `src/calendar/solarTermCoverage.ts` with an **opt-in, full-calendar-year-only** `validateFullYearSolarTermCoverage` function. It requires an explicit manifest and query minute, checks consecutive declared years, a half-open year-aligned interval, the prior DAXUE guard, all 24 codes in every declared year, chronological uniqueness, KST/MINUTE tags and nonempty source-ID fields. It rejects undeclared extra events.
- This is **not connected to the public Four-Pillars resolver** and cannot make its `DEFINITE` result certified. Existing partial fixtures remain unchanged. The proposed `MONTH_PILLAR_12_JIE` / partial profiles, immutable fixture digest, canonical serialization, trusted edition verification and birth-record precision policy are **NOT implemented**. A valid code set with a changed minute can still pass this validator.
- `test/solar-term-coverage.test.mjs` adds 7 regression groups: full 49-event fixture, terminal DAXUE omission, interior Jie/Zhongqi omissions, missing prior guard, unsupported half-open query, malformed manifests/extras, and missing source provenance.
- **Checks:** local Node 22.16.0 / TypeScript 5.8.3 isolated reconstruction (validator + copied calendar fixture/timeline shapes) strict compile and 7/7 targeted tests PASS. This was **not** the exact GitHub checkout. `git ls-remote` failed DNS and canonical `npm ci && npm run check` was NOT RUN. This slice is UNVERIFIED and PR must remain draft/unmerged.
- **Taxonomy:** finite set/cardinality = EXACT software invariant; supported interval and KASA edition = CONDITIONAL human-curated declaration; no school interpretation. Counterexample: remove only 2027 DAXUE -> coverage rejects, whereas the existing chart resolver may still select the previous LIDONG. No claim of astronomical seconds precision, data licensing clearance or official KASA golden authority.


## 2026-10-09 opt-in API integration

An additional coverage-checked Four Pillars entry point is implemented in \`src/calendar/fourPillars.ts\`. It takes a caller-supplied full-year manifest (no default) and invokes \`validateFullYearSolarTermCoverage\` before existing chart calculation. It returns \`coverage.validation=STRUCTURAL_COVERAGE_ONLY\`. The older chart resolver remains available and unchecked. Canonical fixture digest, edition verification, partial-month profile and full exact-repo check remain open.
