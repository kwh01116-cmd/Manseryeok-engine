import { dayPillarForGregorianDate } from "./dayPillar.js";
import { hourBranchForEffectiveClock } from "./hourPillar.js";
import type { GanZhi } from "../domain/sexagenary.js";

export const DAY_ROLLOVER_POLICIES = ["CIVIL_MIDNIGHT", "ZI_START"] as const;
export type DayRolloverPolicy = (typeof DAY_ROLLOVER_POLICIES)[number];

export interface SelectedDayPillar {
  readonly effectiveDate: string;
  readonly pillar: GanZhi;
  readonly policy: DayRolloverPolicy;
}

function nextGregorianDate(date: string): string {
  dayPillarForGregorianDate(date);
  const [year, month, day] = date.split("-").map(Number) as [number, number, number];
  const next = new Date(Date.UTC(year, month - 1, day + 1));
  const nextYear = next.getUTCFullYear();
  if (nextYear > 9999) {
    throw new RangeError("Rollover exceeds supported Gregorian date range.");
  }
  return `${String(nextYear).padStart(4, "0")}-${String(next.getUTCMonth() + 1).padStart(2, "0")}-${String(next.getUTCDate()).padStart(2, "0")}`;
}

export function selectDayPillarByRollover(
  date: string,
  effectiveClock: string,
  policy: DayRolloverPolicy,
): SelectedDayPillar {
  if (!DAY_ROLLOVER_POLICIES.includes(policy)) {
    throw new RangeError("Unsupported DAY_ROLLOVER policy.");
  }
  dayPillarForGregorianDate(date);
  hourBranchForEffectiveClock(effectiveClock);

  const effectiveDate =
    policy === "ZI_START" && effectiveClock >= "23:00"
      ? nextGregorianDate(date)
      : date;

  return {
    effectiveDate,
    pillar: dayPillarForGregorianDate(effectiveDate),
    policy,
  };
}
