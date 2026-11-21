import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp,rm,readFile,writeFile,readdir} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {randomBytes} from 'node:crypto';
import {request as httpRequest} from 'node:http';
import {createPurchaseWeb} from '../scripts/purchase/web.mjs';
import {loadOrCreatePurchaseKeys} from '../scripts/purchase/vault.mjs';
import {createFakePaymentProvider} from '../scripts/purchase/fake-payment.mjs';
import {makeConsumerProjection} from './fixtures/consumer-report-projection-v1.mjs';
import {SERVER_REQUEST_LITERAL_BASE} from './fixtures/server-api-only-request-cases-v1.mjs';
import {buildInterpretedReport,rebuildInterpretationBasis,buildInterpretedSections,renderInterpretedReport} from '../dist/report/narrativePipelineV1.js';

// These HTTP lifecycle tests use the existing synthetic report-contract fixture.
// Calendar/provenance accuracy is tested separately by the real private-data E2E.
const request=()=>structuredClone(SERVER_REQUEST_LITERAL_BASE);
const report=()=>buildInterpretedReport(rebuildInterpretationBasis(makeConsumerProjection()),{profileId:'SAJU-TRADITIONAL-REFLECTION-REPORT-V01'});
function fixturePorts(r=report()){
  return {calculatePreview(){return {calculationStatus:r.basis.projection.calculationStatus,candidateCount:r.basis.projection.candidates.length,contextId:r.contextId,dataFingerprint:r.provenance.dataFingerprint,preview:{opening:['합성 HTTP 수명주기 검사'],candidates:[],sections:[]},eligibility:r.eligibility};},generateReport:()=>r};
}
async function harness(t,options={}){
  const directory=await mkdtemp(join(tmpdir(),'saju-s8-web-'));let app,origin;const settings={stateDirectory:directory,ports:fixturePorts(),mode:'LOCAL_TEST_ONLY',...options};
  async function start(){app=await createPurchaseWeb(settings);origin=await app.listen(0);}
  async function stop(){if(app){await app.close();app=null;}}
  await start();t.after(async()=>{await stop();await rm(directory,{recursive:true,force:true});});
  function client(){let cookie='',csrf='';return {get cookie(){return cookie;},get csrf(){return csrf;},
    async call(path,{method='GET',body,headers={},noCookie=false,noCsrf=false,raw=false}={}){
      const response=await fetch(origin+path,{method,headers:{...(noCookie?{}:cookie?{cookie}:{}),...(method!=='GET'?{Origin:origin,'Content-Type':'application/json',...(noCsrf?{}:{'X-CSRF-Token':csrf})}:{}),...headers},...(body===undefined?{}:{body:JSON.stringify(body)}),redirect:'manual'});
      const set=response.headers.get('set-cookie');if(set)cookie=set.split(';')[0];const result=raw?await response.text():await response.json();if(path==='/api/session'&&response.ok)csrf=result.csrfToken;
      return {status:response.status,body:result,headers:response.headers};
    },async session(){return this.call('/api/session');}};
  }
  return {directory,client,get app(){return app;},get origin(){return origin;},start,stop,settings};
}
async function order(client,{checkout=true,key='fixed-key'}={}){
  const review=await client.call('/api/reviews',{method:'POST',body:{request:request()}});assert.equal(review.status,200);
  assert.equal((await client.call(`/api/reviews/${review.body.reviewId}/confirm`,{method:'POST',body:{}})).status,200);
  const result=await client.call('/api/orders',{method:'POST',body:{mode:'TEST',reviewId:review.body.reviewId,idempotencyKey:key}});assert.equal(result.status,200);
  if(checkout)assert.equal((await client.call(`/api/orders/${result.body.id}/checkout`,{method:'POST',body:{}})).status,200);
  return {...result.body,reviewId:review.body.reviewId};
}
async function approve(h,c,o){const result=await c.call(`/api/orders/${o.id}/simulate`,{method:'POST',body:{action:'APPROVE'}});assert.equal(result.status,200);await h.app.service.drain();return (await c.call(`/api/orders/${o.id}`)).body;}

