import assert from 'node:assert/strict';
import test from 'node:test';
import {
  EARTHLY_BRANCHES, HEAVENLY_STEMS, TEN_GODS, HIDDEN_STEM_POLICY_V1,
  HIDDEN_STEM_RULE, hiddenStemsForBranch, branchTenGodFacts, tenGod,
} from '../dist/index.js';

test('10 day masters by 12 branches exhaustively map every hidden stem to an existing ten-god primitive', () => {
  let branchPairs=0, memberPairs=0;
  for(const dm of HEAVENLY_STEMS) for(const branch of EARTHLY_BRANCHES) {
    const facts=branchTenGodFacts(dm,branch,HIDDEN_STEM_POLICY_V1);
    const source=hiddenStemsForBranch(branch,HIDDEN_STEM_POLICY_V1);
    assert.equal(facts.dayMaster,dm);
    assert.equal(facts.branch,branch);
    assert.equal(facts.policyId,HIDDEN_STEM_POLICY_V1);
    assert.deepEqual(facts.sourceIds,HIDDEN_STEM_RULE.sourceIds);
    assert.equal(facts.ruleId,'M2-RULE-BRANCH-TEN-GODS-001');
    assert.deepEqual(facts.members.map(x=>[x.stem,x.index,x.position]),
      source.map(x=>[x.stem,x.index,x.position]));
    for(const member of facts.members){
      assert.equal(member.tenGod,tenGod(dm,member.stem),dm+branch+member.stem);
      assert.ok(TEN_GODS.includes(member.tenGod));
      memberPairs++;
    }
    branchPairs++;
  }
  assert.equal(branchPairs,120);
  assert.equal(memberPairs,120 * 28 / 12); // 28 hidden-stem members per 12-branch table.
});

test('independent fixed witnesses show why assigning one God to each branch loses other members', () => {
  const examples=[
    ['甲','子',[['癸','正印']]],
    ['甲','寅',[['甲','比肩'],['丙','食神'],['戊','偏財']]],
    ['甲','申',[['庚','七殺'],['壬','偏印'],['戊','偏財']]],
    ['甲','午',[['丁','傷官'],['己','正財']]],
  ];
  for(const [dm,branch,expected] of examples) {
    assert.deepEqual(branchTenGodFacts(dm,branch,HIDDEN_STEM_POLICY_V1).members.map(x=>[x.stem,x.tenGod]),expected);
  }
});

test('missing profile and malformed day master/branch reject instead of silently defaulting',()=>{
  for(const invalid of [undefined,null,'',{},'DEFAULT',0,'__proto__']) {
    assert.throws(()=>branchTenGodFacts('甲','寅',invalid),RangeError);
    assert.throws(()=>branchTenGodFacts(invalid,'寅',HIDDEN_STEM_POLICY_V1),RangeError);
    assert.throws(()=>branchTenGodFacts('甲',invalid,HIDDEN_STEM_POLICY_V1),RangeError);
  }
});

test('branch fact results and all nested member/source arrays are immutable',()=>{
  const facts=branchTenGodFacts('甲','寅',HIDDEN_STEM_POLICY_V1);
  assert.ok(Object.isFrozen(facts));
  assert.ok(Object.isFrozen(facts.sourceIds));
  assert.ok(Object.isFrozen(facts.members));
  assert.ok(facts.members.every(Object.isFrozen));
  assert.throws(()=>{facts.members[0].tenGod='正官'},TypeError);
  assert.throws(()=>facts.members.push({stem:'丁',tenGod:'食神',index:3,position:'OTHER'}),TypeError);
  assert.equal(branchTenGodFacts('甲','寅',HIDDEN_STEM_POLICY_V1).members[0].tenGod,'比肩');
  assert.deepEqual(Object.keys(facts).sort(),['branch','dayMaster','members','policyId','ruleId','sourceIds']);
});
