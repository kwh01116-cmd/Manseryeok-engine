/** Explicit local M1 -> issued M2 -> structural M3 evidence. No network or predictions. */
import {resolve} from 'node:path';
import {pathToFileURL} from 'node:url';
import {fingerprint} from '../../.kasi-build/schema.js';
import {loadLocalChartProfile, verifyLocalChartResult, getLocalChartEventContext, verifyLocalChartEventContext, LocalChartError} from './local-chart.mjs';
import {deriveLocalChartFacts, validateLocalChartFacts, getM2PolicyBundle, M2_LOCAL_PROFILE_ID} from './local-chart-facts.mjs';
import {parseLocalExplainArgs, LocalExplanationError} from './local-explain.mjs';
import {
  M3_EVIDENCE_PROFILE_ID, M3_EVIDENCE_VERSION, M3_EVIDENCE_POLICY_METADATA,
  deriveM3Evidence, explainM3Evidence, validateM3Evidence, validateM3EvidenceExplanation,
} from '../../dist/m3/structuralEvidenceV1.js';
import {
  M3_SEASONAL_POLICY_ID,M3_SEASONAL_POLICY_METADATA,
  resolveSeasonalState,explainSeasonalState,validateSeasonalState,validateSeasonalStateExplanation,
} from '../../dist/m3/seasonalStateV1.js';
import {
  M3_SEASONAL_SILI_POLICY_ID, M3_SEASONAL_SILI_POLICY_METADATA,
  resolveSeasonalSiliState,explainSeasonalSiliState,validateSeasonalSiliState,validateSeasonalSiliStateExplanation,
} from '../../dist/m3/seasonalStateV2.js';
import {MONTH_BOUNDARY_JIE} from '../../dist/calendar/monthPillar.js';
import {
  M3_ROOT_POLICY_ID,M3_ROOT_POLICY_METADATA,deriveM3RootPresence,explainM3RootPresence,
  validateM3RootPresence,validateM3RootPresenceExplanation,
} from '../../dist/m3/rootPresenceV1.js';
import {
  M3_SUPPORT_POLICY_ID,M3_SUPPORT_POLICY_METADATA,deriveM3ResourceSupport,explainM3ResourceSupport,
  validateM3ResourceSupport,validateM3ResourceSupportExplanation,
} from '../../dist/m3/resourceSupportV1.js';
import {
  M3_SYNTHESIS_PROFILE_ID,M3_SYNTHESIS_METADATA,deriveM3LimitedSynthesis,explainM3LimitedSynthesis,
  validateM3LimitedSynthesis,validateM3LimitedSynthesisExplanation,renderM3LimitedSynthesisText,
} from '../../dist/m3/limitedSynthesisV1.js';
import {
  M4_PATTERN_PROFILE_ID,M4_PATTERN_METADATA,deriveM4ZhengguanStructure,validateM4ZhengguanStructure,
  explainM4ZhengguanStructure,validateM4ZhengguanExplanation,renderM4ZhengguanText,
} from '../../dist/m4/zhengguanStructureV1.js';

