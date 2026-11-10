/** Local, deterministic M1 -> existing M2 -> Korean basic explanation. No I/O in the core. */
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { fingerprint } from '../../.kasi-build/schema.js';
import { loadLocalChartProfile, parseLocalChartArgs, verifyLocalChartResult, LocalChartError } from './local-chart.mjs';
import { deriveLocalChartFacts, validateLocalChartFacts, getM2PolicyBundle } from './local-chart-facts.mjs';

export const LOCAL_EXPLANATION_SCHEMA='kasi-local-basic-explanation-v1';
export const KOREAN_TEMPLATE_SCHEMA='ko-chart-basic-templates-v1';
export const KOREAN_TEMPLATE_VERSION='1.0.0';
export class LocalExplanationError extends Error {
  constructor(code){super(code);this.name='LocalExplanationError';this.code=code;}
}
const requireValue=(condition,code)=>{if(!condition)throw new LocalExplanationError(code);};
const roles={year:'연주',month:'월주',day:'일주',hour:'시주'};
const elements={WOOD:'목(木)',FIRE:'화(火)',EARTH:'토(土)',METAL:'금(金)',WATER:'수(水)'};
const polarities={YANG:'양',YIN:'음'};
const gods={'比肩':'비견','劫財':'겁재','食神':'식신','傷官':'상관','偏財':'편재','正財':'정재','七殺':'칠살','正官':'정관','偏印':'편인','正印':'정인'};
const stages={'長生':'장생','沐浴':'목욕','冠帶':'관대','臨官':'임관','帝旺':'제왕','衰':'쇠','病':'병','死':'사','墓':'묘','絕':'절','胎':'태','養':'양'};
const relations={LIUHE:'육합',LIUCHONG:'충',LIUHAI:'해',LIUPO:'파',XING:'형'};
const positions={MAIN_QI:'본기',OTHER:'기타 장간'};
const partials={BIRTH_AND_CENTER:'생지·왕지 구성원',CENTER_AND_TOMB:'왕지·묘지 구성원',BIRTH_AND_TOMB_NOT_HALF_TRINE:'생지·묘지 구성원(반합 분류 제외)',SANHUI_PARTIAL_MEMBERS:'삼회 부분 구성원'};
const label=(map,key)=>{requireValue(Object.hasOwn(map,key),'UNDEFINED_PRESENTATION_LABEL');return map[key];};
const scopeNote='선택한 전통 규칙의 분류를 설명합니다. 신강약·격국·용신·합화·길흉·성격·직업·재물·건강·연애 예측과 대운·세운은 계산하지 않습니다. 단일 후보도 발표 분 비교 정책 안의 결과이며, 원전 판본·이용권·예측 효력이나 외부 정확성 인증을 뜻하지 않습니다.';

