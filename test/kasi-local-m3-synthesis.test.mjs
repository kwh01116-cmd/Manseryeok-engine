// Generated calendar responses verify the bridge, not classical or predictive correctness.
import test from 'node:test';
import assert from 'node:assert/strict';
import {createLocalChartProfile,STAGE_A_PROFILE_ID} from '../scripts/kasi/local-chart.mjs';
import {M2_LOCAL_PROFILE_ID} from '../scripts/kasi/local-chart-facts.mjs';
import {
  createLocalM3EvidenceProfile,deriveLocalM3LimitedSynthesis,validateLocalM3LimitedSynthesis,
  validateLocalM3EvidenceResult,renderLocalM3EvidenceText,parseLocalM3EvidenceArgs,
  M3_LOCAL_PROFILE_ID,M3_ROOT_POLICY_ID,M3_SUPPORT_POLICY_ID,M3_SEASONAL_POLICY_ID,M3_SEASONAL_SILI_POLICY_ID,
  M3_SYNTHESIS_PROFILE_ID,LOCAL_M3_SYNTHESIS_SCHEMA,
} from '../scripts/kasi/local-m3-evidence.mjs';
import {validateM3LimitedSynthesisExplanation} from '../dist/m3/limitedSynthesisV1.js';
import {syntheticLocalChartCandidate,chartRequest} from './fixtures/kasi-local-chart-synthetic.mjs';

const fixture=syntheticLocalChartCandidate();
const chart=()=>createLocalChartProfile(fixture.loaded,{profileId:STAGE_A_PROFILE_ID,expectedManifestSha256:fixture.expectedManifestSha256});
const selected={m2ProfileId:M2_LOCAL_PROFILE_ID,m3ProfileId:M3_LOCAL_PROFILE_ID,seasonalPolicyId:M3_SEASONAL_SILI_POLICY_ID,rootPolicyId:M3_ROOT_POLICY_ID,supportPolicyId:M3_SUPPORT_POLICY_ID};
const options={synthesisProfileId:M3_SYNTHESIS_PROFILE_ID};
const profile=base=>createLocalM3EvidenceProfile(base??chart(),options);
const bridgeOptions=value=>({...options,root:value.root,support:value.support,seasonal:value.seasonal});
const lunarRequest=(date,time='12:00')=>{
  const row=fixture.loaded.candidate.dates.find(item=>item.solarDate===date);assert.ok(row);
  return {calendar:'KOREAN_LUNAR',lunarDate:{lunarYear:row.lunarYear,lunarMonth:row.lunarMonth,lunarDay:row.lunarDay,leap:row.leap},time,policies:chartRequest().policies};
};
const common=['--profile',STAGE_A_PROFILE_ID,'--candidate','SYNTHETIC_PATH_NOT_LOADED_BY_PARSER','--manifest-sha',fixture.expectedManifestSha256,
  '--calendar','GREGORIAN','--date','2026-06-01','--time','12:00',
  '--clock-policy','KR_API_PUBLISHED_KST_MODERN_1988_POST_DST_V1','--day-rollover','CIVIL_MIDNIGHT','--hour-stem-reference','SELECTED_DAY_PILLAR','--output','json'];

test('explicit synthesis bundle discloses all selected dependencies and rejects conflicts before a birth calculation',()=>{
  const base=chart();let calls=0;const spy={...base,calculate(request){calls++;return base.calculate(request);}};
  for(const bad of ['', 'AUTO','M3_FINAL_READY'])assert.throws(()=>createLocalM3EvidenceProfile(spy,{synthesisProfileId:bad,contextProfile:base}));
  for(const [key,value]of Object.entries({...selected,seasonalPolicyId:M3_SEASONAL_POLICY_ID})){
    const wrong=key==='seasonalPolicyId'?value:'UNSUPPORTED_'+value;
    assert.throws(()=>createLocalM3EvidenceProfile(spy,{...options,[key]:wrong,contextProfile:base}));
  }
  assert.equal(calls,0);
  const value=createLocalM3EvidenceProfile(spy,{...options,contextProfile:base}).calculate(chartRequest());
  assert.equal(calls,1);assert.equal(value.schemaVersion,LOCAL_M3_SYNTHESIS_SCHEMA);
  assert.equal(value.facts.policyBundle.id,M2_LOCAL_PROFILE_ID);assert.equal(value.evidence.policy.id,M3_LOCAL_PROFILE_ID);
  assert.equal(value.seasonal.policy.id,M3_SEASONAL_SILI_POLICY_ID);assert.equal(value.root.policy.id,M3_ROOT_POLICY_ID);assert.equal(value.support.policy.id,M3_SUPPORT_POLICY_ID);
  assert.equal(value.researchSynthesis.schemaVersion,'m3-limited-synthesis-v1');assert.ok(Object.isFrozen(value.researchSynthesis));
  assert.equal(value.status,'EVIDENCE_ONLY');assert.equal(value.validation.finalStrength,'NOT_IMPLEMENTED');
  assert.equal(value.validation.m3FinalInterpretationGate,'BLOCKED_UNCHANGED');assert.equal(value.validation.g0Receipt,null);assert.equal(value.validation.g1P2Promotion,false);
});

