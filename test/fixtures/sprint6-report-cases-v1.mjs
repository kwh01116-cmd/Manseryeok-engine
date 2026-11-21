/**
 * Sprint 6 pre-resolver content contracts. All dates are fictional examples.
 * Literal expectations come from previously fixed calendar/M4/M5/DST contracts
 * and manual inspection of their selected tables, never the new report resolver.
 * This is internal policy/connection verification, not expert or prediction truth.
 */
export const SPRINT6_REPORT_CASE_BASIS = {
  version: '1.0.0',
  fixedBeforeConsumerReportResolver: true,
  inputKind: 'FICTIONAL_BIRTH_INFORMATION_NOT_CUSTOMER_RECORDS',
  newAstronomicalOrClassicalAccuracyClaim: false,
  fullPaidReportReadiness: false,
  sourceRefs: [
    'test/fixtures/inner-pattern-real-case-contracts-v1.json',
    'test/fixtures/m4-diverse-month-contracts-v1.mjs',
    'test/fixtures/m4-zhengguan-structure-cases.mjs',
    'test/fixtures/m3-limited-synthesis-cases.mjs',
    'test/fixtures/m5-limited-purpose-cases-v1.mjs',
    'test/fixtures/sprint4-real-birth-contracts-v1.mjs',
    'test/fixtures/korean-dst1987-clock-cases.mjs',
    'docs/engineering/SPRINT3_PRODUCT_ANALYSIS_EXECUTION_20261114.md',
    'docs/engineering/SPRINT5_EXECUTION_20261115.md',
  ],
  mustNotInfer: [
    'PAID_REPORT_FULLY_READY', 'PERSONALITY_FROM_ELEMENT_COUNTS',
    'SEASONAL_WANG_MEANS_STRONG', 'ROOT_PRESENCE_MEANS_ROOT_FORCE',
    'PATTERN_CANDIDATE_MEANS_FORMED_PATTERN', 'M5_FIRE_IS_FINAL_YONGSHEN',
    'LUCK_PILLAR_MEANS_FUTURE_EVENT', 'HOLD_IS_NEUTRAL_OR_NEGATIVE_VERDICT',
    'INTERNAL_TESTS_ARE_HUMAN_EXPERT_OR_PREDICTIVE_VALIDATION',
  ],
};

const M = 'kasi-api-1989-2026-local-v1';
const H = 'kasi-api-1962-1986-standard-local-v1';
const D = 'kasi-api-1987-1988-dst-local-v1';
const F = 'kasi-api-1989-2027-solar-local-v1';
const clocks = {
  [M]: 'KR_API_PUBLISHED_KST_MODERN_1988_POST_DST_V1',
  [H]: 'KR_API_PUBLISHED_KST_HISTORICAL_1962_1986_NO_DST_V1',
  [D]: 'KR_API_PUBLISHED_KST_DST_1987_1988_STANDARD_REFERENCE_V1',
  [F]: 'KR_API_PUBLISHED_KST_MODERN_1989_2027_NO_DST_V2',
};
function request(date, time, profile = M, options = {}) {
  return {
    schemaVersion: 'manseryeok-server-analysis-request-v1',
    analysisProfileId: 'KASI-SERVER-API-ONLY-ANALYSIS-V01',
    calendarProfileId: profile,
    jurisdiction: 'KR', timeZone: 'Asia/Seoul', calendar: 'GREGORIAN', date, time,
    policies: {
      clockPolicyId: clocks[profile], dayRollover: 'CIVIL_MIDNIGHT',
      hourStemReference: 'SELECTED_DAY_PILLAR',
      ...(profile === D ? {dayHourReference: 'STANDARD_KST'} : {}),
    },
    ...options,
  };
}
const OK = 'CALCULATED_UNDER_SELECTED_POLICIES';
const completeInput = {canProvideTimedReport: true, fullPaidReport: false};
const noTimedReport = {canProvideTimedReport: false, fullPaidReport: false};
const m5 = (status, reason, elements = []) => ({status, reason, elements});
const outsideM5 = () => m5('HOLD', 'OUTSIDE_WINTER_WOOD_SCOPE');

