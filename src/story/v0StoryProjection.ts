import { STEM_NATURE } from "../domain/stems.js";
import { BRANCH_NATURE } from "../domain/branches.js";
import type { KoreanBirthChartPreviewResult, KoreanGanZhiLabel } from "../calendar/koreanBirthPreview.js";

/** A presentation contract, not another pillar resolver or an interpretation. */
export const V0_STORY_SCHEMA_VERSION = "u0-story-projection-v1" as const;

type PillarRole = "year" | "month" | "day" | "hour";
type PillarRef = `preview.candidates[${number}].${PillarRole}`;

export interface V0PillarBeat {
  readonly type: "FOUR_PILLARS";
  readonly pillars: readonly {
    readonly role: PillarRole;
    readonly factRef: PillarRef;
    readonly label: KoreanGanZhiLabel;
  }[];
}
export interface V0DayStemBeat {
  readonly type: "DAY_STEM_CLASSIFICATION";
  readonly factRef: `preview.candidates[${number}].day.stem`;
  readonly stem: KoreanGanZhiLabel["stem"];
  readonly element: (typeof STEM_NATURE)[KoreanGanZhiLabel["stem"]]["element"];
  readonly polarity: (typeof STEM_NATURE)[KoreanGanZhiLabel["stem"]]["polarity"];
}
export interface V0MonthBranchBeat {
  readonly type: "MONTH_BRANCH_CLASSIFICATION";
  readonly factRef: `preview.candidates[${number}].month.branch`;
  readonly branch: KoreanGanZhiLabel["branch"];
  readonly principalElement: (typeof BRANCH_NATURE)[KoreanGanZhiLabel["branch"]]["principalElement"];
}
export interface V0CandidateStory {
  readonly candidateIndex: number;
  readonly beats: readonly [V0PillarBeat, V0DayStemBeat, V0MonthBranchBeat];
}
export type V0StoryProjection =
  | { readonly schemaVersion: typeof V0_STORY_SCHEMA_VERSION; readonly status: "BLOCKED";
      readonly reason: "OUT_OF_COVERAGE" | "INVALID_LUNAR_DATE";
      readonly candidates: readonly []; }
  | { readonly schemaVersion: typeof V0_STORY_SCHEMA_VERSION; readonly status: "READY";
      readonly sourcePreviewVersion: "v0-korean-birth-chart-preview-v1";
      readonly locale: "ko-KR";
      readonly evidenceClass: "CALCULATED_CLASSIFICATION_ONLY";
      readonly confidenceScope: "PUBLISHED_MINUTE_COMPARISON_ONLY";
      readonly coverage: { readonly validation: "STRUCTURAL_COVERAGE_ONLY";
        readonly supportedFromInclusive: string; readonly supportedUntilExclusive: string; };
      readonly policies: {
        readonly timeBasis: "KOREAN_CIVIL_TIME";
        readonly dayRollover: string;
        readonly hourStemReference: string;
      };
      readonly candidateDisplay: "ONE" | "SHOW_ALL_BOUNDARY_CANDIDATES";
      readonly candidates: readonly V0CandidateStory[]; };

/**
 * U0: project only verified V0 output into ordered, source-addressable facts.
 * No season, personality, strength or prognostic interpretation is inferred.
 * A minute-boundary candidate set is never collapsed or cross-multiplied.
 */
export function projectKoreanV0Story(result: KoreanBirthChartPreviewResult): V0StoryProjection {
  if (result.status !== "OK") {
    return { schemaVersion: V0_STORY_SCHEMA_VERSION, status: "BLOCKED", reason: result.status, candidates: [] };
  }
  const chart = result.preview;
  if (chart.schemaVersion !== "v0-korean-birth-chart-preview-v1" ||
      chart.locale !== "ko-KR" ||
      chart.coverage.validation !== "STRUCTURAL_COVERAGE_ONLY" ||
      chart.confidenceScope !== "PUBLISHED_MINUTE_COMPARISON_ONLY" ||
      chart.policies.timeBasis !== "KOREAN_CIVIL_TIME") {
    throw new RangeError("Unsupported chart provenance or policy for story projection.");
  }
  const boundary = chart.confidence === "PUBLISHED_MINUTE_AMBIGUOUS";
  if (chart.candidates.length !== (boundary ? 2 : 1)) {
    throw new RangeError("Inconsistent published-minute candidate set.");
  }
  const roles = ["year", "month", "day", "hour"] as const;
  const candidates: V0CandidateStory[] = chart.candidates.map((candidate, i) => {
    const dayNature = STEM_NATURE[candidate.day.stem];
    const monthNature = BRANCH_NATURE[candidate.month.branch];
    if (!dayNature || !monthNature) throw new RangeError("Missing deterministic nature for chart fact.");
    const pillars = roles.map((role) => ({
      role, factRef: `preview.candidates[${i}].${role}` as PillarRef,
      label: { ...candidate[role] },
    }));
    return {
      candidateIndex: i,
      beats: [
        { type: "FOUR_PILLARS", pillars },
        { type: "DAY_STEM_CLASSIFICATION", factRef: `preview.candidates[${i}].day.stem`,
          stem: candidate.day.stem, element: dayNature.element, polarity: dayNature.polarity },
        { type: "MONTH_BRANCH_CLASSIFICATION", factRef: `preview.candidates[${i}].month.branch`,
          branch: candidate.month.branch, principalElement: monthNature.principalElement },
      ],
    };
  });
  return {
    schemaVersion: V0_STORY_SCHEMA_VERSION, status: "READY",
    sourcePreviewVersion: chart.schemaVersion, locale: chart.locale,
    evidenceClass: "CALCULATED_CLASSIFICATION_ONLY",
    confidenceScope: chart.confidenceScope,
    coverage: {
      validation: chart.coverage.validation,
      supportedFromInclusive: chart.coverage.supportedFromInclusive,
      supportedUntilExclusive: chart.coverage.supportedUntilExclusive,
    },
    policies: { ...chart.policies },
    candidateDisplay: boundary ? "SHOW_ALL_BOUNDARY_CANDIDATES" : "ONE",
    candidates,
  };
}
