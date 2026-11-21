import {constants} from 'node:fs';
import {mkdir,lstat,realpath,open,unlink,rename} from 'node:fs/promises';
import {resolve,join,dirname} from 'node:path';
import {createCipheriv,createDecipheriv,randomBytes} from 'node:crypto';

export const PURCHASE_VAULT_SCHEMA='saju-local-test-purchase-vault-v1';
const MAX_BYTES=32*1024*1024;
const KEY_NAMES=['encryptionKey','indexKey','reportEncryptionKey','reportIndexKey','providerKey'];
export class PurchaseVaultError extends Error {constructor(code){super(code);this.name='PurchaseVaultError';this.code=code;}}
class MutatorFailure {constructor(error){this.error=error;}}
const check=(value,code)=>{if(!value)throw new PurchaseVaultError(code);};
const missing=error=>error?.code==='ENOENT';
const safe=error=>error instanceof PurchaseVaultError?error:new PurchaseVaultError('PURCHASE_VAULT_IO_FAILURE');
const plain=value=>value!==null&&typeof value==='object'&&(Object.getPrototypeOf(value)===Object.prototype||Object.getPrototypeOf(value)===null);

/** Reject getters, non-JSON objects, cycles and sparse arrays before serializing. */
export function purchaseJsonClone(value,maxBytes=MAX_BYTES){
  let nodes=0;const active=new Set();
  function walk(item,depth){
    check(++nodes<=200000&&depth<=64,'PURCHASE_VAULT_JSON_COMPLEXITY');
    if(item===null||typeof item==='string'||typeof item==='boolean')return item;
    if(typeof item==='number'){check(Number.isFinite(item),'PURCHASE_VAULT_JSON_REQUIRED');return item;}
    check(typeof item==='object'&&!active.has(item),'PURCHASE_VAULT_JSON_REQUIRED');active.add(item);
    const descriptors=Object.getOwnPropertyDescriptors(item);let result;
    if(Array.isArray(item)){
      check(Reflect.ownKeys(item).length===item.length+1,'PURCHASE_VAULT_JSON_REQUIRED');result=[];
      for(let i=0;i<item.length;i++){const d=descriptors[i];check(d&&d.enumerable&&Object.hasOwn(d,'value'),'PURCHASE_VAULT_JSON_REQUIRED');result.push(walk(d.value,depth+1));}
    }else{
      check(plain(item),'PURCHASE_VAULT_JSON_REQUIRED');result=Object.create(null);
      for(const key of Reflect.ownKeys(item)){const d=descriptors[key];check(typeof key==='string'&&d.enumerable&&Object.hasOwn(d,'value'),'PURCHASE_VAULT_JSON_REQUIRED');result[key]=walk(d.value,depth+1);}
    }
    active.delete(item);return result;
  }
  const json=JSON.stringify(walk(value,0));check(Buffer.byteLength(json)<=maxBytes,'PURCHASE_VAULT_TOO_LARGE');return JSON.parse(json);
}

