// Real offline CLI processes with explicitly fictional calendars and birth inputs.
import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp,writeFile,readFile,rm,readdir} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {tmpdir} from 'node:os';
import {join,resolve} from 'node:path';
import {pathToFileURL} from 'node:url';
import {spawnSync} from 'node:child_process';
import {syntheticLocalChartCandidate,syntheticModernLocalChartCandidate,writeSyntheticLocalChartCandidate} from './fixtures/kasi-local-chart-synthetic.mjs';

const repo=resolve(import.meta.dirname,'..'),cli=join(repo,'scripts/kasi/local-luck.mjs');
const projectionPolicy='M7-CALENDAR-NOMINAL-YMDH-SEQUENTIAL-CLAMP-V02';
const luckPolicy='M7-TRADITIONAL-YEAR-STEM-JIE-3D-V01';
const glyph=p=>p.stem+p.branch;
const replace=(args,name,value)=>{const copy=[...args],i=copy.indexOf(name);assert.notEqual(i,-1);copy[i+1]=value;return copy;};
const without=(args,name)=>{const copy=[...args],i=copy.indexOf(name);assert.notEqual(i,-1);copy.splice(i,2);return copy;};
const contentHash=async directory=>{const out={};for(const name of(await readdir(directory)).sort())out[name]=createHash('sha256').update(await readFile(join(directory,name))).digest('hex');return out;};
let sharedModern;
async function setup(action,{modern=false}={}){
  const directory=await mkdtemp(join(tmpdir(),'kasi-m7-v02-synthetic-'));
  try{
    const candidate=join(directory,'SYNTHETIC_PRIVATE_PATH'),fixture=modern?(sharedModern??=syntheticModernLocalChartCandidate()):syntheticLocalChartCandidate();
    await writeSyntheticLocalChartCandidate(candidate,fixture);
    const loader=join(directory,'deny-fallback-loader.mjs'),blocker=join(directory,'deny-network-and-clock.mjs');
    await writeFile(loader,`
      const forbidden=new Set(['koreaSolarTermFixtures.js','koreanLunisolarFixtures.js','trustedKoreanPreview.js','research.mjs','collector.js']);
      const denied=value=>forbidden.has(decodeURIComponent(value).replaceAll(String.fromCharCode(92),'/').split('/').at(-1).split('?')[0].split('#')[0]);
      export async function resolve(specifier,context,nextResolve){if(denied(specifier))throw Error('FORBIDDEN_FIXTURE_OR_ACQUISITION_IMPORT');const result=await nextResolve(specifier,context);if(denied(result.url))throw Error('FORBIDDEN_FIXTURE_OR_ACQUISITION_IMPORT');return result;}
    `);
    await writeFile(blocker,`
      import net from 'node:net';import {register} from 'node:module';
      net.Socket.prototype.connect=function(){throw Error('NETWORK_FORBIDDEN')};globalThis.fetch=function(){throw Error('NETWORK_FORBIDDEN')};
      const NativeDate=globalThis.Date;globalThis.Date=class extends NativeDate{constructor(...args){if(args.length===0)throw Error('IMPLICIT_PC_NOW_FORBIDDEN');super(...args);}static now(){throw Error('IMPLICIT_PC_NOW_FORBIDDEN');}};
      register(new URL('./deny-fallback-loader.mjs',import.meta.url));
    `);
    const env={...process.env};for(const name of Object.keys(env))if(/KASI|API_KEY|SERVICE_KEY|DATAGO/i.test(name))delete env[name];delete env.NODE_OPTIONS;
    const run=(args,{tz='UTC'}={})=>spawnSync(process.execPath,['--import',pathToFileURL(blocker).href,cli,...args],{cwd:repo,env:{...env,TZ:tz},encoding:'utf8',timeout:30000,maxBuffer:8_000_000});
    const old=['--profile',modern?'kasi-api-1989-2026-local-v1':'kasi-api-2026-local-v1','--candidate',candidate,'--manifest-sha',fixture.expectedManifestSha256,'--calendar','GREGORIAN','--date',modern?'1990-06-01':'2026-06-01','--time','12:00','--clock-policy','KR_API_PUBLISHED_KST_MODERN_1988_POST_DST_V1','--day-rollover','CIVIL_MIDNIGHT','--hour-stem-reference','SELECTED_DAY_PILLAR','--luck-profile',luckPolicy,'--dayun','true','--traditional-sex','MALE','--dayun-count','10','--seyun-year','2027','--output','json'];
    const projected=[...old,'--calendar-projection',projectionPolicy,'--as-of-date','2026-11-01','--as-of-time','12:00'];
    await action({directory,candidate,fixture,run,old,projected});
  }finally{await rm(directory,{recursive:true,force:true});}
}
function success(run,{old=false}={}){assert.equal(run.error,undefined);assert.equal(run.status,0,run.stderr||run.stdout);assert.equal(run.stderr,'');const value=JSON.parse(run.stdout);assert.equal(value.status,'OK');assert.equal(value.schemaVersion,old?'kasi-local-luck-v01':'kasi-local-luck-projection-v02');return value;}
function rejected(run,context,exit=1){assert.equal(run.error,undefined);assert.equal(run.status,exit,run.stderr||run.stdout);assert.equal(run.stdout,'');const value=JSON.parse(run.stderr);assert.equal(typeof value.code,'string');for(const secret of [context.directory,'SYNTHETIC_PRIVATE_PATH','2026-06-01','12:00','INVALID_DO_NOT_ECHO'])assert.ok(!run.stderr.includes(secret),'stderr must not echo virtual birth input or private paths');}

