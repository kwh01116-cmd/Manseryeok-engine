/** Offline streamed connection checks. Literal decision-table checks are not predictive validation. */
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {readFile,realpath,mkdir,writeFile,lstat} from 'node:fs/promises';
import {execFileSync} from 'node:child_process';
import {dirname,isAbsolute,join,relative,resolve} from 'node:path';
import {fileURLToPath,pathToFileURL} from 'node:url';
import net from 'node:net';
import http from 'node:http';
import https from 'node:https';
import tls from 'node:tls';
import {canonical,fingerprint,sha} from '../../.kasi-build/schema.js';
import {loadCandidate} from './candidate.mjs';
import {inventory} from './research.mjs';
import {BASELINE_MANIFEST_SHA256,MODERN_PROFILE_ID,MODERN_CLOCK_POLICY_ID,createLocalChartProfile,loadLocalChartProfile,getLocalChartEventContext} from './local-chart.mjs';
import {modernExplanationGrid} from './local-explain-verify.mjs';
import {pre18BoundaryGrid} from './local-m3-seasonal-v2-verify.mjs';
import {loadKasi2027BoundarySupplement} from './boundary-supplement.mjs';
import {M2_LOCAL_PROFILE_ID} from './local-chart-facts.mjs';
import {createLocalM3EvidenceProfile,deriveLocalM3LimitedSynthesis,validateLocalM3LimitedSynthesis,validateLocalM3EvidenceResult,M3_LOCAL_PROFILE_ID,M3_ROOT_POLICY_ID,M3_SUPPORT_POLICY_ID,M3_SEASONAL_SILI_POLICY_ID,M3_SEASONAL_POLICY_ID,M3_SYNTHESIS_PROFILE_ID} from './local-m3-evidence.mjs';
import {validateM3LimitedSynthesisExplanation} from '../../dist/m3/limitedSynthesisV1.js';
import {DAY_ROLLOVER_POLICIES} from '../../dist/calendar/dayRollover.js';
import {HOUR_STEM_REFERENCE_POLICIES} from '../../dist/calendar/dayHourPillars.js';

const repo=resolve(dirname(fileURLToPath(import.meta.url)),'../..');
const git=args=>execFileSync('git',['-c','safe.directory='+repo.replaceAll('\\','/'),...args],{cwd:repo,encoding:'utf8',stdio:['ignore','pipe','pipe']}).trim();
const inside=(parent,child)=>{const path=relative(parent,child);return path!==''&&!path.startsWith('..')&&!isAbsolute(path);};
const exportPin='7b5584aca339b85c7e54e953c43b672358bda605a478831b6f260df00472e851';
const supplementPin='f6a0e6dd2b169b4e758f8d1326942556c59f569af714adcb36e73824c6ef02b7';
// Prior accepted snapshots, never hashes read from the currently checked manifests.
const treePins={candidateA:'b2a2560d2d6324554e8bacf4f34e5a788cddabe71e99843b3b6dcb6876a89bed',candidateB:'b143a6cd766a9d0c0e763f93aba1236db68a29c2a5e71a89647e0371dbca6584',completedInput:'82c5a30c679ac743c0c89a0192ce2cf21a42387fd4ad8cbb6847a4db18866567',boundarySupplement:'47fdc994a0eb7834cf99c63bafb6d23121a1aa490b0370485690eefaa149d5c9'};
const executedPaths=[
  'scripts/kasi/local-m3-synthesis-verify.mjs','scripts/kasi/local-m3-evidence.mjs','scripts/kasi/local-m3-seasonal-v2-verify.mjs','scripts/kasi/local-explain-verify.mjs','scripts/kasi/local-chart.mjs','scripts/kasi/local-chart-facts.mjs','scripts/kasi/local-explain.mjs','scripts/kasi/candidate.mjs','scripts/kasi/research.mjs','scripts/kasi/boundary-supplement.mjs',
  'src/m3/limitedSynthesisV1.ts','dist/m3/limitedSynthesisV1.js','src/m3/structuralEvidenceV1.ts','dist/m3/structuralEvidenceV1.js','src/m3/rootPresenceV1.ts','dist/m3/rootPresenceV1.js','src/m3/resourceSupportV1.ts','dist/m3/resourceSupportV1.js','src/m3/seasonalStateV1.ts','dist/m3/seasonalStateV1.js','src/m3/seasonalStateV2.ts','dist/m3/seasonalStateV2.js',
  'src/domain/stemCombinations.ts','dist/domain/stemCombinations.js','src/domain/hiddenStems.ts','dist/domain/hiddenStems.js','src/domain/tenGods.ts','dist/domain/tenGods.js','src/domain/branchRelations.ts','dist/domain/branchRelations.js','src/domain/triadMemberships.ts','dist/domain/triadMemberships.js','src/calendar/fourPillars.ts','dist/calendar/fourPillars.js','src/calendar/solarTermTimeline.ts','dist/calendar/solarTermTimeline.js','src/calendar/koreanLunisolarValidation.ts','dist/calendar/koreanLunisolarValidation.js','.kasi-build/schema.js',
];
const fileHashes=()=>Promise.all(executedPaths.map(async path=>({path,sha256:sha(await readFile(join(repo,path)))})));
async function protect(candidateDirectory,outputDirectory){
  const privateRoot=await realpath(join(repo,'.private')),input=await realpath(resolve(candidateDirectory)),out=resolve(outputDirectory);
  assert.ok(inside(privateRoot,input)&&inside(privateRoot,out),'Use a private candidate and a fresh private output');
  assert.equal(await realpath(dirname(out)),dirname(out));await assert.rejects(()=>lstat(out),error=>error.code==='ENOENT');
  const dirs=new Map([['providedCandidate',input],['candidateA',await realpath(join(privateRoot,'kasi-research-1950-2026-fe84ab4-a'))],['candidateB',await realpath(join(privateRoot,'kasi-research-1950-2026-fe84ab4-b'))],['completedInput',await realpath(join(privateRoot,'kasi-local-1950-2026/monthly-xml'))],['boundarySupplement',await realpath(join(privateRoot,'kasi-2027-boundary-00379e9-20261111-b'))]]),before=new Map(),cache=new Map();
  for(const [name,path]of dirs){assert.ok(out!==path&&!inside(path,out)&&!inside(out,path),'Output must not overlap preserved input');if(!cache.has(path))cache.set(path,fingerprint(await inventory(path)));before.set(name,cache.get(path));}
  for(const [name,pin]of Object.entries(treePins))assert.equal(before.get(name),pin,'Independent '+name+' pin changed');
  assert.equal(sha(await readFile(join(dirs.get('completedInput'),'export.json'))),exportPin);
  const loaded=await loadCandidate(input,BASELINE_MANIFEST_SHA256);await loadCandidate(dirs.get('candidateB'),BASELINE_MANIFEST_SHA256);
  await loadKasi2027BoundarySupplement({directory:dirs.get('boundarySupplement'),expectedSupplementSha256:supplementPin,expectedBaseManifestSha256:BASELINE_MANIFEST_SHA256});
  return {input,out,dirs,before,loaded};
}
async function unchanged(state){const cache=new Map();for(const [name,path]of state.dirs){if(!cache.has(path))cache.set(path,fingerprint(await inventory(path)));assert.equal(cache.get(path),state.before.get(name),name+' changed');}}
function offline(){
  const originals={fetch:globalThis.fetch,connect:net.Socket.prototype.connect,httpRequest:http.request,httpGet:http.get,httpsRequest:https.request,httpsGet:https.get,tlsConnect:tls.connect};let attempts=0;
  const deny=()=>{attempts++;throw Error('OFFLINE_M3_SYNTHESIS_NETWORK_DENIED');};
  globalThis.fetch=deny;net.Socket.prototype.connect=deny;http.request=deny;http.get=deny;https.request=deny;https.get=deny;tls.connect=deny;
  assert.throws(()=>globalThis.fetch('https://invalid.example'),/OFFLINE_M3_SYNTHESIS_NETWORK_DENIED/);assert.throws(()=>net.Socket.prototype.connect.call({},443,'invalid.example'),/OFFLINE_M3_SYNTHESIS_NETWORK_DENIED/);const probes=attempts;
  return {probes,check(){assert.equal(attempts,probes,'The product made an unexpected network request');},restore(){globalThis.fetch=originals.fetch;net.Socket.prototype.connect=originals.connect;http.request=originals.httpRequest;http.get=originals.httpGet;https.request=originals.httpsRequest;https.get=originals.httpsGet;tls.connect=originals.tlsConnect;}};
}

