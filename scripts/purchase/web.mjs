/** Explicit loopback TEST application; intentionally not an operational payment server. */
import {createServer} from 'node:http';
import {readFile} from 'node:fs/promises';
import {resolve,join} from 'node:path';
import {pathToFileURL} from 'node:url';
import {timingSafeEqual} from 'node:crypto';
import {createPurchaseVault,loadOrCreatePurchaseKeys} from './vault.mjs';
import {createGuestSessions} from './sessions.mjs';
import {createFakePaymentProvider} from './fake-payment.mjs';
import {createExclusivePurchaseReportStore} from '../product/report-store.mjs';
import {validateInterpretedReport,interpretedReportVersions} from '../../dist/report/narrativePipelineV1.js';
import {canonicalInterpretation} from '../../dist/report/interpretationPolicyV1.js';
import {LIVE_SALE_GATES,assertLiveSaleAllowed,validateTestOrder} from '../../dist/purchase/orderStateV1.js';
import {createPurchaseService,loadPurchaseEnginePorts,exact,PurchaseError} from './service.mjs';

const COOKIE='saju_s8_guest';
const HEADERS={'Cache-Control':'no-store','X-Content-Type-Options':'nosniff','Referrer-Policy':'no-referrer','X-Frame-Options':'DENY',
 'Content-Security-Policy':"default-src 'none'; script-src 'self'; style-src 'self'; img-src 'self' data:; connect-src 'self'; base-uri 'none'; form-action 'self'; frame-ancestors 'none'",'Permissions-Policy':'camera=(), microphone=(), geolocation=()'};
