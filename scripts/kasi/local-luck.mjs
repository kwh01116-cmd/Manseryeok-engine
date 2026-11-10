/** Explicit local M7 time-axis arithmetic. No birth recalculation, network or prediction. */
import {resolve} from 'node:path';
import {pathToFileURL} from 'node:url';
import {fingerprint} from '../../.kasi-build/schema.js';
import * as core from '../../dist/luck/luckV01.js';
import {loadLocalChartProfile,parseLocalChartArgs,verifyLocalChartResult,getLocalChartEventContext,verifyLocalChartEventContext,LocalChartError} from './local-chart.mjs';
import {createLocalExplanationProfile,validateExplanation} from './local-explain.mjs';
import {isGregorianMinute} from '../../dist/calendar/solarTermTimeline.js';
import {SOLAR_TERM_DEFINITIONS} from '../../dist/calendar/solarTerms.js';

export const LOCAL_LUCK_SCHEMA='kasi-local-luck-v01';
export const LUCK_TEMPLATE_VERSION='0.1.0';
export const M7_LUCK_POLICY_V01=core.M7_LUCK_POLICY_V01;
export class LocalLuckError extends Error{constructor(code){super(code);this.name='LocalLuckError';this.code=code;}}
const check=(ok,code)=>{if(!ok)throw new LocalLuckError(code);};
const issuedLuck=new WeakSet(),issuedResults=new WeakMap(),sealed=new WeakSet();
function freeze(value){if(value&&typeof value==='object'&&!sealed.has(value)){Object.values(value).forEach(freeze);Object.freeze(value);sealed.add(value);}return value;}
const metadata=core.M7_LUCK_POLICY_METADATA;
const union=values=>[...new Set(values)];
const hanja=p=>p.stem+p.branch;
const dir=d=>d==='FORWARD'?'순행':'역행';
const eventLabel=term=>{check(Object.hasOwn(SOLAR_TERM_DEFINITIONS,term),'UNKNOWN_LUCK_EVENT_LABEL');return SOLAR_TERM_DEFINITIONS[term].koreanName+'('+term+')';};
const compositionRule=freeze({id:'KASI-LOCAL-M7-COMPOSITION-V01',version:'0.1.0',policyRefs:[M7_LUCK_POLICY_V01],sourceRefs:[],meaning:'SAME_EXECUTION_CANDIDATE_AND_API_EVIDENCE_CONNECTION_ONLY'});
const rules=freeze([...metadata.rules,compositionRule]);
const policyIds=new Set([metadata.id,...metadata.policies.map(p=>p.id)]);
function policy(id){check(id===M7_LUCK_POLICY_V01,'EXPLICIT_SUPPORTED_LUCK_PROFILE_REQUIRED');}
function selectedOptions(options){
  check(options&&typeof options==='object'&&Object.keys(options).every(k=>['dayun','seyun'].includes(k)),'EXPLICIT_LUCK_FEATURES_REQUIRED');
  check(options.dayun!==undefined||options.seyun!==undefined,'EXPLICIT_LUCK_FEATURES_REQUIRED');
  const result=structuredClone(options);
  if(result.seyun!==undefined){check(result.seyun&&typeof result.seyun==='object'&&Object.keys(result.seyun).every(k=>['yearLabel','queryMinute'].includes(k)),'SEYUN_ARGUMENTS');check(result.seyun.yearLabel!==undefined||result.seyun.queryMinute!==undefined,'SEYUN_ARGUMENTS');
    if(result.seyun.yearLabel!==undefined)check(Number.isInteger(result.seyun.yearLabel)&&result.seyun.yearLabel>=1&&result.seyun.yearLabel<=9999,'SEYUN_YEAR_MUST_BE_1_TO_9999');
    if(result.seyun.queryMinute!==undefined)check(typeof result.seyun.queryMinute==='string'&&isGregorianMinute(result.seyun.queryMinute),'EXPLICIT_QUERY_MINUTE_REQUIRED');
  }
  if(result.dayun!==undefined){check(result.dayun&&typeof result.dayun==='object'&&Object.keys(result.dayun).every(k=>['traditionalSex','count'].includes(k)),'DAYUN_ARGUMENTS');
    const code=!['MALE','FEMALE'].includes(result.dayun.traditionalSex)?'EXPLICIT_TRADITIONAL_SEX_REQUIRED':!Number.isInteger(result.dayun.count)||result.dayun.count<1||result.dayun.count>core.MAX_LUCK_COUNT?'DAYUN_COUNT_MUST_BE_1_TO_20':null;
    if(code){if(!result.seyun)throw new LocalLuckError(code);result.dayun.invalidCode=code;}
  }
  return result;
}
const heldProjection=()=>({status:'POLICY_UNRESOLVED',policyId:core.LUCK_POLICIES.calendarProjection,policyVersion:core.M7_LUCK_VERSION,reason:'NO_ADOPTED_CALENDAR_YEAR_MONTH_DAY_ADDITION_POLICY',exactStartDate:null});
const scopeNote='선택한 전통 규칙과 분 표기로 간지 순서·모형 나이를 계산합니다. 실제 교운일과 현재 대운은 별도 달력 가산 정책이 미확정이어서 제공하지 않습니다. 길흉·사건 예측, 원전 판본·권리·과학적 예측 효력의 인증은 아닙니다.';