const roles=['year','month','day','hour'];
const categories=['dailyCases','jieBeforeAtAfterCases','calendarBoundaryCases','pre18BoundaryCases'];
const statuses=['RESOLVED_UNDER_POLICY','DEFERRED_MIXED_EVIDENCE','DEFERRED_EFFECT_POLICY_REQUIRED','OUTSIDE_POLICY_SCOPE','NEEDS_DATA'];
const conditionIds=['DECLINING_SEASON','DAY_ROOT_ABSENT','ALL_RESOURCE_LOCATIONS_ABSENT','VISIBLE_PEERS_ALL_UNROOTED','ADVERSE_DIRECTION_LOCATIONS_PRESENT','NO_VISIBLE_FIVE_COMBINATION','NO_RAW_BRANCH_PAIR','NO_MULTI_MEMBER_TRIAD'];
const effectIds=['ROOT_EFFICACY','RESOURCE_SUPPORT_EFFICACY','NATAL_INTERACTION_EFFECT','DRAIN_CONSUME_CONTROL_EFFICACY'];
const supportDecisions=['NO_HOLD_BY_THIS_RULE','OUT_OF_SCOPE_INTERACTION','SUPPORT_HELD_UNDER_SELECTED_RULE','ROOTED_COMBINATION_EFFECT_UNRESOLVED'];
const zero=keys=>Object.fromEntries(keys.map(key=>[key,0]));
function counts(){return {...zero(categories),inputPairs:0,productCalls:0,birthM1Calls:0,m2DerivationsContract:0,parentCandidates:0,researchPaths:0,statuses:zero(statuses),conclusions:{WEAK_UNDER_SELECTED_POLICY:0,NO_CONCLUSION:0},missingConditions:zero(conditionIds),materialEffects:zero(effectIds),surfaceResources:0,hiddenResources:0,supportDecisions:zero(supportDecisions),surfaceResourceAbsentParents:0,dayRoots:{PRESENT_UNDER_POLICY:0,ABSENT_UNDER_POLICY:0},seasonalAlternatives:0,bConditionalParents:0,twoNatalParentRequests:0,surfaceTargets:0,rootMatches:0,sourcePolicyConflicts:0,unsupportedPolicyResults:0,referenceLinks:0,explanationPaths:0,semanticComparisons:0,errors:0,incomplete:0};}
function increment(value,key,subkey){if(subkey===undefined){assert.ok(Object.hasOwn(value,key),key);value[key]++;}else{assert.ok(Object.hasOwn(value[key],subkey),key+'.'+subkey);value[key][subkey]++;}}
function finite(value,path='counts'){for(const [key,item]of Object.entries(value))if(item&&typeof item==='object')finite(item,path+'.'+key);else assert.ok(Number.isSafeInteger(item)&&item>=0,path+'.'+key);}

