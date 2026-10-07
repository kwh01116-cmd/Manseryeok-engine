# Execution handoff

## Current workstream
- Branch: `agent/foundation-20261006`
- PR: #1 (draft/open)
- Head at start of this run: `b5be8d7738d46075b86976caa7ff8edd1e566b90`
- Milestone: M1 — year/month/day arithmetic implemented; time-policy research gate decomposed; full canonical check and hour pillar outstanding.

## This run
- Re-read PR/head, main comparison, roadmap, package scripts, current source/research docs, tests, and this handoff from repository truth.
- Researched Zi-hour rollover and Five-Rat material; modern implementations confirm competing 23:00/00:00 conventions, but this is not sufficient to choose a canonical default.
- Added `docs/research/FOUR_PILLARS_TIME_POLICY.md` defining TIME_BASIS, DAY_ROLLOVER, and LATE_ZI_HOUR_STEM_REFERENCE as independent axes.
- Deliberately made no executable change: primary-text genealogy for rollover and Five-Rat is not yet pinned strongly enough, and the full branch canonical check remains outstanding.

## Checks
- Repository synchronization before write: PASS; PR head and target blob SHA were re-read before mutation.
- No executable files changed, so no new executable verification claim is made.
- Full branch `npm run check`: still outstanding from prior runs; do not call the whole PR green.

## Current gate
- Year/month composition preserves published-minute ambiguity.
- Date-only day-pillar arithmetic remains policy-free.
- Time-policy architecture is documented without inventing a default.
- Five-Rat pure lookup is the next candidate executable slice only after provenance pinning.

## Next safe tasks
1. Pin directly inspected primary/early textual evidence for Five-Rat and Zi-hour treatment; keep later-practice disagreement separate.
2. Run full branch `npm run check` as soon as a complete checkout is available; fix concrete failures before merge.
3. If Five-Rat provenance closes, implement pure day-stem + hour-branch lookup with exhaustive finite-table tests, leaving time-basis/rollover selection outside it.

## Open / disputed / blockers
- Full canonical branch check remains outstanding.
- Zi-hour rollover has no default; 23:00 and 00:00 conventions coexist in modern practice.
- Local mean solar time and local apparent solar time remain distinct and unset.
- Late-Zi hour-stem reference remains policy-dependent and unset.
- Five-Rat mnemonic is well-attested secondarily but primary-text genealogy is not yet pinned in the repository.
- 2025 Daxue guard is KASI computational data, not yet pinned to the edition-specific official 2025 Wolryeok notice.
- 1984=Jia-Zi anchor provenance and Twelve-Jie/Five-Tiger primary-text registry pinning remain open.