async function info(path){try{return await lstat(path);}catch(error){if(missing(error))return null;throw error;}}
async function ancestors(path){for(let current=resolve(path);;current=dirname(current)){const value=await info(current);if(value)check(value.isDirectory()&&!value.isSymbolicLink(),'PURCHASE_VAULT_UNSAFE_DIRECTORY');if(dirname(current)===current)break;}}
async function directory(path){await ancestors(path);const value=await lstat(path);check(value.isDirectory()&&!value.isSymbolicLink()&&await realpath(path)===resolve(path),'PURCHASE_VAULT_UNSAFE_DIRECTORY');}
async function rootDirectory(path){await ancestors(path);await mkdir(path,{recursive:true,mode:0o700});await directory(path);}
function checkedFile(value,maxBytes){check(value?.isFile()&&!value.isSymbolicLink()&&value.nlink===1&&value.size<=maxBytes,'PURCHASE_VAULT_UNSAFE_FILE');}
async function readChecked(path,maxBytes){
  const before=await info(path);if(!before)return null;checkedFile(before,maxBytes);
  const file=await open(path,constants.O_RDONLY|(constants.O_NOFOLLOW??0));
  try{const actual=await file.stat();checkedFile(actual,maxBytes);check(actual.dev===before.dev&&actual.ino===before.ino,'PURCHASE_VAULT_UNSAFE_FILE');const bytes=await file.readFile();check(bytes.length<=maxBytes,'PURCHASE_VAULT_TOO_LARGE');return bytes;}finally{await file.close();}
}
async function writeAtomic(root,path,bytes){
  await directory(root);const existing=await info(path);if(existing)checkedFile(existing,MAX_BYTES*2);
  const temporary=join(root,'.pending-'+randomBytes(16).toString('hex'));let file;
  try{file=await open(temporary,constants.O_CREAT|constants.O_EXCL|constants.O_WRONLY|(constants.O_NOFOLLOW??0),0o600);await file.writeFile(bytes);await file.sync();await file.close();file=null;await directory(root);const latest=await info(path);if(latest)checkedFile(latest,MAX_BYTES*2);await rename(temporary,path);}finally{await file?.close();try{await unlink(temporary);}catch(error){if(!missing(error))throw error;}}
}
function base64(value,size){check(typeof value==='string'&&/^[A-Za-z0-9_-]+$/.test(value),'PURCHASE_VAULT_INTEGRITY_FAILED');const bytes=Buffer.from(value,'base64url');check(bytes.toString('base64url')===value&&(size===null||bytes.length===size),'PURCHASE_VAULT_INTEGRITY_FAILED');return bytes;}
function objectFields(value,fields,code){check(plain(value)&&Object.keys(value).length===fields.length&&fields.every(key=>Object.hasOwn(value,key)),code);}
const alive=pid=>{try{process.kill(pid,0);return true;}catch(error){return error.code!=='ESRCH';}};

// A dead PID is the only automatic stale-lock proof. A reused/alive PID stays BUSY.
async function acquireWriter(root){
  const path=join(root,'writer.lock'),nonce=randomBytes(16).toString('hex');
  for(let attempt=0;attempt<3;attempt++){
    await directory(root);let file;
    try{file=await open(path,constants.O_CREAT|constants.O_EXCL|constants.O_WRONLY|(constants.O_NOFOLLOW??0),0o600);await file.writeFile(JSON.stringify({schemaVersion:PURCHASE_VAULT_SCHEMA,pid:process.pid,nonce}));await file.sync();await file.close();return async()=>{await directory(root);const bytes=await readChecked(path,1024);check(bytes!==null,'PURCHASE_VAULT_LOCK_LOST');let lock;try{lock=JSON.parse(bytes.toString('utf8'));}catch{throw new PurchaseVaultError('PURCHASE_VAULT_LOCK_LOST');}check(lock.pid===process.pid&&lock.nonce===nonce,'PURCHASE_VAULT_LOCK_LOST');await unlink(path);};}
    catch(error){await file?.close();if(error.code!=='EEXIST')throw error;}
    const before=await info(path);if(!before)continue;checkedFile(before,1024);const bytes=await readChecked(path,1024);if(!bytes)continue;let lock;
    try{lock=JSON.parse(bytes.toString('utf8'));}catch{throw new PurchaseVaultError('PURCHASE_VAULT_LOCK_REVIEW_REQUIRED');}
    objectFields(lock,['schemaVersion','pid','nonce'],'PURCHASE_VAULT_LOCK_REVIEW_REQUIRED');
    check(lock.schemaVersion===PURCHASE_VAULT_SCHEMA&&Number.isSafeInteger(lock.pid)&&lock.pid>0&&/^[a-f0-9]{32}$/.test(lock.nonce),'PURCHASE_VAULT_LOCK_REVIEW_REQUIRED');
    check(!alive(lock.pid),'PURCHASE_VAULT_BUSY');
    const latest=await info(path);if(!latest)continue;
    check(latest.dev===before.dev&&latest.ino===before.ino&&latest.size===before.size,'PURCHASE_VAULT_BUSY');
    const current=await readChecked(path,1024);check(current?.equals(bytes),'PURCHASE_VAULT_BUSY');await unlink(path);
  }
  throw new PurchaseVaultError('PURCHASE_VAULT_BUSY');
}

