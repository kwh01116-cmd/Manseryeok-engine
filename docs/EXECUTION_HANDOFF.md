# Execution handoff

## Repository truth — 2026-10-09 KST (full-year coverage validator slice)
- Branch: `agent/foundation-20261006`; PR: #1 DRAFT/OPEN; main HEAD: `39b6653e4f93169a4b5b51412b72d4710e9da91f`.
- Parent / branch HEAD at preparation: `fa09de6ab2c3b4122204e179fd067860ee58696b`. The new head is the commit **containing this file** (a commit cannot embed its own SHA). Resolve PR head_sha live before the next write.
- Existing docs blob SHAs before atomic write: coverage `acc235c3d5194859e988dc4bdeee9c26f8d57653`; handoff `913176ee6c2ff2a6d0ecae134e3834b32d872109`. No other branch/file was overwritten.

## Commits actually applied in this run
- One intended conditional atomic commit: `feat(m1): add opt-in full-year solar-term coverage validator and adversarial tests`. Count as applied only after live PR head and file verification.
- Files: new `src/calendar/solarTermCoverage.ts`, new `test/solar-term-coverage.test.mjs`, updated `docs/research/M1_SOLAR_TERM_COVERAGE_CONTRACT.md`, this handoff. No main merge.

## Checks actually run
- GitHub connector: main, PR, branch head, recent commits, tree directories, AGENTS, roadmap, source, tests, research, handoff.
- Local Node 22.16.0 / TypeScript 5.8.3: **isolated reconstructed fixture/timeline** strict compilation PASS, focused coverage tests **7/7 PASS**. NOT an exact-repo canonical test.
- `git ls-remote`: FAIL (github.com DNS); exact checkout `npm ci && npm run check`: NOT RUN. No verified claim.

## Current milestone/gate
- M1 #12 Four Pillars: OPEN. Finite-set full-year validator exists but is **not called by chart API**; public `DEFINITE` does not certify coverage.
- M1 #13 lunar/leap-month official-annex comparison: OPEN.

## Next 1–3 safe tasks
1. Obtain exact checkout and execute `npm ci && npm run check` at current PR HEAD; fix failures before any merge.
2. Add immutable canonical fixture digest + source/edition verification and explicit coverage binding to a new certified chart entry point; do not silently change current API.
3. Continue KASA official-edition vs KASI 2026/2027 lunar/leap-month comparison without treating calendar-data transcription as official golden.

## Unresolved/disputed/blockers
- Canonical test unavailable due GitHub DNS; PR stays draft and unmerged.
- Manifest validator checks **presence** of source IDs, not authority or content digest; changed times could pass. Partial/12-Jie profile intentionally not implemented.
- Published-minute rounding/truncation, exact astronomical seconds, KASA commercial reuse, Zi rollover policy and historical civil-time normalization remain unverified/explicit.
