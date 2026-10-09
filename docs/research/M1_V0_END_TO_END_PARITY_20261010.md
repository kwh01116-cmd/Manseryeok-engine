# M1/V0/U0 end-to-end metamorphic regression — 2026–2027

Status 2026-10-10 KST: **test authored and syntax-checked, full repository execution pending**. No new calendar facts or interpretive rules.

## Evidence genealogy and classification
- Sources: existing KASI-transcribed lunar-month corpus 2025–2027, 2025 DAXUE guard, and 2026–2027 solar-term published-minute fixtures. Existing independent NAOJ published-minute differential is in `test/naoj-solar-term-differential.test.mjs`; official KASA/Gazette annex minute-level comparison remains OPEN.
- Codeability: EXACT *metamorphic equivalence* of two input calendar representations under the same explicit civil-time policy, conditional on the same finite M1 corpus. This is not an independent astronomical or scientific-prediction validation.
- Preconditions: Gregorian 2026-01-01 through 2027-12-31; valid converter and full-year manifest; explicit Korean civil minute, rollover and hour-stem policy.
- Test vectors: 730 days × two time-policy profiles (12:00 civil-midnight and 23:30 Zi-start/civil-date hour-stem) = 1,460 Gregorian/lunar chart-and-story comparisons; 24 Jie published-minute boundaries with adjacent -1/0/+1 minute correlation; nonexistent leap sixth month 2026; unsupported 2028-01-01.
- Adversarial counterexamples: silent leap flag loss; midnight substituted for Zi-start; Lichun two correlated states turned into a 2×2 Cartesian set; unsupported 2028 date receiving a story. Boundary equality is only at published-minute precision; neither source seconds nor birth-record precision are established.
- Exceptions and disputes: 2026–2027 is insufficient for normal consumer birth years. KASA official annex provenance and commercial source reuse, second-level solar-term rounding, unknown birth time and historical DST remain OPEN. No arbitrary default.
- Checks ACTUALLY RUN: `node --check test/m1-v0-projection-integration.test.mjs` PASS on SHA-identical authored test; Node 22.16.0 and TypeScript 5.8.3 isolated-stub strict `tsc -p tsconfig.json` PASS for accompanying U0 policy guard, `node --test test/v0-story-projection.test.mjs` 5/5 PASS. Exact checkout and canonical `npm ci && npm run check` NOT RUN because github.com DNS failed. The 1,460 new end-to-end assertions are **NOT EXECUTED** and must not be counted as passed.
