/** Test/pilot instrumentation, deliberately excluded from the shipped engine. */
import {writeFile} from 'node:fs/promises';
import {join,resolve} from 'node:path';
import {pathToFileURL} from 'node:url';

export async function writeOfflineGuards(directory,{forbiddenRoot}={}){
  const loader=join(directory,'offline-deny-loader.mjs'),preload=join(directory,'offline-readonly-guard.mjs');
  const rootUrl=forbiddenRoot?pathToFileURL(resolve(forbiddenRoot)).href.toLowerCase()+'/':null;
  await writeFile(loader,`
const forbiddenRoot=${JSON.stringify(rootUrl)};
export async function resolve(specifier,context,nextResolve){
  if(/^(?:node:)?(?:https?|http2|net|tls|dns|dgram|child_process|worker_threads)$/.test(specifier))throw Error('OFFLINE_NETWORK_OR_PROCESS_IMPORT_DENIED');
  if(!specifier.startsWith('.')&&!specifier.startsWith('file:')&&!specifier.startsWith('node:'))throw Error('OFFLINE_EXTERNAL_PACKAGE_DENIED');
  const result=await nextResolve(specifier,context);
  if(forbiddenRoot&&result.url.toLowerCase().startsWith(forbiddenRoot))throw Error('OFFLINE_DEVELOPER_PATH_DENIED');
  if(/(?:koreaSolarTermFixtures|koreanLunisolarFixtures|collector|research)\\.(?:m?js)(?:$|[?#])/.test(result.url))throw Error('OFFLINE_FALLBACK_DENIED');
  return result;
}
`,{flag:'wx'});
  await writeFile(preload,`
import fs from 'node:fs';import fsp from 'node:fs/promises';
import net from 'node:net';import http from 'node:http';import https from 'node:https';
import {register,syncBuiltinESMExports} from 'node:module';
const deny=()=>{throw Error('OFFLINE_WRITE_DENIED')};
for(const name of ['appendFile','chmod','chown','copyFile','cp','link','lchmod','lchown','lutimes','mkdir','mkdtemp','rename','rm','rmdir','symlink','truncate','unlink','utimes','writeFile']){
  if(name in fs)fs[name]=deny;if(name+'Sync' in fs)fs[name+'Sync']=deny;if(name in fsp)fsp[name]=deny;
}
fs.createWriteStream=deny;fs.write=deny;fs.writeSync=deny;fs.writev=deny;fs.writevSync=deny;
for(const [owner,name]of [[fs,'open'],[fs,'openSync'],[fsp,'open']]){const original=owner[name];owner[name]=function(path,flags,...args){if(flags!=='r')deny();return original.call(this,path,flags,...args)};}
const noNetwork=()=>{throw Error('OFFLINE_NETWORK_DENIED')};
net.Socket.prototype.connect=noNetwork;net.Server.prototype.listen=noNetwork;
http.request=noNetwork;http.get=noNetwork;https.request=noNetwork;https.get=noNetwork;globalThis.fetch=noNetwork;
process.env=new Proxy(process.env,{get(target,name){if(typeof name==='string'&&/KASI|API_KEY|SERVICE_KEY/i.test(name))throw Error('OFFLINE_KEY_ACCESS_DENIED');return Reflect.get(target,name);}});
syncBuiltinESMExports();register(${JSON.stringify(pathToFileURL(loader).href)});
`,{flag:'wx'});
  return {loader,preload};
}
export function cleanOfflineEnvironment(tz='UTC'){
  const env={...process.env};for(const name of Object.keys(env))if(/KASI|API_KEY|SERVICE_KEY/i.test(name))delete env[name];delete env.NODE_OPTIONS;delete env.NODE_PATH;
  return {...env,TZ:tz};
}
