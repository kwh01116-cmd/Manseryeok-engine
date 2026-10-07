import assert from "node:assert/strict";
import test from "node:test";

import { EARTHLY_BRANCHES, HEAVENLY_STEMS, hourPillarFromDayStem } from "../dist/index.js";

const EXPECTED_ZI_STEM = {
  甲: "甲", 己: "甲",
  乙: "丙", 庚: "丙",
  丙: "戊", 辛: "戊",
  丁: "庚", 壬: "庚",
  戊: "壬", 癸: "壬",
};

test("Five-Rat 子-hour starts match 日上起時例 for all ten day stems", () => {
  for (const dayStem of HEAVENLY_STEMS) {
    assert.deepEqual(hourPillarFromDayStem(dayStem, "子"), {
      stem: EXPECTED_ZI_STEM[dayStem],
      branch: "子",
    });
  }
});

test("Five-Rat lookup exhaustively covers 10 day stems x 12 hour branches", () => {
  for (const dayStem of HEAVENLY_STEMS) {
    const row = EARTHLY_BRANCHES.map((branch) => hourPillarFromDayStem(dayStem, branch));
    assert.equal(row.length, 12);
    assert.deepEqual(row.map(({ branch }) => branch), EARTHLY_BRANCHES);
    for (let i = 1; i < row.length; i += 1) {
      const previous = HEAVENLY_STEMS.indexOf(row[i - 1].stem);
      const current = HEAVENLY_STEMS.indexOf(row[i].stem);
      assert.equal(current, (previous + 1) % 10, dayStem + " at " + row[i].branch);
    }
  }
});

test("paired day stems separated by five share the same Five-Rat hour row", () => {
  for (let i = 0; i < 5; i += 1) {
    for (const branch of EARTHLY_BRANCHES) {
      assert.deepEqual(
        hourPillarFromDayStem(HEAVENLY_STEMS[i], branch),
        hourPillarFromDayStem(HEAVENLY_STEMS[i + 5], branch),
      );
    }
  }
});
