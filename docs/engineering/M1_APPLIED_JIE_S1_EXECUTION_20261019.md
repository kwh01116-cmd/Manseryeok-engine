# M1 applied Jie S1 — local execution report (2026-10-19 KST)

Status: **RUNTIME_VERIFIED_AT_b01861dbadba2d8773c4c4fca0d9cbb0cb439968**.
This is the first internal resolver slice from
`M1_APPLIED_JIE_IMPLEMENTATION_SLICES_20261018.md`, not completion of S2–S4
or clearance for a public/commercial release.

## Checkout and environment

- Repository: `https://github.com/kwh01116-cmd/Manseryeok-engine.git`.
- Initial `git status`, `git branch -a`, `git log -1 --oneline`: clean `work`
  branch at `39b6653`, only `origin/main` available locally. `/workspace` itself
  is not a repository; the checkout is `/workspace/Manseryeok-engine`.
- Fetched `agent/foundation-20261006` explicitly. Its remote HEAD exactly matched
  the owner's checkpoint `95906e6b0d57427b69c6461bb66eb076e2076af0`.
- Created `agent/m1-applied-jie-slice1-20261019` from that fetched ref. Read
  `AGENTS.md`, the roadmap, handoff, research index, S1–S4 blueprint,
  provenance design, test matrix and no-Actions protocol before editing.
- Default Node was **24.19.0**, npm **11.9.0**; `node_modules` was absent.
  Downloaded official **Node 22.23.3** / npm **10.9.9** to
  `/tmp/manseryeok-node22`, verifying the archive against its official SHA-256
  checksum manifest. Locked TypeScript **5.8.3** installed successfully.
- Initial `npm ci` failed with `ENOENT` creating `/home/agent/.npm/_cacache`
  (and accompanying tarball retry warnings). Retrying with
  `npm_config_cache=/tmp/manseryeok-npm-cache` succeeded. No lockfile or
  dependency version was changed to resolve this environment issue.
- Existing `/usr/bin/chromium`: **154.0.8037.57**, Debian 13 build. No browser
  installation or mocked fallback was required.

## Commands and results

For each npm/browser command, the shell used:

```sh
export PATH=/tmp/manseryeok-node22/bin:$PATH
export npm_config_cache=/tmp/manseryeok-npm-cache
npm ci --no-audit --no-fund
npm run check
node scripts/browser-smoke.mjs
```

| Checked source | Verification | Actual result |
| --- | --- | --- |
| `95906e6b0d57427b69c6461bb66eb076e2076af0` | Clean lock install, TypeScript typecheck/build, complete Node suite | **227/227 PASS**, 0 fail/cancel/skip/todo |
| Same baseline SHA | Real Chromium smoke | **PASS** |
| S1 staged source, byte-identical to code commit | Build and `node --test test/year-month-pillars.test.mjs` | **12/12 PASS**, including 9 new tests |
| `b01861dbadba2d8773c4c4fca0d9cbb0cb439968`, clean working tree | Fresh lock install, `npm run check` | **236/236 PASS**, 0 fail/cancel/skip/todo; typecheck/build PASS |
| Same S1 code SHA | `node scripts/browser-smoke.mjs` | **PASS** |
| Same S1 code SHA | `git diff HEAD^ HEAD --check` | **PASS** |

Both actual browser runs exercised the existing loopback HTTP app: Gregorian and
lunar chart parity, U1 EP0–EP2, two Lichun candidates, keyboard evidence disclosure,
coverage rejection/stale input handling, 360/390px layout and reduced motion.
This is regression evidence for the existing UI; S1's trace is not exposed there.
No GitHub Actions run was requested or triggered, no push was performed and no
workflow was changed. The report/handoff successor commit changes documentation
only; executable validation belongs to the exact code SHA above.

## S1 change and contract

Code commit: `b01861dbadba2d8773c4c4fca0d9cbb0cb439968`
(`feat(m1): retain candidate-specific applied Jie evidence in year-month resolver`).
Its only changed files are:

- `src/calendar/yearMonthPillars.ts`
- `test/year-month-pillars.test.mjs`

`YearMonthResolution` now has an optional additive `monthBoundaryTrace` with
schema `m1-month-boundary-trace-v1`. It snapshots the **already-computed**
`activeJieBeforeBoundary` / `boundaryJie` and month branches; it does not perform
a second solar-term resolution. Each context records the original candidate
index, month branch, boundary side, event term, displayed KST minute, minute
precision and that event's exact source IDs. Only a published boundary equality
adds `atPublishedBoundary`. All nested trace objects and copied arrays are frozen;
caller-owned events are not frozen or retained as mutable references.

Missing, blank, malformed or sparse source IDs on a traced event throw instead
of receiving a default authority ID. Unrelated events' source IDs never enter
the trace. These checks validate metadata shape, not the authenticity, legal
meaning or astronomical correctness of a declared source ID.

The S1 internal shape preserves original event field names (`displayedDateTime`,
`sourcePrecision`). Preview-specific `birthKstMinute`, Korean display names and
`preview.candidates[i].month` fact refs belong to the later reviewed DTO adapter;
they are not invented at this internal seam. In particular, a Zhongqi minute
does not change the year/month resolution or its active Jie evidence.

## New regression coverage and remaining work

The nine new Node test cases cover pinned Lichun and Jingzhe before/at/after
witnesses; early 2026's 2025 Daxue; 2027 Xiaohan; Zhongqi non-transition;
distinct event source editions and a synthetic one-minute edition disagreement;
missing/malformed event sources; UTC/second precision, duplicate/unsorted/missing
events; deep immutability and caller mutation; and a structural sweep of all
24 modern Jie boundaries (72 query minutes).

The sweep checks branch/source/candidate consistency against the supplied corpus,
not independent astronomical accuracy. Existing tests were preserved in full.
Matrix IDs used in test names describe **S1 coverage only**: they do not certify
the future public DTO validation or rendering portions of those planned vectors.

Next independently testable slice is **S2**: pass the optional trace through
`ModernKoreanFourPillarsResolution` and its coverage-checked wrapper; add focused
Four Pillars, coverage, Gregorian/lunar parity and day/hour-policy invariance
checks. Then S3 validates/projects the public DTO, followed by S4 story/UI and real
HTTP/Chromium tests. S2–S4 are **not implemented** by this commit.

Existing consumer coverage remains 2026–2027. Historical-2000 research, official
minute/source-rights gates, production security/privacy, M3 interpretation and
the large draft PR review retain their prior independent status. No main commit,
merge, deployment or new source dataset was performed.
