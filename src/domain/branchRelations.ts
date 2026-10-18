import { EARTHLY_BRANCHES, type EarthlyBranch } from "./branches.js";

/**
 * Source-labeled raw pair membership only. This does not establish transformation,
 * operative force, benefit/harm, seasonality or any future prediction.
 *
 * Punishment (刑) is directional in the classical cycles; reverse input is
 * reported as RIGHT_TO_LEFT instead of being silently made symmetric.
 * Self-punishment requires TWO DISTINCT pillar occurrences (i < j).
 */
export const BRANCH_RELATIONS_POLICY_V1 =
  "M2-BRANCH-RELATIONS-YHZP-PAIRS-LIUPO-2026-V1" as const;
export type BranchRelationsPolicyId = typeof BRANCH_RELATIONS_POLICY_V1;

export const BRANCH_RELATION_KINDS = Object.freeze([
  "LIUHE", "LIUCHONG", "LIUHAI", "LIUPO", "XING",
] as const);
export type BranchRelationKind = typeof BRANCH_RELATION_KINDS[number];
export type BranchRelationOrientation =
  | "SYMMETRIC" | "LEFT_TO_RIGHT" | "RIGHT_TO_LEFT"
  | "BIDIRECTIONAL" | "SELF_BETWEEN_OCCURRENCES";

export interface BranchRelationRule {
  readonly ruleId: string;
  readonly sourceIds: readonly string[];
  readonly codeability: "CONDITIONAL";
  readonly disputeStatus: "SCHOOL_DEPENDENT";
  readonly evidenceLayer: "CLASSICAL_BASE_TEXT" | "MODERN_HEURISTIC";
  readonly policyId: BranchRelationsPolicyId;
  readonly meaning: "RAW_PAIR_MEMBERSHIP_ONLY";
}

const classical = (ruleId: string, sourceId: string): BranchRelationRule =>
  Object.freeze({
    ruleId, sourceIds: Object.freeze([sourceId]),
    codeability: "CONDITIONAL" as const,
    disputeStatus: "SCHOOL_DEPENDENT" as const,
    evidenceLayer: "CLASSICAL_BASE_TEXT" as const,
    policyId: BRANCH_RELATIONS_POLICY_V1,
    meaning: "RAW_PAIR_MEMBERSHIP_ONLY" as const,
  });

export const BRANCH_RELATION_RULES: Readonly<Record<BranchRelationKind, BranchRelationRule>> =
  Object.freeze({
    LIUHE: classical("M2-RULE-BRANCH-LIUHE-001", "CLASSIC-YUANHAI-ZIPING-LIUHE"),
    LIUCHONG: classical("M2-RULE-BRANCH-LIUCHONG-001", "CLASSIC-YUANHAI-ZIPING-XIANGCHONG"),
    LIUHAI: classical("M2-RULE-BRANCH-LIUHAI-001", "CLASSIC-YUANHAI-ZIPING-XIANGCHUAN"),
    LIUPO: Object.freeze({
      ruleId: "M2-RULE-BRANCH-LIUPO-001",
      sourceIds: Object.freeze(["MODERN-CLARIFYHK-LIUPO-LIUREN-COMPARISON-2026"]),
      codeability: "CONDITIONAL" as const,
      disputeStatus: "SCHOOL_DEPENDENT" as const,
      evidenceLayer: "MODERN_HEURISTIC" as const,
      policyId: BRANCH_RELATIONS_POLICY_V1,
      meaning: "RAW_PAIR_MEMBERSHIP_ONLY" as const,
    }),
    XING: classical("M2-RULE-BRANCH-XING-001", "CLASSIC-YUANHAI-ZIPING-XIANGXING"),
  });

type Pair = readonly [EarthlyBranch, EarthlyBranch];

// Independently versioned pair tables. NO conditional suppression when a pair
// belongs to two or more classes (e.g. 巳申 is 合 + 破 + 刑).
const SYMMETRIC_PAIRS: Readonly<Record<"LIUHE" | "LIUCHONG" | "LIUHAI" | "LIUPO", readonly Pair[]>> = {
  LIUHE: [
    ["子","丑"], ["寅","亥"], ["卯","戌"], ["辰","酉"], ["巳","申"], ["午","未"],
  ],
  LIUCHONG: [
    ["子","午"], ["丑","未"], ["寅","申"], ["卯","酉"], ["辰","戌"], ["巳","亥"],
  ],
  LIUHAI: [
    ["子","未"], ["丑","午"], ["寅","巳"], ["卯","辰"], ["申","亥"], ["酉","戌"],
  ],
  LIUPO: [
    ["子","酉"], ["丑","辰"], ["寅","亥"], ["卯","午"], ["巳","申"], ["未","戌"],
  ],
};

