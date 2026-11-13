// Independent literal structural contracts, not birth feasibility or predictive tests.
import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {deriveM3Evidence,M3_EVIDENCE_PROFILE_ID} from '../dist/m3/structuralEvidenceV1.js';
import {
 M4_PATTERN_PROFILE_ID,M4_PATTERN_METADATA,deriveM4ZhengguanStructure,
 validateM4ZhengguanStructure,explainM4ZhengguanStructure,
 validateM4ZhengguanExplanation,renderM4ZhengguanText,
} from '../dist/m4/zhengguanStructureV1.js';
import {structuralM2Unit} from './fixtures/m3-structural-unit-input.mjs';
import {
 M4_ZHENGGUAN_CASE_BASIS,M4_ZHENGGUAN_CASES,M4_ZHENGGUAN_PARTIAL_TEXT_CONTRACTS,
 M4_ZHENGGUAN_BOUNDARY_CONTRACTS,M4_ZHENGGUAN_REJECTION_CONTRACTS,
} from './fixtures/m4-zhengguan-structure-cases.mjs';

const frozenFixtureSha='9ec3f770cfc28689273e109c9ff8d911637df1a521ffc08a6ef00935ed9cdd01';
const byId=id=>{const c=M4_ZHENGGUAN_CASES.find(c=>c.id===id);assert.ok(c,id);return c;};
const context=(pillars,monthTerms)=>{const m2Facts=structuralM2Unit(pillars,{monthTerms});return {m2Facts,evidence:deriveM3Evidence(m2Facts,{policyId:M3_EVIDENCE_PROFILE_ID})};};
const stateFor=c=>context([c.pillars],[c.monthTerm]);
const run=(state,overrides={})=>deriveM4ZhengguanStructure(state.evidence,{profileId:M4_PATTERN_PROFILE_ID,m2Facts:state.m2Facts,...overrides});
const first=value=>value.candidates[0];
const visibleShape=location=>({role:location.pillarRole,stem:location.stem,tenGod:location.tenGod});
const exposureShape=link=>({role:link.visible.pillarRole,stem:link.visible.stem});
const unchanged=state=>JSON.stringify({m2:state.m2Facts,m3:state.evidence});
const pairKinds=(candidate,left,right)=>candidate.relations.pairs.filter(p=>p.leftPillarRole===left&&p.rightPillarRole===right).map(p=>p.kind);

