// Hand-pinned finite expectations; synthetic timestamps are not published KASI evidence.
import test from 'node:test';
import assert from 'node:assert/strict';
import {M7_LUCK_POLICY_V01 as policyId,M7_LUCK_POLICY_METADATA,MAX_LUCK_COUNT,resolveLuckDirection,luckPillarSequence,
  modelAgeFromMinutes,displayModelAge,modelAgeIntervals,compileLuckTimeline,resolveLuckStart,annualLuckYearLabel,annualLuckAtMinute} from '../dist/luck/luckV01.js';

const names='甲子 乙丑 丙寅 丁卯 戊辰 己巳 庚午 辛未 壬申 癸酉 甲戌 乙亥 丙子 丁丑 戊寅 己卯 庚辰 辛巳 壬午 癸未 甲申 乙酉 丙戌 丁亥 戊子 己丑 庚寅 辛卯 壬辰 癸巳 甲午 乙未 丙申 丁酉 戊戌 己亥 庚子 辛丑 壬寅 癸卯 甲辰 乙巳 丙午 丁未 戊申 己酉 庚戌 辛亥 壬子 癸丑 甲寅 乙卯 丙辰 丁巳 戊午 己未 庚申 辛酉 壬戌 癸亥'.split(' ');
const gz=name=>({stem:name[0],branch:name[1]}),label=p=>p.stem+p.branch;
const e=(term,displayedDateTime)=>({term,displayedDateTime,timeBasis:'KST',sourcePrecision:'MINUTE',sourceIds:['SYNTHETIC:'+term+':'+displayedDateTime]});
const timeline=compileLuckTimeline([e('XIAOHAN','2026-01-05T12:00'),e('LICHUN','2026-02-04T12:00'),e('YUSHUI','2026-02-19T12:00'),e('JINGZHE','2026-03-05T12:00'),e('CHUNFEN','2026-03-20T12:00'),e('QINGMING','2026-04-05T12:00')]);
const start=(birthMinute,direction='FORWARD',boundarySide='DEFINITE',context=timeline)=>resolveLuckStart({timeline:context,birthMinute,direction,boundarySide,policyId});

test('M7 all sixty month starting pillars progress both ways with adjacent first pillar and wrap',()=>{
  assert.equal(names.length,60);assert.equal(new Set(names).size,60);
  for(let i=0;i<60;i++)for(const [direction,sign]of [['FORWARD',1],['REVERSE',-1]]){
    const result=luckPillarSequence({monthPillar:gz(names[i]),direction,count:20,policyId});
    assert.equal(result.firstRelation,'ADJACENT_EXCLUDES_NATAL_MONTH');
    assert.deepEqual(result.entries.map(x=>label(x.pillar)),Array.from({length:20},(_,j)=>names[(i+sign*(j+1)+120)%60]));
    assert.deepEqual(result.entries.map(x=>x.ordinal),Array.from({length:20},(_,j)=>j+1));
  }
  for(const [direction,expected]of [['FORWARD',['甲午','乙未','丙申']],['REVERSE',['壬辰','辛卯','庚寅']]])assert.deepEqual(luckPillarSequence({monthPillar:gz('癸巳'),direction,count:3,policyId}).entries.map(x=>label(x.pillar)),expected);
});

test('M7 direction uses explicit traditional sex and year-stem polarity in all four combinations',()=>{
  for(const [year,traditionalSex,expected]of [['甲子','MALE','FORWARD'],['甲子','FEMALE','REVERSE'],['乙丑','MALE','REVERSE'],['乙丑','FEMALE','FORWARD']]){
    const result=resolveLuckDirection({yearPillar:gz(year),traditionalSex,policyId});assert.equal(result.direction,expected);assert.equal(result.yearStem,year[0]);assert.equal(result.traditionalSex,traditionalSex);
  }
  for(const traditionalSex of [undefined,null,'','male','AUTO','__proto__'])assert.throws(()=>resolveLuckDirection({yearPillar:gz('甲子'),traditionalSex,policyId}));
  for(const id of [undefined,'','M4-RULE-LUCK-CYCLE-001','AUTO'])assert.throws(()=>resolveLuckDirection({yearPillar:gz('甲子'),traditionalSex:'MALE',policyId:id}));
});