// Versioned prose only: no rule tables or calendar/classification computation.
const templates={
  SUMMARY(v){
    const pillars=v.pillars.map(p=>`${label(roles,p.role)} ${p.hanja}(${p.hangul})`).join(' · ');
    const p=v.policies;
    const policy=`일주 교체 ${p.dayRollover?.id??p.dayRollover}, 시주 일간 참조 ${p.hourStemReference?.id??p.hourStemReference}`;
    const boundary=v.confidence==='PUBLISHED_MINUTE_AMBIGUOUS'
      ? `절입의 표시 분에 해당해 두 상관 후보를 각각 제공합니다. 이 후보는 ${v.boundarySide==='BEFORE_PUBLISHED_MINUTE'?'경계 전':v.boundarySide==='AFTER_PUBLISHED_MINUTE'?'경계 후':v.boundarySide} 분류입니다.`
      : '발표 분 비교 정책에서 단일 후보입니다.';
    const active=v.activeSince;
    return `${pillars}. 적용 정책: ${policy}. ${boundary}${active?` 이 후보의 월주에 적용한 절입은 ${active.termNameKo??active.koreanName??active.term} ${active.displayedDateTime}입니다.`:''}${v.pairCount===0?' 현재 정책에서 지지 쌍 관계는 발견되지 않았습니다.':''}${v.triadCount===0?' 삼합·삼회의 두 개 이상 고유 구성원도 발견되지 않았습니다.':''}`;
  },
  DAY_MASTER(v){return `이 후보의 일간은 ${v.stem}입니다. 기존 천간 분류에서 ${label(polarities,v.polarity)}·${label(elements,v.element)}에 해당하며, 십성을 분류할 때 이 일간을 기준으로 삼습니다.`;},
  PILLAR_NATURE(v){return `${label(roles,v.role)}의 천간은 ${v.stem}(${label(polarities,v.stemNature.polarity)}·${label(elements,v.stemNature.element)}), 지지는 ${v.branch}(${label(polarities,v.branchNature.polarity)}·대표 오행 ${label(elements,v.branchNature.principalElement)})입니다.`;},
  VISIBLE_TEN_GOD(v){return `${label(roles,v.role)} 천간 ${v.stem}의 분류는 일간 ${v.dayMaster} 기준 ${label(gods,v.tenGod)}(${v.tenGod})입니다.`;},
  HIDDEN_STEMS(v){
    const members=v.members.map(m=>`${m.stem}(${label(positions,m.position)}, ${label(gods,m.tenGod)})`).join(' · ');
    return `선택한 지장간 정책에서 ${label(roles,v.role)} 지지 ${v.branch}의 장간은 다음과 같습니다: ${members}. 본기를 먼저 표시하는 순서이며, 장간별 십성도 일간 ${v.dayMaster} 기준으로 구분합니다.`;
  },
  TWELVE_GROWTH(v){return `${label(roles,v.role)} 지지 ${v.branch}의 십이운성은 일간 ${v.dayMaster} 기준 ${label(stages,v.stage)}(${v.stage})입니다. 선택한 양순음역·화토 동궁 정책의 단계 이름입니다.`;},
  BRANCH_RELATION(v){
    const pair=`${label(roles,v.leftPillarRole)} ${v.leftBranch}·${label(roles,v.rightPillarRole)} ${v.rightBranch}`;
    const direction=v.orientation==='LEFT_TO_RIGHT'||v.orientation==='RIGHT_TO_LEFT'
      ? ` 방향은 ${label(roles,v.fromPillarRole)}→${label(roles,v.toPillarRole)}입니다.`
      :v.orientation==='SELF_BETWEEN_OCCURRENCES'?' 서로 다른 기둥에 반복된 지지를 비교한 자형 구성원입니다.'
        :v.orientation==='BIDIRECTIONAL'?' 현재 규칙에서 양방향으로 분류합니다.':'';
    return `${pair} 조합은 현재 정책의 ${label(relations,v.kind)} 분류에 해당합니다.${direction}`;
  },
  TRIAD_MEMBERSHIP(v){
    const family=v.family==='SANHE'?'삼합':v.family==='SANHUI'?'삼회':null;
    requireValue(family,'UNDEFINED_PRESENTATION_LABEL');
    const present=v.members.filter(m=>m.pillarIndices.length).map(m=>`${m.branch}(${m.pillarRoles.map(r=>label(roles,r)).join('·')})`).join(' · ');
    const classification=v.status==='THREE_DISTINCT_MEMBERS'?'서로 다른 세 구성원이 모두 있습니다':`서로 다른 두 구성원이 있습니다: ${label(partials,v.partialKind)}`;
    return `${label(elements,v.namedElement)} ${family}의 관측 구성원: ${present}. ${classification}.${v.missingBranches.length?` 없는 구성원은 ${v.missingBranches.join('·')}입니다.`:''} 구성원 존재만 분류하며 합화나 국의 성립을 판정하지 않습니다.`;
  },
};

