/** Offline, streaming acceptance of the selected pre18 policy. All birth inputs are artificial. */
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
import {BASELINE_MANIFEST_SHA256,MODERN_PROFILE_ID,MODERN_CLOCK_POLICY_ID,createLocalChartProfile,loadLocalChartProfile,getLocalChartEventContext} from './local-chart.mjs';
import {modernExplanationGrid} from './local-explain-verify.mjs';
import {M2_LOCAL_PROFILE_ID} from './local-chart-facts.mjs';
import {createLocalM3EvidenceProfile,deriveLocalM3SeasonalJudgments,validateLocalM3SeasonalJudgments,validateLocalM3EvidenceResult,M3_LOCAL_PROFILE_ID,M3_SEASONAL_SILI_POLICY_ID,M3_SEASONAL_POLICY_ID} from './local-m3-evidence.mjs';
import {resolveSeasonalState} from '../../dist/m3/seasonalStateV1.js';
import {createLocalLuckProfile,M7_LUCK_POLICY_V01} from './local-luck.mjs';
import {projectLocalLuckResult} from './local-luck-projection.mjs';
import {CALENDAR_PROJECTION_POLICY_V02} from '../../dist/luck/calendarProjectionV02.js';
import {loadKasi2027BoundarySupplement} from './boundary-supplement.mjs';
import {STEM_NATURE} from '../../dist/domain/stems.js';
import {DAY_ROLLOVER_POLICIES} from '../../dist/calendar/dayRollover.js';
import {HOUR_STEM_REFERENCE_POLICIES} from '../../dist/calendar/dayHourPillars.js';
import {MONTH_BOUNDARY_JIE} from '../../dist/calendar/monthPillar.js';

const root=resolve(dirname(fileURLToPath(import.meta.url)),'../..');
const exportPin='7b5584aca339b85c7e54e953c43b672358bda605a478831b6f260df00472e851';
const pins={candidateA:'b2a2560d2d6324554e8bacf4f34e5a788cddabe71e99843b3b6dcb6876a89bed',candidateB:'b143a6cd766a9d0c0e763f93aba1236db68a29c2a5e71a89647e0371dbca6584',completedInput:'82c5a30c679ac743c0c89a0192ce2cf21a42387fd4ad8cbb6847a4db18866567',boundarySupplement:'47fdc994a0eb7834cf99c63bafb6d23121a1aa490b0370485690eefaa149d5c9'};
const supplementPin='f6a0e6dd2b169b4e758f8d1326942556c59f569af714adcb36e73824c6ef02b7';
const git=args=>execFileSync('git',['-c','safe.directory='+root.replaceAll('\\','/'),...args],{cwd:root,encoding:'utf8',stdio:['ignore','pipe','pipe']}).trim();
const inside=(parent,child)=>{const p=relative(parent,child);return p!==''&&!p.startsWith('..')&&!isAbsolute(p);};
const lunar=row=>({lunarYear:row.lunarYear,lunarMonth:row.lunarMonth,lunarDay:row.lunarDay,leap:row.leap});
const files=['scripts/kasi/local-m3-seasonal-v2-verify.mjs','scripts/kasi/local-m3-evidence.mjs','scripts/kasi/local-chart.mjs','scripts/kasi/local-chart-facts.mjs','scripts/kasi/local-explain-verify.mjs','scripts/kasi/local-luck.mjs','scripts/kasi/local-luck-projection.mjs','scripts/kasi/boundary-supplement.mjs','scripts/kasi/candidate.mjs','scripts/kasi/research.mjs','src/m3/structuralEvidenceV1.ts','dist/m3/structuralEvidenceV1.js','src/m3/seasonalStateV1.ts','dist/m3/seasonalStateV1.js','src/m3/seasonalStateV2.ts','dist/m3/seasonalStateV2.js','src/luck/luckV01.ts','dist/luck/luckV01.js','src/luck/calendarProjectionV02.ts','dist/luck/calendarProjectionV02.js','src/calendar/koreanLunisolarValidation.ts','dist/calendar/koreanLunisolarValidation.js'];
const fileHashes=()=>Promise.all(files.map(async path=>({path,sha256:sha(await readFile(join(root,path)))})));

