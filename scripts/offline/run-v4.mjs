/** Same issued server DTO offline. No hidden policy, data path or current-time selection. */
import {resolve} from 'node:path';
import {pathToFileURL} from 'node:url';
import {assertNode22,check,parsePairs} from './integrity.mjs';
import {verifyServerOfflineArtifact} from './integrity-v4.mjs';
import {loadApiOnlyServerEngine,validateApiOnlyServerRequest,validateApiOnlyServerResult,renderApiOnlyServerReport} from '../server/engine.mjs';
export function parseServerOfflineArgs(args){
 const o=parsePairs(args,['--data-pack','--request-json','--output','--detail']);check(Object.keys(o).length===4&&o['--data-pack']&&['json','text'].includes(o['--output'])&&['summary','detailed'].includes(o['--detail']),'SERVER_OFFLINE_EXPLICIT_ARGUMENTS_REQUIRED');
 check(Buffer.byteLength(o['--request-json'],'utf8')<=32768,'SERVER_OFFLINE_REQUEST_TOO_LARGE');const request=JSON.parse(o['--request-json']);validateApiOnlyServerRequest(request);return {dataDirectory:resolve(o['--data-pack']),request,output:o['--output'],detail:o['--detail']};
}
export function calculateServerOffline({engine,request}){validateApiOnlyServerRequest(request);check(engine&&typeof engine.calculate==='function','SERVER_OFFLINE_ENGINE_REQUIRED');const value=engine.calculate(request);validateApiOnlyServerResult(value,{request});return value;}
export function serverOfflineRejection(phase){return {status:'REJECTED',phase,code:'OFFLINE_SERVER_'+phase+'_REJECTED'};}
export async function main(args=process.argv.slice(2)){
 let phase='INPUT';try{assertNode22();const options=parseServerOfflineArgs(args);phase='ARTIFACT';await verifyServerOfflineArtifact(resolve(import.meta.dirname,'../..'));phase='DATA';const engine=await loadApiOnlyServerEngine({dataDirectory:options.dataDirectory});phase='CALCULATION';const value=calculateServerOffline({engine,request:options.request});process.stdout.write(options.output==='json'?JSON.stringify(value,null,2)+'\n':renderApiOnlyServerReport(value,{detail:options.detail}));if(value.status!=='CALCULATED_UNDER_SELECTED_POLICIES')process.exitCode=2;}
 catch{process.stderr.write(JSON.stringify(serverOfflineRejection(phase))+'\n');process.exitCode=1;}
}
if(process.argv[1]&&import.meta.url===pathToFileURL(resolve(process.argv[1])).href)await main();
