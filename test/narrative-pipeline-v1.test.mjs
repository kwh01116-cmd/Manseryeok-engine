import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp,rm,readFile,readdir} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join,resolve,dirname,basename} from 'node:path';
import {makeConsumerProjection} from './fixtures/consumer-report-projection-v1.mjs';
import {SERVER_REQUEST_LITERAL_BASE} from './fixtures/server-api-only-request-cases-v1.mjs';
import {buildConsumerReport,validateConsumerReport,renderConsumerReport} from '../dist/report/consumerReportV1.js';
import {INTERPRETATION_PROFILE_ID,INTERPRETATION_POLICIES} from '../dist/report/interpretationPolicyV1.js';
import {rebuildInterpretationBasis,buildInterpretedReport,validateInterpretedReport,buildInterpretedSections,renderInterpretedReport,auditNarrative,selectNarrativeVariants,interpretedReportVersions} from '../dist/report/narrativePipelineV1.js';
import {expressionRequest,approvedExpressionMock,composeWithExpressionProvider,parseInterpretedReportArgs,validateIssuedInterpretedReport,createInterpretedReportService} from '../scripts/product/interpreted-report.mjs';
import {createLocalReportStore} from '../scripts/product/report-store.mjs';

const PROFILE={profileId:INTERPRETATION_PROFILE_ID};
// Existing S6 literal projections remain unchanged. These additions are synthetic,
// manually specified exact monthly exposures, not expected values from the resolver.
function projection(variant='winter-candidate',{exact=false}={}){
  const p=makeConsumerProjection({variant});
  if(exact){const pattern=p.evidence.find(n=>n.id===p.candidates[0].refs.pattern).value;
    pattern.status=variant==='winter-candidate'?'MAIN_QI_WITH_COMPETING_EXPOSURES':'MAIN_QI_STRUCTURAL_ANCHOR';
    pattern.exposures=[{role:'year',stem:'壬',type:'偏印'}];
    pattern.competingExposures=variant==='winter-candidate'?[{role:'hour',stem:'甲',type:'比肩'}]:[];
  }return p;
}
const makeReport=(variant='winter-candidate',options={})=>buildInterpretedReport(rebuildInterpretationBasis(projection(variant,options)),PROFILE);
const blocks=report=>structuredClone(report.sections.flatMap(s=>s.blocks).filter(b=>b.kind==='SYMBOLIC_INTERPRETATION'));
const byDomain=report=>Object.fromEntries(report.interpretationClaims.map(c=>[c.domain,c.confidenceOrApplicabilityStatus]));
const codes=result=>result.issues.map(i=>i.code);
const mockTrace=()=>({requested:'LOCAL_MOCK',used:'APPROVED_VARIANTS',attemptCount:1,fallbackUsed:false,failures:[]});
const clone=value=>structuredClone(value);

test('optional interpretation leaves the existing S6 report byte-equivalent and reuses valid legacy projection IDs',()=>{
  const p=projection(),before=JSON.stringify(p),s6=buildConsumerReport(p,{profileId:'SAJU-CONSUMER-EVIDENCE-REPORT-V01'}),oldText=renderConsumerReport(s6),oldJson=JSON.stringify(s6);
  const basis=rebuildInterpretationBasis(p),result=buildInterpretedReport(basis,PROFILE);
  assert.equal(validateInterpretedReport(result),true);assert.equal(JSON.stringify(result.basis.baseReport),oldJson);assert.equal(validateConsumerReport(result.basis.baseReport,{projection:p}),true);assert.equal(renderConsumerReport(s6),oldText);assert.equal(JSON.stringify(p),before);
  assert.equal(JSON.stringify(makeReport()),JSON.stringify(result));assert.equal(Object.isFrozen(p),false);assert.ok(Object.isFrozen(result.interpretationClaims));
  assert.throws(()=>buildInterpretedReport(basis,{profileId:'IMPLICIT-NEW-POLICY'}),/S7_EXPLICIT_PROFILE_REQUIRED/);
  assert.equal(result.eligibility.fullPaidReport,false);assert.equal(result.eligibility.paymentGate,'NO_GO_PROTOTYPE_NOT_FOR_SALE');
});

