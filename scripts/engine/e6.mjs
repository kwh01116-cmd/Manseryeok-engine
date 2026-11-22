import { E5_SELECTION, hasExactDataFields, loadEngineE5, validateE5Selection } from './e5.mjs';
import { validateApiOnlyServerRequest } from '../server/engine.mjs';
import { loadServerApiOnlyDataPack } from '../server-data/load.mjs';
import { createE6TimeResolver, validateE6Query, validateIssuedE6TimeContext } from './e6-context.mjs';
import { observeE6Relations, diffE6Relations, E6_RELATION_POLICY_ID } from '../../dist/e6/temporalRelationsV1.js';


export const E6_PROFILE_ID = 'ENGINE-PARITY-E6-V01';
export const E6_REQUEST_SCHEMA = 'manseryeok-engine-e6-request-v1';
export const E6_RESULT_SCHEMA = 'manseryeok-engine-e6-result-v1';
export const E6_RELATION_POLICY = E6_RELATION_POLICY_ID;
export const E6_SELECTION = Object.freeze({
  profileId: E6_PROFILE_ID, version: '0.1.0', relationPolicyId: E6_RELATION_POLICY, e5: E5_SELECTION,
});
const maxRows = 8192;
const scopes = Object.freeze({
  relationshipRowsPerResponse: maxRows,
  effects: ['NATAL_RANKING_UNCHANGED', 'ASSOCIATION_ONLY', 'TRANSFORMATION_AND_ROOT_DAMAGE_UNEVALUATED', 'NO_EVENT_PREDICTION'],
  pointerRoots: { projection: 'E6', e5: 'E5', 'e5.e3': 'E3', 'e5.e3.e2': 'E2' },
});

function check(condition, code) { if (!condition) throw new RangeError(code); }

export function e6RelationshipLimit(count) {
  return count > maxRows ? { reasonCode: 'RELATIONSHIP_ROWS', limit: maxRows, actual: count } : null;
}

export function validateE6Request(value) {
  const keys = ['schemaVersion', 'selection', 'birth', 'clockPolicyId', 'query'];
  if (value && Object.hasOwn(value, 'dayun')) keys.push('dayun');
  check(hasExactDataFields(value, keys) && value.schemaVersion === E6_REQUEST_SCHEMA, 'E6_REQUEST_SCHEMA');
  const s = value.selection;
  check(hasExactDataFields(s, Object.keys(E6_SELECTION)) && s.profileId === E6_PROFILE_ID &&
    s.version === E6_SELECTION.version && s.relationPolicyId === E6_RELATION_POLICY, 'E6_EXPLICIT_POLICY_REQUIRED');
  validateE5Selection(s.e5);
  validateApiOnlyServerRequest(value.birth);
  check(!Object.hasOwn(value.birth, 'luckOptions') && !Object.hasOwn(value.birth, 'monthlyOptions'), 'E6_USE_EXPLICIT_QUERY_ONLY');
  validateE6Query(value.query, value.clockPolicyId, value.dayun);
}

function freeze(value) {
  if (value && typeof value === 'object' && !Object.isFrozen(value)) {
    Object.values(value).forEach(freeze);
    Object.freeze(value);
  }
  return value;
}

function compatible(left, right) {
  if (left.asOf === right.asOf) return left.timeContextRef === right.timeContextRef;
  return left.assumptions.every(a => !right.assumptions.some(b => b.boundaryRef === a.boundaryRef && b.side !== a.side));
}

function summarizeAcrossAlternatives(rows, keyFor) {
  if (!rows.length) return { common: [], possible: [] };
  const distinct = new Map();
  for (const list of rows) for (const key of new Set(list.map(keyFor))) {
    distinct.set(key, (distinct.get(key) ?? 0) + 1);
  }
  return {
    common: [...distinct].filter(([, count]) => count === rows.length).map(([key]) => key),
    possible: [...distinct].filter(([, count]) => count !== rows.length).map(([key]) => key),
  };
}

