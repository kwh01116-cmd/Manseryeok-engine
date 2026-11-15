import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp,writeFile,readFile,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join,resolve,relative,isAbsolute,basename} from 'node:path';
import {pathToFileURL} from 'node:url';
import {spawnSync} from 'node:child_process';
import {validateApiOnlyServerRequest,createApiOnlyServerEngine,validateApiOnlyServerResult,renderApiOnlyServerReport} from '../scripts/server/engine.mjs';
import {SERVER_REQUEST_LITERAL_BASE,SERVER_REQUEST_CASES_V1} from './fixtures/server-api-only-request-cases-v1.mjs';
const fresh=()=>structuredClone(SERVER_REQUEST_LITERAL_BASE);
const rejected=(value,code)=>assert.throws(()=>validateApiOnlyServerRequest(value),error=>error instanceof Error&&(!code||error.message===code));

test('server rejects invalid requested dayun rather than changing it into not-requested, even alongside valid seyun',()=>{
 for(const d of [{traditionalSex:'UNKNOWN',count:10},{traditionalSex:'MALE',count:0},{traditionalSex:'FEMALE',count:21}])for(const withSeyun of [false,true]){const r=fresh();r.luckOptions={luckPolicyId:'M7-TRADITIONAL-YEAR-STEM-JIE-3D-V01',features:{dayun:d,...(withSeyun?{seyun:{yearLabel:2026}}:{})}};rejected(r,'SERVER_INVALID_DAYUN_INPUT');}
});

test('fixed public server request cases distinguish explicit profiles and policy conflicts without asserting a private calculation',()=>{
 const actual={accepted:0,rejected:0};
 for(const row of SERVER_REQUEST_CASES_V1){assert.ok(row.reason,row.id);const input=structuredClone(row.input),before=structuredClone(input);
  if(row.expected==='ACCEPT'){assert.equal(validateApiOnlyServerRequest(input),true,row.id);actual.accepted++;}
  else{assert.throws(()=>validateApiOnlyServerRequest(input),error=>error instanceof Error&&(!row.code||error.message===row.code),row.id);actual.rejected++;}
  assert.deepEqual(input,before,'validation must not rewrite '+row.id);
 }
 assert.deepEqual(actual,{accepted:10,rejected:15});
});

test('all four day/hour policy choices remain explicit and no default time is invented',()=>{
 for(const dayRollover of ['CIVIL_MIDNIGHT','ZI_START'])for(const hourStemReference of ['SELECTED_DAY_PILLAR','CIVIL_DATE_DAY_PILLAR']){
  const input=fresh();input.time='23:30';input.policies={...input.policies,dayRollover,hourStemReference};assert.equal(validateApiOnlyServerRequest(input),true);
 }
 for(const time of [undefined,'','0:00','12:60','23:60',0]){const input=fresh();input.time=time;rejected(input,'EXPLICIT_TIME_OR_NULL_REQUIRED');}
 for(const key of ['dayRollover','hourStemReference']){const input=fresh();delete input.policies[key];rejected(input,'SERVER_EXPLICIT_DAY_HOUR_POLICIES');}
});

test('lunar, monthly and experimental DTO fields cannot be silently widened',()=>{
 const lunar=structuredClone(SERVER_REQUEST_CASES_V1.find(r=>r.id==='LUNAR_SHAPE').input);
 for(const change of [{lunarYear:0},{lunarMonth:13},{lunarDay:31},{leap:'false'},{sourceRef:'CLIENT_SOURCE_OVERRIDE'}])rejected({...lunar,lunarDate:{...lunar.lunarDate,...change}});
 const badDate=fresh();badDate.date='2026-1-08';rejected(badDate);
 for(const monthlyOptions of [{},{policyId:'M7-MONTHLY-TWELVE-JIE-PUBLISHED-MINUTE-V01'},{policyId:'M7-MONTHLY-TWELVE-JIE-PUBLISHED-MINUTE-V01',year:0},{policyId:'M7-MONTHLY-TWELVE-JIE-PUBLISHED-MINUTE-V01',queryMinute:'2026-02-30T12:00'},{policyId:'M7-MONTHLY-TWELVE-JIE-PUBLISHED-MINUTE-V01',year:2026,sourceRefs:[]}])rejected({...fresh(),monthlyOptions});
 rejected({...fresh(),experimentalPolicyId:'DEFAULT_WEIGHTED_POLICY'},'SERVER_EXPERIMENTAL_POLICY_REQUIRES_MODERN_PROFILE');
 assert.equal(Object.hasOwn(fresh(),'experimentalPolicyId'),false);
});

