// Independent literal decision cases and fictional structural units, not birth predictions.
import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {deriveM3Evidence,M3_EVIDENCE_PROFILE_ID} from '../dist/m3/structuralEvidenceV1.js';
import {deriveM3RootPresence,M3_ROOT_POLICY_ID} from '../dist/m3/rootPresenceV1.js';
import {deriveM3ResourceSupport,M3_SUPPORT_POLICY_ID} from '../dist/m3/resourceSupportV1.js';
import {resolveSeasonalSiliState,M3_SEASONAL_SILI_POLICY_ID} from '../dist/m3/seasonalStateV2.js';
import {
 M3_SYNTHESIS_PROFILE_ID,M3_SYNTHESIS_METADATA,deriveM3LimitedSynthesis,
 validateM3LimitedSynthesis,explainM3LimitedSynthesis,
 validateM3LimitedSynthesisExplanation,renderM3LimitedSynthesisText,
} from '../dist/m3/limitedSynthesisV1.js';
import {structuralM2Unit} from './fixtures/m3-structural-unit-input.mjs';
import {
 LIMITED_SYNTHESIS_CASE_BASIS,LIMITED_SYNTHESIS_CASES,
 LIMITED_SYNTHESIS_BOUNDARY_CONTRACTS,LIMITED_SYNTHESIS_REJECTION_CONTRACTS,
} from './fixtures/m3-limited-synthesis-cases.mjs';

const frozenFixtureSha='1cf60a7898a73c34a1d8c41b9e5d7dd2de344891daf3f5c7b07794447ac58542';
const byId=id=>LIMITED_SYNTHESIS_CASES.find(value=>value.id===id);
const roles=['year','month','day','hour'];
const endByBranch={
 辰:['LIXIA','2026-05-05T01:20'],未:['LIQIU','2026-08-05T01:20'],
 戌:['LIDONG','2026-11-05T01:20'],丑:['LICHUN','2026-02-05T01:20'],
};
const birthByBranch={寅:'2026-02-06T12:00',卯:'2026-03-06T12:00',辰:'2026-04-06T12:00',巳:'2026-05-06T12:00',午:'2026-06-06T12:00',未:'2026-07-06T12:00',申:'2026-08-06T12:00',酉:'2026-09-06T12:00',戌:'2026-10-06T12:00',亥:'2026-11-06T12:00',子:'2026-12-06T12:00',丑:'2026-01-06T12:00'};

// Every minute in this helper is explicitly synthetic. S is copied from the original
// M3 month context; T is a separate synthetic event. No fixed real KASI minute is invented.
function seasonalFor(evidence,{birthDateTime,omitNext=false,endingSourceId}={}){
 return evidence.candidates.map(candidate=>{
  const month=candidate.evidence.find(item=>item.kind==='MONTH_CONTEXT'),branch=candidate.monthContext.monthPillar.branch;
  const base={candidateRef:candidate.candidateRef,dayMaster:candidate.dayMaster,monthBranch:branch,
   evidenceRefs:[month.id],inputFactRefs:month.inputFactRefs,pillarRefs:[candidate.candidateRef+'.day',candidate.candidateRef+'.month'],
   calculationSourceRefs:month.calculationSourceRefs,appliedJie:candidate.monthContext.activeSince};
  const ending=endByBranch[branch];
  const nextSili=ending&&!omitNext?{term:ending[0],displayedDateTime:ending[1],timeBasis:'KST',sourcePrecision:'MINUTE',sourceIds:endingSourceId?[endingSourceId]:base.calculationSourceRefs}:null;
  const side=candidate.monthContext.boundarySide;
  const monthCondition=side==='BEFORE_PUBLISHED_MINUTE'?'BEFORE_PUBLISHED_BOUNDARY':side==='AFTER_PUBLISHED_MINUTE'?'AFTER_PUBLISHED_BOUNDARY':'BETWEEN_PUBLISHED_BOUNDARIES';
  return resolveSeasonalSiliState({base,birthDateTime:birthDateTime??birthByBranch[branch],monthCondition,nextSili},{policyId:M3_SEASONAL_SILI_POLICY_ID});
 });
}
function context(pillarSets,monthTerms,seasonOptions){
 const m2Facts=structuralM2Unit(pillarSets,{monthTerms});
 const evidence=deriveM3Evidence(m2Facts,{policyId:M3_EVIDENCE_PROFILE_ID});
 const root=deriveM3RootPresence(evidence,{policyId:M3_ROOT_POLICY_ID,m2Facts});
 const support=deriveM3ResourceSupport(evidence,{policyId:M3_SUPPORT_POLICY_ID,root,m2Facts});
 const seasonalJudgments=seasonalFor(evidence,seasonOptions);
 return {m2Facts,evidence,root,support,seasonalJudgments};
}
const stateFor=c=>context([c.pillars],[c.monthTerm]);
const run=(state,overrides={})=>deriveM3LimitedSynthesis(state.evidence,{profileId:M3_SYNTHESIS_PROFILE_ID,root:state.root,support:state.support,m2Facts:state.m2Facts,seasonalJudgments:state.seasonalJudgments,...overrides});
const first=result=>result.candidates[0];
const path=result=>first(result).paths[0];
const condition=(result,id)=>path(result).conditions.find(item=>item.id===id);
const upstream=s=>JSON.stringify({evidence:s.evidence,m2Facts:s.m2Facts,root:s.root,support:s.support,season:s.seasonalJudgments});
const semantic=result=>result.candidates.map(c=>({pillars:c.pillars,observed:c.observed,paths:c.paths.map(p=>({status:p.status,conclusion:p.conclusion,season:p.season,seasonalState:p.seasonalState,conditions:p.conditions,importantUnresolvedEffects:p.importantUnresolvedEffects}))}));

