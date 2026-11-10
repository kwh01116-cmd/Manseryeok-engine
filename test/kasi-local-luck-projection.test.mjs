// Synthetic connection tests: independent calendar expectations, not external calendar certification.
import test from 'node:test';
import assert from 'node:assert/strict';
import {createLocalChartProfile,STAGE_A_PROFILE_ID,MODERN_PROFILE_ID} from '../scripts/kasi/local-chart.mjs';
import {createLocalLuckProfile,validateLocalLuckResult} from '../scripts/kasi/local-luck.mjs';
import {createLocalLuckProjectionProfile,projectLocalLuckResult,validateLocalLuckProjectionResult,validateLuckProjectionExplanation,renderLocalLuckProjectionText,CALENDAR_PROJECTION_POLICY_V02} from '../scripts/kasi/local-luck-projection.mjs';
import {M7_LUCK_POLICY_V01} from '../dist/luck/luckV01.js';
import {syntheticLocalChartCandidate,syntheticModernLocalChartCandidate,chartRequest} from './fixtures/kasi-local-chart-synthetic.mjs';

const fixture=syntheticLocalChartCandidate();let modernFixture;
const chartFor=(data=fixture,profileId=STAGE_A_PROFILE_ID)=>createLocalChartProfile(data.loaded,{profileId,expectedManifestSha256:data.expectedManifestSha256});
const modernChart=()=>chartFor(modernFixture??=syntheticModernLocalChartCandidate(),MODERN_PROFILE_ID);
const settings={luckPolicyId:M7_LUCK_POLICY_V01,calendarProjectionPolicyId:CALENDAR_PROJECTION_POLICY_V02};
const pipeline=(chart=chartFor(),extra={})=>createLocalLuckProjectionProfile(chart,{...settings,...extra});
const features=(traditionalSex='MALE',count=10)=>({dayun:{traditionalSex,count},seyun:{yearLabel:2027,queryMinute:'2026-06-01T12:00'}});
const glyph=p=>p.stem+p.branch;
const candidate=(result,index=0)=>result.projection.candidates[index];
const nominal=(result,index=0)=>candidate(result,index).calendar;
const select=(profile,request,asOfMinute,options=features())=>profile.calculate(request,options,{asOfMinute});
const assertValid=result=>{assert.equal(result.status,'OK');assert.equal(result.schemaVersion,'kasi-local-luck-projection-v02');assert.equal(validateLocalLuckProjectionResult(result),true);return result;};

test('optional calendar projection retains the entire v0.1/M2 result and performs one measured birth M1 call',()=>{
  const chart=chartFor();let calls=0;
  const measured={...chart,calculate(request){calls++;return chart.calculate(request);}};
  const options={m2ProfileId:'m2-basic-classification-local-v1'},request=chartRequest();
  const projected=assertValid(pipeline(measured,{...options,contextProfile:chart}).calculate(request,features(),{asOfMinute:'2026-11-01T12:00'}));
  assert.equal(calls,1);assert.equal(projected.m7.luck.executionCounts.birthM1Calls,1);
  const original=createLocalLuckProfile(chart,{luckPolicyId:M7_LUCK_POLICY_V01,...options}).calculate(request,features());
  assert.deepEqual(projected.m7,original,'calendar projection must not rewrite v0.1 chart, order, age, evidence, M2 or text');
  validateLocalLuckResult(projected.m7);
  assert.equal(projected.m7.luck.candidates[0].dayun.calendarProjection.status,'POLICY_UNRESOLVED');
  assert.equal(projected.projection.baseContractScope,'V01_UNPROJECTED_LEGACY_RESULTS_RETAINED');
  assert.equal(projected.projection.policy.id,CALENDAR_PROJECTION_POLICY_V02);
  assert.equal(nominal(projected).status,'PROJECTED_UNDER_POLICY');
  assert.ok(JSON.stringify(projected.projection).includes('NOMINAL_UNDER_SELECTED_POLICY'));
  assert.equal(projected.m7.luck.validation.g0Receipt,null);assert.equal(projected.m7.luck.validation.g1P2Promotion,false);
  assert.equal(projected.m7.luck.validation.editionVerification,'UNVERIFIED');
  assert.equal(projected.m7.luck.validation.rightsReview,'UNVERIFIED');
});

