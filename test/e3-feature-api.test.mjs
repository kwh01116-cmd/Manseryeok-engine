import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';
import * as adapter from '../scripts/engine/e3.mjs';
import { E2_SELECTION, E2_CORE_SELECTION } from '../scripts/engine/e2.mjs';
import { validateE3Request } from '../scripts/engine/e3-cli.mjs';

const example = JSON.parse(await readFile(new URL('../docs/contracts/examples/engine-e3-request-v1.json', import.meta.url),'utf8'));
test('E3 example is a separate explicit policy selection and optional dependency', () => {
  validateE3Request(example);
  assert.deepEqual(example.selection, adapter.E3_SELECTION);
  assert.equal(adapter.E3_SELECTION.e2,E2_SELECTION);
  assert.equal(adapter.E3_CORE_SELECTION.e2,E2_CORE_SELECTION);
  assert.ok(!Object.hasOwn(adapter.E3_CORE_SELECTION.e2,'e1'));
  validateE3Request({ ...example, selection: adapter.E3_CORE_SELECTION });
});
test('E3 rejects injected result and selection overrides before loading data', () => {
  assert.equal(adapter.projectEngineE3,undefined);
  assert.throws(() => validateE3Request({ ...example, candidates:[] }),/E3_REQUEST_SCHEMA/);
  assert.throws(() => validateE3Request({ ...example, birth: { ...example.birth, candidateRef:'chart.candidates[1]' } }),/SERVER_REQUEST_FIELDS/);
  assert.throws(() => validateE3Request({ ...example, selection: { ...example.selection, version:'0.2.0' } }),/EXPLICIT_E3/);
  assert.throws(() => validateE3Request({ ...example, selection: { ...example.selection, e2:{ ...example.selection.e2, version:'0.2.0' } } }),/EXPLICIT_E2/);
  let read = false;
  const accessor = { ...example.selection };
  Object.defineProperty(accessor,'e2',{ enumerable:true,get(){ read = true; return E2_SELECTION; } });
  assert.throws(() => adapter.validateE3Selection(accessor),/EXPLICIT_E3/);
  assert.equal(read,false);
});
