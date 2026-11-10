/** Private API M1→M2→Korean explanation acceptance. All births are an artificial grid. */
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
import { createLocalExplanationProfile, explainChartFacts, validateExplanation } from './local-explain.mjs';
import { M2_LOCAL_PROFILE_ID, getM2PolicyBundle, toM2Preview, validateLocalChartFacts } from './local-chart-facts.mjs';
import { deriveM2ChartFactsV3 } from '../../dist/chartFacts/chartFactsV3.js';
import { twelveGrowthStage } from '../../dist/domain/twelveGrowthStages.js';
import { STEM_NATURE } from '../../dist/domain/stems.js';
import { BRANCH_NATURE } from '../../dist/domain/branches.js';
import { DAY_ROLLOVER_POLICIES } from '../../dist/calendar/dayRollover.js';
import { HOUR_STEM_REFERENCE_POLICIES } from '../../dist/calendar/dayHourPillars.js';
import { MONTH_BOUNDARY_JIE } from '../../dist/calendar/monthPillar.js';
import { sexagenaryYearForCivilYear } from '../../dist/calendar/yearPillar.js';
import { gregorianDayNumber as day, gregorianDateFromDayNumber as civil, monthKey } from '../../dist/calendar/koreanLunisolarValidation.js';

const root=resolve(dirname(fileURLToPath(import.meta.url)),'../..');
const exportSha='7b5584aca339b85c7e54e953c43b672358bda605a478831b6f260df00472e851';
const preservedTreePins={candidateA:'b2a2560d2d6324554e8bacf4f34e5a788cddabe71e99843b3b6dcb6876a89bed',candidateB:'b143a6cd766a9d0c0e763f93aba1236db68a29c2a5e71a89647e0371dbca6584',completedInput:'82c5a30c679ac743c0c89a0192ce2cf21a42387fd4ad8cbb6847a4db18866567'};
const inDirectory=(parent,child)=>{const path=relative(parent,child);return path!==''&&!path.startsWith('..')&&!isAbsolute(path);};
const git=args=>execFileSync('git',['-c','safe.directory='+root.replaceAll('\\','/'),...args],{cwd:root,encoding:'utf8',stdio:['ignore','pipe','pipe']}).trim();
const lunarDate=row=>({lunarYear:row.lunarYear,lunarMonth:row.lunarMonth,lunarDay:row.lunarDay,leap:row.leap});
const monthId=row=>monthKey(row.lunarYear,row.lunarMonth,row.leap);
const roles=['year','month','day','hour'];
function shiftedMinute(minute,delta) {
  const [year,month,date,hour,minutes]=minute.match(/\d+/g).map(Number);
  // Calendar arithmetic only: this does not claim an API UTC instant.
  return new Date(Date.UTC(year,month-1,date,hour,minutes+delta)).toISOString().slice(0,16);
}

/** Same civil-date/Jie/calendar/Zi cohort as completed Stage B; no new astronomical oracle. */
export function* modernExplanationGrid(candidate,contexts) {
  const rows=new Map(candidate.dates.map(row=>[row.solarDate,row]));
  const policies=DAY_ROLLOVER_POLICIES.flatMap(dayRollover=>HOUR_STEM_REFERENCE_POLICIES.map(hourStemReference=>({clockPolicyId:MODERN_CLOCK_POLICY_ID,dayRollover,hourStemReference})));
  const basePolicy=policies.find(p=>p.dayRollover==='CIVIL_MIDNIGHT'&&p.hourStemReference==='SELECTED_DAY_PILLAR');
  assert.equal(policies.length,4);assert.ok(basePolicy);
  const calendarBoundaries=new Set(['1989-01-01','2026-12-31']);
  for(let n=day('1989-01-01');n<day('2027-01-01');n++){
    const date=civil(n),row=rows.get(date);assert.ok(row);
    yield {minute:date+'T12:00',policy:basePolicy,category:'dailyCases'};
    if(date.endsWith('-01')||civil(n+1).slice(0,7)!==date.slice(0,7)||row.lunarDay===1||row.lunarDay===row.monthDays)calendarBoundaries.add(date);
  }
  for(let year=1989;year<=2026;year++){
    const jie=contexts.get(year).events.filter(e=>e.displayedDateTime.startsWith(year+'-')&&MONTH_BOUNDARY_JIE.includes(e.term));assert.equal(jie.length,12);
    for(const event of jie)for(const delta of [-1,0,1])for(const policy of policies)yield {minute:shiftedMinute(event.displayedDateTime,delta),policy,category:'jieBeforeAtAfterCases',event,delta};
  }
  for(const date of [...calendarBoundaries].sort())for(const time of ['22:59','23:00','23:59','00:00'])for(const policy of policies)yield {minute:date+'T'+time,policy,category:'calendarBoundaryCases'};
}

