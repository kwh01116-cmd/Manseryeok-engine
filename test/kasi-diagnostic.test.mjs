import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp,rm,readFile} from 'node:fs/promises';
import {join} from 'node:path';
import {tmpdir} from 'node:os';
import {Store} from '../.kasi-build/collector.js';
import {sha,parsePage,CollectorError} from '../.kasi-build/schema.js';
import {describeSolarItem,diagnoseCachedSolar} from '../.kasi-build/diagnose.js';

test('diagnostic observes short numeric KST without accepting it as HHmm',()=>{
  const r=describeSolarItem({dateName:'소한',locdate:'19500105',kst:'120',sunLongitude:285},1950,1);
  assert.deepEqual(r.kst,{type:'string',value:'120'});
  assert.equal(r.normalization,'KST_HHMM');
  assert.equal(describeSolarItem({dateName:'소한',locdate:'19500105',kst:'0120'},1950,1).normalization,'PASS');
});
test('diagnostic omits arbitrary strings, keys, unknown fields and unexpected term names',()=>{
  const secret='FAKE_DIAGNOSTIC_SECRET_NOT_REAL';
  const r=describeSolarItem({dateName:secret,locdate:secret,kst:secret,sunLongitude:secret,ignored:secret,resultMsg:secret},1950,1);
  assert.ok(!JSON.stringify(r).includes(secret));
  assert.equal(r.term,'[unrecognized term]');
  assert.equal(r.kst.value,'[non-numeric or long value omitted]');
  assert.equal(describeSolarItem({kst:{secret},dateName:'소한'},1950,1).kst.value,'[unsupported value omitted]');
});
test('offline cached diagnostic preserves raw response and records format without credentials or requests',async()=>{
  const root=await mkdtemp(join(tmpdir(),'kasi-diag-'));const store=new Store(root);
  try{
    await store.init();
    const body=JSON.stringify({response:{header:{resultCode:'00'},body:{items:{item:{dateName:'소한',locdate:'19500105',kst:120,sunLongitude:285}},pageNo:1,numOfRows:100,totalCount:1}}});
    const query={service:'solar',year:1950,page:1,format:'xml'};
    const receipt={evidenceSurface:'KASI_OPENAPI_RESPONSE',responseHashScope:'UTF8_ENTITY_AFTER_HTTP_DECOMPRESSION',query,
      requestedAt:'2026-11-09T00:00:00Z',serviceId:'15012690',operation:'get24DivisionsInfo',responseSha256:sha(body),schema:parsePage(body).schema};
    await store.save(body,receipt);
    const {path,report}=await diagnoseCachedSolar(store,1950);
    assert.equal(report.networkRequests,0);assert.equal(report.normalizerChanged,false);
    assert.deepEqual(report.items[0].kst,{type:'number',value:'120'});
    assert.equal(report.items[0].normalization,'KST_HHMM');
    assert.deepEqual(JSON.parse(await readFile(path,'utf8')),report);
    assert.equal(await readFile(join(root,'raw',sha(body)+'.body'),'utf8'),body);
  }finally{await rm(root,{recursive:true,force:true});}
});
test('missing cache cannot become a successful diagnostic',async()=>{
  const root=await mkdtemp(join(tmpdir(),'kasi-diag-empty-'));
  try{await assert.rejects(()=>diagnoseCachedSolar(new Store(root),1950),e=>e instanceof CollectorError&&e.code==='DIAGNOSTIC_NO_CACHED_SOLAR_PAGE');}
  finally{await rm(root,{recursive:true,force:true});}
});
