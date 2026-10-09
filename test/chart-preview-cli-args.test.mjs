import test from 'node:test';
import assert from 'node:assert/strict';
import { parseKoreanChartCliArgs as parse } from '../scripts/chart-preview-cli-args.mjs';

const required = [
  '--calendar=GREGORIAN', '--date=2027-02-05', '--time=12:00',
  '--time-basis=KOREAN_CIVIL_TIME', '--day-rollover=CIVIL_MIDNIGHT',
  '--hour-stem-reference=SELECTED_DAY_PILLAR',
];

test('Gregorian birth input and all policies are preserved without defaults', () => {
  assert.deepEqual(parse(required), {
    input: { calendar: 'GREGORIAN', gregorianDate: '2027-02-05' },
    clock: '12:00',
    policies: { timeBasis: 'KOREAN_CIVIL_TIME', dayRollover: 'CIVIL_MIDNIGHT',
      hourStemReference: 'SELECTED_DAY_PILLAR' },
  });
});

test('lunar leap flag is mandatory and false is distinct from true', () => {
  const lunar = required.map(x => x === '--calendar=GREGORIAN' ? '--calendar=KOREAN_LUNAR' : x);
  assert.throws(() => parse(lunar), /--leap/);
  assert.equal(parse([...lunar, '--leap=false']).input.lunarDate.isLeapMonth, false);
  assert.equal(parse([...lunar, '--leap=true']).input.lunarDate.isLeapMonth, true);
  assert.deepEqual(parse([...lunar, '--leap=false']).input.lunarDate,
    { lunarYear: 2027, lunarMonth: 2, lunarDay: 5, isLeapMonth: false });
});

test('unknown, duplicate, empty and positional flags are rejected', () => {
  for (const extra of ['--calendar=GREGORIAN', '--unknown=yes', '--time=', 'hello', '--help']) {
    assert.throws(() => parse([...required, extra]), RangeError, extra);
  }
});

test('missing or unsupported time policies cannot be inferred', () => {
  for (const key of ['time-basis', 'day-rollover', 'hour-stem-reference']) {
    assert.throws(() => parse(required.filter(x => !x.startsWith('--' + key + '='))), RangeError);
  }
  assert.throws(() => parse(required.map(x => x.replace('CIVIL_MIDNIGHT', 'AUTO'))), RangeError);
  assert.throws(() => parse(required.map(x => x.replace('KOREAN_CIVIL_TIME', 'LOCAL_APPARENT_SOLAR_TIME'))), RangeError);
  assert.throws(() => parse(required.map(x => x.replace('SELECTED_DAY_PILLAR', 'AUTO'))), RangeError);
});

test('bad dates, times and calendar declarations are rejected', () => {
  for (const bad of ['2027-2-05', '2027-02-05T12:00', '2027/02/05']) {
    assert.throws(() => parse(required.map(x => x.replace('2027-02-05', bad))), RangeError);
  }
  for (const bad of ['24:00', '23:60', '2:30']) {
    assert.throws(() => parse(required.map(x => x.replace('12:00', bad))), RangeError);
  }
  assert.throws(() => parse(required.map(x => x.replace('GREGORIAN', 'AUTO'))), RangeError);
  assert.throws(() => parse([...required, '--leap=false']), /forbidden/);
});
