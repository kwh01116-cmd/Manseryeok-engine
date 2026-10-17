# M1 2000 Gregorian/Korean-lunar Four Pillars parity gate — 2026-10-18 KST

## New executable test, not a public birth-year feature

- `test/m1-2000-four-pillars-integration.test.mjs` drives the actual `resolveKoreanBirthChartPreview()` composition twice for each eligible historical input: one Gregorian birth date and its equivalent Korean lunar birth date derived through the existing `createKoreanLunisolarConverter()`.
- Sources remain injected from *research-only test fixtures*: NAOJ 1999 DAXUE + all 2000 published minute solar terms, and the separately tagged MIT-derived 1999/2000 lunar corpus. Neither enters the 2026–2027 consumer CLI/web server fixture or changes its supported-year manifest.
- Compares **all four Korean-labeled pillars** (`year`, `month`, `day`, `hour`), correlated boundary candidates, effective dates, policy labels, confidence, and source metadata. Does not compare the calendar-specific `input` shape, which intentionally differs.
- Fixed corpus covers 366 Gregorian civil days in 2000 at 12:00 under **three explicit** historical-myeongli policy profiles (1098 Gregorian/lunar chart pairs); the same code path separately compares exact boundary minute ±1 across **all twelve** 2000 Jie for all three policy profiles; and probes February 29 at 23:30 with Zi rollover/hour-stem differences.
- A February 5, 2000 noon fixed Four-Pillars witness is pinned as **庚辰 戊寅 癸巳 戊午** using the earlier Jan 7 day-cycle anchor and established Five-Tiger/Five-Rat rules. This is a traditional-rule arithmetic check, not a second independently published complete Four-Pillars golden record.
- The four one-minute NAOJ/KASI 2000 differences (XIAOHAN, JINGZHE, LIDONG, DAXUE) are tested **without normalizing away disagreement**: KASI's earlier published minute is ambiguous for that source and still definite under NAOJ's later minute; one minute later, the statuses reverse. These test-only hybrid inputs do not authorize release of KASI's archival table.
- Invalid leap-month input, absent solar-term coverage outside January–December 2000, and lunar dates that map outside the manifest remain fail-closed. Research-source provenance must remain visible and must not be mislabeled as Korean KASA official certification.

## Actual verification status (do not inflate)

- Node.js `22.16.0`: `node --check test/m1-2000-four-pillars-integration.test.mjs` **PASS**.
- Independent Gregorian leap-day/sexagenary anchor arithmetic using Python: Feb 4 (index 28, 壬辰), Feb 5 (29, 癸巳), Feb 29 (53, 丁巳), March 1 (54, 戊午) **PASS**.
- `node --test test/m1-2000-four-pillars-integration.test.mjs` in an otherwise empty local workspace **FAILED TO START**: `ERR_MODULE_NOT_FOUND` for `dist/calendar/koreanLunisolarConverter.js`. The full repository cannot currently be cloned in this shell because `github.com` DNS lookup fails. **The seven new runtime test cases have NOT been executed and have NO pass claim.** No changes to existing test expectations were made.
- GitHub API reads confirmed the test imports' actual source exports and guards at the current PR head. This is a code-review/compatibility check, not equivalent to `npm run check`.

## Required next gate

1. Obtain **exact** `agent/foundation-20261006` checkout, build with pinned TypeScript (`npm ci && npm run check`) in an environment with GitHub network access. No GitHub Actions or remote workflow is required. Fix actual failing assertions and rerun. Do not merge the 100+-commit PR on the strength of syntax-only checks.
2. Test a private/local real HTTP server on existing 2026–2027 fixture and, if justified, a separate test-only injected 2000 route (never an unaudited publicly served historical input path). Verify policy/source disclosure and invalid/out-of-coverage responses. Browser mobile visual QA is a later step.
3. Audit historical-data source licensing, Korean calendrical authority (NAOJ is an *independent Japanese* comparison), official API cross-checks, and exact seconds/rounding before changing production supported birth years. Keep disputed time policy selection explicit and fail closed.

## Sources and immutable scope

- NAOJ 1999 official almanac: https://eco.mtk.nao.ac.jp/koyomi/yoko/pdf/yoko1999.pdf
- NAOJ 2000 official almanac: https://eco.mtk.nao.ac.jp/koyomi/yoko/pdf/yoko2000.pdf
- KASI archived 2000 bulletin (use restrictions apply): https://www.kasi.re.kr/publication/post/newsMaterial/2008
- Independent MIT library: https://github.com/usingsky/korean_lunar_calendar_py
- Earlier fixture digests and source/version details: `docs/research/M1_HISTORICAL_2000_SOURCE_GATE.md` and `docs/research/SOURCE_REGISTRY.md`.
