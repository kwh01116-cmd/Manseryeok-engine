import assert from "node:assert/strict";
import test from "node:test";
import {
  EARTHLY_BRANCHES, TRIAD_MEMBERSHIP_POLICY_V1, TRIAD_DEFINITIONS, TRIAD_RULES,
  collectFourPillarTriadMemberships,
} from "../dist/index.js";

const POLICY = TRIAD_MEMBERSHIP_POLICY_V1;
// Oracle transcribed separately from the source implementation. Order reflects
// 生旺墓 for 三合 and east/south/west/north seasonal sequences for 三會.
const witness = Object.freeze({
  SANHE_WATER: {family:"SANHE", element:"WATER", members:["申","子","辰"]},
  SANHE_WOOD:  {family:"SANHE", element:"WOOD",  members:["亥","卯","未"]},
  SANHE_FIRE:  {family:"SANHE", element:"FIRE",  members:["寅","午","戌"]},
  SANHE_METAL: {family:"SANHE", element:"METAL", members:["巳","酉","丑"]},
  SANHUI_WOOD: {family:"SANHUI",element:"WOOD",  members:["寅","卯","辰"]},
  SANHUI_FIRE: {family:"SANHUI",element:"FIRE",  members:["巳","午","未"]},
  SANHUI_METAL:{family:"SANHUI",element:"METAL", members:["申","酉","戌"]},
  SANHUI_WATER:{family:"SANHUI",element:"WATER", members:["亥","子","丑"]},
});
const byId = facts => Object.fromEntries(facts.map(x=>[x.definitionId,x]));
const expectedPartial=(w, present)=>{
  if(present.every(Boolean))return null;
  if(w.family==="SANHUI")return "SANHUI_PARTIAL_MEMBERS";
  return present[1] ? (present[0] ? "BIRTH_AND_CENTER" : "CENTER_AND_TOMB")
    : "BIRTH_AND_TOMB_NOT_HALF_TRINE";
};

test("four 三合 and four 三會 memberships match separately pinned source tables",()=>{
  assert.deepEqual(TRIAD_DEFINITIONS.map(d=>d.id),Object.keys(witness));
  for(const d of TRIAD_DEFINITIONS) {
    assert.equal(d.family,witness[d.id].family);
    assert.equal(d.element,witness[d.id].element);
    assert.deepEqual(d.members,witness[d.id].members);
    assert.equal(Object.isFrozen(d),true);
    assert.equal(Object.isFrozen(d.members),true);
  }
  assert.equal(TRIAD_RULES.SANHE.evidenceLayer,"CLASSICAL_BASE_TEXT");
  assert.equal(TRIAD_RULES.SANHUI.evidenceLayer,"MODERN_HEURISTIC");
  for(const r of Object.values(TRIAD_RULES)) {
    assert.equal(r.policyId,POLICY);
    assert.equal(r.codeability,"CONDITIONAL");
    assert.equal(r.disputeStatus,"SCHOOL_DEPENDENT");
    assert.equal(r.meaning,"PRESENCE_OF_DISTINCT_MEMBER_BRANCHES_ONLY");
    assert.ok(r.sourceIds.length>0);
    assert.ok(Object.isFrozen(r.sourceIds));
  }
});

test("all eight full triads need three DISTINCT original branches, not three occurrences",()=>{
  for(const [id,w] of Object.entries(witness)) {
    const [a,b,c]=w.members;
    const out=byId(collectFourPillarTriadMemberships([a,b,c,a],POLICY));
    assert.equal(out[id].status,"THREE_DISTINCT_MEMBERS",id);
    assert.equal(out[id].distinctMemberCount,3);
    assert.equal(out[id].partialKind,null);
    assert.deepEqual(out[id].missingBranches,[]);
    assert.deepEqual(out[id].members.map(m=>m.pillarIndices),[[0,3],[1],[2]]);
    assert.deepEqual(out[id].sourceIds,TRIAD_RULES[w.family].sourceIds);
    const onlyRepeated=collectFourPillarTriadMemberships([a,a,a,a],POLICY);
    assert.equal(byId(onlyRepeated)[id],undefined,id);
    assert.equal(onlyRepeated.length,0);
  }
});

test("half 三合 needs center for a named half; 生+墓 without 旺 is only raw member presence",()=>{
  for(const [id,w] of Object.entries(witness).filter(([,v])=>v.family==="SANHE")) {
    const [birth,center,tomb]=w.members;
    for(const [partial,missing,expectedKind] of [
      [[birth,center],tomb,"BIRTH_AND_CENTER"],
      [[center,tomb],birth,"CENTER_AND_TOMB"],
      [[birth,tomb],center,"BIRTH_AND_TOMB_NOT_HALF_TRINE"],
    ]) {
      const hit=byId(collectFourPillarTriadMemberships(
        [partial[0],partial[0],partial[1],partial[1]],POLICY))[id];
      assert.equal(hit.status,"TWO_DISTINCT_MEMBERS");
      assert.equal(hit.partialKind,expectedKind);
      assert.equal(hit.distinctMemberCount,2);
      assert.deepEqual(hit.missingBranches,[missing]);
      assert.deepEqual(hit.members.find(x=>x.branch===missing).pillarIndices,[]);
      assert.ok(hit.sourceIds.length>TRIAD_RULES.SANHE.sourceIds.length);
    }
  }
});

