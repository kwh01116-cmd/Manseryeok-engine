/** Private M3 evidence acceptance. Artificial births only; no source collection or predictions. */
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {readFile,realpath,mkdir,writeFile} from 'node:fs/promises';
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
import {BASELINE_MANIFEST_SHA256,MODERN_PROFILE_ID,STAGE_A_PROFILE_ID,MODERN_CLOCK_POLICY_ID,createLocalChartProfile,loadLocalChartProfile} from './local-chart.mjs';
import {modernExplanationGrid} from './local-explain-verify.mjs';
import {M2_LOCAL_PROFILE_ID} from './local-chart-facts.mjs';
import {createLocalM3EvidenceProfile,deriveLocalM3Evidence,validateLocalM3EvidenceResult,validateLocalM3Explanation,M3_LOCAL_PROFILE_ID} from './local-m3-evidence.mjs';
import {createLocalLuckProfile,M7_LUCK_POLICY_V01} from './local-luck.mjs';
import {projectLocalLuckResult} from './local-luck-projection.mjs';
import {CALENDAR_PROJECTION_POLICY_V02} from '../../dist/luck/calendarProjectionV02.js';
import {STEM_NATURE} from '../../dist/domain/stems.js';
import {DAY_ROLLOVER_POLICIES} from '../../dist/calendar/dayRollover.js';
import {HOUR_STEM_REFERENCE_POLICIES} from '../../dist/calendar/dayHourPillars.js';