test('synthesis reuses issued M1 M2 M3 roots and support while old selected and option-off bytes remain unchanged',()=>{
  const base=chart(),oldProfile=createLocalM3EvidenceProfile(base,selected),none=createLocalM3EvidenceProfile(base,{m2ProfileId:M2_LOCAL_PROFILE_ID,m3ProfileId:M3_LOCAL_PROFILE_ID});
  const request=chartRequest(),old=oldProfile.calculate(request),before=JSON.stringify(old),beforeText=renderLocalM3EvidenceText(old);
  const beforeNone=JSON.stringify(none.calculate(request)),beforeNoneText=renderLocalM3EvidenceText(none.calculate(request));
  let calls=0;const spy={...base,calculate(input){calls++;return base.calculate(input);}};
  const value=createLocalM3EvidenceProfile(spy,{...options,contextProfile:base}).calculate(request);
  assert.equal(calls,1);assert.deepEqual(value.executionCounts,{birthM1Calls:1,m2Derivations:1});
  for(const key of ['m1','facts','evidence','explanation','seasonal','root','rootExplanation','support','supportExplanation','provenance','validation','executionCounts'])assert.deepEqual(value[key],old[key],key+' must remain unchanged');
  const again=deriveLocalM3LimitedSynthesis(value.evidence,bridgeOptions(value));assert.equal(calls,1);assert.deepEqual(again,value.researchSynthesis);
  assert.equal(validateLocalM3LimitedSynthesis(again,{evidence:value.evidence,root:value.root,support:value.support,seasonal:value.seasonal}),true);
  assert.equal(validateLocalM3EvidenceResult(value),true);
  assert.equal(JSON.stringify(oldProfile.calculate(request)),before);assert.equal(renderLocalM3EvidenceText(oldProfile.calculate(request)),beforeText);
  assert.equal(JSON.stringify(none.calculate(request)),beforeNone);assert.equal(renderLocalM3EvidenceText(none.calculate(request)),beforeNoneText);
  assert.equal(Object.hasOwn(old,'researchSynthesis'),false);assert.equal(Object.hasOwn(old,'researchReport'),false);
});

test('equivalent Gregorian and lunar birth inputs preserve research paths and Korean reports with separate conversion evidence',()=>{
  const p=profile(),g=p.calculate(chartRequest()),l=p.calculate(lunarRequest('2026-06-01'));
  assert.deepEqual(g.m1.chart,l.m1.chart);assert.deepEqual(g.researchSynthesis.candidates,l.researchSynthesis.candidates);assert.deepEqual(g.researchReport,l.researchReport);
  assert.notEqual(g.m1.evidence.dateConversion.method,l.m1.evidence.dateConversion.method);
  for(const value of [g,l])assert.equal(validateLocalM3EvidenceResult(value),true);
  const text=renderLocalM3EvidenceText(g);assert.match(text,/제한적 종합/);assert.match(text,/연구/);assert.match(text,/보류|신약/);
  assert.match(text,/근거|정책|규칙/);assert.ok(text.length<10000,'Default report is a concise review, not the old complete reference dump');
  assert.ok(!text.includes('기존 구조 근거·통근·계절의 상세 참조'));assert.ok(!text.includes('생조가 확정되어'));
});

test('derived B alternatives are child research paths under one unchanged natal root and resource decision',()=>{
  const p=profile(),before=p.calculate(chartRequest('2026-04-17','01:19')),at=p.calculate(chartRequest('2026-04-17','01:20')),after=p.calculate(chartRequest('2026-04-17','01:21'));
  for(const value of [before,at,after]){assert.equal(value.m1.chart.candidates.length,1);assert.equal(value.researchSynthesis.candidates.length,1);assert.equal(value.root.candidates.length,1);assert.equal(value.support.candidates.length,1);validateLocalM3EvidenceResult(value);}
  assert.deepEqual(before.m1.chart.candidates,at.m1.chart.candidates);assert.deepEqual(at.m1.chart.candidates,after.m1.chart.candidates);
  assert.deepEqual(before.root,at.root);assert.deepEqual(at.root,after.root);assert.deepEqual(before.support,at.support);assert.deepEqual(at.support,after.support);
  assert.equal(before.researchSynthesis.candidates[0].paths.length,1);assert.equal(at.researchSynthesis.candidates[0].paths.length,2);assert.equal(after.researchSynthesis.candidates[0].paths.length,1);
  assert.equal(new Set(at.researchSynthesis.candidates[0].paths.map(path=>path.id)).size,2);
  assert.match(renderLocalM3EvidenceText(at),/조건|경계/);
});

