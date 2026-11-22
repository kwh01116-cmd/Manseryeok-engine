import assert from 'node:assert/strict';
import { test } from 'node:test';
import { readFile } from 'node:fs/promises';
import { E6_SELECTION, e6RelationshipLimit, validateE6Request } from '../scripts/engine/e6.mjs';
import { E6_BIRTH_CASES } from './fixtures/e6-birth-cases-v1.mjs';

test('E6 sample, locked requests and schemas specify the same explicit policy and query forms', async () => {
  const load = async name => JSON.parse(await readFile(new URL('../docs/contracts/' + name, import.meta.url)));
  const sample = await load('examples/engine-e6-request-v1.json');
  assert.deepEqual(sample.selection, E6_SELECTION);
  for (const { request } of E6_BIRTH_CASES) validateE6Request(request);
  validateE6Request({ ...sample, dayun: { count: 1 } });
  const request = await load('engine-e6-request-v1.schema.json'), result = await load('engine-e6-result-v1.schema.json');
  assert.equal(request.properties.selection.properties.relationPolicyId.const, E6_SELECTION.relationPolicyId);
  assert.deepEqual(request.properties.query.oneOf.map(row => row.properties.kind.const), ['AS_OF', 'COMPARE', 'RANGE']);
  assert.equal(result.properties.relationshipRows.maximum, 8192);
});

test('E6 rejects foreign projection, policy and query data without changing E5 selection', () => {
  const { request } = E6_BIRTH_CASES[0];
  assert.throws(() => validateE6Request({ ...request, candidates: [] }), /E6_REQUEST_SCHEMA/);
  assert.throws(() => validateE6Request({ ...request, selection: { ...request.selection, version: '9' } }),
    /E6_EXPLICIT_POLICY_REQUIRED/);
  assert.throws(() => validateE6Request({ ...request, clockPolicyId: 'UTC' }), /E6_EXPLICIT_QUERY_CLOCK_POLICY_REQUIRED/);
  assert.throws(() => validateE6Request({ ...request, query: { ...request.query, from: '2026-03-02T12:00Z' } }),
    /E6_EXPLICIT_FROM_TO_MINUTES_REQUIRED/);
  assert.throws(() => validateE6Request({ ...request, query: { ...request.query, timeContextRef: 'injected' } }),
    /E6_QUERY_FIELDS/);
  assert.throws(() => validateE6Request({ ...request, query: {
    kind: 'RANGE', from: '2026-03-12T12:00', to: '2026-03-02T12:00',
  } }), /E6_HALF_OPEN_RANGE_ORDER/);
});

test('E6 has a closed response-row budget with an explicit refusal above the cap', () => {
  assert.equal(e6RelationshipLimit(8192), null);
  assert.deepEqual(e6RelationshipLimit(8193), { reasonCode: 'RELATIONSHIP_ROWS', limit: 8192, actual: 8193 });
});