test('fixed role contexts yield limited perspectives and explicit holds rather than traits or a constant outcome',()=>{
  const night=makeReport('winter-candidate',{exact:true}),noon=makeReport('winter-fire-hold',{exact:true});
  assert.deepEqual(byDomain(night),{BEHAVIOR:'LIMITED',COMMUNICATION:'HOLD',WORK:'LIMITED',MONEY:'HOLD'});
  assert.deepEqual(byDomain(noon),{BEHAVIOR:'LIMITED',COMMUNICATION:'HOLD',WORK:'LIMITED',MONEY:'HOLD'});
  assert.equal(night.interpretationClaims.find(c=>c.domain==='BEHAVIOR').decisionCode,'LIMITED_COMPETING');
  assert.equal(noon.interpretationClaims.find(c=>c.domain==='BEHAVIOR').decisionCode,'LIMITED_MONTH_EXACT_ROLE');
  assert.equal(night.interpretationClaims.find(c=>c.domain==='WORK').supportingConditions.length,1);
  assert.equal(noon.interpretationClaims.find(c=>c.domain==='WORK').supportingConditions.length,2);
  assert.notEqual(night.interpretationClaims[0].consumerText,noon.interpretationClaims[0].consumerText);
  for(const c of [...night.interpretationClaims,...noon.interpretationClaims]){
    assert.equal(c.interpretationPolicyId,INTERPRETATION_POLICIES[c.domain]);assert.ok(c.sourceRefs.includes('S7-PROJECT-SYMBOLIC-ROLE-POLICY-V01'));
    assert.match(c.interpretationScope,/NOT_DIAGNOSIS_OR_PREDICTION/);assert.ok(c.forbiddenConclusions.includes('FINAL_STRENGTH_PATTERN_SUCCESS_OR_YONGSHEN'));
    assert.deepEqual(new Set(c.inputFactRefs).size,c.inputFactRefs.length);
  }
});

test('claim, policy, source, candidate and HOLD promotion tampering cannot survive stored-report reconstruction',()=>{
  const original=makeReport('winter-candidate',{exact:true}),mutations=[
    r=>{r.interpretationClaims[0].sourceRefs[0]='FORGED-CLASSICAL-SOURCE';},
    r=>{r.interpretationClaims[0].inputFactRefs[0]='foreign-context/chart.candidates[0]/day';},
    r=>{r.interpretationClaims[0].interpretationPolicyVersion='99.0.0';},
    r=>{r.interpretationClaims[0].chartCandidateRef='chart.candidates[1]';},
    r=>{r.interpretationClaims.find(c=>c.confidenceOrApplicabilityStatus==='HOLD').confidenceOrApplicabilityStatus='LIMITED';},
    r=>{r.interpretationClaims[0].consumerText='당신은 반드시 성공합니다.';},
    r=>{r.provenance.policies[0].id='DIFFERENT-SCHOOL-POLICY';},
    r=>{r.eligibility.fullPaidReport=true;},
  ];
  for(const change of mutations){const bad=clone(original);change(bad);assert.throws(()=>validateInterpretedReport(bad),/S7_REPORT_FACT_CLAIM_OR_NARRATIVE_TAMPERED/);}
});

test('day/month facts, nonexistent hidden members and malformed JSON are checked before narrative output',()=>{
  const result=makeReport('winter-candidate',{exact:true});
  for(const mutate of [
    r=>{r.basis.projection.evidence.find(n=>n.id===r.basis.projection.candidates[0].refs.day).value.stem='乙';},
    r=>{r.basis.projection.evidence.find(n=>n.id===r.basis.projection.candidates[0].refs.pillars).value.items[1].branch='午';},
    r=>{r.basis.projection.evidence.find(n=>n.id===r.basis.projection.candidates[0].refs.root).value.locations[0].hiddenStem='丙';},
    r=>{r.sections[0].blocks[0].text='日干是乙，月令是午。';},
    r=>{r.basis.projection.provenance.sourceRefs=[];},
  ]){const bad=clone(result);mutate(bad);assert.throws(()=>validateInterpretedReport(bad));}
  const sparse=clone(result);sparse.sections=Array(1);sparse.sections.extra='masked-hole';assert.throws(()=>validateInterpretedReport(sparse),/S7_/);
  let reads=0;const getter=clone(result);Object.defineProperty(getter.interpretationClaims[0],'consumerText',{enumerable:true,get(){reads++;return 'must not execute';}});assert.throws(()=>validateInterpretedReport(getter),/S7_JSON_DESCRIPTOR/);assert.equal(reads,0);
});

