import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { compareStrengthDiagnostics } from '../scripts/engine/e4-strength.mjs';
import { assessProductStrength } from '../dist/e1/productStrengthV1.js';

const baselineFixtures=JSON.parse(readFileSync(new URL('./fixtures/e1-strength-contracts-v1.json',import.meta.url),'utf8')).cases;
const basis=['year','month','day','hour'];
const probeRead=report=>report.sensitivity.probes.map(({supportUnits,grade})=>[supportUnits,grade]);
const memberships=row=>row.branchMembers.map(({stem,family,units})=>[stem,family,units]);
const byulcode=['丙子','辛卯','己巳','己巳'];
const jeonghae=['甲午','己巳','丁卯','庚子'];

test('E4 independently reconstructs Byeolcode fictional chart E1 contributions and threshold distances',()=>{
  const x=compareStrengthDiagnostics(byulcode);
  assert.equal(x.baseline.supportUnits,4200);
  assert.equal(x.baseline.grade,'WEAK');
  assert.deepEqual(x.baseline.positions.map(p=>p.supportUnits),[800,0,1600,1800]);
  assert.deepEqual(memberships(x.baseline.positions[2]),[['丙','RESOURCE',1200],['庚','OUTPUT',400],['戊','PEER',400]]);
  assert.deepEqual(x.baseline.dayRootStems,['戊']);
  assert.deepEqual(x.baseline.dayResourceStems,['丙']);
  assert.equal(x.baseline.powerUnits,2600);
  assert.equal(x.thresholdDistances.addUnitsToExitWeak,300);
  assert.equal(x.thresholdDistances.addUnitsToStrong,1301);
  assert.equal(x.hiddenInventoryCounterfactual.supportUnits,4200);
  assert.deepEqual(probeRead(x),[[4360,'WEAK'],[4040,'WEAK'],[4050,'WEAK'],
    [4350,'WEAK'],[4200,'WEAK'],[4200,'WEAK']]);
  assert.equal(x.sensitivity.status,'STABLE_IN_PROBES');
  assert.equal(x.sensitivity.stressOnly.supportUnits,4800);
  assert.deepEqual(x.supportAttribution,{
    basis:'E1_MAIN_QI_THEN_BUDGET_THEN_HIDDEN_STEM_SPLIT',
    unweightedWithDayMaster:{supported:5,total:8},unweightedExcludingDayMaster:{supported:4,total:7},
    e1PositionalPrincipalOnlyUnits:4800,e1HiddenStemSplitDeltaUnits:-600,
  });
  assert.deepEqual(x.structuralDiagnostics.stemCombinations,[{indices:[0,1],stems:['丙','辛']}]);
  assert.ok(x.baseline.opposingEvidence.every(x=>['OUTPUT','WEALTH','OFFICER'].includes(x.family)));
  assert.ok(x.baseline.supportingEvidence.every(x=>['PEER','RESOURCE'].includes(x.family)));
});

test('E4 independently distinguishes Jeonghae indicators from its unpublished score',()=>{
  const x=compareStrengthDiagnostics(jeonghae);
  assert.equal(x.baseline.supportUnits,5300);
  assert.equal(x.baseline.grade,'BORDERLINE');
  assert.deepEqual(x.baseline.positions.map(p=>p.supportUnits),[1500,1800,2000,0]);
  assert.deepEqual(x.baseline.flags,{deukryeong:true,deukji:false,deukse:false});
  assert.deepEqual(x.publicDefinitionProjection.flags,{deukryeong:true,deukji:true,deukse:true});
  assert.equal(x.publicDefinitionProjection.grade,null);
  assert.equal(x.publicDefinitionProjection.supportingPositionCount,2);
  assert.equal(x.baseline.powerUnits,1500);
  assert.equal(x.hiddenInventoryCounterfactual.supportUnits,5400);
  assert.deepEqual(probeRead(x),[[5200,'BORDERLINE'],[5400,'BORDERLINE'],[4900,'BORDERLINE'],
    [5700,'STRONG'],[5300,'BORDERLINE'],[5300,'BORDERLINE']]);
  assert.equal(x.sensitivity.stressOnly.supportUnits,6800);
  assert.equal(x.thresholdDistances.addUnitsToStrong,201);
  assert.deepEqual(x.structuralDiagnostics.branchClashes,
    [{indices:[0,3],branches:['午','子'],affectedBranchSupportUnits:[700,0]}]);
});

