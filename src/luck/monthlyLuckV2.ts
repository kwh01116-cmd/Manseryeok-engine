import { MONTH_BOUNDARY_JIE, MONTH_BRANCH_BY_JIE, monthPillarFromYearStem, type MonthBoundaryJie } from "../calendar/monthPillar.js";
import { resolveYearMonthPillars } from "../calendar/yearMonthPillars.js";
import { sexagenaryYearForCivilYear } from "../calendar/yearPillar.js";
import { isGregorianMinute, validateKstMinuteSolarTermTimeline } from "../calendar/solarTermTimeline.js";
import { SOLAR_TERM_CODES, type SolarTermEvent } from "../calendar/solarTerms.js";
import { MONTHLY_LUCK_METADATA } from "./monthlyLuckV1.js";

export const MONTHLY_LUCK_V2_POLICY_ID="M7-MONTHLY-TWELVE-JIE-PUBLISHED-MINUTE-EXTENDED-2027-V02" as const;
export const MONTHLY_LUCK_V2_VERSION="0.2.0" as const;
const CLOCK="KR_API_PUBLISHED_KST_MODERN_1989_2027_NO_DST_V2";
const FROM="1989-01-01T00:00",UNTIL="2028-01-01T00:00";
const SOURCE="IMPL-M1-MONTHLY-EXPLICIT-2027-EXTENSION";
const RULES={time:"M7-RULE-MONTHLY-JIE-EXTENDED-2027-002",table:"M7-RULE-MONTHLY-LABEL-EXTENDED-2027-002",precision:"M7-RULE-MONTHLY-PUBLISHED-MINUTE-002"};
function check(ok:unknown,code:string):asserts ok {if(!ok)throw new RangeError(code);}
function dense(value:readonly unknown[]):void {check(Array.isArray(value)&&Array.from({length:value.length},(_,i)=>Object.hasOwn(value,i)).every(Boolean),"MONTHLY_V2_DENSE_ARRAY_REQUIRED");}
function freeze<T>(value:T):T {if(value&&typeof value==="object"&&!Object.isFrozen(value)){Object.values(value).forEach(freeze);Object.freeze(value);}return value;}
function policy(id:unknown):void {check(id===MONTHLY_LUCK_V2_POLICY_ID,"EXPLICIT_SUPPORTED_MONTHLY_V2_POLICY_REQUIRED");}
export const MONTHLY_LUCK_V2_METADATA=freeze({id:MONTHLY_LUCK_V2_POLICY_ID,version:MONTHLY_LUCK_V2_VERSION,schemaVersion:"monthly-jie-luck-v2",
  purpose:MONTHLY_LUCK_METADATA.purpose,yearTableMeaning:MONTHLY_LUCK_METADATA.yearTableMeaning,
  clockPolicy:{id:CLOCK,version:"2",fromInclusive:FROM,untilExclusive:UNTIL,utcInstant:null,meaning:"EXPLICIT_KOREAN_PUBLISHED_NOMINAL_MINUTE_EXTENSION_NOT_FUTURE_LEGAL_CLOCK_CERTIFICATION"},
  precision:MONTHLY_LUCK_METADATA.precision,
  rules:Object.values(RULES).map(id=>({id,version:MONTHLY_LUCK_V2_VERSION,policyRefs:[MONTHLY_LUCK_V2_POLICY_ID],sourceRefs:[SOURCE]})),
  sources:[{id:SOURCE,kind:"EXISTING_M1_COMPOSITION_WITH_EXPLICIT_EXTENSION",yearMonthResolver:"src/calendar/yearMonthPillars.ts#resolveYearMonthPillars",yearArithmetic:"src/calendar/yearPillar.ts#sexagenaryYearForCivilYear",monthArithmetic:"src/calendar/monthPillar.ts#monthPillarFromYearStem",sourceAuthentication:"STRUCTURE_ONLY_LOCAL_ADAPTER_MUST_VALIDATE_ISSUED_DATA"}],
  excluded:["2028_QUERY_POLICY","2028_EVENT_FALLBACK","LUNAR_DATE_INDEX_INFERENCE","MONTHLY_EVENT_PREDICTIONS","V1_POLICY_MUTATION"]});
