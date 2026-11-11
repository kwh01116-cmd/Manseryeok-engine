// Public fictional-calendar integration cases; these are connection checks, not source authentication.
import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createLocalChartProfile,STAGE_A_PROFILE_ID} from '../scripts/kasi/local-chart.mjs';
import {deriveLocalChartFacts,M2_LOCAL_PROFILE_ID} from '../scripts/kasi/local-chart-facts.mjs';
import {createLocalM3EvidenceProfile,deriveLocalM3Evidence,validateLocalM3Evidence,validateLocalM3EvidenceResult,validateLocalM3Explanation,renderLocalM3EvidenceText,M3_LOCAL_PROFILE_ID} from '../scripts/kasi/local-m3-evidence.mjs';
import {createLocalLuckProfile} from '../scripts/kasi/local-luck.mjs';
import {createLocalLuckProjectionProfile,CALENDAR_PROJECTION_POLICY_V02} from '../scripts/kasi/local-luck-projection.mjs';
import {M7_LUCK_POLICY_V01} from '../dist/luck/luckV01.js';
import {syntheticLocalChartCandidate,chartRequest} from './fixtures/kasi-local-chart-synthetic.mjs';
import {structuralM2Unit} from './fixtures/m3-structural-unit-input.mjs';

const fixture=syntheticLocalChartCandidate();
const createChart=()=>createLocalChartProfile(fixture.loaded,{profileId:STAGE_A_PROFILE_ID,expectedManifestSha256:fixture.expectedManifestSha256});
const settings={m2ProfileId:M2_LOCAL_PROFILE_ID,m3ProfileId:M3_LOCAL_PROFILE_ID};
const pipeline=chart=>createLocalM3EvidenceProfile(chart??createChart(),settings);
const valid=result=>{assert.equal(result.schemaVersion,'kasi-local-m3-evidence-v1');assert.equal(result.status,'EVIDENCE_ONLY');assert.equal(validateLocalM3EvidenceResult(result),true);return result;};
const glyph=p=>p.stem+p.branch;

test('local M3 computes M1 once and preserves the exact existing issued M2 facts and open gates',()=>{
  const chart=createChart();let calls=0;const measured={...chart,calculate(req){calls++;return chart.calculate(req);}};
  const request=chartRequest(),result=valid(pipeline(measured).calculate(request));
  assert.equal(calls,1);assert.deepEqual(result.executionCounts,{birthM1Calls:1,m2Derivations:1});
  const referenceM1=chart.calculate(request),referenceM2=deriveLocalChartFacts(referenceM1,{m2ProfileId:M2_LOCAL_PROFILE_ID});
  assert.deepEqual(result.m1,referenceM1);assert.deepEqual(result.facts,referenceM2);
  assert.equal(result.evidence.status,'EVIDENCE_ONLY');assert.equal(result.evidence.finalStrength.status,'NOT_IMPLEMENTED');
  assert.equal(result.validation.finalStrength,'NOT_IMPLEMENTED');assert.equal(result.validation.m3FinalInterpretationGate,'BLOCKED_UNCHANGED');
  assert.equal(result.validation.g0Receipt,null);assert.equal(result.validation.g1P2Promotion,false);assert.equal(result.validation.editionVerification,'UNVERIFIED');assert.equal(result.validation.rightsReview,'UNVERIFIED');assert.equal(result.validation.predictiveValidity,'NOT_CLAIMED');
  assert.equal(result.provenance.dataset.candidateManifestContentSha256,fixture.expectedManifestSha256);
  const c=result.evidence.candidates[0];assert.equal(c.dayMaster,'丙');assert.equal(glyph(c.monthContext.monthPillar),'癸巳');assert.equal(c.monthContext.activeSince.term,'LIXIA');
  assert.equal(c.monthContext.season.status,'UNRESOLVED');assert.equal(c.monthContext.principalHiddenMember.stem,'丙');
});

test('each M3 item traces to its own M2 facts/members, rule records and separate API evidence',()=>{
  const result=valid(pipeline().calculate(chartRequest())),evidence=result.evidence;
  const ruleIds=new Set(evidence.rules.map(r=>r.id)),sources=new Map(evidence.sources.map(s=>[s.id,s]));
  for(const candidate of evidence.candidates){
    const original=result.facts.candidates[candidate.candidateIndex],facts=new Map(original.facts.map(f=>[f.id,f]));
    const memberIds=new Set(original.facts.filter(f=>f.kind==='HIDDEN_STEMS').flatMap(f=>f.value.members.map(m=>m.id)));
    for(const item of candidate.evidence){
      assert.equal(item.candidateRef,candidate.candidateRef);assert.ok(item.inputFactRefs.length>0&&item.inputFactRefs.every(id=>facts.has(id)));
      assert.ok(item.inputMemberRefs.every(id=>memberIds.has(id)));assert.ok(item.ruleRefs.length>0&&item.ruleRefs.every(id=>ruleIds.has(id)));
      assert.ok(item.sourceRefs.every(id=>sources.has(id)));assert.ok(item.calculationSourceRefs.length>0&&item.calculationSourceRefs.every(id=>sources.get(id)?.kind==='CALENDAR_API'));
      assert.ok(item.sourceRefs.every(id=>sources.get(id)?.kind!=='CALENDAR_API'),'KASI must not become the authority for a traditional M3 rule');
    }
  }
  assert.equal(validateLocalM3Evidence(evidence,{facts:result.facts}),true);
  assert.equal(validateLocalM3Explanation(result.explanation,evidence),true);
});

