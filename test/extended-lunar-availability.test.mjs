import test from 'node:test';
import assert from 'node:assert/strict';
import {classifyExtendedLunarMiss} from '../scripts/kasi/local-chart.mjs';
const latest={lunarYear:2026,lunarMonth:11,lunarDay:23,leap:false};
// Independent validation contracts. These do not infer an unobserved lunar calendar.
const cases=[
 ['known short month day30',2026,2,30,false,29,'INVALID_LUNAR_DATE'],
 ['missing earlier leap month',2026,4,1,true,undefined,'INVALID_LUNAR_DATE'],
 ['earlier missing date is not a future gap',2025,11,30,false,29,'INVALID_LUNAR_DATE'],
 ['observed last month beyond observed days',2026,11,24,false,30,'NEEDS_DATA'],
 ['unobserved next month',2026,12,1,false,undefined,'NEEDS_DATA'],
 ['unobserved next lunar year',2027,1,1,false,undefined,'NEEDS_DATA'],
 ['unobserved leap is not invented',2027,4,1,true,undefined,'NEEDS_DATA'],
 ['later selected-input scope',2028,1,1,false,undefined,'OUT_OF_PROFILE_COVERAGE'],
];
test('extended lunar availability distinguishes known invalid dates from genuinely unobserved future rows',()=>{
 for(const [name,lunarYear,lunarMonth,lunarDay,leap,knownMonthDays,expected]of cases)assert.equal(classifyExtendedLunarMiss({lunarYear,lunarMonth,lunarDay,leap},{knownMonthDays,latestObserved:latest}),expected,name);
});
test('missing evidence and malformed lunar shapes are not converted into NEEDS_DATA',()=>{
 for(const lunar of [null,{lunarYear:2027,lunarMonth:13,lunarDay:1,leap:false},{lunarYear:2027,lunarMonth:1,lunarDay:31,leap:false},{lunarYear:2027,lunarMonth:1,lunarDay:1,leap:'false'}])assert.throws(()=>classifyExtendedLunarMiss(lunar,{latestObserved:latest}));
 assert.throws(()=>classifyExtendedLunarMiss({lunarYear:2027,lunarMonth:1,lunarDay:1,leap:false}));
 assert.throws(()=>classifyExtendedLunarMiss({lunarYear:2027,lunarMonth:1,lunarDay:1,leap:false},{knownMonthDays:31,latestObserved:latest}));
});
