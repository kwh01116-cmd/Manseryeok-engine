import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { SOLAR_TERM_CODES } from '../dist/calendar/solarTerms.js';
import { validateFullYearSolarTermCoverage, SolarTermQueryOutOfCoverageError } from '../dist/calendar/solarTermCoverage.js';
import { validateKstMinuteSolarTermTimeline } from '../dist/calendar/solarTermTimeline.js';
import { compareKstSolarTermMinuteEditions } from '../dist/calendar/solarTermDifferential.js';
import { MONTH_BOUNDARY_JIE } from '../dist/calendar/monthPillar.js';
import { resolveYearMonthPillars } from '../dist/calendar/yearMonthPillars.js';

// Primary NAOJ 1999 and 2000 archived government almanacs, PDF p. 2.
// Research-only. Their JST published-minute table shares UTC+09:00 with 1999/2000 KST,
// but is NOT the Korean Gazette and is NOT minute-identical to KASI 2000.
const naoj = JSON.parse(readFileSync(new URL('./fixtures/naoj-solar-terms-1999-2000.json', import.meta.url), 'utf8'));
const kasi = JSON.parse(readFileSync(new URL('./fixtures/kasi-2000-archive-research.json', import.meta.url), 'utf8'));
const events = naoj.events.map(row => Object.freeze({
  term: row.term,
  displayedDateTime: row.displayedDateTime,
  timeBasis: 'KST',
  sourcePrecision: 'MINUTE',
  sourceIds: Object.freeze([naoj.sourceEditions[String(row.editionYear)].sourceId]),
}));
const manifest = {
  schemaVersion: 'm1-solar-term-coverage-v1',
  requirementProfile: 'FULL_24_TERM_YEAR',
  timeBasis: 'KST', sourcePrecision: 'MINUTE',
  supportedFromInclusive: '2000-01-01T00:00',
  supportedUntilExclusive: '2001-01-01T00:00',
  requiredYears: [2000],
  requiredPriorBoundary: { year: 1999, term: 'DAXUE' },
};
const policy = {
  timeBasis: 'KOREAN_CIVIL_TIME', dayRollover: 'CIVIL_MIDNIGHT',
  hourStemReference: 'SELECTED_DAY_PILLAR',
};
const label = x => x.stem + x.branch;
const tick = (kstMinute, d) => new Date(Date.parse(kstMinute + ':00Z') + d * 60000).toISOString().slice(0, 16);

test('primary 1999 NAOJ Daxue guard plus complete 2000 solar-term year is canonical', () => {
  assert.equal(naoj.scope, 'RESEARCH_ONLY_NOT_CONSUMER_RUNTIME');
  assert.equal(naoj.sourcePrecision, 'MINUTE');
  assert.equal(naoj.events.length, 25);
  assert.equal(events[0].displayedDateTime, '1999-12-07T22:47');
  assert.equal(events[0].sourceIds[0], 'JP-NAOJ-REKIYOU-1999');
  assert.deepEqual(events.slice(1).map(event => event.term), [...SOLAR_TERM_CODES]);
  assert.ok(events.slice(1).every(event => event.sourceIds[0] === 'JP-NAOJ-REKIYOU-2000'));
  assert.doesNotThrow(() => validateKstMinuteSolarTermTimeline(events));
  assert.doesNotThrow(() => validateFullYearSolarTermCoverage(events, manifest, '2000-01-01T00:00'));
  assert.doesNotThrow(() => validateFullYearSolarTermCoverage(events, manifest, '2000-12-31T23:59'));
});

test('2000 Lichun toggles correlated year/month candidates with no cross product', () => {
  const minute = '2000-02-04T21:40';
  const before = resolveYearMonthPillars(events, tick(minute, -1));
  const during = resolveYearMonthPillars(events, minute);
  const after = resolveYearMonthPillars(events, tick(minute, 1));
  assert.deepEqual([label(before.candidates[0].year), label(before.candidates[0].month)], ['己卯','丁丑']);
  assert.deepEqual([label(after.candidates[0].year), label(after.candidates[0].month)], ['庚辰','戊寅']);
  assert.equal(during.confidence, 'PUBLISHED_MINUTE_AMBIGUOUS');
  assert.deepEqual(during.candidates, [before.candidates[0], after.candidates[0]]);
});

