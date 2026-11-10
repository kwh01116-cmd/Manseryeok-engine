// Synthetic connection cases, not independent calendar/source or predictive certification.
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { createLocalChartProfile, STAGE_A_PROFILE_ID } from '../scripts/kasi/local-chart.mjs';
import { deriveLocalChartFacts, validateLocalChartFacts, toM2Preview, getM2PolicyBundle, M2_LOCAL_PROFILE_ID } from '../scripts/kasi/local-chart-facts.mjs';
import { deriveM2ChartFactsV3 } from '../dist/chartFacts/chartFactsV3.js';
import { syntheticLocalChartCandidate, chartRequest } from './fixtures/kasi-local-chart-synthetic.mjs';
import { createLocalExplanationProfile, explainChartFacts, validateExplanation, renderExplanationText } from '../scripts/kasi/local-explain.mjs';

const fixture=syntheticLocalChartCandidate();
const createChart=()=>createLocalChartProfile(fixture.loaded,{profileId:STAGE_A_PROFILE_ID,expectedManifestSha256:fixture.expectedManifestSha256});
const classify=(profile,date='2026-06-01',time='12:00')=>deriveLocalChartFacts(profile.calculate(chartRequest(date,time)),{m2ProfileId:M2_LOCAL_PROFILE_ID});
const byRole=(candidate,role)=>candidate.pillars.find(p=>p.role===role);

test('local M2 bridge preserves existing v3 classification and independent known ten-god/hidden-stem/growth expectations',()=>{
  const chart=createChart(),calculation=chart.calculate(chartRequest()),facts=deriveLocalChartFacts(calculation,{m2ProfileId:M2_LOCAL_PROFILE_ID});
  assert.equal(facts.status,'READY');
  const bundle=getM2PolicyBundle(M2_LOCAL_PROFILE_ID);
  // Direct existing-function comparison is a connection check; constants below are separate finite expectations.
  const direct=deriveM2ChartFactsV3(toM2Preview(calculation),bundle.policies.hiddenStems.id,bundle.policies.branchRelations.id,bundle.policies.triadMembership.id);
  assert.deepEqual(facts.genericM2,direct);
  const candidate=facts.candidates[0];
  assert.equal(candidate.dayMaster,'丙');
  assert.deepEqual(candidate.pillars.map(p=>[p.stem,p.branch]),[['丙','午'],['癸','巳'],['丙','午'],['甲','午']]);
  assert.deepEqual(candidate.pillars.map(p=>p.visibleTenGod),['比肩','正官',null,'偏印']);
  assert.deepEqual(byRole(candidate,'year').branchTenGods.members.map(p=>[p.stem,p.tenGod,p.position]),[['丁','劫財','MAIN_QI'],['己','傷官','OTHER']]);
  assert.deepEqual(byRole(candidate,'month').branchTenGods.members.map(p=>[p.stem,p.tenGod]),[['丙','比肩'],['庚','偏財'],['戊','食神']]);
  assert.equal(byRole(candidate,'year').twelveGrowth.stage,'帝旺');
  assert.equal(byRole(candidate,'month').twelveGrowth.stage,'臨官');
  assert.equal(byRole(candidate,'year').nature.stem.element,'FIRE');
  assert.equal(byRole(candidate,'year').nature.stem.polarity,'YANG');
  const changed=classify(chart,'2026-06-02').candidates[0];
  assert.equal(changed.dayMaster,'丁');
  assert.equal(byRole(changed,'year').visibleTenGod,'劫財');
  assert.equal(byRole(changed,'month').visibleTenGod,'七殺');
  assert.equal(bundle.editionVerification,'UNVERIFIED');assert.equal(bundle.rightsReview,'UNVERIFIED');assert.equal(bundle.predictiveValidity,'NOT_CLAIMED');
  const unversioned=facts.rules.filter(r=>r.id.startsWith('M2-RULE-BRANCH-')&&r.id!== 'M2-RULE-BRANCH-TEN-GODS-001' || r.id.startsWith('M2-RULE-TRIAD-'));
  assert.equal(unversioned.length,7);assert.ok(unversioned.every(r=>r.runtimeVersion===null));
});

