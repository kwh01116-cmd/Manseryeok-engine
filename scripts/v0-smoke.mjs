/** Read-only, fixed-fixture V0 smoke: not an official KASA chart certification. */
import { resolveKoreanBirthChartPreview, createKoreanLunisolarConverter,
  KASI_KOREAN_LUNISOLAR_2025_2027 } from '../dist/index.js';
import { KOREA_SOLAR_TERM_EVENTS_2026_2027 } from '../dist/calendar/koreaSolarTermFixtures.js';

const manifest = {
  schemaVersion: 'm1-solar-term-coverage-v1', requirementProfile: 'FULL_24_TERM_YEAR',
  timeBasis: 'KST', sourcePrecision: 'MINUTE',
  supportedFromInclusive: '2026-01-01T00:00', supportedUntilExclusive: '2028-01-01T00:00',
  requiredYears: [2026, 2027], requiredPriorBoundary: { year: 2025, term: 'DAXUE' },
};
const policies = {
  timeBasis: 'KOREAN_CIVIL_TIME', dayRollover: 'CIVIL_MIDNIGHT',
  hourStemReference: 'SELECTED_DAY_PILLAR',
};
const converter = createKoreanLunisolarConverter(KASI_KOREAN_LUNISOLAR_2025_2027);
const resolve = (input, clock) => resolveKoreanBirthChartPreview(
  input, clock, policies, converter, KOREA_SOLAR_TERM_EVENTS_2026_2027, manifest,
);

const cases = {
  gregorian: resolve({ calendar: 'GREGORIAN', gregorianDate: '2027-02-05' }, '12:00'),
  equivalentLunar: resolve({ calendar: 'KOREAN_LUNAR', lunarDate: {
    lunarYear: 2026, lunarMonth: 12, lunarDay: 29, isLeapMonth: false,
  } }, '12:00'),
  lichunPublishedMinute: resolve({ calendar: 'GREGORIAN', gregorianDate: '2027-02-04' }, '10:46'),
};
console.log(JSON.stringify(cases, null, 2));