const root=resolve(dirname(fileURLToPath(import.meta.url)),'../..');
const exportPin='7b5584aca339b85c7e54e953c43b672358bda605a478831b6f260df00472e851';
const treePins={candidateA:'b2a2560d2d6324554e8bacf4f34e5a788cddabe71e99843b3b6dcb6876a89bed',candidateB:'b143a6cd766a9d0c0e763f93aba1236db68a29c2a5e71a89647e0371dbca6584',completedInput:'82c5a30c679ac743c0c89a0192ce2cf21a42387fd4ad8cbb6847a4db18866567'};
const git=args=>execFileSync('git',['-c','safe.directory='+root.replaceAll('\\','/'),...args],{cwd:root,encoding:'utf8',stdio:['ignore','pipe','pipe']}).trim();
const inside=(parent,child)=>{const p=relative(parent,child);return p!==''&&!p.startsWith('..')&&!isAbsolute(p);};
const lunar=row=>({lunarYear:row.lunarYear,lunarMonth:row.lunarMonth,lunarDay:row.lunarDay,leap:row.leap});
const paths=['scripts/kasi/local-m3-evidence-verify.mjs','scripts/kasi/local-m3-evidence.mjs','scripts/kasi/local-chart.mjs','scripts/kasi/local-chart-facts.mjs','scripts/kasi/local-explain.mjs','scripts/kasi/local-explain-verify.mjs','scripts/kasi/candidate.mjs','scripts/kasi/research.mjs','scripts/kasi/local-luck.mjs','scripts/kasi/local-luck-projection.mjs','src/m3/structuralEvidenceV1.ts','dist/m3/structuralEvidenceV1.js','src/domain/tenGods.ts','dist/domain/tenGods.js','src/luck/luckV01.ts','dist/luck/luckV01.js','src/luck/calendarProjectionV02.ts','dist/luck/calendarProjectionV02.js'];
async function executionFiles(){return Promise.all(paths.map(async path=>({path,sha256:sha(await readFile(join(root,path)))})));}
async function protect(inputDirectory,outDirectory){
  const privateRoot=await realpath(join(root,'.private')),input=await realpath(resolve(inputDirectory)),out=resolve(outDirectory);
  assert.ok(inside(privateRoot,input)&&inside(privateRoot,out));assert.equal(await realpath(dirname(out)),dirname(out));
  const directories=new Map([['providedCandidate',input],['candidateA',await realpath(join(privateRoot,'kasi-research-1950-2026-fe84ab4-a'))],['candidateB',await realpath(join(privateRoot,'kasi-research-1950-2026-fe84ab4-b'))],['completedInput',await realpath(join(privateRoot,'kasi-local-1950-2026/monthly-xml'))]]);
  const before=new Map(),cache=new Map();
  for(const [name,path]of directories){assert.ok(out!==path&&!inside(path,out)&&!inside(out,path));if(!cache.has(path))cache.set(path,await inventory(path));before.set(name,fingerprint(cache.get(path)));}
  for(const [name,pin]of Object.entries(treePins))assert.equal(before.get(name),pin,'Previously pinned '+name+' input changed');
  assert.equal(sha(await readFile(join(directories.get('completedInput'),'export.json'))),exportPin);
  const loaded=await loadCandidate(input,BASELINE_MANIFEST_SHA256);
  await loadCandidate(directories.get('candidateB'),BASELINE_MANIFEST_SHA256);
  return {input,out,directories,before,loaded};
}
async function unchanged(state){const cache=new Map();for(const [name,path]of state.directories){if(!cache.has(path))cache.set(path,await inventory(path));assert.equal(fingerprint(cache.get(path)),state.before.get(name),name+' changed');}}
function blockNetwork(){
  const originals={fetch:globalThis.fetch,connect:net.Socket.prototype.connect,httpRequest:http.request,httpGet:http.get,httpsRequest:https.request,httpsGet:https.get,tlsConnect:tls.connect};
  let attempted=0;const denied=()=>{attempted++;const error=new Error('OFFLINE_M3_NETWORK_DENIED');error.code='OFFLINE_M3_NETWORK_DENIED';throw error;};
  globalThis.fetch=denied;net.Socket.prototype.connect=denied;http.request=denied;http.get=denied;https.request=denied;https.get=denied;tls.connect=denied;
  assert.throws(()=>globalThis.fetch('https://invalid.example'),/OFFLINE_M3_NETWORK_DENIED/);
  assert.throws(()=>net.Socket.prototype.connect.call({},443,'invalid.example'),/OFFLINE_M3_NETWORK_DENIED/);
  const probes=attempted;
  return {check(){assert.equal(attempted,probes,'M3 attempted a network call');},restore(){globalThis.fetch=originals.fetch;net.Socket.prototype.connect=originals.connect;http.request=originals.httpRequest;http.get=originals.httpGet;https.request=originals.httpsRequest;https.get=originals.httpsGet;tls.connect=originals.tlsConnect;},probes};
}
export function m3Meaning(result){return {status:result.status,policy:result.evidence.policy,finalStrength:result.evidence.finalStrength,candidates:result.evidence.candidates,explanation:result.explanation};}

