## Second no-CI work package — static code review + exact implementation seams (2026-10-18)

Following the initial ten-document source/research package, a **second docs-only deep review** was performed at Draft PR HEAD `ba1d1909bb0f53dc41f9c280a287624f711ba98f`. Read in this order:

1. `docs/review/STATIC_CODE_FINDINGS_20261018.md` — **nine actionable static findings** with precise file paths and release importance: local HTTP security/privacy, source reuse, exact Jie evidence, CSP/request timeout, CSS selector order and oversized PR scope. Source read only, **not proof of an exploit or runtime pass**.
2. `docs/research/KASI_OPENAPI_15012679_FIELD_SCOPE_REVIEW_20261018.md` — directly inspected public data portal API documentation, exact `getLunCalInfo` XML daily fields, authority vs reuse vs calendar-minute gap, proposed clean normalization/test suite. No authenticated API request or key.
3. `docs/engineering/M1_APPLIED_JIE_IMPLEMENTATION_SLICES_20261018.md` — actual source-call graph and reversible S1–S4 path (`yearMonthPillars` → `fourPillars` → `koreanBirthPreview` → U0/U1) keeping per-event provenance, Gregorian/lunar convergence and Lichun correlated candidates; unimplemented/non-executed.
4. `docs/product/U1_EP3_FACTUAL_EIGHT_GLYPHS_COPY_AND_TEST_PLAN_20261018.md` — Korean copy, exact eight `preview.candidates[i]` fact links, both boundary candidates, mobile and assistive technology acceptance, non-predictive limits. No code, image or browser output is claimed.

**Runtime evidence unchanged:** prior code commit `891967bfd2883e4aed8296a27b96d9be8a94ee11` green at Actions #39112191402 (227 Node tests + Chromium). No GitHub Actions runs invoked by the second package. Do not promote these static review findings or specifications to implementation completion.

# Research and zero-CI execution package — 2026-10-18

**Owner instruction:** Continue substantial work while GitHub Actions monthly allowance is reported exhausted. **Scope of this package: DOCUMENTATION AND INDEPENDENT SOURCE RESEARCH ONLY**. No production code, tests, workflow, browser assets, dependency manifest, merge or deployment is changed. Baseline verified code SHA `891967bfd2883e4aed8296a27b96d9be8a94ee11`, 227/227 Node tests plus Chromium via Actions #39112191402. The documentation-only HEAD after this package is not newly runtime-tested.

## New artifacts, in recommended consumption order

| File | Primary deliverable | Gate |
| --- | --- | --- |
| `docs/research/CALENDAR_SOURCE_COMMERCIAL_RIGHTS_GATE_20261018.md` | Verifies official 2027 notice's KOGL Type-2 restriction vs KASI computational data vs separately listed unrestricted-use lunar API; identifies commercial release blockers | Commercial/public: **NO-GO** pending source-specific clearance |
| `docs/research/CALENDAR_SOURCE_PERMISSION_INQUIRY_DRAFT_20261018.md` | Ready-to-review Korean provider questions for reuse, bundle/cache and API scope | **DRAFT / NOT SENT** |
| `docs/research/M1_APPLIED_JIE_PROVENANCE_DESIGN_20261018.md` | Applied Jie evidence DTO with actual per-event name/minute/source IDs and candidate mapping, preserving Lichun correlation | **SPEC / NOT CODED** |
| `docs/research/M1_SOURCE_WITNESS_AND_TEST_VECTOR_MATRIX_20261018.md` | 15 deterministic and adversarial test IDs, official-vs-KASI attribution and edge cases | **PLANNED TESTS / NOT EXECUTED** |
| `docs/research/M2_RULE_POLICY_AND_GAPS_REGISTER_20261018.md` | Complete worked M2 backlog and future M3 source/policy/version/dispute decisions | **RESEARCH / NOT EXECUTABLE** |
| `docs/research/M3_STRENGTH_GO_NOGO_DECISION_SPEC_20261018.md` | Why strength/useful-god/pattern algorithms remain blocked; policy dimensions and adversarial cases | **M3 BLOCKED** |
| `docs/product/U1_EP3_EP5_FACTUAL_SCENE_BLUEPRINT_20261018.md` | Korean EP3–EP5 scripts, UI evidence references, ambiguous-boundary, a11y, limited claims | **DESIGN / NO RENDERING** |
| `docs/review/PR1_SCOPE_SECURITY_AND_SPLIT_PLAN_20261018.md` | Actual 142-commit / 152-file tree inventory, split order, release and security blockers | **PLAN / NO PR SPLIT** |
| `docs/operations/NO_ACTIONS_QUOTA_OFFLINE_WORK_PROTOCOL_20261018.md` | Path-based no-CI push allowlist, exact-head lease and test evidence ladder | **WORKFLOW CONTRACT** |

## Highest-priority next execution steps, NOT performed in this package

1. Obtain **written source/rights clarity** for paid/re-distributed lunar/solar computation and distinguish official 2027 published work from API field rights. Do not send correspondence without owner confirmation.
2. Implement the **small, pure M1 applied Jie witness** resolver additive contract and the 15 planned negative/positive tests when a runnable environment returns. Keep existing M1 public DTO unchanged until the tested adapter is ready.
3. Verify the exact tested source SHA in a clean Node 22 checkout; current workflow when available is `npm ci && npm run check` and Chromium loopback `node scripts/browser-smoke.mjs`. Existing passing CI on the old SHA is not transferable evidence for new executable code.
4. Build U1 EP3 (eight glyphs / element labels only) from actual M1 facts and real-browser test; continue EP4–EP5 only after M2 provenance/comprehension review. No new numerology or prediction claims.
5. Review/split the giant Draft PR into dependency-ordered code chunks A/B/C/D/E before main merge; do not arbitrarily cherry-pick fixtures without keeping source rights and tests.

## Non-goals: explicitly unchanged

No GitHub Actions workflow invocation or quota workaround; no `src/` changes, no `test/` changes, no public Cloudflare site, no private user input storage, no new 2000 consumer birth-year support, no interpreted fortune/strength/용신 code and no merging `main`. The release source/accuracy/security gates remain open.

## Source evidence

- 2027 official notice licensing on its own page: https://www.kasa.go.kr/bbs/BBSMSTR_000000000018/B000000003234Li6nD2.do?mno=sub01_03_03
- KOGL Type 2 definitions: https://www.kogl.or.kr/use/OpenBestCaseView.do
- KASI non-official computational dataset: https://astro.kasi.re.kr/kor/life/post/calendarData?year=2027
- Separate KASI lunar–solar API listing (use range "unrestricted", not known to contain minute-level 24 terms): https://www.data.go.kr/data/15012679/openapi.do
