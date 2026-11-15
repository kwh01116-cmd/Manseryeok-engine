import type { SolarTermEvent } from "./solarTerms.js";
import { resolveYearMonthPillars } from "./yearMonthPillars.js";
import { resolveDayHourPillars, type HourStemReferencePolicy } from "./dayHourPillars.js";
import type { DayRolloverPolicy } from "./dayRollover.js";
import { validateFullYearSolarTermCoverage, type FullYearSolarTermCoverageManifest } from "./solarTermCoverage.js";
import { HISTORICAL_KOREAN_CLOCK_POLICY_ID, resolveHistoricalKoreanClockMinute } from "../time/historicalKoreanClockV1.js";

/** Only the separately verified no-DST/+09 interval. No reinterpretation of the modern composer. */
export function resolveHistoricalStandardFourPillars(
  events: readonly SolarTermEvent[], recordedBirthKstMinute: string,
  policies: {readonly clockPolicyId:string;readonly dayRollover:DayRolloverPolicy;readonly hourStemReference:HourStemReferencePolicy},
  coverage: FullYearSolarTermCoverageManifest,
) {
  if (policies?.clockPolicyId !== HISTORICAL_KOREAN_CLOCK_POLICY_ID) throw new RangeError("Explicit bounded historical clock policy required.");
  const clock = resolveHistoricalKoreanClockMinute(recordedBirthKstMinute,{policyId:policies.clockPolicyId});
  if (clock.status !== "RESOLVED_UNDER_POLICY" || clock.comparisonKstMinute !== recordedBirthKstMinute) throw new RangeError("Historical birth clock is unresolved.");
  validateFullYearSolarTermCoverage(events,coverage,recordedBirthKstMinute);
  const yearMonth=resolveYearMonthPillars(events,recordedBirthKstMinute);
  const dayHour=resolveDayHourPillars(recordedBirthKstMinute.slice(0,10),recordedBirthKstMinute.slice(11),policies.dayRollover,policies.hourStemReference);
  return {recordedBirthKstMinute,effectiveDayDate:dayHour.effectiveDate,
    policies:{timeBasis:"KOREAN_CIVIL_TIME" as const,dayRollover:dayHour.dayRolloverPolicy,hourStemReference:dayHour.hourStemReferencePolicy},
    confidence:yearMonth.confidence,confidenceScope:"PUBLISHED_MINUTE_COMPARISON_ONLY" as const,
    ...(yearMonth.monthBoundaryTrace?{monthBoundaryTrace:yearMonth.monthBoundaryTrace}:{}),
    candidates:yearMonth.candidates.map(({year,month})=>({year,month,day:dayHour.dayPillar,hour:dayHour.hourPillar})),
    coverage:{validation:"STRUCTURAL_COVERAGE_ONLY" as const,requirementProfile:coverage.requirementProfile,supportedFromInclusive:coverage.supportedFromInclusive,supportedUntilExclusive:coverage.supportedUntilExclusive},
    clockResolution:clock,
  };
}
