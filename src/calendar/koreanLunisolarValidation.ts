import type { KoreanLunarMonthRecord, KoreanLunisolarCorpus } from "./koreanLunisolarTypes.js";

const DAY_MS = 86_400_000;
export function gregorianDayNumber(value: string): number {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) throw new TypeError("Expected YYYY-MM-DD Gregorian civil date.");
  const [year, month, day] = value.split("-").map(Number) as [number, number, number];
  if (year < 1 || month < 1 || month > 12 || day < 1 || day > 31) throw new RangeError("Invalid Gregorian date.");
  const d = new Date(0);
  d.setUTCFullYear(year, month - 1, day);
  d.setUTCHours(0, 0, 0, 0);
  if (d.getUTCFullYear() !== year || d.getUTCMonth() !== month - 1 || d.getUTCDate() !== day) {
    throw new RangeError("Invalid Gregorian date.");
  }
  return d.getTime() / DAY_MS;
}
export function gregorianDateFromDayNumber(day: number): string {
  return new Date(day * DAY_MS).toISOString().slice(0, 10);
}
export function monthKey(year: number, month: number, leap: boolean): string {
  return year + ":" + month + ":" + (leap ? 1 : 0);
}

/** Validate the ENTIRE declared finite corpus; a missing terminal month must not pass. */
export function validateKoreanLunisolarCorpus(corpus: KoreanLunisolarCorpus): void {
  if (!corpus || corpus.schemaVersion !== "m1-korean-lunisolar-months-v1" ||
      corpus.authorityLevel !== "KASI_COMPUTATIONAL_REFERENCE_NOT_OFFICIAL_KASA" ||
      corpus.sourceId !== "KR-KASI-CALENDAR-DATA" ||
      typeof corpus.corpusId !== "string" || !corpus.corpusId ||
      !corpus.sourceEditions || !Array.isArray(corpus.months) || corpus.months.length === 0) {
    throw new RangeError("Invalid Korean lunisolar corpus metadata.");
  }
  const seen = new Set<string>();
  const regular = new Map<number, Set<number>>();
  const leapCounts = new Map<number, number>();
  let previous: KoreanLunarMonthRecord | undefined;
  let previousDay = 0;
  for (const row of corpus.months) {
    if (!row || !Number.isInteger(row.lunarYear) || row.lunarYear < 1 || row.lunarYear > 9999 ||
        !Number.isInteger(row.lunarMonth) || row.lunarMonth < 1 || row.lunarMonth > 12 ||
        typeof row.isLeapMonth !== "boolean" || (row.days !== 29 && row.days !== 30) ||
        typeof corpus.sourceEditions[row.lunarYear] !== "string" || !corpus.sourceEditions[row.lunarYear]) {
      throw new RangeError("Invalid lunar month record or missing source edition.");
    }
    const startDay = gregorianDayNumber(row.gregorianStart);
    const key = monthKey(row.lunarYear, row.lunarMonth, row.isLeapMonth);
    if (seen.has(key)) throw new RangeError("Duplicate lunar month: " + key);
    seen.add(key);
    if (row.isLeapMonth) {
      leapCounts.set(row.lunarYear, (leapCounts.get(row.lunarYear) ?? 0) + 1);
    } else {
      if (!regular.has(row.lunarYear)) regular.set(row.lunarYear, new Set());
      regular.get(row.lunarYear)!.add(row.lunarMonth);
    }
    if (previous) {
      if (startDay !== previousDay + previous.days) throw new RangeError("Noncontiguous Gregorian lunar-month starts.");
      const leapAfterRegular = row.lunarYear === previous.lunarYear &&
        row.lunarMonth === previous.lunarMonth && row.isLeapMonth && !previous.isLeapMonth;
      const nextMonth = row.lunarYear === previous.lunarYear &&
        row.lunarMonth === previous.lunarMonth + 1 && !row.isLeapMonth;
      const nextYear = row.lunarYear === previous.lunarYear + 1 &&
        previous.lunarMonth === 12 && row.lunarMonth === 1 && !row.isLeapMonth;
      if (!leapAfterRegular && !nextMonth && !nextYear) throw new RangeError("Invalid lunar month sequence.");
    } else if (row.lunarMonth !== 1 || row.isLeapMonth) {
      throw new RangeError("Finite corpus must start at lunar new year.");
    }
    previous = row;
    previousDay = startDay;
  }
  if (previous!.lunarMonth !== 12 || previous!.isLeapMonth) {
    throw new RangeError("Finite corpus must end at lunar month 12.");
  }
  for (const [year, months] of regular) {
    if (months.size !== 12 || (leapCounts.get(year) ?? 0) > 1) {
      throw new RangeError("Incomplete or invalid lunar-year month coverage.");
    }
  }
  if (corpus.supportedGregorianFromInclusive !== corpus.months[0]!.gregorianStart ||
      corpus.supportedGregorianUntilExclusive !== gregorianDateFromDayNumber(previousDay + previous!.days)) {
    throw new RangeError("Declared Gregorian coverage bounds do not match lunar months.");
  }
}

