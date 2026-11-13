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

const rootPolicy='M3-ROOT-PRESENCE-HIDDEN-SAME-ELEMENT-V01';
test('explicit root CLI resolves four separate targets and their surface support roots without replacing seasonal or structural output',async()=>setup(async({run,common,lunar})=>{
  const old=run(common),oldSeason=run([...common,'--seasonal-policy',siliPolicy]);
  const rootOnly=run([...common,'--root-policy',rootPolicy]);
  assert.equal(rootOnly.status,0,rootOnly.stderr);assert.equal(rootOnly.stderr,'');
  const ro=JSON.parse(rootOnly.stdout);assert.equal(ro.schemaVersion,'kasi-local-m3-evidence-root-v1');
  assert.equal(ro.root.status,'RESOLVED_UNDER_POLICY');assert.equal(ro.seasonal,undefined);
  assert.equal(ro.root.candidates[0].targets.length,4);
  assert.deepEqual(ro.executionCounts,{birthM1Calls:1,m2Derivations:1});
  const args=[...common,'--root-policy',rootPolicy,'--seasonal-policy',siliPolicy];
  const g=run(args),l=run([...lunar,'--root-policy',rootPolicy,'--seasonal-policy',siliPolicy]);
  for(const r of[g,l]){assert.equal(r.status,0,r.stderr);assert.equal(r.stderr,'');}
  const gv=JSON.parse(g.stdout),lv=JSON.parse(l.stdout);
  assert.equal(gv.schemaVersion,'kasi-local-m3-evidence-seasonal-root-v1');
  assert.deepEqual(gv.root.candidates,lv.root.candidates);assert.deepEqual(gv.root.policy,lv.root.policy);
  assert.deepEqual(gv.rootExplanation,lv.rootExplanation);
  for(const value of[gv,lv])for(const source of value.evidence.sources)assert.deepEqual(value.root.sources.find(s=>s.id===source.id),source);
  for(const key of ['m1','facts','evidence','explanation','seasonal','validation','provenance'])assert.deepEqual(gv[key],JSON.parse(oldSeason.stdout)[key]);
  const targets=gv.root.candidates[0].targets;
  assert.deepEqual(targets.map(t=>t.target.pillarRole),['year','month','day','hour']);
  assert.deepEqual(targets.map(t=>t.chartRootPresence),['PRESENT_UNDER_POLICY','ABSENT_UNDER_POLICY','PRESENT_UNDER_POLICY','ABSENT_UNDER_POLICY']);
  const text=run(replace(args,'--output','text'));assert.equal(text.status,0,text.stderr);assert.equal(text.stderr,'');
  assert.match(text.stdout,/통근/);assert.match(text.stdout,/인성/);assert.match(text.stdout,/甲/);assert.match(text.stdout,/NOT_IMPLEMENTED/);
  assert.equal(run(common).stdout,old.stdout);assert.equal(run([...common,'--seasonal-policy',siliPolicy]).stdout,oldSeason.stdout);
}));
test('root CLI keeps B alternatives under one root result and existing Lichun natal candidates separate, rejecting invalid options and data offline',async()=>setup(async context=>{
  const {run,common}=context,args=[...common,'--root-policy',rootPolicy,'--seasonal-policy',siliPolicy];
  const b=replace(replace(args,'--date','2026-04-17'),'--time','01:20'),before=run(replace(b,'--time','01:19')),at=run(b),after=run(replace(b,'--time','01:21'));
  for(const r of[before,at,after]){assert.equal(r.status,0,r.stderr);assert.equal(r.stderr,'');}
  const value=JSON.parse(at.stdout);assert.equal(value.root.candidates.length,1);assert.equal(value.seasonal.candidates[0].judgment.alternatives.length,2);
  assert.deepEqual(JSON.parse(before.stdout).root,value.root);assert.deepEqual(JSON.parse(after.stdout).root,value.root);
  const boundary=replace(replace(args,'--date','2026-02-05'),'--time','01:20'),utc=run(boundary),seoul=run(boundary,{tz:'Asia/Seoul'});
  assert.equal(utc.status,0,utc.stderr);assert.equal(seoul.status,0,seoul.stderr);assert.equal(utc.stdout,seoul.stdout);
  assert.equal(JSON.parse(utc.stdout).root.candidates.length,2);
  for(const bad of['','AUTO','INVALID_DO_NOT_ECHO'])rejection(run([...common,'--root-policy',bad]),context);
  rejection(run([...args,'--root-policy',rootPolicy]),context);rejection(run([...common,'--root-policy']),context);
  rejection(run(replace(args,'--manifest-sha','e'.repeat(64))),context);
  rejection(run(replace(args,'--candidate',join(context.directory,'MISSING_CANDIDATE'))),context);
}));

