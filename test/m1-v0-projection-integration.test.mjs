import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
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
const run = (input, clock, policy, timeline = events) => resolveKoreanBirthChartPreview(input, clock, policy, converter, timeline, manifest);
const day = millis => new Date(millis).toISOString().slice(0, 10);
const shiftMinute = (minute, delta) => new Date(Date.parse(minute + ':00Z') + delta * 60_000).toISOString().slice(0, 16);
const yearMonth = ({ year, month }) => ({ year, month });
const candidateLabels = candidate => ['year', 'month', 'day', 'hour'].map(role => candidate[role].hanja);
const clockBoundaryWitness = JSON.parse(readFileSync(
  new URL('./fixtures/jie-clock-boundary-2026-jingzhe.json', import.meta.url), 'utf8',
));

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
    // Adjacent birth minutes can cross an hour/day boundary (Jingzhe 22:59 -> 23:00).
    // Only the solar-term-dependent year/month pair must match those neighbors.
    assert.deepEqual(yearMonth(during.preview.candidates[0]), yearMonth(before.preview.candidates[0]), at + ' before');
    assert.deepEqual(yearMonth(during.preview.candidates[1]), yearMonth(after.preview.candidates[0]), at + ' after');
    // Keep the full Four-Pillars assertion: hold the birth clock fixed and move
    // only this boundary by a minute in synthetic copies, never the shared fixture.
    for (const [delta, candidateIndex] of [[1, 0], [-1, 1]]) {
      const shifted = events.map(event => event === boundary
        ? { ...event, displayedDateTime: shiftMinute(at, delta) } : event);
      const control = run(solar(at.slice(0, 10)), at.slice(11), policy, shifted);
      assert.equal(control.status, 'OK', at + ' fixed-clock control');
      assert.equal(control.preview.confidence, 'DEFINITE', at + ' fixed-clock control');
      assert.equal(control.preview.candidates.length, 1, at + ' fixed-clock control');
      assert.deepEqual(during.preview.candidates[candidateIndex], control.preview.candidates[0],
        at + ' fixed-clock candidate ' + candidateIndex);
    }
    const story = projectKoreanV0Story(during);
    assert.equal(story.status, 'READY');
    assert.equal(story.candidateDisplay, 'SHOW_ALL_BOUNDARY_CANDIDATES');
    assert.deepEqual(story.candidates.map(c => c.beats[0].pillars.map(p => p.label.hanja)),
      during.preview.candidates.map(c => [c.year.hanja, c.month.hanja, c.day.hanja, c.hour.hanja]));
  }
});

test('Jingzhe next to 23:00 preserves exact charts and stories under three explicit rollover/hour-stem policies', () => {
  const witness = clockBoundaryWitness;
  assert.equal(witness.schemaVersion, 'm1-jie-clock-boundary-witness-v1');
  const boundary = events.find(event => event.term === witness.boundary.term &&
    event.displayedDateTime === witness.boundary.displayedDateTime);
  assert.ok(boundary, 'published Jingzhe fixture');
  assert.deepEqual(boundary.sourceIds, witness.boundary.sourceIds);
  assert.equal(boundary.timeBasis, witness.boundary.timeBasis);
  assert.equal(boundary.sourcePrecision, witness.boundary.sourcePrecision);
  const converted = converter.fromGregorianDate(witness.gregorianDate);
  assert.equal(converted.status, 'OK');
  assert.equal(witness.profiles.length, 3);
  let checked = 0;
  for (const profile of witness.profiles) {
    assert.equal(profile.vectors.length, 3, profile.id);
    for (const vector of profile.vectors) {
      for (const input of [solar(witness.gregorianDate), lunar(converted.value)]) {
        const result = run(input, vector.clock, profile.policy);
        const label = profile.id + ' ' + vector.clock + ' ' + input.calendar;
        assert.equal(result.status, 'OK', label);
        assert.equal(result.preview.recordedBirthKstMinute, witness.gregorianDate + 'T' + vector.clock, label);
        assert.equal(result.preview.effectiveDayDate, vector.effectiveDayDate, label);
        assert.deepEqual(result.preview.policies, profile.policy, label);
        assert.equal(result.preview.confidence, vector.confidence, label);
        assert.equal(result.preview.confidenceScope, 'PUBLISHED_MINUTE_COMPARISON_ONLY', label);
        assert.deepEqual(result.preview.candidates.map(candidateLabels), vector.candidates, label);
        const story = projectKoreanV0Story(result);
        assert.equal(story.status, 'READY', label);
        assert.deepEqual(story.policies, profile.policy, label);
        assert.equal(story.candidateDisplay, vector.confidence === 'DEFINITE'
          ? 'ONE' : 'SHOW_ALL_BOUNDARY_CANDIDATES', label);
        assert.deepEqual(story.candidates.map(candidate => candidate.beats[0].pillars.map(pillar => pillar.label.hanja)),
          vector.candidates, label);
        checked++;
      }
    }
  }
  assert.equal(checked, 18);
});

test('Jingzhe clock-boundary witness does not supply missing or unknown disputed policies', () => {
  const complete = clockBoundaryWitness.profiles[0].policy;
  const { dayRollover, ...withoutRollover } = complete;
  const { hourStemReference, ...withoutHourStem } = complete;
  const policies = [
    withoutRollover, withoutHourStem,
    { ...complete, dayRollover: 'UNKNOWN' },
    { ...complete, hourStemReference: 'UNKNOWN' },
    { ...complete, timeBasis: 'LOCAL_APPARENT_SOLAR_TIME' },
  ];
  for (const policy of policies) {
    for (const clock of ['22:59', '23:00']) {
      assert.throws(() => run(solar(clockBoundaryWitness.gregorianDate), clock, policy), RangeError);
    }
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
