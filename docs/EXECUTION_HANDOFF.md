# Execution handoff

## Repository truth — 2026-10-09 03:00 KST (research/documentation run)
- Workstream: `agent/foundation-20261006`, PR #1 draft/open. main read at `39b6653e4f93169a4b5b51412b72d4710e9da91f`.
- Exact pre-write PR HEAD / parent: `ef4be06a3378e9afbcbd7a04023f64c94f186a03`. This file is written **inside** the new commit; a Git commit cannot contain its own SHA. Read PR #1 head_sha for the exact post-write HEAD and verify its parent is the pre-write SHA above.
- GitHub PR and target-file blob SHAs were re-read immediately before creating the conditional atomic documentation commit.

## Commits actually applied
- One documentation-only commit intended in this atomic update: M1 interior-Jie omission counterexample, KASA publication-rights caveat in source registry, and this handoff. **Only treat it as applied if PR HEAD advanced and the files are present.** No executable code changed; no main change/merge.

## Checks actually run
- Direct GitHub connector: main/PR/branch/recent commits/tree/roadmap/handoff, exact source and tests; target SHA and PR head checks.
- Local Node 22.16.0 minimal source-loop reproduction: deleting 2027 JINGZHE changes active Jie on 2027-03-10 from JINGZHE to LICHUN (PASS as a counterexample); **not** an exact-checkout test.
- KASA official 2027 notice and 2026 announcement rights labels checked directly on issuer webpages.
- Shell `git ls-remote`: FAIL (github.com DNS). `npm ci`, `npm run check`: NOT RUN. No executable change in this run.

## Current milestone/gate
- M1 #12 Four Pillars: OPEN; canonical tests not run; incomplete-Jie data can yield a silently wrong month pillar.
- M1 #13 lunar/leap-month official-annex comparison: OPEN; no fixture promotion.
- Product reuse rights: KASA 2027 official publication page says KOGL type 2 (noncommercial); factual-data status and KASI licensing require review.

## Next 1–3 safe tasks
1. Obtain exact PR checkout, run `npm ci && npm run check` and diagnose failures; do not merge before green.
2. Add missing-interior-Jie regression and coverage-aware validation (without rejecting legitimate partial guard data), then run canonical checks.
3. Inspect official KASA lunar annex vs KASI fixtures; resolve rights/attribution separately before commercial reuse.

## Unresolved/disputed/blockers
- Shell GitHub DNS prevents canonical checkout/checks; PR remains draft.
- Published-minute rounding/truncation and true second-level solar-term boundaries unverified.
- Zi rollover/hour-stem reference remain explicit school policies; historical time normalization not integrated.
- Rights label concerns publication reuse; it does not itself prove that bare calendar facts cannot be used commercially.
