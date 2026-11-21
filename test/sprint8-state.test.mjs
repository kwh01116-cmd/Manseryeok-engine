import test from 'node:test';
import assert from 'node:assert/strict';
import {LIVE_SALE_GATES,TEST_PRODUCT,assertLiveSaleAllowed,createTestOrder,validateTestOrder,transitionOrder,applyVerifiedPaymentEvent,paymentEventDigest,MAX_PROVIDER_EVENTS} from '../dist/purchase/orderStateV1.js';
import {createFakePaymentProvider,FAKE_PROVIDER_ID} from '../scripts/purchase/fake-payment.mjs';

const AT='2026-11-22T01:00:00.000Z';
const input=()=>({id:'test-order-one',actorRef:'guest-synthetic-one',inputRef:'encrypted-input-one',idempotencyKey:'purchase-one',createdAt:AT});
const key=()=>Buffer.alloc(32,0x47);
const provider=()=>createFakePaymentProvider({signingKey:key(),now:()=>new Date(AT)});
const step=(o,type,extra={})=>transitionOrder(o,{type,...extra},AT);
const event=(o,type='PAYMENT_APPROVED',eventId='evt-one',extra={})=>({schemaVersion:'saju-fake-payment-event-v1',eventId,providerRef:o.providerRef,orderId:o.id,actorRef:o.actorRef,productId:TEST_PRODUCT.id,amount:100,currency:'KRW',type,issuedAt:AT,...extra});
const paid=()=>{const p=provider(),o=step(createTestOrder(input()),'CHECKOUT');return applyVerifiedPaymentEvent(o,p.verifyEvent(p.createEvent(o,'PAYMENT_APPROVED',{eventId:'payment-one'})),AT);};
const completed=()=>step(step(step(step(paid(),'QUEUE'),'START_GENERATION'),'START_VALIDATION'),'COMPLETE',{reportRef:'encrypted-report-one'});
const error=(fn,code)=>assert.throws(fn,{code});

test('Sprint8 live gates are hard false and fixture price is never a sale price',()=>{
  assert.deepEqual(LIVE_SALE_GATES,{CONTENT_APPROVED:false,PAYMENT_INTEGRATION_APPROVED:false,LEGAL_OPERATIONAL_APPROVED:false,PUBLIC_LAUNCH_APPROVED:false});
  assert.ok(Object.isFrozen(LIVE_SALE_GATES));assert.equal(TEST_PRODUCT.priceKind,'FIXTURE_NOT_SALE_PRICE');assert.equal(TEST_PRODUCT.amount,100);
  const before=process.env.CONTENT_APPROVED;process.env.CONTENT_APPROVED='true';
  try{error(()=>assertLiveSaleAllowed(), 'LIVE_SALE_NOT_APPROVED');}finally{if(before===undefined)delete process.env.CONTENT_APPROVED;else process.env.CONTENT_APPROVED=before;}
  assert.throws(()=>{LIVE_SALE_GATES.CONTENT_APPROVED=true;},TypeError);
});

test('independent payment and generation states require verified approval, validation and explicit report reference',()=>{
  let o=createTestOrder(input());assert.equal(o.orderStatus,'READY_FOR_TEST_CHECKOUT');assert.equal(o.paymentStatus,'NOT_STARTED');assert.equal(o.generationStatus,'NOT_STARTED');assert.equal(o.refundStatus,'NOT_REQUESTED');
  error(()=>step(o,'QUEUE'),'ORDER_NOT_ACTIVE');error(()=>step(o,'START_GENERATION'),'ORDER_NOT_ACTIVE');
  o=step(o,'CHECKOUT');assert.equal(o.paymentStatus,'PENDING');error(()=>step(o,'COMPLETE',{reportRef:'fake'}),'ORDER_NOT_ACTIVE');
  const p=provider(),approved=p.verifyEvent(p.createEvent(o,'PAYMENT_APPROVED'));
  o=applyVerifiedPaymentEvent(o,approved,AT);assert.equal(o.orderStatus,'PAYMENT_VERIFIED');assert.equal(o.generationStatus,'NOT_STARTED');assert.equal(o.accessStatus,'LOCKED');
  o=step(o,'QUEUE');error(()=>step(o,'COMPLETE',{reportRef:'fake'}),'ORDER_COMPLETE_TRANSITION');o=step(o,'START_GENERATION');assert.equal(o.generationAttempts,1);
  o=step(o,'START_VALIDATION');o=step(o,'COMPLETE',{reportRef:'saved-reference'});assert.equal(o.generationStatus,'COMPLETED');assert.equal(o.accessStatus,'AVAILABLE');assert.equal(o.reportRef,'saved-reference');
  error(()=>step(o,'QUEUE'),'ORDER_QUEUE_TRANSITION');error(()=>step(o,'START_GENERATION'),'ORDER_GENERATION_TRANSITION');assert.equal(validateTestOrder(o),true);
});

