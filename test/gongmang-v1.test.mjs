import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {GONGMANG_POLICY_ID,gongmangForDayPillar,deriveGongmang,validateGongmang,matchGongmangBranches,explainGongmang} from '../dist/domain/gongmangV1.js';
import {GONGMANG_60_EXPECTED} from './fixtures/gongmang-monthly-expectations-v1.mjs';
const parent='chart.candidates[0]',pillar=text=>({stem:text[0],branch:text[1]}),roles=['year','month','day','hour'];
const input=(texts=['甲戌','乙亥','甲子','丙寅'])=>({candidateRef:parent,pillars:texts.map((p,i)=>({...pillar(p),role:roles[i],factRef:parent+'#nature['+i+']'})),policyId:GONGMANG_POLICY_ID,calculationPolicyRefs:['CIVIL_MIDNIGHT','SELECTED_DAY_PILLAR']});

test('all sixty day-xun expectations were fixed independently before resolver implementation',()=>{
  const bytes=readFileSync(new URL('./fixtures/gongmang-monthly-expectations-v1.mjs',import.meta.url),'utf8').replace(/\r\n/g,'\n');
  assert.equal(createHash('sha256').update(bytes).digest('hex'),'23a1ac028c19a775a6103eac3cf0d268e4b95ae2b0eaf61a44853c4f12fcced3');
  assert.equal(GONGMANG_60_EXPECTED.length,60);assert.equal(new Set(GONGMANG_60_EXPECTED.map(r=>r[0])).size,60);
  const xunStarts=['甲子','甲戌','甲申','甲午','甲辰','甲寅'];
  GONGMANG_60_EXPECTED.forEach(([day,expected],i)=>{const r=gongmangForDayPillar({dayPillar:pillar(day),policyId:GONGMANG_POLICY_ID});assert.equal(r.voidBranches.join(''),expected,day);assert.equal(r.xunStart.stem+r.xunStart.branch,xunStarts[Math.floor(i/10)]);assert.equal(r.dayIndex,i);assert.ok(!r.voidBranches.includes(day[1]));assert.equal(r.efficacy,'NOT_EVALUATED');});
});
test('natal matching preserves four positions, repetition and selected day policy without efficacy',()=>{
  const r=deriveGongmang(input());assert.equal(validateGongmang(r,input()),true);assert.deepEqual(r.targets.map(t=>t.presence),['PRESENT_UNDER_POLICY','PRESENT_UNDER_POLICY','ABSENT_UNDER_POLICY','ABSENT_UNDER_POLICY']);
  assert.deepEqual(r.voidBranches,['戌','亥']);assert.deepEqual(r.dayPillar,{stem:'甲',branch:'子'});assert.equal(r.observedMatches.length,2);assert.match(explainGongmang(r),/연지 戌·월지 亥/);assert.match(explainGongmang(r),/실제 길흉이나 작용을 판정하지 않습니다/);
  const repeated=deriveGongmang(input(['甲戌','乙亥','甲子','丙戌']));assert.equal(repeated.observedMatches.length,3);assert.notEqual(repeated.targets[0].id,repeated.targets[3].id);
  assert.equal(validateGongmang(r,{calculationPolicyRefs:input().calculationPolicyRefs,policyId:GONGMANG_POLICY_ID,pillars:input().pillars,candidateRef:parent}),true,'object property order is not a policy');
});
test('temporal references stay separate from natal pillars and never become event forecasts',()=>{
  const r=deriveGongmang(input()),targets=[{locationKind:'DA_YUN',locationRef:'dayun.entries[0]',branch:'戌'},{locationKind:'SE_YUN',locationRef:'seyun.yearLabel',branch:'子'},{locationKind:'MONTHLY',locationRef:'monthly.rows[2]',branch:'亥'}];
  const out=matchGongmangBranches(r,targets);assert.deepEqual(out.map(x=>x.presence),['PRESENT_UNDER_POLICY','ABSENT_UNDER_POLICY','PRESENT_UNDER_POLICY']);assert.ok(out.every(x=>x.candidateRef===parent&&x.efficacy==='NOT_EVALUATED'));assert.equal(r.targets.length,4);assert.throws(()=>matchGongmangBranches(r,[targets[0],targets[0]]));
  assert.throws(()=>matchGongmangBranches(r,[{...targets[0],candidateRef:'chart.candidates[1]'}]));assert.throws(()=>matchGongmangBranches(r,[{...targets[0],efficacy:'EFFECTIVE'}]));
});
test('invalid pillars, absent fields, sparse lists, wrong parent and duplicate references reject',()=>{
  for(const policyId of [undefined,'AUTO','day'])assert.throws(()=>gongmangForDayPillar({dayPillar:pillar('甲子'),policyId}));
  for(const day of ['甲丑','天子','甲天'])assert.throws(()=>gongmangForDayPillar({dayPillar:pillar(day),policyId:GONGMANG_POLICY_ID}));
  for(const mutate of [i=>i.pillars.pop(),i=>delete i.pillars[1],i=>i.pillars[0].role='day',i=>i.pillars[0].factRef='chart.candidates[1]#nature[0]',i=>i.pillars[0].factRef='ghost',i=>i.pillars[1].factRef=i.pillars[0].factRef,i=>delete i.pillars,i=>i.calculationPolicyRefs=[,]]){const i=input();mutate(i);assert.throws(()=>deriveGongmang(i));}
});
test('pure issued results are immutable and reject serialized substitution and foreign input contexts',()=>{
  const i=input(),r=deriveGongmang(i);i.pillars[0].branch='子';assert.equal(r.targets[0].branch,'戌');assert.throws(()=>validateGongmang(r,i));assert.throws(()=>validateGongmang(structuredClone(r)));assert.throws(()=>{r.targets[0].presence='ABSENT_UNDER_POLICY';});assert.equal(validateGongmang(r,input()),true);
});
