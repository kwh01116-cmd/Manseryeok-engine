# M2 G7 — Four 三合 / Four 三會 member sets, distinct-presence only

Date: 2026-10-18. **Implementation verified**: commit `1f7aa3dfd38868cc0c59691c84bca0f4f891bc9e`, [Actions 39096470339](https://github.com/kwh01116-cmd/Manseryeok-engine/actions/runs/39096470339) full typecheck/build and 220/220 tests PASS + real Chromium PASS. This verifies the versioned implementation, **not** scholarly consensus or efficacy.

## Sources and limitations

- **CLASSIC-YUANHAI-ZIPING-LUN-SHIERZHI-SANHE**: `淵海子平` 卷一〈論十二支三合〉, https://www.donglishuzhai.net/chapter/5619.html . It lists 申子辰水, 亥卯未木, 寅午戌火, 巳酉丑金, **as well as 辰戌丑未土局**. This code implements only the usual **four 3-member** groups. The extra **four-branch earth group is explicitly excluded** pending its own shape, status semantics and classical-edition gate. Do not erase it from the source record or pretend the chapter lists only four.
- **MODERN-CLARIFYHK-FOUR-SEASONAL-SANHUI-2026**: modern educational listing of 寅卯辰木, 巳午未火, 申酉戌金, 亥子丑水. See https://clarifyhk.com/zh-hans/learn/bazi/stem-branch-relations/directional-meeting-conditions and its comparison page https://clarifyhk.com/zh-hans/learn/bazi/stem-branch-relations/trine-formation-conditions. This is not falsely marked as the preceding *classical chapter's* own 三會 statement.
- **MODERN-CLARIFYHK-SANHE-PARTIAL-MEMBER-CATEGORIES-2026**: educational 生旺/旺墓 and non-central 生墓 categories, https://clarifyhk.com/zh-hans/learn/bazi/stem-branch-relations/trine-formation-conditions and https://www.mczwl.cn/article/earthly-branches-liuhe-sanhe-sanhui-differences . `生+旺` and `旺+墓` are two member patterns conventionally known as 半合; `生+墓` without 旺 is **NOT silently labeled 半合**, and the program returns only `BIRTH_AND_TOMB_NOT_HALF_TRINE`. Under a different school even half-group activation or remote/adjacent requirements differ.
- Classical chapter's *member lists* do not independently establish that exactly 3 present means an effective 合化, or that 2 present means a universal 半合 prediction. Source transmission, edition and modern-school disagreement remain open. **No source scientifically validates predictive outcomes**.

## Versioned safe semantics

`M2-TRIAD-FOUR-SANHE-FOUR-SANHUI-MEMBERSHIP-V1`, explicit required policy. Rule IDs `M2-RULE-TRIAD-SANHE-MEMBERS-001` and `M2-RULE-TRIAD-SANHUI-MEMBERS-001` are `CONDITIONAL`, `SCHOOL_DEPENDENT`; the latter is `MODERN_HEURISTIC`, the former `CLASSICAL_BASE_TEXT`.

- `collectFourPillarTriadMemberships([year,month,day,hour], policyId)` returns only the eight named patterns where **at least two DISTINCT member branches occur**. No inferred member, no future luck overlay. A pattern with all three distinct members has `THREE_DISTINCT_MEMBERS` (not `FORMED` or `TRANSFORMED`); exactly two have `TWO_DISTINCT_MEMBERS`.
- Each result retains its exact three expected members *in its own traditional order*, all original pillar indices including duplicates, and which member(s) are missing. Example: `[申, 子, 辰, 申]` counts three distinct water members; `[申, 申, 申, 申]` counts only one and produces **no** 水三合 fact.
- A 2-member **三會** gives `SANHUI_PARTIAL_MEMBERS`, **not** a universal `半會局成立`. A 2-member 三合 includes one of `BIRTH_AND_CENTER`, `CENTER_AND_TOMB`, `BIRTH_AND_TOMB_NOT_HALF_TRINE`; the modern source ID is additionally attached to those modern subcategory labels.
- Different patterns are not made mutually exclusive: `[申,子,辰,酉]` provides full raw 三合 water membership **and** partial raw 三會 metal membership. This indicates no resolution, transformation, strength, compatibility, good/bad luck or which interaction 'wins'.
- Outputs, nested occurrence arrays, source IDs, policies and definitions are frozen. Missing or malformed explicit policy/year-month-day-hour branch input fails closed.

## Regression gate

`test/m2-triad-memberships.test.mjs` independently pins all eight 3-member oracle lists, all three partial patterns for each 三合, 2-member 三會 examples, full vs fourfold duplicate, provenance and immutability, PLUS **all 12⁴ = 20,736 ordered 4-pillar branch sequences** with exact original-member occurrence indices, missing-member identities and cross-family overlapping facts.

No M1 year coverage, API/consumer workflow, school-specific strength or historical time policy is changed by this slice. Once runtime verified, only then consider opt-in ChartFacts v3 adapter that preserves alternative published-minute candidates, rather than modifying v1/v2 silently.
