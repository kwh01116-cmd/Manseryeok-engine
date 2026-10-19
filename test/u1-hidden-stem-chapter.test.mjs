import test from 'node:test';
import assert from 'node:assert/strict';
import { deriveHiddenStemChapter, projectHiddenStemChapter } from '../dist/story/hiddenStemChapter.js';
import { deriveM2ChartFacts, HIDDEN_STEM_POLICY_V1 as policyId, HIDDEN_STEM_RULE, tenGod,
  createKoreanLunisolarConverter,KASI_KOREAN_LUNISOLAR_2025_2027,resolveKoreanBirthChartPreview,
  labelKoreanGanZhi,ganZhiAt,HEAVENLY_STEMS } from '../dist/index.js';
import { KOREA_SOLAR_TERM_EVENTS_2026_2027 as events } from '../dist/calendar/koreaSolarTermFixtures.js';
const converter=createKoreanLunisolarConverter(KASI_KOREAN_LUNISOLAR_2025_2027);
const policies={timeBasis:'KOREAN_CIVIL_TIME',dayRollover:'CIVIL_MIDNIGHT',hourStemReference:'SELECTED_DAY_PILLAR'};
const manifest={schemaVersion:'m1-solar-term-coverage-v1',requirementProfile:'FULL_24_TERM_YEAR',timeBasis:'KST',sourcePrecision:'MINUTE',
  supportedFromInclusive:'2026-01-01T00:00',supportedUntilExclusive:'2028-01-01T00:00',requiredYears:[2026,2027],requiredPriorBoundary:{year:2025,term:'DAXUE'}};
const solar=date=>({calendar:'GREGORIAN',gregorianDate:date});
const lunar=day=>({calendar:'KOREAN_LUNAR',lunarDate:{lunarYear:2026,lunarMonth:12,lunarDay:day,isLeapMonth:false}});
const run=(input=solar('2027-02-05'),clock='12:00')=>resolveKoreanBirthChartPreview(input,clock,policies,converter,events,manifest);
const roles=['year','month','day','hour'];
const expected={子:'癸',丑:'己癸辛',寅:'甲丙戊',卯:'乙',辰:'戊乙癸',巳:'丙庚戊',午:'丁己',未:'己丁乙',申:'庚壬戊',酉:'辛',戌:'戊辛丁',亥:'壬甲'};

test('EP4 projects only the M2 v1 hidden-stem facts with actual member and M1 fact paths',()=>{
  const result=run(),view=deriveHiddenStemChapter(result,policyId);
  assert.equal(view.schemaVersion,'u1-hidden-stem-chapter-v1');
  assert.equal(view.sourceSchemaVersion,'m2-chart-facts-v1');
  assert.equal(view.evidenceClass,'TRADITIONAL_RULE_LOOKUP_ONLY');
  assert.equal(view.policyId,policyId);assert.deepEqual(view.sourceIds,HIDDEN_STEM_RULE.sourceIds);
  assert.deepEqual(view.policies,policies);
  const c=view.candidates[0];assert.equal(c.dayMaster,'乙');assert.equal(c.dayMasterHangul,'을');
  assert.equal(c.dayMasterFactRef,'preview.candidates[0].day.stem');
  for(const [j,b] of c.branches.entries()){
    assert.equal(b.role,roles[j]);assert.equal(b.branch,result.preview.candidates[0][b.role].branch);
    assert.equal(b.branchFactRef,`preview.candidates[0].${b.role}.branch`);
    assert.equal(b.policyId,policyId);assert.deepEqual(b.sourceIds,HIDDEN_STEM_RULE.sourceIds);
    for(const [k,m] of b.members.entries()){
      assert.equal(m.factRef,`ep4.candidates[0].branches[${j}].members[${k}]`);
      assert.equal(m.m2FactRef,`chartFacts.candidates[0].pillars[${j}].branchTenGods.members[${k}]`);
      assert.equal(m.position,k===0?'MAIN_QI':'OTHER');assert.equal(m.tenGod,tenGod(c.dayMaster,m.stem));
      assert.match(m.stemHangul,/^[가-힣]$/);assert.match(m.tenGodHangul,/^[가-힣]+$/);
    }
  }
  assert.deepEqual(Object.keys(view).sort(),['schemaVersion','sourceSchemaVersion','sourcePreviewVersion','evidenceClass','policyId','ruleIds','sourceIds','policies','confidence','candidates'].sort());
});

