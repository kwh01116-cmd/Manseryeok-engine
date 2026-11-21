import {createHmac,randomBytes,timingSafeEqual} from 'node:crypto';
import {PurchaseVaultError} from './vault.mjs';

export const GUEST_COOKIE_NAME='saju_s8_guest';
export const GUEST_SESSION_VERSION='0.1.0';
const check=(value,code)=>{if(!value)throw new PurchaseVaultError(code);};
const validToken=value=>typeof value==='string'&&/^[A-Za-z0-9_-]{43}$/.test(value);
const id=()=>randomBytes(32).toString('base64url');

/** An authenticated local guest is not a real member or a durable recovery identity. */
export function createGuestSessions({vault,indexKey,now=()=>new Date(),ttlMs=24*60*60*1000}){
  check(vault&&typeof vault.read==='function'&&typeof vault.mutate==='function','GUEST_SESSION_VAULT');check(Buffer.isBuffer(indexKey)&&indexKey.length===32,'GUEST_SESSION_KEY');check(Number.isSafeInteger(ttlMs)&&ttlMs>=1000&&ttlMs<=31*24*60*60*1000,'GUEST_SESSION_TTL');
  const key=Buffer.from(indexKey);let closed=false;
  function time(){check(!closed,'GUEST_SESSION_CLOSED');const value=now();check(value instanceof Date&&Number.isFinite(value.getTime()),'GUEST_SESSION_CLOCK');return value;}
  function tokenIndex(token){return createHmac('sha256',key).update('saju-local-guest-v1\0'+token).digest('hex');}
  async function issue(){const created=time(),token=id(),csrfToken=id(),actorId='guest_'+randomBytes(24).toString('hex'),expiresAt=new Date(created.getTime()+ttlMs).toISOString();await vault.mutate(state=>{check(state.sessions&&typeof state.sessions==='object'&&!Array.isArray(state.sessions),'GUEST_SESSION_STATE');const index=tokenIndex(token);check(!Object.hasOwn(state.sessions,index),'GUEST_SESSION_COLLISION');state.sessions[index]={actorId,csrfToken,createdAt:created.toISOString(),expiresAt,revoked:false};});return Object.freeze({token,csrfToken,actorId,expiresAt});}
  async function authenticate(token){const current=time();if(!validToken(token))return null;const state=await vault.read(),session=state.sessions?.[tokenIndex(token)];if(!session||session.revoked||Date.parse(session.expiresAt)<=current.getTime())return null;check(typeof session.actorId==='string'&&/^guest_[a-f0-9]{48}$/.test(session.actorId)&&validToken(session.csrfToken)&&Number.isFinite(Date.parse(session.expiresAt)),'GUEST_SESSION_INTEGRITY');return Object.freeze({actorId:session.actorId,csrfToken:session.csrfToken,expiresAt:session.expiresAt});}
  async function revoke(token){time();if(!validToken(token))return {status:'NOT_FOUND'};return vault.mutate(state=>{const session=state.sessions?.[tokenIndex(token)];if(!session||session.revoked)return {status:'NOT_FOUND'};session.revoked=true;return {status:'REVOKED'};});}
  function verifyCsrf(session,value){if(!session||!validToken(value)||!validToken(session.csrfToken))return false;return timingSafeEqual(Buffer.from(session.csrfToken),Buffer.from(value));}
  function close(){key.fill(0);closed=true;}
  return Object.freeze({version:GUEST_SESSION_VERSION,issue,authenticate,revoke,verifyCsrf,close});
}

/** Loopback HTTP development exception: Secure cannot be relied on for all loopback hosts. */
export function guestCookie(token,{maxAge=86400,secure=false}={}){check(validToken(token),'GUEST_SESSION_TOKEN');check(Number.isSafeInteger(maxAge)&&maxAge>=0&&maxAge<=31*86400,'GUEST_SESSION_TTL');return `${GUEST_COOKIE_NAME}=${token}; Path=/; HttpOnly; SameSite=Strict; Max-Age=${maxAge}${secure?'; Secure':''}`;}
export function clearGuestCookie({secure=false}={}){return `${GUEST_COOKIE_NAME}=; Path=/; HttpOnly; SameSite=Strict; Max-Age=0${secure?'; Secure':''}`;}
export function readGuestCookie(header){if(typeof header!=='string'||header.length>8192)return null;const values=header.split(';').map(value=>value.trim()).filter(value=>value.startsWith(GUEST_COOKIE_NAME+'='));if(values.length!==1)return null;const token=values[0].slice(GUEST_COOKIE_NAME.length+1);return validToken(token)?token:null;}
