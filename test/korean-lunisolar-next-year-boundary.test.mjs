import test from "node:test";
import assert from "node:assert/strict";
import {
  createKoreanLunisolarConverter,
  KASI_KOREAN_LUNISOLAR_2025_2027 as corpus,
  validateKoreanLunisolarCorpus,
} from "../dist/calendar/koreanLunisolar.js";

// Adjacent-year witness: KASI 2028 V1.0a publishes lunar 2028-01-01
// on Gregorian 2028-01-27. The 2027 corpus ends just before that date.
const terminal = { lunarYear: 2027, lunarMonth: 12, lunarDay: 30, isLeapMonth: false };

test("KASI 2028 next-year boundary independently anchors the last 2027 lunar day", () => {
  const converter = createKoreanLunisolarConverter(corpus);
  const lastDay = converter.fromGregorianDate("2028-01-26");
  assert.equal(lastDay.status, "OK");
  assert.deepEqual(lastDay.value, terminal);
  const reverse = converter.fromLunarDate(terminal);
  assert.equal(reverse.status, "OK");
  assert.equal(reverse.value, "2028-01-26");
  assert.equal(converter.supportedGregorianUntilExclusive, "2028-01-27");
  assert.deepEqual(converter.fromGregorianDate("2028-01-27"), { status: "OUT_OF_COVERAGE" });
});

test("a self-consistent truncated corpus passes structural validation but violates KASI 2028", () => {
  const tampered = {
    ...corpus,
    months: corpus.months.map(row => row.lunarYear === 2027 && row.lunarMonth === 12
      ? { ...row, days: 29 } : row),
    supportedGregorianUntilExclusive: "2028-01-26",
  };
  // This is a deliberate counterexample, not a proposed stricter validator:
  // structural integrity alone cannot establish published astronomical truth.
  assert.doesNotThrow(() => validateKoreanLunisolarCorpus(tampered));
  const converter = createKoreanLunisolarConverter(tampered);
  assert.deepEqual(converter.fromGregorianDate("2028-01-26"), { status: "OUT_OF_COVERAGE" });
  assert.notEqual(converter.supportedGregorianUntilExclusive, "2028-01-27");
});
