import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp,writeFile,rm,readFile} from 'node:fs/promises';
import {join,resolve,relative,isAbsolute,sep,basename} from 'node:path';
import {tmpdir} from 'node:os';
import {fingerprint,sha} from '../.kasi-build/schema.js';
import {normalizeApiOnlyResponses,projectSolarEvent,projectApiOnlyCandidate,projectApiOnlySources,validateApiOnlyCalendar,assertProductionApiOnlyScope,freeze} from '../scripts/server-data/core.mjs';
import {inspectServerApiOnlyDataPack,loadServerApiOnlyDataPack} from '../scripts/server-data/load.mjs';
import {bindServerApiOnlyLoaded,verifyServerApiOnlyLoaded} from '../scripts/server-data/binding.mjs';
import {SERVER_API_ONLY_FILES,SERVER_API_ONLY_NOTICE,SERVER_API_ONLY_RIGHTS,SERVER_API_ONLY_BASE_PIN,SERVER_API_ONLY_BOUNDARY_PIN,SERVER_API_ONLY_ANNUAL_PIN,SERVER_API_ONLY_ACCEPTED_PIN} from '../scripts/server-data/constants.mjs';
import {parseServerApiOnlyBuildArgs} from '../scripts/server-data/build.mjs';
import {syntheticApiSource,EXPECTED_FIRST_SYNTHETIC_DATE,EXPECTED_FIRST_SYNTHETIC_EVENT} from './fixtures/server-api-only-synthetic.mjs';
const fixture=()=>{const lunar=syntheticApiSource(),solar=syntheticApiSource({service:'solar'});return {records:[lunar.record,solar.record],raw:[lunar.raw,solar.raw]};};
function reidentify(value,edit){const source=structuredClone(value);edit(source.record);const {id,...receipt}=source.record;source.record.id=fingerprint(receipt);source.raw.sourceRef=source.record.id;return source;}
const run=source=>normalizeApiOnlyResponses([source.record],[source.raw]);

test('API-only normalization reuses parser while independent literal rows fix the expected input meaning',()=>{
  const f=fixture(),value=normalizeApiOnlyResponses(f.records,f.raw),first=value.dates[0],event=projectSolarEvent(value.solar[0]);
  assert.deepEqual(first,{...EXPECTED_FIRST_SYNTHETIC_DATE,sourceRef:f.records[0].id});assert.deepEqual(event,{...EXPECTED_FIRST_SYNTHETIC_EVENT,sourceRef:f.records[1].id});
  assert.equal(value.dates.length,31);assert.equal(value.solar.length,24);assert.equal(value.sources.reduce((sum,s)=>sum+s.rowRefs.length,0),55);
  assert.deepEqual(value.months,[{lunarYear:2026,lunarMonth:1,leap:false,monthDays:30},{lunarYear:2026,lunarMonth:2,leap:false,monthDays:30}]);
  const source=value.sources.find(s=>s.id===f.records[0].id);assert.deepEqual(source.rowRefs[0],{apiItemOrdinal:1,recordKey:'lunar:2026-01-01',normalizedContentSha256:fingerprint(EXPECTED_FIRST_SYNTHETIC_DATE)});
  assert.equal(source.provider.name,'한국천문연구원');assert.equal(source.catalogUrl,'https://www.data.go.kr/data/15012679/openapi.do');assert.equal(source.resultCode,'00');
});

test('whitelist rejects foreign services, operations, query fields and acquisition metadata even when rehashed',()=>{
  const original=syntheticApiSource();
  for(const edit of [r=>{r.query.service='holiday';},r=>{r.serviceId='15000000';},r=>{r.operation='getSolCalInfo';},r=>{r.query.ServiceKey='synthetic-forbidden';},r=>{r.query.day=1;},r=>{r.query.year=2027;},r=>{r.query.page=2;},r=>{r.url='https://invalid.local/';},r=>{r.requestedAt='not a capture time';}])assert.throws(()=>run(reidentify(original,edit)),/API_ONLY_/);
  const body=original.raw.body+' ServiceKey=synthetic-forbidden',value=reidentify(original,r=>{r.responseSha256=sha(body);});value.raw.body=body;assert.throws(()=>run(value),/API_ONLY_UNEXPECTED_AUTH_OR_REQUEST_TEXT/);
});

test('raw byte hash and schema/pagination contracts are checked independently of normalized rows',()=>{
  const original=syntheticApiSource(),changed=structuredClone(original);changed.raw.body+=' ';assert.throws(()=>run(changed),/API_ONLY_RAW_SHA/);
  assert.throws(()=>run(reidentify(original,r=>{r.schema.itemFields.push('foreignField');})),/API_ONLY_RAW_SCHEMA_OR_PAGE/);
  const extra=syntheticApiSource({alterItem:items=>{items[0].foreignField='not-whitelisted';}});assert.throws(()=>run(extra),/API_ONLY_UNEXPECTED_RESPONSE_FIELDS/);
  const bad=syntheticApiSource({service:'solar',alterItem:items=>{items[0].dateName='춘절';}});assert.throws(()=>run(bad),/SOLAR_TERM_YEAR/);
});

