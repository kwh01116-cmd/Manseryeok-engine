import type { KoreanLunisolarCorpus } from "./koreanLunisolarTypes.js";

// [lunar year, month, leap, Gregorian first day, published month size].
// 2025: KASI 2025 V1.0a (2024-05-07); 2026: V1.0a (2024-07-25);
// 2027: V1.0a (2026-06-30). All 37 starts are directly transcribed.
const ROWS = [
  [2025, 1, false, "2025-01-29", 30],
  [2025, 2, false, "2025-02-28", 29],
  [2025, 3, false, "2025-03-29", 30],
  [2025, 4, false, "2025-04-28", 29],
  [2025, 5, false, "2025-05-27", 29],
  [2025, 6, false, "2025-06-25", 30],
  [2025, 6, true,  "2025-07-25", 29],
  [2025, 7, false, "2025-08-23", 30],
  [2025, 8, false, "2025-09-22", 29],
  [2025, 9, false, "2025-10-21", 30],
  [2025,10, false, "2025-11-20", 30],
  [2025,11, false, "2025-12-20", 30],
  [2025,12, false, "2026-01-19", 29],
  [2026, 1, false, "2026-02-17", 30],
  [2026, 2, false, "2026-03-19", 29],
  [2026, 3, false, "2026-04-17", 30],
  [2026, 4, false, "2026-05-17", 29],
  [2026, 5, false, "2026-06-15", 29],
  [2026, 6, false, "2026-07-14", 30],
  [2026, 7, false, "2026-08-13", 29],
  [2026, 8, false, "2026-09-11", 30],
  [2026, 9, false, "2026-10-11", 29],
  [2026,10, false, "2026-11-09", 30],
  [2026,11, false, "2026-12-09", 30],
  [2026,12, false, "2027-01-08", 30],
  [2027, 1, false, "2027-02-07", 29],
  [2027, 2, false, "2027-03-08", 30],
  [2027, 3, false, "2027-04-07", 29],
  [2027, 4, false, "2027-05-06", 30],
  [2027, 5, false, "2027-06-05", 29],
  [2027, 6, false, "2027-07-04", 29],
  [2027, 7, false, "2027-08-02", 30],
  [2027, 8, false, "2027-09-01", 29],
  [2027, 9, false, "2027-09-30", 29],
  [2027,10, false, "2027-10-29", 30],
  [2027,11, false, "2027-11-28", 30],
  [2027,12, false, "2027-12-28", 30],
] as const;

export const KASI_KOREAN_LUNISOLAR_2025_2027: KoreanLunisolarCorpus = Object.freeze({
  schemaVersion: "m1-korean-lunisolar-months-v1",
  corpusId: "kasi-lunisolar-2025-2027-v1",
  authorityLevel: "KASI_COMPUTATIONAL_REFERENCE_NOT_OFFICIAL_KASA",
  sourceId: "KR-KASI-CALENDAR-DATA",
  supportedGregorianFromInclusive: "2025-01-29",
  supportedGregorianUntilExclusive: "2028-01-27",
  sourceEditions: Object.freeze({
    2025: "V1.0a/2024-05-07T14:23",
    2026: "V1.0a/2024-07-25T16:57",
    2027: "V1.0a/2026-06-30T12:33",
  }),
  months: Object.freeze(ROWS.map(([lunarYear, lunarMonth, isLeapMonth, gregorianStart, days]) =>
    Object.freeze({ lunarYear, lunarMonth, isLeapMonth, gregorianStart, days }))),
});

