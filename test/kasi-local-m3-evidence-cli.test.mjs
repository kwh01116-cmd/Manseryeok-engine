// Real CLI processes use generated fictional calendar data, never private API rows or a real person.
import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp,writeFile,readFile,rm,readdir} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {tmpdir} from 'node:os';
import {join,resolve} from 'node:path';
import {pathToFileURL} from 'node:url';
import {spawnSync} from 'node:child_process';
import {syntheticLocalChartCandidate,writeSyntheticLocalChartCandidate} from './fixtures/kasi-local-chart-synthetic.mjs';

const repo=resolve(import.meta.dirname,'..'),cli=join(repo,'scripts/kasi/local-m3-evidence.mjs');
const m2='m2-basic-classification-local-v1',m3='m3-structural-evidence-local-v1';
const replace=(args,name,value)=>{const copy=[...args],i=copy.indexOf(name);assert.notEqual(i,-1);copy[i+1]=value;return copy;};
const without=(args,name)=>{const copy=[...args],i=copy.indexOf(name);assert.notEqual(i,-1);copy.splice(i,2);return copy;};
const hashes=async directory=>{const out={};for(const name of(await readdir(directory)).sort())out[name]=createHash('sha256').update(await readFile(join(directory,name))).digest('hex');return out;};
async function setup(action){
  const directory=await mkdtemp(join(tmpdir(),'kasi-m3-evidence-synthetic-'));
  try{
    const candidate=join(directory,'SYNTHETIC_PRIVATE_PATH'),fixture=syntheticLocalChartCandidate();
    await writeSyntheticLocalChartCandidate(candidate,fixture);
    const loader=join(directory,'deny-fallback-loader.mjs'),blocker=join(directory,'deny-network-clock.mjs');
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
    const run=(args,{tz='UTC',entry=cli}={})=>spawnSync(process.execPath,['--import',pathToFileURL(blocker).href,entry,...args],{cwd:repo,env:{...env,TZ:tz},encoding:'utf8',timeout:30000,maxBuffer:12_000_000});
    const common=['--profile','kasi-api-2026-local-v1','--candidate',candidate,'--manifest-sha',fixture.expectedManifestSha256,'--calendar','GREGORIAN','--date','2026-06-01','--time','12:00','--clock-policy','KR_API_PUBLISHED_KST_MODERN_1988_POST_DST_V1','--day-rollover','CIVIL_MIDNIGHT','--hour-stem-reference','SELECTED_DAY_PILLAR','--m2-profile',m2,'--m3-profile',m3,'--output','json'];
    const row=fixture.loaded.candidate.dates.find(r=>r.solarDate==='2026-06-01');
    const lunar=[...without(without(common,'--date'),'--calendar'),'--calendar','KOREAN_LUNAR','--lunar-year',String(row.lunarYear),'--lunar-month',String(row.lunarMonth),'--lunar-day',String(row.lunarDay),'--leap',String(row.leap)];
    await action({directory,candidate,fixture,run,common,lunar});
  }finally{await rm(directory,{recursive:true,force:true});}
}
function success(run){
  assert.equal(run.error,undefined);assert.equal(run.status,0,run.stderr||run.stdout);assert.equal(run.stderr,'');
  const value=JSON.parse(run.stdout);assert.equal(value.status,'EVIDENCE_ONLY');assert.equal(value.schemaVersion,'kasi-local-m3-evidence-v1');return value;
}
function rejection(run,context,exit=1){
  assert.equal(run.error,undefined);assert.equal(run.status,exit,run.stderr||run.stdout);assert.equal(run.stdout,'');
  const value=JSON.parse(run.stderr);assert.equal(typeof value.code,'string');
  for(const token of [context.directory,'SYNTHETIC_PRIVATE_PATH','2026-06-01','12:00','INVALID_DO_NOT_ECHO'])assert.ok(!run.stderr.includes(token),'stderr must not echo fictional birth inputs or private paths');
}

