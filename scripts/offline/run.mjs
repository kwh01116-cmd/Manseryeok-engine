/** Thin offline boundary: preserve existing DTOs, parsers and explicit policy choices. */
import {resolve} from 'node:path';
import {pathToFileURL} from 'node:url';
import {loadLocalChartProfile,parseLocalChartArgs,MODERN_PROFILE_ID} from '../kasi/local-chart.mjs';
import {createLocalExplanationProfile,parseLocalExplainArgs,renderExplanationText} from '../kasi/local-explain.mjs';
import {createLocalM3EvidenceProfile,parseLocalM3EvidenceArgs,renderLocalM3EvidenceText} from '../kasi/local-m3-evidence.mjs';
import {createExperimentalWeightedProfile,parseExperimentalWeightedArgs,renderExperimentalWeightedText} from '../experimental/weighted-support.mjs';
import {assertNode22,check,verifyArtifact,verifyAttachment,BASELINE_PIN} from './integrity.mjs';

export const OFFLINE_RESULT_SCHEMA='manseryeok-offline-result-v1';
const unsupportedStatuses=new Set(['OUT_OF_PROFILE_COVERAGE','OUT_OF_OBSERVED_COVERAGE','INVALID_LUNAR_DATE']);
const rejectionCodes=Object.freeze({INPUT:'OFFLINE_INPUT_REJECTED',ARTIFACT:'OFFLINE_ARTIFACT_REJECTED',DATA:'OFFLINE_DATA_REJECTED',CALCULATION:'OFFLINE_CALCULATION_REJECTED'});
export class OfflineCalculationError extends Error {
  constructor(status){const code=unsupportedStatuses.has(status)?status:rejectionCodes.CALCULATION;super(code);this.name='OfflineCalculationError';this.code=code;}
}
/** Fixed enums only. Never forwards an exception message, path or request. */
export function offlineRejection(error,phase){
  const safePhase=Object.hasOwn(rejectionCodes,phase)?phase:'CALCULATION';
  const code=safePhase==='CALCULATION'&&error instanceof OfflineCalculationError&&unsupportedStatuses.has(error.code)?error.code:rejectionCodes[safePhase];
  return {status:'REJECTED',phase:safePhase,code};
}
export function parseOfflineArgs(args){
  check(args.length>0&&args.length%2===0,'EXPLICIT_ARGUMENTS_REQUIRED');const wrapper={},base=[];
  for(let i=0;i<args.length;i+=2){
    const name=args[i];check(typeof args[i+1]==='string','ARGUMENTS');
    if(['--mode','--attachment','--output'].includes(name)){check(!Object.hasOwn(wrapper,name),'ARGUMENTS');wrapper[name]=args[i+1];}
    else {check(!['--candidate','--manifest-sha'].includes(name),'ATTACHMENT_DATA_ARGUMENTS_FIXED');base.push(name,args[i+1]);}
  }
  check(['chart','explain','evidence','experimental'].includes(wrapper['--mode']),'EXPLICIT_MODE_REQUIRED');
  check(['json','text'].includes(wrapper['--output']),'EXPLICIT_OUTPUT_REQUIRED');check(wrapper['--attachment'],'EXPLICIT_ATTACHMENT_REQUIRED');
  const mode=wrapper['--mode'],argsWithData=[...base,'--candidate',wrapper['--attachment'],'--manifest-sha',BASELINE_PIN];
  const options=mode==='chart'?parseLocalChartArgs(argsWithData):mode==='explain'?parseLocalExplainArgs([...argsWithData,'--output',wrapper['--output']]):mode==='evidence'?parseLocalM3EvidenceArgs([...argsWithData,'--output',wrapper['--output']]):parseExperimentalWeightedArgs([...argsWithData,'--output',wrapper['--output']]);
  check(options.profileId===MODERN_PROFILE_ID,'OFFLINE_MODERN_PROFILE_REQUIRED');return {mode,output:wrapper['--output'],attachmentDirectory:wrapper['--attachment'],options};
}
/** Injectable live chart profile supports public synthetic contract tests without a data-pin bypass in the CLI. */
export function calculateOffline({mode,options,chartProfile,contextProfile=chartProfile}){
  check(['chart','explain','evidence','experimental'].includes(mode),'EXPLICIT_MODE_REQUIRED');
  // Each selected adapter calls this once. Preserve the exact issued M1 result
  // on success and stop before downstream adapters lose its non-OK status.
  const guarded=Object.freeze({calculate(request){const result=chartProfile.calculate(request);if(result?.status!=='OK')throw new OfflineCalculationError(result?.status);return result;}});
  // Seasonal context still comes from the original live issued profile; the
  // thin calculate guard is not an issuance identity or a second calculation.
  const profile=mode==='chart'?guarded:mode==='explain'?createLocalExplanationProfile(guarded,options):mode==='evidence'?createLocalM3EvidenceProfile(guarded,{...options,contextProfile}):createExperimentalWeightedProfile(guarded,{contextProfile,policyId:options.policyId});
  const data=profile.calculate(options.request);
  const successful=mode==='chart'||mode==='explain'?data.status==='OK':mode==='evidence'?data.status==='EVIDENCE_ONLY':data.status==='EXPERIMENTAL_NOT_DEFAULT';
  check(successful,'BIRTH_INPUT_NOT_SUPPORTED');return {schemaVersion:OFFLINE_RESULT_SCHEMA,mode,data};
}
export function renderOfflineText(result){
  const {mode,data}=result;
  if(mode==='explain')return renderExplanationText(data);
  if(mode==='evidence')return renderLocalM3EvidenceText(data);
  if(mode==='experimental')return renderExperimentalWeightedText(data);
  check(mode==='chart'&&data.status==='OK','CHART_NOT_READY');
  return ['로컬 명식',`프로필: ${data.profile.id}`,`데이터 manifest: ${data.dataset.candidateManifestContentSha256}`,`발표 분 비교: ${data.chart.confidence}`,...data.chart.candidates.map((c,i)=>`후보 ${i+1}: ${[c.year,c.month,c.day,c.hour].map(p=>p.stem+p.branch).join(' · ')}`),`일주 교체: ${data.policies.dayRollover.id}`,`시주 참조: ${data.policies.hourStemReference.id}`,`한계: ${data.limits.join(', ')}`].join('\n')+'\n';
}
export async function main(args=process.argv.slice(2)){
  let phase='INPUT';
  try{
    assertNode22();const parsed=parseOfflineArgs(args);
    phase='ARTIFACT';await verifyArtifact(resolve(import.meta.dirname,'../..'));
    phase='DATA';await verifyAttachment(parsed.attachmentDirectory);const chartProfile=await loadLocalChartProfile(parsed.options);
    phase='CALCULATION';const value=calculateOffline({...parsed,chartProfile});
    process.stdout.write(parsed.output==='json'?JSON.stringify(value,null,2)+'\n':renderOfflineText(value));
  }catch(error){process.stderr.write(JSON.stringify(offlineRejection(error,phase))+'\n');process.exitCode=1;}
}
if(process.argv[1]&&import.meta.url===pathToFileURL(resolve(process.argv[1])).href)await main();
