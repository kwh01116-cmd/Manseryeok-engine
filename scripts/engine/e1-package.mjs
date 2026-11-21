/** Trusted bootstrap copied as engine.mjs. Reads only local files; imports engine code after pin verification. */
import {createHash} from 'node:crypto';
import {lstat,readFile,readdir} from 'node:fs/promises';
import {dirname,join,relative,resolve,sep} from 'node:path';
import {pathToFileURL} from 'node:url';

const digest=value=>createHash('sha256').update(value).digest('hex');
const requireThat=(ok,code)=>{if(!ok)throw new Error(code);};
export const ENGINE_ARTIFACT_SCHEMA='manseryeok-engine-parity-offline-v1';
const manifestFile='engine-manifest.json';

async function inventory(root) {
  const records=[];
  async function visit(dir) {
    for(const entry of await readdir(dir,{withFileTypes:true})) {
      const path=join(dir,entry.name);
      if(entry.isDirectory()) {await visit(path);continue;}
      requireThat(entry.isFile() && (await lstat(path)).nlink===1,'E1_EXPECTED_REGULAR_FILE');
      const name=relative(root,path).split(sep).join('/');
      if(name!==manifestFile) {
        const bytes=await readFile(path);
        records.push({path:name,bytes:bytes.length,sha256:digest(bytes)});
      }
    }
  }
  for(let p=resolve(root);;p=dirname(p)){
    const st=await lstat(p);requireThat(st.isDirectory()&&!st.isSymbolicLink(),'E1_UNSAFE_DIRECTORY');
    if(p===dirname(p))break;
  }
  await visit(root);
  return records.sort((a,b)=>a.path<b.path?-1:a.path>b.path?1:0);
}

export async function verifyEngineArtifact(directory,pin) {
  requireThat(process.versions.node.split('.')[0]==='22' && /^[0-9a-f]{64}$/.test(pin),'E1_NODE22_AND_OPERATOR_PIN_REQUIRED');
  const root=resolve(directory),file=join(root,manifestFile);
  const st=await lstat(file);requireThat(st.isFile()&&st.nlink===1,'E1_MANIFEST_FILE');
  const bytes=await readFile(file);
  requireThat(digest(bytes)===pin,'E1_MANIFEST_PIN_MISMATCH');
  const m=JSON.parse(bytes.toString('utf8'));
  requireThat(m.schemaVersion===ENGINE_ARTIFACT_SCHEMA && m.containsCalendarData===false && m.nodeMajor===22,'E1_ARTIFACT_CONTRACT');
  const actual=await inventory(root);
  requireThat(JSON.stringify(actual)===JSON.stringify(m.files),'E1_ARTIFACT_FILE_SET_OR_BYTES_CHANGED');
  return m;
}

function options(args,allowed,required) {
  const o={};
  for(let i=0;i<args.length;i+=2){
    requireThat(allowed.includes(args[i]) && !Object.hasOwn(o,args[i]) && typeof args[i+1]==='string' && args[i+1].length,'E1_PACKAGE_ARGUMENTS');
    o[args[i]]=args[i+1];
  }
  requireThat(required.every(key=>Object.hasOwn(o,key)),'E1_PACKAGE_ARGUMENTS');
  return o;
}

export async function runPackage(directory,[action,...args]) {
  const root=resolve(directory);
  const keys={verify:[],restore:['--out','--data-pack','--data-out'],run:['--data-pack','--request']};
  requireThat(Object.hasOwn(keys,action),'E1_PACKAGE_ACTION');
  const required=['--manifest-sha',...(action==='restore'?['--out']:keys[action])];
  const o=options(args,['--manifest-sha',...keys[action]],required);
  const pin=o['--manifest-sha'];
  const m=await verifyEngineArtifact(root,pin);
  const mod=name=>import(pathToFileURL(join(root,name)).href);
  if(action==='verify')return {status:'VERIFIED',files:m.files.length,sourceRevision:m.sourceRevision};
  if(action==='run'){
    const cli=await mod('scripts/engine/e1-cli.mjs');
    await cli.main(['--request',o['--request'],'--data-pack',o['--data-pack']]);
    return;
  }
  const {createNewDirectory,validateNewDirectory,writeNew,pathsOverlap}=await mod('core/scripts/offline/integrity.mjs');
  const {restoreServerOfflineArtifact}=await mod('core/scripts/offline/restore-v4.mjs');
  const hasData=o['--data-pack']!==undefined,target=resolve(o['--out']);
  requireThat(hasData===(o['--data-out']!==undefined),'E1_PAIRED_DATA_PATHS');
  const paths=[root,target,...(hasData?[o['--data-pack'],o['--data-out']]:[])];
  for(let i=0;i<paths.length;i++)for(const other of paths.slice(i+1))requireThat(!pathsOverlap(paths[i],other),'E1_OVERLAPPING_PATHS');
  if(hasData)await validateNewDirectory(o['--data-out'],{privateOnly:true});
  await createNewDirectory(target);
  await restoreServerOfflineArtifact({artifactDirectory:join(root,'core'),outDir:join(target,'core'),dataDirectory:o['--data-pack'],privateDataOut:o['--data-out']});
  for(const path of [...m.files.map(r=>r.path).filter(p=>!p.startsWith('core/')),manifestFile])await writeNew(target,path,await readFile(join(root,path)));
  await verifyEngineArtifact(target,pin);
  return {status:'RESTORED',files:m.files.length,dataPackRestored:hasData};
}
if(process.argv[1] && import.meta.url===pathToFileURL(resolve(process.argv[1])).href) {
  try {
    const result=await runPackage(import.meta.dirname,process.argv.slice(2));
    if(result)process.stdout.write(JSON.stringify(result)+'\n');
  } catch(error) {
    const code=/^[A-Z][A-Z_0-9]{2,100}$/.test(error?.message)?error.message:'E1_PACKAGE_REJECTED';
    process.stderr.write(code+'\n');process.exitCode=1;
  }
}