function literalCaseAssertions(c,value){
 const p=first(value),x=c.expected,main=p.monthContext.principalHiddenMember;
 assert.equal(p.candidateAssessment.status,x.candidateStatus,c.id);
 assert.equal(p.candidateAssessment.basis,x.candidateBasis,c.id);
 assert.equal(p.monthContext.monthPillar.branch,x.monthBranch,c.id);
 assert.equal(main.stem,x.mainStem,c.id);assert.equal(main.tenGod,x.mainTenGod,c.id);
 assert.deepEqual(p.monthBasis.officerMembers.map(h=>({stem:h.stem,position:h.position})),x.monthOfficers,c.id);
 assert.deepEqual(p.monthBasis.exactExposures.map(exposureShape),x.officerExposure,c.id);
 assert.equal(p.competition.status==='COMPETING_CONDITIONS_PRESENT',x.competitionPresent,c.id);
 assert.deepEqual(p.competition.exposures.map(exposureShape),x.competingExposure,c.id);
 if(x.reasonCode)assert.ok(p.candidateAssessment.reasonCodes.includes(x.reasonCode),c.id);
 const groups={visibleWealth:p.groups.wealth.visible,visibleResource:p.groups.resource.visible,visibleHurtingOfficer:p.groups.hurtingOfficer.visible,visibleSevenKillings:p.groups.sevenKillings.visible,visibleOfficer:p.officerPresence.visible};
 for(const [key,expected]of Object.entries(x.groups??{}))assert.deepEqual(groups[key].map(visibleShape),expected,c.id+' '+key);
 for(const h of x.hiddenOfficerIncludes??[])assert.ok(p.officerPresence.hidden.some(a=>a.pillarRole===h.role&&a.stem===h.stem&&stateBranch(p,a.pillarRole)===h.branch),c.id);
 if(x.visibleOfficerAbsent)assert.equal(p.officerPresence.visible.length,0,c.id);
 if(x.allOfficerAbsent)assert.equal(p.officerPresence.visible.length+p.officerPresence.hidden.length,0,c.id);
 for(const r of x.relationsInclude??[])for(const kind of r.kinds)assert.ok(pairKinds(p,r.leftRole,r.rightRole).includes(kind),c.id+' '+kind);
 for(const e of x.exactDayMemberMatches??[])assert.ok(p.monthBasis.memberExposures.some(a=>a.visible.pillarRole===e.role&&a.visible.stem===e.stem),c.id);
 for(const expected of x.officerCombinationPairs??[])assert.ok(p.surfaceCombinations.some(a=>a.left.pillarRole===expected.leftRole&&a.left.stem===expected.leftStem&&a.right.pillarRole===expected.rightRole&&a.right.stem===expected.rightStem&&a.includesOfficer&&a.adjacent===expected.adjacent),c.id);
 for(const expected of x.wealthResourcePairsInclude??[])assert.ok(p.structuralLinks.some(a=>a.from.locationKind==='VISIBLE_STEM'&&a.to.locationKind==='VISIBLE_STEM'&&a.from.pillarRole===expected.wealthRole&&a.from.stem===expected.wealthStem&&a.to.pillarRole===expected.resourceRole&&a.to.stem===expected.resourceStem&&a.positionRelation.adjacent===expected.adjacent),c.id);
 assert.equal(p.effects.geCheng,'NOT_IMPLEMENTED');assert.equal(p.effects.geBai,'NOT_IMPLEMENTED');assert.equal(p.effects.jiuYing,'NOT_IMPLEMENTED');
 return p;
}
function stateBranch(candidate,role){return candidate.pillars.find(p=>p.role===role).branch;}

test('twenty-nine pre-resolver literal cases keep candidate, competition and effect results separate',()=>{
 assert.equal(createHash('sha256').update(readFileSync(new URL('./fixtures/m4-zhengguan-structure-cases.mjs',import.meta.url),'utf8').replace(/\r\n/g,'\n')).digest('hex'),frozenFixtureSha);
 assert.equal(M4_ZHENGGUAN_CASES.length,29);assert.equal(M4_ZHENGGUAN_CASES.filter(c=>c.kind.startsWith('LITERATURE')).length,5);
 assert.equal(M4_ZHENGGUAN_PARTIAL_TEXT_CONTRACTS.length,2);assert.equal(M4_ZHENGGUAN_BOUNDARY_CONTRACTS.length,3);assert.equal(M4_ZHENGGUAN_REJECTION_CONTRACTS.length,8);
 assert.match(M4_ZHENGGUAN_CASE_BASIS.expectationMethod,/BEFORE_RESOLVER/);
 const counts={};
 for(const c of M4_ZHENGGUAN_CASES){
  assert.ok(c.sourceRef.length&&c.policyRef&&c.reason&&c.mustNotInfer.length,c.id);
  const state=stateFor(c),before=unchanged(state),value=run(state),p=literalCaseAssertions(c,value);
  assert.equal(validateM4ZhengguanStructure(value,{evidence:state.evidence,m2Facts:state.m2Facts}),true);
  assert.equal(unchanged(state),before,c.id+' original M2/M3 preserved');
  counts[p.candidateAssessment.status]=(counts[p.candidateAssessment.status]??0)+1;
 }
 assert.deepEqual(counts,{STRUCTURAL_CANDIDATE:22,NOT_A_CANDIDATE_UNDER_POLICY:5,SOURCE_OR_POLICY_UNRESOLVED:2});
});

