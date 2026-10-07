# Execution handoff

Repository state is the canonical shared state between interactive and scheduled work.

## Current workstream
- Branch: `agent/foundation-20261006`
- PR: #1 (draft)
- Head at run start and immediately before this handoff write: `1512eb0de0ff41470d73cfe15b318ee363cfafe2`
- Milestone: M1 modern Korea Manseryeok core — active-Jie month-boundary resolver implemented; full canonical verification still outstanding.

## This run
- Re-read PR #1, main comparison, handoff, package scripts, year/month implementations and month tests from repository truth.
- Compare at run start: 49 ahead / 0 behind main; PR remained draft/open. PR mergeability was re-read as true before the handoff write.
- Re-attempted a fresh clone of the actual branch followed by `npm ci && npm run check`.
- Clone again failed before checkout because the execution container could not resolve `github.com`.
- No executable code was changed. This is intentional: the unverified year/month stack should not be broadened until canonical branch checks can actually run.

## Checks
- Actual-branch canonical `npm run check`: BLOCKED before checkout by `Could not resolve host: github.com`; no green claim.
- No new executable test result is claimed in this run.
- Last fully executed canonical branch verification remains the older 16/16 run; newer timeline/year/month commits remain unverified as a whole.

## Current gate
- Twelve month-boundary Jie mapping and Five-Tiger deterministic stem derivation are implemented.
- Active-Jie month branch resolution is implemented with civil-year-independent chronology.
- Exact equality at a MINUTE-precision boundary returns `PUBLISHED_MINUTE_AMBIGUOUS` with before/after branches; it does not invent an exact second.
- Full month-pillar composition with year-pillar ambiguity is intentionally not yet collapsed to a single pillar.

## Next safe tasks
1. Run actual-branch `npm run check` as soon as checkout/network permits; fix concrete failures before broadening.
2. After green, compose year/month boundary candidates at Lichun with explicit ambiguity propagation.
3. Then pin independent day-cycle anchors and implement the day pillar before hour-pillar policy work.

## Open / disputed / blockers
- Canonical branch check remains blocked by container DNS, so PR stays draft and must not merge.
- 1984=Jia-Zi anchor still needs canonical source-registry provenance.
- Twelve-Jie/Five-Tiger primary-text provenance still needs canonical registry pinning.
- Exact equality within minute-published solar-term values remains intentionally ambiguous.
- No default for Zi-hour day rollover, true-solar-time use, hidden-stem weighting, strength scoring, pattern selection or useful-god selection.
- Official calendar authority, KASI transcription, historical/classical rule provenance, and modern implementation policy remain separate.
