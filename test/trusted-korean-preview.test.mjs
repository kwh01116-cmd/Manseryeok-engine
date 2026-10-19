import test from 'node:test';
import assert from 'node:assert/strict';
import * as engine from '../dist/index.js';
import { Session } from 'node:inspector/promises';
import { KOREA_SOLAR_TERM_EVENTS_2026_2027 as events } from '../dist/calendar/koreaSolarTermFixtures.js';

const policies = {timeBasis:'KOREAN_CIVIL_TIME',dayRollover:'CIVIL_MIDNIGHT',hourStemReference:'SELECTED_DAY_PILLAR'};
const solar = date => ({calendar:'GREGORIAN',gregorianDate:date});
const lunar = (year,month,day,isLeapMonth=false) => ({calendar:'KOREAN_LUNAR',lunarDate:{lunarYear:year,lunarMonth:month,lunarDay:day,isLeapMonth}});
const hidden = engine.HIDDEN_STEM_POLICY_V1, pairs = engine.BRANCH_RELATIONS_POLICY_V1, triads = engine.TRIAD_MEMBERSHIP_POLICY_V1;
const run = (input=solar('2027-02-05'),clock='12:00',policy=policies) => engine.resolveTrustedKoreanLabPreview(input,clock,policy);
const clone = value => structuredClone(value);
const verify = (receipt,result) => engine.verifyTrustedKoreanLabPreview(receipt,result);
const v2 = (receipt,result=receipt.result) => engine.deriveTrustedM2ChartFactsV2(receipt,result,hidden,pairs);
const v3 = (receipt,result=receipt.result) => engine.deriveTrustedM2ChartFactsV3(receipt,result,hidden,pairs,triads);

test('G0 rejects nonempty forged M1 corpus sources that generic M2 v2/v3 accept',()=>{
  const receipt=run(),bad=clone(receipt.result);
  bad.preview.solarTermSourceIds=['FORGED-NONEMPTY'];
  // Preserve the scope of the generic primitives: structural checks are not a receipt.
  assert.equal(engine.deriveM2ChartFactsV2(bad,hidden,pairs).status,'READY');
  assert.equal(engine.deriveM2ChartFactsV3(bad,hidden,pairs,triads).status,'READY');
  assert.throws(()=>verify(receipt,bad),/Untrusted M1 preview/);
  assert.throws(()=>v2(receipt,bad),/Untrusted M1 preview/);
  assert.throws(()=>v3(receipt,bad),/Untrusted M1 preview/);
});

test('G0 accepts unchanged serialized data and preserves all generic M2 v1/v2/v3 facts',()=>{
  const receipt=run(),serialized=JSON.parse(JSON.stringify(receipt.result));
  // Property insertion order is not a provenance attribute.
  const reordered={preview:serialized.preview,status:serialized.status};
  assert.equal(verify(receipt,reordered),receipt.result);
  assert.deepEqual(engine.deriveTrustedM2ChartFacts(receipt,serialized,hidden),engine.deriveM2ChartFacts(receipt.result,hidden));
  assert.deepEqual(v2(receipt,serialized),engine.deriveM2ChartFactsV2(receipt.result,hidden,pairs));
  assert.deepEqual(v3(receipt,serialized),engine.deriveM2ChartFactsV3(receipt.result,hidden,pairs,triads));
});

test('G0 rejects missing, extra, wrong known and wrong-typed corpus provenance without repairing input',()=>{
  const receipt=run();
  for(const change of [
    p=>p.solarTermSourceIds=[],p=>delete p.solarTermSourceIds,
    p=>p.solarTermSourceIds=['KR-KASA-WOLRYEOK-2027'],
    p=>p.solarTermSourceIds=['KR-KASI-CALENDAR-DATA','KR-KASA-WOLRYEOK-2027'],
    p=>p.solarTermSourceIds='KR-KASI-CALENDAR-DATA',
    p=>p.coverage.supportedUntilExclusive='2029-01-01T00:00',
  ]){
    const bad=clone(receipt.result);change(bad.preview);const before=clone(bad);
    assert.throws(()=>verify(receipt,bad),RangeError);assert.throws(()=>v3(receipt,bad),RangeError);
    assert.deepEqual(bad,before);
  }
});

