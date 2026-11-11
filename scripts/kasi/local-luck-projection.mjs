/** Opt-in nominal calendar projection of a live issued M7 v0.1 result. No M1 rerun. */
import {fingerprint} from '../../.kasi-build/schema.js';
import {gregorianDayNumber} from '../../dist/calendar/koreanLunisolarValidation.js';
import * as calendar from '../../dist/luck/calendarProjectionV02.js';
import {createLocalLuckProfile,validateLocalLuckResult,parseLocalLuckArgs,LocalLuckError} from './local-luck.mjs';
import {loadLocalChartProfile,LocalChartError} from './local-chart.mjs';
import {loadOptionalBoundarySupplement,BoundarySupplementError} from './boundary-supplement.mjs';

export const CALENDAR_PROJECTION_POLICY_V02=calendar.CALENDAR_PROJECTION_POLICY_V02;
export const LOCAL_LUCK_PROJECTION_SCHEMA='kasi-local-luck-projection-v02';
export const PROJECTION_TEMPLATE_VERSION='0.2.0';
export class LocalLuckProjectionError extends Error {constructor(code){super(code);this.name='LocalLuckProjectionError';this.code=code;}}
const check=(ok,code)=>{if(!ok)throw new LocalLuckProjectionError(code);};
const issuedProjections=new WeakSet(),issuedResults=new WeakMap(),sealed=new WeakSet();
function freeze(value){if(value&&typeof value==='object'&&!sealed.has(value)){Object.values(value).forEach(freeze);Object.freeze(value);sealed.add(value);}return value;}
const metadata=calendar.CALENDAR_PROJECTION_METADATA;
const compositionRule=freeze({id:'KASI-LOCAL-M7-CALENDAR-COMPOSITION-V02',version:'0.2.0',policyRefs:[CALENDAR_PROJECTION_POLICY_V02],sourceRefs:[],meaning:'ISSUED_V01_CANDIDATE_TO_SELECTED_NOMINAL_CALENDAR_ONLY'});
const rules=freeze([...metadata.rules,compositionRule]);
const unique=values=>[...new Set(values)];
const glyph=p=>p.stem+p.branch;
function policy(id){check(id===CALENDAR_PROJECTION_POLICY_V02,'EXPLICIT_SUPPORTED_CALENDAR_PROJECTION_REQUIRED');}
function validMinute(value){
  check(typeof value==='string'&&/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(value),'EXPLICIT_AS_OF_DATE_AND_TIME_REQUIRED');
  check(Number(value.slice(11,13))<24&&Number(value.slice(14,16))<60,'VALID_AS_OF_MINUTE_REQUIRED');
  try{gregorianDayNumber(value.slice(0,10));}catch{throw new LocalLuckProjectionError('VALID_AS_OF_MINUTE_REQUIRED');}
}
function queryOptions(value={}){
  check(value&&typeof value==='object'&&Object.keys(value).every(key=>key==='asOfMinute'),'CALENDAR_QUERY_ARGUMENTS');
  if(value.asOfMinute!==undefined)validMinute(value.asOfMinute);
  return {asOfMinute:value.asOfMinute};
}
function validateProjection(projection){check(issuedProjections.has(projection)&&Object.isFrozen(projection),'ISSUED_IMMUTABLE_CALENDAR_PROJECTION_REQUIRED');return projection;}
function checkReferences(projection,base){
  const ruleIds=new Set(projection.rules.map(r=>r.id)),sourceIds=new Set(projection.sources.map(s=>s.id)),ids=new Set();
  check(projection.candidates.length===base.luck.candidates.length,'CALENDAR_CANDIDATE_COUNT');
  for(const candidate of projection.candidates){
    const original=base.luck.candidates[candidate.candidateIndex],expected='chart.candidates['+candidate.candidateIndex+']';
    check(original&&candidate.candidateRef===expected&&original.candidateRef===expected&&candidate.calendar.candidateRef===expected,'CALENDAR_CANDIDATE_REFERENCE');
    const baseFacts=new Set(original.facts.map(f=>f.id));
    for(const fact of candidate.facts){
      check(!ids.has(fact.id)&&fact.candidateRef===expected,'CALENDAR_FACT_REFERENCE');ids.add(fact.id);
      check(fact.baseFactRefs.length>0&&fact.baseFactRefs.every(id=>baseFacts.has(id)),'CALENDAR_BASE_FACT_REFERENCE');
      check(fact.ruleRefs.length>0&&fact.ruleRefs.every(id=>ruleIds.has(id)),'CALENDAR_RULE_REFERENCE');
      check(fact.policyRefs.length>0&&fact.policyRefs.every(id=>id===CALENDAR_PROJECTION_POLICY_V02),'CALENDAR_POLICY_REFERENCE');
      check(fact.sourceRefs.every(id=>sourceIds.has(id))&&fact.calculationSourceRefs.every(id=>sourceIds.has(id)),'CALENDAR_SOURCE_REFERENCE');
    }
  }
}

