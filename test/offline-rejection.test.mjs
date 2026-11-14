// Public synthetic connection cases, not an independent calendar oracle.
import test from 'node:test';
import assert from 'node:assert/strict';
import {createLocalChartProfile,STAGE_A_PROFILE_ID} from '../scripts/kasi/local-chart.mjs';
import {M2_LOCAL_PROFILE_ID} from '../scripts/kasi/local-chart-facts.mjs';
import {M3_SYNTHESIS_PROFILE_ID,M4_POSITION_PROFILE_ID} from '../scripts/kasi/local-m3-evidence.mjs';
import {WEIGHTED_SUPPORT_POLICY_ID} from '../scripts/experimental/weighted-support.mjs';
import {syntheticLocalChartCandidate,chartRequest} from './fixtures/kasi-local-chart-synthetic.mjs';
import {calculateOffline,OfflineCalculationError,offlineRejection} from '../scripts/offline/run.mjs';

const fixture=syntheticLocalChartCandidate();
const makeProfile=()=>createLocalChartProfile(fixture.loaded,{profileId:STAGE_A_PROFILE_ID,expectedManifestSha256:fixture.expectedManifestSha256});
const options=request=>({request,m2ProfileId:M2_LOCAL_PROFILE_ID,synthesisProfileId:M3_SYNTHESIS_PROFILE_ID,positionProfileId:M4_POSITION_PROFILE_ID,policyId:WEIGHTED_SUPPORT_POLICY_ID});
const lunarRequest=day=>{const row=fixture.loaded.candidate.dates[0];return {calendar:'KOREAN_LUNAR',lunarDate:{lunarYear:row.lunarYear,lunarMonth:row.lunarMonth,lunarDay:day,leap:row.leap},time:'12:00',policies:chartRequest().policies};};

test('all offline modes preserve three existing unsupported statuses after exactly one birth M1 call',()=>{
  const requests=[['OUT_OF_PROFILE_COVERAGE',chartRequest('2025-12-31')],['OUT_OF_PROFILE_COVERAGE',chartRequest('2027-01-01')],['OUT_OF_OBSERVED_COVERAGE',lunarRequest(1)],['INVALID_LUNAR_DATE',lunarRequest(30)]];
  for(const mode of ['chart','explain','evidence','experimental'])for(const [expected,request]of requests){
    const issued=makeProfile();let calls=0;
    const observed={calculate(value){calls++;return issued.calculate(value);}};
    assert.throws(()=>calculateOffline({mode,options:options(request),chartProfile:observed,contextProfile:issued}),error=>{
      assert.ok(error instanceof OfflineCalculationError);assert.equal(error.code,expected);
      assert.deepEqual(offlineRejection(error,'CALCULATION'),{status:'REJECTED',phase:'CALCULATION',code:expected});return true;
    });
    assert.equal(calls,1,mode+' must call birth M1 once before rejecting');
  }
});

test('all offline modes still call birth M1 once on successful live issued results',()=>{
  for(const mode of ['chart','explain','evidence','experimental']){
    const issued=makeProfile();let calls=0;
    const observed={calculate(value){calls++;return issued.calculate(value);}};
    const result=calculateOffline({mode,options:options(chartRequest()),chartProfile:observed,contextProfile:issued});
    assert.equal(calls,1);assert.equal(result.mode,mode);assert.deepEqual(Object.keys(result),['schemaVersion','mode','data']);
    if(mode==='evidence'||mode==='experimental')assert.equal((mode==='evidence'?result.data:result.data.existing).executionCounts.birthM1Calls,1);
  }
});

test('offline rejection phases use fixed enums and never forward arbitrary exception details',()=>{
  const secret='PRIVATE_PATH_AND_VIRTUAL_BIRTH_INPUT_MUST_NOT_BE_ECHOED';
  for(const phase of ['INPUT','ARTIFACT','DATA','CALCULATION']){
    const error=Object.assign(new Error(secret),{code:secret});
    const result=offlineRejection(error,phase);
    assert.deepEqual(result,{status:'REJECTED',phase,code:`OFFLINE_${phase}_REJECTED`});assert.ok(!JSON.stringify(result).includes(secret));
    const counterfeit=Object.assign(new Error('OUT_OF_PROFILE_COVERAGE'),{code:'OUT_OF_PROFILE_COVERAGE'});
    assert.equal(offlineRejection(counterfeit,phase).code,`OFFLINE_${phase}_REJECTED`);
  }
  assert.equal(offlineRejection(new OfflineCalculationError(secret),'CALCULATION').code,'OFFLINE_CALCULATION_REJECTED');
  assert.deepEqual(offlineRejection(new OfflineCalculationError('INVALID_LUNAR_DATE'),'INPUT'),{status:'REJECTED',phase:'INPUT',code:'OFFLINE_INPUT_REJECTED'});
});