async function acquire(root){
  // Serialize initial ownership and stale-lock reclamation. Never remove somebody
  // else's startup guard: a crash during this brief phase needs operator review.
  const guard=join(root,'startup.guard');let file;
  try{file=await open(guard,constants.O_CREAT|constants.O_EXCL|constants.O_WRONLY|(constants.O_NOFOLLOW??0),0o600);}
  catch(error){if(error.code==='EEXIST'){const value=await info(guard);checkedFile(value,1024);throw new PurchaseVaultError('PURCHASE_VAULT_STARTUP_REVIEW_REQUIRED');}throw error;}
  try{await file.writeFile(JSON.stringify({schemaVersion:PURCHASE_VAULT_SCHEMA,pid:process.pid}));await file.sync();return await acquireWriter(root);}
  finally{await file.close();await unlink(guard);}
}

/** One local process, encrypted whole-state transactions; not an operating database. */
export async function createPurchaseVault({directory:directoryInput,encryptionKey,initialState,validateState=()=>true,maxStateBytes=8*1024*1024,now=()=>new Date()}){
  check(typeof directoryInput==='string'&&directoryInput.length>0,'PURCHASE_VAULT_DIRECTORY');check(Buffer.isBuffer(encryptionKey)&&encryptionKey.length===32,'PURCHASE_VAULT_KEY');
  check(typeof validateState==='function'&&validateState.constructor.name!=='AsyncFunction','PURCHASE_VAULT_VALIDATOR');check(Number.isSafeInteger(maxStateBytes)&&maxStateBytes>=1024&&maxStateBytes<=MAX_BYTES,'PURCHASE_VAULT_SIZE_LIMIT');
  const root=resolve(directoryInput),path=join(root,'state.sealed.json'),key=Buffer.from(encryptionKey),aad=Buffer.from(PURCHASE_VAULT_SCHEMA);let release,queue=Promise.resolve(),closing=false,closed=false;
  const validate=state=>{let result;try{result=validateState(state);}catch{throw new PurchaseVaultError('PURCHASE_VAULT_STATE_INVALID');}check(result===true,'PURCHASE_VAULT_STATE_INVALID');};
  function instant(){const value=now();check(value instanceof Date&&Number.isFinite(value.getTime()),'PURCHASE_VAULT_CLOCK');return value.toISOString();}
  function seal(payload){const clear=Buffer.from(JSON.stringify(payload));check(clear.length<=maxStateBytes,'PURCHASE_VAULT_TOO_LARGE');const iv=randomBytes(12),cipher=createCipheriv('aes-256-gcm',key,iv);cipher.setAAD(aad);try{const encrypted=Buffer.concat([cipher.update(clear),cipher.final()]);return Buffer.from(JSON.stringify({schemaVersion:PURCHASE_VAULT_SCHEMA,algorithm:'AES-256-GCM',iv:iv.toString('base64url'),tag:cipher.getAuthTag().toString('base64url'),ciphertext:encrypted.toString('base64url')}));}finally{clear.fill(0);}}
  async function load(){
    await directory(root);const bytes=await readChecked(path,Math.ceil(maxStateBytes*4/3)+4096);check(bytes!==null,'PURCHASE_VAULT_STATE_MISSING');let payload;
    try{const sealed=JSON.parse(bytes.toString('utf8'));objectFields(sealed,['schemaVersion','algorithm','iv','tag','ciphertext'],'PURCHASE_VAULT_INTEGRITY_FAILED');check(sealed.schemaVersion===PURCHASE_VAULT_SCHEMA&&sealed.algorithm==='AES-256-GCM','PURCHASE_VAULT_INTEGRITY_FAILED');const decipher=createDecipheriv('aes-256-gcm',key,base64(sealed.iv,12));decipher.setAAD(aad);decipher.setAuthTag(base64(sealed.tag,16));const clear=Buffer.concat([decipher.update(base64(sealed.ciphertext,null)),decipher.final()]);try{check(clear.length<=maxStateBytes,'PURCHASE_VAULT_TOO_LARGE');payload=JSON.parse(clear.toString('utf8'));}finally{clear.fill(0);}objectFields(payload,['schemaVersion','revision','createdAt','updatedAt','state'],'PURCHASE_VAULT_INTEGRITY_FAILED');check(payload.schemaVersion===PURCHASE_VAULT_SCHEMA&&Number.isSafeInteger(payload.revision)&&payload.revision>=0&&new Date(payload.createdAt).toISOString()===payload.createdAt&&new Date(payload.updatedAt).toISOString()===payload.updatedAt,'PURCHASE_VAULT_INTEGRITY_FAILED');payload.state=purchaseJsonClone(payload.state,maxStateBytes);}catch(error){if(error instanceof PurchaseVaultError&&error.code==='PURCHASE_VAULT_UNSAFE_FILE')throw error;throw new PurchaseVaultError('PURCHASE_VAULT_INTEGRITY_FAILED');}
    validate(payload.state);return payload;
  }
  try{await rootDirectory(root);release=await acquire(root);if(await info(path)===null){const state=purchaseJsonClone(initialState,maxStateBytes);validate(state);const date=instant();await writeAtomic(root,path,seal({schemaVersion:PURCHASE_VAULT_SCHEMA,revision:0,createdAt:date,updatedAt:date,state}));}else await load();}catch(error){try{await release?.();}catch{}key.fill(0);throw safe(error);}
  function operation(fn){check(!closing&&!closed,'PURCHASE_VAULT_CLOSED');const result=queue.then(async()=>{try{return await fn();}catch(error){throw error instanceof MutatorFailure?error.error:safe(error);}});queue=result.catch(()=>{});return result;}
  function read(){return operation(async()=>purchaseJsonClone((await load()).state,maxStateBytes));}
  function mutate(mutator){check(typeof mutator==='function'&&mutator.constructor.name!=='AsyncFunction','PURCHASE_VAULT_SYNC_MUTATOR');return operation(async()=>{const payload=await load(),draft=purchaseJsonClone(payload.state,maxStateBytes);let result;try{result=mutator(draft);}catch(error){throw new MutatorFailure(error);}if(result instanceof Promise){result.catch(()=>{});throw new PurchaseVaultError('PURCHASE_VAULT_SYNC_MUTATOR');}const state=purchaseJsonClone(draft,maxStateBytes);validate(state);const output=result===undefined?undefined:purchaseJsonClone(result,maxStateBytes);check(payload.revision<Number.MAX_SAFE_INTEGER,'PURCHASE_VAULT_REVISION_LIMIT');await writeAtomic(root,path,seal({...payload,revision:payload.revision+1,updatedAt:instant(),state}));return output;});}
  async function close(){if(closed)return;check(!closing,'PURCHASE_VAULT_CLOSED');closing=true;await queue;try{await release();}finally{key.fill(0);closed=true;}}
  return Object.freeze({schemaVersion:PURCHASE_VAULT_SCHEMA,read,mutate,close});
}

