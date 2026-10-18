# M1/V0/U0 end-to-end metamorphic regression — 2026–2027

Status 2026-10-11 KST: **canonical check PASS, 141/141 tests**, after correcting one invalid clock-boundary oracle. One finite verification slice; existing calendar values and production resolvers are unchanged.

## Actual failure and corrected invariant
- Exact starting PR #1 head: `f8898527ec0b751d051c5b51ea592d671e0d84e8`. All 107 original files matched their Git blob SHAs; reconstructed source tree matched `6237d624fb08643011a16844b2b895e77ac4458b`. No source stubs.
- Baseline `npm run check`: typecheck/build PASS; tests **138/139 PASS**. At published 2026 JINGZHE `2026-03-05T22:59`, the test compared the entire after-boundary chart with a birth at `23:00`. That later birth legitimately has 子 hour, whereas both boundary-minute candidates retain 亥 hour.
- Compare the original -1/0/+1 birth-minute **year/month** pairs. Preserve the full Four-Pillars assertion by holding the birth clock at the published boundary minute and shifting only that event by +1/-1 minute in local synthetic timeline copies. These controls are not new astronomical observations, and never mutate the shared KASI corpus.
- At all 24 Jie boundaries, require exactly two temporally correlated candidates. Lichun remains before/before or after/after, never a Cartesian product.

## Deterministic witness and provenance
- Fixture: `test/fixtures/jie-clock-boundary-2026-jingzhe.json`.
- The published 22:59 Jingzhe and date-only anchor `2026-03-19 壬辰` come from the existing KASI 2026 V1.0a transcriptions. March 5/6 are 14/13 civil days before that anchor: 戊寅/己卯. Expected month/hour labels use the existing Five-Tiger/Five-Rat contracts and explicitly named policies, not engine-generated fixture expectations.
- Three profiles: CIVIL_MIDNIGHT + SELECTED_DAY_PILLAR; ZI_START + SELECTED_DAY_PILLAR; ZI_START + CIVIL_DATE_DAY_PILLAR. Each has fixed 22:58/22:59/23:00 charts, effective dates and confidence labels.
- Verify all nine chart vectors through both Gregorian and Korean-lunar input and U0 presentation: **18/18** comparisons. Missing/unknown rollover or hour-stem reference and unsupported apparent-solar-time basis throw; no implicit policy.
- Existing 730 days × two explicit profiles = **1,460** Gregorian/lunar chart-and-story comparisons now execute and pass. Existing 24 Jie boundary checks, invalid leap-month and unsupported 2028 cases also pass.

## Checks actually run
- Runtime: Node **24.19.0**, pinned TypeScript **5.8.3**.
- Clean standard `npm ci` PASS (only fetch retry/timeout flags supplied); then `npm run check` PASS: typecheck, build, **141/141 tests**, no skips.
- Focused integration file: **5/5 PASS**. Independent Python date arithmetic/explicit-table audit of the fixed witness: **9/9 PASS**. Test syntax and diff whitespace checks PASS.
- This is full-source runtime verification, not the earlier isolated reconstruction. No GitHub Actions workflow, main merge or release.

## Gate and next step
The finite M1/V0/U0 parity execution gate is now green. KASA/Gazette official annex comparison, source-use rights, solar-term second/rounding uncertainty, unknown birth-time handling and consumer birth-year coverage remain OPEN. Next: compare the existing 2026/2027 published-minute fixtures with the edition-specific official KASA annex before promoting authority or expanding the corpus. Historical Korean time facts and disputed Myeongli policies remain separate.