test('M3 CLI performs one offline M1/M2 path for equivalent solar and lunar input without saving or changing data',async()=>setup(async context=>{
  const {run,common,lunar,fixture,directory,candidate}=context,beforeFiles=await readdir(directory),beforeHashes=await hashes(candidate);
  const g=success(run(common)),l=success(run(lunar));
  assert.equal(g.m1.dataset.candidateManifestContentSha256,fixture.expectedManifestSha256);
  assert.equal(g.m1.input.calendar,'GREGORIAN');assert.equal(l.m1.input.calendar,'KOREAN_LUNAR');
  assert.deepEqual(g.m1.chart,l.m1.chart);assert.deepEqual(g.evidence.candidates,l.evidence.candidates);assert.deepEqual(g.explanation,l.explanation);
  assert.deepEqual(g.executionCounts,{birthM1Calls:1,m2Derivations:1});assert.equal(g.evidence.finalStrength.status,'NOT_IMPLEMENTED');
  assert.equal(g.validation.g0Receipt,null);assert.equal(g.validation.g1P2Promotion,false);assert.equal(g.validation.m3FinalInterpretationGate,'BLOCKED_UNCHANGED');
  assert.equal(g.evidence.candidates[0].dayMaster,'丙');assert.ok(g.explanation.candidates[0].items.some(item=>item.text.includes('丙')));
  assert.ok(!JSON.stringify(g).includes(candidate));assert.deepEqual(await hashes(candidate),beforeHashes);assert.deepEqual(await readdir(directory),beforeFiles);
}));

test('M3 CLI preserves both Lichun candidates in JSON and Korean text identically across host time zones',async()=>setup(async({run,common})=>{
  const boundary=replace(replace(common,'--date','2026-02-05'),'--time','01:20'),utc=run(boundary),seoul=run(boundary,{tz:'Asia/Seoul'}),value=success(utc);success(seoul);
  assert.equal(utc.stdout,seoul.stdout);assert.equal(value.m1.chart.confidence,'PUBLISHED_MINUTE_AMBIGUOUS');
  assert.equal(value.evidence.candidates.length,2);assert.equal(value.explanation.candidates.length,2);
  assert.deepEqual(value.evidence.candidates.map(c=>c.monthContext.monthPillar.stem+c.monthContext.monthPillar.branch),['己丑','庚寅']);
  assert.deepEqual(value.evidence.candidates.map(c=>c.monthContext.activeSince.term),['XIAOHAN','LICHUN']);
  for(let i=0;i<2;i++)for(const item of value.explanation.candidates[i].items)assert.equal(item.candidateRef,'chart.candidates['+i+']');
  const text=run(replace(boundary,'--output','text'));assert.equal(text.status,0,text.stderr);assert.equal(text.stderr,'');
  assert.match(text.stdout,/M3 Evidence/);assert.match(text.stdout,/후보 1/);assert.match(text.stdout,/후보 2/);assert.match(text.stdout,/己丑/);assert.match(text.stdout,/庚寅/);
  assert.match(text.stdout,/EVIDENCE_ONLY/);assert.match(text.stdout,/NOT_IMPLEMENTED/);assert.match(text.stdout,/절입|표시 분|미확정/);assert.ok(!text.stdout.startsWith('{'));
}));

test('M3 CLI keeps overlapping relation evidence and auditable Korean references while denying network, fallback and implicit now',async()=>setup(async({run,common,directory})=>{
  const overlap=replace(replace(common,'--date','2026-01-01'),'--time','16:30'),value=success(run(overlap));
  assert.deepEqual(value.evidence.candidates[0].relationContext.pairs.filter(r=>r.leftPillarRole==='year'&&r.rightPillarRole==='hour').map(r=>r.kind),['LIUHE','LIUPO','XING']);
  assert.equal(value.evidence.candidates[0].relationContext.effectStatus,'UNRESOLVED');
  for(const args of [common,overlap]){const text=run(replace(args,'--output','text'));assert.equal(text.status,0,text.stderr);assert.equal(text.stderr,'');for(const pattern of [/근거:/,/M2 사실:/,/규칙:/,/정책:/,/명리·정의 출처:/,/계산 출처:/,/NOT_IMPLEMENTED/])assert.match(text.stdout,pattern);}
  const probe=join(directory,'offline-guard-probe.mjs');
  await writeFile(probe,`import net from 'node:net';let count=0;for(const attempt of [()=>new net.Socket().connect({host:'127.0.0.1',port:9}),()=>globalThis.fetch('https://example.invalid'),()=>new Date(),()=>Date.now()]){try{attempt();}catch(error){if(['NETWORK_FORBIDDEN','IMPLICIT_PC_NOW_FORBIDDEN'].includes(error.message))count++;else throw error;}}console.log('BLOCKED:'+count);`);
  const guarded=run([],{entry:probe});assert.equal(guarded.status,0,guarded.stderr);assert.equal(guarded.stdout,'BLOCKED:4\n');
  const fallback=join(directory,'fallback-probe.mjs');await writeFile(fallback,`import ${JSON.stringify(pathToFileURL(join(repo,'dist/calendar/koreaSolarTermFixtures.js')).href)};`);
  const denied=run([],{entry:fallback});assert.equal(denied.status,1);assert.match(denied.stderr,/FORBIDDEN_FIXTURE_OR_ACQUISITION_IMPORT/);
}));

