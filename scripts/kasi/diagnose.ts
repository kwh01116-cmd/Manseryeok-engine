/** Offline, allowlisted observation of cached solar fields; no parser relaxation. */
import { fileURLToPath } from 'node:url';
import { resolve, join } from 'node:path';
import { Store } from './collector.js';
import { TERMS, CollectorError, fail, parsePage, normalizeSolar, year, type Item } from './schema.js';

function numericObservation(value:unknown):{type:string;value:string|null}{
  const type=value===null?'null':typeof value;
  if(value===undefined||value===null)return {type,value:null};
  if(type!=='string'&&type!=='number')return {type,value:'[unsupported value omitted]'};
  const text=String(value);
  // Fixed-width calendar numbers only, never arbitrary text, URLs or unknown fields.
  return {type,value:/^[0-9\s:.,+\-]{1,12}$/.test(text)?text:'[non-numeric or long value omitted]'};
}

export function describeSolarItem(item:Item,y:number,index:number){
  const name=typeof item.dateName==='string'?item.dateName.trim():'';
  let normalization='PASS';
  try{normalizeSolar(item,y);}
  catch(error){normalization=error instanceof CollectorError?error.code:'SCHEMA_ERROR';}
  return {index,term:TERMS.includes(name as typeof TERMS[number])?name:'[unrecognized term]',
    locdate:numericObservation(item.locdate),kst:numericObservation(item.kst),
    sunLongitude:numericObservation(item.sunLongitude),normalization};
}

export async function diagnoseCachedSolar(store:Store,y:number){
  year(y);
    const items:ReturnType<typeof describeSolarItem>[]=[],pages=[];
    for(let page=1;page<=100;page++){
      const cached=await store.load({service:'solar',year:y,page,format:'xml'});
      if(!cached){if(page===1)fail('DIAGNOSTIC_NO_CACHED_SOLAR_PAGE');break;}
      const parsed=parsePage(cached.body);
      if(parsed.total>24||items.length+parsed.items.length>24)fail('DIAGNOSTIC_SOLAR_COUNT');
      pages.push({page,returnedPage:parsed.page,total:parsed.total,rows:parsed.items.length});
      for(const item of parsed.items)items.push(describeSolarItem(item,y,items.length+1));
      if(items.length>=parsed.total)break;
    }
    const report={schemaVersion:'kasi-safe-cached-solar-diagnostic-v1',year:y,
      purpose:'OBSERVE_RESPONSE_FORMAT_ONLY',networkRequests:0,normalizerChanged:false,
      pages,items,providerAuthenticity:'UNVERIFIED',engineSupportPromotion:false};
    const filename=`diagnostic-solar-${y}.json`;
    await store.json(filename,report);
    return {path:join(store.root,filename),report};
}

if(process.argv[1]&&resolve(process.argv[1])===fileURLToPath(import.meta.url)){
  const root=fileURLToPath(new URL('../.private/kasi-local-1950-2026/monthly-xml/',import.meta.url));
  // No credentials are read and no transport is created.
  diagnoseCachedSolar(new Store(root),1950).then(({path,report})=>{
    console.log('오프라인 진단 완료. API 호출/키 입력 없이 저장된 응답의 숫자 필드만 확인했습니다.');
    console.log('항목 수:',report.items.length);
    console.log('이 JSON 파일을 채팅에 올려주세요:',path);
  }).catch(error=>{
    console.error('진단 중단:',error instanceof CollectorError?error.code:'LOCAL_FILE_ERROR');
    process.exitCode=1;
  });
}
