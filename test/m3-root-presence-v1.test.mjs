// Independent finite rule cases; structural fixtures are explicitly NOT real births.
import test from 'node:test';
import assert from 'node:assert/strict';
import {HIDDEN_STEM_POLICY_V1} from '../dist/domain/hiddenStems.js';
import {deriveM3Evidence,M3_EVIDENCE_PROFILE_ID} from '../dist/m3/structuralEvidenceV1.js';
import {M3_ROOT_POLICY_ID,M3_ROOT_POLICY_METADATA,resolveStemBranchRootPresence,deriveM3RootPresence,validateM3RootPresence,explainM3RootPresence,validateM3RootPresenceExplanation} from '../dist/m3/rootPresenceV1.js';
import {structuralM2Unit} from './fixtures/m3-structural-unit-input.mjs';

const stems=[...'甲乙丙丁戊己庚辛壬癸'],branches=[...'子丑寅卯辰巳午未申酉戌亥'];
// 120 literal cells, hand compared with the accepted M2 ordered member table.
// Empty=no same-element member; '=' exact / '~' other-polarity; final digit=existing index.
// These literals are NOT generated with the resolver, its helpers or a five-element relation function.
const literal={
  甲:['','','=甲0','~乙0','~乙1','','','~乙2','','','','=甲1'],
  乙:['','','~甲0','=乙0','=乙1','','','=乙2','','','','~甲1'],
  丙:['','','=丙1','','','=丙0','~丁0','~丁1','','','~丁2',''],
  丁:['','','~丙1','','','~丙0','=丁0','=丁1','','','=丁2',''],
  戊:['','~己0','=戊2','','=戊0','=戊2','~己1','~己0','=戊2','','=戊0',''],
  己:['','=己0','~戊2','','~戊0','~戊2','=己1','=己0','~戊2','','~戊0',''],
  庚:['','~辛2','','','','=庚1','','','=庚0','~辛0','~辛1',''],
  辛:['','=辛2','','','','~庚1','','','~庚0','=辛0','=辛1',''],
  壬:['~癸0','~癸1','','','~癸2','','','','=壬1','','','=壬0'],
  癸:['=癸0','=癸1','','','=癸2','','','','~壬1','','','~壬0'],
};
const policy={policyId:M3_ROOT_POLICY_ID};
const unit=(targetStem,branch)=>resolveStemBranchRootPresence({targetStem,branch,hiddenStemPolicyId:HIDDEN_STEM_POLICY_V1},policy);
function rootFor(pillars,options){const m2Facts=structuralM2Unit(pillars,options),evidence=deriveM3Evidence(m2Facts,{policyId:M3_EVIDENCE_PROFILE_ID});return {m2Facts,evidence,root:deriveM3RootPresence(evidence,{...policy,m2Facts})};}
const target=(root,role='day',candidate=0)=>root.candidates[candidate].targets.find(t=>t.target.pillarRole===role);
const matches=t=>t.branches.flatMap(b=>b.matches);

test('all 120 independent stem/branch literals preserve presence, exact/other match and MAIN_QI/OTHER',()=>{
  let cells=0,present=0,absent=0,exact=0,different=0,main=0,other=0;
  for(const stem of stems)for(let i=0;i<branches.length;i++){
    const expected=literal[stem][i],result=unit(stem,branches[i]);cells++;
    assert.equal(result.rootPresence,expected?'PRESENT_UNDER_POLICY':'ABSENT_UNDER_POLICY',stem+'/'+branches[i]);
    if(!expected){absent++;assert.deepEqual(result.matches,[]);continue;}
    present++;const [match]=result.matches;assert.equal(result.matches.length,1);assert.equal(match.stem,expected[1]);assert.equal(match.index,Number(expected[2]));
    assert.equal(match.matchType,expected[0]==='='?'EXACT_STEM':'SAME_ELEMENT_DIFFERENT_STEM');
    assert.equal(match.position,expected[2]==='0'?'MAIN_QI':'OTHER');
    expected[0]==='='?exact++:different++;expected[2]==='0'?main++:other++;
  }
  assert.deepEqual({cells,present,absent,exact,different,main,other},{cells:120,present:56,absent:64,exact:28,different:28,main:24,other:32});
});