test('signed fake events bind exact order, actor, fixture amount, currency, product and provider',()=>{
  const p=provider(),o=step(createTestOrder(input()),'CHECKOUT'),envelope=p.createEvent(o,'PAYMENT_APPROVED');
  assert.equal(envelope.provider,FAKE_PROVIDER_ID);assert.equal(p.verifyEvent(envelope).orderId,o.id);
  for(const patch of [{orderId:'other'},{actorRef:'other'},{amount:101},{currency:'USD'},{productId:'other'},{providerRef:'other'}]){
    const changed=structuredClone(envelope);Object.assign(changed.payload,patch);assert.throws(()=>p.verifyEvent(changed));
    assert.throws(()=>applyVerifiedPaymentEvent(o,{...event(o),...patch},AT));
  }
  const wrong=structuredClone(envelope);wrong.signature='0'.repeat(64);error(()=>p.verifyEvent(wrong),'FAKE_SIGNATURE_INVALID');
  const another=createFakePaymentProvider({signingKey:Buffer.alloc(32,0x48),now:()=>new Date(AT)});error(()=>another.verifyEvent(envelope),'FAKE_SIGNATURE_INVALID');
});

test('duplicate verified event is idempotent and conflicting same ID is rejected independent of property order',()=>{
  const o=step(createTestOrder(input()),'CHECKOUT'),e=event(o),one=applyVerifiedPaymentEvent(o,e,AT),two=applyVerifiedPaymentEvent(one,structuredClone(e),AT);
  assert.deepEqual(two,one);assert.equal(two.eventReceipts.length,1);assert.equal(two.transitionHistory.length,one.transitionHistory.length);
  const reordered=Object.fromEntries(Object.entries(e).reverse());assert.equal(paymentEventDigest(reordered),paymentEventDigest(e));assert.deepEqual(applyVerifiedPaymentEvent(one,reordered,AT),one);
  error(()=>applyVerifiedPaymentEvent(one,{...e,type:'PAYMENT_FAILED'},AT),'PAYMENT_EVENT_CONFLICT');
  const resent=applyVerifiedPaymentEvent(one,{...e,eventId:'redelivery-new-id'},AT);assert.equal(resent.paymentStatus,'APPROVED');assert.equal(resent.generationStatus,'NOT_STARTED');assert.equal(resent.eventReceipts.length,2);
});

test('delayed approval after local cancellation preserves cancellation and requires refund without generation',()=>{
  const o=step(createTestOrder(input()),'CHECKOUT'),cancelled=step(o,'CANCEL');
  assert.equal(cancelled.paymentStatus,'CANCELLED');assert.equal(cancelled.orderStatus,'CANCELLED');
  const late=applyVerifiedPaymentEvent(cancelled,event(o),AT);assert.equal(late.paymentStatus,'APPROVED');assert.equal(late.orderStatus,'CANCELLED');assert.equal(late.refundStatus,'REQUESTED');assert.equal(late.accessStatus,'REVOKED');assert.equal(late.generationStatus,'NOT_STARTED');
  error(()=>step(late,'QUEUE'),'ORDER_NOT_ACTIVE');
});

