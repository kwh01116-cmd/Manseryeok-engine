import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { test } from 'node:test';
import { validateE5Request } from '../scripts/engine/e5-cli.mjs';
import { E5_SELECTION, E5_CORE_SELECTION, validateE5Selection } from '../scripts/engine/e5.mjs';
import { projectPurposeComparison } from '../scripts/engine/e5-purposes.mjs';
import { validateE3Selection } from '../scripts/engine/e3.mjs';

test('E5 accepts only explicit policies and a birth DTO, with optional existing E1 selection', async () => {
  const request = JSON.parse(await readFile(new URL('../docs/contracts/examples/engine-e5-request-v1.json', import.meta.url)));
  assert.deepEqual(request.selection, E5_SELECTION);
  validateE5Request(request);
  validateE5Selection(E5_CORE_SELECTION);
  assert.throws(() => validateE3Selection(E5_SELECTION), /EXPLICIT_E3_POLICY_BUNDLE_REQUIRED/);
  assert.throws(() => validateE5Request({ ...request, candidates: [] }), /E5_REQUEST_SCHEMA/);
  assert.throws(() => validateE5Request({ ...request, birth: { ...request.birth, candidateRef: 'forged' } }));
  for (const key of ['pattern', 'climate', 'tongguan']) {
    assert.throws(() => validateE5Selection({ ...E5_SELECTION, [key]: { ...E5_SELECTION[key], policyVersion: '0.0.0' } }),
      /E5_EXPLICIT_POLICY_VERSION_REQUIRED/);
    assert.throws(() => validateE5Selection({ ...E5_SELECTION, [key]: {
      get policyId() { assert.fail('untrusted getter must not run'); },
      policyVersion: E5_SELECTION[key].policyVersion,
    } }), /E5_EXPLICIT_POLICY_VERSION_REQUIRED/);
  }
});

test('purpose projection compares overlap and balance direction and preserves E1 order', () => {
  const values = [{ element: 'WOOD', surface: [], hidden: [] }, { element: 'FIRE', surface: [], hidden: [] }];
  const old = {
    eokbu: { policyId: 'E1', policyVersion: '1', result: {
      candidates: values, status: 'COMPETING_CANDIDATES', patternHandoff: { directions: [{
        patternAssessmentRef: 'p0', potentialCounterDirection: 'PATTERN_CONTROLS_EOKBU',
      }] },
    } },
    strength: { result: { grade: 'STRONG', dayMaster: { element: 'FIRE' } } },
  };
  const wrap = result => ({ policyId: 'selected', policyVersion: 'test', result });
  const current = {
    climateAssessmentV2: wrap({ status: 'CANDIDATE', candidates: [{ element: 'FIRE' }] }),
    patternAssessmentV2: wrap({ status: 'COMPETING_PATHS', rules: [{
      patternRef: 'p0', patternType: '七殺', status: 'COMPETING_PATHS', ruleId: 'R1', paths: [],
    }, {
      patternRef: 'p1', patternType: '正財', status: 'STRUCTURAL_POSSIBILITY', target: 'INTERFERENCE', paths: [],
    }] }),
    tongguanAssessment: wrap({ status: 'STRUCTURAL_CANDIDATES', candidates: [{ element: 'WATER' }] }),
  };
  const before = structuredClone(old);
  const value = projectPurposeComparison('c0', old, current);
  assert.deepEqual(value.assessments.EOKBU.candidates, values);
  assert.deepEqual(value.assessments.PATTERN.candidates.map(item => item.patternRef), ['p0']);
  assert.equal(value.relations[0].status, 'SHARED_CANDIDATE_ELEMENT');
  assert.equal(value.relations[0].balanceDirections[0].status, 'OPPOSING_BALANCE_DIRECTION');
  assert.equal(value.relations[1].status, 'DISTINCT_CANDIDATE_ELEMENTS');
  assert.equal(value.relations[3].directions[0].hasE5StructurePath, true);
  assert.equal(value.relations[3].changesEokbuRank, false);
  assert.deepEqual(value.finalUsefulGod, { status: 'NOT_IMPLEMENTED' });
  assert.deepEqual(value.favorableUnfavorableRanking, { status: 'NOT_IMPLEMENTED' });
  assert.deepEqual(old, before);
});

test('purpose projection retains HOLD, observed-only and absent E1 without an implied candidate', () => {
  const old = { eokbu: { availability: 'NOT_SELECTED', limitationCodes: ['SELECT_E1_EXPLICITLY'], result: null },
    strength: { result: null } };
  const current = {
    climateAssessmentV2: { result: { status: 'EXISTING_EFFECT_UNRESOLVED', candidates: [] } },
    patternAssessmentV2: { result: { status: 'OBSERVED_ONLY', rules: [] } },
    tongguanAssessment: { result: { status: 'HOLD', candidates: [], unresolvedConditions: ['MEDIATOR_NOT_OBSERVED'] } },
  };
  const value = projectPurposeComparison('c0', old, current);
  assert.equal(value.assessments.EOKBU.status, 'NOT_SELECTED');
  assert.equal(value.assessments.CLIMATE.status, 'EXISTING_EFFECT_UNRESOLVED');
  assert.equal(value.assessments.PATTERN.status, 'OBSERVED_ONLY');
  assert.equal(value.assessments.TONGGUAN.status, 'HOLD');
  assert.equal(value.relations[0].status, 'POLICY_NOT_SELECTED');
  assert.equal(value.relations[2].status, 'CANDIDATE_COMPARISON_UNAVAILABLE');
  assert.ok(Object.values(value.assessments).every(item => item.candidates.length === 0));
});
