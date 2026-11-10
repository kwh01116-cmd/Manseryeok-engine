// Finite synthetic integration expectations; these are not independent calendar or luck predictions.
import test from 'node:test';
import assert from 'node:assert/strict';
import { createLocalChartProfile, STAGE_A_PROFILE_ID } from '../scripts/kasi/local-chart.mjs';
import { createLocalExplanationProfile } from '../scripts/kasi/local-explain.mjs';
import { createLocalLuckProfile, validateLocalLuckResult, validateLuckExplanation, renderLocalLuckText } from '../scripts/kasi/local-luck.mjs';
import { M7_LUCK_POLICY_V01 } from '../dist/luck/luckV01.js';
import { syntheticLocalChartCandidate, chartRequest } from './fixtures/kasi-local-chart-synthetic.mjs';

const fixture=syntheticLocalChartCandidate();
const createChart=(input=fixture)=>createLocalChartProfile(input.loaded,{profileId:STAGE_A_PROFILE_ID,expectedManifestSha256:input.expectedManifestSha256});
const createPipeline=(chart=createChart(),options={})=>createLocalLuckProfile(chart,{luckPolicyId:M7_LUCK_POLICY_V01,...options});
const dayun=(traditionalSex,count=3)=>({dayun:{traditionalSex,count}});
const glyph=p=>p.stem+p.branch;
function ageEquals(age,numerator,denominator){
  assert.ok(age);assert.equal(age.unit,'MODEL_YEAR');
  assert.ok(Number.isSafeInteger(age.numerator));assert.ok(Number.isSafeInteger(age.denominator)&&age.denominator>0);
  assert.equal(age.numerator*denominator,numerator*age.denominator);
}

test('local luck uses candidate year stem, adjacent month cycle, twelve Jie, and independent minute-ratio expectations',()=>{
  const pipeline=createPipeline();
  const forward=pipeline.calculate(chartRequest(),dayun('MALE'));
  const reverse=pipeline.calculate(chartRequest(),dayun('FEMALE'));
  assert.equal(forward.status,'OK');assert.equal(forward.schemaVersion,'kasi-local-luck-v01');
  assert.equal(glyph(forward.m1.chart.candidates[0].month),'癸巳');
  const f=forward.luck.candidates[0].dayun,r=reverse.luck.candidates[0].dayun;
  assert.equal(f.sequence.direction,'FORWARD');assert.equal(r.sequence.direction,'REVERSE');
  assert.equal(f.sequence.firstRelation,'ADJACENT_EXCLUDES_NATAL_MONTH');
  assert.deepEqual(f.sequence.entries.map(e=>glyph(e.pillar)),['甲午','乙未','丙申']);
  assert.deepEqual(r.sequence.entries.map(e=>glyph(e.pillar)),['壬辰','辛卯','庚寅']);
  assert.equal(f.start.selectedEvent.term,'MANGZHONG');assert.equal(f.start.selectedEvent.displayedDateTime,'2026-06-05T01:20');
  assert.equal(r.start.selectedEvent.term,'LIXIA');assert.equal(r.start.selectedEvent.displayedDateTime,'2026-05-05T01:20');
  // June1 noon → June5 01:20 =3d13h20m; May5 01:20 → June1 noon =27d10h40m.
  assert.equal(f.start.nominalIntervalMinutes,5120);ageEquals(f.start.age,32,27);
  assert.equal(r.start.nominalIntervalMinutes,39520);ageEquals(r.start.age,247,27);
  assert.equal(f.start.precision.actualInstantCertified,false);
  assert.equal(f.start.precision.unknownRounding,'NO_ASSUMED_SECONDS_INTERVAL');
  for(const id of f.start.selectedEvent.sourceIds){
    const source=forward.luck.sources.find(s=>s.id===id);assert.equal(source.kind,'CALENDAR_API');
    assert.equal(source.evidence.original.date+'T'+source.evidence.original.time,f.start.selectedEvent.displayedDateTime);
    assert.equal(source.evidence.sourceRef,source.evidence.original.sourceRef);
    assert.equal(source.evidence.source.serviceId,'15012690');assert.equal(source.evidence.source.operation,'get24DivisionsInfo');
    assert.equal(source.evidence.original.timeBasis,'API_KST_AS_PUBLISHED');assert.equal(source.evidence.original.historicalCivilTime,'NOT_RESOLVED');
  }
  assert.equal(forward.luck.validation.g0Receipt,null);assert.equal(forward.luck.validation.g1P2Promotion,false);
  assert.equal(forward.luck.validation.editionVerification,'UNVERIFIED');assert.equal(forward.luck.validation.rightsReview,'UNVERIFIED');
  assert.equal(forward.luck.validation.predictiveValidity,'NOT_CLAIMED');
  assert.equal(f.start.calendarProjection.status,'POLICY_UNRESOLVED');assert.equal(f.start.calendarProjection.exactStartDate,null);
  ageEquals(f.modelAgeIntervals[0].startInclusive,32,27);
  ageEquals(f.modelAgeIntervals[0].endExclusive,302,27);
  ageEquals(f.modelAgeIntervals[1].startInclusive,302,27);
  assert.equal(f.modelAgeIntervals[0].unit,'MODEL_YEAR');
  const early=pipeline.calculate(chartRequest('2026-01-01','12:00'),dayun('MALE')).luck.candidates[0].dayun;
  assert.equal(early.sequence.direction,'REVERSE','January still uses the previous Lichun-year stem');
  assert.equal(early.start.selectedEvent.term,'DAXUE');assert.equal(early.start.selectedEvent.displayedDateTime,'2025-12-05T01:20');
  assert.equal(early.start.nominalIntervalMinutes,39520);ageEquals(early.start.age,247,27);
  const ten=pipeline.calculate(chartRequest(),dayun('MALE',10));
  assert.equal(ten.luck.candidates[0].dayun.sequence.entries.length,10);
  assert.equal(glyph(ten.luck.candidates[0].dayun.sequence.entries[9].pillar),'癸卯');
  assert.match(renderLocalLuckText(ten),/^10\. 癸卯: \[2462\/27, 2732\/27\) 모형년$/m,'TEXT must include the tenth requested period and its model interval, not only a three-pillar preview');
});

