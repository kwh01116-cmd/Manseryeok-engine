// Generated responses for connection tests. These are not calendar oracles or KASI data.
import { writeFile, mkdir } from 'node:fs/promises';
import { join } from 'node:path';
import { fingerprint, sha, parsePage, normalizeSolar, normalizeLunar, TERMS } from '../../.kasi-build/schema.js';
import { SOLAR_TERM_CODES } from '../../dist/calendar/solarTerms.js';
import { dayPillarForGregorianDate } from '../../dist/calendar/dayPillar.js';
import { gregorianDayNumber as day, gregorianDateFromDayNumber as civil, monthKey } from '../../dist/calendar/koreanLunisolarValidation.js';
import { createResearchIndex } from '../../scripts/kasi/candidate.mjs';

const xml = items => '<response><header><resultCode>00</resultCode></header><body><items>'+items.map(item=>'<item>'+Object.entries(item).map(([k,v])=>`<${k}>${v}</${k}>`).join('')+'</item>').join('')+'</items><pageNo>1</pageNo><numOfRows>100</numOfRows><totalCount>'+items.length+'</totalCount></body></response>';
const bytes = value => JSON.stringify(value,null,2)+'\n';
function source(query,items) {
  const body=xml(items), receipt={evidenceSurface:'KASI_OPENAPI_RESPONSE',responseHashScope:'UTF8_ENTITY_AFTER_HTTP_DECOMPRESSION',query,requestedAt:'2026-01-01T00:00:00.000Z',serviceId:query.service==='solar'?'15012690':'15012679',operation:query.service==='solar'?'get24DivisionsInfo':'getLunCalInfo',responseSha256:sha(body),schema:parsePage(body).schema};
  return {id:fingerprint(receipt),...receipt};
}

export function syntheticLocalChartCandidate({lichunTime='01:20',dropGuard=false}={}) {
  const rawSolar=TERMS.map((dateName,i)=>({dateName,locdate:`2026${String(Math.floor(i/2)+1).padStart(2,'0')}${i%2?'20':'05'}`,kst:(i===2?lichunTime:'01:20').replace(':','')}));
  const currentSource=source({service:'solar',year:2026,page:1,format:'xml'},rawSolar);
  const rawGuard={dateName:'대설',locdate:'20251205',kst:'0120'}, guardSource=source({service:'solar',year:2025,page:1,format:'xml'},[rawGuard]);
  const sources=[currentSource,...(dropGuard?[]:[guardSource])];
  const events=rawSolar.map((item,i)=>({...normalizeSolar(item,2026),termCode:SOLAR_TERM_CODES[i],expectedLongitude:(285+i*15)%360,expectedLongitudeEvidence:'DERIVED_FROM_TERM_RULE_NOT_API',timePolicyVersion:'preserve-api-published-minute-v1',timeStatus:'PUBLISHED_WALL_MINUTE_ONLY',computationalCivilDateTime:`2026-${String(Math.floor(i/2)+1).padStart(2,'0')}-${i%2?'20':'05'}T${i===2?lichunTime:'01:20'}`,utcInstant:null,sourceRef:currentSource.id}));
  if(!dropGuard) events.unshift({...normalizeSolar(rawGuard,2025),termCode:'DAXUE',expectedLongitude:255,expectedLongitudeEvidence:'DERIVED_FROM_TERM_RULE_NOT_API',timePolicyVersion:'preserve-api-published-minute-v1',timeStatus:'PUBLISHED_WALL_MINUTE_ONLY',computationalCivilDateTime:'2025-12-05T01:20',utcInstant:null,sourceRef:guardSource.id});
  const rawDays=[];
  let lunarYear=2025,lunarMonth=11,lunarDay=13,leap=false;
  for(let n=day('2026-01-01');n<day('2027-01-01');n++) {
    const solarDate=civil(n),[sy,sm,sd]=solarDate.split('-').map(Number),p=dayPillarForGregorianDate(solarDate);
    rawDays.push({solYear:sy,solMonth:sm,solDay:sd,lunYear:lunarYear,lunMonth:lunarMonth,lunDay:lunarDay,lunNday:29,lunLeapmonth:leap?'윤':'평',lunSecha:'갑자(甲子)',lunWolgeon:leap?'':'갑자(甲子)',lunIljin:p.stem+p.branch});
    if(++lunarDay===30) {lunarDay=1;if(lunarMonth===5&&!leap)leap=true;else{leap=false;if(++lunarMonth===13){lunarMonth=1;lunarYear++;}}}
  }
  const dates=[];
  for(let month=1;month<=12;month++) {
    const items=rawDays.filter(r=>r.solMonth===month),receipt=source({service:'lunar',year:2026,month,page:1,format:'xml'},items);sources.push(receipt);
    dates.push(...items.map(r=>({...normalizeLunar(r,2026,month),sourceRef:receipt.id})));
  }
  const months=[];
  for(const r of dates) {
    const k=monthKey(r.lunarYear,r.lunarMonth,r.leap),previous=months.at(-1);
    if(!previous || monthKey(previous.lunarYear,previous.lunarMonth,previous.leap)!==k) months.push({lunarYear:r.lunarYear,lunarMonth:r.lunarMonth,leap:r.leap,monthDays:r.monthDays,start:{date:civil(day(r.solarDate)-r.lunarDay+1),evidence:r.lunarDay===1?'API_OBSERVED_DAY_1':'ARITHMETIC_BACK_CALCULATION_NOT_OBSERVED'},observedFrom:r.solarDate,observedUntil:r.solarDate,firstLunarDay:r.lunarDay,lastLunarDay:r.lunarDay,observedDays:0,partial:false,sourceRefs:[]});
    const g=months.at(-1);g.observedUntil=r.solarDate;g.lastLunarDay=r.lunarDay;g.observedDays++;if(!g.sourceRefs.includes(r.sourceRef))g.sourceRefs.push(r.sourceRef);
  }
  for(const g of months)g.partial=g.firstLunarDay!==1 || g.lastLunarDay!==g.monthDays;
  const candidate={schemaVersion:'kasi-api-research-v1',evidenceProfile:'KASI_OPENAPI_RESPONSE_LOCAL_HASH_CHECKED_NOT_ANNUAL_TXT',rawValidation:'ACTUAL_LOCAL_RAW_RECEIPT_YEAR_EXPORT_REBUILD',normalizerVersion:'0.1.2',status:'RESEARCH_ONLY',support:{from:'2026-01-01',untilExclusive:'2027-01-01',scope:'CIVIL_DATE_LOOKUP_ONLY',engineSupportPromotion:false,g1P2Promotion:false},events,dates,months,audit:{years:1,solar:events.length,lunar:dates.length},boundaryRequirements:{synthetic:true},dayComparisons:{MATCH:365,MISMATCH:0,UNSUPPORTED:0,details:[]}};
  return sealSyntheticLocalChartCandidate(candidate,sources);
}

