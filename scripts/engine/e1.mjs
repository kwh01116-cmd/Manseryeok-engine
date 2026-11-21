/** Explicit engine-only projection over a same-process, issued server calculation. */
import {loadApiOnlyServerEngine, validateApiOnlyServerResult} from '../server/engine.mjs';
import {M4_INNER_PATTERN_PROFILE_ID, M4_INNER_PATTERN_VERSION} from '../../dist/m4/innerPatternsV1.js';
import {PRODUCT_STRENGTH_POLICY_ID, PRODUCT_STRENGTH_VERSION, assessProductStrength} from '../../dist/e1/productStrengthV1.js';
import {EOKBU_POLICY_ID, EOKBU_VERSION, deriveEokbuCandidate} from '../../dist/e1/eokbuCandidateV1.js';

export const E1_SELECTION = Object.freeze({
  profileId: 'ENGINE-PARITY-E1-V01', version: '0.1.0',
  strengthPolicyId: PRODUCT_STRENGTH_POLICY_ID, eokbuPolicyId: EOKBU_POLICY_ID,
  innerPatternProfileId: M4_INNER_PATTERN_PROFILE_ID,
});

export function validateE1Selection(selection) {
  if (!selection || ![Object.prototype, null].includes(Object.getPrototypeOf(selection))
      || Reflect.ownKeys(selection).length !== Object.keys(E1_SELECTION).length
      || !Object.entries(E1_SELECTION).every(([key,value]) => {
        const d = Object.getOwnPropertyDescriptor(selection, key);
        return d && d.enumerable && 'value' in d && d.value === value;
      })) throw new RangeError('EXPLICIT_E1_POLICY_BUNDLE_REQUIRED');
}

// Verify policy rows against the issued chart, including the exact hidden member
// locator. A future M2 table or position change must not silently alter E1 traces.
function checkLocationSources(parent, assessment) {
  const facts = new Map(parent.facts.map(f => [f.id,f]));
  for (const row of assessment.weightedComponents) {
    const fact = facts.get(row.sourceFactId);
    const member = row.kind === 'HIDDEN'
      ? fact?.value.members?.find(m => m.memberRef === row.factRef)
      : fact?.value;
    if (fact?.candidateRef !== parent.id || fact.value.role !== row.role
        || !member || member.stem !== row.stem || member.tenGod !== row.tenGod
        || (row.kind === 'HIDDEN' && member.position !== row.position)) {
      throw new RangeError('E1_ISSUED_M2_LOCATION_MISMATCH');
    }
  }
  for (const r of assessment.competingConditions.branchPairs) {
    const f = facts.get(r.factRef);
    if (f?.candidateRef !== parent.id || f.kind !== 'BRANCH_RELATION' ||
        !['kind','orientation','ruleId','leftBranch','rightBranch','leftPillarIndex','rightPillarIndex']
          .every(k => f.value[k] === r[k])) throw new RangeError('E1_ISSUED_M2_RELATION_MISMATCH');
  }
  for (const r of assessment.competingConditions.triadMemberships) {
    const f = facts.get(r.factRef);
    if (f?.candidateRef !== parent.id || f.kind !== 'TRIAD_MEMBERSHIP' ||
        !['definitionId','status','partialKind'].every(k => f.value[k] === r[k]) ||
        !r.members.every((m,i) => m.branch === f.value.members[i]?.branch &&
          JSON.stringify(m.pillarIndices) === JSON.stringify(f.value.members[i].pillarIndices))) {
      throw new RangeError('E1_ISSUED_M2_TRIAD_MISMATCH');
    }
  }
}

export function projectEngineE1(existing, selection) {
  validateE1Selection(selection);
  validateApiOnlyServerResult(existing);
  const data = existing.analysisData;
  const candidates = [];
  if (data) {
    const upstream = data.base?.existing ?? data;
    const innerPatterns = data.base?.innerPatterns ?? data.innerPatterns;
    const climateIssued = data.m5.execution !== 'NOT_EXECUTED_CLOCK_SCOPE_DEPENDENCY';
    const {facts,evidence} = upstream;
    const context = {m2Facts:facts, evidence, innerPatterns, ...(climateIssued
      ? {climate:data.m5} : {climateUnavailableReason:'ORIGINAL_SILI_CLOCK_DEPENDENCY_NOT_EXTENDED'})};
    for (const [i, c] of facts.candidates.entries()) {
      const pillars = c.pillars.map((p, j) => ({
        role:p.role, stem:p.stem, branch:p.branch, factRef:`facts.candidates[${i}].pillars[${j}]`,
      }));
      const strengthAssessment = assessProductStrength({candidateRef:c.id,pillars}, {policyId:selection.strengthPolicyId});
      checkLocationSources(c,strengthAssessment);
      const eokbuCandidate = deriveEokbuCandidate(strengthAssessment,{profileId:selection.eokbuPolicyId,context});
      candidates.push(Object.freeze({
        candidateRef:c.id, pillars:c.pillars, strengthAssessment, eokbuCandidate,
        pattern:innerPatterns.candidates[i], climate:data.m5.candidates[i],
        pillarFactRefs:Object.freeze(c.facts.filter(f=>f.kind==='PILLAR_NATURE').map(f=>f.id)),
        seasonalEvidenceRef:`existing.analysisData.${data.base?'base.existing.':''}seasonal.candidates[${i}]`,
      }));
    }
  }
  return Object.freeze({
    schemaVersion:'manseryeok-engine-e1-result-v1', track:'ENGINE-PARITY-TRACK-V1',
    selection:E1_SELECTION, policyVersions:Object.freeze({strength:PRODUCT_STRENGTH_VERSION, eokbu:EOKBU_VERSION, innerPattern:M4_INNER_PATTERN_VERSION}),
    status:existing.status, existing, candidates:Object.freeze(candidates), holds:existing.holds,
    factReferenceBase:data?.base?'existing.analysisData.base.existing':'existing.analysisData',
    conditionals:existing.conditionals ?? Object.freeze([]),
    purposeScope:Object.freeze({EOKBU:'SELECTED_E1',CLIMATE:'EXISTING_M5_SCOPE',PATTERN:'STRUCTURE_ONLY',MEDIATION:'NOT_IMPLEMENTED'}),
  });
}

export async function loadEngineE1({dataDirectory}) {
  const engine = await loadApiOnlyServerEngine({dataDirectory});
  return Object.freeze({calculate(request,selection) {
    validateE1Selection(selection);
    return projectEngineE1(engine.calculate(request),selection);
  }});
}
