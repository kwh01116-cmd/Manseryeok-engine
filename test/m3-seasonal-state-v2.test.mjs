// Finite synthetic policy contexts, not claims that every combination is a real birth chart.
import test from 'node:test';
import assert from 'node:assert/strict';
import {
  M3_SEASONAL_SILI_POLICY_ID,
  resolveNominalSeasonalInterval,
  classifySeasonalSiliState,
  resolveSeasonalSiliState,
  explainSeasonalSiliState,
  validateSeasonalSiliState,
  validateSeasonalSiliExplanation,
} from '../dist/m3/seasonalStateV2.js';
import {resolveSeasonalState,M3_SEASONAL_POLICY_ID} from '../dist/m3/seasonalStateV1.js';

// Independent twenty-five literal cells. Target tables/relation helpers never generate expectations.
const expected={
  SPRING:{WOOD:'WANG',FIRE:'XIANG',EARTH:'SI',METAL:'QIU',WATER:'XIU'},
  SUMMER:{WOOD:'XIU',FIRE:'WANG',EARTH:'XIANG',METAL:'SI',WATER:'QIU'},
  AUTUMN:{WOOD:'SI',FIRE:'QIU',EARTH:'XIU',METAL:'WANG',WATER:'XIANG'},
  WINTER:{WOOD:'XIANG',FIRE:'SI',EARTH:'QIU',METAL:'XIU',WATER:'WANG'},
  EARTH_DOMINANT:{WOOD:'QIU',FIRE:'XIU',EARTH:'WANG',METAL:'XIANG',WATER:'SI'},
};
const stems=[...'甲乙丙丁戊己庚辛壬癸'];
const elements={甲:'WOOD',乙:'WOOD',丙:'FIRE',丁:'FIRE',戊:'EARTH',己:'EARTH',庚:'METAL',辛:'METAL',壬:'WATER',癸:'WATER'};
const normal={寅:['LICHUN','2026-02-04T05:02','2026-02-10T12:00','SPRING'],卯:['JINGZHE','2026-03-05T22:59','2026-03-10T12:00','SPRING'],巳:['LIXIA','2026-05-05T20:49','2026-06-01T12:00','SUMMER'],午:['MANGZHONG','2026-06-06T00:48','2026-06-10T12:00','SUMMER'],申:['LIQIU','2026-08-07T20:43','2026-08-10T12:00','AUTUMN'],酉:['BAILU','2026-09-07T23:41','2026-09-10T12:00','AUTUMN'],亥:['LIDONG','2026-11-07T18:52','2026-11-10T12:00','WINTER'],子:['DAXUE','2026-12-07T11:53','2026-12-10T12:00','WINTER']};
const ending={
  辰:{s:['QINGMING','2026-04-05T03:40'],t:['LIXIA','2026-05-05T20:49'],b:'2026-04-17T20:49',season:'SPRING'},
  未:{s:['XIAOSHU','2026-07-07T10:57'],t:['LIQIU','2026-08-07T20:43'],b:'2026-07-20T20:43',season:'SUMMER'},
  戌:{s:['HANLU','2026-10-08T15:29'],t:['LIDONG','2026-11-07T18:52'],b:'2026-10-20T18:52',season:'AUTUMN'},
  丑:{s:['XIAOHAN','2026-01-05T17:23'],t:['LICHUN','2026-02-04T05:02'],b:'2026-01-17T05:02',season:'WINTER'},
};
function minute(value,delta){const [y,m,d,h,n]=value.match(/\d+/g).map(Number);return new Date(Date.UTC(y,m-1,d,h,n+delta)).toISOString().slice(0,16);}
function context(dayMaster='丙',monthBranch='辰',birthDateTime,at={}){
  const candidateRef='chart.candidates['+(at.candidateIndex??0)+']',source='SYNTHETIC_CALENDAR_S:'+candidateRef;
  const sourceT='SYNTHETIC_CALENDAR_T:'+candidateRef;
  const data=ending[monthBranch],n=normal[monthBranch],s=data?.s??n?.slice(0,2);
  const appliedJie={term:s?.[0],displayedDateTime:s?.[1],timeBasis:'KST',sourcePrecision:'MINUTE',sourceIds:[source]};
  const nextSili=data?{term:data.t[0],displayedDateTime:data.t[1],timeBasis:'KST',sourcePrecision:'MINUTE',sourceIds:[sourceT]}:null;
  return {base:{candidateRef,dayMaster,monthBranch,evidenceRefs:[candidateRef+'#m3-evidence[0]'],inputFactRefs:['summary','day-master','month-nature','month-hidden-stems'].map(v=>candidateRef+'#'+v),pillarRefs:[candidateRef+'.day',candidateRef+'.month'],calculationSourceRefs:[source],appliedJie},birthDateTime:birthDateTime??(data?minute(data.b,1):n?.[2]),monthCondition:at.monthCondition??'BETWEEN_PUBLISHED_BOUNDARIES',nextSili};
}
const run=input=>resolveSeasonalSiliState(input,{policyId:M3_SEASONAL_SILI_POLICY_ID});
const meaning=value=>({status:value.status,reason:value.reason??null,season:value.season,seasonalState:value.seasonalState,elementStates:value.elementStates,alternatives:value.alternatives.map(a=>({condition:a.condition,season:a.season,seasonalState:a.seasonalState,elementStates:a.elementStates}))});

