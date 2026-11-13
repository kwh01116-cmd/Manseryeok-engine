// Generated calendar responses test the bridge. These are not external calendar/classical answers.
import test from 'node:test';
import assert from 'node:assert/strict';
import {createLocalChartProfile,STAGE_A_PROFILE_ID} from '../scripts/kasi/local-chart.mjs';
import {M2_LOCAL_PROFILE_ID} from '../scripts/kasi/local-chart-facts.mjs';
import {
 createLocalM3EvidenceProfile,deriveLocalM4Pattern,validateLocalM4Pattern,validateLocalM3EvidenceResult,
 renderLocalM3EvidenceText,parseLocalM3EvidenceArgs,M3_LOCAL_PROFILE_ID,M3_SYNTHESIS_PROFILE_ID,
 M3_SEASONAL_SILI_POLICY_ID,
} from '../scripts/kasi/local-m3-evidence.mjs';
import {M4_PATTERN_PROFILE_ID,validateM4ZhengguanExplanation} from '../dist/m4/zhengguanStructureV1.js';
import {syntheticLocalChartCandidate,chartRequest} from './fixtures/kasi-local-chart-synthetic.mjs';

const fixture=syntheticLocalChartCandidate();
const chart=()=>createLocalChartProfile(fixture.loaded,{profileId:STAGE_A_PROFILE_ID,expectedManifestSha256:fixture.expectedManifestSha256});
const selected={patternProfileId:M4_PATTERN_PROFILE_ID};
const profile=base=>createLocalM3EvidenceProfile(base??chart(),selected);
const plainOptions={m2ProfileId:M2_LOCAL_PROFILE_ID,m3ProfileId:M3_LOCAL_PROFILE_ID};
const lunarRequest=(date,time='12:00')=>{
 const row=fixture.loaded.candidate.dates.find(item=>item.solarDate===date);assert.ok(row);
 return {calendar:'KOREAN_LUNAR',lunarDate:{lunarYear:row.lunarYear,lunarMonth:row.lunarMonth,lunarDay:row.lunarDay,leap:row.leap},time,policies:chartRequest().policies};
};
const common=['--profile',STAGE_A_PROFILE_ID,'--candidate','SYNTHETIC_PATH_NOT_LOADED_BY_PARSER','--manifest-sha',fixture.expectedManifestSha256,
 '--calendar','GREGORIAN','--date','2026-06-01','--time','12:00','--clock-policy','KR_API_PUBLISHED_KST_MODERN_1988_POST_DST_V1',
 '--day-rollover','CIVIL_MIDNIGHT','--hour-stem-reference','SELECTED_DAY_PILLAR','--output','json'];

test('explicit pattern bundle rejects policy conflicts before M1 and discloses the research scope',()=>{
 const base=chart();let calls=0;const spy={...base,calculate(input){calls++;return base.calculate(input);}};
 for(const patternProfileId of ['', 'AUTO','M4_RELEASE_READY'])assert.throws(()=>createLocalM3EvidenceProfile(spy,{patternProfileId,contextProfile:base}));
 for(const [key,id]of Object.entries({m2ProfileId:'OTHER_M2',m3ProfileId:'OTHER_M3'}))assert.throws(()=>createLocalM3EvidenceProfile(spy,{...selected,[key]:id,contextProfile:base}));
 assert.equal(calls,0);
 const result=createLocalM3EvidenceProfile(spy,{...selected,contextProfile:base}).calculate(chartRequest());
 assert.equal(calls,1);assert.equal(result.schemaVersion,'kasi-local-m3-evidence-pattern-v1');
 assert.deepEqual(result.executionCounts,{birthM1Calls:1,m2Derivations:1,m4Derivations:1});assert.equal(result.patternAnalysis.profile.id,M4_PATTERN_PROFILE_ID);
 assert.equal(result.patternAnalysis.status,'STRUCTURAL_ANALYSIS_ONLY');assert.equal(result.status,'EVIDENCE_ONLY');
 assert.equal(result.validation.finalStrength,'NOT_IMPLEMENTED');assert.equal(result.validation.m3FinalInterpretationGate,'BLOCKED_UNCHANGED');
 assert.equal(result.validation.g0Receipt,null);assert.equal(result.validation.g1P2Promotion,false);
 assert.equal(Object.hasOwn(result,'root'),false);assert.equal(Object.hasOwn(result,'seasonal'),false);assert.equal(Object.hasOwn(result,'researchSynthesis'),false);
});