test('twenty pre-resolver literal cases preserve every accepted and deferred decision without output-derived expectations',()=>{
 // A Windows Git checkout may change only LF to CRLF. Pin the independently
 // authored literal content, with that explicit newline normalization alone.
 assert.equal(createHash('sha256').update(readFileSync(new URL('./fixtures/m3-limited-synthesis-cases.mjs',import.meta.url),'utf8').replace(/\r\n/g,'\n')).digest('hex'),frozenFixtureSha);
 assert.equal(LIMITED_SYNTHESIS_CASES.length,20);assert.equal(LIMITED_SYNTHESIS_BOUNDARY_CONTRACTS.length,4);assert.equal(LIMITED_SYNTHESIS_REJECTION_CONTRACTS.length,5);
 assert.match(LIMITED_SYNTHESIS_CASE_BASIS.expectationMethod,/BEFORE_RESOLVER/);
 const counts={};
 for(const c of LIMITED_SYNTHESIS_CASES){
  assert.ok(c.importantEvidence.length&&c.forbiddenConclusions.length&&c.whyNotOpposite&&c.unchecked.length,c.id);
  const state=stateFor(c),before=upstream(state),value=run(state),parent=first(value),p=path(value);
  assert.equal(parent.paths.length,1,c.id);assert.equal(p.status,c.expected.status,c.id);assert.equal(p.conclusion,c.expected.conclusion,c.id);
  assert.equal(p.season,c.seasonal.season,c.id);assert.equal(p.seasonalState,c.seasonal.dayState,c.id);
  for(const expected of c.expectedResourceDecisions??[]){const actual=parent.observed.resources.surfaceDecisions.find(r=>r.resource.pillarRole===expected.role);assert.ok(actual,c.id);assert.equal(actual.selectedRuleDecision,expected.decision,c.id);}
  if(p.status==='RESOLVED_UNDER_POLICY'){assert.equal(p.conditions.length,8);assert.ok(p.conditions.every(x=>x.satisfied),c.id);assert.equal(p.counterEvidence.length,0);assert.equal(p.missingSufficientConditions.length,0);}
  else{assert.equal(p.conclusion,null);assert.ok(p.counterEvidence.length>0,c.id);}
  assert.equal(upstream(state),before,c.id+' does not mutate original evidence');
  assert.equal(validateM3LimitedSynthesis(value,{evidence:state.evidence,root:state.root,support:state.support,m2Facts:state.m2Facts,seasonalJudgments:state.seasonalJudgments}),true);
  counts[p.status]=(counts[p.status]??0)+1;
 }
 assert.deepEqual(counts,{RESOLVED_UNDER_POLICY:4,DEFERRED_MIXED_EVIDENCE:4,DEFERRED_EFFECT_POLICY_REQUIRED:9,OUTSIDE_POLICY_SCOPE:3});
 assert.deepEqual(M3_SYNTHESIS_METADATA.acceptedConclusions,['WEAK_UNDER_SELECTED_POLICY']);
});

