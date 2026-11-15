/** Explicit local-only API profile. No default-engine, web or G0 registration. */
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { fingerprint, SERVICES } from '../../.kasi-build/schema.js';
import { loadCandidate, createResearchIndex } from './candidate.mjs';
import { resolveCoverageCheckedModernKoreanCivilFourPillars } from '../../dist/calendar/fourPillars.js';
import { validateFullYearSolarTermCoverage } from '../../dist/calendar/solarTermCoverage.js';
import { isGregorianMinute } from '../../dist/calendar/solarTermTimeline.js';
import { DAY_ROLLOVER_POLICIES } from '../../dist/calendar/dayRollover.js';
import { HOUR_STEM_REFERENCE_POLICIES } from '../../dist/calendar/dayHourPillars.js';
import { SOLAR_TERM_CODES, SOLAR_TERM_DEFINITIONS } from '../../dist/calendar/solarTerms.js';
import { gregorianDayNumber, monthKey } from '../../dist/calendar/koreanLunisolarValidation.js';
import {resolveHistoricalStandardFourPillars} from '../../dist/calendar/historicalFourPillarsV1.js';
import {HISTORICAL_KOREAN_CLOCK_POLICY_ID,HISTORICAL_KOREAN_CLOCK_METADATA,resolveHistoricalApiEventMinute,resolveHistoricalKoreanClockMinute} from '../../dist/time/historicalKoreanClockV1.js';

export const STAGE_A_PROFILE_ID='kasi-api-2026-local-v1';
export const MODERN_PROFILE_ID='kasi-api-1989-2026-local-v1';
export const MODERN_CLOCK_POLICY_ID='KR_API_PUBLISHED_KST_MODERN_1988_POST_DST_V1';
export const HISTORICAL_PROFILE_ID='kasi-api-1962-1986-standard-local-v1';
export const EXTENDED_SOLAR_PROFILE_ID='kasi-api-1989-2027-solar-local-v1';
export const EXTENDED_MODERN_CLOCK_POLICY_ID='KR_API_PUBLISHED_KST_MODERN_1989_2027_NO_DST_V2';
export const ANNUAL_SOLAR_ACCEPTED_SHA256='77da197d925e5a8907990960530a85454cf87a829745ee9b012c6c328c891a0b';
export const ACCEPTED_BOUNDARY_SUPPLEMENT_SHA256='f6a0e6dd2b169b4e758f8d1326942556c59f569af714adcb36e73824c6ef02b7';
export const BASELINE_MANIFEST_SHA256='8ffadb04c8460969085610162d3d5e8855af9272a8a4be1dbe10123c15f90edf';
export class LocalChartError extends Error {
  constructor(code){super(code);this.name='LocalChartError';this.code=code;}
}
const requireValue=(condition,code)=>{if(!condition)throw new LocalChartError(code);};
const profiles=new Map([[STAGE_A_PROFILE_ID,{from:2026,to:2026,phase:'A'}],[MODERN_PROFILE_ID,{from:1989,to:2026,phase:'B'}]]);
profiles.set(HISTORICAL_PROFILE_ID,{from:1962,to:1986,phase:'SPRINT4_HISTORICAL_STABLE',historical:true});
profiles.set(EXTENDED_SOLAR_PROFILE_ID,{from:1989,to:2027,phase:'SPRINT4_EXISTING_SOLAR_EXTENSION',solarExtension:true});
const frozen=value=>{if(value&&typeof value==='object'&&!Object.isFrozen(value)){Object.values(value).forEach(frozen);Object.freeze(value);}return value;};
export const EXTENDED_MODERN_CLOCK_METADATA=frozen({id:EXTENDED_MODERN_CLOCK_POLICY_ID,version:'2',birthFromInclusive:'1989-01-01T00:00',birthUntilExclusive:'2028-01-01T00:00',utcOffsetMinutes:540,daylightSavingMinutes:0,utcInstant:null,
  assumption:'EXPLICIT_CONTINUATION_OF_STANDARD_UTC_PLUS_09_NO_DST_NOT_FUTURE_LEGISLATION_CERTIFICATION',
  sources:[{id:'KR_STANDARD_TIME_ACT_10640_2011_PRIMARY_CACHED_TEXT',url:'https://www.law.go.kr/lsInfoP.do?lsiSeq=113175&viewCls=lsRvsDocInfoR',level:'OFFICIAL_SEARCH_TEXT_AND_LIVE_TITLE_NOT_LIVE_STATUTE_BODY_VERIFICATION'},
    {id:'KASI_KST_UTC9_20051208',url:'https://www.kasi.re.kr/kor/publication/post/newsMaterial/2151',level:'DIRECT_OFFICIAL_EXPLANATION_OF_KST_UTC_PLUS_09'},
    {id:'IANA_TZDB_2025B_ASIA_SEOUL',url:'https://data.iana.org/time-zones/tzdb-2025b/asia',level:'PINNED_TECHNICAL_COMPARISON_NOT_LEGAL_AUTHORITY'},
    {id:'KASI_API_KST_FIELD_NAME',url:'https://www.data.go.kr/data/15012690/openapi.do',level:'OFFICIAL_KST_FIELD_LABEL_PLUS_SEPARATELY_VERIFIED_CAPTURED_RAW_NOT_FUTURE_CLOCK_CERTIFICATION'}]});
