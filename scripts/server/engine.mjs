/** Server-owned data context. No HTTP, key provider, client data-file route, or implicit birth clock. */
import {fingerprint} from '../../.kasi-build/schema.js';
import {gregorianDayNumber} from '../../dist/calendar/koreanLunisolarValidation.js';
import {isGregorianMinute} from '../../dist/calendar/solarTermTimeline.js';
import {DAY_ROLLOVER_POLICIES} from '../../dist/calendar/dayRollover.js';
import {HOUR_STEM_REFERENCE_POLICIES} from '../../dist/calendar/dayHourPillars.js';
import {KOREAN_DST_CLOCK_1987_1988_POLICY_ID} from '../../dist/time/koreanDstClock1987V1.js';
import {HISTORICAL_KOREAN_CLOCK_POLICY_ID} from '../../dist/time/historicalKoreanClockV1.js';
import {M5_LIMITED_PURPOSE_POLICY_ID} from '../../dist/m5/limitedPurposeV1.js';
import {MONTHLY_LUCK_POLICY_ID} from '../../dist/luck/monthlyLuckV1.js';
import {MONTHLY_LUCK_V2_POLICY_ID} from '../../dist/luck/monthlyLuckV2.js';
import {WEIGHTED_SUPPORT_POLICY_ID} from '../experimental/weighted-support.mjs';
import {loadServerApiOnlyDataPack} from '../server-data/load.mjs';
import {verifyServerApiOnlyLoaded} from '../server-data/binding.mjs';
import {SERVER_API_ONLY_ACCEPTED_PIN,SERVER_API_ONLY_RIGHTS} from '../server-data/constants.mjs';
import {createLocalChartProfile,verifyLocalChartResult,MODERN_PROFILE_ID,MODERN_CLOCK_POLICY_ID,HISTORICAL_PROFILE_ID,DST_PROFILE_ID,EXTENDED_SOLAR_PROFILE_ID,EXTENDED_MODERN_CLOCK_POLICY_ID} from '../kasi/local-chart.mjs';
import {createLocalProductReportProfile,validateLocalProductReportResult,PRODUCT_REPORT_PROFILE_ID} from '../kasi/local-product-report.mjs';
import {createLocalExtendedReportProfile,validateLocalExtendedReportResult,EXTENDED_REPORT_PROFILE_ID} from '../kasi/local-extended-report.mjs';
import {luckSelection} from '../kasi/local-analysis-report.mjs';

export const SERVER_REQUEST_SCHEMA='manseryeok-server-analysis-request-v1';
export const SERVER_RESULT_SCHEMA='manseryeok-server-analysis-result-v1';
export const SERVER_ANALYSIS_PROFILE_ID='KASI-SERVER-API-ONLY-ANALYSIS-V01';
const VERSION='1.0.0',issued=new WeakMap();
const clocks=new Map([[MODERN_PROFILE_ID,MODERN_CLOCK_POLICY_ID],[HISTORICAL_PROFILE_ID,HISTORICAL_KOREAN_CLOCK_POLICY_ID],[DST_PROFILE_ID,KOREAN_DST_CLOCK_1987_1988_POLICY_ID],[EXTENDED_SOLAR_PROFILE_ID,EXTENDED_MODERN_CLOCK_POLICY_ID]]);
const check=(ok,code)=>{if(!ok)throw new RangeError(code);};
function object(value,names,code){check(value&&typeof value==='object'&&!Array.isArray(value)&&[Object.prototype,null].includes(Object.getPrototypeOf(value))&&Reflect.ownKeys(value).every(k=>{const p=Object.getOwnPropertyDescriptor(value,k);return typeof k==='string'&&names.includes(k)&&p.enumerable&&'value' in p;}),code);}
function freeze(value){if(value&&typeof value==='object'&&!Object.isFrozen(value)){Object.values(value).forEach(freeze);Object.freeze(value);}return value;}
const selectedMonthly=profile=>profile===MODERN_PROFILE_ID?MONTHLY_LUCK_POLICY_ID:MONTHLY_LUCK_V2_POLICY_ID;

