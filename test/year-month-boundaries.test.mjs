import test from "node:test";
import assert from "node:assert/strict";

import { KOREA_SOLAR_TERM_EVENTS_2026_2027 } from "../dist/calendar/koreaSolarTermFixtures.js";
import { MONTH_BOUNDARY_JIE } from "../dist/calendar/monthPillar.js";
import { resolveYearMonthPillars } from "../dist/calendar/yearMonthPillars.js";

// Calendar-minute arithmetic only: interpreting the KST wall-clock string as UTC
// here is an offset-free way to increment its displayed minute, NOT a conversion.
function shiftDisplayedMinute(value, minutes) {
  const timestamp = Date.parse(value + ":00Z");
  assert.ok(Number.isFinite(timestamp), value);
  return new Date(timestamp + minutes * 60_000).toISOString().slice(0, 16);
}

const annualEvents = KOREA_SOLAR_TERM_EVENTS_2026_2027.filter(
  (event) => /^(2026|2027)-/.test(event.displayedDateTime),
);
const jie = new Set(MONTH_BOUNDARY_JIE);

test("every published 2026/2027 Jie minute preserves two correlated year/month states", () => {
  const boundaries = annualEvents.filter((event) => jie.has(event.term));
  assert.equal(boundaries.length, 24, "12 Jie boundaries in each of two fixture years");

  for (const boundary of boundaries) {
    const at = boundary.displayedDateTime;
    const before = resolveYearMonthPillars(KOREA_SOLAR_TERM_EVENTS_2026_2027, shiftDisplayedMinute(at, -1));
    const during = resolveYearMonthPillars(KOREA_SOLAR_TERM_EVENTS_2026_2027, at);
    const after = resolveYearMonthPillars(KOREA_SOLAR_TERM_EVENTS_2026_2027, shiftDisplayedMinute(at, 1));

    assert.equal(before.confidence, "DEFINITE", at + " -1 minute");
    assert.equal(after.confidence, "DEFINITE", at + " +1 minute");
    assert.equal(before.candidates.length, 1, at + " before candidate count");
    assert.equal(after.candidates.length, 1, at + " after candidate count");
    assert.equal(during.confidence, "PUBLISHED_MINUTE_AMBIGUOUS", at);
    assert.equal(during.candidates.length, 2, at + " must not form a Cartesian product");
    assert.deepEqual(during.candidates[0], before.candidates[0], at + " before correlation");
    assert.deepEqual(during.candidates[1], after.candidates[0], at + " after correlation");
    assert.notDeepEqual(during.candidates[0].month, during.candidates[1].month, at + " month changes");

    if (boundary.term === "LICHUN") {
      assert.notDeepEqual(during.candidates[0].year, during.candidates[1].year, at + " year changes");
    } else {
      assert.deepEqual(during.candidates[0].year, during.candidates[1].year, at + " year fixed");
    }
  }
});

test("all 2026/2027 Zhongqi published minutes remain definite for year/month pillars", () => {
  const zhongqi = annualEvents.filter((event) => !jie.has(event.term));
  assert.equal(zhongqi.length, 24, "12 Zhongqi in each of two fixture years");

  for (const event of zhongqi) {
    const at = event.displayedDateTime;
    const before = resolveYearMonthPillars(KOREA_SOLAR_TERM_EVENTS_2026_2027, shiftDisplayedMinute(at, -1));
    const during = resolveYearMonthPillars(KOREA_SOLAR_TERM_EVENTS_2026_2027, at);
    const after = resolveYearMonthPillars(KOREA_SOLAR_TERM_EVENTS_2026_2027, shiftDisplayedMinute(at, 1));

    for (const [label, state] of [["before", before], ["during", during], ["after", after]]) {
      assert.equal(state.confidence, "DEFINITE", at + " " + label);
      assert.equal(state.candidates.length, 1, at + " " + label);
    }
    assert.deepEqual(during.candidates, before.candidates, at + " no Zhongqi rollover");
    assert.deepEqual(during.candidates, after.candidates, at + " no Zhongqi rollover");
  }
});
