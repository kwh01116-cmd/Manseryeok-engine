// Generated calendar responses test continuity and CLI policy selection, not classical efficacy.
import test from 'node:test';
import assert from 'node:assert/strict';
import {createLocalChartProfile,STAGE_A_PROFILE_ID} from '../scripts/kasi/local-chart.mjs';
import {createLocalM3EvidenceProfile,deriveLocalM4Position,validateLocalM4Position,validateLocalM3EvidenceResult,renderLocalM3EvidenceText,parseLocalM3EvidenceArgs,M4_POSITION_PROFILE_ID,M4_PATTERN_PROFILE_ID,M3_SEASONAL_SILI_POLICY_ID} from '../scripts/kasi/local-m3-evidence.mjs';
import {validateM4WealthResourcePositionExplanation} from '../dist/m4/wealthResourcePositionV1.js';
import {syntheticLocalChartCandidate,chartRequest} from './fixtures/kasi-local-chart-synthetic.mjs';

const fixture=syntheticLocalChartCandidate();
const chart=()=>createLocalChartProfile(fixture.loaded,{profileId:STAGE_A_PROFILE_ID,expectedManifestSha256:fixture.expectedManifestSha256});
const selected={positionProfileId:M4_POSITION_PROFILE_ID};
const common=['--profile',STAGE_A_PROFILE_ID,'--candidate','SYNTHETIC_PATH','--manifest-sha',fixture.expectedManifestSha256,'--calendar','GREGORIAN','--date','2026-01-08','--time','12:00','--clock-policy','KR_API_PUBLISHED_KST_MODERN_1988_POST_DST_V1','--day-rollover','CIVIL_MIDNIGHT','--hour-stem-reference','SELECTED_DAY_PILLAR','--output','json'];

test('position profile discloses the exact parent bundle and rejects conflicts before birth M1',()=>{
 const base=chart();let calls=0;const spy={...base,calculate(request){calls++;return base.calculate(request);}};
 for(const overrides of [{positionProfileId:'AUTO'},{...selected,patternProfileId:'OTHER'},{...selected,m2ProfileId:'OTHER'},{...selected,m3ProfileId:'OTHER'}])assert.throws(()=>createLocalM3EvidenceProfile(spy,{contextProfile:base,...overrides}));
 assert.equal(calls,0);
 const result=createLocalM3EvidenceProfile(spy,{contextProfile:base,...selected}).calculate(chartRequest('2026-01-08'));
 assert.equal(calls,1);assert.equal(result.schemaVersion,'kasi-local-m4-wealth-resource-position-v1');
 assert.deepEqual(result.executionCounts,{birthM1Calls:1,m2Derivations:1,m4Derivations:1,m4PositionDerivations:1});
 assert.equal(result.provenance.m4Policy.id,M4_PATTERN_PROFILE_ID);assert.equal(result.provenance.m4PositionPolicy.id,M4_POSITION_PROFILE_ID);
 assert.equal(result.wealthResourcePosition.candidates[0].decision.status,'SURFACE_BOTH_NOT_PRESENT');
 assert.equal(result.wealthResourcePosition.candidates[0].exposureState,'WEALTH_ONLY_VISIBLE');
 assert.equal(result.validation.g0Receipt,null);assert.equal(result.validation.g1P2Promotion,false);assert.equal(result.validation.finalStrength,'NOT_IMPLEMENTED');
 assert.equal(validateLocalM3EvidenceResult(result),true);
});

test('C1 consumes the existing pattern result without changing natal facts or broader formation flag',()=>{
 const base=chart(),request=chartRequest('2026-01-08');
 const old=createLocalM3EvidenceProfile(base,{patternProfileId:M4_PATTERN_PROFILE_ID}).calculate(request);
 const value=createLocalM3EvidenceProfile(base,selected).calculate(request);
 for(const key of ['m1','facts','evidence','explanation','patternAnalysis','patternReport','validation'])assert.deepEqual(value[key],old[key]);
 assert.equal(old.patternAnalysis.candidates[0].formationAssessment.status,'FORMATION_CONDITIONS_OBSERVED');
 assert.equal(value.wealthResourcePosition.candidates[0].decision.status,'SURFACE_BOTH_NOT_PRESENT');
 assert.equal(Object.hasOwn(old,'wealthResourcePosition'),false);
 const standalone=deriveLocalM4Position(value.patternAnalysis,selected);assert.deepEqual(standalone,value.wealthResourcePosition);
 assert.equal(validateLocalM4Position(standalone,{pattern:value.patternAnalysis,evidence:value.evidence}),true);
 assert.match(renderLocalM3EvidenceText(value),/表面|표면 재·인 양투/);
});

