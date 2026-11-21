import {createHash} from "node:crypto";

/** Local test commerce only. Nothing in request data or environment can approve a sale. */
export const LIVE_SALE_GATES=Object.freeze({CONTENT_APPROVED:false,PAYMENT_INTEGRATION_APPROVED:false,LEGAL_OPERATIONAL_APPROVED:false,PUBLIC_LAUNCH_APPROVED:false});
export const TEST_PRODUCT=Object.freeze({id:"SAJU-REPORT-TEST-V01",amount:100,currency:"KRW",priceKind:"FIXTURE_NOT_SALE_PRICE"});
export const ORDER_STATE_SCHEMA="saju-local-test-order-v1" as const;
export const ORDER_STATE_VERSION="0.1.0" as const;
export const MAX_GENERATION_ATTEMPTS=3;
export const MAX_PROVIDER_EVENTS=128;
const fail=(code:string):never=>{throw Object.assign(new Error(code),{code});};
const check=(ok:unknown,code:string):void=>{if(!ok)fail(code);};
const text=(v:unknown,max=160):v is string=>typeof v==="string"&&v.length>0&&v.length<=max&&!/[\u0000-\u001f]/u.test(v);
const instant=(v:unknown):v is string=>typeof v==="string"&&/^\d{4}-\d\d-\d\dT\d\d:\d\d:\d\d\.\d{3}Z$/u.test(v)&&Number.isFinite(Date.parse(v))&&new Date(v).toISOString()===v;
const code=(v:unknown):v is string=>typeof v==="string"&&/^[A-Z][A-Z0-9_]{1,95}$/u.test(v);
const dense=(v:unknown):v is unknown[]=>Array.isArray(v)&&Object.keys(v).length===v.length&&Array.from({length:v.length},(_,i)=>Object.hasOwn(v,i)).every(Boolean);
function plain(value:unknown):void {
  if(value===null||typeof value==="string"||typeof value==="boolean")return;
  if(typeof value==="number"){check(Number.isFinite(value),"ORDER_JSON");return;}
  if(value===null||typeof value!=="object")return fail("ORDER_JSON");
  check(Object.getOwnPropertySymbols(value).length===0,"ORDER_JSON");
  for(const d of Object.values(Object.getOwnPropertyDescriptors(value)))check(Object.hasOwn(d,"value"),"ORDER_JSON");
  if(Array.isArray(value)){check(dense(value),"ORDER_ARRAY");for(const v of value)plain(v);return;}
  check(Object.getPrototypeOf(value)===Object.prototype||Object.getPrototypeOf(value)===null,"ORDER_JSON");
  for(const v of Object.values(value))plain(v);
}
function fields(value:object,keys:string[]):void {check(Object.keys(value).sort().join("|")===keys.sort().join("|"),"ORDER_FIELDS");}
function freeze<T>(value:T):T {if(value&&typeof value==="object"){for(const v of Object.values(value))freeze(v);Object.freeze(value);}return value;}
export function assertLiveSaleAllowed():never {return fail("LIVE_SALE_NOT_APPROVED");}