test('S8 HTTP blocks live sales regardless of parameters/environment, uses secure-response headers and explicit local mode',async t=>{
  const h=await harness(t),c=h.client(),session=await c.session();assert.equal(session.status,200);assert.equal(session.body.saleStatus,'NOT_FOR_SALE_YET');assert.deepEqual(Object.values(session.body.gates),[false,false,false,false]);assert.match(session.headers.get('set-cookie'),/HttpOnly; SameSite=Strict/);assert.ok(!Object.hasOwn(session.body,'token'));assert.ok(!Object.hasOwn(session.body,'actorId'));
  const old=process.env.LIVE_PAYMENT_ALLOWED;process.env.LIVE_PAYMENT_ALLOWED='true';try{for(const path of ['/api/live/orders','/api/live/payments']){const result=await c.call(path,{method:'POST',body:{CONTENT_APPROVED:true,amount:1,mode:'TEST'}});assert.equal(result.status,403);assert.equal(result.body.error.code,'LIVE_SALE_NOT_APPROVED');}}finally{if(old===undefined)delete process.env.LIVE_PAYMENT_ALLOWED;else process.env.LIVE_PAYMENT_ALLOWED=old;}
  const page=await c.call('/',{raw:true});assert.equal(page.status,200);assert.match(page.headers.get('content-security-policy'),/frame-ancestors 'none'/);assert.equal(page.headers.get('cache-control'),'no-store');assert.equal(page.headers.get('referrer-policy'),'no-referrer');
  await assert.rejects(createPurchaseWeb({...h.settings,mode:'PRODUCTION'}),/LOCAL_TEST_MODE_REQUIRED/);
});

test('S8 HTTP rejects wrong Origin/Host, missing CSRF, spoofed actors and malformed birth input',async t=>{
  const h=await harness(t),c=h.client();assert.equal((await c.call('/api/orders')).status,401);await c.session();
  // fetch replaces Host with its URL authority. Use a real raw HTTP request to
  // verify Host rejection rather than weakening the expected server response.
  const wrongHost=await new Promise((resolve,reject)=>{const req=httpRequest(h.origin+'/api/orders',{headers:{Host:'evil.example'}},res=>{res.resume();res.on('end',()=>resolve(res.statusCode));});req.once('error',reject);req.end();});
  assert.equal(wrongHost,403);assert.equal((await c.call('/api/orders',{headers:{Origin:'https://evil.example'}})).status,403);
  assert.equal((await c.call('/api/reviews',{method:'POST',body:{request:request()},noCsrf:true})).status,403);
  const fakeActor=await c.call('/api/reviews',{method:'POST',body:{request:request(),actorId:'guest_fake'}});assert.equal(fakeActor.body.error.code,'INVALID_REQUEST');
  const bad=request();bad.time='24:00';const invalid=await c.call('/api/reviews',{method:'POST',body:{request:bad}});assert.equal(invalid.status,422);assert.equal(invalid.body.error.code,'EXPLICIT_TIME_OR_NULL_REQUIRED');
  assert.equal((await c.call('/api/orders?actorId=other')).body.error.code,'QUERY_NOT_ALLOWED');
});

test('S8 HTTP requires input confirmation, trusts server fixture amount, and deduplicates order requests',async t=>{
  const h=await harness(t),c=h.client();await c.session();const review=await c.call('/api/reviews',{method:'POST',body:{request:request()}}),body={reviewId:review.body.reviewId,mode:'TEST',idempotencyKey:'concurrent'};
  assert.equal((await c.call('/api/orders',{method:'POST',body})).body.error.code,'INPUT_CONFIRMATION_REQUIRED');await c.call(`/api/reviews/${review.body.reviewId}/confirm`,{method:'POST',body:{}});
  const results=await Promise.all(Array.from({length:4},()=>c.call('/api/orders',{method:'POST',body})));assert.ok(results.every(x=>x.status===200));assert.equal(new Set(results.map(x=>x.body.id)).size,1);assert.equal((await c.call('/api/orders')).body.orders.length,1);
  assert.equal((await c.call('/api/orders',{method:'POST',body:{...body,amount:1}})).body.error.code,'INVALID_REQUEST');
  const o=results[0].body;assert.equal((await c.call(`/api/orders/${o.id}/report`)).status,403);assert.equal((await c.call(`/api/orders/${o.id}/simulate`,{method:'POST',body:{action:'APPROVE'}})).body.error.code,'PAYMENT_NOT_REQUESTED');
});

