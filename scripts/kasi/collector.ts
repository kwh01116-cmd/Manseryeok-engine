import { readFile, mkdir, open, rename, unlink, lstat } from 'node:fs/promises';
import { join, dirname } from 'node:path';
import { randomUUID } from 'node:crypto';
import { fetch as wireFetch, EnvHttpProxyAgent } from 'undici';
import { CollectorError, SERVICES, fail, sha, fingerprint, parsePage, normalizeSolar, normalizeLunar, validateSolar, validateLunar, daysInMonth, year, object, type Service, type Format, type Page, type SolarRow, type LunarRow } from './schema.js';
export interface Query {service:Service;year:number;month?:number;day?:number;page:number;format:Format;}
export interface Receipt {evidenceSurface:'KASI_OPENAPI_RESPONSE';responseHashScope:'UTF8_ENTITY_AFTER_HTTP_DECOMPRESSION';query:Query;requestedAt:string;serviceId:string;operation:string;responseSha256:string;schema:Page['schema'];}
export interface StoredPage {schemaVersion:'kasi-page-v1';receipt:Receipt;}
export type Transport = (url:URL,signal:AbortSignal)=>Promise<{status:number;body:string}>;
const delay=(ms:number)=>new Promise<void>(resolve=>setTimeout(resolve,ms));
export function credentialVariants(key:string):string[] {
  let decoded=key;try{decoded=decodeURIComponent(key);}catch{fail('KEY_ENCODING');}
  return [...new Set([key,decoded,encodeURIComponent(key),encodeURIComponent(decoded)])].filter(Boolean);
}
export function hasCredential(body:string,keys:string[]):boolean {
  const decoded=body.replace(/\\u([0-9a-f]{4})/gi,(_,n:string)=>String.fromCharCode(parseInt(n,16))).replace(/\\\//g,'/').replace(/&#(x[0-9a-f]+|[0-9]+);/gi,(_,n:string)=>{const code=n[0]!.toLowerCase()==='x'?parseInt(n.slice(1),16):Number(n);return code<=0x10ffff?String.fromCodePoint(code):'';});
  return keys.some(k=>credentialVariants(k).some(v=>[body,decoded].some(s=>s.toLowerCase().includes(v.toLowerCase()))));
}
export function makeTransport():{transport:Transport;close:()=>Promise<void>} {
  const agent=new EnvHttpProxyAgent();
  return {transport:async(url,signal)=>{
    const response=await wireFetch(url,{dispatcher:agent,signal,redirect:'error'});
    if(response.status!==200){await response.body?.cancel();return {status:response.status,body:''};}
    let bytes=0;const chunks:Buffer[]=[];
    if(!response.body)fail('EMPTY_RESPONSE');
    for await(const chunk of response.body){bytes+=chunk.length;if(bytes>2_000_000){await response.body.cancel().catch(()=>{});fail('RESPONSE_TOO_LARGE');}chunks.push(Buffer.from(chunk));}
    return {status:response.status,body:new TextDecoder('utf-8',{fatal:true}).decode(Buffer.concat(chunks))};
  },close:()=>agent.close()};
}
export class Client {
  private next=0;
  private tail:Promise<unknown>=Promise.resolve();
  constructor(private transport:Transport,private keys:Partial<Record<Service,string>>,private options={timeoutMs:10_000,retries:2,intervalMs:350}){
    if(options.timeoutMs<1||options.retries<0||options.retries>2||options.intervalMs<0)fail('CLIENT_OPTIONS');
  }
  request(query:Query):Promise<{body:string;receipt:Receipt}> {
    const task=this.tail.then(()=>this.perform(query));this.tail=task.catch(()=>{});return task;
  }
  private async perform(query:Query):Promise<{body:string;receipt:Receipt}> {
    year(query.year);if(!SERVICES[query.service]||!['xml','json'].includes(query.format)||!Number.isInteger(query.page)||query.page<1||query.page>100)fail('QUERY');
    if(query.service==='lunar'&&(!Number.isInteger(query.month)||query.month!<1||query.month!>12))fail('QUERY_MONTH');
    if(query.day!==undefined&&(!query.month||!Number.isInteger(query.day)||query.day<1||query.day>daysInMonth(query.year,query.month)))fail('QUERY_DAY');
    const spec=SERVICES[query.service],key=this.keys[query.service]?.trim();if(!key)fail('MISSING_'+spec.key);
    let decoded=key;try{decoded=decodeURIComponent(key);}catch{fail('KEY_ENCODING');}
    const url=new URL(`https://apis.data.go.kr/B090041/openapi/service/${spec.path}/${spec.operation}`);
    url.searchParams.set('ServiceKey',decoded);url.searchParams.set('solYear',String(query.year));
    if(query.month!==undefined)url.searchParams.set('solMonth',String(query.month).padStart(2,'0'));
    if(query.day!==undefined)url.searchParams.set('solDay',String(query.day).padStart(2,'0'));
    url.searchParams.set('pageNo',String(query.page));url.searchParams.set('numOfRows','100');if(query.format==='json')url.searchParams.set('_type','json');
    for(let attempt=0;attempt<=this.options.retries;attempt++){
      await delay(Math.max(0,this.next-Date.now()));this.next=Date.now()+this.options.intervalMs;
      const requestedAt=new Date().toISOString(),controller=new AbortController();
      let timer:ReturnType<typeof setTimeout>|undefined;
      try{
        const timeout=new Promise<never>((_,reject)=>{timer=setTimeout(()=>{controller.abort();reject(new CollectorError('REQUEST_TIMEOUT'));},this.options.timeoutMs);});
        const result=await Promise.race([this.transport(url,controller.signal),timeout]);
        if(result.status!==200){
          if([408,429,500,502,503,504].includes(result.status)&&attempt<this.options.retries){await delay(500*2**attempt);continue;}
          fail('HTTP_ERROR');
        }
        if(hasCredential(result.body,Object.values(this.keys).filter((x):x is string=>!!x)))fail('CREDENTIAL_ECHO');
        const page=parsePage(result.body);
        return {body:result.body,receipt:{evidenceSurface:'KASI_OPENAPI_RESPONSE',responseHashScope:'UTF8_ENTITY_AFTER_HTTP_DECOMPRESSION',query:{...query},requestedAt,serviceId:spec.id,operation:spec.operation,responseSha256:sha(result.body),schema:page.schema}};
      }catch(error){
        if(error instanceof CollectorError&&!['REQUEST_TIMEOUT'].includes(error.code))throw error;
        if(attempt===this.options.retries)fail(controller.signal.aborted?'REQUEST_TIMEOUT':'NETWORK_ERROR');
        await delay(500*2**attempt);
      }finally{if(timer)clearTimeout(timer);}
    }
    return fail('RETRY_LIMIT');
  }
}
const pageId=(q:Query)=>`${q.service}-${q.year}-${q.month??0}-${q.day??0}-${q.format}-${q.page}`;
export async function atomicWrite(path:string,text:string):Promise<void> {
  const tmp=path+'.tmp-'+randomUUID();let handle;
  try{handle=await open(tmp,'wx',0o600);await handle.writeFile(text);await handle.sync();await handle.close();handle=undefined;await rename(tmp,path);const directory=await open(dirname(path),'r');try{await directory.sync();}finally{await directory.close();}}
  finally{await handle?.close();await unlink(tmp).catch(()=>{});}
}
export class Store {
  constructor(readonly root:string){}
  async init():Promise<void>{for(const dir of ['', 'raw','pages','years','probes']){const path=join(this.root,dir);await mkdir(path,{recursive:true,mode:0o700});if(!(await lstat(path)).isDirectory()||(await lstat(path)).isSymbolicLink())fail('UNSAFE_STORE');}}
  async json(name:string,value:unknown):Promise<void>{await atomicWrite(join(this.root,name),JSON.stringify(value,null,2)+'\n');}
  async read(name:string):Promise<unknown|undefined>{try{return JSON.parse(await readFile(join(this.root,name),'utf8'));}catch(e){if((e as NodeJS.ErrnoException).code==='ENOENT')return undefined;return fail('STORE_READ_OR_JSON');}}
  async save(body:string,receipt:Receipt):Promise<void>{
    await atomicWrite(join(this.root,'raw',receipt.responseSha256+'.body'),body);
    await this.json('pages/'+pageId(receipt.query)+'.json',{schemaVersion:'kasi-page-v1',receipt});
  }
  async load(query:Query):Promise<{body:string;receipt:Receipt}|undefined>{
    const value=await this.read('pages/'+pageId(query)+'.json');if(value===undefined)return;
    const record=object(value);if(record.schemaVersion!=='kasi-page-v1')fail('CACHE_SCHEMA');
    const r=object(record.receipt),spec=SERVICES[query.service];
    if(r.evidenceSurface!=='KASI_OPENAPI_RESPONSE'||r.responseHashScope!=='UTF8_ENTITY_AFTER_HTTP_DECOMPRESSION'||fingerprint(r.query)!==fingerprint(query)||r.serviceId!==spec.id||r.operation!==spec.operation||typeof r.responseSha256!=='string'||!/^[a-f0-9]{64}$/.test(r.responseSha256)||typeof r.requestedAt!=='string'||!Number.isFinite(Date.parse(r.requestedAt)))fail('CACHE_RECEIPT');
    let body:string;try{body=await readFile(join(this.root,'raw',r.responseSha256+'.body'),'utf8');}catch{return fail('CACHE_RAW_MISSING');}
    if(sha(body)!==r.responseSha256)fail('CACHE_DIGEST_CHANGED');
    if(fingerprint(parsePage(body).schema)!==fingerprint(r.schema))fail('CACHE_SCHEMA_CHANGED');
    return {body,receipt:r as unknown as Receipt};
  }
  async lock<T>(action:()=>Promise<T>):Promise<T>{
    await this.init();const path=join(this.root,'collector.lock');let handle;
    for(let i=0;i<2;i++){
      try{handle=await open(path,'wx',0o600);break;}catch(e){
        if((e as NodeJS.ErrnoException).code!=='EEXIST')fail('STORE_LOCK');
        const old=await this.read('collector.lock'),pid=Number(object(old).pid);if(!Number.isInteger(pid)||pid<1)fail('STORE_LOCK');
        try{process.kill(pid,0);fail('COLLECTOR_BUSY');}catch(err){if((err as NodeJS.ErrnoException).code!=='ESRCH')throw err;}
        await unlink(path);
      }
    }
    if(!handle)fail('STORE_LOCK');
    try{await handle.writeFile(JSON.stringify({pid:process.pid}));return await action();}finally{await handle.close();await unlink(path).catch(()=>{});}
  }
}
export interface YearData {schemaVersion:'kasi-collector-year-v1';year:number;status:'COMPLETE';normalizerVersion:'0.1.0';lunarMode:'monthly'|'daily';requestedFormat:Format;solar:SolarRow[];lunar:LunarRow[];normalizedSha256:string;sources:Receipt[];externalOriginalVerification:'UNVERIFIED';rightsReview:'UNVERIFIED';}
export class Collector {
  constructor(readonly store:Store,private client:Client,readonly format:Format='xml',readonly lunarMode:'monthly'|'daily'='monthly'){}
  private async query(service:Service,y:number,month?:number,day?:number,offline=false):Promise<{items:Record<string,unknown>[];sources:Receipt[]}>{
    const items:Record<string,unknown>[]=[],sources:Receipt[]=[];let total:number|undefined,size:number|undefined;
    for(let n=1;n<=100;n++){
      const q:Query={service,year:y,page:n,format:this.format,...(month===undefined?{}:{month}),...(day===undefined?{}:{day})};
      let data=await this.store.load(q);if(!data){if(offline)fail('CACHE_PAGE_MISSING');data=await this.client.request(q);await this.store.save(data.body,data.receipt);}
      const p=parsePage(data.body);
      if(p.page!==n||p.total===0||p.total>(service==='solar'?24:day===undefined?daysInMonth(y,month!):1)||total!==undefined&&total!==p.total||size!==undefined&&size!==p.size)fail('PAGINATION_MISMATCH');
      total=p.total;size=p.size;
      if(p.items.length!==Math.min(size,total-items.length)||p.items.length===0)fail('PAGE_MISSING_OR_SHORT');
      items.push(...p.items);sources.push(data.receipt);
      if(items.length===total)return {items,sources};
    }
    return fail('PAGINATION_LIMIT');
  }
  async probe(y:number,service:Service):Promise<unknown>{
    year(y);const sampleDay=service==='lunar'&&this.lunarMode==='daily'?1:undefined;const response=await this.query(service,y,service==='lunar'?1:undefined,sampleDay);
    const rows=service==='solar'?response.items.map(i=>normalizeSolar(i,y)):response.items.map(i=>normalizeLunar(i,y,1,sampleDay));
    if(service==='solar')validateSolar(rows as SolarRow[],y);else validateLunar(rows as LunarRow[],y,1,sampleDay);
    const report={schemaVersion:'kasi-probe-v1',year:y,service,status:service==='solar'&&(rows as SolarRow[]).some(r=>r.time===null)?'SAMPLE_DATE_ONLY':'SAMPLE_RESPONSE_VALIDATED',scope:service==='solar'?'24_TERMS':sampleDay?'JANUARY_DAY1_ONLY':'JANUARY_ONLY',requestedFormat:this.format,actualFormats:[...new Set(response.sources.map(s=>s.schema.format))],yearComplete:false,normalizedSha256:fingerprint(rows),sources:response.sources,externalOriginalVerification:'UNVERIFIED',rightsReview:'UNVERIFIED',minuteRows:service==='solar'?(rows as SolarRow[]).filter(r=>r.time!==null).length:null};
    await this.store.json(`probes/${service}-${y}.json`,report);return report;
  }
  async buildYear(y:number,offline=false):Promise<YearData>{
    year(y);const s=await this.query('solar',y,undefined,undefined,offline),solar=s.items.map(i=>normalizeSolar(i,y));validateSolar(solar,y);if(solar.some(r=>r.time===null))fail('SOLAR_MINUTES_INCOMPLETE');
    const lunar:LunarRow[]=[],sources=[...s.sources];
    for(let m=1;m<=12;m++){
      const days=this.lunarMode==='daily'?Array.from({length:daysInMonth(y,m)},(_,i)=>i+1):[undefined];
      for(const d of days){const r=await this.query('lunar',y,m,d,offline),rows=r.items.map(i=>normalizeLunar(i,y,m,d));validateLunar(rows,y,m,d);lunar.push(...rows);sources.push(...r.sources);}
    }
    validateLunar(lunar,y);solar.sort((a,b)=>a.date.localeCompare(b.date));lunar.sort((a,b)=>a.solarDate.localeCompare(b.solarDate));
    return {schemaVersion:'kasi-collector-year-v1',year:y,status:'COMPLETE',normalizerVersion:'0.1.0',lunarMode:this.lunarMode,requestedFormat:this.format,solar,lunar,normalizedSha256:fingerprint({solar,lunar}),sources,externalOriginalVerification:'UNVERIFIED',rightsReview:'UNVERIFIED'};
  }
  async collectYear(y:number):Promise<YearData>{
    if(await this.store.read(`years/${y}.json`)!==undefined)return this.validateYear(y);
    const result=await this.buildYear(y);await this.store.json(`years/${y}.json`,result);return result;
  }
  async validateYear(y:number):Promise<YearData>{
    const saved=await this.store.read(`years/${y}.json`);if(saved===undefined)fail('INCOMPLETE_YEAR');
    const rebuilt=await this.buildYear(y,true);
    if(fingerprint(saved)!==fingerprint(rebuilt))fail('YEAR_DATA_OR_FINGERPRINT_CHANGED');return rebuilt;
  }
  async sampleGate():Promise<void>{for(const y of [1950,2026])await this.validateYear(y);}
}