test('the absence conclusion generalizes beyond literary chart strings without counting visible peers as roots',()=>{
 for(const id of ['literature-four-xin-mao','literature-four-bing-shen','all-zi-unrooted-visible-peers','all-mao-distinct-drain-consume-control']){
  const value=run(stateFor(byId(id))),o=first(value).observed;
  assert.equal(path(value).conclusion,'WEAK_UNDER_SELECTED_POLICY',id);assert.equal(o.dayRoot.chartRootPresence,'ABSENT_UNDER_POLICY');
  assert.equal(o.hiddenPeers.length,0);assert.equal(o.resources.visible.length+o.resources.hidden.length,0);
  assert.ok(o.visiblePeers.every(x=>x.rootPresence==='ABSENT_UNDER_POLICY'));
  assert.equal(o.interactions.visibleFiveCombinations.length+o.interactions.rawBranchPairs.length+o.interactions.multiMemberTriads.length,0);
 }
 const distinct=first(run(stateFor(byId('all-mao-distinct-drain-consume-control')))).observed;
 assert.ok(distinct.directionalGroups.DAY_MASTER_GENERATES.some(l=>l.locationKind==='VISIBLE_STEM'&&l.stem==='癸'));
 assert.ok(distinct.directionalGroups.DAY_MASTER_CONTROLS.some(l=>l.locationKind==='VISIBLE_STEM'&&l.stem==='乙'));
 assert.ok(distinct.directionalGroups.TARGET_CONTROLS_DAY_MASTER.some(l=>l.locationKind==='VISIBLE_STEM'&&l.stem==='丁'));
});

test('adding a real unrooted resource changes a closed absence result and NO_HOLD never proves efficacy',()=>{
 const a=run(stateFor(byId('all-zi-unrooted-visible-peers'))),b=run(stateFor(byId('unrooted-visible-resource-not-held')));
 assert.equal(path(a).status,'RESOLVED_UNDER_POLICY');assert.equal(path(b).status,'DEFERRED_MIXED_EVIDENCE');
 assert.equal(condition(a,'DAY_ROOT_ABSENT').satisfied,true);assert.equal(condition(b,'DAY_ROOT_ABSENT').satisfied,true);
 assert.equal(condition(a,'ALL_RESOURCE_LOCATIONS_ABSENT').satisfied,true);assert.equal(condition(b,'ALL_RESOURCE_LOCATIONS_ABSENT').satisfied,false);
 const o=first(b).observed;assert.equal(o.resources.visible.length,1);assert.equal(o.resources.visible[0].stem,'戊');
 assert.equal(o.resources.surfaceDecisions[0].rootPresence,'ABSENT_UNDER_POLICY');assert.equal(o.resources.surfaceDecisions[0].selectedRuleDecision,'NO_HOLD_BY_THIS_RULE');
 assert.ok(path(b).importantUnresolvedEffects.some(e=>e.code==='RESOURCE_SUPPORT_EFFICACY'&&e.material&&e.status==='NOT_EVALUATED'));
 assert.notDeepEqual(path(a).counterEvidence,path(b).counterEvidence);
});

test('hidden resources and peers remain material when their visible groups are absent',()=>{
 const resource=first(run(stateFor(byId('hidden-resource-only-prevents-absence-rule')))),peer=first(run(stateFor(byId('hidden-peer-only-not-surface-peer-absence'))));
 assert.equal(resource.observed.resources.visible.length,0);assert.equal(resource.observed.resources.surfaceDecisions.length,0);
 assert.ok(resource.observed.resources.hidden.some(l=>l.stem==='壬'));assert.equal(resource.paths[0].status,'DEFERRED_MIXED_EVIDENCE');
 assert.equal(peer.observed.visiblePeers.length,0);assert.ok(peer.observed.hiddenPeers.some(l=>l.stem==='丁'));
 assert.equal(peer.observed.dayRoot.chartRootPresence,'PRESENT_UNDER_POLICY');assert.equal(peer.paths[0].status,'DEFERRED_MIXED_EVIDENCE');
 for(const p of [resource.paths[0],peer.paths[0]])assert.equal(p.conclusion,null);
});

