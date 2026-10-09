import assert from "node:assert/strict";
import test from "node:test";

import {
  resolveKoreanDst1987To1988,
  resolveKoreanStandardTime,
} from "../dist/index.js";

test("Korean base standard-time boundaries are exact and DST-independent", () => {
  const cases = [
    ["1908-03-31", null],
    ["1908-04-01", 510],
    ["1911-12-31", 510],
    ["1912-01-01", 540],
    ["1954-03-20", 540],
    ["1954-03-21", 510],
    ["1961-08-09", 510],
    ["1961-08-10", 540],
  ];
  for (const [date, expected] of cases) {
    assert.equal(resolveKoreanStandardTime(date)?.utcOffsetMinutes ?? null, expected, date);
  }
});

test("standard-time resolver rejects malformed and impossible Gregorian dates", () => {
  assert.throws(() => resolveKoreanStandardTime("1954-02-30"), RangeError);
  assert.throws(() => resolveKoreanStandardTime("1954/03/21"), TypeError);
});

test("1987 DST transition has explicit gap and overlap instead of silently guessing", () => {
  assert.equal(resolveKoreanDst1987To1988("1987-05-10T01:59:59").status, "STANDARD");
  assert.throws(() => resolveKoreanDst1987To1988("1987-05-10T02:30:00"), /Nonexistent/);
  assert.equal(resolveKoreanDst1987To1988("1987-05-10T03:00:00").status, "DAYLIGHT");

  assert.equal(resolveKoreanDst1987To1988("1987-10-11T01:59:59").status, "DAYLIGHT");
  assert.throws(() => resolveKoreanDst1987To1988("1987-10-11T02:30:00"), /Ambiguous/);
  assert.equal(resolveKoreanDst1987To1988("1987-10-11T03:00:00").status, "STANDARD");
});

test("1988 DST transition boundaries expose the full spring gap and autumn overlap", () => {
  assert.equal(resolveKoreanDst1987To1988("1988-05-08T01:59:59").status, "STANDARD");
  assert.throws(() => resolveKoreanDst1987To1988("1988-05-08T02:00:00"), /Nonexistent/);
  assert.throws(() => resolveKoreanDst1987To1988("1988-05-08T02:59:59"), /Nonexistent/);
  assert.equal(resolveKoreanDst1987To1988("1988-05-08T03:00:00").status, "DAYLIGHT");

  assert.equal(resolveKoreanDst1987To1988("1988-10-09T01:59:59").status, "DAYLIGHT");
  assert.throws(() => resolveKoreanDst1987To1988("1988-10-09T02:00:00"), /Ambiguous/);
  assert.throws(() => resolveKoreanDst1987To1988("1988-10-09T02:59:59"), /Ambiguous/);
  assert.equal(resolveKoreanDst1987To1988("1988-10-09T03:00:00").status, "STANDARD");
});

test("DST resolver quarantines years outside the explicitly encoded legal period", () => {
  assert.deepEqual(resolveKoreanDst1987To1988("1958-07-01T12:00:00"), { status: "UNSUPPORTED_YEAR" });
  assert.deepEqual(resolveKoreanDst1987To1988("1989-01-01T00:00:00"), { status: "UNSUPPORTED_YEAR" });
});
