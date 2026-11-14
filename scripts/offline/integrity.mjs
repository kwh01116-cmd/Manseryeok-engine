/** Content checks for relocatable, data-free offline engine artifacts. Node built-ins only. */
import {createHash} from 'node:crypto';
import {readFile, readdir, lstat, mkdir, writeFile} from 'node:fs/promises';
import {resolve, relative, sep, join, dirname,isAbsolute} from 'node:path';
import {loadCandidate} from '../kasi/candidate.mjs';

export const ARTIFACT_SCHEMA='manseryeok-offline-engine-v1';
export const ATTACHMENT_SCHEMA='manseryeok-private-offline-data-v1';
export const BASELINE_PIN='8ffadb04c8460969085610162d3d5e8855af9272a8a4be1dbe10123c15f90edf';
export const DATA_FILES=Object.freeze(['manifest.json','candidate.json','comparisons.json','boundary-requirements.json','soljd-audit.json','source-references.json','exceptions.json'].sort());
export const digest=bytes=>createHash('sha256').update(bytes).digest('hex');
export const check=(ok,code)=>{if(!ok)throw new Error(code);};
export const portable=path=>path.split(sep).join('/');
export function pathsOverlap(left,right){
  const inside=(a,b)=>{const rel=relative(resolve(a),resolve(b));return rel===''||!isAbsolute(rel)&&rel!=='..'&&!rel.startsWith('..'+sep);};
  return inside(left,right)||inside(right,left);
}
export function assertNode22(){check(Number(process.versions.node.split('.')[0])===22,'NODE_22_REQUIRED');}
export function safeRelative(path){return typeof path==='string'&&path.length>0&&!path.includes('\\')&&!path.startsWith('/')&&path.split('/').every(p=>p&&p!=='.'&&p!=='..'&&!p.includes(':'));}
export async function rejectSymlinkAncestors(directory){
  let cursor=resolve(directory);
  for(;;){check(!(await lstat(cursor)).isSymbolicLink(),'SYMLINK_REJECTED');const parent=dirname(cursor);if(parent===cursor)break;cursor=parent;}
}
export async function filesBelow(root){
  await rejectSymlinkAncestors(root);
  const files=[];
  async function visit(directory){
    for(const entry of await readdir(directory,{withFileTypes:true})){
      const path=join(directory,entry.name),info=await lstat(path);
      check(!info.isSymbolicLink(),'SYMLINK_REJECTED');
      if(info.isDirectory())await visit(path);
      else {check(info.isFile(),'NON_FILE_REJECTED');files.push(portable(relative(root,path)));}
    }
  }
  check(!(await lstat(root)).isSymbolicLink(),'SYMLINK_REJECTED');
  await visit(root);return files.sort();
}
export async function hashFiles(root,names){
  const result=[];
  for(const path of [...names].sort()){
    check(safeRelative(path),'UNSAFE_ARTIFACT_PATH');
    const bytes=await readFile(join(root,path));result.push({path,bytes:bytes.length,sha256:digest(bytes)});
  }
  return result;
}
export async function verifyFileRecords(root,records,manifestName){
  check(Array.isArray(records)&&records.length>0,'FILE_MANIFEST_REQUIRED');
  const names=records.map(f=>f.path);
  check(new Set(names).size===names.length&&names.every(safeRelative)&&!names.includes(manifestName),'FILE_MANIFEST_PATHS');
  const actual=await hashFiles(root,names);
  check(JSON.stringify(actual)===JSON.stringify(records),'ARTIFACT_CONTENT_CHANGED');
  check(JSON.stringify(await filesBelow(root))===JSON.stringify([...names,manifestName].sort()),'ARTIFACT_FILE_SET_CHANGED');
  return records;
}
export async function verifyArtifact(directory){
  const root=resolve(directory),manifest=JSON.parse(await readFile(join(root,'artifact-manifest.json'),'utf8'));
  check(manifest.schemaVersion===ARTIFACT_SCHEMA&&manifest.containsCalendarData===false&&manifest.runtime?.nodeMajor===22&&manifest.runtime?.externalDependencies===0,'ARTIFACT_CONTRACT');
  await verifyFileRecords(root,manifest.files,'artifact-manifest.json');return manifest;
}
export async function verifyAttachment(directory){
  const root=resolve(directory),manifest=JSON.parse(await readFile(join(root,'attachment.json'),'utf8'));
  check(manifest.schemaVersion===ATTACHMENT_SCHEMA&&manifest.expectedManifestSha256===BASELINE_PIN&&manifest.rightsStatus==='RIGHTS_BLOCKED'&&manifest.distribution==='PRIVATE_NO_REDISTRIBUTION'&&manifest.optInRequired===true,'ATTACHMENT_CONTRACT');
  check(JSON.stringify(manifest.files?.map(f=>f.path))===JSON.stringify(DATA_FILES),'ATTACHMENT_FILE_SET');
  await verifyFileRecords(root,manifest.files,'attachment.json');
  // Descriptor hashes are not the independent data pin. Reuse the real loader
  // so verify/restore reject a self-consistent synthetic or substituted corpus.
  await loadCandidate(root,BASELINE_PIN);return manifest;
}
/** Writes only a new directory and refuses symlink ancestors. */
export async function validateNewDirectory(directory,{privateOnly=false}={}){
  const target=resolve(directory);
  if(privateOnly)check(target.split(/[\\/]/).some(part=>part.toLowerCase()==='.private'),'PRIVATE_DESTINATION_REQUIRED');
  const ancestors=[];let cursor=target;
  for(;;){ancestors.push(cursor);const parent=dirname(cursor);if(parent===cursor)break;cursor=parent;}
  for(const path of ancestors.reverse()){
    try{const info=await lstat(path);check(!info.isSymbolicLink(),'SYMLINK_REJECTED');if(path===target)throw new Error('DESTINATION_ALREADY_EXISTS');check(info.isDirectory(),'ANCESTOR_NOT_DIRECTORY');}
    catch(error){if(error.code!=='ENOENT')throw error;}
  }
  return target;
}
export async function createNewDirectory(directory,options={}){
  const target=await validateNewDirectory(directory,options);
  await mkdir(dirname(target),{recursive:true});await mkdir(target);return target;
}
export async function writeNew(root,path,bytes){
  check(safeRelative(path),'UNSAFE_ARTIFACT_PATH');const target=join(root,path);
  await mkdir(dirname(target),{recursive:true});await writeFile(target,bytes,{flag:'wx'});
}
export function parsePairs(args,allowed){
  check(args.length>0&&args.length%2===0,'EXPLICIT_ARGUMENTS_REQUIRED');const values={};
  for(let i=0;i<args.length;i+=2){check(allowed.includes(args[i])&&!Object.hasOwn(values,args[i])&&typeof args[i+1]==='string'&&args[i+1].length>0,'ARGUMENTS');values[args[i]]=args[i+1];}
  return values;
}
