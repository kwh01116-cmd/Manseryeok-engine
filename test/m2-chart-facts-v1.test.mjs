import test from 'node:test';
import assert from 'node:assert/strict';
import {
  deriveM2ChartFacts, M2_CHART_FACTS_SCHEMA, HIDDEN_STEM_POLICY_V1,
  HIDDEN_STEM_RULE, createKoreanLunisolarConverter, KASI_KOREAN_LUNISOLAR_2025_2027,
  tenGod,
} from '../dist/index.js';
import { resolveKoreanBirthChartPreview } from '../dist/calendar/koreanBirthPreview.js';
import { KOREA_SOLAR_TERM_EVENTS_2026_2027 as events } from '../dist/calendar/koreaSolarTermFixtures.js';
const converter=createKoreanLunisolarConverter(KASI_KOREAN_LUNISOLAR_2025_2027);
const policies={timeBasis:'KOREAN_CIVIL_TIME',dayRollover:'CIVIL_MIDNIGHT',hourStemReference:'SELECTED_DAY_PILLAR'};
const manifest={schemaVersion:'m1-solar-term-coverage-v1',requirementProfile:'FULL_24_TERM_YEAR',timeBasis:'KST',
  sourcePrecision:'MINUTE',supportedFromInclusive:'2026-01-01T00:00',supportedUntilExclusive:'2028-01-01T00:00',
  requiredYears:[2026,2027],requiredPriorBoundary:{year:2025,term:'DAXUE'}};
const run=(input,time='12:00')=>resolveKoreanBirthChartPreview(input,time,policies,converter,events,manifest);
const solar=date=>({calendar:'GREGORIAN',gregorianDate:date});
const lunar=(year,month,day,leap=false)=>({calendar:'KOREAN_LUNAR',
  lunarDate:{lunarYear:year,lunarMonth:month,lunarDay:day,isLeapMonth:leap}});
const facts=result=>deriveM2ChartFacts(result,HIDDEN_STEM_POLICY_V1);

test('M2 chart facts derive four traceable pillars from actual M1 result without recomputing the calendar',()=>{
  const base=run(solar('2027-02-05'));
  const result=facts(base);
  assert.equal(result.status,'READY');
  assert.equal(result.schemaVersion,M2_CHART_FACTS_SCHEMA);
  assert.equal(result.sourcePreviewVersion,base.preview.schemaVersion);
  assert.equal(result.evidenceClass,'TRADITIONAL_RULE_LOOKUP_ONLY');
  assert.equal(result.hiddenStemPolicyId,HIDDEN_STEM_POLICY_V1);
  assert.deepEqual(result.hiddenStemSourceIds,HIDDEN_STEM_RULE.sourceIds);
  assert.deepEqual(result.solarTermSourceIds,['KR-KASI-CALENDAR-DATA']);
  assert.equal(result.lunarConversionSource,undefined);
  assert.deepEqual(result.policies,policies);
  assert.equal(result.coverage.validation,'STRUCTURAL_COVERAGE_ONLY');
  assert.equal(result.candidateDisplay,'ONE');
  assert.equal(result.candidates.length,1);
  const [candidate]=result.candidates;
  assert.equal(candidate.dayMaster,base.preview.candidates[0].day.stem);
  assert.deepEqual(candidate.pillars.map(p=>p.role),['year','month','day','hour']);
  assert.deepEqual(candidate.pillars.map(p=>p.factRef),[
    'preview.candidates[0].year','preview.candidates[0].month',
    'preview.candidates[0].day','preview.candidates[0].hour']);
  for(const pillar of candidate.pillars){
    assert.equal(pillar.visibleTenGod,pillar.role==='day'?null:tenGod(candidate.dayMaster,pillar.stem));
    assert.equal(pillar.branchTenGods.dayMaster,candidate.dayMaster);
    assert.equal(pillar.branchTenGods.branch,pillar.branch);
    assert.ok(pillar.branchTenGods.members.length>=1);
  }
  assert.equal(Object.hasOwn(result,'strength'),false);
  assert.equal(Object.hasOwn(result,'usefulGod'),false);
  assert.equal(Object.hasOwn(result,'pattern'),false);
  assert.equal(Object.hasOwn(result,'fortune'),false);
});

