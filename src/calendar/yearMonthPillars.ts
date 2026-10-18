import type { GanZhi } from "../domain/sexagenary.js";
import type { EarthlyBranch } from "../domain/branches.js";
import type { SolarTermEvent } from "./solarTerms.js";
import {
  MONTH_BOUNDARY_JIE, monthPillarFromYearStem, resolveMonthBranchAtJie,
  type MonthBoundaryJie, type MonthBranchResolution,
} from "./monthPillar.js";
import { resolveYearPillarAtLichun } from "./yearPillar.js";

export type YearMonthConfidence = "DEFINITE" | "PUBLISHED_MINUTE_AMBIGUOUS";

export interface YearMonthCandidate {
  readonly year: GanZhi;
  readonly month: GanZhi;
}

/** Snapshot of a resolver-used event; source IDs are attribution, not certification. */
export interface AppliedJieEventV1 {
  readonly term: MonthBoundaryJie;
  readonly displayedDateTime: string;
  readonly timeBasis: "KST";
  readonly sourcePrecision: "MINUTE";
  readonly sourceIds: readonly string[];
}

export interface MonthBoundaryCandidateContextV1 {
  readonly candidateIndex: number;
  readonly monthBranch: EarthlyBranch;
  readonly boundarySide: "DEFINITE" | "BEFORE_PUBLISHED_MINUTE" | "AFTER_PUBLISHED_MINUTE";
  readonly activeSince: AppliedJieEventV1;
}

/** Internal S1 trace. Preview fact refs and presentation metadata belong to later adapters. */
export interface MonthBoundaryTraceV1 {
  readonly schemaVersion: "m1-month-boundary-trace-v1";
  readonly confidence: YearMonthConfidence;
  readonly candidateContexts: readonly MonthBoundaryCandidateContextV1[];
  readonly atPublishedBoundary?: AppliedJieEventV1;
}

export interface YearMonthResolution {
  readonly candidates: readonly YearMonthCandidate[];
  readonly confidence: YearMonthConfidence;
  readonly monthBoundaryTrace?: MonthBoundaryTraceV1;
}

function copyAppliedJie(event: SolarTermEvent): AppliedJieEventV1 {
  if (!(MONTH_BOUNDARY_JIE as readonly string[]).includes(event.term) ||
      event.timeBasis !== "KST" || event.sourcePrecision !== "MINUTE") {
    throw new Error("applied Jie evidence requires a KST MINUTE month-boundary event");
  }
  // Validate the copied array too: spreading makes sparse entries explicit.
  const sourceIds = Array.isArray(event.sourceIds) ? [...event.sourceIds] : [];
  if (sourceIds.length === 0 ||
      sourceIds.some(id => typeof id !== "string" || id.trim().length === 0)) {
    throw new Error("applied Jie evidence requires nonempty event source IDs");
  }
  return Object.freeze({
    term: event.term as MonthBoundaryJie,
    displayedDateTime: event.displayedDateTime,
    timeBasis: "KST",
    sourcePrecision: "MINUTE",
    sourceIds: Object.freeze(sourceIds),
  });
}

function traceMonthBoundary(month: MonthBranchResolution): MonthBoundaryTraceV1 {
  const activeSince = copyAppliedJie(month.activeJieBeforeBoundary);
  const before = Object.freeze({
    candidateIndex: 0,
    monthBranch: month.branchBeforeBoundary,
    boundarySide: month.confidence === "DEFINITE" ? "DEFINITE" : "BEFORE_PUBLISHED_MINUTE",
    activeSince,
  } as const);
  if (month.confidence === "DEFINITE") {
    return Object.freeze({
      schemaVersion: "m1-month-boundary-trace-v1",
      confidence: month.confidence,
      candidateContexts: Object.freeze([before]),
    });
  }
  if (!month.boundaryJie) throw new Error("ambiguous month resolution is missing a boundary Jie");
  const boundary = copyAppliedJie(month.boundaryJie);
  return Object.freeze({
    schemaVersion: "m1-month-boundary-trace-v1",
    confidence: month.confidence,
    candidateContexts: Object.freeze([before, Object.freeze({
      candidateIndex: 1,
      monthBranch: month.branchAfterBoundary,
      boundarySide: "AFTER_PUBLISHED_MINUTE",
      activeSince: boundary,
    } as const)]),
    atPublishedBoundary: boundary,
  });
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
  const monthBoundaryTrace = traceMonthBoundary(month);

  if (year.confidence === "DEFINITE" && month.confidence === "DEFINITE") {
    if (!year.selected || !month.selected) throw new Error("definite pillar resolution is missing a selected value");
    return {
      confidence: "DEFINITE",
      monthBoundaryTrace,
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
      monthBoundaryTrace,
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
    monthBoundaryTrace,
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
