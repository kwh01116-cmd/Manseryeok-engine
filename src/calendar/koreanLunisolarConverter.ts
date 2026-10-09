import type { KoreanLunarDate, KoreanLunisolarCorpus, KoreanLunisolarResult } from "./koreanLunisolarTypes.js";
import { gregorianDayNumber, gregorianDateFromDayNumber, monthKey, validateKoreanLunisolarCorpus } from "./koreanLunisolarValidation.js";

/** One-time corpus validation; conversion thereafter uses only this finite table. */
export function createKoreanLunisolarConverter(corpus: KoreanLunisolarCorpus) {
  validateKoreanLunisolarCorpus(corpus);
  const months = corpus.months.map(row => ({ ...row, startDay: gregorianDayNumber(row.gregorianStart) }));
  const first = months[0]!;
  const last = months[months.length - 1]!;
  const untilExclusive = last.startDay + last.days;
  const byLunar = new Map(months.map(row => [monthKey(row.lunarYear, row.lunarMonth, row.isLeapMonth), row]));
  const provenance = {
    corpusId: corpus.corpusId, sourceId: corpus.sourceId, authorityLevel: corpus.authorityLevel,
  } as const;
  return Object.freeze({
    supportedGregorianFromInclusive: first.gregorianStart,
    supportedGregorianUntilExclusive: gregorianDateFromDayNumber(untilExclusive),
    fromGregorianDate(date: string): KoreanLunisolarResult<KoreanLunarDate> {
      const day = gregorianDayNumber(date);
      if (day < first.startDay || day >= untilExclusive) return { status: "OUT_OF_COVERAGE" };
      let row = first;
      for (const candidate of months) {
        if (candidate.startDay > day) break;
        row = candidate;
      }
      return { status: "OK", value: {
        lunarYear: row.lunarYear, lunarMonth: row.lunarMonth,
        lunarDay: day - row.startDay + 1, isLeapMonth: row.isLeapMonth,
      }, ...provenance };
    },
    fromLunarDate(date: KoreanLunarDate): KoreanLunisolarResult<string> {
      if (!date || !Number.isInteger(date.lunarYear) || !Number.isInteger(date.lunarMonth) ||
          !Number.isInteger(date.lunarDay) || typeof date.isLeapMonth !== "boolean" ||
          date.lunarYear < 1 || date.lunarMonth < 1 || date.lunarMonth > 12 || date.lunarDay < 1) {
        throw new RangeError("Invalid lunar date shape; isLeapMonth must be explicit.");
      }
      if (date.lunarYear < first.lunarYear || date.lunarYear > last.lunarYear) {
        return { status: "OUT_OF_COVERAGE" };
      }
      const row = byLunar.get(monthKey(date.lunarYear, date.lunarMonth, date.isLeapMonth));
      if (!row || date.lunarDay > row.days) return { status: "INVALID_LUNAR_DATE" };
      return { status: "OK", value: gregorianDateFromDayNumber(row.startDay + date.lunarDay - 1), ...provenance };
    },
  });
}
