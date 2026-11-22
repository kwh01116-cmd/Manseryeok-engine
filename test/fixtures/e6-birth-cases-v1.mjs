/** Selected before running E6. All births are fictional dates/clock minutes. */
import { readFileSync } from 'node:fs';
import { E2_OFFLINE_CASES } from './e2-offline-cases-v1.mjs';

const base = JSON.parse(readFileSync(new URL('../../docs/contracts/examples/engine-e6-request-v1.json', import.meta.url)));
const natal = (date, time) => ({ ...base.birth, date, time });
const fixture = id => {
  const { luckOptions: _luck, monthlyOptions: _month, ...birth } = E2_OFFLINE_CASES.find(item => item.id === id).birth;
  return birth;
};
const at = asOf => ({ kind: 'AS_OF', asOf });
const span = (from, to) => ({ kind: 'RANGE', from, to });
const dayun = { traditionalSex: 'MALE', count: 10 };
const mk = (id, query, expected, birth = base.birth, includeDayun = false) => ({
  id, expected, request: { ...base, birth, query, ...(includeDayun ? { dayun } : { dayun: undefined }) },
});

export const E6_BIRTH_CASES = [
  mk('MONTH_DIFF', base.query, { parents: 1, leftMonthly: '庚寅', rightMonthly: '辛卯',
    ended: ['LIUHE', 'month', 'MONTHLY'], added: ['LIUHAI', 'day', 'MONTHLY'],
    maintained: ['LIUCHONG', 'hour', 'SEYUN'] }, base.birth, true),
  mk('SAME_TIME_MIDNIGHT_BIRTH', at('2026-03-12T12:00'), { parents: 1,
    hit: ['LIUCHONG', 'hour', 'SEYUN'], daeun: 'NEEDS_INPUT' }),
  mk('SAME_TIME_NOON_BIRTH', at('2026-03-12T12:00'), { parents: 1,
    hit: ['XING', 'hour', 'SEYUN'], daeun: 'NEEDS_INPUT' }, natal('1992-11-24', '12:00')),
  mk('SAME_DAY_MASTER_OTHER_BIRTH', at('2026-03-12T12:00'), { parents: 1 }, natal('1998-05-07', '04:15')),
  mk('LICHUN_BEFORE', at('2026-02-04T05:01'), { parents: 1, clockPairs: [['乙巳', '己丑']] }),
  mk('LICHUN_EXACT', at('2026-02-04T05:02'), { parents: 1, clockPairs: [['乙巳', '己丑'], ['丙午', '庚寅']] }),
  mk('COHERENT_REPEAT', { kind: 'COMPARE', from: '2026-02-04T05:02', to: '2026-02-04T05:02' },
    { parents: 1, sameMinuteAlternatives: 2 }),
  mk('LICHUN_AFTER', at('2026-02-04T05:03'), { parents: 1, clockPairs: [['丙午', '庚寅']] }),
  mk('MONTH_JIE_BEFORE', at('2026-03-05T22:58'), { parents: 1, clockPairs: [['丙午', '庚寅']] }),
  mk('MONTH_JIE_EXACT', at('2026-03-05T22:59'), { parents: 1, clockPairs: [['丙午', '庚寅'], ['丙午', '辛卯']] }),
  mk('MONTH_JIE_AFTER', at('2026-03-05T23:00'), { parents: 1, clockPairs: [['丙午', '辛卯']] }),
  // Nominal start from E2 M7_FORWARD fixed fixture. Windows here denote time, not evidence of actual seconds.
  mk('DAEUN_BEFORE', at('1992-01-10T07:59'), { parents: 1, daeun: 'BEFORE_FIRST_DA_YUN' }, natal('1990-06-01', '12:00'), true),
  mk('DAEUN_EXACT', at('1992-01-10T08:00'), { parents: 1, activeDaeun: '壬午' }, natal('1990-06-01', '12:00'), true),
  mk('DAEUN_AFTER', at('1992-01-10T08:01'), { parents: 1, activeDaeun: '壬午' }, natal('1990-06-01', '12:00'), true),
  mk('DAEUN_IN_RANGE', span('1992-01-09T00:00', '1992-01-12T00:00'), { parents: 1, boundary: '1992-01-10T08:00' }, natal('1990-06-01', '12:00'), true),
  mk('PRE_BIRTH', at('1989-12-31T12:00'), { parents: 1, daeun: 'BEFORE_BIRTH' }, natal('1990-06-01', '12:00'), true),
  mk('TWO_NATAL_PARENTS', at('2026-02-04T05:03'), { parents: 2 }, fixture('LICHUN_CORRELATED_NATAL_PARENTS')),
  mk('ONE_NATAL_TWO_SEASONS', at('2026-05-10T12:00'), { parents: 1, seasonalAlternatives: 2 }, fixture('DERIVED_EARTH_SEASON_BOUNDARY')),
  mk('DST_GAP', at('2026-03-12T12:00'), { parents: 0 }, fixture('DST_NONEXISTENT_CIVIL_TIME')),
  mk('DST_FOLD', at('2026-03-12T12:00'), { parents: 0 }, fixture('DST_AMBIGUOUS_CIVIL_TIME')),
  mk('UNKNOWN_TIME', at('2026-03-12T12:00'), { parents: 0 }, fixture('UNKNOWN_TIME_REQUIRES_INFORMATION')),
  mk('LEAP_SOLAR', at('2026-03-12T12:00'), { parents: 1 }, fixture('LEAP_GREGORIAN')),
  mk('LEAP_LUNAR', at('2026-03-12T12:00'), { parents: 1 }, fixture('LEAP_LUNAR')),
  mk('PARTIAL_FUTURE_RANGE', span('2027-11-22T12:00', '2028-01-08T12:00'), { parents: 1, missingMonthly: true }),
  mk('MAX_RANGE', span('2026-02-01T12:00', '2027-02-02T12:00'), { parents: 1 }, base.birth, true),
  mk('MAX_RANGE_COMPLETE', span('2024-01-01T00:00', '2025-01-01T00:00'), { parents: 1, status: 'AVAILABLE' }, base.birth, true),
  mk('OVERSIZE_RANGE', span('2026-02-01T12:00', '2027-02-03T12:00'), { parents: 0, status: 'LIMIT_EXCEEDED' }),
];

// Remove optional fields instead of relying on JSON.stringify to erase undefined.
for (const { request } of E6_BIRTH_CASES) if (request.dayun === undefined) delete request.dayun;
