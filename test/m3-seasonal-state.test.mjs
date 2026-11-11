// These finite units exercise a selected rule, not 120 real birth charts or source authentication.
import test from 'node:test';
import assert from 'node:assert/strict';
import {
  M3_SEASONAL_POLICY_ID,
  resolveSeasonalState,
  explainSeasonalState,
  validateSeasonalState,
  validateSeasonalStateExplanation,
} from '../dist/m3/seasonalStateV1.js';

const stems=[...'甲乙丙丁戊己庚辛壬癸'],branches=[...'子丑寅卯辰巳午未申酉戌亥'];
// Independent literal expectations. Neither the target resolver nor its table/helper creates these cells.
// Wikisource's twenty cells, Shidian's summer 水因 variant and project scope are separated in M3_SEASONAL_STATE_POLICY_V01.md.
const expected={
  SPRING:{WOOD:'WANG',FIRE:'XIANG',EARTH:'SI',METAL:'QIU',WATER:'XIU'},
  SUMMER:{WOOD:'XIU',FIRE:'WANG',EARTH:'XIANG',METAL:'SI',WATER:'QIU'},
  AUTUMN:{WOOD:'SI',FIRE:'QIU',EARTH:'XIU',METAL:'WANG',WATER:'XIANG'},
  WINTER:{WOOD:'XIANG',FIRE:'SI',EARTH:'QIU',METAL:'XIU',WATER:'WANG'},
};
const stemElement={甲:'WOOD',乙:'WOOD',丙:'FIRE',丁:'FIRE',戊:'EARTH',己:'EARTH',庚:'METAL',辛:'METAL',壬:'WATER',癸:'WATER'};
const branchSeason={寅:'SPRING',卯:'SPRING',巳:'SUMMER',午:'SUMMER',申:'AUTUMN',酉:'AUTUMN',亥:'WINTER',子:'WINTER'};
const jie={
  子:['DAXUE','2026-12-07T11:53','대설'],丑:['XIAOHAN','2026-01-05T17:23','소한'],
  寅:['LICHUN','2026-02-04T05:02','입춘'],卯:['JINGZHE','2026-03-05T22:59','경칩'],
  辰:['QINGMING','2026-04-05T03:40','청명'],巳:['LIXIA','2026-05-05T20:49','입하'],
  午:['MANGZHONG','2026-06-06T00:48','망종'],未:['XIAOSHU','2026-07-07T10:57','소서'],
  申:['LIQIU','2026-08-07T20:43','입추'],酉:['BAILU','2026-09-07T23:41','백로'],
  戌:['HANLU','2026-10-08T15:29','한로'],亥:['LIDONG','2026-11-07T18:52','입동'],
};
function unit(dayMaster='丙',monthBranch='巳',candidateIndex=0){
  const candidateRef='chart.candidates['+candidateIndex+']',source='STRUCTURAL_TEST_CALENDAR_REFERENCE:'+candidateIndex,[term,displayedDateTime,koreanName]=jie[monthBranch];
  return {candidateRef,dayMaster,monthBranch,evidenceRefs:[candidateRef+'#m3-evidence[0]'],
    inputFactRefs:['summary','day-master','month-nature','month-hidden-stems'].map(s=>candidateRef+'#'+s),
    pillarRefs:[candidateRef+'.day',candidateRef+'.month'],calculationSourceRefs:[source],
    appliedJie:{term,displayedDateTime,timeBasis:'KST',sourcePrecision:'MINUTE',sourceIds:[source],koreanName}};
}
const resolve=input=>resolveSeasonalState(input,{policyId:M3_SEASONAL_POLICY_ID});
const meaning=result=>({status:result.status,season:result.season,elementStates:result.elementStates,seasonalState:result.seasonalState,reason:result.reason,dayMasterElement:result.dayMasterElement,monthBranch:result.monthBranch});

