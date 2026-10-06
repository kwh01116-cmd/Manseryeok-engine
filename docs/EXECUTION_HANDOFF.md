# Execution handoff

Repository state is the canonical shared state between interactive and scheduled work.

## Current workstream
- Branch: `agent/foundation-20261006`
- PR: #1
- Head before this update: `fe9cebf3e4f405a335b2aac8f2ce0ad48b8584b9`
- Milestone: M1 modern Korea Manseryeok core — solar-term timeline/official fixture gate
- PR remains draft.

## Verified branch state
- deterministic stem/branch, five-element, yin-yang, sexagenary and stem ten-god primitives
- isolated Korean standard-time and 1987-1988 DST handling
- TypeScript 5.8.3 exact pin and lockfile
- factual 24-solar-term taxonomy and source-aware SolarTermEvent
- research/source/rule/test-vector registries
- last fully executed canonical verification remains 16/16 tests

## This run
- Re-read PR #1, main comparison, ROADMAP, package scripts, solar-term source and this handoff.
- Start head `cd1663216e149a343f4c42707d110f796cd0e954`; branch was 39 ahead / 0 behind main and mergeable.
- Resolved the prior executable-write blocker by using Git object blob/tree/commit plus expected-head ref update rather than Contents create-file.
- Commit `fe9cebf3e4f405a335b2aac8f2ce0ad48b8584b9` adds `src/calendar/solarTermTimeline.ts` and `test/solar-term-timeline.test.mjs`.
- Timeline validation enforces real Gregorian minute values, KST basis, MINUTE source precision and strict ordering/no duplicates; adjacency lookup crosses civil-year boundaries without year partition assumptions.

## Checks
- Fresh clone + `npm run check`: attempted, but container DNS could not resolve github.com; no new canonical verification is claimed.
- New tests are committed but are NOT marked verified until the actual branch check can run.
- Last fully executed canonical verification: 16/16 tests before this commit.

## Next safe tasks
1. Re-read head, then add the normalized 2026/2027 official solar-term fixture corpus with authority/transcription provenance and tests against the committed timeline validator.
2. Run canonical `npm run check` on the actual branch as soon as checkout/network permits; do not merge while the new executable commit is unverified.
3. Only after green, implement Lichun year-pillar boundary and twelve-節 month boundaries; after M1 Four Pillars closes, add thin V0 end-to-end Manseryeok/API before M2.

## Open / disputed / blockers
- Executable GitHub mutation is no longer blocked when using atomic Git object writes with an expected-head lease.
- Actual-branch canonical check remains blocked by container github.com DNS resolution; commit `fe9cebf3...` is therefore unverified.
- No default for Zi rollover, true-solar-time use, hidden-stem weighting, strength scoring, pattern selection or useful-god selection.
- Minute-published solar-term values are not exact-second boundaries.
- Official authority, KASI transcription/computational references, astronomical calculations and Myeongli policy remain separate.