/** Validation only; null is an explicit unknown time, never 00:00/noon. */
export function validateApiOnlyServerRequest(request){
 object(request,['schemaVersion','analysisProfileId','calendarProfileId','jurisdiction','timeZone','calendar','date','lunarDate','time','policies','monthlyOptions','luckOptions','experimentalPolicyId'],'SERVER_REQUEST_FIELDS');
 check(request.schemaVersion===SERVER_REQUEST_SCHEMA&&request.analysisProfileId===SERVER_ANALYSIS_PROFILE_ID,'EXPLICIT_SERVER_SCHEMA_AND_PROFILE_REQUIRED');
 check(clocks.has(request.calendarProfileId),'EXPLICIT_SERVER_CALENDAR_PROFILE_REQUIRED');
 check(request.jurisdiction==='KR'&&request.timeZone==='Asia/Seoul','EXPLICIT_KR_JURISDICTION_AND_TIMEZONE_REQUIRED');
 check(['GREGORIAN','KOREAN_LUNAR'].includes(request.calendar),'SERVER_CALENDAR_REQUIRED');
 if(request.calendar==='GREGORIAN'){check(typeof request.date==='string'&&request.lunarDate===undefined,'SERVER_GREGORIAN_INPUT');gregorianDayNumber(request.date);}
 else{check(request.date===undefined,'SERVER_LUNAR_INPUT');const l=request.lunarDate;object(l,['lunarYear','lunarMonth','lunarDay','leap'],'SERVER_LUNAR_FIELDS');check(Number.isInteger(l.lunarYear)&&l.lunarYear>0&&Number.isInteger(l.lunarMonth)&&l.lunarMonth>=1&&l.lunarMonth<=12&&Number.isInteger(l.lunarDay)&&l.lunarDay>=1&&l.lunarDay<=30&&typeof l.leap==='boolean','SERVER_LUNAR_SHAPE');}
 check(request.time===null||(typeof request.time==='string'&&/^(?:[01]\d|2[0-3]):[0-5]\d$/.test(request.time)),'EXPLICIT_TIME_OR_NULL_REQUIRED');
 const p=request.policies;object(p,['clockPolicyId','dayRollover','hourStemReference','dayHourReference','foldOffsetMinutes'],'SERVER_POLICY_FIELDS');
 check(p.clockPolicyId===clocks.get(request.calendarProfileId),'SERVER_CLOCK_PROFILE_CONFLICT');check(DAY_ROLLOVER_POLICIES.includes(p.dayRollover)&&HOUR_STEM_REFERENCE_POLICIES.includes(p.hourStemReference),'SERVER_EXPLICIT_DAY_HOUR_POLICIES');
 if(request.calendarProfileId===DST_PROFILE_ID){check(p.dayHourReference==='STANDARD_KST','SERVER_DST_STANDARD_REFERENCE_REQUIRED');if(Object.hasOwn(p,'foldOffsetMinutes'))check(p.foldOffsetMinutes===540||p.foldOffsetMinutes===600,'SERVER_DST_FOLD_OFFSET');}
 else check(p.dayHourReference===undefined&&p.foldOffsetMinutes===undefined,'SERVER_DST_OPTIONS_REQUIRE_DST_PROFILE');
 if(request.monthlyOptions!==undefined){const m=request.monthlyOptions;object(m,['policyId','year','queryMinute'],'SERVER_MONTHLY_FIELDS');check(m.policyId===selectedMonthly(request.calendarProfileId)&&(m.year!==undefined||m.queryMinute!==undefined),'SERVER_EXPLICIT_MONTHLY_POLICY');if(m.year!==undefined)check(Number.isInteger(m.year)&&m.year>=1&&m.year<=9999,'SERVER_MONTHLY_YEAR');if(m.queryMinute!==undefined)check(typeof m.queryMinute==='string'&&isGregorianMinute(m.queryMinute),'SERVER_MONTHLY_QUERY');}
 if(request.luckOptions!==undefined){const l=request.luckOptions;object(l,['luckPolicyId','features','calendarProjectionPolicyId','asOfMinute'],'SERVER_LUCK_FIELDS');if(l.features!==undefined){object(l.features,['dayun','seyun'],'SERVER_LUCK_FEATURES');if(l.features.dayun!==undefined)object(l.features.dayun,['traditionalSex','count'],'SERVER_DAYUN_FIELDS');if(l.features.seyun!==undefined)object(l.features.seyun,['yearLabel','queryMinute'],'SERVER_SEYUN_FIELDS');}const selection=luckSelection(l);check(!selection.invalidDayun,'SERVER_INVALID_DAYUN_INPUT');}
 if(request.experimentalPolicyId!==undefined)check(request.calendarProfileId===MODERN_PROFILE_ID&&request.experimentalPolicyId===WEIGHTED_SUPPORT_POLICY_ID,'SERVER_EXPERIMENTAL_POLICY_REQUIRES_MODERN_PROFILE');
 return true;
}

