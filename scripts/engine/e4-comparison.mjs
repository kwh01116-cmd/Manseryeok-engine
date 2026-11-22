import { isDeepStrictEqual } from 'node:util';
import { assessProductStrength, PRODUCT_STRENGTH_POLICY_ID } from '../../dist/e1/productStrengthV1.js';
import { ganZhiIndex } from '../../dist/domain/sexagenary.js';
import { STEM_NATURE } from '../../dist/domain/stems.js';
import { BRANCH_NATURE } from '../../dist/domain/branches.js';
import { tenGod } from '../../dist/domain/tenGods.js';
import { hiddenStemsForBranch, HIDDEN_STEM_POLICY_V1 } from '../../dist/domain/hiddenStems.js';
import { twelveGrowthStage, TWELVE_GROWTH_POLICY_V1 } from '../../dist/domain/twelveGrowthStages.js';
import { collectFourPillarBranchRelations, BRANCH_RELATIONS_POLICY_V1 } from '../../dist/domain/branchRelations.js';
import { collectFourPillarTriadMemberships, TRIAD_MEMBERSHIP_POLICY_V1 } from '../../dist/domain/triadMemberships.js';
import { areStemCombinationPartners } from '../../dist/domain/stemCombinations.js';
import { E3_SELECTION, validateE3Selection } from './e3.mjs';
import { validateApiOnlyServerRequest } from '../server/engine.mjs';
import { compareStrengthDiagnostics } from './e4-strength.mjs';

export const COMPARISON_POLICY = Object.freeze({ policyId:'E4-ENGINE-COMPARISON-V01', policyVersion:'0.1.0' });
const roles = ['year','month','day','hour'];
const elements = ['WOOD','FIRE','EARTH','METAL','WATER'];
const fields = ['pillars','elements','visibleTenGods','hiddenStems','twelveGrowth','relations','strength','yongshin','pattern'];
const explicitClock = 'KR_API_PUBLISHED_KST_MODERN_1988_POST_DST_V1';
const profile = 'kasi-api-1989-2026-local-v1';

