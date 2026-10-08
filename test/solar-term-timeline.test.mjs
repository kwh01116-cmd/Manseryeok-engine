import test from "node:test";
import assert from "node:assert/strict";
import { adjacentSolarTerms, validateKstMinuteSolarTermTimeline } from "../dist/calendar/solarTermTimeline.js";
import { KOREA_SOLAR_TERM_EVENTS_2026_2027 } from "../dist/calendar/koreaSolarTermFixtures.js";

const event = (term, displayedDateTime, overrides = {}) => ({
  term,
  displayedDateTime,
  timeBasis: "KST",
  sourcePrecision: "MINUTE",
  sourceIds: ["fixture"],
  ...overrides,
});

test("validates KST minute solar-term timelines and rejects malformed civil dates", () => {
  const valid = [event("DONGZHI", "2026-12-22T05:50"), event("XIAOHAN", "2027-01-05T23:10")];
  assert.doesNotThrow(() => validateKstMinuteSolarTermTimeline(valid));
  assert.throws(() => validateKstMinuteSolarTermTimeline([event("LICHUN", "2027-02-30T10:46")]));
  assert.throws(() => validateKstMinuteSolarTermTimeline([event("LICHUN", "2027-02-04T10:46", { timeBasis: "UTC" })]));
  assert.throws(() => validateKstMinuteSolarTermTimeline([event("LICHUN", "2027-02-04T10:46", { sourcePrecision: "SECOND" })]));
});

test("rejects duplicate or out-of-order events", () => {
  assert.throws(() => validateKstMinuteSolarTermTimeline([
    event("XIAOHAN", "2027-01-05T23:10"),
    event("DONGZHI", "2026-12-22T05:50"),
  ]));
  assert.throws(() => validateKstMinuteSolarTermTimeline([
    event("XIAOHAN", "2027-01-05T23:10"),
    event("DAHAN", "2027-01-05T23:10"),
  ]));
});

test("finds adjacent terms across a civil-year boundary", () => {
  const winter = [event("DONGZHI", "2026-12-22T05:50"), event("XIAOHAN", "2027-01-05T23:10")];
  const result = adjacentSolarTerms(winter, "2027-01-01T00:00");
  assert.equal(result.previous?.term, "DONGZHI");
  assert.equal(result.next?.term, "XIAOHAN");
});

test("KASI-transcribed 2026/2027 fixture corpus includes prior-year guard", () => {
  const annual = KOREA_SOLAR_TERM_EVENTS_2026_2027.filter(
    ({ displayedDateTime }) => /^(2026|2027)-/.test(displayedDateTime),
  );
  const guards = KOREA_SOLAR_TERM_EVENTS_2026_2027.filter(
    ({ displayedDateTime }) => displayedDateTime.startsWith("2025-"),
  );
  assert.equal(annual.length, 48);
  assert.equal(guards.length, 1);
  assert.equal(KOREA_SOLAR_TERM_EVENTS_2026_2027.length, 49);
  assert.equal(guards[0]?.term, "DAXUE");
  assert.equal(guards[0]?.displayedDateTime, "2025-12-07T06:05");
  assert.deepEqual(guards[0]?.sourceIds, ["KR-KASI-CALENDAR-DATA"]);
  assert.doesNotThrow(() => validateKstMinuteSolarTermTimeline(KOREA_SOLAR_TERM_EVENTS_2026_2027));
  const lichun2026 = KOREA_SOLAR_TERM_EVENTS_2026_2027.find((x) => x.term === "LICHUN" && x.displayedDateTime.startsWith("2026-"));
  const lichun2027 = KOREA_SOLAR_TERM_EVENTS_2026_2027.find((x) => x.term === "LICHUN" && x.displayedDateTime.startsWith("2027-"));
  assert.equal(lichun2026?.displayedDateTime, "2026-02-04T05:02");
  assert.equal(lichun2027?.displayedDateTime, "2027-02-04T10:46");
  assert.deepEqual(lichun2027?.sourceIds, ["KR-KASA-WOLRYEOK-2027", "KR-KASI-CALENDAR-DATA"]);
  const crossYear = adjacentSolarTerms(KOREA_SOLAR_TERM_EVENTS_2026_2027, "2027-01-01T00:00");
  assert.equal(crossYear.previous?.displayedDateTime, "2026-12-22T05:50");
  assert.equal(crossYear.next?.displayedDateTime, "2027-01-05T23:10");
});
