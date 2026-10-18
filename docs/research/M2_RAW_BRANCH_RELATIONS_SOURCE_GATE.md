# M2 G5 — raw earthly-branch pair relationships, evidence and execution gate

Status: implemented and **canonical CI GREEN** as a policy-gated research lookup; [GitHub Actions 39094446372](https://github.com/kwh01116-cmd/Manseryeok-engine/actions/runs/39094446372) passed 206/206 plus browser. Later ChartFacts v2 run [39094664600](https://github.com/kwh01116-cmd/Manseryeok-engine/actions/runs/39094664600) passed 212/212 plus browser. No interpretation, policy consensus, official certification or release authorization is claimed.

## Verifiable source boundaries

Each type has a **distinct** rule ID, source ID and source layer. These are traditional classifications, not empirically validated causal connections or predictions.

| Class | Six canonical unordered pairs / other rules | Evidence |
| --- | --- | --- |
| 六合 LIUHE | 子丑, 寅亥, 卯戌, 辰酉, 巳申, 午未 | `CLASSIC-YUANHAI-ZIPING-LIUHE`; https://www.donglishuzhai.net/chapter/5618.html |
| 六冲 LIUCHONG | 子午, 丑未, 寅申, 卯酉, 辰戌, 巳亥 | `CLASSIC-YUANHAI-ZIPING-XIANGCHONG`; https://www.donglishuzhai.net/chapter/5620.html |
| 六害 LIUHAI / 穿 | 子未, 丑午, 寅巳, 卯辰, 申亥, 酉戌 | `CLASSIC-YUANHAI-ZIPING-XIANGCHUAN`; https://www.donglishuzhai.net/chapter/5621.html (the classical text says **穿**, modern classification maps this to 害) |
| 六破 LIUPO | 子酉, 丑辰, 寅亥, 卯午, 巳申, 未戌 | `MODERN-CLARIFYHK-LIUPO-LIUREN-COMPARISON-2026`; https://clarifyhk.com/zh-hans/learn/bazi/earthly-branches/reading-order-for-punishments-harms-and-breaks ; comparison to 六壬 literature, **NOT** asserted as an uncontested classical 四柱 text |
| 刑 XING | Directed arcs 寅→巳→申→寅, 丑→戌→未→丑; **bidirectional** 子↔卯; **self** 辰辰, 午午, 酉酉, 亥亥 | `CLASSIC-YUANHAI-ZIPING-XIANGXING`; https://www.donglishuzhai.net/chapter/5622.html |

A second classical text, `子平真詮`, discusses combinations being able to resolve or interrupt other relations and warns that the naive effects are conditional: https://m.donglishuzhai.net/chapter/3720.html . The current engine intentionally makes **no** resolution, efficacy, 化氣, quality, auspiciousness, wealth, family or event prediction decision.

## Hard semantics

- Explicit `M2-BRANCH-RELATIONS-YHZP-PAIRS-LIUPO-2026-V1` policy (codeability `CONDITIONAL`, dispute `SCHOOL_DEPENDENT`). Every returned hit carries the particular class's ruleId/sourceIds.
- `branchRelationsBetween(a,b,policy)` is a **two-occurrence** query. Symmetric classes remain symmetric in either input order; directed XING retains orientation; 子卯 returns `BIDIRECTIONAL`. A self-hit only denotes *two separate copies* of that branch, not one branch automatically hurting itself.
- `collectFourPillarBranchRelations([year,month,day,hour],policy)` checks all six ordered-by-position index pairs (i < j). It does **not** compare a pillar to itself. Four 辰 yield six distinct positional self hits; one 辰 yields no self hit. Do not require adjacent pillars.
- **Overlaps intentionally kept:** 巳申→六合+六破+刑; 寅亥→六合+六破; 寅巳→六害+刑; 丑未→六冲+刑. Competing traditions may downweight/suppress an overlap in a later *interpretative policy*, but a raw lookup must not hide it.
- A three-branch directional punishment arc is *not* a claim that the full triad is present or active. There is no promotion of raw pair labels into 三刑成格 or 命局吉凶.
- `BRANCH_RELATION_RULES.LIUPO` explicitly carries `MODERN_HEURISTIC`, while the four classical evidence families carry `CLASSICAL_BASE_TEXT`. Traditional practice may disagree on the meaning/significance of the classes, especially 六破.
- The set of six symmetric pair tables and directed XING edges is pinned by an **independently written oracle** in `test/m2-branch-relations.test.mjs`; exhaustive 12×12 (144 ordered branch-pair queries), overlaps, 4-pillar multiplicity, malformed inputs, source labels, and frozen outputs are verified.

## Important exclusions and next gate

No 삼합, 삼회, 반합, 원진, 천간 합, elemental transformation, 강약 score, 격국, 용신, 대운, personal judgement or prediction. Those need their own versioned source + rule + adversarial verification.

Next step is `m2-chart-facts-v2` adapter *on top of* M2 ChartFacts v1, requiring this separate relations policy and retaining Lichun alternative candidates. Do not silently extend M1 API or the U1 browser with raw relation labels before the data contract and comprehension tests are green.
