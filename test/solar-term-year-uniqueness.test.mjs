import test from "node:test";
import assert from "node:assert/strict";
import { validateKstMinuteSolarTermTimeline } from "../dist/calendar/solarTermTimeline.js";

const event = (term, displayedDateTime) => ({
  term, displayedDateTime, timeBasis: "KST", sourcePrecision: "MINUTE", sourceIds: ["synthetic-test"],
});

test("rejects two different-minute Lichun records in one civil year", () => {
  const corrupted = [
    event("LICHUN", "2027-02-04T10:46"),
    event("LICHUN", "2027-02-04T10:47"),
  ];
  assert.throws(() => validateKstMinuteSolarTermTimeline(corrupted), /duplicate solar term within civil year/);
});

test("permits same solar term across different years and prior-year guards", () => {
  assert.doesNotThrow(() => validateKstMinuteSolarTermTimeline([
    event("DAXUE", "2025-12-07T06:05"),
    event("LICHUN", "2026-02-04T05:02"),
    event("DAXUE", "2026-12-07T11:53"),
    event("LICHUN", "2027-02-04T10:46"),
  ]));
});