test('root presence, held adoption and rooted exceptions never delete facts or establish force',()=>{
 const a=run(stateFor(byId('resource-adjacent-held-kept-in-synthesis'))),b=run(stateFor(byId('resource-same-pair-rooted-exception'))),c=run(stateFor(byId('resource-other-polarity-rooted-exception')));
 const god=r=>first(r).observed.resources.surfaceDecisions.find(d=>d.resource.pillarRole==='month');
 assert.equal(god(a).selectedRuleDecision,'SUPPORT_HELD_UNDER_SELECTED_RULE');assert.equal(god(b).selectedRuleDecision,'ROOTED_COMBINATION_EFFECT_UNRESOLVED');assert.equal(god(c).selectedRuleDecision,'ROOTED_COMBINATION_EFFECT_UNRESOLVED');
 for(const value of [a,b,c]){assert.ok(first(value).observed.resources.visible.some(l=>l.stem==='癸'));assert.equal(path(value).status,'DEFERRED_EFFECT_POLICY_REQUIRED');assert.equal(path(value).conclusion,null);assert.equal(god(value).totalSupportEfficacy,'NOT_EVALUATED');}
 const base=run(stateFor(byId('declining-season-root-present-no-raw-pair')));assert.equal(condition(base,'DAY_ROOT_ABSENT').satisfied,false);assert.equal(path(base).status,'DEFERRED_MIXED_EVIDENCE');
 assert.ok(path(base).importantUnresolvedEffects.some(e=>e.code==='ROOT_EFFICACY'&&e.material));
});

test('raw pair, partial triad and all visible five-combinations are separate material guards',()=>{
 const raw=run(stateFor(byId('same-root-absence-with-raw-branch-interaction'))),triad=run(stateFor(byId('partial-triad-without-raw-pair-blocks-absence-rule'))),stem=run(stateFor(byId('visible-five-combination-without-branch-pair')));
 assert.equal(condition(raw,'NO_RAW_BRANCH_PAIR').satisfied,false);
 assert.equal(condition(triad,'NO_RAW_BRANCH_PAIR').satisfied,true);assert.equal(condition(triad,'NO_MULTI_MEMBER_TRIAD').satisfied,false);
 assert.equal(condition(stem,'NO_RAW_BRANCH_PAIR').satisfied,true);assert.equal(condition(stem,'NO_MULTI_MEMBER_TRIAD').satisfied,true);assert.equal(condition(stem,'NO_VISIBLE_FIVE_COMBINATION').satisfied,false);
 for(const value of [raw,triad,stem]){assert.equal(path(value).status,'DEFERRED_EFFECT_POLICY_REQUIRED');assert.equal(path(value).conclusion,null);assert.ok(path(value).importantUnresolvedEffects.some(e=>e.code==='NATAL_INTERACTION_EFFECT'&&e.material));}
 const overlap=first(run(stateFor(byId('overlapping-si-shen-relations-not-prioritized-away')))).observed.interactions.rawBranchPairs;
 const kinds=new Set(overlap.filter(r=>new Set([r.leftBranch,r.rightBranch]).size===2&&[r.leftBranch,r.rightBranch].includes('巳')&&[r.leftBranch,r.rightBranch].includes('申')).map(r=>r.kind));
 for(const kind of ['LIUHE','XING','LIUPO'])assert.ok(kinds.has(kind),kind+' preserved');
});