test('M7 explicit policy, valid sexagenary pair, direction and bounded count are mandatory',()=>{
  assert.equal(MAX_LUCK_COUNT,20);
  for(const count of [0,-1,1.5,21,1000000,undefined,NaN,Infinity])assert.throws(()=>luckPillarSequence({monthPillar:gz('癸巳'),direction:'FORWARD',count,policyId}));
  for(const direction of ['AUTO',undefined,'forward'])assert.throws(()=>luckPillarSequence({monthPillar:gz('癸巳'),direction,count:10,policyId}));
  assert.throws(()=>luckPillarSequence({monthPillar:gz('甲丑'),direction:'FORWARD',count:10,policyId}));
  assert.throws(()=>luckPillarSequence({monthPillar:gz('癸巳'),direction:'FORWARD',count:10,policyId:'DIFFERENT_DIRECTION_POLICY'}));
});

test('M7 model age preserves exact three-day ratio and independent 4319/4320/4321 minute witnesses',()=>{
  for(const [minutes,numerator,denominator]of [[0,0,1],[4320,1,1],[8640,2,1],[4319,4319,4320],[4321,4321,4320],[44640,31,3]]){
    const age=modelAgeFromMinutes(minutes,policyId);assert.equal(age.numerator,minutes);assert.equal(age.denominator,4320);assert.deepEqual(age.reduced,{numerator,denominator});assert.equal(age.unit,'MODEL_YEAR');
  }
  for(const minutes of [-1,NaN,Infinity,0.5,Number.MAX_SAFE_INTEGER+1])assert.throws(()=>modelAgeFromMinutes(minutes,policyId));
  const age=modelAgeFromMinutes(4321,policyId),copy=structuredClone(age),display=displayModelAge(age,policyId);
  assert.equal(display.value,'1.000231');assert.equal(display.rounding,'HALF_UP_DISPLAY_ONLY');assert.deepEqual(age,copy);
  assert.equal(displayModelAge(modelAgeFromMinutes(4319,policyId),policyId).value,'0.999769');
  const intervals=modelAgeIntervals(age,3,policyId);
  assert.deepEqual(intervals.map(x=>x.startInclusive.numerator),[4321,47521,90721]);assert.deepEqual(intervals.map(x=>x.endExclusive.numerator),[47521,90721,133921]);
  assert.ok(intervals.every(x=>x.unit==='MODEL_YEAR'&&x.startInclusive.denominator===4320));assert.deepEqual(age,copy);
  for(const unit of [undefined,'YEAR','CALENDAR_YEAR']){
    assert.throws(()=>displayModelAge({...age,unit},policyId));assert.throws(()=>modelAgeIntervals({...age,unit},3,policyId));
  }
  assert.equal(displayModelAge({numerator:1,denominator:2_000_000,reduced:{numerator:1,denominator:2_000_000},unit:'MODEL_YEAR'},policyId).value,'0.000001');
  assert.equal(displayModelAge({numerator:Number.MAX_SAFE_INTEGER-1,denominator:Number.MAX_SAFE_INTEGER,reduced:{numerator:Number.MAX_SAFE_INTEGER-1,denominator:Number.MAX_SAFE_INTEGER},unit:'MODEL_YEAR'},policyId).value,'1.000000');
});

test('M7 wall-minute subtraction crosses leap day, month and year with hand-computable intervals',()=>{
  const cases=[
    ['2024-02-28T12:00','LICHUN','2024-02-04T12:00','JINGZHE','2024-03-02T12:00'],
    ['2026-05-31T12:00','LIXIA','2026-05-05T12:00','MANGZHONG','2026-06-03T12:00'],
    ['2026-12-31T12:00','DAXUE','2026-12-07T12:00','XIAOHAN','2027-01-03T12:00'],
  ];
  for(const [birth,previous,previousTime,next,nextTime]of cases){
    const context=compileLuckTimeline([e(previous,previousTime),e(next,nextTime)]),result=start(birth,'FORWARD','DEFINITE',context);
    assert.equal(result.status,'OK');assert.equal(result.nominalIntervalMinutes,4320);assert.deepEqual(result.age.reduced,{numerator:1,denominator:1});
    assert.equal(result.calendarProjection.status,'POLICY_UNRESOLVED');assert.equal(result.calendarProjection.exactStartDate,null);assert.equal(result.calendarProjection.currentDecade,null);
  }
});

