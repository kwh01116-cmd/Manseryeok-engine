// Synthetic response fixtures test execution continuity, not real KASI calendar/source accuracy.
import test from 'node:test';
import assert from 'node:assert/strict';
import {createLocalChartProfile,STAGE_A_PROFILE_ID} from '../scripts/kasi/local-chart.mjs';
import {M2_LOCAL_PROFILE_ID} from '../scripts/kasi/local-chart-facts.mjs';
import {createLocalM3EvidenceProfile,deriveLocalM3RootJudgments,validateLocalM3RootJudgments,validateLocalM3EvidenceResult,renderLocalM3EvidenceText,M3_LOCAL_PROFILE_ID,M3_ROOT_POLICY_ID,M3_SEASONAL_POLICY_ID,M3_SEASONAL_SILI_POLICY_ID} from '../scripts/kasi/local-m3-evidence.mjs';
import {validateM3RootPresenceExplanation} from '../dist/m3/rootPresenceV1.js';
import {syntheticLocalChartCandidate,chartRequest} from './fixtures/kasi-local-chart-synthetic.mjs';

const fixture=syntheticLocalChartCandidate(),settings={m2ProfileId:M2_LOCAL_PROFILE_ID,m3ProfileId:M3_LOCAL_PROFILE_ID};
const chart=()=>createLocalChartProfile(fixture.loaded,{profileId:STAGE_A_PROFILE_ID,expectedManifestSha256:fixture.expectedManifestSha256});
const selected=(seasonalPolicyId,base=chart())=>createLocalM3EvidenceProfile(base,{...settings,rootPolicyId:M3_ROOT_POLICY_ID,...(seasonalPolicyId?{seasonalPolicyId}:{})});
const target=(r,role,i=0)=>r.root.candidates[i].targets.find(t=>t.target.pillarRole===role);
function lunarRequest(date,time='12:00'){
  const row=fixture.loaded.candidate.dates.find(r=>r.solarDate===date);
  return {calendar:'KOREAN_LUNAR',lunarDate:{lunarYear:row.lunarYear,lunarMonth:row.lunarMonth,lunarDay:row.lunarDay,leap:row.leap},time,policies:chartRequest().policies};
}

test('root option reuses one issued M1/M2/M3 and preserves unselected public fields',()=>{
  const base=chart();let calls=0;const spy={...base,calculate(req){calls++;return base.calculate(req);}};
  const p=createLocalM3EvidenceProfile(spy,{...settings,rootPolicyId:M3_ROOT_POLICY_ID,contextProfile:base}),req=chartRequest(),actual=p.calculate(req),old=createLocalM3EvidenceProfile(base,settings).calculate(req);
  assert.equal(calls,1);assert.deepEqual(actual.executionCounts,{birthM1Calls:1,m2Derivations:1});
  for(const key of ['m1','facts','evidence','explanation','validation','provenance'])assert.deepEqual(actual[key],old[key]);
  assert.equal(old.root,undefined);assert.equal(old.rootExplanation,undefined);assert.equal(actual.schemaVersion,'kasi-local-m3-evidence-root-v1');assert.equal(actual.root.status,'RESOLVED_UNDER_POLICY');
  const before=calls,again=deriveLocalM3RootJudgments(actual.evidence,{rootPolicyId:M3_ROOT_POLICY_ID});assert.equal(calls,before);assert.deepEqual(again,actual.root);assert.equal(validateLocalM3RootJudgments(again,{evidence:actual.evidence}),true);assert.equal(validateLocalM3EvidenceResult(actual),true);
});

