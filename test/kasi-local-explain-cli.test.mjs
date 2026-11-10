// Real subprocesses over generated synthetic data; no personal or private API records.
import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, writeFile, rm, readdir } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { spawnSync } from 'node:child_process';
import { syntheticLocalChartCandidate, writeSyntheticLocalChartCandidate } from './fixtures/kasi-local-chart-synthetic.mjs';

const repo=resolve(import.meta.dirname,'..'),cli=join(repo,'scripts/kasi/local-explain.mjs');
const bundle='m2-basic-classification-local-v1';
const replace=(args,name,value)=>{const a=[...args],i=a.indexOf(name);assert.notEqual(i,-1);a[i+1]=value;return a;};
const without=(args,name)=>{const a=[...args],i=a.indexOf(name);assert.notEqual(i,-1);a.splice(i,2);return a;};
async function setup(action) {
  const directory=await mkdtemp(join(tmpdir(),'kasi-explain-synthetic-'));
  try {
    const candidate=join(directory,'SYNTHETIC_PRIVATE_PATH'),fixture=syntheticLocalChartCandidate(),pin=fixture.expectedManifestSha256;
    await writeSyntheticLocalChartCandidate(candidate,fixture);
    const loader=join(directory,'deny-fallback-loader.mjs'),blocker=join(directory,'deny-network-and-fallback.mjs');
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
      import net from 'node:net';import {register} from 'node:module';
      net.Socket.prototype.connect=function(){throw Error('NETWORK_FORBIDDEN')};
      globalThis.fetch=function(){throw Error('NETWORK_FORBIDDEN')};
      register(new URL('./deny-fallback-loader.mjs',import.meta.url));
    `);
    const environment={...process.env};for(const name of Object.keys(environment))if(/KASI|API_KEY/i.test(name))delete environment[name];delete environment.NODE_OPTIONS;
    const run=(args,{tz='UTC',entry=cli}={})=>spawnSync(process.execPath,['--import',pathToFileURL(blocker).href,entry,...args],{cwd:repo,env:{...environment,TZ:tz},encoding:'utf8',timeout:30000,maxBuffer:5_000_000});
    const common=['--profile','kasi-api-2026-local-v1','--candidate',candidate,'--manifest-sha',pin,'--calendar','GREGORIAN','--date','2026-06-01','--time','12:00','--clock-policy','KR_API_PUBLISHED_KST_MODERN_1988_POST_DST_V1','--day-rollover','CIVIL_MIDNIGHT','--hour-stem-reference','SELECTED_DAY_PILLAR','--m2-profile',bundle,'--output','json'];
    const row=fixture.loaded.candidate.dates.find(r=>r.solarDate==='2026-06-01');
    const lunar=[...without(without(common,'--date'),'--calendar'),'--calendar','KOREAN_LUNAR','--lunar-year',String(row.lunarYear),'--lunar-month',String(row.lunarMonth),'--lunar-day',String(row.lunarDay),'--leap',String(row.leap)];
    await action({directory,candidate,fixture,pin,run,common,lunar});
  } finally {await rm(directory,{recursive:true,force:true});}
}
function success(result) {
  assert.equal(result.status,0,result.stderr||result.stdout);assert.equal(result.stderr,'');
  const value=JSON.parse(result.stdout);assert.equal(value.status,'OK');
  assert.equal(value.schemaVersion,'kasi-local-basic-explanation-v1');
  return value;
}
function rejection(result,context,expectedCode=1) {
  assert.equal(result.status,expectedCode,result.stderr||result.stdout);assert.equal(result.stdout,'');
  const error=JSON.parse(result.stderr);assert.equal(typeof error.code,'string');
  for(const token of [context.directory,'SYNTHETIC_PRIVATE_PATH','2026-06-01','12:00','INVALID_DO_NOT_ECHO'])assert.ok(!result.stderr.includes(token),'unsafe error echo:'+token);
}

test('explain CLI performs Gregorian and lunar M1→M2→Korean JSON offline with no fixture/acquisition fallback or file saving',async()=>setup(async context=>{
  const {run,common,lunar,pin,directory}=context,before=await readdir(directory),g=success(run(common)),l=success(run(lunar));
  assert.equal(g.m1.dataset.candidateManifestContentSha256,pin);
  assert.equal(l.m1.input.calendar,'KOREAN_LUNAR');assert.equal(g.m1.input.calendar,'GREGORIAN');
  assert.deepEqual(g.m1.chart,l.m1.chart);assert.deepEqual(g.facts.candidates,l.facts.candidates);assert.deepEqual(g.explanation,l.explanation);
  assert.equal(g.facts.candidates[0].dayMaster,'丙');assert.equal(g.explanation.candidates.length,1);
  assert.ok(g.explanation.candidates[0].items.some(item=>item.text.includes('丙')));
  assert.ok(!JSON.stringify(g).includes(context.candidate));
  assert.deepEqual(await readdir(directory),before);
  const probe=join(directory,'forbidden-import-probe.mjs');
  await writeFile(probe,`import ${JSON.stringify(pathToFileURL(join(repo,'dist/calendar/koreaSolarTermFixtures.js')).href)};`);
  const blocked=run([],{entry:probe});assert.equal(blocked.status,1);assert.match(blocked.stderr,/FORBIDDEN_FIXTURE_OR_ACQUISITION_IMPORT/);
  const networkProbe=join(directory,'network-probe.mjs');
  await writeFile(networkProbe,`import net from 'node:net';let blocked=0;for(const attempt of [()=>new net.Socket().connect({host:'127.0.0.1',port:9}),()=>globalThis.fetch('https://example.invalid')]){try{attempt();}catch(error){if(error.message==='NETWORK_FORBIDDEN')blocked++;else throw error;}}console.log('BLOCKED_NETWORK:'+blocked);`);
  const network=run([],{entry:networkProbe});assert.equal(network.status,0,network.stderr);assert.equal(network.stdout,'BLOCKED_NETWORK:2\n');
}));

test('explain CLI keeps both Lichun candidates in JSON and readable text, deterministic under UTC and Asia/Seoul',async()=>setup(async({run,common})=>{
  const boundary=replace(replace(common,'--date','2026-02-05'),'--time','01:20');
  const utc=run(boundary,{tz:'UTC'}),seoul=run(boundary,{tz:'Asia/Seoul'}),value=success(utc);success(seoul);
  assert.equal(utc.stdout,seoul.stdout);
  assert.equal(value.m1.chart.confidence,'PUBLISHED_MINUTE_AMBIGUOUS');
  assert.equal(value.m1.chart.candidates.length,2);assert.equal(value.facts.candidates.length,2);assert.equal(value.explanation.candidates.length,2);
  const text=run(replace(boundary,'--output','text'));
  assert.equal(text.status,0,text.stderr);assert.equal(text.stderr,'');
  assert.match(text.stdout,/명식 기초 분석\/설명/);assert.match(text.stdout,/후보 1/);assert.match(text.stdout,/후보 2/);
  assert.match(text.stdout,/乙巳/);assert.match(text.stdout,/丙午/);
  assert.match(text.stdout,/표시 분/);assert.ok(!text.stdout.startsWith('{'));
}));

test('explain CLI rejects missing policy/output/time, unknown/duplicate args, bad pin/candidate and range without printing birth data',async()=>setup(async context=>{
  const {run,common,directory}=context;
  for(const name of ['--profile','--manifest-sha','--time','--clock-policy','--day-rollover','--hour-stem-reference','--m2-profile','--output'])rejection(run(without(common,name)),context);
  for(const name of ['--m2-profile','--clock-policy','--profile','--output'])rejection(run(replace(common,name,'INVALID_DO_NOT_ECHO')),context);
  rejection(run([...common,'--m2-profile',bundle]),context);rejection(run([...common,'--unknown','value']),context);
  rejection(run(replace(common,'--manifest-sha','0'.repeat(64))),context);
  rejection(run(replace(common,'--candidate',join(directory,'MISSING_CANDIDATE'))),context);
  rejection(run(replace(common,'--date','2025-12-31')),context,2);
  rejection(run(replace(common,'--date','INVALID_DO_NOT_ECHO')),context);
}));