// This independent oracle encodes the accepted project decision table with literal pairs and
// conditions. It does not call the synthesis resolver, its conditions, or combination helpers.
const mate={甲:'己',己:'甲',乙:'庚',庚:'乙',丙:'辛',辛:'丙',丁:'壬',壬:'丁',戊:'癸',癸:'戊'};
const adverseKinds=['DAY_MASTER_GENERATES','DAY_MASTER_CONTROLS','TARGET_CONTROLS_DAY_MASTER'];
function oracle(structural,roots,seasonal,alternative){
  const groups=structural.directionalGroups,resources=groups.TARGET_GENERATES_DAY_MASTER,peers=groups.SAME.filter(l=>l.locationKind==='VISIBLE_STEM');
  const adverse=adverseKinds.flatMap(kind=>groups[kind]),visible=roots.targets.map(t=>t.target),pairs=[];
  for(let a=0;a<visible.length;a++)for(let b=a+1;b<visible.length;b++)if(mate[visible[a].stem]===visible[b].stem)pairs.push([visible[a].locationId,visible[b].locationId]);
  const triads=structural.relationContext.triads.filter(t=>t.members.filter(member=>member.pillarIndices.length>0).length>=2);
  const flags={DECLINING_SEASON:alternative===null?null:['XIU','QIU','SI'].includes(alternative.seasonalState),DAY_ROOT_ABSENT:roots.targets[2].chartRootPresence==='ABSENT_UNDER_POLICY',ALL_RESOURCE_LOCATIONS_ABSENT:resources.length===0,VISIBLE_PEERS_ALL_UNROOTED:peers.every(peer=>roots.targets.find(t=>t.target.locationId===peer.locationId).chartRootPresence==='ABSENT_UNDER_POLICY'),ADVERSE_DIRECTION_LOCATIONS_PRESENT:adverse.length>0,NO_VISIBLE_FIVE_COMBINATION:pairs.length===0,NO_RAW_BRANCH_PAIR:structural.relationContext.pairs.length===0,NO_MULTI_MEMBER_TRIAD:triads.length===0};
  const hasSupport=!flags.DAY_ROOT_ABSENT||!flags.ALL_RESOURCE_LOCATIONS_ABSENT,hasInteraction=!flags.NO_VISIBLE_FIVE_COMBINATION||!flags.NO_RAW_BRANCH_PAIR||!flags.NO_MULTI_MEMBER_TRIAD;
  let status;if(seasonal.status==='NEEDS_DATA')status='NEEDS_DATA';else if(!flags.DECLINING_SEASON)status='OUTSIDE_POLICY_SCOPE';else if(hasInteraction)status='DEFERRED_EFFECT_POLICY_REQUIRED';else if(hasSupport&&adverse.length>0)status='DEFERRED_MIXED_EVIDENCE';else if(hasSupport)status='DEFERRED_EFFECT_POLICY_REQUIRED';else if(Object.values(flags).some(value=>!value))status='OUTSIDE_POLICY_SCOPE';else status='RESOLVED_UNDER_POLICY';
  return {status,flags,pairs,triads,resources,peers,adverse,material:{ROOT_EFFICACY:!flags.DAY_ROOT_ABSENT,RESOURCE_SUPPORT_EFFICACY:!flags.ALL_RESOURCE_LOCATIONS_ABSENT,NATAL_INTERACTION_EFFECT:hasInteraction,DRAIN_CONSUME_CONTROL_EFFICACY:adverse.length>0&&hasSupport}};
}
const location=l=>({locationId:l.locationId,pillarRole:l.pillarRole,stem:l.stem,element:l.element,locationKind:l.locationKind,index:l.index,position:l.position,tenGod:l.tenGod});
function reportMeaning(report){return {schemaVersion:report.schemaVersion,templateVersion:report.templateVersion,profileId:report.profileId,title:report.title,scopeNote:report.scopeNote,candidates:report.candidates.map(c=>({candidateRef:c.candidateRef,candidateIndex:c.candidateIndex,pillars:c.pillars,paths:c.paths.map(p=>({id:p.id,pathRef:p.pathRef,templateId:p.templateId,templateVersion:p.templateVersion,status:p.status,conclusion:p.conclusion,seasonalCondition:p.seasonalCondition,summary:p.summary,text:p.text,checkedConditionIds:p.checkedConditionIds,missingSufficientConditions:p.missingSufficientConditions}))}))};}
/** Input-calendar conversion records differ legitimately; their actual evidence is checked separately. */
export function synthesisMeaning(result){
  const selected=result.researchSynthesis;
  return {status:result.status,profileId:result.m1.profile.id,manifestSha256:result.m1.dataset.candidateManifestContentSha256,policies:result.m1.policies,chart:result.m1.chart,upstreamFinalStrength:result.evidence.finalStrength,
    synthesis:{schemaVersion:selected.schemaVersion,resolverVersion:selected.resolverVersion,status:selected.status,policy:{id:selected.policy.id,version:selected.policy.version,dependencies:selected.policy.dependencies},validation:selected.validation,candidates:selected.candidates.map(c=>({id:c.id,candidateRef:c.candidateRef,candidateIndex:c.candidateIndex,dayMaster:c.dayMaster,pillars:c.pillars,paths:c.paths,
      observed:{dayRoot:{id:c.observed.dayRoot.id,chartRootPresence:c.observed.dayRoot.chartRootPresence,matchRefs:c.observed.dayRoot.branches.flatMap(b=>b.matches.map(m=>m.id))},visiblePeers:c.observed.visiblePeers.map(p=>({location:location(p.location),rootTargetRef:p.rootTargetRef,rootPresence:p.rootPresence})),hiddenPeers:c.observed.hiddenPeers.map(location),resources:{visible:c.observed.resources.visible.map(location),hidden:c.observed.resources.hidden.map(location),surfaceDecisions:c.observed.resources.surfaceDecisions.map(r=>({id:r.id,resource:location(r.resource),rootPresence:r.rootPresence,decision:r.selectedRuleDecision,reasons:r.decisionReasons,partners:r.combinationPartners.map(p=>({id:p.id,partner:location(p.partner),roleDistance:p.roleDistance,adjacent:p.adjacent,competingResourceLocationRefs:p.competingResourceLocationRefs}))}))},directionalGroups:Object.fromEntries(Object.entries(c.observed.directionalGroups).map(([kind,values])=>[kind,values.map(location)])),interactions:{visibleFiveCombinations:c.observed.interactions.visibleFiveCombinations.map(p=>[location(p.left),location(p.right)]),rawBranchPairs:c.observed.interactions.rawBranchPairs,multiMemberTriads:c.observed.interactions.multiMemberTriads,effectStatus:c.observed.interactions.effectStatus}}}))},report:reportMeaning(result.researchReport)};
}
function referenceCheck(node,known,counter){
  const groups={inputEvidenceRefs:'evidence',inputFactRefs:'facts',inputMemberRefs:'members',pillarRefs:'pillars',rootJudgmentRefs:'roots',rootMatchRefs:'matches',supportJudgmentRefs:'support',seasonalJudgmentRefs:'seasonal',seasonalAlternativeRefs:'alternatives',ruleRefs:'rules',policyRefs:'policies',sourceRefs:'sources',calculationSourceRefs:'calendar'};
  for(const [key,registry]of Object.entries(groups))if(Object.hasOwn(node,key)){
    const refs=node[key];assert.ok(Array.isArray(refs)&&Object.keys(refs).length===refs.length,key+' dense');assert.equal(new Set(refs).size,refs.length,key+' unique');
    for(const id of refs){assert.ok(known[registry].has(id),key+' unresolved '+id);increment(counter,'referenceLinks');}
  }
}
function checkResult(result,counter,samples,calendarById){
  validateLocalM3EvidenceResult(result);validateLocalM3LimitedSynthesis(result.researchSynthesis,{evidence:result.evidence,root:result.root,support:result.support,seasonal:result.seasonal});
  const selected=result.researchSynthesis;
  assert.equal(result.status,'EVIDENCE_ONLY');assert.equal(selected.status,'ASSESSED_UNDER_RESEARCH_POLICY');assert.equal(selected.policy.id,M3_SYNTHESIS_PROFILE_ID);assert.equal(selected.policy.version,'0.1.0');
  assert.deepEqual(selected.policy.dependencies,[{kind:'m2Profile',id:M2_LOCAL_PROFILE_ID,version:'1'},{kind:'m3Profile',id:M3_LOCAL_PROFILE_ID,version:'0.1.0'},{kind:'seasonal',id:M3_SEASONAL_SILI_POLICY_ID,version:'0.2.0'},{kind:'root',id:M3_ROOT_POLICY_ID,version:'0.1.0'},{kind:'support',id:M3_SUPPORT_POLICY_ID,version:'0.1.0'}]);
  assert.equal(result.m1.dataset.candidateManifestContentSha256,BASELINE_MANIFEST_SHA256);assert.deepEqual(result.executionCounts,{birthM1Calls:1,m2Derivations:1});
  for(const layer of [result.evidence,result.root,result.support])assert.equal(layer.finalStrength.status,'NOT_IMPLEMENTED');
  assert.equal(result.root.rootEfficacy,'NOT_EVALUATED');assert.equal(result.support.totalSupportEfficacy,'NOT_EVALUATED');
  for(const v of [result.validation,selected.validation]){assert.equal(v.m3FinalInterpretationGate,'BLOCKED_UNCHANGED');assert.equal(v.g0Receipt,null);assert.equal(v.g1P2Promotion,false);assert.equal(v.predictiveValidity,'NOT_CLAIMED');}
  const expectedCalendar=new Map([...result.m1.evidence.appliedJie,result.m1.evidence.yearBoundary].map(e=>['KASI_OPENAPI_RESPONSE:'+e.sourceRef+':'+e.original.date+':'+e.original.termCode,e]));
  const conversion=result.m1.evidence.dateConversion;expectedCalendar.set('KASI_OPENAPI_RESPONSE_DATE:'+conversion.sourceRef+':'+conversion.observed.solarDate,conversion);
  for(const item of result.seasonal.candidates)for(const id of item.judgment.nextSili?.sourceIds??[]){const record=calendarById.get(id);assert.ok(record);const {id:ignored,...evidence}=record;expectedCalendar.set(id,evidence);}
  for(const source of selected.sources)if(source.kind==='CALENDAR_API'){assert.ok(expectedCalendar.has(source.id),'Source outside this birth and its selected ending Sili');assert.deepEqual(source.evidence,expectedCalendar.get(source.id));assert.equal(source.rightsReview,'UNVERIFIED');}
  const globalKnown={rules:new Set(selected.rules.map(r=>r.id)),policies:new Set([M3_SYNTHESIS_PROFILE_ID,M3_LOCAL_PROFILE_ID,M3_ROOT_POLICY_ID,M3_SUPPORT_POLICY_ID,M3_SEASONAL_SILI_POLICY_ID,result.facts.policyBundle.id,...Object.values(result.facts.policyBundle.policies).map(p=>p.id)]),sources:new Set(selected.sources.map(s=>s.id)),calendar:new Set(expectedCalendar.keys())};
  assert.equal(selected.candidates.length,result.m1.chart.candidates.length);assert.equal(result.researchReport.candidates.length,selected.candidates.length);
  if(selected.candidates.length===2)increment(counter,'twoNatalParentRequests');
  for(let i=0;i<selected.candidates.length;i++){
    const candidate=selected.candidates[i],ref='chart.candidates['+i+']',structural=result.evidence.candidates[i],roots=result.root.candidates[i],support=result.support.candidates[i],seasonal=result.seasonal.candidates[i].judgment,facts=result.facts.candidates[i];
    assert.equal(candidate.candidateRef,ref);assert.equal(candidate.candidateIndex,i);assert.equal(candidate.dayMaster,result.m1.chart.candidates[i].day.stem);
    assert.deepEqual(candidate.pillars.map(p=>p.stem+p.branch),roles.map(role=>result.m1.chart.candidates[i][role].stem+result.m1.chart.candidates[i][role].branch));
    const members=new Set(facts.facts.filter(f=>f.kind==='HIDDEN_STEMS').flatMap(f=>f.value.members.map(m=>m.id))),locations=new Set([...roots.targets.map(t=>t.target.locationId),...Object.values(structural.directionalGroups).flat().map(l=>l.locationId)]);
    const known={...globalKnown,facts:new Set(facts.facts.map(f=>f.id)),evidence:new Set(structural.evidence.map(e=>e.id)),members,pillars:new Set(roles.map(role=>ref+'.'+role)),roots:new Set(roots.targets.map(t=>t.id)),matches:new Set(roots.targets.flatMap(t=>t.branches.flatMap(b=>b.matches.map(m=>m.id)))),support:new Set(support.resources.map(r=>r.id)),seasonal:new Set([seasonal.id]),alternatives:new Set(seasonal.alternatives.map(a=>a.id))};
    const allEvidence=new Set([...known.evidence,...known.roots,...known.alternatives,...known.seasonal,...locations]);
    referenceCheck(candidate,known,counter);assert.deepEqual(candidate.observed.dayRoot,roots.targets[2]);assert.deepEqual(candidate.observed.directionalGroups,structural.directionalGroups);assert.deepEqual(candidate.observed.resources.surfaceDecisions,support.resources);assert.deepEqual(candidate.observed.interactions.rawBranchPairs,structural.relationContext.pairs);
    increment(counter,'parentCandidates');increment(counter,'dayRoots',roots.targets[2].chartRootPresence);counter.surfaceTargets+=roots.targets.length;counter.rootMatches+=known.matches.size;
    counter.surfaceResources+=support.resources.length;counter.hiddenResources+=structural.directionalGroups.TARGET_GENERATES_DAY_MASTER.filter(l=>l.locationKind==='HIDDEN_STEM').length;
    if(!support.resources.length)increment(counter,'surfaceResourceAbsentParents');for(const resource of support.resources)increment(counter,'supportDecisions',resource.selectedRuleDecision);
    counter.seasonalAlternatives+=seasonal.alternatives.length;if(seasonal.status==='AMBIGUOUS'){increment(counter,'bConditionalParents');assert.equal(seasonal.alternatives.length,2);}
    const alternatives=seasonal.alternatives.length?seasonal.alternatives:[null];assert.equal(candidate.paths.length,alternatives.length);
    const report=result.researchReport.candidates[i];assert.equal(report.candidateRef,ref);assert.equal(report.paths.length,candidate.paths.length);
    for(let j=0;j<candidate.paths.length;j++){
      const path=candidate.paths[j],alternative=alternatives[j],expected=oracle(structural,roots,seasonal,alternative);
      assert.equal(path.parentCandidateRef,ref);assert.equal(path.pathIndex,j);assert.equal(path.status,expected.status);assert.equal(path.conclusion,expected.status==='RESOLVED_UNDER_POLICY'?'WEAK_UNDER_SELECTED_POLICY':null);
      assert.equal(path.parentMonthCondition,structural.monthContext.boundarySide);assert.equal(path.seasonalAlternativeRef,alternative?.id??null);assert.deepEqual(path.seasonalAlternativeRefs,alternative?[alternative.id]:[]);
      assert.deepEqual(path.conditions.map(c=>[c.id,c.satisfied]),Object.entries(expected.flags));assert.deepEqual(path.missingSufficientConditions,Object.entries(expected.flags).filter(([,value])=>value!==true).map(([id])=>id));
      assert.deepEqual(path.supportingEvidence,path.conditions.filter(c=>c.satisfied===true));assert.deepEqual(path.counterEvidence,path.conditions.filter(c=>c.satisfied===false));assert.deepEqual(path.unknownEvidence,path.conditions.filter(c=>c.satisfied===null));
      for(const condition of path.conditions){assert.ok(Array.isArray(condition.evidenceRefs));for(const id of condition.evidenceRefs)assert.ok(allEvidence.has(id),'Foreign condition evidence '+id);}
      for(const id of path.appliedRuleIds)assert.ok(known.rules.has(id));for(const effect of path.importantUnresolvedEffects){assert.equal(effect.status,'NOT_EVALUATED');assert.equal(effect.material,expected.material[effect.code]);if(effect.material)increment(counter,'materialEffects',effect.code);}
      if(path.status==='RESOLVED_UNDER_POLICY'){assert.ok(path.conditions.every(c=>c.satisfied));assert.ok(path.importantUnresolvedEffects.every(effect=>!effect.material));}
      referenceCheck(path,known,counter);increment(counter,'researchPaths');increment(counter,'statuses',path.status);increment(counter,'conclusions',path.conclusion??'NO_CONCLUSION');for(const id of path.missingSufficientConditions)increment(counter,'missingConditions',id);
      const view=report.paths[j];assert.equal(view.pathRef,path.id);assert.equal(view.candidateRef,ref);assert.equal(view.status,path.status);assert.equal(view.conclusion,path.conclusion);referenceCheck(view,known,counter);increment(counter,'explanationPaths');
      assert.ok(typeof view.text==='string'&&view.text.length>0);assert.notEqual(view.conclusion,'BALANCED');
      if(!samples[path.status])samples[path.status]={inputNature:'FICTIONAL_DATE_REQUEST_NOT_PERSONAL_RECORD',date:result.m1.input.gregorianDate,time:result.m1.input.time,policies:result.m1.policies,candidateIndex:i,pillars:candidate.pillars.map(p=>p.stem+p.branch),seasonalCondition:path.seasonalCondition,seasonalState:path.seasonalState,status:path.status,conclusion:path.conclusion,missingSufficientConditions:path.missingSufficientConditions};
    }
  }
}
const pilotItem=item=>item.category==='dailyCases'?(item.minute.slice(8,10)==='20'||item.minute.startsWith('1996-12-29')):item.minute.startsWith('2026-');

