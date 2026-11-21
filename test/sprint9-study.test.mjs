import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp,readFile,rm,writeFile} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {openBetaStudy,CONSENT_VERSION,questionsFor,requiredTargets} from '../scripts/beta/study.mjs';
import {READER_FIXTURE_IDS,REPORT_FIXTURE_IDS} from '../scripts/beta/reader-fixtures.mjs';

const DAY=86400000;
const scope=(fixtureId='F03',claimIds=['p1-behavior'])=>({fixtureId,reportArtifactVersion:'1.0.1',materialSha256:'1'.repeat(64),claimIds});
const code=k=>e=>e.code===k;
async function setup(t) {
  const directory=await mkdtemp(join(tmpdir(),'saju-s9-study-')),env={directory,time:Date.UTC(2026,10,22)};
  env.open=async()=>{env.study=await openBetaStudy({directory,mode:'INTERNAL_QA',now:()=>new Date(env.time)});return env.study;};
  env.close=async()=>{if(env.study){await env.study.close();env.study=null;}};
  t.after(async()=>{await env.close();await rm(directory,{force:true,recursive:true});});
  await env.open();return env;
}
async function admit(study,assignment={role:'READER',fixtureId:'F03'}) {
  const inv=await study.operator.issue(assignment),s=await study.participant.redeem(inv.token);
  await study.participant.consent(s.token,s.csrfToken,CONSENT_VERSION);
  return {...s,inviteId:inv.inviteId};
}
async function fill(study,s,role,arm,material,filter=()=>true,overrides={}) {
  const qs=questionsFor(role,arm);
  for(const {questionId,targetId} of requiredTargets(role,material,arm).filter(filter)) {
    const q=qs.find(it=>it.id===questionId);
    const value=overrides[questionId]??(q.kind==='rating'?3:q.kind==='choice'?q.choices[0]:'합성 테스트 의견');
    await study.participant.submit(s.token,s.csrfToken,{questionId,targetId,value},material);
  }
}
test('S9 study is an INTERNAL_QA-only instrument with separate reader and expert assignments',async t=>{
  const e=await setup(t),op=e.study.operator;
  for(const mode of ['LOCAL_DEVELOPMENT','CLOSED_BETA','PRODUCTION']) await assert.rejects(openBetaStudy({directory:e.directory,mode}),code('BETA_MODE_BLOCKED'));
  assert.equal(READER_FIXTURE_IDS.length,26);assert.equal(REPORT_FIXTURE_IDS.length,32);
  await assert.rejects(op.issue({role:'READER',fixtureId:'F07',arm:'REPORT_ONLY'}),code('BETA_READER_MATERIAL_UNAVAILABLE'));
  await assert.rejects(op.issue({role:'READER',fixtureId:'F04'}),code('BETA_READER_MATERIAL_UNAVAILABLE'));
  await assert.rejects(op.issue({role:'EXPERT',fixtureId:'F07',arm:'BLIND'}),code('BETA_ARM_INVALID'));
  await assert.rejects(op.issue({role:'READER',fixtureId:'F03',maxUses:6}),code('BETA_INVITE_LIMITS'));
  await assert.rejects(op.issue({role:'READER',fixtureId:'F03',expiresInMs:8*DAY}),code('BETA_INVITE_LIMITS'));
  assert.ok((await op.issue({role:'EXPERT',fixtureId:'F07'})).token);
  assert.ok((await op.issue({role:'READER',fixtureId:'F04',arm:'REPORT_ONLY'})).token);
  const summary=await op.aggregate();
  assert.equal(summary.completed,0);assert.equal(summary.humanParticipantCount,0);
  assert.equal(summary.readerArms.BLIND.personalization.mean,null);assert.equal(summary.expertReview.reviseOrReject.denominator,0);
});
test('S9 one invite use is atomic, session consent and CSRF cannot be supplied by another guest',async t=>{
  const {study}=await setup(t),{participant:p,operator:op}=study,inv=await op.issue({role:'READER',fixtureId:'F03'});
  const results=await Promise.allSettled([p.redeem(inv.token),p.redeem(inv.token)]);
  assert.equal(results.filter(r=>r.status==='fulfilled').length,1);
  assert.equal(results.find(r=>r.status==='rejected').reason.code,'BETA_INVITE_UNAVAILABLE');
  const s=results.find(r=>r.status==='fulfilled').value;
  const other=await admit(study,{role:'EXPERT',fixtureId:'F07'});
  await assert.rejects(p.checkMaterial(s.token,scope()),code('BETA_CONSENT_REQUIRED'));
  await assert.rejects(p.consent(s.token,other.csrfToken,CONSENT_VERSION),code('BETA_CSRF_REQUIRED'));
  await assert.rejects(p.consent(s.token,s.csrfToken,'unapproved'),code('BETA_CONSENT_VERSION'));
  await p.consent(s.token,s.csrfToken,CONSENT_VERSION);
  await assert.rejects(p.checkMaterial(s.token,scope('F07')),code('BETA_ASSIGNMENT_MISMATCH'));
  await p.checkMaterial(s.token,scope());
  await assert.rejects(p.checkMaterial(s.token,{...scope(),materialSha256:'2'.repeat(64)}),code('BETA_MATERIAL_CHANGED'));
  await assert.rejects(p.checkMaterial(s.token,scope('F03',[])),code('BETA_MATERIAL_CHANGED'));
  await op.revoke(inv.inviteId);assert.equal(await p.session(s.token),null);assert.ok(await p.session(other.token));
});
test('S9 blind judgments precede full report, are immutable, and debrief denominators stay in QA only',async t=>{
  const {study}=await setup(t),s=await admit(study),p=study.participant,material={...scope('F03',[]),comparisonType:'IDENTICAL_WORDING_DIFFERENT_CHART'};
  assert.deepEqual((await p.session(s.token)).blindOrder.slice().sort(),['A','B','C']);
  await assert.rejects(p.lockBlind(s.token,s.csrfToken),code('BETA_BLIND_INCOMPLETE'));
  await assert.rejects(p.submit(s.token,s.csrfToken,{questionId:'comprehension',targetId:'overall',value:3},material),code('BETA_BLIND_REQUIRED'));
  await fill(study,s,'READER','BLIND',material,q=>q.questionId.startsWith('blind'));
  await p.lockBlind(s.token,s.csrfToken);
  await assert.rejects(p.submit(s.token,s.csrfToken,{questionId:'blindSpecificity',targetId:'1',value:4},material),code('BETA_BLIND_LOCKED'));
  await assert.rejects(p.complete(s.token,s.csrfToken,material),code('BETA_EVALUATION_INCOMPLETE'));
  await fill(study,s,'READER','BLIND',material,q=>!q.questionId.startsWith('blind'));
  await p.complete(s.token,s.csrfToken,material);
  const result=await study.operator.aggregate();
  assert.equal(result.humanValidation,'NOT_TESTED');assert.equal(result.blindComparison.completed,1);
  assert.deepEqual(result.blindComparison.byComparisonType.IDENTICAL_WORDING_DIFFERENT_CHART.treatments.A.personalization,{answered:1,mean:3});
  assert.equal(result.blindComparison.byComparisonType.DISTINCT_WORDING_DIFFERENT_CHART.completed,0);
  assert.equal(result.readerArms.REPORT_ONLY.completed,0);
  await p.withdraw(s.token,s.csrfToken);assert.equal(await p.session(s.token),null);
  assert.equal((await study.operator.exportFeedback()).records.length,0);
});
test('S9 report-only form isolates ownership, validates text and retains evidence-safe duplicate and update behavior',async t=>{
  const e=await setup(t),study=e.study,p=study.participant,s=await admit(study,{role:'READER',arm:'REPORT_ONLY',fixtureId:'F04'});
  const other=await admit(study,{role:'READER',arm:'REPORT_ONLY',fixtureId:'F04'}),material=scope('F04',[]);
  const answer={questionId:'chapterComment',targetId:'ch2',value:'합성 테스트 전용 표현'};
  const saved=await p.submit(s.token,s.csrfToken,answer,material);
  assert.equal((await p.submit(s.token,s.csrfToken,answer,material)).status,'DUPLICATE');
  assert.equal((await p.submit(s.token,s.csrfToken,{...answer,value:'수정된 합성 의견'},material)).feedbackId,saved.feedbackId);
  for(const bad of ['<b>합성</b>','방향'+String.fromCodePoint(0x202e),'x'.repeat(601)])
    await assert.rejects(p.submit(s.token,s.csrfToken,{...answer,value:bad},material),code('BETA_TEXT_INVALID'));
  await assert.rejects(p.submit(s.token,s.csrfToken,{...answer,anonymousParticipantId:'spoof'},material),code('BETA_ANSWER_INVALID'));
  await assert.rejects(p.submit(s.token,s.csrfToken,{questionId:'blindReason',targetId:'overall',value:'합성'},material),code('BETA_QUESTION_TARGET_INVALID'));
  await assert.rejects(p.submit(s.token,s.csrfToken,{questionId:'issueNote',targetId:'p2-work',value:'합성'},material),code('BETA_QUESTION_TARGET_INVALID'));
  assert.equal((await p.session(other.token)).feedback.length,0);
  await e.close();await e.open();
  assert.equal((await e.study.participant.session(s.token)).feedback.length,1);
  const bytes=await readFile(join(e.directory,'beta-vault','state.sealed.json'),'utf8');
  for(const privateValue of [s.token,s.csrfToken,'수정된 합성 의견'])assert.ok(!bytes.includes(privateValue));
});
test('S9 expert claims keep divergent independent decisions, missing evidence and qualification distinct',async t=>{
  const {study}=await setup(t),p=study.participant,material=scope();
  for(const decision of ['REJECT','SCHOOL_DEPENDENT']){
    const s=await admit(study,{role:'EXPERT',fixtureId:'F03'});
    await assert.rejects(p.submit(s.token,s.csrfToken,{questionId:'disposition',targetId:'p2-work',value:decision},material),code('BETA_QUESTION_TARGET_INVALID'));
    await fill(study,s,'EXPERT','EXPERT',material,()=>true,{disposition:decision});
    await p.complete(s.token,s.csrfToken,material);
  }
  const empty=scope('F07',[]),s=await admit(study,{role:'EXPERT',fixtureId:'F07'});
  await fill(study,s,'EXPERT','EXPERT',empty,()=>true,{exceptionDisposition:'INSUFFICIENT_EVIDENCE'});
  await p.complete(s.token,s.csrfToken,empty);
  const result=(await study.operator.aggregate()).expertReview;
  assert.deepEqual(result.reviseOrReject,{numerator:1,denominator:2});
  assert.equal(result.disagreements.length,1);assert.equal(result.disagreements[0].counts.SCHOOL_DEPENDENT,1);
  assert.equal(result.exceptionFixtures.counts.INSUFFICIENT_EVIDENCE,1);
  assert.equal(result.distinctReviewedClaims,1);assert.equal(result.claimReviews,2);
});
test('S9 session expiration, local erasure and automated retention are independent',async t=>{
  const e=await setup(t),{operator:op,participant:p}=e.study;
  const s=await admit(e.study,{role:'EXPERT',fixtureId:'F07',expiresInMs:2000});
  const other=await admit(e.study,{role:'EXPERT',fixtureId:'F08',expiresInMs:2000});
  e.time+=2000;assert.equal(await p.session(s.token),null);assert.equal(await p.session(other.token),null);
  const exported=await op.exportFeedback();assert.equal(exported.records.length,2);
  await op.erase(exported.records[0].anonymousParticipantId);assert.equal((await op.exportFeedback()).records.length,1);
  e.time+=7*DAY;assert.equal((await op.purge()).participants,1);assert.equal((await op.exportFeedback()).records.length,0);
});
test('S9 wrong encrypted state is rejected on open with no implicit replacement',async t=>{
  const e=await setup(t);await e.close();
  const file=join(e.directory,'beta-vault','state.sealed.json'),obj=JSON.parse(await readFile(file,'utf8'));
  obj.tag=obj.tag.replace(/^./,obj.tag[0]==='A'?'B':'A');
  const bytes=JSON.stringify(obj);await writeFile(file,bytes);
  await assert.rejects(e.open(),code('PURCHASE_VAULT_INTEGRITY_FAILED'));
  assert.equal(await readFile(file,'utf8'),bytes);
});
test('S9 failed retention prevents new admissions and exposes an operator-visible recovery state',async t=>{
  const e=await setup(t),{participant:p,operator:op}=e.study;
  const s=await admit(e.study),file=join(e.directory,'beta-vault','state.sealed.json');
  const good=await readFile(file);
  await writeFile(file,'{"syntheticFault":true}');
  await assert.rejects(op.purge(),code('PURCHASE_VAULT_INTEGRITY_FAILED'));
  assert.equal(op.health().retentionStatus,'MAINTENANCE_REQUIRED');
  assert.ok(op.health().lastFailedPurge);
  await writeFile(file,good);
  await assert.rejects(p.session(s.token),code('BETA_MAINTENANCE_REQUIRED'));
  await assert.rejects(op.issue({role:'READER',fixtureId:'F03'}),code('BETA_MAINTENANCE_REQUIRED'));
  await op.purge();
  assert.equal(op.health().retentionStatus,'ACTIVE');assert.ok(await p.session(s.token));
});
