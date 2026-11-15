/** Pure whitelist, raw lineage and normalization checks. No collection or transport. */
import {fingerprint,sha,parsePage,normalizeSolar,normalizeLunar,validateSolar,validateLunar} from '../../.kasi-build/schema.js';
import {SOLAR_TERM_DEFINITIONS} from '../../dist/calendar/solarTerms.js';
import {createResearchIndex} from '../kasi/candidate.mjs';
import {SERVER_API_ONLY_CALENDAR_SCHEMA,SERVER_API_ONLY_ANNUAL_PIN,SERVER_API_ONLY_BASE_PIN,SERVER_API_ONLY_BOUNDARY_PIN} from './constants.mjs';

export class ServerApiOnlyDataError extends Error{constructor(code){super(code);this.name='ServerApiOnlyDataError';this.code=code;}}
export const check=(condition,code)=>{if(!condition)throw new ServerApiOnlyDataError(code);};
export const isSha=value=>typeof value==='string'&&/^[a-f0-9]{64}$/.test(value);
export const freeze=value=>{if(value&&typeof value==='object'&&!Object.isFrozen(value)){Object.values(value).forEach(freeze);Object.freeze(value);}return value;};
export function dense(value,code){check(Array.isArray(value)&&Object.keys(value).length===value.length&&Array.from({length:value.length},(_,i)=>Object.hasOwn(value,i)).every(Boolean),code);return value;}
export function keys(value,names,code){check(value&&typeof value==='object'&&!Array.isArray(value)&&Object.keys(value).length===names.length&&Object.keys(value).every(k=>names.includes(k)),code);}
const definitions=new Map(Object.values(SOLAR_TERM_DEFINITIONS).map(r=>[r.koreanName,r]));
const receiptKeys=['evidenceSurface','responseHashScope','query','requestedAt','serviceId','operation','responseSha256','schema'];
const schemaFields={solar:['dateKind','dateName','isHoliday','kst','locdate','seq','sunLongitude'],lunar:['lunDay','lunIljin','lunLeapmonth','lunMonth','lunNday','lunSecha','lunWolgeon','lunYear','solDay','solJd','solLeapyear','solMonth','solWeek','solYear']};
const keyFor=row=>row.kind==='lunar'?'lunar:'+row.solarDate:'solar:'+row.date+':'+row.term;
export function projectSolarEvent(row){
  const definition=definitions.get(row.term);check(definition,'API_ONLY_SOLAR_TERM');
  const held=row.time==='24:00';
  return {...row,termCode:definition.code,expectedLongitude:definition.solarLongitudeDegrees,expectedLongitudeEvidence:'DERIVED_FROM_TERM_RULE_NOT_API',timePolicyVersion:'preserve-api-published-minute-v1',timeStatus:held?'TIME_NOTATION_REVIEW_REQUIRED':row.time===null?'DAY_ONLY':'PUBLISHED_WALL_MINUTE_ONLY',computationalCivilDateTime:held||row.time===null?null:row.date+'T'+row.time,utcInstant:null};
}

