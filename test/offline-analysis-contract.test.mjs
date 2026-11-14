// Contract pinning only; synthetic calendar evidence is not a KASI oracle.
import test from 'node:test';
import assert from 'node:assert/strict';
import {createLocalChartProfile,STAGE_A_PROFILE_ID} from '../scripts/kasi/local-chart.mjs';
import {createLocalExplanationProfile} from '../scripts/kasi/local-explain.mjs';
import {M2_LOCAL_PROFILE_ID} from '../scripts/kasi/local-chart-facts.mjs';
import {createLocalM3EvidenceProfile,M3_SYNTHESIS_PROFILE_ID,M4_POSITION_PROFILE_ID} from '../scripts/kasi/local-m3-evidence.mjs';
import {createExperimentalWeightedProfile,WEIGHTED_SUPPORT_POLICY_ID} from '../scripts/experimental/weighted-support.mjs';
import {syntheticLocalChartCandidate,chartRequest} from './fixtures/kasi-local-chart-synthetic.mjs';
import {calculateOffline,OFFLINE_RESULT_SCHEMA} from '../scripts/offline/run.mjs';

const fixture=syntheticLocalChartCandidate();
const base=()=>createLocalChartProfile(fixture.loaded,{profileId:STAGE_A_PROFILE_ID,expectedManifestSha256:fixture.expectedManifestSha256});
const legacy=b=>createLocalM3EvidenceProfile(b,{contextProfile:b,synthesisProfileId:M3_SYNTHESIS_PROFILE_ID,positionProfileId:M4_POSITION_PROFILE_ID});
const serialized=v=>JSON.parse(JSON.stringify(v));
function minimumCalculation(v){
  assert.equal(v.status,'OK');assert.equal(v.profile.id,STAGE_A_PROFILE_ID);
  assert.equal(typeof v.dataset.id,'string');assert.equal(v.dataset.candidateManifestContentSha256,fixture.expectedManifestSha256);
  assert.match(v.input.gregorianDate,/^2026-\d{2}-\d{2}$/);assert.match(v.input.time,/^\d{2}:\d{2}$/);
  for(const key of ['clock','dayRollover','hourStemReference','boundary']){assert.equal(typeof v.policies[key].id,'string');assert.equal(typeof v.policies[key].version,'string');}
  assert.ok(v.chart.candidates.length>=1);for(const c of v.chart.candidates)for(const role of ['year','month','day','hour']){assert.equal(typeof c[role].stem,'string');assert.equal(typeof c[role].branch,'string');}
  assert.ok(v.evidence.appliedJie.length>0);assert.equal(typeof v.evidence.dateConversion.sourceRef,'string');assert.ok(v.limits.includes('REDISTRIBUTION_REVIEW_OPEN'));
}
function minimumAnalysis(v){
  minimumCalculation(v.m1);assert.equal(v.status,'EVIDENCE_ONLY');assert.equal(v.validation.finalStrength,'NOT_IMPLEMENTED');
  assert.equal(v.validation.g0Receipt,null);assert.equal(v.validation.g1P2Promotion,false);
  assert.equal(v.facts.candidates.length,v.m1.chart.candidates.length);
  for(const [i,c] of v.facts.candidates.entries()){
    assert.equal(c.id,`chart.candidates[${i}]`);assert.deepEqual(c.pillars.map(p=>p.role),['year','month','day','hour']);
    assert.ok(c.facts.length>0);for(const f of c.facts){assert.equal(f.candidateRef,c.id);assert.ok(f.ruleRefs.length>0);assert.ok(f.calculationSourceRefs.length>0);}
  }
  assert.ok(v.researchSynthesis.candidates.every(c=>c.paths.length>0));
  assert.equal(v.provenance.dataset.candidateManifestContentSha256,fixture.expectedManifestSha256);
}
test('offline consumer contract preserves required existing JSON paths without adding default scores',()=>{
  const chart=base(),request=chartRequest();minimumCalculation(serialized(chart.calculate(request)));
  const explained=serialized(createLocalExplanationProfile(chart,{m2ProfileId:M2_LOCAL_PROFILE_ID}).calculate(request));
  minimumCalculation(explained.m1);assert.ok(explained.explanation.candidates[0].items.length>0);
  const evidence=serialized(legacy(chart).calculate(request));minimumAnalysis(evidence);
  for(const v of [explained,evidence]){assert.equal(Object.hasOwn(v,'experimental'),false);assert.equal(Object.hasOwn(v,'policyClassification'),false);}
});
test('experimental JSON exposes versioned decisions alongside an unchanged existing result',()=>{
  const chart=base(),request=chartRequest(),value=createExperimentalWeightedProfile(chart,{contextProfile:chart,policyId:WEIGHTED_SUPPORT_POLICY_ID}).calculate(request);
  const data=serialized(value);minimumAnalysis(data.existing);assert.deepEqual(data.existing,serialized(legacy(base()).calculate(request)));
  assert.equal(data.policy.policyId,WEIGHTED_SUPPORT_POLICY_ID);assert.equal(data.policy.policyVersion,'0.1.0');assert.equal(data.executionCounts.birthM1Calls,1);
  for(const [i,r] of data.experimental.entries()){
    assert.equal(r.candidateRef,`chart.candidates[${i}]`);assert.equal(r.status,'CLASSIFIED_UNDER_HEURISTIC_POLICY');
    for(const key of ['sourceRefs','assumptions','limitations'])assert.ok(r.policy[key].length>0);
    assert.equal(r.inputFacts.length,4);assert.equal(r.decisionTrace.length,8);assert.deepEqual(r.alternatives,[]);
  }
});
test('serialized parent candidates and seasonal alternatives stay separate scopes',()=>{
  const b=base(),selected=createExperimentalWeightedProfile(b,{contextProfile:b,policyId:WEIGHTED_SUPPORT_POLICY_ID});
  const lichun=serialized(selected.calculate(chartRequest('2026-02-05','01:20')));
  minimumAnalysis(lichun.existing);assert.equal(lichun.existing.m1.chart.candidates.length,2);assert.equal(lichun.experimental.length,2);
  const earth=serialized(selected.calculate(chartRequest('2026-04-17','01:20')));
  assert.equal(earth.existing.m1.chart.candidates.length,1);assert.equal(earth.existing.seasonal.candidates[0].judgment.alternatives.length,2);assert.equal(earth.experimental.length,1);
  assert.deepEqual(earth.experimental.map(c=>c.candidateRef),['chart.candidates[0]']);
});
test('offline wrapper adds only its version/mode and keeps all existing data unchanged',()=>{
  for(const mode of ['chart','explain','evidence','experimental']){
    const b=base(),request=chartRequest();let calls=0;
    const observed={...b,calculate(r){calls++;return b.calculate(r);}};
    const options={request,m2ProfileId:M2_LOCAL_PROFILE_ID,synthesisProfileId:M3_SYNTHESIS_PROFILE_ID,positionProfileId:M4_POSITION_PROFILE_ID,policyId:WEIGHTED_SUPPORT_POLICY_ID};
    // Seasonal event context requires the actual issued profile. Spy wrapping is
    // valid for chart/explain; evidence/experimental retain issuance identity.
    const canSpy=mode==='chart'||mode==='explain';
    const value=calculateOffline({mode,options,chartProfile:canSpy?observed:b});
    if(canSpy)assert.equal(calls,1);else assert.equal(value.data.executionCounts.birthM1Calls,1);
    assert.equal(value.schemaVersion,OFFLINE_RESULT_SCHEMA);assert.equal(value.mode,mode);assert.deepEqual(Object.keys(value),['schemaVersion','mode','data']);
    const reference=base();const data=mode==='chart'?reference.calculate(request):mode==='explain'?createLocalExplanationProfile(reference,options).calculate(request):mode==='evidence'?legacy(reference).calculate(request):createExperimentalWeightedProfile(reference,{contextProfile:reference,policyId:WEIGHTED_SUPPORT_POLICY_ID}).calculate(request);
    assert.deepEqual(serialized(value.data),serialized(data));
    if(mode!=='experimental')assert.equal(Object.hasOwn(value.data,'experimental'),false);
  }
});
