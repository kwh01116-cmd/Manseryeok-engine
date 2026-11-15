// Public contract tests use synthetic data only; accepted private pins are not bypassed.
import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp,rm,readFile,writeFile,mkdir} from 'node:fs/promises';
import {join,resolve,relative,isAbsolute,sep,basename} from 'node:path';
import {tmpdir} from 'node:os';
import {pathToFileURL} from 'node:url';
import {spawnSync} from 'node:child_process';
import {buildExtendedArtifact} from '../scripts/offline/build-v3.mjs';
import {verifyExtendedArtifact,verifyExtendedAttachment,EXTENDED_PROFILES,EXTENDED_ARTIFACT_SCHEMA,EXTENDED_ATTACHMENT_SCHEMA,EXTENDED_DATA_FILES,EXTENDED_DATA_RIGHTS,BOUNDARY_FILES,ACCEPTED_BOUNDARY_PIN,ACCEPTED_ANNUAL_SOLAR_PIN,ACCEPTED_BOUNDARY_TREE_PIN} from '../scripts/offline/integrity-v3.mjs';
import {restoreExtendedArtifact} from '../scripts/offline/restore-v3.mjs';
import {attachExtendedPrivateData} from '../scripts/offline/attach-v3.mjs';
import {parseExtendedOfflineArgs,calculateExtendedOffline} from '../scripts/offline/run-v3.mjs';
import {parseIntegratedOfflineArgs,calculateIntegratedOffline} from '../scripts/offline/run-v2.mjs';
import {verifyIntegratedArtifact} from '../scripts/offline/integrity-v2.mjs';
import {verifyArtifact,BASELINE_PIN,DATA_FILES,filesBelow,hashFiles} from '../scripts/offline/integrity.mjs';
import {writeOfflineGuards,cleanOfflineEnvironment} from '../scripts/offline/guards.mjs';
import {createLocalChartProfile} from '../scripts/kasi/local-chart.mjs';
import {syntheticLocalChartCandidate,writeSyntheticLocalChartCandidate} from './fixtures/kasi-local-chart-synthetic.mjs';
import {syntheticHistoricalProfileCandidate,HISTORICAL_FIRST_NOON_EXPECTATION} from './fixtures/historical-profile-synthetic.mjs';
const repo=resolve(import.meta.dirname,'..');
const historical=['--profile','kasi-api-1962-1986-standard-local-v1','--calendar','GREGORIAN','--date','1980-06-01','--time','12:00','--clock-policy','KR_API_PUBLISHED_KST_HISTORICAL_1962_1986_NO_DST_V1','--day-rollover','CIVIL_MIDNIGHT','--hour-stem-reference','SELECTED_DAY_PILLAR','--report-profile','KASI-LOCAL-EXTENDED-CALENDAR-ANALYSIS-V01','--detail','summary'];
const modern=['--profile','kasi-api-1989-2026-local-v1','--calendar','GREGORIAN','--date','2026-06-01','--time','12:00','--clock-policy','KR_API_PUBLISHED_KST_MODERN_1988_POST_DST_V1','--day-rollover','CIVIL_MIDNIGHT','--hour-stem-reference','SELECTED_DAY_PILLAR'];
const args=(base=historical)=>['--mode','extended-product','--attachment','private input',...base,'--output','json'];

test('extended wrapper fixes profile and data choices without making history a legacy default',()=>{
 assert.deepEqual(EXTENDED_PROFILES,['kasi-api-1962-1986-standard-local-v1','kasi-api-1989-2027-solar-local-v1']);
 const parsed=parseExtendedOfflineArgs(args());assert.equal(parsed.mode,'extended-product');assert.equal(parsed.options.profileId,EXTENDED_PROFILES[0]);assert.equal(parsed.options.directory,join(resolve('private input'),'base'));assert.equal(parsed.options.expectedManifestSha256,BASELINE_PIN);assert.equal(parsed.options.request.date,'1980-06-01');
 const future=[...historical];future[future.indexOf('--profile')+1]=EXTENDED_PROFILES[1];future[future.indexOf('--clock-policy')+1]='KR_API_PUBLISHED_KST_MODERN_1989_2027_NO_DST_V2';future[future.indexOf('--date')+1]='2027-06-01';
 const result=parseExtendedOfflineArgs(args(future));assert.equal(result.options.annualSolarDirectory,join(resolve('private input'),'boundary'));
 assert.equal(EXTENDED_DATA_FILES.length,12);assert.equal(BOUNDARY_FILES.length,5);assert.equal(EXTENDED_DATA_RIGHTS.wholeAttachmentDistribution,'UNRESOLVED');
});

