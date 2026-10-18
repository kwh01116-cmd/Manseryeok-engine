import test from "node:test";
import assert from "node:assert/strict";
import { KOREA_SOLAR_TERM_EVENTS_2026_2027 } from "../dist/calendar/koreaSolarTermFixtures.js";
import { resolveYearMonthPillars } from "../dist/calendar/yearMonthPillars.js";

test("Lichun ambiguity preserves temporal correlation instead of forming a Cartesian product", () => {
  const result = resolveYearMonthPillars(KOREA_SOLAR_TERM_EVENTS_2026_2027, "2027-02-04T10:46");
  assert.equal(result.confidence, "PUBLISHED_MINUTE_AMBIGUOUS");
  assert.deepEqual(result.candidates, [
    { year: { stem: "丙", branch: "午" }, month: { stem: "辛", branch: "丑" } },
    { year: { stem: "丁", branch: "未" }, month: { stem: "壬", branch: "寅" } },
  ]);
  assert.equal(result.candidates.length, 2);
});

test("non-Lichun Jie ambiguity keeps the year fixed while month candidates straddle the boundary", () => {
  const result = resolveYearMonthPillars(KOREA_SOLAR_TERM_EVENTS_2026_2027, "2027-03-06T04:40");
  assert.deepEqual(result.candidates, [
    { year: { stem: "丁", branch: "未" }, month: { stem: "壬", branch: "寅" } },
    { year: { stem: "丁", branch: "未" }, month: { stem: "癸", branch: "卯" } },
  ]);
});

test("ordinary minutes collapse to one deterministic year/month state", () => {
  const result = resolveYearMonthPillars(KOREA_SOLAR_TERM_EVENTS_2026_2027, "2027-02-04T10:47");
  assert.equal(result.confidence, "DEFINITE");
  assert.deepEqual(result.candidates, [
    { year: { stem: "丁", branch: "未" }, month: { stem: "壬", branch: "寅" } },
  ]);
});

const events = KOREA_SOLAR_TERM_EVENTS_2026_2027;
const evidence = (term, displayedDateTime, sourceIds = ["KR-KASI-CALENDAR-DATA"]) => ({
  term, displayedDateTime, timeBasis: "KST", sourcePrecision: "MINUTE", sourceIds,
});
const xiaohan2027 = evidence("XIAOHAN", "2027-01-05T23:10");
const lichun2027 = evidence("LICHUN", "2027-02-04T10:46");
const jingzhe2027 = evidence("JINGZHE", "2027-03-06T04:40");
const resolve = minute => resolveYearMonthPillars(events, minute);

function assertTrace(result, expectedEvents, expectedBranches, expectedSides) {
  const trace = result.monthBoundaryTrace;
  assert.equal(trace.schemaVersion, "m1-month-boundary-trace-v1");
  assert.equal(trace.confidence, result.confidence);
  assert.equal(trace.candidateContexts.length, result.candidates.length);
  assert.deepEqual(trace.candidateContexts.map(context => context.activeSince), expectedEvents);
  assert.deepEqual(trace.candidateContexts.map(context => context.monthBranch), expectedBranches);
  assert.deepEqual(trace.candidateContexts.map(context => context.boundarySide), expectedSides);
  for (const [index, context] of trace.candidateContexts.entries()) {
    assert.equal(context.candidateIndex, index);
    assert.equal(context.monthBranch, result.candidates[index].month.branch);
  }
  if (result.confidence === "DEFINITE") {
    assert.equal(Object.hasOwn(trace, "atPublishedBoundary"), false);
  } else {
    assert.deepEqual(trace.atPublishedBoundary, expectedEvents[1]);
  }
}

test("M1-JIE-01: Lichun trace follows the two correlated year/month candidates", () => {
  assertTrace(resolve("2027-02-04T10:45"), [xiaohan2027], ["丑"], ["DEFINITE"]);
  const at = resolve("2027-02-04T10:46");
  assertTrace(at, [xiaohan2027, lichun2027], ["丑", "寅"],
    ["BEFORE_PUBLISHED_MINUTE", "AFTER_PUBLISHED_MINUTE"]);
  assert.deepEqual(at.candidates.map(candidate => candidate.year), [
    { stem: "丙", branch: "午" }, { stem: "丁", branch: "未" },
  ]);
  assertTrace(resolve("2027-02-04T10:47"), [lichun2027], ["寅"], ["DEFINITE"]);
});

