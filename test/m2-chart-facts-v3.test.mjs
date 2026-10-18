import assert from "node:assert/strict";
import test from "node:test";
import {
  TRIAD_MEMBERSHIP_POLICY_V1, TRIAD_DEFINITIONS, TRIAD_RULES,
  BRANCH_RELATIONS_POLICY_V1, HIDDEN_STEM_POLICY_V1,
  M2_CHART_FACTS_V3_SCHEMA, deriveM2ChartFactsV2, deriveM2ChartFactsV3,
  collectFourPillarTriadMemberships, createKoreanLunisolarConverter,
  KASI_KOREAN_LUNISOLAR_2025_2027,
} from "../dist/index.js";
import { resolveKoreanBirthChartPreview } from "../dist/calendar/koreanBirthPreview.js";
import { KOREA_SOLAR_TERM_EVENTS_2026_2027 as events } from "../dist/calendar/koreaSolarTermFixtures.js";

const converter = createKoreanLunisolarConverter(KASI_KOREAN_LUNISOLAR_2025_2027);
const policies = {timeBasis:"KOREAN_CIVIL_TIME",dayRollover:"CIVIL_MIDNIGHT",
  hourStemReference:"SELECTED_DAY_PILLAR"};
const manifest = {schemaVersion:"m1-solar-term-coverage-v1",
  requirementProfile:"FULL_24_TERM_YEAR",timeBasis:"KST",sourcePrecision:"MINUTE",
  supportedFromInclusive:"2026-01-01T00:00",supportedUntilExclusive:"2028-01-01T00:00",
  requiredYears:[2026,2027],requiredPriorBoundary:{year:2025,term:"DAXUE"}};
const solar = date => ({calendar:"GREGORIAN",gregorianDate:date});
const lunar = (year,month,day,isLeapMonth=false) => ({calendar:"KOREAN_LUNAR",
  lunarDate:{lunarYear:year,lunarMonth:month,lunarDay:day,isLeapMonth}});
const birth = (date,time="12:00") => resolveKoreanBirthChartPreview(
  date,time,policies,converter,events,manifest);
const v3 = input => deriveM2ChartFactsV3(input,HIDDEN_STEM_POLICY_V1,
  BRANCH_RELATIONS_POLICY_V1,TRIAD_MEMBERSHIP_POLICY_V1);
const v2 = input => deriveM2ChartFactsV2(input,HIDDEN_STEM_POLICY_V1,BRANCH_RELATIONS_POLICY_V1);

function checkCandidateEvidence(candidate) {
  const expected=collectFourPillarTriadMemberships(
    candidate.pillars.map(p=>p.branch),TRIAD_MEMBERSHIP_POLICY_V1);
  assert.equal(candidate.triadMemberships.length,expected.length);
  assert.deepEqual(candidate.triadMemberships.map(x=>x.definitionId),
    expected.map(x=>x.definitionId));
  for(let i=0;i<expected.length;i++) {
    const actual=candidate.triadMemberships[i];
    const original=expected[i];
    assert.equal(actual.status,original.status);
    assert.equal(actual.ruleId,original.ruleId);
    assert.deepEqual(actual.sourceIds,original.sourceIds);
    assert.deepEqual(actual.missingBranches,original.missingBranches);
    assert.equal(actual.partialKind,original.partialKind);
    for(let j=0;j<3;j++){
      const member=actual.members[j],m=original.members[j];
      assert.equal(member.branch,m.branch);
      assert.deepEqual(member.pillarIndices,m.pillarIndices);
      assert.deepEqual(member.pillarRoles,m.pillarIndices.map(index=>candidate.pillars[index].role));
      assert.deepEqual(member.pillarFactRefs,m.pillarIndices.map(index=>candidate.pillars[index].factRef));
      for(const ref of member.pillarFactRefs){
        assert.match(ref,new RegExp(`^preview\\.candidates\\[${candidate.candidateIndex}\\]\\.(year|month|day|hour)$`));
      }
    }
  }
}

