# M1 #12: independent published-minute differential and precision gate

Status (2026-10-08): targeted reconstructed-source test 1/1 PASS, 48/48 published-minute comparisons match; exact repository npm run check NOT RUN. Gate remains OPEN.

## Evidence genealogy
- KR-KASI-CALENDAR-DATA: Korean Astronomy and Space Science Institute 2026 and 2027 calendar-data pages. These are explicitly not the official annual KASA notices:
  - https://astro.kasi.re.kr/kor/life/post/calendarData?search_year=2026
  - https://astro.kasi.re.kr/kor/life/post/calendarData?search_year=2027
- JP-NAOJ-REKIYOU-2026: National Astronomical Observatory of Japan, 2026 Reki Yoko solar terms, released 2025-02-03: https://eco.mtk.nao.ac.jp/koyomi/yoko/2026/rekiyou262.html
- JP-NAOJ-REKIYOU-2027: National Astronomical Observatory of Japan, 2027 Reki Yoko solar terms, released 2026-02-02: https://eco.mtk.nao.ac.jp/koyomi/yoko/2027/rekiyou272.html
- NAOJ Central Standard Time and modern KST both use UTC+09:00 for these years. NAOJ is an independent *publisher*, not Korean legal calendar authority. Common numerical methods have not been ruled out.

## Verified scope and test
The new test independently transcribes 24 term names/date-hour-minute values for each year (48 records) from NAOJ and compares them against the existing Korean KASI-transcribed fixture. All 48 matched in a targeted reconstructed-source test. The 2025 DAXUE continuity guard is outside the NAOJ comparison. Node 22.16.0 and TypeScript 5.8.3 strict compilation of three reconstructed relevant source modules passed; node --test on the new test passed 1/1. The exact repository was not checked out because shell git ls-remote failed DNS; npm ci and npm run check were NOT RUN. Do not mark canonical verification green or merge.

Classification: EXACT for finite published-minute comparison; CONDITIONAL for any inferred actual second. Preconditions: accurate source transcription, UTC+09:00 for both sources, published minute granularity. Dispute: NONE for printed minute equality; UNVERIFIED for minute rounding/truncation, true event instant and birth-record semantics.

## Adversarial counterexample: published minute != known second
Both publishers print 2027 LICHUN as 2027-02-04 10:46. Neither inspected table establishes the minute formatting rule. Illustrative models, **not asserted publisher policies**:
- FLOOR_MINUTE: actual crossing in [10:46:00, 10:47:00).
- NEAREST_MINUTE: actual crossing in [10:45:30, 10:46:30).
If birth 10:45 denotes a minute-resolution interval [10:45:00, 10:46:00), a 10:45:40 crossing is consistent with NEAREST_MINUTE, yielding both pre- and post-boundary possibilities. Under either hypothetical model, 10:44 is before, 10:46 can be ambiguous, and 10:47 is after. The existing 10:45 => DEFINITE behavior is definite only under the *published-minute comparison convention*, not yet proved astronomically definite. This does not justify a universal one-minute buffer.

Keep (1) boundary publication precision, (2) source rounding/uncertainty interval, and (3) birth-record precision distinct. No arbitrary default, no forced single chart at uncertain boundaries. The existing correlated LICHUN year/month candidates must not become a Cartesian product.

## Next
1. Exact checkout + npm ci && npm run check; retain draft PR until green.
2. Research authoritative rounding conventions or a reproducible second-level ephemeris with an explicit error budget.
3. Preserve birth-time and solar-term uncertainty in future integrated Four-Pillars API.