const supportPolicy='M3-RESOURCE-ADJACENT-COMBINATION-HOLD-V01';
test('explicit resource support CLI leaves an unrooted unpaired resource unheld and preserves all earlier layers',async()=>setup(async({run,common,lunar})=>{
  const baseline=[...common,'--root-policy',rootPolicy,'--seasonal-policy',siliPolicy],before=run(baseline);
  assert.equal(before.status,0,before.stderr);
  const selected=[...baseline,'--support-policy',supportPolicy],g=run(selected),l=run([...lunar,'--root-policy',rootPolicy,'--seasonal-policy',siliPolicy,'--support-policy',supportPolicy]);
  for(const r of[g,l]){assert.equal(r.status,0,r.stderr);assert.equal(r.stderr,'');}
  const value=JSON.parse(g.stdout),moon=JSON.parse(l.stdout),old=JSON.parse(before.stdout);
  assert.equal(value.schemaVersion,'kasi-local-m3-evidence-seasonal-support-v1');
  for(const key of['m1','facts','evidence','explanation','root','rootExplanation','seasonal','validation','provenance','executionCounts'])assert.deepEqual(value[key],old[key]);
  assert.deepEqual(value.support.candidates,moon.support.candidates);assert.deepEqual(value.supportExplanation,moon.supportExplanation);
  const resource=value.support.candidates[0].resources[0];assert.equal(value.support.candidates[0].resources.length,1);
  assert.equal(resource.resource.stem,'甲');assert.equal(resource.resource.tenGod,'偏印');assert.equal(resource.rootPresence,'ABSENT_UNDER_POLICY');
  assert.deepEqual(resource.combinationPartners,[]);assert.equal(resource.selectedRuleDecision,'NO_HOLD_BY_THIS_RULE');
  assert.equal(resource.totalSupportEfficacy,'NOT_EVALUATED');assert.equal(value.support.finalStrength.status,'NOT_IMPLEMENTED');
  const text=run(replace(selected,'--output','text'));assert.equal(text.status,0,text.stderr);assert.equal(text.stderr,'');
  assert.match(text.stdout,/甲/);assert.match(text.stdout,/인성/);assert.match(text.stdout,/합/);assert.match(text.stdout,/채택/);
  assert.equal(run(baseline).stdout,before.stdout);
  const alone=run([...common,'--root-policy',rootPolicy,'--support-policy',supportPolicy]);assert.equal(alone.status,0,alone.stderr);
  assert.equal(JSON.parse(alone.stdout).schemaVersion,'kasi-local-m3-evidence-support-v1');assert.equal(JSON.parse(alone.stdout).seasonal,undefined);
}));
test('support CLI preserves B alternatives and correlated Lichun parents while requiring explicit root dependency and safe inputs',async()=>setup(async context=>{
  const {run,common}=context,args=[...common,'--root-policy',rootPolicy,'--seasonal-policy',siliPolicy,'--support-policy',supportPolicy];
  const b=replace(replace(args,'--date','2026-04-17'),'--time','01:20');
  const before=run(replace(b,'--time','01:19')),at=run(b),after=run(replace(b,'--time','01:21'));
  for(const r of[before,at,after]){assert.equal(r.status,0,r.stderr);assert.equal(r.stderr,'');}
  const value=JSON.parse(at.stdout);assert.equal(value.m1.chart.candidates.length,1);assert.equal(value.support.candidates.length,1);
  assert.equal(value.seasonal.candidates[0].judgment.alternatives.length,2);
  assert.deepEqual(JSON.parse(before.stdout).support,value.support);assert.deepEqual(JSON.parse(after.stdout).support,value.support);
  const t=replace(replace(args,'--date','2026-02-05'),'--time','01:20'),utc=run(t),seoul=run(t,{tz:'Asia/Seoul'});
  assert.equal(utc.status,0,utc.stderr);assert.equal(seoul.status,0,seoul.stderr);assert.equal(utc.stdout,seoul.stdout);
  const parents=JSON.parse(utc.stdout).support.candidates;assert.equal(parents.length,2);
  for(const parent of parents)for(const resource of parent.resources){assert.equal(resource.resource.candidateRef,parent.candidateRef);for(const partner of resource.combinationPartners)assert.equal(partner.partner.candidateRef,parent.candidateRef);}
  rejection(run([...common,'--support-policy',supportPolicy]),context);
  for(const bad of['','AUTO','INVALID_DO_NOT_ECHO'])rejection(run([...common,'--root-policy',rootPolicy,'--support-policy',bad]),context);
  rejection(run([...args,'--support-policy',supportPolicy]),context);rejection(run([...common,'--root-policy',rootPolicy,'--support-policy']),context);
  rejection(run(replace(args,'--manifest-sha','d'.repeat(64))),context);rejection(run(replace(args,'--candidate',join(context.directory,'MISSING_CANDIDATE'))),context);
}));

