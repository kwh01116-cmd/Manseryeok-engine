# U0 story projection — source-bound presentation contract (2026-10-10)

Status: **draft executable adapter and tests, NOT integrated into the local HTML renderer; no consumer release**.

Source: existing `KoreanBirthChartPreviewResult` (M1/V0), `STEM_NATURE`, `BRANCH_NATURE`; no external interpretation library, no new publication or model. Function `projectKoreanV0Story` produces versioned story beats for one or two **correlated** pillar candidates. Fact paths point back to the original `preview.candidates[i]` fields; calendar conversion provenance remains in the original preview, not fabricated for Gregorian input.

Class: deterministic presentation (EXACT *conditional on upstream M1 source correctness*), no school policy. Preconditions: `OK` preview, explicit Korean civil clock policy, finite structural coverage, published-minute scope, 1 definite or 2 boundary candidate(s). Exceptions: out-of-coverage/invalid lunar produce BLOCKED with no scenes; malformed/inconsistent provenance/candidates throw rather than fabricate. Boundary counterexamples: 2027-02-04 10:46 Lichun two correlated candidates; 2028 dates cannot create story; invalid date cannot get a story. A known chart such as 2027-02-05 yields day stem 乙=WOOD/YIN and month branch 寅=WOOD principal element. Principal element is **not** seasonal strength or an exhaustive hidden-stem model.

Semantic limitation: beats are only FOUR_PILLARS, DAY_STEM_CLASSIFICATION, MONTH_BRANCH_CLASSIFICATION. No personality/health/finance/future prediction, seasonal strength, automatic unknown-time fallback, or fabricated official KASA certification. `CALCULATED_CLASSIFICATION_ONLY` must not be rendered as scientific predictive validity.

Isolated checks performed with Node 22.16.0, TypeScript 5.8.3, strict NodeNext compiler settings and small source/type stubs: `tsc -p tsconfig.json` PASS; `node --test test/v0-story-projection.test.mjs` 5/5 PASS. **The isolated workspace did not contain the repository's original calendar dependencies.** Full exact branch checkout, `npm ci` and repo-wide `npm run check` NOT EXECUTED due github.com DNS failure. The new test is pending full canonical verification. No merge.

Next integration gate: run canonical checks in a real checkout, compare story projections using actual `resolveKoreanBirthChartPreview` for equivalent solar/lunar birth and boundary examples, then add one accessible story beat in existing `web/` with UI regressions; do not migrate to Next.js simply for this adapter.
