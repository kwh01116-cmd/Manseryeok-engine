// Fixed sensitivity contracts, not a traditional-strength or calendar-accuracy oracle.
import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {
  scoreWeightedSupport,weightedSupportClass,
  WEIGHTED_SUPPORT_POLICY_ID,WEIGHTED_SUPPORT_VERSION,
} from '../dist/experimental/weightedSupportV1.js';
import {createLocalChartProfile,STAGE_A_PROFILE_ID} from '../scripts/kasi/local-chart.mjs';
import {
  createExperimentalWeightedProfile,validateExperimentalWeightedResult,
} from '../scripts/experimental/weighted-support.mjs';
import {syntheticLocalChartCandidate,chartRequest} from './fixtures/kasi-local-chart-synthetic.mjs';

const fixture=JSON.parse(await readFile(new URL('./fixtures/weighted-support-sensitivity-v1.json',import.meta.url),'utf8'));
const roles=['year','month','day','hour'],policyId=WEIGHTED_SUPPORT_POLICY_ID;
const makeInput=(words,index=0)=>({candidateRef:`chart.candidates[${index}]`,pillars:words.map((word,i)=>({role:roles[i],stem:word[0],branch:word[1],factRef:`facts.candidates[${index}].pillars[${i}]`}))});
const options={policyId};
const slotRoles=['year','month','day','hour','year','month','hour','month'];
const slotRules=[...Array(4).fill('WEIGHTED-PRINCIPAL-BRANCH'),...Array(3).fill('WEIGHTED-SURFACE-SUPPORT-ROOT-FACTOR'),'WEIGHTED-SUPPORTIVE-MONTH-CLASH-ONCE'];
function assertLiteral(result,expected){
  assert.deepEqual(result.decisionTrace.map(row=>row.contributionTenths),expected.slots);
  assert.deepEqual(result.decisionTrace.map(row=>row.role),slotRoles);
  assert.deepEqual(result.decisionTrace.map(row=>row.ruleId),slotRules);
  assert.equal(result.decisionTrace[7].contributionTenths,expected.slots[7]);
  assert.equal(result.score.totalTenths,expected.totalTenths);
  assert.equal(result.score.rawTenths,expected.totalTenths);
  assert.equal(result.score.value,expected.totalTenths/10);
  assert.equal(result.policyClassification,expected.classification);
  assert.equal(result.policy.policyId,fixture.policyId);
  assert.equal(result.policy.policyVersion,fixture.policyVersion);
  assert.equal(result.originalM3FinalStrength,'NOT_MODIFIED');
  assert.equal(result.originalM4Efficacy,'NOT_MODIFIED');
  if(expected.rootCounts)assert.deepEqual(result.decisionTrace.slice(4,7).map(row=>row.rootRefs.length),expected.rootCounts);
  if(expected.clashPartnerRoles){
    assert.deepEqual(result.decisionTrace[7].inputRefs.slice(1).map(ref=>roles[Number(ref.match(/pillars\[(\d)\]/)[1])]),expected.clashPartnerRoles);
  }
}

test('sensitivity corpus contains at least 30 distinct literal chart contracts, separate scalar and synthetic calendar types',()=>{
  assert.equal(fixture.policyId,policyId);assert.equal(fixture.policyVersion,WEIGHTED_SUPPORT_VERSION);
  assert.ok(fixture.cases.length>=30);
  assert.equal(new Set(fixture.cases.map(row=>row.id)).size,fixture.cases.length);
  assert.equal(new Set(fixture.cases.map(row=>row.pillars.join('|'))).size,fixture.cases.length);
  assert.match(fixture.inputNature,/SYNTHETIC.*NOT_ASSERTED_CALENDAR_REALIZABLE/);
  assert.match(fixture.scalarNature,/CLASSIFIER_ONLY_NOT_ASSERTED_REACHABLE/);
  assert.match(fixture.integrationNature,/SYNTHETIC_CALENDAR_RESPONSES_NOT_KASI/);
  const byId=new Map(fixture.cases.map(row=>[row.id,row]));
  for(const row of fixture.cases){
    assert.equal(row.slots.length,8,row.id);
    assert.equal(row.slots.reduce((sum,value)=>sum+value,0),row.totalTenths,row.id+' literal arithmetic');
    assert.ok(row.effect.length>20,row.id+' delta explanation');
    assert.ok([0,2].includes(row.totalTenths%5),row.id+' reachable coefficient residue');
    if(row.compareTo)assert.equal(row.totalTenths-byId.get(row.compareTo).totalTenths,row.deltaTenths,row.id+' literal effect delta');
  }
});

for(const expected of fixture.cases)test('sensitivity literal chart: '+expected.id,()=>{
  assertLiteral(scoreWeightedSupport(makeInput(expected.pillars),options),expected);
});