test('missing, sparse, duplicate, orphan and same-row/different-receipt inputs do not become API-only facts',()=>{
  const f=fixture();assert.throws(()=>normalizeApiOnlyResponses([],[]),/API_ONLY_SOURCE_RAW_CARDINALITY/);
  const sparse=[f.records[0],f.records[1]];delete sparse[0];assert.throws(()=>normalizeApiOnlyResponses(sparse,f.raw),/API_ONLY_SOURCE_ARRAY/);
  assert.throws(()=>normalizeApiOnlyResponses(f.records,[f.raw[0]]),/API_ONLY_SOURCE_RAW_CARDINALITY/);
  assert.throws(()=>normalizeApiOnlyResponses([f.records[0],f.records[0]],[f.raw[0],f.raw[0]]),/API_ONLY_RAW_SOURCE_DUPLICATE/);
  const orphan=structuredClone(f.raw);orphan[0].sourceRef='a'.repeat(64);assert.throws(()=>normalizeApiOnlyResponses(f.records,orphan),/API_ONLY_RAW_SHA/);
  const another=syntheticApiSource({requestedAt:'2026-11-15T00:00:01.000Z'});assert.throws(()=>normalizeApiOnlyResponses([f.records[0],another.record],[f.raw[0],another.raw]),/API_ONLY_DUPLICATE_NORMALIZED_ROW/);
});

test('API null month ganji and published 24:00 remain observations rather than correction-table values',()=>{
  const lunar=syntheticApiSource({alterItem:items=>{for(const row of items){row.lunLeapmonth='윤';row.lunWolgeon='';}items.pop();}});
  // Removing one Gregorian day is invalid; null preservation must not weaken coverage.
  assert.throws(()=>run(lunar),/LUNAR_MISSING_OR_DUPLICATE/);
  const leap=syntheticApiSource({alterItem:items=>{for(const row of items.slice(0,30)){row.lunLeapmonth='윤';row.lunWolgeon='';}}});const observed=run(leap);assert.equal(observed.dates[0].ganji.month,null);assert.equal(observed.dates[0].leap,true);assert.equal(observed.dates[30].ganji.month,'甲子');
  const solar=syntheticApiSource({service:'solar',alterItem:items=>{items[0].kst='2400';}}),value=normalizeApiOnlyResponses([...fixture().records.slice(0,1),solar.record],[...fixture().raw.slice(0,1),solar.raw]);
  const event=projectSolarEvent(value.solar[0]);assert.equal(event.time,'24:00');assert.equal(event.timeNotation,'AS_REPORTED_2400');assert.equal(event.computationalCivilDateTime,null);assert.equal(event.timeStatus,'TIME_NOTATION_REVIEW_REQUIRED');assert.equal(event.utcInstant,null);
});

test('compatibility projection contains only API rows and minimal observed month lengths',()=>{
  const f=fixture(),value=normalizeApiOnlyResponses(f.records,f.raw),calendar={support:value.support,dates:value.dates,events:value.solar.map(projectSolarEvent),months:value.months},candidate=projectApiOnlyCandidate(calendar),sources=projectApiOnlySources(value.sources);
  assert.deepEqual(candidate.dates,value.dates);assert.deepEqual(candidate.events,calendar.events);assert.deepEqual(candidate.months,value.months);
  for(const forbidden of ['audit','dayComparisons','boundaryRequirements','comparisons','exceptions','codeIdentity'])assert.equal(Object.hasOwn(candidate,forbidden),false,forbidden);
  assert.deepEqual(sources.map(({id,...r})=>fingerprint(r)),sources.map(r=>r.id));assert.equal(candidate.status,'RESEARCH_ONLY');
  assert.throws(()=>assertProductionApiOnlyScope(value),/API_ONLY_ACCEPTED_SCOPE/);
  assert.throws(()=>validateApiOnlyCalendar({...calendar,schemaVersion:'forged'},value),/API_ONLY_CALENDAR_FIELDS|API_ONLY_CALENDAR_SCHEMA/);
});

