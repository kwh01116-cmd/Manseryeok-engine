import assert from 'node:assert/strict';
import test from 'node:test';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {spawnSync} from 'node:child_process';
import {HISTORICAL_KOREAN_CLOCK_POLICY_ID as policyId,HISTORICAL_KOREAN_CLOCK_METADATA as metadata,resolveHistoricalKoreanClockMinute as clock,resolveHistoricalApiEventMinute as event} from '../dist/time/historicalKoreanClockV1.js';
import {HISTORICAL_CLOCK_YEAR_EXPECTATIONS as years,HISTORICAL_CLOCK_BOUNDARY_EXPECTATIONS as boundaries,HISTORICAL_CLOCK_REJECTED_MINUTES as invalid} from './fixtures/historical-korean-clock-v1-cases.mjs';

test('historical clock fixture stays literal and independently pinned',()=>{
 const bytes=readFileSync(new URL('./fixtures/historical-korean-clock-v1-cases.mjs',import.meta.url),'utf8').replace(/\r\n/g,'\n');
 assert.equal(createHash('sha256').update(bytes).digest('hex'),'68e234f611dc923d97c329c07a6cb5ac244cd3d31dae11ad2645379182a1f526');
 assert.equal(years.length,39);assert.equal(boundaries.length,26);
});
test('all39 historical years distinguish25 accepted years from14 unresolved years',()=>{
 let resolved=0,held=0;
 for(const [year,status]of years){const value=clock(year+'-07-01T12:00',{policyId});assert.equal(value.status,status,String(year));if(status==='RESOLVED_UNDER_POLICY')resolved++;else held++;}
 assert.equal(resolved,25);assert.equal(held,14);
});
test('fixed1950/1954/1961/1987/1988 boundaries never get modern fixedKST fallback',()=>{
 for(const expected of boundaries){const actual=clock(expected.minute,{policyId});assert.equal(actual.status,expected.status,expected.id);assert.equal(actual.recordedCivilMinute,expected.minute);assert.equal(actual.utcInstant,null);if(expected.status==='RESOLVED_UNDER_POLICY'){assert.equal(actual.comparisonKstMinute,expected.minute);assert.equal(actual.utcOffsetMinutes,540);assert.equal(actual.daylightSavingMinutes,0);}else{assert.equal(actual.comparisonKstMinute,null);assert.equal(actual.utcOffsetMinutes,null);assert.equal(actual.daylightSavingMinutes,null);}}
});
test('DSTfold preserves both offset possibilities without selecting an instant or natal candidate',()=>{
 for(const expected of boundaries.filter(r=>r.status==='AMBIGUOUS_TIME')){const actual=clock(expected.minute,{policyId});assert.deepEqual(actual.civilOffsetCandidates.map(c=>c.utcOffsetMinutes),expected.candidateOffsets);assert.deepEqual(actual.civilOffsetCandidates.map(c=>c.daylightSavingMinutes),[60,0]);assert.equal(actual.comparisonKstMinute,null);assert.equal(actual.utcInstant,null);assert.equal(Object.hasOwn(actual,'chart'),false);}
});
test('DSTgap remains nonexistent and never gets a shifted comparison minute',()=>{
 for(const expected of boundaries.filter(r=>r.status==='NONEXISTENT_TIME')){const actual=clock(expected.minute,{policyId});assert.equal(actual.reason,'DST_FORWARD_GAP');assert.deepEqual(actual.civilOffsetCandidates,[]);assert.equal(actual.comparisonKstMinute,null);}
});
test('only actual1961DecemberDaxue is eligible as an extra prior-year guard',()=>{
 const guard=event('1961-12-07T12:00',{policyId,termCode:'DAXUE',role:'PRIOR_DAXUE_GUARD'});
 assert.equal(guard.displayedDateTime,'1961-12-07T12:00');assert.equal(guard.utcOffsetMinutes,540);assert.equal(guard.utcInstant,null);
 assert.equal(clock('1961-12-07T12:00',{policyId}).status,'POLICY_UNRESOLVED');
 assert.equal(event('1985-12-07T12:00',{policyId,termCode:'DAXUE',role:'PRIOR_DAXUE_GUARD'}).role,'PRIOR_DAXUE_GUARD');
 assert.equal(event('1964-05-05T12:00',{policyId,termCode:'LIXIA',role:'ANNUAL_EVENT'}).role,'ANNUAL_EVENT');
});
test('wrong event role/term/year cannot promote unsupported source rows',()=>{
 const rows=[['1961-12-07T12:00','DAXUE','ANNUAL_EVENT'],['1961-12-07T12:00','DONGZHI','PRIOR_DAXUE_GUARD'],['1961-11-07T12:00','DAXUE','PRIOR_DAXUE_GUARD'],['1960-12-07T12:00','DAXUE','PRIOR_DAXUE_GUARD'],['1987-01-05T12:00','XIAOHAN','ANNUAL_EVENT'],['2026-12-07T12:00','DAXUE','PRIOR_DAXUE_GUARD'],['1964-05-05T12:00','FAKE','ANNUAL_EVENT'],['1964-05-05T12:00','LIXIA','FAKE']];
 for(const [minute,termCode,role]of rows)assert.throws(()=>event(minute,{policyId,termCode,role}),RangeError);
});
test('invalid/unknown/seconds/zoned time inputs and missing/foreignpolicy are explicit errors',()=>{
 for(const minute of invalid)assert.throws(()=>clock(minute,{policyId}),RangeError,minute);
 for(const options of [undefined,{},null,{policyId:'KR_API_PUBLISHED_KST_MODERN_1988_POST_DST_V1'},{policyId:'FAKE'}])assert.throws(()=>clock('1962-01-01T12:00',options),RangeError);
 for(const minute of [null,undefined,{},'1962-01-01T??:??'])assert.throws(()=>clock(minute,{policyId}),RangeError);
});
test('nominal recordeddate/23hour stays unchanged; calendar policy is not hidden in clock conversion',()=>{
 for(const minute of ['1962-01-01T00:00','1969-12-31T23:00','1975-06-01T23:30','1980-02-29T23:59','1986-12-31T23:59']){const actual=clock(minute,{policyId});assert.equal(actual.comparisonKstMinute,minute);assert.equal(actual.sourcePrecision,'MINUTE');assert.equal(Object.hasOwn(actual,'effectiveDayDate'),false);assert.equal(Object.hasOwn(actual,'solarTime'),false);}
});
test('policy/source/limitations are immutable and sourceauth is not claimed',()=>{
 assert.equal(metadata.id,policyId);assert.equal(metadata.version,'1');assert.equal(metadata.sources.length,5);assert.equal(new Set(metadata.sourceRefs).size,5);assert.equal(Object.isFrozen(metadata),true);assert.equal(Object.isFrozen(metadata.sources),true);assert.equal(metadata.sources.every(Object.isFrozen),true);
 const actual=clock('1962-01-01T12:00',{policyId});assert.equal(Object.isFrozen(actual),true);assert.equal(Object.isFrozen(actual.sourceRefs),true);assert.equal(actual.limitations.includes('NO_CALENDAR_DATA_OR_SOURCE_RIGHTS_AUTHENTICATION'),true);
 assert.equal(Object.hasOwn(actual,'officialCertification'),false);assert.throws(()=>{actual.policy.version='2';},TypeError);
});
test('UTC and AsiaSeoul processes reproduce literal statuses without host-timezone conversions',()=>{
 const url=new URL('../dist/time/historicalKoreanClockV1.js',import.meta.url).href;
 const code=`import {resolveHistoricalKoreanClockMinute as c,HISTORICAL_KOREAN_CLOCK_POLICY_ID as id} from ${JSON.stringify(url)};process.stdout.write(JSON.stringify(['1962-01-01T00:00','1986-12-31T23:59','1987-05-10T02:30','1988-10-09T02:30'].map(m=>c(m,{policyId:id}))));`;
 const values=[];for(const TZ of ['UTC','Asia/Seoul']){const child=spawnSync(process.execPath,['--input-type=module','-e',code],{env:{TZ},encoding:'utf8',windowsHide:true});assert.equal(child.status,0,child.stderr);assert.equal(child.stderr,'');values.push(child.stdout);}
 assert.equal(values[0],values[1]);assert.deepEqual(JSON.parse(values[0]).map(c=>c.status),['RESOLVED_UNDER_POLICY','RESOLVED_UNDER_POLICY','NONEXISTENT_TIME','AMBIGUOUS_TIME']);
});
