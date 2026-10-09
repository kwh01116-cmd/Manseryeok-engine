# Execution handoff

## Latest — 2026-10-09 KST: KASI fixture digest regression
- Exact workstream: `agent/foundation-20261006`, Draft/Open PR #1; main `39b6653e4f93169a4b5b51412b72d4710e9da91f`. Verified pre-write PR/ref HEAD: `39b4f594822e96761f1ecf2eb18367318c207f50`; this commit's SHA must be resolved from the live branch ref (a commit cannot contain its own hash).
- Commits actually applied this run: one conditional fast-forward commit `test(m1): pin KASI calendar fixture SHA-256 digests` (read live HEAD to obtain SHA). No main merge.
- Files: `scripts/calendar-fixture-digest.mjs`, `test/calendar-fixture-digest.test.mjs`, `docs/research/M1_CALENDAR_FIXTURE_DIGEST.md`, this handoff. Existing fixtures/calculation logic unchanged.
- Checks actually run: shell `git ls-remote` FAIL (github.com DNS); `npm ci && npm run check` NOT RUN. Node v22.16.0 syntax checks PASS; 3/3 new tests PASS against manually reconstructed 49 solar / 37 lunar records, NOT exact GitHub checkout; SHA helper invariants PASS. Canonical repository test still UNVERIFIED; no merge.
- Milestone/gate: M1 #12/#13 OPEN, V0 OPEN; content pins protect the current **KASI-transcribed corpus**, not official KASA authority or runtime API certification.
- Next 1–3 safe tasks: (1) recover exact checkout and run canonical check; (2) compare KASA official edition annexes and reconcile data/rights; (3) connect V0 chart preview to a read-only input interface only after full check.
- Unresolved/disputed/blockers: shell GitHub DNS; exact repository check; official KASA annex and commercial rights; published-minute semantics, historical time and Zi rollover policies. Do not silently change digest expectations on mismatch.

## Previous handoff snapshot

2026-10-09 KST
- Branch: agent/foundation-20261006; PR #1 draft/open.
- Parent HEAD: 98d95eb84e6f6ac57bb5191d1c61dfe82cf5b23e; final head via live ref.
- Commit: freeze KASI term fixture; main unchanged.
- Checks: Node isolated PASS; npm run check NOT RUN.
- Gate: M1 #12/#13 and V0 OPEN.
- Next: canonical checks; digest; V0 input.
- Blocker: shell network, edition and time policies.

