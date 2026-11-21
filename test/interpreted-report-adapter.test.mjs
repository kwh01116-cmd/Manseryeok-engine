import test from 'node:test';
import assert from 'node:assert/strict';
import {spawnSync} from 'node:child_process';
import {parseInterpretedReportArgs,createInterpretedReportService,analyzeInterpretedReport,validateIssuedInterpretedReport} from '../scripts/product/interpreted-report.mjs';
import {CONSUMER_REPORT_PROFILE_ID} from '../dist/report/consumerReportV1.js';
import {INTERPRETATION_PROFILE_ID,contextsFromProjection} from '../dist/report/interpretationPolicyV1.js';
import {makeConsumerProjection} from './fixtures/consumer-report-projection-v1.mjs';
import {SPRINT6_REPORT_CASES} from './fixtures/sprint6-report-cases-v1.mjs';
import {parseConsumerReportArgs} from '../scripts/product/consumer-report.mjs';

const request=SPRINT6_REPORT_CASES.find(c=>c.id==='MONTH_MAIN_OFFICER').request;
const args=()=>['--data-pack','operator-only-data','--request-json',JSON.stringify(request),'--interpretation-profile',INTERPRETATION_PROFILE_ID,'--output','text','--audience','full','--voice','report','--detail','summary','--generator','deterministic'];

test('S7 parser requires an explicit interpretation and expression selection and preserves the original request',()=>{
  const p=parseInterpretedReportArgs(args());assert.deepEqual(p.request,request);assert.equal(p.profileId,INTERPRETATION_PROFILE_ID);assert.equal(p.generator,'deterministic');
  for(const [position,value]of [[5,'AUTO'],[7,'html'],[9,'paid'],[11,'oracle'],[13,'all'],[15,'external-llm']]){const a=args();a[position]=value;assert.throws(()=>parseInterpretedReportArgs(a),RangeError);}
  assert.throws(()=>parseInterpretedReportArgs(args().slice(0,-2)),RangeError);
  assert.throws(()=>parseInterpretedReportArgs([...args(),'--save','birth.json']),RangeError);
  const duplicate=args();duplicate[14]='--output';assert.throws(()=>parseInterpretedReportArgs(duplicate),RangeError);
});
test('S7 keeps the seven-option Sprint6 parser and original profile independent',()=>{
  const original=['--data-pack','operator-only-data','--request-json',JSON.stringify(request),'--report-profile',CONSUMER_REPORT_PROFILE_ID,'--output','text','--audience','full','--voice','report','--detail','summary'];
  const p=parseConsumerReportArgs(original);assert.equal(p.profileId,CONSUMER_REPORT_PROFILE_ID);assert.deepEqual(p.request,request);
  const wrong=original.slice();wrong[5]=INTERPRETATION_PROFILE_ID;assert.throws(()=>parseConsumerReportArgs(wrong),RangeError);
});
test('S7 issued entry rejects serialized, fabricated and accessor-based input without pretending to issue a calendar receipt',()=>{
  assert.throws(()=>analyzeInterpretedReport(Object.freeze({}),{request,profileId:INTERPRETATION_PROFILE_ID}),Error);
  assert.throws(()=>validateIssuedInterpretedReport({}),Error);
  assert.throws(()=>createInterpretedReportService({calculate(){}},{profileId:'AUTO'}),RangeError);
  let reads=0;const options={profileId:INTERPRETATION_PROFILE_ID};Object.defineProperty(options,'request',{enumerable:true,get(){reads++;return request;}});
  assert.throws(()=>analyzeInterpretedReport({},options),RangeError);assert.equal(reads,0);
});
test('S7 service rejects invalid requests before upstream entry and uses exactly one upstream entry for a valid request',()=>{
  let entries=0;const service=createInterpretedReportService({calculate(){entries++;return {};}},{profileId:INTERPRETATION_PROFILE_ID});
  assert.throws(()=>service.calculate({...request,unknownOption:true}),Error);assert.equal(entries,0);
  assert.throws(()=>service.calculate(request),Error);assert.equal(entries,1,'unissued result fails after one upstream call');
});
test('S7 actual CLI rejects invalid or unsupported selections with result-only stdout and safe non-PII errors',()=>{
  const env={};for(const key of Object.keys(process.env)){if(/KASI|API_KEY|SERVICE_KEY|DATAGO/i.test(key))continue;env[key]=process.env[key];}env.NODE_OPTIONS='';
  for(const argv of [[],['--request-json',JSON.stringify(request)],args().map((x,i)=>i===5?'AUTO':x)]){
    const result=spawnSync(process.execPath,['scripts/product/interpreted-report.mjs',...argv],{encoding:'utf8',windowsHide:true,env});
    assert.equal(result.status,1);assert.equal(result.stdout,'');const error=JSON.parse(result.stderr);assert.deepEqual(error,{status:'REJECTED',phase:'INPUT',code:'S7_REPORT_INPUT_REJECTED'});
    assert.equal(result.stderr.includes(request.date),false);assert.equal(result.stderr.includes('operator-only-data'),false);
  }
});
test('S7 refuses an internally registered substitute for its explicitly pinned pattern or root dependency',()=>{
  for(const kind of ['pattern','root']){
    const projection=makeConsumerProjection(),node=projection.evidence.find(n=>n.id===projection.candidates[0].refs[kind]);
    const id='UNSELECTED-INTERPRETATION-DEPENDENCY-V99';projection.provenance.policies.push({id,version:'0.1.0'});node.policyId=id;
    assert.throws(()=>contextsFromProjection(projection),RangeError,'a registry entry does not authorize another selected policy');
  }
});
