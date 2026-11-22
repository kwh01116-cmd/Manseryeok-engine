/** Trusted, self-contained E2 bootstrap. The supplied SHA is an operator pin. */
import {createHash} from 'node:crypto';
import {lstat,readFile} from 'node:fs/promises';
import {dirname,join,resolve} from 'node:path';
import {pathToFileURL} from 'node:url';

const manifestName = 'engine-manifest.json';
const verifierPath = 'e1/engine.mjs';
const digest = bytes => createHash('sha256').update(bytes).digest('hex');
const check = (ok,code) => { if (!ok) throw Error(code); };
const loadAt = (root,path) => import(pathToFileURL(join(root,path)).href);

async function regular(path) {
  const file = await lstat(path);
  check(file.isFile() && file.nlink === 1, 'E2_REGULAR_FILE_REQUIRED');
}

export async function verifyE2Package(directory, pin) {
  check(process.versions.node.split('.')[0] === '22' && /^[0-9a-f]{64}$/.test(pin), 'E2_NODE22_AND_EXTERNAL_PIN_REQUIRED');
  const root = resolve(directory);
  for (let dir = join(root,'e1'); ; dir = dirname(dir)) {
    const stat = await lstat(dir);
    check(stat.isDirectory() && !stat.isSymbolicLink(),'E2_DIRECTORY_REQUIRED');
    if (dir === dirname(dir)) break;
  }
  const manifestPath = join(root,manifestName);
  await regular(manifestPath);
  const bytes = await readFile(manifestPath);
  check(digest(bytes) === pin,'E2_MANIFEST_PIN_MISMATCH');
  const manifest = JSON.parse(bytes);
  check(manifest.profileId === 'ENGINE-PARITY-E2-V01' && manifest.version === '0.1.0', 'E2_PROFILE_REQUIRED');
  // Authenticate the reused verifier before executing any module inside the payload.
  const referenced = manifest.files.find(r => r.path === verifierPath);
  await regular(join(root,verifierPath));
  const verifierBytes = await readFile(join(root,verifierPath));
  check(referenced && referenced.sha256 === digest(verifierBytes),'E2_VERIFIER_CHANGED');
  const {verifyEngineArtifact} = await loadAt(root,verifierPath);
  await verifyEngineArtifact(root,pin);
  await verifyEngineArtifact(join(root,'e1'),manifest.e1ManifestSha256);
  return manifest;
}

export async function runE2Package(directory,[action,...args]) {
  const root = resolve(directory);
  const commands = {verify:[],restore:['--out','--data-pack','--data-out'],run:['--data-pack','--request']};
  check(Object.hasOwn(commands,action),'E2_PACKAGE_ACTION');
  const permitted = ['--manifest-sha',...commands[action]];
  const options = Object.create(null);
  for (let i=0; i<args.length; i+=2) {
    check(permitted.includes(args[i]) && !Object.hasOwn(options,args[i]) && args[i+1]?.length,'E2_PACKAGE_ARGUMENTS');
    options[args[i]] = args[i+1];
  }
  const needed = action === 'restore' ? ['--manifest-sha','--out'] : permitted;
  check(needed.every(k => Object.hasOwn(options,k)),'E2_PACKAGE_ARGUMENTS');
  const pin = options['--manifest-sha'];
  const manifest = await verifyE2Package(root,pin);
  if (action === 'verify') return {status:'VERIFIED',files:manifest.files.length,sourceRevision:manifest.sourceRevision};
  if (action === 'run') {
    const {main} = await loadAt(root,'scripts/engine/e2-cli.mjs');
    await main(['--request',options['--request'],'--data-pack',options['--data-pack']]);
    return;
  }

  const {createNewDirectory,pathsOverlap,validateNewDirectory,writeNew} = await loadAt(root,'e1/core/scripts/offline/integrity.mjs');
  const {runPackage} = await loadAt(root,verifierPath);
  const target = resolve(options['--out']);
  const hasData = Object.hasOwn(options,'--data-pack');
  check(hasData === Object.hasOwn(options,'--data-out'),'E2_PAIRED_DATA_PATHS');
  const paths = [root,target,...(hasData?[options['--data-pack'],options['--data-out']]:[])];
  for (let i=0; i<paths.length; i++) for (const other of paths.slice(i+1)) check(!pathsOverlap(paths[i],other),'E2_OVERLAPPING_PATHS');
  if (hasData) await validateNewDirectory(options['--data-out'],{privateOnly:true});
  await createNewDirectory(target);
  const baseArgs = ['restore','--manifest-sha',manifest.e1ManifestSha256,'--out',join(target,'e1')];
  if (hasData) baseArgs.push('--data-pack',options['--data-pack'],'--data-out',options['--data-out']);
  await runPackage(join(root,'e1'),baseArgs);
  for (const {path} of manifest.files) {
    if (!path.startsWith('e1/')) await writeNew(target,path,await readFile(join(root,path)));
  }
  await writeNew(target,manifestName,await readFile(join(root,manifestName)));
  await verifyE2Package(target,pin);
  return {status:'RESTORED',files:manifest.files.length,dataPackRestored:hasData};
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  try {
    const result = await runE2Package(import.meta.dirname,process.argv.slice(2));
    if (result) process.stdout.write(JSON.stringify(result)+'\n');
  } catch (error) {
    const code = /^[A-Z][A-Z_0-9]{2,100}$/.test(error?.message) ? error.message : 'E2_PACKAGE_REJECTED';
    process.stderr.write(code+'\n');process.exitCode=1;
  }
}
