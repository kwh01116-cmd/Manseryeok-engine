export const SOLAR_TERM_CODES = [
  "XIAOHAN",
  "DAHAN",
  "LICHUN",
  "YUSHUI",
  "JINGZHE",
  "CHUNFEN",
  "QINGMING",
  "GUYU",
  "LIXIA",
  "XIAOMAN",
  "MANGZHONG",
  "XIAZHI",
  "XIAOSHU",
  "DASHU",
  "LIQIU",
  "CHUSHU",
  "BAILU",
  "QIUFEN",
  "HANLU",
  "SHUANGJIANG",
  "LIDONG",
  "XIAOXUE",
  "DAXUE",
  "DONGZHI",
] as const;

export type SolarTermCode = (typeof SOLAR_TERM_CODES)[number];

export interface SolarTermDefinition {
  readonly code: SolarTermCode;
  readonly koreanName: string;
  readonly hanjaName: string;
  readonly solarLongitudeDegrees: number;
}

// Factual 24-term taxonomy only. This table intentionally does not encode
// Myeongli month-boundary semantics (節/中, pillar rollover, equality policy).
// KASI publishes the same term names and solar longitudes in its almanac data.
export const SOLAR_TERM_DEFINITIONS: Readonly<Record<SolarTermCode, SolarTermDefinition>> = {
  XIAOHAN: { code: "XIAOHAN", koreanName: "소한", hanjaName: "小寒", solarLongitudeDegrees: 285 },
  DAHAN: { code: "DAHAN", koreanName: "대한", hanjaName: "大寒", solarLongitudeDegrees: 300 },
  LICHUN: { code: "LICHUN", koreanName: "입춘", hanjaName: "立春", solarLongitudeDegrees: 315 },
  YUSHUI: { code: "YUSHUI", koreanName: "우수", hanjaName: "雨水", solarLongitudeDegrees: 330 },
  JINGZHE: { code: "JINGZHE", koreanName: "경칩", hanjaName: "驚蟄", solarLongitudeDegrees: 345 },
  CHUNFEN: { code: "CHUNFEN", koreanName: "춘분", hanjaName: "春分", solarLongitudeDegrees: 0 },
  QINGMING: { code: "QINGMING", koreanName: "청명", hanjaName: "清明", solarLongitudeDegrees: 15 },
  GUYU: { code: "GUYU", koreanName: "곡우", hanjaName: "穀雨", solarLongitudeDegrees: 30 },
  LIXIA: { code: "LIXIA", koreanName: "입하", hanjaName: "立夏", solarLongitudeDegrees: 45 },
  XIAOMAN: { code: "XIAOMAN", koreanName: "소만", hanjaName: "小滿", solarLongitudeDegrees: 60 },
  MANGZHONG: { code: "MANGZHONG", koreanName: "망종", hanjaName: "芒種", solarLongitudeDegrees: 75 },
  XIAZHI: { code: "XIAZHI", koreanName: "하지", hanjaName: "夏至", solarLongitudeDegrees: 90 },
  XIAOSHU: { code: "XIAOSHU", koreanName: "소서", hanjaName: "小暑", solarLongitudeDegrees: 105 },
  DASHU: { code: "DASHU", koreanName: "대서", hanjaName: "大暑", solarLongitudeDegrees: 120 },
  LIQIU: { code: "LIQIU", koreanName: "입추", hanjaName: "立秋", solarLongitudeDegrees: 135 },
  CHUSHU: { code: "CHUSHU", koreanName: "처서", hanjaName: "處暑", solarLongitudeDegrees: 150 },
  BAILU: { code: "BAILU", koreanName: "백로", hanjaName: "白露", solarLongitudeDegrees: 165 },
  QIUFEN: { code: "QIUFEN", koreanName: "추분", hanjaName: "秋分", solarLongitudeDegrees: 180 },
  HANLU: { code: "HANLU", koreanName: "한로", hanjaName: "寒露", solarLongitudeDegrees: 195 },
  SHUANGJIANG: { code: "SHUANGJIANG", koreanName: "상강", hanjaName: "霜降", solarLongitudeDegrees: 210 },
  LIDONG: { code: "LIDONG", koreanName: "입동", hanjaName: "立冬", solarLongitudeDegrees: 225 },
  XIAOXUE: { code: "XIAOXUE", koreanName: "소설", hanjaName: "小雪", solarLongitudeDegrees: 240 },
  DAXUE: { code: "DAXUE", koreanName: "대설", hanjaName: "大雪", solarLongitudeDegrees: 255 },
  DONGZHI: { code: "DONGZHI", koreanName: "동지", hanjaName: "冬至", solarLongitudeDegrees: 270 },
};

export type SolarTermTimeBasis = "KST" | "UTC";
export type SolarTermSourcePrecision = "MINUTE" | "SECOND" | "MILLISECOND";

export interface SolarTermEvent {
  readonly term: SolarTermCode;
  readonly displayedDateTime: string;
  readonly timeBasis: SolarTermTimeBasis;
  readonly sourcePrecision: SolarTermSourcePrecision;
  readonly sourceIds: readonly string[];
}

export function solarTermDefinition(term: SolarTermCode): SolarTermDefinition {
  return SOLAR_TERM_DEFINITIONS[term];
}