test('G0 pins applied Jie records independently of the corpus source union',()=>{
  const receipt=run(solar('2027-02-04'),'10:46');
  const trace=receipt.result.preview.monthBoundaryTrace;
  assert.deepEqual(trace.candidateContexts.map(c=>c.activeSince.term),['XIAOHAN','LICHUN']);
  for(const c of trace.candidateContexts){
    const record=events.find(e=>e.term===c.activeSince.term&&e.displayedDateTime===c.activeSince.displayedDateTime);
    assert.ok(record);assert.deepEqual(c.activeSince.sourceIds,record.sourceIds);
  }
  for(const change of [
    t=>t.candidateContexts[0].activeSince.sourceIds=['KR-KASA-WOLRYEOK-2027'],
    t=>t.candidateContexts[0].activeSince.displayedDateTime='2027-01-05T23:09',
    t=>t.candidateContexts[0].activeSince=clone(t.candidateContexts[1].activeSince),
    t=>t.atPublishedBoundary.sourceIds=['FORGED-NONEMPTY'],
    t=>t.atPublishedBoundary.sourcePrecision='SECOND',
    t=>t.candidateContexts[1].monthPillarFactRef='preview.candidates[0].month',
    t=>t.candidateContexts[1].candidateIndex=0,
    t=>t.schemaVersion='m1-month-boundary-trace-v2',
  ]){
    const bad=clone(receipt.result);change(bad.preview.monthBoundaryTrace);
    assert.throws(()=>verify(receipt,bad),RangeError);
  }
  const missing=clone(receipt.result);delete missing.preview.monthBoundaryTrace;
  assert.throws(()=>verify(receipt,missing),RangeError);
});

test('G0 preserves both Lichun candidates and refuses swapped/collapsed/foreign pillar data',()=>{
  const receipt=run(solar('2027-02-04'),'10:46'),facts=v3(receipt);
  assert.equal(facts.candidates.length,2);
  assert.deepEqual(facts.candidates.map(c=>c.pillars[1].branch),['丑','寅']);
  for(const [i,c] of facts.candidates.entries()){
    for(const hit of c.branchRelations){
      assert.equal(hit.leftFactRef,`preview.candidates[${i}].${hit.leftPillarRole}`);
      assert.equal(hit.rightFactRef,`preview.candidates[${i}].${hit.rightPillarRole}`);
    }
    for(const group of c.triadMemberships)for(const member of group.members)
      member.pillarFactRefs.forEach((ref,j)=>assert.equal(ref,`preview.candidates[${i}].${member.pillarRoles[j]}`));
  }
  for(const change of [
    p=>p.candidates.reverse(),p=>p.candidates.pop(),
    p=>p.candidates[0].month=clone(p.candidates[1].month),
    p=>p.candidates[0].year=clone(p.candidates[1].year),
    p=>p.candidates[0].day=clone(run().result.preview.candidates[0].day),
    p=>p.candidates[0].hour=clone(run().result.preview.candidates[0].hour),
  ]){
    const bad=clone(receipt.result);change(bad.preview);
    assert.throws(()=>v2(receipt,bad),RangeError);assert.throws(()=>v3(receipt,bad),RangeError);
  }
});

test('G0 distinguishes solar/lunar conversion provenance while preserving candidate/policy equivalence',()=>{
  const a=run(),b=run(lunar(2026,12,29));
  assert.deepEqual(a.result.preview.candidates,b.result.preview.candidates);
  assert.deepEqual(a.result.preview.policies,b.result.preview.policies);
  assert.deepEqual(v2(a).candidates,v2(b).candidates);assert.deepEqual(v3(a).candidates,v3(b).candidates);
  assert.equal(Object.hasOwn(a.result.preview,'lunarConversionSource'),false);
  assert.equal(b.result.preview.lunarConversionSource.corpusId,b.context.lunarCorpusId);
  assert.equal(b.context.annualCalendarEditions[2027],'V1.0a/2026-06-30T12:33');
  for(const change of [
    p=>delete p.lunarConversionSource,
    p=>p.lunarConversionSource.corpusId='kasi-lunisolar-2025-2027-other-edition',
    p=>p.lunarConversionSource.sourceId='ORG-USINGSKY-KOREAN-LUNAR-CALENDAR-PY-0.3.1',
    p=>p.lunarConversionSource.authorityLevel='OFFICIAL_KASA',
    p=>p.input.lunarDate.lunarDay=28,
  ]){
    const bad=clone(b.result);change(bad.preview);assert.throws(()=>verify(b,bad),RangeError);
  }
  const spurious=clone(a.result);spurious.preview.lunarConversionSource=clone(b.result.preview.lunarConversionSource);
  assert.throws(()=>verify(a,spurious),RangeError);assert.throws(()=>verify(a,b.result),RangeError);
  const edgeSolar=run(solar('2027-02-04'),'10:46'),edgeLunar=run(lunar(2026,12,28),'10:46');
  assert.deepEqual(v3(edgeSolar).candidates,v3(edgeLunar).candidates);
});

