# Execution handoff

## Repository truth — 2026-10-09 KST (24-term full-year order integrity)
- Branch: `agent/foundation-20261006`; PR #1 DRAFT/OPEN; main HEAD: `39b6653e4f93169a4b5b51412b72d4710e9da91f`.
- Prewrite PR HEAD: `7ffee5964b74a6e09b4030f70fa46535ee3ed099`; base tree: `e1e25d5cd866eac0fcd4fbf264622341981670bd`. The new HEAD is the commit that contains this handoff; resolve PR HEAD live (self-referential commit SHA cannot be embedded).
- Prewrite modified blob SHAs: `src/calendar/solarTermCoverage.ts`=`f6f20484b529552e509ab601cf1b9dbf6ec175ae`; `test/solar-term-coverage.test.mjs`=`27b6a1e341846ef4dcce7bc727a764e185443f60`; `docs/research/M1_GATE12_TEST_AUDIT.md`=`82e25f3f6a3dabb6aa6415d7eb78c5869ce9dcb4`; `docs/EXECUTION_HANDOFF.md`=`de56547850af23a8120b4a5b7e51dc035b1a7299`.
- Commits actually applied this run: conditional one-commit patch `fix(m1): reject transposed 24-solar-term labels in full-year corpus` (count only after checking new HEAD).
- Changes: strict canonical (year,term) order inside explicit full-year coverage validator; regression transposition tests and focused audit. No fixture minute values changed, no policy defaults, no main merge.
- Checks actually run: Github repo/PR/main head/recent commits/docs/source/tests inspected; `git ls-remote` FAIL (github.com DNS); local Node 22.16.0 synthetic rule reproduction 4/4 PASS; **exact repo** `npm ci && npm run check` NOT RUN; new executable slice UNVERIFIED.
- Milestone/gate: M1 #12 OPEN; full-year coverage still opt-in and not enforced by the Four Pillars API, M1 #13 lunar/leap-month verification OPEN.
- Next safe tasks: (1) obtain exact checkout and run canonical `npm ci && npm run check`; (2) integrate explicit coverage manifest into opt-in chart API (no hidden policy); (3) compare official KASA annex against KASI minute fixtures and build lunar/leap-month goldens.
- Unresolved/blockers: GitHub clone DNS prevents canonical checks; source-minute precision and KASA annex rights still pending; no strong published-fixture digest; historical/DST, Zi rollover policy as previously documented.


## Repository truth — 2026-10-09 KST (source-provenance correction)
- Branch: `agent/foundation-20261006`; PR #1 DRAFT/OPEN; main HEAD at prewrite: `39b6653e4f93169a4b5b51412b72d4710e9da91f`.
- Prewrite PR/branch HEAD (commit parent): `e8dfcc62a401f69237751da2107869f13fd8a900`; base tree: `74039934ab3be30364eee9b8de007ed4dad9f7a2`. The final HEAD is the commit containing this file (cannot embed own SHA); resolve PR head_sha live before any next write.
- Prewrite file blob SHAs: `src/calendar/koreaSolarTermFixtures.ts` = `eb1e8afe738d9e5bed7deb1260b0bfaaa30ed2a7`; `test/solar-term-timeline.test.mjs` = `0911621e416ed2ce5620426ee36f2ed82f07a69f`; `docs/research/SOURCE_REGISTRY.md` = `59001a674fd87e4890ad1994120c7e1b09bea609`; `docs/EXECUTION_HANDOFF.md` = `5f55b28f245e64417790dcc014d5a7e3abee73e4`.

## Commits actually applied this run
- One conditional atomic commit intended: `fix(m1): separate KASI transcription from KASA publication authority`; count only after live branch and file verification.
- Annual 2026/2027 sourceIds changed from KASA+KASI to KASI-only (2025 guard already KASI-only); all-annual provenance test strengthened; source registry updated. No numerical calendar data, computation policy, or main merge changed.

## Checks actually run
- GitHub main/open PR/branch/recent commits/roadmap/AGENTS/tests/docs/source/handoff read; KASI 2027 disclaimer and KASA 2027 notice inspected directly.
- Isolated *synthetic* Node 22.16.0 49/49 provenance-shape check PASS; **not** a compiled/exact-repository test.
- `git ls-remote` FAIL: github.com DNS. `npm ci && npm run check` NOT RUN. Executable metadata change UNVERIFIED, no merge.

## Current milestone/gate
- M1 #12 Four Pillars OPEN; coverage validator opt-in and not bound to chart API; M1 #13 lunar/leap-month official-annex comparison OPEN.

## Next 1–3 safe tasks
1. Recover exact checkout, run `npm ci && npm run check` at latest PR HEAD, fix failures before merge.
2. Directly compare KASA 2026/2027 official PDF/HWPX annexes to KASI minute fixtures, recording edition and rights separately.
3. Define canonical fixture digest and explicit coverage-bound chart API; no hidden policy defaults.

## Unresolved/disputed/blockers
- GitHub DNS prevents canonical test. KASA annex minute transcription and source-specific commercial-rights clearance remain pending.
- Source provenance regression is unverified until exact checkout test. Coverage validator only checks presence, not digest; public chart API not coverage-bound. Published-minute rounding/seconds, historical time and Zi rollover policies remain open.