/** Independent linkage checks consume the existing M2 facts, never rerun target derivation as an oracle. */
function checkM3(result,counts){
  assert.equal(result.status,'EVIDENCE_ONLY');validateLocalM3EvidenceResult(result);
  assert.equal(result.validation.finalStrength,'NOT_IMPLEMENTED');assert.equal(result.validation.m3FinalInterpretationGate,'BLOCKED_UNCHANGED');
  assert.equal(result.evidence.finalStrength.status,'NOT_IMPLEMENTED');
  assert.equal(result.m1.dataset.candidateManifestContentSha256,BASELINE_MANIFEST_SHA256);
  assert.equal(result.evidence.candidates.length,result.m1.chart.candidates.length);
  const rules=new Map(result.evidence.rules.map(r=>[r.id,r])),sources=new Map(result.evidence.sources.map(s=>[s.id,s]));
  for(const original of result.facts.rules){const copy=rules.get(original.id);assert.ok(copy);assert.equal(copy.runtimeVersion,original.runtimeVersion,'Do not invent upstream rule versions');}
  for(const candidate of result.evidence.candidates){
    const index=candidate.candidateIndex,base=result.facts.candidates[index],natal=result.m1.chart.candidates[index];
    assert.equal(candidate.candidateRef,base.id);assert.equal(candidate.dayMaster,natal.day.stem);
    const facts=new Map(base.facts.map(f=>[f.id,f])),members=new Map(base.facts.filter(f=>f.kind==='HIDDEN_STEMS').flatMap(f=>f.value.members.map(m=>[m.id,m])));
    for(const evidence of candidate.evidence){
      assert.equal(evidence.candidateRef,base.id);assert.ok(evidence.inputFactRefs.length);
      for(const id of evidence.inputFactRefs)assert.ok(facts.has(id),'Evidence must reference this candidate M2 fact');
      for(const id of evidence.inputMemberRefs)assert.ok(members.has(id),'Hidden member reference must be in this candidate');
      for(const id of evidence.ruleRefs)assert.ok(rules.has(id));
      for(const id of evidence.sourceRefs)assert.ok(sources.has(id)&&sources.get(id).kind!=='CALENDAR_API');
      for(const id of evidence.calculationSourceRefs)assert.equal(sources.get(id)?.kind,'CALENDAR_API');
      counts.evidenceReferenceChecks++;
    }
    // Exact location/relationship expectations are checked below against the M2 member records.
    checkStructuralLocations(candidate,base,natal,counts);
    const view=result.explanation.candidates[index],evidenceIds=new Set(candidate.evidence.map(e=>e.id));
    assert.equal(view.candidateRef,base.id);
    for(const item of view.items){assert.equal(item.candidateRef,base.id);for(const id of item.evidenceRefs)assert.ok(evidenceIds.has(id));for(const id of item.inputFactRefs)assert.ok(facts.has(id));assert.ok(item.text.length);counts.explanationReferenceChecks++;}
    counts.candidates++;
  }
}

