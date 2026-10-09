# V0 local, read-only birth-chart web preview

Status: **DRAFT / NOT DEPLOYED / canonical repository tests still pending**.

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
