/** Local acquisition workflow; never changes engine fixtures or supported birth years. */
import { fileURLToPath } from 'node:url';
import { resolve, join } from 'node:path';
import { createInterface } from 'node:readline/promises';
import { Writable } from 'node:stream';
import { stdin, stdout } from 'node:process';
import { Client, Collector, Store, makeTransport, type YearData } from './collector.js';
import { CollectorError, fail, object, daysInMonth, type Format } from './schema.js';
import { resolveApiKeys } from './cli.js';

export const SAMPLE_YEARS = [1950, 2026] as const;
export const TARGET_YEARS = Object.freeze(Array.from({length:77}, (_,i)=>1950+i));
export interface Progress {stage:string;year?:number;completed?:number;total?:number;}
interface RunOptions {
  store:Store;collector:Collector;stage:'samples'|'collect'|'validate';allowBulk?:boolean;
  onProgress?:(event:Progress)=>void;
}

export async function runLocal(options:RunOptions):Promise<Record<string,unknown>> {
  const {store,collector,stage,onProgress=()=>{}}=options;
  if(!['samples','collect','validate'].includes(stage))fail('LOCAL_STAGE');
  if(stage==='collect'&&!options.allowBulk)fail('SAMPLES_AND_ALLOW_BULK_REQUIRED');
  return store.lock(async()=>{
    // Hide a previous success from consumers until this requested run is validated.
    await store.json('summary.json',{schemaVersion:'kasi-local-summary-v1',status:'IN_PROGRESS',stage,from:1950,to:2026});
    try{
    if(stage!=='validate'){
      for(const y of SAMPLE_YEARS)for(const service of ['solar','lunar'] as const){
        onProgress({stage:'PROBE_'+service.toUpperCase(),year:y});
        const result=object(await collector.probe(y,service));
        if(result.status!=='SAMPLE_RESPONSE_VALIDATED')fail('SAMPLE_MINUTES_REQUIRED');
      }
      for(const y of SAMPLE_YEARS){onProgress({stage:'SAMPLE_YEAR',year:y});await collector.collectYear(y);}
      await collector.sampleGate();
      if(stage==='samples'){
        const result={schemaVersion:'kasi-local-summary-v1',status:'SAMPLES_READY',years:[...SAMPLE_YEARS],lunarMode:collector.lunarMode,requestedFormat:collector.format};
        await store.json('summary.json',result);return result;
      }
      await store.json('plan.json',{schemaVersion:'kasi-collection-plan-v1',years:[...TARGET_YEARS],format:collector.format,lunarMode:collector.lunarMode});
      for(const [index,y] of TARGET_YEARS.entries()){
        onProgress({stage:'COLLECT',year:y,completed:index,total:TARGET_YEARS.length});
        await collector.collectYear(y);
      }
    }
    const data:YearData[]=[];
    for(const [index,y] of TARGET_YEARS.entries()){
      onProgress({stage:'OFFLINE_VALIDATE',year:y,completed:index,total:TARGET_YEARS.length});
      data.push(await collector.validateYear(y));
    }
    const expectedDays=TARGET_YEARS.reduce((sum,y)=>sum+Array.from({length:12},(_,m)=>daysInMonth(y,m+1)).reduce((a,b)=>a+b,0),0);
    const solarCount=data.reduce((n,d)=>n+d.solar.length,0),lunarCount=data.reduce((n,d)=>n+d.lunar.length,0);
    if(solarCount!==1848||lunarCount!==expectedDays)fail('LOCAL_RANGE_INCOMPLETE');
    // Export is produced only after all years revalidate against raw response hashes.
    await store.json('export.json',{schemaVersion:'kasi-collector-export-v1',externalOriginalVerification:'UNVERIFIED',rightsReview:'UNVERIFIED',years:data});
    const result={schemaVersion:'kasi-local-summary-v1',status:'COMPLETE',from:1950,to:2026,yearCount:data.length,
      solarCount,lunarCount,lunarMode:collector.lunarMode,requestedFormat:collector.format,
      published2400Rows:data.reduce((n,d)=>n+d.solar.filter(r=>r.timeNotation==='AS_REPORTED_2400').length,0),
        unreportedLeapMonthGanjiRows:data.reduce((n,d)=>n+d.lunar.filter(r=>r.ganji.month===null).length,0),
      externalOriginalVerification:'UNVERIFIED',rightsReview:'UNVERIFIED',
      guarantee:'STRUCTURE_COMPLETENESS_AND_LOCAL_HASH_CONSISTENCY_ONLY'};
    await store.json('summary.json',result);onProgress({stage:'COMPLETE',completed:77,total:77});return result;
    }catch(error){
      await store.json('summary.json',{schemaVersion:'kasi-local-summary-v1',status:'FAILED',stage,from:1950,to:2026,
        code:error instanceof CollectorError?error.code:'LOCAL_IO_OR_RUNTIME_ERROR'}).catch(()=>{});
      throw error;
    }
  });
}

/** Mute terminal output while readline retains Windows paste/editing support. */
export async function promptKey():Promise<string>{
  if(!stdin.isTTY)fail('LOCAL_INTERACTIVE_TERMINAL_REQUIRED');
  stdout.write('\nKASI 일반 인증키를 붙여넣고 Enter를 누르세요 (입력은 표시되지 않습니다):\n');
  const muted=new Writable({write(_chunk,_encoding,done){done();}});
  const reader=createInterface({input:stdin,output:muted,terminal:true,historySize:0});
  try{
    const input=await ask(reader,'');
    const key=input.trim();
    if(!key||/[\s\x00-\x1f\x7f]/.test(key))fail('LOCAL_KEY_EMPTY_OR_CONTROL_CHARACTER');
    if(/^https?:/i.test(key)||/^KASI_API_KEY=/i.test(key))fail('LOCAL_PASTE_KEY_VALUE_ONLY');
    return key;
  }finally{reader.close();stdout.write('\n');}
}

