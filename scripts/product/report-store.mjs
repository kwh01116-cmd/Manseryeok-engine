import {constants} from 'node:fs';
import {mkdir,lstat,realpath,open,unlink,rename} from 'node:fs/promises';
import {resolve,join,dirname} from 'node:path';
import {createCipheriv,createDecipheriv,createHmac,randomBytes,timingSafeEqual} from 'node:crypto';
import {setTimeout as pause} from 'node:timers/promises';

export const REPORT_STORE_SCHEMA='saju-local-encrypted-report-store-v1';
export const REPORT_STORE_FILE_SCHEMA='saju-local-encrypted-report-file-v1';
export const REPORT_STORE_VERSION='0.1.0';
export const REPORT_STORE_MAX_RETENTION_MS=31*24*60*60*1000;
const DEFAULT_BYTES=2*1024*1024,MAX_BYTES=8*1024*1024,MAX_DEPTH=64,MAX_NODES=100000;
const FILE_FIELDS=['schemaVersion','algorithm','iv','tag','ciphertext'];
const RECORD_FIELDS=['schemaVersion','recordId','owner','contentTag','createdAt','expiresAt','versions','report'];
const VERSION_FIELDS=['reportSchema','reportProfile','interpretationPolicies','generatorVersion','artifactVersion','dataVersion','dataFingerprint'];

