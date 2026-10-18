import { EARTHLY_BRANCHES, type EarthlyBranch } from "./branches.js";
import { HEAVENLY_STEMS, STEM_NATURE, type HeavenlyStem } from "./stems.js";

/**
 * 十二長生 is a versioned SCHOOL-DEPENDENT lookup convention.
 * This profile applies 陽順陰逆, 戊 follows 丙 and 己 follows 丁.
 * Stage names describe the traditional cycle only; never strength scores.
 */
export const TWELVE_GROWTH_POLICY_V1 = "M2-12GROWTH-YANG-FWD-YIN-REV-FIRE-EARTH-V1" as const;
export type TwelveGrowthPolicyId = typeof TWELVE_GROWTH_POLICY_V1;

export const TWELVE_GROWTH_STAGES = Object.freeze([
  "長生","沐浴","冠帶","臨官","帝旺","衰","病","死","墓","絕","胎","養",
] as const);
export type TwelveGrowthStage = (typeof TWELVE_GROWTH_STAGES)[number];

export const TWELVE_GROWTH_RULE = Object.freeze({
  ruleId:"M2-RULE-TWELVE-GROWTH-STAGES-001",
  policyId:TWELVE_GROWTH_POLICY_V1,
  version:"1.0.0",
  codeability:"CONDITIONAL",
  disputeStatus:"SCHOOL_DEPENDENT",
  evidenceLayer:"MODERN_HEURISTIC",
  sourceIds:Object.freeze([
    "MODERN-CLARIFYHK-12GROWTH-YANG-FWD-YIN-REV-2026",
    "MODERN-MINGYUNHUB-12GROWTH-ANCHORS-2026",
  ] as const),
  meaning:"TRADITIONAL_STAGE_LABEL_ONLY",
} as const);

export const TWELVE_GROWTH_ANCHORS: Readonly<Record<HeavenlyStem,EarthlyBranch>> = Object.freeze({
  甲:"亥",乙:"午",丙:"寅",丁:"酉",戊:"寅",己:"酉",庚:"巳",辛:"子",壬:"申",癸:"卯",
} as const);

export interface TwelveGrowthFact {
  readonly dayMaster: HeavenlyStem;
  readonly branch: EarthlyBranch;
  readonly stage: TwelveGrowthStage;
  readonly anchor: EarthlyBranch;
  readonly direction: "FORWARD" | "REVERSE";
  readonly policyId: TwelveGrowthPolicyId;
  readonly ruleId: typeof TWELVE_GROWTH_RULE.ruleId;
  readonly sourceIds: readonly string[];
}

export function twelveGrowthStage(
  dayMaster: HeavenlyStem,
  branch: EarthlyBranch,
  policyId: TwelveGrowthPolicyId,
): TwelveGrowthFact {
  if (policyId !== TWELVE_GROWTH_POLICY_V1) throw new RangeError("Explicit supported 12-growth policy required.");
  if (!HEAVENLY_STEMS.includes(dayMaster) || !EARTHLY_BRANCHES.includes(branch)) {
    throw new RangeError("Unsupported heavenly stem or earthly branch.");
  }
  const anchor = TWELVE_GROWTH_ANCHORS[dayMaster];
  const forward = STEM_NATURE[dayMaster].polarity === "YANG";
  const branchIndex = EARTHLY_BRANCHES.indexOf(branch);
  const anchorIndex = EARTHLY_BRANCHES.indexOf(anchor);
  const step = ((forward ? branchIndex - anchorIndex : anchorIndex - branchIndex) + 12) % 12;
  return Object.freeze({
    dayMaster, branch,
    stage: TWELVE_GROWTH_STAGES[step]!,
    anchor,
    direction: forward ? "FORWARD" : "REVERSE",
    policyId,
    ruleId: TWELVE_GROWTH_RULE.ruleId,
    sourceIds: TWELVE_GROWTH_RULE.sourceIds,
  });
}
