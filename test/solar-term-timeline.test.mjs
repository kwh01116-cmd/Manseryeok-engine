import test from "node:test";
import assert from "node:assert/strict";
import { adjacentSolarTerms, validateKstMinuteSolarTermTimeline } from "../dist/calendar/solarTermTimeline.js";

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