function validateLuck(luck){check(issuedLuck.has(luck)&&Object.isFrozen(luck),'ISSUED_IMMUTABLE_LUCK_REQUIRED');return luck;}
function validateReferences(luck){
  const ruleIds=new Set(luck.rules.map(r=>r.id)),sourceIds=new Set(luck.sources.map(s=>s.id)),ids=new Set();
  for(const candidate of luck.candidates){
    check(candidate.candidateRef===(luck.mode==='SEYUN_LABEL_ONLY'?'calendar-query':`chart.candidates[${candidate.candidateIndex}]`),'LUCK_CANDIDATE_REFERENCE');
    for(const fact of candidate.facts){check(!ids.has(fact.id)&&fact.candidateRef===candidate.candidateRef,'LUCK_FACT_REFERENCE');ids.add(fact.id);
      check(fact.ruleRefs.length>0&&fact.ruleRefs.every(id=>ruleIds.has(id)),'LUCK_RULE_REFERENCE');
      check(fact.policyRefs.every(id=>policyIds.has(id)),'LUCK_POLICY_REFERENCE');
      check(fact.sourceRefs.every(id=>sourceIds.has(id))&&fact.calculationSourceRefs.every(id=>sourceIds.has(id)),'LUCK_SOURCE_REFERENCE');
      check(fact.pillarRefs.every(ref=>['year','month','day','hour'].some(role=>ref===candidate.candidateRef+'.'+role)),'LUCK_PILLAR_REFERENCE');
    }
  }
}

function mintLuck(value){validateReferences(value);freeze(value);issuedLuck.add(value);return value;}
function beforeBirth(query,birth){return query<birth?'BEFORE_BIRTH_REPORTED_MINUTE':query===birth?'SAME_REPORTED_MINUTE_NO_INSTANT_ORDER_CLAIM':'AFTER_BIRTH_REPORTED_MINUTE';}

