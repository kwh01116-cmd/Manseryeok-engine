/**
 * Fictional real-date integration contracts, fixed before Sprint 7 target output.
 * Existing Sprint 6 examples are kept verbatim. Additional pillar/month facts are
 * literals from accepted pre-S7 M1/M2/M4 fixtures; domain expectations are manual
 * applications of the separately fixed S7 project decision table, not prediction.
 */
import {SPRINT6_REPORT_CASES} from './sprint6-report-cases-v1.mjs';

export const SPRINT7_REAL_CASE_BASIS = {
  version:'1.0.0',fixedBeforeFirstInterpretationExecution:true,decisionTableFixedBeforeResolver:true,
  kind:'FICTIONAL_BIRTH_INFORMATION_NOT_CUSTOMER_RECORDS',
  calendarOracle:'PRIOR_ACCEPTED_M1_M2_M4_CONTRACTS_NOT_EXTERNAL_ASTRONOMICAL_CERTIFICATION',
  interpretationOracle:'MANUAL_LITERAL_APPLICATION_OF_SEPARATELY_FIXED_PROJECT_DECISION_TABLE',
  policyRefs:['S7-SYMBOLIC-BEHAVIOR-ROLE-V01','S7-SYMBOLIC-COMMUNICATION-PAIR-V01','S7-SYMBOLIC-WORK-PROCESS-V01','S7-SYMBOLIC-WEALTH-CHOICE-V01'],policyVersion:'0.1.0',
  sourceRefs:['test/fixtures/sprint6-report-cases-v1.mjs','test/fixtures/m4-diverse-month-contracts-v1.mjs','test/fixtures/inner-pattern-real-case-contracts-v1.json','docs/product/SPRINT7_INTERPRETATION_POLICY_V01.md'],
  domainOrder:['BEHAVIOR','COMMUNICATION','WORK','MONEY'],
  mustNotInfer:['ACTUAL_PERSONALITY','PREDICTIVE_ACCURACY','PAID_REPORT_READY','PATTERN_FORMED_OR_BROKEN','STRENGTH_FROM_SEASON_OR_ROOT','FINAL_USEFUL_GOD','FUTURE_EVENT_FROM_TIME_AXIS'],
};

const request=(date,time='12:00')=>({
  schemaVersion:'manseryeok-server-analysis-request-v1',analysisProfileId:'KASI-SERVER-API-ONLY-ANALYSIS-V01',
  calendarProfileId:'kasi-api-1989-2026-local-v1',jurisdiction:'KR',timeZone:'Asia/Seoul',calendar:'GREGORIAN',date,time,
  policies:{clockPolicyId:'KR_API_PUBLISHED_KST_MODERN_1988_POST_DST_V1',dayRollover:'CIVIL_MIDNIGHT',hourStemReference:'SELECTED_DAY_PILLAR'},
});
const OK='CALCULATED_UNDER_SELECTED_POLICIES';

