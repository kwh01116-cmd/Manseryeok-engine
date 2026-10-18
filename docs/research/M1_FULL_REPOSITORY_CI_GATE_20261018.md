# M1 first canonical GitHub Actions full-repository gate — 2026-10-18

## Actual executed evidence

The previous long-lived blocker was **missing exact checkout and compiled dist** in an isolated assistant shell, not an engine regression. The first canonical `npm ci && npm run check` was actually executed on GitHub's standard `ubuntu-24.04` hosted runner with Node.js 22 and the exact PR branch:

| Run | Source commit | Conclusion | Typecheck/build | Tests | Action version |
| --- | --- | --- | --- | --- | --- |
| [#39088023671](https://github.com/kwh01116-cmd/Manseryeok-engine/actions/runs/39088023671) | `f86cd056b2ee2889c18b0d2383251a289c923b12` | **SUCCESS** | PASS | **179 pass, 0 fail, 0 skipped** | checkout/setup-node v4 |
| [#39088109046](https://github.com/kwh01116-cmd/Manseryeok-engine/actions/runs/39088109046) | `e706022cd6311bc3b2361373423436df029ed22f` | **SUCCESS** | PASS | **179 pass, 0 fail, 0 skipped** | checkout/setup-node v7 |

The earlier unresolved `test/m1-2000-four-pillars-integration.test.mjs` (eight cases, including 1,098 full Four-Pillars Gregorian-vs-lunar midday pairs, all twelve published Jie boundaries and 144 midnight/Zi boundary pairs) is now **actually executed and passing as part of those 179 Node test cases**. The many date/policy assertions are loops inside eight test cases, not additional independent test-case counts.

The initial run emitted a deprecation warning for Node 20-based action versions (runner forced action code to Node 24); upgrading to GitHub's v7 actions removed it. In the second run, job `117558853475` and every step—including dependency install, typecheck, build, complete tests, and cleanup—concluded `success`; the log contained no GitHub workflow warning entries.

## Scoped CI contract

File: `.github/workflows/manseryeok-check.yml`

- **Only** `push` events to `agent/foundation-20261006`, restricted to workflow file or code/test/scripts/web/package/tsconfig changes. No deployment, secrets, production environment or release step. Docs-only commits do **not** launch another run.
- `permissions: contents: read`; checkout does not persist credentials; one Ubuntu 24.04 Node 22 job, timeout 15 minutes, concurrency cancellation for superseded branch pushes.
- The repository was public at time of verification; GitHub documents that standard hosted runners on public repositories are **free and unlimited** (https://docs.github.com/en/actions/reference/runners/github-hosted-runners). This does not apply automatically if repository visibility or runner tier changes, and other services/storage may have their own usage rules.
- PR #1 stays OPEN and DRAFT, `main` untouched. The consumer CLI/web manifest remains 2026–2027 only; the 2000 reference fixtures remain RESEARCH ONLY. `npm run check` proves deterministic implementation behavior against checked-in evidence, **not** official KASA certification, astronomical second precision, source licensing clearance, product security or mobile visual QA.

## Remaining work

1. Re-review source rights and Korean institutional authority, and verify independent historical KASI lunar API where useful; **do not** call research fixtures consumer-approved by virtue of CI.
2. Exercise the actual 2026–2027 HTTP web preview with browser mobile UX/interaction smoke tests. Current suite already includes Node HTTP process tests; this is a separate real-browser gate.
3. Consider separating the 100+-commit draft into reviewable PRs before any merge and preserve Myeongli policy explicitness.
