import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import { validateKstMinuteSolarTermTimeline } from '../dist/calendar/solarTermTimeline.js';
import { validateFullYearSolarTermCoverage } from '../dist/calendar/solarTermCoverage.js';
import { resolveMonthBranchAtJie } from '../dist/calendar/monthPillar.js';
import { resolveYearMonthPillars } from '../dist/calendar/yearMonthPillars.js';

// A SMALL set of archival factual witnesses, not a republished almanac/table.
// Research-only: no 2000 events or converters are wired into production.
const fixture = JSON.parse(readFileSync(new URL('./fixtures/kasi-2000-archive-research.json', import.meta.url), 'utf8'));
const { provenance } = fixture;
const events = fixture.selectedSolarWitnesses.map(({ code, kstMinute }) => ({
  term: code, displayedDateTime: kstMinute, timeBasis: 'KST',
  sourcePrecision: 'MINUTE', sourceIds: [provenance.sourceId],
}));
const spring = events.slice(0, 4); // consecutive Jie: Xiaohan, Lichun, Jingzhe
const winter = events.slice(4);   // consecutive Jie: Lidong, Daxue
const labels = candidate => ({
  year: candidate.year.stem + candidate.year.branch,
  month: candidate.month.stem + candidate.month.branch,
});
function shift(value, minutes) {
  return new Date(Date.parse(value + ':00Z') + minutes * 60_000).toISOString().slice(0, 16);
}
function plusDays(date, days) {
  return new Date(Date.parse(date + 'T00:00:00Z') + days * 86400000).toISOString().slice(0, 10);
}

test('KASI 2000 selected factual witnesses retain source, KST precision, and research-only status', () => {
  assert.equal(fixture.schemaVersion, 'm1-research-kasi-2000-witnesses-v1');
  assert.equal(fixture.status, 'RESEARCH_ONLY_NOT_RUNTIME');
  assert.equal(provenance.noticeId, 'KAO-PR 9902-1');
  assert.equal(provenance.rightsStatus, 'COMMERCIAL_REUSE_NOT_CLEARED');
  assert.deepEqual(events.map(e => e.term), ['XIAOHAN','LICHUN','YUSHUI','JINGZHE','LIDONG','DAXUE']);
  assert.ok(events.every(e => e.timeBasis === 'KST' && e.sourcePrecision === 'MINUTE'));
  assert.doesNotThrow(() => validateKstMinuteSolarTermTimeline(events));
  assert.equal(events[1].displayedDateTime, '2000-02-04T21:40');
  assert.equal(events[5].displayedDateTime, '2000-12-07T04:36');
});

test('2000 Lichun uses two correlated year/month candidates, never an invented exact second', () => {
  const before = resolveYearMonthPillars(spring, '2000-02-04T21:39');
  const at = resolveYearMonthPillars(spring, '2000-02-04T21:40');
  const after = resolveYearMonthPillars(spring, '2000-02-04T21:41');
  assert.deepEqual(labels(before.candidates[0]), { year: '己卯', month: '丁丑' });
  assert.deepEqual(labels(after.candidates[0]), { year: '庚辰', month: '戊寅' });
  assert.equal(at.confidence, 'PUBLISHED_MINUTE_AMBIGUOUS');
  assert.deepEqual(at.candidates, [before.candidates[0], after.candidates[0]]);
});

test('2000 Jingzhe changes only month pillar; Yushui does not change either pillar', () => {
  const jieBefore = resolveYearMonthPillars(spring, '2000-03-05T15:41');
  const jieAt = resolveYearMonthPillars(spring, '2000-03-05T15:42');
  const jieAfter = resolveYearMonthPillars(spring, '2000-03-05T15:43');
  assert.deepEqual(labels(jieBefore.candidates[0]), { year:'庚辰', month:'戊寅' });
  assert.deepEqual(labels(jieAfter.candidates[0]), { year:'庚辰', month:'己卯' });
  assert.deepEqual(jieAt.candidates, [jieBefore.candidates[0], jieAfter.candidates[0]]);
  assert.equal(jieAt.confidence, 'PUBLISHED_MINUTE_AMBIGUOUS');
  const zhongqi = '2000-02-19T17:33';
  assert.deepEqual(resolveYearMonthPillars(spring, shift(zhongqi, -1)), resolveYearMonthPillars(spring, zhongqi));
  assert.deepEqual(resolveYearMonthPillars(spring, zhongqi), resolveYearMonthPillars(spring, shift(zhongqi, 1)));
});

test('2000 Daxue winter boundary changes Hai to Zi month with unknown second', () => {
  const before = resolveMonthBranchAtJie(winter, '2000-12-07T04:35');
  const at = resolveMonthBranchAtJie(winter, '2000-12-07T04:36');
  const after = resolveMonthBranchAtJie(winter, '2000-12-07T04:37');
  assert.equal(before.selected, '亥');
  assert.equal(after.selected, '子');
  assert.equal(at.confidence, 'PUBLISHED_MINUTE_AMBIGUOUS');
  assert.equal(at.branchBeforeBoundary, '亥');
  assert.equal(at.branchAfterBoundary, '子');
});

test('selected lunar facts cross-check 2000 New Year and independent 2001 terminal boundary', () => {
  const months = fixture.selectedLunarWitnesses;
  assert.equal(months.length, 3);
  assert.equal(plusDays(months[0].gregorianStart, months[0].days), months[1].gregorianStart);
  assert.equal(months[1].gregorianStart, '2000-02-05');
  assert.equal(plusDays(months[2].gregorianStart, months[2].days), fixture.nextLunarNewYearWitness.gregorianDate);
  assert.equal(fixture.nextLunarNewYearWitness.noticeId, 'KAO-PR 0002-2');
  // The middle 2000 months are NOT copied or claimed verified in this slice.
  assert.equal(months.some(m => m.lunarMonth === 6), false);
});

test('the partial archive witnesses cannot qualify as a full 2000 birth-year corpus', () => {
  const manifest = {
    schemaVersion:'m1-solar-term-coverage-v1',requirementProfile:'FULL_24_TERM_YEAR',
    timeBasis:'KST',sourcePrecision:'MINUTE',
    supportedFromInclusive:'2000-01-01T00:00',supportedUntilExclusive:'2001-01-01T00:00',
    requiredYears:[2000],requiredPriorBoundary:{year:1999,term:'DAXUE'},
  };
  assert.throws(() => validateFullYearSolarTermCoverage(events, manifest, '2000-06-15T12:00'),
    /missing required solar term: 1999:DAXUE/);
  assert.throws(() => resolveYearMonthPillars(spring, '2000-01-01T12:00'),
    /missing previous month-boundary Jie fixture/);
  assert.equal(events.some(e => e.displayedDateTime.startsWith('1999-')), false);
});