function buildExplanation(facts){
  validateLocalChartFacts(facts);
  return {
    schemaVersion:KOREAN_TEMPLATE_SCHEMA,locale:'ko-KR',title:'명식 기초 분석/설명',templateVersion:KOREAN_TEMPLATE_VERSION,scopeNote,
    candidates:facts.candidates.map(candidate=>({
      candidateRef:candidate.id,candidateIndex:candidate.candidateIndex,
      items:candidate.facts.map((fact,index)=>{
        requireValue(Object.hasOwn(templates,fact.kind),'UNDEFINED_EXPLANATION_TEMPLATE');
        return {id:`${candidate.id}#explanation[${index}]`,templateId:`KO_BASIC_${fact.kind}`,templateVersion:KOREAN_TEMPLATE_VERSION,candidateRef:candidate.id,factRefs:[fact.id],ruleRefs:[...fact.ruleRefs],policyRefs:[...fact.policyRefs],sourceRefs:[...fact.sourceRefs],text:templates[fact.kind](fact.value)};
      }),
    })),
  };
}

/** Consumes only a live, validated facts envelope; never resolves birth data. */
export function explainChartFacts(facts){return buildExplanation(facts);}

/** Serialized explanations can be checked against live facts; they do not authenticate facts. */
export function validateExplanation(explanation,facts){
  validateLocalChartFacts(facts);
  requireValue(explanation?.schemaVersion===KOREAN_TEMPLATE_SCHEMA && explanation.templateVersion===KOREAN_TEMPLATE_VERSION,'EXPLANATION_SCHEMA_OR_VERSION');
  requireValue(Array.isArray(explanation.candidates)&&explanation.candidates.length===facts.candidates.length,'EXPLANATION_CANDIDATE_SET');
  const rules=new Set(facts.rules.map(r=>r.id)),sources=new Set(facts.sources.map(s=>s.id));
  const policies=new Set([facts.policyBundle.id,...Object.values(facts.policyBundle.policies).map(p=>p.id)]);
  for(let i=0;i<facts.candidates.length;i++){
    const candidate=facts.candidates[i],view=explanation.candidates[i];
    requireValue(view?.candidateRef===candidate.id && view.candidateIndex===candidate.candidateIndex && Array.isArray(view.items),'EXPLANATION_CANDIDATE_REFERENCE');
    const factIds=new Set(candidate.facts.map(f=>f.id));
    for(const item of view.items){
      requireValue(item.candidateRef===candidate.id && Array.isArray(item.factRefs) && item.factRefs.length>0 && item.factRefs.every(ref=>factIds.has(ref)),'EXPLANATION_FACT_REFERENCE');
      requireValue(Array.isArray(item.ruleRefs)&&item.ruleRefs.every(ref=>rules.has(ref)),'EXPLANATION_RULE_REFERENCE');
      requireValue(Array.isArray(item.sourceRefs)&&item.sourceRefs.every(ref=>sources.has(ref)),'EXPLANATION_SOURCE_REFERENCE');
      requireValue(Array.isArray(item.policyRefs)&&item.policyRefs.every(ref=>policies.has(ref)),'EXPLANATION_POLICY_REFERENCE');
      requireValue(item.templateVersion===KOREAN_TEMPLATE_VERSION && Object.keys(templates).some(kind=>item.templateId===`KO_BASIC_${kind}`),'UNDEFINED_EXPLANATION_TEMPLATE');
    }
  }
  requireValue(fingerprint(explanation)===fingerprint(buildExplanation(facts)),'EXPLANATION_CONTENT_OR_REFERENCE_CHANGED');
  return explanation;
}

/** One M1 invocation per product request; reference calculations belong only in tests. */
export function createLocalExplanationProfile(chartProfile,{m2ProfileId}={}){
  getM2PolicyBundle(m2ProfileId);
  requireValue(typeof chartProfile?.calculate==='function','LOCAL_CHART_PROFILE_REQUIRED');
  return Object.freeze({calculate(request){
    const m1=chartProfile.calculate(request);
    if(m1.status!=='OK')return {schemaVersion:LOCAL_EXPLANATION_SCHEMA,status:m1.status,m1,facts:null,explanation:null};
    const facts=deriveLocalChartFacts(m1,{m2ProfileId,request}),explanation=explainChartFacts(facts);
    return {schemaVersion:LOCAL_EXPLANATION_SCHEMA,status:'OK',m1,facts,explanation};
  }});
}

