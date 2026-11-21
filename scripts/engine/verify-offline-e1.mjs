/** Internal package acceptance; this runner, the fixtures and its guards are not shipped. */
import assert from 'node:assert/strict';
import {execFile} from 'node:child_process';
import {promisify} from 'node:util';
import {appendFile,cp,readFile,unlink,writeFile} from 'node:fs/promises';
import {join,resolve} from 'node:path';
import {pathToFileURL} from 'node:url';
import {createNewDirectory,digest,hashFiles,filesBelow,parsePairs,pathsOverlap} from '../offline/integrity.mjs';
import {writeOfflineGuards} from '../offline/guards.mjs';
import {SPRINT6_REPORT_CASES} from '../../test/fixtures/sprint6-report-cases-v1.mjs';
import {verifyEngineArtifact} from './e1-package.mjs';

const execute=promisify(execFile), repo=resolve(import.meta.dirname,'../..');
const legacyPin='c63ce817fd85c6711d72e4b04b2fa700802c2f489187b1cc42ad97859e4383b3';
const asJson=async p=>JSON.parse(await readFile(p,'utf8'));
const put=(p,v)=>writeFile(p,JSON.stringify(v,null,2)+'\n',{flag:'wx'});
const urls=paths=>paths.map(p=>pathToFileURL(p).href);

async function prepareGuards(directory) {
  const {preload,loader}=await writeOfflineGuards(directory,{forbiddenRoot:repo});
  const origin=join(directory,'deny-original-read.mjs'),restore=join(directory,'restore-offline.mjs');
  await writeFile(origin,`import fs from 'node:fs';import fsp from 'node:fs/promises';import {resolve,sep} from 'node:path';import {fileURLToPath} from 'node:url';import {syncBuiltinESMExports} from 'node:module';
const repo=${JSON.stringify(repo.toLowerCase())};
function permitted(p){if(p instanceof URL)p=fileURLToPath(p);if(typeof p!=='string'&&!Buffer.isBuffer(p))return;const full=resolve(String(p)).toLowerCase();if(full===repo||full.startsWith(repo+sep))throw Error('E1_SOURCE_READ_DENIED');}
for(const method of ['readFile','readdir','lstat','stat','realpath','access','open','createReadStream'])for(const [owner,key]of [[fs,method],[fs,method+'Sync'],[fsp,method]]){const orig=owner[key];if(typeof orig==='function')owner[key]=function(p,...args){permitted(p);return orig.call(this,p,...args);};}syncBuiltinESMExports();`,{flag:'wx'});
  await writeFile(restore,`import {register} from 'node:module'; register(${JSON.stringify(pathToFileURL(loader).href)}); globalThis.fetch=()=>{throw Error('OFFLINE_NETWORK_DENIED')}; process.env=new Proxy(process.env,{get(target,name){if(typeof name==='string'&&/KASI|API_KEY|SERVICE_KEY/i.test(name))throw Error('OFFLINE_KEY_ACCESS_DENIED');return Reflect.get(target,name);}});`,{flag:'wx'});
  return {read:urls([origin,preload]),restore:urls([origin,restore])};
}

