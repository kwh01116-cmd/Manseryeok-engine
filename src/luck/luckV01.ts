import { ganZhiAt, ganZhiIndex, type GanZhi } from "../domain/sexagenary.js";
import { STEM_NATURE } from "../domain/stems.js";
import { MONTH_BOUNDARY_JIE } from "../calendar/monthPillar.js";
import { isGregorianMinute, validateKstMinuteSolarTermTimeline } from "../calendar/solarTermTimeline.js";
import { gregorianDayNumber } from "../calendar/koreanLunisolarValidation.js";
import { resolveYearPillarAtLichun, sexagenaryYearForCivilYear } from "../calendar/yearPillar.js";
import { SOLAR_TERM_CODES, type SolarTermEvent } from "../calendar/solarTerms.js";

export const M7_LUCK_POLICY_V01 = "M7-TRADITIONAL-YEAR-STEM-JIE-3D-V01" as const;
export const M7_LUCK_VERSION = "0.1.0" as const;
export const MAX_LUCK_COUNT = 20;
export const MODEL_YEAR_DENOMINATOR_MINUTES = 3 * 24 * 60;
export const LUCK_POLICIES = Object.freeze({
  direction:"M7-YEAR-STEM-TRADITIONAL-SEX-DIRECTION-V01",
  sequence:"M7-MONTH-ADJACENT-SEXAGENARY-SEQUENCE-V01",
  start:"M7-TWELVE-JIE-ADJACENT-START-V01",
  age:"M7-THREE-DAYS-PER-MODEL-YEAR-V01",
  precision:"M7-PUBLISHED-MINUTE-CONDITIONAL-V01",
  display:"M7-MODEL-YEAR-SIX-DECIMAL-HALF-UP-V01",
  annualLabel:"M7-ANNUAL-YEAR-LABEL-SEXAGENARY-V01",
  annualTime:"M7-ANNUAL-LICHUN-PUBLISHED-MINUTE-V01",
  calendarProjection:"M7-CALENDAR-PROJECTION-UNRESOLVED-V01",
} as const);
const SOURCE_DAYUN="CLASSIC-SANMINGTONGHUI-V2-LUN-DAYUN-TRANSCRIPTION";
const SOURCE_TAISUI="CLASSIC-SANMINGTONGHUI-V2-LUN-TAISUI-TRANSCRIPTION";
const SOURCE_YUANHAI="CLASSIC-YUANHAI-ZIPING-V1-QI-DAYUN-TRANSCRIPTION";
const SOURCE_IMPL="IMPL-M7-LUCK-V01";
const SOURCE_YEAR="IMPL-M1-YEAR-PILLAR-LICHUN";
const RULES = Object.freeze({direction:"M7-RULE-DIRECTION-001",sequence:"M7-RULE-ADJACENT-MONTH-SEQUENCE-001",
  start:"M7-RULE-TWELVE-JIE-START-001",age:"M7-RULE-MODEL-AGE-RATIO-001",precision:"M7-RULE-MINUTE-PRECISION-001",
  display:"M7-RULE-MODEL-AGE-DISPLAY-001",annualLabel:"M7-RULE-ANNUAL-YEAR-LABEL-001",
  annualTime:"M7-RULE-ANNUAL-LICHUN-001",calendarProjection:"M7-RULE-CALENDAR-PROJECTION-HELD-001"} as const);
function freeze<T>(value:T):T {
  if(value && typeof value==="object" && !Object.isFrozen(value)){
    Object.values(value).forEach(freeze);Object.freeze(value);
  }
  return value;
}
const source=(id:string,url:string,evidenceLayer:string,contribution:string)=>({id,url,evidenceLayer,contribution,
  observedOn:"2026-11-10",revisionUrl:id===SOURCE_DAYUN||id===SOURCE_TAISUI?"https://zh.wikisource.org/w/index.php?title=三命通會/卷二&oldid=2292392":null,
  criticalEdition:null,scanReview:"NOT_PERFORMED",editionVerification:"UNVERIFIED",rightsReview:"UNVERIFIED"});
const ruleSources:Record<keyof typeof RULES,readonly string[]>={direction:[SOURCE_DAYUN,SOURCE_YUANHAI,SOURCE_IMPL],
  sequence:[SOURCE_YUANHAI,SOURCE_IMPL],start:[SOURCE_DAYUN,SOURCE_YUANHAI,SOURCE_IMPL],age:[SOURCE_DAYUN,SOURCE_YUANHAI,SOURCE_IMPL],
  precision:[SOURCE_IMPL],display:[SOURCE_IMPL],annualLabel:[SOURCE_TAISUI,SOURCE_YEAR],annualTime:[SOURCE_YEAR,SOURCE_IMPL],calendarProjection:[SOURCE_IMPL]};
