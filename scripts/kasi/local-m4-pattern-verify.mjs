/** Bounded offline M4 linkage checks. These are not classical or predictive accuracy certification. */
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
import {modernExplanationGrid} from './local-explain-verify.mjs';
import {pre18BoundaryGrid} from './local-m3-seasonal-v2-verify.mjs';
import {createLocalM3EvidenceProfile,deriveLocalM4Pattern,validateLocalM4Pattern,validateLocalM3EvidenceResult,M3_LOCAL_PROFILE_ID,M3_SEASONAL_SILI_POLICY_ID,M3_SYNTHESIS_PROFILE_ID} from './local-m3-evidence.mjs';
import {M2_LOCAL_PROFILE_ID} from './local-chart-facts.mjs';
import {M4_PATTERN_PROFILE_ID,validateM4ZhengguanExplanation} from '../../dist/m4/zhengguanStructureV1.js';
import {areStemCombinationPartners} from '../../dist/domain/stemCombinations.js';
import {fiveElementRelation} from '../../dist/domain/tenGods.js';
import {gregorianDayNumber,gregorianDateFromDayNumber} from '../../dist/calendar/koreanLunisolarValidation.js';
import {DAY_ROLLOVER_POLICIES} from '../../dist/calendar/dayRollover.js';
import {HOUR_STEM_REFERENCE_POLICIES} from '../../dist/calendar/dayHourPillars.js';

const repo=resolve(dirname(fileURLToPath(import.meta.url)),'../..');
const git=args=>execFileSync('git',['-c','safe.directory='+repo.replaceAll('\\','/'),...args],{cwd:repo,encoding:'utf8',stdio:['ignore','pipe','pipe']}).trim();
const inside=(parent,child)=>{const p=relative(parent,child);return p!==''&&!p.startsWith('..')&&!isAbsolute(p);};
const exportPin='7b5584aca339b85c7e54e953c43b672358bda605a478831b6f260df00472e851',supplementPin='f6a0e6dd2b169b4e758f8d1326942556c59f569af714adcb36e73824c6ef02b7';
const treePins={candidateA:'b2a2560d2d6324554e8bacf4f34e5a788cddabe71e99843b3b6dcb6876a89bed',candidateB:'b143a6cd766a9d0c0e763f93aba1236db68a29c2a5e71a89647e0371dbca6584',completedInput:'82c5a30c679ac743c0c89a0192ce2cf21a42387fd4ad8cbb6847a4db18866567',boundarySupplement:'47fdc994a0eb7834cf99c63bafb6d23121a1aa490b0370485690eefaa149d5c9'};
const executedPaths=[
 'scripts/kasi/local-m4-pattern-verify.mjs','scripts/kasi/local-m3-evidence.mjs','scripts/kasi/local-chart.mjs','scripts/kasi/local-chart-facts.mjs','scripts/kasi/local-explain.mjs','scripts/kasi/local-explain-verify.mjs','scripts/kasi/local-m3-seasonal-v2-verify.mjs','scripts/kasi/candidate.mjs','scripts/kasi/research.mjs','scripts/kasi/boundary-supplement.mjs',
 'src/m4/zhengguanStructureV1.ts','dist/m4/zhengguanStructureV1.js','src/m3/structuralEvidenceV1.ts','dist/m3/structuralEvidenceV1.js','src/m3/limitedSynthesisV1.ts','dist/m3/limitedSynthesisV1.js','src/m3/seasonalStateV2.ts','dist/m3/seasonalStateV2.js','src/domain/hiddenStems.ts','dist/domain/hiddenStems.js','src/domain/tenGods.ts','dist/domain/tenGods.js','src/domain/stemCombinations.ts','dist/domain/stemCombinations.js','src/calendar/fourPillars.ts','dist/calendar/fourPillars.js','src/calendar/monthPillar.ts','dist/calendar/monthPillar.js','.kasi-build/schema.js',
 'src/m3/seasonalStateV1.ts','dist/m3/seasonalStateV1.js','src/m3/rootPresenceV1.ts','dist/m3/rootPresenceV1.js','src/m3/resourceSupportV1.ts','dist/m3/resourceSupportV1.js','src/domain/branchRelations.ts','dist/domain/branchRelations.js','src/domain/triadMemberships.ts','dist/domain/triadMemberships.js','src/calendar/koreanLunisolarValidation.ts','dist/calendar/koreanLunisolarValidation.js',
];
const fileHashes=()=>Promise.all(executedPaths.map(async path=>({path,sha256:sha(await readFile(join(repo,path)))})));
const representativeYears=new Set([1989,2000,2026]);
const policyBase=p=>p.dayRollover==='CIVIL_MIDNIGHT'&&p.hourStemReference==='SELECTED_DAY_PILLAR';
const policyKey=p=>p.dayRollover+':'+p.hourStemReference;
const policies=()=>DAY_ROLLOVER_POLICIES.flatMap(dayRollover=>HOUR_STEM_REFERENCE_POLICIES.map(hourStemReference=>({clockPolicyId:MODERN_CLOCK_POLICY_ID,dayRollover,hourStemReference})));
const lunar=row=>({lunarYear:row.lunarYear,lunarMonth:row.lunarMonth,lunarDay:row.lunarDay,leap:row.leap});
const categoryNames=['monthlyRepresentativeCases','jieBeforeAtAfterCases','calendarBoundaryCases','pre18BoundaryCases','leapMonthCases'];

