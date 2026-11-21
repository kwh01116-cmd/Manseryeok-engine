import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp,mkdir,readFile,writeFile,readdir,rm,symlink,rename,link,copyFile} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join,resolve,dirname,basename} from 'node:path';
import {createHmac} from 'node:crypto';
import {createLocalReportStore,REPORT_STORE_SCHEMA,REPORT_STORE_MAX_RETENTION_MS} from '../scripts/product/report-store.mjs';

const ENCRYPTION=Buffer.alloc(32,0x31),INDEX=Buffer.alloc(32,0x72);
const START=Date.parse('2026-11-21T12:00:00.000Z');
const versions=()=>({reportSchema:'synthetic-interpretation-report-v1',reportProfile:{id:'SYNTHETIC-REPORT',version:'0.1.0'},interpretationPolicies:[{id:'SYNTHETIC-POLICY',version:'0.1.0'}],generatorVersion:'0.1.0',artifactVersion:'0.1.0',dataVersion:'SYNTHETIC-NO-REAL-DATA',dataFingerprint:'1'.repeat(64)});
const report=()=>({schemaVersion:'synthetic-interpretation-report-v1',candidateId:'synthetic-parent-0',claim:{status:'LIMITED',text:'합성 구조의 제한된 해석입니다.'},syntheticBirth:{date:'1992-11-24',time:'00:30'}});
const validates=(r,v)=>{assert.equal(r.schemaVersion,v.reportSchema);assert.equal(r.claim.status,'LIMITED');assert.equal(r.candidateId,'synthetic-parent-0');return true;};
const input=(extra={})=>({actorId:'synthetic-user-A',idempotencyKey:'request-one',report:report(),versions:versions(),expiresAt:new Date(START+86400000).toISOString(),...extra});
async function fixture(t,extra={}){
  const directory=await mkdtemp(join(tmpdir(),'manseryeok-report-store-'));let clock=START;
  const options={directory,encryptionKey:ENCRYPTION,indexKey:INDEX,validateReport:validates,now:()=>new Date(clock),...extra};
  const stores=[];const store=await createLocalReportStore(options);stores.push(store);
  t.after(async()=>{for(const s of stores)s.close();const absolute=resolve(directory);assert.equal(dirname(absolute),resolve(tmpdir()));assert.match(basename(absolute),/^manseryeok-report-store-/);await rm(absolute,{recursive:true,force:true});});
  return {directory,store,options,stores,setClock:value=>{clock=value;}};
}
const owner=actor=>createHmac('sha256',INDEX).update('actor\0'+actor).digest('hex');
const storedPath=(directory,actor,recordId)=>join(directory,owner(actor),recordId+'.json');

test('local store explicitly encrypts one validated versioned result and reproduces it after reopening',async t=>{
  const f=await fixture(t),original=input(),saved=await f.store.put(original);
  assert.equal(f.store.schemaVersion,REPORT_STORE_SCHEMA);assert.equal(saved.status,'CREATED');assert.match(saved.recordId,/^[a-f0-9]{64}$/);assert.equal(saved.createdAt,'2026-11-21T12:00:00.000Z');
  const found=await f.store.get({actorId:original.actorId,recordId:saved.recordId});assert.equal(found.status,'FOUND');assert.deepEqual(found.report,original.report);assert.deepEqual(found.versions,versions());assert.ok(Object.isFrozen(found.report.claim));
  const other=await createLocalReportStore(f.options);f.stores.push(other);assert.deepEqual(await other.get({actorId:original.actorId,recordId:saved.recordId}),found);
  assert.equal(Object.isFrozen(original.report),false);assert.deepEqual(original,input());
  const disk=await readFile(storedPath(f.directory,original.actorId,saved.recordId),'utf8');
  for(const value of [original.actorId,original.idempotencyKey,'1992-11-24','00:30','합성 구조','SYNTHETIC-REPORT'])assert.equal(disk.includes(value),false);
  assert.deepEqual(Object.keys(JSON.parse(disk)).sort(),['algorithm','ciphertext','iv','schemaVersion','tag']);
  assert.deepEqual(await readdir(f.directory),[owner(original.actorId)]);assert.deepEqual(await readdir(join(f.directory,owner(original.actorId))),[saved.recordId+'.json']);
});