test('M7 chooses twelve Jie even if a Zhongqi is closer and does not clamp more than ten model years',()=>{
  const reverse=start('2026-02-20T12:00','REVERSE'),forward=start('2026-03-21T12:00');
  assert.equal(reverse.selectedEvent.term,'LICHUN');assert.equal(forward.selectedEvent.term,'QINGMING');
  const context=compileLuckTimeline([e('LIXIA','2026-05-05T12:00'),e('MANGZHONG','2026-06-06T12:00')]);
  const long=start('2026-06-05T12:00','REVERSE','DEFINITE',context);
  assert.equal(long.nominalIntervalMinutes,44640);assert.deepEqual(long.age.reduced,{numerator:31,denominator:3});assert.equal(long.displayAge.value,'10.333333');
});

test('M7 same published Jie minute preserves conditional side and never promotes nominal zero to exact age',()=>{
  for(const [side,direction,status,term]of [
    ['BEFORE_PUBLISHED_MINUTE','FORWARD','AMBIGUOUS','LICHUN'],['BEFORE_PUBLISHED_MINUTE','REVERSE','OK','XIAOHAN'],
    ['AFTER_PUBLISHED_MINUTE','FORWARD','OK','JINGZHE'],['AFTER_PUBLISHED_MINUTE','REVERSE','AMBIGUOUS','LICHUN'],
    ['DEFINITE','FORWARD','AMBIGUOUS','LICHUN'],['DEFINITE','REVERSE','AMBIGUOUS','LICHUN'],
  ]){
    const r=start('2026-02-04T12:00',direction,side);assert.equal(r.status,status);assert.equal(r.selectedEvent.term,term);
    if(status==='AMBIGUOUS'){assert.equal(r.nominalIntervalMinutes,0);assert.equal(r.age,null);assert.equal(r.displayAge,null);}else assert.ok(r.age.numerator>0);
    assert.equal(r.precision.actualInstantCertified,false);assert.equal(r.precision.unknownRounding,'NO_ASSUMED_SECONDS_INTERVAL');
  }
  assert.throws(()=>start('2026-02-03T12:00','FORWARD','BEFORE_PUBLISHED_MINUTE'));
});

test('M7 missing previous/next year Jie and missing interior Jie produce needs-data rather than far jumps',()=>{
  const ending=compileLuckTimeline([e('DAXUE','2026-12-07T11:53'),e('DONGZHI','2026-12-22T12:00')]);
  const missing=start('2026-12-31T12:00','FORWARD','DEFINITE',ending);assert.equal(missing.status,'NEEDS_DATA');assert.equal(missing.age,null);assert.deepEqual(missing.missingData.map(x=>[x.year,x.term]),[[2027,'XIAOHAN']]);
  assert.equal(start('2026-12-31T12:00','REVERSE','DEFINITE',ending).status,'OK');
  const beginning=compileLuckTimeline([e('XIAOHAN','1989-01-05T12:00'),e('LICHUN','1989-02-04T12:00')]);
  const previous=start('1989-01-01T12:00','REVERSE','DEFINITE',beginning);assert.equal(previous.status,'NEEDS_DATA');assert.deepEqual(previous.missingData.map(x=>[x.year,x.term]),[[1988,'DAXUE']]);
  const gap=compileLuckTimeline([e('LICHUN','2026-02-04T12:00'),e('QINGMING','2026-04-05T12:00')]);
  for(const direction of ['FORWARD','REVERSE']){const r=start('2026-03-10T12:00',direction,'DEFINITE',gap);assert.equal(r.status,'NEEDS_DATA');assert.equal(r.missingData[0].term,'JINGZHE');}
});

