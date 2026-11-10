import test from 'node:test';
import assert from 'node:assert/strict';
import {CALENDAR_PROJECTION_POLICY_V02 as POLICY,CALENDAR_PROJECTION_VERSION,CALENDAR_PROJECTION_METADATA as META,NOMINAL_AS_OF_RANGE,decomposeLuckMinutes,addGregorianYearsClamped,addGregorianMonthsClamped,addGregorianDays,addGregorianHours,projectNominalLuckCalendar,selectNominalDaYunAt,generateNominalPeriods} from '../dist/luck/calendarProjectionV02.js';
import {M7_LUCK_POLICY_V01,luckPillarSequence} from '../dist/luck/luckV01.js';

const gcd=(a,b)=>b?gcd(b,a%b):a;
// Independent UTC setter arithmetic creates synthetic published events; it is not the projection oracle.
function eventMinute(birth,minutes){const [y,m,d,h,mi]=birth.match(/\d+/g).map(Number),date=new Date(0);date.setUTCFullYear(y,m-1,d);date.setUTCHours(h,mi+minutes,0,0);return date.toISOString().slice(0,16);}
const sequence=(count=3,direction='FORWARD')=>luckPillarSequence({monthPillar:{stem:'癸',branch:'巳'},direction,count,policyId:M7_LUCK_POLICY_V01});
function start(birth,minutes,direction='FORWARD'){
  const divisor=gcd(minutes,4320);return {status:'OK',birthMinute:birth,direction,boundarySide:'DEFINITE',policyId:M7_LUCK_POLICY_V01,policyVersion:'0.1.0',nominalIntervalMinutes:minutes,
    age:{numerator:minutes,denominator:4320,reduced:{numerator:minutes/divisor,denominator:4320/divisor},unit:'MODEL_YEAR'},
    selectedEvent:{term:'LICHUN',displayedDateTime:eventMinute(birth,direction==='FORWARD'?minutes:-minutes),timeBasis:'KST',sourcePrecision:'MINUTE',sourceIds:['SYNTHETIC-PUBLISHED-JIE']},missingData:[]};
}
const project=(birth,minutes,count=3)=>projectNominalLuckCalendar({candidateRef:'chart.candidates[0]',birthMinute:birth,start:start(birth,minutes),sequence:sequence(count),policyId:POLICY});
const select=(projection,asOfMinute)=>selectNominalDaYunAt({projection,asOfMinute,policyId:POLICY});
const components=value=>[value.years,value.months,value.days,value.hours];

