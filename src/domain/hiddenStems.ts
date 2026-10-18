import { EARTHLY_BRANCHES, type EarthlyBranch } from "./branches.js";
import { HEAVENLY_STEMS, type HeavenlyStem } from "./stems.js";

/**
 * The classical 地支藏遁歌 enumerates MEMBERS. The first item/main-qi order
 * is an explicitly versioned modern convention, not a numerical strength.
 *
 * Classical membership: 淵海子平, 卷一「又地支藏遁歌」.
 * Ordered modern cross-check: BaziInsight, 十二地支藏干 (2026).
 */
export const HIDDEN_STEM_POLICY_V1 = "M2-HIDDEN-STEMS-CLASSIC-MEMBERS-MAINQI-V1" as const;
export type HiddenStemPolicyId = typeof HIDDEN_STEM_POLICY_V1;

export const HIDDEN_STEM_RULE = Object.freeze({
  ruleId: "M2-RULE-HIDDEN-STEMS-001",
  version: "1.0.0",
  policyId: HIDDEN_STEM_POLICY_V1,
  codeability: "CONDITIONAL",
  disputeStatus: "SCHOOL_DEPENDENT",
  evidenceLayer: "CLASSICAL_BASE_TEXT",
  sourceIds: Object.freeze([
    "CLASSIC-YUANHAI-ZIPING-DIZHI-CANGDUN-GE",
    "MODERN-BAZIINSIGHT-HIDDEN-STEMS-2026",
  ] as const),
  meaning: "BRANCH_MEMBERSHIP_AND_NAMED_MAIN_QI_ONLY",
} as const);

export type HiddenStemPosition = "MAIN_QI" | "OTHER";
export interface HiddenStemFact {
  readonly stem: HeavenlyStem;
  readonly position: HiddenStemPosition;
  /** Order is a display convention, never a strength/proportion ranking. */
  readonly index: number;
}

const NAMES: Readonly<Record<EarthlyBranch, readonly HeavenlyStem[]>> = Object.freeze({
  子: Object.freeze(["癸"] as const),
  丑: Object.freeze(["己", "癸", "辛"] as const),
  寅: Object.freeze(["甲", "丙", "戊"] as const),
  卯: Object.freeze(["乙"] as const),
  辰: Object.freeze(["戊", "乙", "癸"] as const),
  巳: Object.freeze(["丙", "庚", "戊"] as const),
  午: Object.freeze(["丁", "己"] as const),
  未: Object.freeze(["己", "丁", "乙"] as const),
  申: Object.freeze(["庚", "壬", "戊"] as const),
  酉: Object.freeze(["辛"] as const),
  戌: Object.freeze(["戊", "辛", "丁"] as const),
  亥: Object.freeze(["壬", "甲"] as const),
} as const);

export const HIDDEN_STEMS_V1: Readonly<Record<EarthlyBranch, readonly HiddenStemFact[]>> =
  Object.freeze(Object.fromEntries(EARTHLY_BRANCHES.map(branch => [
    branch, Object.freeze(NAMES[branch].map((stem, index) => Object.freeze({
      stem, index, position: index === 0 ? "MAIN_QI" : "OTHER",
    }))),
  ])) as Record<EarthlyBranch, readonly HiddenStemFact[]>);

export function hiddenStemsForBranch(
  branch: EarthlyBranch,
  policyId: HiddenStemPolicyId,
): readonly HiddenStemFact[] {
  if (policyId !== HIDDEN_STEM_POLICY_V1) {
    throw new RangeError("Explicit supported hidden-stem profile is required.");
  }
  if (!EARTHLY_BRANCHES.includes(branch)) throw new RangeError("Unsupported earthly branch.");
  return HIDDEN_STEMS_V1[branch];
}

// Validate the table itself on import, not just any consuming chart.
for (const branch of EARTHLY_BRANCHES) {
  const row = HIDDEN_STEMS_V1[branch];
  if (!row || row.length < 1 || row.length > 3 || row[0]?.position !== "MAIN_QI" ||
      new Set(row.map(item => item.stem)).size !== row.length ||
      row.some((item, index) => !HEAVENLY_STEMS.includes(item.stem) ||
        item.index !== index || item.position !== (index === 0 ? "MAIN_QI" : "OTHER"))) {
    throw new Error(`Corrupt hidden-stem lookup profile for ${branch}`);
  }
}
