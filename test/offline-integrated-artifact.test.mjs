// Synthetic public acceptance. The real accepted data pin is never bypassed.
import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp,rm,readFile,writeFile} from 'node:fs/promises';
import {join,resolve,relative,isAbsolute,sep,basename} from 'node:path';
import {tmpdir} from 'node:os';
import {pathToFileURL} from 'node:url';
import {spawnSync} from 'node:child_process';
import {buildIntegratedArtifact} from '../scripts/offline/build-v2.mjs';
import {verifyIntegratedArtifact} from '../scripts/offline/integrity-v2.mjs';
import {restoreIntegratedArtifact} from '../scripts/offline/restore-v2.mjs';
import {verifyArtifact,filesBelow,digest} from '../scripts/offline/integrity.mjs';
import {writeOfflineGuards,cleanOfflineEnvironment} from '../scripts/offline/guards.mjs';
import {syntheticLocalChartCandidate,writeSyntheticLocalChartCandidate} from './fixtures/kasi-local-chart-synthetic.mjs';
import * as originalSchema from '../.kasi-build/schema.js';
const repo=resolve(import.meta.dirname,'..'),productId='KASI-LOCAL-PRODUCT-ANALYSIS-V01',m5Id='M5-WINTER-WOOD-WARMING-CANDIDATE-V01';
const base=(directory,pin)=>['--profile','kasi-api-2026-local-v1','--candidate',directory,'--manifest-sha',pin,'--calendar','GREGORIAN','--date','2026-06-01','--time','12:00','--clock-policy','KR_API_PUBLISHED_KST_MODERN_1988_POST_DST_V1','--day-rollover','CIVIL_MIDNIGHT','--hour-stem-reference','SELECTED_DAY_PILLAR'];