test('payment failure can retry checkout; late failure never reverses approved payment',()=>{
  let o=step(createTestOrder(input()),'CHECKOUT');o=applyVerifiedPaymentEvent(o,event(o,'PAYMENT_FAILED','fail-one'),AT);
  assert.equal(o.orderStatus,'READY_FOR_TEST_CHECKOUT');assert.equal(o.paymentStatus,'FAILED');o=step(o,'CHECKOUT');o=applyVerifiedPaymentEvent(o,event(o,'PAYMENT_APPROVED','approve-two'),AT);
  o=applyVerifiedPaymentEvent(o,event(o,'PAYMENT_FAILED','late-fail'),AT);assert.equal(o.paymentStatus,'APPROVED');assert.equal(o.orderStatus,'PAYMENT_VERIFIED');
  error(()=>applyVerifiedPaymentEvent(createTestOrder(input()),event(o),AT),'PAYMENT_NOT_REQUESTED');
});

test('generation failure and interrupted worker recovery are bounded and never unlock unvalidated reports',()=>{
  let o=step(paid(),'QUEUE');o=step(o,'START_GENERATION');o=step(o,'FAIL_RETRYABLE',{code:'STORAGE_TEMPORARY'});assert.equal(o.generationStatus,'FAILED_RETRYABLE');assert.equal(o.accessStatus,'LOCKED');
  o=step(o,'RETRY');o=step(o,'START_GENERATION');o=step(o,'RECOVER_INTERRUPTED');assert.equal(o.generationStatus,'QUEUED');assert.equal(o.errorCode,'WORKER_INTERRUPTED');assert.equal(o.generationAttempts,2);
  o=step(o,'START_GENERATION');o=step(o,'START_VALIDATION');o=step(o,'RECOVER_INTERRUPTED');assert.equal(o.generationStatus,'FAILED_FINAL');assert.equal(o.generationAttempts,3);
  error(()=>step(o,'RETRY'),'ORDER_RETRY_TRANSITION');error(()=>step(o,'START_GENERATION'),'ORDER_GENERATION_TRANSITION');
  const finalized=step(step(paid(),'QUEUE'),'FAIL_FINAL',{code:'CLAIM_VALIDATION_FAILED'});assert.equal(finalized.generationStatus,'FAILED_FINAL');
});

test('refund request revokes access and stops queued or running jobs without inventing legal approval',()=>{
  for(const initial of [paid(),step(paid(),'QUEUE'),step(step(paid(),'QUEUE'),'START_GENERATION'),completed()]){
    const requested=step(initial,'REQUEST_REFUND');assert.equal(requested.refundStatus,'REQUESTED');assert.equal(requested.accessStatus,'REVOKED');
    assert.equal(step(requested,'REQUEST_REFUND').refundStatus,'REQUESTED');error(()=>step(requested,'QUEUE'),'ORDER_NOT_ACTIVE');
    if(['QUEUED','GENERATING'].includes(initial.generationStatus))assert.equal(requested.generationStatus,'FAILED_FINAL');
  }
  error(()=>step(createTestOrder(input()),'REQUEST_REFUND'),'ORDER_REFUND_PAYMENT_REQUIRED');
});

test('refund failure retries, duplicate success is safe and late approval cannot restore refunded access',()=>{
  let o=step(completed(),'REQUEST_REFUND');error(()=>applyVerifiedPaymentEvent(o,event(o,'REFUND_APPROVED','too-early'),AT),'REFUND_NOT_REQUESTED');
  o=step(o,'BEGIN_REFUND');o=applyVerifiedPaymentEvent(o,event(o,'REFUND_FAILED','rf-failed'),AT);assert.equal(o.refundStatus,'REFUND_FAILED');assert.equal(o.accessStatus,'REVOKED');
  o=step(o,'BEGIN_REFUND');const approved=event(o,'REFUND_APPROVED','rf-success');o=applyVerifiedPaymentEvent(o,approved,AT);assert.equal(o.refundStatus,'REFUNDED');assert.equal(o.orderStatus,'CANCELLED');assert.equal(o.generationStatus,'COMPLETED');
  assert.deepEqual(applyVerifiedPaymentEvent(o,approved,AT),o);error(()=>step(o,'BEGIN_REFUND'),'ORDER_REFUND_TRANSITION');error(()=>step(o,'REQUEST_REFUND'),'ORDER_ALREADY_REFUNDED');
  o=applyVerifiedPaymentEvent(o,event(o,'PAYMENT_APPROVED','old-approval-retransmit'),AT);assert.equal(o.refundStatus,'REFUNDED');assert.equal(o.accessStatus,'REVOKED');
  o=applyVerifiedPaymentEvent(o,event(o,'REFUND_FAILED','late-refund-failure'),AT);assert.equal(o.refundStatus,'REFUNDED');
});