const DIRECTED_XING: readonly Pair[] = [
  ["寅","巳"], ["巳","申"], ["申","寅"],
  ["丑","戌"], ["戌","未"], ["未","丑"],
];
const BIDIRECTIONAL_XING: Pair = ["子","卯"];
const SELF_XING: readonly EarthlyBranch[] = ["辰","午","酉","亥"];

export interface BranchRelationHit {
  readonly kind: BranchRelationKind;
  readonly ruleId: string;
  readonly sourceIds: readonly string[];
  readonly orientation: BranchRelationOrientation;
  readonly status: "RAW_PAIR_MEMBERSHIP_ONLY";
}

/** A pair lookup is a hypothesis about *two occurrences*, not one branch alone. */
export function branchRelationsBetween(
  left: EarthlyBranch,
  right: EarthlyBranch,
  policyId: BranchRelationsPolicyId,
): readonly BranchRelationHit[] {
  if (policyId !== BRANCH_RELATIONS_POLICY_V1) {
    throw new RangeError("Explicit supported branch relation policy required.");
  }
  if (!EARTHLY_BRANCHES.includes(left) || !EARTHLY_BRANCHES.includes(right)) {
    throw new RangeError("Unsupported earthly branch in relation query.");
  }
  const found: BranchRelationHit[] = [];
  const add = (kind: BranchRelationKind, orientation: BranchRelationOrientation): void => {
    const rule = BRANCH_RELATION_RULES[kind];
    found.push(Object.freeze({
      kind, ruleId: rule.ruleId, sourceIds: rule.sourceIds,
      orientation, status: "RAW_PAIR_MEMBERSHIP_ONLY",
    }));
  };
  for (const kind of ["LIUHE", "LIUCHONG", "LIUHAI", "LIUPO"] as const) {
    if (SYMMETRIC_PAIRS[kind].some(([a,b]) =>
      (left === a && right === b) || (left === b && right === a))) {
      add(kind, "SYMMETRIC");
    }
  }
  if (left === right) {
    if (SELF_XING.includes(left)) add("XING", "SELF_BETWEEN_OCCURRENCES");
  } else if ([left,right].every(x => BIDIRECTIONAL_XING.includes(x))) {
    add("XING", "BIDIRECTIONAL");
  } else {
    const direct = DIRECTED_XING.find(([a,b]) => a === left && b === right);
    const reverse = DIRECTED_XING.find(([a,b]) => a === right && b === left);
    if (direct) add("XING", "LEFT_TO_RIGHT");
    else if (reverse) add("XING", "RIGHT_TO_LEFT");
  }
  return Object.freeze(found);
}

export interface FourPillarBranchRelation extends BranchRelationHit {
  readonly leftPillarIndex: number;
  readonly rightPillarIndex: number;
  readonly leftBranch: EarthlyBranch;
  readonly rightBranch: EarthlyBranch;
}

/**
 * Exactly four independent pillar occurrences in year/month/day/hour order.
 * Uses i < j: repeated 辰 in ONE pillar alone never creates 辰辰 self-punishment.
 * All 6 unordered position pairs are inspected, not only adjacent pillars.
 */
export function collectFourPillarBranchRelations(
  branches: readonly [EarthlyBranch,EarthlyBranch,EarthlyBranch,EarthlyBranch],
  policyId: BranchRelationsPolicyId,
): readonly FourPillarBranchRelation[] {
  if (policyId !== BRANCH_RELATIONS_POLICY_V1) {
    throw new RangeError("Explicit supported branch relation policy required.");
  }
  if (!Array.isArray(branches) || branches.length !== 4 ||
      branches.some(branch => !EARTHLY_BRANCHES.includes(branch))) {
    throw new RangeError("Four valid year/month/day/hour branches are required.");
  }
  const facts: FourPillarBranchRelation[] = [];
  for (let i=0;i<4;i++) for (let j=i+1;j<4;j++) {
    for (const hit of branchRelationsBetween(branches[i]!,branches[j]!,policyId)) {
      facts.push(Object.freeze({
        ...hit,
        leftPillarIndex:i,
        rightPillarIndex:j,
        leftBranch:branches[i]!,
        rightBranch:branches[j]!,
      }));
    }
  }
  return Object.freeze(facts);
}
