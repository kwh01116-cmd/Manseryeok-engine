# M1 applied Jie S2–S4 — local execution report (2026-10-19 KST)

Status: **S2, S3 and S4 RUNTIME VERIFIED locally and pushed only to
`agent/m1-applied-jie-slice1-20261019`**. No GitHub Actions, main merge or public
deployment. These software passes do not clear source accuracy, commercial
reuse, privacy or production security gates.

## Preservation and push controls

Started with clean working tree at `d398e69eb4e756881c9dd7321456566dd9b6bb36`.
Verified ancestry of both S1 commits `b01861d` and `d398e69`, then preserved
that HEAD on the same-named GitHub work branch before S2 implementation.

Before pushes, fetched explicit remote refs and inspected workflow trees for
main, foundation and the work branch. Main has no workflow; foundation/work
have only `.github/workflows/manseryeok-check.yml`. That workflow accepts
`push` **only to `agent/foundation-20261006`**, with selected executable-path
filters. It has no pull-request or branch-creation trigger. It was not changed.
Each push named only the work ref, used an explicit expected-SHA lease, and
advanced a verified ancestor; no branch history was replaced.

GitHub's read-only Actions run list filtered to the work branch returned
`total_count: 0` after preservation and after code pushes. No workflow dispatch,
rerun, paid runner or quota workaround was used.

Remote refs verified after the S4 push:

| Ref | SHA |
| --- | --- |
| `main` | `39b6653e4f93169a4b5b51412b72d4710e9da91f` |
| `agent/foundation-20261006` | `95906e6b0d57427b69c6461bb66eb076e2076af0` |
| `agent/m1-applied-jie-slice1-20261019` (code head) | `1ebd936db4fa0d66b1cd81b2e50be3f7fae113fb` |

The subsequent report/handoff commit changes documentation only. Its final SHA
is available from the live work ref; executable evidence remains tied to the
code SHAs below.

## Exact-source results

Runtime: Node **22.23.3**, npm **10.9.9**, TypeScript **5.8.3**, Chromium
**154.0.8037.57**. Commands used `PATH=/tmp/manseryeok-node22/bin:$PATH` and
`npm_config_cache=/tmp/manseryeok-npm-cache`. No dependency, lockfile, manifest
coverage or policy default changed.

| Stage | Independently committed source | Focused Node tests | `npm run check` at that commit |
| --- | --- | --- | --- |
| S1, preceding session | `b01861dbadba2d8773c4c4fca0d9cbb0cb439968` | 12/12 | 236/236 |
| S2 | `141e6130427330888fae4c4e2c5e11b72348aa02` | 15/15 Four Pillars/coverage | **241/241 PASS** |
| S3 | `c55570eaf066a09640bec337dd7d113426e9b35f` | 15/15 preview | **249/249 PASS** |
| S4 | `1ebd936db4fa0d66b1cd81b2e50be3f7fae113fb` | 12/12 story/HTTP | **253/253 PASS** |

Every complete check includes TypeScript typecheck/build and all Node tests,
with **0 failures, cancellations, skips or todos** in its final run. S4 also
performed a fresh `npm ci --no-audit --no-fund` and
`node scripts/browser-smoke.mjs` at its exact committed SHA, both PASS.
The original 227 tests and all 9 S1 additions remain; S2/S3/S4 add 5/8/4
Node tests respectively. None were removed or weakened.

Intermediate failures were resolved before proceeding: S2's new source-rejection
test initially expected a different error wording; it now compares the exact
existing message `missing solar-term source provenance: 2027:LICHUN`. S3's
initial compiler check reported possibly undefined indexed candidates; declaring
the throwing helper as a `never`-returning function let TypeScript narrow the
already-guarded value, with no assertion bypass or compiler relaxation.

## Changed files and delivered behavior

**S2 — `141e613`:**

- `src/calendar/fourPillars.ts`
- `test/four-pillars.test.mjs`
- `test/four-pillars-coverage.test.mjs`

Passes the S1 immutable trace through Four Pillars and its coverage wrapper.
The existing lunar converter still converges on that same Gregorian calculation
path. Tests cover Lichun/Jingzhe candidate order, lunar parity, interval edges,
invalid sources and unchanged Jie evidence across explicit Zi/hour policies.

**S3 — `c55570e`:**

- `src/calendar/koreanBirthPreview.ts`
- `src/calendar/koreanMonthBoundaryTrace.ts` (new pure adapter/validator)
- `test/korean-birth-preview.test.mjs`

Adds optional `monthBoundaryTrace` without changing preview schema v1 or existing
fields. Candidate contexts add exact month fact refs and trusted Korean/Hanja
names to the retained event metadata. Validation checks counts, indices, refs,
side/time ordering, term/branch/month-stem consistency, correlated Lichun years,
exact source-event membership during projection, and copied/frozen sources.
`solarTermSourceIds` remains the corpus-wide union and is never substituted for
event evidence. Gregorian/lunar parity, independent edition labels, malformed
corpora, forged DTO fields and immutability are tested. Validation establishes
consistency, not cryptographic authenticity or source licensing.

**S4 — `1ebd936`:**

- `src/story/v0StoryProjection.ts`
- `web/index.html`
- `test/v0-story-projection.test.mjs`
- `test/chart-preview-web.test.mjs`
- `scripts/browser-smoke.mjs`

Adds optional `MONTH_APPLIED_JIE_CONTEXT` as the fourth beat; older results
retain their three original beats. The story revalidates the DTO and uses the
retained evidence, without another month resolver. Each month chapter displays
the actual active Jie, Korean standard-time published minute, exact event sources
and candidate-specific proof refs. At a boundary, before/after cards remain
separate with the published-minute uncertainty note. For 2027 Lichun, the prior
candidate uses **Xiaohan**, the later candidate **Lichun**. The general disclosure
explicitly labels the corpus source union. Rendering continues to use text nodes.

## Actual Chromium evidence

The extended dependency-free CDP smoke uses the real loopback HTTP server and
real built engine. Final result: **PASS** for Gregorian/lunar parity, all six
Lichun/Jingzhe before/at/after cases, separate candidate names/KST minutes/sources
and refs, keyboard evidence disclosure, supported-range errors, successful
boundary cards at 360/390px, and reduced motion.

Additional adversarial browser checks modify copies of live HTTP responses only:
inconsistent story refs/sources are rejected; legacy responses without the
optional trace retain original chapters; an HTML-like source string renders as
text without creating an image or executing its handler; a delayed response
cannot restore stale event evidence after an input edit. These synthetic checks
do not represent new accepted source editions or astronomical evidence.

## Remaining gates and next work

- Keep consumer support at **2026–2027**, minute-precision and private loopback.
  Historical-2000 research is not promoted by these passes.
- Commercial reuse and source-specific authority/accuracy clearance remain open;
  KASI computational records are not relabeled as official KASA minute evidence.
- This local HTTP server still requires a separate production privacy/security
  review (Host/Origin policy, CSP, request limits/timeouts, authentication and
  operational controls where applicable). There was no public deployment.
- Source-ID shape, corpus membership and DTO correlation checks do not prove a
  third party's fully fabricated but internally consistent dataset authentic.
- Next work: focused review of the additive DTO and Korean boundary copy, the
  existing EP2 computed-style issue, then separately gated U1 EP3 factual glyphs.
  Review/split the large foundation draft before any merge; no M3 strength,
  fortune or useful-god interpretation is authorized by these software results.