/** Local operator key file, never returned through HTTP; Windows ACLs need separate review. */
export async function loadOrCreatePurchaseKeys(directoryInput){
  check(typeof directoryInput==='string'&&directoryInput.length>0,'PURCHASE_KEYS_DIRECTORY');const root=resolve(directoryInput),path=join(root,'local-test-keys.json');
  try{await rootDirectory(root);let bytes=await readChecked(path,4096);if(bytes===null){const values=Object.fromEntries(KEY_NAMES.map(name=>[name,randomBytes(32).toString('base64url')]));let file;try{file=await open(path,constants.O_CREAT|constants.O_EXCL|constants.O_WRONLY|(constants.O_NOFOLLOW??0),0o600);await file.writeFile(JSON.stringify({schemaVersion:'saju-local-test-purchase-keys-v1',...values}));await file.sync();}catch(error){if(error.code!=='EEXIST')throw error;}finally{await file?.close();}bytes=await readChecked(path,4096);}
    let value;try{value=JSON.parse(bytes.toString('utf8'));}catch{throw new PurchaseVaultError('PURCHASE_KEYS_INVALID');}objectFields(value,['schemaVersion',...KEY_NAMES],'PURCHASE_KEYS_INVALID');check(value.schemaVersion==='saju-local-test-purchase-keys-v1','PURCHASE_KEYS_INVALID');const keys={};try{for(const name of KEY_NAMES)keys[name]=base64(value[name],32);}catch{for(const key of Object.values(keys))key.fill(0);throw new PurchaseVaultError('PURCHASE_KEYS_INVALID');}check(new Set(KEY_NAMES.map(name=>value[name])).size===KEY_NAMES.length,'PURCHASE_KEYS_DISTINCT_REQUIRED');return Object.freeze(keys);
  }catch(error){throw safe(error);}
}
