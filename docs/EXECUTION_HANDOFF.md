# Execution handoff

This file is the canonical shared-state handoff between interactive ChatGPT work and the hourly automation. Repository state always overrides conversational memory.

## Current workstream
- Branch: `agent/foundation-20261006`
- PR: #1
- Head at handoff creation: `ed46592d9edb6aa6f8f6d708c6ba102a9421d4cc`
- Milestone: M0 repository safety -> M1 modern Korea Manseryeok core
- PR remains draft; do not merge while repository-side verification is absent.

## Verified work in current branch
- deterministic stems / branches / five elements / yin-yang
- sexagenary-cycle helpers
- stem-to-stem ten-god resolver
- isolated Korean historical standard-time and 1987-1988 DST boundary handling
- TypeScript 5.8.3 exact pin + npm lockfile
- factual 24-solar-term taxonomy and source-aware `SolarTermEvent`
- source/rule/test-vector research registries
- local reconstructed `npm run check`: pass, 16/16 tests at the time of this handoff
- 1988 DST spring gap and autumn overlap boundary coverage added

## Next safe tasks
1. Add normalized 2026/2027 solar-term fixtures with explicit source authority, KST basis, and minute precision.
2. Implement adjacent-event lookup across civil-year boundaries.
3. Implement Lichun year-pillar resolver, then twelve-節 month-pillar resolver with policy/equality semantics kept separate.

## Synchronization protocol
- Before any write, re-read PR #1 head and the target file SHA.
- If head or target SHA changed since planning, discard the stale plan, re-read, and continue from the new state.
- Never blind-overwrite a file changed by another run.
- Do not create a parallel PR while #1 remains the compatible workstream.
- Interactive and scheduled runs both update this file after material progress when safe.

## Open / disputed
- No default for Zi rollover, true-solar-time usage, hidden-stem weighting, strength scoring, pattern selection, or useful-god selection.
- Historical time remains backlog unless it blocks a required M1 fixture.
- Official Korean calendar facts, KASI computational references, astronomical calculations, and Myeongli policy remain separate evidence classes.
