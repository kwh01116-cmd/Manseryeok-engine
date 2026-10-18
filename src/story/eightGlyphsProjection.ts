import { STEM_NATURE, type FiveElement, type HeavenlyStem } from "../domain/stems.js";
import { BRANCH_NATURE, type EarthlyBranch } from "../domain/branches.js";
import { labelKoreanGanZhi, type KoreanBirthChartPreview } from "../calendar/koreanBirthPreview.js";

type Role = "year" | "month" | "day" | "hour";
export interface EightGlyphFact {
  readonly role: Role;
  readonly kind: "STEM" | "BRANCH";
  readonly glyph: HeavenlyStem | EarthlyBranch;
  readonly hangul: string;
  readonly element: FiveElement;
  readonly factRef: `preview.candidates[${number}].${Role}.${"stem" | "branch"}`;
  readonly pillarFactRef: `preview.candidates[${number}].${Role}.hanja`;
  readonly pillarHanja: string;
  /** Existing implementation metadata reference, not a newly claimed classical rule ID. */
  readonly elementLookupRef: "src/domain/stems.ts#STEM_NATURE" | "src/domain/branches.ts#BRANCH_NATURE";
}
export interface EightGlyphsChapter {
  readonly schemaVersion: "u1-eight-glyphs-v1";
  readonly candidateIndex: number;
  readonly sourcePreviewVersion: "v0-korean-birth-chart-preview-v1";
  readonly evidenceClass: "CALCULATED_CLASSIFICATION_ONLY";
  readonly symbols: readonly EightGlyphFact[];
}

/** Label the eight supplied glyphs only; no counting, weighting or interpretation. */
export function projectEightGlyphs(
  candidate: KoreanBirthChartPreview["candidates"][number], candidateIndex: number,
): EightGlyphsChapter {
  const symbols: EightGlyphFact[] = [];
  for (const role of ["year", "month", "day", "hour"] as const) {
    const pillar = candidate[role];
    const label = labelKoreanGanZhi(pillar);
    if (pillar.hanja !== label.hanja || pillar.hangul !== label.hangul) {
      throw new RangeError("Inconsistent pillar label for eight-glyph projection.");
    }
    const pillarFactRef = `preview.candidates[${candidateIndex}].${role}.hanja` as const;
    symbols.push(Object.freeze({
      role, kind: "STEM", glyph: label.stem, hangul: label.hangul[0]!,
      element: STEM_NATURE[label.stem].element,
      factRef: `preview.candidates[${candidateIndex}].${role}.stem`,
      pillarFactRef, pillarHanja: label.hanja, elementLookupRef: "src/domain/stems.ts#STEM_NATURE",
    }), Object.freeze({
      role, kind: "BRANCH", glyph: label.branch, hangul: label.hangul[1]!,
      element: BRANCH_NATURE[label.branch].principalElement,
      factRef: `preview.candidates[${candidateIndex}].${role}.branch`,
      pillarFactRef, pillarHanja: label.hanja, elementLookupRef: "src/domain/branches.ts#BRANCH_NATURE",
    }));
  }
  return Object.freeze({
    schemaVersion: "u1-eight-glyphs-v1", candidateIndex,
    sourcePreviewVersion: "v0-korean-birth-chart-preview-v1",
    evidenceClass: "CALCULATED_CLASSIFICATION_ONLY", symbols: Object.freeze(symbols),
  });
}
