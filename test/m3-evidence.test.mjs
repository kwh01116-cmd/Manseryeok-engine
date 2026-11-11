// Finite STRUCTURAL_UNIT_NOT_REAL_BIRTH cases. No calendar or predictive certification.
import test from 'node:test';
import assert from 'node:assert/strict';
import {deriveM3Evidence,explainM3Evidence,validateM3Evidence,validateM3EvidenceExplanation,M3_EVIDENCE_PROFILE_ID} from '../dist/m3/structuralEvidenceV1.js';
import {structuralM2Unit} from './fixtures/m3-structural-unit-input.mjs';

const stems=[...'甲乙丙丁戊己庚辛壬癸'],branches=[...'子丑寅卯辰巳午未申酉戌亥'];
const element={甲:'WOOD',乙:'WOOD',丙:'FIRE',丁:'FIRE',戊:'EARTH',己:'EARTH',庚:'METAL',辛:'METAL',壬:'WATER',癸:'WATER'};
const hidden={子:[...'癸'],丑:[...'己癸辛'],寅:[...'甲丙戊'],卯:[...'乙'],辰:[...'戊乙癸'],巳:[...'丙庚戊'],午:[...'丁己'],未:[...'己丁乙'],申:[...'庚壬戊'],酉:[...'辛'],戌:[...'戊辛丁'],亥:[...'壬甲']};
// Separate literal five-element directional expectations, not values obtained from the target.
const relation={
  WOOD:{WOOD:'SAME',FIRE:'DAY_MASTER_GENERATES',EARTH:'DAY_MASTER_CONTROLS',METAL:'TARGET_CONTROLS_DAY_MASTER',WATER:'TARGET_GENERATES_DAY_MASTER'},
  FIRE:{WOOD:'TARGET_GENERATES_DAY_MASTER',FIRE:'SAME',EARTH:'DAY_MASTER_GENERATES',METAL:'DAY_MASTER_CONTROLS',WATER:'TARGET_CONTROLS_DAY_MASTER'},
  EARTH:{WOOD:'TARGET_CONTROLS_DAY_MASTER',FIRE:'TARGET_GENERATES_DAY_MASTER',EARTH:'SAME',METAL:'DAY_MASTER_GENERATES',WATER:'DAY_MASTER_CONTROLS'},
  METAL:{WOOD:'DAY_MASTER_CONTROLS',FIRE:'TARGET_CONTROLS_DAY_MASTER',EARTH:'TARGET_GENERATES_DAY_MASTER',METAL:'SAME',WATER:'DAY_MASTER_GENERATES'},
  WATER:{WOOD:'DAY_MASTER_GENERATES',FIRE:'DAY_MASTER_CONTROLS',EARTH:'TARGET_CONTROLS_DAY_MASTER',METAL:'TARGET_GENERATES_DAY_MASTER',WATER:'SAME'},
};
const derive=input=>deriveM3Evidence(input,{policyId:M3_EVIDENCE_PROFILE_ID});
const one=input=>derive(input).candidates[0];
const atoms=candidate=>Object.values(candidate.directionalGroups).flat();
const yearHidden=candidate=>atoms(candidate).filter(a=>a.pillarRole==='year'&&a.locationKind==='HIDDEN_STEM').sort((a,b)=>a.index-b.index);
const glyph=p=>p.stem+p.branch;

test('M3 evidence is explicitly incomplete and preserves open upstream versions and source gates',()=>{
  const input=structuralM2Unit(),result=derive(input);assert.equal(result.status,'EVIDENCE_ONLY');assert.equal(result.finalStrength.status,'NOT_IMPLEMENTED');
  assert.equal(result.finalStrength.releaseGate,'M3_FINAL_BLOCKED_UNCHANGED');assert.doesNotThrow(()=>validateM3Evidence(result));
  assert.equal(result.candidates.length,1);assert.equal(result.candidates[0].candidateRef,'chart.candidates[0]');
  const native=input.rules.filter(r=>r.id.startsWith('M2-RULE-BRANCH-')&&r.id!=='M2-RULE-BRANCH-TEN-GODS-001'||r.id.startsWith('M2-RULE-TRIAD-'));
  assert.equal(native.length,7);
  for(const original of native){assert.equal(original.runtimeVersion,null);assert.equal(result.rules.find(r=>r.id===original.id).runtimeVersion,null);}
  for(const source of input.sources.filter(s=>s.kind==='M2_RULE_SOURCE_RECORD'))assert.deepEqual(result.sources.find(s=>s.id===source.id),source);
  for(const key of ['score','strengthScore','strengthGrade','yongshen','geju','fortune','prediction'])assert.equal(Object.hasOwn(result,key),false);
});