test('Lichun preserves the two correlated direction/start branches and never promotes coincident nominal zero into exact age',()=>{
  const pipeline=createPipeline(),request=chartRequest('2026-02-05','01:20');
  const male=pipeline.calculate(request,dayun('MALE'));
  assert.equal(male.m1.chart.confidence,'PUBLISHED_MINUTE_AMBIGUOUS');assert.equal(male.luck.candidates.length,2);
  const [before,after]=male.luck.candidates;
  assert.equal(before.candidateRef,'chart.candidates[0]');assert.equal(after.candidateRef,'chart.candidates[1]');
  assert.deepEqual(male.m1.chart.candidates.map(c=>[glyph(c.year),glyph(c.month)]),[['乙巳','己丑'],['丙午','庚寅']]);
  assert.equal(before.dayun.sequence.direction,'REVERSE');assert.equal(after.dayun.sequence.direction,'FORWARD');
  assert.deepEqual(before.dayun.sequence.entries.map(e=>glyph(e.pillar)),['戊子','丁亥','丙戌']);
  assert.deepEqual(after.dayun.sequence.entries.map(e=>glyph(e.pillar)),['辛卯','壬辰','癸巳']);
  assert.equal(before.dayun.start.selectedEvent.term,'XIAOHAN');assert.equal(after.dayun.start.selectedEvent.term,'JINGZHE');
  assert.equal(before.dayun.start.nominalIntervalMinutes,44640);ageEquals(before.dayun.start.age,31,3);
  assert.ok(before.dayun.start.age.numerator>10*before.dayun.start.age.denominator,'a 31-day term interval must not be clamped to ten model years');
  assert.equal(after.dayun.start.nominalIntervalMinutes,40320);ageEquals(after.dayun.start.age,28,3);
  const female=pipeline.calculate(request,dayun('FEMALE'));
  assert.deepEqual(female.luck.candidates.map(c=>c.dayun.sequence.direction),['FORWARD','REVERSE']);
  for(const c of female.luck.candidates){
    assert.equal(c.dayun.start.status,'AMBIGUOUS');assert.equal(c.dayun.start.selectedEvent.term,'LICHUN');
    assert.equal(c.dayun.start.nominalIntervalMinutes,0);assert.equal(c.dayun.start.age,null);assert.equal(c.dayun.start.displayAge,null);
    assert.equal(c.dayun.sequence.entries.length,3);
  }
  assert.equal(female.explanation.candidates.length,2);
});

