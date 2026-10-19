# U1 EP0–EP4 UI review and EP5 readiness — 2026-10-19

**Scope:** review and planning only. EP4, executable files, existing tests and PNG bytes are unchanged. No EP5 implementation, public API promotion, deployment, merge or Actions run.

## Baseline and delivery

- Freshly fetched local/remote work HEAD: `b7f510fa88dbc7a8b31718f85a1ebfb0e0bdaf16`, branch `agent/m1-applied-jie-slice1-20261019`.
- Executable tree remains that of `13538952676159f5169142b0939bbe827565f320`; EP4 backend `2d7eab7ce58bad360882b0d18f1b5f26caa16d93` is retained.
- Protected refs observed: main `39b6653e4f93169a4b5b51412b72d4710e9da91f`, foundation `95906e6b0d57427b69c6461bb66eb076e2076af0`. Re-fetch before any later operation.
- The four existing real Chromium PNGs were displayed as native image results in the Codex conversation, rather than supplied only as filesystem paths. File-panel open requests were also sent; the app returned `queued`, which is **not** confirmation that the user's panel opened. No external image host was used.
- Originals remain outside Git at `/workspace/scratch/manseryeok-ep4/`. These are the previous actual CDP captures, not new captures, mockups or edited images. They use synthetic examples, not personal birth records.

| Original PNG | Dimensions | SHA-256 |
| --- | --- | --- |
| `ep3-ep4-normal.png` | 494×1072 | `bbe98e91ef09a3425ee20682a07e00d135860fbb4a0cb72331d597583bf2c99d` |
| `ep4-expanded.png` | 494×1028 | `d3028909386795a0899b5e201481ae04ba27e1aa13b84417157bd7ab46c0643d` |
| `lichun-two-candidates.png` | 532×4162 | `cb8c593db648647b5f673cc36ca05a1a58a7079cbd031c486a530e9aabbecf7e` |
| `mobile-390.png` | 390×4276 | `29488a967883f08a460655e472ff7805ade153114784ec656eb81fd7c0ff41e3` |

## Review method and limits

Inspected all four PNGs, the live loopback page, DOM, computed styles and the Chromium accessibility tree. Re-ran the unchanged browser smoke with Node **22.23.3** and Chromium **154.0.8037.57**. A temporary CDP measurement script outside Git collected font sizes, inherited backgrounds, sRGB contrast, layout positions and native disclosure behavior at 320/360/390/768/1280 CSS px. The synthetic ordinary chart is Gregorian 2027-02-05 12:00 with the explicit hidden-stem policy; boundary smoke uses 2027-02-04 10:46 KST.

This is an engineering review, **not** a Korean participant comprehension study, a full WCAG audit, or manual VoiceOver/NVDA testing. No claim is made about actual screen-reader announcements, virtual-cursor order or mobile assistive touch. Temporary helper errors (profile cleanup before Chromium exit, then an incomplete CDP Enter event sequence) were corrected outside the repo and the measurement run completed successfully; neither was a product-code failure. The unchanged repository browser smoke passed independently.

## EP0–EP4 information order and Korean explanation

Actual order is input/policies → four pillars → EP1 day master → EP2 month/Jie → EP3 eight glyphs → optional EP4 → general calculation evidence (EP0). At a boundary the complete candidate 1 card precedes the complete candidate 2 card, followed by shared EP0 evidence.

| Area | Observed result | Follow-up, without changing EP4 in this task |
| --- | --- | --- |
| Information order | EP1→EP4 adds concepts progressively; EP4 starts collapsed. The EP0 “왜 이렇게 계산됐나요?” control is far below the results. At 390px with all EP4 details closed its document y is **3447.56px**. | Add a clearly named jump link to calculation evidence near the result heading; retain the full evidence and independent candidate cards. Do not claim the current page presents EP0 first. |
| EP1/EP2 copy | Day-master labels and month classification are distinguished from strength. EP2 names the actual applied Jie and KST published minute with event-specific source, separately from corpus-wide metadata. | “일간”, “절입”, “민간시”, and “본기” still need comprehension testing with readers unfamiliar with the terms. Consider a short first-use gloss. |
| EP3 | Eight actual glyphs, Korean readings and five-element labels remain legible as text, with role headings and per-candidate proof. Count is not presented as strength. | Keep the plain-language limitation beside the labels. Do not introduce scores or a winner candidate. |
| EP4 | All four branches disclose members, Korean/Hanja, MAIN_QI/OTHER, and ten gods relative to the displayed candidate's day master. Explicit text distinguishes traditional membership, modern main-qi order and personal inference. | Keep the current caveats. Raw policy/source IDs and Chinese book titles are difficult for beginners; later add Korean source titles/edition labels while preserving the exact technical identifiers. |
| Two Lichun candidates | Both cards use the same structure/scale. Candidate-specific year/month branches, source references and EP4 members stay separate; no default winner is shown. | Long stacked cards make comparison slow on mobile. A later candidate index/jump control may help; it must retain both candidates and avoid mixing their facts. |

