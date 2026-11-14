// Manseryeok-engine을 브라우저에서 쓰기 위한 얇은 접착층.
// 절기 시각(SolarTermEvent[])은 바깥에서 넣어 주고, 사주 계산은 전부 엔진 함수가 한다.
// build.mjs가 이 파일을 엔진 소스와 함께 묶어 index.html 안에 넣는다.
import { resolveYearMonthPillars } from "@engine/calendar/yearMonthPillars.js";
import { resolveDayHourPillars } from "@engine/calendar/dayHourPillars.js";
import { labelKoreanGanZhi } from "@engine/calendar/koreanBirthPreview.js";
import { KOREA_SOLAR_TERM_EVENTS_2026_2027 } from "@engine/calendar/koreaSolarTermFixtures.js";
import { SOLAR_TERM_CODES, type SolarTermEvent } from "@engine/calendar/solarTerms.js";
import { STEM_NATURE, type HeavenlyStem } from "@engine/domain/stems.js";
import { BRANCH_NATURE } from "@engine/domain/branches.js";
import { tenGod } from "@engine/domain/tenGods.js";
import { branchTenGodFacts } from "@engine/domain/branchTenGods.js";
import { HIDDEN_STEM_POLICY_V1 } from "@engine/domain/hiddenStems.js";
import { annualLuckYearLabel, M7_LUCK_POLICY_V01 } from "@engine/luck/luckV01.js";
import type { GanZhi } from "@engine/domain/sexagenary.js";

const DAY_ROLLOVER = "ZI_START" as const;            // 23시부터 다음 날 일진
const HOUR_STEM_REF = "SELECTED_DAY_PILLAR" as const;

function describe(dayMaster: HeavenlyStem, p: GanZhi, isDay: boolean) {
  const label = labelKoreanGanZhi(p);
  const main = branchTenGodFacts(dayMaster, p.branch, HIDDEN_STEM_POLICY_V1).members.find(m => m.position === "MAIN_QI");
  return {
    stem: p.stem, branch: p.branch, hanja: label.hanja, hangul: label.hangul,
    stemElement: STEM_NATURE[p.stem].element, stemPolarity: STEM_NATURE[p.stem].polarity,
    branchElement: BRANCH_NATURE[p.branch].principalElement,
    stemTenGod: isDay ? null : tenGod(dayMaster, p.stem),
    branchTenGod: main ? main.tenGod : null,
  };
}

/** birthMinute: "YYYY-MM-DDTHH:MM" 한국 시계 시각. hourKnown=false면 시주를 내지 않는다. */
export function chart(events: readonly SolarTermEvent[], birthMinute: string, hourKnown: boolean) {
  const ym = resolveYearMonthPillars(events, birthMinute);
  const dh = resolveDayHourPillars(birthMinute.slice(0, 10), birthMinute.slice(11), hourKnown ? DAY_ROLLOVER : "CIVIL_MIDNIGHT", HOUR_STEM_REF);
  const pick = ym.candidates[ym.candidates.length - 1]!;   // 절입 분과 겹치면 절입 이후 쪽
  const dm = dh.dayPillar.stem;
  return {
    confidence: ym.confidence,
    effectiveDayDate: dh.effectiveDate,
    policies: { dayRollover: dh.dayRolloverPolicy, hourStemReference: dh.hourStemReferencePolicy },
    dayMaster: dm,
    year: describe(dm, pick.year, false),
    month: describe(dm, pick.month, false),
    day: describe(dm, dh.dayPillar, true),
    hour: hourKnown ? describe(dm, dh.hourPillar, false) : null,
  };
}

/** 세운: 그 해의 간지와, 일간 기준 천간 십성. */
export function annual(dayMaster: HeavenlyStem, year: number) {
  const r = annualLuckYearLabel(year, M7_LUCK_POLICY_V01);
  const label = labelKoreanGanZhi(r.pillar);
  return { year, hanja: label.hanja, hangul: label.hangul, tenGod: tenGod(dayMaster, r.pillar.stem) };
}

export const TERM_CODES = SOLAR_TERM_CODES;
export const KASI_FIXTURE_2026_2027 = KOREA_SOLAR_TERM_EVENTS_2026_2027;