test('ten day stems by twelve months follow independent officer-character and main/other literal maps',()=>{
 // Hand-crosschecked against the named M2 member table. These are NOT generated
 // from tenGod(), hiddenStemsForBranch() or the M4 resolver under test.
 const expected={
  甲:{officer:'辛',main:['酉'],other:['丑','戌']},乙:{officer:'庚',main:['申'],other:['巳']},
  丙:{officer:'癸',main:['子'],other:['丑','辰']},丁:{officer:'壬',main:['亥'],other:['申']},
  戊:{officer:'乙',main:['卯'],other:['辰','未']},己:{officer:'甲',main:['寅'],other:['亥']},
  庚:{officer:'丁',main:['午'],other:['未','戌']},辛:{officer:'丙',main:['巳'],other:['寅']},
  壬:{officer:'己',main:['丑','未'],other:['午']},癸:{officer:'戊',main:['辰','戌'],other:['寅','巳','申']},
 };
 const months=[['寅','LICHUN'],['卯','JINGZHE'],['辰','QINGMING'],['巳','LIXIA'],['午','MANGZHONG'],['未','XIAOSHU'],['申','LIQIU'],['酉','BAILU'],['戌','HANLU'],['亥','LIDONG'],['子','DAXUE'],['丑','XIAOHAN']];
 const yangStems=new Set(['甲','丙','戊','庚','壬']),yangBranches=new Set(['子','寅','辰','午','申','戌']);
 const counts={main:0,other:0,compatibility:0,absent:0};
 for(const [master,row]of Object.entries(expected))for(const [branch,term]of months){
  const pillars=[row.officer+(yangStems.has(row.officer)?'寅':'卯'),(yangBranches.has(branch)?'甲':'乙')+branch,master+(yangStems.has(master)?'子':'丑'),'丙午'];
  const value=run(context([pillars],[term])),p=first(value);
  if(row.main.includes(branch)){assert.equal(p.candidateAssessment.status,'STRUCTURAL_CANDIDATE');assert.equal(p.candidateAssessment.basis,'MAIN_QI_ZHENGGUAN');counts.main++;}
  else if(master==='壬'&&branch==='午'){assert.equal(p.candidateAssessment.status,'SOURCE_OR_POLICY_UNRESOLVED');assert.equal(p.candidateAssessment.basis,'OTHER_MONTH_MEMBER_COMPATIBILITY_REVIEW');counts.compatibility++;}
  else if(row.other.includes(branch)){assert.equal(p.candidateAssessment.status,'STRUCTURAL_CANDIDATE');assert.equal(p.candidateAssessment.basis,'OTHER_ZHENGGUAN_EXACTLY_EXPOSED');counts.other++;}
  else{assert.equal(p.candidateAssessment.status,'NOT_A_CANDIDATE_UNDER_POLICY');assert.equal(p.candidateAssessment.basis,'NO_MONTH_ZHENGGUAN');counts.absent++;}
  if(row.main.includes(branch)||row.other.includes(branch))assert.ok(p.monthBasis.exactExposures.some(link=>link.visible.pillarRole==='year'&&link.visible.stem===row.officer));
 }
 assert.deepEqual(counts,{main:12,other:15,compatibility:1,absent:92});
});

test('moving the officer-containing branch into month changes candidacy without changing visible officer existence',()=>{
 const a=run(stateFor(byId('visible-officer-outside-month-no-candidate'))),b=run(stateFor(byId('moving-officer-branch-to-month-selects-candidate')));
 assert.equal(first(a).candidateAssessment.status,'NOT_A_CANDIDATE_UNDER_POLICY');assert.equal(first(b).candidateAssessment.status,'STRUCTURAL_CANDIDATE');
 assert.deepEqual(first(a).officerPresence.visible.map(visibleShape),first(b).officerPresence.visible.map(visibleShape));
 assert.notDeepEqual(first(a).monthBasis.officerMembers,first(b).monthBasis.officerMembers);
});

