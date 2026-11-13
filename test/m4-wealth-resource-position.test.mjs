// Literal positional-policy tests. Not actual 成格/破格/救應 or prediction tests.
import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {deriveM3Evidence,M3_EVIDENCE_PROFILE_ID} from '../dist/m3/structuralEvidenceV1.js';
import {deriveM4ZhengguanStructure,M4_PATTERN_PROFILE_ID,validateM4ZhengguanStructure} from '../dist/m4/zhengguanStructureV1.js';
import {
  M4_POSITION_PROFILE_ID,M4_POSITION_METADATA,deriveM4WealthResourcePosition,
  validateM4WealthResourcePosition,explainM4WealthResourcePosition,
  validateM4WealthResourcePositionExplanation,renderM4WealthResourcePositionText,
} from '../dist/m4/wealthResourcePositionV1.js';
import {structuralM2Unit} from './fixtures/m3-structural-unit-input.mjs';
import {
  M4_WEALTH_RESOURCE_POSITION_CASE_BASIS as basis,
  M4_WEALTH_RESOURCE_POSITION_CASES as cases,
  M4_WEALTH_RESOURCE_POSITION_BOUNDARY_CONTRACTS as boundaries,
  M4_WEALTH_RESOURCE_POSITION_REJECTION_CONTRACTS as rejections,
} from './fixtures/m4-wealth-resource-position-cases.mjs';

const fixtureSha='beadee46fdb5ecf0ac925b7aacfcabde6521b9f2a9b0672f89d3a3e15e5a2094';
const byId=id=>{const value=cases.find(c=>c.id===id);assert.ok(value,id);return value;};
const context=(pillars,terms)=>{
  const m2Facts=structuralM2Unit(pillars,{monthTerms:terms});
  const evidence=deriveM3Evidence(m2Facts,{policyId:M3_EVIDENCE_PROFILE_ID});
  const pattern=deriveM4ZhengguanStructure(evidence,{profileId:M4_PATTERN_PROFILE_ID,m2Facts});
  return {m2Facts,evidence,pattern};
};
const stateFor=c=>context([c.pillars],[c.monthTerm]);
const run=(state,overrides={})=>deriveM4WealthResourcePosition(state.pattern,{profileId:M4_POSITION_PROFILE_ID,evidence:state.evidence,...overrides});
const first=value=>value.candidates[0];
const shape=l=>({role:l.pillarRole,stem:l.stem,tenGod:l.tenGod});
const pairShape=p=>({wealthRole:p.wealth.pillarRole,wealthStem:p.wealth.stem,resourceRole:p.resource.pillarRole,resourceStem:p.resource.stem,geometry:p.geometry,intervening:p.intermediateLocations.map(shape)});
const original=state=>JSON.stringify({m2:state.m2Facts,m3:state.evidence,m4:state.pattern});

