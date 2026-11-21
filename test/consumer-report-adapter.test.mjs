import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp,readFile,writeFile,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join,resolve,relative,isAbsolute,basename} from 'node:path';
import {pathToFileURL} from 'node:url';
import {spawnSync} from 'node:child_process';
import {SERVER_REQUEST_LITERAL_BASE} from './fixtures/server-api-only-request-cases-v1.mjs';
import {CONSUMER_REPORT_PROFILE_ID} from '../dist/report/consumerReportV1.js';
import {parseConsumerReportArgs,projectServerReport,analyzeConsumerReport,createConsumerReportService,validateIssuedConsumerReport,consumerReportSections} from '../scripts/product/consumer-report.mjs';

const request=()=>structuredClone(SERVER_REQUEST_LITERAL_BASE);
const args=(r=request())=>['--data-pack','operator-private-test-directory','--request-json',JSON.stringify(r),'--report-profile',CONSUMER_REPORT_PROFILE_ID,'--output','json','--audience','full','--voice','report','--detail','summary'];

test('consumer CLI requires all seven explicit selections and admits only the three documented output views',()=>{
 for(const output of ['json','text','sections'])for(const audience of ['preview','full'])for(const voice of ['report','dialogue'])for(const detail of ['summary','evidence']){
  const input=args();input[input.indexOf('--output')+1]=output;input[input.indexOf('--audience')+1]=audience;input[input.indexOf('--voice')+1]=voice;input[input.indexOf('--detail')+1]=detail;
  const parsed=parseConsumerReportArgs(input);assert.equal(parsed.output,output);assert.equal(parsed.audience,audience);assert.equal(parsed.voice,voice);assert.equal(parsed.detail,detail);assert.deepEqual(parsed.request,request());
 }
 for(let index=0;index<14;index+=2){const input=args();input.splice(index,2);assert.throws(()=>parseConsumerReportArgs(input),/EXPLICIT_ARGUMENTS/);}
});

test('consumer selection rejects duplicate, foreign, oversized and conflicting request input before loading data',()=>{
 for(const [flag,value]of [['--report-profile','M4-IMPLICIT'],['--output','pdf'],['--audience','paid'],['--voice','llm'],['--detail','verbose']]){const input=args();input[input.indexOf(flag)+1]=value;assert.throws(()=>parseConsumerReportArgs(input),/EXPLICIT_SELECTION/);}
 const duplicate=args();duplicate[duplicate.indexOf('--detail')]='--voice';assert.throws(()=>parseConsumerReportArgs(duplicate),/CONSUMER_ARGUMENTS/);
 const foreign=args();foreign[0]='--service-key';assert.throws(()=>parseConsumerReportArgs(foreign),/CONSUMER_ARGUMENTS/);
 const oversized=args();oversized[3]='가'.repeat(10924);assert.throws(()=>parseConsumerReportArgs(oversized),/REQUEST_TOO_LARGE/);
 const conflict=request();conflict.policies.clockPolicyId='KR_UNSELECTED_CLOCK';assert.throws(()=>parseConsumerReportArgs(args(conflict)),/SERVER_CLOCK_PROFILE_CONFLICT/);
 const unknown={...request(),customerBillingId:'not-an-input-field'};assert.throws(()=>parseConsumerReportArgs(args(unknown)),/SERVER_REQUEST_FIELDS/);
});

test('consumer projection cannot authenticate plain JSON, a frozen imitation, or a foreign report',()=>{
 for(const fake of [{},Object.freeze({status:'CALCULATED_UNDER_SELECTED_POLICIES',candidates:[],request:request()})]){
  assert.throws(()=>projectServerReport(fake,{request:request()}),/ISSUED_SERVER_RESPONSE_REQUIRED/);
  assert.throws(()=>analyzeConsumerReport(fake,{request:request(),profileId:CONSUMER_REPORT_PROFILE_ID}),/ISSUED_SERVER_RESPONSE_REQUIRED/);
 }
 const fakeReport=Object.freeze({schemaVersion:'saju-consumer-report-evidence-v1',eligibility:{fullPaidReport:false}});
 assert.throws(()=>validateIssuedConsumerReport(fakeReport),/ISSUED_CONSUMER_REPORT_REQUIRED/);
 assert.throws(()=>consumerReportSections(fakeReport,{audience:'full',voice:'report'}),/ISSUED_CONSUMER_REPORT_REQUIRED/);
});

