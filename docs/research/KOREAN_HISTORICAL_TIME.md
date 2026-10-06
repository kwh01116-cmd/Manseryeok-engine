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