test('missing next-year Jie affects start age only while cycle order and annual label remain available',()=>{
  const pipeline=createPipeline();
  const result=pipeline.calculate(chartRequest('2026-12-31','12:00'),{...dayun('MALE'),seyun:{yearLabel:2027,queryMinute:'2027-02-04T12:00'}});
  assert.equal(result.status,'OK');assert.equal(result.m1.status,'OK');
  const c=result.luck.candidates[0];
  assert.equal(c.dayun.sequence.status,'OK');assert.deepEqual(c.dayun.sequence.entries.slice(0,3).map(e=>glyph(e.pillar)),['辛丑','壬寅','癸卯']);
  assert.equal(c.dayun.start.status,'NEEDS_DATA');assert.equal(c.dayun.start.age,null);
  assert.ok(c.dayun.start.missingData.some(r=>r.year===2027&&r.term==='XIAOHAN'&&r.feature==='DA_YUN_START'));
  assert.equal(result.luck.seyun.yearLabel.status,'OK');assert.equal(glyph(result.luck.seyun.yearLabel.pillar),'丁未');
  assert.equal(result.luck.seyun.atMinute.status,'NEEDS_DATA');
  assert.ok(result.luck.seyun.atMinute.missingData.some(r=>r.year===2027&&r.term==='LICHUN'&&r.feature==='ANNUAL_LUCK_AT_MINUTE'));
  const reverse=pipeline.calculate(chartRequest('2026-12-31','12:00'),dayun('FEMALE'));
  assert.equal(reverse.luck.candidates[0].dayun.start.status,'OK');assert.equal(reverse.luck.candidates[0].dayun.start.selectedEvent.term,'DAXUE');
});

test('annual-only calculation needs no traditional sex, uses Lichun rather than Jan1 or a lunar-year transition',()=>{
  const pipeline=createPipeline();
  const annual=queryMinute=>pipeline.calculate(chartRequest(),{seyun:{queryMinute}});
  const jan=annual('2026-01-01T12:00');assert.equal(jan.luck.seyun.atMinute.status,'OK');
  assert.equal(glyph(jan.luck.seyun.atMinute.entries[0].pillar),'乙巳');
  const before=annual('2026-02-05T01:19'),at=annual('2026-02-05T01:20'),after=annual('2026-02-05T01:21');
  assert.equal(glyph(before.luck.seyun.atMinute.entries[0].pillar),'乙巳');
  assert.equal(at.luck.seyun.atMinute.status,'AMBIGUOUS');assert.deepEqual(at.luck.seyun.atMinute.entries.map(e=>glyph(e.pillar)),['乙巳','丙午']);
  assert.equal(glyph(after.luck.seyun.atMinute.entries[0].pillar),'丙午');
  // The fixture's lunar-year transition is fictional and deliberately not used as an annual boundary.
  const lunarNewYear=fixture.loaded.candidate.dates.find(r=>r.lunarYear===2026&&r.lunarMonth===1&&r.lunarDay===1);
  assert.ok(lunarNewYear);assert.equal(glyph(annual(lunarNewYear.solarDate+'T12:00').luck.seyun.atMinute.entries[0].pillar),'丙午');
  assert.match(JSON.stringify(jan.luck.candidates[0].seyun.birthRelation),/BEFORE_BIRTH/);
});

test('one birth M1 call is preserved with optional M2 while annual query and label calls are counted separately',()=>{
  const chart=createChart();let calls=0;
  const measured={...chart,calculate(request){calls++;return chart.calculate(request);}};
  const pipeline=createPipeline(measured,{contextProfile:chart,m2ProfileId:'m2-basic-classification-local-v1'});
  const request=chartRequest('2026-02-05','01:20');
  const result=pipeline.calculate(request,{...dayun('MALE'),seyun:{yearLabel:2027,queryMinute:'2026-02-05T01:20'}});
  assert.equal(calls,1);assert.deepEqual(result.luck.executionCounts,{birthM1Calls:1,seyunYearQueries:1,seyunLabelCalls:1});
  assert.equal(result.luck.candidates.length,2);assert.equal(result.luck.seyun.atMinute.entries.length,2);
  assert.ok(result.baseExplanation);assert.deepEqual(result.baseExplanation.m1,result.m1);
  const existing=createLocalExplanationProfile(chart,{m2ProfileId:'m2-basic-classification-local-v1'}).calculate(request);
  assert.deepEqual(result.baseExplanation,existing,'optional M7 must not replace or weaken the existing M2 output');
  assert.match(JSON.stringify(result.luck.candidates[0].seyun.birthRelation),/SAME_REPORTED_MINUTE_NO_INSTANT_ORDER_CLAIM/);
});