test('checkout, cancellation and refund browser retries do not mint new state-machine attempts',()=>{
  const pending=step(createTestOrder(input()),'CHECKOUT');assert.deepEqual(step(pending,'CHECKOUT'),pending);
  const cancelled=step(pending,'CANCEL');assert.deepEqual(step(cancelled,'CANCEL'),cancelled);
  const requested=step(paid(),'REQUEST_REFUND');assert.deepEqual(step(requested,'REQUEST_REFUND'),requested);
  const refund=step(requested,'BEGIN_REFUND');assert.deepEqual(step(refund,'BEGIN_REFUND'),refund);assert.deepEqual(step(refund,'REQUEST_REFUND'),refund);
  assert.equal(refund.transitionHistory.filter(x=>x.event==='BEGIN_REFUND').length,1);
});

test('order inputs and histories reject sparse/getter/extra fields and state tampering; originals stay untouched',()=>{
  const i=input(),o=createTestOrder(i),before=structuredClone(o),pending=step(o,'CHECKOUT');assert.deepEqual(o,before);assert.equal(Object.isFrozen(o.transitionHistory[0]),true);assert.equal(Object.isFrozen(i),false);
  const extra={...i,amount:1};error(()=>createTestOrder(extra),'ORDER_FIELDS');
  const sparse=structuredClone(pending);sparse.eventReceipts.length=1;error(()=>validateTestOrder(sparse),'ORDER_ARRAY');
  const disguised=structuredClone(pending);disguised.eventReceipts.length=1;disguised.eventReceipts.extra='fill';error(()=>validateTestOrder(disguised),'ORDER_ARRAY');
  const changed=structuredClone(pending);changed.accessStatus='AVAILABLE';error(()=>validateTestOrder(changed),'ORDER_ACCESS_INVARIANT');
  const getter={...i};Object.defineProperty(getter,'id',{enumerable:true,get(){throw new Error('must not execute');}});error(()=>createTestOrder(getter),'ORDER_JSON');
  error(()=>transitionOrder(pending,{type:'CHECKOUT',amount:1},AT),'ORDER_FIELDS');error(()=>transitionOrder(pending,{type:'FAKE_COMMAND'},AT),'ORDER_COMMAND');
});

test('fake provider accepts only fixed signed envelopes, closes its own key copy and permits delayed delivery',()=>{
  const k=key(),p=createFakePaymentProvider({signingKey:k,now:()=>new Date(AT)}),o=step(createTestOrder(input()),'CHECKOUT'),e=p.createEvent(o,'PAYMENT_APPROVED');
  assert.throws(()=>p.verifyEvent({...e,debug:true}));assert.throws(()=>p.verifyEvent({...e,payload:{...e.payload,debug:true}}));
  const got=p.verifyEvent(e);assert.ok(Object.isFrozen(got));p.close();assert.deepEqual(k,key());error(()=>p.verifyEvent(e),'FAKE_PROVIDER_CLOSED');error(()=>p.createEvent(o,'PAYMENT_APPROVED'),'FAKE_PROVIDER_CLOSED');
  assert.throws(()=>createFakePaymentProvider({signingKey:Buffer.alloc(31)}));
});

test('event receipt ceiling rejects excess events rather than dropping old replay protection',()=>{
  let o=step(createTestOrder(input()),'CHECKOUT');
  for(let i=0;i<MAX_PROVIDER_EVENTS;i++)o=applyVerifiedPaymentEvent(o,event(o,'PAYMENT_APPROVED',`evt-${i}`),AT);
  assert.equal(o.eventReceipts.length,128);error(()=>applyVerifiedPaymentEvent(o,event(o,'PAYMENT_APPROVED','overflow'),AT),'PAYMENT_EVENT_LIMIT');
  assert.equal(applyVerifiedPaymentEvent(o,event(o,'PAYMENT_APPROVED','evt-0'),AT).eventReceipts.length,128);
});
