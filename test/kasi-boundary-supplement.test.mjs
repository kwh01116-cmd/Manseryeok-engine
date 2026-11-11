// Synthetic XML/receipts only: these are source-shape tests, not actual API certification.
import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp,mkdir,writeFile,readFile,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join,resolve} from 'node:path';
import {pathToFileURL} from 'node:url';
import {spawnSync} from 'node:child_process';
import {fingerprint,sha,parsePage,TERMS} from '../.kasi-build/schema.js';
import {buildKasi2027BoundaryContent,loadKasi2027BoundarySupplement,verifyKasi2027BoundarySupplement} from '../scripts/kasi/boundary-supplement.mjs';
import {collectKasi2027Boundary} from '../scripts/kasi/collect-2027-boundary.mjs';
import {createLocalChartProfile,STAGE_A_PROFILE_ID} from '../scripts/kasi/local-chart.mjs';
import {createLocalLuckProfile,M7_LUCK_POLICY_V01,validateLocalLuckResult,parseLocalLuckArgs} from '../scripts/kasi/local-luck.mjs';
import {createLocalLuckProjectionProfile,CALENDAR_PROJECTION_POLICY_V02,validateLocalLuckProjectionResult} from '../scripts/kasi/local-luck-projection.mjs';
import {syntheticLocalChartCandidate,chartRequest,writeSyntheticLocalChartCandidate} from './fixtures/kasi-local-chart-synthetic.mjs';

const fixture=syntheticLocalChartCandidate(),basePin=fixture.expectedManifestSha256;
const identity={sourceIdentityKind:'HEAD_PLUS_EXACT_FILE_HASHES',gitHead:'1'.repeat(40),collectorSha256:'2'.repeat(64),normalizerSha256:'3'.repeat(64)};
function xml(transform=x=>x){const rows=TERMS.map((term,i)=>({dateName:term,locdate:'2027'+String(Math.floor(i/2)+1).padStart(2,'0')+(i%2?'20':'05'),kst:'0120'}));rows[0].kst='2310';rows[2].locdate='20270204';rows[2].kst='1046';return '<response><header><resultCode>00</resultCode></header><body><items>'+transform(rows).map(r=>'<item>'+Object.entries(r).map(([k,v])=>'<'+k+'>'+v+'</'+k+'>').join('')+'</item>').join('')+'</items><numOfRows>100</numOfRows><pageNo>1</pageNo><totalCount>24</totalCount></body></response>';}
function page(body=xml(),overrides={}){return {body,receipt:{evidenceSurface:'KASI_OPENAPI_RESPONSE',responseHashScope:'UTF8_ENTITY_AFTER_HTTP_DECOMPRESSION',query:{service:'solar',year:2027,page:1,format:'xml'},requestedAt:'2026-11-11T00:00:00.000Z',serviceId:'15012690',operation:'get24DivisionsInfo',responseSha256:sha(body),schema:parsePage(body).schema,...overrides}};}
async function artifact(t,mutate=x=>x){const directory=await mkdtemp(join(tmpdir(),'kasi-boundary-synthetic-'));t.after(()=>rm(directory,{recursive:true,force:true}));const pages=[page()],content=mutate(buildKasi2027BoundaryContent({pages,baseManifestSha256:basePin,codeIdentity:identity})),pin=fingerprint(content);await mkdir(join(directory,'raw'));await mkdir(join(directory,'receipts'));for(const p of pages){await writeFile(join(directory,'raw',p.receipt.responseSha256+'.body'),p.body);await writeFile(join(directory,'receipts',fingerprint(p.receipt)+'.json'),JSON.stringify(p.receipt));}await writeFile(join(directory,'manifest.json'),JSON.stringify({contentSha256:pin,content}));return {directory,pin,pages,content};}
const load=a=>loadKasi2027BoundarySupplement({directory:a.directory,expectedSupplementSha256:a.pin,expectedBaseManifestSha256:basePin});
const chart=()=>createLocalChartProfile(fixture.loaded,{profileId:STAGE_A_PROFILE_ID,expectedManifestSha256:basePin});
const features=sex=>({dayun:{traditionalSex:sex,count:3},seyun:{yearLabel:2027,queryMinute:'2027-02-04T10:46'}});

