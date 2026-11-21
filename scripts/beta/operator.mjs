/** Offline operator console. No HTTP admin endpoint. Secret-bearing outputs require a fresh private file. */
import {open,mkdir,lstat,realpath,unlink} from 'node:fs/promises';
import {resolve,join,dirname,basename,relative,isAbsolute,sep} from 'node:path';
import {fileURLToPath,pathToFileURL} from 'node:url';
import {openBetaStudy} from './study.mjs';

const privateRoot=fileURLToPath(new URL('../../.private/',import.meta.url));
const commands={
  issue:{required:['role','fixture','out'],optional:['arm','max-uses','expires-hours']},
  revoke:{required:['invite-id'],optional:[]},erase:{required:['participant-id'],optional:[]},
  aggregate:{required:[],optional:[]},export:{required:['out'],optional:[]},purge:{required:[],optional:[]},health:{required:[],optional:[]}
};
const reject=code=>{const error=new Error(code);error.code=code;throw error;};
async function checkedDir(path) {
  for(let current=resolve(path);;current=dirname(current)){
    try {
      const item=await lstat(current);
      if (!item.isDirectory()||item.isSymbolicLink()) reject('BETA_OPERATOR_UNSAFE_PATH');
    } catch (error) { if(error.code!=='ENOENT')throw error; }
    if(dirname(current)===current) break;
  }
  await mkdir(path,{recursive:true,mode:0o700});
  if(await realpath(path)!==resolve(path)) reject('BETA_OPERATOR_UNSAFE_PATH');
}
async function privateFile(dir,name,payload) {
  // Only a new normal file below the private operator's directory; never accept a client path.
  if(typeof name!=='string'||basename(name)!==name||!/^[a-zA-Z0-9_-]{1,80}\.json$/.test(name)) reject('BETA_OPERATOR_OUTPUT_FILENAME');
  const parent=join(dir,'operator-output');await checkedDir(parent);
  const target=join(parent,name);
  const output=await open(target,'wx',0o600);
  try { await output.writeFile(JSON.stringify(payload,null,2)+'\n','utf8');await output.sync(); }
  catch(error){await output.close();await unlink(target);throw error;}
  await output.close();
}
export async function runBetaOperator(argv) {
  const [action,...options]=argv;
  if(!Object.hasOwn(commands,action)||options.length%2) reject('BETA_OPERATOR_ARGUMENTS');
  const spec=commands[action],args=Object.create(null);
  for(let i=0;i<options.length;i+=2) {
    if(!options[i].startsWith('--'))reject('BETA_OPERATOR_ARGUMENTS');
    const key=options[i].slice(2),v=options[i+1];
    if(!['state-dir',...spec.required,...spec.optional].includes(key)||args[key]!==undefined||!v||v.startsWith('--'))reject('BETA_OPERATOR_ARGUMENTS');
    args[key]=v;
  }
  if(!['state-dir',...spec.required].every(k=>Object.hasOwn(args,k))) reject('BETA_OPERATOR_ARGUMENTS');
  const dir=resolve(args['state-dir']),rel=relative(resolve(privateRoot),dir);
  if(!rel||rel==='..'||rel.startsWith('..'+sep)||isAbsolute(rel)) reject('BETA_OPERATOR_PRIVATE_DIRECTORY_REQUIRED');
  await checkedDir(dir);
  const study=await openBetaStudy({directory:dir,mode:'INTERNAL_QA'});
  try {
    const op=study.operator;
    if(action==='issue'){
      const invite=await op.issue({role:args.role,fixtureId:args.fixture,...(args.arm?{arm:args.arm}:{}),
        ...(args['max-uses']?{maxUses:Number(args['max-uses'])}:{}),...(args['expires-hours']?{expiresInMs:Number(args['expires-hours'])*3600000}:{})});
      try {await privateFile(dir,args.out,{classification:'INTERNAL_QA_LOCAL_ONLY',...invite});}
      catch(error){await op.revoke(invite.inviteId);throw error;}
      return {status:'INVITE_WRITTEN',file:args.out,expiresAt:invite.expiresAt};
    }
    if(action==='export'){
      await privateFile(dir,args.out,await op.exportFeedback());
      return {status:'QA_SNAPSHOT_WRITTEN',file:args.out,deleteSeparateCopyAfterUse:true};
    }
    if(action==='revoke')return op.revoke(args['invite-id']);
    if(action==='erase')return op.erase(args['participant-id']);
    if(action==='purge')return op.purge();
    if(action==='health')return op.health();
    return op.aggregate();
  } finally { await study.close(); }
}
if(process.argv[1] && pathToFileURL(resolve(process.argv[1])).href===import.meta.url) {
  try {
    if(process.versions.node.split('.')[0]!=='22')reject('NODE22_REQUIRED');
    process.stdout.write(JSON.stringify(await runBetaOperator(process.argv.slice(2)),null,2)+'\n');
  } catch(error) {
    const code=typeof error.code==='string'&&/^[A-Z][A-Z0-9_]{1,80}$/.test(error.code)?error.code:'BETA_OPERATOR_FAILURE';
    process.stderr.write(JSON.stringify({status:'REJECTED',code})+'\n');process.exitCode=1;
  }
}
