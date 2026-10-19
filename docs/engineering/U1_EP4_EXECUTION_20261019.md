# U1 EP4 — hidden stems and ten-god disclosures (2026-10-19 KST)

Status: **RUNTIME_VERIFIED_AT_13538952676159f5169142b0939bbe827565f320**.
Private loopback implementation, no merge/public deployment or source-rights clearance.

## Checkout and independent delivery slices

- Clean approved branch `agent/m1-applied-jie-slice1-20261019` initially at
  `87478bb`; remote was the owner's `9423794e5d01d2b5ac474019aef8bcfb57773d7b`.
  Updated by `git merge --ff-only`, without overwriting a divergent branch.
- Read updated AGENTS, concise handoff, roadmap, EP3–EP5 blueprint and M2 hidden
  stem source gate in the requested order; inspected the four existing M2 modules.
- Reverified baseline: Node 22, **261/261** Node tests and actual Chromium EP0–EP3 PASS.
- Server/contract commit **`2d7eab7ce58bad360882b0d18f1b5f26caa16d93`**:
  explicit opt-in projection, seven new Node cases plus one HTTP case;
  focused **13/13**, complete **269/269** PASS before UI progression.
- UI/browser commit **`13538952676159f5169142b0939bbe827565f320`**:
  policy selector, candidate disclosures, client consistency checks, expanded
  native Chromium test and optional PNG output. Complete **269/269** and browser PASS.

Final exact-code runtime: **Node 22.23.3, npm 10.9.9, TypeScript 5.8.3,
Chromium 154.0.8037.57**. Fresh lock install, typecheck/build and all tests passed,
with **0 failures/cancellations/skips/todos**. No old test was removed or weakened.

```sh
export PATH=/tmp/manseryeok-node22/bin:$PATH
export npm_config_cache=/tmp/manseryeok-npm-cache
node -e "if(process.versions.node.split('.')[0]!=='22')process.exit(1)"
npm ci --no-audit --no-fund
npm run check
EP4_SCREENSHOT_DIR=/workspace/scratch/manseryeok-ep4 node scripts/browser-smoke.mjs
```

Intermediate issues fixed before the final contract commit: TypeScript's array
guard widened a callback value; an explicit `M2CandidateFacts` parameter retained
the checked type. A new synthetic-day test wrongly expected Feb 5's 乙 on the
Feb 4 Lichun input (甲); fixed it to use genuinely distinct 甲/丙 synthetic
candidate witnesses. A local unpublished draft was corrected before delivery;
no force push or remote history replacement occurred.

## Minimal contract and data flow

The request may explicitly include
`hiddenStemPolicyId: "M2-HIDDEN-STEMS-CLASSIC-MEMBERS-MAINQI-V1"`.
Omission produces the original V0 preview/story and **no EP4**. A supplied empty,
unknown or non-string policy returns 422; no fallback policy exists. Unsupported
births still return their original blocked status without an EP4 chapter.

The server computes M1 **once**, then reuses `deriveM2ChartFacts` on that same
result. The new projection retains only the four branch membership lists and
their ten gods, day master, policy, rule/source metadata and proof references.
The server checks the consumed M2 values against the existing
`branchTenGodFacts` primitive; it adds no hidden-stem array, ten-god algorithm,
calendar lookup or alternative school profile. Names are Korean text translations.

An optional top-level `ep4` payload (`u1-hidden-stem-chapter-v1`) contains:

- M2/source-preview versions, `TRADITIONAL_RULE_LOOKUP_ONLY`, selected policy,
  rule IDs, exact classical/modern profile source IDs, time policies and confidence.
- Separate candidates with matching indices, day-master fact refs and four
  original pillar Hanja labels for candidate binding.
- Four branches with the actual M1 branch ref, source rule/policy/IDs and ordered
  members, each carrying Hanja/Hangul, MAIN_QI/OTHER and M2-computed ten god.
- `factRef` addresses an actual `ep4.candidates[i].branches[j].members[k]` record
  in this response. `m2FactRef` records the **pre-projection** ChartFacts v1 path
  (`chartFacts.candidates[i].pillars[j].branchTenGods.members[k]`), explicitly
  labeled as such in the disclosure; the full unneeded ChartFacts object is not sent.

All projected arrays/objects are frozen copies. Calendar/lunar provenance remains
in the unchanged preview, distinct from classical member and modern MAIN_QI sources.

## UI and validation

