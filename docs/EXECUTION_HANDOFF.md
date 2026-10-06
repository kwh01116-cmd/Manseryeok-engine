# Execution handoff

Repository state is the canonical shared state between interactive and scheduled work.

## Current workstream
- Branch: `agent/foundation-20261006`
- PR: #1
- Head before this update: `3a8f78239355dfc17128976cd48bb74a080a055b`
- Milestone: M0 repository safety -> M1 modern Korea Manseryeok core
- Keep PR draft until executable verification is available.

## Verified branch state
- deterministic stem/branch, five-element, yin-yang, sexagenary and stem ten-god primitives
- isolated Korean standard-time and 1987-1988 DST handling
- TypeScript 5.8.3 exact pin and lockfile
- factual 24-solar-term taxonomy and source-aware SolarTermEvent
- research/source/rule/test-vector registries
- last actually verified executable result remains the earlier 16/16 test run

## This run
- Re-read PR #1, main comparison, ROADMAP, package scripts, solar-term code, source registry and this handoff.
- Start state: PR head `56b16b4131f9179b3eeacfa8cf7b504b0d82b04d`; branch 35 commits ahead and 0 behind main.
- Rechecked KASI 2026/2027 solar-term data and KASA 2027 official notice.
- Commit `3a8f78239355dfc17128976cd48bb74a080a055b` updates SOURCE_REGISTRY: adds the 2026 KASA authority anchor and separates official authority, direct transcription surface, edition metadata, KST basis and source precision.
- A fresh local clone/check attempt failed because the execution environment could not resolve github.com. No executable code changed, so no new verification is claimed.

## Next safe tasks
1. Re-read head and target SHAs; add normalized 2026/2027 solar-term fixtures carrying both authority and direct-transcription provenance, KST basis and minute precision.
2. Add corpus validation and civil-year-crossing adjacency tests, including malformed Gregorian datetime, duplicate, order, basis and precision failures.
3. Run canonical `npm run check`; only after green proceed to Lichun year-pillar and twelve-節 month-boundary logic.

## Synchronization protocol
- Re-read PR head and target SHA immediately before every write.
- If either changed, discard stale assumptions and re-read.
- Never blind-overwrite or create a parallel PR while #1 remains compatible.

## Open / disputed / blockers
- No default for Zi rollover, true-solar-time use, hidden-stem weighting, strength scoring, pattern selection or useful-god selection.
- Historical time remains backlog unless M1 needs it.
- Minute-published solar-term values are not exact-second boundaries.
- Official authority, KASI transcription/computational references, astronomical calculations and Myeongli policy remain separate.
- Repository-side CI is absent; the current execution environment also cannot rerun canonical checks because github.com DNS resolution failed.
