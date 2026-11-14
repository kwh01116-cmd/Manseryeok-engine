// Public synthetic integration only; no private data or acquisition calls.
import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp,rm,readFile,writeFile,mkdir} from 'node:fs/promises';
import {join,resolve,relative,isAbsolute,sep,basename} from 'node:path';
import {tmpdir} from 'node:os';
import {pathToFileURL} from 'node:url';
import {spawnSync} from 'node:child_process';
import {buildArtifact} from '../scripts/offline/build.mjs';
import {verifyArtifact,filesBelow,digest,createNewDirectory,verifyAttachment,hashFiles,DATA_FILES,BASELINE_PIN} from '../scripts/offline/integrity.mjs';
import {restoreArtifact} from '../scripts/offline/restore.mjs';
import {attachPrivateData} from '../scripts/offline/attach.mjs';
import {writeOfflineGuards,cleanOfflineEnvironment} from '../scripts/offline/guards.mjs';
import {syntheticLocalChartCandidate,writeSyntheticLocalChartCandidate} from './fixtures/kasi-local-chart-synthetic.mjs';
import * as originalSchema from '../.kasi-build/schema.js';

const repo=resolve(import.meta.dirname,'..');
const common=(directory,pin)=>['--profile','kasi-api-2026-local-v1','--candidate',directory,'--manifest-sha',pin,'--calendar','GREGORIAN','--date','2026-02-05','--time','01:20','--clock-policy','KR_API_PUBLISHED_KST_MODERN_1988_POST_DST_V1','--day-rollover','CIVIL_MIDNIGHT','--hour-stem-reference','SELECTED_DAY_PILLAR'];

