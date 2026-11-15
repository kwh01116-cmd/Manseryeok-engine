// Source-shape synthetic XML. These are not newly collected API responses.
import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp,mkdir,writeFile,readFile,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {fingerprint,sha,parsePage,TERMS} from '../.kasi-build/schema.js';
import {buildKasi2027BoundaryContent,loadKasi2027BoundarySupplement} from '../scripts/kasi/boundary-supplement.mjs';
import {ANNUAL_SOLAR_EXTENSION_POLICY_ID,inspectExisting2027AnnualSolarContent,loadExisting2027AnnualSolarExtension,verifyExisting2027AnnualSolarExtension} from '../scripts/kasi/annual-solar-extension.mjs';
const base='a'.repeat(64),identity={sourceIdentityKind:'HEAD_PLUS_EXACT_FILE_HASHES',gitHead:'1'.repeat(40),collectorSha256:'2'.repeat(64),normalizerSha256:'3'.repeat(64)};
function xml(change=rows=>rows){const rows=TERMS.map((term,i)=>({dateName:term,locdate:'2027'+String(Math.floor(i/2)+1).padStart(2,'0')+(i%2?'20':'05'),kst:'0120'}));rows[0].kst='2310';rows[2].locdate='20270204';rows[2].kst='1046';return '<response><header><resultCode>00</resultCode></header><body><items>'+change(rows).map(row=>'<item>'+Object.entries(row).map(([key,value])=>'<'+key+'>'+value+'</'+key+'>').join('')+'</item>').join('')+'</items><numOfRows>100</numOfRows><pageNo>1</pageNo><totalCount>24</totalCount></body></response>';}
async function input(t,change){const directory=await mkdtemp(join(tmpdir(),'kasi-annual-source-synthetic-'));t.after(()=>rm(directory,{recursive:true,force:true}));const body=xml(change),receipt={evidenceSurface:'KASI_OPENAPI_RESPONSE',responseHashScope:'UTF8_ENTITY_AFTER_HTTP_DECOMPRESSION',query:{service:'solar',year:2027,page:1,format:'xml'},requestedAt:'2026-11-11T00:00:00.000Z',serviceId:'15012690',operation:'get24DivisionsInfo',responseSha256:sha(body),schema:parsePage(body).schema};const content=buildKasi2027BoundaryContent({pages:[{body,receipt}],baseManifestSha256:base,codeIdentity:identity}),pin=fingerprint(content);await mkdir(join(directory,'raw'));await mkdir(join(directory,'receipts'));await writeFile(join(directory,'raw',sha(body)+'.body'),body);await writeFile(join(directory,'receipts',fingerprint(receipt)+'.json'),JSON.stringify(receipt));await writeFile(join(directory,'manifest.json'),JSON.stringify({contentSha256:pin,content}));return {directory,expectedSupplementSha256:pin,expectedBaseManifestSha256:base,policyId:ANNUAL_SOLAR_EXTENSION_POLICY_ID};}
async function reviewed(t,change){const options=await input(t,change),content=await inspectExisting2027AnnualSolarContent(options);return {...options,expectedAnnualSha256:fingerprint(content)};}

