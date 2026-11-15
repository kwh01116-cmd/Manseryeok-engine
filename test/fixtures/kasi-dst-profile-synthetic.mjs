/** Public generated connection data, NOT KASI raw, a real Korean lunar calendar,
 * or an independent Four Pillars oracle. No existing Sprint4 fixture is changed. */
import {fingerprint,sha,parsePage,normalizeSolar,normalizeLunar,TERMS} from '../../.kasi-build/schema.js';
import {gregorianDayNumber as day,gregorianDateFromDayNumber as civil,monthKey} from '../../dist/calendar/koreanLunisolarValidation.js';
import {sealSyntheticLocalChartCandidate} from './kasi-local-chart-synthetic.mjs';
import {NAOJ_1987_STANDARD_MINUTES as y87,NAOJ_1988_STANDARD_MINUTES as y88} from './korean-dst1987-clock-cases.mjs';
export const DST_PROFILE_SYNTHETIC_BASIS=Object.freeze({nature:'GENERATED_SYNTHETIC_NOT_KASI_NOT_REAL_LUNAR_ORACLE',range:['1987-01-01','1989-01-01'],guard:'1986_DAXUE_SYNTHETIC',purpose:'PROFILE_CLOCK_AND_EXISTING_FACT_REPORT_CONNECTION_ONLY'});
function source(query,items){
 const body='<response><header><resultCode>00</resultCode></header><body><items>'+items.map(item=>'<item>'+Object.entries(item).map(([k,v])=>`<${k}>${v}</${k}>`).join('')+'</item>').join('')+'</items><pageNo>1</pageNo><numOfRows>100</numOfRows><totalCount>'+items.length+'</totalCount></body></response>';
 const record={evidenceSurface:'KASI_OPENAPI_RESPONSE',responseHashScope:'UTF8_ENTITY_AFTER_HTTP_DECOMPRESSION',fixtureNature:DST_PROFILE_SYNTHETIC_BASIS.nature,query,requestedAt:'2026-11-15T09:00:00.000Z',serviceId:query.service==='solar'?'15012690':'15012679',operation:query.service==='solar'?'get24DivisionsInfo':'getLunCalInfo',responseSha256:sha(body),schema:parsePage(body).schema};return {id:fingerprint(record),...record};
}
export function syntheticDstProfileCandidate(){
 const sources=[],events=[],dates=[],months=[];
 for(const year of [1986,1987,1988]){
  const table=year===1986?[['DAXUE','1986-12-07T12:00']]:year===1987?y87:y88;
  const items=table.map(([term,minute])=>({dateName:TERMS[(year===1986?y87:table).findIndex(([t])=>t===term)],locdate:minute.slice(0,10).replaceAll('-',''),kst:minute.slice(11).replace(':','')}));
  const receipt=source({service:'solar',year,page:1,format:'xml'},items);sources.push(receipt);
  for(let i=0;i<items.length;i++){const row=normalizeSolar(items[i],year);events.push({...row,termCode:table[i][0],expectedLongitude:year===1986?255:(285+i*15)%360,expectedLongitudeEvidence:'DERIVED_FROM_TERM_RULE_NOT_API',timePolicyVersion:'preserve-api-published-minute-v1',timeStatus:'PUBLISHED_WALL_MINUTE_ONLY',computationalCivilDateTime:row.date+'T'+row.time,utcInstant:null,sourceRef:receipt.id});}
 }
 let lunarYear=1986,lunarMonth=11,lunarDay=20,leap=false;
 const length=()=>leap?30:lunarMonth%2?30:29,grouped=new Map();
 for(let n=day('1987-01-01');n<day('1989-01-01');n++){
  const [sy,sm,sd]=civil(n).split('-').map(Number),key=sy+':'+sm;if(!grouped.has(key))grouped.set(key,[]);
  grouped.get(key).push({solYear:sy,solMonth:sm,solDay:sd,lunYear:lunarYear,lunMonth:lunarMonth,lunDay:lunarDay,lunNday:length(),lunLeapmonth:leap?'윤':'평',lunSecha:'갑자(甲子)',lunWolgeon:leap?'':'갑자(甲子)',lunIljin:'갑자(甲子)'});
  if(++lunarDay>length()){lunarDay=1;if(lunarYear===1987&&lunarMonth===6&&!leap)leap=true;else{leap=false;if(++lunarMonth===13){lunarMonth=1;lunarYear++;}}}
 }
 for(const items of grouped.values()){const year=items[0].solYear,month=items[0].solMonth,receipt=source({service:'lunar',year,month,page:1,format:'xml'},items);sources.push(receipt);dates.push(...items.map(raw=>({...normalizeLunar(raw,year,month),sourceRef:receipt.id})));}
 for(const row of dates){const key=monthKey(row.lunarYear,row.lunarMonth,row.leap),last=months.at(-1);if(!last||monthKey(last.lunarYear,last.lunarMonth,last.leap)!==key)months.push({lunarYear:row.lunarYear,lunarMonth:row.lunarMonth,leap:row.leap,monthDays:row.monthDays,start:{date:civil(day(row.solarDate)-row.lunarDay+1),evidence:row.lunarDay===1?'API_OBSERVED_DAY_1':'ARITHMETIC_BACK_CALCULATION_NOT_OBSERVED'},observedFrom:row.solarDate,observedUntil:row.solarDate,firstLunarDay:row.lunarDay,lastLunarDay:row.lunarDay,observedDays:0,partial:false,sourceRefs:[]});const group=months.at(-1);group.observedUntil=row.solarDate;group.lastLunarDay=row.lunarDay;group.observedDays++;if(!group.sourceRefs.includes(row.sourceRef))group.sourceRefs.push(row.sourceRef);}
 for(const group of months)group.partial=group.firstLunarDay!==1||group.lastLunarDay!==group.monthDays;
 const candidate={schemaVersion:'kasi-api-research-v1',evidenceProfile:DST_PROFILE_SYNTHETIC_BASIS.nature,rawValidation:'GENERATED_NOT_ACTUAL_API_RESPONSE',normalizerVersion:'0.1.2',status:'RESEARCH_ONLY',support:{from:'1987-01-01',untilExclusive:'1989-01-01',scope:'CIVIL_DATE_LOOKUP_ONLY',engineSupportPromotion:false,g1P2Promotion:false},events,dates,months,audit:{years:2,solar:49,lunar:731},boundaryRequirements:{synthetic:true,...DST_PROFILE_SYNTHETIC_BASIS},dayComparisons:{SYNTHETIC_NOT_A_CALENDAR_ORACLE:true,details:[]}};
 return sealSyntheticLocalChartCandidate(candidate,sources);
}

