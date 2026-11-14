import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp,readFile,rm,writeFile} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join,resolve,sep} from 'node:path';
import {pathToFileURL} from 'node:url';
import {spawnSync} from 'node:child_process';
import {createLocalChartProfile,MODERN_PROFILE_ID,STAGE_A_PROFILE_ID} from '../scripts/kasi/local-chart.mjs';
import {syntheticModernLocalChartCandidate,syntheticLocalChartCandidate,writeSyntheticLocalChartCandidate,chartRequest} from './fixtures/kasi-local-chart-synthetic.mjs';
import {PRODUCT_REPORT_PROFILE_ID,PRODUCT_REPORT_METADATA,createLocalProductReportProfile,parseLocalProductReportArgs,validateLocalProductReportResult,validateLocalProductReport,renderLocalProductReportText} from '../scripts/kasi/local-product-report.mjs';
import {M5_LIMITED_PURPOSE_POLICY_ID} from '../dist/m5/limitedPurposeV1.js';
import {MONTHLY_LUCK_POLICY_ID} from '../scripts/kasi/local-monthly-luck.mjs';
import {M7_LUCK_POLICY_V01} from '../scripts/kasi/local-luck.mjs';
import {createLocalAnalysisReportProfile,LOCAL_ANALYSIS_REPORT_PROFILE_ID} from '../scripts/kasi/local-analysis-report.mjs';
const opts={reportProfileId:PRODUCT_REPORT_PROFILE_ID,m5PolicyId:M5_LIMITED_PURPOSE_POLICY_ID};
const modern=syntheticModernLocalChartCandidate(),small=syntheticLocalChartCandidate();
const chart=(fixture=modern)=>createLocalChartProfile(fixture.loaded,{profileId:fixture===modern?MODERN_PROFILE_ID:STAGE_A_PROFILE_ID,expectedManifestSha256:fixture.expectedManifestSha256});
const profile=(base=chart(),extra={})=>createLocalProductReportProfile(base,{...opts,...extra});
const temporal={monthlyOptions:{policyId:MONTHLY_LUCK_POLICY_ID,year:2025,queryMinute:'2026-01-08T12:00'}};
const valid=value=>{assert.equal(value.status,'PRODUCT_ANALYSIS_ONLY');assert.equal(validateLocalProductReportResult(value),true);assert.equal(validateLocalProductReport(structuredClone(value.summary),value),true);return value;};

test('product policies are explicit and invalid selections do not calculate birth M1',()=>{
  let calls=0;const base=chart(),spy={calculate(r){calls++;return base.calculate(r);}};
  for(const reportProfileId of [undefined,'AUTO',LOCAL_ANALYSIS_REPORT_PROFILE_ID])assert.throws(()=>profile(spy,{contextProfile:base,reportProfileId}));
  for(const m5PolicyId of [undefined,'AUTO','STRONG_WEAK_DEFAULT'])assert.throws(()=>profile(spy,{contextProfile:base,m5PolicyId}));
  assert.throws(()=>profile(spy,{contextProfile:base,rootPolicyId:'AUTO'}));
  const p=profile(spy,{contextProfile:base});for(const monthlyOptions of [{year:2025},{policyId:MONTHLY_LUCK_POLICY_ID},{policyId:'AUTO',year:2025},{policyId:MONTHLY_LUCK_POLICY_ID,year:2025.1},{policyId:MONTHLY_LUCK_POLICY_ID,queryMinute:'now'},{policyId:MONTHLY_LUCK_POLICY_ID,queryMinute:'2026-02-30T12:00'}])assert.throws(()=>p.calculate(chartRequest(),{monthlyOptions}));
  assert.throws(()=>p.calculate(chartRequest(),{unknown:true}));assert.equal(calls,0);
  assert.equal(PRODUCT_REPORT_METADATA.m3DefaultPromotion,false);assert.equal(PRODUCT_REPORT_METADATA.m5ExplicitSelectionRequired,true);
});