/** A changed synthetic dataset gets its own caller-held pin; this never bypasses a real-data pin. */
export function sealSyntheticLocalChartCandidate(candidate,sources) {
  const contents={'candidate.json':candidate,'comparisons.json':{synthetic:true},'boundary-requirements.json':candidate.boundaryRequirements,'soljd-audit.json':{synthetic:true,rows:[]},'source-references.json':sources,'exceptions.json':{synthetic:true}};
  const manifest={schemaVersion:'kasi-private-snapshot-v1',compilerVersion:'kasi-api-research-v1',normalizerVersion:'0.1.2',inputExportSha256:sha('generated-synthetic-export'),range:{from:candidate.support.from,untilExclusive:candidate.support.untilExclusive},counts:{years:1,solar:candidate.events.length,lunar:candidate.dates.length,raw:sources.length,pages:sources.length},apiRequests:0,sourceChanged:false,derived:Object.entries(contents).map(([path,value])=>({path,sha256:sha(bytes(value)),contentSha256:fingerprint(value)}))};
  return {loaded:{candidate,manifest,sources,index:createResearchIndex(candidate.dates)},expectedManifestSha256:fingerprint(manifest),contents};
}

export async function writeSyntheticLocalChartCandidate(directory,fixture=syntheticLocalChartCandidate()) {
  await mkdir(directory,{recursive:true});
  for(const [name,value] of Object.entries({...fixture.contents,'manifest.json':fixture.loaded.manifest})) await writeFile(join(directory,name),bytes(value),{flag:'wx'});
  return fixture;
}

export function chartRequest(date='2026-06-01',time='12:00',dayRollover='CIVIL_MIDNIGHT',hourStemReference='SELECTED_DAY_PILLAR') {
  return {calendar:'GREGORIAN',date,time,policies:{clockPolicyId:'KR_API_PUBLISHED_KST_MODERN_1988_POST_DST_V1',dayRollover,hourStemReference}};
}

export function chartSemantics(result) {
  return {status:result.status,gregorianDate:result.input.gregorianDate,time:result.input.time,confidence:result.chart.confidence,effectiveDayDate:result.chart.effectiveDayDate,candidates:result.chart.candidates,contexts:result.chart.monthBoundaryTrace.candidateContexts.map(({candidateIndex,monthBranch,boundarySide,activeSince})=>({candidateIndex,monthBranch,boundarySide,activeSince:{term:activeSince.term,displayedDateTime:activeSince.displayedDateTime,timeBasis:activeSince.timeBasis,sourcePrecision:activeSince.sourcePrecision}}))};
}
