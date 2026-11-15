import assert from 'node:assert/strict';
import test from 'node:test';
import {createHash} from 'node:crypto';
import {readFileSync} from 'node:fs';
import {spawnSync} from 'node:child_process';
import {syntheticDstProfileCandidate,DST_PROFILE_SYNTHETIC_BASIS,DST_FIXED_NATAL_EXPECTATIONS as expected} from './fixtures/kasi-dst-profile-synthetic.mjs';
import {sealSyntheticLocalChartCandidate} from './fixtures/kasi-local-chart-synthetic.mjs';
import {createLocalChartProfile,DST_PROFILE_ID,BASELINE_MANIFEST_SHA256,MODERN_CLOCK_POLICY_ID,verifyLocalChartResult,getLocalChartEventContext} from '../scripts/kasi/local-chart.mjs';
import {createLocalExtendedReportProfile,EXTENDED_REPORT_PROFILE_ID,validateLocalExtendedReportResult,renderLocalExtendedReportText} from '../scripts/kasi/local-extended-report.mjs';
import {KOREAN_DST_CLOCK_1987_1988_POLICY_ID as clockId} from '../dist/time/koreanDstClock1987V1.js';
const fixture=syntheticDstProfileCandidate();
const p0=Object.freeze({clockPolicyId:clockId,jurisdiction:'KR',timeZone:'Asia/Seoul',dayHourReference:'STANDARD_KST',dayRollover:'CIVIL_MIDNIGHT',hourStemReference:'SELECTED_DAY_PILLAR'});
const request=(date='1987-06-01',time='00:30',extra={})=>({calendar:'GREGORIAN',date,time,policies:{...p0,...extra}});
const profile=(f=fixture)=>createLocalChartProfile(f.loaded,{profileId:DST_PROFILE_ID,expectedManifestSha256:f.expectedManifestSha256});
const report=(base=profile(),extra={})=>createLocalExtendedReportProfile(base,{reportProfileId:EXTENDED_REPORT_PROFILE_ID,...extra});
const pillars=r=>r.chart.candidates.map(c=>['year','month','day','hour'].map(k=>c[k].stem+c[k].branch));
const lunar=r=>({lunarYear:r.lunarYear,lunarMonth:r.lunarMonth,lunarDay:r.lunarDay,leap:r.leap});