test("M1-JIE-02: Jingzhe trace changes the month and retains the same year", () => {
  assertTrace(resolve("2027-03-06T04:39"), [lichun2027], ["寅"], ["DEFINITE"]);
  const at = resolve("2027-03-06T04:40");
  assertTrace(at, [lichun2027, jingzhe2027], ["寅", "卯"],
    ["BEFORE_PUBLISHED_MINUTE", "AFTER_PUBLISHED_MINUTE"]);
  assert.deepEqual(at.candidates.map(candidate => candidate.year), [
    { stem: "丁", branch: "未" }, { stem: "丁", branch: "未" },
  ]);
  assertTrace(resolve("2027-03-06T04:41"), [jingzhe2027], ["卯"], ["DEFINITE"]);
});

test("M1-JIE-03/04: early January retains the prior civil year's Daxue", () => {
  assertTrace(resolve("2026-01-01T00:00"), [evidence("DAXUE", "2025-12-07T06:05")],
    ["子"], ["DEFINITE"]);
  const daxue2026 = evidence("DAXUE", "2026-12-07T11:53");
  assertTrace(resolve("2027-01-05T23:09"), [daxue2026], ["子"], ["DEFINITE"]);
  assertTrace(resolve("2027-01-05T23:10"), [daxue2026, xiaohan2027], ["子", "丑"],
    ["BEFORE_PUBLISHED_MINUTE", "AFTER_PUBLISHED_MINUTE"]);
  assertTrace(resolve("2027-01-05T23:11"), [xiaohan2027], ["丑"], ["DEFINITE"]);
});

test("M1-JIE-06: a published Zhongqi minute retains its actual active Jie", () => {
  for (const minute of ["2027-02-19T06:32", "2027-02-19T06:33", "2027-02-19T06:34"]) {
    assertTrace(resolve(minute), [lichun2027], ["寅"], ["DEFINITE"]);
  }
});

test("M1-JIE-12/13: each trace retains only its event's declared source edition", () => {
  const editions = events.map(event => ({ ...event, sourceIds: ["TEST-OTHER-EDITION"] }));
  for (const event of editions) {
    if (event.displayedDateTime === xiaohan2027.displayedDateTime) event.sourceIds = ["TEST-PRIOR-EDITION"];
    if (event.displayedDateTime === lichun2027.displayedDateTime) event.sourceIds = ["TEST-BOUNDARY-EDITION", "TEST-WITNESS"];
  }
  const result = resolveYearMonthPillars(editions, "2027-02-04T10:46");
  assertTrace(result, [
    evidence("XIAOHAN", "2027-01-05T23:10", ["TEST-PRIOR-EDITION"]),
    evidence("LICHUN", "2027-02-04T10:46", ["TEST-BOUNDARY-EDITION", "TEST-WITNESS"]),
  ], ["丑", "寅"], ["BEFORE_PUBLISHED_MINUTE", "AFTER_PUBLISHED_MINUTE"]);
  // A declared one-minute edition disagreement is retained, never interpolated.
  editions.find(event => event.term === "LICHUN" && event.displayedDateTime.startsWith("2027-")).displayedDateTime = "2027-02-04T10:47";
  assertTrace(resolveYearMonthPillars(editions, "2027-02-04T10:46"), [
    evidence("XIAOHAN", "2027-01-05T23:10", ["TEST-PRIOR-EDITION"]),
  ], ["丑"], ["DEFINITE"]);
});

test("M1-JIE-13: active and boundary Jie snapshots reject missing or malformed source IDs", () => {
  for (const badSources of [undefined, null, [], [""], ["  "], [42], Array(1), "TEST-SOURCE"]) {
    for (const target of [xiaohan2027, lichun2027]) {
      const corrupt = events.map(event => event.displayedDateTime === target.displayedDateTime
        ? { ...event, sourceIds: badSources } : event);
      assert.throws(() => resolveYearMonthPillars(corrupt, "2027-02-04T10:46"),
        /applied Jie evidence requires nonempty event source IDs/);
    }
  }
});

