/** Offline streaming M3 root-presence linkage checks. Artificial births; no external accuracy claim. */
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
import {M2_LOCAL_PROFILE_ID} from './local-chart-facts.mjs';
import {createLocalM3EvidenceProfile,deriveLocalM3RootJudgments,validateLocalM3RootJudgments,validateLocalM3EvidenceResult,M3_LOCAL_PROFILE_ID,M3_ROOT_POLICY_ID,M3_SEASONAL_SILI_POLICY_ID,M3_SEASONAL_POLICY_ID} from './local-m3-evidence.mjs';
import {createLocalLuckProfile,M7_LUCK_POLICY_V01} from './local-luck.mjs';
import {projectLocalLuckResult} from './local-luck-projection.mjs';
import {CALENDAR_PROJECTION_POLICY_V02} from '../../dist/luck/calendarProjectionV02.js';
import {loadKasi2027BoundarySupplement} from './boundary-supplement.mjs';
import {DAY_ROLLOVER_POLICIES} from '../../dist/calendar/dayRollover.js';
import {HOUR_STEM_REFERENCE_POLICIES} from '../../dist/calendar/dayHourPillars.js';

const root=resolve(dirname(fileURLToPath(import.meta.url)),'../..');
const exportPin='7b5584aca339b85c7e54e953c43b672358bda605a478831b6f260df00472e851';
const supplementPin='f6a0e6dd2b169b4e758f8d1326942556c59f569af714adcb36e73824c6ef02b7';
const pins={candidateA:'b2a2560d2d6324554e8bacf4f34e5a788cddabe71e99843b3b6dcb6876a89bed',candidateB:'b143a6cd766a9d0c0e763f93aba1236db68a29c2a5e71a89647e0371dbca6584',completedInput:'82c5a30c679ac743c0c89a0192ce2cf21a42387fd4ad8cbb6847a4db18866567',boundarySupplement:'47fdc994a0eb7834cf99c63bafb6d23121a1aa490b0370485690eefaa149d5c9'};
const git=args=>execFileSync('git',['-c','safe.directory='+root.replaceAll('\\','/'),...args],{cwd:root,encoding:'utf8',stdio:['ignore','pipe','pipe']}).trim();
const inside=(parent,child)=>{const p=relative(parent,child);return p!==''&&!p.startsWith('..')&&!isAbsolute(p);};
const lunar=row=>({lunarYear:row.lunarYear,lunarMonth:row.lunarMonth,lunarDay:row.lunarDay,leap:row.leap});
const files=['scripts/kasi/local-m3-root-verify.mjs','scripts/kasi/local-m3-evidence.mjs','scripts/kasi/local-m3-seasonal-v2-verify.mjs','scripts/kasi/local-chart.mjs','scripts/kasi/local-chart-facts.mjs','scripts/kasi/local-explain-verify.mjs','scripts/kasi/local-luck.mjs','scripts/kasi/local-luck-projection.mjs','scripts/kasi/boundary-supplement.mjs','scripts/kasi/candidate.mjs','scripts/kasi/research.mjs','src/m3/structuralEvidenceV1.ts','dist/m3/structuralEvidenceV1.js','src/m3/rootPresenceV1.ts','dist/m3/rootPresenceV1.js','src/m3/seasonalStateV1.ts','dist/m3/seasonalStateV1.js','src/m3/seasonalStateV2.ts','dist/m3/seasonalStateV2.js','src/domain/hiddenStems.ts','dist/domain/hiddenStems.js','src/luck/luckV01.ts','dist/luck/luckV01.js','src/luck/calendarProjectionV02.ts','dist/luck/calendarProjectionV02.js','src/calendar/koreanLunisolarValidation.ts','dist/calendar/koreanLunisolarValidation.js'];
const fileHashes=()=>Promise.all(files.map(async path=>({path,sha256:sha(await readFile(join(root,path)))})));
async function protect(inputDirectory,outputDirectory){
  const privateRoot=await realpath(join(root,'.private')),input=await realpath(resolve(inputDirectory)),out=resolve(outputDirectory);
  assert.ok(inside(privateRoot,input)&&inside(privateRoot,out));assert.equal(await realpath(dirname(out)),dirname(out));
  await assert.rejects(()=>lstat(out),error=>error.code==='ENOENT','Fresh absent output directory is required before the grid starts');
  const dirs=new Map([['providedCandidate',input],['candidateA',await realpath(join(privateRoot,'kasi-research-1950-2026-fe84ab4-a'))],['candidateB',await realpath(join(privateRoot,'kasi-research-1950-2026-fe84ab4-b'))],['completedInput',await realpath(join(privateRoot,'kasi-local-1950-2026/monthly-xml'))],['boundarySupplement',await realpath(join(privateRoot,'kasi-2027-boundary-00379e9-20261111-b'))]]),before=new Map(),cache=new Map();
  for(const [name,path]of dirs){assert.ok(out!==path&&!inside(path,out)&&!inside(out,path),'Fresh private output must not overlap inputs');if(!cache.has(path))cache.set(path,fingerprint(await inventory(path)));before.set(name,cache.get(path));}
  for(const [name,pin]of Object.entries(pins))assert.equal(before.get(name),pin,'Independently pinned '+name+' changed');
  assert.equal(sha(await readFile(join(dirs.get('completedInput'),'export.json'))),exportPin);
  const loaded=await loadCandidate(input,BASELINE_MANIFEST_SHA256);await loadCandidate(dirs.get('candidateB'),BASELINE_MANIFEST_SHA256);
  await loadKasi2027BoundarySupplement({directory:dirs.get('boundarySupplement'),expectedSupplementSha256:supplementPin,expectedBaseManifestSha256:BASELINE_MANIFEST_SHA256});
  return {input,out,dirs,before,loaded};
}
async function unchanged(state){const cache=new Map();for(const [name,path]of state.dirs){if(!cache.has(path))cache.set(path,fingerprint(await inventory(path)));assert.equal(cache.get(path),state.before.get(name),name+' changed');}}
function offline(){
  const original={fetch:globalThis.fetch,connect:net.Socket.prototype.connect,httpRequest:http.request,httpGet:http.get,httpsRequest:https.request,httpsGet:https.get,tlsConnect:tls.connect};
  let attempts=0;const denied=()=>{attempts++;throw new Error('OFFLINE_M3_ROOT_NETWORK_DENIED');};
  globalThis.fetch=denied;net.Socket.prototype.connect=denied;http.request=denied;http.get=denied;https.request=denied;https.get=denied;tls.connect=denied;
  assert.throws(()=>globalThis.fetch('https://invalid.example'),/OFFLINE_M3_ROOT_NETWORK_DENIED/);assert.throws(()=>net.Socket.prototype.connect.call({},443,'invalid.example'),/OFFLINE_M3_ROOT_NETWORK_DENIED/);const probes=attempts;
  return {probes,check(){assert.equal(attempts,probes,'Product must make no network requests');},restore(){globalThis.fetch=original.fetch;net.Socket.prototype.connect=original.connect;http.request=original.httpRequest;http.get=original.httpGet;https.request=original.httpsRequest;https.get=original.httpsGet;tls.connect=original.tlsConnect;}};
}