export const M7_LUCK_POLICY_METADATA=freeze({id:M7_LUCK_POLICY_V01,version:M7_LUCK_VERSION,
  milestone:"M7",historicalProposal:"M4-RULE-LUCK-CYCLE-001_NOT_A_RUNTIME_VERSION_OR_MILESTONE",
  meaning:"TRADITIONAL_TIMELINE_ARITHMETIC_NOT_PREDICTION",codeability:"CONDITIONAL",disputeStatus:"SCHOOL_DEPENDENT",
  policies:Object.entries(LUCK_POLICIES).map(([kind,id])=>({kind,id,version:M7_LUCK_VERSION})),
  rules:(Object.keys(RULES) as (keyof typeof RULES)[]).map(kind=>({id:RULES[kind],version:M7_LUCK_VERSION,
    policyRefs:[LUCK_POLICIES[kind]],sourceRefs:ruleSources[kind],meaning:"SELECTED_V01_CONVENTION_NOT_EDITION_CERTIFICATION"})),
  sources:[source(SOURCE_DAYUN,"https://zh.wikisource.org/zh-hant/三命通會/卷二#論大運","CLASSICAL_TRANSCRIPTION","DIRECTION_FUTURE_PAST_AND_THREE_DAY_RATIO"),
    source(SOURCE_TAISUI,"https://zh.wikisource.org/zh-hant/三命通會/卷二#論太歲","CLASSICAL_TRANSCRIPTION","ROTATING_ANNUAL_GANZHI_CONCEPT_NOT_LICHUN_BOUNDARY_PROOF"),
    source(SOURCE_YUANHAI,"https://www.shidianguji.com/zh/book/SDZJ0626/chapter/1lhnc3bvvh5bo","CLASSICAL_TRANSCRIPTION","JIE_NOT_ZHONGQI_AND_ADJACENT_MONTH_EXAMPLES_WITH_VARIANTS"),
    source(SOURCE_IMPL,"src/luck/luckV01.ts","MODERN_IMPLEMENTATION_CONVENTION","EXACT_NOMINAL_MINUTE_RATIO_CONDITIONAL_BOUNDARY_AND_HELD_CALENDAR_PROJECTION"),
    source(SOURCE_YEAR,"src/calendar/yearPillar.ts","EXISTING_IMPLEMENTATION_REFERENCE","EXISTING_1984_ANCHOR_AND_LICHUN_RESOLVER")],
  open:["CRITICAL_EDITION_AND_SCAN_NOT_AUTHENTICATED","RIGHTS_UNVERIFIED","EXACT_CALENDAR_PROJECTION_UNRESOLVED","NO_PREDICTIVE_VALIDITY_CLAIM"]});

export type LuckDirection="FORWARD"|"REVERSE";
export type TraditionalSex="MALE"|"FEMALE";
export type LuckBoundarySide="DEFINITE"|"BEFORE_PUBLISHED_MINUTE"|"AFTER_PUBLISHED_MINUTE";
type RuleKind=keyof typeof RULES;
function reject(message:string):never {throw new RangeError(message);}
function policy(id:unknown):void {if(id!==M7_LUCK_POLICY_V01)reject("EXPLICIT_SUPPORTED_M7_POLICY_REQUIRED");}
function direction(value:unknown):asserts value is LuckDirection {if(value!=="FORWARD"&&value!=="REVERSE")reject("EXPLICIT_LUCK_DIRECTION_REQUIRED");}
function countOf(count:unknown):asserts count is number {if(!Number.isInteger(count)||typeof count!=="number"||count<1||count>MAX_LUCK_COUNT)reject("LUCK_COUNT_MUST_BE_1_TO_20");}
function pillar(value:GanZhi):void {if(!value||ganZhiIndex(value.stem,value.branch)===null)reject("INVALID_SEXAGENARY_PILLAR");}
function refs(...kinds:RuleKind[]){return {policyId:M7_LUCK_POLICY_V01,policyVersion:M7_LUCK_VERSION,
  policyRefs:kinds.map(k=>LUCK_POLICIES[k]),ruleRefs:kinds.map(k=>RULES[k]),sourceRefs:[...new Set(kinds.flatMap(k=>ruleSources[k]))]};}

