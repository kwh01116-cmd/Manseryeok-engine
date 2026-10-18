import type { FiveElement, YinYang } from "./stems.js";

export const EARTHLY_BRANCHES = Object.freeze([
  "子", "丑", "寅", "卯", "辰", "巳", "午", "未", "申", "酉", "戌", "亥",
] as const);

export type EarthlyBranch = (typeof EARTHLY_BRANCHES)[number];

export interface BranchNature {
  readonly principalElement: FiveElement;
  readonly polarity: YinYang;
}

// principalElement is a deterministic classification only. Hidden-stem composition
// and seasonal strength are deliberately modeled elsewhere because those require
// provenance and, in some traditions, policy choices.
export const BRANCH_NATURE: Readonly<Record<EarthlyBranch, BranchNature>> = Object.freeze({
  子: Object.freeze({ principalElement: "WATER", polarity: "YANG" }),
  丑: Object.freeze({ principalElement: "EARTH", polarity: "YIN" }),
  寅: Object.freeze({ principalElement: "WOOD", polarity: "YANG" }),
  卯: Object.freeze({ principalElement: "WOOD", polarity: "YIN" }),
  辰: Object.freeze({ principalElement: "EARTH", polarity: "YANG" }),
  巳: Object.freeze({ principalElement: "FIRE", polarity: "YIN" }),
  午: Object.freeze({ principalElement: "FIRE", polarity: "YANG" }),
  未: Object.freeze({ principalElement: "EARTH", polarity: "YIN" }),
  申: Object.freeze({ principalElement: "METAL", polarity: "YANG" }),
  酉: Object.freeze({ principalElement: "METAL", polarity: "YIN" }),
  戌: Object.freeze({ principalElement: "EARTH", polarity: "YANG" }),
  亥: Object.freeze({ principalElement: "WATER", polarity: "YIN" }),
});
