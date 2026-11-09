/** Offline research only. No production imports point at this module. */
import { readFile, readdir, lstat, realpath, mkdir, writeFile } from 'node:fs/promises';
import { resolve, relative, join, dirname, isAbsolute } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { execFileSync } from 'node:child_process';
import { Store, Collector } from '../../.kasi-build/collector.js';
import { fingerprint, sha, TERMS, parsePage, normalizeSolar, normalizeLunar, validateSolar, validateLunar } from '../../.kasi-build/schema.js';
import { gregorianDayNumber as day, gregorianDateFromDayNumber as civil, monthKey } from '../../dist/calendar/koreanLunisolarValidation.js';
import { createKoreanLunisolarConverter } from '../../dist/calendar/koreanLunisolarConverter.js';
import { dayPillarForGregorianDate } from '../../dist/calendar/dayPillar.js';
import { SEXAGENARY_CYCLE } from '../../dist/domain/sexagenary.js';
import { KOREA_SOLAR_TERM_EVENTS_2026_2027 as solarFixture } from '../../dist/calendar/koreaSolarTermFixtures.js';
import { KASI_KOREAN_LUNISOLAR_2025_2027 as lunarFixture } from '../../dist/calendar/koreanLunisolarFixtures.js';

export const RESEARCH_VERSION = 'kasi-api-research-v1';
const root = resolve(dirname(fileURLToPath(import.meta.url)), '../..');
const check = (ok, code) => { if (!ok) throw new Error(code); };
const key = r => monthKey(r.lunarYear, r.lunarMonth, r.leap);
const lunarKey = r => key(r) + ':' + r.lunarDay;
const codes = ['XIAOHAN','DAHAN','LICHUN','YUSHUI','JINGZHE','CHUNFEN','QINGMING','GUYU','LIXIA','XIAOMAN','MANGZHONG','XIAZHI','XIAOSHU','DASHU','LIQIU','CHUSHU','BAILU','QIUFEN','HANLU','SHUANGJIANG','LIDONG','XIAOXUE','DAXUE','DONGZHI'];
const cycle = SEXAGENARY_CYCLE.map(p => p.stem + p.branch);
const koStems = '갑을병정무기경신임계', koBranches = '자축인묘진사오미신유술해';
function hanGanji(text) {
  if (cycle.includes(text)) return text;
  const m = /^([갑을병정무기경신임계])([자축인묘진사오미신유술해])(?:\(([甲乙丙丁戊己庚辛壬癸][子丑寅卯辰巳午未申酉戌亥])\))?$/.exec(text);
  check(m, 'GANJI_UNRECOGNIZED');
  const candidate = SEXAGENARY_CYCLE.find(p => koStems[cycle.indexOf(p.stem+p.branch)%10] === m[1] && koBranches[cycle.indexOf(p.stem+p.branch)%12] === m[2]);
  check(candidate, 'GANJI_INVALID_CYCLE');
  const han = candidate.stem + candidate.branch;
  check(!m[3] || m[3] === han, 'GANJI_SCRIPT_MISMATCH');
  return han;
}

/** A finite observed-date index, not an annual-TXT corpus or Four Pillars resolver. */
export function createResearchIndex(rows) {
  check(Array.isArray(rows) && rows.length > 0, 'INDEX_EMPTY');
  const bySolar = new Map(), byLunar = new Map();
  let previous;
  for (const r of rows) {
    day(r.solarDate);
    check(!bySolar.has(r.solarDate) && !byLunar.has(lunarKey(r)), 'INDEX_DUPLICATE');
    check(!previous || day(r.solarDate) === day(previous.solarDate)+1, 'INDEX_GAP');
    const copy = structuredClone(r);
    bySolar.set(r.solarDate, copy); byLunar.set(lunarKey(r), copy); previous = r;
  }
  const from = rows[0].solarDate, until = civil(day(rows.at(-1).solarDate)+1);
  return Object.freeze({
    from, until,
    fromGregorianDate(date) {
      day(date);
      const value = bySolar.get(date);
      return value ? {status:'OK',value:structuredClone(value)} : {status:'OUT_OF_COVERAGE'};
    },
    fromLunarDate(date) {
      check(date && Number.isInteger(date.lunarYear) && date.lunarYear>0 && Number.isInteger(date.lunarMonth) && date.lunarMonth>=1 && date.lunarMonth<=12 && Number.isInteger(date.lunarDay) && date.lunarDay>=1 && date.lunarDay<=30 && typeof date.leap==='boolean', 'LUNAR_DATE_SHAPE');
      const value = byLunar.get(lunarKey(date));
      return value ? {status:'OK',value:value.solarDate} : {status:'OUT_OF_OBSERVED_COVERAGE'};
    },
  });
}

