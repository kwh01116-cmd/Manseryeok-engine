# M1 lunar input to checked chart (2026-10-09 KST)

Status: draft PR; exact repository checks pending.

The adapter takes an explicit lunar date (including leap-month flag), Korean civil HH:MM, explicit time policies, a validated finite lunar converter, solar-term events, and a full-year coverage manifest. It maps the lunar date to a Gregorian date and calls the existing coverage-checked Four-Pillars resolver. No policy defaults are introduced.

Evidence: docs/research/M1_LUNISOLAR_FINITE_CONVERTER.md and docs/research/M1_SOLAR_TERM_COVERAGE_CONTRACT.md. KASI-transcribed values are computational references, not verified official KASA annex goldens. Official edition comparison, fixture digest and reuse rights remain open.

Codeability: EXACT composition, CONDITIONAL source-data accuracy, DISPUTED Zi rollover/hour-stem policies. Input requires an explicit leap flag. An invalid lunar date or out-of-corpus date returns a typed failure. A malformed clock or missing solar-term coverage throws before returning a chart.

Adversarial vectors: lunar 2026-01-01 maps to Gregorian 2026-02-17; lunar 2026-12-29 maps to 2027-02-05 and a Jie-based 丁未 year, not lunar-year ganji; 2027-02-04T10:46 retains two correlated candidates. A nonexistent leap-sixth-month in 2026, omitted leap flag, 2025 leap-sixth-month outside the 2026/2027 Jie manifest, missing 2027 DAXUE, and invalid HH:MM must not return a chart.

Checks: isolated Node 22.16.0 / TypeScript 5.8.3 strict npm run check PASS; 6/6 focused tests PASS with stubbed dependencies. Exact repository npm ci && npm run check NOT RUN because github.com DNS failed. Do not merge until canonical verification.
