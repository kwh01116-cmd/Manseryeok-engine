import assert from "node:assert/strict";
import test from "node:test";
import {
  EARTHLY_BRANCHES, BRANCH_RELATIONS_POLICY_V1, BRANCH_RELATION_KINDS,
  BRANCH_RELATION_RULES, branchRelationsBetween, collectFourPillarBranchRelations,
} from "../dist/index.js";

const policy = BRANCH_RELATIONS_POLICY_V1;
const oracle = Object.freeze({
  LIUHE: ["子丑","寅亥","卯戌","辰酉","巳申","午未"],
  LIUCHONG: ["子午","丑未","寅申","卯酉","辰戌","巳亥"],
  LIUHAI: ["子未","丑午","寅巳","卯辰","申亥","酉戌"],
  LIUPO: ["子酉","丑辰","寅亥","卯午","巳申","未戌"],
});
const directed = ["寅巳","巳申","申寅","丑戌","戌未","未丑"];
const symmetricKinds = ["LIUHE","LIUCHONG","LIUHAI","LIUPO"];
const matchSymmetric = (kind, a, b) => oracle[kind].some(pair =>
  (pair[0] === a && pair[1] === b) || (pair[1] === a && pair[0] === b));
const xingOrientation = (a,b) => {
  if (a === b) return "辰午酉亥".includes(a) ? "SELF_BETWEEN_OCCURRENCES" : null;
  if ((a==="子"&&b==="卯")||(a==="卯"&&b==="子")) return "BIDIRECTIONAL";
  if (directed.includes(a+b)) return "LEFT_TO_RIGHT";
  if (directed.includes(b+a)) return "RIGHT_TO_LEFT";
  return null;
};
const kinds = (a,b) => branchRelationsBetween(a,b,policy).map(hit=>hit.kind);

test("all six pairs for each of four symmetric classes match separately transcribed sources", () => {
  for (const kind of symmetricKinds) {
    assert.equal(oracle[kind].length,6);
    assert.equal(new Set(oracle[kind].map(pair=>[...pair].sort().join(""))).size,6);
    for (const pair of oracle[kind]) {
      const [a,b] = pair;
      const forward = branchRelationsBetween(a,b,policy).find(hit=>hit.kind===kind);
      const backward = branchRelationsBetween(b,a,policy).find(hit=>hit.kind===kind);
      for(const hit of [forward, backward]) {
        assert.ok(hit,kind + " " + pair);
        assert.equal(hit.orientation,"SYMMETRIC");
        assert.equal(hit.ruleId,BRANCH_RELATION_RULES[kind].ruleId);
        assert.deepEqual(hit.sourceIds,BRANCH_RELATION_RULES[kind].sourceIds);
        assert.equal(hit.status,"RAW_PAIR_MEMBERSHIP_ONLY");
      }
    }
  }
});

test("complete 12×12 source-independent oracle prevents spurious matches or suppressed overlaps", () => {
  let hits=0;
  for(const a of EARTHLY_BRANCHES) for(const b of EARTHLY_BRANCHES) {
    const expected = symmetricKinds.filter(kind=>matchSymmetric(kind,a,b));
    if (xingOrientation(a,b)) expected.push("XING");
    const observed = branchRelationsBetween(a,b,policy);
    assert.deepEqual(observed.map(hit=>hit.kind),expected,a + b);
    assert.equal(observed.length,new Set(observed.map(hit=>hit.kind)).size);
    const xing = observed.find(hit=>hit.kind==="XING");
    if(xing) assert.equal(xing.orientation,xingOrientation(a,b),a+b);
    hits+=observed.length;
  }
  assert.equal(hits,66); // 4×12 symmetric + 12 directed + 2 reciprocal + 4 self
  assert.deepEqual(BRANCH_RELATION_KINDS,["LIUHE","LIUCHONG","LIUHAI","LIUPO","XING"]);
});

test("punishment has directional classical cycles, reciprocal Zi–Mao and distinct-occurrence self-punishment", () => {
  for(const pair of directed) {
    const a=pair[0],b=pair[1];
    assert.equal(branchRelationsBetween(a,b,policy).find(x=>x.kind==="XING").orientation,"LEFT_TO_RIGHT");
    assert.equal(branchRelationsBetween(b,a,policy).find(x=>x.kind==="XING").orientation,"RIGHT_TO_LEFT");
  }
  assert.equal(branchRelationsBetween("子","卯",policy).find(x=>x.kind==="XING").orientation,"BIDIRECTIONAL");
  assert.equal(branchRelationsBetween("卯","子",policy).find(x=>x.kind==="XING").orientation,"BIDIRECTIONAL");
  for(const branch of EARTHLY_BRANCHES) {
    assert.deepEqual(kinds(branch,branch), "辰午酉亥".includes(branch)?["XING"]:[]);
  }
  assert.deepEqual(kinds("子","子"),[]);
});