No newly demonstrated calendar, Korean-name or hidden-stem/ten-god computation error was found during this review. This does not independently authenticate source editions or validate the traditional rules' effects.

## Mobile and disclosure accessibility

| Measurement | Result |
| --- | --- |
| 320 / 360 / 390px document scroll width | **320 / 360 / 390px**, both closed and all EP4 details expanded; no horizontal page overflow in these cases |
| Total height, all EP4 details closed | 4120 / 3927 / 3797px respectively |
| Total height, all EP4 branch/member proofs expanded | 10554 / 9133 / 8524px respectively; advanced evidence is very long |
| EP1/EP2 explanation / source-reference font | **12px / 11px**; EP2 Jie source is 11px |
| EP3/EP4 body / branch summary / member-proof summary | **12px / 13px / 12px** |
| EP4 policy footnote computed size | **12px**: the `.hidden-stems p` selector takes precedence over the 11px class rule; report computed size, not just the declaration |
| Sampled body/source text contrast | Minimum **4.503:1**; EP4 muted text **4.679:1**. This sample is not a whole-page contrast audit. Small size remains a usability concern even when contrast meets 4.5:1. |
| EP4 branch/member-proof summary targets | At least **44px** high in the existing smoke; measured representative controls 44px |
| Native disclosure keyboard | Enter opens the branch; Space opens member proof; focus stays on the activating summary. AX names include candidate + pillar + branch/member and expanded state. |
| Reduced motion | `prefers-reduced-motion: reduce` matched; **0 active document animations** observed |

Confirmed UI follow-ups, **left unchanged per the owner's preservation request**:

1. **Calendar radio focus visibility:** focused `input[name=calendar]` matches `:focus-visible` but has `opacity:0`; its visible parent label has no focus outline or shadow. The selected tab color does not distinguish keyboard focus. Add a visible `label:has(input:focus-visible)` treatment and a regression check in a separately scoped UI fix.
2. **Custom proof focus contrast:** EP4 proof outline `rgb(120,161,138)` against `rgb(250,251,249)` measures **2.785:1**. Focus is visible, but this is below the 3:1 non-text contrast target. Darken the indicator and test its adjacent backgrounds; do not label overall accessibility as passed now.
3. **Reading load:** 11–12px explanatory text and long machine paths wrap without overflow, but create small, dense mobile reading. Evaluate 14–16px explanatory text and human-readable source summaries separately, keeping technical paths inside expanded evidence. Font-size preference alone is not asserted as a WCAG failure.

**UNVERIFIED:** VoiceOver, NVDA, actual pronunciation of Hanja/ten-god terms, screen-reader live-region behavior, user comprehension, device/browser combinations beyond this Chromium run, and a full zoom/high-contrast audit. The proposed blueprint comprehension threshold (>1 in 5 misunderstanding strength/fortune) has **not** been measured.

## EP5 rules, sources and policies reviewed

Read the EP3–EP5 scene blueprint, M2 v2/v3 contract documents, raw-pair and triad source gates, rule/policy gaps register, `chartFactsV1/V2/V3.ts`, `branchRelations.ts`, `triadMemberships.ts`, their four Node test files and the existing EP4 projection boundary.

| Contract | Required explicit policy | Source and semantic boundary |
| --- | --- | --- |
| M2 v1 base, inherited by v2/v3 | `M2-HIDDEN-STEMS-CLASSIC-MEMBERS-MAINQI-V1` | Classical membership vs modern main-qi order; not weights or strength |
| M2 v2 raw pairs | Above + `M2-BRANCH-RELATIONS-YHZP-PAIRS-LIUPO-2026-V1` | All six distinct position pairs; preserve every overlapping hit, XING direction and both exact pillar refs. Four occurrences of 辰 yield six positional self hits; a single occurrence cannot hit itself. |
| M2 v3 triad members | Above two + `M2-TRIAD-FOUR-SANHE-FOUR-SANHUI-MEMBERSHIP-V1` | Two vs three **distinct** expected members; every original occurrence index/role/ref and missing members; membership is not activation. Blueprint shorthand “2 explicit policies” applies to v2; **v3 requires three**. |