export const M3_LOCAL_PROFILE_ID=M3_EVIDENCE_PROFILE_ID;
export const LOCAL_M3_EVIDENCE_SCHEMA='kasi-local-m3-evidence-v1';
export const LOCAL_M3_SEASONAL_SCHEMA='kasi-local-m3-evidence-seasonal-v1';
export const LOCAL_M3_SEASONAL_SILI_SCHEMA='kasi-local-m3-evidence-seasonal-v2';
export const LOCAL_M3_ROOT_SCHEMA='kasi-local-m3-evidence-root-v1';
export const LOCAL_M3_SEASONAL_ROOT_SCHEMA='kasi-local-m3-evidence-seasonal-root-v1';
export const LOCAL_M3_SUPPORT_SCHEMA='kasi-local-m3-evidence-support-v1';
export const LOCAL_M3_SEASONAL_SUPPORT_SCHEMA='kasi-local-m3-evidence-seasonal-support-v1';
export const LOCAL_M3_SYNTHESIS_SCHEMA='kasi-local-m3-evidence-synthesis-v1';
export const LOCAL_M4_PATTERN_SCHEMA='kasi-local-m3-evidence-pattern-v1';
export {M3_SEASONAL_POLICY_ID,M3_SEASONAL_SILI_POLICY_ID,M3_ROOT_POLICY_ID,M3_SUPPORT_POLICY_ID};
export {M3_SYNTHESIS_PROFILE_ID,M3_SYNTHESIS_METADATA};
export {M4_PATTERN_PROFILE_ID,M4_PATTERN_METADATA};
export {M3_EVIDENCE_VERSION};
export class LocalM3EvidenceError extends Error {
  constructor(code){super(code);this.name='LocalM3EvidenceError';this.code=code;}
}
const check=(ok,code)=>{if(!ok)throw new LocalM3EvidenceError(code);};
const evidenceContexts=new WeakMap(), seasonalContexts=new WeakMap(),rootContexts=new WeakMap(),supportContexts=new WeakMap(),synthesisContexts=new WeakMap(),patternContexts=new WeakMap(),evidenceExecutions=new WeakMap(),issuedResults=new WeakMap(), sealed=new WeakSet();
function freeze(value){
  if(value&&typeof value==='object'&&!sealed.has(value)){
    Object.values(value).forEach(freeze);Object.freeze(value);sealed.add(value);
  }
  return value;
}
function explicitProfile(id){check(id===M3_LOCAL_PROFILE_ID,'EXPLICIT_SUPPORTED_M3_PROFILE_REQUIRED');}
function patternPolicies(patternProfileId,overrides={}){
  check(patternProfileId===M4_PATTERN_PROFILE_ID,'EXPLICIT_SUPPORTED_PATTERN_PROFILE_REQUIRED');
  const required={m2ProfileId:M2_LOCAL_PROFILE_ID,m3ProfileId:M3_LOCAL_PROFILE_ID};
  for(const [key,value]of Object.entries(required))check(overrides[key]===undefined||overrides[key]===value,'PATTERN_POLICY_CONFLICT');
  return required;
}
function synthesisPolicies(synthesisProfileId,overrides={}){
  check(synthesisProfileId===M3_SYNTHESIS_PROFILE_ID,'EXPLICIT_SUPPORTED_SYNTHESIS_PROFILE_REQUIRED');
  const required={m2ProfileId:M2_LOCAL_PROFILE_ID,m3ProfileId:M3_LOCAL_PROFILE_ID,
    seasonalPolicyId:M3_SEASONAL_SILI_POLICY_ID,rootPolicyId:M3_ROOT_POLICY_ID,supportPolicyId:M3_SUPPORT_POLICY_ID};
  for(const [key,value]of Object.entries(required))check(overrides[key]===undefined||overrides[key]===value,'SYNTHESIS_POLICY_CONFLICT');
  return required;
}

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
const isSeasonalPolicy=id=>id===M3_SEASONAL_POLICY_ID||id===M3_SEASONAL_SILI_POLICY_ID;
const earthMonthSili={辰:'LIXIA',未:'LIQIU',戌:'LIDONG',丑:'LICHUN'};
const sideCondition={DEFINITE:'BETWEEN_PUBLISHED_BOUNDARIES',BEFORE_PUBLISHED_MINUTE:'BEFORE_PUBLISHED_BOUNDARY',AFTER_PUBLISHED_MINUTE:'AFTER_PUBLISHED_BOUNDARY'};
/** One read-only index per selected profile. The already-pinned loader authenticates the local context. */
function prepareSeasonalContext(profile){
  const context=getLocalChartEventContext(profile);verifyLocalChartEventContext(context);
  const byTermYear=new Map(),bySource=new Map(context.evidence.map(record=>[record.id,record]));
  const jie=context.events.filter(event=>MONTH_BOUNDARY_JIE.includes(event.term));
  for(const event of jie){
    const key=event.displayedDateTime.slice(0,4)+':'+event.term;
    check(!byTermYear.has(key),'SEASONAL_DUPLICATE_EVENT');byTermYear.set(key,event);
    check(event.sourceIds.every(id=>bySource.has(id)),'SEASONAL_EVENT_SOURCE_MISSING');
  }
  return {context,byTermYear,bySource,jie};
}
function siliInput(candidate,execution){
  check(execution,'SEASONAL_ISSUED_BIRTH_AND_EVENT_CONTEXT_REQUIRED');
  const {m1,prepared}=execution,base=seasonalInput(candidate),index=candidate.candidateIndex;
  const trace=m1.chart.monthBoundaryTrace.candidateContexts[index];
  check(trace&&trace.monthBranch===base.monthBranch&&fingerprint({...trace.activeSince,koreanName:base.appliedJie.koreanName})===fingerprint(base.appliedJie),'SEASONAL_PARENT_MONTH_CONTEXT_MISMATCH');
  check(sideCondition[trace.boundarySide],'SEASONAL_PARENT_CONDITION_REQUIRED');
  verifyLocalChartEventContext(prepared.context,{calculation:m1});
  const term=earthMonthSili[base.monthBranch];let nextSili=null;
  if(term){
    const start=prepared.byTermYear.get(base.appliedJie.displayedDateTime.slice(0,4)+':'+base.appliedJie.term);
    check(start&&fingerprint(start)===fingerprint(trace.activeSince),'SEASONAL_APPLIED_EVENT_CONTEXT_MISMATCH');
    const expectedKey=start.displayedDateTime.slice(0,4)+':'+term,target=prepared.byTermYear.get(expectedKey);
    // Check the immediately adjacent Jie, never substitute a later same-name event or a mid-Qi.
    const neighbor=prepared.jie[prepared.jie.indexOf(start)+1];
    if(target){check(neighbor===target,'SEASONAL_REQUIRED_NEXT_SILI_NOT_ADJACENT');nextSili=structuredClone(target);}
    // A missing exact event stays null/NEEDS_DATA; no later event is used as a substitute.
  }
  return {base,birthDateTime:m1.input.gregorianDate+'T'+m1.input.time,monthCondition:sideCondition[trace.boundarySide],nextSili};
}
/** Adds one selected judgment to already-issued M3; no M1/M2/structural derivation is repeated. */
export function deriveLocalM3SeasonalJudgments(evidence,{seasonalPolicyId}={}){
  validateLocalM3Evidence(evidence);
  check(isSeasonalPolicy(seasonalPolicyId),'EXPLICIT_SUPPORTED_SEASONAL_POLICY_REQUIRED');
  const sili=seasonalPolicyId===M3_SEASONAL_SILI_POLICY_ID,execution=sili?evidenceExecutions.get(evidence):null;
  if(sili)check(execution,'SEASONAL_ISSUED_BIRTH_AND_EVENT_CONTEXT_REQUIRED');
  const candidates=evidence.candidates.map(candidate=>{
    const judgment=sili?resolveSeasonalSiliState(siliInput(candidate,execution),{policyId:seasonalPolicyId}):resolveSeasonalState(seasonalInput(candidate),{policyId:seasonalPolicyId});
    return {candidateIndex:candidate.candidateIndex,candidateRef:candidate.candidateRef,
      judgment,explanation:sili?explainSeasonalSiliState(judgment):explainSeasonalState(judgment)};
  });
  const extraSources=sili?[...new Set(candidates.flatMap(item=>item.judgment.input.nextSili?.sourceIds??[]))].map(id=>execution.prepared.bySource.get(id)):null;
  const value=freeze({schemaVersion:sili?'local-m3-seasonal-judgments-v2':'local-m3-seasonal-judgments-v1',policy:sili?M3_SEASONAL_SILI_POLICY_METADATA:M3_SEASONAL_POLICY_METADATA,candidates,
    ...(sili?{calculationSources:extraSources}:{}),
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
    if(value.policy.id===M3_SEASONAL_SILI_POLICY_ID){
      validateSeasonalSiliState(item.judgment);validateSeasonalSiliStateExplanation(item.explanation,item.judgment);
      check(fingerprint(item.judgment.input)===fingerprint(siliInput(candidate,evidenceExecutions.get(context))),'SEASONAL_INPUT_CONTEXT_CHANGED');
    }else{
      validateSeasonalState(item.judgment);validateSeasonalStateExplanation(item.explanation,item.judgment);
      check(fingerprint(item.judgment.input)===fingerprint(seasonalInput(candidate)),'SEASONAL_INPUT_CONTEXT_CHANGED');
    }
  }
  return true;
}

/** The explicit presence rule consumes the same issued facts/evidence, without another birth calculation. */
export function deriveLocalM3RootJudgments(evidence,{rootPolicyId}={}){
  validateLocalM3Evidence(evidence);
  check(rootPolicyId===M3_ROOT_POLICY_ID,'EXPLICIT_SUPPORTED_ROOT_POLICY_REQUIRED');
  const facts=evidenceContexts.get(evidence);
  const root=deriveM3RootPresence(evidence,{policyId:rootPolicyId,m2Facts:facts});
  rootContexts.set(root,{evidence,facts});return root;
}
export function validateLocalM3RootJudgments(root,{evidence}={}){
  const context=rootContexts.get(root);
  check(context&&(!evidence||evidence===context.evidence),'ISSUED_LOCAL_ROOT_CONTEXT_REQUIRED');
  validateLocalM3Evidence(context.evidence,{facts:context.facts});
  validateM3RootPresence(root,{evidence:context.evidence,m2Facts:context.facts});
  return true;
}
/** One selected restriction consumes the already-issued root and its original M3/M2 context. */
export function deriveLocalM3ResourceSupport(evidence,{supportPolicyId,root}={}){
  validateLocalM3Evidence(evidence);validateLocalM3RootJudgments(root,{evidence});
  check(supportPolicyId===M3_SUPPORT_POLICY_ID,'EXPLICIT_SUPPORTED_SUPPORT_POLICY_REQUIRED');
  const facts=evidenceContexts.get(evidence);
  const support=deriveM3ResourceSupport(evidence,{policyId:supportPolicyId,root,m2Facts:facts});
  supportContexts.set(support,{evidence,root,facts});return support;
}
export function validateLocalM3ResourceSupport(support,{evidence,root}={}){
  const context=supportContexts.get(support);
  check(context&&(!evidence||evidence===context.evidence)&&(!root||root===context.root),'ISSUED_LOCAL_SUPPORT_CONTEXT_REQUIRED');
  validateLocalM3Evidence(context.evidence,{facts:context.facts});
  validateLocalM3RootJudgments(context.root,{evidence:context.evidence});
  validateM3ResourceSupport(support,{evidence:context.evidence,root:context.root,m2Facts:context.facts});
  return true;
}
/** The opt-in research profile consumes one original execution and the already-issued selected judgments. */
export function deriveLocalM3LimitedSynthesis(evidence,{synthesisProfileId,root,support,seasonal}={}){
  synthesisPolicies(synthesisProfileId);
  validateLocalM3Evidence(evidence);validateLocalM3RootJudgments(root,{evidence});
  validateLocalM3ResourceSupport(support,{evidence,root});validateLocalM3SeasonalJudgments(seasonal,{evidence});
  check(seasonal.policy.id===M3_SEASONAL_SILI_POLICY_ID,'SYNTHESIS_SELECTED_SEASONAL_DEPENDENCY_REQUIRED');
  const facts=evidenceContexts.get(evidence),seasonalJudgments=seasonal.candidates.map(item=>item.judgment),seasonalCalculationSources=seasonal.calculationSources??[];
  const value=deriveM3LimitedSynthesis(evidence,{profileId:synthesisProfileId,root,support,m2Facts:facts,seasonalJudgments,seasonalCalculationSources});
  synthesisContexts.set(value,{evidence,root,support,seasonal,facts,seasonalJudgments,seasonalCalculationSources});return value;
}
export function validateLocalM3LimitedSynthesis(value,{evidence,root,support,seasonal}={}){
  const context=synthesisContexts.get(value);
  check(context&&(!evidence||evidence===context.evidence)&&(!root||root===context.root)&&(!support||support===context.support)&&(!seasonal||seasonal===context.seasonal),'ISSUED_LOCAL_SYNTHESIS_CONTEXT_REQUIRED');
  validateLocalM3Evidence(context.evidence,{facts:context.facts});validateLocalM3RootJudgments(context.root,{evidence:context.evidence});
  validateLocalM3ResourceSupport(context.support,{evidence:context.evidence,root:context.root});
  validateLocalM3SeasonalJudgments(context.seasonal,{evidence:context.evidence});
  validateM3LimitedSynthesis(value,{evidence:context.evidence,root:context.root,support:context.support,m2Facts:context.facts,seasonalJudgments:context.seasonalJudgments,seasonalCalculationSources:context.seasonalCalculationSources});
  return true;
}
/** The M4 bridge consumes the same original M2/M3 execution, without another chart calculation. */
export function deriveLocalM4Pattern(evidence,{patternProfileId}={}){
  patternPolicies(patternProfileId);validateLocalM3Evidence(evidence);
  const facts=evidenceContexts.get(evidence);
  const value=deriveM4ZhengguanStructure(evidence,{profileId:patternProfileId,m2Facts:facts});
  patternContexts.set(value,{evidence,facts});return value;
}
export function validateLocalM4Pattern(value,{evidence,facts}={}){
  const context=patternContexts.get(value);
  check(context&&(!evidence||evidence===context.evidence)&&(!facts||facts===context.facts),'ISSUED_LOCAL_PATTERN_CONTEXT_REQUIRED');
  validateLocalM3Evidence(context.evidence,{facts:context.facts});
  validateM4ZhengguanStructure(value,{evidence:context.evidence,m2Facts:context.facts});return true;
}
function resultSchema(seasonal,root,support,researchSynthesis,patternAnalysis){
  if(patternAnalysis)return LOCAL_M4_PATTERN_SCHEMA;
  if(researchSynthesis)return LOCAL_M3_SYNTHESIS_SCHEMA;
  if(support)return seasonal?LOCAL_M3_SEASONAL_SUPPORT_SCHEMA:LOCAL_M3_SUPPORT_SCHEMA;
  return root?(seasonal?LOCAL_M3_SEASONAL_ROOT_SCHEMA:LOCAL_M3_ROOT_SCHEMA)
    :seasonal?.policy.id===M3_SEASONAL_SILI_POLICY_ID?LOCAL_M3_SEASONAL_SILI_SCHEMA
    :seasonal?LOCAL_M3_SEASONAL_SCHEMA:LOCAL_M3_EVIDENCE_SCHEMA;
}

/** Product path: one birth calculation, one existing M2 derivation, then pure evidence/templates. */
export function createLocalM3EvidenceProfile(chartProfile,{m2ProfileId,m3ProfileId,seasonalPolicyId,rootPolicyId,supportPolicyId,synthesisProfileId,patternProfileId,contextProfile=chartProfile}={}){
  if(patternProfileId!==undefined)({m2ProfileId,m3ProfileId}=patternPolicies(patternProfileId,{m2ProfileId,m3ProfileId}));
  if(synthesisProfileId!==undefined)({m2ProfileId,m3ProfileId,seasonalPolicyId,rootPolicyId,supportPolicyId}=synthesisPolicies(synthesisProfileId,{m2ProfileId,m3ProfileId,seasonalPolicyId,rootPolicyId,supportPolicyId}));
  getM2PolicyBundle(m2ProfileId);explicitProfile(m3ProfileId);
  if(seasonalPolicyId!==undefined)check(isSeasonalPolicy(seasonalPolicyId),'EXPLICIT_SUPPORTED_SEASONAL_POLICY_REQUIRED');
  if(rootPolicyId!==undefined)check(rootPolicyId===M3_ROOT_POLICY_ID,'EXPLICIT_SUPPORTED_ROOT_POLICY_REQUIRED');
  if(supportPolicyId!==undefined){
    check(supportPolicyId===M3_SUPPORT_POLICY_ID,'EXPLICIT_SUPPORTED_SUPPORT_POLICY_REQUIRED');
    check(rootPolicyId===M3_ROOT_POLICY_ID,'EXPLICIT_SUPPORT_ROOT_POLICY_REQUIRED');
  }
  check(typeof chartProfile?.calculate==='function','LOCAL_CHART_PROFILE_REQUIRED');
  const prepared=seasonalPolicyId===M3_SEASONAL_SILI_POLICY_ID?prepareSeasonalContext(contextProfile):null;
  return Object.freeze({calculate(request){
    const m1=chartProfile.calculate(request);
    if(m1.status!=='OK')return {
      schemaVersion:LOCAL_M3_EVIDENCE_SCHEMA,status:m1.status,m1,facts:null,evidence:null,explanation:null,
    };
    verifyLocalChartResult(m1,{request});
    const facts=deriveLocalChartFacts(m1,{m2ProfileId,request});
    const evidence=deriveLocalM3Evidence(facts,{m3ProfileId}),explanation=explainM3Evidence(evidence);
    if(prepared)evidenceExecutions.set(evidence,{m1,prepared});
    const seasonal=seasonalPolicyId===undefined?undefined:deriveLocalM3SeasonalJudgments(evidence,{seasonalPolicyId});
    const root=rootPolicyId===undefined?undefined:deriveLocalM3RootJudgments(evidence,{rootPolicyId});
    const rootExplanation=root?explainM3RootPresence(root):undefined;
    const support=supportPolicyId===undefined?undefined:deriveLocalM3ResourceSupport(evidence,{supportPolicyId,root});
    const supportExplanation=support?explainM3ResourceSupport(support):undefined;
    const researchSynthesis=synthesisProfileId===undefined?undefined:deriveLocalM3LimitedSynthesis(evidence,{synthesisProfileId,root,support,seasonal});
    const researchReport=researchSynthesis?explainM3LimitedSynthesis(researchSynthesis):undefined;
    const patternAnalysis=patternProfileId===undefined?undefined:deriveLocalM4Pattern(evidence,{patternProfileId});
    const patternReport=patternAnalysis?explainM4ZhengguanStructure(patternAnalysis):undefined;
    const result=freeze({schemaVersion:resultSchema(seasonal,root,support,researchSynthesis,patternAnalysis),status:'EVIDENCE_ONLY',
      provenance:{profile:structuredClone(m1.profile),dataset:structuredClone(m1.dataset),
        policies:structuredClone(m1.policies),m2PolicyBundle:facts.policyBundle,m3Policy:M3_EVIDENCE_POLICY_METADATA,
        birthCalculationFingerprint:fingerprint(m1),...(patternAnalysis?{m4Policy:M4_PATTERN_METADATA}:{})},
      m1,facts,evidence,explanation,...(seasonal?{seasonal}:{}),...(root?{root,rootExplanation}:{}),...(support?{support,supportExplanation}:{}),...(researchSynthesis?{researchSynthesis,researchReport}:{}),...(patternAnalysis?{patternAnalysis,patternReport}:{}),executionCounts:{birthM1Calls:1,m2Derivations:1,...(patternAnalysis?{m4Derivations:1}:{})},
      validation:{level:'SAME_PROCESS_PINNED_M1_ISSUED_M2_STRUCTURAL_M3_EVIDENCE',
        serializedReferences:'TRACEABILITY_NOT_EXTERNAL_AUTHENTICATION',
        finalStrength:'NOT_IMPLEMENTED',m3FinalInterpretationGate:'BLOCKED_UNCHANGED',
        g0Receipt:null,g1P2Promotion:false,editionVerification:'UNVERIFIED',rightsReview:'UNVERIFIED',predictiveValidity:'NOT_CLAIMED'}});
    issuedResults.set(result,{m1,facts,evidence,explanation,seasonal,root,rootExplanation,support,supportExplanation,researchSynthesis,researchReport,patternAnalysis,patternReport});
    return result;
  }});
}
export async function loadLocalM3EvidenceProfile(options){
  return createLocalM3EvidenceProfile(await loadLocalChartProfile(options),options);
}
export function validateLocalM3EvidenceResult(result){
  const receipt=issuedResults.get(result);
  check(receipt&&Object.isFrozen(result)&&result.schemaVersion===resultSchema(receipt.seasonal,receipt.root,receipt.support,receipt.researchSynthesis,receipt.patternAnalysis)&&result.status==='EVIDENCE_ONLY','ISSUED_LOCAL_M3_RESULT_REQUIRED');
  for(const key of ['m1','facts','evidence','explanation'])check(result[key]===receipt[key],'M3_RESULT_CONTEXT_CHANGED');
  verifyLocalChartResult(result.m1);validateLocalM3Evidence(result.evidence,{facts:result.facts});
  validateLocalM3Explanation(result.explanation,result.evidence);
  check(result.seasonal===receipt.seasonal,'SEASONAL_RESULT_CONTEXT_CHANGED');
  if(receipt.seasonal)validateLocalM3SeasonalJudgments(receipt.seasonal,{evidence:result.evidence});
  check(result.root===receipt.root&&result.rootExplanation===receipt.rootExplanation,'ROOT_RESULT_CONTEXT_CHANGED');
  if(receipt.root){
    validateLocalM3RootJudgments(receipt.root,{evidence:result.evidence});
    validateM3RootPresenceExplanation(receipt.rootExplanation,receipt.root);
  }
  check(result.support===receipt.support&&result.supportExplanation===receipt.supportExplanation,'SUPPORT_RESULT_CONTEXT_CHANGED');
  if(receipt.support){
    validateLocalM3ResourceSupport(receipt.support,{evidence:result.evidence,root:result.root});
    validateM3ResourceSupportExplanation(receipt.supportExplanation,receipt.support);
  }
  check(result.researchSynthesis===receipt.researchSynthesis&&result.researchReport===receipt.researchReport,'SYNTHESIS_RESULT_CONTEXT_CHANGED');
  if(receipt.researchSynthesis){
    validateLocalM3LimitedSynthesis(receipt.researchSynthesis,{evidence:result.evidence,root:result.root,support:result.support,seasonal:result.seasonal});
    validateM3LimitedSynthesisExplanation(receipt.researchReport,receipt.researchSynthesis);
  }
  check(result.patternAnalysis===receipt.patternAnalysis&&result.patternReport===receipt.patternReport,'PATTERN_RESULT_CONTEXT_CHANGED');
  if(receipt.patternAnalysis){
    validateLocalM4Pattern(receipt.patternAnalysis,{evidence:result.evidence,facts:result.facts});
    validateM4ZhengguanExplanation(receipt.patternReport,receipt.patternAnalysis);
  }
  return true;
}

export function renderLocalM3EvidenceText(result){
  validateLocalM3EvidenceResult(result);
  const {m1,facts,evidence,explanation}=result;
  if(result.patternAnalysis){
    const lines=['정관격 구조 분석 — 선택형 로컬 연구 v0.1',
      `양력 환산 ${m1.input.gregorianDate} ${m1.input.time} · ${m1.input.calendar}`,
      `명식 프로필: ${m1.profile.id} · 데이터셋: ${m1.dataset.id}`,
      `manifest: ${m1.dataset.candidateManifestContentSha256}`,
      `시계 정책: ${m1.policies.clock.id}`,
      `일주 교체: ${m1.policies.dayRollover.id} · 시주 참조: ${m1.policies.hourStemReference.id}`,
      `선택한 격국 구조 정책: ${M4_PATTERN_PROFILE_ID} (${M4_PATTERN_METADATA.version})`,
      '',renderM4ZhengguanText(result.patternReport).trimEnd()];
    if(result.seasonal){
      lines.push('','별도로 선택한 M3 계절 판단');
      for(const item of result.seasonal.candidates)lines.push(`원국 후보 ${item.candidateIndex+1}: ${item.explanation.text}`);
      lines.push('계절 대안은 같은 원국의 정관격 구조 후보를 추가 생성하거나 월령 장간을 바꾸지 않습니다.');
    }
    if(result.researchSynthesis)lines.push('','별도로 선택한 M3 제한적 종합',renderM3LimitedSynthesisText(result.researchReport).trimEnd());
    return lines.join('\n')+'\n';
  }
  if(result.researchSynthesis)return [
    '명식 제한적 종합 분석 — 로컬 연구 프로필 v0.1',
    `양력 환산 ${m1.input.gregorianDate} ${m1.input.time} · ${m1.input.calendar}`,
    `명식 프로필: ${m1.profile.id} · 데이터셋: ${m1.dataset.id}`,
    `manifest: ${m1.dataset.candidateManifestContentSha256}`,
    `시계 정책: ${m1.policies.clock.id}`,
    `일주 교체: ${m1.policies.dayRollover.id} · 시주 참조: ${m1.policies.hourStemReference.id}`,
    `선택한 종합 프로필: ${M3_SYNTHESIS_PROFILE_ID}`,
    `하위 정책: ${M3_SYNTHESIS_METADATA.dependencies.map(policy=>policy.id+' ('+policy.version+')').join(' / ')}`,
    '',renderM3LimitedSynthesisText(result.researchReport).trimEnd(),
    '', '원전 판본·권리·현실 예측 타당성은 인증하지 않았으며 기존 M3 전체 출시 게이트는 유지됩니다. 상세 위치와 근거 참조는 JSON 출력에서 확인할 수 있습니다.',
  ].join('\n')+'\n';
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
    summary.push(result.seasonal.policy.id===M3_SEASONAL_SILI_POLICY_ID?result.seasonal.candidates[0].explanation.scopeNote:'계절의 전통 분류입니다. 전체 명식의 신강약·득령·사령·통근 효력·길흉은 판단하지 않습니다.');
    if(!result.support)lines.unshift(...summary,'','구조적 근거와 상세 참조');
    lines.push('','계절 판단 상세 참조');
    for(const item of result.seasonal.candidates){const j=item.judgment;
      lines.push(`판단: ${j.id} [${j.candidateRef}] · ${j.status}`,
        `정책: ${result.seasonal.policy.id} | 규칙: ${j.ruleRefs.join(', ')}`,
        `M3 근거: ${(j.input.base??j.input).evidenceRefs.join(', ')} | M2 사실: ${(j.input.base??j.input).inputFactRefs.join(', ')}`,
        `문헌·구현 출처: ${j.sourceRefs.join(', ')} | 계산 출처: ${j.calculationSourceRefs.join(', ')}`);
      if(result.seasonal.policy.id===M3_SEASONAL_SILI_POLICY_ID&&j.nextSili)lines.push(
        `월 시작 S: ${j.appliedJie.koreanName} ${j.appliedJie.displayedDateTime} | 다음 사립 T: ${j.nextSili.term} ${j.nextSili.displayedDateTime}`,
        `유도 경계 B: ${j.derivedBoundary.displayedDateTime} = T - 25,920명목 분; KASI가 발표한 추가 절기가 아닙니다.`,
        '명목 구간: [S,B) 앞 계절 · [B,T) 토왕; 같은 표시 분의 조건은 후보별 결과를 따릅니다.');
    }
  }
  if(result.root){
    const summary=['선택한 구성상 통근과 표면 생조 요소의 근',`통근 정책: ${M3_ROOT_POLICY_METADATA.id}`];
    for(const candidate of result.rootExplanation.candidates){
      summary.push(`후보 ${candidate.candidateIndex+1} [${candidate.candidateRef}]`);
      if(result.seasonal){
        const season=result.seasonal.candidates.find(item=>item.candidateRef===candidate.candidateRef);
        check(season,'ROOT_SEASONAL_PARENT_CONTEXT_REQUIRED');summary.push(season.explanation.text);
      }
      for(const item of candidate.items)summary.push(item.text);
    }
    summary.push(result.rootExplanation.scopeNote);
    // Present the selected parallel judgments first; old structural output stays intact below.
    if(!result.support)lines.unshift(...summary,'','기존 구조적 근거와 계절 상세');
    lines.push('','통근 판단 상세 참조');
    for(const candidate of result.rootExplanation.candidates)for(const item of candidate.items){
      lines.push(`설명: ${item.id} [${candidate.candidateRef}]`,
        '  판단: '+item.judgmentRefs.join(', ')+' | M3 근거: '+item.inputEvidenceRefs.join(', '),
        '  M2 사실: '+(item.inputFactRefs??[]).join(', '),
        '  규칙: '+(item.ruleRefs??[]).join(', ')+' | 정책: '+(item.policyRefs??[]).join(', '),
        '  명리·정의 출처: '+(item.sourceRefs??[]).join(', ')+' | 계산 출처: '+(item.calculationSourceRefs??[]).join(', '));
    }
  }
  if(result.support){
    const summary=['표면 인성의 천간합에 따른 생조 채택 제한',`정책: ${M3_SUPPORT_POLICY_METADATA.id}`];
    for(const candidate of result.supportExplanation.candidates){
      summary.push(`후보 ${candidate.candidateIndex+1} [${candidate.candidateRef}]`);
      const rootCandidate=result.root.candidates[candidate.candidateIndex];
      const rootExplanation=result.rootExplanation.candidates[candidate.candidateIndex];
      check(rootCandidate?.candidateRef===candidate.candidateRef&&rootExplanation?.candidateRef===candidate.candidateRef,'SUPPORT_ROOT_PARENT_CONTEXT_REQUIRED');
      if(result.seasonal){
        const season=result.seasonal.candidates.find(item=>item.candidateRef===candidate.candidateRef);
        check(season,'SUPPORT_SEASONAL_PARENT_CONTEXT_REQUIRED');summary.push(season.explanation.text);
      }else summary.push('계절 정책을 선택하지 않아 계절 판단을 추가하지 않았습니다.');
      const dayRoot=rootExplanation.items.find(item=>item.judgmentRefs.includes(rootCandidate.dayMasterTargetRef));
      check(dayRoot,'SUPPORT_DAY_ROOT_DESCRIPTION_REQUIRED');summary.push(dayRoot.text);
      for(const item of candidate.items)summary.push(item.text);
    }
    summary.push(result.supportExplanation.scopeNote);
    lines.unshift(...summary,'','기존 구조 근거·통근·계절의 상세 참조');
    lines.push('','인성 채택 제한 판단 상세 참조');
    for(const candidate of result.supportExplanation.candidates)for(const item of candidate.items){
      lines.push(`설명: ${item.id} [${candidate.candidateRef}]`,
        '  결정: '+item.judgmentRefs.join(', ')+' | 통근: '+item.rootJudgmentRefs.join(', '),
        '  M3 근거: '+item.inputEvidenceRefs.join(', ')+' | M2 사실: '+item.inputFactRefs.join(', '),
        '  규칙: '+item.ruleRefs.join(', ')+' | 정책: '+item.policyRefs.join(', '),
        '  문헌·정의 출처: '+item.sourceRefs.join(', ')+' | 계산 출처: '+item.calculationSourceRefs.join(', '));
    }
  }
  return lines.join('\n')+'\n';
}

