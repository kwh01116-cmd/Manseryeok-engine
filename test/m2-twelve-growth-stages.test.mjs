import test from 'node:test';
import assert from 'node:assert/strict';
import {
  HEAVENLY_STEMS, EARTHLY_BRANCHES, STEM_NATURE,
  TWELVE_GROWTH_POLICY_V1, TWELVE_GROWTH_ANCHORS,
  TWELVE_GROWTH_STAGES, TWELVE_GROWTH_RULE, twelveGrowthStage,
} from '../dist/index.js';

const anchors={
  甲:'亥',乙:'午',丙:'寅',丁:'酉',戊:'寅',己:'酉',庚:'巳',辛:'子',壬:'申',癸:'卯',
};
const fixedWitnesses=[
  ['甲','亥','長生'],['甲','寅','臨官'],['甲','卯','帝旺'],['甲','未','墓'],['甲','申','絕'],
  ['乙','午','長生'],['乙','卯','臨官'],['乙','寅','帝旺'],['乙','戌','墓'],['乙','酉','絕'],
  ['丙','寅','長生'],['丙','巳','臨官'],['丙','午','帝旺'],['丙','戌','墓'],['丙','亥','絕'],
  ['丁','酉','長生'],['丁','午','臨官'],['丁','巳','帝旺'],['丁','丑','墓'],['丁','子','絕'],
  ['壬','申','長生'],['壬','亥','臨官'],['壬','子','帝旺'],['壬','辰','墓'],['壬','巳','絕'],
  ['癸','卯','長生'],['癸','子','臨官'],['癸','亥','帝旺'],['癸','未','墓'],['癸','午','絕'],
];

test('10 day masters exhaustively yield a bijective 12-stage cycle with explicit anchors and directions',()=>{
  assert.deepEqual(TWELVE_GROWTH_ANCHORS,anchors);
  assert.equal(TWELVE_GROWTH_STAGES.length,12);
  let checked=0;
  for(const master of HEAVENLY_STEMS){
    const stages=EARTHLY_BRANCHES.map(branch=>twelveGrowthStage(master,branch,TWELVE_GROWTH_POLICY_V1));
    assert.deepEqual(new Set(stages.map(f=>f.stage)),new Set(TWELVE_GROWTH_STAGES));
    assert.equal(stages.find(f=>f.stage==='長生').branch,anchors[master]);
    assert.ok(stages.every(f=>f.anchor===anchors[master]));
    assert.ok(stages.every(f=>f.dayMaster===master));
    assert.ok(stages.every(f=>f.policyId===TWELVE_GROWTH_POLICY_V1));
    assert.ok(stages.every(f=>f.direction===(STEM_NATURE[master].polarity==='YANG'?'FORWARD':'REVERSE')));
    checked+=stages.length;
  }
  assert.equal(checked,120);
});

test('pinned published starting-point witnesses preserve main life-stage cycle',()=>{
  for(const [master,branch,stage] of fixedWitnesses)
    assert.equal(twelveGrowthStage(master,branch,TWELVE_GROWTH_POLICY_V1).stage,stage,master+branch);
  for(const branch of EARTHLY_BRANCHES){
    assert.equal(twelveGrowthStage('戊',branch,TWELVE_GROWTH_POLICY_V1).stage,
      twelveGrowthStage('丙',branch,TWELVE_GROWTH_POLICY_V1).stage);
    assert.equal(twelveGrowthStage('己',branch,TWELVE_GROWTH_POLICY_V1).stage,
      twelveGrowthStage('丁',branch,TWELVE_GROWTH_POLICY_V1).stage);
  }
  assert.equal(twelveGrowthStage('甲','子',TWELVE_GROWTH_POLICY_V1).stage,'沐浴');
  assert.equal(twelveGrowthStage('乙','巳',TWELVE_GROWTH_POLICY_V1).stage,'沐浴');
});

test('source and school policy are explicit without lucky, strength or future-event values',()=>{
  assert.equal(TWELVE_GROWTH_RULE.codeability,'CONDITIONAL');
  assert.equal(TWELVE_GROWTH_RULE.disputeStatus,'SCHOOL_DEPENDENT');
  assert.equal(TWELVE_GROWTH_RULE.meaning,'TRADITIONAL_STAGE_LABEL_ONLY');
  const f=twelveGrowthStage('癸','卯',TWELVE_GROWTH_POLICY_V1);
  assert.deepEqual(f.sourceIds,TWELVE_GROWTH_RULE.sourceIds);
  assert.deepEqual(Object.keys(f).sort(),
    ['anchor','branch','dayMaster','direction','policyId','ruleId','sourceIds','stage']);
  for(const bad of ['strength','favorability','fortune','rootStrength','score'])
    assert.equal(Object.hasOwn(f,bad),false);
});

test('omitted/disputed school policy and bogus/prototype heavenly/earthly tokens are rejected',()=>{
  for(const x of [undefined,null,'','ANOTHER_SCHOOL',{},0,'__proto__']) {
    assert.throws(()=>twelveGrowthStage('甲','寅',x),RangeError);
    assert.throws(()=>twelveGrowthStage(x,'寅',TWELVE_GROWTH_POLICY_V1),RangeError);
    assert.throws(()=>twelveGrowthStage('甲',x,TWELVE_GROWTH_POLICY_V1),RangeError);
  }
});

test('growth-stage tables, provenance metadata and returned facts are immutable',()=>{
  assert.equal(Object.isFrozen(TWELVE_GROWTH_STAGES),true);
  assert.equal(Object.isFrozen(TWELVE_GROWTH_ANCHORS),true);
  assert.equal(Object.isFrozen(TWELVE_GROWTH_RULE),true);
  assert.equal(Object.isFrozen(TWELVE_GROWTH_RULE.sourceIds),true);
  const f=twelveGrowthStage('甲','亥',TWELVE_GROWTH_POLICY_V1);
  assert.equal(Object.isFrozen(f),true);
  assert.throws(()=>{f.stage='病'},TypeError);
  assert.throws(()=>{TWELVE_GROWTH_ANCHORS.甲='寅'},TypeError);
  assert.throws(()=>TWELVE_GROWTH_STAGES.push('SUPER'),TypeError);
  assert.equal(twelveGrowthStage('甲','亥',TWELVE_GROWTH_POLICY_V1).stage,'長生');
});
