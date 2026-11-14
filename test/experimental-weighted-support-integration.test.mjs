// Public continuity tests use generated calendar responses, not private KASI rows.
import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp,writeFile,readFile,readdir,rm} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {tmpdir} from 'node:os';
import {join,resolve,relative,isAbsolute,sep} from 'node:path';
import {pathToFileURL} from 'node:url';
import {spawnSync} from 'node:child_process';
import {createLocalChartProfile,STAGE_A_PROFILE_ID} from '../scripts/kasi/local-chart.mjs';
import {createLocalM3EvidenceProfile,validateLocalM3EvidenceResult,M3_SYNTHESIS_PROFILE_ID,M4_POSITION_PROFILE_ID} from '../scripts/kasi/local-m3-evidence.mjs';
import {createExperimentalWeightedProfile,deriveExperimentalWeightedSupport,validateExperimentalWeightedResult,renderExperimentalWeightedText,WEIGHTED_SUPPORT_POLICY_ID} from '../scripts/experimental/weighted-support.mjs';
import {validateWeightedSupport} from '../dist/experimental/weightedSupportV1.js';
import {syntheticLocalChartCandidate,writeSyntheticLocalChartCandidate,chartRequest} from './fixtures/kasi-local-chart-synthetic.mjs';

const fixture=syntheticLocalChartCandidate(),policyId=WEIGHTED_SUPPORT_POLICY_ID;
const chart=()=>createLocalChartProfile(fixture.loaded,{profileId:STAGE_A_PROFILE_ID,expectedManifestSha256:fixture.expectedManifestSha256});
const profile=base=>createExperimentalWeightedProfile(base,{contextProfile:base,policyId});
const inputFor=(candidate,index)=>({candidateRef:candidate.id,pillars:candidate.pillars.map((p,i)=>({role:p.role,stem:p.stem,branch:p.branch,factRef:`facts.candidates[${index}].pillars[${i}]`}))});

test('experimental product calculates M1 once and preserves a separately calculated legacy reference exactly',()=>{
  const base=chart();let productBirthCalls=0;
  const spy={...base,calculate(request){productBirthCalls++;return base.calculate(request);}};
  const selected=createExperimentalWeightedProfile(spy,{contextProfile:base,policyId});
  const request=chartRequest(),value=selected.calculate(request);
  assert.equal(productBirthCalls,1);
  assert.equal(value.executionCounts.birthM1Calls,1);assert.equal(value.executionCounts.m2Derivations,1);
  assert.equal(value.executionCounts.experimentalCandidateAnalyses,1);
  // This is an explicit comparison calculation outside the product call counter.
  const referenceBase=chart();let referenceBirthCalls=0;
  const referenceSpy={...referenceBase,calculate(input){referenceBirthCalls++;return referenceBase.calculate(input);}};
  const reference=createLocalM3EvidenceProfile(referenceSpy,{contextProfile:referenceBase,positionProfileId:M4_POSITION_PROFILE_ID,synthesisProfileId:M3_SYNTHESIS_PROFILE_ID}).calculate(request);
  assert.equal(referenceBirthCalls,1);assert.equal(productBirthCalls,1);
  assert.equal(JSON.stringify(value.existing),JSON.stringify(reference));
  assert.equal(validateLocalM3EvidenceResult(value.existing),true);
  validateExperimentalWeightedResult(value);
  assert.equal(value.existing.validation.finalStrength,'NOT_IMPLEMENTED');
  assert.equal(value.existing.validation.g0Receipt,null);assert.equal(value.existing.validation.g1P2Promotion,false);
  assert.equal(value.existing.validation.m3FinalInterpretationGate,'BLOCKED_UNCHANGED');
  assert.equal(value.experimental[0].score.totalTenths,85);assert.equal(value.experimental[0].policyClassification,'VERY_STRONG');
  assert.match(renderExperimentalWeightedText(value),/LEVEL 2/);
  assert.match(renderExperimentalWeightedText(value),/기존 결과를 이 점수로 덮어쓰지 않습니다/);
});

test('equivalent calendar inputs and repeated requests preserve scores without mixing source records',()=>{
  const selected=profile(chart()),request=chartRequest(),row=fixture.loaded.candidate.dates.find(r=>r.solarDate===request.date);
  const lunar={calendar:'KOREAN_LUNAR',lunarDate:{lunarYear:row.lunarYear,lunarMonth:row.lunarMonth,lunarDay:row.lunarDay,leap:row.leap},time:request.time,policies:request.policies};
  const gregorian=selected.calculate(request),fromLunar=selected.calculate(lunar);
  assert.equal(gregorian.existing.m1.input.calendar,'GREGORIAN');assert.equal(fromLunar.existing.m1.input.calendar,'KOREAN_LUNAR');
  assert.deepEqual(gregorian.existing.m1.chart,fromLunar.existing.m1.chart);
  assert.deepEqual(gregorian.experimental,fromLunar.experimental);
  assert.deepEqual(selected.calculate(chartRequest('2026-01-08')).experimental.length,1);
  assert.deepEqual(selected.calculate(request),gregorian);
  for(const value of [gregorian,fromLunar]){validateExperimentalWeightedResult(value);assert.equal(value.executionCounts.birthM1Calls,1);}
});

