# M3 interpretive strength/격국/용신 release gate — no formula authorized

**Design research only; no M3 executable rules or recommendations are approved.** Traditional saju interpretation is a cultural model rather than a scientifically validated method of predicting individual outcomes. Current stable M1/M2 facts must be treated as immutable inputs, not retrospective evidence that any interpretation is true.

## Why M2 completeness does not imply M3 readiness

M2 can identify 12 branches, hidden-stem members, ten-god labels, stem/branch positions, directional 刑, member sets for 三合/三会 and **one explicit 十二長生 school policy**. None of these alone establishes seasonal command, whether a combination transforms, whether a stem has effective root/strength, or which school of 格局 should win. E.g. 巳申 can be both 合 and 刑/破 in raw records, but deriving an outcome requires additional disputed conditions.

## Decisions that must be explicit policy fields

- **Month/season authority**: which Jie/中 minute controls 月令; if published-minute ambiguity gives two candidates, propagate both through M3 or decline with `INSUFFICIENT_PRECISION`.
- **Hidden-stem authority**: classical presence vs 季節司令 vs seasonal qi proportions. Never reuse hidden-stem display order as strength weights.
- **Yin/yang/soil interpretation**: 十二長生 `陽順陰逆` vs alternatives, 火土同宮 vs alternative earth-start profiles; all may affect derived narratives.
- **Combination activation**: raw 合/冲/刑/害/破 overlap; no implicit "合 always defeats 冲", no automatic 合化/格局 transformation.
- **Root/透干**: published rules for 通根 and 出干, overlap with day-master categories, duplicate and four-pillar position effects.
- **Scoring vs qualitative**: source for coefficients if any, calibration and uncertainty disclosure. No ad-hoc five-element sums or naive majority scoring.
- **Exception precedence**: print a deterministic, auditable precedence graph for competing classical/modern schools, do not silently choose one.
- **Output meaning**: explain this is an interpretation under selected traditional rules, never a medically, scientifically or financially reliable prediction.

## Proposed machine result (for future review only)

```ts
type M3InterpretationGate =
  | {status:"BLOCKED"; reason:"UNSELECTED_SCHOOL"|"UNVERIFIED_RULE"|"SOURCE_CONFLICT"|"INSUFFICIENT_PRECISION"|"OUT_OF_COVERAGE"}
  | {status:"READY"; schoolPolicyId:string; resolverVersion:string;
     candidateIndex:number; inputFactRefs:readonly string[];
     appliedRuleIds:readonly string[]; exceptionIds:readonly string[];
     alternatives:readonly string[]; conclusionIsTraditionalInterpretation:true};
```

A M3 gate must not put `READY` on the current M1/M2 facts; their evidence type is `TRADITIONAL_RULE_LOOKUP_ONLY` or calendar computational evidence, not interpretive confidence.

## Counterexample suite to specify before coding

| Vector | Must not happen |
| --- | --- |
| 2027 Lichun published-minute double-candidate chart | two candidate sets collapsed into one forced "strong" answer |
| 2 elementally identical charts differing in 月令 | identical strength score without month policy inspection |
| hidden-stem 3-member branch vs 1-member branch | use number of hidden stems alone as a universal strength weighting |
| 寅亥 and 巳申 overlaps | one relation silently suppresses the others |
| 2026/2027 year boundary and 2000 research-only birth | historical unsupported sources promoted into production |
| absent time, unsupported birth timezone | fabricate day/hour or fallback policy |
| two equally plausible school paradigms | report "scientifically certain" rather than policy-specific alternatives |
| adverse health/wealth/marriage narrative request | claim medical/financial diagnosis or deterministically harmful prediction |

## Required promotion record

A real source-edition reference, declared school, all policy axes, reproducible exhaustive/boundary tests, independent rule review, language/harm audit, legal rights and at least one explicit alternate-school counterexample. Since this is interpretive and contested, **tests only demonstrate adherence to an encoded tradition**, not real-world predictive validity. Default is **BLOCK M3** until sign-off. This is a hard release gate, not an invitation to build a "strength score" without sources.