test('all ten day stems and ten visible targets retain independent five-direction classification',()=>{
  let checked=0;
  for(const dm of stems)for(const target of stems){
    const targetBranch=stems.indexOf(target)%2?'丑':'子',dayBranch=stems.indexOf(dm)%2?'丑':'子';
    const input=structuralM2Unit([[target+targetBranch,'丙寅',dm+dayBranch,'壬申']]),candidate=one(input);
    const actual=atoms(candidate).filter(a=>a.pillarRole==='year'&&a.locationKind==='VISIBLE_STEM');assert.equal(actual.length,1);
    const expected=relation[element[dm]][element[target]];
    assert.equal(actual[0].relation,expected,dm+'→'+target);assert.equal(actual[0].stem,target);assert.equal(actual[0].element,element[target]);
    assert.ok(candidate.directionalGroups[expected].some(a=>a.locationId===actual[0].locationId));checked++;
  }
  assert.equal(checked,100);
});

test('all ten day stems across twelve hidden branches separate exact characters from different same-element stems',()=>{
  let checked=0;
  for(const dm of stems)for(const branch of branches){
    const yearStem=branches.indexOf(branch)%2?'乙':'甲',dayBranch=stems.indexOf(dm)%2?'丑':'子';
    const candidate=one(structuralM2Unit([[yearStem+branch,'丙寅',dm+dayBranch,'壬申']]));
    const observed=yearHidden(candidate);assert.deepEqual(observed.map(a=>a.stem),hidden[branch],dm+'/'+branch);
    assert.deepEqual(observed.map(a=>a.position),hidden[branch].map((_,i)=>i===0?'MAIN_QI':'OTHER'));
    assert.deepEqual(observed.map(a=>a.index),hidden[branch].map((_,i)=>i));
    assert.deepEqual(candidate.rootCandidates.exactStem.filter(a=>a.pillarRole==='year').map(a=>a.stem),hidden[branch].filter(stem=>stem===dm));
    assert.deepEqual(candidate.rootCandidates.sameElementDifferentStem.filter(a=>a.pillarRole==='year').map(a=>a.stem),hidden[branch].filter(stem=>stem!==dm&&element[stem]===element[dm]));
    assert.ok(observed.length>=1,'every supported branch has real hidden members; absence of a root is not an empty branch');checked++;
  }
  assert.equal(checked,120);
});

test('directional groups partition distinct locations, excluding visible day self but preserving hidden day members',()=>{
  const input=structuralM2Unit([['甲子','乙卯','甲寅','丙午']]),candidate=one(input),all=atoms(candidate);
  const expectedHidden=1+1+3+2;
  assert.equal(all.length,3+expectedHidden);assert.equal(new Set(all.map(a=>a.locationId)).size,all.length);
  assert.ok(!all.some(a=>a.locationKind==='VISIBLE_STEM'&&a.pillarRole==='day'));
  assert.ok(all.some(a=>a.locationKind==='HIDDEN_STEM'&&a.pillarRole==='day'&&a.stem==='甲'));
  assert.deepEqual(candidate.rootCandidates.exactStem.map(a=>[a.pillarRole,a.stem,a.position]),[['day','甲','MAIN_QI']]);
  assert.deepEqual(candidate.rootCandidates.sameElementDifferentStem.map(a=>[a.pillarRole,a.stem,a.position]),[['month','乙','MAIN_QI']]);
  assert.equal(candidate.monthContext.principalHiddenMember.position,'MAIN_QI');assert.equal(candidate.monthContext.principalHiddenMember.stem,'乙');
  for(const value of [candidate.rootCandidates,candidate.monthContext.principalHiddenMember,...all])for(const key of ['weight','strength','strengthScore','rootValidity','rootEffectiveness'])assert.equal(Object.hasOwn(value,key),false);
});

