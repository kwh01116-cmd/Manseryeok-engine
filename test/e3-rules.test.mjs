import test from 'node:test';
import assert from 'node:assert/strict';
import {structuralM2Unit} from './fixtures/m3-structural-unit-input.mjs';
import {RULE_CASES} from './fixtures/e3-rule-cases-v1.mjs';
import {deriveM3Evidence,M3_EVIDENCE_PROFILE_ID} from '../dist/m3/structuralEvidenceV1.js';
import {deriveM4InnerPatterns,M4_INNER_PATTERN_PROFILE_ID} from '../dist/m4/innerPatternsV1.js';
import {evaluatePatternRulesV1,matchPatternRootLocations,PATTERN_RULES_POLICY_ID,PATTERN_RULES_VERSION} from '../dist/e3/patternRulesV1.js';
import {assessProductStrength,PRODUCT_STRENGTH_POLICY_ID} from '../dist/e1/productStrengthV1.js';

const policy={policyId:PATTERN_RULES_POLICY_ID,policyVersion:PATTERN_RULES_VERSION};
function context(charts,monthTerms){
  const m2=structuralM2Unit(charts,{monthTerms});
  return fromM2(m2);
}
function fromM2(m2) {
  const m3=deriveM3Evidence(m2,{policyId:M3_EVIDENCE_PROFILE_ID});
  const m4=deriveM4InnerPatterns(m3,{profileId:M4_INNER_PATTERN_PROFILE_ID,m2Facts:m2});
  return {m2,m3,m4};
}
function strength(ctx,index=0){
  const chart=ctx.m2.candidates[index];
  return assessProductStrength({candidateRef:chart.id,pillars:chart.pillars.map((p,i)=>({
    role:p.role,stem:p.stem,branch:p.branch,factRef:'facts.candidates['+index+'].pillars['+i+']',
  }))},{policyId:PRODUCT_STRENGTH_POLICY_ID});
}
function evaluate(ctx,useStrength=false,index=0){
  return evaluatePatternRulesV1(ctx.m4,ctx.m3,ctx.m2,index,{...policy,...(useStrength?{strength:strength(ctx,index)}:{})});
}
function pick(result,type,id){
  const selected=result.rules.find(r=>r.patternType===type&&r.ruleId===id);
  assert.ok(selected);
  return selected;
}
for(const [name,pillars,term,type,id,expected,useStrength,summary] of RULE_CASES){
  test('E3 fixed structural expectation: '+name,()=>{
    const ctx=context([pillars],[term]), output=evaluate(ctx,useStrength);
    const row=pick(output,type,id);
    assert.equal(row.status,expected);
    if(summary)assert.equal(output.status,summary);
    const facts=new Set(ctx.m2.candidates[0].facts.map(f=>f.id));
    assert.ok(row.factRefs.length&&row.factRefs.every(f=>facts.has(f)));
    assert.ok(row.paths.every(p=>p.conditions.every(c=>c.factRefs.every(f=>facts.has(f)))));
  });
}
test('E3 keeps base grade and evaluates all named probe conditions without changing other paths',()=>{
  // 46 E1 support = 壬月12 + 乙時10 + 申壬6 + 辰乙癸8 + 亥壬甲10.
  const ctx=context([['丙午','壬申','甲辰','乙亥']],['LIQIU']);
  const withE1=evaluate(ctx,true), withoutE1=evaluate(ctx);
  const base=pick(withE1,'七殺','KILLINGS_RESOURCE_ROUTE');
  assert.equal(base.strengthDependency.base.supportUnits,4600);
  assert.equal(base.strengthDependency.base.grade,'BORDERLINE');
  assert.equal(base.status,'UNRESOLVED');
  assert.equal(withE1.sensitivity.length,7);
  const weighted=withE1.sensitivity.find(x=>x.probeId==='BAND_47_57');
  assert.equal(weighted.supportUnits,4600);
  assert.equal(weighted.grade,'WEAK');
  assert.deepEqual(weighted.changes.find(x=>x.ruleId===base.ruleId),{
    ruleId:base.ruleId,patternRef:base.patternRef,conditionId:'E1_DIRECTION_WEAK',baseValue:'UNKNOWN',value:'TRUE',
    baseReason:'E1_BORDERLINE',reason:'E1_WEAK',baseStatus:'UNRESOLVED',status:'RULE_SATISFIED',
  });
  assert.deepEqual(pick(withE1,'七殺','KILLINGS_FOOD_CONTROL'),pick(withoutE1,'七殺','KILLINGS_FOOD_CONTROL'));
  assert.deepEqual(pick(withE1,'七殺','KILLINGS_RESOURCE_INTERFERENCE'),pick(withoutE1,'七殺','KILLINGS_RESOURCE_INTERFERENCE'));
});
test('E3 same rooted resource can face both wealth directions without choosing its preferred role',()=>{
  const result=evaluate(context([['丁未','癸酉','乙丑','戊戌']],['BAILU']),true);
  // 年/時 wealth source next to the 酉 monthly anchor is required; the remote 戊 is a control.
  const held=pick(result,'七殺','KILLINGS_RESOURCE_ROUTE');
  assert.ok(held.paths.flatMap(p=>p.details.dualWealth??[]).length===0);
  const present=evaluate(context([['戊辰','壬申','甲子','庚午']],['LIQIU']),true);
  const route=pick(present,'七殺','KILLINGS_RESOURCE_ROUTE');
  const both=route.paths.find(p=>p.details.dualWealth?.length);
  assert.ok(both);
  assert.equal(both.details.dualWealth[0].stem,'戊');
  assert.equal(both.conditions.find(c=>c.conditionId==='WEALTH_PRESSURE_ON_RESOURCE').value,'UNKNOWN');
  assert.equal(both.conditions.find(c=>c.conditionId==='WEALTH_FEEDS_KILLINGS').value,'UNKNOWN');
  assert.equal(route.status,'UNRESOLVED');
});
test('E3 handles the month and exact exposure paths separately and does not sum equivalent witnesses',()=>{
  const res=evaluate(context([['癸丑','辛酉','甲子','戊辰']],['BAILU']));
  const row=pick(res,'正官','OFFICER_RESOURCE_SUPPORT');
  assert.deepEqual(row.paths.map(p=>p.anchor.kind),['HIDDEN_STEM','VISIBLE_STEM']);
  assert.equal(new Set(row.factRefs).size,row.factRefs.length);
  for(const p of row.paths){
    const roots=p.details.roots.exact;
    assert.equal(roots.length,new Set(roots.map(x=>x.locationRef)).size);
    assert.equal(p.status,'RULE_SATISFIED');
  }
});
test('E3 authenticates M4 lineage and refuses stale, cloned or foreign policy evidence',()=>{
  const charts=[['乙巳','己丑','己酉','丁卯'],['丙午','庚寅','己酉','丁卯']];
  const terms=['XIAOHAN','LICHUN'];
  const ctx=context(charts,terms), other=context(charts,terms);
  const different=context([['丙午','壬申','甲辰','乙亥']],['LIQIU']);
  const call=(m4=ctx.m4,m3=ctx.m3,m2=ctx.m2,index=0,options=policy)=>evaluatePatternRulesV1(m4,m3,m2,index,options);
  const first=call(),second=call(ctx.m4,ctx.m3,ctx.m2,1);
  assert.equal(first.candidateRef,'chart.candidates[0]');assert.equal(second.candidateRef,'chart.candidates[1]');
  assert.equal(pick(first,'正官','OFFICER_RESOURCE_RESCUE').status,'OUT_OF_SCOPE');
  assert.ok(second.rules.flatMap(r=>r.factRefs).every(f=>f.startsWith('chart.candidates[1]#')));
  assert.throws(()=>call(structuredClone(ctx.m4)),/ISSUED_IMMUTABLE/);
  assert.throws(()=>call(ctx.m4,other.m3),/FOREIGN_EXECUTION/);
  assert.throws(()=>call(ctx.m4,ctx.m3,other.m2),/FOREIGN_EXECUTION/);
  assert.throws(()=>call(ctx.m4,ctx.m3,ctx.m2,2),/CANDIDATE_REQUIRED/);
  assert.throws(()=>call(ctx.m4,ctx.m3,ctx.m2,0,{...policy,policyVersion:'0.0.0'}),/EXPLICIT_PATTERN_POLICY/);
  assert.throws(()=>call(ctx.m4,ctx.m3,ctx.m2,0,{...policy,strength:structuredClone(strength(ctx))}),/ISSUED_STRENGTH_REQUIRED/);
  assert.throws(()=>call(ctx.m4,ctx.m3,ctx.m2,0,{...policy,strength:strength(ctx,1)}),/FOREIGN_CANDIDATE/);
  assert.throws(()=>call(ctx.m4,ctx.m3,ctx.m2,0,{...policy,strength:strength(different)}),/FOREIGN_CANDIDATE/);
});