test('same-day Gregorian/lunar inputs agree semantically while preserving their distinct input provenance',()=>{
  const chart=createChart(),profile=pipeline(chart),g=valid(profile.calculate(chartRequest()));
  const row=fixture.loaded.candidate.dates.find(r=>r.solarDate==='2026-06-01');
  const request={calendar:'KOREAN_LUNAR',lunarDate:{lunarYear:row.lunarYear,lunarMonth:row.lunarMonth,lunarDay:row.lunarDay,leap:row.leap},time:'12:00',policies:chartRequest().policies};
  const l=valid(profile.calculate(request));assert.deepEqual(l.m1.chart,g.m1.chart);assert.deepEqual(l.evidence.candidates,g.evidence.candidates);assert.deepEqual(l.explanation,g.explanation);
  assert.equal(g.m1.input.calendar,'GREGORIAN');assert.equal(l.m1.input.calendar,'KOREAN_LUNAR');
});

test('Lichun carries both correlated month/evidence candidates through Korean explanation',()=>{
  const result=valid(pipeline().calculate(chartRequest('2026-02-05','01:20')));
  assert.equal(result.m1.chart.confidence,'PUBLISHED_MINUTE_AMBIGUOUS');assert.equal(result.evidence.candidates.length,2);assert.equal(result.explanation.candidates.length,2);
  const [before,after]=result.evidence.candidates;
  assert.equal(glyph(before.monthContext.monthPillar),'己丑');assert.equal(glyph(after.monthContext.monthPillar),'庚寅');
  assert.equal(before.monthContext.activeSince.term,'XIAOHAN');assert.equal(after.monthContext.activeSince.term,'LICHUN');
  assert.deepEqual(before.monthContext.hiddenMembers.map(a=>a.stem),['己','癸','辛']);assert.deepEqual(after.monthContext.hiddenMembers.map(a=>a.stem),['甲','丙','戊']);
  for(let i=0;i<2;i++)for(const item of result.evidence.candidates[i].evidence){assert.equal(item.candidateRef,'chart.candidates['+i+']');assert.ok(item.inputFactRefs.every(id=>id.startsWith('chart.candidates['+i+']#')));}
  const text=renderLocalM3EvidenceText(result);assert.match(text,/후보 1/);assert.match(text,/후보 2/);assert.match(text,/미확정|후보|절입/);assert.match(text,/NOT_IMPLEMENTED/);
  assert.match(result.explanation.candidates[0].items[0].text,/출생 입력과 같은 표시 분에 놓인 절입의 전 조건에 해당하는 후보입니다/);
  assert.match(result.explanation.candidates[1].items[0].text,/출생 입력과 같은 표시 분에 놓인 절입의 후 조건에 해당하는 후보입니다/);
  assert.equal(text,readFileSync(new URL('./fixtures/m3-evidence-boundary-synthetic.txt',import.meta.url),'utf8'),'manually reviewed fictional boundary prose and refs');
});

test('M3 is natal-only and does not change with traditional sex, luck features or nominal as-of choices',()=>{
  const chart=createChart(),request=chartRequest();
  const old=createLocalLuckProfile(chart,{luckPolicyId:M7_LUCK_POLICY_V01,m2ProfileId:M2_LOCAL_PROFILE_ID}).calculate(request,{dayun:{traditionalSex:'MALE',count:10}});
  const extended=createLocalLuckProjectionProfile(chart,{luckPolicyId:M7_LUCK_POLICY_V01,calendarProjectionPolicyId:CALENDAR_PROJECTION_POLICY_V02,m2ProfileId:M2_LOCAL_PROFILE_ID});
  const female=extended.calculate(request,{dayun:{traditionalSex:'FEMALE',count:3}},{asOfMinute:'2026-11-01T12:00'});
  const male=extended.calculate(request,{dayun:{traditionalSex:'MALE',count:20},seyun:{yearLabel:2027}},{asOfMinute:'2026-12-31T23:59'});
  const facts=[old.baseExplanation.facts,female.m7.baseExplanation.facts,male.m7.baseExplanation.facts];
  const evidence=facts.map(f=>deriveLocalM3Evidence(f,{m3ProfileId:M3_LOCAL_PROFILE_ID}));
  assert.deepEqual(evidence[0],evidence[1]);assert.deepEqual(evidence[0],evidence[2]);
  assert.throws(()=>validateLocalM3Evidence(evidence[0],{facts:facts[1]}),'identical semantic content does not erase the same-execution fact receipt');
});

