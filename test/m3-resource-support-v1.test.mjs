// Explicit synthetic structural units; none is asserted to be a possible recorded birth.
import test from 'node:test';
import assert from 'node:assert/strict';
import {deriveM3Evidence,M3_EVIDENCE_PROFILE_ID} from '../dist/m3/structuralEvidenceV1.js';
import {deriveM3RootPresence,M3_ROOT_POLICY_ID} from '../dist/m3/rootPresenceV1.js';
import {
 M3_SUPPORT_POLICY_ID,M3_SUPPORT_POLICY_METADATA,deriveM3ResourceSupport,explainM3ResourceSupport,
 validateM3ResourceSupport,validateM3ResourceSupportExplanation,
 stemCombinationPartner,areStemCombinationPartners,
} from '../dist/m3/resourceSupportV1.js';
import {structuralM2Unit} from './fixtures/m3-structural-unit-input.mjs';
import {RESOURCE_SUPPORT_CASES,RESOURCE_SUPPORT_CASE_BASIS} from './fixtures/m3-resource-support-cases.mjs';
const stems=[...'甲乙丙丁戊己庚辛壬癸'],roles=['year','month','day','hour'];
const pairLiterals=['甲己','己甲','乙庚','庚乙','丙辛','辛丙','丁壬','壬丁','戊癸','癸戊'];
const resourceLiterals={甲:{壬:'偏印',癸:'正印'},乙:{壬:'正印',癸:'偏印'},丙:{甲:'偏印',乙:'正印'},丁:{甲:'正印',乙:'偏印'},戊:{丙:'偏印',丁:'正印'},己:{丙:'正印',丁:'偏印'},庚:{戊:'偏印',己:'正印'},辛:{戊:'正印',己:'偏印'},壬:{庚:'偏印',辛:'正印'},癸:{庚:'正印',辛:'偏印'}};
const byId=id=>RESOURCE_SUPPORT_CASES.find(c=>c.id===id);
function build(pillarSets,monthTerms=[]){
 const m2Facts=structuralM2Unit(pillarSets,{monthTerms}),evidence=deriveM3Evidence(m2Facts,{policyId:M3_EVIDENCE_PROFILE_ID});
 const root=deriveM3RootPresence(evidence,{policyId:M3_ROOT_POLICY_ID,m2Facts});
 const support=deriveM3ResourceSupport(evidence,{policyId:M3_SUPPORT_POLICY_ID,root,m2Facts});return {m2Facts,evidence,root,support};
}
const caseState=c=>build([c.pillars,...(c.secondPillars?[c.secondPillars]:[])],[c.monthTerm,...(c.secondMonthTerm?[c.secondMonthTerm]:[])]);
const decision=(r,role,i=0)=>r.candidates[i].resources.find(x=>x.resource.pillarRole===role);
function refs(value,sets){
 for(const [key,set]of Object.entries(sets))if(Object.hasOwn(value,key)){
  assert.ok(Array.isArray(value[key]));assert.equal(Object.keys(value[key]).length,value[key].length,'dense '+key);assert.equal(new Set(value[key]).size,value[key].length,'duplicate '+key);
  for(const id of value[key])assert.ok(set.has(id),key+' unresolved '+id);
 }
}

test('five literal stem pairs cover all100 ordered lookups, symmetry and invalid inputs',()=>{
 let yes=0,no=0;for(const a of stems)for(const b of stems){const expected=pairLiterals.includes(a+b);assert.equal(areStemCombinationPartners(a,b),expected,a+b);assert.equal(areStemCombinationPartners(a,b),areStemCombinationPartners(b,a));expected?yes++:no++;}
 assert.equal(yes,10);assert.equal(no,90);for(const pair of pairLiterals)assert.equal(stemCombinationPartner(pair[0]),pair[1]);
 for(const invalid of ['',null,undefined,'甲乙','X','甲 ']){assert.throws(()=>stemCombinationPartner(invalid));assert.throws(()=>areStemCombinationPartners('甲',invalid));}
});