test('hidden-visible links require exact stem characters and retain every repeated visible position including day',()=>{
  const candidate=one(structuralM2Unit([['甲子','乙卯','甲寅','丙午']])),links=candidate.hiddenVisibleLinks;
  assert.equal(links.length,4);
  assert.deepEqual(links.filter(l=>l.stem==='甲').map(l=>l.visible.pillarRole),['year','day']);
  assert.deepEqual(links.filter(l=>l.stem==='乙').map(l=>l.visible.pillarRole),['month']);
  assert.deepEqual(links.filter(l=>l.stem==='丙').map(l=>l.visible.pillarRole),['hour']);
  for(const link of links){assert.equal(link.match,'EXACT_STEM_CHARACTER_ONLY');assert.equal(link.hidden.stem,link.visible.stem);assert.equal(link.stem,link.hidden.stem);assert.equal(link.assessment,'UNRESOLVED');assert.ok(link.inputFactRefs.length>0);assert.ok(link.inputMemberRefs.length>0);}
  assert.ok(!links.some(l=>l.hidden.stem==='甲'&&l.visible.stem==='乙'),'same element cannot substitute for exact-stem matching');
  assert.equal(new Set(links.map(l=>l.id)).size,links.length);
  const repeated=one(structuralM2Unit([['甲子','甲子','甲寅','丙午']]));
  assert.deepEqual(repeated.hiddenVisibleLinks.filter(l=>l.stem==='甲').map(l=>l.visible.pillarRole),['year','month','day']);
  assert.equal(repeated.directionalGroups.SAME.filter(a=>a.locationKind==='VISIBLE_STEM').length,2);
});

test('same total element membership does not erase a different month pillar or applied-Jie context',()=>{
  const sets=[['甲辰','丙戌','甲寅','壬子'],['甲戌','丙辰','甲寅','壬子']];
  const total=pillars=>{const values=pillars.flatMap(p=>[p[0],...hidden[p[1]]]);return Object.fromEntries(['WOOD','FIRE','EARTH','METAL','WATER'].map(e=>[e,values.filter(s=>element[s]===e).length]));};
  assert.deepEqual(total(sets[0]),total(sets[1]));
  const a=one(structuralM2Unit([sets[0]],{monthTerms:['HANLU']})),b=one(structuralM2Unit([sets[1]],{monthTerms:['QINGMING']}));
  assert.equal(glyph(a.monthContext.monthPillar),'丙戌');assert.equal(glyph(b.monthContext.monthPillar),'丙辰');
  assert.equal(a.monthContext.activeSince.term,'HANLU');assert.equal(b.monthContext.activeSince.term,'QINGMING');
  assert.equal(a.monthContext.representativeBranchNature.principalElement,'EARTH');assert.equal(b.monthContext.representativeBranchNature.principalElement,'EARTH');
  assert.notDeepEqual(a.monthContext.hiddenMembers.map(x=>x.stem),b.monthContext.hiddenMembers.map(x=>x.stem));
  assert.equal(a.monthContext.season.status,'UNRESOLVED');assert.equal(b.monthContext.season.status,'UNRESOLVED');
  assert.deepEqual(Object.fromEntries(Object.entries(a.directionalGroups).map(([k,v])=>[k,v.length])),Object.fromEntries(Object.entries(b.directionalGroups).map(([k,v])=>[k,v.length])));
  for(const [set,term]of [[sets[0],'HANLU'],[sets[1],'QINGMING']]){
    const view=explainM3Evidence(derive(structuralM2Unit([set],{monthTerms:[term]}))),text=view.candidates[0].items.find(item=>item.templateId==='KO_M3_MONTH_CONTEXT').text;
    assert.match(text,/대표 오행은 토/);assert.ok(!text.includes('undefined'));
  }
});

test('overlapping raw relations, repeated positional pairs and complete/partial triads remain limiting contexts only',()=>{
  const input=structuralM2Unit([['乙巳','庚申','甲寅','乙亥']]),candidate=one(input);
  assert.deepEqual(candidate.relationContext.pairs,input.candidates[0].branchRelations);assert.deepEqual(candidate.relationContext.triads,input.candidates[0].triadMemberships);
  assert.deepEqual(candidate.relationContext.pairs.filter(r=>r.leftPillarRole==='year'&&r.rightPillarRole==='month').map(r=>r.kind),['LIUHE','LIUPO','XING']);
  assert.equal(candidate.relationContext.effectStatus,'UNRESOLVED');assert.ok(atoms(candidate).length>0,'relations must not delete other evidence locations');
  const four=one(structuralM2Unit([['甲辰','丙辰','甲辰','壬辰']]));assert.equal(four.relationContext.pairs.filter(r=>r.kind==='XING').length,6);
  const full=one(structuralM2Unit([['甲寅','丙午','甲戌','壬午']]));
  const fire=full.relationContext.triads.find(t=>t.definitionId==='SANHE_FIRE');assert.equal(fire.status,'THREE_DISTINCT_MEMBERS');assert.deepEqual(fire.members.find(m=>m.branch==='午').pillarRoles,['month','hour']);
  const none=one(structuralM2Unit([['甲子','丙子','甲子','壬子']]));assert.deepEqual(none.relationContext.pairs,[]);assert.deepEqual(none.relationContext.triads,[]);
});

