/** Local TEST purchase orchestration. Calendar and interpretation remain existing engines. */
import {randomUUID,createHash} from 'node:crypto';
import {LIVE_SALE_GATES,TEST_PRODUCT,assertLiveSaleAllowed,createTestOrder,transitionOrder,applyVerifiedPaymentEvent} from '../../dist/purchase/orderStateV1.js';
import {validateApiOnlyServerRequest,loadApiOnlyServerEngine} from '../server/engine.mjs';
import {analyzeConsumerReport,projectServerReport} from '../product/consumer-report.mjs';
import {createInterpretedReportService} from '../product/interpreted-report.mjs';
import {INTERPRETATION_PROFILE_ID,INTERPRETATION_VERSION,INTERPRETATION_RESOLVER_VERSION,canonicalInterpretation,contextsFromProjection,resolveSymbolicInterpretation} from '../../dist/report/interpretationPolicyV1.js';
import {buildReportSections} from '../../dist/report/consumerReportV1.js';
import {validateInterpretedReport,interpretedReportVersions,buildInterpretedSections,renderInterpretedReport,NARRATIVE_GENERATOR_VERSION,NARRATIVE_ARTIFACT_VERSION} from '../../dist/report/narrativePipelineV1.js';

export class PurchaseError extends Error {constructor(code,status=409){super(code);this.code=code;this.status=status;}}
const check=(ok,code,status)=>{if(!ok)throw new PurchaseError(code,status);};
export function exact(value,keys){check(value&&typeof value==='object'&&!Array.isArray(value)&&Object.keys(value).every(k=>keys.includes(k)),'INVALID_REQUEST',422);}
const clone=value=>structuredClone(value);
const identity=value=>typeof value==='string'&&/^[a-zA-Z0-9_-]{1,128}$/.test(value);
const stamp=now=>now().toISOString();
const VERSION_PIN=Object.freeze({profileId:INTERPRETATION_PROFILE_ID,policyVersion:INTERPRETATION_VERSION,resolver:INTERPRETATION_RESOLVER_VERSION,generator:NARRATIVE_GENERATOR_VERSION,artifact:NARRATIVE_ARTIFACT_VERSION});
function charts(projection){return projection.candidates.map(c=>{const node=key=>projection.evidence.find(x=>x.id===c.refs[key])?.value;return {ordinal:c.ordinal,pillars:node('chart').pillars,day:node('day'),pattern:node('pattern')};});}
export function createEnginePorts(engine){
 const generation=createInterpretedReportService(engine,{profileId:INTERPRETATION_PROFILE_ID});
 return {
  calculatePreview(request){const result=engine.calculate(request),base=analyzeConsumerReport(result,{request,profileId:'SAJU-CONSUMER-EVIDENCE-REPORT-V01'}),p=projectServerReport(result,{request});
   // Assess available symbolic domains without composing/storing a full S7 report.
   const contexts=contextsFromProjection(p),claims=contexts.flatMap(c=>resolveSymbolicInterpretation(c,{profileId:INTERPRETATION_PROFILE_ID}));
   const eligibility=clone(base.eligibility);eligibility.interpretationDomains=claims.map(c=>({candidateRef:c.chartCandidateRef,domain:c.domain,status:c.confidenceOrApplicabilityStatus}));
   eligibility.chapters=eligibility.chapters.map(c=>c.chapter===3?{...c,status:claims.some(x=>x.domain==='BEHAVIOR'&&x.confidenceOrApplicabilityStatus==='LIMITED')?'LIMITED':'HOLD'}:c.chapter===4?{...c,status:claims.some(x=>x.domain!=='BEHAVIOR'&&x.confidenceOrApplicabilityStatus==='LIMITED')?'LIMITED':'HOLD'}:c.chapter===6?{...c,status:'POLICY_UNRESOLVED'}:c);
   eligibility.reasons=eligibility.reasons.filter(r=>r!=='PERSONAL_TRAIT_AND_TOPIC_CHAPTERS_HAVE_NO_ACCEPTED_POLICY');eligibility.reasons.push('SPRINT7_SYMBOLIC_DOMAINS_ARE_LIMITED_NOT_FULL_PAID_CONTENT','FINAL_SUMMARY_REQUIRES_GENERATION_VALIDATION');
   return {calculationStatus:p.calculationStatus,candidateCount:p.candidates.length,contextId:base.contextId,
    dataFingerprint:p.provenance.dataFingerprint,preview:{opening:base.interpretationClaims.filter(x=>['lead','input-hold'].includes(x.templateId)).map(x=>x.text),candidates:charts(p),sections:buildReportSections(base,{audience:'preview'})},eligibility};},
  generateReport:request=>generation.calculate(request),
 };
}
export async function loadPurchaseEnginePorts(dataDirectory){return createEnginePorts(await loadApiOnlyServerEngine({dataDirectory}));}

