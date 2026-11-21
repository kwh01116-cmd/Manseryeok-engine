/** Fictional support tickets and one actual S8 TEST order. No customer traffic. */
import assert from 'node:assert/strict';
import {performance} from 'node:perf_hooks';
import {mkdir,readdir,stat,writeFile} from 'node:fs/promises';
import {join,resolve,relative,isAbsolute} from 'node:path';
import {createPurchaseWeb} from '../purchase/web.mjs';
import {loadPurchaseEnginePorts} from '../purchase/service.mjs';
import {SPRINT6_REPORT_CASES} from '../../test/fixtures/sprint6-report-cases-v1.mjs';

const root=resolve(import.meta.dirname,'../..');
const pack=process.argv[2], out=process.argv[3] && resolve(process.argv[3]);
assert.equal(process.versions.node.split('.')[0],'22');
assert.ok(pack && out,'Specify data pack and a NEW private evidence directory.');
const rel=relative(join(root,'.private'),out);
assert.ok(rel && !rel.startsWith('..') && !isAbsolute(rel));
await mkdir(out,{mode:0o700});
const stateDirectory=join(out,'test-state');
const ports=await loadPurchaseEnginePorts(resolve(pack));
const jobs=[];
const app=await createPurchaseWeb({stateDirectory,mode:'LOCAL_TEST_ONLY',ports:{...ports,generateReport(request){
  const start=performance.now(),cpu=process.cpuUsage();
  const report=ports.generateReport(request),elapsed=process.cpuUsage(cpu);
  jobs.push({durationMs:performance.now()-start,cpuMs:(elapsed.user+elapsed.system)/1000});
  return report;
}}});
let cookie,csrf;const timings=[];
async function bytes(dir){
  let total=0;
  for(const f of await readdir(dir,{withFileTypes:true})){
    const path=join(dir,f.name);total+=f.isDirectory()?await bytes(path):(await stat(path)).size;
  }return total;
}
try{
  const url=await app.listen(0);
  async function call(path,body,method=body===undefined?'GET':'POST'){
    const start=performance.now();
    const res=await fetch(url+path,{method,headers:{...(cookie?{cookie}:{}),
      ...(body===undefined?{}:{Origin:url,'X-CSRF-Token':csrf,'Content-Type':'application/json'})},
      ...(body===undefined?{}:{body:JSON.stringify(body)})});
    const value=await res.json();timings.push(performance.now()-start);
    if(res.headers.has('set-cookie'))cookie=res.headers.get('set-cookie').split(';')[0];
    return {status:res.status,value};
  }
  const byId=id=>SPRINT6_REPORT_CASES.find(x=>x.id===id);
  csrf=(await call('/api/session')).value.csrfToken;
  const bad=await call('/api/reviews',{request:{...byId('MONTH_MAIN_OFFICER').request,time:'27:65'}});
  assert.equal(bad.status,422);
  const inputs=[];
  for(const id of ['WINTER_WOOD_CANDIDATE','WINTER_WOOD_PRESENT_FIRE_HOLD','UNKNOWN_TIME_REQUIRES_INFORMATION',
       'DST_NONEXISTENT_CIVIL_TIME','DST_AMBIGUOUS_CIVIL_TIME','LICHUN_CORRELATED_NATAL_PARENTS',
       'FUTURE_LUNAR_NEEDS_DATA','UNSUPPORTED_1954_CLOCK']){
    const f=byId(id),r=await call('/api/reviews',{request:f.request});
    assert.equal(r.status,200);assert.equal(r.value.calculationStatus,f.expected.status);
    assert.equal(r.value.candidateCount,f.expected.natalParents);
    inputs.push({caseId:id,status:r.value.calculationStatus,parents:r.value.candidateCount,testEligible:r.value.canTestCheckout});
  }
  const review=(await call('/api/reviews',{request:byId('MONTH_MAIN_OFFICER').request})).value;
  await call('/api/reviews/'+review.reviewId+'/confirm',{});
  const storageBeforeOrder=await bytes(stateDirectory);
  const orderCPU=process.cpuUsage(),orderStart=performance.now();
  const orderArgs={mode:'TEST',reviewId:review.reviewId,idempotencyKey:'S9_SUPPORT_MOCK'};
  const created=await call('/api/orders',orderArgs);assert.equal(created.status,200);
  const order=await call('/api/orders',orderArgs);assert.equal(order.value.id,created.value.id);
  const base='/api/orders/'+order.value.id;
  assert.equal((await call(base+'/checkout',{})).status,200);
  assert.equal((await call(base+'/simulate',{action:'APPROVE'})).status,200);await app.service.drain();
  assert.equal((await call(base+'/simulate',{action:'REPLAY'})).status,200);await app.service.drain();
  const first=await call(base+'/report'),second=await call(base+'/report');
  assert.equal(first.status,200);assert.deepEqual(second,first);assert.equal(first.value.claims.length,4);
  const elapsed=process.cpuUsage(orderCPU),latency=performance.now()-orderStart;
  const storageDelivered=await bytes(stateDirectory);
  assert.equal(jobs.length,1);
  assert.equal((await call(base+'/refund',{})).status,200);
  assert.equal((await call(base+'/report')).status,403);
  assert.equal((await call(base+'/refund-review',{})).status,200);
  assert.equal((await call(base+'/simulate',{action:'REFUND_APPROVE'})).status,200);
  const reportDir=join(stateDirectory,'reports');assert.equal(await bytes(reportDir),0);
  const s={status:'PASS',traffic:'SYNTHETIC_SUPPORT_REHEARSAL',inputValidation:{rejected:1,submitted:10},
    inputs,orderCase:'MONTH_MAIN_OFFICER',unsupportedOrMoreInformation:{count:inputs.filter(i=>!i.testEligible).length,validReviews:9},
    ordersCreated:1,duplicateOrderRequests:1,replayedApprovalEvents:1,regenerations:0,generated:jobs.length,
    reportReadsSuccessful:2,storeFailures:0,rereadFailures:0,accessDeniedAfterRefund:1,generation:jobs[0],
    processCpuMsPerDeliveredOrder:(elapsed.user+elapsed.system)/1000,orderToTwoReadsMs:latency,
    includesLoopbackClientCPU:true,storageBeforeOrder,storageDelivered,storageAddedBytes:storageDelivered-storageBeforeOrder,
    reportBytesAfterRefund:0,httpRequests:timings.length,httpRoundTripMs:{total:timings.reduce((a,b)=>a+b,0),max:Math.max(...timings)},
    moneyCostMeasured:false,actualCustomerTickets:0,externalPGCalls:0,externalLLMCalls:0};
  await writeFile(join(out,'operations.json'),JSON.stringify(s,null,2)+'\n',{flag:'wx'});console.log(JSON.stringify(s));
} finally{await app.close();}
