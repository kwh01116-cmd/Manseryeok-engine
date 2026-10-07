import type { EarthlyBranch } from "../domain/branches.js";
import { HEAVENLY_STEMS, type HeavenlyStem } from "../domain/stems.js";
import type { GanZhi } from "../domain/sexagenary.js";
import type { SolarTermEvent } from "./solarTerms.js";
import { isGregorianMinute, validateKstMinuteSolarTermTimeline } from "./solarTermTimeline.js";

export const MONTH_BOUNDARY_JIE = [
  "LICHUN", "JINGZHE", "QINGMING", "LIXIA", "MANGZHONG", "XIAOSHU",
  "LIQIU", "BAILU", "HANLU", "LIDONG", "DAXUE", "XIAOHAN",
] as const;
export type MonthBoundaryJie = (typeof MONTH_BOUNDARY_JIE)[number];
export const MONTH_BRANCH_BY_JIE: Readonly<Record<MonthBoundaryJie, EarthlyBranch>> = {
  LICHUN: "寅", JINGZHE: "卯", QINGMING: "辰", LIXIA: "巳",
  MANGZHONG: "午", XIAOSHU: "未", LIQIU: "申", BAILU: "酉",
  HANLU: "戌", LIDONG: "亥", DAXUE: "子", XIAOHAN: "丑",
};

export type MonthBoundaryConfidence = "DEFINITE" | "PUBLISHED_MINUTE_AMBIGUOUS";
export interface MonthBranchResolution {
  readonly branchBeforeBoundary: EarthlyBranch;
  readonly branchAfterBoundary: EarthlyBranch;
  readonly selected?: EarthlyBranch;
  readonly confidence: MonthBoundaryConfidence;
  readonly activeJieBeforeBoundary: SolarTermEvent;
  readonly boundaryJie?: SolarTermEvent;
}

function isMonthBoundaryJie(event: SolarTermEvent): event is SolarTermEvent & { readonly term: MonthBoundaryJie } {
  return (MONTH_BOUNDARY_JIE as readonly string[]).includes(event.term);
}

export function resolveMonthBranchAtJie(
  events: readonly SolarTermEvent[],
  displayedDateTime: string,
): MonthBranchResolution {
  if (!isGregorianMinute(displayedDateTime)) throw new Error(`invalid Gregorian minute: ${displayedDateTime}`);
  validateKstMinuteSolarTermTimeline(events);
  const boundaries = events.filter(isMonthBoundaryJie);
  let previous: (typeof boundaries)[number] | undefined;
  for (const boundary of boundaries) {
    if (boundary.displayedDateTime > displayedDateTime) break;
    if (boundary.displayedDateTime === displayedDateTime) {
      if (!previous) throw new Error("missing previous month-boundary Jie fixture");
      return {
        branchBeforeBoundary: MONTH_BRANCH_BY_JIE[previous.term],
        branchAfterBoundary: MONTH_BRANCH_BY_JIE[boundary.term],
        confidence: "PUBLISHED_MINUTE_AMBIGUOUS",
        activeJieBeforeBoundary: previous,
        boundaryJie: boundary,
      };
    }
    previous = boundary;
  }
  if (!previous) throw new Error("missing previous month-boundary Jie fixture");
  const branch = MONTH_BRANCH_BY_JIE[previous.term];
  return {
    branchBeforeBoundary: branch, branchAfterBoundary: branch, selected: branch,
    confidence: "DEFINITE", activeJieBeforeBoundary: previous,
  };
}

const TIGER_START_INDEX: Readonly<Record<HeavenlyStem, number>> = {
  甲: 2, 己: 2, 乙: 4, 庚: 4, 丙: 6, 辛: 6, 丁: 8, 壬: 8, 戊: 0, 癸: 0,
};
const MONTH_BRANCHES: readonly EarthlyBranch[] = ["寅","卯","辰","巳","午","未","申","酉","戌","亥","子","丑"];
export function monthPillarFromYearStem(yearStem: HeavenlyStem, monthBranch: EarthlyBranch): GanZhi {
  const offset = MONTH_BRANCHES.indexOf(monthBranch);
  if (offset < 0) throw new Error(`unsupported month branch: ${monthBranch}`);
  return { stem: HEAVENLY_STEMS[(TIGER_START_INDEX[yearStem] + offset) % 10]!, branch: monthBranch };
}
