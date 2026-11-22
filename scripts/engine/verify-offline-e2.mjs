/** Developer acceptance of a detached, operator-pinned E2 artifact. Never shipped in the engine. */
import assert from 'node:assert/strict';
import {execFile} from 'node:child_process';
import {appendFile,cp,mkdir,readFile,unlink,writeFile} from 'node:fs/promises';
import {join,resolve} from 'node:path';
import {promisify} from 'node:util';
import {pathToFileURL} from 'node:url';
import {createNewDirectory,digest,filesBelow,hashFiles,parsePairs,pathsOverlap} from '../offline/integrity.mjs';
import {writeOfflineGuards} from '../offline/guards.mjs';
import {E2_OFFLINE_CASES} from '../../test/fixtures/e2-offline-cases-v1.mjs';
import {verifyE2Package} from './e2-package.mjs';

const exec = promisify(execFile);
const repo = resolve(import.meta.dirname,'../..');
const writeJson = (path,value) => writeFile(path,JSON.stringify(value,null,2)+'\n',{flag:'wx'});
const e1Pin = '9eb3ad7fd5abce411b97e0fa6eaebad746270b7b05af8ae9c49fe125afb58669';
const names = ['chart','elementsTenGods','hiddenStems','twelveStages','relations','gongmang','sinsal','daeun','seyun','monthly','strength','eokbu','climate','pattern','patternReview'];

function checkCase(fixture, value) {
  const {expected,id} = fixture;
  assert.equal(value.schemaVersion,'manseryeok-engine-e2-result-v1');
  assert.equal(value.status,expected.status,id);
  assert.equal(value.candidates.length,expected.natalParents,id);
  const maps=value.candidates.length?value.candidates.map(c=>c.features):[value.unavailableFeatures];
  for (const map of maps) for (const feature of Object.values(map)) for (const pointer of feature.factRefs) {
    assert.ok(pointer.startsWith('/'),id+' '+'non-pointer reference');
    let node=value;
    for (const token of pointer.slice(1).split('/')) {
      const key=token.replaceAll('~1','/').replaceAll('~0','~');
      assert.ok(node != null && Object.hasOwn(node,key),id+' '+feature.featureId+' '+pointer);
      node=node[key];
    }
  }
  if (!value.candidates.length) {
    const blocked = ({NEEDS_DATA:'NEEDS_DATA',NEEDS_BIRTH_TIME:'NEEDS_INPUT',AMBIGUOUS_TIME:'NEEDS_INPUT',
      NONEXISTENT_TIME:'INVALID_INPUT',POLICY_UNRESOLVED:'POLICY_UNRESOLVED'})[expected.status];
    assert.ok(blocked,id);
    for (const name of names) assert.equal(value.unavailableFeatures[name].availability,blocked,id+' '+name);
    return [];
  }
  return value.candidates.map((c,index) => {
    const fs = c.features;
    for (const name of names) {
      const feature = fs[name];
      assert.equal(feature.featureId,name,id+' '+name);
      assert.ok(['AVAILABLE','PARTIAL','HOLD','NOT_SELECTED','NEEDS_INPUT','NEEDS_DATA','POLICY_UNRESOLVED','NOT_IMPLEMENTED'].includes(feature.availability));
      assert.ok(Object.hasOwn(feature,'result') && Object.hasOwn(feature,'policyId') && Object.hasOwn(feature,'policyVersion'));
      assert.ok(Array.isArray(feature.factRefs) && Array.isArray(feature.limitationCodes));
    }
    const pillars = fs.chart.result.pillars.map(p=>p.stem+p.branch);
    if (expected.pillars) assert.deepEqual(pillars,expected.pillars[index],id);
    if (expected.dayPillar) assert.equal(pillars[2],expected.dayPillar,id);
    assert.equal(fs.twelveStages.result.natal.length,4);
    assert.equal(fs.hiddenStems.result.length,4);
    assert.equal(fs.strength.result.candidateRef,c.candidateRef);
    assert.equal(fs.eokbu.result.candidateRef,c.candidateRef);
    if (expected.grade) assert.equal(fs.strength.result.grade,expected.grade,id);
    if (expected.supportUnits !== undefined) assert.equal(fs.strength.result.score.supportUnits,expected.supportUnits,id);
    if (expected.special !== undefined) assert.equal(fs.strength.result.specialReview,expected.special,id);
    if (expected.rank) assert.equal(fs.eokbu.result.status,expected.rank,id);
    if (expected.m5) assert.equal(fs.climate.result.status,expected.m5.status,id);
    const stars = fs.sinsal.result.observations;
    assert.equal(stars.length,9);
    if (id === 'MONTH_MAIN_OFFICER') {
      const peach = basis => stars.find(r=>r.starId==='DOHWA' && r.basis===basis);
      assert.deepEqual(peach('YEAR_BRANCH').matchedPositions.map(p=>p.position),['day','hour']);
      assert.equal(peach('DAY_BRANCH').status,'NOT_PRESENT');
      assert.equal(fs.daeun.availability,'NEEDS_INPUT');
    }
    if (expected.firstSwitch) {
      const d = fs.daeun.result;
      assert.equal(d.projection.calendar.firstStartMinute,expected.firstSwitch,id);
      assert.equal(d.calculation.start.nominalIntervalMinutes,expected.distance,id);
      assert.equal(d.calculation.direction.direction,expected.direction,id);
      assert.equal(d.projection.calendar.periods.length,5);
      assert.ok(fs.seyun.result && fs.monthly.result);
    }
    if (expected.seasonalAlternativesPerParent) assert.deepEqual(value.existing.analysisData.base.existing.seasonal.candidates.map(s=>s.judgment.alternatives.length),expected.seasonalAlternativesPerParent);
    return {candidateRef:c.candidateRef,pillars,grade:fs.strength.result.grade,rank:fs.eokbu.result.status,
      pattern:fs.pattern.result.selection.candidateTypes,
      availability:Object.fromEntries(names.map(n=>[n,fs[n].availability])),
      starHits:stars.filter(s=>s.status==='PRESENT').map(s=>({star:s.starId,basis:s.basis,positions:s.matchedPositions.map(p=>p.position)}))};
  });
}

