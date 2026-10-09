import { ganZhiIndex, type GanZhi } from "../domain/sexagenary.js";
import type { HeavenlyStem } from "../domain/stems.js";
import type { EarthlyBranch } from "../domain/branches.js";
import type { KoreanLunarDate } from "./koreanLunisolarTypes.js";
import type { createKoreanLunisolarConverter } from "./koreanLunisolarConverter.js";
import type { SolarTermEvent } from "./solarTerms.js";
import { SolarTermQueryOutOfCoverageError, type FullYearSolarTermCoverageManifest } from "./solarTermCoverage.js";
import { resolveCoverageCheckedModernKoreanCivilFourPillars, type CoverageCheckedModernKoreanFourPillarsResolution, type ModernKoreanCivilTimePolicy } from "./fourPillars.js";
import { resolveKoreanLunarBirthFourPillars } from "./koreanLunarBirthFourPillars.js";

const STEM_HANGUL: Readonly<Record<HeavenlyStem,string>> = { 甲:"갑",乙:"을",丙:"병",丁:"정",戊:"무",己:"기",庚:"경",辛:"신",壬:"임",癸:"계" };
const BRANCH_HANGUL: Readonly<Record<EarthlyBranch,string>> = { 子:"자",丑:"축",寅:"인",卯:"묘",辰:"진",巳:"사",午:"오",未:"미",申:"신",酉:"유",戌:"술",亥:"해" };
export interface KoreanGanZhiLabel extends GanZhi { readonly hanja:string;readonly hangul:string; }
export function labelKoreanGanZhi(pillar:GanZhi):KoreanGanZhiLabel {
  const s=STEM_HANGUL[pillar?.stem],b=BRANCH_HANGUL[pillar?.branch];
  if(!s||!b||ganZhiIndex(pillar.stem,pillar.branch)===null)throw new RangeError("Unsupported sexagenary pillar pair.");
  return {stem:pillar.stem,branch:pillar.branch,hanja:pillar.stem+pillar.branch,hangul:s+b};
}
export type KoreanBirthDateInput =
 | {readonly calendar:"GREGORIAN";readonly gregorianDate:string}
 | {readonly calendar:"KOREAN_LUNAR";readonly lunarDate:KoreanLunarDate};
export interface KoreanBirthChartPreview {
 readonly schemaVersion:"v0-korean-birth-chart-preview-v1";
 readonly locale:"ko-KR";
 readonly input:KoreanBirthDateInput;
 readonly recordedBirthKstMinute:string;
 readonly effectiveDayDate:string;
 readonly policies:ModernKoreanCivilTimePolicy;
 readonly confidence:CoverageCheckedModernKoreanFourPillarsResolution["confidence"];
 readonly confidenceScope:"PUBLISHED_MINUTE_COMPARISON_ONLY";
 readonly coverage:CoverageCheckedModernKoreanFourPillarsResolution["coverage"];
 readonly lunarConversionSource?:{
  readonly corpusId:string;readonly sourceId:"KR-KASI-CALENDAR-DATA";
  readonly authorityLevel:"KASI_COMPUTATIONAL_REFERENCE_NOT_OFFICIAL_KASA";
 };
 readonly candidates:readonly {
  readonly year:KoreanGanZhiLabel;readonly month:KoreanGanZhiLabel;
  readonly day:KoreanGanZhiLabel;readonly hour:KoreanGanZhiLabel;
 }[];
}
export type KoreanBirthChartPreviewResult =
 | {readonly status:"OK";readonly preview:KoreanBirthChartPreview}
 | {readonly status:"OUT_OF_COVERAGE"|"INVALID_LUNAR_DATE"};
/** Explicit policy/source V0 DTO; structural coverage is not official certification. */
export function resolveKoreanBirthChartPreview(
 input:KoreanBirthDateInput,clock:string,policies:ModernKoreanCivilTimePolicy,
 converter:ReturnType<typeof createKoreanLunisolarConverter>,
 events:readonly SolarTermEvent[],manifest:FullYearSolarTermCoverageManifest,
):KoreanBirthChartPreviewResult {
 if(!input||(input.calendar!=="GREGORIAN"&&input.calendar!=="KOREAN_LUNAR"))
  throw new RangeError("Explicit Gregorian or Korean lunar calendar required.");
 if(typeof clock!=="string"||!/^(?:[01]\d|2[0-3]):[0-5]\d$/.test(clock))
  throw new TypeError("Birth clock must be HH:MM Korean civil time.");
 let chart:CoverageCheckedModernKoreanFourPillarsResolution;
 let source:KoreanBirthChartPreview["lunarConversionSource"];
 try {
  if(input.calendar==="KOREAN_LUNAR"){
   const result=resolveKoreanLunarBirthFourPillars(input.lunarDate,clock,policies,converter,events,manifest);
   if(result.status!=="OK")return {status:result.status};
   chart=result.chart;source=result.conversionSource;
  }else{
   chart=resolveCoverageCheckedModernKoreanCivilFourPillars(events,input.gregorianDate+"T"+clock,policies,manifest);
  }
 }catch(error){
  if(error instanceof SolarTermQueryOutOfCoverageError)return {status:"OUT_OF_COVERAGE"};
  throw error;
 }
 return {status:"OK",preview:{
  schemaVersion:"v0-korean-birth-chart-preview-v1",locale:"ko-KR",
  input:input.calendar==="GREGORIAN"
   ?{calendar:"GREGORIAN",gregorianDate:input.gregorianDate}
   :{calendar:"KOREAN_LUNAR",lunarDate:{...input.lunarDate}},
  recordedBirthKstMinute:chart.recordedBirthKstMinute,
  effectiveDayDate:chart.effectiveDayDate,policies:{...chart.policies},
  confidence:chart.confidence,confidenceScope:chart.confidenceScope,
  coverage:{...chart.coverage},
  ...(source?{lunarConversionSource:{...source}}:{}),
  candidates:chart.candidates.map(c=>({
   year:labelKoreanGanZhi(c.year),month:labelKoreanGanZhi(c.month),
   day:labelKoreanGanZhi(c.day),hour:labelKoreanGanZhi(c.hour),
  })),
 }};
}
