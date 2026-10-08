import test from "node:test";
import assert from "node:assert/strict";
import { resolveModernKoreanCivilFourPillars } from "../dist/index.js";
import { KOREA_SOLAR_TERM_EVENTS_2026_2027 } from "../dist/calendar/koreaSolarTermFixtures.js";

const events = KOREA_SOLAR_TERM_EVENTS_2026_2027;
const policy = Object.freeze({
  timeBasis: "KOREAN_CIVIL_TIME",
  dayRollover: "CIVIL_MIDNIGHT",
  hourStemReference: "SELECTED_DAY_PILLAR",
});

test("2027 Lichun produces two correlated Four-Pillars candidates, not four", () => {
  const result = resolveModernKoreanCivilFourPillars(events, "2027-02-04T10:46", policy);
  assert.equal(result.confidence, "PUBLISHED_MINUTE_AMBIGUOUS");
  assert.equal(result.confidenceScope, "PUBLISHED_MINUTE_COMPARISON_ONLY");
  assert.deepEqual(result.candidates.map(({ year, month }) => ({ year, month })), [
    { year: { stem: "丙", branch: "午" }, month: { stem: "辛", branch: "丑" } },
    { year: { stem: "丁", branch: "未" }, month: { stem: "壬", branch: "寅" } },
  ]);
  assert.deepEqual(result.candidates[0].day, result.candidates[1].day);
  assert.deepEqual(result.candidates[0].hour, result.candidates[1].hour);
});

test("ordinary minute yields a single chart and reports comparison scope", () => {
  const result = resolveModernKoreanCivilFourPillars(events, "2027-02-05T12:00", policy);
  assert.equal(result.confidence, "DEFINITE");
  assert.equal(result.confidenceScope, "PUBLISHED_MINUTE_COMPARISON_ONLY");
  assert.equal(result.candidates.length, 1);
  assert.deepEqual(result.candidates[0].year, { stem: "丁", branch: "未" });
  assert.deepEqual(result.candidates[0].month, { stem: "壬", branch: "寅" });
});

test("late-Zi policy differences remain explicit in integrated chart", () => {
  const dateTime = "2027-02-05T23:30";
  const civil = resolveModernKoreanCivilFourPillars(events, dateTime, policy);
  const zi = resolveModernKoreanCivilFourPillars(events, dateTime, {
    ...policy, dayRollover: "ZI_START", hourStemReference: "CIVIL_DATE_DAY_PILLAR",
  });
  assert.equal(civil.effectiveDayDate, "2027-02-05");
  assert.equal(zi.effectiveDayDate, "2027-02-06");
  assert.deepEqual(civil.candidates[0].year, zi.candidates[0].year);
  assert.deepEqual(civil.candidates[0].month, zi.candidates[0].month);
  assert.notDeepEqual(civil.candidates[0].day, zi.candidates[0].day);
});

test("unsupported or omitted time/policy inputs fail closed", () => {
  for (const bad of [undefined, null, {}, { ...policy, timeBasis: "LOCAL_APPARENT_SOLAR_TIME" }]) {
    assert.throws(() => resolveModernKoreanCivilFourPillars(events, "2027-02-05T12:00", bad), RangeError);
  }
  for (const bad of ["2027-02-30T12:00", "2027-02-05T12:00:00", undefined]) {
    assert.throws(() => resolveModernKoreanCivilFourPillars(events, bad, policy), TypeError);
  }
  assert.throws(() => resolveModernKoreanCivilFourPillars(events, "1988-10-09T02:30", policy), RangeError);
  assert.throws(() => resolveModernKoreanCivilFourPillars(events, "2027-02-05T12:00", { ...policy, dayRollover: "AUTO" }), RangeError);
  assert.throws(() => resolveModernKoreanCivilFourPillars(events, "2027-02-05T12:00", { ...policy, hourStemReference: "AUTO" }), RangeError);
});