function literalAssertions(c,state,value){
  const p=first(value),upstream=first(state.pattern),x=c.expected;
  assert.equal(upstream.candidateAssessment.status,x.upstreamCandidateStatus,c.id);
  assert.equal(upstream.candidateAssessment.basis,x.upstreamCandidateBasis,c.id);
  assert.equal(p.exposureState,x.exposureState,c.id);
  assert.deepEqual(p.exposure.wealth.visible.map(shape),x.visibleWealth,c.id+' visible wealth');
  assert.deepEqual(p.exposure.resource.visible.map(shape),x.visibleResource,c.id+' visible resource');
  assert.equal(p.exposure.wealth.visible.length+p.exposure.wealth.hidden.length>0,x.totalWealthPresent,c.id);
  assert.equal(p.exposure.resource.visible.length+p.exposure.resource.hidden.length>0,x.totalResourcePresent,c.id);
  assert.deepEqual(p.pairs.map(pairShape),x.surfacePairs,c.id+' every directional pair');
  assert.equal(p.decision.status,x.decisionStatus,c.id);
  assert.equal(p.effects.status,x.actualEfficacy,c.id);
  assert.equal(upstream.effects.geCheng,x.finalEffects);assert.equal(upstream.effects.geBai,x.finalEffects);assert.equal(upstream.effects.jiuYing,x.finalEffects);
  for(const name of ['wealth','resource']){
    const title=name[0].toUpperCase()+name.slice(1);
    if(Object.hasOwn(x,'hidden'+title))assert.deepEqual(p.exposure[name].hidden,x['hidden'+title],c.id+' hidden absence');
    for(const h of x['hidden'+title+'Includes']??[])assert.ok(p.exposure[name].hidden.some(l=>l.pillarRole===h.role&&l.stem===h.stem&&l.tenGod===h.tenGod&&upstream.pillars.find(p=>p.role===h.role).branch===h.branch),c.id+' hidden '+name);
  }
  if(Object.hasOwn(x,'upstreamFormationStatus'))assert.equal(upstream.formationAssessment.status,x.upstreamFormationStatus,c.id);
  if(Object.hasOwn(x,'monthSelectionCompetition'))assert.equal(upstream.competition.status==='COMPETING_CONDITIONS_PRESENT',x.monthSelectionCompetition,c.id);
  if(x.upstreamReason)assert.ok(upstream.candidateAssessment.reasonCodes.includes(x.upstreamReason),c.id);
  for(const combination of x.surfaceCombinationIncludes??[])assert.ok(upstream.surfaceCombinations.some(p=>p.left.pillarRole===combination.leftRole&&p.left.stem===combination.leftStem&&p.right.pillarRole===combination.rightRole&&p.right.stem===combination.rightStem),c.id+' surface combination');
  for(const [field,group]of [['visibleHurtingOfficer','hurtingOfficer'],['visibleSevenKillings','sevenKillings']])if(x[field])assert.deepEqual(upstream.groups[group].visible.map(shape),x[field],c.id+' '+group);
  for(const [field,group]of [['hiddenHurtingOfficerIncludes','hurtingOfficer'],['hiddenSevenKillingsIncludes','sevenKillings']])for(const h of x[field]??[])assert.ok(upstream.groups[group].hidden.some(l=>l.pillarRole===h.role&&l.stem===h.stem&&l.tenGod===h.tenGod),c.id+' hidden '+group);
  return p;
}

test('twenty-two frozen pre-resolver literals cover all eight decisions and seven exposure states',()=>{
  assert.equal(createHash('sha256').update(readFileSync(new URL('./fixtures/m4-wealth-resource-position-cases.mjs',import.meta.url),'utf8').replace(/\r\n/g,'\n')).digest('hex'),fixtureSha);
  assert.equal(cases.length,22);assert.equal(boundaries.length,2);assert.equal(rejections.length,8);
  assert.equal(cases.filter(c=>c.kind.startsWith('LITERATURE')).length,2);assert.equal(cases.filter(c=>c.kind.startsWith('SYNTHETIC')).length,16);assert.equal(cases.filter(c=>c.kind.startsWith('MODERN_API')).length,4);
  assert.equal(basis.profileId,M4_POSITION_PROFILE_ID);assert.match(basis.expectationMethod,/BEFORE_C1_RESOLVER/);
  const decisions={},exposures={};
  for(const c of cases){
    assert.ok(c.sourceRef.length&&c.policyRef&&c.reason&&c.mustNotInfer.length,c.id);
    const state=stateFor(c),before=original(state),value=run(state),p=literalAssertions(c,state,value);
    assert.equal(validateM4WealthResourcePosition(value,{pattern:state.pattern,evidence:state.evidence}),true);
    assert.equal(original(state),before,c.id+' upstream result preserved');
    decisions[p.decision.status]=(decisions[p.decision.status]??0)+1;exposures[p.exposureState]=(exposures[p.exposureState]??0)+1;
  }
  assert.deepEqual(decisions,{DAY_MASTER_SEPARATED_CONTEXT:2,ADJACENT_CONTROL_REVIEW_CONTEXT:4,OFFICER_INTERVENING_CONTEXT:2,OTHER_SEPARATION_OUT_OF_SELECTED_SCOPE:2,MULTIPLE_PAIR_CONTEXT_REVIEW_REQUIRED:3,SURFACE_BOTH_NOT_PRESENT:7,NOT_APPLICABLE_TO_PATTERN:1,SOURCE_OR_POLICY_UNRESOLVED:1});
  assert.deepEqual(exposures,{BOTH_VISIBLE:15,WEALTH_ONLY_VISIBLE:2,RESOURCE_ONLY_VISIBLE:1,BOTH_HIDDEN_ONLY:1,BOTH_ABSENT:1,WEALTH_ABSENT:1,RESOURCE_ABSENT:1});
});

