import { MONTH_BOUNDARY_JIE, MONTH_BRANCH_BY_JIE, monthPillarFromYearStem, type MonthBoundaryJie } from "../calendar/monthPillar.js";
import { resolveYearMonthPillars } from "../calendar/yearMonthPillars.js";
import { sexagenaryYearForCivilYear } from "../calendar/yearPillar.js";
import { isGregorianMinute, validateKstMinuteSolarTermTimeline } from "../calendar/solarTermTimeline.js";
import { SOLAR_TERM_CODES, type SolarTermEvent } from "../calendar/solarTerms.js";

export const MONTHLY_LUCK_POLICY_ID="M7-MONTHLY-TWELVE-JIE-PUBLISHED-MINUTE-V01" as const;
export const MONTHLY_LUCK_VERSION="0.1.0" as const;
const RULES={time:"M7-RULE-MONTHLY-JIE-CORRELATED-001",table:"M7-RULE-MONTHLY-LICHUN-YEAR-TABLE-001",precision:"M7-RULE-MONTHLY-PUBLISHED-MINUTE-001"} as const;
const SOURCE="IMPL-M1-YEAR-MONTH-JIE-COMPOSITION";
const FROM="1989-01-01T00:00",UNTIL="2027-01-01T00:00";
function check(ok:unknown,code:string):asserts ok {if(!ok)throw new RangeError(code);}
function dense(value:readonly unknown[]):void {check(Array.isArray(value)&&Array.from({length:value.length},(_,i)=>Object.hasOwn(value,i)).every(Boolean),"MONTHLY_DENSE_ARRAY_REQUIRED");}
function freeze<T>(value:T):T {if(value&&typeof value==="object"&&!Object.isFrozen(value)){Object.values(value).forEach(freeze);Object.freeze(value);}return value;}
function policy(id:unknown):void {check(id===MONTHLY_LUCK_POLICY_ID,"EXPLICIT_SUPPORTED_MONTHLY_POLICY_REQUIRED");}
export const MONTHLY_LUCK_METADATA=freeze({id:MONTHLY_LUCK_POLICY_ID,version:MONTHLY_LUCK_VERSION,schemaVersion:"monthly-jie-luck-v1",
  purpose:"CALENDAR_MONTHLY_GANZHI_TIME_AXIS_NOT_EVENT_PREDICTION",yearTableMeaning:"TWELVE_MYEONGLI_MONTHS_FROM_LICHUN_OF_LABEL_YEAR_TO_NEXT_LICHUN_NOT_GREGORIAN_JANUARY_TO_DECEMBER",
  clockPolicy:{id:"KR_API_PUBLISHED_KST_MODERN_1988_POST_DST_V1",version:"1",fromInclusive:FROM,untilExclusive:UNTIL,utcInstant:null},
  rules:Object.values(RULES).map(id=>({id,version:MONTHLY_LUCK_VERSION,policyRefs:[MONTHLY_LUCK_POLICY_ID],sourceRefs:[SOURCE]})),
  sources:[{id:SOURCE,kind:"EXISTING_IMPLEMENTATION_AND_PROJECT_COMPOSITION",yearRef:"src/calendar/yearPillar.ts#resolveYearPillarAtLichun",monthRef:"src/calendar/yearMonthPillars.ts#resolveYearMonthPillars",monthStemRef:"src/calendar/monthPillar.ts#monthPillarFromYearStem",
    newConvention:"EXPLICIT_YEAR_TABLE_AND_INDEPENDENT_QUERY_SCHEMA_REUSE_THE_EXISTING_YEAR_MONTH_RESOLVER",sourceAuthentication:"STRUCTURE_ONLY_THE_LOCAL_ADAPTER_VALIDATES_ISSUED_CONTEXT"}],
  precision:{source:"MINUTE",comparison:"PUBLISHED_NOMINAL_CIVIL_MINUTES",atBoundary:"CORRELATED_BEFORE_AND_AFTER_ALTERNATIVES",intervalDisplay:"NOMINAL_HALF_OPEN_INTERVAL_DOES_NOT_OVERRIDE_PUBLISHED_MINUTE_AMBIGUITY",seconds:"NOT_AVAILABLE_NO_ASSUMED_CONFIDENCE_INTERVAL"},
  excluded:["MONTHLY_EVENTS","FORTUNE","M5_RECOMMENDATIONS","HISTORICAL_CLOCK_EXPANSION","FUTURE_2027_CLOCK_PROMOTION"]});
