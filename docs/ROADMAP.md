# Manseryeok-engine — engine reliability roadmap

**Active direction: 2026-10-19 KST.** Engine correctness, provenance, supported coverage, explicit policies and reproducibility take priority until the owner changes direction. EP0–EP4 is **Manseryeok Lab**, an internal calculation/rule verification tool. Preserve its current UI and regression checks. Story App, EP5 UI, characters, webtoon, design concepts and deployment are paused; future product design belongs to a separate Astra task and is not this queue.

Current operational cursor: [EXECUTION_HANDOFF.md](EXECUTION_HANDOFF.md). Stable instructions: [AGENTS.md](../AGENTS.md). Detailed evidence and research gaps: [engine reassessment / G0 report](engineering/ENGINE_REASSESSMENT_AND_G0_EXECUTION_20261019.md).

## Completion criteria

A feature is assessed along separate axes: (1) implemented algorithm and adversarial tests, (2) traceable source/edition and field-level use rights, (3) independent external numerical/textual comparison, (4) finite supported coverage and explicit ambiguity/policies, (5) immutable/reproducible API contracts. Passing tests demonstrates the encoded behavior; it does **not** establish external calendar truth, textual authenticity, scientific predictive validity or commercial permission. No aggregate completion percentage is used.

- **IMPLEMENTED_AND_TESTED:** executable, scoped behavior verified in the exact checkout; external limitations still stated.
- **PARTIALLY_VERIFIED:** working components exist, but required external evidence, coverage or policy gates remain open.
- **RESEARCH_ONLY:** sources/specifications/test-only corpora exist without promotion to the supported runtime.
- **BLOCKED_BY_SOURCE_OR_POLICY:** no executable promotion until the identified source/dispute is resolved.
- **NOT_IMPLEMENTED:** no executable feature; a backlog title is not an implementation.

## Current M1–M8 assessment

| Milestone | Overall status | Actual scope and evidence | Unclosed gate |
| --- | --- | --- | --- |
| M1 modern calendar / Four Pillars | **PARTIALLY_VERIFIED** | 2026–2027 default Gregorian/lunar, explicit day/hour policies, minute Jie trace and correlated candidates; all 48 2026/27 term dates match pinned KASA day witnesses, all 48 minutes match independently transcribed NAOJ tables | Modern lunar independent daily oracle, minute rounding/seconds, per-field source rights, broader years and historical-time integration |
| M2 deterministic facts | **PARTIALLY_VERIFIED** | v1/v2/v3, one named profile each; hidden stems, ten gods, twelve stages, raw pairs and triad membership; 10×12/12×12/12⁴ finite tests | Critical editions, alternate school profiles, four-member earth-group decision and source-policy registry completeness; membership never establishes efficacy |
| M3 strength evidence | **BLOCKED_BY_SOURCE_OR_POLICY** | Decision spec and counterexamples only; no strength resolver | 月令/司令/root/activation/weights/precedence require independently reviewed school-specific rules |
| M4 pattern engine | **BLOCKED_BY_SOURCE_OR_POLICY** | Ordered pattern/topology requirements only; no resolver | Source-edition-specific formation/break/rescue/相神 cases and exception precedence |
| M5 useful-god / climate views | **BLOCKED_BY_SOURCE_OR_POLICY** | Separate structural/balancing/climate/medicine/bridging concepts, no resolver | Critical texts, commentary variants, conflicting recipes, explicitly separate policies |
| M6 follow / transformation | **BLOCKED_BY_SOURCE_OR_POLICY** | Requirements only; no classifier | True/false/disputed structures and activation conditions; raw 合 is insufficient |
| M7 Da-yun / Liu-nian | **RESEARCH_ONLY** | Boundary/arithmetic requirements, no executable start-age/direction/overlay | Direction policy, twelve-Jie definition, proportional age convention, precision and independently published witnesses |
| M8 supplementary / Korean practice | **NOT_IMPLEMENTED** | Backlog requirement only; no executable compatibility/Shen-sha profile | Named Korean sources/practices, editions, exceptions and independent reviewers |

Implemented finite M1/M2 subfeatures and G0 are **IMPLEMENTED_AND_TESTED within their stated scope**, not full milestone completion. Research 2000 is **RESEARCH_ONLY** despite runtime tests. Standalone historical base offsets/1987–88 DST have tests; the combined historical birth calculation is not supported. See the detailed report for file-level evidence.

## Ordered development queue

### 1. M1/M2 trust boundary and data provenance

**G0 completed:** server-selected fixture/manifest/annual-edition context, one M1 execution receipt, exact candidate/source/policy/schema verification and trusted M2 v1/v2/v3 entry points. Generic adapters retain structural-only guarantees. Tested code/test SHA: `0eb277645b7e87915c9dd6d68172a7d0516cce40`, Node 22 full **283/283**. Actual Lab Chromium remains required.

