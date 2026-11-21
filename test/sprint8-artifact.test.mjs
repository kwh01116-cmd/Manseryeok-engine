/** Data-free packaging checks. Accepted private data is never copied into public fixtures. */
import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp,readFile,writeFile,rm,symlink} from 'node:fs/promises';
import {join,resolve,relative,isAbsolute,sep,basename} from 'node:path';
import {tmpdir} from 'node:os';
import {spawnSync} from 'node:child_process';
import {pathToFileURL} from 'node:url';
import {buildPurchaseArtifact} from '../scripts/purchase/artifact.mjs';
import {verifyPurchaseArtifact,restorePurchaseArtifact,PURCHASE_ARTIFACT_SCHEMA,purchaseArtifactArgs,assertPurchaseRuntimeDirectories} from '../scripts/purchase/artifact-runtime.mjs';
import {writeOfflineGuards,cleanOfflineEnvironment} from '../scripts/offline/guards.mjs';
const repo=resolve(import.meta.dirname,'..');

test('Sprint8 artifact requires an external manifest pin and explicit, nonduplicated CLI options',async()=>{
  await assert.rejects(()=>verifyPurchaseArtifact('missing'),/TRUSTED_MANIFEST_PIN_REQUIRED/);
  for(const values of [[],['--manifest-sha'],['--manifest-sha','a','--manifest-sha','b'],['--fake','x']])assert.throws(()=>purchaseArtifactArgs(values,['--manifest-sha']));
  assert.deepEqual(purchaseArtifactArgs(['--manifest-sha','a'],['--manifest-sha']),{'--manifest-sha':'a'});
  assert.throws(()=>assertPurchaseRuntimeDirectories('engine',{stateDirectory:'engine/state',dataDirectory:'pack'}),/ENGINE_DATA_STATE_OVERLAP/);
  assert.throws(()=>assertPurchaseRuntimeDirectories('engine',{stateDirectory:'pack/state',dataDirectory:'pack'}),/ENGINE_DATA_STATE_OVERLAP/);
  assert.equal(assertPurchaseRuntimeDirectories('engine',{stateDirectory:'state',dataDirectory:'pack'}),true);
});

