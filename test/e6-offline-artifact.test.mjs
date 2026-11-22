import assert from 'node:assert/strict';
import { test } from 'node:test';
import { appendFile, mkdtemp, rm } from 'node:fs/promises';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { buildE6Artifact } from '../scripts/engine/build-e6.mjs';
import { verifyE6Package, runE6Package } from '../scripts/engine/e6-package.mjs';

test('E6 code-only package can restore and requires a valid operator pin before loading an E6 payload', async t => {
  const tmp = await mkdtemp(join(tmpdir(), 'manse-e6-'));
  t.after(() => rm(tmp, { recursive: true, force: true }));
  const source = join(tmp, 'code'), target = join(tmp, 'restored');
  await assert.rejects(buildE6Artifact({ outDir: source }), /E6_EXPECTED_SOURCE_REVISION_REQUIRED/);
  const { manifestSha256: pin, e5ManifestSha256 } = await buildE6Artifact({ outDir: source, pilot: true });
  const before = await verifyE6Package(source, pin);
  assert.equal(before.e5ManifestSha256, e5ManifestSha256);
  assert.equal(before.containsCalendarData, false);
  assert.ok(before.files.some(file => file.path === 'dist/e6/temporalRelationsV1.js'));
  assert.ok(before.files.some(file => file.path === 'e5/docs/contracts/ENGINE_E5_API_V01.md'));
  await assert.rejects(runE6Package(source, ['restore', '--manifest-sha', pin, '--out', join(source, 'nested')]),
    /E6_OVERLAPPING_PATHS/);
  await runE6Package(source, ['restore', '--manifest-sha', pin, '--out', target]);
  assert.deepEqual(await verifyE6Package(target, pin), before);
  await appendFile(join(target, 'dist/e6/temporalRelationsV1.js'), '\nthrow Error("unverified module");');
  await assert.rejects(runE6Package(target, ['run', '--manifest-sha', pin, '--data-pack', 'irrelevant', '--request', 'irrelevant']),
    /E1_ARTIFACT_FILE_SET_OR_BYTES_CHANGED/);
  await appendFile(join(target, 'engine-manifest.json'), '\n');
  await assert.rejects(verifyE6Package(target, pin), /E6_MANIFEST_PIN_MISMATCH/);
});
