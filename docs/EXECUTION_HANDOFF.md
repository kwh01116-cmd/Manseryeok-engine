# Execution handoff

## Repository truth — 2026-10-08 21:00 KST
- Branch agent/foundation-20261006; PR #1 draft/open; main at initial read 39b6653e4f93169a4b5b51412b72d4710e9da91f.
- Exact PR HEAD before this commit: 53101bbdcf7dff800f15d0e969747b7d10ce02b2.
- Post-write HEAD is the commit containing this handoff; its own SHA cannot be embedded in its content. Read current PR #1 head_sha for exact post-write SHA. This commit's parent is the pre-write SHA above.

## Commits actually applied
- One atomic commit intended: NAOJ differential test, precision research note, source-registry addition, and this handoff. Treat as applied only after successful expected-head ref update and final GitHub read.

## Checks run
- GitHub: main, open PR, current branch/tree, recent commit, docs/ROADMAP.md, existing source/tests, handoff/source registry read.
- Shell git ls-remote: FAIL (github.com DNS); exact checkout, npm ci and repository npm run check NOT RUN.
- Isolated reconstructed-source targeted check: TypeScript 5.8.3 strict compilation PASS; Node 22.16.0 node --test PASS 1/1, 48 NAOJ published-minute vectors. NOT canonical verification.
- Independent Node interval counterexample for hypothetical nearest vs floor minute: evaluated; no publisher rounding rule established.

## Milestone/gate
- M1 #12 Four-Pillars OPEN: published-minute differential expanded, but full checks, public integrated API, and sub-minute policy unresolved.
- M1 #13 lunisolar/leap research candidates only; official KASA annex not yet crosschecked.

## Next safe tasks
1. Recover exact checkout and run npm ci && npm run check, fix actual failures without weakening tests.
2. Resolve publication/birth-time precision contract; preserve correlated LICHUN candidates and explicit time policies.
3. Compare KASA official annex with KASI lunar leap-month transcriptions.

## Unresolved/disputed/blocker
- GitHub shell DNS blocks canonical check; do not merge PR.
- NAOJ/KASI rounding/truncation and actual seconds UNVERIFIED. Zi rollover, hour-stem reference and TIME_BASIS remain explicit policies. Historical DST backlog unless required.
- Next run must re-read PR HEAD and file SHAs before any write; repo truth outranks chat.