/** Derive from one issued base result; serialized status/hash alone is never sufficient. */
export function projectLocalLuckResult(base,options={}){
  check(options&&typeof options==='object'&&Object.keys(options).every(key=>['calendarProjectionPolicyId','asOfMinute'].includes(key)),'CALENDAR_QUERY_ARGUMENTS');
  const {calendarProjectionPolicyId,asOfMinute}=options;
  policy(calendarProjectionPolicyId);queryOptions({asOfMinute});validateLocalLuckResult(base);
  check(base.m1&&base.luck.mode==='BIRTH_LINKED','CALENDAR_PROJECTION_REQUIRES_BIRTH');
  check(base.luck.candidates.every(c=>c.dayun!==null),'CALENDAR_PROJECTION_REQUIRES_DAYUN');
  const sources=new Map(base.luck.sources.map(s=>[s.id,s]));
  for(const source of metadata.sources){if(sources.has(source.id))check(fingerprint(sources.get(source.id))===fingerprint(source),'CALENDAR_SOURCE_COLLISION');sources.set(source.id,source);}
  const candidates=base.luck.candidates.map((original,index)=>{
    const candidateRef=original.candidateRef,dayun=original.dayun,birthMinute=base.m1.chart.recordedBirthKstMinute;
    const unavailable=dayun.status==='INVALID_INPUT';
    const projected=unavailable?freeze({schemaVersion:'m7-nominal-calendar-projection-v02',status:'INVALID_INPUT',candidateRef,birthMinute,policyId:calendarProjectionPolicyId,policyVersion:metadata.version,code:dayun.code,firstStartMinute:null,periods:[],missingData:[]}):
      calendar.projectNominalLuckCalendar({candidateRef,birthMinute,start:dayun.start,sequence:dayun.sequence,policyId:calendarProjectionPolicyId});
    const selection=asOfMinute===undefined?null:unavailable?freeze({schemaVersion:'m7-nominal-asof-selection-v02',status:asOfMinute<metadata.asOfRange.fromInclusive||asOfMinute>=metadata.asOfRange.untilExclusive?'POLICY_UNRESOLVED':'INVALID_INPUT',candidateRef,asOfMinute,selection:null,queryRange:metadata.asOfRange,code:dayun.code,policyId:calendarProjectionPolicyId,policyVersion:metadata.version}):
      calendar.selectNominalDaYunAt({projection:projected,asOfMinute,policyId:calendarProjectionPolicyId});
    const baseFactRefs=original.facts.filter(f=>unavailable?f.kind==='DAYUN_UNAVAILABLE':['DAYUN_DIRECTION','DAYUN_SEQUENCE','DAYUN_START'].includes(f.kind)).map(f=>f.id);
    const calculationSourceRefs=unique(original.facts.filter(f=>baseFactRefs.includes(f.id)).flatMap(f=>f.calculationSourceRefs));
    const input={candidateRef,boundarySide:original.boundarySide,recordedBirthMinute:birthMinute,traditionalSex:dayun.traditionalSex??null,direction:dayun.direction?.direction??null,
      selectedEvent:structuredClone(dayun.start?.selectedEvent??null),intervalMinutes:dayun.start?.nominalIntervalMinutes??null,modelAge:structuredClone(dayun.start?.age??null),baseFactRefs:[...baseFactRefs]};
    const facts=[];
    const add=(suffix,kind,value,refs=projected)=>facts.push({id:'projection.candidates['+index+']#'+suffix,candidateRef,kind,value,
      baseFactRefs:[...baseFactRefs],ruleRefs:refs.ruleRefs?.length?[...refs.ruleRefs]:[compositionRule.id],policyRefs:[calendarProjectionPolicyId],sourceRefs:[...(refs.sourceRefs??[])],calculationSourceRefs:[...calculationSourceRefs]});
    add('calendar','NOMINAL_CALENDAR',projected);
    if(projected.status==='PROJECTED_UNDER_POLICY')add('periods','NOMINAL_PERIODS',{periods:projected.periods,anchorMinute:projected.firstStartMinute});
    if(selection)add('selection','NOMINAL_SELECTION',selection,selection);
    return {candidateRef,candidateIndex:index,input,calendar:projected,selection,facts};
  });
  const projection={schemaVersion:'kasi-local-m7-calendar-facts-v02',status:'READY',policy:metadata,
    baseContractScope:'V01_UNPROJECTED_LEGACY_RESULTS_RETAINED',baseBirthCalculationFingerprint:base.luck.birthCalculationFingerprint,
    provenance:structuredClone(base.luck.provenance),executionCounts:structuredClone(base.luck.executionCounts),asOfMinute:asOfMinute??null,
    candidates,rules,sources:[...sources.values()],validation:{level:'ISSUED_M7_START_AND_SELECTED_NOMINAL_CALENDAR_POLICY',meaning:'NOMINAL_UNDER_SELECTED_POLICY',sourcePrecision:'MINUTE',actualInstantCertified:false,calendarProjectionIsContinuous:false,calendarProjectionIsMonotonic:false,g0Receipt:null,g1P2Promotion:false,editionVerification:'UNVERIFIED',rightsReview:'UNVERIFIED',predictiveValidity:'NOT_CLAIMED'}};
  checkReferences(projection,base);freeze(projection);issuedProjections.add(projection);
  const result={schemaVersion:LOCAL_LUCK_PROJECTION_SCHEMA,status:'OK',m7:base,projection,explanation:explainLuckProjection(projection)};
  issuedResults.set(result,{base,projection});return result;
}
export function createLocalLuckProjectionProfile(chartProfile,{luckPolicyId,calendarProjectionPolicyId,m2ProfileId,contextProfile=chartProfile,boundarySupplement}={}){
  policy(calendarProjectionPolicyId);const baseProfile=createLocalLuckProfile(chartProfile,{luckPolicyId,m2ProfileId,contextProfile,boundarySupplement});
  return Object.freeze({calculate(request,features,query={}){
    const {asOfMinute}=queryOptions(query);check(features&&Object.hasOwn(features,'dayun'),'CALENDAR_PROJECTION_REQUIRES_DAYUN');
    const base=baseProfile.calculate(request,features);
    if(base.status!=='OK')return {schemaVersion:LOCAL_LUCK_PROJECTION_SCHEMA,status:base.status,m7:base,projection:null,explanation:null};
    return projectLocalLuckResult(base,{calendarProjectionPolicyId,asOfMinute});
  }});
}
export async function loadLocalLuckProjectionProfile(options){const chart=await loadLocalChartProfile(options),boundarySupplement=await loadOptionalBoundarySupplement(options);return createLocalLuckProjectionProfile(chart,{...options,boundarySupplement});}