test('published Lichun candidates keep their own day month and seasonal research context without cross products',()=>{
  const value=profile().calculate(chartRequest('2026-02-05','01:20'));
  assert.equal(value.m1.chart.candidates.length,2);assert.equal(value.researchSynthesis.candidates.length,2);
  assert.deepEqual(value.evidence.candidates.map(item=>item.monthContext.monthPillar.stem+item.monthContext.monthPillar.branch),['己丑','庚寅']);
  for(let i=0;i<2;i++){
    assert.equal(value.researchSynthesis.candidates[i].candidateRef,'chart.candidates['+i+']');
    assert.equal(value.researchSynthesis.candidates[i].paths.length,1);
  }
  validateLocalM3EvidenceResult(value);const text=renderLocalM3EvidenceText(value);assert.match(text,/후보 1/);assert.match(text,/후보 2/);
});

test('synthesis rejects cross-request contexts cloned judgments missing prerequisites and altered reports without poisoning later calls',()=>{
  const p=profile(),a=p.calculate(chartRequest()),b=p.calculate(chartRequest('2026-02-05','01:20')),sameRef=p.calculate(chartRequest('2026-06-02'));
  for(const altered of [
    {...bridgeOptions(a),root:b.root},{...bridgeOptions(a),support:b.support},{...bridgeOptions(a),seasonal:b.seasonal},
    {...bridgeOptions(a),root:sameRef.root},{...bridgeOptions(a),support:sameRef.support},{...bridgeOptions(a),seasonal:sameRef.seasonal},
    {...bridgeOptions(a),root:undefined},{...bridgeOptions(a),support:undefined},{...bridgeOptions(a),seasonal:undefined},
    {...bridgeOptions(a),seasonal:structuredClone(a.seasonal)},
  ])assert.throws(()=>deriveLocalM3LimitedSynthesis(a.evidence,altered));
  assert.throws(()=>deriveLocalM3LimitedSynthesis(structuredClone(a.evidence),bridgeOptions(a)));
  assert.throws(()=>validateLocalM3LimitedSynthesis(a.researchSynthesis,{evidence:b.evidence}));
  assert.throws(()=>validateLocalM3LimitedSynthesis(structuredClone(a.researchSynthesis),{evidence:a.evidence}));
  const report=structuredClone(a.researchReport);report.candidates[0].candidateRef='chart.candidates[1]';
  assert.throws(()=>validateM3LimitedSynthesisExplanation(report,a.researchSynthesis));
  const forged=structuredClone(a);forged.researchSynthesis=b.researchSynthesis;assert.throws(()=>validateLocalM3EvidenceResult(forged));
  assert.deepEqual(p.calculate(chartRequest()),a);assert.equal(a.support.totalSupportEfficacy,'NOT_EVALUATED');assert.equal(a.root.rootEfficacy,'NOT_EVALUATED');
});

test('synthesis parser accepts only the explicit exact policy bundle and leaves ordinary mandatory choices intact',()=>{
  const value=parseLocalM3EvidenceArgs([...common,'--synthesis-profile',M3_SYNTHESIS_PROFILE_ID]);
  assert.equal(value.synthesisProfileId,M3_SYNTHESIS_PROFILE_ID);for(const [key,id]of Object.entries(selected))assert.equal(value[key],id);
  const explicit=parseLocalM3EvidenceArgs([...common,'--m2-profile',M2_LOCAL_PROFILE_ID,'--m3-profile',M3_LOCAL_PROFILE_ID,'--root-policy',M3_ROOT_POLICY_ID,'--support-policy',M3_SUPPORT_POLICY_ID,'--seasonal-policy',M3_SEASONAL_SILI_POLICY_ID,'--synthesis-profile',M3_SYNTHESIS_PROFILE_ID]);
  assert.deepEqual(explicit,value);
  for(const tail of [
    ['--synthesis-profile','AUTO'],['--synthesis-profile',M3_SYNTHESIS_PROFILE_ID,'--synthesis-profile',M3_SYNTHESIS_PROFILE_ID],
    ['--synthesis-profile',M3_SYNTHESIS_PROFILE_ID,'--seasonal-policy',M3_SEASONAL_POLICY_ID],
    ['--synthesis-profile',M3_SYNTHESIS_PROFILE_ID,'--m2-profile','OTHER'],
    ['--synthesis-profile',M3_SYNTHESIS_PROFILE_ID,'--m3-profile','OTHER'],
    ['--synthesis-profile',M3_SYNTHESIS_PROFILE_ID,'--root-policy','OTHER'],
    ['--synthesis-profile',M3_SYNTHESIS_PROFILE_ID,'--support-policy','OTHER'],
  ])assert.throws(()=>parseLocalM3EvidenceArgs([...common,...tail]));
  assert.throws(()=>parseLocalM3EvidenceArgs(common),'Outside the explicit synthesis bundle M2/M3 remain mandatory');
});