async function protect(inputDirectory,outputDirectory){
  const privateRoot=await realpath(join(root,'.private')),input=await realpath(resolve(inputDirectory)),out=resolve(outputDirectory);
  assert.ok(inside(privateRoot,input)&&inside(privateRoot,out));assert.equal(await realpath(dirname(out)),dirname(out));
  const dirs=new Map([['providedCandidate',input],['candidateA',await realpath(join(privateRoot,'kasi-research-1950-2026-fe84ab4-a'))],['candidateB',await realpath(join(privateRoot,'kasi-research-1950-2026-fe84ab4-b'))],['completedInput',await realpath(join(privateRoot,'kasi-local-1950-2026/monthly-xml'))],['boundarySupplement',await realpath(join(privateRoot,'kasi-2027-boundary-00379e9-20261111-b'))]]),before=new Map(),cache=new Map();
  for(const [name,path]of dirs){assert.ok(out!==path&&!inside(path,out)&&!inside(out,path),'Fresh private output must not overlap inputs');if(!cache.has(path))cache.set(path,fingerprint(await inventory(path)));before.set(name,cache.get(path));}
  for(const [name,pin]of Object.entries(pins))assert.equal(before.get(name),pin,'Independently pinned '+name+' changed');
  assert.equal(sha(await readFile(join(dirs.get('completedInput'),'export.json'))),exportPin);
  const loaded=await loadCandidate(input,BASELINE_MANIFEST_SHA256);await loadCandidate(dirs.get('candidateB'),BASELINE_MANIFEST_SHA256);
  // Audit preservation only: this supplement is never provided to the seasonal product profile.
  await loadKasi2027BoundarySupplement({directory:dirs.get('boundarySupplement'),expectedSupplementSha256:supplementPin,expectedBaseManifestSha256:BASELINE_MANIFEST_SHA256});
  return {input,out,dirs,before,loaded};
}
async function unchanged(state){const cache=new Map();for(const [name,path]of state.dirs){if(!cache.has(path))cache.set(path,fingerprint(await inventory(path)));assert.equal(cache.get(path),state.before.get(name),name+' changed');}}
function offline(){
  const original={fetch:globalThis.fetch,connect:net.Socket.prototype.connect,httpRequest:http.request,httpGet:http.get,httpsRequest:https.request,httpsGet:https.get,tlsConnect:tls.connect};
  let attempts=0;const denied=()=>{attempts++;throw new Error('OFFLINE_M3_SILI_NETWORK_DENIED');};
  globalThis.fetch=denied;net.Socket.prototype.connect=denied;http.request=denied;http.get=denied;https.request=denied;https.get=denied;tls.connect=denied;
  assert.throws(()=>globalThis.fetch('https://invalid.example'),/OFFLINE_M3_SILI_NETWORK_DENIED/);assert.throws(()=>net.Socket.prototype.connect.call({},443,'invalid.example'),/OFFLINE_M3_SILI_NETWORK_DENIED/);const probes=attempts;
  return {probes,check(){assert.equal(attempts,probes,'Product must make no network requests');},restore(){globalThis.fetch=original.fetch;net.Socket.prototype.connect=original.connect;http.request=original.httpRequest;http.get=original.httpGet;https.request=original.httpsRequest;https.get=original.httpsGet;tls.connect=original.tlsConnect;}};
}

