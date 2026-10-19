> **Status navigation (2026-10-19):** This roadmap retains milestone and historic engineering checkpoints. For the *current* short handoff, see [EXECUTION_HANDOFF.md](EXECUTION_HANDOFF.md); for stable agent rules, see [AGENTS.md](../AGENTS.md). Old checkpoint sections remain historical evidence, not permission to skip checks or publish. Verify live GitHub refs before acting.

## Latest review checkpoint — 2026-10-19, EP4 preserved / EP5 validation gate

- Documentation-only review from work HEAD `b7f510fa88dbc7a8b31718f85a1ebfb0e0bdaf16`; EP4 code remains `13538952676159f5169142b0939bbe827565f320`. Existing four actual Chromium PNGs displayed as native Codex image results, outside Git. See [UI review and EP5 readiness](engineering/U1_EP0_EP4_UI_REVIEW_AND_EP5_READINESS_20261019.md).
- Actual Chromium EP0–EP4 smoke re-run PASS, 320/360/390px no horizontal overflow; keyboard/native details/AX and reduced motion verified. Supplemental measurements found hidden calendar-radio focus, custom outline contrast 2.785:1, small 11–12px explanatory text and late EP0 evidence discovery as follow-ups. EP4 was left unchanged. Manual VoiceOver/NVDA and participant comprehension are **UNVERIFIED**.
- Typecheck/build and **29/29 existing M2 tests PASS** in this review. Full-suite checkpoint remains **269/269** on the executable SHA above; no new full `npm run check` execution is claimed for docs edits.
- **EP5 direct UI/API connection HOLD:** v2/v3 accept a nonempty unknown M1 source ID (`FORGED-NONEMPTY`) as `READY`; they assume trusted upstream input. First next unit: trusted fixture/edition-context and candidate validation contract/tests, without an API/UI addition or M1 rerun. Then, if independently verified and authorized, a server-only v2 pair projection → small text-first pair UI → separately gated v3 membership. V2 requires two explicit policies, v3 three. Exact per-hit classical/modern sources, overlaps, candidate refs and four-earth exclusion remain mandatory. No EP5 feature was implemented in this task.
- Calendar reuse rights, source editions, production security/privacy, human comprehension/accessibility and large-PR integration remain open. No Actions, main/foundation update, force push, merge or public deployment.

## Latest local execution checkpoint — 2026-10-19 KST, U1 EP4 opt-in member/ten-god display

- Continued approved work branch from `9423794e5d01d2b5ac474019aef8bcfb57773d7b`. Backend contract `2d7eab7ce58bad360882b0d18f1b5f26caa16d93`, UI/browser `13538952676159f5169142b0939bbe827565f320`; ordinary fast-forward push only, Actions listing 0 runs, no main/foundation changes.
- EP4 reuses ChartFacts v1 and existing hidden-stem/branch-ten-god primitives, requires explicit `M2-HIDDEN-STEMS-CLASSIC-MEMBERS-MAINQI-V1`, and retains per-candidate member/source/fact references. Four native branch disclosures show Korean/Hanja, MAIN_QI/OTHER and ten gods relative to that candidate's day master. No calendar rerun, new rule/profile, strength, qi proportion or prediction.
- Exact final code SHA: fresh Node 22 lock install, TypeScript/build and **269/269 Node PASS**, 0 fail/skip; actual Chromium EP0–EP4 PASS including Gregorian/lunar, Lichun alternatives, invalid/swapped payloads, input/stale invalidation, 320/360/390px, keyboard/AX and reduced motion. Four native browser PNGs are available outside the repository.
- Evidence: [EP4 execution report](engineering/U1_EP4_EXECUTION_20261019.md). Manual VoiceOver/NVDA and human comprehension remain unverified. Classical edition/source criticism, modern ordering's school dependence, commercial calendar rights and public-service security/privacy remain open.
- Next: human source/language/accessibility review, then a separately scoped EP5 raw-relation chapter using explicit M2 v2/v3 policies after its source gate. Large foundation-PR split/review remains required before integration; M3 and public release remain blocked.

## Latest local execution checkpoint — 2026-10-19 KST, S4 review/CSS + U1 EP3

