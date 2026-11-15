import { isGregorianMinute } from "../calendar/solarTermTimeline.js";
import { gregorianDayNumber, gregorianDateFromDayNumber } from "../calendar/koreanLunisolarValidation.js";
import { SOLAR_TERM_CODES, type SolarTermCode } from "../calendar/solarTerms.js";
import { KOREAN_DST_1987_1988, resolveKoreanDst1987To1988 } from "./koreanDst.js";

export const KOREAN_DST_CLOCK_1987_1988_POLICY_ID = "KR_API_PUBLISHED_KST_DST_1987_1988_STANDARD_REFERENCE_V1";
export const KOREAN_DST_CLOCK_1987_1988_POLICY_VERSION = "1";
const SOURCE_REFS = Object.freeze([
  "KR_DST_DECREE_12136_1987", "IANA_TZDB_2025B_ASIA_SEOUL",
  "TOKYO_ASTRONOMICAL_OBSERVATORY_1987_YOKO_STANDARD_TIME",
  "TOKYO_ASTRONOMICAL_OBSERVATORY_1988_YOKO_STANDARD_TIME", "NAOJ_STANDARD_TIME_UTC_PLUS_9",
]);
export const KOREAN_DST_CLOCK_1987_1988_METADATA = Object.freeze({
  id: KOREAN_DST_CLOCK_1987_1988_POLICY_ID, version: KOREAN_DST_CLOCK_1987_1988_POLICY_VERSION,
  schemaVersion: "korean-dst1987-clock-v1",
  birthRange: Object.freeze({ fromInclusive: "1987-01-01T00:00", untilExclusive: "1989-01-01T00:00" }),
  jurisdiction: "KR", timeZone: "Asia/Seoul", dayHourReference: "STANDARD_KST",
  apiEventTime: "PUBLISHED_STANDARD_KST_UTC_PLUS_09_NOT_LEGAL_DST_CIVIL_TIME",
  referenceChoice: "PROJECT_POLICY_STANDARD_KST_DAY_AND_HOUR_REFERENCE_NOT_TRUE_SOLAR_TIME",
  foldChoice: "EXPLICIT_RECORDED_OFFSET_REQUIRED_OTHERWISE_NO_CHART",
  sourcePrecision: "MINUTE", sourceRefs: SOURCE_REFS,
  sources: Object.freeze([
    Object.freeze({ id: SOURCE_REFS[0]!, url: "https://law.go.kr/LSW/lsRvsRsnListP.do?chrClsCd=010202&lsId=004533&lsRvsGubun=all", kind: "OFFICIAL_ENACTMENT_REPEAL_EXPLANATION_PLUS_PRIOR_DECREE_REVIEW" }),
    Object.freeze({ id: SOURCE_REFS[1]!, url: "https://data.iana.org/time-zones/tzdb-2025b/asia", kind: "PINNED_TECHNICAL_COMPARISON_NOT_LEGAL_AUTHORITY" }),
    Object.freeze({ id: SOURCE_REFS[2]!, url: "https://eco.mtk.nao.ac.jp/koyomi/yoko/pdf/yoko1987.pdf", sha256: "722ffc818cdb4834b2dc5cd1b1764e95f61b4799efecb98eb4ca580ac0af8d29", kind: "OFFICIAL_HISTORICAL_PUBLICATION_PAGE_2_VISUALLY_READ" }),
    Object.freeze({ id: SOURCE_REFS[3]!, url: "https://eco.mtk.nao.ac.jp/koyomi/yoko/pdf/yoko1988.pdf", sha256: "8fb421ddf7973e544b68f4089c200d0539cb3576dc9fcaa0be698a442da3ae07", kind: "OFFICIAL_HISTORICAL_PUBLICATION_PAGE_2_VISUALLY_READ" }),
    Object.freeze({ id: SOURCE_REFS[4]!, url: "https://eco.mtk.nao.ac.jp/koyomi/faq/time.html", kind: "DIRECT_OFFICIAL_STANDARD_TIME_EXPLANATION" }),
  ]),
  limitations: Object.freeze([
    "NO_PRE_1987_OR_POST_1988_BIRTH_SUPPORT", "NO_TRUE_SOLAR_OR_UNKNOWN_BIRTH_TIME",
    "UTC_MINUTE_IS_A_POLICY_MAPPING_NOT_MEASURED_BIRTH_INSTANT_OR_SECOND_PRECISION",
    "API_MINUTE_EDITION_SELECTED_NOT_ALL_EPHEMERIDES_EQUAL_1988_HANLU_ONE_MINUTE_DIFFERENCE_PRESERVED",
    "NO_CALENDAR_SOURCE_AUTHENTICATION_OR_RIGHTS_CERTIFICATION",
  ]),
});