const lunarKey=r=>monthKey(r.lunarYear,r.lunarMonth,r.leap);
const sourceId=row=>'KASI_OPENAPI_RESPONSE:'+row.sourceRef+':'+row.date+':'+row.termCode;
// In-process execution continuity only; serialized hashes are not source authentication.
// Weak keys retain neither birth inputs nor results beyond the caller's object lifetime.
const issuedResults=new WeakMap();
const issuedProfiles=new WeakMap(), issuedEventContexts=new WeakSet();
/** Read-only, already pinned modern events. No new collection or year promotion. */
export function getLocalChartEventContext(profile) {
  const entry=issuedProfiles.get(profile);
  requireValue(entry,'LOCAL_CHART_CONTEXT_PROFILE_REQUIRED');
  if(!entry.value){entry.value=entry.build();issuedEventContexts.add(entry.value);}
  return entry.value;
}
export function verifyLocalChartEventContext(context,{calculation}={}) {
  requireValue(issuedEventContexts.has(context) && Object.isFrozen(context),'LOCAL_CHART_EVENT_CONTEXT_REQUIRED');
  if(calculation){
    requireValue(calculation.profile?.id===context.profile.id && calculation.dataset?.candidateManifestContentSha256===context.dataset.candidateManifestContentSha256,'LOCAL_CHART_CONTEXT_MISMATCH');
    if(context.dataset.annualSolarExtension)requireValue(fingerprint(calculation.dataset)===fingerprint(context.dataset),'LOCAL_CHART_EXTENSION_CONTEXT_MISMATCH');
  }
  return context;
}
export function verifyLocalChartResult(result,{request}={}) {
  const receipt=issuedResults.get(result);
  requireValue(receipt && receipt.contentSha256===fingerprint(result),'LOCAL_CHART_EXECUTION_CHANGED_OR_UNISSUED');
  if(request!==undefined)requireValue(receipt.requestSha256===fingerprint(request),'LOCAL_CHART_REQUEST_MISMATCH');
  return result;
}