export function renderExplanationText(result){
  requireValue(result?.schemaVersion===LOCAL_EXPLANATION_SCHEMA && result.status==='OK','EXPLANATION_NOT_READY');
  verifyLocalChartResult(result.m1);validateExplanation(result.explanation,result.facts);
  const {m1,facts,explanation}=result;
  requireValue(fingerprint(facts.calculation)===fingerprint(m1),'EXPLANATION_CALCULATION_MISMATCH');
  const lines=[explanation.title,`양력 환산 ${m1.input.gregorianDate} ${m1.input.time} · ${m1.input.calendar}`,`명식 프로필: ${m1.profile.id}`,`데이터셋: ${m1.dataset.id}`,`manifest: ${m1.dataset.candidateManifestContentSha256}`,`시계 정책: ${m1.policies.clock.id}`,`M2 정책 묶음: ${facts.policyBundle.id}`,
    ...Object.entries(facts.policyBundle.policies).map(([name,policy])=>`${name}: ${policy.id} (원래 규칙 버전 ${policy.runtimeVersion??'별도 필드 없음'})`),explanation.scopeNote];
  for(const candidate of explanation.candidates){
    lines.push('',`후보 ${candidate.candidateIndex+1} [${candidate.candidateRef}]`);
    for(const item of candidate.items){
      const refs=[`근거: ${item.factRefs.join(', ')}`,`규칙: ${item.ruleRefs.join(', ')}`];
      if(item.policyRefs.length)refs.push(`정책: ${item.policyRefs.join(', ')}`);
      if(item.sourceRefs.length)refs.push(`출처: ${item.sourceRefs.join(', ')}`);
      lines.push(item.text,'  '+refs.join(' | '));
    }
  }
  return lines.join('\n')+'\n';
}

export function parseLocalExplainArgs(args){
  requireValue(args.length>0 && args.length%2===0,'EXPLICIT_ARGUMENTS_REQUIRED');
  const base=[],extra={};
  for(let i=0;i<args.length;i+=2){
    const name=args[i];
    if(['--m2-profile','--output'].includes(name)){
      requireValue(!Object.hasOwn(extra,name)&&typeof args[i+1]==='string','ARGUMENTS');extra[name]=args[i+1];
    }else base.push(name,args[i+1]);
  }
  requireValue(typeof extra['--m2-profile']==='string','EXPLICIT_M2_PROFILE_REQUIRED');
  getM2PolicyBundle(extra['--m2-profile']);
  requireValue(['json','text'].includes(extra['--output']),'EXPLICIT_OUTPUT_REQUIRED');
  return {...parseLocalChartArgs(base),m2ProfileId:extra['--m2-profile'],output:extra['--output']};
}

if(process.argv[1]&&import.meta.url===pathToFileURL(resolve(process.argv[1])).href){
  try{
    const options=parseLocalExplainArgs(process.argv.slice(2)),profile=await loadLocalChartProfile(options);
    const result=createLocalExplanationProfile(profile,options).calculate(options.request);
    if(result.status!=='OK'){
      process.stderr.write(JSON.stringify({status:result.status,code:'BIRTH_INPUT_NOT_SUPPORTED'})+'\n');process.exitCode=2;
    }else process.stdout.write(options.output==='json'?JSON.stringify(result,null,2)+'\n':renderExplanationText(result));
  }catch(error){
    process.stderr.write(JSON.stringify({status:'REJECTED',code:error instanceof LocalChartError||error instanceof LocalExplanationError?error.code:'DATA_OR_INPUT_REJECTED'})+'\n');process.exitCode=1;
  }
}
