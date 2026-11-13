/** Bounded offline position-policy linkage. This does not certify formation efficacy or predictions. */
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {readFile,realpath,mkdir,writeFile,lstat} from 'node:fs/promises';
import {execFileSync} from 'node:child_process';
import {dirname,isAbsolute,join,relative,resolve} from 'node:path';
import {fileURLToPath,pathToFileURL} from 'node:url';
import net from 'node:net';import http from 'node:http';import https from 'node:https';import tls from 'node:tls';
import {canonical,fingerprint,sha} from '../../.kasi-build/schema.js';
import {loadCandidate} from './candidate.mjs';
import {inventory} from './research.mjs';
import {loadKasi2027BoundarySupplement} from './boundary-supplement.mjs';
import {createLocalChartProfile,loadLocalChartProfile,getLocalChartEventContext,MODERN_PROFILE_ID,MODERN_CLOCK_POLICY_ID,BASELINE_MANIFEST_SHA256} from './local-chart.mjs';
import {m4PatternGrid} from './local-m4-pattern-verify.mjs';
import {createLocalM3EvidenceProfile,validateLocalM3EvidenceResult,renderLocalM3EvidenceText,M4_POSITION_PROFILE_ID,M4_PATTERN_PROFILE_ID,M3_SEASONAL_SILI_POLICY_ID,M3_SYNTHESIS_PROFILE_ID} from './local-m3-evidence.mjs';
import {validateM4WealthResourcePosition,validateM4WealthResourcePositionExplanation} from '../../dist/m4/wealthResourcePositionV1.js';
import {DAY_ROLLOVER_POLICIES} from '../../dist/calendar/dayRollover.js';
import {HOUR_STEM_REFERENCE_POLICIES} from '../../dist/calendar/dayHourPillars.js';