type Event=Readonly<SolarTermEvent>;
export interface CompiledMonthlyTimeline {readonly schemaVersion:"compiled-monthly-timeline-v1";readonly events:readonly Event[];}
interface State {readonly events:readonly Event[];readonly jie:readonly Event[];readonly byKey:ReadonlyMap<string,Event>;}
const compiled=new WeakMap<CompiledMonthlyTimeline,State>();
const key=(year:number,term:string)=>year+":"+term;
const eventYear=(event:Event)=>Number(event.displayedDateTime.slice(0,4));
const isJie=(event:Event)=>(MONTH_BOUNDARY_JIE as readonly string[]).includes(event.term);
function nextOf(event:Event){const i=(MONTH_BOUNDARY_JIE as readonly string[]).indexOf(event.term);check(i>=0,"MONTHLY_JIE_REQUIRED");return {year:eventYear(event)+(event.term==="DAXUE"?1:0),term:MONTH_BOUNDARY_JIE[(i+1)%12]!};}
export function compileMonthlyTimeline(events:readonly SolarTermEvent[]):CompiledMonthlyTimeline {
  dense(events);validateKstMinuteSolarTermTimeline(events);const allSourceIds=new Set<string>();
  for(const event of events){
    check(event&&(SOLAR_TERM_CODES as readonly string[]).includes(event.term),"MONTHLY_KNOWN_EVENT_REQUIRED");dense(event.sourceIds);
    check(event.sourceIds.length>0&&event.sourceIds.every(id=>typeof id==="string"&&id.trim().length>0)&&new Set(event.sourceIds).size===event.sourceIds.length,"MONTHLY_EVENT_SOURCE_REQUIRED");
    for(const id of event.sourceIds){check(!allSourceIds.has(id),"MONTHLY_EVENT_SOURCE_CONFLICT");allSourceIds.add(id);}
    const year=eventYear(event);check((year>=1989&&year<=2026)||(year===1988&&event.term==="DAXUE"),"MONTHLY_EVENT_OUTSIDE_ADOPTED_CIVIL_POLICY");
  }
  const copy=events.map(e=>freeze({term:e.term,displayedDateTime:e.displayedDateTime,timeBasis:e.timeBasis,sourcePrecision:e.sourcePrecision,sourceIds:[...e.sourceIds]}));
  const jie=copy.filter(isJie);
  for(let i=1;i<jie.length;i++){const next=nextOf(jie[i-1]!);check(next.term===jie[i]!.term&&next.year===eventYear(jie[i]!),"MONTHLY_NONCONSECUTIVE_INTERIOR_JIE");}
  const result=freeze({schemaVersion:"compiled-monthly-timeline-v1" as const,events:copy});compiled.set(result,{events:copy,jie,byKey:new Map(jie.map(e=>[key(eventYear(e),e.term),e]))});return result;
}
function state(value:CompiledMonthlyTimeline):State {const result=compiled.get(value);check(result,"COMPILED_MONTHLY_TIMELINE_REQUIRED");return result;}
const refs=(...rules:(keyof typeof RULES)[])=>({policyId:MONTHLY_LUCK_POLICY_ID,policyVersion:MONTHLY_LUCK_VERSION,ruleRefs:rules.map(r=>RULES[r]),policyRefs:[MONTHLY_LUCK_POLICY_ID],sourceRefs:[SOURCE]});
function missing(year:number,term:MonthBoundaryJie,feature:"MONTHLY_QUERY_CONTEXT"|"MONTHLY_PERIOD_START"|"MONTHLY_PERIOD_END"){return {year,term,feature,reason:"EXPECTED_JIE_NOT_PRESENT_NO_FALLBACK" as const};}
function uniqueMissing<T extends {year:number;term:string;feature:string}>(rows:readonly T[]):T[]{const seen=new Set<string>();return rows.filter(row=>{const k=key(row.year,row.term)+":"+row.feature;if(seen.has(k))return false;seen.add(k);return true;});}

