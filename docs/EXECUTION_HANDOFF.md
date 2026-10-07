# Execution handoff

Repository state is the canonical shared state between interactive and scheduled work.

## Current workstream
- Branch: `agent/foundation-20261006`
- PR: #1 (draft)
- Head before this update: `e973a32c272ac7ae119c92856314b0a7a406c908`
- Milestone: M1 modern Korea Manseryeok core — year-pillar verification gate before month-pillar work.

## Verified branch state
- deterministic stem/branch, five-element, yin-yang, sexagenary and stem ten-god primitives
- isolated Korean standard-time and 1987-1988 DST handling
- factual 24-solar-term taxonomy and source-aware SolarTermEvent
- 2026/2027 Korea solar-term fixture corpus and timeline validation are committed
- last fully executed canonical verification remains 16/16 tests from before the newer timeline/year-pillar commits

## This run
- Re-read PR #1, current head, package scripts, timeline, official fixture corpus, year-pillar implementation/tests, and this handoff.
- Found a concrete unverified-test defect: domain GanZhi uses canonical Hanja symbols (甲子, 丙午, 丁未), while the new year-pillar tests incorrectly expected English transliterations (JIA/ZI, BING/WU, DING/WEI).
- Prepared and committed the test correction only. Month-pillar implementation was intentionally not started because the dependency gate requires the year-pillar slice to pass canonical checks first.
- Five-Tiger month-stem research was sampled and is consistent across independent implementations: 甲/己→丙寅, 乙/庚→戊寅, 丙/辛→庚寅, 丁/壬→壬寅, 戊/癸→甲寅. Treat this as research input, not yet a verified/canonical rule entry.

## Checks
- Static repository audit: FAIL found in committed year-pillar expectations; corrected in this commit.
- Fresh actual-branch `npm run check`: not completed in this run; do not claim the new year-pillar/timeline tests green.
- Last fully executed canonical verification remains 16/16 tests before the newer executable commits.

## Next safe tasks
1. Run `npm run check` on the actual branch; fix only concrete failures until green.
2. After green, add a provenance-bearing rule-registry entry for the twelve 節 month boundaries and Five-Tiger month-stem mapping, with explicit distinction between traditional rule provenance and modern implementation.
3. Then implement the smallest month-pillar resolver with published-minute ambiguity at 立春/驚蟄/etc. and boundary/adversarial tests.

## Open / disputed / blockers
- Canonical check for timeline/fixture/year-pillar commits is still outstanding.
- 1984=甲子 anchor still needs canonical source-registry provenance.
- Five-Tiger mapping has independent agreement but primary/classical genealogy has not yet been pinned in the repository.
- No default for 子時換日, true-solar-time use, hidden-stem weighting, strength scoring, pattern selection or useful-god selection.
- Minute-published solar-term values are not exact-second boundaries.
- Official authority, KASI transcription/computational references, astronomical calculations and Myeongli policy remain separate.
