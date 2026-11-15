/** Explicit reuse of already captured 2027 API raw evidence; never performs HTTP. */
import {readFile,lstat} from 'node:fs/promises';
import {join} from 'node:path';
import {fingerprint,sha,parsePage,normalizeSolar,validateSolar} from '../../.kasi-build/schema.js';
import {SOLAR_TERM_DEFINITIONS} from '../../dist/calendar/solarTerms.js';
import {isGregorianMinute,validateKstMinuteSolarTermTimeline} from '../../dist/calendar/solarTermTimeline.js';
import {loadKasi2027BoundarySupplement,verifyKasi2027BoundarySupplement} from './boundary-supplement.mjs';

export const ANNUAL_SOLAR_EXTENSION_POLICY_ID='KASI-API-2027-ANNUAL-SOLAR-PUBLISHED-MINUTE-V01';
export const ANNUAL_SOLAR_EXTENSION_SCHEMA='kasi-api-existing-2027-annual-solar-extension-v1';
const VERSION='1.0.0',issued=new WeakSet();
const names=new Map(Object.values(SOLAR_TERM_DEFINITIONS).map(d=>[d.koreanName,d.code]));
const isPin=value=>typeof value==='string'&&/^[a-f0-9]{64}$/.test(value);
const check=(condition,code)=>{if(!condition)throw new Error(code);};
const freeze=value=>{if(value&&typeof value==='object'&&!Object.isFrozen(value)){Object.values(value).forEach(freeze);Object.freeze(value);}return value;};
async function plainFile(path){const info=await lstat(path);check(info.isFile()&&!info.isSymbolicLink(),'ANNUAL_SOLAR_PLAIN_FILE_REQUIRED');return readFile(path,'utf8');}

/** Review/build surface. The returned content is not an issued runtime object. */
export async function inspectExisting2027AnnualSolarContent({directory,expectedSupplementSha256,expectedBaseManifestSha256,policyId}){
 check(policyId===ANNUAL_SOLAR_EXTENSION_POLICY_ID,'EXPLICIT_ANNUAL_SOLAR_POLICY_REQUIRED');
 const boundary=await loadKasi2027BoundarySupplement({directory,expectedSupplementSha256,expectedBaseManifestSha256});
 verifyKasi2027BoundarySupplement(boundary,{baseManifestSha256:expectedBaseManifestSha256});
 const sources=new Map(boundary.content.sources.map(s=>[s.id,s])),normalized=[],seenSources=new Set();
 for(const ref of boundary.content.rawReferences){
  check(ref.path==='raw/'+ref.responseSha256+'.body'&&isPin(ref.sourceRef),'ANNUAL_SOLAR_UNSAFE_REFERENCE');
  const source=sources.get(ref.sourceRef);check(source&&!seenSources.has(ref.sourceRef),'ANNUAL_SOLAR_SOURCE_MISSING_OR_DUPLICATE');seenSources.add(ref.sourceRef);
  const body=await plainFile(join(directory,ref.path));check(sha(body)===ref.responseSha256,'ANNUAL_SOLAR_RAW_PIN_CHANGED');
  const page=parsePage(body);check(page.total===24&&source.query.year===2027&&source.operation==='get24DivisionsInfo','ANNUAL_SOLAR_SOURCE_SCOPE');
  for(const item of page.items)normalized.push({...normalizeSolar(item,2027),sourceRef:ref.sourceRef});
 }
 check(normalized.length===24&&seenSources.size===sources.size,'ANNUAL_SOLAR_INCOMPLETE_SOURCE_SET');validateSolar(normalized,2027);
 const rows=normalized.map(row=>{
  const termCode=names.get(row.term);check(termCode,'ANNUAL_SOLAR_UNKNOWN_TERM');
  check(row.precision==='MINUTE'&&row.time!==null&&!row.timeNotation&&isGregorianMinute(row.date+'T'+row.time),'ANNUAL_SOLAR_PUBLISHED_MINUTE_REQUIRED');
  return {...row,termCode,displayedDateTime:row.date+'T'+row.time};
 }).sort((a,b)=>a.displayedDateTime.localeCompare(b.displayedDateTime));
 check(new Set(rows.map(r=>r.termCode)).size===24&&rows.every(r=>r.date.startsWith('2027-')),'ANNUAL_SOLAR_TERM_SET');
 for(const old of boundary.content.events){const row=rows.find(r=>r.termCode===old.termCode);check(row&&row.displayedDateTime===old.computationalCivilDateTime&&row.sourceRef===old.sourceRef,'ANNUAL_SOLAR_ACCEPTED_BOUNDARY_CONFLICT');}
 return {
  schemaVersion:ANNUAL_SOLAR_EXTENSION_SCHEMA,version:VERSION,policy:{id:policyId,version:'1'},
  baseManifestSha256:expectedBaseManifestSha256,boundarySupplementSha256:expectedSupplementSha256,
  purpose:'REUSE_EXISTING_ANNUAL_RAW_SOLAR_ROWS_ONLY',sourceKind:'KASI_OPENAPI_RESPONSE',year:2027,
  meaning:{sourcePrecision:'MINUTE',publishedTimeBasis:'API_KST_AS_PUBLISHED',utcInstant:null,birthClockPolicy:null,queryClockPolicy:null,lunarDateIndex:false,sourceAcquisition:'EXISTING_CAPTURE_NO_NEW_HTTP',sourcePublicationRightsNotCertified:true},
  rows,sources:structuredClone(boundary.content.sources),rawReferences:structuredClone(boundary.content.rawReferences),
 };
}