test('same parent at derived B keeps one root/support context and two correlated seasonal decision paths',()=>{
 const state=context([['壬戌','壬戌','壬戌','壬戌']],['HANLU'],{birthDateTime:'2026-10-18T01:20'}),before=upstream(state),value=run(state);
 assert.equal(value.candidates.length,1);assert.equal(state.seasonalJudgments[0].status,'AMBIGUOUS');assert.equal(first(value).paths.length,2);
 assert.deepEqual(first(value).paths.map(p=>p.season),['AUTUMN','EARTH_DOMINANT']);assert.deepEqual(first(value).paths.map(p=>p.status),['OUTSIDE_POLICY_SCOPE','DEFERRED_MIXED_EVIDENCE']);
 assert.equal(new Set(first(value).paths.map(p=>p.parentCandidateRef)).size,1);
 assert.deepEqual(first(value).paths[0].rootJudgmentRefs,first(value).paths[1].rootJudgmentRefs);assert.deepEqual(first(value).paths[0].supportJudgmentRefs,first(value).paths[1].supportJudgmentRefs);
 assert.notEqual(first(value).paths[0].seasonalAlternativeRef,first(value).paths[1].seasonalAlternativeRef);assert.equal(upstream(state),before);
 const report=explainM3LimitedSynthesis(value);assert.equal(report.candidates.length,1);assert.equal(report.candidates[0].paths.length,2);assert.match(renderM3LimitedSynthesisText(report),/조건 경로 1/);
});

test('missing T creates a specific data shortage without replacing unavailable effects by zero',()=>{
 const state=context([['丙戌','丙戌','丙戌','丙戌']],['HANLU'],{omitNext:true}),value=run(state),p=path(value);
 assert.equal(state.seasonalJudgments[0].status,'NEEDS_DATA');assert.equal(p.status,'NEEDS_DATA');assert.equal(p.conclusion,null);assert.ok(p.missingData.length>0);
 assert.equal(p.seasonalAlternativeRef,null);assert.equal(first(value).paths.length,1);assert.equal(first(value).observed.dayRoot.chartRootPresence,'PRESENT_UNDER_POLICY');
 assert.equal(p.conditions.find(c=>c.id==='DECLINING_SEASON').satisfied,null);
 assert.ok(p.unknownEvidence.some(c=>c.id==='DECLINING_SEASON'));assert.ok(!p.counterEvidence.some(c=>c.id==='DECLINING_SEASON'));
 assert.ok(p.counterEvidence.every(c=>c.satisfied===false));assert.ok(p.supportingEvidence.every(c=>c.satisfied===true));
 assert.ok(p.importantUnresolvedEffects.some(x=>x.code==='ROOT_EFFICACY'&&x.material));assert.match(renderM3LimitedSynthesisText(explainM3LimitedSynthesis(value)),/자료가 부족/);
});

test('published Sili keeps two original parents with their own roots and single correlated season paths',()=>{
 const state=context([['乙巳','己丑','己酉','丁卯'],['丙午','庚寅','己酉','丁卯']],['XIAOHAN','LICHUN'],{birthDateTime:'2026-02-05T01:20'});
 const value=run(state);assert.equal(value.candidates.length,2);
 assert.deepEqual(value.candidates.map(c=>c.paths.length),[1,1]);
 assert.deepEqual(value.candidates.map(c=>c.paths[0].seasonalState),['WANG','SI']);
 assert.deepEqual(value.candidates.map(c=>c.paths[0].status),['OUTSIDE_POLICY_SCOPE','DEFERRED_EFFECT_POLICY_REQUIRED']);
 assert.deepEqual(value.candidates.map(c=>c.pillars[1].stem+c.pillars[1].branch),['己丑','庚寅']);
 for(const [i,c]of value.candidates.entries()){
  assert.equal(c.candidateRef,'chart.candidates['+i+']');assert.equal(c.observed.dayRoot.target.candidateRef,c.candidateRef);
  assert.equal(c.paths[0].parentCandidateRef,c.candidateRef);assert.equal(c.paths[0].parentMonthCondition,i===0?'BEFORE_PUBLISHED_MINUTE':'AFTER_PUBLISHED_MINUTE');
  assert.ok(c.rootJudgmentRefs.every(ref=>ref.startsWith(c.candidateRef+'#')));
 }
 const swapped=[state.seasonalJudgments[1],state.seasonalJudgments[0]];assert.throws(()=>run(state,{seasonalJudgments:swapped}));
 const report=structuredClone(explainM3LimitedSynthesis(value));report.candidates[0].paths[0]=report.candidates[1].paths[0];assert.throws(()=>validateM3LimitedSynthesisExplanation(report,value));
});

