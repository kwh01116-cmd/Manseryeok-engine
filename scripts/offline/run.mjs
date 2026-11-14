/** Thin offline boundary: preserve existing DTOs, parsers and explicit policy choices. */
import {resolve} from 'node:path';
import {pathToFileURL} from 'node:url';
import {loadLocalChartProfile,parseLocalChartArgs,MODERN_PROFILE_ID} from '../kasi/local-chart.mjs';
import {createLocalExplanationProfile,parseLocalExplainArgs,renderExplanationText} from '../kasi/local-explain.mjs';
import {createLocalM3EvidenceProfile,parseLocalM3EvidenceArgs,renderLocalM3EvidenceText} from '../kasi/local-m3-evidence.mjs';
import {createExperimentalWeightedProfile,parseExperimentalWeightedArgs,renderExperimentalWeightedText} from '../experimental/weighted-support.mjs';
import {assertNode22,check,verifyArtifact,verifyAttachment,BASELINE_PIN} from './integrity.mjs';

export const OFFLINE_RESULT_SCHEMA='manseryeok-offline-result-v1';
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
export function calculateOffline({mode,options,chartProfile}){
  check(['chart','explain','evidence','experimental'].includes(mode),'EXPLICIT_MODE_REQUIRED');
  const profile=mode==='chart'?chartProfile:mode==='explain'?createLocalExplanationProfile(chartProfile,options):mode==='evidence'?createLocalM3EvidenceProfile(chartProfile,options):createExperimentalWeightedProfile(chartProfile,{contextProfile:chartProfile,policyId:options.policyId});
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
  try{
    assertNode22();const parsed=parseOfflineArgs(args);
    await verifyArtifact(resolve(import.meta.dirname,'../..'));await verifyAttachment(parsed.attachmentDirectory);
    const chartProfile=await loadLocalChartProfile(parsed.options),value=calculateOffline({...parsed,chartProfile});
    process.stdout.write(parsed.output==='json'?JSON.stringify(value,null,2)+'\n':renderOfflineText(value));
  }catch{process.stderr.write(JSON.stringify({status:'REJECTED',code:'OFFLINE_REQUEST_DATA_OR_POLICY_REJECTED'})+'\n');process.exitCode=1;}
}
if(process.argv[1]&&import.meta.url===pathToFileURL(resolve(process.argv[1])).href)await main();
