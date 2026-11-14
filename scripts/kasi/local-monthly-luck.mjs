/** Issued event-context adapter only. This module neither loads another corpus nor calculates natal M1. */
import {fingerprint} from '../../.kasi-build/schema.js';
import {getLocalChartEventContext,verifyLocalChartEventContext,verifyLocalChartResult,MODERN_CLOCK_POLICY_ID} from './local-chart.mjs';
import {MONTHLY_LUCK_POLICY_ID,MONTHLY_LUCK_METADATA,compileMonthlyTimeline,monthlyLuckAtMinute,monthlyLuckYearTable} from '../../dist/luck/monthlyLuckV1.js';
import {SOLAR_TERM_DEFINITIONS} from '../../dist/calendar/solarTerms.js';

export {MONTHLY_LUCK_POLICY_ID};
const COMPOSE='M7-RULE-LOCAL-MONTHLY-ISSUED-CONTEXT-001',SOURCE='IMPL-LOCAL-MONTHLY-ISSUED-CONTEXT';
const rules=[...MONTHLY_LUCK_METADATA.rules,{id:COMPOSE,version:'0.1.0',policyRefs:[MONTHLY_LUCK_POLICY_ID],sourceRefs:[SOURCE]}];
const policyIds=new Set([MONTHLY_LUCK_POLICY_ID]),ruleIds=new Set(rules.map(r=>r.id)),issued=new WeakMap();
function check(value,code){if(!value)throw new RangeError(code);}
function freeze(value){if(value&&typeof value==='object'&&!Object.isFrozen(value)){Object.values(value).forEach(freeze);Object.freeze(value);}return value;}
function eventsUsed(value,ids=new Set()){
  if(value&&typeof value==='object')for(const [key,item]of Object.entries(value)){
    if(key==='calculationSourceRefs'||key==='sourceIds'){check(Array.isArray(item)&&Array.from({length:item.length},(_,i)=>Object.hasOwn(item,i)).every(Boolean),'MONTHLY_DENSE_EVENT_REFERENCES_REQUIRED');for(const id of item)ids.add(id);}
    else eventsUsed(item,ids);
  }return ids;
}
function validateReferences(result){
  const sourceIds=new Set(result.sources.map(s=>s.id));
  const visit=value=>{if(!value||typeof value!=='object')return;for(const [key,item]of Object.entries(value)){
    if(['ruleRefs','policyRefs','sourceRefs','calculationSourceRefs','sourceIds'].includes(key)){
      const registry=key==='ruleRefs'?ruleIds:key==='policyRefs'?policyIds:sourceIds;
      check(Array.isArray(item)&&Array.from({length:item.length},(_,i)=>Object.hasOwn(item,i)).every(Boolean)&&item.every(id=>registry.has(id)),'MONTHLY_REFERENCE_NOT_IN_REGISTRY');
    }else visit(item);
  }};visit({atMinute:result.atMinute,yearTable:result.yearTable});
}
export function createLocalMonthlyLuck(contextProfile,{policyId}={}){
  check(policyId===MONTHLY_LUCK_POLICY_ID,'EXPLICIT_SUPPORTED_MONTHLY_POLICY_REQUIRED');
  const context=getLocalChartEventContext(contextProfile);verifyLocalChartEventContext(context);
  check(context.profile.timeInterpretation.id===MODERN_CLOCK_POLICY_ID,'MONTHLY_CONTEXT_CLOCK_POLICY_MISMATCH');
  const timeline=compileMonthlyTimeline(context.events),evidence=new Map(context.evidence.map(e=>[e.id,e]));
  return Object.freeze({metadata:MONTHLY_LUCK_METADATA,calculate(options,{birthCalculation}={}){
    check(options&&typeof options==='object'&&!Array.isArray(options)&&Object.keys(options).every(k=>['queryMinute','year'].includes(k))&&(options.queryMinute!==undefined||options.year!==undefined),'EXPLICIT_MONTHLY_QUERY_OR_YEAR_REQUIRED');
    const hasBirth=birthCalculation!==undefined;
    if(hasBirth){verifyLocalChartResult(birthCalculation);check(birthCalculation.status==='OK','MONTHLY_SUPPORTED_BIRTH_REQUIRED');verifyLocalChartEventContext(context,{calculation:birthCalculation});}
    const atMinute=options.queryMinute===undefined?null:monthlyLuckAtMinute({timeline,queryMinute:options.queryMinute,policyId});
    const yearTable=options.year===undefined?null:monthlyLuckYearTable({timeline,year:options.year,policyId});
    const used=eventsUsed({atMinute,yearTable});
    const sources=[...MONTHLY_LUCK_METADATA.sources,{id:SOURCE,kind:'PROJECT_ISSUED_CONTEXT_LINK',implementationRef:'scripts/kasi/local-monthly-luck.mjs',meaning:'SAME_BASE_PROFILE_PINNED_EVENT_CONNECTION_NOT_EXTERNAL_AUTHENTICATION'}];
    for(const id of used){const record=evidence.get(id);check(record,'PINNED_MONTHLY_EVENT_EVIDENCE_REQUIRED');sources.push({id,kind:'CALENDAR_API',evidence:structuredClone(record),rightsReview:'UNVERIFIED'});}
    const birthLink=hasBirth?{calculationFingerprint:fingerprint(birthCalculation),recordedBirthMinute:birthCalculation.chart.recordedBirthKstMinute,
      candidateRefs:birthCalculation.chart.candidates.map((_,i)=>`chart.candidates[${i}]`),
      queryRelation:!atMinute?null:atMinute.queryMinute<birthCalculation.chart.recordedBirthKstMinute?'BEFORE_BIRTH':atMinute.queryMinute===birthCalculation.chart.recordedBirthKstMinute?'SAME_REPORTED_MINUTE':'AFTER_BIRTH',
      meaning:'EXPLICIT_CALENDAR_QUERY_NOT_AN_INDIVIDUAL_EVENT_FORECAST'}:null;
    const result=freeze({schemaVersion:'kasi-local-monthly-luck-v1',status:'MONTHLY_TIME_AXIS_ONLY',policy:MONTHLY_LUCK_METADATA,
      provenance:{profile:structuredClone(context.profile),dataset:structuredClone(context.dataset),clockPolicy:{id:MODERN_CLOCK_POLICY_ID,version:'1'},queryScope:'EXISTING_MODERN_POLICY_AND_BASE_CONTEXT_ONLY'},
      atMinute,yearTable,birthLink,rules,sources,executionCounts:{birthM1Calls:0,monthlyTimeQueries:atMinute?1:0,monthlyYearTables:yearTable?1:0},
      validation:{level:'SAME_PROCESS_ISSUED_PINNED_EVENT_CONTEXT',serializedReferences:'TRACEABILITY_NOT_EXTERNAL_AUTHENTICATION',g0Receipt:null,g1P2Promotion:false,rightsReview:'UNVERIFIED',predictiveValidity:'NOT_CLAIMED'}});
    validateReferences(result);issued.set(result,{context,birthCalculation:birthCalculation??null,content:fingerprint(result)});return result;
  }});
}
export function validateLocalMonthlyLuck(result,{birthCalculation}={}){
  const entry=issued.get(result);check(entry&&Object.isFrozen(result)&&entry.content===fingerprint(result),'ISSUED_LOCAL_MONTHLY_RESULT_REQUIRED');
  verifyLocalChartEventContext(entry.context);
  if(entry.birthCalculation){verifyLocalChartResult(entry.birthCalculation);verifyLocalChartEventContext(entry.context,{calculation:entry.birthCalculation});}
  if(birthCalculation!==undefined)check(entry.birthCalculation===birthCalculation,'MONTHLY_BIRTH_EXECUTION_CONTEXT_MISMATCH');
  validateReferences(result);return true;
}
export function explainLocalMonthlyLuck(result){
  validateLocalMonthlyLuck(result);const items=[];
  if(result.birthLink?.queryRelation==='BEFORE_BIRTH')items.push({id:'monthly-before-birth',text:'조회 시각은 출생 기록보다 앞입니다. 이 결과는 독립 달력 조회이며 개인의 운세 기간으로 해석하지 않습니다.',valueRefs:['birthLink'],ruleRefs:[COMPOSE],policyRefs:[MONTHLY_LUCK_POLICY_ID],sourceRefs:[SOURCE]});
  const add=(id,text,valueRefs,value)=>items.push({id,text,valueRefs,ruleRefs:value.ruleRefs,policyRefs:value.policyRefs,sourceRefs:[...new Set([...value.sourceRefs,...(value.calculationSourceRefs??[])])]});
  if(result.atMinute){const q=result.atMinute;
    if(!q.entries.length)add('monthly-query-held',`조회 시각 ${q.queryMinute}의 월운은 ${q.status==='POLICY_UNRESOLVED'?'현재 검증한 민간시 정책 범위 밖이어서':'필요한 절입 자료가 없어'} 보류합니다.`,['atMinute'],q);
    else q.entries.forEach((entry,i)=>{const side=entry.boundarySide==='BEFORE_PUBLISHED_MINUTE'?'절입 표시 분의 전 조건':entry.boundarySide==='AFTER_PUBLISHED_MINUTE'?'절입 표시 분의 후 조건':'표시 분 비교에서 단일 조건';const next=entry.untilEvent?`${SOLAR_TERM_DEFINITIONS[entry.untilEvent.term].koreanName} ${entry.untilEvent.displayedDateTime}`:'종료 절입 자료 미확보';
      add('monthly-query-'+i,`조회 ${q.queryMinute}의 양력 달은 ${q.gregorianCalendarMonth}입니다. ${side}에서 연주 ${entry.yearPillar.stem}${entry.yearPillar.branch}, 명리 월운은 ${entry.monthPillar.stem}${entry.monthPillar.branch}이며 ${SOLAR_TERM_DEFINITIONS[entry.activeSince.term].koreanName} ${entry.activeSince.displayedDateTime}부터 ${next}까지의 구간을 검토합니다.`,['atMinute.entries['+i+']'],entry);});
  }
  if(result.yearTable){const table=result.yearTable;
    add('monthly-table-summary',`${table.yearLabel}년 명리 월운표는 그해 입춘부터 다음 입춘까지의 열두 월을 뜻합니다. 양력 1월부터 12월의 달력 월과 다릅니다.${table.status==='RESOLVED_UNDER_POLICY'?'':' 필요한 경계 자료가 없는 구간은 보류합니다.'}`,['yearTable'],table);
    table.rows.forEach((row,i)=>add('monthly-table-'+i,`${row.ordinal}. ${row.monthPillar.stem}${row.monthPillar.branch}: ${row.nominalInterval.startInclusive??'시작 자료 없음'} ~ ${row.nominalInterval.endExclusive??'종료 자료 없음'}${row.status==='NEEDS_DATA'?' (구간 자료 부족)':''}`,['yearTable.rows['+i+']'],row));
  }
  items.push({id:'monthly-scope',text:'절입 발표 분과 같은 분의 전후 후보를 유지합니다. 구간 표시는 명목 분 기준이며 실제 초 단위 순간·월별 사건·길흉을 판정하지 않습니다.',valueRefs:['policy.precision'],ruleRefs:MONTHLY_LUCK_METADATA.rules.map(r=>r.id),policyRefs:[MONTHLY_LUCK_POLICY_ID],sourceRefs:MONTHLY_LUCK_METADATA.sources.map(s=>s.id)});
  return freeze({schemaVersion:'ko-local-monthly-luck-v1',templateVersion:'0.1.0',items});
}
export function renderLocalMonthlyLuckText(result){return explainLocalMonthlyLuck(result).items.map(i=>i.text).join('\n')+'\n';}