test('idempotency preserves the first timestamp and refuses changed claims, versions or retention under the same key',async t=>{
  const f=await fixture(t),one=input(),first=await f.store.put(one);f.setClock(START+1000);
  const repeated=await f.store.put(structuredClone(one));assert.equal(repeated.status,'REUSED');assert.equal(repeated.createdAt,first.createdAt);assert.equal(repeated.expiresAt,first.expiresAt);assert.equal(repeated.recordId,first.recordId);
  const changedClaim=input();changedClaim.report.claim.text='다른 합성 해석';
  const changedVersion=input();changedVersion.versions.generatorVersion='0.2.0';
  const changedExpiry=input({expiresAt:new Date(START+2*86400000).toISOString()});
  for(const changed of [changedClaim,changedVersion,changedExpiry])await assert.rejects(()=>f.store.put(changed),{code:'REPORT_STORE_IDEMPOTENCY_CONFLICT'});
  assert.deepEqual((await f.store.get({actorId:one.actorId,recordId:first.recordId})).report,one.report);
});

test('concurrent identical writes across two store objects create once and reuse the same authenticated record',async t=>{
  const f=await fixture(t),other=await createLocalReportStore(f.options);f.stores.push(other);
  const results=await Promise.all([f.store.put(input()),other.put(input()),f.store.put(input()),other.put(input())]);
  assert.equal(results.filter(r=>r.status==='CREATED').length,1);assert.equal(new Set(results.map(r=>r.recordId)).size,1);
  assert.deepEqual((await readdir(join(f.directory,owner(input().actorId)))),[results[0].recordId+'.json']);
});

test('a different actor cannot reread or delete another actor record even with its opaque record ID',async t=>{
  const f=await fixture(t),saved=await f.store.put(input());
  assert.deepEqual(await f.store.get({actorId:'synthetic-user-B',recordId:saved.recordId}),{status:'NOT_FOUND'});
  assert.deepEqual(await f.store.remove({actorId:'synthetic-user-B',recordId:saved.recordId}),{status:'NOT_FOUND'});
  assert.equal((await f.store.get({actorId:input().actorId,recordId:saved.recordId})).status,'FOUND');
  const other=await f.store.put(input({actorId:'synthetic-user-B'}));assert.notEqual(other.recordId,saved.recordId);
});

test('expiry refuses stale content and deletion is explicit, repeatable and valid after expiry',async t=>{
  const f=await fixture(t),saved=await f.store.put(input());f.setClock(START+86400000);
  const stale=await f.store.get({actorId:input().actorId,recordId:saved.recordId});assert.equal(stale.status,'EXPIRED');assert.equal(Object.hasOwn(stale,'report'),false);
  await assert.rejects(()=>f.store.put(input({expiresAt:new Date(START+2*86400000).toISOString()})),{code:'REPORT_STORE_EXPIRED'});
  assert.deepEqual(await f.store.remove({actorId:input().actorId,recordId:saved.recordId}),{status:'DELETED',recordId:saved.recordId});
  assert.deepEqual(await f.store.get({actorId:input().actorId,recordId:saved.recordId}),{status:'NOT_FOUND'});assert.deepEqual(await f.store.remove({actorId:input().actorId,recordId:saved.recordId}),{status:'NOT_FOUND'});
  assert.deepEqual(await readdir(join(f.directory,owner(input().actorId))),[]);
});

test('new versions require a new idempotency key and old records are not silently upgraded',async t=>{
  const f=await fixture(t),old=await f.store.put(input()),newer=input({idempotencyKey:'request-version-two'});newer.versions.interpretationPolicies[0].version='0.2.0';
  const saved=await f.store.put(newer);assert.notEqual(saved.recordId,old.recordId);
  assert.equal((await f.store.get({actorId:input().actorId,recordId:old.recordId})).versions.interpretationPolicies[0].version,'0.1.0');
  assert.equal((await f.store.get({actorId:input().actorId,recordId:saved.recordId})).versions.interpretationPolicies[0].version,'0.2.0');
  const currentOnly=await createLocalReportStore({...f.options,validateReport:(r,v)=>validates(r,v)&&v.interpretationPolicies[0].version==='0.2.0'});f.stores.push(currentOnly);
  await assert.rejects(()=>currentOnly.get({actorId:input().actorId,recordId:old.recordId}),{code:'REPORT_STORE_REPORT_VALIDATION_FAILED'});
});

