// Actual Node subprocesses using generated candidates, never real API or personal birth records.
import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp,writeFile,rm,readdir} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join,resolve} from 'node:path';
import {pathToFileURL} from 'node:url';
import {spawnSync} from 'node:child_process';
import {syntheticLocalChartCandidate,writeSyntheticLocalChartCandidate} from './fixtures/kasi-local-chart-synthetic.mjs';

const repo=resolve(import.meta.dirname,'..'),cli=join(repo,'scripts/kasi/local-luck.mjs');
const luckPolicy='M7-TRADITIONAL-YEAR-STEM-JIE-3D-V01';
const glyph=p=>p.stem+p.branch;
const replace=(args,name,value)=>{const copy=[...args],i=copy.indexOf(name);assert.notEqual(i,-1);copy[i+1]=value;return copy;};
const without=(args,name)=>{const copy=[...args],i=copy.indexOf(name);assert.notEqual(i,-1);copy.splice(i,2);return copy;};
async function setup(action){
  const directory=await mkdtemp(join(tmpdir(),'kasi-m7-synthetic-'));
  try{
    const candidate=join(directory,'SYNTHETIC_PRIVATE_PATH'),fixture=syntheticLocalChartCandidate();
    const pin=fixture.expectedManifestSha256;
    await writeSyntheticLocalChartCandidate(candidate,fixture);
    const loader=join(directory,'deny-fallback-loader.mjs'),blocker=join(directory,'deny-network-clock-and-fallback.mjs');
    await writeFile(loader,`
      const forbidden=new Set(['koreaSolarTermFixtures.js','koreanLunisolarFixtures.js','trustedKoreanPreview.js','research.mjs','collector.js']);
      const denied=value=>forbidden.has(decodeURIComponent(value).replaceAll(String.fromCharCode(92),'/').split('/').at(-1).split('?')[0].split('#')[0]);
      export async function resolve(specifier,context,nextResolve){
        if(denied(specifier))throw Error('FORBIDDEN_FIXTURE_OR_ACQUISITION_IMPORT');
        const result=await nextResolve(specifier,context);if(denied(result.url))throw Error('FORBIDDEN_FIXTURE_OR_ACQUISITION_IMPORT');return result;
      }
    `);
    await writeFile(blocker,`
      import net from 'node:net';import {register} from 'node:module';
      net.Socket.prototype.connect=function(){throw Error('NETWORK_FORBIDDEN')};
      globalThis.fetch=function(){throw Error('NETWORK_FORBIDDEN')};
      const NativeDate=globalThis.Date;
      globalThis.Date=class extends NativeDate{
        constructor(...args){if(args.length===0)throw Error('IMPLICIT_PC_NOW_FORBIDDEN');super(...args);}
        static now(){throw Error('IMPLICIT_PC_NOW_FORBIDDEN');}
      };
      register(new URL('./deny-fallback-loader.mjs',import.meta.url));
    `);
    const env={...process.env};for(const name of Object.keys(env))if(/KASI|API_KEY|SERVICE_KEY|DATAGO/i.test(name))delete env[name];delete env.NODE_OPTIONS;
    const run=(args,{tz='UTC',entry=cli}={})=>spawnSync(process.execPath,['--import',pathToFileURL(blocker).href,entry,...args],{cwd:repo,env:{...env,TZ:tz},encoding:'utf8',timeout:30000,maxBuffer:8_000_000});
    const common=['--profile','kasi-api-2026-local-v1','--candidate',candidate,'--manifest-sha',pin,'--calendar','GREGORIAN','--date','2026-06-01','--time','12:00','--clock-policy','KR_API_PUBLISHED_KST_MODERN_1988_POST_DST_V1','--day-rollover','CIVIL_MIDNIGHT','--hour-stem-reference','SELECTED_DAY_PILLAR','--luck-profile',luckPolicy,'--dayun','true','--traditional-sex','MALE','--dayun-count','3','--seyun-year','2027','--query-minute','2026-06-01T12:00','--output','json'];
    const row=fixture.loaded.candidate.dates.find(r=>r.solarDate==='2026-06-01');
    const lunar=[...without(without(common,'--date'),'--calendar'),'--calendar','KOREAN_LUNAR','--lunar-year',String(row.lunarYear),'--lunar-month',String(row.lunarMonth),'--lunar-day',String(row.lunarDay),'--leap',String(row.leap)];
    await action({directory,candidate,fixture,pin,run,common,lunar});
  }finally{await rm(directory,{recursive:true,force:true});}
}
function success(run){assert.equal(run.status,0,run.stderr||run.stdout);assert.equal(run.stderr,'');const value=JSON.parse(run.stdout);assert.equal(value.status,'OK');assert.equal(value.schemaVersion,'kasi-local-luck-v01');return value;}
function rejected(run,context,exit=1){assert.equal(run.status,exit,run.stderr||run.stdout);assert.equal(run.stdout,'');const value=JSON.parse(run.stderr);assert.equal(typeof value.code,'string');for(const token of [context.directory,'SYNTHETIC_PRIVATE_PATH','2026-06-01','12:00','INVALID_DO_NOT_ECHO'])assert.ok(!run.stderr.includes(token),'error must not echo birth data/private paths');}