test('natal parents keep separate claims while a seasonal boundary retains only one four-domain claim set',()=>{
  const boundary=makeReport('two-natal-parents');assert.equal(boundary.interpretationClaims.length,8);assert.deepEqual(boundary.domainAssessments.map(c=>c.candidateRef),['chart.candidates[0]','chart.candidates[1]']);
  assert.deepEqual(boundary.domainAssessments.map(c=>Object.fromEntries(c.domains.map(d=>[d.domain,d.status]))),[
    {BEHAVIOR:'HOLD',COMMUNICATION:'HOLD',WORK:'LIMITED',MONEY:'HOLD'},
    {BEHAVIOR:'HOLD',COMMUNICATION:'LIMITED',WORK:'HOLD',MONEY:'HOLD'},
  ]);
  const mixed=blocks(boundary);mixed[0].claimRefs=[mixed.find(b=>b.chartCandidateRef==='chart.candidates[1]').claimRefs[0]];
  assert.ok(codes(auditNarrative(boundary,mixed)).includes('CROSS_CANDIDATE'));
  const seasonal=makeReport('seasonal-alternatives');assert.equal(seasonal.interpretationClaims.length,4);assert.equal(seasonal.basis.projection.candidates.length,1);
  const fact=seasonal.basis.projection.evidence.find(n=>n.id===seasonal.basis.projection.candidates[0].refs.seasonal);assert.equal(fact.value.alternatives.length,2);
});

test('JSON, consumer TEXT and section/dialogue DTOs share the same approved claims without leaking IDs into the body',()=>{
  const report=makeReport('winter-candidate',{exact:true}),json=JSON.parse(JSON.stringify(report));assert.equal(validateInterpretedReport(json),true);
  const full=buildInterpretedSections(report,{audience:'full',voice:'report'}),dialogue=buildInterpretedSections(report,{audience:'full',voice:'dialogue'}),text=renderInterpretedReport(report);
  assert.equal(full.sections.length,6);assert.equal(buildInterpretedSections(report,{audience:'preview'}).sections.length,2);
  for(const [index,section]of full.sections.entries())for(const [bi,b]of section.blocks.entries()){
    const talking=dialogue.sections[index].blocks[bi];assert.equal(talking.text,b.text);assert.deepEqual(talking.claimRefs,b.claimRefs);assert.equal(talking.speaker,'REPORT_GUIDE');assert.ok(text.includes(b.text));
  }
  assert.equal(text.includes(INTERPRETATION_PROFILE_ID),false);assert.equal(text.includes(report.contextId),false);
  assert.ok(renderInterpretedReport(report,{detail:true}).endsWith(JSON.stringify(report,null,2)+'\n'));assert.match(text,/3\. 성향과 행동/);assert.match(text,/4\. 관계·일·재물/);
});

test('closed narrative QA distinguishes references, policy mixture, duplicate blocks, held promotion and unsafe text',()=>{
  const report=makeReport('winter-candidate',{exact:true}),clean=blocks(report);assert.equal(auditNarrative(report,clean).status,'PASS');
  const probes=[
    [b=>{b[0].claimRefs=['UNKNOWN-CLAIM'];},'UNKNOWN_CLAIM'],
    [b=>{b[0].policyRefs[0].id='FOREIGN-POLICY';},'POLICY_MIX'],
    [b=>{b.find(x=>x.status==='HOLD').status='LIMITED';},'HOLD_PROMOTED'],
    [b=>{b.push(clone(b[0]));},'DUPLICATE_BLOCK'],
    [b=>{b.pop();},'MISSING_BLOCK'],
    [b=>{b[0].text='당신은 반드시 사고를 당합니다.';},'DISALLOWED_PREDICTION'],
    [b=>{b[0].text='당신은 타고난 천재입니다.';},'HOLLOW_PRAISE'],
    [b=>{b[0].text='己은 기회를 잡습니다.';},'KOREAN_PARTICLE_REVIEW'],
    [b=>{b[0].text='건강은 언제나 완벽하게 유지됩니다.';},'UNAPPROVED_MEANING'],
  ];
  for(const [change,expected]of probes){const input=clone(clean);change(input);const audit=auditNarrative(report,input);assert.equal(audit.status,'REJECTED');assert.ok(codes(audit).includes(expected),expected);}
});

