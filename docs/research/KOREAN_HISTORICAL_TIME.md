# Korean historical standard time

Rule: KR_STANDARD_TIME_BASE_OFFSET_V1

Verified KASI chronology for the base legal standard-time offset:
- 1908-04-01 through 1911-12-31: 127.5 degrees east, UTC+08:30.
- 1912-01-01 through 1954-03-20: 135 degrees east, UTC+09:00.
- 1954-03-21 through 1961-08-09: 127.5 degrees east, UTC+08:30.
- 1961-08-10 onward: 135 degrees east, UTC+09:00.

Codeability: EXACT for the base standard offset.
Policy required: no for the base offset.
Boundary condition: dates before 1908-04-01 remain unresolved.

DST is deliberately excluded. KASI identifies DST years, but exact start/end dates and transition instants must be verified before executable DST logic is added. Therefore the standard-time resolver is not a complete civil-to-UTC resolver.

Adversarial case: a 1958 summer date has base offset UTC+08:30, but its final civil UTC offset must remain unresolved until the DST transition table is verified.


## Daylight-saving time evidence

Rule: KR_DST_1987_1988_V1

The 1987-1988 transitions are executable because the legal rule is directly attested in Presidential Decree No. 12136 (1987-04-07): on the second Sunday of May, 02:00 becomes 03:00; on the second Sunday of October, 03:00 becomes 02:00. The regulation was repealed by Presidential Decree No. 12703 on 1989-05-08.

Derived exact transitions:
- 1987-05-10 02:00 standard -> 03:00 daylight; 1987-10-11 03:00 daylight -> 02:00 standard.
- 1988-05-08 02:00 standard -> 03:00 daylight; 1988-10-09 03:00 daylight -> 02:00 standard.

Codeability: EXACT for 1987-1988.
Policy required: no for civil-time reconstruction.
Boundary conditions: spring-forward local times 02:00:00-02:59:59 do not exist; fall-back local times 02:00:00-02:59:59 occur twice and require disambiguation before conversion to an instant.

KASI's historical daylight-saving table also records the earlier 1948-1951 and 1955-1960 periods. Those periods remain quarantined from executable code for now. Secondary implementations disagree on several end-date labels, and midnight wording can represent either the last instant of the named date or 00:00 of the following date. The original decree/notice for each transition must be checked before those boundaries become code.

Source genealogy:
- civil-time fact: Presidential Decree No. 12136 -> National Law Information Center.
- repeal: Presidential Decree No. 12703 -> National Law Information Center.
- independent historical compilation: KASI, historical daylight-saving-time table.
- modern Manseryeok implementations: comparison evidence only, not authority.
