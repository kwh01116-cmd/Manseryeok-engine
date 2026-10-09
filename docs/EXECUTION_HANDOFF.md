## Latest 2026-10-10 KST — U0 executable presentation projection (isolated verification)
- Branch `agent/foundation-20261006`, PR #1 DRAFT/OPEN; prewrite HEAD `ebb43885867127e6fcb00434186aa62114741e9f`; main last checked `39b6653e4f93169a4b5b51412b72d4710e9da91f`. New commit/head is authoritative in GitHub ref, not self-embedded.
- This run: one atomic proposed commit adds `src/story/v0StoryProjection.ts`, export via `src/index.ts`, `test/v0-story-projection.test.mjs`, research note and this handoff. Does NOT modify M1 calendar engine, web renderer, time policies, source fixtures or main.
- Actual checks: attempted `git ls-remote` failed DNS; Node 22.16.0 and TypeScript 5.8.3 `tsc -p tsconfig.json` on **isolated source with small supporting stubs PASS**; 5/5 isolated Node tests PASS. Full repo checkout/`npm ci`/`npm run check` **NOT RUN**. New change is **NOT canonical verified**.
- Gate: U0 typed projection added (full integration pending). M1 official calendar/independent differential/clean-install gates still OPEN. U1 visually rendered scroll chapter NOT implemented.
- Safe next: (1) exact checkout and `npm ci && npm run check`; (2) actual engine boundary/lunar projection integration assertions; (3) KASA official edition/source rights check and supported birth-year expansion; only then one scoped U1 DOM scene.
- Blockers: repo network, official edition/rights and published-minute precision, unknown time/Zi policy, historical timezone backlog; no PR merge.

## Latest 2026-10-10 KST — storytelling UX track incorporated (documentation-only)
- Exact working branch `agent/foundation-20261006`, existing PR #1 DRAFT/OPEN, verified parent HEAD `b59f57dc9c424e130dbdf706c0f9c32894eaf6be`; main observed at `39b6653e4f93169a4b5b51412b72d4710e9da91f`. Postwrite HEAD is the *live* GitHub PR head (a commit cannot embed its own hash).
- Actual work: one reversible atomic docs commit updating `docs/ROADMAP.md`, creating `docs/PRODUCT_STORYTELLING_UX_ROADMAP.md`, and updating this handoff. Added U0–U4 dependency gates, implementation and adversarial UX test criteria. No application code, new dependencies, tests, production deployment, new branch, or merge.
- Actually checked: current PR/branch ref, affected file blob SHA, roadmap anchor/coverage and new-path absence; docs consistency spot-check. `npm run check`, `npm ci`, HTTP/browser tests were **NOT RUN** for this docs-only change; all previous verification restrictions remain.
- Milestone: M1/V0 official-evidence/clean-check gates **OPEN**. U0–U4 = planned; **no webtoon implementation or release claimed**.
- Safe next 1–3: (1) exact networked checkout and canonical checks; (2) KASA/Gazette vs KASI minutes and source rights + independent differential; (3) expand modern birth coverage / M2 ChartFacts; U0 schema mapping may proceed only if it does not displace critical gates.
- Blockers/disputed: source rights/edition/precision, unknown-time and Zi policies, historic timezone backlog. User-supplied 2026 market/legal assertions and cost/period estimates **not independently verified**. No merge.

