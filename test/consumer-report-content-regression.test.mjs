import test from 'node:test';
import assert from 'node:assert/strict';
import {buildConsumerReport,renderConsumerReport,CONSUMER_REPORT_PROFILE_ID} from '../dist/report/consumerReportV1.js';
import {makeConsumerProjection} from './fixtures/consumer-report-projection-v1.mjs';
const build=p=>buildConsumerReport(p,{profileId:CONSUMER_REPORT_PROFILE_ID});
const value=(p,key)=>p.evidence.find(e=>e.id===p.candidates[0].refs[key]);

test('peer exposure competition is retained even when the eight-pattern candidate list has only one type',()=>{
 const p=makeConsumerProjection(),v=value(p,'pattern').value;
 v.exposures=[{stem:'壬',role:'year',type:'偏印'}];
 v.competingExposures=[{stem:'甲',role:'hour',type:'比肩'}];
 const r=build(p),c=r.interpretationClaims.find(c=>c.templateId==='pattern');
 assert.deepEqual(v.candidateTypes,['偏印']);
 assert.match(c.text,/시간 甲의 비견 투출/);assert.match(c.text,/단독 격 선정은 보류/);
 assert.match(c.text,/여덟 내격 밖/);
 assert.match(r.interpretationClaims.find(c=>c.templateId==='conclusion').text,/다른 월령 장간 투출의 경쟁·보류/);
 assert.equal(value(p,'pattern').value.candidateTypes.includes('比肩'),false);
 const wrong=structuredClone(p);value(wrong,'pattern').value.competingExposures[0].role='month';assert.throws(()=>build(wrong),/EXPOSURE_CONTEXT/);
});

test('a seasonal M5 data hold is not relabeled outside policy scope or as no useful element',()=>{
 const p=makeConsumerProjection(),m=value(p,'m5');
 m.status='NEEDS_DATA';Object.assign(m.value,{status:'HOLD',reasonCodes:['SEASONAL_CONTEXT_NEEDS_DATA'],candidateElements:[],fireLocations:[]});
 const r=build(p),c=r.interpretationClaims.find(c=>c.templateId==='m5');
 assert.equal(c.status,'NEEDS_DATA');assert.match(c.text,/계절 문맥.*자료/);assert.doesNotMatch(c.text,/범위 밖이므로/);
 assert.equal(r.eligibility.fullPaidReport,false);
});

test('consumer text defines its vocabulary and visible-stem scope, shows input, and shares held chapters across natal alternatives',()=>{
 const p=makeConsumerProjection({variant:'two-natal-parents'}),r=build(p),text=renderConsumerReport(r,{audience:'full',voice:'report'});
 for(const chapter of [3,4]) assert.equal(r.narrativeSections.find(s=>s.chapter===chapter).claimIds.length,1);
 assert.match(text,/일간은 태어난 날의 천간/);assert.match(text,/지장간은 각 지지 안의 천간 구성/);
 assert.match(text,/일간을 제외한 연·월·시/);assert.match(text,/확인할 입력: 양력 2026-02-04 05:02/);
 assert.doesNotMatch(text,/비견여서|甲를|丙를|庚를|壬를|子와|寅와|辰와|申와|戌와|亥와|정재이라는|편재이 있습니다|근는/);
 assert.doesNotMatch(text,/chart\.candidates|SAJU-CONSUMER|POLICY_UNRESOLVED|QIU|XIANG|PRESENT_UNDER_POLICY/);
 assert.equal(r.eligibility.chapters.find(c=>c.chapter===5).status,'HOLD');
 assert.ok(r.eligibility.requiredInformation.includes('OPTIONAL_DAYUN_REQUIRES_EXPLICIT_TRADITIONAL_SEX_AND_POLICY'));
});
