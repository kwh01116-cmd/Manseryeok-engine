/** Explicit product composition. Legacy research output and all underlying policies stay intact. */
import {resolve} from 'node:path';
import {pathToFileURL} from 'node:url';
import {fingerprint} from '../../.kasi-build/schema.js';
import {loadLocalChartProfile,LocalChartError} from './local-chart.mjs';
import {LOCAL_ANALYSIS_REPORT_PROFILE_ID,LOCAL_ANALYSIS_REPORT_METADATA,createLocalAnalysisReportProfile,parseLocalAnalysisReportArgs,validateLocalAnalysisReportResult,renderLocalAnalysisReportText,LocalAnalysisReportError} from './local-analysis-report.mjs';
import {M5_LIMITED_PURPOSE_POLICY_ID,M5_LIMITED_PURPOSE_METADATA,deriveM5LimitedPurpose,validateM5LimitedPurpose,explainM5LimitedPurpose,validateM5LimitedPurposeExplanation,renderM5LimitedPurposeText} from '../../dist/m5/limitedPurposeV1.js';
import {GONGMANG_POLICY_ID,GONGMANG_METADATA,deriveGongmang,validateGongmang,explainGongmang} from '../../dist/domain/gongmangV1.js';
import {MONTHLY_LUCK_POLICY_ID,createLocalMonthlyLuck,validateLocalMonthlyLuck,explainLocalMonthlyLuck,renderLocalMonthlyLuckText} from './local-monthly-luck.mjs';
import {MONTHLY_LUCK_METADATA} from '../../dist/luck/monthlyLuckV1.js';
import {ganZhiAt} from '../../dist/domain/sexagenary.js';
import {labelKoreanGanZhi} from '../../dist/calendar/koreanBirthPreview.js';
import {isGregorianMinute} from '../../dist/calendar/solarTermTimeline.js';

export const PRODUCT_REPORT_PROFILE_ID='KASI-LOCAL-PRODUCT-ANALYSIS-V01';
export const PRODUCT_REPORT_SCHEMA='kasi-local-product-analysis-v1';
export class LocalProductReportError extends Error{constructor(code){super(code);this.name='LocalProductReportError';this.code=code;}}
const check=(ok,code)=>{if(!ok)throw new LocalProductReportError(code);};
const issued=new WeakMap(),sealed=new WeakSet();
const freeze=value=>{if(value&&typeof value==='object'&&!sealed.has(value)){Object.values(value).forEach(freeze);Object.freeze(value);sealed.add(value);}return value;};
const unique=values=>[...new Set(values)];
export const PRODUCT_REPORT_METADATA=freeze({id:PRODUCT_REPORT_PROFILE_ID,version:'0.1.0',schemaVersion:PRODUCT_REPORT_SCHEMA,
  dependencies:[{id:LOCAL_ANALYSIS_REPORT_PROFILE_ID,version:LOCAL_ANALYSIS_REPORT_METADATA.version},{id:M5_LIMITED_PURPOSE_POLICY_ID,version:M5_LIMITED_PURPOSE_METADATA.version},{id:GONGMANG_POLICY_ID,version:GONGMANG_METADATA.version},{id:MONTHLY_LUCK_POLICY_ID,version:MONTHLY_LUCK_METADATA.version}],
  purpose:'FACTS_STRUCTURES_AND_ONE_LIMITED_WARMING_CANDIDATE_NOT_COMPLETE_FORTUNE',m5ExplicitSelectionRequired:true,
  summaryAndDetailed:'TWO_VIEWS_OF_IDENTICAL_ISSUED_ANALYSIS_WITH_SHARED_SUMMARY_ITEMS',gongmangBasis:'M1_SELECTED_DAY_PILLAR',
  monthlyQueries:'INDEPENDENT_CALENDAR_QUERIES_NOT_NATAL_CARTESIAN_PRODUCTS',legacyResearchContract:'UNCHANGED',m3DefaultPromotion:false,
  m5Meaning:'LIMITED_PURPOSE_CANDIDATES_NOT_FINAL_USEFUL_GOD',legacyFields:'BASE_V1_FIELDS_RETAIN_THEIR_PRE_SPRINT3_SCOPE',rights:'PRIVATE_DATA_NO_REDISTRIBUTION_REVIEW_OPEN',prediction:'NOT_IMPLEMENTED'});

