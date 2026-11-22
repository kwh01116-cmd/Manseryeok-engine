import test from 'node:test';
import assert from 'node:assert/strict';
import { structuralM2Unit } from './fixtures/m3-structural-unit-input.mjs';
import { deriveM3Evidence, M3_EVIDENCE_PROFILE_ID } from '../dist/m3/structuralEvidenceV1.js';
import { deriveM4InnerPatterns, M4_INNER_PATTERN_PROFILE_ID } from '../dist/m4/innerPatternsV1.js';
import { reviewPatternPrerequisites } from '../dist/e2/patternReviewV1.js';

function context(charts, monthTerms) {
  const m2 = structuralM2Unit(charts, { monthTerms });
  const m3 = deriveM3Evidence(m2, { policyId: M3_EVIDENCE_PROFILE_ID });
  const m4 = deriveM4InnerPatterns(m3, { profileId: M4_INNER_PATTERN_PROFILE_ID, m2Facts: m2 });
  return { m2, m3, m4 };
}

function review(pillars, term, patternType) {
  const {m2, m3, m4} = context([pillars], [term]);
  const row = reviewPatternPrerequisites(m4, m3, m2, 0).find(r => r.patternType === patternType);
  assert.ok(row);
  assert.equal(row.effect, 'EFFECT_POLICY_REQUIRED');
  assert.deepEqual([row.formation, row.breakage, row.rescue], Array(3).fill('NOT_ADJUDICATED'));
  return row;
}

test('정관의 같은 辛 위치에 상관과 표면 인성이 연결되며 연지의 별도 辛은 월령 기준 자리가 아니다', () => {
  // 甲 day: 丁 hurts, 壬 resources. Month 酉 contains 辛, visible year 辛 exposes it.
  const row = review(['辛酉','丁酉','甲子','壬申'], 'BAILU', '正官');
  assert.equal(row.ruleId, 'OFFICER_HURT_AND_VISIBLE_RESOURCE');
  assert.equal(row.monthBasis, 'MAIN_QI');
  assert.equal(row.status, 'COOBSERVED_PREREQUISITES');
  assert.deepEqual(row.byAnchor.map(a => [a.role, a.stem, a.observed]), [
    ['month','辛','BOTH_AT_SAME_LOCATION'], ['year','辛','BOTH_AT_SAME_LOCATION'],
  ]);
  for (const a of row.byAnchor) {
    assert.ok(a.first.qualifying.some(x => x.role === 'month' && x.stem === '丁'));
    assert.deepEqual(a.second.qualifying.map(x => [x.role, x.stem]), [['hour','壬']]);
    assert.ok(a.second.hiddenOnlyExcluded.some(x => x.role === 'day' && x.stem === '癸'));
    assert.ok(a.first.qualifying.every(x => x.linkRef.endsWith(':' + a.anchorRef)));
    assert.ok(a.second.qualifying.every(x => x.linkRef.includes(':' + a.anchorRef + ':')));
  }
});

test('정관에서 장간 인성만 있을 때, 상관이 없을 때, 두 경로 모두 없을 때를 구별한다', () => {
  const tests = [
    {pillars:['辛酉','丁酉','甲子','庚申'], observed:'FIRST_ONLY'},
    {pillars:['癸卯','己酉','甲子','壬辰'], observed:'SECOND_ONLY'},
    {pillars:['丙寅','辛酉','甲寅','戊寅'], observed:'NEITHER'},
  ];
  for (const c of tests) {
    const row = review(c.pillars, 'BAILU', '正官');
    assert.equal(row.status, 'INCOMPLETE_PREREQUISITES');
    assert.ok(row.byAnchor.length && row.byAnchor.every(a => a.observed === c.observed));
    if (c.observed === 'FIRST_ONLY') assert.ok(row.byAnchor[0].second.hiddenOnlyExcluded.length);
  }
});