const repo=resolve(dirname(fileURLToPath(import.meta.url)),'../..');
const git=args=>execFileSync('git',['-c','safe.directory='+repo.replaceAll('\\','/'),...args],{cwd:repo,encoding:'utf8',stdio:['ignore','pipe','pipe']}).trim();
const inside=(parent,child)=>{const p=relative(parent,child);return p!==''&&!p.startsWith('..')&&!isAbsolute(p);};
const exportPin='7b5584aca339b85c7e54e953c43b672358bda605a478831b6f260df00472e851',supplementPin='f6a0e6dd2b169b4e758f8d1326942556c59f569af714adcb36e73824c6ef02b7';
const treePins={candidateA:'b2a2560d2d6324554e8bacf4f34e5a788cddabe71e99843b3b6dcb6876a89bed',candidateB:'b143a6cd766a9d0c0e763f93aba1236db68a29c2a5e71a89647e0371dbca6584',completedInput:'82c5a30c679ac743c0c89a0192ce2cf21a42387fd4ad8cbb6847a4db18866567',boundarySupplement:'47fdc994a0eb7834cf99c63bafb6d23121a1aa490b0370485690eefaa149d5c9'};
const executedPaths=[
 'scripts/kasi/local-m4-position-verify.mjs','scripts/kasi/local-m4-pattern-verify.mjs','src/m4/wealthResourcePositionV1.ts','dist/m4/wealthResourcePositionV1.js','scripts/kasi/local-m3-evidence.mjs','scripts/kasi/local-chart.mjs','scripts/kasi/local-chart-facts.mjs','scripts/kasi/local-explain.mjs','scripts/kasi/local-explain-verify.mjs','scripts/kasi/local-m3-seasonal-v2-verify.mjs','scripts/kasi/candidate.mjs','scripts/kasi/research.mjs','scripts/kasi/boundary-supplement.mjs',
 'src/m4/zhengguanStructureV1.ts','dist/m4/zhengguanStructureV1.js','src/m3/structuralEvidenceV1.ts','dist/m3/structuralEvidenceV1.js','src/m3/limitedSynthesisV1.ts','dist/m3/limitedSynthesisV1.js','src/m3/seasonalStateV2.ts','dist/m3/seasonalStateV2.js','src/domain/hiddenStems.ts','dist/domain/hiddenStems.js','src/domain/tenGods.ts','dist/domain/tenGods.js','src/domain/stemCombinations.ts','dist/domain/stemCombinations.js','src/calendar/fourPillars.ts','dist/calendar/fourPillars.js','src/calendar/monthPillar.ts','dist/calendar/monthPillar.js','.kasi-build/schema.js',
 'src/m3/seasonalStateV1.ts','dist/m3/seasonalStateV1.js','src/m3/rootPresenceV1.ts','dist/m3/rootPresenceV1.js','src/m3/resourceSupportV1.ts','dist/m3/resourceSupportV1.js','src/domain/branchRelations.ts','dist/domain/branchRelations.js','src/domain/triadMemberships.ts','dist/domain/triadMemberships.js','src/calendar/koreanLunisolarValidation.ts','dist/calendar/koreanLunisolarValidation.js',
];
const fileHashes=()=>Promise.all(executedPaths.map(async path=>({path,sha256:sha(await readFile(join(repo,path)))})));
async function protect(candidateDirectory,outputDirectory){
 const privateRoot=await realpath(join(repo,'.private')),input=await realpath(resolve(candidateDirectory)),out=resolve(outputDirectory);
 assert.ok(inside(privateRoot,input)&&inside(privateRoot,out),'Use a private candidate and a fresh private output');
 assert.equal(await realpath(dirname(out)),dirname(out));await assert.rejects(()=>lstat(out),error=>error.code==='ENOENT');
 const dirs=new Map([['providedCandidate',input],['candidateA',await realpath(join(privateRoot,'kasi-research-1950-2026-fe84ab4-a'))],['candidateB',await realpath(join(privateRoot,'kasi-research-1950-2026-fe84ab4-b'))],['completedInput',await realpath(join(privateRoot,'kasi-local-1950-2026/monthly-xml'))],['boundarySupplement',await realpath(join(privateRoot,'kasi-2027-boundary-00379e9-20261111-b'))]]),before=new Map(),cache=new Map();
 for(const[name,path]of dirs){assert.ok(out!==path&&!inside(path,out)&&!inside(out,path),'Output overlaps preserved input');if(!cache.has(path))cache.set(path,fingerprint(await inventory(path)));before.set(name,cache.get(path));}
 for(const[name,pin]of Object.entries(treePins))assert.equal(before.get(name),pin,'Independent '+name+' pin changed');
 assert.equal(sha(await readFile(join(dirs.get('completedInput'),'export.json'))),exportPin);
 const loaded=await loadCandidate(input,BASELINE_MANIFEST_SHA256);await loadCandidate(dirs.get('candidateB'),BASELINE_MANIFEST_SHA256);
 await loadKasi2027BoundarySupplement({directory:dirs.get('boundarySupplement'),expectedSupplementSha256:supplementPin,expectedBaseManifestSha256:BASELINE_MANIFEST_SHA256});
 return {input,out,dirs,before,loaded};
}
async function unchanged(state){const cache=new Map();for(const[name,path]of state.dirs){if(!cache.has(path))cache.set(path,fingerprint(await inventory(path)));assert.equal(cache.get(path),state.before.get(name),name+' changed');}}
function offline(){
 const originals={fetch:globalThis.fetch,connect:net.Socket.prototype.connect,httpRequest:http.request,httpGet:http.get,httpsRequest:https.request,httpsGet:https.get,tlsConnect:tls.connect};let attempts=0;
 const deny=()=>{attempts++;throw Error('OFFLINE_M4_POSITION_NETWORK_DENIED');};globalThis.fetch=deny;net.Socket.prototype.connect=deny;http.request=deny;http.get=deny;https.request=deny;https.get=deny;tls.connect=deny;
 return {check(){assert.equal(attempts,0,'Product attempted network access');},restore(){globalThis.fetch=originals.fetch;net.Socket.prototype.connect=originals.connect;http.request=originals.httpRequest;http.get=originals.httpGet;https.request=originals.httpsRequest;https.get=originals.httpsGet;tls.connect=originals.tlsConnect;}};
}
const categoryNames=['monthlyRepresentativeCases','jieBeforeAtAfterCases','calendarBoundaryCases','pre18BoundaryCases','leapMonthCases'];
const decisionNames=['NOT_APPLICABLE_TO_PATTERN','SOURCE_OR_POLICY_UNRESOLVED','SURFACE_BOTH_NOT_PRESENT','MULTIPLE_PAIR_CONTEXT_REVIEW_REQUIRED','ADJACENT_CONTROL_REVIEW_CONTEXT','DAY_MASTER_SEPARATED_CONTEXT','OFFICER_INTERVENING_CONTEXT','OTHER_SEPARATION_OUT_OF_SELECTED_SCOPE'];
const roles=['year','month','day','hour'];
const primary={clockPolicyId:MODERN_CLOCK_POLICY_ID,dayRollover:'CIVIL_MIDNIGHT',hourStemReference:'SELECTED_DAY_PILLAR'};
const policies=()=>DAY_ROLLOVER_POLICIES.flatMap(dayRollover=>HOUR_STEM_REFERENCE_POLICIES.map(hourStemReference=>({clockPolicyId:MODERN_CLOCK_POLICY_ID,dayRollover,hourStemReference})));
const lunar=row=>({lunarYear:row.lunarYear,lunarMonth:row.lunarMonth,lunarDay:row.lunarDay,leap:row.leap});
const increment=(object,key)=>object[key]=(object[key]??0)+1;
const zero=keys=>Object.fromEntries(keys.map(key=>[key,0]));
const count=()=>({...zero(categoryNames),inputPairs:0,productCalls:0,birthM1Calls:0,parentCandidates:0,patternCandidateStatuses:{},oldFormationStatuses:{},decisions:zero(decisionNames),candidateDecisions:zero(decisionNames),exposures:{},candidateExposures:{},pairGeometries:{},surfaceWealthTargets:0,surfaceResourceTargets:0,visiblePairs:0,parentsWithMultiplePairs:0,parentsWithOnePair:0,parentsWithoutSurfacePair:0,conditionObservations:{},semanticComparisons:0,bBoundaryOneParentProducts:0,referenceLinks:0});