// Independent literal 120-cell contract, manually compared with the approved M2 table.
// Columns: 子 丑 寅 卯 辰 巳 午 未 申 酉 戌 亥. '-' means no matching hidden member.
const branchOrder=['子','丑','寅','卯','辰','巳','午','未','申','酉','戌','亥'];
const expectedCells={
  甲:['-','-','甲','乙','乙','-','-','乙','-','-','-','甲'],
  乙:['-','-','甲','乙','乙','-','-','乙','-','-','-','甲'],
  丙:['-','-','丙','-','-','丙','丁','丁','-','-','丁','-'],
  丁:['-','-','丙','-','-','丙','丁','丁','-','-','丁','-'],
  戊:['-','己','戊','-','戊','戊','己','己','戊','-','戊','-'],
  己:['-','己','戊','-','戊','戊','己','己','戊','-','戊','-'],
  庚:['-','辛','-','-','-','庚','-','-','庚','辛','辛','-'],
  辛:['-','辛','-','-','-','庚','-','-','庚','辛','辛','-'],
  壬:['癸','癸','-','-','癸','-','-','-','壬','-','-','壬'],
  癸:['癸','癸','-','-','癸','-','-','-','壬','-','-','壬'],
};
// An independently written display/member-order expectation, not imported from production.
const expectedMembers={子:['癸'],丑:['己','癸','辛'],寅:['甲','丙','戊'],卯:['乙'],辰:['戊','乙','癸'],巳:['丙','庚','戊'],午:['丁','己'],未:['己','丁','乙'],申:['庚','壬','戊'],酉:['辛'],戌:['戊','辛','丁'],亥:['壬','甲']};
const roles=['year','month','day','hour'];
const presence=present=>present?'PRESENT_UNDER_POLICY':'ABSENT_UNDER_POLICY';
const supportKind=god=>['正印','偏印'].includes(god)?'RESOURCE':['比肩','劫財'].includes(god)?'PEER':null;
function counts(){return {dailyCases:0,jieBeforeAtAfterCases:0,calendarBoundaryCases:0,pre18BoundaryCases:0,inputPairs:0,productCalls:0,birthM1Calls:0,m2Derivations:0,parentCandidates:0,surfaceTargets:0,branchAssessments:0,rootLinks:0,matchTypes:{EXACT_STEM:0,SAME_ELEMENT_DIFFERENT_STEM:0},targetPresence:{PRESENT_UNDER_POLICY:0,ABSENT_UNDER_POLICY:0},branchPresence:{PRESENT_UNDER_POLICY:0,ABSENT_UNDER_POLICY:0},dayMasterPresence:{PRESENT_UNDER_POLICY:0,ABSENT_UNDER_POLICY:0},supportStems:0,supportKinds:{RESOURCE:0,PEER:0},supportPresence:{PRESENT_UNDER_POLICY:0,ABSENT_UNDER_POLICY:0},seasonalAlternatives:0,seasonalStatuses:{RESOLVED_UNDER_POLICY:0,AMBIGUOUS:0,NEEDS_DATA:0,POLICY_UNRESOLVED:0},bSameMinuteParents:0,publishedSiliTwoParentRequests:0,m2FactRefs:0,m3EvidenceRefs:0,hiddenMemberRefs:0,ruleRefs:0,policyRefs:0,sourceRefs:0,calculationSourceRefs:0,explanationItems:0,semanticComparisons:0,errors:0,incomplete:0};}