test('definition counterexamples separate generating elements and yin growth stages from actual roots',()=>{
  for(const [stem,branch]of [['甲','子'],['丁','酉'],['乙','午'],['辛','辰']])assert.equal(unit(stem,branch).rootPresence,'ABSENT_UNDER_POLICY',stem+'/'+branch);
  assert.deepEqual(unit('丙','寅').matches.map(m=>[m.stem,m.position,m.matchType]),[['丙','OTHER','EXACT_STEM']]);
  for(let i=0;i<stems.length;i+=2)for(const branch of branches)assert.equal(unit(stems[i],branch).rootPresence,unit(stems[i+1],branch).rootPresence);
  for(const input of [{targetStem:'A',branch:'寅',hiddenStemPolicyId:HIDDEN_STEM_POLICY_V1},{targetStem:'甲',branch:'X',hiddenStemPolicyId:HIDDEN_STEM_POLICY_V1},{targetStem:'甲',branch:'寅',hiddenStemPolicyId:'AUTO'}])assert.throws(()=>resolveStemBranchRootPresence(input,policy));
  for(const id of [undefined,'','AUTO','ALL_SCHOOLS'])assert.throws(()=>resolveStemBranchRootPresence({targetStem:'甲',branch:'寅',hiddenStemPolicyId:HIDDEN_STEM_POLICY_V1},{policyId:id}));
});

test('four visible target positions and all four branches retain distinct repeated stems and day-branch members',()=>{
  const {root}=rootFor([['丙午','癸巳','丙午','甲午']]),candidate=root.candidates[0];
  assert.equal(candidate.targets.length,4);assert.equal(candidate.targets.flatMap(t=>t.branches).length,16);assert.equal(new Set(candidate.targets.map(t=>t.id)).size,4);
  const day=target(root),year=target(root,'year');assert.equal(day.chartRootPresence,'PRESENT_UNDER_POLICY');
  assert.deepEqual(day.branches.map(b=>[b.pillarRole,b.branch,b.rootPresence]),[['year','午','PRESENT_UNDER_POLICY'],['month','巳','PRESENT_UNDER_POLICY'],['day','午','PRESENT_UNDER_POLICY'],['hour','午','PRESENT_UNDER_POLICY']]);
  assert.deepEqual(matches(day).map(m=>[m.hidden.pillarRole,m.hidden.stem,m.matchType]),[['year','丁','SAME_ELEMENT_DIFFERENT_STEM'],['month','丙','EXACT_STEM'],['day','丁','SAME_ELEMENT_DIFFERENT_STEM'],['hour','丁','SAME_ELEMENT_DIFFERENT_STEM']]);
  assert.notEqual(day.id,year.id);assert.deepEqual(matches(day).map(m=>m.hidden.locationId),matches(year).map(m=>m.hidden.locationId));
  assert.notDeepEqual(matches(day).map(m=>m.id),matches(year).map(m=>m.id));assert.equal(matches(day).find(m=>m.hidden.pillarRole==='day').samePillar,true);
  assert.equal(target(root,'month').target.tenGod,'正官');assert.equal(target(root,'month').chartRootPresence,'ABSENT_UNDER_POLICY');
  assert.equal(target(root,'hour').chartRootPresence,'ABSENT_UNDER_POLICY');
});

test('surface resource/peer existence and their own roots remain separate from the day-master roots',()=>{
  const simple=rootFor([['丙午','癸巳','丙午','甲午']]).root;
  assert.deepEqual(simple.candidates[0].supportStems.map(s=>[s.location.pillarRole,s.tenGod,s.supportKind,s.chartRootPresence]),[['year','比肩','PEER','PRESENT_UNDER_POLICY'],['hour','偏印','RESOURCE','ABSENT_UNDER_POLICY']]);
  assert.ok(!simple.candidates[0].supportStems.some(s=>s.location.pillarRole==='day'));
  const noDay=rootFor([['甲子','乙卯','丙子','壬子']]).root;
  assert.equal(target(noDay).chartRootPresence,'ABSENT_UNDER_POLICY');
  assert.ok(noDay.candidates[0].supportStems.filter(s=>s.supportKind==='RESOURCE').every(s=>s.chartRootPresence==='PRESENT_UNDER_POLICY'));
  assert.equal(matches(target(noDay)).length,0,'resource roots must never become fire roots');
  const both=rootFor([['甲寅','丙午','丙午','甲寅']]).root;
  assert.equal(target(both).chartRootPresence,'PRESENT_UNDER_POLICY');assert.ok(both.candidates[0].supportStems.every(s=>s.chartRootPresence==='PRESENT_UNDER_POLICY'));
});

