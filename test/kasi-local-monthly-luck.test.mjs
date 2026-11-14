import test from 'node:test';
import assert from 'node:assert/strict';
import {createLocalChartProfile,STAGE_A_PROFILE_ID,getLocalChartEventContext} from '../scripts/kasi/local-chart.mjs';
import {createLocalMonthlyLuck,validateLocalMonthlyLuck,renderLocalMonthlyLuckText,MONTHLY_LUCK_POLICY_ID as policyId} from '../scripts/kasi/local-monthly-luck.mjs';
import {syntheticLocalChartCandidate,chartRequest} from './fixtures/kasi-local-chart-synthetic.mjs';
const fixture=syntheticLocalChartCandidate(),chart=()=>createLocalChartProfile(fixture.loaded,{profileId:STAGE_A_PROFILE_ID,expectedManifestSha256:fixture.expectedManifestSha256});

test('monthly adapter reuses issued pinned events and an already-calculated natal result',()=>{
  const base=chart(),request=chartRequest(),m1=base.calculate(request),monthly=createLocalMonthlyLuck(base,{policyId}),result=monthly.calculate({year:2026,queryMinute:'2026-02-05T01:20'},{birthCalculation:m1});
  assert.equal(validateLocalMonthlyLuck(result,{birthCalculation:m1}),true);assert.equal(result.atMinute.status,'AMBIGUOUS');assert.equal(result.atMinute.entries.length,2);assert.equal(result.executionCounts.birthM1Calls,0);assert.equal(result.birthLink.queryRelation,'BEFORE_BIRTH');assert.equal(result.yearTable.rows.length,12);
  const sourceIds=new Set(result.sources.map(s=>s.id));for(const entry of result.atMinute.entries){assert.ok(entry.calculationSourceRefs.every(id=>sourceIds.has(id)));const source=result.sources.find(s=>s.id===entry.activeSince.sourceIds[0]);assert.ok(source.evidence.sourceRef);assert.ok(source.evidence.original);assert.equal(source.evidence.interpreted.sourcePrecision,'MINUTE');}
  const text=renderLocalMonthlyLuckText(result);for(const expected of ['출생 기록보다 앞','양력 달','명리 월운','전 조건','후 조건','양력 1월부터 12월','사건·길흉을 판정하지 않습니다'])assert.ok(text.includes(expected),expected);
});
test('independent monthly queries require no natal candidate and never create natal Cartesian products',()=>{
  const base=chart(),monthly=createLocalMonthlyLuck(base,{policyId}),result=monthly.calculate({queryMinute:'2026-02-05T01:20'});assert.equal(result.birthLink,null);assert.equal(result.atMinute.entries.length,2);assert.equal(validateLocalMonthlyLuck(result),true);assert.equal(result.provenance.dataset.candidateManifestContentSha256,fixture.expectedManifestSha256);
  const unsupported=monthly.calculate({queryMinute:'2027-02-04T12:00',year:2027});assert.equal(unsupported.atMinute.status,'POLICY_UNRESOLVED');assert.equal(unsupported.yearTable.status,'POLICY_UNRESOLVED');assert.equal(unsupported.atMinute.entries.length,0);
});
test('foreign candidate, serialized context, policy conflicts and changed results reject',()=>{
  const first=chart(),second=chart(),firstM1=first.calculate(chartRequest()),secondM1=second.calculate(chartRequest('2026-06-02')),monthly=createLocalMonthlyLuck(first,{policyId}),r=monthly.calculate({queryMinute:'2026-06-01T12:00'},{birthCalculation:firstM1});
  assert.throws(()=>createLocalMonthlyLuck({metadata:first.metadata,context:structuredClone(getLocalChartEventContext(first))},{policyId}));assert.throws(()=>createLocalMonthlyLuck(first,{policyId:'AUTO'}));
  assert.throws(()=>monthly.calculate({}));assert.throws(()=>monthly.calculate({queryMinute:'2026-01-01T12:00',sex:'MALE'}));assert.throws(()=>monthly.calculate({queryMinute:'2026-01-01T12:00'},{birthCalculation:structuredClone(firstM1)}));
  for(const birthCalculation of [null,0,false,''])assert.throws(()=>monthly.calculate({queryMinute:'2026-01-01T12:00'},{birthCalculation}));
  assert.throws(()=>validateLocalMonthlyLuck(structuredClone(r)));assert.throws(()=>validateLocalMonthlyLuck(r,{birthCalculation:secondM1}));assert.throws(()=>{r.atMinute.entries[0].monthPillar.stem='甲';});assert.equal(validateLocalMonthlyLuck(r),true);
});
test('equivalent lunar birth and four selected day/hour policies never change the independent month query',()=>{
  const base=chart(),monthly=createLocalMonthlyLuck(base,{policyId}),date=fixture.loaded.candidate.dates.find(r=>r.solarDate==='2026-06-01');let expected;
  for(const dayRollover of ['CIVIL_MIDNIGHT','ZI_START'])for(const hourStemReference of ['SELECTED_DAY_PILLAR','CIVIL_DATE_DAY_PILLAR']){
    const request=chartRequest('2026-06-01','23:30',dayRollover,hourStemReference),greg=base.calculate(request),lunar=base.calculate({calendar:'KOREAN_LUNAR',lunarDate:{lunarYear:date.lunarYear,lunarMonth:date.lunarMonth,lunarDay:date.lunarDay,leap:date.leap},time:request.time,policies:request.policies});
    const a=monthly.calculate({queryMinute:'2026-03-05T01:20'},{birthCalculation:greg}),b=monthly.calculate({queryMinute:'2026-03-05T01:20'},{birthCalculation:lunar});assert.deepEqual(a.atMinute,b.atMinute);expected??=a.atMinute;assert.deepEqual(a.atMinute,expected);assert.equal(a.executionCounts.birthM1Calls,0);
  }
});
