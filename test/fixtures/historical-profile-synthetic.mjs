/**
 * Public test data only. This shifts a generated fictitious1990–2014 calendar
 * by28 Gregorian years and reseals new synthetic receipts. No KASI response,
 * private pin, real lunar mapping, or calendar oracle is copied or certified.
 */
import {fingerprint,sha} from '../../.kasi-build/schema.js';
import {gregorianDayNumber as day,gregorianDateFromDayNumber as civil,monthKey} from '../../dist/calendar/koreanLunisolarValidation.js';
import {syntheticModernLocalChartCandidate,sealSyntheticLocalChartCandidate} from './kasi-local-chart-synthetic.mjs';
export const HISTORICAL_PROFILE_FIXTURE_BASIS=Object.freeze({nature:'SYNTHETIC_NOT_KASI_NOT_CALENDAR_ORACLE',sourceGregorianRange:['1990-01-01','2015-01-01'],shiftYears:-28,targetGregorianRange:['1962-01-01','1987-01-01'],purpose:'PROFILE_ISSUANCE_CLOCK_POLICIES_FACTS_AND_REPORT_WIRING_ONLY'});
const shifted=value=>(Number(value.slice(0,4))-28)+value.slice(4);
export function syntheticHistoricalProfileCandidate(){
 const base=syntheticModernLocalChartCandidate().loaded;
 const originalEvents=base.candidate.events.filter(r=>(r.date>='1990-01-01'&&r.date<'2015-01-01')||(r.date.startsWith('1989-12-')&&r.termCode==='DAXUE'));
 const originalDates=base.candidate.dates.filter(r=>r.solarDate>='1990-01-01'&&r.solarDate<'2015-01-01');
 const used=new Set([...originalEvents,...originalDates].map(r=>r.sourceRef)),ids=new Map(),sources=[];
 for(const original of base.sources){
  if(!used.has(original.id))continue;
  const {id,...old}=original;
  const record={...structuredClone(old),query:{...old.query,year:old.query.year-28},fixtureNature:'SYNTHETIC_NOT_KASI_NOT_ACTUAL_RAW_RESPONSE',responseSha256:sha('SYNTHETIC_HISTORICAL_PROFILE:'+old.responseSha256+':SHIFT_MINUS_28_YEARS')};
  const fresh=fingerprint(record);ids.set(id,fresh);sources.push({id:fresh,...record});
 }
 const events=originalEvents.map(r=>({...r,date:shifted(r.date),computationalCivilDateTime:shifted(r.computationalCivilDateTime),sourceRef:ids.get(r.sourceRef)}));
 const dates=originalDates.map(r=>({...r,solarDate:shifted(r.solarDate),lunarYear:r.lunarYear-28,ganji:{year:'갑자(甲子)',month:r.leap?null:'갑자(甲子)',day:'갑자(甲子)'},sourceRef:ids.get(r.sourceRef)}));
 const months=[];
 for(const r of dates){
  const key=monthKey(r.lunarYear,r.lunarMonth,r.leap),previous=months.at(-1);
  if(!previous||monthKey(previous.lunarYear,previous.lunarMonth,previous.leap)!==key)months.push({lunarYear:r.lunarYear,lunarMonth:r.lunarMonth,leap:r.leap,monthDays:r.monthDays,start:{date:civil(day(r.solarDate)-r.lunarDay+1),evidence:r.lunarDay===1?'API_OBSERVED_DAY_1':'ARITHMETIC_BACK_CALCULATION_NOT_OBSERVED'},observedFrom:r.solarDate,observedUntil:r.solarDate,firstLunarDay:r.lunarDay,lastLunarDay:r.lunarDay,observedDays:0,partial:false,sourceRefs:[]});
  const group=months.at(-1);group.observedUntil=r.solarDate;group.lastLunarDay=r.lunarDay;group.observedDays++;if(!group.sourceRefs.includes(r.sourceRef))group.sourceRefs.push(r.sourceRef);
 }
 for(const group of months)group.partial=group.firstLunarDay!==1||group.lastLunarDay!==group.monthDays;
 const candidate={schemaVersion:'kasi-api-research-v1',evidenceProfile:'SYNTHETIC_NOT_KASI_NOT_CALENDAR_ORACLE',rawValidation:'SYNTHETIC_NOT_AN_ACTUAL_API_RESPONSE',normalizerVersion:'0.1.2',status:'RESEARCH_ONLY',support:{from:'1962-01-01',untilExclusive:'1987-01-01',scope:'CIVIL_DATE_LOOKUP_ONLY',engineSupportPromotion:false,g1P2Promotion:false},events,dates,months,audit:{years:25,solar:events.length,lunar:dates.length},boundaryRequirements:{synthetic:true,...HISTORICAL_PROFILE_FIXTURE_BASIS},dayComparisons:{SYNTHETIC_NOT_A_CALENDAR_ORACLE:true,details:[]}};
 return sealSyntheticLocalChartCandidate(candidate,sources);
}

/** Independent arithmetic:1962-01-01 is13885days before the accepted2000-01-07甲子 anchor.
 * -13885 mod60=35己亥. At23:30 the branch is子;己day starts甲子,庚day starts丙子.
 * These constants test the existing Zi contracts, not an independently sourced calendar. */
export const HISTORICAL_FOUR_POLICY_EXPECTATIONS=Object.freeze([
 {dayRollover:'CIVIL_MIDNIGHT',hourStemReference:'SELECTED_DAY_PILLAR',effectiveDate:'1962-01-01',day:'己亥',hour:'甲子'},
 {dayRollover:'CIVIL_MIDNIGHT',hourStemReference:'CIVIL_DATE_DAY_PILLAR',effectiveDate:'1962-01-01',day:'己亥',hour:'甲子'},
 {dayRollover:'ZI_START',hourStemReference:'SELECTED_DAY_PILLAR',effectiveDate:'1962-01-02',day:'庚子',hour:'丙子'},
 {dayRollover:'ZI_START',hourStemReference:'CIVIL_DATE_DAY_PILLAR',effectiveDate:'1962-01-02',day:'庚子',hour:'甲子'},
]);
// Jan1 precedes synthetic Lichun/Xiaohan. 辛year uses庚寅, its子month is庚子;
// 己day's noon stem is庚. This literal is not generated from the tested resolver.
export const HISTORICAL_FIRST_NOON_EXPECTATION=Object.freeze(['辛丑','庚子','己亥','庚午']);
