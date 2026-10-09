import type { GanZhi } from "../domain/sexagenary.js";
import type { SolarTermEvent } from "./solarTerms.js";
import { monthPillarFromYearStem, resolveMonthBranchAtJie } from "./monthPillar.js";
import { resolveYearPillarAtLichun } from "./yearPillar.js";

export type YearMonthConfidence = "DEFINITE" | "PUBLISHED_MINUTE_AMBIGUOUS";

export interface YearMonthCandidate {
  readonly year: GanZhi;
  readonly month: GanZhi;
}

export interface YearMonthResolution {
  readonly candidates: readonly YearMonthCandidate[];
  readonly confidence: YearMonthConfidence;
}

/**
 * Compose year/month pillars without destroying correlation at a shared
 * Lichun boundary. A minute-precision Lichun yields exactly two temporally
 * possible states (before/before and after/after), never a 2x2 Cartesian set.
 */
export function resolveYearMonthPillars(
  events: readonly SolarTermEvent[],
  displayedDateTime: string,
): YearMonthResolution {
  const year = resolveYearPillarAtLichun(events, displayedDateTime);
  const month = resolveMonthBranchAtJie(events, displayedDateTime);

  if (year.confidence === "DEFINITE" && month.confidence === "DEFINITE") {
    if (!year.selected || !month.selected) throw new Error("definite pillar resolution is missing a selected value");
    return {
      confidence: "DEFINITE",
      candidates: [{
        year: year.selected,
        month: monthPillarFromYearStem(year.selected.stem, month.selected),
      }],
    };
  }

  if (year.confidence === "PUBLISHED_MINUTE_AMBIGUOUS") {
    if (
      month.confidence !== "PUBLISHED_MINUTE_AMBIGUOUS" ||
      month.boundaryJie?.term !== "LICHUN" ||
      month.boundaryJie.displayedDateTime !== year.lichun.displayedDateTime
    ) {
      throw new Error("Lichun year ambiguity must align with the month-boundary ambiguity");
    }
    return {
      confidence: "PUBLISHED_MINUTE_AMBIGUOUS",
      candidates: [
        {
          year: year.pillarBeforeBoundary,
          month: monthPillarFromYearStem(year.pillarBeforeBoundary.stem, month.branchBeforeBoundary),
        },
        {
          year: year.pillarAfterBoundary,
          month: monthPillarFromYearStem(year.pillarAfterBoundary.stem, month.branchAfterBoundary),
        },
      ],
    };
  }

  if (!year.selected || month.confidence !== "PUBLISHED_MINUTE_AMBIGUOUS") {
    throw new Error("inconsistent year/month boundary resolution");
  }
  return {
    confidence: "PUBLISHED_MINUTE_AMBIGUOUS",
    candidates: [
      {
        year: year.selected,
        month: monthPillarFromYearStem(year.selected.stem, month.branchBeforeBoundary),
      },
      {
        year: year.selected,
        month: monthPillarFromYearStem(year.selected.stem, month.branchAfterBoundary),
      },
    ],
  };
}