test('M7 v0.2 preserves the two independently hand-computed approved decompositions and first dates',()=>{
  const male=project('2026-06-01T12:00',6528),female=project('2026-06-01T12:00',38351);
  assert.deepEqual(components(male.decomposition),[1,6,4,0]);assert.equal(male.firstStartMinute,'2027-12-05T12:00');
  assert.deepEqual(male.steps.map(s=>s.resultMinute),['2027-06-01T12:00','2027-12-01T12:00','2027-12-05T12:00','2027-12-05T12:00']);
  assert.equal(male.intervalMinutes,6528);assert.deepEqual(male.modelAge.reduced,{numerator:68,denominator:45});
  assert.deepEqual(components(female.decomposition),[8,10,15,22]);assert.equal(female.firstStartMinute,'2035-04-17T10:00');
  assert.deepEqual(female.steps.map(s=>s.resultMinute),['2034-06-01T12:00','2035-04-01T12:00','2035-04-16T12:00','2035-04-17T10:00']);
  assert.equal(female.modelAge.numerator,38351);assert.equal(female.modelAge.denominator,4320);
});
test('M7 v0.2 integer unit edges have literal expectations including zero decomposition',()=>{
  const cases=[[0,[0,0,0,0],null],[1,[0,0,0,2],'2026-01-31T14:00'],[11,[0,0,0,22],'2026-02-01T10:00'],[12,[0,0,1,0],'2026-02-01T12:00'],[359,[0,0,29,22],'2026-03-02T10:00'],[360,[0,1,0,0],'2026-02-28T12:00'],[4319,[0,11,29,22],'2027-01-30T10:00'],[4320,[1,0,0,0],'2027-01-31T12:00'],[4321,[1,0,0,2],'2027-01-31T14:00']];
  for(const [minutes,units,first]of cases){const decomposition=decomposeLuckMinutes(minutes,POLICY);assert.equal(decomposition.originalMinutes,minutes);assert.deepEqual(components(decomposition),units);if(first)assert.equal(project('2026-01-31T12:00',minutes).firstStartMinute,first);}
  assert.throws(()=>project('2026-01-31T12:00',0),/POSITIVE_VALIDATED/);
});
test('M7 v0.2 deliberately retains the nonmonotonic 359/360-minute calendar counterexample',()=>{
  const a=project('2026-01-31T12:00',359),b=project('2026-01-31T12:00',360);
  assert.equal(a.firstStartMinute,'2026-03-02T10:00');assert.equal(b.firstStartMinute,'2026-02-28T12:00');assert.ok(a.firstStartMinute>b.firstStartMinute);assert.equal(b.steps[1].clamped,true);
});
test('M7 v0.2 clamps years then months sequentially rather than combining their duration',()=>{
  const value=project('2020-02-29T12:37',4680);
  assert.deepEqual(components(value.decomposition),[1,1,0,0]);assert.equal(value.firstStartMinute,'2021-03-28T12:37');
  assert.equal(value.steps[0].resultMinute,'2021-02-28T12:37');assert.equal(value.steps[0].clamped,true);assert.equal(value.steps[0].requestedDay,29);assert.equal(value.steps[0].targetMonthDays,28);
  assert.equal(value.steps[1].inputMinute,'2021-02-28T12:37');assert.equal(value.steps[1].clamped,false);
  // Adding thirteen months directly keeps day29 in March; that is a different chosen operation.
  assert.equal(addGregorianMonthsClamped('2020-02-29T12:37',13,POLICY).resultMinute,'2021-03-29T12:37');
});
test('M7 v0.2 Gregorian leap-century and midnight/month/year carry use explicit civil arithmetic',()=>{
  assert.equal(addGregorianYearsClamped('2000-02-29T12:17',1,POLICY).resultMinute,'2001-02-28T12:17');
  assert.equal(addGregorianYearsClamped('2000-02-29T12:17',100,POLICY).resultMinute,'2100-02-28T12:17');
  assert.equal(addGregorianYearsClamped('2000-02-29T12:17',400,POLICY).resultMinute,'2400-02-29T12:17');
  assert.equal(addGregorianDays('2000-02-28T23:17',1,POLICY).resultMinute,'2000-02-29T23:17');assert.equal(addGregorianDays('2100-02-28T23:17',1,POLICY).resultMinute,'2100-03-01T23:17');
  assert.equal(addGregorianMonthsClamped('2026-01-31T23:17',1,POLICY).resultMinute,'2026-02-28T23:17');
  assert.equal(project('2026-12-31T23:17',1).firstStartMinute,'2027-01-01T01:17');assert.equal(project('2026-12-31T23:17',12).firstStartMinute,'2027-01-01T23:17');
});
test('M7 v0.2 supports strict proleptic 0001 through9999 without repairing invalid input or leaking overflow',()=>{
  assert.equal(addGregorianYearsClamped('0001-01-01T00:07',1,POLICY).resultMinute,'0002-01-01T00:07');
  assert.equal(addGregorianDays('0099-12-31T23:59',1,POLICY).resultMinute,'0100-01-01T23:59');
  assert.equal(addGregorianHours('9999-12-31T22:59',1,POLICY).resultMinute,'9999-12-31T23:59');
  for(const minute of ['0000-01-01T00:00','2026-02-30T12:00','2100-02-29T12:00','2026-01-01','2026-01-01T24:00','2026-01-01T12:60','2026-01-01T12:00Z'])assert.throws(()=>addGregorianYearsClamped(minute,0,POLICY));
  assert.throws(()=>addGregorianYearsClamped('9999-01-01T12:00',1,POLICY));assert.throws(()=>addGregorianMonthsClamped('9999-12-01T12:00',1,POLICY));assert.throws(()=>addGregorianDays('9999-12-31T12:00',1,POLICY));assert.throws(()=>addGregorianHours('9999-12-31T23:00',1,POLICY));
  for(const value of [-1,0.1,NaN,Infinity,Number.MAX_SAFE_INTEGER+1,'1']){assert.throws(()=>decomposeLuckMinutes(value,POLICY));assert.throws(()=>addGregorianYearsClamped('2026-01-01T12:00',value,POLICY));}
  assert.throws(()=>addGregorianHours('2026-01-01T12:00',Number.MAX_SAFE_INTEGER,POLICY));
  // Synthetic event remains valid in9998; the target function itself rejects a first start in10000.
  assert.throws(()=>project('9998-01-01T12:00',8640),/CALENDAR_ARITHMETIC_OUT_OF_RANGE/);
});
test('M7 v0.2 decade boundaries add10k directly from the first leap-day anchor',()=>{
  const value=project('2000-02-28T12:00',12,3);
  assert.equal(value.firstStartMinute,'2000-02-29T12:00');assert.deepEqual(value.periods.map(p=>p.startInclusive),['2000-02-29T12:00','2010-02-28T12:00','2020-02-29T12:00']);
  assert.equal(value.periods[2].endExclusive,'2030-02-28T12:00');assert.deepEqual(value.periods.map(p=>p.pillar.stem+p.pillar.branch),['甲午','乙未','丙申']);
  assert.equal(value.periods[1].startClamped,true);assert.equal(value.periods[2].startClamped,false);
  for(let i=0;i<value.periods.length;i++){const p=value.periods[i];assert.equal(p.anchorMinute,value.firstStartMinute);assert.equal(p.yearsFromAnchor,i*10);assert.ok(p.startInclusive<p.endExclusive);if(i)assert.equal(value.periods[i-1].endExclusive,p.startInclusive);}
  assert.notEqual(addGregorianYearsClamped(value.periods[1].startInclusive,10,POLICY).resultMinute,value.periods[2].startInclusive);
  assert.throws(()=>generateNominalPeriods({firstStartMinute:'9900-01-01T12:00',sequence:sequence(20),candidateRef:'chart.candidates[0]',policyId:POLICY}));
});
test('M7 v0.2 selection is half-open at first and every generated transition with no small-luck or last-period fallback',()=>{
  const value=project('2000-02-28T12:00',12,3);
  assert.equal(select(value,'1990-01-01T12:00').status,'BEFORE_BIRTH');assert.equal(select(value,'2000-02-28T12:00').status,'BEFORE_FIRST_DA_YUN');
  assert.equal(select(value,'2000-02-29T11:59').status,'BEFORE_FIRST_DA_YUN');
  for(const [minute,ordinal]of [['2000-02-29T12:00',1],['2000-02-29T12:01',1],['2010-02-28T11:59',1],['2010-02-28T12:00',2],['2010-02-28T12:01',2],['2020-02-29T11:59',2],['2020-02-29T12:00',3],['2020-02-29T12:01',3]]){const selected=select(value,minute);assert.equal(selected.status,'RESOLVED_UNDER_POLICY');assert.equal(selected.selection.ordinal,ordinal);}
  const one=project('2000-02-28T12:00',12,1);assert.equal(select(one,'2010-02-28T12:00').status,'OUTSIDE_GENERATED_RANGE');assert.equal(select(one,'2026-11-01T12:00').selection,null);
});
test('M7 v0.2 query scope is explicit and separate from future nominal period generation',()=>{
  const value=project('2026-06-01T12:00',6528,20);assert.equal(value.periods[19].endExclusive,'2227-12-05T12:00');
  assert.equal(select(value,'1989-01-01T00:00').status,'BEFORE_BIRTH');assert.equal(select(value,'2026-12-31T23:59').status,'BEFORE_FIRST_DA_YUN');
  for(const minute of ['1988-12-31T23:59','2027-01-01T00:00','2030-01-01T12:00'])assert.equal(select(value,minute).status,'POLICY_UNRESOLVED');
  assert.deepEqual(NOMINAL_AS_OF_RANGE,{fromInclusive:'1989-01-01T00:00',untilExclusive:'2027-01-01T00:00'});
  assert.throws(()=>select(value,'2026-11-01'));assert.throws(()=>select(value,'2026-02-30T12:00'));
});
test('M7 v0.2 propagates same-minute AMBIGUOUS and missing data without any calendar date',()=>{
  const birth='2026-02-04T05:02',amb={...start(birth,0),status:'AMBIGUOUS',age:null};
  const value=projectNominalLuckCalendar({candidateRef:'chart.candidates[0]',birthMinute:birth,start:amb,sequence:sequence(),policyId:POLICY});
  assert.equal(value.status,'AMBIGUOUS');assert.equal(value.intervalMinutes,0);assert.equal(value.firstStartMinute,null);assert.equal(value.decomposition,null);assert.deepEqual(value.periods,[]);assert.equal(select(value,'2026-11-01T12:00').status,'AMBIGUOUS');
  const missing=[{year:2027,term:'XIAOHAN',feature:'DA_YUN_START',side:'FORWARD',reason:'MISSING_ADJACENT_JIE'}],needs={...start(birth,1),status:'NEEDS_DATA',age:null,nominalIntervalMinutes:null,selectedEvent:null,missingData:missing};
  const held=projectNominalLuckCalendar({candidateRef:'chart.candidates[1]',birthMinute:birth,start:needs,sequence:sequence(),policyId:POLICY});
  assert.equal(held.status,'NEEDS_DATA');assert.equal(held.firstStartMinute,null);assert.deepEqual(held.missingData,missing);assert.equal(select(held,'2026-11-01T12:00').status,'NEEDS_DATA');assert.equal(select(held,'2027-01-01T00:00').status,'POLICY_UNRESOLVED');
});
test('M7 v0.2 requires original integer/rational/event/candidate/policy connections and rejects projection-table clones',()=>{
  const birth='2026-06-01T12:00',base=start(birth,6528),input={candidateRef:'chart.candidates[0]',birthMinute:birth,start:base,sequence:sequence(),policyId:POLICY};
  for(const mutation of [v=>delete v.policyId,v=>v.policyId='AUTO',v=>v.candidateRef='chart.candidates[01]',v=>v.start.birthMinute='2026-06-02T12:00',v=>v.start.direction='REVERSE',v=>v.start.nominalIntervalMinutes++,v=>v.start.age.numerator++,v=>v.start.age.reduced.denominator++,v=>v.start.selectedEvent.timeBasis='UTC',v=>v.start.selectedEvent.sourceIds=[],v=>v.sequence.entries[0].ordinal=0,v=>v.sequence.entries[1].pillar={stem:'甲',branch:'午'},v=>v.sequence.direction='AUTO',v=>v.sequence.monthPillar={stem:'甲',branch:'子'}]){const altered=structuredClone(input);mutation(altered);assert.throws(()=>projectNominalLuckCalendar(altered));}
  const value=projectNominalLuckCalendar(input);assert.throws(()=>selectNominalDaYunAt({projection:structuredClone(value),asOfMinute:'2026-11-01T12:00',policyId:POLICY}));assert.throws(()=>{value.periods[0].startInclusive='2026-01-01T12:00';});
  assert.equal(Object.isFrozen(base),false);assert.equal(Object.isFrozen(base.age),false);base.age.reduced.numerator=0;assert.deepEqual(value.modelAge.reduced,{numerator:68,denominator:45});
  assert.throws(()=>selectNominalDaYunAt({projection:value,asOfMinute:'2026-11-01T12:00',policyId:'AUTO'}));
});
test('M7 v0.2 metadata separates project arithmetic, comparison references and physical precision',()=>{
  assert.equal(META.id,POLICY);assert.equal(META.version,CALENDAR_PROJECTION_VERSION);assert.equal(META.meaning,'NOMINAL_UNDER_SELECTED_POLICY');assert.equal(META.utcInstant,null);assert.equal(META.sourcePrecision,'MINUTE');
  assert.equal(META.periodAnchor,'DIRECT_FROM_FIRST_START_NOT_ITERATIVE');assert.ok(META.limits.includes('NONMONOTONIC_AT_MODEL_UNIT_BOUNDARIES'));
  const sourceIds=new Set(META.sources.map(s=>s.id));for(const rule of META.rules){assert.deepEqual(rule.policyRefs,[POLICY]);assert.ok(rule.sourceRefs.every(ref=>sourceIds.has(ref)));assert.deepEqual(rule.sourceRefs,['IMPL-M7-CALENDAR-PROJECTION-V02']);}
  assert.equal(META.sources.find(s=>s.id==='SOFTWARE-LUNAR-PYTHON-YUN-PINNED-V02').revision,'1645ad3b3653635e5cb31b0c6df22b5e4298f8ce');assert.equal(META.sources.filter(s=>s.executedLibrary===false).length,2);
  assert.equal(project('2026-06-01T12:00',6528).precision.actualInstantCertified,false);
});