export const SPRINT7_ADDITIONAL_REPORT_CASES = [
  {id:'DIVERSE-YIN-WOOD-RESOURCE',request:request('2026-01-01'),expected:{status:OK,natalParents:1,pillars:[['乙巳','戊子','乙亥','壬午']],dayStem:'乙',monthBranch:'子',primaryPattern:'偏印',canProvideTimedReport:true,fullPaidReport:false},sourceRefs:['test/fixtures/inner-pattern-real-case-contracts-v1.json'],reason:'Adds 乙 day/master and unexposed resource month, visible peer/wealth contrast.'},
  {id:'DIVERSE-YIN-FIRE-KILLING',request:request('2026-01-03'),expected:{status:OK,natalParents:1,pillars:[['乙巳','戊子','丁丑','丙午']],dayStem:'丁',monthBranch:'子',primaryPattern:'七殺',canProvideTimedReport:true,fullPaidReport:false},sourceRefs:['test/fixtures/inner-pattern-real-case-contracts-v1.json'],reason:'Hidden monthly killing and visible resource/output do not supply the same behavior premise.'},
  {id:'DIVERSE-INDIRECT-WEALTH',request:request('2026-01-05'),expected:{status:OK,natalParents:1,pillars:[['乙巳','戊子','己卯','庚午']],dayStem:'己',monthBranch:'子',primaryPattern:'偏財',canProvideTimedReport:true,fullPaidReport:false},sourceRefs:['test/fixtures/inner-pattern-real-case-contracts-v1.json'],reason:'Wealth month remains hidden; same date neighborhood as direct wealth is not the same visible pair structure.'},
  {id:'DIVERSE-RESOURCE-EXACT-EXPOSURE',request:request('2026-01-06'),expected:{status:OK,natalParents:1,pillars:[['乙巳','己丑','庚辰','壬午']],dayStem:'庚',monthBranch:'丑',primaryPattern:'正印',exactMainExposureRoles:['month'],canProvideTimedReport:true,fullPaidReport:false},sourceRefs:['test/fixtures/inner-pattern-real-case-contracts-v1.json'],reason:'Main resource exact month exposure plus visible wealth/output contrast.'},
  {id:'DIVERSE-HURTING-OFFICER',request:request('2026-01-12'),expected:{status:OK,natalParents:1,pillars:[['乙巳','己丑','丙戌','甲午']],dayStem:'丙',monthBranch:'丑',primaryPattern:'傷官',exactMainExposureRoles:['month'],canProvideTimedReport:true,fullPaidReport:false},sourceRefs:['test/fixtures/inner-pattern-real-case-contracts-v1.json'],reason:'Exact main output role is not a claim of actual defiance or communication talent.'},
  {id:'DIVERSE-FOOD-GOD',request:request('2026-01-13'),expected:{status:OK,natalParents:1,pillars:[['乙巳','己丑','丁亥','丙午']],dayStem:'丁',monthBranch:'丑',primaryPattern:'食神',exactMainExposureRoles:['month'],canProvideTimedReport:true,fullPaidReport:false},sourceRefs:['test/fixtures/inner-pattern-real-case-contracts-v1.json'],reason:'Food/output month differs from neighboring hurt/output without claiming different real personalities.'},
  {id:'OTHER-EXPOSED-WITH-PEER-MAIN',request:request('2026-02-09'),expected:{status:OK,natalParents:1,pillars:[['丙午','庚寅','甲寅','庚午']],dayStem:'甲',monthBranch:'寅',primaryPattern:null,mainTenGod:'比肩',patternSelection:'PEER_MAIN_WITH_EXPOSED_OTHER_UNRESOLVED',canProvideTimedReport:true,fullPaidReport:false},sourceRefs:['test/fixtures/m4-diverse-month-contracts-v1.mjs'],reason:'OTHER 丙食神 is exact at year but cannot replace the peer-main behavior condition.'},
  {id:'SPRING-WEALTH-KILLING-COMPETITION',request:request('2026-02-15'),expected:{status:OK,natalParents:1,pillars:[['丙午','庚寅','庚申','壬午']],dayStem:'庚',monthBranch:'寅',primaryPattern:'偏財',competingTypes:['七殺'],canProvideTimedReport:true,fullPaidReport:false},sourceRefs:['test/fixtures/m4-diverse-month-contracts-v1.mjs'],reason:'OTHER killing exposed while main wealth is unexposed; not an exact main behavior lens.'},
  {id:'EARTH-MONTH-PEER-MAIN',request:request('2026-04-15'),expected:{status:OK,natalParents:1,pillars:[['丙午','壬辰','己未','庚午']],dayStem:'己',monthBranch:'辰',primaryPattern:null,mainTenGod:'劫財',patternSelection:'PEER_MAIN_OUT_OF_SCOPE',canProvideTimedReport:true,fullPaidReport:false},sourceRefs:['test/fixtures/m4-diverse-month-contracts-v1.mjs'],reason:'Peer main blocks the monthly behavior profile while valid resource/output/wealth role contrasts remain.'},
  {id:'SUMMER-RESOURCE-OUTPUT-COMPETITION',request:request('2026-05-15'),expected:{status:OK,natalParents:1,pillars:[['丙午','癸巳','己丑','庚午']],dayStem:'己',monthBranch:'巳',primaryPattern:'正印',exactMainExposureRoles:['year'],competingTypes:['傷官'],canProvideTimedReport:true,fullPaidReport:false},sourceRefs:['test/fixtures/m4-diverse-month-contracts-v1.mjs'],reason:'Both exact main 印 and OTHER 庚 output remain observable; no 梟奪食 efficacy.'},
  {id:'WU-OTHER-JI-COMPATIBILITY-HELD',request:request('2026-06-15'),expected:{status:OK,natalParents:1,pillars:[['丙午','甲午','庚申','壬午']],dayStem:'庚',monthBranch:'午',primaryPattern:'正官',unresolvedTypes:['正印'],canProvideTimedReport:true,fullPaidReport:false},sourceRefs:['test/fixtures/m4-diverse-month-contracts-v1.mjs'],reason:'午 OTHER 己 source compatibility stays unresolved; surface output/wealth/control pair facts do not resolve it.'},
  {id:'WEI-RESOURCE-WEALTH-COMPETITION',request:request('2026-07-15'),expected:{status:OK,natalParents:1,pillars:[['丙午','乙未','庚寅','壬午']],dayStem:'庚',monthBranch:'未',primaryPattern:'正印',competingTypes:['正財'],canProvideTimedReport:true,fullPaidReport:false},sourceRefs:['test/fixtures/m4-diverse-month-contracts-v1.mjs'],reason:'Main 己印 is unexposed and OTHER 乙財 is exact; do not select a dominant character.'},
  {id:'AUTUMN-METAL-PEER-MAIN',request:request('2026-08-15'),expected:{status:OK,natalParents:1,pillars:[['丙午','丙申','辛酉','甲午']],dayStem:'辛',monthBranch:'申',primaryPattern:null,mainTenGod:'劫財',patternSelection:'PEER_MAIN_OUT_OF_SCOPE',canProvideTimedReport:true,fullPaidReport:false},sourceRefs:['test/fixtures/m4-diverse-month-contracts-v1.mjs'],reason:'Two surface 丙 官 positions retain separate wealth/control role locations without double force scoring.'},
  {id:'AUTUMN-KILLING-EXACT-MONTH',request:request('2026-10-15'),expected:{status:OK,natalParents:1,pillars:[['丙午','戊戌','壬戌','丙午']],dayStem:'壬',monthBranch:'戌',primaryPattern:'七殺',exactMainExposureRoles:['month'],canProvideTimedReport:true,fullPaidReport:false},sourceRefs:['test/fixtures/m4-diverse-month-contracts-v1.mjs'],reason:'Exact main control role and two distinct wealth witnesses do not establish actual stress or career effects.'},
  {id:'WINTER-YIN-WATER-PEER-MAIN',request:request('2026-11-15'),expected:{status:OK,natalParents:1,pillars:[['丙午','己亥','癸巳','戊午']],dayStem:'癸',monthBranch:'亥',primaryPattern:null,mainTenGod:'劫財',patternSelection:'PEER_MAIN_OUT_OF_SCOPE',canProvideTimedReport:true,fullPaidReport:false},sourceRefs:['test/fixtures/m4-diverse-month-contracts-v1.mjs'],reason:'Winter 癸 is outside winter-wood M5, and wealth/control symbolic choice differs from a warming prescription.'},
  {id:'WINTER-ZI-PEER-MAIN',request:request('2026-12-15'),expected:{status:OK,natalParents:1,pillars:[['丙午','庚子','癸亥','戊午']],dayStem:'癸',monthBranch:'子',primaryPattern:null,mainTenGod:'比肩',patternSelection:'PEER_MAIN_OUT_OF_SCOPE',canProvideTimedReport:true,fullPaidReport:false},sourceRefs:['test/fixtures/m4-diverse-month-contracts-v1.mjs'],reason:'Adds 子 and control/resource work comparison in a peer-main chart.'},
  {id:'DERIVED-EARTH-BOUNDARY-BEFORE',request:request('2026-04-17','20:48'),expected:{status:OK,natalParents:1,pillars:[['丙午','壬辰','辛酉','戊戌']],dayStem:'辛',monthBranch:'辰',primaryPattern:'正印',seasonalAlternativesPerParent:[1],seasonalStates:['QIU'],canProvideTimedReport:true,fullPaidReport:false},sourceRefs:['test/fixtures/sprint6-report-cases-v1.mjs'],reason:'One minute before the fixed B at20:49; same natal pillars and role claims, spring-only seasonal path.'},
  {id:'DERIVED-EARTH-BOUNDARY-AFTER',request:request('2026-04-17','20:50'),expected:{status:OK,natalParents:1,pillars:[['丙午','壬辰','辛酉','戊戌']],dayStem:'辛',monthBranch:'辰',primaryPattern:'正印',seasonalAlternativesPerParent:[1],seasonalStates:['XIANG'],canProvideTimedReport:true,fullPaidReport:false},sourceRefs:['test/fixtures/sprint6-report-cases-v1.mjs'],reason:'One minute after B; same natal pillars and role claims, earth-dominant seasonal path only.'},
  {id:'LICHUN-ONE-MINUTE-BEFORE',request:request('2026-02-04','05:01'),expected:{status:OK,natalParents:1,pillars:[['乙巳','己丑','己酉','丁卯']],dayStem:'己',monthBranch:'丑',primaryPattern:null,seasonalStates:['WANG'],canProvideTimedReport:true,fullPaidReport:false},sourceRefs:['test/fixtures/sprint6-report-cases-v1.mjs'],reason:'Correlated before-side parent fixed from the existing published-minute contract; no fabricated2x2.'},
  {id:'LICHUN-ONE-MINUTE-AFTER',request:request('2026-02-04','05:03'),expected:{status:OK,natalParents:1,pillars:[['丙午','庚寅','己酉','丁卯']],dayStem:'己',monthBranch:'寅',primaryPattern:'正官',seasonalStates:['SI'],canProvideTimedReport:true,fullPaidReport:false},sourceRefs:['test/fixtures/sprint6-report-cases-v1.mjs'],reason:'Correlated after-side parent; before/after symbolic pairs may differ while no strength conclusion is implied.'},
];

