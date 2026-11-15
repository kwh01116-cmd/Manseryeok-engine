import {resolve} from 'node:path';
import {pathToFileURL} from 'node:url';
import {assertNode22,check,parsePairs} from './integrity.mjs';
import {verifyExtendedArtifact,verifyExtendedAttachment} from './integrity-v3.mjs';
export async function main(args=process.argv.slice(2)){
 try{assertNode22();const o=parsePairs(args,['--artifact','--attachment']);check(o['--artifact'],'ARTIFACT_REQUIRED');const m=await verifyExtendedArtifact(o['--artifact']);if(o['--attachment'])await verifyExtendedAttachment(o['--attachment']);process.stdout.write(JSON.stringify({status:'VERIFIED',schemaVersion:m.schemaVersion,files:m.files.length,privateAttachmentVerified:Boolean(o['--attachment']),sourceRevision:m.sourceRevision})+'\n');}
 catch{process.stderr.write('OFFLINE_EXTENDED_VERIFICATION_REJECTED\n');process.exitCode=1;}
}
if(process.argv[1]&&import.meta.url===pathToFileURL(resolve(process.argv[1])).href)await main();