// Independent literal contract, never generated by the production classification table/helper.
const cells={SPRING:{WOOD:'WANG',FIRE:'XIANG',EARTH:'SI',METAL:'QIU',WATER:'XIU'},SUMMER:{WOOD:'XIU',FIRE:'WANG',EARTH:'XIANG',METAL:'SI',WATER:'QIU'},AUTUMN:{WOOD:'SI',FIRE:'QIU',EARTH:'XIU',METAL:'WANG',WATER:'XIANG'},WINTER:{WOOD:'XIANG',FIRE:'SI',EARTH:'QIU',METAL:'XIU',WATER:'WANG'},EARTH_DOMINANT:{WOOD:'QIU',FIRE:'XIU',EARTH:'WANG',METAL:'XIANG',WATER:'SI'}};
const normal={寅:'SPRING',卯:'SPRING',巳:'SUMMER',午:'SUMMER',申:'AUTUMN',酉:'AUTUMN',亥:'WINTER',子:'WINTER'};
const ending={辰:{season:'SPRING',term:'LIXIA'},未:{season:'SUMMER',term:'LIQIU'},戌:{season:'AUTUMN',term:'LIDONG'},丑:{season:'WINTER',term:'LICHUN'}};
const sides={DEFINITE:'BETWEEN_PUBLISHED_BOUNDARIES',BEFORE_PUBLISHED_MINUTE:'BEFORE_PUBLISHED_BOUNDARY',AFTER_PUBLISHED_MINUTE:'AFTER_PUBLISHED_BOUNDARY'};
function shifted(value,delta){const [y,m,d,h,n]=value.match(/\d+/g).map(Number);return new Date(Date.UTC(y,m-1,d,h,n+delta)).toISOString().slice(0,16);}
const policies=()=>DAY_ROLLOVER_POLICIES.flatMap(dayRollover=>HOUR_STEM_REFERENCE_POLICIES.map(hourStemReference=>({clockPolicyId:MODERN_CLOCK_POLICY_ID,dayRollover,hourStemReference})));
export function* pre18BoundaryGrid(context,{years=null}={}){
  for(const event of context.events)if(Number(event.displayedDateTime.slice(0,4))>=1989&&(years===null||years.includes(Number(event.displayedDateTime.slice(0,4))))&&['LICHUN','LIXIA','LIQIU','LIDONG'].includes(event.term)){
    const boundary=shifted(event.displayedDateTime,-25920);
    for(const delta of [-1,0,1])for(const policy of policies())yield {minute:shifted(boundary,delta),category:'pre18BoundaryCases',policy,event,delta,boundary};
  }
}
function counts(){return {dailyCases:0,jieBeforeAtAfterCases:0,calendarBoundaryCases:0,pre18BoundaryCases:0,inputPairs:0,productCalls:0,birthM1Calls:0,parentCandidates:0,seasonalAlternatives:0,statuses:{RESOLVED_UNDER_POLICY:0,AMBIGUOUS:0,NEEDS_DATA:0},alternativeSeasons:{SPRING:0,SUMMER:0,AUTUMN:0,WINTER:0,EARTH_DOMINANT:0},alternativeDayMasterStates:{WANG:0,XIANG:0,XIU:0,QIU:0,SI:0},legacyNormalMonthComparisons:0,legacyHeldMonthComparisons:0,m3EvidenceRefs:0,m2FactRefs:0,calculationSourceRefs:0,explanationItems:0,pre18SameMinuteParents:0,publishedSiliTwoParentRequests:0,nominalBoundaryDiffersFromSPlus12:0,semanticComparisons:0};}
function seasonalMeaning(value){return {schemaVersion:value.schemaVersion,policy:{id:value.policy.id,version:value.policy.version},validation:value.validation,candidates:value.candidates.map(item=>{const {policy,...j}=item.judgment;return {...item,judgment:{...j,policy:{id:policy.id,version:policy.version}}};}),calculationSources:value.calculationSources};}
export function seasonalSiliMeaning(result){return {status:result.status,profileId:result.m1.profile.id,manifestSha256:result.m1.dataset.candidateManifestContentSha256,policies:result.m1.policies,chart:result.m1.chart,structural:{status:result.evidence.status,finalStrength:result.evidence.finalStrength,candidates:result.evidence.candidates},seasonal:seasonalMeaning(result.seasonal)};}
function preparedOracle(context){const jie=context.events.filter(e=>MONTH_BOUNDARY_JIE.includes(e.term));return {jie,events:new Map(jie.map(e=>[e.displayedDateTime+':'+e.term,e])),calendarSources:new Map(context.evidence.map(e=>[e.id,e]))};}
function checkResult(result,oracle,count){
  validateLocalM3EvidenceResult(result);assert.equal(result.status,'EVIDENCE_ONLY');assert.equal(result.evidence.finalStrength.status,'NOT_IMPLEMENTED');assert.equal(result.validation.m3FinalInterpretationGate,'BLOCKED_UNCHANGED');
  assert.equal(result.m1.dataset.candidateManifestContentSha256,BASELINE_MANIFEST_SHA256);assert.equal(result.executionCounts.birthM1Calls,1);assert.equal(result.executionCounts.m2Derivations,1);
  const selected=result.seasonal;assert.equal(selected.policy.id,M3_SEASONAL_SILI_POLICY_ID);assert.equal(selected.candidates.length,result.m1.chart.candidates.length);assert.equal(selected.candidates.length,result.evidence.candidates.length);
  const {jie,events,calendarSources}=oracle,extra=new Map(selected.calculationSources.map(e=>[e.id,e]));
  const natalCalendarSources=new Map(result.evidence.sources.filter(source=>source.kind==='CALENDAR_API').map(source=>[source.id,source]));
  const conversion=result.m1.evidence.dateConversion,dateSourceId='KASI_OPENAPI_RESPONSE_DATE:'+conversion.sourceRef+':'+conversion.observed.solarDate;
  const birth=result.m1.input.gregorianDate+'T'+result.m1.input.time;
  for(let i=0;i<selected.candidates.length;i++){
    const item=selected.candidates[i],j=item.judgment,view=item.explanation,natal=result.m1.chart.candidates[i],evidence=result.evidence.candidates[i],trace=result.m1.chart.monthBoundaryTrace.candidateContexts[i],ref='chart.candidates['+i+']',month=evidence.evidence.find(e=>e.kind==='MONTH_CONTEXT');
    const facts=new Map(result.facts.candidates[i].facts.map(f=>[f.id,f]));assert.equal(item.candidateRef,ref);assert.equal(j.candidateRef,ref);assert.equal(j.dayMaster,natal.day.stem);assert.equal(j.dayMasterElement,STEM_NATURE[natal.day.stem].element);assert.equal(j.monthBranch,natal.month.branch);
    assert.deepEqual(j.input.base.evidenceRefs,[month.id]);assert.deepEqual(j.input.base.inputFactRefs,month.inputFactRefs);assert.deepEqual(j.input.base.appliedJie,evidence.monthContext.activeSince);assert.deepEqual(j.input.base.calculationSourceRefs,month.calculationSourceRefs);assert.equal(j.input.birthDateTime,birth);assert.equal(j.input.monthCondition,sides[trace.boundarySide]);
    assert.equal(evidence.monthContext.season.status,'UNRESOLVED');assert.equal(evidence.relationContext.effectStatus,'UNRESOLVED');assert.equal(j.finalStrength.status,'NOT_IMPLEMENTED');assert.equal(j.finalStrength.releaseGate,'M3_FINAL_BLOCKED_UNCHANGED');
    for(const id of j.inputEvidenceRefs){assert.ok(evidence.evidence.some(e=>e.id===id&&e.candidateRef===ref));count.m3EvidenceRefs++;}for(const id of j.inputFactRefs){assert.equal(facts.get(id)?.candidateRef,ref);count.m2FactRefs++;}
    const legacy=resolveSeasonalState(j.input.base,{policyId:M3_SEASONAL_POLICY_ID});
    let expectedSeasons;
    if(normal[j.monthBranch]){
      assert.equal(j.nextSili,null);assert.equal(j.derivedBoundary,null);assert.equal(j.status,'RESOLVED_UNDER_POLICY');expectedSeasons=[normal[j.monthBranch]];
      assert.equal(j.season,legacy.season);assert.equal(j.seasonalState,legacy.seasonalState);assert.deepEqual(j.elementStates,legacy.elementStates);count.legacyNormalMonthComparisons++;
    }else{
      assert.equal(legacy.status,'POLICY_UNRESOLVED');assert.equal(legacy.reason,'EARTH_MONTH_POLICY_NOT_SELECTED');count.legacyHeldMonthComparisons++;
      const s=events.get(trace.activeSince.displayedDateTime+':'+trace.activeSince.term);assert.ok(s);const t=jie[jie.indexOf(s)+1],rule=ending[j.monthBranch];
      assert.equal(t?.term,rule.term,'The immediately next Jie must be the exact ending Sili');assert.equal(t.displayedDateTime.slice(0,4),s.displayedDateTime.slice(0,4));assert.deepEqual(j.nextSili,t);
      const boundary=shifted(t.displayedDateTime,-25920);assert.ok(s.displayedDateTime<boundary&&boundary<t.displayedDateTime);assert.equal(j.derivedBoundary.displayedDateTime,boundary);assert.equal(j.derivedBoundary.offsetNominalMinutes,-25920);assert.equal(j.derivedBoundary.sourceKind,'DERIVED_PROJECT_BOUNDARY_NOT_PUBLISHED_KASI_TERM');assert.deepEqual(j.derivedBoundary.calculationSourceRefs,t.sourceIds);
      if(shifted(s.displayedDateTime,17280)!==boundary)count.nominalBoundaryDiffersFromSPlus12++;
      for(const id of t.sourceIds){assert.deepEqual(extra.get(id),calendarSources.get(id));assert.equal(extra.get(id).original.termCode,t.term);assert.equal(extra.get(id).source.evidenceSurface,'KASI_OPENAPI_RESPONSE');}
      expectedSeasons=birth<boundary?[rule.season]:birth===boundary?[rule.season,'EARTH_DOMINANT']:['EARTH_DOMINANT'];
      assert.equal(j.status,birth===boundary?'AMBIGUOUS':'RESOLVED_UNDER_POLICY');if(birth===boundary){assert.equal(j.season,null);assert.equal(j.seasonalState,null);assert.equal(result.m1.chart.candidates.length,1,'B branches season only, never creates M1 candidates');count.pre18SameMinuteParents++;}
    }
    assert.deepEqual(j.alternatives.map(a=>a.season),expectedSeasons);assert.equal(j.missingData.length,0);
    for(const alt of j.alternatives){assert.equal(alt.parentCandidateRef,ref);assert.deepEqual(alt.elementStates,cells[alt.season]);assert.equal(alt.seasonalState,cells[alt.season][j.dayMasterElement]);count.alternativeSeasons[alt.season]++;count.alternativeDayMasterStates[alt.seasonalState]++;count.seasonalAlternatives++;}
    if(j.status==='RESOLVED_UNDER_POLICY'){assert.equal(j.season,j.alternatives[0].season);assert.equal(j.seasonalState,j.alternatives[0].seasonalState);}
    for(const id of j.calculationSourceRefs){assert.ok(calendarSources.has(id)||natalCalendarSources.has(id));if(!calendarSources.has(id)){assert.equal(id,dateSourceId);assert.equal(conversion.source.evidenceSurface,'KASI_OPENAPI_RESPONSE');}assert.ok(!j.literatureSourceRefs.includes(id));count.calculationSourceRefs++;}
    assert.equal(view.candidateRef,ref);assert.equal(view.judgmentRef,j.id);assert.deepEqual(view.evidenceRefs,j.inputEvidenceRefs);assert.deepEqual(view.inputFactRefs,j.inputFactRefs);assert.deepEqual(view.calculationSourceRefs,j.calculationSourceRefs);
    for(const entry of view.items){assert.equal(entry.candidateRef,ref);assert.deepEqual(entry.judgmentRefs,[j.id]);assert.ok(entry.alternativeRefs.every(id=>j.alternatives.some(a=>a.id===id)));assert.deepEqual(entry.inputEvidenceRefs,j.inputEvidenceRefs);assert.ok(entry.text.length);count.explanationItems++;}
    count.parentCandidates++;count.statuses[j.status]++;
  }
  if(result.m1.chart.candidates.length===2&&['LICHUN','LIXIA','LIQIU','LIDONG'].includes(result.m1.chart.monthBoundaryTrace.atPublishedBoundary?.term)){
    assert.deepEqual(selected.candidates.map(c=>c.judgment.alternatives.length),[1,1]);assert.equal(selected.candidates[0].judgment.season,'EARTH_DOMINANT');assert.notEqual(selected.candidates[1].judgment.season,'EARTH_DOMINANT');count.publishedSiliTwoParentRequests++;
  }
}