test('synthetic minute gaps produce independently hand-calculated sequential dates while preserving model ages',()=>{
  const profile=pipeline(),request=chartRequest(),forward=assertValid(profile.calculate(request,features('MALE'))),reverse=assertValid(profile.calculate(request,features('FEMALE')));
  const f=nominal(forward),r=nominal(reverse);
  // The synthetic source has June5/May5 01:20, not real KASI term times.
  // 5120=1*4320+2*360+6*12+8 -> 1y2mo6d16h; June1 noon -> Aug8 04:00 next year.
  assert.equal(f.intervalMinutes,5120);assert.deepEqual(Object.fromEntries(['years','months','days','hours','originalMinutes'].map(k=>[k,f.decomposition[k]])),{years:1,months:2,days:6,hours:16,originalMinutes:5120});
  assert.equal(f.firstStartMinute,'2027-08-08T04:00');
  // 39520=9*4320+1*360+23*12+4 -> 9y1mo23d8h; June1 -> July24 20:00 nine years later.
  assert.equal(r.intervalMinutes,39520);assert.deepEqual(Object.fromEntries(['years','months','days','hours','originalMinutes'].map(k=>[k,r.decomposition[k]])),{years:9,months:1,days:23,hours:8,originalMinutes:39520});
  assert.equal(r.firstStartMinute,'2035-07-24T20:00');
  assert.deepEqual(f.modelAge,forward.m7.luck.candidates[0].dayun.start.age);
  assert.deepEqual(r.modelAge,reverse.m7.luck.candidates[0].dayun.start.age);
  assert.deepEqual(f.steps.map(s=>s.unit),['YEARS','MONTHS','DAYS','HOURS']);
  assert.deepEqual(f.steps.map(s=>s.resultMinute),['2027-06-01T12:00','2027-08-01T12:00','2027-08-07T12:00','2027-08-08T04:00']);
  assert.equal(f.periods.length,10);assert.deepEqual(f.periods.slice(0,3).map(p=>glyph(p.pillar)),['甲午','乙未','丙申']);
  for(let i=0;i<f.periods.length;i++){
    const row=f.periods[i];assert.equal(row.index,i);assert.equal(row.ordinal,i+1);assert.equal(row.anchorMinute,f.firstStartMinute);assert.equal(row.yearsFromAnchor,10*i);
    assert.ok(row.startInclusive<row.endExclusive);if(i)assert.equal(f.periods[i-1].endExclusive,row.startInclusive);
  }
  assert.equal(f.periods[0].endExclusive,'2037-08-08T04:00');assert.equal(f.periods[9].endExclusive,'2127-08-08T04:00');
});

test('modern as-of lookup selects half-open intervals before, at and after each supported transition',()=>{
  const profile=pipeline(modernChart()),request=chartRequest('1990-06-01','12:00');
  const normal=assertValid(select(profile,request,'2026-11-01T12:00'));
  assert.equal(nominal(normal).firstStartMinute,'1991-08-08T04:00');
  assert.equal(candidate(normal).selection.status,'RESOLVED_UNDER_POLICY');
  assert.equal(candidate(normal).selection.selection.ordinal,4);assert.equal(glyph(candidate(normal).selection.selection.pillar),'乙酉');
  assert.equal(candidate(normal).selection.selection.startInclusive,'2021-08-08T04:00');assert.equal(candidate(normal).selection.selection.endExclusive,'2031-08-08T04:00');
  assert.equal(candidate(select(profile,request,'1989-11-01T12:00')).selection.status,'BEFORE_BIRTH');
  assert.equal(candidate(select(profile,request,'1990-11-01T12:00')).selection.status,'BEFORE_FIRST_DA_YUN');
  for(const [time,expectedStatus,ordinal]of [['1991-08-08T03:59','BEFORE_FIRST_DA_YUN',null],['1991-08-08T04:00','RESOLVED_UNDER_POLICY',1],['1991-08-08T04:01','RESOLVED_UNDER_POLICY',1],['2001-08-08T03:59','RESOLVED_UNDER_POLICY',1],['2001-08-08T04:00','RESOLVED_UNDER_POLICY',2],['2001-08-08T04:01','RESOLVED_UNDER_POLICY',2],['2011-08-08T03:59','RESOLVED_UNDER_POLICY',2],['2011-08-08T04:00','RESOLVED_UNDER_POLICY',3],['2011-08-08T04:01','RESOLVED_UNDER_POLICY',3],['2021-08-08T03:59','RESOLVED_UNDER_POLICY',3],['2021-08-08T04:00','RESOLVED_UNDER_POLICY',4],['2021-08-08T04:01','RESOLVED_UNDER_POLICY',4]]){
    const selected=candidate(assertValid(select(profile,request,time))).selection;assert.equal(selected.status,expectedStatus,time);assert.equal(selected.selection?.ordinal??null,ordinal,time);
  }
  const short=select(profile,request,'2026-11-01T12:00',features('MALE',3));assert.equal(candidate(short).selection.status,'OUTSIDE_GENERATED_RANGE');assert.equal(candidate(short).selection.selection,null);
  for(const query of ['1988-12-31T23:59','2027-01-01T00:00','2031-08-08T04:00'])assert.equal(candidate(assertValid(select(profile,request,query))).selection.status,'POLICY_UNRESOLVED');
});

