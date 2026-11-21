import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp,rm,readFile,writeFile,mkdir,link,symlink} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join,resolve} from 'node:path';
import {randomBytes} from 'node:crypto';
import {spawn} from 'node:child_process';
import {pathToFileURL} from 'node:url';
import {createPurchaseVault,loadOrCreatePurchaseKeys,purchaseJsonClone} from '../scripts/purchase/vault.mjs';
import {createGuestSessions,guestCookie,readGuestCookie,clearGuestCookie} from '../scripts/purchase/sessions.mjs';

const initial=()=>({sessions:{},orders:{},drafts:{},events:{},count:0});
async function setup(t){const directory=await mkdtemp(join(tmpdir(),'saju-s8-vault-'));t.after(()=>rm(directory,{recursive:true,force:true}));return directory;}
const error=code=>value=>value?.code===code&&!String(value.message).includes('saju-s8-vault-');

test('S8 vault encrypts DOB and persists clones across clean restart',async t=>{
  const directory=await setup(t),key=randomBytes(32);let vault=await createPurchaseVault({directory,encryptionKey:key,initialState:initial()});
  await vault.mutate(state=>{state.drafts.example={date:'1992-11-24',actor:'synthetic-person'};return state.drafts.example;});
  const state=await vault.read();state.drafts.example.date='1900-01-01';assert.equal((await vault.read()).drafts.example.date,'1992-11-24');
  const bytes=await readFile(join(directory,'state.sealed.json'),'utf8');assert.ok(!bytes.includes('1992-11-24'));assert.ok(!bytes.includes('synthetic-person'));assert.match(bytes,/AES-256-GCM/);
  await vault.close();vault=await createPurchaseVault({directory,encryptionKey:key,initialState:initial()});assert.equal((await vault.read()).drafts.example.date,'1992-11-24');await vault.close();
});

test('S8 vault transactions serialize concurrent changes and never expose internal references',async t=>{
  const directory=await setup(t),vault=await createPurchaseVault({directory,encryptionKey:randomBytes(32),initialState:initial()});
  const results=await Promise.all(Array.from({length:20},()=>vault.mutate(state=>({value:++state.count}))));assert.equal(new Set(results.map(x=>x.value)).size,20);assert.equal((await vault.read()).count,20);
  await vault.close();await assert.rejects(async()=>vault.read(),error('PURCHASE_VAULT_CLOSED'));
});

test('S8 vault callback failure, non-JSON and async callback cannot commit partial changes',async t=>{
  const directory=await setup(t),vault=await createPurchaseVault({directory,encryptionKey:randomBytes(32),initialState:initial()});
  const domainFailure=Object.assign(new Error('internal domain failure'),{code:'DOMAIN_TEST_REJECTION'});
  await assert.rejects(vault.mutate(state=>{state.count=5;throw domainFailure;}),value=>value===domainFailure);
  await assert.rejects(vault.mutate(state=>{state.count=7;state.bad=[,1];}),error('PURCHASE_VAULT_JSON_REQUIRED'));
  assert.throws(()=>vault.mutate(async state=>{state.count=9;}),error('PURCHASE_VAULT_SYNC_MUTATOR'));
  assert.equal((await vault.read()).count,0);await vault.close();
  let called=false;assert.throws(()=>purchaseJsonClone({get secret(){called=true;return 1;}}),error('PURCHASE_VAULT_JSON_REQUIRED'));assert.equal(called,false);
});

test('S8 vault wrong key and modified ciphertext fail closed without replacing stored state',async t=>{
  const directory=await setup(t),key=randomBytes(32),vault=await createPurchaseVault({directory,encryptionKey:key,initialState:initial()});await vault.close();const before=await readFile(join(directory,'state.sealed.json'));
  await assert.rejects(createPurchaseVault({directory,encryptionKey:randomBytes(32),initialState:initial()}),error('PURCHASE_VAULT_INTEGRITY_FAILED'));assert.deepEqual(await readFile(join(directory,'state.sealed.json')),before);
  const payload=JSON.parse(before);payload.ciphertext=(payload.ciphertext[0]==='A'?'B':'A')+payload.ciphertext.slice(1);await writeFile(join(directory,'state.sealed.json'),JSON.stringify(payload));
  await assert.rejects(createPurchaseVault({directory,encryptionKey:key,initialState:initial()}),error('PURCHASE_VAULT_INTEGRITY_FAILED'));
});

test('S8 vault exclusive ownership rejects second writer and malformed stale locks',async t=>{
  const directory=await setup(t),key=randomBytes(32),vault=await createPurchaseVault({directory,encryptionKey:key,initialState:initial()});
  await assert.rejects(createPurchaseVault({directory,encryptionKey:key,initialState:initial()}),error('PURCHASE_VAULT_BUSY'));await vault.close();
  await writeFile(join(directory,'writer.lock'),'not a lock');await assert.rejects(createPurchaseVault({directory,encryptionKey:key,initialState:initial()}),error('PURCHASE_VAULT_LOCK_REVIEW_REQUIRED'));
});

