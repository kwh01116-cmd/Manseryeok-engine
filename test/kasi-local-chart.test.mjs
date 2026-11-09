// Synthetic connection/regression cases only. Real API integration is run separately.
import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, rm, readFile, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { fingerprint } from '../.kasi-build/schema.js';
import { createLocalChartProfile, loadLocalChartProfile, STAGE_A_PROFILE_ID, MODERN_PROFILE_ID, MODERN_CLOCK_POLICY_ID } from '../scripts/kasi/local-chart.mjs';
import { syntheticLocalChartCandidate, syntheticModernLocalChartCandidate, sealSyntheticLocalChartCandidate, writeSyntheticLocalChartCandidate, chartRequest, chartSemantics } from './fixtures/kasi-local-chart-synthetic.mjs';

const profileFor = fixture => createLocalChartProfile(fixture.loaded,{profileId:STAGE_A_PROFILE_ID,expectedManifestSha256:fixture.expectedManifestSha256});
function rejected(action) {
  let result;
  try {result=action();}
  catch(error) {assert.ok(error instanceof Error);return;}
  assert.notEqual(result?.status,'OK','invalid request must not calculate');
}
async function temporary(action) {
  const directory=await mkdtemp(join(tmpdir(),'kasi-chart-synthetic-'));
  try {return await action(directory);} finally {await rm(directory,{recursive:true,force:true});}
}
function lunarRequest(row,time='12:00',policies=chartRequest().policies) {
  return {calendar:'KOREAN_LUNAR',lunarDate:{lunarYear:row.lunarYear,lunarMonth:row.lunarMonth,lunarDay:row.lunarDay,leap:row.leap},time,policies};
}

test('local chart uses API dates and distinct receipt references for both calendar inputs',()=>{
  const fixture=syntheticLocalChartCandidate(), profile=profileFor(fixture), row=fixture.loaded.candidate.dates.find(r=>r.solarDate==='2026-06-01');
  const gregorian=profile.calculate(chartRequest(row.solarDate)), lunar=profile.calculate(lunarRequest(row));
  assert.equal(gregorian.status,'OK');assert.equal(lunar.status,'OK');
  assert.deepEqual(chartSemantics(gregorian),chartSemantics(lunar));
  assert.equal(gregorian.input.calendar,'GREGORIAN');assert.equal(lunar.input.calendar,'KOREAN_LUNAR');
  assert.equal(gregorian.evidence.dateConversion.sourceRef,row.sourceRef);
  assert.equal(lunar.evidence.dateConversion.sourceRef,row.sourceRef);
  assert.equal(lunar.evidence.dateConversion.source.serviceId,'15012679');
  assert.equal(lunar.evidence.dateConversion.source.operation,'getLunCalInfo');
  assert.ok(gregorian.evidence.appliedJie.length>0);
  for(const event of gregorian.evidence.appliedJie) {
    assert.equal(event.source.serviceId,'15012690');assert.equal(event.source.operation,'get24DivisionsInfo');
    assert.equal(event.original.timeBasis,'API_KST_AS_PUBLISHED');
    assert.equal(event.original.historicalCivilTime,'NOT_RESOLVED');
  }
  const ids=gregorian.chart.monthBoundaryTrace.candidateContexts.flatMap(c=>c.activeSince.sourceIds);
  assert.ok(ids.every(id=>id!=='KR-KASI-CALENDAR-DATA'));
  assert.equal(gregorian.profile.id,STAGE_A_PROFILE_ID);
});

test('independently pinned synthetic Jie time changes alter the actual chart boundary',()=>{
  const original=syntheticLocalChartCandidate(), changed=syntheticLocalChartCandidate({lichunTime:'02:20'});
  assert.notEqual(original.expectedManifestSha256,changed.expectedManifestSha256);
  const request=chartRequest('2026-02-05','01:50'), before=profileFor(original).calculate(request), after=profileFor(changed).calculate(request);
  assert.equal(before.status,'OK');assert.equal(after.status,'OK');
  assert.equal(before.chart.confidence,'DEFINITE');assert.equal(after.chart.confidence,'DEFINITE');
  assert.notDeepEqual(before.chart.candidates[0].year,after.chart.candidates[0].year);
  assert.notDeepEqual(before.chart.candidates[0].month,after.chart.candidates[0].month);
  // API calendar ganji are deliberately constant dummy values in this fixture.
  assert.equal(original.loaded.candidate.dates[0].ganji.year,'갑자(甲子)');
  assert.notDeepEqual(before.chart.candidates[0].year,{stem:'甲',branch:'子'});
});