test('재성은 겁재·표면 식신을 구분하고 다른 월령 장간의 경쟁 투출을 보존한다', () => {
  const row = review(['乙卯','丙辰','甲子','丁卯'], 'QINGMING', '偏財');
  assert.equal(row.ruleId, 'WEALTH_ROBBER_AND_VISIBLE_FOOD');
  assert.equal(row.status, 'COOBSERVED_PREREQUISITES');
  assert.ok(row.competingExposures.length); // 辰中乙 and year 乙
  const a = row.byAnchor[0];
  assert.ok(a.first.qualifying.every(x => x.tenGod === '劫財'));
  assert.deepEqual(a.second.qualifying.map(x => [x.role,x.tenGod]), [['month','食神']]);
  const noRobber = review(['甲子','己丑','甲子','丙寅'], 'XIAOHAN', '正財');
  assert.ok(noRobber.byAnchor.every(a => a.observed === 'SECOND_ONLY'));
  const hiddenFood = review(['乙卯','丁丑','甲子','戊寅'], 'XIAOHAN', '正財');
  assert.equal(hiddenFood.byAnchor[0].observed, 'FIRST_ONLY');
  assert.ok(hiddenFood.byAnchor[0].second.hiddenOnlyExcluded.some(x => x.stem === '丙'));
});

test('칠살에서 식신과 상관을 나누고 칠살·인성 방향과 실제 제살 효력을 분리한다', () => {
  const both = review(['丙寅','戊申','甲午','壬申'], 'LIQIU', '七殺');
  assert.equal(both.ruleId, 'KILLINGS_FOOD_AND_RESOURCE');
  assert.equal(both.byAnchor[0].observed, 'BOTH_AT_SAME_LOCATION');
  assert.deepEqual([both.byAnchor[0].role, both.byAnchor[0].stem], ['month','庚']);
  assert.ok(both.byAnchor[0].first.qualifying.every(x => x.tenGod === '食神'));
  assert.ok(both.byAnchor[0].second.qualifying.some(x => x.role === 'month' && x.stem === '壬'));
  const hurtingOnly = review(['丁酉','戊申','甲午','壬申'], 'LIQIU', '七殺');
  assert.equal(hurtingOnly.byAnchor[0].observed, 'SECOND_ONLY');
  assert.equal(hurtingOnly.byAnchor[0].first.qualifying.length, 0);
});

test('월지 밖의 정관과 午의 보류 장간에는 전제 충족을 부여하지 않는다', () => {
  const not = review(['辛酉','乙卯','甲午','壬申'], 'JINGZHE', '正官');
  assert.equal(not.status, 'NOT_A_CANDIDATE_UNDER_POLICY');
  assert.deepEqual(not.byAnchor, []);
  const deferred = review(['乙卯','壬午','甲子','丙寅'], 'MANGZHONG', '正財');
  assert.equal(deferred.status, 'SOURCE_OR_POLICY_UNRESOLVED');
  assert.deepEqual(deferred.byAnchor, []);
});

test('입춘 두 후보를 개별 검토하고 다른 실행의 M2·M3, 위조·누락·잘못된 후보를 거절한다', () => {
  const charts = [['乙巳','己丑','己酉','丁卯'], ['丙午','庚寅','己酉','丁卯']];
  const terms = ['XIAOHAN','LICHUN'];
  const {m2,m3,m4} = context(charts, terms);
  const other = context(charts, terms);
  for (const [index, expected] of ['NOT_A_CANDIDATE_UNDER_POLICY','COOBSERVED_PREREQUISITES'].entries()) {
    const c = reviewPatternPrerequisites(m4, m3, m2, index).find(r => r.patternType === '正官');
    assert.equal(c.status, expected);
    assert.equal(c.candidateRef, 'chart.candidates[' + index + ']');
    assert.ok(c.factRefs.length && c.factRefs.every(ref => ref.startsWith(c.candidateRef + '#')));
  }
  assert.throws(() => reviewPatternPrerequisites(m4, undefined, m2, 0), /M2_AND_M3_REQUIRED/);
  assert.throws(() => reviewPatternPrerequisites(m4, m3, null, 0), /M2_AND_M3_REQUIRED/);
  assert.throws(() => reviewPatternPrerequisites(m4, other.m3, m2, 0), /FOREIGN_EXECUTION_CONTEXT/);
  assert.throws(() => reviewPatternPrerequisites(m4, m3, other.m2, 0), /FOREIGN_EXECUTION_CONTEXT/);
  assert.throws(() => reviewPatternPrerequisites(structuredClone(m4), m3, m2, 0), /ISSUED_IMMUTABLE/);
  assert.throws(() => reviewPatternPrerequisites(m4, m3, m2, 2), /CANDIDATE_REQUIRED/);
});
