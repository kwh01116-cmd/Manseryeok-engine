# M1 #12: post-DST Korean civil-time Four-Pillars composition (candidate)

Status: IMPLEMENTED ON DRAFT BRANCH, CANONICAL VERIFICATION PENDING. This is a narrow API adapter, not an astronomical-precision certification or a full historical birth-time normalizer.

## Provenance and scope
- Reuses repository rules from src/calendar/yearMonthPillars.ts (KASI-transcribed 2026/2027 solar terms, Lichun/Jie correlation), src/calendar/dayHourPillars.ts (day-cycle and explicit late-Zi policies), and docs/research/FOUR_PILLARS_TIME_POLICY.md.
- Requires explicit timeBasis=KOREAN_CIVIL_TIME, dayRollover, hourStemReference; rejects unsupported/missing policies at runtime.
- Requires a pre-normalized post-1988 Korean civil wall-clock minute (YYYY-MM-DDTHH:MM). The API does NOT convert UTC, solar time, location, historical standard time or DST; 1988 and earlier fail closed. The caller remains responsible for provenance and precision of the birth record.
- Returns correlated year/month candidates, attaching the same computed day/hour pair to each. Lichun must produce two, not a four-way Cartesian product.
- confidence=DEFINITE means only definite under the existing **published-minute comparison convention**. confidenceScope=PUBLISHED_MINUTE_COMPARISON_ONLY explicitly denies claims of second-level astronomical certainty or exact birth-record precision.

## Classification
- Software composition and runtime enum validation: EXACT (relative to existing functions).
- Printed-minute comparison: CONDITIONAL on fixture transcription and publisher-minute semantics.
- Actual astronomical boundary second, rounding/truncation, birth record precision: UNVERIFIED.
- DAY_ROLLOVER and late-Zi hour-stem reference: DISPUTED/explicit policy; no defaults.
- Source genealogy: repository year/month/day/hour code and tests, KASI 2026/2027 calendar data; Japanese NAOJ 48-vector comparison documented in SOLAR_TERM_PUBLISHED_MINUTE_DIFFERENTIAL.md. NAOJ is an independent publisher, not Korean legal authority.

## Preconditions, exceptions, adversarial vectors
- Preconditions: valid post-1988 KST minute; compatible source-aware KST solar-term timeline covering the birth year and prior Jie; explicit time policies.
- Exceptions: malformed birth minute, historical/unsupported time basis, invalid policy, missing solar-term fixture must throw rather than silently substitute a chart.
- Vectors: 2027-02-04T10:46 Lichun -> exactly two correlated year/month candidates; 2027-02-05T12:00 -> one; 2027-02-05T23:30 CIVIL_MIDNIGHT vs ZI_START -> day difference while year/month stay fixed; 1988-10-09T02:30 -> rejected; invalid policy IDs -> rejected.
- Counterexample: under a hypothetical nearest-minute publisher convention, a birth record at 2027-02-04T10:45 may straddle actual Lichun even when this API returns one candidate. No unverified one-minute buffer was added; consumers must not label this as an astronomically certain chart.

## Verification
- Local isolated TypeScript 5.8.3 strict contract compilation PASS using typed dependency stubs; new Node test file syntax check PASS.
- NOT run: exact-repository npm ci / npm run check; shell git ls-remote still fails github.com DNS. Tests are added to the draft branch but are NOT certified green.
- No merge until canonical checks and further time-precision review.


## Opt-in structurally coverage-checked Four Pillars — 2026-10-09

\`resolveCoverageCheckedModernKoreanCivilFourPillars(events, birthMinute, explicitPolicies, manifest)\` now runs the full-year manifest check before composing the existing chart. The legacy entry point is preserved for intentionally partial fixtures and remains **unchecked**. M1 #12 is still OPEN; product integrations should choose the checked entry point explicitly.

- Classification: EXACT software composition, CONDITIONAL source-minute values, DISPUTED late-Zi/time policies unchanged. No classical interpretation or defaults added.
- Preconditions: explicit KST/MINUTE full-24-term manifest for a declared half-open supported period; post-DST Korean civil birth minute; explicit day/hour policies.
- Errors: missing left/interior/terminal solar terms, label transpositions, out-of-range birth, missing manifest and invalid policy fail closed. Query at minute-exact Lichun still returns 2 correlated candidates.
- Output \`coverage.validation=STRUCTURAL_COVERAGE_ONLY\` is **not** official-KASA, digest-certified, or astronomical-seconds accuracy; never treat \`DEFINITE\` as a seconds-level claim.
- Test vector: remove 2027 DAXUE and query 2027-12-31T12:00; the checked API must throw before a stale 亥-month can escape. Swap 2027 XIAOHAN/DAHAN, also throws.
- Provenance: existing KASI-transcribed fixtures, source taxonomy and M1 full-year validator; not a new celestial assertion. Checks: Node v22.16.0 / TypeScript v5.8.3 isolated strict test harness with stubbed pillar collaborators 6/6 PASS after correcting a test-harness default-argument mistake; exact repository \`npm run check\` NOT RUN due GitHub DNS.