test('Sprint8 fresh data-free artifact restores independently and rejects payload/pin changes',async t=>{
  const directory=await mkdtemp(join(tmpdir(),'manseryeok-s8-artifact-public-'));
  try{
    const engine=join(directory,'engine'),restored=join(directory,'restored engine');
    const {manifest,manifestSha256}=await buildPurchaseArtifact({outDir:engine});
    await t.test('new schema carries real S7/web modules and no calendar files or live payment gate',async()=>{
      assert.equal(manifest.schemaVersion,PURCHASE_ARTIFACT_SCHEMA);assert.equal(manifest.containsCalendarData,false);assert.equal(manifest.livePaymentAllowed,false);assert.equal(manifest.paidReportReady,false);
      assert.equal(manifest.runtime.externalDependencies,0);assert.equal(manifest.runtime.npmInstallRequired,false);assert.equal(manifest.runtime.gitRequired,false);assert.equal(manifest.runtime.externalNetworkRequired,false);
      assert.equal(manifest.compilation.method,'PINNED_TYPESCRIPT_FRESH_IN_MEMORY_EMIT');assert.equal(manifest.compilation.diagnostics,0);
      const names=manifest.files.map(f=>f.path);for(const p of ['scripts/purchase/web.mjs','scripts/product/interpreted-report.mjs','scripts/product/consumer-report.mjs','scripts/product/report-store.mjs','dist/report/interpretationPolicyV1.js','dist/report/narrativePipelineV1.js','dist/report/consumerReportV1.js','dist/purchase/orderStateV1.js','web/purchase/index.html','web/purchase/app.js','web/purchase/styles.css'])assert.ok(names.includes(p),p);
      assert.ok(names.every(p=>!/(?:\.private|node_modules|candidate\.json|raw-responses\.ndjson|local-test-keys|state\.sealed)/.test(p)));
      for(const p of names)assert.equal((await readFile(join(engine,p),'utf8')).includes(repo),false,p);
      assert.equal((await verifyPurchaseArtifact(engine,{expectedManifestSha256:manifestSha256})).schemaVersion,PURCHASE_ARTIFACT_SCHEMA);
    });
    await t.test('restore writes a new directory only, excludes data/state and preserves the trusted pin',async()=>{
      await restorePurchaseArtifact({artifactDirectory:engine,outDir:restored,expectedManifestSha256:manifestSha256});
      assert.deepEqual((await verifyPurchaseArtifact(restored,{expectedManifestSha256:manifestSha256})).files,manifest.files);
      await assert.rejects(()=>restorePurchaseArtifact({artifactDirectory:engine,outDir:restored,expectedManifestSha256:manifestSha256}),/DESTINATION_EXISTS/);
      await assert.rejects(()=>restorePurchaseArtifact({artifactDirectory:engine,outDir:join(engine,'nested'),expectedManifestSha256:manifestSha256}),/PATH_OVERLAP/);
    });
    await t.test('detached verify executes without npm, Git, network, source imports or KASI keys',async()=>{
      const {preload}=await writeOfflineGuards(directory,{forbiddenRoot:repo}),env=cleanOfflineEnvironment('UTC');for(const k of Object.keys(env))if(/^path$/i.test(k))delete env[k];env.PATH='';
      const run=pin=>spawnSync(process.execPath,['--import',pathToFileURL(preload).href,join(restored,'verify-web.mjs'),'--manifest-sha',pin],{cwd:directory,env,windowsHide:true,encoding:'utf8',timeout:30000,maxBuffer:2_000_000});
      const accepted=run(manifestSha256);assert.equal(accepted.status,0,accepted.stderr);assert.equal(JSON.parse(accepted.stdout).status,'VERIFIED');assert.equal(accepted.stderr,'');
      const rejected=run('0'.repeat(64));assert.equal(rejected.status,1);assert.equal(rejected.stdout,'');assert.equal(rejected.stderr,'S8_ARTIFACT_VERIFY_REJECTED\n');
    });
    await t.test('modified, missing, extra and aliased payloads fail verification',async()=>{
      const path=join(restored,'scripts/purchase/fake-payment.mjs'),original=await readFile(path);await writeFile(path,Buffer.concat([original,Buffer.from('\n//modified')]));
      await assert.rejects(()=>verifyPurchaseArtifact(restored,{expectedManifestSha256:manifestSha256}),/CONTENT_CHANGED/);await writeFile(path,original);
      await writeFile(join(restored,'unlisted.txt'),'not in package');await assert.rejects(()=>verifyPurchaseArtifact(restored,{expectedManifestSha256:manifestSha256}),/FILE_SET_CHANGED/);await rm(join(restored,'unlisted.txt'));
      const manifestPath=join(restored,'artifact-manifest.json'),manifestBytes=await readFile(manifestPath);await writeFile(manifestPath,JSON.stringify({...manifest,livePaymentAllowed:true}));await assert.rejects(()=>verifyPurchaseArtifact(restored,{expectedManifestSha256:manifestSha256}),/MANIFEST_PIN_MISMATCH/);await writeFile(manifestPath,manifestBytes);
      const alias=join(directory,'alias');await symlink(restored,alias,process.platform==='win32'?'junction':'dir');await assert.rejects(()=>verifyPurchaseArtifact(alias,{expectedManifestSha256:manifestSha256}),/UNSAFE_DIRECTORY/);
      await rm(path);await assert.rejects(()=>verifyPurchaseArtifact(restored,{expectedManifestSha256:manifestSha256}));
    });
  }finally{const rel=relative(resolve(tmpdir()),resolve(directory));assert.ok(rel&&!isAbsolute(rel)&&rel!=='..'&&!rel.startsWith('..'+sep)&&basename(directory).startsWith('manseryeok-s8-artifact-public-'));await rm(directory,{recursive:true,force:true});}
});
