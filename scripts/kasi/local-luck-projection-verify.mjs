/** Actual private M7 v0.2 acceptance. Every birth is a declared artificial input. */
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {readFile,realpath,mkdir,writeFile} from 'node:fs/promises';
import {execFileSync} from 'node:child_process';
import {dirname,isAbsolute,join,relative,resolve} from 'node:path';
import {fileURLToPath,pathToFileURL} from 'node:url';
import {canonical,fingerprint,sha} from '../../.kasi-build/schema.js';
import {loadCandidate} from './candidate.mjs';
import {inventory} from './research.mjs';
import {BASELINE_MANIFEST_SHA256,MODERN_PROFILE_ID,STAGE_A_PROFILE_ID,MODERN_CLOCK_POLICY_ID,createLocalChartProfile,loadLocalChartProfile} from './local-chart.mjs';
import {modernExplanationGrid} from './local-explain-verify.mjs';
import {MONTH_BOUNDARY_JIE} from '../../dist/calendar/monthPillar.js';
import {SEXAGENARY_CYCLE} from '../../dist/domain/sexagenary.js';
import {STEM_NATURE} from '../../dist/domain/stems.js';
import {M7_LUCK_POLICY_V01} from '../../dist/luck/luckV01.js';
import {CALENDAR_PROJECTION_POLICY_V02} from '../../dist/luck/calendarProjectionV02.js';
import {createLocalLuckProjectionProfile,projectLocalLuckResult,validateLocalLuckProjectionResult,renderLocalLuckProjectionText} from './local-luck-projection.mjs';

const root=resolve(dirname(fileURLToPath(import.meta.url)),'../..');
const exportSha='7b5584aca339b85c7e54e953c43b672358bda605a478831b6f260df00472e851';
// Independently recorded before this change; never derive these expectations from input files.
const treePins={candidateA:'b2a2560d2d6324554e8bacf4f34e5a788cddabe71e99843b3b6dcb6876a89bed',candidateB:'b143a6cd766a9d0c0e763f93aba1236db68a29c2a5e71a89647e0371dbca6584',completedInput:'82c5a30c679ac743c0c89a0192ce2cf21a42387fd4ad8cbb6847a4db18866567'};
const legacySemanticPin='7c4f209cf4434a6d3ab09daeb2bffd4fd3ae6390b8ab0e88733ee0f2ffde4eb9';
const inDirectory=(parent,child)=>{const p=relative(parent,child);return p!==''&&!p.startsWith('..')&&!isAbsolute(p);};
const git=args=>execFileSync('git',['-c','safe.directory='+root.replaceAll('\\','/'),...args],{cwd:root,encoding:'utf8',stdio:['ignore','pipe','pipe']}).trim();
const lunarDate=row=>({lunarYear:row.lunarYear,lunarMonth:row.lunarMonth,lunarDay:row.lunarDay,leap:row.leap});
const glyph=p=>p.stem+p.branch;
const sourceId=row=>'KASI_OPENAPI_RESPONSE:'+row.sourceRef+':'+row.date+':'+row.termCode;
const cycleIndex=new Map(SEXAGENARY_CYCLE.map((p,i)=>[glyph(p),i]));
const increment=(bucket,status)=>{assert.equal(typeof status,'string');bucket[status]=(bucket[status]??0)+1;};
const modernMinute=minute=>minute>='1989-01-01T00:00'&&minute<'2027-01-01T00:00';

