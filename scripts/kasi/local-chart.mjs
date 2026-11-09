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

export const STAGE_A_PROFILE_ID='kasi-api-2026-local-v1';
export const MODERN_PROFILE_ID='kasi-api-1989-2026-local-v1';
export const MODERN_CLOCK_POLICY_ID='KR_API_PUBLISHED_KST_MODERN_1988_POST_DST_V1';
export const BASELINE_MANIFEST_SHA256='8ffadb04c8460969085610162d3d5e8855af9272a8a4be1dbe10123c15f90edf';
export class LocalChartError extends Error {
  constructor(code){super(code);this.name='LocalChartError';this.code=code;}
}
const requireValue=(condition,code)=>{if(!condition)throw new LocalChartError(code);};
const profiles=new Map([[STAGE_A_PROFILE_ID,{from:2026,to:2026,phase:'A'}],[MODERN_PROFILE_ID,{from:1989,to:2026,phase:'B'}]]);
const frozen=value=>{if(value&&typeof value==='object'&&!Object.isFrozen(value)){Object.values(value).forEach(frozen);Object.freeze(value);}return value;};
const lunarKey=r=>monthKey(r.lunarYear,r.lunarMonth,r.leap);
const sourceId=row=>'KASI_OPENAPI_RESPONSE:'+row.sourceRef+':'+row.date+':'+row.termCode;

