# G1-P1 external web-table comparison — KASI 2025–2027 (2026-10-20)

**Status: RESEARCH_EVIDENCE / WEB_TABLE_RECONCILED / ORIGINAL_SOURCE_FILE_UNVERIFIED / G1-P2 NO-GO.** This is not a runtime implementation, official certification or copyright clearance.

## Why this check matters

G1-P1 auditor's 49 solar + 37 lunar rows were pinned against repository fixtures, but the pre-existing audit did not compare each row against a separately surfaced provider table. The user's KASI API key cannot currently be used because Work/Codex cloud environment publishing failed. Public KASI year pages offer another **read-only comparison surface without credentials**.

## Inputs and exact scope

**Repository source snapshot:** `955a8e389d773005f149e807567c19f4a1b10435` on `agent/m1-applied-jie-slice1-20261019`; directly read `src/calendar/koreaSolarTermFixtures.ts` and `src/calendar/koreanLunisolarFixtures.ts`. The reported G1-P1 exact checkout Node 22 **292/292 PASS** and real Chromium PASS precede this comparison; **no new code tests were run here**.

**External comparison surfaces (public, observed as search-indexed extracted tables, not raw downloaded origin files):**

- [KASI 2025 annual calendar table](https://astro.kasi.re.kr/kor/life/post/calendarData?search_year=2025) — site displays V1.0a / 2024-05-07 14:23; 2025 lunar months including leap sixth and 2025 December DAXUE guard.
- [KASI 2026 annual calendar table](https://astro.kasi.re.kr/kor/life/post/calendarData?search_year=2026) — site displays V1.0a / 2024-07-25 16:57; 2026 lunar and all 24 term tables.
- [KASI 2027 annual calendar table](https://astro.kasi.re.kr/kor/life/post/calendarData?search_year=2027) — site displays V1.0a / 2026-06-30 12:33; 2027 lunar and all 24 term tables.

The public text search index exposed each annual table with its publication note. An attempt to reopen the pages in the text fetcher returned **cache miss**; **origin HTML bytes or downloadable TXT bytes were not captured or hashed**. They must not be described as authenticated original-file copies. KASI explicitly labels its calendar-data tables as *not official announcements* and refers to the relevant official 월력요항 separately.

## Method: independent table transcription to repository row comparison

A researcher **manually transcribed** the public indexed table facts (not by copying existing code fixtures) as `(termCode, GregorianDate, HH:mm)` for solar terms and `(lunarYear,lunarMonth,leapFlag,GregorianStart,monthLength)` for lunar rows. The entry lists were compared programmatically in memory against row values parsed directly from the two live GitHub source files. The transcript was **not committed in full** to avoid uncontrolled redistribution. Assertions were based on exact field equality, not fuzzy matching or date-only comparison.

| Table slice | Rows compared | Exact matches | Differences | Precision |
| --- | ---: | ---: | ---: | --- |
| 2025 prior DAXUE guard | 1 | 1 | 0 | KST displayed minute |
| 2026 24 terms | 24 | 24 | 0 | KST displayed minute |
| 2027 24 terms | 24 | 24 | 0 | KST displayed minute |
| 2025 lunar starts (including leap-6) | 13 | 13 | 0 | civil date + month size |
| 2026 lunar starts | 12 | 12 | 0 | civil date + month size |
| 2027 lunar starts | 12 | 12 | 0 | civil date + month size |
| **Total** | **86** | **86** | **0** | scoped as above |

Select traceable witnesses, not a full reproduced calendar:
- 2025-12-07 06:05 KST **대설**; 2026-02-04 05:02 KST **입춘**; 2027-02-04 10:46 KST **입춘**.
- Lunar leap month: lunar 2025 leap 6 begins **2025-07-25** with 29 days.
- Source-year trap: lunar 2025-12 begins **2026-01-19**, and lunar 2026-12 begins **2027-01-08**; check against **lunarYear**, never the Gregorian start year.
- Boundary: 2027's last solar term is 2027-12-22 11:42 KST **동지**; 2027 **대설** is 2027-12-07 17:38 KST.

## Evidence distinctions — DO NOT PROMOTE G1-P2

- **WEB_TABLE_RECONCILED_86_OF_86** means only that hand-transcribed public search-indexed KASI page tables and the GitHub records match. It is additional public-source evidence, but the transcription, retrieval channel, and provider page can still be mistaken, stale, or derived from a shared source. The original TXT/PDF **file SHA-256 remains 0/3 captured**, exactly as before.
- **ORIGINAL_ROW_VERIFIED remains 0/86 in the strict G1-P1 manifest.** Do not change the manifest's `UNVERIFIED_ORIGINAL_ROW`, set `originalDocumentSha256`, add a trusted-original guarantee, or announce an astronomical seconds-level result from this research alone.
- No KASI 15012690 authenticated API call, independent NASA/JPL calculation, new calendar year, production license or public release. Existing 2026/27 NAOJ minutes and KASA date-only witnesses have separate provenance. For commercial use, official KASA bulletin/KOGL terms and KASI website/API terms remain distinct sources and legal surfaces.
- This evidence **does not authorize G1-P2** wiring into `trustedKoreanPreview.ts`. That needs origin-file/page edition/row mapping of stronger provenance plus code reviews and exact checkout regression tests.

## Next smallest practical step

**G1-P1 E1** in a functioning Codex/work runtime *without an API key*: use only the exact three public KASI annual download controls to acquire the source TXT files through their **verified actual download URLs**, record HTTP status/content type/origin URL (without credentials), bytes, SHA-256, actual file-header edition, and a secure copy or documented location. Identify whether those files are the same published tables as the pages; compare 49 solar and 37 lunar rows, detect mismatches and line locations. Do **not** blindly trust text from URLs found via search; verify download origin and response type. If copyright/republication is ambiguous, retain hashes + minimal derived witness only in repo; keep original files private until rights review.

If original download is inaccessible, publish **UNAVAILABLE** with observed response/error and move to alternative independent astronomy evidence; never invent an origin SHA. Only after source evidence is reviewed should G1-P2 enter GO/NO-GO again.

**Source links:** [2025 page](https://astro.kasi.re.kr/kor/life/post/calendarData?search_year=2025), [2026 page](https://astro.kasi.re.kr/kor/life/post/calendarData?search_year=2026), [2027 page](https://astro.kasi.re.kr/kor/life/post/calendarData?search_year=2027), [prior source audit](G1_EVENT_MONTH_EDITION_EVIDENCE_AUDIT_20261020.md).