test('OTHER exposure requires the exact character and preserves repeated positions and competing members',()=>{
 const unexposed=first(run(stateFor(byId('other-officer-not-exposed-not-selected')))),wrong=first(run(stateFor(byId('other-officer-same-element-wrong-stem-not-exposure')))),selected=first(run(stateFor(byId('other-officer-exact-year-exposure-selected'))));
 assert.equal(unexposed.candidateAssessment.status,'NOT_A_CANDIDATE_UNDER_POLICY');assert.equal(wrong.candidateAssessment.status,'NOT_A_CANDIDATE_UNDER_POLICY');assert.equal(selected.candidateAssessment.status,'STRUCTURAL_CANDIDATE');
 assert.equal(unexposed.monthBasis.officerMembers[0].stem,'辛');assert.equal(wrong.groups.sevenKillings.visible[0].stem,'庚');assert.equal(wrong.monthBasis.exactExposures.length,0);
 const repeated=first(run(stateFor(byId('other-officer-multiple-exact-exposure-positions'))));assert.deepEqual(repeated.monthBasis.exactExposures.map(exposureShape),[{role:'year',stem:'辛'},{role:'hour',stem:'辛'}]);assert.notEqual(repeated.monthBasis.exactExposures[0].id,repeated.monthBasis.exactExposures[1].id);
 for(const id of ['other-officer-resource-month-member-competition','other-officer-main-wealth-competition']){const p=first(run(stateFor(byId(id))));assert.equal(p.candidateAssessment.status,'STRUCTURAL_CANDIDATE');assert.equal(p.competition.status,'COMPETING_CONDITIONS_PRESENT');assert.ok(p.competition.exposures.length);}
});

test('day-master exact matches are retained without inventing another competing pattern',()=>{
 const a=first(run(stateFor(byId('day-master-only-month-member-is-not-competition')))),b=first(run(stateFor(byId('non-day-repeated-month-member-is-competition'))));
 assert.equal(a.candidateAssessment.status,'STRUCTURAL_CANDIDATE');assert.equal(a.competition.exposures.length,0);assert.equal(a.monthBasis.dayMasterOnlyMatches.length,1);
 assert.equal(b.competition.status,'COMPETING_CONDITIONS_PRESENT');assert.deepEqual(b.competition.exposures.map(exposureShape),[{role:'year',stem:'癸'}]);
});

test('wealth/resource position links and officer injury/killing/combination structures never assert final effects',()=>{
 for(const id of ['wealth-resource-adjacent-year-month','wealth-resource-separated-year-hour-and-adjacent-month','visible-hurting-officer-with-month-officer','main-officer-and-visible-seven-killings','visible-officer-in-five-combination']){
  const c=byId(id),p=literalCaseAssertions(c,run(stateFor(c)));assert.equal(p.candidateAssessment.status,'STRUCTURAL_CANDIDATE');
  assert.ok(p.conditions.some(condition=>condition.status==='OBSERVED'));assert.equal(p.effects.geCheng,'NOT_IMPLEMENTED');assert.equal(p.effects.geBai,'NOT_IMPLEMENTED');assert.equal(p.effects.jiuYing,'NOT_IMPLEMENTED');
  const expectedRelation={WEALTH_GENERATES_OFFICER:'DAY_MASTER_GENERATES',OFFICER_GENERATES_RESOURCE:'DAY_MASTER_GENERATES',RESOURCE_GENERATES_DAY_MASTER:'DAY_MASTER_GENERATES',HURTING_OFFICER_CONTROLS_OFFICER:'DAY_MASTER_CONTROLS',WEALTH_RESOURCE_POSITION:'DAY_MASTER_CONTROLS'};
  for(const link of p.structuralLinks)assert.equal(link.relation,expectedRelation[link.kind],link.kind+' direction');
 }
});

test('overlapping branch relations and repeated hidden officer occurrences are all retained',()=>{
 const c=byId('overlapping-si-shen-and-yin-hai-relations'),p=literalCaseAssertions(c,run(stateFor(c)));
 assert.deepEqual(pairKinds(p,'month','day'),['LIUHE','LIUPO','XING']);assert.deepEqual(pairKinds(p,'year','hour'),['LIUHE','LIUPO']);
 const r=first(run(stateFor(byId('repeated-you-officer-members-keep-position'))));
 assert.deepEqual(r.officerPresence.hidden.map(v=>v.pillarRole),['year','month','hour']);assert.equal(new Set(r.officerPresence.hidden.map(v=>v.locationId)).size,3);
 assert.equal(r.relations.pairs.filter(v=>v.kind==='XING').length,3);
});