test('displayed Lichun minute retains exactly two correlated year/month candidates',()=>{
  const profile=profileFor(syntheticLocalChartCandidate()), request=chartRequest('2026-02-05','01:20');
  const result=profile.calculate(request), before=profile.calculate({...request,time:'01:19'}), after=profile.calculate({...request,time:'01:21'});
  assert.equal(result.chart.confidence,'PUBLISHED_MINUTE_AMBIGUOUS');
  assert.equal(result.chart.candidates.length,2);
  assert.deepEqual(result.chart.candidates,[before.chart.candidates[0],after.chart.candidates[0]]);
  assert.deepEqual(result.chart.monthBoundaryTrace.candidateContexts.map(r=>r.boundarySide),['BEFORE_PUBLISHED_MINUTE','AFTER_PUBLISHED_MINUTE']);
  assert.equal(result.chart.monthBoundaryTrace.atPublishedBoundary.term,'LICHUN');
});

test('shared annual receipt never replaces the actual applied Jie event in evidence',()=>{
  const fixture=syntheticLocalChartCandidate(), profile=profileFor(fixture);
  for(const [date,time] of [['2026-02-05','01:20'],['2026-03-05','01:20'],['2026-06-01','12:00']]) {
    const result=profile.calculate(chartRequest(date,time)), trace=result.chart.monthBoundaryTrace;
    for(const applied of trace.candidateContexts.map(c=>c.activeSince).concat(trace.atPublishedBoundary?[trace.atPublishedBoundary]:[])) {
      const matching=result.evidence.appliedJie.filter(e=>e.original.termCode===applied.term && e.original.date+'T'+e.original.time===applied.displayedDateTime);
      assert.equal(matching.length,1,'each resolver-used event must retain its own original row');
      assert.equal(matching[0].interpreted.displayedDateTime,applied.displayedDateTime);
      assert.equal(matching[0].interpreted.sourcePrecision,applied.sourcePrecision);
      assert.equal(matching[0].interpreted.timeBasis,applied.timeBasis);
      assert.ok(applied.sourceIds.every(id=>id.includes(matching[0].sourceRef) && id.includes(applied.term)));
    }
  }
  const march=profile.calculate(chartRequest('2026-03-05','01:20'));
  assert.deepEqual(march.evidence.appliedJie.map(e=>e.original.termCode),['LICHUN','JINGZHE']);
  assert.equal(new Set(march.evidence.appliedJie.map(e=>e.sourceRef)).size,1,'annual XML is legitimately shared');
  assert.equal(new Set(march.chart.monthBoundaryTrace.candidateContexts.map(c=>c.activeSince.sourceIds[0])).size,2,'event identities must remain distinct');
});

test('a Daxue guard mislabeled onto another month is rejected even with a coherent new synthetic pin',()=>{
  const packet=syntheticLocalChartCandidate(), guard=packet.loaded.candidate.events.find(e=>e.date.startsWith('2025-'));
  guard.date='2025-11-05';guard.computationalCivilDateTime=guard.date+'T'+guard.time;
  const changed=sealSyntheticLocalChartCandidate(packet.loaded.candidate,packet.loaded.sources);
  assert.throws(()=>profileFor(changed),/DAXUE_GUARD_MUST_BE_DECEMBER/);
});

test('all explicit existing day/hour policies are preserved at civil midnight and Zi boundary',()=>{
  const profile=profileFor(syntheticLocalChartCandidate()), outputs=new Map();
  for(const rollover of ['CIVIL_MIDNIGHT','ZI_START']) for(const hour of ['SELECTED_DAY_PILLAR','CIVIL_DATE_DAY_PILLAR']) {
    const result=profile.calculate(chartRequest('2026-12-31','23:30',rollover,hour));
    assert.equal(result.status,'OK');assert.equal(result.chart.policies.dayRollover,rollover);assert.equal(result.chart.policies.hourStemReference,hour);
    assert.equal(result.chart.effectiveDayDate,rollover==='ZI_START'?'2027-01-01':'2026-12-31');
    outputs.set(rollover+':'+hour,result.chart.candidates[0]);
  }
  assert.deepEqual(outputs.get('CIVIL_MIDNIGHT:SELECTED_DAY_PILLAR'),outputs.get('CIVIL_MIDNIGHT:CIVIL_DATE_DAY_PILLAR'));
  assert.deepEqual(outputs.get('ZI_START:SELECTED_DAY_PILLAR').day,outputs.get('ZI_START:CIVIL_DATE_DAY_PILLAR').day);
  assert.notDeepEqual(outputs.get('ZI_START:SELECTED_DAY_PILLAR').hour,outputs.get('ZI_START:CIVIL_DATE_DAY_PILLAR').hour);
  assert.equal(profile.calculate(chartRequest('2026-12-31','22:59','ZI_START')).chart.effectiveDayDate,'2026-12-31');
});

