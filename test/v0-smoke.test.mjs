import test from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const script = fileURLToPath(new URL('../scripts/v0-smoke.mjs', import.meta.url));

test('V0 smoke resolves Gregorian/lunar equivalence and preserves source provenance', () => {
  const run = spawnSync(process.execPath, [script], { encoding: 'utf8' });
  assert.equal(run.status, 0, run.stderr);
  const result = JSON.parse(run.stdout);
  const gregorian = result.gregorian;
  const lunar = result.equivalentLunar;
  assert.equal(gregorian.status, 'OK');
  assert.equal(lunar.status, 'OK');
  assert.deepEqual(gregorian.preview.candidates, lunar.preview.candidates);
  assert.equal(gregorian.preview.candidates[0].year.hangul, '정미');
  assert.equal(gregorian.preview.candidates[0].month.hangul, '임인');
  assert.equal(lunar.preview.lunarConversionSource.sourceId, 'KR-KASI-CALENDAR-DATA');
  assert.equal(gregorian.preview.coverage.validation, 'STRUCTURAL_COVERAGE_ONLY');
});

test('V0 smoke retains both correlated published-minute Lichun candidates', () => {
  const run = spawnSync(process.execPath, [script], { encoding: 'utf8' });
  assert.equal(run.status, 0, run.stderr);
  const boundary = JSON.parse(run.stdout).lichunPublishedMinute;
  assert.equal(boundary.status, 'OK');
  assert.equal(boundary.preview.confidence, 'PUBLISHED_MINUTE_AMBIGUOUS');
  assert.equal(boundary.preview.candidates.length, 2);
  assert.deepEqual(boundary.preview.candidates.map(c => c.year.hangul), ['병오', '정미']);
});
