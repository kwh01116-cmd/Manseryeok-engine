import type { SolarTermEvent } from "./solarTerms.js";
import { resolveYearMonthPillars } from "./yearMonthPillars.js";
import { resolveDayHourPillars, type HourStemReferencePolicy } from "./dayHourPillars.js";
import type { DayRolloverPolicy } from "./dayRollover.js";
import { validateFullYearSolarTermCoverage, type FullYearSolarTermCoverageManifest } from "./solarTermCoverage.js";
import { resolveKoreanDstClockMinute1987To1988, type KoreanDstClockOptions1987V1 } from "../time/koreanDstClock1987V1.js";

export interface KoreanDstFourPillarsPolicies1987V1 extends Omit<KoreanDstClockOptions1987V1, "policyId"> {
  readonly clockPolicyId: string;
  readonly dayRollover: DayRolloverPolicy;
  readonly hourStemReference: HourStemReferencePolicy;
}

/** A separate standard-reference composer. The existing modern/stable composers do not change. */
export function resolveKoreanDstFourPillars1987To1988(
  events: readonly SolarTermEvent[], recordedCivilMinute: string,
  policies: KoreanDstFourPillarsPolicies1987V1, coverage: FullYearSolarTermCoverageManifest,
) {
  if (!policies || Object.keys(policies).some(key => !["clockPolicyId", "jurisdiction", "timeZone", "dayHourReference", "foldOffsetMinutes", "dayRollover", "hourStemReference"].includes(key))) throw new RangeError("Explicit supported DST composition policies required.");
  const clock = resolveKoreanDstClockMinute1987To1988(recordedCivilMinute, {
    policyId: policies.clockPolicyId, jurisdiction: policies.jurisdiction, timeZone: policies.timeZone,
    dayHourReference: policies.dayHourReference,
    ...(Object.hasOwn(policies, "foldOffsetMinutes") ? { foldOffsetMinutes: policies.foldOffsetMinutes! } : {}),
  });
  if (clock.status !== "RESOLVED_UNDER_POLICY" || clock.comparisonKstMinute === null || clock.dayHourMinute === null) throw new RangeError("DST birth clock requires a unique explicitly selected civil-time path: " + clock.status);
  validateFullYearSolarTermCoverage(events, coverage, clock.comparisonKstMinute);
  const yearMonth = resolveYearMonthPillars(events, clock.comparisonKstMinute);
  const dayHour = resolveDayHourPillars(clock.dayHourMinute.slice(0, 10), clock.dayHourMinute.slice(11), policies.dayRollover, policies.hourStemReference);
  // Legacy field is the standard-KST calculation reference, never the DST wall clock.
  return { recordedBirthKstMinute: clock.comparisonKstMinute, recordedBirthCivilMinute: recordedCivilMinute, recordedCivilMinute,
    normalizedBirthKstMinute: clock.comparisonKstMinute, dayHourReferenceMinute: clock.dayHourMinute,
    effectiveDayDate: dayHour.effectiveDate,
    policies: { timeBasis: "KOREAN_CIVIL_TIME" as const, dayRollover: dayHour.dayRolloverPolicy,
      hourStemReference: dayHour.hourStemReferencePolicy, dayHourReference: "STANDARD_KST" as const },
    confidence: yearMonth.confidence, confidenceScope: "PUBLISHED_MINUTE_COMPARISON_ONLY" as const,
    ...(yearMonth.monthBoundaryTrace ? { monthBoundaryTrace: yearMonth.monthBoundaryTrace } : {}),
    candidates: yearMonth.candidates.map(({ year, month }) => ({ year, month, day: dayHour.dayPillar, hour: dayHour.hourPillar })),
    coverage: { validation: "STRUCTURAL_COVERAGE_ONLY" as const, requirementProfile: coverage.requirementProfile,
      supportedFromInclusive: coverage.supportedFromInclusive, supportedUntilExclusive: coverage.supportedUntilExclusive },
    clockResolution: clock,
  };
}
