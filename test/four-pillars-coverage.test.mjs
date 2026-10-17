import test from "node:test";
import assert from "node:assert/strict";
import { resolveModernKoreanCivilFourPillars, resolveCoverageCheckedModernKoreanCivilFourPillars } from "../dist/index.js";
import { KOREA_SOLAR_TERM_EVENTS_2026_2027 as full } from "../dist/calendar/koreaSolarTermFixtures.js";

const policy = Object.freeze({
  timeBasis: "KOREAN_CIVIL_TIME",
  dayRollover: "CIVIL_MIDNIGHT",
  hourStemReference: "SELECTED_DAY_PILLAR",
});
const manifest = Object.freeze({
  schemaVersion: "m1-solar-term-coverage-v1",
  requirementProfile: "FULL_24_TERM_YEAR",
  timeBasis: "KST", sourcePrecision: "MINUTE",
  supportedFromInclusive: "2026-01-01T00:00",
  supportedUntilExclusive: "2028-01-01T00:00",
  requiredYears: [2026, 2027],
  requiredPriorBoundary: { year: 2025, term: "DAXUE" },
});
const checked = (events, minute, p = policy, m = manifest) =>
  resolveCoverageCheckedModernKoreanCivilFourPillars(events, minute, p, m);

test("valid full-year manifest preserves already-supported Four-Pillars composition", () => {
  const minute = "2027-02-05T12:00";
  const result = checked(full, minute);
  assert.deepEqual(result.candidates, resolveModernKoreanCivilFourPillars(full, minute, policy).candidates);
  assert.equal(result.confidence, "DEFINITE");
  assert.equal(result.confidenceScope, "PUBLISHED_MINUTE_COMPARISON_ONLY");
  assert.deepEqual(result.coverage, {
    validation: "STRUCTURAL_COVERAGE_ONLY",
    requirementProfile: "FULL_24_TERM_YEAR",
    supportedFromInclusive: "2026-01-01T00:00",
    supportedUntilExclusive: "2028-01-01T00:00",
  });
});
test("Lichun keeps two correlated candidates under published-minute convention", () => {
  const result = checked(full, "2027-02-04T10:46");
  assert.equal(result.confidence, "PUBLISHED_MINUTE_AMBIGUOUS");
  assert.deepEqual(result.candidates.map(c => c.year), [
    { stem: "丙", branch: "午" }, { stem: "丁", branch: "未" },
  ]);
  assert.equal(result.candidates.length, 2);
});
test("missing terminal 2027 Daxue cannot produce an incorrect December chart", () => {
  const missing = full.filter(e => e.displayedDateTime !== "2027-12-07T17:38");
  assert.throws(() => checked(missing, "2027-12-31T12:00"), /missing required solar term: 2027:DAXUE/);
});
test("swapped Xiaohan/Dahan labels fail full-year order check before composition", () => {
  const corrupted = full.map(e => e.displayedDateTime === "2027-01-05T23:10"
    ? { ...e, term: "DAHAN" } : e.displayedDateTime === "2027-01-20T16:30"
      ? { ...e, term: "XIAOHAN" } : e);
  assert.throws(() => checked(corrupted, "2027-01-10T12:00"), /noncanonical solar-term order/);
});
test("partial fixture and declared interval end both reject", () => {
  const partial = full.filter(e => e.displayedDateTime.startsWith("2027-"));
  assert.throws(() => checked(partial, "2027-02-05T12:00"), /missing required solar term/);
  assert.throws(() => checked(full, "2028-01-01T00:00"), /outside declared coverage/);
});
test("manifest and runtime policy are never implicit", () => {
  assert.throws(() =>
    resolveCoverageCheckedModernKoreanCivilFourPillars(full, "2027-02-05T12:00", policy, undefined), RangeError);
  assert.throws(() => checked(full, "2027-02-05T12:00", {...policy, dayRollover: "AUTO"}), RangeError);
  assert.throws(() => checked(full, "2027-02-05T12:00", {...policy, timeBasis: "LOCAL_APPARENT_SOLAR_TIME"}), RangeError);
});