function chartRequest(request){return {calendar:request.calendar,...(request.calendar==='GREGORIAN'?{date:request.date}:{lunarDate:structuredClone(request.lunarDate)}),time:request.time,policies:{...request.policies,...(request.calendarProfileId===DST_PROFILE_ID?{jurisdiction:request.jurisdiction,timeZone:request.timeZone}:{})}};}
function dataRights(identity){return {id:identity.id,version:identity.version,manifestContentSha256:identity.manifestContentSha256,upstreamBaseManifestContentSha256:identity.upstreamBaseManifestSha256,validationLevel:identity.validationLevel,usageRights:SERVER_API_ONLY_RIGHTS,rawCalendarDatasetIncluded:false};}
function snapshot(native,modern){
 // A versioned server projection: existing selected analysis objects and their
 // reference paths remain unchanged; legacy pack-wide technical labels are not
 // reinterpreted as the rights audit for this separately accepted data pack.
 return modern?{profile:native.profile,base:native.base,m5:native.m5,m5Explanation:native.m5Explanation,gongmang:native.gongmang,monthly:native.monthly,selectedPolicies:native.selectedPolicies,summary:native.summary}
 :{profile:native.profile,m1:native.m1,facts:native.facts,evidence:native.evidence,seasonal:native.seasonal,root:native.root,support:native.support,innerPatterns:native.innerPatterns,gongmang:native.gongmang,m5:native.m5,monthly:native.monthly,featureScope:native.featureScope,summary:native.summary};
}
function pathAt(root,path){return path.replace(/\[(\d+)\]/g,'.$1').split('.').reduce((value,key)=>value?.[key],root);}

