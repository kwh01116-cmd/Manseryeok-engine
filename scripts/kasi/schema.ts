import { createHash } from 'node:crypto';
import { XMLParser, XMLValidator } from 'fast-xml-parser';
export type Service = 'solar' | 'lunar';
export type Format = 'xml' | 'json';
export type Item = Record<string, unknown>;
export const SERVICES = {
  solar: {id:'15012690',operation:'get24DivisionsInfo',path:'SpcdeInfoService',key:'KASI_SPCDE_API_KEY'},
  lunar: {id:'15012679',operation:'getLunCalInfo',path:'LrsrCldInfoService',key:'KASI_LUNAR_API_KEY'},
} as const;
export class CollectorError extends Error {
  constructor(readonly code:string) { super('KASI collector: '+code); this.name='CollectorError'; }
}
export function fail(code:string):never { throw new CollectorError(code); }
export const sha = (value:string|Buffer):string => createHash('sha256').update(value).digest('hex');
export function canonical(value:unknown):string {
  if(Array.isArray(value))return '['+value.map(canonical).join(',')+']';
  if(value!==null&&typeof value==='object')return '{'+Object.keys(value).sort().map(k=>JSON.stringify(k)+':'+canonical((value as Item)[k])).join(',')+'}';
  return JSON.stringify(value);
}
export const fingerprint = (value:unknown):string => sha(canonical(value));
export const object = (x:unknown):Item => x!==null&&typeof x==='object'&&!Array.isArray(x)?x as Item:fail('SCHEMA_OBJECT');
export function scalar(x:unknown):string { return typeof x==='string'?x:typeof x==='number'&&Number.isFinite(x)?String(x):fail('SCHEMA_SCALAR'); }
export function integer(x:unknown,min:number,max:number):number {
  const s=scalar(x).trim();if(!/^\d+$/.test(s))fail('SCHEMA_INTEGER');
  const n=Number(s);if(!Number.isSafeInteger(n)||n<min||n>max)fail('SCHEMA_INTEGER');return n;
}
export function date(s:string):string {
  if(!/^\d{4}-\d{2}-\d{2}$/.test(s))fail('INVALID_DATE');
  const d=new Date(s+'T00:00:00Z');if(!Number.isFinite(+d)||d.toISOString().slice(0,10)!==s)fail('INVALID_DATE');return s;
}
export function year(n:number):number { if(!Number.isInteger(n)||n<1950||n>2027)fail('YEAR_RANGE_1950_2027');return n; }
export const daysInMonth = (y:number,m:number):number => new Date(Date.UTC(y,m,0)).getUTCDate();
export const iso = (y:number,m:number,d:number):string => date(`${y}-${String(m).padStart(2,'0')}-${String(d).padStart(2,'0')}`);
export interface Page { items:Item[]; page:number; size:number; total:number; schema:{format:Format; headerFields:string[]; bodyFields:string[]; itemFields:string[]}; }
export function parsePage(raw:string):Page {
  if(Buffer.byteLength(raw)>2_000_000)fail('RESPONSE_TOO_LARGE');
  let value:unknown,format:Format;
  try {
    if(raw.trimStart().startsWith('{')){format='json';value=JSON.parse(raw);}
    else {
      format='xml';if(/<!DOCTYPE|<!ENTITY/i.test(raw)||XMLValidator.validate(raw)!==true)fail('INVALID_XML');
      value=new XMLParser({parseTagValue:false,trimValues:false,ignoreAttributes:true,processEntities:false}).parse(raw);
    }
  } catch { return fail('RESPONSE_PARSE'); }
  const root=object(value);
  if(root.OpenAPI_ServiceResponse)fail('API_GATEWAY_ERROR');
  const response=object(root.response),header=object(response.header);
  if(scalar(header.resultCode).trim()!=='00')fail('API_RESULT_ERROR');
  const body=object(response.body);
  const total=integer(body.totalCount,0,366),page=integer(body.pageNo,1,100),size=integer(body.numOfRows,1,366);
  const source=body.items===''||body.items==null?[]:object(body.items).item;
  const items=source==null||source===''?[]:(Array.isArray(source)?source:[source]).map(object);
  if(items.length>size)fail('PAGINATION_ITEMS');
  return {items,page,size,total,schema:{format,headerFields:Object.keys(header).sort(),bodyFields:Object.keys(body).sort(),itemFields:[...new Set(items.flatMap(x=>Object.keys(x)))].sort()}};
}
export const TERMS = ['소한','대한','입춘','우수','경칩','춘분','청명','곡우','입하','소만','망종','하지','소서','대서','입추','처서','백로','추분','한로','상강','입동','소설','대설','동지'] as const;
export interface SolarRow {kind:'solar';term:string;date:string;time:string|null;precision:'MINUTE'|'DAY';sunLongitude:number|null;timeBasis:'API_KST_AS_PUBLISHED';historicalCivilTime:'NOT_RESOLVED';}
export interface LunarRow {kind:'lunar';solarDate:string;lunarYear:number;lunarMonth:number;lunarDay:number;leap:boolean;monthDays:number;ganji:{year:string;month:string;day:string};}
export function normalizeSolar(item:Item,y:number):SolarRow {
  const loc=scalar(item.locdate).trim();if(!/^\d{8}$/.test(loc))fail('SOLAR_DATE');
  const dt=date(loc.slice(0,4)+'-'+loc.slice(4,6)+'-'+loc.slice(6));
  const term=scalar(item.dateName).trim();if(!TERMS.includes(term as typeof TERMS[number])||Number(dt.slice(0,4))!==y)fail('SOLAR_TERM_YEAR');
  let time:string|null=null;
  if(item.kst!=null&&scalar(item.kst).replace(/\s/g,'')!==''){
    const k=scalar(item.kst).replace(/\s/g,'');if(!/^(?:[01]\d|2[0-3])[0-5]\d$/.test(k))fail('KST_HHMM');
    time=k.slice(0,2)+':'+k.slice(2);
  }
  let longitude:number|null=null;
  if(item.sunLongitude!=null&&scalar(item.sunLongitude).trim()!==''){
    const s=scalar(item.sunLongitude).trim();if(!/^\d+(?:\.\d+)?$/.test(s))fail('SUN_LONGITUDE');
    longitude=Number(s);if(longitude>=360||longitude!==(285+TERMS.indexOf(term as typeof TERMS[number])*15)%360)fail('SUN_LONGITUDE');
  }
  return {kind:'solar',term,date:dt,time,precision:time===null?'DAY':'MINUTE',sunLongitude:longitude,timeBasis:'API_KST_AS_PUBLISHED',historicalCivilTime:'NOT_RESOLVED'};
}
export function normalizeLunar(item:Item,y:number,m:number,d?:number):LunarRow {
  const sy=integer(item.solYear,1950,2027),sm=integer(item.solMonth,1,12),sd=integer(item.solDay,1,31);
  if(sy!==y||sm!==m||(d!==undefined&&sd!==d))fail('LUNAR_QUERY_RANGE');
  const lunarYear=integer(item.lunYear,1949,2027),lunarMonth=integer(item.lunMonth,1,12),lunarDay=integer(item.lunDay,1,30),monthDays=integer(item.lunNday,29,30);
  const leap=scalar(item.lunLeapmonth).trim();if(!['평','윤'].includes(leap)||lunarDay>monthDays||![sy-1,sy].includes(lunarYear))fail('LUNAR_VALUES');
  const ganji={year:scalar(item.lunSecha).trim(),month:scalar(item.lunWolgeon).trim(),day:scalar(item.lunIljin).trim()};
  if(Object.values(ganji).some(s=>!(/^[갑을병정무기경신임계][자축인묘진사오미신유술해](?:\([甲乙丙丁戊己庚辛壬癸][子丑寅卯辰巳午未申酉戌亥]\))?$/.test(s)||/^[甲乙丙丁戊己庚辛壬癸][子丑寅卯辰巳午未申酉戌亥]$/.test(s))))fail('GANJI');
  return {kind:'lunar',solarDate:iso(sy,sm,sd),lunarYear,lunarMonth,lunarDay,leap:leap==='윤',monthDays,ganji};
}
export function validateSolar(rows:SolarRow[],y:number):void {
  if(rows.length!==24||new Set(rows.map(x=>x.term)).size!==24||new Set(rows.map(x=>x.date)).size!==24)fail('SOLAR_24_MISSING_OR_DUPLICATE');
  const sorted=[...rows].sort((a,b)=>a.date.localeCompare(b.date));
  if(sorted.some((r,i)=>r.term!==TERMS[i]||Number(r.date.slice(0,4))!==y||Number(r.date.slice(5,7))!==Math.floor(i/2)+1))fail('SOLAR_ORDER');
}
export function validateLunar(rows:LunarRow[],y:number,m?:number,d?:number):void {
  const expected=m===undefined?Array.from({length:12},(_,i)=>Array.from({length:daysInMonth(y,i+1)},(_,j)=>iso(y,i+1,j+1))).flat():d===undefined?Array.from({length:daysInMonth(y,m)},(_,j)=>iso(y,m,j+1)):[iso(y,m,d)];
  if(rows.length!==expected.length||new Set(rows.map(x=>x.solarDate)).size!==rows.length)fail('LUNAR_MISSING_OR_DUPLICATE');
  const sorted=[...rows].sort((a,b)=>a.solarDate.localeCompare(b.solarDate));
  const months=new Map<string,number>();
  sorted.forEach((r,i)=>{
    if(r.solarDate!==expected[i])fail('LUNAR_MISSING_DATE');
    const k=`${r.lunarYear}-${r.lunarMonth}-${r.leap}`;
    if(months.has(k)&&months.get(k)!==r.monthDays)fail('LUNAR_MONTH_SIZE_CHANGED');months.set(k,r.monthDays);
    const prev=sorted[i-1];if(!prev)return;
    if(prev.lunarDay<prev.monthDays){if(k!==`${prev.lunarYear}-${prev.lunarMonth}-${prev.leap}`||r.lunarDay!==prev.lunarDay+1)fail('LUNAR_CONTINUITY');}
    else {
      const nextMonth=prev.lunarMonth===12?1:prev.lunarMonth+1,nextYear=prev.lunarMonth===12?prev.lunarYear+1:prev.lunarYear;
      const regular=r.lunarYear===nextYear&&r.lunarMonth===nextMonth&&!r.leap;
      const leap=r.lunarYear===prev.lunarYear&&r.lunarMonth===prev.lunarMonth&&r.leap&&!prev.leap;
      if(r.lunarDay!==1||(!regular&&!leap))fail('LUNAR_MONTH_BOUNDARY');
    }
  });
}
export interface Comparison {surface:'KASI_ANNUAL_TXT';differences:unknown[];status:'MATCH'|'MISMATCH';}
export function compareReference(solar:SolarRow[],lunar:LunarRow[],reference:unknown):Comparison {
  const ref=object(reference);if(ref.surface!=='KASI_ANNUAL_TXT'||!Array.isArray(ref.solar)||!Array.isArray(ref.lunar))fail('REFERENCE_SCHEMA');
  const differences:unknown[]=[];
  for(const entry of ref.solar){const r=object(entry),a=solar.find(s=>s.term===r.term&&s.date===r.date);if(!a||a.time!==r.time)differences.push({kind:'solar',term:r.term,date:r.date,apiTime:a?.time??null,referenceTime:r.time??null});}
  for(const entry of ref.lunar){const r=object(entry),a=lunar.find(s=>s.solarDate===r.solarDate);if(!a||['lunarYear','lunarMonth','lunarDay','leap','monthDays'].some(k=>(a as unknown as Item)[k]!==r[k]))differences.push({kind:'lunar',solarDate:r.solarDate,api:a??null,reference:r});}
  if(ref.solar.length+ref.lunar.length===0)fail('REFERENCE_EMPTY');
  return {surface:'KASI_ANNUAL_TXT',differences,status:differences.length?'MISMATCH':'MATCH'};
}
