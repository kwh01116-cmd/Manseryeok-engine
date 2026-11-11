/** Narrow, opt-in API boundary evidence. Never a complete 2027 calendar dataset. */
import {readFile,lstat} from 'node:fs/promises';
import {join} from 'node:path';
import {fingerprint,sha,parsePage,normalizeSolar,validateSolar} from '../../.kasi-build/schema.js';
import {isGregorianMinute} from '../../dist/calendar/solarTermTimeline.js';

export const BOUNDARY_SUPPLEMENT_SCHEMA='kasi-api-boundary-supplement-v1';
export const BOUNDARY_SUPPLEMENT_VERSION='1.0.0';
export const BOUNDARY_INTERPRETATION_POLICY='KASI-2027-AUX-PUBLISHED-KST-BOUNDARY-ONLY-V1';
export class BoundarySupplementError extends Error{constructor(code){super(code);this.name='BoundarySupplementError';this.code=code;}}
const check=(value,code)=>{if(!value)throw new BoundarySupplementError(code);};
const digest=value=>typeof value==='string'&&/^[a-f0-9]{64}$/.test(value);
const issued=new WeakSet();
const freeze=value=>{if(value&&typeof value==='object'&&!Object.isFrozen(value)){Object.values(value).forEach(freeze);Object.freeze(value);}return value;};
const terms=new Map([['소한','XIAOHAN'],['입춘','LICHUN']]);
const interpretation=freeze({id:BOUNDARY_INTERPRETATION_POLICY,version:'1',meaning:'API_PUBLISHED_KST_BOUNDARY_ONLY_WALL_MINUTE_ARITHMETIC',runtimeTerms:['XIAOHAN'],dataReadyOnlyTerms:['LICHUN'],utcInstant:null,futureLegalClockOrDstCertification:false,birthRangeExpansion:false,queryRangeExpansion:false,sourcePrecision:'MINUTE',originalHistoricalStatus:'NOT_RESOLVED'});