test('the original two Lichun parents remain correlated and unresolved M3 strength does not block M4 structure',()=>{
 const boundary=M4_ZHENGGUAN_BOUNDARY_CONTRACTS[0],state=context(boundary.expectedParents.map(v=>v.pillars),['XIAOHAN','LICHUN']),before=unchanged(state),value=run(state);
 assert.equal(value.candidates.length,2);assert.equal(state.evidence.finalStrength.status,'NOT_IMPLEMENTED');
 for(let i=0;i<2;i++){const p=value.candidates[i],x=boundary.expectedParents[i];assert.equal(p.candidateRef,'chart.candidates['+i+']');assert.equal(p.candidateAssessment.status,x.candidateStatus);assert.equal(p.candidateAssessment.basis,x.candidateBasis);for(const h of p.monthBasis.officerMembers)assert.equal(h.candidateRef,p.candidateRef);}
 assert.equal(unchanged(state),before);assert.equal(first(value).monthBasis.officerMembers.length,0);assert.equal(value.candidates[1].monthBasis.officerMembers[0].stem,'甲');
});

test('the pre18 boundary remains one natal M4 analysis and does not require a seasonal or M7 policy',()=>{
 const b=M4_ZHENGGUAN_BOUNDARY_CONTRACTS[1],state=context([b.expected.pillars],['QINGMING']),value=run(state),p=first(value);
 assert.equal(value.candidates.length,1);assert.equal(p.candidateAssessment.status,b.expected.candidateStatus);assert.equal(p.candidateAssessment.basis,b.expected.candidateBasis);
 assert.equal(p.officerPresence.visible[0].stem,'丙');assert.equal(p.monthBasis.officerMembers.length,0);
 assert.equal(validateM4ZhengguanStructure(value,{evidence:state.evidence,m2Facts:state.m2Facts}),true);
});

