import test from "node:test";
import assert from "node:assert/strict";
import { KOREA_SOLAR_TERM_EVENTS_2026_2027 } from "../dist/calendar/koreaSolarTermFixtures.js";
import { resolveYearMonthPillars } from "../dist/calendar/yearMonthPillars.js";

test("Lichun ambiguity preserves temporal correlation instead of forming a Cartesian product", () => {
  const result = resolveYearMonthPillars(KOREA_SOLAR_TERM_EVENTS_2026_2027, "2027-02-04T10:46");
  assert.equal(result.confidence, "PUBLISHED_MINUTE_AMBIGUOUS");
  assert.deepEqual(result.candidates, [
    { year: { stem: "丙", branch: "午" }, month: { stem: "辛", branch: "丑" } },
    { year: { stem: "丁", branch: "未" }, month: { stem: "壬", branch: "寅" } },
  ]);
  assert.equal(result.candidates.length, 2);
});

test("non-Lichun Jie ambiguity keeps the year fixed while month candidates straddle the boundary", () => {
  const result = resolveYearMonthPillars(KOREA_SOLAR_TERM_EVENTS_2026_2027, "2027-03-06T04:40");
  assert.deepEqual(result.candidates, [
    { year: { stem: "丁", branch: "未" }, month: { stem: "壬", branch: "寅" } },
    { year: { stem: "丁", branch: "未" }, month: { stem: "癸", branch: "卯" } },
  ]);
});

test("ordinary minutes collapse to one deterministic year/month state", () => {
  const result = resolveYearMonthPillars(KOREA_SOLAR_TERM_EVENTS_2026_2027, "2027-02-04T10:47");
  assert.equal(result.confidence, "DEFINITE");
  assert.deepEqual(result.candidates, [
    { year: { stem: "丁", branch: "未" }, month: { stem: "壬", branch: "寅" } },
  ]);
});