export function createLocalLuckProfile(chartProfile,{luckPolicyId,m2ProfileId,contextProfile=chartProfile}={}){
  policy(luckPolicyId);check(typeof chartProfile?.calculate==='function','CHART_PROFILE_REQUIRED');
  const context=getLocalChartEventContext(contextProfile),timeline=core.compileLuckTimeline(context.events);
  const evidenceMap=new Map(context.evidence.map(record=>[record.id,record]));
  const baseProfile=m2ProfileId===undefined?null:createLocalExplanationProfile(chartProfile,{m2ProfileId});
  return Object.freeze({calculate(request,requested){
    const options=selectedOptions(requested),executionCounts={birthM1Calls:0,seyunYearQueries:0,seyunLabelCalls:0};
    executionCounts.birthM1Calls++;
    const baseExplanation=baseProfile?baseProfile.calculate(request):null,m1=baseExplanation?baseExplanation.m1:chartProfile.calculate(request);
    if(m1.status!=='OK')return {schemaVersion:LOCAL_LUCK_SCHEMA,status:m1.status,m1,baseExplanation,luck:null,explanation:null};
    verifyLocalChartResult(m1,{request});verifyLocalChartEventContext(context,{calculation:m1});
    const sources=new Map(metadata.sources.map(s=>[s.id,s]));
    const putEvent=id=>{const evidence=evidenceMap.get(id);check(evidence,'PINNED_LUCK_EVENT_EVIDENCE_REQUIRED');sources.set(id,{id,kind:'CALENDAR_API',evidence,rightsReview:'UNVERIFIED'});return id;};
    const date=m1.evidence.dateConversion,dateId='KASI_OPENAPI_RESPONSE_DATE:'+date.sourceRef+':'+date.observed.solarDate;
    sources.set(dateId,{id:dateId,kind:'CALENDAR_API',evidence:date,rightsReview:'UNVERIFIED'});
    const year=m1.evidence.yearBoundary,yearId=putEvent('KASI_OPENAPI_RESPONSE:'+year.sourceRef+':'+year.original.date+':'+year.original.termCode);
    const seyun={yearLabel:null,atMinute:null};
    if(options.seyun?.yearLabel!==undefined){executionCounts.seyunLabelCalls++;seyun.yearLabel=core.annualLuckYearLabel(options.seyun.yearLabel,luckPolicyId);}
    if(options.seyun?.queryMinute!==undefined){executionCounts.seyunYearQueries++;
      const query=options.seyun.queryMinute;
      seyun.atMinute=query<'1989-01-01T00:00'?{status:'POLICY_UNRESOLVED',queryMinute:query,confidence:null,entries:[],lichun:null,missingData:[],reason:'QUERY_OUTSIDE_VERIFIED_MODERN_CLOCK_POLICY',ruleRefs:[metadata.rules.find(r=>r.policyRefs.includes(core.LUCK_POLICIES.annualTime)).id],policyRefs:[core.LUCK_POLICIES.annualTime],sourceRefs:[]}:
        core.annualLuckAtMinute({timeline,queryMinute:query,policyId:luckPolicyId});
      if(seyun.atMinute.lichun)for(const id of seyun.atMinute.lichun.sourceIds)putEvent(id);
    }
    const candidates=m1.chart.candidates.map((natal,index)=>{
      const candidateRef=`chart.candidates[${index}]`,trace=m1.chart.monthBoundaryTrace.candidateContexts[index],facts=[];
      const birthRefs=union([dateId,yearId,...trace.activeSince.sourceIds.map(putEvent)]);
      const add=(suffix,kind,value,refs,extra=[],pillarRoles=[])=>{facts.push({id:`luck.candidates[${index}]#${suffix}`,candidateRef,kind,value,
        pillarRefs:pillarRoles.map(role=>candidateRef+'.'+role),ruleRefs:refs.ruleRefs??[compositionRule.id],policyRefs:refs.policyRefs??[luckPolicyId],sourceRefs:refs.sourceRefs??[],calculationSourceRefs:union([...birthRefs,...extra])});};
      let dayun=null;
      if(options.dayun){
        if(options.dayun.invalidCode){dayun={status:'INVALID_INPUT',code:options.dayun.invalidCode,sequence:null,start:null,modelAgeIntervals:null,calendarProjection:heldProjection(),currentDecade:heldProjection()};add('dayun-unavailable','DAYUN_UNAVAILABLE',{code:dayun.code},compositionRule);}
        else{
          const direction=core.resolveLuckDirection({yearPillar:natal.year,traditionalSex:options.dayun.traditionalSex,policyId:luckPolicyId});
          const sequence=core.luckPillarSequence({monthPillar:natal.month,direction:direction.direction,count:options.dayun.count,policyId:luckPolicyId});
          const start=core.resolveLuckStart({timeline,birthMinute:m1.chart.recordedBirthKstMinute,direction:direction.direction,boundarySide:trace.boundarySide,policyId:luckPolicyId});
          const eventRefs=start.selectedEvent?start.selectedEvent.sourceIds.map(putEvent):[];
          dayun={status:start.status==='OK'?'OK':'PARTIAL',traditionalSex:options.dayun.traditionalSex,direction,sequence,start,
            modelAgeIntervals:start.age?core.modelAgeIntervals(start.age,sequence.count,luckPolicyId):null,calendarProjection:start.calendarProjection,currentDecade:heldProjection()};
          add('direction','DAYUN_DIRECTION',direction,direction,[],['year']);
          add('sequence','DAYUN_SEQUENCE',{monthPillar:sequence.monthPillar,direction:sequence.direction,count:sequence.count,firstRelation:sequence.firstRelation,entries:sequence.entries,firstPillars:sequence.entries.slice(0,3).map(e=>e.pillar)},sequence,[],['month']);
          add('start','DAYUN_START',start,start,eventRefs,['year','month']);
          add('projection','DAYUN_PROJECTION',dayun.calendarProjection,{ruleRefs:[metadata.rules.find(r=>r.policyRefs.includes(core.LUCK_POLICIES.calendarProjection)).id],policyRefs:[core.LUCK_POLICIES.calendarProjection],sourceRefs:[]});
        }
      }
      const candidateSeyun={...seyun,birthRelation:seyun.atMinute?beforeBirth(seyun.atMinute.queryMinute,m1.chart.recordedBirthKstMinute):null,queryScope:'INDEPENDENT_EXPLICIT_CALENDAR_QUERY_NOT_A_CARTESIAN_BIRTH_FORECAST'};
      if(seyun.yearLabel)add('seyun-label','SEYUN_LABEL',seyun.yearLabel,seyun.yearLabel);
      if(seyun.atMinute)add('seyun-at','SEYUN_AT',{...seyun.atMinute,birthRelation:candidateSeyun.birthRelation},seyun.atMinute,seyun.atMinute.lichun?.sourceIds??[]);
      return {candidateRef,candidateIndex:index,boundarySide:trace.boundarySide,dayun,seyun:candidateSeyun,facts};
    });
    const luck=mintLuck({schemaVersion:'kasi-local-m7-facts-v01',mode:'BIRTH_LINKED',status:'READY',policy:metadata,
      provenance:{profile:structuredClone(m1.profile),dataset:structuredClone(m1.dataset),policies:structuredClone(m1.policies),recordedBirthMinute:m1.chart.recordedBirthKstMinute,confidence:m1.chart.confidence},
      birthCalculationFingerprint:fingerprint(m1),executionCounts,candidates,seyun,rules,sources:[...sources.values()],
      validation:{level:'SAME_EXECUTION_PINNED_API_AND_SELECTED_TRADITIONAL_POLICY',g0Receipt:null,g1P2Promotion:false,editionVerification:'UNVERIFIED',rightsReview:'UNVERIFIED',predictiveValidity:'NOT_CLAIMED'}});
    const result={schemaVersion:LOCAL_LUCK_SCHEMA,status:'OK',m1,baseExplanation,luck,explanation:explainLuck(luck)};
    issuedResults.set(result,{m1,luck,baseExplanation,baseFacts:baseExplanation?.facts??null});return result;
  }});
}

