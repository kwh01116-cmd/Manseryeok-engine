/** Offline acceptance for a fixed-revision E3 delivery. This runner ships no private data. */
import assert from 'node:assert/strict';
import {execFile} from 'node:child_process';
import {appendFile,cp,mkdir,readFile,unlink,writeFile} from 'node:fs/promises';
import {join,resolve} from 'node:path';
import {promisify} from 'node:util';
import {pathToFileURL} from 'node:url';
import {createNewDirectory,digest,filesBelow,hashFiles,parsePairs,pathsOverlap} from '../offline/integrity.mjs';
import {writeOfflineGuards} from '../offline/guards.mjs';
import {E2_OFFLINE_CASES} from '../../test/fixtures/e2-offline-cases-v1.mjs';
import {verifyE3Package} from './e3-package.mjs';

const execute=promisify(execFile);
const repo=resolve(import.meta.dirname,'../..');
const save=(path,value)=>writeFile(path,JSON.stringify(value,null,2)+'\n',{flag:'wx'});
const manifestName='engine-manifest.json';
const fixtureIds=[
  'MONTH_MAIN_OFFICER','MONTH_MAIN_DIRECT_WEALTH','LICHUN_CORRELATED_NATAL_PARENTS','DERIVED_EARTH_SEASON_BOUNDARY',
  'HISTORICAL_STABLE_CLOCK','DST_NONEXISTENT_CIVIL_TIME','DST_AMBIGUOUS_CIVIL_TIME','FUTURE_LUNAR_NEEDS_DATA',
  'UNKNOWN_TIME_REQUIRES_INFORMATION','LEAP_GREGORIAN','LEAP_LUNAR','EXTREME_REVIEW','THRESHOLD_REVIEW',
];
const requestPath='docs/contracts/examples/engine-e3-request-v1.json';
const engineName='engine.mjs';

