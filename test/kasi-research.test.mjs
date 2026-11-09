// Entirely synthetic calendar responses, not redistributed KASI data.
import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, readFile, writeFile, rm, mkdir } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { spawnSync } from 'node:child_process';
import { pathToFileURL } from 'node:url';
import { compileRows, createResearchIndex, loadVerified, inventory, loadCandidate, runResearch, compareFixtures } from '../scripts/kasi/research.mjs';
import { Client, Collector, Store } from '../.kasi-build/collector.js';
import { TERMS, fingerprint, sha, normalizeSolar, normalizeLunar } from '../.kasi-build/schema.js';
import { dayPillarForGregorianDate } from '../dist/calendar/dayPillar.js';
import { gregorianDayNumber as day, gregorianDateFromDayNumber as civil } from '../dist/calendar/koreanLunisolarValidation.js';

function synthetic(from=1950,to=1951) {
  let lunarYear=from-1,lunarMonth=11,lunarDay=13,leap=false;
  const lunar=[], years=[];
  for(let n=day(from+'-01-01');n<day((to+1)+'-01-01');n++) {
    const date=civil(n), p=dayPillarForGregorianDate(date);
    const [solYear,solMonth,solDay]=date.split('-').map(Number);
    lunar.push({solYear,solMonth,solDay,lunYear:lunarYear,lunMonth:lunarMonth,lunDay:lunarDay,lunNday:29,lunLeapmonth:leap?'윤':'평',lunSecha:'갑자(甲子)',lunWolgeon:leap?'':'갑자(甲子)',lunIljin:p.stem+p.branch,solJd:n+2440588});
    if(++lunarDay===30) {lunarDay=1;if(lunarMonth===5&&!leap) leap=true;else{leap=false;if(++lunarMonth===13){lunarMonth=1;lunarYear++;}}}
  }
  for(let y=from;y<=to;y++) {
    const solar=TERMS.map((dateName,i)=>({dateName,locdate:`${y}${String(Math.floor(i/2)+1).padStart(2,'0')}${i%2?'20':'05'}`,kst:i===1&&y===from?'2400':'0120'}));
    const normalizedSolar=solar.map(r=>normalizeSolar(r,y)), normalizedLunar=lunar.filter(r=>r.solYear===y).map(r=>normalizeLunar(r,y,r.solMonth));
    years.push({schemaVersion:'kasi-collector-year-v1',year:y,status:'COMPLETE',normalizerVersion:'0.1.2',lunarMode:'monthly',requestedFormat:'xml',solar:normalizedSolar,lunar:normalizedLunar,normalizedSha256:fingerprint({solar:normalizedSolar,lunar:normalizedLunar}),sources:[],externalOriginalVerification:'UNVERIFIED',rightsReview:'UNVERIFIED',rawSolar:solar});
  }
  return {lunar,years};
}
const refingerprint = y => {y.normalizedSha256=fingerprint({solar:y.solar,lunar:y.lunar});};

test('research preserves leap nulls, published 24:00, missing vs derived longitude and unresolved historical time',()=>{
  const {years}=synthetic(), before=fingerprint(years), result=compileRows(years,{from:1950,to:1951});
  assert.equal(fingerprint(years),before);
  assert.equal(result.audit.nullMonthGanji,58); assert.equal(result.audit.nullMonthGanjiGroups,2);
  assert.equal(result.audit.regularMonthNulls,0);
  assert.ok(result.dates.filter(r=>r.ganji.month===null).every(r=>r.leap));
  const term=result.events[1];
  assert.equal(term.date,'1950-01-20'); assert.equal(term.time,'24:00');
  assert.equal(term.timeNotation,'AS_REPORTED_2400'); assert.equal(term.timeStatus,'TIME_NOTATION_REVIEW_REQUIRED');
  assert.equal(term.computationalCivilDateTime,null); assert.equal(term.utcInstant,null);
  assert.equal(term.sunLongitude,null); assert.equal(term.expectedLongitude,300);
  assert.equal(term.timeBasis,'API_KST_AS_PUBLISHED'); assert.equal(term.historicalCivilTime,'NOT_RESOLVED');
  assert.ok(result.events.every(r=>r.utcInstant===null));
  assert.equal(result.audit.yearJoins,1); assert.equal(result.audit.roundTrips,730);
  assert.deepEqual(compileRows(years,{from:1950,to:1951}),result);
});