test('four visible targets preserve same characters by position, own roots and resource absence',()=>{
  const r=selected().calculate(chartRequest());
  assert.deepEqual(['year','month','day','hour'].map(role=>r.m1.chart.candidates[0][role]),[{stem:'丙',branch:'午'},{stem:'癸',branch:'巳'},{stem:'丙',branch:'午'},{stem:'甲',branch:'午'}]);
  assert.deepEqual(r.root.candidates[0].targets.map(t=>[t.target.pillarRole,t.target.stem,t.chartRootPresence]),[['year','丙','PRESENT_UNDER_POLICY'],['month','癸','ABSENT_UNDER_POLICY'],['day','丙','PRESENT_UNDER_POLICY'],['hour','甲','ABSENT_UNDER_POLICY']]);
  const dm=target(r,'day'),year=target(r,'year');assert.notEqual(dm.id,year.id);assert.notEqual(dm.target.locationId,year.target.locationId);
  assert.deepEqual(dm.branches.map(b=>b.matches.map(m=>[m.hidden.stem,m.matchType])),[[['丁','SAME_ELEMENT_DIFFERENT_STEM']],[['丙','EXACT_STEM']],[['丁','SAME_ELEMENT_DIFFERENT_STEM']],[['丁','SAME_ELEMENT_DIFFERENT_STEM']]]);
  assert.equal(dm.branches[2].matches[0].samePillar,true,'Day branch hidden member remains eligible');
  assert.equal(target(r,'hour').target.tenGod,'偏印');assert.equal(target(r,'month').target.tenGod,'正官');
  assert.deepEqual(r.root.candidates[0].supportStems.map(s=>[s.location.pillarRole,s.tenGod,s.supportKind,s.chartRootPresence]),[['year','比肩','PEER','PRESENT_UNDER_POLICY'],['hour','偏印','RESOURCE','ABSENT_UNDER_POLICY']]);
  assert.ok(r.root.candidates[0].supportStems.every(s=>s.location.pillarRole!=='day'));assert.equal(dm.rootEfficacy,'NOT_EVALUATED');assert.equal(dm.rootStrength,'NOT_EVALUATED');assert.equal(r.evidence.finalStrength.status,'NOT_IMPLEMENTED');assert.equal(r.validation.m3FinalInterpretationGate,'BLOCKED_UNCHANGED');
});

test('equivalent solar/lunar requests retain root meaning while their conversion records remain distinct',()=>{
  const p=selected(M3_SEASONAL_SILI_POLICY_ID),g=p.calculate(chartRequest()),l=p.calculate(lunarRequest('2026-06-01'));
  for(const key of ['candidates','rules','policy','rootEfficacy','rootStrength','finalStrength','validation'])assert.deepEqual(g.root[key],l.root[key]);assert.deepEqual(g.root.sources.map(s=>[s.id,s.kind]),l.root.sources.map(s=>[s.id,s.kind]));assert.deepEqual(g.rootExplanation,l.rootExplanation);assert.deepEqual(g.seasonal,l.seasonal);
  assert.equal(g.m1.evidence.dateConversion.method,'GREGORIAN_WITH_API_OBSERVED_DATE_EVIDENCE');assert.equal(l.m1.evidence.dateConversion.method,'API_OBSERVED_DATE_INDEX');
  assert.notEqual(g.m1.input.calendar,l.m1.input.calendar);assert.deepEqual(g.m1.chart,l.m1.chart);
});

test('B same-minute seasonal alternatives share exactly one natal/root result without a new chart',()=>{
  const p=selected(M3_SEASONAL_SILI_POLICY_ID); // Fictional Lixia May5 01:20, B April17 01:20.
  const before=p.calculate(chartRequest('2026-04-17','01:19')),at=p.calculate(chartRequest('2026-04-17','01:20')),after=p.calculate(chartRequest('2026-04-17','01:21'));
  for(const r of [before,at,after]){assert.equal(r.m1.chart.candidates.length,1);assert.equal(r.root.candidates.length,1);assert.equal(r.root.candidates[0].targets.length,4);}
  assert.deepEqual(before.m1.chart.candidates,at.m1.chart.candidates);assert.deepEqual(at.m1.chart.candidates,after.m1.chart.candidates);assert.deepEqual(before.root,at.root);assert.deepEqual(at.root,after.root);assert.deepEqual(before.rootExplanation,at.rootExplanation);
  assert.deepEqual(at.seasonal.candidates[0].judgment.alternatives.map(a=>a.season),['SPRING','EARTH_DOMINANT']);assert.equal(at.seasonal.candidates[0].judgment.status,'AMBIGUOUS');
  assert.match(renderLocalM3EvidenceText(at),/통근/);assert.match(renderLocalM3EvidenceText(at),/원국 후보는 유지/);
});

test('published Lichun parents retain separate visible/hidden locations, roots and seasonal meanings',()=>{
  const r=selected(M3_SEASONAL_SILI_POLICY_ID).calculate(chartRequest('2026-02-05','01:20'));
  assert.equal(r.m1.chart.candidates.length,2);assert.equal(r.root.candidates.length,2);assert.deepEqual(r.m1.chart.candidates.map(c=>c.month.branch),['丑','寅']);
  assert.deepEqual(r.seasonal.candidates.map(c=>c.judgment.season),['EARTH_DOMINANT','SPRING']);
  for(const c of r.root.candidates){
    const ref='chart.candidates['+c.candidateIndex+']';assert.equal(c.candidateRef,ref);assert.equal(c.targets.length,4);
    for(const t of c.targets){assert.equal(t.target.candidateRef,ref);assert.equal(t.target.stem,r.m1.chart.candidates[c.candidateIndex][t.target.pillarRole].stem);for(const b of t.branches)for(const m of b.matches)assert.equal(m.hidden.candidateRef,ref);}
  }
  assert.notDeepEqual(r.root.candidates[0].targets.map(t=>t.branches.map(b=>b.matches.map(m=>m.hidden.stem))),r.root.candidates[1].targets.map(t=>t.branches.map(b=>b.matches.map(m=>m.hidden.stem))));
});

