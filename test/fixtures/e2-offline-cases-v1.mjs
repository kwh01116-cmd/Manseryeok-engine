/** Freeze independent calendar/strength contracts before running the E2 projection. */
import {SPRINT6_REPORT_CASES} from './sprint6-report-cases-v1.mjs';

const prior = id => {
  const row = SPRINT6_REPORT_CASES.find(c => c.id === id);
  if (!row) throw Error('MISSING_PREVIOUS_FIXTURE_' + id);
  return {id, birth: row.request, expected: row.expected};
};
const good = prior('MONTH_MAIN_OFFICER');
const paired = (id, values, expected) => ({id, birth:{...good.birth,...values}, expected:{status:good.expected.status,natalParents:1,...expected}});
const luck = sex => ({
  luckPolicyId:'M7-TRADITIONAL-YEAR-STEM-JIE-3D-V01',
  features:{dayun:{traditionalSex:sex,count:5},seyun:{yearLabel:2026}},
  calendarProjectionPolicyId:'M7-CALENDAR-NOMINAL-YMDH-SEQUENTIAL-CLAMP-V02',
  asOfMinute:'2022-01-10T08:00',
});
const monthlyOptions = {policyId:'M7-MONTHLY-TWELVE-JIE-PUBLISHED-MINUTE-V01',year:2025};
const leap = paired('LEAP_GREGORIAN',{date:'2025-07-25'}, {dayPillar:'乙未'});
const {date, ...lunarBase} = leap.birth;

export const E2_OFFLINE_CASES = [
  {...good,expected:{...good.expected,grade:'WEAK',supportUnits:1400,rank:'COMPETING_CANDIDATES'}},
  prior('MONTH_MAIN_DIRECT_WEALTH'),
  prior('WINTER_WOOD_CANDIDATE'), prior('WINTER_WOOD_PRESENT_FIRE_HOLD'),
  prior('LICHUN_CORRELATED_NATAL_PARENTS'), prior('DERIVED_EARTH_SEASON_BOUNDARY'),
  prior('HISTORICAL_STABLE_CLOCK'), prior('HISTORICAL_DST_PREVIOUS_STANDARD_DATE'),
  prior('DST_NONEXISTENT_CIVIL_TIME'), prior('DST_AMBIGUOUS_CIVIL_TIME'),
  prior('FUTURE_SOLAR_PARTIAL_DATA'), prior('FUTURE_LUNAR_NEEDS_DATA'),
  prior('UNKNOWN_TIME_REQUIRES_INFORMATION'),
  leap,{...leap,id:'LEAP_LUNAR',birth:{...lunarBase,calendar:'KOREAN_LUNAR',lunarDate:{lunarYear:2025,lunarMonth:6,lunarDay:1,leap:true}}},
  paired('M7_FORWARD',{date:'1990-06-01',luckOptions:luck('MALE'),monthlyOptions},
    {firstSwitch:'1992-01-10T08:00',direction:'FORWARD',distance:6946}),
  paired('M7_REVERSE',{date:'1990-06-01',luckOptions:luck('FEMALE'),monthlyOptions},
    {firstSwitch:'1999-03-13T14:00',direction:'REVERSE',distance:37945}),
  paired('EXTREME_REVIEW',{date:'1990-01-19',time:'12:15'},
    {grade:'WEAK',supportUnits:1000,special:true,rank:'HOLD'}),
  paired('THRESHOLD_REVIEW',{date:'2002-07-11',time:'04:15'},
    {grade:'BORDERLINE',supportUnits:4500,special:false,rank:'HOLD'}),
];
