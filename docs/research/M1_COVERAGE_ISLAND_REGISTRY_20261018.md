# M1 calendar coverage islands — 2026-10-18

## Purpose

The engine's existing `FULL_24_TERM_YEAR` manifest correctly requires **consecutive** Gregorian years for each calendar corpus. A separately validated 2000 research corpus must not imply support for unverified 2001–2025 dates between it and the existing 2026–2027 preview.

The new `src/calendar/coverageIslandRegistry.ts` is an opt-in, source-neutral **routing utility** for distinct complete-year intervals. It returns a selected caller-supplied payload only when a valid KST civil-minute query is within its declared half-open bounds. It rejects overlaps, duplicate names, invalid calendar dates, partial years, absent payloads and unknown usage lanes.

Every call must specify `RESEARCH` or `CONSUMER`. `RESEARCH_ONLY` records are never selected for consumer queries. The test's sole `CONSUMER_APPROVED` island is explicitly **synthetic**, not a claim about the reuse rights of the real KASI or NAOJ data.

## Strict limits

The registry does **not** prove any supplied 24-term calendar is complete, astronomically accurate, licensed, or approved for commercial use. Callers must separately run `validateFullYearSolarTermCoverage`, enforce lunar-conversion correspondence, verify source rights and obtain explicit release approval. Its caller-controlled approval flag is not a certification. The V0 web and CLI still use only their existing 2026–2027 fixture; there is no 2000 production enablement or new policy default.

## Actual checks

- Exact authored source and regression file were compared with Git blob SHAs from a separate local staging directory.
- Node 22.16.0 and TypeScript 5.8.3 isolated `tsc --noEmit` and `tsc` build: **PASS**.
- `node --test test/coverage-island-registry.test.mjs`: **5/5 PASS**, no skips.
- Whole-repository `npm ci && npm run check`: **NOT RUN**, because this shell cannot resolve github.com for checkout.
- Prior `test/m1-2000-four-pillars-integration.test.mjs`: **still runtime-unverified**, not included in the five passes.
- No GitHub Actions, deployment, main merge or source-rights promotion.

## Next mandatory gate

Obtain an exact GitHub-accessible checkout and execute all repository tests. Investigate any actual failure, including the complete 2000 Four-Pillars Gregorian/lunar parity suite, before connecting research profiles to any HTTP app route or declaring a birth year supported.
