import { STEM_NATURE, type FiveElement } from "../domain/stems.js";
import { gregorianDayNumber, gregorianDateFromDayNumber } from "../calendar/koreanLunisolarValidation.js";
import { isGregorianMinute } from "../calendar/solarTermTimeline.js";
import { SOLAR_TERM_DEFINITIONS } from "../calendar/solarTerms.js";
import { M3_SEASONAL_POLICY_ID, M3_SEASONAL_POLICY_METADATA, resolveSeasonalState, type SeasonalStateInput, type SeasonalAppliedJie, type SeasonalState, type FourSeason } from "./seasonalStateV1.js";

export const M3_SEASONAL_SILI_POLICY_ID = "M3-SEASONAL-SILI-PRE18-NOMINAL-MINUTES-V02" as const;
export const M3_SEASONAL_SILI_VERSION = "0.2.0" as const;
export const M3_SEASONAL_SILI_SCHEMA = "m3-seasonal-sili-state-v02" as const;
export const SILI_PRE18_MINUTES = 25920 as const;
export type SeasonalSiliSeason = FourSeason | "EARTH_DOMINANT";
export type SeasonalMonthCondition = "BEFORE_PUBLISHED_BOUNDARY" | "AFTER_PUBLISHED_BOUNDARY" | "BETWEEN_PUBLISHED_BOUNDARIES";
const QIANLI="TXT-QIANLI-MINGGAO-TIANYA-SILI-PRE18", SANMING="TXT-SANMING-TONGHUI-SHIDIAN-REN_YUAN-SISI", WUXING="TXT-WUXING-DAYI-KYOTO-SHI_XIU_WANG", IMPL="IMPL-M3-SEASONAL-SILI-PRE18-V02";
const RULES=["M3-SEASONAL-SILI-PRE18-002","M3-SEASONAL-SILI-FIVE-STATE-TABLE-002","M3-SEASONAL-SILI-NOMINAL-MINUTE-002","M3-SEASONAL-SILI-PARENT-CORRELATION-002"] as const;
const ELEMENTS=["WOOD","FIRE","EARTH","METAL","WATER"] as const;
const NAMES:Readonly<Record<SeasonalSiliSeason,string>>={SPRING:"봄",SUMMER:"여름",AUTUMN:"가을",WINTER:"겨울",EARTH_DOMINANT:"토왕"};
const ELEMENT_NAMES:Readonly<Record<FiveElement,string>>={WOOD:"목",FIRE:"화",EARTH:"토",METAL:"금",WATER:"수"};
const ELEMENT_TOPICS:Readonly<Record<FiveElement,string>>={WOOD:"목은",FIRE:"화는",EARTH:"토는",METAL:"금은",WATER:"수는"};
const LABELS:Readonly<Record<SeasonalState,string>>={WANG:"왕(旺)",XIANG:"상(相)",XIU:"휴(休)",QIU:"수(囚)",SI:"사(死)"};
// Reuse the existing twenty cells unchanged; only the five earth-dominant cells are new.
const TABLE:Readonly<Record<SeasonalSiliSeason,Readonly<Record<FiveElement,SeasonalState>>>>={
  ...M3_SEASONAL_POLICY_METADATA.elementStates,
  EARTH_DOMINANT:{WOOD:"QIU",FIRE:"XIU",EARTH:"WANG",METAL:"XIANG",WATER:"SI"},
};
const EARTH_MONTHS={辰:{season:"SPRING",start:"QINGMING",end:"LIXIA"},未:{season:"SUMMER",start:"XIAOSHU",end:"LIQIU"},戌:{season:"AUTUMN",start:"HANLU",end:"LIDONG"},丑:{season:"WINTER",start:"XIAOHAN",end:"LICHUN"}} as const;
const frozen=new WeakSet<object>();
function check(ok:unknown,code:string):asserts ok {if(!ok)throw new RangeError(code);}
function record(value:unknown):Record<string,unknown>{check(value!==null&&typeof value==="object"&&!Array.isArray(value),"M3_SILI_PLAIN_RECORD_REQUIRED");const p=Object.getPrototypeOf(value);check(p===Object.prototype||p===null,"M3_SILI_PLAIN_RECORD_REQUIRED");return value as Record<string,unknown>;}
function freeze<T>(value:T):T {if(value===null||typeof value!=="object"){check(typeof value!=="function","M3_SILI_DATA_ONLY_REQUIRED");return value;}if(frozen.has(value))return value;const r=Array.isArray(value)?value:record(value);const copy=Array.isArray(r)?Array.from(r,freeze):Object.fromEntries(Object.entries(r).map(([k,v])=>[k,freeze(v)]));Object.freeze(copy);frozen.add(copy);return copy as T;}
function equal(a:unknown,b:unknown):boolean {if(a===b)return true;if(a===null||b===null||typeof a!=="object"||typeof b!=="object"||Array.isArray(a)!==Array.isArray(b))return false;
  if(Array.isArray(a)&&Array.isArray(b)){if(a.length!==b.length||!Array.from(a,(_,i)=>Object.hasOwn(a,i)).every(Boolean)||!Array.from(b,(_,i)=>Object.hasOwn(b,i)).every(Boolean))return false;}
  else if(![Object.prototype,null].includes(Object.getPrototypeOf(a))||![Object.prototype,null].includes(Object.getPrototypeOf(b)))return false;
  const ak=Reflect.ownKeys(a),bk=Reflect.ownKeys(b);if(ak.some(k=>typeof k!=="string")||bk.some(k=>typeof k!=="string"))return false;
  const as=ak.map(String).sort(),bs=bk.map(String).sort();return as.length===bs.length&&as.every((k,i)=>k===bs[i]&&equal((a as Record<string,unknown>)[k],(b as Record<string,unknown>)[k]));}
