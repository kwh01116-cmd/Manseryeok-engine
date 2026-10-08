# Execution handoff

## Current repository truth — 2026-10-08 17:00 KST
- Branch: agent/foundation-20261006; PR #1 draft/open; main observed 39b6653e4f93169a4b5b51412b72d4710e9da91f.
- Parent PR head at start and pre-write: 2769c3a19839742e98f183042dc686be5926accd.
- Final head is the commit containing this handoff; query PR #1 for its exact SHA (a commit cannot embed its own SHA).

## Commits actually applied this execution
- Intended one atomic commit: correct solar-term test cardinality, add docs/research/M1_GATE12_TEST_AUDIT.md, and refresh this handoff.
- Confirm applied only after expected-head ref update and PR head read. No production code or Myeongli policy changed.

## Checks actually run
- Read main, open PR, branch, recent commit/tree, roadmap, source, tests, research and handoff.
- Source count: 24 events (2026) + 24 (2027) + 1 DAXUE 2025 guard = 49. Independent Node arithmetic PASS.
- Proposed test file node --check: PASS (syntax only).
- git ls-remote: FAIL (DNS could not resolve github.com).
- Exact checkout / npm ci / npm run check: NOT RUN. New test is UNVERIFIED in canonical environment; do not merge.

## Milestone/gate
- M1 #12 Four-Pillars: OPEN. One guaranteed incorrect assertion corrected, but canonical checks, integrated public composition and pinned differential coverage remain.
- M1 #13 lunar/solar/leap: research candidates only; KASA 2025 edition/2026 directive original annex not independently checked.

## Next 1–3 safe tasks
1. Recover exact runnable checkout and run npm ci && npm run check; fix genuine failures without weakening tests.
2. Audit combined Four-Pillars public API and independent differential vectors; close #12 only with green evidence.
3. Cross-check KASA official editions and KASI transcriptions, then promote only independently verified lunar fixtures.

## Unresolved/disputed/blocker
- Network DNS blocks canonical check; no merge or verified claim.
- KASA authority vs KASI minute-transcription source IDs need explicit separation/review.
- Zi rollover, time basis and late-Zi hour-stem reference remain explicit policies; published-minute seconds unknown.
- All future writes must re-read PR head and file SHA and use an expected-head lease. GitHub repository overrides chat memory.