/** Reuse the existing grid; retain a declared finite cohort and deduplicate request identities. */
export function* m4PatternGrid(candidate,contexts,eventContext,{selectionStats={duplicates:0}}={}){
 const seen=new Set(),admit=item=>{const key=item.minute+':'+policyKey(item.policy);if(seen.has(key)){selectionStats.duplicates++;return false;}seen.add(key);return true;};
 for(const item of modernExplanationGrid(candidate,contexts)){
  const date=item.minute.slice(0,10),year=Number(date.slice(0,4)),monthStart=date.endsWith('-01'),monthEnd=gregorianDateFromDayNumber(gregorianDayNumber(date)+1).slice(0,7)!==date.slice(0,7);
  const keep=item.category==='dailyCases'?(monthStart||date.endsWith('-15')):item.category==='jieBeforeAtAfterCases'?(policyBase(item.policy)||representativeYears.has(year)):representativeYears.has(year)&&(monthStart||monthEnd);
  if(keep){const selected={...item,category:item.category==='dailyCases'?'monthlyRepresentativeCases':item.category};if(admit(selected))yield selected;}
 }
 for(const item of pre18BoundaryGrid(eventContext,{years:[...representativeYears]}))if(admit(item))yield item;
 // Every observed leap-month start in the supported modern range, with the four existing policies.
 for(const row of candidate.dates)if(row.solarDate>='1989-01-01'&&row.solarDate<'2027-01-01'&&row.leap&&row.lunarDay===1)for(const policy of policies()){
  const item={minute:row.solarDate+'T12:00',policy,category:'leapMonthCases'};if(admit(item))yield item;
 }
}

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
 const deny=()=>{attempts++;throw Error('OFFLINE_M4_PATTERN_NETWORK_DENIED');};globalThis.fetch=deny;net.Socket.prototype.connect=deny;http.request=deny;http.get=deny;https.request=deny;https.get=deny;tls.connect=deny;
 return {check(){assert.equal(attempts,0,'Product attempted network access');},restore(){globalThis.fetch=originals.fetch;net.Socket.prototype.connect=originals.connect;http.request=originals.httpRequest;http.get=originals.httpGet;https.request=originals.httpsRequest;https.get=originals.httpsGet;tls.connect=originals.tlsConnect;}};
}
const zero=keys=>Object.fromEntries(keys.map(key=>[key,0]));
const statuses=['STRUCTURAL_CANDIDATE','NOT_A_CANDIDATE_UNDER_POLICY','SOURCE_OR_POLICY_UNRESOLVED'];
function counts(){return {...zero(categoryNames),inputPairs:0,productCalls:0,birthM1Calls:0,parentCandidates:0,m4Candidates:0,officerPresence:{PRESENT:0,ABSENT:0},candidateStatuses:zero(statuses),candidateBases:{},competition:{},formation:{},effects:{},conditionsObserved:{},conditionsNotObserved:{},referenceLinks:0,semanticComparisons:0,twoParentRequests:0,bBoundaryOneParentRequests:0,errors:0,incomplete:0};}
const increment=(object,key)=>object[key]=(object[key]??0)+1;
const refs=entry=>Object.entries(entry).filter(([key])=>/Refs$/.test(key));
function patternMeaning(result){return {status:result.status,profile:result.m1.profile.id,manifest:result.m1.dataset.candidateManifestContentSha256,policies:result.m1.policies,date:result.m1.input.gregorianDate,time:result.m1.input.time,chart:result.m1.chart,pattern:{schemaVersion:result.patternAnalysis.schemaVersion,profile:{id:result.patternAnalysis.profile.id,version:result.patternAnalysis.profile.version},candidates:result.patternAnalysis.candidates},report:result.patternReport};}
function checkResult(result,counter){
 validateLocalM3EvidenceResult(result);validateLocalM4Pattern(result.patternAnalysis,{evidence:result.evidence});validateM4ZhengguanExplanation(result.patternReport,result.patternAnalysis);
 assert.equal(result.status,'EVIDENCE_ONLY');assert.equal(result.validation.finalStrength,'NOT_IMPLEMENTED');assert.equal(result.validation.m3FinalInterpretationGate,'BLOCKED_UNCHANGED');assert.equal(result.validation.g0Receipt,null);assert.equal(result.validation.g1P2Promotion,false);
 assert.equal(result.m1.dataset.candidateManifestContentSha256,BASELINE_MANIFEST_SHA256);assert.deepEqual(result.executionCounts,{birthM1Calls:1,m2Derivations:1,m4Derivations:1});
 const analysis=result.patternAnalysis;assert.equal(analysis.schemaVersion,'m4-zhengguan-month-structure-v1');assert.equal(analysis.status,'STRUCTURAL_ANALYSIS_ONLY');assert.equal(analysis.profile.id,M4_PATTERN_PROFILE_ID);assert.equal(analysis.candidates.length,result.m1.chart.candidates.length);
 const rules=new Set(analysis.rules.map(r=>r.id)),sourceMap=new Map(analysis.sources.map(s=>[s.id,s])),sources=new Set(sourceMap.keys());
 const policies=new Set([M4_PATTERN_PROFILE_ID,result.evidence.policy.id,result.facts.policyBundle.id,...Object.values(result.facts.policyBundle.policies).map(p=>p.id)]);
 for(let i=0;i<analysis.candidates.length;i++){
  const c=analysis.candidates[i],m3=result.evidence.candidates[i],m2=result.facts.candidates[i],ref='chart.candidates['+i+']';
  assert.equal(c.candidateRef,ref);assert.equal(c.candidateIndex,i);assert.equal(c.dayMaster,m3.dayMaster);assert.deepEqual(c.monthContext,m3.monthContext);
  assert.ok(statuses.includes(c.candidateAssessment.status));counter.candidateStatuses[c.candidateAssessment.status]++;increment(counter.candidateBases,c.candidateAssessment.basis);increment(counter.competition,c.competition.status);increment(counter.formation,c.formationAssessment.status);increment(counter.effects,c.effects.status);counter.officerPresence[c.officerPresence.status]++;
  // Independent accepted policy table over existing M2/M3 facts; no M4 resolver/helper call.
  const members=m3.monthContext.hiddenMembers.filter(m=>m.tenGod==='正官'),main=members.find(m=>m.position==='MAIN_QI'),other=members.find(m=>m.position==='OTHER');
  const visible=[...Object.values(m3.directionalGroups).flat().filter(l=>l.locationKind==='VISIBLE_STEM'),m3.visibleDayMaster];
  assert.equal(new Set(visible.map(l=>l.locationId)).size,4);
  const monthOfficerExposures=m3.hiddenVisibleLinks.filter(l=>l.hidden.pillarRole==='month'&&l.hidden.tenGod==='正官');
  const unresolved=m3.monthContext.monthPillar.branch==='午'&&Boolean(other);
  const expected=unresolved?'SOURCE_OR_POLICY_UNRESOLVED':main||other&&monthOfficerExposures.length?'STRUCTURAL_CANDIDATE':'NOT_A_CANDIDATE_UNDER_POLICY';
  const expectedBasis=unresolved?'OTHER_MONTH_MEMBER_COMPATIBILITY_REVIEW':main?'MAIN_QI_ZHENGGUAN':other&&monthOfficerExposures.length?'OTHER_ZHENGGUAN_EXACTLY_EXPOSED':other?'OTHER_ZHENGGUAN_NOT_EXPOSED':'NO_MONTH_ZHENGGUAN';
  assert.equal(c.candidateAssessment.status,expected);assert.equal(c.candidateAssessment.basis,expectedBasis);assert.deepEqual(c.monthBasis.officerMembers,members);
  assert.deepEqual(c.monthBasis.exactExposures.map(l=>[l.hidden.locationId,l.visible.locationId]),monthOfficerExposures.map(l=>[l.hidden.locationId,l.visible.locationId]));
  const otherExposures=m3.hiddenVisibleLinks.filter(l=>l.hidden.pillarRole==='month'&&l.hidden.tenGod!=='正官'&&l.visible.pillarRole!=='day');
  assert.deepEqual(c.monthBasis.otherMemberExposures.map(l=>[l.hidden.locationId,l.visible.locationId]),otherExposures.map(l=>[l.hidden.locationId,l.visible.locationId]));
  const competing=expected==='STRUCTURAL_CANDIDATE'?otherExposures:[];
  assert.deepEqual(c.competition.exposures.map(l=>[l.hidden.locationId,l.visible.locationId]),competing.map(l=>[l.hidden.locationId,l.visible.locationId]));
  assert.equal(c.competition.status,competing.length?'COMPETING_CONDITIONS_PRESENT':'NO_COMPETING_MONTH_EXPOSURE_UNDER_POLICY');
  const memberExposures=m3.hiddenVisibleLinks.filter(l=>l.hidden.pillarRole==='month');
  const dayOnly=memberExposures.filter(l=>l.hidden.tenGod!=='正官'&&l.visible.pillarRole==='day'&&!otherExposures.some(other=>other.hidden.locationId===l.hidden.locationId));
  assert.deepEqual(c.monthBasis.memberExposures.map(l=>[l.hidden.locationId,l.visible.locationId]),memberExposures.map(l=>[l.hidden.locationId,l.visible.locationId]));
  assert.deepEqual(c.monthBasis.dayMasterOnlyMatches.map(l=>[l.hidden.locationId,l.visible.locationId]),dayOnly.map(l=>[l.hidden.locationId,l.visible.locationId]));
  const locations=[...Object.values(m3.directionalGroups).flat(),m3.visibleDayMaster],officers=locations.filter(l=>l.tenGod==='正官');
  assert.deepEqual(c.officerPresence.visible,officers.filter(l=>l.locationKind==='VISIBLE_STEM'));assert.deepEqual(c.officerPresence.hidden,officers.filter(l=>l.locationKind==='HIDDEN_STEM'));assert.equal(c.officerPresence.status,officers.length?'PRESENT':'ABSENT');
  for(const[key,gods]of Object.entries({wealth:['正財','偏財'],resource:['正印','偏印'],hurtingOfficer:['傷官'],sevenKillings:['七殺']})){
   const expected=locations.filter(l=>gods.includes(l.tenGod));assert.deepEqual(c.groups[key].visible,expected.filter(l=>l.locationKind==='VISIBLE_STEM'));assert.deepEqual(c.groups[key].hidden,expected.filter(l=>l.locationKind==='HIDDEN_STEM'));
  }
  // M4 adds IDs/references to each native relation; every original key and overlap must remain.
  for(const kind of ['pairs','triads']){
   assert.equal(c.relations[kind].length,m3.relationContext[kind].length);
   m3.relationContext[kind].forEach((native,j)=>{for(const[key,value]of Object.entries(native))assert.deepEqual(c.relations[kind][j][key],value);assert.equal(c.relations[kind][j].candidateRef,ref);assert.equal(c.relations[kind][j].effectStatus,'NOT_EVALUATED');});
  }
  for(const key of ['geCheng','geBai','jiuYing'])assert.equal(c.effects[key],'NOT_IMPLEMENTED');
  const factIds=new Set(m2.facts.map(f=>f.id)),evidenceIds=new Set(m3.evidence.map(e=>e.id)),locationIds=new Set(locations.map(l=>l.locationId));
  const actualGod=(...gods)=>locations.filter(l=>gods.includes(l.tenGod));
  const wealth=actualGod('正財','偏財'),resource=actualGod('正印','偏印'),hurt=actualGod('傷官'),killings=actualGod('七殺');
  const originalVisible=[...visible].sort((a,b)=>['year','month','day','hour'].indexOf(a.pillarRole)-['year','month','day','hour'].indexOf(b.pillarRole));
  const combinations=originalVisible.flatMap((left,j)=>originalVisible.slice(j+1).filter(right=>areStemCombinationPartners(left.stem,right.stem)).map(right=>({left,right})));
  assert.deepEqual(c.surfaceCombinations.map(p=>[p.left.locationId,p.right.locationId]),combinations.map(p=>[p.left.locationId,p.right.locationId]));
  const expectedConditions={WEALTH_GENERATES_OFFICER:wealth.length>0&&officers.length>0,OFFICER_RESOURCE_DAY_MASTER_CHAIN:resource.length>0&&officers.length>0,HURTING_OFFICER_CONTROLS_OFFICER:hurt.length>0&&officers.length>0,OFFICER_SEVEN_KILLINGS_COEXISTENCE:killings.length>0&&officers.length>0,OFFICER_FIVE_COMBINATION:combinations.some(p=>p.left.tenGod==='正官'||p.right.tenGod==='正官'),WEALTH_RESOURCE_POSITION_REVIEW:wealth.length>0&&resource.length>0,NATAL_BRANCH_RELATION_REVIEW:m3.relationContext.pairs.length>0||m3.relationContext.triads.some(t=>t.members.filter(m=>m.pillarRoles.length>0).length>=2),MONTH_MEMBER_SELECTION_COMPETITION:competing.length>0};
  assert.deepEqual(c.conditions.map(condition=>condition.kind).sort(),Object.keys(expectedConditions).sort());
  const relationExpectations={WEALTH_GENERATES_OFFICER:[wealth,officers],OFFICER_GENERATES_RESOURCE:[officers,resource],RESOURCE_GENERATES_DAY_MASTER:[resource,[m3.visibleDayMaster]],HURTING_OFFICER_CONTROLS_OFFICER:[hurt,officers],WEALTH_RESOURCE_POSITION:[wealth,resource]};
  for(const[kind,[left,right]]of Object.entries(relationExpectations)){
   const links=c.structuralLinks.filter(link=>link.kind===kind);assert.equal(links.length,left.length*right.length);
   assert.deepEqual(links.map(link=>link.from.locationId+'>'+link.to.locationId).sort(),left.flatMap(a=>right.map(b=>a.locationId+'>'+b.locationId)).sort());
   for(const link of links){assert.equal(link.candidateRef,ref);assert.equal(link.effectStatus,'NOT_EVALUATED');assert.equal(link.relation,fiveElementRelation(link.from.element,link.to.element));}
  }
  assert.equal(new Set(c.conditions.map(condition=>condition.id)).size,c.conditions.length);
  for(const condition of c.conditions){
   assert.equal(condition.candidateRef,ref);assert.ok(['OBSERVED','NOT_OBSERVED'].includes(condition.status));assert.equal(condition.effectStatus,'NOT_EVALUATED');increment(condition.status==='OBSERVED'?counter.conditionsObserved:counter.conditionsNotObserved,condition.kind);
   assert.equal(condition.status,expectedConditions[condition.kind]?'OBSERVED':'NOT_OBSERVED');
   for(const[name,values]of refs(condition))for(const id of values){assert.equal(typeof id,'string');if(name==='inputFactRefs')assert.ok(factIds.has(id));else if(name==='inputEvidenceRefs')assert.ok(evidenceIds.has(id));else if(name==='locationRefs')assert.ok(locationIds.has(id));else if(name==='ruleRefs')assert.ok(rules.has(id));else if(name==='policyRefs')assert.ok(policies.has(id));else if(name==='sourceRefs')assert.ok(sources.has(id)&&sourceMap.get(id).kind!=='CALENDAR_API');else if(name==='calculationSourceRefs')assert.equal(sourceMap.get(id)?.kind,'CALENDAR_API');counter.referenceLinks++;}
  }
  counter.parentCandidates++;counter.m4Candidates++;
 }
 if(analysis.candidates.length===2)counter.twoParentRequests++;
 return analysis;
}