test('unknown, sparse, foreign-prototype and accessor-bearing request objects are rejected without executing getters',()=>{
 for(const value of [[],new Array(2),Object.assign(new Array(2),{0:fresh()}),new Date(),Object.create({calendar:'GREGORIAN'})])rejected(value,'SERVER_REQUEST_FIELDS');
 rejected({...fresh(),dataDirectory:'CLIENT_MUST_NOT_SELECT_DATA'} ,'SERVER_REQUEST_FIELDS');
 let called=0;
 for(const level of ['request','policies','lunarDate','monthlyOptions']){
  const request=fresh();let target=request,key='date';
  if(level==='policies'){target=request.policies;key='clockPolicyId';}
  if(level==='lunarDate'){request.calendar='KOREAN_LUNAR';delete request.date;target=request.lunarDate={lunarYear:2025,lunarMonth:11,lunarDay:20,leap:false};key='lunarYear';}
  if(level==='monthlyOptions'){target=request.monthlyOptions={policyId:'M7-MONTHLY-TWELVE-JIE-PUBLISHED-MINUTE-V01',year:2026};key='year';}
  Object.defineProperty(target,key,{get(){called++;throw Error('GETTER_EXECUTED');},enumerable:true});rejected(request);
 }
 assert.equal(called,0);
});

test('non-enumerable and symbol properties cannot bypass the JSON-shaped request whitelist',()=>{
 let calls=0;
 const cases=[
  {request:fresh(),path:[]},
  {request:fresh(),path:['policies']},
  {request:structuredClone(SERVER_REQUEST_CASES_V1.find(r=>r.id==='LUNAR_SHAPE').input),path:['lunarDate']},
  {request:structuredClone(SERVER_REQUEST_CASES_V1.find(r=>r.id==='MODERN_MONTHLY_V1').input),path:['monthlyOptions']},
  ...[['luckOptions'],['luckOptions','features'],['luckOptions','features','dayun'],['luckOptions','features','seyun']].map(path=>({request:structuredClone(SERVER_REQUEST_CASES_V1.find(r=>r.id==='LUCK_EXPLICIT').input),path})),
 ];
 for(const row of cases){
  for(const propertyKind of ['NON_ENUMERABLE_DATA','SYMBOL_ACCESSOR']){
   const request=structuredClone(row.request),target=row.path.reduce((value,key)=>value[key],request);
   if(propertyKind==='NON_ENUMERABLE_DATA')Object.defineProperty(target,'unlistedHiddenProperty',{value:'must not be silently discarded',enumerable:false});
   else Object.defineProperty(target,Symbol('unlisted'),{get(){calls++;throw Error('SYMBOL_GETTER_EXECUTED');},enumerable:true});
   rejected(request);
  }
 }
 const hiddenKnown=fresh();Object.defineProperty(hiddenKnown,'date',{value:'2026-01-08',enumerable:false});rejected(hiddenKnown,'SERVER_REQUEST_FIELDS');
 assert.equal(calls,0,'symbol inspection must not execute caller accessors');
});

test('luck DTOs reuse explicit existing selection and reject hidden accessor execution at every nested layer',()=>{
 const valid=structuredClone(SERVER_REQUEST_CASES_V1.find(r=>r.id==='LUCK_EXPLICIT').input);assert.equal(validateApiOnlyServerRequest(valid),true);
 for(const luckOptions of [[],{features:new Array(2)},{luckPolicyId:'FOREIGN',features:{seyun:{yearLabel:2026}}},{luckPolicyId:'M7-TRADITIONAL-YEAR-STEM-JIE-3D-V01',features:{seyun:{queryMinute:'2026-02-30T12:00'}}}])rejected({...fresh(),luckOptions});
 let calls=0;
 for(const level of ['luckOptions','features','dayun','seyun']){
  const request=structuredClone(valid),target=level==='luckOptions'?request.luckOptions:level==='features'?request.luckOptions.features:request.luckOptions.features[level];
  const key={luckOptions:'features',features:'dayun',dayun:'count',seyun:'yearLabel'}[level];
  Object.defineProperty(target,key,{get(){calls++;throw Error('LUCK_GETTER_EXECUTED');},enumerable:true});rejected(request);
 }
 assert.equal(calls,0,'validation must not evaluate caller code while inspecting luck options');
});

test('DST fold input only admits the two offsets and requires an explicit standard clock reference',()=>{
 const input=structuredClone(SERVER_REQUEST_CASES_V1.find(r=>r.id==='DST_STANDARD_REFERENCE').input);
 for(const foldOffsetMinutes of [540,600])assert.equal(validateApiOnlyServerRequest({...input,policies:{...input.policies,foldOffsetMinutes}}),true);
 const noChoice=structuredClone(input);delete noChoice.policies.foldOffsetMinutes;assert.equal(validateApiOnlyServerRequest(noChoice),true,'runtime may return an ambiguous-time hold rather than invent a choice');
 for(const dayHourReference of ['RECORDED_CIVIL','TRUE_SOLAR_TIME',null])rejected({...input,policies:{...input.policies,dayHourReference}},'SERVER_DST_STANDARD_REFERENCE_REQUIRED');
 const outside=fresh();outside.policies.dayHourReference='STANDARD_KST';rejected(outside,'SERVER_DST_OPTIONS_REQUIRE_DST_PROFILE');
});