test('twenty pre-resolver literal cases execute all supported decisions without deriving their expected answers',()=>{
 assert.equal(RESOURCE_SUPPORT_CASES.length,20);assert.equal(RESOURCE_SUPPORT_CASES.filter(c=>c.expectedRejection).length,3);
 assert.match(RESOURCE_SUPPORT_CASE_BASIS.expectationMethod,/NOT_RESOLVER_OUTPUT/);assert.match(RESOURCE_SUPPORT_CASE_BASIS.inputNature,/SYNTHETIC/);
 const observed=new Set();for(const c of RESOURCE_SUPPORT_CASES.filter(c=>!c.expectedRejection)){
  assert.ok(c.whyNotOther&&c.unchecked.length);const state=caseState(c),parent=state.support.candidates[0];assert.equal(parent.resources.length,c.expected.length,c.id);
  assert.equal(parent.selectedRuleDecision,c.expectedParentDecision??'ASSESSED_PER_RESOURCE',c.id);
  for(const expected of c.expected){const actual=decision(state.support,expected.resourceRole);assert.ok(actual,c.id);assert.equal(actual.resource.stem,expected.stem);assert.equal(actual.resourcePresence.tenGod,expected.tenGod);assert.equal(actual.rootPresence,expected.rootPresence);assert.deepEqual(actual.combinationPartners.map(p=>p.partner.pillarRole),expected.partnerRoles);assert.equal(actual.selectedRuleDecision,expected.decision,c.id);for(const reason of expected.reasonIncludes)assert.ok(actual.decisionReasons.includes(reason),c.id+' '+reason);observed.add(actual.selectedRuleDecision);
   if(expected.rootMatchTypesInclude){const target=state.root.candidates[0].targets.find(t=>t.id===actual.rootTargetRef);for(const type of expected.rootMatchTypesInclude)assert.ok(target.branches.some(b=>b.matches.some(m=>m.matchType===type)));}
   assert.equal(actual.totalSupportEfficacy,'NOT_EVALUATED');assert.equal(actual.finalStrength,'NOT_IMPLEMENTED');
  }
  if(c.expectedHiddenResource){const hidden=state.evidence.candidates[0].directionalGroups.TARGET_GENERATES_DAY_MASTER;assert.ok(hidden.some(l=>l.locationKind==='HIDDEN_STEM'&&l.pillarRole===c.expectedHiddenResource.role&&l.stem===c.expectedHiddenResource.stem));assert.equal(parent.resources.length,0);}
 }
 assert.deepEqual([...observed].sort(),['NO_HOLD_BY_THIS_RULE','OUT_OF_SCOPE_INTERACTION','ROOTED_COMBINATION_EFFECT_UNRESOLVED','SUPPORT_HELD_UNDER_SELECTED_RULE'].sort());
});

test('independent resource literals cover every daystem and visible stem and exclude unreachable day-partners',()=>{
 let resources=0;for(const day of stems)for(const visible of stems){
  const label=s=>s+(stems.indexOf(s)%2?'丑':'子');const state=build([[label(visible),'丙寅',label(day),'庚申']]);
  const actual=decision(state.support,'year'),expected=resourceLiterals[day][visible];assert.equal(Boolean(actual),Boolean(expected),day+'/'+visible);
  if(expected){resources++;assert.equal(actual.resourcePresence.tenGod,expected);assert.notEqual(actual.resource.pillarRole,'day');}
  for(const parent of state.support.candidates)for(const resource of parent.resources)assert.ok(resource.combinationPartners.every(p=>p.partner.pillarRole!=='day'),'valid resource cannot pair with daymaster');
 }
 assert.equal(resources,20);
});

test('only changing hidden root context changes the adjacent rule without moving its surface pair',()=>{
 const a=caseState(byId('adjacent-unrooted-zhengyin')),b=caseState(byId('adjacent-rooted-exact-zhengyin')),c=caseState(byId('adjacent-rooted-other-polarity'));
 const surface=s=>s.root.candidates[0].targets.map(t=>[t.target.pillarRole,t.target.stem]);assert.deepEqual(surface(a),surface(b));assert.deepEqual(surface(a),surface(c));
 const decisions=[a,b,c].map(s=>decision(s.support,'month'));assert.deepEqual(decisions.map(d=>d.combinationPartners.map(p=>[p.partner.pillarRole,p.partner.stem,p.adjacent,p.roleDistance])),[[['year','戊',true,1]],[['year','戊',true,1]],[['year','戊',true,1]]]);
 assert.deepEqual(decisions.map(d=>d.selectedRuleDecision),['SUPPORT_HELD_UNDER_SELECTED_RULE','ROOTED_COMBINATION_EFFECT_UNRESOLVED','ROOTED_COMBINATION_EFFECT_UNRESOLVED']);
 for(const state of[a,b,c])assert.equal(state.root.rootEfficacy,'NOT_EVALUATED');
});