function requireValue(ok, code) {
  if (!ok) throw new RangeError(code);
}
function validPillars(pillars) {
  return Array.isArray(pillars) && pillars.length === 4 &&
    [...pillars].every(p => typeof p === 'string' && p.length === 2 && ganZhiIndex(p[0],p[1]) !== null);
}
const unique = input => [...new Set(input)].sort();
const knownReference = row => Boolean(row.source?.provider && row.source?.referenceKind &&
  /^\d{4}-\d\d-\d\d$/.test(row.source?.checkedAt ?? '') &&
  typeof row.source?.url === 'string' && /^https:\/\//.test(row.source.url));
const memberKey = (kind, a, b, aGlyph, bGlyph) => [kind,roles[a],roles[b],aGlyph+bGlyph].join(':');

function partialSanheKeys(branches, groups) {
  const rows=[];
  for (const [i,branch] of branches.entries()) for (let j=i+1;j<branches.length;j++) {
    if (branch!==branches[j] && groups.some(g => g.family==='SANHE' && g.status==='TWO_DISTINCT_MEMBERS' &&
      g.members.some(m=>m.pillarIndices.includes(i)) && g.members.some(m=>m.pillarIndices.includes(j)))) {
      rows.push(memberKey('SANHE_PARTIAL',i,j,branch,branches[j]));
    }
  }
  return rows;
}

function referenceBirth(birth) {
  if (!birth) return null;
  const calendarProfileId = birth.profileId ?? birth.calendarProfileId;
  if (!calendarProfileId && (birth.calendar !== 'GREGORIAN' || !/^(19(89|9\d)|20([01]\d|2[0-6]))-/.test(birth.date ?? '') ||
    !['서울','대한민국','SEOUL','KR'].includes(birth.place))) return null;
  const dto = {
    schemaVersion:'manseryeok-server-analysis-request-v1', analysisProfileId:'KASI-SERVER-API-ONLY-ANALYSIS-V01',
    calendarProfileId:calendarProfileId ?? profile, jurisdiction:'KR', timeZone:'Asia/Seoul',
    calendar:birth.calendar, ...(birth.calendar === 'KOREAN_LUNAR' ? {lunarDate:birth.lunarDate} : {date:birth.date}), time:birth.time,
    policies:birth.policies ?? {clockPolicyId:explicitClock,dayRollover:'CIVIL_MIDNIGHT',hourStemReference:'SELECTED_DAY_PILLAR'},
  };
  validateApiOnlyServerRequest(dto);
  return dto;
}

/** Direct glyph review only. No dated or externally issued chart is constructed. */
function directView(glyphs) {
  const stems = glyphs.map(p => p[0]), branches = glyphs.map(p => p[1]), day = stems[2];
  const tally = Object.fromEntries(elements.map(e => [e,0]));
  for (const s of stems) tally[STEM_NATURE[s].element]++;
  for (const b of branches) tally[BRANCH_NATURE[b].principalElement]++;
  const relations = collectFourPillarBranchRelations(branches,BRANCH_RELATIONS_POLICY_V1).map(row =>
    memberKey(row.kind,row.leftPillarIndex,row.rightPillarIndex,row.leftBranch,row.rightBranch));
  relations.push(...partialSanheKeys(branches,collectFourPillarTriadMemberships(branches,TRIAD_MEMBERSHIP_POLICY_V1)));
  for (const [i,s] of stems.entries()) for (let j=i+1; j<stems.length; j++) {
    if (areStemCombinationPartners(s,stems[j])) relations.push(memberKey('STEM_COMBINATION',i,j,s,stems[j]));
  }
  return { pillars:glyphs, elements:tally, relations:unique(relations),
    visibleTenGods:stems.map((s,i) => i===2 ? null : tenGod(day,s)),
    hiddenStems:branches.map(b => hiddenStemsForBranch(b,HIDDEN_STEM_POLICY_V1).map(m => m.stem)),
    twelveGrowth:branches.map(b => twelveGrowthStage(day,b,TWELVE_GROWTH_POLICY_V1).stage),
  };
}

function comparisonField(field, external, internal, scope, evidence) {
  let classification, reason, matchedPositions, differences;
  if (external === undefined) {
    classification = 'NO_REFERENCE'; reason = 'FIELD_NOT_PUBLISHED';
  } else if (!scope || internal === undefined) {
    classification = 'NOT_COMPARABLE'; reason = internal === undefined ? 'INTERNAL_SCOPE_UNAVAILABLE' : scope;
  } else {
    let matches;
    if (['visibleTenGods','hiddenStems','twelveGrowth'].includes(field)) {
      matchedPositions = []; differences = [];
      external.forEach((value,index) => {
        if (value === null) return;
        const actual = internal[index];
        const equal = field === 'hiddenStems' ? isDeepStrictEqual(unique(value),unique(actual)) : value===actual;
        if (equal) matchedPositions.push(roles[index]);
        else differences.push({position:roles[index],external:value,internal:actual});
      });
      if (matchedPositions.length + differences.length === 0)
        return {field,classification:'INSUFFICIENT_REFERENCE',reason:'NO_PUBLISHED_POSITIONS',scope:'REPORTED_POSITIONS'};
      matches = differences.length === 0;
    } else if (field === 'relations') {
      // External lists may be excerpts. Compare the asserted observations only.
      differences = external.filter(value => !internal.includes(value));
      matches = differences.length === 0;
    } else if (field === 'strength') matches = external.direction === internal.grade;
    else if (field === 'yongshin') matches = isDeepStrictEqual(unique(external.elements),unique(internal.elements));
    else if (field === 'pattern') matches = isDeepStrictEqual(unique(external.types),unique(internal.types));
    else matches = isDeepStrictEqual(external,internal);
    classification = matches ? 'MATCH' : evidence?.reason && evidence?.ref ? 'POLICY_DIFFERENCE' : 'UNEXPLAINED_DISAGREEMENT';
    reason = matches ? 'COMPARABLE_VALUES_AGREE' : classification === 'POLICY_DIFFERENCE' ?
      'DOCUMENTED_FIELD_SPECIFIC_POLICY' : 'PUBLIC_EVIDENCE_DOES_NOT_EXPLAIN_DIFFERENCE';
  }
  return {field,classification,reason,scope:scope || null,
    ...(external===undefined?{}:{external}), ...(internal===undefined?{}:{internal}),
    ...(matchedPositions?{matchedPositions}:{}), ...(differences?{differences}:{}),
    ...(classification==='POLICY_DIFFERENCE'?{evidence}:{}),
  };
}

function verifyCorpusRow(row) {
  requireValue(row && typeof row.caseId === 'string' && validPillars(row.input?.pillars), 'E4_REFERENCE_INPUT_REQUIRED');
  const external = row.external ?? {};
  requireValue(Object.keys(external).every(k=>fields.includes(k)), 'E4_REFERENCE_FIELD');
  if (Object.hasOwn(external,'pillars')) requireValue(validPillars(external.pillars) &&
    isDeepStrictEqual(row.input.pillars,external.pillars), 'E4_REFERENCE_PILLARS_CONFLICT');
  for (const name of ['visibleTenGods','twelveGrowth','hiddenStems']) {
    if (!Object.hasOwn(external,name)) continue;
    const list = external[name];
    requireValue(Array.isArray(list) && list.length === 4 && [...list].every(value => value === null ||
      (name==='hiddenStems' ? Array.isArray(value) && [...value].every(s => Object.hasOwn(STEM_NATURE,s)) : typeof value==='string')),
    'E4_POSITIONAL_REFERENCE');
  }
  if (Object.hasOwn(external,'relations')) requireValue(Array.isArray(external.relations) && external.relations.every(v=>typeof v==='string'), 'E4_RELATION_REFERENCE');
  if (Object.hasOwn(external,'strength')) requireValue(
    ['WEAK','STRONG','BALANCED_OR_BOUNDARY','UNMAPPED'].includes(external.strength?.direction), 'E4_DIRECTION_REQUIRES_EXPLICIT_MAPPING');
  if (Object.hasOwn(external,'yongshin')) requireValue(Array.isArray(external.yongshin?.elements) &&
    external.yongshin.elements.every(e=>elements.includes(e)), 'E4_YONGSHIN_REFERENCE');
  if (Object.hasOwn(external,'pattern')) requireValue(Array.isArray(external.pattern?.types) &&
    external.pattern.types.every(s=>typeof s==='string'), 'E4_PATTERN_REFERENCE');
  for (const [field,evidence] of Object.entries(row.externalPolicyKnownFields?.differenceEvidence??{})) {
    requireValue(fields.includes(field) && typeof evidence?.reason === 'string' && evidence.reason.length>0 &&
      row.evidenceRefs?.includes(evidence.ref) &&
      (field!=='pillars' || validPillars(evidence.internalPillars)), 'E4_DIFFERENCE_EVIDENCE_REQUIRED');
  }
}

const candidateKey = candidate => candidate.pillars.map(p => p.stem+p.branch);
function datedResult(engine, request) {
  if (!request) return null;
  requireValue(engine && typeof engine.calculate === 'function', 'E4_DATA_PACK_REQUIRED_FOR_BIRTH');
  const result = engine.calculate(request,E3_SELECTION);
  return { result, candidates:result.e2.existing.candidates.map(candidate=>({candidateRef:candidate.id,pillars:candidateKey(candidate)})) };
}
function chosenFeatures(dated, externalPillars) {
  const selected = dated?.candidates.filter(c=>isDeepStrictEqual(c.pillars,externalPillars)) ?? [];
  if (selected.length !== 1) return null;
  const id = selected[0].candidateRef;
  const features = dated.result.e2.candidates.find(c=>c.candidateRef===id)?.features;
  const rules=dated.result.candidates.find(c=>c.candidateRef===id)?.features.patternRules.result;
  requireValue(features && rules?.candidateRef===id && features.strength.result?.candidateRef===id &&
    isDeepStrictEqual(candidateKey(features.chart.result),externalPillars),'E4_FOREIGN_CANDIDATE');
  return { id, features };
}

function datedView(glyphs, features) {
  const cells=features.elementsTenGods.result;
  const relations=features.relations.result;
  const tally=Object.fromEntries(elements.map(e => [e,0]));
  for (const row of cells) {
    tally[row.stemNature.element]++;
    tally[row.branchNature.principalElement]++;
  }
  const stemPairs=relations.stemPairs.map(row=>['STEM_COMBINATION',row.leftRole,row.rightRole,row.leftStem+row.rightStem].join(':'));
  const branchPairs=relations.branchPairs.map(row=>memberKey(row.kind,row.leftPillarIndex,row.rightPillarIndex,row.leftBranch,row.rightBranch));
  return { pillars:glyphs,elements:tally,visibleTenGods:cells.map(c=>c.visibleTenGod),
    hiddenStems:features.hiddenStems.result.map(c=>c.members.map(m=>m.stem)),
    twelveGrowth:features.twelveStages.result.natal.map(c=>c.stage),
    relations:unique([...stemPairs,...branchPairs,...partialSanheKeys(glyphs.map(p=>p[1]),relations.triads)]),
  };
}

export function compareCommercialCase(row, engine) {
  verifyCorpusRow(row);
  const external = row.external ?? {};
  const input = row.input.pillars;
  const matchesLiteral = external.pillars && isDeepStrictEqual(input,external.pillars);
  const sourced = knownReference(row);
  const request = sourced ? referenceBirth(row.input.birth) : null;
  const dated = datedResult(engine,request);
  const selected = chosenFeatures(dated,external.pillars);
  const view = selected ? datedView(input,selected.features) :
    sourced && !row.input.birth && matchesLiteral ? directView(input) : null;
  // Reference glyphs are isolated from engine-issued candidates. Direct score
  // evaluation creates an audit scratch identity and serves no pattern input.
  const diagnostics = view ? compareStrengthDiagnostics(input) : null;
  const runtime = view ? selected?.features.strength.result ?? assessProductStrength({
    candidateRef:'chart.candidates[0]', pillars:input.map((p,i)=>({
      role:roles[i],stem:p[0],branch:p[1],factRef:'facts.candidates[0].pillars['+i+']',
    })),
  },{policyId:PRODUCT_STRENGTH_POLICY_ID}) : null;
  const f = selected?.features;
  const eokbu = f?.eokbu.result;
  const internal = { ...view, ...(runtime?{strength:{grade:runtime.grade,supportUnits:runtime.score.supportUnits,
    totalUnits:runtime.score.totalUnits,scale:runtime.score.scale}}:{}),
    ...(eokbu && eokbu.status!=='HOLD'?{yongshin:{purpose:'EOKBU',elements:eokbu.candidates.map(c=>c.element)}}:{}),
    ...(f?.pattern.result?{pattern:{scope:'MONTHLY_CANDIDATE',types:f.pattern.result.selection.candidateTypes}}:{}) };
  const scope = view ? 'SAME_FOUR_PILLARS' : null;
  const explanations = row.externalPolicyKnownFields?.differenceEvidence;
  const report = fields.map(field=>{
    const evidence = explanations?.[field];
    if (!sourced) return {field,classification:external[field]===undefined?'NO_REFERENCE':'INSUFFICIENT_REFERENCE',
      reason:'SOURCE_NOT_VERIFIED_IN_RECORD'};
    if (field === 'pillars') {
      if (external.pillars === undefined) return {field,classification:'NO_REFERENCE',reason:'FOUR_PILLARS_NOT_PUBLISHED'};
      if (!row.input.birth) return {field,classification:'NOT_COMPARABLE',reason:'PUBLICATION_HAS_PILLARS_ONLY',
        publishedPillars:external.pillars};
      if (!dated || dated.candidates.length===0) return {field,classification:'NOT_COMPARABLE',reason:'BIRTH_POLICY_OR_DATA_UNAVAILABLE'};
      if (selected) return {field,classification:'MATCH',reason:dated.candidates.length===1?'SAME_GLYPHS':'MATCH_IS_ONE_INTERNAL_BOUNDARY_CANDIDATE'};
      const explained = dated.candidates.length===1 && isDeepStrictEqual(evidence?.internalPillars,dated.candidates[0].pillars);
      return {field,classification:explained?'POLICY_DIFFERENCE':'UNEXPLAINED_DISAGREEMENT',
        reason:explained?'DOCUMENTED_POLICY_VARIANT_REPRODUCED':'BIRTH_RESULTS_DIFFER_AND_POLICY_ALIGNMENT_UNVERIFIED',
        ...(explained?{evidence}:{}), external:external.pillars};
    }
    if (external[field] === undefined) return comparisonField(field,undefined,internal[field],scope,evidence);
    if (!scope) return {field,classification:'NOT_COMPARABLE',reason:'NO_MATCHING_INTERNAL_CHART'};
    if (field === 'strength' && !['WEAK','STRONG'].includes(external.strength?.direction))
      return {field,classification:'NOT_COMPARABLE',reason:'BOUNDARY_OR_UNMAPPED_DIRECTION',external:external.strength,internal:internal.strength};
    if (field === 'yongshin' && external.yongshin?.purpose !== 'EOKBU')
      return {field,classification:'NOT_COMPARABLE',reason:'EXTERNAL_YONGSHIN_PURPOSE_NOT_ALIGNED'};
    if (field === 'pattern' && external.pattern?.scope !== 'MONTHLY_CANDIDATE')
      return {field,classification:'NOT_COMPARABLE',reason:'TRADITIONAL_FORMATION_AND_MONTHLY_CANDIDATE_DIFFER'};
    const outcome=comparisonField(field,external[field],internal[field],scope,evidence);
    if (field==='strength') return {...outcome,directionComparison:internal.strength.grade==='BORDERLINE'?
      'INTERNAL_POLICY_BOUNDARY':outcome.classification==='MATCH'?'SAME_DIRECTION':'OPPOSITE_DIRECTIONS'};
    return outcome;
  });
  if (runtime && diagnostics && (runtime.grade !== diagnostics.baseline.grade ||
    runtime.score.supportUnits !== diagnostics.baseline.supportUnits ||
    !isDeepStrictEqual(runtime.roleUnits,diagnostics.baseline.roleUnits))) {
    report.push({field:'e1Implementation',classification:'IMPLEMENTATION_DEFECT',
      reason:'INDEPENDENT_FIXED_POLICY_ARITHMETIC_MISMATCH',
      runtime:{grade:runtime.grade,roleUnits:runtime.roleUnits,supportUnits:runtime.score.supportUnits},
      oracle:{grade:diagnostics.baseline.grade,roleUnits:diagnostics.baseline.roleUnits,supportUnits:diagnostics.baseline.supportUnits}});
  }
  return {caseId:row.caseId,source:row.source??null,input:row.input,evidenceRefs:row.evidenceRefs??[],
    externalPolicyKnownFields:row.externalPolicyKnownFields??{},internalPolicy:{...COMPARISON_POLICY, clock:request?.policies??null,
      hiddenStems:HIDDEN_STEM_POLICY_V1,twelveGrowth:TWELVE_GROWTH_POLICY_V1,strength:runtime?{
        policyId:runtime.policyId,policyVersion:runtime.policyVersion}:null},
    chartAlignment:dated?{status:dated.result.status,candidates:dated.candidates,selectedCandidateRef:selected?.id??null}:null,
    diagnostics,comparableFields:report.filter(r=>['MATCH','POLICY_DIFFERENCE','UNEXPLAINED_DISAGREEMENT'].includes(r.classification)).map(r=>r.field),
    matchedFacts:report.filter(r=>r.classification==='MATCH').map(r=>r.field),
    unresolvedDifferences:report.filter(r=>r.classification==='UNEXPLAINED_DISAGREEMENT').map(r=>r.field),
    suspectedDefects:report.filter(r=>r.classification==='IMPLEMENTATION_DEFECT').map(r=>r.field),differences:report,
    conclusion:report.some(r=>r.classification==='IMPLEMENTATION_DEFECT')?'IMPLEMENTATION_DEFECT':
      report.some(r=>r.classification==='UNEXPLAINED_DISAGREEMENT')?'UNEXPLAINED_DISAGREEMENT':
      report.some(r=>r.classification==='MATCH')?'COMPARABLE_FIELDS_EVALUATED':'INSUFFICIENT_REFERENCE'};
}

export function compareCommercialCorpus(corpus, engine) {
  requireValue(corpus?.schemaVersion==='engine-comparison-commercial-corpus-v1' && Array.isArray(corpus.cases) &&
    corpus.cases.length>0 && new Set(corpus.cases.map(row=>row?.caseId)).size===corpus.cases.length,'E4_CORPUS_CONTRACT');
  const cases = corpus.cases.map(row=>compareCommercialCase(row,engine));
  const totals = {};
  for (const row of cases) for (const item of row.differences) {
    const byField = totals[item.field] ??= {};
    byField[item.classification] = (byField[item.classification] ?? 0)+1;
  }
  return {schemaVersion:'engine-e4-comparison-result-v1',...COMPARISON_POLICY,caseCount:cases.length,totals,cases};
}

export function compareBirthPolicies(engine, left, right, selection=E3_SELECTION) {
  validateE3Selection(selection);
  for (const request of [left,right]) validateApiOnlyServerRequest(request);
  const replay = request => {
    const result = engine.calculate(request,selection);
    const normalized=result.e2.existing.calculation?.input;
    return { status:result.status, holds:result.e2.existing.holds,
      normalizedBirth: normalized?.gregorianDate ? {date:normalized.gregorianDate,time:normalized.time} : null,
      candidates:result.e2.existing.candidates.map(candidate=>{
        const view = result.e2.candidates.find(value=>value.candidateRef===candidate.id);
        const rules = result.candidates.find(value=>value.candidateRef===candidate.id);
        requireValue(view && rules,'E4_FOREIGN_CANDIDATE');
        return { candidateRef:candidate.id, pillars:candidateKey(candidate),
          seasonal:view.features.chart.result.seasonal, strength:view.features.strength.result?.grade??null,
          patternRuleState:rules.features.patternRules.result.status };
      }),
    };
  };
  const a = replay(left), b = replay(right);
  const leftPillars = a.candidates.map(row=>row.pillars.join('')).sort();
  const rightPillars = b.candidates.map(row=>row.pillars.join('')).sort();
  const sameBirth = a.normalizedBirth !== null && isDeepStrictEqual(a.normalizedBirth,b.normalizedBirth);
  const selectedPoliciesDiffer = !isDeepStrictEqual(left.policies,right.policies) ||
    left.calendarProfileId !== right.calendarProfileId;
  const classification = !sameBirth || !leftPillars.length || !rightPillars.length ? 'NOT_COMPARABLE' :
    isDeepStrictEqual(leftPillars,rightPillars) ? 'MATCH' :
      selectedPoliciesDiffer ? 'POLICY_DIFFERENCE' : 'IMPLEMENTATION_DEFECT';
  return {schemaVersion:'engine-e4-birth-policy-comparison-v1',...COMPARISON_POLICY,selection,
    left:{input:left,...a},right:{input:right,...b},classification,
    sameBirth,selectedPoliciesDiffer,calendarFormatDiffer:left.calendar!==right.calendar,
    scope:'LOCAL_CANDIDATE_PILLAR_MULTISET'};
}