// Domain order: BEHAVIOR / COMMUNICATION / WORK / MONEY.
// L = bounded symbolic lens applies; H = that domain condition is not met.
// All literal arrays were manually set from stem relations and the agreed table.
export const SPRINT7_REAL_DOMAIN_EXPECTATIONS = {
  WINTER_WOOD_CANDIDATE:[['LIMITED','HOLD','LIMITED','HOLD']],
  WINTER_WOOD_PRESENT_FIRE_HOLD:[['LIMITED','HOLD','LIMITED','HOLD']],
  MONTH_MAIN_OFFICER:[['LIMITED','LIMITED','LIMITED','LIMITED']],
  MONTH_MAIN_DIRECT_WEALTH:[['HOLD','HOLD','HOLD','HOLD']],
  LICHUN_CORRELATED_NATAL_PARENTS:[['HOLD','HOLD','LIMITED','HOLD'],['HOLD','LIMITED','HOLD','HOLD']],
  DERIVED_EARTH_SEASON_BOUNDARY:[['LIMITED','LIMITED','LIMITED','HOLD']],
  DST_NONEXISTENT_CIVIL_TIME:[],DST_AMBIGUOUS_CIVIL_TIME:[],
  SPRING_EARTH_WITH_OFFICER_CONTEXT:[['HOLD','LIMITED','HOLD','HOLD']],
  SUMMER_FIRE_AND_EXPLICIT_TIME_AXIS:[['HOLD','HOLD','LIMITED','HOLD']],
  AUTUMN_WATER_RESOURCE_STRUCTURE:[['HOLD','HOLD','HOLD','HOLD']],
  HISTORICAL_STABLE_CLOCK:[['HOLD','HOLD','LIMITED','LIMITED']],
  HISTORICAL_DST_PREVIOUS_STANDARD_DATE:[['LIMITED','HOLD','HOLD','LIMITED']],
  FUTURE_SOLAR_PARTIAL_DATA:[['HOLD','HOLD','HOLD','LIMITED']],
  FUTURE_LUNAR_NEEDS_DATA:[],UNKNOWN_TIME_REQUIRES_INFORMATION:[],UNSUPPORTED_1954_CLOCK:[],
  'DIVERSE-YIN-WOOD-RESOURCE':[['HOLD','LIMITED','HOLD','LIMITED']],
  'DIVERSE-YIN-FIRE-KILLING':[['HOLD','LIMITED','HOLD','HOLD']],
  'DIVERSE-INDIRECT-WEALTH':[['HOLD','LIMITED','HOLD','HOLD']],
  'DIVERSE-RESOURCE-EXACT-EXPOSURE':[['LIMITED','LIMITED','LIMITED','LIMITED']],
  'DIVERSE-HURTING-OFFICER':[['LIMITED','LIMITED','HOLD','HOLD']],
  'DIVERSE-FOOD-GOD':[['LIMITED','LIMITED','HOLD','HOLD']],
  'OTHER-EXPOSED-WITH-PEER-MAIN':[['HOLD','LIMITED','HOLD','HOLD']],
  'SPRING-WEALTH-KILLING-COMPETITION':[['HOLD','LIMITED','HOLD','HOLD']],
  'EARTH-MONTH-PEER-MAIN':[['HOLD','LIMITED','LIMITED','LIMITED']],
  'SUMMER-RESOURCE-OUTPUT-COMPETITION':[['LIMITED','LIMITED','LIMITED','LIMITED']],
  'WU-OTHER-JI-COMPATIBILITY-HELD':[['HOLD','LIMITED','LIMITED','LIMITED']],
  'WEI-RESOURCE-WEALTH-COMPETITION':[['HOLD','LIMITED','LIMITED','LIMITED']],
  'AUTUMN-METAL-PEER-MAIN':[['HOLD','HOLD','HOLD','LIMITED']],
  'AUTUMN-KILLING-EXACT-MONTH':[['LIMITED','HOLD','HOLD','LIMITED']],
  'WINTER-YIN-WATER-PEER-MAIN':[['HOLD','HOLD','HOLD','LIMITED']],
  'WINTER-ZI-PEER-MAIN':[['HOLD','HOLD','LIMITED','LIMITED']],
  'DERIVED-EARTH-BOUNDARY-BEFORE':[['LIMITED','LIMITED','LIMITED','HOLD']],
  'DERIVED-EARTH-BOUNDARY-AFTER':[['LIMITED','LIMITED','LIMITED','HOLD']],
  'LICHUN-ONE-MINUTE-BEFORE':[['HOLD','HOLD','LIMITED','HOLD']],
  'LICHUN-ONE-MINUTE-AFTER':[['HOLD','LIMITED','HOLD','HOLD']],
};