test('all partners and competitors survive scope precedence even when a rooted exception also exists',()=>{
 const many=caseState(byId('multiple-partners-rooted')),r=decision(many.support,'month');
 assert.equal(r.selectedRuleDecision,'OUT_OF_SCOPE_INTERACTION');for(const reason of ['MULTIPLE_VISIBLE_COMBINATION_PARTNERS','REMOTE_OR_SEPARATED_PARTNER','RESOURCE_ROOT_PRESENT_UNDER_SELECTED_POLICY','ROOTED_EXCEPTION_EFFECT_NOT_EVALUATED'])assert.ok(r.decisionReasons.includes(reason));
 assert.deepEqual(r.combinationPartners.map(p=>p.partner.pillarRole),['year','hour']);
 const competed=caseState(byId('shared-partner-competition'));for(const d of competed.support.candidates[0].resources){assert.equal(d.combinationPartners.length,1);assert.equal(d.selectedRuleDecision,'OUT_OF_SCOPE_INTERACTION');assert.ok(d.decisionReasons.includes('COMPETING_SURFACE_RESOURCES'));assert.equal(d.combinationPartners[0].competingResourceLocationRefs.length,1);assert.notEqual(d.combinationPartners[0].competingResourceLocationRefs[0],d.resource.locationId);}
});

test('same candidate fact/member/root/policy/source chains remain complete and upstream data is retained',()=>{
 const state=caseState(byId('adjacent-rooted-exact-zhengyin')),snapshot=JSON.stringify({m2:state.m2Facts,m3:state.evidence,root:state.root}),value=state.support;
 assert.equal(validateM3ResourceSupport(value,{evidence:state.evidence,root:state.root,m2Facts:state.m2Facts}),true);
 const p=value.candidates[0],up=state.evidence.candidates[0],rp=state.root.candidates[0],facts=state.m2Facts.candidates[0].facts;
 const sets={inputEvidenceRefs:new Set(up.evidence.map(e=>e.id)),inputFactRefs:new Set(facts.map(f=>f.id)),inputMemberRefs:new Set(facts.filter(f=>f.kind==='HIDDEN_STEMS').flatMap(f=>f.value.members.map(m=>m.id))),rootJudgmentRefs:new Set(rp.targets.map(t=>t.id)),rootMatchRefs:new Set(rp.targets.flatMap(t=>t.branches.flatMap(b=>b.matches.map(m=>m.id)))),ruleRefs:new Set(value.rules.map(r=>r.id)),policyRefs:new Set([M3_SUPPORT_POLICY_ID,M3_ROOT_POLICY_ID,M3_EVIDENCE_PROFILE_ID,state.m2Facts.policyBundle.id,...Object.values(state.m2Facts.policyBundle.policies).map(p=>p.id)]),sourceRefs:new Set(value.sources.map(s=>s.id)),calculationSourceRefs:new Set(state.evidence.sources.map(s=>s.id))};
 refs(p,sets);for(const resource of p.resources){assert.equal(resource.resource.candidateRef,p.candidateRef);refs(resource,sets);for(const partner of resource.combinationPartners){assert.equal(partner.partner.candidateRef,p.candidateRef);refs(partner,sets);}}
 const explanation=explainM3ResourceSupport(value);assert.equal(validateM3ResourceSupportExplanation(explanation,value),true);for(const item of explanation.candidates[0].items){assert.equal(item.candidateRef,p.candidateRef);refs(item,sets);assert.ok(item.judgmentRefs.length>0);assert.ok(item.judgmentRefs.every(id=>id===p.id||p.resources.some(d=>d.id===id)));}
 assert.equal(JSON.stringify({m2:state.m2Facts,m3:state.evidence,root:state.root}),snapshot);assert.equal(value.totalSupportEfficacy,'NOT_EVALUATED');assert.equal(value.finalStrength.status,'NOT_IMPLEMENTED');
 assert.ok(state.root.rules.some(r=>r.runtimeVersion===null),'upstream native null versions remain native');
});

