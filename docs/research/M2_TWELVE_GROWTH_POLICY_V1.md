# M2 十二長生 (12 growth-stage) conditional lookup — 2026-10-18

## Chosen convention (not universal)

This initial 120-cell traditional-rule lookup selects an **explicit**, versioned `M2-12GROWTH-YANG-FWD-YIN-REV-FIRE-EARTH-V1` policy. Its two independent dimensions are: (a) positive/yang stems advance forward and negative/yin stems advance backward through the 12 earthly branches; (b) earth stems 戊/己 use the fire anchors of 丙/丁, respectively.

Modern educational cross-checks consulted:
- `MODERN-CLARIFYHK-12GROWTH-YANG-FWD-YIN-REV-2026`: https://clarifyhk.com/zh-hans/learn/bazi/life-stages-void-methods/forward-yang-stems-and-reverse-yin-stems (published 2026-09-04, lists the ten anchor branches, direction and warns of variants).
- `MODERN-MINGYUNHUB-12GROWTH-ANCHORS-2026`: https://www.mingyunhub.com/blog/bazi-12-stage-life-cycle (independent modern comparison of anchors).
- Additional dispute witness: https://knowyourbazi.com/changsheng/shunni (yin stems can be treated as same-element yang start by a different school, and earth may follow fire vs water). **No automatic reconciliation**. Neither educational website independently certifies classical critical editions or scientific predictive validity.

Rule record `M2-RULE-TWELVE-GROWTH-STAGES-001`: `CONDITIONAL`, `SCHOOL_DEPENDENT`, evidence layer `MODERN_HEURISTIC`, explicit policy `M2-12GROWTH-YANG-FWD-YIN-REV-FIRE-EARTH-V1`. These are named traditional life-cycle **stage labels only** (長生, 沐浴, 冠帶, 臨官, 帝旺, 衰, 病, 死, 墓, 絕, 胎, 養) and do **not** assert day-master strength, compatibility, success, fortune or life-span predictions. Do not use the terms as factual forecasts.

## Executable surface

- `src/domain/twelveGrowthStages.ts` exposes immutable stage array, anchor record, provenance and `twelveGrowthStage(dayMaster,branch,policyId)`. No implicit default, no arbitrary solar-year/time dependence, no weighting.
- `test/m2-twelve-growth-stages.test.mjs` exhausts the full 10 stems × 12 branches grid; independently pins more than two dozen anchor/key rows, compares 戊/丙 and 己/丁 for all 12 branches, checks invalid/prototype keys and freeze behaviour.
- **Not linked to ChartFacts v1 by default**: a future explicit M2 presenter must supply this *separate* disputed twelve-stage policy and record it in the output. Disputed tables must never leak into policy-free M1 pillars or automatically drive M3 strength resolvers.

## Release gate

This slice is research/lookup code, not app UX, future-prediction validation, or Korean domestic school-specific endorsement. Any school variants require distinct policy IDs, primary text crosscheck and adversarial table fixtures. Canonical code-head CI at `c5603212103858d3251e50af5efce587adb0ecc4` passed 198/198 Node tests plus real Chromium smoke; this is **code-regression verification**, not traditional-school consensus, independent critical-edition approval or efficacy validation.
