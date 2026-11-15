import assert from 'node:assert/strict';
import test from 'node:test';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {spawnSync} from 'node:child_process';
import {KOREAN_DST_CLOCK_1987_1988_POLICY_ID as policyId,KOREAN_DST_CLOCK_1987_1988_METADATA as metadata,resolveKoreanDstClockMinute1987To1988 as clock,resolveKoreanDstApiEventMinute1987To1988 as event} from '../dist/time/koreanDstClock1987V1.js';
import {resolveKoreanDstFourPillars1987To1988 as compose} from '../dist/calendar/koreanDstFourPillars1987V1.js';
import {NAOJ_1987_STANDARD_MINUTES as y87,NAOJ_1988_STANDARD_MINUTES as y88,DST_CLOCK_BOUNDARIES as boundaries,DST_FOLD_0230_EXPECTATIONS as folds,KNOWN_DST_TERM_EDITION_DIFFERENCE as edition} from './fixtures/korean-dst1987-clock-cases.mjs';
const options=Object.freeze({policyId,jurisdiction:'KR',timeZone:'Asia/Seoul',dayHourReference:'STANDARD_KST'});
const policies=Object.freeze({clockPolicyId:policyId,jurisdiction:'KR',timeZone:'Asia/Seoul',dayHourReference:'STANDARD_KST',dayRollover:'CIVIL_MIDNIGHT',hourStemReference:'SELECTED_DAY_PILLAR'});
const fixture=year=>({
 events:[['DAXUE',(year-1)+'-12-07T12:00'],...(year===1987?y87:y88)].map(([term,displayedDateTime])=>({term,displayedDateTime,timeBasis:'KST',sourcePrecision:'MINUTE',sourceIds:['SYNTHETIC_SOURCE_NOT_API:'+displayedDateTime+':'+term]})),
 coverage:{schemaVersion:'m1-solar-term-coverage-v1',requirementProfile:'FULL_24_TERM_YEAR',timeBasis:'KST',sourcePrecision:'MINUTE',supportedFromInclusive:year+'-01-01T00:00',supportedUntilExclusive:(year+1)+'-01-01T00:00',requiredYears:[year],requiredPriorBoundary:{year:year-1,term:'DAXUE'}},
});
const pillars=r=>r.candidates.map(c=>['year','month','day','hour'].map(k=>c[k].stem+c[k].branch));