test('S8 process crash leaves encrypted committed state and a provably dead PID lock can recover',async t=>{
  const directory=await setup(t),key=randomBytes(32),moduleUrl=pathToFileURL(resolve('scripts/purchase/vault.mjs')).href;
  const code=`import {createPurchaseVault} from ${JSON.stringify(moduleUrl)};let text='';for await(const chunk of process.stdin)text+=chunk;const input=JSON.parse(text);const v=await createPurchaseVault({directory:input.directory,encryptionKey:Buffer.from(input.key,'hex'),initialState:{sessions:{},count:0}}); await v.mutate(s=>{s.count=19;}); process.stdout.write('READY'); setInterval(()=>{},1000);`;
  // An ephemeral synthetic storage key travels through stdin, never process args.
  const child=spawn(process.execPath,['--input-type=module','-e',code],{stdio:['pipe','pipe','pipe'],windowsHide:true});child.stdin.end(JSON.stringify({directory,key:key.toString('hex')}));let stderr='';child.stderr.on('data',x=>{stderr+=x;});
  await new Promise((resolveReady,reject)=>{child.stdout.once('data',()=>resolveReady());child.once('error',reject);child.once('exit',code=>reject(Error('child early exit '+code+' '+stderr)));});
  const exited=new Promise(resolveExit=>child.once('exit',resolveExit));child.kill();await exited;
  const vault=await createPurchaseVault({directory,encryptionKey:key,initialState:initial()});assert.equal((await vault.read()).count,19);await vault.close();
});

test('S8 leftover startup guard is review-required, never guessed away',async t=>{
  const directory=await setup(t);await writeFile(join(directory,'startup.guard'),'{}');
  await assert.rejects(createPurchaseVault({directory,encryptionKey:randomBytes(32),initialState:initial()}),error('PURCHASE_VAULT_STARTUP_REVIEW_REQUIRED'));assert.equal(await readFile(join(directory,'startup.guard'),'utf8'),'{}');
});

test('S8 vault rejects linked storage files and validates state before commit',async t=>{
  const directory=await setup(t),root=join(directory,'vault'),key=randomBytes(32);const vault=await createPurchaseVault({directory:root,encryptionKey:key,initialState:initial(),validateState:state=>state.count>=0});
  await assert.rejects(vault.mutate(state=>{state.count=-1;}),error('PURCHASE_VAULT_STATE_INVALID'));assert.equal((await vault.read()).count,0);await vault.close();
  await link(join(root,'state.sealed.json'),join(directory,'alias'));await assert.rejects(createPurchaseVault({directory:root,encryptionKey:key,initialState:initial()}),error('PURCHASE_VAULT_UNSAFE_FILE'));
});

test('S8 local operator keys are distinct, reusable, and do not regenerate over corruption',async t=>{
  const directory=await setup(t),first=await loadOrCreatePurchaseKeys(directory),second=await loadOrCreatePurchaseKeys(directory);assert.equal(Object.keys(first).length,5);assert.equal(new Set(Object.values(first).map(x=>x.toString('hex'))).size,5);
  for(const name of Object.keys(first))assert.deepEqual(first[name],second[name]);
  await writeFile(join(directory,'local-test-keys.json'),'invalid');await assert.rejects(loadOrCreatePurchaseKeys(directory),error('PURCHASE_KEYS_INVALID'));assert.equal(await readFile(join(directory,'local-test-keys.json'),'utf8'),'invalid');
});

test('S8 server-issued guest sessions authenticate, isolate actors and survive vault restart',async t=>{
  const directory=await setup(t),encryptionKey=randomBytes(32),indexKey=randomBytes(32);let vault=await createPurchaseVault({directory,encryptionKey,initialState:initial()}),sessions=createGuestSessions({vault,indexKey});
  const alice=await sessions.issue(),bob=await sessions.issue();assert.notEqual(alice.actorId,bob.actorId);assert.notEqual(alice.token,bob.token);assert.notEqual(alice.token,alice.csrfToken);assert.equal((await sessions.authenticate(alice.token)).actorId,alice.actorId);assert.equal(await sessions.authenticate(alice.actorId),null);assert.equal(await sessions.authenticate(randomBytes(32).toString('base64url')),null);
  const state=await vault.read();assert.ok(!JSON.stringify(state).includes(alice.token));assert.equal(sessions.verifyCsrf(await sessions.authenticate(alice.token),alice.csrfToken),true);assert.equal(sessions.verifyCsrf(await sessions.authenticate(alice.token),bob.csrfToken),false);
  sessions.close();await vault.close();vault=await createPurchaseVault({directory,encryptionKey,initialState:initial()});sessions=createGuestSessions({vault,indexKey});assert.equal((await sessions.authenticate(alice.token)).actorId,alice.actorId);sessions.close();await vault.close();
});

test('S8 expired and revoked sessions refuse re-read identity; cookie tokens are not actor strings',async t=>{
  const directory=await setup(t),vault=await createPurchaseVault({directory,encryptionKey:randomBytes(32),initialState:initial()});let ms=Date.parse('2026-11-22T00:00:00Z');const sessions=createGuestSessions({vault,indexKey:randomBytes(32),now:()=>new Date(ms),ttlMs:1000});
  const one=await sessions.issue();ms+=1000;assert.equal(await sessions.authenticate(one.token),null);const two=await sessions.issue();assert.equal((await sessions.revoke(two.token)).status,'REVOKED');assert.equal(await sessions.authenticate(two.token),null);assert.equal((await sessions.revoke(two.token)).status,'NOT_FOUND');
  const cookie=guestCookie(two.token);assert.match(cookie,/HttpOnly; SameSite=Strict/);assert.ok(!cookie.includes('Domain='));assert.equal(readGuestCookie(cookie),two.token);assert.equal(readGuestCookie('saju_s8_guest=guest_fake'),null);assert.equal(readGuestCookie(`saju_s8_guest=${two.token}; saju_s8_guest=${two.token}`),null);assert.match(clearGuestCookie(),/Max-Age=0/);sessions.close();await vault.close();
});