test('M7 malformed/duplicate/reversed timeline, unsupported precision and unissued compiled data fail closed',()=>{
  const first=e('LICHUN','2026-02-04T12:00'),second=e('JINGZHE','2026-03-05T12:00');
  for(const records of [[second,first],[first,first],[first,{...second,term:'LICHUN'}],[{...first,sourcePrecision:'SECOND'}],[{...first,timeBasis:'UTC'}],[{...first,sourceIds:[]}],[{...first,term:'UNKNOWN'}]])assert.throws(()=>compileLuckTimeline(records));
  assert.throws(()=>start('2026-02-30T12:00'));assert.throws(()=>start('2026-02-01T24:00'));
  assert.throws(()=>start('2026-02-01T12:00','FORWARD','DEFINITE',structuredClone(timeline)));
  const mutable=[first,second],compiled=compileLuckTimeline(mutable);mutable[0].sourceIds.push('MODIFIED');assert.ok(!compiled.events[0].sourceIds.includes('MODIFIED'));
  assert.throws(()=>compiled.events[0].sourceIds.push('MODIFIED'),TypeError);
});

test('M7 annual year labels reuse the finite cycle separately from timestamp data availability',()=>{
  for(const [year,expected]of [[1,'辛酉'],[1983,'癸亥'],[1984,'甲子'],[2026,'丙午'],[2027,'丁未'],[9999,'己亥']])assert.equal(label(annualLuckYearLabel(year,policyId).pillar),expected);
  for(let year=1989;year<2027;year++)assert.deepEqual(annualLuckYearLabel(year,policyId).pillar,annualLuckYearLabel(year+60,policyId).pillar);
  for(const year of [0,10000,2026.5,'2026',NaN])assert.throws(()=>annualLuckYearLabel(year,policyId));
  assert.equal(annualLuckAtMinute({timeline,queryMinute:'2027-02-04T12:00',policyId}).status,'NEEDS_DATA');
  assert.equal(label(annualLuckYearLabel(2027,policyId).pillar),'丁未');
});

test('M7 annual timestamp uses Lichun, not January 1 or lunar New Year, and keeps displayed-minute alternatives',()=>{
  for(const queryMinute of ['2026-01-01T00:00','2026-02-03T12:00']){
    const r=annualLuckAtMinute({timeline,queryMinute,policyId});assert.equal(r.status,'OK');assert.equal(r.entries[0].yearLabel,2025);assert.equal(label(r.entries[0].pillar),'乙巳');
  }
  const at=annualLuckAtMinute({timeline,queryMinute:'2026-02-04T12:00',policyId});assert.equal(at.status,'AMBIGUOUS');assert.equal(at.confidence,'PUBLISHED_MINUTE_AMBIGUOUS');assert.deepEqual(at.entries.map(x=>[x.yearLabel,label(x.pillar),x.condition]),[[2025,'乙巳','BEFORE_PUBLISHED_MINUTE'],[2026,'丙午','AFTER_PUBLISHED_MINUTE']]);
  const after=annualLuckAtMinute({timeline,queryMinute:'2026-02-04T12:01',policyId});assert.equal(after.entries[0].yearLabel,2026);assert.equal(label(after.entries[0].pillar),'丙午');
  assert.equal(annualLuckAtMinute({timeline,queryMinute:'2026-02-17T12:00',policyId}).entries[0].yearLabel,2026);
});

test('M7 registry separates modern conventions and unresolved projection from transcription authenticity',()=>{
  assert.equal(M7_LUCK_POLICY_METADATA.milestone,'M7');assert.ok(M7_LUCK_POLICY_METADATA.historicalProposal.includes('M4-RULE'));
  assert.ok(M7_LUCK_POLICY_METADATA.sources.every(s=>s.editionVerification==='UNVERIFIED'&&s.rightsReview==='UNVERIFIED'));
  const ids=new Set(M7_LUCK_POLICY_METADATA.sources.map(s=>s.id));assert.ok(M7_LUCK_POLICY_METADATA.rules.every(r=>r.sourceRefs.every(id=>ids.has(id))));
  assert.ok(M7_LUCK_POLICY_METADATA.open.includes('EXACT_CALENDAR_PROJECTION_UNRESOLVED'));
  assert.throws(()=>M7_LUCK_POLICY_METADATA.policies.push({id:'AUTO'}),TypeError);
});
