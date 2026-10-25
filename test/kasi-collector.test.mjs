// All responses here are synthetic. None is a live KASI response or calendar oracle.
import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp,rm,readFile,writeFile,readdir,stat} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {spawnSync} from 'node:child_process';
import {Client,Collector,Store,atomicWrite} from '../.kasi-build/collector.js';
import {parsePage,normalizeSolar,normalizeLunar,validateSolar,validateLunar,TERMS,daysInMonth,CollectorError,compareReference,sha} from '../.kasi-build/schema.js';
import {parseArgs,selectedYears,main,resolveApiKeys} from '../.kasi-build/cli.js';
const secret='SYNTHETIC_CREDENTIAL_not_a_real_key/+=';
const options={timeoutMs:100,retries:0,intervalMs:0};
const envelope=(items,page=1,size=100,total=items.length)=>JSON.stringify({response:{header:{resultCode:'00',resultMsg:'OK'},body:{items:{item:items.length===1?items[0]:items},pageNo:page,numOfRows:size,totalCount:total}}});
const xml=(items,page=1,size=100,total=items.length)=>'<response><header><resultCode>00</resultCode></header><body><items>'+items.map(i=>'<item>'+Object.entries(i).map(([k,v])=>`<${k}>${v}</${k}>`).join('')+'</item>').join('')+`</items><pageNo>${page}</pageNo><numOfRows>${size}</numOfRows><totalCount>${total}</totalCount></body></response>`;
const solar=y=>TERMS.map((dateName,i)=>({dateName,locdate:`${y}${String(Math.floor(i/2)+1).padStart(2,'0')}${i%2?'20':'05'}`,kst:' 01 20 ',sunLongitude:(285+i*15)%360}));
function lunar(y,withLeap=false){
 let ly=y-1,lm=12,ld=1,leap=false;const rows=[];
 for(let m=1;m<=12;m++)for(let d=1;d<=daysInMonth(y,m);d++){
   rows.push({solYear:String(y),solMonth:String(m).padStart(2,'0'),solDay:String(d).padStart(2,'0'),lunYear:ly,lunMonth:lm,lunDay:ld,lunNday:29,lunLeapmonth:leap?'윤':'평',lunSecha:'갑자(甲子)',lunWolgeon:'을축(乙丑)',lunIljin:'병인(丙寅)'});
   if(++ld===30){ld=1;if(withLeap&&lm===6&&!leap){leap=true;}else{leap=false;if(++lm===13){lm=1;ly++;}}}
 }
 return rows;
}
function backend(change=()=>{}){
 const counts=new Map();
 const transport=async url=>{
  assert.equal(url.protocol,'https:');assert.equal(url.hostname,'apis.data.go.kr');assert.equal(url.searchParams.get('ServiceKey'),secret);
  const y=Number(url.searchParams.get('solYear')),m=Number(url.searchParams.get('solMonth')),d=Number(url.searchParams.get('solDay')),p=Number(url.searchParams.get('pageNo'));
  const service=url.pathname.includes('get24DivisionsInfo')?'solar':'lunar';
  const id=[service,y,m,d,p].join('-');counts.set(id,(counts.get(id)??0)+1);
  const all=service==='solar'?solar(y):lunar(y,true).filter(r=>Number(r.solMonth)===m&&(!d||Number(r.solDay)===d));
  const size=10,items=all.slice((p-1)*size,p*size);
  const result={status:200,body:envelope(items,p,size,all.length)};
  await change({result,service,y,m,d,p,id});return result;
 };
 return {transport,counts};
}
async function setup(fn){const root=await mkdtemp(join(tmpdir(),'kasi-test-'));const store=new Store(root);await store.init();try{await fn(store);}finally{await rm(root,{recursive:true,force:true});}}
const collector=(store,b=backend(),format='xml',mode='monthly')=>new Collector(store,new Client(b.transport,{solar:secret,lunar:secret},options),format,mode);
const q={service:'solar',year:2026,page:1,format:'xml'};
const reject=(f,code)=>assert.rejects(f,e=>e instanceof CollectorError&&(!code||e.code===code));