export function compileRows(years, {from, to}) {
  check(Number.isInteger(from) && Number.isInteger(to) && from>=1950 && to<=2026 && from<=to, 'RESEARCH_RANGE');
  check(years.length===to-from+1 && years.every((y,i)=>y.year===from+i), 'YEARS_MISSING_DUPLICATE_OR_ORDER');
  for (const y of years) {
    check(y.schemaVersion==='kasi-collector-year-v1' && y.status==='COMPLETE' && y.normalizerVersion==='0.1.2', 'YEAR_CONTRACT');
    check(y.externalOriginalVerification==='UNVERIFIED' && y.rightsReview==='UNVERIFIED', 'EVIDENCE_PROMOTION');
    check(y.normalizedSha256===fingerprint({solar:y.solar,lunar:y.lunar}), 'NORMALIZED_DIGEST_CHANGED');
    validateSolar(y.solar,y.year); validateLunar(y.lunar,y.year);
  }
  const rows = structuredClone(years.flatMap(y=>y.lunar)), solar = structuredClone(years.flatMap(y=>y.solar));
  const index = createResearchIndex(rows), groups = [], anomalies = [], nullGroups = new Set();
  let previous, transitions=0, lunarYearChanges=0, yearJoins=0;
  const dayComparisons = {MATCH:0,MISMATCH:0,UNSUPPORTED:0,details:[]};
  for (const r of rows) {
    check(r.ganji.month!==null || r.leap, 'REGULAR_MONTH_GANJI_NULL');
    if (r.ganji.month===null) nullGroups.add(key(r));
    if (previous) {
      if (r.solarDate.slice(0,4)!==previous.solarDate.slice(0,4)) yearJoins++;
      check((cycle.indexOf(hanGanji(previous.ganji.day))+1)%60===cycle.indexOf(hanGanji(r.ganji.day)), 'DAY_GANJI_DISCONTINUITY');
      if (key(r)===key(previous)) {
        check(r.lunarDay===previous.lunarDay+1 && r.monthDays===previous.monthDays, 'LUNAR_DAY_OR_LENGTH_DISCONTINUITY');
      } else {
        check(previous.lunarDay===previous.monthDays && r.lunarDay===1, 'LUNAR_MONTH_EDGE');
        const leap = r.lunarYear===previous.lunarYear && r.lunarMonth===previous.lunarMonth && r.leap && !previous.leap;
        const next = r.lunarYear===previous.lunarYear && r.lunarMonth===previous.lunarMonth+1 && !r.leap;
        const nextYear = r.lunarYear===previous.lunarYear+1 && previous.lunarMonth===12 && r.lunarMonth===1 && !r.leap;
        check(leap || next || nextYear, 'LUNAR_MONTH_SEQUENCE'); transitions++; if(nextYear) lunarYearChanges++;
      }
    }
    if (!previous || key(previous)!==key(r)) groups.push({lunarYear:r.lunarYear,lunarMonth:r.lunarMonth,leap:r.leap,monthDays:r.monthDays,observedFrom:r.solarDate,observedUntil:r.solarDate,firstLunarDay:r.lunarDay,lastLunarDay:r.lunarDay,observedDays:0,start:r.lunarDay===1?{date:r.solarDate,evidence:'API_OBSERVED_DAY_1'}:{date:civil(day(r.solarDate)-r.lunarDay+1),evidence:'ARITHMETIC_BACK_CALCULATION_NOT_OBSERVED'},sourceDates:[]});
    const g = groups.at(-1); g.observedUntil=r.solarDate; g.lastLunarDay=r.lunarDay; g.observedDays++; g.sourceDates.push(r.solarDate);
    const result = index.fromLunarDate(index.fromGregorianDate(r.solarDate).value);
    check(result.status==='OK' && result.value===r.solarDate, 'ROUND_TRIP');
    try {
      const p = dayPillarForGregorianDate(r.solarDate), expected=p.stem+p.branch;
      const status=hanGanji(r.ganji.day)===expected?'MATCH':'MISMATCH'; dayComparisons[status]++;
      if(status==='MISMATCH') dayComparisons.details.push({date:r.solarDate,api:r.ganji.day,engine:expected});
    } catch(error) { if(error instanceof RangeError) dayComparisons.UNSUPPORTED++; else throw error; }
    previous=r;
  }
  for (const [i,g] of groups.entries()) {
    g.partial = g.firstLunarDay!==1 || g.lastLunarDay!==g.monthDays;
    check(!g.partial || i===0 || i===groups.length-1, 'INTERNAL_PARTIAL_MONTH');
    check(g.observedDays===g.lastLunarDay-g.firstLunarDay+1, 'MONTH_OBSERVED_LENGTH');
    if(!g.partial) check(g.observedDays===g.monthDays, 'MONTH_LENGTH_MISMATCH');
  }
  const events=solar.map(r=>{
    check(r.timeBasis==='API_KST_AS_PUBLISHED' && r.historicalCivilTime==='NOT_RESOLVED', 'TIME_POLICY_PROMOTION');
    check((r.time==='24:00') === (r.timeNotation==='AS_REPORTED_2400'), 'TIME_NOTATION_CONTRACT');
    const held = r.time==='24:00';
    return {...r,termCode:codes[TERMS.indexOf(r.term)],expectedLongitude:(285+TERMS.indexOf(r.term)*15)%360,expectedLongitudeEvidence:'DERIVED_FROM_TERM_RULE_NOT_API',timePolicyVersion:'preserve-api-published-minute-v1',timeStatus:held?'TIME_NOTATION_REVIEW_REQUIRED':r.time===null?'DAY_ONLY':'PUBLISHED_WALL_MINUTE_ONLY',computationalCivilDateTime:held||r.time===null?null:r.date+'T'+r.time,utcInstant:null};
  });
  const boundaryRequirements = {
    noRequestsPerformed:true,
    lunar:groups.filter(g=>g.partial).map(g=>({month:key(g),missingBefore:g.firstLunarDay>1?{from:g.start.date,untilExclusive:g.observedFrom,basis:'ARITHMETIC_ESTIMATE_REQUIRES_OBSERVATION'}:null,missingAfter:g.lastLunarDay<g.monthDays?{from:civil(day(g.observedUntil)+1),untilExclusive:civil(day(g.start.date)+g.monthDays),basis:'REPORTED_MONTH_LENGTH_ESTIMATE_REQUIRES_OBSERVATION'}:null})),
    followingLunarYearCompletion:{lunarYear:rows.at(-1).lunarYear,required:'Remaining terminal-month days, all following months through lunar month 12, and next lunar-year day 1 as end-exclusive witness; exact dates require evidence',fixturePlanningHint:to===2026?{from:'2027-01-01',throughInclusive:'2027-02-07',lunarMonth12Start:'2027-01-08',nextLunarYearDay1:'2027-02-07',evidence:'EXISTING_2025_2027_FIXTURE_PLANNING_ONLY_NOT_API_OBSERVATION'}:null,notIncluded:true},
    solar:[{year:from-1,month:12,term:'대설',purpose:'Prior Jie guard for January month selection',currentCollectorYearRangeAllows:from-1>=1950,status:'MISSING'}, {year:to+1,months:[1,2],minimumJieWitnesses:['소한','입춘'],additional24TermContinuityWitnesses:['대한'],purpose:'Next Jie / year boundary witnesses only; does not enable the next year',status:'MISSING_FROM_API_CANDIDATE'}],
    historicalTime:{status:'POLICY_UNRESOLVED',required:'Versioned historical civil-time and published API-clock interpretation evidence; no UTC conversion'},
  };
  const audit={kind:'INTERNAL_CONSISTENCY_NOT_INDEPENDENT_CALENDAR_CERTIFICATION',years:years.length,solar:solar.length,lunar:rows.length,uniqueDates:rows.length,from:index.from,untilExclusive:index.until,gaps:0,duplicates:0,outOfRange:0,perYear:years.map(y=>({year:y.year,lunar:y.lunar.length,solar:y.solar.length})),yearJoins,lunarYearChanges,monthTransitions:transitions,lunarGroups:groups.length,observedDay1:rows.filter(r=>r.lunarDay===1).length,partialMonths:groups.filter(g=>g.partial).map(({sourceDates,...g})=>g),nullMonthGanji:rows.filter(r=>r.ganji.month===null).length,nullMonthGanjiGroups:nullGroups.size,regularMonthNulls:0,missingSunLongitude:solar.filter(r=>r.sunLongitude===null).length,published2400:events.filter(r=>r.timeStatus==='TIME_NOTATION_REVIEW_REQUIRED'),roundTrips:rows.length,anomalies};
  return {schemaVersion:RESEARCH_VERSION,evidenceProfile:'KASI_OPENAPI_RESPONSE_UNVERIFIED_INPUT',rawValidation:'NOT_PERFORMED_IN_PURE_COMPILER',normalizerVersion:'0.1.2',status:'RESEARCH_ONLY',support:{from:index.from,untilExclusive:index.until,scope:'CIVIL_DATE_LOOKUP_ONLY',engineSupportPromotion:false,g1P2Promotion:false},audit,events,months:groups,dates:rows,boundaryRequirements,dayComparisons};
}