test("partial 三會 means only observed member structure, never automatically 'half meeting formed'",()=>{
  for(const [id,w] of Object.entries(witness).filter(([,v])=>v.family==="SANHUI")) {
    const [a,b,c]=w.members;
    const result=byId(collectFourPillarTriadMemberships([a,b,b,a],POLICY))[id];
    assert.equal(result.status,"TWO_DISTINCT_MEMBERS");
    assert.equal(result.partialKind,"SANHUI_PARTIAL_MEMBERS");
    assert.deepEqual(result.missingBranches,[c]);
    assert.deepEqual(result.sourceIds,TRIAD_RULES.SANHUI.sourceIds);
  }
});

test("all 12⁴ positional charts match independent oracle for every full/partial/missing member case",()=>{
  let charts=0, appearances=0;
  for(const y of EARTHLY_BRANCHES) for(const m of EARTHLY_BRANCHES)
  for(const d of EARTHLY_BRANCHES) for(const h of EARTHLY_BRANCHES) {
    const four=[y,m,d,h];
    const facts=collectFourPillarTriadMemberships(four,POLICY);
    const expected=Object.entries(witness).filter(([,w])=>
      w.members.filter(b=>four.includes(b)).length>=2);
    assert.deepEqual(facts.map(f=>f.definitionId),expected.map(([id])=>id),four.join(""));
    for(const fact of facts) {
      const w=witness[fact.definitionId];
      const present=w.members.map(b=>four.includes(b));
      const count=present.filter(Boolean).length;
      assert.equal(fact.distinctMemberCount,count);
      assert.equal(fact.status,count===3?"THREE_DISTINCT_MEMBERS":"TWO_DISTINCT_MEMBERS");
      assert.equal(fact.partialKind,expectedPartial(w,present),four.join(""));
      assert.deepEqual(fact.members.map(x=>x.pillarIndices),
        w.members.map(branch=>four.flatMap((b,i)=>b===branch?[i]:[])));
      assert.deepEqual(fact.missingBranches,w.members.filter(b=>!four.includes(b)));
      assert.equal(fact.namedElement,w.element);
      assert.equal(fact.evidenceClass,"RAW_MEMBERSHIP_ONLY");
      assert.equal(fact.ruleId,TRIAD_RULES[w.family].ruleId);
      assert.equal(fact.policyId,POLICY);
      assert.ok(Object.isFrozen(fact));
      assert.ok(Object.isFrozen(fact.members));
      appearances++;
    }
    charts++;
  }
  assert.equal(charts,20736);
  assert.ok(appearances>0);
});

test("full 三合 and partial 三會 may coexist and must not suppress each other",()=>{
  const out=byId(collectFourPillarTriadMemberships(["申","子","辰","酉"],POLICY));
  assert.equal(out.SANHE_WATER.status,"THREE_DISTINCT_MEMBERS");
  assert.equal(out.SANHUI_METAL.status,"TWO_DISTINCT_MEMBERS");
  assert.equal(out.SANHUI_METAL.partialKind,"SANHUI_PARTIAL_MEMBERS");
  assert.deepEqual(out.SANHE_WATER.members.map(m=>m.pillarIndices),[[0],[1],[2]]);
  assert.deepEqual(out.SANHUI_METAL.members.map(m=>m.pillarIndices),[[0],[3],[]]);
  const completelyDifferent=collectFourPillarTriadMemberships(["寅","卯","辰","寅"],POLICY);
  assert.equal(byId(completelyDifferent).SANHUI_WOOD.status,"THREE_DISTINCT_MEMBERS");
  assert.equal(Object.hasOwn(byId(completelyDifferent),"SANHE_WOOD"),false);
});

test("bogus policy, prototype-looking branches and non-four-branch input fail closed",()=>{
  for(const invalid of [undefined,null,"",0,{},"__proto__","AUTO"]) {
    assert.throws(()=>collectFourPillarTriadMemberships(["申","子","辰","子"],invalid),RangeError);
  }
  for(const x of [undefined,null,{},[],["申"],["申","子","辰"],["申","子","辰","酉","戌"],
    ["申","子","辰","__proto__"],["申","子","辰",null]]) {
    assert.throws(()=>collectFourPillarTriadMemberships(x,POLICY),RangeError);
  }
});

test("all result arrays, nested occurrences and source-policy records resist mutation",()=>{
  const out=collectFourPillarTriadMemberships(["申","子","辰","申"],POLICY);
  assert.equal(Object.isFrozen(out),true);
  assert.ok(Object.isFrozen(TRIAD_DEFINITIONS));
  assert.ok(Object.isFrozen(TRIAD_RULES));
  assert.throws(()=>out.push("FORGED"),TypeError);
  for(const fact of out) {
    assert.ok(Object.isFrozen(fact.sourceIds));
    assert.ok(Object.isFrozen(fact.missingBranches));
    assert.ok(fact.members.every(Object.isFrozen));
    assert.ok(fact.members.every(x=>Object.isFrozen(x.pillarIndices)));
    assert.throws(()=>{fact.status="ACTIVATED"},TypeError);
    assert.throws(()=>fact.members[0].pillarIndices.push(99),TypeError);
    for(const bad of ["weight","transformedElement","activated","auspiciousness","strength","predictiveEffect"]) {
      assert.equal(Object.hasOwn(fact,bad),false);
    }
  }
});