test('boundary loader re-derives two raw-linked API rows; only Xiaohan is computational, Lichun is data ready',async t=>{
 const a=await artifact(t),supplement=await load(a);assert.equal(verifyKasi2027BoundarySupplement(supplement,{baseManifestSha256:basePin}),supplement);
 assert.equal(supplement.content.support.completeYear,false);assert.deepEqual(supplement.content.events.map(e=>e.termCode),['XIAOHAN','LICHUN']);assert.deepEqual(supplement.events.map(e=>e.term),['XIAOHAN']);
 assert.equal(supplement.events[0].displayedDateTime,'2027-01-05T23:10');assert.equal(supplement.evidence[1].original.time,'10:46');assert.equal(supplement.interpretation.utcInstant,null);
 assert.equal(supplement.dataReadiness.LICHUN,'DATA_READY_QUERY_CLOCK_POLICY_UNRESOLVED');assert.equal(Object.isFrozen(supplement.evidence[0].source),true);
 assert.equal(supplement.evidence[0].source.operation,'get24DivisionsInfo');assert.equal(supplement.evidence[0].original.historicalCivilTime,'NOT_RESOLVED');
});

test('independent pins, raw bytes, source links and extra normalized terms are rejected',async t=>{
 const a=await artifact(t);await assert.rejects(loadKasi2027BoundarySupplement({directory:a.directory,expectedBaseManifestSha256:basePin}),/BOUNDARY_INDEPENDENT_PINS_REQUIRED/);
 await assert.rejects(loadKasi2027BoundarySupplement({directory:a.directory,expectedSupplementSha256:'0'.repeat(64),expectedBaseManifestSha256:basePin}),/BOUNDARY_CONTENT_PIN_MISMATCH/);
 await assert.rejects(loadKasi2027BoundarySupplement({directory:a.directory,expectedSupplementSha256:a.pin,expectedBaseManifestSha256:'0'.repeat(64)}),/BOUNDARY_BASE_PIN_MISMATCH/);
 await writeFile(join(a.directory,a.content.rawReferences[0].path),a.pages[0].body+' ');await assert.rejects(load(a),/BOUNDARY_RAW_OR_SOURCE_HASH_CHANGED/);
 const b=await artifact(t,c=>({...c,events:[...c.events,{...c.events[0],termCode:'DAHAN'}]}));await assert.rejects(load(b),/BOUNDARY_NORMALIZED_CONTENT_CHANGED/);
 const c=await artifact(t,v=>({...v,events:v.events.map(e=>({...e,sourceRef:'0'.repeat(64)}))}));await assert.rejects(load(c),/BOUNDARY_NORMALIZED_CONTENT_CHANGED/);
 const d=await artifact(t,v=>({...v,rawReferences:v.rawReferences.map(r=>({...r,path:'../manifest.json'}))}));await assert.rejects(load(d),/BOUNDARY_UNSAFE_RAW_REFERENCE/);
 const e=await artifact(t);await rm(join(e.directory,'manifest.json'));await assert.rejects(load(e),/BOUNDARY_MANIFEST_MISSING_OR_INVALID/);
});

test('annual normalization rejects wrong operation/year, duplicate terms and missing published minute',()=>{
 const build=p=>buildKasi2027BoundaryContent({pages:[p],baseManifestSha256:basePin,codeIdentity:identity});
 assert.throws(()=>build(page(xml(),{operation:'getLunCalInfo'})),/BOUNDARY_SOURCE_CONTRACT/);
 assert.throws(()=>build(page(xml(),{id:'OVERRIDE_COMPUTED_SOURCE_REF'})),/BOUNDARY_UNEXPECTED_RECEIPT_FIELDS/);
 assert.throws(()=>build(page(xml(),{query:{service:'solar',year:2026,page:1,format:'xml'}})),/BOUNDARY_QUERY_MUST_BE_2027_ANNUAL_SOLAR/);
 assert.throws(()=>build(page(xml(rows=>rows.map((r,i)=>i===0?{...r,kst:''}:r)))),/BOUNDARY_MINUTE_REQUIRED/);
 assert.throws(()=>build(page(xml(rows=>rows.map((r,i)=>i===1?{...r,dateName:'소한'}:r)))),/SOLAR_24_MISSING_OR_DUPLICATE/);
 assert.throws(()=>build(page(xml(rows=>rows.map((r,i)=>i===0?{...r,locdate:'20260105'}:r)))),/SOLAR_TERM_YEAR/);
});

