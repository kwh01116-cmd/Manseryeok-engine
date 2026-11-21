import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import {
  assessProductStrength, classifyProductSupport, isIssuedProductStrength, PRODUCT_STRENGTH_POLICY_ID,
} from '../dist/e1/productStrengthV1.js';

const registered = JSON.parse(readFileSync(new URL('./fixtures/e1-strength-contracts-v1.json', import.meta.url), 'utf8'));
const options = { policyId: PRODUCT_STRENGTH_POLICY_ID };
const roles = ['year','month','day','hour'];
function input(pillars, index = 0) {
  return { candidateRef: `chart.candidates[${index}]`, pillars: pillars.map(([stem,branch],i) => ({
    role: roles[i], stem, branch, factRef: `facts.candidates[${index}].pillars[${i}]`,
  })) };
}

for (const [id, kind, words, support, grade, axes, exactCount, otherCount, special] of registered.cases) {
  test(`E1/M3 handwritten ${kind} — ${id}`, () => {
    const value = assessProductStrength(input(words), options);
    assert.equal(value.score.supportUnits, support);
    assert.equal(value.grade, grade);
    assert.deepEqual([value.seasonalEvidence.acquired,value.rootEvidence.acquired,value.supportingEvidence.acquired], axes);
    assert.equal(value.rootEvidence.exactRoots.length, exactCount);
    assert.equal(value.rootEvidence.sameElementOtherRoots.length, otherCount);
    assert.equal(value.specialReview, special);
    const rows = value.weightedComponents;
    assert.equal(new Set(rows.map(row => row.factRef)).size, rows.length);
    assert.equal(rows.reduce((s, row) => s + row.units, 0), 10000);
    assert.equal(Object.values(value.roleUnits).reduce((s,n) => s+n, 0), 10000);
    assert.ok(rows.every(row => Number.isSafeInteger(row.units) && row.units > 0));
    assert.ok(rows.every(row => row.sourceFactId.startsWith(value.candidateRef + '#')));
  });
}

test('E1/M3 direction thresholds are inclusive through 45 and 55, independent of display rounding', () => {
  assert.deepEqual([0,4499,4500,5000,5500,5501,10000].map(classifyProductSupport),
    ['WEAK','WEAK','BORDERLINE','BORDERLINE','BORDERLINE','STRONG','STRONG']);
  for (const invalid of [NaN, 4499.5, 10001, -1]) assert.throws(() => classifyProductSupport(invalid));
});

test('E1/M3 distinct hidden and threshold probes retain original score; roots add no second budget', () => {
  const value = assessProductStrength(input(['甲申','甲申','甲申','甲申']), options);
  assert.equal(value.score.supportUnits, 4400);
  assert.equal(value.sensitivity.status, 'SENSITIVE_TO_POLICY');
  assert.deepEqual(value.sensitivity.probes.map(p => p.supportUnits), [4400,4400,4750,4050,4400,4400]);
  assert.equal(value.sensitivity.stressOnly.supportUnits, 3000);
  const oneRoot = assessProductStrength(input(['辛卯','辛酉','辛卯','辛卯']), options);
  assert.equal(oneRoot.rootEvidence.exactRoots.length, 1);
  assert.equal(oneRoot.rootEvidence.extraRootUnits, 0);
  assert.equal(oneRoot.weightedComponents.find(row => row.factRef === oneRoot.rootEvidence.exactRoots[0]).units, 3000);
  assert.deepEqual(oneRoot.sensitivity.probes.slice(0,2).map(p=>p.supportUnits),[5600,6400]);
});

test('E1/M3 overlapping branch relations, distance and stem pairs remain explicit with no operative deduction', () => {
  const value = assessProductStrength(input(['乙巳','庚申','壬午','丁未'], 1), options);
  const { branchPairs, stemPairs, effectStatus } = value.competingConditions;
  const firstTwo = branchPairs.filter(p => p.leftPillarIndex === 0 && p.rightPillarIndex === 1);
  assert.deepEqual(new Set(firstTwo.map(p => p.kind)),new Set(['LIUHE','LIUPO','XING']));
  assert.ok(firstTwo.every(p => p.adjacent && p.factRef.startsWith('chart.candidates[1]')));
  assert.ok(stemPairs.some(p => p.leftRole === 'year' && p.rightRole === 'month'));
  assert.ok(stemPairs.some(p => p.leftRole === 'day' && p.rightRole === 'hour'));
  assert.equal(effectStatus,'NOT_EVALUATED');
  assert.equal(value.score.supportUnits, value.roleUnits.PEER + value.roleUnits.RESOURCE);
});

test('E1/M3 incomplete, sparse, invalid gan-zhi, mixed candidate and implicit policy inputs fail closed', () => {
  const words = ['乙巳','己丑','壬午','丙午'];
  for (const edit of [
    v => { v.pillars.pop(); }, v => { delete v.pillars[1]; }, v => { v.pillars[0].branch = '午'; },
    v => { v.pillars[0].role = 'month'; }, v => { v.candidateRef = 'chart.candidates[1]'; },
    v => { v.pillars[3].factRef = v.pillars[0].factRef; },
  ]) {
    const v = input(words); edit(v); assert.throws(() => assessProductStrength(v, options));
  }
  assert.throws(() => assessProductStrength(input(words), { policyId:'EXPERIMENTAL' }));
  const original = input(words), result = assessProductStrength(original, options);
  const twin = assessProductStrength(input(words), options);
  assert.deepEqual(result, twin);
  assert.ok(isIssuedProductStrength(result));
  assert.ok(!isIssuedProductStrength(structuredClone(result)));
  original.pillars[0].branch = '午';
  assert.equal(result.inputFacts[0].branch, '巳');
  assert.throws(() => { result.weightedComponents[0].units = 5000; });
});