// This independent decision table consumes existing M3/M4 locations. It does not call
// the position resolver or its geometry/exposure helpers to construct an expectation.
function expectedContext(pattern,m3){
 const visible=[...Object.values(m3.directionalGroups).flat().filter(l=>l.locationKind==='VISIBLE_STEM'),m3.visibleDayMaster].sort((a,b)=>roles.indexOf(a.pillarRole)-roles.indexOf(b.pillarRole));
 assert.equal(visible.length,4);assert.equal(new Set(visible.map(l=>l.pillarRole)).size,4);
 const locations=[...Object.values(m3.directionalGroups).flat(),m3.visibleDayMaster];
 const group=gods=>({visible:locations.filter(l=>l.locationKind==='VISIBLE_STEM'&&gods.includes(l.tenGod)),hidden:locations.filter(l=>l.locationKind==='HIDDEN_STEM'&&gods.includes(l.tenGod))});
 const wealth=group(['正財','偏財']),resource=group(['正印','偏印']);
 for(const g of [wealth,resource])assert.ok(g.visible.every(l=>l.pillarRole!=='day'));
 const w=wealth.visible.length,r=resource.visible.length,wt=w+wealth.hidden.length,rt=r+resource.hidden.length;
 const exposureState=!wt&&!rt?'BOTH_ABSENT':!wt?'WEALTH_ABSENT':!rt?'RESOURCE_ABSENT':w&&r?'BOTH_VISIBLE':w?'WEALTH_ONLY_VISIBLE':r?'RESOURCE_ONLY_VISIBLE':'BOTH_HIDDEN_ONLY';
 const pairs=wealth.visible.flatMap(a=>resource.visible.map(b=>{
  const lo=Math.min(roles.indexOf(a.pillarRole),roles.indexOf(b.pillarRole)),hi=Math.max(roles.indexOf(a.pillarRole),roles.indexOf(b.pillarRole));
  const intermediateLocations=visible.filter(l=>roles.indexOf(l.pillarRole)>lo&&roles.indexOf(l.pillarRole)<hi);
  const geometry=hi-lo===1?'ADJACENT':intermediateLocations.length===1&&intermediateLocations[0].pillarRole==='day'?'DAY_MASTER_ONLY_BETWEEN':intermediateLocations.some(l=>l.tenGod==='正官')?'OFFICER_AND_DAY_MASTER_BETWEEN':'OTHER_STEM_AND_DAY_MASTER_BETWEEN';
  return {wealth:a,resource:b,intermediateLocations,geometry};
 }));
 const status=pattern.candidateAssessment.status==='NOT_A_CANDIDATE_UNDER_POLICY'?'NOT_APPLICABLE_TO_PATTERN':pattern.candidateAssessment.status==='SOURCE_OR_POLICY_UNRESOLVED'?'SOURCE_OR_POLICY_UNRESOLVED':!w||!r?'SURFACE_BOTH_NOT_PRESENT':pairs.length>1?'MULTIPLE_PAIR_CONTEXT_REVIEW_REQUIRED':({ADJACENT:'ADJACENT_CONTROL_REVIEW_CONTEXT',DAY_MASTER_ONLY_BETWEEN:'DAY_MASTER_SEPARATED_CONTEXT',OFFICER_AND_DAY_MASTER_BETWEEN:'OFFICER_INTERVENING_CONTEXT',OTHER_STEM_AND_DAY_MASTER_BETWEEN:'OTHER_SEPARATION_OUT_OF_SELECTED_SCOPE'})[pairs[0].geometry];
 return {wealth,resource,pairs,exposureState,status,locations};
}
function sourceMeaning(value,records){
 const dateEvidence=value.m1.evidence.dateConversion,calendar=value.m1.input.calendar;
 assert.ok(['GREGORIAN','KOREAN_LUNAR'].includes(calendar));
 assert.equal(dateEvidence.method,calendar==='GREGORIAN'?'GREGORIAN_WITH_API_OBSERVED_DATE_EVIDENCE':'API_OBSERVED_DATE_INDEX');
 const dateId='KASI_OPENAPI_RESPONSE_DATE:'+dateEvidence.sourceRef+':'+dateEvidence.observed.solarDate;
 const expectedEvents=new Map([...value.m1.evidence.appliedJie,value.m1.evidence.yearBoundary].map(e=>['KASI_OPENAPI_RESPONSE:'+e.sourceRef+':'+e.original.date+':'+e.original.termCode,e]));
 const actualCalendar=records.filter(s=>s.kind==='CALENDAR_API');assert.equal(actualCalendar.length,expectedEvents.size+1);
 for(const source of actualCalendar){assert.equal(source.rightsReview,'UNVERIFIED');if(source.id===dateId){assert.equal(source.meaning,'OBSERVED_DATE_MAPPING_NOT_M2_RULE_SOURCE');assert.deepEqual(source.evidence,dateEvidence);}else{assert.equal(source.meaning,'CALENDAR_DATA_NOT_M2_RULE_SOURCE');assert.deepEqual(source.evidence,expectedEvents.get(source.id));}}
 assert.equal(actualCalendar.filter(s=>s.id===dateId).length,1);
 // Only the independently checked input-route marker is normalized. All actual
 // source data, fingerprints, refs and other metadata remain in the comparison.
 return records.map(s=>s.id===dateId?{...s,evidence:{...s.evidence,method:'VERIFIED_EQUIVALENT_INPUT_ROUTE'}}:s);
}
function meaning(value){
 return {chart:value.m1.chart,policies:value.m1.policies,date:value.m1.input.gregorianDate,time:value.m1.input.time,pattern:{...value.patternAnalysis,sources:sourceMeaning(value,value.patternAnalysis.sources)},patternReport:value.patternReport,position:{...value.wealthResourcePosition,sources:sourceMeaning(value,value.wealthResourcePosition.sources)},report:value.wealthResourcePositionReport};
}
function checkResult(value,counter){
 validateLocalM3EvidenceResult(value);
 const analysis=value.wealthResourcePosition,pattern=value.patternAnalysis;
 validateM4WealthResourcePosition(analysis,{pattern,evidence:value.evidence});
 validateM4WealthResourcePositionExplanation(value.wealthResourcePositionReport,analysis);
 assert.equal(value.schemaVersion,'kasi-local-m4-wealth-resource-position-v1');
 assert.deepEqual(value.executionCounts,{birthM1Calls:1,m2Derivations:1,m4Derivations:1,m4PositionDerivations:1});
 assert.equal(value.status,'EVIDENCE_ONLY');assert.equal(value.validation.finalStrength,'NOT_IMPLEMENTED');
 assert.equal(value.validation.m3FinalInterpretationGate,'BLOCKED_UNCHANGED');assert.equal(value.validation.g0Receipt,null);assert.equal(value.validation.g1P2Promotion,false);
 assert.equal(value.m1.dataset.candidateManifestContentSha256,BASELINE_MANIFEST_SHA256);
 assert.equal(analysis.schemaVersion,'m4-wealth-resource-position-review-v1');assert.equal(analysis.status,'LIMITED_POSITION_REVIEW_ONLY');assert.equal(analysis.profile.id,M4_POSITION_PROFILE_ID);assert.equal(analysis.profile.version,'0.1.0');assert.equal(analysis.upstreamPatternProfile.id,M4_PATTERN_PROFILE_ID);
 assert.equal(analysis.candidates.length,value.m1.chart.candidates.length);assert.equal(pattern.candidates.length,analysis.candidates.length);
 const rules=new Set(analysis.rules.map(x=>x.id)),sourceMap=new Map(analysis.sources.map(x=>[x.id,x])),sources=new Set(sourceMap.keys());
 const policyIds=new Set([M4_POSITION_PROFILE_ID,M4_PATTERN_PROFILE_ID,value.evidence.policy.id,value.facts.policyBundle.id,...Object.values(value.facts.policyBundle.policies).map(p=>p.id)]);
 for(const original of pattern.rules)assert.deepEqual(analysis.rules.find(r=>r.id===original.id),original);
 for(const original of pattern.sources)assert.deepEqual(sourceMap.get(original.id),original);
 for(let i=0;i<analysis.candidates.length;i++){
  const c=analysis.candidates[i],p=pattern.candidates[i],m3=value.evidence.candidates[i],expected=expectedContext(p,m3),ref='chart.candidates['+i+']';
  assert.equal(c.candidateRef,ref);assert.equal(c.candidateIndex,i);assert.equal(c.decision.status,expected.status);assert.equal(c.exposureState,expected.exposureState);
  assert.deepEqual(c.exposure.wealth,expected.wealth);assert.deepEqual(c.exposure.resource,expected.resource);
  assert.equal(c.decision.patternAssessmentRef,p.candidateAssessment.id);assert.deepEqual(c.decision.patternConditionRefs,p.conditions.map(x=>x.id));assert.deepEqual(c.decision.pairRefs,c.pairs.map(x=>x.id));
  assert.deepEqual(c.relatedConditions,p.conditions);assert.deepEqual(c.relatedCombinations,p.surfaceCombinations);assert.deepEqual(c.relatedBranchRelations,p.relations);
  assert.deepEqual(c.relatedTenGodGroups,{hurtingOfficer:p.groups.hurtingOfficer,sevenKillings:p.groups.sevenKillings});
  increment(counter.patternCandidateStatuses,p.candidateAssessment.status);increment(counter.oldFormationStatuses,p.formationAssessment.status);increment(counter.decisions,c.decision.status);increment(counter.exposures,c.exposureState);
  if(p.candidateAssessment.status==='STRUCTURAL_CANDIDATE'){increment(counter.candidateDecisions,c.decision.status);increment(counter.candidateExposures,c.exposureState);}
  const pairIdentity=x=>x.wealth.locationId+'>'+x.resource.locationId;
  assert.equal(c.pairs.length,expected.pairs.length);assert.equal(new Set(c.pairs.map(pairIdentity)).size,c.pairs.length);
  assert.deepEqual(c.pairs.map(pairIdentity).sort(),expected.pairs.map(pairIdentity).sort());
  for(const pair of c.pairs){
   const e=expected.pairs.find(x=>pairIdentity(x)===pairIdentity(pair));
   assert.equal(pair.candidateRef,ref);assert.equal(pair.geometry,e.geometry);assert.deepEqual(pair.wealth,e.wealth);assert.deepEqual(pair.resource,e.resource);assert.deepEqual(pair.intermediateLocations,e.intermediateLocations);
   const original=p.structuralLinks.find(x=>x.id===pair.patternLinkRef);assert.ok(original);assert.equal(original.kind,'WEALTH_RESOURCE_POSITION');assert.deepEqual(original.from,pair.wealth);assert.deepEqual(original.to,pair.resource);assert.equal(pair.relation,original.relation);assert.equal(pair.effectStatus,'NOT_EVALUATED');
   increment(counter.pairGeometries,pair.geometry);counter.visiblePairs++;
  }
  for(const key of ['geCheng','geBai','jiuYing']){assert.equal(c.effects[key],'NOT_IMPLEMENTED');assert.equal(p.effects[key],'NOT_IMPLEMENTED');}
  assert.equal(c.effects.status,'NOT_EVALUATED');
  counter.surfaceWealthTargets+=expected.wealth.visible.length;counter.surfaceResourceTargets+=expected.resource.visible.length;
  if(c.pairs.length>1)counter.parentsWithMultiplePairs++;else if(c.pairs.length===1)counter.parentsWithOnePair++;else counter.parentsWithoutSurfacePair++;
  for(const condition of p.conditions)if(condition.status==='OBSERVED')increment(counter.conditionObservations,condition.kind);
  const factIds=new Set(value.facts.candidates[i].facts.map(x=>x.id)),evidenceIds=new Set(m3.evidence.map(x=>x.id)),locationIds=new Set(expected.locations.map(x=>x.locationId)),memberIds=new Set(expected.locations.flatMap(x=>x.inputMemberRef?[x.inputMemberRef]:[])),pillarIds=new Set(roles.map(role=>ref+'.'+role));
  // Every candidate-owned reference must stay in the same original parent. Native
  // refs retain their source kinds; source strings do not establish external truth.
  const walk=node=>{if(!node||typeof node!=='object')return;if(Array.isArray(node)){for(let j=0;j<node.length;j++){assert.ok(j in node);walk(node[j]);}return;}
   if('candidateRef'in node)assert.equal(node.candidateRef,ref);
   for(const[key,entries]of Object.entries(node)){
    if(['inputFactRefs','inputEvidenceRefs','inputMemberRefs','locationRefs','pillarRefs','ruleRefs','policyRefs','sourceRefs','calculationSourceRefs'].includes(key)){
     assert.ok(Array.isArray(entries));for(const id of entries){assert.equal(typeof id,'string');const ids=key==='inputFactRefs'?factIds:key==='inputEvidenceRefs'?evidenceIds:key==='inputMemberRefs'?memberIds:key==='locationRefs'?locationIds:key==='pillarRefs'?pillarIds:key==='ruleRefs'?rules:key==='policyRefs'?policyIds:sources;assert.ok(ids.has(id),key+' '+id);if(key==='calculationSourceRefs')assert.equal(sourceMap.get(id).kind,'CALENDAR_API');else if(key==='sourceRefs')assert.notEqual(sourceMap.get(id).kind,'CALENDAR_API');counter.referenceLinks++;}
    }else walk(entries);
   }
  };walk(c);counter.parentCandidates++;
 }
 assert.equal(value.wealthResourcePositionReport.candidates.length,analysis.candidates.length);
 return analysis;
}

