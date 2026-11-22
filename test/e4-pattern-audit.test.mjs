import assert from 'node:assert/strict';
import test from 'node:test';
import {runLiteratureAudit} from '../scripts/engine/e4-pattern-audit.mjs';

const audit=runLiteratureAudit();
const find=(id)=>audit.cases.find(row=>row.id===id);
const active=(id)=>find(id).focus.find(rule=>rule.status!=='OUT_OF_SCOPE');
const value=(rule,id)=>rule.conditions.find(row=>row.conditionId===id)?.value;

test('literature replay preserves literal published pillars and unissued source gaps',()=>{
  const replays=audit.cases.filter(row=>row.replay==='STRUCTURAL_PILLAR_REPLAY');
  assert.equal(replays.length,27);
  assert.equal(new Set(replays.map(row=>row.pillars.join(''))).size,27);
  const literal=replays.flatMap(row=>row.literalChecks);
  assert.equal(literal.length,81);
  assert.deepEqual(literal.filter(check=>check.status!=='MATCH'),[]);
  const partial=audit.cases.filter(row=>row.replay==='NO_REFERENCE_FOR_FULL_REPLAY');
  assert.equal(partial.length,7);
  assert.equal(partial.filter(row=>row.reason==='INVALID_PUBLISHED_PILLAR').length,2);
  for (const row of partial) {
    assert.equal(row.pillars,undefined);
    assert.equal(row.rules,undefined);
  }
});

test('officer resource replay distinguishes exposed resource from unresolved clash at the root',()=>{
  // 薛: Both 申 contain 壬. Both oppose 寅. Officer support therefore keeps an
  // exposed, rooted resource path and separately holds its direct clash effect.
  const xue=active('CH31-XUE');
  assert.equal(value(xue,'OFFICER_TO_SURFACE_RESOURCE'),'TRUE');
  assert.equal(value(xue,'EXACT_HIDDEN_ROOT'),'TRUE');
  assert.equal(value(xue,'ROOT_BRANCH_CLASH_EFFECT'),'UNKNOWN');
  assert.equal(xue.status,'UNRESOLVED');
  assert.deepEqual(xue.singleGateOmissions.map(x=>x.probe),['OMIT_DIRECT_CLASH_HOLD']);
  assert.equal(active('CH31-JIN').status,'RULE_SATISFIED');
  assert.equal(active('CH31-JIN').samePillarOnlyStress.everySatisfiedPathExcluded,true);
});

test('wealth replay observes food while keeping a distinct project grade and root gate',()=>{
  // 楊: 壬 on the year/month stems generates the 寅 main-qi 甲. No hidden 壬.
  // E1 hand-sum in points is 寅戊 2+6, 辰戊 12, 巳戊庚 4, visible 辛 10.
  const yang=active('CH33-YANG');
  assert.equal(value(yang,'SURFACE_FOOD_TO_WEALTH'),'TRUE');
  assert.equal(value(yang,'EXACT_HIDDEN_ROOT'),'FALSE');
  assert.equal(value(yang,'E1_DIRECTION_STRONG'),'FALSE');
  assert.equal(find('CH33-YANG').e1.supportUnits,3400);
  assert.equal(yang.status,'NOT_TRIGGERED');
  assert.equal(yang.withoutE1,'NOT_TRIGGERED');
  const mao=active('CH33-MAO');
  assert.equal(mao.status,'UNRESOLVED');
  assert.ok(mao.paths.some(path=>path.status==='UNRESOLVED' &&
    path.conditions.some(condition=>condition.conditionId==='RELATED_STEM_COMBINATION_EFFECT'&&condition.value==='UNKNOWN')));
});

test('independent remote-pair probe reports candidates but does not issue softened outcomes',()=>{
  // In 何, the month 戊 can generate hour 辛 by element, across two pillars.
  // Year 丙 can feed month 戊, which does not settle the distinct role of 辛.
  const he=active('CH39-HE');
  assert.equal(value(he,'KILLINGS_TO_SURFACE_RESOURCE'),'FALSE');
  assert.equal(value(he,'E1_DIRECTION_WEAK'),'TRUE');
  assert.ok(he.remotePairsInDistanceStress.some(p=>p.partnerRole==='hour'&&p.partnerGod==='正印'&&p.gap===2));
  const yi=active('CH39-YI');
  assert.equal(value(yi,'SURFACE_FOOD_TO_KILLINGS'),'FALSE');
  assert.ok(yi.remotePairsInDistanceStress.some(p=>p.partnerRole==='hour'&&p.partnerGod==='食神'&&p.gap===2));
  assert.equal(yi.status,'NOT_TRIGGERED');
  assert.equal(he.status,'NOT_TRIGGERED');
  assert.equal(find('CH39-CHANG').focus[0].status,'OUT_OF_SCOPE');
});

test('the published Mao chart preserves mixed path values using the original E3 tri-state contract',()=>{
  const mao=active('CH33-MAO');
  const summary=mao.conditions.find(row=>row.conditionId==='LOCAL_SURFACE_ATTACK');
  const pathValues=new Set(mao.paths.flatMap(path=>path.conditions
    .filter(row=>row.conditionId==='LOCAL_SURFACE_ATTACK')
    .map(row=>row.value)));
  // 乙 at year reaches the 辰 month anchor, but not the 戊 hour exposure.
  assert.deepEqual(pathValues,new Set(['TRUE','FALSE']));
  assert.equal(summary.value,'UNKNOWN');
  assert.equal(summary.variesByPath,true);
  const uniform=active('CH31-XUE').conditions.find(row=>row.conditionId==='ROOT_BRANCH_CLASH_EFFECT');
  assert.equal(uniform.value,'UNKNOWN');
  assert.equal(uniform.variesByPath,false);
});
