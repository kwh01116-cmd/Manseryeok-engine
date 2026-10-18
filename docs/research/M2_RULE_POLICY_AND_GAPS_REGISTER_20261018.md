# M2/M3 rule and evidence backlog — versioned register proposal (2026-10-18)

**Status: documentation-only review, no executable rule added or promoted.** The current `docs/research/RULE_REGISTRY_SCHEMA.md` demands ruleId, version, sourceId, evidenceLayer, codeability, dispute, preconditions, exceptions, test vectors and adversarial counterexamples. This document enumerates missing release decisions and respects that a classical rule's historical presence does **not** establish predictive or scientific efficacy.

## Already implemented under explicit policies: DO NOT recode

| ID / code surface | Current semantics | Status and caution |
| --- | --- | --- |
| M2-RULE-HIDDEN-STEMS-001 / `src/domain/hiddenStems.ts` | Branch → classical hidden stem membership, profile-specific main qi | TESTED source-member lookup, not 司令 or qi weighting |
| M2-RULE-BRANCH-TEN-GODS-001 / `branchTenGods.ts` | Day master against every hidden stem | TESTED, no branch-as-single-God shortcut |
| M2-RULE-CHART-FACTS-001/002/003 / `chartFactsV1–V3.ts` | Layered immutable facts with candidate-index evidence | TESTED on supported 2026–2027 / research 2000 separately |
| M2-RULE-TWELVE-GROWTH-STAGES-001 | 12-stage name by explicit yin/yáng and fire/earth anchor policy | TESTED **one school convention**; not a numeric strength model |
| M2-RULE-BRANCH-{LIUHE,LIUCHONG,LIUHAI,LIUPO,XING}-001 | Raw pair presence, source-tagged; XING direction/self | TESTED, no automatic effects or conflict resolution |
| M2-RULE-TRIAD-{SANHE,SANHUI}-MEMBERS-001 | 4 Sanhe + 4 Sanhui member sets, two vs three distinct members | TESTED structural presence, no transformation/activation; classical four-branch earth group unimplemented |

## Outstanding rules: exact resolution gates

| Proposed ID | Rule/topic | Source genealogy | Disagreement to isolate | Minimal positive and adversarial vectors | Default decision |
| --- | --- | --- | --- | --- | --- |
| M2-RULE-TRIAD-EARTH-FOUR-001 | 辰戌丑未 (four-earth group) | `淵海子平` 〈論十二支三合〉 **distinct four-member** assertion | Is it 四庫 / 土局 / meeting classification, and are repeated occurrences counted? | four distinct; three distinct+duplicate; conflict with 辰戌冲 / 丑未冲 | **RESEARCH** |
| M2-RULE-TRIAD-HALF-001 | 半合／拱合 activation | Classical Sanhe members; modern explanatory convention | 生旺, 旺墓, 生墓, adjacency, 월령 and 刑冲 | 寅午 vs 午戌 vs 寅戌; same pair across distant pillars | **BLOCK EXECUTION** |
| M2-RULE-BRANCH-TRANSFORM-001 | 六合／三合／三會 合化 | Classical base + divergent modern and Korean practices | transformation vs membership; month authority and obstruction | 巳申 with 破/刑 concurrently; one full group with opposite 冲 | **BLOCK EXECUTION** |
| M2-RULE-BRANCH-XING-TRIAD-001 | directional 三刑 completion | `淵海子平` relative arcs | group of three vs individual directed pairs and partial cycles | 寅巳申; 寅申; 寅寅申; 辰辰 self case | **BLOCK EXECUTION** |
| M2-RULE-HEAVENLY-STEM-HE-001 | 甲己/乙庚/丙辛/丁壬/戊癸 raw 干合 | classical stem-combination lists; edition not qualified here | polarity, position and effective 合化 | all five pairs; false adjacent same-stem, overlap with real branch relations | **RESEARCH** |
| M2-RULE-HEAVENLY-STEM-CHONG-001 | heavenly stem 冲 | Later schools not uniform | whether 刑冲 only among 10 stems and applicable topology | opposing element stems vs pair absent | **DO NOT ASSUME** |
| M2-RULE-HIDDEN-STEM-SEASONAL-001 | 司令/지장간 여중본기 weights | separate modern/Korean practice comparisons required | effective qi by birth date and variable seasonal subdivisions | boundaries around Jie/中, leap and published-minute ambiguity | **BLOCK EXECUTION** |
| M3-RULE-DAYMASTER-STRENGTH-001 | 신강·신약, 通根 | Korean practice / multiple schools; no fixed critical edition verified | month commanding qi, seasonal support, raw counts, changed qi and schema | charts with identical counts but different month, unknown time, 2 Jie candidates | **BLOCK M3** |
| M3-RULE-PATTERN-001 | 格局/격국 | multiple incompatible Korean and classical readings | fixed vs contingent 格, 從格 exceptions and order | conflicting rules on same chart, adjacent boundaries | **BLOCK M3** |
| M3-RULE-USEFUL-GOD-001 | 用神/調候/扶抑 | school-dependent, source/edition review not done | separate 조후/억부/통관/병약/종격 paradigms | opposing recommendations with explicit provenance | **BLOCK M3** |
| M4-RULE-LUCK-CYCLE-001 | 대운 起運/순역/교운 | time basis, gender/sex-policy sensitivity and school differences | clock precision, relative term boundary, day/hour/year denominators | birth exactly at term minute, early/late time, unspecified sex | **RESEARCH ONLY** |
| U2-RULE-NARRATIVE-ASSERTION-001 | personality, future outcome narratives | cultural storytelling; scientific validation absent | risk of medical/financial/relationship deterministic advice | claim trace to underlying fact and user-visible non-efficacy caveat | **DON'T PROMOTE** |