test('S8 verified fake payment generates actual S7 claims once; repeat events and browser re-read preserve them',async t=>{
  let generated=0;const r=report(),ports=fixturePorts(r);ports.generateReport=()=>{generated++;return r;};const h=await harness(t,{ports}),c=h.client();await c.session();const o=await order(c);
  const done=await approve(h,c,o);assert.equal(done.generationStatus,'COMPLETED');assert.equal(generated,1);
  const view=await c.call(`/api/orders/${o.id}/report`);assert.equal(view.status,200);assert.equal(view.body.sections.sections.length,6);assert.deepEqual(view.body.claims,r.interpretationClaims);assert.equal(view.body.text,renderInterpretedReport(r));assert.deepEqual(view.body.sections,buildInterpretedSections(r));assert.equal(view.body.eligibility.fullPaidReport,false);
  for(const action of ['REPLAY','APPROVE'])assert.equal((await c.call(`/api/orders/${o.id}/simulate`,{method:'POST',body:{action}})).status,200);await h.app.service.drain();assert.equal(generated,1);
  await h.stop();await h.start();assert.equal((await c.call(`/api/orders/${o.id}/report`)).body.text,view.body.text);assert.equal((await c.call('/api/orders')).body.orders[0].generationStatus,'COMPLETED');assert.equal(generated,1);
});

test('S8 webhook signature, amount, product and buyer binding are verified server-side',async t=>{
  const h=await harness(t,{autoRun:false}),c=h.client();await c.session();const o=await order(c);const keys=await loadOrCreatePurchaseKeys(join(h.directory,'keys')),provider=createFakePaymentProvider({signingKey:keys.providerKey});t.after(()=>{provider.close();Object.values(keys).forEach(k=>k.fill(0));});
  const stored=(await h.app.vault.read()).orders[o.id];
  const badSig=await c.call(`/api/orders/${o.id}/simulate`,{method:'POST',body:{action:'BAD_SIGNATURE'}});assert.equal(badSig.body.error.code,'FAKE_SIGNATURE_INVALID');
  for(const change of [{amount:999},{productId:'UNAPPROVED'},{actorRef:'other-actor'},{providerRef:'fake:wrong'}]){const event=provider.createEvent({...stored,...change},'PAYMENT_APPROVED');const result=await c.call('/api/provider/events',{method:'POST',body:event});assert.equal(result.status,422);assert.equal(result.body.error.code,'PAYMENT_BINDING_MISMATCH');}
  const status=(await c.call(`/api/orders/${o.id}`)).body;assert.equal(status.paymentStatus,'PENDING');assert.equal(status.generationStatus,'NOT_STARTED');
});

test('S8 separate guests cannot confirm, modify or re-read another order; deletion revokes same-owner read',async t=>{
  const h=await harness(t),alice=h.client(),bob=h.client();await alice.session();await bob.session();const o=await order(alice);await approve(h,alice,o);
  for(const path of [`/api/orders/${o.id}`,`/api/orders/${o.id}/report`])assert.equal((await bob.call(path)).status,404);
  for(const action of ['cancel','refund'])assert.equal((await bob.call(`/api/orders/${o.id}/${action}`,{method:'POST',body:{}})).status,404);
  assert.equal((await bob.call(`/api/reviews/${o.reviewId}/confirm`,{method:'POST',body:{}})).status,404);assert.equal((await bob.call('/api/orders')).body.orders.length,0);
  assert.equal((await alice.call(`/api/orders/${o.id}/report`,{method:'DELETE',body:{}})).body.status,'DELETED');assert.equal((await alice.call(`/api/orders/${o.id}/report`)).status,403);
});

