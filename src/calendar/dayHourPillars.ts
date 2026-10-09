import { dayPillarForGregorianDate } from "./dayPillar.js";
import { selectDayPillarByRollover, type DayRolloverPolicy } from "./dayRollover.js";
import { hourBranchForEffectiveClock, hourPillarFromDayStem } from "./hourPillar.js";
import type { GanZhi } from "../domain/sexagenary.js";

export const HOUR_STEM_REFERENCE_POLICIES = [
  "SELECTED_DAY_PILLAR",
  "CIVIL_DATE_DAY_PILLAR",
] as const;
export type HourStemReferencePolicy = (typeof HOUR_STEM_REFERENCE_POLICIES)[number];

export interface ResolvedDayHourPillars {
  readonly effectiveDate: string;
  readonly dayPillar: GanZhi;
  readonly hourPillar: GanZhi;
  readonly dayRolloverPolicy: DayRolloverPolicy;
  readonly hourStemReferencePolicy: HourStemReferencePolicy;
}

export function resolveDayHourPillars(
  date: string,
  effectiveClock: string,
  dayRolloverPolicy: DayRolloverPolicy,
  hourStemReferencePolicy: HourStemReferencePolicy,
): ResolvedDayHourPillars {
  if (!HOUR_STEM_REFERENCE_POLICIES.includes(hourStemReferencePolicy)) {
    throw new RangeError("Unsupported HOUR_STEM_REFERENCE policy.");
  }
  const selectedDay = selectDayPillarByRollover(date, effectiveClock, dayRolloverPolicy);
  const civilDateDay = dayPillarForGregorianDate(date);
  const hourBranch = hourBranchForEffectiveClock(effectiveClock);
  const hourStemDay =
    hourStemReferencePolicy === "SELECTED_DAY_PILLAR"
      ? selectedDay.pillar
      : civilDateDay;

  return {
    effectiveDate: selectedDay.effectiveDate,
    dayPillar: selectedDay.pillar,
    hourPillar: hourPillarFromDayStem(hourStemDay.stem, hourBranch),
    dayRolloverPolicy,
    hourStemReferencePolicy,
  };
}
