import assert from 'node:assert/strict';
import { test } from 'node:test';
import { appendFile, mkdtemp, rm } from 'node:fs/promises';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { buildE5Artifact } from '../scripts/engine/build-e5.mjs';
import { verifyE5Package, runE5Package } from '../scripts/engine/e5-package.mjs';

test('E5 pins and restores the original E3 dependency graph and checks module and manifest integrity', async t => {
  const tmp = await mkdtemp(join(tmpdir(), 'manse-e5-'));
  t.after(() => rm(tmp, { recursive: true, force: true }));
  const source = join(tmp, 'code'), out = join(tmp, 'relocated');
  await assert.rejects(buildE5Artifact({ outDir: source }), /E5_EXPECTED_SOURCE_REVISION_REQUIRED/);
  await assert.rejects(buildE5Artifact({ outDir: source, sourceRevision: '0'.repeat(40) }), /E5_SOURCE_SNAPSHOT_REQUIRED/);
  const { manifestSha256: pin, e3ManifestSha256 } = await buildE5Artifact({ outDir: source, pilot: true });
  const info = await verifyE5Package(source, pin);
  assert.equal(info.e3ManifestSha256, e3ManifestSha256);
  assert.equal(info.containsCalendarData, false);
  for (const path of ['e3/dist/e3/patternRulesV1.js', 'dist/e5/patternV2.js',
    'dist/e5/climateV2.js', 'dist/e5/tongguanV1.js']) {
    assert.ok(info.files.some(file => file.path === path), path);
  }
  assert.ok(info.files.every(file => !/(\.private|node_modules)\//.test(file.path)));
  await assert.rejects(runE5Package(source, ['restore', '--manifest-sha', pin, '--out', join(source, 'inside')]),
    /E5_OVERLAPPING_PATHS/);
  await assert.rejects(runE5Package(source, ['restore', '--manifest-sha', pin, '--out', out, '--data-pack', 'missing']),
    /E5_PAIRED_DATA_PATHS/);
  await runE5Package(source, ['restore', '--manifest-sha', pin, '--out', out]);
  assert.deepEqual(await verifyE5Package(out, pin), info);
  await appendFile(join(out, 'dist', 'e5', 'climateV2.js'), '\nthrow Error("payload executed before verification");');
  await assert.rejects(runE5Package(out, ['run', '--manifest-sha', pin, '--request', 'irrelevant', '--data-pack', 'irrelevant']),
    /E1_ARTIFACT_FILE_SET_OR_BYTES_CHANGED/);
  await appendFile(join(out, 'engine-manifest.json'), ' ');
  await assert.rejects(verifyE5Package(out, pin), /E5_MANIFEST_PIN_MISMATCH/);
});
