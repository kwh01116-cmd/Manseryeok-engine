import { E3_CORE_SELECTION, E3_SELECTION, loadEngineE3, validateE3Selection } from './e3.mjs';
import { validateLocalM3SeasonalJudgments } from '../kasi/local-m3-evidence.mjs';
import { PATTERN_V2_POLICY_ID, PATTERN_V2_VERSION, evaluatePatternV2 } from '../../dist/e5/patternV2.js';
import { CLIMATE_V2_POLICY_ID, CLIMATE_V2_VERSION, CLIMATE_V2_SOURCES, evaluateClimateV2 } from '../../dist/e5/climateV2.js';
import { TONGGUAN_POLICY_ID, TONGGUAN_VERSION, assessTongguanV1 } from '../../dist/e5/tongguanV1.js';
import { PURPOSE_COMPARISON_POLICY, projectPurposeComparison } from './e5-purposes.mjs';

export const E5_PROFILE_ID = 'ENGINE-PARITY-E5-V01';
export const E5_VERSION = '0.1.0';
const policy = (policyId, policyVersion) => Object.freeze({ policyId, policyVersion });
export const E5_CORE_SELECTION = Object.freeze({
  profileId: E5_PROFILE_ID, version: E5_VERSION,
  pattern: policy(PATTERN_V2_POLICY_ID, PATTERN_V2_VERSION),
  climate: policy(CLIMATE_V2_POLICY_ID, CLIMATE_V2_VERSION),
  tongguan: policy(TONGGUAN_POLICY_ID, TONGGUAN_VERSION),
  e3: E3_CORE_SELECTION,
});
export const E5_SELECTION = Object.freeze({ ...E5_CORE_SELECTION, e3: E3_SELECTION });

function check(value, code) { if (!value) throw new RangeError(code); }

export function hasExactDataFields(value, keys) {
  return !!value && [Object.prototype, null].includes(Object.getPrototypeOf(value))
    && Reflect.ownKeys(value).length === keys.length && keys.every(key => {
      const property = Object.getOwnPropertyDescriptor(value, key);
      return property?.enumerable && 'value' in property;
    });
}

export function validateE5Selection(selection) {
  check(hasExactDataFields(selection, Object.keys(E5_CORE_SELECTION)) &&
    selection.profileId === E5_PROFILE_ID && selection.version === E5_VERSION, 'E5_EXPLICIT_POLICY_BUNDLE_REQUIRED');
  for (const key of ['pattern', 'climate', 'tongguan']) {
    const value = selection[key], expected = E5_CORE_SELECTION[key];
    check(hasExactDataFields(value, ['policyId', 'policyVersion']) &&
      value.policyId === expected.policyId && value.policyVersion === expected.policyVersion, 'E5_EXPLICIT_POLICY_VERSION_REQUIRED');
  }
  validateE3Selection(selection.e3);
}

function freeze(value) {
  if (value !== null && typeof value === 'object' && !Object.isFrozen(value)) {
    Object.values(value).forEach(freeze);
    Object.freeze(value);
  }
  return value;
}

const features = {
  patternAssessmentV2: ['pattern', ['NATAL_STRUCTURE_ONLY', 'WHOLE_PATTERN_EFFECT_UNEVALUATED']],
  climateAssessmentV2: ['climate', ['SELECTED_SEASONAL_FAMILIES_ONLY', 'CLIMATE_SUFFICIENCY_UNEVALUATED']],
  tongguanAssessment: ['tongguan', ['POSITIONAL_CONNECTION_ONLY', 'MEDIATION_EFFECT_UNEVALUATED']],
  purposeComparison: [null, ['NO_COMBINED_USEFUL_GOD', 'NO_FAVORABLE_ELEMENT_RANKING']],
};

function feature(id, selection, availability, result, factRefs, extraCodes = []) {
  const [key, limits] = features[id];
  return {
    featureId: id, availability, ...(key ? selection[key] : PURPOSE_COMPARISON_POLICY), result,
    factRefs, limitationCodes: [...limits, ...extraCodes],
  };
}

