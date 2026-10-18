# M1 applied-Jie trace — first green code slice implementation blueprint

Status: **STATIC ENGINEERING DESIGN, not implemented or executed**. Baseline reviewed commit `ba1d1909bb0f53dc41f9c280a287624f711ba98f`. Previous verified executable HEAD `891967bfd2883e4aed8296a27b96d9be8a94ee11`, 227/227 Node + Chromium. Research gate `M1_APPLIED_JIE_PROVENANCE_DESIGN_20261018.md` defines the public type semantics; this document identifies the exact implementation insertion points.

## Current call/data graph (read from real files)

```text
/korean birth input
  ├─ GREGORIAN:
  │    koreanBirthPreview.resolveKoreanBirthChartPreview
  │    -> fourPillars.resolveCoverageCheckedModernKoreanCivilFourPillars
  │    -> fourPillars.resolveModernKoreanCivilFourPillars
  │         -> yearMonthPillars.resolveYearMonthPillars
  │              -> yearPillar.resolveYearPillarAtLichun
  │              -> monthPillar.resolveMonthBranchAtJie ─┬─ activeJieBeforeBoundary
  │                                                       └─ boundaryJie? 
  │         -> dayHourPillars.resolveDayHourPillars
  └─ KOREAN_LUNAR:
       koreanLunarBirthFourPillars.resolveKoreanLunarBirthFourPillars
       -> converter.fromLunarDate
       -> same coverage-checked fourPillars path
  -> KoreanBirthChartPreview {candidates, confidence, solarTermSourceIds (CORPUS-WIDE)}
  -> V0 storyProjection {candidateIndex, month.branch, day.stem ...}
  -> U1 month chapter
```

**Existing drop point:** `yearMonthPillars.ts` knows both source records in a local `month` variable but returns only candidate `{year,month}` pairs. The strictly less risky solution is to propagate **the same already-computed month result**, not to make `koreanBirthPreview.ts` independently call `resolveMonthBranchAtJie` for a second calculation.

## Proposed exact implementation order (four small reversible steps)

### S1 — pure resolver output extension (no JSON/UI yet)

Modify `src/calendar/yearMonthPillars.ts` to add a **non-breaking optional `monthBoundaryTrace?: MonthBoundaryTraceV1`** to `YearMonthResolution`. Construct it using the **one** `month` resolution already computed; map:
- DEFINITE: `candidate[0]` active since `month.activeJieBeforeBoundary` with branch `month.selected`;
- MONTH-ONLY AMBIGUOUS: `candidate[0]` active prior Jie, `candidate[1]` active at `month.boundaryJie`; same year;
- LICHUN AMBIGUOUS: likewise the *correlated* year old+old vs new+new two candidate indices; event minute and source must match year. Do not produce a Cartesian four-way set.

The existing `yearMonth` integration already enforces matching Lichun month and year at the same minute: preserve this guard. An event trace can include `term`, `displayedDateTime`, `timeBasis`, `sourcePrecision`, **event-local `sourceIds`**, plus a computed month branch and the exact candidate index. Copy and freeze source IDs; `readonly` alone is not runtime immutability.

**Never** insert a default source ID like `KR-KASA-WOLRYEOK-2027` or `KR-KASI-CALENDAR-DATA` if an event lacks source IDs; the caller-supplied real event must be validated and traced as-is. The existing coverage gate checks nonempty IDs but not their legal meaning.

### S2 — preserve through the existing M1 processing layers

Extend `ModernKoreanFourPillarsResolution` `src/calendar/fourPillars.ts` with a compatible optional trace and pass through `yearMonth.monthBoundaryTrace`. Both Gregorian and Korean lunar already converge into this same layer, so there is **no need for parallel implementations**. Keep the coverage checked shape unchanged apart from optional trace, and keep `recordedBirthKstMinute`, `confidence` and `day/hour` policies unchanged. Calendar-year support stays 2026–2027.

### S3 — versioned additive public DTO (only after focused tests)

