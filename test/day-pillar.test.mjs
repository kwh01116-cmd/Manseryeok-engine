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
test("date-only resolver rejects malformed and impossible Gregorian dates", () => {
  assert.throws(() => dayPillarForGregorianDate("2000-02-30"), RangeError);
  assert.throws(() => dayPillarForGregorianDate("2000/01/07"), TypeError);
  assert.throws(() => dayPillarForGregorianDate("1500-01-07"), RangeError);
});