/** The manifest pin is supplied independently; this factory never reads one from the dataset. */
export function createLocalChartProfile(loaded,{profileId,expectedManifestSha256}) {
  const specification=profiles.get(profileId);
  requireValue(specification,'EXPLICIT_SUPPORTED_PROFILE_REQUIRED');
  requireValue(/^[a-f0-9]{64}$/.test(expectedManifestSha256??''),'MANIFEST_PIN_REQUIRED');
  requireValue(loaded?.manifest && fingerprint(loaded.manifest)===expectedManifestSha256,'MANIFEST_PIN_MISMATCH');
  const candidate=structuredClone(loaded.candidate), sources=structuredClone(loaded.sources);
  requireValue(fingerprint(candidate)===loaded.manifest.derived?.find(f=>f.path==='candidate.json')?.contentSha256,'CANDIDATE_CONTENT_CHANGED');
  requireValue(fingerprint(sources)===loaded.manifest.derived?.find(f=>f.path==='source-references.json')?.contentSha256,'SOURCE_CONTENT_CHANGED');
  requireValue(candidate?.schemaVersion==='kasi-api-research-v1' && candidate.status==='RESEARCH_ONLY','CANDIDATE_CONTRACT');
  const from=specification.from+'-01-01',until=(specification.to+1)+'-01-01';
  requireValue(candidate.support?.from<=from && candidate.support?.untilExclusive>=until,'DATE_DATA_COVERAGE_INCOMPLETE');
  const index=createResearchIndex(candidate.dates), receipts=new Map(), eventsByYear=new Map(), evidenceById=new Map();
  requireValue(index.from<=from && index.until>=until,'DATE_INDEX_COVERAGE_INCOMPLETE');
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
    requireValue(minute>='1988-10-09T03:00' && minute<'2027-01-01T00:00','CLOCK_POLICY_EVENT_RANGE');
    const id=sourceId(row);
    evidenceById.set(id,frozen({sourceRef:row.sourceRef,source:getSource(row,'solar'),original:structuredClone(row),interpreted:{displayedDateTime:minute,timeBasis:'KST',sourcePrecision:'MINUTE',clockPolicyId:MODERN_CLOCK_POLICY_ID,clockPolicyVersion:'1',utcOffsetMinutes:540,utcInstant:null}}));
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
  const metadata=frozen({id:profileId,version:'1',phase:specification.phase,birthRange:{fromInclusive:from,untilExclusive:until},auxiliaryEvents:{purpose:'PRIOR_DAXUE_GUARD_ONLY_NOT_BIRTH_SUPPORT',fromYear:specification.from-1,term:'DAXUE',nextYearEventsRequired:false},timeInterpretation:{id:MODERN_CLOCK_POLICY_ID,version:'1',birthCivilTime:'KOREAN_STANDARD_TIME_UTC_PLUS_09_NO_DST',auxiliaryGuard:'1988_DAXUE_AFTER_DST_END_OR_LATER',comparison:'PUBLISHED_KST_WALL_MINUTE_ONLY',originalHistoricalStatus:'PRESERVED_NOT_RESOLVED',noHostTimezoneParsing:true},guarantee:'LOCAL_PINNED_API_AND_STRUCTURAL_COVERAGE_NOT_G0',validationLevel:'PINNED_CONTENT_AND_STRUCTURAL_COVERAGE',comparisonEvidence:'SEPARATE_EXECUTION_REPORT_NOT_RUNTIME_CERTIFICATION',g0Receipt:null,g1P2Promotion:false});
  const dataset=frozen({id:'kasi-openapi-local-'+expectedManifestSha256.slice(0,16),version:'1',sourceKind:'KASI_OPENAPI_RESPONSE',candidateManifestContentSha256:expectedManifestSha256,normalizerVersion:candidate.normalizerVersion,originalObservedRange:structuredClone(candidate.support),rightsReview:'UNVERIFIED',annualTxtAuthentication:'NOT_CLAIMED'});
  const inputRow=date=>{
    const found=index.fromGregorianDate(date);
    requireValue(found.status==='OK','API_DATE_EVIDENCE_MISSING');
    getSource(found.value,'lunar');return found.value;
  };
  const calculate=request=>{
    requireValue(request && ['GREGORIAN','KOREAN_LUNAR'].includes(request.calendar),'CALENDAR_REQUIRED');
    requireValue(typeof request.time==='string' && /^(?:[01]\d|2[0-3]):[0-5]\d$/.test(request.time),'EXPLICIT_BIRTH_TIME_REQUIRED');
    const policy=request.policies;
    requireValue(policy?.clockPolicyId===MODERN_CLOCK_POLICY_ID,'EXPLICIT_CLOCK_POLICY_REQUIRED');
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
        return {status:month && lunar.lunarDay<=month.monthDays?'OUT_OF_OBSERVED_COVERAGE':'INVALID_LUNAR_DATE',profile:structuredClone(metadata),dataset:structuredClone(dataset)};
      }
      date=converted.value;
    }
    if(date<from || date>=until)return {status:'OUT_OF_PROFILE_COVERAGE',profile:structuredClone(metadata),dataset:structuredClone(dataset)};
    const row=inputRow(date), year=Number(date.slice(0,4)), context=eventsByYear.get(year);
    const chart=resolveCoverageCheckedModernKoreanCivilFourPillars(context.events,date+'T'+request.time,{timeBasis:'KOREAN_CIVIL_TIME',dayRollover:policy.dayRollover,hourStemReference:policy.hourStemReference},context.coverage);
    const actualIds=[...new Set(chart.monthBoundaryTrace.candidateContexts.flatMap(c=>c.activeSince.sourceIds).concat(chart.monthBoundaryTrace.atPublishedBoundary?.sourceIds??[]))];
    const lichun=context.events.find(e=>e.term==='LICHUN');
    const evidence={appliedJie:actualIds.map(id=>evidenceById.get(id)),yearBoundary:evidenceById.get(lichun.sourceIds[0]),dateConversion:{method:request.calendar==='KOREAN_LUNAR'?'API_OBSERVED_DATE_INDEX':'GREGORIAN_WITH_API_OBSERVED_DATE_EVIDENCE',sourceRef:row.sourceRef,source:getSource(row,'lunar'),observed:{solarDate:row.solarDate,lunarYear:row.lunarYear,lunarMonth:row.lunarMonth,lunarDay:row.lunarDay,leap:row.leap},calendarGanjiUsedAsPillars:false}};
    return {status:'OK',profile:structuredClone(metadata),dataset:structuredClone(dataset),input:{calendar:request.calendar,...(request.calendar==='KOREAN_LUNAR'?{lunarDate:structuredClone(request.lunarDate)}:{}),gregorianDate:date,time:request.time},policies:{clock:{id:MODERN_CLOCK_POLICY_ID,version:'1'},dayRollover:{id:policy.dayRollover,version:'EXISTING_ENGINE_V1'},hourStemReference:{id:policy.hourStemReference,version:'EXISTING_ENGINE_V1'},boundary:{id:'PUBLISHED_MINUTE_COMPARISON_ONLY',version:'EXISTING_ENGINE_V1'}},chart,evidence:structuredClone(evidence),limits:['PUBLISHED_MINUTE_AMBIGUITY_PRESERVED','NO_HISTORICAL_BIRTH_TIME_SUPPORT','NO_INDEPENDENT_FULL_RANGE_CERTIFICATION','NO_G0_RECEIPT','REDISTRIBUTION_REVIEW_OPEN']};
  };
  return Object.freeze({metadata,calculate,eventsForYear(year){const value=eventsByYear.get(year);requireValue(value,'YEAR_OUT_OF_PROFILE');return structuredClone(value);}});
}

export async function loadLocalChartProfile({directory,expectedManifestSha256,profileId}) {
  requireValue(typeof directory==='string' && directory.length>0,'CANDIDATE_DIRECTORY_REQUIRED');
  const loaded=await loadCandidate(directory,expectedManifestSha256);
  return createLocalChartProfile(loaded,{profileId,expectedManifestSha256});
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