function refs(value:unknown):readonly string[]{check(Array.isArray(value)&&value.length>0&&Array.from(value).every(v=>typeof v==="string"&&v.trim().length>0)&&new Set(value).size===value.length,"M3_SILI_UNIQUE_NONEMPTY_REFERENCES_REQUIRED");return value;}
function explicit(id:string):void{check(id===M3_SEASONAL_SILI_POLICY_ID,"M3_SILI_EXPLICIT_SUPPORTED_POLICY_REQUIRED");}
function civilMinute(value:string):number {check(typeof value==="string"&&isGregorianMinute(value),"M3_SILI_VALID_GREGORIAN_MINUTE_REQUIRED");return gregorianDayNumber(value.slice(0,10))*1440+Number(value.slice(11,13))*60+Number(value.slice(14,16));}
function fromMinute(value:number):string {check(Number.isSafeInteger(value),"M3_SILI_SAFE_MINUTE_REQUIRED");const day=Math.floor(value/1440),time=value-day*1440;const date=gregorianDateFromDayNumber(day);check(/^\d{4}-/.test(date),"M3_SILI_MINUTE_OUT_OF_RANGE");return date+"T"+String(Math.floor(time/60)).padStart(2,"0")+":"+String(time%60).padStart(2,"0");}
function expectedMonth(value:SeasonalAppliedJie,month:number):void {check(Number(value.displayedDateTime.slice(5,7))===month,"M3_SILI_EVENT_CIVIL_MONTH_MISMATCH");}

