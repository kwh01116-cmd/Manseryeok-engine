# V0 local, read-only birth-chart web preview

Status: **DRAFT / NOT DEPLOYED / canonical repository tests and Chromium browser smoke PASS as of 2026-10-18**.


## Verified current gate — 2026-10-18, U1 EP0

- Canonical source head `c97c6a228bbfc83393a677f7cbb7ade29a676b82`; GitHub Actions [run 39090821483](https://github.com/kwh01116-cmd/Manseryeok-engine/actions/runs/39090821483), Ubuntu 24.04 / Node 22, **SUCCESS**, `npm run check` (TypeScript check, build, 179 tests passing, 0 failures/skips), followed by **real Chromium** `node scripts/browser-smoke.mjs` PASS.
- The browser test launches the actual loopback Node HTTP server and native Chromium (no mock API or jsdom). It verifies visible four pillars from Gregorian 2027-02-05, equivalent lunar 2026-12-29, the 2027-02-04 10:46 two-candidate Lichun edge, the accessible native `<details><summary>` evidence drawer via keyboard Enter, source IDs from actual engine DTO, out-of-coverage UI, edited-form result invalidation, widths 360px/390px without horizontal overflow, and reduced-motion media.
- `src/calendar/koreanBirthPreview.ts` now returns `solarTermSourceIds` sourced strictly from the validated calendar event records, including its previous-year Daxue guard. These are **source identifiers, not official KASA certification**. Existing lunar conversion provenance is preserved separately. `web/index.html` displays the source IDs, explicit day/hour policies and minute precision only after a successful calculation; changing the form invalidates stale candidates and pending responses are discarded.
- First browser-run [39090581721](https://github.com/kwh01116-cmd/Manseryeok-engine/actions/runs/39090581721) failed at Chrome DevTools Protocol keyboard Enter injection, while 179/179 Node tests still passed. A separate local real-Chromium CDP reproduction demonstrated that native summary activation requires the Enter `char` event in addition to rawKeyDown/keyUp. After fixing the **test harness**, a second full run passed. This is not evidence of a production keyboard regression.
- No screenshots/visual design approval, full accessibility audit, user data security gate, release authority certification, source license clearance, hosted deployment or consumer 2000 calendar expansion are claimed. The existing local-only server still binds `127.0.0.1` and should **not** be publicly exposed without separate privacy/security review.

## Purpose and run

After an exact checkout of `agent/foundation-20261006`:

```bash
npm ci
npm run check
npm run web
```

Open http://127.0.0.1:4173/ in a browser. The server binds only to loopback; `PORT=0 node scripts/chart-preview-web.mjs` can select an ephemeral test port. This preview is deliberately **not** a public production web service. The `npm run web` command builds the `dist/` directory and starts the loopback-only server. It also works in a normal Windows Node.js shell.

No new npm dependencies, public deployment, accounts, persistence or analytics are introduced. Birth inputs are handled in memory for the request only, without server-side logging or cache. Do not expose the local server to the Internet; the preview does not include authentication, abuse protection, or privacy/security certification.

## Flow and policy gates

`web/index.html` (mobile-friendly form) → `POST /api/preview` → existing CLI argument validator → `resolveKoreanBirthChartPreview()` → Korean Four Pillars and source/coverage labels.

Supported UI inputs: Gregorian or Korean lunar YYYY-MM-DD, lunar leap-month **boolean when lunar**, HH:MM Korean civil clock, and two **explicitly selected** disputed day/hour-stem policies. The example button actively fills a sample policy pair, but the form has no initial policy defaults. All dates outside the 2026–2027 full-year solar-term manifest fail closed.

The response displays four pillars in Hangul and Hanja, plus alternative correlated candidates at published-minute Lichun, policy IDs, `STRUCTURAL_COVERAGE_ONLY`, and `PUBLISHED_MINUTE_COMPARISON_ONLY`. No strength, pattern, useful-god, luck, scientific predictive-validity or official-certification claims.

## Evidence and tests

- Reused deterministic sources: `src/calendar/koreanBirthPreview.ts`, `koreanLunarBirthFourPillars.ts`, `solarTermCoverage.ts` and KASI-transcribed finite calendar fixture. Codeability: EXACT for UI input structure and API reuse; CONDITIONAL for underlying calendar minute data; INTERPRETIVE rules are absent.
- `test/chart-preview-web.test.mjs`: real local HTTP process, initial HTML, Gregorian/lunar 2027-02-05 vs lunar 2026-12-29 chart equivalence, 2027-02-04T10:46 two-candidate boundary, and malformed/unknown policies.
- New HTML inline script and server/test scripts passed Node.js v22.16.0 `node --check` in an isolated local workspace. A browser screenshot attempt was blocked by administrator network policy; no visual browser test pass is claimed.
- **Exact repository** `npm ci && npm run check` could not run: `git ls-remote` DNS resolution failed. New HTTP integration tests are committed but NOT VERIFIED. This is not authorization to merge the 98-commit draft PR.

## Remaining gates

1. Restore exact checkout; run `npm ci && npm run check` at current PR head; run actual local server, interact with desktop/mobile browser, and fix discovered problems.
2. Compare KASA official annual annexes with KASI-transcribed source minutes and assess material reuse rights; do not treat fixture digest or structural coverage as astronomical authority.
3. Only after all M1/V0 gates and PR review: consider merge. A local proof-of-concept screen does not require a merge to `main`.
## Static browser render after UI commit (2026-10-09)

Chromium/Playwright `page.set_content()` rendered the exported HTML at desktop (1240 px) and mobile (390 px) widths and verified that the example-fill button populates an explicit day-rollover policy. Static PNG previews produced. This is a **static UI smoke pass only**; the Node HTTP server / compiled engine were **not** browser-tested, and `npm run check` remains blocked by shell GitHub DNS. The prior browser file/http navigation failure is not a failure of this static `set_content` test.

## Out-of-coverage status (2026-10-09)

Valid Gregorian or lunar dates outside the declared 2026–2027 solar-term interval return OUT_OF_COVERAGE, not a generic malformed-input error. A dedicated typed exception distinguishes an unsupported query interval from a malformed manifest. Added Gregorian 2025-12-31/2028-01-01, lunar 2027-12-10, and invalid Gregorian 2027-02-30 regressions. This does not extend calendar coverage or verify official calendar minutes.
