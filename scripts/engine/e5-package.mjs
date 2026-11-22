/** Node-only E5 entrypoint. The operator provides an external manifest pin. */
import { createHash } from 'node:crypto';
import { lstat, readFile } from 'node:fs/promises';
import { dirname, join, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';

const manifestName = 'engine-manifest.json';
const innerPath = 'e3/engine.mjs';
const verifierPath = 'e3/e2/e1/engine.mjs';
const load = (root, path) => import(pathToFileURL(join(root, path)).href);
const hash = bytes => createHash('sha256').update(bytes).digest('hex');
function check(condition, code) { if (!condition) throw Error(code); }

async function readRegular(path) {
  const info = await lstat(path);
  check(info.isFile() && info.nlink === 1, 'E5_REGULAR_FILE_REQUIRED');
  return readFile(path);
}

export async function verifyE5Package(directory, pin) {
  check(process.versions.node.split('.')[0] === '22' && typeof pin === 'string' && /^[a-f0-9]{64}$/.test(pin),
    'E5_NODE22_AND_EXTERNAL_PIN_REQUIRED');
  const root = resolve(directory);
  for (let dir = join(root, 'e3', 'e2', 'e1'); ; dir = dirname(dir)) {
    const info = await lstat(dir);
    check(info.isDirectory() && !info.isSymbolicLink(), 'E5_DIRECTORY_REQUIRED');
    if (dir === dirname(dir)) break;
  }

  const bytes = await readRegular(join(root, manifestName));
  check(hash(bytes) === pin, 'E5_MANIFEST_PIN_MISMATCH');
  const manifest = JSON.parse(bytes);
  check(manifest.profileId === 'ENGINE-PARITY-E5-V01' && manifest.version === '0.1.0',
    'E5_PACKAGE_PROFILE_REQUIRED');

  const verifier = manifest.files.find(file => file.path === verifierPath);
  check(verifier?.sha256 === hash(await readRegular(join(root, verifierPath))), 'E5_VERIFIER_CHANGED');
  const { verifyEngineArtifact } = await load(root, verifierPath);
  await verifyEngineArtifact(root, pin);

  const { verifyE3Package } = await load(root, innerPath);
  const inner = await verifyE3Package(join(root, 'e3'), manifest.e3ManifestSha256);
  check(inner.sourceRevision === manifest.sourceRevision &&
    inner.sourceState.workingTreeStatusSha256 === manifest.sourceState.workingTreeStatusSha256 &&
    inner.acceptedDataPackSha256 === manifest.acceptedDataPackSha256, 'E5_E3_MANIFEST_BINDING');
  return manifest;
}

function argumentsFor(action, pairs) {
  const accepted = {
    verify: [], restore: ['--out', '--data-pack', '--data-out'], run: ['--data-pack', '--request'],
  };
  check(Object.hasOwn(accepted, action), 'E5_PACKAGE_ACTION');
  const allowed = ['--manifest-sha', ...accepted[action]];
  const result = Object.create(null);
  for (let i = 0; i < pairs.length; i += 2) {
    const key = pairs[i], value = pairs[i + 1];
    check(allowed.includes(key) && !Object.hasOwn(result, key) && value, 'E5_PACKAGE_ARGUMENTS');
    result[key] = value;
  }
  const required = action === 'restore' ? ['--manifest-sha', '--out'] : allowed;
  check(required.every(key => Object.hasOwn(result, key)), 'E5_PACKAGE_ARGUMENTS');
  return result;
}

export async function runE5Package(directory, [action, ...pairs]) {
  const root = resolve(directory);
  const options = argumentsFor(action, pairs), pin = options['--manifest-sha'];
  const manifest = await verifyE5Package(root, pin);
  if (action === 'verify') return { status: 'VERIFIED', files: manifest.files.length, sourceRevision: manifest.sourceRevision };
  if (action === 'run') {
    const { main } = await load(root, 'scripts/engine/e5-cli.mjs');
    return main(['--request', options['--request'], '--data-pack', options['--data-pack']]);
  }

  const { createNewDirectory, pathsOverlap, validateNewDirectory, writeNew } =
    await load(root, 'e3/e2/e1/core/scripts/offline/integrity.mjs');
  const { runE3Package } = await load(root, innerPath);
  const target = resolve(options['--out']), hasData = Object.hasOwn(options, '--data-pack');
  check(hasData === Object.hasOwn(options, '--data-out'), 'E5_PAIRED_DATA_PATHS');
  const paths = [root, target, ...(hasData ? [options['--data-pack'], options['--data-out']] : [])];
  for (const [index, path] of paths.entries()) {
    check(paths.slice(index + 1).every(other => !pathsOverlap(path, other)), 'E5_OVERLAPPING_PATHS');
  }
  if (hasData) await validateNewDirectory(options['--data-out'], { privateOnly: true });
  await createNewDirectory(target);

  const args = ['restore', '--manifest-sha', manifest.e3ManifestSha256, '--out', join(target, 'e3')];
  if (hasData) args.push('--data-pack', options['--data-pack'], '--data-out', options['--data-out']);
  await runE3Package(join(root, 'e3'), args);
  for (const { path } of manifest.files) {
    if (!path.startsWith('e3/')) await writeNew(target, path, await readRegular(join(root, path)));
  }
  await writeNew(target, manifestName, await readRegular(join(root, manifestName)));
  await verifyE5Package(target, pin);
  return { status: 'RESTORED', files: manifest.files.length, dataPackRestored: hasData };
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  try {
    const result = await runE5Package(import.meta.dirname, process.argv.slice(2));
    if (result) process.stdout.write(JSON.stringify(result) + '\n');
  } catch (error) {
    const code = /^[A-Z][A-Z_0-9]{2,100}$/.test(error?.message) ? error.message : 'E5_PACKAGE_REJECTED';
    process.stderr.write(code + '\n');
    process.exitCode = 1;
  }
}