test('expression mock receives only a closed claim catalog and can select a safe variant without changing facts or claims',async()=>{
  const report=makeReport('winter-candidate',{exact:true}),payload=expressionRequest(report),serialized=JSON.stringify(payload);
  for(const secret of ['1992-11-24','00:30',report.provenance.dataFingerprint])assert.equal(serialized.includes(secret),false);
  assert.equal(Object.hasOwn(payload,'basis'),false);assert.equal(Object.hasOwn(payload,'birthInput'),false);assert.ok(Object.isFrozen(payload.claims));assert.match(payload.semanticBoundary,/NO_FREE_FORM_FACT_OR_INTERPRETATION/);
  const next=await composeWithExpressionProvider(report,{provider:approvedExpressionMock});assert.equal(next.generation.used,'APPROVED_VARIANTS');assert.equal(next.generation.attemptCount,1);assert.equal(next.generation.fallbackUsed,false);
  assert.deepEqual(next.interpretationClaims,report.interpretationClaims);assert.deepEqual(next.basis,report.basis);assert.equal(validateInterpretedReport(JSON.parse(JSON.stringify(next))),true);
  assert.ok(blocks(next).every(b=>b.variantId==='REFLECTIVE'));assert.notEqual(renderInterpretedReport(next),renderInterpretedReport(report));
});

test('unavailable providers and unknown claims fall back to unchanged deterministic meaning with at most two attempts',async()=>{
  const report=makeReport();let attempts=0;
  const unavailable=await composeWithExpressionProvider(report,{maxAttempts:2,provider:()=>{attempts++;throw Error('synthetic secret that must not be logged');}});
  assert.equal(attempts,2);assert.equal(unavailable.generation.fallbackUsed,true);assert.equal(unavailable.generation.used,'DETERMINISTIC');assert.deepEqual(unavailable.generation.failures.map(i=>i.code),['GENERATOR_UNAVAILABLE','GENERATOR_UNAVAILABLE']);assert.deepEqual(unavailable.interpretationClaims,report.interpretationClaims);assert.equal(renderInterpretedReport(unavailable),renderInterpretedReport(report));
  assert.equal(JSON.stringify(unavailable.generation).includes('synthetic secret'),false);
  const unknown=await composeWithExpressionProvider(report,{provider:payload=>{const response=approvedExpressionMock(payload);response.blocks[0].claimRefs=['missing-claim'];return response;}});
  assert.equal(unknown.generation.fallbackUsed,true);assert.ok(unknown.generation.failures.some(i=>i.code==='UNKNOWN_CLAIM'));assert.deepEqual(unknown.interpretationClaims,report.interpretationClaims);
  const unknownBlock=await composeWithExpressionProvider(report,{provider:payload=>{const response=approvedExpressionMock(payload);response.blocks[0].blockId='untrusted-private-block-id';return response;}});
  assert.equal(unknownBlock.generation.fallbackUsed,true);assert.ok(unknownBlock.generation.failures.some(i=>i.code==='UNKNOWN_BLOCK'&&i.blockId===null));assert.equal(JSON.stringify(unknownBlock.generation).includes('untrusted-private-block-id'),false);
});

test('provider timeouts deliver abort signals and malformed responses are contract errors rather than availability claims',async()=>{
  const report=makeReport();let aborts=0;
  const timed=await composeWithExpressionProvider(report,{maxAttempts:2,timeoutMs:5,provider:(_,{signal})=>{signal.addEventListener('abort',()=>{aborts++;},{once:true});return new Promise(()=>{});}});
  assert.equal(aborts,2);assert.equal(timed.generation.attemptCount,2);assert.equal(timed.generation.fallbackUsed,true);assert.deepEqual(timed.generation.failures.map(i=>i.code),['GENERATOR_ABORTED','GENERATOR_ABORTED']);
  const malformed=await composeWithExpressionProvider(report,{provider:()=>({schemaVersion:'saju-closed-expression-response-v1',blocks:undefined})});
  assert.equal(malformed.generation.fallbackUsed,true);assert.deepEqual(malformed.generation.failures.map(i=>i.code),['GENERATOR_CONTRACT']);
  for(const maxAttempts of [0,3])await assert.rejects(()=>composeWithExpressionProvider(report,{provider:approvedExpressionMock,maxAttempts}),/S7_EXPRESSION_OPTIONS/);
});

test('generation traces cannot smuggle raw provider messages or claim deterministic output was an unchecked fallback',()=>{
  const report=makeReport(),approved=approvedExpressionMock(expressionRequest(report)).blocks;
  const extra=mockTrace();extra.failures=[{category:'GENERATOR',code:'GENERATOR_UNAVAILABLE',blockId:null,rawMessage:'untrusted private content'}];assert.throws(()=>selectNarrativeVariants(report,approved,extra),/S7_/);
  const impossible={requested:'LOCAL_MOCK',used:'DETERMINISTIC',attemptCount:1,fallbackUsed:false,failures:[]};assert.throws(()=>selectNarrativeVariants(report,blocks(report),impossible),/S7_/);
});