/** Independent explicit calendar query: no natal M1 calculation, no hidden current time. */
export function monthlyLuckAtMinute(input:{readonly timeline:CompiledMonthlyTimeline;readonly queryMinute:string;readonly policyId:string}){
  policy(input?.policyId);check(typeof input.queryMinute==="string"&&isGregorianMinute(input.queryMinute),"VALID_EXPLICIT_MONTHLY_QUERY_MINUTE_REQUIRED");const s=state(input.timeline),query=input.queryMinute,year=Number(query.slice(0,4));
  const common={schemaVersion:"monthly-luck-at-minute-v1" as const,queryMinute:query,gregorianCalendarMonth:query.slice(0,7),queryScope:"INDEPENDENT_EXPLICIT_CALENDAR_QUERY_NO_NATAL_CARTESIAN_PRODUCT" as const,precision:MONTHLY_LUCK_METADATA.precision,...refs("time","precision")};
  if(query<FROM||query>=UNTIL)return freeze({...common,status:"POLICY_UNRESOLVED" as const,reason:"QUERY_OUTSIDE_VERIFIED_MODERN_CLOCK_POLICY",confidence:null,entries:[],missingData:[]});
  // A whole civil year's 12 Jie prevents extrapolation past an incomplete interior prefix.
  // The local loader already enforces a stronger full-24-term calendar-year contract.
  const required=[{year:year-1,term:"DAXUE" as const},...MONTH_BOUNDARY_JIE.map(term=>({year,term}))];
  const missingData=required.filter(e=>!s.byKey.has(key(e.year,e.term))).map(e=>missing(e.year,e.term,"MONTHLY_QUERY_CONTEXT"));
  if(missingData.length)return freeze({...common,status:"NEEDS_DATA" as const,reason:"COMPLETE_QUERY_YEAR_JIE_CONTEXT_REQUIRED",confidence:null,entries:[],missingData});
  const around=s.events.filter(e=>eventYear(e)===year||(eventYear(e)===year-1&&e.term==="DAXUE"));
  const result=resolveYearMonthPillars(around,query);check(result.monthBoundaryTrace,"MONTHLY_EXISTING_MONTH_TRACE_REQUIRED");
  const entries=result.candidates.map((candidate,index)=>{
    const trace=result.monthBoundaryTrace!.candidateContexts[index]!;const start=s.byKey.get(key(Number(trace.activeSince.displayedDateTime.slice(0,4)),trace.activeSince.term))!;
    const expectedEnd=nextOf(start),end=s.byKey.get(key(expectedEnd.year,expectedEnd.term))??null;
    if(end)check(start.displayedDateTime<end.displayedDateTime,"MONTHLY_PERIOD_ORDER_REQUIRED");
    const yearLabel=candidate.year.stem===sexagenaryYearForCivilYear(year).stem&&candidate.year.branch===sexagenaryYearForCivilYear(year).branch?year:year-1;
    return {id:"monthly-query#alternative["+index+"]",queryAlternativeIndex:index,yearLabel,yearPillar:{...candidate.year},monthPillar:{...candidate.month},monthBranch:trace.monthBranch,boundarySide:trace.boundarySide,
      intervalStatus:end?"RESOLVED_UNDER_POLICY" as const:"NEEDS_DATA" as const,
      nominalInterval:{startInclusive:start.displayedDateTime,endExclusive:end?.displayedDateTime??null,precision:"MINUTE" as const},
      activeSince:start,untilEvent:end,missingData:end?[]:[missing(expectedEnd.year,expectedEnd.term,"MONTHLY_PERIOD_END")],
      calculationSourceRefs:[...new Set([...start.sourceIds,...(end?.sourceIds??[]),...s.byKey.get(key(year,"LICHUN"))!.sourceIds])],...refs("time","precision")};
  });
  const missingEnds=uniqueMissing(entries.flatMap(e=>e.missingData));
  return freeze({...common,status:result.confidence==="PUBLISHED_MINUTE_AMBIGUOUS"?"AMBIGUOUS" as const:missingEnds.length?"PARTIAL" as const:"RESOLVED_UNDER_POLICY" as const,
    reason:null,confidence:result.confidence,entries,missingData:missingEnds});
}