function compareSelection(selection, contexts) {
  const byRef = new Map(contexts.map(value => [value.timeContextRef, value]));
  const comparisons = [];
  for (const leftRef of selection.leftTimeContextRefs) for (const rightRef of selection.rightTimeContextRefs) {
    const left = byRef.get(leftRef), right = byRef.get(rightRef);
    check(left && right, 'E6_UNKNOWN_CONTEXT_REFERENCE');
    if (compatible(left, right)) comparisons.push({
      leftTimeContextRef: leftRef, rightTimeContextRef: rightRef,
      ...diffE6Relations(left.observations, right.observations),
    });
  }
  return {
    status: !comparisons.length ? 'NOT_COMPARABLE' : comparisons.length > 1 ||
      comparisons.some(item => item.status !== 'COMPARED') ? 'PARTIAL' : 'COMPARED',
    alternatives: comparisons,
    pairObservationKeys: Object.fromEntries(['added', 'ended', 'maintained'].map(category => [
      category, summarizeAcrossAlternatives(comparisons.map(item => item[category]), row => row.key),
    ])),
  };
}

function observationSummary(selection, contexts) {
  const contextMap = new Map(contexts.map(context => [context.timeContextRef, context]));
  const describe = refs => {
    const selected = refs.map(ref => {
      const context = contextMap.get(ref);
      check(context, 'E6_UNKNOWN_CONTEXT_REFERENCE');
      return context.observations;
    });
    return {
      pairKeys: summarizeAcrossAlternatives(selected.map(x => x.pairs), row => row.key),
      triadObservations: summarizeAcrossAlternatives(selected.map(x => x.triads), row => row.key + ':' + row.state),
      uninspectedLayers: [...new Set(selected.flatMap(x => x.unavailableLayers))],
    };
  };
  if (selection.kind === 'COMPARE') return {
    from: describe(selection.leftTimeContextRefs), to: describe(selection.rightTimeContextRefs),
  };
  if (selection.kind === 'RANGE') return selection.segments.map(segment => ({
    fromInclusive: segment.fromInclusive, toExclusive: segment.toExclusive, ...describe(segment.timeContextRefs),
  }));
  return describe(selection.timeContextRefs);
}

/** Consumer projection of the already-issued, embedded E5. */
function tongguanDiagnostic(wrapped) {
  const value = wrapped.result;
  const relations = value.routes.map(route => {
    const targets = route.controlTargets.map(positionRef => {
      const paths = route.paths.filter(path => path.chain[2] === positionRef);
      return { positionRef, alternativePaths: paths.length > 1, paths };
    });
    return { from: route.from, to: route.to, mediator: route.mediator, status: route.status,
      targets, interferingObservations: route.opposingEvidence };
  });
  const withPaths = relations.filter(row => row.targets.some(target => target.paths.length > 0));
  return {
    originalStatus: value.status, policyId: wrapped.policyId, policyVersion: wrapped.policyVersion,
    coexistingTargetRelations: withPaths.length > 1,
    distinctTargetPositionCount: new Set(withPaths.flatMap(row => row.targets
      .filter(target => target.paths.length > 0).map(target => target.positionRef))).size,
    alternativesToSameTarget: withPaths.some(row => row.targets.some(target => target.alternativePaths)),
    interferenceObserved: value.opposingEvidence.length > 0,
    necessity: 'NOT_EVALUATED', effect: 'NOT_EVALUATED', relations,
  };
}

function climateDiagnostic(wrapped) {
  const value = wrapped.result;
  return {
    policyId: wrapped.policyId, policyVersion: wrapped.policyVersion,
    coverage: value.coverage, status: value.status, reasonCode: value.reasonCode,
    candidateProposed: value.candidates.length > 0,
    targetObservations: value.targetLocations,
    alternativeStemObservations: value.alternativeStemLocations,
    sufficiency: 'NOT_EVALUATED',
  };
}

function projectE6Candidate(e5, index) {
  const prefix = '/e5/candidates/' + index + '/features/';
  const oldPrefix = '/e5/e3/e2/candidates/' + index + '/features/';
  const current = e5.candidates[index].features, earlier = e5.e3.e2.candidates[index].features;
  const purposes = current.purposeComparison.result.assessments;
  return {
    natalCandidateRef: e5.candidates[index].candidateRef,
    pillars: earlier.chart.result.pillars,
    seasonal: earlier.chart.result.seasonal,
    classifications: earlier.elementsTenGods.result,
    natalFactRefs: [oldPrefix + 'chart/result/pillars', oldPrefix + 'elementsTenGods/result'],
    purposeStatuses: Object.fromEntries(Object.entries(purposes).map(([key, value]) => [key, {
      status: value.status, policyId: value.policyId, policyVersion: value.policyVersion,
      resultRef: prefix + 'purposeComparison/result/assessments/' + key,
    }])),
    diagnostics: {
      tongguan: { ...tongguanDiagnostic(current.tongguanAssessment), factRefs: [prefix + 'tongguanAssessment/result'] },
      climate: { ...climateDiagnostic(current.climateAssessmentV2), factRefs: [prefix + 'climateAssessmentV2/result'] },
    },
  };
}