export function resolveLuckDirection(input:{yearPillar:GanZhi;traditionalSex:TraditionalSex;policyId:string}){
  policy(input?.policyId);pillar(input.yearPillar);
  if(input.traditionalSex!=="MALE"&&input.traditionalSex!=="FEMALE")reject("EXPLICIT_TRADITIONAL_SEX_REQUIRED");
  const polarity=STEM_NATURE[input.yearPillar.stem].polarity;
  const forward=(polarity==="YANG"&&input.traditionalSex==="MALE")||(polarity==="YIN"&&input.traditionalSex==="FEMALE");
  return freeze({status:"OK" as const,direction:forward?"FORWARD" as const:"REVERSE" as const,
    yearPillar:{...input.yearPillar},yearStem:input.yearPillar.stem,yearStemPolarity:polarity,traditionalSex:input.traditionalSex,...refs("direction")});
}
export function luckPillarSequence(input:{monthPillar:GanZhi;direction:LuckDirection;count:number;policyId:string}){
  policy(input?.policyId);pillar(input.monthPillar);direction(input.direction);countOf(input.count);
  const index=ganZhiIndex(input.monthPillar.stem,input.monthPillar.branch)!;
  return freeze({status:"OK" as const,monthPillar:{...input.monthPillar},direction:input.direction,count:input.count,
    firstRelation:"ADJACENT_EXCLUDES_NATAL_MONTH" as const,
    entries:Array.from({length:input.count},(_,i)=>({ordinal:i+1,pillar:ganZhiAt(index+(input.direction==="FORWARD"?1:-1)*(i+1))})),...refs("sequence")});
}

export interface ModelAge {readonly numerator:number;readonly denominator:number;readonly reduced:{readonly numerator:number;readonly denominator:number};readonly unit:"MODEL_YEAR";}
function gcd(a:number,b:number):number {while(b){const next=a%b;a=b;b=next;}return a;}
function rational(numerator:number,denominator:number):ModelAge {
  if(!Number.isSafeInteger(numerator)||numerator<0||!Number.isSafeInteger(denominator)||denominator<=0)reject("INVALID_MODEL_AGE_RATIONAL");
  const divisor=gcd(numerator,denominator);
  return freeze({numerator,denominator,reduced:{numerator:numerator/divisor,denominator:denominator/divisor},unit:"MODEL_YEAR" as const});
}
export function modelAgeFromMinutes(minutes:number,policyId:string):ModelAge {policy(policyId);return rational(minutes,MODEL_YEAR_DENOMINATOR_MINUTES);}
export function displayModelAge(age:ModelAge,policyId:string){
  policy(policyId);if(age?.unit!=="MODEL_YEAR")reject("MODEL_YEAR_UNIT_REQUIRED");
  const value=rational(age.numerator,age.denominator),numerator=BigInt(value.numerator),denominator=BigInt(value.denominator),scale=1_000_000n;
  let whole=numerator/denominator;
  let fraction=(2n*(numerator%denominator)*scale+denominator)/(2n*denominator);
  if(fraction===scale){whole++;fraction=0n;}
  return freeze({value:whole+"."+String(fraction).padStart(6,"0"),decimalPlaces:6,rounding:"HALF_UP_DISPLAY_ONLY",...refs("display")});
}
export function modelAgeIntervals(age:ModelAge,count:number,policyId:string){
  policy(policyId);countOf(count);if(age?.unit!=="MODEL_YEAR")reject("MODEL_YEAR_UNIT_REQUIRED");
  const exact=rational(age.numerator,age.denominator);
  return freeze(Array.from({length:count},(_,index)=>({ordinal:index+1,
    startInclusive:rational(exact.numerator+10*index*exact.denominator,exact.denominator),
    endExclusive:rational(exact.numerator+10*(index+1)*exact.denominator,exact.denominator),unit:"MODEL_YEAR" as const})));
}