test('partial lunar months distinguish observed day 1 from back-calculation and restrict both conversion directions',()=>{
  const result=compileRows(synthetic().years,{from:1950,to:1951}), index=createResearchIndex(result.dates);
  assert.equal(result.audit.partialMonths.length,2);
  const first=result.months[0],last=result.months.at(-1);
  assert.equal(first.start.evidence,'ARITHMETIC_BACK_CALCULATION_NOT_OBSERVED');
  assert.equal(last.start.evidence,'API_OBSERVED_DAY_1');
  assert.deepEqual(index.fromGregorianDate(first.start.date),{status:'OUT_OF_COVERAGE'});
  assert.deepEqual(index.fromGregorianDate('1952-01-01'),{status:'OUT_OF_COVERAGE'});
  assert.equal(index.fromLunarDate({...result.dates[0],lunarDay:1}).status,'OUT_OF_OBSERVED_COVERAGE');
  assert.equal(index.fromLunarDate({...result.dates.at(-1),lunarDay:29}).status,'OUT_OF_OBSERVED_COVERAGE');
  for(const r of result.dates) assert.equal(index.fromLunarDate(index.fromGregorianDate(r.solarDate).value).value,r.solarDate);
  assert.throws(()=>index.fromLunarDate({lunarYear:1950,lunarMonth:1,lunarDay:1}),/LUNAR_DATE_SHAPE/);
  const got=index.fromGregorianDate('1950-01-01');got.value.ganji.month='MUTATION';
  assert.notEqual(index.fromGregorianDate('1950-01-01').value.ganji.month,'MUTATION');
});

test('missing/duplicate dates, wrong scope, regular null and cross-year day-cycle tampering are rejected',()=>{
  const reject=(mutate,pattern)=>{const years=synthetic().years;mutate(years);years.forEach(refingerprint);assert.throws(()=>compileRows(years,{from:1950,to:1951}),pattern);};
  reject(ys=>ys[0].lunar.pop(),/LUNAR_MISSING_OR_DUPLICATE/);
  reject(ys=>ys[0].lunar[1]=ys[0].lunar[0],/LUNAR_MISSING_OR_DUPLICATE/);
  reject(ys=>ys.pop(),/YEARS_MISSING/);
  reject(ys=>ys[0].lunar[0].ganji.month=null,/REGULAR_MONTH_GANJI_NULL/);
  reject(ys=>ys[1].lunar[0].ganji.day='甲子',/DAY_GANJI_DISCONTINUITY/);
  reject(ys=>ys[0].solar[1].timeNotation=undefined,/TIME_NOTATION_CONTRACT/);
  const years=synthetic().years;years[0].lunar[0].ganji.day='甲子';
  assert.throws(()=>compileRows(years,{from:1950,to:1951}),/NORMALIZED_DIGEST_CHANGED/);
});

test('cross-year lunar label drift is rejected even when each year passes its own internal sequence',()=>{
  const years=synthetic().years;
  // Shift all second-year lunar month identities, preserving that year's local sequence.
  for(const r of years[1].lunar) {if(++r.lunarMonth===13){r.lunarMonth=1;r.lunarYear++;}}
  years.forEach(refingerprint);
  assert.throws(()=>compileRows(years,{from:1950,to:1951}),/LUNAR_DAY_OR_LENGTH_DISCONTINUITY|LUNAR_MONTH_EDGE|LUNAR_MONTH_SEQUENCE/);
});

