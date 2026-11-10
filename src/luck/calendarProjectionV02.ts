import { gregorianDayNumber, gregorianDateFromDayNumber } from "../calendar/koreanLunisolarValidation.js";
import { ganZhiAt, ganZhiIndex, type GanZhi } from "../domain/sexagenary.js";
import { MONTH_BOUNDARY_JIE } from "../calendar/monthPillar.js";
import { M7_LUCK_POLICY_V01, MAX_LUCK_COUNT, modelAgeFromMinutes, type resolveLuckStart, type luckPillarSequence } from "./luckV01.js";

export const CALENDAR_PROJECTION_POLICY_V02 = "M7-CALENDAR-NOMINAL-YMDH-SEQUENTIAL-CLAMP-V02" as const;
export const CALENDAR_PROJECTION_VERSION = "0.2.0" as const;
export const NOMINAL_AS_OF_RANGE = Object.freeze({fromInclusive:"1989-01-01T00:00",untilExclusive:"2027-01-01T00:00"});
const IMPLEMENTATION_SOURCE="IMPL-M7-CALENDAR-PROJECTION-V02";
const ruleIds={decomposition:"M7-RULE-NOMINAL-YMDH-DECOMPOSITION-002",sequential:"M7-RULE-SEQUENTIAL-GREGORIAN-CLAMP-002",periods:"M7-RULE-INITIAL-ANCHOR-DECADE-PERIOD-002",selection:"M7-RULE-NOMINAL-ASOF-HALFOPEN-002"} as const;
function freeze<T>(value:T):T {if(value&&typeof value==="object"&&!Object.isFrozen(value)){Object.values(value).forEach(freeze);Object.freeze(value);}return value;}
function reject(message:string):never {throw new RangeError(message);}
function policy(id:unknown):void {if(id!==CALENDAR_PROJECTION_POLICY_V02)reject("EXPLICIT_SUPPORTED_CALENDAR_PROJECTION_POLICY_REQUIRED");}
function safeNonnegative(value:unknown):asserts value is number {if(typeof value!=="number"||!Number.isSafeInteger(value)||value<0)reject("SAFE_NONNEGATIVE_INTEGER_REQUIRED");}
const refs=(...kinds:(keyof typeof ruleIds)[])=>({policyRefs:[CALENDAR_PROJECTION_POLICY_V02],ruleRefs:kinds.map(kind=>ruleIds[kind]),sourceRefs:[IMPLEMENTATION_SOURCE]});
export const CALENDAR_PROJECTION_METADATA=freeze({id:CALENDAR_PROJECTION_POLICY_V02,version:CALENDAR_PROJECTION_VERSION,
  meaning:"NOMINAL_UNDER_SELECTED_POLICY",calendar:"PROLEPTIC_GREGORIAN",additionOrder:["YEARS","MONTHS","DAYS","HOURS"],
  yearMonthOverflow:"CLAMP_VALID_INPUT_ONLY",periodAnchor:"DIRECT_FROM_FIRST_START_NOT_ITERATIVE",intervalConvention:"[START,END)",
  sourcePrecision:"MINUTE",resultPrecision:"NOMINAL_MINUTE",arithmetic:"DETERMINISTIC_INTEGER_ARITHMETIC",utcInstant:null,
  arithmeticRange:{fromInclusive:"0001-01-01T00:00",untilInclusive:"9999-12-31T23:59"},asOfRange:NOMINAL_AS_OF_RANGE,
  traditionalBasis:{policyId:M7_LUCK_POLICY_V01,contribution:"EXISTING_THREE_DAY_MODEL_AGE_NOT_GREGORIAN_PROJECTION_AUTHORITY"},
  rules:Object.entries(ruleIds).map(([kind,id])=>({id,version:CALENDAR_PROJECTION_VERSION,kind,policyRefs:[CALENDAR_PROJECTION_POLICY_V02],sourceRefs:[IMPLEMENTATION_SOURCE]})),
  sources:[{id:IMPLEMENTATION_SOURCE,url:"src/luck/calendarProjectionV02.ts",evidenceLayer:"PROJECT_SELECTED_ARITHMETIC_CONVENTION",contribution:"SEQUENTIAL_CLAMP_DIRECT_ANCHOR_AND_BOUNDED_HALFOPEN_QUERY",rightsReview:"NOT_AN_UPSTREAM_RIGHTS_APPROVAL"},
    {id:"SOFTWARE-LUNAR-PYTHON-YUN-PINNED-V02",url:"https://github.com/6tail/lunar-python/blob/1645ad3b3653635e5cb31b0c6df22b5e4298f8ce/lunar_python/eightchar/Yun.py",revision:"1645ad3b3653635e5cb31b0c6df22b5e4298f8ce",evidenceLayer:"SOFTWARE_COMPARISON_ONLY",contribution:"SECT2_INTEGER_DECOMPOSITION_AND_SEQUENTIAL_CALL_ORDER_NOT_KASI_OR_CLASSICAL_AUTHORITY",executedLibrary:false,rightsReview:"UNVERIFIED"},
    {id:"SPEC-TEMPORAL-PLAINDATETIME-PINNED-V02",url:"https://github.com/tc39/proposal-temporal/blob/e8cc03fc970a65a3359e8870e3b35e687ac94e55/docs/plaindatetime.md",revision:"e8cc03fc970a65a3359e8870e3b35e687ac94e55",evidenceLayer:"TECHNICAL_DOCUMENTATION_COMPARISON_ONLY",contribution:"PLAIN_WALL_DATETIME_AND_CONSTRAIN_REJECT_CONCEPTS_NOT_AN_IMPLEMENTED_TEMPORAL_ORACLE",executedLibrary:false,rightsReview:"NOT_A_CLASSICAL_RIGHTS_APPROVAL"}],
  limits:["NONMONOTONIC_AT_MODEL_UNIT_BOUNDARIES","NO_EXACT_PHYSICAL_TRANSITION_INSTANT","NO_UNKNOWN_SECONDS_INTERVAL_OR_PROBABILITY","FUTURE_NOMINAL_DATES_NOT_FUTURE_CIVIL_TIME_OR_SEYUN_CERTIFICATION","ASOF_SCOPE_NOT_BIRTH_SUPPORT_EXPANSION"]});

