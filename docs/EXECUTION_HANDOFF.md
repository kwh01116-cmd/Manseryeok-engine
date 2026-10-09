# Execution handoff

## Latest 2026-10-09 — V0 CLI date-shape validation (canonical check BLOCKED)
- Exact branch: `agent/foundation-20261006`; PR #1 DRAFT/OPEN; prewrite head `9c8b906002fcd90bfc4506d37267301e57c4627e`; resulting head is the live branch ref (commit SHA cannot self-reference its own content). Main prewrite head `39b6653e4f93169a4b5b51412b72d4710e9da91f`.
- Commits this run: one small atomic commit updating CLI parser, its regression test, and this handoff. No main merge.
- Checks actually run: exact fetched parser evaluated in isolated V8, 10/10 date-shape vectors PASS after patch; `git ls-remote` FAILED due github.com DNS; `npm ci && npm run check` NOT RUN; new repository tests NOT verified.
- Milestone/gate: M1 full integration + KASA official-source comparison OPEN; V0 actual CLI integration OPEN. Parser now rejects impossible Gregorian days and out-of-shape lunar dates before conversion; real lunar leap/month existence remains converter-owned.
- Safe next tasks: (1) exact checkout and canonical check + real V0 CLI execution; (2) fix any actual integration failures; (3) compare KASA official annual annex to KASI fixture minutes.
- Unresolved/disputed/blocker: checkout DNS/network; canonical tests, official edition/rights, published-minute precision, Zi rollover/time basis, historical/overseas support. Rule class: software input validation EXACT, no new astronomical or classical claim.

## Prior handoff (verbatim)
## Latest 2026-10-09 — cross-year lunar golden witness
- Exact branch: `agent/foundation-20261006`; PR: #1 DRAFT/OPEN; prewrite PR HEAD: `748dfbf01798be323fabf049c4c6df26843056fb`; main HEAD: `39b6653e4f93169a4b5b51412b72d4710e9da91f`. The resulting commit HEAD is the live GitHub branch ref (self-referential SHA cannot be embedded in its own commit); re-read before continuing.
- Commits this run: one small reversible commit adding `test/korean-lunisolar-next-year-boundary.test.mjs`, `docs/research/M1_2028_BOUNDARY_WITNESS.md`, and this handoff. No main merge.
- Checks actually executed: local Node v22.16.0 `node --check` of staged test PASS; standalone 2027-12-28 + 30-day arithmetic PASS. Exact checkout `git ls-remote` FAILED (github.com DNS/network); `npm ci && npm run check` NOT RUN; new repository test NOT verified.
- Milestone/gate: M1 full integration + KASA official source gate OPEN; V0 CLI integrated test OPEN.
- Newly confirmed: KASI 2028 calendar V1.0a explicitly places lunar 2028-01-01 on Gregorian 2028-01-27, corroborating terminal 2027 lunar 12/30 on 2028-01-26. KASI is NOT the official KASA annex.
- Safe next 1–3 tasks: (1) obtain exact branch checkout and run canonical check + CLI integration; (2) reconcile official KASA Gazette edition with KASI 2026/2027 fixtures; (3) only after green checks, implement the next minimal M1/V0 integration slice.
- Unresolved/disputed/blocker: GitHub checkout unavailable from this runtime; official annex/rights, published-minute precision, Zi rollover/time-basis, real CLI run. Structural corpus validation cannot detect a coordinated final-month+coverage-bound mutation; the new external golden protects this boundary.

## Previous handoff (preserved)
# Execution handoff

## Latest 2026-10-09 — deterministic nature-table safety
- Branch: agent/foundation-20261006; PR #1 DRAFT/OPEN; main SHA: 39b6653e4f93169a4b5b51412b72d4710e9da91f.
- Prewrite HEAD: bc5f96f2aa5cfe4b4d537d8c115a78420c4a2404. Final commit SHA is not self-referentially representable inside this same commit; the live GitHub branch ref is authoritative and must be re-read after the ref update.
- Applied this run: one reversible commit, fix(m1): freeze nature maps and reject invalid ten-god inputs. No main merge.
- Checks actually run: exact checkout git ls-remote FAILED (github.com DNS); canonical npm ci && npm run check NOT RUN. Isolated Node 22.16.0 / TypeScript 5.8.3 strict compilation PASS, focused 3/3 tests PASS on manually reconstructed 3-module domain slice; repository tests NOT verified.
- Milestone/gates: M1 #12 OPEN; official calendar source comparison OPEN; V0 preview/CLI integration OPEN.
- Next safe tasks: (1) obtain exact checkout and run canonical npm check without weakening tests; (2) compare KASA official annual annex to KASI minute fixtures; (3) after full green, connect read-only birth input and chart display with explicit policies.
- Unresolved/disputed/blockers: canonical checkout, official publication edition and rights, minute precision, Zi/time-basis policies, integrated CLI verification.

## Previous handoff (preserved)
# Execution handoff

## Latest 2026-10-09
- Branch: agent/foundation-20261006; PR #1 draft/open.
- Verified prewrite head: 9786eaa8861db7bf077905decdac273eb7895283. Postwrite head: consult GitHub branch ref.
- Applied: one commit adding runtime immutable GanZhi tables and regression tests; main unchanged.
- Checks: isolated TypeScript strict PASS, isolated Node test 1/1 PASS. Full repository check NOT RUN because GitHub DNS failed.
- Milestone: M1 and V0 OPEN.
- Next: exact checkout and full checks; Korean calendar edition comparison; V0 chart integration.
- Unresolved: source edition comparison, time policies, integration test.