/** Independent test reference: explicit UTC fields implement Gregorian arithmetic, never an API UTC instant. */
function parts(minute){const match=/^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})$/.exec(minute);assert.ok(match);const [,y,m,d,h,n]=match.map(Number);return {y,m,d,h,n};}
const daysInMonth=(year,month)=>[31,year%4===0&&(year%100!==0||year%400===0)?29:28,31,30,31,30,31,31,30,31,30,31][month-1];
function explicitUtc(p){const date=new Date(0);date.setUTCFullYear(p.y,p.m-1,p.d);date.setUTCHours(p.h,p.n,0,0);return date;}
const printed=date=>date.toISOString().slice(0,16);
const shifted=(minute,delta)=>printed(new Date(explicitUtc(parts(minute)).getTime()+delta*60000));
function referenceYear(minute,years){const p=parts(minute),last=daysInMonth(p.y+years,p.m),clamped=p.d>last;return {minute:printed(explicitUtc({...p,y:p.y+years,d:Math.min(p.d,last)})),clamped};}
function referenceCalendar(birthMinute,minutes,count){
  const decomposition={years:Math.floor(minutes/4320),months:Math.floor(minutes%4320/360),days:Math.floor(minutes%360/12),hours:2*(minutes%12),originalMinutes:minutes};
  let current=birthMinute;const stages=[];
  const year=referenceYear(current,decomposition.years);stages.push({unit:'YEARS',amount:decomposition.years,inputMinute:current,resultMinute:year.minute,clamped:year.clamped});current=year.minute;
  const p=parts(current),monthIndex=p.y*12+(p.m-1)+decomposition.months,targetYear=Math.floor(monthIndex/12),targetMonth=monthIndex%12+1,last=daysInMonth(targetYear,targetMonth);
  const month=printed(explicitUtc({...p,y:targetYear,m:targetMonth,d:Math.min(p.d,last)}));stages.push({unit:'MONTHS',amount:decomposition.months,inputMinute:current,resultMinute:month,clamped:p.d>last});current=month;
  const afterDay=shifted(current,decomposition.days*1440);stages.push({unit:'DAYS',amount:decomposition.days,inputMinute:current,resultMinute:afterDay,clamped:false});current=afterDay;
  const firstStartMinute=shifted(current,decomposition.hours*60);stages.push({unit:'HOURS',amount:decomposition.hours,inputMinute:current,resultMinute:firstStartMinute,clamped:false});
  const boundaries=Array.from({length:count+1},(_,i)=>referenceYear(firstStartMinute,10*i));
  return {decomposition,steps:stages,firstStartMinute,periods:Array.from({length:count},(_,i)=>({index:i,ordinal:i+1,startInclusive:boundaries[i].minute,endExclusive:boundaries[i+1].minute,anchorMinute:firstStartMinute,yearsFromAnchor:10*i,startClamped:boundaries[i].clamped,endClamped:boundaries[i+1].clamped}))};
}
function independentDayun(natal,context,birth,traditionalSex,jieRows){
  const polarity=STEM_NATURE[natal.year.stem].polarity,forward=polarity==='YANG'&&traditionalSex==='MALE'||polarity==='YIN'&&traditionalSex==='FEMALE';
  const direction=forward?'FORWARD':'REVERSE',at=jieRows.find(row=>row.date+'T'+row.time===birth);
  const conditional=at&&(forward&&context.boundarySide==='BEFORE_PUBLISHED_MINUTE'||!forward&&context.boundarySide==='AFTER_PUBLISHED_MINUTE');
  const selected=conditional?at:forward?jieRows.find(row=>row.date+'T'+row.time>birth):jieRows.findLast(row=>row.date+'T'+row.time<birth);
  const index=cycleIndex.get(glyph(natal.month));assert.notEqual(index,undefined);
  const sequence=Array.from({length:10},(_,i)=>SEXAGENARY_CYCLE[(index+(forward?1:-1)*(i+1)+600)%60]);
  return {direction,sequence,selected,status:!selected?'NEEDS_DATA':conditional?'AMBIGUOUS':'OK',minutes:!selected||conditional?null:Math.abs((explicitUtc(parts(selected.date+'T'+selected.time))-explicitUtc(parts(birth)))/60000)};
}
// Exact v0.1 meaning projection/order from the prior executed verifier; the current run must regenerate its pin.
function legacySemantics(r){return {chart:r.m1.chart,luck:{policy:r.luck.policy.id,policyVersion:r.luck.policy.version,candidates:r.luck.candidates.map(c=>({candidateRef:c.candidateRef,candidateIndex:c.candidateIndex,boundarySide:c.boundarySide,dayun:c.dayun,seyun:c.seyun})),seyun:r.luck.seyun},explanation:{schemaVersion:r.explanation.schemaVersion,templateVersion:r.explanation.templateVersion,scopeNote:r.explanation.scopeNote,candidates:r.explanation.candidates.map(c=>({candidateRef:c.candidateRef,candidateIndex:c.candidateIndex,items:c.items.map(({templateId,templateVersion,text})=>({templateId,templateVersion,text}))}))}};}
function projectionSemantics(r){return {schemaVersion:r.schemaVersion,candidates:r.projection.candidates.map(c=>({candidateRef:c.candidateRef,candidateIndex:c.candidateIndex,calendar:c.calendar,selection:c.selection})),explanation:r.explanation.candidates.map(c=>({candidateRef:c.candidateRef,candidateIndex:c.candidateIndex,items:c.items.map(({templateId,templateVersion,text})=>({templateId,templateVersion,text}))}))};}

async function protectedInputs(candidateDirectory,outputDirectory){
  const privateRoot=await realpath(join(root,'.private')),input=await realpath(resolve(candidateDirectory)),out=resolve(outputDirectory);
  assert.ok(inDirectory(privateRoot,input)&&inDirectory(privateRoot,out));assert.equal(await realpath(dirname(out)),dirname(out));
  const directories=new Map([['providedCandidate',input],['candidateA',await realpath(join(privateRoot,'kasi-research-1950-2026-fe84ab4-a'))],['candidateB',await realpath(join(privateRoot,'kasi-research-1950-2026-fe84ab4-b'))],['completedInput',await realpath(join(privateRoot,'kasi-local-1950-2026/monthly-xml'))]]),before=new Map(),cached=new Map();
  for(const [name,path]of directories){assert.ok(out!==path&&!inDirectory(path,out)&&!inDirectory(out,path));if(!cached.has(path))cached.set(path,await inventory(path));before.set(name,cached.get(path));}
  for(const [name,pin]of Object.entries(treePins))assert.equal(fingerprint(before.get(name)),pin,name+' must match its independent prior tree pin');
  assert.equal(sha(await readFile(join(directories.get('completedInput'),'export.json'))),exportSha);
  const loaded=await loadCandidate(input,BASELINE_MANIFEST_SHA256),other=await loadCandidate(directories.get('candidateB'),BASELINE_MANIFEST_SHA256);
  assert.equal(fingerprint(other.manifest),BASELINE_MANIFEST_SHA256);assert.equal(loaded.manifest.inputTreeSha256,fingerprint(before.get('completedInput')));
  return {input,out,directories,before,loaded};
}
async function checkProtected(state){const cached=new Map();for(const [name,path]of state.directories){if(!cached.has(path))cached.set(path,await inventory(path));assert.equal(fingerprint(cached.get(path)),fingerprint(state.before.get(name)),name+' modified');}assert.equal(sha(await readFile(join(state.directories.get('completedInput'),'export.json'))),exportSha);}

