// Generated fictional data test execution continuity, not independent KASI calendar accuracy.
import test from 'node:test';
import assert from 'node:assert/strict';
import {createLocalChartProfile,STAGE_A_PROFILE_ID,getLocalChartEventContext} from '../scripts/kasi/local-chart.mjs';
import {M2_LOCAL_PROFILE_ID} from '../scripts/kasi/local-chart-facts.mjs';
import {createLocalM3EvidenceProfile,deriveLocalM3SeasonalJudgments,validateLocalM3SeasonalJudgments,validateLocalM3EvidenceResult,renderLocalM3EvidenceText,M3_LOCAL_PROFILE_ID,M3_SEASONAL_POLICY_ID,M3_SEASONAL_SILI_POLICY_ID} from '../scripts/kasi/local-m3-evidence.mjs';
import {syntheticLocalChartCandidate,chartRequest} from './fixtures/kasi-local-chart-synthetic.mjs';
const fixture=syntheticLocalChartCandidate(),settings={m2ProfileId:M2_LOCAL_PROFILE_ID,m3ProfileId:M3_LOCAL_PROFILE_ID};
const chart=()=>createLocalChartProfile(fixture.loaded,{profileId:STAGE_A_PROFILE_ID,expectedManifestSha256:fixture.expectedManifestSha256});
const profile=(id=M3_SEASONAL_SILI_POLICY_ID,base=chart())=>createLocalM3EvidenceProfile(base,{...settings,seasonalPolicyId:id});
const judgment=r=>r.seasonal.candidates[0].judgment;
function lunarRequest(date,time='12:00'){
  const row=fixture.loaded.candidate.dates.find(r=>r.solarDate===date);
  return {calendar:'KOREAN_LUNAR',lunarDate:{lunarYear:row.lunarYear,lunarMonth:row.lunarMonth,lunarDay:row.lunarDay,leap:row.leap},time,policies:chartRequest().policies};
}
test('v02 optional context preserves original M1/M2/M3 and both unselected and v01 results',()=>{
  const base=chart();let calls=0;const spy={...base,calculate(req){calls++;return base.calculate(req);}};
  const p=createLocalM3EvidenceProfile(spy,{...settings,seasonalPolicyId:M3_SEASONAL_SILI_POLICY_ID,contextProfile:base});
  const req=chartRequest(),selected=p.calculate(req),old=createLocalM3EvidenceProfile(base,settings).calculate(req),v1=profile(M3_SEASONAL_POLICY_ID,base).calculate(req);
  assert.equal(calls,1);assert.deepEqual(selected.executionCounts,{birthM1Calls:1,m2Derivations:1});
  for(const k of ['m1','facts','evidence','explanation','validation','provenance'])assert.deepEqual(selected[k],old[k]);
  assert.deepEqual(selected.m1,v1.m1);assert.equal(selected.schemaVersion,'kasi-local-m3-evidence-seasonal-v2');
  assert.equal(judgment(selected).seasonalState,judgment(v1).seasonalState);assert.equal(judgment(selected).nextSili,null);
  assert.equal(validateLocalM3EvidenceResult(selected),true);assert.equal(selected.seasonal.calculationSources.length,0);
  const e=createLocalM3EvidenceProfile(base,settings).calculate(chartRequest('2026-04-20'));
  assert.throws(()=>deriveLocalM3SeasonalJudgments(e.evidence,{seasonalPolicyId:M3_SEASONAL_SILI_POLICY_ID}),/ISSUED_BIRTH/);
});
test('same parent at B has two seasonal alternatives and unchanged natal pillars',()=>{
  const p=profile(); // Fictional Lixia 2026-05-05 01:20 -> B 2026-04-17 01:20.
  const before=p.calculate(chartRequest('2026-04-17','01:19')),at=p.calculate(chartRequest('2026-04-17','01:20')),after=p.calculate(chartRequest('2026-04-17','01:21'));
  for(const r of [before,at,after])assert.equal(r.m1.chart.candidates.length,1);
  assert.deepEqual(before.m1.chart.candidates,at.m1.chart.candidates);assert.deepEqual(at.m1.chart.candidates,after.m1.chart.candidates);
  assert.equal(judgment(before).season,'SPRING');assert.equal(judgment(after).season,'EARTH_DOMINANT');
  const j=judgment(at);assert.equal(j.status,'AMBIGUOUS');assert.equal(j.seasonalState,null);assert.equal(j.alternatives.length,2);
  assert.deepEqual(j.alternatives.map(a=>a.season),['SPRING','EARTH_DOMINANT']);
  assert.ok(j.alternatives.every(a=>a.parentCandidateRef===j.candidateRef));
  assert.equal(j.derivedBoundary.displayedDateTime,'2026-04-17T01:20');assert.equal(j.derivedBoundary.sourceKind,'DERIVED_PROJECT_BOUNDARY_NOT_PUBLISHED_KASI_TERM');
  assert.ok(!at.seasonal.calculationSources.some(s=>s.original.termCode==='DERIVED'));
  assert.match(renderLocalM3EvidenceText(at),/원국 후보는 유지/);
});
test('every S and T minute uses existing parent pre/post correlation without a Cartesian product',()=>{
  const p=profile();
  for(const [s,t,previous,next]of [['2026-04-05','2026-05-05','SPRING','SUMMER'],['2026-07-05','2026-08-05','SUMMER','AUTUMN'],['2026-10-05','2026-11-05','AUTUMN','WINTER'],['2026-01-05','2026-02-05','WINTER','SPRING']]){
    const start=p.calculate(chartRequest(s,'01:20')),end=p.calculate(chartRequest(t,'01:20'));
    assert.equal(start.seasonal.candidates.length,2);assert.equal(end.seasonal.candidates.length,2);
    assert.deepEqual(start.seasonal.candidates.map(c=>c.judgment.season),[previous,previous]);
    assert.deepEqual(end.seasonal.candidates.map(c=>c.judgment.season),['EARTH_DOMINANT',next]);
    assert.ok(end.seasonal.candidates.every(c=>c.judgment.alternatives.length===1));
    const pre=p.calculate(chartRequest(t,'01:19')),post=p.calculate(chartRequest(t,'01:21'));
    assert.equal(judgment(pre).season,'EARTH_DOMINANT');assert.equal(judgment(post).season,next);
  }
  const j=judgment(p.calculate(chartRequest('2026-01-20')));
  assert.equal(j.nextSili.displayedDateTime.slice(0,4),'2026','January Chou ends at February of same civil year');
});
test('T source proofs stay separate from original structural sources and derive only B',()=>{
  const base=chart(),p=profile(M3_SEASONAL_SILI_POLICY_ID,base),r=p.calculate(chartRequest('2026-04-20'));
  const j=judgment(r),proofs=new Map(r.seasonal.calculationSources.map(s=>[s.id,s]));
  assert.equal(j.appliedJie.term,'QINGMING');assert.equal(j.nextSili.term,'LIXIA');
  const context=getLocalChartEventContext(base);
  for(const id of j.nextSili.sourceIds){
    assert.deepEqual(proofs.get(id),context.evidence.find(e=>e.id===id));
    assert.equal(proofs.get(id).source.operation,'get24DivisionsInfo');
    assert.equal(proofs.get(id).original.timeBasis,'API_KST_AS_PUBLISHED');
    assert.equal(proofs.get(id).original.historicalCivilTime,'NOT_RESOLVED');
    assert.ok(j.calculationSourceRefs.includes(id));
  }
  assert.deepEqual(j.input.base.calculationSourceRefs,r.evidence.candidates[0].evidence.find(e=>e.kind==='MONTH_CONTEXT').calculationSourceRefs);
  assert.equal(r.evidence.candidates[0].monthContext.season.status,'UNRESOLVED');
  assert.equal(r.validation.finalStrength,'NOT_IMPLEMENTED');assert.equal(r.validation.g1P2Promotion,false);
});
test('solar/lunar, calendar numbers, mid-Qi and v01 four-month deferral remain independent',()=>{
  const p=profile(),v1=profile(M3_SEASONAL_POLICY_ID);
  for(const date of ['2026-04-10','2026-04-20','2026-04-17']){
    const g=p.calculate(chartRequest(date)),l=p.calculate(lunarRequest(date));assert.deepEqual(g.seasonal,l.seasonal);
    assert.equal(judgment(v1.calculate(chartRequest(date))).status,'POLICY_UNRESOLVED');
  }
  assert.equal(judgment(p.calculate(chartRequest('2026-04-01'))).monthBranch,'卯');
  const a=judgment(p.calculate(chartRequest('2026-04-20','01:19'))),b=judgment(p.calculate(chartRequest('2026-04-20','01:21')));
  assert.deepEqual(a.elementStates,b.elementStates);assert.equal(a.nextSili.term,'LIXIA');
  assert.equal(judgment(p.calculate(chartRequest('2026-03-06'))).dayMaster,'己');
});
test('same-process issuance, policy and cross-request/candidate/source tampering fail closed',()=>{
  const p=profile(),first=p.calculate(chartRequest('2026-02-05','01:20')),other=p.calculate(chartRequest('2026-04-20'));
  assert.deepEqual(deriveLocalM3SeasonalJudgments(first.evidence,{seasonalPolicyId:M3_SEASONAL_SILI_POLICY_ID}),first.seasonal);
  assert.throws(()=>deriveLocalM3SeasonalJudgments(structuredClone(first.evidence),{seasonalPolicyId:M3_SEASONAL_SILI_POLICY_ID}));
  assert.throws(()=>validateLocalM3SeasonalJudgments(first.seasonal,{evidence:other.evidence}));
  const forged=structuredClone(first);forged.seasonal.candidates[0]=forged.seasonal.candidates[1];assert.throws(()=>validateLocalM3EvidenceResult(forged));
  assert.throws(()=>{first.seasonal.candidates[0].judgment.nextSili.sourceIds[0]='FORGED';},TypeError);
  assert.throws(()=>createLocalM3EvidenceProfile(chart(),{...settings,seasonalPolicyId:'AUTO'}));
  assert.throws(()=>createLocalM3EvidenceProfile({...chart()},{...settings,seasonalPolicyId:M3_SEASONAL_SILI_POLICY_ID}));
  assert.deepEqual(p.calculate(chartRequest('2026-02-05','01:20')),first);
});
