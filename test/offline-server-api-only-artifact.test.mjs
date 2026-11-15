/** Public package tests are data-free. No accepted private row is embedded. */
import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp,rm,readFile,writeFile,mkdir,symlink} from 'node:fs/promises';
import {join,resolve,relative,isAbsolute,sep,basename} from 'node:path';
import {tmpdir} from 'node:os';
import {pathToFileURL} from 'node:url';
import {spawnSync} from 'node:child_process';
import {buildServerOfflineArtifact} from '../scripts/offline/build-v4.mjs';
import {verifyServerOfflineArtifact,verifyServerOfflineDataPack,SERVER_ARTIFACT_SCHEMA,SERVER_ARTIFACT_DATA_FILES} from '../scripts/offline/integrity-v4.mjs';
import {restoreServerOfflineArtifact} from '../scripts/offline/restore-v4.mjs';
import {parseServerOfflineArgs,calculateServerOffline,serverOfflineRejection} from '../scripts/offline/run-v4.mjs';
import {SERVER_API_ONLY_ACCEPTED_PIN} from '../scripts/server-data/constants.mjs';
import {verifyExtendedArtifact} from '../scripts/offline/integrity-v3.mjs';
import {writeOfflineGuards,cleanOfflineEnvironment} from '../scripts/offline/guards.mjs';
const repo=resolve(import.meta.dirname,'..');
const request=()=>({schemaVersion:'manseryeok-server-analysis-request-v1',analysisProfileId:'KASI-SERVER-API-ONLY-ANALYSIS-V01',calendarProfileId:'kasi-api-1989-2026-local-v1',jurisdiction:'KR',timeZone:'Asia/Seoul',calendar:'GREGORIAN',date:'2026-06-01',time:'12:00',policies:{clockPolicyId:'KR_API_PUBLISHED_KST_MODERN_1988_POST_DST_V1',dayRollover:'CIVIL_MIDNIGHT',hourStemReference:'SELECTED_DAY_PILLAR'}});
const args=value=>['--data-pack','operator path','--request-json',JSON.stringify(value??request()),'--output','json','--detail','summary'];

test('v4 CLI fixes data ownership and request schema while retaining explicit null time and policy choices',()=>{
 const parsed=parseServerOfflineArgs(args());assert.equal(parsed.dataDirectory,resolve('operator path'));assert.deepEqual(parsed.request,request());assert.equal(parsed.detail,'summary');assert.equal(parsed.output,'json');
 const unknown=request();unknown.time=null;assert.equal(parseServerOfflineArgs(args(unknown)).request.time,null);
 assert.equal(SERVER_ARTIFACT_DATA_FILES.length,5);assert.equal(SERVER_API_ONLY_ACCEPTED_PIN,'a2bfbf35aff7bb8b11aef277a7be8d5ea5204c786a9142649bec23d27dfd289a');
});

test('v4 CLI rejects missing/duplicate/unknown options, malformed or oversized JSON and fake policies',()=>{
 for(const name of ['--data-pack','--request-json','--output','--detail']){const value=args(),i=value.indexOf(name);value.splice(i,2);assert.throws(()=>parseServerOfflineArgs(value),name);}
 for(const extra of [['--data-pack','another'],['--manifest-sha','0'.repeat(64)],['--candidate','mixed'],['--unknown','x']])assert.throws(()=>parseServerOfflineArgs([...args(),...extra]));
 for(const raw of ['{',JSON.stringify([]),JSON.stringify({...request(),serviceKey:'forbidden'}),' '.repeat(32769)]){const value=args();value[value.indexOf('--request-json')+1]=raw;assert.throws(()=>parseServerOfflineArgs(value));}
 for(const patch of [{date:'2026-02-30'},{calendarProfileId:'automatic-default'},{jurisdiction:'JP'},{time:'25:00'},{policies:{...request().policies,clockPolicyId:'INVENTED'}}])assert.throws(()=>parseServerOfflineArgs(args({...request(),...patch})));
 for(const [flag,bad] of [['--output','csv'],['--detail','verbose']]){const value=args();value[value.indexOf(flag)+1]=bad;assert.throws(()=>parseServerOfflineArgs(value));}
});

test('server artifact API refuses unissued fake results and safe errors disclose neither input nor paths',()=>{
 assert.throws(()=>calculateServerOffline({engine:{calculate:()=>({status:'CALCULATED_UNDER_SELECTED_POLICIES'})},request:request()}),/ISSUED_SERVER_RESPONSE_REQUIRED/);
 assert.throws(()=>calculateServerOffline({engine:{calculate:()=>({status:'NEEDS_BIRTH_TIME'})},request:{...request(),time:null}}),/ISSUED_SERVER_RESPONSE_REQUIRED/);
 assert.deepEqual(serverOfflineRejection('DATA'),{status:'REJECTED',phase:'DATA',code:'OFFLINE_SERVER_DATA_REJECTED'});
});