test('selected four-season policy agrees with all twenty independently fixed element cells',()=>{
  let cells=0;
  for(const [season,monthBranch]of [['SPRING','寅'],['SUMMER','巳'],['AUTUMN','申'],['WINTER','亥']]){
    const result=resolve(unit('甲',monthBranch));
    assert.equal(result.status,'RESOLVED_UNDER_POLICY');assert.equal(result.season,season);assert.equal(result.reason,null);
    for(const element of ['WOOD','FIRE','EARTH','METAL','WATER']){assert.equal(result.elementStates[element],expected[season][element],season+'/'+element);cells++;}
    assert.deepEqual(result.elementStates,expected[season]);
  }
  assert.equal(cells,20);
});

test('ten stems across twelve month branches resolve eighty and explicitly defer forty rule combinations',()=>{
  let resolved=0,deferred=0;
  for(const master of stems)for(const branch of branches){
    const result=resolve(unit(master,branch)),season=branchSeason[branch];
    assert.equal(result.dayMaster,master);assert.equal(result.monthBranch,branch);assert.equal(result.dayMasterElement,stemElement[master]);
    if(season){
      assert.equal(result.status,'RESOLVED_UNDER_POLICY',master+'/'+branch);assert.equal(result.season,season);
      assert.deepEqual(result.elementStates,expected[season]);assert.equal(result.seasonalState,expected[season][stemElement[master]]);assert.equal(result.reason,null);resolved++;
    }else{
      assert.equal(result.status,'POLICY_UNRESOLVED',master+'/'+branch);assert.equal(result.season,null);assert.equal(result.elementStates,null);assert.equal(result.seasonalState,null);
      assert.equal(result.reason,'EARTH_MONTH_POLICY_NOT_SELECTED');assert.deepEqual(result.appliedJie,unit(master,branch).appliedJie);deferred++;
    }
    assert.doesNotThrow(()=>validateSeasonalState(result));
  }
  assert.equal(resolved,80);assert.equal(deferred,40);assert.equal(resolved+deferred,120);
});

test('hand-fixed examples distinguish ordinary earth day masters from deferred earth month branches',()=>{
  for(const [master,branch,season,state]of [
    ['丙','巳','SUMMER','WANG'],['丁','巳','SUMMER','WANG'],['丙','子','WINTER','SI'],
    ['戊','寅','SPRING','SI'],['己','寅','SPRING','SI'],['庚','酉','AUTUMN','WANG'],['癸','卯','SPRING','XIU'],
  ]){const result=resolve(unit(master,branch));assert.equal(result.season,season);assert.equal(result.seasonalState,state,master+'/'+branch);}
  for(const branch of [...'辰未戌丑'])for(const master of ['戊','己']){
    const result=resolve(unit(master,branch));assert.equal(result.status,'POLICY_UNRESOLVED');assert.equal(result.seasonalState,null);assert.equal(result.reason,'EARTH_MONTH_POLICY_NOT_SELECTED');
  }
});

test('paired yin and yang stems share seasonal state without importing twelve-growth reversal',()=>{
  for(const [yang,yin]of [['甲','乙'],['丙','丁'],['戊','己'],['庚','辛'],['壬','癸']])for(const branch of branches){
    assert.deepEqual(meaning(resolve(unit(yang,branch))),meaning(resolve(unit(yin,branch))),yang+'/'+yin+'/'+branch);
  }
});

test('month-branch transitions enter and leave policy deferral and Lichun candidates stay separate',()=>{
  const before=resolve(unit('己','丑',0)),after=resolve(unit('己','寅',1));
  assert.equal(before.candidateRef,'chart.candidates[0]');assert.equal(before.status,'POLICY_UNRESOLVED');assert.equal(before.appliedJie.term,'XIAOHAN');
  assert.equal(after.candidateRef,'chart.candidates[1]');assert.equal(after.status,'RESOLVED_UNDER_POLICY');assert.equal(after.seasonalState,'SI');assert.equal(after.appliedJie.term,'LICHUN');
  assert.equal(resolve(unit('甲','卯')).status,'RESOLVED_UNDER_POLICY');assert.equal(resolve(unit('甲','辰')).status,'POLICY_UNRESOLVED');assert.equal(resolve(unit('甲','巳')).status,'RESOLVED_UNDER_POLICY');
  assert.equal(resolve(unit('丙','午')).seasonalState,'WANG');assert.equal(resolve(unit('丙','未')).seasonalState,null);
});

