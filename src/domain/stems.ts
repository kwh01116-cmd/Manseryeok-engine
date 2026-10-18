export const HEAVENLY_STEMS = Object.freeze([
  "甲", "乙", "丙", "丁", "戊", "己", "庚", "辛", "壬", "癸",
] as const);

export type HeavenlyStem = (typeof HEAVENLY_STEMS)[number];

export const FIVE_ELEMENTS = Object.freeze(["WOOD", "FIRE", "EARTH", "METAL", "WATER"] as const);
export type FiveElement = (typeof FIVE_ELEMENTS)[number];

export const YIN_YANG = Object.freeze(["YANG", "YIN"] as const);
export type YinYang = (typeof YIN_YANG)[number];

export interface StemNature {
  readonly element: FiveElement;
  readonly polarity: YinYang;
}

export const STEM_NATURE: Readonly<Record<HeavenlyStem, StemNature>> = Object.freeze({
  甲: Object.freeze({ element: "WOOD", polarity: "YANG" }),
  乙: Object.freeze({ element: "WOOD", polarity: "YIN" }),
  丙: Object.freeze({ element: "FIRE", polarity: "YANG" }),
  丁: Object.freeze({ element: "FIRE", polarity: "YIN" }),
  戊: Object.freeze({ element: "EARTH", polarity: "YANG" }),
  己: Object.freeze({ element: "EARTH", polarity: "YIN" }),
  庚: Object.freeze({ element: "METAL", polarity: "YANG" }),
  辛: Object.freeze({ element: "METAL", polarity: "YIN" }),
  壬: Object.freeze({ element: "WATER", polarity: "YANG" }),
  癸: Object.freeze({ element: "WATER", polarity: "YIN" }),
});