export interface CompiledLuckTimeline {readonly schemaVersion:"m7-luck-timeline-v01";readonly events:readonly SolarTermEvent[];}
interface TimelineState {readonly jie:readonly SolarTermEvent[];readonly lichun:ReadonlyMap<number,SolarTermEvent>;}
const timelines=new WeakMap<CompiledLuckTimeline,TimelineState>();
/** Validate once, copy and deeply freeze. This is structural evidence, not external authentication. */
export function compileLuckTimeline(events:readonly SolarTermEvent[]):CompiledLuckTimeline {
  if(!Array.isArray(events))reject("SOLAR_TIMELINE_REQUIRED");validateKstMinuteSolarTermTimeline(events);
  for(const event of events){
    if(!(SOLAR_TERM_CODES as readonly string[]).includes(event.term))reject("KNOWN_SOLAR_TERM_REQUIRED");
    if(!Array.isArray(event.sourceIds)||!event.sourceIds.length||event.sourceIds.some((id:unknown)=>typeof id!=="string"||!id.trim()))reject("EVENT_SOURCE_IDS_REQUIRED");
  }
  const copied=events.map(e=>freeze({term:e.term,displayedDateTime:e.displayedDateTime,timeBasis:e.timeBasis,sourcePrecision:e.sourcePrecision,sourceIds:[...e.sourceIds]}));
  const compiled=freeze({schemaVersion:"m7-luck-timeline-v01" as const,events:copied});
  const jie=copied.filter(e=>(MONTH_BOUNDARY_JIE as readonly string[]).includes(e.term));
  timelines.set(compiled,{jie,lichun:new Map(copied.filter(e=>e.term==="LICHUN").map(e=>[Number(e.displayedDateTime.slice(0,4)),e]))});return compiled;
}
function timeline(value:CompiledLuckTimeline):TimelineState {const state=timelines.get(value);if(!state)reject("COMPILED_LUCK_TIMELINE_REQUIRED");return state;}
function minute(value:string):number {
  if(typeof value!=="string"||!isGregorianMinute(value))reject("VALID_EXPLICIT_CIVIL_MINUTE_REQUIRED");
  return gregorianDayNumber(value.slice(0,10))*1440+Number(value.slice(11,13))*60+Number(value.slice(14,16));
}
type NeededEvent={year:number;term:string;feature:"DA_YUN_START"|"ANNUAL_LUCK_AT_MINUTE";side?:LuckDirection;reason:string};
function neighbor(event:SolarTermEvent,sign:1|-1){
  const index=(MONTH_BOUNDARY_JIE as readonly string[]).indexOf(event.term);if(index<0)reject("JIE_EVENT_REQUIRED");
  const term=MONTH_BOUNDARY_JIE[(index+sign+12)%12]!;
  const year=Number(event.displayedDateTime.slice(0,4))+(event.term==="DAXUE"&&sign===1?1:event.term==="XIAOHAN"&&sign===-1?-1:0);
  return {year,term};
}
const sameEvent=(expected:{year:number;term:string},actual:SolarTermEvent)=>expected.term===actual.term&&expected.year===Number(actual.displayedDateTime.slice(0,4));
const projection=()=>({status:"POLICY_UNRESOLVED" as const,policyId:LUCK_POLICIES.calendarProjection,policyVersion:M7_LUCK_VERSION,
  reason:"NO_ADOPTED_CALENDAR_YEAR_MONTH_DAY_ADDITION_POLICY",exactStartDate:null,currentDecade:null});
