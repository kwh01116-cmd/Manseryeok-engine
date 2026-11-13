// Presentation contracts only. Synthetic pillar combinations are not certified
// birth dates; the frozen M4 candidate expectations remain in their own fixture.
import test from 'node:test';
import assert from 'node:assert/strict';
import {deriveM3Evidence,M3_EVIDENCE_PROFILE_ID} from '../dist/m3/structuralEvidenceV1.js';
import {
 M4_PATTERN_PROFILE_ID,M4_PATTERN_METADATA,M4_PATTERN_REPORT_VERSION,
 deriveM4ZhengguanStructure,explainM4ZhengguanStructure,
 validateM4ZhengguanExplanation,renderM4ZhengguanText,
} from '../dist/m4/zhengguanStructureV1.js';
import {structuralM2Unit} from './fixtures/m3-structural-unit-input.mjs';
import {M4_ZHENGGUAN_CASES} from './fixtures/m4-zhengguan-structure-cases.mjs';

const roleKo={year:'연',month:'월',day:'일',hour:'시'};
const pairKo={LIUHE:'육합',LIUCHONG:'충',LIUHAI:'해',LIUPO:'파',XING:'형'};
const elementKo={WOOD:'목',FIRE:'화',EARTH:'토',METAL:'금',WATER:'수'};
const familyKo={SANHE:'삼합',SANHUI:'삼회'};
const byId=id=>{const c=M4_ZHENGGUAN_CASES.find(c=>c.id===id);assert.ok(c,id);return c;};
function run(pillars,monthTerm){
 const m2Facts=structuralM2Unit([pillars],{monthTerms:[monthTerm]});
 const evidence=deriveM3Evidence(m2Facts,{policyId:M3_EVIDENCE_PROFILE_ID});
 const value=deriveM4ZhengguanStructure(evidence,{profileId:M4_PATTERN_PROFILE_ID,m2Facts});
 const report=explainM4ZhengguanStructure(value);
 assert.equal(validateM4ZhengguanExplanation(report,value),true);
 return {m2Facts,evidence,value,report,text:renderM4ZhengguanText(report)};
}
const runCase=c=>run(c.pillars,c.monthTerm);
const itemFor=(report,id)=>{const item=report.candidates[0].items.find(i=>i.templateId===id);assert.ok(item,id);return item;};
const escaped=value=>value.replace(/[.*+?^${}()|[\]\\]/g,'\\$&');

test('M4 Korean reports cover ten stem readings without wrong particles or absent-item conjunctions',()=>{
 // Literal Korean-reading distinctions, independent of the report generator.
 const particles={
  甲:{topic:'은',object:'을'},乙:{topic:'은',object:'을'},
  丙:{topic:'은',object:'을'},丁:{topic:'은',object:'을'},
  戊:{topic:'는',object:'를'},己:{topic:'는',object:'를'},
  庚:{topic:'은',object:'을'},辛:{topic:'은',object:'을'},
  壬:{topic:'은',object:'을'},癸:{topic:'는',object:'를'},
 };
 const stemCases=[
  {master:'甲',pillars:['辛亥','乙酉','甲午','壬申'],term:'BAILU'},
  {master:'乙',pillars:['庚申','壬申','乙巳','戊寅'],term:'LIQIU'},
  {master:'丙',pillars:['癸亥','甲子','丙午','乙卯'],term:'DAXUE'},
  {master:'丁',pillars:['壬子','乙亥','丁巳','庚申'],term:'LIDONG'},
  {master:'戊',pillars:['乙卯','丁卯','戊辰','壬子'],term:'JINGZHE'},
  {master:'己',pillars:['甲子','丙寅','己巳','丁卯'],term:'LICHUN'},
  {master:'庚',pillars:['丁巳','丙午','庚申','壬子'],term:'MANGZHONG'},
  {master:'辛',pillars:['丙寅','乙巳','辛酉','壬子'],term:'LIXIA'},
  {master:'壬',pillars:['己巳','丁未','壬子','辛亥'],term:'XIAOSHU'},
  {master:'癸',pillars:['戊辰','丙戌','癸丑','庚申'],term:'HANLU'},
 ];
 assert.deepEqual(new Set(stemCases.map(c=>c.master)),new Set(Object.keys(particles)));
 const results=[...M4_ZHENGGUAN_CASES.map(runCase),...stemCases.map(c=>{
  const result=run(c.pillars,c.term);
  assert.equal(result.value.candidates[0].dayMaster,c.master);
  assert.ok(result.text.includes('일간 '+c.master),c.master+' day stem is narrated');
  return result;
 })];
 for(const {text}of results){
  assert.ok(!text.includes('없음이고'),'absence must not be joined as a person or thing');
  for(const [stem,p]of Object.entries(particles)){
   assert.ok(!text.includes(stem+(p.topic==='은'?'는':'은')),stem+' topic particle');
   assert.ok(!text.includes(stem+(p.object==='을'?'를':'을')),stem+' object particle');
  }
 }
});