const templates={
  NOMINAL_CALENDAR:v=>v.status==='PROJECTED_UNDER_POLICY'?`선택한 달력 가산 정책에서 계산한 첫 명목 교운일은 ${v.firstStartMinute}입니다. 원래 간격 ${v.intervalMinutes}분을 ${v.decomposition.years}년 ${v.decomposition.months}개월 ${v.decomposition.days}일 ${v.decomposition.hours}시간으로 분해해 출생 기록 시각부터 순차 가산했습니다.`:
    v.status==='AMBIGUOUS'?'출생과 절입의 같은 표시 분에 대한 기존 후보가 미확정이므로 명목 교운일과 기간표도 AMBIGUOUS로 남깁니다. 진단용 0분을 확정 날짜로 바꾸지 않습니다.':
    v.status==='NEEDS_DATA'?`기산에 필요한 ${v.missingData.map(m=>m.year+'년 '+m.term).join(', ')} 자료가 없어 명목 교운일과 기간표는 NEEDS_DATA입니다.`:
    v.status==='INVALID_INPUT'?`대운 입력이 확정되지 않아 명목 교운일을 만들지 않습니다(${v.code}).`:(()=>{throw new LocalLuckProjectionError('UNKNOWN_CALENDAR_STATUS');})(),
  NOMINAL_PERIODS:v=>`각 대운의 명목 경계는 최초 교운일 ${v.anchorMinute}에서 직접 10×k년을 가산한 ${v.periods.length}개 반개구간 [시작, 종료)입니다. 원래 모형 나이 구간과 별개의 달력 표현입니다.`,
  NOMINAL_SELECTION:v=>v.status==='RESOLVED_UNDER_POLICY'?`조회 시각 ${v.asOfMinute}은 이 정책의 제${v.selection.ordinal}대운 ${glyph(v.selection.pillar)} 구간 [${v.selection.startInclusive}, ${v.selection.endExclusive})에 속합니다.`:
    v.status==='BEFORE_BIRTH'?`조회 시각 ${v.asOfMinute}은 출생 전입니다(BEFORE_BIRTH). 개인의 대운 기간으로 선택하지 않습니다.`:
    v.status==='BEFORE_FIRST_DA_YUN'?`조회 시각 ${v.asOfMinute}은 첫 명목 교운일 전입니다(BEFORE_FIRST_DA_YUN). 소운을 임의로 계산하지 않습니다.`:
    v.status==='OUTSIDE_GENERATED_RANGE'?`조회 시각 ${v.asOfMinute}은 생성한 대운 기간표 밖입니다(OUTSIDE_GENERATED_RANGE). 마지막 대운을 연장하지 않습니다.`:
    v.status==='POLICY_UNRESOLVED'?`조회 시각 ${v.asOfMinute}은 검토한 현대 민간시 조회 범위 [1989-01-01, 2027-01-01) 밖이므로 선택을 보류합니다(POLICY_UNRESOLVED). 미래 명목 기간표 생성 가능 범위와 다릅니다.`:
    ['NEEDS_DATA','AMBIGUOUS','INVALID_INPUT'].includes(v.status)?`기산의 ${v.status} 상태를 유지해 조회 시각의 대운을 선택하지 않습니다.`:(()=>{throw new LocalLuckProjectionError('UNKNOWN_CALENDAR_SELECTION_STATUS');})(),
};
function buildView(projection){validateProjection(projection);return {schemaVersion:'ko-m7-calendar-templates-v02',templateVersion:PROJECTION_TEMPLATE_VERSION,title:'명목 교운일·대운 기간 조회',
  scopeNote:'선택한 정책과 분 표기에 대한 명목 달력 산술입니다. 실제 교운 순간·미래 사건의 예측값이 아니며, 단위 분해 경계에서 연속적이거나 단조적인 변환도 아닙니다. 미래 명목 기간은 그때의 법정시·DST·세운을 인증하지 않습니다.',
  candidates:projection.candidates.map(c=>({candidateRef:c.candidateRef,candidateIndex:c.candidateIndex,items:c.facts.map((fact,i)=>{
    check(Object.hasOwn(templates,fact.kind),'UNKNOWN_CALENDAR_TEMPLATE');
    return {id:'projection.explanation['+c.candidateIndex+']['+i+']',candidateRef:c.candidateRef,templateId:'KO_M7_V02_'+fact.kind,templateVersion:PROJECTION_TEMPLATE_VERSION,factRefs:[fact.id],baseFactRefs:[...fact.baseFactRefs],ruleRefs:[...fact.ruleRefs],policyRefs:[...fact.policyRefs],sourceRefs:[...fact.sourceRefs],calculationSourceRefs:[...fact.calculationSourceRefs],text:templates[fact.kind](fact.value)};
  })}))};}
