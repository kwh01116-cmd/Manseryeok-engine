/** Build E3 from a fixed source revision and a self-contained E2 payload. */
import {execFileSync} from 'node:child_process';
import {readFile} from 'node:fs/promises';
import {createRequire,isBuiltin} from 'node:module';
import {dirname,join,relative,resolve} from 'node:path';
import {pathToFileURL} from 'node:url';
import {freshCompilation} from '../offline/build.mjs';
import {integratedImportsIn} from '../offline/build-v2.mjs';
import {assertNode22,check,createNewDirectory,digest,filesBelow,hashFiles,parsePairs,portable,writeNew} from '../offline/integrity.mjs';
import {buildE2Artifact} from './build-e2.mjs';
import {ENGINE_ARTIFACT_SCHEMA} from './e1-package.mjs';
import {verifyE3Package} from './e3-package.mjs';

const repo=resolve(import.meta.dirname,'../..');
const entries=['scripts/engine/e3.mjs','scripts/engine/e3-cli.mjs'];
const docs=['docs/contracts/examples/engine-e3-request-v1.json','docs/contracts/ENGINE_E3_FEATURE_API_V01.md',
  'docs/research/ENGINE_E3_PATTERN_RULES_V01.md'];
const builtins=new Set(['node:fs/promises','node:url','node:path']);

function checkout(){
  const args=['-c','safe.directory='+portable(repo),'-c','core.excludesFile='];
  const git=(...rest)=>execFileSync('git',[...args,...rest],{cwd:repo,encoding:'utf8',stdio:['ignore','pipe','pipe']}).trim();
  return {revision:git('rev-parse','HEAD'),status:git('status','--porcelain=v1','--untracked-files=all')};
}

export async function buildE3Artifact({outDir,sourceRevision,pilot=false}) {
  assertNode22();
  check(typeof pilot==='boolean'&&(pilot||/^[0-9a-f]{40}$/.test(sourceRevision??'')),'E3_EXPECTED_SOURCE_REVISION_REQUIRED');
  const before=checkout();
  check((!sourceRevision||before.revision===sourceRevision)&&(pilot||before.status===''),'E3_SOURCE_SNAPSHOT_REQUIRED');
  const ts=createRequire(join(repo,'package.json'))('typescript');
  check(ts.version==='5.8.3','PINNED_TYPESCRIPT_REQUIRED');
  const root=await createNewDirectory(outDir);
  const base=await buildE2Artifact({outDir:join(root,'e2')});
  const inner=JSON.parse(await readFile(join(root,'e2/engine-manifest.json'),'utf8'));
  check(inner.sourceRevision===before.revision&&inner.sourceState.workingTreeStatusSha256===digest(before.status),'E3_SOURCE_SNAPSHOT_DRIFT');
  const basePaths=new Set(inner.files.map(entry=>entry.path));
  const {emitted}=freshCompilation(repo,ts);
  const modules=new Map(), queue=[...entries];
  while(queue.length){
    const path=queue.pop();
    if(modules.has(path))continue;
    // Forward to the originating module instance so product-policy issuance remains verifiable.
    const basePath=[path,'e1/'+path,'e1/core/'+path].find(p=>basePaths.has(p));
    if(basePath){
      const target=portable(relative(dirname(path),join('e2',basePath)));
      modules.set(path,`export * from '${target.startsWith('.')?target:'./'+target}';\n`);
      continue;
    }
    const script=entries.includes(path);
    check(script||path.startsWith('dist/e3/'),'E3_UNAPPROVED_CLOSURE');
    const code=script?await readFile(join(repo,path),'utf8'):emitted.get(path)?.text;
    check(typeof code==='string','E3_RUNTIME_SOURCE_REQUIRED');
    modules.set(path,code);
    for(const spec of integratedImportsIn(code,path,ts)){
      if(isBuiltin(spec)){
        check(builtins.has(spec),'E3_BUILTIN_NOT_APPROVED');
        continue;
      }
      check(spec.startsWith('.'),'E3_EXTERNAL_DEPENDENCY');
      const next=portable(relative(repo,resolve(repo,dirname(path),spec)));
      check(!next.startsWith('../'),'E3_RUNTIME_PATH_ESCAPE');
      queue.push(next);
    }
  }
  for(const [path,code] of modules)await writeNew(root,path,code);
  for(const path of docs)await writeNew(root,path,await readFile(join(repo,path)));
  await writeNew(root,'package.json',JSON.stringify({name:'@manseryeok/engine-parity-e3-internal',version:'0.1.0',type:'module',
    private:true,engines:{node:'>=22 <23'}},null,2)+'\n');
  await writeNew(root,'engine.mjs',await readFile(join(repo,'scripts/engine/e3-package.mjs')));
  const after=checkout();
  check(after.revision===before.revision&&after.status===before.status,'E3_SOURCE_SNAPSHOT_DRIFT');
  const manifest={
    schemaVersion:ENGINE_ARTIFACT_SCHEMA,profileId:'ENGINE-PARITY-E3-V01',version:'0.1.0',nodeMajor:22,containsCalendarData:false,
    sourceRevision:inner.sourceRevision,sourceState:inner.sourceState,buildMode:pilot?'PILOT':'FIXED_SOURCE_REVISION',
    acceptedDataPackSha256:inner.acceptedDataPackSha256,e2ManifestSha256:base.manifestSha256,releaseStatus:inner.releaseStatus,
    files:await hashFiles(root,await filesBelow(root)),
  };
  const bytes=Buffer.from(JSON.stringify(manifest,null,2)+'\n');
  const manifestSha256=digest(bytes);
  await writeNew(root,'engine-manifest.json',bytes);
  await verifyE3Package(root,manifestSha256);
  return {sourceRevision:manifest.sourceRevision,workingTreeDirty:manifest.sourceState.workingTreeDirty,buildMode:manifest.buildMode,
    manifestSha256,e2ManifestSha256:base.manifestSha256,files:manifest.files.length};
}

if(process.argv[1]&&import.meta.url===pathToFileURL(resolve(process.argv[1])).href){
  try{
    const options=parsePairs(process.argv.slice(2),['--out','--source-revision','--pilot']);
    check(!options['--pilot']||options['--pilot']==='true','E3_PILOT_ARGUMENT');
    const built=await buildE3Artifact({outDir:options['--out'],sourceRevision:options['--source-revision'],pilot:options['--pilot']==='true'});
    process.stdout.write(JSON.stringify(built)+'\n');
  }catch(error){process.stderr.write(error.message+'\n');process.exitCode=1;}
}