test("M1-JIE-07/08: invalid timelines fail before a trace can be returned", () => {
  for (const patch of [{ timeBasis: "UTC" }, { sourcePrecision: "SECOND" }]) {
    assert.throws(() => resolveYearMonthPillars(events.map(event => ({ ...event, ...patch })),
      "2027-02-04T10:46"), /requires KST events|requires MINUTE source precision/);
  }
  const index = events.findIndex(event => event.displayedDateTime === lichun2027.displayedDateTime);
  assert.throws(() => resolveYearMonthPillars([...events.slice(0, index), ...events.slice(index + 1)],
    "2027-02-04T10:46"), /missing Lichun fixture/);
  assert.throws(() => resolveYearMonthPillars([...events.slice(0, index), events[index], ...events.slice(index)],
    "2027-02-04T10:46"), /strictly increasing without duplicates/);
  assert.throws(() => resolveYearMonthPillars([...events].reverse(), "2027-02-04T10:46"),
    /strictly increasing without duplicates/);
  assert.throws(() => resolveYearMonthPillars(events.filter(event => event.displayedDateTime !== xiaohan2027.displayedDateTime),
    "2027-02-04T10:46"), /nonconsecutive month-boundary Jie/);
});

test("applied Jie traces are deeply frozen snapshots without freezing caller events", () => {
  const mutable = events.map(event => ({ ...event, sourceIds: [...event.sourceIds] }));
  const trace = resolveYearMonthPillars(mutable, "2027-02-04T10:46").monthBoundaryTrace;
  const snapshot = structuredClone(trace);
  for (const object of [trace, trace.candidateContexts, trace.atPublishedBoundary,
    ...trace.candidateContexts.flatMap(context => [context, context.activeSince, context.activeSince.sourceIds])]) {
    assert.ok(Object.isFrozen(object));
  }
  assert.throws(() => { trace.candidateContexts[0].candidateIndex = 1; }, TypeError);
  assert.throws(() => { trace.atPublishedBoundary.displayedDateTime = "2027-02-04T10:47"; }, TypeError);
  assert.throws(() => { trace.atPublishedBoundary.sourceIds.push("FORGED"); }, TypeError);
  for (const context of trace.candidateContexts) {
    const original = mutable.find(event => event.displayedDateTime === context.activeSince.displayedDateTime);
    assert.notEqual(context.activeSince, original);
    assert.notEqual(context.activeSince.sourceIds, original.sourceIds);
    assert.equal(Object.isFrozen(original), false);
    original.term = "YUSHUI";
    original.sourceIds.push("LATER-MUTATION");
  }
  assert.deepEqual(trace, snapshot);
  const definite = resolve("2027-02-04T10:47").monthBoundaryTrace;
  for (const object of [definite, definite.candidateContexts, definite.candidateContexts[0],
    definite.candidateContexts[0].activeSince, definite.candidateContexts[0].activeSince.sourceIds]) {
    assert.ok(Object.isFrozen(object));
  }
});

test("M1-JIE-15: all 24 modern Jie boundaries retain aligned before/at/after event traces", () => {
  // Structural corpus sweep, not an independent verification of astronomical times.
  const branches = new Map([
    ["XIAOHAN", "丑"], ["LICHUN", "寅"], ["JINGZHE", "卯"], ["QINGMING", "辰"],
    ["LIXIA", "巳"], ["MANGZHONG", "午"], ["XIAOSHU", "未"], ["LIQIU", "申"],
    ["BAILU", "酉"], ["HANLU", "戌"], ["LIDONG", "亥"], ["DAXUE", "子"],
  ]);
  const boundaries = events.filter(event => branches.has(event.term));
  assert.equal(boundaries.length, 25); // includes the 2025 Daxue guard
  const tick = (minute, delta) => new Date(Date.parse(minute + ":00Z") + delta * 60_000).toISOString().slice(0, 16);
  for (let index = 1; index < boundaries.length; index++) {
    const prior = boundaries[index - 1];
    const boundary = boundaries[index];
    assertTrace(resolve(tick(boundary.displayedDateTime, -1)), [prior], [branches.get(prior.term)], ["DEFINITE"]);
    assertTrace(resolve(boundary.displayedDateTime), [prior, boundary],
      [branches.get(prior.term), branches.get(boundary.term)], ["BEFORE_PUBLISHED_MINUTE", "AFTER_PUBLISHED_MINUTE"]);
    assertTrace(resolve(tick(boundary.displayedDateTime, 1)), [boundary], [branches.get(boundary.term)], ["DEFINITE"]);
  }
});