/** The manifest pin is supplied independently; this factory never reads one from the dataset. */
export function createLocalChartProfile(loaded,{profileId,expectedManifestSha256,annualSolarExtension}) {
  const specification=profiles.get(profileId);
  requireValue(specification,'EXPLICIT_SUPPORTED_PROFILE_REQUIRED');
  requireValue(/^[a-f0-9]{64}$/.test(expectedManifestSha256??''),'MANIFEST_PIN_REQUIRED');
  requireValue(loaded?.manifest && fingerprint(loaded.manifest)===expectedManifestSha256,'MANIFEST_PIN_MISMATCH');
  const candidate=structuredClone(loaded.candidate), sources=structuredClone(loaded.sources);
  requireValue(fingerprint(candidate)===loaded.manifest.derived?.find(f=>f.path==='candidate.json')?.contentSha256,'CANDIDATE_CONTENT_CHANGED');
  requireValue(fingerprint(sources)===loaded.manifest.derived?.find(f=>f.path==='source-references.json')?.contentSha256,'SOURCE_CONTENT_CHANGED');
  const clockId=specification.historical?HISTORICAL_KOREAN_CLOCK_POLICY_ID:specification.solarExtension?EXTENDED_MODERN_CLOCK_POLICY_ID:MODERN_CLOCK_POLICY_ID;
  if(specification.solarExtension){
    requireValue(annualSolarExtension?.baseManifestSha256===expectedManifestSha256&&annualSolarExtension.content?.baseManifestSha256===expectedManifestSha256&&annualSolarExtension.boundarySupplementSha256===ACCEPTED_BOUNDARY_SUPPLEMENT_SHA256&&annualSolarExtension.policy?.id===annualSolarExtension.content.policy.id&&annualSolarExtension.version===annualSolarExtension.content.version&&annualSolarExtension.contentSha256===ANNUAL_SOLAR_ACCEPTED_SHA256&&fingerprint(annualSolarExtension.content)===ANNUAL_SOLAR_ACCEPTED_SHA256,'ACCEPTED_ANNUAL_SOLAR_PIN_REQUIRED');
    for(const source of annualSolarExtension.content.sources){const existing=sources.find(s=>s.id===source.id);requireValue(!existing||fingerprint(existing)===fingerprint(source),'ANNUAL_SOLAR_SOURCE_CONFLICT');if(!existing)sources.push(structuredClone(source));}
    for(const row of annualSolarExtension.content.rows){requireValue(!candidate.events.some(e=>e.date===row.date&&e.termCode===row.termCode),'ANNUAL_SOLAR_EVENT_CONFLICT');candidate.events.push({...structuredClone(row),timeStatus:'PUBLISHED_WALL_MINUTE_ONLY',computationalCivilDateTime:row.displayedDateTime,utcInstant:null});}
  }else requireValue(annualSolarExtension===undefined,'UNSELECTED_ANNUAL_SOLAR_EXTENSION');
  requireValue(candidate?.schemaVersion==='kasi-api-research-v1' && candidate.status==='RESEARCH_ONLY','CANDIDATE_CONTRACT');
  const from=specification.from+'-01-01',until=(specification.to+1)+'-01-01';
  const dateEvidenceUntil=specification.solarExtension?'2027-01-01':until;
  requireValue(candidate.support?.from<=from && candidate.support?.untilExclusive>=dateEvidenceUntil,'DATE_DATA_COVERAGE_INCOMPLETE');
  const index=createResearchIndex(candidate.dates), receipts=new Map(), eventsByYear=new Map(), evidenceById=new Map();
  requireValue(index.from<=from && index.until>=dateEvidenceUntil,'DATE_INDEX_COVERAGE_INCOMPLETE');
  for(const record of sources) {
    const {id,...receipt}=record, service=SERVICES[receipt.query?.service];
    requireValue(service && id===fingerprint(receipt) && !receipts.has(id),'SOURCE_ID_CHANGED_OR_DUPLICATE');
    requireValue(receipt.evidenceSurface==='KASI_OPENAPI_RESPONSE' && receipt.responseHashScope==='UTF8_ENTITY_AFTER_HTTP_DECOMPRESSION' && receipt.serviceId===service.id && receipt.operation===service.operation && /^[a-f0-9]{64}$/.test(receipt.responseSha256),'SOURCE_RECEIPT_CONTRACT');
    receipts.set(id,frozen(record));
  }
  const getSource=(row,service)=>{
    const receipt=receipts.get(row.sourceRef), query=receipt?.query, date=service==='solar'?row.date:row.solarDate;
    requireValue(query?.service===service && query.year===Number(date.slice(0,4)),'ROW_SOURCE_SERVICE_OR_YEAR');
    if(query.month!==undefined)requireValue(query.month===Number(date.slice(5,7)),'ROW_SOURCE_MONTH');
    if(query.day!==undefined)requireValue(query.day===Number(date.slice(8,10)),'ROW_SOURCE_DAY');
    return receipt;
  };
  const adapt=row=>{
    getSource(row,'solar');
    requireValue(row.timeBasis==='API_KST_AS_PUBLISHED' && row.historicalCivilTime==='NOT_RESOLVED','ORIGINAL_TIME_CONTRACT');
    requireValue(row.timeStatus==='PUBLISHED_WALL_MINUTE_ONLY' && row.precision==='MINUTE' && row.utcInstant===null && !row.timeNotation && SOLAR_TERM_CODES.includes(row.termCode),'POLICY_UNRESOLVED_SOLAR_EVENT');
    requireValue(SOLAR_TERM_DEFINITIONS[row.termCode].koreanName===row.term,'SOLAR_TERM_LABEL_MISMATCH');
    const minute=row.date+'T'+row.time;
    requireValue(isGregorianMinute(minute) && minute===row.computationalCivilDateTime,'SOLAR_MINUTE_CONTRACT');
    // The 1988 guard is after DST ended. No interpretation of earlier historical rows.
    if(specification.historical)resolveHistoricalApiEventMinute(minute,{policyId:clockId,termCode:row.termCode,role:minute<'1962-01-01T00:00'?'PRIOR_DAXUE_GUARD':'ANNUAL_EVENT'});
    else requireValue(minute>='1988-10-09T03:00' && minute<(specification.solarExtension?'2028-01-01T00:00':'2027-01-01T00:00'),'CLOCK_POLICY_EVENT_RANGE');
    const id=sourceId(row);
    evidenceById.set(id,frozen({sourceRef:row.sourceRef,source:getSource(row,'solar'),original:structuredClone(row),interpreted:{displayedDateTime:minute,timeBasis:'KST',sourcePrecision:'MINUTE',clockPolicyId:clockId,clockPolicyVersion:specification.solarExtension?'2':'1',utcOffsetMinutes:540,utcInstant:null}}));
    return frozen({term:row.termCode,displayedDateTime:minute,timeBasis:'KST',sourcePrecision:'MINUTE',sourceIds:[id]});
  };
  for(let year=specification.from;year<=specification.to;year++) {
    const guard=candidate.events.filter(r=>r.termCode==='DAXUE' && r.date.startsWith((year-1)+'-'));
    const annual=candidate.events.filter(r=>r.date.startsWith(year+'-'));
    requireValue(guard.length===1,'REQUIRED_API_DAXUE_GUARD_MISSING_OR_DUPLICATE');
    requireValue(guard[0].date.startsWith((year-1)+'-12-'),'DAXUE_GUARD_MUST_BE_DECEMBER');
    const events=[...guard,...annual].map(adapt).sort((a,b)=>a.displayedDateTime.localeCompare(b.displayedDateTime));
    const coverage=frozen({schemaVersion:'m1-solar-term-coverage-v1',requirementProfile:'FULL_24_TERM_YEAR',timeBasis:'KST',sourcePrecision:'MINUTE',supportedFromInclusive:year+'-01-01T00:00',supportedUntilExclusive:(year+1)+'-01-01T00:00',requiredYears:[year],requiredPriorBoundary:{year:year-1,term:'DAXUE'}});
    validateFullYearSolarTermCoverage(events,coverage,year+'-01-01T00:00');
    eventsByYear.set(year,frozen({events,coverage}));
  }
  const months=new Map(candidate.months.map(r=>[lunarKey(r),r]));
  const metadataValue={id:profileId,version:'1',phase:specification.phase,birthRange:{fromInclusive:from,untilExclusive:until},auxiliaryEvents:{purpose:'PRIOR_DAXUE_GUARD_ONLY_NOT_BIRTH_SUPPORT',fromYear:specification.from-1,term:'DAXUE',nextYearEventsRequired:false},timeInterpretation:{id:MODERN_CLOCK_POLICY_ID,version:'1',birthCivilTime:'KOREAN_STANDARD_TIME_UTC_PLUS_09_NO_DST',auxiliaryGuard:'1988_DAXUE_AFTER_DST_END_OR_LATER',comparison:'PUBLISHED_KST_WALL_MINUTE_ONLY',originalHistoricalStatus:'PRESERVED_NOT_RESOLVED',noHostTimezoneParsing:true},guarantee:'LOCAL_PINNED_API_AND_STRUCTURAL_COVERAGE_NOT_G0',validationLevel:'PINNED_CONTENT_AND_STRUCTURAL_COVERAGE',comparisonEvidence:'SEPARATE_EXECUTION_REPORT_NOT_RUNTIME_CERTIFICATION',g0Receipt:null,g1P2Promotion:false};
  if(specification.historical)metadataValue.timeInterpretation={id:clockId,version:'1',birthCivilTime:'KOREAN_STANDARD_TIME_UTC_PLUS_09_NO_DST',auxiliaryGuard:'1961_DAXUE_AFTER_UTC_PLUS_09_REFORM',comparison:'PUBLISHED_KST_WALL_MINUTE_ONLY',originalHistoricalStatus:'PRESERVED_SOURCE_ROWS_BOUNDED_INTERPRETATION_SELECTED',noHostTimezoneParsing:true,sources:HISTORICAL_KOREAN_CLOCK_METADATA.sources};
  if(specification.solarExtension){metadataValue.timeInterpretation={...metadataValue.timeInterpretation,id:clockId,version:'2',futureCivilClock:EXTENDED_MODERN_CLOCK_METADATA.assumption,sources:EXTENDED_MODERN_CLOCK_METADATA.sources};metadataValue.calendarSupport={GREGORIAN:{fromInclusive:from,untilExclusive:until},KOREAN_LUNAR:{convertedUntilExclusive:'2027-01-01',missing2027:'NEEDS_DATA_NO_API_DATE_MAPPING'}};}
  const metadata=frozen(metadataValue);
  const dataset=frozen({id:'kasi-openapi-local-'+expectedManifestSha256.slice(0,16),version:'1',sourceKind:'KASI_OPENAPI_RESPONSE',candidateManifestContentSha256:expectedManifestSha256,normalizerVersion:candidate.normalizerVersion,originalObservedRange:structuredClone(candidate.support),rightsReview:'UNVERIFIED',annualTxtAuthentication:'NOT_CLAIMED',...(specification.solarExtension?{annualSolarExtension:{policyId:annualSolarExtension.policy.id,version:annualSolarExtension.version,contentSha256:ANNUAL_SOLAR_ACCEPTED_SHA256,boundarySupplementSha256:ACCEPTED_BOUNDARY_SUPPLEMENT_SHA256,scope:'SOLAR_ONLY_NOT_LUNAR_MAPPING'}}:{})});
  const inputRow=date=>{
    const found=index.fromGregorianDate(date);
    requireValue(found.status==='OK','API_DATE_EVIDENCE_MISSING');
    getSource(found.value,'lunar');return found.value;
  };
  const calculate=request=>{
    requireValue(request && ['GREGORIAN','KOREAN_LUNAR'].includes(request.calendar),'CALENDAR_REQUIRED');
    requireValue(typeof request.time==='string' && /^(?:[01]\d|2[0-3]):[0-5]\d$/.test(request.time),'EXPLICIT_BIRTH_TIME_REQUIRED');
    const policy=request.policies;
    requireValue(policy?.clockPolicyId===clockId,'EXPLICIT_CLOCK_POLICY_REQUIRED');
    requireValue(DAY_ROLLOVER_POLICIES.includes(policy.dayRollover),'EXPLICIT_DAY_ROLLOVER_REQUIRED');
    requireValue(HOUR_STEM_REFERENCE_POLICIES.includes(policy.hourStemReference),'EXPLICIT_HOUR_STEM_REFERENCE_REQUIRED');
    let date;
    if(request.calendar==='GREGORIAN') {
      requireValue(typeof request.date==='string','GREGORIAN_DATE_REQUIRED');
      gregorianDayNumber(request.date);date=request.date;
    } else {
      const lunar=request.lunarDate;
      const converted=index.fromLunarDate(lunar);
      if(converted.status!=='OK') {
        const month=months.get(lunarKey(lunar));
        if(specification.solarExtension){const status=classifyExtendedLunarMiss(lunar,{knownMonthDays:month?.monthDays,latestObserved:candidate.dates.at(-1)});
          if(status==='NEEDS_DATA')return {status,reason:'API_LUNAR_DATE_MAPPING_2027_NOT_AVAILABLE',missingData:[{year:2027,feature:'SOLAR_LUNAR_DATE_MAPPING',source:'KASI_15012679_GET_LUN_CAL_INFO',approvalRequired:'NEW_API_COLLECTION_NOT_AUTHORIZED_IN_SPRINT4'}],profile:structuredClone(metadata),dataset:structuredClone(dataset)};
          return {status,profile:structuredClone(metadata),dataset:structuredClone(dataset)};
        }
        return {status:month && lunar.lunarDay<=month.monthDays?'OUT_OF_OBSERVED_COVERAGE':'INVALID_LUNAR_DATE',profile:structuredClone(metadata),dataset:structuredClone(dataset)};
      }
      date=converted.value;
    }
    if(specification.historical&&(date<from||date>=until)){
      const clock=resolveHistoricalKoreanClockMinute(date+'T'+request.time,{policyId:clockId});
      if(clock.status!=='OUTSIDE_POLICY_SCOPE')return {status:clock.status,reason:clock.reason,clock,profile:structuredClone(metadata),dataset:structuredClone(dataset)};
    }
    if(date<from || date>=until)return {status:'OUT_OF_PROFILE_COVERAGE',profile:structuredClone(metadata),dataset:structuredClone(dataset)};
    const arithmeticDate=specification.solarExtension&&date>='2027-01-01';
    const row=arithmeticDate?null:inputRow(date), year=Number(date.slice(0,4)), context=eventsByYear.get(year);
    const chart=specification.historical?resolveHistoricalStandardFourPillars(context.events,date+'T'+request.time,policy,context.coverage):resolveCoverageCheckedModernKoreanCivilFourPillars(context.events,date+'T'+request.time,{timeBasis:'KOREAN_CIVIL_TIME',dayRollover:policy.dayRollover,hourStemReference:policy.hourStemReference},context.coverage);
    const actualIds=[...new Set(chart.monthBoundaryTrace.candidateContexts.flatMap(c=>c.activeSince.sourceIds).concat(chart.monthBoundaryTrace.atPublishedBoundary?.sourceIds??[]))];
    const lichun=context.events.find(e=>e.term==='LICHUN');
    const dateConversion=arithmeticDate?{method:'GREGORIAN_ARITHMETIC_WITHOUT_LUNAR_MAPPING',sourceRef:'PROJECT-GREGORIAN-DAY-ARITHMETIC-V1',source:{id:'PROJECT-GREGORIAN-DAY-ARITHMETIC-V1',kind:'PROJECT_CALENDAR_IMPLEMENTATION',implementationRef:'src/calendar/dayPillar.ts'},computed:{solarDate:date},lunarMapping:{status:'NEEDS_DATA',reason:'NO_2027_API_DATE_INDEX'},calendarGanjiUsedAsPillars:false}:{method:request.calendar==='KOREAN_LUNAR'?'API_OBSERVED_DATE_INDEX':'GREGORIAN_WITH_API_OBSERVED_DATE_EVIDENCE',sourceRef:row.sourceRef,source:getSource(row,'lunar'),observed:{solarDate:row.solarDate,lunarYear:row.lunarYear,lunarMonth:row.lunarMonth,lunarDay:row.lunarDay,leap:row.leap},calendarGanjiUsedAsPillars:false};
    const evidence={appliedJie:actualIds.map(id=>evidenceById.get(id)),yearBoundary:evidenceById.get(lichun.sourceIds[0]),dateConversion};
    const result={status:'OK',profile:structuredClone(metadata),dataset:structuredClone(dataset),input:{calendar:request.calendar,...(request.calendar==='KOREAN_LUNAR'?{lunarDate:structuredClone(request.lunarDate)}:{}),gregorianDate:date,time:request.time},policies:{clock:{id:clockId,version:specification.solarExtension?'2':'1'},dayRollover:{id:policy.dayRollover,version:'EXISTING_ENGINE_V1'},hourStemReference:{id:policy.hourStemReference,version:'EXISTING_ENGINE_V1'},boundary:{id:'PUBLISHED_MINUTE_COMPARISON_ONLY',version:'EXISTING_ENGINE_V1'}},chart,evidence:structuredClone(evidence),limits:specification.historical?['PUBLISHED_MINUTE_AMBIGUITY_PRESERVED','HISTORICAL_1962_1986_ONLY_NO_DST_REFORM_FOLD_OR_GAP_PROMOTION','NO_INDEPENDENT_FULL_RANGE_CERTIFICATION','NO_G0_RECEIPT','REDISTRIBUTION_REVIEW_OPEN']:['PUBLISHED_MINUTE_AMBIGUITY_PRESERVED','NO_HISTORICAL_BIRTH_TIME_SUPPORT','NO_INDEPENDENT_FULL_RANGE_CERTIFICATION','NO_G0_RECEIPT','REDISTRIBUTION_REVIEW_OPEN',...(specification.solarExtension?['NO_2027_LUNAR_MAPPING','NO_2028_BIRTH_OR_BOUNDARY_EXTRAPOLATION']:[])]};
    issuedResults.set(result,{contentSha256:fingerprint(result),requestSha256:fingerprint(request)});
    return result;
  };
  const profile=Object.freeze({metadata,calculate,eventsForYear(year){const value=eventsByYear.get(year);requireValue(value,'YEAR_OUT_OF_PROFILE');return structuredClone(value);}});
  issuedProfiles.set(profile,{build(){
    const events=new Map();for(const value of eventsByYear.values())for(const event of value.events)events.set(event.sourceIds[0],event);
    return frozen({schemaVersion:'kasi-local-issued-event-context-v1',profile:metadata,dataset,
      events:[...events.values()].sort((a,b)=>a.displayedDateTime.localeCompare(b.displayedDateTime)),
      evidence:[...evidenceById.entries()].map(([id,value])=>({id,...value})),
      scope:specification.historical||specification.solarExtension?'EXPLICIT_BOUNDED_STANDARD_CLOCK_PROFILE_AND_PINNED_SOLAR_CONTEXT':'EXISTING_MODERN_PROFILE_EVENTS_AND_PRIOR_DAXUE_ONLY_NOT_NEW_BIRTH_SUPPORT'});
  }});
  return profile;
}