for(const expected of fixture.scalarThresholds)test(`sensitivity scalar classifier only: ${expected.tenths} -> ${expected.classification}`,()=>{
  // Some adjacent scalars cannot be produced by the chart coefficients. No chart is fabricated for them.
  assert.equal(weightedSupportClass(expected.tenths),expected.classification);
});

test('one shared hidden member roots three surface stems but is never an additive hidden score',()=>{
  const expected=fixture.cases.find(row=>row.id==='shared-single-root');
  const result=scoreWeightedSupport(makeInput(expected.pillars),options);
  assertLiteral(result,expected);
  for(const row of result.decisionTrace.slice(4,7))assert.deepEqual(row.rootRefs,['facts.candidates[0].pillars[0].branchTenGods.members[1]']);
  assert.equal(result.decisionTrace.filter(row=>row.ruleId==='WEIGHTED-PRINCIPAL-BRANCH').length,4);
  assert.equal(result.decisionTrace.filter(row=>row.ruleId==='WEIGHTED-SURFACE-SUPPORT-ROOT-FACTOR').length,3);
  assert.equal(result.decisionTrace.length,8);
});

test('M4 efficacy and caller-supplied root metadata cannot insert score bonuses or penalties',()=>{
  const expected=fixture.cases.find(row=>row.id==='fire-unrooted-resource');
  for(const supplied of ['ROOT_PRESENT','ROOT_ABSENT','EFFECTIVE','INEFFECTIVE']){
    const input=makeInput(expected.pillars);
    input.m4Efficacy=supplied;input.rootBonus=100;
    input.pillars[3].m4Efficacy=supplied;input.pillars[3].rootRefs=['fabricated-caller-root'];
    const result=scoreWeightedSupport(input,options);
    assertLiteral(result,expected);
    assert.deepEqual(result.decisionTrace[6].rootRefs,[]);
    assert.equal(Object.hasOwn(result.inputFacts[3],'m4Efficacy'),false);
  }
});

// Reuse one finite synthetic calendar and cache each issued result. Each product request still invokes M1 once.
const calendarFixture=syntheticLocalChartCandidate();
const base=createLocalChartProfile(calendarFixture.loaded,{profileId:STAGE_A_PROFILE_ID,expectedManifestSha256:calendarFixture.expectedManifestSha256});
let m1Calls=0;
const selected=createExperimentalWeightedProfile({...base,calculate(request){m1Calls++;return base.calculate(request);}},{contextProfile:base,policyId});
const results=new Map();
function integrationResult(expected){
  if(!results.has(expected.id)){
    const before=m1Calls;
    const result=selected.calculate(chartRequest(expected.date,expected.time));
    assert.equal(m1Calls-before,1);
    results.set(expected.id,result);
  }
  return results.get(expected.id);
}
for(const expected of fixture.integrationCases)test('sensitivity synthetic calendar connection: '+expected.id,()=>{
  const result=integrationResult(expected);
  assert.equal(result.experimental.length,expected.candidates.length);
  assert.equal(result.existing.facts.candidates.length,expected.candidates.length);
  assert.equal(result.executionCounts.birthM1Calls,1);
  assert.equal(result.executionCounts.m2Derivations,1);
  assert.equal(result.executionCounts.experimentalCandidateAnalyses,expected.candidates.length);
  for(let i=0;i<expected.candidates.length;i++){
    const candidate=expected.candidates[i],actual=result.experimental[i];
    assert.deepEqual(actual.inputFacts.map(row=>row.stem+row.branch),candidate.pillars);
    assert.equal(actual.candidateRef,`chart.candidates[${i}]`);
    assertLiteral(actual,candidate);
  }
  assert.equal(result.existing.validation.finalStrength,'NOT_IMPLEMENTED');
  assert.equal(result.existing.validation.m3FinalInterpretationGate,'BLOCKED_UNCHANGED');
  assert.equal(result.existing.validation.g1P2Promotion,false);
  validateExperimentalWeightedResult(result);
});

test('same pillars at four civil times produce identical score facts and traces; hour transitions explain fixed deltas',()=>{
  const get=id=>integrationResult(fixture.integrationCases.find(row=>row.id===id)).experimental;
  const noon=get('same-hour-middle');
  for(const id of ['same-hour-start','same-hour-next-minute','same-hour-end'])assert.deepEqual(get(id),noon);
  assert.equal(noon[0].score.totalTenths-get('hour-before-noon')[0].score.totalTenths,5);
  assert.equal(get('hour-after-noon')[0].score.totalTenths-noon[0].score.totalTenths,-5);
  // 10:59→11:00: surface 0→0.5. 12:59→13:00: principal -1 plus first resource root +0.5.
  assert.deepEqual(get('hour-after-noon')[0].decisionTrace.map((row,i)=>row.contributionTenths-noon[0].decisionTrace[i].contributionTenths),[0,0,0,-10,0,0,5,0]);
});