test('day-only, visible officer-plus-day and other intervening stem remain distinct positional contexts',()=>{
  const results=Object.fromEntries(['literature-xue-day-master-only-between','synthetic-officer-and-day-between','synthetic-officer-and-day-between-reverse-endpoints','synthetic-other-stem-and-day-between','literature-jin-repeated-ding-is-not-day-only'].map(id=>[id,first(run(stateFor(byId(id))))]));
  assert.equal(results['literature-xue-day-master-only-between'].pairs[0].intermediateLocations.length,1);
  const officer=results['synthetic-officer-and-day-between'].pairs[0];
  assert.deepEqual(officer.intermediateLocations.map(l=>l.pillarRole),['month','day']);
  assert.deepEqual(officer.intermediateLocations.map(l=>l.tenGod),['正官',null]);
  assert.equal(results['synthetic-officer-and-day-between-reverse-endpoints'].pairs[0].wealth.pillarRole,'hour');
  const other=results['synthetic-other-stem-and-day-between'];assert.equal(other.decision.status,'OTHER_SEPARATION_OUT_OF_SELECTED_SCOPE');
  assert.equal(other.pairs[0].intermediateLocations[0].stem,'乙');
  const jin=results['literature-jin-repeated-ding-is-not-day-only'];
  assert.deepEqual(jin.pairs[0].intermediateLocations.map(l=>[l.pillarRole,l.stem,l.tenGod]),[['month','丁','比肩'],['day','丁',null]]);
  assert.equal(jin.decision.status,'OTHER_SEPARATION_OUT_OF_SELECTED_SCOPE');
});

test('multiple pairs and same-character resources preserve every position without choosing a favorable representative',()=>{
  const c=byId('synthetic-same-resource-character-two-positions'),state=stateFor(c),p=literalAssertions(c,state,run(state));
  assert.equal(p.exposure.resource.visible.length,2);assert.equal(p.pairs.length,2);
  assert.deepEqual(p.exposure.resource.visible.map(l=>[l.pillarRole,l.stem]),[['year','壬'],['hour','壬']]);
  assert.equal(new Set(p.pairs.map(x=>x.id)).size,2);
  assert.notEqual(p.pairs[0].resource.locationId,p.pairs[1].resource.locationId);
  for(const id of ['synthetic-multiple-wealth-mixed-contexts','synthetic-multiple-wealth-separated-contexts']){
    const item=byId(id),s=stateFor(item),q=literalAssertions(item,s,run(s));
    assert.equal(q.decision.status,'MULTIPLE_PAIR_CONTEXT_REVIEW_REQUIRED');assert.equal(q.pairs.length,2);
  }
});