const synthesisProfile='M3-LIMITED-ABSENT-ROOT-RESOURCE-SYNTHESIS-V01';
test('explicit synthesis CLI bundles declared dependencies once and emits JSON or a concise Korean research report offline',async()=>setup(async({run,common,lunar,directory,candidate})=>{
  const before=run(common);success(before);const beforeFiles=await readdir(directory),beforeHashes=await hashes(candidate);
  const bundle=args=>[...without(without(args,'--m2-profile'),'--m3-profile'),'--synthesis-profile',synthesisProfile];
  const solar=run(bundle(common)),moon=run(bundle(lunar));
  for(const value of [solar,moon]){assert.equal(value.error,undefined);assert.equal(value.status,0,value.stderr);assert.equal(value.stderr,'');}
  const g=JSON.parse(solar.stdout),l=JSON.parse(moon.stdout);
  assert.equal(g.schemaVersion,'kasi-local-m3-evidence-synthesis-v1');assert.equal(g.status,'EVIDENCE_ONLY');
  assert.equal(g.facts.policyBundle.id,m2);assert.equal(g.evidence.policy.id,m3);assert.equal(g.seasonal.policy.id,siliPolicy);assert.equal(g.root.policy.id,rootPolicy);assert.equal(g.support.policy.id,supportPolicy);
  assert.deepEqual(g.executionCounts,{birthM1Calls:1,m2Derivations:1});assert.deepEqual(g.researchSynthesis.candidates,l.researchSynthesis.candidates);assert.deepEqual(g.researchReport,l.researchReport);
  assert.equal(g.validation.finalStrength,'NOT_IMPLEMENTED');assert.equal(g.validation.m3FinalInterpretationGate,'BLOCKED_UNCHANGED');assert.equal(g.validation.g0Receipt,null);assert.equal(g.validation.g1P2Promotion,false);
  const text=run(replace(bundle(common),'--output','text'));assert.equal(text.status,0,text.stderr);assert.equal(text.stderr,'');
  assert.match(text.stdout,/제한적 종합/);assert.match(text.stdout,/연구/);assert.match(text.stdout,/보류|신약/);assert.match(text.stdout,/JSON/);assert.ok(text.stdout.length<10000);
  assert.ok(!text.stdout.includes('기존 구조 근거·통근·계절의 상세 참조'));
  const after=run(common);success(after);assert.equal(after.stdout,before.stdout);
  assert.deepEqual(await hashes(candidate),beforeHashes);assert.deepEqual(await readdir(directory),beforeFiles);
}));