test('projection CLI is opt-in and offline, preserves v0.1 JSON and supports equivalent lunar input without saving files',async()=>setup(async context=>{
  const {run,old,projected,fixture,candidate,directory}=context,beforeFiles=await readdir(directory),beforeHashes=await contentHash(candidate);
  const legacyRun=run(old),legacy=success(legacyRun,{old:true}),value=success(run(projected));
  assert.deepEqual(value.m7,legacy);assert.equal(JSON.stringify(value.m7,null,2)+'\n',legacyRun.stdout);
  assert.equal(value.projection.candidates[0].calendar.firstStartMinute,'2027-08-08T04:00');
  assert.equal(value.projection.candidates[0].selection.status,'BEFORE_FIRST_DA_YUN');
  const row=fixture.loaded.candidate.dates.find(r=>r.solarDate==='2026-06-01');
  const lunar=[...without(without(projected,'--date'),'--calendar'),'--calendar','KOREAN_LUNAR','--lunar-year',String(row.lunarYear),'--lunar-month',String(row.lunarMonth),'--lunar-day',String(row.lunarDay),'--leap',String(row.leap)];
  const l=success(run(lunar));assert.deepEqual(l.m7.m1.chart,value.m7.m1.chart);assert.deepEqual(l.projection.candidates,value.projection.candidates);assert.deepEqual(l.explanation,value.explanation);
  assert.equal(value.m7.luck.executionCounts.birthM1Calls,1);assert.ok(!JSON.stringify(value).includes(candidate));
  assert.deepEqual(await contentHash(candidate),beforeHashes);assert.deepEqual(await readdir(directory),beforeFiles);
  const noQuery=success(run(without(without(projected,'--as-of-date'),'--as-of-time')));assert.equal(noQuery.projection.candidates[0].selection,null);
}));

test('projection CLI resolves modern as-of intervals and half-open transitions with true Korean text output',async()=>setup(async({run,projected})=>{
  const value=success(run(projected)),selected=value.projection.candidates[0].selection;
  assert.equal(selected.status,'RESOLVED_UNDER_POLICY');assert.equal(selected.selection.ordinal,4);assert.equal(glyph(selected.selection.pillar),'乙酉');
  for(const [date,time,status,ordinal]of [['1989-11-01','12:00','BEFORE_BIRTH',null],['1990-11-01','12:00','BEFORE_FIRST_DA_YUN',null],['2001-08-08','03:59','RESOLVED_UNDER_POLICY',1],['2001-08-08','04:00','RESOLVED_UNDER_POLICY',2],['2001-08-08','04:01','RESOLVED_UNDER_POLICY',2]]){
    const result=success(run(replace(replace(projected,'--as-of-date',date),'--as-of-time',time))).projection.candidates[0].selection;
    assert.equal(result.status,status);assert.equal(result.selection?.ordinal??null,ordinal);
  }
  const short=success(run(replace(projected,'--dayun-count','3')));assert.equal(short.projection.candidates[0].selection.status,'OUTSIDE_GENERATED_RANGE');
  const future=success(run(replace(projected,'--as-of-date','2027-01-01')));assert.equal(future.projection.candidates[0].selection.status,'POLICY_UNRESOLVED');
  const text=run(replace(projected,'--output','text'));assert.equal(text.status,0,text.stderr);assert.equal(text.stderr,'');assert.match(text.stdout,/명목/);assert.match(text.stdout,/1991-08-08T04:00/);assert.match(text.stdout,/제\s*4\s*대운/);assert.match(text.stdout,/乙酉/);assert.ok(!text.stdout.startsWith('{'));
},{modern:true}));