function verifyFiniteCounts(value,path="counts"){for(const [key,item]of Object.entries(value)){const label=path+"."+key;if(item!==null&&typeof item==="object"&&!Array.isArray(item))verifyFiniteCounts(item,label);else assert.ok(Number.isSafeInteger(item)&&item>=0,label+" must be a nonnegative safe integer");}}
const locationMeaning=l=>({locationId:l.locationId,pillarRole:l.pillarRole,pillarRef:l.pillarRef,stem:l.stem,element:l.element,position:l.position,index:l.index,inputMemberRef:l.inputMemberRef,tenGod:l.tenGod});
function rootMeaning(value){
  // Hash position/classification meaning once. Full reference graphs and each input-calendar
  // source's actual evidence are independently checked below, not duplicated in every target hash.
  return {schemaVersion:value.schemaVersion,resolverVersion:value.resolverVersion,status:value.status,policy:{id:value.policy.id,version:value.policy.version,hiddenStemPolicyId:value.policy.hiddenStemPolicyId},
    candidates:value.candidates.map(c=>({candidateRef:c.candidateRef,candidateIndex:c.candidateIndex,dayMaster:c.dayMaster,dayMasterTargetRef:c.dayMasterTargetRef,
      targets:c.targets.map(t=>({id:t.id,target:locationMeaning(t.target),chartRootPresence:t.chartRootPresence,rootEfficacy:t.rootEfficacy,rootStrength:t.rootStrength,
        branches:t.branches.map(b=>({id:b.id,pillarRole:b.pillarRole,pillarRef:b.pillarRef,branch:b.branch,rootPresence:b.rootPresence,examinedMemberRefs:b.examinedMemberRefs,relationEvidenceRefs:b.relationEvidenceRefs,
          matches:b.matches.map(m=>({id:m.id,targetLocationRef:m.targetLocationRef,hidden:locationMeaning(m.hidden),matchType:m.matchType,samePillar:m.samePillar,isMonthBranch:m.isMonthBranch,relationEvidenceRefs:m.relationEvidenceRefs,relationEffect:m.relationEffect}))}))})),
      supportStems:c.supportStems.map(s=>({id:s.id,targetRef:s.targetRef,locationRef:s.location.locationId,tenGod:s.tenGod,supportKind:s.supportKind,chartRootPresence:s.chartRootPresence,supportTransmission:s.supportTransmission})),relatedRelationEvidenceRefs:c.relatedRelationEvidenceRefs})),
    rootEfficacy:value.rootEfficacy,rootStrength:value.rootStrength,finalStrength:value.finalStrength};
}
const explanationMeaning=e=>({schemaVersion:e.schemaVersion,templateVersion:e.templateVersion,status:e.status,scopeNote:e.scopeNote,candidates:e.candidates.map(c=>({candidateRef:c.candidateRef,candidateIndex:c.candidateIndex,items:c.items.map(i=>({id:i.id,templateId:i.templateId,templateVersion:i.templateVersion,judgmentRefs:i.judgmentRefs,text:i.text}))}))});
function seasonalMeaning(value){return {schemaVersion:value.schemaVersion,policy:{id:value.policy.id,version:value.policy.version},candidates:value.candidates.map(c=>{const j=c.judgment;return {candidateRef:c.candidateRef,candidateIndex:c.candidateIndex,judgment:{id:j.id,status:j.status,dayMaster:j.dayMaster,dayMasterElement:j.dayMasterElement,monthBranch:j.monthBranch,appliedJie:j.appliedJie,nextSili:j.nextSili??null,derivedBoundary:j.derivedBoundary??null,season:j.season,seasonalState:j.seasonalState,elementStates:j.elementStates,alternatives:j.alternatives??null},explanation:{schemaVersion:c.explanation.schemaVersion,templateVersion:c.explanation.templateVersion,candidateRef:c.explanation.candidateRef,judgmentRef:c.explanation.judgmentRef,text:c.explanation.text}};})};}
export function rootPresenceMeaning(result){
  return {status:result.status,profileId:result.m1.profile.id,manifestSha256:result.m1.dataset.candidateManifestContentSha256,policies:result.m1.policies,chart:result.m1.chart,
    structural:{status:result.evidence.status,finalStrength:result.evidence.finalStrength},root:rootMeaning(result.root),rootExplanation:explanationMeaning(result.rootExplanation),
    ...(result.seasonal?{seasonal:seasonalMeaning(result.seasonal)}:{})};
}
function checkReferences(value,known,count){
  const groups={inputFactRefs:['facts','m2FactRefs'],inputEvidenceRefs:['evidence','m3EvidenceRefs'],evidenceRefs:['evidence','m3EvidenceRefs'],inputMemberRefs:['members','hiddenMemberRefs'],ruleRefs:['rules','ruleRefs'],policyRefs:['policies','policyRefs'],sourceRefs:['sources','sourceRefs'],calculationSourceRefs:['calculationSources','calculationSourceRefs']};
  for(const [key,[set,counter]]of Object.entries(groups))if(Object.hasOwn(value,key)){
    const refs=value[key];assert.ok(Array.isArray(refs)&&Object.keys(refs).length===refs.length,key+' dense array');assert.equal(new Set(refs).size,refs.length,key+' duplicates');
    for(const id of refs){assert.ok(known[set].has(id),key+' unresolved '+id);count[counter]++;}
  }
}
function checkResult(result,count){
  validateLocalM3EvidenceResult(result);validateLocalM3RootJudgments(result.root,{evidence:result.evidence});
  assert.equal(result.status,'EVIDENCE_ONLY');assert.equal(result.evidence.finalStrength.status,'NOT_IMPLEMENTED');assert.equal(result.validation.m3FinalInterpretationGate,'BLOCKED_UNCHANGED');
  assert.equal(result.m1.dataset.candidateManifestContentSha256,BASELINE_MANIFEST_SHA256);assert.deepEqual(result.executionCounts,{birthM1Calls:1,m2Derivations:1});
  const selected=result.root;assert.equal(selected.status,'RESOLVED_UNDER_POLICY');assert.equal(selected.policy.id,M3_ROOT_POLICY_ID);
  assert.equal(selected.candidates.length,result.m1.chart.candidates.length);assert.equal(selected.candidates.length,result.evidence.candidates.length);
  const actualCalendarEvidence=new Map([...result.m1.evidence.appliedJie,result.m1.evidence.yearBoundary].map(e=>['KASI_OPENAPI_RESPONSE:'+e.sourceRef+':'+e.original.date+':'+e.original.termCode,e]));
  const conversion=result.m1.evidence.dateConversion;actualCalendarEvidence.set('KASI_OPENAPI_RESPONSE_DATE:'+conversion.sourceRef+':'+conversion.observed.solarDate,conversion);
  for(const source of selected.sources){assert.deepEqual(source,result.evidence.sources.find(s=>s.id===source.id)??selected.policy.sources.find(s=>s.id===source.id));if(source.kind==='CALENDAR_API'){assert.ok(actualCalendarEvidence.has(source.id));assert.deepEqual(source.evidence,actualCalendarEvidence.get(source.id));assert.equal(source.rightsReview,'UNVERIFIED');}}
  const registries={rules:new Set(selected.rules.map(r=>r.id)),sources:new Set(selected.sources.map(s=>s.id)),policies:new Set([selected.policy.id,result.facts.policyBundle.id,...Object.values(result.facts.policyBundle.policies).map(p=>p.id),M3_LOCAL_PROFILE_ID]),calculationSources:new Set(result.evidence.sources.filter(s=>s.kind==='CALENDAR_API').map(s=>s.id))};
  for(const candidate of selected.candidates){
    const i=candidate.candidateIndex,ref='chart.candidates['+i+']',m2=result.facts.candidates[i],structural=result.evidence.candidates[i],natal=result.m1.chart.candidates[i];
    assert.equal(candidate.candidateRef,ref);assert.equal(candidate.dayMaster,natal.day.stem);assert.equal(candidate.targets.length,4);assert.deepEqual(candidate.targets.map(t=>t.target.pillarRole),roles);
    const hidden=new Map();for(const pillar of m2.pillars)for(const member of m2.facts.find(f=>f.kind==='HIDDEN_STEMS'&&f.value.role===pillar.role).value.members)hidden.set(member.id,member);
    const known={...registries,facts:new Set(m2.facts.map(f=>f.id)),evidence:new Set(structural.evidence.map(e=>e.id)),members:new Set(hidden.keys())};
    const seenLinks=new Set();
    for(const assessment of candidate.targets){
      const target=assessment.target,role=target.pillarRole;assert.equal(target.candidateRef,ref);assert.equal(target.stem,natal[role].stem);assert.equal(target.locationId,ref+'.'+role+'.stem');assert.equal(assessment.branches.length,4);assert.deepEqual(assessment.branches.map(b=>b.pillarRole),roles);
      assert.equal(assessment.rootEfficacy,'NOT_EVALUATED');assert.equal(assessment.rootStrength,'NOT_EVALUATED');checkReferences(assessment,known,count);
      let chartHasRoot=false;
      for(const b of assessment.branches){
        assert.equal(b.branch,natal[b.pillarRole].branch);assert.equal(b.pillarRef,ref+'.'+b.pillarRole);const wanted=expectedCells[target.stem][branchOrder.indexOf(b.branch)];assert.ok(wanted!==undefined);
        assert.deepEqual(b.matches.map(m=>m.hidden.stem),wanted==='-'?[]:[wanted]);assert.equal(b.rootPresence,presence(wanted!=='-'));
        assert.deepEqual(b.examinedMemberRefs,m2.facts.find(f=>f.kind==='HIDDEN_STEMS'&&f.value.role===b.pillarRole).value.members.map(m=>m.id));
        const related=structural.evidence.filter(e=>['BRANCH_RELATION_CONTEXT','TRIAD_MEMBERSHIP_CONTEXT'].includes(e.kind)&&e.pillarRefs.includes(b.pillarRef)).map(e=>e.id);assert.deepEqual(b.relationEvidenceRefs,related);checkReferences(b,known,count);
        for(const match of b.matches){
          const h=match.hidden,key=target.locationId+'|'+h.inputMemberRef;assert.ok(!seenLinks.has(key),'Duplicate target/member link');seenLinks.add(key);
          const actual=hidden.get(h.inputMemberRef),index=expectedMembers[b.branch].indexOf(wanted);assert.ok(actual);assert.equal(actual.stem,h.stem);assert.equal(h.candidateRef,ref);assert.equal(h.pillarRole,b.pillarRole);assert.equal(h.index,index);assert.equal(h.position,index===0?'MAIN_QI':'OTHER');
          assert.equal(match.targetLocationRef,target.locationId);assert.equal(match.matchType,target.stem===wanted?'EXACT_STEM':'SAME_ELEMENT_DIFFERENT_STEM');assert.equal(match.samePillar,role===b.pillarRole);assert.equal(match.isMonthBranch,b.pillarRole==='month');checkReferences(match,known,count);count.matchTypes[match.matchType]++;count.rootLinks++;
        }
        chartHasRoot ||= wanted!=='-';count.branchAssessments++;count.branchPresence[b.rootPresence]++;
      }
      assert.equal(assessment.chartRootPresence,presence(chartHasRoot));count.surfaceTargets++;count.targetPresence[assessment.chartRootPresence]++;if(role==='day')count.dayMasterPresence[assessment.chartRootPresence]++;
    }
    const expectedSupport=m2.pillars.filter(p=>p.role!=='day'&&supportKind(p.visibleTenGod));assert.equal(candidate.supportStems.length,expectedSupport.length);
    for(const support of candidate.supportStems){
      const target=candidate.targets.find(t=>t.id===support.targetRef);assert.ok(target);assert.notEqual(target.target.pillarRole,'day');assert.equal(support.location.locationId,target.target.locationId);assert.equal(support.tenGod,target.target.tenGod);assert.equal(support.supportKind,supportKind(support.tenGod));assert.equal(support.chartRootPresence,target.chartRootPresence);checkReferences(support,known,count);count.supportStems++;count.supportKinds[support.supportKind]++;count.supportPresence[support.chartRootPresence]++;
    }
    const view=result.rootExplanation.candidates[i],judgmentIds=new Set([...candidate.targets.map(t=>t.id),...candidate.supportStems.map(s=>s.id)]);
    assert.equal(view.candidateRef,ref);assert.equal(view.candidateIndex,i);
    for(const item of view.items){assert.equal(item.candidateRef,ref);assert.ok(Array.isArray(item.judgmentRefs)&&item.judgmentRefs.length>0);for(const id of item.judgmentRefs)assert.ok(judgmentIds.has(id),'Explanation must use this parent\'s root/support judgments');checkReferences(item,known,count);assert.ok(item.text.length);count.explanationItems++;}
    checkReferences(candidate,known,count);count.parentCandidates++;
  }
  const explanation=result.rootExplanation;assert.equal(explanation.candidates.length,selected.candidates.length);
  for(const c of explanation.candidates)assert.equal(c.candidateRef,selected.candidates[c.candidateIndex].candidateRef);
  if(result.seasonal){
    assert.equal(result.seasonal.candidates.length,selected.candidates.length);
    for(let i=0;i<selected.candidates.length;i++){const j=result.seasonal.candidates[i].judgment;assert.equal(j.candidateRef,selected.candidates[i].candidateRef);assert.ok(Object.hasOwn(count.seasonalStatuses,j.status),"Unexpected selected seasonal status: "+j.status);count.seasonalStatuses[j.status]++;count.seasonalAlternatives+=j.alternatives?.length??(j.status==='RESOLVED_UNDER_POLICY'?1:0);if(j.status==='AMBIGUOUS'){assert.equal(j.alternatives.length,2);count.bSameMinuteParents++;}}
    if(result.m1.chart.candidates.length===2&&['LICHUN','LIXIA','LIQIU','LIDONG'].includes(result.m1.chart.monthBoundaryTrace.atPublishedBoundary?.term))count.publishedSiliTwoParentRequests++;
  }
}