test('every decision and report reference resolves to its own parent, source, rule and input facts',()=>{
 const state=stateFor(byId('resource-same-pair-rooted-exception')),value=run(state),report=explainM3LimitedSynthesis(value),parent=first(value),p=path(value);
 const sourceIds=new Set(value.sources.map(s=>s.id)),ruleIds=new Set(value.rules.map(r=>r.id)),facts=new Set(state.m2Facts.candidates[0].facts.map(f=>f.id)),evidence=new Set(state.evidence.candidates[0].evidence.map(e=>e.id));
 const members=new Set(state.m2Facts.candidates[0].facts.filter(f=>f.kind==='HIDDEN_STEMS').flatMap(f=>f.value.members.map(m=>m.id)));
 const roots=new Set(state.root.candidates[0].targets.map(t=>t.id)),matches=new Set(state.root.candidates[0].targets.flatMap(t=>t.branches.flatMap(b=>b.matches.map(m=>m.id))));
 const supports=new Set(state.support.candidates[0].resources.map(r=>r.id));
 const refs={sourceRefs:sourceIds,calculationSourceRefs:sourceIds,ruleRefs:ruleIds,inputFactRefs:facts,inputEvidenceRefs:evidence,inputMemberRefs:members,rootJudgmentRefs:roots,rootMatchRefs:matches,supportJudgmentRefs:supports};
 for(const record of [parent,p,report.candidates[0].paths[0]])for(const [key,ids]of Object.entries(refs)){assert.ok(Array.isArray(record[key]),key);assert.equal(Object.keys(record[key]).length,record[key].length,key);assert.equal(new Set(record[key]).size,record[key].length,key);for(const id of record[key])assert.ok(ids.has(id),key+' '+id);}
 assert.equal(report.candidates[0].paths[0].candidateRef,parent.candidateRef);assert.equal(report.candidates[0].paths[0].pathRef,p.id);
 assert.equal(validateM3LimitedSynthesisExplanation(report,value),true);assert.equal(value.validation.g0Receipt,null);assert.equal(value.validation.g1P2Promotion,false);assert.equal(value.validation.m3FinalInterpretationGate,'BLOCKED_UNCHANGED');
 assert.equal(value.validation.sourceEdition,'UNVERIFIED');assert.equal(value.validation.rightsReview,'UNVERIFIED');assert.equal(value.validation.predictiveValidity,'NOT_CLAIMED');
});

test('missing, crossed, sparse or cloned inputs and unregistered calendar sources fail without fallback',()=>{
 const state=stateFor(byId('all-zi-unrooted-visible-peers')),other=stateFor(byId('hidden-resource-only-prevents-absence-rule'));
 for(const profileId of [undefined,'','AUTO','UNKNOWN',M3_ROOT_POLICY_ID])assert.throws(()=>run(state,{profileId}));
 for(const override of [{root:undefined},{support:undefined},{m2Facts:undefined},{seasonalJudgments:[]},{root:other.root},{support:other.support},{m2Facts:other.m2Facts},{seasonalJudgments:other.seasonalJudgments},{root:structuredClone(state.root)},{support:structuredClone(state.support)},{seasonalJudgments:structuredClone(state.seasonalJudgments)}])assert.throws(()=>run(state,override));
 const sparse=[...state.seasonalJudgments];delete sparse[0];assert.throws(()=>run(state,{seasonalJudgments:sparse}));
 assert.throws(()=>run(state,{seasonalCalculationSources:[{id:'MISSING_CALENDAR',sourceRef:'invented',original:{}}]}));
 assert.throws(()=>run(state,{seasonalCalculationSources:[{id:state.seasonalJudgments[0].calculationSourceRefs[0],sourceRef:'invented',original:{}}]}),'conflicting existing calendar source cannot replace the original registry record');
 const valid=run(state);assert.throws(()=>validateM3LimitedSynthesis(valid,{m2Facts:other.m2Facts}));assert.throws(()=>validateM3LimitedSynthesis(valid,{seasonalJudgments:[...state.seasonalJudgments]}));
 const forged=structuredClone(valid);assert.throws(()=>validateM3LimitedSynthesis(forged));
});

