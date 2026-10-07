import assert from "node:assert/strict";
import test from "node:test";

import { resolveDayHourPillars } from "../dist/index.js";

test("late-Zi hour-stem reference is explicit when Zi-start changes the selected day", () => {
  const selected = resolveDayHourPillars(
    "2000-01-07", "23:30", "ZI_START", "SELECTED_DAY_PILLAR",
  );
  const civil = resolveDayHourPillars(
    "2000-01-07", "23:30", "ZI_START", "CIVIL_DATE_DAY_PILLAR",
  );

  assert.deepEqual(selected.dayPillar, { stem: "乙", branch: "丑" });
  assert.deepEqual(civil.dayPillar, { stem: "乙", branch: "丑" });
  assert.deepEqual(selected.hourPillar, { stem: "丙", branch: "子" });
  assert.deepEqual(civil.hourPillar, { stem: "甲", branch: "子" });
});

test("hour-stem references converge when selected and civil-date day stems coincide", () => {
  const cases = [
    ["2000-01-07", "22:59", "ZI_START"],
    ["2000-01-08", "00:00", "ZI_START"],
    ["2000-01-07", "23:30", "CIVIL_MIDNIGHT"],
  ];

  for (const [date, clock, rollover] of cases) {
    const selected = resolveDayHourPillars(date, clock, rollover, "SELECTED_DAY_PILLAR");
    const civil = resolveDayHourPillars(date, clock, rollover, "CIVIL_DATE_DAY_PILLAR");
    assert.deepEqual(selected.dayPillar, civil.dayPillar, date + " " + clock + " day");
    assert.deepEqual(selected.hourPillar, civil.hourPillar, date + " " + clock + " hour");
  }
});

test("composition preserves effective date provenance", () => {
  assert.equal(
    resolveDayHourPillars("1999-12-31", "23:30", "ZI_START", "SELECTED_DAY_PILLAR").effectiveDate,
    "2000-01-01",
  );
  assert.equal(
    resolveDayHourPillars("2000-01-07", "23:30", "CIVIL_MIDNIGHT", "SELECTED_DAY_PILLAR").effectiveDate,
    "2000-01-07",
  );
});
