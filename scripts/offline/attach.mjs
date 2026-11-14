/** Explicit private-only copy of already pinned local data. No collection or key access. */
import {readFile} from 'node:fs/promises';
import {join,resolve} from 'node:path';
import {pathToFileURL} from 'node:url';
import {loadLocalChartProfile,MODERN_PROFILE_ID} from '../kasi/local-chart.mjs';
import {assertNode22,check,BASELINE_PIN,DATA_FILES,ATTACHMENT_SCHEMA,createNewDirectory,writeNew,hashFiles,verifyAttachment,parsePairs,pathsOverlap,rejectSymlinkAncestors} from './integrity.mjs';

export async function attachPrivateData({candidateDirectory,outDir}){
  assertNode22();check(typeof candidateDirectory==='string'&&typeof outDir==='string','EXPLICIT_DATA_PATHS_REQUIRED');
  check(!pathsOverlap(candidateDirectory,outDir),'ATTACHMENT_SOURCE_TARGET_OVERLAP');await rejectSymlinkAncestors(candidateDirectory);
  // Validates the real independent baseline pin, six derived hashes, date index,
  // modern coverage, source receipts and event contracts before any output.
  await loadLocalChartProfile({directory:candidateDirectory,expectedManifestSha256:BASELINE_PIN,profileId:MODERN_PROFILE_ID});
  const contents=new Map();for(const path of DATA_FILES)contents.set(path,await readFile(join(candidateDirectory,path)));
  const target=await createNewDirectory(outDir,{privateOnly:true});
  for(const [path,bytes]of contents)await writeNew(target,path,bytes);
  const attachment={schemaVersion:ATTACHMENT_SCHEMA,expectedManifestSha256:BASELINE_PIN,profileId:MODERN_PROFILE_ID,rightsStatus:'RIGHTS_BLOCKED',distribution:'PRIVATE_NO_REDISTRIBUTION',optInRequired:true,files:await hashFiles(target,DATA_FILES)};
  await writeNew(target,'attachment.json',JSON.stringify(attachment,null,2)+'\n');
  await verifyAttachment(target);
  await loadLocalChartProfile({directory:target,expectedManifestSha256:BASELINE_PIN,profileId:MODERN_PROFILE_ID});
  return attachment;
}
export async function main(args=process.argv.slice(2)){
  try{const options=parsePairs(args,['--candidate','--out']);check(options['--candidate']&&options['--out'],'EXPLICIT_DATA_PATHS_REQUIRED');const value=await attachPrivateData({candidateDirectory:options['--candidate'],outDir:options['--out']});process.stdout.write(JSON.stringify({status:'ATTACHED_PRIVATE',rightsStatus:value.rightsStatus,files:value.files.length})+'\n');}
  catch{process.stderr.write('OFFLINE_PRIVATE_ATTACHMENT_REJECTED\n');process.exitCode=1;}
}
if(process.argv[1]&&import.meta.url===pathToFileURL(resolve(process.argv[1])).href)await main();