test('report changes, missing references, cross-parent paths and strength promotions are explicitly rejected',()=>{
 const state=stateFor(byId('all-zi-unrooted-visible-peers')),value=run(state),view=explainM3LimitedSynthesis(value);
 assert.deepEqual(explainM3LimitedSynthesis(value),view);
 const edits=[
  v=>{v.candidates[0].paths[0].summary='관계와 계절만으로 신강이 확정되었습니다.';},
  v=>{v.candidates[0].paths[0].conclusion='STRONG_UNDER_SELECTED_POLICY';},
  v=>{v.candidates[0].paths[0].text='신약이므로 질병이 발생합니다.';},
  v=>{v.candidates[0].paths[0].pathRef='MISSING_JUDGMENT';},
  v=>{v.candidates[0].paths[0].candidateRef='chart.candidates[1]';},
  v=>{v.candidates[0].paths[0].inputFactRefs=['MISSING_FACT'];},
  v=>{v.candidates[0].paths[0].ruleRefs=['MISSING_RULE'];},
  v=>{v.candidates[0].paths[0].sourceRefs=['MISSING_SOURCE'];},
  v=>{v.candidates[0].paths[0].templateId='UNDEFINED_TEMPLATE';},
  v=>{delete v.candidates[0].paths[0];},
  v=>{v.candidates[0].paths.push(v.candidates[0].paths[0]);},
  v=>{v.scopeNote='모든 학파와 상용 출시에서 인증된 확정 해석입니다.';},
 ];
 for(const edit of edits){const bad=structuredClone(view);edit(bad);assert.throws(()=>validateM3LimitedSynthesisExplanation(bad,value));}
 assert.throws(()=>renderM3LimitedSynthesisText(structuredClone(view)),'render requires its original issued report');
 const direct=structuredClone(state.evidence);direct.finalStrength='WEAK_UNDER_SELECTED_POLICY';assert.throws(()=>deriveM3LimitedSynthesis(direct,{profileId:M3_SYNTHESIS_PROFILE_ID,root:state.root,support:state.support,m2Facts:state.m2Facts,seasonalJudgments:state.seasonalJudgments}));
});

test('immutable outcomes, request alternation and original M2 mutation stay isolated and reproducible',()=>{
 const a=stateFor(byId('all-zi-unrooted-visible-peers')),before=upstream(a),issued=run(a),digest=JSON.stringify(issued);
 for(const id of ['resource-adjacent-held-kept-in-synthesis','resource-no-hold-unrooted-season-wang','hidden-resource-only-prevents-absence-rule'])run(stateFor(byId(id)));
 assert.deepEqual(semantic(run(stateFor(byId('all-zi-unrooted-visible-peers')))),semantic(issued));assert.equal(upstream(a),before);
 assert.throws(()=>{issued.candidates[0].paths[0].conclusion='STRONG_UNDER_SELECTED_POLICY';},TypeError);
 assert.throws(()=>{issued.candidates[0].observed.resources.visible.push({});},TypeError);
 a.m2Facts.candidates[0].facts.find(f=>f.kind==='HIDDEN_STEMS').value.members[0].sourceRefs=[];
 assert.throws(()=>run(a));assert.throws(()=>validateM3LimitedSynthesis(issued));assert.equal(JSON.stringify(issued),digest);
 const fresh=stateFor(byId('all-zi-unrooted-visible-peers'));assert.equal(path(run(fresh)).conclusion,'WEAK_UNDER_SELECTED_POLICY');
 assert.equal(fresh.evidence.finalStrength.status,'NOT_IMPLEMENTED');assert.equal(fresh.root.finalStrength.status,'NOT_IMPLEMENTED');assert.equal(fresh.support.finalStrength.status,'NOT_IMPLEMENTED');
 assert.ok(issued.rules.some(r=>r.runtimeVersion===null),'native unknown rule versions are not replaced by synthesis version');
});

