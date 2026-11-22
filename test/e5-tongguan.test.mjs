import assert from 'node:assert/strict';
import test from 'node:test';
import { structuralM2Unit } from './fixtures/m3-structural-unit-input.mjs';
import { deriveM3Evidence, M3_EVIDENCE_PROFILE_ID } from '../dist/m3/structuralEvidenceV1.js';
import {
  assessTongguanV1, TONGGUAN_DIRECTIONS, TONGGUAN_POLICY_ID, TONGGUAN_VERSION,
} from '../dist/e5/tongguanV1.js';

const policy = { policyId: TONGGUAN_POLICY_ID, policyVersion: TONGGUAN_VERSION };
const multi = ['甲寅', '丙午', '戊辰', '庚申'];

function issue(charts, monthTerms) {
  const facts = structuralM2Unit(charts, { monthTerms });
  const evidence = deriveM3Evidence(facts, { policyId: M3_EVIDENCE_PROFILE_ID });
  return { facts, evidence };
}

function assess(pillars, term) {
  const { facts, evidence } = issue([pillars], [term]);
  return assessTongguanV1(evidence, facts, 0, policy);
}

function woodControlsEarth(assessment) {
  const route = assessment.routes.find(row => row.from === 'WOOD' && row.to === 'EARTH');
  assert.ok(route);
  return route;
}

function locations(assessment, refs) {
  return refs.map(ref => {
    const site = assessment.observedPositions.find(position => position.positionRef === ref);
    assert.ok(site);
    return [site.pillarRole, site.stem, site.position];
  });
}

test('E5 Tongguan derives all five ordered generation chains in the traditional table', () => {
  // Fixed independently from the implementation and its M2 relation derivation.
  assert.deepEqual(TONGGUAN_DIRECTIONS.map(({ from, mediator, to }) => [from, mediator, to]), [
    ['WOOD', 'FIRE', 'EARTH'],
    ['FIRE', 'EARTH', 'METAL'],
    ['EARTH', 'METAL', 'WATER'],
    ['METAL', 'WATER', 'WOOD'],
    ['WATER', 'WOOD', 'FIRE'],
  ]);
});

test('E5 Tongguan keeps multiple three-position chains and distinguishes exact and same-element root observations', () => {
  const result = assess(multi, 'MANGZHONG');
  const wood = woodControlsEarth(result);
  assert.equal(result.status, 'COMPETING_PATHS');
  assert.ok(result.candidates.some(row => row.element === 'FIRE' && row.from === 'WOOD' && row.to === 'EARTH'));
  assert.ok(result.candidates.some(row => row.element === 'EARTH' && row.from === 'FIRE' && row.to === 'METAL'));
  const surfacePath = wood.paths.find(path => locations(result, path.chain).every(site => site[2] === 'VISIBLE'));
  assert.ok(surfacePath);
  assert.deepEqual(locations(result, surfacePath.chain), [
    ['year', '甲', 'VISIBLE'], ['month', '丙', 'VISIBLE'], ['day', '戊', 'VISIBLE'],
  ]);
  assert.deepEqual(surfacePath.steps, [1, 1]);
  const mediator = wood.mediatorPositions.find(site => site.positionRef === surfacePath.chain[1]);
  assert.deepEqual(locations(result, mediator.exactRootRefs), [['year', '丙', 'OTHER']]);
  assert.deepEqual(locations(result, mediator.sameElementOtherStemRefs), [['month', '丁', 'MAIN_QI']]);
  const clash = wood.opposingEvidence.find(row => row.kind === 'LIUCHONG');
  assert.ok(clash);
  assert.ok(surfacePath.concernRefs.includes(clash.concernRef));
  assert.equal(wood.effectStatus, 'NOT_EVALUATED');
  assert.equal(new Set(result.observedPositions.map(site => site.positionRef)).size, result.observedPositions.length);
  assert.equal(new Set(result.factRefs).size, result.factRefs.length);
});

test('E5 Tongguan can report an uncontested structural candidate even if the mediator lacks an exact root', () => {
  const result = assess(['乙卯', '丁卯', '己卯', '丁卯'], 'JINGZHE');
  assert.equal(result.status, 'STRUCTURAL_CANDIDATES');
  assert.deepEqual(result.candidates.map(row => row.element), ['FIRE']);
  const route = woodControlsEarth(result);
  assert.equal(route.status, 'STRUCTURAL_PATH');
  assert.ok(route.paths.length > 0);
  assert.ok(route.mediatorPositions.every(site => !site.exactRootRefs.length && !site.sameElementOtherStemRefs.length));
  assert.ok(route.paths.every(path => !path.concernRefs.length));
  assert.equal(route.effectStatus, 'NOT_EVALUATED');
});