test('local M2 keeps repeated occurrences, overlapping directional pairs, full and partial triad membership, and absent relations',()=>{
  const chart=createChart(),repeated=classify(chart).candidates[0];
  const self=repeated.branchRelations.filter(r=>r.kind==='XING'&&r.orientation==='SELF_BETWEEN_OCCURRENCES');
  assert.deepEqual(self.map(r=>[r.leftPillarRole,r.rightPillarRole]),[['year','day'],['year','hour'],['day','hour']]);
  const partial=repeated.triadMemberships.find(t=>t.definitionId==='SANHUI_FIRE');
  assert.equal(partial.status,'TWO_DISTINCT_MEMBERS');
  assert.deepEqual(partial.missingBranches,['未']);
  const overlapping=classify(chart,'2026-01-01','16:30').candidates[0];
  const pair=overlapping.branchRelations.filter(r=>r.leftPillarRole==='year'&&r.rightPillarRole==='hour');
  assert.deepEqual(pair.map(r=>r.kind),['LIUHE','LIUPO','XING']);
  assert.equal(pair.find(r=>r.kind==='XING').orientation,'LEFT_TO_RIGHT');
  const complete=classify(chart,'2026-01-01','02:30').candidates[0].triadMemberships.find(t=>t.definitionId==='SANHUI_WATER');
  assert.equal(complete.status,'THREE_DISTINCT_MEMBERS');
  assert.deepEqual(complete.missingBranches,[]);
  assert.deepEqual(complete.members.map(m=>m.branch),['亥','子','丑']);
  const absent=classify(chart,'2026-01-02','00:30').candidates[0];
  assert.deepEqual(absent.branchRelations,[]);assert.deepEqual(absent.triadMemberships,[]);
});

test('local M2 requires explicit policies and the current unmodified in-process M1 calculation, never self-declared OK JSON',()=>{
  const chart=createChart(),calculation=chart.calculate(chartRequest());
  for(const id of [undefined,null,'','AUTO','__proto__','UNSUPPORTED']) {
    assert.throws(()=>deriveLocalChartFacts(calculation,{m2ProfileId:id}));
    assert.throws(()=>getM2PolicyBundle(id));
  }
  assert.throws(()=>deriveLocalChartFacts(structuredClone(calculation),{m2ProfileId:M2_LOCAL_PROFILE_ID}));
  for(const mutate of [
    r=>{r.chart=structuredClone(r.chart);r.chart.candidates[0].day.stem='甲';},
    r=>{r.evidence.dateConversion.source.responseSha256='0'.repeat(64);},
    r=>{r.dataset.candidateManifestContentSha256='0'.repeat(64);},
    r=>{r.chart=structuredClone(r.chart);r.chart.monthBoundaryTrace.candidateContexts[0].activeSince.sourceIds=['FAKE_SOURCE'];},
    r=>{r.profile.g0Receipt={status:'VERIFIED'};},
  ]) {
    const changed=chart.calculate(chartRequest());mutate(changed);
    assert.throws(()=>deriveLocalChartFacts(changed,{m2ProfileId:M2_LOCAL_PROFILE_ID}));
  }
  assert.equal(classify(chart).status,'READY');
});

