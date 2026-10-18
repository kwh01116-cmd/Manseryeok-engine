import assert from "node:assert/strict";
import test from "node:test";
import {
  BRANCH_RELATIONS_POLICY_V1, BRANCH_RELATION_KINDS, BRANCH_RELATION_RULES,
  HIDDEN_STEM_POLICY_V1, M2_CHART_FACTS_V2_SCHEMA,
  deriveM2ChartFacts, deriveM2ChartFactsV2, collectFourPillarBranchRelations,
  createKoreanLunisolarConverter, KASI_KOREAN_LUNISOLAR_2025_2027,
} from "../dist/index.js";
import { resolveKoreanBirthChartPreview } from "../dist/calendar/koreanBirthPreview.js";
import { KOREA_SOLAR_TERM_EVENTS_2026_2027 as events } from "../dist/calendar/koreaSolarTermFixtures.js";

const converter=createKoreanLunisolarConverter(KASI_KOREAN_LUNISOLAR_2025_2027);
const policy={timeBasis:"KOREAN_CIVIL_TIME",dayRollover:"CIVIL_MIDNIGHT",hourStemReference:"SELECTED_DAY_PILLAR"};
const manifest={schemaVersion:"m1-solar-term-coverage-v1",requirementProfile:"FULL_24_TERM_YEAR",
  timeBasis:"KST",sourcePrecision:"MINUTE",supportedFromInclusive:"2026-01-01T00:00",
  supportedUntilExclusive:"2028-01-01T00:00",requiredYears:[2026,2027],
  requiredPriorBoundary:{year:2025,term:"DAXUE"}};
const calculate=(input,clock="12:00")=>resolveKoreanBirthChartPreview(input,clock,policy,converter,events,manifest);
const solar=date=>({calendar:"GREGORIAN",gregorianDate:date});
const lunar=(year,month,day,isLeapMonth=false)=>({calendar:"KOREAN_LUNAR",
  lunarDate:{lunarYear:year,lunarMonth:month,lunarDay:day,isLeapMonth}});
const project=result=>deriveM2ChartFactsV2(result,HIDDEN_STEM_POLICY_V1,BRANCH_RELATIONS_POLICY_V1);

function assertTraceableRelations(candidate){
  const branches=candidate.pillars.map(x=>x.branch);
  const original=collectFourPillarBranchRelations(branches,BRANCH_RELATIONS_POLICY_V1);
  assert.equal(candidate.branchRelations.length,original.length);
  for(let i=0;i<original.length;i++){
    const a=original[i],b=candidate.branchRelations[i];
    for(const key of Object.keys(a)) assert.deepEqual(b[key],a[key],key);
    assert.equal(b.leftPillarRole,candidate.pillars[a.leftPillarIndex].role);
    assert.equal(b.rightPillarRole,candidate.pillars[a.rightPillarIndex].role);
    assert.equal(b.leftFactRef,candidate.pillars[a.leftPillarIndex].factRef);
    assert.equal(b.rightFactRef,candidate.pillars[a.rightPillarIndex].factRef);
    if(b.orientation==="LEFT_TO_RIGHT"){
      assert.equal(b.fromPillarRole,b.leftPillarRole);
      assert.equal(b.toPillarRole,b.rightPillarRole);
    }else if(b.orientation==="RIGHT_TO_LEFT"){
      assert.equal(b.fromPillarRole,b.rightPillarRole);
      assert.equal(b.toPillarRole,b.leftPillarRole);
    }else{
      assert.equal(Object.hasOwn(b,"fromPillarRole"),false);
      assert.equal(Object.hasOwn(b,"toPillarRole"),false);
    }
  }
}

test("M2 v2 upgrades real M1 Four Pillars without changing M2 v1 candidates or original provenance",()=>{
  const birth=calculate(solar("2027-02-05"));
  const v1=deriveM2ChartFacts(birth,HIDDEN_STEM_POLICY_V1);
  const v2=project(birth);
  assert.equal(v1.status,"READY");
  assert.equal(v2.status,"READY");
  assert.equal(v2.schemaVersion,M2_CHART_FACTS_V2_SCHEMA);
  assert.equal(v2.ruleId,"M2-RULE-CHART-FACTS-002");
  assert.equal(v2.evidenceClass,"TRADITIONAL_RULE_LOOKUP_ONLY");
  assert.equal(v2.branchRelationsPolicyId,BRANCH_RELATIONS_POLICY_V1);
  assert.deepEqual(v2.branchRelationRuleIds,BRANCH_RELATION_KINDS.map(k=>BRANCH_RELATION_RULES[k].ruleId));
  assert.deepEqual(v2.branchRelationPolicySourceIds,[...new Set(
    BRANCH_RELATION_KINDS.flatMap(k=>BRANCH_RELATION_RULES[k].sourceIds))].sort());
  assert.deepEqual(v2.solarTermSourceIds,v1.solarTermSourceIds);
  assert.deepEqual(v2.policies,v1.policies);
  assert.deepEqual(v2.coverage,v1.coverage);
  assert.deepEqual(v2.confidence,v1.confidence);
  assert.equal(v2.candidates.length,1);
  for(let i=0;i<v2.candidates.length;i++){
    const {branchRelations,...remaining}=v2.candidates[i];
    assert.deepEqual(remaining,v1.candidates[i]);
    assertTraceableRelations(v2.candidates[i]);
  }
  for(const forbidden of ["fortune","usefulGod","strength","pattern","harmEffect","transformedElement"])
    assert.equal(Object.hasOwn(v2,forbidden),false);
});

