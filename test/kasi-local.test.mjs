// Synthetic collector responses only. These tests are not KASI calendar oracles.
import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, readFile, readdir, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { Client, Collector, Store, atomicWrite } from '../.kasi-build/collector.js';
import { CollectorError, TERMS, daysInMonth } from '../.kasi-build/schema.js';
import { TARGET_YEARS, SAMPLE_YEARS, runLocal, parseLocalArgs } from '../.kasi-build/local.js';

const key='SYNTHETIC_LOCAL_COLLECTOR_CREDENTIAL_not_a_real_key/+=';

test('local command arguments require explicit bulk and isolate mode/format selection',()=>{
  assert.deepEqual(parseLocalArgs([]),{command:'wizard',mode:'monthly',format:'xml',allowBulk:false});
  assert.deepEqual(parseLocalArgs(['collect','--allow-bulk','--lunar-mode','daily','--format','json']),
    {command:'collect',mode:'daily',format:'json',allowBulk:true});
  for(const args of [['collect'],['wizard','--allow-bulk'],['validate','--allow-bulk'],['samples','--format','yaml'],
    ['wizard','--lunar-mode','guess'],['wizard','--format','xml','--format','xml'],['wizard','--key','not-accepted']]){
    assert.throws(()=>parseLocalArgs(args),CollectorError);
  }
});
const clientOptions={ timeoutMs:1000, retries:0, intervalMs:0 };
const envelope=items=>JSON.stringify({response:{header:{resultCode:'00',resultMsg:'OK'},body:{items:{item:items},pageNo:1,numOfRows:100,totalCount:items.length}}});
const solar=y=>TERMS.map((dateName,index)=>({
  dateName,
  locdate:`${y}${String(Math.floor(index/2)+1).padStart(2,'0')}${index%2?'20':'05'}`,
  kst:'0120',
  sunLongitude:(285+index*15)%360,
}));

// A deliberately synthetic sequence that exercises within-year lunar continuity.
// It does not assert historical calendar dates or continuity between API years.
function lunar(y){
  let lunarYear=y-1,lunarMonth=12,lunarDay=1;
  const rows=[];
  for(let month=1;month<=12;month++)for(let day=1;day<=daysInMonth(y,month);day++){
    rows.push({solYear:y,solMonth:month,solDay:day,lunYear:lunarYear,lunMonth:lunarMonth,lunDay:lunarDay,lunNday:30,lunLeapmonth:'평',lunSecha:'갑자(甲子)',lunWolgeon:'을축(乙丑)',lunIljin:'병인(丙寅)'});
    if(++lunarDay===31){lunarDay=1;if(++lunarMonth===13){lunarMonth=1;lunarYear++;}}
  }
  return rows;
}
function backend(change=()=>{}){
  const calls=[];
  const transport=async url=>{
    assert.equal(url.hostname,'apis.data.go.kr');
    assert.equal(url.protocol,'https:');
    assert.equal(url.searchParams.get('ServiceKey'),key);
    const service=url.pathname.includes('get24DivisionsInfo')?'solar':'lunar';
    const year=Number(url.searchParams.get('solYear'));
    const month=Number(url.searchParams.get('solMonth'));
    const day=Number(url.searchParams.get('solDay'));
    assert.equal(Number(url.searchParams.get('pageNo')),1);
    const request={service,year,month,day};calls.push(request);
    const rows=service==='solar'?solar(year):lunar(year).filter(row=>row.solMonth===month&&(!day||row.solDay===day));
    await change(request,rows);
    return {status:200,body:envelope(rows)};
  };
  return {calls,transport};
}
async function setup(action){
  const directory=await mkdtemp(join(tmpdir(),'kasi-local-test-'));
  const store=new Store(directory);
  try{await action(store);}finally{await rm(directory,{recursive:true,force:true});}
}
const collector=(store,wire)=>new Collector(store,new Client(wire.transport,{solar:key,lunar:key},clientOptions));
const noNetwork=(store,calls)=>new Collector(store,new Client(async()=>{calls.push('unexpected request');throw Error('offline workflow attempted a network request');},{},clientOptions));
const isCollectorError=error=>error instanceof CollectorError;

test('local collection target is exactly the requested 77 years and two sample years',()=>{
  assert.deepEqual([...TARGET_YEARS],Array.from({length:77},(_,index)=>1950+index));
  assert.deepEqual([...SAMPLE_YEARS],[1950,2026]);
});

test('local bulk collection requires acknowledgment before any request or completed output',async()=>setup(async store=>{
  const wire=backend();
  await assert.rejects(()=>runLocal({store,collector:collector(store,wire),stage:'collect'}),isCollectorError);
  assert.equal(wire.calls.length,0);
  assert.deepEqual(await readdir(store.root),[]);
  assert.equal(await store.read('export.json'),undefined);
  assert.equal(await store.read('summary.json'),undefined);
}));

test('sample workflow collects both complete sample years and never starts another year',async()=>setup(async store=>{
  const wire=backend(),progress=[];
  const result=await runLocal({store,collector:collector(store,wire),stage:'samples',onProgress:event=>progress.push(event)});
  assert.equal(result.status,'SAMPLES_READY');
  assert.deepEqual([...new Set(wire.calls.map(call=>call.year))].sort((a,b)=>a-b),[1950,2026]);
  for(const year of SAMPLE_YEARS){
    const saved=await store.read(`years/${year}.json`);
    assert.equal(saved.status,'COMPLETE');
    assert.equal(saved.solar.length,24);
    assert.equal(saved.lunar.length,365);
  }
  assert.ok(progress.length>0);
  assert.equal(await store.read('export.json'),undefined);
  assert.equal((await store.read('summary.json')).status,'SAMPLES_READY');
}));