export class ReportStoreError extends Error {
  constructor(code){super(code);this.name='ReportStoreError';this.code=code;}
}
const check=(value,code)=>{if(!value)throw new ReportStoreError(code);};
const plain=value=>value!==null&&typeof value==='object'&&(Object.getPrototypeOf(value)===Object.prototype||Object.getPrototypeOf(value)===null);
function exact(value,fields,code){
  check(plain(value),code);const descriptors=Object.getOwnPropertyDescriptors(value);
  check(Reflect.ownKeys(value).length===fields.length&&fields.every(key=>Object.hasOwn(descriptors,key)&&descriptors[key].enumerable&&Object.hasOwn(descriptors[key],'value')),code);
}
function canonical(value,maxBytes){
  let nodes=0,bytes=0;const active=new Set();
  const add=s=>{bytes+=Buffer.byteLength(s);check(bytes<=maxBytes,'REPORT_STORE_TOO_LARGE');return s;};
  function walk(item,depth){
    check(++nodes<=MAX_NODES&&depth<=MAX_DEPTH,'REPORT_STORE_JSON_COMPLEXITY');
    if(item===null)return add('null');
    if(typeof item==='string')return add(JSON.stringify(item));
    if(typeof item==='boolean')return add(String(item));
    if(typeof item==='number'){check(Number.isFinite(item),'REPORT_STORE_JSON_REQUIRED');return add(JSON.stringify(item));}
    check(typeof item==='object'&&!active.has(item),'REPORT_STORE_JSON_REQUIRED');active.add(item);
    let text;
    if(Array.isArray(item)){
      const desc=Object.getOwnPropertyDescriptors(item);
      check(Reflect.ownKeys(item).length===item.length+1,'REPORT_STORE_JSON_REQUIRED');
      const values=[];for(let i=0;i<item.length;i++){check(Object.hasOwn(desc,String(i))&&desc[i].enumerable&&Object.hasOwn(desc[i],'value'),'REPORT_STORE_JSON_REQUIRED');values.push(walk(desc[i].value,depth+1));}
      text=add('[')+values.join(add(','))+add(']');
    }else{
      check(plain(item),'REPORT_STORE_JSON_REQUIRED');const desc=Object.getOwnPropertyDescriptors(item),keys=Reflect.ownKeys(item);
      check(keys.every(key=>typeof key==='string'&&desc[key].enumerable&&Object.hasOwn(desc[key],'value')),'REPORT_STORE_JSON_REQUIRED');
      text=add('{')+keys.sort().map(key=>add(JSON.stringify(key))+add(':')+walk(desc[key].value,depth+1)).join(add(','))+add('}');
    }
    active.delete(item);return text;
  }
  const result=walk(value,0);check(Buffer.byteLength(result)<=maxBytes,'REPORT_STORE_TOO_LARGE');return result;
}
function freeze(value){if(value&&typeof value==='object'){for(const item of Object.values(value))freeze(item);Object.freeze(value);}return value;}
function string(value,code,max=256){check(typeof value==='string'&&value.length>0&&value.length<=max&&!/[\u0000-\u001f\u007f]/u.test(value),code);return value;}
function validateVersions(value){
  exact(value,VERSION_FIELDS,'REPORT_STORE_VERSIONS');
  for(const key of ['reportSchema','generatorVersion','artifactVersion','dataVersion'])string(value[key],'REPORT_STORE_VERSIONS');
  exact(value.reportProfile,['id','version'],'REPORT_STORE_VERSIONS');string(value.reportProfile.id,'REPORT_STORE_VERSIONS');string(value.reportProfile.version,'REPORT_STORE_VERSIONS');
  check(Array.isArray(value.interpretationPolicies)&&value.interpretationPolicies.length>0&&value.interpretationPolicies.length<=32,'REPORT_STORE_VERSIONS');
  const ids=new Set();for(const policy of value.interpretationPolicies){exact(policy,['id','version'],'REPORT_STORE_VERSIONS');string(policy.id,'REPORT_STORE_VERSIONS');string(policy.version,'REPORT_STORE_VERSIONS');check(!ids.has(policy.id),'REPORT_STORE_VERSIONS');ids.add(policy.id);}
  check(typeof value.dataFingerprint==='string'&&/^[a-f0-9]{64}$/.test(value.dataFingerprint),'REPORT_STORE_VERSIONS');
}
function instant(value,code){check(typeof value==='string'&&/^\d{4}-\d\d-\d\dT\d\d:\d\d:\d\d\.\d{3}Z$/.test(value),code);const ms=Date.parse(value);check(Number.isFinite(ms)&&new Date(ms).toISOString()===value,code);return ms;}
function identity(value){check(typeof value==='string'&&/^[A-Za-z0-9][A-Za-z0-9_-]{0,127}$/.test(value),'REPORT_STORE_ACTOR_ID');return value;}
function keyName(value){check(typeof value==='string'&&/^[A-Za-z0-9][A-Za-z0-9:._-]{0,127}$/.test(value)&&!value.includes('..'),'REPORT_STORE_IDEMPOTENCY_KEY');return value;}
function recordName(value){check(typeof value==='string'&&/^[a-f0-9]{64}$/.test(value),'REPORT_STORE_RECORD_ID');return value;}
function decode(value,bytes){check(typeof value==='string'&&/^[A-Za-z0-9_-]+$/.test(value),'REPORT_STORE_INTEGRITY_FAILED');const result=Buffer.from(value,'base64url');check(result.toString('base64url')===value&&(bytes===null||result.length===bytes),'REPORT_STORE_INTEGRITY_FAILED');return result;}
const absent=error=>error?.code==='ENOENT';
const safeError=error=>error instanceof ReportStoreError?error:new ReportStoreError('REPORT_STORE_IO_FAILURE');
async function noSymlinkAncestors(path){for(let current=resolve(path);;current=dirname(current)){try{const info=await lstat(current);check(info.isDirectory()&&!info.isSymbolicLink(),'REPORT_STORE_UNSAFE_DIRECTORY');}catch(error){if(!absent(error))throw error;}if(dirname(current)===current)break;}}
async function directory(path){await noSymlinkAncestors(path);const info=await lstat(path);check(info.isDirectory()&&!info.isSymbolicLink()&&await realpath(path)===resolve(path),'REPORT_STORE_UNSAFE_DIRECTORY');}
async function infoOrNull(path){try{return await lstat(path);}catch(error){if(absent(error))return null;throw error;}}