test('Lichun candidates retain their own direction, date, period and selection without an annual Cartesian product',()=>{
  const profile=pipeline(modernChart()),request=chartRequest('1990-02-05','01:20');
  // At this synthetic Lichun, pre-year 己 is yin and post-year 庚 is yang.
  const boundaryFeatures=sex=>({...features(sex),seyun:{yearLabel:2027,queryMinute:'1990-02-05T01:20'}});
  const male=assertValid(select(profile,request,'2026-11-01T12:00',boundaryFeatures('MALE')));
  assert.equal(male.m7.luck.candidates.length,2);assert.equal(male.projection.candidates.length,2);
  assert.deepEqual(male.m7.luck.candidates.map(c=>c.dayun.direction.direction),['REVERSE','FORWARD']);
  assert.notEqual(nominal(male,0).firstStartMinute,nominal(male,1).firstStartMinute);
  for(let i=0;i<2;i++){
    const c=candidate(male,i);assert.equal(c.candidateRef,'chart.candidates['+i+']');assert.equal(c.calendar.candidateRef,c.candidateRef);assert.equal(c.selection.candidateRef,c.candidateRef);
    assert.deepEqual(c.calendar.periods.map(p=>p.pillar),male.m7.luck.candidates[i].dayun.sequence.entries.map(e=>e.pillar));
    assert.equal(c.selection.status,'RESOLVED_UNDER_POLICY');
  }
  const female=assertValid(select(profile,request,'2026-11-01T12:00',boundaryFeatures('FEMALE')));
  for(let i=0;i<2;i++){
    const c=candidate(female,i);assert.equal(c.calendar.status,'AMBIGUOUS');assert.equal(c.calendar.firstStartMinute,null);assert.deepEqual(c.calendar.periods,[]);assert.equal(c.selection.status,'AMBIGUOUS');assert.equal(c.selection.selection,null);
    assert.equal(female.m7.luck.candidates[i].dayun.start.nominalIntervalMinutes,0);assert.equal(female.m7.luck.candidates[i].dayun.start.age,null);
  }
  assert.equal(female.explanation.candidates.length,2);assert.equal(male.m7.luck.executionCounts.seyunYearQueries,1);assert.equal(male.m7.luck.seyun.atMinute.entries.length,2);
});

test('data shortage and invalid direction input propagate per feature without fabricated calendar dates',()=>{
  const profile=pipeline(),late=assertValid(select(profile,chartRequest('2026-12-31','12:00'),'2026-12-31T12:00'));
  const held=nominal(late);assert.equal(held.status,'NEEDS_DATA');assert.equal(held.firstStartMinute,null);assert.deepEqual(held.periods,[]);
  assert.deepEqual(held.missingData,late.m7.luck.candidates[0].dayun.start.missingData);assert.equal(candidate(late).selection.status,'NEEDS_DATA');
  assert.equal(glyph(late.m7.luck.seyun.yearLabel.pillar),'丁未');
  const partial=assertValid(profile.calculate(chartRequest(),{dayun:{count:10},seyun:{yearLabel:2027}},{asOfMinute:'2026-11-01T12:00'}));
  assert.equal(partial.m7.luck.candidates[0].dayun.status,'INVALID_INPUT');assert.equal(nominal(partial).status,'INVALID_INPUT');assert.equal(nominal(partial).firstStartMinute,null);assert.equal(candidate(partial).selection.status,'INVALID_INPUT');
  assert.equal(partial.m7.luck.seyun.yearLabel.status,'OK');
  const outside=assertValid(profile.calculate(chartRequest(),{dayun:{count:10},seyun:{yearLabel:2027}},{asOfMinute:'2027-01-01T00:00'}));
  assert.equal(nominal(outside).status,'INVALID_INPUT');assert.equal(candidate(outside).selection.status,'POLICY_UNRESOLVED','query scope is held before interpreting an invalid starting-age input');
});

