import assert from 'node:assert/strict';
import test from 'node:test';
import { dayPillarForGregorianDate } from '../dist/calendar/dayPillar.js';

// KASI calendar-data, 2026 and 2027 V1.0a, lunar month-first-day 日辰.
// Independent published calendar witnesses; not inferred from the engine anchor.
// https://astro.kasi.re.kr/kor/life/post/calendarData?search_year=2026
// https://astro.kasi.re.kr/kor/life/post/calendarData?search_year=2027
const publishedMonthStarts = [
  ['2026-02-17', '壬戌'], ['2026-03-19', '壬辰'],
  ['2026-04-17', '辛酉'], ['2026-05-17', '辛卯'],
  ['2026-06-15', '庚申'], ['2026-07-14', '己丑'],
  ['2026-08-13', '己未'], ['2026-09-11', '戊子'],
  ['2026-10-11', '戊午'], ['2026-11-09', '丁亥'],
  ['2026-12-09', '丁巳'], ['2027-01-08', '丁亥'],
  ['2027-02-07', '丁巳'], ['2027-03-08', '丙戌'],
  ['2027-04-07', '丙辰'], ['2027-05-06', '乙酉'],
  ['2027-06-05', '乙卯'], ['2027-07-04', '甲申'],
  ['2027-08-02', '癸丑'], ['2027-09-01', '癸未'],
  ['2027-09-30', '壬子'], ['2027-10-29', '辛巳'],
  ['2027-11-28', '辛亥'], ['2027-12-28', '辛巳'],
];

test('24 KASI 2026/2027 lunar month-start day pillars match independent published 日辰', () => {
  assert.equal(publishedMonthStarts.length, 24);
  for (const [date, published] of publishedMonthStarts) {
    const actual = dayPillarForGregorianDate(date);
    assert.equal(actual.stem + actual.branch, published, date);
  }
});

test('KASI lunar new years do not reset the continuous day cycle', () => {
  assert.deepEqual(dayPillarForGregorianDate('2026-02-17'), { stem: '壬', branch: '戌' });
  assert.deepEqual(dayPillarForGregorianDate('2027-02-07'), { stem: '丁', branch: '巳' });
  assert.deepEqual(dayPillarForGregorianDate('2027-01-08'), { stem: '丁', branch: '亥' });
});