test('independent literal clock and historical-publication fixtures remain pinned',()=>{
 const source=readFileSync(new URL('./fixtures/korean-dst1987-clock-cases.mjs',import.meta.url),'utf8').replace(/\r\n/g,'\n');
 assert.equal(createHash('sha256').update(source).digest('hex'),'0b03fe4ab84346440eac91505570cbf68f15064e8a6118379fa28be6e20f482b');
 assert.equal(y87.length,24);assert.equal(y88.length,24);assert.equal(boundaries.length,23);
 assert.deepEqual(edition,{term:'HANLU',api:'1988-10-08T10:44',naoj:'1988-10-08T10:45',nominalMinutes:1,classification:'PUBLISHED_MINUTE_EDITION_DIFFERENCE_NOT_A_ONE_HOUR_DST_SHIFT'});
});
test('literal1987/1988 transition, midnight, leapday and scope boundaries preserve civil and normalized clocks',()=>{
 for(const [minute,status,standard,utc]of boundaries){const r=clock(minute,options);assert.equal(r.status,status,minute);assert.equal(r.recordedCivilMinute,minute);assert.equal(r.comparisonKstMinute,standard);assert.equal(r.dayHourMinute,standard);assert.equal(r.utcMinute,utc);assert.equal(r.utcInstant,null);assert.equal(r.sourcePrecision,'MINUTE');}
});
test('spring gaps have no instant, no shifted fallback and no chart',()=>{
 for(const minute of ['1987-05-10T02:30','1988-05-08T02:30']){const r=clock(minute,options);assert.equal(r.status,'NONEXISTENT_TIME');assert.deepEqual(r.civilOffsetCandidates,[]);assert.equal(Object.hasOwn(r,'candidates'),false);const f=fixture(Number(minute.slice(0,4)));assert.throws(()=>compose(f.events,minute,policies,f.coverage),/NONEXISTENT_TIME/);}
});
test('fall fold keeps both UTC minute mappings; explicit offset preserves original ambiguity',()=>{
 for(const expected of folds){const r=clock(expected.minute,options);assert.equal(r.status,'AMBIGUOUS_TIME');assert.equal(r.isAmbiguousCivilMinute,true);assert.equal(r.comparisonKstMinute,null);assert.deepEqual(r.civilOffsetCandidates.map(c=>c.utcOffsetMinutes),[600,540]);assert.deepEqual(r.civilOffsetCandidates.map(c=>c.standardKstMinute),expected.standard);assert.deepEqual(r.civilOffsetCandidates.map(c=>c.utcMinute),expected.utc);
  for(const [i,offset]of [600,540].entries()){const selected=clock(expected.minute,{...options,foldOffsetMinutes:offset});assert.equal(selected.status,'RESOLVED_UNDER_POLICY');assert.equal(selected.originalCivilStatus,'AMBIGUOUS_TIME');assert.equal(selected.isAmbiguousCivilMinute,true);assert.equal(selected.explicitFoldOffsetMinutes,offset);assert.equal(selected.comparisonKstMinute,expected.standard[i]);assert.equal(selected.utcMinute,expected.utc[i]);assert.deepEqual(selected.civilOffsetCandidates,r.civilOffsetCandidates);}
 }
});
test('the same pillars do not erase an unresolved civil fold',()=>{
 const f=fixture(1988),minute='1988-10-09T02:30';assert.throws(()=>compose(f.events,minute,policies,f.coverage),/AMBIGUOUS_TIME/);
 const first=compose(f.events,minute,{...policies,foldOffsetMinutes:600},f.coverage),second=compose(f.events,minute,{...policies,foldOffsetMinutes:540},f.coverage);
 assert.deepEqual(pillars(first),[['戊辰','壬戌','丁酉','辛丑']]);assert.deepEqual(pillars(first),pillars(second));
 assert.notEqual(first.clockResolution.utcMinute,second.clockResolution.utcMinute);assert.equal(first.clockResolution.isAmbiguousCivilMinute,true);assert.equal(second.clockResolution.isAmbiguousCivilMinute,true);
});
test('summer00:30 uses previous standarddate23:30 before the four existing day/hour policies',()=>{
 // Independent2000-01-07甲子 anchor difference:1987-05-31=-4604days=index16庚辰; next day辛巳.
 const f=fixture(1987),expected=[['CIVIL_MIDNIGHT','SELECTED_DAY_PILLAR','1987-05-31','庚辰','丙子'],['CIVIL_MIDNIGHT','CIVIL_DATE_DAY_PILLAR','1987-05-31','庚辰','丙子'],['ZI_START','SELECTED_DAY_PILLAR','1987-06-01','辛巳','戊子'],['ZI_START','CIVIL_DATE_DAY_PILLAR','1987-06-01','辛巳','丙子']];
 for(const [dayRollover,hourStemReference,date,day,hour]of expected){const r=compose(f.events,'1987-06-01T00:30',{...policies,dayRollover,hourStemReference},f.coverage);assert.equal(r.recordedBirthCivilMinute,'1987-06-01T00:30');assert.equal(r.recordedBirthKstMinute,'1987-05-31T23:30');assert.equal(r.normalizedBirthKstMinute,'1987-05-31T23:30');assert.equal(r.effectiveDayDate,date);assert.deepEqual(pillars(r),[['丁卯','乙巳',day,hour]]);}
});
test('APIstandard event and recordedDSTcivil birthday meet only after one-hour normalization',()=>{
 const f=fixture(1987);for(const [minute,n]of [['1987-07-08T01:38',1],['1987-07-08T01:39',2],['1987-07-08T01:40',1]]){const r=compose(f.events,minute,policies,f.coverage);assert.equal(r.candidates.length,n);if(n===2){assert.equal(r.recordedBirthKstMinute,'1987-07-08T00:39');assert.deepEqual(r.candidates.map(c=>c.month.stem+c.month.branch),['丙午','丁未']);assert.equal(r.monthBoundaryTrace.atPublishedBoundary.displayedDateTime,'1987-07-08T00:39');}}
 const wrong=compose(f.events,'1987-07-08T00:39',policies,f.coverage);assert.equal(wrong.candidates.length,1);assert.equal(wrong.candidates[0].month.stem+wrong.candidates[0].month.branch,'丙午');
});
test('Lichun preserves correlated year/month paths without a second DST branch',()=>{
 const f=fixture(1988),r=compose(f.events,'1988-02-04T23:43',policies,f.coverage);
 assert.deepEqual(r.candidates.map(c=>[c.year.stem+c.year.branch,c.month.stem+c.month.branch]),[['丁卯','癸丑'],['戊辰','甲寅']]);assert.equal(r.clockResolution.originalCivilStatus,'STANDARD');assert.equal(r.clockResolution.civilOffsetCandidates.length,1);assert.equal(r.candidates.length,2);
});
test('event interpretation does not apply summerDST or silently repair a one-minute edition difference',()=>{
 for(const [termCode,minute]of [...y87,...y88]){const r=event(minute,{policyId,termCode,role:'ANNUAL_EVENT'});assert.equal(r.displayedDateTime,minute);assert.equal(r.utcOffsetMinutes,540);assert.equal(r.daylightSavingMinutes,0);assert.equal(r.utcInstant,null);}
 assert.equal(event(edition.api,{policyId,termCode:'HANLU',role:'ANNUAL_EVENT'}).displayedDateTime,edition.api);
 for(const year of [1986,1987])assert.equal(event(year+'-12-07T12:00',{policyId,termCode:'DAXUE',role:'PRIOR_DAXUE_GUARD'}).role,'PRIOR_DAXUE_GUARD');
 for(const [minute,termCode,role]of [['1986-12-07T12:00','DAXUE','ANNUAL_EVENT'],['1988-12-07T12:00','DAXUE','PRIOR_DAXUE_GUARD'],['1986-11-07T12:00','DAXUE','PRIOR_DAXUE_GUARD'],['1986-12-07T12:00','DONGZHI','PRIOR_DAXUE_GUARD'],['1989-02-04T12:00','LICHUN','ANNUAL_EVENT']])assert.throws(()=>event(minute,{policyId,termCode,role}),RangeError);
});
test('missing jurisdiction/reference, fake policies, invalid minutes and inapplicable fold offsets fail explicitly',()=>{
 for(const key of ['policyId','jurisdiction','timeZone','dayHourReference']){const bad={...options};delete bad[key];assert.throws(()=>clock('1988-06-01T12:00',bad),RangeError);}
 for(const bad of [null,undefined,{...options,policyId:'FAKE'},{...options,jurisdiction:'JP'},{...options,timeZone:'Asia/Pyongyang'},{...options,dayHourReference:'RECORDED_CIVIL'},{...options,trueSolarTime:true},{...options,foldOffsetMinutes:undefined},{...options,foldOffsetMinutes:570},{...options,foldOffsetMinutes:540}])assert.throws(()=>clock('1988-06-01T12:00',bad),RangeError);
 for(const minute of [null,undefined,'1987-02-29T12:00','1988-02-30T12:00','1988-05-08T24:00','1988-05-08T12:00:00','1988-05-08T12:00Z','1988-05-08T??:??'])assert.throws(()=>clock(minute,options),RangeError);
 for(const offset of [540,600])assert.throws(()=>clock('1988-05-08T02:30',{...options,foldOffsetMinutes:offset}),RangeError);
});
test('composer fails closed on incomplete, sparse or foreign coverage and preserves immutable clock metadata',()=>{
 const f=fixture(1987);for(const events of [f.events.slice(1),f.events.slice(0,-1),[...f.events,f.events[1]],Object.assign([...f.events],{1:undefined})])assert.throws(()=>compose(events,'1987-06-01T12:00',policies,f.coverage));
 assert.throws(()=>compose(f.events,'1987-06-01T12:00',{...policies,extra:true},f.coverage),RangeError);
 assert.throws(()=>compose(f.events,'1987-06-01T12:00',policies,{...f.coverage,requiredYears:[1988]}));
 const r=clock('1988-10-09T02:30',options);assert.equal(Object.isFrozen(metadata),true);assert.equal(metadata.sourceRefs.length,5);assert.equal(Object.isFrozen(r.civilOffsetCandidates),true);assert.equal(r.civilOffsetCandidates.every(Object.isFrozen),true);assert.throws(()=>{r.civilOffsetCandidates[0].utcOffsetMinutes=0;},TypeError);assert.equal(Object.hasOwn(r,'trueSolarTime'),false);
});
test('UTC and AsiaSeoul child processes produce the same literal offset/UTC/pillar-reference results',()=>{
 const moduleUrl=new URL('../dist/time/koreanDstClock1987V1.js',import.meta.url).href,values=[];
 const code=`import {resolveKoreanDstClockMinute1987To1988 as c} from ${JSON.stringify(moduleUrl)};process.stdout.write(JSON.stringify(${JSON.stringify(boundaries.map(r=>r[0]))}.map(m=>c(m,${JSON.stringify(options)}))));`;
 for(const TZ of ['UTC','Asia/Seoul']){const child=spawnSync(process.execPath,['--input-type=module','-e',code],{env:{TZ},encoding:'utf8',windowsHide:true});assert.equal(child.status,0,child.stderr);assert.equal(child.stderr,'');values.push(child.stdout);}
 assert.equal(values[0],values[1]);assert.equal(JSON.parse(values[0]).length,23);
});
