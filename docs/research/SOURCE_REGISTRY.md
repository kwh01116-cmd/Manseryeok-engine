# Source registry

## KR-KASA-WOLRYEOK-2026
Issuer: Korea AeroSpace Administration.
Publication: 2026년 월력요항.
Published: 2025-06-30.
Notice: 우주항공청공고 제2025-0044호.
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
Known edition metadata: the 2025 page reports data generation V1.0a at 2024-05-07 14:23; the 2027 page reports V1.0a at 2026-06-30 12:33.
2025 guard fact: the 2025 table displays DAXUE at 2025-12-07 06:05 (minute precision). The page explicitly states that it is not an official announcement, so this guard may carry KR-KASI-CALENDAR-DATA but must not inherit KR-KASA-WOLRYEOK authority until the edition-specific official source is pinned.
Time-basis note: KASI's 월력요항 explanatory surface labels the 24-solar-term date/time column as 한국표준시. A fixture must still record its own time basis explicitly rather than inheriting it silently.


## DAY-CYCLE-CROSSCHECK-2000-01-07
Evidence class: INDEPENDENT_CALENDAR_CROSSCHECK.
Retrieved: 2026-10-07.
Observed fact: Gregorian 2000-01-07 is reported as 甲子日 by multiple independent Korean, Japanese, and Chinese calendar surfaces.
Use: anchor/cross-check evidence for the date-only 60-day arithmetic cycle.
Caution: these are not Korean official calendar authorities and do not establish Myeongli rollover policy.

## DAY-CYCLE-CROSSCHECK-2025-12-07
Evidence class: INDEPENDENT_CALENDAR_CROSSCHECK.
Retrieved: 2026-10-07.
Observed fact: Gregorian 2025-12-07 is reported as 庚戌日 by independent calendar records.
Use: distant arithmetic check. The dates are 9466 civil days apart; 9466 mod 60 = 46, and cycle index 46 is 庚戌.
Caution: this validates cycle arithmetic, not 子時換日.

## DAY-CYCLE-KASI-2025-LEAP-SIXTH
Evidence class: KOREAN_COMPUTATIONAL_CALENDAR_CROSSCHECK (not official KASA edition).
Retrieved: 2026-10-08.
Direct source: https://astro.kasi.re.kr/kor/life/post/calendarData?search_year=2025
Observed 日辰 on Gregorian lunar-month starts: 2025-06-25 乙丑, 2025-07-25 乙未 (leap sixth), 2025-08-23 甲子.
Use: independently printed date-only day-cycle golden vectors across a leap lunar month; these day pillars are **not** computed by the engine.
Caution: same KASI table also supplies the lunar month-start candidates, so this is not an independent lunar-conversion verification. Page explicitly disclaims official announcement status. Neither source settles Zi rollover.

## Registry rule
Store normalized facts with source ID, edition/publication, retrieval date, time basis and source precision. Distinguish (1) official publication authority from (2) the exact surface used to transcribe a value. Source files are not required in-repository for a fact to be traceable.


## CLASSICAL-YUANHAIZIPING-RISHANGQISHI
Work: 增補淵海子平音義評註 / 淵海子平 tradition, 卷一, 論日上起時例.
Evidence class: DIRECT_PRIMARY_SCAN.
Retrieved: 2026-10-07.
Directly inspected scan evidence: the page headed 論日上起時例 prints the Five-Rat sequence beginning 甲己還加甲、乙庚丙作初、丙辛從戊起、丁壬庚子居、戊癸何方發. Independent digitized scans/editions expose the same section heading and sequence.
Use: primary-text provenance for the deterministic mapping from an explicitly supplied day stem and hour branch to the hour stem.
Caution: this passage supports 日上起時/Five-Rat mapping. It does not by itself settle whether the civil day changes at 23:00 or 00:00, nor which day stem a late-子 policy must supply.

## JP-NAOJ-REKIYOU-2026 / JP-NAOJ-REKIYOU-2027
Issuer: National Astronomical Observatory of Japan, Calendar and Ephemeris Computation Office.
Publications: 2026 Reki Yoko (released 2025-02-03), 2027 Reki Yoko (released 2026-02-02).
Evidence class: INDEPENDENT_PUBLISHED_SOLAR_TERM_DIFFERENTIAL; not Korean official calendar authority.
Sources: https://eco.mtk.nao.ac.jp/koyomi/yoko/2026/rekiyou262.html and https://eco.mtk.nao.ac.jp/koyomi/yoko/2027/rekiyou272.html
Retrieved: 2026-10-08.
Use: 48 published-minute term/date-time crosschecks. NAOJ Japan Central Standard Time and modern KST are UTC+09:00 for these dates; 48/48 match KASI transcriptions. See test/naoj-solar-term-differential.test.mjs.
Caution: two institutions may share computational methods; rounding rule and second-level instant are unverified. Not a substitute for KASA annex verification.

