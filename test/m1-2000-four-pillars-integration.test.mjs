import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import { createKoreanLunisolarConverter } from '../dist/calendar/koreanLunisolarConverter.js';
import { resolveKoreanBirthChartPreview } from '../dist/calendar/koreanBirthPreview.js';

// Historical reference corpora are test-only: no additions to the V0 web/CLI manifest.
const lunarFixture = JSON.parse(readFileSync(new URL('./fixtures/independent-korean-lunar-1999-2000.json', import.meta.url), 'utf8'));
const solarFixture = JSON.parse(readFileSync(new URL('./fixtures/naoj-solar-terms-1999-2000.json', import.meta.url), 'utf8'));
const kasiWitnesses = JSON.parse(readFileSync(new URL('./fixtures/kasi-2000-archive-research.json', import.meta.url), 'utf8'));
const converter = createKoreanLunisolarConverter(lunarFixture.corpus);
const naojEvents = solarFixture.events.map(event => ({
  term: event.term,
  displayedDateTime: event.displayedDateTime,
  timeBasis: 'KST',
  sourcePrecision: 'MINUTE',
  sourceIds: [solarFixture.sourceEditions[event.editionYear].sourceId],
}));
const manifest = Object.freeze({
  schemaVersion: 'm1-solar-term-coverage-v1',
  requirementProfile: 'FULL_24_TERM_YEAR',
  timeBasis: 'KST', sourcePrecision: 'MINUTE',
  supportedFromInclusive: '2000-01-01T00:00',
  supportedUntilExclusive: '2001-01-01T00:00',
  requiredYears: [2000], requiredPriorBoundary: { year: 1999, term: 'DAXUE' },
});
const profiles = [
  { timeBasis: 'KOREAN_CIVIL_TIME', dayRollover: 'CIVIL_MIDNIGHT', hourStemReference: 'SELECTED_DAY_PILLAR' },
  { timeBasis: 'KOREAN_CIVIL_TIME', dayRollover: 'ZI_START', hourStemReference: 'SELECTED_DAY_PILLAR' },
  { timeBasis: 'KOREAN_CIVIL_TIME', dayRollover: 'ZI_START', hourStemReference: 'CIVIL_DATE_DAY_PILLAR' },
];
const gregorian = date => ({ calendar: 'GREGORIAN', gregorianDate: date });
const asLunar = date => {
  const result = converter.fromGregorianDate(date);
  assert.equal(result.status, 'OK', date);
  return { calendar: 'KOREAN_LUNAR', lunarDate: result.value };
};
const preview = (input, clock, policy = profiles[0], events = naojEvents) =>
  resolveKoreanBirthChartPreview(input, clock, policy, converter, events, manifest);
const chart = result => { assert.equal(result.status, 'OK'); return result.preview; };
const dayString = epochMs => new Date(epochMs).toISOString().slice(0, 10);
const minuteShift = (kstMinute, delta) => new Date(Date.parse(kstMinute + ':00Z') + delta * 60_000).toISOString().slice(0, 16);
const pair = candidate => ({ year: candidate.year.hanja, month: candidate.month.hanja });

function assertSameChart(gDate, clock, policy, events = naojEvents) {
  const solar = chart(preview(gregorian(gDate), clock, policy, events));
  const lunar = chart(preview(asLunar(gDate), clock, policy, events));
  assert.equal(solar.recordedBirthKstMinute, gDate + 'T' + clock);
  assert.equal(lunar.recordedBirthKstMinute, solar.recordedBirthKstMinute);
  assert.equal(lunar.effectiveDayDate, solar.effectiveDayDate);
  assert.deepEqual(lunar.candidates, solar.candidates);
  assert.equal(lunar.confidence, solar.confidence);
  assert.deepEqual(lunar.policies, solar.policies);
  assert.deepEqual(lunar.coverage, solar.coverage);
  assert.equal(solar.lunarConversionSource, undefined);
  assert.equal(lunar.lunarConversionSource?.sourceId,
    'ORG-USINGSKY-KOREAN-LUNAR-CALENDAR-PY-0.3.1');
  assert.equal(lunar.lunarConversionSource?.authorityLevel,
    'INDEPENDENT_OPEN_SOURCE_IMPLEMENTATION_NOT_OFFICIAL_KASA');
  assert.equal(lunar.confidenceScope, 'PUBLISHED_MINUTE_COMPARISON_ONLY');
  return solar;
}

test('historical M1 sources remain test-only and separate from Korean KASI authority', () => {
  assert.equal(lunarFixture.status, 'RESEARCH_ONLY_NOT_CONSUMER_RUNTIME');
  assert.equal(solarFixture.scope, 'RESEARCH_ONLY_NOT_CONSUMER_RUNTIME');
  assert.equal(manifest.supportedFromInclusive, '2000-01-01T00:00');
  assert.equal(naojEvents.length, 25);
  assert.equal(naojEvents[0].sourceIds[0], 'JP-NAOJ-REKIYOU-1999');
  assert.equal(lunarFixture.corpus.sourceId, 'ORG-USINGSKY-KOREAN-LUNAR-CALENDAR-PY-0.3.1');
});

