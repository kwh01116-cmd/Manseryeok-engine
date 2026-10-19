import {
  deriveM2ChartFacts, type M2CandidateFacts, type M2ChartFactsResult,
} from "./chartFactsV1.js";
import {
  BRANCH_RELATION_KINDS, BRANCH_RELATION_RULES, BRANCH_RELATIONS_POLICY_V1,
  collectFourPillarBranchRelations,
  type BranchRelationsPolicyId, type FourPillarBranchRelation,
} from "../domain/branchRelations.js";
import type { HiddenStemPolicyId } from "../domain/hiddenStems.js";
import type { KoreanBirthChartPreviewResult } from "../calendar/koreanBirthPreview.js";

export const M2_CHART_FACTS_V2_SCHEMA = "m2-chart-facts-v2" as const;
export const M2_CHART_FACTS_V2_RULE_ID = "M2-RULE-CHART-FACTS-002" as const;

const ROLES = ["year","month","day","hour"] as const;
type Role = typeof ROLES[number];
type ReadyV1 = Extract<M2ChartFactsResult,{readonly status:"READY"}>;
type BlockedV1 = Extract<M2ChartFactsResult,{readonly status:"BLOCKED"}>;

export interface M2PillarRelationEvidence extends FourPillarBranchRelation {
  readonly leftPillarRole: Role;
  readonly rightPillarRole: Role;
  readonly leftFactRef: `preview.candidates[${number}].${Role}`;
  readonly rightFactRef: `preview.candidates[${number}].${Role}`;
  /** Present only for one-direction classical Xing arcs, not symmetric cases. */
  readonly fromPillarRole?: Role;
  readonly toPillarRole?: Role;
}

export interface M2CandidateFactsV2 extends M2CandidateFacts {
  readonly branchRelations: readonly M2PillarRelationEvidence[];
}

export type M2ChartFactsV2Result =
  | (Omit<BlockedV1,"schemaVersion"> & {
      readonly schemaVersion: typeof M2_CHART_FACTS_V2_SCHEMA; })
  | (Omit<ReadyV1,"schemaVersion" | "ruleId" | "sourceRuleIds" | "candidates"> & {
      readonly schemaVersion: typeof M2_CHART_FACTS_V2_SCHEMA;
      readonly ruleId: typeof M2_CHART_FACTS_V2_RULE_ID;
      readonly sourceRuleIds: readonly string[];
      readonly branchRelationsPolicyId: BranchRelationsPolicyId;
      readonly branchRelationRuleIds: readonly string[];
      /** All source editions of the explicitly chosen lookup policy. */
      readonly branchRelationPolicySourceIds: readonly string[];
      readonly candidates: readonly M2CandidateFactsV2[];
    });

/**
 * This opt-in upgrade enriches already verified M2 v1 candidates.
 * Generic input is assumed trusted: nonempty source IDs are not authenticated.
 * Use deriveTrustedM2ChartFactsV2 for the fixed Lab execution/fixture boundary.
 *
 * No M1 calendar recomputation, hidden-stem default, strength weighting,
 * pair suppression, three-branch completion, conflict resolution or prediction.
 * Historical source data and supported birth-year manifests are unchanged.
 */
export function deriveM2ChartFactsV2(
  input: KoreanBirthChartPreviewResult,
  hiddenStemPolicyId: HiddenStemPolicyId,
  branchRelationsPolicyId: BranchRelationsPolicyId,
): M2ChartFactsV2Result {
  if (branchRelationsPolicyId !== BRANCH_RELATIONS_POLICY_V1) {
    throw new RangeError("An explicit supported raw branch-relations policy is required.");
  }
  const v1 = deriveM2ChartFacts(input, hiddenStemPolicyId);
  if (v1.status === "BLOCKED") {
    return Object.freeze({
      schemaVersion: M2_CHART_FACTS_V2_SCHEMA,
      status: "BLOCKED",
      reason: v1.reason,
      candidates: v1.candidates,
    });
  }
  const candidates: readonly M2CandidateFactsV2[] = Object.freeze(v1.candidates.map(candidate => {
    const branches = [
      candidate.pillars[0].branch, candidate.pillars[1].branch,
      candidate.pillars[2].branch, candidate.pillars[3].branch,
    ] as const;
    const branchRelations: readonly M2PillarRelationEvidence[] = Object.freeze(
      collectFourPillarBranchRelations(branches,branchRelationsPolicyId).map(hit => {
        const leftRole = ROLES[hit.leftPillarIndex]!;
        const rightRole = ROLES[hit.rightPillarIndex]!;
        const direction = hit.orientation === "LEFT_TO_RIGHT"
          ? {fromPillarRole:leftRole,toPillarRole:rightRole}
          : hit.orientation === "RIGHT_TO_LEFT"
            ? {fromPillarRole:rightRole,toPillarRole:leftRole}
            : {};
        return Object.freeze({
          ...hit,
          leftPillarRole:leftRole,
          rightPillarRole:rightRole,
          leftFactRef:candidate.pillars[hit.leftPillarIndex]!.factRef,
          rightFactRef:candidate.pillars[hit.rightPillarIndex]!.factRef,
          ...direction,
        });
      }),
    );
    return Object.freeze({ ...candidate, branchRelations });
  }));
  const branchRelationRuleIds = Object.freeze(
    BRANCH_RELATION_KINDS.map(kind => BRANCH_RELATION_RULES[kind].ruleId),
  );
  const branchRelationPolicySourceIds = Object.freeze([...new Set(
    BRANCH_RELATION_KINDS.flatMap(kind => BRANCH_RELATION_RULES[kind].sourceIds),
  )].sort());
  return Object.freeze({
    ...v1,
    schemaVersion:M2_CHART_FACTS_V2_SCHEMA,
    ruleId:M2_CHART_FACTS_V2_RULE_ID,
    sourceRuleIds:Object.freeze([...v1.sourceRuleIds, ...branchRelationRuleIds]),
    branchRelationsPolicyId,
    branchRelationRuleIds,
    branchRelationPolicySourceIds,
    candidates,
  });
}