- Separate work branch `agent/m1-applied-jie-slice1-20261019`, continued from `1bb89f77ea44f9f90c624764b38c7cd670293371`; no main/foundation update, Actions or force push.
- S4 month-style regression reproduced with Chromium `getComputedStyle` and corrected in `d60417cd09c43c9d5af9e082319cfae9047fe796`: **253/253** Node tests and browser PASS. Applied Jie source/candidate separation and Korean copy reviewed; no further demonstrated defect bundled.
- **U1 EP3 local engine/UI GREEN** at `28eef27835749f5d53ac86b3a9d7b0355c91c918`: candidate-specific eight glyphs and existing traditional element names, exact fact refs and native proof controls. Original beat/schema contracts retained; no strength, fortune, personality or useful-god inference. Fresh Node 22 locked install, typecheck/build and **261/261** Node tests PASS, 0 fail/skip; actual Chromium EP0–EP3 PASS.
- Browser checks include Gregorian/lunar parity, sixteen labels for two Lichun candidates, malformed/swapped chapter rejection, 320/360/390px, keyboard and accessibility-tree structure, reduced motion/system fonts, source text safety, stale/date/time/policy invalidation and no browser persistence/external requests. Manual VoiceOver/NVDA and human Korean comprehension review remain open.
- Full source/file/runtime evidence: `engineering/U1_EP3_EXECUTION_20261019.md`. Exact executable evidence belongs to the code SHA above; later report commits are docs only. All delivery uses ordinary fast-forward pushes to the work branch.
- Next priorities: human meaning/accessibility review, independent M1 source-authority/commercial-rights and production privacy/security clearance, and large foundation-PR review/split. EP4/EP5 stay separately scoped to verified M2 source/policy gates. No consumer year expansion, public release or M3 implementation is implied.

## Additional offline research checkpoint — 2026-10-18 (actual code review + executable slice plan)