test('local M2 facts reject modified output and preserve candidate-local references at the correlated Lichun minute',()=>{
  const chart=createChart(),facts=classify(chart,'2026-02-05','01:20');
  assert.equal(facts.confidence,'PUBLISHED_MINUTE_AMBIGUOUS');
  assert.equal(facts.candidateDisplay,'SHOW_ALL_BOUNDARY_CANDIDATES');
  assert.equal(facts.candidates.length,2);
  assert.notDeepEqual(facts.candidates[0].pillars.slice(0,2),facts.candidates[1].pillars.slice(0,2));
  for(const candidate of facts.candidates) {
    assert.equal(candidate.id,`chart.candidates[${candidate.candidateIndex}]`);
    for(const fact of candidate.facts) {
      assert.equal(fact.candidateRef,candidate.id);
      assert.ok(fact.pillarRefs.every(ref=>ref.startsWith(candidate.id+'.')));
      assert.ok(fact.ruleRefs.every(id=>facts.rules.some(r=>r.id===id)));
      assert.ok(fact.sourceRefs.every(id=>facts.sources.some(s=>s.id===id&&s.kind==='M2_RULE_SOURCE_RECORD')));
      assert.ok(fact.calculationSourceRefs.length>0);
      assert.ok(fact.calculationSourceRefs.every(id=>facts.sources.some(s=>s.id===id&&s.kind==='CALENDAR_API')));
    }
  }
  assert.doesNotThrow(()=>validateLocalChartFacts(facts));
  assert.throws(()=>validateLocalChartFacts(structuredClone(facts)));
  const first=classify(chart);
  // Issued facts are deeply immutable; attempted mutation is stopped before another request can observe it.
  assert.throws(()=>{first.candidates[0].facts[0].value='TAMPERED';},TypeError);
  assert.doesNotThrow(()=>validateLocalChartFacts(first));
  const modified=structuredClone(first);modified.candidates[0].facts[0].value='TAMPERED';
  assert.throws(()=>validateLocalChartFacts(modified));assert.throws(()=>explainChartFacts(modified));
  assert.equal(classify(chart).candidates[0].dayMaster,'丙');
});

test('reviewed complete synthetic ordinary and boundary Korean TEXT snapshots remain exact',async()=>{
  const pipeline=createLocalExplanationProfile(createChart(),{m2ProfileId:M2_LOCAL_PROFILE_ID});
  for(const [name,request] of [['ordinary',chartRequest()],['boundary',chartRequest('2026-02-05','01:20')]]) {
    const expected=await readFile(new URL(`./fixtures/kasi-explanation-${name}-synthetic.txt`,import.meta.url),'utf8');
    assert.equal(renderExplanationText(pipeline.calculate(request)),expected);
  }
});

test('one product input invokes M1 once then uses all same-execution candidates for M2 and deterministic Korean templates',()=>{
  const chart=createChart();let calls=0;
  const measured={...chart,calculate(request){calls++;return chart.calculate(request);}};
  const pipeline=createLocalExplanationProfile(measured,{m2ProfileId:M2_LOCAL_PROFILE_ID});
  const ordinary=pipeline.calculate(chartRequest());
  assert.equal(calls,1);assert.equal(ordinary.status,'OK');
  assert.deepEqual(ordinary.m1.chart.candidates[0],{year:{stem:'丙',branch:'午'},month:{stem:'癸',branch:'巳'},day:{stem:'丙',branch:'午'},hour:{stem:'甲',branch:'午'}});
  assert.equal(ordinary.explanation.title,'명식 기초 분석/설명');
  assert.deepEqual(ordinary.explanation,explainChartFacts(ordinary.facts));
  const boundary=pipeline.calculate(chartRequest('2026-02-05','01:20'));
  assert.equal(calls,2);assert.equal(boundary.m1.chart.candidates.length,2);
  assert.equal(boundary.facts.candidates.length,2);assert.equal(boundary.explanation.candidates.length,2);
  for(const c of boundary.explanation.candidates) {
    assert.equal(c.candidateRef,`chart.candidates[${c.candidateIndex}]`);
    const candidate=boundary.facts.candidates[c.candidateIndex];
    for(const item of c.items) {
      assert.equal(item.candidateRef,c.candidateRef);
      assert.equal(item.templateVersion,'1.0.0');
      assert.ok(item.factRefs.length>0);
      assert.ok(item.factRefs.every(ref=>candidate.facts.some(f=>f.id===ref)));
      assert.ok(item.ruleRefs.every(ref=>boundary.facts.rules.some(r=>r.id===ref)));
      assert.ok(item.sourceRefs.every(ref=>boundary.facts.sources.some(s=>s.id===ref)));
    }
  }
  assert.deepEqual(pipeline.calculate(chartRequest()).explanation,ordinary.explanation);assert.equal(calls,3);
  assert.match(renderExplanationText(boundary),/두 후보|2개|후보 2/);
  const reused=chart.calculate(chartRequest());
  const wrongExecution=createLocalExplanationProfile({calculate(){return reused;}},{m2ProfileId:M2_LOCAL_PROFILE_ID});
  assert.throws(()=>wrongExecution.calculate(chartRequest('2026-06-02')),'issued result for another birth input must not be reused');
  const forged=createLocalExplanationProfile({calculate(){return structuredClone(reused);}},{m2ProfileId:M2_LOCAL_PROFILE_ID});
  assert.throws(()=>forged.calculate(chartRequest()),'self-declared external JSON must not enter the pipeline');
});

