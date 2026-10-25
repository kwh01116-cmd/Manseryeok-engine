import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { Client, Collector, Store, makeTransport, type Transport } from './collector.js';
import { CollectorError, fail, year, integer, object, compareReference, fingerprint, type Service, type Format } from './schema.js';
export function parseArgs(args:string[]):{command:string;options:Record<string,string>} {
  const [command,...rest]=args;
  if(!command||!['probe','collect','validate','export'].includes(command))fail('COMMAND_PROBE_COLLECT_VALIDATE_EXPORT');
  const options:Record<string,string>={};
  const allowed=['years','from','to','service','format','lunar-mode','allow-bulk','reference'];
  for(let i=0;i<rest.length;i++){
    const token=rest[i]!;if(!/^--[a-z-]+$/.test(token))fail('CLI_OPTION');const name=token.slice(2);
    if(!allowed.includes(name)||Object.hasOwn(options,name))fail('CLI_OPTION');
    if(name==='allow-bulk'){options[name]='true';continue;}
    const value=rest[++i];if(!value||value.startsWith('--'))fail('CLI_VALUE');options[name]=value;
  }
  if((options.from===undefined)!==(options.to===undefined)||options.years!==undefined&&options.from!==undefined)fail('CLI_YEAR_SELECTION');
  if(options.service!==undefined&&!['solar','lunar','both'].includes(options.service))fail('CLI_SERVICE');
  if(command!=='probe'&&options.service!==undefined)fail('COLLECT_REQUIRES_BOTH_SERVICES');
  if(options.format!==undefined&&!['xml','json'].includes(options.format))fail('CLI_FORMAT');
  if(options['lunar-mode']!==undefined&&!['monthly','daily'].includes(options['lunar-mode']))fail('CLI_LUNAR_MODE');
  if(command!=='collect'&&options['allow-bulk'])fail('CLI_OPTION');
  if(command!=='export'&&options.reference)fail('CLI_OPTION');
  return {command,options};
}
export function selectedYears(options:Record<string,string>,fallback?:number[]):number[]{
  let years:number[];
  if(options.years!==undefined){if(!/^\d{4}(,\d{4})*$/.test(options.years))fail('CLI_YEARS');years=options.years.split(',').map(Number);}
  else if(options.from!==undefined){const from=year(integer(options.from,1950,2027)),to=year(integer(options.to,1950,2027));if(from>to)fail('CLI_YEAR_RANGE');years=Array.from({length:to-from+1},(_,i)=>from+i);}
  else if(fallback)years=fallback;else return fail('YEARS_REQUIRED');
  years.forEach(year);if(!years.length||new Set(years).size!==years.length)fail('CLI_DUPLICATE_YEARS');return [...years].sort((a,b)=>a-b);
}
const safeCode=(error:unknown)=>error instanceof CollectorError?error.code:'INTERNAL_ERROR';
// Injection is for in-process offline tests only; production CLI has no mock flag.
export async function main(args:string[],testRuntime?:{store:Store;transport:Transport;keys:Partial<Record<Service,string>>}):Promise<number>{
  const {command,options}=parseArgs(args);
  const store=testRuntime?.store??new Store(fileURLToPath(new URL('../.private/kasi/',import.meta.url)));
  return store.lock(async()=>{
    const plan=await store.read('plan.json'),saved=plan===undefined?undefined:object(plan);
    const savedYears=saved?.years;
    if(saved&&(saved.schemaVersion!=='kasi-collection-plan-v1'||!Array.isArray(savedYears)||!['xml','json'].includes(String(saved.format))||!['monthly','daily'].includes(String(saved.lunarMode))))fail('PLAN_SCHEMA');
    const fallback=command==='probe'?[1950,2026]:(command==='validate'||command==='export')?savedYears as number[]|undefined:undefined;
    const years=selectedYears(options,fallback);
    const format=(options.format??((command==='validate'||command==='export')?saved?.format:undefined)??'xml') as Format;
    const mode=(options['lunar-mode']??((command==='validate'||command==='export')?saved?.lunarMode:undefined)??'monthly') as 'monthly'|'daily';
    // Keys are used only inside the transport; no key, URL or raw upstream error is logged.
    const wire=testRuntime?{transport:testRuntime.transport,close:async()=>{}}:makeTransport();
    const client=new Client(wire.transport,testRuntime?.keys??{...(process.env.KASI_SPCDE_API_KEY?{solar:process.env.KASI_SPCDE_API_KEY}:{}),...(process.env.KASI_LUNAR_API_KEY?{lunar:process.env.KASI_LUNAR_API_KEY}:{})},testRuntime?{timeoutMs:100,retries:0,intervalMs:0}:undefined);
    const collector=new Collector(store,client,format,mode);
    try{
      if(command==='probe'){
        const results:unknown[]=[];let failed=false;
        for(const y of years)for(const service of (options.service&&options.service!=='both'?[options.service]:['solar','lunar']) as Service[]){
          try{const r=object(await collector.probe(y,service));if(r.status!=='SAMPLE_RESPONSE_VALIDATED')failed=true;results.push({year:y,service,status:r.status,scope:r.scope,yearComplete:false,minuteRows:r.minuteRows,requestedFormat:r.requestedFormat,actualFormats:r.actualFormats});}
          catch(e){failed=true;const r={year:y,service,status:'FAILED',code:safeCode(e)};results.push(r);await store.json(`probes/${service}-${y}-failure.json`,r);}
        }
        console.log(JSON.stringify({command,results}));return failed?1:0;
      }
      if(command==='collect'){
        if(years.some(y=>![1950,2026].includes(y))){if(!options['allow-bulk'])fail('SAMPLES_AND_ALLOW_BULK_REQUIRED');await collector.sampleGate();}
        await store.json('plan.json',{schemaVersion:'kasi-collection-plan-v1',years,format,lunarMode:mode});
      }
      const data=[];
      for(const y of years)data.push(command==='collect'?await collector.collectYear(y):await collector.validateYear(y));
      if(command==='export'){
        let comparison;
        if(options.reference){const reference=JSON.parse(await readFile(resolve(options.reference),'utf8'));comparison={...compareReference(data.flatMap(d=>d.solar),data.flatMap(d=>d.lunar),reference),scope:'REFERENCE_ROWS_ONLY',referenceSha256:fingerprint(reference)};await store.json('discrepancies.json',comparison);}
        await store.json('export.json',{schemaVersion:'kasi-collector-export-v1',externalOriginalVerification:'UNVERIFIED',rightsReview:'UNVERIFIED',years:data,...(comparison?{comparison}:{})});
      }
      console.log(JSON.stringify({command,status:'COMPLETE',years:data.map(d=>({year:d.year,solar:d.solar.length,lunar:d.lunar.length,normalizedSha256:d.normalizedSha256})),externalOriginalVerification:'UNVERIFIED',rightsReview:'UNVERIFIED'}));
      return 0;
    }finally{await wire.close();}
  });
}
if(process.argv[1]&&resolve(process.argv[1])===fileURLToPath(import.meta.url)){
  if(Number(process.versions.node.split('.')[0])!==22){console.error(JSON.stringify({status:'FAILED',code:'NODE_22_REQUIRED'}));process.exitCode=1;}
  else main(process.argv.slice(2)).then(code=>{process.exitCode=code;}).catch(error=>{console.error(JSON.stringify({status:'FAILED',code:safeCode(error)}));process.exitCode=1;});
}