Exact per-kind sources must remain distinct:

- LIUHE → `CLASSIC-YUANHAI-ZIPING-LIUHE`, LIUCHONG → `CLASSIC-YUANHAI-ZIPING-XIANGCHONG`, LIUHAI → `CLASSIC-YUANHAI-ZIPING-XIANGCHUAN` (classical 穿 mapped to the selected modern 害 label), XING → `CLASSIC-YUANHAI-ZIPING-XIANGXING`.
- LIUPO → `MODERN-CLARIFYHK-LIUPO-LIUREN-COMPARISON-2026`, explicitly a modern comparison, not an uncontested classical 四柱 source. Never attach all policy source IDs to one hit as though each supported it.
- SANHE → `CLASSIC-YUANHAI-ZIPING-LUN-SHIERZHI-SANHE`; SANHUI → `MODERN-CLARIFYHK-FOUR-SEASONAL-SANHUI-2026`.
- Only two-member SANHE subtype facts additionally carry `MODERN-CLARIFYHK-SANHE-PARTIAL-MEMBER-CATEGORIES-2026`. Do not assign this source universally to complete groups or SANHUI.
- `BIRTH_AND_TOMB_NOT_HALF_TRINE` must not be translated as established 半合. Partial SANHUI is just partial member presence. The classical source's separate **辰戌丑未 four-member earth group remains excluded**, explicitly, pending its own rule and source review.

All profiles are conditional and school dependent. No efficacy, conflict winner, 三刑 completion, 合化, strength, fortune or personal interpretation is supported. No new rule table is needed for the reviewed raw-pair/member scope. Critical-edition comparison, web-edition reuse rights, calendar commercial rights, human Korean comprehension and production privacy/security remain open release gates; no source websites or permissions were independently re-authenticated in this task.

## EP5 readiness: source-validation boundary must be strengthened first

**Decision: GO for this design/review; HOLD direct EP5 UI/API connection.** No new contradiction was found in the reviewed finite lookup tables or explicit policy selection. However, the inherited M2 input validation is not a source-authenticity boundary and must not be presented as one.

Reproduced outside Git against the unchanged compiled code:

1. Produce a genuine M1 preview for Gregorian 2027-02-05 12:00 using the existing fixture converter/events/coverage manifest.
2. Change only `preview.solarTermSourceIds` to `['FORGED-NONEMPTY']`.
3. Call `deriveM2ChartFactsV2` with its two supported policies; call `deriveM2ChartFactsV3` with its three supported policies.
4. **Both return `READY`, preserving `['FORGED-NONEMPTY']`.** The existing v2/v3 “forged source” tests exercise an empty source list, not this nonempty unknown ID.

`deriveM2ChartFacts` checks nonempty strings and then copies them. V2/v3 inherit that trust assumption. The present HTTP server computes M1 internally; this probe does **not** establish an externally exploitable request path, and EP4 was not changed. It does demonstrate why passing current tests is insufficient justification for trusting arbitrary M2 DTOs in a new EP5 response bridge. Matching two DTOs that contain the same forged ID is not source authentication.

Before EP5 screen work, define and test the server trust boundary against the selected trusted calendar fixture/edition context. Validate actual event evidence separately from corpus source lists, and compare versioned M2 facts to the **same** M1 candidate. Do not fix this by silently replacing the bad source, recomputing M1, weakening the contract, or hard-coding every source as KASI.

## Smallest next unit and conditional implementation plan (NOT implemented)

**EP5-G0: source/candidate validation contract only, server-side and without HTTP/UI changes.** This is the first recommended independently testable unit because of the reproduced gap. It should reject unknown/missing/mismatched source edition/context, incorrect policy/schema and cross-candidate facts. Define the trusted context from the current server's selected manifest/fixtures, not from request-supplied declarations. Keep event-level Jie evidence and corpus-level IDs separately typed/checked. Reuse the existing domain functions and M1 output; no second calendar resolver or invented rule.

After G0 passes and a separate implementation task is authorized:

