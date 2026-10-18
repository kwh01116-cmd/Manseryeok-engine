import test from 'node:test';
import assert from 'node:assert/strict';
import {
  EARTHLY_BRANCHES, HEAVENLY_STEMS, HIDDEN_STEM_POLICY_V1,
  HIDDEN_STEMS_V1, HIDDEN_STEM_RULE, hiddenStemsForBranch,
} from '../dist/index.js';

// Independently transcribed unordered membership from 淵海子平「又地支藏遁歌」.
// These are sets rather than copied modern MAIN/OTHER array ordering.
const classicalMembers = Object.freeze({
  子:'癸',丑:'癸辛己',寅:'甲丙戊',卯:'乙',辰:'乙戊癸',巳:'庚丙戊',
  午:'丁己',未:'乙己丁',申:'庚壬戊',酉:'辛',戌:'辛丁戊',亥:'壬甲',
});
const modernMain = Object.freeze({
  子:'癸',丑:'己',寅:'甲',卯:'乙',辰:'戊',巳:'丙',
  午:'丁',未:'己',申:'庚',酉:'辛',戌:'戊',亥:'壬',
});

test('12 branches retain independently transcribed classical membership without omissions', () => {
  assert.deepEqual(Object.keys(classicalMembers).sort(), [...EARTHLY_BRANCHES].sort());
  assert.deepEqual(Object.keys(HIDDEN_STEMS_V1).sort(), [...EARTHLY_BRANCHES].sort());
  for (const branch of EARTHLY_BRANCHES) {
    const got = hiddenStemsForBranch(branch,HIDDEN_STEM_POLICY_V1);
    assert.deepEqual([...new Set(got.map(x=>x.stem))].sort(),
      [...classicalMembers[branch]].sort(), branch);
    assert.ok(got.every(x=>HEAVENLY_STEMS.includes(x.stem)));
    assert.deepEqual(got.map(x=>x.index), got.map((_,i)=>i));
  }
});

test('main qi is explicitly versioned; no numerical seasonal/strength claim leaks', () => {
  assert.equal(HIDDEN_STEM_RULE.policyId,HIDDEN_STEM_POLICY_V1);
  assert.equal(HIDDEN_STEM_RULE.codeability,'CONDITIONAL');
  assert.equal(HIDDEN_STEM_RULE.disputeStatus,'SCHOOL_DEPENDENT');
  assert.equal(HIDDEN_STEM_RULE.evidenceLayer,'CLASSICAL_BASE_TEXT');
  assert.deepEqual(HIDDEN_STEM_RULE.sourceIds,[
    'CLASSIC-YUANHAI-ZIPING-DIZHI-CANGDUN-GE',
    'MODERN-BAZIINSIGHT-HIDDEN-STEMS-2026',
  ]);
  for (const branch of EARTHLY_BRANCHES) {
    const row=hiddenStemsForBranch(branch,HIDDEN_STEM_POLICY_V1);
    assert.equal(row[0].stem,modernMain[branch],branch);
    assert.deepEqual(row.map(x=>x.position),row.map((_,i)=>i===0?'MAIN_QI':'OTHER'));
    assert.deepEqual(row.map(x=>Object.keys(x).sort()),row.map(()=>['index','position','stem']));
  }
  assert.deepEqual([...'子卯酉'].map(b=>hiddenStemsForBranch(b,HIDDEN_STEM_POLICY_V1).length),[1,1,1]);
  assert.equal(hiddenStemsForBranch('午',HIDDEN_STEM_POLICY_V1).length,2);
  assert.equal(hiddenStemsForBranch('亥',HIDDEN_STEM_POLICY_V1).length,2);
});

test('unknown/omitted policy and malformed/prototype branch names fail closed', () => {
  for (const policy of [undefined,null,'','HIDDEN_STEMS_DEFAULT',0,{},'DIFFERENT-SCHOOL']) {
    assert.throws(()=>hiddenStemsForBranch('子',policy),RangeError);
  }
  for (const branch of [undefined,null,'','甲','子宮','constructor','__proto__',{},0]) {
    assert.throws(()=>hiddenStemsForBranch(branch,HIDDEN_STEM_POLICY_V1),RangeError);
  }
});

test('static source and all nested rows resist runtime mutation', () => {
  assert.equal(Object.isFrozen(HIDDEN_STEM_RULE),true);
  assert.equal(Object.isFrozen(HIDDEN_STEM_RULE.sourceIds),true);
  assert.equal(Object.isFrozen(HIDDEN_STEMS_V1),true);
  for (const branch of EARTHLY_BRANCHES) {
    const row=hiddenStemsForBranch(branch,HIDDEN_STEM_POLICY_V1);
    assert.equal(Object.isFrozen(row),true);
    assert.ok(row.every(Object.isFrozen));
    assert.throws(()=>row.push({stem:'甲',position:'MAIN_QI',index:0}),TypeError);
    assert.throws(()=>{row[0].stem='甲'},TypeError);
    assert.throws(()=>{HIDDEN_STEMS_V1[branch]=[]},TypeError);
  }
  assert.equal(hiddenStemsForBranch('子',HIDDEN_STEM_POLICY_V1)[0].stem,'癸');
});
