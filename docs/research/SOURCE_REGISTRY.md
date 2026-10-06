# Source registry

## KR-KASA-WOLRYEOK-2026
Issuer: Korea AeroSpace Administration.
Publication: 2026년 월력요항.
Published: 2025-06-30.
Evidence class: OFFICIAL_KOREAN_CALENDAR.
Use: official-authority anchor for normalized 2026 calendar facts. KASA describes the annual 월력요항 as the Korean calendar-production standard published under the Astronomy Act.

## KR-KASA-WOLRYEOK-2027
Issuer: Korea AeroSpace Administration.
Publication: 2027년 월력요항.
Published: 2026-06-29.
Notice: 우주항공청 공고 제2026-0078호.
Legal basis: 천문법 제2조 및 천문법 시행령 제3조.
Evidence class: OFFICIAL_KOREAN_CALENDAR.
Use: official-authority anchor for normalized 2027 calendar facts.

## KR-KASI-WOLRYEOK-INDEX
Issuer: Korea Astronomy and Space Science Institute.
Evidence class: OFFICIAL_REFERENCE_INDEX.
KASI states that official 월력요항 was announced by KASI through 2019, the Ministry of Science and ICT from 2020, and KASA from 2024 through the Official Gazette.
Use: source-genealogy and publication-history anchor, not a substitute for an edition-specific notice.

## KR-KASI-CALENDAR-DATA
Issuer: Korea Astronomy and Space Science Institute.
Evidence class: COMPUTATIONAL_REFERENCE.
Use: direct transcription/cross-check source for year-specific calendar values such as the displayed 24-solar-term date/hour/minute table.
Caution: the calendar-data surface explicitly distinguishes itself from the official 월력요항 even when the corresponding annual official notice already exists. Do not infer authority from issuer alone, and do not describe values transcribed from this surface as directly transcribed from KASA.
Known edition metadata: the 2027 page reports data generation V1.0a at 2026-06-30 12:33.
Time-basis note: KASI's 월력요항 explanatory surface labels the 24-solar-term date/time column as 한국표준시. A fixture must still record its own time basis explicitly rather than inheriting it silently.

## Registry rule
Store normalized facts with source ID, edition/publication, retrieval date, time basis and source precision. Distinguish (1) official publication authority from (2) the exact surface used to transcribe a value. Source files are not required in-repository for a fact to be traceable.