export async function createPurchaseService({vault,reportStore,provider,calculatePreview,generateReport,now=()=>new Date(),faults=async()=>{},autoRun=true}){
 let closed=false,active=null,wakeup=false;
 const own=(s,id,actor)=>{const o=s.orders[id];check(o&&o.actorRef===actor,'ORDER_NOT_FOUND',404);return o;};
 const draft=(s,id,actor)=>{const d=s.drafts[id];check(d&&d.actorId===actor,'REVIEW_NOT_FOUND',404);check(Date.parse(d.expiresAt)>now().getTime(),'REVIEW_EXPIRED',410);return d;};
 const dto=o=>({id:o.id,mode:'TEST',orderStatus:o.orderStatus,paymentStatus:o.paymentStatus,generationStatus:o.generationStatus,refundStatus:o.refundStatus,accessStatus:o.accessStatus,reportAvailable:o.generationStatus==='COMPLETED'&&o.accessStatus==='AVAILABLE',canRetry:o.generationStatus==='FAILED_RETRYABLE'&&o.refundStatus==='NOT_REQUESTED',errorCode:o.errorCode,createdAt:o.createdAt,updatedAt:o.updatedAt,history:clone(o.transitionHistory)});
 const change=(s,id,actor,event)=>{const o=transitionOrder(own(s,id,actor),event,stamp(now));s.orders[id]=o;return dto(o);};
 const dispatch=()=>{if(closed||!autoRun)return;if(active){wakeup=true;return;}active=new Promise(resolve=>setImmediate(resolve)).then(async()=>{
  while(!closed){const s=await vault.read(),next=Object.values(s.orders).find(o=>o.generationStatus==='QUEUED'&&o.paymentStatus==='APPROVED'&&o.refundStatus==='NOT_REQUESTED');if(!next)break;await runJob(next.id,next.actorRef);}
 }).finally(()=>{active=null;if(wakeup&&!closed){wakeup=false;dispatch();}});active.catch(()=>{});};
 async function runJob(id,actor){
  let phase='GENERATE',savedRef=null;try{
   const input=await vault.mutate(s=>{const o=own(s,id,actor);if(o.generationStatus!=='QUEUED'||o.refundStatus!=='NOT_REQUESTED')return null;
    const d=s.drafts[o.inputRef];check(d&&d.actorId===actor,'INPUT_MISSING',422);change(s,id,actor,{type:'START_GENERATION'});return clone(d);});if(!input)return;
   phase='VALIDATE';check(canonicalInterpretation(input.versionPin)===canonicalInterpretation(VERSION_PIN),'GENERATION_VERSION_OR_CONTEXT_CONFLICT',422);
   phase='GENERATE';await faults('AFTER_START',id);const report=await generateReport(input.request);phase='VALIDATE';
   await vault.mutate(s=>{change(s,id,actor,{type:'START_VALIDATION'});});
   validateInterpretedReport(report);check(report.contextId===input.contextId&&report.provenance.dataFingerprint===input.dataFingerprint,'GENERATION_VERSION_OR_CONTEXT_CONFLICT',422);
   check(!['NOT_PROVIDABLE','NEEDS_ADDITIONAL_INFORMATION'].includes(report.eligibility.status),'REPORT_NOT_PROVIDABLE',422);
   await faults('BEFORE_STORE',id);phase='STORE';
   if(own(await vault.read(),id,actor).refundStatus!=='NOT_REQUESTED')return;
   const versions=interpretedReportVersions(report),expiresAt=new Date(Date.parse(input.createdAt)+7*86400000).toISOString();
   const saved=await reportStore.put({actorId:actor,idempotencyKey:'s8-'+id,report,versions,expiresAt});savedRef=saved.recordId;
   await faults('AFTER_STORE',id);phase='COMMIT';
   const committed=await vault.mutate(s=>{const o=own(s,id,actor);if(o.refundStatus!=='NOT_REQUESTED'||o.orderStatus==='CANCELLED')return false;change(s,id,actor,{type:'COMPLETE',reportRef:saved.recordId});return true;});
   if(!committed)await reportStore.remove({actorId:actor,recordId:saved.recordId});
  }catch(error){
   if(savedRef){const current=(await vault.read()).orders[id];if(current&&current.refundStatus!=='NOT_REQUESTED')await reportStore.remove({actorId:actor,recordId:savedRef});}
   const permanent=phase==='VALIDATE'||error instanceof RangeError||['INPUT_MISSING','GENERATION_VERSION_OR_CONTEXT_CONFLICT','REPORT_NOT_PROVIDABLE'].includes(error.code);
   await vault.mutate(s=>{const o=s.orders[id];if(!o||!['QUEUED','GENERATING','VALIDATING'].includes(o.generationStatus))return;
    const terminal=permanent||o.generationAttempts>=3;change(s,id,actor,{type:terminal?'FAIL_FINAL':'FAIL_RETRYABLE',code:permanent?'CLAIM_OR_POLICY_VALIDATION_FAILED':phase==='STORE'?'RESULT_STORAGE_FAILED':'GENERATION_INTERRUPTED'});}).catch(()=>{});
  }
 }
 // Exclusive vault ownership makes interrupted work from the previous process safe to requeue.
 await vault.mutate(s=>{for(const o of Object.values(s.orders)){if(['GENERATING','VALIDATING'].includes(o.generationStatus))s.orders[o.id]=transitionOrder(o,{type:'RECOVER_INTERRUPTED'},stamp(now));}});
 dispatch();
 return Object.freeze({
  gates:LIVE_SALE_GATES,product:TEST_PRODUCT,
  async review(actor,request){check(identity(actor),'SESSION_REQUIRED',401);validateApiOnlyServerRequest(request);const p=calculatePreview(request),id=randomUUID(),createdAt=stamp(now),expiresAt=new Date(now().getTime()+86400000).toISOString();
   const result={...p,reviewId:id,input:clone(request),expiresAt,canTestCheckout:p.candidateCount>0&&!['NOT_PROVIDABLE','NEEDS_ADDITIONAL_INFORMATION'].includes(p.eligibility.status)};
   await vault.mutate(s=>{check(Object.values(s.drafts).filter(d=>d.actorId===actor).length<50,'REVIEW_LIMIT',429);s.drafts[id]={...p,reviewId:id,expiresAt,canTestCheckout:result.canTestCheckout,actorId:actor,request:clone(request),versionPin:VERSION_PIN,confirmed:false,createdAt};});return result;},
  async confirm(actor,id){return vault.mutate(s=>{const d=draft(s,id,actor);d.confirmed=true;return {reviewId:id,confirmed:true};});},
  async createOrder(actor,input){exact(input,['reviewId','idempotencyKey','mode']);if(input.mode!=='TEST')assertLiveSaleAllowed();check(identity(input.idempotencyKey),'IDEMPOTENCY_KEY_REQUIRED',422);
   return vault.mutate(s=>{const d=draft(s,input.reviewId,actor);check(d.confirmed,'INPUT_CONFIRMATION_REQUIRED',409);check(d.canTestCheckout,'ELIGIBILITY_BLOCKED',422);
    const previous=Object.values(s.orders).find(o=>o.actorRef===actor&&o.idempotencyKey===input.idempotencyKey);if(previous){check(previous.inputRef===d.reviewId,'IDEMPOTENCY_CONFLICT',409);return dto(previous);}
    check(Object.values(s.orders).filter(o=>o.actorRef===actor).length<100,'ORDER_LIMIT',429);const o=createTestOrder({id:randomUUID(),actorRef:actor,inputRef:d.reviewId,idempotencyKey:input.idempotencyKey,createdAt:stamp(now)});s.orders[o.id]=o;return dto(o);});},
  async list(actor){return {orders:Object.values((await vault.read()).orders).filter(o=>o.actorRef===actor).map(dto)};},
  async get(actor,id){return dto(own(await vault.read(),id,actor));},
  async command(actor,id,type){const value=await vault.mutate(s=>change(s,id,actor,{type}));dispatch();return value;},
  async receive(envelope){const event=provider.verifyEvent(envelope);const value=await vault.mutate(s=>{const o=s.orders[event.orderId];check(o,'ORDER_NOT_FOUND',404);let next=applyVerifiedPaymentEvent(o,event,stamp(now));if(next.paymentStatus==='APPROVED'&&next.generationStatus==='NOT_STARTED'&&next.refundStatus==='NOT_REQUESTED'&&next.orderStatus!=='CANCELLED')next=transitionOrder(next,{type:'QUEUE'},stamp(now));s.orders[o.id]=next;return dto(next);});dispatch();return value;},
  async simulate(actor,id,action){check(['APPROVE','FAIL','CANCEL','DELAY','REPLAY','BAD_SIGNATURE','REFUND_APPROVE','REFUND_FAIL'].includes(action),'INVALID_SIMULATION',422);
   const o=own(await vault.read(),id,actor);if(action==='DELAY')return dto(o);
   const type={APPROVE:'PAYMENT_APPROVED',FAIL:'PAYMENT_FAILED',CANCEL:'PAYMENT_CANCELLED',REFUND_APPROVE:'REFUND_APPROVED',REFUND_FAIL:'REFUND_FAILED',REPLAY:'PAYMENT_APPROVED',BAD_SIGNATURE:'PAYMENT_APPROVED'}[action];
   // Stable event IDs make browser retries the same provider delivery, not a new charge.
   if(action==='REPLAY'){
    const previous=Object.values((await vault.read()).events).filter(e=>e.payload.orderId===id&&e.payload.type==='PAYMENT_APPROVED').at(-1);
    check(previous,'NO_EVENT_TO_REPLAY',409);return this.receive(previous);
   }
   const attempt=o.transitionHistory.filter(x=>x.event===(type.startsWith('REFUND_')?'BEGIN_REFUND':'CHECKOUT')).length;
   const eventId=createHash('sha256').update(id+':'+type+':'+attempt).digest('hex');
   const envelope=await vault.mutate(s=>{if(!s.events[eventId])s.events[eventId]=provider.createEvent(o,type,{eventId});return s.events[eventId];});
   if(action==='BAD_SIGNATURE')envelope.signature='0'.repeat(64);
   return this.receive(envelope);},
  async report(actor,id){const o=own(await vault.read(),id,actor);check(o.accessStatus==='AVAILABLE'&&o.generationStatus==='COMPLETED'&&o.refundStatus==='NOT_REQUESTED','REPORT_ACCESS_UNAVAILABLE',403);
   const stored=await reportStore.get({actorId:actor,recordId:o.reportRef});check(stored.status==='FOUND',stored.status==='EXPIRED'?'REPORT_EXPIRED':'REPORT_NOT_FOUND',stored.status==='EXPIRED'?410:404);
   const r=stored.report;validateInterpretedReport(r);const view={schemaVersion:'saju-purchase-report-view-v1',reportProfile:r.profile,sections:buildInterpretedSections(r),opening:r.opening.map(b=>b.text),candidates:charts(r.basis.projection),domainAssessments:r.domainAssessments,versions:stored.versions,eligibility:r.eligibility,text:renderInterpretedReport(r),claims:r.interpretationClaims};
   const current=own(await vault.read(),id,actor);check(current.accessStatus==='AVAILABLE'&&current.refundStatus==='NOT_REQUESTED'&&current.reportRef===o.reportRef,'REPORT_ACCESS_UNAVAILABLE',403);return view;},
  async deleteReport(actor,id){const ref=await vault.mutate(s=>{const o=own(s,id,actor);check(o.reportRef,'REPORT_NOT_FOUND',404);o.accessStatus='REVOKED';o.updatedAt=stamp(now);return o.reportRef;});await reportStore.remove({actorId:actor,recordId:ref});return {status:'DELETED'};},
  async drain(){dispatch();if(active)await active;},
  async close(){closed=true;if(active)await active;},
 });
}