test('G0 rejects unknown time policies even outside coverage and keeps valid Zi policies distinct',()=>{
  for(const date of ['2027-02-05','2028-01-01'])for(const bad of [
    null,{}, {...policies,timeBasis:'UTC'}, {...policies,dayRollover:'AUTO'},
    {...policies,hourStemReference:'AUTO'},{...policies,school:'AUTO'},
  ])assert.throws(()=>run(solar(date),'23:30',bad),RangeError);
  const civil=run(solar('2027-02-05'),'23:30');
  const zi=run(solar('2027-02-05'),'23:30',{...policies,dayRollover:'ZI_START'});
  assert.notDeepEqual(civil.result.preview.candidates,zi.result.preview.candidates);
  assert.throws(()=>verify(civil,zi.result),RangeError);
  for(const dayRollover of ['CIVIL_MIDNIGHT','ZI_START'])for(const hourStemReference of ['SELECTED_DAY_PILLAR','CIVIL_DATE_DAY_PILLAR']){
    const receipt=run(solar('2027-02-05'),'23:30',{...policies,dayRollover,hourStemReference});
    assert.equal(v3(receipt).policies.hourStemReference,hourStemReference);
  }
});

test('G0 has no hidden-stem, pair or triad school default',()=>{
  const receipt=run();
  for(const bad of [undefined,null,'','AUTO','__proto__']){
    assert.throws(()=>engine.deriveTrustedM2ChartFacts(receipt,receipt.result,bad),RangeError);
    assert.throws(()=>engine.deriveTrustedM2ChartFactsV2(receipt,receipt.result,bad,pairs),RangeError);
    assert.throws(()=>engine.deriveTrustedM2ChartFactsV2(receipt,receipt.result,hidden,bad),RangeError);
    assert.throws(()=>engine.deriveTrustedM2ChartFactsV3(receipt,receipt.result,hidden,pairs,bad),RangeError);
  }
});

test('G0 rejects schema/confidence/locale mutations, unknown fields and forged portable receipts',()=>{
  const receipt=run();
  for(const change of [
    r=>r.status='READY',r=>r.preview.schemaVersion='m2-chart-facts-v3',
    r=>r.preview.locale='en-US',r=>r.preview.confidence='EXACT',
    r=>r.preview.extraSourceEdition='FORGED',r=>r.preview.policies.dayRollover='AUTO',
    r=>r.preview.effectiveDayDate='2027-02-06',r=>r.preview.recordedBirthKstMinute='2027-02-05T12:01',
  ]){
    const bad=clone(receipt.result);change(bad);assert.throws(()=>verify(receipt,bad),RangeError);
  }
  for(const fake of [null,{},clone(receipt),{...receipt},Object.create(receipt)]){
    assert.throws(()=>verify(fake,receipt.result),RangeError);assert.throws(()=>v3(fake,receipt.result),RangeError);
  }
  assert.throws(()=>verify(receipt,run(solar('2027-02-06')).result),RangeError);
});

test('G0 blocked results cannot be promoted to fabricated facts or a different failure',()=>{
  for(const [input,status] of [[solar('2028-01-01'),'OUT_OF_COVERAGE'],[lunar(2026,6,1,true),'INVALID_LUNAR_DATE']]){
    const receipt=run(input);assert.deepEqual(receipt.result,{status});
    assert.equal(v2(receipt).status,'BLOCKED');assert.equal(v3(receipt).status,'BLOCKED');
    assert.deepEqual(v3(receipt).candidates,[]);assert.equal(Object.hasOwn(v3(receipt),'solarTermSourceIds'),false);
    assert.throws(()=>verify(receipt,run().result),RangeError);
    assert.throws(()=>verify(receipt,{status:status==='OUT_OF_COVERAGE'?'INVALID_LUNAR_DATE':'OUT_OF_COVERAGE'}),RangeError);
  }
});