test('M3 CLI rejects absent or unsupported policies, time, pins, data and mixed luck options without leaking inputs',async()=>setup(async context=>{
  const {run,common,directory}=context;
  for(const flag of ['--profile','--manifest-sha','--time','--clock-policy','--day-rollover','--hour-stem-reference','--m2-profile','--m3-profile','--output'])rejection(run(without(common,flag)),context);
  for(const flag of ['--profile','--clock-policy','--m2-profile','--m3-profile','--output'])rejection(run(replace(common,flag,'INVALID_DO_NOT_ECHO')),context);
  for(const extra of [['--m3-profile',m3],['--unknown','INVALID_DO_NOT_ECHO'],['--traditional-sex','MALE'],['--as-of-date','2026-11-01'],['--luck-profile','M7-TRADITIONAL-YEAR-STEM-JIE-3D-V01']])rejection(run([...common,...extra]),context);
  rejection(run(replace(common,'--manifest-sha','0'.repeat(64))),context);rejection(run(replace(common,'--candidate',join(directory,'MISSING_CANDIDATE'))),context);
  rejection(run(replace(common,'--date','2026-02-30')),context);rejection(run(replace(common,'--time','24:00')),context);rejection(run(replace(common,'--date','2025-12-31')),context,2);
}));

const seasonalPolicy='M3-SEASONAL-FOUR-SEASONS-EARTH-MONTHS-DEFERRED-V01';
test('explicit seasonal CLI keeps unselected bytes and separates correlated judgments in offline JSON and Korean TEXT',async()=>setup(async({run,common,lunar})=>{
  const old=run(common);success(old);
  const selected=[...common,'--seasonal-policy',seasonalPolicy],solar=run(selected),moon=run([...lunar,'--seasonal-policy',seasonalPolicy]);
  for(const value of [solar,moon]){assert.equal(value.status,0,value.stderr);assert.equal(value.stderr,'');}
  const g=JSON.parse(solar.stdout),l=JSON.parse(moon.stdout);
  assert.equal(g.schemaVersion,'kasi-local-m3-evidence-seasonal-v1');assert.equal(g.status,'EVIDENCE_ONLY');
  assert.deepEqual(g.seasonal,l.seasonal);assert.equal(g.seasonal.candidates[0].judgment.seasonalState,'WANG');
  assert.deepEqual(g.executionCounts,{birthM1Calls:1,m2Derivations:1});assert.equal(g.validation.finalStrength,'NOT_IMPLEMENTED');
  const boundary=replace(replace(selected,'--date','2026-02-05'),'--time','01:20'),utc=run(boundary),seoul=run(boundary,{tz:'Asia/Seoul'});
  assert.equal(utc.status,0,utc.stderr);assert.equal(seoul.status,0,seoul.stderr);assert.equal(utc.stdout,seoul.stdout);
  const candidates=JSON.parse(utc.stdout).seasonal.candidates;
  assert.deepEqual(candidates.map(c=>[c.judgment.monthBranch,c.judgment.seasonalState,c.judgment.status]),[['丑',null,'POLICY_UNRESOLVED'],['寅','QIU','RESOLVED_UNDER_POLICY']]);
  const text=run(replace(selected,'--output','text'));assert.equal(text.status,0,text.stderr);assert.equal(text.stderr,'');
  assert.match(text.stdout,/巳월은 여름 구간/);assert.match(text.stdout,/왕\(旺\)/);assert.ok(text.stdout.indexOf('왕(旺)')<text.stdout.indexOf('장간'));
  assert.match(text.stdout,/계절 판단 상세 참조/);assert.match(text.stdout,/TXT-SANMING-TONGHUI/);assert.match(text.stdout,/NOT_IMPLEMENTED/);
  const after=run(common);success(after);assert.equal(after.stdout,old.stdout);
}));
test('seasonal CLI requires one supported explicit policy and never echoes an invalid policy value',async()=>setup(async context=>{
  for(const value of ['','AUTO','INVALID_DO_NOT_ECHO'])rejection(context.run([...context.common,'--seasonal-policy',value]),context);
  rejection(context.run([...context.common,'--seasonal-policy',seasonalPolicy,'--seasonal-policy',seasonalPolicy]),context);
  rejection(context.run([...context.common,'--seasonal-policy']),context);
}));

