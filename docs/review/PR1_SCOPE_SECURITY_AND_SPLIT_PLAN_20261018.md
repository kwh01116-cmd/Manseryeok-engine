# Draft PR #1 stabilization, release and review split — 2026-10-18

**Status: REVIEW PLAN only. No branches have been merged, PR split has not been executed, and nothing is deployed.** Exact inspected draft PR HEAD `cc44b625ac50d4bd3faa75ff62ca0497a550ceea`: **142 commits**, **152 changed files**. A recursive Git tree at that HEAD also lists 152 blob paths: `src/` 37, `test/` 52, `docs/` 48, `scripts/` 7, `web/` 1, plus top-level workflow/config. These figures are an inventory, not a security audit.

## Why a giant PR is a bottleneck

It couples four distinct review targets: (a) Korean calendar/time provenance, (b) finite day/hour/year/month calculation and lunar conversion, (c) contested traditional chart-fact lookup policies, and (d) localhost web/story/browser UI. A clean green 227-test suite on commit `891967bfd2883e4aed8296a27b96d9be8a94ee11` verifies regression claims for the tested code, **not** data licensing, correctness against all Korean official notices, public security, accessibility or product efficacy. Recommitting without tests while quota is exhausted increases review risk.

## Proposed dependency-ordered review packages

**Review A — foundational deterministic domain/time**:
`src/domain/{stems,branches,sexagenary,tenGods}.ts`, `src/time/*`, pure domain tests, rule/data provenance and minimal `package*`, `tsconfig`. No M2 lookup assumptions, public UI or data capture. Check no historical time inference is silently allowed.

**Review B — M1 finite Korean calendar engine**:
`src/calendar/*`, `test/*solar* / month / year / day / hour / lunar / 2000 research fixture`; source manifests, fixtures and coverage guards. Precisely state production 2026–2027 vs test-only 2000. Audit KASI vs KASA differences, KOGL commercial rights, KST/historical DST and minute-bucket uncertainty. Must not represent computed data as official Korean publication without evidence.

**Review C — U0 facts and internal M2 traditional-rule library**:
`src/story/v0StoryProjection.ts`, `src/chartFacts/*`, `src/domain/{hiddenStems,branchTenGods,branchRelations,triadMemberships,twelveGrowthStages}.ts`, corresponding tests and source-policy registers. Mandatory explicit school IDs, structural facts only, candidate fork preserved. No false scientific validation or default M3 interpreter.

**Review D — localhost V0/U1 UI and browser harness**:
`web/index.html`, `scripts/chart-preview-{cli,web,cli-args}.mjs`, browser-smoke, web/story tests, README and no-deploy guardrails. Verify CORS/origin/caching/content type, request size, error handling, keyboard/mobile, performance and no DOB logging/storage. DO NOT treat localhost-only code as safe to publicly host.

**Review E — cross-cutting source/privacy/licensing and deploy readiness**:
`docs/` source and policy gates, reproducible source manifest, privacy threat model, KASA/KASI per-source usage clearance, source integrity tests and build. This is a **release-blocking gate**, not a code-only review.

## Split procedure — deliberate, no silent rewrite

1. **Freeze** main + PR #1. Keep the current 142-commit Draft as immutable reference, and add only safe docs-only handoffs while CI quota is exhausted.
2. In a GitHub-accessible local workspace, resolve/test dependencies and choose actual split boundaries. Prefer creating **fresh, small branches off main**, cherry-picking well-delineated commits *only if* they do not drag giant cross-slice commits; otherwise selectively copy paths and explicitly log source commit/file ancestry. Do not rebase/reset/rewrite the huge original PR branch without approval.
3. Every review package requires full canonical `npm ci && npm run check` at its own exact HEAD, and a Chromium smoke for Review D; tests must be updated to resolve explicit dependencies, not simply removed. A 2000 corpus is NEVER promoted to public runtime to make tests pass.
4. Dependency chain A → B → C → D, then E for commercial/public gate. Use Draft PRs with base/head explicitly named; never stack broad changes on main. A review-only branch can contain doc-only notes until test capacity is restored.
5. Require two independent reviewer roles where possible: engine/calendrical logic and source/provenance/rights, plus UX/accessibility/security for D. Reviewers must know a passing CI doesn't validate astrology outcomes.
6. Once all target slices pass, compare **git tree SHA / independent fixture hashes** against the intended original content, validate direct URLs and evidence, re-run integration on the assembled branch. Merge **only** after approvals and verified green checks, with explicit release caveats.
7. Archive/stale-close PR #1 only when replacements fully cover its intended changes; never mark it merged implicitly.

## Actual attack/release surface review checklist (not all tested)

| Surface | Verified by reading | Open risk / required check |
| --- | --- | --- |
| `scripts/chart-preview-web.mjs` | A direct run binds `127.0.0.1`; `POST /api/preview` delegates to CLI input validator; 8,192-byte JSON maximum; no birth database in this script | Not a production service; add origin/CORS/CSRF policy, rate limiting, throttled malformed requests, request timeouts, request size/backpressure, logging policy if hosted |
| `web/index.html` | Local read-only UI + source disclosure and candidate-specific EP1/EP2 chapters are Chromium smoke-tested | Independent XSS/content-security review, browser accessibility, public threat model, resource limits, scroll/story design QA |
| `src/calendar/*` | Minute-level finite 2026–2027 KASI computational events + prior Daxue guard; fail-closed coverage | Institutional source and complete calendar commercial-use clearance; source corrections; historical DST/year expansion separately |
| `src/chartFacts/*` | Explicit-policy, candidate-indexed traditional raw facts | Editions/school alternatives, meaning accuracy, no inferred strength/fortune or hidden UI default |
| `test/fixtures/*` | Historical 2000 research-only corpus and other independent checks are in Git | Reproduction/republication rights per fixture; verify no protected KASA attachment/table copied into a commercially redistributed package |
| `.github/workflows/manseryeok-check.yml` | `push` scoped to branch and code/test/web/script/manifest paths; contents read-only | Account says Actions quota exhausted; DO NOT trigger workflow, disable check gates or spend paid usage without approval |
| `.env` / secrets scan | Filename inventory at HEAD contains no obvious `.env`, PEM or private key files | Filename inventory **does not** prove no embedded secret or third-party rights issue; run full content/diff/security scan later |

## Merge/release acceptance thresholds

No known source-rights contradictions, exact per-source permission/legal basis, complete deterministic calendar and browser gates, documented failure behaviors, reviewed API exposure security, zero hidden personal-data retention, explicit school policies and cultural/uncertainty disclaimers. Current **public/commercial release decision: BLOCKED**. Internal doc/research work: ALLOWED.

## Work that can proceed today without CI

- Record every existing component in a release checklist with owners and typed contract dependencies.
- Write M1 applied-Jie event DTO/test contract and M2 missing-rule decision records.
- Draft U1 EP3–EP5 visual/content script and independent golden vectors.
- Prepare atomic patch descriptions and branch split plan, **not** push source/test files on the CI-triggering branch.