test('synthesis CLI retains B child paths and Lichun parents across timezones and rejects policy conflicts or incomplete inputs without fallback',async()=>setup(async context=>{
  const {run,common,directory}=context,args=[...common,'--synthesis-profile',synthesisProfile];
  const b=replace(replace(args,'--date','2026-04-17'),'--time','01:20'),utc=run(b),seoul=run(b,{tz:'Asia/Seoul'});
  for(const value of [utc,seoul]){assert.equal(value.status,0,value.stderr);assert.equal(value.stderr,'');}
  assert.equal(utc.stdout,seoul.stdout);const bv=JSON.parse(utc.stdout);
  assert.equal(bv.m1.chart.candidates.length,1);assert.equal(bv.researchSynthesis.candidates.length,1);assert.equal(bv.researchSynthesis.candidates[0].paths.length,2);
  const boundary=run(replace(replace(args,'--date','2026-02-05'),'--time','01:20'));assert.equal(boundary.status,0,boundary.stderr);assert.equal(boundary.stderr,'');
  const tv=JSON.parse(boundary.stdout);assert.equal(tv.m1.chart.candidates.length,2);assert.equal(tv.researchSynthesis.candidates.length,2);
  assert.deepEqual(tv.researchSynthesis.candidates.map(item=>[item.candidateRef,item.paths.length]),[['chart.candidates[0]',1],['chart.candidates[1]',1]]);
  for(const flags of [['--synthesis-profile',synthesisProfile],['--seasonal-policy',seasonalPolicy],['--root-policy','AUTO'],['--support-policy','AUTO']])rejection(run([...args,...flags]),context);
  rejection(run(replace(args,'--synthesis-profile','INVALID_DO_NOT_ECHO')),context);
  rejection(run(replace(args,'--m2-profile','INVALID_DO_NOT_ECHO')),context);rejection(run(replace(args,'--m3-profile','INVALID_DO_NOT_ECHO')),context);
  rejection(run(without(args,'--time')),context);rejection(run(without(args,'--clock-policy')),context);
  rejection(run(replace(args,'--manifest-sha','0'.repeat(64))),context);rejection(run(replace(args,'--candidate',join(directory,'MISSING_CANDIDATE'))),context);
}));

test('M4 CLI explicitly selects the month structure profile, keeps solar/lunar meaning and writes no birth files',async()=>setup(async context=>{
  const pattern='M4-ZHENGGUAN-MONTH-STRUCTURE-V01';
  const {run,common,lunar,directory,candidate}=context,beforeFiles=await readdir(directory),beforeHashes=await hashes(candidate);
  const select=args=>[...without(without(args,'--m2-profile'),'--m3-profile'),'--pattern-profile',pattern];
  const gRun=run(select(common)),lRun=run(select(lunar)),sRun=run(select(common),{tz:'Asia/Seoul'});
  for(const r of [gRun,lRun,sRun]){assert.equal(r.error,undefined);assert.equal(r.status,0,r.stderr);assert.equal(r.stderr,'');}
  const g=JSON.parse(gRun.stdout),l=JSON.parse(lRun.stdout);
  assert.equal(g.schemaVersion,'kasi-local-m3-evidence-pattern-v1');assert.equal(g.patternAnalysis.profile.id,pattern);
  assert.deepEqual(g.executionCounts,{birthM1Calls:1,m2Derivations:1,m4Derivations:1});assert.deepEqual(g.m1.chart,l.m1.chart);
  const meaning=v=>v.patternAnalysis.candidates.map(c=>({candidateRef:c.candidateRef,dayMaster:c.dayMaster,
    status:c.candidateAssessment.status,basis:c.candidateAssessment.basis,conditions:c.conditions.map(x=>[x.kind,x.status]),
    effects:c.effects,text:v.patternReport.candidates[c.candidateIndex].items.map(x=>x.text)}));
  assert.deepEqual(meaning(g),meaning(l));assert.equal(gRun.stdout,sRun.stdout);
  assert.equal(g.patternAnalysis.candidates[0].officerPresence.status,'PRESENT');
  assert.equal(g.patternAnalysis.candidates[0].candidateAssessment.status,'NOT_A_CANDIDATE_UNDER_POLICY');
  assert.equal(g.validation.finalStrength,'NOT_IMPLEMENTED');assert.equal(g.validation.g0Receipt,null);assert.equal(g.validation.g1P2Promotion,false);
  const positive=run(replace(select(common),'--date','2026-01-02')),value=JSON.parse(positive.stdout);
  assert.equal(positive.status,0,positive.stderr);assert.equal(value.patternAnalysis.candidates[0].candidateAssessment.status,'STRUCTURAL_CANDIDATE');
  const text=run(replace(replace(select(common),'--date','2026-01-02'),'--output','text'));
  assert.equal(text.status,0,text.stderr);assert.equal(text.stderr,'');assert.match(text.stdout,/정관격 구조 분석/);assert.match(text.stdout,/월지|월령/);assert.match(text.stdout,/후보/);assert.match(text.stdout,/효력|성패/);assert.ok(!text.stdout.startsWith('{'));
  assert.deepEqual(await hashes(candidate),beforeHashes);assert.deepEqual(await readdir(directory),beforeFiles);
}));

