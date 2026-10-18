# U1 EP2 — Jie-based month-branch explanation, factual chapter

Date: 2026-10-18. Status: **canonical GitHub Actions GREEN** for code commit `891967bfd2883e4aed8296a27b96d9be8a94ee11`: [run 39112191402](https://github.com/kwh01116-cmd/Manseryeok-engine/actions/runs/39112191402), 227/227 Node tests PASS, 0 failed/skipped, TypeScript build PASS and real Chromium local-browser EP0+EP1+EP2 PASS.

## Scope

- The existing local-only `POST /api/preview` already returns a single M1 Four-Pillars computation and additive `projectKoreanV0Story` (U0) facts. U0 includes `MONTH_BRANCH_CLASSIFICATION` with exact source reference `preview.candidates[i].month.branch`, already resolved branch and its traditionally classified principal element.
- `web/index.html` now renders candidate-specific `02 · 월지는 어떻게 정해질까요?` factual chapters following U1 EP1 day-master. Each shows the **already computed** month branch and principal-element label; no browser-side calendar or stem/branch calculation.
- Explanation: month pillars follow the transitions at the 12 節 (Jie) rather than lunar new-moon month starts. When `confidence === PUBLISHED_MINUTE_AMBIGUOUS`, each of the two correlated M1 candidates has its **own** month chapter and `preview.candidates[0|1].month.branch` factRef. Published-minute uncertainty is disclosed, not resolved by guessing an astronomical second.
- The browser fails the entire user-facing story view closed if the month beat is missing, has the wrong candidate reference/branch, or contains an unsupported principal-element enum; it does not quietly synthesize month facts. Existing U0 day-master, provenance drawer, stale-input invalidation and 2026–2027 supported-year limits remain unchanged.
- The traditional principal-element label is not a claim about season strength, operative 五行 dominance, personality, causality, luck or independent astronomical/official-KASA certification.

## Verification

- `test/chart-preview-web.test.mjs` now expects EP2 chapter markup and checks 2027-02-05 solar vs equivalent lunar 2026-12-29 month story parity and the two separate 2027-02-04 10:46 published-minute candidate references.
- `scripts/browser-smoke.mjs` runs actual Node loopback HTTP and Chromium. It checks the EP2 month glyph matches each candidate's month-pillar branch, factual explanation text and provenance reference, Gregorian/lunar parity, two distinct Lichun candidates and no stale chapter for rejected dates, all alongside U1 EP0+EP1 and 360/390px checks.
- Canonical verification must use exact commit `891967bfd2883e4aed8296a27b96d9be8a94ee11`, GitHub Actions run `39112191402`. The exact run finished successfully; this verifies software behavior, not official historical calendar accuracy or release readiness.

## Next gate

Separate from this chapter, a richer per-candidate **exact Jie event timestamp / term-name explanation** would require the M1 DTO to publish *the exact boundary source record(s) actually used*, rather than the global list of possible term source IDs. Do not infer the specific event from generic metadata. M2 v3 remains research-only and no interpretation, historical birth-year expansion, production use or stored personal birth details are added.
