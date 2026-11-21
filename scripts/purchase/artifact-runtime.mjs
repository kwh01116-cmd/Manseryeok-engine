/** Standalone verification/restore bootstrap: built-ins only; never imports the unverified engine. */
import {readFile,readdir,lstat,mkdir,writeFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {resolve,join,dirname,relative,isAbsolute,sep} from 'node:path';

export const PURCHASE_ARTIFACT_SCHEMA='manseryeok-internal-test-purchase-web-v1';
export const PURCHASE_ARTIFACT_VERSION='0.1.0';
export const PURCHASE_ARTIFACT_DATA_PIN='a2bfbf35aff7bb8b11aef277a7be8d5ea5204c786a9142649bec23d27dfd289a';
const check=(ok,code)=>{if(!ok)throw Object.assign(new Error(code),{code});};
const hash=bytes=>createHash('sha256').update(bytes).digest('hex');
const safePath=value=>typeof value==='string'&&value.length>0&&!value.includes('\\')&&!value.startsWith('/')&&value.split('/').every(x=>x&&x!=='.'&&x!=='..'&&!x.includes(':'));
const portable=value=>value.split(sep).join('/');
const inside=(root,path)=>{const rel=relative(resolve(root),resolve(path));return rel===''||!isAbsolute(rel)&&rel!=='..'&&!rel.startsWith('..'+sep);};
async function ancestors(path,allowMissing=false){for(let cursor=resolve(path);;cursor=dirname(cursor)){try{const info=await lstat(cursor);check(info.isDirectory()&&!info.isSymbolicLink(),'S8_ARTIFACT_UNSAFE_DIRECTORY');}catch(error){if(!allowMissing||error.code!=='ENOENT')throw error;}if(dirname(cursor)===cursor)break;}}
async function file(path,limit=32*1024*1024){const info=await lstat(path);check(info.isFile()&&!info.isSymbolicLink()&&info.nlink===1&&info.size<=limit,'S8_ARTIFACT_UNSAFE_FILE');return readFile(path);}
async function files(root){const names=[];async function visit(dir){for(const entry of await readdir(dir,{withFileTypes:true})){const path=join(dir,entry.name),info=await lstat(path);check(!info.isSymbolicLink(),'S8_ARTIFACT_UNSAFE_FILE');if(info.isDirectory())await visit(path);else{check(info.isFile()&&info.nlink===1,'S8_ARTIFACT_UNSAFE_FILE');names.push(portable(relative(root,path)));}}}await visit(root);return names.sort();}
export function purchaseArtifactArgs(args,allowed){check(Array.isArray(args)&&args.length>0&&args.length%2===0,'S8_ARTIFACT_ARGUMENTS');const out={};for(let i=0;i<args.length;i+=2){check(allowed.includes(args[i])&&!Object.hasOwn(out,args[i])&&typeof args[i+1]==='string'&&args[i+1].length>0,'S8_ARTIFACT_ARGUMENTS');out[args[i]]=args[i+1];}return out;}
export function assertPurchaseRuntimeDirectories(engine,{stateDirectory,dataDirectory}){
 check(typeof stateDirectory==='string'&&stateDirectory.length>0&&typeof dataDirectory==='string'&&dataDirectory.length>0,'S8_ARTIFACT_SEPARATE_PATHS_REQUIRED');
 const paths=[resolve(engine),resolve(stateDirectory),resolve(dataDirectory)];
 for(let i=0;i<paths.length;i++)for(let j=i+1;j<paths.length;j++)check(!inside(paths[i],paths[j])&&!inside(paths[j],paths[i]),'S8_ARTIFACT_ENGINE_DATA_STATE_OVERLAP');return true;
}
export async function verifyPurchaseArtifact(directory,{expectedManifestSha256}={}){
 check(process.versions.node.split('.')[0]==='22','S8_ARTIFACT_NODE22_REQUIRED');check(/^[a-f0-9]{64}$/.test(expectedManifestSha256??''),'S8_ARTIFACT_TRUSTED_MANIFEST_PIN_REQUIRED');
 const root=resolve(directory);await ancestors(root);const bytes=await file(join(root,'artifact-manifest.json'),8*1024*1024);check(hash(bytes)===expectedManifestSha256,'S8_ARTIFACT_MANIFEST_PIN_MISMATCH');
 const manifest=JSON.parse(bytes.toString('utf8'));
 check(manifest.schemaVersion===PURCHASE_ARTIFACT_SCHEMA&&manifest.artifactVersion===PURCHASE_ARTIFACT_VERSION&&manifest.containsCalendarData===false&&manifest.acceptedServerDataPackContentSha256===PURCHASE_ARTIFACT_DATA_PIN,'S8_ARTIFACT_CONTRACT');
 check(manifest.mode==='LOCAL_TEST_ONLY'&&manifest.livePaymentAllowed===false&&manifest.paidReportReady===false&&manifest.releaseStatus==='NOT_APPROVED_FOR_PUBLIC_RELEASE','S8_ARTIFACT_LIVE_GATE');
 check(manifest.runtime?.nodeMajor===22&&manifest.runtime.externalDependencies===0&&manifest.runtime.npmInstallRequired===false&&manifest.runtime.gitRequired===false&&manifest.runtime.externalNetworkRequired===false,'S8_ARTIFACT_RUNTIME');
 check(Array.isArray(manifest.files)&&manifest.files.length>0&&manifest.files.length<2000,'S8_ARTIFACT_FILES');
 const names=manifest.files.map(r=>r.path);check(new Set(names).size===names.length&&names.every(safePath)&&!names.includes('artifact-manifest.json')&&names.every(p=>!/(?:^|\/)(?:\.private|node_modules)(?:\/|$)/.test(p)),'S8_ARTIFACT_PATHS');
 check(['scripts/purchase/web.mjs','scripts/purchase/service.mjs','scripts/purchase/vault.mjs','scripts/purchase/fake-payment.mjs','scripts/product/interpreted-report.mjs','scripts/product/report-store.mjs','dist/report/narrativePipelineV1.js','dist/purchase/orderStateV1.js','web/purchase/index.html','run-web.mjs','verify-web.mjs','restore-web.mjs'].every(p=>names.includes(p)),'S8_ARTIFACT_REQUIRED_FILES');
 for(const record of manifest.files){check(Number.isSafeInteger(record.bytes)&&record.bytes>=0&&/^[a-f0-9]{64}$/.test(record.sha256),'S8_ARTIFACT_FILE_RECORD');const actual=await file(join(root,record.path));check(actual.length===record.bytes&&hash(actual)===record.sha256,'S8_ARTIFACT_CONTENT_CHANGED');}
 check(JSON.stringify(await files(root))===JSON.stringify([...names,'artifact-manifest.json'].sort()),'S8_ARTIFACT_FILE_SET_CHANGED');return manifest;
}
/** Copies only a verified engine to a new directory. Private API data and local state are never copied. */
export async function restorePurchaseArtifact({artifactDirectory,outDir,expectedManifestSha256}){
 const source=resolve(artifactDirectory),target=resolve(outDir);check(!inside(source,target)&&!inside(target,source),'S8_ARTIFACT_PATH_OVERLAP');
 const manifest=await verifyPurchaseArtifact(source,{expectedManifestSha256});await ancestors(dirname(target),true);
 try{await lstat(target);throw Object.assign(new Error('S8_ARTIFACT_DESTINATION_EXISTS'),{code:'S8_ARTIFACT_DESTINATION_EXISTS'});}catch(error){if(error.code!=='ENOENT')throw error;}
 await mkdir(dirname(target),{recursive:true});await mkdir(target);
 for(const path of [...manifest.files.map(r=>r.path),'artifact-manifest.json']){const destination=join(target,path);await mkdir(dirname(destination),{recursive:true});await writeFile(destination,await file(join(source,path)),{flag:'wx'});}
 await verifyPurchaseArtifact(target,{expectedManifestSha256});return manifest;
}
