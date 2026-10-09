import test from "node:test";
import assert from "node:assert/strict";
import { resolveKoreanBirthChartPreview, labelKoreanGanZhi, ganZhiAt, createKoreanLunisolarConverter, KASI_KOREAN_LUNISOLAR_2025_2027 as corpus } from "../dist/index.js";
import { KOREA_SOLAR_TERM_EVENTS_2026_2027 as events } from "../dist/calendar/koreaSolarTermFixtures.js";
const converter=createKoreanLunisolarConverter(corpus);
const policy={timeBasis:"KOREAN_CIVIL_TIME",dayRollover:"CIVIL_MIDNIGHT",hourStemReference:"SELECTED_DAY_PILLAR"};
const manifest={schemaVersion:"m1-solar-term-coverage-v1",requirementProfile:"FULL_24_TERM_YEAR",timeBasis:"KST",sourcePrecision:"MINUTE",supportedFromInclusive:"2026-01-01T00:00",supportedUntilExclusive:"2028-01-01T00:00",requiredYears:[2026,2027],requiredPriorBoundary:{year:2025,term:"DAXUE"}};
const solar=gregorianDate=>({calendar:"GREGORIAN",gregorianDate});
const lunar=(lunarYear,lunarMonth,lunarDay,isLeapMonth)=>({calendar:"KOREAN_LUNAR",lunarDate:{lunarYear,lunarMonth,lunarDay,isLeapMonth}});
const run=(input,clock="12:00",p=policy,m=manifest)=>resolveKoreanBirthChartPreview(input,clock,p,converter,events,m);
test("60 sexagenary labels have distinct Korean and Hanja forms",()=>{
 const hanja=new Set(),hangul=new Set();
 for(let i=0;i<60;i++){
  const v=labelKoreanGanZhi(ganZhiAt(i));
  assert.match(v.hanja,/^[甲乙丙丁戊己庚辛壬癸][子丑寅卯辰巳午未申酉戌亥]$/);
  assert.match(v.hangul,/^[가-힣]{2}$/);hanja.add(v.hanja);hangul.add(v.hangul);
 }
 assert.equal(hanja.size,60);assert.equal(hangul.size,60);
 assert.deepEqual(labelKoreanGanZhi({stem:"丁",branch:"未"}),{stem:"丁",branch:"未",hanja:"丁未",hangul:"정미"});
 assert.throws(()=>labelKoreanGanZhi({stem:"?",branch:"未"}),RangeError);
});
test("Gregorian chart preview carries four Korean labels and limited confidence",()=>{
 const r=run(solar("2027-02-05"));
 assert.equal(r.status,"OK");assert.equal(r.preview.locale,"ko-KR");
 assert.equal(r.preview.schemaVersion,"v0-korean-birth-chart-preview-v1");
 assert.equal(r.preview.candidates.length,1);
 assert.equal(r.preview.candidates[0].year.hangul,"정미");
 assert.equal(r.preview.candidates[0].month.hangul,"임인");
 assert.equal(r.preview.confidenceScope,"PUBLISHED_MINUTE_COMPARISON_ONLY");
 assert.equal(r.preview.coverage.validation,"STRUCTURAL_COVERAGE_ONLY");
 assert.equal(Object.hasOwn(r.preview,"lunarConversionSource"),false);
});
test("Lunar/Gregorian input charts agree but lunar source is retained",()=>{
 const a=run(lunar(2026,12,29,false)),b=run(solar("2027-02-05"));
 assert.equal(a.status,"OK");assert.equal(b.status,"OK");
 assert.equal(a.preview.recordedBirthKstMinute,"2027-02-05T12:00");
 assert.deepEqual(a.preview.candidates,b.preview.candidates);
 assert.equal(a.preview.input.lunarDate.lunarYear,2026);
 assert.equal(a.preview.lunarConversionSource.sourceId,"KR-KASI-CALENDAR-DATA");
});
test("published Lichun minute keeps both correlated candidates",()=>{
 const r=run(solar("2027-02-04"),"10:46");
 assert.equal(r.status,"OK");assert.equal(r.preview.confidence,"PUBLISHED_MINUTE_AMBIGUOUS");
 assert.deepEqual(r.preview.candidates.map(c=>c.year.hangul),["병오","정미"]);
 assert.deepEqual(r.preview.candidates[0].day,r.preview.candidates[1].day);
});
test("invalid and unsupported lunar dates cannot create a chart",()=>{
 assert.deepEqual(run(lunar(2026,6,1,true)),{status:"INVALID_LUNAR_DATE"});
 assert.deepEqual(run(lunar(2024,12,1,false)),{status:"OUT_OF_COVERAGE"});
});
test("invalid calendar, time, policy, manifest and out-of-range dates fail closed",()=>{
 assert.throws(()=>run({calendar:"AUTO",gregorianDate:"2027-02-05"}),RangeError);
 assert.throws(()=>run(solar("2027-02-05"),"24:00"),TypeError);
 assert.throws(()=>run(solar("2027-02-05"),"12:00",{...policy,dayRollover:"AUTO"}),RangeError);
 assert.throws(()=>resolveKoreanBirthChartPreview(solar("2027-02-05"),"12:00",policy,converter,events,undefined),RangeError);
 assert.throws(()=>run(solar("2028-01-01")),RangeError);
});