test('unissued engine/result objects cannot mint a server response or readable report',()=>{
 const fake=Object.freeze({manifest:Object.freeze({}),candidate:Object.freeze({}),sources:Object.freeze([]),apiOnlyIdentity:Object.freeze({manifestContentSha256:'a'.repeat(64)})});
 assert.throws(()=>createApiOnlyServerEngine(fake),/ISSUED_API_ONLY_LOADER_REQUIRED/);
 assert.throws(()=>validateApiOnlyServerResult({status:'CALCULATED_UNDER_SELECTED_POLICIES'}),/ISSUED_SERVER_RESPONSE_REQUIRED/);
 assert.throws(()=>renderApiOnlyServerReport({status:'CALCULATED_UNDER_SELECTED_POLICIES'}),/ISSUED_SERVER_RESPONSE_REQUIRED/);
});

test('guarded server loader subprocess rejects missing/fake data without network, key or credential access',async t=>{
 const directory=await mkdtemp(join(tmpdir(),'sprint5-server-contract-')),fake=join(directory,'fake-pack'),guardFile=join(directory,'guard.json'),guardPath=join(directory,'guard.mjs'),runnerPath=join(directory,'runner.mjs');
 t.after(async()=>{const absolute=resolve(directory),rel=relative(resolve(tmpdir()),absolute);assert.ok(rel&&!isAbsolute(rel)&&rel!=='..'&&!rel.startsWith('..'));assert.match(basename(absolute),/^sprint5-server-contract-/);await rm(absolute,{recursive:true,force:true});});
 const {mkdir}=await import('node:fs/promises');await mkdir(fake);
 for(const file of ['manifest.json','calendar.json','sources.json','raw-responses.ndjson','NOTICE.txt'])await writeFile(join(fake,file),'{}\n');
 await writeFile(guardPath,`import fs from 'node:fs';import fsp from 'node:fs/promises';import net from 'node:net';import http from 'node:http';import https from 'node:https';import tls from 'node:tls';import dns from 'node:dns';import {syncBuiltinESMExports} from 'node:module';const counts={network:0,keyReads:0,credentialReads:0};const write=fs.writeFileSync;const deny=()=>{counts.network++;throw Error('NETWORK_FORBIDDEN')};for(const[o,names]of[[net,['connect','createConnection']],[http,['request','get']],[https,['request','get']],[tls,['connect']],[dns,['lookup','resolve','resolve4','resolve6']]])for(const n of names)if(typeof o[n]==='function')o[n]=deny;net.Socket.prototype.connect=deny;globalThis.fetch=deny;const credentials=p=>/(?:^|[\\\\/])(?:\\.env(?:\\.[^\\\\/]*)?|\\.aws|\\.ssh|credentials)(?:[\\\\/]|$)/i.test(String(p));for(const[o,names]of[[fs,['readFile','readFileSync','open','openSync','createReadStream']],[fsp,['readFile','open']]])for(const n of names){const f=o[n];o[n]=function(p,...args){if(credentials(p)){counts.credentialReads++;throw Error('CREDENTIAL_READ_FORBIDDEN')}return f.call(this,p,...args)}}process.env=new Proxy(process.env,{get(o,p,r){if(/KASI|API.?KEY|SERVICE.?KEY/i.test(String(p))){counts.keyReads++;throw Error('KEY_READ_FORBIDDEN')}return Reflect.get(o,p,r)}});syncBuiltinESMExports();process.on('exit',()=>write(${JSON.stringify(guardFile)},JSON.stringify(counts),{flag:'wx'}));`);
 await writeFile(runnerPath,`import {loadApiOnlyServerEngine} from ${JSON.stringify(pathToFileURL(resolve('scripts/server/engine.mjs')).href)};const outcomes=[];for(const input of [undefined,{}, {dataDirectory:${JSON.stringify(join(directory,'missing'))}},{dataDirectory:${JSON.stringify(fake)}}]){try{await loadApiOnlyServerEngine(input);outcomes.push('UNEXPECTED_ACCEPT')}catch(error){outcomes.push(error.code??error.message)}}process.stdout.write(JSON.stringify(outcomes)+'\\n');`);
 const env={};for(const name of Object.keys(process.env))if(!/KASI|API.?KEY|SERVICE.?KEY|TOKEN|SECRET|PASSWORD|CREDENTIAL|AUTHORIZATION|^NODE_OPTIONS$/i.test(name))env[name]=process.env[name];env.TZ='UTC';
 const child=spawnSync(process.execPath,['--import',pathToFileURL(guardPath).href,runnerPath],{cwd:process.cwd(),env,encoding:'utf8',windowsHide:true});
 assert.equal(child.status,0,child.stderr);assert.equal(child.stderr,'');const outcomes=JSON.parse(child.stdout);assert.deepEqual(outcomes,['SERVER_ENGINE_OPTIONS','SERVER_DATA_DIRECTORY_REQUIRED','ENOENT','API_ONLY_MANIFEST_FIELDS']);
 assert.deepEqual(JSON.parse(await readFile(guardFile,'utf8')),{network:0,keyReads:0,credentialReads:0});
});
