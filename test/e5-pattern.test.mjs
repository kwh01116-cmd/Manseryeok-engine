import test from 'node:test';
import assert from 'node:assert/strict';
import {LITERATURE_CASES} from './fixtures/e4-literature-cases-v1.mjs';
import {contextFor,patternV2For,patternV2Selection,strengthFor} from './fixtures/e5-pattern-structural.mjs';
import {replayLiteratureV2} from '../scripts/engine/e5-pattern-literature.mjs';
import {evaluatePatternV2} from '../dist/e5/patternV2.js';

const lookup = (result,ruleId,patternType) => {
  const selected=result.rules.find(rule=>rule.ruleId===ruleId && rule.patternType===patternType);
  assert.ok(selected,`${ruleId} ${patternType}`);
  return selected;
};
const caseById = id => LITERATURE_CASES.find(x=>x.id===id).pillars;
const evaluate = (pillars,options) => patternV2For(contextFor([pillars]),0,options);
const findPath = (rule,predicate) => {
  const path=rule.paths.find(predicate);
  assert.ok(path);
  return path;
};

test('E5 楊 gives food-to-wealth a rooted adjacent feeder without manufacturing a 壬 root or changing E1',()=>{
  const rule=lookup(evaluate(caseById('CH33-YANG')),'WEALTH_FOOD_FORMATION','偏財');
  assert.equal(rule.previousStatus,'NOT_TRIGGERED');
  assert.equal(rule.status,'STRUCTURAL_POSSIBILITY');
  assert.equal(rule.comparison,'STRUCTURAL_SCOPE_EXPANDED');
  const path=findPath(rule,p=>p.observation.actor.pillarRole==='month');
  assert.equal(path.observation.anchor.stem,'甲');
  assert.equal(path.observation.actor.stem,'壬');
  assert.deepEqual(path.observation.exactRoots,[]);
  assert.deepEqual(path.observation.sameElementRoots.map(root=>root.stem),['癸']);
  assert.equal(path.structure.support,'ADJACENT_ROOTED_PEER_FEEDS_FOOD');
  assert.ok(path.structure.rootedFeeders.some(row=>row.feeder.stem==='庚' && row.roots.some(root=>root.stem==='庚')));
  assert.equal(path.efficacy.strengthDependency.base.supportUnits,3400);
  assert.ok(path.efficacy.holdReasons.includes('E1_DIRECTION_DIFFERS_FROM_V1_PREMISE'));
  assert.equal(path.efficacy.status,'UNRESOLVED');
});

test('E5 何 distinguishes a supported month-to-hour span from an unrooted distant observation',()=>{
  const rule=lookup(evaluate(caseById('CH39-HE')),'KILLINGS_RESOURCE_ROUTE','七殺');
  assert.equal(rule.previousStatus,'NOT_TRIGGERED');
  assert.equal(rule.comparison,'STRUCTURAL_SCOPE_EXPANDED');
  const isRemote = path=>path.observation.anchor.locationKind==='VISIBLE_STEM' && path.observation.actor.pillarRole==='hour';
  const path=findPath(rule,isRemote);
  assert.deepEqual(path.structure.links.map(link=>[link.from.pillarRole,link.to.pillarRole,link.distance,link.admission]),[
    ['month','hour',2,'SUPPORTED_SPAN'],['hour','day',1,'LOCAL'],
  ]);
  assert.equal(path.observation.actor.stem,'辛');
  assert.ok(path.observation.exactRoots.some(root=>root.pillarRole==='hour' && root.position==='OTHER'));
  assert.equal(path.efficacy.status,'UNRESOLVED');
  assert.ok(path.efficacy.holdReasons.includes('DISTANT_TRANSMISSION_UNASSESSED'));
  assert.ok(path.observation.rivalDirections.some(direction=>direction.type==='WEALTH_CONTROLS_RESOURCE' && direction.distance===3));
  const changed=lookup(evaluate(['丙寅','戊戌','壬戌','辛卯']),'KILLINGS_RESOURCE_ROUTE','七殺');
  const observation=findPath(changed,isRemote);
  assert.equal(observation.structure.status,'OBSERVED_ONLY');
  assert.equal(observation.structure.links[0].admission,'DISTANT_OBSERVATION');
});

test('E5 薛 retains both exact roots with explicit clashes and preserves the efficacy hold',()=>{
  const rule=lookup(evaluate(caseById('CH31-XUE')),'OFFICER_RESOURCE_SUPPORT','正官');
  assert.equal(rule.previousStatus,'UNRESOLVED');
  assert.equal(rule.comparison,'OBSERVATIONS_SEPARATED_FROM_EFFICACY');
  const path=findPath(rule,p=>p.observation.actor.stem==='壬');
  assert.equal(path.structure.support,'EXACT_HIDDEN_ROOT');
  assert.deepEqual(path.observation.exactRoots.map(root=>root.pillarRole).sort(),['month','year']);
  assert.deepEqual(path.observation.rootClashLocations,path.observation.exactRoots);
  assert.ok(path.observation.branchRelations.some(relation=>relation.kind==='LIUCHONG' && relation.touchesRoot));
  assert.ok(path.observation.branchRelations.some(relation=>relation.kind==='XING' && relation.effect==='UNASSESSED'));
  assert.equal(path.efficacy.status,'UNRESOLVED');
  assert.ok(path.efficacy.holdReasons.includes('ROOT_DAMAGE_FROM_CLASH_UNASSESSED'));
});