// Fixed independently of both new resolvers. Civil-midnight/selected-day only.
// Day indexes from accepted2000-01-07甲子:46,16,38,29,50,55,56 respectively.
// Month stems:丁year壬寅 progression;戊year甲寅 progression;Jan1 uses prior丙year.
export const DST_FIXED_NATAL_EXPECTATIONS=Object.freeze([
 {date:'1987-01-01',time:'12:00',standardMinute:'1987-01-01T12:00',pillars:['丙寅','庚子','庚戌','壬午']},
 {date:'1987-06-01',time:'00:30',standardMinute:'1987-05-31T23:30',pillars:['丁卯','乙巳','庚辰','丙子']},
 {date:'1987-06-22',time:'08:11',standardMinute:'1987-06-22T07:11',pillars:['丁卯','丙午','壬寅','甲辰']},
 {date:'1987-10-11',time:'03:00',standardMinute:'1987-10-11T03:00',pillars:['丁卯','庚戌','癸巳','甲寅']},
 {date:'1988-02-29',time:'12:00',standardMinute:'1988-02-29T12:00',pillars:['戊辰','甲寅','甲寅','庚午']},
 {date:'1988-09-01',time:'23:30',standardMinute:'1988-09-01T22:30',pillars:['戊辰','庚申','己未','乙亥']},
 {date:'1988-12-31',time:'23:30',standardMinute:'1988-12-31T23:30',pillars:['戊辰','甲子','庚申','丙子']},
].map(Object.freeze));
