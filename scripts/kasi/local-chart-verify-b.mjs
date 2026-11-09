/** Private modern-profile acceptance; synthetic birth grid, no personal records. */
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFile, realpath, mkdir, writeFile } from 'node:fs/promises';
import { execFileSync } from 'node:child_process';
import { dirname, isAbsolute, join, relative, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { canonical, fingerprint, sha } from '../../.kasi-build/schema.js';
import { loadCandidate } from './candidate.mjs';
import { inventory } from './research.mjs';
import { BASELINE_MANIFEST_SHA256, STAGE_A_PROFILE_ID, MODERN_PROFILE_ID, MODERN_CLOCK_POLICY_ID, loadLocalChartProfile } from './local-chart.mjs';
import { chartSemantics } from './local-chart-verify-a.mjs';
import { resolveCoverageCheckedModernKoreanCivilFourPillars } from '../../dist/calendar/fourPillars.js';
import { DAY_ROLLOVER_POLICIES } from '../../dist/calendar/dayRollover.js';
import { HOUR_STEM_REFERENCE_POLICIES } from '../../dist/calendar/dayHourPillars.js';
import { MONTH_BOUNDARY_JIE } from '../../dist/calendar/monthPillar.js';
import { sexagenaryYearForCivilYear } from '../../dist/calendar/yearPillar.js';
import { gregorianDayNumber as day, gregorianDateFromDayNumber as civil, monthKey } from '../../dist/calendar/koreanLunisolarValidation.js';

const root=resolve(dirname(fileURLToPath(import.meta.url)),'../..');
const exportSha='7b5584aca339b85c7e54e953c43b672358bda605a478831b6f260df00472e851';
const inDirectory=(parent,child)=>{const path=relative(parent,child);return path!==''&&!path.startsWith('..')&&!isAbsolute(path);};
const git=args=>execFileSync('git',['-c','safe.directory='+root.replaceAll('\\','/'),...args],{cwd:root,encoding:'utf8',stdio:['ignore','pipe','pipe']}).trim();
const lunarDate=row=>({lunarYear:row.lunarYear,lunarMonth:row.lunarMonth,lunarDay:row.lunarDay,leap:row.leap});
const monthId=row=>monthKey(row.lunarYear,row.lunarMonth,row.leap);
function shiftedMinute(minute,delta) {
  const [year,month,date,hour,minutes]=minute.match(/\d+/g).map(Number);
  return new Date(Date.UTC(year,month-1,date,hour,minutes+delta)).toISOString().slice(0,16);
}

export async function runStageB(candidateDirectory,outputDirectory) {
  const privateRoot=await realpath(join(root,'.private')),input=await realpath(resolve(candidateDirectory)),out=resolve(outputDirectory);
  assert.ok(inDirectory(privateRoot,input));
  assert.ok(inDirectory(privateRoot,out)&&out!==input&&!inDirectory(input,out)&&!inDirectory(out,input),'Use a fresh, separate private output directory');
  assert.equal(await realpath(dirname(out)),dirname(out),'Output parent must exist without symlink');
  const baselineA=await realpath(join(privateRoot,'kasi-research-1950-2026-fe84ab4-a'));
  const baselineB=await realpath(join(privateRoot,'kasi-research-1950-2026-fe84ab4-b'));
  const original=await realpath(join(privateRoot,'kasi-local-1950-2026/monthly-xml'));
  for(const protectedDirectory of [baselineA,baselineB,original])assert.ok(out!==protectedDirectory&&!inDirectory(protectedDirectory,out)&&!inDirectory(out,protectedDirectory),'Output must not overlap preserved data');
  const protectedDirectories=new Map([['providedCandidate',input],['candidateA',baselineA],['candidateB',baselineB],['completedInput',original]]),before=new Map();
  for(const [name,path] of protectedDirectories)before.set(name,await inventory(path));
  assert.equal(sha(await readFile(join(original,'export.json'))),exportSha);
  const loaded=await loadCandidate(input,BASELINE_MANIFEST_SHA256);
  const other=await loadCandidate(baselineB,BASELINE_MANIFEST_SHA256);
  assert.equal(fingerprint(other.manifest),fingerprint(loaded.manifest));
  assert.equal(fingerprint(before.get('completedInput')),loaded.manifest.inputTreeSha256,'Completed input tree must match the independently pinned manifest');
  const profile=await loadLocalChartProfile({directory:input,expectedManifestSha256:BASELINE_MANIFEST_SHA256,profileId:MODERN_PROFILE_ID});
  const stageA=await loadLocalChartProfile({directory:input,expectedManifestSha256:BASELINE_MANIFEST_SHA256,profileId:STAGE_A_PROFILE_ID});
  assert.equal(profile.metadata.phase,'B');assert.equal(profile.metadata.id,MODERN_PROFILE_ID);
  assert.deepEqual(profile.metadata.birthRange,{fromInclusive:'1989-01-01',untilExclusive:'2027-01-01'});
  assert.equal(profile.metadata.auxiliaryEvents.nextYearEventsRequired,false);
  const {candidate,index,sources}=loaded,receipts=new Map(sources.map(r=>[r.id,r]));
  assert.equal(receipts.size,1001);
  for(const [id,record] of receipts){const {id:ignored,...receipt}=record;assert.equal(id,fingerprint(receipt));assert.equal(receipt.evidenceSurface,'KASI_OPENAPI_RESPONSE');}
  const rows=new Map(candidate.dates.map(row=>[row.solarDate,row])),eventRows=new Map(candidate.events.map(row=>[row.termCode+':'+row.date,row]));
  const contexts=new Map();
  for(let year=1989;year<=2026;year++){
    const context=profile.eventsForYear(year);assert.equal(context.events.length,25);
    assert.deepEqual(context.coverage.requiredYears,[year]);assert.equal(context.coverage.requiredPriorBoundary.year,year-1);
    assert.ok(context.events.every(e=>!e.displayedDateTime.startsWith('2027-')));
    contexts.set(year,context);
  }
  const guard=candidate.events.find(row=>row.termCode==='DAXUE'&&row.date.startsWith('1988-12-'));
  assert.ok(guard);assert.equal(guard.time,'06:34');
  assert.equal(contexts.get(1989).events[0].displayedDateTime,guard.date+'T'+guard.time);
  const policies=DAY_ROLLOVER_POLICIES.flatMap(dayRollover=>HOUR_STEM_REFERENCE_POLICIES.map(hourStemReference=>({clockPolicyId:MODERN_CLOCK_POLICY_ID,dayRollover,hourStemReference})));
  const basePolicy=policies.find(p=>p.dayRollover==='CIVIL_MIDNIGHT'&&p.hourStemReference==='SELECTED_DAY_PILLAR');
  assert.equal(policies.length,4);assert.ok(basePolicy);
  const counts={distinctCivilDates:0,profileYears:38,policyCombinations:4,dailyCases:0,jieBeforeAtAfterCases:0,calendarBoundaryCases:0,totalInputPairs:0,semanticComparisons:0,directExistingResolverCalls:0,appliedEvidenceChecks:0,lichunCorrelatedPairs:0,stageA2026DailyComparisons:0,leapMonthPairs:0,invalidLeapRequests:0,rejectedRequests:0,alternatingYearChecks:0,responseIsolationChecks:0,converted1988LunarAccepted:0,endExclusiveEffectiveDayChecks:0};
  const hashes={apiGregorian:createHash('sha256'),apiLunar:createHash('sha256'),directExistingResolver:createHash('sha256')};
  const stageAHashes={modern:createHash('sha256'),stageA:createHash('sha256')};

  function checkEvent(evidence,term,minute){
    const originalRow=eventRows.get(term+':'+minute.slice(0,10)),source=receipts.get(evidence.sourceRef);
    assert.ok(originalRow&&source);assert.deepEqual(evidence.original,originalRow);assert.equal(evidence.sourceRef,originalRow.sourceRef);assert.deepEqual(evidence.source,source);
    assert.equal(source.serviceId,'15012690');assert.equal(source.operation,'get24DivisionsInfo');assert.equal(source.query.year,Number(minute.slice(0,4)));
    assert.equal(originalRow.date+'T'+originalRow.time,minute);assert.equal(originalRow.timeBasis,'API_KST_AS_PUBLISHED');assert.equal(originalRow.historicalCivilTime,'NOT_RESOLVED');
    assert.deepEqual(evidence.interpreted,{displayedDateTime:minute,timeBasis:'KST',sourcePrecision:'MINUTE',clockPolicyId:MODERN_CLOCK_POLICY_ID,clockPolicyVersion:'1',utcOffsetMinutes:540,utcInstant:null});
    counts.appliedEvidenceChecks++;
  }
  function checkEvidence(result,date,time,calendar,policy,expectedProfile=MODERN_PROFILE_ID){
    assert.equal(result.status,'OK');assert.equal(result.profile.id,expectedProfile);assert.equal(result.profile.g0Receipt,null);assert.equal(result.profile.g1P2Promotion,false);
    assert.equal(result.dataset.sourceKind,'KASI_OPENAPI_RESPONSE');assert.equal(result.dataset.candidateManifestContentSha256,BASELINE_MANIFEST_SHA256);
    assert.equal(result.input.calendar,calendar);assert.equal(result.input.gregorianDate,date);assert.equal(result.input.time,time);
    assert.equal(result.policies.clock.id,MODERN_CLOCK_POLICY_ID);assert.equal(result.policies.clock.version,'1');
    assert.equal(result.policies.dayRollover.id,policy.dayRollover);assert.equal(result.policies.hourStemReference.id,policy.hourStemReference);
    const trace=result.chart.monthBoundaryTrace,evidenceById=new Map(result.evidence.appliedJie.map(e=>['KASI_OPENAPI_RESPONSE:'+e.sourceRef+':'+e.original.date+':'+e.original.termCode,e]));
    const traceEvents=[...trace.candidateContexts.map(c=>c.activeSince),...(trace.atPublishedBoundary?[trace.atPublishedBoundary]:[])];
    for(const event of traceEvents)for(const id of event.sourceIds){
      assert.ok(id.startsWith('KASI_OPENAPI_RESPONSE:'));const evidence=evidenceById.get(id);assert.ok(evidence);checkEvent(evidence,event.term,event.displayedDateTime);
    }
    assert.equal(evidenceById.size,new Set(traceEvents.flatMap(e=>e.sourceIds)).size);
    const lichun=contexts.get(Number(date.slice(0,4))).events.find(e=>e.term==='LICHUN');checkEvent(result.evidence.yearBoundary,'LICHUN',lichun.displayedDateTime);
    const row=rows.get(date),conversion=result.evidence.dateConversion,source=receipts.get(row.sourceRef);
    assert.equal(conversion.sourceRef,row.sourceRef);assert.deepEqual(conversion.source,source);assert.equal(source.serviceId,'15012679');assert.equal(source.operation,'getLunCalInfo');
    assert.equal(source.query.year,Number(date.slice(0,4)));if(source.query.month!==undefined)assert.equal(source.query.month,Number(date.slice(5,7)));
    assert.equal(conversion.calendarGanjiUsedAsPillars,false);assert.equal(conversion.method,calendar==='KOREAN_LUNAR'?'API_OBSERVED_DATE_INDEX':'GREGORIAN_WITH_API_OBSERVED_DATE_EVIDENCE');
    assert.deepEqual(conversion.observed,{solarDate:date,...lunarDate(row)});
  }
  function pair(minute,policy,category){
    const date=minute.slice(0,10),time=minute.slice(11),row=index.fromGregorianDate(date).value;
    assert.ok(row);const lunar=lunarDate(row);
    const g=profile.calculate({calendar:'GREGORIAN',date,time,policies:policy}),l=profile.calculate({calendar:'KOREAN_LUNAR',lunarDate:lunar,time,policies:policy});
    checkEvidence(g,date,time,'GREGORIAN',policy);checkEvidence(l,date,time,'KOREAN_LUNAR',policy);
    const context=contexts.get(Number(date.slice(0,4)));
    const direct=resolveCoverageCheckedModernKoreanCivilFourPillars(context.events,minute,{timeBasis:'KOREAN_CIVIL_TIME',dayRollover:policy.dayRollover,hourStemReference:policy.hourStemReference},context.coverage);
    const gs=chartSemantics(g.chart),ls=chartSemantics(l.chart),ds=chartSemantics(direct);
    assert.deepEqual(gs,ls);assert.deepEqual(gs,ds);assert.deepEqual(ls,ds);
    for(const [name,chart] of [['apiGregorian',gs],['apiLunar',ls],['directExistingResolver',ds]])hashes[name].update(canonical({category,policy,chart})+'\n');
    counts[category]++;counts.totalInputPairs++;counts.semanticComparisons+=3;counts.directExistingResolverCalls++;
    return g;
  }
  const calendarBoundaries=new Set(['1989-01-01','2026-12-31']),modernMonths=new Map();
  for(let n=day('1989-01-01');n<day('2027-01-01');n++){
    const date=civil(n),row=rows.get(date);assert.ok(row);assert.equal(index.fromLunarDate(lunarDate(row)).value,date);
    const result=pair(date+'T12:00',basePolicy,'dailyCases');counts.distinctCivilDates++;
    if(date.endsWith('-01')||civil(n+1).slice(0,7)!==date.slice(0,7)||row.lunarDay===1||row.lunarDay===row.monthDays)calendarBoundaries.add(date);
    if(!modernMonths.has(monthId(row)))modernMonths.set(monthId(row),row);
    if(date.startsWith('2026-')){
      const a=stageA.calculate({calendar:'GREGORIAN',date,time:'12:00',policies:basePolicy});checkEvidence(a,date,'12:00','GREGORIAN',basePolicy,STAGE_A_PROFILE_ID);
      const modernSemantics=chartSemantics(result.chart),aSemantics=chartSemantics(a.chart);assert.deepEqual(modernSemantics,aSemantics);
      stageAHashes.modern.update(canonical(modernSemantics)+'\n');stageAHashes.stageA.update(canonical(aSemantics)+'\n');counts.stageA2026DailyComparisons++;
    }
    if(n===day('1989-01-01')){
      assert.equal(row.lunarYear,1988);assert.equal(result.input.gregorianDate,'1989-01-01');assert.deepEqual(result.evidence.appliedJie[0].original,guard);
      const converted=profile.calculate({calendar:'KOREAN_LUNAR',lunarDate:lunarDate(row),time:'12:00',policies:basePolicy});assert.equal(converted.status,'OK');counts.converted1988LunarAccepted++;
    }
  }
  assert.equal(counts.distinctCivilDates,13879);assert.equal(counts.dailyCases,13879);assert.equal(counts.stageA2026DailyComparisons,365);
  for(let year=1989;year<=2026;year++){
    const jie=contexts.get(year).events.filter(e=>e.displayedDateTime.startsWith(year+'-')&&MONTH_BOUNDARY_JIE.includes(e.term));assert.equal(jie.length,12);
    for(const event of jie)for(const delta of [-1,0,1])for(const policy of policies){
      const result=pair(shiftedMinute(event.displayedDateTime,delta),policy,'jieBeforeAtAfterCases');
      assert.equal(result.chart.confidence,delta===0?'PUBLISHED_MINUTE_AMBIGUOUS':'DEFINITE');assert.equal(result.chart.candidates.length,delta===0?2:1);
      if(event.term==='LICHUN'&&delta===0){assert.deepEqual(result.chart.candidates.map(c=>c.year),[sexagenaryYearForCivilYear(year-1),sexagenaryYearForCivilYear(year)]);assert.deepEqual(result.chart.candidates.map(c=>c.month.branch),['丑','寅']);counts.lichunCorrelatedPairs++;}
    }
  }
  assert.equal(counts.jieBeforeAtAfterCases,38*12*3*4);assert.equal(counts.lichunCorrelatedPairs,38*4);
  for(const date of [...calendarBoundaries].sort())for(const time of ['22:59','23:00','23:59','00:00'])for(const policy of policies)pair(date+'T'+time,policy,'calendarBoundaryCases');
  const allMonthIds=new Set(candidate.months.map(monthId));
  for(const row of modernMonths.values()){
    if(row.leap){
      const leap=profile.calculate({calendar:'KOREAN_LUNAR',lunarDate:lunarDate(row),time:'12:00',policies:basePolicy});
      const regular=profile.calculate({calendar:'KOREAN_LUNAR',lunarDate:{...lunarDate(row),leap:false},time:'12:00',policies:basePolicy});
      assert.equal(leap.status,'OK');assert.equal(regular.status,'OK');assert.notEqual(leap.input.gregorianDate,regular.input.gregorianDate);
      assert.equal(rows.get(leap.input.gregorianDate).leap,true);assert.equal(rows.get(regular.input.gregorianDate).leap,false);counts.leapMonthPairs++;
    }else if(!allMonthIds.has(monthId({...row,leap:true}))){
      const bad=profile.calculate({calendar:'KOREAN_LUNAR',lunarDate:{...lunarDate(row),leap:true},time:'12:00',policies:basePolicy});assert.equal(bad.status,'INVALID_LUNAR_DATE');counts.invalidLeapRequests++;
    }
  }
  assert.ok(counts.leapMonthPairs>0&&counts.invalidLeapRequests>0);
  const gregorian=(date='2026-01-01',time='12:00',policy=basePolicy)=>({calendar:'GREGORIAN',date,time,policies:policy});
  for(const date of ['1988-12-31','1950-01-01','1949-12-31','2027-01-01']){assert.equal(profile.calculate(gregorian(date)).status,'OUT_OF_PROFILE_COVERAGE');counts.rejectedRequests++;}
  const beforeModern=rows.get('1988-12-31');assert.equal(profile.calculate({calendar:'KOREAN_LUNAR',lunarDate:lunarDate(beforeModern),time:'12:00',policies:basePolicy}).status,'OUT_OF_PROFILE_COVERAGE');counts.rejectedRequests++;
  const last=rows.get('2026-12-31');assert.equal(profile.calculate({calendar:'KOREAN_LUNAR',lunarDate:{...lunarDate(last),lunarDay:last.lunarDay+1},time:'12:00',policies:basePolicy}).status,'OUT_OF_OBSERVED_COVERAGE');counts.rejectedRequests++;
  for(const time of [undefined,null,'','24:00','12:00:00']){assert.throws(()=>profile.calculate({...gregorian(),time}),e=>e.code==='EXPLICIT_BIRTH_TIME_REQUIRED');counts.rejectedRequests++;}
  for(const date of ['2026-02-30','2001-02-29','1989-13-01','1989-1-01']){assert.throws(()=>profile.calculate(gregorian(date)));counts.rejectedRequests++;}
  for(const policy of [undefined,{}, {...basePolicy,clockPolicyId:'AUTO'},{...basePolicy,dayRollover:'AUTO'},{...basePolicy,hourStemReference:'AUTO'}]){assert.throws(()=>profile.calculate({...gregorian(),policies:policy}));counts.rejectedRequests++;}
  assert.equal(stageA.calculate(gregorian('1989-01-01')).status,'OUT_OF_PROFILE_COVERAGE');counts.rejectedRequests++;
  for(const year of [1988,2027]){assert.throws(()=>profile.eventsForYear(year),e=>e.code==='YEAR_OUT_OF_PROFILE');counts.rejectedRequests++;}
  for(const policy of policies.filter(p=>p.dayRollover==='ZI_START')){
    const result=profile.calculate(gregorian('2026-12-31','23:59',policy));assert.equal(result.status,'OK');assert.equal(result.chart.effectiveDayDate,'2027-01-01');assert.equal(result.input.gregorianDate,'2026-12-31');counts.endExclusiveEffectiveDayChecks++;
  }
  const aRequest=gregorian('2026-02-04','05:02'),aBaseline=fingerprint(stageA.calculate(aRequest));
  for(let year=1989;year<=2026;year++){
    const request=gregorian(year+'-01-01','23:30',policies[2]),first=profile.calculate(request),expected=fingerprint(first);
    checkEvidence(first,request.date,request.time,'GREGORIAN',request.policies);
    assert.equal(fingerprint(stageA.calculate(aRequest)),aBaseline);
    const later=profile.calculate(gregorian((year===2026?1989:2026)+'-12-31','12:00'));assert.equal(later.status,'OK');
    assert.equal(fingerprint(profile.calculate(request)),expected);counts.alternatingYearChecks++;
    first.evidence.appliedJie[0].original.time='MODIFIED_RETURN_VALUE';first.profile.birthRange.fromInclusive='MODIFIED_RETURN_VALUE';
    assert.equal(fingerprint(profile.calculate(request)),expected);counts.responseIsolationChecks++;
  }
  const contextProbe=profile.eventsForYear(1989),originalContext=fingerprint(contextProbe);contextProbe.events[0].sourceIds.push('FORGED');
  assert.equal(fingerprint(profile.eventsForYear(1989)),originalContext);counts.responseIsolationChecks++;
  assert.equal(fingerprint(stageA.calculate(aRequest)),aBaseline);
  for(const [name,path] of protectedDirectories)assert.equal(fingerprint(await inventory(path)),fingerprint(before.get(name)),name+' changed');
  assert.equal(sha(await readFile(join(original,'export.json'))),exportSha);
  const semanticDigests=Object.fromEntries(Object.entries(hashes).map(([name,hash])=>[name,hash.digest('hex')]));
  assert.equal(semanticDigests.apiGregorian,semanticDigests.apiLunar);assert.equal(semanticDigests.apiGregorian,semanticDigests.directExistingResolver);
  const stageA2026Digests=Object.fromEntries(Object.entries(stageAHashes).map(([name,hash])=>[name,hash.digest('hex')]));assert.equal(stageA2026Digests.modern,stageA2026Digests.stageA);
  const summary={schemaVersion:'kasi-local-chart-stage-b-acceptance-v1',status:'PHASE_B_PASS',inputNature:'EXPLICIT_SYNTHETIC_BIRTH_GRID_NOT_PERSONAL_RECORDS',profileId:MODERN_PROFILE_ID,birthRange:{fromInclusive:'1989-01-01',untilExclusive:'2027-01-01'},manifestContentSha256:BASELINE_MANIFEST_SHA256,exportSha256:exportSha,preservedInputTrees:Object.fromEntries([...before].map(([name,files])=>[name,fingerprint(files)])),auxiliary1988Daxue:{date:guard.date,time:guard.time,sourceRef:guard.sourceRef,sourceService:'15012690',purpose:'PRIOR_DAXUE_GUARD_ONLY_NOT_1988_BIRTH_SUPPORT'},counts,semanticDigests,stageA2026Digests,verificationLayers:{allDates:'INTERNAL_GREGORIAN_LUNAR_AND_EXISTING_RESOLVER_CONSISTENCY',modernBoundaries:'ALL_38_YEARS_12_JIE_THREE_MINUTES_FOUR_EXPLICIT_POLICIES',existingFixtureScope:'2026_STAGE_A_PROFILE_RETAINED_NOT_38_YEAR_EXTERNAL_ORACLE'},apiRequests:0,allPreservedInputsUnchanged:true,notVerified:['independent full-range astronomical/calendar certification','historical birth civil clocks before1989','annual TXT original authentication','redistribution rights','public G0/default-profile integration','future Da-yun next-Jie calculation']};
  const executedFiles=[];for(const path of ['scripts/kasi/local-chart-verify-b.mjs','scripts/kasi/local-chart-verify-a.mjs','scripts/kasi/local-chart.mjs','scripts/kasi/candidate.mjs'])executedFiles.push({path,sha256:sha(await readFile(join(root,path)))});
  const execution={executedAt:new Date().toISOString(),node:process.version,processTZ:process.env.TZ??null,resolvedHostTimezone:Intl.DateTimeFormat().resolvedOptions().timeZone,codeSha:git(['rev-parse','HEAD']),workingTreeDirty:git(['status','--porcelain']).length>0,executedFiles,command:{executable:process.execPath,arguments:process.argv.slice(1)},summaryContentSha256:fingerprint(summary)};
  await mkdir(out,{mode:0o700});
  await writeFile(join(out,'summary.json'),JSON.stringify(summary,null,2)+'\n',{flag:'wx',mode:0o600});await writeFile(join(out,'execution.json'),JSON.stringify(execution,null,2)+'\n',{flag:'wx',mode:0o600});
  console.log(JSON.stringify({...summary,execution},null,2));
  return summary;
}
if(process.argv[1]&&import.meta.url===pathToFileURL(resolve(process.argv[1])).href){
  try{assert.equal(process.argv.length,4,'Usage: node scripts/kasi/local-chart-verify-b.mjs <candidateDir> <newPrivateOutputDir>');await runStageB(process.argv[2],process.argv[3]);}
  catch(error){console.error('PHASE_B_REJECTED',error.code??error.name,error.message);process.exitCode=1;}
}