1. **EP5-S1, v2 server-only projection:** opt-in raw pair evidence DTO from the already-computed M1 + one v2 derivation. Require hidden-stem and pair policies, with absent opt-in preserving V0/EP0–EP4. Return only candidate identity, four source pillar labels/refs, per-hit kind/orientation/index/roles, exact rule/source IDs, policies, and a result-addressable `factRef`. Distinguish a path into the returned payload from a pre-projection `chartFacts` path. Validate a supplied v2 projection against the trusted context and canonical existing collector; copy/freeze, do not mix candidate facts. No public route or page in this unit.
2. **EP5-S2, small text-first pair UI:** after S1 tests, explicitly opt in and render independent relation cards/native disclosures. Show all overlaps and Korean from/to roles. No winner line, UI rule calculation, default school or v3 promotion. Add a textual fallback before considering a graph. Require human Korean copy review before describing the screen as comprehensible.
3. **EP5-S3, separately gated v3 membership:** require the third policy, preserve all three expected members, all occurrences and absent-member labels; keep partial categories/modern sources and four-earth exclusion explicit. Do not silently extend S1 into a complete EP5 chapter.

### Planned tests and completion gates

| Unit | Required tests before commit/advancement |
| --- | --- |
| G0 validation | Nonempty unknown source (the reproduced counterexample), empty/missing/wrong-typed source, plausible but wrong known edition, mismatched event vs corpus provenance, lunar source mismatch; missing/AUTO/unsupported policies and wrong schema; Gregorian/lunar valid controls; blocked/invalid inputs produce no facts. Do not claim self-consistency alone authenticates a source. |
| S1 v2 projection | Real Gregorian/lunar equality with separate conversion provenance; 2027 Lichun 10:46 two independent candidates; swapped candidate/index/ref/branch/role/source rejected; exact per-kind source IDs (including modern LIUPO), result factRefs resolve; 0/1/2/3+ overlaps, 巳申 合+破+刑, 寅亥 合+破, directional/reverse/bidirectional XING, one vs four repeated branches and nonadjacent pillars; immutable snapshots and no M1 rerun. Retain independent upstream 12×12 oracle. |
| S2 browser | Absent opt-in leaves old API/screens working; forged/missing/swapped server payloads fail closed; input/policy edits and stale responses clear old results; 320/360/390px, text fallback, keyboard Enter/Space/focus, reduced motion, source disclosures, no color-only direction; fix/verify visible calendar focus and custom indicator contrast in a separate UI unit. Manual VoiceOver/NVDA and participant comprehension remain distinct gates. |
| S3 later | Two vs three distinct members, duplicates and all occurrence refs, missing member never invented, partial modern source only where applicable, full+partial overlaps retained, four-earth group not assumed, candidate namespaces and all three policy choices; retain existing 12⁴ oracle. |

Any executable unit requires Node 22 `npm run check`, relevant actual Chromium tests for UI/API changes, exact code SHA and independent commit before moving on. Failed gates are corrected before the next unit. Neither these planned cases nor EP5 itself are marked implemented/passed.

## Checks actually run in this review

- Node 22.23.3: `npm run typecheck` **PASS**; `npm run build` **PASS**.
- `node --test test/m2-branch-relations.test.mjs test/m2-chart-facts-v2.test.mjs test/m2-triad-memberships.test.mjs test/m2-chart-facts-v3.test.mjs`: **29/29 PASS**, 0 fail/cancel/skip/todo. These are existing tests, **not 29 additional tests**.
- Unchanged `node scripts/browser-smoke.mjs`: **PASS**, actual loopback Chromium EP0–EP4, Gregorian/lunar, boundary candidates, malformed/swapped responses, keyboard/AX, 320/360/390, stale invalidation and reduced motion.
- Supplemental UI metrics and the nonempty forged-source probe completed. The latter confirms a **gap**, not a successful rejection.
- `npm run check` was **not re-run for these documentation-only edits**. The last full-suite result remains **269/269** on executable SHA `13538952676159f5169142b0939bbe827565f320`; do not call this a new full-suite execution.
- Documentation validation: whitespace/diff checks, local Markdown links and an allowed-files check; no executable/test/workflow/PNG changes. Final commit SHA and remote delivery are recorded in Git history and the task result, avoiding a self-referential SHA in this file.

Before the ordinary push, re-fetch all three refs and inspect workflow triggers. The work-branch workflow currently triggers only `push` to `agent/foundation-20261006` on executable paths; this docs-only work-branch push matches neither. No workflow edits, Actions dispatch, force push, main/foundation update or deployment is permitted.
