# V0 read-only chart smoke (2026-10-09)

Status: draft, full-repository execution UNVERIFIED. This is a fixed-example CLI smoke, not a user-facing birth form, official KASA certification, or production release.

## Run after canonical build

    npm ci && npm run check
    node scripts/v0-smoke.mjs

The smoke script reuses the current public V0 preview API, KASI-transcribed 2025-2027 lunar corpus and 2026/2027 solar-term fixture. It explicitly selects Korean civil time, civil-midnight rollover and selected-day hour-stem reference **for demonstration only**. These are not engine or app defaults. The fixed manifest promises structural 24-term completeness, not a verified source digest, official KASA annex, astronomical seconds, or birth-record precision.

Three cases: Gregorian 2027-02-05 12:00; equivalent Korean lunar 2026-12-29 12:00 (non-leap); and the 2027-02-04 10:46 published Lichun minute with two correlated candidates. Regression test file: test/v0-smoke.test.mjs. The test asserts identical four pillars for equivalent dates, Korean year/month labels, source provenance, structural-only coverage and Lichun ambiguity.

Provenance: src/calendar/koreanBirthPreview.ts, koreanLunarBirthFourPillars.ts, koreaSolarTermFixtures.ts and koreanLunisolarFixtures.ts; existing KASI 2025/2026/2027 source registry. No new astronomy values or classical interpretation. Preconditions: Node 22+, exact compiled dist, modern Korean civil time within the declared manifest. Boundary: Lichun published minute; adversarial counterexample: silently choosing one candidate at 10:46 would fail. Codeability: EXACT wiring; CONDITIONAL input/source minutes; DISPUTED Zi/time policy remains explicit.

Checks actually executed: local Node 22.16.0 node --check on both new files PASS. New repository end-to-end tests NOT RUN (dist unavailable); canonical npm ci && npm run check NOT RUN because GitHub DNS and direct-IP network access fail in shell. No merge authorization.