test('missing roots, cross-candidate roots and forged day-resource inputs reject instead of fabricating absence',()=>{
 for(const c of RESOURCE_SUPPORT_CASES.filter(c=>c.expectedRejection)){
  const state=caseState(c),copy=structuredClone(state.root),kind=c.invalidMutation.kind;
  if(kind==='CROSS_CANDIDATE_ROOT_TARGET'){copy.candidates[0].targets[1]=copy.candidates[1].targets[1];}
  else if(kind==='OMIT_RESOURCE_ROOT_TARGET'){copy.candidates[0].targets.splice(1,1);}
  else if(kind==='FORGE_DAY_AS_RESOURCE_OR_RESOURCE_PARTNER'){copy.candidates[0].targets[2].target.tenGod='正印';copy.candidates[0].targets[2].target.stem='戊';}
  else assert.fail('Unknown pre-resolver rejection case '+kind);
  assert.throws(()=>deriveM3ResourceSupport(state.evidence,{policyId:M3_SUPPORT_POLICY_ID,root:copy,m2Facts:state.m2Facts}),c.id);
 }
 const state=caseState(byId('adjacent-unrooted-zhengyin'));for(const id of [undefined,'','AUTO','UNREVIEWED_RULE'])assert.throws(()=>deriveM3ResourceSupport(state.evidence,{policyId:id,root:state.root,m2Facts:state.m2Facts}));
 assert.throws(()=>deriveM3ResourceSupport(state.evidence,{policyId:M3_SUPPORT_POLICY_ID,m2Facts:state.m2Facts}));
 const other=caseState(byId('adjacent-unrooted-zhengyin'));assert.throws(()=>deriveM3ResourceSupport(state.evidence,{policyId:M3_SUPPORT_POLICY_ID,root:other.root,m2Facts:state.m2Facts}));
 const impossible=structuralM2Unit([['丙午','癸巳','戊午','甲寅']]);const f=impossible.candidates[0].facts.find(f=>f.kind==='VISIBLE_TEN_GOD'&&f.value.role==='month');assert.notEqual(f.value.tenGod,'正印');f.value.tenGod='正印';impossible.candidates[0].pillars[1].visibleTenGod='正印';assert.throws(()=>deriveM3Evidence(impossible,{policyId:M3_EVIDENCE_PROFILE_ID}),'a day-pair is not made a valid resource by relabelling');
});

test('new explanations remain deterministic, reject invented efficacy and trace no-target decisions',()=>{
 const state=caseState(byId('no-partner-unrooted')),view=explainM3ResourceSupport(state.support);assert.deepEqual(explainM3ResourceSupport(state.support),view);
 assert.match(JSON.stringify(view),/NO_HOLD_BY_THIS_RULE|이번.*제한|이번.*유보|채택 제한/);assert.match(JSON.stringify(view),/NOT_EVALUATED|아직.*평가|전체.*평가|전체.*효력/);
 for(const mutate of [v=>{v.candidates[0].items[0].text='무근이므로 인성이 무효이며 신약입니다.';},v=>{v.candidates[0].items[0].judgmentRefs=['MISSING_DECISION'];},v=>{v.candidates[0].items[0].sourceRefs=['MISSING_SOURCE'];},v=>{v.candidates[0].items[0].inputFactRefs=['MISSING_FACT'];},v=>{delete v.candidates[0].items[0];},v=>{v.candidates[0].items.push(v.candidates[0].items[0]);},v=>{v.candidates[0].items[0].templateId='UNDEFINED_TEMPLATE';}]){const forged=structuredClone(view);mutate(forged);assert.throws(()=>validateM3ResourceSupportExplanation(forged,state.support));}
 const none=caseState(byId('hidden-resource-only')),noneView=explainM3ResourceSupport(none.support);assert.equal(none.support.candidates[0].selectedRuleDecision,'NOT_APPLICABLE');assert.ok(noneView.candidates[0].items.some(i=>i.judgmentRefs.includes(none.support.candidates[0].id)));assert.ok(!noneView.candidates[0].items.some(i=>i.text.includes('명식 전체에 인성이 없습니다')));
});