test('root-only, seasonal v1 and seasonal v2 are independent selected layers',()=>{
  const base=chart(),req=chartRequest('2026-04-20'),alone=selected(undefined,base).calculate(req),v1=selected(M3_SEASONAL_POLICY_ID,base).calculate(req),v2=selected(M3_SEASONAL_SILI_POLICY_ID,base).calculate(req);
  assert.equal(alone.seasonal,undefined);assert.equal(v1.seasonal.candidates[0].judgment.status,'POLICY_UNRESOLVED');assert.equal(v2.seasonal.candidates[0].judgment.status,'RESOLVED_UNDER_POLICY');
  assert.deepEqual(alone.root,v1.root);assert.deepEqual(v1.root,v2.root);assert.deepEqual(alone.rootExplanation,v2.rootExplanation);
  assert.equal(v1.schemaVersion,'kasi-local-m3-evidence-seasonal-root-v1');assert.equal(v2.schemaVersion,'kasi-local-m3-evidence-seasonal-root-v1');
});

test('same-process root/parent references reject clones, cross-requests, sparse arrays and changed templates',()=>{
  const p=selected(M3_SEASONAL_SILI_POLICY_ID),first=p.calculate(chartRequest('2026-02-05','01:20')),other=p.calculate(chartRequest('2026-06-01'));
  assert.throws(()=>deriveLocalM3RootJudgments(structuredClone(first.evidence),{rootPolicyId:M3_ROOT_POLICY_ID}));
  assert.throws(()=>validateLocalM3RootJudgments(first.root,{evidence:other.evidence}));
  assert.throws(()=>{first.root.candidates[0].targets[0].branches[0].matches.push({});},TypeError);
  for(const change of [r=>{r.candidates[0]=r.candidates[1];},r=>{delete r.candidates[0].targets[0];},r=>{r.candidates[0].targets[0].branches[0].matches.push(r.candidates[0].targets[0].branches[0].matches[0]);}]){const forged=structuredClone(first.root);change(forged);assert.throws(()=>validateLocalM3RootJudgments(forged,{evidence:first.evidence}));}
  const forged=structuredClone(first),changed=structuredClone(first.rootExplanation);forged.root=other.root;assert.throws(()=>validateLocalM3EvidenceResult(forged));
  changed.candidates[0].items[0].text='신강이므로 성공합니다.';assert.throws(()=>validateM3RootPresenceExplanation(changed,first.root));
  const broken=structuredClone(first.rootExplanation);delete broken.candidates[0].items[0];assert.throws(()=>validateM3RootPresenceExplanation(broken,first.root));
  assert.deepEqual(p.calculate(chartRequest('2026-02-05','01:20')),first);
});

test('missing/unsupported root policy is rejected and old seasonal-only schemas remain exact',()=>{
  const base=chart(),plain=createLocalM3EvidenceProfile(base,settings).calculate(chartRequest()),v1=createLocalM3EvidenceProfile(base,{...settings,seasonalPolicyId:M3_SEASONAL_POLICY_ID}).calculate(chartRequest()),v2=createLocalM3EvidenceProfile(base,{...settings,seasonalPolicyId:M3_SEASONAL_SILI_POLICY_ID}).calculate(chartRequest());
  assert.equal(plain.schemaVersion,'kasi-local-m3-evidence-v1');assert.equal(v1.schemaVersion,'kasi-local-m3-evidence-seasonal-v1');assert.equal(v2.schemaVersion,'kasi-local-m3-evidence-seasonal-v2');
  assert.throws(()=>createLocalM3EvidenceProfile(base,{...settings,rootPolicyId:'AUTO'}));assert.throws(()=>deriveLocalM3RootJudgments(plain.evidence,{}));
  for(const r of [plain,v1,v2]){assert.equal(r.root,undefined);assert.equal(r.rootExplanation,undefined);assert.equal(validateLocalM3EvidenceResult(r),true);}
});