test('luck CLI is offline, clock-explicit and fixture-free for equivalent Gregorian/lunar requests and pure annual labels',async()=>setup(async context=>{
  const {run,common,lunar,directory,pin,candidate}=context,before=await readdir(directory),g=success(run(common)),l=success(run(lunar));
  assert.equal(g.m1.dataset.candidateManifestContentSha256,pin);assert.equal(g.baseExplanation,null);
  assert.deepEqual(g.m1.chart,l.m1.chart);assert.deepEqual(g.luck.candidates,l.luck.candidates);assert.deepEqual(g.explanation,l.explanation);
  assert.deepEqual(g.luck.candidates[0].dayun.sequence.entries.map(e=>glyph(e.pillar)),['甲午','乙未','丙申']);
  assert.equal(g.luck.candidates[0].dayun.start.nominalIntervalMinutes,5120);
  assert.equal(g.luck.executionCounts.birthM1Calls,1);assert.equal(g.luck.executionCounts.seyunYearQueries,1);
  assert.ok(!JSON.stringify(g).includes(candidate));assert.deepEqual(await readdir(directory),before);
  const label=success(run(['--luck-profile',luckPolicy,'--seyun-year','2027','--output','json']));
  assert.equal(label.m1,null);assert.equal(label.luck.mode,'SEYUN_LABEL_ONLY');assert.equal(glyph(label.luck.seyun.yearLabel.pillar),'丁未');
  assert.deepEqual(label.luck.executionCounts,{birthM1Calls:0,seyunYearQueries:0,seyunLabelCalls:1});
  const probe=join(directory,'blocker-probe.mjs');
  await writeFile(probe,`import net from 'node:net';let blocked=0;for(const attempt of [()=>new net.Socket().connect({host:'127.0.0.1',port:9}),()=>globalThis.fetch('https://example.invalid'),()=>Date.now(),()=>new Date()]){try{attempt();}catch(error){if(['NETWORK_FORBIDDEN','IMPLICIT_PC_NOW_FORBIDDEN'].includes(error.message))blocked++;else throw error;}}console.log('BLOCKED:'+blocked);`);
  const proof=run([],{entry:probe});assert.equal(proof.status,0,proof.stderr);assert.equal(proof.stdout,'BLOCKED:4\n');
  const importProbe=join(directory,'import-probe.mjs');await writeFile(importProbe,`import ${JSON.stringify(pathToFileURL(join(repo,'dist/calendar/koreaSolarTermFixtures.js')).href)};`);
  const denied=run([],{entry:importProbe});assert.equal(denied.status,1);assert.match(denied.stderr,/FORBIDDEN_FIXTURE_OR_ACQUISITION_IMPORT/);
}));