test('surface absence, hidden-only presence and total category absence preserve the old formation observations',()=>{
  const ids=['api-20260108-wealth-visible-resource-hidden-only','synthetic-resource-visible-wealth-hidden-only','synthetic-both-groups-hidden-only','api-20030103-officer-candidate-with-neither-category','synthetic-wealth-truly-absent-resource-present','synthetic-resource-truly-absent-wealth-present'];
  for(const id of ids){const c=byId(id),state=stateFor(c),value=run(state);literalAssertions(c,state,value);assert.equal(first(value).pairs.length,0);}
  const overlap=stateFor(byId(ids[0])),neither=stateFor(byId(ids[3]));
  assert.equal(first(overlap.pattern).formationAssessment.status,'FORMATION_CONDITIONS_OBSERVED');
  assert.equal(first(neither.pattern).formationAssessment.status,'BASE_STRUCTURE_ONLY');
  assert.equal(first(run(overlap)).decision.status,first(run(neither)).decision.status);
  // Missing a category is not an unimplemented interaction between two
  // categories. Hidden presence still supplies a real two-category context.
  for(const id of ['api-20260108-wealth-visible-resource-hidden-only','synthetic-resource-visible-wealth-hidden-only','synthetic-both-groups-hidden-only'])assert.ok(first(run(stateFor(byId(id)))).requiredPolicies.includes('WEALTH_RESOURCE_TRANSMISSION_AND_ROOT_EFFICACY'),id+' both categories really present');
  for(const id of ['api-20030103-officer-candidate-with-neither-category','synthetic-wealth-truly-absent-resource-present','synthetic-resource-truly-absent-wealth-present'])assert.ok(!first(run(stateFor(byId(id)))).requiredPolicies.includes('WEALTH_RESOURCE_TRANSMISSION_AND_ROOT_EFFICACY'),id+' missing category is not a deferred transmission effect');
});

test('noncandidate and source-policy priorities coexist with raw pairs while overlays never decide actual efficacy',()=>{
  for(const id of ['api-20260101-noncandidate-overrides-surface-pair','synthetic-wu-other-compatibility-priority','synthetic-adjacent-with-hurting-officer-overlay','synthetic-adjacent-with-seven-killings-overlay','api-20260206-other-exposed-with-competing-overlays']){
    const c=byId(id),state=stateFor(c),p=literalAssertions(c,state,run(state));
    assert.equal(p.effects.status,'NOT_EVALUATED');assert.equal(first(state.pattern).effects.geCheng,'NOT_IMPLEMENTED');
  }
  const adjacent=first(run(stateFor(byId('synthetic-adjacent-wealth-year-resource-month'))));
  for(const id of ['synthetic-adjacent-with-hurting-officer-overlay','synthetic-adjacent-with-seven-killings-overlay'])assert.deepEqual(first(run(stateFor(byId(id)))).pairs.map(pairShape),adjacent.pairs.map(pairShape));
});

test('issued immutable contexts reject clones, missing or unsupported policy and other-request evidence',()=>{
  const a=stateFor(byId('synthetic-adjacent-wealth-year-resource-month')),b=stateFor(byId('synthetic-adjacent-wealth-year-resource-month'));
  for(const profileId of [undefined,'','AUTO','UNKNOWN',M4_PATTERN_PROFILE_ID])assert.throws(()=>run(a,{profileId}));
  assert.throws(()=>deriveM4WealthResourcePosition(a.pattern));
  for(const evidence of [undefined,structuredClone(a.evidence),b.evidence])assert.throws(()=>run(a,{evidence}));
  assert.throws(()=>deriveM4WealthResourcePosition(structuredClone(a.pattern),{profileId:M4_POSITION_PROFILE_ID,evidence:a.evidence}));
  const value=run(a);assert.ok(Object.isFrozen(value)&&Object.isFrozen(first(value))&&Object.isFrozen(first(value).pairs));
  for(const change of [v=>{v.candidates[0].decision.status='NONINTERFERENCE_CONFIRMED';},v=>{v.candidates[0].effects.status='EFFECTIVE';},v=>{delete v.candidates[0].pairs[0];},v=>{v.candidates[0].pairs.push(v.candidates[0].pairs[0]);}]){
    const altered=structuredClone(value);change(altered);assert.throws(()=>validateM4WealthResourcePosition(altered));
  }
});

