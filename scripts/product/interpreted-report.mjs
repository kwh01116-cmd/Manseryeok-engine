import {resolve} from 'node:path';
import {pathToFileURL} from 'node:url';
import {loadApiOnlyServerEngine,validateApiOnlyServerRequest,validateApiOnlyServerResult} from '../server/engine.mjs';
import {projectServerReport,analyzeConsumerReport,validateIssuedConsumerReport} from './consumer-report.mjs';
import {INTERPRETATION_PROFILE_ID,assertInterpretationJson,freezeInterpretation} from '../../dist/report/interpretationPolicyV1.js';
import {buildInterpretedReport,validateInterpretedReport,renderInterpretedReport,buildInterpretedSections,auditNarrative,selectNarrativeVariants,recordNarrativeFallback} from '../../dist/report/narrativePipelineV1.js';

const issued=new WeakMap();
const check=(value,code)=>{if(!value)throw new RangeError(code);};
function options(value,keys,code){assertInterpretationJson(value);check(value&&typeof value==='object'&&!Array.isArray(value)&&Object.keys(value).every(k=>keys.includes(k)),code);}
function supportFromIssued(result,projection){
  if(!projection.candidates.length)return {};
  const source=result.analysisData.base?.existing??result.analysisData, support=source.support;
  if(!support)return {};
  check(support.policy.id==='M3-RESOURCE-ADJACENT-COMBINATION-HOLD-V01'&&support.policy.version==='0.1.0','S7_SUPPORT_POLICY');
  const out={};
  for(const c of projection.candidates){const original=support.candidates.find(x=>x.candidateRef===c.id);check(original,'S7_SUPPORT_PARENT');
    out[c.id]=original.resources.map(r=>({role:r.resource.pillarRole,stem:r.resource.stem,decision:r.selectedRuleDecision,rootPresence:r.rootPresence,upstreamRef:r.id}));
  }
  return out;
}
export function analyzeInterpretedReport(result,configuration){
  options(configuration,['request','profileId'],'S7_ANALYZE_OPTIONS');check(configuration.profileId===INTERPRETATION_PROFILE_ID,'S7_EXPLICIT_PROFILE_REQUIRED');
  validateApiOnlyServerResult(result,{request:configuration.request});
  const baseReport=analyzeConsumerReport(result,{request:configuration.request,profileId:'SAJU-CONSUMER-EVIDENCE-REPORT-V01'});
  const projection=projectServerReport(result,{request:configuration.request});
  const report=buildInterpretedReport({projection,baseReport,existingSupport:supportFromIssued(result,projection)},{profileId:configuration.profileId});
  issued.set(report,{result,baseReport,request:structuredClone(configuration.request)});return report;
}
export function validateIssuedInterpretedReport(report){const context=issued.get(report);check(context,'S7_ISSUED_REPORT_REQUIRED');validateApiOnlyServerResult(context.result,{request:context.request});validateIssuedConsumerReport(context.baseReport);validateInterpretedReport(report);return true;}
export function createInterpretedReportService(engine,configuration){options(configuration,['profileId'],'S7_SERVICE_OPTIONS');check(engine&&typeof engine.calculate==='function'&&configuration.profileId===INTERPRETATION_PROFILE_ID,'S7_EXPLICIT_ENGINE_AND_PROFILE');return Object.freeze({calculate(request){validateApiOnlyServerRequest(request);return analyzeInterpretedReport(engine.calculate(request),{request,profileId:configuration.profileId});}});}
export async function loadInterpretedReportService(configuration){options(configuration,['dataDirectory','profileId'],'S7_LOAD_OPTIONS');check(configuration.profileId===INTERPRETATION_PROFILE_ID&&typeof configuration.dataDirectory==='string','S7_EXPLICIT_DATA_AND_PROFILE');return createInterpretedReportService(await loadApiOnlyServerEngine({dataDirectory:configuration.dataDirectory}),{profileId:configuration.profileId});}

