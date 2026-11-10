/** Actual private M7 acceptance. Births form an explicit artificial grid, never personal records. */
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFile, realpath, mkdir, writeFile } from 'node:fs/promises';
import { execFileSync } from 'node:child_process';
import { dirname, isAbsolute, join, relative, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { canonical, fingerprint, sha } from '../../.kasi-build/schema.js';
import { loadCandidate } from './candidate.mjs';
import { inventory } from './research.mjs';
import { BASELINE_MANIFEST_SHA256, MODERN_PROFILE_ID, STAGE_A_PROFILE_ID, MODERN_CLOCK_POLICY_ID, createLocalChartProfile } from './local-chart.mjs';
import { modernExplanationGrid } from './local-explain-verify.mjs';
import { MONTH_BOUNDARY_JIE } from '../../dist/calendar/monthPillar.js';
import { gregorianDayNumber as day, monthKey } from '../../dist/calendar/koreanLunisolarValidation.js';
import { SEXAGENARY_CYCLE } from '../../dist/domain/sexagenary.js';
import { STEM_NATURE } from '../../dist/domain/stems.js';
import { resolveCoverageCheckedModernKoreanCivilFourPillars } from '../../dist/calendar/fourPillars.js';
import { M7_LUCK_POLICY_V01 } from '../../dist/luck/luckV01.js';
import { createLocalLuckProfile, loadLocalLuckProfile, validateLocalLuckResult, validateLuckExplanation, calculateSeyunLabel, renderLocalLuckText } from './local-luck.mjs';
import { createLocalExplanationProfile } from './local-explain.mjs';
import { M2_LOCAL_PROFILE_ID } from './local-chart-facts.mjs';

const root=resolve(dirname(fileURLToPath(import.meta.url)),'../..');
const exportSha='7b5584aca339b85c7e54e953c43b672358bda605a478831b6f260df00472e851';
const preservedTreePins={candidateA:'b2a2560d2d6324554e8bacf4f34e5a788cddabe71e99843b3b6dcb6876a89bed',candidateB:'b143a6cd766a9d0c0e763f93aba1236db68a29c2a5e71a89647e0371dbca6584',completedInput:'82c5a30c679ac743c0c89a0192ce2cf21a42387fd4ad8cbb6847a4db18866567'};
const inDirectory=(parent,child)=>{const path=relative(parent,child);return path!==''&&!path.startsWith('..')&&!isAbsolute(path);};
const git=args=>execFileSync('git',['-c','safe.directory='+root.replaceAll('\\','/'),...args],{cwd:root,encoding:'utf8',stdio:['ignore','pipe','pipe']}).trim();
const lunarDate=row=>({lunarYear:row.lunarYear,lunarMonth:row.lunarMonth,lunarDay:row.lunarDay,leap:row.leap});
const glyph=pillar=>pillar.stem+pillar.branch;
const samePillar=(actual,expected)=>assert.deepEqual({stem:actual.stem,branch:actual.branch},{stem:expected.stem,branch:expected.branch});
const cycleIndex=new Map(SEXAGENARY_CYCLE.map((pillar,index)=>[glyph(pillar),index]));
const sourceId=row=>'KASI_OPENAPI_RESPONSE:'+row.sourceRef+':'+row.date+':'+row.termCode;
const minuteNumber=minute=>day(minute.slice(0,10))*1440+Number(minute.slice(11,13))*60+Number(minute.slice(14,16));
function gcd(a,b){while(b){const remainder=a%b;a=b;b=remainder;}return a;}
function fraction(numerator,denominator=4320){const divisor=gcd(numerator,denominator);return {numerator:numerator/divisor,denominator:denominator/divisor};}

/** Test reference from raw rows and the written conditional policy, not the M7 implementation. */
function independentDayun(candidate,context,birthMinute,traditionalSex,jieRows){
  const polarity=STEM_NATURE[candidate.year.stem].polarity;
  const forward=(polarity==='YANG'&&traditionalSex==='MALE')||(polarity==='YIN'&&traditionalSex==='FEMALE');
  const direction=forward?'FORWARD':'REVERSE',side=context.boundarySide;
  const at=jieRows.find(row=>row.date+'T'+row.time===birthMinute);
  const sameMinuteConditional=at&&((forward&&side==='BEFORE_PUBLISHED_MINUTE')||(!forward&&side==='AFTER_PUBLISHED_MINUTE'));
  const selected=sameMinuteConditional?at:forward
    ?jieRows.find(row=>row.date+'T'+row.time>birthMinute)
    :jieRows.findLast(row=>row.date+'T'+row.time<birthMinute);
  const monthIndex=cycleIndex.get(glyph(candidate.month));assert.notEqual(monthIndex,undefined);
  const sequence=Array.from({length:10},(_,index)=>SEXAGENARY_CYCLE[(monthIndex+(forward?1:-1)*(index+1)+600)%60]);
  if(!selected)return {direction,polarity,sequence,status:'NEEDS_DATA',selected:null,minutes:null,modelYears:null};
  if(sameMinuteConditional)return {direction,polarity,sequence,status:'AMBIGUOUS',selected,minutes:null,modelYears:null};
  const minutes=Math.abs(minuteNumber(selected.date+'T'+selected.time)-minuteNumber(birthMinute));assert.ok(minutes>0);
  return {direction,polarity,sequence,status:'OK',selected,minutes,modelYears:fraction(minutes)};
}

async function preservedInputs(candidateDirectory,outputDirectory){
  const privateRoot=await realpath(join(root,'.private')),input=await realpath(resolve(candidateDirectory)),out=resolve(outputDirectory);
  assert.ok(inDirectory(privateRoot,input));
  assert.ok(inDirectory(privateRoot,out)&&out!==input&&!inDirectory(input,out)&&!inDirectory(out,input),'Use a fresh, separate private output directory');
  assert.equal(await realpath(dirname(out)),dirname(out),'Output parent must already exist without a symlink');
  const original=await realpath(join(privateRoot,'kasi-local-1950-2026/monthly-xml'));
  const baselineA=await realpath(join(privateRoot,'kasi-research-1950-2026-fe84ab4-a'));
  const baselineB=await realpath(join(privateRoot,'kasi-research-1950-2026-fe84ab4-b'));
  const directories=new Map([['providedCandidate',input],['candidateA',baselineA],['candidateB',baselineB],['completedInput',original]]),before=new Map(),cached=new Map();
  for(const [name,path]of directories){
    assert.ok(out!==path&&!inDirectory(path,out)&&!inDirectory(out,path),'Output overlaps preserved data');
    if(!cached.has(path))cached.set(path,await inventory(path));before.set(name,cached.get(path));
  }
  for(const [name,pin]of Object.entries(preservedTreePins))assert.equal(fingerprint(before.get(name)),pin,'Independent preserved tree pin: '+name);
  assert.equal(sha(await readFile(join(original,'export.json'))),exportSha);
  const loaded=await loadCandidate(input,BASELINE_MANIFEST_SHA256),other=await loadCandidate(baselineB,BASELINE_MANIFEST_SHA256);
  assert.equal(fingerprint(other.manifest),BASELINE_MANIFEST_SHA256);
  assert.equal(fingerprint(before.get('completedInput')),loaded.manifest.inputTreeSha256);
  return {input,out,original,loaded,directories,before};
}

async function checkPreserved(state){
  const checked=new Map();
  for(const [name,path]of state.directories){if(!checked.has(path))checked.set(path,await inventory(path));assert.equal(fingerprint(checked.get(path)),fingerprint(state.before.get(name)),name+' changed');}
  assert.equal(sha(await readFile(join(state.original,'export.json'))),exportSha);
}

export async function runLocalLuckAcceptance(candidateDirectory,outputDirectory){
  const state=await preservedInputs(candidateDirectory,outputDirectory),{candidate,index,sources}=state.loaded;
  const chartProfile=createLocalChartProfile(state.loaded,{profileId:MODERN_PROFILE_ID,expectedManifestSha256:BASELINE_MANIFEST_SHA256});
  const stageA=createLocalChartProfile(state.loaded,{profileId:STAGE_A_PROFILE_ID,expectedManifestSha256:BASELINE_MANIFEST_SHA256});
  let m1Calls=0,aM1Calls=0;
  const spy={...chartProfile,calculate(request){m1Calls++;return chartProfile.calculate(request);}};
  const profile=createLocalLuckProfile(spy,{luckPolicyId:M7_LUCK_POLICY_V01,contextProfile:chartProfile});
  const aSpy={...stageA,calculate(request){aM1Calls++;return stageA.calculate(request);}};
  const aProfile=createLocalLuckProfile(aSpy,{luckPolicyId:M7_LUCK_POLICY_V01,contextProfile:stageA});
  const rows=new Map(candidate.dates.map(row=>[row.solarDate,row])),receipts=new Map(sources.map(receipt=>[receipt.id,receipt]));
  const eventRows=new Map(candidate.events.map(row=>[sourceId(row),row]));
  const contexts=new Map();for(let year=1989;year<=2026;year++)contexts.set(year,chartProfile.eventsForYear(year));
  const jieRows=candidate.events.filter(row=>(row.date>='1989-01-01'||row.date.startsWith('1988-12-'))&&row.date<'2027-01-01'&&MONTH_BOUNDARY_JIE.includes(row.termCode)).sort((a,b)=>(a.date+'T'+a.time).localeCompare(b.date+'T'+b.time));
  assert.equal(jieRows.length,457);assert.equal(jieRows[0].date+'T'+jieRows[0].time,'1988-12-07T06:34');
  const counts={distinctCivilDates:0,dailyCases:0,jieBeforeAtAfterCases:0,calendarBoundaryCases:0,totalBirthVectors:0,totalGenderCalendarPairs:0,productInvocations:0,productM1Calls:0,annualYearQueries:0,annualLabelCalls:0,referenceM1ResolverCalls:0,candidates:0,sequenceChecks:0,intervalChecks:0,modelAgeAboveTen:0,sourceEvidenceChecks:0,factReferenceChecks:0,explanationReferenceChecks:0,lichunBirthVectors:0,leapMonthPairs:0,invalidLeapRequests:0,alternationChecks:0,mutationIsolationChecks:0,reproducibilityChecks:0,additionalFeatureCases:0,auxiliaryProfileInvocations:0,m2OptionalIntegrationCases:0,referenceM2BirthCalls:0,negativeLoaderChecks:0};
  const statuses={direction:{},start:{},calendarProjection:{},currentDecade:{},annualAtMinute:{},annualYearLabel:{}};
  const hashes={gregorian:createHash('sha256'),lunar:createHash('sha256')};
  const increment=(bucket,status)=>{assert.equal(typeof status,'string');bucket[status]=(bucket[status]??0)+1;};
  const calculate=(request,options)=>{
    const before=m1Calls,result=profile.calculate(request,options);assert.equal(m1Calls-before,1,'M1 birth calculation count must be one per product request');
    counts.productInvocations++;counts.productM1Calls++;
    if(result.luck){assert.deepEqual(result.luck.executionCounts,{birthM1Calls:1,seyunYearQueries:options?.seyun?.queryMinute?1:0,seyunLabelCalls:options?.seyun?.yearLabel!==undefined?1:0});counts.annualYearQueries+=result.luck.executionCounts.seyunYearQueries;counts.annualLabelCalls+=result.luck.executionCounts.seyunLabelCalls;}
    return result;
  };

  // The detailed root-envelope checks use the exact registered contract below.
  function checkEvidenceRecord(record){
    const original=record.original??record.evidence?.original,source=record.source??record.evidence?.source;
    if(!original||!source)return false;
    const row=eventRows.get(sourceId(original));assert.ok(row,'Selected event must exist in pinned API candidates');assert.deepEqual(original,row);
    const expected=receipts.get(row.sourceRef);assert.ok(expected);assert.deepEqual(source,expected);
    assert.equal(source.serviceId,'15012690');assert.equal(source.operation,'get24DivisionsInfo');assert.equal(source.query.year,Number(row.date.slice(0,4)));
    assert.equal(row.timeBasis,'API_KST_AS_PUBLISHED');assert.equal(row.historicalCivilTime,'NOT_RESOLVED');counts.sourceEvidenceChecks++;return true;
  }
  function checkResult(result,request,traditionalSex){
    assert.equal(result.status,'OK');validateLocalLuckResult(result);validateLuckExplanation(result.explanation,result.luck);
    const m1=result.m1,luck=result.luck,minute=m1.chart.recordedBirthKstMinute;
    assert.equal(m1.profile.id,MODERN_PROFILE_ID);assert.equal(m1.profile.g0Receipt,null);assert.equal(m1.profile.g1P2Promotion,false);
    assert.equal(result.baseExplanation,null,'M2 must not be recomputed when unrequested');assert.equal(luck.validation.g0Receipt,null);assert.equal(luck.validation.g1P2Promotion,false);assert.equal(luck.validation.editionVerification,'UNVERIFIED');assert.equal(luck.validation.rightsReview,'UNVERIFIED');assert.equal(luck.validation.predictiveValidity,'NOT_CLAIMED');
    assert.equal(m1.dataset.candidateManifestContentSha256,BASELINE_MANIFEST_SHA256);assert.equal(m1.dataset.rightsReview,'UNVERIFIED');
    assert.equal(m1.input.calendar,request.calendar);assert.equal(minute,m1.input.gregorianDate+'T'+request.time);
    assert.equal(m1.policies.clock.id,request.policies.clockPolicyId);assert.equal(m1.policies.dayRollover.id,request.policies.dayRollover);assert.equal(m1.policies.hourStemReference.id,request.policies.hourStemReference);assert.equal(m1.evidence.dateConversion.calendarGanjiUsedAsPillars,false);
    const rawDate=rows.get(m1.input.gregorianDate);assert.ok(rawDate);assert.deepEqual(m1.evidence.dateConversion.observed,{solarDate:rawDate.solarDate,...lunarDate(rawDate)});
    assert.equal(m1.evidence.dateConversion.sourceRef,rawDate.sourceRef);assert.deepEqual(m1.evidence.dateConversion.source,receipts.get(rawDate.sourceRef));
    assert.equal(m1.evidence.dateConversion.method,request.calendar==='KOREAN_LUNAR'?'API_OBSERVED_DATE_INDEX':'GREGORIAN_WITH_API_OBSERVED_DATE_EVIDENCE');assert.deepEqual(luck.provenance.profile,m1.profile);assert.deepEqual(luck.provenance.dataset,m1.dataset);assert.deepEqual(luck.provenance.policies,m1.policies);assert.equal(luck.provenance.recordedBirthMinute,minute);assert.equal(luck.provenance.confidence,m1.chart.confidence);
    assert.equal(luck.candidates.length,m1.chart.candidates.length);
    assert.deepEqual(luck.candidates.map(c=>c.candidateIndex),m1.chart.candidates.map((_,i)=>i));
    const annual=luck.seyun;
    assert.equal(annual.yearLabel.status,'OK');assert.equal(annual.yearLabel.year,2027);samePillar(annual.yearLabel.pillar,{stem:'丁',branch:'未'});increment(statuses.annualYearLabel,annual.yearLabel.status);
    assert.equal(annual.atMinute.queryMinute,minute);increment(statuses.annualAtMinute,annual.atMinute.status);
    const expectedYearSet=[...new Set(m1.chart.candidates.map(c=>glyph(c.year)))].sort();
    assert.deepEqual([...new Set(annual.atMinute.entries.map(e=>glyph(e.pillar)))].sort(),expectedYearSet);
    assert.equal(annual.atMinute.status,expectedYearSet.length===2?'AMBIGUOUS':'OK');assert.deepEqual(annual.atMinute.entries.map(e=>e.condition),expectedYearSet.length===2?['BEFORE_PUBLISHED_MINUTE','AFTER_PUBLISHED_MINUTE']:['DEFINITE']);
    const lichun=eventRows.get(annual.atMinute.lichun.sourceIds[0]);assert.ok(lichun);assert.equal(lichun.termCode,'LICHUN');assert.equal(lichun.date.slice(0,4),minute.slice(0,4));
    assert.equal(annual.atMinute.lichun.displayedDateTime,lichun.date+'T'+lichun.time);
    const rules=new Set(luck.rules.map(rule=>rule.id)),policyIds=new Set([luck.policy.id,...luck.policy.policies.map(policy=>policy.id)]),sourceMap=new Map(luck.sources.map(source=>[source.id,source]));
    for(const source of sourceMap.values())if(source.id.startsWith('KASI_OPENAPI_RESPONSE:'))assert.ok(checkEvidenceRecord(source));
    for(const local of luck.candidates){
      const i=local.candidateIndex,ref=`chart.candidates[${i}]`,birthCandidate=m1.chart.candidates[i],context=m1.chart.monthBoundaryTrace.candidateContexts[i];
      assert.equal(local.candidateRef,ref);assert.ok(birthCandidate&&context);counts.candidates++;
      const expected=independentDayun(birthCandidate,context,minute,traditionalSex,jieRows),dayun=local.dayun;
      assert.equal(dayun.traditionalSex,traditionalSex);assert.equal(dayun.sequence.status,'OK');assert.equal(dayun.sequence.direction,expected.direction);increment(statuses.direction,dayun.sequence.status);
      assert.equal(dayun.direction.direction,expected.direction);assert.equal(dayun.direction.traditionalSex,traditionalSex);assert.equal(dayun.direction.yearStem,birthCandidate.year.stem);assert.equal(dayun.direction.yearStemPolarity,expected.polarity);samePillar(dayun.direction.yearPillar,birthCandidate.year);
      samePillar(dayun.sequence.monthPillar,birthCandidate.month);assert.equal(dayun.sequence.firstRelation,'ADJACENT_EXCLUDES_NATAL_MONTH');assert.equal(dayun.sequence.entries.length,10);
      dayun.sequence.entries.forEach((entry,n)=>{assert.equal(entry.ordinal,n+1);samePillar(entry.pillar,expected.sequence[n]);});counts.sequenceChecks++;
      assert.equal(dayun.start.status,expected.status);increment(statuses.start,dayun.start.status);
      assert.equal(dayun.start.birthMinute,minute,'Zi effective day must not move physical recorded birth minute');assert.equal(dayun.start.direction,expected.direction);assert.equal(dayun.start.boundarySide,context.boundarySide);
      assert.equal(dayun.start.precision.actualInstantCertified,false);assert.equal(dayun.start.precision.unknownRounding,'NO_ASSUMED_SECONDS_INTERVAL');
      if(expected.selected){
        assert.equal(dayun.start.selectedEvent.term,expected.selected.termCode);assert.equal(dayun.start.selectedEvent.displayedDateTime,expected.selected.date+'T'+expected.selected.time);assert.deepEqual(dayun.start.selectedEvent.sourceIds,[sourceId(expected.selected)]);
      }else{assert.equal(dayun.start.selectedEvent,null);assert.deepEqual(dayun.start.missingData.map(({year,term})=>({year,term})),[{year:2027,term:'XIAOHAN'}]);}
      if(expected.status==='OK'){
        assert.equal(dayun.start.nominalIntervalMinutes,expected.minutes);assert.equal(dayun.start.age.numerator,expected.minutes);assert.equal(dayun.start.age.denominator,4320);assert.deepEqual(dayun.start.age.reduced,expected.modelYears);assert.equal(dayun.start.age.unit,'MODEL_YEAR');
        assert.equal(dayun.modelAgeIntervals.length,10);dayun.modelAgeIntervals.forEach((interval,n)=>{
          assert.equal(interval.ordinal,n+1);assert.equal(interval.unit,'MODEL_YEAR');assert.equal(interval.startInclusive.numerator,expected.minutes+10*n*4320);assert.equal(interval.startInclusive.denominator,4320);assert.equal(interval.endExclusive.numerator,expected.minutes+10*(n+1)*4320);assert.equal(interval.endExclusive.denominator,4320);
        });counts.intervalChecks++;if(expected.minutes>43200)counts.modelAgeAboveTen++;
      }else{assert.equal(dayun.start.age,null);assert.equal(dayun.start.displayAge,null);assert.equal(dayun.modelAgeIntervals,null);if(expected.status==='AMBIGUOUS')assert.equal(dayun.start.nominalIntervalMinutes,0);}
      for(const key of ['calendarProjection','currentDecade']){assert.equal(dayun[key].status,'POLICY_UNRESOLVED');assert.equal(dayun[key].exactStartDate,null);increment(statuses[key],dayun[key].status);}
      for(const fact of local.facts){
        assert.equal(fact.candidateRef,ref);assert.ok(fact.id.startsWith(`luck.candidates[${i}]#`));assert.ok(fact.ruleRefs.every(id=>rules.has(id)));assert.ok(fact.policyRefs.every(id=>policyIds.has(id)));assert.ok(fact.sourceRefs.every(id=>sourceMap.has(id)&&sourceMap.get(id).kind!=='CALENDAR_API'));assert.ok(fact.calculationSourceRefs.every(id=>sourceMap.get(id)?.kind==='CALENDAR_API'));counts.factReferenceChecks++;
      }
    }
    for(const candidate of result.explanation.candidates){const local=luck.candidates[candidate.candidateIndex],ids=new Set(local.facts.map(f=>f.id));assert.equal(candidate.candidateRef,local.candidateRef);for(const item of candidate.items){assert.equal(item.candidateRef,local.candidateRef);assert.ok(item.factRefs.length>0&&item.factRefs.every(id=>ids.has(id)));assert.ok(item.ruleRefs.every(id=>rules.has(id)));assert.ok(item.policyRefs.every(id=>policyIds.has(id)));assert.ok(item.sourceRefs.every(id=>sourceMap.has(id)));counts.explanationReferenceChecks++;}}
  }
  // Each meaning is hashed once. All full fact/rule/policy/API graphs are checked separately above.
  function semantics(result){return {chart:result.m1.chart,luck:{policy:result.luck.policy.id,policyVersion:result.luck.policy.version,candidates:result.luck.candidates.map(c=>({candidateRef:c.candidateRef,candidateIndex:c.candidateIndex,boundarySide:c.boundarySide,dayun:c.dayun,seyun:c.seyun})),seyun:result.luck.seyun},explanation:{schemaVersion:result.explanation.schemaVersion,templateVersion:result.explanation.templateVersion,scopeNote:result.explanation.scopeNote,candidates:result.explanation.candidates.map(c=>({candidateRef:c.candidateRef,candidateIndex:c.candidateIndex,items:c.items.map(({templateId,templateVersion,text})=>({templateId,templateVersion,text}))}))}};}
  for(const vector of modernExplanationGrid(candidate,contexts)){
    const date=vector.minute.slice(0,10),time=vector.minute.slice(11),row=index.fromGregorianDate(date).value;assert.ok(row);
    const originalContext=contexts.get(Number(date.slice(0,4))),referenceChart=resolveCoverageCheckedModernKoreanCivilFourPillars(originalContext.events,vector.minute,{timeBasis:'KOREAN_CIVIL_TIME',dayRollover:vector.policy.dayRollover,hourStemReference:vector.policy.hourStemReference},originalContext.coverage);counts.referenceM1ResolverCalls++;
    for(const traditionalSex of ['MALE','FEMALE']){
      const options={dayun:{traditionalSex,count:10},seyun:{yearLabel:2027,queryMinute:vector.minute}};
      const gRequest={calendar:'GREGORIAN',date,time,policies:vector.policy},lRequest={calendar:'KOREAN_LUNAR',lunarDate:lunarDate(row),time,policies:vector.policy};
      const g=calculate(gRequest,options),l=calculate(lRequest,options);checkResult(g,gRequest,traditionalSex);checkResult(l,lRequest,traditionalSex);assert.deepEqual(g.m1.chart,referenceChart);assert.deepEqual(l.m1.chart,referenceChart);
      const gs=semantics(g),ls=semantics(l);assert.deepEqual(gs,ls,'G/L M7 meanings must match; conversion receipts are validated separately');
      hashes.gregorian.update(canonical({category:vector.category,traditionalSex,policy:vector.policy,result:gs})+'\n');hashes.lunar.update(canonical({category:vector.category,traditionalSex,policy:vector.policy,result:ls})+'\n');counts.totalGenderCalendarPairs++;
    }
    counts[vector.category]++;counts.totalBirthVectors++;if(vector.category==='dailyCases')counts.distinctCivilDates++;
    if(vector.event?.term==='LICHUN'&&vector.delta===0)counts.lichunBirthVectors++;
    if(counts.totalBirthVectors%1000===0)console.error('M7_ACCEPTANCE_PROGRESS',JSON.stringify({birthVectors:counts.totalBirthVectors,genderCalendarPairs:counts.totalGenderCalendarPairs,daily:counts.dailyCases,jie:counts.jieBeforeAtAfterCases,edges:counts.calendarBoundaryCases}));
  }
  assert.equal(counts.distinctCivilDates,13879);assert.equal(counts.totalBirthVectors,47975);assert.equal(counts.totalGenderCalendarPairs,95950);assert.equal(counts.productInvocations,191900);assert.equal(counts.candidates,199196);assert.equal(counts.lichunBirthVectors,152);assert.equal(statuses.start.AMBIGUOUS,7296);assert.equal(statuses.start.NEEDS_DATA,162);assert.ok(counts.modelAgeAboveTen>0);

  const gridCounts=structuredClone(counts),gridFeatureStatuses=structuredClone(statuses);
  const additionalFeatureStatuses={scope:'EXPLICIT_PARTIAL_FEATURE_CASES_NOT_THE_FULL_GRID',pureYearLabel:{},annual2027Query:{},historicalQuery:{},invalidDayunInput:{},beforeBirthRelation:{}};

  const basePolicy={clockPolicyId:MODERN_CLOCK_POLICY_ID,dayRollover:'CIVIL_MIDNIGHT',hourStemReference:'SELECTED_DAY_PILLAR'};
  const request=(date='2026-06-01',time='12:00',policies=basePolicy)=>({calendar:'GREGORIAN',date,time,policies});
  const optionsFor=(req,traditionalSex='MALE')=>({dayun:{traditionalSex,count:10},seyun:{yearLabel:2027,queryMinute:(req.calendar==='GREGORIAN'?req.date:index.fromLunarDate(req.lunarDate).value)+'T'+req.time}});
  const validate=result=>{assert.equal(result.status,'OK');validateLocalLuckResult(result);validateLuckExplanation(result.explanation,result.luck);};
  const label=calculateSeyunLabel(2027,M7_LUCK_POLICY_V01);validate(label);assert.equal(label.m1,null);assert.deepEqual(label.luck.executionCounts,{birthM1Calls:0,seyunYearQueries:0,seyunLabelCalls:1});samePillar(label.luck.seyun.yearLabel.pillar,{stem:'丁',branch:'未'});increment(additionalFeatureStatuses.pureYearLabel,label.luck.seyun.yearLabel.status);counts.additionalFeatureCases++;
  const seyunOnly=calculate(request(),{seyun:{yearLabel:2027,queryMinute:'2027-02-04T05:02'}});validate(seyunOnly);assert.equal(seyunOnly.luck.seyun.yearLabel.status,'OK');assert.equal(seyunOnly.luck.seyun.atMinute.status,'NEEDS_DATA');assert.deepEqual(seyunOnly.luck.seyun.atMinute.missingData.map(({year,term})=>({year,term})),[{year:2027,term:'LICHUN'}]);assert.ok(seyunOnly.luck.candidates.every(c=>c.dayun===null));increment(additionalFeatureStatuses.annual2027Query,seyunOnly.luck.seyun.atMinute.status);counts.additionalFeatureCases++;
  const partialInvalid=calculate(request(),{dayun:{count:10},seyun:{yearLabel:2027,queryMinute:'2026-06-01T12:00'}});validate(partialInvalid);assert.ok(partialInvalid.luck.candidates.every(c=>c.dayun.status==='INVALID_INPUT'&&c.dayun.code==='EXPLICIT_TRADITIONAL_SEX_REQUIRED'));assert.equal(partialInvalid.luck.seyun.atMinute.status,'OK');for(const c of partialInvalid.luck.candidates)increment(additionalFeatureStatuses.invalidDayunInput,c.dayun.status);counts.additionalFeatureCases++;
  const beforeBirth=calculate(request(),{seyun:{yearLabel:2027,queryMinute:'1989-01-01T00:00'}});validate(beforeBirth);assert.equal(beforeBirth.luck.seyun.atMinute.status,'OK');samePillar(beforeBirth.luck.seyun.atMinute.entries[0].pillar,{stem:'戊',branch:'辰'});assert.ok(beforeBirth.luck.candidates.every(c=>c.seyun.birthRelation==='BEFORE_BIRTH_REPORTED_MINUTE'));for(const c of beforeBirth.luck.candidates)increment(additionalFeatureStatuses.beforeBirthRelation,c.seyun.birthRelation);counts.additionalFeatureCases++;
  const historicalQuery=calculate(request(),{seyun:{yearLabel:2027,queryMinute:'1988-12-31T23:59'}});validate(historicalQuery);assert.equal(historicalQuery.luck.seyun.atMinute.status,'POLICY_UNRESOLVED');assert.equal(historicalQuery.luck.seyun.yearLabel.status,'OK');increment(additionalFeatureStatuses.historicalQuery,historicalQuery.luck.seyun.atMinute.status);counts.additionalFeatureCases++;
  const lateRequest=request('2026-12-31','23:59'),late=calculate(lateRequest,optionsFor(lateRequest));checkResult(late,lateRequest,'MALE');assert.equal(late.luck.candidates[0].dayun.start.status,'NEEDS_DATA');assert.deepEqual(late.luck.candidates[0].dayun.sequence.entries.slice(0,3).map(e=>glyph(e.pillar)),['辛丑','壬寅','癸卯']);counts.additionalFeatureCases++;
  const lowerRequest=request('1989-01-01'),lower=calculate(lowerRequest,optionsFor(lowerRequest,'FEMALE'));checkResult(lower,lowerRequest,'FEMALE');assert.equal(lower.luck.candidates[0].dayun.start.selectedEvent.displayedDateTime,'1988-12-07T06:34');counts.additionalFeatureCases++;
  const ziRequest=request('2026-12-31','23:59',{...basePolicy,dayRollover:'ZI_START'}),zi=calculate(ziRequest,optionsFor(ziRequest));checkResult(zi,ziRequest,'MALE');assert.equal(zi.m1.chart.effectiveDayDate,'2027-01-01');assert.equal(zi.luck.candidates[0].dayun.start.birthMinute,'2026-12-31T23:59');assert.deepEqual(zi.luck.candidates[0].dayun,late.luck.candidates[0].dayun);counts.additionalFeatureCases++;
  const months=new Map(),allMonthIds=new Set(candidate.months.map(row=>monthKey(row.lunarYear,row.lunarMonth,row.leap)));
  for(const row of candidate.dates)if(row.solarDate>='1989-01-01'&&row.solarDate<'2027-01-01'&&!months.has(monthKey(row.lunarYear,row.lunarMonth,row.leap)))months.set(monthKey(row.lunarYear,row.lunarMonth,row.leap),row);
  for(const row of months.values()){
    const lunarRequest=lunar=>({calendar:'KOREAN_LUNAR',lunarDate:lunar,time:'12:00',policies:basePolicy});
    if(row.leap){
      const leapReq=lunarRequest(lunarDate(row)),regularReq=lunarRequest({...lunarDate(row),leap:false});
      const leap=calculate(leapReq,optionsFor(leapReq)),regular=calculate(regularReq,optionsFor(regularReq));checkResult(leap,leapReq,'MALE');checkResult(regular,regularReq,'MALE');assert.notEqual(leap.m1.input.gregorianDate,regular.m1.input.gregorianDate);counts.leapMonthPairs++;
    }else if(!allMonthIds.has(monthKey(row.lunarYear,row.lunarMonth,true))){const invalid=lunarRequest({...lunarDate(row),leap:true}),result=calculate(invalid,{dayun:{traditionalSex:'MALE',count:10},seyun:{yearLabel:2027}});assert.equal(result.status,'INVALID_LUNAR_DATE');assert.equal(result.luck,null);counts.invalidLeapRequests++;}
  }
  assert.equal(counts.leapMonthPairs,14);assert.equal(counts.invalidLeapRequests,443);
  const aRequest=request('2026-02-04','05:02'),aOptions=optionsFor(aRequest,'FEMALE');
  const calculateA=(req,options)=>{const before=aM1Calls,result=aProfile.calculate(req,options);assert.equal(aM1Calls-before,1);counts.auxiliaryProfileInvocations++;validate(result);return result;};
  const aFingerprint=fingerprint(calculateA(aRequest,aOptions));
  for(let year=1989;year<=2026;year++){
    const req=request(year+'-01-01','23:30',{...basePolicy,dayRollover:year%2?'ZI_START':'CIVIL_MIDNIGHT',hourStemReference:year%3?'SELECTED_DAY_PILLAR':'CIVIL_DATE_DAY_PILLAR'}),options=optionsFor(req,year%2?'MALE':'FEMALE'),first=calculate(req,options),expected=fingerprint(first);
    checkResult(first,req,options.dayun.traditionalSex);assert.equal(fingerprint(calculateA(aRequest,aOptions)),aFingerprint);
    const otherReq=request((year===2026?1989:2026)+'-12-31');calculate(otherReq,optionsFor(otherReq,'FEMALE'));
    assert.equal(fingerprint(calculate(req,options)),expected);counts.alternationChecks++;
    first.m1.evidence.appliedJie[0].original.time='MODIFIED_OUTPUT';assert.throws(()=>validateLocalLuckResult(first));
    const forgedLuck=structuredClone(first.luck);forgedLuck.candidates[0].dayun.traditionalSex='MODIFIED_OUTPUT';assert.throws(()=>validateLuckExplanation(first.explanation,forgedLuck));
    assert.equal(fingerprint(calculate(req,options)),expected);counts.mutationIsolationChecks++;
  }
  const one=calculate(request(),optionsFor(request())),two=calculate(request(),optionsFor(request()));assert.deepEqual(one,two);counts.reproducibilityChecks++;
  const swapped=calculate(request(),optionsFor(request())),opposite=calculate(request(),optionsFor(request(),'FEMALE'));swapped.luck=opposite.luck;swapped.explanation=opposite.explanation;assert.throws(()=>validateLocalLuckResult(swapped));counts.additionalFeatureCases++;
  const alteredSchema=calculate(request(),optionsFor(request()));alteredSchema.schemaVersion='MODIFIED_SCHEMA';assert.throws(()=>validateLocalLuckResult(alteredSchema));counts.additionalFeatureCases++;
  await assert.rejects(()=>loadLocalLuckProfile({directory:state.input,expectedManifestSha256:'0'.repeat(64),profileId:MODERN_PROFILE_ID,luckPolicyId:M7_LUCK_POLICY_V01}));counts.negativeLoaderChecks++;
  await assert.rejects(()=>loadLocalLuckProfile({directory:join(root,'.private','INTENTIONALLY_MISSING_M7_CANDIDATE'),expectedManifestSha256:BASELINE_MANIFEST_SHA256,profileId:MODERN_PROFILE_ID,luckPolicyId:M7_LUCK_POLICY_V01}));counts.negativeLoaderChecks++;
  const referenceExplanation=createLocalExplanationProfile(chartProfile,{m2ProfileId:M2_LOCAL_PROFILE_ID});
  let optionalM1Calls=0;const optionalSpy={...chartProfile,calculate(req){optionalM1Calls++;return chartProfile.calculate(req);}},optionalProfile=createLocalLuckProfile(optionalSpy,{luckPolicyId:M7_LUCK_POLICY_V01,m2ProfileId:M2_LOCAL_PROFILE_ID,contextProfile:chartProfile});
  for(const req of [request(),request('2026-02-04','05:02'),request('1989-01-01'),request('2026-12-31','23:59')])for(const traditionalSex of ['MALE','FEMALE']){
    const before=optionalM1Calls,result=optionalProfile.calculate(req,optionsFor(req,traditionalSex));assert.equal(optionalM1Calls-before,1);validate(result);assert.equal(result.baseExplanation.m1,result.m1);
    const reference=referenceExplanation.calculate(req);counts.referenceM2BirthCalls++;assert.deepEqual(result.baseExplanation,reference);assert.ok(renderLocalLuckText(result).includes('원국 M2 기초 설명'));counts.m2OptionalIntegrationCases++;
  }
  assert.equal(optionalM1Calls,counts.m2OptionalIntegrationCases);assert.equal(aM1Calls,counts.auxiliaryProfileInvocations);
  await checkPreserved(state);
  const semanticDigests=Object.fromEntries(Object.entries(hashes).map(([name,hash])=>[name,hash.digest('hex')]));assert.equal(semanticDigests.gregorian,semanticDigests.lunar);assert.equal(m1Calls,counts.productM1Calls);
  const summary={schemaVersion:'kasi-local-m7-acceptance-v01',status:'MODERN_M7_LUCK_PASS',inputNature:'EXPLICIT_ARTIFICIAL_GRID_NOT_PERSONAL_RECORDS',profileId:MODERN_PROFILE_ID,luckPolicyId:M7_LUCK_POLICY_V01,birthRange:{fromInclusive:'1989-01-01',untilExclusive:'2027-01-01'},manifestContentSha256:BASELINE_MANIFEST_SHA256,exportSha256:exportSha,preservedInputTrees:Object.fromEntries([...state.before].map(([name,files])=>[name,fingerprint(files)])),gridCounts,gridFeatureStatuses,additionalFeatureStatuses,counts,verifiedCandidateFeatureStatuses:statuses,semanticDigests,verificationLayers:{allDates:'INTERNAL_GREGORIAN_LUNAR_M1_M7_CONNECTION',independentTestReference:'RAW_PINNED_JIE_ROWS_CIVIL_DAY_ARITHMETIC_AND_FIXED_DIRECTION_CONTRACT_NOT_A_CLASSICAL_ORACLE',timezone:'SEPARATE_PROCESS_COMPARISON_REQUIRED'},apiRequests:0,allPreservedInputsUnchanged:true,notVerified:['critical-edition/scan/rights authentication','exact calendar luck transition dates or current decade','historical birth clocks before1989','predictions, strength or transformation','public G0/default-profile deployment']};
  const paths=['scripts/kasi/local-luck-verify.mjs','scripts/kasi/local-luck.mjs','scripts/kasi/local-chart.mjs','scripts/kasi/local-chart-facts.mjs','scripts/kasi/local-explain.mjs','src/luck/luckV01.ts','dist/luck/luckV01.js'];
  const executedFiles=[];for(const path of paths)executedFiles.push({path,sha256:sha(await readFile(join(root,path)))});
  const execution={executedAt:new Date().toISOString(),node:process.version,processTZ:process.env.TZ??null,resolvedHostTimezone:Intl.DateTimeFormat().resolvedOptions().timeZone,codeSha:git(['rev-parse','HEAD']),workingTreeDirty:git(['status','--porcelain']).length>0,executedFiles,command:{executable:process.execPath,arguments:process.argv.slice(1)},summaryContentSha256:fingerprint(summary)};
  await mkdir(state.out,{mode:0o700});await writeFile(join(state.out,'summary.json'),JSON.stringify(summary,null,2)+'\n',{flag:'wx',mode:0o600});await writeFile(join(state.out,'execution.json'),JSON.stringify(execution,null,2)+'\n',{flag:'wx',mode:0o600});console.log(JSON.stringify({...summary,execution},null,2));return summary;
}
if(process.argv[1]&&import.meta.url===pathToFileURL(resolve(process.argv[1])).href){
  try{assert.equal(process.argv.length,4,'Usage: node scripts/kasi/local-luck-verify.mjs <candidateDir> <freshPrivateOutputDir>');await runLocalLuckAcceptance(process.argv[2],process.argv[3]);}
  catch(error){console.error('MODERN_M7_LUCK_REJECTED',error.code??error.name,error.message);process.exitCode=1;}
}