test('projection uses recorded civil birth minute and equivalent lunar input, not Zi effective day',()=>{
  const chart=chartFor(),profile=pipeline(chart),civil=assertValid(profile.calculate(chartRequest('2026-06-01','23:30','CIVIL_MIDNIGHT'),features())),zi=assertValid(profile.calculate(chartRequest('2026-06-01','23:30','ZI_START'),features()));
  assert.notEqual(civil.m7.m1.chart.effectiveDayDate,zi.m7.m1.chart.effectiveDayDate);
  assert.equal(nominal(zi).birthMinute,'2026-06-01T23:30');assert.equal(nominal(civil).intervalMinutes,4430);assert.equal(nominal(zi).intervalMinutes,4430);
  assert.equal(nominal(civil).firstStartMinute,'2027-06-11T03:30');assert.equal(nominal(zi).firstStartMinute,nominal(civil).firstStartMinute);
  const row=fixture.loaded.candidate.dates.find(r=>r.solarDate==='2026-06-01');
  const lunar={calendar:'KOREAN_LUNAR',lunarDate:{lunarYear:row.lunarYear,lunarMonth:row.lunarMonth,lunarDay:row.lunarDay,leap:row.leap},time:'23:30',policies:chartRequest().policies};
  const l=assertValid(profile.calculate(lunar,features()));assert.deepEqual(l.m7.m1.chart,civil.m7.m1.chart);assert.deepEqual(l.projection.candidates,civil.projection.candidates);assert.deepEqual(l.explanation,civil.explanation);
});

test('explicit projection policy and as-of clock are validated before birth computation while old annual-only mode remains independent',()=>{
  const chart=chartFor();let calls=0;const measured={...chart,calculate(request){calls++;return chart.calculate(request);}};
  for(const policy of [undefined,'AUTO','M7-CALENDAR-PROJECTION-UNRESOLVED-V01'])assert.throws(()=>pipeline(measured,{contextProfile:chart,calendarProjectionPolicyId:policy}));
  const profile=pipeline(measured,{contextProfile:chart});
  for(const requested of [{seyun:{yearLabel:2027}},{}])assert.throws(()=>profile.calculate(chartRequest(),requested));
  for(const query of ['2026-02-30T12:00','2026-11-01','2026-11-01T24:00','2026-11-01T12:00:00'])assert.throws(()=>profile.calculate(chartRequest(),features(),{asOfMinute:query}));
  assert.equal(calls,0,'missing policy/feature or malformed as-of must not call birth M1');
  assert.equal(profile.calculate(chartRequest(),features()).projection.candidates[0].selection,null);
  const existing=createLocalLuckProfile(chart,{luckPolicyId:M7_LUCK_POLICY_V01}).calculate(chartRequest(),{seyun:{yearLabel:2027}});assert.equal(existing.luck.candidates[0].dayun,null);
  assert.throws(()=>projectLocalLuckResult(existing,{calendarProjectionPolicyId:CALENDAR_PROJECTION_POLICY_V02}));
  const issued=createLocalLuckProfile(chart,{luckPolicyId:M7_LUCK_POLICY_V01}).calculate(chartRequest(),features());
  assert.throws(()=>projectLocalLuckResult(issued,{calendarProjectionPolicyId:CALENDAR_PROJECTION_POLICY_V02,asOfDate:'2026-11-01'}),'unknown adapter options must not silently create a query-less projection');
});