test('every literal report validates and references the same parent, facts, policies, rules and sources',()=>{
 const selectedKinds={
  KO_M4_MONTH_CANDIDATE:[],KO_M4_EXPOSURE_COMPETITION:['MONTH_MEMBER_SELECTION_COMPETITION'],
  KO_M4_WEALTH_RESOURCE_STRUCTURE:['WEALTH_GENERATES_OFFICER','OFFICER_RESOURCE_DAY_MASTER_CHAIN'],
  KO_M4_HURTING_OFFICER_KILLINGS:['HURTING_OFFICER_CONTROLS_OFFICER','OFFICER_SEVEN_KILLINGS_COEXISTENCE'],
  KO_M4_INTERACTION_POSITIONS:['OFFICER_FIVE_COMBINATION','WEALTH_RESOURCE_POSITION_REVIEW','NATAL_BRANCH_RELATION_REVIEW'],
 };
 for(const c of M4_ZHENGGUAN_CASES){
  const state=stateFor(c),value=run(state),report=explainM4ZhengguanStructure(value);
  assert.equal(validateM4ZhengguanExplanation(report,value),true);
  const text=renderM4ZhengguanText(report);assert.ok(text.length>100);assert.match(text,/정관/);assert.match(text,/효력|성격|성패/);
  assert.equal(report.candidates.length,value.candidates.length);
  for(let i=0;i<report.candidates.length;i++)for(const item of report.candidates[i].items){
   assert.ok(item.id&&item.templateId&&item.templateVersion&&item.text);assert.ok(item.assessmentRefs.length||item.conditionRefs.length);
   assert.ok(item.inputFactRefs.every(ref=>state.m2Facts.candidates[i].facts.some(f=>f.id===ref)),c.id);
   assert.ok(item.ruleRefs.every(ref=>value.rules.some(r=>r.id===ref)),c.id);assert.ok(item.sourceRefs.every(ref=>value.sources.some(s=>s.id===ref)),c.id);
   assert.ok(item.calculationSourceRefs.every(ref=>state.evidence.candidates[i].evidence.some(e=>e.calculationSourceRefs.includes(ref))),c.id);
   const parent=value.candidates[i],conditions=item.conditionRefs.map(ref=>{const found=parent.conditions.find(v=>v.id===ref);assert.ok(found,c.id);return found;});
   if(Object.hasOwn(selectedKinds,item.templateId))assert.deepEqual(conditions.map(c=>c.kind).sort(),[...selectedKinds[item.templateId]].sort(),c.id+' template condition scope');
   const usesAssessment=['KO_M4_MONTH_CANDIDATE','KO_M4_EXPOSURE_COMPETITION','KO_M4_EFFECT_SCOPE'].includes(item.templateId);
   assert.deepEqual(item.assessmentRefs,usesAssessment?[parent.candidateAssessment.id]:[],c.id+' template assessment scope');
   const selected=[...(usesAssessment?[parent.candidateAssessment]:[]),...conditions];
   for(const key of ['inputFactRefs','ruleRefs','policyRefs','sourceRefs','calculationSourceRefs'])assert.deepEqual(new Set(item[key]),new Set(selected.flatMap(v=>v[key])),c.id+' scoped '+key);
  }
 }
 // Hand-designed structural counterexamples: no missing group may be narrated as
 // an actually observed link. These are not certified calendrical birthdays.
 const counterexamples=[
  {id:'wealth-only-no-resource',pillars:['辛酉','乙酉','甲午','丁酉'],term:'BAILU',wealth:true,resource:false},
  {id:'resource-only-no-wealth',pillars:['甲寅','甲子','丙寅','乙卯'],term:'DAXUE',wealth:false,resource:true},
  {id:'neither-wealth-nor-resource',pillars:['丙子','戊子','丙子','壬子'],term:'DAXUE',wealth:false,resource:false},
 ];
 for(const c of counterexamples){
  const state=context([c.pillars],[c.term]),value=run(state),parent=first(value),report=explainM4ZhengguanStructure(value),item=report.candidates[0].items.find(i=>i.templateId==='KO_M4_WEALTH_RESOURCE_STRUCTURE');
  assert.equal(parent.candidateAssessment.status,'STRUCTURAL_CANDIDATE',c.id);
  assert.equal(parent.groups.wealth.visible.length+parent.groups.wealth.hidden.length>0,c.wealth,c.id);assert.equal(parent.groups.resource.visible.length+parent.groups.resource.hidden.length>0,c.resource,c.id);
  const w=parent.conditions.find(c=>c.kind==='WEALTH_GENERATES_OFFICER'),r=parent.conditions.find(c=>c.kind==='OFFICER_RESOURCE_DAY_MASTER_CHAIN');
  assert.equal(w.status,c.wealth?'OBSERVED':'NOT_OBSERVED',c.id);assert.equal(r.status,c.resource?'OBSERVED':'NOT_OBSERVED',c.id);
  assert.ok(item.text.includes(c.wealth?'재→관의 오행 생조 방향이 실제 위치에서 관측됩니다.':'재→관 연결은 관측되지 않았습니다.'),c.id);
  assert.ok(item.text.includes(c.resource?'관→인→일간의 오행 생조 방향이 실제 위치에서 관측됩니다.':'관→인→일간 연결은 관측되지 않았습니다.'),c.id);
  if(!c.wealth)assert.ok(!item.text.includes('재→관의 오행 생조 방향이 실제 위치에서 관측됩니다.'),c.id);
  if(!c.resource)assert.ok(!item.text.includes('관→인→일간의 오행 생조 방향이 실제 위치에서 관측됩니다.'),c.id);
  assert.equal(parent.formationAssessment.status,c.wealth||c.resource?'FORMATION_CONDITIONS_OBSERVED':'BASE_STRUCTURE_ONLY',c.id);
  for(const [condition,relation,present]of [[w,'DAY_MASTER_CONTROLS',c.wealth],[r,'TARGET_GENERATES_DAY_MASTER',c.resource]]){
   const direction=state.evidence.candidates[0].evidence.find(e=>e.kind==='DIRECTIONAL_GROUP'&&e.value.relation===relation);assert.ok(direction,c.id);
   assert.ok(condition.inputEvidenceRefs.includes(direction.id),c.id+' full observation scope');
   if(!present)for(const fact of state.m2Facts.candidates[0].facts.filter(f=>f.kind==='HIDDEN_STEMS'))assert.ok(condition.inputFactRefs.includes(fact.id),c.id+' absence scans all hidden pillars');
  }
 }
});

