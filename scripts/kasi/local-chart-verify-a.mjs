/** Explicit private-data Stage A acceptance. Inputs are a synthetic birth grid. */
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFile, realpath, mkdir, writeFile } from 'node:fs/promises';
import { execFileSync } from 'node:child_process';
import { dirname, isAbsolute, join, relative, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { canonical, fingerprint, sha } from '../../.kasi-build/schema.js';
import { loadCandidate } from './candidate.mjs';
import { inventory } from './research.mjs';
import { BASELINE_MANIFEST_SHA256, STAGE_A_PROFILE_ID, MODERN_CLOCK_POLICY_ID, loadLocalChartProfile } from './local-chart.mjs';
import { KOREA_SOLAR_TERM_EVENTS_2026_2027 } from '../../dist/calendar/koreaSolarTermFixtures.js';
import { KASI_KOREAN_LUNISOLAR_2025_2027 } from '../../dist/calendar/koreanLunisolarFixtures.js';
import { createKoreanLunisolarConverter } from '../../dist/calendar/koreanLunisolarConverter.js';
import { resolveCoverageCheckedModernKoreanCivilFourPillars } from '../../dist/calendar/fourPillars.js';
import { DAY_ROLLOVER_POLICIES } from '../../dist/calendar/dayRollover.js';
import { HOUR_STEM_REFERENCE_POLICIES } from '../../dist/calendar/dayHourPillars.js';
import { MONTH_BOUNDARY_JIE } from '../../dist/calendar/monthPillar.js';
import { sexagenaryYearForCivilYear } from '../../dist/calendar/yearPillar.js';
import { gregorianDayNumber as day, gregorianDateFromDayNumber as civil } from '../../dist/calendar/koreanLunisolarValidation.js';

const root=resolve(dirname(fileURLToPath(import.meta.url)),'../..');
const exportSha='7b5584aca339b85c7e54e953c43b672358bda605a478831b6f260df00472e851';
const inDirectory=(parent,child)=>{const name=relative(parent,child);return name!==''&&!name.startsWith('..')&&!isAbsolute(name);};
const git=args=>execFileSync('git',['-c','safe.directory='+root.replaceAll('\\','/'),...args],{cwd:root,encoding:'utf8',stdio:['ignore','pipe','pipe']}).trim();
const applied=event=>event?{term:event.term,displayedDateTime:event.displayedDateTime,timeBasis:event.timeBasis,sourcePrecision:event.sourcePrecision}:null;
export function chartSemantics(chart) {
  const trace=chart.monthBoundaryTrace;
  return {recordedBirthKstMinute:chart.recordedBirthKstMinute,effectiveDayDate:chart.effectiveDayDate,policies:chart.policies,confidence:chart.confidence,confidenceScope:chart.confidenceScope,candidates:chart.candidates,coverage:chart.coverage,
    monthBoundaryTrace:trace?{schemaVersion:trace.schemaVersion,confidence:trace.confidence,candidateContexts:trace.candidateContexts.map(c=>({candidateIndex:c.candidateIndex,monthBranch:c.monthBranch,boundarySide:c.boundarySide,activeSince:applied(c.activeSince)})),atPublishedBoundary:applied(trace.atPublishedBoundary)}:null};
}
function shiftedMinute(minute,delta) {
  const [year,month,date,hour,minutes]=minute.match(/\d+/g).map(Number);
  // UTC arithmetic is a timezone-independent civil-minute addition, not an API instant claim.
  return new Date(Date.UTC(year,month-1,date,hour,minutes+delta)).toISOString().slice(0,16);
}

async function run(candidateDirectory,outputDirectory) {
  const privateRoot=await realpath(join(root,'.private'));
  const input=await realpath(resolve(candidateDirectory)),out=resolve(outputDirectory);
  assert.ok(inDirectory(privateRoot,input),'Actual private candidate directory is required');
  assert.ok(inDirectory(privateRoot,out)&&!inDirectory(input,out)&&!inDirectory(out,input)&&out!==input,'Output must be a separate private directory');
  assert.equal(await realpath(dirname(out)),dirname(out),'Output parent must exist without symlink');
  const originalExport=join(privateRoot,'kasi-local-1950-2026/monthly-xml/export.json');
  assert.equal(sha(await readFile(originalExport)),exportSha,'Completed export pin changed');
  const before=await inventory(input), loaded=await loadCandidate(input,BASELINE_MANIFEST_SHA256);
  const profile=await loadLocalChartProfile({directory:input,expectedManifestSha256:BASELINE_MANIFEST_SHA256,profileId:STAGE_A_PROFILE_ID});
  assert.equal(profile.metadata.id,STAGE_A_PROFILE_ID);assert.equal(profile.metadata.phase,'A');
  const {candidate,index,sources}=loaded,receipts=new Map(sources.map(r=>[r.id,r]));
  assert.equal(receipts.size,1001);
  for(const [id,record] of receipts){const {id:ignored,...receipt}=record;assert.equal(id,fingerprint(receipt));assert.equal(receipt.evidenceSurface,'KASI_OPENAPI_RESPONSE');}
  const fixtureEvents=KOREA_SOLAR_TERM_EVENTS_2026_2027.filter(e=>e.displayedDateTime.startsWith('2026-')||(e.term==='DAXUE'&&e.displayedDateTime.startsWith('2025-')));
  assert.equal(fixtureEvents.length,25);
  const fixtureSourceIds=new Set(fixtureEvents.flatMap(e=>e.sourceIds));
  const fixtureConverter=createKoreanLunisolarConverter(KASI_KOREAN_LUNISOLAR_2025_2027);
  const coverage={schemaVersion:'m1-solar-term-coverage-v1',requirementProfile:'FULL_24_TERM_YEAR',timeBasis:'KST',sourcePrecision:'MINUTE',supportedFromInclusive:'2026-01-01T00:00',supportedUntilExclusive:'2027-01-01T00:00',requiredYears:[2026],requiredPriorBoundary:{year:2025,term:'DAXUE'}};
  const {events:apiEvents,coverage:apiCoverage}=profile.eventsForYear(2026);
  assert.equal(apiEvents.length,25);assert.deepEqual(apiCoverage,coverage);
  const eventRows=new Map(candidate.events.map(r=>[r.termCode+':'+r.date,r]));
  const dayRows=new Map(candidate.dates.map(r=>[r.solarDate,r]));
  const hashes={apiGregorian:createHash('sha256'),apiLunar:createHash('sha256'),fixture:createHash('sha256')};
  const counts={distinctCivilDates:0,representativeClocks:12,policyCombinations:4,dailyCases:0,jieBeforeAtAfterCases:0,calendarBoundaryCases:0,totalInputPairs:0,semanticComparisons:0,fixtureCompositions:0,dateConversionComparisons:0,appliedEvidenceChecks:0,lichunCorrelatedPairs:0};
  const policies=DAY_ROLLOVER_POLICIES.flatMap(dayRollover=>HOUR_STEM_REFERENCE_POLICIES.map(hourStemReference=>({clockPolicyId:MODERN_CLOCK_POLICY_ID,dayRollover,hourStemReference})));
  assert.equal(policies.length,4);

  function checkEvent(evidence,expectedTerm,expectedMinute) {
    const source=receipts.get(evidence.sourceRef);
    assert.ok(source,'Applied evidence must resolve to the pinned receipt table');
    assert.deepEqual(evidence.source,source);
    assert.equal(source.serviceId,'15012690');assert.equal(source.operation,'get24DivisionsInfo');
    const actual=eventRows.get(expectedTerm+':'+expectedMinute.slice(0,10));
    assert.ok(actual,'Applied event must be in the pinned API candidate');
    assert.deepEqual(evidence.original,actual);
    assert.equal(actual.sourceRef,evidence.sourceRef);
    assert.equal(actual.date+'T'+actual.time,expectedMinute);
    assert.equal(actual.timeBasis,'API_KST_AS_PUBLISHED');assert.equal(actual.historicalCivilTime,'NOT_RESOLVED');
    assert.deepEqual(evidence.interpreted,{displayedDateTime:expectedMinute,timeBasis:'KST',sourcePrecision:'MINUTE',clockPolicyId:MODERN_CLOCK_POLICY_ID,clockPolicyVersion:'1',utcOffsetMinutes:540,utcInstant:null});
    counts.appliedEvidenceChecks++;
  }
  function checkEvidence(result,date,time,calendar,policy) {
    assert.equal(result.status,'OK');assert.equal(result.profile.id,STAGE_A_PROFILE_ID);
    assert.equal(result.profile.g0Receipt,null);assert.equal(result.profile.g1P2Promotion,false);
    assert.equal(result.dataset.sourceKind,'KASI_OPENAPI_RESPONSE');assert.equal(result.dataset.candidateManifestContentSha256,BASELINE_MANIFEST_SHA256);
    assert.equal(result.input.calendar,calendar);assert.equal(result.input.gregorianDate,date);assert.equal(result.input.time,time);
    assert.equal(result.policies.clock.id,MODERN_CLOCK_POLICY_ID);assert.equal(result.policies.clock.version,'1');
    assert.equal(result.policies.dayRollover.id,policy.dayRollover);assert.equal(result.policies.hourStemReference.id,policy.hourStemReference);
    const trace=result.chart.monthBoundaryTrace,appliedById=new Map(result.evidence.appliedJie.map(e=>['KASI_OPENAPI_RESPONSE:'+e.sourceRef+':'+e.original.date+':'+e.original.termCode,e]));
    const traceEvents=[...trace.candidateContexts.map(c=>c.activeSince),...(trace.atPublishedBoundary?[trace.atPublishedBoundary]:[])];
    for(const event of traceEvents) for(const id of event.sourceIds) {
      assert.ok(id.startsWith('KASI_OPENAPI_RESPONSE:'));assert.ok(!fixtureSourceIds.has(id));
      const evidence=appliedById.get(id);assert.ok(evidence,'Trace source ID must resolve to actual applied evidence');checkEvent(evidence,event.term,event.displayedDateTime);
    }
    const usedIds=new Set(traceEvents.flatMap(e=>e.sourceIds));assert.equal(appliedById.size,usedIds.size);
    const lichun=apiEvents.find(e=>e.term==='LICHUN');checkEvent(result.evidence.yearBoundary,'LICHUN',lichun.displayedDateTime);
    const row=dayRows.get(date),conversion=result.evidence.dateConversion,source=receipts.get(row.sourceRef);
    assert.equal(conversion.sourceRef,row.sourceRef);assert.deepEqual(conversion.source,source);
    assert.equal(source.serviceId,'15012679');assert.equal(source.operation,'getLunCalInfo');assert.equal(conversion.calendarGanjiUsedAsPillars,false);
    assert.equal(conversion.method,calendar==='KOREAN_LUNAR'?'API_OBSERVED_DATE_INDEX':'GREGORIAN_WITH_API_OBSERVED_DATE_EVIDENCE');
    assert.deepEqual(conversion.observed,{solarDate:date,lunarYear:row.lunarYear,lunarMonth:row.lunarMonth,lunarDay:row.lunarDay,leap:row.leap});
  }
  function checkCase(minute,policy,category) {
    const date=minute.slice(0,10),time=minute.slice(11),row=index.fromGregorianDate(date).value;
    const lunar={lunarYear:row.lunarYear,lunarMonth:row.lunarMonth,lunarDay:row.lunarDay,leap:row.leap};
    const apiGregorian=profile.calculate({calendar:'GREGORIAN',date,time,policies:policy});
    const apiLunar=profile.calculate({calendar:'KOREAN_LUNAR',lunarDate:lunar,time,policies:policy});
    const converted=fixtureConverter.fromLunarDate({...lunar,isLeapMonth:lunar.leap});assert.equal(converted.status,'OK');assert.equal(converted.value,date);
    const fixture=resolveCoverageCheckedModernKoreanCivilFourPillars(fixtureEvents,converted.value+'T'+time,{timeBasis:'KOREAN_CIVIL_TIME',dayRollover:policy.dayRollover,hourStemReference:policy.hourStemReference},coverage);
    checkEvidence(apiGregorian,date,time,'GREGORIAN',policy);checkEvidence(apiLunar,date,time,'KOREAN_LUNAR',policy);
    const g=chartSemantics(apiGregorian.chart),l=chartSemantics(apiLunar.chart),f=chartSemantics(fixture);
    assert.deepEqual(g,f,'API Gregorian and existing fixture chart semantics differ');
    assert.deepEqual(l,f,'API lunar and existing fixture chart semantics differ');assert.deepEqual(g,l,'Calendar forms must preserve candidate correlation');
    for(const [name,value] of [['apiGregorian',g],['apiLunar',l],['fixture',f]]) hashes[name].update(canonical({category,policy,chart:value})+'\n');
    counts[category]++;counts.totalInputPairs++;counts.semanticComparisons+=3;counts.fixtureCompositions++;
    return apiGregorian;
  }

  const calendarBoundaries=new Set(['2026-01-01','2026-12-31']);
  for(let n=day('2026-01-01');n<day('2027-01-01');n++) {
    const date=civil(n),api=index.fromGregorianDate(date),fixture=fixtureConverter.fromGregorianDate(date);
    assert.equal(api.status,'OK');assert.equal(fixture.status,'OK');
    const r=api.value;assert.deepEqual({lunarYear:r.lunarYear,lunarMonth:r.lunarMonth,lunarDay:r.lunarDay,isLeapMonth:r.leap},fixture.value);
    assert.equal(fixtureConverter.fromLunarDate(fixture.value).value,date);counts.dateConversionComparisons++;counts.distinctCivilDates++;
    if(date.endsWith('-01')||civil(n+1).slice(0,7)!==date.slice(0,7)||r.lunarDay===1)calendarBoundaries.add(date);
    for(let hour=0;hour<24;hour+=2)for(const policy of policies)checkCase(date+'T'+String(hour).padStart(2,'0')+':30',policy,'dailyCases');
  }
  assert.equal(counts.distinctCivilDates,365);assert.equal(counts.dailyCases,365*12*4);
  const jie=apiEvents.filter(e=>e.displayedDateTime.startsWith('2026-')&&MONTH_BOUNDARY_JIE.includes(e.term));assert.equal(jie.length,12);
  for(const event of jie)for(const delta of [-1,0,1])for(const policy of policies) {
    const result=checkCase(shiftedMinute(event.displayedDateTime,delta),policy,'jieBeforeAtAfterCases');
    assert.equal(result.chart.confidence,delta===0?'PUBLISHED_MINUTE_AMBIGUOUS':'DEFINITE');assert.equal(result.chart.candidates.length,delta===0?2:1);
    if(event.term==='LICHUN'&&delta===0){assert.deepEqual(result.chart.candidates.map(c=>c.year),[sexagenaryYearForCivilYear(2025),sexagenaryYearForCivilYear(2026)]);assert.deepEqual(result.chart.candidates.map(c=>c.month.branch),['丑','寅']);counts.lichunCorrelatedPairs++;}
  }
  assert.equal(counts.jieBeforeAtAfterCases,12*3*4);assert.equal(counts.lichunCorrelatedPairs,4);
  for(const date of [...calendarBoundaries].sort())for(const clock of ['22:59','23:00','23:59','00:00'])for(const policy of policies)checkCase(date+'T'+clock,policy,'calendarBoundaryCases');
  const after=await inventory(input);assert.equal(fingerprint(after),fingerprint(before),'Pinned candidate directory changed');
  assert.equal(sha(await readFile(originalExport)),exportSha,'Original completed export changed');
  const digests=Object.fromEntries(Object.entries(hashes).map(([name,hash])=>[name,hash.digest('hex')]));
  assert.equal(digests.apiGregorian,digests.fixture);assert.equal(digests.apiLunar,digests.fixture);
  const scriptFiles=['scripts/kasi/local-chart-verify-a.mjs','scripts/kasi/local-chart.mjs','scripts/kasi/candidate.mjs'];
  const executedFiles=[];for(const path of scriptFiles)executedFiles.push({path,sha256:sha(await readFile(join(root,path)))});
  const summary={schemaVersion:'kasi-local-chart-stage-a-acceptance-v1',status:'PHASE_A_PASS',inputNature:'EXPLICIT_SYNTHETIC_BIRTH_GRID_NOT_PERSONAL_RECORDS',profileId:STAGE_A_PROFILE_ID,manifestContentSha256:BASELINE_MANIFEST_SHA256,exportSha256:exportSha,candidateInputTreeSha256:fingerprint(before),counts,semanticDigests:digests,comparisonScope:'EXISTING_IMPLEMENTATION_AND_2026_FIXTURE_NOT_INDEPENDENT_FULL_RANGE_CERTIFICATION',apiRequests:0,candidateUnchanged:true,completedExportUnchanged:true,notVerified:['independent full-calendar astronomical correctness','historical birth clocks before1989','annual TXT original authentication','source redistribution rights','public G0/default integration']};
  const execution={executedAt:new Date().toISOString(),node:process.version,processTZ:process.env.TZ??null,resolvedHostTimezone:Intl.DateTimeFormat().resolvedOptions().timeZone,codeSha:git(['rev-parse','HEAD']),workingTreeDirty:git(['status','--porcelain']).length>0,executedFiles,command:{executable:process.execPath,arguments:process.argv.slice(1)},summaryContentSha256:fingerprint(summary)};
  await mkdir(out,{mode:0o700});
  await writeFile(join(out,'summary.json'),JSON.stringify(summary,null,2)+'\n',{flag:'wx',mode:0o600});
  await writeFile(join(out,'execution.json'),JSON.stringify(execution,null,2)+'\n',{flag:'wx',mode:0o600});
  console.log(JSON.stringify({...summary,execution},null,2));
}

if(process.argv[1]&&import.meta.url===pathToFileURL(resolve(process.argv[1])).href) {
  try {assert.equal(process.argv.length,4,'Usage: node scripts/kasi/local-chart-verify-a.mjs <candidateDir> <newPrivateOutputDir>');await run(process.argv[2],process.argv[3]);}
  catch(error){console.error('PHASE_A_REJECTED',error.code??error.name,error.message);process.exitCode=1;}
}