test('missing guard, profile choice or changed fixed candidate/manifest/source provenance fails closed',()=>{
  assert.throws(()=>profileFor(syntheticLocalChartCandidate({dropGuard:true})));
  const fixture=syntheticLocalChartCandidate();
  assert.throws(()=>createLocalChartProfile(fixture.loaded,{expectedManifestSha256:fixture.expectedManifestSha256}));
  assert.throws(()=>createLocalChartProfile(fixture.loaded,{profileId:'unknown',expectedManifestSha256:fixture.expectedManifestSha256}));
  assert.throws(()=>createLocalChartProfile(fixture.loaded,{profileId:STAGE_A_PROFILE_ID,expectedManifestSha256:'0'.repeat(64)}));
  const tampered=syntheticLocalChartCandidate();tampered.loaded.candidate.events[3].time='02:20';
  assert.throws(()=>profileFor(tampered));
  const wrongSource=syntheticLocalChartCandidate();wrongSource.loaded.sources[0].operation='wrongOperation';
  assert.throws(()=>profileFor(wrongSource));
  // Even a newly pinned synthetic packet must have semantically correct service provenance.
  const packet=syntheticLocalChartCandidate(), src=packet.loaded.sources[0], old=src.id;
  src.operation='getLunCalInfo';const {id,...receipt}=src;src.id=fingerprint(receipt);
  for(const e of packet.loaded.candidate.events) if(e.sourceRef===old)e.sourceRef=src.id;
  const resealed=sealSyntheticLocalChartCandidate(packet.loaded.candidate,packet.loaded.sources);
  assert.throws(()=>profileFor(resealed));
});

test('strict birth scope, leap flag and explicit time/policies have no implicit defaults',()=>{
  const fixture=syntheticLocalChartCandidate(), profile=profileFor(fixture), request=chartRequest();
  for(const date of ['2025-12-31','2027-01-01','2026-02-30','2026-2-01','garbage']) rejected(()=>profile.calculate({...request,date}));
  for(const time of [undefined,null,'','24:00','9:00','12:60']) rejected(()=>profile.calculate({...request,time}));
  rejected(()=>profile.calculate({...request,policies:undefined}));
  rejected(()=>profile.calculate({...request,policies:{...request.policies,clockPolicyId:'unknown'}}));
  rejected(()=>profile.calculate({...request,policies:{...request.policies,dayRollover:undefined}}));
  rejected(()=>profile.calculate({...request,policies:{...request.policies,hourStemReference:undefined}}));
  assert.equal(request.policies.clockPolicyId,MODERN_CLOCK_POLICY_ID);
  const first=fixture.loaded.candidate.dates[0];
  assert.equal(first.lunarYear,2025);
  assert.equal(profile.calculate(lunarRequest(first)).status,'OK','lunar-year label alone must not reject an in-range civil date');
  rejected(()=>profile.calculate({...lunarRequest(first),lunarDate:{...first,leap:undefined}}));
  rejected(()=>profile.calculate({...lunarRequest(first),lunarDate:{lunarYear:2026,lunarMonth:1,lunarDay:1,leap:true}}));
  const leap=fixture.loaded.candidate.dates.find(r=>r.leap);
  const regular=fixture.loaded.candidate.dates.find(r=>r.lunarYear===leap.lunarYear && r.lunarMonth===leap.lunarMonth && r.lunarDay===leap.lunarDay && !r.leap);
  const l=profile.calculate(lunarRequest(leap)), r=profile.calculate(lunarRequest(regular));
  assert.equal(l.status,'OK');assert.equal(r.status,'OK');assert.notEqual(l.input.gregorianDate,r.input.gregorianDate);
});

test('alternating requests/profiles and mutation of returned objects cannot mix caches or evidence',()=>{
  const a=profileFor(syntheticLocalChartCandidate()), b=profileFor(syntheticLocalChartCandidate({lichunTime:'02:20'}));
  const request=chartRequest('2026-02-05','01:50'), first=a.calculate(request), expected=chartSemantics(first);
  for(const date of ['2026-01-01','2026-12-31','2026-06-01']) {
    b.calculate(chartRequest(date,'23:30','ZI_START','CIVIL_DATE_DAY_PILLAR'));
    assert.deepEqual(chartSemantics(a.calculate(request)),expected);
  }
  try {first.chart.candidates[0].year.stem='壬';} catch(error) {assert.ok(error instanceof TypeError);}
  try {first.evidence.dateConversion.source.operation='mutated';} catch(error) {assert.ok(error instanceof TypeError);}
  const again=a.calculate(request);assert.deepEqual(chartSemantics(again),expected);
  assert.equal(again.evidence.dateConversion.source.operation,'getLunCalInfo');
});

