/** Compile and pin the new closure without reissuing nested E5 evidence modules. */
import { execFileSync } from 'node:child_process';
import { readFile } from 'node:fs/promises';
import { createRequire, isBuiltin } from 'node:module';
import { dirname, join, relative, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { freshCompilation } from '../offline/build.mjs';
import { integratedImportsIn } from '../offline/build-v2.mjs';
import { assertNode22, check, createNewDirectory, digest, filesBelow, hashFiles, parsePairs, portable, writeNew } from '../offline/integrity.mjs';
import { buildE5Artifact } from './build-e5.mjs';
import { ENGINE_ARTIFACT_SCHEMA } from './e1-package.mjs';
import { verifyE6Package } from './e6-package.mjs';

const repo = resolve(import.meta.dirname, '../..');
const entries = ['scripts/engine/e6.mjs', 'scripts/engine/e6-cli.mjs', 'scripts/engine/e6-context.mjs'];
const documents = [
  'docs/contracts/examples/engine-e6-request-v1.json', 'docs/contracts/ENGINE_E6_API_V01.md',
  'docs/contracts/ENGINE_E6_TIME_AND_DIFF_CONTRACT.md',
  'docs/contracts/engine-e6-request-v1.schema.json', 'docs/contracts/engine-e6-result-v1.schema.json',
  'docs/research/ENGINE_E6_NATAL_TRANSIT_RELATION_POLICY_V01.md',
];
const builtins = new Set(['node:fs/promises', 'node:url', 'node:path']);

function checkout() {
  const git = (...args) => execFileSync('git', ['-c', 'safe.directory=' + portable(repo), '-c', 'core.excludesFile=', ...args],
    { cwd: repo, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] }).trim();
  return { revision: git('rev-parse', 'HEAD'), status: git('status', '--porcelain=v1', '--untracked-files=all') };
}

async function runtimeClosure(inner, ts) {
  const innerPaths = new Set(inner.files.map(entry => entry.path));
  const { emitted } = freshCompilation(repo, ts);
  const pending = [...entries], modules = new Map();
  while (pending.length > 0) {
    const path = pending.pop();
    if (modules.has(path)) continue;
    const nested = ['', 'e3/', 'e3/e2/', 'e3/e2/e1/', 'e3/e2/e1/core/'].map(prefix => prefix + path).find(p => innerPaths.has(p));
    if (nested) {
      const target = portable(relative(dirname(path), join('e5', nested)));
      modules.set(path, "export * from '" + (target.startsWith('.') ? target : './' + target) + "';\n");
      continue;
    }

    const script = entries.includes(path);
    check(script || path.startsWith('dist/e6/'), 'E6_UNAPPROVED_CLOSURE');
    const code = script ? await readFile(join(repo, path), 'utf8') : emitted.get(path)?.text;
    check(typeof code === 'string', 'E6_RUNTIME_SOURCE_REQUIRED');
    modules.set(path, code);
    for (const specifier of integratedImportsIn(code, path, ts)) {
      if (isBuiltin(specifier)) {
        check(builtins.has(specifier), 'E6_BUILTIN_NOT_APPROVED');
      } else {
        check(specifier.startsWith('.'), 'E6_EXTERNAL_DEPENDENCY');
        const next = portable(relative(repo, resolve(repo, dirname(path), specifier)));
        check(!next.startsWith('../'), 'E6_RUNTIME_PATH_ESCAPE');
        pending.push(next);
      }
    }
  }
  return modules;
}

export async function buildE6Artifact({ outDir, sourceRevision, pilot = false }) {
  assertNode22();
  check(typeof pilot === 'boolean' && (pilot || /^[0-9a-f]{40}$/.test(sourceRevision ?? '')),
    'E6_EXPECTED_SOURCE_REVISION_REQUIRED');
  const before = checkout();
  check((!sourceRevision || sourceRevision === before.revision) && (pilot || before.status === ''),
    'E6_SOURCE_SNAPSHOT_REQUIRED');

  const ts = createRequire(join(repo, 'package.json'))('typescript');
  check(ts.version === '5.8.3', 'PINNED_TYPESCRIPT_REQUIRED');
  const root = await createNewDirectory(outDir);
  const base = await buildE5Artifact({ outDir: join(root, 'e5'), sourceRevision: before.revision, pilot });
  const inner = JSON.parse(await readFile(join(root, 'e5/engine-manifest.json'), 'utf8'));
  check(inner.sourceRevision === before.revision && inner.sourceState.workingTreeStatusSha256 === digest(before.status),
    'E6_SOURCE_SNAPSHOT_DRIFT');

  for (const [path, code] of await runtimeClosure(inner, ts)) await writeNew(root, path, code);
  for (const path of documents) await writeNew(root, path, await readFile(join(repo, path)));
  await writeNew(root, 'package.json', JSON.stringify({
    name: '@manseryeok/engine-parity-e6-internal', version: '0.1.0', type: 'module', private: true,
    engines: { node: '>=22 <23' },
  }, null, 2) + '\n');
  await writeNew(root, 'engine.mjs', await readFile(join(repo, 'scripts/engine/e6-package.mjs')));

  const after = checkout();
  check(after.revision === before.revision && after.status === before.status, 'E6_SOURCE_SNAPSHOT_DRIFT');
  const manifest = {
    schemaVersion: ENGINE_ARTIFACT_SCHEMA, profileId: 'ENGINE-PARITY-E6-V01', version: '0.1.0', nodeMajor: 22,
    containsCalendarData: false, sourceRevision: inner.sourceRevision, sourceState: inner.sourceState,
    buildMode: pilot ? 'PILOT' : 'FIXED_SOURCE_REVISION', acceptedDataPackSha256: inner.acceptedDataPackSha256,
    e5ManifestSha256: base.manifestSha256, releaseStatus: inner.releaseStatus, files: await hashFiles(root, await filesBelow(root)),
  };
  const bytes = Buffer.from(JSON.stringify(manifest, null, 2) + '\n');
  const manifestSha256 = digest(bytes);
  await writeNew(root, 'engine-manifest.json', bytes);
  await verifyE6Package(root, manifestSha256);
  return { sourceRevision: manifest.sourceRevision, workingTreeDirty: manifest.sourceState.workingTreeDirty,
    buildMode: manifest.buildMode, manifestSha256, e5ManifestSha256: base.manifestSha256, files: manifest.files.length };
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  try {
    const options = parsePairs(process.argv.slice(2), ['--out', '--source-revision', '--pilot']);
    check(!options['--pilot'] || options['--pilot'] === 'true', 'E6_PILOT_ARGUMENT');
    const result = await buildE6Artifact({ outDir: options['--out'], sourceRevision: options['--source-revision'], pilot: options['--pilot'] === 'true' });
    process.stdout.write(JSON.stringify(result) + '\n');
  } catch (error) {
    process.stderr.write(error.message + '\n');
    process.exitCode = 1;
  }
}
