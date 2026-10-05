import { EARTHLY_BRANCHES, type EarthlyBranch } from "./branches.js";
import { HEAVENLY_STEMS, type HeavenlyStem } from "./stems.js";

export interface GanZhi {
  readonly stem: HeavenlyStem;
  readonly branch: EarthlyBranch;
}

export const SEXAGENARY_CYCLE: readonly GanZhi[] = Array.from({ length: 60 }, (_, index) => ({
  stem: HEAVENLY_STEMS[index % HEAVENLY_STEMS.length]!,
  branch: EARTHLY_BRANCHES[index % EARTHLY_BRANCHES.length]!,
}));

export function ganZhiAt(index: number): GanZhi {
  if (!Number.isInteger(index)) {
    throw new TypeError("Sexagenary index must be an integer.");
  }

  const normalized = ((index % 60) + 60) % 60;
  return SEXAGENARY_CYCLE[normalized]!;
}

export function ganZhiIndex(stem: HeavenlyStem, branch: EarthlyBranch): number | null {
  const index = SEXAGENARY_CYCLE.findIndex(
    (candidate) => candidate.stem === stem && candidate.branch === branch,
  );
  return index === -1 ? null : index;
}
