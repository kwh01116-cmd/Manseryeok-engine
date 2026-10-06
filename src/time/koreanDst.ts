export interface KoreanDstPeriod {
  readonly startLocalStandardTime: string;
  readonly endLocalDaylightTime: string;
  readonly adjustmentMinutes: 60;
  readonly evidenceId: "KR_PRESIDENTIAL_DECREE_12136";
}

// Presidential Decree No. 12136 (1987-04-07):
// every second Sunday of May, 02:00 -> 03:00;
// every second Sunday of October, 03:00 -> 02:00.
// The decree remained in force for 1987 and 1988 and was repealed in 1989.
export const KOREAN_DST_1987_1988: readonly KoreanDstPeriod[] = [
  {
    startLocalStandardTime: "1987-05-10T02:00:00",
    endLocalDaylightTime: "1987-10-11T03:00:00",
    adjustmentMinutes: 60,
    evidenceId: "KR_PRESIDENTIAL_DECREE_12136",
  },
  {
    startLocalStandardTime: "1988-05-08T02:00:00",
    endLocalDaylightTime: "1988-10-09T03:00:00",
    adjustmentMinutes: 60,
    evidenceId: "KR_PRESIDENTIAL_DECREE_12136",
  },
];

export type KoreanDstStatus =
  | { readonly status: "DAYLIGHT"; readonly adjustmentMinutes: 60; readonly evidenceId: "KR_PRESIDENTIAL_DECREE_12136" }
  | { readonly status: "STANDARD"; readonly adjustmentMinutes: 0; readonly evidenceId: "KR_PRESIDENTIAL_DECREE_12136" }
  | { readonly status: "UNSUPPORTED_YEAR" };

const LOCAL_DATE_TIME = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2}):(\d{2})$/;

function assertLocalDateTime(value: string): void {
  const match = LOCAL_DATE_TIME.exec(value);
  if (!match) throw new TypeError("Local date-time must be YYYY-MM-DDTHH:mm:ss.");
  const [year, month, day, hour, minute, second] = match.slice(1).map(Number);
  const parsed = new Date(Date.UTC(year!, month! - 1, day!, hour!, minute!, second!));
  if (
    parsed.getUTCFullYear() !== year ||
    parsed.getUTCMonth() !== month! - 1 ||
    parsed.getUTCDate() !== day ||
    parsed.getUTCHours() !== hour ||
    parsed.getUTCMinutes() !== minute ||
    parsed.getUTCSeconds() !== second
  ) {
    throw new RangeError("Local date-time must be a valid Gregorian date-time.");
  }
}

export function resolveKoreanDst1987To1988(localClock: string): KoreanDstStatus {
  assertLocalDateTime(localClock);
  const year = Number(localClock.slice(0, 4));
  const period = KOREAN_DST_1987_1988.find((candidate) =>
    candidate.startLocalStandardTime.startsWith(String(year)),
  );
  if (!period) return { status: "UNSUPPORTED_YEAR" };

  // The spring-forward gap [02:00, 03:00) never existed on the civil clock.
  // The fall-back overlap [02:00, 03:00) occurred twice. A bare wall-clock
  // value in either interval cannot identify one unique instant.
  const startDate = period.startLocalStandardTime.slice(0, 10);
  const endDate = period.endLocalDaylightTime.slice(0, 10);
  if (localClock >= `${startDate}T02:00:00` && localClock < `${startDate}T03:00:00`) {
    throw new RangeError("Nonexistent Korean civil time during DST spring-forward transition.");
  }
  if (localClock >= `${endDate}T02:00:00` && localClock < `${endDate}T03:00:00`) {
    throw new RangeError("Ambiguous Korean civil time during DST fall-back transition.");
  }

  if (localClock >= `${startDate}T03:00:00` && localClock < period.endLocalDaylightTime) {
    return { status: "DAYLIGHT", adjustmentMinutes: 60, evidenceId: period.evidenceId };
  }
  return { status: "STANDARD", adjustmentMinutes: 0, evidenceId: period.evidenceId };
}
