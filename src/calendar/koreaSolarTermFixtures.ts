import type { SolarTermCode, SolarTermEvent } from "./solarTerms.js";
import { validateKstMinuteSolarTermTimeline } from "./solarTermTimeline.js";

export const KASA_AUTHORITY_SOURCE_IDS = {
  2026: "KR-KASA-WOLRYEOK-2026",
  2027: "KR-KASA-WOLRYEOK-2027",
} as const;

export const KASI_TRANSCRIPTION_SOURCE_ID = "KR-KASI-CALENDAR-DATA";

const TERM_ORDER: readonly SolarTermCode[] = [
  "XIAOHAN", "DAHAN", "LICHUN", "YUSHUI", "JINGZHE", "CHUNFEN",
  "QINGMING", "GUYU", "LIXIA", "XIAOMAN", "MANGZHONG", "XIAZHI",
  "XIAOSHU", "DASHU", "LIQIU", "CHUSHU", "BAILU", "QIUFEN",
  "HANLU", "SHUANGJIANG", "LIDONG", "XIAOXUE", "DAXUE", "DONGZHI",
];

const VALUES = {
  2026: [
    "01-05T17:23", "01-20T10:45", "02-04T05:02", "02-19T00:52",
    "03-05T22:59", "03-20T23:46", "04-05T03:40", "04-20T10:39",
    "05-05T20:49", "05-21T09:37", "06-06T00:48", "06-21T17:25",
    "07-07T10:57", "07-23T04:13", "08-07T20:43", "08-23T11:19",
    "09-07T23:41", "09-23T09:05", "10-08T15:29", "10-23T18:38",
    "11-07T18:52", "11-22T16:23", "12-07T11:53", "12-22T05:50",
  ],
  2027: [
    "01-05T23:10", "01-20T16:30", "02-04T10:46", "02-19T06:33",
    "03-06T04:40", "03-21T05:25", "04-05T09:17", "04-20T16:18",
    "05-06T02:25", "05-21T15:18", "06-06T06:26", "06-21T23:11",
    "07-07T16:37", "07-23T10:05", "08-08T02:27", "08-23T17:14",
    "09-08T05:28", "09-23T15:02", "10-08T21:17", "10-24T00:33",
    "11-08T00:39", "11-22T22:16", "12-07T17:38", "12-22T11:42",
  ],
} as const;

function yearEvents(year: keyof typeof VALUES): readonly SolarTermEvent[] {
  const authority = KASA_AUTHORITY_SOURCE_IDS[year];
  return VALUES[year].map((monthDayTime, index) => ({
    term: TERM_ORDER[index]!,
    displayedDateTime: `${year}-${monthDayTime}`,
    timeBasis: "KST",
    sourcePrecision: "MINUTE",
    sourceIds: [authority, KASI_TRANSCRIPTION_SOURCE_ID],
  }));
}

export const KOREA_SOLAR_TERM_GUARD_2025_DAXUE: SolarTermEvent = Object.freeze({
  term: "DAXUE",
  displayedDateTime: "2025-12-07T06:05",
  timeBasis: "KST",
  sourcePrecision: "MINUTE",
  sourceIds: [KASI_TRANSCRIPTION_SOURCE_ID],
});

export const KOREA_SOLAR_TERM_EVENTS_2026_2027: readonly SolarTermEvent[] = [
  KOREA_SOLAR_TERM_GUARD_2025_DAXUE,
  ...yearEvents(2026),
  ...yearEvents(2027),
];

validateKstMinuteSolarTermTimeline(KOREA_SOLAR_TERM_EVENTS_2026_2027);
