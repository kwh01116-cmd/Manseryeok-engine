import test from "node:test";
import assert from "node:assert/strict";
import { KOREA_SOLAR_TERM_EVENTS_2026_2027, KOREA_SOLAR_TERM_GUARD_2025_DAXUE } from "../dist/calendar/koreaSolarTermFixtures.js";
import { resolveMonthBranchAtJie } from "../dist/calendar/monthPillar.js";
import { validateKstMinuteSolarTermTimeline } from "../dist/calendar/solarTermTimeline.js";
import { resolveYearMonthPillars } from "../dist/calendar/yearMonthPillars.js";

const full = KOREA_SOLAR_TERM_EVENTS_2026_2027;

test("missing 2027 Jingzhe is rejected instead of silently retaining Yin month", () => {
  const corrupted = full.filter((event) => event.displayedDateTime !== "2027-03-06T04:40");
  assert.doesNotThrow(() => validateKstMinuteSolarTermTimeline(corrupted));
  assert.equal(resolveMonthBranchAtJie(full, "2027-03-10T12:00").selected, "卯");
  assert.throws(() => resolveMonthBranchAtJie(corrupted, "2027-03-10T12:00"), /nonconsecutive month-boundary Jie/);
  assert.throws(() => resolveYearMonthPillars(corrupted, "2027-03-10T12:00"), /nonconsecutive month-boundary Jie/);
});

test("missing Xiaohan across a civil-year boundary is rejected", () => {
  const corrupted = full.filter((event) => event.displayedDateTime !== "2027-01-05T23:10");
  assert.throws(() => resolveMonthBranchAtJie(corrupted, "2027-01-20T12:00"), /nonconsecutive month-boundary Jie/);
});

test("partial 2025 Daxue guard followed by 2026 Xiaohan remains valid", () => {
  const xiaohan = full.find((event) => event.term === "XIAOHAN" && event.displayedDateTime.startsWith("2026-"));
  assert.ok(xiaohan);
  const partial = [KOREA_SOLAR_TERM_GUARD_2025_DAXUE, xiaohan];
  assert.equal(resolveMonthBranchAtJie(partial, "2026-01-05T17:24").selected, "丑");
});

test("omitting a Zhongqi does not trigger a false missing-Jie error", () => {
  const withoutYushui = full.filter((event) => event.displayedDateTime !== "2027-02-19T06:33");
  assert.equal(resolveMonthBranchAtJie(withoutYushui, "2027-03-10T12:00").selected, "卯");
});
