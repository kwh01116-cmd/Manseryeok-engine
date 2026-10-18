import assert from 'node:assert/strict';
import test from 'node:test';
import { dayPillarForGregorianDate } from '../dist/calendar/dayPillar.js';

// Directly published KASI 2000 almanac (1999-02-23), section "각월의 1일의 일진".
// These are independent witnesses; never derive expected labels from the production anchor.
// https://www.kasi.re.kr/publication/post/newsMaterial/2008
// The original notice restricts redistribution/commercial use; these day labels are used
// only for internal factual comparison, not as permission to repackage the publication.
const publishedGregorianMonthStarts = [
  ['2000-01-01', '戊午'], ['2000-02-01', '己丑'],
  ['2000-03-01', '戊午'], ['2000-04-01', '己丑'],
  ['2000-05-01', '己未'], ['2000-06-01', '庚寅'],
  ['2000-07-01', '庚申'], ['2000-08-01', '辛卯'],
  ['2000-09-01', '壬戌'], ['2000-10-01', '壬辰'],
  ['2000-11-01', '癸亥'], ['2000-12-01', '癸巳'],
];

test('KASI original 2000 almanac: twelve independent Gregorian month-start day pillars', () => {
  assert.equal(publishedGregorianMonthStarts.length, 12);
  for (const [date, expected] of publishedGregorianMonthStarts) {
    const actual = dayPillarForGregorianDate(date);
    assert.equal(actual.stem + actual.branch, expected, date);
  }
});

test('leap February 2000 preserves the uninterrupted day cycle', () => {
  assert.equal(dayPillarForGregorianDate('2000-02-28').stem + dayPillarForGregorianDate('2000-02-28').branch, '丙辰');
  assert.equal(dayPillarForGregorianDate('2000-02-29').stem + dayPillarForGregorianDate('2000-02-29').branch, '丁巳');
  assert.equal(dayPillarForGregorianDate('2000-03-01').stem + dayPillarForGregorianDate('2000-03-01').branch, '戊午');
});