test('unsupported values, missing policies and contradictory or cross-candidate input references fail explicitly',()=>{
  for(const id of [undefined,null,'','AUTO','M3_FINAL_STRENGTH','M3-SEASONAL-UNKNOWN'])assert.throws(()=>resolveSeasonalState(unit(),{policyId:id}));
  assert.throws(()=>resolveSeasonalState(unit()));
  for(const mutate of [
    x=>{x.dayMaster='A';},x=>{x.dayMaster='甲乙';},x=>{x.monthBranch='一月';},x=>{x.monthBranch='火';},
    x=>{x.candidateRef='';},x=>{x.candidateRef='chart.candidates[2]';},
    x=>{x.evidenceRefs=[];},x=>{x.evidenceRefs=[''];},x=>{x.evidenceRefs=new Array(1);},x=>{x.evidenceRefs=['chart.candidates[1]#m3-evidence[0]'];},
    x=>{x.inputFactRefs=[];},x=>{x.inputFactRefs=new Array(1);},x=>{x.inputFactRefs=x.inputFactRefs.filter(r=>!r.endsWith('#day-master'));},
    x=>{x.inputFactRefs=x.inputFactRefs.filter(r=>!r.endsWith('#summary'));},x=>{x.inputFactRefs=x.inputFactRefs.filter(r=>!r.endsWith('#month-nature'));},
    x=>{x.inputFactRefs[0]='chart.candidates[1]#summary';},x=>{x.inputFactRefs.push(x.inputFactRefs[0]);},
    x=>{x.pillarRefs=['chart.candidates[0].year'];},x=>{x.pillarRefs=new Array(1);},x=>{x.pillarRefs[1]='chart.candidates[1].month';},
    x=>{x.calculationSourceRefs=[];},x=>{x.appliedJie.sourceIds=new Array(1);},x=>{x.appliedJie.sourceIds=['MISSING_CALENDAR_REF'];},
    x=>{x.calculationSourceRefs=new Array(1);x.appliedJie.sourceIds=new Array(1);},
    x=>{x.appliedJie.term='XIAOMAN';},x=>{x.appliedJie.term='LICHUN';},x=>{x.appliedJie.displayedDateTime='2026-02-30T12:00';},
    x=>{x.appliedJie.timeBasis='HOST_LOCAL_TIME';},x=>{x.appliedJie.sourcePrecision='SECOND';},
  ]){const input=unit();mutate(input);assert.throws(()=>resolve(input));}
});

test('unrelated natal locations and calendar labels cannot substitute for the selected candidate month branch',()=>{
  // Standalone policy input has no gender, luck, as-of, hidden stem, element-count or Gregorian/lunar-month fields.
  // Different month-pillar stems and all other chart details are therefore outside this pure function's contract.
  const a=unit('丙','巳'),b=unit('丙','巳');
  b.appliedJie.displayedDateTime='2025-05-05T14:57';b.calculationSourceRefs=['ANOTHER_STRUCTURAL_CALENDAR_REFERENCE'];b.appliedJie.sourceIds=[...b.calculationSourceRefs];
  assert.deepEqual(meaning(resolve(a)),meaning(resolve(b)));
  assert.notDeepEqual(meaning(resolve(unit('丙','巳'))),meaning(resolve(unit('丙','子'))));
  for(const key of ['traditionalSex','asOf','luckPolicy','projectionPolicy','hiddenStems','elementCounts','lunarMonth','gregorianMonth']){
    assert.throws(()=>resolve({...unit(),[key]:'UNRELATED_INPUT_MUST_NOT_BECOME_A_HIDDEN_POLICY'}));
  }
});