test('S8 session expiry and forged cookie deny stored order access without transferring ownership',async t=>{
  let ms=Date.parse('2026-11-22T00:00:00Z');const h=await harness(t,{now:()=>new Date(ms),sessionTtlMs:1000}),c=h.client();await c.session();const o=await order(c,{checkout:false});ms+=1000;
  assert.equal((await c.call(`/api/orders/${o.id}`)).status,401);assert.equal((await c.session()).status,401);await c.session();assert.equal((await c.call(`/api/orders/${o.id}`)).status,404);
  const forged=await c.call('/api/orders',{headers:{Cookie:'saju_s8_guest='+randomBytes(32).toString('base64url')}});assert.equal(forged.status,401);
});

test('S8 cancellation before approval and late approval require refund and never start generation',async t=>{
  let generated=0;const ports=fixturePorts();ports.generateReport=()=>{generated++;return report();};const h=await harness(t,{ports}),c=h.client();await c.session();const o=await order(c);
  assert.equal((await c.call(`/api/orders/${o.id}/simulate`,{method:'POST',body:{action:'DELAY'}})).body.paymentStatus,'PENDING');assert.equal((await c.call(`/api/orders/${o.id}/cancel`,{method:'POST',body:{}})).body.orderStatus,'CANCELLED');
  const late=await approve(h,c,o);assert.equal(late.refundStatus,'REQUESTED');assert.equal(late.accessStatus,'REVOKED');assert.equal(generated,0);
});

test('S8 refund simulation revokes access, deduplicates requests and retries failure without reopening content',async t=>{
  const h=await harness(t),c=h.client();await c.session();const o=await order(c);await approve(h,c,o);
  for(let i=0;i<2;i++)assert.equal((await c.call(`/api/orders/${o.id}/refund`,{method:'POST',body:{}})).body.refundStatus,'REQUESTED');assert.equal((await c.call(`/api/orders/${o.id}/report`)).status,403);
  await c.call(`/api/orders/${o.id}/refund-review`,{method:'POST',body:{}});assert.equal((await c.call(`/api/orders/${o.id}/simulate`,{method:'POST',body:{action:'REFUND_FAIL'}})).body.refundStatus,'REFUND_FAILED');
  await c.call(`/api/orders/${o.id}/refund-review`,{method:'POST',body:{}});const done=await c.call(`/api/orders/${o.id}/simulate`,{method:'POST',body:{action:'REFUND_APPROVE'}});assert.equal(done.body.refundStatus,'REFUNDED');
  assert.equal((await c.call(`/api/orders/${o.id}/simulate`,{method:'POST',body:{action:'REPLAY'}})).body.refundStatus,'REFUNDED');assert.equal((await c.call(`/api/orders/${o.id}/refund-review`,{method:'POST',body:{}})).status,422);assert.equal((await c.call(`/api/orders/${o.id}/report`)).status,403);
});

test('S8 failed report storage stays retryable, recovery reuses the same generated record',async t=>{
  let fail=true;const h=await harness(t,{storeWrapper:store=>({...store,put:async input=>{if(fail){fail=false;throw Error('synthetic storage failure');}return store.put(input);}})}),c=h.client();await c.session();const o=await order(c);const first=await approve(h,c,o);assert.equal(first.generationStatus,'FAILED_RETRYABLE');assert.equal(first.errorCode,'RESULT_STORAGE_FAILED');
  await c.call(`/api/orders/${o.id}/retry`,{method:'POST',body:{}});await h.app.service.drain();assert.equal((await c.call(`/api/orders/${o.id}`)).body.generationStatus,'COMPLETED');
});

test('S8 important claim or dataset mismatch is final failure and never publishes a fabricated report',async t=>{
  const bad=structuredClone(report());bad.interpretationClaims[0].consumerText='당신은 반드시 부자가 됩니다.';const ports=fixturePorts();ports.generateReport=()=>bad;
  const h=await harness(t,{ports}),c=h.client();await c.session();const o=await order(c);const done=await approve(h,c,o);assert.equal(done.generationStatus,'FAILED_FINAL');assert.equal(done.errorCode,'CLAIM_OR_POLICY_VALIDATION_FAILED');assert.equal((await c.call(`/api/orders/${o.id}/report`)).status,403);
});

