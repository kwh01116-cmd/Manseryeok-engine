// Fictional-calendar connection tests: not independent calendar or possible-birth certification.
import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createLocalChartProfile,STAGE_A_PROFILE_ID} from '../scripts/kasi/local-chart.mjs';
import {M2_LOCAL_PROFILE_ID} from '../scripts/kasi/local-chart-facts.mjs';
import {createLocalM3EvidenceProfile,deriveLocalM3SeasonalJudgments,validateLocalM3SeasonalJudgments,validateLocalM3EvidenceResult,renderLocalM3EvidenceText,M3_LOCAL_PROFILE_ID,M3_SEASONAL_POLICY_ID} from '../scripts/kasi/local-m3-evidence.mjs';
import {syntheticLocalChartCandidate,chartRequest} from './fixtures/kasi-local-chart-synthetic.mjs';
const fixture=syntheticLocalChartCandidate(),settings={m2ProfileId:M2_LOCAL_PROFILE_ID,m3ProfileId:M3_LOCAL_PROFILE_ID};
const chart=()=>createLocalChartProfile(fixture.loaded,{profileId:STAGE_A_PROFILE_ID,expectedManifestSha256:fixture.expectedManifestSha256});
const profile=(selected=true,source=chart())=>createLocalM3EvidenceProfile(source,{...settings,...(selected?{seasonalPolicyId:M3_SEASONAL_POLICY_ID}:{})});
const judgment=result=>result.seasonal.candidates[0].judgment;
function lunarRequest(date,time='12:00'){
  const row=fixture.loaded.candidate.dates.find(r=>r.solarDate===date);
  return {calendar:'KOREAN_LUNAR',lunarDate:{lunarYear:row.lunarYear,lunarMonth:row.lunarMonth,lunarDay:row.lunarDay,leap:row.leap},time,policies:chartRequest().policies};
}
test('opt-in seasonal judgment reuses one M1/M2 and preserves unselected structural JSON and TEXT',()=>{
  const base=chart();let m1=0;const spy={...base,calculate(req){m1++;return base.calculate(req);}};
  const req=chartRequest(),old=profile(false,spy).calculate(req),selected=profile(true,spy).calculate(req);
  assert.equal(m1,2);assert.deepEqual(selected.executionCounts,{birthM1Calls:1,m2Derivations:1});
  for(const key of ['m1','facts','evidence','explanation','validation','provenance'])assert.deepEqual(selected[key],old[key]);
  assert.equal(old.schemaVersion,'kasi-local-m3-evidence-v1');assert.ok(!Object.hasOwn(old,'seasonal'));
  assert.equal(renderLocalM3EvidenceText(old),readFileSync(new URL('./fixtures/m3-evidence-ordinary-synthetic.txt',import.meta.url),'utf8'));
  assert.equal(selected.schemaVersion,'kasi-local-m3-evidence-seasonal-v1');assert.equal(selected.status,'EVIDENCE_ONLY');
  assert.equal(judgment(selected).status,'RESOLVED_UNDER_POLICY');assert.equal(judgment(selected).dayMaster,'丙');assert.equal(judgment(selected).monthBranch,'巳');assert.equal(judgment(selected).seasonalState,'WANG');
  assert.equal(selected.evidence.candidates[0].monthContext.season.status,'UNRESOLVED');assert.equal(selected.validation.finalStrength,'NOT_IMPLEMENTED');
  assert.equal(validateLocalM3EvidenceResult(selected),true);assert.equal(validateLocalM3SeasonalJudgments(selected.seasonal,{evidence:selected.evidence}),true);
  const text=renderLocalM3EvidenceText(selected);assert.ok(text.indexOf('여름')<text.indexOf('장간'));assert.ok(text.indexOf('여름')<text.indexOf('상세 참조'));
});
test('same-date solar/lunar and same lunar month across Jie use the actual saju month branch',()=>{
  const p=profile(),g=p.calculate(chartRequest()),l=p.calculate(lunarRequest('2026-06-01'));
  assert.deepEqual(g.seasonal,l.seasonal);assert.deepEqual(g.evidence.candidates,l.evidence.candidates);
  assert.equal(g.m1.evidence.dateConversion.method,'GREGORIAN_WITH_API_OBSERVED_DATE_EVIDENCE');
  assert.equal(l.m1.evidence.dateConversion.method,'API_OBSERVED_DATE_INDEX');
  const a=lunarRequest('2026-04-04'),b=lunarRequest('2026-04-06');assert.equal(a.lunarDate.lunarMonth,b.lunarDate.lunarMonth);
  const before=p.calculate(a),after=p.calculate(b);
  assert.equal(judgment(before).monthBranch,'卯');assert.equal(judgment(before).season,'SPRING');
  assert.equal(judgment(after).monthBranch,'辰');assert.equal(judgment(after).status,'POLICY_UNRESOLVED');
  assert.equal(judgment(p.calculate(chartRequest('2026-04-01'))).monthBranch,'卯','April number is not used as saju branch');
});
test('Jie enters and leaves deferred months while a nearer mid-Qi does not change the chosen season',()=>{
  const p=profile(),qing=p.calculate(chartRequest('2026-04-05','01:20')),lixia=p.calculate(chartRequest('2026-05-05','01:20'));
  assert.deepEqual(qing.seasonal.candidates.map(c=>[c.judgment.monthBranch,c.judgment.status]),[['卯','RESOLVED_UNDER_POLICY'],['辰','POLICY_UNRESOLVED']]);
  assert.deepEqual(lixia.seasonal.candidates.map(c=>[c.judgment.monthBranch,c.judgment.status]),[['辰','POLICY_UNRESOLVED'],['巳','RESOLVED_UNDER_POLICY']]);
  const a=judgment(p.calculate(chartRequest('2026-03-20','01:19'))),b=judgment(p.calculate(chartRequest('2026-03-20','01:21')));
  assert.equal(a.monthBranch,'卯');assert.equal(b.monthBranch,'卯');assert.deepEqual(a.elementStates,b.elementStates);assert.deepEqual(a.appliedJie,b.appliedJie);
});
test('fictional Lichun retains its actual 庚 day stem with 丑 deferred and 寅 metal QIU, while earth days resolve normally',()=>{
  const p=profile(),result=p.calculate(chartRequest('2026-02-05','01:20'));
  assert.equal(result.m1.chart.confidence,'PUBLISHED_MINUTE_AMBIGUOUS');assert.equal(result.seasonal.candidates.length,2);
  const [before,after]=result.seasonal.candidates.map(c=>c.judgment);
  assert.equal(before.dayMaster,'庚');assert.equal(before.monthBranch,'丑');assert.equal(before.seasonalState,null);assert.equal(before.reason,'EARTH_MONTH_POLICY_NOT_SELECTED');
  assert.equal(after.dayMaster,'庚');assert.equal(after.monthBranch,'寅');assert.equal(after.dayMasterElement,'METAL');assert.equal(after.seasonalState,'QIU');assert.equal(after.status,'RESOLVED_UNDER_POLICY');
  const earth=judgment(p.calculate(chartRequest('2026-03-06')));assert.equal(earth.dayMaster,'己');assert.equal(earth.monthBranch,'卯');assert.equal(earth.seasonalState,'SI');
  for(let i=0;i<2;i++){const c=result.seasonal.candidates[i],ref='chart.candidates['+i+']';assert.equal(c.candidateRef,ref);assert.ok(c.judgment.input.evidenceRefs.every(id=>id.startsWith(ref+'#')));}
  assert.equal(result.evidence.finalStrength.status,'NOT_IMPLEMENTED');
});
test('issued same-process evidence, policy and candidate references reject tampering without another M1',()=>{
  const p=profile(),first=p.calculate(chartRequest('2026-02-05','01:20')),other=p.calculate(chartRequest());
  const derived=deriveLocalM3SeasonalJudgments(first.evidence,{seasonalPolicyId:M3_SEASONAL_POLICY_ID});assert.deepEqual(derived,first.seasonal);
  assert.throws(()=>deriveLocalM3SeasonalJudgments(structuredClone(first.evidence),{seasonalPolicyId:M3_SEASONAL_POLICY_ID}));
  assert.throws(()=>validateLocalM3SeasonalJudgments(first.seasonal,{evidence:other.evidence}));
  for(const id of ['',null,'AUTO','INVALID'])assert.throws(()=>createLocalM3EvidenceProfile(chart(),{...settings,seasonalPolicyId:id}));
  const forged=structuredClone(first);forged.seasonal.candidates[0]=forged.seasonal.candidates[1];assert.throws(()=>validateLocalM3EvidenceResult(forged));
  assert.throws(()=>{first.seasonal.candidates[0].judgment.seasonalState='WANG';},TypeError);
  assert.deepEqual(p.calculate(chartRequest('2026-02-05','01:20')),first);
});