test('E5 Tongguan distinguishes a branch-main mediator from other-hidden-only and absent mediators', () => {
  const hidden = assess(['甲寅', '庚午', '戊辰', '壬申'], 'MANGZHONG');
  const hiddenRoute = woodControlsEarth(hidden);
  assert.notEqual(hiddenRoute.status, 'HOLD');
  assert.ok(hiddenRoute.paths.some(path => {
    const [, mediator] = locations(hidden, path.chain);
    return mediator[0] === 'month' && mediator[1] === '丁' && mediator[2] === 'MAIN_QI';
  }));
  assert.ok(hiddenRoute.mediatorPositions.every(site => locations(hidden, [site.positionRef])[0][2] !== 'VISIBLE'));

  const minor = assess(['甲寅', '戊辰', '己丑', '壬子'], 'QINGMING');
  const minorRoute = woodControlsEarth(minor);
  assert.equal(minorRoute.status, 'HOLD');
  assert.deepEqual(minorRoute.unresolvedConditions, ['MEDIATOR_OTHER_HIDDEN_ONLY']);
  assert.deepEqual(locations(minor, minorRoute.mediatorPositions.map(site => site.positionRef)), [['year', '丙', 'OTHER']]);

  const missing = assess(['甲子', '庚辰', '戊辰', '壬申'], 'QINGMING');
  const missingRoute = woodControlsEarth(missing);
  assert.equal(missingRoute.status, 'HOLD');
  assert.deepEqual(missingRoute.unresolvedConditions, ['MEDIATOR_NOT_OBSERVED']);
  assert.deepEqual(missingRoute.mediatorPositions, []);
  assert.ok(missing.candidates.every(row => row.element !== 'FIRE'));
});

test('E5 Tongguan holds a remote-only route, preserves a combination, and reports no direct control separately', () => {
  const distant = woodControlsEarth(assess(['甲子', '壬子', '戊辰', '丙午'], 'DAXUE'));
  assert.equal(distant.status, 'HOLD');
  assert.ok(distant.mediatorPositions.some(site => site.eligibleAsAnchor));
  assert.deepEqual(distant.unresolvedConditions, ['NO_POSITION_CHAIN_WITHIN_POLICY_REACH']);

  const combined = assess(['甲寅', '丙午', '戊辰', '癸亥'], 'MANGZHONG');
  const combination = woodControlsEarth(combined).opposingEvidence.find(row => row.kind === 'STEM_COMBINATION');
  assert.ok(combination);
  assert.deepEqual(locations(combined, [combination.leftRef, combination.rightRef]), [
    ['day', '戊', 'VISIBLE'], ['hour', '癸', 'VISIBLE'],
  ]);
  assert.equal(woodControlsEarth(combined).effectStatus, 'NOT_EVALUATED');

  const noDirect = assess(['壬子', '癸亥', '壬子', '癸亥'], 'LIDONG');
  assert.equal(noDirect.status, 'NOT_APPLICABLE');
  assert.deepEqual(noDirect.candidates, []);
  assert.deepEqual(noDirect.routes, []);
});

test('E5 Tongguan requires the same issued context, isolates multiple parents and rejects unsupported selections', () => {
  const { facts, evidence } = issue([multi, ['壬子', '癸亥', '壬子', '癸亥']], ['MANGZHONG', 'LIDONG']);
  const other = issue([multi], ['MANGZHONG']);
  const results = facts.candidates.map((_chart, index) => assessTongguanV1(evidence, facts, index, policy));
  for (const [index, result] of results.entries()) {
    const candidate = facts.candidates[index];
    const ids = new Set(candidate.facts.map(fact => fact.id));
    assert.equal(result.candidateRef, candidate.id);
    assert.ok(result.factRefs.every(ref => ids.has(ref) ||
      ref.includes('#member[') && ids.has(ref.split('#member[')[0])));
    assert.ok(result.observedPositions.every(site => site.positionRef.startsWith(candidate.id)));
    assert.equal(Object.isFrozen(result.routes), true);
  }
  assert.notEqual(results[0].status, results[1].status);
  assert.throws(() => assessTongguanV1(evidence, other.facts, 0, policy), /M3_ORIGINAL_INPUT_CONTEXT_REQUIRED/);
  assert.throws(() => assessTongguanV1(structuredClone(evidence), facts, 0, policy), /ISSUED_IMMUTABLE_M3_EVIDENCE_REQUIRED/);
  assert.throws(() => assessTongguanV1(evidence, facts, 2, policy), /CANDIDATE_REQUIRED/);
  assert.throws(() => assessTongguanV1(evidence, facts, 0, { ...policy, policyVersion: '0.2.0' }), /POLICY_REQUIRED/);
});