test("same pair can have several independent labels without inferred conflict resolution",()=>{
  assert.deepEqual(kinds("巳","申"),["LIUHE","LIUPO","XING"]);
  assert.deepEqual(kinds("寅","亥"),["LIUHE","LIUPO"]);
  assert.deepEqual(kinds("寅","巳"),["LIUHAI","XING"]);
  assert.deepEqual(kinds("丑","未"),["LIUCHONG","XING"]);
  assert.deepEqual(kinds("午","卯"),["LIUPO"]);
  assert.deepEqual(kinds("子","午"),["LIUCHONG"]);
  assert.deepEqual(kinds("辰","辰"),["XING"]);
});

test("4 actual independent positions produce six positional pairs, never self on one occurrence",()=>{
  assert.deepEqual(collectFourPillarBranchRelations(["子","丑","寅","卯"],policy)
    .map(x=>[x.kind,x.leftPillarIndex,x.rightPillarIndex]),[["LIUHE",0,1],["XING",0,3]]);
  const repeated=collectFourPillarBranchRelations(["辰","辰","子","寅"],policy);
  assert.equal(repeated.filter(x=>x.kind==="XING").length,1);
  assert.deepEqual(repeated.find(x=>x.kind==="XING"),{
    kind:"XING",ruleId:BRANCH_RELATION_RULES.XING.ruleId,
    sourceIds:BRANCH_RELATION_RULES.XING.sourceIds,
    orientation:"SELF_BETWEEN_OCCURRENCES",status:"RAW_PAIR_MEMBERSHIP_ONLY",
    leftPillarIndex:0,rightPillarIndex:1,leftBranch:"辰",rightBranch:"辰",
  });
  const four=collectFourPillarBranchRelations(["辰","辰","辰","辰"],policy);
  assert.equal(four.length,6);
  assert.deepEqual(new Set(four.map(x=>x.leftPillarIndex+":"+x.rightPillarIndex)),
    new Set(["0:1","0:2","0:3","1:2","1:3","2:3"]));
  assert.deepEqual(collectFourPillarBranchRelations(["子","子","子","子"],policy),[]);
});

test("source IDs separate classical records from modern LiuPo variant and never assert strength",()=>{
  assert.equal(BRANCH_RELATION_RULES.LIUPO.evidenceLayer,"MODERN_HEURISTIC");
  assert.equal(BRANCH_RELATION_RULES.LIUPO.disputeStatus,"SCHOOL_DEPENDENT");
  for(const kind of BRANCH_RELATION_KINDS){
    const record=BRANCH_RELATION_RULES[kind];
    assert.equal(record.policyId,policy);
    assert.equal(record.codeability,"CONDITIONAL");
    assert.equal(record.meaning,"RAW_PAIR_MEMBERSHIP_ONLY");
    assert.equal(record.sourceIds.length,1);
    assert.equal(Object.isFrozen(record),true);
    assert.equal(Object.isFrozen(record.sourceIds),true);
  }
  const hits=collectFourPillarBranchRelations(["巳","申","寅","亥"],policy);
  assert.ok(hits.length>=7);
  for(const hit of hits){
    assert.equal(hit.status,"RAW_PAIR_MEMBERSHIP_ONLY");
    for(const forbidden of ["transformation","strength","effectiveness","auspiciousness","score","luck"])
      assert.equal(Object.hasOwn(hit,forbidden),false);
  }
});

test("bogus policy, malformed inputs and prototype keys are rejected before lookups",()=>{
  for(const bad of [undefined,null,"","AUTO","DEFAULT",{},"__proto__",0]){
    assert.throws(()=>branchRelationsBetween("子","午",bad),RangeError);
    assert.throws(()=>branchRelationsBetween(bad,"午",policy),RangeError);
    assert.throws(()=>branchRelationsBetween("子",bad,policy),RangeError);
    assert.throws(()=>collectFourPillarBranchRelations(["子","丑","寅","卯"],bad),RangeError);
  }
  for(const bad of [[],["子"],["子","丑","寅"],["子","丑","寅","卯","辰"],null,{},["子","卯","MISSING","午"]])
    assert.throws(()=>collectFourPillarBranchRelations(bad,policy),RangeError);
});

test("returned relation hit lists and positional facts are deeply immutable",()=>{
  const r=branchRelationsBetween("巳","申",policy);
  assert.equal(Object.isFrozen(r),true);
  assert.ok(r.every(Object.isFrozen));
  assert.throws(()=>r.push("EXTRA"),TypeError);
  assert.throws(()=>{r[0].kind="XING"},TypeError);
  assert.throws(()=>r[0].sourceIds.push("EXTRA"),TypeError);
  const four=collectFourPillarBranchRelations(["巳","申","寅","亥"],policy);
  assert.equal(Object.isFrozen(four),true);
  assert.ok(four.every(Object.isFrozen));
  assert.throws(()=>four.pop(),TypeError);
  assert.throws(()=>{four[0].leftPillarIndex=100},TypeError);
});