test('projection references and issued wrappers reject cross-candidate, policy, period and provenance substitution',()=>{
  const profile=pipeline(),request=chartRequest('2026-02-05','01:20');
  const get=sex=>profile.calculate(request,features(sex),{asOfMinute:'2026-11-01T12:00'});
  const value=assertValid(get('MALE'));assert.equal(Object.isFrozen(value.projection),true);
  assert.throws(()=>{value.projection.candidates[0].calendar.periods[0].startInclusive='2000-01-01T00:00';});
  for(const mutate of [
    v=>{v.candidates[0].candidateRef='chart.candidates[1]';},
    v=>{v.candidates[0].items[0].factRefs=['NONEXISTENT_FACT'];},
    v=>{v.candidates[0].items[0].ruleRefs=['NONEXISTENT_RULE'];},
    v=>{v.candidates[0].items[0].policyRefs=['NONEXISTENT_POLICY'];},
    v=>{v.candidates[0].items[0].sourceRefs=['NONEXISTENT_SOURCE'];},
    v=>{v.candidates[0].items[0].calculationSourceRefs=['NONEXISTENT_API_SOURCE'];},
    v=>{v.candidates[0].items[0].factRefs=[v.candidates[1].items[0].factRefs[0]];},
    v=>{v.candidates[0].items[0].text='정확한 교운 순간을 인증했다';},
  ]){const view=structuredClone(value.explanation);mutate(view);assert.throws(()=>validateLuckProjectionExplanation(view,value.projection));}
  const swapped=get('MALE'),other=get('FEMALE');swapped.projection=other.projection;swapped.explanation=other.explanation;assert.throws(()=>validateLocalLuckProjectionResult(swapped));
  const changed=get('MALE');changed.m7.m1.evidence.appliedJie[0].original.time='ALTERED';assert.throws(()=>validateLocalLuckProjectionResult(changed));
  const cloned=structuredClone(value);cloned.projection.policy.id='AUTO';assert.throws(()=>validateLocalLuckProjectionResult(cloned));
  assert.throws(()=>projectLocalLuckResult(structuredClone(value.m7),{calendarProjectionPolicyId:CALENDAR_PROJECTION_POLICY_V02}));
  const fresh=assertValid(get('MALE'));assert.deepEqual(fresh.projection,value.projection,'failed mutations must not contaminate a later request');
  assert.ok(fresh.projection.candidates.every(c=>c.facts.every(f=>f.candidateRef===c.candidateRef)));
  const rules=new Set(fresh.projection.rules.map(r=>r.id)),sources=new Set(fresh.projection.sources.map(s=>s.id));
  for(const c of fresh.projection.candidates)for(const fact of c.facts){assert.ok(fact.ruleRefs.length&&fact.ruleRefs.every(r=>rules.has(r)));assert.ok(fact.sourceRefs.every(r=>sources.has(r)));assert.ok(fact.calculationSourceRefs.every(r=>sources.has(r)));}
});

test('Korean projection text keeps nominal policy wording, separate candidates and query evidence',()=>{
  const profile=pipeline(modernChart()),result=assertValid(select(profile,chartRequest('1990-06-01','12:00'),'2026-11-01T12:00'));
  const text=renderLocalLuckProjectionText(result);assert.match(text,/명목/);assert.match(text,/1991-08-08T04:00/);assert.match(text,/2026-11-01T12:00/);assert.match(text,/제\s*4\s*대운/);assert.match(text,/乙酉/);
  assert.ok(text.includes(CALENDAR_PROJECTION_POLICY_V02));assert.match(text,/근거/);
  const boundary=assertValid(select(profile,chartRequest('1990-02-05','01:20'),'2026-11-01T12:00',features('FEMALE')));
  const held=renderLocalLuckProjectionText(boundary);assert.match(held,/후보 1/);assert.match(held,/후보 2/);assert.match(held,/미확정|AMBIGUOUS/);
  assert.equal((held.match(/^10\. /gm)??[]).length,2,'both held candidates must print all ten preserved cycle entries');
  assert.match(held,/^10\. 丁亥: 명목 기간 AMBIGUOUS로 미정$/m);assert.match(held,/^10\. 戊辰: 명목 기간 AMBIGUOUS로 미정$/m);
  const late=renderLocalLuckProjectionText(assertValid(select(profile,chartRequest('2026-12-31','12:00'),'2026-12-31T12:00')));
  assert.equal((late.match(/^\d+\. /gm)??[]).length,10);assert.match(late,/^10\. 庚戌: 명목 기간 NEEDS_DATA로 미정$/m);
});