test('Zi changes effective day only and does not move the birth minute used for start age',()=>{
  const pipeline=createPipeline();
  const civil=pipeline.calculate(chartRequest('2026-06-01','23:30','CIVIL_MIDNIGHT'),dayun('MALE'));
  const zi=pipeline.calculate(chartRequest('2026-06-01','23:30','ZI_START'),dayun('MALE'));
  assert.equal(civil.m1.chart.effectiveDayDate,'2026-06-01');assert.equal(zi.m1.chart.effectiveDayDate,'2026-06-02');
  assert.equal(civil.luck.candidates[0].dayun.start.birthMinute,'2026-06-01T23:30');
  assert.equal(zi.luck.candidates[0].dayun.start.birthMinute,'2026-06-01T23:30');
  assert.equal(civil.luck.candidates[0].dayun.start.nominalIntervalMinutes,4430);
  assert.equal(zi.luck.candidates[0].dayun.start.nominalIntervalMinutes,4430);
});

test('invalid dayun is feature-local when annual data is requested, and policy/context forgery never falls back',()=>{
  const chart=createChart();let calls=0;
  const measured={...chart,calculate(request){calls++;return chart.calculate(request);}};
  const pipeline=createPipeline(measured,{contextProfile:chart});
  const partial=pipeline.calculate(chartRequest(),{dayun:{count:3},seyun:{yearLabel:2027}});
  assert.equal(partial.status,'OK');assert.equal(partial.luck.candidates[0].dayun.status,'INVALID_INPUT');
  assert.equal(partial.luck.candidates[0].dayun.sequence,null);assert.equal(glyph(partial.luck.seyun.yearLabel.pillar),'丁未');
  for(const invalid of [{},{traditionalSex:'UNKNOWN',count:3},{traditionalSex:'MALE',count:21},{traditionalSex:'MALE',count:0},{traditionalSex:'MALE',count:1.5}]){
    const before=calls;assert.throws(()=>pipeline.calculate(chartRequest(),{dayun:invalid}));assert.equal(calls,before,'invalid dayun-only requests must fail before birth computation');
  }
  for(const id of [undefined,'','AUTO','M4-RULE-LUCK-CYCLE-001'])assert.throws(()=>createLocalLuckProfile(chart,{luckPolicyId:id}));
  const changed=syntheticLocalChartCandidate({lichunTime:'02:20'}),other=createChart(changed);
  assert.throws(()=>createPipeline(chart,{contextProfile:other}).calculate(chartRequest(),dayun('MALE')),'independently valid wrong-pin context must be rejected');
  const original=chart.calculate(chartRequest());original.chart=structuredClone(original.chart);original.chart.candidates[0].year={stem:'甲',branch:'子'};
  assert.throws(()=>createPipeline({calculate(){return original;}},{contextProfile:chart}).calculate(chartRequest(),dayun('MALE')));
  assert.throws(()=>createPipeline({calculate(){return structuredClone(chart.calculate(chartRequest()));}},{contextProfile:chart}).calculate(chartRequest(),dayun('MALE')));
});

