/** Build an E1 extension next to an intact v4 engine, from pinned TypeScript in this checkout. */
import {readFile} from 'node:fs/promises';
import {createRequire,isBuiltin} from 'node:module';
import {dirname,join,relative,resolve} from 'node:path';
import {pathToFileURL} from 'node:url';
import {freshCompilation} from '../offline/build.mjs';
import {integratedImportsIn} from '../offline/build-v2.mjs';
import {buildServerOfflineArtifact} from '../offline/build-v4.mjs';
import {check,assertNode22,createNewDirectory,digest,filesBelow,hashFiles,parsePairs,portable,writeNew} from '../offline/integrity.mjs';
import {ENGINE_ARTIFACT_SCHEMA,verifyEngineArtifact} from './e1-package.mjs';

const repo=resolve(import.meta.dirname,'../..');
const entries=['scripts/engine/e1.mjs','scripts/engine/e1-cli.mjs'];
const builtins=new Set(['node:fs/promises','node:path','node:url']);
export async function buildE1Artifact({outDir}) {
  assertNode22();
  const ts=createRequire(join(repo,'package.json'))('typescript');
  check(ts.version==='5.8.3','PINNED_TYPESCRIPT_REQUIRED');
  const root=await createNewDirectory(outDir);
  const core=await buildServerOfflineArtifact({root:repo,outDir:join(root,'core')});
  const baseFiles=new Set(core.files.map(f=>f.path));
  const compiled=freshCompilation(repo,ts), modules=new Map(),queue=[...entries];
  while(queue.length) {
    const path=queue.pop();
    if(modules.has(path))continue;
    if(baseFiles.has(path)) {
      // Re-export the same physical module instance; M2/M4/M5 issuance uses object identity.
      const spec=portable(relative(dirname(path),join('core',path)));
      modules.set(path,`export * from '${spec.startsWith('.')?spec:'./'+spec}';\n`);
      continue;
    }
    check(entries.includes(path)||path.startsWith('dist/e1/'),'E1_MODULE_NOT_IN_APPROVED_CLOSURE');
    const source=entries.includes(path)?await readFile(join(repo,path),'utf8'):compiled.emitted.get(path)?.text;
    check(typeof source==='string','E1_FRESH_EMIT_REQUIRED');
    modules.set(path,source);
    for(const spec of integratedImportsIn(source,path,ts)) {
      if(isBuiltin(spec)){check(builtins.has(spec),'E1_RUNTIME_BUILTIN');continue;}
      check(spec.startsWith('.'),'E1_EXTERNAL_RUNTIME_DEPENDENCY');
      const dest=portable(relative(repo,resolve(repo,dirname(path),spec)));
      check(!dest.startsWith('../'),'E1_RUNTIME_PATH_ESCAPE');queue.push(dest);
    }
  }
  for(const [path,bytes] of modules)await writeNew(root,path,bytes);
  await writeNew(root,'package.json',JSON.stringify({name:'@manseryeok/engine-parity-e1-internal',type:'module',private:true,version:'0.1.0',engines:{node:'>=22 <23'}},null,2)+'\n');
  await writeNew(root,'engine.mjs',await readFile(join(repo,'scripts/engine/e1-package.mjs')));
  const policyDocs = ['docs/contracts/examples/engine-e1-request-v1.json','docs/contracts/ENGINE_E1_API_V01.md',
    'docs/research/M3_PRODUCT_STRENGTH_POLICY_V01.md','docs/research/M5_EOKBU_CANDIDATE_POLICY_V01.md',
    'docs/research/M4_INNER_PATTERNS_POLICY_V01.md','docs/research/M5_LIMITED_PURPOSE_POLICY_V01.md','docs/research/OSS_ENGINE_AUDIT_20261114.md'];
  for(const path of policyDocs)await writeNew(root,path,await readFile(join(repo,path)));
  const manifest={schemaVersion:ENGINE_ARTIFACT_SCHEMA,version:'0.1.0',nodeMajor:22,containsCalendarData:false,
    sourceRevision:core.sourceRevision,sourceState:core.sourceState,acceptedDataPackSha256:core.acceptedServerDataPackContentSha256,
    coreManifestSha256:digest(await readFile(join(root,'core/artifact-manifest.json'))),releaseStatus:core.releaseStatus,
    files:await hashFiles(root,await filesBelow(root))};
  const bytes=Buffer.from(JSON.stringify(manifest,null,2)+'\n'),pin=digest(bytes);
  await writeNew(root,'engine-manifest.json',bytes);await verifyEngineArtifact(root,pin);
  return {sourceRevision:manifest.sourceRevision,workingTreeDirty:core.sourceState.workingTreeDirty,manifestSha256:pin,files:manifest.files.length};
}
if(process.argv[1] && import.meta.url===pathToFileURL(resolve(process.argv[1])).href) {
  try {
    const o=parsePairs(process.argv.slice(2),['--out']);console.log(JSON.stringify(await buildE1Artifact({outDir:o['--out']})));
  } catch(error) {console.error(error.message);process.exitCode=1;}
}
