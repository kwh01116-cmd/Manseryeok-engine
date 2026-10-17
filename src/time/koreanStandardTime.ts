export interface KoreanStandardTimePeriod {
  readonly startDate: string;
  readonly endDate: string | null;
  readonly standardMeridianDegreesEast: 127.5 | 135;
  readonly utcOffsetMinutes: 510 | 540;
  readonly evidenceId: "KASI_STANDARD_TIME_HISTORY_2000";
}

export const KOREAN_STANDARD_TIME_PERIODS: readonly KoreanStandardTimePeriod[] = [
  { startDate: "1908-04-01", endDate: "1911-12-31", standardMeridianDegreesEast: 127.5, utcOffsetMinutes: 510, evidenceId: "KASI_STANDARD_TIME_HISTORY_2000" },
  { startDate: "1912-01-01", endDate: "1954-03-20", standardMeridianDegreesEast: 135, utcOffsetMinutes: 540, evidenceId: "KASI_STANDARD_TIME_HISTORY_2000" },
  { startDate: "1954-03-21", endDate: "1961-08-09", standardMeridianDegreesEast: 127.5, utcOffsetMinutes: 510, evidenceId: "KASI_STANDARD_TIME_HISTORY_2000" },
  { startDate: "1961-08-10", endDate: null, standardMeridianDegreesEast: 135, utcOffsetMinutes: 540, evidenceId: "KASI_STANDARD_TIME_HISTORY_2000" },
];

const ISO_DATE = /^(\d{4})-(\d{2})-(\d{2})$/;

function assertIsoDate(date: string): void {
  const match = ISO_DATE.exec(date);
  if (!match) throw new TypeError("Date must be YYYY-MM-DD.");
  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const parsed = new Date(Date.UTC(year, month - 1, day));
  if (parsed.getUTCFullYear() !== year || parsed.getUTCMonth() !== month - 1 || parsed.getUTCDate() !== day) throw new RangeError("Date must be a valid Gregorian date.");
}

export function resolveKoreanStandardTime(date: string): KoreanStandardTimePeriod | null {
  assertIsoDate(date);
  for (const period of KOREAN_STANDARD_TIME_PERIODS) {
    if (date < period.startDate) continue;
    if (period.endDate !== null && date > period.endDate) continue;
    return period;
  }
  return null;
}
