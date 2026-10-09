import test from "node:test";
import assert from "node:assert/strict";
import { KOREA_SOLAR_TERM_EVENTS_2026_2027 } from "../dist/calendar/koreaSolarTermFixtures.js";
import { resolveYearPillarAtLichun, sexagenaryYearForCivilYear } from "../dist/calendar/yearPillar.js";

test("anchors civil-year sexagenary cycle at 1984 Jia-Zi", () => {
  assert.deepEqual(sexagenaryYearForCivilYear(1984), { stem: "甲", branch: "子" });
  assert.deepEqual(sexagenaryYearForCivilYear(2026), { stem: "丙", branch: "午" });
  assert.deepEqual(sexagenaryYearForCivilYear(2027), { stem: "丁", branch: "未" });
});

test("changes year pillar across the 2027 Lichun published minute without guessing equality", () => {
  const before = resolveYearPillarAtLichun(KOREA_SOLAR_TERM_EVENTS_2026_2027, "2027-02-04T10:45");
  assert.deepEqual(before.selected, { stem: "丙", branch: "午" });
  assert.equal(before.confidence, "DEFINITE");
  const boundary = resolveYearPillarAtLichun(KOREA_SOLAR_TERM_EVENTS_2026_2027, "2027-02-04T10:46");
  assert.equal(boundary.selected, undefined);
  assert.equal(boundary.confidence, "PUBLISHED_MINUTE_AMBIGUOUS");
  assert.deepEqual(boundary.pillarBeforeBoundary, { stem: "丙", branch: "午" });
  assert.deepEqual(boundary.pillarAfterBoundary, { stem: "丁", branch: "未" });
  const after = resolveYearPillarAtLichun(KOREA_SOLAR_TERM_EVENTS_2026_2027, "2027-02-04T10:47");
  assert.deepEqual(after.selected, { stem: "丁", branch: "未" });
});

test("does not use Lunar New Year as the year-pillar boundary", () => {
  const feb6 = resolveYearPillarAtLichun(KOREA_SOLAR_TERM_EVENTS_2026_2027, "2027-02-06T12:00");
  assert.deepEqual(feb6.selected, { stem: "丁", branch: "未" });
});

test("rejects malformed query minutes before lexical boundary comparison", () => {
  for (const value of ["2027-02-30T10:45", "2027-13-04T10:45", "2027-02-04T24:00", "2027-02-04T10:60", "2027-2-04T10:45"]) {
    assert.throws(() => resolveYearPillarAtLichun(KOREA_SOLAR_TERM_EVENTS_2026_2027, value), /invalid Gregorian minute/);
  }
});