type Event=Readonly<SolarTermEvent>;
export interface CompiledMonthlyTimelineV2 {readonly schemaVersion:"compiled-monthly-timeline-v2";readonly events:readonly Event[];}
interface State {readonly events:readonly Event[];readonly byKey:ReadonlyMap<string,Event>;}
const issued=new WeakMap<CompiledMonthlyTimelineV2,State>();
const eventYear=(event:Event)=>Number(event.displayedDateTime.slice(0,4));
const key=(year:number,term:string)=>year+":"+term;
function nextOf(event:Event){const i=(MONTH_BOUNDARY_JIE as readonly string[]).indexOf(event.term);check(i>=0,"MONTHLY_V2_JIE_REQUIRED");return {year:eventYear(event)+(event.term==="DAXUE"?1:0),term:MONTH_BOUNDARY_JIE[(i+1)%12]!};}
export function compileMonthlyTimelineV2(events:readonly SolarTermEvent[]):CompiledMonthlyTimelineV2 {
  dense(events);validateKstMinuteSolarTermTimeline(events);const sourceIds=new Set<string>();
  for(const event of events){
    check(event&&(SOLAR_TERM_CODES as readonly string[]).includes(event.term),"MONTHLY_V2_KNOWN_EVENT_REQUIRED");dense(event.sourceIds);
    check(event.sourceIds.length>0&&event.sourceIds.every(id=>typeof id==="string"&&id.trim().length>0)&&new Set(event.sourceIds).size===event.sourceIds.length,"MONTHLY_V2_EVENT_SOURCE_REQUIRED");
    for(const id of event.sourceIds){check(!sourceIds.has(id),"MONTHLY_V2_EVENT_SOURCE_CONFLICT");sourceIds.add(id);}
    const year=eventYear(event);check((year>=1989&&year<=2027)||(year===1988&&event.term==="DAXUE"),"MONTHLY_V2_EVENT_OUTSIDE_ADOPTED_CLOCK_POLICY");
  }
  const copy=events.map(event=>freeze({term:event.term,displayedDateTime:event.displayedDateTime,timeBasis:event.timeBasis,sourcePrecision:event.sourcePrecision,sourceIds:[...event.sourceIds]}));
  const jie=copy.filter(event=>(MONTH_BOUNDARY_JIE as readonly string[]).includes(event.term));
  for(let i=1;i<jie.length;i++){const next=nextOf(jie[i-1]!);check(next.term===jie[i]!.term&&next.year===eventYear(jie[i]!),"MONTHLY_V2_NONCONSECUTIVE_INTERIOR_JIE");}
  const result=freeze({schemaVersion:"compiled-monthly-timeline-v2" as const,events:copy});issued.set(result,{events:copy,byKey:new Map(jie.map(e=>[key(eventYear(e),e.term),e]))});return result;
}
function state(timeline:CompiledMonthlyTimelineV2){const value=issued.get(timeline);check(value,"ISSUED_COMPILED_MONTHLY_V2_TIMELINE_REQUIRED");return value;}
const refs=(...rules:(keyof typeof RULES)[])=>({policyId:MONTHLY_LUCK_V2_POLICY_ID,policyVersion:MONTHLY_LUCK_V2_VERSION,ruleRefs:rules.map(rule=>RULES[rule]),policyRefs:[MONTHLY_LUCK_V2_POLICY_ID],sourceRefs:[SOURCE]});
function missing(year:number,term:MonthBoundaryJie,feature:"MONTHLY_QUERY_CONTEXT"|"MONTHLY_PERIOD_START"|"MONTHLY_PERIOD_END"){return {year,term,feature,reason:"EXPECTED_JIE_NOT_PRESENT_NO_FALLBACK" as const};}
function uniqueMissing<T extends {year:number;term:string;feature:string}>(rows:readonly T[]):T[]{const seen=new Set<string>();return rows.filter(row=>{const id=key(row.year,row.term)+":"+row.feature;if(seen.has(id))return false;seen.add(id);return true;});}

