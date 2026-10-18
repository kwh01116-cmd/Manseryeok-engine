import { EARTHLY_BRANCHES, type EarthlyBranch } from "./branches.js";
import type { FiveElement } from "./stems.js";

/**
 * Three-member structural membership, NEVER a successful 三合/三會 化局 or
 * a strength/favorability judgement. Requires an explicit finite convention.
 */
export const TRIAD_MEMBERSHIP_POLICY_V1 =
  "M2-TRIAD-FOUR-SANHE-FOUR-SANHUI-MEMBERSHIP-V1" as const;
export type TriadMembershipPolicyId = typeof TRIAD_MEMBERSHIP_POLICY_V1;

export type TriadFamily = "SANHE" | "SANHUI";
export type TriadMemberStatus = "THREE_DISTINCT_MEMBERS" | "TWO_DISTINCT_MEMBERS";
export type SanhePartialKind =
  | "BIRTH_AND_CENTER"
  | "CENTER_AND_TOMB"
  | "BIRTH_AND_TOMB_NOT_HALF_TRINE";
export type TriadPartialKind = SanhePartialKind | "SANHUI_PARTIAL_MEMBERS" | null;

const SANHE_MEMBERSHIP_SOURCES = Object.freeze([
  "CLASSIC-YUANHAI-ZIPING-LUN-SHIERZHI-SANHE",
] as const);
const SANHUI_MEMBERSHIP_SOURCES = Object.freeze([
  "MODERN-CLARIFYHK-FOUR-SEASONAL-SANHUI-2026",
] as const);
const PARTIAL_CONVENTION_SOURCE =
  "MODERN-CLARIFYHK-SANHE-PARTIAL-MEMBER-CATEGORIES-2026" as const;

export interface TriadRule {
  readonly ruleId: string;
  readonly policyId: TriadMembershipPolicyId;
  readonly codeability: "CONDITIONAL";
  readonly disputeStatus: "SCHOOL_DEPENDENT";
  readonly evidenceLayer: "CLASSICAL_BASE_TEXT" | "MODERN_HEURISTIC";
  readonly sourceIds: readonly string[];
  readonly meaning: "PRESENCE_OF_DISTINCT_MEMBER_BRANCHES_ONLY";
}

export const TRIAD_RULES: Readonly<Record<TriadFamily, TriadRule>> = Object.freeze({
  SANHE: Object.freeze({
    ruleId: "M2-RULE-TRIAD-SANHE-MEMBERS-001",
    policyId: TRIAD_MEMBERSHIP_POLICY_V1,
    codeability: "CONDITIONAL",
    disputeStatus: "SCHOOL_DEPENDENT",
    evidenceLayer: "CLASSICAL_BASE_TEXT",
    sourceIds: SANHE_MEMBERSHIP_SOURCES,
    meaning: "PRESENCE_OF_DISTINCT_MEMBER_BRANCHES_ONLY",
  }),
  SANHUI: Object.freeze({
    ruleId: "M2-RULE-TRIAD-SANHUI-MEMBERS-001",
    policyId: TRIAD_MEMBERSHIP_POLICY_V1,
    codeability: "CONDITIONAL",
    disputeStatus: "SCHOOL_DEPENDENT",
    evidenceLayer: "MODERN_HEURISTIC",
    sourceIds: SANHUI_MEMBERSHIP_SOURCES,
    meaning: "PRESENCE_OF_DISTINCT_MEMBER_BRANCHES_ONLY",
  }),
});

export interface TriadDefinition {
  readonly id: string;
  readonly family: TriadFamily;
  readonly element: FiveElement;
  /** SANHE: 生, 旺 (center), 墓. SANHUI: seasonal branch order. */
  readonly members: readonly [EarthlyBranch,EarthlyBranch,EarthlyBranch];
}

export const TRIAD_DEFINITIONS: readonly TriadDefinition[] = Object.freeze([
  Object.freeze({ id:"SANHE_WATER",family:"SANHE",element:"WATER",
    members:Object.freeze(["申","子","辰"] as const) } as const),
  Object.freeze({ id:"SANHE_WOOD",family:"SANHE",element:"WOOD",
    members:Object.freeze(["亥","卯","未"] as const) } as const),
  Object.freeze({ id:"SANHE_FIRE",family:"SANHE",element:"FIRE",
    members:Object.freeze(["寅","午","戌"] as const) } as const),
  Object.freeze({ id:"SANHE_METAL",family:"SANHE",element:"METAL",
    members:Object.freeze(["巳","酉","丑"] as const) } as const),
  Object.freeze({ id:"SANHUI_WOOD",family:"SANHUI",element:"WOOD",
    members:Object.freeze(["寅","卯","辰"] as const) } as const),
  Object.freeze({ id:"SANHUI_FIRE",family:"SANHUI",element:"FIRE",
    members:Object.freeze(["巳","午","未"] as const) } as const),
  Object.freeze({ id:"SANHUI_METAL",family:"SANHUI",element:"METAL",
    members:Object.freeze(["申","酉","戌"] as const) } as const),
  Object.freeze({ id:"SANHUI_WATER",family:"SANHUI",element:"WATER",
    members:Object.freeze(["亥","子","丑"] as const) } as const),
]);

