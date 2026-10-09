import assert from "node:assert/strict";
import test from "node:test";

import {
  EARTHLY_BRANCHES,
  HEAVENLY_STEMS,
  STEM_NATURE,
  BRANCH_NATURE,
  TEN_GODS,
  SEXAGENARY_CYCLE,
  ganZhiAt,
  ganZhiIndex,
  tenGod,
  resolveKoreanStandardTime,
  resolveKoreanDst1987To1988,
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


test("Korean standard-time boundaries do not assume modern UTC+9 retroactively", () => {
  assert.equal(resolveKoreanStandardTime("1908-03-31"), null);
  assert.equal(resolveKoreanStandardTime("1908-04-01").utcOffsetMinutes, 510);
  assert.equal(resolveKoreanStandardTime("1912-01-01").utcOffsetMinutes, 540);
  assert.equal(resolveKoreanStandardTime("1954-03-21").utcOffsetMinutes, 510);
  assert.equal(resolveKoreanStandardTime("1961-08-10").utcOffsetMinutes, 540);
});

test("1987 DST transition gaps and folds are explicit instead of guessed", () => {
  assert.equal(resolveKoreanDst1987To1988("1987-05-10T01:59:59").status, "STANDARD");
  assert.throws(() => resolveKoreanDst1987To1988("1987-05-10T02:30:00"), /Nonexistent Korean civil time/);
  assert.equal(resolveKoreanDst1987To1988("1987-05-10T03:00:00").status, "DAYLIGHT");
  assert.throws(() => resolveKoreanDst1987To1988("1987-10-11T02:30:00"), /Ambiguous Korean civil time/);
  assert.equal(resolveKoreanDst1987To1988("1987-10-11T03:00:00").status, "STANDARD");
  assert.equal(resolveKoreanDst1987To1988("1989-01-01T00:00:00").status, "UNSUPPORTED_YEAR");
});

test("shared sexagenary tables and returned GanZhi resist runtime mutation", () => {
  for (const array of [HEAVENLY_STEMS, EARTHLY_BRANCHES, SEXAGENARY_CYCLE]) {
    assert.equal(Object.isFrozen(array), true);
    assert.throws(() => array.push("CORRUPTION"), TypeError);
    assert.throws(() => { array[0] = "CORRUPTION"; }, TypeError);
  }
  for (const pillar of SEXAGENARY_CYCLE) {
    assert.equal(Object.isFrozen(pillar), true);
    assert.throws(() => { pillar.stem = "乙"; }, TypeError);
    assert.throws(() => { pillar.branch = "丑"; }, TypeError);
  }
  assert.deepEqual(ganZhiAt(0), { stem: "甲", branch: "子" });
  assert.equal(ganZhiIndex("甲", "子"), 0);
  assert.equal(ganZhiIndex("乙", "子"), null);
});


test("exported nature tables are runtime immutable and ten-god relations remain stable", () => {
  for (const table of [STEM_NATURE, BRANCH_NATURE]) {
    assert.equal(Object.isFrozen(table), true);
    for (const nature of Object.values(table)) assert.equal(Object.isFrozen(nature), true);
  }
  assert.equal(Object.isFrozen(TEN_GODS), true);
  assert.throws(() => { STEM_NATURE.甲.element = "FIRE"; }, TypeError);
  assert.throws(() => { STEM_NATURE.甲 = { element: "FIRE", polarity: "YANG" }; }, TypeError);
  assert.throws(() => { BRANCH_NATURE.子.principalElement = "FIRE"; }, TypeError);
  assert.throws(() => TEN_GODS.push("CORRUPTION"), TypeError);
  assert.equal(tenGod("甲", "丙"), "食神");
  for (const dayMaster of HEAVENLY_STEMS) {
    assert.deepEqual(new Set(HEAVENLY_STEMS.map(stem => tenGod(dayMaster, stem))), new Set(TEN_GODS));
  }
});

test("tenGod rejects malformed runtime stems, including prototype keys", () => {
  for (const invalid of ["__proto__", "constructor", "甲子", "", null, undefined, 0]) {
    assert.throws(() => tenGod(invalid, "甲"), RangeError);
    assert.throws(() => tenGod("甲", invalid), RangeError);
  }
});