export const M3_SEASONAL_SILI_METADATA=freeze({
  id:M3_SEASONAL_SILI_POLICY_ID,version:M3_SEASONAL_SILI_VERSION,schemaVersion:M3_SEASONAL_SILI_SCHEMA,
  kind:"SELECTED_TRADITIONAL_SEASONAL_CLASSIFICATION",scope:"EXISTING_SAJU_MONTH_WITH_FOUR_END_MONTH_PRE18_SPLIT",elementStates:TABLE,
  pre18:{days:18,nominalMinutes:SILI_PRE18_MINUTES,boundary:"PUBLISHED_NEXT_SILI_MINUS_25920_NOMINAL_MINUTES",ordinaryIntervals:["[S,B)","[B,T)"],sameDerivedMinute:"CONDITIONAL_SEASONAL_ALTERNATIVES_WITHIN_EXISTING_PARENT",sameSiliMinute:"REUSE_EXISTING_M1_PARENT_PRE_POST_CONDITION"},
  precision:{source:"MINUTE",result:"NOMINAL_MINUTE_UNDER_SELECTED_POLICY",utcInstant:null,unknownSeconds:"NOT_RESOLVED_NO_ASSUMED_INTERVAL_OR_PROBABILITY"},
  clockPolicy:{id:"KR_API_PUBLISHED_KST_MODERN_1988_POST_DST_V1",birthFromInclusive:"1989-01-01T00:00",birthUntilExclusive:"2027-01-01T00:00",eventFromInclusive:"1988-10-09T03:00",eventUntilExclusive:"2027-01-01T00:00",meaning:"EXISTING_MODERN_NOMINAL_CIVIL_MINUTES_NO_UTC_INSTANT"},
  rules:RULES.map((id,index)=>({id,runtimeVersion:M3_SEASONAL_SILI_VERSION,sourceRuleVersion:null,kind:index<2?"SELECTED_TRADITIONAL_RULE":"PROJECT_IMPLEMENTATION_CONVENTION",sourceIds:index===0?[QIANLI]:index===1?[QIANLI,WUXING]:[IMPL],policyIds:[M3_SEASONAL_SILI_POLICY_ID]})),
  sources:[
    {id:QIANLI,kind:"CLASSICAL_TEXT_TRANSCRIPTION",title:"千里命稿",sections:["天干篇：各干勢","月建篇：月建與時令"],url:"https://www.tianyashuku.com/yijing/9623/813414.html",additionalUrl:"https://www.tianyashuku.com/yijing/9623/813404.html",accessedOn:"2026-11-12",verification:"WEB_TRANSCRIPTION_BODY_READ_NOT_SCAN_OR_CRITICAL_EDITION",nativeRuleVersion:null,revision:null,rightsReview:"UNVERIFIED",use:"FOUR_SILI_PRE18_DAYS_AND_FIVE_SEASON_ELEMENT_CLASSIFICATIONS",variant:"辛段顯示四位前；月建篇與其他天干段顯示四立前，保留差異不作掃描校勘認證"},
    {id:SANMING,kind:"CLASSICAL_TEXT_TRANSCRIPTION_COMPARISON",title:"三命通會 卷二",section:"論人元司事",url:"https://www.shidianguji.com/zh/book/SK1610/chapter/1kf5v6o9by5o3",accessedOn:"2026-11-12",verification:"WEB_TRANSCRIPTION_BODY_READ_NOT_SCAN_OR_CRITICAL_EDITION",nativeRuleVersion:null,rightsReview:"UNVERIFIED",use:"DIFFERENT_COMMANDING_QI_ALLOCATIONS_AND_QINGMING_PLUS12_NOT_ADOPTED"},
    {id:WUXING,kind:"CLASSICAL_TEXT_TRANSCRIPTION_COMPARISON",title:"五行大義 卷第二",section:"第三 論四時休王",url:"https://www.zinbun.kyoto-u.ac.jp/~takeda/kyoudou/gogyou/gogyoutaigi/gogyo_gogyo_02_g.html",accessedOn:"2026-11-12",verification:"WEB_TRANSCRIPTION_BODY_READ_NOT_SCAN_OR_CRITICAL_EDITION",nativeRuleVersion:null,rightsReview:"UNVERIFIED",use:"TWENTY_FIVE_STATE_CELLS_COMPARISON_NOT_PRE18_TIMING_AUTHORITY"},
    {id:IMPL,kind:"PROJECT_IMPLEMENTATION_DEFINITION",implementationRef:"src/m3/seasonalStateV2.ts",version:M3_SEASONAL_SILI_VERSION,use:"25920_NOMINAL_MINUTE_SUBTRACTION_PARENT_CORRELATION_REFERENCE_AND_SCOPE_CONTRACT"},
  ],
  excluded:["FINAL_STRENGTH","STRENGTH_SCORE","DE_LING_BINARY_LABEL","COMMANDING_QI_DAYS","EFFECTIVE_ROOT","RELATION_EFFECT","GEJU","YONGSHEN","FORTUNE","PREDICTION"],
  unchangedGate:"docs/research/M3_STRENGTH_GO_NOGO_DECISION_SPEC_20261018.md",
});
export const M3_SEASONAL_SILI_POLICY_METADATA=M3_SEASONAL_SILI_METADATA;