## Latest 2026-10-10 KST — published KASI month-start 日辰 cross-check (focused regression)
- Exact branch: `agent/foundation-20261006`; PR #1 DRAFT/OPEN; prewrite HEAD `cfbaf724daaa8ca2c2c5961c23795b3aa32f37e9`; main prewrite `39b6653e4f93169a4b5b51412b72d4710e9da91f`. Final HEAD is the live PR ref after conditional commit (a commit cannot contain its own SHA).
- This run: one reversible atomic commit adds `test/day-pillar-kasi-month-starts.test.mjs` (24 published 2026/2027 lunar month-first-day Gregorian-date + 日辰 witnesses, plus 2 tests) and this handoff. No main merge.
- Actual checks: Node 22.16.0, TypeScript 5.8.3 strict isolated 4-module source reconstruction compiled PASS; `node --check` PASS; `node --test test/day-pillar-kasi-month-starts.test.mjs` **2/2 PASS** on isolated compiled engine slice; independently recomputed all 24 vectors with Python date arithmetic **24/24 MATCH**. Full checkout `git ls-remote` FAILED (github.com DNS); repository-wide `npm ci && npm run check` NOT RUN in this execution. New test is **NOT canonical-suite verified**.
- Gate: M1 date-only day pillar cross-check strengthened against KASI published 日辰. Official KASA Gazette annex and independent non-KASI differential still OPEN. V0 actual local HTTP/UI previously exercised in a SHA-checked reconstruction, not a deployed site.
- Provenance: KASI calendarData 2026 V1.0a and 2027 V1.0a, month 1–12 start dates and 日辰 column; https://astro.kasi.re.kr/kor/life/post/calendarData?search_year=2026 and https://astro.kasi.re.kr/kor/life/post/calendarData?search_year=2027 . Calendar computation reference, NOT official KASA certification. Rule layer: published civil-calendar fact; codeability EXACT relative to these editions; no new Myeongli interpretation policy. Adversarial witness: one-day shifted sexagenary anchor fails 24 checks, while internal 60-day cycle invariants could still pass.
- Next safe 1–3 tasks: (1) networked exact checkout + `npm ci && npm run check`, including this new test; (2) KASA 2026/27 official edition minute and rights comparison; (3) after gates, widen modern birth-year coverage and deterministic M2 ChartFacts. No production deployment until source-use rights clarified.
- Blockers/disputed: direct GitHub DNS/registry network, full canonical test gate, official KASA annex and licensing, minute precision, explicit 子時/clock policies, historical DST. No main merge.

## Latest 2026-10-10 KST — full canonical check and actual V0 real-engine HTTP/UI integration
- Branch `agent/foundation-20261006`; Draft/open PR #1; **prewrite HEAD** `d41d0a263935b3df2cb25f05ff7d6dc18341c8a0`, main prewrite `39b6653e4f93169a4b5b51412b72d4710e9da91f`. **Final head = live PR ref** after conditional atomic update; commit cannot self-reference its own SHA.
- This execution: 1 reversible commit fixing TypeScript optional-property TS2375 in `adjacentSolarTerms`, fixing CLI non-OK stdout/stderr behavior, adding stricter regression tests, and recording verification in `docs/research/V0_REAL_ENGINE_INTEGRATION_20261010.md` plus this handoff. No main merge.
- Checked: SHA validation **65/65** reconstructed original GitHub files; Node 22.16.0, TypeScript 5.8.3; initial `npm run check` failed 2 type errors, next run failed 1 CLI test; final patched `npm run check` **PASS 129/129**. Local Node web server HTTP/engine tests PASS (200 Gregorian/lunar equivalent; 200 Lichun 2 candidates; 422 invalid/out-of-coverage). Chromium desktop/mobile `page.set_content` + intercepted live backend PASS; direct browser localhost navigation BLOCKED. `npm ci --offline` FAIL ENOTCACHED (no independent lock install).
- Gate: M1 computational integration now passes in SHA-verified reconstruction **with this patch**; official KASA annex, independent differential and dependency-install gate still OPEN. V0 calculated UI slice PASS via intercepted bridge, not public deployment.
- Next 1–3: (1) independent `npm ci && npm run check` in networked checkout; (2) official KASA 2026/27 annex/source-use rights cross-check; (3) expand V0 birth coverage and begin M2 ChartFacts only after gates.
- Blockers/disputed: direct GitHub DNS, TypeScript registry cache, commercial reuse terms on KASA notice, published-minute uncertainty, explicit Zi/hour-stem/time basis and historical DST backlog. Sources and adversarial vectors in V0_REAL_ENGINE_INTEGRATION_20261010.md.

## Latest 2026-10-09 — V0 finite-coverage error semantics
- Branch: agent/foundation-20261006; PR #1 DRAFT. Parent HEAD: e83040deccc3c0761bd777b0524f7410049bfd6d; resulting commit SHA must be read from the branch after write.
- Change: distinguish valid dates beyond 2026–2027 solar-term coverage from invalid inputs; validate manifest alignment before classifying out-of-coverage; add Gregorian/lunar/HTTP regression tests and source note. No main merge.
- Actual checks: Node 22.16.0 isolated boundary tests 2/2 PASS; isolated syntax PASS. Exact checkout blocked by GitHub DNS. Canonical npm ci, npm run check, compiled engine and live HTTP/browser tests NOT RUN. New repository tests UNVERIFIED.
- Gate: M1 official/differential and V0 integrated runtime remain OPEN.
- Next: exact checkout and canonical check; real npm run web HTTP/browser test; KASA official annex minute comparison.
- Blockers: DNS/network checkout; KASA edition/source precision and reuse rights; explicit Zi/time-basis policies unresolved. No astronomical authority or interpretive claim added.