test('collector parses XML/JSON singleton and array and records actual field schemas',()=>{
 for(const make of [xml,envelope])for(const rows of [[solar(2026)[0]],solar(2026)]){
   const p=parsePage(make(rows));assert.equal(p.items.length,rows.length);assert.ok(p.schema.itemFields.includes('kst'));assert.ok(p.schema.headerFields.includes('resultCode'));
 }
 assert.equal(parsePage(envelope([])).total,0);
 for(const raw of ['<response>','<!DOCTYPE a [<!ENTITY x SYSTEM "file:///etc/passwd">]><a/>','not xml',JSON.stringify({OpenAPI_ServiceResponse:{cmmMsgHeader:{returnReasonCode:'30'}}})])assert.throws(()=>parsePage(raw),CollectorError);
});
test('solar rows retain missing minute precision and reject malformed times/dates/longitude',()=>{
 const base=solar(2026)[0];assert.equal(normalizeSolar(base,2026).time,'01:20');
 for(const kst of [undefined,'','   ']){const r=normalizeSolar({...base,kst},2026);assert.equal(r.time,null);assert.equal(r.precision,'DAY');}
 for(const kst of ['2400','1260','120','01:20','120000'])assert.throws(()=>normalizeSolar({...base,kst},2026),CollectorError);
 for(const extra of [{locdate:'20260230'},{locdate:'20250105'},{sunLongitude:286},{dateName:'unknown'}])assert.throws(()=>normalizeSolar({...base,...extra},2026),CollectorError);
 const rows=solar(2026).map(i=>normalizeSolar(i,2026));validateSolar(rows,2026);
 assert.throws(()=>validateSolar(rows.slice(1),2026),CollectorError);assert.throws(()=>validateSolar([...rows.slice(1),rows[1]],2026),CollectorError);
});
test('lunar normalization preserves lunar year, leap identity, month sizes and ganji without interpretation',()=>{
 const source=lunar(2026,true),rows=source.map(i=>normalizeLunar(i,2026,Number(i.solMonth)));
 validateLunar(rows,2026);assert.equal(rows[0].lunarYear,2025);assert.ok(rows.some(r=>r.leap));
 assert.equal(rows[0].ganji.year,'갑자(甲子)');
 for(const extra of [{lunLeapmonth:'AUTO'},{lunNday:28},{lunDay:30},{lunYear:2024},{lunIljin:'arbitrary'}])assert.throws(()=>normalizeLunar({...source[0],...extra},2026,1),CollectorError);
 assert.throws(()=>validateLunar(rows.slice(1),2026),CollectorError);
 assert.throws(()=>validateLunar([...rows.slice(1),rows[1]],2026),CollectorError);
 const bad=structuredClone(rows);bad[1].lunarDay++;assert.throws(()=>validateLunar(bad,2026),CollectorError);
});
test('HTTP failures, internal HTTP-200 API errors and network exception messages never expose credentials',async()=>{
 const encoded=encodeURIComponent(secret);
 for(const transport of [async()=>({status:403,body:secret}),async()=>({status:200,body:JSON.stringify({response:{header:{resultCode:'30',resultMsg:secret}}})}),async()=>{throw new Error('https://host/?ServiceKey='+encoded);},async()=>({status:200,body:envelope([{echo:secret}])})]){
   const client=new Client(transport,{solar:secret},options);
   await assert.rejects(client.request(q),error=>{const text=String(error)+JSON.stringify(error);assert.ok(!text.includes(secret)&&!text.includes(encoded)&&!text.includes('https://'));return error instanceof CollectorError;});
 }
});
test('HTTPS-only endpoints encode the service key once, use isolated approvals and never follow arbitrary hosts',async()=>{
 let calls=0;const client=new Client(async url=>{calls++;assert.equal(url.searchParams.get('ServiceKey'),secret);return {status:200,body:envelope(solar(2026))};},{solar:encodeURIComponent(secret)},options);
 await client.request(q);assert.equal(calls,1);
 await reject(()=>client.request({...q,service:'lunar',month:1}),'MISSING_KASI_LUNAR_API_KEY');assert.equal(calls,1);
 await reject(()=>client.request({...q,year:1949}),'YEAR_RANGE_1950_2027');
});
test('timeouts are bounded and retries limited; malformed responses are not retried',async()=>{
 let calls=0;const client=new Client(async()=>{calls++;return new Promise(()=>{});},{solar:secret},{timeoutMs:5,retries:1,intervalMs:0});
 await reject(()=>client.request(q),'REQUEST_TIMEOUT');assert.equal(calls,2);
 calls=0;await reject(()=>new Client(async()=>{calls++;return {status:503,body:''};},{solar:secret},{...options,retries:1}).request(q),'HTTP_ERROR');assert.equal(calls,2);
 calls=0;await reject(()=>new Client(async()=>{calls++;return {status:200,body:'bad'};},{solar:secret},{...options,retries:2}).request(q),'RESPONSE_PARSE');assert.equal(calls,1);
});
test('rate limiter serializes concurrent requests',async()=>{
 const times=[];const client=new Client(async()=>{times.push(Date.now());return {status:200,body:envelope(solar(2026))};},{solar:secret},{...options,intervalMs:30});
 await Promise.all([client.request(q),client.request(q)]);assert.ok(times[1]-times[0]>=25);
});
test('pagination collects every page, full leap Gregorian years and offline revalidation need no key',async()=>setup(async store=>{
 const b=backend(),c=collector(store,b),data=await c.collectYear(2024);assert.equal(data.lunar.length,366);assert.equal(data.solar.length,24);
 assert.ok(b.counts.size>13);assert.equal(data.sources[0].serviceId,'15012690');assert.ok(data.sources.some(s=>s.schema.format==='json')); // actual JSON, although XML was requested
 const noNetwork=new Collector(store,new Client(async()=>{throw new Error('must not request');},{},options));
 assert.deepEqual(await noNetwork.validateYear(2024),data);
 assert.equal(data.externalOriginalVerification,'UNVERIFIED');assert.equal(data.rightsReview,'UNVERIFIED');
}));
test('missing/repeated/changed-total/ignored pagination fails without a complete-year marker',async()=>{
 for(const mutation of ['repeat','short','total','duplicate'])await setup(async store=>{
   const b=backend(({result,service,p})=>{if(service==='solar'&&p===2){const v=JSON.parse(result.body);if(mutation==='repeat')v.response.body.pageNo=1;if(mutation==='short')v.response.body.items.item.pop();if(mutation==='total')v.response.body.totalCount=23;if(mutation==='duplicate')v.response.body.items.item[0]=solar(2026)[0];result.body=JSON.stringify(v);}});
   await reject(()=>collector(store,b).collectYear(2026));assert.equal(await store.read('years/2026.json'),undefined);
 });
});
test('interruption resumes only missing pages and never duplicates already collected data',async()=>setup(async store=>{
 let stop=true;const b=backend(({service,m,p})=>{if(stop&&service==='lunar'&&m===2&&p===1)throw Error('interrupted');});const c=collector(store,b);
 await reject(()=>c.collectYear(2026));assert.equal(await store.read('years/2026.json'),undefined);
 stop=false;const full=await c.collectYear(2026);assert.equal(full.lunar.length,365);assert.equal(b.counts.get('solar-2026-0-0-1'),1);
 const count=[...b.counts.values()].reduce((a,b)=>a+b,0);await c.collectYear(2026);assert.equal([...b.counts.values()].reduce((a,b)=>a+b,0),count);
}));
test('date-only solar sample never becomes a complete year or a successful minute-ready sample',async()=>setup(async store=>{
 const b=backend(({result,service})=>{if(service==='solar'){const v=JSON.parse(result.body);const items=v.response.body.items.item;for(const r of Array.isArray(items)?items:[items])delete r.kst;result.body=JSON.stringify(v);}});const c=collector(store,b);
 const probe=await c.probe(2026,'solar');assert.equal(probe.status,'SAMPLE_DATE_ONLY');assert.equal(probe.minuteRows,0);
 await reject(()=>c.collectYear(2026),'SOLAR_MINUTES_INCOMPLETE');assert.equal(await store.read('years/2026.json'),undefined);
}));
test('daily fallback is explicit and retains complete day coverage',async()=>setup(async store=>{
 const b=backend(),c=collector(store,b,'xml','daily');const sample=await c.probe(1950,'lunar');assert.equal(sample.scope,'JANUARY_DAY1_ONLY');
 const full=await c.collectYear(1950);assert.equal(full.lunar.length,365);assert.equal(full.lunarMode,'daily');assert.equal(full.sources.length,368);
}));
test('raw, normalized, and receipt fingerprint mutation fails closed',async()=>{
 for(const kind of ['raw','normalized','receipt','missing'])await setup(async store=>{
   const c=collector(store);const data=await c.collectYear(2026);
   if(kind==='raw')await writeFile(join(store.root,'raw',data.sources[0].responseSha256+'.body'),'corrupt');
   if(kind==='normalized'){data.lunar[0].lunarDay++;await store.json('years/2026.json',data);}
   if(kind==='receipt'){const name='pages/solar-2026-0-0-xml-1.json';const page=await store.read(name);page.receipt.serviceId='15012679';await store.json(name,page);}
   if(kind==='missing')await rm(join(store.root,'pages/solar-2026-0-0-xml-2.json'));
   await reject(()=>c.validateYear(2026));
 });
});
test('atomic store uses private permissions, no leftover temp files, and serial process locks',async()=>setup(async store=>{
 const path=join(store.root,'value.json');await atomicWrite(path,'old');await atomicWrite(path,'new');assert.equal(await readFile(path,'utf8'),'new');
 assert.equal((await stat(path)).mode&0o777,0o600);assert.ok(!(await readdir(store.root)).some(s=>s.includes('.tmp-')));
 await store.lock(async()=>{await reject(()=>store.lock(async()=>{}),'COLLECTOR_BUSY');});
 await store.json('collector.lock',{pid:2147483647});await store.lock(async()=>{}); // stale crash lock recovered
}));
test('bulk guard requires both complete verified sample years',async()=>setup(async store=>{
 const c=collector(store);await reject(()=>c.sampleGate(),'INCOMPLETE_YEAR');await c.collectYear(1950);await reject(()=>c.sampleGate(),'INCOMPLETE_YEAR');await c.collectYear(2026);await c.sampleGate();
}));
test('API vs annual-TXT comparison reports discrepancies without correcting either surface',()=>{
 const s=solar(2026).map(r=>normalizeSolar(r,2026)),before=structuredClone(s);
 const ref={surface:'KASI_ANNUAL_TXT',solar:[{term:s[0].term,date:s[0].date,time:'01:21'}],lunar:[]};const r=compareReference(s,[],ref);
 assert.equal(r.status,'MISMATCH');assert.equal(r.differences.length,1);assert.deepEqual(s,before);assert.equal(ref.solar[0].time,'01:21');
 const dayOnly={...s[0],time:null,precision:'DAY'};assert.equal(compareReference([dayOnly],[],ref).status,'MISMATCH');
});
test('CLI arguments reject unknown options, unsupported years, duplicate years and conflicting requests',()=>{
 assert.deepEqual(selectedYears(parseArgs(['probe','--years','1950,2026']).options),[1950,2026]);
 for(const args of [['collect','--from','1950'],['collect','--service','solar'],['probe','--format','csv'],['probe','--years','1950','--years','2026'],['export','--service','both']])assert.throws(()=>parseArgs(args),CollectorError);
 for(const o of [{years:'1949'},{years:'2026,2026'},{from:'2027',to:'1950'}])assert.throws(()=>selectedYears(o),CollectorError);
});
test('CLI errors suppress unknown arguments and missing credentials; bulk collection cannot start by accident',()=>{
 const env={...process.env};delete env.KASI_API_KEY;delete env.KASI_SPCDE_API_KEY;delete env.KASI_LUNAR_API_KEY;
 for(const args of [['probe','--unknown',secret],['collect','--from','1950','--to','2027']]){
   const result=spawnSync(process.execPath,['.kasi-build/cli.js',...args],{env,encoding:'utf8'});assert.equal(result.status,1);assert.ok(!result.stdout.includes(secret)&&!result.stderr.includes(secret));
 }
});

