/** Separate fixture-only listener. No purchase, invite administration or raw birth input routes. */
import {createServer} from 'node:http';
import {createHash} from 'node:crypto';
import {readFile} from 'node:fs/promises';
import {performance} from 'node:perf_hooks';
import {resolve,relative,isAbsolute,sep} from 'node:path';
import {pathToFileURL} from 'node:url';
import {CONSENT_VERSION, CONSENT_TEXT, openBetaStudy, questionsFor} from './study.mjs';
import {buildStudyMaterials, getBlindPacket, getBlindDebrief, getComparisonType} from './materials.mjs';

const assets = new Map([
  ['/', ['beta/index.html', 'text/html']],
  ['/study.js', ['beta/study.js', 'text/javascript']],
  ['/study.css', ['beta/study.css', 'text/css']],
  ['/base.css', ['purchase/styles.css', 'text/css']]
]);
const headers = {
  'Cache-Control': 'no-store', 'X-Content-Type-Options': 'nosniff',
  'Referrer-Policy': 'no-referrer', 'X-Frame-Options': 'DENY',
  'Permissions-Policy': 'camera=(), microphone=(), geolocation=()',
  'Content-Security-Policy': "default-src 'none'; style-src 'self'; script-src 'self'; connect-src 'self'; img-src 'self'; form-action 'none'; base-uri 'none'; frame-ancestors 'none'"
};
const cookieName = 'saju_s9_lab';
const modes = new Set(['LOCAL_DEVELOPMENT','INTERNAL_QA','CLOSED_BETA','PRODUCTION']);
export function checkMode(mode) {
  if (!modes.has(mode)) throw Error('UNKNOWN_MODE');
  if (process.env.NODE_ENV === 'production' || mode === 'PRODUCTION') throw Error('PUBLIC_RELEASE_BLOCKED');
  if (mode === 'CLOSED_BETA') throw Error('HUMAN_COLLECTION_APPROVAL_REQUIRED');
  return mode;
}
function reject(status, code) { throw Object.assign(new Error(code), {status, code}); }
function sessionCookie(req) {
  const entries=(req.headers.cookie || '').split(';').map(x=>x.trim()).filter(x=>x.startsWith(cookieName+'='));
  if(entries.length>1) reject(401,'SESSION_REQUIRED');
  return entries[0]?.slice(cookieName.length+1);
}
function setCookie(token, age) {
  return {'Set-Cookie':cookieName+'='+token+'; HttpOnly; SameSite=Strict; Path=/; Max-Age='+age};
}
async function readJson(req) {
  if(req.headers['content-type']?.split(';')[0].trim()!=='application/json') reject(415,'JSON_REQUIRED');
  const chunks=[]; let size=0;
  for await(const chunk of req) {
    size+=chunk.length;
    if(size>8192) reject(413,'BODY_TOO_LARGE');
    chunks.push(chunk);
  }
  try {return JSON.parse(Buffer.concat(chunks).toString('utf8'));} catch {reject(400,'INVALID_JSON');}
}
function fields(value, keys) {
  if(!value || Array.isArray(value) || typeof value!=='object' ||
     Object.keys(value).sort().join('|')!==keys.slice().sort().join('|')) reject(422,'INVALID_FIELDS');
}
function send(res,status,value,extra={}) {
  res.writeHead(status,{...headers,'Content-Type':'application/json; charset=utf-8',...extra});
  res.end(JSON.stringify(value));
}
function participantView(session, fixture, fixtures) {
  const base={role:session.role, consented:session.consented, completed:session.completed,
    blindLocked:session.blindLocked, csrfToken:session.csrfToken, expiresAt:session.expiresAt,
    consentVersion:CONSENT_VERSION, consentText:CONSENT_TEXT};
  if(!session.consented) return base;
  const reader=session.role==='READER';
  const blind=session.arm==='BLIND';
  const questions=questionsFor(session.role,session.arm);
  const packet=blind ? getBlindPacket(fixtures,fixture.id,session.blindOrder) : null;
  if(blind && !packet) reject(409,'NO_BALANCED_BLIND_TRIAL');
  if(blind && !session.blindLocked) {
    return {...base, questions:questions.filter(q=>isBlindQuestion(q)||q.target==='issue'),feedback:session.feedback,
      comparison:{context:packet.context,readings:packet.readings.map(({slot,text})=>({slot,text}))}};
  }
  const result={...base, questions:questions.filter(q=>!isBlindQuestion(q)),feedback:session.feedback,
    report:{id:fixture.id,label:fixture.label,status:fixture.status,chapters:fixture.chapters,
      chartSummary:fixture.chartSummary,opening:fixture.opening,eligibility:fixture.eligibility,
      ...(!reader?{claims:fixture.claims,candidates:fixture.candidates,sources:fixture.sources,blockers:fixture.blockers,
        fictionalInput:fixture.fictionalInput,dataVersion:fixture.dataVersion,generatorVersion:fixture.generatorVersion,
        basisVersion:fixture.basisVersion}:{})}};
  if(blind && session.completed) result.debrief=getBlindDebrief(fixtures,fixture.id,session.blindOrder);
  return result;
}
function isBlindQuestion(q) {return q.target==='slot' || q.id.startsWith('blind');}

