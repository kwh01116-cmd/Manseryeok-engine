/** Opt-in experiment only: existing local calculation once, old results retained. */
import {resolve} from 'node:path';import {pathToFileURL} from 'node:url';
import {fingerprint} from '../../.kasi-build/schema.js';
import {loadLocalChartProfile,parseLocalChartArgs} from '../kasi/local-chart.mjs';
import {validateLocalChartFacts} from '../kasi/local-chart-facts.mjs';
import {createLocalM3EvidenceProfile,validateLocalM3EvidenceResult,M3_SYNTHESIS_PROFILE_ID,M4_POSITION_PROFILE_ID} from '../kasi/local-m3-evidence.mjs';
import {scoreWeightedSupport,validateWeightedSupport,WEIGHTED_SUPPORT_POLICY_ID,WEIGHTED_SUPPORT_METADATA} from '../../dist/experimental/weightedSupportV1.js';
export {WEIGHTED_SUPPORT_POLICY_ID};
const issued=new WeakMap();
const requirePolicy=id=>{if(id!==WEIGHTED_SUPPORT_POLICY_ID)throw new RangeError('EXPLICIT_EXPERIMENTAL_POLICY_REQUIRED');};
const inputFor=(facts,c,index)=>({candidateRef:c.id,pillars:c.pillars.map((p,i)=>({role:p.role,stem:p.stem,branch:p.branch,factRef:`facts.candidates[${index}].pillars[${i}]`}))});
export function deriveExperimentalWeightedSupport(facts,{policyId}){
  requirePolicy(policyId);validateLocalChartFacts(facts);
  return Object.freeze(facts.candidates.map((c,i)=>scoreWeightedSupport(inputFor(facts,c,i),{policyId})));
}
export function createExperimentalWeightedProfile(base,{contextProfile,policyId}){
  requirePolicy(policyId);
  const legacy=createLocalM3EvidenceProfile(base,{contextProfile,positionProfileId:M4_POSITION_PROFILE_ID,synthesisProfileId:M3_SYNTHESIS_PROFILE_ID});
  return Object.freeze({metadata:WEIGHTED_SUPPORT_METADATA,calculate(request){
    const existing=legacy.calculate(request);validateLocalM3EvidenceResult(existing);
    const experimental=deriveExperimentalWeightedSupport(existing.facts,{policyId});
    const value=Object.freeze({schemaVersion:'experimental-local-analysis-comparison-v1',status:'EXPERIMENTAL_NOT_DEFAULT',
      level:2,policy:WEIGHTED_SUPPORT_METADATA,existing,experimental,
      executionCounts:Object.freeze({...existing.executionCounts,experimentalCandidateAnalyses:experimental.length}),
      guarantee:'EXISTING_LOCAL_ISSUANCE_PLUS_REPRODUCIBLE_HEURISTIC_NOT_G0_OR_PREDICTIVE_CERTIFICATION'});
    issued.set(value,{existing,experimental,content:fingerprint(value)});return value;
  }});
}
export function validateExperimentalWeightedResult(value){
  const receipt=issued.get(value);if(!receipt||receipt.content!==fingerprint(value)||value.existing!==receipt.existing||value.experimental!==receipt.experimental)throw new RangeError('ISSUED_EXPERIMENTAL_COMPARISON_REQUIRED');
  validateLocalM3EvidenceResult(value.existing);
  value.experimental.forEach((v,i)=>validateWeightedSupport(v,inputFor(value.existing.facts,value.existing.facts.candidates[i],i),{policyId:WEIGHTED_SUPPORT_POLICY_ID}));
}
export function renderExperimentalWeightedText(value){
  validateExperimentalWeightedResult(value);
  const labels={VERY_STRONG:'극신강',STRONG:'신강',BALANCED:'중화',WEAK:'신약',VERY_WEAK:'극신약'};
  const lines=['선택형 가중 생조 점수 PoC — LEVEL 2 실험 정책',`정책: ${value.policy.policyId} / ${value.policy.policyVersion}`,
    '점수는 선택한 개발자 규칙의 산출값이며 실제 힘·확률·예측 정확도가 아닙니다.'];
  value.experimental.forEach((r,i)=>{
    const c=value.existing.facts.candidates[i],old=value.existing.researchSynthesis.candidates[i];
    lines.push('',`후보 ${i+1}: ${c.pillars.map(p=>p.stem+p.branch).join('·')}`,
      `이 점수 정책에서는 ${r.score.value}/10, ${labels[r.policyClassification]}로 분류합니다.`,
      `계산: ${r.decisionTrace.map(t=>`${t.role}/${t.ruleId} ${t.contributionTenths/10}`).join(' + ')}.`,
      `기존 M3 경로: ${old.paths.map(p=>p.conclusion??p.status).join(' / ')}. 기존 결과를 이 점수로 덮어쓰지 않습니다.`);
  });
  lines.push('','기존 M2 장간표를 사용하고 자동 합화·종격·용신은 적용하지 않습니다. 기존 계절 경계 대안과 원국 후보는 그대로 남깁니다.');return lines.join('\n')+'\n';
}
export function parseExperimentalWeightedArgs(args){
  const rest=[],custom={};for(let i=0;i<args.length;i+=2){const name=args[i];if(['--experimental-policy','--output'].includes(name)){if(Object.hasOwn(custom,name)||!args[i+1])throw new RangeError('DUPLICATE_OR_MISSING_EXPERIMENTAL_ARGUMENT');custom[name]=args[i+1];}else rest.push(name,args[i+1]);}
  requirePolicy(custom['--experimental-policy']);if(!['json','text'].includes(custom['--output']))throw new RangeError('EXPLICIT_OUTPUT_REQUIRED');
  return {...parseLocalChartArgs(rest),policyId:custom['--experimental-policy'],output:custom['--output']};
}
if(process.argv[1]&&import.meta.url===pathToFileURL(resolve(process.argv[1])).href){
  try{const options=parseExperimentalWeightedArgs(process.argv.slice(2)),base=await loadLocalChartProfile(options),profile=createExperimentalWeightedProfile(base,{contextProfile:base,policyId:options.policyId}),value=profile.calculate(options.request);process.stdout.write(options.output==='text'?renderExperimentalWeightedText(value):JSON.stringify(value,null,2)+'\n');}
  catch{process.stderr.write('EXPERIMENTAL_REQUEST_DATA_OR_POLICY_REJECTED\n');process.exitCode=1;}
}
