import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp,writeFile,readFile,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join,resolve,relative,isAbsolute,basename} from 'node:path';
import {pathToFileURL} from 'node:url';
import {spawnSync} from 'node:child_process';
import {Client} from '../.kasi-build/collector.js';
import {createSprint5CompletionPlan,parseSprint5CompletionPlanArgs,renderSprint5CompletionPlan,SPRINT5_COLLECTION_PLAN_ID} from '../scripts/kasi/plan-sprint5-completion.mjs';
const monthRows=[31,28,31,30,31,30,31,31,30,31,30,31];
test('dry plan fixes the twelve monthly lunar requests plus one annual solar request without a hidden year expansion',()=>{
 const plan=createSprint5CompletionPlan();assert.equal(plan.mode,'DRY_RUN_ONLY');assert.equal(plan.authorizationStatus,'NOT_AUTHORIZED_BY_CURRENT_TASK');assert.equal(plan.requests.length,13);assert.equal(plan.planId,SPRINT5_COLLECTION_PLAN_ID);
 assert.deepEqual(plan.requests.slice(0,12).map(row=>row.expectedRows),monthRows);assert.equal(monthRows.reduce((a,b)=>a+b,0),365);
 for(let month=1;month<=12;month++){const row=plan.requests[month-1];assert.equal(row.serviceId,'15012679');assert.equal(row.operation,'getLunCalInfo');assert.deepEqual(row.query,{service:'lunar',year:2027,month,page:1,format:'xml'});assert.equal(row.wireParametersWithoutCredentials.numOfRows,'100');assert.equal(Object.hasOwn(row.wireParametersWithoutCredentials,'solDay'),false);}
 assert.deepEqual(plan.requests[12].query,{service:'solar',year:2028,page:1,format:'xml'});assert.equal(plan.requests[12].serviceId,'15012690');assert.equal(plan.requests[12].operation,'get24DivisionsInfo');assert.equal(plan.requests[12].expectedRows,24);
 assert.deepEqual(plan.intent.solarRuntimeTerms,['XIAOHAN','LICHUN']);assert.equal(plan.intent.automaticBirthOrClockExpansion,false);assert.equal(plan.intent.all2028TermsAutomaticallyEnabled,false);
});
test('attempt, pagination and stop contracts cannot silently reuse the old two-retry default',()=>{
 const plan=createSprint5CompletionPlan();assert.equal(plan.budget.plannedRequests,13);assert.equal(plan.budget.maxActualHttpAttempts,13);assert.equal(plan.budget.retriesPerPage,0);assert.equal(plan.budget.maximumPagesPerRequest,1);assert.equal(plan.budget.minimumIntervalMs,350);assert.equal(plan.budget.serialRequests,true);
 assert.equal(plan.budget.unexpectedAdditionalPages,'STOP_REQUIRES_REVISED_USER_APPROVAL');assert.equal(plan.budget.authQuotaOrAnyNonSuccess,'STOP_NO_AUTOMATIC_RETRY');assert.equal(plan.reuse.existing2027SolarRaw,'REUSE_ACCEPTED_EXISTING_CAPTURE_DO_NOT_REQUEST_AGAIN');
 assert.equal(plan.executeReadiness.liveRequestsAlreadyMade,0);assert.equal(plan.storage.defaultWrites,'NONE_DRY_RUN_STDOUT_ONLY');
});
test('the immutable plan is deterministic and distinguishes collection, review and runtime activation',()=>{
 const first=createSprint5CompletionPlan(),second=createSprint5CompletionPlan();assert.deepEqual(first,second);assert.equal(Object.isFrozen(first.requests[0]),true);assert.match(first.planSha256,/^[a-f0-9]{64}$/);
 assert.throws(()=>{first.requests[0].query.year=2026;});assert.match(first.storage.runtimeAcceptance,/SEPARATE_REVIEW/);assert.match(first.acceptance.newManifest,/INDEPENDENT_REVIEW/);assert.equal(first.credentialPolicy.currentKeyAccess,'NONE');assert.equal(first.credentialPolicy.noBroadSecretSearch,true);
});
test('execute and key-bearing flags are rejected before a provider or output directory can be selected',()=>{
 assert.deepEqual(parseSprint5CompletionPlanArgs([]),{mode:'dry-run',output:'json'});assert.deepEqual(parseSprint5CompletionPlanArgs(['--output','text']),{mode:'dry-run',output:'text'});
 assert.throws(()=>parseSprint5CompletionPlanArgs(['--mode','execute']),/SPRINT5_COLLECTION_REQUIRES_SEPARATE_EXPLICIT_USER_APPROVAL/);
 for(const args of [['--key','FAKE_NOT_A_SECRET'],['--key-file','DO_NOT_READ'],['--approval-file','DO_NOT_READ'],['--out','DO_NOT_WRITE'],['--mode','dry-run','--mode','dry-run'],['--output'],['--output','yaml']])assert.throws(()=>parseSprint5CompletionPlanArgs(args),/SPRINT5_PLAN_ARGUMENTS_REJECTED/);
 const text=renderSprint5CompletionPlan(createSprint5CompletionPlan());assert.match(text,/총13회/);assert.match(text,/실행 미승인/);assert.match(text,/독립 검토/);assert.equal(text.includes('ServiceKey='),false);
});
test('existing Client still rejects a 2028 request before invoking even a synthetic transport',async()=>{
 let calls=0;const client=new Client(async()=>{calls++;throw Error('SHOULD_NOT_BE_CALLED');},{solar:'SYNTHETIC_NOT_A_REAL_KEY'},{timeoutMs:50,retries:0,intervalMs:0});
 await assert.rejects(client.request({service:'solar',year:2028,page:1,format:'xml'}),error=>error.code==='YEAR_RANGE_1950_2027');assert.equal(calls,0);
});
async function guarded(t,args,TZ){
 const directory=await mkdtemp(join(tmpdir(),'sprint5-dry-plan-'));t.after(async()=>{const absolute=resolve(directory),within=relative(resolve(tmpdir()),absolute);assert.ok(within&&!isAbsolute(within)&&within!=='..'&&!within.startsWith('..'));assert.match(basename(absolute),/^sprint5-dry-plan-/);await rm(absolute,{recursive:true,force:true});});const receipt=join(directory,'guard.json'),preload=join(directory,'guard.mjs');
 await writeFile(preload,`import fs from 'node:fs';import fsp from 'node:fs/promises';import net from 'node:net';import http from 'node:http';import https from 'node:https';import tls from 'node:tls';import dns from 'node:dns';import {syncBuiltinESMExports}from 'node:module';const counts={network:0,keyReads:0,credentialReads:0,fileWrites:0};const originalWrite=fs.writeFileSync;const block=()=>{counts.network++;throw Error('NETWORK_FORBIDDEN')};for(const [o,names]of[[net,['connect','createConnection']],[http,['get','request']],[https,['get','request']],[tls,['connect']],[dns,['lookup','resolve','resolve4','resolve6']]])for(const name of names)if(typeof o[name]==='function')o[name]=block;net.Socket.prototype.connect=block;globalThis.fetch=block;const creds=p=>/(?:^|[\\\\/])(?:\\.env(?:\\.[^\\\\/]*)?|\\.aws|\\.ssh|credentials)(?:[\\\\/]|$)/i.test(String(p));for(const[o,names]of[[fs,['readFile','readFileSync','createReadStream','open','openSync']],[fsp,['readFile','open']]])for(const name of names){const fn=o[name];o[name]=function(path,...rest){if(creds(path)){counts.credentialReads++;throw Error('CREDENTIAL_FORBIDDEN')}return fn.call(this,path,...rest)}}for(const[o,names]of[[fs,['writeFile','writeFileSync','appendFile','appendFileSync','mkdir','mkdirSync']],[fsp,['writeFile','appendFile','mkdir']]])for(const name of names)o[name]=()=>{counts.fileWrites++;throw Error('FILE_WRITE_FORBIDDEN')};process.env=new Proxy(process.env,{get(t,p,r){if(/KASI|API.?KEY|SERVICE.?KEY/i.test(String(p))){counts.keyReads++;throw Error('KEY_READ_FORBIDDEN')}return Reflect.get(t,p,r)}});syncBuiltinESMExports();process.on('exit',()=>originalWrite(${JSON.stringify(receipt)},JSON.stringify(counts),{flag:'wx'}));`);
 const env={};for(const name of Object.keys(process.env))if(!/KASI|API.?KEY|SERVICE.?KEY|TOKEN|SECRET|PASSWORD|CREDENTIAL|AUTHORIZATION|^NODE_OPTIONS$/i.test(name))env[name]=process.env[name];env.TZ=TZ;
 const processResult=spawnSync(process.execPath,['--import',pathToFileURL(preload).href,resolve('scripts/kasi/plan-sprint5-completion.mjs'),...args],{cwd:process.cwd(),env,encoding:'utf8',windowsHide:true});
 assert.deepEqual(JSON.parse(await readFile(receipt,'utf8')),{network:0,keyReads:0,credentialReads:0,fileWrites:0});return processResult;
}
test('actual CLI dry-run has clean JSON and no network, key, credential or production write access in either timezone',async t=>{
 const utc=await guarded(t,[],'UTC'),seoul=await guarded(t,['--mode','dry-run','--output','json'],'Asia/Seoul');assert.equal(utc.status,0,utc.stderr);assert.equal(seoul.status,0,seoul.stderr);assert.equal(utc.stderr,'');assert.equal(utc.stdout,seoul.stdout);assert.deepEqual(JSON.parse(utc.stdout),createSprint5CompletionPlan());
});
test('actual execute CLI rejection is safe and occurs without key access or raw file creation',async t=>{
 const rejected=await guarded(t,['--mode','execute'],'UTC');assert.equal(rejected.status,1);assert.equal(rejected.stdout,'');assert.deepEqual(JSON.parse(rejected.stderr),{status:'REJECTED',code:'SPRINT5_COLLECTION_REQUIRES_SEPARATE_EXPLICIT_USER_APPROVAL'});
});
