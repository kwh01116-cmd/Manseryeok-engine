/** Operator-only restoration. No data-file endpoint and no overwrite. */
import {readFile} from 'node:fs/promises';
import {join,resolve} from 'node:path';
import {pathToFileURL} from 'node:url';
import {assertNode22,check,parsePairs,validateNewDirectory,createNewDirectory,writeNew,pathsOverlap} from './integrity.mjs';
import {verifyServerOfflineArtifact,verifyServerOfflineDataPack,SERVER_ARTIFACT_DATA_FILES} from './integrity-v4.mjs';
export async function restoreServerOfflineArtifact({artifactDirectory,outDir,dataDirectory,privateDataOut}){
 assertNode22();check(Boolean(dataDirectory)===Boolean(privateDataOut),'SERVER_RESTORE_PAIRED_DATA_ARGUMENTS');
 const sources=[artifactDirectory,...(dataDirectory?[dataDirectory]:[])],targets=[outDir,...(privateDataOut?[privateDataOut]:[])];
 for(const source of sources)for(const target of targets)check(!pathsOverlap(source,target),'SERVER_RESTORE_SOURCE_TARGET_OVERLAP');
 if(targets.length===2)check(!pathsOverlap(targets[0],targets[1]),'SERVER_RESTORE_TARGET_OVERLAP');
 const artifact=await verifyServerOfflineArtifact(artifactDirectory),data=dataDirectory?await verifyServerOfflineDataPack(dataDirectory):null;
 await validateNewDirectory(outDir);if(privateDataOut)await validateNewDirectory(privateDataOut,{privateOnly:true});
 const engine=await createNewDirectory(outDir);for(const path of [...artifact.files.map(f=>f.path),'artifact-manifest.json'])await writeNew(engine,path,await readFile(join(artifactDirectory,path)));await verifyServerOfflineArtifact(engine);
 if(data){const directory=await createNewDirectory(privateDataOut,{privateOnly:true});for(const path of SERVER_ARTIFACT_DATA_FILES)await writeNew(directory,path,await readFile(join(dataDirectory,path)));await verifyServerOfflineDataPack(directory);}
 return artifact;
}
export async function main(args=process.argv.slice(2)){
 try{const o=parsePairs(args,['--artifact','--out','--data-pack','--data-out']);check(o['--artifact']&&o['--out'],'SERVER_RESTORE_PATHS_REQUIRED');const m=await restoreServerOfflineArtifact({artifactDirectory:o['--artifact'],outDir:o['--out'],dataDirectory:o['--data-pack'],privateDataOut:o['--data-out']});process.stdout.write(JSON.stringify({status:'RESTORED',schemaVersion:m.schemaVersion,serverDataPackRestored:Boolean(o['--data-pack'])})+'\n');}
 catch{process.stderr.write('OFFLINE_SERVER_RESTORE_REJECTED\n');process.exitCode=1;}
}
if(process.argv[1]&&import.meta.url===pathToFileURL(resolve(process.argv[1])).href)await main();
