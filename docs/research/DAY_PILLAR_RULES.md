# Day-pillar cycle rules

## DAY_PILLAR_GREGORIAN_DATE_CYCLE_V1
- layer: calendrical cycle / modern implementation fact
- source genealogy: independent Korean, Japanese, and Chinese calendar surfaces agree that Gregorian 2000-01-07 is 甲子日; a distant independent check reports 2025-12-07 as 庚戌日
- precondition: valid Gregorian civil date from 1583 through 9999
- effect: advance one sexagenary index per Gregorian civil date from 2000-01-07 = 甲子
- exceptions: none inside this date-only layer
- boundary conditions: no time-of-day rollover semantics
- codeability: EXACT
- dispute status: STABLE for arithmetic; modern cross-check evidence is not classical textual provenance
- policy required: no for date-only lookup
- test vectors: 2000-01-06=癸亥, 2000-01-07=甲子, 2000-01-08=乙丑, 2000-03-07=甲子, 2025-12-07=庚戌
- adversarial counterexample: a 23:30 birth must not be assigned a civil date by this rule; 子時換日 is a separate policy layer
- executable: yes, `dayPillarForGregorianDate`

## DAY_PILLAR_KASI_2025_LEAP_MONTH_ANCHORS
- layer: Korean computational-calendar day-cycle cross-check (not a school policy)
- source genealogy: KASI 2025 달력자료, 음력(2025, 을사년) table, Gregorian month-start and 日辰 columns; page generation V1.0a 2024-05-07 14:23. Direct table: https://astro.kasi.re.kr/kor/life/post/calendarData?search_year=2025
- precondition: Korean Gregorian **date-only** interpretation; compare dates, not birth-time instants
- expected independent vectors: 2025-06-25=乙丑 (ordinary lunar 6/1), 2025-07-25=乙未 (leap lunar 6/1), 2025-08-23=甲子 (lunar 7/1)
- arithmetic adversarial check: differences from 2000-01-07=甲子 are 9301, 9331, 9360 days, respectively; modulo 60 = 1, 31, 0. Leap-month entry must not reset the **daily** sexagenary cycle.
- codeability: EXACT for date-only cycle; no additional policy
- dispute status: stable arithmetic, KASI calendar-data **computational reference only**, not KASA official-edition transcription
- executable: regression in `test/day-pillar.test.mjs`; source-independent expectation but not an independent implementation
- limitation: a matching result does not validate lunar converter, source edition, 子時換日, or fortune prediction

## Separation from Zi-hour policy
This cycle answers only which sexagenary day is attached to a Gregorian civil date. It does not choose rollover at 23:00, 00:00, apparent solar midnight, or another time basis. A later Four-Pillars resolver must apply an explicit versioned rollover/time-basis policy before selecting the civil date passed here.