export async function runSeasonalSiliAcceptance(candidateDirectory,outputDirectory,{benchmarkPairs=null,boundaryOnly=false,boundaryYears=null}={}){
  assert.ok(benchmarkPairs===null||Number.isInteger(benchmarkPairs)&&benchmarkPairs>=1&&benchmarkPairs<=100);assert.equal(typeof boundaryOnly,'boolean');
  assert.ok(boundaryYears===null||boundaryOnly&&Array.isArray(boundaryYears)&&boundaryYears.length>0&&new Set(boundaryYears).size===boundaryYears.length&&boundaryYears.every(y=>Number.isInteger(y)&&y>=1989&&y<=2026));
  const guard=offline(),removedKeyNames=[];for(const name of Object.keys(process.env))if(/KASI|API_KEY|SERVICE_KEY|DATAGO/i.test(name)){delete process.env[name];removedKeyNames.push(name);}
  try{
    const startedAt=new Date().toISOString(),codeSha=git(['rev-parse','HEAD']),workingTreeDirty=git(['status','--porcelain']).length>0,beforeFiles=await fileHashes(),state=await protect(candidateDirectory,outputDirectory),{candidate,index}=state.loaded;
    const chart=createLocalChartProfile(state.loaded,{profileId:MODERN_PROFILE_ID,expectedManifestSha256:BASELINE_MANIFEST_SHA256}),context=getLocalChartEventContext(chart),oracle=preparedOracle(context);let actualM1Calls=0;
    const spy={...chart,calculate(request){actualM1Calls++;return chart.calculate(request);}},profile=createLocalM3EvidenceProfile(spy,{contextProfile:chart,m2ProfileId:M2_LOCAL_PROFILE_ID,m3ProfileId:M3_LOCAL_PROFILE_ID,seasonalPolicyId:M3_SEASONAL_SILI_POLICY_ID});
    const contexts=new Map();for(let year=1989;year<=2026;year++)contexts.set(year,chart.eventsForYear(year));
    const total=counts(),grid=counts(),hashes={gregorian:createHash('sha256'),lunar:createHash('sha256')};
    const calculate=(request,counter)=>{const before=actualM1Calls,result=profile.calculate(request);assert.equal(actualM1Calls-before,1);counter.productCalls++;counter.birthM1Calls++;return result;};
    const generators=boundaryOnly?[pre18BoundaryGrid(context,{years:boundaryYears})]:[modernExplanationGrid(candidate,contexts),pre18BoundaryGrid(context)];
    outer:for(const generator of generators)for(const item of generator){
      const date=item.minute.slice(0,10),time=item.minute.slice(11),row=index.fromGregorianDate(date).value;assert.ok(row);
      const g=calculate({calendar:'GREGORIAN',date,time,policies:item.policy},grid),l=calculate({calendar:'KOREAN_LUNAR',lunarDate:lunar(row),time,policies:item.policy},grid);
      for(const value of [g,l])checkResult(value,oracle,grid);assert.equal(g.m1.input.gregorianDate,date);assert.equal(l.m1.input.gregorianDate,date);assert.equal(g.m1.evidence.dateConversion.method,'GREGORIAN_WITH_API_OBSERVED_DATE_EVIDENCE');assert.equal(l.m1.evidence.dateConversion.method,'API_OBSERVED_DATE_INDEX');
      const gm=seasonalSiliMeaning(g),lm=seasonalSiliMeaning(l);assert.deepEqual(gm,lm,'Equivalent calendar inputs must preserve natal/structural/seasonal meaning and refs');
      hashes.gregorian.update(canonical({category:item.category,policy:item.policy,meaning:gm})+'\n');hashes.lunar.update(canonical({category:item.category,policy:item.policy,meaning:lm})+'\n');
      grid[item.category]++;grid.inputPairs++;grid.semanticComparisons++;
      if(item.category==='pre18BoundaryCases'&&item.delta===0){assert.equal(g.m1.chart.candidates.length,1);assert.equal(g.seasonal.candidates[0].judgment.alternatives.length,2);}
      if(grid.inputPairs%1000===0)console.error('M3_SILI_PROGRESS',JSON.stringify({pairs:grid.inputPairs,parentCandidates:grid.parentCandidates,seasonalAlternatives:grid.seasonalAlternatives,statuses:grid.statuses}));
      if(benchmarkPairs!==null&&grid.inputPairs>=benchmarkPairs)break outer;
    }
    if(benchmarkPairs===null){assert.equal(grid.pre18BoundaryCases,(boundaryYears?.length??38)*48);if(!boundaryOnly){assert.equal(grid.dailyCases,13879);assert.equal(grid.jieBeforeAtAfterCases,5472);assert.equal(grid.calendarBoundaryCases,28624);assert.equal(grid.inputPairs,49799);}else assert.equal(grid.inputPairs,(boundaryYears?.length??38)*48);}
    const extras={alternation:0,mutationIsolation:0,negativeLoaders:0,standaloneSeasonalReuses:0,independentM7BirthM1Calls:0,independentM7Contexts:0};
    if(benchmarkPairs===null){
      const request=(date,time='12:00',policy=policies()[0])=>({calendar:'GREGORIAN',date,time,policies:policy});
      for(let year=1989;year<=2026;year++){
        const req=request(year+'-01-20','23:30',policies()[(year-1989)%4]),first=calculate(req,total),expected=fingerprint(seasonalSiliMeaning(first));checkResult(first,oracle,total);
        calculate(request((year===2026?1989:2026)+'-07-20'),total);assert.equal(fingerprint(seasonalSiliMeaning(calculate(req,total))),expected);extras.alternation++;
        assert.throws(()=>{first.seasonal.candidates[0].judgment.season='MODIFIED';},TypeError);const forged=structuredClone(first.seasonal);forged.candidates[0].judgment.derivedBoundary.displayedDateTime='MODIFIED';assert.throws(()=>validateLocalM3SeasonalJudgments(forged,{evidence:first.evidence}));
        assert.equal(fingerprint(seasonalSiliMeaning(calculate(req,total))),expected);extras.mutationIsolation++;
      }
      const baseline=calculate(request('1990-06-01'),total),expected=fingerprint(seasonalMeaning(baseline.seasonal));
      const luckSpy={...chart,calculate(req){extras.independentM7BirthM1Calls++;return chart.calculate(req);}},luck=createLocalLuckProfile(luckSpy,{contextProfile:chart,luckPolicyId:M7_LUCK_POLICY_V01,m2ProfileId:M2_LOCAL_PROFILE_ID});
      for(const sex of ['MALE','FEMALE']){
        const m7=luck.calculate(request('1990-06-01'),{dayun:{traditionalSex:sex,count:10},seyun:{yearLabel:2026}});extras.independentM7Contexts++;
        for(const projected of [false,true]){
          if(projected)projectLocalLuckResult(m7,{calendarProjectionPolicyId:CALENDAR_PROJECTION_POLICY_V02,asOfMinute:sex==='MALE'?'2026-01-01T12:00':'2026-11-01T12:00'});
          const before=actualM1Calls,value=deriveLocalM3SeasonalJudgments(baseline.evidence,{seasonalPolicyId:M3_SEASONAL_SILI_POLICY_ID});assert.equal(fingerprint(seasonalMeaning(value)),expected);assert.equal(actualM1Calls,before);extras.standaloneSeasonalReuses++;
        }
      }
      for(const options of [{directory:state.input,expectedManifestSha256:'0'.repeat(64)},{directory:join(root,'.private','INTENTIONALLY_ABSENT_SILI_V2_CANDIDATE'),expectedManifestSha256:BASELINE_MANIFEST_SHA256}]){await assert.rejects(()=>loadLocalChartProfile({...options,profileId:MODERN_PROFILE_ID}));extras.negativeLoaders++;}
    }
    assert.equal(actualM1Calls,grid.productCalls+total.productCalls);assert.equal(extras.independentM7BirthM1Calls,extras.independentM7Contexts);guard.check();await unchanged(state);assert.deepEqual(await fileHashes(),beforeFiles);assert.equal(git(['rev-parse','HEAD']),codeSha);assert.equal(git(['status','--porcelain']).length>0,workingTreeDirty);
    const semanticDigests=Object.fromEntries(Object.entries(hashes).map(([name,hash])=>[name,hash.digest('hex')]));assert.equal(semanticDigests.gregorian,semanticDigests.lunar);
    const summary={schemaVersion:'kasi-m3-seasonal-sili-linkage-acceptance-v02',status:benchmarkPairs!==null?'BENCHMARK_ONLY_NOT_FULL_ACCEPTANCE':boundaryOnly?'NEW_BOUNDARIES_ONLY_NOT_FULL_ACCEPTANCE':'MODERN_M3_SEASONAL_SILI_LINKAGE_PASS',gridMode:{benchmarkPairs,boundaryOnly,boundaryYears},inputNature:'ARTIFICIAL_GRID_NOT_PERSONAL_BIRTH_RECORDS',seasonalPolicyId:M3_SEASONAL_SILI_POLICY_ID,seasonalPolicyVersion:'0.2.0',manifestContentSha256:BASELINE_MANIFEST_SHA256,exportSha256:exportPin,preservedTrees:Object.fromEntries(state.before),supplement:{contentSha256:supplementPin,preservationAuditOnly:true,passedToProduct:false},gridCounts:grid,additionalCounts:total,extras,allProductBirthM1Calls:actualM1Calls,semanticDigests,apiRequests:0,keysUsed:0,networkProbeChecks:guard.probes,allPreservedInputsUnchanged:true,verification:'INDEPENDENT_LITERAL_25_CELLS_AND_NOMINAL_BOUNDARY_ARITHMETIC_PLUS_ACTUAL_M1_M2_M3_LINKAGE_NOT_TRADITIONAL_OR_PREDICTIVE_CERTIFICATION',finalStrength:'NOT_IMPLEMENTED',m3FinalInterpretationGate:'BLOCKED_UNCHANGED',unverified:['scans/critical editions/rights','physical qi or true birth/event seconds','final strength, commanding days, effective roots, relation efficacy, fortune','expanded birth/query/historical policy','default/G0 integration']};
    const execution={startedAt,completedAt:new Date().toISOString(),codeSha,workingTreeDirty,node:process.version,processTZ:process.env.TZ??null,resolvedHostTimezone:Intl.DateTimeFormat().resolvedOptions().timeZone,executedFiles:beforeFiles,keysAbsentAtExecution:!Object.keys(process.env).some(k=>/KASI|API_KEY|SERVICE_KEY|DATAGO/i.test(k)),removedKeyNames,command:{executable:process.execPath,arguments:process.argv.slice(1)},summaryContentSha256:fingerprint(summary)};
    await mkdir(state.out,{mode:0o700});await writeFile(join(state.out,'summary.json'),JSON.stringify(summary,null,2)+'\n',{flag:'wx',mode:0o600});await writeFile(join(state.out,'execution.json'),JSON.stringify(execution,null,2)+'\n',{flag:'wx',mode:0o600});console.log(JSON.stringify({summary,execution},null,2));return summary;
  }finally{guard.restore();}
}
if(process.argv[1]&&import.meta.url===pathToFileURL(resolve(process.argv[1])).href){try{const args=process.argv.slice(2);assert.ok(args.length===2,'Usage: node scripts/kasi/local-m3-seasonal-v2-verify.mjs <candidateDir> <freshPrivateOutputDir>');await runSeasonalSiliAcceptance(args[0],args[1]);}catch(error){console.error('M3_SILI_ACCEPTANCE_REJECTED',error.code??error.name,error.message);process.exitCode=1;}}
