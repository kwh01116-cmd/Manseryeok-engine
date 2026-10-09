import {
  HEAVENLY_STEMS,
  STEM_NATURE,
  type FiveElement,
  type HeavenlyStem,
} from "./stems.js";

export const TEN_GODS = Object.freeze([
  "比肩", "劫財", "食神", "傷官", "偏財", "正財", "七殺", "正官", "偏印", "正印",
] as const);

export type TenGod = (typeof TEN_GODS)[number];

type ElementRelation =
  | "SAME"
  | "DAY_MASTER_GENERATES"
  | "DAY_MASTER_CONTROLS"
  | "TARGET_CONTROLS_DAY_MASTER"
  | "TARGET_GENERATES_DAY_MASTER";

const GENERATES: Readonly<Record<FiveElement, FiveElement>> = {
  WOOD: "FIRE",
  FIRE: "EARTH",
  EARTH: "METAL",
  METAL: "WATER",
  WATER: "WOOD",
};

const CONTROLS: Readonly<Record<FiveElement, FiveElement>> = {
  WOOD: "EARTH",
  FIRE: "METAL",
  EARTH: "WATER",
  METAL: "WOOD",
  WATER: "FIRE",
};

function relation(dayMaster: FiveElement, target: FiveElement): ElementRelation {
  if (dayMaster === target) return "SAME";
  if (GENERATES[dayMaster] === target) return "DAY_MASTER_GENERATES";
  if (CONTROLS[dayMaster] === target) return "DAY_MASTER_CONTROLS";
  if (CONTROLS[target] === dayMaster) return "TARGET_CONTROLS_DAY_MASTER";
  if (GENERATES[target] === dayMaster) return "TARGET_GENERATES_DAY_MASTER";

  throw new Error(`Invalid five-element relation: ${dayMaster} -> ${target}`);
}

export function tenGod(dayMaster: HeavenlyStem, target: HeavenlyStem): TenGod {
  if (!HEAVENLY_STEMS.includes(dayMaster) || !HEAVENLY_STEMS.includes(target)) {
    throw new RangeError("Unsupported heavenly stem.");
  }
  const dm = STEM_NATURE[dayMaster];
  const other = STEM_NATURE[target];
  const samePolarity = dm.polarity === other.polarity;

  switch (relation(dm.element, other.element)) {
    case "SAME":
      return samePolarity ? "比肩" : "劫財";
    case "DAY_MASTER_GENERATES":
      return samePolarity ? "食神" : "傷官";
    case "DAY_MASTER_CONTROLS":
      return samePolarity ? "偏財" : "正財";
    case "TARGET_CONTROLS_DAY_MASTER":
      return samePolarity ? "七殺" : "正官";
    case "TARGET_GENERATES_DAY_MASTER":
      return samePolarity ? "偏印" : "正印";
  }
}