test('issued M2 context, supported policies and valid birth input are required without fake fallbacks',()=>{
  const chart=createChart();let calls=0;const measured={...chart,calculate(req){calls++;return chart.calculate(req);}};
  for(const m3ProfileId of [undefined,'','AUTO','M3_FINAL_STRENGTH'])assert.throws(()=>createLocalM3EvidenceProfile(measured,{...settings,m3ProfileId}));
  for(const m2ProfileId of [undefined,'','AUTO'])assert.throws(()=>createLocalM3EvidenceProfile(measured,{...settings,m2ProfileId}));
  assert.equal(calls,0);
  assert.throws(()=>deriveLocalM3Evidence(structuralM2Unit(),{m3ProfileId:M3_LOCAL_PROFILE_ID}),'structural unit JSON is deliberately not an authenticated local M2 result');
  const profile=pipeline(measured),normal=valid(profile.calculate(chartRequest()));
  assert.throws(()=>deriveLocalM3Evidence(structuredClone(normal.facts),{m3ProfileId:M3_LOCAL_PROFILE_ID}));
  const outside=profile.calculate(chartRequest('2025-12-31','12:00'));assert.equal(outside.status,'OUT_OF_PROFILE_COVERAGE');assert.equal(outside.evidence,null);assert.equal(outside.explanation,null);
  assert.throws(()=>profile.calculate({...chartRequest(),time:undefined}));
  const wrong={...chart,calculate(req){const value=chart.calculate(req);value.evidence.yearBoundary.original.time='MODIFIED';return value;}};
  assert.throws(()=>pipeline(wrong).calculate(chartRequest()));
});

test('candidate/output/provenance tampering is rejected and cannot contaminate another request',()=>{
  const profile=pipeline(),request=chartRequest('2026-02-05','01:20'),result=valid(profile.calculate(request));
  assert.ok(Object.isFrozen(result));assert.ok(Object.isFrozen(result.evidence));assert.ok(Object.isFrozen(result.m1));
  assert.throws(()=>{result.m1.evidence.yearBoundary.original.time='MODIFIED';},TypeError);
  assert.throws(()=>{result.evidence.candidates[0].dayMaster='癸';},TypeError);
  for(const mutate of [
    x=>{x.evidence.candidates[0].candidateRef='chart.candidates[1]';},
    x=>{x.provenance.dataset.candidateManifestContentSha256='0'.repeat(64);},
    x=>{x.facts=structuredClone(profile.calculate(chartRequest()).facts);},
    x=>{x.evidence=structuredClone(profile.calculate(chartRequest()).evidence);},
  ]){const forged=structuredClone(result);mutate(forged);assert.throws(()=>validateLocalM3EvidenceResult(forged));}
  const view=structuredClone(result.explanation);view.candidates[0].items[0].evidenceRefs=[view.candidates[1].items[0].evidenceRefs[0]];assert.throws(()=>validateLocalM3Explanation(view,result.evidence));
  const fresh=valid(profile.calculate(request));assert.deepEqual(fresh,result);
});

test('normal, repeated and overlapping classifications remain evidence in text without a final strength result',()=>{
  const profile=pipeline(),normal=valid(profile.calculate(chartRequest())),overlap=valid(profile.calculate(chartRequest('2026-01-01','16:30')));
  assert.equal(normal.evidence.candidates[0].relationContext.effectStatus,'UNRESOLVED');
  assert.deepEqual(overlap.evidence.candidates[0].relationContext.pairs.filter(r=>r.leftPillarRole==='year'&&r.rightPillarRole==='hour').map(r=>r.kind),['LIUHE','LIUPO','XING']);
  for(const result of [normal,overlap]){
    const text=renderLocalM3EvidenceText(result);assert.match(text,/M3 Evidence/);assert.match(text,/EVIDENCE_ONLY/);assert.match(text,/NOT_IMPLEMENTED/);assert.match(text,/근거/);assert.match(text,/명리·정의 출처/);assert.match(text,/계산 출처/);
    assert.equal(result.evidence.finalStrength.status,'NOT_IMPLEMENTED');
  }
  assert.equal(renderLocalM3EvidenceText(normal),readFileSync(new URL('./fixtures/m3-evidence-ordinary-synthetic.txt',import.meta.url),'utf8'),'manually reviewed fictional ordinary prose and refs');
});