export async function runModernExplanationAcceptance(candidateDirectory,outputDirectory) {
  const privateRoot=await realpath(join(root,'.private')),input=await realpath(resolve(candidateDirectory)),out=resolve(outputDirectory);
  assert.ok(inDirectory(privateRoot,input));
  assert.ok(inDirectory(privateRoot,out)&&out!==input&&!inDirectory(input,out)&&!inDirectory(out,input),'Use a fresh, separate private output directory');
  assert.equal(await realpath(dirname(out)),dirname(out),'Output parent must exist without symlink');
  const baselineA=await realpath(join(privateRoot,'kasi-research-1950-2026-fe84ab4-a'));
  const baselineB=await realpath(join(privateRoot,'kasi-research-1950-2026-fe84ab4-b'));
  const original=await realpath(join(privateRoot,'kasi-local-1950-2026/monthly-xml'));
  for(const path of [baselineA,baselineB,original])assert.ok(out!==path&&!inDirectory(path,out)&&!inDirectory(out,path),'Output must not overlap preserved data');
  const protectedDirectories=new Map([['providedCandidate',input],['candidateA',baselineA],['candidateB',baselineB],['completedInput',original]]),before=new Map();
  for(const [name,path] of protectedDirectories)before.set(name,await inventory(path));
  for(const [name,pin] of Object.entries(preservedTreePins))assert.equal(fingerprint(before.get(name)),pin,'Preserved '+name+' tree differs from the independently recorded prior completion');
  assert.equal(sha(await readFile(join(original,'export.json'))),exportSha);
  const loaded=await loadCandidate(input,BASELINE_MANIFEST_SHA256),other=await loadCandidate(baselineB,BASELINE_MANIFEST_SHA256);
  assert.equal(fingerprint(other.manifest),fingerprint(loaded.manifest));
  assert.equal(fingerprint(before.get('completedInput')),loaded.manifest.inputTreeSha256);
  const chartProfile=await loadLocalChartProfile({directory:input,expectedManifestSha256:BASELINE_MANIFEST_SHA256,profileId:MODERN_PROFILE_ID});
  const aChartProfile=await loadLocalChartProfile({directory:input,expectedManifestSha256:BASELINE_MANIFEST_SHA256,profileId:STAGE_A_PROFILE_ID});
  let m1Calls=0;
  const spy={...chartProfile,calculate(request){m1Calls++;return chartProfile.calculate(request);}};
  const profile=createLocalExplanationProfile(spy,{m2ProfileId:M2_LOCAL_PROFILE_ID});
  const aProfile=createLocalExplanationProfile(aChartProfile,{m2ProfileId:M2_LOCAL_PROFILE_ID});
  const bundle=getM2PolicyBundle(M2_LOCAL_PROFILE_ID);
  const {candidate,index,sources}=loaded,receipts=new Map(sources.map(r=>[r.id,r]));
  assert.equal(receipts.size,1001);
  for(const [id,record] of receipts){const {id:ignored,...receipt}=record;assert.equal(id,fingerprint(receipt));assert.equal(receipt.evidenceSurface,'KASI_OPENAPI_RESPONSE');}
  const rows=new Map(candidate.dates.map(row=>[row.solarDate,row])),eventRows=new Map(candidate.events.map(row=>[row.termCode+':'+row.date,row]));
  const contexts=new Map();for(let year=1989;year<=2026;year++)contexts.set(year,chartProfile.eventsForYear(year));
  const counts={distinctCivilDates:0,profileYears:38,policyCombinations:4,dailyCases:0,jieBeforeAtAfterCases:0,calendarBoundaryCases:0,totalInputPairs:0,semanticComparisons:0,productInvocations:0,productM1Calls:0,directExistingM2Calls:0,directTwelveGrowthCalls:0,appliedEvidenceChecks:0,factReferenceChecks:0,explanationReferenceChecks:0,lichunCorrelatedPairs:0,leapMonthPairs:0,invalidLeapRequests:0,alternatingYearProfilePolicyChecks:0,responseIsolationChecks:0,reproducibilityChecks:0};
  const hashes={gregorian:createHash('sha256'),lunar:createHash('sha256')};

  function calculate(request){
    const count=m1Calls,result=profile.calculate(request);assert.equal(m1Calls-count,1,'Product invocation must calculate M1 exactly once');
    counts.productInvocations++;counts.productM1Calls++;return result;
  }
  function checkEvent(evidence,term,minute){
    const row=eventRows.get(term+':'+minute.slice(0,10)),source=receipts.get(evidence.sourceRef);
    assert.ok(row&&source);assert.deepEqual(evidence.original,row);assert.equal(evidence.sourceRef,row.sourceRef);assert.deepEqual(evidence.source,source);
    assert.equal(source.serviceId,'15012690');assert.equal(source.operation,'get24DivisionsInfo');assert.equal(source.query.year,Number(minute.slice(0,4)));
    assert.equal(row.date+'T'+row.time,minute);assert.equal(row.timeBasis,'API_KST_AS_PUBLISHED');assert.equal(row.historicalCivilTime,'NOT_RESOLVED');
    assert.deepEqual(evidence.interpreted,{displayedDateTime:minute,timeBasis:'KST',sourcePrecision:'MINUTE',clockPolicyId:MODERN_CLOCK_POLICY_ID,clockPolicyVersion:'1',utcOffsetMinutes:540,utcInstant:null});counts.appliedEvidenceChecks++;
  }
  function checkM1Evidence(m1,date,time,calendar,policy){
    assert.equal(m1.status,'OK');assert.equal(m1.profile.id,MODERN_PROFILE_ID);assert.equal(m1.profile.g0Receipt,null);assert.equal(m1.profile.g1P2Promotion,false);
    assert.equal(m1.dataset.sourceKind,'KASI_OPENAPI_RESPONSE');assert.equal(m1.dataset.candidateManifestContentSha256,BASELINE_MANIFEST_SHA256);assert.equal(m1.dataset.rightsReview,'UNVERIFIED');
    assert.equal(m1.input.calendar,calendar);assert.equal(m1.input.gregorianDate,date);assert.equal(m1.input.time,time);
    assert.equal(m1.policies.clock.id,MODERN_CLOCK_POLICY_ID);assert.equal(m1.policies.dayRollover.id,policy.dayRollover);assert.equal(m1.policies.hourStemReference.id,policy.hourStemReference);
    const trace=m1.chart.monthBoundaryTrace,map=new Map(m1.evidence.appliedJie.map(e=>['KASI_OPENAPI_RESPONSE:'+e.sourceRef+':'+e.original.date+':'+e.original.termCode,e]));
    const events=[...trace.candidateContexts.map(c=>c.activeSince),...(trace.atPublishedBoundary?[trace.atPublishedBoundary]:[])];
    for(const event of events)for(const id of event.sourceIds){assert.ok(id.startsWith('KASI_OPENAPI_RESPONSE:'));const evidence=map.get(id);assert.ok(evidence);checkEvent(evidence,event.term,event.displayedDateTime);}
    assert.equal(map.size,new Set(events.flatMap(e=>e.sourceIds)).size);
    const lichun=contexts.get(Number(date.slice(0,4))).events.find(e=>e.term==='LICHUN');checkEvent(m1.evidence.yearBoundary,'LICHUN',lichun.displayedDateTime);
    const row=rows.get(date),conversion=m1.evidence.dateConversion,source=receipts.get(row.sourceRef);
    assert.equal(conversion.sourceRef,row.sourceRef);assert.deepEqual(conversion.source,source);assert.equal(source.serviceId,'15012679');assert.equal(source.operation,'getLunCalInfo');
    assert.equal(conversion.calendarGanjiUsedAsPillars,false);assert.equal(conversion.method,calendar==='KOREAN_LUNAR'?'API_OBSERVED_DATE_INDEX':'GREGORIAN_WITH_API_OBSERVED_DATE_EVIDENCE');assert.deepEqual(conversion.observed,{solarDate:date,...lunarDate(row)});
  }

  // Envelope-specific fact/explanation validation is below; neither comparison recalculates M1.
  function checkClassification(result){
    assert.equal(result.status,'OK');validateLocalChartFacts(result.facts);
    assert.deepEqual(result.facts.calculation,result.m1,'M2 must retain this invocation\'s original calculation and provenance');
    const direct=deriveM2ChartFactsV3(toM2Preview(result.m1),bundle.policies.hiddenStems.id,bundle.policies.branchRelations.id,bundle.policies.triadMembership.id);
    assert.deepEqual(result.facts.genericM2,direct);counts.directExistingM2Calls++;
    assert.equal(result.facts.validation.g0Receipt,null);assert.equal(result.facts.validation.g1P2Promotion,false);
    assert.equal(result.facts.validation.editionVerification,'UNVERIFIED');assert.equal(result.facts.validation.rightsReview,'UNVERIFIED');assert.equal(result.facts.validation.predictiveValidity,'NOT_CLAIMED');
    assert.equal(result.facts.candidates.length,result.m1.chart.candidates.length);
    const ruleMap=new Map(result.facts.rules.map(rule=>[rule.id,rule])),sourceMap=new Map(result.facts.sources.map(source=>[source.id,source]));
    assert.equal(ruleMap.size,result.facts.rules.length);assert.equal(sourceMap.size,result.facts.sources.length);
    const actualSourceEvidence=new Map([...result.m1.evidence.appliedJie,result.m1.evidence.yearBoundary].map(evidence=>['KASI_OPENAPI_RESPONSE:'+evidence.sourceRef+':'+evidence.original.date+':'+evidence.original.termCode,evidence]));
    actualSourceEvidence.set('KASI_OPENAPI_RESPONSE_DATE:'+result.m1.evidence.dateConversion.sourceRef+':'+result.m1.evidence.dateConversion.observed.solarDate,result.m1.evidence.dateConversion);
    for(const source of sourceMap.values())if(source.kind==='CALENDAR_API'){assert.deepEqual(source.evidence,actualSourceEvidence.get(source.id));assert.equal(source.rightsReview,'UNVERIFIED');}
    const policyIds=new Set([bundle.id,...Object.values(bundle.policies).map(p=>p.id)]);
    for(const candidate of result.facts.candidates){
      const i=candidate.candidateIndex,expected=direct.candidates[i],actual=result.m1.chart.candidates[i];
      assert.equal(candidate.id,`chart.candidates[${i}]`);assert.equal(candidate.dayMaster,actual.day.stem);assert.equal(candidate.dayMaster,expected.dayMaster);
      assert.deepEqual(candidate.branchRelations,expected.branchRelations);assert.deepEqual(candidate.triadMemberships,expected.triadMemberships);
      for(let p=0;p<4;p++){
        const pillar=candidate.pillars[p];assert.equal(pillar.role,roles[p]);assert.equal(pillar.stem,actual[roles[p]].stem);assert.equal(pillar.branch,actual[roles[p]].branch);
        assert.deepEqual(pillar.nature,{stem:STEM_NATURE[pillar.stem],branch:BRANCH_NATURE[pillar.branch]});
        assert.deepEqual(pillar.twelveGrowth,twelveGrowthStage(candidate.dayMaster,pillar.branch,bundle.policies.twelveGrowth.id));counts.directTwelveGrowthCalls++;
        assert.deepEqual(pillar.branchTenGods,expected.pillars[p].branchTenGods);assert.equal(pillar.visibleTenGod,expected.pillars[p].visibleTenGod);
      }
      const factMap=new Map(candidate.facts.map(fact=>[fact.id,fact]));assert.equal(factMap.size,candidate.facts.length);
      const active=result.m1.chart.monthBoundaryTrace.candidateContexts[i].activeSince.sourceIds;
      const year=result.m1.evidence.yearBoundary,date=result.m1.evidence.dateConversion;
      const expectedCalendarRefs=new Set([...active,'KASI_OPENAPI_RESPONSE:'+year.sourceRef+':'+year.original.date+':'+year.original.termCode,'KASI_OPENAPI_RESPONSE_DATE:'+date.sourceRef+':'+date.observed.solarDate]);
      for(const fact of candidate.facts){
        assert.equal(fact.candidateRef,candidate.id);assert.ok(fact.id.startsWith(candidate.id+'#'));
        for(const ref of fact.pillarRefs)assert.ok(roles.some(role=>ref===candidate.id+'.'+role));
        for(const ref of fact.ruleRefs)assert.ok(ruleMap.has(ref));for(const ref of fact.policyRefs)assert.ok(policyIds.has(ref));
        for(const ref of fact.sourceRefs)assert.equal(sourceMap.get(ref)?.kind,'M2_RULE_SOURCE_RECORD');
        assert.deepEqual(new Set(fact.calculationSourceRefs),expectedCalendarRefs);
        for(const ref of fact.calculationSourceRefs)assert.equal(sourceMap.get(ref)?.kind,'CALENDAR_API');
        const value=fact.value,pillar=candidate.pillars.find(p=>p.role===value.role);
        if(fact.kind==='DAY_MASTER')assert.deepEqual(value,{stem:expected.dayMaster,...STEM_NATURE[expected.dayMaster]});
        else if(fact.kind==='PILLAR_NATURE')assert.deepEqual(value,{role:pillar.role,stem:pillar.stem,branch:pillar.branch,stemNature:pillar.nature.stem,branchNature:pillar.nature.branch});
        else if(fact.kind==='VISIBLE_TEN_GOD')assert.deepEqual(value,{role:pillar.role,stem:pillar.stem,dayMaster:expected.dayMaster,tenGod:pillar.visibleTenGod});
        else if(fact.kind==='HIDDEN_STEMS'){
          assert.equal(value.branch,pillar.branch);assert.equal(value.dayMaster,expected.dayMaster);
          assert.deepEqual(value.members.map(({stem,index,position,tenGod})=>({stem,index,position,tenGod})),pillar.branchTenGods.members);
          assert.equal(value.principalTenGod,pillar.branchTenGods.members.find(m=>m.position==='MAIN_QI')?.tenGod??null);
          for(const member of value.members){assert.equal(member.candidateRef,candidate.id);assert.ok(fact.pillarRefs.includes(member.pillarRef));assert.ok(member.id.startsWith(fact.id+'#member['));}
        }else if(fact.kind==='TWELVE_GROWTH')assert.deepEqual(value,{role:pillar.role,...pillar.twelveGrowth});
        else if(fact.kind==='BRANCH_RELATION')assert.ok(expected.branchRelations.some(relation=>fingerprint(relation)===fingerprint(value)));
        else if(fact.kind==='TRIAD_MEMBERSHIP')assert.ok(expected.triadMemberships.some(triad=>fingerprint(triad)===fingerprint(value)));
        else if(fact.kind==='SUMMARY'){
          assert.deepEqual(value.pillars.map(p=>({stem:p.stem,branch:p.branch})),roles.map(role=>actual[role]));
          assert.deepEqual(value.policies,result.m1.policies);assert.equal(value.confidence,result.m1.chart.confidence);
          assert.equal(value.boundarySide,result.m1.chart.monthBoundaryTrace.candidateContexts[i].boundarySide);
          assert.equal(value.pairCount,expected.branchRelations.length);assert.equal(value.triadCount,expected.triadMemberships.length);
        }else assert.fail('Unexpected fact kind');
        counts.factReferenceChecks++;
      }
    }
    validateExplanation(result.explanation,result.facts);
    assert.equal(result.explanation.candidates.length,result.facts.candidates.length);
    for(const candidate of result.explanation.candidates){
      const facts=result.facts.candidates[candidate.candidateIndex],factMap=new Map(facts.facts.map(fact=>[fact.id,fact]));assert.equal(candidate.candidateRef,facts.id);
      for(const item of candidate.items){
        assert.equal(item.candidateRef,facts.id);assert.equal(item.templateVersion,result.explanation.templateVersion);assert.ok(item.factRefs.length>0);
        const referenced=item.factRefs.map(ref=>{const fact=factMap.get(ref);assert.ok(fact,'Explanation fact must be in the same candidate');return fact;});
        for(const [refs,key] of [[item.ruleRefs,'ruleRefs'],[item.policyRefs,'policyRefs'],[item.sourceRefs,'sourceRefs']]){const allowed=new Set(referenced.flatMap(fact=>fact[key]));for(const ref of refs)assert.ok(allowed.has(ref));}
        assert.ok(typeof item.text==='string'&&item.text.length>0);counts.explanationReferenceChecks++;
      }
    }
  }

  // Store each meaning once. Full source/reference graphs and direct generic M2 are checked above.
  function semantics(result){return {chart:result.m1.chart,policyBundle:result.facts.policyBundle,
    facts:result.facts.candidates.map(candidate=>({candidateIndex:candidate.candidateIndex,facts:candidate.facts.map(fact=>({kind:fact.kind,value:fact.kind==='HIDDEN_STEMS'?{...fact.value,members:fact.value.members.map(({stem,index,position,tenGod})=>({stem,index,position,tenGod}))}:fact.value}))})),
    explanation:{schemaVersion:result.explanation.schemaVersion,templateVersion:result.explanation.templateVersion,scopeNote:result.explanation.scopeNote,candidates:result.explanation.candidates.map(candidate=>({candidateIndex:candidate.candidateIndex,items:candidate.items.map(({templateId,templateVersion,text})=>({templateId,templateVersion,text}))}))}};}
  function pair({minute,policy,category,event,delta}){
    const date=minute.slice(0,10),time=minute.slice(11),row=index.fromGregorianDate(date).value;assert.ok(row);
    const g=calculate({calendar:'GREGORIAN',date,time,policies:policy}),l=calculate({calendar:'KOREAN_LUNAR',lunarDate:lunarDate(row),time,policies:policy});
    checkM1Evidence(g.m1,date,time,'GREGORIAN',policy);checkM1Evidence(l.m1,date,time,'KOREAN_LUNAR',policy);checkClassification(g);checkClassification(l);
    const gs=semantics(g),ls=semantics(l);assert.deepEqual(gs,ls,'G/L classification/explanation meanings must agree');
    hashes.gregorian.update(canonical({category,policy,result:gs})+'\n');hashes.lunar.update(canonical({category,policy,result:ls})+'\n');counts[category]++;counts.totalInputPairs++;counts.semanticComparisons++;
    if(counts.totalInputPairs%1000===0)console.error('M2_ACCEPTANCE_PROGRESS',JSON.stringify({inputPairs:counts.totalInputPairs,daily:counts.dailyCases,jie:counts.jieBeforeAtAfterCases,calendarEdges:counts.calendarBoundaryCases}));
    if(category==='dailyCases')counts.distinctCivilDates++;
    if(event){assert.equal(g.m1.chart.confidence,delta===0?'PUBLISHED_MINUTE_AMBIGUOUS':'DEFINITE');assert.equal(g.m1.chart.candidates.length,delta===0?2:1);
      if(event.term==='LICHUN'&&delta===0){const year=Number(date.slice(0,4));assert.deepEqual(g.m1.chart.candidates.map(c=>c.year),[sexagenaryYearForCivilYear(year-1),sexagenaryYearForCivilYear(year)]);assert.deepEqual(g.m1.chart.candidates.map(c=>c.month.branch),['丑','寅']);counts.lichunCorrelatedPairs++;}}
    return g;
  }
  for(const item of modernExplanationGrid(candidate,contexts))pair(item);
  assert.equal(counts.distinctCivilDates,13879);assert.equal(counts.jieBeforeAtAfterCases,5472);assert.equal(counts.calendarBoundaryCases,28624);assert.equal(counts.totalInputPairs,47975);assert.equal(counts.lichunCorrelatedPairs,152);

  const policies=DAY_ROLLOVER_POLICIES.flatMap(dayRollover=>HOUR_STEM_REFERENCE_POLICIES.map(hourStemReference=>({clockPolicyId:MODERN_CLOCK_POLICY_ID,dayRollover,hourStemReference}))),basePolicy=policies[0];
  const request=(date,time='12:00',policy=basePolicy)=>({calendar:'GREGORIAN',date,time,policies:policy});
  const modernMonths=new Map();for(const row of candidate.dates)if(row.solarDate>='1989-01-01'&&row.solarDate<'2027-01-01'&&!modernMonths.has(monthId(row)))modernMonths.set(monthId(row),row);
  const allMonthIds=new Set(candidate.months.map(monthId));
  for(const row of modernMonths.values()){
    const lunarRequest=lunar=>({calendar:'KOREAN_LUNAR',lunarDate:lunar,time:'12:00',policies:basePolicy});
    if(row.leap){const leap=calculate(lunarRequest(lunarDate(row))),regular=calculate(lunarRequest({...lunarDate(row),leap:false}));assert.equal(leap.status,'OK');assert.equal(regular.status,'OK');assert.notEqual(leap.m1.input.gregorianDate,regular.m1.input.gregorianDate);checkClassification(leap);checkClassification(regular);counts.leapMonthPairs++;}
    else if(!allMonthIds.has(monthId({...row,leap:true}))){assert.equal(calculate(lunarRequest({...lunarDate(row),leap:true})).status,'INVALID_LUNAR_DATE');counts.invalidLeapRequests++;}
  }
  assert.equal(counts.leapMonthPairs,14);assert.equal(counts.invalidLeapRequests,443);
  const aRequest=request('2026-02-04','05:02'),aBaseline=fingerprint(aProfile.calculate(aRequest));
  for(let year=1989;year<=2026;year++){
    const req=request(year+'-01-01','23:30',policies[(year-1989)%4]),first=calculate(req),expected=fingerprint(first);
    checkClassification(first);assert.equal(fingerprint(aProfile.calculate(aRequest)),aBaseline);calculate(request((year===2026?1989:2026)+'-12-31'));
    assert.equal(fingerprint(calculate(req)),expected);counts.alternatingYearProfilePolicyChecks++;
    first.m1.evidence.appliedJie[0].original.time='MODIFIED_RETURN_VALUE';
    assert.throws(()=>{first.facts.candidates[0].facts[0].value.confidence='MODIFIED_RETURN_VALUE';},TypeError);
    const forgedFacts=structuredClone(first.facts);forgedFacts.candidates[0].facts[0].value.confidence='MODIFIED_RETURN_VALUE';
    assert.throws(()=>validateLocalChartFacts(forgedFacts));
    first.explanation.candidates[0].items[0].text='MODIFIED_RETURN_VALUE';
    assert.equal(fingerprint(calculate(req)),expected);counts.responseIsolationChecks++;
  }
  const repeat=request('2026-06-01'),one=calculate(repeat),two=calculate(repeat);assert.deepEqual(one,two);assert.deepEqual(explainChartFacts(one.facts),one.explanation);counts.reproducibilityChecks++;
  for(const [name,path] of protectedDirectories)assert.equal(fingerprint(await inventory(path)),fingerprint(before.get(name)),name+' changed');
  assert.equal(sha(await readFile(join(original,'export.json'))),exportSha);
  const semanticDigests=Object.fromEntries(Object.entries(hashes).map(([name,hash])=>[name,hash.digest('hex')]));assert.equal(semanticDigests.gregorian,semanticDigests.lunar);
  assert.equal(counts.productM1Calls,counts.productInvocations);assert.equal(m1Calls,counts.productM1Calls);
  const summary={schemaVersion:'kasi-local-explanation-acceptance-v1',status:'MODERN_M2_EXPLANATION_PASS',inputNature:'EXPLICIT_SYNTHETIC_BIRTH_GRID_NOT_PERSONAL_RECORDS',profileId:MODERN_PROFILE_ID,m2ProfileId:M2_LOCAL_PROFILE_ID,birthRange:{fromInclusive:'1989-01-01',untilExclusive:'2027-01-01'},manifestContentSha256:BASELINE_MANIFEST_SHA256,exportSha256:exportSha,preservedInputTrees:Object.fromEntries([...before].map(([name,files])=>[name,fingerprint(files)])),counts,semanticDigests,verificationLayers:{allDates:'INTERNAL_GREGORIAN_LUNAR_M1_M2_EXPLANATION_CONSISTENCY',directM2:'EXISTING_FUNCTION_CONNECTION_COMPARISON_NOT_INDEPENDENT_SOURCE_ORACLE',modernBoundaries:'ALL_38_YEARS_12_JIE_THREE_MINUTES_FOUR_EXPLICIT_POLICIES',sourceAuthenticity:'NOT_EXTERNALLY_CERTIFIED'},apiRequests:0,allPreservedInputsUnchanged:true,notVerified:['independent classical edition/rule/rights authentication','predictions or strength/transformation judgments','historical birth civil clocks before1989','public G0/default-profile integration','redistribution or commercial deployment']};
  const executedFiles=[];for(const path of ['scripts/kasi/local-explain-verify.mjs','scripts/kasi/local-explain.mjs','scripts/kasi/local-chart-facts.mjs','scripts/kasi/local-chart.mjs','scripts/kasi/candidate.mjs'])executedFiles.push({path,sha256:sha(await readFile(join(root,path)))});
  const execution={executedAt:new Date().toISOString(),node:process.version,processTZ:process.env.TZ??null,resolvedHostTimezone:Intl.DateTimeFormat().resolvedOptions().timeZone,codeSha:git(['rev-parse','HEAD']),workingTreeDirty:git(['status','--porcelain']).length>0,executedFiles,command:{executable:process.execPath,arguments:process.argv.slice(1)},summaryContentSha256:fingerprint(summary)};
  await mkdir(out,{mode:0o700});await writeFile(join(out,'summary.json'),JSON.stringify(summary,null,2)+'\n',{flag:'wx',mode:0o600});await writeFile(join(out,'execution.json'),JSON.stringify(execution,null,2)+'\n',{flag:'wx',mode:0o600});
  console.log(JSON.stringify({...summary,execution},null,2));return summary;
}
if(process.argv[1]&&import.meta.url===pathToFileURL(resolve(process.argv[1])).href){
  try{assert.equal(process.argv.length,4,'Usage: node scripts/kasi/local-explain-verify.mjs <candidateDir> <newPrivateOutputDir>');await runModernExplanationAcceptance(process.argv[2],process.argv[3]);}
  catch(error){console.error('MODERN_M2_EXPLANATION_REJECTED',error.code??error.name,error.message);process.exitCode=1;}
}
