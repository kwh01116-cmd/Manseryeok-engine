import assert from "node:assert/strict";
import test from "node:test";

import { selectDayPillarByRollover } from "../dist/index.js";

test("DAY_ROLLOVER policies diverge only during the late-Zi civil hour", () => {
  const cases = [
    ["2000-01-07", "22:59", "甲", "子", "甲", "子"],
    ["2000-01-07", "23:00", "甲", "子", "乙", "丑"],
    ["2000-01-07", "23:30", "甲", "子", "乙", "丑"],
    ["2000-01-07", "23:59", "甲", "子", "乙", "丑"],
    ["2000-01-08", "00:00", "乙", "丑", "乙", "丑"],
    ["2000-01-08", "00:30", "乙", "丑", "乙", "丑"],
  ];

  for (const [date, clock, civilStem, civilBranch, ziStem, ziBranch] of cases) {
    assert.deepEqual(
      selectDayPillarByRollover(date, clock, "CIVIL_MIDNIGHT").pillar,
      { stem: civilStem, branch: civilBranch },
      date + " " + clock + " civil-midnight",
    );
    assert.deepEqual(
      selectDayPillarByRollover(date, clock, "ZI_START").pillar,
      { stem: ziStem, branch: ziBranch },
      date + " " + clock + " Zi-start",
    );
  }
});

test("ZI_START advances the effective Gregorian date across calendar boundaries", () => {
  assert.equal(selectDayPillarByRollover("1999-12-31", "23:30", "ZI_START").effectiveDate, "2000-01-01");
  assert.equal(selectDayPillarByRollover("2000-02-29", "23:30", "ZI_START").effectiveDate, "2000-03-01");
  assert.equal(selectDayPillarByRollover("2000-01-08", "00:00", "ZI_START").effectiveDate, "2000-01-08");
});

test("day-rollover selection validates both date and effective clock", () => {
  assert.throws(() => selectDayPillarByRollover("2000-02-30", "23:30", "ZI_START"));
  assert.throws(() => selectDayPillarByRollover("2000-01-07", "24:00", "ZI_START"));
});
