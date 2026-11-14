import test from 'node:test';
import assert from 'node:assert/strict';
import {spawnSync} from 'node:child_process';
import {MONTHLY_LUCK_POLICY_ID as policyId,compileMonthlyTimeline,monthlyLuckAtMinute,monthlyLuckYearTable} from '../dist/luck/monthlyLuckV1.js';
import {MONTHLY_2025_EXPECTED,MONTHLY_2026_EXPECTED,MONTHLY_BOUNDARY_EXPECTED} from './fixtures/gongmang-monthly-expectations-v1.mjs';
import {MONTHLY_SYNTHETIC_EVENTS as events} from './fixtures/monthly-synthetic-events-v1.mjs';
const timeline=compileMonthlyTimeline(events),at=queryMinute=>monthlyLuckAtMinute({timeline,queryMinute,policyId}),glyph=p=>p.stem+p.branch;

test('twelve independent year-label month pillars use actual Jie periods rather than Gregorian months',()=>{
  const table=monthlyLuckYearTable({timeline,year:2025,policyId});assert.equal(table.status,'RESOLVED_UNDER_POLICY');assert.equal(table.rows.length,12);assert.deepEqual(table.rows.map(r=>glyph(r.monthPillar)),MONTHLY_2025_EXPECTED);
  assert.equal(table.rows[0].nominalInterval.startInclusive,'2025-02-04T12:00');assert.equal(table.rows[11].nominalInterval.startInclusive,'2026-01-05T12:00');assert.equal(table.rows[11].nominalInterval.endExclusive,'2026-02-04T12:00');
  table.rows.forEach((r,i)=>{assert.equal(r.ordinal,i+1);assert.equal(r.status,'RESOLVED_UNDER_POLICY');assert.ok(r.activeSince.sourceIds.length&&r.untilEvent.sourceIds.length);if(i<11)assert.equal(r.nominalInterval.endExclusive,table.rows[i+1].nominalInterval.startInclusive);});
});
test('January and lunar-new-year calendar dates do not replace Lichun or monthly Jie',()=>{
  for(const minute of ['2026-01-08T12:00','2026-01-29T12:00']){const r=at(minute);assert.equal(r.status,'RESOLVED_UNDER_POLICY');assert.equal(glyph(r.entries[0].yearPillar),MONTHLY_BOUNDARY_EXPECTED.january2026.year);assert.equal(glyph(r.entries[0].monthPillar),MONTHLY_BOUNDARY_EXPECTED.january2026.month);assert.equal(r.entries[0].yearLabel,2025);assert.equal(r.gregorianCalendarMonth,'2026-01');}
});
test('Lichun published minute has two correlated year/month alternatives and no Cartesian product',()=>{
  const before=at('2026-02-04T11:59'),equal=at('2026-02-04T12:00'),after=at('2026-02-04T12:01');assert.equal(before.entries.length,1);assert.equal(after.entries.length,1);assert.equal(equal.status,'AMBIGUOUS');assert.equal(equal.entries.length,2);
  for(const [r,expected]of [[before,MONTHLY_BOUNDARY_EXPECTED.beforeLichun2026],[after,MONTHLY_BOUNDARY_EXPECTED.afterLichun2026]]){assert.equal(glyph(r.entries[0].yearPillar),expected.year);assert.equal(glyph(r.entries[0].monthPillar),expected.month);}
  assert.deepEqual(equal.entries.map(e=>[glyph(e.yearPillar),glyph(e.monthPillar),e.boundarySide]),[['乙巳','己丑','BEFORE_PUBLISHED_MINUTE'],['丙午','庚寅','AFTER_PUBLISHED_MINUTE']]);
});
test('ordinary monthly Jie changes only month while preserving year and original sources',()=>{
  const before=at('2026-03-05T11:59'),equal=at('2026-03-05T12:00'),after=at('2026-03-05T12:01');assert.deepEqual([before.entries[0],after.entries[0]].map(e=>glyph(e.monthPillar)),['庚寅','辛卯']);
  assert.equal(equal.entries.length,2);assert.ok(equal.entries.every(e=>glyph(e.yearPillar)==='丙午'));assert.equal(equal.entries[0].untilEvent.term,'JINGZHE');assert.equal(equal.entries[1].activeSince.term,'JINGZHE');assert.ok(equal.entries[1].calculationSourceRefs.includes('SYNTHETIC-MONTHLY-2026-JINGZHE'));
});
test('2026 future end shortage preserves calculable pillars and missing events without fabricated fallback',()=>{
  const table=monthlyLuckYearTable({timeline,year:2026,policyId});assert.equal(table.status,'PARTIAL');assert.deepEqual(table.rows.map(r=>glyph(r.monthPillar)),MONTHLY_2026_EXPECTED);assert.equal(table.rows.filter(r=>r.status==='RESOLVED_UNDER_POLICY').length,10);
  assert.equal(table.rows[10].activeSince.term,'DAXUE');assert.equal(table.rows[10].untilEvent,null);assert.equal(table.rows[11].activeSince,null);assert.ok(table.missingData.some(m=>m.year===2027&&m.term==='XIAOHAN'));assert.ok(table.missingData.some(m=>m.year===2027&&m.term==='LICHUN'));
  const dec=at('2026-12-31T12:00');assert.equal(dec.status,'PARTIAL');assert.equal(glyph(dec.entries[0].monthPillar),'庚子');assert.equal(dec.entries[0].nominalInterval.endExclusive,null);
});
test('data absence, policy range and malformed timeline are distinct failures',()=>{
  assert.equal(monthlyLuckAtMinute({timeline:compileMonthlyTimeline([]),queryMinute:'2026-02-04T12:00',policyId}).status,'NEEDS_DATA');
  for(const queryMinute of ['1988-12-01T12:00','2027-02-04T12:00'])assert.equal(at(queryMinute).status,'POLICY_UNRESOLVED');
  assert.equal(monthlyLuckYearTable({timeline,year:2027,policyId}).status,'POLICY_UNRESOLVED');
  for(const minute of ['now','2026-02-30T12:00','2026-02-04'])assert.throws(()=>at(minute));
  assert.throws(()=>monthlyLuckYearTable({timeline,year:2026.5,policyId}));assert.throws(()=>monthlyLuckAtMinute({timeline,queryMinute:'2026-02-04T12:00',policyId:'AUTO'}));assert.throws(()=>monthlyLuckAtMinute({timeline:structuredClone(timeline),queryMinute:'2026-02-04T12:00',policyId}));
  for(const mutate of [e=>delete e[0],e=>e.splice(3,1),e=>e[1].sourceIds=[],e=>e[1].sourceIds=[,],e=>e[1].sourceIds=e[0].sourceIds,e=>e[0].term='UNKNOWN',e=>e[0].timeBasis='UTC',e=>e[0].sourcePrecision='SECOND',e=>e[0].displayedDateTime='2027-01-05T12:00']){const copy=structuredClone(events);mutate(copy);assert.throws(()=>compileMonthlyTimeline(copy));}
});
test('compiled event snapshots isolate later input mutation and output objects are immutable',()=>{
  const copy=structuredClone(events),own=compileMonthlyTimeline(copy);copy[1].sourceIds[0]='changed';const r=monthlyLuckAtMinute({timeline:own,queryMinute:'2026-03-05T12:00',policyId});assert.ok(!r.entries.flatMap(e=>e.calculationSourceRefs).includes('changed'));assert.throws(()=>{r.entries[0].monthPillar.stem='甲';});
});
test('UTC and Seoul use identical nominal-minute query and year-table semantics',()=>{
  const script=`import{MONTHLY_LUCK_POLICY_ID as policyId,compileMonthlyTimeline,monthlyLuckAtMinute,monthlyLuckYearTable}from './dist/luck/monthlyLuckV1.js';import{MONTHLY_SYNTHETIC_EVENTS as events}from './test/fixtures/monthly-synthetic-events-v1.mjs';const timeline=compileMonthlyTimeline(events);console.log(JSON.stringify({at:monthlyLuckAtMinute({timeline,queryMinute:'2026-02-04T12:00',policyId}),table:monthlyLuckYearTable({timeline,year:2025,policyId})}));`;
  const outputs=['UTC','Asia/Seoul'].map(TZ=>{const p=spawnSync(process.execPath,['--input-type=module','-e',script],{cwd:process.cwd(),env:{...process.env,TZ},encoding:'utf8',windowsHide:true});assert.equal(p.status,0,p.stderr);assert.equal(p.stderr,'');return p.stdout;});assert.equal(outputs[0],outputs[1]);
});