test('five seasonal rows agree with twenty-five independent literal states',()=>{
  let checked=0;
  for(const [branch,season]of [['寅','SPRING'],['巳','SUMMER'],['申','AUTUMN'],['亥','WINTER'],['辰','EARTH_DOMINANT']]){
    const result=run(context('甲',branch));assert.equal(result.status,'RESOLVED_UNDER_POLICY');assert.equal(result.season,season);
    for(const element of ['WOOD','FIRE','EARTH','METAL','WATER']){assert.equal(result.elementStates[element],expected[season][element],season+'/'+element);checked++;}
  }
  assert.equal(checked,25);
});

test('all ten day stems use element identity, with ordinary earth and earth-dominant states kept distinct',()=>{
  for(const stem of stems)for(const [branch,season]of [['寅','SPRING'],['巳','SUMMER'],['申','AUTUMN'],['亥','WINTER'],['辰','EARTH_DOMINANT']]){
    const result=run(context(stem,branch));assert.equal(result.seasonalState,expected[season][elements[stem]],stem+'/'+season);
  }
  for(const [a,b]of [['甲','乙'],['丙','丁'],['戊','己'],['庚','辛'],['壬','癸']])for(const branch of Object.keys(normal).concat(Object.keys(ending)))assert.deepEqual(meaning(run(context(a,branch))),meaning(run(context(b,branch))));
  for(const stem of ['戊','己']){assert.equal(run(context(stem,'辰')).seasonalState,'WANG');assert.equal(run(context(stem,'寅')).seasonalState,'SI');}
});

test('normal eight months agree semantically with v0.1 without any future event dependency',()=>{
  for(const stem of stems)for(const [branch,row]of Object.entries(normal)){
    const input=context(stem,branch),result=run(input),old=resolveSeasonalState(input.base,{policyId:M3_SEASONAL_POLICY_ID});
    assert.equal(result.season,row[3]);assert.equal(result.season,old.season);assert.equal(result.seasonalState,old.seasonalState);assert.deepEqual(result.elementStates,old.elementStates);assert.equal(input.nextSili,null);
  }
  for(const branch of Object.keys(ending)){const old=resolveSeasonalState(context('戊',branch).base,{policyId:M3_SEASONAL_POLICY_ID});assert.equal(old.status,'POLICY_UNRESOLVED');assert.equal(old.reason,'EARTH_MONTH_POLICY_NOT_SELECTED');}
});

test('each ending month uses literal T-minus-eighteen-days boundaries and keeps B alternatives under one parent',()=>{
  for(const [branch,data]of Object.entries(ending)){
    const before=run(context('丙',branch,minute(data.b,-1))),at=run(context('丙',branch,data.b)),after=run(context('丙',branch,minute(data.b,1)));
    assert.equal(before.derivedBoundary.displayedDateTime,data.b);assert.equal(at.derivedBoundary.displayedDateTime,data.b);assert.equal(after.derivedBoundary.displayedDateTime,data.b);
    assert.equal(before.season,data.season);assert.equal(after.season,'EARTH_DOMINANT');assert.equal(at.status,'AMBIGUOUS');assert.equal(at.seasonalState,null);
    assert.equal(at.alternatives.length,2);assert.deepEqual(at.alternatives.map(a=>a.season),[data.season,'EARTH_DOMINANT']);
    assert.equal(at.candidateRef,before.candidateRef);assert.equal(at.candidateRef,after.candidateRef);assert.equal(new Set(at.alternatives.map(a=>a.id)).size,2);
  }
  const a=run(context('丙','辰','2026-04-17T20:48')),b=run(context('丙','辰','2026-04-17T20:49')),c=run(context('丙','辰','2026-04-17T20:50'));
  assert.equal(a.seasonalState,'XIANG');assert.deepEqual(b.alternatives.map(x=>x.seasonalState),['XIANG','XIU']);assert.equal(c.seasonalState,'XIU');
});

