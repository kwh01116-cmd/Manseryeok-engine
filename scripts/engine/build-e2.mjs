/** Build a data-free E2 extension and an independently runnable E1 dependency. */
import {readFile} from 'node:fs/promises';
import {createRequire,isBuiltin} from 'node:module';
import {dirname,join,relative,resolve} from 'node:path';
import {pathToFileURL} from 'node:url';
import {freshCompilation} from '../offline/build.mjs';
import {integratedImportsIn} from '../offline/build-v2.mjs';
import {assertNode22,check,createNewDirectory,digest,filesBelow,hashFiles,parsePairs,portable,writeNew} from '../offline/integrity.mjs';
import {buildE1Artifact} from './build-e1.mjs';
import {ENGINE_ARTIFACT_SCHEMA} from './e1-package.mjs';
import {verifyE2Package} from './e2-package.mjs';

const repo = resolve(import.meta.dirname,'../..');
const entries = ['scripts/engine/e2.mjs','scripts/engine/e2-cli.mjs'];
const helpers = ['scripts/engine/e2-temporal.mjs'];
const runtimeBuiltins = new Set(['node:fs/promises','node:url','node:path']);

export async function buildE2Artifact({outDir}) {
  assertNode22();
  const ts = createRequire(join(repo,'package.json'))('typescript');
  check(ts.version === '5.8.3','PINNED_TYPESCRIPT_REQUIRED');
  const root = await createNewDirectory(outDir);
  const base = await buildE1Artifact({outDir:join(root,'e1')});
  const inner = JSON.parse(await readFile(join(root,'e1/engine-manifest.json'),'utf8'));
  const basePaths = new Set(inner.files.map(r=>r.path));
  const {emitted} = freshCompilation(repo,ts);
  const modules = new Map();
  const queue = [...entries];
  while (queue.length) {
    const path = queue.pop();
    if (modules.has(path)) continue;
    const basePath = basePaths.has(path) ? path : 'core/'+path;
    if (basePaths.has(basePath)) {
      // Reuse the instance that issued candidate-local M2/M4/M5 evidence.
      const target = portable(relative(dirname(path),join('e1',basePath)));
      modules.set(path,"export * from '"+(target.startsWith('.')?target:'./'+target)+"';\n");
      continue;
    }
    const script = entries.includes(path) || helpers.includes(path);
    check(script || path.startsWith('dist/e2/'),'E2_UNAPPROVED_CLOSURE');
    const code = script ? await readFile(join(repo,path),'utf8') : emitted.get(path)?.text;
    check(typeof code === 'string','E2_RUNTIME_SOURCE_REQUIRED');
    modules.set(path,code);
    for (const spec of integratedImportsIn(code,path,ts)) {
      if (isBuiltin(spec)) { check(runtimeBuiltins.has(spec),'E2_BUILTIN_NOT_APPROVED'); continue; }
      check(spec.startsWith('.'),'E2_EXTERNAL_DEPENDENCY');
      const next = portable(relative(repo,resolve(repo,dirname(path),spec)));
      check(!next.startsWith('../'),'E2_PATH_ESCAPE');
      queue.push(next);
    }
  }
  for (const [path,code] of modules) await writeNew(root,path,code);
  const docs = ['docs/contracts/examples/engine-e2-request-v1.json','docs/contracts/ENGINE_E2_FEATURE_API_V01.md',
    'docs/research/ENGINE_E2_SINSAL_POLICY_V01.md','docs/research/ENGINE_E2_PATTERN_EFFICACY_SCOPE.md'];
  for (const path of docs) await writeNew(root,path,await readFile(join(repo,path)));
  await writeNew(root,'package.json',JSON.stringify({name:'@manseryeok/engine-parity-e2-internal',version:'0.1.0',type:'module',private:true,engines:{node:'>=22 <23'}},null,2)+'\n');
  await writeNew(root,'engine.mjs',await readFile(join(repo,'scripts/engine/e2-package.mjs')));
  const manifest = {
    schemaVersion:ENGINE_ARTIFACT_SCHEMA,profileId:'ENGINE-PARITY-E2-V01',version:'0.1.0',containsCalendarData:false,nodeMajor:22,
    sourceRevision:inner.sourceRevision,sourceState:inner.sourceState,acceptedDataPackSha256:inner.acceptedDataPackSha256,
    e1ManifestSha256:base.manifestSha256,releaseStatus:inner.releaseStatus,files:await hashFiles(root,await filesBelow(root)),
  };
  const bytes = Buffer.from(JSON.stringify(manifest,null,2)+'\n');
  const manifestSha256 = digest(bytes);
  await writeNew(root,'engine-manifest.json',bytes);
  await verifyE2Package(root,manifestSha256);
  return {sourceRevision:manifest.sourceRevision,workingTreeDirty:manifest.sourceState.workingTreeDirty,manifestSha256,
    e1ManifestSha256:base.manifestSha256,files:manifest.files.length};
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  try {
    const o = parsePairs(process.argv.slice(2),['--out']);
    console.log(JSON.stringify(await buildE2Artifact({outDir:o['--out']})));
  } catch (error) { console.error(error.message);process.exitCode=1; }
}
