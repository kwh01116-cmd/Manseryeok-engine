import test from "node:test";
import assert from "node:assert/strict";
import {
  MONTH_BOUNDARY_JIE,
  MONTH_BRANCH_BY_JIE,
  monthPillarFromYearStem,
} from "../dist/calendar/monthPillar.js";

test("twelve Jie boundaries map in order from Yin through Chou", () => {
  assert.deepEqual(
    MONTH_BOUNDARY_JIE.map((term) => MONTH_BRANCH_BY_JIE[term]),
    ["寅", "卯", "辰", "巳", "午", "未", "申", "酉", "戌", "亥", "子", "丑"],
  );
});

test("Five-Tiger rule gives the canonical Yin-month start for all ten year stems", () => {
  const yearStems = ["甲", "己", "乙", "庚", "丙", "辛", "丁", "壬", "戊", "癸"];
  assert.deepEqual(
    yearStems.map((stem) => monthPillarFromYearStem(stem, "寅").stem),
    ["丙", "丙", "戊", "戊", "庚", "庚", "壬", "壬", "甲", "甲"],
  );
});

test("Bing year advances from Geng-Yin through Xin-Chou without lunar-month shortcuts", () => {
  const branches = ["寅", "卯", "辰", "巳", "午", "未", "申", "酉", "戌", "亥", "子", "丑"];
  assert.deepEqual(
    branches.map((branch) => monthPillarFromYearStem("丙", branch).stem),
    ["庚", "辛", "壬", "癸", "甲", "乙", "丙", "丁", "戊", "己", "庚", "辛"],
  );
});
