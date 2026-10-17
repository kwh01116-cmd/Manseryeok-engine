import assert from 'node:assert/strict';
import test from 'node:test';
import { createCalendarCoverageIslandRegistry } from '../dist/calendar/coverageIslandRegistry.js';

const research = { id:'naoj-2000-research',supportedFromInclusive:'2000-01-01T00:00',
  supportedUntilExclusive:'2001-01-01T00:00',status:'RESEARCH_ONLY',payload:{source:'JP-NAOJ-REKIYOU-2000'} };
const existing = { id:'kasi-2026-27',supportedFromInclusive:'2026-01-01T00:00',
  supportedUntilExclusive:'2028-01-01T00:00',status:'RESEARCH_ONLY',payload:{source:'KR-KASI-CALENDAR-DATA'} };
const syntheticApproved = { id:'synthetic-2030-test-only',supportedFromInclusive:'2030-01-01T00:00',
  supportedUntilExclusive:'2031-01-01T00:00',status:'CONSUMER_APPROVED',payload:{source:'SYNTHETIC-NOT-A-REAL-CALENDAR'} };

test('disjoint 2000 and 2026–27 research islands never imply 2001–2025 support', () => {
  const registry=createCalendarCoverageIslandRegistry([existing,research,syntheticApproved]);
  assert.deepEqual(registry.islands.map(x=>x.id),[research.id,existing.id,syntheticApproved.id]);
  assert.equal(registry.select('2000-06-01T12:00','RESEARCH')?.payload.source,research.payload.source);
  assert.equal(registry.select('2000-06-01T12:00','CONSUMER'),null);
  assert.equal(registry.select('2010-02-04T12:00','RESEARCH'),null);
  assert.equal(registry.select('2010-02-04T12:00','CONSUMER'),null);
  assert.equal(registry.select('2027-02-04T10:46','CONSUMER'),null);
  assert.equal(registry.select('2027-02-04T10:46','RESEARCH')?.payload.source,existing.payload.source);
  assert.equal(registry.select('2030-06-01T12:00','CONSUMER')?.payload.source,syntheticApproved.payload.source);
});

test('declared full-year intervals are left-inclusive and right-exclusive', () => {
  const registry=createCalendarCoverageIslandRegistry([existing,research]);
  assert.equal(registry.select('1999-12-31T23:59','RESEARCH'),null);
  assert.equal(registry.select('2000-01-01T00:00','RESEARCH')?.id,research.id);
  assert.equal(registry.select('2000-12-31T23:59','RESEARCH')?.id,research.id);
  assert.equal(registry.select('2001-01-01T00:00','RESEARCH'),null);
  assert.equal(registry.select('2026-01-01T00:00','RESEARCH')?.id,existing.id);
  assert.equal(registry.select('2026-01-01T00:00','CONSUMER'),null);
  assert.equal(registry.select('2028-01-01T00:00','CONSUMER'),null);
});

test('overlap is forbidden even across release lanes; adjacent years are legal', () => {
  assert.throws(()=>createCalendarCoverageIslandRegistry([existing,{...research,
    id:'overlap',supportedFromInclusive:'2027-01-01T00:00',supportedUntilExclusive:'2029-01-01T00:00'}]), /not overlap/);
  const adjacent={...research,id:'next',supportedFromInclusive:'2001-01-01T00:00',supportedUntilExclusive:'2002-01-01T00:00'};
  const registry=createCalendarCoverageIslandRegistry([adjacent,research]);
  assert.equal(registry.select('2001-01-01T00:00','RESEARCH')?.id,'next');
});

test('invalid status, IDs, missing payload, partial intervals and invalid Gregorian minutes fail closed', () => {
  assert.throws(()=>createCalendarCoverageIslandRegistry([]),RangeError);
  assert.throws(()=>createCalendarCoverageIslandRegistry([research,{...research}]),/unique/);
  assert.throws(()=>createCalendarCoverageIslandRegistry([{...research,id:'  '}]),/unique/);
  assert.throws(()=>createCalendarCoverageIslandRegistry([{...research,status:'AUTO'}]),/status/);
  assert.throws(()=>createCalendarCoverageIslandRegistry([{...research,payload:null}]),/payload/);
  assert.throws(()=>createCalendarCoverageIslandRegistry([{...research,supportedFromInclusive:'2000-02-01T00:00'}]),/full-year/);
  assert.throws(()=>createCalendarCoverageIslandRegistry([{...research,supportedUntilExclusive:'2000-01-01T00:00'}]),/full-year/);
  assert.throws(()=>createCalendarCoverageIslandRegistry([{...research,supportedFromInclusive:'2000-02-30T00:00'}]),RangeError);
  const registry=createCalendarCoverageIslandRegistry([research]);
  for(const stamp of ['2000-02-30T12:00','2000-06-01T24:00','2000-06-01T12:60','not-a-minute'])
    assert.throws(()=>registry.select(stamp,'RESEARCH'),RangeError);
  for(const usage of [undefined,'AUTO',null])
    assert.throws(()=>registry.select('2000-06-01T12:00',usage),RangeError);
});

test('routing metadata is frozen and does not modify caller ordering or payload identity', () => {
  const candidates=[existing,research];
  const registry=createCalendarCoverageIslandRegistry(candidates);
  assert.deepEqual(candidates,[existing,research]);
  assert.equal(Object.isFrozen(registry),true);
  assert.equal(Object.isFrozen(registry.islands),true);
  assert.ok(registry.islands.every(Object.isFrozen));
  assert.equal(registry.select('2000-03-01T00:00','RESEARCH').payload,research.payload);
  assert.throws(()=>registry.islands.push(research),TypeError);
});