// Presentation labels only; stem/branch readings reuse the existing canonical cycle labeler.
const stemReadings=new Map(),branchReadings=new Map();
for(let i=0;i<60;i++){const p=ganZhiAt(i),s=labelKoreanGanZhi(p).hangul;stemReadings.set(p.stem,s[0]);branchReadings.set(p.branch,s[1]);}
const stemText=s=>`${s}(${stemReadings.get(s)})`,branchText=b=>`${b}(${branchReadings.get(b)})`;
const pillarText=p=>{const value=labelKoreanGanZhi(p);return `${value.hanja}(${value.hangul})`;};
const roles={year:'연',month:'월',day:'일',hour:'시'};
const elementText={WOOD:'목(木)',FIRE:'화(火)',EARTH:'토(土)',METAL:'금(金)',WATER:'수(水)'};
const seasons={SPRING:'봄',SUMMER:'여름',AUTUMN:'가을',WINTER:'겨울',EARTH_DOMINANT:'토왕 구간'};
const states={WANG:'왕(旺)',XIANG:'상(相)',XIU:'휴(休)',QIU:'수(囚)',SI:'사(死)'};
const strengthSentences={RESOLVED_UNDER_POLICY:'선택한 좁은 조건에서는 신약으로 분류합니다. 이를 다른 명식이나 종합 강약의 정답으로 일반화하지 않습니다.',OUTSIDE_POLICY_SCOPE:'현재의 제한된 규칙으로는 전체 신강약을 판단하지 않습니다.',DEFERRED_EFFECT_POLICY_REQUIRED:'근·생조·관계가 실제로 얼마나 작용하는지 평가하지 않아 강약을 보류합니다.',DEFERRED_MIXED_EVIDENCE:'지원하는 구조와 반대 구조가 함께 있어 강약을 보류합니다.',NEEDS_DATA:'필요한 경계 자료가 부족해 강약을 보류합니다.'};
const godText=(candidate,type)=>{const p=candidate.patterns.find(p=>p.patternType===type);return p?`${p.patternNameKo}(${type})`:type;};
function select(options){check(options?.reportProfileId===PRODUCT_REPORT_PROFILE_ID,'EXPLICIT_SUPPORTED_PRODUCT_REPORT_PROFILE_REQUIRED');check(options.m5PolicyId===M5_LIMITED_PURPOSE_POLICY_ID,'EXPLICIT_SUPPORTED_M5_POLICY_REQUIRED');for(const key of ['m2ProfileId','m3ProfileId','rootPolicyId','supportPolicyId','seasonalPolicyId','synthesisProfileId','innerPatternProfileId','patternProfileId','positionProfileId','gongmangPolicyId','monthlyPolicyId','luckPolicyId'])check(options[key]===undefined,'PRODUCT_FIXED_SUBPOLICY_CONFLICT');}
function monthlySelection(value={}){
  check(value&&typeof value==='object'&&!Array.isArray(value)&&Object.keys(value).every(k=>['policyId','year','queryMinute'].includes(k)),'PRODUCT_MONTHLY_ARGUMENTS');
  if(Object.keys(value).length===0)return {status:'NOT_REQUESTED'};
  check(value.policyId===MONTHLY_LUCK_POLICY_ID,'EXPLICIT_SUPPORTED_MONTHLY_POLICY_REQUIRED');
  check(value.year!==undefined||value.queryMinute!==undefined,'EXPLICIT_MONTHLY_QUERY_REQUIRED');
  if(value.year!==undefined)check(Number.isInteger(value.year)&&value.year>=1&&value.year<=9999,'MONTHLY_YEAR_MUST_BE_1_TO_9999');
  if(value.queryMinute!==undefined)check(typeof value.queryMinute==='string'&&isGregorianMinute(value.queryMinute),'EXPLICIT_MONTHLY_QUERY_MINUTE_REQUIRED');
  return {status:'REQUESTED',options:{...(value.year===undefined?{}:{year:value.year}),...(value.queryMinute===undefined?{}:{queryMinute:value.queryMinute})}};
}
function pathValue(value,path){check(/^[A-Za-z][A-Za-z0-9]*(?:\.[A-Za-z][A-Za-z0-9]*|\[\d+\])*$/.test(path),'PRODUCT_REFERENCE_PATH');for(const key of path.replace(/\[(\d+)\]/g,'.$1').split('.')){check(value&&typeof value==='object'&&Object.hasOwn(value,key),'PRODUCT_REFERENCE_TARGET_MISSING');value=value[key];}return value;}
function summaryContent(value){
  const {base,m5,gongmang,monthly}=value,parents=base.existing.facts.candidates;
  const references=[],sections=['나의 사주팔자','일간과 오행','대표 구조와 공망','계절·강약 관련 정보','목적별 도움 요소 후보','대운·세운·월운','확인한 내용과 남은 판단'].map((title,i)=>({id:'PRODUCT_SECTION_'+(i+1),title,items:[]}));
  const ref=(layer,path,candidateRef=null)=>{pathValue(value,path);const record={id:'product:'+layer+':'+path,layer,valuePath:path,candidateRef};if(!references.some(r=>r.id===record.id))references.push(record);return record.id;};
  const add=(index,id,text,refs,candidateRef=null)=>{check(typeof text==='string'&&text.length&&refs.length,'PRODUCT_ITEM_CONTENT_REQUIRED');sections[index].items.push({id,text,candidateRef,refs:unique(refs)});};
  const profileRef=ref('POLICY','profile');
  if(parents.length>1)add(0,'minute-ambiguity','절입의 같은 표시 분이어서 원국을 하나로 확정하지 않습니다. 아래 두 후보를 각각 읽어 주세요.',[ref('BIRTH','base.existing.m1.chart')]);
  parents.forEach((c,i)=>{
    const owner=c.id,prefix=parents.length>1?`후보 ${i+1} — `:'',factRef=ref('M2',`base.existing.facts.candidates[${i}]`,owner),inner=base.innerPatterns.candidates[i];
    add(0,owner+'#pillars',prefix+c.pillars.map(p=>`${roles[p.role]}주 ${pillarText(p)}`).join(' · '),[factRef],owner);
    const counts=base.report.sections[1].items.find(item=>item.candidateRef===owner&&item.data?.countingPolicy).data.counts,nature=c.pillars[2].nature.stem;
    add(1,owner+'#day-element',`${prefix}일간은 ${stemText(c.dayMaster)}, ${nature.polarity==='YANG'?'양':'음'}의 ${elementText[nature.element]}입니다. 표면 여덟 자리의 단순 개수는 ${Object.entries(counts).map(([key,n])=>elementText[key]+' '+n).join(' · ')}입니다. 장간과 계절 가중치가 빠진 집계이므로 실제 힘의 비율로 읽지 않습니다.`,[factRef,ref('COUNTS',`base.report.sections[1].items[${base.report.sections[1].items.findIndex(item=>item.candidateRef===owner&&item.data?.countingPolicy)}]`,owner)],owner);
    const candidateTypes=inner.selection.candidateTypes,primary=inner.selection.primaryPattern,other=candidateTypes.filter(t=>t!==primary),main=inner.monthContext.principalHiddenMember;
    let structure=primary?`월지 ${branchText(c.pillars[1].branch)}의 본기 ${stemText(main.stem)}를 근거로 ${godText(inner,primary)} 구조 후보를 표시합니다.`:'월령 본기가 비겁이어서 현재 여덟 내격의 대표 후보를 정하지 않습니다.';
    if(other.length)structure+=` 정확 투출로 검토하는 다른 후보는 ${other.map(t=>godText(inner,t)).join(' · ')}입니다.`;
    if(inner.selection.status.includes('COMPETING')||inner.selection.status.includes('UNRESOLVED'))structure+=' 다른 월령 장간의 투출이 겹쳐 단독 선택은 보류합니다.';
    if(inner.selection.unresolvedTypes.length)structure+=' 일부 기타 장간은 표와 해석의 호환 정책이 미확정입니다.';
    structure+=' 격의 성립·파괴나 우열을 확정한 결과는 아닙니다.';
    add(2,owner+'#pattern',prefix+structure,[ref('M4',`base.innerPatterns.candidates[${i}]`,owner)],owner);
    const g=gongmang[i],matches=g.observedMatches.map(m=>`${roles[m.role]}지 ${branchText(m.branch)}`);
    add(2,owner+'#void',`${prefix}선택된 일주 기준 공망 지지는 ${g.voidBranches.map(branchText).join(' · ')}입니다. ${matches.length?'원국에서는 '+matches.join(' · ')+' 위치가 대응합니다.':'원국에서는 대응하는 지지가 확인되지 않습니다.'} 이 존재 계산으로 길흉을 판단하지 않습니다.`,[ref('GONGMANG',`gongmang[${i}]`,owner)],owner);
    const season=base.existing.seasonal.candidates[i],root=base.existing.root.candidates[i],target=root.targets.find(t=>t.id===root.dayMasterTargetRef),alternatives=season.judgment.alternatives;
    const seasonText=alternatives.length?unique(alternatives.map(a=>`${seasons[a.season]} 표에서 ${states[a.seasonalState]}`)).join(' / ')+(alternatives.length>1?'의 조건부 대안입니다.':'입니다.'):'필요한 경계 자료가 부족해 계절 분류를 보류합니다.';
    add(3,owner+'#season-root',`${prefix}${seasonText} 같은 오행의 장간 근은 ${target.chartRootPresence==='PRESENT_UNDER_POLICY'?'확인됩니다':'이 정책에서 확인되지 않습니다'}. 근의 실제 강도와 관계의 작용은 별도입니다.`,[ref('SEASON',`base.existing.seasonal.candidates[${i}]`,owner),ref('ROOT',`base.existing.root.candidates[${i}]`,owner)],owner);
    const paths=base.existing.researchReport.candidates[i].paths;
    const pathStatuses=unique(paths.map(p=>p.status));
    const strengthText=pathStatuses.every(s=>s!=='RESOLVED_UNDER_POLICY'&&s!=='NEEDS_DATA')&&pathStatuses.length>1?'계절 대안에 따라 검토 조건은 달라지지만, 현재 규칙에서는 어느 쪽도 전체 강약을 확정하지 않습니다.':unique(pathStatuses.map(status=>strengthSentences[status]??'현재 규칙의 조건이 닫히지 않아 강약을 보류합니다.')).join(' ');
    add(3,owner+'#limited-strength',prefix+strengthText,[ref('M3',`base.existing.researchReport.candidates[${i}]`,owner)],owner);
    if(base.weighted)add(3,owner+'#weighted',`${prefix}별도로 선택한 휴리스틱 점수는 ${base.weighted[i].score.value}/10입니다. 객관적인 힘의 측정값이나 M5 후보 선정 근거는 아닙니다.`,[ref('EXPERIMENTAL',`base.weighted[${i}]`,owner)],owner);
    add(4,owner+'#m5',prefix+value.m5Explanation.candidates[i].items.map(item=>item.text).join(' '),[ref('M5',`m5.candidates[${i}]`,owner),ref('M5_TEXT',`m5Explanation.candidates[${i}]`,owner)],owner);
  });
  if(!base.m7)add(5,'m7-not-requested','대운·세운은 요청하지 않았습니다. 방향 규칙용 성별값이나 현재 시각을 추정해 채우지 않습니다.',[ref('M7_SELECTION','base.luckSelection')]);
  else{
    base.m7.luck.candidates.forEach((c,i)=>{const d=c.dayun;if(!d)return;let text;
      if(d.status==='INVALID_INPUT')text='대운 방향에 필요한 명시 입력이 부족해 대운을 보류합니다.';
      else{text=`${d.direction.direction==='FORWARD'?'순행':'역행'} 대운의 첫 간지는 ${pillarText(d.sequence.entries[0].pillar)}입니다.`;if(d.start.status==='OK')text+=' 기산나이는 선택한 3일=1모형년 규칙으로 계산했습니다.';else text+=d.start.status==='NEEDS_DATA'?' 다음 절입 자료가 부족해 기산을 보류합니다.':'표시 분의 조건이 미확정이어서 기산을 보류합니다.';
      const p=base.projection?.projection.candidates[i];if(p?.calendar.firstStartMinute)text+=` 첫 명목 교운일은 ${p.calendar.firstStartMinute.replace('T',' ')}입니다.`;if(p?.selection?.selection)text+=` 명시한 조회에서 제${p.selection.selection.ordinal}대운 ${pillarText(p.selection.selection.pillar)}로 선택됩니다.`;}
      add(5,c.candidateRef+'#dayun',(parents.length>1?`후보 ${i+1} — `:'')+text,[ref('M7',`base.m7.luck.candidates[${i}]`,c.candidateRef)],c.candidateRef);
    });
    const seyun=base.m7.luck.seyun;if(seyun.yearLabel)add(5,'annual-label',`${seyun.yearLabel.year}년 세운 연도 라벨은 ${pillarText(seyun.yearLabel.pillar)}입니다. 특정 시각의 입춘 판정과는 구분합니다.`,[ref('SEYUN','base.m7.luck.seyun.yearLabel')]);
    if(seyun.atMinute)add(5,'annual-query',`${seyun.atMinute.queryMinute.replace('T',' ')}의 독립 세운 조회: ${seyun.atMinute.entries.length?seyun.atMinute.entries.map(e=>e.yearLabel+'년 '+pillarText(e.pillar)).join(' / '):'현재 자료·시계 정책에서 판단 보류'}${seyun.atMinute.entries.length>1?'(표시 분의 두 대안)':''}.`,[ref('SEYUN','base.m7.luck.seyun.atMinute')]);
  }
  if(monthly.status==='NOT_REQUESTED')add(5,'monthly-not-requested','월운은 요청하지 않았습니다. 조회 날짜나 연도는 직접 지정해야 합니다.',[ref('MONTHLY','monthly')]);
  else{
    const monthlyRef=ref('MONTHLY','monthly');
    if(monthly.birthLink?.queryRelation==='BEFORE_BIRTH')add(5,'monthly-before-birth','조회 시각은 출생 전입니다. 개인 운세 기간으로 설명하지 않고 독립 달력 월 정보만 제공합니다.',[monthlyRef]);
    if(monthly.atMinute){const q=monthly.atMinute;add(5,'monthly-at',`${q.queryMinute.replace('T',' ')}의 절입 기준 월운: ${q.entries?.length?q.entries.map(e=>pillarText(e.monthPillar)).join(' / '):q.status==='POLICY_UNRESOLVED'?'검증된 시계 정책 범위 밖이어서 보류':'필요한 절입 자료가 부족해 보류'}${q.entries?.length>1?'(절입 표시 분의 두 대안)':''}. ${q.status==='PARTIAL'?'월간지는 확인했지만 종료 절입 자료가 없어 구간의 끝은 미정입니다. ':''}양력 달의 1일을 월 교체 기준으로 사용하지 않습니다.`,[monthlyRef]);}
    if(monthly.yearTable){const table=monthly.yearTable;add(5,'monthly-table',table.rows.length?`${table.yearLabel}년 입춘에서 시작하는 명리 월 12구간: `+table.rows.map((r,i)=>`${i+1} ${r.monthPillar?pillarText(r.monthPillar):'간지 보류'}${r.status==='NEEDS_DATA'?' [경계 자료 부족]':''}`).join(' · ')+'. 실제 적용 절입과 시작·종료 표기는 상세 근거에 보존합니다.':`${table.yearLabel}년 월운표는 현재 검증된 시계 정책의 범위 밖이어서 보류합니다.`,[monthlyRef]);}
  }
  add(6,'scope','네 기둥·십성·장간·공망과 요청한 시간축은 계산 사실입니다. 내격·계절·근과 M5 후보는 선택 규칙의 결과입니다. 전체 신강약, 최종 용신·희기 순위, 격국 성패와 개인 사건은 확정하지 않았습니다.',[profileRef]);
  return {schemaVersion:'ko-user-product-summary-v1',templateVersion:'0.1.0',title:'나의 사주 분석 요약',sections,references};
}