/** Build content from actual response bodies, never from a fixture masquerading as API evidence. */
export function buildKasi2027BoundaryContent({pages,baseManifestSha256,codeIdentity}){
 check(digest(baseManifestSha256),'BOUNDARY_BASE_PIN_REQUIRED');
 check(codeIdentity&&codeIdentity.sourceIdentityKind==='HEAD_PLUS_EXACT_FILE_HASHES'&&/^[a-f0-9]{40}$/.test(codeIdentity.gitHead??'')&&digest(codeIdentity.collectorSha256)&&digest(codeIdentity.normalizerSha256),'BOUNDARY_CODE_IDENTITY_REQUIRED');
 check(Array.isArray(pages)&&pages.length>0&&pages.length<=10,'BOUNDARY_PAGES_REQUIRED');
 const sources=[],rawReferences=[],all=[],seen=new Set();let expectedTotal=null,expectedSize=null;
 for(const {body,receipt} of pages){
  check(typeof body==='string'&&receipt&&typeof receipt==='object','BOUNDARY_RAW_REQUIRED');
  check(Object.keys(receipt).length===8&&Object.keys(receipt).every(k=>['evidenceSurface','responseHashScope','query','requestedAt','serviceId','operation','responseSha256','schema'].includes(k)),'BOUNDARY_UNEXPECTED_RECEIPT_FIELDS');
  const q=receipt.query;
  check(receipt.evidenceSurface==='KASI_OPENAPI_RESPONSE'&&receipt.responseHashScope==='UTF8_ENTITY_AFTER_HTTP_DECOMPRESSION'&&receipt.serviceId==='15012690'&&receipt.operation==='get24DivisionsInfo','BOUNDARY_SOURCE_CONTRACT');
  check(q&&q.service==='solar'&&q.year===2027&&q.month===undefined&&q.day===undefined&&q.format==='xml'&&Number.isInteger(q.page)&&q.page>=1&&q.page<=10&&Object.keys(q).every(k=>['service','year','page','format'].includes(k)),'BOUNDARY_QUERY_MUST_BE_2027_ANNUAL_SOLAR');
  check(typeof receipt.requestedAt==='string'&&/^\d{4}-\d{2}-\d{2}T.*Z$/.test(receipt.requestedAt)&&Number.isFinite(Date.parse(receipt.requestedAt)),'BOUNDARY_QUERY_TIME_REQUIRED');
  check(sha(body)===receipt.responseSha256,'BOUNDARY_RAW_HASH_CHANGED');
  const parsed=parsePage(body);
  check(parsed.schema.format==='xml'&&fingerprint(parsed.schema)===fingerprint(receipt.schema),'BOUNDARY_RAW_SCHEMA_CHANGED');
  check(parsed.page===q.page&&!seen.has(parsed.page),'BOUNDARY_PAGE_DUPLICATE_OR_CHANGED');seen.add(parsed.page);
  if(expectedTotal===null){expectedTotal=parsed.total;expectedSize=parsed.size;}else check(parsed.total===expectedTotal&&parsed.size===expectedSize,'BOUNDARY_PAGINATION_CHANGED');
  const id=fingerprint(receipt);check(!sources.some(s=>s.id===id),'BOUNDARY_SOURCE_DUPLICATE');
  sources.push({...structuredClone(receipt),id});
  rawReferences.push({sourceRef:id,path:'raw/'+receipt.responseSha256+'.body',receiptPath:'receipts/'+id+'.json',responseSha256:receipt.responseSha256,resultCode:'00',format:'xml'});
  for(const item of parsed.items)all.push({...normalizeSolar(item,2027),sourceRef:id});
 }
 check(expectedTotal===24&&all.length===24&&seen.size===Math.ceil(expectedTotal/expectedSize)&&Array.from({length:seen.size},(_,i)=>i+1).every(i=>seen.has(i)),'BOUNDARY_ANNUAL_RAW_INCOMPLETE');
 validateSolar(all,2027);
 const events=all.filter(r=>terms.has(r.term)).map(row=>{
  check(row.precision==='MINUTE'&&row.time!==null&&!row.timeNotation&&isGregorianMinute(row.date+'T'+row.time),'BOUNDARY_MINUTE_REQUIRED');
  return {...row,termCode:terms.get(row.term),computationalCivilDateTime:row.date+'T'+row.time,timeStatus:'PUBLISHED_WALL_MINUTE_ONLY',utcInstant:null};
 }).sort((a,b)=>a.date.localeCompare(b.date));
 check(events.length===2&&events[0].termCode==='XIAOHAN'&&events[1].termCode==='LICHUN'&&events[0].date.startsWith('2027-01-')&&events[1].date.startsWith('2027-02-'),'BOUNDARY_REQUIRED_TERMS');
 return {schemaVersion:BOUNDARY_SUPPLEMENT_SCHEMA,version:BOUNDARY_SUPPLEMENT_VERSION,baseManifestSha256,codeIdentity:structuredClone(codeIdentity),normalizerVersion:'0.1.2',sourceKind:'KASI_OPENAPI_RESPONSE',support:{year:2027,terms:['XIAOHAN','LICHUN'],completeYear:false,birthSupportExpansion:false},interpretation,events,sources:sources.sort((a,b)=>a.id.localeCompare(b.id)),rawReferences:rawReferences.sort((a,b)=>a.sourceRef.localeCompare(b.sourceRef))};
}