test('CLI offline injected workflow probes, collects sample years, validates and exports a discrepancy report',async()=>setup(async store=>{
 const b=backend(),runtime={store,transport:b.transport,keys:{solar:secret,lunar:secret}},logs=[],original=console.log;
 console.log=value=>logs.push(value);
 try{
  assert.equal(await main(['probe','--years','1950,2026'],runtime),0);
  assert.equal(await main(['collect','--years','1950,2026'],runtime),0);
  const noNetwork={store,transport:async()=>{throw Error('unexpected request');},keys:{}};
  assert.equal(await main(['validate'],noNetwork),0);
  const ref=join(store.root,'annual-reference.json');await writeFile(ref,JSON.stringify({surface:'KASI_ANNUAL_TXT',solar:[{term:'소한',date:'2026-01-05',time:'01:21'}],lunar:[]}));
  assert.equal(await main(['export','--reference',ref],noNetwork),0);
  const output=await store.read('export.json');assert.equal(output.years.length,2);assert.equal(output.comparison.status,'MISMATCH');assert.equal(output.externalOriginalVerification,'UNVERIFIED');
  const requests=[...b.counts.values()].reduce((a,b)=>a+b,0);
  assert.equal(await main(['collect','--years','1950,2026'],runtime),0);assert.equal([...b.counts.values()].reduce((a,b)=>a+b,0),requests);
  assert.ok(!logs.join('').includes(secret));
 }finally{console.log=original;}
}));
test('CLI probe records per-service failures without leaking raw errors and never marks a partial year complete',async()=>setup(async store=>{
 const logs=[],original=console.log;console.log=value=>logs.push(value);
 try{
  const code=await main(['probe','--years','1950'],{store,transport:async()=>{throw Error(secret);},keys:{}});
  assert.equal(code,1);assert.ok(!logs.join('').includes(secret));
  assert.equal((await store.read('probes/solar-1950-failure.json')).code,'MISSING_KASI_SPCDE_API_KEY');
  assert.equal(await store.read('years/1950.json'),undefined);
 }finally{console.log=original;}
}));
test('failed atomic writes preserve the old file and remove temporary remnants',async()=>setup(async store=>{
 const path=join(store.root,'atomic.json');await atomicWrite(path,'old');
 await assert.rejects(()=>atomicWrite(path,undefined));assert.equal(await readFile(path,'utf8'),'old');
 assert.ok(!(await readdir(store.root)).some(s=>s.includes('.tmp-')));
}));

