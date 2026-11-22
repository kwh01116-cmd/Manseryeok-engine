import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {E2_SELECTION,E2_CORE_SELECTION,prepareE2Birth,projectEngineE2,validateE2Selection} from '../scripts/engine/e2.mjs';
import {validateE2Request} from '../scripts/engine/e2-cli.mjs';
import {projectTemporal} from '../scripts/engine/e2-temporal.mjs';

const example=JSON.parse(await readFile(new URL('../docs/contracts/examples/engine-e2-request-v1.json',import.meta.url),'utf8'));
const {birth}=example;
test('E2 selects versioned six-star bases independently from E1',()=>{
  validateE2Request(example);
  assert.deepEqual(example.selection,E2_SELECTION);
  for(const ref of ['YEAR','DAY','BOTH']){
    validateE2Selection({...E2_CORE_SELECTION,sinsal:{...E2_CORE_SELECTION.sinsal,branchReference:ref}});
  }
  for(const s of [{...E2_SELECTION,e1:null},{...E2_SELECTION,e1:{...E2_SELECTION.e1,version:'0.2.0'}},
    {...E2_SELECTION,version:'2'},{...E2_CORE_SELECTION,sinsal:{...E2_SELECTION.sinsal,policyVersion:'2'}},
    {...E2_SELECTION,sinsal:{...E2_SELECTION.sinsal,branchReference:'MONTH'}},{...E2_CORE_SELECTION,selectE1:true}]){
    assert.throws(()=>validateE2Selection(s));
  }
  assert.throws(()=>projectEngineE2({candidates:[],status:'OK'},E2_SELECTION),/ISSUED_SERVER/);
  assert.throws(()=>validateE2Request({...example,unexpected:'true'}),/E2_REQUEST_SCHEMA/);
});
test('Partial traditional-sex/count requests retain explicit input and preserve independent seyun queries',()=>{
  for(const d of [{},{count:3},{traditionalSex:'MALE'}]){
    const opts={...birth.luckOptions,features:{...birth.luckOptions.features,dayun:d}};
    const {executable,pending}=prepareE2Birth({...birth,luckOptions:opts});
    assert.deepEqual(pending,opts);assert.deepEqual(executable.luckOptions.features,{seyun:opts.features.seyun});
    assert.equal(Object.hasOwn(executable.luckOptions,'asOfMinute'),false);
    assert.deepEqual(prepareE2Birth({...birth,luckOptions:{...opts,features:{dayun:d}}}).executable.luckOptions,undefined);
    for(const invalid of [{asOfMinute:'today'},{luckPolicyId:'DEFAULT'},
      {features:{dayun:{count:0}}},{features:{dayun:{traditionalSex:'auto'}}}]){
      assert.throws(()=>prepareE2Birth({...birth,luckOptions:{...opts,...invalid}}));
    }
  }
});
test('Historical monthly clock hold, missing query and missing endpoint remain distinguishable through projection',()=>{
  const policy={id:'fixture-monthly',version:'1'},natal={id:'chart.candidates[0]',pillars:[{},{},{stem:'甲'},{}]};
  const feature=(featureId,policy,availability,result,factRefs,limitationCodes)=>({featureId,policy,availability,result,factRefs,limitationCodes});
  function project(monthly,luckOptions){
    return projectTemporal({request:{luckOptions},analysisData:{monthly},modules:{M7:{status:'POLICY_UNRESOLVED'}},candidates:[natal]},0,feature,policy);
  }
  const held=project({status:'POLICY_UNRESOLVED',reason:'CLOCK_HELD'},{features:{dayun:{count:3,traditionalSex:'FEMALE'}}});
  assert.equal(held.monthly.availability,'POLICY_UNRESOLVED');assert.equal(held.daeun.availability,'POLICY_UNRESOLVED');
  assert.equal(held.monthly.policy,policy);
  assert.equal(project({status:'NOT_REQUESTED'}).monthly.availability,'NEEDS_INPUT');
  const missing=project({yearTable:{status:'NEEDS_DATA',rows:[]},policy});
  assert.equal(missing.monthly.availability,'NEEDS_DATA');assert.deepEqual(missing.temporal,[]);
});

test('Seyun keeps a candidate-specific before-birth query and points to its own observations',()=>{
  const id='chart.candidates[0]', policy={id:'monthly',version:'1'};
  const natal={id,pillars:[{},{},{stem:'甲'},{}]};
  const atMinute={status:'RESOLVED_UNDER_POLICY',entries:[{pillar:{stem:'辛',branch:'巳'}}]};
  const seyun={atMinute,birthRelation:'BEFORE_BIRTH_REPORTED_MINUTE',queryScope:'fixture'};
  const existing={request:{luckOptions:{features:{seyun:{queryMinute:'2001-06-01T12:00'}}}},candidates:[natal],
    modules:{M7:{status:'SELECTED_FEATURES_EXECUTED'}},
    analysisData:{monthly:{status:'NOT_REQUESTED'},base:{m7:{luck:{seyun:{atMinute},candidates:[{candidateRef:id,seyun}]}}}}};
  const feature=(featureId,policy,availability,result,factRefs)=>({featureId,policy,availability,result,factRefs});
  const temporal=projectTemporal(existing,0,feature,policy,{features:{dayun:{count:1}}});
  assert.equal(temporal.seyun.result,seyun);
  assert.equal(temporal.seyun.availability,'AVAILABLE');
  assert.deepEqual(temporal.daeun.factRefs,['/inputContext/pendingDayunRequest']);
  assert.deepEqual(temporal.seyun.factRefs,['/existing/analysisData/base/m7/luck/candidates/0/seyun']);
  assert.equal(temporal.temporal[0].sourcePath,temporal.seyun.factRefs[0]+'/atMinute/entries/0');
  const wrong=structuredClone(existing);wrong.analysisData.base.m7.luck.candidates[0].candidateRef='chart.candidates[1]';
  assert.throws(()=>projectTemporal(wrong,0,feature,policy),/FOREIGN_LUCK_CANDIDATE/);
});
