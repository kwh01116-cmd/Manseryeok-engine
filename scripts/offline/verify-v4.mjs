import {resolve} from 'node:path';
import {pathToFileURL} from 'node:url';
import {assertNode22,parsePairs,check} from './integrity.mjs';
import {verifyServerOfflineArtifact,verifyServerOfflineDataPack} from './integrity-v4.mjs';
export async function main(args=process.argv.slice(2)){
 try{assertNode22();const o=parsePairs(args,['--artifact','--data-pack']);check(o['--artifact'],'SERVER_VERIFY_ARTIFACT_REQUIRED');const m=await verifyServerOfflineArtifact(o['--artifact']);if(o['--data-pack'])await verifyServerOfflineDataPack(o['--data-pack']);process.stdout.write(JSON.stringify({status:'VERIFIED',schemaVersion:m.schemaVersion,sourceRevision:m.sourceRevision,files:m.files.length,serverDataPackVerified:Boolean(o['--data-pack'])})+'\n');}
 catch{process.stderr.write('OFFLINE_SERVER_VERIFY_REJECTED\n');process.exitCode=1;}
}
if(process.argv[1]&&import.meta.url===pathToFileURL(resolve(process.argv[1])).href)await main();
