/** Optional Korean composition of issued local facts. No network, clock defaults or predictions. */
import {resolve} from 'node:path';
import {pathToFileURL} from 'node:url';
import {fingerprint} from '../../.kasi-build/schema.js';
import {loadLocalChartProfile,parseLocalChartArgs,verifyLocalChartResult,LocalChartError} from './local-chart.mjs';
import {explainChartFacts,validateExplanation} from './local-explain.mjs';
import {createLocalM3EvidenceProfile,validateLocalM3EvidenceResult,M3_SYNTHESIS_PROFILE_ID,M3_SYNTHESIS_METADATA,LocalM3EvidenceError} from './local-m3-evidence.mjs';
import {M4_INNER_PATTERN_PROFILE_ID,M4_INNER_PATTERN_METADATA,deriveM4InnerPatterns,validateM4InnerPatterns,explainM4InnerPatterns,validateM4InnerPatternsExplanation} from '../../dist/m4/innerPatternsV1.js';
import {deriveExperimentalWeightedSupport,WEIGHTED_SUPPORT_POLICY_ID} from '../experimental/weighted-support.mjs';
import {WEIGHTED_SUPPORT_METADATA,validateWeightedSupport} from '../../dist/experimental/weightedSupportV1.js';
import {createLocalLuckProfile,validateLocalLuckResult,M7_LUCK_POLICY_V01,LocalLuckError} from './local-luck.mjs';
import {M7_LUCK_POLICY_METADATA} from '../../dist/luck/luckV01.js';
import {CALENDAR_PROJECTION_METADATA} from '../../dist/luck/calendarProjectionV02.js';
import {projectLocalLuckResult,validateLocalLuckProjectionResult,CALENDAR_PROJECTION_POLICY_V02,LocalLuckProjectionError} from './local-luck-projection.mjs';
import {isGregorianMinute} from '../../dist/calendar/solarTermTimeline.js';

