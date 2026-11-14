import {resolve} from 'node:path';
import {pathToFileURL} from 'node:url';
import {assertNode22,check,parsePairs,verifyAttachment} from './integrity.mjs';
import {verifyIntegratedArtifact} from './integrity-v2.mjs';
export async function main(args=process.argv.slice(2)){
  try{assertNode22();const options=parsePairs(args,['--artifact','--attachment']);check(options['--artifact'],'ARTIFACT_REQUIRED');const artifact=await verifyIntegratedArtifact(options['--artifact']);if(options['--attachment'])await verifyAttachment(options['--attachment']);process.stdout.write(JSON.stringify({status:'VERIFIED',schemaVersion:artifact.schemaVersion,files:artifact.files.length,privateAttachmentVerified:Boolean(options['--attachment']),sourceRevision:artifact.sourceRevision})+'\n');}
  catch{process.stderr.write('OFFLINE_INTEGRATED_VERIFICATION_REJECTED\n');process.exitCode=1;}
}
if(process.argv[1]&&import.meta.url===pathToFileURL(resolve(process.argv[1])).href)await main();