export async function loadLocalChartProfile({directory,expectedManifestSha256,profileId}) {
  requireValue(typeof directory==='string' && directory.length>0,'CANDIDATE_DIRECTORY_REQUIRED');
  const loaded=await loadCandidate(directory,expectedManifestSha256);
  return createLocalChartProfile(loaded,{profileId,expectedManifestSha256});
}

/** Explicit date provenance: computed Gregorian input is never labelled an API lunar observation. */
export function localCalendarDateEvidenceId(calculation){
  const e=calculation.evidence.dateConversion;
  return e.method==='GREGORIAN_ARITHMETIC_WITHOUT_LUNAR_MAPPING'?'PROJECT_GREGORIAN_DATE:'+e.sourceRef+':'+e.computed.solarDate:'KASI_OPENAPI_RESPONSE_DATE:'+e.sourceRef+':'+e.observed.solarDate;
}

/** Missing observed rows do not make an already disproved lunar date valid. */
export function classifyExtendedLunarMiss(lunar,{knownMonthDays,latestObserved}={}){
  requireValue(lunar&&Number.isInteger(lunar.lunarYear)&&lunar.lunarYear>0&&Number.isInteger(lunar.lunarMonth)&&lunar.lunarMonth>=1&&lunar.lunarMonth<=12&&Number.isInteger(lunar.lunarDay)&&lunar.lunarDay>=1&&lunar.lunarDay<=30&&typeof lunar.leap==='boolean','LUNAR_DATE_SHAPE');
  requireValue(latestObserved&&Number.isInteger(latestObserved.lunarYear)&&Number.isInteger(latestObserved.lunarMonth)&&Number.isInteger(latestObserved.lunarDay)&&typeof latestObserved.leap==='boolean','LATEST_OBSERVED_LUNAR_ROW_REQUIRED');
  requireValue(knownMonthDays===undefined||knownMonthDays===29||knownMonthDays===30,'OBSERVED_LUNAR_MONTH_LENGTH_REQUIRED');
  if(knownMonthDays!==undefined&&lunar.lunarDay>knownMonthDays)return 'INVALID_LUNAR_DATE';
  if(lunar.lunarYear>2027)return 'OUT_OF_PROFILE_COVERAGE';
  const order=r=>r.lunarYear*24+(r.lunarMonth-1)*2+(r.leap?1:0),after=order(lunar)>order(latestObserved)||(order(lunar)===order(latestObserved)&&lunar.lunarDay>latestObserved.lunarDay);
  return lunar.lunarYear>=2026&&lunar.lunarYear<=2027&&after?'NEEDS_DATA':'INVALID_LUNAR_DATE';
}

