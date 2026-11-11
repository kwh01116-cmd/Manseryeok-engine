/** Explicit local M1 -> issued M2 -> structural M3 evidence. No network or predictions. */
import {resolve} from 'node:path';
import {pathToFileURL} from 'node:url';
import {fingerprint} from '../../.kasi-build/schema.js';
import {loadLocalChartProfile, verifyLocalChartResult, LocalChartError} from './local-chart.mjs';
import {deriveLocalChartFacts, validateLocalChartFacts, getM2PolicyBundle} from './local-chart-facts.mjs';
import {parseLocalExplainArgs, LocalExplanationError} from './local-explain.mjs';
import {
  M3_EVIDENCE_PROFILE_ID, M3_EVIDENCE_VERSION, M3_EVIDENCE_POLICY_METADATA,
  deriveM3Evidence, explainM3Evidence, validateM3Evidence, validateM3EvidenceExplanation,
} from '../../dist/m3/structuralEvidenceV1.js';
import {
  M3_SEASONAL_POLICY_ID,M3_SEASONAL_POLICY_METADATA,
  resolveSeasonalState,explainSeasonalState,validateSeasonalState,validateSeasonalStateExplanation,
} from '../../dist/m3/seasonalStateV1.js';

export const M3_LOCAL_PROFILE_ID=M3_EVIDENCE_PROFILE_ID;
export const LOCAL_M3_EVIDENCE_SCHEMA='kasi-local-m3-evidence-v1';
export const LOCAL_M3_SEASONAL_SCHEMA='kasi-local-m3-evidence-seasonal-v1';
export {M3_SEASONAL_POLICY_ID};
export {M3_EVIDENCE_VERSION};
export class LocalM3EvidenceError extends Error {
  constructor(code){super(code);this.name='LocalM3EvidenceError';this.code=code;}
}
const check=(ok,code)=>{if(!ok)throw new LocalM3EvidenceError(code);};
const evidenceContexts=new WeakMap(), seasonalContexts=new WeakMap(),issuedResults=new WeakMap(), sealed=new WeakSet();
function freeze(value){
  if(value&&typeof value==='object'&&!sealed.has(value)){
    Object.values(value).forEach(freeze);Object.freeze(value);sealed.add(value);
  }
  return value;
}
function explicitProfile(id){check(id===M3_LOCAL_PROFILE_ID,'EXPLICIT_SUPPORTED_M3_PROFILE_REQUIRED');}

/** The pure module checks structure. This bridge additionally requires this process's issued M2. */
export function deriveLocalM3Evidence(facts,{m3ProfileId}={}){
  explicitProfile(m3ProfileId);validateLocalChartFacts(facts);
  const evidence=deriveM3Evidence(facts,{policyId:m3ProfileId});
  evidenceContexts.set(evidence,facts);
  return evidence;
}
export function validateLocalM3Evidence(evidence,{facts}={}){
  const issuedFacts=evidenceContexts.get(evidence);
  check(issuedFacts&&(!facts||issuedFacts===facts),'ISSUED_LOCAL_M3_CONTEXT_REQUIRED');
  validateLocalChartFacts(issuedFacts);validateM3Evidence(evidence);
  return true;
}
export function validateLocalM3Explanation(explanation,evidence){
  validateLocalM3Evidence(evidence);
  validateM3EvidenceExplanation(explanation,evidence);
  return true;
}

function seasonalInput(candidate){
  const month=candidate.evidence.find(item=>item.kind==='MONTH_CONTEXT');
  check(month&&month.candidateRef===candidate.candidateRef,'SEASONAL_MONTH_CONTEXT_REQUIRED');
  return {candidateRef:candidate.candidateRef,dayMaster:candidate.dayMaster,
    monthBranch:candidate.monthContext.monthPillar.branch,evidenceRefs:[month.id],
    inputFactRefs:[...month.inputFactRefs],pillarRefs:[candidate.candidateRef+'.day',candidate.candidateRef+'.month'],
    calculationSourceRefs:[...month.calculationSourceRefs],appliedJie:structuredClone(candidate.monthContext.activeSince)};
}
/** Adds one selected judgment to already-issued M3; no M1/M2/structural derivation is repeated. */
export function deriveLocalM3SeasonalJudgments(evidence,{seasonalPolicyId}={}){
  validateLocalM3Evidence(evidence);
  check(seasonalPolicyId===M3_SEASONAL_POLICY_ID,'EXPLICIT_SUPPORTED_SEASONAL_POLICY_REQUIRED');
  const candidates=evidence.candidates.map(candidate=>{
    const judgment=resolveSeasonalState(seasonalInput(candidate),{policyId:seasonalPolicyId});
    return {candidateIndex:candidate.candidateIndex,candidateRef:candidate.candidateRef,
      judgment,explanation:explainSeasonalState(judgment)};
  });
  const value=freeze({schemaVersion:'local-m3-seasonal-judgments-v1',policy:M3_SEASONAL_POLICY_METADATA,candidates,
    validation:{level:'SAME_PROCESS_ISSUED_M3_TO_SELECTED_SEASONAL_POLICY',
      finalStrength:'NOT_IMPLEMENTED',m3FinalInterpretationGate:'BLOCKED_UNCHANGED'}});
  seasonalContexts.set(value,evidence);return value;
}
export function validateLocalM3SeasonalJudgments(value,{evidence}={}){
  const context=seasonalContexts.get(value);
  check(context&&(!evidence||evidence===context)&&Object.isFrozen(value),'ISSUED_LOCAL_SEASONAL_CONTEXT_REQUIRED');
  validateLocalM3Evidence(context);check(value.candidates.length===context.candidates.length,'SEASONAL_CANDIDATE_COUNT_CHANGED');
  for(let i=0;i<value.candidates.length;i++){
    const item=value.candidates[i],candidate=context.candidates[i];
    check(item.candidateRef===candidate.candidateRef&&item.candidateIndex===candidate.candidateIndex,'SEASONAL_CANDIDATE_CONTEXT_CHANGED');
    validateSeasonalState(item.judgment);validateSeasonalStateExplanation(item.explanation,item.judgment);
    check(fingerprint(item.judgment.input)===fingerprint(seasonalInput(candidate)),'SEASONAL_INPUT_CONTEXT_CHANGED');
  }
  return true;
}

