# Execution handoff

Repository state is the canonical shared state between interactive and scheduled work.

## Current workstream
- Branch: `agent/foundation-20261006`
- PR: #1 (draft)
- Executable head before this handoff update: `a90a1fd07b7677f164508d1c350c695f6439c73e`
- Milestone: M1 modern Korea Manseryeok core — month-pillar deterministic-rule slice; full canonical verification still outstanding.

## This run
- Re-read PR #1, main comparison, ROADMAP, handoff, package scripts, year-pillar implementation/tests and all executable source/test files needed for audit.
- Start head was `a583062063171538d3933d0792a3b066a64baf16`; branch was 45 ahead / 0 behind main and mergeable.
- Fresh clone + `npm run check` was attempted first and failed before checkout because the container could not resolve github.com.
- Primary-text research upgraded Five-Tiger provenance: 《三命通會》卷二 directly records `月從年` and the Five-Tiger verse / 正月起丙寅 sequence. A separate scanned historical text explicitly describes month derivation `以節令為綱`; keep these genealogies separate.
- Commit `a90a1fd07b7677f164508d1c350c695f6439c73e` adds only deterministic twelve-節 month-boundary taxonomy and Five-Tiger stem derivation plus tests. It does not yet choose exact equality at published-minute boundaries or compose year/month ambiguity.

## Checks
- Actual-branch canonical `npm run check`: BLOCKED by transient github.com DNS failure at clone; no green claim.
- Focused reconstructed candidate using Node 22.16.0 / TypeScript 5.8.3: typecheck PASS; build PASS; 3/3 month-rule tests PASS.
- Last fully executed canonical branch verification remains the older 16/16 run; newer timeline/year/month commits remain unverified as a whole.

## Current gate
- Twelve month-boundary 節 mapping: Lichun→寅, Jingzhe→卯, Qingming→辰, Lixia→巳, Mangzhong→午, Xiaoshu→未, Liqiu→申, Bailu→酉, Hanlu→戌, Lidong→亥, Daxue→子, Xiaohan→丑.
- Five-Tiger deterministic start: 甲/己→丙寅, 乙/庚→戊寅, 丙/辛→庚寅, 丁/壬→壬寅, 戊/癸→甲寅.
- Boundary-time resolver is intentionally not implemented until published-minute ambiguity composition is explicit.

## Next safe tasks
1. Run actual-branch `npm run check` as soon as checkout/network permits; fix concrete failures before broadening.
2. Pin primary-text provenance for twelve-節/Five-Tiger in canonical rule/source registry.
3. Implement active-節 month resolver with cross-year adjacency and published-minute ambiguity, including Lichun and Jingzhe adversarial vectors.

## Open / disputed / blockers
- Canonical branch check remains blocked by container DNS, so PR stays draft and must not merge.
- 1984=甲子 anchor still needs canonical source-registry provenance.
- Exact equality within minute-published solar-term values remains intentionally ambiguous.
- No default for 子時換日, true-solar-time use, hidden-stem weighting, strength scoring, pattern selection or useful-god selection.
- Official calendar authority, KASI transcription, historical/classical rule provenance, and modern implementation policy remain separate.
