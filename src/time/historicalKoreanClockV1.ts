import { isGregorianMinute } from "../calendar/solarTermTimeline.js";
import { SOLAR_TERM_CODES, type SolarTermCode } from "../calendar/solarTerms.js";
import { KOREAN_DST_1987_1988, resolveKoreanDst1987To1988 } from "./koreanDst.js";
import { resolveKoreanStandardTime } from "./koreanStandardTime.js";

/** A separate bounded opt-in; this never widens the existing modern policy. */
export const HISTORICAL_KOREAN_CLOCK_POLICY_ID = "KR_API_PUBLISHED_KST_HISTORICAL_1962_1986_NO_DST_V1";
export const HISTORICAL_KOREAN_CLOCK_POLICY_VERSION = "1";
const SOURCE_REFS = Object.freeze([
  "KR_ARCHIVES_STANDARD_TIME_DST_HISTORY",
  "KR_STANDARD_TIME_ACT_3919_1986",
  "KR_DST_DECREE_12136_1987",
  "IANA_TZDB_2025B_ASIA_SEOUL",
  "KR_ARCHIVES_STANDARD_MERIDIAN_LAW_676_1961",
]);
export const HISTORICAL_KOREAN_CLOCK_METADATA = Object.freeze({
  id: HISTORICAL_KOREAN_CLOCK_POLICY_ID,
  version: HISTORICAL_KOREAN_CLOCK_POLICY_VERSION,
  schemaVersion: "historical-korean-clock-v1",
  scope: "BOUNDED_LEGAL_CIVIL_AND_API_PUBLISHED_KST_COMPARISON",
  birthRange: Object.freeze({ fromInclusive: "1962-01-01T00:00", untilExclusive: "1987-01-01T00:00" }),
  auxiliaryEvent: Object.freeze({ year: 1961, month: 12, term: "DAXUE", purpose: "PRIOR_DAXUE_GUARD_ONLY_NOT_1961_BIRTH_SUPPORT" }),
  utcOffsetMinutes: 540,
  daylightSavingMinutes: 0,
  sourcePrecision: "MINUTE",
  comparison: "PUBLISHED_KST_WALL_MINUTE_ONLY",
  sourceRefs: SOURCE_REFS,
  sources: Object.freeze([
    Object.freeze({ id: SOURCE_REFS[0]!, url: "https://theme.archives.go.kr/next/koreaOfRecord/summerTime.do", kind: "OFFICIAL_ARCHIVE_HISTORICAL_EXPLANATION" }),
    Object.freeze({ id: SOURCE_REFS[1]!, url: "https://www.law.go.kr/LSW/lsInfoP.do?lsiSeq=3771", kind: "OFFICIAL_LEGISLATION_1986_NOT_RETROACTIVE_ENACTMENT" }),
    Object.freeze({ id: SOURCE_REFS[2]!, url: "https://law.go.kr/LSW/lsRvsRsnListP.do?chrClsCd=010202&lsId=004533&lsRvsGubun=all", kind: "OFFICIAL_ENACTMENT_REPEAL_EXPLANATION" }),
    Object.freeze({ id: SOURCE_REFS[3]!, url: "https://data.iana.org/time-zones/tzdb-2025b/asia", kind: "PINNED_TECHNICAL_COMPARISON_NOT_LEGAL_AUTHORITY" }),
    Object.freeze({ id: SOURCE_REFS[4]!, url: "https://theme.archives.go.kr/next/chronology/archiveDetail.do?evntId=0049285961&flag=1&isPop=Y", kind: "OFFICIAL_ARCHIVE_1961_LEGAL_TEXT_QUOTATION_NOT_ORIGINAL_SCAN" }),
  ]),
  limitations: Object.freeze([
    "NO_PRE_1962_BIRTH_CLOCK_PROMOTION",
    "NO_1987_1988_BIRTH_COMPOSITION_PROMOTION",
    "NO_UNKNOWN_TIME_OR_TRUE_SOLAR_TIME",
    "NO_BIRTH_SECONDS_OR_EVENT_ROUNDING_CERTIFICATION",
    "NO_UTC_INSTANT_REQUIRED_OR_FABRICATED",
    "NO_CALENDAR_DATA_OR_SOURCE_RIGHTS_AUTHENTICATION",
  ]),
});