test('E4 audit score remains unchanged when the only changed branch introduces clash on its sole root',()=>{
  // Raw charts only. 午 and 寅 are both opposing to 壬 at this position.
  const clash=compareStrengthDiagnostics(['甲午','丙寅','壬子','甲寅']);
  const control=compareStrengthDiagnostics(['甲寅','丙寅','壬子','甲寅']);
  assert.equal(clash.baseline.supportUnits,2000);
  assert.equal(control.baseline.supportUnits,2000);
  assert.equal(clash.baseline.flags.deukji,true);
  assert.equal(clash.structuralDiagnostics.effects,'NOT_EVALUATED');
  assert.deepEqual(clash.structuralDiagnostics.branchClashes,
    [{indices:[0,2],branches:['午','子'],affectedBranchSupportUnits:[0,2000]}]);
  assert.deepEqual(control.structuralDiagnostics.branchClashes,[]);
});

test('E4 root evidence distinguishes a same-element stem from a resource at equal score',()=>{
  // For 壬 the only support of 辰 is 癸 (peer); of 戌 it is 辛 (resource).
  // Both have one supporting OTHER stem, so each contributes 20% of the 20 day branch points.
  const a=compareStrengthDiagnostics(['甲寅','丙寅','壬辰','甲寅']);
  const b=compareStrengthDiagnostics(['甲寅','丙寅','壬戌','甲寅']);
  assert.equal(a.baseline.supportUnits,400);
  assert.equal(b.baseline.supportUnits,400);
  assert.deepEqual(a.baseline.dayRootStems,['癸']);
  assert.deepEqual(b.baseline.dayResourceStems,['辛']);
  assert.equal(a.baseline.flags.deukji,true);
  assert.equal(b.baseline.flags.deukji,false);
});

test('E4 independent arithmetic agrees with the pre-E1 hand fixtures and E1 trace on every probe',()=>{
  for(const [id,,pillars,units,expectedGrade,acquired,exact,other,special] of baselineFixtures){
    const x=compareStrengthDiagnostics(pillars);
    assert.equal(x.baseline.supportUnits,units,id);
    assert.equal(x.baseline.grade,expectedGrade,id);
    assert.deepEqual(Object.values(x.baseline.flags),acquired,id);
    assert.equal(x.baseline.roots.flatMap(r=>r.exact).length,exact,id);
    assert.equal(x.baseline.roots.flatMap(r=>r.sameElementOther).length,other,id);
    assert.equal(x.baseline.specialReview,special,id);
    const facts=pillars.map(([stem,branch],i)=>({stem,branch,role:basis[i],factRef:`facts.candidates[7].pillars[${i}]`}));
    const e1=assessProductStrength({
      candidateRef:'chart.candidates[7]',pillars:facts,
    },{policyId:x.baseline.policyId});
    assert.deepEqual(x.baseline.roleUnits,e1.roleUnits,id);
    assert.deepEqual(x.sensitivity.probes.map(({id,supportUnits,grade,deltaUnits})=>({id,supportUnits,grade,deltaUnits})),
      e1.sensitivity.probes,id);
    assert.equal(x.sensitivity.stressOnly.supportUnits,e1.sensitivity.stressOnly.supportUnits,id);
    assert.deepEqual(compareStrengthDiagnostics(facts),x,id);
  }
});

test('E4 rejects incomplete, invalid or explicitly unordered glyph inputs before scoring',()=>{
  for(const invalid of [null,['甲子'],['甲午','乙子','甲寅','甲辰'],Array(4),
    [{role:'day',stem:'甲',branch:'子'},'甲子','甲寅','甲辰']]) {
    assert.throws(()=>compareStrengthDiagnostics(invalid),/E4_STRENGTH/);
  }
});