const precision=()=>({basis:"PUBLISHED_MINUTE_NOMINAL_ARITHMETIC",actualInstantCertified:false,birthClockPrecision:"RECORDED_MINUTE",eventPrecision:"MINUTE",unknownRounding:"NO_ASSUMED_SECONDS_INTERVAL"});
export function resolveLuckStart(input:{timeline:CompiledLuckTimeline;birthMinute:string;direction:LuckDirection;boundarySide:LuckBoundarySide;policyId:string}){
  policy(input?.policyId);direction(input.direction);const birth=minute(input.birthMinute),state=timeline(input.timeline),events=state.jie;
  if(!["DEFINITE","BEFORE_PUBLISHED_MINUTE","AFTER_PUBLISHED_MINUTE"].includes(input.boundarySide))reject("EXPLICIT_BOUNDARY_SIDE_REQUIRED");
  let lo=0,hi=events.length;while(lo<hi){const mid=(lo+hi)>>1;if(events[mid]!.displayedDateTime<input.birthMinute)lo=mid+1;else hi=mid;}
  const equal=events[lo]?.displayedDateTime===input.birthMinute?events[lo]:undefined;
  if(!equal&&input.boundarySide!=="DEFINITE")reject("BOUNDARY_SIDE_WITHOUT_EQUAL_JIE");
  const before=events[lo-1],after=events[lo+(equal?1:0)];
  const base={birthMinute:input.birthMinute,direction:input.direction,boundarySide:input.boundarySide,
    precision:precision(),calendarProjection:projection(),...refs("start","age","precision","calendarProjection")};
  const missing=(need:{year:number;term:string},reason:string)=>freeze({...base,status:"NEEDS_DATA" as const,
    selectedEvent:null,nominalIntervalMinutes:null,age:null,displayAge:null,
    missingData:[{...need,feature:"DA_YUN_START" as const,side:input.direction,reason} satisfies NeededEvent]});
  if(equal && (input.boundarySide==="DEFINITE"||(input.direction==="FORWARD"&&input.boundarySide==="BEFORE_PUBLISHED_MINUTE")||(input.direction==="REVERSE"&&input.boundarySide==="AFTER_PUBLISHED_MINUTE"))){
    return freeze({...base,status:"AMBIGUOUS" as const,selectedEvent:equal,nominalIntervalMinutes:0,age:null,displayAge:null,missingData:[],
      reason:"COINCIDENT_PUBLISHED_MINUTE_NOT_AN_EXACT_ZERO_AGE"});
  }
  const previous=before,next=equal?after:events[lo];
  const selected=input.direction==="FORWARD"?next:previous;
  const anchor=equal??(input.direction==="FORWARD"?previous:next);
  if(!selected){
    const reference=equal??(input.direction==="FORWARD"?previous:next);
    if(reference)return missing(neighbor(reference,input.direction==="FORWARD"?1:-1),"MISSING_ADJACENT_JIE");
    const calendar=[MONTH_BOUNDARY_JIE[11]!,...MONTH_BOUNDARY_JIE.slice(0,11)];
    return missing({year:Number(input.birthMinute.slice(0,4)),term:calendar[Number(input.birthMinute.slice(5,7))-1]!},"NO_JIE_WITNESS_FOR_BIRTH_WINDOW");
  }
  if(anchor){const expected=neighbor(anchor,input.direction==="FORWARD"?1:-1);if(!sameEvent(expected,selected))return missing(expected,"INTERIOR_JIE_GAP_NO_FAR_JUMP");}
  else if(selected.displayedDateTime.slice(0,7)!==input.birthMinute.slice(0,7)){
    return missing(neighbor(selected,input.direction==="FORWARD"?-1:1),"UNBRACKETED_WINDOW_NO_STALE_JIE_ASSUMPTION");
  }
  const interval=input.direction==="FORWARD"?minute(selected.displayedDateTime)-birth:birth-minute(selected.displayedDateTime);
  if(interval<=0)reject("NONPOSITIVE_OR_WRONG_DIRECTION_INTERVAL");
  const age=modelAgeFromMinutes(interval,input.policyId);
  return freeze({...base,status:"OK" as const,selectedEvent:selected,nominalIntervalMinutes:interval,age,
    displayAge:displayModelAge(age,input.policyId),missingData:[]});
}

export function annualLuckYearLabel(year:number,policyId:string){
  policy(policyId);if(!Number.isInteger(year)||year<1||year>9999)reject("ANNUAL_LABEL_YEAR_MUST_BE_1_TO_9999");
  return freeze({status:"OK" as const,year,pillar:sexagenaryYearForCivilYear(year),boundaryMeaning:"YEAR_LABEL_NOT_TIMESTAMP",...refs("annualLabel")});
}
export function annualLuckAtMinute(input:{timeline:CompiledLuckTimeline;queryMinute:string;policyId:string}){
  policy(input?.policyId);minute(input.queryMinute);const state=timeline(input.timeline),year=Number(input.queryMinute.slice(0,4)),lichun=state.lichun.get(year);
  if(!lichun)return freeze({status:"NEEDS_DATA" as const,queryMinute:input.queryMinute,confidence:null,entries:[],lichun:null,
    missingData:[{year,term:"LICHUN",feature:"ANNUAL_LUCK_AT_MINUTE",reason:"MISSING_QUERY_YEAR_LICHUN"} satisfies NeededEvent],...refs("annualTime","precision")});
  // Reuse existing M1 boundary semantics with the relevant, already validated event.
  const resolved=resolveYearPillarAtLichun([lichun],input.queryMinute);
  const entries=resolved.selected?[{yearLabel:input.queryMinute<lichun.displayedDateTime?year-1:year,condition:"DEFINITE",pillar:resolved.selected}]
    :[{yearLabel:year-1,condition:"BEFORE_PUBLISHED_MINUTE",pillar:resolved.pillarBeforeBoundary},{yearLabel:year,condition:"AFTER_PUBLISHED_MINUTE",pillar:resolved.pillarAfterBoundary}];
  return freeze({status:resolved.selected?"OK" as const:"AMBIGUOUS" as const,queryMinute:input.queryMinute,confidence:resolved.confidence,entries,lichun,missingData:[],...refs("annualTime","precision")});
}