test("M2 v3 upgrades the REAL M1→v2 candidate unchanged and adds only raw triad membership facts",()=>{
  const m1=birth(solar("2027-02-05"));
  const original=v2(m1);
  const projected=v3(m1);
  assert.equal(original.status,"READY");
  assert.equal(projected.status,"READY");
  assert.equal(projected.schemaVersion,M2_CHART_FACTS_V3_SCHEMA);
  assert.equal(projected.ruleId,"M2-RULE-CHART-FACTS-003");
  assert.equal(projected.evidenceClass,"TRADITIONAL_RULE_LOOKUP_ONLY");
  assert.equal(projected.triadMembershipPolicyId,TRIAD_MEMBERSHIP_POLICY_V1);
  assert.deepEqual(projected.triadMembershipRuleIds,[TRIAD_RULES.SANHE.ruleId,TRIAD_RULES.SANHUI.ruleId]);
  assert.ok(projected.triadMembershipPolicySourceIds.includes(TRIAD_RULES.SANHE.sourceIds[0]));
  assert.ok(projected.triadMembershipPolicySourceIds.includes(TRIAD_RULES.SANHUI.sourceIds[0]));
  assert.deepEqual(projected.solarTermSourceIds,original.solarTermSourceIds);
  assert.deepEqual(projected.policies,original.policies);
  assert.deepEqual(projected.coverage,original.coverage);
  assert.equal(projected.candidateDisplay,"ONE");
  assert.equal(projected.candidates.length,1);
  for(let i=0;i<projected.candidates.length;i++){
    const {triadMemberships,...rest}=projected.candidates[i];
    assert.deepEqual(rest,original.candidates[i]);
    checkCandidateEvidence(projected.candidates[i]);
  }
  for(const prohibited of ["activated","strength","luck","pattern","fortune","transformedElement","prediction"]) {
    assert.equal(Object.hasOwn(projected,prohibited),false);
  }
});

test("Gregorian and Korean lunar representations produce exact same candidate triads while preserving lunar source",()=>{
  const g=v3(birth(solar("2027-02-05")));
  const l=v3(birth(lunar(2026,12,29)));
  assert.equal(g.status,"READY");
  assert.equal(l.status,"READY");
  assert.deepEqual(g.candidates,l.candidates);
  assert.deepEqual(g.triadMembershipRuleIds,l.triadMembershipRuleIds);
  assert.deepEqual(g.triadMembershipPolicySourceIds,l.triadMembershipPolicySourceIds);
  assert.equal(g.lunarConversionSource,undefined);
  assert.equal(l.lunarConversionSource.sourceId,"KR-KASI-CALENDAR-DATA");
});

test("real published-minute Lichun forks two separate candidate facts with independent member refs",()=>{
  const input=birth(solar("2027-02-04"),"10:46");
  const result=v3(input);
  assert.equal(result.status,"READY");
  assert.equal(result.confidence,"PUBLISHED_MINUTE_AMBIGUOUS");
  assert.equal(result.candidateDisplay,"SHOW_ALL_BOUNDARY_CANDIDATES");
  assert.equal(result.candidates.length,2);
  for(let i=0;i<2;i++) {
    const c=result.candidates[i];
    assert.equal(c.candidateIndex,i);
    checkCandidateEvidence(c);
    for(const group of c.triadMemberships)
      for(const member of group.members)
        for(const ref of member.pillarFactRefs)
          assert.match(ref,new RegExp(`^preview\\.candidates\\[${i}\\]\\.`));
  }
  assert.notDeepEqual(result.candidates[0].pillars.map(p=>p.branch),
    result.candidates[1].pillars.map(p=>p.branch));
});

