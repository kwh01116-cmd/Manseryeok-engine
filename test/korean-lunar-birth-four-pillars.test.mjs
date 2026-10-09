import test from "node:test";
import assert from "node:assert/strict";
import {
  resolveKoreanLunarBirthFourPillars,
  resolveCoverageCheckedModernKoreanCivilFourPillars,
  createKoreanLunisolarConverter,
  KASI_KOREAN_LUNISOLAR_2025_2027,
} from "../dist/index.js";
import { KOREA_SOLAR_TERM_EVENTS_2026_2027 } from "../dist/calendar/koreaSolarTermFixtures.js";

const converter = createKoreanLunisolarConverter(KASI_KOREAN_LUNISOLAR_2025_2027);
const events = KOREA_SOLAR_TERM_EVENTS_2026_2027;
const policy = Object.freeze({
  timeBasis: "KOREAN_CIVIL_TIME", dayRollover: "CIVIL_MIDNIGHT",
  hourStemReference: "SELECTED_DAY_PILLAR",
});
const manifest = Object.freeze({
  schemaVersion: "m1-solar-term-coverage-v1", requirementProfile: "FULL_24_TERM_YEAR",
  timeBasis: "KST", sourcePrecision: "MINUTE",
  supportedFromInclusive: "2026-01-01T00:00",
  supportedUntilExclusive: "2028-01-01T00:00",
  requiredYears: [2026, 2027],
  requiredPriorBoundary: { year: 2025, term: "DAXUE" },
});
const lunar = (lunarYear, lunarMonth, lunarDay, isLeapMonth) =>
  ({ lunarYear, lunarMonth, lunarDay, isLeapMonth });
const resolve = (date, clock, p = policy, e = events, m = manifest) =>
  resolveKoreanLunarBirthFourPillars(date, clock, p, converter, e, m);

test("lunar 2026 New Year converts to KST minute and matches Gregorian Four Pillars", () => {
  const result = resolve(lunar(2026, 1, 1, false), "12:00");
  assert.equal(result.status, "OK");
  assert.equal(result.recordedBirthKstMinute, "2026-02-17T12:00");
  assert.equal(result.conversionSource.sourceId, "KR-KASI-CALENDAR-DATA");
  assert.equal(result.chart.coverage.validation, "STRUCTURAL_COVERAGE_ONLY");
  const direct = resolveCoverageCheckedModernKoreanCivilFourPillars(events, "2026-02-17T12:00", policy, manifest);
  assert.deepEqual(result.chart.candidates, direct.candidates);
});

test("lunar 2026 year can produce 2027 Lichun year pillar", () => {
  const result = resolve(lunar(2026, 12, 29, false), "12:00");
  assert.equal(result.status, "OK");
  assert.equal(result.recordedBirthKstMinute, "2027-02-05T12:00");
  assert.deepEqual(result.chart.candidates[0].year, { stem: "丁", branch: "未" });
  assert.deepEqual(result.chart.candidates[0].month, { stem: "壬", branch: "寅" });
  assert.equal(result.inputLunarDate.lunarYear, 2026);
});

test("published Lichun minute still returns two correlated candidates", () => {
  const result = resolve(lunar(2026, 12, 28, false), "10:46");
  assert.equal(result.status, "OK");
  assert.equal(result.recordedBirthKstMinute, "2027-02-04T10:46");
  assert.equal(result.chart.confidence, "PUBLISHED_MINUTE_AMBIGUOUS");
  assert.equal(result.chart.candidates.length, 2);
});

test("invalid leap month returns typed failure and does not fabricate a chart", () => {
  assert.deepEqual(resolve(lunar(2026, 6, 1, true), "12:00"), { status: "INVALID_LUNAR_DATE" });
  assert.deepEqual(resolve(lunar(2024, 12, 1, false), "12:00"), { status: "OUT_OF_COVERAGE" });
  assert.throws(() => resolve({ lunarYear: 2025, lunarMonth: 6, lunarDay: 1 }, "12:00"), RangeError);
});

test("valid 2025 leap month cannot escape narrower 2026/2027 solar-term coverage", () => {
  assert.throws(() => resolve(lunar(2025, 6, 1, true), "12:00"), /outside declared coverage/);
});

test("invalid birth clock, absent manifest and corrupted solar-term corpus fail closed", () => {
  for (const clock of ["24:00", "12:60", "12:00:00", "9:00", "", undefined]) {
    assert.throws(() => resolve(lunar(2026, 1, 1, false), clock), TypeError);
  }
  assert.throws(() => resolveKoreanLunarBirthFourPillars(
    lunar(2026, 1, 1, false), "12:00", policy, converter, events, undefined,
  ), RangeError);
  assert.throws(() => resolve(lunar(2026, 1, 1, false), "12:00", policy,
    events.filter(e => e.displayedDateTime !== "2027-12-07T17:38")),
    /missing required solar term: 2027:DAXUE/);
});