test('issued seasonal results preserve immutable references and reject fabricated or mutated result DTOs',()=>{
  const input=unit(),snapshot=JSON.stringify(input),result=resolve(input),saved=JSON.stringify(result);
  assert.equal(JSON.stringify(input),snapshot);assert.equal(Object.isFrozen(result),true);assert.equal(Object.isFrozen(result.input),true);
  assert.deepEqual(result.input.evidenceRefs,input.evidenceRefs);assert.deepEqual(result.input.inputFactRefs,input.inputFactRefs);
  assert.deepEqual(result.input.calculationSourceRefs,input.calculationSourceRefs);assert.deepEqual(result.appliedJie,input.appliedJie);
  assert.throws(()=>{result.seasonalState='SI';},TypeError);assert.throws(()=>{result.input.evidenceRefs.push('FOREIGN');},TypeError);
  input.dayMaster='癸';input.evidenceRefs[0]='chart.candidates[1]#m3-evidence[0]';assert.equal(JSON.stringify(result),saved);
  for(const extra of [{}, {score:5}, {strength:'STRONG'}, {deLing:true}])assert.throws(()=>validateSeasonalState({...structuredClone(result),...extra}));
  assert.deepEqual(resolve(unit()),result);
  for(const key of ['score','weight','strength','strengthScore','deLing','usefulGod','fortunePrediction'])assert.equal(Object.hasOwn(result,key),false);
});

test('classification sources, project scope and calendar references stay distinct without source-version promotion',()=>{
  const result=resolve(unit()),policy=result.policy;
  assert.equal(result.schemaVersion,'m3-seasonal-state-v1');assert.equal(policy.id,M3_SEASONAL_POLICY_ID);assert.equal(policy.version,'0.1.0');
  assert.equal(result.finalStrength.status,'NOT_IMPLEMENTED');assert.equal(result.finalStrength.releaseGate,'M3_FINAL_BLOCKED_UNCHANGED');
  assert.equal(result.validation.inputAuthentication,'NOT_PERFORMED_BY_PURE_MODULE');assert.equal(result.validation.editionOrRightsApproval,false);
  assert.equal(result.validation.predictiveValidity,'NOT_CLAIMED');assert.equal(result.validation.g0Receipt,null);assert.equal(result.validation.g1P2Promotion,false);
  assert.deepEqual(result.literatureSourceRefs,[
    'TXT-SANMING-TONGHUI-V2-WIKISOURCE-SEASONAL','TXT-SANMING-TONGHUI-SHIDIAN-SEASONAL','TXT-ZIPING-ZHENQUAN-DONGLI-SEASONAL-LIMIT',
  ]);
  assert.deepEqual(result.implementationSourceRefs,['IMPL-M3-SEASONAL-STATE-V1']);
  assert.ok(result.calculationSourceRefs.every(ref=>!result.literatureSourceRefs.includes(ref)));
  for(const rule of policy.rules){assert.equal(rule.sourceRuleVersion,null);assert.equal(rule.runtimeVersion,'0.1.0');assert.ok(rule.sourceIds.every(ref=>policy.sources.some(source=>source.id===ref)));assert.ok(!rule.sourceIds.some(ref=>result.calculationSourceRefs.includes(ref)));}
  const wiki=policy.sources.find(source=>source.id==='TXT-SANMING-TONGHUI-V2-WIKISOURCE-SEASONAL');assert.equal(wiki.revisionId,'2292392');assert.equal(wiki.nativeRuleVersion,null);
  const variant=policy.sources.find(source=>source.id==='TXT-SANMING-TONGHUI-SHIDIAN-SEASONAL').variant;
  assert.equal(variant.displayed,'水因');assert.equal(variant.adopted,'水囚');assert.match(variant.adoptionBasis,/NOT_SILENT_REPAIR/);
  assert.equal(policy.sources.find(source=>source.id==='TXT-ZIPING-ZHENQUAN-DONGLI-SEASONAL-LIMIT').verification,'PRIMARY_PAGE_BODY_SEARCH_CACHE_READ_LIVE_ORIGIN_UNAVAILABLE');
  for(const mixed of result.literatureSourceRefs){const input=unit();input.calculationSourceRefs=[mixed];input.appliedJie.sourceIds=[mixed];assert.throws(()=>resolve(input));}
});

