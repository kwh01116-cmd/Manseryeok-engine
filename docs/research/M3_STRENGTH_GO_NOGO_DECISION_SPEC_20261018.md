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

## 2026-11-11 owner-authorized limited seasonal classification

The owner separately authorized the opt-in M3-SEASONAL-FOUR-SEASONS-EARTH-MONTHS-DEFERRED-V01 classification: four seasonal tables for eight already-resolved saju month branches, with four earth-ending months deferred. Its RESOLVED_UNDER_POLICY is a limited traditional classification, not READY for final strength, root efficacy, commanding qi, structure, useful gods, prediction or release. This dated exception does not remove or satisfy this final interpretation/release gate. Existing structural evidence stays EVIDENCE_ONLY and finalStrength NOT_IMPLEMENTED. [Policy and observed transcription limits](M3_SEASONAL_STATE_POLICY_V01.md) · [executed evidence](../engineering/KASI_M3_SEASONAL_STATE_EXECUTION_20261111.md).

## 2026-11-12 owner-authorized selected Sili pre18 seasonal classification

The owner separately authorized M3-SEASONAL-SILI-PRE18-NOMINAL-MINUTES-V02/0.2.0. It splits the four already-resolved ending months by the exact next Sili's published minute minus 25,920 nominal minutes, with conditional alternatives under the same natal parent at B and existing M1 conditions at T. Normal eight-month classifications reuse v0.1. This completes one selected seasonal classification across twelve months when its required events exist; it is not READY for final strength, 得令, commanding qi, effective root, relation efficacy, weights, useful gods, prediction or release. Existing structural evidence remains EVIDENCE_ONLY and finalStrength NOT_IMPLEMENTED. V0.1's deferred four-month policy and all final promotion requirements remain unchanged.

[Source and implementation distinctions](M3_SEASONAL_SILI_PRE18_POLICY_V02.md) · [Actual execution, failures and test SHA](../engineering/KASI_M3_SEASONAL_SILI_EXECUTION_20261112.md).

## 2026-11-12 owner-authorized selected structural root presence

The owner separately authorized `M3-ROOT-PRESENCE-HIDDEN-SAME-ELEMENT-V01`/0.1.0: test each of the four natal visible stems against the actual members of the selected existing hidden-stem policy. `PRESENT_UNDER_POLICY` and `ABSENT_UNDER_POLICY` resolve this limited presence criterion. Exact-stem and opposite-polarity same-element evidence, all original positions, and surface resource/peer stems' own roots remain separate. Presence does not resolve root strength, damage, activation, support transmission, 得地/得勢, final strength, structure, useful gods, fortune or release. Existing structural evidence and both seasonal policies retain their contracts. This dated exception does not remove or satisfy any final interpretation/release promotion requirement.

[Selected definition and original/commentary differences](M3_ROOT_PRESENCE_POLICY_V01.md).

## 2026-11-12 owner-authorized resource adoption restriction

The owner separately authorized `M3-RESOURCE-ADJACENT-COMBINATION-HOLD-V01`/0.1.0. It consumes the existing surface resource classification and issued root presence, enumerates all natal visible five-combination partners, and holds automatic independent support adoption only for one adjacent other-stem partner with no competition and absent resource roots. Rooted adjacent pairs remain effect-unresolved; remote, multiple and competing interactions remain out of scope with every reason retained. No partner means no hold **by this rule**, including an unrooted resource. This limited decision is neither resource deletion nor complete support efficacy. Original M1/M2/M3, seasonal/root/M7 policies, `totalSupportEfficacy=NOT_EVALUATED`, `finalStrength=NOT_IMPLEMENTED` and the final interpretation/release gate are unchanged.

[Primary transcription, commentary and project decision-table distinctions](M3_RESOURCE_SUPPORT_POLICY_V01.md).

## 2026-11-12 owner-authorized limited local research synthesis

The owner now separately authorizes an opt-in, versioned local research conclusion, not just another evidence list. `M3-LIMITED-ABSENT-ROOT-RESOURCE-SYNTHESIS-V01`/0.1.0 may return `WEAK_UNDER_SELECTED_POLICY` only under its complete, closed absence conditions: declining selected season; no actual day-master hidden root or natal visible/hidden resource; no rooted visible peer; adverse-direction members present; no visible five-combination, raw branch pair or multi-member triad. This is an explicitly declared project generalization of the commentary's unrooted-peer illustrations, not an exact classical formula or a universal strength criterion. Existing limited presence/adoption results do not acquire force or efficacy meanings.

This dated permission permits the separate `researchSynthesis` and Korean report in the selected local profile. It does not change existing `finalStrength=NOT_IMPLEMENTED`, promote any existing M3 gate to READY, authorize strong/balanced classifications, replace the default engine/Lab/public path, or lift G1-P2/release/edition/rights requirements. Mixed evidence, material unimplemented effects, scope and data shortages remain distinct; deferral is not balance. See [policy, explicit assumption and source disagreements](M3_LIMITED_SYNTHESIS_POLICY_V01.md).


## 2026-11-13 owner-authorized M4 officer structural analysis

The owner separately authorized M4-ZHENGGUAN-MONTH-STRUCTURE-V01/0.1.0 to consume the existing issued M1/M2/structural M3 context and distinguish officer presence, month-order pattern candidate, observed formation-related structures, competing conditions and unresolved effects. This is not promotion of this M3 gate or permission to declare full 格成/格敗/救應, M5 helpfulness, M6 transformation or release. Existing finalStrength=NOT_IMPLEMENTED and the limited M3 absence-rule profile retain their exact contracts, including grid0 and the additional8 paths from one fixed date. A structural officer candidate may be available while strength is unresolved; a strength-dependent efficacy conclusion must remain deferred. [Selected M4 policy](M4_ZHENGGUAN_STRUCTURE_POLICY_V01.md).
