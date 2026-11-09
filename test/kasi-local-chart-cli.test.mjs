// CLI-only synthetic records. No existing calendar fixtures or private KASI files.
import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, writeFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { spawnSync } from 'node:child_process';
import { syntheticLocalChartCandidate, writeSyntheticLocalChartCandidate } from './fixtures/kasi-local-chart-synthetic.mjs';

const repo=resolve(import.meta.dirname,'..');
const cli=join(repo,'scripts/kasi/local-chart.mjs');
const policy='KR_API_PUBLISHED_KST_MODERN_1988_POST_DST_V1';

async function setup(action) {
  const directory=await mkdtemp(join(tmpdir(),'kasi-local-cli-private-'));
  try {
    const candidate=join(directory,'SYNTHETIC_PRIVATE_CANDIDATE_PATH');
    const fixture=syntheticLocalChartCandidate();
    // Hold the generated synthetic pin before serializing its independent input files.
    const pin=fixture.expectedManifestSha256;
    await writeSyntheticLocalChartCandidate(candidate,fixture);
    const loader=join(directory,'deny-fallback-loader.mjs'), blocker=join(directory,'deny-network-and-fallback.mjs');
    // node:module register from --import is supported in Node22:
    // https://nodejs.org/download/release/v22.15.0/docs/api/module.html#moduleregisterspecifier-parenturl-options
    await writeFile(loader,`
      const forbidden=new Set(['koreaSolarTermFixtures.js','koreanLunisolarFixtures.js','research.mjs','collector.js']);
      const denied=value=>forbidden.has(decodeURIComponent(value).replaceAll(String.fromCharCode(92),'/').split('/').at(-1).split('?')[0].split('#')[0]);
      export async function resolve(specifier,context,nextResolve){
        if(denied(specifier))throw Error('FORBIDDEN_FIXTURE_OR_ACQUISITION_IMPORT');
        const result=await nextResolve(specifier,context);
        if(denied(result.url))throw Error('FORBIDDEN_FIXTURE_OR_ACQUISITION_IMPORT');
        return result;
      }
    `);
    await writeFile(blocker,`
      import net from 'node:net';
      import {register} from 'node:module';
      net.Socket.prototype.connect=function(){throw Error('NETWORK_FORBIDDEN')};
      globalThis.fetch=function(){throw Error('NETWORK_FORBIDDEN')};
      register(new URL('./deny-fallback-loader.mjs',import.meta.url));
    `);
    const environment={...process.env};
    for(const name of Object.keys(environment)) if(/KASI|API_KEY/i.test(name)) delete environment[name];
    delete environment.NODE_OPTIONS;
    const run=(args,{tz='UTC',entry=cli,extra=[]}={})=>spawnSync(process.execPath,['--import',pathToFileURL(blocker).href,...extra,entry,...args],{cwd:repo,env:{...environment,TZ:tz},encoding:'utf8',timeout:20000,maxBuffer:2_000_000});
    const common=['--profile','kasi-api-2026-local-v1','--candidate',candidate,'--manifest-sha',pin,'--calendar','GREGORIAN','--date','2026-02-05','--time','01:20','--clock-policy',policy,'--day-rollover','CIVIL_MIDNIGHT','--hour-stem-reference','SELECTED_DAY_PILLAR'];
    const lunar=fixture.loaded.candidate.dates.find(r=>r.solarDate==='2026-02-05');
    await action({directory,candidate,fixture,pin,run,common,lunar});
  } finally {
    await rm(directory,{recursive:true,force:true});
  }
}
function replace(args,name,value) {const result=[...args],index=result.indexOf(name);assert.notEqual(index,-1);result[index+1]=value;return result;}
function without(args,name) {const result=[...args],index=result.indexOf(name);assert.notEqual(index,-1);result.splice(index,2);return result;}
function parsedSuccess(result) {
  assert.equal(result.status,0,result.stderr || result.stdout);
  assert.equal(result.stderr,'');
  const value=JSON.parse(result.stdout);
  assert.equal(value.status,'OK');
  assert.equal(value.profile.id,'kasi-api-2026-local-v1');
  return value;
}
function rejected(result,{directory,forbidden=[]}) {
  assert.equal(result.status,1,result.stderr || result.stdout);
  assert.equal(result.stderr,'');
  const value=JSON.parse(result.stdout);
  assert.deepEqual(Object.keys(value).sort(),['code','status']);
  assert.equal(value.status,'REJECTED');
  assert.equal(typeof value.code,'string');
  for(const token of [directory,'SYNTHETIC_PRIVATE_CANDIDATE_PATH','2026-02-05','01:20',...forbidden]) assert.ok(!result.stdout.includes(token),'error must not echo synthetic path or input: '+token);
}

