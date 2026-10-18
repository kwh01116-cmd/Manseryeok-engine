# Lunar calendar ganji is not a Jie-based Myeongli pillar

Status: **RESEARCH / NON-EXECUTABLE**. Reviewed 2026-10-08. Scope: modern Korea, KST.

## Evidence and provenance
- KASI 2027 calendar-data page: https://astro.kasi.re.kr/kor/life/post/calendarData?search_year=2027 . It prints Lichun 2027-02-04 10:46 and lunar 2027-01-01 on Gregorian 2027-02-07. KASI explicitly says this is not an official announcement.
- KASA 2027 calendar announcement, published 2026-06-29: https://www.kasa.go.kr/prog/plcyBrf/brief/kor/sub01_01_04/view.do?plcyBrfNo=431 . It separately corroborates the February 7 lunar New Year; this does not validate the published-minute Lichun second.
- `월력요항 작성에 관한 규정` (reported KASA directive no. 66, effective 2026-02-02): secondary legal-text reproductions https://www.ulex.co.kr/법률/2100000274192-96035-월력요항작 and https://clauseit.net/search/admrul/2100000274192/ report lunar month/new-moon and ganji rules. **Official primary text and Annexes 1–3 were not retrieved.** Do not treat secondary text as official-golden evidence or retroactively apply the 2026 directive to 2025 publications.

## Adversarial boundary
At 2027-02-05 12:00 KST, the Lichun-policy Myeongli year pillar is 丁未 (Lichun already passed), but the lunar calendar year is still 2026 丙午 (lunar New Year is February 7). At published Lichun minute 2027-02-04 10:46, preserve `PUBLISHED_MINUTE_AMBIGUOUS` for Myeongli year/month rather than inventing the exact second. Lunar calendar year is unchanged that day.

**API contract:** `lunarCalendar.yearGanzhi/monthGanzhi` must not alias `fourPillars.year/month`; year/month rollover provenance differs. This is a deterministic distinction, not proof of predictive validity.

## Separate provisional day-cycle lead
Secondary copies report Annex 3 anchored at 1896-01-01 癸丑. Date-only arithmetic from 2000-01-07 甲子: 37,991 days backward, sexagenary index 49 = 癸丑. This is consistency only; verify official annex before upgrading provenance. It does not settle Zi-hour rollover.

## Codeability and next gates
- Calendar vs Myeongli type separation: **EXACT**, no new school default.
- Official lunar conversion and leap-month rules: **CONDITIONAL**, require original directive/annex, KASA year-specific edition, finite verified month table, leap flag and boundaries.
- Counterexample fixtures: 2027-02-04 10:45/10:46/10:47; 2027-02-05 12:00; 2027-02-06 to 2027-02-07. **Research vectors only** until executable tests run.
- Canonical `npm run check` still blocked by inability to clone; M1 #12 remains open.