test('warming candidate and existing-fire HOLD consume actual issued facts without an experimental score',()=>{
  const p=profile(),candidate=valid(p.calculate(chartRequest('1992-11-24','00:30'),temporal)),hold=valid(p.calculate(chartRequest('1992-11-24','12:00'),temporal));
  assert.deepEqual(candidate.base.existing.facts.candidates[0].pillars.map(p=>p.stem+p.branch),['壬申','辛亥','甲辰','甲子']);
  assert.equal(candidate.m5.candidates[0].status,'CANDIDATE_UNDER_POLICY');assert.deepEqual(candidate.m5.candidates[0].candidateElements.map(e=>e.element),['FIRE']);
  assert.equal(hold.m5.candidates[0].status,'HOLD');assert.ok(hold.m5.candidates[0].reasonCodes.includes('PRESENT_WARMING_ELEMENT_EFFECT_UNASSESSED'));assert.deepEqual(hold.m5.candidates[0].candidateElements,[]);
  assert.equal(candidate.base.weighted,null);assert.equal(hold.base.weighted,null);
  assert.ok(renderLocalProductReportText(candidate).includes('화(火)를 온기 검토 후보'));assert.ok(renderLocalProductReportText(hold).includes('이미 화(火)가 확인'));
  const outside=valid(p.calculate(chartRequest('2026-06-01')));assert.equal(outside.m5.candidates[0].status,'HOLD');assert.ok(outside.m5.candidates[0].reasonCodes.includes('OUTSIDE_WINTER_WOOD_SCOPE'));
});

test('summary and detailed views share seven sections and every sentence traces existing data',()=>{
  const r=valid(profile().calculate(chartRequest('1992-11-24','00:30'),temporal)),summary=renderLocalProductReportText(r),detailed=renderLocalProductReportText(r,{detail:'detailed'});
  assert.equal(r.summary.sections.length,7);assert.equal(r.detailed.summary,r.summary);assert.ok(detailed.startsWith(summary));
  for(const item of r.summary.sections.flatMap(s=>s.items)){assert.ok(item.refs.length>0);assert.ok(detailed.includes(item.text));for(const id of item.refs)assert.ok(r.summary.references.some(ref=>ref.id===id));}
  assert.doesNotMatch(summary,/8ffadb|KASI-LOCAL|M5-WINTER|manifest|schemaVersion|ruleRefs|sourceRefs|MAIN_QI|HOLD_/);
  for(const term of ['사주팔자','일간','공망','목적별 도움 요소 후보','월운','최종 용신','상세 근거'])assert.ok(summary.includes(term),term);
  assert.ok(summary.split('\n').length<50);assert.doesNotMatch(summary,/己은|癸은|正財\)이\s|偏財\)이\s/);
  const changed=structuredClone(r.summary);changed.sections[4].items[0].text='이것이 확정된 최종 용신입니다';assert.throws(()=>validateLocalProductReport(changed,r));
  const refChanged=structuredClone(r.summary);refChanged.references[0].valuePath='m5.candidates[99]';assert.throws(()=>validateLocalProductReport(refChanged,r));
  assert.throws(()=>validateLocalProductReportResult(structuredClone(r)));assert.throws(()=>validateLocalProductReport(r.summary,valid(profile().calculate(chartRequest('2026-01-08')))));
});

test('M1 is called once while M7, monthly and both report views reuse the same birth result',()=>{
  const base=chart();let calls=0;const spy={calculate(request){calls++;return base.calculate(request);}},p=profile(spy,{contextProfile:base});
  const luckOptions={luckPolicyId:M7_LUCK_POLICY_V01,features:{dayun:{traditionalSex:'MALE',count:3},seyun:{yearLabel:2026,queryMinute:'2026-06-01T12:00'}}};
  const r=valid(p.calculate(chartRequest('1992-11-24','00:30'),{...temporal,luckOptions}));
  assert.equal(calls,1);assert.equal(r.base.m7.m1,r.base.existing.m1);assert.equal(r.monthly.executionCounts.birthM1Calls,0);assert.equal(r.executionCounts.birthM1Calls,1);assert.equal(r.executionCounts.m7BirthM1Recalculations,0);
  renderLocalProductReportText(r);renderLocalProductReportText(r,{detail:'detailed'});assert.equal(calls,1);
  const legacy=createLocalAnalysisReportProfile(base,{reportProfileId:LOCAL_ANALYSIS_REPORT_PROFILE_ID}).calculate(chartRequest('1992-11-24','00:30'),luckOptions);
  assert.deepEqual(r.base,legacy,'legacy detailed output remains unchanged under the same explicit choices');
});

