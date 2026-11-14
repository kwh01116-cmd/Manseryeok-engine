import test from 'node:test';import assert from 'node:assert/strict';
import {scoreWeightedSupport,weightedSupportClass,validateWeightedSupport,WEIGHTED_SUPPORT_POLICY_ID as id} from '../dist/experimental/weightedSupportV1.js';
import {parseExperimentalWeightedArgs} from '../scripts/experimental/weighted-support.mjs';
const roles=['year','month','day','hour'];
const input=words=>({candidateRef:'chart.candidates[0]',pillars:words.map((v,i)=>({role:roles[i],stem:v[0],branch:v[1],factRef:`facts.candidates[0].pillars[${i}]`}))});
// Literal hand arithmetic frozen independently of scoreWeightedSupport output.
const cases=[
  {name:'four fire branches and unrooted resource',p:['丙午','癸巳','丙午','甲午'],score:85,label:'VERY_STRONG'},
  {name:'supportive month clash exactly once',p:['甲子','甲寅','甲申','甲子'],score:77,label:'STRONG'},
  {name:'local Hai excludes upstream hidden Wu',p:['戊子','辛亥','庚子','辛亥'],score:15,label:'VERY_WEAK'},
  {name:'all supportive positions',p:['甲寅','甲寅','甲寅','甲寅'],score:100,label:'VERY_STRONG'},
  {name:'unrooted peer half factor',p:['甲申','甲申','甲申','甲申'],score:15,label:'VERY_WEAK'},
  {name:'rooted resource retained independently',p:['壬申','甲申','甲申','甲申'],score:20,label:'WEAK'},
  {name:'month clash and actual resource root',p:['丙午','癸巳','丙午','乙亥'],score:72,label:'STRONG'},
  {name:'no automatic JiaJi transformation deletion',p:['甲寅','己巳','丙午','丁卯'],score:90,label:'VERY_STRONG'},
];
for(const c of cases)test('experimental weighted literal: '+c.name,()=>{const r=scoreWeightedSupport(input(c.p),{policyId:id});assert.equal(r.score.totalTenths,c.score);assert.equal(r.policyClassification,c.label);assert.equal(r.originalM3FinalStrength,'NOT_MODIFIED');assert.equal(r.originalM4Efficacy,'NOT_MODIFIED');assert.ok(r.policy.assumptions.includes('NO_UPSTREAM_AUTOMATIC_STEM_TRANSFORMATION_OR_CHARACTER_DELETION'));});
test('experimental score thresholds are exact and bounded, not probability',()=>{
 for(const [n,label]of [[0,'VERY_WEAK'],[19,'VERY_WEAK'],[20,'WEAK'],[39,'WEAK'],[40,'BALANCED'],[54,'BALANCED'],[55,'STRONG'],[84,'STRONG'],[85,'VERY_STRONG'],[100,'VERY_STRONG']])assert.equal(weightedSupportClass(n),label);
 for(const n of [-1,101,0.5,NaN,Infinity])assert.throws(()=>weightedSupportClass(n));
});
test('experimental pure input requires explicit policy, valid dense positions and same parent refs',()=>{
 const a=input(cases[0].p);assert.throws(()=>scoreWeightedSupport(a,{policyId:'wrong'}));
 for(const change of [x=>delete x.pillars[1],x=>x.pillars.pop(),x=>x.pillars[0].factRef='facts.candidates[1].pillars[0]',x=>x.pillars[0].stem='丙丙',x=>x.pillars[0].branch='卯',x=>x.pillars.reverse()]){const bad=structuredClone(a);change(bad);assert.throws(()=>scoreWeightedSupport(bad,{policyId:id}));}
});
test('experimental output is immutable and alterations are rejected without retaining requests',()=>{
 const a=input(cases[0].p),before=JSON.stringify(a),r=scoreWeightedSupport(a,{policyId:id});assert.equal(JSON.stringify(a),before);assert.ok(Object.isFrozen(r.decisionTrace[0].inputRefs));validateWeightedSupport(r,a,{policyId:id});const changed=structuredClone(r);changed.score.value=0;assert.throws(()=>validateWeightedSupport(changed,a,{policyId:id}));assert.deepEqual(scoreWeightedSupport(a,{policyId:id}),r);
});
test('experimental projection does not retain or freeze extra caller metadata',()=>{
 const a=input(cases[0].p);a.pillars[0].metadata={nested:{label:'caller-owned'}};
 const r=scoreWeightedSupport(a,{policyId:id});assert.equal(Object.hasOwn(r.inputFacts[0],'metadata'),false);assert.equal(Object.isFrozen(a.pillars[0].metadata.nested),false);
 a.pillars[0].metadata.nested.label='still mutable';assert.equal(a.pillars[0].metadata.nested.label,'still mutable');
});
test('experimental CLI never silently selects a policy or unknown arguments',()=>{
 assert.throws(()=>parseExperimentalWeightedArgs([]));assert.throws(()=>parseExperimentalWeightedArgs(['--experimental-policy',id,'--output','json','--unknown','1']));assert.throws(()=>parseExperimentalWeightedArgs(['--experimental-policy',id,'--experimental-policy',id,'--output','json']));
});
