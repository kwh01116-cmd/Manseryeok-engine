import { EARTHLY_BRANCHES, type EarthlyBranch } from "../domain/branches.js";
import { HEAVENLY_STEMS, type HeavenlyStem } from "../domain/stems.js";
import type { GanZhi } from "../domain/sexagenary.js";

export function hourPillarFromDayStem(dayStem: HeavenlyStem, hourBranch: EarthlyBranch): GanZhi {
  const dayStemIndex = HEAVENLY_STEMS.indexOf(dayStem);
  const hourBranchIndex = EARTHLY_BRANCHES.indexOf(hourBranch);
  const ziStemIndex = (dayStemIndex % 5) * 2;
  return {
    stem: HEAVENLY_STEMS[(ziStemIndex + hourBranchIndex) % 10]!,
    branch: hourBranch,
  };
}