test('M4 text names every original branch pair and every multi-member triad with all positions',()=>{
 const seenKinds=new Set();let reviewedTriads=0,overlappingPairs=0;
 for(const c of M4_ZHENGGUAN_CASES){
  const {m2Facts,report}=runCase(c),native=m2Facts.candidates[0];
  const text=itemFor(report,'KO_M4_INTERACTION_POSITIONS').text;
  assert.doesNotMatch(text,/그\s*밖(?:의)?\s*\d+\s*개|외\s*\d+\s*개\s*(?:지지|구성)/,c.id+' relation names must not disappear behind counts');
  const pairGroups=new Map();
  for(const pair of native.branchRelations){
   seenKinds.add(pair.kind);
   const position=roleKo[pair.leftPillarRole]+'지 '+pair.leftBranch+'–'+roleKo[pair.rightPillarRole]+'지 '+pair.rightBranch;
   const match=text.match(new RegExp(escaped(position)+'의 ([^;.]+)'));
   assert.ok(match,c.id+' '+position+' is located');
   assert.ok(match[1].split('·').includes(pairKo[pair.kind]),c.id+' '+position+' '+pair.kind+' is named');
   const key=pair.leftPillarRole+':'+pair.rightPillarRole;
   pairGroups.set(key,(pairGroups.get(key)??0)+1);
  }
  overlappingPairs += [...pairGroups.values()].filter(n=>n>1).length;
  for(const triad of native.triadMemberships.filter(t=>t.distinctMemberCount>=2)){
   reviewedTriads++;
   const heading=elementKo[triad.namedElement]+' '+familyKo[triad.family]+' '+(triad.distinctMemberCount===3?'세 구성원':'부분 구성원')+': ';
   const start=text.indexOf(heading);assert.ok(start>=0,c.id+' '+heading+' is named');
   const tail=text.slice(start+heading.length).split(/[;.]/,1)[0];
   for(const member of triad.members.filter(m=>m.pillarRoles.length)){
    const position=member.pillarRoles.map(role=>roleKo[role]).join('·')+'지 '+member.branch;
    assert.ok(tail.includes(position),c.id+' triad preserves '+position);
   }
   if(triad.missingBranches.length)assert.ok(tail.includes(triad.missingBranches.join('·')+' 미포함'),c.id+' absent members stay explicit');
  }
 }
 assert.deepEqual(seenKinds,new Set(Object.keys(pairKo)));
 assert.ok(reviewedTriads>1,'fixture exercises distinct triad membership reports');
 assert.ok(overlappingPairs>0,'fixture exercises simultaneous relation kinds');
});

test('formation-condition labels are explained as presence and direction rather than suitability or Ge Cheng',()=>{
 let observed=0;
 for(const c of M4_ZHENGGUAN_CASES){
  const {value,report}=runCase(c),candidate=value.candidates[0];
  if(candidate.formationAssessment.status==='FORMATION_CONDITIONS_OBSERVED'){
   observed++;
   const text=itemFor(report,'KO_M4_EFFECT_SCOPE').text;
   assert.match(text,/존재.*오행 방향/,c.id+' names the actual observation');
   assert.match(text,/위치의 적합성.*실제\s*成格\s*가능성.*평가한 결과는 아닙니다/,c.id+' limits the formation label');
  }
  assert.equal(candidate.effects.geCheng,'NOT_IMPLEMENTED',c.id);
  assert.equal(candidate.effects.geBai,'NOT_IMPLEMENTED',c.id);
  assert.equal(candidate.effects.jiuYing,'NOT_IMPLEMENTED',c.id);
  assert.ok(candidate.conditions.every(condition=>condition.effectStatus==='NOT_EVALUATED'),c.id);
 }
 assert.ok(observed>0,'the disclaimer must be tested on actual formation observations');
});

test('hidden-stem generation directions and presentation versions remain distinct from efficacy and policy versions',()=>{
 const original=byId('main-officer-hidden-without-visible-officer');
 const {value,report,text}=runCase(original),candidate=value.candidates[0];
 assert.equal(candidate.groups.wealth.visible.length,0,'literal case has no visible wealth');
 assert.ok(candidate.groups.wealth.hidden.length>0,'hidden wealth is present for the direction review');
 const support=itemFor(report,'KO_M4_WEALTH_RESOURCE_STRUCTURE').text;
 assert.match(support,/장간까지 포함한 오행 관계.*실제 생조 작용의 판정은 아닙니다/);
 assert.match(support,/재→관의 오행 생조 방향이 실제 위치에서 관측됩니다/);
 assert.equal(candidate.conditions.find(c=>c.kind==='WEALTH_GENERATES_OFFICER').effectStatus,'NOT_EVALUATED');
 assert.equal(M4_PATTERN_METADATA.version,'0.1.0');
 assert.equal(value.profile.version,'0.1.0');
 assert.equal(M4_PATTERN_REPORT_VERSION,'0.1.1');
 assert.equal(report.templateVersion,'0.1.1');
 assert.ok(report.candidates.every(c=>c.items.every(i=>i.templateVersion==='0.1.1')));
 assert.ok(M4_PATTERN_METADATA.rules.every(r=>r.runtimeVersion==='0.1.0'));
 assert.ok(text.includes('선택 정책: '+M4_PATTERN_PROFILE_ID+' / 0.1.0'),'policy version must not be relabelled as the presentation revision');
 assert.match(text,/템플릿[^\n]*0\.1\.1/);
 assert.ok(!text.includes('선택 정책: '+M4_PATTERN_PROFILE_ID+' / 0.1.1'));
});