test('encoded JSON/XML credential echoes are rejected before any response is stored',async()=>{
 for(const body of [envelope([{echo:secret}]).replace('SYNTHETIC','\\u0053YNTHETIC'),xml([{echo:secret}]).replace('SYNTHETIC','&#83;YNTHETIC')]){
  await reject(()=>new Client(async()=>({status:200,body}),{solar:secret},options).request(q),'CREDENTIAL_ECHO');
 }
});

test('one ordinary KASI_API_KEY is used for both service requests',async()=>{
 const keys=resolveApiKeys({KASI_API_KEY:secret}),services=[];
 const client=new Client(async url=>{assert.equal(url.searchParams.get('ServiceKey'),secret);services.push(url.pathname);return {status:200,body:envelope(solar(1950))};},keys,options);
 await client.request({...q,year:1950});await client.request({...q,service:'lunar',year:1950,month:1});
 assert.equal(services.length,2);assert.ok(services[0].includes('SpcdeInfoService'));assert.ok(services[1].includes('LrsrCldInfoService'));
});

test('per-service overrides retain priority and the other service uses the common key',()=>{
 assert.deepEqual(resolveApiKeys({KASI_API_KEY:secret,KASI_SPCDE_API_KEY:'SYNTHETIC_SOLAR_OVERRIDE'}),{solar:'SYNTHETIC_SOLAR_OVERRIDE',lunar:secret});
 assert.deepEqual(resolveApiKeys({KASI_API_KEY:secret,KASI_LUNAR_API_KEY:'SYNTHETIC_LUNAR_OVERRIDE'}),{solar:secret,lunar:'SYNTHETIC_LUNAR_OVERRIDE'});
 assert.deepEqual(resolveApiKeys({KASI_SPCDE_API_KEY:secret,KASI_LUNAR_API_KEY:secret}),{solar:secret,lunar:secret});
});

test('blank common or per-service settings do not create credentials',()=>{
 assert.deepEqual(resolveApiKeys({KASI_API_KEY:'  ',KASI_SPCDE_API_KEY:'',KASI_LUNAR_API_KEY:'\n'}),{});
 assert.deepEqual(resolveApiKeys({KASI_API_KEY:' '+secret+' ',KASI_SPCDE_API_KEY:'  '}),{solar:secret,lunar:secret});
});

test('a rejected override never silently falls back to a common key or exposes either value',async()=>{
 const override='SYNTHETIC_REJECTED_OVERRIDE';let calls=0;
 const client=new Client(async url=>{calls++;assert.equal(url.searchParams.get('ServiceKey'),override);return {status:403,body:secret+' '+override};},resolveApiKeys({KASI_API_KEY:secret,KASI_SPCDE_API_KEY:override}),{...options,retries:2});
 await assert.rejects(client.request(q),e=>{assert.ok(!String(e).includes(secret)&&!String(e).includes(override));return e.code==='HTTP_ERROR';});assert.equal(calls,1);
});
