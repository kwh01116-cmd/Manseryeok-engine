# Four-Pillars time-policy research gate

## Purpose
Time-of-day handling is not one boolean. Keep three independent decisions separate before composing the date-only day pillar with an hour pillar.

## TIME_BASIS
- KOREAN_CIVIL_TIME: reconstructed legal Korean wall time after historical standard-time/DST resolution.
- LOCAL_MEAN_SOLAR_TIME: longitude-based mean solar time; requires birthplace longitude and an explicit conversion method.
- LOCAL_APPARENT_SOLAR_TIME: apparent solar time; additionally requires a documented equation-of-time model.
- status: CONDITIONAL / policy required.
- prohibition: do not use one trueSolarTime boolean to conflate mean and apparent solar time.

## DAY_ROLLOVER
- CIVIL_MIDNIGHT: date-only day pillar changes at 00:00 on the selected time basis.
- ZI_START: day-pillar date advances at the start of 子時, commonly mapped to 23:00 in modern two-hour clock tables.
- status: DISPUTED in modern practice; no engine default.
- adversarial vector: the same effective 23:30 must support different day pillars when comparing these policies.

## LATE_ZI_HOUR_STEM_REFERENCE
For 23:00–23:59, hour branch can be 子 while implementations may differ over which day stem seeds the hour stem under a split/late-Zi convention.
- SELECTED_DAY_PILLAR: derive hour stem from the day pillar selected by DAY_ROLLOVER.
- CIVIL_DATE_DAY_PILLAR: derive it from the unadvanced civil-date day pillar.
- status: DISPUTED / no default.
- prohibition: Five-Rat lookup must not silently choose this reference.

## Stable next boundary
Once a day stem and hour branch are explicitly supplied, Five-Rat lookup can be modeled as a deterministic table. Keep that pure lookup separate from effective-time conversion, day-date selection, and late-Zi day-stem reference.

## Evidence state
Modern Korean/Chinese implementation surfaces independently confirm that 23:00-vs-00:00 rollover conventions coexist. They demonstrate present-day disagreement, not authority for a default. Secondary material reproduces the Five-Rat mnemonic beginning 甲己還加甲 / 乙庚丙作初, but primary-text genealogy is not yet pinned strongly enough for a canonical classical-source claim.

Claims that early Zi-ping texts uniformly mandate one rollover convention remain UNVERIFIED until directly inspected primary editions/passages are pinned.

## Safe test vectors
- 22:59: rollover policies agree on civil-date day pillar.
- 23:00 and 23:30: CIVIL_MIDNIGHT vs ZI_START may diverge by one sexagenary day.
- 00:00 and 00:30: both rollover policies agree on the new civil date.
- Changing TIME_BASIS may move an instant across a 子 boundary; test independently from DAY_ROLLOVER.
- Five-Rat table tests should cover all ten day stems and all twelve hour branches only after provenance is pinned.
