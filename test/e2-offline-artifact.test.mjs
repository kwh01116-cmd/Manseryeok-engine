import assert from 'node:assert/strict';
import {test} from 'node:test';
import {mkdtemp,readFile,readdir,appendFile,writeFile,rm} from 'node:fs/promises';
import {join} from 'node:path';
import {tmpdir} from 'node:os';
import {buildE2Artifact} from '../scripts/engine/build-e2.mjs';
import {verifyE2Package,runE2Package} from '../scripts/engine/e2-package.mjs';
import {E2_OFFLINE_CASES} from './fixtures/e2-offline-cases-v1.mjs';

test('E2 fixture lock includes separate real-time, dual-purpose, leap-month and unresolved birth requests',()=>{
  const ids=E2_OFFLINE_CASES.map(c=>c.id);
  assert.equal(new Set(ids).size,ids.length);
  const get=id=>E2_OFFLINE_CASES.find(c=>c.id===id);
  assert.equal(get('LEAP_LUNAR').birth.lunarDate.leap,true);
  assert.equal(get('LEAP_GREGORIAN').birth.date,'2025-07-25');
  assert.equal(get('M7_FORWARD').expected.firstSwitch,'1992-01-10T08:00');
  assert.equal(get('M7_REVERSE').expected.firstSwitch,'1999-03-13T14:00');
  assert.notEqual(get('WINTER_WOOD_CANDIDATE').expected.m5.status,get('WINTER_WOOD_PRESENT_FIRE_HOLD').expected.m5.status);
  assert.equal(get('DST_NONEXISTENT_CIVIL_TIME').expected.natalParents,0);
  assert.equal(get('DST_AMBIGUOUS_CIVIL_TIME').expected.natalParents,0);
});

test('E2 package verifies prior to importing any payload, restores a clean code-only directory, and rejects changed bytes',async t=>{
  const root=await mkdtemp(join(tmpdir(),'manse-e2-package-'));
  t.after(()=>rm(root,{recursive:true,force:true}));
  const source=join(root,'shipped'),out=join(root,'restored');
  const built=await buildE2Artifact({outDir:source});
  const pin=built.manifestSha256;
  const meta=await verifyE2Package(source,pin);
  assert.equal(meta.containsCalendarData,false);
  assert.equal(meta.e1ManifestSha256,built.e1ManifestSha256);
  assert.ok(meta.files.some(f=>f.path==='dist/e2/sinsalV1.js'));
  assert.ok(meta.files.some(f=>f.path==='e1/dist/e1/productStrengthV1.js'));
  assert.ok(!meta.files.some(f=>f.path.startsWith('.private/') || f.path.includes('node_modules/')));
  const restore=await runE2Package(source,['restore','--manifest-sha',pin,'--out',out]);
  assert.equal(restore.dataPackRestored,false);
  await verifyE2Package(out,pin);
  await assert.rejects(runE2Package(source,['restore','--manifest-sha',pin,'--out',out]),/ALREADY_EXISTS/);
  await assert.rejects(runE2Package(source,['restore','--manifest-sha',pin,'--out',join(source,'nested')]),/OVERLAPPING_PATHS/);
  await assert.rejects(runE2Package(source,['run','--manifest-sha',pin,'--request','x']),/ARGUMENTS/);
  await assert.rejects(verifyE2Package(source,'0'.repeat(64)),/PIN_MISMATCH/);
  const v=join(out,'e1/engine.mjs'),original=await readFile(v);
  await appendFile(v,"\nthrow Error('this must not execute');");
  await assert.rejects(verifyE2Package(out,pin),/E2_VERIFIER_CHANGED/);
  await writeFile(v,original);
  await appendFile(join(out,'dist/e2/sinsalV1.js'),'\n');
  await assert.rejects(verifyE2Package(out,pin),/FILE_SET_OR_BYTES_CHANGED/);
  assert.deepEqual((await readdir(source)).sort(),(await readdir(out)).sort());
});