test('later replacement of an issued seasonal-array element is detected even with the same parent and original S',()=>{
 const state=context([['壬戌','壬戌','壬戌','壬戌']],['HANLU'],{birthDateTime:'2026-10-17T12:00'});
 const value=run(state),snapshot=JSON.stringify(value),after=seasonalFor(state.evidence,{birthDateTime:'2026-10-19T12:00'})[0];
 assert.equal(state.seasonalJudgments[0].candidateRef,after.candidateRef);assert.deepEqual(state.seasonalJudgments[0].appliedJie,after.appliedJie);
 assert.notEqual(state.seasonalJudgments[0].season,after.season);
 state.seasonalJudgments[0]=after;assert.throws(()=>validateM3LimitedSynthesis(value),/SEASONAL_CONTAINER_CHANGED/);
 assert.equal(JSON.stringify(value),snapshot,'already-issued report data must not follow the mutable container');
 const sparse=context([['壬戌','壬戌','壬戌','壬戌']],['HANLU']),sparseValue=run(sparse);delete sparse.seasonalJudgments[0];assert.throws(()=>validateM3LimitedSynthesis(sparseValue));
});

test('calendar evidence arrays are copied without freezing caller records and later pushes or nested changes reject',()=>{
 const state=stateFor(byId('all-zi-unrooted-visible-peers')),extra=[];
 const value=run(state,{seasonalCalculationSources:extra}),snapshot=JSON.stringify(value);
 extra.push({id:'FAKE_POST_ISSUANCE',sourceRef:'SYNTHETIC_TEST',original:{notAnApiResponse:true}});
 assert.throws(()=>validateM3LimitedSynthesis(value),/CALENDAR_CONTAINER_CHANGED/);assert.equal(JSON.stringify(value),snapshot);

 // The receipt shape deliberately matches the existing adapter contract. The
 // all-zero fingerprint and explicit synthetic marker are NOT an actual API
 // response, accepted private candidate, or any external source authentication.
 const sourceRef='SYNTHETIC_ENDING_EVENT_FOR_TEST';
 const endingId='KASI_OPENAPI_RESPONSE:'+sourceRef+':2026-11-05:LIDONG';
 const withT=context([['壬戌','壬戌','壬戌','壬戌']],['HANLU'],{endingSourceId:endingId});
 const receipt=()=>({id:endingId,sourceRef,inputNature:'SYNTHETIC_SHAPE_ONLY_NOT_API_RESPONSE_OR_AUTHENTICATION',
  original:{kind:'solar',sourceRef,date:'2026-11-05',time:'01:20',termCode:'LIDONG',inputNature:'SYNTHETIC_NOT_API_OR_BIRTH_AUTHENTICATION',nested:{note:'literal-before'}},
  source:{id:sourceRef,evidenceSurface:'KASI_OPENAPI_RESPONSE',serviceId:'15012690',operation:'get24DivisionsInfo',responseSha256:'0'.repeat(64)},
  interpreted:{displayedDateTime:'2026-11-05T01:20',sourcePrecision:'MINUTE'}});
 const source=receipt();
 const sources=[source],issued=run(withT,{seasonalCalculationSources:sources}),before=JSON.stringify(issued);
 assert.equal(Object.isFrozen(source),false);assert.equal(Object.isFrozen(source.original),false);assert.equal(Object.isFrozen(source.original.nested),false);
 source.original.nested.note='literal-after';assert.throws(()=>validateM3LimitedSynthesis(issued),/CALENDAR_CONTAINER_CHANGED/);assert.equal(JSON.stringify(issued),before);
 const fresh=receipt();
 assert.throws(()=>run(withT,{seasonalCalculationSources:[fresh,fresh]}),/DUPLICATE_CALENDAR_SOURCE/);
 const sparse=[fresh];delete sparse[0];assert.throws(()=>run(withT,{seasonalCalculationSources:sparse}),/DENSE_ARRAY_REQUIRED/);
 for(const mutate of [
  s=>{s.sourceRef='';},s=>{s.original={};},s=>{s.source={};},s=>{s.interpreted={};},
  s=>{s.original=new Date('2026-11-05T01:20:00Z');},
  s=>{s.original.nested=new Date('2026-11-05T01:20:00Z');},
  s=>{s.original.date='2026-11-06';},s=>{s.original.termCode='LICHUN';},
  s=>{s.original.sourceRef='OTHER_REQUEST';},s=>{s.source.responseSha256='not-a-fingerprint';},
  s=>{s.source.evidenceSurface='ANNUAL_TXT';},s=>{s.interpreted.displayedDateTime='2026-11-05T01:21';},
 ]){const bad=receipt();mutate(bad);assert.throws(()=>run(withT,{seasonalCalculationSources:[bad]}));}
});
