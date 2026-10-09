import test from 'node:test';
import assert from 'node:assert/strict';
import { createKoreanLunisolarConverter, KASI_KOREAN_LUNISOLAR_2025_2027 as corpus,
  validateKoreanLunisolarCorpus } from '../dist/calendar/koreanLunisolar.js';

const converter = createKoreanLunisolarConverter(corpus);
const ok = value => { assert.equal(value.status, 'OK'); return value.value; };
const date = (lunarYear, lunarMonth, lunarDay, isLeapMonth) => ({ lunarYear, lunarMonth, lunarDay, isLeapMonth });

test('37 official-reference transcribed month starts are contiguous and all 3 lunar years complete', () => {
  assert.equal(corpus.months.length, 37);
  assert.doesNotThrow(() => validateKoreanLunisolarCorpus(corpus));
  assert.equal(converter.supportedGregorianFromInclusive, '2025-01-29');
  assert.equal(converter.supportedGregorianUntilExclusive, '2028-01-27');
});
test('2025 leap sixth month preserves leap flag and regular month boundaries', () => {
  for (const [gregorian, expected] of [
    ['2025-06-25', date(2025,6,1,false)],
    ['2025-07-24', date(2025,6,30,false)],
    ['2025-07-25', date(2025,6,1,true)],
    ['2025-08-22', date(2025,6,29,true)],
    ['2025-08-23', date(2025,7,1,false)],
  ]) assert.deepEqual(ok(converter.fromGregorianDate(gregorian)), expected);
  assert.equal(ok(converter.fromLunarDate(date(2025,6,1,false))), '2025-06-25');
  assert.equal(ok(converter.fromLunarDate(date(2025,6,1,true))), '2025-07-25');
});
test('Lunar year is not Gregorian year; KASI 2026/2027 New Year vectors', () => {
  assert.deepEqual(ok(converter.fromGregorianDate('2026-02-16')), date(2025,12,29,false));
  assert.deepEqual(ok(converter.fromGregorianDate('2026-02-17')), date(2026,1,1,false));
  assert.deepEqual(ok(converter.fromGregorianDate('2027-02-06')), date(2026,12,30,false));
  assert.deepEqual(ok(converter.fromGregorianDate('2027-02-07')), date(2027,1,1,false));
});
test('full finite Gregorian domain roundtrips, including every month end and leap day', () => {
  let count = 0;
  for (let ms = Date.parse('2025-01-29T00:00:00Z'); ms < Date.parse('2028-01-27T00:00:00Z'); ms += 86400000) {
    const gregorian = new Date(ms).toISOString().slice(0,10);
    const lunar = ok(converter.fromGregorianDate(gregorian));
    assert.equal(ok(converter.fromLunarDate(lunar)), gregorian);
    count++;
  }
  assert.equal(count, 1093);
});
test('fail closed outside finite range, absent leap flag, and nonexistent leap/day', () => {
  assert.deepEqual(converter.fromGregorianDate('2025-01-28'), {status:'OUT_OF_COVERAGE'});
  assert.deepEqual(converter.fromGregorianDate('2028-01-27'), {status:'OUT_OF_COVERAGE'});
  assert.deepEqual(converter.fromLunarDate(date(2024,12,1,false)), {status:'OUT_OF_COVERAGE'});
  assert.deepEqual(converter.fromLunarDate(date(2026,6,1,true)), {status:'INVALID_LUNAR_DATE'});
  assert.deepEqual(converter.fromLunarDate(date(2025,6,30,true)), {status:'INVALID_LUNAR_DATE'});
  assert.throws(() => converter.fromLunarDate({lunarYear:2025,lunarMonth:6,lunarDay:1}), RangeError);
  assert.throws(() => converter.fromGregorianDate('2025-02-29'), RangeError);
  assert.throws(() => converter.fromGregorianDate('2026-02-17T00:00'), TypeError);
});
test('corrupted corpus fails validation before conversion (omission, size, leap, metadata)', () => {
  const replace = months => ({...corpus, months});
  assert.throws(() => createKoreanLunisolarConverter(replace(corpus.months.slice(0,-1))), /end at lunar month 12/);
  assert.throws(() => createKoreanLunisolarConverter(replace(corpus.months.slice(1))), /start at lunar new year/);
  assert.throws(() => createKoreanLunisolarConverter(replace(corpus.months.filter(r=>r.gregorianStart!=='2025-07-25'))), /Noncontiguous/);
  assert.throws(() => createKoreanLunisolarConverter(replace(corpus.months.map(r=>r.gregorianStart==='2025-07-25'?{...r,days:30}:r))), /Noncontiguous/);
  assert.throws(() => createKoreanLunisolarConverter(replace(corpus.months.map(r=>r.gregorianStart==='2025-07-25'?{...r,isLeapMonth:false}:r))), /Duplicate lunar month/);
  assert.throws(() => createKoreanLunisolarConverter(replace(corpus.months.map(r=>r.gregorianStart==='2027-12-28'?{...r,days:29}:r))), /coverage bounds/);
  assert.throws(() => createKoreanLunisolarConverter({...corpus,sourceId:'FAKE'}), RangeError);
});
