import test from 'node:test';
import assert from 'node:assert/strict';
import { correlateSolarPeriods, E6_QUERY_CLOCKS, E6_TIMELINE_LIMITS, rangeCuts,
  validateE6Query, validateIssuedE6TimeContext } from '../scripts/engine/e6-context.mjs';

const MODERN = 'KR_API_PUBLISHED_KST_MODERN_1988_POST_DST_V1';
const EXTENDED = 'KR_API_PUBLISHED_KST_MODERN_1989_2027_NO_DST_V2';
const BEFORE = 'BEFORE_PUBLISHED_MINUTE', AFTER = 'AFTER_PUBLISHED_MINUTE';
const LICHUN = '2026-02-04T05:02', JINGZHE = '2026-03-05T22:59';
const condition = (term, minute, side) => ({ boundaryRef: term + ':' + minute, side });

test('E6 accepts explicit wall minutes with a known clock and does not invent missing dayun inputs', () => {
  const valid = { kind: 'AS_OF', asOf: LICHUN };
  assert.equal(validateE6Query(valid, MODERN), true);
  assert.equal(validateE6Query(valid, EXTENDED, { count: 3 }), true);
  assert.throws(() => validateE6Query(valid), /E6_EXPLICIT_QUERY_CLOCK_POLICY_REQUIRED/);
  assert.throws(() => validateE6Query({ kind: 'AS_OF' }, MODERN), /E6_EXPLICIT_AS_OF_MINUTE_REQUIRED/);
  assert.throws(() => validateE6Query({ ...valid, asOf: LICHUN + '+09:00' }, EXTENDED), /E6_EXPLICIT_AS_OF_MINUTE_REQUIRED/);
  assert.throws(() => validateE6Query({ ...valid, asOf: '2026-02-31T05:02' }, EXTENDED), /E6_EXPLICIT_AS_OF_MINUTE_REQUIRED/);
  assert.throws(() => validateE6Query({ ...valid, timeContextRef: 'external' }, EXTENDED), /E6_QUERY_FIELDS/);
  assert.throws(() => validateE6Query(valid, EXTENDED, { count: 999 }), /E6_EXPLICIT_DAYUN_COUNT/);
  assert.throws(() => validateE6Query({ kind: 'RANGE', from: LICHUN, to: LICHUN }, EXTENDED), /E6_HALF_OPEN_RANGE_ORDER/);
  assert.equal(E6_TIMELINE_LIMITS.maxRangeDays, 366);
});

test('shared Lichun minute pairs only 乙巳 with 己丑 and 丙午 with 庚寅 using fixed 2026 expectation', () => {
  const annual = [{
    condition: condition('LICHUN', LICHUN, BEFORE), period: { yearLabel: 2025, stem: '乙', branch: '巳' },
  }, {
    condition: condition('LICHUN', LICHUN, AFTER), period: { yearLabel: 2026, stem: '丙', branch: '午' },
  }];
  const january = { condition: condition('LICHUN', LICHUN, BEFORE), period: { yearLabel: 2025, stem: '己', branch: '丑' },
    calendarYearPillar: { stem: '乙', branch: '巳' } };
  const february = { condition: condition('LICHUN', LICHUN, AFTER), period: { yearLabel: 2026, stem: '庚', branch: '寅' },
    calendarYearPillar: { stem: '丙', branch: '午' } };
  const combined = correlateSolarPeriods(annual, [february, january]);
  assert.deepEqual(combined.map(row => row.map(({ period }) => period.stem + period.branch)),
    [['乙巳', '己丑'], ['丙午', '庚寅']]);
  assert.throws(() => correlateSolarPeriods([annual[0]], [february]), /E6_INCOHERENT_SOLAR_CHOICE_CONTEXT/);
});

test('a non-Lichun month boundary preserves the active year under both alternatives', () => {
  const annual = { condition: null, period: { yearLabel: 2026, stem: '丙', branch: '午' } };
  const year = { stem: '丙', branch: '午' };
  const months = [
    { condition: condition('JINGZHE', JINGZHE, BEFORE), calendarYearPillar: year, period: { yearLabel: 2026, stem: '庚', branch: '寅' } },
    { condition: condition('JINGZHE', JINGZHE, AFTER), calendarYearPillar: year, period: { yearLabel: 2026, stem: '辛', branch: '卯' } },
  ];
  assert.deepEqual(correlateSolarPeriods([annual], months), [[annual, months[0]], [annual, months[1]]]);
  assert.deepEqual(correlateSolarPeriods([{ status: 'NEEDS_DATA' }], months).map(c => c[1]), months);
});

test('a bounded range uses actual midmonth starts, separates the published-minute cell and merges coincident cuts', () => {
  const query = { kind: 'RANGE', from: '2026-02-04T05:01', to: '2026-03-06T00:00' };
  const calendar = { clock: E6_QUERY_CLOCKS[EXTENDED],
    jie: [{ displayedDateTime: LICHUN }, { displayedDateTime: JINGZHE }] };
  const dayun = { projections: [
    { calendar: { periods: [{ startInclusive: '2026-02-17T19:00', endExclusive: '2036-02-17T19:00' }] } },
    { calendar: { periods: [{ startInclusive: LICHUN, endExclusive: '2036-02-04T05:02' }] } },
  ] };
  assert.deepEqual(rangeCuts(query, calendar, dayun, '1992-11-24T00:30'), [
    '2026-02-04T05:01', LICHUN, '2026-02-04T05:03', '2026-02-17T19:00',
    JINGZHE, '2026-03-05T23:00', '2026-03-06T00:00',
  ]);
  assert.deepEqual(rangeCuts({ ...query, from: '2026-12-31T00:00', to: '2028-02-01T00:00' },
    { clock: E6_QUERY_CLOCKS[EXTENDED], jie: [] }, dayun, '1992-11-24T00:30'), [
    '2026-12-31T00:00', '2027-01-01T00:00', '2028-01-01T00:00', '2028-02-01T00:00',
  ]);
});

test('structurally similar external contexts cannot acquire in-process issuance', () => {
  const fake = Object.freeze({ natalCandidateRef: 'chart.candidates[0]', asOf: LICHUN, timeContextRef: 'supplied' });
  assert.throws(() => validateIssuedE6TimeContext(fake, { existing: {}, natalCandidateRef: fake.natalCandidateRef }),
    /E6_ISSUED_CONTEXT_MISMATCH/);
});
