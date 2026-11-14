/** Restore into absent destinations only; backup and attached data stay read-only. */
import {readFile} from 'node:fs/promises';
import {join,resolve} from 'node:path';
import {pathToFileURL} from 'node:url';
import {assertNode22,check,parsePairs,verifyArtifact,verifyAttachment,validateNewDirectory,createNewDirectory,writeNew,pathsOverlap} from './integrity.mjs';
export async function restoreArtifact({artifactDirectory,outDir,attachmentDirectory,privateDataOut}){
  assertNode22();check(Boolean(attachmentDirectory)===Boolean(privateDataOut),'PAIRED_PRIVATE_RESTORE_ARGUMENTS_REQUIRED');
  const sources=[artifactDirectory,...(attachmentDirectory?[attachmentDirectory]:[])],targets=[outDir,...(privateDataOut?[privateDataOut]:[])];
  for(const source of sources)for(const target of targets)check(!pathsOverlap(source,target),'RESTORE_SOURCE_TARGET_OVERLAP');
  if(targets.length===2)check(!pathsOverlap(targets[0],targets[1]),'RESTORE_TARGET_OVERLAP');
  const artifact=await verifyArtifact(artifactDirectory),attachment=attachmentDirectory?await verifyAttachment(attachmentDirectory):null;
  await validateNewDirectory(outDir);if(privateDataOut)await validateNewDirectory(privateDataOut,{privateOnly:true});
  const target=await createNewDirectory(outDir);
  for(const path of [...artifact.files.map(f=>f.path),'artifact-manifest.json'])await writeNew(target,path,await readFile(join(artifactDirectory,path)));
  await verifyArtifact(target);
  if(attachment){
    const dataTarget=await createNewDirectory(privateDataOut,{privateOnly:true});
    for(const path of [...attachment.files.map(f=>f.path),'attachment.json'])await writeNew(dataTarget,path,await readFile(join(attachmentDirectory,path)));
    await verifyAttachment(dataTarget);
  }
  return artifact;
}
export async function main(args=process.argv.slice(2)){
  try{const options=parsePairs(args,['--artifact','--out','--attachment','--private-data-out']);check(options['--artifact']&&options['--out'],'EXPLICIT_RESTORE_PATHS_REQUIRED');await restoreArtifact({artifactDirectory:options['--artifact'],outDir:options['--out'],attachmentDirectory:options['--attachment'],privateDataOut:options['--private-data-out']});process.stdout.write(JSON.stringify({status:'RESTORED',privateAttachmentRestored:Boolean(options['--attachment'])})+'\n');}
  catch{process.stderr.write('OFFLINE_RESTORE_REJECTED\n');process.exitCode=1;}
}
if(process.argv[1]&&import.meta.url===pathToFileURL(resolve(process.argv[1])).href)await main();
