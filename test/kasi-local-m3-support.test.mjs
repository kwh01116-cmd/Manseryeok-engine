// Generated fictional calendar responses test continuity; they do not authenticate KASI or a birth.
import test from 'node:test';
import assert from 'node:assert/strict';
import {createLocalChartProfile,STAGE_A_PROFILE_ID} from '../scripts/kasi/local-chart.mjs';
import {M2_LOCAL_PROFILE_ID} from '../scripts/kasi/local-chart-facts.mjs';
import {createLocalM3EvidenceProfile,deriveLocalM3ResourceSupport,validateLocalM3ResourceSupport,validateLocalM3EvidenceResult,renderLocalM3EvidenceText,M3_LOCAL_PROFILE_ID,M3_ROOT_POLICY_ID,M3_SUPPORT_POLICY_ID,M3_SEASONAL_POLICY_ID,M3_SEASONAL_SILI_POLICY_ID} from '../scripts/kasi/local-m3-evidence.mjs';
import {validateM3ResourceSupportExplanation} from '../dist/m3/resourceSupportV1.js';
import {syntheticLocalChartCandidate,chartRequest} from './fixtures/kasi-local-chart-synthetic.mjs';
const fixture=syntheticLocalChartCandidate(),settings={m2ProfileId:M2_LOCAL_PROFILE_ID,m3ProfileId:M3_LOCAL_PROFILE_ID,rootPolicyId:M3_ROOT_POLICY_ID};
const chart=()=>createLocalChartProfile(fixture.loaded,{profileId:STAGE_A_PROFILE_ID,expectedManifestSha256:fixture.expectedManifestSha256});
const profile=(seasonalPolicyId,base=chart())=>createLocalM3EvidenceProfile(base,{...settings,supportPolicyId:M3_SUPPORT_POLICY_ID,...(seasonalPolicyId?{seasonalPolicyId}:{})});
const resource=(r,role='hour',i=0)=>r.support.candidates[i].resources.find(s=>s.resource.pillarRole===role);
function lunarRequest(date,time='12:00'){const row=fixture.loaded.candidate.dates.find(r=>r.solarDate===date);return {calendar:'KOREAN_LUNAR',lunarDate:{lunarYear:row.lunarYear,lunarMonth:row.lunarMonth,lunarDay:row.lunarDay,leap:row.leap},time,policies:chartRequest().policies};}

test('support requires explicit dependency policies before M1 and keeps one issued birth/facts/root path',()=>{
 const base=chart();let calls=0;const spy={...base,calculate(req){calls++;return base.calculate(req);}};
 for(const rootPolicyId of [undefined,'','AUTO'])assert.throws(()=>createLocalM3EvidenceProfile(spy,{...settings,rootPolicyId,supportPolicyId:M3_SUPPORT_POLICY_ID,contextProfile:base}));
 for(const supportPolicyId of ['', 'AUTO'])assert.throws(()=>createLocalM3EvidenceProfile(spy,{...settings,supportPolicyId,contextProfile:base}));assert.equal(calls,0);
 const p=createLocalM3EvidenceProfile(spy,{...settings,supportPolicyId:M3_SUPPORT_POLICY_ID,contextProfile:base}),r=p.calculate(chartRequest()),old=createLocalM3EvidenceProfile(base,settings).calculate(chartRequest());
 assert.equal(calls,1);assert.deepEqual(r.executionCounts,{birthM1Calls:1,m2Derivations:1});assert.equal(r.schemaVersion,'kasi-local-m3-evidence-support-v1');
 for(const key of ['m1','facts','evidence','explanation','root','rootExplanation','validation','provenance'])assert.deepEqual(r[key],old[key]);assert.equal(old.support,undefined);
 const before=calls,again=deriveLocalM3ResourceSupport(r.evidence,{root:r.root,supportPolicyId:M3_SUPPORT_POLICY_ID});assert.equal(calls,before);assert.deepEqual(again,r.support);assert.equal(validateLocalM3ResourceSupport(again,{evidence:r.evidence,root:r.root}),true);assert.equal(validateLocalM3EvidenceResult(r),true);
});

test('ordinary unrooted Jia resource remains present and is not held when Ji surface partner is absent',()=>{
 const r=profile(M3_SEASONAL_SILI_POLICY_ID).calculate(chartRequest()),d=resource(r);
 assert.equal(d.resource.stem,'甲');assert.equal(d.resourcePresence.tenGod,'偏印');assert.equal(d.rootPresence,'ABSENT_UNDER_POLICY');assert.deepEqual(d.combinationPartners,[]);assert.equal(d.selectedRuleDecision,'NO_HOLD_BY_THIS_RULE');assert.equal(d.totalSupportEfficacy,'NOT_EVALUATED');
 assert.equal(r.seasonal.candidates[0].judgment.seasonalState,'WANG');assert.equal(r.root.candidates[0].targets.find(t=>t.target.pillarRole==='hour').chartRootPresence,'ABSENT_UNDER_POLICY');assert.equal(r.validation.finalStrength,'NOT_IMPLEMENTED');
 const text=renderLocalM3EvidenceText(r);assert.match(text,/이번|선택/);assert.match(text,/甲/);assert.match(text,/인성/);assert.match(text,/전체|종합/);
});

test('equivalent Gregorian/lunar support meanings match while each input retains its authentic conversion proof',()=>{
 const p=profile(M3_SEASONAL_SILI_POLICY_ID),g=p.calculate(chartRequest()),l=p.calculate(lunarRequest('2026-06-01'));
 for(const key of ['candidates','rules','policy','totalSupportEfficacy','finalStrength'])assert.deepEqual(g.support[key],l.support[key]);assert.deepEqual(g.supportExplanation,l.supportExplanation);
 assert.deepEqual(g.m1.chart,l.m1.chart);assert.notEqual(g.m1.evidence.dateConversion.method,l.m1.evidence.dateConversion.method);
 for(const r of[g,l])for(const source of r.root.sources)assert.deepEqual(r.support.sources.find(s=>s.id===source.id),source);
});