test('missing policy, wrong context, malformed references and sparse inputs reject rather than becoming officer absence',()=>{
 const c=byId('main-officer-hidden-without-visible-officer'),a=stateFor(c),b=stateFor(c);
 for(const profileId of [undefined,'','AUTO','UNKNOWN',M3_EVIDENCE_PROFILE_ID])assert.throws(()=>run(a,{profileId}));
 for(const m2Facts of [undefined,structuredClone(a.m2Facts),b.m2Facts])assert.throws(()=>run(a,{m2Facts}));
 assert.throws(()=>deriveM4ZhengguanStructure(structuredClone(a.evidence),{profileId:M4_PATTERN_PROFILE_ID,m2Facts:a.m2Facts}));
 const mutations=[
  m=>{m.candidates[0].facts=m.candidates[0].facts.filter(f=>!(f.kind==='HIDDEN_STEMS'&&f.value.role==='month'));},
  m=>{delete m.candidates[0].facts.find(f=>f.kind==='HIDDEN_STEMS'&&f.value.role==='month').value.members[0];},
  m=>{m.candidates[0].facts.find(f=>f.kind==='HIDDEN_STEMS'&&f.value.role==='month').sourceRefs=['MISSING_SOURCE'];},
  m=>{m.candidates[0].facts.find(f=>f.kind==='HIDDEN_STEMS'&&f.value.role==='month').ruleRefs=['MISSING_RULE'];},
  m=>{m.policyBundle.policies.hiddenStems.id='INVENTED_POLICY';},
 ];
 for(const mutate of mutations){const s=stateFor(c);mutate(s.m2Facts);assert.throws(()=>run(s));}
 // These altered metadata versions are present BEFORE M3 issuance, so this
 // exercises the explicit M4 dependency check, not just post-issuance mutation.
 for(const [label,mutate]of [
  ['bundle-version',m=>{m.policyBundle.policies.hiddenStems.runtimeVersion='9.9.9';}],
  ['native-rule-version',m=>{m.rules.find(r=>r.id==='M2-RULE-HIDDEN-STEMS-001').runtimeVersion='9.9.9';}],
  ['bundle-and-native-rule-version',m=>{m.policyBundle.policies.hiddenStems.runtimeVersion='9.9.9';m.rules.find(r=>r.id==='M2-RULE-HIDDEN-STEMS-001').runtimeVersion='9.9.9';}],
 ]){const m2Facts=structuralM2Unit([c.pillars],{monthTerms:[c.monthTerm]});mutate(m2Facts);const evidence=deriveM3Evidence(m2Facts,{policyId:M3_EVIDENCE_PROFILE_ID});assert.throws(()=>deriveM4ZhengguanStructure(evidence,{profileId:M4_PATTERN_PROFILE_ID,m2Facts}),label);}
});

test('post-issuance M2 changes are detected and cannot mutate already-issued results or another request',()=>{
 const c=byId('main-officer-exact-year-exposure'),s=stateFor(c),value=run(s),before=JSON.stringify(value),fresh=run(stateFor(c));
 s.m2Facts.candidates[0].facts.find(f=>f.kind==='HIDDEN_STEMS'&&f.value.role==='month').value.members[0].tenGod='七殺';
 assert.throws(()=>validateM4ZhengguanStructure(value));assert.equal(JSON.stringify(value),before);
 assert.equal(first(fresh).candidateAssessment.status,'STRUCTURAL_CANDIDATE');assert.equal(validateM4ZhengguanStructure(fresh),true);
});