test('Korean summaries state the selected seasonal classification and preserve explicit earth-month deferral',()=>{
  const summer=resolve(unit('丙','巳')),winter=resolve(unit('丙','子')),earth=resolve(unit('戊','寅')),deferred=resolve(unit('己','丑'));
  const a=explainSeasonalState(summer),b=explainSeasonalState(winter),c=explainSeasonalState(earth),d=explainSeasonalState(deferred);
  assert.match(a.items[0].text,/巳월은 여름 구간/);assert.match(a.items[0].text,/일간 丙의 오행인 화는 왕\(旺\)으로 분류/);
  assert.match(b.items[0].text,/子월은 겨울 구간/);assert.match(b.items[0].text,/화는 사\(死\)로 분류/);
  assert.match(c.items[0].text,/토는 사\(死\)로 분류/);
  assert.match(d.items[0].text,/월지는 丑/);assert.match(d.items[0].text,/계절 상태를 보류/);assert.match(d.items[0].text,/명식과 나머지 구조적 근거는 유지/);
  assert.match(a.scopeNote,/전체 명식의 신강 판정이 아니/);assert.match(d.scopeNote,/최종|전체 명식/);
  assert.equal(a.items.length,2);assert.equal(d.items.length,1);assert.ok(!d.items.some(item=>item.templateId==='KO_M3_SEASONAL_FIVE_ELEMENTS'));
  for(const [view,result]of [[a,summer],[b,winter],[c,earth],[d,deferred]]){
    assert.doesNotThrow(()=>validateSeasonalStateExplanation(view,result));assert.equal(Object.isFrozen(view),true);
    for(const item of view.items){assert.equal(item.candidateRef,result.candidateRef);assert.deepEqual(item.judgmentRefs,[result.id]);assert.deepEqual(item.inputEvidenceRefs,result.inputEvidenceRefs);assert.deepEqual(item.inputFactRefs,result.inputFactRefs);assert.ok(!item.text.includes('undefined'));}
  }
});

test('template and evidence tampering cannot turn seasonal labels into strength, scores, luck or adverse events',()=>{
  const result=resolve(unit('丙','子',0)),other=resolve(unit('己','寅',1)),view=explainSeasonalState(result);
  for(const mutate of [
    x=>{x.candidateRef=other.candidateRef;},x=>{x.judgmentRef=other.id;},
    x=>{x.items[0].candidateRef=other.candidateRef;},x=>{x.items[0].judgmentRefs=[other.id];},
    x=>{x.items[0].inputEvidenceRefs=other.inputEvidenceRefs;},x=>{x.items[0].inputFactRefs=other.inputFactRefs;},
    x=>{x.items[0].inputEvidenceRefs=['MISSING_EVIDENCE'];},x=>{x.items[0].ruleRefs=['MISSING_RULE'];},
    x=>{x.items[0].literatureSourceRefs=['KASI_IS_NOT_A_SEASONAL_RULE_SOURCE'];},x=>{x.items[0].policyRefs=['MISSING_POLICY'];},
    x=>{x.items[0].calculationSourceRefs=['MISSING_CALENDAR_SOURCE'];},x=>{x.items[0].templateId='UNKNOWN_TEMPLATE';},
    x=>{x.items[0].text='겨울 火死이므로 신약입니다.';},x=>{x.items[0].text='왕상휴수사를 5·4·3·2·1점으로 합산합니다.';},
    x=>{x.items[0].text='이 대운은 흉하고 죽음·질병·수감을 예측합니다.';},x=>{x.items[0].text='왕이므로 득령이며 용신은 목입니다.';},
    x=>{x.status='READY';},x=>{x.score=1;},x=>{x.finalStrength='STRONG';},x=>{x.scopeNote='이것으로 신강약 판정이 완료됩니다.';},
  ]){const bad=structuredClone(view);mutate(bad);assert.throws(()=>validateSeasonalStateExplanation(bad,result));}
  assert.throws(()=>validateSeasonalStateExplanation(explainSeasonalState(other),result));
  assert.deepEqual(explainSeasonalState(resolve(unit('丙','子'))),view);
});