test('T-minus-eighteen-days differs from S-plus-twelve-days and no thirty-day scaling is used',()=>{
  const input=context('丙','辰','2026-04-17T10:00');
  assert.equal(minute(input.base.appliedJie.displayedDateTime,12*1440),'2026-04-17T03:40');
  const value=run(input);assert.equal(value.derivedBoundary.displayedDateTime,'2026-04-17T20:49');assert.equal(value.season,'SPRING');assert.equal(value.seasonalState,'XIANG');
});

test('S and T same-minute conditions reuse existing month candidates instead of a Cartesian product',()=>{
  const e=ending.丑;
  const start=run(context('己','丑',e.s[1],{monthCondition:'AFTER_PUBLISHED_BOUNDARY'}));assert.equal(start.season,'WINTER');
  const before=run(context('己','丑',e.t[1],{candidateIndex:0,monthCondition:'BEFORE_PUBLISHED_BOUNDARY'}));
  const after=run(context('己','寅',e.t[1],{candidateIndex:1,monthCondition:'AFTER_PUBLISHED_BOUNDARY'}));
  assert.equal(before.season,'EARTH_DOMINANT');assert.equal(before.seasonalState,'WANG');assert.equal(before.alternatives.length,1);
  assert.equal(after.season,'SPRING');assert.equal(after.seasonalState,'SI');assert.equal(after.alternatives.length,1);
  for(const input of [context('丙','辰',ending.辰.s[1]),context('丙','辰',ending.辰.t[1]),context('丙','辰',minute(ending.辰.s[1],-1)),context('丙','辰',minute(ending.辰.t[1],1))])assert.throws(()=>run(input));
});

test('all four ending months preserve existing month transitions at S and T before, at and after',()=>{
  const neighbors={辰:{before:'卯',after:'巳'},未:{before:'午',after:'申'},戌:{before:'酉',after:'亥'},丑:{before:'子',after:'寅'}};
  for(const [branch,data]of Object.entries(ending)){
    const pair=neighbors[branch];
    // For January Chou the preceding Daxue belongs to the previous civil year.
    const previous=(birth,condition='BETWEEN_PUBLISHED_BOUNDARIES')=>{const input=context('丙',pair.before,birth,{monthCondition:condition});if(branch==='丑')input.base.appliedJie.displayedDateTime='2025-12-07T11:53';return run(input);};
    assert.equal(previous(minute(data.s[1],-1)).season,data.season);
    assert.equal(previous(data.s[1],'BEFORE_PUBLISHED_BOUNDARY').season,data.season);
    assert.equal(run(context('丙',branch,data.s[1],{monthCondition:'AFTER_PUBLISHED_BOUNDARY'})).season,data.season);
    assert.equal(run(context('丙',branch,minute(data.s[1],1))).season,data.season);
    assert.equal(run(context('丙',branch,minute(data.t[1],-1))).season,'EARTH_DOMINANT');
    assert.equal(run(context('丙',branch,data.t[1],{monthCondition:'BEFORE_PUBLISHED_BOUNDARY'})).season,'EARTH_DOMINANT');
    const next=context('丙',pair.after,data.t[1],{monthCondition:'AFTER_PUBLISHED_BOUNDARY'});
    assert.equal(run(next).season,normal[pair.after][3]);
    assert.equal(run(context('丙',pair.after,minute(data.t[1],1))).season,normal[pair.after][3]);
  }
});

test('missing exact next Sili reports NEEDS_DATA and never manufactures a substitute',()=>{
  const input=context('丙','辰');input.nextSili=null;
  const result=run(input);assert.equal(result.status,'NEEDS_DATA');assert.equal(result.seasonalState,null);assert.equal(result.derivedBoundary,null);assert.equal(result.alternatives.length,0);assert.ok(result.missingData.length>0);
  for(const mutate of [x=>{x.nextSili.term='XIAOMAN';},x=>{x.nextSili.term='LIQIU';},x=>{x.nextSili.displayedDateTime='2027-05-05T20:49';},x=>{x.nextSili.displayedDateTime='2026-04-06T20:49';},x=>{x.nextSili.sourceIds=[];},x=>{x.nextSili.sourceIds=['TXT-QIANLI-MINGGAO-TIANYA-SILI-PRE18'];}]){const value=context();mutate(value);assert.throws(()=>run(value));}
});

