/** New destinations only; preserve data-free engine and separate private attachment. */
import {readFile} from 'node:fs/promises';
import {join,resolve} from 'node:path';
import {pathToFileURL} from 'node:url';
import {assertNode22,check,parsePairs,validateNewDirectory,createNewDirectory,writeNew,pathsOverlap} from './integrity.mjs';
import {verifyExtendedArtifact,verifyExtendedAttachment} from './integrity-v3.mjs';
export async function restoreExtendedArtifact({artifactDirectory,outDir,attachmentDirectory,privateDataOut}){
 assertNode22();check(Boolean(attachmentDirectory)===Boolean(privateDataOut),'PAIRED_PRIVATE_RESTORE_ARGUMENTS_REQUIRED');
 const sources=[artifactDirectory,...(attachmentDirectory?[attachmentDirectory]:[])],targets=[outDir,...(privateDataOut?[privateDataOut]:[])];
 for(const source of sources)for(const target of targets)check(!pathsOverlap(source,target),'RESTORE_SOURCE_TARGET_OVERLAP');
 if(targets.length===2)check(!pathsOverlap(targets[0],targets[1]),'RESTORE_TARGET_OVERLAP');
 const artifact=await verifyExtendedArtifact(artifactDirectory),attachment=attachmentDirectory?await verifyExtendedAttachment(attachmentDirectory):null;
 await validateNewDirectory(outDir);if(privateDataOut)await validateNewDirectory(privateDataOut,{privateOnly:true});
 const engine=await createNewDirectory(outDir);for(const path of [...artifact.files.map(f=>f.path),'artifact-manifest.json'])await writeNew(engine,path,await readFile(join(artifactDirectory,path)));await verifyExtendedArtifact(engine);
 if(attachment){const target=await createNewDirectory(privateDataOut,{privateOnly:true});for(const path of [...attachment.files.map(f=>f.path),'attachment.json'])await writeNew(target,path,await readFile(join(attachmentDirectory,path)));await verifyExtendedAttachment(target);}
 return artifact;
}
export async function main(args=process.argv.slice(2)){
 try{const o=parsePairs(args,['--artifact','--out','--attachment','--private-data-out']);check(o['--artifact']&&o['--out'],'EXPLICIT_RESTORE_PATHS_REQUIRED');const m=await restoreExtendedArtifact({artifactDirectory:o['--artifact'],outDir:o['--out'],attachmentDirectory:o['--attachment'],privateDataOut:o['--private-data-out']});process.stdout.write(JSON.stringify({status:'RESTORED',schemaVersion:m.schemaVersion,privateAttachmentRestored:Boolean(o['--attachment'])})+'\n');}
 catch{process.stderr.write('OFFLINE_EXTENDED_RESTORE_REJECTED\n');process.exitCode=1;}
}
if(process.argv[1]&&import.meta.url===pathToFileURL(resolve(process.argv[1])).href)await main();