export async function createBetaWeb({directory,materials,mode,now}) {
  if(checkMode(mode)!=='INTERNAL_QA') throw Error('USE_SEPARATE_LOCAL_DEVELOPMENT_ENTRY');
  const fixtures=materials.fixtures;
  const byId=new Map(fixtures.map(f=>[f.id,f]));
  if(!fixtures.length || byId.size!==fixtures.length) throw Error('INVALID_FIXTURE_CATALOG');
  // Bind impressions to the actual reviewed text, including possible comparisons on this dataset.
  const catalogSha=createHash('sha256').update(JSON.stringify([materials.version,fixtures,
    fixtures.map(f=>[getBlindPacket(fixtures,f.id,['A','B','C']),getBlindDebrief(fixtures,f.id,['A','B','C'])])])).digest('hex');
  const study=await openBetaStudy({directory,mode,now});
  let origin,active=0;
  // Counters have no request values, invite identifiers, response text or birth information.
  const counts={requests:0, rejected:0, duplicates:0, elapsedMs:0};
  let redemptionWindow=0, redemptionFailures=0;
  const server=createServer(async(req,res)=>{
    const start=performance.now(); counts.requests++; active++;
    try {
      if(active>16) reject(429,'SERVER_BUSY');
      if(!origin || req.headers.host!==new URL(origin).host || req.socket.remoteAddress!=='127.0.0.1' ||
         (req.headers.origin && req.headers.origin!==origin) || req.headers['sec-fetch-site']==='cross-site') reject(403,'LOCAL_ORIGIN_REQUIRED');
      const route=req.url;
      if(route.includes('?') || route.includes('#')) reject(400,'NO_URL_PARAMETERS');
      if(req.method==='GET' && assets.has(route)){
        const [file,type]=assets.get(route);
        const data=await readFile(new URL('../../web/'+file,import.meta.url));
        res.writeHead(200,{...headers,'Content-Type':type+'; charset=utf-8'});res.end(data);return;
      }
      if(route.startsWith('/api/live/') || route==='/api/orders') reject(403,'LIVE_SALE_NOT_APPROVED');
      if(route.startsWith('/api/admin')) reject(403,'OPERATOR_OFFLINE_ONLY');
      if(!['GET','POST'].includes(req.method)) reject(405,'METHOD_UNAVAILABLE');
      let body;
      if(req.method==='POST'){
        if(req.headers.origin!==origin) reject(403,'LOCAL_ORIGIN_REQUIRED');
        body=await readJson(req);
      }
      const token=sessionCookie(req);
      if(req.method==='POST' && route==='/api/beta/enter'){
        fields(body,['invite']);
        if(typeof body.invite!=='string' || body.invite.length>192) reject(401,'INVITE_REJECTED');
        if(token && await study.participant.session(token)) reject(409,'ALREADY_SIGNED_IN');
        if(Date.now()-redemptionWindow>60000){redemptionWindow=Date.now();redemptionFailures=0;}
        if(redemptionFailures>=15) reject(429,'INVITE_RATE_LIMIT');
        let issued;
        try{issued=await study.participant.redeem(body.invite);}catch(error){redemptionFailures++;throw error;}
        const age=Math.max(1,Math.floor((Date.parse(issued.expiresAt)-(now?.()??new Date()).getTime())/1000));
        return send(res,200,{status:'ENTERED'},setCookie(issued.token,age));
      }
      if(!token) reject(401,'SESSION_REQUIRED');
      const session=await study.participant.session(token);
      if(!session) reject(401,'SESSION_REQUIRED');
      const fixture=byId.get(session.fixtureId);
      if(!fixture) reject(409,'FIXTURE_UNAVAILABLE');
      const scope={fixtureId:fixture.id,reportArtifactVersion:fixture.artifactVersion,claimIds:fixture.claims.map(c=>c.claimId),
        materialSha256:catalogSha,comparisonType:session.arm==='BLIND'?getComparisonType(fixtures,fixture.id):null};
      if(req.method==='GET' && route==='/api/beta/me') {
        if(session.consented) await study.participant.checkMaterial(token,scope);
        return send(res,200,participantView(session,fixture,fixtures));
      }
      if(req.method!=='POST') reject(404,'NOT_FOUND');
      const csrf=req.headers['x-csrf-token'];
      let result;
      switch(route) {
        case '/api/beta/consent': fields(body,['version']);result=await study.participant.consent(token,csrf,body.version);break;
        case '/api/beta/answer': fields(body,['questionId','targetId','value']);result=await study.participant.submit(token,csrf,body,scope);break;
        case '/api/beta/lock': fields(body,[]);result=await study.participant.lockBlind(token,csrf);break;
        case '/api/beta/finish': fields(body,[]);result=await study.participant.complete(token,csrf,scope);break;
        case '/api/beta/withdraw': fields(body,[]);result=await study.participant.withdraw(token,csrf);return send(res,200,result,setCookie('',0));
        default: reject(404,'NOT_FOUND');
      }
      if(result.status==='DUPLICATE') counts.duplicates++;
      send(res,200,result);
    } catch(error) {
      counts.rejected++;
      const status=Number.isInteger(error.status)&&error.status>=400&&error.status<=599?error.status:500;
      const code=status<500 && typeof error.code==='string'&&/^[A-Z][A-Z0-9_]{2,79}$/.test(error.code)?error.code:'STUDY_REQUEST_FAILED';
      if(!res.headersSent) send(res,status,{code});
    } finally {counts.elapsedMs+=performance.now()-start;active--;}
  });
  server.requestTimeout=10000;server.headersTimeout=10000;server.keepAliveTimeout=1000;server.maxHeadersCount=32;
  return {operator:study.operator,metrics:()=>({...counts}),
    async listen(port=8789){await new Promise((ok,no)=>{server.once('error',no);server.listen(port,'127.0.0.1',ok);});
      origin='http://127.0.0.1:'+server.address().port;return origin;},
    async close(){server.closeAllConnections();if(server.listening) await new Promise(ok=>server.close(ok));await study.close();}
  };
}
async function main(args){
  if(process.versions.node.split('.')[0]!=='22') throw Error('NODE22_REQUIRED');
  const opts={};
  for(let i=0;i<args.length;i+=2){
    if(!['--mode','--port','--data-pack','--state-dir'].includes(args[i])||Object.hasOwn(opts,args[i])||!args[i+1]) throw Error('INVALID_OPTIONS');
    opts[args[i]]=args[i+1];
  }
  const mode=checkMode(opts['--mode']);
  if(args.length!==8 || !/^\d{1,5}$/.test(opts['--port']) || +opts['--port']<1 || +opts['--port']>65535) throw Error('EXPLICIT_OPTIONS_REQUIRED');
  if(mode==='LOCAL_DEVELOPMENT') {
    const {runPurchaseWeb}=await import('../purchase/web.mjs');
    return runPurchaseWeb(['--mode','local-test','--port',opts['--port'],'--data-pack',opts['--data-pack'],'--state-dir',opts['--state-dir']]);
  }
  const directory=resolve(opts['--state-dir']),pack=resolve(opts['--data-pack']);
  const inside=(parent,child)=>{const p=relative(parent,child);return !p||(!isAbsolute(p)&&p!=='..'&&!p.startsWith('..'+sep));};
  const privateRoot=resolve(import.meta.dirname,'../../.private');
  if(directory===privateRoot||!inside(privateRoot,directory)||inside(pack,directory)||inside(directory,pack)) throw Error('SEPARATE_PRIVATE_STATE_REQUIRED');
  const materials=await buildStudyMaterials({dataDirectory:pack});
  const app=await createBetaWeb({directory,materials,mode});
  try {
    const address=await app.listen(+opts['--port']);console.log(JSON.stringify({address,mode,humanCollection:false,livePayment:false}));
    let closing=false;
    const stop=()=>{if(!closing){closing=true;app.close().catch(()=>{process.exitCode=1;});}};
    process.once('SIGINT',stop);process.once('SIGTERM',stop);
  } catch(error) {await app.close();throw error;}
}
if(process.argv[1] && import.meta.url===pathToFileURL(resolve(process.argv[1])).href) {
  main(process.argv.slice(2)).catch(error=>{
    const known=['HUMAN_COLLECTION_APPROVAL_REQUIRED','PUBLIC_RELEASE_BLOCKED','NODE22_REQUIRED','EXPLICIT_OPTIONS_REQUIRED'];
    process.stderr.write((known.includes(error.message)?error.message:'BETA_WEB_START_FAILED')+'\n');process.exitCode=1;
  });
}