test('all 366 Gregorian dates in 2000 yield identical four pillars for both calendar inputs across explicit policy profiles', () => {
  let pairs = 0;
  for (let ms = Date.parse('2000-01-01T00:00:00Z'); ms < Date.parse('2001-01-01T00:00:00Z'); ms += 86_400_000) {
    const date = dayString(ms);
    for (const policy of profiles) {
      const chartAtNoon = assertSameChart(date, '12:00', policy);
      assert.equal(chartAtNoon.candidates.length, 1, date);
      assert.equal(chartAtNoon.confidence, 'DEFINITE', date);
      pairs++;
    }
  }
  assert.equal(pairs, 366 * profiles.length);
});

test('2000 leap day at 23:30 preserves Korean Zi rollover and hour-stem policy differences', () => {
  const civil = assertSameChart('2000-02-29', '23:30', profiles[0]);
  const ziSelected = assertSameChart('2000-02-29', '23:30', profiles[1]);
  const ziCivilHour = assertSameChart('2000-02-29', '23:30', profiles[2]);
  assert.equal(civil.effectiveDayDate, '2000-02-29');
  assert.equal(ziSelected.effectiveDayDate, '2000-03-01');
  assert.equal(ziCivilHour.effectiveDayDate, '2000-03-01');
  assert.notDeepEqual(civil.candidates[0].day, ziSelected.candidates[0].day);
  assert.deepEqual(ziSelected.candidates[0].day, ziCivilHour.candidates[0].day);
  assert.deepEqual(ziSelected.candidates[0].year, ziCivilHour.candidates[0].year);
  assert.deepEqual(ziSelected.candidates[0].month, ziCivilHour.candidates[0].month);
  assert.notDeepEqual(ziSelected.candidates[0].hour, ziCivilHour.candidates[0].hour);
  assert.equal(civil.candidates[0].day.hanja, '丁巳');
  assert.equal(ziSelected.candidates[0].day.hanja, '戊午');
  assert.equal(ziSelected.candidates[0].hour.hanja, '壬子');
  assert.equal(ziCivilHour.candidates[0].hour.hanja, '庚子');
});

test('all twelve 2000 Jie boundaries retain exactly two correlated four-pillar candidates for both calendar formats', () => {
  const jie = new Set(['LICHUN','JINGZHE','QINGMING','LIXIA','MANGZHONG','XIAOSHU',
    'LIQIU','BAILU','HANLU','LIDONG','DAXUE','XIAOHAN']);
  const boundaries = naojEvents.filter(event => event.displayedDateTime.startsWith('2000-') && jie.has(event.term));
  assert.equal(boundaries.length, 12);
  for (const boundary of boundaries) {
    const minute = boundary.displayedDateTime;
    const date = minute.slice(0, 10);
    const clock = minute.slice(11);
    for (const policy of profiles) {
      const at = assertSameChart(date, clock, policy);
      const earlier = minuteShift(minute, -1);
      const later = minuteShift(minute, 1);
      const before = assertSameChart(earlier.slice(0, 10), earlier.slice(11), policy);
      const after = assertSameChart(later.slice(0, 10), later.slice(11), policy);
      assert.equal(at.confidence, 'PUBLISHED_MINUTE_AMBIGUOUS', boundary.term + ' ' + clock);
      assert.equal(at.candidates.length, 2, boundary.term);
      assert.deepEqual(pair(at.candidates[0]), pair(before.candidates[0]), boundary.term + ' before');
      assert.deepEqual(pair(at.candidates[1]), pair(after.candidates[0]), boundary.term + ' after');
      assert.deepEqual(at.candidates[0].day, at.candidates[1].day);
      assert.deepEqual(at.candidates[0].hour, at.candidates[1].hour);
      if (boundary.term === 'LICHUN') {
        assert.notDeepEqual(at.candidates[0].year, at.candidates[1].year);
      } else {
        assert.deepEqual(at.candidates[0].year, at.candidates[1].year);
      }
    }
  }
});