test('solar and equivalent lunar inputs keep the same selected position meaning and issued references',()=>{
 const base=chart(),profile=createLocalM3EvidenceProfile(base,selected),request=chartRequest('2026-01-08'),row=fixture.loaded.candidate.dates.find(r=>r.solarDate===request.date);
 const lunar={calendar:'KOREAN_LUNAR',lunarDate:{lunarYear:row.lunarYear,lunarMonth:row.lunarMonth,lunarDay:row.lunarDay,leap:row.leap},time:request.time,policies:request.policies};
 const g=profile.calculate(request),l=profile.calculate(lunar),again=profile.calculate(request);
 // Gregorian evidence and lunar conversion deliberately carry different method records.
 // Validate that sole input-specific difference before comparing every other field.
 const normalized=value=>{const copy=structuredClone(value.wealthResourcePosition),entries=copy.sources.filter(s=>s.evidence?.method);assert.equal(entries.length,1);assert.equal(entries[0].evidence.method,value.m1.input.calendar==='GREGORIAN'?'GREGORIAN_WITH_API_OBSERVED_DATE_EVIDENCE':'API_OBSERVED_DATE_INDEX');entries[0].evidence.method='INPUT_CALENDAR_METHOD_VALIDATED_SEPARATELY';return copy;};
 assert.deepEqual(normalized(g),normalized(l));assert.deepEqual(g.wealthResourcePositionReport,l.wealthResourcePositionReport);assert.deepEqual(g,again);
 for(const value of [g,l,again]){assert.equal(validateLocalM3EvidenceResult(value),true);assert.ok(Object.isFrozen(value.wealthResourcePosition));}
});

test('B alternatives stay below one original parent and Lichun retains its two original parents',()=>{
 const base=chart(),p=createLocalM3EvidenceProfile(base,{...selected,seasonalPolicyId:M3_SEASONAL_SILI_POLICY_ID});
 const values=['01:19','01:20','01:21'].map(time=>p.calculate(chartRequest('2026-04-17',time)));
 assert.equal(values[1].seasonal.candidates[0].judgment.alternatives.length,2);
 for(const v of values){assert.equal(v.wealthResourcePosition.candidates.length,1);assert.equal(validateLocalM3EvidenceResult(v),true);}
 assert.deepEqual(values[0].wealthResourcePosition,values[1].wealthResourcePosition);assert.deepEqual(values[1].wealthResourcePosition,values[2].wealthResourcePosition);
 const at=p.calculate(chartRequest('2026-02-05','01:20'));assert.equal(at.m1.chart.candidates.length,2);assert.equal(at.wealthResourcePosition.candidates.length,2);
 assert.deepEqual(at.wealthResourcePosition.candidates.map(c=>c.candidateRef),['chart.candidates[0]','chart.candidates[1]']);
});

test('cross-request pattern contexts cloned outputs and altered report decisions reject without later contamination',()=>{
 const p=createLocalM3EvidenceProfile(chart(),selected),a=p.calculate(chartRequest('2026-01-08')),b=p.calculate(chartRequest('2026-02-06'));
 assert.throws(()=>deriveLocalM4Position(structuredClone(a.patternAnalysis),selected));
 assert.throws(()=>validateLocalM4Position(a.wealthResourcePosition,{pattern:b.patternAnalysis}));
 assert.throws(()=>validateLocalM4Position(a.wealthResourcePosition,{evidence:b.evidence}));
 assert.throws(()=>validateLocalM3EvidenceResult({...a,wealthResourcePosition:b.wealthResourcePosition}));
 const forged=structuredClone(a.wealthResourcePositionReport);forged.candidates[0].items[0].text='재인 양불상애와 성격을 확정합니다.';
 assert.throws(()=>validateM4WealthResourcePositionExplanation(forged,a.wealthResourcePosition));
 assert.deepEqual(p.calculate(chartRequest('2026-01-08')).wealthResourcePosition,a.wealthResourcePosition);
});

test('CLI parser selects one explicit versioned bundle and preserves required clock and input validation',()=>{
 const parsed=parseLocalM3EvidenceArgs([...common,'--position-profile',M4_POSITION_PROFILE_ID]);
 assert.equal(parsed.positionProfileId,M4_POSITION_PROFILE_ID);assert.equal(parsed.patternProfileId,M4_PATTERN_PROFILE_ID);assert.equal(parsed.m2ProfileId,'m2-basic-classification-local-v1');
 for(const tail of [['--position-profile','AUTO'],['--position-profile',M4_POSITION_PROFILE_ID,'--position-profile',M4_POSITION_PROFILE_ID],['--position-profile',M4_POSITION_PROFILE_ID,'--m3-profile','OTHER']])assert.throws(()=>parseLocalM3EvidenceArgs([...common,...tail]));
 const missing=common.slice();missing.splice(missing.indexOf('--time'),2);assert.throws(()=>parseLocalM3EvidenceArgs([...missing,'--position-profile',M4_POSITION_PROFILE_ID]));
});
