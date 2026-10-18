# Quota-paused engineering protocol — 2026-10-18

**Current input from product owner:** "GitHub Actions monthly allowance is exhausted." The account-level billing/quota cause has not been independently verified here. Although public repositories often have free standard hosted runner minutes, this protocol assumes **NO RUNS** until the owner and actual GitHub billing settings confirm capacity. Do not incur charges or attempt to evade a platform/account quota.

## Verified workflow trigger

Current `.github/workflows/manseryeok-check.yml` triggers on `push` to branch `agent/foundation-20261006` when paths match:
- `.github/workflows/manseryeok-check.yml`
- `src/**`, `test/**`, `scripts/**`, `web/**`
- `package.json`, `package-lock.json`, `tsconfig.json`

**It does not list `docs/**`, `README.md` or `AGENTS.md`.** Consequently a commit touching ONLY those paths **does not match the reviewed path trigger**. This does **not** guarantee another independently configured workflow (or a changed workflow) can never run; inspect current workflows/head before every push.

## Allowlist mode while CI is paused

| Allowed now | Not to push to CI branch now |
| --- | --- |
| `docs/research/**`, `docs/product/**`, `docs/review/**`, `docs/operations/**`, carefully scoped `README.md` and `AGENTS.md` documentation edits | All `src/**`, `test/**`, `web/**`, `scripts/**`, workflow YAML, package metadata and tsconfig |
| Read source, compare publications/licenses, design DTO/tests on paper, triage PR, create verified links and clear next-run instruction | Claim new tests passed without execution; change branch/date coverage; merge into main; publish a real DOB API |
| Create a separate *unexecuted* source patch in a clearly named staging branch **only if owner explicitly wants that** and branch does not match any workflow trigger | Disable or loosen mandatory tests merely to avoid quota; mask failures; call GitHub Actions again |

**Preferred**: one atomic **docs-only** commit onto existing Draft PR branch, GitHub current-head lease enforced. If creating a new staging branch, keep a record of its exact base SHA, CI trigger, test status and expected merge strategy. Do not assume a fork bypasses limits legitimately.

## Preflight checklist before every GitHub write

1. `fetch_pr(1)` current head/state/draft, exact `get_file` current workflow and `git tree` if necessary; compare with intended base head.
2. List every changed path. **Abort** if any path matches CI trigger pattern in the currently inspected workflow or if an unexpected workflow appears.
3. Prepare file content and record immutable Git blobs; create tree with unchanged base tree; create commit with exact parent.
4. Push via expected SHA optimistic lease, **never force**. Re-fetch PR to prove new head matches.
5. Optionally inspect latest Actions run list **without triggering anything**. Do not interpret "no new run" as test PASS.
6. Label every file and progress statement as `DOC_RESEARCH_ONLY`, `CODE_AUTHORED_NOT_EXECUTED`, `STATIC_CHECKED`, or `RUNTIME_VERIFIED_AT_<SHA>`.

## Evidence ladder

1. **RESEARCH NOTES** — source directly read/cited, facts/uncertainty documented. No code behavior claim.
2. **SPEC DESIGNED** — typed contract, fixtures plan, UX flow and pass/fail criteria written. No implementation claim.
3. **CODE AUTHORED** — code changed, no source runtime check; must not be promoted to ready, even if a compiler can be reasoned about.
4. **STATIC CHECKED** — local syntax/types where possible; not equivalent to complete repo.
5. **RUNTIME VERIFIED** — exact SHA complete `npm ci && npm run check`; if browser/UI changed, actual Chromium with real local HTTP. Record provenance, pass/fail and logs.
6. **RELEASE CLEARED** — distinct source-accuracy/licensing, privacy/security, usability and merge/production approvals. Green software CI alone insufficient.

## When legitimate execution becomes available

- Obtain a clean checkout of the **exact** PR SHA, Node 22 pinned via `package-lock.json`; run `npm ci --no-audit --no-fund && npm run check`, then `node scripts/browser-smoke.mjs` on an environment with Chromium.
- Chrome/Chromium may need installation; do not confuse missing executable with an engine regression.
- Any failure: report failing test ID and error with exact SHA, fix narrowly, rerun, preserve fail-closed.
- Add applicable newly specified tests only after actual source patches are prepared and approved. Never relabel research-only 2000 fixture as consumer-ready.
- Check GitHub usage/billing via account settings; public vs private and standard vs larger runners are distinct. No action requiring payment or recurring schedule will be undertaken without explicit authorization.
- No background execution of unscheduled agent tasks is implied by a committed plan.

## Safest immediate priorities

(1) official-vs-computational Korean calendar source commercial clearance; (2) M1 applied Jie metadata spec and test vectors; (3) source-identified M2 rule interpretation gates; (4) U1 EP3–EP5 screen scripts; (5) Draft PR #1 split/security review. **Do not deploy Cloudflare until the explicit browser/security/reuse gates pass.**