test('January Chou uses that months actual February Lichun and leap-day arithmetic stays Gregorian',()=>{
  const january=run(context('己','丑','2026-01-20T12:00'));assert.equal(january.nextSili.displayedDateTime,'2026-02-04T05:02');assert.equal(january.derivedBoundary.displayedDateTime,'2026-01-17T05:02');
  const input=context('丙','辰','2024-04-17T12:00');input.base.appliedJie.displayedDateTime='2024-04-04T15:02';input.nextSili.displayedDateTime='2024-05-05T09:10';
  assert.equal(run(input).derivedBoundary.displayedDateTime,'2024-04-17T09:10');
});

test('invalid policy, input precision, references and month-event combinations fail explicitly',()=>{
  for(const policyId of [undefined,null,'','AUTO',M3_SEASONAL_POLICY_ID])assert.throws(()=>resolveSeasonalSiliState(context(),{policyId}));
  assert.throws(()=>resolveSeasonalSiliState(context()));
  for(const mutate of [
    x=>{x.base.dayMaster='A';},x=>{x.base.monthBranch='月';},x=>{x.birthDateTime='2026-02-30T12:00';},x=>{x.birthDateTime='2026-04-20';},x=>{x.birthDateTime='1988-04-20T12:00';},x=>{x.birthDateTime='2027-04-20T12:00';},
    x=>{x.monthCondition='AUTO';},x=>{x.base.evidenceRefs=[];},x=>{x.base.evidenceRefs=new Array(1);},x=>{x.base.evidenceRefs=['chart.candidates[1]#m3-evidence[0]'];},
    x=>{x.base.inputFactRefs.push(x.base.inputFactRefs[0]);},x=>{x.base.inputFactRefs[0]='chart.candidates[1]#summary';},
    x=>{x.base.calculationSourceRefs=new Array(1);},x=>{x.nextSili.sourceIds=new Array(1);},x=>{x.nextSili.sourceIds.push(x.nextSili.sourceIds[0]);},
    x=>{x.base.appliedJie.term='JINGZHE';},x=>{x.base.appliedJie.timeBasis='UTC';},x=>{x.nextSili.timeBasis='UTC';},x=>{x.nextSili.sourcePrecision='SECOND';},
  ]){const input=context();mutate(input);assert.throws(()=>run(input));}
});

test('pure interval/classification stages retain immutable issuance and do not accept forged contexts',()=>{
  const input=context(),snapshot=JSON.stringify(input),interval=resolveNominalSeasonalInterval(input,{policyId:M3_SEASONAL_SILI_POLICY_ID});
  const result=classifySeasonalSiliState(interval,{policyId:M3_SEASONAL_SILI_POLICY_ID});assert.deepEqual(result,run(input));assert.equal(JSON.stringify(input),snapshot);
  assert.equal(Object.isFrozen(result),true);assert.throws(()=>{result.seasonalState='SI';},TypeError);assert.throws(()=>{result.input.base.dayMaster='甲';},TypeError);
  assert.doesNotThrow(()=>validateSeasonalSiliState(result));assert.throws(()=>validateSeasonalSiliState(structuredClone(result)));
  assert.throws(()=>classifySeasonalSiliState(structuredClone(interval),{policyId:M3_SEASONAL_SILI_POLICY_ID}));
  for(const key of ['score','strength','weight','deLing','usefulGod','fortune'])assert.equal(Object.hasOwn(result,key),false);
  assert.equal(result.finalStrength.status,'NOT_IMPLEMENTED');
});

test('Korean templates expose nominal policy, boundary alternatives and traceable separate sources',()=>{
  for(const input of [context('丙','巳'),context('丙','辰','2026-04-17T20:48'),context('丙','辰','2026-04-17T20:49'),context('丙','辰','2026-04-17T20:50')]){
    const result=run(input),view=explainSeasonalSiliState(result);assert.ok(view.text.length);assert.ok(!view.text.includes('undefined'));assert.equal(view.candidateRef,result.candidateRef);assert.doesNotThrow(()=>validateSeasonalSiliExplanation(view,result));
    for(const mutate of [x=>{x.candidateRef='chart.candidates[1]';},x=>{x.text='토왕이므로 신강하고 재물이 들어옵니다.';},x=>{x.score=5;},x=>{x.items[0].text='계절 사는 죽음과 질병을 뜻합니다.';},x=>{x.items[0].templateId='UNKNOWN';},x=>{x.items.length++;}]){const bad=structuredClone(view);mutate(bad);assert.throws(()=>validateSeasonalSiliExplanation(bad,result));}
  }
});
