import type { GanZhi } from "../domain/sexagenary.js";
import { MONTH_BOUNDARY_JIE, MONTH_BRANCH_BY_JIE, monthPillarFromYearStem } from "./monthPillar.js";
import { solarTermDefinition, type SolarTermEvent } from "./solarTerms.js";
import { isGregorianMinute } from "./solarTermTimeline.js";
import { sexagenaryYearForCivilYear } from "./yearPillar.js";
import type { AppliedJieEventV1, MonthBoundaryCandidateContextV1, MonthBoundaryTraceV1, YearMonthConfidence } from "./yearMonthPillars.js";

export interface KoreanAppliedJieEventV1 extends AppliedJieEventV1 {
  readonly koreanName: string;
  readonly hanjaName: string;
}
type ContextBase = Omit<MonthBoundaryCandidateContextV1, "activeSince" | "boundarySide"> & {
  readonly monthPillarFactRef: `preview.candidates[${number}].month`;
  readonly activeSince: KoreanAppliedJieEventV1;
};
export type KoreanMonthBoundaryCandidateContextV1 = ContextBase & (
  | { readonly boundarySide: "DEFINITE" }
  | { readonly boundarySide: "BEFORE_PUBLISHED_MINUTE" }
  | { readonly boundarySide: "AFTER_PUBLISHED_MINUTE" }
);
export interface KoreanMonthBoundaryTraceV1 {
  readonly schemaVersion: "m1-month-boundary-trace-v1";
  readonly birthKstMinute: string;
  readonly confidence: YearMonthConfidence;
  readonly candidateContexts: readonly KoreanMonthBoundaryCandidateContextV1[];
  readonly atPublishedBoundary?: KoreanAppliedJieEventV1;
}
interface TraceChartContext {
  readonly recordedBirthKstMinute: string;
  readonly confidence: YearMonthConfidence;
  readonly candidates: readonly { readonly year: GanZhi; readonly month: GanZhi }[];
  /** Corpus-wide attribution, used only as a consistency check, never event evidence. */
  readonly solarTermSourceIds: readonly string[];
}
function invalid(): never { throw new RangeError("Inconsistent applied Jie trace or event provenance."); }
const sameIds = (a: readonly string[], b: readonly string[]): boolean =>
  a.length === b.length && a.every((id, i) => id === b[i]);

