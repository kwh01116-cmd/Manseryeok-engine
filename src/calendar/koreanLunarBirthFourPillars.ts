import type { SolarTermEvent } from "./solarTerms.js";
import type { FullYearSolarTermCoverageManifest } from "./solarTermCoverage.js";
import type { KoreanLunarDate } from "./koreanLunisolarTypes.js";
import type { createKoreanLunisolarConverter } from "./koreanLunisolarConverter.js";
import {
  resolveCoverageCheckedModernKoreanCivilFourPillars,
  type CoverageCheckedModernKoreanFourPillarsResolution,
  type ModernKoreanCivilTimePolicy,
} from "./fourPillars.js";

export type KoreanLunarBirthFourPillarsResult =
  | {
      readonly status: "OK";
      readonly inputLunarDate: KoreanLunarDate;
      readonly recordedBirthKstMinute: string;
      readonly conversionSource: {
        readonly corpusId: string;
        readonly sourceId: "KR-KASI-CALENDAR-DATA";
        readonly authorityLevel: "KASI_COMPUTATIONAL_REFERENCE_NOT_OFFICIAL_KASA";
      };
      readonly chart: CoverageCheckedModernKoreanFourPillarsResolution;
    }
  | { readonly status: "OUT_OF_COVERAGE" | "INVALID_LUNAR_DATE" };

/**
 * Convert an explicitly flagged Korean lunar birth date to a Korean civil
 * minute, then resolve a structurally coverage-checked Four-Pillars chart.
 * Both source corpus and solar-term manifest are caller supplied: neither is
 * an official-edition/astronomical-precision certification or a policy default.
 * An otherwise valid lunar date outside the solar-term manifest fails closed.
 */
export function resolveKoreanLunarBirthFourPillars(
  lunarBirthDate: KoreanLunarDate,
  recordedBirthKstClock: string,
  policies: ModernKoreanCivilTimePolicy,
  converter: ReturnType<typeof createKoreanLunisolarConverter>,
  events: readonly SolarTermEvent[],
  manifest: FullYearSolarTermCoverageManifest,
): KoreanLunarBirthFourPillarsResult {
  if (typeof recordedBirthKstClock !== "string" ||
      !/^(?:[01]\d|2[0-3]):[0-5]\d$/.test(recordedBirthKstClock)) {
    throw new TypeError("Birth clock must be an explicit HH:MM Korean civil time.");
  }
  const conversion = converter.fromLunarDate(lunarBirthDate);
  if (conversion.status !== "OK") return { status: conversion.status };
  const recordedBirthKstMinute = conversion.value + "T" + recordedBirthKstClock;
  const chart = resolveCoverageCheckedModernKoreanCivilFourPillars(
    events, recordedBirthKstMinute, policies, manifest,
  );
  return {
    status: "OK",
    inputLunarDate: { ...lunarBirthDate },
    recordedBirthKstMinute,
    conversionSource: {
      corpusId: conversion.corpusId,
      sourceId: conversion.sourceId,
      authorityLevel: conversion.authorityLevel,
    },
    chart,
  };
}
