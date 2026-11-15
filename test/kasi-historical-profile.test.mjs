import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp,writeFile,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join,resolve,relative,isAbsolute,basename} from 'node:path';
import {pathToFileURL} from 'node:url';
import {spawnSync} from 'node:child_process';
import {syntheticHistoricalProfileCandidate,HISTORICAL_FOUR_POLICY_EXPECTATIONS as four,HISTORICAL_FIRST_NOON_EXPECTATION as firstNoon,HISTORICAL_PROFILE_FIXTURE_BASIS} from './fixtures/historical-profile-synthetic.mjs';
import {sealSyntheticLocalChartCandidate,writeSyntheticLocalChartCandidate} from './fixtures/kasi-local-chart-synthetic.mjs';
import {createLocalChartProfile,verifyLocalChartResult,getLocalChartEventContext,HISTORICAL_PROFILE_ID,MODERN_CLOCK_POLICY_ID,EXTENDED_SOLAR_PROFILE_ID,BASELINE_MANIFEST_SHA256} from '../scripts/kasi/local-chart.mjs';
import {loadExtendedLocalChartProfile} from '../scripts/kasi/local-extended-chart.mjs';
import {createLocalExtendedReportProfile,validateLocalExtendedReportResult,renderLocalExtendedReportText,parseLocalExtendedReportArgs,EXTENDED_REPORT_PROFILE_ID} from '../scripts/kasi/local-extended-report.mjs';
import {HISTORICAL_KOREAN_CLOCK_POLICY_ID as clockId} from '../dist/time/historicalKoreanClockV1.js';
import {MONTHLY_LUCK_V2_POLICY_ID as monthlyId} from '../dist/luck/monthlyLuckV2.js';
const fixture=syntheticHistoricalProfileCandidate();
const birth=(date='1962-01-01',time='12:00',dayRollover='CIVIL_MIDNIGHT',hourStemReference='SELECTED_DAY_PILLAR')=>({calendar:'GREGORIAN',date,time,policies:{clockPolicyId:clockId,dayRollover,hourStemReference}});
const chart=(f=fixture)=>createLocalChartProfile(f.loaded,{profileId:HISTORICAL_PROFILE_ID,expectedManifestSha256:f.expectedManifestSha256});
const report=(c=chart(),extra={})=>createLocalExtendedReportProfile(c,{reportProfileId:EXTENDED_REPORT_PROFILE_ID,...extra});
const valid=value=>{assert.equal(value.status,'EXTENDED_CALENDAR_ANALYSIS_ONLY');assert.equal(validateLocalExtendedReportResult(value),true);return value;};