test('result and report tampering cannot promote effects or cross parent, fact, rule and source references',()=>{
 const state=context([byId('main-officer-hidden-without-visible-officer').pillars,byId('other-officer-exact-year-exposure-selected').pillars],['BAILU','XIAOHAN']),value=run(state),report=explainM4ZhengguanStructure(value);
 for(const mutate of [v=>{v.candidates[0].effects.geCheng='CONFIRMED';},v=>{v.candidates[0].candidateAssessment.status='GE_CHENG';},v=>{v.candidates[0].monthBasis.officerMembers=v.candidates[1].monthBasis.officerMembers;},v=>{delete v.candidates[0];}]){const changed=structuredClone(value);mutate(changed);assert.throws(()=>validateM4ZhengguanStructure(changed,{evidence:state.evidence,m2Facts:state.m2Facts}));}
 const reportMutations=[
  r=>{r.candidates[0].items[0].text='재성이 있으므로 성격과 좋은 운을 확정합니다.';},
  r=>{r.candidates[0].items[0].templateId='UNDEFINED_TEMPLATE';},
  r=>{r.candidates[0].items[0].inputFactRefs=[state.m2Facts.candidates[1].facts[0].id];},
  r=>{r.candidates[0].items[0].ruleRefs=['MISSING_RULE'];},r=>{r.candidates[0].items[0].sourceRefs=['MISSING_SOURCE'];},
  r=>{r.candidates[0].items[0].assessmentRefs=[value.candidates[1].candidateAssessment.id];},
  r=>{r.candidates[0].items[0].conditionRefs=[value.candidates[1].conditions[0].id];},
  r=>{r.candidates[0].items[0].calculationSourceRefs=[state.evidence.candidates[1].monthContext.activeSince.sourceIds[0]];},
  r=>{r.candidates[0].items[0].conditionRefs=['MISSING_CONDITION'];},r=>{r.candidates[0].items[0].policyRefs=['INVENTED_POLICY'];},
  r=>{delete r.candidates[0].items[0];},r=>{r.candidates[0].items.push(r.candidates[0].items[0]);},
 ];
 for(const mutate of reportMutations){const changed=structuredClone(report);mutate(changed);assert.throws(()=>validateM4ZhengguanExplanation(changed,value));}
});

test('a mismatched applied Jie and month branch rejects without calculating a new month pillar',()=>{
 const s=context([byId('main-officer-hidden-without-visible-officer').pillars],['LIQIU']);
 assert.throws(()=>run(s));
});

test('native rule gaps and release gates remain distinct from the new structural profile version',()=>{
 const s=stateFor(byId('main-officer-hidden-without-visible-officer')),value=run(s);
 const original=s.evidence.rules.filter(r=>r.runtimeVersion===null).map(r=>r.id);assert.ok(original.length>0);
 assert.deepEqual(value.rules.filter(r=>r.runtimeVersion===null).map(r=>r.id),original);
 assert.equal(s.evidence.finalStrength.status,'NOT_IMPLEMENTED');assert.equal(s.evidence.validation.g0Receipt,null);assert.equal(s.evidence.validation.g1P2Promotion,false);
 assert.equal(M4_PATTERN_METADATA.id,M4_PATTERN_PROFILE_ID);assert.equal(M4_PATTERN_METADATA.version,'0.1.0');
 const caseIds=new Set(M4_ZHENGGUAN_CASES.map(c=>c.id));
 for(const rule of M4_PATTERN_METADATA.rules){assert.ok(rule.testCaseRefs.length>0,rule.id);for(const ref of rule.testCaseRefs){assert.ok(ref.startsWith('test/fixtures/m4-zhengguan-structure-cases.mjs#'),rule.id);assert.ok(caseIds.has(ref.slice(ref.indexOf('#')+1)),rule.id);}}
 assert.equal(first(value).patternBasis.kind,'MONTH_ORDER_GEJU_CRITERION');assert.equal(first(value).patternBasis.helpfulnessAssessment,'NOT_PERFORMED');
 assert.equal(value.validation.g0Receipt,null);assert.equal(value.validation.g1P2Promotion,false);assert.equal(value.validation.m3FinalGate,'BLOCKED_UNCHANGED');assert.equal(value.validation.m4FinalEffectGate,'BLOCKED_UNCHANGED');
 assert.equal(validateM4ZhengguanStructure(value),true);
});