test('annual reuse is explicit and preserves the old two-row supplement behavior',async t=>{
 const options=await reviewed(t);const boundary=await loadKasi2027BoundarySupplement(options),annual=await loadExisting2027AnnualSolarExtension(options);
 assert.equal(boundary.content.events.length,2);assert.deepEqual(boundary.events.map(e=>e.term),['XIAOHAN']);assert.equal(boundary.content.support.completeYear,false);
 assert.equal(annual.events.length,24);assert.equal(annual.evidence.length,24);assert.equal(annual.content.rows[0].displayedDateTime,'2027-01-05T23:10');assert.equal(annual.content.rows[2].displayedDateTime,'2027-02-04T10:46');
 assert.equal(annual.events[4].term,'JINGZHE');assert.equal(annual.events[4].displayedDateTime,'2027-03-05T01:20');assert.equal(annual.events[22].term,'DAXUE');assert.equal(annual.events[22].displayedDateTime,'2027-12-05T01:20');
});
test('all annual events retain actual receipt linkage without creating a clock or lunar authorization',async t=>{
 const options=await reviewed(t),annual=await loadExisting2027AnnualSolarExtension(options);
 assert.equal(verifyExisting2027AnnualSolarExtension(annual,{baseManifestSha256:base}),annual);
 for(let i=0;i<24;i++){const event=annual.events[i],evidence=annual.evidence[i];assert.deepEqual(event.sourceIds,[evidence.id]);assert.equal(evidence.sourceRef,evidence.source.id);assert.equal(evidence.original.sourceRef,evidence.sourceRef);assert.equal(evidence.source.operation,'get24DivisionsInfo');assert.equal(evidence.interpretation.utcInstant,null);assert.equal(evidence.interpretation.birthClockPolicy,null);assert.equal(evidence.interpretation.queryClockPolicy,null);assert.equal(Object.isFrozen(event),true);}
 assert.equal(annual.content.meaning.lunarDateIndex,false);assert.equal(annual.content.meaning.sourceAcquisition,'EXISTING_CAPTURE_NO_NEW_HTTP');assert.equal(annual.limits.includes('NO_2028_BOUNDARIES'),true);
});
test('new runtime selection requires its own independent pin and exact policy',async t=>{
 const options=await reviewed(t);await assert.rejects(loadExisting2027AnnualSolarExtension({...options,expectedAnnualSha256:undefined}),/INDEPENDENT_ANNUAL_SOLAR_PIN_REQUIRED/);
 await assert.rejects(loadExisting2027AnnualSolarExtension({...options,expectedAnnualSha256:'0'.repeat(64)}),/ANNUAL_SOLAR_CONTENT_PIN_MISMATCH/);
 await assert.rejects(loadExisting2027AnnualSolarExtension({...options,policyId:undefined}),/EXPLICIT_ANNUAL_SOLAR_POLICY_REQUIRED/);
 await assert.rejects(loadExisting2027AnnualSolarExtension({...options,policyId:'KASI-2027-AUX-PUBLISHED-KST-BOUNDARY-ONLY-V1'}),/EXPLICIT_ANNUAL_SOLAR_POLICY_REQUIRED/);
});
test('cloned issued results and a different base cannot be consumed as issued annual evidence',async t=>{
 const options=await reviewed(t),annual=await loadExisting2027AnnualSolarExtension(options);
 assert.throws(()=>verifyExisting2027AnnualSolarExtension(structuredClone(annual),{baseManifestSha256:base}),/ISSUED_ANNUAL_SOLAR_EXTENSION_REQUIRED/);
 assert.throws(()=>verifyExisting2027AnnualSolarExtension(annual,{baseManifestSha256:'b'.repeat(64)}),/ANNUAL_SOLAR_BASE_PIN_MISMATCH/);
 await assert.rejects(loadExisting2027AnnualSolarExtension({...options,expectedBaseManifestSha256:'b'.repeat(64)}),/BOUNDARY_BASE_PIN_MISMATCH/);
});
test('tampered raw and source records fail without a fixture fallback',async t=>{
 const options=await reviewed(t),manifest=JSON.parse(await readFile(join(options.directory,'manifest.json'),'utf8')),raw=manifest.content.rawReferences[0].path;
 await writeFile(join(options.directory,raw),(await readFile(join(options.directory,raw),'utf8'))+' ');
 await assert.rejects(loadExisting2027AnnualSolarExtension(options),/BOUNDARY_RAW_OR_SOURCE_HASH_CHANGED/);
});
test('old two-boundary readiness does not suffice if another annual event lacks a minute',async t=>{
 const options=await input(t,rows=>{delete rows[4].kst;return rows;});
 const old=await loadKasi2027BoundarySupplement(options);assert.equal(old.evidence.length,2);
 await assert.rejects(inspectExisting2027AnnualSolarContent(options),/ANNUAL_SOLAR_PUBLISHED_MINUTE_REQUIRED/);
});