test('M4 CLI keeps correlated Lichun candidates and rejects profile conflicts, missing data and forged pins without fallback',async()=>setup(async context=>{
  const pattern='M4-ZHENGGUAN-MONTH-STRUCTURE-V01',args=[...without(without(context.common,'--m2-profile'),'--m3-profile'),'--pattern-profile',pattern];
  const boundary=replace(replace(args,'--date','2026-02-05'),'--time','01:20'),r=context.run(boundary);
  assert.equal(r.status,0,r.stderr);assert.equal(r.stderr,'');const value=JSON.parse(r.stdout);
  assert.equal(value.m1.chart.candidates.length,2);assert.equal(value.patternAnalysis.candidates.length,2);assert.equal(value.patternReport.candidates.length,2);
  // This fictional corpus places Lichun on Feb 5, not the real API's Feb 4.
  // Feb 5 has 庚 day: 丁 is its officer; neither 丑[己癸辛] nor 寅[甲丙戊] contains 丁.
  // The real-API Feb 4 己-day not/candidate contrast is verified separately.
  assert.ok(value.patternAnalysis.candidates.every(c=>c.dayMaster==='庚'));
  assert.deepEqual(value.patternAnalysis.candidates.map(c=>c.monthContext.monthPillar.branch),['丑','寅']);
  assert.deepEqual(value.patternAnalysis.candidates.map(c=>c.candidateAssessment.status),['NOT_A_CANDIDATE_UNDER_POLICY','NOT_A_CANDIDATE_UNDER_POLICY']);
  for(let i=0;i<2;i++)for(const item of value.patternReport.candidates[i].items)assert.equal(item.candidateRef,'chart.candidates['+i+']');
  const text=context.run(replace(boundary,'--output','text'));assert.equal(text.status,0,text.stderr);assert.match(text.stdout,/후보 1/);assert.match(text.stdout,/후보 2/);
  for(const extra of [['--pattern-profile',pattern],['--m2-profile','INVALID_DO_NOT_ECHO'],['--m3-profile','INVALID_DO_NOT_ECHO']])rejection(context.run([...args,...extra]),context);
  rejection(context.run(replace(args,'--pattern-profile','INVALID_DO_NOT_ECHO')),context);
  rejection(context.run(without(args,'--time')),context);
  rejection(context.run(replace(args,'--manifest-sha','0'.repeat(64))),context);
  rejection(context.run(replace(args,'--candidate',join(context.directory,'MISSING_CANDIDATE'))),context);
}));
