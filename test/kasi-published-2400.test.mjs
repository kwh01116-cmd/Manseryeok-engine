// All API responses here are synthetic, not historical calendar references.
import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { Client, Collector, Store } from '../.kasi-build/collector.js';
import { CollectorError, TERMS, compareReference, daysInMonth, fingerprint, normalizeSolar, sha } from '../.kasi-build/schema.js';
import { inspectLocalResponse } from '../.kasi-build/intake.js';

const key='SYNTHETIC_PUBLISHED_2400_CREDENTIAL_not_a_real_key/+=';
const requestOptions={timeoutMs:1000,retries:0,intervalMs:0};
const reported={dateName:'대한',locdate:'19500120',kst:'2400      '};
const xml=items=>'<response><header><resultCode>00</resultCode></header><body><items>'+items.map(item=>'<item>'+Object.entries(item).map(([field,value])=>`<${field}>${value}</${field}>`).join('')+'</item>').join('')+`</items><pageNo>1</pageNo><numOfRows>100</numOfRows><totalCount>${items.length}</totalCount></body></response>`;
const solar=(year,published2400)=>TERMS.map((dateName,index)=>({
  dateName,
  locdate:`${year}${String(Math.floor(index/2)+1).padStart(2,'0')}${index%2?'20':'05'}`,
  kst:published2400&&dateName==='대한'?'2400      ':'0120',
}));
function lunar(year){
  let lunarYear=year-1,lunarMonth=12,lunarDay=1;
  const rows=[];
  for(let month=1;month<=12;month++)for(let day=1;day<=daysInMonth(year,month);day++){
    rows.push({solYear:year,solMonth:month,solDay:day,lunYear:lunarYear,lunMonth:lunarMonth,lunDay:lunarDay,lunNday:30,lunLeapmonth:'평',lunSecha:'갑자(甲子)',lunWolgeon:'을축(乙丑)',lunIljin:'병인(丙寅)'});
    if(++lunarDay===31){lunarDay=1;if(++lunarMonth===13){lunarMonth=1;lunarYear++;}}
  }
  return rows;
}
function backend(published2400){
  const calls=[];
  return {calls,transport:async url=>{
    assert.equal(url.hostname,'apis.data.go.kr');assert.equal(url.protocol,'https:');
    assert.equal(url.searchParams.get('ServiceKey'),key);
    const year=Number(url.searchParams.get('solYear')),month=Number(url.searchParams.get('solMonth'));
    const service=url.pathname.includes('get24DivisionsInfo')?'solar':'lunar';
    assert.equal(Number(url.searchParams.get('pageNo')),1);
    calls.push({service,year,month});
    const rows=service==='solar'?solar(year,published2400):lunar(year).filter(row=>row.solMonth===month);
    return {status:200,body:xml(rows)};
  }};
}
async function setup(action,published2400=true){
  const directory=await mkdtemp(join(tmpdir(),'kasi-published-2400-'));
  const store=new Store(directory),wire=backend(published2400);
  const collector=new Collector(store,new Client(wire.transport,{solar:key,lunar:key},requestOptions));
  const offlineCalls=[];
  const offline=new Collector(store,new Client(async()=>{offlineCalls.push(true);throw Error('offline request forbidden');},{},requestOptions));
  await store.init();
  try{await action({store,wire,collector,offline,offlineCalls});}
  finally{await rm(directory,{recursive:true,force:true});}
}
const rejectsCollector=action=>assert.rejects(action,error=>error instanceof CollectorError);

test('published2400 retains the supplied date and notation without deriving midnight or a new date',()=>{
  const original=structuredClone(reported),row=normalizeSolar(reported,1950);
  assert.deepEqual(reported,original);
  assert.equal(row.date,'1950-01-20');
  assert.equal(row.time,'24:00');
  assert.equal(row.timeNotation,'AS_REPORTED_2400');
  assert.equal(row.precision,'MINUTE');
  assert.equal(row.sunLongitude,null);
  assert.equal(row.timeBasis,'API_KST_AS_PUBLISHED');
  assert.equal(row.historicalCivilTime,'NOT_RESOLVED');
});

test('ordinary midnight and missing times retain their previous contracts without a2400 annotation',()=>{
  for(const [kst,time] of [['0000','00:00'],['2359','23:59'],[' 01 20 ','01:20']]){
    const row=normalizeSolar({...reported,kst},1950);
    assert.equal(row.date,'1950-01-20');assert.equal(row.time,time);
    assert.equal(Object.hasOwn(row,'timeNotation'),false);
  }
  for(const kst of [undefined,'','   ']){
    const row=normalizeSolar({...reported,kst},1950);
    assert.equal(row.time,null);assert.equal(row.precision,'DAY');
    assert.equal(Object.hasOwn(row,'timeNotation'),false);
  }
});

test('the published2400 exception does not admit malformed hours, minutes or input formats',()=>{
  for(const kst of ['2401','2460','2500','1260','120','24:00','24000','120000','-100']){
    assert.throws(()=>normalizeSolar({...reported,kst},1950),error=>error instanceof CollectorError&&error.code==='KST_HHMM',kst);
  }
});

