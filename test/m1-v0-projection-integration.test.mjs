import test from 'node:test';
import assert from 'node:assert/strict';
import {
  createKoreanLunisolarConverter,
  KASI_KOREAN_LUNISOLAR_2025_2027,
  resolveKoreanBirthChartPreview,
  projectKoreanV0Story,
} from '../dist/index.js';
import { KOREA_SOLAR_TERM_EVENTS_2026_2027 } from '../dist/calendar/koreaSolarTermFixtures.js';
import { MONTH_BOUNDARY_JIE } from '../dist/calendar/monthPillar.js';

const converter = createKoreanLunisolarConverter(KASI_KOREAN_LUNISOLAR_2025_2027);
const events = KOREA_SOLAR_TERM_EVENTS_2026_2027;
const manifest = {
  schemaVersion: 'm1-solar-term-coverage-v1', requirementProfile: 'FULL_24_TERM_YEAR',
  timeBasis: 'KST', sourcePrecision: 'MINUTE',
  supportedFromInclusive: '2026-01-01T00:00', supportedUntilExclusive: '2028-01-01T00:00',
  requiredYears: [2026, 2027], requiredPriorBoundary: { year: 2025, term: 'DAXUE' },
};
const profiles = [
  { clock: '12:00', policy: { timeBasis: 'KOREAN_CIVIL_TIME', dayRollover: 'CIVIL_MIDNIGHT', hourStemReference: 'SELECTED_DAY_PILLAR' } },
  { clock: '23:30', policy: { timeBasis: 'KOREAN_CIVIL_TIME', dayRollover: 'ZI_START', hourStemReference: 'CIVIL_DATE_DAY_PILLAR' } },
];
const solar = date => ({ calendar: 'GREGORIAN', gregorianDate: date });
const lunar = date => ({ calendar: 'KOREAN_LUNAR', lunarDate: date });
const run = (input, clock, policy) => resolveKoreanBirthChartPreview(input, clock, policy, converter, events, manifest);
const day = millis => new Date(millis).toISOString().slice(0, 10);
const shiftMinute = (minute, delta) => new Date(Date.parse(minute + ':00Z') + delta * 60_000).toISOString().slice(0, 16);

test('every 2026/2027 civil date: Gregorian and lunar births produce identical M1 charts and U0 stories under two explicit clock policies', () => {
  let checkedDates = 0;
  let checkedPairs = 0;
  for (let ms = Date.parse('2026-01-01T00:00:00Z'); ms < Date.parse('2028-01-01T00:00:00Z'); ms += 86_400_000) {
    const date = day(ms);
    const converted = converter.fromGregorianDate(date);
    assert.equal(converted.status, 'OK', date);
    for (const { clock, policy } of profiles) {
      const a = run(solar(date), clock, policy);
      const b = run(lunar(converted.value), clock, policy);
      assert.equal(a.status, 'OK', `${date} ${clock} Gregorian`);
      assert.equal(b.status, 'OK', `${date} ${clock} lunar`);
      assert.equal(a.preview.recordedBirthKstMinute, b.preview.recordedBirthKstMinute, date);
      assert.equal(a.preview.effectiveDayDate, b.preview.effectiveDayDate, date);
      assert.deepEqual(a.preview.candidates, b.preview.candidates, `${date} ${clock} Four Pillars`);
      assert.deepEqual(projectKoreanV0Story(a), projectKoreanV0Story(b), `${date} ${clock} story`);
      assert.equal(a.preview.lunarConversionSource, undefined);
      assert.equal(b.preview.lunarConversionSource.sourceId, 'KR-KASI-CALENDAR-DATA');
      checkedPairs++;
    }
    checkedDates++;
  }
  assert.equal(checkedDates, 730);
  assert.equal(checkedPairs, 1460);
});

test('all 24 published Jie boundary minutes retain exactly the adjacent real-engine candidates through U0', () => {
  const jie = new Set(MONTH_BOUNDARY_JIE);
  const boundaries = events.filter(x => x.displayedDateTime.startsWith('2026-') || x.displayedDateTime.startsWith('2027-'))
    .filter(x => jie.has(x.term));
  assert.equal(boundaries.length, 24);
  const policy = profiles[0].policy;
  for (const boundary of boundaries) {
    const at = boundary.displayedDateTime;
    const beforeMinute = shiftMinute(at, -1);
    const afterMinute = shiftMinute(at, 1);
    const before = run(solar(beforeMinute.slice(0, 10)), beforeMinute.slice(11), policy);
    const during = run(solar(at.slice(0, 10)), at.slice(11), policy);
    const after = run(solar(afterMinute.slice(0, 10)), afterMinute.slice(11), policy);
    assert.equal(before.status, 'OK', at + ' -1');
    assert.equal(during.status, 'OK', at);
    assert.equal(after.status, 'OK', at + ' +1');
    assert.equal(during.preview.confidence, 'PUBLISHED_MINUTE_AMBIGUOUS', at);
    assert.equal(during.preview.candidates.length, 2, at);
    assert.deepEqual(during.preview.candidates[0], before.preview.candidates[0], at + ' before');
    assert.deepEqual(during.preview.candidates[1], after.preview.candidates[0], at + ' after');
    const story = projectKoreanV0Story(during);
    assert.equal(story.status, 'READY');
    assert.equal(story.candidateDisplay, 'SHOW_ALL_BOUNDARY_CANDIDATES');
    assert.deepEqual(story.candidates.map(c => c.beats[0].pillars.map(p => p.label.hanja)),
      during.preview.candidates.map(c => [c.year.hanja, c.month.hanja, c.day.hanja, c.hour.hanja]));
  }
});

test('outside declared coverage and invalid leap month never yield story scenes', () => {
  const { clock, policy } = profiles[0];
  const outside = run(solar('2028-01-01'), clock, policy);
  assert.deepEqual(outside, { status: 'OUT_OF_COVERAGE' });
  assert.deepEqual(projectKoreanV0Story(outside), {
    schemaVersion: 'u0-story-projection-v1', status: 'BLOCKED', reason: 'OUT_OF_COVERAGE', candidates: [],
  });
  const invalid = run(lunar({ lunarYear: 2026, lunarMonth: 6, lunarDay: 1, isLeapMonth: true }), clock, policy);
  assert.deepEqual(invalid, { status: 'INVALID_LUNAR_DATE' });
  assert.equal(projectKoreanV0Story(invalid).status, 'BLOCKED');
});