const safeEqual=(a,b)=>typeof a==='string'&&typeof b==='string'&&Buffer.byteLength(a)===Buffer.byteLength(b)&&timingSafeEqual(Buffer.from(a),Buffer.from(b));
function cookie(req){const items=(req.headers.cookie??'').split(';').map(x=>x.trim()).filter(x=>x.startsWith(COOKIE+'='));if(items.length>1)throw new PurchaseError('SESSION_REQUIRED',401);return items[0]?.slice(COOKIE.length+1)??null;}
function respond(res,code,value,headers={}){res.writeHead(code,{...HEADERS,'Content-Type':'application/json; charset=utf-8',...headers});res.end(JSON.stringify(value));}
async function body(req){if(req.headers['content-type']?.split(';',1)[0].trim().toLowerCase()!=='application/json')throw new PurchaseError('JSON_REQUIRED',422);const parts=[];let size=0;for await(const part of req){size+=part.length;if(size>32768)throw new PurchaseError('REQUEST_TOO_LARGE',413);parts.push(part);}try{return JSON.parse(Buffer.concat(parts).toString('utf8'));}catch{throw new PurchaseError('INVALID_JSON',422);}}
const messages={SESSION_REQUIRED:'세션이 없거나 만료됐습니다. 새로 시작해 주세요.',ORDER_NOT_FOUND:'이 세션에서 확인할 수 없는 주문입니다.',REPORT_ACCESS_UNAVAILABLE:'지금은 결과를 열람할 수 없습니다. 생성·취소·환불 상태를 확인해 주세요.',LIVE_SALE_NOT_APPROVED:'현재 리포트는 판매하지 않습니다. 실제 주문·결제는 차단되어 있습니다.',INPUT_CONFIRMATION_REQUIRED:'입력과 계산 정책을 먼저 확인해 주세요.',ELIGIBILITY_BLOCKED:'이 입력에서는 테스트 리포트 제공을 진행할 수 없습니다.',FAKE_SIGNATURE_INVALID:'변조된 테스트 결제 이벤트를 거절했습니다.',REPORT_EXPIRED:'로컬 결과 보관 기간이 지났습니다.'};
export async function createPurchaseWeb({stateDirectory,ports,mode,now=()=>new Date(),faults,autoRun=true,sessionTtlMs,storeWrapper=x=>x}){
 if(mode!=='LOCAL_TEST_ONLY'||process.env.NODE_ENV==='production')throw new Error('LOCAL_TEST_MODE_REQUIRED');
 const keys=await loadOrCreatePurchaseKeys(join(resolve(stateDirectory),'keys'));let vault,service,reportStore,sessions;
 const provider=createFakePaymentProvider({signingKey:keys.providerKey,now});
 try{
  vault=await createPurchaseVault({directory:join(resolve(stateDirectory),'vault'),encryptionKey:keys.encryptionKey,initialState:{sessions:{},drafts:{},orders:{},events:{}},now,
   validateState(s){if(!s||Object.keys(s).sort().join(',')!=='drafts,events,orders,sessions')return false;for(const o of Object.values(s.orders))validateTestOrder(o);return true;}});
  sessions=createGuestSessions({vault,indexKey:keys.indexKey,now,...(sessionTtlMs?{ttlMs:sessionTtlMs}:{})});
  reportStore=storeWrapper(await createExclusivePurchaseReportStore({directory:join(resolve(stateDirectory),'reports'),encryptionKey:keys.reportEncryptionKey,indexKey:keys.reportIndexKey,now,
   ...(faults?{afterTemporarySync:()=>faults('REPORT_TEMP_SYNCED')}:{}),
   validateReport(r,v){validateInterpretedReport(r);if(canonicalInterpretation(v)!==canonicalInterpretation(interpretedReportVersions(r)))throw new Error('REPORT_VERSIONS');return true;}}));
  service=await createPurchaseService({vault,reportStore,provider,...ports,now,autoRun,...(faults?{faults}:{})});
  let origin=null,inflight=0;
  const server=createServer(async(req,res)=>{
   let counted=false;try{
    const expected=origin&&new URL(origin).host;
    if(req.headers.host!==expected||!['127.0.0.1','::ffff:127.0.0.1'].includes(req.socket.remoteAddress)||req.headers.origin&&req.headers.origin!==origin||req.headers['sec-fetch-site']==='cross-site')throw new PurchaseError('LOCAL_ORIGIN_REQUIRED',403);
    ++inflight;counted=true;if(inflight>16)throw new PurchaseError('SERVER_BUSY',429);
    if(req.url.includes('?')||req.url.includes('#'))throw new PurchaseError('QUERY_NOT_ALLOWED',422);
    const path=req.url,method=req.method;
    if(method==='GET'&&['/','/index.html','/app.js','/styles.css'].includes(path)){
     const asset=path==='/'||path==='/index.html'?'index.html':path.slice(1),data=await readFile(new URL('../../web/purchase/'+asset,import.meta.url));res.writeHead(200,{...HEADERS,'Content-Type':asset.endsWith('.html')?'text/html; charset=utf-8':asset.endsWith('.css')?'text/css; charset=utf-8':'text/javascript; charset=utf-8'});res.end(data);return;
    }
    // Even a guessed request, forged environment flag or payment success URL cannot open live sales.
    if(path.startsWith('/api/live/'))assertLiveSaleAllowed();
    if(method==='POST'&&path==='/api/provider/events'){const value=await body(req);respond(res,200,await service.receive(value));return;}
    const token=cookie(req),session=token?await sessions.authenticate(token):null;
    if(method==='GET'&&path==='/api/session'){
     if(token&&!session){respond(res,401,{status:'REJECTED',error:{code:'SESSION_REQUIRED',message:messages.SESSION_REQUIRED}},{'Set-Cookie':COOKIE+'=; HttpOnly; SameSite=Strict; Path=/; Max-Age=0'});return;}
     const issued=session??await sessions.issue();respond(res,200,{csrfToken:issued.csrfToken,expiresAt:issued.expiresAt,mode:'LOCAL_TEST_ONLY',gates:LIVE_SALE_GATES,saleStatus:'NOT_FOR_SALE_YET'},session?{}:{'Set-Cookie':COOKIE+'='+issued.token+'; HttpOnly; SameSite=Strict; Path=/; Max-Age='+Math.max(1,Math.floor((Date.parse(issued.expiresAt)-now().getTime())/1000))});return;
    }
    if(!session)throw new PurchaseError('SESSION_REQUIRED',401);
    let value;if(method!=='GET'){
     if(req.headers.origin!==origin||!safeEqual(req.headers['x-csrf-token'],session.csrfToken))throw new PurchaseError('CSRF_REQUIRED',403);
     value=await body(req);
    }
    if(method==='POST'&&path==='/api/reviews'){exact(value,['request']);respond(res,200,await service.review(session.actorId,value.request));return;}
    const review=path.match(/^\/api\/reviews\/([a-zA-Z0-9-]+)\/confirm$/);
    if(method==='POST'&&review){exact(value,[]);respond(res,200,await service.confirm(session.actorId,review[1]));return;}
    if(path==='/api/orders'){
     if(method==='GET'){respond(res,200,await service.list(session.actorId));return;}
     if(method==='POST'){respond(res,200,await service.createOrder(session.actorId,value));return;}
    }
    const order=path.match(/^\/api\/orders\/([a-zA-Z0-9-]+)(?:\/(checkout|simulate|cancel|retry|refund|refund-review|report))?$/);
    if(order){const id=order[1],action=order[2];
     if(method==='GET'&&!action){respond(res,200,await service.get(session.actorId,id));return;}
     if(method==='GET'&&action==='report'){respond(res,200,await service.report(session.actorId,id));return;}
     if(method==='DELETE'&&action==='report'){exact(value,[]);respond(res,200,await service.deleteReport(session.actorId,id));return;}
     if(method==='POST'&&action==='simulate'){exact(value,['action']);respond(res,200,await service.simulate(session.actorId,id,value.action));return;}
     if(method==='POST'&&['checkout','cancel','retry','refund','refund-review'].includes(action)){exact(value,[]);respond(res,200,await service.command(session.actorId,id,{checkout:'CHECKOUT',cancel:'CANCEL',retry:'RETRY',refund:'REQUEST_REFUND','refund-review':'BEGIN_REFUND'}[action]));return;}
    }
    throw new PurchaseError('NOT_FOUND',404);
   }catch(error){const raw=error.code??error.message,code=typeof raw==='string'&&/^(?:[A-Z][A-Z0-9_]{2,95})$/.test(raw)?raw:'REQUEST_REJECTED';
    const status=error.status??(code==='LIVE_SALE_NOT_APPROVED'?403:code==='SESSION_REQUIRED'?401:code.endsWith('NOT_FOUND')?404:code.startsWith('PURCHASE_VAULT')||code.startsWith('REPORT_STORE')?503:422);
    if(!res.headersSent)respond(res,status,{status:'REJECTED',error:{code,message:messages[code]??'요청을 처리하지 못했습니다. 입력과 현재 상태를 확인해 주세요.'}});
   }finally{if(counted)inflight--;}
  });
  server.requestTimeout=10000;server.headersTimeout=10000;server.keepAliveTimeout=1000;server.maxHeadersCount=32;
  return Object.freeze({server,service,vault,
   async listen(port=8788){await new Promise((ok,no)=>{server.once('error',no);server.listen(port,'127.0.0.1',ok);});origin='http://127.0.0.1:'+server.address().port;return origin;},
   async close(){server.closeAllConnections();if(server.listening)await new Promise(ok=>server.close(ok));await service.close();await reportStore.close();sessions.close();await vault.close();provider.close();Object.values(keys).forEach(k=>k.fill(0));}
  });
 }catch(error){await service?.close();await reportStore?.close();sessions?.close();await vault?.close();provider.close();Object.values(keys).forEach(k=>k.fill(0));throw error;}
}
export async function runPurchaseWeb(args){
 let app;try{
  if(process.versions.node.split('.')[0]!=='22')throw new Error('NODE22_REQUIRED');
  const options={};if(args.length!==8)throw new Error('EXPLICIT_LOCAL_OPTIONS_REQUIRED');for(let i=0;i<args.length;i+=2){if(!['--data-pack','--state-dir','--mode','--port'].includes(args[i])||options[args[i]])throw new Error('EXPLICIT_LOCAL_OPTIONS_REQUIRED');options[args[i]]=args[i+1];}
  if(options['--mode']!=='local-test'||!/^\d{1,5}$/.test(options['--port'])||+options['--port']<1||+options['--port']>65535)throw new Error('LOCAL_TEST_MODE_REQUIRED');
  const ports=await loadPurchaseEnginePorts(resolve(options['--data-pack']));app=await createPurchaseWeb({stateDirectory:resolve(options['--state-dir']),ports,mode:'LOCAL_TEST_ONLY'});
  const address=await app.listen(+options['--port']);process.stdout.write(JSON.stringify({status:'LOCAL_TEST_READY',address,livePaymentAllowed:false,paidReportReady:false})+'\n');
  for(const signal of ['SIGINT','SIGTERM'])process.once(signal,()=>{app.close().then(()=>{process.exitCode=0;}).catch(()=>{process.exitCode=1;});});
 }catch{await app?.close().catch(()=>{});process.stderr.write('{"status":"REJECTED","code":"LOCAL_WEB_START_FAILED"}\n');process.exitCode=1;}
}
if(process.argv[1]&&import.meta.url===pathToFileURL(resolve(process.argv[1])).href)await runPurchaseWeb(process.argv.slice(2));
