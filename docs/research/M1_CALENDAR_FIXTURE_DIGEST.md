# M1 Korean KASI fixture SHA-256 content pins (v1)

Status: IMPLEMENTED AS TEST-ONLY GUARD ON DRAFT PR; EXACT-REPOSITORY CHECK PENDING. 2026-10-09 KST.

## Purpose, provenance and boundary

The existing `FULL_24_TERM_YEAR` validator checks order, names, coverage and provenance presence, but does **not** detect an internally plausible changed published minute or a changed source-edition string. The Korean lunar converter likewise validates continuity, not publication identity. This slice adds reproducible **content fingerprints in tests**, not a new astronomical calculation, a browser runtime check, or an official-KASA golden claim.

- Solar: 49 ordered records: 2025 DAXUE left guard and 24 terms each for 2026/2027; data from KASI calendar-data pages (2026 generation V1.0a/2024-07-25, 2027 generation V1.0a/2026-06-30). Pinned SHA-256: `15363d490a4d86cf37dd826fcff7aa5425d630276c4d9a79a23a405a94b066c4`.
- Lunar: 37 ordered month starts for complete 2025/2026/2027 lunar years, explicit leap flag and 29/30-day sizes, source editions and half-open Gregorian coverage `[2025-01-29, 2028-01-27)`. Pinned SHA-256: `d0dc8222af3afa19ee354e9e59b2251b40e0a1083fd9c8377cc0d5b8ce7c80ef`.
- Primary source pages: https://astro.kasi.re.kr/kor/life/post/calendarData?search_year=2025 ; https://astro.kasi.re.kr/kor/life/post/calendarData?search_year=2026 ; https://astro.kasi.re.kr/kor/life/post/calendarData?search_year=2027 . The 2027 page was directly rechecked on 2026-10-09 for 2027-02-04 10:46 LICHUN and 2027-02-07 lunar New Year. This is a narrow spot-check, not a full independent edition comparison.
- KASI explicitly states these computational calendar-data pages are **not official announcements**. KASA annual Wolryeok-yo-hang annexes/official gazette and commercial rights remain UNVERIFIED; SHA-256 does not elevate authority.

## Canonicalization contract

`scripts/calendar-fixture-digest.mjs` uses Node's built-in `node:crypto` SHA-256 of UTF-8 `JSON.stringify(payload)`, without whitespace or custom replacer. Object keys are constructed in the following exact order (do not sort the events or month records):

1. Solar payload keys `schemaVersion`, `events`. Schema value `m1-kasi-solar-term-corpus-v1`. Each event is a tuple `[term,displayedDateTime,timeBasis,sourcePrecision,sourceIds[]]`, preserving event and source-ID order.
2. Lunar payload keys `schemaVersion`, `corpusId`, `sourceId`, `authorityLevel`, `supportedGregorianFromInclusive`, `supportedGregorianUntilExclusive`, `sourceEditions`, `months`. Editions are numeric-year ascending tuples `[year,edition]`; each month tuple is `[lunarYear,lunarMonth,isLeapMonth,gregorianStart,days]` in corpus order.

Digest fixtures were computed from the current GitHub source tables and independently checked with Node's `node:crypto` on an isolated reconstruction. No runtime crypto dependency was added to the TypeScript/browser engine. The repository's existing `npm test` wildcard will execute the new digest regression file after build.

## Codeability and adversarial checks

- Classification: EXACT deterministic serialization/hash comparison, CONDITIONAL source authenticity and published-minute semantics; no INTERPRETIVE/classical rule or disputed school policy.
- Preconditions: exact KASI corpus version and source metadata, Node >=22 for tests; no silent re-pin on a source change.
- Exceptions: deliberate source edition update requires review, source provenance and a new intentional pin; hashes detect any change but do not determine whether a new value is correct.
- Boundaries: 2025 DAXUE guard, terminal 2027 DONGZHI, 2025 leap-6 and terminal lunar 2027-12. No inference beyond declared supported interval.
- Counterexamples: a one-minute Dahan change or source ID change passes some structural checks but must change solar digest; a month-size or edition change must change lunar digest. Existing structural coverage and converter validation remain required.
- Verification: local Node v22.16.0 syntax checks PASS; 3/3 digest tests PASS against an **isolated, manually reconstructed** 49/37-event fixture from the inspected GitHub source, not the exact checkout. Helper invariants PASS. Exact `npm ci && npm run check` NOT RUN: shell `git ls-remote` fails GitHub DNS. The newly committed regression test is NOT repository-verified. Keep PR draft/unmerged.

## Next gate

Recover exact checkout and run `npm ci && npm run check`, investigate any pinned-hash mismatch instead of editing expected hashes to green, then compare official KASA edition annexes. The M1 and V0 gates remain OPEN.