export function explainLuckProjection(projection){return buildView(projection);}
export function validateLuckProjectionExplanation(explanation,projection){
  validateProjection(projection);check(explanation?.schemaVersion==='ko-m7-calendar-templates-v02'&&Array.isArray(explanation.candidates),'CALENDAR_EXPLANATION_SCHEMA');
  check(explanation.candidates.length===projection.candidates.length,'CALENDAR_EXPLANATION_CANDIDATES');
  for(let i=0;i<projection.candidates.length;i++){
    const c=projection.candidates[i],view=explanation.candidates[i],facts=new Map(c.facts.map(f=>[f.id,f]));
    check(view.candidateRef===c.candidateRef&&view.candidateIndex===c.candidateIndex&&Array.isArray(view.items),'CALENDAR_EXPLANATION_CANDIDATE_REFERENCE');
    for(const item of view.items){check(item.candidateRef===c.candidateRef&&Array.isArray(item.factRefs)&&item.factRefs.length>0&&item.factRefs.every(id=>facts.has(id)),'CALENDAR_EXPLANATION_FACT_REFERENCE');
      for(const key of ['baseFactRefs','ruleRefs','policyRefs','sourceRefs','calculationSourceRefs'])check(Array.isArray(item[key])&&item[key].every(ref=>item.factRefs.some(id=>facts.get(id)[key].includes(ref))),'CALENDAR_EXPLANATION_REFERENCE');
      check(item.templateVersion===PROJECTION_TEMPLATE_VERSION&&Object.keys(templates).some(k=>item.templateId==='KO_M7_V02_'+k),'UNKNOWN_CALENDAR_TEMPLATE');
    }
  }
  check(fingerprint(explanation)===fingerprint(buildView(projection)),'CALENDAR_EXPLANATION_CONTENT_CHANGED');return true;
}
export function validateLocalLuckProjectionResult(result){
  const receipt=issuedResults.get(result);check(receipt&&result.schemaVersion===LOCAL_LUCK_PROJECTION_SCHEMA&&result.status==='OK'&&result.m7===receipt.base&&result.projection===receipt.projection,'ISSUED_LOCAL_CALENDAR_RESULT_REQUIRED');
  validateLocalLuckResult(result.m7);validateProjection(result.projection);validateLuckProjectionExplanation(result.explanation,result.projection);return true;
}
export function renderLocalLuckProjectionText(result){
  validateLocalLuckProjectionResult(result);const base=result.m7,lines=[result.explanation.title,`기산 정책: ${base.luck.policy.id} / ${base.luck.policy.version}`,`달력 투영: ${metadata.id} / ${metadata.version}`,
    `양력 환산 ${base.m1.input.gregorianDate} ${base.m1.input.time}`,`프로필: ${base.m1.profile.id}`,`dataset: ${base.m1.dataset.id}`,`manifest: ${base.m1.dataset.candidateManifestContentSha256}`,
    `시계: ${base.m1.policies.clock.id} / 일주: ${base.m1.policies.dayRollover.id} / 시주: ${base.m1.policies.hourStemReference.id}`,result.explanation.scopeNote];
  if(base.baseExplanation){lines.push('','원국 M2 기초 설명(원국 분류 범위)');for(const c of base.baseExplanation.explanation.candidates){lines.push('원국 후보 '+(c.candidateIndex+1));for(const item of c.items)lines.push(item.text,'  원국 근거: '+item.factRefs.join(', '));}}
  for(const c of result.projection.candidates){
    const natal=base.m1.chart.candidates[c.candidateIndex],oldView=base.explanation.candidates[c.candidateIndex],view=result.explanation.candidates[c.candidateIndex];
    lines.push('',`출생 후보 ${c.candidateIndex+1} [${c.candidateRef}]`, `원국: 연 ${glyph(natal.year)} · 월 ${glyph(natal.month)} · 일 ${glyph(natal.day)} · 시 ${glyph(natal.hour)}`);
    for(const item of oldView.items)if(item.templateId!=='KO_M7_DAYUN_PROJECTION')lines.push(item.text,'  기존 기산 근거: '+item.factRefs.join(', '));
    for(const item of view.items)lines.push(item.text,`  근거: ${item.factRefs.join(', ')} | 기존 fact: ${item.baseFactRefs.join(', ')} | 규칙: ${item.ruleRefs.join(', ')} | 정책: ${item.policyRefs.join(', ')} | 규칙 출처: ${item.sourceRefs.join(', ')} | 자료 출처: ${item.calculationSourceRefs.join(', ')}`);
    if(c.calendar.status==='PROJECTED_UNDER_POLICY'){
      for(const step of c.calendar.steps)lines.push('  가산 단계: '+JSON.stringify(step));
      for(const period of c.calendar.periods)lines.push(`${period.ordinal}. ${glyph(period.pillar)}: [${period.startInclusive}, ${period.endExclusive}) 명목 민간시`);
    }else{
      const sequence=base.luck.candidates[c.candidateIndex].dayun.sequence;
      if(sequence){for(const entry of sequence.entries)lines.push(`${entry.ordinal}. ${glyph(entry.pillar)}: 명목 기간 ${c.calendar.status}로 미정`);
        lines.push('  기존 순서 근거: luck.candidates['+c.candidateIndex+']#sequence');}
    }
  }
  return lines.join('\n')+'\n';
}