test('missing, sparse, foreign or changed upstream facts fail rather than becoming category absence',()=>{
  const c=byId('synthetic-adjacent-wealth-year-resource-month');
  const mutations=[
    m=>{m.candidates[0].facts=m.candidates[0].facts.filter(f=>!(f.kind==='VISIBLE_TEN_GOD'&&f.value.role==='year'));},
    m=>{delete m.candidates[0].facts.find(f=>f.kind==='HIDDEN_STEMS'&&f.value.role==='month').value.members[0];},
    m=>{m.candidates[0].facts.find(f=>f.kind==='VISIBLE_TEN_GOD'&&f.value.role==='month').sourceRefs=['MISSING_SOURCE'];},
    m=>{m.candidates[0].facts.find(f=>f.kind==='VISIBLE_TEN_GOD'&&f.value.role==='year').candidateRef='chart.candidates[1]';},
    m=>{m.policyBundle.policies.hiddenStems.id='INVENTED_POLICY';},
    m=>{m.rules.find(r=>r.id==='M2-RULE-HIDDEN-STEMS-001').runtimeVersion='9.9.9';},
  ];
  for(const mutate of mutations){const state=stateFor(c);mutate(state.m2Facts);assert.throws(()=>run(state));}
  const state=stateFor(c),value=run(state),snapshot=JSON.stringify(value),fresh=run(stateFor(c));
  state.m2Facts.candidates[0].facts.find(f=>f.kind==='VISIBLE_TEN_GOD'&&f.value.role==='year').value.tenGod='正印';
  assert.throws(()=>validateM4WealthResourcePosition(value));assert.equal(JSON.stringify(value),snapshot);
  assert.equal(validateM4WealthResourcePosition(fresh),true);
});

test('two actual Lichun parent shapes remain isolated and seasonal alternatives cannot create a new parent',()=>{
  const b=boundaries.find(c=>c.id.startsWith('lichun')),state=context(b.expectedParents.map(x=>x.pillars),['XIAOHAN','LICHUN']),value=run(state);
  assert.equal(value.candidates.length,2);
  value.candidates.forEach((c,i)=>{
    assert.equal(c.decision.status,b.expectedParents[i].decisionStatus);
    if(b.expectedParents[i].exposureState)assert.equal(c.exposureState,b.expectedParents[i].exposureState);
    for(const group of Object.values(c.exposure))for(const l of [...group.visible,...group.hidden])assert.equal(l.candidateRef,'chart.candidates['+i+']');
    for(const p of c.pairs)for(const l of [p.wealth,p.resource,...p.intermediateLocations])assert.equal(l.candidateRef,'chart.candidates['+i+']');
  });
  const b2=boundaries.find(c=>c.id.startsWith('pre18')),s=context([b2.expected.pillars],['QINGMING']),r=run(s);
  assert.equal(r.candidates.length,1);assert.equal(first(r).decision.status,b2.expected.decisionStatus);
  // Pure C1 does not consume seasonal alternatives at all. Product-level B
  // continuity is independently checked by the existing CLI integration path.
  assert.equal(validateM4ZhengguanStructure(s.pattern,{evidence:s.evidence,m2Facts:s.m2Facts}),true);
});

test('repeat requests reproduce meaning and neither C1 nor a report rewrites the upstream chart',()=>{
  const state=stateFor(byId('synthetic-officer-and-day-between')),before=original(state),a=run(state),b=run(state),other=run(stateFor(byId('synthetic-both-groups-hidden-only'))),c=run(stateFor(byId('synthetic-officer-and-day-between')));
  assert.deepEqual(a,b);assert.deepEqual(a,c);assert.notDeepEqual(a,other);
  explainM4WealthResourcePosition(a);assert.equal(original(state),before);
  assert.equal(state.evidence.finalStrength.status,'NOT_IMPLEMENTED');
});