export interface KoreanDstClockOptions1987V1 {
  readonly policyId: string;
  readonly jurisdiction: "KR";
  readonly timeZone: "Asia/Seoul";
  readonly dayHourReference: "STANDARD_KST";
  readonly foldOffsetMinutes?: 540 | 600;
}
export interface KoreanDstOffsetCandidate1987V1 {
  readonly utcOffsetMinutes: 540 | 600;
  readonly daylightSavingMinutes: 0 | 60;
  readonly standardKstMinute: string;
  readonly utcMinute: string;
}
export interface KoreanDstClockResolution1987V1 {
  readonly schemaVersion: "korean-dst1987-clock-v1";
  readonly status: "RESOLVED_UNDER_POLICY" | "NONEXISTENT_TIME" | "AMBIGUOUS_TIME" | "OUTSIDE_POLICY_SCOPE";
  readonly policy: { readonly id: typeof KOREAN_DST_CLOCK_1987_1988_POLICY_ID; readonly version: "1" };
  readonly jurisdiction: "KR";
  readonly timeZone: "Asia/Seoul";
  readonly dayHourReference: "STANDARD_KST";
  readonly recordedCivilMinute: string;
  readonly comparisonKstMinute: string | null;
  readonly dayHourMinute: string | null;
  readonly utcMinute: string | null;
  readonly utcInstant: null;
  readonly utcOffsetMinutes: 540 | 600 | null;
  readonly daylightSavingMinutes: 0 | 60 | null;
  readonly originalCivilStatus: "STANDARD" | "DAYLIGHT" | "NONEXISTENT_TIME" | "AMBIGUOUS_TIME" | "OUTSIDE_POLICY_SCOPE";
  readonly isAmbiguousCivilMinute: boolean;
  readonly explicitFoldOffsetMinutes: 540 | 600 | null;
  readonly civilOffsetCandidates: readonly KoreanDstOffsetCandidate1987V1[];
  readonly sourcePrecision: "MINUTE";
  readonly sourceRefs: readonly string[];
  readonly limitations: readonly string[];
}

/** Reuses the project's Gregorian date arithmetic; never consults host tzdb. */
function shiftedMinute(minute: string, delta: number): string {
  const total = gregorianDayNumber(minute.slice(0, 10)) * 1440 + Number(minute.slice(11, 13)) * 60 + Number(minute.slice(14, 16)) + delta;
  const day = Math.floor(total / 1440), clock = total - day * 1440;
  return gregorianDateFromDayNumber(day) + "T" + String(Math.floor(clock / 60)).padStart(2, "0") + ":" + String(clock % 60).padStart(2, "0");
}
function assertMinute(minute: string): void {
  if (typeof minute !== "string" || !isGregorianMinute(minute)) throw new RangeError("Explicit valid YYYY-MM-DDTHH:mm recorded civil minute required.");
}
function assertOptions(options: KoreanDstClockOptions1987V1): void {
  const allowed = ["policyId", "jurisdiction", "timeZone", "dayHourReference", "foldOffsetMinutes"];
  if (!options || Object.keys(options).some(key => !allowed.includes(key)) ||
      options.policyId !== KOREAN_DST_CLOCK_1987_1988_POLICY_ID || options.jurisdiction !== "KR" ||
      options.timeZone !== "Asia/Seoul" || options.dayHourReference !== "STANDARD_KST" ||
      (Object.hasOwn(options, "foldOffsetMinutes") && options.foldOffsetMinutes !== 540 && options.foldOffsetMinutes !== 600)) {
    throw new RangeError("Explicit bounded DST policy, KR jurisdiction, Asia/Seoul and STANDARD_KST reference required.");
  }
}
function offsetCandidate(minute: string, offset: 540 | 600): KoreanDstOffsetCandidate1987V1 {
  return Object.freeze({ utcOffsetMinutes: offset, daylightSavingMinutes: offset === 600 ? 60 : 0,
    standardKstMinute: shiftedMinute(minute, 540 - offset), utcMinute: shiftedMinute(minute, -offset) });
}