test('seasonal alternatives keep one parent score while actual Lichun parents keep two independent scores',()=>{
  const selected=profile(chart());
  const before=selected.calculate(chartRequest('2026-04-17','01:19'));
  const at=selected.calculate(chartRequest('2026-04-17','01:20'));
  const after=selected.calculate(chartRequest('2026-04-17','01:21'));
  assert.equal(at.existing.seasonal.candidates[0].judgment.alternatives.length,2);
  for(const value of [before,at,after]){assert.equal(value.existing.facts.candidates.length,1);assert.equal(value.experimental.length,1);validateExperimentalWeightedResult(value);}
  assert.deepEqual(before.experimental,at.experimental);assert.deepEqual(at.experimental,after.experimental);
  const lichun=selected.calculate(chartRequest('2026-02-05','01:20'));
  assert.equal(lichun.existing.m1.chart.confidence,'PUBLISHED_MINUTE_AMBIGUOUS');
  assert.equal(lichun.existing.facts.candidates.length,2);assert.equal(lichun.experimental.length,2);
  assert.deepEqual(lichun.experimental.map(r=>r.candidateRef),['chart.candidates[0]','chart.candidates[1]']);
  for(let i=0;i<2;i++)validateWeightedSupport(lichun.experimental[i],inputFor(lichun.existing.facts.candidates[i],i),{policyId});
  assert.equal(lichun.executionCounts.birthM1Calls,1);assert.equal(lichun.executionCounts.experimentalCandidateAnalyses,2);
});

test('wrong policy rejects before M1 and serialized or crossed issuance and references reject',()=>{
  const base=chart();let calls=0;const spy={...base,calculate(request){calls++;return base.calculate(request);}};
  for(const invalid of [undefined,'AUTO','M3-ROOT-PRESENCE-HIDDEN-SAME-ELEMENT-V01'])assert.throws(()=>createExperimentalWeightedProfile(spy,{contextProfile:base,policyId:invalid}),/EXPLICIT_EXPERIMENTAL_POLICY_REQUIRED/);
  assert.equal(calls,0);
  const selected=createExperimentalWeightedProfile(spy,{contextProfile:base,policyId}),a=selected.calculate(chartRequest()),b=selected.calculate(chartRequest('2026-02-05','01:20'));
  assert.throws(()=>deriveExperimentalWeightedSupport(structuredClone(a.existing.facts),{policyId}));
  assert.throws(()=>validateExperimentalWeightedResult(structuredClone(a)));
  assert.throws(()=>validateExperimentalWeightedResult({...a,experimental:b.experimental}));
  assert.throws(()=>validateExperimentalWeightedResult({...a,existing:b.existing}));
  const changed=structuredClone(a.experimental[0]);changed.score.totalTenths=0;
  assert.throws(()=>validateWeightedSupport(changed,inputFor(a.existing.facts.candidates[0],0),{policyId}));
  assert.throws(()=>validateWeightedSupport(b.experimental[0],inputFor(b.existing.facts.candidates[1],1),{policyId}));
  const crossed=inputFor(b.existing.facts.candidates[1],1);crossed.pillars[0].factRef='facts.candidates[0].pillars[0]';
  assert.throws(()=>validateWeightedSupport(b.experimental[1],crossed,{policyId}),/CROSS_CANDIDATE_FACT_REFERENCE/);
  assert.deepEqual(selected.calculate(chartRequest()).experimental,a.experimental);
});