interface CivilMinute {year:number;month:number;day:number;hour:number;minute:number;dayNumber:number;}
const minDay=gregorianDayNumber("0001-01-01"),maxDay=gregorianDayNumber("9999-12-31");
function civil(value:string):CivilMinute {
  if(typeof value!=="string"||!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(value))reject("EXPLICIT_VALID_GREGORIAN_MINUTE_REQUIRED");
  const year=Number(value.slice(0,4)),month=Number(value.slice(5,7)),day=Number(value.slice(8,10)),hour=Number(value.slice(11,13)),minute=Number(value.slice(14,16));
  if(year<1||year>9999||hour>23||minute>59)reject("EXPLICIT_VALID_GREGORIAN_MINUTE_REQUIRED");
  const dayNumber=gregorianDayNumber(value.slice(0,10));return {year,month,day,hour,minute,dayNumber};
}
const pad=(value:number,size=2)=>String(value).padStart(size,"0");
const format=(year:number,month:number,day:number,hour:number,minute:number)=>`${pad(year,4)}-${pad(month)}-${pad(day)}T${pad(hour)}:${pad(minute)}`;
function lastDay(year:number,month:number):number {
  // Month lengths come from the existing validated day-number kernel, not exception-driven overflow.
  if(year===9999&&month===12)return 31;
  const nextYear=month===12?year+1:year,nextMonth=month===12?1:month+1;
  return gregorianDayNumber(`${pad(nextYear,4)}-${pad(nextMonth)}-01`)-gregorianDayNumber(`${pad(year,4)}-${pad(month)}-01`);
}
function scalar(value:string):number {const parsed=civil(value);return parsed.dayNumber*1440+parsed.hour*60+parsed.minute;}
function fromScalar(value:number):string {
  if(!Number.isSafeInteger(value))reject("CALENDAR_ARITHMETIC_EXCEEDS_SAFE_INTEGER");
  const day=Math.floor(value/1440),time=value-day*1440;if(day<minDay||day>maxDay)reject("CALENDAR_ARITHMETIC_OUT_OF_RANGE");
  return gregorianDateFromDayNumber(day)+"T"+pad(Math.floor(time/60))+":"+pad(time%60);
}
export interface CalendarAdditionStep {readonly unit:"YEARS"|"MONTHS"|"DAYS"|"HOURS";readonly amount:number;readonly inputMinute:string;readonly resultMinute:string;readonly clamped:boolean;readonly requestedDay:number|null;readonly targetMonthDays:number|null;}
export function addGregorianYearsClamped(minute:string,years:number,policyId:string):CalendarAdditionStep {
  policy(policyId);safeNonnegative(years);const input=civil(minute),year=input.year+years;
  if(!Number.isSafeInteger(year)||year>9999)reject("CALENDAR_ARITHMETIC_OUT_OF_RANGE");
  const days=lastDay(year,input.month),day=Math.min(input.day,days);
  return freeze({unit:"YEARS",amount:years,inputMinute:minute,resultMinute:format(year,input.month,day,input.hour,input.minute),clamped:day!==input.day,requestedDay:input.day,targetMonthDays:days});
}
export function addGregorianMonthsClamped(minute:string,months:number,policyId:string):CalendarAdditionStep {
  policy(policyId);safeNonnegative(months);const input=civil(minute),index=(input.year-1)*12+input.month-1+months;
  if(!Number.isSafeInteger(index)||index>=9999*12)reject("CALENDAR_ARITHMETIC_OUT_OF_RANGE");
  const year=Math.floor(index/12)+1,month=index%12+1,days=lastDay(year,month),day=Math.min(input.day,days);
  return freeze({unit:"MONTHS",amount:months,inputMinute:minute,resultMinute:format(year,month,day,input.hour,input.minute),clamped:day!==input.day,requestedDay:input.day,targetMonthDays:days});
}
function addDaysOrHours(minute:string,amount:number,unit:"DAYS"|"HOURS",policyId:string):CalendarAdditionStep {
  policy(policyId);safeNonnegative(amount);const input=scalar(minute),delta=amount*(unit==="DAYS"?1440:60);
  if(!Number.isSafeInteger(delta)||!Number.isSafeInteger(input+delta))reject("CALENDAR_ARITHMETIC_EXCEEDS_SAFE_INTEGER");
  return freeze({unit,amount,inputMinute:minute,resultMinute:fromScalar(input+delta),clamped:false,requestedDay:null,targetMonthDays:null});
}
export const addGregorianDays=(minute:string,days:number,policyId:string)=>addDaysOrHours(minute,days,"DAYS",policyId);
export const addGregorianHours=(minute:string,hours:number,policyId:string)=>addDaysOrHours(minute,hours,"HOURS",policyId);
export function decomposeLuckMinutes(minutes:number,policyId:string){
  policy(policyId);safeNonnegative(minutes);const years=Math.floor(minutes/4320),r1=minutes%4320,months=Math.floor(r1/360),r2=r1%360;
  return freeze({originalMinutes:minutes,years,months,days:Math.floor(r2/12),hours:2*(r2%12),units:"SELECTED_MODEL_UNITS_NOT_ACTUAL_360_DAY_YEAR",...refs("decomposition")});
}
type Start=ReturnType<typeof resolveLuckStart>;
type Sequence=ReturnType<typeof luckPillarSequence>;
export interface NominalPeriod {readonly index:number;readonly ordinal:number;readonly pillar:GanZhi;readonly startInclusive:string;readonly endExclusive:string;readonly anchorMinute:string;readonly yearsFromAnchor:number;readonly startClamped:boolean;readonly endClamped:boolean;}
function candidate(ref:string):void {if(typeof ref!=="string"||!/^chart\.candidates\[(0|[1-9]\d*)\]$/.test(ref))reject("EXPLICIT_NATAL_CANDIDATE_REFERENCE_REQUIRED");}
function sequenceContract(sequence:Sequence):void {
  if(!sequence||sequence.status!=="OK"||sequence.policyId!==M7_LUCK_POLICY_V01||sequence.policyVersion!=="0.1.0"||!Number.isInteger(sequence.count)||sequence.count<1||sequence.count>MAX_LUCK_COUNT||!Array.isArray(sequence.entries)||sequence.entries.length!==sequence.count||sequence.firstRelation!=="ADJACENT_EXCLUDES_NATAL_MONTH"||!["FORWARD","REVERSE"].includes(sequence.direction)||!sequence.monthPillar)reject("VALIDATED_V01_SEQUENCE_REQUIRED");
  const monthIndex=ganZhiIndex(sequence.monthPillar.stem,sequence.monthPillar.branch);if(monthIndex===null)reject("VALIDATED_V01_MONTH_PILLAR_REQUIRED");
  for(let index=0;index<sequence.entries.length;index++){const entry=sequence.entries[index]!,expected=ganZhiAt(monthIndex+(sequence.direction==="FORWARD"?1:-1)*(index+1));if(entry.ordinal!==index+1||!entry.pillar||entry.pillar.stem!==expected.stem||entry.pillar.branch!==expected.branch)reject("INVALID_SEQUENCE_ENTRY");}
}
export function generateNominalPeriods(input:{firstStartMinute:string;sequence:Sequence;candidateRef:string;policyId:string}):readonly NominalPeriod[]{
  policy(input?.policyId);candidate(input.candidateRef);civil(input.firstStartMinute);sequenceContract(input.sequence);
  const boundaries=Array.from({length:input.sequence.count+1},(_,index)=>addGregorianYearsClamped(input.firstStartMinute,10*index,input.policyId));
  const periods=input.sequence.entries.map((entry,index)=>{const start=boundaries[index]!,end=boundaries[index+1]!;
    if(start.resultMinute>=end.resultMinute)reject("NOMINAL_PERIODS_NOT_STRICTLY_INCREASING");
    return {index,ordinal:entry.ordinal,pillar:{...entry.pillar},startInclusive:start.resultMinute,endExclusive:end.resultMinute,anchorMinute:input.firstStartMinute,yearsFromAnchor:10*index,startClamped:start.clamped,endClamped:end.clamped};});
  return freeze(periods);
}
const precision=()=>({sourcePrecision:"MINUTE",resultMeaning:"NOMINAL_UNDER_SELECTED_POLICY",deterministicUnderInputAndPolicy:true,actualInstantCertified:false,utcInstant:null,unknownSeconds:"NOT_RESOLVED_NO_ASSUMED_INTERVAL_OR_PROBABILITY"});
const projections=new WeakSet<object>();
function issue<T extends object>(value:T):T {freeze(value);projections.add(value);return value;}
/** Structural consistency only; the local adapter separately verifies the issued v0.1/source provenance. */
export function projectNominalLuckCalendar(input:{candidateRef:string;birthMinute:string;start:Start;sequence:Sequence;policyId:string}){
  policy(input?.policyId);candidate(input.candidateRef);civil(input.birthMinute);sequenceContract(input.sequence);const start=input.start;
  if(!start||start.policyId!==M7_LUCK_POLICY_V01||start.birthMinute!==input.birthMinute||start.direction!==input.sequence.direction||!["FORWARD","REVERSE"].includes(start.direction))reject("V01_START_BIRTH_DIRECTION_CONNECTION_REQUIRED");
  const common={schemaVersion:"m7-nominal-calendar-projection-v02",candidateRef:input.candidateRef,birthMinute:input.birthMinute,policyId:CALENDAR_PROJECTION_POLICY_V02,policyVersion:CALENDAR_PROJECTION_VERSION,
    startPolicyId:start.policyId,startPolicyVersion:start.policyVersion,direction:start.direction,precision:precision(),...refs("decomposition","sequential","periods")};
  if(start.status==="NEEDS_DATA"){
    if(start.age!==null||start.nominalIntervalMinutes!==null||start.selectedEvent!==null||!start.missingData.length)reject("INCONSISTENT_NEEDS_DATA_START");
    return issue({...common,status:"NEEDS_DATA" as const,intervalMinutes:null,modelAge:null,decomposition:null,steps:[] as readonly CalendarAdditionStep[],firstStartMinute:null,periods:[] as readonly NominalPeriod[],selectedEvent:null,missingData:start.missingData.map(item=>({...item}))});
  }
  const event=start.selectedEvent;
  if(!event||event.timeBasis!=="KST"||event.sourcePrecision!=="MINUTE"||!(MONTH_BOUNDARY_JIE as readonly string[]).includes(event.term)||!event.sourceIds.length)reject("V01_SELECTED_JIE_REQUIRED");
  const selectedEvent={term:event.term,displayedDateTime:event.displayedDateTime,timeBasis:event.timeBasis,sourcePrecision:event.sourcePrecision,sourceIds:[...event.sourceIds]};
  if(start.status==="AMBIGUOUS"){
    if(start.age!==null||start.nominalIntervalMinutes!==0||event.displayedDateTime!==input.birthMinute)reject("INCONSISTENT_AMBIGUOUS_START");
    return issue({...common,status:"AMBIGUOUS" as const,intervalMinutes:0,modelAge:null,decomposition:null,steps:[] as readonly CalendarAdditionStep[],firstStartMinute:null,periods:[] as readonly NominalPeriod[],selectedEvent,missingData:[]});
  }
  if(start.status!=="OK")reject("SUPPORTED_V01_START_STATUS_REQUIRED");
  const minutes=start.nominalIntervalMinutes;safeNonnegative(minutes);if(minutes===0)reject("POSITIVE_VALIDATED_START_INTERVAL_REQUIRED");
  const signed=scalar(event.displayedDateTime)-scalar(input.birthMinute),expected=start.direction==="FORWARD"?signed:-signed;
  if(expected!==minutes)reject("START_INTERVAL_EVENT_CONNECTION_CHANGED");
  const age=modelAgeFromMinutes(minutes,M7_LUCK_POLICY_V01);
  if(!start.age||start.age.numerator!==age.numerator||start.age.denominator!==age.denominator||start.age.unit!==age.unit||start.age.reduced.numerator!==age.reduced.numerator||start.age.reduced.denominator!==age.reduced.denominator)reject("ORIGINAL_RATIONAL_MODEL_AGE_REQUIRED");
  const decomposition=decomposeLuckMinutes(minutes,input.policyId),steps:CalendarAdditionStep[]=[];
  steps.push(addGregorianYearsClamped(input.birthMinute,decomposition.years,input.policyId));
  steps.push(addGregorianMonthsClamped(steps[0]!.resultMinute,decomposition.months,input.policyId));
  steps.push(addGregorianDays(steps[1]!.resultMinute,decomposition.days,input.policyId));
  steps.push(addGregorianHours(steps[2]!.resultMinute,decomposition.hours,input.policyId));
  const firstStartMinute=steps[3]!.resultMinute,periods=generateNominalPeriods({firstStartMinute,sequence:input.sequence,candidateRef:input.candidateRef,policyId:input.policyId});
  return issue({...common,status:"PROJECTED_UNDER_POLICY" as const,intervalMinutes:minutes,modelAge:{...age,reduced:{...age.reduced}},decomposition,steps,firstStartMinute,periods,selectedEvent,missingData:[]});
}
export type NominalCalendarProjection=ReturnType<typeof projectNominalLuckCalendar>;
export function selectNominalDaYunAt(input:{projection:NominalCalendarProjection;asOfMinute:string;policyId:string}){
  policy(input?.policyId);civil(input.asOfMinute);const projection=input.projection;
  if(!projection||!projections.has(projection)||!Object.isFrozen(projection))reject("ISSUED_IMMUTABLE_NOMINAL_PROJECTION_REQUIRED");
  const common={schemaVersion:"m7-nominal-asof-selection-v02",candidateRef:projection.candidateRef,asOfMinute:input.asOfMinute,policyId:CALENDAR_PROJECTION_POLICY_V02,policyVersion:CALENDAR_PROJECTION_VERSION,
    queryRange:NOMINAL_AS_OF_RANGE,precision:precision(),...refs("selection")};
  const result=(status:"BEFORE_BIRTH"|"BEFORE_FIRST_DA_YUN"|"RESOLVED_UNDER_POLICY"|"OUTSIDE_GENERATED_RANGE"|"NEEDS_DATA"|"AMBIGUOUS"|"POLICY_UNRESOLVED",selection:NominalPeriod|null=null)=>freeze({...common,status,selection,missingData:projection.missingData.map(item=>({...item}))});
  if(input.asOfMinute<NOMINAL_AS_OF_RANGE.fromInclusive||input.asOfMinute>=NOMINAL_AS_OF_RANGE.untilExclusive)return result("POLICY_UNRESOLVED");
  if(projection.status==="NEEDS_DATA"||projection.status==="AMBIGUOUS")return result(projection.status);
  if(input.asOfMinute<projection.birthMinute)return result("BEFORE_BIRTH");
  if(input.asOfMinute<projection.firstStartMinute)return result("BEFORE_FIRST_DA_YUN");
  const selected=projection.periods.find(period=>period.startInclusive<=input.asOfMinute&&input.asOfMinute<period.endExclusive);
  return selected?result("RESOLVED_UNDER_POLICY",selected):result("OUTSIDE_GENERATED_RANGE");
}