The optional selector starts unselected and examples reset it to unselected.
Each candidate's EP4 has four native branch `<details>` elements and per-member
native proof disclosures. Titles, Korean names, the candidate's day-master basis,
MAIN_QI/OTHER, ten gods, policy, rule/source IDs and actual/source fact refs are
available in text. MAIN_QI is never a qi proportion or strength ranking.

Client checks bind all indices, original pillars, day master, branches, member
positions, policy, source lists, labels and refs to their candidate and the
existing static rule metadata. The browser **does not recalculate ten gods**;
semantic ten-god validation belongs to the server's M2 primitive. It does not
authenticate an independently fabricated but internally consistent dataset.
Missing selected output, unsolicited output, malformed metadata and swapped
Lichun candidate chapters are rejected before rendering any candidate.

## Changed executable files

| File | Change |
| --- | --- |
| `src/story/hiddenStemChapter.ts` (new) | Immutable minimal M2-to-EP4 projection and validation |
| `scripts/chart-preview-web.mjs` | Optional policy, unchanged M1 path, EP4 response and static rule metadata |
| `web/index.html` | Explicit selector, candidate-safe disclosures and source checks |
| `test/u1-hidden-stem-chapter.test.mjs` (new) | Seven contract/negative/finite-domain tests |
| `test/chart-preview-web.test.mjs` | Opt-in/blocked/parity and shared metadata HTTP verification |
| `scripts/browser-smoke.mjs` | EP4 browser acceptance and native PNG capture |

No dependency, workflow, calendar fixture, public date coverage, account or
birth-data persistence change. The four existing domain/ChartFacts modules remain unchanged.

## Executed acceptance

- All 12 branch member lists, ten day masters, canonical `tenGod` agreement;
  missing/invalid policy and corrupt source/member/position/ten-god rejection.
- Actual Gregorian/lunar parity and before/at/after Lichun. Both boundary
  candidates keep their own month branches (丑/寅) and fact namespaces.
- Real browser policy selection/deselection, default old behavior, source refs,
  Enter branch expansion, Space proof expansion, retained focus and AX names.
- Successful 320/360/390px layouts with **all branches/proofs expanded**, no
  horizontal viewport overflow; native targets at least 44px high.
- Forged policy/source/day-master/member/ref, missing chapter, unknown ten god
  and swapped candidate response rejection; date/time/day-policy/EP4-policy edits
  and delayed responses cannot retain stale facts.
- Reduced motion, system fonts, all original EP0–EP3 checks. Fresh browser
  storage remains empty and observed requests remain on the loopback origin.

## Actual PNG artifacts (not committed)

Captured by Chromium CDP `Page.captureScreenshot` at the exact final code SHA.
These are direct browser captures/crops of the existing synthetic example, not
composited mockups or personal birth records. Screenshots live **outside the repo**:

- `/workspace/scratch/manseryeok-ep4/ep3-ep4-normal.png`
- `/workspace/scratch/manseryeok-ep4/ep4-expanded.png`
- `/workspace/scratch/manseryeok-ep4/lichun-two-candidates.png`
- `/workspace/scratch/manseryeok-ep4/mobile-390.png`

Ordinary/detail/mobile captures were visually inspected in addition to browser
assertions. The mobile image is a real 390px full-page capture; desktop crops
show the requested EP3/EP4 or candidate content, without image synthesis.

## Remote and remaining gates

Before code push, freshly inspected main/foundation/work workflow trees and the
actual trigger: only pushes to `agent/foundation-20261006` match. Used ordinary
fast-forward push to the approved work ref only; code head read back as
`13538952676159f5169142b0939bbe827565f320`. GitHub read-only Actions listing: **0 runs**.
Main remained `39b6653e4f93169a4b5b51412b72d4710e9da91f`, foundation
`95906e6b0d57427b69c6461bb66eb076e2076af0`. The report/handoff successor is docs only.

**Unverified:** manual VoiceOver/NVDA, human Korean comprehension and external
usability review. Chrome AX/keyboard automation is not a substitute for those.
**Open:** classical transcription/edition criticism, modern ordering's school
dependence, calendar commercial reuse, and production Host/Origin/CSP/limits/
timeouts/privacy/security. No public release clearance or predictive efficacy
follows from these tests. Preview stays private and supports 2026–2027.

Next: human source/language/accessibility review and a separately scoped EP5
raw branch-relation projection using explicit M2 v2/v3 policies, after its source
gate review. Preserve large-foundation-PR review/split and the M3 no-go boundary.
