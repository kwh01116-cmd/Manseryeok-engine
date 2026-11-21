import {createHmac,randomUUID,timingSafeEqual} from 'node:crypto';
import {validatePaymentEvent,TEST_PRODUCT} from '../../dist/purchase/orderStateV1.js';

export const FAKE_PROVIDER_ID='LOCAL_FAKE_PAYMENT_PROVIDER_V01';
const fail=code=>{throw Object.assign(new Error(code),{code});};
const canonical=value=>JSON.stringify(Object.fromEntries(Object.entries(value).sort(([a],[b])=>a.localeCompare(b))));
const payloadKeys=['actorRef','amount','currency','eventId','issuedAt','orderId','productId','providerRef','schemaVersion','type'];
function safePayload(value){
  if(value===null||typeof value!=='object'||Array.isArray(value)||Object.getPrototypeOf(value)!==Object.prototype)fail('FAKE_EVENT_CONTRACT');
  if(Object.keys(value).sort().join('|')!==payloadKeys.join('|'))fail('FAKE_EVENT_CONTRACT');
  for(const d of Object.values(Object.getOwnPropertyDescriptors(value)))if(!Object.hasOwn(d,'value'))fail('FAKE_EVENT_CONTRACT');
  validatePaymentEvent(value);return value;
}
/** An in-process test provider. It is not a PG implementation or a production payment adapter. */
export function createFakePaymentProvider({signingKey,now=()=>new Date()}){
  if(!Buffer.isBuffer(signingKey)||signingKey.length!==32||typeof now!=='function')fail('FAKE_PROVIDER_CONFIGURATION');
  const key=Buffer.from(signingKey);let closed=false;
  const ready=()=>{if(closed)fail('FAKE_PROVIDER_CLOSED');};
  const sign=payload=>createHmac('sha256',key).update(`${FAKE_PROVIDER_ID}\0${canonical(payload)}`).digest('hex');
  return Object.freeze({
    id:FAKE_PROVIDER_ID,mode:'TEST',testProduct:TEST_PRODUCT,
    createEvent(order,type,{eventId=randomUUID(),providerRef=order.providerRef}={}){
      ready();const payload={schemaVersion:'saju-fake-payment-event-v1',eventId,providerRef,orderId:order.id,actorRef:order.actorRef,productId:order.productId,amount:order.amount,currency:order.currency,type,issuedAt:now().toISOString()};
      safePayload(payload);return Object.freeze({provider:FAKE_PROVIDER_ID,payload:Object.freeze(payload),signature:sign(payload)});
    },
    verifyEvent(envelope){
      ready();
      if(envelope===null||typeof envelope!=='object'||Array.isArray(envelope)||Object.getPrototypeOf(envelope)!==Object.prototype||Object.keys(envelope).sort().join('|')!=='payload|provider|signature')fail('FAKE_EVENT_CONTRACT');
      for(const d of Object.values(Object.getOwnPropertyDescriptors(envelope)))if(!Object.hasOwn(d,'value'))fail('FAKE_EVENT_CONTRACT');
      if(envelope.provider!==FAKE_PROVIDER_ID||typeof envelope.signature!=='string'||!/^[a-f0-9]{64}$/u.test(envelope.signature))fail('FAKE_SIGNATURE_INVALID');
      const payload=safePayload(envelope.payload),expected=Buffer.from(sign(payload),'hex'),supplied=Buffer.from(envelope.signature,'hex');
      if(!timingSafeEqual(expected,supplied))fail('FAKE_SIGNATURE_INVALID');
      // Delivery order is intentionally not a timestamp ordering rule; state/receipts handle delayed and duplicate events.
      return Object.freeze(structuredClone(payload));
    },
    close(){key.fill(0);closed=true;}
  });
}
