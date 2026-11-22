/** Development-only literal-pillar replay. No external output can authorize a natal calculation. */
import assert from 'node:assert/strict';
import {resolve} from 'node:path';
import {pathToFileURL} from 'node:url';
import {structuralM2Unit} from '../../test/fixtures/m3-structural-unit-input.mjs';
import {LITERATURE_CASES,LITERATURE_REVISION,NCC} from '../../test/fixtures/e4-literature-cases-v1.mjs';
import {deriveM3Evidence,M3_EVIDENCE_PROFILE_ID} from '../../dist/m3/structuralEvidenceV1.js';
import {deriveM4InnerPatterns,M4_INNER_PATTERN_PROFILE_ID} from '../../dist/m4/innerPatternsV1.js';
import {evaluatePatternRulesV1,PATTERN_RULES_POLICY_ID,PATTERN_RULES_VERSION} from '../../dist/e3/patternRulesV1.js';
import {assessProductStrength,PRODUCT_STRENGTH_POLICY_ID} from '../../dist/e1/productStrengthV1.js';

const termByBranch = Object.freeze({
  子:'DAXUE',丑:'XIAOHAN',寅:'LICHUN',卯:'JINGZHE',辰:'QINGMING',巳:'LIXIA',
  午:'MANGZHONG',未:'XIAOSHU',申:'LIQIU',酉:'BAILU',戌:'HANLU',亥:'LIDONG',
});
const basePolicy = Object.freeze({policyId:PATTERN_RULES_POLICY_ID,policyVersion:PATTERN_RULES_VERSION});
const roleOrder = ['year','month','day','hour'];
const directPartners = Object.freeze({
  OFFICER_RESOURCE_SUPPORT:['正印','偏印'],OFFICER_HURT_PRESSURE:['傷官'],
  OFFICER_RESOURCE_RESCUE:['正印','偏印','傷官'],WEALTH_FOOD_FORMATION:['食神'],WEALTH_ROBBER_PRESSURE:['劫財'],
  WEALTH_FOOD_RESCUE:['劫財','食神'],KILLINGS_FOOD_CONTROL:['食神'],
  KILLINGS_RESOURCE_INTERFERENCE:['食神'],KILLINGS_RESOURCE_ROUTE:['正印','偏印'],
});
const isStrengthCondition = (conditionId) => conditionId === 'E1_DIRECTION_WEAK' || conditionId === 'E1_DIRECTION_STRONG';
const conditionStress = [
  ['OMIT_EXACT_ROOT_GATE', id => id === 'EXACT_HIDDEN_ROOT'],
  ['OMIT_DIRECT_CLASH_HOLD', id => id === 'ROOT_BRANCH_CLASH_EFFECT'],
  ['OMIT_STEM_PAIR_HOLD', id => id === 'RELATED_STEM_COMBINATION_EFFECT'],
  ['OMIT_E1_GATE', isStrengthCondition],
];

function gateDiagnostic(rule) {
  return conditionStress.flatMap(([probe,omit]) => {
    const affected = rule.paths.filter(path =>
      path.conditions.some(entry => omit(entry.conditionId) && entry.value !== 'TRUE') &&
      path.conditions.filter(entry => !omit(entry.conditionId)).every(entry => entry.value === 'TRUE'));
    return affected.length ? [{probe,positions:affected.map(path => ({
      anchor:path.anchor.locationRef,
      partners:path.locations.map(location => location.locationRef),
    }))}] : [];
  });
}

/** Isolated distance exercise. Reports reachable initial pairs, with all other gates outside this diagnostic. */
function distanceDiagnostic(rule, candidate) {
  const wanted = directPartners[rule.ruleId];
  const anchors = new Map(rule.paths.map(path => [path.anchor.locationRef,path.anchor]));
  return [...anchors.values()].flatMap(anchor => candidate.pillars.filter(pillar => wanted.includes(pillar.visibleTenGod))
    .map(pillar => ({
      anchor:anchor.locationRef,
      partnerRole:pillar.role,
      partnerGod:pillar.visibleTenGod,
      gap:Math.abs(roleOrder.indexOf(anchor.role)-roleOrder.indexOf(pillar.role)),
    })).filter(row => row.gap > 1));
}

/** Tighten only the first pair to its own pillar. This can exclude existing
 * satisfied paths. Actual outcomes with other combinations remain unassessed. */
function samePillarOnlyDiagnostic(rule) {
  const partners = directPartners[rule.ruleId];
  const satisfied = rule.paths.filter(path => path.status === 'RULE_SATISFIED');
  const removed = satisfied.filter(path => path.locations.some(location =>
    partners.includes(location.tenGod) && location.role !== path.anchor.role));
  return {satisfiedPaths:satisfied.length,excludedPaths:removed.length,
    everySatisfiedPathExcluded:removed.length>0 && removed.length===satisfied.length};
}