export interface TriadMemberPresence {
  readonly branch: EarthlyBranch;
  readonly pillarIndices: readonly number[];
}

export interface FourPillarTriadMembership {
  readonly definitionId: string;
  readonly family: TriadFamily;
  /** The element named by the traditional source, NOT transformed element. */
  readonly namedElement: FiveElement;
  readonly ruleId: string;
  readonly policyId: TriadMembershipPolicyId;
  readonly sourceIds: readonly string[];
  readonly status: TriadMemberStatus;
  readonly partialKind: TriadPartialKind;
  readonly distinctMemberCount: 2 | 3;
  /** Every original member, including missing members with [] occurrences. */
  readonly members: readonly [TriadMemberPresence,TriadMemberPresence,TriadMemberPresence];
  readonly missingBranches: readonly EarthlyBranch[];
  readonly evidenceClass: "RAW_MEMBERSHIP_ONLY";
}

function partialKind(
  definition: TriadDefinition,
  present: readonly boolean[],
): TriadPartialKind {
  if (present.every(Boolean)) return null;
  if (definition.family === "SANHUI") return "SANHUI_PARTIAL_MEMBERS";
  // SANHE positions are 生→旺→墓. Do not call 生+墓 a qualified 半合.
  if (present[0] && present[1]) return "BIRTH_AND_CENTER";
  if (present[1] && present[2]) return "CENTER_AND_TOMB";
  return "BIRTH_AND_TOMB_NOT_HALF_TRINE";
}

/**
 * Only the four native year/month/day/hour branch OCCURRENCES count.
 * At least two DISTINCT members are needed for an output. Three repeated 子
 * pillars do not constitute 申子辰; additional duplicate members are retained
 * as separate positions but never over-counted toward completion.
 */
export function collectFourPillarTriadMemberships(
  branches: readonly [EarthlyBranch,EarthlyBranch,EarthlyBranch,EarthlyBranch],
  policyId: TriadMembershipPolicyId,
): readonly FourPillarTriadMembership[] {
  if (policyId !== TRIAD_MEMBERSHIP_POLICY_V1) {
    throw new RangeError("Explicit supported three-branch membership policy required.");
  }
  if (!Array.isArray(branches) || branches.length !== 4 ||
      branches.some(b => !EARTHLY_BRANCHES.includes(b))) {
    throw new RangeError("Exactly four valid year/month/day/hour branches required.");
  }
  const results: FourPillarTriadMembership[] = [];
  for (const definition of TRIAD_DEFINITIONS) {
    const members = definition.members.map(branch => Object.freeze({
      branch,
      pillarIndices: Object.freeze(branches.flatMap((b,i)=>b === branch ? [i] : [])),
    })) as [TriadMemberPresence,TriadMemberPresence,TriadMemberPresence];
    const seen = members.map(member => member.pillarIndices.length > 0);
    const count = seen.filter(Boolean).length;
    if (count < 2) continue;
    const rule = TRIAD_RULES[definition.family];
    const complete = count === 3;
    const sources = complete || definition.family === "SANHUI"
      ? rule.sourceIds
      : Object.freeze([...rule.sourceIds, PARTIAL_CONVENTION_SOURCE]);
    results.push(Object.freeze({
      definitionId: definition.id,
      family: definition.family,
      namedElement: definition.element,
      ruleId: rule.ruleId,
      policyId,
      sourceIds: sources,
      status: complete ? "THREE_DISTINCT_MEMBERS" : "TWO_DISTINCT_MEMBERS",
      partialKind: partialKind(definition,seen),
      distinctMemberCount: count as 2 | 3,
      members: Object.freeze(members),
      missingBranches: Object.freeze(members.filter(m=>m.pillarIndices.length === 0).map(m=>m.branch)),
      evidenceClass: "RAW_MEMBERSHIP_ONLY",
    }));
  }
  return Object.freeze(results);
}

// Invalid source-table edits must be rejected at import instead of leaking into
// all downstream chart facts, including a wrong center position.
if (TRIAD_DEFINITIONS.length !== 8 ||
    new Set(TRIAD_DEFINITIONS.map(d => d.id)).size !== 8 ||
    TRIAD_DEFINITIONS.some(d => new Set(d.members).size !== 3 ||
      d.members.some(b=>!EARTHLY_BRANCHES.includes(b)))) {
  throw new Error("Corrupt versioned triad membership table.");
}