async function ask(reader:ReturnType<typeof createInterface>,question:string):Promise<string>{
  const controller=new AbortController();
  const cancel=()=>controller.abort();reader.once('SIGINT',cancel);reader.once('close',cancel);
  try{return await reader.question(question,{signal:controller.signal});}
  catch(error){if(controller.signal.aborted)fail('LOCAL_CANCELLED');throw error;}
  finally{reader.removeListener('SIGINT',cancel);reader.removeListener('close',cancel);}
}

export function parseLocalArgs(args:string[]):{command:'wizard'|'samples'|'collect'|'validate';mode:'monthly'|'daily';format:Format;allowBulk:boolean}{
  const command=args[0]??'wizard';
  if(!['wizard','samples','collect','validate'].includes(command))fail('LOCAL_COMMAND');
  let mode:'monthly'|'daily'='monthly',format:Format='xml',allowBulk=false;
  const seen=new Set<string>();
  for(let i=1;i<args.length;i++){
    const option=args[i]!;if(seen.has(option))fail('LOCAL_OPTION');seen.add(option);
    if(option==='--allow-bulk'){allowBulk=true;continue;}
    if(option==='--lunar-mode'){const value=args[++i];if(value!=='monthly'&&value!=='daily')fail('LOCAL_LUNAR_MODE');mode=value;}
    else if(option==='--format'){const value=args[++i];if(value!=='xml'&&value!=='json')fail('LOCAL_FORMAT');format=value;}
    else fail('LOCAL_OPTION');
  }
  if(command!=='collect'&&allowBulk)fail('LOCAL_OPTION');
  if(command==='collect'&&!allowBulk)fail('SAMPLES_AND_ALLOW_BULK_REQUIRED');
  return {command:command as 'wizard'|'samples'|'collect'|'validate',mode,format,allowBulk};
}

async function confirmRange():Promise<boolean>{
  const reader=createInterface({input:stdin,output:stdout,historySize:0});
  try{return (await ask(reader,'\n표본 검증 완료. 전체 77년 수집을 시작하려면 1950-2026 입력 후 Enter (그 외: 종료): ')).trim()==='1950-2026';}
  finally{reader.close();}
}

export async function localMain(args:string[]):Promise<number>{
  const options=parseLocalArgs(args);
  const root=fileURLToPath(new URL(`../.private/kasi-local-1950-2026/${options.mode}-${options.format}/`,import.meta.url));
  const store=new Store(root);
  stdout.write(`KASI 로컬 수집: 1950~2026, 77년 / mode=${options.mode} / format=${options.format}\n`);
  stdout.write('두 서비스(특일·음양력)의 활용 승인이 각각 필요합니다. 중단 후 같은 폴더/같은 모드로 재실행하세요.\n');
  stdout.write(`최소 호출 수: ${options.mode==='daily'?'28,201':'1,001'}회 (페이지·재시도 추가). 계정 호출 한도를 먼저 확인하세요.\n`);
  stdout.write(`저장: ${root}\n`);
  const wire=options.command==='validate'?{transport:async()=>fail('OFFLINE_NETWORK_FORBIDDEN'),close:async()=>{}}:makeTransport();
  let active='';
  const heartbeat=setInterval(()=>{if(active)stdout.write(`진행 중: ${active} — 응답 또는 저장 자료 검사 대기\n`);},15_000);
  try{
    const keys=options.command==='validate'?{}:options.command==='wizard'?await promptKey().then(key=>({solar:key,lunar:key})):resolveApiKeys(process.env);
    const collector=new Collector(store,new Client(wire.transport,keys),options.format,options.mode);
    const progress=(event:Progress)=>{active=event.stage+(event.year?' '+event.year:'');stdout.write(`[${active}]${event.total?` ${event.completed??0}/${event.total}`:''}\n`);};
    if(options.command==='wizard'){
      await runLocal({store,collector,stage:'samples',onProgress:progress});active='';
      if(!await confirmRange()){stdout.write('표본 자료는 보존했습니다. 전체 수집은 시작하지 않았습니다.\n');return 0;}
    }
    const stage=options.command==='wizard'?'collect':options.command;
    const result=await runLocal({store,collector,stage,allowBulk:options.command==='wizard'||options.allowBulk,onProgress:progress});
    active='';stdout.write(JSON.stringify(result,null,2)+'\n');
    stdout.write(`결과: ${join(root,'summary.json')}\n`);
    if(result.status==='COMPLETE')stdout.write(`검증된 전체 JSON: ${join(root,'export.json')}\n원문·영수증·연간 자료를 포함한 .private 폴더도 함께 보관하세요.\n`);
    return 0;
  }finally{clearInterval(heartbeat);await wire.close();}
}

if(process.argv[1]&&resolve(process.argv[1])===fileURLToPath(import.meta.url)){
  if(Number(process.versions.node.split('.')[0])!==22){console.error('NODE_22_REQUIRED');process.exitCode=1;}
  else localMain(process.argv.slice(2)).then(code=>{process.exitCode=code;}).catch(error=>{
    console.error('수집 중단:',error instanceof CollectorError?error.code:'LOCAL_IO_OR_RUNTIME_ERROR');
    console.error('완료되지 않은 자료를 성공으로 내보내지 않았습니다. 저장된 페이지는 보존되며 같은 모드로 재개할 수 있습니다.');
    process.exitCode=1;
  });
}
