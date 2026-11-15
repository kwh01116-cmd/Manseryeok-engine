/** New private API-only pack. Existing archives/candidates are read-only evidence. */
import {readFile,lstat,realpath,mkdir,writeFile} from 'node:fs/promises';
import {resolve,join,dirname,relative,isAbsolute,sep} from 'node:path';
import {pathToFileURL} from 'node:url';
import {fingerprint,sha} from '../../.kasi-build/schema.js';
import {loadCandidate} from '../kasi/candidate.mjs';
import {loadExisting2027AnnualSolarExtension,ANNUAL_SOLAR_EXTENSION_POLICY_ID} from '../kasi/annual-solar-extension.mjs';
import {SERVER_API_ONLY_PACK_SCHEMA,SERVER_API_ONLY_CALENDAR_SCHEMA,SERVER_API_ONLY_PACK_VERSION,SERVER_API_ONLY_PACK_ID,SERVER_API_ONLY_BASE_PIN,SERVER_API_ONLY_EXPORT_PIN,SERVER_API_ONLY_BOUNDARY_PIN,SERVER_API_ONLY_ANNUAL_PIN,SERVER_API_ONLY_FILES,SERVER_API_ONLY_RIGHTS,SERVER_API_ONLY_NOTICE} from './constants.mjs';
import {check,keys,normalizeApiOnlyResponses,projectSolarEvent,projectApiOnlyCandidate,projectApiOnlySources,validateApiOnlyCalendar,assertProductionApiOnlyScope} from './core.mjs';

const encode=value=>JSON.stringify(value)+'\n';
const contains=(parent,child)=>{const rel=relative(parent,child);return rel===''||(!isAbsolute(rel)&&rel!=='..'&&!rel.startsWith('..'+sep));};
async function text(path){const info=await lstat(path);check(info.isFile()&&!info.isSymbolicLink()&&info.size<=20000000,'API_ONLY_INPUT_FILE');return readFile(path,'utf8');}
const pageName=q=>`${q.service}-${q.year}-${q.month??0}-${q.day??0}-${q.format}-${q.page}.json`;