/** Product path: one birth calculation, one existing M2 derivation, then pure evidence/templates. */
export function createLocalM3EvidenceProfile(chartProfile,{m2ProfileId,m3ProfileId,seasonalPolicyId}={}){
  getM2PolicyBundle(m2ProfileId);explicitProfile(m3ProfileId);
  if(seasonalPolicyId!==undefined)check(seasonalPolicyId===M3_SEASONAL_POLICY_ID,'EXPLICIT_SUPPORTED_SEASONAL_POLICY_REQUIRED');
  check(typeof chartProfile?.calculate==='function','LOCAL_CHART_PROFILE_REQUIRED');
  return Object.freeze({calculate(request){
    const m1=chartProfile.calculate(request);
    if(m1.status!=='OK')return {
      schemaVersion:LOCAL_M3_EVIDENCE_SCHEMA,status:m1.status,m1,facts:null,evidence:null,explanation:null,
    };
    verifyLocalChartResult(m1,{request});
    const facts=deriveLocalChartFacts(m1,{m2ProfileId,request});
    const evidence=deriveLocalM3Evidence(facts,{m3ProfileId}),explanation=explainM3Evidence(evidence);
    const seasonal=seasonalPolicyId===undefined?undefined:deriveLocalM3SeasonalJudgments(evidence,{seasonalPolicyId});
    const result=freeze({schemaVersion:seasonal?LOCAL_M3_SEASONAL_SCHEMA:LOCAL_M3_EVIDENCE_SCHEMA,status:'EVIDENCE_ONLY',
      provenance:{profile:structuredClone(m1.profile),dataset:structuredClone(m1.dataset),
        policies:structuredClone(m1.policies),m2PolicyBundle:facts.policyBundle,m3Policy:M3_EVIDENCE_POLICY_METADATA,
        birthCalculationFingerprint:fingerprint(m1)},
      m1,facts,evidence,explanation,...(seasonal?{seasonal}:{}),executionCounts:{birthM1Calls:1,m2Derivations:1},
      validation:{level:'SAME_PROCESS_PINNED_M1_ISSUED_M2_STRUCTURAL_M3_EVIDENCE',
        serializedReferences:'TRACEABILITY_NOT_EXTERNAL_AUTHENTICATION',
        finalStrength:'NOT_IMPLEMENTED',m3FinalInterpretationGate:'BLOCKED_UNCHANGED',
        g0Receipt:null,g1P2Promotion:false,editionVerification:'UNVERIFIED',rightsReview:'UNVERIFIED',predictiveValidity:'NOT_CLAIMED'}});
    issuedResults.set(result,{m1,facts,evidence,explanation,seasonal});
    return result;
  }});
}
export async function loadLocalM3EvidenceProfile(options){
  return createLocalM3EvidenceProfile(await loadLocalChartProfile(options),options);
}
export function validateLocalM3EvidenceResult(result){
  const receipt=issuedResults.get(result);
  check(receipt&&Object.isFrozen(result)&&result.schemaVersion===(receipt.seasonal?LOCAL_M3_SEASONAL_SCHEMA:LOCAL_M3_EVIDENCE_SCHEMA)&&result.status==='EVIDENCE_ONLY','ISSUED_LOCAL_M3_RESULT_REQUIRED');
  for(const key of ['m1','facts','evidence','explanation'])check(result[key]===receipt[key],'M3_RESULT_CONTEXT_CHANGED');
  verifyLocalChartResult(result.m1);validateLocalM3Evidence(result.evidence,{facts:result.facts});
  validateLocalM3Explanation(result.explanation,result.evidence);
  check(result.seasonal===receipt.seasonal,'SEASONAL_RESULT_CONTEXT_CHANGED');
  if(receipt.seasonal)validateLocalM3SeasonalJudgments(receipt.seasonal,{evidence:result.evidence});
  return true;
}