const xml=items=>`<response><header><resultCode>00</resultCode></header><body><items>${items.map(r=>'<item>'+Object.entries(r).map(([k,v])=>`<${k}>${v}</${k}>`).join('')+'</item>').join('')}</items><pageNo>1</pageNo><numOfRows>100</numOfRows><totalCount>${items.length}</totalCount></body></response>`;
async function cache(action,base=tmpdir()) {
  const dir=await mkdtemp(join(base,'kasi-research-synthetic-')), store=new Store(dir), data=synthetic(1950,1950);
  try {
    await store.init();
    const collector=new Collector(store,new Client(async url=>({status:200,body:xml(url.pathname.includes('get24DivisionsInfo')?data.years[0].rawSolar:data.lunar.filter(r=>r.solMonth===Number(url.searchParams.get('solMonth'))))}),{solar:'synthetic',lunar:'synthetic'},{timeoutMs:1000,retries:0,intervalMs:0}));
    const year=await collector.collectYear(1950);
    await store.json('export.json',{schemaVersion:'kasi-collector-export-v1',externalOriginalVerification:'UNVERIFIED',rightsReview:'UNVERIFIED',years:[year]});
    await store.json('summary.json',{status:'COMPLETE',from:1950,to:1950,yearCount:1,solarCount:24,lunarCount:365});
    await action({dir,store,year,expected:sha(await readFile(join(dir,'export.json')))});
  } finally {await rm(dir,{recursive:true,force:true});}
}

test('private loader hashes actual raw files and receipts, rebuilds read-only, and detects provenance / raw / export tampering',async()=>cache(async({dir,year,store,expected})=>{
  const before=await inventory(dir), verified=await loadVerified(dir,expected,{from:1950,to:1950});
  assert.equal(verified.references.length,13);assert.equal(verified.rowSources.size,389);assert.equal(verified.solJd.length,365);
  assert.deepEqual(await inventory(dir),before);
  const rawPath=join(dir,'raw',year.sources[0].responseSha256+'.body'), original=await readFile(rawPath);
  await writeFile(rawPath,Buffer.concat([original,Buffer.from(' ')]));
  await assert.rejects(()=>loadVerified(dir,expected,{from:1950,to:1950}),/CACHE_DIGEST_CHANGED/);
  await writeFile(rawPath,original);
  const pagePath=join(dir,'pages','solar-1950-0-0-xml-1.json'), page=JSON.parse(await readFile(pagePath,'utf8'));
  page.receipt.operation='wrongOperation';await writeFile(pagePath,JSON.stringify(page));
  await assert.rejects(()=>loadVerified(dir,expected,{from:1950,to:1950}),/CACHE_RECEIPT/);
  await store.json('pages/solar-1950-0-0-xml-1.json',{schemaVersion:'kasi-page-v1',receipt:year.sources[0]});
  await assert.rejects(()=>loadVerified(dir,'0'.repeat(64),{from:1950,to:1950}),/EXPORT_FILE_DIGEST_CHANGED/);
  await assert.rejects(()=>loadVerified(dir,expected,{from:1950,to:1951}),/SUMMARY_SCOPE/);
  await rm(rawPath);
  await assert.rejects(()=>loadVerified(dir,expected,{from:1950,to:1950}),/CACHE_RAW_MISSING/);
}));