export const LOCAL_ANALYSIS_REPORT_PROFILE_ID='KASI-LOCAL-INTEGRATED-ANALYSIS-V01';
export const LOCAL_ANALYSIS_REPORT_SCHEMA='kasi-local-integrated-analysis-v1';
export const LOCAL_ANALYSIS_TEMPLATE_VERSION='0.1.0';
export class LocalAnalysisReportError extends Error {constructor(code){super(code);this.name='LocalAnalysisReportError';this.code=code;}}
const check=(ok,code)=>{if(!ok)throw new LocalAnalysisReportError(code);};
const sealed=new WeakSet(),issued=new WeakMap();
function freeze(value){if(value&&typeof value==='object'&&!sealed.has(value)){Object.values(value).forEach(freeze);Object.freeze(value);sealed.add(value);}return value;}
const unique=values=>[...new Set(values)];
export const LOCAL_ANALYSIS_REPORT_METADATA=freeze({
  id:LOCAL_ANALYSIS_REPORT_PROFILE_ID,version:LOCAL_ANALYSIS_TEMPLATE_VERSION,kind:'EXPLICIT_KOREAN_REPORT_COMPOSITION',
  dependencies:[...M3_SYNTHESIS_METADATA.dependencies,{kind:'limitedSynthesis',id:M3_SYNTHESIS_PROFILE_ID,version:M3_SYNTHESIS_METADATA.version},{kind:'innerPatterns',id:M4_INNER_PATTERN_PROFILE_ID,version:M4_INNER_PATTERN_METADATA.version}],
  optionalPolicies:[{id:WEIGHTED_SUPPORT_POLICY_ID,version:WEIGHTED_SUPPORT_METADATA.policyVersion},{id:M7_LUCK_POLICY_V01,version:M7_LUCK_POLICY_METADATA.version},{id:CALENDAR_PROJECTION_POLICY_V02,version:CALENDAR_PROJECTION_METADATA.version}],
  surfaceElementCount:'FOUR_STEMS_AND_FOUR_BRANCH_PRINCIPAL_ELEMENTS_UNWEIGHTED_EIGHT_SLOTS',
  candidateScope:'CORRELATED_NATAL_PARENTS_AND_THEIR_SEASONAL_ALTERNATIVES_NO_QUERY_CARTESIAN_PRODUCT',
  excluded:['M5','YONGSHEN','FORTUNE','EVENT_PREDICTION','ACTUAL_FORCE','PATTERN_SUCCESS_CERTIFICATION'],
  serializedReferences:'TRACEABILITY_NOT_EXTERNAL_AUTHENTICATION',
});
function selectedProfile(options){
  check(options.reportProfileId===LOCAL_ANALYSIS_REPORT_PROFILE_ID,'EXPLICIT_SUPPORTED_REPORT_PROFILE_REQUIRED');
  const expected={...Object.fromEntries(M3_SYNTHESIS_METADATA.dependencies.map(p=>[{m2Profile:'m2ProfileId',m3Profile:'m3ProfileId',seasonal:'seasonalPolicyId',root:'rootPolicyId',support:'supportPolicyId'}[p.kind],p.id])),synthesisProfileId:M3_SYNTHESIS_PROFILE_ID,innerPatternProfileId:M4_INNER_PATTERN_PROFILE_ID};
  for(const [key,value] of Object.entries(expected))check(options[key]===undefined||options[key]===value,'REPORT_DEPENDENCY_POLICY_CONFLICT');
  for(const key of ['patternProfileId','positionProfileId'])check(options[key]===undefined,'REPORT_DEPENDENCY_POLICY_CONFLICT');
  if(options.experimentalPolicyId!==undefined)check(options.experimentalPolicyId===WEIGHTED_SUPPORT_POLICY_ID,'EXPLICIT_EXPERIMENTAL_POLICY_REQUIRED');
}
function luckSelection(value={}){
  check(value&&typeof value==='object'&&!Array.isArray(value)&&Object.keys(value).every(k=>['luckPolicyId','features','calendarProjectionPolicyId','asOfMinute'].includes(k)),'REPORT_LUCK_ARGUMENTS');
  if(value.features===undefined){check(value.luckPolicyId===undefined&&value.calendarProjectionPolicyId===undefined&&value.asOfMinute===undefined,'EXPLICIT_LUCK_FEATURES_REQUIRED');return {status:'NOT_REQUESTED',options:{}};}
  check(value.luckPolicyId===M7_LUCK_POLICY_V01,'EXPLICIT_SUPPORTED_LUCK_PROFILE_REQUIRED');
  const features=structuredClone(value.features);
  check(features&&typeof features==='object'&&!Array.isArray(features)&&Object.keys(features).every(k=>['dayun','seyun'].includes(k))&&(features.dayun!==undefined||features.seyun!==undefined),'EXPLICIT_LUCK_FEATURES_REQUIRED');
  let invalidDayun=null;
  if(features.dayun!==undefined){
    const d=features.dayun;check(d&&typeof d==='object'&&!Array.isArray(d)&&Object.keys(d).every(k=>['traditionalSex','count'].includes(k)),'DAYUN_ARGUMENTS');
    invalidDayun=!['MALE','FEMALE'].includes(d.traditionalSex)?'EXPLICIT_TRADITIONAL_SEX_REQUIRED':!Number.isInteger(d.count)||d.count<1||d.count>20?'DAYUN_COUNT_MUST_BE_1_TO_20':null;
  }
  if(features.seyun!==undefined){const s=features.seyun;
    check(s&&typeof s==='object'&&!Array.isArray(s)&&Object.keys(s).every(k=>['yearLabel','queryMinute'].includes(k))&&(s.yearLabel!==undefined||s.queryMinute!==undefined),'SEYUN_ARGUMENTS');
    if(s.yearLabel!==undefined)check(Number.isInteger(s.yearLabel)&&s.yearLabel>=1&&s.yearLabel<=9999,'SEYUN_YEAR_MUST_BE_1_TO_9999');
    if(s.queryMinute!==undefined)check(typeof s.queryMinute==='string'&&isGregorianMinute(s.queryMinute),'EXPLICIT_QUERY_MINUTE_REQUIRED');
  }
  if(value.calendarProjectionPolicyId!==undefined){check(value.calendarProjectionPolicyId===CALENDAR_PROJECTION_POLICY_V02,'EXPLICIT_SUPPORTED_CALENDAR_PROJECTION_REQUIRED');check(features.dayun!==undefined,'CALENDAR_PROJECTION_REQUIRES_DAYUN');}
  if(value.asOfMinute!==undefined){check(value.calendarProjectionPolicyId===CALENDAR_PROJECTION_POLICY_V02,'AS_OF_REQUIRES_EXPLICIT_CALENDAR_PROJECTION');check(typeof value.asOfMinute==='string'&&isGregorianMinute(value.asOfMinute),'EXPLICIT_AS_OF_DATE_AND_TIME_REQUIRED');}
  return freeze({status:invalidDayun&&!features.seyun?'INVALID_INPUT':'REQUESTED',invalidDayun,options:{...value,features}});
}
const elements={WOOD:'목(木)',FIRE:'화(火)',EARTH:'토(土)',METAL:'금(金)',WATER:'수(水)'};
const weightedLabels={VERY_STRONG:'극신강',STRONG:'신강',BALANCED:'중화',WEAK:'신약',VERY_WEAK:'극신약'};
const godLabels={正官:'정관',七殺:'칠살',正財:'정재',偏財:'편재',正印:'정인',偏印:'편인',食神:'식신',傷官:'상관',比肩:'비견',劫財:'겁재'};
const godLabel=type=>godLabels[type]?`${godLabels[type]}(${type})`:type;
const selectionLabels={MAIN_QI_STRUCTURAL_ANCHOR:'월령 본기를 표시 기준으로 유지',MAIN_QI_WITH_COMPETING_EXPOSURES:'본기와 다른 투출 후보가 함께 있어 단일 선택 보류',PEER_MAIN_OUT_OF_SCOPE:'비겁 본기여서 내격8 선택 범위 밖',PEER_MAIN_WITH_EXPOSED_OTHER_UNRESOLVED:'비겁 본기에 다른 투출 후보가 있어 선택 미정'};
const seasonalLabels={SPRING:'봄',SUMMER:'여름',AUTUMN:'가을',WINTER:'겨울',EARTH_DOMINANT:'토왕'};
const stateLabels={WANG:'왕(旺)',XIANG:'상(相)',XIU:'휴(休)',QIU:'수(囚)',SI:'사(死)'};
const synthesisLabels={RESOLVED_UNDER_POLICY:'선택한 제한 정책에서 신약',OUTSIDE_POLICY_SCOPE:'좁은 신약 충분조건 범위 밖',DEFERRED_MIXED_EVIDENCE:'지원·반대 구조가 함께 있어 종합 보류',DEFERRED_EFFECT_POLICY_REQUIRED:'관계의 실제 효력 판단이 필요해 종합 보류',NEEDS_DATA:'경계 자료가 부족해 종합 보류'};
const luckStatusLabels={OK:'모형 기산나이 계산',PARTIAL:'일부 조건 미정',AMBIGUOUS:'같은 표시 분이어서 기산 미정',NEEDS_DATA:'절입 자료 부족',INVALID_INPUT:'방향 규칙 입력 미정',POLICY_UNRESOLVED:'검증한 조회 정책 범위 밖',BEFORE_BIRTH:'출생 전',BEFORE_FIRST_DA_YUN:'첫 명목 교운일 전',OUTSIDE_GENERATED_RANGE:'생성한 대운 기간 밖',RESOLVED_UNDER_POLICY:'명시한 정책에서 선택'};
const glyph=p=>p.stem+p.branch;
function summarySentences(value){
  const {existing,innerPatterns,weighted,m7,projection,luckSelection:selected}=value,count=existing.facts.candidates.length;
  const prefix=i=>count>1?`후보 ${i+1}: `:'';
  const subjects=existing.facts.candidates.map((c,i)=>{const n=c.pillars[2].nature.stem;return `${prefix(i)}${c.dayMaster} 일간(${n.polarity==='YANG'?'양':'음'}·${elements[n.element]})과 ${c.pillars[1].branch}월`;});
  const selections=innerPatterns.candidates.map((c,i)=>{const s=c.selection,competing=s.candidateTypes.filter(t=>t!==s.primaryPattern);return `${prefix(i)}${s.primaryPattern?godLabel(s.primaryPattern)+'이 표시 기준':'주 후보 미정'}${competing.length?', 다른 후보 '+competing.map(godLabel).join('·'):''}이며 ${selectionLabels[s.status]}`;});
  const seasons=existing.seasonal.candidates.map((c,i)=>{const j=c.judgment,root=existing.root.candidates[i],target=root.targets.find(t=>t.id===root.dayMasterTargetRef);const alternatives=unique(j.alternatives.map(a=>`${seasonalLabels[a.season]} ${stateLabels[a.seasonalState]}`));return `${prefix(i)}${alternatives.length?'계절 분류는 '+alternatives.join(' / ')+(alternatives.length>1?'의 조건부 대안':''):'경계 자료가 부족해 계절 분류는 미정'}이고 일간의 구성상 직접 근은 ${target.chartRootPresence==='PRESENT_UNDER_POLICY'?'있습니다':'없습니다'}`;});
  const synthesis=existing.researchSynthesis.candidates.map((c,i)=>`${prefix(i)}${unique(c.paths.map(p=>synthesisLabels[p.status])).join(' / ')}${weighted?`, 실험 가중 점수는 ${weighted[i].score.value}/10(${weightedLabels[weighted[i].policyClassification]})`:''}`);
  let time='대운·세운 시간축은 요청하지 않았습니다';
  if(!m7&&selected.status==='INVALID_INPUT')time='대운 방향 규칙의 입력이 미확정이어서 시간축 결과를 보류했습니다';
  if(m7){
    const dayun=m7.luck.candidates.filter(c=>c.dayun).map((c,i)=>{const d=c.dayun,p=projection?.projection.candidates[i];if(d.status==='INVALID_INPUT')return `${prefix(i)}대운 방향 입력 미정`;let text=`${prefix(i)}${d.direction.direction==='FORWARD'?'순행':'역행'} 대운은 ${glyph(d.sequence.entries[0].pillar)}부터이며 ${luckStatusLabels[d.start.status]}`;if(p?.calendar.firstStartMinute)text+=`, 첫 명목 교운일 ${p.calendar.firstStartMinute}`;if(p?.selection)text+=p.selection.selection?`, ${p.selection.asOfMinute} 조회에서 제${p.selection.selection.ordinal}대운 ${glyph(p.selection.selection.pillar)} 선택`:', '+p.selection.asOfMinute+' 조회는 '+luckStatusLabels[p.selection.status];return text;});
    const seyun=m7.luck.seyun,annual=[];if(seyun.yearLabel)annual.push(`${seyun.yearLabel.year}년 독립 세운 라벨 ${glyph(seyun.yearLabel.pillar)}`);if(seyun.atMinute)annual.push(`${seyun.atMinute.queryMinute} 독립 세운 조회 ${seyun.atMinute.entries.length?seyun.atMinute.entries.map(e=>e.yearLabel+'년 '+glyph(e.pillar)).join(' / ')+(seyun.atMinute.entries.length>1?'의 조건부 대안':''):luckStatusLabels[seyun.atMinute.status]}`);
    time=[...dayun,...annual].join('; ');
  }
  return [`${subjects.join(' / ')}을 기준으로 원국 ${count}개를 보존합니다.`,`${selections.join('; ')}입니다.`,`${seasons.join('; ')}.`,`${synthesis.join('; ')}입니다.`,`${time}.`,'표면 개수는 무가중 8자리 집계이며 실제 힘·격국 성패·용신·길흉·사건 예측을 확정하지 않습니다.'];
}
const referenceKey=(layer,id)=>layer+':'+id;

