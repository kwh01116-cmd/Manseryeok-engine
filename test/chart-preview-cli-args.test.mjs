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


test('Gregorian dates are real calendar days; lunar input shape is bounded before corpus lookup', () => {
  const withDate = (date, calendar = 'GREGORIAN') => required.map(x =>
    x.startsWith('--date=') ? '--date=' + date :
    x.startsWith('--calendar=') ? '--calendar=' + calendar : x,
  ).concat(calendar === 'KOREAN_LUNAR' ? ['--leap=false'] : []);
  assert.equal(parse(withDate('2028-02-29')).input.gregorianDate, '2028-02-29');
  for (const date of ['2027-02-29', '2027-02-30', '2027-00-12', '2027-13-01', '0000-01-01']) {
    assert.throws(() => parse(withDate(date)), RangeError, date);
  }
  assert.equal(parse(withDate('2027-02-30', 'KOREAN_LUNAR')).input.lunarDate.lunarDay, 30);
  for (const date of ['2027-02-31', '2027-13-01', '0000-01-01']) {
    assert.throws(() => parse(withDate(date, 'KOREAN_LUNAR')), RangeError, date);
  }
  // Actual lunar month existence/leap status is still checked by the converter.
});