test('independent minute disagreements are surfaced, never silently rounded into identical charts', () => {
  const different = new Set(['XIAOHAN', 'JINGZHE', 'LIDONG', 'DAXUE']);
  const kasiEvents = naojEvents.map(event => {
    const korean = kasiWitnesses.selectedSolarWitnesses.find(w => w.code === event.term &&
      w.kstMinute.slice(0, 4) === event.displayedDateTime.slice(0, 4));
    return korean ? { ...event, displayedDateTime: korean.kstMinute,
      sourceIds: [kasiWitnesses.provenance.sourceId] } : event;
  });
  for (const term of different) {
    const korean = kasiWitnesses.selectedSolarWitnesses.find(w => w.code === term);
    const atKasi = korean.kstMinute;
    const atNaoj = minuteShift(atKasi, 1);
    const atKasiOutput = chart(preview(gregorian(atKasi.slice(0, 10)), atKasi.slice(11), profiles[0], kasiEvents));
    const atNaojOutput = chart(preview(gregorian(atKasi.slice(0, 10)), atKasi.slice(11), profiles[0], naojEvents));
    assert.equal(atKasiOutput.confidence, 'PUBLISHED_MINUTE_AMBIGUOUS', term);
    assert.equal(atNaojOutput.confidence, 'DEFINITE', term);
    assert.deepEqual(pair(atKasiOutput.candidates[0]), pair(atNaojOutput.candidates[0]), term);
    const atNaojBoundary = chart(preview(gregorian(atNaoj.slice(0, 10)), atNaoj.slice(11), profiles[0], naojEvents));
    const afterKasi = chart(preview(gregorian(atNaoj.slice(0, 10)), atNaoj.slice(11), profiles[0], kasiEvents));
    assert.equal(atNaojBoundary.confidence, 'PUBLISHED_MINUTE_AMBIGUOUS', term);
    assert.equal(afterKasi.confidence, 'DEFINITE', term);
    assert.deepEqual(pair(afterKasi.candidates[0]), pair(atNaojBoundary.candidates[1]), term);
    assertSameChart(atKasi.slice(0, 10), atKasi.slice(11), profiles[0], kasiEvents);
  }
});

test('Lunar New Year must not replace Lichun as a year-pillar boundary', () => {
  const feb4Before = assertSameChart('2000-02-04', '21:39', profiles[0]);
  const feb4At = assertSameChart('2000-02-04', '21:40', profiles[0]);
  const feb4After = assertSameChart('2000-02-04', '21:41', profiles[0]);
  assert.deepEqual(feb4At.candidates.map(pair), [pair(feb4Before.candidates[0]), pair(feb4After.candidates[0])]);
  assert.equal(feb4Before.candidates[0].year.hanja, '己卯');
  assert.equal(feb4After.candidates[0].year.hanja, '庚辰');
  const newYearEve = assertSameChart('2000-02-04', '22:00', profiles[0]);
  const newYear = assertSameChart('2000-02-05', '12:00', profiles[0]);
  assert.equal(newYearEve.candidates[0].year.hanja, '庚辰');
  assert.equal(newYear.candidates[0].year.hanja, '庚辰');
  assert.deepEqual(Object.fromEntries(['year', 'month', 'day', 'hour'].map(k => [k, newYear.candidates[0][k].hanja])),
    { year: '庚辰', month: '戊寅', day: '癸巳', hour: '戊午' });
  assert.deepEqual(asLunar('2000-02-04').lunarDate,
    { lunarYear: 1999, lunarMonth: 12, lunarDay: 29, isLeapMonth: false });
  assert.deepEqual(asLunar('2000-02-05').lunarDate,
    { lunarYear: 2000, lunarMonth: 1, lunarDay: 1, isLeapMonth: false });
});

test('historical corpus beyond its Gregorian solar-term gate fails closed despite lunar converter coverage', () => {
  for (const date of ['1999-12-31', '2001-01-01', '2001-01-23']) {
    assert.equal(converter.fromGregorianDate(date).status, 'OK');
    assert.deepEqual(preview(gregorian(date), '12:00'), { status: 'OUT_OF_COVERAGE' });
    assert.deepEqual(preview(asLunar(date), '12:00'), { status: 'OUT_OF_COVERAGE' });
  }
  assert.deepEqual(preview({ calendar: 'KOREAN_LUNAR',
    lunarDate: { lunarYear: 2000, lunarMonth: 6, lunarDay: 1, isLeapMonth: true } }, '12:00'),
    { status: 'INVALID_LUNAR_DATE' });
  assert.deepEqual(converter.fromGregorianDate('2001-01-24'), { status: 'OUT_OF_COVERAGE' });
});


test('Gregorian/lunar Four Pillars parity survives 2000 civil-day and Zi rollover boundaries', () => {
  const dates = ['2000-01-01', '2000-02-04', '2000-02-05', '2000-02-28',
    '2000-02-29', '2000-03-01', '2000-12-30', '2000-12-31'];
  const clocks = ['00:00', '00:59', '01:00', '22:59', '23:00', '23:59'];
  let comparisons = 0;
  for (const date of dates) {
    for (const clock of clocks) {
      for (const policy of profiles) {
        const actual = assertSameChart(date, clock, policy);
        assert.equal(actual.candidates.length, 1, date + ' ' + clock);
        assert.equal(actual.confidence, 'DEFINITE', date + ' ' + clock);
        assert.equal(actual.effectiveDayDate,
          policy.dayRollover === 'ZI_START' && clock >= '23:00'
            ? dayString(Date.parse(date + 'T00:00:00Z') + 86_400_000)
            : date);
        comparisons++;
      }
    }
  }
  assert.equal(comparisons, 8 * 6 * 3);
});