test('all twelve published Jie minutes in 2000 preserve before/after correlation', () => {
  const jie = events.filter(e => e.displayedDateTime.startsWith('2000-') && MONTH_BOUNDARY_JIE.includes(e.term));
  assert.equal(jie.length, 12);
  for (const boundary of jie) {
    const minute = boundary.displayedDateTime;
    const before = resolveYearMonthPillars(events, tick(minute, -1));
    const during = resolveYearMonthPillars(events, minute);
    const after = resolveYearMonthPillars(events, tick(minute, 1));
    assert.equal(before.confidence, 'DEFINITE', minute);
    assert.equal(after.confidence, 'DEFINITE', minute);
    assert.equal(during.confidence, 'PUBLISHED_MINUTE_AMBIGUOUS', minute);
    assert.deepEqual(during.candidates, [before.candidates[0], after.candidates[0]], minute);
    assert.notDeepEqual(before.candidates[0].month, after.candidates[0].month, minute);
    if (boundary.term === 'LICHUN') assert.notDeepEqual(before.candidates[0].year, after.candidates[0].year);
    else assert.deepEqual(before.candidates[0].year, after.candidates[0].year);
  }
});

test('366 civil dates in 2000 resolve year/month without broadening consumer chart coverage', () => {
  let count = 0;
  for (let ms = Date.parse('2000-01-01T00:00:00Z'); ms < Date.parse('2001-01-01T00:00:00Z'); ms += 86400000) {
    const kst = new Date(ms).toISOString().slice(0, 10) + 'T12:00';
    validateFullYearSolarTermCoverage(events, manifest, kst);
    const result = resolveYearMonthPillars(events, kst);
    assert.equal(result.confidence, 'DEFINITE', kst);
    assert.equal(result.candidates.length, 1, kst);
    count++;
  }
  assert.equal(count, 366);
  const leapDay = resolveYearMonthPillars(events, '2000-02-29T12:00');
  assert.equal(label(leapDay.candidates[0].year), '庚辰');
  assert.equal(label(leapDay.candidates[0].month), '戊寅');
  assert.equal(naoj.scope, 'RESEARCH_ONLY_NOT_CONSUMER_RUNTIME');
});

test('2000 source differential reports 1-minute KASI/NAOJ conflicts without hiding them', () => {
  const primary = kasi.selectedSolarWitnesses.map(row => ({
    term: row.code, displayedDateTime: row.kstMinute, timeBasis: 'KST', sourcePrecision: 'MINUTE',
    sourceIds: [kasi.provenance.sourceId],
  }));
  const compared = events.filter(event => event.displayedDateTime.startsWith('2000-') && primary.some(row => row.term === event.term));
  const diff = compareKstSolarTermMinuteEditions(primary, compared);
  assert.deepEqual(diff.map(row => [row.term, row.deltaMinutes]), [
    ['XIAOHAN',1], ['LICHUN',0], ['YUSHUI',0], ['JINGZHE',1], ['LIDONG',1], ['DAXUE',1],
  ]);
  assert.ok(Object.isFrozen(diff));
  assert.ok(diff.every(row => Object.isFrozen(row.referenceSourceIds)));
  assert.equal(diff.filter(row => row.deltaMinutes !== 0).length, 4);
});

test('edition comparison rejects mismatched years, missing events, and false source evidence', () => {
  const sample = events.slice(1, 4);
  assert.deepEqual(compareKstSolarTermMinuteEditions(sample, sample).map(x => x.deltaMinutes), [0,0,0]);
  assert.throws(() => compareKstSolarTermMinuteEditions(sample, sample.slice(1)), /identical nonempty/);
  assert.throws(() => compareKstSolarTermMinuteEditions(sample, []), /identical nonempty/);
  assert.throws(() => compareKstSolarTermMinuteEditions(sample, sample.map((x,i) => i === 2
    ? { ...x, term: 'DONGZHI' } : x)), /Missing solar-term edition key/);
  assert.throws(() => compareKstSolarTermMinuteEditions(sample, sample.map((x,i) => i === 2
    ? { ...x, sourceIds: [] } : x)), /Missing source provenance/);
  assert.throws(() => compareKstSolarTermMinuteEditions(sample, sample.map((x,i) => i === 2
    ? { ...x, timeBasis: 'UTC' } : x)), /requires KST/);
});

test('2000 cannot silently become public coverage: missing 1999 guard, wrong year, or extrapolation', () => {
  assert.throws(() => validateFullYearSolarTermCoverage(events.slice(1), manifest, '2000-06-30T12:00'), /1999:DAXUE/);
  assert.throws(() => validateFullYearSolarTermCoverage(events, manifest, '1999-12-31T12:00'), SolarTermQueryOutOfCoverageError);
  assert.throws(() => validateFullYearSolarTermCoverage(events, manifest, '2001-01-01T00:00'), SolarTermQueryOutOfCoverageError);
  const broken = events.map((row, i) => i === 14 ? { ...row, term: 'JINGZHE' } : row);
  assert.throws(() => validateFullYearSolarTermCoverage(broken, manifest, '2000-07-01T12:00'));
});