test('actual CLI uses pinned synthetic API data with network and legacy fixture/acquisition imports blocked',async()=>setup(async context=>{
  const {run,common,pin,candidate,lunar}=context;
  const gregorian=parsedSuccess(run(common));
  assert.equal(gregorian.dataset.candidateManifestContentSha256,pin);
  assert.equal(gregorian.chart.confidence,'PUBLISHED_MINUTE_AMBIGUOUS');
  assert.equal(gregorian.chart.candidates.length,2);
  assert.equal(gregorian.input.gregorianDate,'2026-02-05');
  assert.equal(gregorian.input.time,'01:20');
  assert.equal(gregorian.evidence.dateConversion.calendarGanjiUsedAsPillars,false);
  assert.ok(gregorian.evidence.appliedJie.every(e=>e.source.serviceId==='15012690'));
  const lunarArgs=[...without(without(common,'--date'),'--calendar'),'--calendar','KOREAN_LUNAR','--lunar-year',String(lunar.lunarYear),'--lunar-month',String(lunar.lunarMonth),'--lunar-day',String(lunar.lunarDay),'--leap',String(lunar.leap)];
  const fromLunar=parsedSuccess(run(lunarArgs));
  assert.deepEqual(fromLunar.chart,gregorian.chart);
  assert.deepEqual(fromLunar.policies,gregorian.policies);
  assert.equal(fromLunar.input.gregorianDate,gregorian.input.gregorianDate);
  assert.equal(fromLunar.evidence.dateConversion.sourceRef,gregorian.evidence.dateConversion.sourceRef);
  assert.equal(fromLunar.evidence.dateConversion.source.operation,'getLunCalInfo');
  assert.ok(!JSON.stringify(gregorian).includes(candidate));
  // Prove that the --import registration is active, rather than relying on a loader file's presence.
  const probe=join(context.directory,'forbidden-import-probe.mjs');
  await writeFile(probe,`import ${JSON.stringify(pathToFileURL(join(repo,'dist/calendar/koreaSolarTermFixtures.js')).href)};`);
  const blocked=run([],{entry:probe});
  assert.equal(blocked.status,1);assert.match(blocked.stderr,/FORBIDDEN_FIXTURE_OR_ACQUISITION_IMPORT/);
  const networkProbe=join(context.directory,'forbidden-network-probe.mjs');
  await writeFile(networkProbe,`import net from 'node:net';let blocked=0;for(const attempt of [()=>new net.Socket().connect({host:'127.0.0.1',port:9}),()=>globalThis.fetch('https://example.invalid')]){try{attempt();}catch(error){if(error.message==='NETWORK_FORBIDDEN')blocked++;else throw error;}}console.log('BLOCKED_NETWORK:'+blocked);`);
  const network=run([],{entry:networkProbe});
  assert.equal(network.status,0,network.stderr);assert.equal(network.stderr,'');assert.equal(network.stdout,'BLOCKED_NETWORK:2\n');
}));

test('actual CLI JSON is identical in UTC and Asia/Seoul for both explicit calendar input paths',async()=>setup(async({run,common,lunar})=>{
  const lunarArgs=[...without(without(common,'--date'),'--calendar'),'--calendar','KOREAN_LUNAR','--lunar-year',String(lunar.lunarYear),'--lunar-month',String(lunar.lunarMonth),'--lunar-day',String(lunar.lunarDay),'--leap',String(lunar.leap)];
  for(const args of [common,lunarArgs]) {
    const utc=run(args,{tz:'UTC'}),seoul=run(args,{tz:'Asia/Seoul'});
    parsedSuccess(utc);parsedSuccess(seoul);
    assert.equal(utc.stdout,seoul.stdout);
  }
}));

test('actual CLI fails closed for omitted/duplicate arguments, bad pin/policy/leap, missing candidates and invalid dates without echoing inputs',async()=>setup(async context=>{
  const {run,common,directory}=context;
  for(const name of ['--profile','--time','--clock-policy','--day-rollover','--hour-stem-reference','--manifest-sha']) rejected(run(without(common,name)),context);
  rejected(run([...common,'--time','02:20']),context);
  rejected(run(replace(common,'--manifest-sha','0'.repeat(64))),context);
  const badPolicy='SYNTHETIC_INVALID_POLICY_DO_NOT_ECHO';
  rejected(run(replace(common,'--clock-policy',badPolicy)),{...context,forbidden:[badPolicy]});
  const badDate='SYNTHETIC_INVALID_BIRTH_DATE_DO_NOT_ECHO';
  rejected(run(replace(common,'--date',badDate)),{...context,forbidden:[badDate]});
  const missing=join(directory,'MISSING_CANDIDATE_DO_NOT_ECHO');
  rejected(run(replace(common,'--candidate',missing)),{...context,forbidden:[missing,'MISSING_CANDIDATE_DO_NOT_ECHO']});
  const lunarArgs=[...without(without(common,'--date'),'--calendar'),'--calendar','KOREAN_LUNAR','--lunar-year','2026','--lunar-month','1','--lunar-day','1','--leap','1'];
  rejected(run(lunarArgs),context);
  const result=run(replace(common,'--date','2025-12-31'));
  assert.equal(result.status,2,result.stderr || result.stdout);assert.equal(result.stderr,'');
  const value=JSON.parse(result.stdout);assert.equal(value.status,'OUT_OF_PROFILE_COVERAGE');
  assert.ok(!result.stdout.includes(directory));assert.ok(!result.stdout.includes('2025-12-31'));
}));