test('one natal/root/support result survives a B-minute seasonal alternative without new stem combinations',()=>{
 const p=profile(M3_SEASONAL_SILI_POLICY_ID); // Fictional Lixia May5 01:20 -> B Apr17 01:20.
 const a=p.calculate(chartRequest('2026-04-17','01:19')),b=p.calculate(chartRequest('2026-04-17','01:20')),c=p.calculate(chartRequest('2026-04-17','01:21'));
 for(const r of[a,b,c]){assert.equal(r.m1.chart.candidates.length,1);assert.equal(r.support.candidates.length,1);assert.equal(r.root.candidates.length,1);}
 assert.deepEqual(a.root,b.root);assert.deepEqual(b.root,c.root);assert.deepEqual(a.support,b.support);assert.deepEqual(b.support,c.support);assert.deepEqual(a.supportExplanation,b.supportExplanation);
 assert.equal(b.seasonal.candidates[0].judgment.alternatives.length,2);assert.equal(b.schemaVersion,'kasi-local-m3-evidence-seasonal-support-v1');
});

test('Lichun parents preserve their own surface resources, partner positions and root links independently',()=>{
 const r=profile(M3_SEASONAL_SILI_POLICY_ID).calculate(chartRequest('2026-02-05','01:20'));assert.equal(r.support.candidates.length,2);assert.equal(r.seasonal.candidates.length,2);
 for(const c of r.support.candidates){
  const root=r.root.candidates[c.candidateIndex],ref='chart.candidates['+c.candidateIndex+']';assert.equal(c.candidateRef,ref);
  const expected=r.facts.candidates[c.candidateIndex].pillars.filter(p=>p.role!=='day'&&['正印','偏印'].includes(p.visibleTenGod));assert.deepEqual(c.resources.map(d=>d.resource.pillarRole),expected.map(p=>p.role));
  for(const d of c.resources){assert.equal(d.resource.candidateRef,ref);const t=root.targets.find(t=>t.id===d.rootTargetRef);assert.ok(t);assert.equal(d.rootPresence,t.chartRootPresence);for(const p of d.combinationPartners){assert.equal(p.partner.candidateRef,ref);assert.notEqual(p.partner.pillarRole,'day');}}
 }
 assert.equal(r.support.totalSupportEfficacy,'NOT_EVALUATED');assert.equal(r.support.finalStrength.status,'NOT_IMPLEMENTED');assert.ok(r.supportExplanation.candidates.every((c,i)=>c.candidateRef===r.support.candidates[i].candidateRef));
});

test('support is independent of seasonal selection and preserves existing seasonal/root-only schemas',()=>{
 const base=chart(),req=chartRequest('2026-04-20'),alone=profile(undefined,base).calculate(req),v1=profile(M3_SEASONAL_POLICY_ID,base).calculate(req),v2=profile(M3_SEASONAL_SILI_POLICY_ID,base).calculate(req);
 assert.deepEqual(alone.support,v1.support);assert.deepEqual(v1.support,v2.support);assert.deepEqual(alone.supportExplanation,v2.supportExplanation);
 assert.equal(v1.seasonal.candidates[0].judgment.status,'POLICY_UNRESOLVED');assert.equal(v2.seasonal.candidates[0].judgment.status,'RESOLVED_UNDER_POLICY');
 const old=createLocalM3EvidenceProfile(base,{...settings,seasonalPolicyId:M3_SEASONAL_SILI_POLICY_ID}).calculate(req);assert.equal(old.schemaVersion,'kasi-local-m3-evidence-seasonal-root-v1');assert.equal(old.support,undefined);
 for(const k of ['m1','facts','evidence','root','seasonal'])assert.deepEqual(old[k],v2[k]);
});

test('same-process source/root contexts and complete immutable references reject cloning and cross-request injection',()=>{
 const p=profile(M3_SEASONAL_SILI_POLICY_ID),a=p.calculate(chartRequest('2026-02-05','01:20')),b=p.calculate(chartRequest());
 assert.throws(()=>deriveLocalM3ResourceSupport(structuredClone(a.evidence),{root:a.root,supportPolicyId:M3_SUPPORT_POLICY_ID}));
 assert.throws(()=>deriveLocalM3ResourceSupport(a.evidence,{root:b.root,supportPolicyId:M3_SUPPORT_POLICY_ID}));assert.throws(()=>deriveLocalM3ResourceSupport(a.evidence,{supportPolicyId:M3_SUPPORT_POLICY_ID}));
 assert.throws(()=>validateLocalM3ResourceSupport(a.support,{evidence:b.evidence,root:b.root}));
 const clone=structuredClone(a);clone.support=b.support;assert.throws(()=>validateLocalM3EvidenceResult(clone));
 for(const mutate of [s=>{s.candidates[0]=s.candidates[1];},s=>{delete s.candidates[0];},s=>{s.candidates[0].resources.push(s.candidates[0].resources[0]);}]){const forged=structuredClone(a.support);mutate(forged);assert.throws(()=>validateLocalM3ResourceSupport(forged,{evidence:a.evidence,root:a.root}));}
 const view=structuredClone(a.supportExplanation);view.candidates[0].items[0].text='이번 제한이 없으므로 생조가 확정되어 신강합니다.';assert.throws(()=>validateM3ResourceSupportExplanation(view,a.support));
 assert.throws(()=>{a.support.totalSupportEfficacy='EFFECTIVE';},TypeError);assert.deepEqual(p.calculate(chartRequest('2026-02-05','01:20')),a);
});