export async function runM4PositionAcceptance(candidateDirectory,outputDirectory,{pilot=false}={}){
 assert.equal(process.versions.node.split('.')[0],'22','Use the existing fixed Node 22 runtime');
 const network=offline(),removedKeyNames=[];for(const key of Object.keys(process.env))if(/KASI|API_KEY|SERVICE_KEY|DATAGO/i.test(key)){delete process.env[key];removedKeyNames.push(key);}
 try{
  const startedAt=new Date().toISOString(),startedMs=Date.now(),codeSha=git(['rev-parse','HEAD']),initialGitStatus=git(['status','--porcelain']);assert.ok(pilot||!initialGitStatus,'Final acceptance requires a committed clean executable tree');
  let memorySamples=0;const sampledPeak={rss:0,heapTotal:0,heapUsed:0,external:0,arrayBuffers:0};
  const sampleMemory=()=>{const v=process.memoryUsage();memorySamples++;for(const k of Object.keys(sampledPeak))sampledPeak[k]=Math.max(sampledPeak[k],v[k]);return v;};sampleMemory();
  const beforeFiles=await fileHashes(),state=await protect(candidateDirectory,outputDirectory),{candidate,index}=state.loaded;
  const base=createLocalChartProfile(state.loaded,{profileId:MODERN_PROFILE_ID,expectedManifestSha256:BASELINE_MANIFEST_SHA256}),eventContext=getLocalChartEventContext(base),contexts=new Map();for(let year=1989;year<=2026;year++)contexts.set(year,base.eventsForYear(year));
  let actualM1Calls=0;const spy={...base,calculate(input){actualM1Calls++;return base.calculate(input);}},profile=createLocalM3EvidenceProfile(spy,{contextProfile:base,positionProfileId:M4_POSITION_PROFILE_ID});
  const calculate=(p,request,counter)=>{const before=actualM1Calls,value=p.calculate(request);assert.equal(actualM1Calls-before,1);counter.productCalls++;counter.birthM1Calls++;return value;};
  const grid=count(),additional=count(),selectionStats={duplicates:0},digests={gregorian:createHash('sha256'),lunar:createHash('sha256')},cohortDigest=createHash('sha256'),examples={};
  const remember=(value,item)=>{for(const c of value.wealthResourcePosition.candidates){const key=c.decision.status+':'+c.exposureState;if(!examples[key])examples[key]={virtualInput:true,date:item.minute.slice(0,10),time:item.minute.slice(11),policies:item.policy,candidateRef:c.candidateRef,pillars:value.m1.chart.candidates[c.candidateIndex],decision:c.decision.status,exposureState:c.exposureState,pairGeometries:c.pairs.map(p=>p.geometry),parentPatternStatus:value.patternAnalysis.candidates[c.candidateIndex].candidateAssessment.status};}};
  for(const item of m4PatternGrid(candidate,contexts,eventContext,{selectionStats})){
   const date=item.minute.slice(0,10),time=item.minute.slice(11),row=index.fromGregorianDate(date).value;assert.ok(row);
   const g=calculate(profile,{calendar:'GREGORIAN',date,time,policies:item.policy},grid),l=calculate(profile,{calendar:'KOREAN_LUNAR',lunarDate:lunar(row),time,policies:item.policy},grid);
   for(const value of [g,l])checkResult(value,grid);const gm=meaning(g),lm=meaning(l);assert.deepEqual(gm,lm);assert.notEqual(g.m1.evidence.dateConversion.method,l.m1.evidence.dateConversion.method);assert.equal(l.m1.input.gregorianDate,date);remember(g,item);
   for(const calendar of ['gregorian','lunar'])digests[calendar].update(canonical({category:item.category,minute:item.minute,policy:item.policy,meaning:calendar==='gregorian'?gm:lm})+'\n');
   cohortDigest.update(canonical({category:item.category,minute:item.minute,policy:item.policy})+'\n');grid[item.category]++;grid.inputPairs++;grid.semanticComparisons++;
   if(item.category==='pre18BoundaryCases'&&item.delta===0){assert.equal(g.m1.chart.candidates.length,1);grid.bBoundaryOneParentProducts+=2;}
   if(grid.inputPairs%250===0)console.error('M4_POSITION_PROGRESS',JSON.stringify({pairs:grid.inputPairs,parents:grid.parentCandidates,decisions:grid.decisions,heapUsed:sampleMemory().heapUsed}));
   if(pilot&&grid.inputPairs>=50)break;
  }
  const extras={fixedPairs:0,legacyComparisonProducts:0,optionOffChecks:0,seasonalBoundaryTriples:0,candidateIsolation:0,reportTamper:0,requestIsolation:0,negativeLoaders:0,profileConflicts:0};
  if(!pilot){
   const request=(date,time='12:00',policies=primary)=>({calendar:'GREGORIAN',date,time,policies});
   for(const[date,time]of [['2026-01-01','12:00'],['2026-01-02','12:00'],['2026-01-08','12:00'],['2026-01-10','12:00'],['2026-02-06','12:00'],['2026-06-07','12:00'],['2003-01-03','00:30'],['2026-02-04','05:02']]){
    const row=index.fromGregorianDate(date).value,g=calculate(profile,request(date,time),additional),l=calculate(profile,{calendar:'KOREAN_LUNAR',lunarDate:lunar(row),time,policies:primary},additional);for(const v of [g,l])checkResult(v,additional);assert.deepEqual(meaning(g),meaning(l));remember(g,{minute:date+'T'+time,policy:primary});extras.fixedPairs++;
    if(date==='2026-01-08'){const c=g.wealthResourcePosition.candidates[0];assert.equal(c.exposure.wealth.visible.length,1);assert.equal(c.exposure.wealth.visible[0].stem,'丙');assert.equal(c.exposure.resource.visible.length,0);assert.equal(c.exposureState,'WEALTH_ONLY_VISIBLE');assert.equal(c.decision.status,'SURFACE_BOTH_NOT_PRESENT');}
    if(date==='2003-01-03'){const c=g.wealthResourcePosition.candidates[0];assert.equal(c.exposureState,'BOTH_ABSENT');assert.equal(g.patternAnalysis.candidates[0].formationAssessment.status,'BASE_STRUCTURE_ONLY');assert.equal(c.decision.status,'SURFACE_BOTH_NOT_PRESENT');}
   }
   // Compare only preserved semantic layers. The old M4 report's versioned wording
   // correction is intentional, not a change in the old structural analysis.
   const old=createLocalM3EvidenceProfile(spy,{contextProfile:base,patternProfileId:M4_PATTERN_PROFILE_ID}),combined=createLocalM3EvidenceProfile(spy,{contextProfile:base,positionProfileId:M4_POSITION_PROFILE_ID,synthesisProfileId:M3_SYNTHESIS_PROFILE_ID}),oldCombined=createLocalM3EvidenceProfile(spy,{contextProfile:base,patternProfileId:M4_PATTERN_PROFILE_ID,synthesisProfileId:M3_SYNTHESIS_PROFILE_ID});
   for(const[date,time]of [['2026-01-08','12:00'],['2003-01-03','00:30'],['2026-04-17','20:49'],['2026-02-04','05:02']]){
    const q=request(date,time),before=old.calculate(q);extras.legacyComparisonProducts++;const v=calculate(profile,q,additional);checkResult(v,additional);
    for(const key of ['m1','facts','evidence','explanation','validation','patternAnalysis','patternReport'])assert.deepEqual(v[key],before[key]);
    const {m4PositionPolicy,...oldProvenance}=v.provenance;assert.deepEqual(oldProvenance,before.provenance);assert.equal(m4PositionPolicy.id,M4_POSITION_PROFILE_ID);
    const stableJson=JSON.stringify(before),stableText=renderLocalM3EvidenceText(before),again=old.calculate(q);extras.legacyComparisonProducts++;assert.equal(JSON.stringify(again),stableJson);assert.equal(renderLocalM3EvidenceText(again),stableText);extras.optionOffChecks++;
    const oldValue=oldCombined.calculate(q);extras.legacyComparisonProducts++;const both=calculate(combined,q,additional);checkResult(both,additional);for(const key of ['researchSynthesis','researchReport','root','support','seasonal','patternAnalysis'])assert.deepEqual(both[key],oldValue[key]);assert.deepEqual(both.wealthResourcePosition,v.wealthResourcePosition);
   }
   const seasonal=createLocalM3EvidenceProfile(spy,{contextProfile:base,positionProfileId:M4_POSITION_PROFILE_ID,seasonalPolicyId:M3_SEASONAL_SILI_POLICY_ID});
   for(const policy of policies()){
    const triple=['20:48','20:49','20:50'].map(time=>calculate(seasonal,request('2026-04-17',time,policy),additional));for(const v of triple)checkResult(v,additional);
    assert.equal(triple[1].seasonal.candidates[0].judgment.alternatives.length,2);assert.equal(triple[1].wealthResourcePosition.candidates.length,1);assert.deepEqual(triple[0].wealthResourcePosition,triple[1].wealthResourcePosition);assert.deepEqual(triple[1].wealthResourcePosition,triple[2].wealthResourcePosition);extras.seasonalBoundaryTriples++;
   }
   const a=calculate(profile,request('2026-01-08'),additional),b=calculate(profile,request('2026-02-04','05:02'),additional);for(const v of [a,b])checkResult(v,additional);const snapshot=JSON.stringify(a);
   assert.throws(()=>validateM4WealthResourcePosition(a.wealthResourcePosition,{pattern:b.patternAnalysis,evidence:b.evidence}));assert.throws(()=>validateM4WealthResourcePosition(structuredClone(a.wealthResourcePosition),{pattern:a.patternAnalysis,evidence:a.evidence}));extras.candidateIsolation++;
   const forged=structuredClone(a.wealthResourcePositionReport);forged.candidates[0].candidateRef='chart.candidates[999]';assert.throws(()=>validateM4WealthResourcePositionExplanation(forged,a.wealthResourcePosition));extras.reportTamper++;
   assert.equal(JSON.stringify(a),snapshot);const again=calculate(profile,request('2026-01-08'),additional);checkResult(again,additional);assert.deepEqual(meaning(again),meaning(a));extras.requestIsolation++;
   for(const options of [{directory:state.input,expectedManifestSha256:'0'.repeat(64),profileId:MODERN_PROFILE_ID},{directory:join(repo,'.private','m4-position-missing-candidate-no-fallback'),expectedManifestSha256:BASELINE_MANIFEST_SHA256,profileId:MODERN_PROFILE_ID}]){await assert.rejects(()=>loadLocalChartProfile(options));extras.negativeLoaders++;}
   for(const options of [{positionProfileId:'OTHER'},{positionProfileId:M4_POSITION_PROFILE_ID,patternProfileId:'OTHER'},{positionProfileId:M4_POSITION_PROFILE_ID,m2ProfileId:'OTHER'},{positionProfileId:M4_POSITION_PROFILE_ID,m3ProfileId:'OTHER'}]){const before=actualM1Calls;assert.throws(()=>createLocalM3EvidenceProfile(spy,{...options,contextProfile:base}));assert.equal(actualM1Calls,before);extras.profileConflicts++;}
  }
  const cohortSha256=cohortDigest.digest('hex'),semanticDigests={gregorian:digests.gregorian.digest('hex'),lunar:digests.lunar.digest('hex')};assert.equal(semanticDigests.gregorian,semanticDigests.lunar);
  if(!pilot){assert.deepEqual(Object.fromEntries(categoryNames.map(name=>[name,grid[name]])),{monthlyRepresentativeCases:912,jieBeforeAtAfterCases:1692,calendarBoundaryCases:1152,pre18BoundaryCases:144,leapMonthCases:56});assert.equal(grid.inputPairs,3956);assert.equal(selectionStats.duplicates,0);assert.equal(cohortSha256,'092e89bd98de7f0c5fc3bf26d8da50045c5b74adc3804a1bf728d660519e338c');}
  for(const c of [grid,additional]){assert.equal(c.birthM1Calls,c.productCalls);assert.equal(Object.values(c.decisions).reduce((a,b)=>a+b,0),c.parentCandidates);assert.equal(c.parentsWithMultiplePairs+c.parentsWithOnePair+c.parentsWithoutSurfacePair,c.parentCandidates);}
  assert.equal(actualM1Calls,grid.birthM1Calls+additional.birthM1Calls+extras.legacyComparisonProducts);
  await unchanged(state);assert.deepEqual(await fileHashes(),beforeFiles);assert.equal(git(['rev-parse','HEAD']),codeSha);assert.equal(git(['status','--porcelain']),initialGitStatus);network.check();
  const summary={schemaVersion:'kasi-m4-wealth-resource-position-linkage-v1',status:pilot?'M4_POSITION_BOUNDED_PILOT_LINKAGE_PASS':'M4_POSITION_BOUNDED_LINKAGE_PASS',profileId:M4_POSITION_PROFILE_ID,manifestSha256:BASELINE_MANIFEST_SHA256,exportSha256:exportPin,supplement:{contentSha256:supplementPin,preservationAuditOnly:true,passedToProduct:false},cohort:{selection:'REUSED_UNMODIFIED_M4_PATTERN_BOUNDED_GRID',cohortSha256,pilot,duplicates:selectionStats.duplicates},gridCounts:grid,additionalCounts:additional,extras,actualBirthM1CallsIncludingLegacyComparisons:actualM1Calls,semanticDigests,examples,allPreservedInputsUnchanged:true,apiRequests:0,keysUsed:0,validation:'INTERNAL_EXPLICIT_POSITION_POLICY_AND_SOURCE_LINKAGE_NOT_EDITION_OR_EFFICACY_CERTIFICATION',finalGeChengGeBaiJiuYing:'NOT_IMPLEMENTED',unexecuted:{allBirthMinutes:'NOT_TESTED',fullOriginal49799InputPairs:'NOT_RUN_BY_THIS_BOUNDED_CHECK',humanExpertReview:'NOT_PERFORMED',predictiveAccuracy:'NOT_EVALUATED'}};
  await mkdir(state.out);await writeFile(join(state.out,'summary.json'),JSON.stringify(summary,null,2)+'\n',{flag:'wx'});
  const execution={codeSha,node:process.version,nodeSha256:sha(await readFile(process.execPath)),processTZ:process.env.TZ??null,resolvedHostTimezone:Intl.DateTimeFormat().resolvedOptions().timeZone,workingTreeDirty:Boolean(initialGitStatus),initialGitStatus,startedAt,completedAt:new Date().toISOString(),elapsedMs:Date.now()-startedMs,executedFiles:beforeFiles,command:{executable:process.execPath,arguments:process.argv.slice(1)},memory:{execArgv:process.execArgv,usage:sampleMemory(),sampledPeak,samples:memorySamples,samplingScope:'START_250_PAIR_PROGRESS_AND_FINAL_NOT_TRANSIENT_PEAK_OR_LEAK_PROOF',maxRSSKiB:process.resourceUsage().maxRSS},removedKeyNames,keysAbsentAtExecution:Object.keys(process.env).every(key=>!/KASI|API_KEY|SERVICE_KEY|DATAGO/i.test(key)),summaryContentSha256:fingerprint(summary)};
  await writeFile(join(state.out,'execution.json'),JSON.stringify(execution,null,2)+'\n',{flag:'wx'});return summary;
 }finally{network.restore();}
}
if(process.argv[1]&&import.meta.url===pathToFileURL(resolve(process.argv[1])).href){
 try{assert.ok(process.argv.length===4||process.argv.length===5&&process.argv[4]==='--pilot');const summary=await runM4PositionAcceptance(process.argv[2],process.argv[3],{pilot:process.argv[4]==='--pilot'});process.stdout.write(JSON.stringify({status:summary.status,gridCounts:summary.gridCounts,additionalCounts:summary.additionalCounts,semanticDigests:summary.semanticDigests})+'\n');}
 catch(error){process.stderr.write(JSON.stringify({status:'M4_POSITION_LINKAGE_FAILED',error:{name:error?.name??'Error',code:error?.code??null,message:String(error?.message??'').slice(0,220)}})+'\n');process.exitCode=1;}
}