test('consumer service validates input before upstream entry and never retries an unissued upstream result',()=>{
 let entries=0;const engine={calculate(){entries++;return Object.freeze({status:'CALCULATED_UNDER_SELECTED_POLICIES'});}},service=createConsumerReportService(engine,{profileId:CONSUMER_REPORT_PROFILE_ID});
 const malformed=request();malformed.time='24:00';assert.throws(()=>service.calculate(malformed),/EXPLICIT_TIME_OR_NULL_REQUIRED/);assert.equal(entries,0);
 const valid=request(),before=structuredClone(valid);assert.throws(()=>service.calculate(valid),/ISSUED_SERVER_RESPONSE_REQUIRED/);assert.equal(entries,1);assert.deepEqual(valid,before);
 assert.throws(()=>createConsumerReportService(engine,{profileId:'IMPLICIT_PROFILE'}),/EXPLICIT_CONSUMER_ENGINE_AND_PROFILE_REQUIRED/);
 assert.throws(()=>createConsumerReportService(engine,{profileId:CONSUMER_REPORT_PROFILE_ID,request:valid}),/CONSUMER_SERVICE_OPTIONS/);assert.equal(entries,1);
});

test('consumer adapter options do not execute accessor-bearing request or service selections',()=>{
 let reads=0;const projectionOptions={};Object.defineProperty(projectionOptions,'request',{get(){reads++;throw Error('GETTER_EXECUTED');},enumerable:true});
 assert.throws(()=>projectServerReport({},projectionOptions),/CONSUMER_PROJECTION_OPTIONS/);
 const serviceOptions={};Object.defineProperty(serviceOptions,'profileId',{get(){reads++;throw Error('GETTER_EXECUTED');},enumerable:true});
 assert.throws(()=>createConsumerReportService({calculate(){}},serviceOptions),/CONSUMER_SERVICE_OPTIONS/);assert.equal(reads,0);
});

test('consumer CLI emits only a safe input rejection and touches no network, keys or credentials for malformed input',async t=>{
 const directory=await mkdtemp(join(tmpdir(),'manseryeok-consumer-adapter-')),guard=join(directory,'guard.mjs'),receipt=join(directory,'guard.json');
 t.after(async()=>{const absolute=resolve(directory),rel=relative(resolve(tmpdir()),absolute);assert.ok(rel&&!isAbsolute(rel)&&rel!=='..'&&!rel.startsWith('..'));assert.match(basename(absolute),/^manseryeok-consumer-adapter-/);await rm(absolute,{recursive:true,force:true});});
 await writeFile(guard,`import fs from 'node:fs';import fsp from 'node:fs/promises';import net from 'node:net';import http from 'node:http';import https from 'node:https';import tls from 'node:tls';import dns from 'node:dns';import {syncBuiltinESMExports}from'node:module';const counts={network:0,keys:0,credentials:0},save=fs.writeFileSync,deny=()=>{counts.network++;throw Error('NETWORK_DENIED')};for(const[o,n]of[[net,['connect','createConnection']],[http,['get','request']],[https,['get','request']],[tls,['connect']],[dns,['lookup','resolve']]])for(const k of n)o[k]=deny;net.Socket.prototype.connect=deny;globalThis.fetch=deny;for(const[o,n]of[[fs,['readFile','readFileSync','open','openSync']],[fsp,['readFile','open']]])for(const k of n){const f=o[k];o[k]=function(p,...a){if(/(?:^|[\\\\/])(?:\\.env(?:\\.[^\\\\/]*)?|\\.aws|\\.ssh|credentials)(?:[\\\\/]|$)/i.test(String(p))){counts.credentials++;throw Error('CREDENTIAL_DENIED')}return f.call(this,p,...a)}}process.env=new Proxy(process.env,{get(o,p,r){if(/KASI|API.?KEY|SERVICE.?KEY|TOKEN|SECRET|PASSWORD|CREDENTIAL|AUTHORIZATION/i.test(String(p))){counts.keys++;throw Error('KEY_DENIED')}return Reflect.get(o,p,r)}});syncBuiltinESMExports();process.on('exit',()=>save(${JSON.stringify(receipt)},JSON.stringify(counts),{flag:'wx'}));`);
 const input=args({...request(),ServiceKey:'SYNTHETIC_VALUE_MUST_NOT_ECHO'}),env={};for(const name of Object.keys(process.env))if(!/KASI|API.?KEY|SERVICE.?KEY|TOKEN|SECRET|PASSWORD|CREDENTIAL|AUTHORIZATION|^NODE_OPTIONS$/i.test(name))env[name]=process.env[name];
 const child=spawnSync(process.execPath,['--import',pathToFileURL(guard).href,resolve('scripts/product/consumer-report.mjs'),...input],{cwd:process.cwd(),env,encoding:'utf8',windowsHide:true});
 assert.equal(child.status,1);assert.equal(child.stdout,'');assert.deepEqual(JSON.parse(child.stderr),{status:'REJECTED',phase:'INPUT',code:'CONSUMER_REPORT_INPUT_REJECTED'});assert.ok(!child.stderr.includes('SYNTHETIC_VALUE_MUST_NOT_ECHO'));assert.deepEqual(JSON.parse(await readFile(receipt,'utf8')),{network:0,keys:0,credentials:0});
});