export const SPRINT6_REPORT_CASES = [
  {
    id: 'WINTER_WOOD_CANDIDATE', request: request('1992-11-24', '00:30'),
    sourceRefs: ['docs/engineering/SPRINT3_PRODUCT_ANALYSIS_EXECUTION_20261114.md', 'test/fixtures/m5-limited-purpose-cases-v1.mjs'],
    expected: {status: OK, natalParents: 1, pillars: [['壬申', '辛亥', '甲辰', '甲子']], dayStem: '甲', monthBranch: '亥', primaryPattern: '偏印', m5: m5('CANDIDATE_UNDER_POLICY', 'WINTER_WOOD_WITHOUT_OBSERVED_FIRE_REVIEW_CANDIDATE', ['FIRE']), seasonalStates: ['XIANG'], ...completeInput},
    requiredDistinction: 'A narrow warming-review candidate can be explained while overall strength and final useful-god remain held.',
    mustNotInfer: ['NEED_TO_ADD_FIRE_IN_REAL_LIFE', 'FINAL_YONGSHEN_FIRE', 'COLD_IS_MEASURED', 'CAREER_OR_HEALTH_FORECAST'],
  },
  {
    id: 'WINTER_WOOD_PRESENT_FIRE_HOLD', request: request('1992-11-24', '12:00'),
    sourceRefs: ['docs/engineering/SPRINT3_PRODUCT_ANALYSIS_EXECUTION_20261114.md', 'test/fixtures/m5-limited-purpose-cases-v1.mjs'],
    expected: {status: OK, natalParents: 1, pillars: [['壬申', '辛亥', '甲辰', '庚午']], dayStem: '甲', monthBranch: '亥', primaryPattern: '偏印', m5: m5('HOLD', 'PRESENT_WARMING_ELEMENT_EFFECT_UNASSESSED'), seasonalStates: ['XIANG'], ...completeInput},
    manualDerivation: 'For 甲 day, 午 hour is 庚午 under the existing Five Rats table. 午 contains 丁 in the selected hidden-stem policy, so the existing FIRE adoption guard holds; the new report does not derive this expectation.',
    requiredDistinction: 'Same day/month as the night example, but the changed hour introduces observed hidden FIRE and changes the actual M5 policy result.',
    mustNotInfer: ['FIRE_EXCESS', 'FIRE_IS_SUFFICIENT', 'NO_HELPFUL_ELEMENT_EXISTS', 'HOLD_MEANS_BAD_CHART'],
  },
  {
    id: 'MONTH_MAIN_OFFICER', request: request('2026-01-08', '12:00'),
    sourceRefs: ['test/fixtures/inner-pattern-real-case-contracts-v1.json'],
    expected: {status: OK, natalParents: 1, pillars: [['乙巳', '己丑', '壬午', '丙午']], dayStem: '壬', monthBranch: '丑', primaryPattern: '正官', exactMainExposureRoles: ['month'], m5: outsideM5(), ...completeInput},
    requiredDistinction: '月令 MAIN 己 is 正官 for 壬 and exactly repeats at the month surface. Explain why the structural anchor exists rather than predicting obedience or rank.',
    mustNotInfer: ['FORMED_OFFICER_PATTERN', 'GOOD_CAREER', 'OBEDIENT_PERSONALITY', 'WEALTH_OR_RESOURCE_EFFICACY'],
  },
  {
    id: 'MONTH_MAIN_DIRECT_WEALTH', request: request('2026-01-04', '12:00'),
    sourceRefs: ['test/fixtures/inner-pattern-real-case-contracts-v1.json'],
    expected: {status: OK, natalParents: 1, pillars: [['乙巳', '戊子', '戊寅', '戊午']], dayStem: '戊', monthBranch: '子', primaryPattern: '正財', exactMainExposureRoles: [], m5: outsideM5(), ...completeInput},
    requiredDistinction: '子月 MAIN 癸 is 正財 for 戊 but is not a surface stem. A wealth label is a relational classification, not evidence that money will arrive.',
    mustNotInfer: ['RICHNESS', 'GOOD_FINANCIAL_DECISIONS', 'FORMED_WEALTH_PATTERN', 'MISSING_VISIBLE_WEALTH_MEANS_NO_HIDDEN_WEALTH'],
  },
  {
    id: 'LICHUN_CORRELATED_NATAL_PARENTS', request: request('2026-02-04', '05:02'),
    sourceRefs: ['test/fixtures/m4-inner-pattern-cases-v1.mjs', 'test/fixtures/m3-limited-synthesis-cases.mjs'],
    expected: {status: OK, natalParents: 2, pillars: [['乙巳', '己丑', '己酉', '丁卯'], ['丙午', '庚寅', '己酉', '丁卯']], dayStem: '己', monthBranches: ['丑', '寅'], primaryPatterns: [null, '正官'], seasonalStates: ['WANG', 'SI'], seasonalAlternativesPerParent: [1, 1], ...completeInput},
    requiredDistinction: 'Two existing natal candidates have correlated year/month pillars; the before parent is peer-main out of scope while the after parent has the officer structure.',
    mustNotInfer: ['FIRST_PARENT_SELECTED', 'FOUR_CANDIDATE_CROSS_PRODUCT', 'BEFORE_STRONG_AFTER_WEAK', 'CANDIDATE_PROBABILITY'],
  },
  {
    id: 'DERIVED_EARTH_SEASON_BOUNDARY', request: request('2026-04-17', '20:49'),
    sourceRefs: ['test/fixtures/m4-zhengguan-structure-cases.mjs', 'test/fixtures/m3-limited-synthesis-cases.mjs'],
    expected: {status: OK, natalParents: 1, pillars: [['丙午', '壬辰', '辛酉', '戊戌']], dayStem: '辛', monthBranch: '辰', primaryPattern: '正印', seasonalAlternativesPerParent: [2], seasonalStates: ['QIU', 'XIANG'], m5: outsideM5(), ...completeInput},
    manualDerivation: 'For 辛 day the 辰 MAIN 戊 is 正印. Spring METAL is 囚; earth-dominant METAL is 相. The 18-day boundary changes the seasonal policy path, not the natal pillars.',
    requiredDistinction: 'One natal chart, one root assessment and two conditional seasonal readings. No second person or new month pillar is generated.',
    mustNotInfer: ['NEW_NATAL_PARENT_AT_B', 'ROOTS_CHANGE_WITH_SEASONAL_ALTERNATIVE', 'AUTOMATIC_SUPPORT_STRENGTH', 'EXACT_SECONDS_OR_PROBABILITY'],
  },
  {
    id: 'DST_NONEXISTENT_CIVIL_TIME', request: request('1988-05-08', '02:30', D),
    sourceRefs: ['test/fixtures/korean-dst1987-clock-cases.mjs'],
    expected: {status: 'NONEXISTENT_TIME', natalParents: 0, ...noTimedReport, needsAdditionalInformation: true},
    requiredDistinction: 'The recorded wall time lies inside the spring gap. Ask for corrected birth-time information; do not move it to 03:30 or invent a chart.',
    mustNotInfer: ['CALCULATED_NATAL_CHART', 'TIME_AUTOMATICALLY_SHIFTED', 'CHARACTER_OR_FORTUNE_CLAIMS'],
  },
  {
    id: 'DST_AMBIGUOUS_CIVIL_TIME', request: request('1988-10-09', '02:30', D),
    sourceRefs: ['test/fixtures/korean-dst1987-clock-cases.mjs'],
    expected: {status: 'AMBIGUOUS_TIME', natalParents: 0, civilOffsetAlternatives: 2, ...noTimedReport, needsAdditionalInformation: true},
    requiredDistinction: 'Two UTC/offset mappings require explicit offset evidence even when both could happen to yield identical pillars.',
    mustNotInfer: ['DEFAULT_FIRST_OFFSET', 'SAME_PILLARS_ERASE_TIME_AMBIGUITY', 'PAID_FULL_REPORT_READY'],
  },
  {
    id: 'SPRING_EARTH_WITH_OFFICER_CONTEXT', request: request('2026-03-15', '12:00'),
    sourceRefs: ['test/fixtures/m4-diverse-month-contracts-v1.mjs'],
    expected: {status: OK, natalParents: 1, pillars: [['丙午', '辛卯', '戊子', '戊午']], dayStem: '戊', monthBranch: '卯', primaryPattern: '正官', seasonalStates: ['SI'], m5: outsideM5(), ...completeInput},
    requiredDistinction: 'Spring earth seasonal 死 and a structural officer candidate coexist; neither classification supplies final weakness or a personal misfortune.',
    mustNotInfer: ['SEASONAL_SI_MEANS_DEATH', 'OFFICER_STRUCTURE_OVERRIDES_STRENGTH_HOLD', 'WEAK_FROM_SEASON_ALONE'],
  },
  {
    id: 'SUMMER_FIRE_AND_EXPLICIT_TIME_AXIS', request: request('2026-06-01', '12:00', M, {
      luckOptions: {luckPolicyId: 'M7-TRADITIONAL-YEAR-STEM-JIE-3D-V01', features: {dayun: {traditionalSex: 'MALE', count: 3}, seyun: {yearLabel: 2026}}},
      monthlyOptions: {policyId: 'M7-MONTHLY-TWELVE-JIE-PUBLISHED-MINUTE-V01', year: 2025},
    }),
    sourceRefs: ['docs/engineering/SPRINT5_EXECUTION_20261115.md', 'docs/engineering/SPRINT3_PRODUCT_ANALYSIS_EXECUTION_20261114.md'],
    expected: {status: OK, natalParents: 1, pillars: [['丙午', '癸巳', '丙午', '甲午']], dayStem: '丙', monthBranch: '巳', primaryPattern: null, mainTenGod: '比肩', patternSelection: 'PEER_MAIN_OUT_OF_SCOPE', seasonalStates: ['WANG'], m5: outsideM5(), explicitDayunCount: 3, explicitSeyunYear: 2026, completeMonthlyYear: 2025, ...completeInput},
    manualDerivation: '巳 MAIN 丙 equals the 丙 day stem, so peer-main is outside the selected eight inner patterns. A selected calendar time-axis is not a future-event interpretation.',
    requiredDistinction: 'Summer fire 旺, exact/same-element hidden roots and peer-main exclusion are read alongside explicit luck data without a hidden strong verdict.',
    mustNotInfer: ['WANG_PLUS_ROOT_EQUALS_STRONG', 'FORCED_INNER_PATTERN', 'FUTURE_EVENTS_FROM_GANZHI', 'UNREQUESTED_CURRENT_AS_OF'],
  },
  {
    id: 'AUTUMN_WATER_RESOURCE_STRUCTURE', request: request('2026-09-15', '12:00'),
    sourceRefs: ['test/fixtures/m4-diverse-month-contracts-v1.mjs'],
    expected: {status: OK, natalParents: 1, pillars: [['丙午', '丁酉', '壬辰', '丙午']], dayStem: '壬', monthBranch: '酉', primaryPattern: '正印', seasonalStates: ['XIANG'], m5: outsideM5(), ...completeInput},
    requiredDistinction: '酉辛 is 正印 for 壬; resource structure and autumn seasonal 相 are not proof that support actually reaches the day stem.',
    mustNotInfer: ['RESOURCE_PRESENT_MEANS_EFFECTIVE_SUPPORT', 'RESOURCE_STRUCTURE_MEANS_HIGH_INTELLIGENCE', 'SEASONAL_XIANG_MEANS_STRONG'],
  },
  {
    id: 'HISTORICAL_STABLE_CLOCK', request: request('1962-06-01', '12:00', H),
    sourceRefs: ['test/fixtures/sprint4-real-birth-contracts-v1.mjs'],
    expected: {status: OK, natalParents: 1, pillars: [['壬寅', '乙巳', '庚午', '壬午']], dayStem: '庚', monthBranch: '巳', primaryPattern: '七殺', m5Execution: 'NOT_EXECUTED_CLOCK_SCOPE_DEPENDENCY', ...completeInput},
    requiredDistinction: 'A supported historical natal chart can retain the M5 clock dependency hold; birth support does not widen every interpretation policy.',
    mustNotInfer: ['MODERN_CLOCK_SILENT_FALLBACK', 'M5_CLOCK_SCOPE_AUTOMATIC_EXPANSION', 'SEVEN_KILLINGS_MEANS_DANGER'],
  },
  {
    id: 'HISTORICAL_DST_PREVIOUS_STANDARD_DATE', request: request('1987-06-01', '00:30', D),
    sourceRefs: ['docs/engineering/SPRINT5_EXECUTION_20261115.md', 'test/fixtures/korean-dst1987-clock-cases.mjs'],
    expected: {status: OK, natalParents: 1, pillars: [['丁卯', '乙巳', '庚辰', '丙子']], dayStem: '庚', monthBranch: '巳', primaryPattern: '七殺', normalizedStandardMinute: '1987-05-31T23:30', m5Execution: 'NOT_EXECUTED_CLOCK_SCOPE_DEPENDENCY', ...completeInput},
    requiredDistinction: 'The recorded civil date and standard reference date differ. Keep both and apply the existing day/hour policy to the chosen standard reference.',
    mustNotInfer: ['DISPLAY_CIVIL_TIME_AS_STANDARD_TIME', 'APPLY_DST_TWICE', 'INVENTED_TRUE_SOLAR_TIME'],
  },
  {
    id: 'FUTURE_SOLAR_PARTIAL_DATA', request: request('2027-06-01', '12:00', F, {monthlyOptions: {policyId: 'M7-MONTHLY-TWELVE-JIE-PUBLISHED-MINUTE-EXTENDED-2027-V02', year: 2027}}),
    sourceRefs: ['test/fixtures/sprint4-real-birth-contracts-v1.mjs', 'docs/engineering/SPRINT5_EXECUTION_20261115.md'],
    expected: {status: OK, natalParents: 1, pillars: [['丁未', '乙巳', '辛亥', '甲午']], dayStem: '辛', monthBranch: '巳', primaryPattern: '正官', monthlyResolved: 10, monthlyNeedsData: 2, m5Execution: 'NOT_EXECUTED_CLOCK_SCOPE_DEPENDENCY', ...completeInput},
    requiredDistinction: 'A solar chart exists while a lunar conversion and the last two 2027 month interval boundaries are unavailable.',
    mustNotInfer: ['2027_LUNAR_SUPPORTED', 'TWELVE_MONTH_INTERVALS_COMPLETE', '2028_BIRTH_SUPPORTED'],
  },
  {
    id: 'FUTURE_LUNAR_NEEDS_DATA',
    request: (() => {const r = request('2027-02-06', '12:00', F);delete r.date;r.calendar = 'KOREAN_LUNAR';r.lunarDate = {lunarYear: 2027, lunarMonth: 1, lunarDay: 1, leap: false};return r;})(),
    sourceRefs: ['docs/engineering/SPRINT5_EXECUTION_20261115.md'],
    expected: {status: 'NEEDS_DATA', natalParents: 0, ...noTimedReport, needsAdditionalInformation: false},
    requiredDistinction: 'Data is missing, rather than the customer being required to guess a lunar-to-solar conversion or a clock offset.',
    mustNotInfer: ['FALLBACK_TO_EXTERNAL_FIXTURE', 'INVENTED_SOLAR_DATE', 'DATA_SHORTAGE_AS_NEGATIVE_INTERPRETATION'],
  },
  {
    id: 'UNKNOWN_TIME_REQUIRES_INFORMATION', request: request('2026-06-01', null),
    sourceRefs: ['docs/contracts/SERVER_INTEGRATION_DTO_V01.md'],
    expected: {status: 'NEEDS_BIRTH_TIME', natalParents: 0, ...noTimedReport, needsAdditionalInformation: true},
    requiredDistinction: 'Unknown time remains unknown. No timed chart, noon default, or hour-dependent claims can be sold as complete.',
    mustNotInfer: ['DEFAULT_NOON', 'DEFAULT_MIDNIGHT', 'FULL_EIGHT_CHARACTER_CHART'],
  },
  {
    id: 'UNSUPPORTED_1954_CLOCK', request: request('1954-03-21', '00:15', H),
    sourceRefs: ['docs/engineering/SPRINT5_EXECUTION_20261115.md'],
    expected: {status: 'POLICY_UNRESOLVED', natalParents: 0, ...noTimedReport, needsAdditionalInformation: false},
    requiredDistinction: 'A deliberately unsupported historical clock cannot be repaired by inventing a Korean modern offset or consumer narrative.',
    mustNotInfer: ['MODERN_KST_FOR_1954', 'PAID_FULL_REPORT_READY', 'GENERATED_NATAL_INTERPRETATION'],
  },
];

function freeze(value) {
  if (value && typeof value === 'object') {
    Object.values(value).forEach(freeze);
    Object.freeze(value);
  }
  return value;
}
freeze(SPRINT6_REPORT_CASE_BASIS);
freeze(SPRINT6_REPORT_CASES);