export async function inventory(directory, prefix='') {
  const result=[];
  for(const name of (await readdir(join(directory,prefix))).sort()) {
    const path=join(prefix,name), stat=await lstat(join(directory,path));
    check(!stat.isSymbolicLink(), 'INPUT_SYMLINK');
    if(stat.isDirectory()) result.push(...await inventory(directory,path));
    else {check(stat.isFile(),'INPUT_NOT_REGULAR'); result.push({path:path.replaceAll('\\','/'),bytes:stat.size,sha256:sha(await readFile(join(directory,path)))});}
  }
  return result;
}

/** Rebuild each year offline, verifying actual raw files, page receipts and saved years. */
export async function loadVerified(input, expectedExportSha256, range) {
  check(/^[a-f0-9]{64}$/.test(expectedExportSha256), 'EXPECTED_EXPORT_SHA_REQUIRED');
  const before=await inventory(input), bytes=await readFile(join(input,'export.json'));
  check(sha(bytes)===expectedExportSha256, 'EXPORT_FILE_DIGEST_CHANGED');
  const exported=JSON.parse(bytes), summary=JSON.parse(await readFile(join(input,'summary.json'),'utf8'));
  check(exported.schemaVersion==='kasi-collector-export-v1' && exported.externalOriginalVerification==='UNVERIFIED' && exported.rightsReview==='UNVERIFIED', 'EXPORT_CONTRACT');
  check(summary.status==='COMPLETE' && summary.from===range.from && summary.to===range.to && summary.yearCount===range.to-range.from+1, 'SUMMARY_SCOPE');
  check(Array.isArray(exported.years) && exported.years.length===range.to-range.from+1 && exported.years.every((y,i)=>y.year===range.from+i), 'EXPORT_YEAR_SCOPE');
  const store=new Store(input);
  // Only read/load are exposed. Any attempt to write or request fails immediately.
  const readOnly={read:n=>store.read(n),load:q=>store.load(q),save:()=>{throw new Error('INPUT_WRITE_FORBIDDEN');},json:()=>{throw new Error('INPUT_WRITE_FORBIDDEN');}};
  const collector=new Collector(readOnly,{request:()=>{throw new Error('NETWORK_FORBIDDEN');}},'xml','monthly');
  const references=[], rowSources=new Map(), solJd=[];
  for(const y of exported.years) {
    check(y.requestedFormat==='xml' && y.lunarMode==='monthly', 'RESEARCH_INPUT_MODE');
    const rebuilt=await collector.validateYear(y.year);
    check(fingerprint(y)===fingerprint(rebuilt),'EXPORT_REBUILD_MISMATCH');
    for(const source of y.sources) {
      const loaded=await store.load(source.query);
      check(loaded && fingerprint(loaded.receipt)===fingerprint(source), 'EXPORT_SOURCE_RECEIPT_CHANGED');
      const id=fingerprint(source); references.push({id,...source});
      for(const item of parsePage(loaded.body).items) {
        const q=source.query, row=q.service==='solar'?normalizeSolar(item,q.year):normalizeLunar(item,q.year,q.month,q.day);
        const rowId=q.service==='solar'?'solar:'+row.date+':'+row.term:'lunar:'+row.solarDate;
        check(!rowSources.has(rowId),'SOURCE_ROW_DUPLICATE'); rowSources.set(rowId,id);
        if(q.service==='lunar' && item.solJd!==undefined) {
          const text=String(item.solJd).trim(); check(/^\d+$/.test(text),'SOLJD_INVALID');
          solJd.push({date:row.solarDate,solJd:Number(text),sourceRef:id});
        }
      }
    }
  }
  check(new Set(references.map(r=>r.id)).size===references.length,'SOURCE_DUPLICATE');
  for(let i=1;i<solJd.length;i++) check(solJd[i].solJd-solJd[i-1].solJd===day(solJd[i].date)-day(solJd[i-1].date),'SOLJD_DISCONTINUITY');
  check(summary.solarCount===exported.years.reduce((n,y)=>n+y.solar.length,0) && summary.lunarCount===exported.years.reduce((n,y)=>n+y.lunar.length,0),'SUMMARY_COUNTS');
  const after=await inventory(input); check(fingerprint(before)===fingerprint(after),'INPUT_CHANGED_DURING_AUDIT');
  return {years:exported.years,files:before,references,rowSources,solJd,summary};
}