## A portable rule-record drafting template

```yaml
ruleId: M2-RULE-XXXX-001
version: "0.1.0-draft"
domain: chart-facts
title: "<명리 용어>"
status: RESEARCH_ONLY                 # not an executable enum
codeability: CONDITIONAL             # EXACT | CONDITIONAL | INTERPRETIVE
disputeStatus: SCHOOL_DEPENDENT      # STABLE | SCHOOL_DEPENDENT | SOURCE_CONFLICT | UNVERIFIED
evidenceLayer: CLASSICAL_BASE_TEXT
sourceIds: []                         # an exact book chapter, edition or site
preconditions: []
effect: "RAW_MEMBERSHIP_ONLY"         # no inferred 化局, 吉凶 or strength
exceptions: []
boundaryConditions: []
policyId: null                       # REQUIRED before any disputed implementation
testVectorIds: []
adversarialCounterexampleIds: []
licenseStatus: UNVERIFIED             # proposal field: don't mistake classic public domain for web edition copyright clearance
reviewerDecision: PENDING
```

This template is a **planning extension** of the existing schema, not a claim that runtime `RuleRecord` types already support its additional fields.

## Research order without executable dependencies

1. Review the **same classical text in two independently digitized editions**; record variants instead of deciding by popularity.
2. For every school-dependent exception, record an alternate possible output and an explicit refusal/default behavior. Annotate which distinctions are factual, traditional lookup or interpretation.
3. Define exact **failure/counterexample** vectors before writing rule code: duplicates, boundary minutes, unexpected interactions and source conflict.
4. Disallow retroactive reinterpretation of already verified M1 calendar output by M3/M4 resolvers.
5. Only an approved explicit school profile can yield an executable resolver. Any unsupported profile must fail closed.
6. Store research in `docs/research`, not executable `src` while Actions quota is unavailable.

Primary classical source discussed in previous G7 record: https://www.donglishuzhai.net/chapter/5619.html ; source-specific detail in `M2_HIDDEN_STEM_SOURCE_GATE.md`, `M2_RAW_BRANCH_RELATIONS_SOURCE_GATE.md`, `M2_TRIAD_MEMBERSHIP_SOURCE_GATE.md`. Future references should not cite a modern summary as an edition-verified ancient primary text.