function checkStructuralLocations(candidate,base,natal,counts){
  const roles=['year','month','day','hour'],dm=natal.day.stem,element=STEM_NATURE[dm].element;
  const hiddenFacts=base.facts.filter(f=>f.kind==='HIDDEN_STEMS'),hidden=hiddenFacts.flatMap(f=>f.value.members.map(m=>({fact:f,member:m,role:f.value.role})));
  const ids=locations=>locations.map(location=>location.locationId).sort();
  const exact=hidden.filter(x=>x.member.stem===dm),same=hidden.filter(x=>x.member.stem!==dm&&STEM_NATURE[x.member.stem].element===element);
  assert.deepEqual(ids(candidate.rootCandidates.exactStem),exact.map(x=>x.member.id).sort());
  assert.deepEqual(ids(candidate.rootCandidates.sameElementDifferentStem),same.map(x=>x.member.id).sort());
  // Existing independent ten-god categories give a second route to the five directed groups.
  const category={比肩:'SAME',劫財:'SAME',食神:'DAY_MASTER_GENERATES',傷官:'DAY_MASTER_GENERATES',偏財:'DAY_MASTER_CONTROLS',正財:'DAY_MASTER_CONTROLS',七殺:'TARGET_CONTROLS_DAY_MASTER',正官:'TARGET_CONTROLS_DAY_MASTER',偏印:'TARGET_GENERATES_DAY_MASTER',正印:'TARGET_GENERATES_DAY_MASTER'};
  const expectedGroups=Object.fromEntries(['SAME','TARGET_GENERATES_DAY_MASTER','DAY_MASTER_GENERATES','DAY_MASTER_CONTROLS','TARGET_CONTROLS_DAY_MASTER'].map(key=>[key,[]]));
  for(const x of hidden)expectedGroups[category[x.member.tenGod]].push(x.member.id);
  for(const fact of base.facts.filter(f=>f.kind==='VISIBLE_TEN_GOD'))expectedGroups[category[fact.value.tenGod]].push(base.id+'.'+fact.value.role+'.stem');
  const allLocations=[];
  for(const [relation,expected]of Object.entries(expectedGroups)){
    assert.deepEqual(ids(candidate.directionalGroups[relation]),expected.sort());
    for(const location of candidate.directionalGroups[relation]){
      assert.equal(location.candidateRef,base.id);assert.equal(location.pillarRef,base.id+'.'+location.pillarRole);assert.equal(location.element,STEM_NATURE[location.stem].element);assert.equal(location.relation,relation);
      if(location.locationKind==='HIDDEN_STEM'){
        const original=hidden.find(x=>x.member.id===location.locationId);assert.ok(original);
        assert.equal(location.inputFactRef,original.fact.id);assert.equal(location.inputMemberRef,original.member.id);assert.equal(location.stem,original.member.stem);assert.equal(location.index,original.member.index);assert.equal(location.position,original.member.position);assert.equal(location.tenGod,original.member.tenGod);assert.equal(location.memberRef,original.member.memberRef);
      }else{
        assert.equal(location.locationKind,'VISIBLE_STEM');assert.notEqual(location.pillarRole,'day','The day-master itself is not another support item');assert.equal(location.stem,natal[location.pillarRole].stem);assert.equal(location.inputMemberRef,null);
      }
      allLocations.push(location.locationId);counts.locationChecks++;
    }
  }
  assert.equal(allLocations.length,hidden.length+3);assert.equal(new Set(allLocations).size,allLocations.length);
  const links=[];
  for(const x of hidden)for(const role of roles)if(x.member.stem===natal[role].stem)links.push(x.member.id+'->'+base.id+'.'+role+'.stem');
  assert.deepEqual(candidate.hiddenVisibleLinks.map(x=>x.hidden.locationId+'->'+x.visible.locationId).sort(),links.sort());
  for(const link of candidate.hiddenVisibleLinks){assert.equal(link.match,'EXACT_STEM_CHARACTER_ONLY');assert.equal(link.hidden.stem,link.visible.stem);assert.equal(link.assessment,'UNRESOLVED');counts.hiddenVisibleChecks++;}
  const summary=base.facts.find(f=>f.kind==='SUMMARY'),month=base.pillars.find(p=>p.role==='month'),monthHidden=hidden.filter(x=>x.role==='month');
  assert.deepEqual(candidate.monthContext.monthPillar,{stem:natal.month.stem,branch:natal.month.branch,pillarRef:base.id+'.month'});
  assert.deepEqual(candidate.monthContext.representativeBranchNature,month.nature.branch);
  assert.deepEqual(ids(candidate.monthContext.hiddenMembers),monthHidden.map(x=>x.member.id).sort());
  assert.equal(candidate.monthContext.principalHiddenMember.inputMemberRef,monthHidden.find(x=>x.member.position==='MAIN_QI').member.id);
  assert.equal(candidate.monthContext.activeSince.displayedDateTime,summary.value.activeSince.displayedDateTime);assert.equal(candidate.monthContext.activeSince.term,summary.value.activeSince.term);assert.deepEqual(candidate.monthContext.activeSince.sourceIds,summary.value.activeSince.sourceIds);
  assert.equal(candidate.monthContext.boundarySide,summary.value.boundarySide);assert.equal(candidate.monthContext.season.status,'UNRESOLVED');
  assert.deepEqual(candidate.relationContext.pairs,base.branchRelations);assert.deepEqual(candidate.relationContext.triads,base.triadMemberships);assert.equal(candidate.relationContext.effectStatus,'UNRESOLVED');
  counts.exactStemMatches+=exact.length;counts.sameElementDifferentStemMatches+=same.length;counts.pairContexts+=base.branchRelations.length;counts.triadContexts+=base.triadMemberships.length;
  counts.structuralCandidates++;
}

