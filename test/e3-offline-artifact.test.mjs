import assert from 'node:assert/strict';
import {test} from 'node:test';
import {appendFile,mkdtemp,readFile,rm,writeFile} from 'node:fs/promises';
import {join} from 'node:path';
import {tmpdir} from 'node:os';
import {buildE3Artifact} from '../scripts/engine/build-e3.mjs';
import {verifyE3Package,runE3Package} from '../scripts/engine/e3-package.mjs';

test('E3 packages a data-free, operator-pinned graph and rejects untrusted bytes before running it',async t=>{
  const tmp=await mkdtemp(join(tmpdir(),'manse-e3-'));
  t.after(()=>rm(tmp,{recursive:true,force:true}));
  const source=join(tmp,'artifact'),out=join(tmp,'restored');
  await assert.rejects(buildE3Artifact({outDir:source}),/E3_EXPECTED_SOURCE_REVISION_REQUIRED/);
  await assert.rejects(buildE3Artifact({outDir:source,sourceRevision:'0'.repeat(40)}),/E3_SOURCE_SNAPSHOT_REQUIRED/);
  const {manifestSha256:pin,e2ManifestSha256}=await buildE3Artifact({outDir:source,pilot:true});
  const meta=await verifyE3Package(source,pin);
  assert.equal(meta.buildMode,'PILOT');
  assert.equal(meta.containsCalendarData,false);
  assert.equal(meta.e2ManifestSha256,e2ManifestSha256);
  assert.ok(meta.files.some(entry=>entry.path==='scripts/engine/e3.mjs'));
  assert.ok(meta.files.some(entry=>entry.path==='e2/dist/e2/sinsalV1.js'));
  assert.ok(meta.files.every(entry=>!entry.path.startsWith('.private/')&&!entry.path.includes('node_modules/')));
  await assert.rejects(runE3Package(source,['restore','--manifest-sha',pin,'--out',join(source,'nested')]),/E3_OVERLAPPING_PATHS/);
  await assert.rejects(runE3Package(source,['restore','--manifest-sha',pin,'--out',out,'--data-pack','data']),/E3_PAIRED_DATA_PATHS/);
  const restore=await runE3Package(source,['restore','--manifest-sha',pin,'--out',out]);
  assert.equal(restore.dataPackRestored,false);
  assert.deepEqual(await verifyE3Package(out,pin),meta);
  const verifier=join(out,'e2','e1','engine.mjs'),clean=await readFile(verifier);
  await appendFile(verifier,"\nthrow Error('unverified verifier must not execute');");
  await assert.rejects(verifyE3Package(out,pin),/E3_VERIFIER_CHANGED/);
  await writeFile(verifier,clean);
  await appendFile(join(out,'scripts','engine','e3.mjs'),"\nthrow Error('unverified runtime must not execute');");
  await assert.rejects(runE3Package(out,['run','--manifest-sha',pin,'--request','irrelevant','--data-pack','irrelevant']),
    /E1_ARTIFACT_FILE_SET_OR_BYTES_CHANGED/);
  await appendFile(join(out,'engine-manifest.json'),' ');
  await assert.rejects(verifyE3Package(out,pin),/E3_MANIFEST_PIN_MISMATCH/);
});