test("equivalent solar and Korean-lunar input retain same positional raw relations and separate lunar source",()=>{
  const g=project(calculate(solar("2027-02-05")));
  const l=project(calculate(lunar(2026,12,29)));
  assert.equal(g.status,"READY");
  assert.equal(l.status,"READY");
  assert.deepEqual(g.candidates,l.candidates);
  assert.deepEqual(g.branchRelationRuleIds,l.branchRelationRuleIds);
  assert.equal(g.lunarConversionSource,undefined);
  assert.equal(l.lunarConversionSource.sourceId,"KR-KASI-CALENDAR-DATA");
});

test("Lichun candidate fork preserves distinct positional branch relations per candidate",()=>{
  const m1=calculate(solar("2027-02-04"),"10:46");
  const v2=project(m1);
  assert.equal(v2.status,"READY");
  assert.equal(v2.confidence,"PUBLISHED_MINUTE_AMBIGUOUS");
  assert.equal(v2.candidateDisplay,"SHOW_ALL_BOUNDARY_CANDIDATES");
  assert.equal(v2.candidates.length,2);
  for(let i=0;i<2;i++){
    const candidate=v2.candidates[i];
    assert.equal(candidate.candidateIndex,i);
    assertTraceableRelations(candidate);
    assert.equal(candidate.pillars[0].branch,m1.preview.candidates[i].year.branch);
    assert.equal(candidate.pillars[1].branch,m1.preview.candidates[i].month.branch);
  }
  assert.notDeepEqual(v2.candidates[0].pillars[1].branch,v2.candidates[1].pillars[1].branch);
  assert.notDeepEqual(v2.candidates[0].pillars[0].branch,v2.candidates[1].pillars[0].branch);
});

test("both M1 reject statuses produce empty frozen M2 v2 results, with no fabricated relations",()=>{
  assert.deepEqual(project(calculate(solar("2028-01-01"))),{
    schemaVersion:M2_CHART_FACTS_V2_SCHEMA,status:"BLOCKED",reason:"OUT_OF_COVERAGE",candidates:[],
  });
  assert.deepEqual(project(calculate(lunar(2026,6,1,true))),{
    schemaVersion:M2_CHART_FACTS_V2_SCHEMA,status:"BLOCKED",reason:"INVALID_LUNAR_DATE",candidates:[],
  });
  assert.equal(Object.isFrozen(project(calculate(solar("2028-01-01")))),true);
});

test("no profile default and forged or inconsistent M1 results never enter the v2 facts pipeline",()=>{
  const input=calculate(solar("2027-02-05"));
  for(const invalid of [null,undefined,"","AUTO",{},0,"M2-BRANCH-RELATIONS-V0"]){
    assert.throws(()=>deriveM2ChartFactsV2(input,HIDDEN_STEM_POLICY_V1,invalid),RangeError);
    assert.throws(()=>deriveM2ChartFactsV2(input,invalid,BRANCH_RELATIONS_POLICY_V1),RangeError);
  }
  assert.throws(()=>project({status:"UNKNOWN",preview:input.preview}),RangeError);
  assert.throws(()=>project({status:"OK",preview:{...input.preview,solarTermSourceIds:[]}}),RangeError);
  assert.throws(()=>project({status:"OK",preview:{...input.preview,candidates:[]}}),RangeError);
});

test("result, each candidate and each nested positional hit remain immutable snapshots",()=>{
  const input=calculate(solar("2027-02-05"));
  const facts=project(input);
  assert.equal(facts.status,"READY");
  assert.ok(Object.isFrozen(facts));
  assert.ok(Object.isFrozen(facts.branchRelationRuleIds));
  assert.ok(Object.isFrozen(facts.branchRelationPolicySourceIds));
  assert.ok(Object.isFrozen(facts.sourceRuleIds));
  assert.ok(Object.isFrozen(facts.candidates));
  for(const c of facts.candidates){
    assert.ok(Object.isFrozen(c));
    assert.ok(Object.isFrozen(c.pillars));
    assert.ok(Object.isFrozen(c.branchRelations));
    assert.ok(c.branchRelations.every(Object.isFrozen));
  }
  assert.throws(()=>facts.candidates.push({}),TypeError);
  assert.throws(()=>facts.sourceRuleIds.push("FORGED"),TypeError);
  if(facts.candidates[0].branchRelations.length){
    const hit=facts.candidates[0].branchRelations[0];
    assert.throws(()=>{hit.kind="XING"},TypeError);
    assert.throws(()=>hit.sourceIds.push("FORGED"),TypeError);
  }
  const previous=facts.candidates[0].pillars[0].branch;
  input.preview.candidates[0].year.branch="子";
  assert.equal(facts.candidates[0].pillars[0].branch,previous);
});