test('every deterministic report traces the same parent and rejects changed claims, facts, rules, sources or templates',()=>{
  for(const c of cases){
    const state=stateFor(c),value=run(state),report=explainM4WealthResourcePosition(value);
    assert.equal(validateM4WealthResourcePositionExplanation(report,value),true);
    const text=renderM4WealthResourcePositionText(report);assert.ok(text.length>100);assert.match(text,/재|인/);assert.match(text,/효력|성패|미평가/);
    assert.equal(report.candidates.length,value.candidates.length);
    for(let i=0;i<report.candidates.length;i++)for(const item of report.candidates[i].items){
      assert.ok(item.id&&item.templateId&&item.templateVersion&&item.text,c.id);
      assert.ok(item.inputFactRefs.length&&item.ruleRefs.length&&item.sourceRefs.length,c.id);
      for(const ref of item.inputFactRefs)assert.ok(state.m2Facts.candidates[i].facts.some(f=>f.id===ref),c.id+' fact');
      for(const ref of item.ruleRefs)assert.ok(value.rules.some(r=>r.id===ref),c.id+' rule');
      for(const ref of item.sourceRefs)assert.ok(value.sources.some(s=>s.id===ref),c.id+' source');
      for(const ref of item.calculationSourceRefs)assert.ok(state.evidence.candidates[i].evidence.some(e=>e.calculationSourceRefs.includes(ref)),c.id+' calculation source');
    }
  }
  const state=context([byId('synthetic-adjacent-wealth-year-resource-month').pillars,byId('synthetic-officer-and-day-between').pillars],['BAILU','BAILU']),value=run(state),report=explainM4WealthResourcePosition(value);
  for(const mutate of [
    r=>{r.candidates[0].items[0].text='재인 양불상애와 성격을 확정합니다.';},
    r=>{r.candidates[0].items[0].templateId='UNDEFINED_TEMPLATE';},
    r=>{r.candidates[0].items[0].inputFactRefs=[state.m2Facts.candidates[1].facts[0].id];},
    r=>{r.candidates[0].items[0].ruleRefs=['MISSING_RULE'];},
    r=>{r.candidates[0].items[0].sourceRefs=['MISSING_SOURCE'];},
    r=>{r.candidates[0].items[0].policyRefs=['UNSUPPORTED_POLICY'];},
    r=>{r.candidates[0].items[0].calculationSourceRefs=[state.evidence.candidates[1].monthContext.activeSince.sourceIds[0]];},
    r=>{delete r.candidates[0].items[0];},
    r=>{r.candidates[0].items.push(r.candidates[0].items[0]);},
  ]){const changed=structuredClone(report);mutate(changed);assert.throws(()=>validateM4WealthResourcePositionExplanation(changed,value));}
});

test('new project version does not fill old native versions or release actual efficacy and commercial gates',()=>{
  const state=stateFor(byId('literature-xue-day-master-only-between')),value=run(state);
  assert.equal(M4_POSITION_METADATA.id,M4_POSITION_PROFILE_ID);assert.equal(M4_POSITION_METADATA.version,'0.1.0');
  const originalNull=state.pattern.rules.filter(r=>r.runtimeVersion===null).map(r=>r.id);
  assert.ok(originalNull.length>0);assert.deepEqual(value.rules.filter(r=>r.runtimeVersion===null).map(r=>r.id),originalNull);
  assert.equal(state.evidence.validation.g0Receipt,null);assert.equal(state.evidence.validation.g1P2Promotion,false);
  assert.equal(first(state.pattern).effects.geCheng,'NOT_IMPLEMENTED');assert.equal(first(state.pattern).effects.geBai,'NOT_IMPLEMENTED');assert.equal(first(state.pattern).effects.jiuYing,'NOT_IMPLEMENTED');
  assert.equal(first(value).effects.status,'NOT_EVALUATED');
  const knownIds=new Set(cases.map(c=>c.id));
  for(const rule of M4_POSITION_METADATA.rules){assert.ok(rule.testCaseRefs.length>0,rule.id);for(const ref of rule.testCaseRefs){assert.ok(ref.startsWith('test/fixtures/m4-wealth-resource-position-cases.mjs#'),rule.id);assert.ok(knownIds.has(ref.slice(ref.indexOf('#')+1)),rule.id);}}
});
