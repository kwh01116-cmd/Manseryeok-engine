import { EARTHLY_BRANCHES, type EarthlyBranch } from "../domain/branches.js";
import { HEAVENLY_STEMS, type HeavenlyStem } from "../domain/stems.js";
import type { GanZhi } from "../domain/sexagenary.js";

const EFFECTIVE_CLOCK_RE = /^(\d{2}):(\d{2})$/;

export function hourBranchForEffectiveClock(value: string): EarthlyBranch {
  const match = EFFECTIVE_CLOCK_RE.exec(value);
  if (!match) {
    throw new TypeError("Effective clock time must use HH:MM format.");
  }

  const hour = Number(match[1]);
  const minute = Number(match[2]);
  if (hour > 23 || minute > 59) {
    throw new RangeError("Invalid effective clock time.");
  }

  const totalMinutes = hour * 60 + minute;
  const branchIndex =
    totalMinutes >= 23 * 60 || totalMinutes < 60
      ? 0
      : Math.floor((totalMinutes + 60) / 120);
  return EARTHLY_BRANCHES[branchIndex]!;
}

export function hourPillarFromDayStem(dayStem: HeavenlyStem, hourBranch: EarthlyBranch): GanZhi {
  const dayStemIndex = HEAVENLY_STEMS.indexOf(dayStem);
  const hourBranchIndex = EARTHLY_BRANCHES.indexOf(hourBranch);
  if (dayStemIndex < 0) throw new RangeError("Unsupported day stem.");
  if (hourBranchIndex < 0) throw new RangeError("Unsupported hour branch.");
  const ziStemIndex = (dayStemIndex % 5) * 2;
  return {
    stem: HEAVENLY_STEMS[(ziStemIndex + hourBranchIndex) % 10]!,
    branch: hourBranch,
  };
}