export async function runLimitedSynthesisAcceptance(candidateDirectory,outputDirectory,{pilot=false}={}){
  assert.equal(typeof pilot,'boolean');assert.match(process.versions.node,/^22\./,'Keep the fixed Node22 runtime');
  const guard=offline();let removedKeyCount=0;for(const name of Object.keys(process.env))if(/KASI|API_KEY|SERVICE_KEY|DATAGO/i.test(name)){delete process.env[name];removedKeyCount++;}
  try{
    const startedAt=new Date().toISOString(),codeSha=git(['rev-parse','HEAD']),workingTreeDirty=git(['status','--porcelain']).length>0,beforeFiles=await fileHashes(),state=await protect(candidateDirectory,outputDirectory);
    const {candidate,index}=state.loaded,chart=createLocalChartProfile(state.loaded,{profileId:MODERN_PROFILE_ID,expectedManifestSha256:BASELINE_MANIFEST_SHA256}),context=getLocalChartEventContext(chart),calendarById=new Map(context.evidence.map(e=>[e.id,e]));
    let actualM1Calls=0;const spy={...chart,calculate(request){actualM1Calls++;return chart.calculate(request);}},profile=createLocalM3EvidenceProfile(spy,{synthesisProfileId:M3_SYNTHESIS_PROFILE_ID,contextProfile:chart}),contexts=new Map();
    for(let year=1989;year<=2026;year++)contexts.set(year,chart.eventsForYear(year));
    const grid=counts(),additional=counts(),samples={},hashes={gregorian:createHash('sha256'),lunar:createHash('sha256')};let peakHeapUsed=0,peakRss=0;
    const memory=()=>{const m=process.memoryUsage();peakHeapUsed=Math.max(peakHeapUsed,m.heapUsed);peakRss=Math.max(peakRss,m.rss);};memory();
    const calculate=(request,counter=additional)=>{const before=actualM1Calls,value=profile.calculate(request);assert.equal(actualM1Calls-before,1);counter.productCalls++;counter.birthM1Calls++;counter.m2DerivationsContract++;checkResult(value,counter,samples,calendarById);return value;};
    const toLunar=row=>({lunarYear:row.lunarYear,lunarMonth:row.lunarMonth,lunarDay:row.lunarDay,leap:row.leap});
    for(const generator of [modernExplanationGrid(candidate,contexts),pre18BoundaryGrid(context)])for(const item of generator){
      if(pilot&&!pilotItem(item))continue;
      const date=item.minute.slice(0,10),time=item.minute.slice(11),row=index.fromGregorianDate(date).value;assert.ok(row);
      const g=calculate({calendar:'GREGORIAN',date,time,policies:item.policy},grid),l=calculate({calendar:'KOREAN_LUNAR',lunarDate:toLunar(row),time,policies:item.policy},grid);
      assert.equal(g.m1.input.gregorianDate,date);assert.equal(l.m1.input.gregorianDate,date);assert.equal(g.m1.evidence.dateConversion.method,'GREGORIAN_WITH_API_OBSERVED_DATE_EVIDENCE');assert.equal(l.m1.evidence.dateConversion.method,'API_OBSERVED_DATE_INDEX');
      const gm=synthesisMeaning(g),lm=synthesisMeaning(l);assert.deepEqual(gm,lm);for(const [name,meaning]of [['gregorian',gm],['lunar',lm]])hashes[name].update(canonical({category:item.category,policy:item.policy,meaning})+'\n');
      increment(grid,item.category);increment(grid,'inputPairs');increment(grid,'semanticComparisons');
      if(item.category==='pre18BoundaryCases'&&item.delta===0){assert.equal(g.m1.chart.candidates.length,1);assert.equal(g.researchSynthesis.candidates[0].paths.length,2);}
      if(grid.inputPairs%250===0){memory();console.error('M3_SYNTHESIS_PROGRESS',JSON.stringify({pairs:grid.inputPairs,parents:grid.parentCandidates,paths:grid.researchPaths,statuses:grid.statuses,heapUsed:process.memoryUsage().heapUsed}));}
    }
    if(!pilot){assert.equal(grid.inputPairs,49799);for(const [key,value]of Object.entries({dailyCases:13879,jieBeforeAtAfterCases:5472,calendarBoundaryCases:28624,pre18BoundaryCases:1824}))assert.equal(grid[key],value);}else for(const category of categories)assert.ok(grid[category]>0);
    const policies=DAY_ROLLOVER_POLICIES.flatMap(dayRollover=>HOUR_STEM_REFERENCE_POLICIES.map(hourStemReference=>({clockPolicyId:MODERN_CLOCK_POLICY_ID,dayRollover,hourStemReference}))),request=(date,time='12:00',policy=policies[0])=>({calendar:'GREGORIAN',date,time,policies:policy});
    const extras={weakExamplePolicyPairs:0,literatureNearDateCounterexamples:0,allYearReplayComparisons:0,legacyProductCalls:0,legacyFullComparisons:0,optionOffByteComparisons:0,mutationIsolation:0,bBoundaryTriples:0,standaloneReuses:0,negativeLoaders:0,conflictingProfileRejections:0};
    // Fixed independent actual-date expectation; this is not a source-authenticated prediction.
    const weakRow=index.fromGregorianDate('1996-12-29').value;assert.ok(weakRow);
    for(const policy of policies){
      const g=calculate(request('1996-12-29','00:30',policy)),l=calculate({calendar:'KOREAN_LUNAR',lunarDate:toLunar(weakRow),time:'00:30',policies:policy});assert.deepEqual(synthesisMeaning(g),synthesisMeaning(l));
      for(const value of [g,l]){assert.deepEqual(roles.map(role=>value.m1.chart.candidates[0][role].stem+value.m1.chart.candidates[0][role].branch),['丙子','庚子','庚子','丙子']);assert.equal(value.researchSynthesis.candidates[0].paths[0].conclusion,'WEAK_UNDER_SELECTED_POLICY');}extras.weakExamplePolicyPairs++;
    }
    // Separately explored actual dates do NOT reproduce the classical four-identical-pillar
    // illustrations. Their actual month and unresolved interaction must prevent that shortcut.
    for(const [date,time,pillars]of [['2011-04-06','06:00',['辛卯','壬辰','辛卯','辛卯']],['2016-09-11','16:00',['丙申','丁酉','丙申','丙申']]]){
      const row=index.fromGregorianDate(date).value;assert.ok(row);
      const g=calculate(request(date,time)),l=calculate({calendar:'KOREAN_LUNAR',lunarDate:toLunar(row),time,policies:policies[0]});assert.deepEqual(synthesisMeaning(g),synthesisMeaning(l));
      for(const value of [g,l]){assert.deepEqual(value.researchSynthesis.candidates[0].pillars.map(p=>p.stem+p.branch),pillars);assert.equal(value.researchSynthesis.candidates[0].paths[0].status,'DEFERRED_EFFECT_POLICY_REQUIRED');assert.equal(value.researchSynthesis.candidates[0].paths[0].conclusion,null);}extras.literatureNearDateCounterexamples++;
    }
    const legacySettings={m2ProfileId:M2_LOCAL_PROFILE_ID,m3ProfileId:M3_LOCAL_PROFILE_ID,seasonalPolicyId:M3_SEASONAL_SILI_POLICY_ID,rootPolicyId:M3_ROOT_POLICY_ID,supportPolicyId:M3_SUPPORT_POLICY_ID,contextProfile:chart},legacy=createLocalM3EvidenceProfile(spy,legacySettings),none=createLocalM3EvidenceProfile(spy,{m2ProfileId:M2_LOCAL_PROFILE_ID,m3ProfileId:M3_LOCAL_PROFILE_ID});
    const legacyCalculate=(p,req)=>{const before=actualM1Calls,value=p.calculate(req);assert.equal(actualM1Calls-before,1);extras.legacyProductCalls++;validateLocalM3EvidenceResult(value);return value;};
    for(let year=1989;year<=2026;year++){
      const req=request(year+'-01-20','23:30',policies[(year-1989)%4]),old=legacyCalculate(legacy,req),unselected=JSON.stringify(legacyCalculate(none,req)),first=calculate(req),expected=fingerprint(synthesisMeaning(first));
      for(const key of ['m1','facts','evidence','explanation','seasonal','root','rootExplanation','support','supportExplanation','validation','provenance'])assert.deepEqual(first[key],old[key]);extras.legacyFullComparisons++;
      calculate(request((year===2026?1989:2026)+'-07-20','12:00',policies[(year-1988)%4]));const replay=calculate(req);assert.equal(fingerprint(synthesisMeaning(replay)),expected);extras.allYearReplayComparisons++;
      assert.equal(JSON.stringify(legacyCalculate(none,req)),unselected);extras.optionOffByteComparisons++;
      assert.throws(()=>{first.researchSynthesis.candidates[0].paths[0].conclusion='STRONG';},TypeError);
      const forged=structuredClone(first.researchSynthesis);forged.candidates[0].paths[0].conclusion='STRONG';assert.throws(()=>validateLocalM3LimitedSynthesis(forged));
      const report=structuredClone(first.researchReport);report.candidates[0].paths[0].text='보류이므로 중화이며 생조가 확정됩니다.';assert.throws(()=>validateM3LimitedSynthesisExplanation(report,first.researchSynthesis));
      const after=calculate(req);assert.equal(fingerprint(synthesisMeaning(after)),expected);extras.mutationIsolation++;
    }
    for(const event of context.events)if(event.displayedDateTime.startsWith('2026-')&&['LICHUN','LIXIA','LIQIU','LIDONG'].includes(event.term)){
      const values=[...pre18BoundaryGrid({events:[event]})].filter(item=>item.policy.dayRollover===policies[0].dayRollover&&item.policy.hourStemReference===policies[0].hourStemReference).map(item=>calculate(request(item.minute.slice(0,10),item.minute.slice(11))));
      assert.equal(values.length,3);const [before,at,after]=values;assert.deepEqual(before.m1.chart.candidates,at.m1.chart.candidates);assert.deepEqual(at.m1.chart.candidates,after.m1.chart.candidates);assert.deepEqual(before.root,at.root);assert.deepEqual(at.root,after.root);assert.deepEqual(before.support,at.support);assert.deepEqual(at.support,after.support);assert.equal(at.researchSynthesis.candidates.length,1);assert.equal(at.researchSynthesis.candidates[0].paths.length,2);extras.bBoundaryTriples++;
      const beforeM1=actualM1Calls,reused=deriveLocalM3LimitedSynthesis(at.evidence,{synthesisProfileId:M3_SYNTHESIS_PROFILE_ID,root:at.root,support:at.support,seasonal:at.seasonal});assert.equal(actualM1Calls,beforeM1);assert.deepEqual(reused,at.researchSynthesis);extras.standaloneReuses++;
    }
    for(const settings of [{directory:state.input,expectedManifestSha256:'0'.repeat(64)},{directory:join(repo,'.private','INTENTIONALLY_ABSENT_SYNTHESIS_CANDIDATE'),expectedManifestSha256:BASELINE_MANIFEST_SHA256}]){await assert.rejects(()=>loadLocalChartProfile({...settings,profileId:MODERN_PROFILE_ID}));extras.negativeLoaders++;}
    for(const conflict of [{synthesisProfileId:'AUTO'},{synthesisProfileId:M3_SYNTHESIS_PROFILE_ID,seasonalPolicyId:M3_SEASONAL_POLICY_ID},{synthesisProfileId:M3_SYNTHESIS_PROFILE_ID,rootPolicyId:'AUTO'}]){const before=actualM1Calls;assert.throws(()=>createLocalM3EvidenceProfile(spy,{...conflict,contextProfile:chart}));assert.equal(actualM1Calls,before);extras.conflictingProfileRejections++;}
    for(const counter of [grid,additional]){finite(counter);assert.equal(Object.values(counter.statuses).reduce((a,b)=>a+b,0),counter.researchPaths);assert.equal(Object.values(counter.conclusions).reduce((a,b)=>a+b,0),counter.researchPaths);assert.equal(counter.explanationPaths,counter.researchPaths);assert.equal(counter.productCalls,counter.birthM1Calls);assert.equal(counter.productCalls,counter.m2DerivationsContract);assert.equal(counter.errors,0);assert.equal(counter.incomplete,0);}
    finite(extras);assert.equal(actualM1Calls,grid.productCalls+additional.productCalls+extras.legacyProductCalls);
    for(const status of statuses.filter(status=>status!=='NEEDS_DATA'))assert.ok(grid.statuses[status]+additional.statuses[status]>0,'A real-date branch was not observed: '+status);
    memory();guard.check();await unchanged(state);assert.deepEqual(await fileHashes(),beforeFiles);assert.equal(git(['rev-parse','HEAD']),codeSha);assert.equal(git(['status','--porcelain']).length>0,workingTreeDirty);
    const semanticDigests=Object.fromEntries(Object.entries(hashes).map(([name,hash])=>[name,hash.digest('hex')]));assert.equal(semanticDigests.gregorian,semanticDigests.lunar);
    const summary={schemaVersion:'kasi-m3-limited-synthesis-linkage-acceptance-v1',status:pilot?'PILOT_ONLY_NOT_FULL_ACCEPTANCE':'MODERN_M3_LIMITED_SYNTHESIS_LINKAGE_PASS',inputNature:'ARTIFICIAL_DATE_GRID_NOT_PERSONAL_BIRTH_RECORDS',gridMode:{pilot,pilotIncludesAllExtraPaths:true},profileId:M3_SYNTHESIS_PROFILE_ID,manifestContentSha256:BASELINE_MANIFEST_SHA256,exportSha256:exportPin,preservedTrees:Object.fromEntries(state.before),supplement:{contentSha256:supplementPin,preservationAuditOnly:true,passedToProduct:false},gridCounts:grid,additionalCounts:additional,extras,allActualBirthM1Calls:actualM1Calls,semanticDigests,statusSamples:samples,apiRequests:0,keysUsed:0,networkProbeChecks:guard.probes,allPreservedInputsUnchanged:true,verification:'LITERAL_SELECTED_DECISION_TABLE_AND_ISSUED_INPUT_LINKAGE_NOT_INDEPENDENT_CLASSICAL_OR_PREDICTIVE_ACCURACY',upstreamFinalStrength:'NOT_IMPLEMENTED',m3FinalInterpretationGate:'BLOCKED_UNCHANGED',unverified:['scan/critical edition/rights','independent human or school acceptance of the project generalization','root and relation force, resource transmission and mixed-evidence sufficiency','strong/balanced conclusions, structure/useful gods/fortune','historical and future query expansion, public/default G0 integration']};
    const execution={startedAt,completedAt:new Date().toISOString(),codeSha,workingTreeDirty,node:process.version,processTZ:process.env.TZ??null,resolvedHostTimezone:Intl.DateTimeFormat().resolvedOptions().timeZone,executedFiles:beforeFiles,memory:{peakSampledHeapUsedBytes:peakHeapUsed,peakSampledRssBytes:peakRss,osMaxRssKiB:process.resourceUsage().maxRSS,execArgv:process.execArgv,aggregation:'STREAMED_COUNTS_DIGESTS_AND_ONE_MINIMAL_STATUS_SAMPLE_ONLY'},keysAbsentAtExecution:!Object.keys(process.env).some(k=>/KASI|API_KEY|SERVICE_KEY|DATAGO/i.test(k)),removedKeyCount,command:{executable:process.execPath,arguments:process.argv.slice(1)},summaryContentSha256:fingerprint(summary)};
    await mkdir(state.out,{mode:0o700});await writeFile(join(state.out,'summary.json'),JSON.stringify(summary,null,2)+'\n',{flag:'wx',mode:0o600});await writeFile(join(state.out,'execution.json'),JSON.stringify(execution,null,2)+'\n',{flag:'wx',mode:0o600});console.log(JSON.stringify({summary,execution},null,2));return summary;
  }finally{guard.restore();}
}
if(process.argv[1]&&import.meta.url===pathToFileURL(resolve(process.argv[1])).href){try{const args=process.argv.slice(2);assert.ok(args.length===2||args.length===3&&args[2]==='--pilot','Usage: node scripts/kasi/local-m3-synthesis-verify.mjs <candidateDir> <freshPrivateOutputDir> [--pilot]');await runLimitedSynthesisAcceptance(args[0],args[1],{pilot:args[2]==='--pilot'});}catch(error){console.error(JSON.stringify({status:'M3_LIMITED_SYNTHESIS_ACCEPTANCE_FAILED',message:error.message}));process.exitCode=1;}}