export async function runM3EvidenceAcceptance(candidateDirectory,outputDirectory,{benchmarkVectors=null,focusedOnly=false}={}){
  assert.ok(benchmarkVectors===null||Number.isInteger(benchmarkVectors)&&benchmarkVectors>=1&&benchmarkVectors<=100);
  assert.equal(typeof focusedOnly,'boolean');assert.ok(!focusedOnly||benchmarkVectors===null);
  const guard=blockNetwork();const removedKeys=[];
  for(const name of Object.keys(process.env))if(/KASI|API_KEY|SERVICE_KEY|DATAGO/i.test(name)){delete process.env[name];removedKeys.push(name);}
  try{
    const startedAt=new Date().toISOString(),codeSha=git(['rev-parse','HEAD']),dirty=git(['status','--porcelain']).length>0,beforeFiles=await executionFiles();
    const state=await protect(candidateDirectory,outputDirectory),{candidate,index}=state.loaded;
    const chart=createLocalChartProfile(state.loaded,{profileId:MODERN_PROFILE_ID,expectedManifestSha256:BASELINE_MANIFEST_SHA256});let actualM1Calls=0;
    const spy={...chart,calculate(request){actualM1Calls++;return chart.calculate(request);}};
    const options={m2ProfileId:M2_LOCAL_PROFILE_ID,m3ProfileId:M3_LOCAL_PROFILE_ID},profile=createLocalM3EvidenceProfile(spy,options);
    const contexts=new Map();for(let year=1989;year<=2026;year++)contexts.set(year,chart.eventsForYear(year));
    const counts={dailyCases:0,jieBeforeAtAfterCases:0,calendarBoundaryCases:0,totalInputPairs:0,productCalls:0,birthM1Calls:0,candidates:0,structuralCandidates:0,locationChecks:0,hiddenVisibleChecks:0,exactStemMatches:0,sameElementDifferentStemMatches:0,pairContexts:0,triadContexts:0,evidenceReferenceChecks:0,explanationReferenceChecks:0,semanticComparisons:0,lichunPairs:0,alternationChecks:0,mutationIsolationChecks:0,negativeLoaderChecks:0,auxiliaryProfileCalls:0,independentM7Contexts:0,independentM7BirthM1Calls:0,standaloneM3Derivations:0};
    const hashes={gregorian:createHash('sha256'),lunar:createHash('sha256')};
    const calculate=request=>{counts.productCalls++;const before=actualM1Calls,result=profile.calculate(request);assert.equal(actualM1Calls-before,1);counts.birthM1Calls++;return result;};
    if(!focusedOnly)for(const item of modernExplanationGrid(candidate,contexts)){
      const date=item.minute.slice(0,10),time=item.minute.slice(11),row=index.fromGregorianDate(date).value;assert.ok(row);
      const g=calculate({calendar:'GREGORIAN',date,time,policies:item.policy}),l=calculate({calendar:'KOREAN_LUNAR',lunarDate:lunar(row),time,policies:item.policy});
      checkM3(g,counts);checkM3(l,counts);
      assert.equal(g.m1.input.gregorianDate,date);assert.equal(l.m1.input.gregorianDate,date);
      assert.equal(g.m1.evidence.dateConversion.method,'GREGORIAN_WITH_API_OBSERVED_DATE_EVIDENCE');assert.equal(l.m1.evidence.dateConversion.method,'API_OBSERVED_DATE_INDEX');
      assert.deepEqual(m3Meaning(g),m3Meaning(l),'Equivalent dates must retain the same normalized M3 meanings');
      for(const [name,value]of [['gregorian',g],['lunar',l]])hashes[name].update(canonical({category:item.category,policy:item.policy,result:m3Meaning(value)})+'\n');
      counts[item.category]++;counts.totalInputPairs++;counts.semanticComparisons++;
      if(item.event?.term==='LICHUN'&&item.delta===0){assert.equal(g.evidence.candidates.length,2);assert.notEqual(g.evidence.candidates[0].monthContext,g.evidence.candidates[1].monthContext);counts.lichunPairs++;}
      if(counts.totalInputPairs%1000===0)console.error('M3_EVIDENCE_PROGRESS',JSON.stringify({pairs:counts.totalInputPairs,candidates:counts.candidates}));
      if(benchmarkVectors!==null&&counts.totalInputPairs>=benchmarkVectors)break;
    }
    const gridCounts=structuredClone(counts);
    if(benchmarkVectors===null&&!focusedOnly){assert.equal(counts.dailyCases,13879);assert.equal(counts.jieBeforeAtAfterCases,5472);assert.equal(counts.calendarBoundaryCases,28624);assert.equal(counts.totalInputPairs,47975);assert.equal(counts.lichunPairs,152);}
    if(benchmarkVectors===null){
    const policies=DAY_ROLLOVER_POLICIES.flatMap(dayRollover=>HOUR_STEM_REFERENCE_POLICIES.map(hourStemReference=>({clockPolicyId:MODERN_CLOCK_POLICY_ID,dayRollover,hourStemReference})));
    const request=(date='2026-06-01',time='12:00',policy=policies[0])=>({calendar:'GREGORIAN',date,time,policies:policy});
    const stageA=createLocalChartProfile(state.loaded,{profileId:STAGE_A_PROFILE_ID,expectedManifestSha256:BASELINE_MANIFEST_SHA256});let auxiliaryM1Calls=0;
    const aSpy={...stageA,calculate(request){auxiliaryM1Calls++;return stageA.calculate(request);}},aProfile=createLocalM3EvidenceProfile(aSpy,options);
    const aRequest=request('2026-02-04','05:02'),aMeaning=fingerprint(m3Meaning(aProfile.calculate(aRequest)));counts.auxiliaryProfileCalls++;
    for(let year=1989;year<=2026;year++){
      const req=request(year+'-01-01','23:30',policies[(year-1989)%4]),first=calculate(req),expected=fingerprint(m3Meaning(first));checkM3(first,counts);
      assert.equal(fingerprint(m3Meaning(aProfile.calculate(aRequest))),aMeaning);
      counts.auxiliaryProfileCalls++;
      calculate(request((year===2026?1989:2026)+'-12-31'));
      assert.equal(fingerprint(m3Meaning(calculate(req))),expected);counts.alternationChecks++;
      assert.throws(()=>{first.evidence.candidates[0].dayMaster='MODIFIED';},TypeError);
      const forged=structuredClone(first);forged.evidence.candidates[0].dayMaster='MODIFIED';assert.throws(()=>validateLocalM3EvidenceResult(forged));
      const view=structuredClone(first.explanation);view.candidates[0].items[0].text='MODIFIED';assert.throws(()=>validateLocalM3Explanation(view,first.evidence));
      assert.equal(fingerprint(m3Meaning(calculate(req))),expected);counts.mutationIsolationChecks++;
    }
    // M3 ignores time-axis options: consume the issued M2 from each separately measured M7 request.
    const m7Spy={...chart,calculate(request){counts.independentM7BirthM1Calls++;return chart.calculate(request);}};
    const luck=createLocalLuckProfile(m7Spy,{luckPolicyId:M7_LUCK_POLICY_V01,m2ProfileId:M2_LOCAL_PROFILE_ID,contextProfile:chart});
    const natalRequest=request('1990-06-01'),baseline=fingerprint(m3Meaning(calculate(natalRequest)).candidates);
    for(const sex of ['MALE','FEMALE']){
      const m7=luck.calculate(natalRequest,{dayun:{traditionalSex:sex,count:10},seyun:{yearLabel:2026}});counts.independentM7Contexts++;
      const evidence=deriveLocalM3Evidence(m7.baseExplanation.facts,{m3ProfileId:M3_LOCAL_PROFILE_ID});counts.standaloneM3Derivations++;
      assert.equal(fingerprint(evidence.candidates),baseline);
      projectLocalLuckResult(m7,{calendarProjectionPolicyId:CALENDAR_PROJECTION_POLICY_V02,asOfMinute:sex==='MALE'?'2026-01-01T12:00':'2026-11-01T12:00'});
      assert.equal(fingerprint(deriveLocalM3Evidence(m7.baseExplanation.facts,{m3ProfileId:M3_LOCAL_PROFILE_ID}).candidates),baseline);counts.standaloneM3Derivations++;
    }
    assert.equal(auxiliaryM1Calls,counts.auxiliaryProfileCalls);assert.equal(counts.independentM7BirthM1Calls,counts.independentM7Contexts);
    await assert.rejects(()=>loadLocalChartProfile({directory:state.input,expectedManifestSha256:'0'.repeat(64),profileId:MODERN_PROFILE_ID}));counts.negativeLoaderChecks++;
    await assert.rejects(()=>loadLocalChartProfile({directory:join(root,'.private','INTENTIONALLY_ABSENT_M3_CANDIDATE'),expectedManifestSha256:BASELINE_MANIFEST_SHA256,profileId:MODERN_PROFILE_ID}));counts.negativeLoaderChecks++;
    }
    assert.equal(actualM1Calls,counts.productCalls);assert.equal(counts.birthM1Calls,counts.productCalls);guard.check();await unchanged(state);
    assert.deepEqual(await executionFiles(),beforeFiles,'Executed source/build modules changed');assert.equal(git(['rev-parse','HEAD']),codeSha);assert.equal(git(['status','--porcelain']).length>0,dirty);
    const semanticDigests=Object.fromEntries(Object.entries(hashes).map(([name,hash])=>[name,hash.digest('hex')]));assert.equal(semanticDigests.gregorian,semanticDigests.lunar);
    const summary={schemaVersion:'kasi-m3-evidence-acceptance-v1',status:focusedOnly?'FOCUSED_ONLY_NOT_FULL_ACCEPTANCE':benchmarkVectors===null?'MODERN_M3_EVIDENCE_PASS':'BENCHMARK_ONLY_NOT_FULL_ACCEPTANCE',inputNature:'EXPLICIT_ARTIFICIAL_BIRTH_GRID_NOT_PERSONAL_RECORDS',m3ProfileId:M3_LOCAL_PROFILE_ID,m2ProfileId:M2_LOCAL_PROFILE_ID,birthRange:{fromInclusive:'1989-01-01',untilExclusive:'2027-01-01'},manifestContentSha256:BASELINE_MANIFEST_SHA256,exportSha256:exportPin,preservedTrees:Object.fromEntries(state.before),gridCounts,counts,semanticDigests,finalStrength:'NOT_IMPLEMENTED',m3FinalInterpretationGate:'BLOCKED_UNCHANGED',apiRequests:0,networkProbeChecks:guard.probes,allPreservedInputsUnchanged:true,verification:'STRUCTURAL_LINKAGE_AND_EXISTING_M2_CONSISTENCY_NOT_TRADITIONAL_EFFECT_OR_PREDICTION_CERTIFICATION',notVerified:['final strength or seasonal/root/relation efficacy','critical editions/scans/rights','historical birth support or expanded years','predictions, score, structure or useful-god','default engine/G0 integration or deployment']};
    const execution={startedAt,completedAt:new Date().toISOString(),node:process.version,processTZ:process.env.TZ??null,resolvedHostTimezone:Intl.DateTimeFormat().resolvedOptions().timeZone,codeSha,workingTreeDirty:dirty,executedFiles:beforeFiles,keysAbsentAtExecution:!Object.keys(process.env).some(key=>/KASI|API_KEY|SERVICE_KEY|DATAGO/i.test(key)),removedKeyNames:removedKeys,command:{executable:process.execPath,arguments:process.argv.slice(1)},summaryContentSha256:fingerprint(summary)};
    await mkdir(state.out,{mode:0o700});await writeFile(join(state.out,'summary.json'),JSON.stringify(summary,null,2)+'\n',{flag:'wx',mode:0o600});await writeFile(join(state.out,'execution.json'),JSON.stringify(execution,null,2)+'\n',{flag:'wx',mode:0o600});
    console.log(JSON.stringify({summary,execution},null,2));return summary;
  }finally{guard.restore();}
}
if(process.argv[1]&&import.meta.url===pathToFileURL(resolve(process.argv[1])).href){
  try{assert.equal(process.argv.length,4,'Usage: node scripts/kasi/local-m3-evidence-verify.mjs <candidateDir> <freshPrivateOutputDir>');await runM3EvidenceAcceptance(process.argv[2],process.argv[3]);}
  catch(error){console.error('M3_EVIDENCE_ACCEPTANCE_REJECTED',error.code??error.name,error.message);process.exitCode=1;}
}