export async function runLocalLuckProjectionAcceptance(candidateDirectory,outputDirectory,{benchmarkVectors=null,focusedOnly=false}={}){
  assert.ok(benchmarkVectors===null||Number.isInteger(benchmarkVectors)&&benchmarkVectors>=1&&benchmarkVectors<=100,'Benchmark limit must be explicit 1..100; it never yields an acceptance PASS');
  assert.equal(typeof focusedOnly,'boolean');assert.ok(!focusedOnly||benchmarkVectors===null,'Focused debugging and benchmark modes are distinct; neither is full acceptance');
  const setupStarted=performance.now();
  const state=await protectedInputs(candidateDirectory,outputDirectory),{candidate,index,sources}=state.loaded;
  const chart=createLocalChartProfile(state.loaded,{profileId:MODERN_PROFILE_ID,expectedManifestSha256:BASELINE_MANIFEST_SHA256});let m1Calls=0;
  const spy={...chart,calculate(request){m1Calls++;return chart.calculate(request);}};
  const profile=createLocalLuckProjectionProfile(spy,{luckPolicyId:M7_LUCK_POLICY_V01,calendarProjectionPolicyId:CALENDAR_PROJECTION_POLICY_V02,contextProfile:chart});
  const stageA=createLocalChartProfile(state.loaded,{profileId:STAGE_A_PROFILE_ID,expectedManifestSha256:BASELINE_MANIFEST_SHA256});let aM1Calls=0;
  const aSpy={...stageA,calculate(request){aM1Calls++;return stageA.calculate(request);}},aProfile=createLocalLuckProjectionProfile(aSpy,{luckPolicyId:M7_LUCK_POLICY_V01,calendarProjectionPolicyId:CALENDAR_PROJECTION_POLICY_V02,contextProfile:stageA});
  const rows=new Map(candidate.dates.map(row=>[row.solarDate,row])),receipts=new Map(sources.map(row=>[row.id,row])),eventRows=new Map(candidate.events.map(row=>[sourceId(row),row]));
  const contexts=new Map();for(let year=1989;year<=2026;year++)contexts.set(year,chart.eventsForYear(year));
  const jieRows=candidate.events.filter(row=>(row.date>='1989-01-01'||row.date.startsWith('1988-12-'))&&row.date<'2027-01-01'&&MONTH_BOUNDARY_JIE.includes(row.termCode)).sort((a,b)=>(a.date+'T'+a.time).localeCompare(b.date+'T'+b.time));assert.equal(jieRows.length,457);
  const counts={distinctCivilDates:0,dailyCases:0,jieBeforeAtAfterCases:0,calendarBoundaryCases:0,totalBirthVectors:0,totalGenderCalendarPairs:0,productInvocations:0,productBirthM1Calls:0,candidates:0,independentRawJieChecks:0,independentCalendarChecks:0,periodChecks:0,clampedYearSteps:0,clampedMonthSteps:0,sourceEvidenceChecks:0,projectionFactChecks:0,projectionExplanationChecks:0,focusedBirthCalls:0,focusedProjectionCalls:0,focusedAsOfSelections:0,auxiliaryProfileCalls:0,alternationChecks:0,mutationIsolationChecks:0,negativeLoaderChecks:0,adversarialEnvelopeChecks:0};
  const statuses={legacyStart:{},projection:{},asOf:{}};
  const hashes={legacyGregorian:createHash('sha256'),legacyLunar:createHash('sha256'),projectionGregorian:createHash('sha256'),projectionLunar:createHash('sha256')};
  const calculate=(request,features,options={})=>{const before=m1Calls,result=profile.calculate(request,features,options);assert.equal(m1Calls-before,1);counts.productInvocations++;counts.productBirthM1Calls++;return result;};
  function checkBase(m7,request,sex){
    // The outer issued-result validator already validates this unchanged live v0.1 envelope.
    assert.equal(m7.status,'OK');assert.equal(m7.profile,undefined);
    assert.equal(m7.m1.dataset.candidateManifestContentSha256,BASELINE_MANIFEST_SHA256);assert.equal(m7.m1.profile.g0Receipt,null);assert.equal(m7.m1.profile.g1P2Promotion,false);assert.equal(m7.baseExplanation,null);
    assert.equal(m7.luck.validation.g0Receipt,null);assert.equal(m7.luck.validation.g1P2Promotion,false);assert.equal(m7.luck.validation.predictiveValidity,'NOT_CLAIMED');assert.equal(m7.luck.validation.editionVerification,'UNVERIFIED');assert.equal(m7.luck.validation.rightsReview,'UNVERIFIED');
    const minute=m7.m1.chart.recordedBirthKstMinute,date=m7.m1.input.gregorianDate,raw=rows.get(date);assert.ok(raw);assert.equal(minute,date+'T'+request.time);assert.equal(m7.m1.input.calendar,request.calendar);
    assert.deepEqual(m7.m1.evidence.dateConversion.observed,{solarDate:date,...lunarDate(raw)});assert.equal(m7.m1.evidence.dateConversion.sourceRef,raw.sourceRef);assert.deepEqual(m7.m1.evidence.dateConversion.source,receipts.get(raw.sourceRef));assert.equal(m7.m1.evidence.dateConversion.calendarGanjiUsedAsPillars,false);
    for(const source of m7.luck.sources)if(source.kind==='CALENDAR_API'&&source.id.startsWith('KASI_OPENAPI_RESPONSE:')){const original=source.evidence.original,actual=eventRows.get(sourceId(original));assert.ok(actual);assert.deepEqual(original,actual);assert.deepEqual(source.evidence.source,receipts.get(actual.sourceRef));counts.sourceEvidenceChecks++;}
    for(const local of m7.luck.candidates){const i=local.candidateIndex,ref='chart.candidates['+i+']',expected=independentDayun(m7.m1.chart.candidates[i],m7.m1.chart.monthBoundaryTrace.candidateContexts[i],minute,sex,jieRows),dayun=local.dayun;
      assert.equal(local.candidateRef,ref);assert.equal(dayun.direction.direction,expected.direction);assert.equal(dayun.start.status,expected.status);assert.equal(dayun.start.birthMinute,minute);assert.deepEqual(dayun.sequence.entries.map(e=>e.pillar),expected.sequence);
      if(expected.selected){assert.equal(dayun.start.selectedEvent.displayedDateTime,expected.selected.date+'T'+expected.selected.time);assert.deepEqual(dayun.start.selectedEvent.sourceIds,[sourceId(expected.selected)]);}else assert.deepEqual(dayun.start.missingData.map(({year,term})=>({year,term})),[{year:2027,term:'XIAOHAN'}]);
      if(expected.status==='OK'){assert.equal(dayun.start.nominalIntervalMinutes,expected.minutes);assert.equal(dayun.start.age.numerator,expected.minutes);assert.equal(dayun.start.age.denominator,4320);}else{assert.equal(dayun.start.age,null);assert.equal(dayun.modelAgeIntervals,null);}
      assert.equal(dayun.calendarProjection.status,'POLICY_UNRESOLVED');assert.equal(dayun.currentDecade.status,'POLICY_UNRESOLVED');counts.independentRawJieChecks++;
    }
    return minute;
  }
  function checkResult(result,request,sex,expectedCalendars=new Map(),tally=true){
    assert.equal(result.status,'OK');validateLocalLuckProjectionResult(result);const m7=result.m7,birth=checkBase(m7,request,sex);
    assert.equal(result.projection.candidates.length,m7.luck.candidates.length);assert.deepEqual(result.projection.provenance,m7.luck.provenance);assert.deepEqual(result.projection.executionCounts,m7.luck.executionCounts);assert.equal(result.projection.baseBirthCalculationFingerprint,m7.luck.birthCalculationFingerprint);
    assert.equal(result.projection.validation.meaning,'NOMINAL_UNDER_SELECTED_POLICY');assert.equal(result.projection.validation.actualInstantCertified,false);assert.equal(result.projection.validation.calendarProjectionIsMonotonic,false);assert.equal(result.projection.validation.g0Receipt,null);assert.equal(result.projection.validation.g1P2Promotion,false);
    const factIds=new Map(),ruleIds=new Set(result.projection.rules.map(r=>r.id)),sourceIds=new Set(result.projection.sources.map(s=>s.id));
    for(const projected of result.projection.candidates){const i=projected.candidateIndex,base=m7.luck.candidates[i],cal=projected.calendar;assert.equal(projected.candidateRef,base.candidateRef);assert.equal(cal.candidateRef,base.candidateRef);assert.equal(cal.birthMinute,birth);
      if(tally){counts.candidates++;increment(statuses.legacyStart,base.dayun.start.status);increment(statuses.projection,cal.status);}
      assert.equal(cal.policyId,CALENDAR_PROJECTION_POLICY_V02);assert.equal(cal.precision.sourcePrecision,'MINUTE');assert.equal(cal.precision.resultMeaning,'NOMINAL_UNDER_SELECTED_POLICY');assert.equal(cal.precision.actualInstantCertified,false);assert.equal(cal.precision.utcInstant,null);assert.equal(projected.input.recordedBirthMinute,birth);assert.equal(projected.input.direction,base.dayun.direction.direction);assert.deepEqual(projected.input.selectedEvent,base.dayun.start.selectedEvent);assert.equal(projected.input.intervalMinutes,base.dayun.start.nominalIntervalMinutes);
      if(base.dayun.start.status!=='OK'){assert.equal(cal.status,base.dayun.start.status);assert.equal(cal.firstStartMinute,null);assert.equal(cal.decomposition,null);assert.deepEqual(cal.periods,[]);assert.deepEqual(cal.missingData,base.dayun.start.missingData);}
      else{
        assert.equal(cal.status,'PROJECTED_UNDER_POLICY');assert.equal(cal.intervalMinutes,base.dayun.start.nominalIntervalMinutes);assert.deepEqual(cal.modelAge,base.dayun.start.age);
        const key=base.candidateRef+':'+cal.intervalMinutes;if(!expectedCalendars.has(key))expectedCalendars.set(key,referenceCalendar(birth,cal.intervalMinutes,base.dayun.sequence.entries.length));const expected=expectedCalendars.get(key);
        assert.deepEqual(Object.fromEntries(['years','months','days','hours','originalMinutes'].map(key=>[key,cal.decomposition[key]])),expected.decomposition);assert.equal(cal.firstStartMinute,expected.firstStartMinute);assert.deepEqual(cal.steps.map(({unit,amount,inputMinute,resultMinute,clamped})=>({unit,amount,inputMinute,resultMinute,clamped})),expected.steps);
        assert.equal(cal.firstStartMinute.slice(-2),birth.slice(-2));assert.equal(cal.periods.length,10);
        for(let n=0;n<cal.periods.length;n++){const period=cal.periods[n],ref=expected.periods[n];assert.deepEqual({...period,pillar:undefined},{...ref,pillar:undefined});assert.deepEqual(period.pillar,base.dayun.sequence.entries[n].pillar);assert.ok(period.startInclusive<period.endExclusive);if(n)assert.equal(cal.periods[n-1].endExclusive,period.startInclusive);if(tally)counts.periodChecks++;}
        if(tally){counts.independentCalendarChecks++;if(expected.steps[0].clamped)counts.clampedYearSteps++;if(expected.steps[1].clamped)counts.clampedMonthSteps++;}
      }
      const baseFactIds=new Set(base.facts.map(f=>f.id)),ids=new Set();for(const fact of projected.facts){assert.equal(fact.candidateRef,projected.candidateRef);assert.ok(!ids.has(fact.id));ids.add(fact.id);assert.ok(fact.baseFactRefs.length>0&&fact.baseFactRefs.every(id=>baseFactIds.has(id)));assert.ok(fact.ruleRefs.every(id=>ruleIds.has(id)));assert.ok(fact.policyRefs.every(id=>id===CALENDAR_PROJECTION_POLICY_V02));assert.ok(fact.sourceRefs.every(id=>sourceIds.has(id)));assert.ok(fact.calculationSourceRefs.every(id=>sourceIds.has(id)));if(tally)counts.projectionFactChecks++;}factIds.set(projected.candidateRef,ids);
    }
    for(const view of result.explanation.candidates){const ids=factIds.get(view.candidateRef);assert.ok(ids);for(const item of view.items){assert.equal(item.candidateRef,view.candidateRef);assert.ok(item.factRefs.length>0&&item.factRefs.every(id=>ids.has(id)));assert.ok(item.ruleRefs.every(id=>ruleIds.has(id)));assert.ok(item.sourceRefs.every(id=>sourceIds.has(id)));if(tally)counts.projectionExplanationChecks++;}}
    return result;
  }
  const basePolicy={clockPolicyId:MODERN_CLOCK_POLICY_ID,dayRollover:'CIVIL_MIDNIGHT',hourStemReference:'SELECTED_DAY_PILLAR'};
  const request=(date='1990-06-01',time='12:00',policies=basePolicy)=>({calendar:'GREGORIAN',date,time,policies});
  const features=(minute,traditionalSex='MALE')=>({dayun:{traditionalSex,count:10},seyun:{yearLabel:2027,queryMinute:minute}});
  const gridStarted=performance.now();
  for(const vector of focusedOnly?[]:modernExplanationGrid(candidate,contexts)){
    const date=vector.minute.slice(0,10),time=vector.minute.slice(11),row=index.fromGregorianDate(date).value;assert.ok(row);
    for(const sex of ['MALE','FEMALE']){
      const args=features(vector.minute,sex),gRequest={calendar:'GREGORIAN',date,time,policies:vector.policy},lRequest={calendar:'KOREAN_LUNAR',lunarDate:lunarDate(row),time,policies:vector.policy},expected=new Map();
      const g=checkResult(calculate(gRequest,args),gRequest,sex,expected),l=checkResult(calculate(lRequest,args),lRequest,sex,expected);
      const g0=legacySemantics(g.m7),l0=legacySemantics(l.m7),g2=projectionSemantics(g),l2=projectionSemantics(l);assert.deepEqual(g0,l0);assert.deepEqual(g2,l2);
      const entry=result=>({category:vector.category,traditionalSex:sex,policy:vector.policy,result});
      hashes.legacyGregorian.update(canonical(entry(g0))+'\n');hashes.legacyLunar.update(canonical(entry(l0))+'\n');hashes.projectionGregorian.update(canonical(entry(g2))+'\n');hashes.projectionLunar.update(canonical(entry(l2))+'\n');counts.totalGenderCalendarPairs++;
    }
    counts[vector.category]++;counts.totalBirthVectors++;if(vector.category==='dailyCases')counts.distinctCivilDates++;
    if(counts.totalBirthVectors%1000===0)console.error('M7_PROJECTION_PROGRESS',JSON.stringify({birthVectors:counts.totalBirthVectors,pairs:counts.totalGenderCalendarPairs,projected:statuses.projection.PROJECTED_UNDER_POLICY??0}));
    if(benchmarkVectors!==null&&counts.totalBirthVectors===benchmarkVectors)break;
  }
  if(benchmarkVectors!==null){const gridMilliseconds=performance.now()-gridStarted;await checkProtected(state);assert.equal(m1Calls,counts.productBirthM1Calls);const result={status:'BENCHMARK_ONLY_NOT_FULL_ACCEPTANCE',setupMilliseconds:gridStarted-setupStarted,gridMilliseconds,counts,statuses,allPreservedInputsUnchanged:true};console.log(JSON.stringify(result));return result;}
  if(!focusedOnly){assert.equal(counts.totalBirthVectors,47975);assert.equal(counts.totalGenderCalendarPairs,95950);assert.equal(counts.productInvocations,191900);assert.equal(counts.productBirthM1Calls,191900);assert.equal(counts.candidates,199196);
    assert.deepEqual(statuses.legacyStart,{...statuses.legacyStart,OK:191738,AMBIGUOUS:7296,NEEDS_DATA:162});assert.equal(counts.independentCalendarChecks,191738);assert.equal(counts.periodChecks,1917380);}
  const gridCounts=structuredClone(counts),gridFeatureStatuses=structuredClone(statuses);

  function referenceSelection(calendar,birth,asOf){if(!modernMinute(asOf))return {status:'POLICY_UNRESOLVED',ordinal:null};if(calendar.status!=='PROJECTED_UNDER_POLICY')return {status:calendar.status,ordinal:null};if(asOf<birth)return {status:'BEFORE_BIRTH',ordinal:null};if(asOf<calendar.firstStartMinute)return {status:'BEFORE_FIRST_DA_YUN',ordinal:null};const selected=calendar.periods.find(period=>period.startInclusive<=asOf&&asOf<period.endExclusive);return {status:selected?'RESOLVED_UNDER_POLICY':'OUTSIDE_GENERATED_RANGE',ordinal:selected?.ordinal??null};}
  const focusedCases=[request('1990-06-01'),request('1990-01-31'),request('1992-02-29'),request('2000-02-29'),request('2000-12-31','23:59'),request('2026-06-01'),request('2026-02-04','05:02'),request('2026-12-31'),request('1989-01-01')];
  const focusedExamples=[],focusedTransitionExamples=[];
  for(const req of focusedCases)for(const sex of ['MALE','FEMALE']){
    const birth=req.date+'T'+req.time,args=features(birth,sex),base=checkResult(calculate(req,args),req,sex);counts.focusedBirthCalls++;
    const queries=new Set(['1988-12-31T23:59','1989-01-01T00:00','2026-11-01T12:00','2027-01-01T00:00',birth,shifted(birth,-1),shifted(birth,1)]);
    for(const candidate of base.projection.candidates)if(candidate.calendar.status==='PROJECTED_UNDER_POLICY')for(const boundary of [candidate.calendar.firstStartMinute,...candidate.calendar.periods.map(p=>p.endExclusive)])if(modernMinute(boundary))for(const delta of [-1,0,1])queries.add(shifted(boundary,delta));
    const oldFingerprint=fingerprint(base.m7),m1Before=m1Calls;let primaryQueryMeaning;
    for(const asOf of queries){
      const projected=projectLocalLuckResult(base.m7,{calendarProjectionPolicyId:CALENDAR_PROJECTION_POLICY_V02,asOfMinute:asOf});validateLocalLuckProjectionResult(projected);assert.equal(m1Calls,m1Before,'Projection/query must not recalculate M1');assert.equal(fingerprint(base.m7),oldFingerprint);
      for(const candidate of projected.projection.candidates){assert.deepEqual(candidate.calendar,base.projection.candidates[candidate.candidateIndex].calendar,'As-of must not alter the independently checked nominal table');const expected=referenceSelection(candidate.calendar,birth,asOf),actual=candidate.selection;assert.equal(actual.candidateRef,candidate.candidateRef);assert.equal(actual.asOfMinute,asOf);assert.equal(actual.status,expected.status);assert.equal(actual.selection?.ordinal??null,expected.ordinal);if(actual.selection)assert.deepEqual(actual.selection,candidate.calendar.periods[actual.selection.index]);increment(statuses.asOf,actual.status);counts.focusedAsOfSelections++;}
      counts.focusedProjectionCalls++;
      if(asOf==='2026-11-01T12:00')primaryQueryMeaning=projectionSemantics(projected);
      if(birth==='1990-06-01T12:00'&&base.projection.candidates.some(c=>c.calendar.status==='PROJECTED_UNDER_POLICY'&&[c.calendar.firstStartMinute,...c.calendar.periods.map(p=>p.endExclusive)].some(boundary=>modernMinute(boundary)&&Math.abs(explicitUtc(parts(asOf))-explicitUtc(parts(boundary)))<=60000)))focusedTransitionExamples.push({birthMinute:birth,traditionalSex:sex,asOfMinute:asOf,candidates:projected.projection.candidates.map(c=>({candidateRef:c.candidateRef,status:c.selection.status,selection:c.selection.selection}))});
    }
    const combined=checkResult(calculate(req,args,{asOfMinute:'2026-11-01T12:00'}),req,sex);assert.equal(combined.m7.m1.chart.recordedBirthKstMinute,birth);assert.deepEqual(projectionSemantics(combined),primaryQueryMeaning,'Combined product query must match projection of the same birth result');assert.ok(renderLocalLuckProjectionText(combined).length>0);counts.focusedBirthCalls++;
    focusedExamples.push({birthMinute:birth,traditionalSex:sex,asOfMinute:'2026-11-01T12:00',candidates:combined.projection.candidates.map(c=>({candidateRef:c.candidateRef,firstStartMinute:c.calendar.firstStartMinute,calendarStatus:c.calendar.status,firstPeriod:c.calendar.periods[0]??null,selectionStatus:c.selection.status,ordinal:c.selection.selection?.ordinal??null,pillar:c.selection.selection?.pillar??null,selectedPeriod:c.selection.selection}))});
  }
  // Fewer generated periods are explicitly distinct from unsupported as-of calendar scope.
  const shortRequest=request('1990-06-01'),shortFeatures={dayun:{traditionalSex:'MALE',count:1},seyun:{yearLabel:2027}};
  const short=calculate(shortRequest,shortFeatures,{asOfMinute:'2026-11-01T12:00'});validateLocalLuckProjectionResult(short);assert.ok(short.projection.candidates.every(c=>c.selection.status==='OUTSIDE_GENERATED_RANGE'));for(const candidate of short.projection.candidates){increment(statuses.asOf,candidate.selection.status);counts.focusedAsOfSelections++;}counts.focusedBirthCalls++;
  const first=calculate(request(),features('1990-06-01T12:00'));validateLocalLuckProjectionResult(first);const expected=fingerprint(first);
  const aRequest=request('2026-06-01'),aFeatures=features('2026-06-01T12:00');
  const calculateA=()=>{const before=aM1Calls,result=aProfile.calculate(aRequest,aFeatures,{asOfMinute:'2026-11-01T12:00'});assert.equal(aM1Calls-before,1);validateLocalLuckProjectionResult(result);counts.auxiliaryProfileCalls++;return result;};
  const aFingerprint=fingerprint(calculateA());
  for(let year=1989;year<=2026;year++){
    const req=request(year+'-01-01','23:30',{...basePolicy,dayRollover:year%2?'ZI_START':'CIVIL_MIDNIGHT',hourStemReference:year%3?'SELECTED_DAY_PILLAR':'CIVIL_DATE_DAY_PILLAR'}),args=features(req.date+'T'+req.time,year%2?'MALE':'FEMALE');
    const one=calculate(req,args,{asOfMinute:'2026-11-01T12:00'});validateLocalLuckProjectionResult(one);const oneFingerprint=fingerprint(one);
    assert.equal(fingerprint(calculate(request(),features('1990-06-01T12:00'))),expected);assert.equal(fingerprint(calculateA()),aFingerprint);assert.equal(fingerprint(calculate(req,args,{asOfMinute:'2026-11-01T12:00'})),oneFingerprint);counts.alternationChecks++;
    const forged=structuredClone(one);if(forged.projection.candidates[0].calendar.periods.length)forged.projection.candidates[0].calendar.periods[0].startInclusive='2000-01-01T00:00';assert.throws(()=>validateLocalLuckProjectionResult(forged));counts.adversarialEnvelopeChecks++;
    one.m7.m1.evidence.appliedJie[0].original.time='MODIFIED_PROVENANCE';assert.throws(()=>validateLocalLuckProjectionResult(one));counts.adversarialEnvelopeChecks++;assert.equal(fingerprint(calculate(req,args,{asOfMinute:'2026-11-01T12:00'})),oneFingerprint);counts.mutationIsolationChecks++;
  }
  const swap=calculate(request(),features('1990-06-01T12:00')),opposite=calculate(request(),features('1990-06-01T12:00','FEMALE'));swap.projection=opposite.projection;swap.explanation=opposite.explanation;assert.throws(()=>validateLocalLuckProjectionResult(swap));counts.adversarialEnvelopeChecks++;
  const schema=calculate(request(),features('1990-06-01T12:00'));schema.schemaVersion='MODIFIED_SCHEMA';assert.throws(()=>validateLocalLuckProjectionResult(schema));counts.adversarialEnvelopeChecks++;
  await assert.rejects(()=>loadLocalChartProfile({directory:state.input,expectedManifestSha256:'0'.repeat(64),profileId:MODERN_PROFILE_ID}));counts.negativeLoaderChecks++;
  await assert.rejects(()=>loadLocalChartProfile({directory:join(root,'.private','INTENTIONALLY_MISSING_PROJECTION_CANDIDATE'),expectedManifestSha256:BASELINE_MANIFEST_SHA256,profileId:MODERN_PROFILE_ID}));counts.negativeLoaderChecks++;
  await checkProtected(state);assert.equal(m1Calls,counts.productBirthM1Calls);assert.equal(aM1Calls,counts.auxiliaryProfileCalls);
  const digests=Object.fromEntries(Object.entries(hashes).map(([name,hash])=>[name,hash.digest('hex')]));if(!focusedOnly){assert.equal(digests.legacyGregorian,legacySemanticPin);assert.equal(digests.legacyLunar,legacySemanticPin);assert.equal(digests.projectionGregorian,digests.projectionLunar);}
  const summary={schemaVersion:'kasi-local-m7-projection-acceptance-v02',status:focusedOnly?'FOCUSED_ONLY_NOT_FULL_ACCEPTANCE':'MODERN_M7_NOMINAL_PROJECTION_PASS',inputNature:'EXPLICIT_ARTIFICIAL_GRID_NOT_PERSONAL_RECORDS',profileId:MODERN_PROFILE_ID,luckPolicyId:M7_LUCK_POLICY_V01,calendarProjectionPolicyId:CALENDAR_PROJECTION_POLICY_V02,birthRange:{fromInclusive:'1989-01-01',untilExclusive:'2027-01-01'},asOfRange:{fromInclusive:'1989-01-01T00:00',untilExclusive:'2027-01-01T00:00'},manifestContentSha256:BASELINE_MANIFEST_SHA256,exportSha256:exportSha,preservedInputTrees:Object.fromEntries([...state.before].map(([name,files])=>[name,fingerprint(files)])),gridCounts,gridFeatureStatuses,counts,verifiedFeatureStatuses:statuses,semanticDigests:digests,legacySemanticExpectedPin:legacySemanticPin,focusedExamples,focusedTransitionExamples,apiRequests:0,allPreservedInputsUnchanged:true,verificationLayers:{calendarReference:'INDEPENDENT_EXPLICIT_UTC_FIELDS_SEQUENTIAL_GREGORIAN_ARITHMETIC_NOT_ASTRONOMICAL_INSTANTS',legacy:focusedOnly?'NOT_RUN_IN_FOCUSED_DEBUG_MODE':'NEW_FULL_GRID_DIGEST_COMPARED_TO_PRIOR_INDEPENDENTLY_HELD_V01_DIGEST_AND_RAW_JIE_ROWS',timezone:'SEPARATE_PROCESS_COMPARISON_REQUIRED'},notVerified:['astronomically exact transition instants','other projection policies, critical editions or rights','future/historical civil-time or DST support','predictions, strength or useful-god interpretation','public/default/G0 profile deployment']};
  const paths=['scripts/kasi/local-luck-projection-verify.mjs','scripts/kasi/local-luck-projection.mjs','scripts/kasi/local-luck.mjs','scripts/kasi/local-chart.mjs','scripts/kasi/local-chart-facts.mjs','scripts/kasi/local-explain.mjs','src/luck/calendarProjectionV02.ts','dist/luck/calendarProjectionV02.js','src/luck/luckV01.ts','dist/luck/luckV01.js','src/calendar/koreanLunisolarValidation.ts','dist/calendar/koreanLunisolarValidation.js'];
  const executedFiles=[];for(const path of paths)executedFiles.push({path,sha256:sha(await readFile(join(root,path)))});
  const execution={executedAt:new Date().toISOString(),node:process.version,processTZ:process.env.TZ??null,resolvedHostTimezone:Intl.DateTimeFormat().resolvedOptions().timeZone,codeSha:git(['rev-parse','HEAD']),workingTreeDirty:git(['status','--porcelain']).length>0,executedFiles,command:{executable:process.execPath,arguments:process.argv.slice(1)},summaryContentSha256:fingerprint(summary)};
  await mkdir(state.out,{mode:0o700});await writeFile(join(state.out,'summary.json'),JSON.stringify(summary,null,2)+'\n',{flag:'wx',mode:0o600});await writeFile(join(state.out,'execution.json'),JSON.stringify(execution,null,2)+'\n',{flag:'wx',mode:0o600});console.log(JSON.stringify({...summary,execution},null,2));return summary;
}
if(process.argv[1]&&import.meta.url===pathToFileURL(resolve(process.argv[1])).href){try{assert.equal(process.argv.length,4,'Usage: node scripts/kasi/local-luck-projection-verify.mjs <candidateDir> <freshPrivateOutputDir>');await runLocalLuckProjectionAcceptance(process.argv[2],process.argv[3]);}catch(error){console.error('MODERN_M7_PROJECTION_REJECTED',error.code??error.name,error.message);process.exitCode=1;}}