/** Validate structure/correlation and return an immutable copy; does not authenticate a source. */
export function copyValidatedKoreanMonthBoundaryTrace(
  trace: KoreanMonthBoundaryTraceV1,
  chart: TraceChartContext,
  events?: readonly SolarTermEvent[],
): KoreanMonthBoundaryTraceV1 {
  const ambiguous = chart.confidence === "PUBLISHED_MINUTE_AMBIGUOUS";
  const count = ambiguous ? 2 : 1;
  if (!trace || trace.schemaVersion !== "m1-month-boundary-trace-v1" ||
      !["DEFINITE", "PUBLISHED_MINUTE_AMBIGUOUS"].includes(chart.confidence) ||
      trace.confidence !== chart.confidence || trace.birthKstMinute !== chart.recordedBirthKstMinute ||
      typeof trace.birthKstMinute !== "string" || !isGregorianMinute(trace.birthKstMinute) ||
      !Array.isArray(trace.candidateContexts) || trace.candidateContexts.length !== count ||
      chart.candidates.length !== count || !Array.isArray(chart.solarTermSourceIds)) invalid();

  const copyEvent = (event: KoreanAppliedJieEventV1): KoreanAppliedJieEventV1 => {
    if (!event || !(MONTH_BOUNDARY_JIE as readonly string[]).includes(event.term) ||
        event.timeBasis !== "KST" || event.sourcePrecision !== "MINUTE" ||
        typeof event.displayedDateTime !== "string" || !isGregorianMinute(event.displayedDateTime) ||
        !Array.isArray(event.sourceIds)) invalid();
    const definition = solarTermDefinition(event.term);
    const sourceIds = [...event.sourceIds];
    if (event.koreanName !== definition.koreanName || event.hanjaName !== definition.hanjaName ||
        sourceIds.length === 0 || sourceIds.some(id => typeof id !== "string" || !id.trim() ||
          !chart.solarTermSourceIds.includes(id))) invalid();
    if (events && !events.some(source => source.term === event.term &&
        source.displayedDateTime === event.displayedDateTime && source.timeBasis === event.timeBasis &&
        source.sourcePrecision === event.sourcePrecision && sameIds(source.sourceIds, sourceIds))) invalid();
    return Object.freeze({
      term: event.term, koreanName: definition.koreanName, hanjaName: definition.hanjaName,
      displayedDateTime: event.displayedDateTime, timeBasis: "KST", sourcePrecision: "MINUTE",
      sourceIds: Object.freeze(sourceIds),
    });
  };
  const contexts = [...trace.candidateContexts].map((context, i): KoreanMonthBoundaryCandidateContextV1 => {
    const candidate = chart.candidates[i];
    const side = ambiguous ? (i === 0 ? "BEFORE_PUBLISHED_MINUTE" : "AFTER_PUBLISHED_MINUTE") : "DEFINITE";
    if (!context || !candidate || context.candidateIndex !== i ||
        context.monthPillarFactRef !== `preview.candidates[${i}].month` || context.boundarySide !== side) invalid();
    const activeSince = copyEvent(context.activeSince);
    if (context.monthBranch !== candidate.month.branch ||
        context.monthBranch !== MONTH_BRANCH_BY_JIE[activeSince.term] ||
        candidate.month.stem !== monthPillarFromYearStem(candidate.year.stem, context.monthBranch).stem ||
        (side === "AFTER_PUBLISHED_MINUTE" ? activeSince.displayedDateTime !== trace.birthKstMinute
          : activeSince.displayedDateTime >= trace.birthKstMinute)) invalid();
    return Object.freeze({
      candidateIndex: i, monthPillarFactRef: `preview.candidates[${i}].month` as const,
      monthBranch: context.monthBranch, boundarySide: side, activeSince,
    });
  });
  let boundary: KoreanAppliedJieEventV1 | undefined;
  if (ambiguous) {
    boundary = copyEvent(trace.atPublishedBoundary!);
    const after = contexts[1]!.activeSince;
    const priorTerm = MONTH_BOUNDARY_JIE[(MONTH_BOUNDARY_JIE.indexOf(boundary.term) + 11) % 12];
    if (boundary.term !== after.term || boundary.displayedDateTime !== after.displayedDateTime ||
        !sameIds(boundary.sourceIds, after.sourceIds) || contexts[0]!.activeSince.term !== priorTerm) invalid();
    const [beforeYear, afterYear] = chart.candidates.map(candidate => candidate.year);
    if (boundary.term === "LICHUN") {
      const year = Number(trace.birthKstMinute.slice(0, 4));
      const expectedBefore = sexagenaryYearForCivilYear(year - 1);
      const expectedAfter = sexagenaryYearForCivilYear(year);
      if (beforeYear!.stem !== expectedBefore.stem || beforeYear!.branch !== expectedBefore.branch ||
          afterYear!.stem !== expectedAfter.stem || afterYear!.branch !== expectedAfter.branch) invalid();
    } else if (beforeYear!.stem !== afterYear!.stem || beforeYear!.branch !== afterYear!.branch) invalid();
  } else if (trace.atPublishedBoundary !== undefined) invalid();
  return Object.freeze({
    schemaVersion: "m1-month-boundary-trace-v1", birthKstMinute: trace.birthKstMinute,
    confidence: trace.confidence, candidateContexts: Object.freeze(contexts),
    ...(boundary ? { atPublishedBoundary: boundary } : {}),
  });
}

/** Adapt the retained S1 trace; no second solar-term or lunar resolution. */
export function projectKoreanMonthBoundaryTrace(
  trace: MonthBoundaryTraceV1, chart: TraceChartContext, events: readonly SolarTermEvent[],
): KoreanMonthBoundaryTraceV1 {
  const label = (event: AppliedJieEventV1): KoreanAppliedJieEventV1 => ({
    ...event, koreanName: solarTermDefinition(event.term).koreanName,
    hanjaName: solarTermDefinition(event.term).hanjaName,
  });
  return copyValidatedKoreanMonthBoundaryTrace({
    schemaVersion: trace.schemaVersion, birthKstMinute: chart.recordedBirthKstMinute, confidence: trace.confidence,
    candidateContexts: trace.candidateContexts.map(context => ({
      ...context, monthPillarFactRef: `preview.candidates[${context.candidateIndex}].month`,
      activeSince: label(context.activeSince),
    })),
    ...(trace.atPublishedBoundary ? { atPublishedBoundary: label(trace.atPublishedBoundary) } : {}),
  }, chart, events);
}