export type HistoricalKoreanClockStatus = "RESOLVED_UNDER_POLICY" | "POLICY_UNRESOLVED" | "OUTSIDE_POLICY_SCOPE" | "NONEXISTENT_TIME" | "AMBIGUOUS_TIME";
export interface HistoricalKoreanClockResolution {
  readonly schemaVersion: "historical-korean-clock-v1";
  readonly status: HistoricalKoreanClockStatus;
  readonly policy: { readonly id: typeof HISTORICAL_KOREAN_CLOCK_POLICY_ID; readonly version: "1" };
  readonly recordedCivilMinute: string;
  readonly comparisonKstMinute: string | null;
  readonly utcOffsetMinutes: 540 | null;
  readonly daylightSavingMinutes: 0 | null;
  readonly utcInstant: null;
  readonly sourcePrecision: "MINUTE";
  readonly reason: "LEGAL_CIVIL_EQUALS_PUBLISHED_KST" | "PRE_1962_CLOCK_AND_SOURCE_INTERPRETATION_NOT_ACCEPTED" | "DST_YEAR_NOT_ENABLED_FOR_BIRTH_COMPOSITION" | "DST_FORWARD_GAP" | "DST_BACKWARD_FOLD" | "OUTSIDE_HISTORICAL_AUDIT_RANGE";
  readonly civilOffsetCandidates: readonly { readonly utcOffsetMinutes: 540 | 600; readonly daylightSavingMinutes: 0 | 60 }[];
  readonly sourceRefs: readonly string[];
  readonly limitations: readonly string[];
}

function assertInput(minute: string, options: { readonly policyId: string }): void {
  if (!options || options.policyId !== HISTORICAL_KOREAN_CLOCK_POLICY_ID) throw new RangeError("Explicit supported historical clock policy required.");
  if (typeof minute !== "string" || !isGregorianMinute(minute)) throw new RangeError("Explicit valid YYYY-MM-DDTHH:mm civil minute required.");
}

