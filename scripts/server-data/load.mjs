/** Fixed API-only pack startup loader. Cache/reuse the returned issued object per context. */
import {readFile,readdir,lstat,realpath} from 'node:fs/promises';
import {join,resolve} from 'node:path';
import {fingerprint,sha} from '../../.kasi-build/schema.js';
import {SERVER_API_ONLY_PACK_SCHEMA,SERVER_API_ONLY_PACK_VERSION,SERVER_API_ONLY_PACK_ID,SERVER_API_ONLY_ACCEPTED_PIN,SERVER_API_ONLY_FILES,SERVER_API_ONLY_RIGHTS,SERVER_API_ONLY_NOTICE,SERVER_API_ONLY_BASE_PIN,SERVER_API_ONLY_EXPORT_PIN,SERVER_API_ONLY_BOUNDARY_PIN,SERVER_API_ONLY_ANNUAL_PIN} from './constants.mjs';
import {check,isSha,keys,dense,freeze,normalizeApiOnlyResponses,validateApiOnlyCalendar,assertProductionApiOnlyScope,projectApiOnlyCandidate,projectApiOnlySources} from './core.mjs';
import {bindServerApiOnlyLoaded} from './binding.mjs';

async function plainFile(path,maxBytes){const info=await lstat(path);check(info.isFile()&&!info.isSymbolicLink()&&info.size<=maxBytes,'API_ONLY_PLAIN_BOUNDED_FILE_REQUIRED');return readFile(path);}
export async function inspectServerApiOnlyDataPack({directory,expectedPackSha256}){
  check(typeof directory==='string'&&directory.length>0&&isSha(expectedPackSha256),'API_ONLY_INDEPENDENT_PACK_PIN_REQUIRED');
  const root=resolve(directory),info=await lstat(root);check(info.isDirectory()&&!info.isSymbolicLink()&&await realpath(root)===root,'API_ONLY_PLAIN_DIRECTORY_REQUIRED');
  const names=(await readdir(root)).sort();check(fingerprint(names)===fingerprint(['manifest.json',...SERVER_API_ONLY_FILES].sort()),'API_ONLY_FILE_SET');
  const bytes=await plainFile(join(root,'manifest.json'),100000),manifest=JSON.parse(bytes.toString('utf8'));
  keys(manifest,['schemaVersion','version','id','normalizerVersion','scope','upstreamPins','counts','projections','rights','excludedMaterial','files'],'API_ONLY_MANIFEST_FIELDS');
  check(fingerprint(manifest)===expectedPackSha256,'API_ONLY_PACK_PIN_MISMATCH');
  check(manifest.schemaVersion===SERVER_API_ONLY_PACK_SCHEMA&&manifest.version===SERVER_API_ONLY_PACK_VERSION&&manifest.id===SERVER_API_ONLY_PACK_ID&&manifest.normalizerVersion==='0.1.2','API_ONLY_MANIFEST_CONTRACT');
  check(fingerprint(manifest.rights)===fingerprint(SERVER_API_ONLY_RIGHTS),'API_ONLY_RIGHTS_CONTRACT');
  check(fingerprint(manifest.upstreamPins)===fingerprint({baseManifestContentSha256:SERVER_API_ONLY_BASE_PIN,exportSha256:SERVER_API_ONLY_EXPORT_PIN,boundarySupplementContentSha256:SERVER_API_ONLY_BOUNDARY_PIN,annualSolarContentSha256:SERVER_API_ONLY_ANNUAL_PIN}),'API_ONLY_UPSTREAM_PINS');
  dense(manifest.files,'API_ONLY_FILES_ARRAY');check(manifest.files.length===SERVER_API_ONLY_FILES.length&&fingerprint(manifest.files.map(row=>row.path))===fingerprint(SERVER_API_ONLY_FILES),'API_ONLY_PAYLOAD_FILE_SET');
  const content=new Map();for(const row of manifest.files){keys(row,['path','bytes','sha256'],'API_ONLY_FILE_DESCRIPTOR');check(Number.isSafeInteger(row.bytes)&&row.bytes>0&&row.bytes<=40000000&&isSha(row.sha256),'API_ONLY_FILE_LIMIT');const data=await plainFile(join(root,row.path),40000000);check(data.length===row.bytes&&sha(data)===row.sha256,'API_ONLY_FILE_CHANGED');content.set(row.path,data.toString('utf8'));}
  check(content.get('NOTICE.txt')===SERVER_API_ONLY_NOTICE,'API_ONLY_NOTICE_CHANGED');
  const calendar=JSON.parse(content.get('calendar.json')),sources=JSON.parse(content.get('sources.json')),rawDocuments=content.get('raw-responses.ndjson').trimEnd().split('\n').map(line=>JSON.parse(line));
  dense(sources,'API_ONLY_SOURCES_ARRAY');for(const source of sources)keys(source,['id','provider','catalogUrl','receipt','resultCode','rowRefs'],'API_ONLY_SOURCE_DESCRIPTOR');
  const records=projectApiOnlySources(sources),normalized=normalizeApiOnlyResponses(records,rawDocuments);
  check(fingerprint(sources)===fingerprint(normalized.sources),'API_ONLY_SOURCE_ROW_LINEAGE_CHANGED');
  assertProductionApiOnlyScope(normalized);validateApiOnlyCalendar(calendar,normalized);
  check(fingerprint(manifest.counts)===fingerprint({dates:calendar.dates.length,baseSolarEvents:calendar.events.length,annual2027SolarEvents:calendar.annualSolarContent.rows.length,sourceResponses:sources.length,normalizedRows:normalized.dates.length+normalized.solar.length,lunarMonths:calendar.months.length}),'API_ONLY_COUNTS_CHANGED');
  const candidate=projectApiOnlyCandidate(calendar);
  check(fingerprint(manifest.projections)===fingerprint({candidateContentSha256:fingerprint(candidate),sourceContentSha256:fingerprint(records)}),'API_ONLY_PROJECTION_CHANGED');
  return {manifest,calendar,sources,rawDocuments,candidate,records,contentSha256:expectedPackSha256};
}