test('S8 expired and tampered stored reports fail read rather than exposing or silently regenerating content',async t=>{
  let ms=Date.parse('2026-11-22T00:00:00Z');const h=await harness(t,{now:()=>new Date(ms),sessionTtlMs:10*86400000}),c=h.client();await c.session();const o=await order(c);await approve(h,c,o);
  const root=join(h.directory,'reports'),owner=(await readdir(root))[0],file=(await readdir(join(root,owner))).find(x=>x.endsWith('.json')),path=join(root,owner,file),bytes=await readFile(path);const parsed=JSON.parse(bytes);parsed.tag=randomBytes(16).toString('base64url');await writeFile(path,JSON.stringify(parsed));
  const altered=await c.call(`/api/orders/${o.id}/report`);assert.equal(altered.status,503);assert.equal(altered.body.error.code,'REPORT_STORE_INTEGRITY_FAILED');await writeFile(path,bytes);
  ms+=7*86400000;const expired=await c.call(`/api/orders/${o.id}/report`);assert.equal(expired.status,410);assert.equal(expired.body.error.code,'REPORT_EXPIRED');
});

test('S8 startup recovers interrupted validated-paid work, preserving generation and payment idempotency separately',async t=>{
  let generated=0;const r=report(),ports=fixturePorts(r);ports.generateReport=()=>{generated++;return r;};const h=await harness(t,{ports,autoRun:false}),c=h.client();await c.session();const o=await order(c);await approve(h,c,o);
  const internal=(await h.app.vault.read()).orders[o.id];assert.equal(internal.generationStatus,'QUEUED');
  // Inject an on-disk interrupted phase. A separate process-kill test exercises
  // actual process death; this fixture isolates service startup state recovery.
  await h.app.service.command(internal.actorRef,o.id,'START_GENERATION');await h.stop();h.settings.autoRun=true;await h.start();await h.app.service.drain();
  const recovered=(await c.call(`/api/orders/${o.id}`)).body;assert.equal(recovered.generationStatus,'COMPLETED');assert.equal(recovered.paymentStatus,'APPROVED');assert.equal(generated,1);assert.ok(recovered.history.some(x=>x.event==='RECOVER_INTERRUPTED'));
});

test('S8 crash window after storing result retries without creating a second physical report',async t=>{
  let first=true;const h=await harness(t,{faults:async phase=>{if(phase==='AFTER_STORE'&&first){first=false;throw Error('synthetic post-store interruption');}}}),c=h.client();await c.session();const o=await order(c);assert.equal((await approve(h,c,o)).generationStatus,'FAILED_RETRYABLE');
  const root=join(h.directory,'reports'),owners=await readdir(root);assert.equal(owners.length,1);assert.equal((await readdir(join(root,owners[0]))).filter(x=>x.endsWith('.json')).length,1);
  assert.equal((await c.call(`/api/orders/${o.id}/retry`,{method:'POST',body:{}})).status,200);await h.app.service.drain();assert.equal((await c.call(`/api/orders/${o.id}/report`)).status,200);assert.equal((await readdir(join(root,owners[0]))).filter(x=>x.endsWith('.json')).length,1);
});

test('S8 valid local key file with wrong report key keeps the order but rejects report decryption after restart',async t=>{
  const h=await harness(t),c=h.client();await c.session();const o=await order(c);await approve(h,c,o);await h.stop();
  const path=join(h.directory,'keys','local-test-keys.json'),keys=JSON.parse(await readFile(path,'utf8'));keys.reportEncryptionKey=randomBytes(32).toString('base64url');await writeFile(path,JSON.stringify(keys));await h.start();
  assert.equal((await c.call(`/api/orders/${o.id}`)).body.generationStatus,'COMPLETED');const denied=await c.call(`/api/orders/${o.id}/report`);assert.equal(denied.status,503);assert.equal(denied.body.error.code,'REPORT_STORE_INTEGRITY_FAILED');
});

