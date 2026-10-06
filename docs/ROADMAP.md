# Execution roadmap

## Priority correction

Historical Korean time reconstruction remains a correctness feature, but it is not the critical path for the first product. The main path is now: official Korean calendar fixtures -> Four Pillars -> deterministic chart facts -> a read-only app slice -> interpretation resolvers. Historical/DST work stays isolated and returns later unless it blocks a required fixture.

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

## Verification ladder

Use the relevant levels for every executable slice: unit/table -> property/metamorphic -> boundary -> official Korean golden -> pinned differential implementations -> adversarial classical cases -> regression corpus -> randomized corpus. Library consensus is never calendar authority.

## Unattended-run SOP

Every run reads main/open PR/head/tests/roadmap first, selects the first unmet critical-path gate, researches only enough to close that gate, attacks it with a counterexample, implements one reversible slice, strengthens tests, runs canonical checks for executable changes, updates provenance docs, and stops rather than broadening on unexplained failure.

If a rule cannot be closed after two focused passes, mark it DISPUTED/UNVERIFIED, create the policy boundary, and continue. Do not spend consecutive runs on P2 while M1/M2 is open unless P2 blocks them.

## Immediate queue

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
