import test from "node:test";
import assert from "node:assert/strict";
import { KOREA_SOLAR_TERM_EVENTS_2026_2027 } from "../dist/calendar/koreaSolarTermFixtures.js";
import { resolveYearPillarAtLichun, sexagenaryYearForCivilYear } from "../dist/calendar/yearPillar.js";

test("anchors civil-year sexagenary cycle at 1984 Jia-Zi", () => {
  assert.deepEqual(sexagenaryYearForCivilYear(1984), { stem: "JIA", branch: "ZI" });
  assert.deepEqual(sexagenaryYearForCivilYear(2026), { stem: "BING", branch: "WU" });
  assert.deepEqual(sexagenaryYearForCivilYear(2027), { stem: "DING", branch: "WEI" });
});

test("changes year pillar across the 2027 Lichun published minute without guessing equality", () => {
  const before = resolveYearPillarAtLichun(KOREA_SOLAR_TERM_EVENTS_2026_2027, "2027-02-04T10:45");
  assert.deepEqual(before.selected, { stem: "BING", branch: "WU" });
  assert.equal(before.confidence, "DEFINITE");

  const boundary = resolveYearPillarAtLichun(KOREA_SOLAR_TERM_EVENTS_2026_2027, "2027-02-04T10:46");
  assert.equal(boundary.selected, undefined);
  assert.equal(boundary.confidence, "PUBLISHED_MINUTE_AMBIGUOUS");
  assert.deepEqual(boundary.pillarBeforeBoundary, { stem: "BING", branch: "WU" });
  assert.deepEqual(boundary.pillarAfterBoundary, { stem: "DING", branch: "WEI" });

  const after = resolveYearPillarAtLichun(KOREA_SOLAR_TERM_EVENTS_2026_2027, "2027-02-04T10:47");
  assert.deepEqual(after.selected, { stem: "DING", branch: "WEI" });
});

test("does not use Lunar New Year as the year-pillar boundary", () => {
  const feb6 = resolveYearPillarAtLichun(KOREA_SOLAR_TERM_EVENTS_2026_2027, "2027-02-06T12:00");
  assert.deepEqual(feb6.selected, { stem: "DING", branch: "WEI" });
});