test('historicalpublicfixture is clearly synthetic and covers25 completeyears plus1961Daxue',()=>{
 assert.equal(HISTORICAL_PROFILE_FIXTURE_BASIS.nature,'SYNTHETIC_NOT_KASI_NOT_CALENDAR_ORACLE');
 assert.notEqual(fixture.expectedManifestSha256,BASELINE_MANIFEST_SHA256);assert.equal(fixture.loaded.candidate.dates.length,9131);assert.equal(fixture.loaded.candidate.events.length,601);
 assert.equal(fixture.loaded.candidate.events[0].date,'1961-12-05');assert.equal(fixture.loaded.candidate.events[0].termCode,'DAXUE');assert.ok(fixture.loaded.sources.every(s=>s.fixtureNature==='SYNTHETIC_NOT_KASI_NOT_ACTUAL_RAW_RESPONSE'));
 const p=chart();assert.deepEqual(p.metadata.birthRange,{fromInclusive:'1962-01-01',untilExclusive:'1987-01-01'});assert.equal(p.metadata.timeInterpretation.id,clockId);assert.equal(p.metadata.g0Receipt,null);
});
test('historicalM1 consumes generateddates with explicitclock and preserves independentfirstnoonconstants',()=>{
 const p=chart(),r=p.calculate(birth());assert.equal(r.status,'OK');assert.deepEqual(Object.values(r.chart.candidates[0]).map(g=>g.stem+g.branch),firstNoon);
 assert.equal(r.chart.recordedBirthKstMinute,'1962-01-01T12:00');assert.equal(r.policies.clock.id,clockId);assert.equal(r.chart.clockResolution.utcOffsetMinutes,540);assert.equal(r.chart.clockResolution.utcInstant,null);
 assert.equal(verifyLocalChartResult(r,{request:birth()}),r);assert.equal(r.evidence.dateConversion.calendarGanjiUsedAsPillars,false);assert.notEqual(r.chart.candidates[0].day.stem+r.chart.candidates[0].day.branch,'甲子');
 assert.equal(p.calculate(birth('1986-12-31','23:30','ZI_START')).chart.effectiveDayDate,'1987-01-01');
});
test('historicalprofile never silently accepts modernclock, unknownhours or malformedinput',()=>{
 const p=chart();assert.throws(()=>p.calculate({...birth(),policies:{...birth().policies,clockPolicyId:MODERN_CLOCK_POLICY_ID}}));
 for(const time of [undefined,'','24:00','12:60','12:00:00','??:??'])assert.throws(()=>p.calculate({...birth(),time}));
 assert.throws(()=>p.calculate(birth('1962-02-30')));assert.equal(p.calculate(birth('1989-01-01')).status,'OUT_OF_PROFILE_COVERAGE');
});
test('1950/1954/1961 and1987/1988 gapfold remain explicit noncharts throughreportbridge',()=>{
 const p=report();for(const [date,time,status]of [['1950-07-01','12:00','POLICY_UNRESOLVED'],['1954-03-21','00:15','POLICY_UNRESOLVED'],['1961-08-10','00:15','POLICY_UNRESOLVED'],['1987-05-10','02:30','NONEXISTENT_TIME'],['1988-10-09','02:30','AMBIGUOUS_TIME'],['1988-12-31','23:59','POLICY_UNRESOLVED']]){
  const r=p.calculate(birth(date,time));assert.equal(r.status,status);assert.equal(r.m1.status,status);assert.equal(Object.hasOwn(r,'facts'),false);assert.equal(Object.hasOwn(r,'summary'),false);assert.ok(renderLocalExtendedReportText(r).includes('명식 보류'));
  if(status==='AMBIGUOUS_TIME')assert.deepEqual(r.m1.clock.civilOffsetCandidates.map(x=>x.utcOffsetMinutes),[600,540]);
 }
});
test('fourZihourpolicies match fixedday/hour constants and equivalentlunarmeaning',()=>{
 const c=chart(),p=report(c),row=fixture.loaded.candidate.dates.find(d=>d.solarDate==='1962-01-01');
 for(const expected of four){const g=birth('1962-01-01','23:30',expected.dayRollover,expected.hourStemReference),l={calendar:'KOREAN_LUNAR',lunarDate:{lunarYear:row.lunarYear,lunarMonth:row.lunarMonth,lunarDay:row.lunarDay,leap:row.leap},time:g.time,policies:g.policies};
  const a=valid(p.calculate(g)),b=valid(p.calculate(l));assert.equal(a.m1.chart.effectiveDayDate,expected.effectiveDate);assert.equal(a.m1.chart.candidates[0].day.stem+a.m1.chart.candidates[0].day.branch,expected.day);assert.equal(a.m1.chart.candidates[0].hour.stem+a.m1.chart.candidates[0].hour.branch,expected.hour);
  assert.deepEqual(a.m1.chart,b.m1.chart);assert.deepEqual(a.summary,b.summary);assert.deepEqual(a.gongmang,b.gongmang);assert.deepEqual(a.innerPatterns.candidates.map(c=>c.selection),b.innerPatterns.candidates.map(c=>c.selection));assert.notEqual(a.m1.evidence.dateConversion.method,b.m1.evidence.dateConversion.method);
 }
});
test('publishedLichun keeps two correlatedparents and independentM4/gongmang/M5holds',()=>{
 const p=report(),r=valid(p.calculate(birth('1962-02-05','01:20')));
 assert.equal(r.m1.chart.candidates.length,2);assert.deepEqual(r.m1.chart.candidates.map(c=>[c.year.stem+c.year.branch,c.month.stem+c.month.branch]),[['辛丑','辛丑'],['壬寅','壬寅']]);
 assert.equal(r.facts.candidates.length,2);assert.equal(r.innerPatterns.candidates.length,2);assert.equal(r.gongmang.length,2);assert.equal(r.m5.candidates.length,2);
 r.facts.candidates.forEach((c,i)=>{assert.equal(r.gongmang[i].candidateRef,c.id);assert.equal(r.innerPatterns.candidates[i].candidateRef,c.id);assert.equal(r.m5.candidates[i].candidateRef,c.id);assert.ok(r.gongmang[i].inputFactRefs.every(id=>c.facts.some(f=>f.id===id)));});
 assert.ok(renderLocalExtendedReportText(r).includes('원국 두 후보'));
});
test('M1once feedsM2M3M4 whilemonthendseason andM5/M7/monthly remain scoped',()=>{
 const base=chart();let calls=0;const spy={calculate(r){calls++;return base.calculate(r);}},p=report(spy,{contextProfile:base});
 const r=valid(p.calculate(birth('1962-04-17','12:00'),{monthlyOptions:{policyId:monthlyId,year:1962,queryMinute:'1962-04-17T12:00'}}));
 assert.equal(calls,1);assert.equal(r.executionCounts.birthM1Calls,1);assert.equal(r.executionCounts.m2Derivations,1);assert.equal(r.executionCounts.m3BridgeDerivations,1);assert.equal(r.facts.status,'READY');assert.equal(r.evidence.status,'EVIDENCE_ONLY');
 assert.equal(r.root.candidates[0].targets.length,4);assert.equal(r.seasonal.candidates[0].judgment.status,'POLICY_UNRESOLVED');assert.equal(r.m5.status,'HOLD');assert.equal(r.m5.reason,'ORIGINAL_SILI_CLOCK_DEPENDENCY_NOT_EXTENDED');assert.equal(r.monthly.status,'POLICY_UNRESOLVED');assert.equal(r.monthly.reason,'MONTHLY_V2_CLOCK_NOT_SELECTED_FOR_HISTORICAL_PROFILE');assert.equal(r.featureScope.finalStrength,'NOT_IMPLEMENTED');
 renderLocalExtendedReportText(r);renderLocalExtendedReportText(r,{detail:'detailed'});assert.equal(calls,1);
});
test('summarydetailed shareissueddata with validreferences and no newpredictions or technicalbanner',()=>{
 const r=valid(report().calculate(birth('1962-06-01','12:00'))),summary=renderLocalExtendedReportText(r),detailed=renderLocalExtendedReportText(r,{detail:'detailed'});
 assert.equal(r.detailed.summary,r.summary);assert.equal(r.summary.sections.length,7);assert.ok(detailed.startsWith(summary));assert.doesNotMatch(summary,/undefined|NaN|己은|癸은|manifest|8ffadb|KR_API|schemaVersion/);
 for(const section of r.summary.sections)for(const item of section.items){assert.ok(item.valueRefs.length>0);assert.ok(detailed.includes(item.text));if(item.candidateRef)assert.ok(r.facts.candidates.some(c=>c.id===item.candidateRef));}
 assert.match(summary,/보류/);assert.match(summary,/도움 요소가 없다는 뜻은 아닙니다/);assert.doesNotMatch(summary,/재물운이 좋|신강으로 확정|신약으로 확정|결혼하게|반드시 발생/);
 assert.throws(()=>validateLocalExtendedReportResult(structuredClone(r)));assert.throws(()=>{r.m5.candidates[0].status='FINAL_YONGSHEN';},TypeError);
});
test('policyconflicts and invalidmonthlyoptions failbeforeM1 instead of ignoreddefaults',()=>{
 const base=chart();let calls=0;const spy={calculate(r){calls++;return base.calculate(r);}};
 for(const extra of [{reportProfileId:'AUTO'},{m5PolicyId:'AUTO'},{rootPolicyId:'AUTO'},{seasonalPolicyId:'AUTO'}])assert.throws(()=>report(spy,{contextProfile:base,...extra}));
 const p=report(spy,{contextProfile:base});for(const options of [{m5PolicyId:'AUTO'},{luckOptions:{}},{unknown:true},{monthlyOptions:{year:1962}},{monthlyOptions:{policyId:monthlyId,year:1962.5}},{monthlyOptions:{policyId:monthlyId,queryMinute:'1962-02-30T12:00'}},{monthlyOptions:{policyId:monthlyId,queryMinute:'now'}},{monthlyOptions:{policyId:monthlyId}}])assert.throws(()=>p.calculate(birth(),options));assert.equal(calls,0);
});
test('badmanifest/source/guard and foreignissuedresults are rejected, never absencefallback',()=>{
 const changed={...fixture.loaded,candidate:structuredClone(fixture.loaded.candidate),sources:structuredClone(fixture.loaded.sources),manifest:structuredClone(fixture.loaded.manifest)};changed.candidate.events[0].time='00:00';assert.throws(()=>createLocalChartProfile(changed,{profileId:HISTORICAL_PROFILE_ID,expectedManifestSha256:fixture.expectedManifestSha256}));
 const wrong=structuredClone(fixture.loaded.candidate),sources=structuredClone(fixture.loaded.sources);wrong.events[0].sourceRef=wrong.events[1].sourceRef;const sealed=sealSyntheticLocalChartCandidate(wrong,sources);assert.throws(()=>chart(sealed),/ROW_SOURCE_SERVICE_OR_YEAR/);
 const missing=structuredClone(fixture.loaded.candidate);missing.events.shift();assert.throws(()=>chart(sealSyntheticLocalChartCandidate(missing,sources)),/REQUIRED_API_DAXUE_GUARD/);
 const c=chart(),a=valid(report(c).calculate(birth())),b=valid(report(c).calculate(birth('1962-06-01')));const mixed=structuredClone(a);mixed.gongmang[0]=structuredClone(b.gongmang[0]);assert.throws(()=>validateLocalExtendedReportResult(mixed));assert.throws(()=>verifyLocalChartResult(structuredClone(a.m1)));
 const context=getLocalChartEventContext(c);assert.equal(context.profile.id,HISTORICAL_PROFILE_ID);assert.equal(context.events.some(e=>e.displayedDateTime.startsWith('1954-')),false);
});
test('publicsyntheticpins cannot forge acceptedextendedloader or2027annualdata',async()=>{
 await assert.rejects(()=>loadExtendedLocalChartProfile({directory:'MUST_NOT_BE_READ',profileId:HISTORICAL_PROFILE_ID,expectedManifestSha256:fixture.expectedManifestSha256}),/EXTENDED_BASELINE_PIN_REQUIRED/);
 assert.throws(()=>createLocalChartProfile(fixture.loaded,{profileId:EXTENDED_SOLAR_PROFILE_ID,expectedManifestSha256:fixture.expectedManifestSha256,annualSolarExtension:{status:'VERIFIED',contentSha256:'77da197d925e5a8907990960530a85454cf87a829745ee9b012c6c328c891a0b'}}));
 const common=['--candidate','NEVER_LOADED','--manifest-sha',fixture.expectedManifestSha256,'--profile',HISTORICAL_PROFILE_ID,'--calendar','GREGORIAN','--date','1962-01-01','--time','12:00','--clock-policy',clockId,'--day-rollover','CIVIL_MIDNIGHT','--hour-stem-reference','SELECTED_DAY_PILLAR','--report-profile',EXTENDED_REPORT_PROFILE_ID,'--detail','summary','--output','json'];
 assert.equal(parseLocalExtendedReportArgs(common).profileId,HISTORICAL_PROFILE_ID);assert.throws(()=>parseLocalExtendedReportArgs([...common,'--m5-policy','AUTO']));assert.throws(()=>parseLocalExtendedReportArgs([...common,'--monthly-policy',monthlyId,'--monthly-query-minute','now']));
});
test('historicalM1actualsubprocess usesonlypublicfixture and reproducesUTCSeoul/lunarJSON',async()=>{
 const osTemp=resolve(tmpdir()),temp=await mkdtemp(join(osTemp,'manseryeok-historical-public-'));
 try{
  const directory=join(temp,'SYNTHETIC_NOT_KASI');await writeSyntheticLocalChartCandidate(directory,fixture);
  const blocker=join(temp,'deny-network.mjs');await writeFile(blocker,'import http from "node:http";import https from "node:https";import net from "node:net";const no=()=>{throw Error("NETWORK_FORBIDDEN")};globalThis.fetch=no;http.request=no;https.request=no;net.Socket.prototype.connect=no;\n');
  const common=['--candidate',directory,'--manifest-sha',fixture.expectedManifestSha256,'--profile',HISTORICAL_PROFILE_ID,'--time','12:00','--clock-policy',clockId,'--day-rollover','CIVIL_MIDNIGHT','--hour-stem-reference','SELECTED_DAY_PILLAR'];
  const run=(input,TZ)=>spawnSync(process.execPath,['--import',pathToFileURL(blocker).href,'scripts/kasi/local-chart.mjs',...common,...input],{cwd:process.cwd(),env:{TZ},encoding:'utf8',windowsHide:true,maxBuffer:8*1024*1024});
  const a=run(['--calendar','GREGORIAN','--date','1962-01-01'],'UTC'),b=run(['--calendar','GREGORIAN','--date','1962-01-01'],'Asia/Seoul');assert.equal(a.status,0,a.stderr);assert.equal(b.status,0,b.stderr);assert.equal(a.stderr,'');assert.equal(a.stdout,b.stdout);assert.deepEqual(Object.values(JSON.parse(a.stdout).chart.candidates[0]).map(p=>p.stem+p.branch),firstNoon);
  const row=fixture.loaded.candidate.dates[0],l=run(['--calendar','KOREAN_LUNAR','--lunar-year',String(row.lunarYear),'--lunar-month',String(row.lunarMonth),'--lunar-day',String(row.lunarDay),'--leap',String(row.leap)],'UTC');assert.equal(l.status,0,l.stderr);assert.deepEqual(JSON.parse(a.stdout).chart,JSON.parse(l.stdout).chart);
 }finally{const target=resolve(temp),r=relative(osTemp,target);assert.ok(r&&!isAbsolute(r)&&!r.startsWith('..')&&basename(target).startsWith('manseryeok-historical-public-'));await rm(target,{recursive:true,force:true});}
});