export async function loadLocalLuckProfile(options){return createLocalLuckProfile(await loadLocalChartProfile(options),options);}

const templates={
  DAYUN_DIRECTION:v=>`후보의 연간은 ${v.yearStem}(${v.yearStemPolarity==='YANG'?'양':'음'})이며, 명시한 전통 방향 규칙용 성별값 ${v.traditionalSex==='MALE'?'남성(MALE)':'여성(FEMALE)'}을 적용해 ${dir(v.direction)}을 선택했습니다.`,
  DAYUN_SEQUENCE:v=>`월주 ${hanja(v.monthPillar)} 자체를 첫 대운에 넣지 않고 인접 간지부터 ${dir(v.direction)}합니다. 첫 ${v.firstPillars.length}개는 ${v.firstPillars.map(hanja).join(' → ')}이며, 총 ${v.count}개를 출력합니다.`,
  DAYUN_START:v=>v.status==='NEEDS_DATA'?`기산에는 ${v.missingData.map(m=>m.year+'년 '+eventLabel(m.term)).join(', ')} 자료가 더 필요합니다. 간지 순서는 유지하고 기산나이는 계산하지 않습니다.`:
    v.status==='AMBIGUOUS'?`이 후보의 ${v.boundarySide==='BEFORE_PUBLISHED_MINUTE'?'경계 전':v.boundarySide==='AFTER_PUBLISHED_MINUTE'?'경계 후':'전후 미정'} 조건에서 출생과 선택 절입 ${eventLabel(v.selectedEvent.term)}의 표시 분이 같습니다. 명목 분 차이 ${v.nominalIntervalMinutes}을 정확한 0세 기산으로 해석하지 않고 기산나이를 미확정으로 남깁니다.`:
    `${v.boundarySide==='DEFINITE'?'명시한 출생 분':v.boundarySide==='BEFORE_PUBLISHED_MINUTE'?'이 후보의 경계 전 조건':'이 후보의 경계 후 조건'}에서 ${eventLabel(v.selectedEvent.term)} ${v.selectedEvent.displayedDateTime}까지의 ${dir(v.direction)} 간격은 명목 ${v.nominalIntervalMinutes}분입니다. 3일=1모형년으로 ${v.age.numerator}/${v.age.denominator} 모형년(기약분수 ${v.age.reduced.numerator}/${v.age.reduced.denominator}, 표시 ${v.displayAge.value})입니다.`,
  DAYUN_PROJECTION:()=>`기산나이는 모형 단위입니다. 실제 달력의 년·월·일 가산 규칙을 채택하지 않아 정확한 교운일과 현재 몇 번째 대운인지는 POLICY_UNRESOLVED입니다.`,
  DAYUN_UNAVAILABLE:v=>`대운 입력을 확정할 수 없습니다(${v.code}). 독립적인 세운 요청은 별도로 계산합니다.`,
  SEYUN_LABEL:v=>`${v.year}년이라는 세운 연도 라벨의 간지는 ${hanja(v.pillar)}입니다. 특정 날짜가 이 세운에 속하는지와는 다른 주기 산술입니다.`,
  SEYUN_AT:v=>v.status==='NEEDS_DATA'?`세운 시각 판정에는 ${v.missingData.map(m=>m.year+'년 '+eventLabel(m.term)).join(', ')} 자료가 필요합니다. 기존 fixture로 보충하지 않습니다.`:
    v.status==='POLICY_UNRESOLVED'?`조회 시각은 검증된 현대 시각 정책 밖이어서 세운 시각 판정을 보류합니다.`:
    `${v.lichun.displayedDateTime} 입춘을 기준으로 조회 표시 분 ${v.queryMinute}의 세운은 ${v.entries.map(e=>e.yearLabel+' '+hanja(e.pillar)).join(' / ')}${v.status==='AMBIGUOUS'?' 두 조건부 후보입니다':'입니다'}.${v.birthRelation==='BEFORE_BIRTH_REPORTED_MINUTE'?' 조회가 출생 표시 분보다 앞서므로 개인 운세 기간으로 설명하지 않습니다.':v.birthRelation==='SAME_REPORTED_MINUTE_NO_INSTANT_ORDER_CLAIM'?' 출생과 같은 표시 분이며 실제 순간의 선후까지 확정하지 않습니다.':''}`,
};
function buildView(luck){validateLuck(luck);return {schemaVersion:'ko-m7-luck-templates-v01',templateVersion:LUCK_TEMPLATE_VERSION,title:'대운·세운 시간축 계산',scopeNote,
  candidates:luck.candidates.map(candidate=>({candidateRef:candidate.candidateRef,candidateIndex:candidate.candidateIndex,items:candidate.facts.map((fact,i)=>{
    check(Object.hasOwn(templates,fact.kind),'UNKNOWN_LUCK_TEMPLATE');
    return {id:`luck.explanation[${candidate.candidateIndex}][${i}]`,candidateRef:candidate.candidateRef,templateId:'KO_M7_'+fact.kind,templateVersion:LUCK_TEMPLATE_VERSION,
      factRefs:[fact.id],ruleRefs:[...fact.ruleRefs],policyRefs:[...fact.policyRefs],sourceRefs:[...fact.sourceRefs],calculationSourceRefs:[...fact.calculationSourceRefs],text:templates[fact.kind](fact.value)};
  })}))};}