test('extended wrapper rejects data-pin overrides, unselected profile/detail and unsupported lower policies',()=>{
 for(const extra of [['--candidate','x'],['--manifest-sha',BASELINE_PIN],['--solar-extension','x'],['--unknown','x']])assert.throws(()=>parseExtendedOfflineArgs([...args(),...extra]));
 for(const name of ['--profile','--report-profile','--detail']){const value=args(),i=value.indexOf(name);value.splice(i,2);assert.throws(()=>parseExtendedOfflineArgs(value),name);}
 const value=args();value[value.indexOf('--profile')+1]='kasi-api-1950-2100-any-clock';assert.throws(()=>parseExtendedOfflineArgs(value));
 assert.throws(()=>parseExtendedOfflineArgs(['--mode','chart','--attachment','x',...historical,'--output','json']));
});

test('v3 legacy dispatch retains the original modern chart result rather than widening its scope',()=>{
 const original=['--mode','chart','--attachment',join(resolve('private input'),'base'),...modern,'--output','json'];
 const old=parseIntegratedOfflineArgs(original),next=parseExtendedOfflineArgs(['--mode','chart','--attachment','private input',...modern,'--output','json']);
 assert.deepEqual(next.options,old.options);
 const fixture=syntheticLocalChartCandidate(),profile=createLocalChartProfile(fixture.loaded,{profileId:'kasi-api-2026-local-v1',expectedManifestSha256:fixture.expectedManifestSha256});
 const a=calculateIntegratedOffline({...old,chartProfile:profile}),b=calculateExtendedOffline({...next,chartProfile:profile});assert.deepEqual(b,a);assert.equal(b.schemaVersion,'manseryeok-offline-result-v1');
});

test('import API fallback consumes one issued historical M1 with only its explicit report selection',()=>{
 const fixture=syntheticHistoricalProfileCandidate(),context=createLocalChartProfile(fixture.loaded,{profileId:EXTENDED_PROFILES[0],expectedManifestSha256:fixture.expectedManifestSha256});
 const input=[...historical];input[input.indexOf('--date')+1]='1962-01-01';const parsed=parseExtendedOfflineArgs(args(input));let m1Calls=0;
 const spy={calculate(request){m1Calls++;return context.calculate(request);}};
 const value=calculateExtendedOffline({...parsed,chartProfile:spy,contextProfile:context});
 assert.equal(m1Calls,1);assert.equal(value.schemaVersion,'manseryeok-offline-extended-result-v3');assert.equal(value.data.status,'EXTENDED_CALENDAR_ANALYSIS_ONLY');
 assert.equal(value.data.m1.profile.id,EXTENDED_PROFILES[0]);assert.deepEqual(value.data.facts.candidates[0].pillars.map(p=>p.stem+p.branch),HISTORICAL_FIRST_NOON_EXPECTATION);
 assert.equal(value.data.detailed.summary,value.data.summary);assert.equal(value.data.m5.status,'HOLD');assert.equal(value.data.monthly.status,'NOT_REQUESTED');
});

test('extended wrapper preserves bounded missing-data states without treating them as successful issued reports',()=>{
 const held={schemaVersion:'kasi-local-extended-calendar-analysis-v1',status:'NEEDS_DATA',reason:'NO_LUNAR_MAPPING',m1:{status:'NEEDS_DATA'}};
 const value=calculateExtendedOffline({mode:'extended-product',options:{request:{}},reportProfile:{calculate:()=>held}});assert.equal(value.data,held);assert.equal(value.data.status,'NEEDS_DATA');
 assert.throws(()=>calculateExtendedOffline({mode:'extended-product',options:{request:{}},reportProfile:{calculate:()=>({...held,m1:{status:'OK'}})}}),/EXTENDED_PENDING_RESULT_CONTRACT/);
 assert.throws(()=>calculateExtendedOffline({mode:'extended-product',options:{request:{}},reportProfile:{calculate:()=>({schemaVersion:held.schemaVersion,status:'EXTENDED_CALENDAR_ANALYSIS_ONLY'})}}),/ISSUED_EXTENDED_REPORT_REQUIRED/);
});

