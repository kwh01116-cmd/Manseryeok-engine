/** Private copies of the existing accepted base and boundary files only. No HTTP. */
import {readFile} from 'node:fs/promises';
import {join,resolve} from 'node:path';
import {pathToFileURL} from 'node:url';
import {assertNode22,check,BASELINE_PIN,DATA_FILES,createNewDirectory,writeNew,hashFiles,parsePairs,pathsOverlap,rejectSymlinkAncestors} from './integrity.mjs';
import {EXTENDED_ATTACHMENT_SCHEMA,ACCEPTED_BOUNDARY_PIN,ACCEPTED_ANNUAL_SOLAR_PIN,ACCEPTED_BOUNDARY_TREE_PIN,EXTENDED_DATA_RIGHTS,BOUNDARY_FILES,EXTENDED_DATA_FILES,verifyExtendedDataSources,verifyExtendedAttachment} from './integrity-v3.mjs';

export async function attachExtendedPrivateData({candidateDirectory,boundaryDirectory,outDir}){
 assertNode22();check([candidateDirectory,boundaryDirectory,outDir].every(path=>typeof path==='string'&&path.length>0),'EXPLICIT_EXTENDED_DATA_PATHS_REQUIRED');
 for(const source of [candidateDirectory,boundaryDirectory]){check(!pathsOverlap(source,outDir),'EXTENDED_ATTACHMENT_SOURCE_TARGET_OVERLAP');await rejectSymlinkAncestors(source);}
 await verifyExtendedDataSources({candidateDirectory,boundaryDirectory});
 const inputs=[...await hashFiles(candidateDirectory,DATA_FILES),...await hashFiles(boundaryDirectory,BOUNDARY_FILES)];
 const contents=new Map();for(const path of DATA_FILES)contents.set('base/'+path,await readFile(join(candidateDirectory,path)));for(const path of BOUNDARY_FILES)contents.set('boundary/'+path,await readFile(join(boundaryDirectory,path)));
 const target=await createNewDirectory(outDir,{privateOnly:true});for(const [path,bytes]of contents)await writeNew(target,path,bytes);
 const m={schemaVersion:EXTENDED_ATTACHMENT_SCHEMA,version:'0.3.0',baseManifestContentSha256:BASELINE_PIN,boundarySupplementContentSha256:ACCEPTED_BOUNDARY_PIN,annualSolarContentSha256:ACCEPTED_ANNUAL_SOLAR_PIN,boundarySourceTreeSha256:ACCEPTED_BOUNDARY_TREE_PIN,rights:{...EXTENDED_DATA_RIGHTS},optInRequired:true,sourceMeaning:'EXACT_EXISTING_BYTES_BASE_AND_BOUNDARY_SEPARATE_SUBDIRECTORIES',files:await hashFiles(target,EXTENDED_DATA_FILES)};
 await writeNew(target,'attachment.json',JSON.stringify(m,null,2)+'\n');await verifyExtendedAttachment(target);
 const after=[...await hashFiles(candidateDirectory,DATA_FILES),...await hashFiles(boundaryDirectory,BOUNDARY_FILES)];check(JSON.stringify(after)===JSON.stringify(inputs),'EXTENDED_ATTACHMENT_SOURCE_CHANGED');return m;
}
export async function main(args=process.argv.slice(2)){
 try{const o=parsePairs(args,['--candidate','--boundary-supplement','--out']);check(o['--candidate']&&o['--boundary-supplement']&&o['--out'],'EXPLICIT_EXTENDED_DATA_PATHS_REQUIRED');const m=await attachExtendedPrivateData({candidateDirectory:o['--candidate'],boundaryDirectory:o['--boundary-supplement'],outDir:o['--out']});process.stdout.write(JSON.stringify({status:'ATTACHED_PRIVATE',schemaVersion:m.schemaVersion,files:m.files.length,rights:m.rights})+'\n');}
 catch{process.stderr.write('OFFLINE_EXTENDED_ATTACHMENT_REJECTED\n');process.exitCode=1;}
}
if(process.argv[1]&&import.meta.url===pathToFileURL(resolve(process.argv[1])).href)await main();