`koreanBirthPreview.ts`: if the trace passes count/ref consistency and event source validation, add `monthBoundaryTrace` as **optional additive field** to `KoreanBirthChartPreview`, using a frozen copy. Do **not** change `schemaVersion:"v0-korean-birth-chart-preview-v1"` without contract-review (additive API change is still reviewable). Do not replace the old global `solarTermSourceIds`; rename its UI label to "검증에 사용한 절기 자료의 출처 집합" if kept.

Use a discriminated type for per-candidate side `DEFINITE|BEFORE_PUBLISHED_MINUTE|AFTER_PUBLISHED_MINUTE`. A boundary element MUST link to the right `preview.candidates[i].month`, and the associated pillar branch MUST equal the event's `MONTH_BRANCH_BY_JIE[term]`. A forged client DTO must fail validation.

### S4 — consumer display after real HTTP + Chromium tests

Extend `src/story/v0StoryProjection.ts` only with source-addressed **optional** `MONTH_APPLIED_JIE_CONTEXT` beat per candidate; do not add a fresh resolver or skip existing U0 validation. Update `web/index.html` EP2:
- "입춘(立春) · 2027-02-04 10:46 (KST 발표 분)"
- "이 후보의 월지는 [과거 대설/현재 입춘]을 기준으로 계산했습니다."
- If at exact published minute: two candidate cards with separate Jie context and an explicit "분 단위 자료라 실제 초 시각에 따라 달라질 수 있습니다" note; no chosen winner.
- Source detail must use **this exact Jie record's** source IDs, not `preview.solarTermSourceIds` union.
- Text selection and glyph must remain `textContent`-based. Preserve stale response invalidation and the localhost-only server.

## Minimal first commit file change list

For S1 ONLY: `src/calendar/yearMonthPillars.ts` and `test/year-month-pillars.test.mjs`; optionally new `src/calendar/monthBoundaryTrace.ts` pure type/helper if required. Do **not** bundle web, Story, M2 or commercial corpus changes in S1. Require Node 22 `npm ci && npm run check` at exact commit, no new GitHub Actions while quota-paused.

For S2: `src/calendar/fourPillars.ts` and `test/four-pillars.test.mjs`, `test/four-pillars-coverage.test.mjs`.

For S3: `src/calendar/koreanBirthPreview.ts`, `test/korean-birth-preview.test.mjs`, solar/lunar parity tests.

For S4: `src/story/v0StoryProjection.ts`, `web/index.html`, `test/chart-preview-web.test.mjs`, `scripts/browser-smoke.mjs`; actual Chromium required.

## Concrete expected vectors (proposed — **NOT TESTED**)

1. 2027-02-04T10:45 / 10:46 / 10:47: one (prior Jie) / two (old/new) / one (LICHUN) candidates with exact published-minute source.
2. 2027-03-06T04:39 / 04:40 / 04:41: one/two/one, both year stems unchanged across two month candidates.
3. Early Jan 2026: previous-year 2025 DAXUE is the active Jie; do not confuse 2026 Xiaohan/another term.
4. 2027-02-05 Gregorian and 2026-12-29 lunar: same Jie event and month candidate, lunar converter source additionally tagged.
5. KST vs UTC source-label spoofing, missing `sourceIds`, duplicate events, noncanonical Jie order: fail before rendering.
6. 2027 year-end and 2028 Jan1: coverage must not be widened by adding a trace.
7. Zi policy at 23:00: changes appropriate day/hour only, **not** selected Jie evidence.
8. Source A vs Source B published minute disagreement: carry the selected declared edition, never guess sub-minute agreement.
9. At 2027 Lichun the **year** and **month** before/after candidate index must remain correlated.
10. `Object.freeze` test for all copied nested sources and candidate contexts.

## Decision and rollback

- Gate for applying S1: legitimate runnable checkout + willingness to test actual new source SHA. It is safe to **author** an isolated patch offline but not to call it verified.
- Gate for rendering S4: exact M1 trace source, GDPR/Korean privacy and copyright source review as applicable, actual browser validation and Korean meaning check.
- Rollback is one small opt-in source patch at a time. Never merge giant PR or replace published source IDs as a "fix" without provenance review.

**Research conclusion:** the existing core already has the event evidence internally, so this is a **metadata retention / provenance plumbing problem**, not an astronomical computation research problem. It is feasible to do as the next few tiny code slices, once tests can run.