test('v3 artifact is relocatable, reproducible, data-free, and rejects forged attachment pins',async t=>{
 const directory=await mkdtemp(join(tmpdir(),'manseryeok-offline-extended-public-'));
 try{
  const engine=join(directory,'engine one'),second=join(directory,'engine two'),restored=join(directory,'restored'),fake=join(directory,'.private','fake-data');
  const manifest=await buildExtendedArtifact({outDir:engine});await buildExtendedArtifact({outDir:second});
  await t.test('fresh emit and fixed vendor notices reproduce without acquisition or private data',async()=>{
   assert.equal(await readFile(join(engine,'artifact-manifest.json'),'utf8'),await readFile(join(second,'artifact-manifest.json'),'utf8'));
   assert.equal((await verifyExtendedArtifact(engine)).schemaVersion,EXTENDED_ARTIFACT_SCHEMA);assert.equal(manifest.runtime.nodeMajor,22);assert.equal(manifest.runtime.externalDependencies,0);assert.equal(manifest.vendor.packages.length,8);
   const names=await filesBelow(engine);for(const path of ['scripts/kasi/local-extended-report.mjs','scripts/kasi/local-extended-chart.mjs','scripts/kasi/annual-solar-extension.mjs','vendor/fast-xml-parser.cjs'])assert.ok(names.includes(path),path);
   assert.ok(names.every(path=>!/(?:\.private|candidate\.json|collector\.js|network\.js|Fixtures|node_modules)/.test(path)));
   for(const path of names)assert.equal((await readFile(join(engine,path),'utf8')).includes(repo),false,path);
   await assert.rejects(verifyArtifact(engine),/ARTIFACT_CONTRACT/);await assert.rejects(verifyIntegratedArtifact(engine),/INTEGRATED_ARTIFACT_CONTRACT/);
  });
  await t.test('outside restore keeps bytes and rejects overlapping/existing targets',async()=>{
   await restoreExtendedArtifact({artifactDirectory:engine,outDir:restored});assert.deepEqual((await verifyExtendedArtifact(restored)).files,manifest.files);
   await assert.rejects(restoreExtendedArtifact({artifactDirectory:engine,outDir:join(engine,'nested')}),/OVERLAP/);
   await assert.rejects(restoreExtendedArtifact({artifactDirectory:engine,outDir:restored}),/DESTINATION_ALREADY_EXISTS/);
  });
  await t.test('self-consistent fake descriptors cannot replace the independent accepted corpus',async()=>{
   const candidate=join(fake,'base'),boundary=join(fake,'boundary'),fixture=syntheticLocalChartCandidate();await writeSyntheticLocalChartCandidate(candidate,fixture);await mkdir(boundary,{recursive:true});
   for(const path of BOUNDARY_FILES){await mkdir(join(boundary,path,'..'),{recursive:true});await writeFile(join(boundary,path),'synthetic non-source');}
   const descriptor={schemaVersion:EXTENDED_ATTACHMENT_SCHEMA,version:'0.3.0',baseManifestContentSha256:BASELINE_PIN,boundarySupplementContentSha256:ACCEPTED_BOUNDARY_PIN,annualSolarContentSha256:ACCEPTED_ANNUAL_SOLAR_PIN,boundarySourceTreeSha256:ACCEPTED_BOUNDARY_TREE_PIN,rights:{...EXTENDED_DATA_RIGHTS},optInRequired:true,files:await hashFiles(fake,EXTENDED_DATA_FILES)};
   await writeFile(join(fake,'attachment.json'),JSON.stringify(descriptor));await assert.rejects(verifyExtendedAttachment(fake),/MANIFEST_DIGEST_CHANGED/);
   await assert.rejects(attachExtendedPrivateData({candidateDirectory:candidate,boundaryDirectory:boundary,outDir:join(directory,'.private','bad-copy')}),/MANIFEST_DIGEST_CHANGED/);
  });
  await t.test('detached CLI has clean safe errors and rejects arbitrary input and absent accepted data',async()=>{
   const {preload}=await writeOfflineGuards(directory,{forbiddenRoot:repo});const env=cleanOfflineEnvironment('UTC');for(const key of Object.keys(env))if(/^path$/i.test(key))delete env[key];env.PATH='';
   const run=a=>spawnSync(process.execPath,['--import',pathToFileURL(preload).href,join(restored,'run.mjs'),...a],{cwd:directory,env,windowsHide:true,encoding:'utf8',timeout:30000,maxBuffer:2_000_000});
   const input=run([...args(),'--manifest-sha',BASELINE_PIN]);assert.equal(input.status,1);assert.equal(input.stdout,'');assert.deepEqual(JSON.parse(input.stderr),{status:'REJECTED',phase:'INPUT',code:'OFFLINE_INPUT_REJECTED'});
   const dataArgs=args(),index=dataArgs.indexOf('--attachment');dataArgs[index+1]=fake;const data=run(dataArgs);assert.equal(data.status,1);assert.equal(data.stdout,'');assert.deepEqual(JSON.parse(data.stderr),{status:'REJECTED',phase:'DATA',code:'OFFLINE_DATA_REJECTED'});
  });
  await t.test('payload and license tampering are not accepted',async()=>{
   const manifestPath=join(second,'artifact-manifest.json'),original=await readFile(manifestPath,'utf8');await writeFile(manifestPath,JSON.stringify({...JSON.parse(original),sourceRevision:'not-a-git-sha'}));await assert.rejects(verifyExtendedArtifact(second),/EXTENDED_SOURCE_IDENTITY_CONTRACT/);await writeFile(manifestPath,original);
   const license=manifest.vendor.packages[0].licensePath;await writeFile(join(second,license),'changed notice');await assert.rejects(verifyExtendedArtifact(second),/ARTIFACT_CONTENT_CHANGED/);
  });
 }finally{const absolute=resolve(directory),r=relative(resolve(tmpdir()),absolute);assert.ok(r&&!isAbsolute(r)&&r!=='..'&&!r.startsWith('..'+sep)&&basename(absolute).startsWith('manseryeok-offline-extended-public-'));await rm(absolute,{recursive:true,force:true});}
});
