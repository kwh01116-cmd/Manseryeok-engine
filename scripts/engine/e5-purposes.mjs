import { fiveElementRelation } from '../../dist/domain/tenGods.js';

export const PURPOSE_COMPARISON_POLICY = Object.freeze({
  policyId: 'E5-DISTINCT-PURPOSE-COMPARISON-V01',
  policyVersion: '0.1.0',
});

function unique(values) { return [...new Set(values)]; }

function assessment(purpose, wrapped, fields) {
  return {
    purpose, policyId: wrapped.policyId, policyVersion: wrapped.policyVersion,
    status: fields.status ?? wrapped.availability,
    candidates: fields.candidates ?? [],
    observedPositions: fields.observedPositions ?? [],
    supportingEvidence: fields.supportingEvidence ?? [],
    opposingEvidence: fields.opposingEvidence ?? [],
    unresolvedConditions: fields.unresolvedConditions ?? [],
    sourceRefs: fields.sourceRefs ?? [],
    factRefs: fields.factRefs ?? [],
  };
}

function fromEokbu(wrapped) {
  const value = wrapped.result;
  return assessment('EOKBU', wrapped, !value ? {
    unresolvedConditions: wrapped.limitationCodes,
  } : {
    status: value.status, candidates: value.candidates,
    observedPositions: value.candidates.flatMap(c => [...c.surface, ...c.hidden]),
    supportingEvidence: value.causes, opposingEvidence: value.opposingEvidence,
    unresolvedConditions: value.holdReasons, sourceRefs: value.sourceRefs, factRefs: value.factRefs,
  });
}

function fromPattern(wrapped) {
  const value = wrapped.result;
  const eligible = value.rules.filter(rule =>
    ['STRUCTURAL_POSSIBILITY', 'COMPETING_PATHS'].includes(rule.status) && rule.target !== 'INTERFERENCE');
  const candidates = [...new Map(eligible.map(rule => [rule.patternRef, {
    patternRef: rule.patternRef, patternType: rule.patternType, meaning: 'STRUCTURAL_PATH_ONLY',
  }])).values()];
  return assessment('PATTERN', wrapped, {
    status: value.status, candidates,
    observedPositions: eligible.flatMap(rule => rule.paths.filter(path =>
      ['STRUCTURAL_POSSIBILITY', 'COMPETING_PATHS'].includes(path.structure.status)).map(path => path.observation)),
    supportingEvidence: eligible.map(rule => ({ ruleId: rule.ruleId, patternRef: rule.patternRef })),
    opposingEvidence: value.competingPatternRefs,
    unresolvedConditions: ['WHOLE_PATTERN_EFFECT_UNEVALUATED'],
    sourceRefs: value.sourceRefs, factRefs: value.factRefs,
  });
}

function compareElements(left, right) {
  const both = { left: left.purpose, right: right.purpose };
  const leftElements = unique(left.candidates.map(item => item.element));
  const rightElements = unique(right.candidates.map(item => item.element));
  if (left.status === 'NOT_SELECTED' || right.status === 'NOT_SELECTED') {
    return { ...both, status: 'POLICY_NOT_SELECTED', leftStatus: left.status, rightStatus: right.status };
  }
  if (!leftElements.length || !rightElements.length) {
    return { ...both, status: 'CANDIDATE_COMPARISON_UNAVAILABLE', leftStatus: left.status, rightStatus: right.status };
  }
  const sharedElements = leftElements.filter(element => rightElements.includes(element));
  return { ...both, status: sharedElements.length ? 'SHARED_CANDIDATE_ELEMENT' : 'DISTINCT_CANDIDATE_ELEMENTS',
    leftElements, rightElements, sharedElements, samePurpose: false };
}

/** Only invoked by the E5 adapter with results from a single issued candidate. */
export function projectPurposeComparison(candidateRef, old, modern) {
  const eokbu = fromEokbu(old.eokbu);
  const climate = assessment('CLIMATE', modern.climateAssessmentV2, modern.climateAssessmentV2.result);
  const pattern = fromPattern(modern.patternAssessmentV2);
  const tongguan = assessment('TONGGUAN', modern.tongguanAssessment, modern.tongguanAssessment.result);
  const directions = (old.eokbu.result?.patternHandoff?.directions ?? []).map(direction => ({
    ...direction, hasE5StructurePath: pattern.candidates.some(candidate => candidate.patternRef === direction.patternAssessmentRef),
  }));
  const strength = old.strength.result;
  const balanceDirections = !eokbu.candidates.length || !strength ? [] : climate.candidates.map(({ element }) => {
    const relation = fiveElementRelation(strength.dayMaster.element, element);
    const supportsDayMaster = relation === 'SAME' || relation === 'TARGET_GENERATES_DAY_MASTER';
    return { climateElement: element, eokbuGrade: strength.grade, relation,
      status: (strength.grade === 'STRONG') === supportsDayMaster ?
        'OPPOSING_BALANCE_DIRECTION' : 'CONSISTENT_BALANCE_DIRECTION' };
  });
  return { ...PURPOSE_COMPARISON_POLICY, candidateRef, status: 'SEPARATE_ASSESSMENTS',
    assessments: { EOKBU: eokbu, CLIMATE: climate, PATTERN: pattern, TONGGUAN: tongguan },
    relations: [
      { ...compareElements(eokbu, climate), balanceDirections },
      compareElements(eokbu, tongguan), compareElements(climate, tongguan),
      { left: 'EOKBU', right: 'PATTERN', status: eokbu.status === 'NOT_SELECTED' ? 'POLICY_NOT_SELECTED' :
        directions.length ? 'OBSERVED_DIRECTIONS_ONLY' : 'CANDIDATE_COMPARISON_UNAVAILABLE',
      directions, actualEffect: 'NOT_EVALUATED', changesEokbuRank: false },
    ],
    finalUsefulGod: { status: 'NOT_IMPLEMENTED' },
    favorableUnfavorableRanking: { status: 'NOT_IMPLEMENTED' },
  };
}