export async function buildServerApiOnlyDataPack(options){
  keys(options,['archiveDirectory','candidateDirectory','boundaryDirectory','outDir'],'API_ONLY_BUILD_OPTIONS');
  const archive=await realpath(resolve(options.archiveDirectory)),candidateDirectory=await realpath(resolve(options.candidateDirectory)),boundaryDirectory=await realpath(resolve(options.boundaryDirectory)),out=resolve(options.outDir);
  check(out.split(/[\\/]/).includes('.private'),'API_ONLY_PRIVATE_OUTPUT_REQUIRED');
  for(const input of [archive,candidateDirectory,boundaryDirectory])check(!contains(input,out)&&!contains(out,input),'API_ONLY_INPUT_OUTPUT_OVERLAP');
  try{await lstat(out);throw new Error('API_ONLY_OUTPUT_ALREADY_EXISTS');}catch(error){if(error.code!=='ENOENT')throw error;}
  check(sha(await text(join(archive,'export.json')))===SERVER_API_ONLY_EXPORT_PIN,'API_ONLY_EXPORT_PIN_CHANGED');
  const base=await loadCandidate(candidateDirectory,SERVER_API_ONLY_BASE_PIN),annual=await loadExisting2027AnnualSolarExtension({directory:boundaryDirectory,expectedSupplementSha256:SERVER_API_ONLY_BOUNDARY_PIN,expectedBaseManifestSha256:SERVER_API_ONLY_BASE_PIN,expectedAnnualSha256:SERVER_API_ONLY_ANNUAL_PIN,policyId:ANNUAL_SOLAR_EXTENSION_POLICY_ID});
  const records=[...structuredClone(base.sources),...structuredClone(annual.content.sources)].sort((a,b)=>a.id.localeCompare(b.id)),rawDocuments=[];
  for(const source of records){
    const isAnnual=source.query.year===2027,root=isAnnual?boundaryDirectory:archive,{id,...receipt}=source;
    const saved=JSON.parse(await text(join(root,isAnnual?'receipts/'+id+'.json':'pages/'+pageName(receipt.query))));
    if(isAnnual)check(fingerprint(saved)===id,'API_ONLY_BOUNDARY_RECEIPT_CHANGED');
    else{keys(saved,['schemaVersion','receipt'],'API_ONLY_PAGE_FIELDS');check(saved.schemaVersion==='kasi-page-v1'&&fingerprint(saved.receipt)===id,'API_ONLY_PAGE_RECEIPT_CHANGED');}
    const body=await text(join(root,'raw',receipt.responseSha256+'.body'));check(sha(body)===receipt.responseSha256,'API_ONLY_BUILD_RAW_CHANGED');rawDocuments.push({sourceRef:id,body});
  }
  const normalized=normalizeApiOnlyResponses(records,rawDocuments);assertProductionApiOnlyScope(normalized);
  const baseEvents=normalized.solar.filter(row=>row.date<'2027-01-01').map(projectSolarEvent);
  check(fingerprint(normalized.dates)===fingerprint(base.candidate.dates)&&fingerprint(baseEvents)===fingerprint(base.candidate.events),'API_ONLY_ACCEPTED_ROWS_NOT_EQUIVALENT');
  const calendar={schemaVersion:SERVER_API_ONLY_CALENDAR_SCHEMA,normalizerVersion:'0.1.2',support:normalized.support,dates:normalized.dates,events:baseEvents,months:normalized.months,annualSolarContent:structuredClone(annual.content)};
  validateApiOnlyCalendar(calendar,normalized);
  const candidate=projectApiOnlyCandidate(calendar),sources=projectApiOnlySources(normalized.sources);
  const contents=new Map([['calendar.json',encode(calendar)],['sources.json',encode(normalized.sources)],['raw-responses.ndjson',rawDocuments.map(encode).join('')],['NOTICE.txt',SERVER_API_ONLY_NOTICE]]);
  const manifest={schemaVersion:SERVER_API_ONLY_PACK_SCHEMA,version:SERVER_API_ONLY_PACK_VERSION,id:SERVER_API_ONLY_PACK_ID,normalizerVersion:'0.1.2',scope:{purpose:'SERVER_INTERNAL_API_ONLY_CALENDAR_INPUT_NOT_G0',observedDates:{fromInclusive:'1950-01-01',untilExclusive:'2027-01-01'},solarYears:{from:1950,to:2027},birthSupport:'SEPARATE_EXPLICIT_CLOCK_PROFILE_REQUIRED',runtimeRequests:0},upstreamPins:{baseManifestContentSha256:SERVER_API_ONLY_BASE_PIN,exportSha256:SERVER_API_ONLY_EXPORT_PIN,boundarySupplementContentSha256:SERVER_API_ONLY_BOUNDARY_PIN,annualSolarContentSha256:SERVER_API_ONLY_ANNUAL_PIN},counts:{dates:calendar.dates.length,baseSolarEvents:calendar.events.length,annual2027SolarEvents:calendar.annualSolarContent.rows.length,sourceResponses:normalized.sources.length,normalizedRows:normalized.dates.length+normalized.solar.length,lunarMonths:calendar.months.length},projections:{candidateContentSha256:fingerprint(candidate),sourceContentSha256:fingerprint(sources)},rights:SERVER_API_ONLY_RIGHTS,excludedMaterial:[{kind:'candidate-wrapper-audit-and-day-comparison',reason:'Only calendar input rows are rebuilt; analysis and comparison metadata are not required.'},{kind:'comparisons-and-external-fixtures',reason:'KASI annual/TXT or OSS-derived comparison surfaces are not API response content.'},{kind:'exceptions-and-corrections',reason:'No exception patch or correction is applied. API nulls and notation are preserved directly.'},{kind:'run-metadata-and-collection-logs',reason:'Operational state and acquisition logs are not calendar inputs.'},{kind:'KASA-publications-and-annual-TXT',reason:'Separately licensed works are not part of the two API response entities.'}],files:SERVER_API_ONLY_FILES.map(path=>({path,bytes:Buffer.byteLength(contents.get(path)),sha256:sha(contents.get(path))}))};
  await mkdir(dirname(out),{recursive:true});check(await realpath(dirname(out))===dirname(out),'API_ONLY_OUTPUT_PARENT_SYMLINK');await mkdir(out,{recursive:false,mode:0o700});
  for(const [path,content] of contents)await writeFile(join(out,path),content,{flag:'wx',mode:0o600});await writeFile(join(out,'manifest.json'),encode(manifest),{flag:'wx',mode:0o600});
  return {status:'BUILT_REQUIRES_SEPARATE_PIN_ACCEPTANCE',contentSha256:fingerprint(manifest),manifest};
}

export function parseServerApiOnlyBuildArgs(args){check(args.length===8,'API_ONLY_BUILD_ARGUMENTS');const map={};for(let i=0;i<args.length;i+=2){const name=args[i];check(['--archive','--candidate','--boundary','--out'].includes(name)&&!Object.hasOwn(map,name)&&typeof args[i+1]==='string','API_ONLY_BUILD_ARGUMENTS');map[name]=args[i+1];}return {archiveDirectory:map['--archive'],candidateDirectory:map['--candidate'],boundaryDirectory:map['--boundary'],outDir:map['--out']};}
if(process.argv[1]&&import.meta.url===pathToFileURL(resolve(process.argv[1])).href){try{const result=await buildServerApiOnlyDataPack(parseServerApiOnlyBuildArgs(process.argv.slice(2)));process.stdout.write(JSON.stringify({status:result.status,contentSha256:result.contentSha256,counts:result.manifest.counts})+'\n');}catch(error){process.stderr.write(JSON.stringify({status:'REJECTED',code:error.code??error.message??'API_ONLY_BUILD_REJECTED'})+'\n');process.exitCode=1;}}