/** Label-year table: 寅 at that year's Lichun through 丑 before next year's Lichun. */
export function monthlyLuckYearTable(input:{readonly timeline:CompiledMonthlyTimeline;readonly year:number;readonly policyId:string}){
  policy(input?.policyId);check(Number.isInteger(input.year)&&input.year>=1&&input.year<=9999,"MONTHLY_YEAR_MUST_BE_1_TO_9999");const s=state(input.timeline),year=input.year;
  const common={schemaVersion:"monthly-luck-year-table-v1" as const,yearLabel:year,yearLabelBoundary:"LICHUN_NOT_JANUARY_1" as const,tableMeaning:MONTHLY_LUCK_METADATA.yearTableMeaning,precision:MONTHLY_LUCK_METADATA.precision,...refs("table","precision")};
  if(year<1989||year>2026)return freeze({...common,status:"POLICY_UNRESOLVED" as const,yearPillar:null,rows:[],missingData:[],reason:"TABLE_YEAR_OUTSIDE_VERIFIED_MODERN_CLOCK_POLICY"});
  const yearPillar=sexagenaryYearForCivilYear(year);
  const rows=MONTH_BOUNDARY_JIE.map((term,index)=>{
    const startYear=year+(term==="XIAOHAN"?1:0),nextTerm=MONTH_BOUNDARY_JIE[(index+1)%12]!,endYear=year+(index>=10?1:0),start=s.byKey.get(key(startYear,term))??null,end=s.byKey.get(key(endYear,nextTerm))??null;
    if(start&&end)check(start.displayedDateTime<end.displayedDateTime,"MONTHLY_PERIOD_ORDER_REQUIRED");
    const absent=[...(!start?[missing(startYear,term,"MONTHLY_PERIOD_START")]:[]),...(!end?[missing(endYear,nextTerm,"MONTHLY_PERIOD_END")]:[])];
    return {id:"monthly-year["+year+"]#month["+index+"]",ordinal:index+1,monthBranch:MONTH_BRANCH_BY_JIE[term],monthPillar:monthPillarFromYearStem(yearPillar.stem,MONTH_BRANCH_BY_JIE[term]),
      status:absent.length?"NEEDS_DATA" as const:"RESOLVED_UNDER_POLICY" as const,calendarMonthAtStart:start?.displayedDateTime.slice(0,7)??null,
      nominalInterval:{startInclusive:start?.displayedDateTime??null,endExclusive:end?.displayedDateTime??null,precision:"MINUTE" as const},
      activeSince:start,untilEvent:end,missingData:absent,calculationSourceRefs:[...new Set([...(start?.sourceIds??[]),...(end?.sourceIds??[])])],...refs("table","precision")};
  });
  return freeze({...common,status:rows.every(r=>r.status==="RESOLVED_UNDER_POLICY")?"RESOLVED_UNDER_POLICY" as const:rows.every(r=>r.status==="NEEDS_DATA")?"NEEDS_DATA" as const:"PARTIAL" as const,
    yearPillar,rows,missingData:uniqueMissing(rows.flatMap(r=>r.missingData)),reason:null});
}