export async function loadApiOnlyServerEngine(options){
 object(options,['dataDirectory'],'SERVER_ENGINE_OPTIONS');check(typeof options.dataDirectory==='string'&&options.dataDirectory.length>0,'SERVER_DATA_DIRECTORY_REQUIRED');
 const loaded=await loadServerApiOnlyDataPack({directory:options.dataDirectory});return createApiOnlyServerEngine(loaded);
}
/** Only an issued, independently pinned API-only pack can instantiate the service. */
export function createApiOnlyServerEngine(loaded){
 const identity=verifyServerApiOnlyLoaded(loaded),contexts=new Map();
 check(identity.manifestContentSha256===SERVER_API_ONLY_ACCEPTED_PIN,'SERVER_ACCEPTED_PACK_REQUIRED');
 function prepare(profileId,experimentalPolicyId){
  const key=profileId+':'+(experimentalPolicyId??'NONE');let value=contexts.get(key);if(value)return value;
  const chart=createLocalChartProfile(loaded,{profileId,expectedManifestSha256:SERVER_API_ONLY_ACCEPTED_PIN,...(profileId===EXTENDED_SOLAR_PROFILE_ID?{annualSolarExtension:loaded.annualSolarExtension}:{})});
  const modern=profileId===MODERN_PROFILE_ID;
  const report=modern?createLocalProductReportProfile(chart,{reportProfileId:PRODUCT_REPORT_PROFILE_ID,m5PolicyId:M5_LIMITED_PURPOSE_POLICY_ID,...(experimentalPolicyId===undefined?{}:{experimentalPolicyId})}):createLocalExtendedReportProfile(chart,{reportProfileId:EXTENDED_REPORT_PROFILE_ID});
  value={chart,report,modern};contexts.set(key,value);return value;
 }
 return Object.freeze({capabilities:freeze({schemaVersion:'manseryeok-server-capabilities-v1',profile:{id:SERVER_ANALYSIS_PROFILE_ID,version:VERSION},dataPack:dataRights(identity),dataAvailability:{observedDateMapping:{fromInclusive:'1950-01-01',untilExclusive:'2027-01-01'},solarEvents:{fromYear:1950,throughYear:2027},lunarMapping2027:'NEEDS_DATA',monthly2027:{completeIntervals:10,missingIntervals:2},guardEvents2028:'NEEDS_DATA'},calendarProfiles:[...clocks].map(([id,clockPolicyId])=>({id,clockPolicyId,birthRange:id===HISTORICAL_PROFILE_ID?{fromInclusive:'1962-01-01',untilExclusive:'1987-01-01'}:id===DST_PROFILE_ID?{fromInclusive:'1987-01-01',untilExclusive:'1989-01-01'}:{fromInclusive:'1989-01-01',untilExclusive:id===MODERN_PROFILE_ID?'2027-01-01':'2028-01-01'},calendarCoverage:id===EXTENDED_SOLAR_PROFILE_ID?'2027_GREGORIAN_ONLY_LUNAR_MAPPING_NEEDS_DATA':'GREGORIAN_AND_OBSERVED_KOREAN_LUNAR',unknownTime:'NEEDS_BIRTH_TIME_NO_INVENTED_NATAL_CHART'})),deployment:'SERVER_PROCESS_ONLY_NO_PUBLIC_DATA_ENDPOINT',m6:'NOT_IMPLEMENTED',m5:'EXISTING_LIMITED_POLICY_FOR_MODERN_PROFILE_ONLY',release:'NOT_APPROVED_FOR_PUBLIC_RELEASE'}),
  calculate(request){
   validateApiOnlyServerRequest(request);const requestHash=fingerprint(request),common={schemaVersion:SERVER_RESULT_SCHEMA,profile:{id:SERVER_ANALYSIS_PROFILE_ID,version:VERSION},request:structuredClone(request),dataPack:dataRights(identity)};
   if(request.time===null){const result=freeze({...common,status:'NEEDS_BIRTH_TIME',calculation:null,candidates:[],analysisData:null,summary:null,executionCounts:{birthM1Calls:0},holds:[{code:'EXPLICIT_UNKNOWN_BIRTH_TIME',meaning:'No invented midnight or noon; timed natal calculation is not executed.'}],limitations:['NOT_A_TIME_UNKNOWN_FULL_NATAL_CHART']});issued.set(result,{hash:fingerprint(result),requestHash,native:null});return result;}
   const context=prepare(request.calendarProfileId,request.experimentalPolicyId),input=chartRequest(request);
   const native=context.report.calculate(input,context.modern?{luckOptions:request.luckOptions??{},monthlyOptions:request.monthlyOptions??{}}:{monthlyOptions:request.monthlyOptions});
   const m1=context.modern?native.base?.existing?.m1:native.m1;
   check(m1,'SERVER_M1_RESULT_REQUIRED');
   if(m1.status!=='OK'){
    const result=freeze({...common,status:m1.status,calculation:m1,candidates:[],analysisData:null,summary:null,executionCounts:{birthM1Calls:1},holds:[{code:m1.reason??m1.status,clock:m1.clock??null,missingData:m1.missingData??[]}],limitations:['NO_NATAL_CHART_INFERRED_FOR_HELD_INPUT']});issued.set(result,{hash:fingerprint(result),requestHash,native:null});return result;
   }
   verifyLocalChartResult(m1,{request:input});if(context.modern)validateLocalProductReportResult(native);else validateLocalExtendedReportResult(native);
   const analysisData=snapshot(native,context.modern),existing=context.modern?native.base.existing:native;
   const dataPrefix=context.modern?'base.existing.':'',luckRequested=request.luckOptions?.features!==undefined;
   const modules={M2:{status:'CALCULATED',valuePath:dataPrefix+'facts'},M3:{status:context.modern?'SELECTED_LIMITED_POLICIES':'STRUCTURAL_AND_SELECTED_POLICIES',valuePaths:[dataPrefix+'evidence',dataPrefix+'seasonal',dataPrefix+'root',dataPrefix+'support']},M4:{status:'STRUCTURE_ONLY',valuePath:context.modern?'base.innerPatterns':'innerPatterns'},M5:{status:native.m5.status,execution:context.modern?'EXECUTED_EXISTING_LIMITED_POLICY':'NOT_EXECUTED_CLOCK_SCOPE_DEPENDENCY',valuePath:'m5'},M6:{status:'NOT_IMPLEMENTED'},GONGMANG:{status:'CALCULATED',valuePath:'gongmang'},M7:{status:context.modern?(native.base.m7?'SELECTED_FEATURES_EXECUTED':'NOT_REQUESTED'):(luckRequested?'POLICY_UNRESOLVED':'NOT_REQUESTED'),valuePath:context.modern?'base.m7':null,nominalProjectionPath:context.modern?'base.projection':null,reason:!context.modern&&luckRequested?'M7_HISTORICAL_OR_FUTURE_BIRTH_CLOCK_NOT_ADOPTED':null,monthly:{status:native.monthly.status,valuePath:'monthly'}}};
   modules.M7.monthly.queryStatus=native.monthly.atMinute?.status??'NOT_REQUESTED';modules.M7.monthly.yearTableStatus=native.monthly.yearTable?.status??'NOT_REQUESTED';modules.M7.monthly.queryAlternativeCount=native.monthly.atMinute?.entries.length??0;
   const holds=[],conditionals=[];if(!context.modern)holds.push({code:'M5_ORIGINAL_CLOCK_DEPENDENCY_NOT_EXTENDED'});else native.m5.candidates.forEach((c,i)=>{if(c.status==='HOLD')holds.push({code:'M5_LIMITED_PURPOSE_HOLD',valuePath:`m5.candidates[${i}]`});});if(!context.modern&&luckRequested)holds.push({code:'M7_BIRTH_CLOCK_POLICY_UNRESOLVED'});if(m1.evidence.dateConversion.lunarMapping?.status==='NEEDS_DATA')holds.push({code:'NO_2027_API_LUNAR_DATE_MAPPING'});
   if(native.monthly.status==='POLICY_UNRESOLVED')holds.push({code:'MONTHLY_CLOCK_PROFILE_UNRESOLVED',valuePath:'monthly'});
   native.monthly.yearTable?.rows.forEach((row,i)=>{if(row.status!=='RESOLVED_UNDER_POLICY')holds.push({code:'MONTHLY_INTERVAL_'+row.status,valuePath:`monthly.yearTable.rows[${i}]`});});
   const queryStatus=native.monthly.atMinute?.status;if(queryStatus==='AMBIGUOUS')conditionals.push({code:'MONTHLY_PUBLISHED_MINUTE_ALTERNATIVES',valuePath:'monthly.atMinute'});else if(queryStatus&&queryStatus!=='RESOLVED_UNDER_POLICY')holds.push({code:'MONTHLY_QUERY_'+queryStatus,valuePath:'monthly.atMinute'});
   if(m1.chart.candidates.length>1)conditionals.push({code:'NATAL_PUBLISHED_MINUTE_ALTERNATIVES',valuePath:dataPrefix+'m1.chart'});
   if(m1.chart.clockResolution?.isAmbiguousCivilMinute)conditionals.push({code:'EXPLICIT_OFFSET_OF_AMBIGUOUS_CIVIL_TIME',valuePath:dataPrefix+'m1.chart.clockResolution'});
   const result={...common,status:'CALCULATED_UNDER_SELECTED_POLICIES',calculation:m1,candidates:existing.facts.candidates.map((c,i)=>({id:c.id,pillars:c.pillars,calculationCandidateIndex:i})),analysisData,referenceBase:'analysisData',upstreamSchemaVersion:native.schemaVersion,modules,summary:native.summary,holds,conditionals,
    timeResolution:m1.chart.clockResolution??null,executionCounts:{birthM1Calls:1,m2Derivations:1,m3Derivations:1,additionalBirthM1ForTemporalQueries:0},
    limitations:['REPRODUCIBLE_POLICY_RESULTS_NOT_PREDICTION_VALIDITY','NO_AUTOMATIC_PATTERN_EFFECTS_OR_FINAL_YONGSHEN','SERVER_DATA_RIGHTS_AUDIT_SEPARATE_FROM_CLASSICAL_SOURCE_AND_PUBLIC_RELEASE_GATES','ORIGINAL_POLICY_GATES_NOT_PROMOTED']};
   freeze(result);issued.set(result,{hash:fingerprint(result),requestHash,native,modern:context.modern});validateApiOnlyServerResult(result,{request});return result;
  },
 });
}
export function validateApiOnlyServerResult(value,{request}={}){
 const receipt=issued.get(value);check(receipt&&Object.isFrozen(value)&&receipt.hash===fingerprint(value),'ISSUED_SERVER_RESPONSE_REQUIRED');if(request!==undefined)check(receipt.requestHash===fingerprint(request),'SERVER_REQUEST_RESULT_MISMATCH');
 if(value.status==='CALCULATED_UNDER_SELECTED_POLICIES'){
  check(value.calculation?.status==='OK'&&value.candidates.length>0&&value.summary===value.analysisData.summary,'SERVER_CALCULATED_RESPONSE_CONTRACT');verifyLocalChartResult(value.calculation);
  if(receipt.modern)validateLocalProductReportResult(receipt.native);else validateLocalExtendedReportResult(receipt.native);
  for(const module of Object.values(value.modules)){for(const path of [...(module.valuePaths??[]),...(module.valuePath===undefined||module.valuePath===null?[]:[module.valuePath])])check(pathAt(value.analysisData,path)!==undefined,'SERVER_MODULE_REFERENCE');}
  const summary=value.summary;if(receipt.modern){for(const ref of summary.references)check(pathAt(value.analysisData,ref.valuePath)!==undefined,'SERVER_SUMMARY_REFERENCE');}else for(const section of summary.sections)for(const item of section.items)for(const ref of item.valueRefs)check(pathAt(value.analysisData,ref.valuePath)!==undefined,'SERVER_SUMMARY_REFERENCE');
  for(const item of [...value.holds,...value.conditionals])if(item.valuePath)check(pathAt(value.analysisData,item.valuePath)!==undefined,'SERVER_HOLD_OR_CONDITIONAL_REFERENCE');
 }else check(value.calculation===null||value.calculation.status===value.status,'SERVER_HELD_RESPONSE_CONTRACT');
 check(value.dataPack.rawCalendarDatasetIncluded===false&&value.dataPack.manifestContentSha256===SERVER_API_ONLY_ACCEPTED_PIN,'SERVER_DATA_DISCLOSURE_CONTRACT');return true;
}
export function renderApiOnlyServerReport(value,{detail='summary'}={}){
 validateApiOnlyServerResult(value);check(['summary','detailed'].includes(detail),'SERVER_REPORT_DETAIL');
 if(value.status!=='CALCULATED_UNDER_SELECTED_POLICIES')return ['명식 계산 보류: '+value.status,...value.holds.map(x=>x.code),...(value.calculation?.clock?.civilOffsetCandidates??[]).map(c=>`가능한 UTC 분 대응 ${c.utcMinute} (offset ${c.utcOffsetMinutes}분)`)].join('\n')+'\n';
 const m1=value.calculation,lines=[value.summary.title,`양력 환산 ${m1.input.gregorianDate} ${m1.input.time}`];
 if(m1.chart.recordedBirthCivilMinute)lines.push(`기록 민간시 ${m1.chart.recordedBirthCivilMinute.replace('T',' ')} · 선택한 표준KST 참조 ${m1.chart.normalizedBirthKstMinute.replace('T',' ')}`);
 if(m1.chart.clockResolution?.isAmbiguousCivilMinute)lines.push('반복된 민간시이며 명시한 offset의 조건으로 계산했습니다. 가능한 시간 대응 둘은 보존합니다.');
 for(const [i,section]of value.summary.sections.entries())lines.push('',`${i+1}. ${section.title}`,...section.items.map(item=>item.text));
 lines.push('','정책·자료 출처와 보류 사유는 상세 근거와 JSON에서 확인할 수 있습니다.');
 return lines.join('\n')+'\n'+(detail==='detailed'?'\n서버 통합 상세 근거\n'+JSON.stringify(value,null,2)+'\n':'');
}