test('related pairs and triads attach to actual branches without deleting or changing roots',()=>{
  const {root,evidence}=rootFor([['乙巳','庚申','甲寅','乙亥']]);
  const t=target(root,'month'),shen=t.branches.find(b=>b.pillarRole==='month');
  assert.equal(shen.rootPresence,'PRESENT_UNDER_POLICY');assert.ok(shen.relationEvidenceRefs.length>=3);
  assert.deepEqual(shen.matches.map(m=>[m.hidden.stem,m.matchType,m.relationEffect]),[['庚','EXACT_STEM','NOT_EVALUATED']]);
  for(const ref of shen.relationEvidenceRefs){const e=evidence.candidates[0].evidence.find(e=>e.id===ref);assert.ok(e.pillarRefs.includes('chart.candidates[0].month'));}
  const none=rootFor([['甲子','丙子','甲子','壬子']]).root;
  assert.deepEqual(none.candidates[0].relatedRelationEvidenceRefs,[]);assert.equal(target(none).chartRootPresence,'ABSENT_UNDER_POLICY');
});

test('same input locations retain roots independent of month/season wording without a hidden strength formula',()=>{
  const a=rootFor([['甲子','丙寅','甲午','壬申']],{monthTerms:['LICHUN']}).root;
  const b=rootFor([['甲子','丙寅','甲午','壬申']],{monthTerms:['JINGZHE']}).root;
  const semantics=r=>r.candidates.map(c=>c.targets.map(t=>[t.target.stem,t.chartRootPresence,t.branches.map(b=>[b.branch,b.matches.map(m=>[m.hidden.stem,m.matchType])])]));
  assert.deepEqual(semantics(a),semantics(b));assert.equal(a.finalStrength.status,'NOT_IMPLEMENTED');
  for(const t of a.candidates[0].targets){assert.equal(t.rootEfficacy,'NOT_EVALUATED');assert.equal(t.rootStrength,'NOT_EVALUATED');for(const key of ['score','weight','rank','strong','deDi','deShi'])assert.equal(Object.hasOwn(t,key),false);}
});

test('issued input is required and missing data, foreign candidates, sparse members and false absence are errors',()=>{
  const state=rootFor([['丙午','癸巳','丙午','甲午'],['乙丑','丁卯','乙卯','癸酉']]);
  assert.equal(validateM3RootPresence(state.root,{evidence:state.evidence,m2Facts:state.m2Facts}),true);
  assert.throws(()=>deriveM3RootPresence(structuredClone(state.evidence),{...policy,m2Facts:state.m2Facts}));
  for(const mutate of [
    x=>{x.candidates[0].pillars.pop();},
    x=>{delete x.candidates[0].pillars[1];},
    x=>{x.candidates[0].pillars[0].branchTenGods.members=[];},
    x=>{delete x.candidates[0].pillars[0].branchTenGods.members[0];},
    x=>{x.candidates[0].pillars[0].branch='子';},
    x=>{x.candidates[0].id='chart.candidates[1]';},
    x=>{x.candidates[0].pillars[0].visibleTenGod='正印';},
    x=>{x.candidates[0].facts.find(f=>f.kind==='HIDDEN_STEMS').value.members[0].memberRef='facts.candidates[1].pillars[0].branchTenGods.members[0]';},
    x=>{x.candidates[0].facts.find(f=>f.kind==='HIDDEN_STEMS').value.members[0].tenGod='正印';},
    x=>{x.candidates[0].facts.find(f=>f.kind==='HIDDEN_STEMS').ruleRefs=['MISSING_RULE'];},
    x=>{x.candidates[0].facts.find(f=>f.kind==='HIDDEN_STEMS').sourceRefs=['MISSING_SOURCE'];},
    x=>{x.candidates[0].facts.find(f=>f.kind==='HIDDEN_STEMS').calculationSourceRefs=[];},
    x=>{x.candidates[0].facts.find(f=>f.kind==='HIDDEN_STEMS').sourceRefs.pop();},
    x=>{x.candidates[0].facts.push(structuredClone(x.candidates[0].facts[0]));},
    x=>{x.sources[0].kind='FAKE_CERTIFIED';},
    x=>{x.sources.pop();},
    x=>{x.rules.pop();},
  ]){const bad=structuredClone(state.m2Facts);mutate(bad);assert.throws(()=>deriveM3RootPresence(state.evidence,{...policy,m2Facts:bad}));}
  const other=rootFor([['丙午','癸巳','丙午','甲午'],['乙丑','丁卯','乙卯','癸酉']]);
  assert.throws(()=>validateM3RootPresence(state.root,{evidence:other.evidence}));assert.throws(()=>validateM3RootPresence(state.root,{m2Facts:other.m2Facts}));
  for(const id of [undefined,'','AUTO'])assert.throws(()=>deriveM3RootPresence(state.evidence,{policyId:id,m2Facts:state.m2Facts}));
  for(const [kind,item]of [['rules',{id:M3_ROOT_POLICY_METADATA.rules[0].id,runtimeVersion:null,sourceIds:[],policyIds:[]}],['sources',{id:M3_ROOT_POLICY_METADATA.sources[0].id,kind:'SPOOFED_UPSTREAM_ROOT_SOURCE'}]]){
    const m2Facts=structuralM2Unit();m2Facts[kind].push(item);const evidence=deriveM3Evidence(m2Facts,{policyId:M3_EVIDENCE_PROFILE_ID});
    assert.throws(()=>deriveM3RootPresence(evidence,{...policy,m2Facts}),/ROOT_UPSTREAM_REGISTRY_COLLISION/);
  }
});

