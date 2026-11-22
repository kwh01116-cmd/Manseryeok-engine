/** Trusted E3 bootstrap. The manifest SHA comes from the operator. */
import {createHash} from 'node:crypto';
import {lstat,readFile} from 'node:fs/promises';
import {dirname,join,resolve} from 'node:path';
import {pathToFileURL} from 'node:url';

const manifestName='engine-manifest.json';
const verifierPath='e2/e1/engine.mjs';
const innerPath='e2/engine.mjs';
const digest=bytes=>createHash('sha256').update(bytes).digest('hex');
const check=(ok,code)=>{if(!ok)throw Error(code);};
const loadAt=(root,path)=>import(pathToFileURL(join(root,path)).href);

async function regular(path) {
  const file=await lstat(path);
  check(file.isFile()&&file.nlink===1,'E3_REGULAR_FILE_REQUIRED');
}

export async function verifyE3Package(directory,pin) {
  check(process.versions.node.split('.')[0]==='22'&&/^[0-9a-f]{64}$/.test(pin),'E3_NODE22_AND_EXTERNAL_PIN_REQUIRED');
  const root=resolve(directory);
  for(let dir=join(root,'e2','e1');;dir=dirname(dir)){
    const stat=await lstat(dir);
    check(stat.isDirectory()&&!stat.isSymbolicLink(),'E3_DIRECTORY_REQUIRED');
    if(dir===dirname(dir))break;
  }
  const manifestPath=join(root,manifestName);
  await regular(manifestPath);
  const bytes=await readFile(manifestPath);
  check(digest(bytes)===pin,'E3_MANIFEST_PIN_MISMATCH');
  const manifest=JSON.parse(bytes);
  check(manifest.profileId==='ENGINE-PARITY-E3-V01'&&manifest.version==='0.1.0','E3_PROFILE_REQUIRED');
  // The E1 verifier depends only on Node builtins. Pin it before importing any payload.
  const record=manifest.files.find(file=>file.path===verifierPath);
  await regular(join(root,verifierPath));
  check(record?.sha256===digest(await readFile(join(root,verifierPath))),'E3_VERIFIER_CHANGED');
  const {verifyEngineArtifact}=await loadAt(root,verifierPath);
  await verifyEngineArtifact(root,pin);
  const {verifyE2Package}=await loadAt(root,innerPath);
  const inner=await verifyE2Package(join(root,'e2'),manifest.e2ManifestSha256);
  check(inner.sourceRevision===manifest.sourceRevision&&inner.acceptedDataPackSha256===manifest.acceptedDataPackSha256,
    'E3_E2_MANIFEST_BINDING');
  return manifest;
}

export async function runE3Package(directory,[action,...args]) {
  const root=resolve(directory);
  const commands={verify:[],restore:['--out','--data-pack','--data-out'],run:['--data-pack','--request']};
  check(Object.hasOwn(commands,action),'E3_PACKAGE_ACTION');
  const allowed=['--manifest-sha',...commands[action]];
  const options=Object.create(null);
  for(let i=0;i<args.length;i+=2){
    check(allowed.includes(args[i])&&!Object.hasOwn(options,args[i])&&args[i+1]?.length,'E3_PACKAGE_ARGUMENTS');
    options[args[i]]=args[i+1];
  }
  const required=action==='restore'?['--manifest-sha','--out']:allowed;
  check(required.every(k=>Object.hasOwn(options,k)),'E3_PACKAGE_ARGUMENTS');
  const pin=options['--manifest-sha'], manifest=await verifyE3Package(root,pin);
  if(action==='verify')return {status:'VERIFIED',files:manifest.files.length,sourceRevision:manifest.sourceRevision};
  if(action==='run'){
    const {main}=await loadAt(root,'scripts/engine/e3-cli.mjs');
    await main(['--request',options['--request'],'--data-pack',options['--data-pack']]);
    return;
  }
  const {createNewDirectory,pathsOverlap,validateNewDirectory,writeNew}=await loadAt(root,'e2/e1/core/scripts/offline/integrity.mjs');
  const {runE2Package}=await loadAt(root,innerPath);
  const target=resolve(options['--out']);
  const hasData=Object.hasOwn(options,'--data-pack');
  check(hasData===Object.hasOwn(options,'--data-out'),'E3_PAIRED_DATA_PATHS');
  const paths=[root,target,...(hasData?[options['--data-pack'],options['--data-out']]:[])];
  for(let i=0;i<paths.length;i++)for(const other of paths.slice(i+1))check(!pathsOverlap(paths[i],other),'E3_OVERLAPPING_PATHS');
  if(hasData)await validateNewDirectory(options['--data-out'],{privateOnly:true});
  await createNewDirectory(target);
  const restoreArgs=['restore','--manifest-sha',manifest.e2ManifestSha256,'--out',join(target,'e2')];
  if(hasData)restoreArgs.push('--data-pack',options['--data-pack'],'--data-out',options['--data-out']);
  await runE2Package(join(root,'e2'),restoreArgs);
  for(const {path} of manifest.files){
    if(!path.startsWith('e2/'))await writeNew(target,path,await readFile(join(root,path)));
  }
  await writeNew(target,manifestName,await readFile(join(root,manifestName)));
  await verifyE3Package(target,pin);
  return {status:'RESTORED',files:manifest.files.length,dataPackRestored:hasData};
}

if(process.argv[1]&&import.meta.url===pathToFileURL(resolve(process.argv[1])).href){
  try{
    const result=await runE3Package(import.meta.dirname,process.argv.slice(2));
    if(result)process.stdout.write(JSON.stringify(result)+'\n');
  }catch(error){
    const code=/^[A-Z][A-Z_0-9]{2,100}$/.test(error?.message)?error.message:'E3_PACKAGE_REJECTED';
    process.stderr.write(code+'\n');process.exitCode=1;
  }
}
