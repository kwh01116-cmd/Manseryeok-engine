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
export const BRANCH_NATURE: Readonly<Record<EarthlyBranch, BranchNature>> = {
  子: { principalElement: "WATER", polarity: "YANG" },
  丑: { principalElement: "EARTH", polarity: "YIN" },
  寅: { principalElement: "WOOD", polarity: "YANG" },
  卯: { principalElement: "WOOD", polarity: "YIN" },
  辰: { principalElement: "EARTH", polarity: "YANG" },
  巳: { principalElement: "FIRE", polarity: "YIN" },
  午: { principalElement: "FIRE", polarity: "YANG" },
  未: { principalElement: "EARTH", polarity: "YIN" },
  申: { principalElement: "METAL", polarity: "YANG" },
  酉: { principalElement: "METAL", polarity: "YIN" },
  戌: { principalElement: "EARTH", polarity: "YANG" },
  亥: { principalElement: "WATER", polarity: "YIN" },
};