/** Uses the existing API parser/normalizers, but accepts only these two known operations. */
export function normalizeApiOnlyResponses(records,rawDocuments){
  dense(records,'API_ONLY_SOURCE_ARRAY');dense(rawDocuments,'API_ONLY_RAW_ARRAY');check(records.length>0&&records.length===rawDocuments.length,'API_ONLY_SOURCE_RAW_CARDINALITY');
  const raw=new Map();
  for(const document of rawDocuments){keys(document,['sourceRef','body'],'API_ONLY_RAW_FIELDS');check(isSha(document.sourceRef)&&typeof document.body==='string'&&!raw.has(document.sourceRef),'API_ONLY_RAW_SOURCE_DUPLICATE');check(!/\b(?:servicekey|authorization|api[_-]?key)\b|https?:\/\/[^\s<]*[?&]/i.test(document.body),'API_ONLY_UNEXPECTED_AUTH_OR_REQUEST_TEXT');raw.set(document.sourceRef,document.body);}
  const sourceIds=new Set(),rowKeys=new Set(),dates=[],solar=[],sources=[];
  for(const source of records){
    keys(source,['id',...receiptKeys],'API_ONLY_SOURCE_FIELDS');const {id,...receipt}=source;keys(receipt,receiptKeys,'API_ONLY_RECEIPT_FIELDS');
    check(isSha(id)&&fingerprint(receipt)===id&&!sourceIds.has(id),'API_ONLY_RECEIPT_ID');sourceIds.add(id);
    const q=receipt.query;check(q&&typeof q==='object'&&!Array.isArray(q),'API_ONLY_QUERY');
    const lunar=q.service==='lunar';check(lunar||q.service==='solar','API_ONLY_SERVICE_WHITELIST');
    keys(q,lunar?['service','year','page','format','month']:['service','year','page','format'],'API_ONLY_QUERY_FIELDS');
    check(Number.isInteger(q.year)&&q.year>=1950&&q.year<=(lunar?2026:2027)&&q.page===1&&q.format==='xml'&&(!lunar||(Number.isInteger(q.month)&&q.month>=1&&q.month<=12)),'API_ONLY_QUERY_SCOPE');
    check(receipt.evidenceSurface==='KASI_OPENAPI_RESPONSE'&&receipt.responseHashScope==='UTF8_ENTITY_AFTER_HTTP_DECOMPRESSION'&&receipt.serviceId===(lunar?'15012679':'15012690')&&receipt.operation===(lunar?'getLunCalInfo':'get24DivisionsInfo'),'API_ONLY_OPERATION_WHITELIST');
    check(typeof receipt.requestedAt==='string'&&/^\d{4}-\d\d-\d\dT.*Z$/.test(receipt.requestedAt)&&Number.isFinite(Date.parse(receipt.requestedAt))&&isSha(receipt.responseSha256),'API_ONLY_RECEIPT_METADATA');
    const body=raw.get(id);check(typeof body==='string'&&sha(body)===receipt.responseSha256,'API_ONLY_RAW_SHA');
    const page=parsePage(body);check(page.schema.format==='xml'&&fingerprint(page.schema)===fingerprint(receipt.schema)&&page.page===q.page&&page.total===page.items.length&&page.items.length>0,'API_ONLY_RAW_SCHEMA_OR_PAGE');
    check(fingerprint(page.schema.headerFields)===fingerprint(['resultCode','resultMsg'])&&fingerprint(page.schema.bodyFields)===fingerprint(['items','numOfRows','pageNo','totalCount'])&&page.schema.itemFields.every(field=>schemaFields[q.service].includes(field)),'API_ONLY_UNEXPECTED_RESPONSE_FIELDS');
    const normalized=page.items.map(item=>lunar?normalizeLunar(item,q.year,q.month):normalizeSolar(item,q.year));
    if(lunar)validateLunar(normalized,q.year,q.month);else validateSolar(normalized,q.year);
    const rowRefs=normalized.map((row,index)=>{const key=keyFor(row);check(!rowKeys.has(key),'API_ONLY_DUPLICATE_NORMALIZED_ROW');rowKeys.add(key);(lunar?dates:solar).push({...row,sourceRef:id});return {apiItemOrdinal:index+1,recordKey:key,normalizedContentSha256:fingerprint(row)};});
    sources.push({id,provider:{name:'한국천문연구원',agencyCode:'B090041'},catalogUrl:'https://www.data.go.kr/data/'+receipt.serviceId+'/openapi.do',receipt:structuredClone(receipt),resultCode:'00',rowRefs});
  }
  check(sourceIds.size===raw.size,'API_ONLY_UNREFERENCED_RAW');dates.sort((a,b)=>a.solarDate.localeCompare(b.solarDate));solar.sort((a,b)=>a.date.localeCompare(b.date));sources.sort((a,b)=>a.id.localeCompare(b.id));
  const index=createResearchIndex(dates),groups=new Map();
  for(const row of dates){const key=row.lunarYear+':'+row.lunarMonth+':'+row.leap,prior=groups.get(key);check(!prior||prior.monthDays===row.monthDays,'API_ONLY_LUNAR_MONTH_LENGTH_CHANGED');if(!prior)groups.set(key,{lunarYear:row.lunarYear,lunarMonth:row.lunarMonth,leap:row.leap,monthDays:row.monthDays});}
  return {dates,solar,sources,months:[...groups.values()],support:{from:index.from,untilExclusive:index.until,scope:'CIVIL_DATE_LOOKUP_ONLY',engineSupportPromotion:false,g1P2Promotion:false}};
}