/** Every displayed statement points to an existing typed result or the composition profile. */
function buildReport(value){
  const {existing,innerPatterns,innerExplanation,basicExplanation,weighted,m7,projection,luckSelection:selected}=value;
  const references=[],known=new Map();
  const ref=(layer,id,candidateRef,valuePath)=>{
    const key=referenceKey(layer,id),record={id:key,layer,targetId:id,candidateRef,valuePath};
    if(known.has(key))check(fingerprint(known.get(key))===fingerprint(record),'REPORT_REFERENCE_COLLISION');
    else{known.set(key,record);references.push(record);}return key;
  };
  const profileRef=ref('PROFILE',LOCAL_ANALYSIS_REPORT_PROFILE_ID,null,'profile');
  const sections=[['PILLARS','사주와 일간·시간 정책'],['ELEMENTS_AND_TEN_GODS','표면 오행 8자리와 십성'],['INNER_PATTERNS','월령 내격8 구조 후보'],['SEASON_ROOT_AND_LIMITS','계절·통근과 M3 판단의 한계'],['LUCK_TIME_AXIS','선택한 대운·세운 시간축'],['OVERALL_SUMMARY','종합 요약']].map(([id,title])=>({id,title,items:[]}));
  const add=(section,id,candidateRef,text,refs,data)=>{check(typeof text==='string'&&text.length>0&&refs.length>0,'REPORT_ITEM_REQUIRES_TEXT_AND_REFERENCES');sections[section].items.push({id,candidateRef,text,refs:unique(refs),...(data===undefined?{}:{data})});};
  const allM1=[],allInner=[],allM3=[],optionalRefs=[];
  for(const c of existing.facts.candidates){
    const i=c.candidateIndex,owner=c.id,natalRef=ref('M1',owner,owner,`existing.m1.chart.candidates[${i}]`);allM1.push(natalRef);
    const factRef=id=>{check(c.facts.some(f=>f.id===id),'REPORT_M2_FACT_REFERENCE');return ref('M2',id,owner,`existing.facts.candidates[${i}].facts[${c.facts.findIndex(f=>f.id===id)}]`);};
    const view=basicExplanation.candidates[i];check(view.candidateRef===owner,'REPORT_CANDIDATE_CONTEXT');
    for(const item of view.items){
      if(['KO_BASIC_SUMMARY','KO_BASIC_DAY_MASTER'].includes(item.templateId))add(0,item.id,owner,item.text,item.factRefs.map(factRef));
      else if(['KO_BASIC_VISIBLE_TEN_GOD','KO_BASIC_HIDDEN_STEMS'].includes(item.templateId))add(1,item.id,owner,item.text,item.factRefs.map(factRef));
    }
    const counts=Object.fromEntries(Object.keys(elements).map(k=>[k,0]));
    for(const p of c.pillars){counts[p.nature.stem.element]++;counts[p.nature.branch.principalElement]++;}
    add(1,owner+'#surface-element-counts',owner,`천간 4자리와 지지 대표 오행 4자리를 한 번씩 센 무가중 표면 개수는 ${Object.entries(counts).map(([e,n])=>elements[e]+' '+n+'개').join(' · ')}입니다. 합계 8자리이며 실제 힘·계절 가중치·장간 수를 뜻하지 않습니다. 장간과 십성은 별도 항목으로 표시합니다.`,c.facts.filter(f=>f.kind==='PILLAR_NATURE').map(f=>factRef(f.id)),{counts,total:8,countingPolicy:LOCAL_ANALYSIS_REPORT_METADATA.surfaceElementCount,hiddenStemsIncluded:false});
    const inner=innerPatterns.candidates[i],innerView=innerExplanation.candidates[i];
    check(inner.candidateRef===owner&&innerView.candidateRef===owner,'REPORT_INNER_PARENT_CONTEXT');
    const innerRef=ref('M4_INNER',owner,owner,`innerPatterns.candidates[${i}]`);allInner.push(innerRef);
    const competing=inner.selection.candidateTypes.filter(type=>type!==inner.selection.primaryPattern);
    add(2,owner+'#inner-selection',owner,`월령 내격8은 월령 장간과 정확한 투출 위치로 구분하는 구조 후보입니다. 주 후보는 ${inner.selection.primaryPattern?godLabel(inner.selection.primaryPattern):'미정'}, 다른 경쟁 후보는 ${competing.map(godLabel).join(' · ')||'없음'}이며 ${selectionLabels[inner.selection.status]}입니다. 격국의 성패·합화·실제 작용은 확정하지 않습니다.`,[innerRef],{...inner.selection,competingTypes:competing});
    innerView.items.forEach((item,j)=>add(2,owner+'#inner-item['+j+']',owner,item.text,[ref('M4_INNER_TEXT',owner+'['+j+']',owner,`innerExplanation.candidates[${i}].items[${j}]`)]));
    const season=existing.seasonal.candidates[i],seasonRef=ref('M3_SEASONAL',season.judgment.id,owner,`existing.seasonal.candidates[${i}].judgment`);allM3.push(seasonRef);
    check(season.candidateRef===owner,'REPORT_SEASONAL_PARENT_CONTEXT');
    add(3,owner+'#seasonal',owner,season.explanation.text,[seasonRef],{status:season.judgment.status,alternatives:season.judgment.alternatives,derivedBoundary:season.judgment.derivedBoundary??null});
    existing.rootExplanation.candidates[i].items.forEach((item,j)=>{const id=ref('M3_ROOT_TEXT',item.id,owner,`existing.rootExplanation.candidates[${i}].items[${j}]`);allM3.push(id);add(3,owner+'#root['+j+']',owner,item.text,[id]);});
    existing.researchReport.candidates[i].paths.forEach((path,j)=>{const id=ref('M3_SYNTHESIS',path.pathRef,owner,`existing.researchSynthesis.candidates[${i}].paths[${j}]`);allM3.push(id);add(3,owner+'#limited-synthesis['+j+']',owner,path.text,[id],{status:path.status,seasonalCondition:path.seasonalCondition,conclusion:path.conclusion});});
    if(weighted){const score=weighted[i],id=ref('WEIGHTED',owner,owner,`weighted[${i}]`);optionalRefs.push(id);add(3,owner+'#weighted',owner,`별도로 선택한 실험 정책 ${WEIGHTED_SUPPORT_POLICY_ID}에서 ${score.score.value}/10, 구간명 ‘${weightedLabels[score.policyClassification]}’입니다. 표면 개수와 다른 휴리스틱이며 실제 힘·확률·기존 M3 최종 신강약의 확정값이 아닙니다. 같은 지지의 대표점수와 근 조건이 연관된 입력을 재사용하므로 독립 증거의 합으로 해석하지 않습니다.`,[id],{score:score.score,policyClassification:score.policyClassification});}
  }
  add(3,'m3-limitations',null,'구성상 근의 존재, 계절 분류와 생조 전달의 실제 효력은 서로 다릅니다. 제한적 종합의 보류는 중화를 뜻하지 않으며 기존 M3 전체 해석 게이트는 BLOCKED_UNCHANGED입니다.',[profileRef]);
  if(!weighted)add(3,'weighted-not-requested',null,'가중 점수 정책은 선택하지 않았습니다(NOT_REQUESTED).',[profileRef],{status:'NOT_REQUESTED'});
  if(!m7){
    const status=selected.status==='INVALID_INPUT'?'INVALID_INPUT':'NOT_REQUESTED';
    add(4,'luck-'+status.toLowerCase(),null,status==='NOT_REQUESTED'?'대운·세운 시간축은 요청하지 않았습니다(NOT_REQUESTED). 명시적으로 선택하면 기존 M7 계산을 사용할 수 있습니다.':`대운 입력을 확정할 수 없습니다(${selected.invalidDayun}). 전통 방향 규칙용 성별값을 추정하지 않습니다.`,[profileRef],{status,code:selected.invalidDayun??null});
  }else{
    const selectedPolicyRefs=[ref('M7_POLICY',m7.luck.policy.id,null,'m7.luck.policy')];
    if(projection)selectedPolicyRefs.push(ref('M7_PROJECTION_POLICY',projection.projection.policy.id,null,'projection.projection.policy'));
    optionalRefs.push(...selectedPolicyRefs);
    add(4,'luck-selected-policies',null,`선택한 기산·세운 정책: ${m7.luck.policy.id} (${m7.luck.policy.version}). ${projection?`선택한 명목 달력 가산 정책: ${projection.projection.policy.id} (${projection.projection.policy.version}).`:'명목 달력 가산 정책은 선택하지 않았습니다(NOT_REQUESTED).'}${selected.options.asOfMinute===undefined?'':' 명시한 대운 조회 시각: '+selected.options.asOfMinute+'.'}`,selectedPolicyRefs,{features:selected.options.features,asOfMinute:selected.options.asOfMinute??null});
    m7.luck.candidates.forEach((c,i)=>{
      for(const item of m7.explanation.candidates[i].items){
        if(['KO_M7_SEYUN_LABEL','KO_M7_SEYUN_AT'].includes(item.templateId)||(projection&&item.templateId==='KO_M7_DAYUN_PROJECTION'))continue;
        const ids=item.factRefs.map(id=>ref('M7',id,c.candidateRef,`m7.luck.candidates[${i}].facts[${c.facts.findIndex(f=>f.id===id)}]`));optionalRefs.push(...ids);add(4,'analysis-'+item.id,c.candidateRef,item.text,ids);
      }
      if(projection)projection.explanation.candidates[i].items.forEach((item,j)=>add(4,'analysis-'+item.id,c.candidateRef,item.text,[ref('M7_PROJECTION',item.factRefs[0],c.candidateRef,`projection.explanation.candidates[${i}].items[${j}]`)]));
      if(c.dayun?.sequence){const rows=c.dayun.sequence.entries.map((e,j)=>({ordinal:e.ordinal,pillar:e.pillar,modelAgeInterval:c.dayun.modelAgeIntervals?.[j]??null,nominalPeriod:projection?.projection.candidates[i].calendar.periods[j]??null}));
        const text=rows.map(r=>`${r.ordinal}. ${r.pillar.stem+r.pillar.branch}${r.nominalPeriod?' ['+r.nominalPeriod.startInclusive+', '+r.nominalPeriod.endExclusive+') 명목 민간시':r.modelAgeInterval?' ['+r.modelAgeInterval.startInclusive.reduced.numerator+'/'+r.modelAgeInterval.startInclusive.reduced.denominator+', '+r.modelAgeInterval.endExclusive.reduced.numerator+'/'+r.modelAgeInterval.endExclusive.reduced.denominator+') 모형년':' 기산 '+c.dayun.start.status+'로 미정'}`).join('\n');
        add(4,c.candidateRef+'#sequence-table',c.candidateRef,text,[ref('M7',`luck.candidates[${i}]#sequence`,c.candidateRef,`m7.luck.candidates[${i}].facts[${c.facts.findIndex(f=>f.kind==='DAYUN_SEQUENCE')}]`)],{rows});
      }
    });
    for(const [key,kind]of [['yearLabel','KO_M7_SEYUN_LABEL'],['atMinute','KO_M7_SEYUN_AT']])if(m7.luck.seyun[key]){
      const item=m7.explanation.candidates[0].items.find(i=>i.templateId===kind);check(item,'REPORT_SEYUN_EXPLANATION_REQUIRED');
      const id=ref('M7_INDEPENDENT_QUERY',key,null,'m7.luck.seyun.'+key);optionalRefs.push(id);add(4,'independent-seyun-'+key,null,item.text+' 원국 후보와 곱집합을 만들지 않는 독립 달력 조회입니다.',[id],{queryScope:'INDEPENDENT_CALENDAR_QUERY_NO_CARTESIAN_PRODUCT',value:m7.luck.seyun[key]});
    }
    if(!selected.options.features.dayun)add(4,'dayun-not-requested',null,'대운은 요청하지 않았습니다(NOT_REQUESTED). 세운 라벨·시각 조회에는 전통 방향 규칙용 성별값이 필요하지 않습니다.',[profileRef],{status:'NOT_REQUESTED'});
    if(!selected.options.features.seyun)add(4,'seyun-not-requested',null,'세운은 요청하지 않았습니다(NOT_REQUESTED).',[profileRef],{status:'NOT_REQUESTED'});
  }
  const summary=summarySentences(value).join(' ');
  add(5,'overall-summary',null,summary,[profileRef,...allM1,...allInner,...allM3,...optionalRefs]);
  const report={schemaVersion:'ko-local-integrated-analysis-report-v1',templateVersion:LOCAL_ANALYSIS_TEMPLATE_VERSION,title:'선택형 통합 명식 분석 보고서',sections,references,
    scopeNote:'명시한 계산·전통 분류·프로젝트 정책의 로컬 연구 결과입니다. 분 정밀도와 원국의 상관 후보를 보존하며 원전 판본·자료 이용권·외부 정확성·예측 효력을 인증하지 않습니다.'};
  for(const record of references){
    check(/^[A-Za-z][A-Za-z0-9]*(?:\.[A-Za-z][A-Za-z0-9]*|\[\d+\])*$/.test(record.valuePath),'REPORT_VALUE_PATH');
    const keys=record.valuePath.replace(/\[(\d+)\]/g,'.$1').split('.');let target=value;
    for(const key of keys){check(target!==null&&typeof target==='object'&&Object.hasOwn(target,key),'REPORT_REFERENCE_TARGET_MISSING');target=target[key];}
    check(target!==undefined,'REPORT_REFERENCE_TARGET_MISSING');
    if(record.candidateRef&&target?.candidateRef!==undefined)check(target.candidateRef===record.candidateRef,'REPORT_REFERENCE_TARGET_PARENT_MISMATCH');
  }
  for(const section of sections)for(const item of section.items)for(const id of item.refs){const target=known.get(id);check(target&&(!item.candidateRef||target.candidateRef===item.candidateRef||target.candidateRef===null),'REPORT_REFERENCE_PARENT_MISMATCH');}
  return report;
}

