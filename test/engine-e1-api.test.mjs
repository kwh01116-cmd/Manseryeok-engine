import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {E1_SELECTION, projectEngineE1, validateE1Selection} from '../scripts/engine/e1.mjs';
import {validateE1Request} from '../scripts/engine/e1-cli.mjs';
import {validateApiOnlyServerRequest} from '../scripts/server/engine.mjs';

const example=JSON.parse(await readFile(new URL('../docs/contracts/examples/engine-e1-request-v1.json',import.meta.url),'utf8'));
test('E1 example explicitly selects all policies and embeds an unchanged v1 birth DTO',()=>{
  validateE1Request(example);
  assert.deepEqual(example.selection,E1_SELECTION);
  assert.equal(validateApiOnlyServerRequest(example.birth),true);
  assert.throws(()=>validateApiOnlyServerRequest({...example.birth,selection:E1_SELECTION}),/SERVER_REQUEST_FIELDS/);
});
test('E1 refuses stale, absent or accessor-based opt-ins before processing any chart',()=>{
  for(const k of Object.keys(E1_SELECTION)){
    const missing={...E1_SELECTION};delete missing[k];
    for(const bad of [missing,{...E1_SELECTION,[k]:'wrong-policy'}])assert.throws(()=>validateE1Selection(bad),/EXPLICIT_E1/);
  }
  let called=false;
  const accessor={...E1_SELECTION};Object.defineProperty(accessor,'version',{get(){called=true;},enumerable:true});
  for(const value of [null,{},accessor,{...E1_SELECTION,defaultMode:true},Object.create(E1_SELECTION)]){
    assert.throws(()=>validateE1Selection(value),/EXPLICIT_E1/);
  }
  assert.equal(called,false);
});
test('E1 rejects serialized response lookalikes and conflicting clock profiles',()=>{
  assert.throws(()=>projectEngineE1({status:'CALCULATED_UNDER_SELECTED_POLICIES',candidates:[]},E1_SELECTION),/ISSUED_SERVER_RESPONSE_REQUIRED/);
  assert.throws(()=>validateE1Request({...example,unknown:true}),/E1_REQUEST_SCHEMA/);
  assert.throws(()=>validateE1Request({...example,birth:{...example.birth,policies:{...example.birth.policies,clockPolicyId:'DEFAULT'}}}),/SERVER_CLOCK_PROFILE_CONFLICT/);
});