test('v4 data-free fresh package reproduces, restores outside, and rejects forged packs and modified payload',async t=>{
 const directory=await mkdtemp(join(tmpdir(),'manseryeok-server-artifact-public-'));
 try{
  const engine=join(directory,'engine one'),again=join(directory,'engine two'),restored=join(directory,'restored engine'),fake=join(directory,'.private','fake-pack');
  const manifest=await buildServerOfflineArtifact({outDir:engine});await buildServerOfflineArtifact({outDir:again});
  await t.test('fixed vendor and fresh source closure reproduce without original calendar files',async()=>{
   assert.equal(await readFile(join(engine,'artifact-manifest.json'),'utf8'),await readFile(join(again,'artifact-manifest.json'),'utf8'));
   const accepted=await verifyServerOfflineArtifact(engine);assert.equal(accepted.schemaVersion,SERVER_ARTIFACT_SCHEMA);assert.equal(accepted.runtime.externalDependencies,0);assert.equal(accepted.runtime.nodeMajor,22);assert.equal(accepted.vendor.packages.length,8);
   const names=manifest.files.map(row=>row.path);for(const path of ['scripts/server/engine.mjs','scripts/server-data/load.mjs','scripts/server-data/core.mjs','scripts/server-data/binding.mjs','scripts/server-data/constants.mjs','vendor/fast-xml-parser.cjs'])assert.ok(names.includes(path),path);
   assert.ok(names.every(path=>!/(?:\.private|node_modules|candidate\.json|raw-responses\.ndjson|collector\.js|network\.js|Fixtures)/.test(path)));
   for(const path of names)assert.equal((await readFile(join(engine,path),'utf8')).includes(repo),false,path);
   await assert.rejects(verifyExtendedArtifact(engine),/EXTENDED_ARTIFACT_CONTRACT/);
  });
  await t.test('restore refuses existing and nested paths or inconsistent data arguments',async()=>{
   await restoreServerOfflineArtifact({artifactDirectory:engine,outDir:restored});assert.deepEqual((await verifyServerOfflineArtifact(restored)).files,manifest.files);
   await assert.rejects(restoreServerOfflineArtifact({artifactDirectory:engine,outDir:restored}),/DESTINATION_ALREADY_EXISTS/);
   await assert.rejects(restoreServerOfflineArtifact({artifactDirectory:engine,outDir:join(engine,'nested')}),/OVERLAP/);
   await assert.rejects(restoreServerOfflineArtifact({artifactDirectory:engine,outDir:join(directory,'bad-pair'),dataDirectory:'missing'}),/PAIRED_DATA_ARGUMENTS/);
  });
  await t.test('detached CLI gives clean bounded errors for absent or counterfeit API-only data',async()=>{
   const {preload}=await writeOfflineGuards(directory,{forbiddenRoot:repo}),env=cleanOfflineEnvironment('UTC');for(const key of Object.keys(env))if(/^path$/i.test(key))delete env[key];env.PATH='';
   const run=values=>spawnSync(process.execPath,['--import',pathToFileURL(preload).href,join(restored,'run.mjs'),...values],{cwd:directory,env,windowsHide:true,encoding:'utf8',timeout:30000,maxBuffer:2000000});
   const invalid=run([...args(),'--manifest-sha',SERVER_API_ONLY_ACCEPTED_PIN]);assert.equal(invalid.status,1);assert.equal(invalid.stdout,'');assert.deepEqual(JSON.parse(invalid.stderr),serverOfflineRejection('INPUT'));
   await mkdir(fake,{recursive:true});for(const path of SERVER_ARTIFACT_DATA_FILES)await writeFile(join(fake,path),'{}');await assert.rejects(verifyServerOfflineDataPack(fake));
   const input=args();input[input.indexOf('--data-pack')+1]=fake;const missing=run(input);assert.equal(missing.status,1);assert.equal(missing.stdout,'');assert.deepEqual(JSON.parse(missing.stderr),serverOfflineRejection('DATA'));
   assert.equal(missing.stderr.includes('2026-06-01'),false);assert.equal(missing.stderr.includes(fake),false);
  });
  await t.test('tampered license, extra payload and false schema are not accepted',async()=>{
   const file=join(again,manifest.vendor.packages[0].licensePath),original=await readFile(file);await writeFile(file,'changed notice');await assert.rejects(verifyServerOfflineArtifact(again),/ARTIFACT_CONTENT_CHANGED/);await writeFile(file,original);
   await writeFile(join(again,'unlisted.txt'),'extra');await assert.rejects(verifyServerOfflineArtifact(again),/ARTIFACT_FILE_SET_CHANGED/);
   const manifestPath=join(engine,'artifact-manifest.json'),text=await readFile(manifestPath,'utf8');await writeFile(manifestPath,JSON.stringify({...JSON.parse(text),schemaVersion:'v3-fake'}));await assert.rejects(verifyServerOfflineArtifact(engine),/SERVER_ARTIFACT_CONTRACT/);await writeFile(manifestPath,text);
  });
  await t.test('operator symlink aliases cannot bypass engine or data path checks',async()=>{
   const engineAlias=join(directory,'engine alias'),dataAlias=join(directory,'data alias');await symlink(engine,engineAlias,process.platform==='win32'?'junction':'dir');await symlink(fake,dataAlias,process.platform==='win32'?'junction':'dir');
   await assert.rejects(verifyServerOfflineArtifact(engineAlias),/SYMLINK_REJECTED/);await assert.rejects(verifyServerOfflineDataPack(dataAlias),/API_ONLY_PLAIN_DIRECTORY_REQUIRED/);
   await assert.rejects(restoreServerOfflineArtifact({artifactDirectory:engine,outDir:join(engineAlias,'nested')}),/SYMLINK_REJECTED|OVERLAP/);
  });
 }finally{const r=relative(resolve(tmpdir()),resolve(directory));assert.ok(r&&!isAbsolute(r)&&r!=='..'&&!r.startsWith('..'+sep)&&basename(directory).startsWith('manseryeok-server-artifact-public-'));await rm(directory,{recursive:true,force:true});}
});
