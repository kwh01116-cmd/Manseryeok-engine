import {pathToFileURL} from 'node:url';
import {resolve} from 'node:path';
import {createPurchaseWeb} from '../../scripts/purchase/web.mjs';
import {buildInterpretedReport,rebuildInterpretationBasis} from '../../dist/report/narrativePipelineV1.js';
import {makeConsumerProjection} from './consumer-report-projection-v1.mjs';
import {SERVER_REQUEST_LITERAL_BASE} from './server-api-only-request-cases-v1.mjs';

export const actors={target:'guest_s9_target',control:'guest_s9_control'};

export function openRecoveryApp(directory,options={}) {
  const report=buildInterpretedReport(rebuildInterpretationBasis(makeConsumerProjection()),{profileId:'SAJU-TRADITIONAL-REFLECTION-REPORT-V01'});
  return createPurchaseWeb({stateDirectory:directory,mode:'LOCAL_TEST_ONLY',ports:{
    calculatePreview:()=>({candidateCount:1,contextId:report.contextId,dataFingerprint:report.provenance.dataFingerprint,eligibility:report.eligibility}),
    generateReport:()=>report
  },...options});
}

async function createTestPurchase(service,actor) {
  const draft=await service.review(actor,structuredClone(SERVER_REQUEST_LITERAL_BASE));
  await service.confirm(actor,draft.reviewId);
  const order=await service.createOrder(actor,{reviewId:draft.reviewId,idempotencyKey:'recovery-test',mode:'TEST'});
  await service.command(actor,order.id,'CHECKOUT');
  return order.id;
}

async function child(directory,scenario) {
  let control,target;
  async function stopAtBarrier() {
    // Parent terminates this real process without allowing finally blocks to run.
    process.send({status:'BARRIER',scenario,control,target});
    await new Promise(()=>{});
  }
  const app=await openRecoveryApp(directory,{faults:async phase=>{
    if(!target)return;
    if(scenario==='refund-before-link'&&phase==='AFTER_STORE'){
      await app.service.command(actors.target,target,'REQUEST_REFUND');
    }
    if(scenario==='cancel-before-store'&&phase==='BEFORE_STORE'){
      await app.service.command(actors.target,target,'CANCEL');
    }
    if((scenario==='refund-before-link'||scenario==='cancel-before-store'||scenario==='delete-before-unlink')&&phase==='AFTER_REVOCATION')await stopAtBarrier();
    if(scenario==='crash-before-publish'&&phase==='REPORT_TEMP_SYNCED')await stopAtBarrier();
    if(scenario==='crash-before-link'&&phase==='AFTER_STORE')await stopAtBarrier();
  }});
  // Keep the process alive at an injected I/O barrier. The parent owns its PID.
  await app.listen(0);
  control=await createTestPurchase(app.service,actors.control);
  await app.service.simulate(actors.control,control,'APPROVE');
  await app.service.drain();
  target=await createTestPurchase(app.service,actors.target);
  await app.service.simulate(actors.target,target,'APPROVE');
  await app.service.drain();
  if(scenario==='delete-before-unlink')await app.service.deleteReport(actors.target,target);
}

if(process.argv[1]&&pathToFileURL(resolve(process.argv[1])).href===import.meta.url) {
  child(process.argv[2],process.argv[3]).catch(()=>{
    process.send({status:'CHILD_SETUP_FAILED'},()=>process.exit(1));
  });
}
