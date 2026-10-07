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

## Separation from Zi-hour policy
This cycle answers only which sexagenary day is attached to a Gregorian civil date. It does not choose rollover at 23:00, 00:00, apparent solar midnight, or another time basis. A later Four-Pillars resolver must apply an explicit versioned rollover/time-basis policy before selecting the civil date passed here.