export async function verifyDetachedE2({artifact,pin,dataPack,previousE1,out,pilot=false}) {
  assert.equal(process.versions.node.split('.')[0],'22');
  assert.ok([repo,artifact,dataPack,previousE1].every(p=>!pathsOverlap(out,p)));
  const manifest = await verifyE2Package(artifact,pin);
  if (!pilot) assert.equal(manifest.sourceState.workingTreeDirty,false,'CLEAN_CODE_REQUIRED');
  const dir = await createNewDirectory(out,{privateOnly:true});
  const receipt = {phase:pilot?'PILOT':'FINAL',node:process.version,sourceRevision:manifest.sourceRevision,
    manifestSha256:pin,e1ManifestSha256:manifest.e1ManifestSha256,originalE1Pin:e1Pin,
    files:manifest.files.length,payloadBytes:manifest.files.reduce((n,f)=>n+f.bytes,0),
    dataContentSha256:manifest.acceptedDataPackSha256,cases:[],processes:[]};
  try {
    const delivery=join(dir,'delivery'), received=join(dir,'received-pack'), engine=join(dir,'engine'),data=join(dir,'server-data');
    const legacy=join(dir,'previous-e1');
    await cp(artifact,delivery,{recursive:true});await cp(dataPack,received,{recursive:true});await cp(previousE1,legacy,{recursive:true});
    const {loader,preload} = await writeOfflineGuards(dir,{forbiddenRoot:repo});
    const scope = join(dir,'local-inputs.mjs');
    await writeFile(scope,`import fs from 'node:fs';import fsp from 'node:fs/promises';import {relative,resolve,isAbsolute} from 'node:path';import {fileURLToPath} from 'node:url';import {syncBuiltinESMExports} from 'node:module';
function permitted(p){if(p instanceof URL)p=fileURLToPath(p);if(typeof p!=='string'&&!Buffer.isBuffer(p))return;const rel=relative(${JSON.stringify(repo)},resolve(String(p)));if(!isAbsolute(rel)&&rel!=='..'&&!rel.startsWith('..\\\\')&&!rel.startsWith('../'))throw Error('E2_SOURCE_READ_DENIED');}
for(const method of ['readFile','createReadStream','readdir','open','lstat','stat','realpath','access'])for(const [obj,k]of [[fs,method],[fs,method+'Sync'],[fsp,method]]){const orig=obj[k];if(typeof orig==='function')obj[k]=function(path,...args){permitted(path);return orig.call(this,path,...args);};}syncBuiltinESMExports();`,{flag:'wx'});
    const restoreGuard=join(dir,'restore-guard.mjs');
    await writeFile(restoreGuard,`import {register} from 'node:module';register(${JSON.stringify(pathToFileURL(loader).href)});globalThis.fetch=()=>{throw Error('OFFLINE_NETWORK_DENIED')};process.env=new Proxy(process.env,{get(t,n){if(typeof n==='string'&&/KASI|API_KEY|SERVICE_KEY/i.test(n))throw Error('OFFLINE_KEY_ACCESS_DENIED');return Reflect.get(t,n);}});`,{flag:'wx'});
    async function invoke(label,file,args,{tz='UTC',code=0,error,restore=false}={}) {
      const env = {PATH:'',TZ:tz};
      for (const key of ['SystemRoot','WINDIR','TEMP','TMP']) if (process.env[key]) env[key]=process.env[key];
      const flags = [scope,restore?restoreGuard:preload].flatMap(p=>['--import',pathToFileURL(p).href]);
      let stdout,stderr,status;
      try {({stdout,stderr}=await exec(process.execPath,[...flags,file,...args],{cwd:dir,env,windowsHide:true,timeout:180000,maxBuffer:128*1024*1024}));status=0;}
      catch(e){({stdout,stderr}=e);status=e.code;}
      receipt.processes.push({label,tz,status,bytes:Buffer.byteLength(stdout??''),sha256:digest(stdout??'')});
      assert.equal(status,code,label+' '+String(stderr).trim().slice(0,160));
      assert.equal(stderr.trim(),error??'',label);
      if (error) assert.equal(stdout,'');
      return stdout;
    }
    const probe = join(dir,'guard-probe.mjs');
    await writeFile(probe,`import assert from 'node:assert/strict';import {readFile} from 'node:fs/promises';assert.equal(process.env.PATH,'');assert.throws(()=>process.env.KASI_KEY,/OFFLINE_KEY_ACCESS_DENIED/);assert.throws(()=>fetch('http://127.0.0.1:1'),/OFFLINE_NETWORK_DENIED/);assert.throws(()=>readFile(${JSON.stringify(join(repo,'package.json'))}),/E2_SOURCE_READ_DENIED/);await assert.rejects(import('node:child_process'),/OFFLINE_NETWORK_OR_PROCESS_IMPORT_DENIED/);await assert.rejects(import(${JSON.stringify(pathToFileURL(join(repo,'scripts/engine/e2.mjs')).href)}),/OFFLINE_DEVELOPER_PATH_DENIED/);`,{flag:'wx'});
    await invoke('GUARDS',probe,[]);
    const bootstrap = join(engine,'engine.mjs');
    const restored = await invoke('RESTORE',join(delivery,'engine.mjs'),['restore','--manifest-sha',pin,'--out',engine,'--data-pack',received,'--data-out',data],{restore:true});
    assert.ok(JSON.parse(restored).dataPackRestored);
    const example = JSON.parse(await readFile(join(engine,'docs/contracts/examples/engine-e2-request-v1.json'),'utf8'));
    const args = (request,pack=data)=>['run','--manifest-sha',pin,'--data-pack',pack,'--request',request];
    await mkdir(join(dir,'requests'));await mkdir(join(dir,'results'));
    const samplePath=join(engine,'docs/contracts/examples/engine-e2-request-v1.json');
    const sampleBytes=await invoke('BUNDLED_ALL_SEVEN',bootstrap,args(samplePath));
    const sample=JSON.parse(sampleBytes), sampleFeatures=sample.candidates[0].features;
    assert.equal(sampleFeatures.strength.result.score.supportUnits,1400);
    assert.equal(sampleFeatures.eokbu.result.status,'COMPETING_CANDIDATES');
    assert.ok(sampleFeatures.daeun.result.projection.calendar.firstStartMinute);
    for (const name of ['daeun','strength','eokbu','twelveStages','sinsal','hiddenStems','relations']) {
      assert.ok(['AVAILABLE','PARTIAL'].includes(sampleFeatures[name].availability),name);
      assert.ok(sampleFeatures[name].result,name);
    }
    await writeFile(join(dir,'results','BUNDLED_ALL_SEVEN.json'),sampleBytes,{flag:'wx'});
    receipt.bundledSevenInOneCall={m1Calls:sample.existing.executionCounts.birthM1Calls,sha256:digest(sampleBytes)};
    assert.equal(receipt.bundledSevenInOneCall.m1Calls,1);
    const coreSelection={...example.selection,sinsal:{...example.selection.sinsal,branchReference:'DAY'}};
    delete coreSelection.e1;
    const coreRequest=join(dir,'requests','NO_E1_DAY_REFERENCE.json');
    await writeJson(coreRequest,{...example,selection:coreSelection});
    const core=JSON.parse(await invoke('NO_E1_DAY_REFERENCE',bootstrap,args(coreRequest))).candidates[0].features;
    for(const name of ['strength','eokbu']){assert.equal(core[name].availability,'NOT_SELECTED');assert.equal(core[name].result,null);}
    assert.deepEqual(core.sinsal.result.observations,sampleFeatures.sinsal.result.observations.filter(s=>s.basis!=='YEAR_BRANCH'));
    const partial=structuredClone(example);
    delete partial.birth.luckOptions.features.dayun.traditionalSex;
    const partialPath=join(dir,'requests','PARTIAL_DAYUN.json');
    await writeJson(partialPath,partial);
    const partialResult=JSON.parse(await invoke('PARTIAL_DAYUN',bootstrap,args(partialPath)));
    assert.equal(partialResult.candidates[0].features.daeun.availability,'NEEDS_INPUT');
    assert.ok(partialResult.candidates[0].features.seyun.result);
    assert.deepEqual(partialResult.inputContext.pendingDayunRequest,partial.birth.luckOptions);
    let equivalent,first,firstResult;
    for (const fixture of E2_OFFLINE_CASES) {
      const {id,birth,expected} = fixture;
      const request=join(dir,'requests',id+'.json');
      await writeJson(request,{...example,birth});
      const bytes = await invoke(id,bootstrap,args(request),{code:expected.natalParents?0:2});
      const result = JSON.parse(bytes);
      const summary = checkCase(fixture,result);
      await writeFile(join(dir,'results',id+'.json'),bytes,{flag:'wx'});
      receipt.cases.push({id,status:result.status,summary,sha256:digest(bytes)});
      if (id==='MONTH_MAIN_OFFICER') { first=request;firstResult=result; }
      if (id==='LICHUN_CORRELATED_NATAL_PARENTS') {
        const seoul = await invoke(id,bootstrap,args(request),{tz:'Asia/Seoul'});
        assert.equal(digest(seoul),digest(bytes));receipt.timezoneSha256=digest(seoul);
      }
      if (id.startsWith('LEAP_')) {
        const f=result.candidates[0].features;
        const semantic = digest(JSON.stringify([f.chart.result.pillars,f.twelveStages.result.natal,f.hiddenStems.result,
          f.sinsal.result,f.strength.result,f.eokbu.result.candidates,f.eokbu.result.holdReasons]));
        if(id==='LEAP_GREGORIAN') equivalent=semantic;
        else {assert.equal(semantic,equivalent);receipt.leapEquivalentSha256=semantic;}
      }
    }
    const oldRequest=join(dir,'requests','PREVIOUS_E1.json'), oldExample=JSON.parse(await readFile(join(legacy,'docs/contracts/examples/engine-e1-request-v1.json'),'utf8'));
    await writeJson(oldRequest,{...oldExample,birth:E2_OFFLINE_CASES[0].birth});
    const old=JSON.parse(await invoke('ORIGINAL_E1',join(legacy,'engine.mjs'),['run','--manifest-sha',e1Pin,'--data-pack',data,'--request',oldRequest]));
    assert.deepEqual(firstResult.existing,old.existing);
    assert.deepEqual(firstResult.candidates[0].features.strength.result,old.candidates[0].strengthAssessment);
    assert.deepEqual(firstResult.candidates[0].features.eokbu.result,old.candidates[0].eokbuCandidate);
    receipt.originalE1AndServerDtoEqual=true;
    const scratch=join(dir,'tamper-pack');await cp(data,scratch,{recursive:true});
    const notice=join(scratch,'NOTICE.txt'),original=await readFile(notice);
    await appendFile(notice,'x');await invoke('PACK_TAMPER',bootstrap,args(first,scratch),{code:1,error:'API_ONLY_FILE_CHANGED'});
    await unlink(notice);await invoke('PACK_MISSING',bootstrap,args(first,scratch),{code:1,error:'API_ONLY_FILE_SET'});
    await writeFile(notice,original,{flag:'wx'});await writeJson(join(scratch,'extra.json'),{});
    await invoke('PACK_MIXING',bootstrap,args(first,scratch),{code:1,error:'API_ONLY_FILE_SET'});
    const bad=join(dir,'tamper-engine');await cp(engine,bad,{recursive:true});
    await appendFile(join(bad,'scripts/engine/e2.mjs'),'\n// acceptance mutation');
    await invoke('CODE_TAMPER',join(bad,'engine.mjs'),['verify','--manifest-sha',pin],{code:1,error:'E1_ARTIFACT_FILE_SET_OR_BYTES_CHANGED'});
    await appendFile(join(bad,'engine-manifest.json'),' ');
    await invoke('MANIFEST_TAMPER',join(bad,'engine.mjs'),['verify','--manifest-sha',pin],{code:1,error:'E2_MANIFEST_PIN_MISMATCH'});
    await verifyE2Package(engine,pin);await verifyE2Package(artifact,pin);
    assert.deepEqual(await hashFiles(data,await filesBelow(data)),await hashFiles(dataPack,await filesBelow(dataPack)));
    receipt.status='PASS';receipt.restoredDataBytesEqual=true;
    receipt.boundary='Empty PATH, no supplied API keys, repo reads and module imports plus network/child processes denied in Node; no OS packet capture.';
    await writeJson(join(dir,'receipt.json'),receipt);return receipt;
  } catch(error) {
    receipt.status='FAIL';receipt.reason=String(error.message).slice(0,420);
    await writeJson(join(dir,'failure.json'),receipt);throw error;
  }
}

if (process.argv[1] && import.meta.url===pathToFileURL(resolve(process.argv[1])).href) {
  try {
    const o=parsePairs(process.argv.slice(2),['--artifact','--manifest-sha','--data-pack','--previous-e1','--out','--pilot']);
    for (const key of ['--artifact','--manifest-sha','--data-pack','--previous-e1','--out']) assert.ok(o[key],key+' required');
    assert.ok(!o['--pilot'] || o['--pilot']==='true');
    const result=await verifyDetachedE2({artifact:resolve(o['--artifact']),pin:o['--manifest-sha'],dataPack:resolve(o['--data-pack']),
      previousE1:resolve(o['--previous-e1']),out:resolve(o['--out']),pilot:o['--pilot']==='true'});
    console.log(JSON.stringify({status:result.status,files:result.files,cases:result.cases.length,processes:result.processes.length,sha:result.sourceRevision}));
  }catch(e){console.error(String(e.message).slice(0,420));process.exitCode=1;}
}