test('ciphertext/tag tampering, wrong encryption key and copying records across owners fail authenticated reads',async t=>{
  const f=await fixture(t),saved=await f.store.put(input()),path=storedPath(f.directory,input().actorId,saved.recordId),original=await readFile(path);
  const sealed=JSON.parse(original);sealed.tag=(sealed.tag[0]==='A'?'B':'A')+sealed.tag.slice(1);await writeFile(path,JSON.stringify(sealed));
  await assert.rejects(()=>f.store.get({actorId:input().actorId,recordId:saved.recordId}),{code:'REPORT_STORE_INTEGRITY_FAILED'});await writeFile(path,original);
  const wrongKey=await createLocalReportStore({...f.options,encryptionKey:Buffer.alloc(32,0x63)});f.stores.push(wrongKey);await assert.rejects(()=>wrongKey.get({actorId:input().actorId,recordId:saved.recordId}),{code:'REPORT_STORE_INTEGRITY_FAILED'});
  const b=await f.store.put(input({actorId:'synthetic-user-B'}));await copyFile(path,storedPath(f.directory,'synthetic-user-B',b.recordId));
  await assert.rejects(()=>f.store.get({actorId:'synthetic-user-B',recordId:b.recordId}),{code:'REPORT_STORE_INTEGRITY_FAILED'});
});

test('invalid report content is rejected before writing and revalidated during reread with safe error codes',async t=>{
  const f=await fixture(t),bad=input();bad.report.claim.status='STRONG';await assert.rejects(()=>f.store.put(bad),{code:'REPORT_STORE_REPORT_VALIDATION_FAILED'});assert.deepEqual(await readdir(f.directory),[]);
  const leaking=await createLocalReportStore({...f.options,validateReport:()=>{throw Error('sensitive synthetic content must not escape');}});f.stores.push(leaking);
  await assert.rejects(()=>leaking.put(input()),error=>error.code==='REPORT_STORE_REPORT_VALIDATION_FAILED'&&!error.message.includes('sensitive'));
  const falseValidator=await createLocalReportStore({...f.options,validateReport:()=>false});f.stores.push(falseValidator);await assert.rejects(()=>falseValidator.put(input()),{code:'REPORT_STORE_REPORT_VALIDATION_FAILED'});
  const promiseValidator=await createLocalReportStore({...f.options,validateReport:()=>Promise.reject(Error('synthetic private detail'))});f.stores.push(promiseValidator);await assert.rejects(()=>promiseValidator.put(input()),{code:'REPORT_STORE_REPORT_VALIDATION_FAILED'});
});

test('bounded plain JSON refuses sparse arrays, accessors, symbols, cycles and oversized payloads without invoking getters',async t=>{
  const f=await fixture(t,{maxRecordBytes:2048});let reads=0;
  const accessor=input();Object.defineProperty(accessor.report,'secret',{get(){reads++;throw Error('must not run');},enumerable:true});
  const sparse=input();sparse.report.array=Array(1);
  const symbol=input();symbol.report[Symbol('foreign')]='bad';
  const cyclic=input();cyclic.report.loop=cyclic.report;
  for(const bad of [accessor,sparse,symbol,cyclic])await assert.rejects(()=>f.store.put(bad),{code:'REPORT_STORE_JSON_REQUIRED'});
  assert.equal(reads,0);const large=input();large.report.claim.text='가'.repeat(1000);await assert.rejects(()=>f.store.put(large),{code:'REPORT_STORE_TOO_LARGE'});
  assert.deepEqual(await readdir(f.directory),[]);
});

test('actor/record traversal, unknown fields, incomplete provenance and invalid retention are rejected explicitly',async t=>{
  const f=await fixture(t);
  for(const actorId of ['../actor','a/b','a\\b','',null])await assert.rejects(()=>f.store.get({actorId,recordId:'1'.repeat(64)}),{code:'REPORT_STORE_ACTOR_ID'});
  for(const recordId of ['../record','a'.repeat(63),'G'.repeat(64)])await assert.rejects(()=>f.store.remove({actorId:'actor',recordId}),{code:'REPORT_STORE_RECORD_ID'});
  await assert.rejects(()=>f.store.put(input({idempotencyKey:'../one'})),{code:'REPORT_STORE_IDEMPOTENCY_KEY'});
  await assert.rejects(()=>f.store.put({...input(),automaticSave:true}),{code:'REPORT_STORE_PUT_INPUT'});
  const missing=input();delete missing.versions.dataFingerprint;await assert.rejects(()=>f.store.put(missing),{code:'REPORT_STORE_VERSIONS'});
  const duplicate=input();duplicate.versions.interpretationPolicies.push({...duplicate.versions.interpretationPolicies[0]});await assert.rejects(()=>f.store.put(duplicate),{code:'REPORT_STORE_VERSIONS'});
  for(const expiresAt of ['2026-11-22','2026-11-21T12:00:00.000Z',new Date(START+REPORT_STORE_MAX_RETENTION_MS+1).toISOString()])await assert.rejects(()=>f.store.put(input({expiresAt})),{code:'REPORT_STORE_EXPIRY'});
});