test('pinned disk loading rejects absent candidates and data/manifest tampering without fixture fallback',async()=>temporary(async directory=>{
  const fixture=await writeSyntheticLocalChartCandidate(directory), options={directory,profileId:STAGE_A_PROFILE_ID,expectedManifestSha256:fixture.expectedManifestSha256};
  const profile=await loadLocalChartProfile(options);assert.equal(profile.calculate(chartRequest()).status,'OK');
  const candidatePath=join(directory,'candidate.json'), original=await readFile(candidatePath);
  await rm(candidatePath);await assert.rejects(()=>loadLocalChartProfile(options));
  await writeFile(candidatePath,original);
  const altered=JSON.parse(original);altered.events[3].time='02:20';await writeFile(candidatePath,JSON.stringify(altered));
  await assert.rejects(()=>loadLocalChartProfile(options));
  await writeFile(candidatePath,original);
  const manifestPath=join(directory,'manifest.json'), manifest=JSON.parse(await readFile(manifestPath,'utf8'));
  manifest.counts.solar=999;await writeFile(manifestPath,JSON.stringify(manifest));
  await assert.rejects(()=>loadLocalChartProfile(options));
}));

let modernSynthetic;
const modernPacket=()=>modernSynthetic??=syntheticModernLocalChartCandidate();
const modernProfile=()=>{const fixture=modernPacket();return createLocalChartProfile(fixture.loaded,{profileId:MODERN_PROFILE_ID,expectedManifestSha256:fixture.expectedManifestSha256});};

test('modern profile checks converted civil birth scope rather than lunar-year labels or auxiliary guard dates',()=>{
  const fixture=modernPacket(), profile=modernProfile(), first=fixture.loaded.candidate.dates[0], last=fixture.loaded.candidate.dates.at(-1);
  assert.equal(fixture.loaded.candidate.dates.length,13879);
  assert.deepEqual(profile.metadata.birthRange,{fromInclusive:'1989-01-01',untilExclusive:'2027-01-01'});
  assert.equal(first.lunarYear,1988);
  const fromLunar=profile.calculate(lunarRequest(first));
  assert.equal(fromLunar.status,'OK');assert.equal(fromLunar.input.gregorianDate,'1989-01-01');
  assert.deepEqual(chartSemantics(fromLunar),chartSemantics(profile.calculate(chartRequest('1989-01-01'))));
  for(const date of ['1988-12-05','1988-12-31','2027-01-01']) assert.equal(profile.calculate(chartRequest(date)).status,'OUT_OF_PROFILE_COVERAGE');
  assert.equal(last.lunarYear,2026);
  const beyondObserved=profile.calculate(lunarRequest({...last,lunarDay:last.lunarDay+1}));
  assert.equal(beyondObserved.status,'OUT_OF_OBSERVED_COVERAGE','a 2026 lunar label must not authorize a 2027 civil date');
  const year1989=profile.eventsForYear(1989),year2026=profile.eventsForYear(2026);
  assert.equal(year1989.events.length,25);assert.equal(year2026.events.length,25);
  assert.equal(year1989.events[0].term,'DAXUE');assert.ok(year1989.events[0].displayedDateTime.startsWith('1988-12-'));
  assert.ok(year2026.events.every(e=>!e.displayedDateTime.startsWith('2027-')),'future Jie is not required for 2026 births');
});

test('modern range requires the actual 1988 December guard and rejects an attempted DST-period guard',()=>{
  const fixture=modernPacket();
  const withoutGuard=structuredClone(fixture.loaded.candidate);withoutGuard.events=withoutGuard.events.filter(e=>!e.date.startsWith('1988-'));
  const absent=sealSyntheticLocalChartCandidate(withoutGuard,fixture.loaded.sources);
  assert.throws(()=>createLocalChartProfile(absent.loaded,{profileId:MODERN_PROFILE_ID,expectedManifestSha256:absent.expectedManifestSha256}),/DAXUE_GUARD/);
  const earlier=structuredClone(fixture.loaded.candidate),guard=earlier.events.find(e=>e.date.startsWith('1988-'));
  guard.date='1988-10-08';guard.computationalCivilDateTime=guard.date+'T'+guard.time;
  const unresolved=sealSyntheticLocalChartCandidate(earlier,fixture.loaded.sources);
  // December-identity validation rejects this before it could reach clock adaptation.
  assert.throws(()=>createLocalChartProfile(unresolved.loaded,{profileId:MODERN_PROFILE_ID,expectedManifestSha256:unresolved.expectedManifestSha256}),/DAXUE_GUARD_MUST_BE_DECEMBER|CLOCK_POLICY_EVENT_RANGE/);
});