/** One M1/M2/M3 execution; M7 reads its already-issued M1 through a checked facade. */
export function createLocalAnalysisReportProfile(chartProfile,options={}){
  selectedProfile(options);const {contextProfile=chartProfile,experimentalPolicyId}=options;
  const base=createLocalM3EvidenceProfile(chartProfile,{contextProfile,synthesisProfileId:M3_SYNTHESIS_PROFILE_ID});
  return Object.freeze({metadata:LOCAL_ANALYSIS_REPORT_METADATA,calculate(request,luckOptions={}){
    const selected=luckSelection(luckOptions),existing=base.calculate(request);
    if(existing.status!=='EVIDENCE_ONLY')return {schemaVersion:LOCAL_ANALYSIS_REPORT_SCHEMA,status:existing.status,existing,report:null};
    validateLocalM3EvidenceResult(existing);
    const innerPatterns=deriveM4InnerPatterns(existing.evidence,{profileId:M4_INNER_PATTERN_PROFILE_ID,m2Facts:existing.facts});
    const innerExplanation=explainM4InnerPatterns(innerPatterns),basicExplanation=explainChartFacts(existing.facts);
    const weighted=experimentalPolicyId===undefined?null:deriveExperimentalWeightedSupport(existing.facts,{policyId:experimentalPolicyId});
    let m7=null,projection=null,issuedReads=0;
    if(selected.status==='REQUESTED'){
      const facade={calculate(input){check(input===request,'REPORT_M7_REQUEST_CONTEXT_MISMATCH');verifyLocalChartResult(existing.m1,{request:input});issuedReads++;return existing.m1;}};
      m7=createLocalLuckProfile(facade,{contextProfile,luckPolicyId:selected.options.luckPolicyId}).calculate(request,selected.options.features);
      check(m7.m1===existing.m1,'REPORT_M7_BIRTH_CONTEXT_MISMATCH');
      if(selected.options.calendarProjectionPolicyId!==undefined)projection=projectLocalLuckResult(m7,{calendarProjectionPolicyId:selected.options.calendarProjectionPolicyId,asOfMinute:selected.options.asOfMinute});
    }
    const value={schemaVersion:LOCAL_ANALYSIS_REPORT_SCHEMA,status:'REPORT_ONLY',profile:LOCAL_ANALYSIS_REPORT_METADATA,existing,innerPatterns,innerExplanation,basicExplanation,weighted,m7,projection,luckSelection:selected,
      executionCounts:{birthM1Calls:1,m2Derivations:1,m3Derivations:1,innerPatternDerivations:1,m7IssuedResultReads:issuedReads,m7BirthM1Recalculations:0},
      validation:{level:'SAME_PROCESS_ISSUED_LOCAL_RESULTS_AND_DETERMINISTIC_KOREAN_REPORT',serializedReferences:'TRACEABILITY_NOT_EXTERNAL_AUTHENTICATION',m3FinalInterpretationGate:'BLOCKED_UNCHANGED',m5:'NOT_IMPLEMENTED',fortune:'NOT_IMPLEMENTED',predictiveValidity:'NOT_CLAIMED',g0Receipt:null,g1P2Promotion:false,editionVerification:'UNVERIFIED',rightsReview:'UNVERIFIED',m7ExecutionCountsMeaning:'LEGACY_M7_birthM1Calls_COUNTS_FACADE_READ_NOT_ADDITIONAL_BIRTH_CALCULATION'}};
    value.report=buildReport(value);freeze(value);issued.set(value,{content:fingerprint(value)});return value;
  }});
}
export async function loadLocalAnalysisReportProfile(options){return createLocalAnalysisReportProfile(await loadLocalChartProfile(options),options);}
function validateDependencies(value){
  validateLocalM3EvidenceResult(value.existing);
  validateM4InnerPatterns(value.innerPatterns,{evidence:value.existing.evidence,m2Facts:value.existing.facts});
  validateM4InnerPatternsExplanation(value.innerExplanation,value.innerPatterns);
  validateExplanation(value.basicExplanation,value.existing.facts);
  if(value.weighted)value.weighted.forEach((v,i)=>validateWeightedSupport(v,{candidateRef:value.existing.facts.candidates[i].id,pillars:value.existing.facts.candidates[i].pillars.map((p,j)=>({role:p.role,stem:p.stem,branch:p.branch,factRef:`facts.candidates[${i}].pillars[${j}]`}))},{policyId:WEIGHTED_SUPPORT_POLICY_ID}));
  if(value.m7){validateLocalLuckResult(value.m7);check(value.m7.m1===value.existing.m1,'REPORT_M7_BIRTH_CONTEXT_MISMATCH');}
  if(value.projection){validateLocalLuckProjectionResult(value.projection);check(value.projection.m7===value.m7,'REPORT_PROJECTION_CONTEXT_MISMATCH');}
}
export function validateLocalAnalysisReportResult(value){
  const receipt=issued.get(value);check(receipt&&value.status==='REPORT_ONLY'&&value.schemaVersion===LOCAL_ANALYSIS_REPORT_SCHEMA&&Object.isFrozen(value)&&fingerprint(value)===receipt.content,'ISSUED_LOCAL_ANALYSIS_REPORT_REQUIRED');
  validateDependencies(value);return true;
}
/** A serialized view can be compared with a live issued result; it cannot authenticate itself. */
export function validateLocalAnalysisReport(view,value){validateLocalAnalysisReportResult(value);check(fingerprint(view)===fingerprint(buildReport(value)),'REPORT_CONTENT_OR_REFERENCES_CHANGED');return true;}
const roleNames={year:'연',month:'월',day:'일',hour:'시'};
function naturalText(text){
  const words={EXPLICIT_TRADITIONAL_SEX_REQUIRED:'전통 방향 규칙용 성별값 필요',DAYUN_COUNT_MUST_BE_1_TO_20:'대운 개수는 1~20 필요',BLOCKED_UNCHANGED:'계속 보류',NOT_REQUESTED:'요청하지 않음',POLICY_UNRESOLVED:'정책 미확정',AMBIGUOUS:'조건부 미정',NEEDS_DATA:'자료 부족',INVALID_INPUT:'입력 미정',OTHER:'기타 장간',MAIN_QI:'본기'};
  return Object.entries(words).reduce((s,[from,to])=>s.replaceAll(from,to),text);
}
export function renderLocalAnalysisReportText(value){
  validateLocalAnalysisReportResult(value);const {existing,report}=value,m1=existing.m1;
  const lines=[report.title,`보고서 정책: ${value.profile.id} / ${value.profile.version}`,`양력 환산 ${m1.input.gregorianDate} ${m1.input.time} · ${m1.input.calendar}`,`명식 프로필: ${m1.profile.id} · 데이터셋: ${m1.dataset.id}`,`manifest: ${m1.dataset.candidateManifestContentSha256}`,`시계 정책: ${m1.policies.clock.id}`,`일주 교체: ${m1.policies.dayRollover.id} · 시주 참조: ${m1.policies.hourStemReference.id}`,`하위 정책: ${value.profile.dependencies.map(p=>p.id+' ('+(p.version??'원래 버전 필드 없음')+')').join(' / ')}`,report.scopeNote];
  const heading=index=>lines.push('',`${index+1}. ${report.sections[index].title}`);
  const parent=i=>{if(existing.facts.candidates.length>1)lines.push(`후보 ${i+1}`);};
  heading(0);
  existing.facts.candidates.forEach((c,i)=>{
    parent(i);const summary=c.facts.find(f=>f.kind==='SUMMARY').value;
    lines.push(summary.pillars.map(p=>`${roleNames[p.role]}주 ${p.hanja}(${p.hangul})`).join(' · '));
    lines.push(value.basicExplanation.candidates[i].items.find(item=>item.templateId==='KO_BASIC_DAY_MASTER').text);
    lines.push(`${summary.activeSince.koreanName} ${summary.activeSince.displayedDateTime}의 월주 기준을 적용했습니다.${summary.boundarySide==='DEFINITE'?' 발표 분 비교에서 단일 원국입니다.':summary.boundarySide==='BEFORE_PUBLISHED_MINUTE'?' 절입의 표시 분에 대한 경계 전 후보입니다.':' 절입의 표시 분에 대한 경계 후 후보입니다.'}`);
  });
  heading(1);
  existing.facts.candidates.forEach((c,i)=>{
    parent(i);const items=report.sections[1].items.filter(item=>item.candidateRef===c.id);
    lines.push(items.find(item=>item.data?.countingPolicy).text);
    for(const item of items.filter(item=>!item.data?.countingPolicy))lines.push(item.text);
  });
  heading(2);
  value.innerPatterns.candidates.forEach((c,i)=>{
    parent(i);const selection=report.sections[2].items.find(item=>item.id===c.candidateRef+'#inner-selection');
    lines.push(selection.text);
    lines.push('월령 장간: '+c.monthContext.hiddenMembers.map(m=>`${m.stem} ${godLabel(m.tenGod)}${m.position==='MAIN_QI'?' [본기]':''}`).join(' · '));
    const included=c.patterns.filter(p=>p.assessment.status!=='NOT_A_CANDIDATE_UNDER_POLICY');
    if(included.length===0)lines.push('이 정책에서 선택한 내격8 구조 후보는 없습니다.');
    for(const p of included){
      const positions=p.exactExposures.map(e=>`${roleNames[e.visible.pillarRole]}간 ${e.visible.stem}`).join(' · ')||'없음';
      lines.push(`${godLabel(p.patternType)}: ${p.assessment.status==='SOURCE_OR_POLICY_UNRESOLVED'?'기타 장간 호환 정책의 적용을 보류':p.assessment.basis==='MAIN_QI'?'월령 본기 근거':'다른 월령 장간의 정확 투출 근거'}. 정확 투출 위치: ${positions}.`);
      const observed=new Set(p.observations.filter(o=>o.status==='OBSERVED').map(o=>o.id));
      const statements=value.innerExplanation.candidates[i].items.filter(item=>item.observationRefs?.some(id=>observed.has(id)));
      statements.forEach(item=>lines.push(naturalText(item.text)));
    }
    const excluded=c.patterns.filter(p=>p.assessment.status==='NOT_A_CANDIDATE_UNDER_POLICY');
    if(excluded.length)lines.push('이 정책의 후보로 채택하지 않은 유형: '+excluded.map(p=>godLabel(p.patternType)).join(' · ')+'.');
  });
  heading(3);
  existing.facts.candidates.forEach((c,i)=>{
    parent(i);const root=existing.root.candidates[i],rootItems=existing.rootExplanation.candidates[i].items;
    lines.push(rootItems.find(item=>item.judgmentRefs.includes(root.dayMasterTargetRef)).text);
    rootItems.filter(item=>item.templateId==='KO_M3_ROOT_VISIBLE_SUPPORT_OWN_ROOT').forEach(item=>lines.push(item.text));
    lines.push(existing.seasonal.candidates[i].explanation.text);
    existing.researchReport.candidates[i].paths.forEach((path,j)=>{
      const a=existing.seasonal.candidates[i].judgment.alternatives[j];
      lines.push((existing.researchReport.candidates[i].paths.length>1?`계절 대안 ${j+1}(${seasonalLabels[a.season]}·${stateLabels[a.seasonalState]}): `:'제한적 종합: ')+path.summary);
    });
    if(value.weighted){const w=value.weighted[i];lines.push(`별도로 선택한 실험 가중 점수: ${w.score.value}/10, 구간명 ‘${weightedLabels[w.policyClassification]}’. 실제 힘·확률이 아니며, 같은 지지의 대표점수와 근 조건은 연관된 입력을 재사용합니다.`);}
  });
  lines.push('구성상 근의 존재와 실제 생조 작용은 별개입니다. 보류를 중화로 읽지 않으며 기존 M3 전체 해석은 계속 보류합니다.');
  if(!value.weighted)lines.push('가중 점수는 요청하지 않았습니다.');
  heading(4);
  if(!value.m7)lines.push(value.luckSelection.status==='NOT_REQUESTED'?'대운·세운 시간축은 요청하지 않았습니다.':naturalText(report.sections[4].items[0].text));
  else{
    lines.push(naturalText(report.sections[4].items.find(item=>item.id==='luck-selected-policies').text));
    value.m7.luck.candidates.forEach((c,i)=>{
      if(!c.dayun)return;parent(i);
      const text=value.m7.explanation.candidates[i].items;
      for(const item of text.filter(item=>['KO_M7_DAYUN_DIRECTION','KO_M7_DAYUN_START','KO_M7_DAYUN_UNAVAILABLE'].includes(item.templateId)))lines.push(naturalText(item.text));
      if(value.projection)value.projection.explanation.candidates[i].items.filter(item=>['KO_M7_V02_NOMINAL_CALENDAR','KO_M7_V02_NOMINAL_SELECTION'].includes(item.templateId)).forEach(item=>lines.push(naturalText(item.text)));
      const table=report.sections[4].items.find(item=>item.id===c.candidateRef+'#sequence-table');if(table)lines.push(naturalText(table.text));
      if(!value.projection&&c.dayun.sequence)lines.push('위 나이는 모형년 구간입니다. 명목 달력 가산 정책을 선택하지 않아 실제 달력의 교운일이나 조회 시각의 대운은 정하지 않았습니다.');
    });
    for(const item of report.sections[4].items.filter(item=>item.id.startsWith('independent-seyun-')||['dayun-not-requested','seyun-not-requested'].includes(item.id)))lines.push(naturalText(item.text));
  }
  heading(5);lines.push(report.sections[5].items[0].text);
  lines.push('','상세 판단·출처·항목별 근거 참조는 JSON에 보존합니다. 이 참조만으로 외부 진위가 인증되지는 않습니다.');return lines.join('\n')+'\n';
}