export async function compareFixtures(candidate) {
  const solar=solarFixture.filter(r=>r.displayedDateTime.startsWith('2026-') || r.displayedDateTime.startsWith('2025-'));
  const solarResults=solar.map(f=>{
    const api=candidate.events.find(r=>r.termCode===f.term && r.date.slice(0,4)===f.displayedDateTime.slice(0,4));
    return {fixture:f.displayedDateTime,term:f.term,api:api?api.date+'T'+api.time:null,status:!api?'UNSUPPORTED':api.timeStatus==='TIME_NOTATION_REVIEW_REQUIRED'?'POLICY_UNRESOLVED':api.date+'T'+api.time===f.displayedDateTime?'MATCH':'MISMATCH',comparison:'PUBLISHED_CLOCK_LABEL_ONLY_NOT_UTC'};
  });
  const independent=JSON.parse(await readFile(join(root,'test/fixtures/independent-korean-lunar-1999-2000.json'),'utf8')).corpus;
  const index=createResearchIndex(candidate.dates);
  const lunarResults=[lunarFixture,independent].map(corpus=>{
    const converter=createKoreanLunisolarConverter(corpus), counts={MATCH:0,MISMATCH:0,UNSUPPORTED:0}, details=[], months=[];
    for(const r of candidate.dates) {
      if(r.solarDate<corpus.supportedGregorianFromInclusive || r.solarDate>=corpus.supportedGregorianUntilExclusive) continue;
      const f=converter.fromGregorianDate(r.solarDate), v={lunarYear:r.lunarYear,lunarMonth:r.lunarMonth,lunarDay:r.lunarDay,isLeapMonth:r.leap};
      const status=f.status!=='OK'?'UNSUPPORTED':fingerprint(f.value)===fingerprint(v)?'MATCH':'MISMATCH'; counts[status]++;
      if(status==='MISMATCH') details.push({date:r.solarDate,api:v,fixture:f});
    }
    for(const f of corpus.months) {
      const g=candidate.months.find(r=>key(r)===monthKey(f.lunarYear,f.lunarMonth,f.isLeapMonth));
      months.push({month:monthKey(f.lunarYear,f.lunarMonth,f.isLeapMonth),status:!g?'UNSUPPORTED':g.start.date===f.gregorianStart && g.monthDays===f.days?'MATCH':'MISMATCH',startEvidence:g?.start.evidence??null,partial:g?.partial??null});
    }
    return {corpusId:corpus.corpusId,counts,details,months};
  });
  return {scope:'FIXTURE_OVERLAP_ONLY_NOT_FULL_EXTERNAL_CERTIFICATION',solar:solarResults,lunar:lunarResults,dayPillar:candidate.dayComparisons,roundTrips:{status:'MATCH',count:candidate.audit.roundTrips,meaning:'INTERNAL_LOOKUP_REVERSIBILITY_ONLY'},outsideSupport:[index.fromGregorianDate(civil(day(index.from)-1)),index.fromGregorianDate(index.until)]};
}

