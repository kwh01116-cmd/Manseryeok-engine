# M1 — applied Jie event provenance: pre-implementation contract (2026-10-18)

**Status: DESIGN ONLY. No source, test, runtime, UI or public API is changed by this memo.** Baseline: Draft PR #1 code HEAD `891967bfd2883e4aed8296a27b96d9be8a94ee11`, 227 Node tests + Chromium green before documentation work. This specification must not be cited as a passing implementation test.

## Actual source inspection

Current `src/calendar/monthPillar.ts` already computes the necessary *witness* values in `resolveMonthBranchAtJie()`:
- `activeJieBeforeBoundary: SolarTermEvent`: exact record from the supplied finite event corpus;
- `boundaryJie?: SolarTermEvent`: the exact Jie at the displayed birth minute, **only** at equality;
- `branchBeforeBoundary`, `branchAfterBoundary`, `selected?` and `confidence`.
`src/calendar/yearMonthPillars.ts` currently reduces that result to year/month GanZhi candidates, losing the event references. `src/calendar/koreanBirthPreview.ts` exposes `solarTermSourceIds`, but these are a **union across every supplied fixture record**, NOT identifiers for the specific event deciding this birth. `src/calendar/solarTermTimeline.ts` uses published **minute precision** and a strict sorted event list. The year resolver separately uses LICHUN, so a Lichun boundary must be correlated with the *same* minute and source evidence across year and month.

## Required DTO (proposal, not executable TypeScript)

```ts
type JieEventEvidenceV1 = Readonly<{
  term: MonthBoundaryJie;                 // e.g., LICHUN or DAXUE
  koreanName: string;                     // from the trusted taxonomy, not client text
  publishedKstMinute: string;             // YYYY-MM-DDTHH:mm, not a UTC instant
  timeBasis: "KST";
  precision: "MINUTE";
  sourceIds: readonly string[];           // attached to THIS exact event
}>;
type MonthBoundaryTraceV1 = Readonly<{
  schemaVersion: "m1-month-boundary-trace-v1";
  birthKstMinute: string;
  confidence: "DEFINITE" | "PUBLISHED_MINUTE_AMBIGUOUS";
  // For definite input: 1 branch candidate and its active reference.
  // At a Jie minute: 2 correlated branch candidates in before/after order.
  candidateContexts: readonly Readonly<{
    candidateIndex: number;
    monthPillarFactRef: `preview.candidates[${number}].month`;
    activeSince: JieEventEvidenceV1;
    boundarySide: "DEFINITE" | "BEFORE_PUBLISHED_MINUTE" | "AFTER_PUBLISHED_MINUTE";
  }>[];
  atPublishedBoundary?: JieEventEvidenceV1; // only at exact displayed minute
}>;
```

The time field means *published Korean civil clock minute*, not an astronomical exact second. If the source publishes 10:46, inputs at 10:46 must retain two possible candidates; 10:45 must have the earlier month only and 10:47 only the later month. Day/hour policy changes must not invent another Jie. No seconds interpolation, off-by-one rounding or arithmetic that treats a civil KST minute as UTC.

## Candidate semantics: must survive every layer

| Input | Candidate 0 | Candidate 1 | Required trace |
| --- | --- | --- | --- |
| Ordinary minute | active latest 12-節 before birth | absent | actual active Jie event and its source IDs |
| Non-Lichun Jie published minute | old month with old active Jie | new month with boundary Jie | same boundary minute; year GanZhi identical |
| Lichun published minute | old year + prior month | new year + 寅 month | correlated before/before and after/after, never 2×2 Cartesian combinations |
| Lunar-vs-solar equivalent birth | same trace | same ambiguity | different lunar-converter provenance, if applicable |
| Unsupported/invalid date | no trace | no trace | OUT_OF_COVERAGE/INVALID_LUNAR_DATE, never fabricated default |

**2027 audit witnesses from current source:** Lichun `2027-02-04T10:46` KST; Jingzhe `2027-03-06T04:40` KST; 2025 previous-year Daxue guard must be used for early January 2026. The source for both current-year Jie and prior guard is whatever the particular event's `sourceIds` actually lists; do not copy the global corpus source set as if it were event-specific.

## Minimal implementation seam (for the next TESTED code session)

1. **No UI/JSON contract changes yet.** Introduce a new pure resolver wrapper that calls current month resolver and keeps the exact `SolarTermEvent` object(s); avoid re-parsing source tables and duplicate lunar conversions.
2. If projecting beyond the resolver, return a versioned additive `monthBoundaryTrace` property, preserving existing `candidates[]`, `confidence`, `coverage` and `solarTermSourceIds`. Freeze nested source IDs after copying. Do not trust arbitrary externally submitted `sourceIds`.
3. Ensure consistency assertions: trace candidate count equals M1 candidates; before/after month branch equals associated pillar; Lichun year boundary and month boundary are identical published minute; every event exists in the validated corpus and carries nonempty source IDs.
4. Add deterministic vectors: Jan 2026 prior Daxue, before/at/after 2027 Lichun, before/at/after non-Lichun Jingzhe, month/year midnight and leap-day, duplicate/missing/unsorted/forged event source, lunar parity, out-of-coverage. Compare **event identity/source label** as well as GanZhi.
5. Only after check+Chromium PASS, render Korean copy with the exact event name and clock minute; always display the published-minute caveat. UI must reference an exact candidate index. Do not infer a specific Jie from current `solarTermSourceIds` collection.
6. If the source edition license gate is not cleared for a public commercial site, keep this feature private/research-only even if all code tests pass.

## Source and rights gate

KASI data page: https://astro.kasi.re.kr/kor/life/post/calendarData?search_year=2027 (labels itself non-official). Official Korean 2027 notice: https://www.kasa.go.kr/bbs/BBSMSTR_000000000018/B000000003234Li6nD2.do?mno=sub01_03_03 (official source, linked work displays KOGL Type 2 commercial-use restriction). A published numeric clock value and a copyrighted official publication are **not identical legal objects**, and commercial reuse of a full normalized extracted dataset requires a separate, documented assessment. See `CALENDAR_SOURCE_COMMERCIAL_RIGHTS_GATE_20261018.md`.
