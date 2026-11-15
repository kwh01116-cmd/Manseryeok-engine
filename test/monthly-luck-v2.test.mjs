import test from 'node:test';
import assert from 'node:assert/strict';
import {spawnSync} from 'node:child_process';
import {SOLAR_TERM_CODES} from '../dist/calendar/solarTerms.js';
import {MONTH_BOUNDARY_JIE} from '../dist/calendar/monthPillar.js';
import {MONTHLY_LUCK_POLICY_ID as oldPolicy,compileMonthlyTimeline,monthlyLuckYearTable} from '../dist/luck/monthlyLuckV1.js';
import {MONTHLY_LUCK_V2_POLICY_ID as policyId,compileMonthlyTimelineV2,monthlyLuckAtMinuteV2,monthlyLuckYearTableV2} from '../dist/luck/monthlyLuckV2.js';
import {MONTHLY_SYNTHETIC_EVENTS as previousEvents} from './fixtures/monthly-synthetic-events-v1.mjs';
import {MONTHLY_V2_2026_EXPECTED,MONTHLY_V2_2027_EXPECTED,MONTHLY_V2_LICHUN_2027_EXPECTED,MONTHLY_V2_2027_MISSING_EVENTS} from './fixtures/monthly-v2-expectations.mjs';
const future=SOLAR_TERM_CODES.map((term,index)=>({term,displayedDateTime:'2027-'+String(Math.floor(index/2)+1).padStart(2,'0')+'-'+(term==='LICHUN'?'04':index%2?'20':'05')+'T12:00',timeBasis:'KST',sourcePrecision:'MINUTE',sourceIds:['SYNTHETIC-MONTHLY-V2-2027-'+term]}));
const events=[...previousEvents,...future],timeline=compileMonthlyTimelineV2(events),glyph=p=>p.stem+p.branch;
const at=queryMinute=>monthlyLuckAtMinuteV2({timeline,queryMinute,policyId}),table=year=>monthlyLuckYearTableV2({timeline,year,policyId});
test('the explicitly extended timeline completes the final two 2026 rows while V1 stays partial',()=>{
 const current=table(2026),old=monthlyLuckYearTable({timeline:compileMonthlyTimeline(previousEvents),year:2026,policyId:oldPolicy});
 assert.equal(current.status,'RESOLVED_UNDER_POLICY');assert.equal(current.rows.length,12);assert.deepEqual(current.rows.map(row=>glyph(row.monthPillar)),MONTHLY_V2_2026_EXPECTED);
 assert.equal(current.rows[10].nominalInterval.endExclusive,'2027-01-05T12:00');assert.equal(current.rows[11].nominalInterval.endExclusive,'2027-02-04T12:00');
 assert.equal(old.status,'PARTIAL');assert.equal(old.rows.filter(row=>row.status==='NEEDS_DATA').length,2);assert.equal(old.policyId,oldPolicy);assert.equal(current.policyId,policyId);
});
test('2027 label arithmetic is complete but its final two intervals explicitly require 2028 data',()=>{
 const value=table(2027);assert.equal(value.status,'PARTIAL');assert.deepEqual(value.rows.map(row=>glyph(row.monthPillar)),MONTHLY_V2_2027_EXPECTED);
 assert.equal(value.rows.filter(row=>row.status==='RESOLVED_UNDER_POLICY').length,10);assert.equal(value.rows.filter(row=>row.status==='NEEDS_DATA').length,2);
 assert.deepEqual([...new Set(value.missingData.map(row=>row.year+':'+row.term))],MONTHLY_V2_2027_MISSING_EVENTS);
 assert.equal(value.rows[10].nominalInterval.endExclusive,null);assert.equal(value.rows[11].nominalInterval.startInclusive,null);assert.equal(value.rows[11].nominalInterval.endExclusive,null);
 const end=at('2027-12-31T12:00');assert.equal(end.status,'PARTIAL');assert.equal(glyph(end.entries[0].monthPillar),'壬子');assert.equal(end.entries[0].nominalInterval.endExclusive,null);
});
test('2027 Lichun preserves its two correlated year/month alternatives',()=>{
 const before=at('2027-02-04T11:59'),equal=at('2027-02-04T12:00'),after=at('2027-02-04T12:01');
 assert.deepEqual([glyph(before.entries[0].yearPillar),glyph(before.entries[0].monthPillar)],MONTHLY_V2_LICHUN_2027_EXPECTED.before);
 assert.deepEqual([glyph(after.entries[0].yearPillar),glyph(after.entries[0].monthPillar)],MONTHLY_V2_LICHUN_2027_EXPECTED.after);
 assert.equal(equal.status,'AMBIGUOUS');assert.equal(equal.entries.length,2);
 assert.deepEqual(equal.entries.map(entry=>[glyph(entry.yearPillar),glyph(entry.monthPillar)]),[MONTHLY_V2_LICHUN_2027_EXPECTED.before,MONTHLY_V2_LICHUN_2027_EXPECTED.after]);
});
test('each of the twelve 2027 Jie supports before/equal/after without a Gregorian-month rollover',()=>{
 for(const event of future.filter(row=>MONTH_BOUNDARY_JIE.includes(row.term))){const before=event.displayedDateTime.replace('12:00','11:59'),after=event.displayedDateTime.replace('12:00','12:01');assert.equal(at(before).entries.length,1);assert.equal(at(event.displayedDateTime).entries.length,2);assert.equal(at(after).entries.length,1);}
 assert.equal(glyph(at('2027-01-01T12:00').entries[0].yearPillar),'丙午');assert.equal(glyph(at('2027-01-01T12:00').entries[0].monthPillar),'庚子');
 assert.equal(glyph(at('2027-02-01T12:00').entries[0].monthPillar),'辛丑');
});
test('data absence, unsupported clocks, cross-policy and malformed events remain distinct',()=>{
 assert.equal(monthlyLuckAtMinuteV2({timeline:compileMonthlyTimelineV2([]),queryMinute:'2027-02-04T12:00',policyId}).status,'NEEDS_DATA');
 assert.equal(at('2028-01-01T00:00').status,'POLICY_UNRESOLVED');assert.equal(table(2028).status,'POLICY_UNRESOLVED');
 assert.throws(()=>monthlyLuckAtMinuteV2({timeline,queryMinute:'2027-02-04T12:00',policyId:oldPolicy}),/EXPLICIT_SUPPORTED_MONTHLY_V2_POLICY_REQUIRED/);
 assert.throws(()=>monthlyLuckAtMinuteV2({timeline:compileMonthlyTimeline(previousEvents),queryMinute:'2027-02-04T12:00',policyId}),/ISSUED_COMPILED_MONTHLY_V2_TIMELINE_REQUIRED/);
 assert.throws(()=>monthlyLuckAtMinuteV2({timeline:structuredClone(timeline),queryMinute:'2027-02-04T12:00',policyId}),/ISSUED_COMPILED_MONTHLY_V2_TIMELINE_REQUIRED/);
 for(const query of ['2027-02-30T12:00','2027-02-04','now'])assert.throws(()=>at(query));
 for(const mutate of [rows=>delete rows[0],rows=>rows.splice(rows.findIndex(row=>row.term==='JINGZHE'&&row.displayedDateTime.startsWith('2027-')),1),rows=>rows.at(-1).displayedDateTime='2028-01-01T12:00',rows=>rows.at(-1).sourceIds=[],rows=>rows.at(-1).sourceIds=[,]]){const input=structuredClone(events);mutate(input);assert.throws(()=>compileMonthlyTimelineV2(input));}
});
test('shared modern years retain month labels and nominal intervals, and input mutations cannot alter snapshots',()=>{
 const old=monthlyLuckYearTable({timeline:compileMonthlyTimeline(previousEvents),year:2025,policyId:oldPolicy}),current=table(2025);
 const meaning=value=>value.rows.map(row=>({pillar:row.monthPillar,interval:row.nominalInterval,status:row.status}));assert.deepEqual(meaning(current),meaning(old));
 const copy=structuredClone(events),own=compileMonthlyTimelineV2(copy);copy.at(-1).sourceIds[0]='MUTATED';const result=monthlyLuckYearTableV2({timeline:own,year:2027,policyId});assert.equal(result.rows.flatMap(row=>row.calculationSourceRefs).includes('MUTATED'),false);assert.throws(()=>{result.rows[0].monthPillar.stem='甲';});
});
test('UTC and Seoul reproduce extended monthly semantics without a hidden current clock',()=>{
 const script=`import {SOLAR_TERM_CODES}from './dist/calendar/solarTerms.js';import{MONTHLY_SYNTHETIC_EVENTS as old}from './test/fixtures/monthly-synthetic-events-v1.mjs';import{MONTHLY_LUCK_V2_POLICY_ID as policyId,compileMonthlyTimelineV2,monthlyLuckAtMinuteV2,monthlyLuckYearTableV2}from './dist/luck/monthlyLuckV2.js';const future=SOLAR_TERM_CODES.map((term,i)=>({term,displayedDateTime:'2027-'+String(Math.floor(i/2)+1).padStart(2,'0')+'-'+(term==='LICHUN'?'04':i%2?'20':'05')+'T12:00',timeBasis:'KST',sourcePrecision:'MINUTE',sourceIds:['SYNTHETIC-V2-'+term]}));const timeline=compileMonthlyTimelineV2([...old,...future]);console.log(JSON.stringify({at:monthlyLuckAtMinuteV2({timeline,queryMinute:'2027-02-04T12:00',policyId}),table:monthlyLuckYearTableV2({timeline,year:2026,policyId})}));`;
 const outputs=['UTC','Asia/Seoul'].map(TZ=>{const processResult=spawnSync(process.execPath,['--input-type=module','-e',script],{cwd:process.cwd(),env:{...process.env,TZ},encoding:'utf8',windowsHide:true});assert.equal(processResult.status,0,processResult.stderr);return processResult.stdout;});assert.equal(outputs[0],outputs[1]);
});