export function renderLocalM3EvidenceText(result){
  validateLocalM3EvidenceResult(result);
  const {m1,facts,evidence,explanation}=result;
  const lines=['명식 강약 판단 근거 — M3 Evidence v0.1',
    `양력 환산 ${m1.input.gregorianDate} ${m1.input.time} · ${m1.input.calendar}`,
    `명식 프로필: ${m1.profile.id}`,`데이터셋: ${m1.dataset.id}`,
    `manifest: ${m1.dataset.candidateManifestContentSha256}`,
    `시계 정책: ${m1.policies.clock.id}`,
    `일주 교체: ${m1.policies.dayRollover.id} · 시주 참조: ${m1.policies.hourStemReference.id}`,
    `M2 정책: ${facts.policyBundle.id} · M3 정책: ${M3_LOCAL_PROFILE_ID} (${M3_EVIDENCE_VERSION})`,
    `상태: ${evidence.status} · 최종 신강약: NOT_IMPLEMENTED`,explanation.scopeNote];
  for(const candidate of explanation.candidates){
    lines.push('',`후보 ${candidate.candidateIndex+1} [${candidate.candidateRef}]`);
    for(const item of candidate.items){
      lines.push(item.text,
        '  근거: '+item.evidenceRefs.join(', ')+' | M2 사실: '+item.inputFactRefs.join(', '),
        '  규칙: '+item.ruleRefs.join(', ')+' | 정책: '+item.policyRefs.join(', '),
        '  명리·정의 출처: '+(item.sourceRefs.join(', ')||'기존 구현 참조')+
        ' | 계산 출처: '+item.calculationSourceRefs.join(', '));
    }
  }
  if(result.seasonal){
    const summary=['선택한 월령 계절 분류',`정책: ${result.seasonal.policy.id}`];
    for(const item of result.seasonal.candidates)summary.push(`후보 ${item.candidateIndex+1}: ${item.explanation.text}`);
    summary.push('계절의 전통 분류입니다. 전체 명식의 신강약·득령·사령·통근 효력·길흉은 판단하지 않습니다.');
    lines.unshift(...summary,'','구조적 근거와 상세 참조');
    lines.push('','계절 판단 상세 참조');
    for(const item of result.seasonal.candidates){const j=item.judgment;
      lines.push(`판단: ${j.id} [${j.candidateRef}] · ${j.status}`,
        `정책: ${result.seasonal.policy.id} | 규칙: ${j.ruleRefs.join(', ')}`,
        `M3 근거: ${j.input.evidenceRefs.join(', ')} | M2 사실: ${j.input.inputFactRefs.join(', ')}`,
        `문헌·구현 출처: ${j.sourceRefs.join(', ')} | 계산 출처: ${j.input.calculationSourceRefs.join(', ')}`);
    }
  }
  return lines.join('\n')+'\n';
}

export function parseLocalM3EvidenceArgs(args){
  check(args.length>0&&args.length%2===0,'EXPLICIT_ARGUMENTS_REQUIRED');
  const base=[];let m3ProfileId,seasonalPolicyId;
  for(let i=0;i<args.length;i+=2){
    if(args[i]==='--m3-profile'){
      check(m3ProfileId===undefined&&typeof args[i+1]==='string','ARGUMENTS');m3ProfileId=args[i+1];
    }else if(args[i]==='--seasonal-policy'){
      check(seasonalPolicyId===undefined&&args[i+1]===M3_SEASONAL_POLICY_ID,'EXPLICIT_SUPPORTED_SEASONAL_POLICY_REQUIRED');seasonalPolicyId=args[i+1];
    }else base.push(args[i],args[i+1]);
  }
  explicitProfile(m3ProfileId);
  return {...parseLocalExplainArgs(base),m3ProfileId,...(seasonalPolicyId===undefined?{}:{seasonalPolicyId})};
}
export async function runLocalM3EvidenceCli(args){
  const options=parseLocalM3EvidenceArgs(args),profile=await loadLocalM3EvidenceProfile(options);
  const result=profile.calculate(options.request);
  if(result.status!=='EVIDENCE_ONLY'){
    process.stderr.write(JSON.stringify({status:result.status,code:'BIRTH_INPUT_NOT_SUPPORTED'})+'\n');
    process.exitCode=2;
  }else process.stdout.write(options.output==='json'?JSON.stringify(result,null,2)+'\n':renderLocalM3EvidenceText(result));
}
if(process.argv[1]&&import.meta.url===pathToFileURL(resolve(process.argv[1])).href){
  try{await runLocalM3EvidenceCli(process.argv.slice(2));}
  catch(error){
    const known=error instanceof LocalM3EvidenceError||error instanceof LocalChartError||error instanceof LocalExplanationError;
    const code=known&&/^[A-Z][A-Z0-9_]+$/.test(error.code)?error.code
      :error instanceof RangeError&&/^M3_[A-Z0-9_]+$/.test(error.message)?error.message:'DATA_OR_INPUT_REJECTED';
    process.stderr.write(JSON.stringify({status:'REJECTED',code})+'\n');process.exitCode=1;
  }
}