test('G0 rejects forged edition/manifest contexts and keeps wider lunar corpus outside Lab coverage',()=>{
  const receipt=run();
  for(const change of [
    c=>c.annualCalendarEditions[2027]='V1.0a/WRONG-EDITION',
    c=>c.lunarCorpusId='other-corpus',c=>c.solarTermCorpusId='other-corpus',
    c=>c.manifest.schemaVersion='m1-solar-term-coverage-v2',
    c=>c.manifest.supportedUntilExclusive='2029-01-01T00:00',
  ]){
    const fake=clone(receipt);change(fake.context);
    assert.throws(()=>verify(fake,receipt.result),RangeError);
  }
  assert.equal(run(lunar(2025,12,1)).result.status,'OK'); // 2026-01-19, not lunar-year filtering
  assert.equal(run(lunar(2025,1,1)).result.status,'OUT_OF_COVERAGE');
  assert.equal(run(lunar(2027,12,10)).result.status,'OUT_OF_COVERAGE');
  assert.equal(run(solar('2000-02-05')).result.status,'OUT_OF_COVERAGE');
  assert.equal(receipt.context.guarantee,'SELECTED_FIXTURE_AND_EXECUTION_CONSISTENCY_ONLY');
});

test('G0 preserves non-Lichun Jie candidates without manufacturing a year-boundary change',()=>{
  const receipt=run(solar('2027-03-06'),'04:40'),facts=v2(receipt);
  assert.equal(facts.candidates.length,2);
  assert.deepEqual(facts.candidates[0].pillars[0],{...facts.candidates[1].pillars[0],factRef:'preview.candidates[0].year'});
  assert.deepEqual(facts.candidates.map(c=>c.pillars[1].branch),['寅','卯']);
  assert.deepEqual(receipt.result.preview.monthBoundaryTrace.candidateContexts.map(c=>c.activeSince.term),['LICHUN','JINGZHE']);
  const bad=clone(receipt.result);bad.preview.monthBoundaryTrace.candidateContexts.reverse();
  assert.throws(()=>v2(receipt,bad),RangeError);
});

test('G0 receipt/context/result are immutable and do not read candidate getters or coercion hooks',()=>{
  const receipt=run(),input=solar('2027-02-05'),policy={...policies};
  const scoped=run(input,'12:00',policy);input.gregorianDate='2027-02-06';policy.dayRollover='ZI_START';
  assert.equal(verify(scoped,clone(scoped.result)),scoped.result);
  assert.throws(()=>receipt.result.preview.solarTermSourceIds.push('FORGED'),TypeError);
  assert.throws(()=>receipt.result.preview.candidates[0].day.stem='甲',TypeError);
  assert.throws(()=>receipt.context.annualCalendarEditions[2027]='FORGED',TypeError);
  assert.throws(()=>receipt.context.manifest.requiredYears.push(2028),TypeError);
  let reads=0;const bad=clone(receipt.result);
  Object.defineProperty(bad.preview,'solarTermSourceIds',{get(){reads++;return ['KR-KASI-CALENDAR-DATA'];}});
  assert.throws(()=>verify(receipt,bad),RangeError);assert.equal(reads,0);
  const withHook=clone(receipt.result);withHook.toJSON=()=>{reads++;return receipt.result;};
  assert.throws(()=>verify(receipt,withHook),RangeError);assert.equal(reads,0);
});

test('G0 verifies and derives M2 repeatedly with exactly one M1 resolver invocation',async()=>{
  const profiler=new Session();profiler.connect();
  try{
    await profiler.post('Profiler.enable');
    await profiler.post('Profiler.startPreciseCoverage',{callCount:true,detailed:false});
    const receipt=run();
    for(let i=0;i<3;i++){verify(receipt,clone(receipt.result));v2(receipt);v3(receipt);}
    const {result}=await profiler.post('Profiler.takePreciseCoverage');
    const module=result.find(entry=>entry.url.endsWith('/dist/calendar/koreanBirthPreview.js'));
    const resolver=module?.functions.find(fn=>fn.functionName==='resolveKoreanBirthChartPreview');
    assert.ok(resolver,'M1 resolver was observed by actual V8 function coverage');
    assert.equal(resolver.ranges[0].count,1,'verification/M2 must not call the M1 resolver again');
  }finally{await profiler.post('Profiler.stopPreciseCoverage');profiler.disconnect();}
});
