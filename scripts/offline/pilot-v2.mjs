/** Explicit private acceptance utility; excluded from the shipped runtime artifact. */
import {mkdtemp,rm,readFile} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join,resolve,relative,isAbsolute,sep,basename} from 'node:path';
import {pathToFileURL} from 'node:url';
import {execFile} from 'node:child_process';
import {promisify} from 'node:util';
import {restoreIntegratedArtifact} from './restore-v2.mjs';
import {parseIntegratedOfflineArgs,calculateIntegratedOffline,renderIntegratedOfflineText} from './run-v2.mjs';
import {verifyIntegratedArtifact} from './integrity-v2.mjs';
import {loadLocalChartProfile} from '../kasi/local-chart.mjs';
import {assertNode22,check,parsePairs,verifyAttachment,digest,BASELINE_PIN,createNewDirectory,writeNew,pathsOverlap} from './integrity.mjs';
import {writeOfflineGuards,cleanOfflineEnvironment} from './guards.mjs';
const execute=promisify(execFile),repo=resolve(import.meta.dirname,'../..');
const common=['--profile','kasi-api-1989-2026-local-v1','--clock-policy','KR_API_PUBLISHED_KST_MODERN_1988_POST_DST_V1','--day-rollover','CIVIL_MIDNIGHT','--hour-stem-reference','SELECTED_DAY_PILLAR'];
const selected=['--report-profile','KASI-LOCAL-PRODUCT-ANALYSIS-V01','--m5-policy','M5-WINTER-WOOD-WARMING-CANDIDATE-V01'];
const temporal=['--luck-profile','M7-TRADITIONAL-YEAR-STEM-JIE-3D-V01','--dayun','true','--traditional-sex','MALE','--dayun-count','3','--seyun-year','2026','--monthly-policy','M7-MONTHLY-TWELVE-JIE-PUBLISHED-MINUTE-V01','--monthly-year','2025','--monthly-query-minute','2026-06-01T12:00'];
const zeroCounts=()=>({CANDIDATE_UNDER_POLICY:0,HOLD:0});
export async function runIntegratedInternalPilot({artifactDirectory,attachmentDirectory,outDir}){
  assertNode22();const artifact=await verifyIntegratedArtifact(artifactDirectory),attachment=await verifyAttachment(attachmentDirectory);
  const artifactPin=digest(await readFile(join(artifactDirectory,'artifact-manifest.json'))),attachmentPin=digest(await readFile(join(attachmentDirectory,'attachment.json')));
  const target=await createNewDirectory(outDir,{privateOnly:true}),directory=await mkdtemp(join(tmpdir(),'manseryeok-integrated-detached-'));
  check(!pathsOverlap(repo,directory),'PILOT_TEMP_MUST_BE_OUTSIDE_REPOSITORY');
  const receipts=[],caseFacts=[],timezoneDigests=new Map(),m5States=zeroCounts();let referenceCalculations=0,successes=0;
  try{
    const engine=join(directory,'restored engine'),data=join(directory,'.private','restored data');
    await restoreIntegratedArtifact({artifactDirectory,outDir:engine,attachmentDirectory,privateDataOut:data});
    const {preload}=await writeOfflineGuards(directory,{forbiddenRoot:repo});
    const envFor=tz=>{const env=cleanOfflineEnvironment(tz);for(const name of Object.keys(env))if(/^PATH$/i.test(name))delete env[name];env.PATH='';return env;};
    const spawn=async(args,tz='UTC',entry=join(engine,'run.mjs'))=>{try{const value=await execute(process.execPath,['--import',pathToFileURL(preload).href,entry,...args],{cwd:directory,env:envFor(tz),timeout:45000,maxBuffer:16_000_000});return {...value,status:0};}catch(error){return {stdout:error.stdout??'',stderr:error.stderr??'',status:typeof error.code==='number'?error.code:-1};}};
    const dates=JSON.parse(await readFile(join(data,'candidate.json'),'utf8')).dates,ordinary=dates.find(row=>row.solarDate==='1992-11-24');check(ordinary,'VIRTUAL_LUNAR_ROW_REQUIRED');
    const cases=[
      {id:'WINTER_WOOD_CANDIDATE',input:['--calendar','GREGORIAN','--date','1992-11-24','--time','00:30'],expectedCandidates:1,expectedM5:'CANDIDATE_UNDER_POLICY'},
      {id:'ORDINARY_HOLD',input:['--calendar','GREGORIAN','--date','2026-06-01','--time','12:00'],expectedCandidates:1,expectedM5:'HOLD'},
      {id:'OFFICER',input:['--calendar','GREGORIAN','--date','2026-01-08','--time','12:00'],expectedCandidates:1},
      {id:'WEALTH',input:['--calendar','GREGORIAN','--date','2026-01-04','--time','12:00'],expectedCandidates:1},
      {id:'LICHUN',input:['--calendar','GREGORIAN','--date','2026-02-04','--time','05:02'],expectedCandidates:2},
      {id:'DERIVED_B',input:['--calendar','GREGORIAN','--date','2026-04-17','--time','20:49'],expectedCandidates:1},
      {id:'LUNAR_EQUIVALENT',input:['--calendar','KOREAN_LUNAR','--lunar-year',String(ordinary.lunarYear),'--lunar-month',String(ordinary.lunarMonth),'--lunar-day',String(ordinary.lunarDay),'--leap',String(ordinary.leap),'--time','00:30'],expectedCandidates:1,expectedM5:'CANDIDATE_UNDER_POLICY'},
      {id:'M7_AND_TWELVE_MONTHS',input:['--calendar','GREGORIAN','--date','1992-11-24','--time','00:30'],extra:temporal,expectedCandidates:1,expectedM5:'CANDIDATE_UNDER_POLICY'},
      ...[['CIVIL_MIDNIGHT','SELECTED_DAY_PILLAR'],['CIVIL_MIDNIGHT','CIVIL_DATE_DAY_PILLAR'],['ZI_START','SELECTED_DAY_PILLAR'],['ZI_START','CIVIL_DATE_DAY_PILLAR']].map(([rollover,reference])=>({id:'LATE_'+rollover+'_'+reference,input:['--calendar','GREGORIAN','--date','1992-11-24','--time','23:30'],overrides:{'--day-rollover':rollover,'--hour-stem-reference':reference},expectedCandidates:1})),
    ];
    const sourceProfile=await loadLocalChartProfile({directory:attachmentDirectory,expectedManifestSha256:BASELINE_PIN,profileId:'kasi-api-1989-2026-local-v1'});let ordinarySemantic;
    for(const entry of cases){
      const chosen=[...common];for(const [name,value]of Object.entries(entry.overrides??{}))chosen[chosen.indexOf(name)+1]=value;
      const args=['--mode','product','--attachment',data,...chosen,...entry.input,...selected,...(entry.extra??[])];
      const parsed=parseIntegratedOfflineArgs([...args,'--detail','summary','--output','json']),expected=calculateIntegratedOffline({...parsed,chartProfile:sourceProfile});referenceCalculations++;
      const value=expected.data;check(value.base.existing.facts.candidates.length===entry.expectedCandidates,'PILOT_CORRELATED_CANDIDATE_COUNT');
      if(entry.expectedM5)check(value.m5.candidates.every(c=>c.status===entry.expectedM5),'PILOT_M5_CANDIDATE_HOLD_CONTRACT');
      if(entry.id==='DERIVED_B')check(value.base.existing.seasonal.candidates[0].judgment.alternatives.length===2&&value.base.innerPatterns.candidates.length===1,'PILOT_SEASON_ALTERNATIVES_CHANGED_PARENT');
      if(entry.id==='M7_AND_TWELVE_MONTHS')check(value.monthly.yearTable.rows.length===12&&value.monthly.yearTable.rows.every(r=>r.status==='RESOLVED_UNDER_POLICY'||r.status==='OK'),'PILOT_COMPLETE_MONTHLY_YEAR_REQUIRED');
      if(['WINTER_WOOD_CANDIDATE','LUNAR_EQUIVALENT'].includes(entry.id)){const semantic=JSON.stringify({pillars:value.base.existing.facts.candidates.map(c=>c.pillars.map(p=>[p.stem,p.branch])),inner:value.base.innerPatterns.candidates.map(c=>c.selection),m5:value.m5.candidates.map(c=>[c.status,c.reasonCodes,c.candidateElements]),gongmang:value.gongmang.map(g=>g.voidBranches),summary:value.summary.sections.map(s=>s.items.map(i=>i.text))});if(ordinarySemantic===undefined)ordinarySemantic=semantic;else check(ordinarySemantic===semantic,'PILOT_GREGORIAN_LUNAR_MEANING_CHANGED');}
      for(const c of value.m5.candidates)m5States[c.status]++;
      caseFacts.push({caseId:entry.id,candidates:entry.expectedCandidates,m5States:value.m5.candidates.map(c=>c.status),m4Selection:value.base.innerPatterns.candidates.map(c=>c.selection.status),gongmang:value.gongmang.map(c=>({dayPillar:c.dayPillar,voidBranches:c.voidBranches})),seasonalAlternatives:value.base.existing.seasonal.candidates.map(c=>c.judgment.alternatives.length),monthlyYearStatus:value.monthly.yearTable?.status??null});
      const variants=[{id:'json',format:'json',detail:'summary',bytes:JSON.stringify(expected,null,2)+'\n'},{id:'summary',format:'text',detail:'summary',bytes:renderIntegratedOfflineText(expected,{detail:'summary'})},{id:'detailed',format:'text',detail:'detailed',bytes:renderIntegratedOfflineText(expected,{detail:'detailed'})}];
      for(const tz of ['UTC','Asia/Seoul'])for(const view of variants){
        const result=await spawn([...args,'--detail',view.detail,'--output',view.format],tz),path=`actual/${entry.id}/${view.id}-${tz.replace('/','_')}.${view.format==='json'?'json':'txt'}`;
        await writeNew(target,path,result.stdout);await writeNew(target,path+'.stderr.txt',result.stderr);
        const pass=result.status===0&&result.stderr===''&&result.stdout===view.bytes;receipts.push({caseId:entry.id,view:view.id,timezone:tz,status:pass?'PASS':'FAIL',stdoutPath:path,stdoutSha256:digest(result.stdout),stderrSha256:digest(result.stderr),exitCode:result.status});check(pass,'PILOT_DETACHED_INTEGRATED_RESULT_MISMATCH');
        const key=entry.id+':'+view.id;if(timezoneDigests.has(key))check(timezoneDigests.get(key)===digest(result.stdout),'PILOT_TIMEZONE_BYTES_CHANGED');else timezoneDigests.set(key,digest(result.stdout));successes++;
      }
    }
    const legacy=[['chart',[]],['explain',['--m2-profile','m2-basic-classification-local-v1']],['evidence',['--synthesis-profile','M3-LIMITED-ABSENT-ROOT-RESOURCE-SYNTHESIS-V01']],['experimental',['--experimental-policy','EXPERIMENTAL-WEIGHTED-SUPPORT-LOCAL-NO-TRANSFORMATION-V01']]];
    for(const [mode,extra]of legacy){const args=['--mode',mode,'--attachment',data,...common,...cases[1].input,...extra],parsed=parseIntegratedOfflineArgs([...args,'--output','json']),expected=calculateIntegratedOffline({...parsed,chartProfile:sourceProfile});referenceCalculations++;
      for(const format of ['json','text']){const result=await spawn([...args,'--output',format]),bytes=format==='json'?JSON.stringify(expected,null,2)+'\n':renderIntegratedOfflineText(expected),path=`legacy/${mode}.${format==='json'?'json':'txt'}`;await writeNew(target,path,result.stdout);await writeNew(target,path+'.stderr.txt',result.stderr);check(result.status===0&&result.stderr===''&&result.stdout===bytes,'PILOT_LEGACY_MODE_CHANGED');receipts.push({caseId:'LEGACY_'+mode,view:format,timezone:'UTC',status:'PASS',stdoutPath:path,stdoutSha256:digest(result.stdout),exitCode:0});successes++;}
    }
    const valid=['--mode','product','--attachment',data,...common,...cases[1].input,...selected,'--detail','summary','--output','json'];
    const changed=(name,value)=>{const args=[...valid];args[args.indexOf(name)+1]=value;return args;},without=name=>{const args=[...valid];args.splice(args.indexOf(name),2);return args;};
    const badCases=[['INVALID_DATE',changed('--date','2026-02-30'),'CALCULATION','OFFLINE_CALCULATION_REJECTED'],['BEFORE_RANGE',changed('--date','1988-12-31'),'CALCULATION','OUT_OF_PROFILE_COVERAGE'],['AFTER_RANGE',changed('--date','2027-01-01'),'CALCULATION','OUT_OF_PROFILE_COVERAGE'],['MISSING_TIME',without('--time'),'INPUT','OFFLINE_INPUT_REJECTED'],['MISSING_M5_POLICY',without('--m5-policy'),'INPUT','OFFLINE_INPUT_REJECTED'],['MISSING_VIEW',without('--detail'),'INPUT','OFFLINE_INPUT_REJECTED'],['PIN_OVERRIDE',[...valid,'--manifest-sha',BASELINE_PIN],'INPUT','OFFLINE_INPUT_REJECTED'],['UNKNOWN_ARGUMENT',[...valid,'--unknown','x'],'INPUT','OFFLINE_INPUT_REJECTED']];
    for(const [id,args,phase,code]of badCases){const result=await spawn(args),path='rejected/'+id;await writeNew(target,path+'.stdout.txt',result.stdout);await writeNew(target,path+'.stderr.txt',result.stderr);check(result.status===1&&result.stdout===''&&result.stderr===JSON.stringify({status:'REJECTED',phase,code})+'\n','PILOT_INTEGRATED_REJECTION_CHANGED');receipts.push({caseId:id,status:'REJECTED_AS_REQUIRED',phase,code,stdoutPath:path+'.stdout.txt',stderrPath:path+'.stderr.txt'});}
    const pathCases=[['NESTED_RESTORE',()=>restoreIntegratedArtifact({artifactDirectory:engine,outDir:join(engine,'nested')})],['EXISTING_DESTINATION',()=>restoreIntegratedArtifact({artifactDirectory:engine,outDir:engine})],['OVERLAPPING_PRIVATE_TARGETS',()=>restoreIntegratedArtifact({artifactDirectory:engine,outDir:join(directory,'bad'),attachmentDirectory:data,privateDataOut:join(directory,'bad','.private','data')})]];
    for(const [id,action]of pathCases){let rejected=false;try{await action();}catch(error){rejected=/OVERLAP|DESTINATION_ALREADY_EXISTS/.test(error.message);}check(rejected,'PILOT_INTEGRATED_PATH_GUARD');receipts.push({caseId:id,status:'REJECTED_AS_REQUIRED'});}
    await verifyIntegratedArtifact(engine);await verifyAttachment(data);await verifyIntegratedArtifact(artifactDirectory);await verifyAttachment(attachmentDirectory);check(digest(await readFile(join(artifactDirectory,'artifact-manifest.json')))===artifactPin&&digest(await readFile(join(attachmentDirectory,'attachment.json')))===attachmentPin,'PILOT_SOURCE_ARTIFACT_OR_ATTACHMENT_CHANGED');
    const receipt={schemaVersion:'manseryeok-offline-integrated-internal-pilot-v2',status:'PASS',sourceRevision:artifact.sourceRevision,sourceState:artifact.sourceState,runtime:process.versions.node,artifactManifestSha256:artifactPin,attachmentManifestSha256:attachmentPin,dataPin:attachment.expectedManifestSha256,
      rightsStatus:'RIGHTS_BLOCKED',distribution:'PRIVATE_NO_REDISTRIBUTION',containsPersonalBirthRecords:false,apiRequests:0,keysUsed:0,sourceWrites:0,npmOnRuntimePath:false,gitOnRuntimePath:false,detachedTemporaryDirectory:true,tempDirectoryRetained:false,guards:['NETWORK_DENIED','KEY_ACCESS_DENIED','FILE_WRITES_DENIED','DEVELOPER_SOURCE_IMPORT_DENIED','FALLBACK_FIXTURES_DENIED','CHILD_PROCESS_IMPORT_DENIED'],sourceReferenceCalculations:referenceCalculations,referenceComparisons:'PACKAGING_AND_DATA_LINK_CONSISTENCY_NOT_INDEPENDENT_M5_VALIDITY',gregorianLunarMeaningEqual:true,logicalProductCases:cases.length,successfulRuns:successes,rejectedRuns:badCases.length,rejectedPathOperations:pathCases.length,timezoneByteComparisons:timezoneDigests.size,m5StatesForLogicalProductCases:m5States,restoredArtifactVerified:true,sourceArtifactsUnchanged:true,cases:caseFacts,receipts};
    await writeNew(target,'receipt.json',JSON.stringify(receipt,null,2)+'\n');return receipt;
  }catch(error){await writeNew(target,'failure-receipt.json',JSON.stringify({schemaVersion:'manseryeok-offline-integrated-internal-pilot-v2',status:'FAIL',sourceRevision:artifact.sourceRevision,artifactManifestSha256:artifactPin,completedSuccesses:successes,receipts,code:/^[A-Z0-9_]+$/.test(error.message)?error.message:'INTERNAL_INTEGRATED_PILOT_REJECTED'},null,2)+'\n');throw error;}
  finally{const absolute=resolve(directory),rel=relative(resolve(tmpdir()),absolute);check(rel&&!isAbsolute(rel)&&rel!=='..'&&!rel.startsWith('..'+sep)&&basename(absolute).startsWith('manseryeok-integrated-detached-'),'UNSAFE_INTEGRATED_PILOT_CLEANUP_TARGET');await rm(absolute,{recursive:true,force:true});}
}
export async function main(args=process.argv.slice(2)){
  try{const options=parsePairs(args,['--artifact','--attachment','--out']);check(options['--artifact']&&options['--attachment']&&options['--out'],'EXPLICIT_INTEGRATED_PILOT_PATHS_REQUIRED');const receipt=await runIntegratedInternalPilot({artifactDirectory:options['--artifact'],attachmentDirectory:options['--attachment'],outDir:options['--out']});process.stdout.write(JSON.stringify({status:receipt.status,successfulRuns:receipt.successfulRuns,rejectedRuns:receipt.rejectedRuns,sourceRevision:receipt.sourceRevision,artifactManifestSha256:receipt.artifactManifestSha256})+'\n');}
  catch{process.stderr.write('OFFLINE_INTEGRATED_INTERNAL_PILOT_REJECTED\n');process.exitCode=1;}
}
if(process.argv[1]&&import.meta.url===pathToFileURL(resolve(process.argv[1])).href)await main();
