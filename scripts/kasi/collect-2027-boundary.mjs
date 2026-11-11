/** One narrowly authorized annual solar request, at most ten wire attempts including pages. */
import {mkdir,writeFile,appendFile,readFile} from 'node:fs/promises';
import {join,resolve} from 'node:path';
import {pathToFileURL} from 'node:url';
import {Client,makeTransport,hasCredential} from '../../.kasi-build/collector.js';
import {fingerprint,sha,parsePage} from '../../.kasi-build/schema.js';
import {buildKasi2027BoundaryContent,BoundarySupplementError} from './boundary-supplement.mjs';
const check=(ok,code)=>{if(!ok)throw new BoundarySupplementError(code);};
export const MAX_BOUNDARY_HTTP_ATTEMPTS=10;
export async function collectKasi2027Boundary({directory,key,gitHead,transport:providedTransport}){
 check(typeof key==='string'&&key.trim().length>=32,'BOUNDARY_KEY_UNAVAILABLE');
 check(typeof directory==='string'&&directory.length>0,'BOUNDARY_OUTPUT_DIRECTORY_REQUIRED');
 check(/^[a-f0-9]{40}$/.test(gitHead??''),'BOUNDARY_CODE_HEAD_REQUIRED');
 await mkdir(directory,{recursive:false,mode:0o700});
 const ledger=join(directory,'attempts.ndjson');
 await writeFile(ledger,'',{flag:'wx',mode:0o600});
 await mkdir(join(directory,'raw'),{mode:0o700});await mkdir(join(directory,'receipts'),{mode:0o700});
 let actualHttpAttempts=0,channel;
 const wire=providedTransport??(channel=makeTransport()).transport;
 const guarded=async(url,signal)=>{
  check(url.origin==='https://apis.data.go.kr'&&url.pathname==='/B090041/openapi/service/SpcdeInfoService/get24DivisionsInfo'&&url.searchParams.get('solYear')==='2027'&&!url.searchParams.has('solMonth')&&!url.searchParams.has('solDay')&&url.searchParams.get('numOfRows')==='100','BOUNDARY_REQUEST_SCOPE');
  check([...url.searchParams.keys()].every(k=>['ServiceKey','solYear','pageNo','numOfRows'].includes(k)),'BOUNDARY_REQUEST_PARAMETERS');
  check(actualHttpAttempts<MAX_BOUNDARY_HTTP_ATTEMPTS,'BOUNDARY_HTTP_BUDGET_EXHAUSTED');
  const attempt=++actualHttpAttempts,query={service:'solar',year:2027,page:Number(url.searchParams.get('pageNo')),format:'xml'};
  await appendFile(ledger,JSON.stringify({attempt,state:'STARTED',query,requestedAt:new Date().toISOString(),maxActualHttpAttempts:MAX_BOUNDARY_HTTP_ATTEMPTS})+'\n');
  try{const result=await wire(url,signal);const echoed=hasCredential(result.body,[key]);
   let resultCode=null;if(!echoed&&result.status===200){const match=/<resultCode>\s*([A-Za-z0-9_]{1,32})\s*<\/resultCode>/.exec(result.body);resultCode=match?.[1]??null;}
   await appendFile(ledger,JSON.stringify({attempt,state:'FINISHED',status:result.status,resultCode,credentialEcho:echoed,responseSha256:echoed?null:sha(result.body)})+'\n');
   check(!echoed,'BOUNDARY_CREDENTIAL_ECHO');if(result.status===200)await writeFile(join(directory,'raw',sha(result.body)+'.body'),result.body,{flag:'wx',mode:0o600});return result;
  }catch(error){await appendFile(ledger,JSON.stringify({attempt,state:'REJECTED',code:error instanceof BoundarySupplementError?error.code:'BOUNDARY_TRANSPORT_FAILED'})+'\n');throw new BoundarySupplementError('BOUNDARY_TRANSPORT_FAILED');}
 };
 const client=new Client(guarded,{solar:key},{timeoutMs:10000,retries:0,intervalMs:350});
 try{
  const pages=[];let totalPages=1;
  for(let page=1;page<=totalPages;page++){
   const received=await client.request({service:'solar',year:2027,page,format:'xml'});pages.push(received);await writeFile(join(directory,'receipts',fingerprint(received.receipt)+'.json'),JSON.stringify(received.receipt,null,2)+'\n',{flag:'wx',mode:0o600});
   const parsed=parsePage(received.body);totalPages=Math.ceil(parsed.total/parsed.size);
   check(totalPages>=1&&totalPages<=MAX_BOUNDARY_HTTP_ATTEMPTS,'BOUNDARY_PAGE_BUDGET');
  }
  const codeIdentity={sourceIdentityKind:'HEAD_PLUS_EXACT_FILE_HASHES',gitHead,collectorSha256:sha(await readFile(new URL(import.meta.url))),normalizerSha256:sha(await readFile(new URL('../../.kasi-build/schema.js',import.meta.url)))};
  const content=buildKasi2027BoundaryContent({pages,baseManifestSha256:'8ffadb04c8460969085610162d3d5e8855af9272a8a4be1dbe10123c15f90edf',codeIdentity});
  const contentSha256=fingerprint(content);await writeFile(join(directory,'manifest.json'),JSON.stringify({contentSha256,content},null,2)+'\n',{flag:'wx',mode:0o600});
  const receipt={status:'COLLECTED_PENDING_INDEPENDENT_PIN_ACCEPTANCE',actualHttpAttempts,maxActualHttpAttempts:MAX_BOUNDARY_HTTP_ATTEMPTS,retriesPerPage:0,contentSha256,runtimeTerms:content.events.map(e=>e.termCode),rawRows:24,apiRequestsOtherOperations:0};
  await writeFile(join(directory,'collection-receipt.json'),JSON.stringify(receipt,null,2)+'\n',{flag:'wx',mode:0o600});return receipt;
 }catch(error){const code=error instanceof BoundarySupplementError?error.code:typeof error?.code==='string'&&/^[A-Z0-9_]+$/.test(error.code)?error.code:'BOUNDARY_COLLECTION_REJECTED';await writeFile(join(directory,'collection-failure.json'),JSON.stringify({status:'REJECTED',code,actualHttpAttempts,maxActualHttpAttempts:MAX_BOUNDARY_HTTP_ATTEMPTS,retriesPerPage:0})+'\n',{flag:'wx',mode:0o600});throw new BoundarySupplementError(code);}
 finally{await channel?.close();key='';}
}
if(process.argv[1]&&import.meta.url===pathToFileURL(resolve(process.argv[1])).href){
 try{const args=process.argv.slice(2);check(args.length===4&&args[0]==='--directory'&&args[2]==='--code-head','BOUNDARY_EXPLICIT_ARGUMENTS_REQUIRED');const key=process.env.KASI_SPCDE_API_KEY??process.env.KASI_API_KEY;delete process.env.KASI_SPCDE_API_KEY;delete process.env.KASI_API_KEY;const result=await collectKasi2027Boundary({directory:args[1],key,gitHead:args[3]});process.stdout.write(JSON.stringify(result)+'\n');}
 catch(error){process.stderr.write(JSON.stringify({status:'REJECTED',code:error instanceof BoundarySupplementError?error.code:'BOUNDARY_COLLECTION_REJECTED'})+'\n');process.exitCode=1;}
}