test('projection CLI keeps both Lichun candidates and missing-next-Jie states under UTC and Asia/Seoul',async()=>setup(async({run,projected})=>{
  const boundary=replace(replace(projected,'--date','2026-02-05'),'--time','01:20'),utc=run(boundary),seoul=run(boundary,{tz:'Asia/Seoul'}),value=success(utc);success(seoul);assert.equal(utc.stdout,seoul.stdout);
  assert.equal(value.projection.candidates.length,2);assert.deepEqual(value.m7.luck.candidates.map(c=>c.dayun.direction.direction),['REVERSE','FORWARD']);
  assert.notEqual(value.projection.candidates[0].calendar.firstStartMinute,value.projection.candidates[1].calendar.firstStartMinute);
  const female=success(run(replace(boundary,'--traditional-sex','FEMALE')));
  for(const c of female.projection.candidates){assert.equal(c.calendar.status,'AMBIGUOUS');assert.equal(c.calendar.firstStartMinute,null);assert.equal(c.selection.status,'AMBIGUOUS');}
  const text=run(replace(replace(boundary,'--traditional-sex','FEMALE'),'--output','text'));assert.equal(text.status,0,text.stderr);assert.match(text.stdout,/후보 1/);assert.match(text.stdout,/후보 2/);assert.match(text.stdout,/미확정|AMBIGUOUS/);
  const late=success(run(replace(projected,'--date','2026-12-31')));assert.equal(late.projection.candidates[0].calendar.status,'NEEDS_DATA');assert.equal(late.projection.candidates[0].selection.status,'NEEDS_DATA');assert.equal(glyph(late.m7.luck.seyun.yearLabel.pillar),'丁未');
  assert.ok(late.projection.candidates[0].calendar.missingData.some(m=>m.year===2027&&m.term==='XIAOHAN'));
}));

test('projection CLI rejects incomplete policy/query, malformed dates, bad pins and absent candidates without fallback',async()=>setup(async context=>{
  const {run,projected,old,directory}=context;
  for(const args of [without(projected,'--calendar-projection'),without(projected,'--as-of-date'),without(projected,'--as-of-time'),replace(projected,'--calendar-projection','INVALID_DO_NOT_ECHO'),replace(projected,'--as-of-date','2026-02-30'),replace(projected,'--as-of-time','24:00'),replace(projected,'--as-of-time','12:00:00'),[...projected,'--unknown','INVALID_DO_NOT_ECHO'],[...projected,'--calendar-projection',projectionPolicy]])rejected(run(args),context);
  rejected(run(replace(projected,'--manifest-sha','0'.repeat(64))),context);rejected(run(replace(projected,'--candidate',join(directory,'MISSING_CANDIDATE'))),context);
  const annualOnly=without(without(without(projected,'--dayun'),'--traditional-sex'),'--dayun-count');rejected(run(annualOnly),context);
  rejected(run(['--luck-profile',luckPolicy,'--seyun-year','2027','--calendar-projection',projectionPolicy,'--output','json']),context);
  rejected(run(replace(projected,'--date','2025-12-31')),context,2);
  const existing=success(run(without(without(without(old,'--dayun'),'--traditional-sex'),'--dayun-count')),{old:true});assert.equal(existing.luck.candidates[0].dayun,null);
}));