/** Runtime loading requires the separately reviewed content pin, never a self-read expected hash. */
export async function loadExisting2027AnnualSolarExtension(options){
 check(isPin(options?.expectedAnnualSha256),'INDEPENDENT_ANNUAL_SOLAR_PIN_REQUIRED');
 const content=await inspectExisting2027AnnualSolarContent(options),contentSha256=fingerprint(content);
 check(contentSha256===options.expectedAnnualSha256,'ANNUAL_SOLAR_CONTENT_PIN_MISMATCH');
 const sources=new Map(content.sources.map(s=>[s.id,s]));
 const evidence=content.rows.map(row=>({
  id:'KASI_OPENAPI_ANNUAL_2027:'+row.sourceRef+':'+row.date+':'+row.termCode,
  sourceRef:row.sourceRef,source:structuredClone(sources.get(row.sourceRef)),original:structuredClone(row),
  interpretation:{policyId:ANNUAL_SOLAR_EXTENSION_POLICY_ID,policyVersion:'1',publishedTimeBasis:'API_KST_AS_PUBLISHED',sourcePrecision:'MINUTE',utcInstant:null,birthClockPolicy:null,queryClockPolicy:null},
 }));
 const events=evidence.map(row=>({term:row.original.termCode,displayedDateTime:row.original.displayedDateTime,timeBasis:'KST',sourcePrecision:'MINUTE',sourceIds:[row.id]}));
 validateKstMinuteSolarTermTimeline(events);
 const result=freeze({schemaVersion:ANNUAL_SOLAR_EXTENSION_SCHEMA,version:VERSION,policy:{id:ANNUAL_SOLAR_EXTENSION_POLICY_ID,version:'1'},contentSha256,baseManifestSha256:content.baseManifestSha256,boundarySupplementSha256:content.boundarySupplementSha256,content,events,evidence,limits:['SOLAR_YEAR_2027_ONLY','NO_2028_BOUNDARIES','NO_LUNAR_DATE_INDEX','CLOCK_PROFILE_SELECTION_REQUIRED','NO_RUNTIME_NETWORK','RIGHTS_AUDIT_SEPARATE']});
 issued.add(result);return result;
}
export function verifyExisting2027AnnualSolarExtension(value,{baseManifestSha256}={}){
 check(issued.has(value)&&Object.isFrozen(value),'ISSUED_ANNUAL_SOLAR_EXTENSION_REQUIRED');
 check(value.baseManifestSha256===baseManifestSha256,'ANNUAL_SOLAR_BASE_PIN_MISMATCH');return value;
}
