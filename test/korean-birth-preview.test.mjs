import test from "node:test";
import assert from "node:assert/strict";
import { resolveKoreanBirthChartPreview, labelKoreanGanZhi, ganZhiAt, createKoreanLunisolarConverter, KASI_KOREAN_LUNISOLAR_2025_2027 as corpus } from "../dist/index.js";
import { KOREA_SOLAR_TERM_EVENTS_2026_2027 as events } from "../dist/calendar/koreaSolarTermFixtures.js";
import { copyValidatedKoreanMonthBoundaryTrace } from "../dist/index.js";
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
 assert.throws(()=>labelKoreanGanZhi({stem:"甲",branch:"丑"}),RangeError);
 assert.throws(()=>labelKoreanGanZhi({stem:"乙",branch:"子"}),RangeError);
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
 assert.deepEqual(r.preview.solarTermSourceIds, ["KR-KASI-CALENDAR-DATA"]);
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
 assert.deepEqual(run(solar("2028-01-01")),{status:"OUT_OF_COVERAGE"});
});

test("valid Gregorian and lunar dates outside the solar-term interval return an explicit status",()=>{
 assert.deepEqual(run(solar("2025-12-31")),{status:"OUT_OF_COVERAGE"});
 assert.deepEqual(run(lunar(2027,12,10,false)),{status:"OUT_OF_COVERAGE"});
});

test("S3: preview retains a source-specific, versioned applied Jie trace without changing its version", () => {
 const preview=run(solar("2027-02-05")).preview;
 assert.equal(preview.schemaVersion,"v0-korean-birth-chart-preview-v1");
 assert.deepEqual(preview.monthBoundaryTrace,{
  schemaVersion:"m1-month-boundary-trace-v1",birthKstMinute:"2027-02-05T12:00",confidence:"DEFINITE",
  candidateContexts:[{candidateIndex:0,monthPillarFactRef:"preview.candidates[0].month",monthBranch:"寅",
   boundarySide:"DEFINITE",activeSince:{term:"LICHUN",koreanName:"입춘",hanjaName:"立春",
    displayedDateTime:"2027-02-04T10:46",timeBasis:"KST",sourcePrecision:"MINUTE",sourceIds:["KR-KASI-CALENDAR-DATA"]}}],
 });
});

test("S3: Gregorian/lunar traces agree before, at and after Lichun with separate conversion provenance", () => {
 for(const clock of ["10:45","10:46","10:47"]){
  const a=run(solar("2027-02-04"),clock).preview,b=run(lunar(2026,12,28,false),clock).preview;
  assert.deepEqual(a.monthBoundaryTrace,b.monthBoundaryTrace);
  assert.deepEqual(a.candidates,b.candidates);
  assert.equal(Object.hasOwn(a,"lunarConversionSource"),false);
  assert.equal(b.lunarConversionSource.sourceId,"KR-KASI-CALENDAR-DATA");
  const contexts=a.monthBoundaryTrace.candidateContexts;
  assert.deepEqual(contexts.map(c=>c.activeSince.term),clock==="10:45"?["XIAOHAN"]:clock==="10:46"?["XIAOHAN","LICHUN"]:["LICHUN"]);
  for(const context of contexts) assert.equal(context.monthBranch,a.candidates[context.candidateIndex].month.branch);
  if(clock==="10:46"){
   assert.deepEqual(contexts.map(c=>c.monthPillarFactRef),["preview.candidates[0].month","preview.candidates[1].month"]);
   assert.deepEqual(a.candidates.map(c=>[c.year.hanja,c.month.hanja]),[["丙午","辛丑"],["丁未","壬寅"]]);
  }
 }
});

test("S3: event sources stay separate from the supplied corpus source union and lunar source", () => {
 const editions=events.map(event=>({...event,sourceIds:[event.displayedDateTime==="2027-01-05T23:10"
  ?"TEST-PRIOR":event.displayedDateTime==="2027-02-04T10:46"?"TEST-BOUNDARY":"TEST-UNRELATED"]}));
 const results=[solar("2027-02-04"),lunar(2026,12,28,false)].map(input=>
  resolveKoreanBirthChartPreview(input,"10:46",policy,converter,editions,manifest).preview);
 for(const preview of results){
  assert.deepEqual(preview.solarTermSourceIds,["TEST-BOUNDARY","TEST-PRIOR","TEST-UNRELATED"]);
  assert.deepEqual(preview.monthBoundaryTrace.candidateContexts.map(c=>c.activeSince.sourceIds),[["TEST-PRIOR"],["TEST-BOUNDARY"]]);
  assert.deepEqual(preview.monthBoundaryTrace.atPublishedBoundary.sourceIds,["TEST-BOUNDARY"]);
 }
 assert.deepEqual(results[0].monthBoundaryTrace,results[1].monthBoundaryTrace);
 assert.equal(results[1].lunarConversionSource.sourceId,"KR-KASI-CALENDAR-DATA");
});

test("S3: invalid source/precision/time-basis corpora reject both calendar paths", () => {
 for(const patch of [{sourceIds:[]},{sourceIds:[""]},{sourceIds:["  "]},{sourceIds:Array(1)},
  {sourceIds:[42]},{timeBasis:"UTC"},{sourcePrecision:"SECOND"}]){
  const bad=events.map(event=>event.displayedDateTime==="2027-02-04T10:46"?{...event,...patch}:event);
  for(const input of [solar("2027-02-04"),lunar(2026,12,28,false)]){
   assert.throws(()=>resolveKoreanBirthChartPreview(input,"10:46",policy,converter,bad,manifest),
    /source provenance|source IDs|requires KST|requires MINUTE/);
  }
 }
});