export async function verifyDetachedE1({artifact,pack,pin,legacy,out,pilot=false}){
  assert.equal(process.versions.node.split('.')[0],'22');
  for(const path of [repo,artifact,pack,legacy])assert.ok(!pathsOverlap(out,path),'new private location outside source and delivery inputs required');
  const manifest=await verifyEngineArtifact(artifact,pin);
  if(!pilot)assert.equal(manifest.sourceState.workingTreeDirty,false,'clean build required');
  assert.equal(digest(await readFile(join(legacy,'artifact-manifest.json'))),legacyPin);
  const dir=await createNewDirectory(out,{privateOnly:true});
  const shipped=join(dir,'delivery'),inputPack=join(dir,'received-data'),engine=join(dir,'engine'),data=join(dir,'server-data');
  const old=join(dir,'legacy-v4'),cases=[],rows=[];
  const receipt={phase:pilot?'DIRTY_PILOT':'FINAL',node:process.version,sourceRevision:manifest.sourceRevision,
    manifestSha256:pin,coreManifestSha256:manifest.coreManifestSha256,legacyPin,files:manifest.files.length,
    bytes:manifest.files.reduce((sum,f)=>sum+f.bytes,0),dataContentPin:manifest.acceptedDataPackSha256,
    cases,processes:rows,offlineBoundary:'Empty PATH, no inherited keys, repo FS/ESM and runtime network/process/write guards; not an OS-level network monitor.'};
  try{
    // Simulate an operator receiving the payload and the separate approved data file set.
    await cp(artifact,shipped,{recursive:true});await cp(pack,inputPack,{recursive:true});await cp(legacy,old,{recursive:true});
    const guards=await prepareGuards(dir);
    async function invoke(label,file,args,{tz='UTC',code=0,denial,write=false}={}){
      const hooks=(write?guards.restore:guards.read).flatMap(url=>['--import',url]);
      const env={PATH:'',TZ:tz};
      for(const k of ['SystemRoot','WINDIR','TEMP','TMP'])if(process.env[k])env[k]=process.env[k];
      let stdout,stderr,status;
      try{({stdout,stderr}=await execute(process.execPath,[...hooks,file,...args],{cwd:dir,env,windowsHide:true,maxBuffer:128*1024*1024,timeout:180000}));status=0;}
      catch(e){({stdout,stderr}=e);status=e.code;}
      const error=(stderr??'').trim();
      rows.push({label,tz,status,bytes:Buffer.byteLength(stdout??''),sha256:digest(stdout??''),error:error.slice(0,180)});
      assert.equal(status,code,label+' '+error.slice(0,250));
      if(denial){assert.equal(error,denial,label);assert.equal(stdout,'');return;}
      assert.equal(error,'',label);return stdout;
    }
    const probe=join(dir,'guard-probe.mjs');
    await writeFile(probe,`import assert from 'node:assert/strict';import {readFile} from 'node:fs/promises';
assert.equal(process.env.PATH,'');assert.throws(()=>process.env.KASI_KEY,/OFFLINE_KEY_ACCESS_DENIED/);
assert.throws(()=>globalThis.fetch('http://127.0.0.1:1'),/OFFLINE_NETWORK_DENIED/);
await assert.rejects(import('node:child_process'),/OFFLINE_NETWORK_OR_PROCESS_IMPORT_DENIED/);
assert.throws(()=>readFile(${JSON.stringify(join(repo,'package.json'))}),/E1_SOURCE_READ_DENIED/);
await assert.rejects(import(${JSON.stringify(pathToFileURL(join(repo,'scripts/engine/e1.mjs')).href)}),/OFFLINE_DEVELOPER_PATH_DENIED/);console.log('GUARDS_OK');`,{flag:'wx'});
    assert.equal((await invoke('DENIAL_CONTROLS',probe,[])).trim(),'GUARDS_OK');
    const restoreArgs=['restore','--manifest-sha',pin,'--out',engine,'--data-pack',inputPack,'--data-out',data];
    const restored=JSON.parse(await invoke('RESTORE',join(shipped,'engine.mjs'),restoreArgs,{write:true}));
    assert.equal(restored.dataPackRestored,true);
    const payload=join(engine,'engine.mjs'),example=await asJson(join(engine,'docs/contracts/examples/engine-e1-request-v1.json'));
    const runArgs=(file,packDir=data)=>['run','--manifest-sha',pin,'--data-pack',packDir,'--request',file];
    const known=['MONTH_MAIN_OFFICER','LICHUN_CORRELATED_NATAL_PARENTS','DERIVED_EARTH_SEASON_BOUNDARY',
      'HISTORICAL_DST_PREVIOUS_STANDARD_DATE','DST_NONEXISTENT_CIVIL_TIME','DST_AMBIGUOUS_CIVIL_TIME','FUTURE_LUNAR_NEEDS_DATA'];
    const fixtures=known.map(id=>SPRINT6_REPORT_CASES.find(f=>f.id===id));
    const june={...example.birth,date:'2026-06-01'}, lunar={...june,calendar:'KOREAN_LUNAR',lunarDate:{lunarYear:2026,lunarMonth:4,lunarDay:16,leap:false}};delete lunar.date;
    for(const [id,birth] of [['EQUIVALENT_SOLAR',june],['EQUIVALENT_LUNAR',lunar]])fixtures.push({id,request:birth,expected:{status:'CALCULATED_UNDER_SELECTED_POLICIES',pillars:[['丙午','癸巳','丙午','甲午']],natalParents:1}});
    let oldMeaning,solar,firstFile;
    for(const {id,request,expected} of fixtures){
      const file=join(dir,id+'.json');await put(file,{...example,birth:request});
      const code=expected.natalParents?0:2;
      const bytes=await invoke(id,payload,runArgs(file),{code});
      const result=JSON.parse(bytes);
      assert.equal(result.status,expected.status,id);
      assert.equal(result.candidates.length,expected.natalParents,id);
      assert.equal(result.existing.candidates.length,expected.natalParents,id);
      const pillars=result.candidates.map(c=>c.pillars.map(p=>p.stem+p.branch));
      if(expected.pillars)assert.deepEqual(pillars,expected.pillars,id);
      if(expected.seasonalAlternativesPerParent){
        assert.deepEqual(result.existing.analysisData.base.existing.seasonal.candidates.map(s=>s.judgment.alternatives.length),expected.seasonalAlternativesPerParent,id);
      }
      for(const c of result.candidates){
        assert.equal(c.strengthAssessment.candidateRef,c.candidateRef);
        assert.equal(c.eokbuCandidate.candidateRef,c.candidateRef);
        assert.equal(c.strengthAssessment.score.totalUnits,10000);
      }
      if(id==='MONTH_MAIN_OFFICER'){
        assert.equal(result.candidates[0].strengthAssessment.score.supportUnits,1400);
        firstFile=file;oldMeaning=digest(JSON.stringify(result.existing));
      }
      if(id==='LICHUN_CORRELATED_NATAL_PARENTS'){
        const seoul=await invoke(id,payload,runArgs(file),{tz:'Asia/Seoul'});
        assert.equal(digest(seoul),digest(bytes));receipt.timezoneIdenticalBytes=digest(bytes);
      }
      const analysisDigest=digest(JSON.stringify(result.candidates.map(c=>[c.strengthAssessment,c.eokbuCandidate])));
      if(id==='EQUIVALENT_SOLAR')solar=analysisDigest;
      if(id==='EQUIVALENT_LUNAR'){assert.equal(analysisDigest,solar);receipt.solarLunarMeaningSha256=solar;}
      cases.push({id,status:result.status,pillars,grades:result.candidates.map(c=>c.strengthAssessment.grade),ranks:result.candidates.map(c=>c.eokbuCandidate.status)});
    }
    const oldArgs=['--data-pack',data,'--request-json',JSON.stringify(fixtures[0].request),'--output','json','--detail','summary'];
    const legacyResult=JSON.parse(await invoke('ORIGINAL_V4_REFERENCE',join(old,'run.mjs'),oldArgs));
    assert.equal(digest(JSON.stringify(legacyResult)),oldMeaning,'upstream data in opt-in E1 changed');
    const scratchPack=join(dir,'negative-pack');await cp(data,scratchPack,{recursive:true});
    const notice=join(scratchPack,'NOTICE.txt'),original=await readFile(notice);
    await appendFile(notice,'tamper');
    await invoke('PACK_TAMPER',payload,runArgs(firstFile,scratchPack),{code:1,denial:'API_ONLY_FILE_CHANGED'});
    await unlink(notice);
    await invoke('PACK_MISSING',payload,runArgs(firstFile,scratchPack),{code:1,denial:'API_ONLY_FILE_SET'});
    await writeFile(notice,original,{flag:'wx'});
    await put(join(scratchPack,'comparisons.json'),{test:'unapproved extra source'});
    await invoke('PACK_MIXED',payload,runArgs(firstFile,scratchPack),{code:1,denial:'API_ONLY_FILE_SET'});
    const scratchEngine=join(dir,'negative-engine');await cp(engine,scratchEngine,{recursive:true});
    const bad=join(scratchEngine,'engine.mjs');
    await appendFile(join(scratchEngine,'dist/e1/productStrengthV1.js'),'\n// acceptance mutation\n');
    await invoke('MUTATED_MODULE',bad,['verify','--manifest-sha',pin],{code:1,denial:'E1_ARTIFACT_FILE_SET_OR_BYTES_CHANGED'});
    await appendFile(join(scratchEngine,'engine-manifest.json'),' ');
    await invoke('MUTATED_MANIFEST',bad,['verify','--manifest-sha',pin],{code:1,denial:'E1_MANIFEST_PIN_MISMATCH'});
    await verifyEngineArtifact(engine,pin);await verifyEngineArtifact(artifact,pin);
    assert.deepEqual(await hashFiles(data,await filesBelow(data)),await hashFiles(pack,await filesBelow(pack)));
    receipt.oldServerDTOEqualsE1Existing=true;receipt.restoredDataBytesEqual=true;receipt.status='PASS';
    await put(join(dir,'receipt.json'),receipt);return receipt;
  }catch(error){receipt.status='FAIL';receipt.failure=String(error.message).slice(0,350);await put(join(dir,'failure.json'),receipt);throw error;}
}

if(process.argv[1]&&import.meta.url===pathToFileURL(resolve(process.argv[1])).href){
  try{
    const o=parsePairs(process.argv.slice(2),['--artifact','--manifest-sha','--data-pack','--legacy-v4','--out','--pilot']);
    for(const key of ['--artifact','--manifest-sha','--data-pack','--legacy-v4','--out'])assert.ok(o[key],key+' required');
    assert.ok(!o['--pilot']||o['--pilot']==='true');
    const result=await verifyDetachedE1({artifact:resolve(o['--artifact']),pack:resolve(o['--data-pack']),legacy:resolve(o['--legacy-v4']),
      pin:o['--manifest-sha'],out:resolve(o['--out']),pilot:o['--pilot']==='true'});
    console.log(JSON.stringify({status:result.status,files:result.files,cases:result.cases.length,processes:result.processes.length,sourceRevision:result.sourceRevision}));
  }catch(e){console.error(String(e.message).slice(0,360));process.exitCode=1;}
}
