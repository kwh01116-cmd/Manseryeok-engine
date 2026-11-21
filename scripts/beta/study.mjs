import {createHmac, randomBytes, randomInt, timingSafeEqual} from 'node:crypto';
import {join, resolve} from 'node:path';
import {createPurchaseVault, loadOrCreatePurchaseKeys} from '../purchase/vault.mjs';
import {CONSENT_VERSION, STUDY_VERSION, isBlindQuestion, questionsFor, requiredTargets, targetsFor} from './forms.mjs';
import {aggregateFeedback} from './statistics.mjs';
import {READER_FIXTURE_IDS,REPORT_FIXTURE_IDS} from './reader-fixtures.mjs';
export {CONSENT_VERSION, CONSENT_TEXT, STUDY_VERSION, EXPERT_DECISIONS, questionsFor, requiredTargets} from './forms.mjs';

const DAY = 86400000;
const RETENTION = 7 * DAY;
const token = () => randomBytes(32).toString('base64url');
const isToken = value => typeof value === 'string' && /^[a-zA-Z0-9_-]{43}$/.test(value);
const id = () => randomBytes(16).toString('hex');
const validFixture = value => typeof value === 'string' && /^F(?:0[1-9]|[12][0-9]|3[0-7])$/.test(value);
const record = value => value && typeof value === 'object' && !Array.isArray(value);
const comparisonTypes=['IDENTICAL_WORDING_DIFFERENT_CHART','DISTINCT_WORDING_DIFFERENT_CHART'];
const exact = (value, keys) => record(value) && Object.keys(value).length === keys.length && keys.every(k=>Object.hasOwn(value,k));
export class BetaStudyError extends Error {
  constructor(code,status=422) { super(code); this.code=code; this.status=status; }
}
function check(condition,code,status) { if (!condition) throw new BetaStudyError(code,status); }
const randomOrder = () => {
  const items = ['A','B','C'];
  for (let n=items.length-1;n>0;n--) { const j=randomInt(n+1); [items[n],items[j]]=[items[j],items[n]]; }
  return items;
};
const matches = (a,b) => isToken(a) && isToken(b) && timingSafeEqual(Buffer.from(a),Buffer.from(b));
const timestamp = ms=>new Date(ms).toISOString();
const validScope = s => record(s) && validFixture(s.fixtureId) && (s.comparisonType==null||comparisonTypes.includes(s.comparisonType))
  && typeof s.reportArtifactVersion === 'string' && /^[a-zA-Z0-9_.:/-]{1,160}$/.test(s.reportArtifactVersion)
  && typeof s.materialSha256==='string' && /^[0-9a-f]{64}$/.test(s.materialSha256)
  && Array.isArray(s.claimIds) && s.claimIds.length<=32 && s.claimIds.every(c=>/^p[1-9][0-9]?-(behavior|communication|work|money)$/.test(c))
  && new Set(s.claimIds).size===s.claimIds.length;