- **GitHub Actions remains PAUSED by owner report.** This revision is documentation-only and has **no new executable-test evidence**.
- **Static code audit** of current files found nine follow-up items: `monthPillar.resolveMonthBranchAtJie` already retains exact Jie event objects but `yearMonthPillars` drops them (P1 data-provenance gap); localhost `chart-preview-web.mjs` must not be promoted to production without HTTP origin/host, privacy, request-timeout, CSP and limits (P0/P1 production gates); CSS `.month-chapter` style precedes the generic `.fact-chapter` and may be overridden (P2 UI regression target). See `docs/review/STATIC_CODE_FINDINGS_20261018.md`; these findings came from static source inspection, NOT a browser security test.
- **M1 applied Jie delivery S1–S4** defined by actual call graph: retain event object in `yearMonthPillars` → pass through checked `fourPillars` → add source-specific optional preview DTO → show the sourced Korean named Jie in U1. Add deterministic vectors at each stage. Do NOT recompute the solar-term lookup in UI.
- **KASI data.go.kr API 15012679** directly inspected: REST XML `getLunCalInfo` + Gregorian date params, lunar fields, leap flags and `lunIljin`, but **no verified minute-of-24-Jie field**. It is a candidate **daily lunar source**, NOT a replacement for exact KST solar-term instants without another source. See `docs/research/KASI_OPENAPI_15012679_FIELD_SCOPE_REVIEW_20261018.md`.
- **U1 EP3** factual eight-glyph/five-element Korean copy + candidate-specific proof refs and ten acceptance cases specified as a future isolated UI slice. See `docs/product/U1_EP3_FACTUAL_EIGHT_GLYPHS_COPY_AND_TEST_PLAN_20261018.md`. No strength/fortune claims.
- **Priority order on runner restoration:** 1) small CSS fix + computed-style smoke, 2) M1 Jie evidence S1–S3 with tests, 3) U1 exact Jie copy/chrome, 4) U1 EP3 eight glyphs, 5) Draft PR review/split. Public calendar rights and production privacy are still release blockers.
- Last executable validation remains [Actions 39112191402](https://github.com/kwh01116-cmd/Manseryeok-engine/actions/runs/39112191402) on `891967bfd2883e4aed8296a27b96d9be8a94ee11`: 227/227 and browser pass. A docs-only SHA must not be labeled as a newly tested code build.


## Quota-paused research/specification checkpoint — 2026-10-18 (NO NEW CI / NO CODE CHANGE)

- User reports GitHub Actions monthly quota exhausted. **Only source review, evidence and design documents are authored**; no workflow trigger paths changed or pushed. See `docs/operations/NO_ACTIONS_QUOTA_OFFLINE_WORK_PROTOCOL_20261018.md`. Current observed workflow only triggers on selected executable paths, not `docs/**`, `README.md` or `AGENTS.md`.
- **NEW licensing red flag:** the authoritative KASA **2027 월력요항** official posting displays **공공누리 2유형 = attribution + noncommercial**; the KASI separately generated 2027 dataset identifies itself as not an official notice, and the distinct KASI daily lunar API on data.go.kr lists `이용허락범위 제한 없음`. Official authority, copyright of the published work, reuse of calculated facts and API field permissions are separate legal objects. Commercial-source clearance remains **OPEN/NO-GO**; this research memo does NOT say astronomic facts cannot be used commercially. See `docs/research/CALENDAR_SOURCE_COMMERCIAL_RIGHTS_GATE_20261018.md` and the provider inquiry draft (NOT SENT).
- Designed a candidate-specific **applied Jie trace** contract based on actual M1 `activeJieBeforeBoundary` / `boundaryJie`, avoiding falsely attributing one event based on whole-corpus `solarTermSourceIds`. 15 source-bound test vectors are **planned but NOT IMPLEMENTED/EXECUTED**. See `M1_APPLIED_JIE_PROVENANCE_DESIGN_20261018.md` and `M1_SOURCE_WITNESS_AND_TEST_VECTOR_MATRIX_20261018.md`.
- Specified M2 missing-rule/source policy matrix, hard **M3 strength/격국/용신 interpretation block**, and candidate-safe **U1 EP3–EP5** storyboard as documents only. No software gate is marked green by this work. See `docs/RESEARCH_PACKAGE_INDEX_20261018.md`.
- Inspected actual PR #1: **142 commits, 152 changed files**, Open/Draft. Documented A/B/C/D/E dependency-ordered split, privacy/security risks and commercial-source release blockers in `docs/review/PR1_SCOPE_SECURITY_AND_SPLIT_PLAN_20261018.md`; no split/merge executed.
- The **last runtime-verified code remains** `891967bfd2883e4aed8296a27b96d9be8a94ee11`, GitHub Actions [39112191402](https://github.com/kwh01116-cmd/Manseryeok-engine/actions/runs/39112191402), **227/227 Node + real Chromium PASS**. A docs-only later commit is NOT another runtime verification and is NOT a new release.
- Next, after execution resumes and commercial-data path is qualified: implement/test precise M1 Jie event trace, then U1 EP3 factual glyphs. Do not make the huge PR main-ready or enable historical birth years by inference.

# Execution roadmap

## Priority correction

Historical Korean time reconstruction remains a correctness feature, but it is not the critical path for the first product. The main path is now: official Korean calendar fixtures -> Four Pillars -> deterministic chart facts -> a read-only app slice -> interpretation resolvers. Historical/DST work stays isolated and returns later unless it blocks a required fixture.


## Latest verified checkpoint — 2026-10-18, U1 EP2 Jie-based month-branch chapter

- **U1 EP2 LIVE LOCAL-BROWSER CODE GREEN**: built source-addressed month-branch explanation from already-calculated M1 → U0 `MONTH_BRANCH_CLASSIFICATION` facts. Displays month branch/element, states monthly pillar transitions follow the 12 節 rather than lunar new-moon starts, and never infers month strength or a specific event timestamp.
- Gregorian 2027-02-05 / equivalent lunar 2026-12-29 and published-minute Lichun 2027-02-04 10:46 render independently sourced chapters for each correlated candidate, with `preview.candidates[i].month.branch` reference verified against the corresponding M1 branch. Stale inputs remove chapters; rejected calendar dates cannot invent one.
- Code commit `891967bfd2883e4aed8296a27b96d9be8a94ee11`, [GitHub Actions 39112191402](https://github.com/kwh01116-cmd/Manseryeok-engine/actions/runs/39112191402): **227/227 Node PASS, no failures or skips, TypeScript build PASS, actual Chromium loopback HTTP EP0–EP2 PASS** including 360/390px, reduced motion and disclosure keyboard entry.
- M2 G1–G8 remains green in research-only source/policy profile modes; EP2 does NOT expose activated 三合, disputed scores or predictive interpretations. Existing limited consumer-calendar preview remains 2026–2027, private loopback only. Full official KASA/KASI evidence and public-service privacy/licensing gates OPEN.
- **Next gate recommendation:** before U1 EP3 or exposed M2, publish a precise, source-bound **Jie event used** in M1 DTO if required for explaining the exact start minute; do not fabricate it from generic `solarTermSourceIds`. Independently, split/review the 140+ commit Draft PR before merge. No new release or production-year coverage is implied.

## Latest verified checkpoint — 2026-10-18, M2 G7–G8 + U1 EP1

- **M2 G7 source-gated 三合·三會 distinct-member lookup**: `src/domain/triadMemberships.ts`. Four classic Sanhe triplets (with separate modern partial convention) and four modern-documented seasonal Sanhui sets; explicit named policy, status `THREE_DISTINCT_MEMBERS` vs `TWO_DISTINCT_MEMBERS`, all matching occurrence indices, missing-member lists, no 化氣 inference. Includes independently pinned **all 12⁴ = 20,736** four-pillar branch sequences and duplicate counterexamples. Commit `1f7aa3dfd38868cc0c59691c84bca0f4f891bc9e`, [Actions 39096470339](https://github.com/kwh01116-cmd/Manseryeok-engine/actions/runs/39096470339): **220/220 Node tests + real Chromium green**. The additional `辰戌丑未` four-member earth group in `淵海子平` is NOT implemented; note that scope explicitly.
- **M2 G8 opt-in immutable ChartFacts v3**: `src/chartFacts/chartFactsV3.ts` composes existing M1/v1/v2 and explicit third triad policy, preserving all original year/month/day/hour facts and both published-minute boundary candidates, and adds candidate-specific member/pillar factRefs. No default policy or collapse into predictions. Commit `379e6ea28945f8deb47a86c5810234036ed16b92`, [Actions 39096678588](https://github.com/kwh01116-cmd/Manseryeok-engine/actions/runs/39096678588) **227/227 Node + real Chromium green**.
- **U1 EP1 real local browser chapter**: `scripts/chart-preview-web.mjs` returns *additive* `story: projectKoreanV0Story(output)` only on successful `/api/preview`; `web/index.html` consumes source-checked candidate DAY_STEM_CLASSIFICATION beats and renders the stem glyph, Korean five-element and yin/yang **labels only**. Gregorian/lunar parity, double Lichun candidates, stale input, keyboard evidence drawer and mobile 360/390 checked in actual Chromium. First code commit `336858c490afdd48d735d1b501186b49392ad424` had a **browser test regular-expression bug**, while all 227 Node tests passed. Corrected literal-path assertion at `d13e8d16c23e53cf44494d50e3405035b4e74051`. [Actions 39097033098](https://github.com/kwh01116-cmd/Manseryeok-engine/actions/runs/39097033098): **227/227 Node pass, 0 failure/skip, typecheck/build PASS, real Chromium EP0+EP1 PASS**. No double calendar resolver and no personal predictions.
- **Still OPEN:** official Korean minute-level historical/source-rights and consumer-year gates; 四土局, source critical editions and school variants; M2 effective transformation/scoring/interpretation (not permitted yet); production accessibility/privacy/security and visual review; UI EP2 month Jie explanation and EP3 factual element visualization; giant PR scope review. **No** public deployment, new end-user birth year, account, payment, GitHub merge or data storage. Next mainline preferably a tightly source-scoped M1 Korean official-source qualification or a small U1 EP2 with source/real-browser gate, not unverified astrology prediction.

## M2 G5–G6 verified checkpoint — 2026-10-18

- **G5 raw relationships**: `src/domain/branchRelations.ts`, source/policy-gated lookup for six 六合, six 冲, six 害/穿, six 破 and directed/reciprocal/self 刑 edges. Test `test/m2-branch-relations.test.mjs` independently pins all 12×12=144 ordered branch pairs, source IDs, 6 pillar-index pairs, overlaps (e.g. 巳申 = 合 + 破 + 刑), four 辰 self-punishment multiplicity and fail-closed input. Code commit `5465e835a2e931d208a85f055fb02cc326672c70`, [GitHub Actions 39094446372](https://github.com/kwh01116-cmd/Manseryeok-engine/actions/runs/39094446372) **206/206 Node PASS + Chromium PASS**.
- **G6 versioned ChartFacts v2**: `src/chartFacts/chartFactsV2.ts` is opt-in and composes immutable ChartFacts v1 + raw positional branch relations with explicit second policy ID; preserves every term-boundary candidate, Gregorian/lunar source and original rules. Test `test/m2-chart-facts-v2.test.mjs` covers real 2027-02-05 and 2027 Lichun, source/fact refs, blocked errors, policy spoofing and mutation. Code commit `451dd4d38e0c65b7ac052406f628189575cdfcc1`; canonical [GitHub Actions 39094664600](https://github.com/kwh01116-cmd/Manseryeok-engine/actions/runs/39094664600) **212/212 Node PASS, 0 fail, 0 skipped; TypeScript build PASS; real Chromium HTTP/browser PASS**.
- **Limits:** raw pair membership does *not* imply 合化, operative strength, 格局, 用神, relationship prediction, or full triad activation. Classical text labels and later 六破 variant carry independent source/rule IDs and school-dependent profiles. Existing `src/calendar`, consumer `/api/preview`, V0/U1 UI and 2026–2027 year limits unchanged. This is M2 **PARTIAL**, not full M2 exit or public release.
- **Next:** decide source-scoped 三合/三会/full-vs-half combination presence and additional variant profiles; publish explanatory V1/ChartFacts UI only after source/language review and real-browser tests. Separately maintain Korean KASA/KASI historical/rights validation gate and review huge Draft PR before merge.

## M2 implementation checkpoint — 2026-10-18 (four code slices, not full M2 exit)

- **G1:** `src/domain/hiddenStems.ts`, `M2-RULE-HIDDEN-STEMS-001`: twelve classical hidden-stem member lists plus explicitly school-dependent MAIN_QI convention, 4 tests. Exact verified commit `8a125c0a59c0ff15020b3dd60eeb441b56f2898d`; failed initial compiler literal widening was fixed, then Actions passed.
- **G2:** `src/domain/branchTenGods.ts`, `M2-RULE-BRANCH-TEN-GODS-001`: derive ten gods for **each** selected hidden stem for 10 day masters × 12 branches without strength/weight, 4 tests. Verified `1c3edca82809a39d01cc706b49596670c932bdb8`.
- **G3:** `src/chartFacts/chartFactsV1.ts`, `m2-chart-facts-v1`: versioned, immutable M1 Four Pillars → policy-tagged source-linked ChartFacts (both Lichun candidates, 4 roles, lunar provenance), typed BLOCKED result for unsupported inputs, 6 tests. Verified `8080461f0cfe4a51a8a221de9ace04c4286f3b94`; fixed one compile-only empty tuple widening.
- **G4:** `src/domain/twelveGrowthStages.ts`, `M2-RULE-TWELVE-GROWTH-STAGES-001`: separate explicit `陽順陰逆·火土同宮` school convention with 120-cell exhaustive table, 5 tests; **not** auto-attached to generic ChartFacts or strength calculation. Current verified head `c5603212103858d3251e50af5efce587adb0ecc4`.
- Canonical [GitHub Actions run 39093026376](https://github.com/kwh01116-cmd/Manseryeok-engine/actions/runs/39093026376) on G4 exact source: TypeScript typecheck/build **PASS**, Node **198/198 pass; 0 fail/skip**, real Chromium loopback HTTP/browser mobile/keyboard smoke **PASS**.
- **Remaining M2 exit:** source-identified raw 지지 육합·충·형·해·파 fact lookup and tests, no transformation or auspiciousness; explicit school profile differences where applicable; versioned ChartFacts integration and representative 2026–2027 actual web/UI projection. M1 legal/KASA edition accuracy gates still OPEN. V0 consumer support stays 2026–2027. No release/merge/deployment or collection of personal birth data.

## Verified live milestone checkpoint — 2026-10-18

| Lane | Gate status | Actual evidence | Next |
| --- | --- | --- | --- |
| **M0 safety** | GREEN within repo | Locked Node/TS, GitHub hosted canonical CI, 227 passing Node cases, provenance boundaries | Keep scoped checks green |
| **M1 modern Korean Four Pillars (2026–2027)** | **IMPLEMENTED / STRUCTURAL TEST GREEN**, **source-authority/reuse gates OPEN** | Gregorian/lunar input, explicit Zi policies, KASI minute corpus and independent published differentials; real API and browser smoke green | Independent Korean calendar edition rights/accuracy qualification and controlled birth-year extension |
| **M1 historical 2000** | **RESEARCH ONLY** | NAOJ 1999 Daxue + 2000 full terms; separate independent MIT lunar 1999/2000 corpus; year/month/full pillars/parity tests executed | Korean historical sourcing/licensing/precision before consumer promotion |
| **M2 deterministic ChartFacts** | **G1–G8 ENGINE GREEN**, full M2 release gate OPEN | Hidden stems, branch ten gods, 12-growth policy, raw pair relations, 8 triad member sets; immutable ChartFacts v1/v2/v3, 227/227 tests + Chromium green | Review extra classical four-member 土局, school variants and Korean use cases; do not score strength or assert transformation |
| **V0 / U0** | **GREEN for local preview / deterministic beats** | Real HTTP + fixed factual projection; no public server | Keep current API contract stable |
| **U1 EP0–EP2** | **GREEN in actual local Chromium**, NOT released | Source/policy explanation disclosure plus day-master element/polarity and month-branch Jie educational chapters; [Actions 39097033098](https://github.com/kwh01116-cmd/Manseryeok-engine/actions/runs/39097033098), mobile and boundary variants | EP2 month branch/Jie context from verified source data and comprehension-focused UI/visual QA |
| **M3–M10 / U2–U4** | DEPENDENCY BLOCKED | No inference, prediction, accounts or public deployment added | Follow original gates in order |

No evidence that a 227/227 software pass certifies astronomical source times, commercial rights or disputed Myeongli theory. Current `docs/EXECUTION_HANDOFF.md` is the authoritative immediate next-run cursor; this section supersedes the older 2026-10-10 execution cursor below.

## Milestones and gates

### M0 Repository safety
Strict TypeScript, rule/test-vector registries, dependency lock, reproducible checks, and repository-side verification.
Gate: deterministic foundation green; disputed rules require explicit policy IDs.

### M1 Modern Korea Manseryeok core
Build official KASA/KASI golden fixtures for Lichun and all twelve month-boundary 節, then year/month/day/hour pillars, lunar/solar conversion, and leap-month handling.
Gate: boundary goldens pass; randomized cycle invariants pass; differential checks against independent implementations have only documented policy differences.

### M2 Deterministic ChartFacts
Hidden stems with source IDs, branch ten gods, twelve growth stages as lookup facts, and raw combine/clash/punishment/harm/break detection without interpreting effectiveness.
Gate: exhaustive finite-table tests and immutable ChartFacts schema.

### V1 Read-only app slice
Birth date/calendar/time accuracy/place -> policy-sensitive preview -> Four Pillars -> deterministic facts -> source/policy details.
Gate: reproducible engine/policy versions; approximate/unknown time and boundary-sensitive charts are explicit.

### M3 Strength evidence
Season, root, support, drain and control evidence graph; no element-count shortcut.
Gate: 得令-but-weak, 失令-but-strong and root-quality counterexamples pass.

### M4 Pattern engine
Implement 子平真詮 families as ordered interactions and state transitions: 正官 -> 財 -> 印 -> 食神/七殺/傷官 -> 陽刃/建祿月劫.
Gate: formation/break/rescue/相神/topology fixtures pass and pattern formation is separate from quality.

### M5 Useful-god views and climate
Keep structural, balancing, climate, illness/medicine and bridging views separate. Model 窮通寶鑑 as conditional recipes and preserve body-vs-喜用提要 conflicts.
Gate: conflicting resolvers coexist without forced reconciliation.

### M6 Follow/transformation
Structural classifiers only; combination is not transformation and weakness alone is not follow.
Gate: true/false/disputed adversarial cases pass.

### M7 Da-yun/Liu-nian
Direction, twelve-節 boundary, traditional proportional start-age model and temporal overlays that rerun structural resolvers.
Gate: start-age arithmetic/boundary fixtures pass and structural change is separate from favorable evaluation.

### M8 Supplementary/Korean practice
Shen-sha remains supplementary. Add documented Korean-practice compatibility profiles.

### M9 Historical/overseas time
Finish old Korean DST/pre-1908 and overseas IANA support after M1/V1 are stable.
Gate: gaps/folds are explicit and no instant is guessed.

### M10 Production app
Explanation UX, privacy, saved charts, API/schema versioning, observability, accessibility, rollback and deployment. Account/payment/growth follow chart correctness.


## Parallel track U — explainable storytelling / mobile scroll-comic

**Priority is unchanged:** M1 accurate modern Korean Four-Pillars + V0 integration → M2 deterministic ChartFacts → verified interpretation. U is an optional, separately gated **presentation track**, not an excuse to delay exact checkout, `npm run check`, KASA/Gazette comparison, independent differential or supported-year expansion. See [product UX design and QA gates](PRODUCT_STORYTELLING_UX_ROADMAP.md).

| Track | Dependency | Deliverable | Exit gate |
| --- | --- | --- | --- |
| **U0: structured presentation mapping** | Existing M1/V0 preview contract | Map computed chart/policy/coverage/source to versioned story beats, disclosure labels, error/uncertainty states | No second computation path; chart fact → source/policy trace; unsupported inputs fail closed |
| **U1: first read-only scroll chapter** | U0 + working V0 within declared calendar support | Extend **existing** `web/` prototype: four pillars → day stem → month branch/season → deterministic five-element labels; expandable "why?" | Gregorian/lunar equivalence, Lichun 2-candidate boundary, explicit Zi policy, 360px/mobile/reduced-motion/accessibility and real-engine UI tests |
| **U2: modular ChartFacts stories** | Each respective M2 finite-table/schema gate | Ten gods, hidden stems, twelve stages and raw branch relations, only once verified | rule_id/source/policy provenance; no unsupported strength scoring |
| **U3: interpretation narratives** | Corresponding verified M3–M8 resolvers | school-specific strength/pattern/useful-god/climate/luck chapters with visible disagreement | separate COMPUTED/CONDITIONAL/INTERPRETIVE findings; no guaranteed prediction |
| **U4: optional character AI and business** | U1/U2 user tests + privacy/legal/licensing/release checks | Grounded story dialogue and paid **extra content**, not hidden facts | hallucination/unsafe-claim tests, consent, IP and refund/commercial-use gates |

**Technology guardrail:** the existing read-only local HTML + Node web adapter is the default starting point. Next.js/React, Rive/Lottie, Ink, accounts, public deployment and payments are **not required technologies or approved work**; adopt only against measured need. Character/LLM must only present already-verified `ChartFacts`/`InterpretationFinding` records. Source confidence is not scientific predictive validity. 6–8-week / KRW budget claims in the supplied research are unverified estimates, **not schedules or commitments**.

**Unattended sequencing:** only U0 documentation/interface mapping may run in parallel while M1 validation is pending, if it does not conflict with the critical path. Implement U1 as a small reversible functional slice after M1/V0 canonical checks; U2–U4 stay dependency-blocked. Do not repeatedly add design documents in place of code/tests.

## Verification ladder

Use the relevant levels for every executable slice: unit/table -> property/metamorphic -> boundary -> official Korean golden -> pinned differential implementations -> adversarial classical cases -> regression corpus -> randomized corpus. Library consensus is never calendar authority.

## Unattended-run SOP

Every run reads main/open PR/head/tests/roadmap first, selects the first unmet critical-path gate, researches only enough to close that gate, attacks it with a counterexample, implements one reversible slice, strengthens tests, runs canonical checks for executable changes, updates provenance docs, and stops rather than broadening on unexplained failure.

If a rule cannot be closed after two focused passes, mark it DISPUTED/UNVERIFIED, create the policy boundary, and continue. Do not spend consecutive runs on P2 while M1/M2 is open unless P2 blocks them.

## Current execution cursor (2026-10-10; `EXECUTION_HANDOFF.md` overrides this summary)

1. Exact branch checkout and `npm ci && npm run check` — never weaken failing tests.
2. KASA/Gazette official calendar-minute edition, KASI differential and commercial data-rights review; separate facts from publication license.
3. Expand modern Korean birth-year coverage and verified M2 ChartFacts. U0 mapping may proceed only without displacing these gates.

## Original dependency inventory (historical checklist, not the live queue)

1. structured rule/test-vector schema
2. dependency lock and repository verification
3. official fixture schema with source/version/checksum metadata
4. multi-year Lichun and twelve-節 goldens
5. solar-term event interface
6. year-pillar boundary
7. month-pillar boundaries
8. year/month pillar implementation
9. independent day-cycle anchors and day pillar
10. Zi/time-basis policy object
11. hour pillar
12. randomized Four-Pillars invariants
13. lunar/solar and leap-month fixtures
14. ChartFacts v0
15. hidden stems and branch ten gods
16. twelve-growth-stage lookup
17. V1 read-only app/API slice

Historical DST research is backlog unless a required fixture depends on it.