function availability(value, candidateStates) {
  if (value.status === 'NEEDS_DATA') return 'NEEDS_DATA';
  if (value.status === 'NEEDS_INPUT') return 'NEEDS_INPUT';
  if (['UNRESOLVED', 'POLICY_UNRESOLVED', 'COMPETING', 'COMPETING_PATHS', 'OBSERVED_ONLY',
    'OBSERVATION_ONLY', 'EXISTING_EFFECT_UNRESOLVED'].includes(value.status)) return 'PARTIAL';
  return candidateStates.includes(value.status) ? 'AVAILABLE' : 'HOLD';
}

function project(e3, selection) {
  const data = e3.e2.existing.analysisData;
  const upstream = data?.base?.existing ?? data;
  const inner = data?.base?.innerPatterns ?? data?.innerPatterns;
  const root = '/e3/e2/existing/analysisData' + (data?.base ? '/base/existing' : '');
  if (e3.candidates.length) validateLocalM3SeasonalJudgments(upstream.seasonal, { evidence: upstream.evidence });
  const candidates = e3.candidates.map((old, index) => {
    const parent = e3.e2.candidates[index], previous = old.features.patternRules.result;
    const prior = parent.features, strength = prior.strength.result;
    const { candidateRef } = old;
    check(parent.candidateRef === candidateRef && previous.candidateRef === candidateRef &&
      upstream.facts.candidates[index].id === candidateRef, 'E5_CANDIDATE_CONTEXT_MISMATCH');

    const pattern = evaluatePatternV2(inner, upstream.evidence, upstream.facts, index,
      { ...selection.pattern, ...(strength ? { strength } : {}) });
    const climate = evaluateClimateV2(upstream.facts, upstream.evidence, index, upstream.seasonal, selection.climate);
    const tongguan = assessTongguanV1(upstream.evidence, upstream.facts, index, selection.tongguan);
    for (const result of [pattern, climate, tongguan]) {
      check(result.candidateRef === candidateRef, 'E5_CANDIDATE_CONTEXT_MISMATCH');
    }

    const prefix = '/e3/e2/candidates/' + index + '/features/';
    const local = '/candidates/' + index + '/features/';
    const observations = [root + '/facts/candidates/' + index, root + '/evidence/candidates/' + index];
    const output = {
      patternAssessmentV2: feature('patternAssessmentV2', selection, availability(pattern, ['STRUCTURAL_POSSIBILITY']), pattern,
        [...observations, '/e3/candidates/' + index + '/features/patternRules/result']),
      climateAssessmentV2: feature('climateAssessmentV2', selection,
        availability(climate, ['CANDIDATE_UNDER_POLICY', 'CANDIDATE']), climate,
        [...observations, root + '/seasonal/candidates/' + index, prefix + 'climate/result']),
      tongguanAssessment: feature('tongguanAssessment', selection,
        availability(tongguan, ['STRUCTURAL_CANDIDATES']), tongguan, [...observations, prefix + 'relations/result']),
    };
    const comparison = projectPurposeComparison(candidateRef, prior, output);
    return { candidateRef, features: {
      ...output, purposeComparison: feature('purposeComparison', selection, 'AVAILABLE', comparison,
        [...Object.keys(output).map(key => local + key), prefix + 'eokbu']),
    } };
  });

  const underlyingHold = e3.unavailableFeatures.patternRules;
  const unavailableFeatures = underlyingHold ? Object.fromEntries(Object.keys(features).map(id =>
    [id, feature(id, selection, underlyingHold.availability, null,
      ['/e3/e2/existing/status', '/e3/e2/existing/holds'], underlyingHold.limitationCodes)])) : {};
  return freeze({ schemaVersion: 'manseryeok-engine-e5-result-v1', track: e3.track, selection: structuredClone(selection),
    status: e3.status, sourceCatalog: { climate: CLIMATE_V2_SOURCES }, e3, candidates, unavailableFeatures });
}

/** The only public calculation entry accepts a birth request, never an issued-result-shaped JSON. */
export async function loadEngineE5({ dataDirectory }) {
  const engine = await loadEngineE3({ dataDirectory });
  return Object.freeze({ calculate(birth, selection) {
    validateE5Selection(selection);
    return project(engine.calculate(birth, selection.e3), selection);
  } });
}