test('displayed Jie minute preserves two correlated parents while B season alternatives reuse one score',()=>{
  const get=id=>integrationResult(fixture.integrationCases.find(row=>row.id===id));
  const before=get('jie-before'),at=get('jie-displayed-minute'),after=get('jie-after');
  assert.equal(at.existing.m1.chart.confidence,'PUBLISHED_MINUTE_AMBIGUOUS');
  assert.deepEqual(at.experimental.map(row=>row.score.totalTenths),[70,35]);
  assert.deepEqual(at.experimental[0],before.experimental[0]);
  assert.deepEqual(at.experimental[1].inputFacts.map(row=>row.stem+row.branch),after.experimental[0].inputFacts.map(row=>row.stem+row.branch));
  assert.equal(at.experimental[1].score.totalTenths-at.experimental[0].score.totalTenths,-35);
  assert.deepEqual(at.experimental.map(row=>row.inputFacts.slice(0,2).map(p=>p.stem+p.branch)),[['乙巳','己丑'],['丙午','庚寅']]);
  const b=get('season-b-at');
  assert.equal(b.existing.seasonal.candidates[0].judgment.alternatives.length,2);
  assert.equal(b.experimental.length,1);
  assert.deepEqual(b.experimental,get('season-b-before').experimental);
  assert.deepEqual(b.experimental,get('season-b-after').experimental);
});

const invalidInputs=[
  {id:'missing hour',code:'FOUR_DENSE_PILLARS_REQUIRED',change:input=>input.pillars.pop()},
  {id:'sparse pillar array',code:'FOUR_DENSE_PILLARS_REQUIRED',change:input=>delete input.pillars[1]},
  {id:'invalid stem',code:'ORDERED_VALID_PILLARS_REQUIRED',change:input=>input.pillars[0].stem='X'},
  {id:'invalid branch',code:'ORDERED_VALID_PILLARS_REQUIRED',change:input=>input.pillars[0].branch='X'},
  {id:'wrong role',code:'ORDERED_VALID_PILLARS_REQUIRED',change:input=>input.pillars[0].role='hour'},
  {id:'reversed roles',code:'ORDERED_VALID_PILLARS_REQUIRED',change:input=>input.pillars.reverse()},
  {id:'impossible parity pair',code:'GANZHI_PARITY_REQUIRED',change:input=>input.pillars[0].branch='卯'},
  {id:'crossed parent fact',code:'CROSS_CANDIDATE_FACT_REFERENCE',change:input=>input.pillars[0].factRef='facts.candidates[1].pillars[0]'},
  {id:'wrong fact position',code:'CROSS_CANDIDATE_FACT_REFERENCE',change:input=>input.pillars[0].factRef='facts.candidates[0].pillars[1]'},
  {id:'non-chart candidate reference',code:'CANDIDATE_REFERENCE_REQUIRED',change:input=>input.candidateRef='facts.candidates[0]'},
];
for(const row of invalidInputs)test('sensitivity rejects invalid pure input: '+row.id,()=>{
  const input=makeInput(['丙午','癸巳','丙午','甲午']);row.change(input);
  assert.throws(()=>scoreWeightedSupport(input,options),new RegExp(row.code));
});
for(const id of [undefined,'AUTO','M4-ZHENGGUAN-WEALTH-RESOURCE-POSITION-REVIEW-V01'])test('sensitivity rejects unselected scoring policy: '+String(id),()=>{
  assert.throws(()=>scoreWeightedSupport(makeInput(['丙午','癸巳','丙午','甲午']),{policyId:id}),/EXPLICIT_EXPERIMENTAL_POLICY_REQUIRED/);
});
for(const value of [-1,101,0.5,NaN,Infinity,Number.MAX_SAFE_INTEGER+1])test('sensitivity rejects scalar outside bounded integer domain: '+String(value),()=>{
  assert.throws(()=>weightedSupportClass(value),/BOUNDED_INTEGER_TENTHS_REQUIRED/);
});
for(const [id,request] of [
  ['missing time',{...chartRequest(),time:undefined}],
  ['invalid civil time',chartRequest('2026-06-01','24:00')],
  ['invalid civil date',chartRequest('2026-02-30')],
  ['historical date outside modern policy',chartRequest('1988-12-31')],
  ['2027 date outside profile',chartRequest('2027-01-01')],
  ['outside this finite synthetic dataset only',chartRequest('2025-12-31')],
])test('sensitivity calendar rejects unsupported or invalid request: '+id,()=>{
  assert.throws(()=>selected.calculate(request));
});