test('lunar and Gregorian equivalent births preserve exact M2 computed facts but keep conversion provenance',()=>{
  const g=facts(run(solar('2027-02-05')));
  const l=facts(run(lunar(2026,12,29)));
  assert.equal(g.status,'READY');assert.equal(l.status,'READY');
  assert.deepEqual(l.candidates,g.candidates);
  assert.deepEqual(l.solarTermSourceIds,g.solarTermSourceIds);
  assert.deepEqual(l.hiddenStemSourceIds,g.hiddenStemSourceIds);
  assert.equal(g.lunarConversionSource,undefined);
  assert.equal(l.lunarConversionSource.sourceId,'KR-KASI-CALENDAR-DATA');
  assert.equal(l.lunarConversionSource.authorityLevel,'KASI_COMPUTATIONAL_REFERENCE_NOT_OFFICIAL_KASA');
});

test('Lichun published minute yields two independent correlated M2 candidates, never one arbitrary winner',()=>{
  const input=run(solar('2027-02-04'),'10:46');
  const resolved=facts(input);
  assert.equal(resolved.status,'READY');
  assert.equal(resolved.confidence,'PUBLISHED_MINUTE_AMBIGUOUS');
  assert.equal(resolved.candidateDisplay,'SHOW_ALL_BOUNDARY_CANDIDATES');
  assert.equal(resolved.candidates.length,2);
  assert.deepEqual(resolved.candidates.map(c=>c.pillars[0].stem),input.preview.candidates.map(c=>c.year.stem));
  assert.deepEqual(resolved.candidates.map(c=>c.pillars[1].branch),input.preview.candidates.map(c=>c.month.branch));
  assert.equal(resolved.candidates[0].dayMaster,resolved.candidates[1].dayMaster);
  assert.notDeepEqual(resolved.candidates[0].pillars[1].branchTenGods.members,
    resolved.candidates[1].pillars[1].branchTenGods.members);
  assert.equal(resolved.candidates[0].candidateIndex,0);
  assert.equal(resolved.candidates[1].candidateIndex,1);
});

test('unsupported M1 calendar status stays blocked with no invented candidate, even if a caller tries to project',()=>{
  const bad=facts(run(solar('2028-01-01')));
  assert.deepEqual(bad,{schemaVersion:M2_CHART_FACTS_SCHEMA,status:'BLOCKED',reason:'OUT_OF_COVERAGE',candidates:[]});
  const badLunar=facts(run(lunar(2026,6,1,true)));
  assert.deepEqual(badLunar,{schemaVersion:M2_CHART_FACTS_SCHEMA,status:'BLOCKED',reason:'INVALID_LUNAR_DATE',candidates:[]});
  assert.ok(Object.isFrozen(bad));
  assert.equal(bad.candidates.length,0);
});

test('missing explicit M2 policy, forged M1 confidence/provenance or corrupt pillar labels fail closed',()=>{
  const base=run(solar('2027-02-05'));
  for(const invalid of [undefined,null,'',{},0,'AUTO']){
    assert.throws(()=>deriveM2ChartFacts(base,invalid),RangeError);
  }
  assert.throws(()=>facts({status:'READY',preview:base.preview}),RangeError);
  assert.throws(()=>facts({status:'ERROR',preview:base.preview}),RangeError);
  assert.throws(()=>facts({status:'OK',preview:{...base.preview,solarTermSourceIds:[]}}),RangeError);
  assert.throws(()=>facts({status:'OK',preview:{...base.preview,confidence:'PUBLISHED_MINUTE_AMBIGUOUS'}}),RangeError);
  assert.throws(()=>facts({status:'OK',preview:{...base.preview,candidates:[{...base.preview.candidates[0],
    day:{...base.preview.candidates[0].day,hanja:'癸亥'}}]}}),RangeError);
});

test('nested M2 fact candidates, profile identifiers and source snapshots are immutable',()=>{
  const source=run(solar('2027-02-05'));
  const view=facts(source);
  assert.ok(Object.isFrozen(view));assert.ok(Object.isFrozen(view.candidates));
  assert.ok(Object.isFrozen(view.candidates[0]));
  assert.ok(Object.isFrozen(view.candidates[0].pillars));
  assert.ok(view.candidates[0].pillars.every(Object.isFrozen));
  assert.ok(Object.isFrozen(view.solarTermSourceIds));
  assert.ok(Object.isFrozen(view.policies));
  assert.ok(Object.isFrozen(view.coverage));
  assert.throws(()=>{view.candidates[0].pillars[0].stem='甲'},TypeError);
  assert.throws(()=>view.solarTermSourceIds.push('IMPOSTOR'),TypeError);
  const before=view.candidates[0].pillars[0].stem;
  source.preview.candidates[0].year.stem='甲'; // source M1 DTO mutation cannot alter snapshot
  assert.equal(view.candidates[0].pillars[0].stem,before);
});