/** Minute parsing is UTC-independent. No host tzdb, local Date parsing, gap fill or fold choice. */
export function resolveHistoricalKoreanClockMinute(
  recordedCivilMinute: string,
  options: { readonly policyId: string },
): HistoricalKoreanClockResolution {
  assertInput(recordedCivilMinute, options);
  const common = {
    schemaVersion: "historical-korean-clock-v1" as const,
    policy: Object.freeze({ id: HISTORICAL_KOREAN_CLOCK_POLICY_ID, version: HISTORICAL_KOREAN_CLOCK_POLICY_VERSION }),
    recordedCivilMinute,
    utcInstant: null,
    sourcePrecision: "MINUTE" as const,
    sourceRefs: SOURCE_REFS,
    limitations: HISTORICAL_KOREAN_CLOCK_METADATA.limitations,
  };
  const unresolved = (status: HistoricalKoreanClockStatus, reason: HistoricalKoreanClockResolution["reason"], civilOffsetCandidates: HistoricalKoreanClockResolution["civilOffsetCandidates"] = []): HistoricalKoreanClockResolution =>
    Object.freeze({ ...common, status, reason, comparisonKstMinute: null, utcOffsetMinutes: null, daylightSavingMinutes: null, civilOffsetCandidates: Object.freeze(civilOffsetCandidates) });
  if (recordedCivilMinute < "1950-01-01T00:00" || recordedCivilMinute >= "1989-01-01T00:00") {
    return unresolved("OUTSIDE_POLICY_SCOPE", "OUTSIDE_HISTORICAL_AUDIT_RANGE");
  }
  if (recordedCivilMinute < "1962-01-01T00:00") {
    return unresolved("POLICY_UNRESOLVED", "PRE_1962_CLOCK_AND_SOURCE_INTERPRETATION_NOT_ACCEPTED");
  }
  if (recordedCivilMinute >= "1987-01-01T00:00") {
    const period = KOREAN_DST_1987_1988.find(row => row.startLocalStandardTime.slice(0, 4) === recordedCivilMinute.slice(0, 4))!;
    const gapDate = period.startLocalStandardTime.slice(0, 10), foldDate = period.endLocalDaylightTime.slice(0, 10);
    if (recordedCivilMinute >= gapDate + "T02:00" && recordedCivilMinute < gapDate + "T03:00") {
      return unresolved("NONEXISTENT_TIME", "DST_FORWARD_GAP");
    }
    if (recordedCivilMinute >= foldDate + "T02:00" && recordedCivilMinute < foldDate + "T03:00") {
      return unresolved("AMBIGUOUS_TIME", "DST_BACKWARD_FOLD", [
        Object.freeze({ utcOffsetMinutes: 600, daylightSavingMinutes: 60 }),
        Object.freeze({ utcOffsetMinutes: 540, daylightSavingMinutes: 0 }),
      ]);
    }
    // Reuse the existing decree-based diagnostic; knowing a civil offset is not
    // acceptance of every API event's historical notation or a birth composer.
    resolveKoreanDst1987To1988(recordedCivilMinute + ":00");
    return unresolved("POLICY_UNRESOLVED", "DST_YEAR_NOT_ENABLED_FOR_BIRTH_COMPOSITION");
  }
  if (resolveKoreanStandardTime(recordedCivilMinute.slice(0, 10))?.utcOffsetMinutes !== 540) {
    throw new RangeError("Historical no-DST policy conflicts with existing standard offset.");
  }
  return Object.freeze({ ...common, status: "RESOLVED_UNDER_POLICY", reason: "LEGAL_CIVIL_EQUALS_PUBLISHED_KST", comparisonKstMinute: recordedCivilMinute, utcOffsetMinutes: 540, daylightSavingMinutes: 0, civilOffsetCandidates: Object.freeze([]) });
}

export interface HistoricalApiEventInterpretation {
  readonly displayedDateTime: string;
  readonly timeBasis: "KST";
  readonly sourcePrecision: "MINUTE";
  readonly clockPolicyId: typeof HISTORICAL_KOREAN_CLOCK_POLICY_ID;
  readonly clockPolicyVersion: "1";
  readonly utcOffsetMinutes: 540;
  readonly utcInstant: null;
  readonly role: "ANNUAL_EVENT" | "PRIOR_DAXUE_GUARD";
  readonly sourceRefs: readonly string[];
}

/** Caller separately verifies API provenance and term label. A guard grants no birth coverage. */
export function resolveHistoricalApiEventMinute(
  displayedDateTime: string,
  options: { readonly policyId: string; readonly termCode: SolarTermCode; readonly role: "ANNUAL_EVENT" | "PRIOR_DAXUE_GUARD" },
): HistoricalApiEventInterpretation {
  assertInput(displayedDateTime, options);
  if (!SOLAR_TERM_CODES.includes(options.termCode)) throw new RangeError("A known solar-term code is required.");
  if (options.role !== "ANNUAL_EVENT" && options.role !== "PRIOR_DAXUE_GUARD") throw new RangeError("A supported historical event role is required.");
  const acceptedYear = displayedDateTime >= "1962-01-01T00:00" && displayedDateTime < "1987-01-01T00:00";
  if (options.role === "ANNUAL_EVENT" ? !acceptedYear : options.termCode !== "DAXUE" || displayedDateTime.slice(5, 7) !== "12" || !(acceptedYear || displayedDateTime.startsWith("1961-12-"))) {
    throw new RangeError("Event is outside the bounded historical clock scope.");
  }
  return Object.freeze({ displayedDateTime, timeBasis: "KST", sourcePrecision: "MINUTE", clockPolicyId: HISTORICAL_KOREAN_CLOCK_POLICY_ID, clockPolicyVersion: HISTORICAL_KOREAN_CLOCK_POLICY_VERSION, utcOffsetMinutes: 540, utcInstant: null, role: options.role, sourceRefs: SOURCE_REFS });
}
