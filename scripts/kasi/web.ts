/** Loopback-only, single-query KASI viewer. Request key/raw data never go to disk. */
import { createServer, type ServerResponse } from 'node:http';
import { randomBytes } from 'node:crypto';
import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { resolve } from 'node:path';
import { spawn } from 'node:child_process';
import { Client, Collector, EphemeralStore, makeTransport, type Transport } from './collector.js';
import { CollectorError, fail, object, year, type Service, type Format } from './schema.js';

export function makeKasiWebServer(options:{transport?:Transport;timeoutMs?:number}={}) {
  const session=randomBytes(24).toString('base64');let busy=false,nextUpstreamAt=0;
  function respond(res:ServerResponse,status:number,value:unknown):void {
    if(!res.destroyed)res.writeHead(status,{'Content-Type':'application/json; charset=utf-8'}).end(JSON.stringify(value));
  }
  const server=createServer(async(req,res)=>{
    res.setHeader('Cache-Control','no-store');res.setHeader('X-Content-Type-Options','nosniff');
    res.setHeader('Referrer-Policy','no-referrer');res.setHeader('X-Frame-Options','DENY');
    res.setHeader('Content-Security-Policy',`default-src 'none'; script-src 'nonce-${session}'; style-src 'nonce-${session}'; connect-src 'self'; form-action 'none'; frame-ancestors 'none'; base-uri 'none'`);
    const address=server.address();if(!address||typeof address==='string'){respond(res,503,{code:'NOT_READY'});return;}
    const host='127.0.0.1:'+address.port,origin='http://'+host;
    if(req.headers.host!==host){respond(res,403,{code:'LOCAL_HOST_REQUIRED'});return;}
    if(req.method==='GET'&&req.url==='/'){
      try{const page=await readFile(new URL('../scripts/kasi/page.html',import.meta.url),'utf8');
        res.writeHead(200,{'Content-Type':'text/html; charset=utf-8'}).end(page.replaceAll('__NONCE__',session));}
      catch{respond(res,500,{code:'PAGE_UNAVAILABLE'});}return;
    }
    if(req.method!=='POST'||req.url!=='/api/query'){respond(res,404,{code:'NOT_FOUND'});return;}
    if(req.headers.origin!==origin||req.headers['x-kasi-session']!==session){respond(res,403,{code:'LOCAL_PAGE_REQUIRED'});return;}
    if(!/^application\/json(?:;|$)/i.test(req.headers['content-type']??'')){respond(res,415,{code:'JSON_REQUIRED'});return;}
    if(busy){respond(res,429,{code:'QUERY_IN_PROGRESS'});return;}
    busy=true;
    let key='',timer:ReturnType<typeof setTimeout>|undefined;
    const abort=new AbortController();let wire:{transport:Transport;close:()=>Promise<void>}|undefined;
    res.on('close',()=>{if(!res.writableEnded)abort.abort();});
    try{
      const chunks:Buffer[]=[];let bytes=0;
      for await(const chunk of req){bytes+=chunk.length;if(bytes>8192)fail('REQUEST_TOO_LARGE');chunks.push(Buffer.from(chunk));}
      let parsed:unknown;try{parsed=JSON.parse(Buffer.concat(chunks).toString('utf8'));}catch{fail('INVALID_REQUEST');}
      const data=object(parsed);if(Object.keys(data).sort().join(',')!=='format,key,service,year'||typeof data.key!=='string'||data.key.length>1024||!data.key.trim()||typeof data.year!=='number'||!['solar','lunar'].includes(String(data.service))||!['xml','json'].includes(String(data.format)))fail('INVALID_REQUEST');
      year(data.year);key=data.key.trim();delete data.key;
      // Only this POST supplies keys. Environment credentials and disk caches are not used.
      wire=options.transport?{transport:options.transport,close:async()=>{}}:makeTransport();
      const guarded:Transport=async(url,signal)=>{
        if(abort.signal.aborted)fail('WEB_QUERY_CANCELLED');
        // Preserve the rate limit across separate requests without retaining keys.
        await new Promise(resolve=>setTimeout(resolve,Math.max(0,nextUpstreamAt-Date.now())));
        if(abort.signal.aborted)fail('WEB_QUERY_CANCELLED');nextUpstreamAt=Date.now()+(options.transport?0:350);
        try{return await wire!.transport(url,AbortSignal.any([signal,abort.signal]));}
        catch(error){if(abort.signal.aborted)fail('WEB_QUERY_CANCELLED');throw error;}
      };
      const client=new Client(guarded,{solar:key,lunar:key},options.transport?{timeoutMs:1000,retries:0,intervalMs:0}:undefined);
      const pending=new Collector(new EphemeralStore(),client,data.format as Format).probe(data.year,data.service as Service,true);
      const deadline=new Promise<never>((_,reject)=>{timer=setTimeout(()=>{abort.abort();reject(new CollectorError('WEB_QUERY_TIMEOUT'));},options.timeoutMs??60_000);});
      const result=await Promise.race([pending,deadline]);respond(res,200,result);
    }catch(error){
      const code=error instanceof CollectorError?error.code:'QUERY_FAILED';
      respond(res,['INVALID_REQUEST','REQUEST_TOO_LARGE','SCHEMA_OBJECT','YEAR_RANGE_1950_2027'].includes(code)?422:502,{status:'FAILED',code});
    }finally{key='';if(timer)clearTimeout(timer);abort.abort();await wire?.close().catch(()=>{});busy=false;}
  });
  server.requestTimeout=10_000;server.headersTimeout=5000;server.keepAliveTimeout=1000;
  return server;
}
if(process.argv[1]&&resolve(process.argv[1])===fileURLToPath(import.meta.url)){
  if(Number(process.versions.node.split('.')[0])!==22){console.error('Node.js 22가 필요합니다.');process.exitCode=1;}
  else {
    const server=makeKasiWebServer();server.on('error',()=>{console.error('KASI 로컬 페이지를 시작하지 못했습니다.');process.exitCode=1;});
    server.listen(0,'127.0.0.1',()=>{
      const address=server.address();if(!address||typeof address==='string')return;
      const url='http://127.0.0.1:'+address.port+'/';console.log('KASI JSON 조회 페이지: '+url);
      if(process.platform==='win32'&&!process.argv.includes('--no-open'))spawn('cmd.exe',['/c','start','',url],{stdio:'ignore'}).on('error',()=>{});
    });
  }
}