export const SPRINT7_REPORT_CASES = [...SPRINT6_REPORT_CASES,...SPRINT7_ADDITIONAL_REPORT_CASES];
export const SPRINT7_REAL_CONTRASTS = [
  {id:'same-day-hour-changes-m5-and-roles',cases:['WINTER_WOOD_CANDIDATE','WINTER_WOOD_PRESENT_FIRE_HOLD'],modifiedInputKeys:['time'],stable:['dayStem','monthBranch','dayRootLocations'],different:['hourPillar','M5','visibleRoleSet'],mustNotInfer:['M5_CANDIDATE_IS_FINAL_USEFUL_GOD','TIME_CHANGE_PROVES_PERSONALITY_CHANGE']},
  {id:'one-date-change-wealth-polarity',cases:['MONTH_MAIN_DIRECT_WEALTH','DIVERSE-INDIRECT-WEALTH'],modifiedInputKeys:['date'],stable:['yearPillar','monthPillar','monthBranch','MONEY.status'],different:['dayMaster','visibleRoleFamilies','COMMUNICATION'],mustNotInfer:['WEALTH_LABEL_PREDICTS_INCOME']},
  {id:'neighboring-output-month-contract',cases:['DIVERSE-HURTING-OFFICER','DIVERSE-FOOD-GOD'],modifiedInputKeys:['date'],stable:['yearPillar','monthPillar','mainHiddenStem','BEHAVIOR.status'],different:['dayMaster','mainTenGod','visibleOutputSubtype'],mustNotInfer:['DIFFERENT_OUTPUT_NAME_PROVES_DIFFERENT_TRAIT']},
  {id:'derived-season-no-new-person',cases:['DERIVED-EARTH-BOUNDARY-BEFORE','DERIVED_EARTH_SEASON_BOUNDARY','DERIVED-EARTH-BOUNDARY-AFTER'],modifiedInputKeys:['time'],stable:['natalPillars','rootLocations','domainStatuses','rolePairs'],different:['seasonalPaths'],mustNotInfer:['CARTESIAN_NATAL_PRODUCT','SEASON_ALTERNATIVE_DUPLICATES_DOMAIN_CLAIMS']},
  {id:'published-lichun-correlated-parents',cases:['LICHUN-ONE-MINUTE-BEFORE','LICHUN_CORRELATED_NATAL_PARENTS','LICHUN-ONE-MINUTE-AFTER'],modifiedInputKeys:['time'],stable:['dayPillar','hourPillar'],different:['yearMonthCorrelatedParent','COMMUNICATION','WORK'],mustNotInfer:['FIRST_PARENT_SELECTED','INDEPENDENT_YEAR_MONTH_CROSS_PRODUCT']},
];

function freeze(v){if(v&&typeof v==='object'&&!Object.isFrozen(v)){Object.values(v).forEach(freeze);Object.freeze(v);}return v;}
freeze(SPRINT7_REAL_CASE_BASIS);freeze(SPRINT7_ADDITIONAL_REPORT_CASES);freeze(SPRINT7_REAL_DOMAIN_EXPECTATIONS);freeze(SPRINT7_REPORT_CASES);freeze(SPRINT7_REAL_CONTRASTS);
