# Korean lunisolar conversion: provisional golden-vector candidates (M1 #13)

Status: **RESEARCH CANDIDATES / NOT EXECUTABLE / NOT OFFICIAL-GOLDEN**.
Reviewed: 2026-10-08 (Asia/Seoul). Scope: modern Korean Gregorian civil dates and Korean lunisolar dates, not overseas calendars or a general astronomical algorithm.

## Source genealogy and authority

- Direct transcription surface: KASI 천문우주포털, 2025 달력자료 (data generation V1.0a, 2024-05-07 14:23), https://astro.kasi.re.kr/kor/life/post/calendarData?search_year=2025
- Direct transcription surface: KASI 2026 달력자료 (V1.0a, 2024-07-25 16:57), https://astro.kasi.re.kr/kor/life/post/calendarData?search_year=2026
- Direct transcription surface: KASI 2027 달력자료 (V1.0a, 2026-06-30 12:33), https://astro.kasi.re.kr/kor/life/post/calendarData?search_year=2027
- Registry ID: `KR-KASI-CALENDAR-DATA`, evidence layer `COMPUTATIONAL_REFERENCE`. These KASI pages explicitly say **not the official announcement**. `KR-KASA-WOLRYEOK-2025/2026/2027` edition-specific official notice or gazette must be compared before upgrading to OFFICIAL_GOLDEN. Do not assign a KASA transcription source to KASI-only values.
- KASI rows give lunar month-1 Gregorian dates and 大 (30 days) / 小 (29 days). Last-day vectors below are **derived**, not directly quoted; each next-month start is cross-checked against the adjacent published row.

## Month-start facts transcribed from KASI

| Gregorian first day | Lunar year | Lunar month | Leap? | Month length | Next Gregorian month start |
| --- | ---: | ---: | :---: | ---: | --- |
| 2025-06-25 | 2025 | 6 | no | 30 | 2025-07-25 |
| 2025-07-25 | 2025 | 6 | **yes** | 29 | 2025-08-23 |
| 2025-08-23 | 2025 | 7 | no | 30 | 2025-09-22 |
| 2026-01-19 | 2025 | 12 | no | 29 | 2026-02-17 |
| 2026-02-17 | 2026 | 1 | no | 30 | 2026-03-19 |
| 2027-01-08 | 2026 | 12 | no | 30 | 2027-02-07 |
| 2027-02-07 | 2027 | 1 | no | 29 | 2027-03-08 |

Important: `2026-01-19` belongs to lunar **2025** month 12, and `2027-01-08` belongs to lunar **2026** month 12. Never infer lunar year from the Gregorian year. Lunar new-year rollover is not the same as the Myeongli Lichun year-pillar rollover.

## Boundary candidates for future bidirectional executable fixtures

| Gregorian date | Expected Korean lunar date (year, month, day, isLeap) | Evidence |
| --- | --- | --- |
| 2025-06-25 | (2025, 6, 1, false) | directly transcribed month start |
| 2025-07-24 | (2025, 6, 30, false) | derived from 30-day month |
| 2025-07-25 | (2025, 6, 1, true) | directly transcribed leap-month start |
| 2025-08-22 | (2025, 6, 29, true) | derived from 29-day leap month |
| 2025-08-23 | (2025, 7, 1, false) | directly transcribed month start |
| 2026-02-16 | (2025, 12, 29, false) | derived from 29-day month |
| 2026-02-17 | (2026, 1, 1, false) | directly transcribed month start |
| 2027-02-06 | (2026, 12, 30, false) | derived from 30-day month |
| 2027-02-07 | (2027, 1, 1, false) | directly transcribed month start |

Adversarial negatives: `(2025, 6, 30, true)` is invalid; `(2025, 6, 1)` **without a leap flag** is ambiguous for reverse conversion; `(2026, 6, 1, true)` must not be accepted on the evidence of 2025's leap month. Roundtrip requires `(lunarYear, month, day, isLeap)`, not just month/day.

## Gate and codeability

- `EXACT` **within a verified finite month table**: date offset from a transcribed month start; month-length validation; explicit leap flag; forward/reverse roundtrip; adjacent-month continuity.
- `CONDITIONAL` outside table coverage: no extrapolation, no fabricated month length, and no implicit default for missing leap flag. Require a specified coverage range and a typed unsupported/ambiguous result.
- Dispute status: **not a Myeongli-school dispute**; source-verification gate still open. A calendar date-to-date mapping is not evidence for predictive validity of fortune interpretation.
- Source caution: KASI month starts and length are calendar-date facts, not instants of astronomical new moon; never invent a second-level lunar boundary.
- Official comparison and license/use review remain pending for a commercial app. Do not copy/rehost official documents or infer commercial redistribution rights from this table.

## Verification performed this run

Independent Python `datetime.date` arithmetic: 2025 regular June (30), leap June (29), 2025 lunar December (29), 2026 lunar December (30) each end exactly one day before the next transcribed month start: **4/4 PASS**. This is a consistency check, not independent astronomical or official-publication validation. No repository code, executable tests, or canonical `npm run check` were run successfully this run.

## Next actions

1. Recover an exact runnable checkout and execute `npm ci && npm run check` on the current PR, closing M1 #12 only if green.
2. Cross-check these KASI values against the specific KASA/official-gazette editions and record any differences/rights restrictions.
3. Add a small source-tagged fixture schema and bidirectional boundary tests before implementing a converter; do not extrapolate from a handful of examples.