test('Lichun parents and seasonal alternatives stay separate from gongmang and independent monthly alternatives',()=>{
  const p=profile(),l=valid(p.calculate(chartRequest('2026-02-05','01:20'),{monthlyOptions:{policyId:MONTHLY_LUCK_POLICY_ID,queryMinute:'2026-02-05T01:20'}}));
  assert.equal(l.base.innerPatterns.candidates.length,2);assert.equal(l.gongmang.length,2);assert.equal(l.m5.candidates.length,2);assert.equal(l.monthly.atMinute.entries.length,2);
  assert.equal(l.summary.sections[5].items.filter(i=>i.id==='monthly-at').length,1);
  l.gongmang.forEach((g,i)=>{assert.equal(g.candidateRef,l.base.existing.facts.candidates[i].id);for(const ref of g.inputFactRefs)assert.ok(l.base.existing.facts.candidates[i].facts.some(f=>f.id===ref));});
  const b=valid(p.calculate(chartRequest('2026-04-17','01:20')));assert.equal(b.base.existing.seasonal.candidates[0].judgment.alternatives.length,2);assert.equal(b.base.innerPatterns.candidates.length,1);assert.equal(b.gongmang.length,1);assert.equal(b.m5.candidates.length,1);
});

test('monthly time tables, data shortage and pre-birth queries are explicit in both views',()=>{
  const p=profile(),r=valid(p.calculate(chartRequest('1992-11-24','00:30'),temporal));assert.equal(r.monthly.yearTable.rows.length,12);assert.ok(r.monthly.yearTable.rows.every(row=>row.status==='RESOLVED_UNDER_POLICY'));
  const missing=valid(p.calculate(chartRequest(),{monthlyOptions:{policyId:MONTHLY_LUCK_POLICY_ID,year:2026,queryMinute:'2027-02-04T12:00'}}));
  assert.equal(missing.monthly.yearTable.rows.filter(row=>row.status==='NEEDS_DATA').length,2);assert.equal(missing.monthly.atMinute.status,'POLICY_UNRESOLVED');assert.ok(renderLocalProductReportText(missing).includes('경계 자료 부족'));
  const before=valid(p.calculate(chartRequest(),{monthlyOptions:{policyId:MONTHLY_LUCK_POLICY_ID,queryMinute:'2026-01-01T12:00'}}));assert.equal(before.monthly.birthLink.queryRelation,'BEFORE_BIRTH');assert.ok(renderLocalProductReportText(before).includes('출생 전'));
  const out=valid(p.calculate(chartRequest(),{monthlyOptions:{policyId:MONTHLY_LUCK_POLICY_ID,year:2027}}));assert.ok(renderLocalProductReportText(out).includes('시계 정책의 범위 밖'));
});

test('equivalent lunar input and four day/hour policies keep reference continuity and monthly independence',()=>{
  const p=profile(),date=modern.loaded.candidate.dates.find(d=>d.solarDate==='1992-11-24');let independent;
  for(const d of ['CIVIL_MIDNIGHT','ZI_START'])for(const h of ['SELECTED_DAY_PILLAR','CIVIL_DATE_DAY_PILLAR']){
    const g=chartRequest('1992-11-24','23:30',d,h),l={calendar:'KOREAN_LUNAR',time:g.time,policies:g.policies,lunarDate:{lunarYear:date.lunarYear,lunarMonth:date.lunarMonth,lunarDay:date.lunarDay,leap:date.leap}},a=valid(p.calculate(g,temporal)),b=valid(p.calculate(l,temporal));
    assert.deepEqual(a.summary,b.summary);assert.deepEqual(a.gongmang,b.gongmang);
    const meaning=value=>value.m5.candidates.map(c=>({status:c.status,reasons:c.reasonCodes,elements:c.candidateElements,dayMaster:c.inputFacts.dayMaster,monthPillar:c.inputFacts.monthPillar,fire:c.existingWarmingLocations}));
    assert.deepEqual(meaning(a),meaning(b));assert.notEqual(a.base.existing.m1.evidence.dateConversion.method,b.base.existing.m1.evidence.dateConversion.method);assert.deepEqual(a.base.existing.m1.evidence.dateConversion.observed,b.base.existing.m1.evidence.dateConversion.observed);
    independent??=a.monthly.atMinute;assert.deepEqual(a.monthly.atMinute,independent);
    assert.deepEqual(a.gongmang[0].dayPillar,{stem:a.base.existing.facts.candidates[0].pillars[2].stem,branch:a.base.existing.facts.candidates[0].pillars[2].branch});
  }
});