test("at least one real 2027 spring Gregorian date has full 寅卯辰 seasonal presence in four genuine pillars",()=>{
  let full;
  // In the 寅 month, 辰 hour is fixed at 08:00. 12-day cycling of the day
  // branch guarantees a 卯 day during the 24-day search interval.
  for(let day=5;day<=28;day++){
    const date=`2027-02-${String(day).padStart(2,"0")}`;
    const candidate=v3(birth(solar(date),"08:00"));
    assert.equal(candidate.status,"READY");
    const presence=candidate.candidates[0].triadMemberships.find(x=>
      x.definitionId==="SANHUI_WOOD" && x.status==="THREE_DISTINCT_MEMBERS");
    if(presence){ full={presence,candidate,date};break; }
  }
  assert.ok(full,"a real 春月 寅卯辰 combination should exist, not merely a synthetic branch list");
  assert.deepEqual(full.presence.missingBranches,[]);
  assert.deepEqual(full.presence.members.map(m=>m.branch),["寅","卯","辰"]);
  assert.equal(full.presence.ruleId,TRIAD_RULES.SANHUI.ruleId);
  checkCandidateEvidence(full.candidate.candidates[0]);
  assert.equal(Object.hasOwn(full.presence,"transformedElement"),false);
});

test("out-of-coverage and impossible lunar dates remain blocked and never invent three-way relations",()=>{
  for(const [input,reason] of [
    [birth(solar("2028-01-01")),"OUT_OF_COVERAGE"],
    [birth(lunar(2026,6,1,true)),"INVALID_LUNAR_DATE"],
  ]){
    const result=v3(input);
    assert.deepEqual(result,{schemaVersion:M2_CHART_FACTS_V3_SCHEMA,status:"BLOCKED",reason,candidates:[]});
    assert.ok(Object.isFrozen(result));
  }
});

test("unverified policies, forged M1 source, mismatched candidate count fail closed",()=>{
  const ok=birth(solar("2027-02-05"));
  for(const invalid of [undefined,null,"",0,{},"AUTO","__proto__"]){
    assert.throws(()=>deriveM2ChartFactsV3(ok,HIDDEN_STEM_POLICY_V1,
      BRANCH_RELATIONS_POLICY_V1,invalid),RangeError);
    assert.throws(()=>deriveM2ChartFactsV3(ok,invalid,
      BRANCH_RELATIONS_POLICY_V1,TRIAD_MEMBERSHIP_POLICY_V1),RangeError);
    assert.throws(()=>deriveM2ChartFactsV3(ok,HIDDEN_STEM_POLICY_V1,
      invalid,TRIAD_MEMBERSHIP_POLICY_V1),RangeError);
  }
  assert.throws(()=>v3({status:"OK",preview:{...ok.preview,solarTermSourceIds:[]}}),RangeError);
  assert.throws(()=>v3({status:"OK",preview:{...ok.preview,candidates:[]}}),RangeError);
  assert.throws(()=>v3({status:"UNKNOWN",preview:ok.preview}),RangeError);
});

test("all nested source arrays and member role/reference arrays are frozen snapshots",()=>{
  const source=birth(solar("2027-02-05"));
  const result=v3(source);
  assert.equal(result.status,"READY");
  assert.ok(Object.isFrozen(result));
  assert.ok(Object.isFrozen(result.triadMembershipRuleIds));
  assert.ok(Object.isFrozen(result.triadMembershipPolicySourceIds));
  assert.ok(Object.isFrozen(result.sourceRuleIds));
  assert.ok(Object.isFrozen(result.candidates));
  assert.throws(()=>result.candidates.push({}),TypeError);
  for(const c of result.candidates){
    assert.ok(Object.isFrozen(c));
    assert.ok(Object.isFrozen(c.triadMemberships));
    assert.ok(c.triadMemberships.every(Object.isFrozen));
    for(const group of c.triadMemberships) {
      assert.ok(Object.isFrozen(group.members));
      assert.ok(Object.isFrozen(group.missingBranches));
      assert.ok(Object.isFrozen(group.sourceIds));
      for(const member of group.members){
        assert.ok(Object.isFrozen(member));
        assert.ok(Object.isFrozen(member.pillarIndices));
        assert.ok(Object.isFrozen(member.pillarRoles));
        assert.ok(Object.isFrozen(member.pillarFactRefs));
        assert.throws(()=>member.pillarRoles.push("hour"),TypeError);
      }
    }
  }
  const old=result.candidates[0].pillars[0].branch;
  source.preview.candidates[0].year.branch="子";
  assert.equal(result.candidates[0].pillars[0].branch,old);
});