test('every exact target/member connection is unique and references stay inside its candidate',()=>{
  const {root,evidence}=rootFor([['甲寅','丙午','甲辰','壬申'],['乙丑','丁卯','乙卯','癸酉']]);
  for(const candidate of root.candidates){
    const native=evidence.candidates[candidate.candidateIndex],known=new Set(native.evidence.map(e=>e.id)),links=candidate.targets.flatMap(matches);
    assert.equal(new Set(links.map(m=>m.id)).size,links.length);
    for(const t of candidate.targets)for(const b of t.branches)for(const m of b.matches){
      assert.equal(m.hidden.candidateRef,candidate.candidateRef);assert.ok(m.targetLocationRef.startsWith(candidate.candidateRef+'.'));
      assert.equal(m.isMonthBranch,b.pillarRole==='month');assert.ok(m.inputEvidenceRefs.every(ref=>known.has(ref)));
      assert.ok(m.inputMemberRefs.includes(m.hidden.inputMemberRef));assert.ok(m.inputFactRefs.includes(m.hidden.inputFactRef));
      assert.ok(m.ruleRefs.every(ref=>root.rules.some(r=>r.id===ref)));assert.ok(m.sourceRefs.every(ref=>root.sources.some(s=>s.id===ref)));
    }
  }
});

