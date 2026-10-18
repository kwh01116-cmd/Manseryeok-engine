# M2 / G1 — hidden stem membership with explicit main-qi policy

## Scope and evidence (2026-10-18)

This slice installs only the **12 branches → hidden heavenly-stem members** from classical `淵海子平` 卷一 `又地支藏遁歌` and a separately declared **main-qi ordering convention** cross-checked with a modern ordered table. It does **not** assert a proportion of seasonal qi, operative month commanding qi (司令), strength, useful god, root quality, personality or predicted event.

- Original-language, *transcription*, not critical edition: https://www.donglishuzhai.net/chapter/12808.html ; independent other transcription https://m.gushiwen.cn/guwen/bookv_d94be6a56081.aspx . Source record `CLASSIC-YUANHAI-ZIPING-DIZHI-CANGDUN-GE` (classical-base-text, edition/source may require further text criticism).
- Ordered 2026 contemporary convention: https://www.baziinsight.com/zh/learn/hidden-stems-in-bazi . Source record `MODERN-BAZIINSIGHT-HIDDEN-STEMS-2026` (modern comparative implementation; **not** the primary classical authority). Other contemporary implementations may differ in which secondary qi appears first or whether an extra hidden stem is listed; this slice does not encode fixed qi percentages.
- `M2-RULE-HIDDEN-STEMS-001`, version `1.0.0`, `CONDITIONAL`, `SCHOOL_DEPENDENT` and required `M2-HIDDEN-STEMS-CLASSIC-MEMBERS-MAINQI-V1` profile. Calling without the matching policy rejects; no silent default.
- Output labels are `MAIN_QI` and `OTHER`, NOT `middle`/`residual` strength levels. For example 午=[丁,己], 亥=[壬,甲], 卯=[乙]. Every result has a positional index used only for stable provenance/display ordering.
- `src/domain/hiddenStems.ts` and `test/m2-hidden-stems.test.mjs`: classical membership is independently transcribed *unordered* in tests, contrasted with a separate modern main-qi witness; corruption, invalid branch/prototype, absent policy and runtime immutability fail closed.
- The existence of a classical source listing does not establish scientific efficacy. This is deterministic **traditional-rule lookup** inside the explicitly selected profile.

## Release gate

M2 ChartFacts candidate representation and hidden-stem/ten-god composition must carry both the rule ID and profile ID, preserve boundary candidates, and remain read-only. Continue to exclude weights, dominance, scoring and interpretation until the separate M3+ evidence rules pass.
