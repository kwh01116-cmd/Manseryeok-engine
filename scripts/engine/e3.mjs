import { E2_CORE_SELECTION, E2_SELECTION, loadEngineE2, validateE2Selection } from './e2.mjs';
import { evaluatePatternRulesV1, PATTERN_RULES_POLICY_ID, PATTERN_RULES_VERSION } from '../../dist/e3/patternRulesV1.js';

export const E3_CORE_SELECTION = Object.freeze({
  profileId: 'ENGINE-PARITY-E3-V01',
  version: '0.1.0',
  patternRulePolicyId: PATTERN_RULES_POLICY_ID,
  e2: E2_CORE_SELECTION,
});
export const E3_SELECTION = Object.freeze({ ...E3_CORE_SELECTION, e2: E2_SELECTION });

export function validateE3Selection(selection) {
  const keys = Object.keys(E3_CORE_SELECTION);
  if (!selection || ![Object.prototype, null].includes(Object.getPrototypeOf(selection))
    || Reflect.ownKeys(selection).length !== keys.length
    || !keys.every(key => {
      const property = Object.getOwnPropertyDescriptor(selection, key);
      return property?.enumerable && 'value' in property;
    })
    || selection.profileId !== E3_CORE_SELECTION.profileId
    || selection.version !== E3_CORE_SELECTION.version
    || selection.patternRulePolicyId !== PATTERN_RULES_POLICY_ID) {
    throw new RangeError('EXPLICIT_E3_POLICY_BUNDLE_REQUIRED');
  }
  validateE2Selection(selection.e2);
}

function feature(availability, result, factRefs, limitationCodes) {
  return { featureId: 'patternRules', availability, policyId: PATTERN_RULES_POLICY_ID,
    policyVersion: PATTERN_RULES_VERSION, result, factRefs, limitationCodes };
}

function freeze(value) {
  if (value && typeof value === 'object' && !Object.isFrozen(value)) {
    for (const child of Object.values(value)) freeze(child);
    Object.freeze(value);
  }
  return value;
}

function project(e2, selection) {
  // No public entry point accepts external E2 JSON. Only the same, authenticated
  // in-process calculation reaches this adapter and the M4/E1 validators.
  const data = e2.existing.analysisData;
  const upstream = data?.base?.existing ?? data;
  const inner = data?.base?.innerPatterns ?? data?.innerPatterns;
  const upstreamPath = '/e2/existing/analysisData' + (data?.base ? '/base/existing' : '');
  const candidates = e2.candidates.map((candidate, index) => {
    const { strength, eokbu } = candidate.features;
    const candidatePath = '/e2/candidates/' + index + '/features';
    const result = evaluatePatternRulesV1(inner, upstream.evidence, upstream.facts, index, {
      policyId: PATTERN_RULES_POLICY_ID, policyVersion: PATTERN_RULES_VERSION,
      ...(strength.result ? { strength: strength.result } : {}),
    });
    if (candidate.candidateRef !== result.candidateRef) throw new RangeError('E3_FOREIGN_CANDIDATE');
    const diagnostic = eokbu.result?.patternHandoff
      ? { status: 'OBSERVED_DIRECTIONS_ONLY', eokbuStatus: eokbu.result.status, patternHandoff: eokbu.result.patternHandoff,
        factRefs: [candidatePath + '/eokbu/result/patternHandoff'] }
      : { status: 'NOT_SELECTED', patternHandoff: null, factRefs: [] };
    const availability = result.status === 'COMPETING_RULES' ||
      result.rules.some(rule => rule.status === 'UNRESOLVED') ? 'PARTIAL' : 'AVAILABLE';
    return { candidateRef: candidate.candidateRef, features: {
      patternRules: feature(availability, { ...result, eokbuDiagnostic: diagnostic }, [
        upstreamPath + '/facts/candidates/' + index,
        upstreamPath + '/evidence/candidates/' + index,
        candidatePath + '/pattern/result',
        ...(strength.result ? [candidatePath + '/strength/result'] : []),
      ], ['RULE_CONFORMANCE_ONLY', 'NATAL_SCOPE', 'NO_WHOLE_PATTERN_VERDICT', 'ACTUAL_EFFECT_UNEVALUATED']),
    } };
  });
  const missing = e2.unavailableFeatures.pattern;
  return freeze({ schemaVersion: 'manseryeok-engine-e3-result-v1', track: e2.track, selection: {
    profileId: selection.profileId, version: selection.version, patternRulePolicyId: selection.patternRulePolicyId,
    e2: e2.selection,
  }, status: e2.status, e2, candidates, unavailableFeatures: missing ? {
    patternRules: feature(missing.availability, null, ['/e2/existing/status', '/e2/existing/holds'], missing.limitationCodes),
  } : {} });
}

export async function loadEngineE3({ dataDirectory }) {
  const engine = await loadEngineE2({ dataDirectory });
  return Object.freeze({ calculate(birth, selection) {
    validateE3Selection(selection);
    return project(engine.calculate(birth, selection.e2), selection);
  } });
}
