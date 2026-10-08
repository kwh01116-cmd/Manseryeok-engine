import type { GanZhi } from "../domain/sexagenary.js";
import type { SolarTermEvent } from "./solarTerms.js";
import { isGregorianMinute } from "./solarTermTimeline.js";
import { resolveYearMonthPillars, type YearMonthConfidence } from "./yearMonthPillars.js";
import { resolveDayHourPillars, type HourStemReferencePolicy } from "./dayHourPillars.js";
import type { DayRolloverPolicy } from "./dayRollover.js";

/** This first integration supports only post-DST Korean civil-clock births. */
export interface ModernKoreanCivilTimePolicy {
  readonly timeBasis: "KOREAN_CIVIL_TIME";
  readonly dayRollover: DayRolloverPolicy;
  readonly hourStemReference: HourStemReferencePolicy;
}

export interface FourPillarsCandidate {
  readonly year: GanZhi;
  readonly month: GanZhi;
  readonly day: GanZhi;
  readonly hour: GanZhi;
}

export interface ModernKoreanFourPillarsResolution {
  readonly recordedBirthKstMinute: string;
  readonly effectiveDayDate: string;
  readonly policies: ModernKoreanCivilTimePolicy;
  /** Not a statement of astronomical certainty or birth-record accuracy. */
  readonly confidence: YearMonthConfidence;
  readonly confidenceScope: "PUBLISHED_MINUTE_COMPARISON_ONLY";
  readonly candidates: readonly FourPillarsCandidate[];
}

/**
 * Compose only the already-supported Korean civil-time, published-minute path.
 * The caller must first establish that the supplied birth time is a Korean
 * civil wall-clock minute. This does not convert UTC, mean/apparent solar time,
 * historical offsets, or a birth record with unknown precision.
 */
export function resolveModernKoreanCivilFourPillars(
  events: readonly SolarTermEvent[],
  recordedBirthKstMinute: string,
  policies: ModernKoreanCivilTimePolicy,
): ModernKoreanFourPillarsResolution {
  if (!policies || policies.timeBasis !== "KOREAN_CIVIL_TIME") {
    throw new RangeError("Only explicit KOREAN_CIVIL_TIME is supported by this composer.");
  }
  if (typeof recordedBirthKstMinute !== "string" || !isGregorianMinute(recordedBirthKstMinute)) {
    throw new TypeError("Birth time must be a valid YYYY-MM-DDTHH:MM Korean civil minute.");
  }
  // The historical standard-time/DST resolver is not yet integrated here.
  if (recordedBirthKstMinute < "1989-01-01T00:00") {
    throw new RangeError("Historical Korean civil time requires a separate normalization path.");
  }
  const yearMonth = resolveYearMonthPillars(events, recordedBirthKstMinute);
  const dayHour = resolveDayHourPillars(
    recordedBirthKstMinute.slice(0, 10),
    recordedBirthKstMinute.slice(11),
    policies.dayRollover,
    policies.hourStemReference,
  );
  return {
    recordedBirthKstMinute,
    effectiveDayDate: dayHour.effectiveDate,
    policies: {
      timeBasis: policies.timeBasis,
      dayRollover: dayHour.dayRolloverPolicy,
      hourStemReference: dayHour.hourStemReferencePolicy,
    },
    confidence: yearMonth.confidence,
    confidenceScope: "PUBLISHED_MINUTE_COMPARISON_ONLY",
    candidates: yearMonth.candidates.map(({ year, month }) => ({
      year, month, day: dayHour.dayPillar, hour: dayHour.hourPillar,
    })),
  };
}