test('a date-only solar sample blocks other years and never becomes a complete export',async()=>setup(async store=>{
  const wire=backend(({service,year},rows)=>{if(service==='solar'&&year===1950)for(const row of rows)delete row.kst;});
  await assert.rejects(()=>runLocal({store,collector:collector(store,wire),stage:'collect',allowBulk:true}),isCollectorError);
  assert.ok(wire.calls.every(call=>SAMPLE_YEARS.includes(call.year)));
  assert.equal(await store.read('years/1950.json'),undefined);
  assert.equal(await store.read('export.json'),undefined);
  assert.notEqual((await store.read('summary.json')).status,'COMPLETE');
}));

test('full local workflow validates 77 years, resumes without requests and validates offline without keys',async()=>setup(async store=>{
  const wire=backend(),progress=[];
  const first=await runLocal({store,collector:collector(store,wire),stage:'collect',allowBulk:true,onProgress:event=>progress.push(event)});
  assert.equal(first.status,'COMPLETE');
  assert.equal(wire.calls.length,1001); // 77 solar years + 77 * 12 lunar months.
  const summary=await store.read('summary.json');
  for(const [name,expected] of Object.entries({status:'COMPLETE',from:1950,to:2026,yearCount:77,solarCount:1848,lunarCount:28124,externalOriginalVerification:'UNVERIFIED',rightsReview:'UNVERIFIED'}))assert.equal(summary[name],expected,name);
  const exported=await store.read('export.json');
  assert.equal(exported.years.length,77);
  assert.deepEqual(exported.years.map(data=>data.year),[...TARGET_YEARS]);
  assert.equal(exported.externalOriginalVerification,'UNVERIFIED');
  assert.equal(exported.rightsReview,'UNVERIFIED');
  assert.ok(progress.some(event=>event.year===1951));
  assert.ok(progress.some(event=>event.year===2026));
  assert.ok(!JSON.stringify({summary,exported,progress}).includes(key));

  const count=wire.calls.length;
  const resumed=await runLocal({store,collector:collector(store,wire),stage:'collect',allowBulk:true});
  assert.equal(resumed.status,'COMPLETE');
  assert.equal(wire.calls.length,count);
  const offlineCalls=[];
  const validated=await runLocal({store,collector:noNetwork(store,offlineCalls),stage:'validate'});
  assert.equal(validated.status,'COMPLETE');
  assert.equal((await store.read('summary.json')).lunarCount,28124);
  assert.equal(wire.calls.length,count);
  assert.equal(offlineCalls.length,0);
}));

test('interrupted collection retains checkpoints without publishing a complete full-range output',async()=>setup(async store=>{
  const wire=backend(({service,year,month})=>{if(service==='lunar'&&year===1951&&month===2)throw Error('synthetic interruption');});
  await assert.rejects(()=>runLocal({store,collector:collector(store,wire),stage:'collect',allowBulk:true}),isCollectorError);
  assert.equal((await store.read('years/1950.json')).status,'COMPLETE');
  assert.equal((await store.read('years/2026.json')).status,'COMPLETE');
  assert.equal(await store.read('years/1951.json'),undefined);
  assert.ok(await store.read('pages/lunar-1951-1-0-xml-1.json'));
  assert.ok(wire.calls.every(call=>call.year===1950||call.year===1951||call.year===2026));
  assert.equal(await store.read('export.json'),undefined);
  assert.notEqual((await store.read('summary.json')).status,'COMPLETE');
}));

test('offline validation of incomplete data never probes or produces a successful export',async()=>setup(async store=>{
  const offlineCalls=[];
  await assert.rejects(()=>runLocal({store,collector:noNetwork(store,offlineCalls),stage:'validate'}),isCollectorError);
  assert.equal(await store.read('export.json'),undefined);
  assert.notEqual((await store.read('summary.json')).status,'COMPLETE');
  assert.equal(offlineCalls.length,0);
}));

test('a failed revalidation invalidates a previous COMPLETE readiness summary',async()=>setup(async store=>{
  await store.init();
  await store.json('summary.json',{status:'COMPLETE',from:1950,to:2026,yearCount:77});
  await store.json('export.json',{priorArtifact:true});
  const offlineCalls=[];
  await assert.rejects(()=>runLocal({store,collector:noNetwork(store,offlineCalls),stage:'validate'}),isCollectorError);
  assert.notEqual((await store.read('summary.json')).status,'COMPLETE');
  assert.deepEqual(await store.read('export.json'),{priorArtifact:true});
  assert.equal(offlineCalls.length,0);
}));

test('Windows atomic write branch replaces files and cleans temporary files',async()=>setup(async store=>{
  await store.init();
  const path=join(store.root,'replacement.json');
  await atomicWrite(path,'first','win32');
  await atomicWrite(path,'second','win32');
  assert.equal(await readFile(path,'utf8'),'second');
  // The normal host path still uses the POSIX directory sync on this Linux host.
  await atomicWrite(path,'third');
  assert.equal(await readFile(path,'utf8'),'third');
  assert.ok(!(await readdir(store.root)).some(name=>name.includes('.tmp-')));
}));