export function parseLocalLuckProjectionArgs(args){
  check(args.length>0&&args.length%2===0,'EXPLICIT_ARGUMENTS_REQUIRED');const extra={},base=[];
  for(let i=0;i<args.length;i+=2){const key=args[i];if(['--calendar-projection','--as-of-date','--as-of-time'].includes(key)){check(!Object.hasOwn(extra,key)&&typeof args[i+1]==='string','CALENDAR_ARGUMENTS');extra[key]=args[i+1];}else base.push(key,args[i+1]);}
  policy(extra['--calendar-projection']);check((extra['--as-of-date']===undefined)===(extra['--as-of-time']===undefined),'EXPLICIT_AS_OF_DATE_AND_TIME_REQUIRED');
  const asOfMinute=extra['--as-of-date']===undefined?undefined:extra['--as-of-date']+'T'+extra['--as-of-time'];queryOptions({asOfMinute});
  const options=parseLocalLuckArgs(base);check(options.mode==='BIRTH_LINKED'&&options.features.dayun!==undefined,'CALENDAR_PROJECTION_REQUIRES_DAYUN');
  return {...options,calendarProjectionPolicyId:extra['--calendar-projection'],asOfMinute};
}
export async function runLocalLuckProjectionCli(args){try{
  const options=parseLocalLuckProjectionArgs(args),profile=await loadLocalLuckProjectionProfile(options),result=profile.calculate(options.request,options.features,{asOfMinute:options.asOfMinute});
  if(result.status!=='OK'){process.stderr.write(JSON.stringify({status:result.status,code:'BIRTH_INPUT_NOT_SUPPORTED'})+'\n');process.exitCode=2;}
  else process.stdout.write(options.output==='json'?JSON.stringify(result,null,2)+'\n':renderLocalLuckProjectionText(result));
}catch(error){process.stderr.write(JSON.stringify({status:'REJECTED',code:error instanceof LocalLuckProjectionError||error instanceof LocalLuckError||error instanceof LocalChartError||error instanceof BoundarySupplementError?error.code:'LUCK_CALENDAR_DATA_OR_INPUT_REJECTED'})+'\n');process.exitCode=1;}}
