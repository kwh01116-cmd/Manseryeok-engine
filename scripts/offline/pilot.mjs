/** Internal opt-in restoration pilot. Public tests never call or require this. */
import {mkdtemp,rm,readFile} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join,resolve,relative,isAbsolute,sep,basename} from 'node:path';
import {pathToFileURL} from 'node:url';
import {execFile} from 'node:child_process';
import {promisify} from 'node:util';
import {restoreArtifact} from './restore.mjs';
import {attachPrivateData} from './attach.mjs';
import {calculateOffline,parseOfflineArgs,renderOfflineText} from './run.mjs';
import {loadLocalChartProfile} from '../kasi/local-chart.mjs';
import {assertNode22,check,parsePairs,verifyArtifact,verifyAttachment,digest,BASELINE_PIN,createNewDirectory,writeNew} from './integrity.mjs';
import {writeOfflineGuards,cleanOfflineEnvironment} from './guards.mjs';

const execute=promisify(execFile),repo=resolve(import.meta.dirname,'../..');
const policy=['--profile','kasi-api-1989-2026-local-v1','--clock-policy','KR_API_PUBLISHED_KST_MODERN_1988_POST_DST_V1','--day-rollover','CIVIL_MIDNIGHT','--hour-stem-reference','SELECTED_DAY_PILLAR'];
const selection={chart:[],explain:['--m2-profile','m2-basic-classification-local-v1'],evidence:['--synthesis-profile','M3-LIMITED-ABSENT-ROOT-RESOURCE-SYNTHESIS-V01','--position-profile','M4-ZHENGGUAN-WEALTH-RESOURCE-POSITION-REVIEW-V01'],experimental:['--experimental-policy','EXPERIMENTAL-WEIGHTED-SUPPORT-LOCAL-NO-TRANSFORMATION-V01']};
export async function runInternalPilot({artifactDirectory,attachmentDirectory,outDir}){
  assertNode22();const artifact=await verifyArtifact(artifactDirectory),attachment=await verifyAttachment(attachmentDirectory);
  const originalEngineHash=digest(await readFile(join(artifactDirectory,'artifact-manifest.json'))),originalDataHash=digest(await readFile(join(attachmentDirectory,'attachment.json')));
  const target=await createNewDirectory(outDir,{privateOnly:true});
  const directory=await mkdtemp(join(tmpdir(),'manseryeok-detached-pilot-'));
  try{
    const engine=join(directory,'restored engine'),data=join(directory,'.private','restored data');
    await restoreArtifact({artifactDirectory,outDir:engine,attachmentDirectory,privateDataOut:data});
    const {preload}=await writeOfflineGuards(directory,{forbiddenRoot:repo});
    const spawn=async(args,tz='UTC')=>{
      try{const value=await execute(process.execPath,['--import',pathToFileURL(preload).href,join(engine,'run.mjs'),...args],{cwd:directory,env:cleanOfflineEnvironment(tz),timeout:45000,maxBuffer:5_000_000});return {...value,status:0};}
      catch(error){return {stdout:error.stdout??'',stderr:error.stderr??'',status:typeof error.code==='number'?error.code:-1};}
    };
    const observed=JSON.parse(await readFile(join(data,'candidate.json'),'utf8')).dates.find(row=>row.solarDate==='2026-06-01');check(observed,'PILOT_VIRTUAL_LUNAR_ROW_REQUIRED');
    const cases=[
      {id:'VIRTUAL_ORDINARY',input:['--calendar','GREGORIAN','--date','2026-06-01','--time','12:00'],expectedCandidates:1},
      {id:'VIRTUAL_LICHUN_MINUTE',input:['--calendar','GREGORIAN','--date','2026-02-04','--time','05:02'],expectedCandidates:2},
      {id:'VIRTUAL_SEASON_B_MINUTE',input:['--calendar','GREGORIAN','--date','2026-04-17','--time','20:49'],expectedCandidates:1},
      {id:'VIRTUAL_LUNAR_ORDINARY',input:['--calendar','KOREAN_LUNAR','--lunar-year',String(observed.lunarYear),'--lunar-month',String(observed.lunarMonth),'--lunar-day',String(observed.lunarDay),'--leap',String(observed.leap),'--time','12:00'],expectedCandidates:1},
      {id:'VIRTUAL_JAN8',input:['--calendar','GREGORIAN','--date','2026-01-08','--time','12:00'],expectedCandidates:1},
      ...[['CIVIL_MIDNIGHT','SELECTED_DAY_PILLAR'],['CIVIL_MIDNIGHT','CIVIL_DATE_DAY_PILLAR'],['ZI_START','SELECTED_DAY_PILLAR'],['ZI_START','CIVIL_DATE_DAY_PILLAR']].map(([rollover,reference])=>({id:`VIRTUAL_LATE_HOUR_${rollover}_${reference}`,input:['--calendar','GREGORIAN','--date','2026-06-01','--time','23:30'],expectedCandidates:1,modes:['chart'],policyOverrides:{'--day-rollover':rollover,'--hour-stem-reference':reference}})),
    ];
    const referenceProfile=await loadLocalChartProfile({directory:attachmentDirectory,expectedManifestSha256:BASELINE_PIN,profileId:'kasi-api-1989-2026-local-v1'}),jobs=[],receipts=[];
    let referenceCalculations=0;
    for(const entry of cases)for(const mode of entry.modes??Object.keys(selection)){
      const selectedPolicy=[...policy];for(const [name,value]of Object.entries(entry.policyOverrides??{}))selectedPolicy[selectedPolicy.indexOf(name)+1]=value;
      const args=['--mode',mode,'--attachment',data,...selectedPolicy,...entry.input,...selection[mode]];
      const parsed=parseOfflineArgs([...args,'--output','json']),expected=calculateOffline({...parsed,chartProfile:referenceProfile});
      referenceCalculations++;
      const m1=mode==='chart'?expected.data:mode==='experimental'?expected.data.existing.m1:expected.data.m1;
      check(m1.chart.candidates.length===entry.expectedCandidates,'PILOT_BOUNDARY_CANDIDATE_CHANGED');
      for(const output of ['json','text']){
        const expectedBytes=output==='json'?JSON.stringify(expected,null,2)+'\n':renderOfflineText(expected);
        for(const tz of ['UTC','Asia/Seoul'])jobs.push({timezone:tz,execute:async()=>{
          const result=await spawn([...args,'--output',output],tz);
          const outputPath=`actual/${entry.id}/${mode}/${output}-${tz.replace('/','_')}.${output==='json'?'json':'txt'}`;
          await writeNew(target,outputPath,result.stdout);
          if(result.stderr)await writeNew(target,outputPath+'.stderr.txt',result.stderr);
          receipts.push({caseId:entry.id,mode,output,timezone:tz,status:result.status===0&&result.stderr===''&&result.stdout===expectedBytes?'PASS':'FAIL',stdoutPath:outputPath,stdoutSha256:digest(result.stdout),candidateCount:m1.chart.candidates.length});
          check(result.status===0&&result.stderr===''&&result.stdout===expectedBytes,'PILOT_DETACHED_RESULT_MISMATCH');
        }});
      }
    }
    for(const tz of ['UTC','Asia/Seoul']){
      const group=jobs.filter(job=>job.timezone===tz);let cursor=0;
      const settled=await Promise.allSettled(Array.from({length:2},async()=>{while(cursor<group.length)await group[cursor++].execute();}));
      const failure=settled.find(result=>result.status==='rejected');if(failure)throw failure.reason;
    }
    const valid=['--mode','chart','--attachment',data,'--output','json',...policy,...cases[0].input];
    const changed=(name,value)=>{const args=[...valid];args[args.indexOf(name)+1]=value;return args;};
    const without=name=>{const args=[...valid];args.splice(args.indexOf(name),2);return args;};
    const badCases=[
      ['INVALID_GREGORIAN_DATE',changed('--date','2026-02-30'),'CALCULATION','OFFLINE_CALCULATION_REJECTED'],['BEFORE_SUPPORTED_RANGE',changed('--date','1988-12-31'),'CALCULATION','OUT_OF_PROFILE_COVERAGE'],['AFTER_SUPPORTED_RANGE',changed('--date','2027-01-01'),'CALCULATION','OUT_OF_PROFILE_COVERAGE'],
      ['MISSING_TIME',without('--time'),'INPUT','OFFLINE_INPUT_REJECTED'],['UNAPPROVED_CLOCK',changed('--clock-policy','UNAPPROVED'),'CALCULATION','OFFLINE_CALCULATION_REJECTED'],['DATA_PIN_OVERRIDE',[...valid,'--manifest-sha',BASELINE_PIN],'INPUT','OFFLINE_INPUT_REJECTED'],
      ['EXPERIMENT_WITHOUT_POLICY',changed('--mode','experimental'),'INPUT','OFFLINE_INPUT_REJECTED'],['UNKNOWN_ARGUMENT',[...valid,'--unknown','x'],'INPUT','OFFLINE_INPUT_REJECTED'],
    ];
    for(const [id,args,phase,code]of badCases){const result=await spawn(args);await writeNew(target,`rejected/${id}.stdout.txt`,result.stdout);await writeNew(target,`rejected/${id}.stderr.txt`,result.stderr);check(result.status===1&&result.stdout===''&&result.stderr===JSON.stringify({status:'REJECTED',phase,code})+'\n','PILOT_REJECTION_CHANGED');receipts.push({caseId:id,status:'REJECTED_AS_REQUIRED',phase,code,stderrPath:`rejected/${id}.stderr.txt`,stderrSha256:digest(result.stderr)});}
    const pathRejections=[
      ['RESTORE_INSIDE_BACKUP',()=>restoreArtifact({artifactDirectory:engine,outDir:join(engine,'child')})],
      ['RESTORE_DATA_INSIDE_ENGINE_TARGET',()=>restoreArtifact({artifactDirectory:engine,outDir:join(directory,'negative-engine'),attachmentDirectory:data,privateDataOut:join(directory,'negative-engine','.private','data')})],
      ['ATTACH_INSIDE_SOURCE',()=>attachPrivateData({candidateDirectory:attachmentDirectory,outDir:join(attachmentDirectory,'.private','child')})],
      ['RESTORE_OVER_EXISTING',()=>restoreArtifact({artifactDirectory:engine,outDir:engine})],
    ];
    for(const [id,action]of pathRejections){let rejected=false;try{await action();}catch(error){rejected=/OVERLAP|DESTINATION_ALREADY_EXISTS/.test(error.message);}check(rejected,'PILOT_PATH_REJECTION_FAILED');receipts.push({caseId:id,status:'REJECTED_AS_REQUIRED'});}
    await verifyArtifact(engine);await verifyAttachment(data);await verifyArtifact(artifactDirectory);await verifyAttachment(attachmentDirectory);
    check(digest(await readFile(join(artifactDirectory,'artifact-manifest.json')))===originalEngineHash&&digest(await readFile(join(attachmentDirectory,'attachment.json')))===originalDataHash,'PILOT_SOURCE_CHANGED');
    const receipt={schemaVersion:'manseryeok-offline-internal-pilot-v1',status:'PASS',sourceRevision:artifact.sourceRevision,sourceState:artifact.sourceState,runtime:process.versions.node,artifactManifestSha256:originalEngineHash,attachmentManifestSha256:originalDataHash,dataPin:attachment.expectedManifestSha256,
      rightsStatus:'RIGHTS_BLOCKED',distribution:'PRIVATE_NO_REDISTRIBUTION',privateDataPublished:false,apiRequests:0,sourceWrites:0,detachedTemporaryDirectory:true,guards:['NETWORK_DENIED','KEY_ACCESS_DENIED','FILE_WRITES_DENIED','DEVELOPER_SOURCE_IMPORT_DENIED','FALLBACK_FIXTURES_DENIED','CHILD_PROCESS_IMPORT_DENIED'],successfulRuns:jobs.length,rejectedRuns:badCases.length,rejectedPathOperations:pathRejections.length,sourceReferenceCalculations:referenceCalculations,restoredArtifactVerified:true,sourceArtifactsUnchanged:true,receipts:receipts.sort((a,b)=>JSON.stringify(a).localeCompare(JSON.stringify(b),'en'))};
    await writeNew(target,'receipt.json',JSON.stringify(receipt,null,2)+'\n');return receipt;
  }catch(error){
    await writeNew(target,'failure-receipt.json',JSON.stringify({schemaVersion:'manseryeok-offline-internal-pilot-v1',status:'FAIL',sourceRevision:artifact.sourceRevision,artifactManifestSha256:originalEngineHash,code:/^[A-Z0-9_]+$/.test(error.message)?error.message:'INTERNAL_PILOT_REJECTED'},null,2)+'\n');throw error;
  }finally{
    const target=resolve(directory),rel=relative(resolve(tmpdir()),target);
    check(rel&&!isAbsolute(rel)&&rel!=='..'&&!rel.startsWith('..'+sep)&&basename(target).startsWith('manseryeok-detached-pilot-'),'UNSAFE_PILOT_CLEANUP_TARGET');
    await rm(target,{recursive:true,force:true});
  }
}
export async function main(args=process.argv.slice(2)){
  try{const options=parsePairs(args,['--artifact','--attachment','--out']);check(options['--artifact']&&options['--attachment']&&options['--out'],'EXPLICIT_PRIVATE_PILOT_PATHS_REQUIRED');const receipt=await runInternalPilot({artifactDirectory:options['--artifact'],attachmentDirectory:options['--attachment'],outDir:options['--out']});process.stdout.write(JSON.stringify({status:receipt.status,successfulRuns:receipt.successfulRuns,rejectedRuns:receipt.rejectedRuns,artifactManifestSha256:receipt.artifactManifestSha256,sourceRevision:receipt.sourceRevision})+'\n');}
  catch{process.stderr.write('OFFLINE_INTERNAL_PILOT_REJECTED\n');process.exitCode=1;}
}
if(process.argv[1]&&import.meta.url===pathToFileURL(resolve(process.argv[1])).href)await main();
