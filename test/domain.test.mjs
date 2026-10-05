import assert from "node:assert/strict";
import test from "node:test";

import {
  EARTHLY_BRANCHES,
  HEAVENLY_STEMS,
  SEXAGENARY_CYCLE,
  ganZhiAt,
  ganZhiIndex,
  tenGod,
} from "../dist/index.js";

test("甲 day-master ten-god row matches the canonical deterministic mapping", () => {
  const expected = [
    "比肩", "劫財", "食神", "傷官", "偏財", "正財", "七殺", "正官", "偏印", "正印",
  ];

  assert.deepEqual(
    HEAVENLY_STEMS.map((target) => tenGod("甲", target)),
    expected,
  );
});

test("every day master maps ten stems bijectively onto all ten gods", () => {
  for (const dayMaster of HEAVENLY_STEMS) {
    const gods = HEAVENLY_STEMS.map((target) => tenGod(dayMaster, target));
    assert.equal(new Set(gods).size, 10, `day master ${dayMaster}`);
  }
});

test("sexagenary cycle contains 60 unique stem-branch pairs", () => {
  assert.equal(SEXAGENARY_CYCLE.length, 60);
  assert.equal(
    new Set(SEXAGENARY_CYCLE.map(({ stem, branch }) => `${stem}${branch}`)).size,
    60,
  );
});

test("sexagenary cycle wraps in both directions", () => {
  assert.deepEqual(ganZhiAt(0), { stem: "甲", branch: "子" });
  assert.deepEqual(ganZhiAt(59), { stem: "癸", branch: "亥" });
  assert.deepEqual(ganZhiAt(60), { stem: "甲", branch: "子" });
  assert.deepEqual(ganZhiAt(-1), { stem: "癸", branch: "亥" });
});

test("invalid parity stem-branch combinations are rejected by index lookup", () => {
  assert.equal(ganZhiIndex("甲", "子"), 0);
  assert.equal(ganZhiIndex("癸", "亥"), 59);
  assert.equal(ganZhiIndex("甲", "丑"), null);
  assert.equal(ganZhiIndex("乙", "子"), null);
});

test("base cardinalities remain canonical", () => {
  assert.equal(HEAVENLY_STEMS.length, 10);
  assert.equal(EARTHLY_BRANCHES.length, 12);
});