test('integrated artifact restores and runs new reports with local vendor code, no install, keys or original imports',async t=>{
  const directory=await mkdtemp(join(tmpdir(),'manseryeok-offline-integrated-public-'));
  try{
    const engine=join(directory,'engine with spaces'),second=join(directory,'same engine'),restored=join(directory,'restored elsewhere'),candidate=join(directory,'synthetic data');
    const manifest=await buildIntegratedArtifact({outDir:engine});await buildIntegratedArtifact({outDir:second});
    const fixture=syntheticLocalChartCandidate();await writeSyntheticLocalChartCandidate(candidate,fixture);
    const {preload}=await writeOfflineGuards(directory,{forbiddenRoot:repo});
    const run=(entry,args=[],tz='UTC')=>spawnSync(process.execPath,['--import',pathToFileURL(preload).href,entry,...args],{cwd:directory,env:cleanOfflineEnvironment(tz),encoding:'utf8',timeout:30000,maxBuffer:12_000_000});
    const success=result=>{assert.equal(result.status,0,result.stderr);assert.equal(result.stderr,'');return result.stdout;};
    const reportArgs=[...base(candidate,fixture.expectedManifestSha256),'--report-profile',productId,'--m5-policy',m5Id];
    let json;
    await t.test('fresh compilation and payload manifest reproduce with all pinned notices and no acquisition modules',async()=>{
      assert.equal(await readFile(join(engine,'artifact-manifest.json'),'utf8'),await readFile(join(second,'artifact-manifest.json'),'utf8'));
      assert.equal((await verifyIntegratedArtifact(engine)).runtime.externalDependencies,0);
      assert.equal(manifest.runtime.npmInstallRequired,false);assert.equal(manifest.runtime.gitRequired,false);assert.equal(manifest.runtime.bundledVendorBundles,1);
      assert.equal(manifest.vendor.packages.length,8);assert.equal(manifest.vendor.bundle.embeddedComponentVersions,'NOT_INDEPENDENTLY_VERIFIED');
      assert.equal(manifest.vendor.packageInventoryMeaning,'LOCKED_INSTALLED_DECLARED_DEPENDENCY_NOTICES_NOT_EMBEDDED_BUNDLE_VERSION_ATTESTATION');
      const names=await filesBelow(engine);assert.ok(names.includes('scripts/kasi/local-product-report.mjs'));assert.ok(names.includes('vendor/fast-xml-parser.cjs'));
      assert.ok(names.every(name=>!/(?:node_modules|\.private|Fixtures|collector\.js|network\.js|client\.js|candidate\.json)/.test(name)));
      for(const path of names){const source=await readFile(join(engine,path),'utf8');assert.ok(!source.includes(repo));assert.ok(!source.includes('C:\\Users\\Home'));}
      await assert.rejects(verifyArtifact(engine),/ARTIFACT_CONTRACT/,'v1 verifier must not silently accept a v2 format');
    });
    await t.test('full schema normalization remains equivalent after its local XML import relink',async()=>{
      const linked=await import(pathToFileURL(join(engine,'.kasi-build/schema.js')).href);
      assert.deepEqual(linked.SERVICES,originalSchema.SERVICES);
      const xml='<response><header><resultCode>00</resultCode><resultMsg>NORMAL SERVICE.</resultMsg></header><body><items><item><dateName>입춘</dateName><locdate>20260204</locdate><kst>0502</kst><seq>1</seq></item></items><numOfRows>100</numOfRows><pageNo>1</pageNo><totalCount>1</totalCount></body></response>';
      const parsed=linked.parsePage(xml);assert.deepEqual(parsed,originalSchema.parsePage(xml));assert.deepEqual(linked.normalizeSolar(parsed.items[0],2026),originalSchema.normalizeSolar(parsed.items[0],2026));
      for(const value of [null,{가:[1,2],a:'x'},[3,2,1]])assert.equal(linked.fingerprint(value),originalSchema.fingerprint(value));
      assert.equal(digest(await readFile(join(engine,'.kasi-build/schema.js'))),manifest.schemaRelink.outputSha256);
    });
    await t.test('summary and detailed reports use identical structured analysis and keep timezone output stable',async()=>{
      const entry=join(engine,'scripts/kasi/local-product-report.mjs');
      const summaryJson=success(run(entry,[...reportArgs,'--detail','summary','--output','json']));
      assert.equal(summaryJson,success(run(entry,[...reportArgs,'--detail','detailed','--output','json'])));
      assert.equal(summaryJson,success(run(entry,[...reportArgs,'--detail','summary','--output','json'],'Asia/Seoul')));
      json=JSON.parse(summaryJson);assert.equal(json.schemaVersion,'kasi-local-product-analysis-v1');assert.equal(json.status,'PRODUCT_ANALYSIS_ONLY');
      const summary=success(run(entry,[...reportArgs,'--detail','summary','--output','text'])),detailed=success(run(entry,[...reportArgs,'--detail','detailed','--output','text']));
      assert.ok(summary.length<detailed.length);assert.ok(summary.includes('공망'));assert.ok(summary.includes('후보'));assert.ok(detailed.includes('manifest')||detailed.includes('데이터'));
      assert.equal(summary,success(run(entry,[...reportArgs,'--detail','summary','--output','text'],'Asia/Seoul')));
    });
    await t.test('explicit M7 and monthly flags work inside the detached product module graph',async()=>{
      const args=[...reportArgs,'--luck-profile','M7-TRADITIONAL-YEAR-STEM-JIE-3D-V01','--dayun','true','--traditional-sex','MALE','--dayun-count','3','--seyun-year','2026','--monthly-year','2026','--monthly-query-minute','2026-06-01T12:00','--monthly-policy','M7-MONTHLY-TWELVE-JIE-PUBLISHED-MINUTE-V01','--detail','summary','--output','json'];
      const value=JSON.parse(success(run(join(engine,'scripts/kasi/local-product-report.mjs'),args)));
      assert.equal(value.status,'PRODUCT_ANALYSIS_ONLY');assert.ok(value.monthly);assert.ok(value.base.m7);
      assert.equal(value.base.executionCounts.birthM1Calls,1);assert.equal(value.base.executionCounts.m7BirthM1Recalculations,0);
    });
    await t.test('restored code remains runnable without the source tree and v2 verify is active',async()=>{
      assert.deepEqual(await restoreIntegratedArtifact({artifactDirectory:engine,outDir:restored}),manifest);
      const result=JSON.parse(success(run(join(restored,'scripts/kasi/local-product-report.mjs'),[...reportArgs,'--detail','summary','--output','json'])));assert.deepEqual(result,json);
      assert.equal(JSON.parse(success(run(join(restored,'verify.mjs'),['--artifact',restored]))).schemaVersion,'manseryeok-offline-integrated-engine-v2');
      assert.equal(JSON.parse(success(run(join(restored,'scripts/kasi/local-chart.mjs'),base(candidate,fixture.expectedManifestSha256)))).status,'OK');
    });
    await t.test('content, license, overlapping paths and absent accepted data fail closed',async()=>{
      await assert.rejects(restoreIntegratedArtifact({artifactDirectory:engine,outDir:join(engine,'nested')}),/RESTORE_SOURCE_TARGET_OVERLAP/);
      const license=manifest.vendor.packages[0].licensePath;await writeFile(join(second,license),'changed');await assert.rejects(verifyIntegratedArtifact(second),/CONTENT_CHANGED/);
      const withoutData=reportArgs.filter((v,i,a)=>![a.indexOf('--candidate'),a.indexOf('--candidate')+1,a.indexOf('--manifest-sha'),a.indexOf('--manifest-sha')+1].includes(i));withoutData[withoutData.indexOf('--profile')+1]='kasi-api-1989-2026-local-v1';
      const failed=run(join(engine,'run.mjs'),['--mode','product','--attachment',candidate,...withoutData,'--detail','summary','--output','json']);assert.equal(failed.status,1);assert.equal(failed.stdout,'');assert.deepEqual(JSON.parse(failed.stderr),{status:'REJECTED',phase:'DATA',code:'OFFLINE_DATA_REJECTED'});
      const bad=run(join(engine,'run.mjs'),['--mode','product','--attachment',candidate,...withoutData,'--detail','summary','--output','json','--manifest-sha',fixture.expectedManifestSha256]);assert.equal(bad.status,1);assert.equal(bad.stdout,'');assert.deepEqual(JSON.parse(bad.stderr),{status:'REJECTED',phase:'INPUT',code:'OFFLINE_INPUT_REJECTED'});
    });
  }finally{const target=resolve(directory),rel=relative(resolve(tmpdir()),target);assert.ok(rel&&!isAbsolute(rel)&&rel!=='..'&&!rel.startsWith('..'+sep)&&basename(target).startsWith('manseryeok-offline-integrated-public-'));await rm(target,{recursive:true,force:true});}
});