export type OrderStatus="CREATED"|"READY_FOR_TEST_CHECKOUT"|"PAYMENT_PENDING"|"PAYMENT_VERIFIED"|"CANCELLED";
export type PaymentStatus="NOT_STARTED"|"PENDING"|"APPROVED"|"FAILED"|"CANCELLED";
export type GenerationStatus="NOT_STARTED"|"QUEUED"|"GENERATING"|"VALIDATING"|"COMPLETED"|"FAILED_RETRYABLE"|"FAILED_FINAL";
export type RefundStatus="NOT_REQUESTED"|"REQUESTED"|"UNDER_REVIEW"|"REFUND_PENDING"|"REFUNDED"|"REFUND_FAILED";
export type ProviderEventType="PAYMENT_APPROVED"|"PAYMENT_FAILED"|"PAYMENT_CANCELLED"|"REFUND_APPROVED"|"REFUND_FAILED";
export interface PaymentEvent {
  schemaVersion:"saju-fake-payment-event-v1";eventId:string;providerRef:string;orderId:string;actorRef:string;
  productId:string;amount:number;currency:string;type:ProviderEventType;issuedAt:string;
}
export interface TestOrder {
  schemaVersion:typeof ORDER_STATE_SCHEMA;version:typeof ORDER_STATE_VERSION;mode:"TEST";id:string;actorRef:string;inputRef:string;
  idempotencyKey:string;productId:string;amount:number;currency:string;providerRef:string;createdAt:string;updatedAt:string;
  orderStatus:OrderStatus;paymentStatus:PaymentStatus;generationStatus:GenerationStatus;refundStatus:RefundStatus;
  accessStatus:"LOCKED"|"AVAILABLE"|"REVOKED";generationAttempts:number;reportRef:string|null;errorCode:string|null;
  eventReceipts:{eventId:string;digest:string}[];transitionHistory:{at:string;event:string}[];
}
export function validatePaymentEvent(event:PaymentEvent):true {
  plain(event);fields(event,["schemaVersion","eventId","providerRef","orderId","actorRef","productId","amount","currency","type","issuedAt"]);
  check(event.schemaVersion==="saju-fake-payment-event-v1"&&[event.eventId,event.providerRef,event.orderId,event.actorRef,event.productId].every(v=>text(v))&&Number.isSafeInteger(event.amount)&&event.amount>=0&&event.currency==="KRW"&&instant(event.issuedAt),"PAYMENT_EVENT_FIELDS");
  check(["PAYMENT_APPROVED","PAYMENT_FAILED","PAYMENT_CANCELLED","REFUND_APPROVED","REFUND_FAILED"].includes(event.type),"PAYMENT_EVENT_TYPE");return true;
}
export function validateTestOrder(order:TestOrder):true {
  plain(order);fields(order,["schemaVersion","version","mode","id","actorRef","inputRef","idempotencyKey","productId","amount","currency","providerRef","createdAt","updatedAt","orderStatus","paymentStatus","generationStatus","refundStatus","accessStatus","generationAttempts","reportRef","errorCode","eventReceipts","transitionHistory"]);
  check(order.schemaVersion===ORDER_STATE_SCHEMA&&order.version===ORDER_STATE_VERSION&&order.mode==="TEST","ORDER_SCHEMA");
  check([order.id,order.actorRef,order.inputRef,order.idempotencyKey,order.providerRef].every(v=>text(v))&&instant(order.createdAt)&&instant(order.updatedAt)&&Date.parse(order.updatedAt)>=Date.parse(order.createdAt),"ORDER_IDENTITY");
  check(order.productId===TEST_PRODUCT.id&&order.amount===TEST_PRODUCT.amount&&order.currency===TEST_PRODUCT.currency&&order.providerRef===`fake:${order.id}`,"ORDER_PRODUCT");
  check(["CREATED","READY_FOR_TEST_CHECKOUT","PAYMENT_PENDING","PAYMENT_VERIFIED","CANCELLED"].includes(order.orderStatus)&&["NOT_STARTED","PENDING","APPROVED","FAILED","CANCELLED"].includes(order.paymentStatus)&&["NOT_STARTED","QUEUED","GENERATING","VALIDATING","COMPLETED","FAILED_RETRYABLE","FAILED_FINAL"].includes(order.generationStatus)&&["NOT_REQUESTED","REQUESTED","UNDER_REVIEW","REFUND_PENDING","REFUNDED","REFUND_FAILED"].includes(order.refundStatus)&&["LOCKED","AVAILABLE","REVOKED"].includes(order.accessStatus),"ORDER_STATE");
  check(Number.isSafeInteger(order.generationAttempts)&&order.generationAttempts>=0&&order.generationAttempts<=MAX_GENERATION_ATTEMPTS&&(order.reportRef===null||text(order.reportRef))&&(order.errorCode===null||code(order.errorCode)),"ORDER_RESULT");
  check(dense(order.eventReceipts)&&order.eventReceipts.length<=MAX_PROVIDER_EVENTS&&new Set(order.eventReceipts.map(e=>e.eventId)).size===order.eventReceipts.length,"ORDER_RECEIPTS");
  for(const r of order.eventReceipts){fields(r,["eventId","digest"]);check(text(r.eventId)&&/^[a-f0-9]{64}$/u.test(r.digest),"ORDER_RECEIPTS");}
  check(dense(order.transitionHistory)&&order.transitionHistory.length>0&&order.transitionHistory.length<=512,"ORDER_HISTORY");
  for(const h of order.transitionHistory){fields(h,["at","event"]);check(instant(h.at)&&code(h.event),"ORDER_HISTORY");}
  check(order.generationStatus!=="COMPLETED"||order.reportRef!==null&&order.paymentStatus==="APPROVED","ORDER_COMPLETED_INVARIANT");
  check(order.accessStatus!=="AVAILABLE"||order.generationStatus==="COMPLETED"&&order.paymentStatus==="APPROVED"&&order.refundStatus==="NOT_REQUESTED"&&order.orderStatus==="PAYMENT_VERIFIED","ORDER_ACCESS_INVARIANT");
  check(order.refundStatus==="NOT_REQUESTED"||order.paymentStatus==="APPROVED"&&order.accessStatus==="REVOKED","ORDER_REFUND_INVARIANT");
  check(!["QUEUED","GENERATING","VALIDATING"].includes(order.generationStatus)||order.paymentStatus==="APPROVED"&&order.refundStatus==="NOT_REQUESTED"&&order.orderStatus==="PAYMENT_VERIFIED","ORDER_JOB_INVARIANT");
  return true;
}
export function createTestOrder(input:{id:string;actorRef:string;inputRef:string;idempotencyKey:string;createdAt:string}):TestOrder {
  plain(input);fields(input,["id","actorRef","inputRef","idempotencyKey","createdAt"]);
  const order:TestOrder={schemaVersion:ORDER_STATE_SCHEMA,version:ORDER_STATE_VERSION,mode:"TEST",...input,updatedAt:input.createdAt,productId:TEST_PRODUCT.id,amount:TEST_PRODUCT.amount,currency:TEST_PRODUCT.currency,providerRef:`fake:${input.id}`,orderStatus:"READY_FOR_TEST_CHECKOUT",paymentStatus:"NOT_STARTED",generationStatus:"NOT_STARTED",refundStatus:"NOT_REQUESTED",accessStatus:"LOCKED",generationAttempts:0,reportRef:null,errorCode:null,eventReceipts:[],transitionHistory:[{at:input.createdAt,event:"CREATED"}]};
  validateTestOrder(order);return freeze(order);
}
export type OrderCommand={type:"CHECKOUT"|"CANCEL"|"QUEUE"|"START_GENERATION"|"START_VALIDATION"|"RETRY"|"REQUEST_REFUND"|"BEGIN_REFUND"|"RECOVER_INTERRUPTED"}|{type:"COMPLETE";reportRef:string}|{type:"FAIL_RETRYABLE"|"FAIL_FINAL";code:string};
const active=(o:TestOrder):void=>check(o.orderStatus==="PAYMENT_VERIFIED"&&o.paymentStatus==="APPROVED"&&o.refundStatus==="NOT_REQUESTED","ORDER_NOT_ACTIVE");
function next(order:TestOrder,at:string,event:string):TestOrder {
  validateTestOrder(order);check(instant(at)&&Date.parse(at)>=Date.parse(order.updatedAt),"ORDER_TIME");check(order.transitionHistory.length<512,"ORDER_HISTORY_LIMIT");
  const result=structuredClone(order);result.updatedAt=at;result.transitionHistory.push({at,event});return result;
}
function final(order:TestOrder):TestOrder {validateTestOrder(order);return freeze(order);}
function stop(o:TestOrder):void {if(["QUEUED","GENERATING","VALIDATING","FAILED_RETRYABLE"].includes(o.generationStatus)){o.generationStatus="FAILED_FINAL";o.errorCode="GENERATION_CANCELLED";}o.accessStatus="REVOKED";}
export function transitionOrder(order:TestOrder,command:OrderCommand,at:string):TestOrder {
  plain(command);fields(command,command.type==="COMPLETE"?["type","reportRef"]:command.type==="FAIL_RETRYABLE"||command.type==="FAIL_FINAL"?["type","code"]:["type"]);
  validateTestOrder(order);check(instant(at)&&Date.parse(at)>=Date.parse(order.updatedAt),"ORDER_TIME");
  // Repeated browser commands must not create a new checkout/refund attempt or consume history capacity.
  if(command.type==="CHECKOUT"&&order.orderStatus==="PAYMENT_PENDING"&&order.paymentStatus==="PENDING"||
    command.type==="CANCEL"&&order.orderStatus==="CANCELLED"&&order.refundStatus!=="REFUNDED"||
    command.type==="REQUEST_REFUND"&&["REQUESTED","UNDER_REVIEW","REFUND_PENDING","REFUND_FAILED"].includes(order.refundStatus)||
    command.type==="BEGIN_REFUND"&&order.refundStatus==="REFUND_PENDING")return freeze(structuredClone(order));
  const o=next(order,at,command.type);
  switch(command.type){
    case "CHECKOUT":check(["READY_FOR_TEST_CHECKOUT","PAYMENT_PENDING"].includes(o.orderStatus)&&["NOT_STARTED","PENDING","FAILED"].includes(o.paymentStatus),"ORDER_CHECKOUT_TRANSITION");o.orderStatus="PAYMENT_PENDING";o.paymentStatus="PENDING";break;
    case "CANCEL":
      check(o.refundStatus!=="REFUNDED","ORDER_ALREADY_REFUNDED");o.orderStatus="CANCELLED";stop(o);
      if(o.paymentStatus==="APPROVED"){if(o.refundStatus==="NOT_REQUESTED")o.refundStatus="REQUESTED";}else o.paymentStatus="CANCELLED";break;
    case "QUEUE":active(o);check(o.generationStatus==="NOT_STARTED","ORDER_QUEUE_TRANSITION");o.generationStatus="QUEUED";break;
    case "START_GENERATION":active(o);check(o.generationStatus==="QUEUED"&&o.generationAttempts<MAX_GENERATION_ATTEMPTS,"ORDER_GENERATION_TRANSITION");o.generationStatus="GENERATING";o.generationAttempts++;o.errorCode=null;break;
    case "START_VALIDATION":active(o);check(o.generationStatus==="GENERATING","ORDER_VALIDATION_TRANSITION");o.generationStatus="VALIDATING";break;
    case "COMPLETE":active(o);check(o.generationStatus==="VALIDATING"&&text(command.reportRef),"ORDER_COMPLETE_TRANSITION");o.generationStatus="COMPLETED";o.reportRef=command.reportRef;o.accessStatus="AVAILABLE";o.errorCode=null;break;
    case "FAIL_RETRYABLE":case "FAIL_FINAL":
      active(o);check(["QUEUED","GENERATING","VALIDATING"].includes(o.generationStatus)&&code(command.code),"ORDER_FAILURE_TRANSITION");o.generationStatus=command.type==="FAIL_FINAL"||o.generationAttempts>=MAX_GENERATION_ATTEMPTS?"FAILED_FINAL":"FAILED_RETRYABLE";o.errorCode=command.code;o.accessStatus="LOCKED";break;
    case "RETRY":active(o);check(o.generationStatus==="FAILED_RETRYABLE"&&o.generationAttempts<MAX_GENERATION_ATTEMPTS,"ORDER_RETRY_TRANSITION");o.generationStatus="QUEUED";o.errorCode=null;break;
    case "RECOVER_INTERRUPTED":active(o);check(["GENERATING","VALIDATING"].includes(o.generationStatus),"ORDER_RECOVERY_TRANSITION");o.generationStatus=o.generationAttempts>=MAX_GENERATION_ATTEMPTS?"FAILED_FINAL":"QUEUED";o.errorCode="WORKER_INTERRUPTED";break;
    case "REQUEST_REFUND":check(o.paymentStatus==="APPROVED","ORDER_REFUND_PAYMENT_REQUIRED");check(o.refundStatus!=="REFUNDED","ORDER_ALREADY_REFUNDED");if(o.refundStatus==="NOT_REQUESTED")o.refundStatus="REQUESTED";stop(o);break;
    case "BEGIN_REFUND":check(o.paymentStatus==="APPROVED"&&["REQUESTED","UNDER_REVIEW","REFUND_FAILED","REFUND_PENDING"].includes(o.refundStatus),"ORDER_REFUND_TRANSITION");o.refundStatus="REFUND_PENDING";stop(o);break;
    default:return fail("ORDER_COMMAND");
  }
  return final(o);
}
export function paymentEventDigest(event:PaymentEvent):string {
  validatePaymentEvent(event);return createHash("sha256").update(JSON.stringify(Object.fromEntries(Object.entries(event).sort(([a],[b])=>a.localeCompare(b))))).digest("hex");
}
/** Call only after provider signature verification; this function adds identity/state checks, not authentication. */
export function applyVerifiedPaymentEvent(order:TestOrder,event:PaymentEvent,at:string):TestOrder {
  validateTestOrder(order);validatePaymentEvent(event);
  check(event.orderId===order.id&&event.actorRef===order.actorRef&&event.productId===order.productId&&event.amount===order.amount&&event.currency===order.currency&&event.providerRef===order.providerRef,"PAYMENT_BINDING_MISMATCH");
  const digest=paymentEventDigest(event),receipt=order.eventReceipts.find(r=>r.eventId===event.eventId);
  if(receipt){check(receipt.digest===digest,"PAYMENT_EVENT_CONFLICT");return freeze(structuredClone(order));}
  check(order.eventReceipts.length<MAX_PROVIDER_EVENTS,"PAYMENT_EVENT_LIMIT");
  const o=next(order,at,event.type);o.eventReceipts.push({eventId:event.eventId,digest});
  switch(event.type){
    case "PAYMENT_APPROVED":
      check(o.paymentStatus!=="NOT_STARTED","PAYMENT_NOT_REQUESTED");
      if(o.refundStatus==="REFUNDED"||o.paymentStatus==="APPROVED")break;
      o.paymentStatus="APPROVED";
      if(o.orderStatus==="CANCELLED"){o.refundStatus="REQUESTED";stop(o);}else{o.orderStatus="PAYMENT_VERIFIED";o.accessStatus="LOCKED";}break;
    case "PAYMENT_FAILED":case "PAYMENT_CANCELLED":
      check(o.paymentStatus!=="NOT_STARTED","PAYMENT_NOT_REQUESTED");
      if(o.paymentStatus==="APPROVED"||o.orderStatus==="CANCELLED")break;
      o.paymentStatus=event.type==="PAYMENT_FAILED"?"FAILED":"CANCELLED";
      o.orderStatus=event.type==="PAYMENT_FAILED"?"READY_FOR_TEST_CHECKOUT":"CANCELLED";if(event.type==="PAYMENT_CANCELLED")stop(o);break;
    case "REFUND_APPROVED":
      check(o.paymentStatus==="APPROVED"&&["REFUND_PENDING","REFUNDED"].includes(o.refundStatus),"REFUND_NOT_REQUESTED");o.refundStatus="REFUNDED";o.orderStatus="CANCELLED";stop(o);break;
    case "REFUND_FAILED":
      check(o.paymentStatus==="APPROVED"&&["REFUND_PENDING","REFUND_FAILED","REFUNDED"].includes(o.refundStatus),"REFUND_NOT_REQUESTED");if(o.refundStatus!=="REFUNDED")o.refundStatus="REFUND_FAILED";stop(o);break;
  }
  return final(o);
}
