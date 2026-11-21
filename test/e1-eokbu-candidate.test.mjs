import test from 'node:test';
import assert from 'node:assert/strict';
import {assessProductStrength, PRODUCT_STRENGTH_POLICY_ID} from '../dist/e1/productStrengthV1.js';
import {deriveEokbuCandidate, EOKBU_POLICY_ID, eokbuCauseRoutes} from '../dist/e1/eokbuCandidateV1.js';
import {deriveM3Evidence, M3_EVIDENCE_PROFILE_ID} from '../dist/m3/structuralEvidenceV1.js';
import {deriveM4InnerPatterns, M4_INNER_PATTERN_PROFILE_ID} from '../dist/m4/innerPatternsV1.js';
import {resolveSeasonalSiliState, M3_SEASONAL_SILI_METADATA, M3_SEASONAL_SILI_POLICY_ID} from '../dist/m3/seasonalStateV2.js';
import {deriveM5LimitedPurpose, M5_LIMITED_PURPOSE_POLICY_ID} from '../dist/m5/limitedPurposeV1.js';
import {structuralM2Unit} from './fixtures/m3-structural-unit-input.mjs';
import {cases} from './fixtures/e1-eokbu-contract-v1.mjs';

const roles = ['year','month','day','hour'];
function strengthFor(pillars, i=0) {
  return assessProductStrength({candidateRef:`chart.candidates[${i}]`, pillars:pillars.map(([stem,branch],j) => ({
    role:roles[j],stem,branch,factRef:`facts.candidates[${i}].pillars[${j}]`,
  }))},{policyId:PRODUCT_STRENGTH_POLICY_ID});
}
const run = (s, context) => deriveEokbuCandidate(s,{profileId:EOKBU_POLICY_ID,context});

for (const c of cases) test('E1 억부 수기 구성 사례 '+c.id, () => {
  const s = strengthFor(c.pillars), result = run(s);
  assert.equal(s.score.supportUnits, c.support*100);
  assert.equal(result.status,c.status);
  assert.deepEqual(result.causes.map(x=>x.family),c.causes);
  assert.equal(result.primary?.family??null,c.primary);
  assert.deepEqual(result.holdReasons,c.hold?[c.hold]:[]);
  assert.ok(result.ruleRefs.includes('E1-EOKBU-DIRECTION-GATE'));
  if (c.hold) assert.ok(result.ruleRefs.includes('E1-EOKBU-HOLD-'+c.hold));
  if (c.leaders) assert.deepEqual(result.candidates.map(x=>x.family),c.leaders);
  assert.ok(Object.isFrozen(result));
  assert.equal(result.climateComparison.status,'NOT_EVALUATED');
});

test('E1 억부 원인 500단위 포함, 502단위 제외, 장간·표면·부재 경로 우선순위와 공동 원인 합류',()=>{
  const runRoutes = (grade, roleUnits, surfaceOrMain, other=[]) => eokbuCauseRoutes(grade,roleUnits,[
    ...surfaceOrMain.map(family=>({family,presence:'SURFACE_OR_MAIN'})),
    ...other.map(family=>({family,presence:'OTHER_HIDDEN_ONLY'})),
  ]);
  const tied={PEER:3300,RESOURCE:2800,OUTPUT:1900,WEALTH:1000,OFFICER:1000};
  const families = r => r.map(c=>c.nominatedFamily);
  assert.deepEqual(families(runRoutes('STRONG',tied,['WEALTH','OUTPUT'])),['OUTPUT','WEALTH']);
  assert.deepEqual(families(runRoutes('STRONG',{...tied,PEER:3301,RESOURCE:2799},['WEALTH','OUTPUT'])),['OUTPUT']);
  const peer={...tied,PEER:4000,RESOURCE:2100};
  assert.deepEqual(families(runRoutes('STRONG',peer,['OFFICER'],['OUTPUT'])),['OFFICER']);
  assert.deepEqual(families(runRoutes('STRONG',peer,[],['OUTPUT'])),['OUTPUT']);
  assert.deepEqual(families(runRoutes('STRONG',{...tied,PEER:2100,RESOURCE:4000},['OFFICER'])),[null]);
  const weak={PEER:1000,RESOURCE:1000,OUTPUT:3500,OFFICER:3500,WEALTH:1000};
  assert.deepEqual(families(runRoutes('WEAK',weak,['RESOURCE'])),['RESOURCE','RESOURCE']);
  assert.deepEqual(families(runRoutes('WEAK',{...weak,OUTPUT:1000,OFFICER:1000,WEALTH:6000},['RESOURCE'],['PEER'])),['RESOURCE']);
});

test('E1 구성상 근을 공유하는 투출은 지지 위치·단위를 복제하지 않는다',()=>{
  const result=run(strengthFor(['庚子','甲子','甲寅','甲戌']));
  const peer=result.placements.find(c=>c.family==='PEER');
  assert.deepEqual(peer.hidden.map(c=>[c.stem,c.pillar]),[['甲','day']]);
  assert.equal(peer.rootLinks.length,2);
  assert.ok(peer.rootLinks.every(l=>l.match==='EXACT_STEM'));
  assert.equal(new Set(peer.rootLinks.map(l=>l.hiddenRef)).size,1);
  assert.equal(result.factRefs.length,new Set(result.factRefs).size);
});

