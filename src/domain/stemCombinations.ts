import { HEAVENLY_STEMS, type HeavenlyStem } from "./stems.js";

/** Pair membership only. A listed pair does not establish combination effects or transformation. */
export const STEM_COMBINATION_PAIRS = Object.freeze([
  Object.freeze(["甲", "己"] as const), Object.freeze(["乙", "庚"] as const),
  Object.freeze(["丙", "辛"] as const), Object.freeze(["丁", "壬"] as const),
  Object.freeze(["戊", "癸"] as const),
]);

export function stemCombinationPartner(stem: HeavenlyStem): HeavenlyStem {
  if (!HEAVENLY_STEMS.some(value => value === stem)) throw new RangeError("M3_SUPPORT_KNOWN_STEM_REQUIRED");
  for (const pair of STEM_COMBINATION_PAIRS) {
    if (pair[0] === stem) return pair[1];
    if (pair[1] === stem) return pair[0];
  }
  throw new RangeError("M3_SUPPORT_STEM_PAIR_NOT_FOUND");
}

export function areStemCombinationPartners(left: HeavenlyStem, right: HeavenlyStem): boolean {
  if (!HEAVENLY_STEMS.some(value => value === right)) throw new RangeError("M3_SUPPORT_KNOWN_STEM_REQUIRED");
  return stemCombinationPartner(left) === right;
}