test('immutable results, unrelated metadata and later requests cannot change original decisions',()=>{
 const state=caseState(byId('adjacent-unrooted-zhengyin')),before=JSON.stringify(state.support);
 assert.throws(()=>{state.support.candidates[0].resources[0].selectedRuleDecision='NO_HOLD_BY_THIS_RULE';},TypeError);
 assert.throws(()=>{state.support.candidates[0].resources[0].combinationPartners.push({});},TypeError);
 const forged=structuredClone(state.support);forged.candidates[0].resources[0].totalSupportEfficacy='EFFECTIVE';assert.throws(()=>validateM3ResourceSupport(forged));
 assert.equal(state.support.totalSupportEfficacy,'NOT_EVALUATED');assert.equal(state.support.finalStrength.status,'NOT_IMPLEMENTED');
 assert.deepEqual(caseState(byId('parallel-seasonal-alternatives')).support,state.support);
 state.m2Facts.candidates[0].pillars[0].stem='丙';assert.equal(JSON.stringify(state.support),before);assert.deepEqual(caseState(byId('adjacent-unrooted-zhengyin')).support,state.support);
});

test('mutable original M2 tampering after root issuance is rejected by a new support call and stays isolated',()=>{
 const fact=(s,kind)=>s.m2Facts.candidates[0].facts.find(f=>f.kind===kind&&f.value.role==='month');
 const mutations=[
  ['visible source reference',s=>fact(s,'PILLAR_NATURE').sourceRefs.push('MISSING_SOURCE')],
  ['visible policy reference',s=>fact(s,'PILLAR_NATURE').policyRefs.push('MISSING_POLICY')],
  ['hidden member source reference',s=>fact(s,'HIDDEN_STEMS').value.members[0].sourceRefs.push('MISSING_SOURCE')],
  ['hidden member policy reference',s=>fact(s,'HIDDEN_STEMS').value.members[0].policyRefs.push('MISSING_POLICY')],
  ...['ruleRefs','policyRefs','sourceRefs'].map(key=>['empty hidden member '+key,s=>{fact(s,'HIDDEN_STEMS').value.members[0][key]=[];}]),
  ...['ruleRefs','policyRefs','sourceRefs'].map(key=>['removed hidden member '+key,s=>{fact(s,'HIDDEN_STEMS').value.members[0][key]=fact(s,'HIDDEN_STEMS').value.members[0][key].slice(1);}]),
  ['hidden member content',s=>{fact(s,'HIDDEN_STEMS').value.members[0].stem='丁';}],
  ['sparse original facts',s=>{delete s.m2Facts.candidates[0].facts[0];}],
  ['sparse original hidden members',s=>{delete fact(s,'HIDDEN_STEMS').value.members[0];}],
  ['duplicate original hidden member',s=>{const h=fact(s,'HIDDEN_STEMS');h.value.members.push(h.value.members[0]);}],
  ['foreign fact candidate',s=>{fact(s,'PILLAR_NATURE').candidateRef='chart.candidates[1]';}],
 ];
 for(const [label,mutate]of mutations){
  const state=caseState(byId('adjacent-unrooted-zhengyin')),issued=JSON.stringify(state.support);mutate(state);
  assert.throws(()=>deriveM3ResourceSupport(state.evidence,{policyId:M3_SUPPORT_POLICY_ID,root:state.root,m2Facts:state.m2Facts}),label);
  assert.throws(()=>validateM3ResourceSupport(state.support,{evidence:state.evidence,root:state.root,m2Facts:state.m2Facts}),label+' cannot validate earlier issuance against changed mutable inputs');
  assert.equal(JSON.stringify(state.support),issued,'already-issued immutable output is retained');
  const next=caseState(byId('adjacent-unrooted-zhengyin'));assert.equal(decision(next.support,'month').selectedRuleDecision,'SUPPORT_HELD_UNDER_SELECTED_RULE');assert.equal(validateM3ResourceSupport(next.support,{evidence:next.evidence,root:next.root,m2Facts:next.m2Facts}),true);
 }
 // Generic structural M3 keeps its existing contract; the selected support input requires these references.
 for(const key of ['ruleRefs','policyRefs','sourceRefs']){
  const m2Facts=structuralM2Unit([['戊午','癸巳','甲午','丙寅']],{monthTerms:['LIXIA']});
  m2Facts.candidates[0].facts.find(f=>f.kind==='HIDDEN_STEMS'&&f.value.role==='month').value.members[0][key]=[];
  const evidence=deriveM3Evidence(m2Facts,{policyId:M3_EVIDENCE_PROFILE_ID}),root=deriveM3RootPresence(evidence,{policyId:M3_ROOT_POLICY_ID,m2Facts});
  assert.throws(()=>deriveM3ResourceSupport(evidence,{policyId:M3_SUPPORT_POLICY_ID,root,m2Facts}),'initially empty native '+key+' is not silently accepted');
 }
});