test('E3 exact roots ignore OTHER member order and a duplicated witness',()=>{
  const ctx=context([['壬申','丁酉','甲子','戊辰']],['BAILU']);
  const locations=Object.values(ctx.m3.candidates[0].directionalGroups).flat();
  const target=locations.find(x=>x.stem==='壬'&&x.locationKind==='VISIBLE_STEM');
  const hidden=locations.filter(x=>x.locationKind==='HIDDEN_STEM');
  const others=hidden.filter(x=>x.position==='OTHER').reverse();
  const reordered=hidden.map(x=>x.position==='OTHER'?others.shift():x);
  const ids=rows=>rows.map(x=>x.locationId).sort();
  const original=matchPatternRootLocations(target,hidden);
  const permutation=matchPatternRootLocations(target,[...reordered,original.exact[0]]);
  assert.deepEqual(ids(original.exact),ids(permutation.exact));
  assert.deepEqual(ids(original.sameElementDifferentStem),ids(permutation.sameElementDifferentStem));
  assert.ok(original.exact.every(row=>row.stem==='壬'));
  assert.ok(original.sameElementDifferentStem.every(row=>row.stem==='癸'));
});

test('E3 keeps a remote resource and matches exact month exposure rather than like element',()=>{
  const base=context([['丁未','辛酉','乙亥','乙亥']],['BAILU']);
  const remote=context([['丁未','辛酉','乙亥','癸亥']],['BAILU']);
  for(const ctx of [base,remote])assert.equal(pick(evaluate(ctx),'七殺','KILLINGS_FOOD_CONTROL').status,'RULE_SATISFIED');
  const exact=context([['丁未','庚辰','甲午','辛未']],['QINGMING']);
  // Actual exposure of 辰中癸 does not happen with an unlike water stem 壬.
  const like=context([['癸丑','庚辰','甲午','辛未']],['QINGMING']);
  const unlike=context([['壬子','庚辰','甲午','辛未']],['QINGMING']);
  assert.equal(like.m4.candidates[0].patterns.find(p=>p.patternType==='正印').exactExposures.length,1);
  assert.equal(unlike.m4.candidates[0].patterns.find(p=>p.patternType==='正印').exactExposures.length,0);
  const observation=pick(evaluate(exact),'偏財','WEALTH_FOOD_FORMATION');
  assert.ok(observation.paths.every(p=>p.anchor.stem==='戊'&&p.anchor.kind==='HIDDEN_STEM'));
});