test('new pack lineage is independent of base/annual pins and cannot be accepted by self-reading its digest',async()=>{
  assert.equal(SERVER_API_ONLY_BASE_PIN,'8ffadb04c8460969085610162d3d5e8855af9272a8a4be1dbe10123c15f90edf');assert.equal(SERVER_API_ONLY_ANNUAL_PIN,'77da197d925e5a8907990960530a85454cf87a829745ee9b012c6c328c891a0b');
  const directory=await mkdtemp(join(tmpdir(),'manseryeok-api-only-public-'));
  try{
    await writeFile(join(directory,'manifest.json'),'{}\n');for(const name of SERVER_API_ONLY_FILES)await writeFile(join(directory,name),'{}\n');
    await assert.rejects(loadServerApiOnlyDataPack({directory,expectedPackSha256:'0'.repeat(64)}),/API_ONLY_LOADER_OPTIONS/);
    await assert.rejects(inspectServerApiOnlyDataPack({directory,expectedPackSha256:fingerprint({})}),/API_ONLY_MANIFEST_FIELDS/);
    await assert.rejects(loadServerApiOnlyDataPack({directory}),/API_ONLY_REVIEW_NOT_ACCEPTED|API_ONLY_MANIFEST_FIELDS|API_ONLY_PACK_PIN_MISMATCH/);
    await writeFile(join(directory,'comparisons.json'),'{}');await assert.rejects(inspectServerApiOnlyDataPack({directory,expectedPackSha256:'0'.repeat(64)}),/API_ONLY_FILE_SET/);
  }finally{const r=relative(resolve(tmpdir()),resolve(directory));assert.ok(r&&!isAbsolute(r)&&r!=='..'&&!r.startsWith('..'+sep)&&basename(directory).startsWith('manseryeok-api-only-public-'));await rm(directory,{recursive:true,force:true});}
  assert.equal(SERVER_API_ONLY_RIGHTS.apiOnlyInternalUse,'VERIFIED_ALLOWED_WITH_CONDITIONS');assert.equal(SERVER_API_ONLY_RIGHTS.publicFileDistribution,'UNRESOLVED');assert.ok(SERVER_API_ONLY_NOTICE.includes('not a KASI certification'));
});

test('tiny binding rejects frozen dummy minting, identity promotion and cross-pack clones without IO or response parsing',async()=>{
  const code=await readFile(new URL('../scripts/server-data/binding.mjs',import.meta.url),'utf8');assert.equal(/node:(?:fs|http|https|net)|\b(?:parsePage|readFile|normalizeSolar|normalizeLunar)\b/.test(code),false);assert.match(code,/import \{fingerprint\}/);
  const value=freeze({manifest:{schemaVersion:'synthetic-continuity-only'},candidate:{},sources:[],annualSolarExtension:{},apiOnlyIdentity:{id:'SYNTHETIC_NOT_ACCEPTED_PACK'}});
  assert.throws(()=>bindServerApiOnlyLoaded(value),/API_ONLY_BINDING_FIXED_MANIFEST_REQUIRED/);
  assert.throws(()=>verifyServerApiOnlyLoaded(value),/ISSUED_API_ONLY_LOADER_REQUIRED/);assert.throws(()=>verifyServerApiOnlyLoaded(structuredClone(value)),/ISSUED_API_ONLY_LOADER_REQUIRED/);assert.throws(()=>bindServerApiOnlyLoaded({}),/API_ONLY_FROZEN_LOADER_OBJECT_REQUIRED/);
  // This public fixture is a hash/count descriptor only; no private API row, receipt or body.
  const manifest=JSON.parse(await readFile(new URL('./fixtures/server-api-only-accepted-manifest.json',import.meta.url),'utf8'));assert.equal(fingerprint(manifest),SERVER_API_ONLY_ACCEPTED_PIN);
  const identity={id:'kasi-server-api-only-a2bfbf35aff7bb8b',version:'1.0.0',manifestContentSha256:SERVER_API_ONLY_ACCEPTED_PIN,upstreamBaseManifestSha256:SERVER_API_ONLY_BASE_PIN,upstreamBoundarySupplementSha256:SERVER_API_ONLY_BOUNDARY_PIN,upstreamAnnualSolarSha256:SERVER_API_ONLY_ANNUAL_PIN,rightsReview:'VERIFIED_ALLOWED_WITH_CONDITIONS',validationLevel:'FIXED_API_WHITELIST_RAW_SHA_ROW_LINEAGE_NORMALIZATION_RECHECKED',sourceKind:'KASI_API_ONLY_SERVER_DERIVED',g0Receipt:null,g1P2Promotion:false};
  assert.throws(()=>bindServerApiOnlyLoaded(freeze({...value,manifest,apiOnlyIdentity:identity})),/API_ONLY_BINDING_PROJECTION_CHANGED/);
  for(const changed of [{...identity,rightsReview:'VERIFIED_ALLOWED'},{...identity,g0Receipt:{status:'CERTIFIED'}},{...identity,manifestContentSha256:SERVER_API_ONLY_BASE_PIN},{...identity,validationLevel:'OFFICIAL_AUTHENTICATED'}])assert.throws(()=>bindServerApiOnlyLoaded(freeze({...value,manifest,apiOnlyIdentity:changed})),/API_ONLY_BINDING_IDENTITY_CHANGED/);
});

test('pack builder accepts explicit read-only archive inputs and never API credentials or overwrite flags',()=>{
  assert.deepEqual(parseServerApiOnlyBuildArgs(['--archive','a','--candidate','b','--boundary','c','--out','d']),{archiveDirectory:'a',candidateDirectory:'b',boundaryDirectory:'c',outDir:'d'});
  for(const args of [[],['--archive','a','--candidate','b','--boundary','c','--key','secret'],['--archive','a','--archive','b','--boundary','c','--out','d']])assert.throws(()=>parseServerApiOnlyBuildArgs(args),/API_ONLY_BUILD_ARGUMENTS/);
});