export function parseLocalM3EvidenceArgs(args){
  check(args.length>0&&args.length%2===0,'EXPLICIT_ARGUMENTS_REQUIRED');
  const base=[];let m3ProfileId,seasonalPolicyId,rootPolicyId,supportPolicyId,synthesisProfileId,patternProfileId;
  for(let i=0;i<args.length;i+=2){
    if(args[i]==='--m3-profile'){
      check(m3ProfileId===undefined&&typeof args[i+1]==='string','ARGUMENTS');m3ProfileId=args[i+1];
    }else if(args[i]==='--seasonal-policy'){
      check(seasonalPolicyId===undefined&&isSeasonalPolicy(args[i+1]),'EXPLICIT_SUPPORTED_SEASONAL_POLICY_REQUIRED');seasonalPolicyId=args[i+1];
    }else if(args[i]==='--root-policy'){
      check(rootPolicyId===undefined&&args[i+1]===M3_ROOT_POLICY_ID,'EXPLICIT_SUPPORTED_ROOT_POLICY_REQUIRED');rootPolicyId=args[i+1];
    }else if(args[i]==='--support-policy'){
      check(supportPolicyId===undefined&&args[i+1]===M3_SUPPORT_POLICY_ID,'EXPLICIT_SUPPORTED_SUPPORT_POLICY_REQUIRED');supportPolicyId=args[i+1];
    }else if(args[i]==='--synthesis-profile'){
      check(synthesisProfileId===undefined&&args[i+1]===M3_SYNTHESIS_PROFILE_ID,'EXPLICIT_SUPPORTED_SYNTHESIS_PROFILE_REQUIRED');synthesisProfileId=args[i+1];
    }else if(args[i]==='--pattern-profile'){
      check(patternProfileId===undefined&&args[i+1]===M4_PATTERN_PROFILE_ID,'EXPLICIT_SUPPORTED_PATTERN_PROFILE_REQUIRED');patternProfileId=args[i+1];
    }else base.push(args[i],args[i+1]);
  }
  if(patternProfileId!==undefined){
    const at=base.indexOf('--m2-profile'),m2ProfileId=at<0?undefined:base[at+1];
    const selected=patternPolicies(patternProfileId,{m2ProfileId,m3ProfileId});
    m3ProfileId=selected.m3ProfileId;if(at<0)base.push('--m2-profile',selected.m2ProfileId);
  }
  if(synthesisProfileId!==undefined){
    const at=base.indexOf('--m2-profile'),m2ProfileId=at<0?undefined:base[at+1];
    const selected=synthesisPolicies(synthesisProfileId,{m2ProfileId,m3ProfileId,seasonalPolicyId,rootPolicyId,supportPolicyId});
    ({m3ProfileId,seasonalPolicyId,rootPolicyId,supportPolicyId}=selected);
    if(at<0)base.push('--m2-profile',selected.m2ProfileId);
  }
  explicitProfile(m3ProfileId);
  if(supportPolicyId!==undefined)check(rootPolicyId===M3_ROOT_POLICY_ID,'EXPLICIT_SUPPORT_ROOT_POLICY_REQUIRED');
  return {...parseLocalExplainArgs(base),m3ProfileId,...(seasonalPolicyId===undefined?{}:{seasonalPolicyId}),...(rootPolicyId===undefined?{}:{rootPolicyId}),...(supportPolicyId===undefined?{}:{supportPolicyId}),...(synthesisProfileId===undefined?{}:{synthesisProfileId}),...(patternProfileId===undefined?{}:{patternProfileId})};
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
      :error instanceof RangeError&&/^M[34]_[A-Z0-9_]+$/.test(error.message)?error.message:'DATA_OR_INPUT_REJECTED';
    process.stderr.write(JSON.stringify({status:'REJECTED',code})+'\n');process.exitCode=1;
  }
}