## KASA-PUBLICATION-RIGHTS-2027 (commercial-product reuse review)
Evidence layer: PUBLICATION_RIGHTS_METADATA (not an astronomical fact, source authority, or legal opinion).
Direct issuer page: https://www.kasa.go.kr/bbs/BBSMSTR_000000000018/B000000003234Li6nD2.do?mno=sub01_03_03
Checked: 2026-10-09. KASA's 2027 월력요항 official notice (2026-06-29, notice 2026-0078) explicitly labels the notice/attached work **공공누리 2유형: 출처표시 + 상업적 이용금지**. The KASA 2026 announcement page also displays the same type-2 label: https://www.kasa.go.kr/prog/bbsArticle/BBSMSTR_000000000010/view.do?bbsId=BBSMSTR_000000000010&nttId=B000000001860Pe2zT3 ; this is a press page, **not** proof of the exact 2026 official annex's licensing metadata.
Practical boundary: do not copy, embed, or redistribute the KASA 2027 PDF/HWPX or protected presentation/table wholesale in a commercial app on the assumption that official publication implies commercial reuse permission. Conversely, this label alone does **not** establish that isolated calendar facts, independently calculated astronomical results, or independently compiled factual records are copyright-restricted. Seek source-specific legal/licensing review (including KASI data terms) before production reuse. Source attribution and a citation are not a license grant. No commercial-rights clearance is asserted.

## 2026-10-09 direct-transcription source attribution audit
- Scope: all 48 annual solar-term minute values (2026/2027) and the 2025 DAXUE guard were copied from the KASI calendar-data surface. Previously, 2026/2027 `SolarTermEvent.sourceIds` included both `KR-KASA-WOLRYEOK-20xx` and `KR-KASI-CALENDAR-DATA`, despite no direct comparison of the official KASA annex. This conflated a publication authority with the actual transcription source.
- Correction: `sourceIds` in the current 49-event fixture now records only `KR-KASI-CALENDAR-DATA`. Exported `KASA_AUTHORITY_SOURCE_IDS` constants remain as authority *references*, not as assertions of direct annex transcription. No minute value, time basis, precision or pillar algorithm was altered. This is a source-metadata compatibility change.
- Direct source: KASI 2027 data https://astro.kasi.re.kr/kor/life/post/calendarData?search_year=2027 explicitly says '이 자료는 공식 발표 자료가 아닙니다'. KASA's 2027 notice https://www.kasa.go.kr/bbs/BBSMSTR_000000000018/B000000003234Li6nD2.do?mno=sub01_03_03 (2026-06-29) attaches the official PDF/HWPX. Subsequent direct Gazette verification (below) established date-only official tables; no official term-minute table was found in these editions. NAOJ 48/48 minute agreement remains independent comparison, not official minute certification.
- Preconditions: record directly consulted source surfaces, editions and precision separately from legal authority and usage rights. Boundary/adversarial case: an unchanged minute with an unverified KASA source ID must fail the fixture provenance regression. Codeability EXACT for metadata provenance, CONDITIONAL for later official-golden certification; no school dispute. Published-minute rounding and KASA commercial rights remain unresolved.
- Checks: isolated synthetic Node 22.16.0 provenance-shape assertion 49/49 PASS (not compiled repository source); exact checkout blocked by github.com DNS, canonical `npm run check` NOT RUN. Do not mark verified or merge.

## KASA-GAZETTE-SOLAR-TERM-DATES-2026-2027 (direct edition verification)
Checked: 2026-10-11. Rule layer: OFFICIAL_KOREAN_CALENDAR_DATE_CROSSCHECK, codeability EXACT for printed Gregorian dates only; no Myeongli policy.
Direct source: edition-specific Gazette PDFs linked by the KASI official publication index, https://astro.kasi.re.kr/kor/life/post/almanac?search_year=2026 and https://astro.kasi.re.kr/kor/life/post/almanac?search_year=2027 . Each PDF page 1 identifies the notice/date; page 2 contains the 24절기 table. Download through the viewer's public POST `/user/common/ofcttCntntDownload.do` with `cntnt_seq_no`; exact viewer URLs, form IDs and original SHA-256 hashes are pinned in `test/fixtures/kasa-solar-term-dates-2026-2027.json`.

| Calendar year | Notice | Published | Original PDF SHA-256 |
| --- | --- | --- | --- |
| 2026 | 2025-0044 | 2025-06-30 | `6b42224a6a993e846426a20a841dbe3e5e1bc7436142786b969fcc0df4852aff` |
| 2027 | 2026-0078 | 2026-06-29 | `10412c8632ab2e8e9937cbd3a8fa6ee184e08cbd9aa541dd4d44229cb11a67b3` |

Method: verify PDF magic/header; extract with `pdftotext -layout`; isolate page-2 24절기 section; extract the two name/month/day columns and map Korean names to term codes; visually inspect both rendered pages. Golden values were extracted from those PDFs without reading production values. All 48 official dates agree with the date projection of the existing KASI minute events. Midnight-adjacent 2027 SHUANGJIANG (Oct 24) and LIDONG (Nov 8) are included.
Precision finding: both official tables have **month/day only**, without hour/minute columns. Fixture precision is DAY; no time, rounding rule or uncertainty interval is invented. Direct official date evidence is now verified; official minute certification cannot be obtained from these editions. Existing KASI/NAOJ minute evidence remains separate, and second-level instant/rounding verification remains OPEN. Production minute `sourceIds` stay KASI-only; 2025 DAXUE is outside this official comparison.
Reproduction: obtain the exact two PDFs via the pinned viewer/form metadata, check SHA-256, render page 2 and compare extracted dates. Repository checks use the fixed normalized JSON offline and do not fetch changing remote pages. Original PDFs/layout are not committed; the normalized fixture contains only isolated term/date facts and provenance. Source-use rights review remains OPEN, as documented above.
Next smallest evidence task: pin the original KASI/NAOJ minute-table editions and their explicit rounding/precision statements; preserve ambiguity wherever a sub-minute instant is not independently known. Do not keep an impossible “official annex minute match” gate for these date-only tables, expand supported years, or make disputed policy defaults in this slice.