test('modern last-day Zi rollover may select 2027 day pillar without expanding birth or lunar-conversion support',()=>{
  const profile=modernProfile(), request=chartRequest('2026-12-31','23:30','ZI_START','SELECTED_DAY_PILLAR');
  const result=profile.calculate(request);
  assert.equal(result.status,'OK');assert.equal(result.input.gregorianDate,'2026-12-31');assert.equal(result.chart.effectiveDayDate,'2027-01-01');
  assert.equal(profile.calculate({...request,date:'2027-01-01'}).status,'OUT_OF_PROFILE_COVERAGE');
  const row=modernPacket().loaded.candidate.dates.at(-1), lunar=profile.calculate(lunarRequest(row,'23:30',request.policies));
  assert.deepEqual(chartSemantics(result),chartSemantics(lunar));
  assert.ok(result.evidence.appliedJie.every(e=>e.original.date<'2027-01-01'));
});

test('modern and 2026 profiles alternate years without mixing calendar or applied-event sources',()=>{
  const fixture=modernPacket(), modern=modernProfile();
  const stageA=createLocalChartProfile(fixture.loaded,{profileId:STAGE_A_PROFILE_ID,expectedManifestSha256:fixture.expectedManifestSha256});
  const target=chartRequest('2026-03-05','01:20'), original=modern.calculate(target), expected=chartSemantics(original);
  assert.deepEqual(chartSemantics(stageA.calculate(target)),expected);
  assert.notEqual(stageA.metadata.id,modern.metadata.id);
  for(const year of [1989,2000,2025,1996,2026,1989]) {
    const result=modern.calculate(chartRequest(year+'-06-01'));
    assert.equal(result.evidence.dateConversion.source.query.year,year);
    assert.equal(result.evidence.yearBoundary.source.query.year,year);
    for(const event of result.evidence.appliedJie) {
      assert.equal(event.source.query.year,year);
      assert.ok(event.original.date.startsWith(year+'-'));
    }
    assert.deepEqual(chartSemantics(stageA.calculate(target)),expected);
  }
  original.evidence.appliedJie[0].original.date='1900-01-01';
  original.evidence.dateConversion.source.query.year=1900;
  assert.deepEqual(chartSemantics(modern.calculate(target)),expected);
  assert.equal(modern.calculate(target).evidence.dateConversion.source.query.year,2026);
  assert.deepEqual(modern.calculate(target),modern.calculate(target),'same input/policies/pinned packet must reproduce the full DTO');
});

test('modern synthetic calendar keeps leap/regular identity and invalid lunar days explicit',()=>{
  const fixture=modernPacket(), profile=modernProfile(), leap=fixture.loaded.candidate.dates.find(r=>r.leap && r.lunarYear===2000);
  const selected=leap??fixture.loaded.candidate.dates.find(r=>r.leap && r.lunarYear>=1989);
  const regular=fixture.loaded.candidate.dates.find(r=>r.lunarYear===selected.lunarYear && r.lunarMonth===selected.lunarMonth && r.lunarDay===selected.lunarDay && !r.leap);
  const leapResult=profile.calculate(lunarRequest(selected)), regularResult=profile.calculate(lunarRequest(regular));
  assert.equal(leapResult.status,'OK');assert.equal(regularResult.status,'OK');assert.notEqual(leapResult.input.gregorianDate,regularResult.input.gregorianDate);
  const shortMonth=fixture.loaded.candidate.months.find(m=>m.lunarYear===2000 && m.monthDays===29 && !m.leap);
  assert.equal(profile.calculate(lunarRequest({...shortMonth,lunarDay:30})).status,'INVALID_LUNAR_DATE');
  assert.equal(profile.calculate(lunarRequest({lunarYear:2000,lunarMonth:1,lunarDay:1,leap:true})).status,'INVALID_LUNAR_DATE');
  rejected(()=>profile.calculate({...lunarRequest(selected),lunarDate:{...selected,leap:undefined}}));
});
