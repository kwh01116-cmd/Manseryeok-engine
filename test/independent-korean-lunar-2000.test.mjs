import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import { createKoreanLunisolarConverter } from '../dist/calendar/koreanLunisolarConverter.js';
import { validateKoreanLunisolarCorpus } from '../dist/calendar/koreanLunisolarValidation.js';
import { resolveYearMonthPillars } from '../dist/calendar/yearMonthPillars.js';
import { validateFullYearSolarTermCoverage } from '../dist/calendar/solarTermCoverage.js';

const fixture = JSON.parse(readFileSync(new URL('./fixtures/independent-korean-lunar-1999-2000.json', import.meta.url)));
const naoj = JSON.parse(readFileSync(new URL('./fixtures/naoj-solar-terms-1999-2000.json', import.meta.url)));
const corpus = fixture.corpus;
const converter = createKoreanLunisolarConverter(corpus);
const events = naoj.events.map(event => ({
  term: event.term, displayedDateTime: event.displayedDateTime, timeBasis: 'KST',
  sourcePrecision: 'MINUTE', sourceIds: [naoj.sourceEditions[event.editionYear].sourceId],
}));
const manifest = {
  schemaVersion:'m1-solar-term-coverage-v1', requirementProfile:'FULL_24_TERM_YEAR',
  timeBasis:'KST', sourcePrecision:'MINUTE', supportedFromInclusive:'2000-01-01T00:00',
  supportedUntilExclusive:'2001-01-01T00:00', requiredYears:[2000],
  requiredPriorBoundary:{year:1999,term:'DAXUE'},
};
const ok = result => { assert.equal(result.status, 'OK'); return result.value; };
const monthStartsFor2000 = corpus.months.filter(m => m.lunarYear === 2000).map(m => m.gregorianStart);

// Computed independently from the 1999-02-23 KASI 2000 archival 12-month table;
// only a digest is pinned, not a republication of the protected table.
const KASI_2000_MONTH_STARTS_SHA256 = '1b61ba32c3387cd92b79fab150b7f82f3e0891f8cab880188bda0c4e64ea229b';

test('research-only independent MIT corpus is complete across 1999/2000 lunar years', () => {
  assert.equal(fixture.status, 'RESEARCH_ONLY_NOT_CONSUMER_RUNTIME');
  assert.equal(fixture.generator.version, '0.3.1');
  assert.equal(fixture.generator.license, 'MIT');
  assert.equal(fixture.publicApiAlternative.invoked, false);
  assert.equal(corpus.authorityLevel, 'INDEPENDENT_OPEN_SOURCE_IMPLEMENTATION_NOT_OFFICIAL_KASA');
  assert.equal(corpus.sourceId, 'ORG-USINGSKY-KOREAN-LUNAR-CALENDAR-PY-0.3.1');
  assert.equal(corpus.months.length, 24);
  assert.equal(corpus.months.filter(m => m.lunarYear === 1999).length, 12);
  assert.equal(monthStartsFor2000.length, 12);
  assert.equal(corpus.months.some(m => m.isLeapMonth), false);
  assert.doesNotThrow(() => validateKoreanLunisolarCorpus(corpus));
  assert.equal(converter.supportedGregorianFromInclusive, '1999-02-16');
  assert.equal(converter.supportedGregorianUntilExclusive, '2001-01-24');
  const provenance = converter.fromGregorianDate('2000-02-05');
  assert.equal(provenance.status, 'OK');
  assert.equal(provenance.sourceId, corpus.sourceId);
  assert.equal(provenance.authorityLevel, corpus.authorityLevel);
});

test('independently generated 2000 month starts match KASI 2000 archival digest', () => {
  const observed = createHash('sha256').update(monthStartsFor2000.join('\n')).digest('hex');
  assert.equal(observed, KASI_2000_MONTH_STARTS_SHA256);
  assert.equal(monthStartsFor2000[0], '2000-02-05');
  assert.equal(monthStartsFor2000.at(-1), '2000-12-26');
  assert.equal(ok(converter.fromGregorianDate('2000-02-04')).lunarYear, 1999);
  assert.deepEqual(ok(converter.fromGregorianDate('2000-02-05')), {
    lunarYear: 2000, lunarMonth:1, lunarDay:1, isLeapMonth:false,
  });
  assert.equal(ok(converter.fromLunarDate({lunarYear:2000,lunarMonth:12,lunarDay:29,isLeapMonth:false})), '2001-01-23');
  assert.equal(ok(converter.fromLunarDate({lunarYear:1999,lunarMonth:12,lunarDay:29,isLeapMonth:false})), '2000-02-04');
});

