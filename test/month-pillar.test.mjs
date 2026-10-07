import test from "node:test";
import assert from "node:assert/strict";
import { KOREA_SOLAR_TERM_EVENTS_2026_2027 } from "../dist/calendar/koreaSolarTermFixtures.js";
import {
  MONTH_BOUNDARY_JIE,
  MONTH_BRANCH_BY_JIE,
  monthPillarFromYearStem,
  resolveMonthBranchAtJie,
} from "../dist/calendar/monthPillar.js";

test("twelve Jie boundaries map in order from Yin through Chou", () => {
  assert.deepEqual(MONTH_BOUNDARY_JIE.map((term) => MONTH_BRANCH_BY_JIE[term]),
    ["寅","卯","辰","巳","午","未","申","酉","戌","亥","子","丑"]);
});

test("Five-Tiger rule gives the canonical Yin-month start for all ten year stems", () => {
  const yearStems = ["甲","己","乙","庚","丙","辛","丁","壬","戊","癸"];
  assert.deepEqual(yearStems.map((stem) => monthPillarFromYearStem(stem, "寅").stem),
    ["丙","丙","戊","戊","庚","庚","壬","壬","甲","甲"]);
});

test("Bing year advances from Geng-Yin through Xin-Chou without lunar-month shortcuts", () => {
  const branches = ["寅","卯","辰","巳","午","未","申","酉","戌","亥","子","丑"];
  assert.deepEqual(branches.map((branch) => monthPillarFromYearStem("丙", branch).stem),
    ["庚","辛","壬","癸","甲","乙","丙","丁","戊","己","庚","辛"]);
});

test("active Jie crosses the civil-year boundary from Daxue to Xiaohan", () => {
  assert.equal(resolveMonthBranchAtJie(KOREA_SOLAR_TERM_EVENTS_2026_2027, "2027-01-01T00:00").selected, "子");
  assert.equal(resolveMonthBranchAtJie(KOREA_SOLAR_TERM_EVENTS_2026_2027, "2027-01-05T23:09").selected, "子");
  const boundary = resolveMonthBranchAtJie(KOREA_SOLAR_TERM_EVENTS_2026_2027, "2027-01-05T23:10");
  assert.equal(boundary.confidence, "PUBLISHED_MINUTE_AMBIGUOUS");
  assert.equal(boundary.branchBeforeBoundary, "子");
  assert.equal(boundary.branchAfterBoundary, "丑");
  assert.equal(boundary.selected, undefined);
  assert.equal(resolveMonthBranchAtJie(KOREA_SOLAR_TERM_EVENTS_2026_2027, "2027-01-05T23:11").selected, "丑");
});

test("non-boundary Zhongqi does not change the active month and Jingzhe minute remains ambiguous", () => {
  assert.equal(resolveMonthBranchAtJie(KOREA_SOLAR_TERM_EVENTS_2026_2027, "2027-02-19T06:33").selected, "寅");
  assert.equal(resolveMonthBranchAtJie(KOREA_SOLAR_TERM_EVENTS_2026_2027, "2027-03-06T04:39").selected, "寅");
  const boundary = resolveMonthBranchAtJie(KOREA_SOLAR_TERM_EVENTS_2026_2027, "2027-03-06T04:40");
  assert.deepEqual([boundary.branchBeforeBoundary, boundary.branchAfterBoundary], ["寅","卯"]);
  assert.equal(resolveMonthBranchAtJie(KOREA_SOLAR_TERM_EVENTS_2026_2027, "2027-03-06T04:41").selected, "卯");
});

test("active-Jie resolver rejects malformed Gregorian minutes", () => {
  assert.throws(() => resolveMonthBranchAtJie(KOREA_SOLAR_TERM_EVENTS_2026_2027, "2027-02-30T10:00"), /invalid Gregorian minute/);
});
