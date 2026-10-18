# U1 EP3 and S4 style review — execution report (2026-10-19 KST)

Status: **RUNTIME_VERIFIED_AT_28eef27835749f5d53ac86b3a9d7b0355c91c918**.
Local-only EP3 factual classification is implemented. Commercial source rights,
public-service privacy/security, human comprehension and production release
remain separate gates.

## Branch and preserved baseline

- Continued clean `agent/m1-applied-jie-slice1-20261019` at owner-confirmed
  `1bb89f77ea44f9f90c624764b38c7cd670293371`; freshly fetched remote HEAD matched.
- Read `AGENTS.md`, roadmap, execution handoff, S1 and S2–S4 execution reports,
  and `U1_EP3_FACTUAL_EIGHT_GLYPHS_COPY_AND_TEST_PLAN_20261018.md`.
- Reviewed S4 event source/candidate references and Korean copy. The reproduced
  defect was the month chapter's CSS precedence; no additional provenance or
  Korean-copy defect was demonstrated or speculatively changed.
- Workflow inspection before pushes found no main workflow and only
  `manseryeok-check.yml` on foundation/work refs. It accepts pushes **only to
  `agent/foundation-20261006`**; no work-branch, PR or create trigger.

## Independent executable commits and actual checks

| Stage | Commit | TypeScript/build + all Node tests | Actual Chromium |
| --- | --- | --- | --- |
| S4 review/CSS | `d60417cd09c43c9d5af9e082319cfae9047fe796` | **253/253 PASS** | **PASS**, computed styles and all existing smoke cases |
| EP3 | `28eef27835749f5d53ac86b3a9d7b0355c91c918` | **261/261 PASS** | **PASS**, extended EP0–EP3 smoke |

Final exact-commit checks used Node **22.23.3**, npm **10.9.9**, TypeScript
**5.8.3**, Chromium **154.0.8037.57**. A fresh locked dependency install passed.
All final Node results: 0 failures, cancellations, skips and todos. Existing
tests were preserved; **7 EP3 projection tests + 1 HTTP test** were added.
Focused projection/story/HTTP checks passed **20/20**.

The managed environment restarted during the final browser additions. Workspace
edits and the CSS commit survived, but `/tmp/manseryeok-node22` did not. One
resumed full check/browser run used default Node 24.19.0 and also passed; this
was explicitly not treated as the final Node 22 evidence. Node 22.23.3 was
downloaded again, verified against the official SHA-256 manifest, and all checks
were repeated successfully on the committed source:

```sh
export PATH=/tmp/manseryeok-node22/bin:$PATH
export npm_config_cache=/tmp/manseryeok-npm-cache
node -e "if(process.versions.node.split('.')[0]!=='22')process.exit(1)"
npm ci --no-audit --no-fund
npm run check
node scripts/browser-smoke.mjs
```

## S4 review and CSS correction

Changed only `web/index.html` and `scripts/browser-smoke.mjs` in the CSS commit.
Before the correction, real Chromium `getComputedStyle` returned the generic
chapter background **rgb(245, 247, 242)** and border **rgb(220, 227, 219)**.
The new regression assertion failed with these actual values.

Changing the selector from `.month-chapter` to `.fact-chapter.month-chapter`
preserves the intended background **rgb(247, 250, 246)** and border
**rgb(207, 221, 208)** despite the later generic rule. Chromium asserts both
colors on the ordinary chart and both Lichun candidates, and separately checks
that the day-stem chapter keeps its original generic colors.

## EP3 files and contract

- `src/story/eightGlyphsProjection.ts` — new pure immutable eight-glyph projection.
- `src/story/v0StoryProjection.ts` — additive candidate-specific `eightGlyphs`.
- `scripts/chart-preview-web.mjs` — embeds only existing public nature metadata
  into HTML for client validation; no extra API or birth-data persistence.
- `web/index.html` — semantic candidate table, Korean labels, native evidence
  disclosure and keyboard-operable proof buttons; client consistency gates.
- `test/u1-eight-glyphs.test.mjs` — seven new projection/negative/finite-table tests.
- `test/chart-preview-web.test.mjs` — one new HTML/real-HTTP integration case.
- `scripts/browser-smoke.mjs` — expanded real-browser acceptance checks.

The existing story schema and original beat tuple remain intact. Each generated
candidate now optionally carries `eightGlyphs` (`u1-eight-glyphs-v1`), with eight
facts in year/month/day/hour and stem/branch order. Each fact names its glyph,
Korean reading, element, exact candidate `factRef`, full-pillar Hanja reference
and existing classification-table implementation reference. It reuses
`STEM_NATURE.element` and `BRANCH_NATURE.principalElement`; no element counts,
weights, strength, fortune, personality or useful-god resolver is introduced.
Invalid glyph/pillar parity/Hanja/Hangul is rejected before projection.

No new classical rule ID is claimed: the evidence refers explicitly to the
existing implementation tables, with `CALCULATED_CLASSIFICATION_ONLY`, preview
version and explicit time policies. Lunar conversion and astronomical event
provenance retain their existing separate meanings.

The frontend validates all eight facts against the actual preview and the same
static nature metadata, including valid-but-wrong element labels. It accepts
legacy responses without the optional chapter. Lichun candidates each keep
their own eight facts and equal table structure; swapped chapters are rejected.
The chapter uses the spec's factual Korean disclaimer and boundary caveat.

## Browser acceptance and limits

Actual Chromium with live local HTTP passed:

- **EP3-01–03:** eight ordinary labels, equivalent lunar output, and sixteen
  labels in two independent Lichun chapters with correct candidate namespaces.
- **EP3-04–06:** stale asynchronous response rejection, date/time/policy edit
  invalidation, unsupported coverage removal, and forged index/ref/glyph/nature/
  lookup/version/count/policy rejection, including swapped Lichun chapters.
- **EP3-07:** 320/360/390px successful boundary cards without viewport overflow
  or clipped element labels; all eight proof buttons per candidate at least
  44px in both dimensions.
- **EP3-08:** native Tab order, Enter proof activation, focus transferred to
  the exact fact, valid control targets, and Chrome accessibility tree table/
  row-header/button names. **VoiceOver/NVDA manual testing was not performed**.
- **EP3-09:** reduced motion plus system-font rendering and no external font
  requests. Text labels carry the information independently of color.
- **EP3-10:** fresh-profile local/session storage, cookies, IndexedDB and cache
  storage empty; observed browser network requests remained on the loopback
  origin. Server remains read-only with no new input logging or telemetry.

The independent fixed Node oracle checks all 22 glyph classifications over all
60 valid pillars in each role, plus frozen copies and policy-dependent real
glyph changes. Browser tampering checks use modified copies of live responses;
they are not additional source editions or source-authentication evidence.

## Remote delivery and next priorities

Both executable commits were pushed using **ordinary fast-forward `git push`**
to the current work ref only. No force option, branch rewrite, Actions dispatch,
main/foundation push, merge or public deployment was performed. Read-only GitHub
Actions listing for the work branch returned **0 runs** after the code push.
Main stayed `39b6653e4f93169a4b5b51412b72d4710e9da91f`; foundation stayed
`95906e6b0d57427b69c6461bb66eb076e2076af0`.

Next: human Korean comprehension and real assistive-technology review; maintain
the independent Korean calendar authority/source-rights and production
privacy/security gates; review/split the large foundation draft before any
integration. EP4/EP5 require separately scoped M2 provenance/policy validation.
Consumer coverage stays 2026–2027 and M3 interpretation remains blocked.