test('E1 기준을 고정한 4점/6점 공동 원인 대조는 같은 강약 등급에서 바뀐 후보 집합을 표시한다',()=>{
  const s=strengthFor(['丁未','甲子','甲寅','己卯']);
  assert.equal(s.grade,'STRONG');
  assert.equal(s.roleUnits.PEER,3600);
  assert.equal(s.roleUnits.RESOURCE,3000);
  const result=run(s);
  assert.equal(result.primary.family,'OUTPUT');
  assert.equal(result.candidateSensitivity.status,'SENSITIVE_TO_POLICY');
  assert.deepEqual(result.candidateSensitivity.probes.map(p=>p.leadingFamilies),[['OUTPUT'],['OUTPUT','WEALTH']]);
  assert.equal(run(strengthFor(cases.find(c=>c.id==='extreme').pillars)).candidateSensitivity.status,'NOT_APPLICABLE');
});

function siblings(pillars, term='DAXUE') {
  const m2Facts=structuralM2Unit([pillars],{monthTerms:[term]});
  const evidence=deriveM3Evidence(m2Facts,{policyId:M3_EVIDENCE_PROFILE_ID});
  const innerPatterns=deriveM4InnerPatterns(evidence,{profileId:M4_INNER_PATTERN_PROFILE_ID,m2Facts});
  return {m2Facts,evidence,innerPatterns};
}
function winterClimate(context) {
  const c=context.evidence.candidates[0], month=c.evidence.find(e=>e.kind==='MONTH_CONTEXT');
  const active=c.monthContext.activeSince;
  const judgment=resolveSeasonalSiliState({base:{candidateRef:c.candidateRef,dayMaster:c.dayMaster,
    monthBranch:c.monthContext.monthPillar.branch,evidenceRefs:[month.id],inputFactRefs:month.inputFactRefs,
    pillarRefs:[c.candidateRef+'.day',c.candidateRef+'.month'],calculationSourceRefs:month.calculationSourceRefs,appliedJie:active},
    birthDateTime:active.displayedDateTime.slice(0,8)+'08T01:20',monthCondition:'BETWEEN_PUBLISHED_BOUNDARIES',nextSili:null},
  {policyId:M3_SEASONAL_SILI_POLICY_ID});
  return deriveM5LimitedPurpose(context.evidence,{policyId:M5_LIMITED_PURPOSE_POLICY_ID,m2Facts:context.m2Facts,
    seasonal:Object.freeze({policy:M3_SEASONAL_SILI_METADATA,candidates:Object.freeze([
      Object.freeze({candidateRef:c.candidateRef,candidateIndex:0,judgment}),
    ])}),
    innerPatterns:context.innerPatterns});
}
test('E1 겨울 목 억부·조후 반대 방향을 보존하고 같은 원국의 기존 격국·조후 결론을 불변으로 둔다',()=>{
  const pillars=['辛酉','庚子','甲申','辛酉'], strength=strengthFor(pillars);
  const ctx=siblings(pillars), climate=winterClimate(ctx);
  const before=JSON.stringify([ctx.innerPatterns,climate]);
  const result=run(strength,{...ctx,climate});
  assert.equal(result.primary.family,'RESOURCE');
  assert.equal(result.primary.element,'WATER');
  assert.equal(result.climateComparison.status,'OPPOSING_BALANCE_DIRECTION');
  assert.deepEqual(result.climateComparison.climateElements,['FIRE']);
  assert.equal(result.climateComparison.changesEokbuRank,false);
  assert.equal(result.patternHandoff.usedForRanking,false);
  assert.equal(result.patternHandoff.primaryPattern,'正印');
  assert.equal(result.patternHandoff.directions[0].relation,'SAME');
  assert.equal(JSON.stringify([ctx.innerPatterns,climate]),before);
  const withFire=['辛酉','庚子','甲申','丁卯'];
  const other=siblings(withFire);
  assert.equal(run(strengthFor(withFire),{...other,climate:winterClimate(other)}).climateComparison.status,'CLIMATE_ON_HOLD');
  assert.equal(run(strength,{...ctx,climateUnavailableReason:'ORIGINAL_SILI_CLOCK_DEPENDENCY_NOT_EXTENDED'}).climateComparison.status,'CLOCK_POLICY_UNAVAILABLE');
});
test('E1 근거는 같은 월령·일간 이름만으로 연결되지 않고 발급·후보·네 기둥 일치를 요구한다',()=>{
  const pillars=['辛酉','庚子','甲申','辛酉'], a=siblings(pillars), s=strengthFor(pillars);
  const b=siblings(['辛酉','庚子','甲申','丁卯']);
  assert.throws(()=>run(structuredClone(s),a),/ISSUED_E1/);
  assert.throws(()=>deriveEokbuCandidate(s,{profileId:'DEFAULT'}),/EXPLICIT_E1/);
  assert.throws(()=>run(s,b),/FOREIGN_CHART/);
  assert.throws(()=>run(s,{...a,innerPatterns:b.innerPatterns}),/FOREIGN_EXECUTION/);
  assert.throws(()=>run(s,{...a,climate:winterClimate(b)}),/FOREIGN_EXECUTION/);
  assert.throws(()=>run(strengthFor(pillars,1),a),/FOREIGN_CHART/);
  const peer=['丙子','乙卯','甲子','辛酉'];
  const result=run(strengthFor(peer),siblings(peer,'JINGZHE'));
  assert.equal(result.patternHandoff.peerMain,true);
  assert.equal(result.status,'SINGLE_CANDIDATE');
  const res=cases.find(c=>c.id==='resource').pillars;
  const handoff=run(strengthFor(res),siblings(res,'LIDONG')).patternHandoff;
  const adverse=handoff.directions.find(x=>x.basis==='MAIN_QI');
  assert.equal(adverse.potentialCounterDirection,'EOKBU_CONTROLS_PATTERN');
  assert.equal(adverse.actualEffect,'NOT_EVALUATED');
  assert.equal(handoff.usedForRanking,false);
});
