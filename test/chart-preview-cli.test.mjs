import test from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const script = fileURLToPath(new URL('../scripts/chart-preview-cli.mjs', import.meta.url));
const base = [
  '--calendar=GREGORIAN', '--date=2027-02-05', '--time=12:00',
  '--time-basis=KOREAN_CIVIL_TIME', '--day-rollover=CIVIL_MIDNIGHT',
  '--hour-stem-reference=SELECTED_DAY_PILLAR',
];
const run = args => spawnSync(process.execPath, [script, ...args], { encoding: 'utf8' });

test('real engine CLI prints Korean four-pillar JSON and lunar/solar equivalence', () => {
  const solar = run(base);
  const lunar = run(base.map(x => x === '--calendar=GREGORIAN' ? '--calendar=KOREAN_LUNAR' :
    x === '--date=2027-02-05' ? '--date=2026-12-29' : x).concat('--leap=false'));
  assert.equal(solar.status, 0, solar.stderr);
  assert.equal(lunar.status, 0, lunar.stderr);
  const a = JSON.parse(solar.stdout), b = JSON.parse(lunar.stdout);
  assert.equal(a.status, 'OK');
  assert.equal(b.status, 'OK');
  assert.deepEqual(a.preview.candidates, b.preview.candidates);
  assert.equal(a.preview.candidates[0].year.hangul, '정미');
  assert.equal(a.preview.coverage.validation, 'STRUCTURAL_COVERAGE_ONLY');
  assert.equal(b.preview.lunarConversionSource.sourceId, 'KR-KASI-CALENDAR-DATA');
});

test('published-minute Lichun retains two candidates, not a fabricated selection', () => {
  const r = run(base.map(x => x === '--date=2027-02-05' ? '--date=2027-02-04' :
    x === '--time=12:00' ? '--time=10:46' : x));
  assert.equal(r.status, 0, r.stderr);
  const result = JSON.parse(r.stdout);
  assert.equal(result.preview.confidence, 'PUBLISHED_MINUTE_AMBIGUOUS');
  assert.deepEqual(result.preview.candidates.map(x => x.year.hangul), ['병오', '정미']);
});

test('invalid flags and unsupported dates fail closed without outputting a chart', () => {
  const invalid = run(base.filter(x => !x.startsWith('--day-rollover=')));
  assert.equal(invalid.status, 2);
  assert.equal(invalid.stdout, '');
  assert.equal(JSON.parse(invalid.stderr).code, 'INVALID_OR_UNSUPPORTED_INPUT');
  const outside = run(base.map(x => x.replace('2027-02-05', '2028-01-01')));
  assert.equal(outside.status, 2);
  assert.equal(outside.stdout, '');
});
