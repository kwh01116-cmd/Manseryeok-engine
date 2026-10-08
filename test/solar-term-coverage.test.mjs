import test from "node:test";
import assert from "node:assert/strict";
import { validateFullYearSolarTermCoverage } from "../dist/calendar/solarTermCoverage.js";
import { KOREA_SOLAR_TERM_EVENTS_2026_2027 as full } from "../dist/calendar/koreaSolarTermFixtures.js";
import { validateKstMinuteSolarTermTimeline as checkTermTimeline } from "../dist/calendar/solarTermTimeline.js";

const manifest = Object.freeze({
  schemaVersion: "m1-solar-term-coverage-v1",
  requirementProfile: "FULL_24_TERM_YEAR",
  timeBasis: "KST",
  sourcePrecision: "MINUTE",
  supportedFromInclusive: "2026-01-01T00:00",
  supportedUntilExclusive: "2028-01-01T00:00",
  requiredYears: [2026, 2027],
  requiredPriorBoundary: { year: 2025, term: "DAXUE" },
});

const check = (events, minute = "2027-12-31T12:00", scope = manifest) =>
  validateFullYearSolarTermCoverage(events, scope, minute);

test("complete 2026/2027 49-event corpus passes finite-set coverage", () => {
  assert.equal(full.length, 49);
  assert.doesNotThrow(() => check(full));
  assert.doesNotThrow(() => check(full, "2026-01-01T00:00"));
});

test("terminal DAXUE omission fails closed instead of retaining Hai month", () => {
  const missing = full.filter((e) => e.displayedDateTime !== "2027-12-07T17:38");
  assert.throws(() => check(missing), /missing required solar term: 2027:DAXUE/);
});

test("interior Jie and Zhongqi omissions both fail a FULL_24_TERM_YEAR promise", () => {
  for (const [minute, code] of [["2027-03-06T04:40", "JINGZHE"], ["2027-12-22T11:42", "DONGZHI"]]) {
    assert.throws(() => check(full.filter((e) => e.displayedDateTime !== minute)),
      new RegExp(`missing required solar term: 2027:${code}`));
  }
});

test("missing left DAXUE guard is rejected", () => {
  assert.throws(() => check(full.slice(1), "2026-01-01T12:00"), /missing required solar term: 2025:DAXUE/);
});

test("query bounds are half-open and do not extrapolate to 2028", () => {
  assert.throws(() => check(full, "2025-12-31T23:59"), RangeError);
  assert.throws(() => check(full, "2028-01-01T00:00"), RangeError);
});

test("invalid manifest, mismatched year coverage, and undocumented events fail", () => {
  assert.throws(() => check(full, undefined, { ...manifest, requirementProfile: "AUTO" }), RangeError);
  assert.throws(() => check(full, undefined, { ...manifest, requiredYears: [2027, 2026] }), RangeError);
  assert.throws(() => check(full, undefined, { ...manifest, requiredPriorBoundary: { year: 2024, term: "DAXUE" } }), RangeError);
  assert.throws(() => check(full, undefined, { ...manifest, supportedUntilExclusive: "2027-01-01T00:00" }), RangeError);
  assert.throws(() => check([...full, { ...full.at(-1), displayedDateTime: "2028-01-05T12:00" }]), /undeclared solar-term coverage event/);
});

test("source provenance cannot be silently empty", () => {
  const broken = full.map((event) => event.term === "DAXUE" && event.displayedDateTime.startsWith("2027-")
    ? { ...event, sourceIds: [] } : event);
  assert.throws(() => check(broken), /missing solar-term source provenance/);
});


test("24-term sequence rejects label transpositions without missing entries", () => {
  for (const [firstTime, secondTime] of [
    ["2027-01-05T23:10", "2027-01-20T16:30"], // Xiaohan / Dahan
    ["2027-02-04T10:46", "2027-02-19T06:33"], // Lichun / Yushui
    ["2027-12-07T17:38", "2027-12-22T11:42"], // Daxue / Dongzhi
  ]) {
    const first = full.find((event) => event.displayedDateTime === firstTime);
    const second = full.find((event) => event.displayedDateTime === secondTime);
    assert.ok(first && second);
    const swapped = full.map((event) =>
      event === first ? { ...event, term: second.term } :
      event === second ? { ...event, term: first.term } : event
    );
    // Complete, valid, chronological, and unique: the previous guards pass.
    assert.equal(swapped.length, full.length);
    assert.doesNotThrow(() => checkTermTimeline(swapped));
    assert.throws(() => check(swapped), /noncanonical solar-term order/);
  }
});