test('all 366 Gregorian days in 2000 roundtrip through the independent converter', () => {
  let count = 0;
  for (let ms = Date.parse('2000-01-01T00:00:00Z');ms<Date.parse('2001-01-01T00:00:00Z');ms+=86400000) {
    const date = new Date(ms).toISOString().slice(0,10);
    const lunar = ok(converter.fromGregorianDate(date));
    assert.equal(ok(converter.fromLunarDate(lunar)), date);
    count++;
  }
  assert.equal(count,366);
  assert.deepEqual(ok(converter.fromGregorianDate('2000-02-29')),
    {lunarYear:2000,lunarMonth:1,lunarDay:25,isLeapMonth:false});
});

test('every 2000 lunar month start and final day is invertible, including both year ends', () => {
  let verified = 0;
  for (const row of corpus.months) {
    for (const day of [1,row.days]) {
      const lunar = {lunarYear:row.lunarYear,lunarMonth:row.lunarMonth,lunarDay:day,isLeapMonth:row.isLeapMonth};
      const date = ok(converter.fromLunarDate(lunar));
      assert.deepEqual(ok(converter.fromGregorianDate(date)),lunar,date);
      verified++;
    }
  }
  assert.equal(verified,48);
});

test('2000 Gregorian/lunar representations feed identical real year/month pillar resolver', () => {
  let checked = 0;
  for (let ms=Date.parse('2000-01-01T00:00:00Z');ms<Date.parse('2001-01-01T00:00:00Z');ms+=86400000) {
    const date = new Date(ms).toISOString().slice(0,10);
    const lunar = ok(converter.fromGregorianDate(date));
    const converted = ok(converter.fromLunarDate(lunar));
    assert.equal(converted,date);
    const instant = date + 'T12:00';
    validateFullYearSolarTermCoverage(events,manifest,instant);
    assert.deepEqual(resolveYearMonthPillars(events,converted+'T12:00'),
      resolveYearMonthPillars(events,instant));
    checked++;
  }
  assert.equal(checked,366);
});

test('absent and forged lunar source provenance cannot pass the structural corpus validator', () => {
  assert.throws(() => createKoreanLunisolarConverter({...corpus,sourceId:'KR-KASI-CALENDAR-DATA'}),RangeError);
  assert.throws(() => createKoreanLunisolarConverter({...corpus,authorityLevel:'KASI_COMPUTATIONAL_REFERENCE_NOT_OFFICIAL_KASA'}),RangeError);
  assert.throws(() => createKoreanLunisolarConverter({...corpus,sourceId:'UNVERIFIED'}),RangeError);
  assert.throws(() => createKoreanLunisolarConverter({...corpus,sourceEditions:{2000:'unverified'}}),RangeError);
  assert.throws(() => createKoreanLunisolarConverter({...corpus,months:corpus.months.slice(1)}),/start at lunar new year/);
  assert.throws(() => createKoreanLunisolarConverter({...corpus,months:corpus.months.map(m => m.gregorianStart==='2000-02-05'?{...m,isLeapMonth:true}:m)}),/Invalid lunar month sequence/);
});

test('out-of-range and impossible lunar queries stay fail-closed', () => {
  assert.deepEqual(converter.fromGregorianDate('1999-02-15'),{status:'OUT_OF_COVERAGE'});
  assert.deepEqual(converter.fromGregorianDate('2001-01-24'),{status:'OUT_OF_COVERAGE'});
  assert.deepEqual(converter.fromLunarDate({lunarYear:2000,lunarMonth:6,lunarDay:1,isLeapMonth:true}),{status:'INVALID_LUNAR_DATE'});
  assert.deepEqual(converter.fromLunarDate({lunarYear:2000,lunarMonth:12,lunarDay:30,isLeapMonth:false}),{status:'INVALID_LUNAR_DATE'});
  assert.throws(() => converter.fromLunarDate({lunarYear:2000,lunarMonth:1,lunarDay:1}),RangeError);
  assert.throws(() => converter.fromGregorianDate('2000-02-30'),RangeError);
});
