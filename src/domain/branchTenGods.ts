import { EARTHLY_BRANCHES, type EarthlyBranch } from "./branches.js";
import { HIDDEN_STEM_RULE, HIDDEN_STEM_POLICY_V1, hiddenStemsForBranch,
  type HiddenStemFact, type HiddenStemPolicyId } from "./hiddenStems.js";
import { HEAVENLY_STEMS, type HeavenlyStem } from "./stems.js";
import { tenGod, type TenGod } from "./tenGods.js";

/**
 * Branch ten-god members are computed from explicitly selected hidden stems,
 * rather than assigning one allegedly universal ten-god label to a branch.
 * MAIN_QI does not mean the strongest operative qi on any birth date.
 */
export const BRANCH_TEN_GOD_RULE_ID = "M2-RULE-BRANCH-TEN-GODS-001" as const;

export interface BranchHiddenStemTenGod extends HiddenStemFact {
  readonly tenGod: TenGod;
}

export interface BranchTenGodFacts {
  readonly ruleId: typeof BRANCH_TEN_GOD_RULE_ID;
  readonly policyId: HiddenStemPolicyId;
  readonly sourceIds: readonly string[];
  readonly dayMaster: HeavenlyStem;
  readonly branch: EarthlyBranch;
  readonly members: readonly BranchHiddenStemTenGod[];
}

export function branchTenGodFacts(
  dayMaster: HeavenlyStem,
  branch: EarthlyBranch,
  policyId: HiddenStemPolicyId,
): BranchTenGodFacts {
  if (!HEAVENLY_STEMS.includes(dayMaster)) throw new RangeError("Unsupported day master.");
  if (!EARTHLY_BRANCHES.includes(branch)) throw new RangeError("Unsupported branch.");
  if (policyId !== HIDDEN_STEM_POLICY_V1) throw new RangeError("Explicit hidden-stem policy required.");
  const members = Object.freeze(hiddenStemsForBranch(branch, policyId).map(item => Object.freeze({
    stem: item.stem,
    index: item.index,
    position: item.position,
    tenGod: tenGod(dayMaster, item.stem),
  })));
  return Object.freeze({
    ruleId: BRANCH_TEN_GOD_RULE_ID,
    policyId,
    sourceIds: HIDDEN_STEM_RULE.sourceIds,
    dayMaster, branch, members,
  });
}