function project(e5, temporal, request) {
  const existing = e5.e3.e2.existing;
  const base = {
    schemaVersion: E6_RESULT_SCHEMA, selection: structuredClone(request.selection), clockPolicyId: request.clockPolicyId,
    query: structuredClone(request.query), scopes, e5,
    hold: temporal.hold ?? null, hasTimeAlternatives: temporal.hasTimeAlternatives ?? false,
    coverage: {
      birth: { profileId: existing.request.calendarProfileId, status: e5.status,
        resultRef: '/e5/e3/e2/existing/calculation' },
      query: { clockPolicyId: request.clockPolicyId, ...temporal.coverage },
      features: { dayun: 'EXPLICIT_SEX_COUNT_AND_ADOPTED_M7_BIRTH_PROFILE',
        seyun: 'EXISTING_M7_LICHUN', monthly: 'EXISTING_M7_JIE_INTERVALS', natalEffects: 'EXISTING_E5' },
    },
  };
  let relationshipRows = 0;
  const candidates = temporal.candidates.map((candidate, index) => {
    const parent = e5.e3.e2.candidates[index], e5Parent = e5.candidates[index];
    check(parent.candidateRef === candidate.natalCandidateRef && e5Parent.candidateRef === candidate.natalCandidateRef,
      'E6_FOREIGN_NATAL_PARENT');
    const natal = projectE6Candidate(e5, index);
    const pillars = natal.pillars.map((pillar, i) => ({ ...pillar,
      factRefs: ['/e5/e3/e2/candidates/' + index + '/features/chart/result/pillars/' + i],
    }));
    const contexts = candidate.timeContexts.map((context, contextIndex) => {
      validateIssuedE6TimeContext(context, { existing, natalCandidateRef: candidate.natalCandidateRef, clockPolicyId: request.clockPolicyId });
      check(context.natalCandidateRef === candidate.natalCandidateRef, 'E6_FOREIGN_TIME_CONTEXT');
      const positions = context.positions.map(position => ({ ...position, factRefs: [
        ...position.factRefs, '/candidates/' + index + '/timeContexts/' + contextIndex + '/layers/' + position.layer + '/period',
      ] }));
      const observations = observeE6Relations(candidate.natalCandidateRef, pillars, { ...context, positions }, parent);
      relationshipRows += observations.pairs.length + observations.triads.length;
      return { ...context, observations };
    });
    const selection = candidate.selection;
    const comparison = request.query.kind === 'COMPARE' ? compareSelection(selection, contexts) : null;
    for (const delta of comparison?.alternatives ?? []) {
      relationshipRows += delta.added.length + delta.ended.length + delta.maintained.length +
        delta.uncomparable.length + delta.triadChanges.length;
    }
    return { ...natal, timeContexts: contexts, selection, dayunEvidence: candidate.dayunEvidence,
      observationSummary: observationSummary(selection, contexts), comparison };
  });
  const hold = e6RelationshipLimit(relationshipRows);
  if (hold) {
    return freeze({ ...base, status: 'LIMIT_EXCEEDED', limitationCodes: ['E6_RELATIONSHIP_ROW_LIMIT'],
      hold, relationshipRows: 0, candidates: [] });
  }
  return freeze({ ...base, status: temporal.status, limitationCodes: temporal.limitationCodes ?? [],
    relationshipRows, candidates });
}

/** E6 accepts an explicit birth/query request and owns both issuance steps. */
export async function loadEngineE6({ dataDirectory }) {
  const [engine, data] = await Promise.all([loadEngineE5({ dataDirectory }), loadServerApiOnlyDataPack({ directory: dataDirectory })]);
  const time = createE6TimeResolver(data);
  return Object.freeze({ calculate(request) {
    validateE6Request(request);
    const e5 = engine.calculate(request.birth, request.selection.e5);
    const temporal = time.query({ existing: e5.e3.e2.existing, query: request.query,
      clockPolicyId: request.clockPolicyId, dayun: request.dayun });
    return project(e5, temporal, request);
  } });
}