test('uncalculated input states never produce invented interpretation claims or full-paid eligibility',()=>{
  for(const variant of ['unknown-time','dst-gap','dst-fold','needs-data','policy-unresolved','unsupported']){
    const result=makeReport(variant);assert.deepEqual(result.interpretationClaims,[]);assert.equal(result.eligibility.fullPaidReport,false);assert.equal(result.domainAssessments.length,0);assert.equal(result.sections[2].status,'HOLD');assert.equal(validateInterpretedReport(result),true);
  }
});

test('encrypted storage rereads the full S7 envelope and revalidates its original projection, report and versions',async t=>{
  const directory=await mkdtemp(join(tmpdir(),'manseryeok-narrative-store-'));let store;
  t.after(async()=>{store?.close();const path=resolve(directory);assert.equal(dirname(path),resolve(tmpdir()));assert.match(basename(path),/^manseryeok-narrative-store-/);await rm(path,{recursive:true,force:true});});
  const report=makeReport('winter-candidate',{exact:true}),versions=interpretedReportVersions(report);
  store=await createLocalReportStore({directory,encryptionKey:Buffer.alloc(32,0x46),indexKey:Buffer.alloc(32,0x72),now:()=>new Date('2026-11-21T12:00:00.000Z'),validateReport:(r,v)=>{validateInterpretedReport(r);assert.deepEqual(interpretedReportVersions(r),v);return true;}});
  const request={actorId:'synthetic-pipeline-user',idempotencyKey:'synthetic-one',report,versions,expiresAt:'2026-11-22T12:00:00.000Z'},saved=await store.put(request),found=await store.get({actorId:request.actorId,recordId:saved.recordId});
  assert.equal(found.status,'FOUND');assert.equal(renderInterpretedReport(found.report),renderInterpretedReport(report));assert.deepEqual(found.report.interpretationClaims,report.interpretationClaims);assert.equal((await store.put(request)).status,'REUSED');
  const wrongVersions={...request,idempotencyKey:'bad-version',versions:{...versions,generatorVersion:'99.0.0'}};await assert.rejects(()=>store.put(wrongVersions),{code:'REPORT_STORE_REPORT_VALIDATION_FAILED'});
  const wrongFacts=clone(report);wrongFacts.basis.projection.evidence.find(n=>n.id===wrongFacts.basis.projection.candidates[0].refs.day).value.stem='乙';await assert.rejects(()=>store.put({...request,idempotencyKey:'bad-facts',report:wrongFacts}),{code:'REPORT_STORE_REPORT_VALIDATION_FAILED'});
  assert.deepEqual(await store.get({actorId:'synthetic-other-user',recordId:saved.recordId}),{status:'NOT_FOUND'});await store.remove({actorId:request.actorId,recordId:saved.recordId});assert.deepEqual(await store.get({actorId:request.actorId,recordId:saved.recordId}),{status:'NOT_FOUND'});
  const folders=await readdir(directory);assert.equal(folders.length,1);assert.deepEqual(await readdir(join(directory,folders[0])),[]);
});

test('the new adapter and CLI keep explicit selection and never authenticate a serialized pure report',()=>{
  const request=clone(SERVER_REQUEST_LITERAL_BASE),args=['--data-pack','synthetic-operator-data','--request-json',JSON.stringify(request),'--interpretation-profile',INTERPRETATION_PROFILE_ID,'--output','text','--audience','full','--voice','report','--detail','summary','--generator','deterministic'];
  assert.equal(parseInterpretedReportArgs(args).profileId,INTERPRETATION_PROFILE_ID);for(let i=0;i<args.length;i+=2){const missing=clone(args);missing.splice(i,2);assert.throws(()=>parseInterpretedReportArgs(missing),/S7_EXPLICIT_ARGUMENTS_REQUIRED/);}
  const fake=JSON.parse(JSON.stringify(makeReport()));assert.throws(()=>validateIssuedInterpretedReport(fake),/S7_ISSUED_REPORT_REQUIRED/);
  let calls=0;const service=createInterpretedReportService({calculate(){calls++;return {};}},PROFILE);const invalid={...request,time:'24:00'};assert.throws(()=>service.calculate(invalid));assert.equal(calls,0);assert.throws(()=>service.calculate(request),/ISSUED_SERVER_RESPONSE_REQUIRED/);assert.equal(calls,1);
});
