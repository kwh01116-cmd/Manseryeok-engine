// Fictional calendar connection tests; these do not certify calendar data or prediction.
import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {spawnSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';
import {createLocalChartProfile,STAGE_A_PROFILE_ID} from '../scripts/kasi/local-chart.mjs';
import {createLocalM3EvidenceProfile,M3_SYNTHESIS_PROFILE_ID} from '../scripts/kasi/local-m3-evidence.mjs';
import {createLocalLuckProfile,M7_LUCK_POLICY_V01} from '../scripts/kasi/local-luck.mjs';
import {CALENDAR_PROJECTION_POLICY_V02} from '../scripts/kasi/local-luck-projection.mjs';
import {WEIGHTED_SUPPORT_POLICY_ID} from '../scripts/experimental/weighted-support.mjs';
import {createLocalAnalysisReportProfile,validateLocalAnalysisReportResult,validateLocalAnalysisReport,renderLocalAnalysisReportText,parseLocalAnalysisReportArgs,LOCAL_ANALYSIS_REPORT_PROFILE_ID,LOCAL_ANALYSIS_REPORT_METADATA} from '../scripts/kasi/local-analysis-report.mjs';
import {syntheticLocalChartCandidate,sealSyntheticLocalChartCandidate,writeSyntheticLocalChartCandidate,chartRequest} from './fixtures/kasi-local-chart-synthetic.mjs';

const fixture=syntheticLocalChartCandidate(),settings={reportProfileId:LOCAL_ANALYSIS_REPORT_PROFILE_ID};
const chart=()=>createLocalChartProfile(fixture.loaded,{profileId:STAGE_A_PROFILE_ID,expectedManifestSha256:fixture.expectedManifestSha256});
const pipeline=(base=chart(),options={})=>createLocalAnalysisReportProfile(base,{...settings,...options});
const section=(r,id)=>r.report.sections.find(s=>s.id===id);
const valid=r=>{assert.equal(r.status,'REPORT_ONLY');assert.equal(validateLocalAnalysisReportResult(r),true);assert.equal(validateLocalAnalysisReport(structuredClone(r.report),r),true);return r;};
const luck={luckPolicyId:M7_LUCK_POLICY_V01,features:{dayun:{traditionalSex:'MALE',count:3},seyun:{yearLabel:2027,queryMinute:'2026-02-05T01:20'}},calendarProjectionPolicyId:CALENDAR_PROJECTION_POLICY_V02,asOfMinute:'2026-11-01T12:00'};
const args=(directory='SYNTHETIC_PATH_NOT_LOADED_BY_PARSER')=>['--candidate',directory,'--manifest-sha',fixture.expectedManifestSha256,'--profile',STAGE_A_PROFILE_ID,'--calendar','GREGORIAN','--date','2026-06-01','--time','12:00','--clock-policy','KR_API_PUBLISHED_KST_MODERN_1988_POST_DST_V1','--day-rollover','CIVIL_MIDNIGHT','--hour-stem-reference','SELECTED_DAY_PILLAR','--report-profile',LOCAL_ANALYSIS_REPORT_PROFILE_ID,'--output','json'];
const lunarRequest=(date,time='12:00',dayRollover='CIVIL_MIDNIGHT',hourStemReference='SELECTED_DAY_PILLAR')=>{const d=fixture.loaded.candidate.dates.find(r=>r.solarDate===date);return {calendar:'KOREAN_LUNAR',lunarDate:{lunarYear:d.lunarYear,lunarMonth:d.lunarMonth,lunarDay:d.lunarDay,leap:d.leap},time,policies:chartRequest(date,time,dayRollover,hourStemReference).policies};};

test('report profile is explicit, publishes exact lower policies and rejects conflicts before calculation',()=>{
  const base=chart();let calls=0;const spy={calculate(r){calls++;return base.calculate(r);}};
  for(const reportProfileId of [undefined,'AUTO','DEFAULT'])assert.throws(()=>createLocalAnalysisReportProfile(spy,{reportProfileId,contextProfile:base}));
  for(const [key,value]of [['m2ProfileId','AUTO'],['m3ProfileId','AUTO'],['seasonalPolicyId','AUTO'],['rootPolicyId','AUTO'],['supportPolicyId','AUTO'],['synthesisProfileId','AUTO'],['innerPatternProfileId','AUTO'],['patternProfileId','AUTO'],['experimentalPolicyId','AUTO']])assert.throws(()=>createLocalAnalysisReportProfile(spy,{...settings,contextProfile:base,[key]:value}));
  assert.equal(calls,0);
  assert.deepEqual(LOCAL_ANALYSIS_REPORT_METADATA.dependencies.map(p=>p.kind),['m2Profile','m3Profile','seasonal','root','support','limitedSynthesis','innerPatterns']);
  const r=valid(pipeline(spy,{contextProfile:base}).calculate(chartRequest()));assert.equal(calls,1);
  assert.equal(r.weighted,null);assert.equal(r.m7,null);assert.equal(r.projection,null);
  assert.ok(section(r,'LUCK_TIME_AXIS').items.some(i=>i.data?.status==='NOT_REQUESTED'));
  assert.ok(section(r,'SEASON_ROOT_AND_LIMITS').items.some(i=>i.id==='weighted-not-requested'));
  assert.equal(r.validation.m3FinalInterpretationGate,'BLOCKED_UNCHANGED');assert.equal(r.validation.m5,'NOT_IMPLEMENTED');
});

test('all six Korean sections expose eight surface slots separately from hidden members and ten gods',()=>{
  const r=valid(pipeline().calculate(chartRequest()));
  assert.deepEqual(r.report.sections.map(s=>s.id),['PILLARS','ELEMENTS_AND_TEN_GODS','INNER_PATTERNS','SEASON_ROOT_AND_LIMITS','LUCK_TIME_AXIS','OVERALL_SUMMARY']);
  const count=section(r,'ELEMENTS_AND_TEN_GODS').items.find(i=>i.id.endsWith('#surface-element-counts'));
  // 丙午 癸巳 丙午 甲午: 6 fire + 1 water + 1 wood; hidden 戊/己/庚 are excluded.
  assert.deepEqual(count.data.counts,{WOOD:1,FIRE:6,EARTH:0,METAL:0,WATER:1});assert.equal(count.data.total,8);assert.equal(count.data.hiddenStemsIncluded,false);
  assert.equal(r.innerPatterns.candidates[0].patterns.length,8);
  assert.equal(section(r,'ELEMENTS_AND_TEN_GODS').items.filter(i=>i.text.includes('천간')&&i.text.includes('분류는')).length,3);
  assert.equal(section(r,'ELEMENTS_AND_TEN_GODS').items.filter(i=>i.text.includes('장간은 다음')).length,4);
  const text=renderLocalAnalysisReportText(r);
  for(const label of ['丙午(병오)','癸巳(계사)','일간은 丙','양·화(火)','무가중 표면 개수','실제 힘','장간','경쟁 후보','요청하지 않았습니다','계속 보류','상세 판단'])assert.ok(text.includes(label),label);
  assert.doesNotMatch(text,/^  근거:|MAIN_QI_|PEER_MAIN_/m,'readable text keeps detailed references and raw statuses in JSON');
  const summary=section(r,'OVERALL_SUMMARY').items[0];assert.equal((summary.text.match(/\.(?:\s|$)/g)??[]).length,6);assert.ok(summary.refs.length>=4);
  for(const literal of ['丙 일간(양·화(火))과 巳월','주 후보 미정','여름 왕(旺)','직접 근은 있습니다','좁은 신약 충분조건 범위 밖'])assert.ok(summary.text.includes(literal),literal);
});

test('M7 and projection consume the same issued M1 once and preserve the legacy M3 and M7 results',()=>{
  const base=chart();let calls=0;const spy={calculate(r){calls++;return base.calculate(r);}};
  const request=chartRequest(),r=valid(pipeline(spy,{contextProfile:base}).calculate(request,luck));assert.equal(calls,1);
  assert.equal(r.m7.m1,r.existing.m1);assert.equal(r.m7.baseExplanation,null);assert.equal(r.projection.m7,r.m7);
  assert.deepEqual(r.executionCounts,{birthM1Calls:1,m2Derivations:1,m3Derivations:1,innerPatternDerivations:1,m7IssuedResultReads:1,m7BirthM1Recalculations:0});
  assert.deepEqual(r.existing,createLocalM3EvidenceProfile(base,{synthesisProfileId:M3_SYNTHESIS_PROFILE_ID}).calculate(request));
  assert.deepEqual(r.m7,createLocalLuckProfile(base,{luckPolicyId:M7_LUCK_POLICY_V01}).calculate(request,luck.features));
  const timeline=section(r,'LUCK_TIME_AXIS');assert.equal(timeline.items.filter(i=>i.id.startsWith('independent-seyun-')).length,2);
  assert.equal(timeline.items.find(i=>i.id.endsWith('#sequence-table')).data.rows.length,3);
  assert.match(renderLocalAnalysisReportText(r),/2027-08-08T04:00/);
  const summary=section(r,'OVERALL_SUMMARY').items[0].text;assert.match(summary,/順|순행/);assert.match(summary,/甲午부터/);assert.match(summary,/2027-08-08T04:00/);assert.match(summary,/2027년 독립 세운 라벨 丁未/);
});

test('Lichun parents stay correlated and independent annual-query alternatives do not multiply natal candidates',()=>{
  const r=valid(pipeline().calculate(chartRequest('2026-02-05','01:20'),luck));
  assert.equal(r.existing.m1.chart.candidates.length,2);assert.equal(r.innerPatterns.candidates.length,2);assert.equal(r.m7.luck.candidates.length,2);
  assert.equal(r.m7.luck.seyun.atMinute.entries.length,2);
  assert.deepEqual(r.m7.luck.candidates.map(c=>c.dayun.direction.direction),['REVERSE','FORWARD']);
  assert.equal(section(r,'LUCK_TIME_AXIS').items.filter(i=>i.id==='independent-seyun-atMinute').length,1);
  const summary=section(r,'OVERALL_SUMMARY').items[0].text;assert.match(summary,/후보 1:.*丑월/);assert.match(summary,/후보 2:.*寅월/);assert.match(summary,/역행 대운/);assert.match(summary,/순행 대운/);
  for(let i=0;i<2;i++){assert.equal(r.innerPatterns.candidates[i].candidateRef,'chart.candidates['+i+']');assert.equal(r.existing.seasonal.candidates[i].candidateRef,'chart.candidates['+i+']');}
  const referenceIndex=new Map(r.report.references.map(ref=>[ref.id,ref]));
  for(const s of r.report.sections)for(const item of s.items)for(const id of item.refs){const ref=referenceIndex.get(id);assert.ok(ref);if(item.candidateRef)assert.ok(ref.candidateRef===item.candidateRef||ref.candidateRef===null);}
});

test('derived seasonal B minute retains two alternatives inside one parent and one inner8 result',()=>{
  const r=valid(pipeline().calculate(chartRequest('2026-04-17','01:20')));
  assert.equal(r.existing.m1.chart.candidates.length,1);assert.equal(r.innerPatterns.candidates.length,1);
  const seasonal=section(r,'SEASON_ROOT_AND_LIMITS').items.find(i=>i.id.endsWith('#seasonal'));
  assert.equal(seasonal.data.status,'AMBIGUOUS');assert.equal(seasonal.data.alternatives.length,2);
  assert.ok(seasonal.data.alternatives.every(a=>a.parentCandidateRef==='chart.candidates[0]'));
  assert.deepEqual(seasonal.data.alternatives.map(a=>a.season),['SPRING','EARTH_DOMINANT']);
  assert.equal(r.existing.researchSynthesis.candidates[0].paths.length,2);
  assert.equal(section(r,'INNER_PATTERNS').items.filter(i=>i.id.endsWith('#inner-selection')).length,1);
  assert.match(section(r,'OVERALL_SUMMARY').items[0].text,/봄.*토왕.*조건부 대안/);
});

test('incomplete full-year data are rejected before a report can invent a season',()=>{
  const data=structuredClone(fixture.loaded.candidate);data.events=data.events.filter(event=>event.termCode!=='LIXIA');data.audit.solar=data.events.length;
  const missing=sealSyntheticLocalChartCandidate(data,fixture.loaded.sources);
  assert.throws(()=>createLocalChartProfile(missing.loaded,{profileId:STAGE_A_PROFILE_ID,expectedManifestSha256:missing.expectedManifestSha256}),/missing required solar term: 2026:LIXIA/);
});

test('unknown direction-sex only holds dayun and leaves independent seyun calculations available',()=>{
  const p=pipeline();
  const only=valid(p.calculate(chartRequest(),{luckPolicyId:M7_LUCK_POLICY_V01,features:{dayun:{count:3}}}));
  assert.equal(only.m7,null);assert.equal(section(only,'LUCK_TIME_AXIS').items[0].data.status,'INVALID_INPUT');
  const partial=valid(p.calculate(chartRequest(),{luckPolicyId:M7_LUCK_POLICY_V01,features:{dayun:{count:3},seyun:{yearLabel:2027}}}));
  assert.equal(partial.m7.luck.candidates[0].dayun.status,'INVALID_INPUT');assert.equal(partial.m7.luck.seyun.yearLabel.status,'OK');assert.equal(partial.m7.luck.seyun.yearLabel.pillar.stem,'丁');
  const annual=valid(p.calculate(chartRequest(),{luckPolicyId:M7_LUCK_POLICY_V01,features:{seyun:{yearLabel:2027}}}));
  assert.equal(annual.m7.luck.candidates[0].dayun,null);assert.ok(section(annual,'LUCK_TIME_AXIS').items.find(i=>i.id==='dayun-not-requested'));
});

test('calendar queries have no wall-clock defaults and invalid policies or minutes fail before M1',()=>{
  const base=chart();let calls=0;const p=pipeline({calculate(r){calls++;return base.calculate(r);}},{contextProfile:base});
  for(const options of [{asOfMinute:'2026-11-01T12:00'},{luckPolicyId:M7_LUCK_POLICY_V01},{features:{seyun:{yearLabel:2027}}},{...luck,calendarProjectionPolicyId:'AUTO'},{...luck,asOfMinute:'2026-02-30T12:00'},{...luck,asOfMinute:'2026-11-01T24:00'},{...luck,asOfMinute:'2026-11-01'},{...luck,features:{seyun:{queryMinute:'now'}}}])assert.throws(()=>p.calculate(chartRequest(),options));
  assert.equal(calls,0);
  const r=valid(p.calculate(chartRequest(),{luckPolicyId:M7_LUCK_POLICY_V01,features:{dayun:{traditionalSex:'MALE',count:3}}}));
  assert.equal(r.projection,null);assert.equal(r.m7.luck.seyun.atMinute,null);assert.equal(r.m7.luck.candidates[0].dayun.currentDecade.status,'POLICY_UNRESOLVED');
});

test('weighted scoring remains separately explicit and never changes M1-M4 source results',()=>{
  const base=chart(),off=valid(pipeline(base).calculate(chartRequest())),on=valid(pipeline(base,{experimentalPolicyId:WEIGHTED_SUPPORT_POLICY_ID}).calculate(chartRequest()));
  for(const key of ['existing','innerPatterns','innerExplanation','basicExplanation'])assert.deepEqual(on[key],off[key]);
  assert.equal(off.weighted,null);assert.equal(on.weighted.length,1);
  const item=section(on,'SEASON_ROOT_AND_LIMITS').items.find(i=>i.id.endsWith('#weighted'));
  assert.equal(item.data.score.value,on.weighted[0].score.value);assert.match(item.text,/실험 정책/);assert.match(item.text,/연관된 입력/);
  assert.equal((section(on,'OVERALL_SUMMARY').items[0].text.match(/\.(?:\s|$)/g)??[]).length,6);
});

test('all four rollover/hour-reference policies and equivalent lunar input preserve composed semantics',()=>{
  const p=pipeline();
  for(const rollover of ['CIVIL_MIDNIGHT','ZI_START'])for(const reference of ['SELECTED_DAY_PILLAR','CIVIL_DATE_DAY_PILLAR']){
    const g=valid(p.calculate(chartRequest('2026-06-01','23:30',rollover,reference))),l=valid(p.calculate(lunarRequest('2026-06-01','23:30',rollover,reference)));
    assert.deepEqual(g.existing.m1.chart,l.existing.m1.chart);assert.deepEqual(g.innerPatterns.candidates,l.innerPatterns.candidates);assert.deepEqual(g.report,l.report);
    assert.notEqual(g.existing.m1.evidence.dateConversion.method,l.existing.m1.evidence.dateConversion.method,'equivalent pillars retain the original input-conversion provenance');
    assert.match(renderLocalAnalysisReportText(g),new RegExp(rollover));assert.match(renderLocalAnalysisReportText(g),new RegExp(reference));
  }
});

test('issued report identity, text, candidate and target references reject cloning and substitution',()=>{
  const p=pipeline(),r=valid(p.calculate(chartRequest('2026-02-05','01:20'),luck));
  assert.throws(()=>validateLocalAnalysisReportResult(structuredClone(r)));
  assert.throws(()=>{r.report.sections[0].items[0].text='격국 성패 확정';},TypeError);
  for(const mutate of [v=>{v.sections[0].items[0].text='길흉 예측 인증';},v=>{v.sections[0].items[0].candidateRef='chart.candidates[1]';},v=>{v.sections[0].items[0].refs=['M2:NONEXISTENT'];},v=>{v.references[0].valuePath='m7.luck.seyun.atMinute';},v=>{v.sections[3].items[0].data.alternatives[0].parentCandidateRef='chart.candidates[1]';},v=>{v.sections.pop();}]){const view=structuredClone(r.report);mutate(view);assert.throws(()=>validateLocalAnalysisReport(view,r));}
  assert.throws(()=>validateLocalAnalysisReport(r.report,p.calculate(chartRequest())));
  assert.deepEqual(p.calculate(chartRequest('2026-02-05','01:20'),luck),r);
});

test('CLI parser keeps explicit report policy, birth and optional luck choices without guessing',()=>{
  const options=parseLocalAnalysisReportArgs(args());assert.equal(options.reportProfileId,LOCAL_ANALYSIS_REPORT_PROFILE_ID);assert.deepEqual(options.luckOptions,{});
  const annual=parseLocalAnalysisReportArgs([...args(),'--luck-profile',M7_LUCK_POLICY_V01,'--seyun-year','2027']);assert.deepEqual(annual.luckOptions.features,{seyun:{yearLabel:2027}});
  const missingSex=parseLocalAnalysisReportArgs([...args(),'--luck-profile',M7_LUCK_POLICY_V01,'--dayun','true','--dayun-count','3']);assert.deepEqual(missingSex.luckOptions.features,{dayun:{count:3}});
  for(const rest of [['--report-profile','AUTO'],['--output','auto'],['--experimental-policy','AUTO'],['--calendar-projection',CALENDAR_PROJECTION_POLICY_V02],['--as-of-date','2026-11-01'],['--luck-profile',M7_LUCK_POLICY_V01,'--query-minute','2026-11-01'],['--m2-profile','m2-basic-classification-local-v1']])assert.throws(()=>parseLocalAnalysisReportArgs([...args(),...rest]));
});

test('standalone CLI emits deterministic JSON/TEXT in UTC and Seoul and keeps rejected input off stdout',async()=>{
  const directory=await mkdtemp(join(tmpdir(),'integrated-report-synthetic-'));
  try{
    await writeSyntheticLocalChartCandidate(directory,fixture);const input=args(directory),cli=new URL('../scripts/kasi/local-analysis-report.mjs',import.meta.url);
    const run=(a,tz)=>spawnSync(process.execPath,[fileURLToPath(cli),...a],{encoding:'utf8',env:{...process.env,TZ:tz},maxBuffer:8*1024*1024});
    const utc=run(input,'UTC'),seoul=run(input,'Asia/Seoul');assert.equal(utc.status,0,utc.stderr);assert.equal(utc.stderr,'');assert.equal(seoul.status,0,seoul.stderr);assert.equal(utc.stdout,seoul.stdout);
    const json=JSON.parse(utc.stdout);assert.equal(json.status,'REPORT_ONLY');assert.equal(json.report.sections.length,6);
    const textInput=[...input];textInput[textInput.indexOf('--output')+1]='text';const text=run(textInput,'UTC');assert.equal(text.status,0,text.stderr);assert.match(text.stdout,/1\. 사주/);assert.match(text.stdout,/6\. 종합 요약/);
    const bad=[...input];bad[bad.indexOf('--time')+1]='UNKNOWN';const denied=run(bad,'UTC');assert.notEqual(denied.status,0);assert.equal(denied.stdout,'');assert.doesNotMatch(denied.stderr,/2026-06-01|integrated-report-synthetic|UNKNOWN|file:/);assert.equal(JSON.parse(denied.stderr).status,'REJECTED');
  }finally{await rm(directory,{recursive:true,force:true});}
});