export function explainLuck(luck){return buildView(luck);}
export function validateLuckExplanation(explanation,luck){
  validateLuck(luck);check(explanation?.schemaVersion==='ko-m7-luck-templates-v01'&&Array.isArray(explanation.candidates),'LUCK_EXPLANATION_SCHEMA');
  check(explanation.candidates.length===luck.candidates.length,'LUCK_EXPLANATION_CANDIDATES');
  for(let i=0;i<luck.candidates.length;i++){
    const candidate=luck.candidates[i],view=explanation.candidates[i],facts=new Map(candidate.facts.map(f=>[f.id,f]));
    check(view.candidateRef===candidate.candidateRef&&view.candidateIndex===candidate.candidateIndex&&Array.isArray(view.items),'LUCK_EXPLANATION_CANDIDATE_REFERENCE');
    for(const item of view.items){check(item.candidateRef===candidate.candidateRef&&Array.isArray(item.factRefs)&&item.factRefs.length>0&&item.factRefs.every(ref=>facts.has(ref)),'LUCK_EXPLANATION_FACT_REFERENCE');
      for(const key of ['ruleRefs','policyRefs','sourceRefs','calculationSourceRefs'])check(Array.isArray(item[key])&&item[key].every(ref=>item.factRefs.some(id=>facts.get(id)[key].includes(ref))),'LUCK_EXPLANATION_REFERENCE');
      check(item.templateVersion===LUCK_TEMPLATE_VERSION&&Object.keys(templates).some(kind=>item.templateId==='KO_M7_'+kind),'UNKNOWN_LUCK_TEMPLATE');
    }
  }
  check(fingerprint(explanation)===fingerprint(buildView(luck)),'LUCK_EXPLANATION_CONTENT_CHANGED');return true;
}
export function validateLocalLuckResult(result){
  const receipt=issuedResults.get(result);
  check(receipt&&result.schemaVersion===LOCAL_LUCK_SCHEMA&&result.status==='OK'&&result.m1===receipt.m1&&result.luck===receipt.luck&&result.baseExplanation===receipt.baseExplanation,'ISSUED_LOCAL_LUCK_RESULT_REQUIRED');validateLuck(result.luck);
  if(result.m1){verifyLocalChartResult(result.m1);check(fingerprint(result.m1)===result.luck.birthCalculationFingerprint,'LUCK_BIRTH_CONNECTION_CHANGED');}
  if(result.baseExplanation){check(result.baseExplanation.schemaVersion==='kasi-local-basic-explanation-v1'&&result.baseExplanation.status==='OK'&&result.baseExplanation.m1===result.m1&&result.baseExplanation.facts===receipt.baseFacts,'LUCK_BASE_EXECUTION_MISMATCH');validateExplanation(result.baseExplanation.explanation,result.baseExplanation.facts);}
  validateLuckExplanation(result.explanation,result.luck);return true;
}
export function calculateSeyunLabel(year,luckPolicyId){
  policy(luckPolicyId);const label=core.annualLuckYearLabel(year,luckPolicyId),candidateRef='calendar-query';
  const luck=mintLuck({schemaVersion:'kasi-local-m7-facts-v01',mode:'SEYUN_LABEL_ONLY',status:'READY',policy:metadata,provenance:null,birthCalculationFingerprint:null,
    executionCounts:{birthM1Calls:0,seyunYearQueries:0,seyunLabelCalls:1},seyun:{yearLabel:label,atMinute:null},rules,sources:metadata.sources,
    candidates:[{candidateRef,candidateIndex:0,dayun:null,seyun:{yearLabel:label,atMinute:null,birthRelation:null},facts:[{id:'calendar-query#seyun-label',candidateRef,kind:'SEYUN_LABEL',value:label,pillarRefs:[],ruleRefs:label.ruleRefs,policyRefs:label.policyRefs,sourceRefs:label.sourceRefs,calculationSourceRefs:[]}]}],validation:{level:'YEAR_LABEL_CYCLE_ARITHMETIC_ONLY',g0Receipt:null,g1P2Promotion:false,editionVerification:'UNVERIFIED',rightsReview:'UNVERIFIED',predictiveValidity:'NOT_CLAIMED'}});
  const result={schemaVersion:LOCAL_LUCK_SCHEMA,status:'OK',m1:null,baseExplanation:null,luck,explanation:explainLuck(luck)};issuedResults.set(result,{m1:null,luck,baseExplanation:null,baseFacts:null});return result;
}
export function renderLocalLuckText(result){
  validateLocalLuckResult(result);const lines=[result.explanation.title,`정책: ${result.luck.policy.id} / ${result.luck.policy.version}`];
  if(result.m1)lines.push(`양력 환산 ${result.m1.input.gregorianDate} ${result.m1.input.time}`,`프로필: ${result.m1.profile.id}`,`dataset: ${result.m1.dataset.id}`,`manifest: ${result.m1.dataset.candidateManifestContentSha256}`,`시계: ${result.m1.policies.clock.id} / 일주: ${result.m1.policies.dayRollover.id} / 시주: ${result.m1.policies.hourStemReference.id}`);
  lines.push(scopeNote);
  if(result.baseExplanation){lines.push('','원국 M2 기초 설명(원국 분류 범위)');for(const candidate of result.baseExplanation.explanation.candidates){lines.push(`원국 후보 ${candidate.candidateIndex+1}`);for(const item of candidate.items)lines.push(item.text,`  원국 근거: ${item.factRefs.join(', ')}`);}}
  for(const candidate of result.explanation.candidates){
    lines.push('',`${result.m1?'출생 후보 '+(candidate.candidateIndex+1):'순수 연도 라벨'} [${candidate.candidateRef}]`);
    const natal=result.m1?.chart.candidates[candidate.candidateIndex];if(natal)lines.push(`원국: 연 ${hanja(natal.year)} · 월 ${hanja(natal.month)} · 일 ${hanja(natal.day)} · 시 ${hanja(natal.hour)}`);
    for(const item of candidate.items)lines.push(item.text,`  근거: ${item.factRefs.join(', ')} | 규칙: ${item.ruleRefs.join(', ')} | 정책: ${item.policyRefs.join(', ')} | 규칙 출처: ${item.sourceRefs.join(', ')} | 자료 출처: ${item.calculationSourceRefs.join(', ')}`);
    const dayun=result.luck.candidates[candidate.candidateIndex].dayun;
    if(dayun?.sequence){lines.push('대운 순서와 모형 나이 구간(실제 달력 날짜·세는나이 아님)');for(const entry of dayun.sequence.entries){
      const interval=dayun.modelAgeIntervals?.[entry.ordinal-1],fraction=age=>age.reduced.numerator+'/'+age.reduced.denominator;
      lines.push(`${entry.ordinal}. ${hanja(entry.pillar)}: ${interval?'['+fraction(interval.startInclusive)+', '+fraction(interval.endExclusive)+') 모형년':'기산 '+dayun.start.status+'로 모형 구간 미정'}`);
    }lines.push(`  근거: luck.candidates[${candidate.candidateIndex}]#sequence, luck.candidates[${candidate.candidateIndex}]#start`);}
  }
  return lines.join('\n')+'\n';
}
export function parseLocalLuckArgs(args){
  check(args.length>0&&args.length%2===0,'EXPLICIT_ARGUMENTS_REQUIRED');const extra={},base=[];
  const names=['--luck-profile','--output','--dayun','--traditional-sex','--dayun-count','--seyun-year','--query-minute','--m2-profile'];
  for(let i=0;i<args.length;i+=2){if(names.includes(args[i])){check(!Object.hasOwn(extra,args[i])&&typeof args[i+1]==='string','ARGUMENTS');extra[args[i]]=args[i+1];}else base.push(args[i],args[i+1]);}
  policy(extra['--luck-profile']);check(['json','text'].includes(extra['--output']),'EXPLICIT_OUTPUT_REQUIRED');
  const requested={};
  if(extra['--dayun']!==undefined){check(extra['--dayun']==='true','DAYUN_ARGUMENTS');requested.dayun={traditionalSex:extra['--traditional-sex'],count:/^\d+$/.test(extra['--dayun-count']??'')?Number(extra['--dayun-count']):undefined};}
  else check(extra['--traditional-sex']===undefined&&extra['--dayun-count']===undefined,'DAYUN_ARGUMENTS');
  if(extra['--seyun-year']!==undefined||extra['--query-minute']!==undefined){requested.seyun={};if(extra['--seyun-year']!==undefined){check(/^\d+$/.test(extra['--seyun-year']),'SEYUN_YEAR_INTEGER_REQUIRED');requested.seyun.yearLabel=Number(extra['--seyun-year']);}if(extra['--query-minute']!==undefined)requested.seyun.queryMinute=extra['--query-minute'];}
  const features=selectedOptions(requested);
  if(base.length===0){check(features.dayun===undefined&&features.seyun?.yearLabel!==undefined&&features.seyun.queryMinute===undefined&&extra['--m2-profile']===undefined,'PURE_LABEL_ARGUMENTS');return {mode:'SEYUN_LABEL_ONLY',year:features.seyun.yearLabel,luckPolicyId:extra['--luck-profile'],output:extra['--output']};}
  return {...parseLocalChartArgs(base),mode:'BIRTH_LINKED',features:requested,luckPolicyId:extra['--luck-profile'],m2ProfileId:extra['--m2-profile'],output:extra['--output']};
}
if(process.argv[1]&&import.meta.url===pathToFileURL(resolve(process.argv[1])).href){try{
  const options=parseLocalLuckArgs(process.argv.slice(2));
  const result=options.mode==='SEYUN_LABEL_ONLY'?calculateSeyunLabel(options.year,options.luckPolicyId):(await loadLocalLuckProfile(options)).calculate(options.request,options.features);
  if(result.status!=='OK'){process.stderr.write(JSON.stringify({status:result.status,code:'BIRTH_INPUT_NOT_SUPPORTED'})+'\n');process.exitCode=2;}
  else process.stdout.write(options.output==='json'?JSON.stringify(result,null,2)+'\n':renderLocalLuckText(result));
}catch(error){process.stderr.write(JSON.stringify({status:'REJECTED',code:error instanceof LocalLuckError||error instanceof LocalChartError?error.code:'LUCK_DATA_OR_INPUT_REJECTED'})+'\n');process.exitCode=1;}}