test('a full synthetic year preserves raw2400 evidence and validates offline with normalizer0.1.2',async()=>setup(async({store,collector,offline,offlineCalls})=>{
  const year=await collector.collectYear(1950);
  assert.equal(year.normalizerVersion,'0.1.2');assert.equal(year.status,'COMPLETE');
  assert.equal(year.solar.length,24);assert.equal(year.lunar.length,365);
  const row=year.solar.find(item=>item.term==='대한');
  assert.equal(row.date,'1950-01-20');assert.equal(row.time,'24:00');
  assert.equal(row.timeNotation,'AS_REPORTED_2400');
  const receipt=year.sources.find(source=>source.query.service==='solar');
  const raw=await readFile(join(store.root,'raw',receipt.responseSha256+'.body'),'utf8');
  assert.ok(raw.includes('<kst>2400      </kst>'));
  assert.equal(sha(raw),receipt.responseSha256);
  assert.equal(year.normalizedSha256,fingerprint({solar:year.solar,lunar:year.lunar}));
  assert.equal(year.externalOriginalVerification,'UNVERIFIED');assert.equal(year.rightsReview,'UNVERIFIED');
  assert.deepEqual(await offline.validateYear(1950),year);
  assert.equal(offlineCalls.length,0);
}));

test('probe and offline intake identify the exceptional published notation without marking a complete acquisition',async()=>setup(async({collector})=>{
  const probe=await collector.probe(1950,'solar',true);
  assert.equal(probe.status,'SAMPLE_RESPONSE_VALIDATED');assert.equal(probe.yearComplete,false);
  assert.equal(probe.minuteRows,24);assert.equal(probe.published2400Rows,1);
  assert.equal(probe.data.find(row=>row.term==='대한').timeNotation,'AS_REPORTED_2400');
  const report=inspectLocalResponse(xml(solar(1950,true)),{service:'solar',year:1950});
  assert.equal(report.status,'STRUCTURALLY_COMPLETE_SCOPE');assert.equal(report.yearComplete,false);
  assert.equal(report.minuteRows,24);assert.equal(report.published2400Rows,1);
  assert.equal(report.engineSupportPromotion,false);assert.equal(report.g1P2Promotion,false);
}));

test('literal reference comparison keeps next-day00:00 distinct from the publisheddate24:00',()=>{
  const row=normalizeSolar(reported,1950),before=structuredClone(row);
  const reference={surface:'KASI_ANNUAL_TXT',solar:[{term:'대한',date:'1950-01-21',time:'00:00'}],lunar:[]};
  assert.equal(compareReference([row],[],reference).status,'MISMATCH');
  assert.deepEqual(row,before);
  assert.equal(compareReference([row],[],{surface:'KASI_ANNUAL_TXT',solar:[{term:'대한',date:'1950-01-20',time:'24:00'}],lunar:[]}).status,'MATCH');
});

test('ordinary0.1.0 and0.1.1 caches revalidate as0.1.2 without rewriting original year files',async()=>setup(async({store,collector,offline,offlineCalls})=>{
  const current=await collector.collectYear(1950);
  for(const normalizerVersion of ['0.1.0','0.1.1']){
    await store.json('years/1950.json',{...current,normalizerVersion});
    const path=join(store.root,'years/1950.json'),before=await readFile(path,'utf8');
    const rebuilt=await offline.validateYear(1950);
    assert.equal(rebuilt.normalizerVersion,'0.1.2');assert.deepEqual(rebuilt,current);
    assert.equal(await readFile(path,'utf8'),before);
    assert.equal((await store.read('years/1950.json')).normalizerVersion,normalizerVersion);
  }
  assert.equal(offlineCalls.length,0);
},false));

test('a cache containing2400 cannot claim the old normalizer version',async()=>setup(async({store,collector,offline,offlineCalls})=>{
  const current=await collector.collectYear(1950);
  await store.json('years/1950.json',{...current,normalizerVersion:'0.1.0'});
  await rejectsCollector(()=>offline.validateYear(1950));
  assert.equal(offlineCalls.length,0);
}));

test('legacy compatibility excludes only a supported version and still rejects all other cache mutations',async()=>{
  for(const mutation of ['unsupportedVersion','metadata','normalized','raw'])await setup(async({store,collector,offline,offlineCalls})=>{
    const current=await collector.collectYear(1950),saved={...structuredClone(current),normalizerVersion:'0.1.0'};
    if(mutation==='unsupportedVersion')saved.normalizerVersion='0.0.0';
    if(mutation==='metadata')saved.rightsReview='VERIFIED';
    if(mutation==='normalized'){
      saved.solar[0].time='00:00';
      saved.normalizedSha256=fingerprint({solar:saved.solar,lunar:saved.lunar});
    }
    await store.json('years/1950.json',saved);
    if(mutation==='raw'){
      const receipt=saved.sources[0],path=join(store.root,'raw',receipt.responseSha256+'.body');
      await writeFile(path,(await readFile(path,'utf8'))+' ');
    }
    await rejectsCollector(()=>offline.validateYear(1950));
    assert.equal(offlineCalls.length,0);
  },false);
});