/** Pin the separately recorded manifest digest before reading a saved candidate. */
export async function loadCandidate(directory, expectedManifestContentSha256) {
  check(/^[a-f0-9]{64}$/.test(expectedManifestContentSha256),'EXPECTED_MANIFEST_SHA_REQUIRED');
  const manifest=JSON.parse(await readFile(join(directory,'manifest.json'),'utf8'));
  check(manifest.schemaVersion==='kasi-private-snapshot-v1' && fingerprint(manifest)===expectedManifestContentSha256,'MANIFEST_DIGEST_CHANGED');
  const values=new Map();
  const names=['candidate.json','comparisons.json','boundary-requirements.json','soljd-audit.json','source-references.json','exceptions.json'];
  check(manifest.derived.length===names.length && new Set(manifest.derived.map(f=>f.path)).size===names.length,'DERIVED_FILE_SET');
  for(const file of manifest.derived) {
    check(names.includes(file.path),'DERIVED_PATH');
    const bytes=await readFile(join(directory,file.path));
    check(sha(bytes)===file.sha256,'DERIVED_FILE_DIGEST_CHANGED');
    const value=JSON.parse(bytes);check(fingerprint(value)===file.contentSha256,'DERIVED_CONTENT_DIGEST_CHANGED');values.set(file.path,value);
  }
  const candidate=values.get('candidate.json');
  check(candidate.schemaVersion===RESEARCH_VERSION && candidate.status==='RESEARCH_ONLY' && candidate.support.engineSupportPromotion===false && candidate.support.g1P2Promotion===false,'CANDIDATE_CONTRACT');
  const index=createResearchIndex(candidate.dates);
  check(index.from===candidate.support.from && index.until===candidate.support.untilExclusive,'CANDIDATE_COVERAGE');
  return {manifest,candidate,index,comparisons:values.get('comparisons.json')};
}