export function projectApiOnlyCandidate(calendar){
  return {schemaVersion:'kasi-api-research-v1',status:'RESEARCH_ONLY',normalizerVersion:'0.1.2',evidenceProfile:'API_ONLY_RAW_SHA_AND_RECORD_LINEAGE_REVALIDATED',rawValidation:'API_ONLY_ENTITIES_RENORMALIZED_WITHOUT_COMPARISON_TABLES',support:structuredClone(calendar.support),dates:structuredClone(calendar.dates),events:structuredClone(calendar.events),months:structuredClone(calendar.months)};
}
export const projectApiOnlySources=sources=>sources.map(row=>({id:row.id,...structuredClone(row.receipt)}));

export function validateApiOnlyCalendar(calendar,normalized){
  keys(calendar,['schemaVersion','normalizerVersion','support','dates','events','months','annualSolarContent'],'API_ONLY_CALENDAR_FIELDS');
  check(calendar.schemaVersion===SERVER_API_ONLY_CALENDAR_SCHEMA&&calendar.normalizerVersion==='0.1.2','API_ONLY_CALENDAR_SCHEMA');
  check(fingerprint(calendar.support)===fingerprint(normalized.support)&&fingerprint(calendar.dates)===fingerprint(normalized.dates)&&fingerprint(calendar.events)===fingerprint(normalized.solar.filter(row=>row.date<'2027-01-01').map(projectSolarEvent))&&fingerprint(calendar.months)===fingerprint(normalized.months),'API_ONLY_NORMALIZED_CALENDAR_CHANGED');
  const annual=calendar.annualSolarContent;check(fingerprint(annual)===SERVER_API_ONLY_ANNUAL_PIN&&annual.baseManifestSha256===SERVER_API_ONLY_BASE_PIN&&annual.boundarySupplementSha256===SERVER_API_ONLY_BOUNDARY_PIN,'API_ONLY_ANNUAL_PIN');
  const expectedRows=normalized.solar.filter(row=>row.date.startsWith('2027-')).map(row=>({...row,termCode:definitions.get(row.term).code,displayedDateTime:row.date+'T'+row.time}));
  check(fingerprint(annual.rows)===fingerprint(expectedRows),'API_ONLY_ANNUAL_NORMALIZATION_CHANGED');
  const sourceIds=new Set(expectedRows.map(row=>row.sourceRef));check(fingerprint(annual.sources)===fingerprint(projectApiOnlySources(normalized.sources.filter(row=>sourceIds.has(row.id)))),'API_ONLY_ANNUAL_SOURCES_CHANGED');
  check(annual.rawReferences.length===sourceIds.size&&annual.rawReferences.every(ref=>sourceIds.has(ref.sourceRef)&&ref.path==='raw/'+ref.responseSha256+'.body'&&ref.receiptPath==='receipts/'+ref.sourceRef+'.json'&&ref.resultCode==='00'&&ref.format==='xml'),'API_ONLY_ANNUAL_RAW_REFERENCES');
  return true;
}
export function assertProductionApiOnlyScope(normalized){
  check(normalized.dates.length===28124&&normalized.solar.length===1872&&normalized.sources.length===1002&&normalized.support.from==='1950-01-01'&&normalized.support.untilExclusive==='2027-01-01','API_ONLY_ACCEPTED_SCOPE');
  check(normalized.sources.filter(s=>s.receipt.query.service==='lunar').length===924&&normalized.sources.filter(s=>s.receipt.query.service==='solar'&&s.receipt.query.year<=2026).length===77&&normalized.sources.filter(s=>s.receipt.query.year===2027).length===1,'API_ONLY_ACCEPTED_SOURCE_COUNTS');
}