**Next independent unit G1:** versioned event/month-to-edition provenance manifest and repository fingerprint validation for the current corpus; retain event-specific evidence separately from the corpus source union. Link the existing fixture digest pins and edition records without claiming a cryptographic fingerprint authenticates an external publication. No new dates, no astronomical algorithm, no UI. Before implementation, verify the original metadata for each row/year; unresolved metadata stays blocked rather than inferred.

Exit: negative tests for unknown/wrong known source, edition, digest, manifest, corpus and candidate; mutation/serialization behavior specified; no M1 rerun or silent repair. Source rights are a separate gate.

### 2. Modern supported-year expansion and independent calendar comparison

Start with **one adjacent modern year**, provisionally 2025, only after its source packet is qualified. It requires the **2024 Daxue guard**, 2025 full 24 terms, late-2024 lunar boundary through 2025/26, end-exclusive witness and edition/rights review. The current 2025–2027 lunar corpus alone cannot serve January 1–28, 2025 or establish all-year Four Pillars.

Compare with independently published KASA/KASI/NAOJ witnesses at their actual precision and an independently pinned daily lunar oracle. KASI daily lunar API is a candidate only: no authenticated call/source integration exists and it does not supply proven minute-level solar terms. Prefer offline/build-time evidence, not per-user external calls. Consider documented independently licensed ephemerides/time scales only after precision/rounding policy is settled. Record disagreements rather than averaging or substituting sources.

Exit: full-year + guard + lunar wrap, all Jie minute ±1, 23:00/00:00 policies, leap dates/months, independent differentials, fail-closed coverage and full checks. Do not change default coverage while any gate is open. Test-only 2000 stays isolated.

### 3. Korean historical standard time, DST and time policies

Keep civil-time reconstruction separate from Myeongli time choice. Existing base-offset periods begin 1908-04-01; standalone 1987/88 DST rejects gaps/folds, but neither is wired into the modern composer. Research 1950 has a legal-text witness; it is not executable. Remaining 1948–51/1955–60 transitions and pre-1908 records require primary decrees and pinned IANA comparison, not a year-only DST list.

Exit: exact legal transition instants, explicit gap/fold choice, independent UTC/civil tests, source-tagged normalization and no retroactive UTC+9 assumption. Mean/apparent solar time requires independent longitude/equation-of-time methods and explicit policies; no true-solar-time boolean or silent adjustment.

### 4. M2 school-policy and source precision

Audit source/rule/version registry entries and two independently digitized critical editions. Preserve classical vs modern sources, MAIN_QI order vs membership, directed/reciprocal/self 刑 and simultaneous overlaps. Review a second profile only when real sources justify it. Keep 辰戌丑未 four-earth, half-group activation, combination transformation and seasonal hidden-stem weights out of executable facts until separately qualified.

Exit: explicit preconditions/exceptions/disputes, exact per-fact citations, independent table oracles and alternate-policy counterexamples. No strength or auspiciousness inference from raw membership.

### 5. Independent interpretation research (M3 first; M4–M8 remain gated)

Pin source editions/passages and distinguish base text, commentaries and modern/Korean practice. Develop independent positive/negative/counterexample cases before resolver code. Keep 月令, roots, 司令, twelve-growth convention, activation and exception precedence separate. No ad-hoc coefficient model, personality/fortune output or useful-god selection.

Exit: named school profiles, independently reviewed text-to-rule mapping, conflicting cases and refusal semantics. Software adherence to a tradition never establishes real-world predictive validity.

### 6. Stable reusable engine API

After source/policy boundaries stabilize, define immutable versioned DTOs with candidate identity, source/edition, coverage, precision, rule/policy versions, failure reasons and invalidation. Document generic vs trusted entry points. Receipts are in-process capabilities, not serialized signatures. Keep the Lab as a regression consumer. Future Astra product design may consume the verified engine through a separately authorized integration; no current UI migration or public service is scheduled.

## Delivery and current restrictions

Each narrow executable unit: counterexample → implementation → Node 22 TypeScript + full `npm run check` → relevant actual Lab Chromium → independent code/test/doc commits → ordinary fast-forward push only to `agent/m1-applied-jie-slice1-20261019`, after workflow inspection. No Actions, force push, main/foundation update, merge, public deployment, personal-data storage or paid service. Do not implement an unsupported feature merely to fill the roadmap.

The complete previous roadmap is preserved verbatim in [the historical roadmap archive](archive/ROADMAP_BEFORE_ENGINE_FOCUS_20261019.md). Its Story/UI queue and unattended priorities are superseded by this engine-first direction; old test claims remain dated historical evidence.