test('luck CLI keeps correlated Lichun branches and independent query uncertainty in JSON/TEXT under both host timezones',async()=>setup(async({run,common})=>{
  const boundary=replace(replace(replace(common,'--date','2026-02-05'),'--time','01:20'),'--query-minute','2026-02-05T01:20');
  const utc=run(boundary,{tz:'UTC'}),seoul=run(boundary,{tz:'Asia/Seoul'}),value=success(utc);success(seoul);assert.equal(utc.stdout,seoul.stdout);
  assert.equal(value.m1.chart.candidates.length,2);assert.equal(value.luck.candidates.length,2);
  assert.deepEqual(value.luck.candidates.map(c=>c.dayun.sequence.direction),['REVERSE','FORWARD']);
  assert.equal(value.luck.seyun.atMinute.entries.length,2);assert.equal(value.luck.executionCounts.seyunYearQueries,1);
  const female=success(run(replace(boundary,'--traditional-sex','FEMALE')));
  for(const c of female.luck.candidates){assert.equal(c.dayun.start.status,'AMBIGUOUS');assert.equal(c.dayun.start.age,null);assert.equal(c.dayun.start.nominalIntervalMinutes,0);}
  const text=run(replace(boundary,'--output','text'));
  assert.equal(text.status,0,text.stderr);assert.equal(text.stderr,'');assert.match(text.stdout,/출생 후보 1/);assert.match(text.stdout,/출생 후보 2/);
  assert.match(text.stdout,/순행/);assert.match(text.stdout,/역행/);assert.match(text.stdout,/교운일/);assert.match(text.stdout,/모형/);assert.ok(!text.stdout.startsWith('{'));
}));

test('luck CLI reports future data gaps and missing dayun sex locally without losing available annual calculations',async()=>setup(async({run,common})=>{
  const late=replace(replace(common,'--date','2026-12-31'),'--query-minute','2027-02-04T12:00');
  const value=success(run(late));
  assert.equal(value.luck.candidates[0].dayun.sequence.status,'OK');assert.equal(value.luck.candidates[0].dayun.start.status,'NEEDS_DATA');
  assert.ok(value.luck.candidates[0].dayun.start.missingData.some(r=>r.term==='XIAOHAN'&&r.year===2027));
  assert.equal(glyph(value.luck.seyun.yearLabel.pillar),'丁未');assert.equal(value.luck.seyun.atMinute.status,'NEEDS_DATA');
  const noSex=success(run(without(common,'--traditional-sex')));
  assert.equal(noSex.luck.candidates[0].dayun.status,'INVALID_INPUT');assert.equal(noSex.luck.seyun.yearLabel.status,'OK');
  const annualOnly=success(run(without(without(without(common,'--dayun'),'--traditional-sex'),'--dayun-count')));
  assert.equal(annualOnly.luck.candidates[0].dayun,null);assert.equal(annualOnly.luck.seyun.atMinute.status,'OK');
}));

test('luck CLI rejects unknown/missing policy and malformed data without fallback, invented clocks or unsafe error echo',async()=>setup(async context=>{
  const {run,common,directory}=context;
  for(const name of ['--luck-profile','--output','--time','--manifest-sha','--clock-policy'])rejected(run(without(common,name)),context);
  rejected(run([...common,'--unknown','INVALID_DO_NOT_ECHO']),context);rejected(run([...common,'--dayun','true']),context);
  rejected(run(replace(common,'--luck-profile','INVALID_DO_NOT_ECHO')),context);
  rejected(run(replace(common,'--manifest-sha','0'.repeat(64))),context);
  rejected(run(replace(common,'--candidate',join(directory,'MISSING_CANDIDATE'))),context);
  rejected(run(replace(common,'--query-minute','2026-02-30T12:00')),context);
  const onlyDayun=without(without(common,'--seyun-year'),'--query-minute');
  for(const args of [without(onlyDayun,'--traditional-sex'),without(onlyDayun,'--dayun-count'),replace(onlyDayun,'--traditional-sex','INVALID_DO_NOT_ECHO'),replace(onlyDayun,'--dayun-count','21')])rejected(run(args),context);
  rejected(run(replace(common,'--date','2025-12-31')),context,2);
  for(const year of ['0','10000','2027.5'])rejected(run(['--luck-profile',luckPolicy,'--seyun-year',year,'--output','json']),context);
}));