const siliPolicy='M3-SEASONAL-SILI-PRE18-NOMINAL-MINUTES-V02';
test('v02 CLI separates derived B alternatives from M1 candidates and preserves v01 and no-option bytes offline',async()=>setup(async({run,common,lunar})=>{
  const unselected=run(common),v1=run([...common,'--seasonal-policy',seasonalPolicy]);
  assert.equal(unselected.status,0,unselected.stderr);assert.equal(v1.status,0,v1.stderr);
  const args=[...common,'--seasonal-policy',siliPolicy],g=run(args),l=run([...lunar,'--seasonal-policy',siliPolicy]);
  for(const r of[g,l]){assert.equal(r.status,0,r.stderr);assert.equal(r.stderr,'');}
  const gv=JSON.parse(g.stdout),lv=JSON.parse(l.stdout);assert.deepEqual(gv.seasonal,lv.seasonal);
  assert.equal(gv.schemaVersion,'kasi-local-m3-evidence-seasonal-v2');assert.equal(gv.seasonal.candidates[0].judgment.seasonalState,'WANG');
  const b=replace(replace(args,'--date','2026-04-17'),'--time','01:20'),utc=run(b),seoul=run(b,{tz:'Asia/Seoul'});
  assert.equal(utc.status,0,utc.stderr);assert.equal(seoul.status,0,seoul.stderr);assert.equal(utc.stdout,seoul.stdout);
  const at=JSON.parse(utc.stdout);assert.equal(at.m1.chart.candidates.length,1);assert.equal(at.seasonal.candidates.length,1);
  assert.equal(at.seasonal.candidates[0].judgment.alternatives.length,2);assert.equal(at.seasonal.candidates[0].judgment.status,'AMBIGUOUS');
  assert.deepEqual(at.executionCounts,{birthM1Calls:1,m2Derivations:1});
  const boundary=run(replace(replace(args,'--date','2026-02-05'),'--time','01:20'));assert.equal(boundary.status,0,boundary.stderr);
  const parents=JSON.parse(boundary.stdout).seasonal.candidates;
  assert.deepEqual(parents.map(c=>[c.judgment.monthBranch,c.judgment.season]),[['丑','EARTH_DOMINANT'],['寅','SPRING']]);
  assert.ok(parents.every(c=>c.judgment.alternatives.length===1));
  const text=run(replace(b,'--output','text'));assert.equal(text.status,0,text.stderr);assert.equal(text.stderr,'');
  assert.match(text.stdout,/원국 후보는 유지/);assert.match(text.stdout,/25,920명목 분/);assert.match(text.stdout,/NOT_IMPLEMENTED/);
  assert.equal(run(common).stdout,unselected.stdout);assert.equal(run([...common,'--seasonal-policy',seasonalPolicy]).stdout,v1.stdout);
}));
test('v02 CLI rejects missing files, bad pins, duplicated policy and mixed time-axis options without fallback',async()=>setup(async context=>{
  const args=[...context.common,'--seasonal-policy',siliPolicy];
  rejection(context.run(replace(args,'--manifest-sha','f'.repeat(64))),context);
  rejection(context.run(replace(args,'--candidate',join(context.directory,'MISSING_CANDIDATE'))),context);
  for(const extra of[['--seasonal-policy',siliPolicy],['--as-of-date','2026-04-17'],['--traditional-sex','FEMALE']])rejection(context.run([...args,...extra]),context);
}));