export function parseLocalAnalysisReportArgs(args){
  check(args.length>0&&args.length%2===0,'EXPLICIT_ARGUMENTS_REQUIRED');const extra={},rest=[];
  const names=['--report-profile','--experimental-policy','--output','--calendar-projection','--as-of-date','--as-of-time'];
  for(let i=0;i<args.length;i+=2){check(typeof args[i]==='string'&&typeof args[i+1]==='string','ARGUMENTS');if(names.includes(args[i])){check(!Object.hasOwn(extra,args[i]),'ARGUMENTS');extra[args[i]]=args[i+1];}else rest.push(args[i],args[i+1]);}
  const reportProfileId=extra['--report-profile'],experimentalPolicyId=extra['--experimental-policy'];selectedProfile({reportProfileId,experimentalPolicyId});
  check(['json','text'].includes(extra['--output']),'EXPLICIT_OUTPUT_REQUIRED');
  check(!rest.includes('--m2-profile')&&!rest.includes('--boundary-supplement')&&!rest.includes('--boundary-supplement-sha'),'REPORT_DEPENDENCY_POLICY_CONFLICT');
  const luckNames=['--luck-profile','--dayun','--traditional-sex','--dayun-count','--seyun-year','--query-minute'],luckArgs={},chartArgs=[];
  for(let i=0;i<rest.length;i+=2){if(luckNames.includes(rest[i])){check(!Object.hasOwn(luckArgs,rest[i]),'ARGUMENTS');luckArgs[rest[i]]=rest[i+1];}else chartArgs.push(rest[i],rest[i+1]);}
  const hasLuck=Object.keys(luckArgs).length>0,parsed=parseLocalChartArgs(chartArgs),features={};
  if(luckArgs['--dayun']!==undefined){check(luckArgs['--dayun']==='true','DAYUN_ARGUMENTS');features.dayun={...(luckArgs['--traditional-sex']===undefined?{}:{traditionalSex:luckArgs['--traditional-sex']}),...(luckArgs['--dayun-count']===undefined?{}:{count:/^\d+$/.test(luckArgs['--dayun-count'])?Number(luckArgs['--dayun-count']):null})};}
  else check(luckArgs['--traditional-sex']===undefined&&luckArgs['--dayun-count']===undefined,'DAYUN_ARGUMENTS');
  if(luckArgs['--seyun-year']!==undefined||luckArgs['--query-minute']!==undefined){features.seyun={};if(luckArgs['--seyun-year']!==undefined){check(/^\d+$/.test(luckArgs['--seyun-year']),'SEYUN_YEAR_INTEGER_REQUIRED');features.seyun.yearLabel=Number(luckArgs['--seyun-year']);}if(luckArgs['--query-minute']!==undefined)features.seyun.queryMinute=luckArgs['--query-minute'];}
  check((extra['--as-of-date']===undefined)===(extra['--as-of-time']===undefined),'EXPLICIT_AS_OF_DATE_AND_TIME_REQUIRED');
  const luckOptions={...(hasLuck?{luckPolicyId:luckArgs['--luck-profile'],features}:{}),...(extra['--calendar-projection']===undefined?{}:{calendarProjectionPolicyId:extra['--calendar-projection']}),...(extra['--as-of-date']===undefined?{}:{asOfMinute:extra['--as-of-date']+'T'+extra['--as-of-time']})};
  luckSelection(luckOptions);check(parsed.request,'REPORT_BIRTH_INPUT_REQUIRED');
  const {directory,expectedManifestSha256,profileId,request}=parsed;
  return {directory,expectedManifestSha256,profileId,request,reportProfileId,...(experimentalPolicyId===undefined?{}:{experimentalPolicyId}),luckOptions,output:extra['--output']};
}
export async function runLocalAnalysisReportCli(args){
  const options=parseLocalAnalysisReportArgs(args),profile=await loadLocalAnalysisReportProfile(options),value=profile.calculate(options.request,options.luckOptions);
  if(value.status!=='REPORT_ONLY'){process.stderr.write(JSON.stringify({status:value.status,code:'BIRTH_INPUT_NOT_SUPPORTED'})+'\n');process.exitCode=2;}
  else process.stdout.write(options.output==='json'?JSON.stringify(value,null,2)+'\n':renderLocalAnalysisReportText(value));
}
if(process.argv[1]&&import.meta.url===pathToFileURL(resolve(process.argv[1])).href){try{await runLocalAnalysisReportCli(process.argv.slice(2));}catch(error){const known=error instanceof LocalAnalysisReportError||error instanceof LocalChartError||error instanceof LocalM3EvidenceError||error instanceof LocalLuckError||error instanceof LocalLuckProjectionError;process.stderr.write(JSON.stringify({status:'REJECTED',code:known&&/^[A-Z][A-Z0-9_]+$/.test(error.code)?error.code:'REPORT_DATA_OR_INPUT_REJECTED'})+'\n');process.exitCode=1;}}