test('missing hidden data, duplicate positions and candidate/fact/rule/source corruption are explicit errors',()=>{
  const fresh=()=>structuralM2Unit([['甲子','乙卯','甲寅','丙午'],['乙丑','丁卯','乙卯','癸酉']]);
  for(const mutate of [
    x=>{x.candidates[0].facts.find(f=>f.kind==='HIDDEN_STEMS').value.members=[];},
    x=>{x.candidates[0].facts.push(structuredClone(x.candidates[0].facts[0]));},
    x=>{x.candidates[0].facts[0].candidateRef='chart.candidates[1]';},
    x=>{x.candidates[0].facts[0].ruleRefs=['MISSING_RULE'];},
    x=>{x.candidates[0].facts[0].sourceRefs=['MISSING_SOURCE'];},
    x=>{x.candidates[0].facts[0].calculationSourceRefs=['MISSING_CALENDAR_REFERENCE'];},
    x=>{x.candidates[0].facts.find(f=>f.kind==='HIDDEN_STEMS').value.members[0].candidateRef='chart.candidates[1]';},
    x=>{x.candidates[0].facts.find(f=>f.kind==='HIDDEN_STEMS').value.members[0].memberRef='facts.candidates[1].pillars[0].branchTenGods.members[0]';},
    x=>{x.candidates[0].facts=x.candidates[0].facts.filter(f=>f.kind!=='DAY_MASTER');},
    x=>{x.rules.push(structuredClone(x.rules[0]));},
    x=>{x.sources.push(structuredClone(x.sources[0]));},
  ]){const bad=fresh();mutate(bad);assert.throws(()=>derive(bad));}
  for(const id of [undefined,'','AUTO','M3_FINAL_STRENGTH'])assert.throws(()=>deriveM3Evidence(fresh(),{policyId:id}));
});

test('candidate-specific evidence and deterministic templates reject cross-candidate or broken references',()=>{
  const result=derive(structuralM2Unit([['甲子','乙卯','甲寅','丙午'],['乙丑','丁卯','乙卯','癸酉']])),view=explainM3Evidence(result);
  assert.equal(view.candidates.length,2);assert.equal(result.candidates[0].dayMaster,'甲');assert.equal(result.candidates[1].dayMaster,'乙');
  assert.doesNotThrow(()=>validateM3EvidenceExplanation(view,result));
  const allIds=result.candidates.flatMap(c=>c.evidence.map(e=>e.id));assert.equal(new Set(allIds).size,allIds.length);
  for(let i=0;i<2;i++){assert.equal(view.candidates[i].candidateRef,'chart.candidates['+i+']');assert.ok(view.candidates[i].items.length>0);for(const item of view.candidates[i].items)assert.ok(item.evidenceRefs.every(id=>result.candidates[i].evidence.some(e=>e.id===id)));}
  for(const mutate of [
    v=>{v.candidates[0].candidateRef='chart.candidates[1]';},
    v=>{v.candidates[0].items[0].evidenceRefs=[v.candidates[1].items[0].evidenceRefs[0]];},
    v=>{v.candidates[0].items[0].evidenceRefs=['MISSING_EVIDENCE'];},
    v=>{v.candidates[0].items[0].ruleRefs=['MISSING_RULE'];},
    v=>{v.candidates[0].items[0].sourceRefs=['MISSING_SOURCE'];},
    v=>{v.candidates[0].items[0].policyRefs=['MISSING_POLICY'];},
    v=>{v.candidates[0].items[0].templateId='MISSING_TEMPLATE';},
    v=>{v.candidates[0].items[0].text='이 사주는 신강이며 미래 사건이 확정됩니다.';},
  ]){const bad=structuredClone(view);mutate(bad);assert.throws(()=>validateM3EvidenceExplanation(bad,result));}
});

test('input/output changes cannot contaminate later requests or convert evidence into a strength conclusion',()=>{
  const input=structuralM2Unit(),before=JSON.stringify(input),result=derive(input),snapshot=JSON.stringify(result);
  assert.equal(JSON.stringify(input),before);assert.equal(Object.isFrozen(result),true);assert.ok(result.candidates.every(Object.isFrozen));
  assert.throws(()=>{result.candidates[0].dayMaster='癸';},TypeError);
  try{input.candidates[0].dayMaster='癸';}catch(error){assert.ok(error instanceof TypeError);}
  assert.equal(JSON.stringify(result),snapshot);
  const next=derive(structuralM2Unit());assert.deepEqual(next,result);assert.deepEqual(explainM3Evidence(next),explainM3Evidence(result));
  assert.equal(next.status,'EVIDENCE_ONLY');assert.equal(next.finalStrength.status,'NOT_IMPLEMENTED');
});