test('operator key/validator/size setup is explicit and close zeroes only store-owned key copies',async t=>{
  const f=await fixture(t);
  for(const changed of [{encryptionKey:Buffer.alloc(31)},{indexKey:ENCRYPTION},{validateReport:undefined},{validateReport:async()=>true},{maxRecordBytes:999}])await assert.rejects(()=>createLocalReportStore({...f.options,...changed}));
  const keyBefore=Buffer.from(ENCRYPTION),indexBefore=Buffer.from(INDEX);f.store.close();assert.deepEqual(ENCRYPTION,keyBefore);assert.deepEqual(INDEX,indexBefore);
  await assert.rejects(()=>f.store.get({actorId:'actor',recordId:'1'.repeat(64)}),{code:'REPORT_STORE_CLOSED'});
});

test('symlink roots and ancestor aliases are refused and later owner/file replacements cannot escape the selected directory',async t=>{
  const f=await fixture(t),outside=join(f.directory,'outside'),alias=join(f.directory,'alias');await mkdir(outside);await symlink(outside,alias,process.platform==='win32'?'junction':'dir');
  await assert.rejects(()=>createLocalReportStore({...f.options,directory:alias}),{code:'REPORT_STORE_UNSAFE_DIRECTORY'});
  await assert.rejects(()=>createLocalReportStore({...f.options,directory:join(alias,'nested')}),{code:'REPORT_STORE_UNSAFE_DIRECTORY'});
  const saved=await f.store.put(input()),actorDir=join(f.directory,owner(input().actorId)),moved=join(f.directory,'moved-owner');await rename(actorDir,moved);await symlink(moved,actorDir,process.platform==='win32'?'junction':'dir');
  await assert.rejects(()=>f.store.get({actorId:input().actorId,recordId:saved.recordId}),{code:'REPORT_STORE_UNSAFE_DIRECTORY'});
});

test('a hardlinked record is refused rather than reading a substituted file',async t=>{
  const f=await fixture(t),saved=await f.store.put(input()),path=storedPath(f.directory,input().actorId,saved.recordId);await link(path,join(f.directory,'extra-hardlink'));
  await assert.rejects(()=>f.store.get({actorId:input().actorId,recordId:saved.recordId}),{code:'REPORT_STORE_UNSAFE_FILE'});
});

test('record and lock symlinks are rejected without following or deleting their targets',async t=>{
  const f=await fixture(t),saved=await f.store.put(input()),path=storedPath(f.directory,input().actorId,saved.recordId),original=join(f.directory,'original-record');await rename(path,original);await symlink(original,path,'file');
  await assert.rejects(()=>f.store.get({actorId:input().actorId,recordId:saved.recordId}),{code:'REPORT_STORE_UNSAFE_FILE'});
  await rm(path);await rename(original,path);
  const target=join(f.directory,'lock-target'),lock=join(f.directory,owner(input().actorId),saved.recordId+'.lock');await writeFile(target,'owned synthetic sentinel');await symlink(target,lock,'file');
  await assert.rejects(()=>f.store.remove({actorId:input().actorId,recordId:saved.recordId}),{code:'REPORT_STORE_UNSAFE_FILE'});assert.equal(await readFile(target,'utf8'),'owned synthetic sentinel');assert.equal((await readdir(dirname(path))).includes(saved.recordId+'.json'),true);
});

test('an abandoned lock fails boundedly and is never guessed stale or deleted automatically',async t=>{
  const f=await fixture(t),saved=await f.store.put(input()),lock=join(f.directory,owner(input().actorId),saved.recordId+'.lock');await writeFile(lock,'');
  await assert.rejects(()=>f.store.get({actorId:input().actorId,recordId:saved.recordId}),{code:'REPORT_STORE_BUSY'});assert.equal(await readFile(lock,'utf8'),'');
  await rm(lock);assert.equal((await f.store.get({actorId:input().actorId,recordId:saved.recordId})).status,'FOUND');
});