test('S8 no timed chart or report eligibility cannot become test-purchasable by client assertion',async t=>{
  const held=report();const ports=fixturePorts(held);ports.calculatePreview=()=>({calculationStatus:'NEEDS_BIRTH_TIME',candidateCount:0,contextId:held.contextId,dataFingerprint:held.provenance.dataFingerprint,preview:{opening:[],candidates:[],sections:[]},eligibility:{...held.eligibility,status:'NEEDS_ADDITIONAL_INFORMATION'}});
  const h=await harness(t,{ports}),c=h.client();await c.session();const input=request();input.time=null;const review=await c.call('/api/reviews',{method:'POST',body:{request:input}});assert.equal(review.body.canTestCheckout,false);await c.call(`/api/reviews/${review.body.reviewId}/confirm`,{method:'POST',body:{}});
  const denied=await c.call('/api/orders',{method:'POST',body:{mode:'TEST',reviewId:review.body.reviewId,idempotencyKey:'held'}});assert.equal(denied.status,422);assert.equal(denied.body.error.code,'ELIGIBILITY_BLOCKED');assert.equal((await c.call('/api/orders')).body.orders.length,0);
});

test('S8 missing queued input fails finally without generating or endlessly retaining a queued job',async t=>{
  let generated=0;const ports=fixturePorts();ports.generateReport=()=>{generated++;return report();};const h=await harness(t,{ports,autoRun:false}),c=h.client();await c.session();const o=await order(c);await approve(h,c,o);
  await h.app.vault.mutate(state=>{delete state.drafts[o.reviewId];});await h.stop();h.settings.autoRun=true;await h.start();await h.app.service.drain();
  const failed=(await c.call(`/api/orders/${o.id}`)).body;assert.equal(failed.generationStatus,'FAILED_FINAL');assert.equal(failed.errorCode,'CLAIM_OR_POLICY_VALIDATION_FAILED');assert.equal(generated,0);assert.equal(failed.canRetry,false);assert.equal((await c.call(`/api/orders/${o.id}/report`)).status,403);
});

test('S8 generation refuses a changed policy or generator pin instead of silently publishing a different version',async t=>{
  let generated=0;const ports=fixturePorts();ports.generateReport=()=>{generated++;return report();};const h=await harness(t,{ports,autoRun:false}),c=h.client();await c.session();const o=await order(c);await approve(h,c,o);
  await h.app.vault.mutate(state=>{state.drafts[o.reviewId].versionPin.generator='99.0.0';});await h.stop();h.settings.autoRun=true;await h.start();await h.app.service.drain();
  const failed=(await c.call(`/api/orders/${o.id}`)).body;assert.equal(failed.generationStatus,'FAILED_FINAL');assert.equal(failed.errorCode,'CLAIM_OR_POLICY_VALIDATION_FAILED');assert.equal(generated,0);assert.equal((await c.call(`/api/orders/${o.id}/report`)).status,403);
});

test('S8 refund between result storage and completion revokes access and removes the orphaned report',async t=>{
  let c,o;const h=await harness(t,{faults:async phase=>{if(phase==='AFTER_STORE'){const refund=await c.call(`/api/orders/${o.id}/refund`,{method:'POST',body:{}});assert.equal(refund.body.refundStatus,'REQUESTED');}}});c=h.client();await c.session();o=await order(c);await approve(h,c,o);
  const state=(await c.call(`/api/orders/${o.id}`)).body;assert.equal(state.refundStatus,'REQUESTED');assert.equal(state.accessStatus,'REVOKED');assert.equal(state.reportAvailable,false);assert.equal((await c.call(`/api/orders/${o.id}/report`)).status,403);
  const root=join(h.directory,'reports');for(const owner of await readdir(root))assert.equal((await readdir(join(root,owner))).filter(name=>name.endsWith('.json')).length,0);
});