test('deterministic Korean explanations name actual roots and preserve unsupported efficacy and absence meaning',()=>{
  const {root}=rootFor([['丙午','癸巳','丙午','甲午']]),view=explainM3RootPresence(root);
  assert.equal(validateM3RootPresenceExplanation(view,root),true);assert.deepEqual(explainM3RootPresence(root),view);
  const items=view.candidates[0].items;assert.match(items.find(i=>i.id.includes('target-day')).text,/월지 巳의 丙\(정확한 천간 일치/);
  // Reviewed Korean snapshot for an explicitly fictional four-pillar unit.
  assert.deepEqual(items.slice(0,6).map(item=>item.text),[
    '선택한 장간 동오행 정책에서 연주 천간 丙의 통근이 다음 위치에서 성립합니다: 연지 午의 丁(음양이 다른 동오행, 본기) · 월지 巳의 丙(정확한 천간 일치, 본기) · 일지 午의 丁(음양이 다른 동오행, 본기) · 시지 午의 丁(음양이 다른 동오행, 본기).',
    '선택한 장간 동오행 정책에서 월주 천간 癸의 근은 원국 네 지지의 장간에서 확인되지 않습니다.',
    '선택한 장간 동오행 정책에서 일간 丙의 통근이 다음 위치에서 성립합니다: 연지 午의 丁(음양이 다른 동오행, 본기) · 월지 巳의 丙(정확한 천간 일치, 본기) · 일지 午의 丁(음양이 다른 동오행, 본기) · 시지 午의 丁(음양이 다른 동오행, 본기).',
    '선택한 장간 동오행 정책에서 시주 천간 甲의 근은 원국 네 지지의 장간에서 확인되지 않습니다.',
    '연주 천간 丙의 일간 기준 십성은 비견이며 표면 비겁에 해당합니다. 이 천간 자신의 동오행 근이 있습니다. 일간의 직접 근과 구분하며 실제 생조 전달 정도는 평가하지 않습니다.',
    '시주 천간 甲의 일간 기준 십성은 편인이며 표면 인성에 해당합니다. 이 천간 자신의 동오행 근은 확인되지 않습니다. 일간의 직접 근과 구분하며 실제 생조 전달 정도는 평가하지 않습니다.',
  ]);
  assert.match(items.find(i=>i.id.includes('support-hour')).text,/편인.*표면 인성/);assert.match(items.find(i=>i.id.includes('support-hour')).text,/자신의 동오행 근은 확인되지 않습니다/);
  assert.match(view.scopeNote,/무근은 신약·무력·종격의 결론이 아닙니다/);
  assert.ok(!items.some(i=>i.text.includes('은(는)')));
  assert.equal(M3_ROOT_POLICY_METADATA.hiddenStemPolicyId,HIDDEN_STEM_POLICY_V1);
  assert.ok(root.rules.filter(r=>r.id.startsWith('M2-RULE-BRANCH-')||r.id.startsWith('M2-RULE-TRIAD-')).some(r=>r.runtimeVersion===null));
  assert.equal(root.validation.g1P2Promotion,false);assert.equal(root.validation.g0Receipt,null);
});

test('cross-candidate, nonexistent refs, duplicate/sparse outputs and fabricated strength wording are rejected',()=>{
  const {root}=rootFor([['丙午','癸巳','丙午','甲午'],['乙丑','丁卯','乙卯','癸酉']]),view=explainM3RootPresence(root);
  for(const mutate of [
    x=>{x.candidates[0].candidateRef='chart.candidates[1]';},
    x=>{x.candidates[0].items[0]=x.candidates[1].items[0];},
    x=>{x.candidates[0].items[0].inputEvidenceRefs=['MISSING_EVIDENCE'];},
    x=>{x.candidates[0].items[0].inputFactRefs=['MISSING_FACT'];},
    x=>{x.candidates[0].items[0].inputMemberRefs=['MISSING_MEMBER'];},
    x=>{x.candidates[0].items[0].ruleRefs=['MISSING_RULE'];},
    x=>{x.candidates[0].items[0].sourceRefs=['MISSING_SOURCE'];},
    x=>{x.candidates[0].items[0].policyRefs=['AUTO'];},
    x=>{x.candidates[0].items[0].templateId='OTHER';},
    x=>{x.candidates[0].items[0].text='통근하므로 신강하고 좋은 운입니다.';},
    x=>{x.candidates[0].items.push(x.candidates[0].items[0]);},
    x=>{delete x.candidates[0].items[0];},
    x=>{x.candidates[0].items.length++;},
  ]){const bad=structuredClone(view);mutate(bad);assert.throws(()=>validateM3RootPresenceExplanation(bad,root));}
  const copy=structuredClone(root);copy.candidates[0].targets[0].branches[0].matches.push(copy.candidates[0].targets[0].branches[0].matches[0]);assert.throws(()=>validateM3RootPresence(copy));
});

test('immutable outputs and changed input cannot contaminate independent later requests',()=>{
  const {root,evidence,m2Facts}=rootFor([['甲寅','丙午','甲辰','壬申']]),before=JSON.stringify(root);
  assert.throws(()=>{root.candidates[0].targets[0].branches[0].matches[0].hidden.stem='癸';},TypeError);
  assert.throws(()=>{root.candidates[0].targets.push(root.candidates[0].targets[0]);},TypeError);
  m2Facts.candidates[0].pillars[0].branch='子';assert.equal(JSON.stringify(root),before);
  const next=rootFor([['甲寅','丙午','甲辰','壬申']]).root;assert.deepEqual(next,root);
  assert.equal(evidence.status,'EVIDENCE_ONLY');assert.equal(evidence.candidates[0].rootCandidates.exactStem.length,1);
  assert.equal(root.rootEfficacy,'NOT_EVALUATED');assert.equal(root.rootStrength,'NOT_EVALUATED');assert.equal(root.finalStrength.status,'NOT_IMPLEMENTED');
});
