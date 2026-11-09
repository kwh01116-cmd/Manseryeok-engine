// Synthetic response fixtures. The live response remains in the private cache.
import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, readFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { Client, Collector, Store } from '../.kasi-build/collector.js';
import { CollectorError, TERMS, daysInMonth, fingerprint, normalizeLunar, parsePage } from '../.kasi-build/schema.js';
import { inspectLocalResponse } from '../.kasi-build/intake.js';

const row = { solYear:1952, solMonth:6, solDay:22, lunYear:1952, lunMonth:5, lunDay:1,
  lunNday:30, lunLeapmonth:'윤', lunSecha:'임진(壬辰)', lunWolgeon:'', lunIljin:'기해(己亥)' };
const xml = items => '<response><header><resultCode>00</resultCode></header><body><items>' + items.map(item =>
  '<item>' + Object.entries(item).map(([name,value]) => `<${name}>${value}</${name}>`).join('') + '</item>').join('') +
  `</items><pageNo>1</pageNo><numOfRows>100</numOfRows><totalCount>${items.length}</totalCount></body></response>`;

test('a reported empty leap-month ganji is retained as null without filling a value', () => {
  for (const lunWolgeon of ['', '   ']) {
    const original = { ...row, lunWolgeon };
    const input = structuredClone(original);
    const parsed = parsePage(xml([input])).items[0];
    const normalized = normalizeLunar(parsed, 1952, 6);
    assert.equal(normalized.leap, true);
    assert.deepEqual(normalized.ganji, {year:'임진(壬辰)',month:null,day:'기해(己亥)'});
    assert.equal(inspectLocalResponse(xml([input]),{service:'lunar',year:1952,month:6,day:22}).unreportedLeapMonthGanjiRows,1);
    assert.deepEqual(input, original);
  }
});

test('empty regular-month ganji, missing fields and malformed ganji remain rejected', () => {
  for (const extra of [
    {lunLeapmonth:'평'}, {lunWolgeon:undefined}, {lunWolgeon:null},
    {lunWolgeon:'arbitrary'}, {lunSecha:''}, {lunIljin:''},
  ]) {
    assert.throws(() => normalizeLunar({...row,...extra},1952,6), CollectorError);
  }
});

test('a supplied valid leap-month ganji keeps its literal source value', () => {
  const normalized = normalizeLunar({...row,lunWolgeon:'병오(丙午)'},1952,6);
  assert.equal(normalized.ganji.month,'병오(丙午)');
});

function syntheticYear(year) {
  const rows = [];
  let lunarYear=year-1, lunarMonth=12, lunarDay=1, leap=false;
  for (let month=1;month<=12;month++) for (let day=1;day<=daysInMonth(year,month);day++) {
    rows.push({...row,solYear:year,solMonth:month,solDay:day,lunYear:lunarYear,lunMonth:lunarMonth,
      lunDay:lunarDay,lunNday:29,lunLeapmonth:leap?'윤':'평',lunWolgeon:leap?'':'병오(丙午)'});
    if (++lunarDay===30) {
      lunarDay=1;
      if (lunarMonth===5&&!leap) leap=true;
      else { leap=false; if (++lunarMonth===13) { lunarMonth=1; lunarYear++; } }
    }
  }
  return rows;
}

async function setup(action) {
  const root=await mkdtemp(join(tmpdir(),'kasi-leap-ganji-'));
  const store=new Store(root), lunar=syntheticYear(1952);
  await store.init();
  let requests=0;
  const transport=async url => {
    requests++;
    const month=Number(url.searchParams.get('solMonth'));
    const rows=url.pathname.includes('get24DivisionsInfo')
      ? TERMS.map((dateName,index)=>({dateName,locdate:`1952${String(Math.floor(index/2)+1).padStart(2,'0')}${index%2?'20':'05'}`,kst:'0120'}))
      : lunar.filter(item=>item.solMonth===month);
    return {status:200,body:xml(rows)};
  };
  const collector=new Collector(store,new Client(transport,{solar:'synthetic',lunar:'synthetic'},{timeoutMs:1000,retries:0,intervalMs:0}));
  const offline=new Collector(store,new Client(async()=>{throw new Error('OFFLINE_NETWORK_FORBIDDEN');},{}));
  try { await action({store,collector,offline,requests:()=>requests}); }
  finally { await rm(root,{recursive:true,force:true}); }
}

test('full-year raw evidence and null month ganji revalidate offline with version0.1.2', async()=>setup(async({store,collector,offline,requests})=>{
  const year=await collector.collectYear(1952);
  assert.equal(year.normalizerVersion,'0.1.2');
  assert.equal(year.lunar.length,366);
  assert.equal(year.lunar.filter(item=>item.ganji.month===null).length,29);
  assert.equal(year.normalizedSha256,fingerprint({solar:year.solar,lunar:year.lunar}));
  const source=year.sources.find(source=>source.query.service==='lunar'&&source.query.month===6);
  const raw=await readFile(join(store.root,'raw',source.responseSha256+'.body'),'utf8');
  assert.ok(raw.includes('<lunWolgeon></lunWolgeon>'));
  const count=requests();
  assert.deepEqual(await offline.validateYear(1952),year);
  assert.equal(requests(),count);
  assert.equal(year.externalOriginalVerification,'UNVERIFIED');
}));

test('legacy version claims and inferred replacements cannot conceal a null month ganji', async()=>setup(async({store,collector,offline})=>{
  const year=await collector.collectYear(1952);
  for (const normalizerVersion of ['0.1.0','0.1.1']) {
    await store.json('years/1952.json',{...year,normalizerVersion});
    await assert.rejects(()=>offline.validateYear(1952),error=>error instanceof CollectorError&&error.code==='LEGACY_YEAR_HAS_NEW_GANJI_NULL');
  }
  const changed=structuredClone(year);
  changed.lunar.find(item=>item.ganji.month===null).ganji.month='병오(丙午)';
  changed.normalizedSha256=fingerprint({solar:changed.solar,lunar:changed.lunar});
  await store.json('years/1952.json',changed);
  await assert.rejects(()=>offline.validateYear(1952),error=>error instanceof CollectorError&&error.code==='YEAR_DATA_OR_FINGERPRINT_CHANGED');
}));