function verifyPointers(result,feature){
  for(const pointer of feature.factRefs){
    assert.match(pointer,/^\//);
    let source=result;
    for(const token of pointer.slice(1).split('/')){
      const key=token.replaceAll('~1','/').replaceAll('~0','~');
      assert.ok(source!=null&&Object.hasOwn(source,key),'unresolved E3 feature reference '+pointer);
      source=source[key];
    }
  }
}

function verifyParents(result,count,status) {
  assert.equal(result.schemaVersion,'manseryeok-engine-e3-result-v1');
  assert.equal(result.status,status);
  assert.equal(result.e2.status,status);
  assert.equal(result.candidates.length,count);
  assert.equal(result.e2.candidates.length,count);
  if(!count){
    const feature=result.unavailableFeatures.patternRules;
    assert.equal(feature.availability,result.e2.unavailableFeatures.patternReview.availability);
    assert.equal(feature.result,null);
    verifyPointers(result,feature);
  }
  for(const [index,candidate] of result.candidates.entries()){
    assert.equal(candidate.candidateRef,result.e2.candidates[index].candidateRef);
    const feature=candidate.features.patternRules;
    assert.equal(feature.featureId,'patternRules');
    assert.equal(feature.policyId,'E3-NATAL-PATTERN-CONDITIONS-V01');
    assert.equal(feature.result.candidateRef,candidate.candidateRef);
    assert.ok(Array.isArray(feature.result.rules)&&feature.result.rules.length>0,'E3_RULE_RESULT_REQUIRED');
    for(const rule of feature.result.rules){
      assert.ok(['OUT_OF_SCOPE','NOT_TRIGGERED','RULE_SATISFIED','UNRESOLVED'].includes(rule.status),rule.ruleId);
      assert.equal(rule.candidateRef,candidate.candidateRef);
    }
    verifyPointers(result,feature);
  }
}

async function writeSourceBoundary(dir,loader){
  const scope=join(dir,'forbidden-source-reads.mjs'),restoreGuard=join(dir,'restore-guard.mjs');
  const repoPath=JSON.stringify(repo), loaderUrl=JSON.stringify(pathToFileURL(loader).href);
  await writeFile(scope,`
import fs from 'node:fs';
import fsp from 'node:fs/promises';
import {relative,resolve,isAbsolute} from 'node:path';
import {fileURLToPath} from 'node:url';
import {syncBuiltinESMExports} from 'node:module';
function check(path){
  if(path instanceof URL)path=fileURLToPath(path);
  if(typeof path!=='string'&&!Buffer.isBuffer(path))return;
  const rel=relative(${repoPath},resolve(String(path)));
  if(!isAbsolute(rel)&&rel!=='..'&&!rel.startsWith('..\\\\')&&!rel.startsWith('../'))throw Error('E3_SOURCE_READ_DENIED');
}
for(const method of ['readFile','createReadStream','readdir','open','lstat','stat','realpath','access']){
  for(const [owner,key] of [[fs,method],[fs,method+'Sync'],[fsp,method]]){
    const original=owner[key];
    if(typeof original==='function')owner[key]=function(path,...args){check(path);return original.call(this,path,...args);};
  }
}
syncBuiltinESMExports();`,{flag:'wx'});
  await writeFile(restoreGuard,`
import {register,syncBuiltinESMExports} from 'node:module';
import net from 'node:net';
import http from 'node:http';
import https from 'node:https';
const deny=()=>{throw Error('OFFLINE_NETWORK_DENIED')};
net.Socket.prototype.connect=deny;
net.Server.prototype.listen=deny;
http.request=deny;http.get=deny;https.request=deny;https.get=deny;globalThis.fetch=deny;
process.env=new Proxy(process.env,{get(target,key){
  if(typeof key==='string'&&/KASI|API_KEY|SERVICE_KEY/i.test(key))throw Error('OFFLINE_KEY_ACCESS_DENIED');
  return Reflect.get(target,key);
}});
syncBuiltinESMExports();register(${loaderUrl});`,{flag:'wx'});
  return {scope,restoreGuard};
}

export async function verifyDetachedE3({artifact,pin,dataPack,out,pilot=false}) {
  assert.equal(process.versions.node.split('.')[0],'22');
  assert.ok([repo,artifact,dataPack].every(path=>!pathsOverlap(out,path)),'OUTPUT_MUST_BE_OUTSIDE_SOURCE_AND_INPUTS');
  const manifest=await verifyE3Package(artifact,pin);
  if(!pilot){
    assert.equal(manifest.sourceState.workingTreeDirty,false,'CLEAN_CODE_REQUIRED');
    assert.equal(manifest.buildMode,'FIXED_SOURCE_REVISION');
  }
  const dir=await createNewDirectory(out,{privateOnly:true});
  const receipt={status:'IN_PROGRESS',node:process.version,sourceRevision:manifest.sourceRevision,sourceState:manifest.sourceState,
    buildMode:manifest.buildMode,manifestSha256:pin,e2ManifestSha256:manifest.e2ManifestSha256,files:manifest.files.length,
    payloadBytes:manifest.files.reduce((size,file)=>size+file.bytes,0),dataContentSha256:manifest.acceptedDataPackSha256,processes:[],cases:[]};
  try{
    const received=join(dir,'input-data'),delivery=join(dir,'input-code'),engine=join(dir,'engine'),data=join(dir,'server-data');
    await cp(artifact,delivery,{recursive:true});
    await cp(dataPack,received,{recursive:true});
    const {loader,preload}=await writeOfflineGuards(dir,{forbiddenRoot:repo});
    const {scope,restoreGuard}=await writeSourceBoundary(dir,loader);
    async function run(label,file,args,{tz='UTC',code=0,restore=false,errors}={}){
      const env={PATH:'',TZ:tz};
      for(const k of ['SystemRoot','WINDIR','TEMP','TMP'])if(process.env[k])env[k]=process.env[k];
      const flags=[scope,restore?restoreGuard:preload].flatMap(p=>['--import',pathToFileURL(p).href]);
      let stdout,stderr,status;
      try{({stdout,stderr}=await execute(process.execPath,[...flags,file,...args],
        {cwd:dir,env,windowsHide:true,timeout:180000,maxBuffer:128*1024*1024}));status=0;}
      catch(error){({stdout,stderr}=error);status=error.code;}
      const message=String(stderr??'').trim();
      receipt.processes.push({label,tz,status,bytes:Buffer.byteLength(stdout??''),sha256:digest(stdout??''),stderr:message});
      assert.equal(status,code,label+' '+message.slice(0,160));
      if(errors){
        assert.ok(errors.includes(message),label+' '+message);
        assert.equal(stdout,'');
      }else assert.equal(message,'',label);
      return stdout;
    }
    const probe=join(dir,'guard-probe.mjs');
    await writeFile(probe,`
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
assert.equal(process.env.PATH,'');
assert.throws(()=>process.env.KASI_KEY,/OFFLINE_KEY_ACCESS_DENIED/);
assert.throws(()=>fetch('http://127.0.0.1:1'),/OFFLINE_NETWORK_DENIED/);
assert.throws(()=>readFile(${JSON.stringify(join(repo,'package.json'))}),/E3_SOURCE_READ_DENIED/);
await assert.rejects(import('node:child_process'),/OFFLINE_NETWORK_OR_PROCESS_IMPORT_DENIED/);
await assert.rejects(import(${JSON.stringify(pathToFileURL(join(repo,'scripts/engine/e3.mjs')).href)}),/OFFLINE_DEVELOPER_PATH_DENIED/);
`,{flag:'wx'});
    await run('GUARDS',probe,[]);
    const restore=await run('RESTORE',join(delivery,engineName),['restore','--manifest-sha',pin,'--out',engine,'--data-pack',received,'--data-out',data],{restore:true});
    assert.equal(JSON.parse(restore).dataPackRestored,true);
    const bootstrap=join(engine,engineName),samplePath=join(engine,requestPath);
    const requestArgs=(input,pack=data)=>['run','--manifest-sha',pin,'--data-pack',pack,'--request',input];
    const examples=join(dir,'requests'),results=join(dir,'results');
    await mkdir(examples);await mkdir(results);
    const sample=JSON.parse(await readFile(samplePath,'utf8'));
    const stdout=await run('BUNDLED_EXAMPLE',bootstrap,requestArgs(samplePath));
    const bundled=JSON.parse(stdout);
    verifyParents(bundled,1,'CALCULATED_UNDER_SELECTED_POLICIES');
    await writeFile(join(results,'BUNDLED_EXAMPLE.json'),stdout,{flag:'wx'});
    receipt.bundledExampleSha256=digest(stdout);
    const issuerProbe=join(dir,'reject-unissued-evidence.mjs');
    await writeFile(issuerProbe,`
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {evaluatePatternRulesV1,PATTERN_RULES_POLICY_ID,PATTERN_RULES_VERSION} from './engine/dist/e3/patternRulesV1.js';
const {e2}=JSON.parse(await readFile(new URL('./results/BUNDLED_EXAMPLE.json',import.meta.url),'utf8'));
const analysis=e2.existing.analysisData;
const inner=analysis.base?.innerPatterns??analysis.innerPatterns;
const upstream=analysis.base?.existing??analysis;
const options={policyId:PATTERN_RULES_POLICY_ID,policyVersion:PATTERN_RULES_VERSION};
assert.throws(()=>evaluatePatternRulesV1(inner,upstream.evidence,upstream.facts,0,options),/ISSUED|EVIDENCE|CONTEXT/);
inner.candidates[0].candidateRef='chart.candidates[987]';
assert.throws(()=>evaluatePatternRulesV1(inner,upstream.evidence,upstream.facts,0,options),/ISSUED|EVIDENCE|CONTEXT/);
`,{flag:'wx'});
    await run('UNISSUED_EVIDENCE_REJECTED',issuerProbe,[]);

    const old=join(examples,'E2_EXAMPLE.json');
    await save(old,{schemaVersion:'manseryeok-engine-e2-request-v1',selection:sample.selection.e2,birth:sample.birth});
    const oldStdout=await run('UNCHANGED_E2',join(engine,'e2',engineName),['run','--manifest-sha',manifest.e2ManifestSha256,'--data-pack',data,'--request',old]);
    assert.deepEqual(bundled.e2,JSON.parse(oldStdout));
    receipt.nestedE2EqualsStandaloneE2=true;

    let leapSemantic=null;
    const cases=fixtureIds.map(id=>{
      const fixture=E2_OFFLINE_CASES.find(entry=>entry.id===id);
      assert.ok(fixture,id);
      return fixture;
    });
    for(const {id,birth,expected} of cases){
      const request=join(examples,id+'.json');
      await save(request,{...sample,birth});
      const bytes=await run(id,bootstrap,requestArgs(request),{code:expected.natalParents?0:2});
      const result=JSON.parse(bytes);
      verifyParents(result,expected.natalParents,expected.status);
      if(expected.pillars)assert.deepEqual(result.e2.candidates.map(c=>c.features.chart.result.pillars.map(p=>p.stem+p.branch)),expected.pillars,id);
      if(expected.seasonalAlternativesPerParent){
        const seasonal=result.e2.existing.analysisData.base.existing.seasonal.candidates;
        assert.deepEqual(seasonal.map(s=>s.judgment.alternatives.length),expected.seasonalAlternativesPerParent);
      }
      if(id==='LICHUN_CORRELATED_NATAL_PARENTS'){
        const seoul=await run(id,bootstrap,requestArgs(request),{tz:'Asia/Seoul'});
        assert.equal(digest(seoul),digest(bytes));receipt.timezoneSha256=digest(seoul);
      }
      if(id.startsWith('LEAP_')){
        const e2=result.e2.candidates[0].features, e3=result.candidates[0].features.patternRules.result;
        const comparable=JSON.stringify([e2.chart.result.pillars,e2.pattern.result.selection,
          e2.strength.result.grade,e2.eokbu.result.status,e3]);
        if(id==='LEAP_GREGORIAN')leapSemantic=digest(comparable);
        else{assert.equal(digest(comparable),leapSemantic);receipt.leapSemanticSha256=leapSemantic;}
      }
      receipt.cases.push({id,status:result.status,candidateRefs:result.candidates.map(c=>c.candidateRef),sha256:digest(bytes)});
      await writeFile(join(results,id+'.json'),bytes,{flag:'wx'});
    }
    const noE1=structuredClone(sample);
    delete noE1.selection.e2.e1;
    const noE1Path=join(examples,'WITHOUT_E1.json');
    await save(noE1Path,noE1);
    const without=JSON.parse(await run('EXPLICIT_NO_E1',bootstrap,requestArgs(noE1Path)));
    verifyParents(without,1,bundled.status);
    assert.equal(without.e2.candidates[0].features.strength.availability,'NOT_SELECTED');
    await save(join(results,'WITHOUT_E1.json'),without);
    for(const [id,mutate] of [
      ['UNKNOWN_E3_POLICY',request=>request.selection.patternRulePolicyId='E3-UNREGISTERED'],
      ['STALE_E3_VERSION',request=>request.selection.version='0.0.1'],
      ['WRONG_E2_POLICY',request=>request.selection.e2.profileId='E2-UNREGISTERED'],
      ['CANDIDATE_INJECTION',request=>request.candidateRef='chart.candidates[1]'],
    ]){
      const request=structuredClone(sample),path=join(examples,id+'.json');
      mutate(request);
      await save(path,request);
      await run(id,bootstrap,requestArgs(path),{code:1,errors:['E3_INPUT_POLICY_OR_DATA_REJECTED','E3_REQUEST_SCHEMA',
        'EXPLICIT_E3_POLICY_BUNDLE_REQUIRED','EXPLICIT_E2_POLICY_BUNDLE_REQUIRED']});
    }
    const scratch=join(dir,'tamper-pack');
    await cp(data,scratch,{recursive:true});
    const notice=join(scratch,'NOTICE.txt'),original=await readFile(notice);
    await appendFile(notice,'x');
    await run('DATA_BYTES_CHANGED',bootstrap,requestArgs(samplePath,scratch),{code:1,errors:['API_ONLY_FILE_CHANGED']});
    await unlink(notice);
    await run('DATA_MISSING',bootstrap,requestArgs(samplePath,scratch),{code:1,errors:['API_ONLY_FILE_SET']});
    await writeFile(notice,original,{flag:'wx'});
    await save(join(scratch,'extra.json'),{});
    await run('DATA_FOREIGN_FILE',bootstrap,requestArgs(samplePath,scratch),{code:1,errors:['API_ONLY_FILE_SET']});
    const bad=join(dir,'tamper-engine');
    await cp(engine,bad,{recursive:true});
    const module=join(bad,'scripts/engine/e3.mjs');
    await appendFile(module,"\nthrow Error('mutation must never execute');\n");
    await run('MODULE_TAMPER',join(bad,engineName),requestArgs(samplePath),{code:1,errors:['E1_ARTIFACT_FILE_SET_OR_BYTES_CHANGED']});
    await appendFile(join(bad,manifestName),' ');
    await run('MANIFEST_TAMPER',join(bad,engineName),requestArgs(samplePath),{code:1,errors:['E3_MANIFEST_PIN_MISMATCH']});
    await verifyE3Package(engine,pin);
    assert.deepEqual(await hashFiles(data,await filesBelow(data)),await hashFiles(dataPack,await filesBelow(dataPack)));
    receipt.restoredDataBytesEqual=true;
    receipt.boundary='Empty PATH, no key environment, denied developer source reads/imports and Node network/process imports. No operating-system packet capture.';
    receipt.status='PASS';
    await save(join(dir,'receipt.json'),receipt);
    return receipt;
  }catch(error){
    receipt.status='FAIL';receipt.reason=String(error.message).slice(0,600);
    await save(join(dir,'failure.json'),receipt);
    throw error;
  }
}

if(process.argv[1]&&import.meta.url===pathToFileURL(resolve(process.argv[1])).href){
  try{
    const options=parsePairs(process.argv.slice(2),['--artifact','--manifest-sha','--data-pack','--out','--pilot']);
    for(const key of ['--artifact','--manifest-sha','--data-pack','--out'])assert.ok(options[key],key+' required');
    assert.ok(!options['--pilot']||options['--pilot']==='true');
    const result=await verifyDetachedE3({artifact:resolve(options['--artifact']),pin:options['--manifest-sha'],
      dataPack:resolve(options['--data-pack']),out:resolve(options['--out']),pilot:options['--pilot']==='true'});
    process.stdout.write(JSON.stringify({status:result.status,files:result.files,cases:result.cases.length,
      processes:result.processes.length,sourceRevision:result.sourceRevision})+'\n');
  }catch(error){process.stderr.write(String(error.message).slice(0,600)+'\n');process.exitCode=1;}
}