test('E5 existing officer rescue remains available while missing exact roots still gate that rescue',()=>{
  const rule=lookup(evaluate(['癸丑','丁酉','甲子','戊辰']),'OFFICER_RESOURCE_RESCUE','正官');
  assert.equal(rule.previousStatus,'RULE_SATISFIED');
  assert.equal(rule.comparison,'PREVIOUSLY_SATISFIED');
  assert.ok(rule.paths.some(p=>p.structure.status==='STRUCTURAL_POSSIBILITY'));
  const missingExact=lookup(evaluate(['壬午','丁酉','甲子','戊辰']),'OFFICER_RESOURCE_RESCUE','正官');
  assert.ok(missingExact.paths.length);
  assert.ok(missingExact.paths.every(p=>p.structure.rootUse==='EXACT_REQUIRED' &&
    p.structure.status==='OBSERVED_ONLY' && p.observation.sameElementRoots.some(root=>root.stem==='癸')));
  const sameElement=lookup(evaluate(['壬子','丁酉','甲午','戊辰']),'OFFICER_RESOURCE_SUPPORT','正官');
  const support=findPath(sameElement,p=>p.observation.actor.stem==='壬');
  assert.equal(support.structure.support,'LOCAL_SAME_ELEMENT_MAIN_QI');
  assert.deepEqual(support.observation.exactRoots,[]);
  assert.ok(support.structure.localSameElementMainQi.some(root=>root.stem==='癸' && root.position==='MAIN_QI'));
  assert.equal(support.structure.status,'COMPETING_PATHS');
});

test('E5 E1 boundary and non-selection change the explanatory conditions without changing structure',()=>{
  const pillars=['丙午','壬申','甲辰','乙亥'];
  const baseline=lookup(evaluate(pillars),'KILLINGS_RESOURCE_ROUTE','七殺');
  const withoutE1=lookup(evaluate(pillars,{e1:false}),'KILLINGS_RESOURCE_ROUTE','七殺');
  assert.equal(baseline.previousStatus,'UNRESOLVED');
  assert.equal(baseline.status,withoutE1.status);
  assert.deepEqual(baseline.paths.map(p=>p.structure),withoutE1.paths.map(p=>p.structure));
  assert.ok(baseline.paths.every(p=>p.efficacy.holdReasons.includes('E1_BORDERLINE')));
  assert.ok(withoutE1.paths.every(p=>p.efficacy.holdReasons.includes('E1_REQUIRED')));
});

test('E5 keeps month candidate competition and disjoint fact references without duplicate witness counts',()=>{
  const ctx=contextFor([['癸卯','丙戌','甲子','辛巳'],caseById('CH33-YANG')]);
  const first=patternV2For(ctx,0,{e1:false});
  const second=patternV2For(ctx,1,{e1:false});
  assert.equal(first.status,'COMPETING_PATHS');
  assert.ok(first.competingPatternRefs.some(ref=>ref.endsWith('#m4-inner-正官-assessment')));
  assert.ok(first.competingPatternRefs.some(ref=>ref.endsWith('#m4-inner-偏財-assessment')));
  for(const result of [first,second]){
    assert.ok(result.factRefs.every(ref=>ref.startsWith(result.candidateRef+'#')));
    assert.ok(result.rules.flatMap(rule=>rule.paths).every(path=>path.factRefs.length===new Set(path.factRefs).size));
  }
  const strengthened=patternV2For(ctx,0,{e1:true});
  assert.deepEqual(first.rules.map(row=>row.paths.map(path=>path.structure)),strengthened.rules.map(row=>row.paths.map(path=>path.structure)));
});

test('E5 rejects foreign, forged or cross-candidate evidence and accepts only version 0.2.0',()=>{
  const charts=[caseById('CH31-XUE'),caseById('CH39-HE')];
  const ctx=contextFor(charts),other=contextFor(charts);
  const run=(m4=ctx.m4,m3=ctx.m3,m2=ctx.m2,index=0,options=patternV2Selection)=>
    evaluatePatternV2(m4,m3,m2,index,options);
  assert.throws(()=>run(structuredClone(ctx.m4)),/ISSUED_IMMUTABLE/);
  assert.throws(()=>run(ctx.m4,other.m3),/FOREIGN_EXECUTION/);
  assert.throws(()=>run(ctx.m4,ctx.m3,other.m2),/FOREIGN_EXECUTION/);
  assert.throws(()=>run(ctx.m4,ctx.m3,ctx.m2,2),/CANDIDATE_REQUIRED/);
  assert.throws(()=>run(ctx.m4,ctx.m3,ctx.m2,0,{...patternV2Selection,policyVersion:'0.1.0'}),/EXPLICIT_PATTERN_V2_POLICY/);
  assert.throws(()=>run(ctx.m4,ctx.m3,ctx.m2,0,{...patternV2Selection,strength:strengthFor(ctx,1)}),/FOREIGN_CANDIDATE/);
  assert.throws(()=>run(ctx.m4,ctx.m3,ctx.m2,0,{...patternV2Selection,strength:structuredClone(strengthFor(ctx,0))}),/ISSUED_STRENGTH_REQUIRED/);
});

test('E5 independently replays the archived 27 literal charts and leaves 7 incomplete records unissued',()=>{
  const result=replayLiteratureV2();
  assert.equal(result.totals.records,34);
  assert.equal(result.totals.issued,27);
  assert.equal(result.totals.unissued,7);
  assert.deepEqual(result.totals.legacyRuleStates,{NOT_TRIGGERED:68,OUT_OF_SCOPE:249,RULE_SATISFIED:4,UNRESOLVED:3});
  assert.ok(result.cases.filter(row=>row.replay==='NO_REFERENCE_FOR_FULL_REPLAY').every(row=>row.source.url && !row.pillars));
  assert.ok(result.cases.flatMap(row=>row.focus??[]).flatMap(rule=>rule.paths)
    .every(path=>path.efficacy.status==='UNRESOLVED'));
});