# Execution handoff

## Latest 2026-10-09 KST — V0 preview launch correctness (DRAFT; canonical check BLOCKED)
- Exact branch: `agent/foundation-20261006`, PR #1 DRAFT/OPEN; verified prewrite HEAD `a206a0eb0194349e24ad10720e525b71af831e60`, main at `39b6653e4f93169a4b5b51412b72d4710e9da91f`. New HEAD must be checked live after conditional update; commit cannot contain its own SHA.
- Applied this run: one reversible commit adding a portable direct-entrypoint check for Windows/macOS/Linux, a real `npm run web` build-and-launch command, 2 regression tests and this handoff/doc update. No main merge.
- Checks actually run: Node v22.16.0 `node --test test/web-entrypoint.test.mjs` 2/2 PASS in isolated workspace using the exact new helper/test code; `node --check` of modified local server/helper PASS; repository `git ls-remote` FAILED (github.com DNS and direct IP connection); full exact-checkout `npm ci && npm run check` NOT RUN; real M1/V0 HTTP engine NOT VERIFIED; Windows runtime NOT EXECUTED.
- Gate: M1 official calendar/differential/full tests OPEN; V0 browser entrypoint regression addressed, integrated engine/render gate OPEN.
- Next safe tasks: (1) exact repository checkout and `npm ci && npm run check`, exercise `npm run web` with real Gregorian/lunar/LICHUN inputs; (2) resolve discovered integration failures, if any; (3) compare KASA official annual annex edition with KASI fixtures before scoped merge review.
- Unresolved: full checkout/network/DNS, official calendar attribution/rights and minute precision, explicit Zi rollover policy, historical/overseas time. No unsupported calendar or Myeongli claims introduced.


## Postwrite verification — 2026-10-09 KST (screen preview)
- Confirmed PR #1 branch head after UI commit: `735b2c31fc2a44152b2de6844a5bfd5fb2f4b210`; six changed file blob SHAs matched GitHub; `main` remained at `39b6653e4f93169a4b5b51412b72d4710e9da91f`.
- Additional actual checks: Chromium via Playwright `page.set_content` loaded exported V0 HTML at 1240px and 390px viewports; title/date fields rendered; example-button interaction set the explicit CIVIL_MIDNIGHT policy; desktop/mobile static screenshots generated. PASS for **static browser rendering only**, NOT the real engine/API or network navigation.
- File/http browser navigation was blocked by administrator; `git ls-remote` failed DNS; `npm ci && npm run check` and server HTTP integration tests were NOT RUN. No merge authorized. Current milestone remains M1/V0 OPEN.
- This documentation-only commit updates evidence/hand-off after the UI commit; newest exact HEAD must be resolved live from PR before any subsequent write.


## Latest 2026-10-09 — V0 browser preview on the existing Draft PR
- Branch: `agent/foundation-20261006`; PR #1 DRAFT/OPEN; parent HEAD `6318c1aa2da9541bc59cbb3473a15edbeecb396c`; main at prewrite `39b6653e4f93169a4b5b51412b72d4710e9da91f`. The final HEAD is the GitHub branch ref following conditional update; a commit cannot embed its own SHA.
- This run's intended single commit: `feat(v0): local read-only Korean chart web preview` including HTML, local HTTP adapter, real-engine integration tests, README/documentation, and this handoff. Count only after checking GitHub branch HEAD.
- Checks ACTUALLY run: Node 22.16.0 `node --check` of new server and HTTP test PASS; inline UI script syntax PASS. Browser navigation/screenshot blocked by administrator; `git ls-remote` FAIL because github.com DNS unavailable; exact checkout `npm ci && npm run check` NOT RUN. HTTP tests have been added, NOT VERIFIED, no merge.
- Milestones: M1 calendar/four-pillars integration gate OPEN; V0 browser UI implemented but real built-engine HTTP path UNVERIFIED. Existing time policies explicit; KASI transcriptions only.
- Next 1–3 safe tasks: (1) exact branch checkout and `npm ci && npm run check` (fix actual failures, do not weaken tests); (2) run local web server and inspect desktop/mobile with real 2027 Gregorian/lunar/LICHUN inputs; (3) KASA edition-level calendar comparison and scoped PR review before merge.
- Disputed/blockers: checkout DNS; KASA official annex and commercial-use rights, published-minute rounding/seconds, historical DST and Zi rollover policy. Local browser preview is not a production endpoint; no user data storage, authentication or public deployment added.


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