async function plainFile(path){const stat=await lstat(path);check(stat.isFile()&&!stat.isSymbolicLink(),'BOUNDARY_PLAIN_FILE_REQUIRED');return readFile(path,'utf8');}
export async function loadKasi2027BoundarySupplement({directory,expectedSupplementSha256,expectedBaseManifestSha256}){
 check(typeof directory==='string'&&directory.length>0,'BOUNDARY_DIRECTORY_REQUIRED');
 check(digest(expectedSupplementSha256)&&digest(expectedBaseManifestSha256),'BOUNDARY_INDEPENDENT_PINS_REQUIRED');
 try{for(const name of ['', 'raw','receipts']){const stat=await lstat(join(directory,name));check(stat.isDirectory()&&!stat.isSymbolicLink(),'BOUNDARY_PLAIN_DIRECTORY_REQUIRED');}}catch(error){if(error instanceof BoundarySupplementError)throw error;throw new BoundarySupplementError('BOUNDARY_MANIFEST_MISSING_OR_INVALID');}
 let manifest;
 try{manifest=JSON.parse(await plainFile(join(directory,'manifest.json')));}catch(error){if(error instanceof BoundarySupplementError)throw error;throw new BoundarySupplementError('BOUNDARY_MANIFEST_MISSING_OR_INVALID');}
 check(manifest&&Object.keys(manifest).length===2&&digest(manifest.contentSha256)&&manifest.contentSha256===expectedSupplementSha256&&fingerprint(manifest.content)===expectedSupplementSha256,'BOUNDARY_CONTENT_PIN_MISMATCH');
 const content=manifest.content;check(content.baseManifestSha256===expectedBaseManifestSha256,'BOUNDARY_BASE_PIN_MISMATCH');
 check(Array.isArray(content.rawReferences)&&content.rawReferences.length>0&&content.rawReferences.length<=10,'BOUNDARY_RAW_REFERENCES_REQUIRED');
 const pages=[];
 for(const ref of content.rawReferences){
  check(digest(ref.sourceRef)&&digest(ref.responseSha256)&&ref.path==='raw/'+ref.responseSha256+'.body'&&ref.receiptPath==='receipts/'+ref.sourceRef+'.json','BOUNDARY_UNSAFE_RAW_REFERENCE');
  let body,receipt;try{body=await plainFile(join(directory,ref.path));receipt=JSON.parse(await plainFile(join(directory,ref.receiptPath)));}catch(error){if(error instanceof BoundarySupplementError)throw error;throw new BoundarySupplementError('BOUNDARY_RAW_OR_RECEIPT_MISSING');}
  check(fingerprint(receipt)===ref.sourceRef&&sha(body)===ref.responseSha256,'BOUNDARY_RAW_OR_SOURCE_HASH_CHANGED');pages.push({body,receipt});
 }
 const rebuilt=buildKasi2027BoundaryContent({pages,baseManifestSha256:expectedBaseManifestSha256,codeIdentity:content.codeIdentity});
 check(fingerprint(rebuilt)===expectedSupplementSha256,'BOUNDARY_NORMALIZED_CONTENT_CHANGED');
 const sources=new Map(content.sources.map(s=>[s.id,s]));
 const evidence=content.events.map(row=>{check(sources.has(row.sourceRef),'BOUNDARY_EVENT_SOURCE_MISSING');return {id:'KASI_OPENAPI_BOUNDARY_RESPONSE:'+row.sourceRef+':'+row.date+':'+row.termCode,sourceRef:row.sourceRef,source:sources.get(row.sourceRef),original:structuredClone(row),interpreted:{displayedDateTime:row.computationalCivilDateTime,timeBasis:'KST',sourcePrecision:'MINUTE',clockPolicyId:BOUNDARY_INTERPRETATION_POLICY,clockPolicyVersion:'1',utcInstant:null,meaning:interpretation.meaning,futureLegalClockOrDstCertification:false}};});
 const value=freeze({schemaVersion:BOUNDARY_SUPPLEMENT_SCHEMA,version:BOUNDARY_SUPPLEMENT_VERSION,contentSha256:expectedSupplementSha256,baseManifestSha256:expectedBaseManifestSha256,content:structuredClone(content),interpretation,events:evidence.filter(r=>r.original.termCode==='XIAOHAN').map(r=>({term:'XIAOHAN',displayedDateTime:r.interpreted.displayedDateTime,timeBasis:'KST',sourcePrecision:'MINUTE',sourceIds:[r.id]})),evidence,dataReadiness:{XIAOHAN:'VERIFIED_API_BOUNDARY_EVIDENCE',LICHUN:'DATA_READY_QUERY_CLOCK_POLICY_UNRESOLVED'}});
 issued.add(value);return value;
}
export function verifyKasi2027BoundarySupplement(value,{baseManifestSha256}={}){check(issued.has(value)&&Object.isFrozen(value),'ISSUED_BOUNDARY_SUPPLEMENT_REQUIRED');check(value.baseManifestSha256===baseManifestSha256,'BOUNDARY_BASE_PIN_MISMATCH');return value;}
export async function loadOptionalBoundarySupplement(options){
 const directory=options.boundarySupplementDirectory,pin=options.expectedBoundarySupplementSha256;
 check((directory===undefined)===(pin===undefined),'BOUNDARY_DIRECTORY_AND_PIN_REQUIRED_TOGETHER');
 if(directory===undefined)return options.boundarySupplement;
 check(options.boundarySupplement===undefined,'BOUNDARY_SUPPLEMENT_OPTIONS_CONFLICT');
 return loadKasi2027BoundarySupplement({directory,expectedSupplementSha256:pin,expectedBaseManifestSha256:options.expectedManifestSha256});
}