test('month MAIN, exposed OTHER, unexposed OTHER and officer existence outside month differ in the actual synthetic bridge',()=>{
 const p=profile();
 // These literals were selected from the generated M1/M2 fixture before M4 existed,
 // then checked against the existing hidden-stem table. They test connection, not a new oracle.
 const examples=[
  ['2026-01-02','丙','子','STRUCTURAL_CANDIDATE','MAIN_QI','癸'],
  ['2026-01-10','甲','丑','NOT_A_CANDIDATE_UNDER_POLICY','OTHER','辛'],
  ['2026-02-06','辛','寅','STRUCTURAL_CANDIDATE','OTHER','丙'],
 ];
 for(const[date,dayMaster,monthBranch,status,position,stem]of examples){
  const value=p.calculate(chartRequest(date)),candidate=value.patternAnalysis.candidates[0];
  assert.equal(candidate.dayMaster,dayMaster);assert.equal(candidate.monthContext.monthPillar.branch,monthBranch);
  assert.equal(candidate.candidateAssessment.status,status);assert.ok(candidate.monthBasis.officerMembers.some(m=>m.stem===stem&&m.position===position));
  assert.equal(candidate.officerPresence.status,'PRESENT');assert.equal(validateLocalM3EvidenceResult(value),true);
  for(const key of ['geCheng','geBai','jiuYing'])assert.equal(candidate.effects[key],'NOT_IMPLEMENTED');
 }
 const summer=p.calculate(chartRequest()),c=summer.patternAnalysis.candidates[0];
 assert.equal(c.officerPresence.status,'PRESENT');assert.ok(c.officerPresence.visible.some(l=>l.stem==='癸'&&l.pillarRole==='month'));
 assert.equal(c.monthBasis.officerMembers.length,0);assert.equal(c.candidateAssessment.status,'NOT_A_CANDIDATE_UNDER_POLICY');
 assert.equal(c.effects.geCheng,'NOT_IMPLEMENTED');assert.match(renderLocalM3EvidenceText(summer),/정관/);
});

test('pattern reuses issued M1 M2 M3 and preserves option-off and existing synthesis output semantics',()=>{
 const base=chart(),plain=createLocalM3EvidenceProfile(base,plainOptions),oldSynthesis=createLocalM3EvidenceProfile(base,{synthesisProfileId:M3_SYNTHESIS_PROFILE_ID});
 const request=chartRequest(),before=plain.calculate(request),oldJson=JSON.stringify(before),oldText=renderLocalM3EvidenceText(before),old=oldSynthesis.calculate(request);
 let calls=0;const spy={...base,calculate(input){calls++;return base.calculate(input);}};
 const value=createLocalM3EvidenceProfile(spy,{...selected,contextProfile:base}).calculate(request);assert.equal(calls,1);
 for(const key of ['m1','facts','evidence','explanation','validation'])assert.deepEqual(value[key],before[key]);
 const {m4Policy,...oldProvenance}=value.provenance;assert.deepEqual(oldProvenance,before.provenance);assert.equal(m4Policy.id,M4_PATTERN_PROFILE_ID);
 assert.deepEqual(value.executionCounts,{...before.executionCounts,m4Derivations:1});
 const standalone=deriveLocalM4Pattern(value.evidence,selected);assert.equal(calls,1);assert.deepEqual(standalone,value.patternAnalysis);
 assert.equal(validateLocalM4Pattern(standalone,{evidence:value.evidence}),true);
 const both=createLocalM3EvidenceProfile(base,{...selected,synthesisProfileId:M3_SYNTHESIS_PROFILE_ID}).calculate(request);
 for(const key of ['researchSynthesis','researchReport','root','support','seasonal'])assert.deepEqual(both[key],old[key]);
 assert.deepEqual(both.patternAnalysis,value.patternAnalysis);assert.equal(validateLocalM3EvidenceResult(both),true);
 assert.equal(JSON.stringify(plain.calculate(request)),oldJson);assert.equal(renderLocalM3EvidenceText(plain.calculate(request)),oldText);
 assert.equal(Object.hasOwn(old,'patternAnalysis'),false);assert.equal(Object.hasOwn(old,'patternReport'),false);
});

test('Gregorian and lunar equivalent inputs keep candidate analyses and Korean reports with distinct conversion evidence',()=>{
 const p=profile(),g=p.calculate(chartRequest('2026-01-02')),l=p.calculate(lunarRequest('2026-01-02'));
 assert.deepEqual(g.m1.chart,l.m1.chart);assert.deepEqual(g.patternAnalysis.candidates,l.patternAnalysis.candidates);assert.deepEqual(g.patternReport,l.patternReport);
 assert.notEqual(g.m1.evidence.dateConversion.method,l.m1.evidence.dateConversion.method);
 for(const value of [g,l]){validateLocalM3EvidenceResult(value);assert.equal(value.patternAnalysis.candidates.length,value.m1.chart.candidates.length);}
 const text=renderLocalM3EvidenceText(g);assert.match(text,/정관격/);assert.match(text,/후보/);assert.match(text,/효력|성패/);assert.ok(text.length<10000);
});