test("S3: forged trace indices, references, events, sources and Lichun year correlation fail validation", () => {
 const original=run(solar("2027-02-04"),"10:46").preview;
 const mutations=[
  p=>{p.monthBoundaryTrace.schemaVersion="unknown";},
  p=>{p.monthBoundaryTrace.birthKstMinute="2027-02-04T10:47";},
  p=>{p.monthBoundaryTrace.confidence="DEFINITE";},
  p=>{p.monthBoundaryTrace.candidateContexts.pop();},
  p=>{delete p.monthBoundaryTrace.candidateContexts[0];},
  p=>{p.monthBoundaryTrace.candidateContexts[0].candidateIndex=1;},
  p=>{p.monthBoundaryTrace.candidateContexts[0].monthPillarFactRef="preview.candidates[1].month";},
  p=>{p.monthBoundaryTrace.candidateContexts[0].monthBranch="寅";},
  p=>{p.monthBoundaryTrace.candidateContexts[0].boundarySide="AFTER_PUBLISHED_MINUTE";},
  p=>{p.monthBoundaryTrace.candidateContexts[0].activeSince.displayedDateTime="2027-02-04T10:47";},
  p=>{p.monthBoundaryTrace.candidateContexts[1].activeSince.displayedDateTime="2027-02-04T10:45";},
  p=>{p.monthBoundaryTrace.candidateContexts[0].activeSince.timeBasis="UTC";},
  p=>{p.monthBoundaryTrace.candidateContexts[0].activeSince.sourcePrecision="SECOND";},
  p=>{p.monthBoundaryTrace.candidateContexts[0].activeSince.sourceIds=["FORGED-SOURCE"];},
  p=>{p.monthBoundaryTrace.candidateContexts[0].activeSince.sourceIds=[];},
  p=>{p.monthBoundaryTrace.candidateContexts[0].activeSince.sourceIds=Array(1);},
  p=>{p.monthBoundaryTrace.candidateContexts[0].activeSince.koreanName="입춘";},
  p=>{p.monthBoundaryTrace.candidateContexts[0].activeSince.term="DAHAN";},
  p=>{delete p.monthBoundaryTrace.atPublishedBoundary;},
  p=>{p.monthBoundaryTrace.atPublishedBoundary.sourceIds=[];},
  p=>{p.candidates[1].year=p.candidates[0].year;p.candidates[1].month.stem="庚";},
 ];
 for(const mutate of mutations){
  const preview=structuredClone(original);mutate(preview);
  assert.throws(()=>copyValidatedKoreanMonthBoundaryTrace(preview.monthBoundaryTrace,preview),RangeError);
 }
});

test("S3: projection validation checks exact event membership, not just corpus source membership", () => {
 const preview=structuredClone(run(solar("2027-02-05")).preview);
 preview.solarTermSourceIds.push("TEST-UNRELATED");
 const trace=preview.monthBoundaryTrace;
 trace.candidateContexts[0].activeSince.sourceIds=["TEST-UNRELATED"];
 assert.throws(()=>copyValidatedKoreanMonthBoundaryTrace(trace,preview,events),RangeError);
 trace.candidateContexts[0].activeSince.sourceIds=["KR-KASI-CALENDAR-DATA"];
 trace.candidateContexts[0].activeSince.displayedDateTime="2027-02-04T10:45";
 assert.throws(()=>copyValidatedKoreanMonthBoundaryTrace(trace,preview,events),RangeError);
});

test("S3: definite traces reject invented boundaries and non-Lichun traces reject mixed years", () => {
 const definite=structuredClone(run(solar("2027-02-05")).preview);
 definite.monthBoundaryTrace.atPublishedBoundary=definite.monthBoundaryTrace.candidateContexts[0].activeSince;
 assert.throws(()=>copyValidatedKoreanMonthBoundaryTrace(definite.monthBoundaryTrace,definite),RangeError);
 const jingzhe=structuredClone(run(solar("2027-03-06"),"04:40").preview);
 assert.deepEqual(jingzhe.monthBoundaryTrace.candidateContexts.map(c=>c.activeSince.term),["LICHUN","JINGZHE"]);
 jingzhe.candidates[1].year.branch="午";
 assert.throws(()=>copyValidatedKoreanMonthBoundaryTrace(jingzhe.monthBoundaryTrace,jingzhe),RangeError);
});

test("S3: public traces are frozen copies, including candidate contexts and exact sources", () => {
 for(const input of [solar("2027-02-05"),solar("2027-02-04")]){
  const preview=run(input,"10:46").preview,trace=preview.monthBoundaryTrace;
  for(const object of [trace,trace.candidateContexts,...trace.candidateContexts.flatMap(c=>[c,c.activeSince,c.activeSince.sourceIds])])
   assert.ok(Object.isFrozen(object));
  if(trace.atPublishedBoundary) assert.ok(Object.isFrozen(trace.atPublishedBoundary.sourceIds));
  const mutable=structuredClone(trace),copy=copyValidatedKoreanMonthBoundaryTrace(mutable,preview,events);
  mutable.candidateContexts[0].activeSince.sourceIds.push("MUTATED");
  assert.deepEqual(copy,trace);
 }
});