test('EP4 all 12 branch memberships and ten day-master calculations reuse the existing M2 rules',()=>{
  const seen=new Set();
  for(const master of HEAVENLY_STEMS){
    for(let n=0;n<12;n++){
      const result=structuredClone(run());
      // Synthetic valid glyph witnesses only; not new calendar/coverage claims.
      for(let j=0;j<4;j++)result.preview.candidates[0][roles[j]]=labelKoreanGanZhi(ganZhiAt(n+j));
      const masterPillar=Array.from({length:60},(_,i)=>ganZhiAt(i)).find(p=>p.stem===master);
      result.preview.candidates[0].day=labelKoreanGanZhi(masterPillar);
      const chapter=deriveHiddenStemChapter(result,policyId);
      for(const b of chapter.candidates[0].branches){
        seen.add(b.branch);assert.equal(b.members.map(m=>m.stem).join(''),expected[b.branch]);
        b.members.forEach(m=>assert.equal(m.tenGod,tenGod(master,m.stem)));
      }
    }
  }
  assert.equal(seen.size,12);
});

test('EP4 absent/unsupported policy never generates a chapter',()=>{
  for(const invalid of [undefined,null,'','AUTO',{},0]) assert.throws(()=>deriveHiddenStemChapter(run(),invalid),RangeError);
});

test('EP4 malformed M2 sources, policies, members, indices and ten-god facts fail closed',()=>{
  const result=run(),facts=deriveM2ChartFacts(result,policyId);
  for(const mutate of [
    f=>{f.hiddenStemSourceIds=[];},f=>{f.hiddenStemPolicyId='AUTO';},f=>{f.schemaVersion='m2-chart-facts-v2';},
    f=>{f.candidates[0].candidateIndex=1;},f=>{f.candidates[0].dayMaster='甲';},
    f=>{f.candidates[0].pillars[0].factRef='preview.candidates[1].year';},
    f=>{f.candidates[0].pillars[0].branchTenGods.sourceIds=['FORGED'];},
    f=>{f.candidates[0].pillars[0].branchTenGods.members[0].tenGod='比肩';},
    f=>{f.candidates[0].pillars[0].branchTenGods.members[0].stem='甲';},
    f=>{f.candidates[0].pillars[0].branchTenGods.members[0].position='OTHER';},
    f=>{f.candidates[0].pillars[0].branchTenGods.members=[];},
    f=>{f.solarTermSourceIds=['FAKE-CALENDAR'];},f=>{f.policies.dayRollover='AUTO';},
  ]){
    const corrupt=structuredClone(facts);mutate(corrupt);
    assert.throws(()=>projectHiddenStemChapter(result,corrupt,policyId),RangeError);
  }
});

test('EP4 Gregorian/lunar parity includes independent Lichun candidate namespaces',()=>{
  for(const [day,date,clock] of [[29,'2027-02-05','12:00'],[28,'2027-02-04','10:45'],[28,'2027-02-04','10:46'],[28,'2027-02-04','10:47']]){
    const g=run(solar(date),clock),l=run(lunar(day),clock);
    const ep4=deriveHiddenStemChapter(g,policyId);assert.deepEqual(ep4,deriveHiddenStemChapter(l,policyId));
    if(clock==='10:46'){
      assert.equal(ep4.candidates.length,2);
      assert.deepEqual(ep4.candidates.map(c=>c.branches[1].branch),['丑','寅']);
      for(const [i,c] of ep4.candidates.entries()){
        assert.equal(c.candidateIndex,i);assert.equal(c.dayMaster,g.preview.candidates[i].day.stem);
        c.branches.forEach((b,j)=>b.members.forEach((m,k)=>assert.equal(m.factRef,`ep4.candidates[${i}].branches[${j}].members[${k}]`)));
      }
      const f=structuredClone(deriveM2ChartFacts(g,policyId));[f.candidates[0],f.candidates[1]]=[f.candidates[1],f.candidates[0]];
      assert.throws(()=>projectHiddenStemChapter(g,f,policyId),RangeError);
    }
  }
});

test('EP4 candidate day masters are independent even in synthetic distinct-day witnesses',()=>{
  const result=structuredClone(run(solar('2027-02-04'),'10:46'));
  result.preview.candidates[1].day=labelKoreanGanZhi(ganZhiAt(2));
  const view=deriveHiddenStemChapter(result,policyId);
  assert.deepEqual(view.candidates.map(c=>c.dayMaster),['甲','丙']);
  for(const c of view.candidates)for(const b of c.branches)for(const m of b.members)assert.equal(m.tenGod,tenGod(c.dayMaster,m.stem));
});

test('EP4 rejected M1 results cannot invent data and projected trees are immutable copies',()=>{
  assert.throws(()=>deriveHiddenStemChapter(run(solar('2028-01-01')),policyId),RangeError);
  const input=run(),view=deriveHiddenStemChapter(input,policyId),snapshot=structuredClone(view);
  const walk=x=>{if(x&&typeof x==='object'){assert.ok(Object.isFrozen(x));Object.values(x).forEach(walk);}};
  walk(view);input.preview.candidates[0].day.stem='甲';assert.deepEqual(view,snapshot);
});