test('explicit supplement resolves late2026 only in M7 while natal chart, sequence, reverse result and old unselected output remain unchanged',async t=>{
 const supplement=await load(await artifact(t)),cp=chart(),baseline=createLocalLuckProfile(cp,{luckPolicyId:M7_LUCK_POLICY_V01}),selected=createLocalLuckProfile(cp,{luckPolicyId:M7_LUCK_POLICY_V01,boundarySupplement:supplement});
 const request=chartRequest('2026-12-31','12:00'),old=baseline.calculate(request,features('MALE')),before=JSON.stringify(old),next=selected.calculate(request,features('MALE'));
 assert.equal(old.luck.candidates[0].dayun.start.status,'NEEDS_DATA');assert.equal(next.luck.candidates[0].dayun.start.status,'OK');assert.equal(next.luck.candidates[0].dayun.start.selectedEvent.term,'XIAOHAN');
 assert.deepEqual(next.m1,old.m1);assert.deepEqual(next.luck.candidates[0].dayun.sequence,old.luck.candidates[0].dayun.sequence);assert.equal(JSON.stringify(old),before);
 assert.equal(old.luck.seyun.atMinute.status,'NEEDS_DATA');assert.equal(next.luck.seyun.atMinute.status,'POLICY_UNRESOLVED');assert.equal(next.luck.seyun.atMinute.entries.length,0);
 assert.equal(next.luck.executionCounts.birthM1Calls,1);assert.equal(next.m1.dataset.candidateManifestContentSha256,basePin);assert.equal(next.luck.provenance.boundarySupplement.contentSha256,supplement.contentSha256);
 assert.ok(next.luck.provenance.boundarySupplement.compositionId.startsWith('kasi-base-plus-boundary-'));assert.equal(validateLocalLuckResult(next),true);
 const reverseOld=baseline.calculate(request,features('FEMALE')),reverseNew=selected.calculate(request,features('FEMALE'));assert.deepEqual(reverseNew.luck.candidates[0].dayun,reverseOld.luck.candidates[0].dayun);
 const projection=createLocalLuckProjectionProfile(cp,{luckPolicyId:M7_LUCK_POLICY_V01,calendarProjectionPolicyId:CALENDAR_PROJECTION_POLICY_V02,boundarySupplement:supplement}).calculate(request,features('MALE'),{asOfMinute:'2026-12-31T13:00'});
 assert.equal(projection.projection.candidates[0].calendar.status,'PROJECTED_UNDER_POLICY');assert.equal(projection.m7.luck.executionCounts.birthM1Calls,1);assert.equal(validateLocalLuckProjectionResult(projection),true);
});

test('same published minute remains correlated/ambiguous; unissued or mismatched supplements never reach M1',async t=>{
 const a=await artifact(t),supplement=await load(a),cp=chart(),baseline=createLocalLuckProfile(cp,{luckPolicyId:M7_LUCK_POLICY_V01}),selected=createLocalLuckProfile(cp,{luckPolicyId:M7_LUCK_POLICY_V01,boundarySupplement:supplement});
 const request=chartRequest('2026-02-05','01:20'),old=baseline.calculate(request,features('FEMALE')),next=selected.calculate(request,features('FEMALE'));
 assert.equal(next.luck.candidates.length,2);assert.deepEqual(next.luck.candidates.map(c=>c.dayun),old.luck.candidates.map(c=>c.dayun));assert.ok(next.luck.candidates.every(c=>c.dayun.start.status==='AMBIGUOUS'));
 assert.throws(()=>createLocalLuckProfile(cp,{luckPolicyId:M7_LUCK_POLICY_V01,boundarySupplement:structuredClone(supplement)}),/ISSUED_BOUNDARY_SUPPLEMENT_REQUIRED/);
 assert.throws(()=>verifyKasi2027BoundarySupplement(supplement,{baseManifestSha256:'0'.repeat(64)}),/BOUNDARY_BASE_PIN_MISMATCH/);
});

test('CLI requires supplement directory and independently supplied pin together without accepting implicit label-only use',()=>{
 const prefix=['--luck-profile',M7_LUCK_POLICY_V01,'--output','json','--seyun-year','2027'];
 assert.throws(()=>parseLocalLuckArgs([...prefix,'--boundary-supplement','x']),/BOUNDARY_DIRECTORY_AND_PIN_REQUIRED_TOGETHER/);
 assert.throws(()=>parseLocalLuckArgs([...prefix,'--boundary-supplement','x','--boundary-supplement-sha','0'.repeat(64)]),/PURE_LABEL_ARGUMENTS/);
});

test('narrow collector makes one annual solar wire request and preserves raw separately with no retry or key output',async t=>{
 const parent=await mkdtemp(join(tmpdir(),'kasi-boundary-collector-'));t.after(()=>rm(parent,{recursive:true,force:true}));let calls=0;
 const result=await collectKasi2027Boundary({directory:join(parent,'new'),key:'SYNTHETIC_TEST_KEY_NOT_A_SECRET_123456789',gitHead:'1'.repeat(40),transport:async url=>{calls++;assert.equal(url.searchParams.get('solYear'),'2027');assert.equal(url.searchParams.has('solMonth'),false);assert.ok(url.pathname.endsWith('/get24DivisionsInfo'));return {status:200,body:xml()};}});
 assert.equal(calls,1);assert.equal(result.actualHttpAttempts,1);assert.equal(result.maxActualHttpAttempts,10);assert.equal(result.retriesPerPage,0);assert.equal(result.status,'COLLECTED_PENDING_INDEPENDENT_PIN_ACCEPTANCE');
 const ledger=await readFile(join(parent,'new','attempts.ndjson'),'utf8');assert.equal(ledger.includes('ServiceKey'),false);assert.equal(ledger.includes('SYNTHETIC_TEST_KEY'),false);
 const manifest=JSON.parse(await readFile(join(parent,'new','manifest.json'),'utf8'));assert.equal(manifest.content.events.length,2);assert.equal(manifest.content.support.completeYear,false);
});