test('offline verified loader runs with network calls blocked and no API keys',async()=>cache(async({dir,expected})=>{
  const blocker=join(dir,'network-blocker.mjs');
  await writeFile(blocker,"import net from 'node:net';net.Socket.prototype.connect=()=>{throw Error('NETWORK_FORBIDDEN')};globalThis.fetch=()=>{throw Error('NETWORK_FORBIDDEN')};");
  const module=pathToFileURL(join(process.cwd(),'scripts/kasi/research.mjs')).href;
  const code=`import {loadVerified} from ${JSON.stringify(module)};const v=await loadVerified(process.argv[1],process.argv[2],{from:1950,to:1950});console.log(v.years.length)`;
  const env={...process.env};for(const key of Object.keys(env)) if(key.includes('KASI') || key.includes('API_KEY')) delete env[key];
  const r=spawnSync(process.execPath,['--import',pathToFileURL(blocker).href,'--input-type=module','-e',code,dir,expected],{env,encoding:'utf8',timeout:20000});
  assert.equal(r.status,0,r.stderr);assert.equal(r.stdout.trim(),'1');
}));

test('fixture comparison retains mismatches, unsupported scope and unresolved time rather than manufacturing matches',async()=>{
  const candidate=compileRows(synthetic(2026,2026).years,{from:2026,to:2026});
  const result=await compareFixtures(candidate);
  assert.equal(result.solar.filter(r=>r.status==='MISMATCH').length,23);
  assert.equal(result.solar.filter(r=>r.status==='POLICY_UNRESOLVED').length,1);
  assert.equal(result.solar.filter(r=>r.status==='UNSUPPORTED').length,1);
  assert.ok(result.lunar[0].counts.MISMATCH>0);
});

test('private snapshots reproduce byte-for-byte and a pinned consumer rejects saved data/source or manifest tampering',async()=>{
  const privateDir=join(process.cwd(),'.private');await mkdir(privateDir,{recursive:true});
  await cache(async({dir,expected})=>{
    const first=join(privateDir,'research-output-'+Date.now()+'-first'), second=first+'-second';
    try {
      const options={input:dir,expectedExportSha256:expected,from:1950,to:1950};
      const before=await inventory(dir), a=await runResearch({...options,out:first}), b=await runResearch({...options,out:second});
      assert.equal(a.manifestContentSha256,b.manifestContentSha256);
      const manifest=JSON.parse(await readFile(join(first,'manifest.json'),'utf8'));
      const exceptions=JSON.parse(await readFile(join(first,'exceptions.json'),'utf8'));
      assert.equal(exceptions.nullCalendarMonthGanji.length,1);
      assert.equal(exceptions.nullCalendarMonthGanji[0].rows,29);
      assert.equal(exceptions.timeNotationReview.length,1);
      assert.equal(exceptions.missingApiLongitude.length,24);
      // 12 days before the observed first day + 365 days = 13 complete 29-day months.
      assert.equal(exceptions.partialMonths.length,1);
      const generated=JSON.parse(await readFile(join(first,'candidate.json'),'utf8'));
      assert.equal(generated.months.at(-1).partial,false);
      assert.equal(generated.months.at(-1).lastLunarDay,29);
      for(const f of manifest.derived) assert.deepEqual(await readFile(join(first,f.path)),await readFile(join(second,f.path)));
      assert.deepEqual(await inventory(dir),before);
      const loaded=await loadCandidate(first,a.manifestContentSha256);
      assert.equal(loaded.index.fromGregorianDate('1949-12-31').status,'OUT_OF_COVERAGE');
      await assert.rejects(()=>runResearch({...options,out:first}),/EEXIST/);
      const path=join(first,'candidate.json'), candidate=JSON.parse(await readFile(path,'utf8'));
      candidate.dates[0].sourceRef='forged';await writeFile(path,JSON.stringify(candidate));
      await assert.rejects(()=>loadCandidate(first,a.manifestContentSha256),/DERIVED_FILE_DIGEST_CHANGED/);
      manifest.apiRequests=1;await writeFile(join(first,'manifest.json'),JSON.stringify(manifest));
      await assert.rejects(()=>loadCandidate(first,a.manifestContentSha256),/MANIFEST_DIGEST_CHANGED/);
    } finally {await rm(first,{recursive:true,force:true});await rm(second,{recursive:true,force:true});}
  },privateDir);
});