test('offline artifact is reproducible, detached, read-only and restores without dependencies or private data',async t=>{
  const directory=await mkdtemp(join(tmpdir(),'manseryeok-offline-public-'));
  try{
    const engine=join(directory,'engine with spaces'),second=join(directory,'same engine'),restored=join(directory,'restored elsewhere');
    const manifest=await buildArtifact({outDir:engine});await buildArtifact({outDir:second});
    const candidate=join(directory,'synthetic data'),fixture=syntheticLocalChartCandidate();await writeSyntheticLocalChartCandidate(candidate,fixture);
    const {preload}=await writeOfflineGuards(directory,{forbiddenRoot:repo});
    const run=(entry,args=[],tz='UTC')=>spawnSync(process.execPath,['--import',pathToFileURL(preload).href,entry,...args],{cwd:directory,env:cleanOfflineEnvironment(tz),encoding:'utf8',timeout:30000,maxBuffer:5_000_000});
    const success=result=>{assert.equal(result.status,0,result.stderr);assert.equal(result.stderr,'');return result.stdout;};
    const rejected=result=>{assert.equal(result.status,1,result.stderr||result.stdout);for(const value of [repo,candidate,'2026-02-05','01:20'])assert.ok(!(result.stdout+result.stderr).includes(value));};
    await t.test('content manifest reproduces byte for byte and selected schema exports are exact',async()=>{
      assert.equal(await readFile(join(engine,'artifact-manifest.json'),'utf8'),await readFile(join(second,'artifact-manifest.json'),'utf8'));
      assert.equal((await verifyArtifact(engine)).runtime.externalDependencies,0);
      assert.equal(manifest.compilation.method,'PINNED_TYPESCRIPT_FRESH_IN_MEMORY_EMIT');assert.equal(manifest.compilation.diagnostics,0);assert.ok(manifest.compilation.inputs.some(f=>f.path==='src/calendar/fourPillars.ts'));
      const names=await filesBelow(engine);assert.ok(names.includes('docs/contracts/offline-support-v1.json'));
      assert.ok(names.every(name=>!/(?:node_modules|\.private|Fixtures|collector|candidate\.json)/.test(name)));
      for(const name of names){const bytes=await readFile(join(engine,name),'utf8');assert.ok(!bytes.includes(repo));assert.ok(!bytes.includes('C:\\Users\\Home'));}
      const extracted=await import(pathToFileURL(join(engine,'.kasi-build/schema.js')).href);
      assert.deepEqual(extracted.SERVICES,originalSchema.SERVICES);
      for(const value of [null,true,13,'한글',{z:[{b:2,a:1},null],a:'a'},[3,2,1]]){
        assert.equal(extracted.canonical(value),originalSchema.canonical(value));assert.equal(extracted.fingerprint(value),originalSchema.fingerprint(value));
      }
      assert.equal(extracted.sha(Buffer.from([0,1,255])),originalSchema.sha(Buffer.from([0,1,255])));
      assert.equal(digest(await readFile(join(engine,'.kasi-build/schema.js'))),manifest.schemaExtraction.outputSha256);
    });
    await t.test('new-directory guards and integrity reject overwrites, traversal and added files',async()=>{
      await assert.rejects(createNewDirectory(engine),/DESTINATION_ALREADY_EXISTS/);
      await assert.rejects(buildArtifact({outDir:join(directory,'wrong-revision'),sourceRevision:'0'.repeat(40)}),/EXPECTED_SOURCE_REVISION_MISMATCH/);
      await assert.rejects(createNewDirectory(join(directory,'public-data'),{privateOnly:true}),/PRIVATE_DESTINATION_REQUIRED/);
      await assert.rejects(restoreArtifact({artifactDirectory:engine,outDir:join(engine,'nested-restore')}),/RESTORE_SOURCE_TARGET_OVERLAP/);await verifyArtifact(engine);
      await assert.rejects(restoreArtifact({artifactDirectory:engine,outDir:join(directory,'other'),attachmentDirectory:candidate,privateDataOut:join(directory,'other','.private','data')}),/RESTORE_TARGET_OVERLAP/);
      await writeFile(join(second,'unexpected.txt'),'unexpected');await assert.rejects(verifyArtifact(second),/FILE_SET_CHANGED/);
      await rm(join(second,'unexpected.txt'));const path=join(second,'run.mjs'),bytes=await readFile(path);await writeFile(path,'changed');await assert.rejects(verifyArtifact(second),/CONTENT_CHANGED/);await writeFile(path,bytes);
    });
    await t.test('guard instrumentation demonstrably blocks network, keys, writes, source-tree fallback and child processes',async()=>{
      const probe=join(directory,'guard-probe.mjs');
      await writeFile(probe,`import fs from 'node:fs/promises';let blocked=0;for(const call of [()=>globalThis.fetch('https://example.invalid'),()=>fs.writeFile('must-not-exist','x'),()=>process.env.KASI_SPCDE_API_KEY,()=>import('node:child_process'),()=>import(${JSON.stringify(pathToFileURL(join(repo,'dist/calendar/fourPillars.js')).href)})]){try{await call();}catch(e){if(/OFFLINE_/.test(e.message))blocked++;else throw e;}}console.log(blocked);`);
      assert.equal(success(run(probe)),'5\n');
    });
    await t.test('all existing packaged entry points execute JSON and TEXT in new cwd with no source imports',async()=>{
      const base=common(candidate,fixture.expectedManifestSha256),m2=['--m2-profile','m2-basic-classification-local-v1'];
      const chart=JSON.parse(success(run(join(engine,'scripts/kasi/local-chart.mjs'),base)));assert.equal(chart.chart.candidates.length,2);
      for(const [entry,extra]of [
        ['scripts/kasi/local-explain.mjs',m2],
        ['scripts/kasi/local-m3-evidence.mjs',[...m2,'--synthesis-profile','M3-LIMITED-ABSENT-ROOT-RESOURCE-SYNTHESIS-V01']],
        ['scripts/experimental/weighted-support.mjs',['--experimental-policy','EXPERIMENTAL-WEIGHTED-SUPPORT-LOCAL-NO-TRANSFORMATION-V01']],
      ]){
        const args=[...base,...extra,'--output','json'],json=success(run(join(engine,entry),args));assert.equal(json,success(run(join(engine,entry),args,'Asia/Seoul')));assert.ok(JSON.parse(json));
        const text=success(run(join(engine,entry),[...base,...extra,'--output','text']));assert.match(text,/후보 1/);assert.match(text,/후보 2/);
      }
      const restoredManifest=await restoreArtifact({artifactDirectory:engine,outDir:restored});assert.deepEqual(restoredManifest,manifest);
      assert.equal(success(run(join(restored,'scripts/kasi/local-chart.mjs'),base)),JSON.stringify(chart,null,2)+'\n');
      assert.equal(JSON.parse(success(run(join(restored,'verify.mjs'),['--artifact',restored]))).status,'VERIFIED');
    });
    await t.test('fixed-pin wrapper and private attachment fail closed for data-free, synthetic and malformed inputs',async()=>{
      for(const outDir of [candidate,join(candidate,'.private','child'),directory])await assert.rejects(attachPrivateData({candidateDirectory:candidate,outDir}),/ATTACHMENT_SOURCE_TARGET_OVERLAP/);
      await assert.rejects(attachPrivateData({candidateDirectory:candidate,outDir:join(directory,'.private','synthetic-rejected')}));
      await assert.rejects(verifyAttachment(candidate));
      await writeFile(join(candidate,'attachment.json'),JSON.stringify({schemaVersion:'manseryeok-private-offline-data-v1',expectedManifestSha256:BASELINE_PIN,profileId:'kasi-api-1989-2026-local-v1',rightsStatus:'RIGHTS_BLOCKED',distribution:'PRIVATE_NO_REDISTRIBUTION',optInRequired:true,files:await hashFiles(candidate,DATA_FILES)}));
      await assert.rejects(verifyAttachment(candidate),/MANIFEST_DIGEST_CHANGED/);
      const args=['--mode','chart','--attachment',candidate,'--output','json',...common(candidate,fixture.expectedManifestSha256).filter((v,i,a)=>![a.indexOf('--candidate'),a.indexOf('--candidate')+1,a.indexOf('--manifest-sha'),a.indexOf('--manifest-sha')+1].includes(i))];
      rejected(run(join(engine,'run.mjs'),args));
      rejected(run(join(engine,'run.mjs'),[...args,'--manifest-sha',fixture.expectedManifestSha256]));
      rejected(run(join(engine,'run.mjs'),args.filter((v,i)=>i!==1&&i!==0)));
      const bad=[...common(candidate,fixture.expectedManifestSha256)];bad[bad.indexOf('--date')+1]='2026-02-30';
      const failed=run(join(engine,'scripts/kasi/local-chart.mjs'),bad);assert.equal(failed.status,1);assert.equal(JSON.parse(failed.stdout).status,'REJECTED');
      bad[bad.indexOf('--date')+1]='2027-01-01';const out=run(join(engine,'scripts/kasi/local-chart.mjs'),bad);assert.equal(out.status,2);assert.equal(JSON.parse(out.stdout).status,'OUT_OF_PROFILE_COVERAGE');
    });
  }finally{
    const target=resolve(directory),rel=relative(resolve(tmpdir()),target);
    assert.ok(rel&&!isAbsolute(rel)&&rel!=='..'&&!rel.startsWith('..'+sep)&&basename(target).startsWith('manseryeok-offline-public-'),'cleanup target must be the task mkdtemp directory inside tmpdir');
    await rm(target,{recursive:true,force:true});
  }
});
