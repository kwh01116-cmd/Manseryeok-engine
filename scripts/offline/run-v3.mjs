/** Explicit extended mode. Existing v2 modes keep their original calculation DTOs. */
import {resolve,join} from 'node:path';
import {pathToFileURL} from 'node:url';
import {loadLocalChartProfile} from '../kasi/local-chart.mjs';
import {EXTENDED_REPORT_SCHEMA,parseLocalExtendedReportArgs,createLocalExtendedReportProfile,loadLocalExtendedReportProfile,renderLocalExtendedReportText,validateLocalExtendedReportResult} from '../kasi/local-extended-report.mjs';
import {parseIntegratedOfflineArgs,calculateIntegratedOffline,renderIntegratedOfflineText} from './run-v2.mjs';
import {offlineRejection} from './run.mjs';
import {assertNode22,check,BASELINE_PIN} from './integrity.mjs';
import {EXTENDED_PROFILES,verifyExtendedArtifact,verifyExtendedAttachment} from './integrity-v3.mjs';
export const EXTENDED_RESULT_SCHEMA='manseryeok-offline-extended-result-v3';
export function parseExtendedOfflineArgs(args){
 check(args.length>0&&args.length%2===0,'EXPLICIT_ARGUMENTS_REQUIRED');const wrapper={},base=[];
 for(let i=0;i<args.length;i+=2){const name=args[i];check(typeof args[i+1]==='string'&&args[i+1].length>0,'ARGUMENTS');if(['--mode','--attachment','--output'].includes(name)){check(!Object.hasOwn(wrapper,name),'ARGUMENTS');wrapper[name]=args[i+1];}else{check(!['--candidate','--manifest-sha','--solar-extension'].includes(name),'ATTACHMENT_DATA_ARGUMENTS_FIXED');base.push(name,args[i+1]);}}
 check(wrapper['--attachment'],'EXPLICIT_ATTACHMENT_REQUIRED');const attachmentRoot=resolve(wrapper['--attachment']),candidateDirectory=join(attachmentRoot,'base');
 if(wrapper['--mode']!=='extended-product'){
  const legacy=parseIntegratedOfflineArgs(['--mode',wrapper['--mode'],'--attachment',candidateDirectory,...base,'--output',wrapper['--output']]);return {...legacy,attachmentRoot};
 }
 check(['json','text'].includes(wrapper['--output']),'EXPLICIT_OUTPUT_REQUIRED');
 const profile=base[base.indexOf('--profile')+1];check(EXTENDED_PROFILES.includes(profile),'EXPLICIT_EXTENDED_PROFILE_REQUIRED');
 const fixed=[...base,'--candidate',candidateDirectory,'--manifest-sha',BASELINE_PIN,'--output',wrapper['--output']];
 if(profile==='kasi-api-1989-2027-solar-local-v1')fixed.push('--solar-extension',join(attachmentRoot,'boundary'));
 const options=parseLocalExtendedReportArgs(fixed);check(options.profileId===profile,'EXTENDED_PROFILE_PARSE_MISMATCH');
 return {mode:'extended-product',output:wrapper['--output'],attachmentRoot,attachmentDirectory:attachmentRoot,options};
}
export function calculateExtendedOffline({mode,options,chartProfile,contextProfile=chartProfile,reportProfile}){
 if(mode!=='extended-product')return calculateIntegratedOffline({mode,options,chartProfile,contextProfile});
 const profile=reportProfile??createLocalExtendedReportProfile(chartProfile,{reportProfileId:options.reportProfileId,contextProfile});
 const data=profile.calculate(options.request,options);
 if(data?.status==='EXTENDED_CALENDAR_ANALYSIS_ONLY')validateLocalExtendedReportResult(data);
 else check(data?.schemaVersion===EXTENDED_REPORT_SCHEMA&&['NEEDS_DATA','POLICY_UNRESOLVED','AMBIGUOUS_TIME','NONEXISTENT_TIME','OUT_OF_PROFILE_COVERAGE','OUT_OF_OBSERVED_COVERAGE','INVALID_LUNAR_DATE'].includes(data.status)&&data.m1?.status===data.status&&typeof data.reason==='string','EXTENDED_PENDING_RESULT_CONTRACT');
 return {schemaVersion:EXTENDED_RESULT_SCHEMA,mode:'extended-product',data};
}
export function renderExtendedOfflineText(value,{detail='summary'}={}){return value.mode==='extended-product'?renderLocalExtendedReportText(value.data,{detail}):renderIntegratedOfflineText(value,{detail});}
export async function main(args=process.argv.slice(2)){
 let phase='INPUT';try{
  assertNode22();const parsed=parseExtendedOfflineArgs(args);phase='ARTIFACT';await verifyExtendedArtifact(resolve(import.meta.dirname,'../..'));phase='DATA';await verifyExtendedAttachment(parsed.attachmentRoot);
  const loaded=parsed.mode==='extended-product'?{reportProfile:await loadLocalExtendedReportProfile(parsed.options)}:{chartProfile:await loadLocalChartProfile(parsed.options)};
  phase='CALCULATION';const value=calculateExtendedOffline({...parsed,...loaded});process.stdout.write(parsed.output==='json'?JSON.stringify(value,null,2)+'\n':renderExtendedOfflineText(value,{detail:parsed.options.detail}));if(value.mode==='extended-product'&&value.data.status!=='EXTENDED_CALENDAR_ANALYSIS_ONLY')process.exitCode=2;
 }catch(error){process.stderr.write(JSON.stringify(offlineRejection(error,phase))+'\n');process.exitCode=1;}
}
if(process.argv[1]&&import.meta.url===pathToFileURL(resolve(process.argv[1])).href)await main();