function bindScope(p,s) {
  check(validScope(s) && s.fixtureId===p.fixtureId,'BETA_ASSIGNMENT_MISMATCH',409);
  const current = {fixtureId:s.fixtureId,reportArtifactVersion:s.reportArtifactVersion,materialSha256:s.materialSha256,
    comparisonType:p.arm==='BLIND'?s.comparisonType??null:null,claimIds:[...s.claimIds].sort()};
  if (p.scope) check(JSON.stringify(p.scope)===JSON.stringify(current),'BETA_MATERIAL_CHANGED',409);
  else p.scope=current;
  return current;
}
function cleanAnswer(q,value) {
  if (q.kind==='rating') {
    check(Number.isInteger(value)&&value>=1&&value<=5,'BETA_RATING_INVALID');
    return value;
  }
  if (q.kind==='choice') {
    check(q.choices.includes(value),'BETA_OPTION_INVALID');
    return value;
  }
  check(typeof value==='string' && value.length<=600,'BETA_TEXT_INVALID');
  const clean=value.normalize('NFC').trim();
  check(clean.length>0 && !/[<>\u0000-\u0008\u000b-\u001f\u007f\u202a-\u202e\u2066-\u2069]/u.test(clean),'BETA_TEXT_INVALID');
  return clean;
}
function studyState(s) {
  return exact(s,['study','invites','participants','sessions']) && s.study===STUDY_VERSION &&
    [s.invites,s.participants,s.sessions].every(record) &&
    Object.values(s.participants).every(p=>['READER','EXPERT'].includes(p.role)&&validFixture(p.fixtureId)&&Array.isArray(p.answers)&&
      (p.scope===null||validScope(p.scope))&&!!s.invites[p.inviteId]);
}
function removeParticipant(s,pid) {
  for (const [k,v] of Object.entries(s.sessions)) if (v.pid===pid) delete s.sessions[k];
  delete s.participants[pid];
}
function prune(s,ms) {
  let participants=0,invites=0,sessions=0;
  for (const [pid,p] of Object.entries(s.participants)) if (Date.parse(p.eraseAt)<=ms) { removeParticipant(s,pid);participants++; }
  for (const [k,v] of Object.entries(s.sessions)) if (Date.parse(v.expiresAt)<=ms) { delete s.sessions[k];sessions++; }
  const assigned=new Set(Object.values(s.participants).map(p=>p.inviteId));
  for (const [k,v] of Object.entries(s.invites)) if ((v.revoked||Date.parse(v.expiresAt)<=ms)&&!assigned.has(k)) { delete s.invites[k];invites++; }
  return {participants,invites,sessions};
}
function publicAnswers(p) {
  return p.answers.map(({feedbackId,questionId,targetId,value})=>({feedbackId,questionId,targetId,value}));
}
function exportRows(s) {
  return Object.entries(s.participants).filter(([,p])=>p.consented).map(([pid,p])=>({
    anonymousParticipantId:pid,role:p.role,arm:p.arm,fixtureId:p.fixtureId,reportArtifactVersion:p.scope?.reportArtifactVersion??null,
    materialSha256:p.scope?.materialSha256??null,consentVersion:CONSENT_VERSION,completed:p.completed,consentedAt:p.consentedAt,completedAt:p.completedAt,
    comparisonType:p.scope?.comparisonType??null,blindKey:p.arm==='BLIND'&&p.blindLocked?[...p.blindOrder]:null,
    answers:p.answers.map(a=>({...a}))
  }));
}
/** Operator methods are local filesystem capabilities. The HTTP layer receives participant methods only. */
export async function openBetaStudy({directory,mode,now=()=>new Date(),readerFixtureIds}={}) {
  check(mode==='INTERNAL_QA' && process.env.NODE_ENV!=='production','BETA_MODE_BLOCKED',403);
  check(typeof directory==='string'&&directory.length>0,'BETA_DIRECTORY_REQUIRED');
  // Optional server-supplied catalogue can narrow the prevalidated reader pool.
  const readers=new Set(readerFixtureIds??READER_FIXTURE_IDS);
  check([...readers].every(x=>READER_FIXTURE_IDS.includes(x)),'BETA_READER_CATALOGUE');
  const keys=await loadOrCreatePurchaseKeys(join(resolve(directory),'beta-keys'));
  const indexKey=Buffer.from(keys.indexKey);
  const index=(kind,raw)=>createHmac('sha256',indexKey).update(kind+'\x00'+raw).digest('hex');
  let vault;
  try {
    vault=await createPurchaseVault({directory:join(resolve(directory),'beta-vault'),encryptionKey:keys.encryptionKey,now,
      initialState:{study:STUDY_VERSION,invites:{},participants:{},sessions:{}},validateState:studyState,maxStateBytes:16*1024*1024});
  } catch (error) { indexKey.fill(0); throw error; }
  finally { Object.values(keys).forEach(k=>k.fill(0)); }
  const at=()=>{const t=now();check(t instanceof Date&&Number.isFinite(t.getTime()),'BETA_CLOCK_UNAVAILABLE',503);return t.getTime();};
  let maintenanceFailed=false,lastSuccessfulPurge=null,lastFailedPurge=null;
  const purge=async()=>{
    try { const result=await vault.mutate(s=>prune(s,at()));maintenanceFailed=false;lastSuccessfulPurge=timestamp(at());return result; }
    catch(error) { maintenanceFailed=true;lastFailedPurge=timestamp(at());throw error; }
  };
  try { await purge(); } catch(error) { await vault.close();indexKey.fill(0);throw error; }
  // Fail participant access closed if scheduled deletion could not be committed.
  const timer=setInterval(()=>void purge().catch(()=>{}),3600000);
  timer.unref();
  function resolveSession(s,rawToken,ms) {
    check(!maintenanceFailed,'BETA_MAINTENANCE_REQUIRED',503);
    if (!isToken(rawToken)) return null;
    const session=s.sessions[index('s9-session',rawToken)];
    if (!session||Date.parse(session.expiresAt)<=ms) return null;
    const p=s.participants[session.pid];
    const invite=p&&s.invites[p.inviteId];
    return !p||Date.parse(p.eraseAt)<=ms||!invite||invite.revoked||Date.parse(invite.expiresAt)<=ms?null:{session,p};
  }
  function write(rawToken,csrf,fn) {
    return vault.mutate(s=>{
      const ms=at(),auth=resolveSession(s,rawToken,ms);
      check(auth,'BETA_SESSION_REQUIRED',401);
      check(matches(auth.session.csrfToken,csrf),'BETA_CSRF_REQUIRED',403);
      return fn(auth.p,ms,s,auth.session);
    });
  }
  async function issue({role,arm=role==='READER'?'BLIND':'EXPERT',fixtureId,maxUses=1,expiresInMs=DAY,...extras}) {
    check(Object.keys(extras).length===0&&['READER','EXPERT'].includes(role)&&validFixture(fixtureId),'BETA_INVITE_INVALID');
    check(role==='READER'?['BLIND','REPORT_ONLY'].includes(arm):arm==='EXPERT','BETA_ARM_INVALID');
    check(arm==='EXPERT'||(arm==='BLIND'?readers.has(fixtureId):REPORT_FIXTURE_IDS.includes(fixtureId)),'BETA_READER_MATERIAL_UNAVAILABLE');
    check(Number.isInteger(maxUses)&&maxUses>=1&&maxUses<=5&&Number.isSafeInteger(expiresInMs)&&expiresInMs>=1000&&expiresInMs<=RETENTION,'BETA_INVITE_LIMITS');
    const raw=token(),ms=at(),inviteId=id(),expiresAt=timestamp(ms+expiresInMs);
    await vault.mutate(s=>{
      check(!maintenanceFailed,'BETA_MAINTENANCE_REQUIRED',503);
      prune(s,ms);
      check(Object.keys(s.invites).length<256,'BETA_STUDY_CAPACITY',429);
      s.invites[inviteId]={role,arm,fixtureId,maxUses,uses:0,expiresAt,revoked:false,index:index('s9-invite',raw)};
    });
    return {inviteId,token:raw,expiresAt};
  }
  async function revoke(inviteId) {
    return vault.mutate(s=>{
      check(typeof inviteId==='string'&&/^[a-f0-9]{32}$/.test(inviteId)&&Object.hasOwn(s.invites,inviteId),'BETA_INVITE_NOT_FOUND',404);
      s.invites[inviteId].revoked=true;
      return {status:'REVOKED'};
    });
  }
  async function erase(pid) {
    return vault.mutate(s=>{
      check(typeof pid==='string'&&/^[a-f0-9]{32}$/.test(pid)&&Object.hasOwn(s.participants,pid),'BETA_PARTICIPANT_NOT_FOUND',404);
      removeParticipant(s,pid);
      return {status:'WITHDRAWN'};
    });
  }
  async function redeem(raw) {
    check(isToken(raw),'BETA_INVITE_UNAVAILABLE',403);
    const sessionToken=token(),csrfToken=token();
    const {expiresAt}=await vault.mutate(s=>{
      check(!maintenanceFailed,'BETA_MAINTENANCE_REQUIRED',503);
      const ms=at();prune(s,ms);
      const digest=index('s9-invite',raw);
      const pair=Object.entries(s.invites).find(([,item])=>item.index===digest);
      const inv=pair?.[1];
      check(inv&&!inv.revoked&&inv.uses<inv.maxUses&&ms<Date.parse(inv.expiresAt),'BETA_INVITE_UNAVAILABLE',403);
      check(Object.keys(s.participants).length<128,'BETA_STUDY_CAPACITY',429);
      const pid=id(),expiresAt=timestamp(Math.min(Date.parse(inv.expiresAt),ms+DAY));
      inv.uses++;
      s.participants[pid]={inviteId:pair[0],role:inv.role,arm:inv.arm,fixtureId:inv.fixtureId,scope:null,consented:false,consentedAt:null,completed:false,completedAt:null,
        blindOrder:inv.arm==='BLIND'?randomOrder():[],blindLocked:false,answers:[],eraseAt:timestamp(ms+RETENTION)};
      s.sessions[index('s9-session',sessionToken)]={pid,csrfToken,expiresAt};
      return {expiresAt};
    });
    return {token:sessionToken,csrfToken,expiresAt};
  }
  async function session(raw) {
    const s=await vault.read(),auth=resolveSession(s,raw,at());
    if (!auth) return null;
    const {p,session:sessionInfo}=auth;
    return {role:p.role,arm:p.arm,fixtureId:p.fixtureId,consented:p.consented,completed:p.completed,blindLocked:p.blindLocked,
      blindOrder:[...p.blindOrder],csrfToken:sessionInfo.csrfToken,expiresAt:sessionInfo.expiresAt,feedback:publicAnswers(p)};
  }
  function consent(raw,csrf,version) {
    return write(raw,csrf,(p,ms)=>{
      check(version===CONSENT_VERSION,'BETA_CONSENT_VERSION');
      if (!p.consented) { p.consented=true;p.consentedAt=timestamp(ms); }
      return {status:'CONSENTED'};
    });
  }
  async function checkMaterial(raw,scope) {
    return vault.mutate(s=>{
      const auth=resolveSession(s,raw,at());
      check(auth,'BETA_SESSION_REQUIRED',401);
      check(auth.p.consented,'BETA_CONSENT_REQUIRED',403);
      bindScope(auth.p,scope);
      return {status:'MATERIAL_VERIFIED'};
    });
  }
  function submit(raw,csrf,answer,scope) {
    return write(raw,csrf,(p,ms)=>{
      check(p.consented,'BETA_CONSENT_REQUIRED',403);
      check(exact(answer,['questionId','targetId','value']),'BETA_ANSWER_INVALID');
      const material=bindScope(p,scope),question=questionsFor(p.role,p.arm).find(q=>q.id===answer.questionId);
      if (p.arm==='BLIND'&&!p.blindLocked&&question?.target==='issue') check(answer.targetId==='overall','BETA_BLIND_REQUIRED',409);
      check(question&&targetsFor(question,material).includes(answer.targetId),'BETA_QUESTION_TARGET_INVALID');
      const value=cleanAnswer(question,answer.value);
      const existing=p.answers.find(a=>a.questionId===question.id&&a.targetId===answer.targetId);
      if (existing?.value===value) return {status:'DUPLICATE',feedbackId:existing.feedbackId};
      check(!p.completed,'BETA_EVALUATION_LOCKED',409);
      if (p.arm==='BLIND' && question.target!=='issue') {
        if (isBlindQuestion(question.id)) check(!p.blindLocked,'BETA_BLIND_LOCKED',409);
        else check(p.blindLocked,'BETA_BLIND_REQUIRED',409);
      }
      const a=existing??{feedbackId:id(),questionId:question.id,targetId:answer.targetId};
      a.value=value;a.submittedAt=timestamp(ms);
      if (!existing) p.answers.push(a);
      return {status:'RECORDED',feedbackId:a.feedbackId};
    });
  }
  function lockBlind(raw,csrf) {
    return write(raw,csrf,p=>{
      check(p.consented&&p.arm==='BLIND','BETA_READER_REQUIRED',403);
      const needed=requiredTargets('READER',{claimIds:[]}).filter(it=>isBlindQuestion(it.questionId));
      check(needed.every(it=>p.answers.some(a=>a.questionId===it.questionId&&a.targetId===it.targetId)),'BETA_BLIND_INCOMPLETE',409);
      p.blindLocked=true;
      return {status:'BLIND_LOCKED'};
    });
  }
  function complete(raw,csrf,scope) {
    return write(raw,csrf,(p,ms)=>{
      check(p.consented,'BETA_CONSENT_REQUIRED',403);
      const material=bindScope(p,scope);
      check(p.arm!=='BLIND'||p.blindLocked,'BETA_BLIND_REQUIRED',409);
      check(requiredTargets(p.role,material,p.arm).every(it=>p.answers.some(a=>a.questionId===it.questionId&&a.targetId===it.targetId)),'BETA_EVALUATION_INCOMPLETE',409);
      if (!p.completed) { p.completed=true;p.completedAt=timestamp(ms); }
      return {status:'COMPLETED'};
    });
  }
  function withdraw(raw,csrf) {
    return write(raw,csrf,(_p,_ms,s,sessionInfo)=>{
      removeParticipant(s,sessionInfo.pid);
      return {status:'WITHDRAWN'};
    });
  }
  const exportFeedback=async()=>vault.mutate(s=>{
    prune(s,at());
    return {studyVersion:STUDY_VERSION,dataClass:'SYNTHETIC_INTERNAL_QA',humanParticipantCount:0,records:exportRows(s)};
  });
  return Object.freeze({
    operator:Object.freeze({issue,revoke,erase,purge,exportFeedback,aggregate:async()=>aggregateFeedback(await exportFeedback()),
      health:()=>({retentionStatus:maintenanceFailed?'MAINTENANCE_REQUIRED':'ACTIVE',lastSuccessfulPurge,lastFailedPurge})}),
    participant:Object.freeze({redeem,session,consent,checkMaterial,submit,lockBlind,complete,withdraw}),
    async close(){clearInterval(timer);await vault.close();indexKey.fill(0);}
  });
}