test('product CLI keeps explicit policies and clean JSON/TEXT, matching UTC and Seoul',async()=>{
  const temp=await mkdtemp(join(tmpdir(),'manseryeok-product-report-'));try{
    const directory=join(temp,'candidate');await writeSyntheticLocalChartCandidate(directory,small);
    const common=['--candidate',directory,'--manifest-sha',small.expectedManifestSha256,'--profile',STAGE_A_PROFILE_ID,'--calendar','GREGORIAN','--date','2026-01-08','--time','12:00','--clock-policy','KR_API_PUBLISHED_KST_MODERN_1988_POST_DST_V1','--day-rollover','CIVIL_MIDNIGHT','--hour-stem-reference','SELECTED_DAY_PILLAR','--report-profile',PRODUCT_REPORT_PROFILE_ID,'--m5-policy',M5_LIMITED_PURPOSE_POLICY_ID,'--detail','summary'];
    const parsed=parseLocalProductReportArgs([...common,'--output','json']);assert.equal(parsed.detail,'summary');assert.equal(parsed.m5PolicyId,M5_LIMITED_PURPOSE_POLICY_ID);assert.throws(()=>parseLocalProductReportArgs([...common,'--monthly-year','2025','--output','json']));
    const guard=join(temp,'network-guard.mjs');await writeFile(guard,'import http from "node:http";import https from "node:https";import net from "node:net";const no=()=>{throw new Error("NETWORK_DISABLED_IN_PRODUCT_TEST")};globalThis.fetch=no;http.request=no;https.request=no;net.Socket.prototype.connect=no;\n');
    const run=(args,tz)=>{const env={...process.env,TZ:tz};for(const key of Object.keys(env))if(/KASI|API_KEY|SERVICE_KEY|DATAGO/i.test(key))delete env[key];delete env.NODE_OPTIONS;return spawnSync(process.execPath,['--import',pathToFileURL(guard).href,'scripts/kasi/local-product-report.mjs',...args],{cwd:process.cwd(),env,encoding:'utf8',windowsHide:true,maxBuffer:32*1024*1024});};
    const j=run([...common,'--output','json'],'UTC');assert.equal(j.status,0,j.stderr);assert.equal(j.stderr,'');const value=JSON.parse(j.stdout);assert.equal(value.status,'PRODUCT_ANALYSIS_ONLY');
    const detailedJson=run([...common.map(v=>v==='summary'?'detailed':v),'--output','json'],'UTC');assert.equal(detailedJson.status,0,detailedJson.stderr);assert.equal(detailedJson.stdout,j.stdout,'detail selects a text view, not another analysis');
    const a=run([...common,'--output','text'],'UTC'),b=run([...common,'--output','text'],'Asia/Seoul');assert.equal(a.status,0,a.stderr);assert.equal(b.status,0,b.stderr);assert.equal(a.stdout,b.stdout);assert.ok(a.stdout.startsWith('나의 사주 분석 요약'));assert.doesNotMatch(a.stdout,/manifest|8ffadb|M5-WINTER/);
    const invalid=run([...common.map(v=>v==='2026-01-08'?'1988-01-01':v),'--output','json'],'UTC');assert.equal(invalid.status,2);assert.equal(invalid.stdout,'');assert.ok(JSON.parse(invalid.stderr).status);assert.doesNotMatch(invalid.stderr,/1988-01-01|candidate|C:\\/);
  }finally{assert.ok(resolve(temp).startsWith(resolve(tmpdir())+sep));await rm(temp,{recursive:true,force:true});}
});