export interface SeasonalSiliInput {
  readonly base:SeasonalStateInput;
  readonly birthDateTime:string;
  readonly monthCondition:SeasonalMonthCondition;
  readonly nextSili:SeasonalAppliedJie|null;
}
interface IntervalAlternative {readonly id:string;readonly condition:"DEFINITE_UNDER_PARENT"|"BEFORE_DERIVED_BOUNDARY"|"AT_OR_AFTER_DERIVED_BOUNDARY";readonly season:SeasonalSiliSeason;}
function checked(input:SeasonalSiliInput):{original:SeasonalSiliInput;ordinarySeason:FourSeason|null} {
  const r=record(input);check(Object.keys(r).length===4&&["base","birthDateTime","monthCondition","nextSili"].every(k=>Object.hasOwn(r,k)),"M3_SILI_MINIMAL_INPUT_REQUIRED");
  // Reuses v0.1's reference/month/day-master contract without altering its deferred semantics.
  const validatedBase=resolveSeasonalState(input.base,{policyId:M3_SEASONAL_POLICY_ID});
  check(!input.base.calculationSourceRefs.some(s=>[QIANLI,SANMING,WUXING,IMPL].includes(s)),"M3_SILI_CALCULATION_AND_LITERATURE_SOURCES_MIXED");
  civilMinute(input.birthDateTime);check(input.birthDateTime>=M3_SEASONAL_SILI_METADATA.clockPolicy.birthFromInclusive&&input.birthDateTime<M3_SEASONAL_SILI_METADATA.clockPolicy.birthUntilExclusive,"M3_SILI_BIRTH_CLOCK_POLICY_RANGE");
  check(input.base.appliedJie.displayedDateTime>=M3_SEASONAL_SILI_METADATA.clockPolicy.eventFromInclusive&&input.base.appliedJie.displayedDateTime<M3_SEASONAL_SILI_METADATA.clockPolicy.eventUntilExclusive,"M3_SILI_EVENT_CLOCK_POLICY_RANGE");
  check(["BEFORE_PUBLISHED_BOUNDARY","AFTER_PUBLISHED_BOUNDARY","BETWEEN_PUBLISHED_BOUNDARIES"].includes(input.monthCondition),"M3_SILI_PARENT_MONTH_CONDITION_REQUIRED");
  check(input.birthDateTime>=input.base.appliedJie.displayedDateTime,"M3_SILI_BIRTH_PRECEDES_ACTIVE_JIE");
  if(input.birthDateTime===input.base.appliedJie.displayedDateTime)check(input.monthCondition==="AFTER_PUBLISHED_BOUNDARY","M3_SILI_ACTIVE_JIE_EQUALITY_REQUIRES_AFTER_PARENT");
  if(input.monthCondition==="AFTER_PUBLISHED_BOUNDARY")check(input.birthDateTime===input.base.appliedJie.displayedDateTime,"M3_SILI_AFTER_PARENT_MUST_EQUAL_ACTIVE_JIE");
  return {original:freeze(input),ordinarySeason:validatedBase.season};
}
const intervals=new WeakSet<object>(),judgments=new WeakSet<object>();
/** Pure structural/policy arithmetic, not API authenticity or publication precision certification. */
export function resolveNominalSeasonalInterval(input:SeasonalSiliInput,{policyId}:{readonly policyId:string}={policyId:""}){
  explicit(policyId);const {original,ordinarySeason}=checked(input),base=original.base;
  const earth=Object.hasOwn(EARTH_MONTHS,base.monthBranch)?EARTH_MONTHS[base.monthBranch as keyof typeof EARTH_MONTHS]:null;
  const common={schemaVersion:"m3-seasonal-sili-interval-v02",id:base.candidateRef+"#m3-seasonal-sili-interval",candidateRef:base.candidateRef,input:original,monthBranch:base.monthBranch,birthDateTime:original.birthDateTime,appliedJie:base.appliedJie,nextSili:original.nextSili,policyId:M3_SEASONAL_SILI_POLICY_ID,policyVersion:M3_SEASONAL_SILI_VERSION};
  let status:"RESOLVED_UNDER_POLICY"|"AMBIGUOUS"|"NEEDS_DATA"="RESOLVED_UNDER_POLICY",derivedBoundary:{displayedDateTime:string;offsetNominalMinutes:number;derivedFromTerm:string;derivedFromDisplayedDateTime:string;calculationSourceRefs:readonly string[];sourceKind:string}|null=null;
  const alternatives:IntervalAlternative[]=[],missingData:{year:number;term:string;feature:string;reason:string}[]=[];
  const alternative=(season:SeasonalSiliSeason,condition:IntervalAlternative["condition"]="DEFINITE_UNDER_PARENT")=>({id:common.id+"#alternative["+alternatives.length+"]",condition,season});
  if(earth===null){
    check(original.nextSili===null,"M3_SILI_ORDINARY_MONTH_DOES_NOT_ACCEPT_FUTURE_EVENT");
    check(ordinarySeason!==null,"M3_SILI_ORDINARY_MONTH_SEASON_REQUIRED");alternatives.push(alternative(ordinarySeason));
  }else{
    check(base.appliedJie.term===earth.start,"M3_SILI_EARTH_MONTH_START_MISMATCH");
    const year=Number(base.appliedJie.displayedDateTime.slice(0,4));
    expectedMonth(base.appliedJie,{QINGMING:4,XIAOSHU:7,HANLU:10,XIAOHAN:1}[earth.start]);
    const t=original.nextSili;
    if(t===null){status="NEEDS_DATA";missingData.push({year,term:earth.end,feature:"M3_SEASONAL_SILI_PRE18",reason:"EXACT_ENDING_SILI_NOT_AVAILABLE_NO_LATER_EVENT_SUBSTITUTION"});}
    else{
      const tr=record(t);check(Object.keys(tr).every(k=>["term","displayedDateTime","timeBasis","sourcePrecision","sourceIds","koreanName"].includes(k)),"M3_SILI_REFERENCE_EVENT_SHAPE_REQUIRED");
      check(t.term===earth.end&&Number(t.displayedDateTime.slice(0,4))===year,"M3_SILI_EXACT_END_TERM_AND_YEAR_REQUIRED");
      check(t.timeBasis==="KST"&&t.sourcePrecision==="MINUTE","M3_SILI_REFERENCE_EVENT_MINUTE_KST_REQUIRED");refs(t.sourceIds);
      check(!t.sourceIds.some(s=>[QIANLI,SANMING,WUXING,IMPL].includes(s)),"M3_SILI_CALCULATION_AND_LITERATURE_SOURCES_MIXED");
      if(t.koreanName!==undefined)check(t.koreanName===SOLAR_TERM_DEFINITIONS[t.term].koreanName,"M3_SILI_REFERENCE_EVENT_NAME_MISMATCH");
      expectedMonth(t,{LIXIA:5,LIQIU:8,LIDONG:11,LICHUN:2}[earth.end]);
      const ts=civilMinute(t.displayedDateTime),ss=civilMinute(base.appliedJie.displayedDateTime),bs=ts-SILI_PRE18_MINUTES;
      check(t.displayedDateTime>=M3_SEASONAL_SILI_METADATA.clockPolicy.eventFromInclusive&&t.displayedDateTime<M3_SEASONAL_SILI_METADATA.clockPolicy.eventUntilExclusive,"M3_SILI_EVENT_CLOCK_POLICY_RANGE");
      check(ss<bs&&bs<ts,"M3_SILI_DERIVED_BOUNDARY_MUST_BE_INSIDE_MONTH");
      check(original.birthDateTime<=t.displayedDateTime,"M3_SILI_BIRTH_AFTER_PARENT_MONTH_END");
      if(original.birthDateTime===t.displayedDateTime)check(original.monthCondition==="BEFORE_PUBLISHED_BOUNDARY","M3_SILI_END_EQUALITY_REQUIRES_BEFORE_PARENT");
      if(original.monthCondition==="BEFORE_PUBLISHED_BOUNDARY")check(original.birthDateTime===t.displayedDateTime,"M3_SILI_BEFORE_PARENT_MUST_EQUAL_END_SILI");
      const boundary=fromMinute(bs);derivedBoundary={displayedDateTime:boundary,offsetNominalMinutes:-SILI_PRE18_MINUTES,derivedFromTerm:t.term,derivedFromDisplayedDateTime:t.displayedDateTime,calculationSourceRefs:[...t.sourceIds],sourceKind:"DERIVED_PROJECT_BOUNDARY_NOT_PUBLISHED_KASI_TERM"};
      if(original.birthDateTime<boundary)alternatives.push(alternative(earth.season));
      else if(original.birthDateTime===boundary){status="AMBIGUOUS";alternatives.push(alternative(earth.season,"BEFORE_DERIVED_BOUNDARY"));alternatives.push(alternative("EARTH_DOMINANT","AT_OR_AFTER_DERIVED_BOUNDARY"));}
      else alternatives.push(alternative("EARTH_DOMINANT"));
    }
  }
  const result=freeze({...common,status,derivedBoundary,alternatives,missingData,precision:M3_SEASONAL_SILI_METADATA.precision});intervals.add(result);return result;
}
export type NominalSeasonalInterval=ReturnType<typeof resolveNominalSeasonalInterval>;
export function validateNominalSeasonalInterval(value:NominalSeasonalInterval):true{check(value!==null&&typeof value==="object"&&intervals.has(value)&&Object.isFrozen(value),"M3_SILI_ISSUED_IMMUTABLE_INTERVAL_REQUIRED");return true;}
/** A table lookup over an issued interval; no new natal candidate is produced at B. */
export function classifySeasonalSiliState(interval:NominalSeasonalInterval,{policyId}:{readonly policyId:string}={policyId:""}){
  explicit(policyId);validateNominalSeasonalInterval(interval);const input=interval.input,base=input.base,dayMasterElement=STEM_NATURE[base.dayMaster].element;
  const alternatives=interval.alternatives.map(item=>({...item,elementStates:TABLE[item.season],seasonalState:TABLE[item.season][dayMasterElement],parentCandidateRef:base.candidateRef}));
  const selected=interval.status==="RESOLVED_UNDER_POLICY"?alternatives[0]!:null;
  const calculationSourceRefs=[...new Set([...base.calculationSourceRefs,...(input.nextSili?.sourceIds??[])])];
  const result=freeze({schemaVersion:M3_SEASONAL_SILI_SCHEMA,resolverVersion:M3_SEASONAL_SILI_VERSION,id:base.candidateRef+"#m3-seasonal-sili-state",candidateRef:base.candidateRef,status:interval.status,reason:interval.status==="AMBIGUOUS"?"DERIVED_BOUNDARY_PUBLISHED_MINUTE_CONDITIONAL":interval.status==="NEEDS_DATA"?"EXACT_ENDING_SILI_REQUIRED":null,
    input,interval,dayMaster:base.dayMaster,dayMasterElement,monthBranch:base.monthBranch,appliedJie:base.appliedJie,nextSili:input.nextSili,derivedBoundary:interval.derivedBoundary,
    season:selected?.season??null,elementStates:selected?.elementStates??null,seasonalState:selected?.seasonalState??null,alternatives,missingData:interval.missingData,
    policy:M3_SEASONAL_SILI_METADATA,policyRefs:[M3_SEASONAL_SILI_POLICY_ID],ruleRefs:RULES,inputEvidenceRefs:base.evidenceRefs,inputFactRefs:base.inputFactRefs,pillarRefs:base.pillarRefs,
    sourceRefs:[QIANLI,SANMING,WUXING,IMPL],literatureSourceRefs:[QIANLI,SANMING,WUXING],implementationSourceRefs:[IMPL],calculationSourceRefs,
    scope:"TRADITIONAL_SEASONAL_CLASSIFICATION_UNDER_SELECTED_PRE18_NOMINAL_MINUTE_CONVENTION",precision:M3_SEASONAL_SILI_METADATA.precision,
    finalStrength:{status:"NOT_IMPLEMENTED",releaseGate:"M3_FINAL_BLOCKED_UNCHANGED"},unresolved:["COMMANDING_QI_DAYS","EFFECTIVE_ROOT","RELATION_EFFECT","FINAL_STRENGTH"],
    validation:{level:"REFERENCE_SHAPE_AND_INPUT_VALUE_CONSISTENCY_ONLY",inputAuthentication:"NOT_PERFORMED_BY_PURE_MODULE",predictiveValidity:"NOT_CLAIMED",editionOrRightsApproval:false,g0Receipt:null,g1P2Promotion:false},
  });judgments.add(result);return result;
}
export type SeasonalSiliStateResult=ReturnType<typeof classifySeasonalSiliState>;
export function resolveSeasonalSiliState(input:SeasonalSiliInput,options:{readonly policyId:string}={policyId:""}){return classifySeasonalSiliState(resolveNominalSeasonalInterval(input,options),options);}
export function validateSeasonalSiliState(value:SeasonalSiliStateResult):true{check(value!==null&&typeof value==="object"&&judgments.has(value)&&Object.isFrozen(value),"M3_SILI_ISSUED_IMMUTABLE_JUDGMENT_REQUIRED");validateNominalSeasonalInterval(value.interval);return true;}
function explanationContent(result:SeasonalSiliStateResult){
  validateSeasonalSiliState(result);const items:{id:string;candidateRef:string;templateId:string;templateVersion:string;judgmentRefs:readonly string[];alternativeRefs:readonly string[];inputEvidenceRefs:readonly string[];inputFactRefs:readonly string[];pillarRefs:readonly string[];policyRefs:readonly string[];ruleRefs:readonly string[];literatureSourceRefs:readonly string[];implementationSourceRefs:readonly string[];calculationSourceRefs:readonly string[];text:string}[]=[];
  const item=(templateId:string,text:string,alternativeRefs:readonly string[]=[])=>({id:result.candidateRef+"#m3-seasonal-sili-explanation["+items.length+"]",candidateRef:result.candidateRef,templateId,templateVersion:M3_SEASONAL_SILI_VERSION,judgmentRefs:[result.id],alternativeRefs,inputEvidenceRefs:result.inputEvidenceRefs,inputFactRefs:result.inputFactRefs,pillarRefs:result.pillarRefs,policyRefs:result.policyRefs,ruleRefs:result.ruleRefs,literatureSourceRefs:result.literatureSourceRefs,implementationSourceRefs:result.implementationSourceRefs,calculationSourceRefs:result.calculationSourceRefs,text});
  if(result.status==="NEEDS_DATA")items.push(item("KO_M3_SILI_NEEDS_EXACT_EVENT",`이 후보의 월지는 ${result.monthBranch}입니다. 해당 월을 끝내는 ${result.missingData[0]!.year}년 ${SOLAR_TERM_DEFINITIONS[result.missingData[0]!.term as keyof typeof SOLAR_TERM_DEFINITIONS].koreanName} 자료가 없어 이 계절 판단만 자료 부족으로 남깁니다. 명식과 구조적 근거는 유지됩니다.`));
  else{
    if(result.status==="AMBIGUOUS")items.push(item("KO_M3_SILI_DERIVED_MINUTE_ALTERNATIVES",`출생 표기 분이 ${result.nextSili!.koreanName??SOLAR_TERM_DEFINITIONS[result.nextSili!.term].koreanName} 발표 시각에서 25,920명목 분을 뺀 경계 ${result.derivedBoundary!.displayedDateTime.replace("T"," ")}와 같습니다. 원국 후보는 유지하고, 경계 전 계절과 토왕의 조건부 분류를 이 후보 안에서 구분합니다.`));
    for(const alt of result.alternatives){
      const state=LABELS[alt.seasonalState],postfix=alt.seasonalState==="WANG"||alt.seasonalState==="XIANG"?"으로":"로";
      const condition=alt.condition==="BEFORE_DERIVED_BOUNDARY"?"경계 전 조건에서는 ":alt.condition==="AT_OR_AFTER_DERIVED_BOUNDARY"?"토왕 시작 조건에서는 ":"";
      const context=alt.season==="EARTH_DOMINANT"?`${SOLAR_TERM_DEFINITIONS[result.nextSili!.term].koreanName} 전 토왕 구간`:Object.hasOwn(EARTH_MONTHS,result.monthBranch)?`${result.monthBranch}월의 토왕 시작 전 ${NAMES[alt.season]} 구간`:`${result.monthBranch}월의 ${NAMES[alt.season]} 구간`;
      items.push(item("KO_M3_SILI_DAY_MASTER",`${condition}선택한 사립 전 18일 정책에서 이 출생 시각은 ${context}에 해당합니다. 일간 ${result.dayMaster}의 오행인 ${ELEMENT_TOPICS[result.dayMasterElement]} ${state}${postfix} 분류됩니다.`,[alt.id]));
      items.push(item("KO_M3_SILI_FIVE_ELEMENTS",`${NAMES[alt.season]} 표의 오행별 분류: `+ELEMENTS.map(e=>ELEMENT_NAMES[e]+" "+LABELS[alt.elementStates[e]]).join(" · ")+".",[alt.id]));
    }
  }
  return {schemaVersion:"ko-m3-seasonal-sili-templates-v02",templateVersion:M3_SEASONAL_SILI_VERSION,id:result.candidateRef+"#m3-seasonal-sili-explanation",templateId:"KO_M3_SILI_RESULT",candidateRef:result.candidateRef,judgmentRef:result.id,status:result.status,title:"사립 전 18일 정책의 월령 계절 분류",text:items.map(v=>v.text).join("\n"),evidenceRefs:result.inputEvidenceRefs,inputFactRefs:result.inputFactRefs,policyRefs:result.policyRefs,ruleRefs:result.ruleRefs,sourceRefs:result.sourceRefs,calculationSourceRefs:result.calculationSourceRefs,scopeNote:"왕·상·휴·수·사는 선택한 전통 분류 이름이며 명목 분 경계는 프로젝트의 계산 관례입니다. 천문학적 힘·전체 신강약·득령·사령·유효 통근·관계 효력·길흉을 판단하지 않습니다.",items};
}
export function explainSeasonalSiliState(result:SeasonalSiliStateResult){return freeze(explanationContent(result));}
export function validateSeasonalSiliStateExplanation(explanation:unknown,result:SeasonalSiliStateResult):true{validateSeasonalSiliState(result);check(equal(explanation,explanationContent(result)),"M3_SILI_EXPLANATION_CONTENT_OR_REFERENCES_CHANGED");return true;}
export const validateSeasonalSiliExplanation=validateSeasonalSiliStateExplanation;
