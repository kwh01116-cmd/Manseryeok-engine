# Korean civil-time rule registry

This registry separates legal/civil-time reconstruction from Myeongli policy. Civil-time rules here determine what instant a recorded Korean wall-clock time can represent; they do not decide true-solar-time usage, Zi-hour rollover, or any interpretation rule.

## KR_STANDARD_TIME_BASE_OFFSET_V1

- layer: astronomical / civil-time fact
- source genealogy: official Korean standard-time enactments -> KASI historical compilation -> independent implementation cross-checks
- precondition: Gregorian civil date on or after 1908-04-01 in the Korean legal-time jurisdiction
- exceptions: daylight-saving adjustment is not included
- boundary conditions:
  - before 1908-04-01: unresolved by this rule
  - 1912-01-01: +08:30 -> +09:00
  - 1954-03-21: +09:00 -> +08:30
  - 1961-08-10: +08:30 -> +09:00
- codeability: EXACT for base standard offset
- dispute status: no known Myeongli dispute; historical-source verification remains separate from interpretation
- policy required: no
- adversarial counterexample: 1958 summer must not be treated as a complete +08:30 civil offset because DST may add +60 minutes
- executable: yes, `resolveKoreanStandardTime`

## KR_DST_1987_1988_V1

- layer: civil-time fact
- source genealogy: Presidential Decree No. 12136 (1987-04-07) -> repeal by Presidential Decree No. 12703 (1989-05-08) -> KASI historical compilation
- precondition: recorded Korean civil wall-clock time in 1987 or 1988
- adjustment: +60 minutes while daylight-saving time is active
- exact legal transition rule:
  - second Sunday of May: 02:00 -> 03:00
  - second Sunday of October: 03:00 -> 02:00
- derived transitions:
  - 1987-05-10 02:00 -> 03:00; 1987-10-11 03:00 -> 02:00
  - 1988-05-08 02:00 -> 03:00; 1988-10-09 03:00 -> 02:00
- boundary conditions:
  - spring [02:00,03:00): nonexistent local time
  - autumn [02:00,03:00): ambiguous local time occurring twice
- codeability: EXACT
- dispute status: none for civil-time reconstruction
- policy required: no; an ambiguous autumn wall time does require caller-supplied disambiguation before conversion to one instant
- adversarial counterexample: never silently select one of the two 02:30 occurrences at fall-back
- executable: yes, `resolveKoreanDst1987To1988`

## KR_DST_1950_PRIMARY_TEXT

- layer: civil-time fact / historical legal text
- primary witness: National Law Information Center, `일광절약시간제정에관한건`, Presidential Decree No. 383 (1950-09-06), amending the existing rule
- directly attested text:
  - daylight-saving time is prescribed annually from April 1 midnight through September 10 midnight
  - at April 1 midnight clocks are advanced one hour
  - at September 10 midnight clocks are set back one hour
- source-history notes:
  - the law page preserves supplementary provisions for Presidential Decree No. 74 (1949-04-02), effective 1949-04-03
  - Presidential Decree No. 182 (1949-09-10) and No. 383 (1950-09-06) are preserved as amendments
- independent cross-checks:
  - multiple modern Korean Manseryeok implementations converge on a 1950-04-01 to 1950-09-10 date interval
  - current IANA tzdb independently encodes Korea's 1950 start as April 1 00:00 and the autumn rule as the first Saturday on/after September 7 at 24:00; in 1950 that is September 9 24:00 = September 10 00:00
- boundary interpretation: the primary law orders the clock operation at the named midnight, while IANA's independent transition encoding resolves the same 1950 end boundary as September 10 00:00. This is now strong enough to treat the 1950 interval boundary as exact for civil-time reconstruction.
- codeability: EXACT for the 1950 transition interval
- dispute status: no remaining material civil-time dispute found for the 1950 ISO boundary; provenance still records that IANA is a cross-check, not the legal authority
- policy required: no Myeongli policy
- adversarial counterexample: do not generalize the 1950 annual wording to 1951 or later without checking the later legal amendments and wartime history
- executable: not yet; held until the historical resolver can add the period without pretending the remaining 1948-1960 years are closed

## KR_DST_1948_1960_REMAINING

- layer: civil-time fact / historical legal research
- known active years from KASI historical compilation: 1948-1951 and 1955-1960
- codeability: CONDITIONAL / not executable as a complete table yet
- reason: each year's original decree/notice and exact local transition semantics must be closed before production conversion
- policy required: no
- adversarial counterexample: a year-only DST list cannot resolve a birth on a transition date
- executable: no

## Separation invariant

None of the rules above imply that Four Pillars must use local apparent solar time, local mean solar time, midnight day rollover, or Zi-beginning day rollover. Those are separate temporal/Myeongli policy questions and must never be smuggled into civil-time reconstruction.
