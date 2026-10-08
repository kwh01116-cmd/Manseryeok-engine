import test from "node:test";
import assert from "node:assert/strict";
import { hourPillarFromDayStem } from "../dist/calendar/hourPillar.js";
import { monthPillarFromYearStem } from "../dist/calendar/monthPillar.js";
import { HEAVENLY_STEMS } from "../dist/domain/stems.js";
import { EARTHLY_BRANCHES } from "../dist/domain/branches.js";

const INVALID_VALUES = [undefined, null, 0, "", "AUTO", "甲 ", "甲\n", "zi", "__proto__", Symbol("invalid")];

test("Five-Rat rejects invalid runtime day stems and hour branches", () => {
  for (const value of INVALID_VALUES) {
    assert.throws(() => hourPillarFromDayStem(value, "子"), RangeError);
    assert.throws(() => hourPillarFromDayStem("甲", value), RangeError);
  }
});

test("Five-Tiger rejects invalid runtime year stems", () => {
  for (const value of INVALID_VALUES) {
    assert.throws(() => monthPillarFromYearStem(value, "寅"), RangeError);
  }
});

test("valid Five-Rat and Five-Tiger lookup domains remain exhaustive", () => {
  for (const stem of HEAVENLY_STEMS) {
    for (const branch of EARTHLY_BRANCHES) {
      const result = hourPillarFromDayStem(stem, branch);
      assert.ok(HEAVENLY_STEMS.includes(result.stem));
      assert.equal(result.branch, branch);
    }
  }
  const monthBranches = ["寅", "卯", "辰", "巳", "午", "未", "申", "酉", "戌", "亥", "子", "丑"];
  for (const stem of HEAVENLY_STEMS) {
    for (const branch of monthBranches) {
      const result = monthPillarFromYearStem(stem, branch);
      assert.ok(HEAVENLY_STEMS.includes(result.stem));
      assert.equal(result.branch, branch);
    }
  }
  assert.deepEqual(hourPillarFromDayStem("甲", "子"), { stem: "甲", branch: "子" });
  assert.deepEqual(monthPillarFromYearStem("甲", "寅"), { stem: "丙", branch: "寅" });
});
