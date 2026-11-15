/** Parser/lineage contract input only. These dates are not a real lunar calendar. */
import {fingerprint,sha,parsePage} from '../../.kasi-build/schema.js';
const terms=['소한','대한','입춘','우수','경칩','춘분','청명','곡우','입하','소만','망종','하지','소서','대서','입추','처서','백로','추분','한로','상강','입동','소설','대설','동지'];
const wrap=items=>'<?xml version="1.0" encoding="UTF-8"?><response><header><resultCode>00</resultCode><resultMsg>NORMAL SERVICE.</resultMsg></header><body><items>'+items.join('')+'</items><numOfRows>100</numOfRows><pageNo>1</pageNo><totalCount>'+items.length+'</totalCount></body></response>';
const item=fields=>'<item>'+Object.entries(fields).map(([key,value])=>'<'+key+'>'+value+'</'+key+'>').join('')+'</item>';
export function syntheticApiSource({service='lunar',year=2026,month=1,requestedAt='2026-11-15T00:00:00.000Z',alterItem}={}){
  const data=service==='solar'?terms.map((term,i)=>({dateKind:'01',dateName:term,isHoliday:'N',kst:'1200',locdate:String(year)+String(Math.floor(i/2)+1).padStart(2,'0')+(i%2?'15':'01'),seq:String(i+1)})):Array.from({length:31},(_,i)=>({solYear:String(year),solMonth:'01',solDay:String(i+1).padStart(2,'0'),lunYear:String(year),lunMonth:i<30?'01':'02',lunDay:String(i<30?i+1:1).padStart(2,'0'),lunLeapmonth:'평',lunNday:'30',lunSecha:'甲子',lunWolgeon:'甲子',lunIljin:'甲子'}));
  if(alterItem)alterItem(data);
  const body=wrap(data.map(item)),query={service,year,page:1,format:'xml',...(service==='lunar'?{month}:{})},receipt={evidenceSurface:'KASI_OPENAPI_RESPONSE',responseHashScope:'UTF8_ENTITY_AFTER_HTTP_DECOMPRESSION',query,requestedAt,serviceId:service==='lunar'?'15012679':'15012690',operation:service==='lunar'?'getLunCalInfo':'get24DivisionsInfo',responseSha256:sha(body),schema:parsePage(body).schema},id=fingerprint(receipt);
  return {record:{id,...receipt},raw:{sourceRef:id,body}};
}
export const EXPECTED_FIRST_SYNTHETIC_DATE=Object.freeze({kind:'lunar',solarDate:'2026-01-01',lunarYear:2026,lunarMonth:1,lunarDay:1,leap:false,monthDays:30,ganji:{year:'甲子',month:'甲子',day:'甲子'}});
export const EXPECTED_FIRST_SYNTHETIC_EVENT=Object.freeze({kind:'solar',term:'소한',date:'2026-01-01',time:'12:00',precision:'MINUTE',sunLongitude:null,timeBasis:'API_KST_AS_PUBLISHED',historicalCivilTime:'NOT_RESOLVED',termCode:'XIAOHAN',expectedLongitude:285,expectedLongitudeEvidence:'DERIVED_FROM_TERM_RULE_NOT_API',timePolicyVersion:'preserve-api-published-minute-v1',timeStatus:'PUBLISHED_WALL_MINUTE_ONLY',computationalCivilDateTime:'2026-01-01T12:00',utcInstant:null});
