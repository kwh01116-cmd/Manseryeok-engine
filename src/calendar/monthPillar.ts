import type { EarthlyBranch } from "../domain/branches.js";
import { HEAVENLY_STEMS, type HeavenlyStem } from "../domain/stems.js";
import type { GanZhi } from "../domain/sexagenary.js";

export const MONTH_BOUNDARY_JIE = [
  "LICHUN", "JINGZHE", "QINGMING", "LIXIA", "MANGZHONG", "XIAOSHU",
  "LIQIU", "BAILU", "HANLU", "LIDONG", "DAXUE", "XIAOHAN",
] as const;

export type MonthBoundaryJie = (typeof MONTH_BOUNDARY_JIE)[number];

export const MONTH_BRANCH_BY_JIE: Readonly<Record<MonthBoundaryJie, EarthlyBranch>> = {
  LICHUN: "寅",
  JINGZHE: "卯",
  QINGMING: "辰",
  LIXIA: "巳",
  MANGZHONG: "午",
  XIAOSHU: "未",
  LIQIU: "申",
  BAILU: "酉",
  HANLU: "戌",
  LIDONG: "亥",
  DAXUE: "子",
  XIAOHAN: "丑",
};

// Traditional 五虎遁 / 年上起月 mapping. This is only the deterministic
// stem derivation after the active 節 month has been established elsewhere.
const TIGER_START_INDEX: Readonly<Record<HeavenlyStem, number>> = {
  甲: 2, 己: 2,
  乙: 4, 庚: 4,
  丙: 6, 辛: 6,
  丁: 8, 壬: 8,
  戊: 0, 癸: 0,
};

const MONTH_BRANCHES: readonly EarthlyBranch[] = [
  "寅", "卯", "辰", "巳", "午", "未", "申", "酉", "戌", "亥", "子", "丑",
];

export function monthPillarFromYearStem(
  yearStem: HeavenlyStem,
  monthBranch: EarthlyBranch,
): GanZhi {
  const offset = MONTH_BRANCHES.indexOf(monthBranch);
  if (offset < 0) throw new Error(`unsupported month branch: ${monthBranch}`);
  return {
    stem: HEAVENLY_STEMS[(TIGER_START_INDEX[yearStem] + offset) % 10]!,
    branch: monthBranch,
  };
}
