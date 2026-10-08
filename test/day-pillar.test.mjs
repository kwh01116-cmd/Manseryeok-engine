import assert from "node:assert/strict";
import test from "node:test";
import { DAY_PILLAR_ANCHOR, dayPillarForGregorianDate } from "../dist/calendar/dayPillar.js";

test("date-only day pillar anchor is 2000-01-07 Jia-Zi", () => {
  assert.deepEqual(DAY_PILLAR_ANCHOR, { date: "2000-01-07", pillar: { stem: "甲", branch: "子" } });
  assert.deepEqual(dayPillarForGregorianDate("2000-01-07"), { stem: "甲", branch: "子" });
});
test("day cycle advances and wraps every sixty civil dates", () => {
  assert.deepEqual(dayPillarForGregorianDate("2000-01-06"), { stem: "癸", branch: "亥" });
  assert.deepEqual(dayPillarForGregorianDate("2000-01-08"), { stem: "乙", branch: "丑" });
  assert.deepEqual(dayPillarForGregorianDate("2000-03-07"), { stem: "甲", branch: "子" });
});
test("distant independent check matches 2025-12-07 Geng-Xu", () => {
  assert.deepEqual(dayPillarForGregorianDate("2025-12-07"), { stem: "庚", branch: "戌" });
});
test("KASI 2025 leap-sixth-month starts independently cross-check day-cycle arithmetic", () => {
  // KASI 2025 calendar-data table, 日辰 column (not inferred from this engine).
  // https://astro.kasi.re.kr/kor/life/post/calendarData?search_year=2025
  for (const [date, pillar] of [
    ["2025-06-25", { stem: "乙", branch: "丑" }], // regular sixth month day 1
    ["2025-07-25", { stem: "乙", branch: "未" }], // leap sixth month day 1
    ["2025-08-23", { stem: "甲", branch: "子" }], // seventh month day 1
  ]) {
    assert.deepEqual(dayPillarForGregorianDate(date), pillar, date);
  }
});

test("date-only resolver rejects malformed and impossible Gregorian dates", () => {
  assert.throws(() => dayPillarForGregorianDate("2000-02-30"), RangeError);
  assert.throws(() => dayPillarForGregorianDate("2000/01/07"), TypeError);
  assert.throws(() => dayPillarForGregorianDate("1500-01-07"), RangeError);
});