test('one natal parent at B keeps one pattern while seasonal alternatives branch below it',()=>{
 const p=createLocalM3EvidenceProfile(chart(),{...selected,seasonalPolicyId:M3_SEASONAL_SILI_POLICY_ID});
 const values=['01:19','01:20','01:21'].map(time=>p.calculate(chartRequest('2026-04-17',time)));
 for(const value of values){assert.equal(value.m1.chart.candidates.length,1);assert.equal(value.patternAnalysis.candidates.length,1);validateLocalM3EvidenceResult(value);}
 assert.deepEqual(values[0].m1.chart.candidates,values[1].m1.chart.candidates);assert.deepEqual(values[1].m1.chart.candidates,values[2].m1.chart.candidates);
 assert.equal(values[1].seasonal.candidates[0].judgment.alternatives.length,2);
 assert.deepEqual(values[0].patternAnalysis,values[1].patternAnalysis);assert.deepEqual(values[1].patternAnalysis,values[2].patternAnalysis);
});

test('published Lichun preserves each original parent and its own month members without a Cartesian product',()=>{
 const value=profile().calculate(chartRequest('2026-02-05','01:20'));
 assert.equal(value.m1.chart.candidates.length,2);assert.equal(value.patternAnalysis.candidates.length,2);
 for(let i=0;i<2;i++){
  const analysis=value.patternAnalysis.candidates[i],m3=value.evidence.candidates[i];
  assert.equal(analysis.candidateRef,'chart.candidates['+i+']');assert.equal(analysis.candidateIndex,i);assert.deepEqual(analysis.monthContext,m3.monthContext);
  assert.ok(analysis.monthBasis.officerMembers.every(m=>m.candidateRef===analysis.candidateRef));
 }
 validateLocalM3EvidenceResult(value);const text=renderLocalM3EvidenceText(value);assert.match(text,/후보 1/);assert.match(text,/후보 2/);
});

test('cross-request issued contexts cloned results and altered report references reject without contaminating later requests',()=>{
 const p=profile(),a=p.calculate(chartRequest()),b=p.calculate(chartRequest('2026-02-05','01:20'));
 assert.throws(()=>deriveLocalM4Pattern(structuredClone(a.evidence),selected));
 assert.throws(()=>validateLocalM4Pattern(a.patternAnalysis,{evidence:b.evidence}));
 assert.throws(()=>validateLocalM4Pattern(structuredClone(a.patternAnalysis),{evidence:a.evidence}));
 const report=structuredClone(a.patternReport);report.candidates[0].candidateRef='chart.candidates[1]';assert.throws(()=>validateM4ZhengguanExplanation(report,a.patternAnalysis));
 const forged=structuredClone(a);forged.patternAnalysis=b.patternAnalysis;assert.throws(()=>validateLocalM3EvidenceResult(forged));
 assert.throws(()=>deriveLocalM4Pattern(a.evidence,{patternProfileId:'OTHER'}));
 assert.deepEqual(p.calculate(chartRequest()),a);assert.equal(a.evidence.finalStrength.status,'NOT_IMPLEMENTED');
});

test('pattern parser requires one supported profile and refuses duplicate or conflicting explicit dependencies',()=>{
 const parsed=parseLocalM3EvidenceArgs([...common,'--pattern-profile',M4_PATTERN_PROFILE_ID]);
 assert.equal(parsed.patternProfileId,M4_PATTERN_PROFILE_ID);assert.equal(parsed.m2ProfileId,M2_LOCAL_PROFILE_ID);assert.equal(parsed.m3ProfileId,M3_LOCAL_PROFILE_ID);
 for(const tail of [
  ['--pattern-profile','AUTO'],['--pattern-profile',M4_PATTERN_PROFILE_ID,'--pattern-profile',M4_PATTERN_PROFILE_ID],
  ['--pattern-profile',M4_PATTERN_PROFILE_ID,'--m2-profile','OTHER'],['--pattern-profile',M4_PATTERN_PROFILE_ID,'--m3-profile','OTHER'],
 ])assert.throws(()=>parseLocalM3EvidenceArgs([...common,...tail]));
 const both=parseLocalM3EvidenceArgs([...common,'--pattern-profile',M4_PATTERN_PROFILE_ID,'--synthesis-profile',M3_SYNTHESIS_PROFILE_ID]);
 assert.equal(both.synthesisProfileId,M3_SYNTHESIS_PROFILE_ID);assert.equal(both.patternProfileId,M4_PATTERN_PROFILE_ID);
 assert.throws(()=>parseLocalM3EvidenceArgs(common),'No option must retain the old explicit M2/M3 requirement');
});
