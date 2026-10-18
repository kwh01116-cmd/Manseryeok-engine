# M2 ChartFacts v1 — deterministic rule-only projection

Status: **DRAFT implementation**. At creation, full CI and browser smoke must pass before claiming verified.

## Contract and dependencies

`src/chartFacts/chartFactsV1.ts` consumes only the **already calculated**, source-labeled `KoreanBirthChartPreviewResult` from M1. It does **not** repeat the calendar conversion, solar-term boundary resolver, Zi policy or sexagenary derivation. All constituent facts must cite a stable `preview.candidates[i].{year,month,day,hour}` path, and both correlated Lichun candidates remain separate.

- `m2-chart-facts-v1` / `M2-RULE-CHART-FACTS-001` : four pillars + visible-stem ten gods (day column is the day master, not interpreted as a separate visible god) + complete hidden-stem member ten gods for *each* of the four branches.
- `M2-RULE-BRANCH-TEN-GODS-001` composes `M2-RULE-HIDDEN-STEMS-001` with existing `tenGod` five-element polarity relation. The existing tenGod base operation is referenced as `M0-RULE-TEN-GODS-ELEMENT-RELATION`; independent date/calendar evidence is NOT implied by this label.
- Requires `M2-HIDDEN-STEMS-CLASSIC-MEMBERS-MAINQI-V1` explicitly. Its `SCHOOL_DEPENDENT` ordering profile and classical/modern source records must be visible in every ready response. It does not claim uniform scholarly consensus.
- The new M2 view is `TRADITIONAL_RULE_LOOKUP_ONLY` (not scientifically predictive). No strength, 五行 score, 根力, 格局, 喜用神, event prediction, wealth, partnership or health judgement fields.
- When M1 reports `OUT_OF_COVERAGE` or `INVALID_LUNAR_DATE`, the ChartFacts projector produces a frozen **BLOCKED** result with no candidates. Forged unknown statuses, absent source IDs, invalid M1 policies/candidate counts and inconsistent Korean label text throw; nothing guesses missing data.
- Candidate results/source IDs/policies/coverage are immutable snapshots. Gregorian and equivalent Korean lunar dates yield the same computed M2 candidates but the lunar result **retains distinct converter provenance**.

## Test gates

`test/m2-chart-facts-v1.test.mjs`: real M1 2027/02/05 solar-vs-lunar, Feb 4 Lichun two-candidate boundary, full four-pillar source paths, previous-year solar KASI source label, hidden-member cardinality, error fail-closed, adversarial spoofing, profile requirement, snapshot immutability. This intentionally does not authorize M2 raw branch relations or 十二長生 scoring.

## Next after green

Versioned 十二長生 lookup (explicit school/soil anchor profile), raw branch relation detection with source/policy evidence, then V1 read-only ChartFacts chapter. Do not assign interpretation or weights. Historical 2000 remains RESEARCH ONLY, M1 2026-27 only.