function evaluateOne(reference) {
  const { id, chapter, layer, locator, claim, pillars } = reference;
  const source={chapter,layer,locator,url:NCC[chapter]};
  if (!pillars) return {id,source,claim,replay:'NO_REFERENCE_FOR_FULL_REPLAY',knownInput:reference.literalInput,
    reason:reference.reason};
  const m2=structuralM2Unit([pillars],{monthTerms:[termByBranch[pillars[1][1]]]});
  const evidence=deriveM3Evidence(m2,{policyId:M3_EVIDENCE_PROFILE_ID});
  const inner=deriveM4InnerPatterns(evidence,{profileId:M4_INNER_PATTERN_PROFILE_ID,m2Facts:m2});
  const candidate=m2.candidates[0];
  const strength=assessProductStrength({candidateRef:candidate.id,pillars:candidate.pillars.map((p,index)=>({
    role:p.role,stem:p.stem,branch:p.branch,factRef:`facts.candidates[0].pillars[${index}]`,
  }))},{policyId:PRODUCT_STRENGTH_POLICY_ID});
  const result=evaluatePatternRulesV1(inner,evidence,m2,0,{...basePolicy,strength});
  const withoutE1=evaluatePatternRulesV1(inner,evidence,m2,0,basePolicy);
  const tenGods=Object.fromEntries(candidate.pillars.filter(p=>p.role!=='day').map(p=>[p.role,p.visibleTenGod]));
  const literalChecks=Object.entries(reference.visible).map(([role,expected])=>({field:'VISIBLE_TEN_GOD',role,
    expected,actual:tenGods[role],status:tenGods[role]===expected?'MATCH':'IMPLEMENTATION_DEFECT'}));
  const rules=result.rules.map((rule,index)=>{
    const counterpart=withoutE1.rules[index];
    assert.equal(rule.ruleId,counterpart.ruleId);
    assert.equal(rule.patternRef,counterpart.patternRef);
    if (!rule.strengthDependency) assert.deepEqual(rule,counterpart,id+' independent rule with E1 off');
    return {ruleId:rule.ruleId,patternType:rule.patternType,patternRef:rule.patternRef,
      target:rule.target,status:rule.status,withoutE1:counterpart.status,holdReasons:rule.holdReasons,
      sourceRefs:rule.sourceRefs,strengthDependency:rule.strengthDependency,
      conditions:rule.conditions,paths:rule.paths.map(path=>({
        anchor:path.anchor,locations:path.locations,status:path.status,conditions:path.conditions,
      })),
      singleGateOmissions:gateDiagnostic(rule),
      remotePairsInDistanceStress:distanceDiagnostic(rule,candidate),
      samePillarOnlyStress:samePillarOnlyDiagnostic(rule),
    };
  });
  const focus=rules.filter(rule=>rule.ruleId===reference.focus);
  return {id,source,pillars,claim,focusRule:reference.focus,replay:'STRUCTURAL_PILLAR_REPLAY',literalChecks,
    publicScope:'PILLARS_ONLY_NO_CIVIL_TIME',e1:{grade:strength.grade,supportUnits:strength.score.supportUnits},
    localCompetition:result.competition,focus,rules,sensitivity:result.sensitivity};
}

export function runLiteratureAudit() {
  const cases=LITERATURE_CASES.map(evaluateOne);
  const replayed=cases.filter(row=>row.replay==='STRUCTURAL_PILLAR_REPLAY');
  const literals=replayed.flatMap(row=>row.literalChecks);
  const scoped=replayed.flatMap(row=>row.focus.filter(rule=>rule.status!=='OUT_OF_SCOPE'));
  const count=(v, key)=>v.reduce((counts,row)=>({...counts,[row[key]]:(counts[row[key]]??0)+1}),{});
  return {schemaVersion:'engine-e4-pattern-literature-audit-v1',corpusRevision:LITERATURE_REVISION,
    policy:basePolicy,kind:'DEVELOPMENT_ONLY_PROJECT_PREDICATE_REPLAY',
    totals:{records:cases.length,replayed:replayed.length,unissued:cases.length-replayed.length,
      literalCheckCount:literals.length,literalChecks:count(literals,'status'),
      allFocusRuleRows:count(replayed.flatMap(row=>row.focus),'status'),scopedFocusRuleRows:scoped.length},
    comparisonScope:'LITERAL_FACT_CHECKS_AND_PROJECT_RULE_OUTPUTS_CLASSICAL_EFFICACY_UNASSIGNED',
    cases};
}

if (process.argv[1] && import.meta.url===pathToFileURL(resolve(process.argv[1])).href) {
  assert.equal(process.argv.length,2,'Usage: node scripts/engine/e4-pattern-audit.mjs');
  process.stdout.write(JSON.stringify(runLiteratureAudit())+'\n');
}
