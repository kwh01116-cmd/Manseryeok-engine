# Execution handoff

This file is the canonical shared-state handoff between interactive ChatGPT work and the hourly automation. Repository state always overrides conversational memory.

## Current workstream
- Branch: `agent/foundation-20261006`
- PR: #1
- Head observed before this handoff update: `1018cc217a1c90e3a53d373ca9dbfa79fda5b348`
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
- local reconstructed `npm run check`: pass, 16/16 tests at the time of the earlier verification
- 1988 DST spring gap and autumn overlap boundary coverage added

## This run
- Re-read PR #1, ROADMAP, package scripts, solar-term code and this handoff from GitHub before planning.
- Confirmed the live PR head had advanced from the stale handoff SHA `ed46592d...` to `1018cc217...`; no stale code write was attempted.
- Diagnosed the prior generic "GitHub write blocked" description: the connected GitHub surface currently exposes explicit contents write actions. A synchronized handoff write was therefore used as the smallest safe write-capability probe.
- No executable code was changed in this run, so no new `npm run check` result is claimed.

## Next safe tasks
1. Re-read PR head and target SHAs, then add normalized 2026/2027 solar-term fixtures with explicit source authority, KST basis, minute precision, and corpus validation.
2. Implement adjacent-event lookup across civil-year boundaries with corruption/boundary tests.
3. Run canonical `npm run check`; only after green, implement Lichun year-pillar resolver and then twelve-節 month-pillar resolver.

## Synchronization protocol
- Before any write, re-read PR #1 head and the target file SHA.
- If head or target SHA changed since planning, discard the stale plan, re-read, and continue from the new state.
- Never blind-overwrite a file changed by another run.
- Do not create a parallel PR while #1 remains the compatible workstream.
- Interactive and scheduled runs both update this file after material progress when safe.

## Open / disputed / blockers
- No default for Zi rollover, true-solar-time usage, hidden-stem weighting, strength scoring, pattern selection, or useful-god selection.
- Historical time remains backlog unless it blocks a required M1 fixture.
- Official Korean calendar facts, KASI computational references, astronomical calculations, and Myeongli policy remain separate evidence classes.
- Repository-side CI is not established. Executable changes require an actually run canonical check before being called verified.