test('DSTpublicfixture has731syntheticdates49events with a newpin and no claim of actualKASI/lunardata',()=>{
 assert.equal(DST_PROFILE_SYNTHETIC_BASIS.nature,'GENERATED_SYNTHETIC_NOT_KASI_NOT_REAL_LUNAR_ORACLE');assert.equal(fixture.loaded.candidate.dates.length,731);assert.equal(fixture.loaded.candidate.events.length,49);assert.notEqual(fixture.expectedManifestSha256,BASELINE_MANIFEST_SHA256);assert.ok(fixture.loaded.sources.every(s=>s.fixtureNature===DST_PROFILE_SYNTHETIC_BASIS.nature));
 const p=profile();assert.deepEqual(p.metadata.birthRange,{fromInclusive:'1987-01-01',untilExclusive:'1989-01-01'});assert.equal(p.metadata.timeInterpretation.id,clockId);assert.equal(p.metadata.g0Receipt,null);
 const source=readFileSync(new URL('./fixtures/kasi-dst-profile-synthetic.mjs',import.meta.url),'utf8').replace(/\r\n/g,'\n');assert.equal(createHash('sha256').update(source).digest('hex'),'742cfb5812b6efd290da942ba46536f8bc1b5972d4ba14c255cfba350d4cbdcd');
});
test('seven fixed natal literals distinguish recorded civil input, standard calculation and date evidence',()=>{
 const p=profile();for(const e of expected){const req=request(e.date,e.time),r=p.calculate(req);assert.equal(r.status,'OK',e.date);assert.deepEqual(pillars(r),[e.pillars]);assert.equal(r.input.gregorianDate,e.date);assert.equal(r.input.time,e.time);assert.equal(r.chart.recordedBirthCivilMinute,e.date+'T'+e.time);assert.equal(r.chart.recordedBirthKstMinute,e.standardMinute);assert.equal(r.chart.normalizedBirthKstMinute,e.standardMinute);assert.equal(verifyLocalChartResult(r,{request:req}),r);assert.equal(r.evidence.dateConversion.observed.solarDate,e.date);assert.equal(r.evidence.dateConversion.calendarGanjiUsedAsPillars,false);assert.deepEqual(r.evidence.birthClockResolution,r.chart.clockResolution);}
});
test('jurisdiction timezone dayhourreference and exact clock are mandatory rather than hidden defaults',()=>{
 const p=profile();for(const key of ['jurisdiction','timeZone','dayHourReference','clockPolicyId']){const req=request();delete req.policies[key];assert.throws(()=>p.calculate(req));}
 for(const wrong of [{jurisdiction:'JP'},{timeZone:'Asia/Pyongyang'},{dayHourReference:'RECORDED_CIVIL'},{clockPolicyId:MODERN_CLOCK_POLICY_ID},{foldOffsetMinutes:undefined},{foldOffsetMinutes:570}])assert.throws(()=>p.calculate(request('1987-06-01','12:00',wrong)));
 for(const [date,time]of [['1987-06-01','12:00'],['1987-05-10','02:30'],['1988-10-09','02:30']])assert.throws(()=>p.calculate(request(date,time,{trueSolarTime:true})),/DST_POLICY_ARGUMENTS/);
 assert.equal(p.calculate(request('1962-06-01','12:00')).status,'OUT_OF_PROFILE_COVERAGE');assert.equal(p.calculate(request('1989-01-01','12:00')).status,'OUT_OF_PROFILE_COVERAGE');
});
test('gapfold produce no natal facts or fabricated time fallback through the report bridge',()=>{
 const p=report();for(const [date,time,status]of [['1987-05-10','02:30','NONEXISTENT_TIME'],['1988-05-08','02:30','NONEXISTENT_TIME'],['1987-10-11','02:30','AMBIGUOUS_TIME'],['1988-10-09','02:30','AMBIGUOUS_TIME']]){const r=p.calculate(request(date,time));assert.equal(r.status,status);assert.equal(r.m1.status,status);for(const key of ['chart','facts','root','summary'])assert.equal(Object.hasOwn(r,key),false);assert.equal(Object.hasOwn(r.m1,'chart'),false);if(status==='AMBIGUOUS_TIME'){assert.deepEqual(r.m1.clock.civilOffsetCandidates.map(c=>c.utcOffsetMinutes),[600,540]);assert.equal(r.m1.clock.civilOffsetCandidates.length,2);}else assert.deepEqual(r.m1.clock.civilOffsetCandidates,[]);assert.match(renderLocalExtendedReportText(r),/명식 보류/);}
});
test('explicit fold offsets allow one selected path while original ambiguity survives equal natal pillars',()=>{
 const p=report(),results=[600,540].map(foldOffsetMinutes=>p.calculate(request('1988-10-09','02:30',{foldOffsetMinutes})));
 for(const r of results){assert.equal(validateLocalExtendedReportResult(r),true);assert.equal(r.m1.chart.candidates.length,1);assert.equal(r.m1.chart.clockResolution.isAmbiguousCivilMinute,true);assert.equal(r.m1.chart.clockResolution.originalCivilStatus,'AMBIGUOUS_TIME');assert.equal(r.m1.chart.clockResolution.civilOffsetCandidates.length,2);assert.equal(r.facts.candidates.length,1);}
 assert.deepEqual(pillars(results[0].m1),[['戊辰','壬戌','丁酉','辛丑']]);assert.deepEqual(pillars(results[0].m1),pillars(results[1].m1));assert.notEqual(results[0].m1.chart.clockResolution.utcMinute,results[1].m1.chart.clockResolution.utcMinute);
 assert.throws(()=>p.calculate(request('1988-10-09','03:30',{foldOffsetMinutes:540})));
});
test('civil0030 normalization precedes four Zi combinations and equivalent syntheticlunarinput',()=>{
 const c=profile(),p=report(c),row=fixture.loaded.candidate.dates.find(r=>r.solarDate==='1987-06-01');
 const four=[['CIVIL_MIDNIGHT','SELECTED_DAY_PILLAR','1987-05-31','庚辰','丙子'],['CIVIL_MIDNIGHT','CIVIL_DATE_DAY_PILLAR','1987-05-31','庚辰','丙子'],['ZI_START','SELECTED_DAY_PILLAR','1987-06-01','辛巳','戊子'],['ZI_START','CIVIL_DATE_DAY_PILLAR','1987-06-01','辛巳','丙子']];
 for(const [dayRollover,hourStemReference,date,day,hour]of four){const g=request('1987-06-01','00:30',{dayRollover,hourStemReference}),l={calendar:'KOREAN_LUNAR',lunarDate:lunar(row),time:g.time,policies:g.policies},a=p.calculate(g),b=p.calculate(l);assert.equal(validateLocalExtendedReportResult(a),true);assert.equal(validateLocalExtendedReportResult(b),true);assert.deepEqual(pillars(a.m1),[['丁卯','乙巳',day,hour]]);assert.equal(a.m1.chart.effectiveDayDate,date);assert.deepEqual(a.m1.chart,b.m1.chart);assert.deepEqual(a.summary,b.summary);assert.deepEqual(a.gongmang,b.gongmang);assert.deepEqual(a.innerPatterns.candidates.map(c=>c.selection),b.innerPatterns.candidates.map(c=>c.selection));assert.notEqual(a.m1.evidence.dateConversion.method,b.m1.evidence.dateConversion.method);}
});
test('oneM1 feeds existingM2M3M4 with standardminute refs and separate M5/M7effect holds',()=>{
 const c=profile();let calls=0;const spy={calculate(r){calls++;return c.calculate(r);}},p=report(spy,{contextProfile:c}),r=p.calculate(request());assert.equal(calls,1);assert.equal(validateLocalExtendedReportResult(r),true);assert.equal(r.executionCounts.birthM1Calls,1);assert.equal(r.executionCounts.m2Derivations,1);assert.equal(r.executionCounts.m3BridgeDerivations,1);assert.equal(r.facts.status,'READY');assert.equal(r.evidence.status,'EVIDENCE_ONLY');assert.equal(r.root.candidates[0].targets.length,4);assert.equal(r.innerPatterns.candidates.length,1);assert.equal(r.gongmang.length,1);assert.equal(r.m5.status,'HOLD');assert.equal(r.featureScope.finalStrength,'NOT_IMPLEMENTED');renderLocalExtendedReportText(r);renderLocalExtendedReportText(r,{detail:'detailed'});assert.equal(calls,1);
});
test('winter Lichun and summer Jie preserve correlatedparents and candidate-local references',()=>{
 const p=report();for(const [date,time,years,months]of [['1988-02-04','23:43',['丁卯','戊辰'],['癸丑','甲寅']],['1987-07-08','01:39',['丁卯','丁卯'],['丙午','丁未']]]){const r=p.calculate(request(date,time));assert.equal(validateLocalExtendedReportResult(r),true);assert.equal(r.m1.chart.candidates.length,2);assert.deepEqual(r.m1.chart.candidates.map(c=>c.year.stem+c.year.branch),years);assert.deepEqual(r.m1.chart.candidates.map(c=>c.month.stem+c.month.branch),months);assert.equal(r.facts.candidates.length,2);for(let i=0;i<2;i++){const id=r.facts.candidates[i].id;assert.equal(r.innerPatterns.candidates[i].candidateRef,id);assert.equal(r.gongmang[i].candidateRef,id);assert.equal(r.m5.candidates[i].candidateRef,id);}assert.equal(r.m1.chart.clockResolution.isAmbiguousCivilMinute,false);}
});
test('summary detailed share issued facts and clones or crossrequest facts cannot forge a report',()=>{
 const p=report(),a=p.calculate(request()),b=p.calculate(request('1988-02-29','12:00'));assert.equal(a.detailed.summary,a.summary);const summary=renderLocalExtendedReportText(a),detailed=renderLocalExtendedReportText(a,{detail:'detailed'});assert.ok(detailed.startsWith(summary));assert.doesNotMatch(summary,/undefined|NaN|庚은|己은|manifest|schemaVersion/);for(const section of a.summary.sections)for(const item of section.items){assert.ok(item.valueRefs.length);assert.ok(detailed.includes(item.text));if(item.candidateRef)assert.ok(a.facts.candidates.some(c=>c.id===item.candidateRef));}
 assert.throws(()=>validateLocalExtendedReportResult(structuredClone(a)));const mixed=structuredClone(a);mixed.root.candidates[0]=structuredClone(b.root.candidates[0]);assert.throws(()=>validateLocalExtendedReportResult(mixed));assert.throws(()=>verifyLocalChartResult(structuredClone(a.m1)));assert.throws(()=>{a.m1.chart.clockResolution.isAmbiguousCivilMinute=true;},TypeError);
});
test('missingguard wrongsource pin sparseevents and forgedcalendar metadata fail before issuance',()=>{
 assert.throws(()=>createLocalChartProfile(fixture.loaded,{profileId:DST_PROFILE_ID,expectedManifestSha256:BASELINE_MANIFEST_SHA256}));
 for(const change of [c=>c.events.shift(),c=>{c.events[0].sourceRef=c.events[1].sourceRef;},c=>{delete c.events[1];},c=>{c.events[1].time='23:59';}]){const candidate=structuredClone(fixture.loaded.candidate),sources=structuredClone(fixture.loaded.sources);change(candidate);assert.throws(()=>profile(sealSyntheticLocalChartCandidate(candidate,sources)));}
 const c=profile(),context=getLocalChartEventContext(c);assert.equal(context.profile.id,DST_PROFILE_ID);assert.equal(context.events.filter(e=>e.displayedDateTime.startsWith('1986-')).length,1);assert.equal(context.events[0].term,'DAXUE');assert.equal(context.events.length,49);
});
test('fresh UTCSeoul subprocesses reproduce profile GL clock and boundary semantics without private files',()=>{
 const fixtureUrl=new URL('./fixtures/kasi-dst-profile-synthetic.mjs',import.meta.url).href,chartUrl=new URL('../scripts/kasi/local-chart.mjs',import.meta.url).href,values=[];
 const code=`import {syntheticDstProfileCandidate as fixture} from ${JSON.stringify(fixtureUrl)};import {createLocalChartProfile,DST_PROFILE_ID} from ${JSON.stringify(chartUrl)};globalThis.fetch=()=>{throw Error('NETWORK_FORBIDDEN')};const f=fixture(),p=createLocalChartProfile(f.loaded,{profileId:DST_PROFILE_ID,expectedManifestSha256:f.expectedManifestSha256}),row=f.loaded.candidate.dates.find(r=>r.solarDate==='1987-06-01'),l={calendar:'KOREAN_LUNAR',lunarDate:{lunarYear:row.lunarYear,lunarMonth:row.lunarMonth,lunarDay:row.lunarDay,leap:row.leap},time:'00:30',policies:${JSON.stringify(p0)}};process.stdout.write(JSON.stringify([${JSON.stringify(request())},${JSON.stringify(request('1988-10-09','02:30'))},${JSON.stringify(request('1988-10-09','02:30',{foldOffsetMinutes:600}))},l].map(r=>p.calculate(r))));`;
 for(const TZ of ['UTC','Asia/Seoul']){const child=spawnSync(process.execPath,['--input-type=module','-e',code],{env:{TZ},encoding:'utf8',windowsHide:true});assert.equal(child.status,0,child.stderr);assert.equal(child.stderr,'');values.push(child.stdout);}assert.equal(values[0],values[1]);const runs=JSON.parse(values[0]);assert.deepEqual(runs.map(r=>r.status),['OK','AMBIGUOUS_TIME','OK','OK']);assert.deepEqual(runs[0].chart,runs[3].chart);
});