test('Korean template references and text reject cross-candidate, missing fact/rule/source/policy, unknown template, and invented claims',()=>{
  const pipeline=createLocalExplanationProfile(createChart(),{m2ProfileId:M2_LOCAL_PROFILE_ID});
  const result=pipeline.calculate(chartRequest('2026-02-05','01:20'));
  assert.doesNotThrow(()=>validateExplanation(structuredClone(result.explanation),result.facts));
  const attempts=[
    e=>{e.candidates[0].items[0].factRefs=[result.facts.candidates[1].facts[0].id];},
    e=>{e.candidates[0].items[0].candidateRef='chart.candidates[1]';},
    e=>{e.candidates[0].items[0].factRefs=['DOES_NOT_EXIST'];},
    e=>{e.candidates[0].items[0].ruleRefs=['DOES_NOT_EXIST'];},
    e=>{e.candidates[0].items[0].sourceRefs=['DOES_NOT_EXIST'];},
    e=>{e.candidates[0].items[0].policyRefs=['DOES_NOT_EXIST'];},
    e=>{e.candidates[0].items[0].templateId='UNREGISTERED_TEMPLATE';},
    e=>{e.candidates[0].items[0].templateVersion='999.0.0';},
    e=>{e.candidates[0].items[0].text='재성이 있으므로 돈을 잘 번다.';},
    e=>{e.candidates.pop();},
  ];
  for(const change of attempts) {
    const invalid=structuredClone(result.explanation);change(invalid);
    assert.throws(()=>validateExplanation(invalid,result.facts));
  }
  assert.deepEqual(pipeline.calculate(chartRequest('2026-02-05','01:20')).explanation,result.explanation);
});

test('explanation follows present facts only, leaves source rights open, and isolates mutated requests/results',()=>{
  const pipeline=createLocalExplanationProfile(createChart(),{m2ProfileId:M2_LOCAL_PROFILE_ID});
  const request=chartRequest('2026-01-02','00:30'),original=pipeline.calculate(request);
  const candidate=original.facts.candidates[0];
  assert.deepEqual(candidate.branchRelations,[]);assert.deepEqual(candidate.triadMemberships,[]);
  const items=original.explanation.candidates[0].items;
  for(const item of items) {
    const referenced=candidate.facts.filter(f=>item.factRefs.includes(f.id));
    assert.ok(referenced.length>0);
    assert.ok(!referenced.some(f=>f.kind==='BRANCH_RELATION'||f.kind==='TRIAD_MEMBERSHIP'));
  }
  const text=renderExplanationText(original);
  assert.ok(!text.includes('육합에 해당합니다'));assert.ok(!text.includes('삼합 구성원이 있습니다'));
  assert.equal(original.m1.dataset.rightsReview,'UNVERIFIED');
  assert.equal(original.m1.dataset.annualTxtAuthentication,'NOT_CLAIMED');
  assert.equal(original.m1.profile.g0Receipt,null);assert.equal(original.m1.profile.g1P2Promotion,false);
  const expected=structuredClone(original.explanation);
  original.m1.chart=structuredClone(original.m1.chart);original.m1.chart.candidates[0].day.stem='甲';
  original.explanation.candidates[0].items[0].text='MUTATED';
  request.date='2026-06-01';
  assert.deepEqual(pipeline.calculate(chartRequest('2026-01-02','00:30')).explanation,expected);
});