/** No birth input, calendar rows, storage keys or raw provenance is supplied to an expression provider. */
export function expressionRequest(report){
  validateInterpretedReport(report);
  const blocks=report.sections.flatMap(s=>s.blocks).filter(b=>b.kind==='SYMBOLIC_INTERPRETATION');
  return freezeInterpretation({schemaVersion:'saju-closed-expression-request-v1',profile:report.profile,
    semanticBoundary:'ONLY_SELECT_AN_APPROVED_VARIANT_NO_FREE_FORM_FACT_OR_INTERPRETATION',
    claims:report.interpretationClaims.map(c=>({claimId:c.claimId,domain:c.domain,policy:{id:c.interpretationPolicyId,version:c.interpretationPolicyVersion},status:c.confidenceOrApplicabilityStatus,allowedMeaning:c.allowedMeaning,forbiddenConclusions:c.forbiddenConclusions,scope:c.interpretationScope})),
    blocks:blocks.map(b=>{const c=report.interpretationClaims.find(c=>c.claimId===b.blockId),prefix=report.basis.projection.candidates.length>1?`후보 ${report.basis.projection.candidates.find(x=>x.id===c.chartCandidateRef).ordinal}: `:'';return {...b,approvedVariants:[{id:'STANDARD',text:prefix+c.consumerText},{id:'REFLECTIVE',text:prefix+c.alternativeText}]};})});
}
export function approvedExpressionMock(payload){return {schemaVersion:'saju-closed-expression-response-v1',blocks:payload.blocks.map(({approvedVariants,...block})=>({...block,variantId:'REFLECTIVE',text:approvedVariants.find(v=>v.id==='REFLECTIVE').text}))};}
export async function composeWithExpressionProvider(report,{provider,maxAttempts=1,timeoutMs=1000}={}){
  validateInterpretedReport(report);check(typeof provider==='function'&&Number.isSafeInteger(maxAttempts)&&maxAttempts>=1&&maxAttempts<=2&&Number.isSafeInteger(timeoutMs)&&timeoutMs>=1&&timeoutMs<=10000,'S7_EXPRESSION_OPTIONS');
  const payload=expressionRequest(report),failures=[];
  for(let attempt=1;attempt<=maxAttempts;attempt++){
    const controller=new AbortController();let timer,responseReceived=false;
    try{
      const timeout=new Promise((_,reject)=>{timer=setTimeout(()=>{controller.abort();reject(new Error('S7_MOCK_TIMEOUT'));},timeoutMs);});
      const response=await Promise.race([Promise.resolve().then(()=>provider(payload,{signal:controller.signal,attempt})),timeout]);responseReceived=true;
      assertInterpretationJson(response);check(response&&Object.keys(response).sort().join(',')==='blocks,schemaVersion'&&response.schemaVersion==='saju-closed-expression-response-v1'&&Array.isArray(response.blocks),'S7_EXPRESSION_RESPONSE');
      const audit=auditNarrative(report,response.blocks);if(audit.status==='REJECTED'){failures.push(...audit.issues);continue;}
      const next=selectNarrativeVariants(report,response.blocks,{requested:'LOCAL_MOCK',used:'APPROVED_VARIANTS',attemptCount:attempt,fallbackUsed:false,failures:failures.slice(0,128)});
      if(issued.has(report))issued.set(next,issued.get(report));return next;
    }catch{failures.push({category:'GENERATOR',code:controller.signal.aborted?'GENERATOR_ABORTED':responseReceived?'GENERATOR_CONTRACT':'GENERATOR_UNAVAILABLE',blockId:null});}
    finally{if(timer)clearTimeout(timer);controller.abort();}
  }
  const next=recordNarrativeFallback(report,{requested:'LOCAL_MOCK',used:'DETERMINISTIC',attemptCount:maxAttempts,fallbackUsed:true,failures:failures.slice(0,128)});if(issued.has(report))issued.set(next,issued.get(report));return next;
}

export function parseInterpretedReportArgs(args){
  check(Array.isArray(args)&&args.length===16,'S7_EXPLICIT_ARGUMENTS_REQUIRED');const out={},names=['--data-pack','--request-json','--interpretation-profile','--output','--audience','--voice','--detail','--generator'];
  for(let i=0;i<args.length;i+=2){check(names.includes(args[i])&&typeof args[i+1]==='string'&&!Object.hasOwn(out,args[i]),'S7_ARGUMENTS');out[args[i]]=args[i+1];}
  check(out['--data-pack']&&out['--interpretation-profile']===INTERPRETATION_PROFILE_ID&&['json','text','sections'].includes(out['--output'])&&['preview','full'].includes(out['--audience'])&&['report','dialogue'].includes(out['--voice'])&&['summary','evidence'].includes(out['--detail'])&&['deterministic','mock-approved'].includes(out['--generator']),'S7_EXPLICIT_SELECTION');
  check(Buffer.byteLength(out['--request-json'],'utf8')<=32768,'S7_REQUEST_LIMIT');const request=JSON.parse(out['--request-json']);validateApiOnlyServerRequest(request);
  return {dataDirectory:resolve(out['--data-pack']),profileId:out['--interpretation-profile'],request,output:out['--output'],audience:out['--audience'],voice:out['--voice'],detail:out['--detail'],generator:out['--generator']};
}
export async function runInterpretedReportCli(args){let phase='INPUT';try{
  check(process.versions.node.split('.')[0]==='22','S7_NODE22_REQUIRED');const config=parseInterpretedReportArgs(args);phase='DATA';const service=await loadInterpretedReportService({dataDirectory:config.dataDirectory,profileId:config.profileId});phase='REPORT';let report=service.calculate(config.request);
  if(config.generator==='mock-approved'){phase='EXPRESSION';report=await composeWithExpressionProvider(report,{provider:approvedExpressionMock});}validateIssuedInterpretedReport(report);phase='OUTPUT';
  const output=config.output==='json'?JSON.stringify(report,null,2)+'\n':config.output==='sections'?JSON.stringify(buildInterpretedSections(report,config),null,2)+'\n':renderInterpretedReport(report,{audience:config.audience,voice:config.voice,detail:config.detail==='evidence'});process.stdout.write(output);
  if(['NOT_PROVIDABLE','NEEDS_ADDITIONAL_INFORMATION'].includes(report.eligibility.status))process.exitCode=2;
}catch{process.stderr.write(JSON.stringify({status:'REJECTED',phase,code:'S7_REPORT_'+phase+'_REJECTED'})+'\n');process.exitCode=1;}}
if(process.argv[1]&&import.meta.url===pathToFileURL(resolve(process.argv[1])).href)await runInterpretedReportCli(process.argv.slice(2));