function git(args) {return execFileSync('git',['-c','safe.directory='+root.replaceAll('\\','/'),'-c','core.quotepath=false',...args],{cwd:root,encoding:'utf8',stdio:['ignore','pipe','pipe']}).trim();}
async function codeIdentity() {
  const files=git(['ls-files','--cached','--others','--exclude-standard','src','scripts','test','package.json','package-lock.json','tsconfig.json','tsconfig.kasi.json']).split('\n').filter(Boolean);
  const hashes=[];
  for(const path of files) hashes.push({path,sha256:sha(await readFile(join(root,path)))});
  const buildFiles=[...(await inventory(join(root,'dist'))).map(f=>({...f,path:'dist/'+f.path})),...(await inventory(join(root,'.kasi-build'))).map(f=>({...f,path:'.kasi-build/'+f.path}))];
  return {head:git(['rev-parse','HEAD']),codeTreeSha256:fingerprint(hashes),buildTreeSha256:fingerprint(buildFiles),files:hashes};
}
function contained(parent,child) {const r=relative(parent,child);return r!=='' && !r.startsWith('..') && !isAbsolute(r);}
export async function runResearch({input,out,expectedExportSha256,from=1950,to=2026}) {
  const privateRoot=await realpath(join(root,'.private')), inputRoot=await realpath(resolve(input)), output=resolve(out);
  check(contained(privateRoot,inputRoot),'INPUT_MUST_BE_PRIVATE');
  check(contained(privateRoot,output) && !contained(inputRoot,output) && !contained(output,inputRoot) && output!==inputRoot,'OUTPUT_MUST_BE_SEPARATE_PRIVATE');
  check(await realpath(dirname(output))===dirname(output),'OUTPUT_PARENT_MUST_EXIST_WITHOUT_SYMLINK');
  const identity=await codeIdentity(), verified=await loadVerified(inputRoot,expectedExportSha256,{from,to});
  const candidate=compileRows(verified.years,{from,to});
  candidate.evidenceProfile='KASI_OPENAPI_RESPONSE_LOCAL_HASH_CHECKED_NOT_ANNUAL_TXT';
  candidate.rawValidation='ACTUAL_LOCAL_RAW_RECEIPT_YEAR_EXPORT_REBUILD';
  for(const r of candidate.dates) {r.sourceRef=verified.rowSources.get('lunar:'+r.solarDate);check(r.sourceRef,'LUNAR_SOURCE_MISSING');}
  for(const r of candidate.events) {r.sourceRef=verified.rowSources.get('solar:'+r.date+':'+r.term);check(r.sourceRef,'SOLAR_SOURCE_MISSING');}
  for(const g of candidate.months) {g.sourceRefs=[...new Set(g.sourceDates.map(d=>verified.rowSources.get('lunar:'+d)))];delete g.sourceDates;}
  check(verified.rowSources.size===candidate.dates.length+candidate.events.length,'SOURCE_ROW_COVERAGE');
  const comparisons=await compareFixtures(candidate);
  const exceptions={schemaVersion:'kasi-api-exceptions-v1',
    nullCalendarMonthGanji:candidate.months.flatMap(g=>{
      const missing=candidate.dates.filter(r=>key(r)===key(g) && r.ganji.month===null);
      return missing.length?[{month:key(g),leap:g.leap,rows:missing.length,from:missing[0].solarDate,through:missing.at(-1).solarDate,sourceRefs:[...new Set(missing.map(r=>r.sourceRef))],disposition:'PRESERVE_API_NULL_NOT_PILLAR_MONTH'}]:[];
    }),
    timeNotationReview:candidate.events.filter(r=>r.timeStatus==='TIME_NOTATION_REVIEW_REQUIRED'),
    missingApiLongitude:candidate.events.filter(r=>r.sunLongitude===null).map(r=>({date:r.date,term:r.term,sourceRef:r.sourceRef,disposition:'PRESERVE_NULL_EXPECTED_LONGITUDE_SEPARATE'})),
    partialMonths:candidate.audit.partialMonths,historicalTime:{events:candidate.events.length,status:'NOT_RESOLVED',utcInstantsCreated:0}};
  const contents={'candidate.json':candidate,'comparisons.json':comparisons,'boundary-requirements.json':candidate.boundaryRequirements,'soljd-audit.json':{scope:'RAW_ONLY_SEPARATE_EXTRACTION',count:verified.solJd.length,rows:verified.solJd},'source-references.json':verified.references,'exceptions.json':exceptions};
  const derived=Object.entries(contents).map(([path,value])=>({path,sha256:sha(JSON.stringify(value,null,2)+'\n'),contentSha256:fingerprint(value)}));
  const rawFiles=verified.files.filter(f=>f.path.startsWith('raw/')), pageFiles=verified.files.filter(f=>f.path.startsWith('pages/'));
  const linkedRaw=new Set(verified.references.map(r=>'raw/'+r.responseSha256+'.body'));
  const manifest={schemaVersion:'kasi-private-snapshot-v1',compilerVersion:RESEARCH_VERSION,inputFormat:'kasi-collector-export-v1 / XML entity / kasi-page-v1 / kasi-collector-year-v1',normalizerVersion:'0.1.2',actualResponseFormats:[...new Set(verified.references.map(r=>r.schema.format))].sort(),range:{from:from+'-01-01',untilExclusive:(to+1)+'-01-01'},counts:{years:candidate.audit.years,solar:candidate.audit.solar,lunar:candidate.audit.lunar,raw:rawFiles.length,pages:pageFiles.length},inputExportSha256:expectedExportSha256,inputFiles:verified.files,inputTreeSha256:fingerprint(verified.files),codeTreeSha256:identity.codeTreeSha256,derived,rawLinkage:{status:'ACTUAL_LOCAL_FILES_HASHED_AND_REBUILT',references:verified.references.length,rows:verified.rowSources.size,unreferencedRaw:rawFiles.filter(f=>!linkedRaw.has(f.path)).map(f=>f.path),solJdRows:verified.solJd.length},checksPerformed:['all input file hashes before/after','existing Store.load actual raw/receipt/schema hashes','existing Collector.validateYear cache-only full rebuild','export equality against rebuild','whole-period civil/lunar/month/day-cycle continuity','published time notation and null preservation','overlapping fixture comparisons','bounded civil-date lookup round trips'],checksNotPerformed:['live API requests','API/server authenticity signature','annual TXT original row/digest authentication','redistribution rights approval','historical civil-time or UTC interpretation','time-inclusive Four Pillars validation','production integration'],apiRequests:0,sourceChanged:false};
  const finalFiles=await inventory(inputRoot);check(fingerprint(verified.files)===fingerprint(finalFiles),'INPUT_CHANGED_DURING_COMPILE');
  const finalIdentity=await codeIdentity();
  check(finalIdentity.codeTreeSha256===identity.codeTreeSha256 && finalIdentity.buildTreeSha256===identity.buildTreeSha256,'CODE_CHANGED_DURING_COMPILE');
  manifest.buildTreeSha256=identity.buildTreeSha256;
  // Exclusive directory creation: never replace a prior snapshot or completion input.
  await mkdir(output,{mode:0o700});
  for(const [name,value] of Object.entries({...contents,'manifest.json':manifest,'run-metadata.json':{executedAt:new Date().toISOString(),node:process.version,head:identity.head,codeTreeSha256:identity.codeTreeSha256,manifestContentSha256:fingerprint(manifest)}})) await writeFile(join(output,name),JSON.stringify(value,null,2)+'\n',{flag:'wx',mode:0o600});
  return {status:'RESEARCH_CANDIDATE_CREATED',manifestContentSha256:fingerprint(manifest),codeTreeSha256:identity.codeTreeSha256,audit:candidate.audit,comparisonSummary:{solar:comparisons.solar.reduce((a,r)=>(a[r.status]=(a[r.status]??0)+1,a),{}),lunar:comparisons.lunar.map(r=>({corpusId:r.corpusId,...r.counts,months:r.months.reduce((a,m)=>(a[m.status]=(a[m.status]??0)+1,a),{})})),dayPillar:candidate.dayComparisons},apiRequests:0};
}

if(process.argv[1] && import.meta.url===pathToFileURL(resolve(process.argv[1])).href) {
  try {
    const args=process.argv.slice(2), options={};
    check(args.length===10,'ARGS_REQUIRE_INPUT_OUT_EXPECTED_EXPORT_SHA_FROM_TO');
    for(let i=0;i<args.length;i+=2) {check(['--input','--out','--expected-export-sha','--from','--to'].includes(args[i]) && !Object.hasOwn(options,args[i]),'ARGS');options[args[i]]=args[i+1];}
    console.log(JSON.stringify(await runResearch({input:options['--input'],out:options['--out'],expectedExportSha256:options['--expected-export-sha'],from:Number(options['--from']),to:Number(options['--to'])}),null,2));
  } catch(error) {console.error('RESEARCH_REJECTED',error.code??error.message);process.exitCode=1;}
}
