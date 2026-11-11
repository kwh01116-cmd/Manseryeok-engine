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

export const M3_LOCAL_PROFILE_ID=M3_EVIDENCE_PROFILE_ID;
export const LOCAL_M3_EVIDENCE_SCHEMA='kasi-local-m3-evidence-v1';
export {M3_EVIDENCE_VERSION};
export class LocalM3EvidenceError extends Error {
  constructor(code){super(code);this.name='LocalM3EvidenceError';this.code=code;}
}
const check=(ok,code)=>{if(!ok)throw new LocalM3EvidenceError(code);};
const evidenceContexts=new WeakMap(), issuedResults=new WeakMap(), sealed=new WeakSet();
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

/** Product path: one birth calculation, one existing M2 derivation, then pure evidence/templates. */
export function createLocalM3EvidenceProfile(chartProfile,{m2ProfileId,m3ProfileId}={}){
  getM2PolicyBundle(m2ProfileId);explicitProfile(m3ProfileId);
  check(typeof chartProfile?.calculate==='function','LOCAL_CHART_PROFILE_REQUIRED');
  return Object.freeze({calculate(request){
    const m1=chartProfile.calculate(request);
    if(m1.status!=='OK')return {
      schemaVersion:LOCAL_M3_EVIDENCE_SCHEMA,status:m1.status,m1,facts:null,evidence:null,explanation:null,
    };
    verifyLocalChartResult(m1,{request});
    const facts=deriveLocalChartFacts(m1,{m2ProfileId,request});
    const evidence=deriveLocalM3Evidence(facts,{m3ProfileId}),explanation=explainM3Evidence(evidence);
    const result=freeze({schemaVersion:LOCAL_M3_EVIDENCE_SCHEMA,status:'EVIDENCE_ONLY',
      provenance:{profile:structuredClone(m1.profile),dataset:structuredClone(m1.dataset),
        policies:structuredClone(m1.policies),m2PolicyBundle:facts.policyBundle,m3Policy:M3_EVIDENCE_POLICY_METADATA,
        birthCalculationFingerprint:fingerprint(m1)},
      m1,facts,evidence,explanation,executionCounts:{birthM1Calls:1,m2Derivations:1},
      validation:{level:'SAME_PROCESS_PINNED_M1_ISSUED_M2_STRUCTURAL_M3_EVIDENCE',
        serializedReferences:'TRACEABILITY_NOT_EXTERNAL_AUTHENTICATION',
        finalStrength:'NOT_IMPLEMENTED',m3FinalInterpretationGate:'BLOCKED_UNCHANGED',
        g0Receipt:null,g1P2Promotion:false,editionVerification:'UNVERIFIED',rightsReview:'UNVERIFIED',predictiveValidity:'NOT_CLAIMED'}});
    issuedResults.set(result,{m1,facts,evidence,explanation});
    return result;
  }});
}
export async function loadLocalM3EvidenceProfile(options){
  return createLocalM3EvidenceProfile(await loadLocalChartProfile(options),options);
}
export function validateLocalM3EvidenceResult(result){
  const receipt=issuedResults.get(result);
  check(receipt&&Object.isFrozen(result)&&result.schemaVersion===LOCAL_M3_EVIDENCE_SCHEMA&&result.status==='EVIDENCE_ONLY','ISSUED_LOCAL_M3_RESULT_REQUIRED');
  for(const key of ['m1','facts','evidence','explanation'])check(result[key]===receipt[key],'M3_RESULT_CONTEXT_CHANGED');
  verifyLocalChartResult(result.m1);validateLocalM3Evidence(result.evidence,{facts:result.facts});
  validateLocalM3Explanation(result.explanation,result.evidence);
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
  return lines.join('\n')+'\n';
}

export function parseLocalM3EvidenceArgs(args){
  check(args.length>0&&args.length%2===0,'EXPLICIT_ARGUMENTS_REQUIRED');
  const base=[];let m3ProfileId;
  for(let i=0;i<args.length;i+=2){
    if(args[i]==='--m3-profile'){
      check(m3ProfileId===undefined&&typeof args[i+1]==='string','ARGUMENTS');m3ProfileId=args[i+1];
    }else base.push(args[i],args[i+1]);
  }
  explicitProfile(m3ProfileId);
  return {...parseLocalExplainArgs(base),m3ProfileId};
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