/** Civil-time reconstruction and the selected standard-KST Myeongli clock are explicit separate fields. */
export function resolveKoreanDstClockMinute1987To1988(recordedCivilMinute: string, options: KoreanDstClockOptions1987V1): KoreanDstClockResolution1987V1 {
  assertMinute(recordedCivilMinute); assertOptions(options);
  const common = { schemaVersion: "korean-dst1987-clock-v1" as const,
    policy: Object.freeze({ id: KOREAN_DST_CLOCK_1987_1988_POLICY_ID, version: KOREAN_DST_CLOCK_1987_1988_POLICY_VERSION }),
    jurisdiction: "KR" as const, timeZone: "Asia/Seoul" as const, dayHourReference: "STANDARD_KST" as const,
    recordedCivilMinute, utcInstant: null, sourcePrecision: "MINUTE" as const, sourceRefs: SOURCE_REFS,
    limitations: KOREAN_DST_CLOCK_1987_1988_METADATA.limitations,
  };
  const unresolved = (status: "NONEXISTENT_TIME" | "AMBIGUOUS_TIME" | "OUTSIDE_POLICY_SCOPE", candidates: readonly KoreanDstOffsetCandidate1987V1[] = []): KoreanDstClockResolution1987V1 =>
    Object.freeze({ ...common, status, comparisonKstMinute: null, dayHourMinute: null, utcMinute: null, utcOffsetMinutes: null, daylightSavingMinutes: null,
      originalCivilStatus: status, isAmbiguousCivilMinute: status === "AMBIGUOUS_TIME", explicitFoldOffsetMinutes: null, civilOffsetCandidates: Object.freeze(candidates) });
  if (recordedCivilMinute < "1987-01-01T00:00" || recordedCivilMinute >= "1989-01-01T00:00") {
    if (Object.hasOwn(options, "foldOffsetMinutes")) throw new RangeError("Fold offset is only applicable to a repeated civil minute.");
    return unresolved("OUTSIDE_POLICY_SCOPE");
  }
  const period = KOREAN_DST_1987_1988.find(row => row.startLocalStandardTime.slice(0, 4) === recordedCivilMinute.slice(0, 4))!;
  const gapDate = period.startLocalStandardTime.slice(0, 10), foldDate = period.endLocalDaylightTime.slice(0, 10);
  const gap = recordedCivilMinute >= gapDate + "T02:00" && recordedCivilMinute < gapDate + "T03:00";
  const fold = recordedCivilMinute >= foldDate + "T02:00" && recordedCivilMinute < foldDate + "T03:00";
  if (!fold && Object.hasOwn(options, "foldOffsetMinutes")) throw new RangeError("Fold offset is only applicable to a repeated civil minute.");
  if (gap) return unresolved("NONEXISTENT_TIME");
  const candidates = Object.freeze(fold ? [offsetCandidate(recordedCivilMinute, 600), offsetCandidate(recordedCivilMinute, 540)] : [
    offsetCandidate(recordedCivilMinute, resolveKoreanDst1987To1988(recordedCivilMinute + ":00").status === "DAYLIGHT" ? 600 : 540),
  ]);
  if (fold && options.foldOffsetMinutes === undefined) return unresolved("AMBIGUOUS_TIME", candidates);
  const selected = fold ? candidates.find(row => row.utcOffsetMinutes === options.foldOffsetMinutes)! : candidates[0]!;
  return Object.freeze({ ...common, status: "RESOLVED_UNDER_POLICY", comparisonKstMinute: selected.standardKstMinute,
    dayHourMinute: selected.standardKstMinute, utcMinute: selected.utcMinute, utcOffsetMinutes: selected.utcOffsetMinutes,
    daylightSavingMinutes: selected.daylightSavingMinutes, originalCivilStatus: fold ? "AMBIGUOUS_TIME" : selected.daylightSavingMinutes ? "DAYLIGHT" : "STANDARD",
    isAmbiguousCivilMinute: fold, explicitFoldOffsetMinutes: fold ? options.foldOffsetMinutes! : null, civilOffsetCandidates: candidates });
}

/** The adapter authenticates source rows separately; this only interprets their selected time basis. */
export function resolveKoreanDstApiEventMinute1987To1988(
  displayedDateTime: string,
  options: { readonly policyId: string; readonly termCode: SolarTermCode; readonly role: "ANNUAL_EVENT" | "PRIOR_DAXUE_GUARD" },
) {
  assertMinute(displayedDateTime);
  if (!options || Object.keys(options).some(key => !["policyId", "termCode", "role"].includes(key)) || options.policyId !== KOREAN_DST_CLOCK_1987_1988_POLICY_ID ||
      !SOLAR_TERM_CODES.includes(options.termCode) || !["ANNUAL_EVENT", "PRIOR_DAXUE_GUARD"].includes(options.role)) throw new RangeError("Explicit supported DST API event policy and role required.");
  const year = Number(displayedDateTime.slice(0, 4));
  if (options.role === "ANNUAL_EVENT" ? year !== 1987 && year !== 1988 :
      options.termCode !== "DAXUE" || displayedDateTime.slice(5, 7) !== "12" || year !== 1986 && year !== 1987) throw new RangeError("API event is outside the bounded DST clock scope.");
  return Object.freeze({ displayedDateTime, timeBasis: "KST" as const, sourcePrecision: "MINUTE" as const,
    clockPolicyId: KOREAN_DST_CLOCK_1987_1988_POLICY_ID, clockPolicyVersion: KOREAN_DST_CLOCK_1987_1988_POLICY_VERSION,
    utcOffsetMinutes: 540 as const, daylightSavingMinutes: 0 as const, utcInstant: null,
    role: options.role, interpretation: "PUBLISHED_STANDARD_KST_NOT_LEGAL_DST_CIVIL_TIME" as const, sourceRefs: SOURCE_REFS });
}