/** Runtime accepts only the separately reviewed constant. No pin/rights/HTTP override. */
export async function loadServerApiOnlyDataPack(options){
  keys(options,['directory'],'API_ONLY_LOADER_OPTIONS');check(isSha(SERVER_API_ONLY_ACCEPTED_PIN),'API_ONLY_REVIEW_NOT_ACCEPTED');
  const inspected=await inspectServerApiOnlyDataPack({directory:options.directory,expectedPackSha256:SERVER_API_ONLY_ACCEPTED_PIN}),annual=inspected.calendar.annualSolarContent;
  const annualSolarExtension={schemaVersion:annual.schemaVersion,version:annual.version,policy:structuredClone(annual.policy),contentSha256:SERVER_API_ONLY_ANNUAL_PIN,baseManifestSha256:SERVER_API_ONLY_BASE_PIN,boundarySupplementSha256:SERVER_API_ONLY_BOUNDARY_PIN,content:structuredClone(annual)};
  const identity={id:'kasi-server-api-only-'+SERVER_API_ONLY_ACCEPTED_PIN.slice(0,16),version:SERVER_API_ONLY_PACK_VERSION,manifestContentSha256:SERVER_API_ONLY_ACCEPTED_PIN,upstreamBaseManifestSha256:SERVER_API_ONLY_BASE_PIN,upstreamBoundarySupplementSha256:SERVER_API_ONLY_BOUNDARY_PIN,upstreamAnnualSolarSha256:SERVER_API_ONLY_ANNUAL_PIN,rightsReview:'VERIFIED_ALLOWED_WITH_CONDITIONS',validationLevel:'FIXED_API_WHITELIST_RAW_SHA_ROW_LINEAGE_NORMALIZATION_RECHECKED',sourceKind:'KASI_API_ONLY_SERVER_DERIVED',g0Receipt:null,g1P2Promotion:false};
  return bindServerApiOnlyLoaded(freeze({manifest:inspected.manifest,candidate:inspected.candidate,sources:inspected.records,annualSolarExtension,apiOnlyIdentity:identity}));
}