test('authorization or quota failure is one attempt, preserved, with no retry and no substitute artifact',async t=>{
 for(const status of [401,403,429]){const parent=await mkdtemp(join(tmpdir(),'kasi-boundary-denied-'));t.after(()=>rm(parent,{recursive:true,force:true}));let calls=0;const directory=join(parent,'new');
  await assert.rejects(collectKasi2027Boundary({directory,key:'SYNTHETIC_TEST_KEY_NOT_A_SECRET_123456789',gitHead:'1'.repeat(40),transport:async()=>{calls++;return {status,body:''};}}),/HTTP_ERROR/);
  assert.equal(calls,1);assert.equal(JSON.parse(await readFile(join(directory,'collection-failure.json'),'utf8')).actualHttpAttempts,1);await assert.rejects(readFile(join(directory,'manifest.json')));
 }
});

test('real offline CLI accepts explicit synthetic supplement, preserves time-zone meaning and rejects bad pins with no fallback',async t=>{
 const a=await artifact(t),candidate=join(a.directory,'synthetic-candidate');await writeSyntheticLocalChartCandidate(candidate,fixture);
 const blocker=join(a.directory,'deny-network.mjs');await writeFile(blocker,"import net from 'node:net';net.Socket.prototype.connect=function(){throw Error('NETWORK_FORBIDDEN')};globalThis.fetch=()=>{throw Error('NETWORK_FORBIDDEN')};");
 const env={...process.env};for(const key of Object.keys(env))if(/KASI|API_KEY|SERVICE_KEY|DATAGO/i.test(key))delete env[key];delete env.NODE_OPTIONS;
 const args=['--profile',STAGE_A_PROFILE_ID,'--candidate',candidate,'--manifest-sha',basePin,'--calendar','GREGORIAN','--date','2026-12-31','--time','12:00','--clock-policy','KR_API_PUBLISHED_KST_MODERN_1988_POST_DST_V1','--day-rollover','CIVIL_MIDNIGHT','--hour-stem-reference','SELECTED_DAY_PILLAR','--luck-profile',M7_LUCK_POLICY_V01,'--dayun','true','--traditional-sex','MALE','--dayun-count','3','--output','json'];
 const run=(extra,tz='UTC')=>spawnSync(process.execPath,['--import',pathToFileURL(blocker).href,resolve('scripts/kasi/local-luck.mjs'),...args,...extra],{encoding:'utf8',env:{...env,TZ:tz},timeout:30000,maxBuffer:4_000_000});
 const old=run([]);assert.equal(old.status,0,old.stderr);assert.equal(JSON.parse(old.stdout).luck.candidates[0].dayun.start.status,'NEEDS_DATA');
 const flags=['--boundary-supplement',a.directory,'--boundary-supplement-sha',a.pin];const next=run(flags);assert.equal(next.status,0,next.stderr);assert.equal(next.stderr,'');assert.equal(JSON.parse(next.stdout).luck.candidates[0].dayun.start.status,'OK');
 const projection=[...flags,'--calendar-projection',CALENDAR_PROJECTION_POLICY_V02,'--as-of-date','2026-12-31','--as-of-time','13:00'];
 const utc=run(projection),seoul=run(projection,'Asia/Seoul');assert.equal(utc.status,0,utc.stderr);assert.equal(seoul.status,0,seoul.stderr);assert.equal(utc.stdout,seoul.stdout);assert.equal(JSON.parse(utc.stdout).projection.candidates[0].calendar.status,'PROJECTED_UNDER_POLICY');
 for(const extra of [['--boundary-supplement',a.directory,'--boundary-supplement-sha','0'.repeat(64)],['--boundary-supplement',join(a.directory,'absent'),'--boundary-supplement-sha',a.pin]]){const rejected=run(extra);assert.equal(rejected.status,1);assert.equal(rejected.stdout,'');assert.equal(JSON.parse(rejected.stderr).status,'REJECTED');assert.equal(rejected.stderr.includes(a.directory),false);}
});
