import test from 'node:test';
import assert from 'node:assert/strict';
import {request as httpRequest} from 'node:http';
import {spawn} from 'node:child_process';
import {makeKasiWebServer} from '../.kasi-build/web.js';
import {WEB_TEST_KEY,webTestTransport} from './fixtures/kasi-web-synthetic.mjs';
async function run(fn,options={}){
 const server=makeKasiWebServer({transport:webTestTransport(),...options});
 await new Promise(r=>server.listen(0,'127.0.0.1',r));const origin='http://127.0.0.1:'+server.address().port;
 try{const response=await fetch(origin+'/'),html=await response.text(),token=html.match(/'X-Kasi-Session':'([^']+)'/)[1];
 const post=(data,headers={})=>fetch(origin+'/api/query',{method:'POST',headers:{'Content-Type':'application/json',Origin:origin,'X-Kasi-Session':token,...headers},body:JSON.stringify(data)});
 await fn({server,origin,html,response,token,post});}
 finally{server.closeAllConnections();await new Promise(r=>server.close(r));}
}
const data={key:WEB_TEST_KEY,year:2026,service:'solar',format:'xml'};
test('web page has password-only input, strict CSP, no-store and no external dependencies',async()=>run(async({html,response})=>{
 assert.equal(response.status,200);assert.equal(response.headers.get('cache-control'),'no-store');
 assert.match(response.headers.get('content-security-policy'),/default-src 'none'/);assert.match(response.headers.get('content-security-policy'),/frame-ancestors 'none'/);
 assert.match(html,/type="password"/);assert.ok(!html.includes(WEB_TEST_KEY));assert.ok(!/localStorage|sessionStorage|document\.cookie|src="http/.test(html));
 assert.ok(!html.includes('name="key"'));
}));
test('one typed key queries solar and lunar JSON without disk cache or environment credentials',async()=>run(async({post})=>{
 for(const service of ['solar','lunar']){
  const r=await post({...data,service}),text=await r.text();assert.equal(r.status,200);assert.ok(!text.includes(WEB_TEST_KEY));
  const result=JSON.parse(text);assert.equal(result.data.length,service==='solar'?24:31);assert.equal(result.yearComplete,false);assert.equal(result.externalOriginalVerification,'UNVERIFIED');
 }
}));
test('cross-site requests and missing session token cannot use the localhost service',async()=>run(async({post,origin})=>{
 for(const headers of [{Origin:'https://external.invalid'},{'X-Kasi-Session':'wrong'}])assert.equal((await post(data,headers)).status,403);
 const foreignStatus=await new Promise((resolve,reject)=>{const r=httpRequest(origin+'/',{headers:{Host:'external.invalid'}},response=>{response.resume();resolve(response.statusCode);});r.on('error',reject);r.end();});assert.equal(foreignStatus,403);
 assert.equal((await post(data,{'Content-Type':'text/plain'})).status,415);
}));
test('invalid input, unsupported service/year, URL injection and oversized bodies fail closed',async()=>run(async({post})=>{
 for(const body of [{...data,key:''},{...data,year:1949},{...data,service:'evil'},{...data,url:'https://evil.invalid'},{...data,key:'x'.repeat(9000)}]){
  const r=await post(body);assert.equal(r.status,422);assert.ok(!(await r.text()).includes(WEB_TEST_KEY));
 }
}));
test('provider errors never return the typed credential or upstream URL',async()=>run(async({post})=>{
 const r=await post(data),text=await r.text();assert.equal(r.status,502);assert.ok(!text.includes(WEB_TEST_KEY)&&!text.includes('https://'));
},{transport:async()=>{throw Error('https://upstream.invalid?ServiceKey='+WEB_TEST_KEY);}}));
test('web query deadline is bounded and concurrent queries are rejected',async()=>{
 let started;const ready=new Promise(resolve=>{started=resolve;});
 await run(async({post})=>{
  const first=post(data);await ready;assert.equal((await post(data)).status,429);
  const r=await first;assert.equal(r.status,502);assert.equal((await r.json()).code,'WEB_QUERY_TIMEOUT');
 },{timeoutMs:500,transport:async(_url,signal)=>{started();return new Promise((_,reject)=>{signal.addEventListener('abort',()=>reject(Error('cancelled')),{once:true});});}});
});

test('built production entry starts on loopback and serves the key form without API access',async()=>{
 const child=spawn(process.execPath,['.kasi-build/web.js','--no-open'],{stdio:['ignore','pipe','ignore']});
 try{
  const origin=await new Promise((resolve,reject)=>{let text='';const timer=setTimeout(()=>reject(Error('startup timeout')),8000);
   child.stdout.on('data',chunk=>{text+=chunk.toString();const m=text.match(/http:\/\/127\.0\.0\.1:\d+\//);if(m){clearTimeout(timer);resolve(m[0]);}});
   child.once('exit',()=>{clearTimeout(timer);reject(Error('server exited'));});
  });
  const response=await fetch(origin);assert.equal(response.status,200);assert.match(await response.text(),/일반 인증키/);
 }finally{if(child.exitCode===null){const done=new Promise(r=>child.once('exit',r));child.kill('SIGTERM');await done;}}
});