export function parseLocalChartArgs(args) {
  requireValue(args.length>0 && args.length%2===0,'EXPLICIT_ARGUMENTS_REQUIRED');
  const options={}, names=['profile','candidate','manifest-sha','calendar','date','lunar-year','lunar-month','lunar-day','leap','time','clock-policy','day-rollover','hour-stem-reference'];
  for(let i=0;i<args.length;i+=2) {const name=args[i]?.slice(2);requireValue(args[i]?.startsWith('--') && names.includes(name) && !Object.hasOwn(options,name) && typeof args[i+1]==='string','ARGUMENTS');options[name]=args[i+1];}
  for(const name of ['profile','candidate','manifest-sha','calendar','time','clock-policy','day-rollover','hour-stem-reference']) requireValue(options[name]!==undefined,'MISSING_EXPLICIT_ARGUMENT');
  const request={calendar:options.calendar,time:options.time,policies:{clockPolicyId:options['clock-policy'],dayRollover:options['day-rollover'],hourStemReference:options['hour-stem-reference']}};
  if(options.calendar==='GREGORIAN') {requireValue(options.date!==undefined && !['lunar-year','lunar-month','lunar-day','leap'].some(k=>Object.hasOwn(options,k)),'GREGORIAN_ARGUMENTS');request.date=options.date;}
  else {requireValue(options.calendar==='KOREAN_LUNAR' && options.date===undefined && ['lunar-year','lunar-month','lunar-day','leap'].every(k=>Object.hasOwn(options,k)) && ['true','false'].includes(options.leap),'LUNAR_ARGUMENTS');for(const key of ['lunar-year','lunar-month','lunar-day'])requireValue(/^\d+$/.test(options[key]),'LUNAR_INTEGER');request.lunarDate={lunarYear:Number(options['lunar-year']),lunarMonth:Number(options['lunar-month']),lunarDay:Number(options['lunar-day']),leap:options.leap==='true'};}
  return {directory:options.candidate,expectedManifestSha256:options['manifest-sha'],profileId:options.profile,request};
}
if(process.argv[1] && import.meta.url===pathToFileURL(resolve(process.argv[1])).href) {
  try {const options=parseLocalChartArgs(process.argv.slice(2)), profile=await loadLocalChartProfile(options), result=profile.calculate(options.request);process.stdout.write(JSON.stringify(result,null,2)+'\n');if(result.status!=='OK')process.exitCode=2;}
  catch(error){process.stdout.write(JSON.stringify({status:'REJECTED',code:error instanceof LocalChartError?error.code:'DATA_OR_INPUT_REJECTED'})+'\n');process.exitCode=1;}
}