export async function runM4PatternAcceptance(candidateDirectory,outputDirectory,{pilot=false}={}){
 const network=offline(),removedKeyNames=[];for(const key of Object.keys(process.env))if(/KASI|API_KEY|SERVICE_KEY|DATAGO/i.test(key)){delete process.env[key];removedKeyNames.push(key);}
 try{
  const startedAt=new Date().toISOString(),startedMs=Date.now(),codeSha=git(['rev-parse','HEAD']),workingTreeDirty=Boolean(git(['status','--porcelain']));assert.ok(pilot||!workingTreeDirty,'Final acceptance requires a committed clean executable tree');
  let memorySamples=0;const sampledPeak={rss:0,heapTotal:0,heapUsed:0,external:0,arrayBuffers:0};
  const sampleMemory=()=>{const value=process.memoryUsage();memorySamples++;for(const key of Object.keys(sampledPeak))sampledPeak[key]=Math.max(sampledPeak[key],value[key]);return value;};sampleMemory();
  const beforeFiles=await fileHashes(),state=await protect(candidateDirectory,outputDirectory),{candidate,index}=state.loaded;
  const base=createLocalChartProfile(state.loaded,{profileId:MODERN_PROFILE_ID,expectedManifestSha256:BASELINE_MANIFEST_SHA256}),eventContext=getLocalChartEventContext(base),contexts=new Map();for(let year=1989;year<=2026;year++)contexts.set(year,base.eventsForYear(year));
  let actualM1Calls=0;const spy={...base,calculate(request){actualM1Calls++;return base.calculate(request);}},profile=createLocalM3EvidenceProfile(spy,{contextProfile:base,patternProfileId:M4_PATTERN_PROFILE_ID});
  const calculate=(p,request,counter)=>{const before=actualM1Calls,value=p.calculate(request);assert.equal(actualM1Calls-before,1,'Exactly one natal M1 per product call');counter.productCalls++;counter.birthM1Calls++;return value;};
  const grid=counts(),additional=counts(),selectionStats={duplicates:0},digests={gregorian:createHash('sha256'),lunar:createHash('sha256')},cohortDigest=createHash('sha256'),examples={};
  for(const item of m4PatternGrid(candidate,contexts,eventContext,{selectionStats})){
   const date=item.minute.slice(0,10),time=item.minute.slice(11),row=index.fromGregorianDate(date).value;assert.ok(row);
   const g=calculate(profile,{calendar:'GREGORIAN',date,time,policies:item.policy},grid),l=calculate(profile,{calendar:'KOREAN_LUNAR',lunarDate:lunar(row),time,policies:item.policy},grid);
   for(const value of [g,l])checkResult(value,grid);const gm=patternMeaning(g),lm=patternMeaning(l);assert.deepEqual(gm,lm,'Equivalent calendars must preserve pattern meaning and each candidate reference');
   assert.notEqual(g.m1.evidence.dateConversion.method,l.m1.evidence.dateConversion.method);assert.equal(l.m1.input.gregorianDate,date);
   for(const c of g.patternAnalysis.candidates){const key=c.candidateAssessment.status+':'+c.candidateAssessment.basis;if(!examples[key])examples[key]={date,time,policy:item.policy,pillars:g.m1.chart.candidates[c.candidateIndex],candidateRef:c.candidateRef,status:c.candidateAssessment.status,basis:c.candidateAssessment.basis,officerPresence:c.officerPresence.status,conditionKinds:c.conditions.filter(x=>x.status==='OBSERVED').map(x=>x.kind)};}
   for(const calendar of ['gregorian','lunar'])digests[calendar].update(canonical({category:item.category,minute:item.minute,policy:item.policy,meaning:calendar==='gregorian'?gm:lm})+'\n');
   cohortDigest.update(canonical({category:item.category,minute:item.minute,policy:item.policy})+'\n');
   grid[item.category]++;grid.inputPairs++;grid.semanticComparisons++;
   if(item.category==='pre18BoundaryCases'&&item.delta===0){assert.equal(g.m1.chart.candidates.length,1);grid.bBoundaryOneParentRequests+=2;}
   if(grid.inputPairs%250===0)console.error('M4_PATTERN_PROGRESS',JSON.stringify({pairs:grid.inputPairs,parents:grid.parentCandidates,statuses:grid.candidateStatuses,heapUsed:sampleMemory().heapUsed}));
   if(pilot&&grid.inputPairs>=100)break;
  }
  // Small extras are kept separate from the bounded cohort. They never become hidden default policies.
  const extras={fixedExamplePairs:0,standaloneReuses:0,alternateRequests:0,mutationIsolation:0,oldOutputComparisons:0,legacyProductCalls:0,bBoundaryTriples:0,negativeLoaders:0,profileConflicts:0};
  if(!pilot){
   const primary=policies().find(policyBase),request=(date,time='12:00')=>({calendar:'GREGORIAN',date,time,policies:primary});
   // Fixed before the M4 implementation using a bounded 365-date existing-M1/M2 check.
   // These expectations are structural policy cases, not independent classical efficacy answers.
   for(const[date,expected]of [
    ['2026-01-01','NOT_A_CANDIDATE_UNDER_POLICY'],['2026-01-02','STRUCTURAL_CANDIDATE'],
    ['2026-01-08','STRUCTURAL_CANDIDATE'],['2026-01-10','NOT_A_CANDIDATE_UNDER_POLICY'],
    ['2026-02-06','STRUCTURAL_CANDIDATE'],['2026-06-07','SOURCE_OR_POLICY_UNRESOLVED'],
   ]){
    const row=index.fromGregorianDate(date).value,g=calculate(profile,request(date),additional),l=calculate(profile,{calendar:'KOREAN_LUNAR',lunarDate:lunar(row),time:'12:00',policies:primary},additional);
    for(const value of [g,l]){checkResult(value,additional);assert.equal(value.patternAnalysis.candidates[0].candidateAssessment.status,expected);}
    assert.deepEqual(patternMeaning(g),patternMeaning(l));extras.fixedExamplePairs++;
    examples['FIXED:'+date]={date,time:'12:00',lunarDate:lunar(row),pillars:g.m1.chart.candidates[0],candidateStatus:expected,basis:g.patternAnalysis.candidates[0].candidateAssessment.basis,observedConditionKinds:g.patternAnalysis.candidates[0].conditions.filter(c=>c.status==='OBSERVED').map(c=>c.kind)};
   }
   const ordinary=calculate(profile,request('2026-06-01'),additional);checkResult(ordinary,additional);assert.equal(ordinary.patternAnalysis.candidates[0].officerPresence.status,'PRESENT');assert.equal(ordinary.patternAnalysis.candidates[0].candidateAssessment.status,'NOT_A_CANDIDATE_UNDER_POLICY');
   const again=deriveLocalM4Pattern(ordinary.evidence,{patternProfileId:M4_PATTERN_PROFILE_ID});assert.deepEqual(again,ordinary.patternAnalysis);extras.standaloneReuses++;assert.equal(actualM1Calls,grid.birthM1Calls+additional.birthM1Calls);
   const frozen=JSON.stringify(ordinary);assert.throws(()=>validateLocalM4Pattern(structuredClone(ordinary.patternAnalysis),{evidence:ordinary.evidence}));assert.equal(JSON.stringify(ordinary),frozen);extras.mutationIsolation++;
   const plain=createLocalM3EvidenceProfile(spy,{m2ProfileId:M2_LOCAL_PROFILE_ID,m3ProfileId:M3_LOCAL_PROFILE_ID}),combined=createLocalM3EvidenceProfile(spy,{contextProfile:base,patternProfileId:M4_PATTERN_PROFILE_ID,synthesisProfileId:M3_SYNTHESIS_PROFILE_ID}),legacySynthesis=createLocalM3EvidenceProfile(spy,{synthesisProfileId:M3_SYNTHESIS_PROFILE_ID});
   for(const[date,time]of [['2026-06-01','12:00'],['1996-12-29','00:30'],['2026-04-17','20:49'],['2026-02-04','05:02']]){
    const q=request(date,time),without=plain.calculate(q),withPattern=calculate(profile,q,additional);extras.legacyProductCalls++;checkResult(withPattern,additional);extras.alternateRequests++;
    for(const key of ['m1','facts','evidence','explanation','validation'])assert.deepEqual(withPattern[key],without[key]);
    const {m4Policy,...originalProvenance}=withPattern.provenance;assert.deepEqual(originalProvenance,without.provenance);assert.equal(m4Policy.id,M4_PATTERN_PROFILE_ID);assert.deepEqual(withPattern.executionCounts,{...without.executionCounts,m4Derivations:1});extras.oldOutputComparisons++;
    const old=legacySynthesis.calculate(q),both=calculate(combined,q,additional);extras.legacyProductCalls++;checkResult(both,additional);for(const key of ['researchSynthesis','researchReport','root','support','seasonal'])assert.deepEqual(both[key],old[key]);assert.deepEqual(both.patternAnalysis,withPattern.patternAnalysis);extras.oldOutputComparisons++;
   }
   for(const q of [request('1989-01-01'),request('2000-02-29','23:30'),request('2026-12-31','23:59'),request('1989-01-01')]){const value=calculate(profile,q,additional);checkResult(value,additional);extras.alternateRequests++;}
   const bProfile=createLocalM3EvidenceProfile(spy,{contextProfile:base,patternProfileId:M4_PATTERN_PROFILE_ID,seasonalPolicyId:M3_SEASONAL_SILI_POLICY_ID});
   for(const policy of policies()){
    const triple=['20:48','20:49','20:50'].map(time=>calculate(bProfile,{calendar:'GREGORIAN',date:'2026-04-17',time,policies:policy},additional));for(const value of triple)checkResult(value,additional);
    assert.equal(triple[1].seasonal.candidates[0].judgment.alternatives.length,2);assert.equal(triple[1].patternAnalysis.candidates.length,1);assert.deepEqual(triple[0].patternAnalysis,triple[1].patternAnalysis);assert.deepEqual(triple[1].patternAnalysis,triple[2].patternAnalysis);extras.bBoundaryTriples++;
   }
   for(const options of [{directory:state.input,expectedManifestSha256:'0'.repeat(64),profileId:MODERN_PROFILE_ID},{directory:join(repo,'.private','m4-missing-candidate-no-fallback'),expectedManifestSha256:BASELINE_MANIFEST_SHA256,profileId:MODERN_PROFILE_ID}]){await assert.rejects(()=>loadLocalChartProfile(options));extras.negativeLoaders++;}
   for(const options of [{patternProfileId:'OTHER'},{patternProfileId:M4_PATTERN_PROFILE_ID,m2ProfileId:'OTHER'},{patternProfileId:M4_PATTERN_PROFILE_ID,m3ProfileId:'OTHER'}]){const before=actualM1Calls;assert.throws(()=>createLocalM3EvidenceProfile(spy,{...options,contextProfile:base}));assert.equal(actualM1Calls,before);extras.profileConflicts++;}
  }
  const cohortSha256=cohortDigest.digest('hex'),semanticDigests={gregorian:digests.gregorian.digest('hex'),lunar:digests.lunar.digest('hex')};assert.equal(semanticDigests.gregorian,semanticDigests.lunar);
  // Scope was enumerated before product execution; this checks completion, not a desired verdict ratio.
  if(!pilot){assert.deepEqual(Object.fromEntries(categoryNames.map(name=>[name,grid[name]])),{monthlyRepresentativeCases:912,jieBeforeAtAfterCases:1692,calendarBoundaryCases:1152,pre18BoundaryCases:144,leapMonthCases:56});assert.equal(grid.inputPairs,3956);assert.equal(selectionStats.duplicates,0);assert.equal(cohortSha256,'092e89bd98de7f0c5fc3bf26d8da50045c5b74adc3804a1bf728d660519e338c');}
  assert.equal(grid.birthM1Calls,grid.productCalls);assert.equal(additional.birthM1Calls,additional.productCalls);assert.equal(grid.parentCandidates,grid.m4Candidates);assert.equal(additional.parentCandidates,additional.m4Candidates);assert.equal(actualM1Calls,grid.birthM1Calls+additional.birthM1Calls+extras.legacyProductCalls);
  for(const c of [grid,additional]){assert.equal(Object.values(c.candidateStatuses).reduce((a,b)=>a+b,0),c.parentCandidates);assert.equal(Object.values(c.officerPresence).reduce((a,b)=>a+b,0),c.parentCandidates);assert.equal(c.errors,0);assert.equal(c.incomplete,0);}
  await unchanged(state);assert.deepEqual(await fileHashes(),beforeFiles);network.check();
  const summary={schemaVersion:'kasi-m4-zhengguan-structure-linkage-v1',status:pilot?'M4_BOUNDED_PILOT_LINKAGE_PASS':'M4_BOUNDED_MODERN_LINKAGE_PASS',profileId:M4_PATTERN_PROFILE_ID,manifestSha256:BASELINE_MANIFEST_SHA256,exportSha256:exportPin,supplement:{contentSha256:supplementPin,preservationAuditOnly:true,passedToProduct:false},cohort:{selection:'EXISTING_GRID_DECLARED_BOUNDED_FILTER',monthlyDates:[1,15],all38YearsJiePrimaryPolicy:true,allPoliciesRepresentativeYears:[...representativeYears],representativeGregorianMonthAndZiBoundaries:true,representativeAllBTriples:true,leapMonthStartsFourPolicies:true,deduplication:'MINUTE_PLUS_EXPLICIT_DAY_HOUR_POLICY_FIRST_CATEGORY_WINS',duplicates:selectionStats.duplicates,cohortSha256,pilot},gridCounts:grid,additionalCounts:additional,extras,actualBirthM1CallsIncludingLegacyComparisons:actualM1Calls,semanticDigests,examples,allPreservedInputsUnchanged:true,apiRequests:0,keysUsed:0,validation:'INTERNAL_POLICY_AND_SOURCE_LINKAGE_NOT_EDITION_OR_PREDICTIVE_CERTIFICATION',m3FinalStrength:'NOT_IMPLEMENTED',finalGeChengGeBaiJiuYing:'NOT_IMPLEMENTED'};
  await mkdir(state.out);await writeFile(join(state.out,'summary.json'),JSON.stringify(summary,null,2)+'\n',{flag:'wx'});
  const execution={codeSha,node:process.version,nodeSha256:sha(await readFile(process.execPath)),processTZ:process.env.TZ??null,resolvedHostTimezone:Intl.DateTimeFormat().resolvedOptions().timeZone,workingTreeDirty,startedAt,completedAt:new Date().toISOString(),elapsedMs:Date.now()-startedMs,executedFiles:beforeFiles,command:{executable:process.execPath,arguments:process.argv.slice(1)},memory:{execArgv:process.execArgv,usage:sampleMemory(),sampledPeak,samples:memorySamples,samplingScope:'START_250_PAIR_PROGRESS_AND_FINAL_SAMPLES_NOT_ABSOLUTE_TRANSIENT_PEAK_OR_LEAK_PROOF',maxRSSKiB:process.resourceUsage().maxRSS},removedKeyNames,keysAbsentAtExecution:Object.keys(process.env).every(key=>!/KASI|API_KEY|SERVICE_KEY|DATAGO/i.test(key)),summaryContentSha256:fingerprint(summary)};
  await writeFile(join(state.out,'execution.json'),JSON.stringify(execution,null,2)+'\n',{flag:'wx'});return summary;
 }finally{network.restore();}
}
if(process.argv[1]&&import.meta.url===pathToFileURL(resolve(process.argv[1])).href){
 try{assert.ok(process.argv.length===4||process.argv.length===5&&process.argv[4]==='--pilot');const summary=await runM4PatternAcceptance(process.argv[2],process.argv[3],{pilot:process.argv[4]==='--pilot'});process.stdout.write(JSON.stringify({status:summary.status,gridCounts:summary.gridCounts,additionalCounts:summary.additionalCounts,semanticDigests:summary.semanticDigests})+'\n');}
 catch(error){process.stderr.write(JSON.stringify({status:'M4_PATTERN_LINKAGE_FAILED',error:{name:error?.name??'Error',code:error?.code??null,message:String(error?.message??'').slice(0,220)}})+'\n');process.exitCode=1;}
}
