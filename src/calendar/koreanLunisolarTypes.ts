/** Pure civil-date and provenance contracts for finite Korean lunisolar lookup. */
export interface KoreanLunarDate {
  readonly lunarYear: number;
  readonly lunarMonth: number;
  readonly lunarDay: number;
  readonly isLeapMonth: boolean;
}

export interface KoreanLunarMonthRecord {
  readonly lunarYear: number;
  readonly lunarMonth: number;
  readonly isLeapMonth: boolean;
  readonly gregorianStart: string;
  readonly days: 29 | 30;
}

export interface KoreanLunisolarCorpus {
  readonly schemaVersion: "m1-korean-lunisolar-months-v1";
  readonly corpusId: string;
  readonly authorityLevel: "KASI_COMPUTATIONAL_REFERENCE_NOT_OFFICIAL_KASA";
  readonly sourceId: "KR-KASI-CALENDAR-DATA";
  readonly sourceEditions: Readonly<Record<number, string>>;
  readonly supportedGregorianFromInclusive: string;
  readonly supportedGregorianUntilExclusive: string;
  readonly months: readonly KoreanLunarMonthRecord[];
}


export type KoreanLunisolarResult<T> =
  | { readonly status: "OK"; readonly value: T; readonly corpusId: string;
      readonly sourceId: "KR-KASI-CALENDAR-DATA";
      readonly authorityLevel: "KASI_COMPUTATIONAL_REFERENCE_NOT_OFFICIAL_KASA" }
  | { readonly status: "OUT_OF_COVERAGE" }
  | { readonly status: "INVALID_LUNAR_DATE" };

