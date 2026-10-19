import { deriveM2ChartFactsV2, type M2CandidateFactsV2,
  type M2ChartFactsV2Result } from "./chartFactsV2.js";
import { TRIAD_DEFINITIONS, TRIAD_MEMBERSHIP_POLICY_V1, TRIAD_RULES,
  collectFourPillarTriadMemberships,
  type FourPillarTriadMembership, type TriadMemberPresence,
  type TriadMembershipPolicyId } from "../domain/triadMemberships.js";
import type { BranchRelationsPolicyId } from "../domain/branchRelations.js";
import type { HiddenStemPolicyId } from "../domain/hiddenStems.js";
import type { KoreanBirthChartPreviewResult } from "../calendar/koreanBirthPreview.js";

export const M2_CHART_FACTS_V3_SCHEMA = "m2-chart-facts-v3" as const;
export const M2_CHART_FACTS_V3_RULE_ID = "M2-RULE-CHART-FACTS-003" as const;

type ReadyV2 = Extract<M2ChartFactsV2Result,{readonly status:"READY"}>;
type BlockedV2 = Extract<M2ChartFactsV2Result,{readonly status:"BLOCKED"}>;
type FourRole = M2CandidateFactsV2["pillars"][number]["role"];
type FourRef = M2CandidateFactsV2["pillars"][number]["factRef"];

export interface M2TriadMemberEvidence extends TriadMemberPresence {
  readonly pillarRoles: readonly FourRole[];
  /** Exact references for all appearances of this member. */
  readonly pillarFactRefs: readonly FourRef[];
}
export interface M2TriadEvidence extends Omit<FourPillarTriadMembership,"members"> {
  readonly members: readonly [
    M2TriadMemberEvidence,M2TriadMemberEvidence,M2TriadMemberEvidence
  ];
}
export interface M2CandidateFactsV3 extends M2CandidateFactsV2 {
  /** Informational member presence; never a claim of activated 化局. */
  readonly triadMemberships: readonly M2TriadEvidence[];
}

export type M2ChartFactsV3Result =
  | (Omit<BlockedV2,"schemaVersion"> & {
      readonly schemaVersion: typeof M2_CHART_FACTS_V3_SCHEMA; })
  | (Omit<ReadyV2,"schemaVersion" | "ruleId" | "sourceRuleIds" | "candidates"> & {
      readonly schemaVersion: typeof M2_CHART_FACTS_V3_SCHEMA;
      readonly ruleId: typeof M2_CHART_FACTS_V3_RULE_ID;
      readonly sourceRuleIds: readonly string[];
      readonly triadMembershipPolicyId: TriadMembershipPolicyId;
      readonly triadMembershipRuleIds: readonly string[];
      readonly triadMembershipPolicySourceIds: readonly string[];
      readonly candidates: readonly M2CandidateFactsV3[];
    });

/**
 * Explicit V1(hidden-stems) + V2(pair-relations) + V3(triad members) upgrade.
 * Generic input is assumed trusted; use deriveTrustedM2ChartFactsV3 for the
 * fixed Lab execution/fixture boundary, not arbitrary self-declared provenance.
 * No calendar recomputation, inferred missing branch, source smoothing,
 * school choice default, true transformation or predictive interpretation.
 */
export function deriveM2ChartFactsV3(
  birth: KoreanBirthChartPreviewResult,
  hiddenStemPolicyId: HiddenStemPolicyId,
  branchRelationsPolicyId: BranchRelationsPolicyId,
  triadMembershipPolicyId: TriadMembershipPolicyId,
): M2ChartFactsV3Result {
  if (triadMembershipPolicyId !== TRIAD_MEMBERSHIP_POLICY_V1) {
    throw new RangeError("An explicit supported M2 triad membership policy is required.");
  }
  const v2=deriveM2ChartFactsV2(birth,hiddenStemPolicyId,branchRelationsPolicyId);
  if (v2.status==="BLOCKED") {
    return Object.freeze({
      schemaVersion:M2_CHART_FACTS_V3_SCHEMA,
      status:"BLOCKED",
      reason:v2.reason,
      candidates:v2.candidates,
    });
  }
  const candidates: readonly M2CandidateFactsV3[] = Object.freeze(v2.candidates.map(candidate => {
    const branches = [
      candidate.pillars[0].branch,candidate.pillars[1].branch,
      candidate.pillars[2].branch,candidate.pillars[3].branch,
    ] as const;
    const triadMemberships: readonly M2TriadEvidence[] = Object.freeze(
      collectFourPillarTriadMemberships(branches,triadMembershipPolicyId).map(triad => {
        const members = triad.members.map(member => {
          const matchingPillars = member.pillarIndices.map(i => candidate.pillars[i]!);
          return Object.freeze({
            ...member,
            pillarRoles:Object.freeze(matchingPillars.map(p=>p.role)),
            pillarFactRefs:Object.freeze(matchingPillars.map(p=>p.factRef)),
          });
        }) as [
          M2TriadMemberEvidence,M2TriadMemberEvidence,M2TriadMemberEvidence
        ];
        return Object.freeze({ ...triad, members:Object.freeze(members) });
      }),
    );
    return Object.freeze({...candidate,triadMemberships});
  }));
  const triadMembershipRuleIds = Object.freeze([
    TRIAD_RULES.SANHE.ruleId,TRIAD_RULES.SANHUI.ruleId,
  ]);
  const triadMembershipPolicySourceIds = Object.freeze([...new Set([
    ...TRIAD_RULES.SANHE.sourceIds,
    ...TRIAD_RULES.SANHUI.sourceIds,
    // The modern pair categories are conditional and included only in
    // individual 2-member SANHE fact sourceIds, not as a universal rule.
    ...candidates.flatMap(candidate=>candidate.triadMemberships.flatMap(fact=>fact.sourceIds)),
  ])].sort());
  return Object.freeze({
    ...v2,
    schemaVersion:M2_CHART_FACTS_V3_SCHEMA,
    ruleId:M2_CHART_FACTS_V3_RULE_ID,
    sourceRuleIds:Object.freeze([...v2.sourceRuleIds,...triadMembershipRuleIds]),
    triadMembershipPolicyId,
    triadMembershipRuleIds,
    triadMembershipPolicySourceIds,
    candidates,
  });
}