test('experimental CLI uses a pinned synthetic candidate offline with clean JSON, text and fail-closed inputs',async()=>{
  const directory=await mkdtemp(join(tmpdir(),'experimental-weighted-synthetic-')),repo=resolve(import.meta.dirname,'..');
  const hashes=async path=>Object.fromEntries(await Promise.all((await readdir(path)).sort().map(async name=>[name,createHash('sha256').update(await readFile(join(path,name))).digest('hex')])));
  try{
    const candidate=join(directory,'SYNTHETIC_CANDIDATE');await writeSyntheticLocalChartCandidate(candidate,fixture);
    const loader=join(directory,'deny-loader.mjs'),guard=join(directory,'deny-network-now.mjs');
    await writeFile(loader,`const forbidden=new Set(['koreaSolarTermFixtures.js','koreanLunisolarFixtures.js','trustedKoreanPreview.js','research.mjs','collector.js']);const denied=v=>forbidden.has(decodeURIComponent(v).replaceAll(String.fromCharCode(92),'/').split('/').at(-1).split('?')[0].split('#')[0]);export async function resolve(s,c,next){if(denied(s))throw Error('FIXTURE_FALLBACK_FORBIDDEN');const r=await next(s,c);if(denied(r.url))throw Error('FIXTURE_FALLBACK_FORBIDDEN');return r;}`);
    await writeFile(guard,`import net from 'node:net';import {register} from 'node:module';net.Socket.prototype.connect=function(){throw Error('NETWORK_FORBIDDEN')};globalThis.fetch=function(){throw Error('NETWORK_FORBIDDEN')};const NativeDate=Date;globalThis.Date=class extends NativeDate{constructor(...a){if(!a.length)throw Error('IMPLICIT_NOW_FORBIDDEN');super(...a);}static now(){throw Error('IMPLICIT_NOW_FORBIDDEN')}};register(new URL('./deny-loader.mjs',import.meta.url));`);
    const env={...process.env};for(const key of Object.keys(env))if(/KASI|API_KEY|SERVICE_KEY|DATAGO|TOKEN|SECRET|PASSWORD|PROXY/i.test(key))delete env[key];delete env.NODE_OPTIONS;
    const entry=join(repo,'scripts/experimental/weighted-support.mjs');
    const args=['--profile',STAGE_A_PROFILE_ID,'--candidate',candidate,'--manifest-sha',fixture.expectedManifestSha256,'--calendar','GREGORIAN','--date','2026-06-01','--time','12:00','--clock-policy','KR_API_PUBLISHED_KST_MODERN_1988_POST_DST_V1','--day-rollover','CIVIL_MIDNIGHT','--hour-stem-reference','SELECTED_DAY_PILLAR','--experimental-policy',policyId,'--output','json'];
    const run=(values,{tz='UTC',file=entry}={})=>spawnSync(process.execPath,['--import',pathToFileURL(guard).href,file,...values],{cwd:repo,encoding:'utf8',env:{...env,TZ:tz},timeout:30000,maxBuffer:14_000_000});
    const replace=(values,flag,value)=>{const copy=[...values];copy[copy.indexOf(flag)+1]=value;return copy;};
    const beforeFiles=await readdir(directory),beforeHashes=await hashes(candidate),utc=run(args),seoul=run(args,{tz:'Asia/Seoul'});
    for(const result of [utc,seoul]){assert.equal(result.error,undefined);assert.equal(result.status,0,result.stderr);assert.equal(result.stderr,'');}
    assert.equal(utc.stdout,seoul.stdout);
    const value=JSON.parse(utc.stdout);assert.equal(value.schemaVersion,'experimental-local-analysis-comparison-v1');assert.equal(value.executionCounts.birthM1Calls,1);assert.equal(value.experimental[0].score.totalTenths,85);
    assert.equal(value.existing.m1.dataset.candidateManifestContentSha256,fixture.expectedManifestSha256);
    const text=run(replace(args,'--output','text'));assert.equal(text.status,0,text.stderr);assert.equal(text.stderr,'');assert.match(text.stdout,/LEVEL 2/);assert.match(text.stdout,/8\.5\/10/);assert.match(text.stdout,/기존 M3 경로/);
    for(const invalid of [replace(args,'--experimental-policy','AUTO'),replace(args,'--manifest-sha','0'.repeat(64)),replace(args,'--candidate',join(directory,'MISSING_CANDIDATE'))]){const result=run(invalid);assert.equal(result.error,undefined);assert.equal(result.status,1);assert.equal(result.stdout,'');assert.equal(result.stderr,'EXPERIMENTAL_REQUEST_DATA_OR_POLICY_REJECTED\n');assert.ok(!result.stderr.includes(candidate));}
    assert.deepEqual(await readdir(directory),beforeFiles);assert.deepEqual(await hashes(candidate),beforeHashes);
    const probe=join(directory,'probe.mjs');await writeFile(probe,`import net from 'node:net';let blocked=0;for(const f of [()=>fetch('https://example.invalid'),()=>new net.Socket().connect({host:'127.0.0.1',port:9}),()=>new Date(),()=>Date.now()]){try{f()}catch(e){if(['NETWORK_FORBIDDEN','IMPLICIT_NOW_FORBIDDEN'].includes(e.message))blocked++;else throw e;}}console.log('BLOCKED:'+blocked);`);
    const blocked=run([],{file:probe});assert.equal(blocked.status,0,blocked.stderr);assert.equal(blocked.stdout,'BLOCKED:4\n');
    const fallback=join(directory,'fallback.mjs');await writeFile(fallback,`import ${JSON.stringify(pathToFileURL(join(repo,'dist/calendar/koreaSolarTermFixtures.js')).href)};`);
    const denied=run([],{file:fallback});assert.equal(denied.status,1);assert.match(denied.stderr,/FIXTURE_FALLBACK_FORBIDDEN/);
  }finally{
    const within=relative(resolve(tmpdir()),resolve(directory));assert.ok(within&&!within.startsWith('..'+sep)&&!isAbsolute(within));
    await rm(directory,{recursive:true,force:true});
  }
});