test('E3 preserves a second monthly path with unresolved strength beside a satisfied path',()=>{
  // 戌本氣戊 connects to 月丙 with an exact 巳 root. 戌中辛 exposes to 時, and
  // 年癸 has an exact 子 root. The pair 丙–辛 spans the day pillar and is outside this rule's range.
  const ctx=context([['癸卯','丙戌','甲子','辛巳']],['HANLU']);
  const result=evaluate(ctx);
  const officer=pick(result,'正官','OFFICER_RESOURCE_SUPPORT');
  const wealth=pick(result,'偏財','WEALTH_FOOD_FORMATION');
  assert.equal(officer.status,'RULE_SATISFIED');
  assert.equal(wealth.status,'UNRESOLVED');
  assert.deepEqual(wealth.holdReasons,['E1_REQUIRED']);
  assert.notEqual(officer.patternRef,wealth.patternRef);
  assert.equal(result.status,'COMPETING_RULES');
  assert.ok(result.competition.some(group=>[officer,wealth].every(rule=>
    group.paths.some(p=>p.ruleId===rule.ruleId && p.patternRef===rule.patternRef && p.status===rule.status))));
  assert.equal(pick(evaluate(ctx,true),'偏財','WEALTH_FOOD_FORMATION').status,'NOT_TRIGGERED');
});
