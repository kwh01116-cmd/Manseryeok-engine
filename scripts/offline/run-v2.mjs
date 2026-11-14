/** Explicit integrated mode; legacy calculation adapters retain their original DTOs. */
import {resolve} from 'node:path';
import {pathToFileURL} from 'node:url';
import {loadLocalChartProfile,MODERN_PROFILE_ID} from '../kasi/local-chart.mjs';
import {parseLocalProductReportArgs,createLocalProductReportProfile,renderLocalProductReportText,validateLocalProductReportResult,PRODUCT_REPORT_SCHEMA} from '../kasi/local-product-report.mjs';
import {parseOfflineArgs,calculateOffline,renderOfflineText,OfflineCalculationError,offlineRejection} from './run.mjs';
import {assertNode22,check,verifyAttachment,BASELINE_PIN} from './integrity.mjs';
import {verifyIntegratedArtifact} from './integrity-v2.mjs';
export const INTEGRATED_RESULT_SCHEMA='manseryeok-offline-integrated-result-v2';
export function parseIntegratedOfflineArgs(args){
  check(args.length>0&&args.length%2===0,'EXPLICIT_ARGUMENTS_REQUIRED');const wrapper={},base=[];
  for(let i=0;i<args.length;i+=2){const name=args[i];check(typeof args[i+1]==='string','ARGUMENTS');if(['--mode','--attachment','--output'].includes(name)){check(!Object.hasOwn(wrapper,name),'ARGUMENTS');wrapper[name]=args[i+1];}else{check(!['--candidate','--manifest-sha'].includes(name),'ATTACHMENT_DATA_ARGUMENTS_FIXED');base.push(name,args[i+1]);}}
  if(wrapper['--mode']!=='product')return parseOfflineArgs(args);
  check(['json','text'].includes(wrapper['--output']),'EXPLICIT_OUTPUT_REQUIRED');check(wrapper['--attachment'],'EXPLICIT_ATTACHMENT_REQUIRED');
  const options=parseLocalProductReportArgs([...base,'--candidate',wrapper['--attachment'],'--manifest-sha',BASELINE_PIN,'--output',wrapper['--output']]);
  check(options.profileId===MODERN_PROFILE_ID,'OFFLINE_MODERN_PROFILE_REQUIRED');return {mode:'product',output:wrapper['--output'],attachmentDirectory:wrapper['--attachment'],options};
}
export function calculateIntegratedOffline({mode,options,chartProfile,contextProfile=chartProfile}){
  if(mode!=='product')return calculateOffline({mode,options,chartProfile,contextProfile});
  const guarded=Object.freeze({calculate(request){const value=chartProfile.calculate(request);if(value?.status!=='OK')throw new OfflineCalculationError(value?.status);return value;}});
  const profile=createLocalProductReportProfile(guarded,{...options,contextProfile});
  const data=profile.calculate(options.request,{luckOptions:options.luckOptions,monthlyOptions:options.monthlyOptions});
  check(data?.schemaVersion===PRODUCT_REPORT_SCHEMA&&data.status==='PRODUCT_ANALYSIS_ONLY','BIRTH_INPUT_NOT_SUPPORTED');validateLocalProductReportResult(data);
  return {schemaVersion:INTEGRATED_RESULT_SCHEMA,mode:'product',data};
}
export function renderIntegratedOfflineText(value,{detail}={}){return value.mode==='product'?renderLocalProductReportText(value.data,{detail}):renderOfflineText(value);}
export async function main(args=process.argv.slice(2)){
  let phase='INPUT';try{assertNode22();const parsed=parseIntegratedOfflineArgs(args);phase='ARTIFACT';await verifyIntegratedArtifact(resolve(import.meta.dirname,'../..'));phase='DATA';await verifyAttachment(parsed.attachmentDirectory);const chartProfile=await loadLocalChartProfile(parsed.options);phase='CALCULATION';const value=calculateIntegratedOffline({...parsed,chartProfile});process.stdout.write(parsed.output==='json'?JSON.stringify(value,null,2)+'\n':renderIntegratedOfflineText(value,{detail:parsed.options.detail}));}
  catch(error){process.stderr.write(JSON.stringify(offlineRejection(error,phase))+'\n');process.exitCode=1;}
}
if(process.argv[1]&&import.meta.url===pathToFileURL(resolve(process.argv[1])).href)await main();