function validateSummaryLinks(value,summary){const refs=new Map(summary.references.map(r=>[r.id,r]));check(refs.size===summary.references.length,'PRODUCT_DUPLICATE_REFERENCE');for(const r of refs.values()){const target=pathValue(value,r.valuePath);if(r.candidateRef&&target?.candidateRef!==undefined)check(target.candidateRef===r.candidateRef,'PRODUCT_CROSS_PARENT_REFERENCE');}for(const s of summary.sections)for(const item of s.items)for(const id of item.refs){const r=refs.get(id);check(r&&(!item.candidateRef||!r.candidateRef||item.candidateRef===r.candidateRef),'PRODUCT_ITEM_REFERENCE_MISMATCH');}}
export function createLocalProductReportProfile(chartProfile,options={}){
  select(options);const {contextProfile=chartProfile}=options;
  const baseProfile=createLocalAnalysisReportProfile(chartProfile,{reportProfileId:LOCAL_ANALYSIS_REPORT_PROFILE_ID,contextProfile,...(options.experimentalPolicyId===undefined?{}:{experimentalPolicyId:options.experimentalPolicyId})});
  let monthlyProfile;
  return Object.freeze({metadata:PRODUCT_REPORT_METADATA,calculate(request,temporal={}){
    check(temporal&&typeof temporal==='object'&&!Array.isArray(temporal)&&Object.keys(temporal).every(k=>['luckOptions','monthlyOptions'].includes(k)),'PRODUCT_TEMPORAL_ARGUMENTS');
    const selectedMonthly=monthlySelection(temporal.monthlyOptions),base=baseProfile.calculate(request,temporal.luckOptions??{});
    if(base.status!=='REPORT_ONLY')return {schemaVersion:PRODUCT_REPORT_SCHEMA,status:base.status,base,summary:null,detailed:null};
    validateLocalAnalysisReportResult(base);const {evidence,facts,seasonal}=base.existing;
    const m5=deriveM5LimitedPurpose(evidence,{policyId:options.m5PolicyId,m2Facts:facts,seasonal,innerPatterns:base.innerPatterns}),m5Explanation=explainM5LimitedPurpose(m5);
    const gongmangInputs=facts.candidates.map(c=>({candidateRef:c.id,policyId:GONGMANG_POLICY_ID,pillars:c.pillars.map(p=>{const fact=c.facts.find(f=>f.kind==='PILLAR_NATURE'&&f.value.role===p.role);check(fact,'PRODUCT_GONGMANG_FACT_REQUIRED');return {role:p.role,stem:p.stem,branch:p.branch,factRef:fact.id};}),calculationPolicyRefs:[base.existing.m1.policies.clock.id,base.existing.m1.policies.dayRollover.id,base.existing.m1.policies.hourStemReference.id]}));
    const gongmang=gongmangInputs.map(deriveGongmang);
    if(selectedMonthly.status==='REQUESTED')monthlyProfile??=createLocalMonthlyLuck(contextProfile,{policyId:MONTHLY_LUCK_POLICY_ID});
    const monthly=selectedMonthly.status==='NOT_REQUESTED'?{status:'NOT_REQUESTED',policy:MONTHLY_LUCK_METADATA}:monthlyProfile.calculate(selectedMonthly.options,{birthCalculation:base.existing.m1});
    const value={schemaVersion:PRODUCT_REPORT_SCHEMA,status:'PRODUCT_ANALYSIS_ONLY',profile:PRODUCT_REPORT_METADATA,base,m5,m5Explanation,gongmang,monthly,
      selectedPolicies:{report:PRODUCT_REPORT_PROFILE_ID,m5:options.m5PolicyId,gongmang:GONGMANG_POLICY_ID,monthly:selectedMonthly.status==='REQUESTED'?MONTHLY_LUCK_POLICY_ID:null,experimental:base.weighted?options.experimentalPolicyId:null},
      executionCounts:{...base.executionCounts,monthlyBirthM1Calls:0},technical:{birthProfile:base.existing.m1.profile,dataset:base.existing.m1.dataset,calculationPolicies:base.existing.m1.policies,sourceAuthentication:'EXISTING_SAME_PROCESS_VALIDATION_NOT_SERIALIZED_SELF_AUTHENTICATION',rights:'PUBLIC_DISTRIBUTION_BLOCKED_COMMERCIAL_RIGHTS_UNRESOLVED'}};
    value.summary=summaryContent(value);validateSummaryLinks(value,value.summary);
    value.detailed={schemaVersion:'ko-product-detailed-evidence-v1',summary:value.summary,legacyResearchReport:base.report,m5Explanation,gongmangExplanations:gongmang.map(explainGongmang),monthlyExplanation:monthly.status==='NOT_REQUESTED'?null:explainLocalMonthlyLuck(monthly)};
    freeze(value);issued.set(value,{fingerprint:fingerprint(value),m5Context:{evidence,m2Facts:facts,seasonal,innerPatterns:base.innerPatterns},gongmangInputs});return value;
  }});
}
export async function loadLocalProductReportProfile(options){return createLocalProductReportProfile(await loadLocalChartProfile(options),options);}
export function validateLocalProductReportResult(value){const receipt=issued.get(value);check(receipt&&Object.isFrozen(value)&&value.schemaVersion===PRODUCT_REPORT_SCHEMA&&value.status==='PRODUCT_ANALYSIS_ONLY'&&receipt.fingerprint===fingerprint(value),'ISSUED_LOCAL_PRODUCT_RESULT_REQUIRED');validateLocalAnalysisReportResult(value.base);validateM5LimitedPurpose(value.m5,receipt.m5Context);validateM5LimitedPurposeExplanation(value.m5Explanation,value.m5);value.gongmang.forEach((g,i)=>validateGongmang(g,receipt.gongmangInputs[i]));if(value.monthly.status!=='NOT_REQUESTED')validateLocalMonthlyLuck(value.monthly,{birthCalculation:value.base.existing.m1});check(value.detailed.summary===value.summary,'PRODUCT_SHARED_SUMMARY_REQUIRED');validateSummaryLinks(value,value.summary);return true;}
export function validateLocalProductReport(view,value){validateLocalProductReportResult(value);check(fingerprint(view)===fingerprint(summaryContent(value)),'PRODUCT_SUMMARY_CONTENT_OR_REFERENCES_CHANGED');return true;}
export function renderLocalProductReportText(value,{detail='summary'}={}){
  check(['summary','detailed'].includes(detail),'EXPLICIT_PRODUCT_DETAIL_REQUIRED');validateLocalProductReportResult(value);
  if(detail==='summary')return [value.summary.title,`양력 환산 ${value.base.existing.m1.input.gregorianDate} ${value.base.existing.m1.input.time}`,...value.summary.sections.flatMap((s,i)=>['',`${i+1}. ${s.title}`,...s.items.map(item=>item.text)]),'','정책·자료 버전·출처와 세부 판단 과정은 상세 근거 리포트와 JSON에서 확인할 수 있습니다.'].join('\n')+'\n';
  return [renderLocalProductReportText(value,{detail:'summary'}),'상세 근거 리포트',renderLocalAnalysisReportText(value.base),renderM5LimitedPurposeText(value.m5),...value.detailed.gongmangExplanations.map(e=>typeof e==='string'?e:JSON.stringify(e)),value.monthly.status==='NOT_REQUESTED'?'월운 미요청':renderLocalMonthlyLuckText(value.monthly),'기술 정보',JSON.stringify({profile:value.profile,technical:value.technical,selectedPolicies:value.selectedPolicies},null,2)].join('\n')+'\n';
}
export function parseLocalProductReportArgs(args){
  check(args.length>0&&args.length%2===0,'EXPLICIT_PRODUCT_ARGUMENTS_REQUIRED');const extra={},rest=[],names=['--report-profile','--m5-policy','--detail','--monthly-policy','--monthly-year','--monthly-query-minute'];
  for(let i=0;i<args.length;i+=2){check(typeof args[i]==='string'&&typeof args[i+1]==='string','PRODUCT_ARGUMENTS');if(names.includes(args[i])){check(!Object.hasOwn(extra,args[i]),'PRODUCT_ARGUMENTS');extra[args[i]]=args[i+1];}else rest.push(args[i],args[i+1]);}
  const reportProfileId=extra['--report-profile'],m5PolicyId=extra['--m5-policy'],detail=extra['--detail'];select({reportProfileId,m5PolicyId});check(['summary','detailed'].includes(detail),'EXPLICIT_PRODUCT_DETAIL_REQUIRED');
  const parsed=parseLocalAnalysisReportArgs([...rest,'--report-profile',LOCAL_ANALYSIS_REPORT_PROFILE_ID]);
  const monthlyOptions={};if(extra['--monthly-policy']!==undefined)monthlyOptions.policyId=extra['--monthly-policy'];if(extra['--monthly-year']!==undefined){check(/^\d+$/.test(extra['--monthly-year']),'MONTHLY_YEAR_INTEGER_REQUIRED');monthlyOptions.year=Number(extra['--monthly-year']);}if(extra['--monthly-query-minute']!==undefined)monthlyOptions.queryMinute=extra['--monthly-query-minute'];monthlySelection(monthlyOptions);
  return {...parsed,reportProfileId,m5PolicyId,detail,monthlyOptions};
}
export async function runLocalProductReportCli(args){const options=parseLocalProductReportArgs(args),profile=await loadLocalProductReportProfile(options),value=profile.calculate(options.request,{luckOptions:options.luckOptions,monthlyOptions:options.monthlyOptions});if(value.status!=='PRODUCT_ANALYSIS_ONLY'){process.stderr.write(JSON.stringify({status:value.status,code:'PRODUCT_BIRTH_INPUT_NOT_SUPPORTED'})+'\n');process.exitCode=2;}else process.stdout.write(options.output==='json'?JSON.stringify(value,null,2)+'\n':renderLocalProductReportText(value,{detail:options.detail}));}
if(process.argv[1]&&import.meta.url===pathToFileURL(resolve(process.argv[1])).href){try{await runLocalProductReportCli(process.argv.slice(2));}catch(error){const safe=error instanceof LocalProductReportError||error instanceof LocalAnalysisReportError||error instanceof LocalChartError;process.stderr.write(JSON.stringify({status:'REJECTED',code:safe&&/^[A-Z][A-Z0-9_]+$/.test(error.code)?error.code:'PRODUCT_INPUT_OR_DATA_REJECTED'})+'\n');process.exitCode=1;}}