/** Explicit local persistence only. The caller authenticates actorId and supplies keys. */
export async function createLocalReportStore(options){
  check(plain(options),'REPORT_STORE_OPTIONS');const allowed=['directory','encryptionKey','indexKey','validateReport','now','maxRecordBytes'];
  for(const key of Reflect.ownKeys(options)){const d=Object.getOwnPropertyDescriptor(options,key);check(typeof key==='string'&&allowed.includes(key)&&d.enumerable&&Object.hasOwn(d,'value'),'REPORT_STORE_OPTIONS');}
  string(options.directory,'REPORT_STORE_DIRECTORY',4096);
  check(Buffer.isBuffer(options.encryptionKey)&&options.encryptionKey.length===32&&Buffer.isBuffer(options.indexKey)&&options.indexKey.length===32&&!timingSafeEqual(options.encryptionKey,options.indexKey),'REPORT_STORE_DISTINCT_KEYS_REQUIRED');
  check(typeof options.validateReport==='function'&&options.validateReport.constructor.name!=='AsyncFunction','REPORT_STORE_SYNC_VALIDATOR_REQUIRED');
  check(options.now===undefined||typeof options.now==='function','REPORT_STORE_CLOCK');
  const maxRecordBytes=options.maxRecordBytes??DEFAULT_BYTES;check(Number.isSafeInteger(maxRecordBytes)&&maxRecordBytes>=1024&&maxRecordBytes<=MAX_BYTES,'REPORT_STORE_SIZE_LIMIT');
  const root=resolve(options.directory),encryptionKey=Buffer.from(options.encryptionKey),indexKey=Buffer.from(options.indexKey),validateReport=options.validateReport,clock=options.now??(()=>new Date());
  const maxFileBytes=Math.ceil(maxRecordBytes*4/3)+4096;let closed=false,active=0;
  try{await noSymlinkAncestors(root);await mkdir(root,{recursive:true,mode:0o700});await directory(root);}catch(error){encryptionKey.fill(0);indexKey.fill(0);throw safeError(error);}
  const hmac=value=>createHmac('sha256',indexKey).update(value).digest('hex');
  const ownerOf=actor=>hmac('actor\0'+identity(actor));
  const recordOf=(owner,key)=>hmac('record\0'+owner+'\0'+keyName(key));
  const aad=(owner,recordId)=>Buffer.from(REPORT_STORE_FILE_SCHEMA+'\0'+owner+'\0'+recordId);
  const time=()=>{const date=clock();check(date instanceof Date&&Number.isFinite(date.getTime()),'REPORT_STORE_CLOCK');return date;};
  function validate(report,versions){let valid;try{valid=validateReport(report,versions);if(valid instanceof Promise){Promise.prototype.then.call(valid,undefined,()=>{});throw new Error('SYNC_VALIDATOR_REQUIRED');}}catch{throw new ReportStoreError('REPORT_STORE_REPORT_VALIDATION_FAILED');}check(valid===true,'REPORT_STORE_REPORT_VALIDATION_FAILED');}
  function operation(){check(!closed,'REPORT_STORE_CLOSED');active++;return()=>{active--;};}
  async function ownerDirectory(owner,create){
    await directory(root);const path=join(root,owner),info=await infoOrNull(path);
    if(!info&&!create)return null;
    if(!info)try{await mkdir(path,{mode:0o700});}catch(error){if(error.code!=='EEXIST')throw error;}
    await directory(path);return path;
  }
  async function withLock(owner,recordId,create,fn){
    const dir=await ownerDirectory(owner,create);if(dir===null)return fn(null);
    const lock=join(dir,recordId+'.lock');let handle=null;
    for(let attempt=0;attempt<100;attempt++){
      await directory(dir);
      try{handle=await open(lock,constants.O_CREAT|constants.O_EXCL|constants.O_WRONLY|(constants.O_NOFOLLOW??0),0o600);break;}
      catch(error){if(error.code!=='EEXIST')throw error;const info=await infoOrNull(lock);if(!info)continue;check(info.isFile()&&!info.isSymbolicLink()&&info.nlink===1,'REPORT_STORE_UNSAFE_FILE');if(attempt===99)throw new ReportStoreError('REPORT_STORE_BUSY');await pause(5);}
    }
    check(handle!==null,'REPORT_STORE_BUSY');
    try{return await fn(dir);}finally{await handle?.close();await unlink(lock);}
  }
  async function readRecord(dir,owner,recordId){
    if(dir===null)return null;await directory(dir);const path=join(dir,recordId+'.json'),before=await infoOrNull(path);if(!before)return null;
    check(before.isFile()&&!before.isSymbolicLink()&&before.nlink===1&&before.size<=maxFileBytes,'REPORT_STORE_UNSAFE_FILE');
    const file=await open(path,constants.O_RDONLY|(constants.O_NOFOLLOW??0));let bytes;
    try{const actual=await file.stat();check(actual.isFile()&&actual.nlink===1&&actual.dev===before.dev&&actual.ino===before.ino&&actual.size<=maxFileBytes,'REPORT_STORE_UNSAFE_FILE');bytes=await file.readFile();}finally{await file.close();}
    check(bytes.length<=maxFileBytes,'REPORT_STORE_TOO_LARGE');
    let payload;
    try{
      const sealed=JSON.parse(bytes.toString('utf8'));exact(sealed,FILE_FIELDS,'REPORT_STORE_INTEGRITY_FAILED');
      check(sealed.schemaVersion===REPORT_STORE_FILE_SCHEMA&&sealed.algorithm==='AES-256-GCM','REPORT_STORE_INTEGRITY_FAILED');
      const decipher=createDecipheriv('aes-256-gcm',encryptionKey,decode(sealed.iv,12));decipher.setAAD(aad(owner,recordId));decipher.setAuthTag(decode(sealed.tag,16));
      const clear=Buffer.concat([decipher.update(decode(sealed.ciphertext,null)),decipher.final()]);
      try{check(clear.length<=maxRecordBytes,'REPORT_STORE_TOO_LARGE');payload=JSON.parse(clear.toString('utf8'));}finally{clear.fill(0);}
      exact(payload,RECORD_FIELDS,'REPORT_STORE_INTEGRITY_FAILED');check(payload.schemaVersion===REPORT_STORE_SCHEMA&&payload.recordId===recordId&&payload.owner===owner,'REPORT_STORE_INTEGRITY_FAILED');
      instant(payload.createdAt,'REPORT_STORE_INTEGRITY_FAILED');instant(payload.expiresAt,'REPORT_STORE_INTEGRITY_FAILED');check(Date.parse(payload.expiresAt)>Date.parse(payload.createdAt)&&Date.parse(payload.expiresAt)-Date.parse(payload.createdAt)<=REPORT_STORE_MAX_RETENTION_MS,'REPORT_STORE_INTEGRITY_FAILED');
      validateVersions(payload.versions);check(payload.contentTag===hmac('content\0'+canonical({report:payload.report,versions:payload.versions,expiresAt:payload.expiresAt},maxRecordBytes)),'REPORT_STORE_INTEGRITY_FAILED');
    }catch(error){if(error instanceof ReportStoreError&&error.code==='REPORT_STORE_TOO_LARGE')throw error;throw new ReportStoreError('REPORT_STORE_INTEGRITY_FAILED');}
    freeze(payload.report);freeze(payload.versions);validate(payload.report,payload.versions);return payload;
  }
  const receipt=(status,p)=>freeze({status,recordId:p.recordId,createdAt:p.createdAt,expiresAt:p.expiresAt,versions:p.versions});
  async function put(input){
    const done=operation();try{
      exact(input,['actorId','idempotencyKey','report','versions','expiresAt'],'REPORT_STORE_PUT_INPUT');
      const owner=ownerOf(input.actorId),recordId=recordOf(owner,input.idempotencyKey),now=time(),expiry=instant(input.expiresAt,'REPORT_STORE_EXPIRY');
      check(expiry>now.getTime()&&expiry-now.getTime()<=REPORT_STORE_MAX_RETENTION_MS,'REPORT_STORE_EXPIRY');
      const snapshot=JSON.parse(canonical({report:input.report,versions:input.versions},maxRecordBytes));validateVersions(snapshot.versions);freeze(snapshot);validate(snapshot.report,snapshot.versions);
      const contentTag=hmac('content\0'+canonical({...snapshot,expiresAt:new Date(expiry).toISOString()},maxRecordBytes));
      return await withLock(owner,recordId,true,async dir=>{
        const existing=await readRecord(dir,owner,recordId);
        if(existing){check(Date.parse(existing.expiresAt)>now.getTime(),'REPORT_STORE_EXPIRED');check(existing.contentTag===contentTag,'REPORT_STORE_IDEMPOTENCY_CONFLICT');return receipt('REUSED',existing);}
        const payload={schemaVersion:REPORT_STORE_SCHEMA,recordId,owner,contentTag,createdAt:now.toISOString(),expiresAt:new Date(expiry).toISOString(),versions:snapshot.versions,report:snapshot.report};
        const clear=Buffer.from(canonical(payload,maxRecordBytes)),iv=randomBytes(12),cipher=createCipheriv('aes-256-gcm',encryptionKey,iv);cipher.setAAD(aad(owner,recordId));
        const ciphertext=Buffer.concat([cipher.update(clear),cipher.final()]);clear.fill(0);
        const sealed=JSON.stringify({schemaVersion:REPORT_STORE_FILE_SCHEMA,algorithm:'AES-256-GCM',iv:iv.toString('base64url'),tag:cipher.getAuthTag().toString('base64url'),ciphertext:ciphertext.toString('base64url')});check(Buffer.byteLength(sealed)<=maxFileBytes,'REPORT_STORE_TOO_LARGE');
        const path=join(dir,recordId+'.json'),temporary=join(dir,recordId+'.pending-'+randomBytes(12).toString('hex'));let file=null;
        try{file=await open(temporary,constants.O_CREAT|constants.O_EXCL|constants.O_WRONLY|(constants.O_NOFOLLOW??0),0o600);await file.writeFile(sealed);await file.sync();await file.close();file=null;check(await infoOrNull(path)===null,'REPORT_STORE_IDEMPOTENCY_CONFLICT');await directory(dir);await rename(temporary,path);}
        finally{await file?.close();try{await unlink(temporary);}catch(error){if(!absent(error))throw error;}}
        return receipt('CREATED',payload);
      });
    }catch(error){throw safeError(error);}finally{done();}
  }
  async function get(input){
    const done=operation();try{
      exact(input,['actorId','recordId'],'REPORT_STORE_GET_INPUT');const owner=ownerOf(input.actorId),recordId=recordName(input.recordId),now=time();
      return await withLock(owner,recordId,false,async dir=>{const payload=await readRecord(dir,owner,recordId);if(!payload)return freeze({status:'NOT_FOUND'});if(Date.parse(payload.expiresAt)<=now.getTime())return receipt('EXPIRED',payload);return freeze({...receipt('FOUND',payload),report:payload.report});});
    }catch(error){throw safeError(error);}finally{done();}
  }
  async function remove(input){
    const done=operation();try{
      exact(input,['actorId','recordId'],'REPORT_STORE_REMOVE_INPUT');const owner=ownerOf(input.actorId),recordId=recordName(input.recordId);
      return await withLock(owner,recordId,false,async dir=>{const payload=await readRecord(dir,owner,recordId);if(!payload)return freeze({status:'NOT_FOUND'});await directory(dir);await unlink(join(dir,recordId+'.json'));return freeze({status:'DELETED',recordId});});
    }catch(error){throw safeError(error);}finally{done();}
  }
  function close(){check(active===0,'REPORT_STORE_BUSY');encryptionKey.fill(0);indexKey.fill(0);closed=true;}
  return Object.freeze({schemaVersion:REPORT_STORE_SCHEMA,version:REPORT_STORE_VERSION,put,get,remove,close});
}