export function monthlyLuckAtMinuteV2(input:{readonly timeline:CompiledMonthlyTimelineV2;readonly queryMinute:string;readonly policyId:string}){
  policy(input?.policyId);check(typeof input.queryMinute==="string"&&isGregorianMinute(input.queryMinute),"VALID_EXPLICIT_MONTHLY_V2_QUERY_MINUTE_REQUIRED");const s=state(input.timeline),query=input.queryMinute,year=Number(query.slice(0,4));
  const common={schemaVersion:"monthly-luck-at-minute-v2" as const,queryMinute:query,gregorianCalendarMonth:query.slice(0,7),queryScope:"INDEPENDENT_EXPLICIT_CALENDAR_QUERY_NO_NATAL_CARTESIAN_PRODUCT" as const,precision:MONTHLY_LUCK_V2_METADATA.precision,...refs("time","precision")};
  if(query<FROM||query>=UNTIL)return freeze({...common,status:"POLICY_UNRESOLVED" as const,reason:"QUERY_OUTSIDE_EXPLICIT_EXTENDED_CLOCK_POLICY",confidence:null,entries:[],missingData:[]});
  const required=[{year:year-1,term:"DAXUE" as const},...MONTH_BOUNDARY_JIE.map(term=>({year,term}))];
  const missingData=required.filter(event=>!s.byKey.has(key(event.year,event.term))).map(event=>missing(event.year,event.term,"MONTHLY_QUERY_CONTEXT"));
  if(missingData.length)return freeze({...common,status:"NEEDS_DATA" as const,reason:"COMPLETE_QUERY_YEAR_JIE_CONTEXT_REQUIRED",confidence:null,entries:[],missingData});
  const around=s.events.filter(event=>eventYear(event)===year||(eventYear(event)===year-1&&event.term==="DAXUE")),result=resolveYearMonthPillars(around,query);
  check(result.monthBoundaryTrace,"MONTHLY_V2_EXISTING_MONTH_TRACE_REQUIRED");
  const entries=result.candidates.map((candidate,index)=>{
    const trace=result.monthBoundaryTrace!.candidateContexts[index]!,start=s.byKey.get(key(Number(trace.activeSince.displayedDateTime.slice(0,4)),trace.activeSince.term))!;
    const expectedEnd=nextOf(start),end=s.byKey.get(key(expectedEnd.year,expectedEnd.term))??null;
    if(end)check(start.displayedDateTime<end.displayedDateTime,"MONTHLY_V2_PERIOD_ORDER_REQUIRED");
    const label=sexagenaryYearForCivilYear(year),yearLabel=candidate.year.stem===label.stem&&candidate.year.branch===label.branch?year:year-1;
    return {id:"monthly-v2-query#alternative["+index+"]",queryAlternativeIndex:index,yearLabel,yearPillar:{...candidate.year},monthPillar:{...candidate.month},monthBranch:trace.monthBranch,boundarySide:trace.boundarySide,
      intervalStatus:end?"RESOLVED_UNDER_POLICY" as const:"NEEDS_DATA" as const,nominalInterval:{startInclusive:start.displayedDateTime,endExclusive:end?.displayedDateTime??null,precision:"MINUTE" as const},activeSince:start,untilEvent:end,missingData:end?[]:[missing(expectedEnd.year,expectedEnd.term,"MONTHLY_PERIOD_END")],
      calculationSourceRefs:[...new Set([...start.sourceIds,...(end?.sourceIds??[]),...s.byKey.get(key(year,"LICHUN"))!.sourceIds])],...refs("time","precision")};
  });
  const missingEnds=uniqueMissing(entries.flatMap(entry=>entry.missingData));
  return freeze({...common,status:result.confidence==="PUBLISHED_MINUTE_AMBIGUOUS"?"AMBIGUOUS" as const:missingEnds.length?"PARTIAL" as const:"RESOLVED_UNDER_POLICY" as const,reason:null,confidence:result.confidence,entries,missingData:missingEnds});
}
export function monthlyLuckYearTableV2(input:{readonly timeline:CompiledMonthlyTimelineV2;readonly year:number;readonly policyId:string}){
  policy(input?.policyId);check(Number.isInteger(input.year)&&input.year>=1&&input.year<=9999,"MONTHLY_V2_YEAR_MUST_BE_1_TO_9999");const s=state(input.timeline),year=input.year;
  const common={schemaVersion:"monthly-luck-year-table-v2" as const,yearLabel:year,yearLabelBoundary:"LICHUN_NOT_JANUARY_1" as const,tableMeaning:MONTHLY_LUCK_V2_METADATA.yearTableMeaning,precision:MONTHLY_LUCK_V2_METADATA.precision,...refs("table","precision")};
  if(year<1989||year>2027)return freeze({...common,status:"POLICY_UNRESOLVED" as const,yearPillar:null,rows:[],missingData:[],reason:"TABLE_YEAR_OUTSIDE_EXPLICIT_EXTENDED_CLOCK_POLICY"});
  const yearPillar=sexagenaryYearForCivilYear(year),rows=MONTH_BOUNDARY_JIE.map((term,index)=>{
    const startYear=year+(term==="XIAOHAN"?1:0),nextTerm=MONTH_BOUNDARY_JIE[(index+1)%12]!,endYear=year+(index>=10?1:0),start=s.byKey.get(key(startYear,term))??null,end=s.byKey.get(key(endYear,nextTerm))??null;
    if(start&&end)check(start.displayedDateTime<end.displayedDateTime,"MONTHLY_V2_PERIOD_ORDER_REQUIRED");
    const absent=[...(!start?[missing(startYear,term,"MONTHLY_PERIOD_START")]:[]),...(!end?[missing(endYear,nextTerm,"MONTHLY_PERIOD_END")]:[])];
    return {id:"monthly-v2-year["+year+"]#month["+index+"]",ordinal:index+1,monthBranch:MONTH_BRANCH_BY_JIE[term],monthPillar:monthPillarFromYearStem(yearPillar.stem,MONTH_BRANCH_BY_JIE[term]),status:absent.length?"NEEDS_DATA" as const:"RESOLVED_UNDER_POLICY" as const,calendarMonthAtStart:start?.displayedDateTime.slice(0,7)??null,
      nominalInterval:{startInclusive:start?.displayedDateTime??null,endExclusive:end?.displayedDateTime??null,precision:"MINUTE" as const},activeSince:start,untilEvent:end,missingData:absent,calculationSourceRefs:[...new Set([...(start?.sourceIds??[]),...(end?.sourceIds??[])])],...refs("table","precision")};
  });
  return freeze({...common,status:rows.every(row=>row.status==="RESOLVED_UNDER_POLICY")?"RESOLVED_UNDER_POLICY" as const:rows.every(row=>row.status==="NEEDS_DATA")?"NEEDS_DATA" as const:"PARTIAL" as const,yearPillar,rows,missingData:uniqueMissing(rows.flatMap(row=>row.missingData)),reason:null});
}