test('candidate-local luck facts and Korean explanations reject cross-candidate refs and result mutation',()=>{
  const pipeline=createPipeline();
  const result=pipeline.calculate(chartRequest('2026-02-05','01:20'),{...dayun('FEMALE'),seyun:{queryMinute:'2026-02-05T01:20'}});
  assert.doesNotThrow(()=>validateLocalLuckResult(result));
  assert.doesNotThrow(()=>validateLuckExplanation(structuredClone(result.explanation),result.luck));
  for(const c of result.explanation.candidates){
    const facts=result.luck.candidates[c.candidateIndex].facts;
    for(const item of c.items){assert.equal(item.candidateRef,c.candidateRef);assert.ok(item.factRefs.length>0);assert.ok(item.factRefs.every(id=>facts.some(f=>f.id===id)));}
  }
  const attempts=[
    view=>{view.candidates[0].items[0].factRefs=[result.luck.candidates[1].facts[0].id];},
    view=>{view.candidates[0].items[0].ruleRefs=['UNKNOWN_RULE'];},
    view=>{view.candidates[0].items[0].sourceRefs=['UNKNOWN_SOURCE'];},
    view=>{view.candidates[0].items[0].policyRefs=['UNKNOWN_POLICY'];},
    view=>{view.candidates[0].items[0].templateId='UNKNOWN_TEMPLATE';},
    view=>{view.candidates[0].items[0].text='이 대운에는 반드시 돈을 번다.';},
  ];
  for(const change of attempts){const invalid=structuredClone(result.explanation);change(invalid);assert.throws(()=>validateLuckExplanation(invalid,result.luck));}
  const forged=structuredClone(result);forged.luck.candidates[0].dayun.sequence.entries[0].pillar={stem:'甲',branch:'子'};assert.throws(()=>validateLocalLuckResult(forged));
  // Two individually issued payloads may share birth data but have different explicitly selected traditional inputs.
  // A wrapper must not be relabelled by swapping another request's valid luck payload into it.
  const male=pipeline.calculate(chartRequest(),dayun('MALE')),female=pipeline.calculate(chartRequest(),dayun('FEMALE'));
  let swapped=false;
  try{male.luck=female.luck;male.explanation=female.explanation;swapped=true;}catch(error){assert.ok(error instanceof TypeError);}
  if(swapped)assert.throws(()=>validateLocalLuckResult(male),'an issued luck result from another traditional input must not authenticate this wrapper');
  const schemaProbe=pipeline.calculate(chartRequest(),dayun('MALE'));let changedSchema=false;
  try{schemaProbe.schemaVersion='FORGED_SCHEMA';changedSchema=true;}catch(error){assert.ok(error instanceof TypeError);}
  if(changedSchema)assert.throws(()=>validateLocalLuckResult(schemaProbe));
  const m1Probe=pipeline.calculate(chartRequest(),dayun('MALE')),otherM1=pipeline.calculate(chartRequest(),dayun('MALE'));let changedM1=false;
  try{m1Probe.m1=otherM1.m1;changedM1=true;}catch(error){assert.ok(error instanceof TypeError);}
  if(changedM1)assert.throws(()=>validateLocalLuckResult(m1Probe),'same-valued M1 from a separate invocation is not this invocation');
  const withM2=createPipeline(createChart(),{m2ProfileId:'m2-basic-classification-local-v1'});
  const baseProbe=withM2.calculate(chartRequest(),dayun('MALE')),otherBase=withM2.calculate(chartRequest(),dayun('FEMALE'));let changedBase=false;
  try{baseProbe.baseExplanation={...otherBase.baseExplanation,m1:baseProbe.m1};changedBase=true;}catch(error){assert.ok(error instanceof TypeError);}
  if(changedBase)assert.throws(()=>validateLocalLuckResult(baseProbe),'a relabelled base explanation must not replace the issued base');
  const baseParts=withM2.calculate(chartRequest(),dayun('MALE')),differentBirth=withM2.calculate(chartRequest('2026-06-02'),dayun('MALE'));let swappedParts=false;
  try{baseParts.baseExplanation.facts=differentBirth.baseExplanation.facts;baseParts.baseExplanation.explanation=differentBirth.baseExplanation.explanation;swappedParts=true;}catch(error){assert.ok(error instanceof TypeError);}
  if(swappedParts)assert.throws(()=>validateLocalLuckResult(baseParts),'another birth\'s individually valid M2 facts and explanation must not be relabelled inside the issued base object');
  const expected=JSON.stringify(result.luck),next=pipeline.calculate(chartRequest('2026-02-05','01:20'),{...dayun('FEMALE'),seyun:{queryMinute:'2026-02-05T01:20'}});
  assert.equal(JSON.stringify(next.luck),expected);
  const text=renderLocalLuckText(result);assert.match(text,/순행/);assert.match(text,/역행/);assert.match(text,/교운일/);assert.match(text,/모형/);
});