export async function runRootPresenceAcceptance(candidateDirectory,outputDirectory,{benchmarkPairs=null,boundaryOnly=false,boundaryYears=null}={}){
  assert.ok(benchmarkPairs===null||Number.isInteger(benchmarkPairs)&&benchmarkPairs>=1&&benchmarkPairs<=100);assert.equal(typeof boundaryOnly,'boolean');
  assert.ok(boundaryYears===null||boundaryOnly&&Array.isArray(boundaryYears)&&boundaryYears.length>0&&new Set(boundaryYears).size===boundaryYears.length&&boundaryYears.every(y=>Number.isInteger(y)&&y>=1989&&y<=2026));
  const guard=offline(),removedKeyNames=[];for(const name of Object.keys(process.env))if(/KASI|API_KEY|SERVICE_KEY|DATAGO/i.test(name)){delete process.env[name];removedKeyNames.push(name);}
  try{
    const startedAt=new Date().toISOString(),codeSha=git(['rev-parse','HEAD']),workingTreeDirty=git(['status','--porcelain']).length>0,beforeFiles=await fileHashes(),state=await protect(candidateDirectory,outputDirectory),{candidate,index}=state.loaded;
    const chart=createLocalChartProfile(state.loaded,{profileId:MODERN_PROFILE_ID,expectedManifestSha256:BASELINE_MANIFEST_SHA256}),context=getLocalChartEventContext(chart);let actualM1Calls=0;
    const spy={...chart,calculate(request){actualM1Calls++;return chart.calculate(request);}},settings={contextProfile:chart,m2ProfileId:M2_LOCAL_PROFILE_ID,m3ProfileId:M3_LOCAL_PROFILE_ID,rootPolicyId:M3_ROOT_POLICY_ID};
    const profile=createLocalM3EvidenceProfile(spy,{...settings,seasonalPolicyId:M3_SEASONAL_SILI_POLICY_ID});
    const contexts=new Map();for(let year=1989;year<=2026;year++)contexts.set(year,chart.eventsForYear(year));
    const grid=counts(),additional=counts(),hashes={gregorian:createHash('sha256'),lunar:createHash('sha256')};
    const calculate=(request,counter,p=profile)=>{const before=actualM1Calls,result=p.calculate(request);assert.equal(actualM1Calls-before,1);counter.productCalls++;counter.birthM1Calls++;counter.m2Derivations++;return result;};
    const generators=boundaryOnly?[pre18BoundaryGrid(context,{years:boundaryYears})]:[modernExplanationGrid(candidate,contexts),pre18BoundaryGrid(context)];
    outer:for(const generator of generators)for(const item of generator){
      const date=item.minute.slice(0,10),time=item.minute.slice(11),row=index.fromGregorianDate(date).value;assert.ok(row);
      const g=calculate({calendar:'GREGORIAN',date,time,policies:item.policy},grid),l=calculate({calendar:'KOREAN_LUNAR',lunarDate:lunar(row),time,policies:item.policy},grid);
      for(const value of [g,l])checkResult(value,grid);assert.equal(g.m1.input.gregorianDate,date);assert.equal(l.m1.input.gregorianDate,date);assert.equal(g.m1.evidence.dateConversion.method,'GREGORIAN_WITH_API_OBSERVED_DATE_EVIDENCE');assert.equal(l.m1.evidence.dateConversion.method,'API_OBSERVED_DATE_INDEX');
      const gm=rootPresenceMeaning(g),lm=rootPresenceMeaning(l);assert.deepEqual(gm,lm,'Equivalent calendars must preserve natal, roots, seasonal alternatives and explanation meanings');
      hashes.gregorian.update(canonical({category:item.category,policy:item.policy,meaning:gm})+'\n');hashes.lunar.update(canonical({category:item.category,policy:item.policy,meaning:lm})+'\n');assert.ok(["dailyCases","jieBeforeAtAfterCases","calendarBoundaryCases","pre18BoundaryCases"].includes(item.category)&&Object.hasOwn(grid,item.category),"Unexpected grid category");grid[item.category]++;grid.inputPairs++;grid.semanticComparisons++;
      if(item.category==='pre18BoundaryCases'&&item.delta===0){assert.equal(g.m1.chart.candidates.length,1);assert.equal(g.root.candidates.length,1);assert.equal(g.seasonal.candidates[0].judgment.alternatives.length,2);}
      if(grid.inputPairs%1000===0)console.error('M3_ROOT_PROGRESS',JSON.stringify({pairs:grid.inputPairs,parentCandidates:grid.parentCandidates,surfaceTargets:grid.surfaceTargets,rootLinks:grid.rootLinks,seasonalAlternatives:grid.seasonalAlternatives}));
      if(benchmarkPairs!==null&&grid.inputPairs>=benchmarkPairs)break outer;
    }
    if(benchmarkPairs===null){assert.equal(grid.pre18BoundaryCases,(boundaryYears?.length??38)*48);if(!boundaryOnly){assert.equal(grid.dailyCases,13879);assert.equal(grid.jieBeforeAtAfterCases,5472);assert.equal(grid.calendarBoundaryCases,28624);assert.equal(grid.inputPairs,49799);}else assert.equal(grid.inputPairs,(boundaryYears?.length??38)*48);}
    const extras={rootOnlyComparisons:0,v1Comparisons:0,alternation:0,mutationIsolation:0,negativeLoaders:0,standaloneRootReuses:0,bRootInvarianceTriples:0,independentM7BirthM1Calls:0,independentM7Contexts:0};
    if(benchmarkPairs===null){
      const policies=DAY_ROLLOVER_POLICIES.flatMap(dayRollover=>HOUR_STEM_REFERENCE_POLICIES.map(hourStemReference=>({clockPolicyId:MODERN_CLOCK_POLICY_ID,dayRollover,hourStemReference}))),request=(date,time='12:00',policy=policies[0])=>({calendar:'GREGORIAN',date,time,policies:policy});
      const rootOnly=createLocalM3EvidenceProfile(spy,settings),v1=createLocalM3EvidenceProfile(spy,{...settings,seasonalPolicyId:M3_SEASONAL_POLICY_ID});
      for(let year=1989;year<=2026;year++){
        const req=request(year+'-01-20','23:30',policies[(year-1989)%4]),first=calculate(req,additional),expected=fingerprint(rootPresenceMeaning(first));checkResult(first,additional);
        const alone=calculate(req,additional,rootOnly),old=calculate(req,additional,v1);checkResult(alone,additional);checkResult(old,additional);assert.deepEqual(alone.root,first.root);assert.deepEqual(old.root,first.root);assert.deepEqual(alone.rootExplanation,first.rootExplanation);extras.rootOnlyComparisons++;extras.v1Comparisons++;
        calculate(request((year===2026?1989:2026)+'-07-20'),additional);assert.equal(fingerprint(rootPresenceMeaning(calculate(req,additional))),expected);extras.alternation++;
        assert.throws(()=>{first.root.candidates[0].targets[0].chartRootPresence='MODIFIED';},TypeError);const forged=structuredClone(first.root);forged.candidates[0].targets[0].branches[0].rootPresence='MODIFIED';assert.throws(()=>validateLocalM3RootJudgments(forged,{evidence:first.evidence}));assert.equal(fingerprint(rootPresenceMeaning(calculate(req,additional))),expected);extras.mutationIsolation++;
      }
      // Every new B is a seasonal split, not a new natal chart/root object meaning.
      for(const event of context.events)if(Number(event.displayedDateTime.slice(0,4))===2026&&['LICHUN','LIXIA','LIQIU','LIDONG'].includes(event.term)){
        const [before,at,after]=[...pre18BoundaryGrid({events:[event]})].filter(item=>item.policy.dayRollover===policies[0].dayRollover&&item.policy.hourStemReference===policies[0].hourStemReference).map(item=>calculate(request(item.minute.slice(0,10),item.minute.slice(11)),additional));
        assert.deepEqual(before.m1.chart.candidates,at.m1.chart.candidates);assert.deepEqual(at.m1.chart.candidates,after.m1.chart.candidates);assert.deepEqual(before.root,at.root);assert.deepEqual(at.root,after.root);assert.deepEqual(before.rootExplanation,at.rootExplanation);assert.equal(at.seasonal.candidates[0].judgment.status,'AMBIGUOUS');extras.bRootInvarianceTriples++;
      }
      const baseline=calculate(request('1990-06-01'),additional),expected=fingerprint(baseline.root),luckSpy={...chart,calculate(req){extras.independentM7BirthM1Calls++;return chart.calculate(req);}},luck=createLocalLuckProfile(luckSpy,{contextProfile:chart,luckPolicyId:M7_LUCK_POLICY_V01,m2ProfileId:M2_LOCAL_PROFILE_ID});
      for(const sex of ['MALE','FEMALE']){
        const m7=luck.calculate(request('1990-06-01'),{dayun:{traditionalSex:sex,count:10},seyun:{yearLabel:2026}});extras.independentM7Contexts++;
        for(const projected of [false,true]){if(projected)projectLocalLuckResult(m7,{calendarProjectionPolicyId:CALENDAR_PROJECTION_POLICY_V02,asOfMinute:sex==='MALE'?'2026-01-01T12:00':'2026-11-01T12:00'});const before=actualM1Calls,value=deriveLocalM3RootJudgments(baseline.evidence,{rootPolicyId:M3_ROOT_POLICY_ID});assert.equal(fingerprint(value),expected);assert.equal(actualM1Calls,before);extras.standaloneRootReuses++;}
      }
      for(const options of [{directory:state.input,expectedManifestSha256:'0'.repeat(64)},{directory:join(root,'.private','INTENTIONALLY_ABSENT_ROOT_V1_CANDIDATE'),expectedManifestSha256:BASELINE_MANIFEST_SHA256}]){await assert.rejects(()=>loadLocalChartProfile({...options,profileId:MODERN_PROFILE_ID}));extras.negativeLoaders++;}
    }
    verifyFiniteCounts(grid,"gridCounts");verifyFiniteCounts(additional,"additionalCounts");assert.equal(actualM1Calls,grid.productCalls+additional.productCalls);assert.equal(grid.surfaceTargets,grid.parentCandidates*4);assert.equal(grid.branchAssessments,grid.surfaceTargets*4);assert.equal(extras.independentM7BirthM1Calls,extras.independentM7Contexts);guard.check();await unchanged(state);assert.deepEqual(await fileHashes(),beforeFiles);assert.equal(git(['rev-parse','HEAD']),codeSha);assert.equal(git(['status','--porcelain']).length>0,workingTreeDirty);
    const semanticDigests=Object.fromEntries(Object.entries(hashes).map(([name,hash])=>[name,hash.digest('hex')]));assert.equal(semanticDigests.gregorian,semanticDigests.lunar);
    const summary={schemaVersion:'kasi-m3-root-presence-linkage-acceptance-v1',status:benchmarkPairs!==null?'BENCHMARK_ONLY_NOT_FULL_ACCEPTANCE':boundaryOnly?'NEW_BOUNDARIES_ONLY_NOT_FULL_ACCEPTANCE':'MODERN_M3_ROOT_PRESENCE_LINKAGE_PASS',gridMode:{benchmarkPairs,boundaryOnly,boundaryYears},inputNature:'ARTIFICIAL_GRID_NOT_PERSONAL_BIRTH_RECORDS',rootPolicyId:M3_ROOT_POLICY_ID,manifestContentSha256:BASELINE_MANIFEST_SHA256,exportSha256:exportPin,preservedTrees:Object.fromEntries(state.before),supplement:{contentSha256:supplementPin,preservationAuditOnly:true,passedToProduct:false},gridCounts:grid,additionalCounts:additional,extras,allProductBirthM1Calls:actualM1Calls,semanticDigests,apiRequests:0,keysUsed:0,networkProbeChecks:guard.probes,allPreservedInputsUnchanged:true,verification:'INDEPENDENT_LITERAL_120_ROOT_CELLS_AND_APPROVED_HIDDEN_MEMBER_ORDER_PLUS_ACTUAL_M1_M2_M3_LINKAGE_NOT_TRADITIONAL_OR_PREDICTIVE_CERTIFICATION',rootEfficacy:'NOT_EVALUATED',rootStrength:'NOT_EVALUATED',finalStrength:'NOT_IMPLEMENTED',m3FinalInterpretationGate:'BLOCKED_UNCHANGED',unverified:['scans/critical editions/rights','physical qi or true birth/event seconds','effective roots, strength, relation efficacy, support transmission, fortune','expanded birth/query/historical policy','default/G0 integration']};
    const execution={startedAt,completedAt:new Date().toISOString(),codeSha,workingTreeDirty,node:process.version,processTZ:process.env.TZ??null,resolvedHostTimezone:Intl.DateTimeFormat().resolvedOptions().timeZone,executedFiles:beforeFiles,keysAbsentAtExecution:!Object.keys(process.env).some(k=>/KASI|API_KEY|SERVICE_KEY|DATAGO/i.test(k)),removedKeyNames,command:{executable:process.execPath,arguments:process.argv.slice(1)},summaryContentSha256:fingerprint(summary)};
    await mkdir(state.out,{mode:0o700});await writeFile(join(state.out,'summary.json'),JSON.stringify(summary,null,2)+'\n',{flag:'wx',mode:0o600});await writeFile(join(state.out,'execution.json'),JSON.stringify(execution,null,2)+'\n',{flag:'wx',mode:0o600});console.log(JSON.stringify({summary,execution},null,2));return summary;
  }finally{guard.restore();}
}
if(process.argv[1]&&import.meta.url===pathToFileURL(resolve(process.argv[1])).href){try{const args=process.argv.slice(2);assert.ok(args.length===2,'Usage: node scripts/kasi/local-m3-root-verify.mjs <candidateDir> <freshPrivateOutputDir>');await runRootPresenceAcceptance(args[0],args[1]);}catch(error){console.error('M3_ROOT_ACCEPTANCE_REJECTED',error.code??error.name,error.message);process.exitCode=1;}}
