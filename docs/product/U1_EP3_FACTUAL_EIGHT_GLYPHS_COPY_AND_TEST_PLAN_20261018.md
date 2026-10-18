# U1 EP3 script + accessibility acceptance (ready for implementation, NOT built)

Source state: committed U1 EP0/EP1/EP2 local-only frontend `web/index.html` and `projectKoreanV0Story` read at Draft PR HEAD `ba1d1909bb0f53dc41f9c280a287624f711ba98f`; last browser-verified code commit `891967bfd2883e4aed8296a27b96d9be8a94ee11`. This is **copy + binding spec**, not rendered HTML or new executable code.

## Chapter purpose and boundaries

Explain the **eight visible characters** of four pillars (year/month/day/hour) and their traditional element labels. This must not become a "five element strength" chart, personality trait claim, compatibility score, fate graph or hidden-stem season ranking. A Yang/Yin label refers to symbolic stem/branch classification, not gender, sex or personality.

## Page flow, exact candidate-specific data

1. EP0 results already show four `year/month/day/hour` pillars from `preview.candidates[i]` with Hangul/Hanja. Keep them visible.
2. EP1 already uses `DAY_STEM_CLASSIFICATION` beat from U0.
3. EP2 already uses `MONTH_BRANCH_CLASSIFICATION` beat from U0 and its event-minute caveat.
4. **New EP3** reveals a table of four columns (or stacked rows at 320px) and **two symbols per pillar**:
   - 천간 fact ref: `preview.candidates[i].<role>.stem` → element from existing `STEM_NATURE`;
   - 지지 fact ref: `preview.candidates[i].<role>.branch` → `principalElement` from `BRANCH_NATURE`;
   - the full Hanzi is the source pillar `preview.candidates[i].<role>.hanja`.
5. For a minute-boundary input, render EP3 **twice**, one per candidate with separate index references and equal visual emphasis. Never combine eight labels from candidate 0 with branch labels from candidate 1.
6. Evidence disclosure: show `elementLookupRuleId`, `sourceFactRef`, `sourcePreviewVersion`, time policy and `evidenceClass: CALCULATED_CLASSIFICATION_ONLY`. Do not assert a source law if it has not been registered; reuse existing deterministic nature metadata, no new school policy by default.

## Korean copy, ready for content review

Header: **03 · 여덟 글자와 다섯 가지 이름**

Intro: "사주팔자는 네 기둥에 각각 천간과 지지 한 글자씩, 모두 여덟 글자가 놓이는 전통적인 표현입니다."

Table heading and image alt equivalent: "연주 천간", "연주 지지", "월주 천간", "월주 지지", "일주 천간", "일주 지지", "시주 천간", "시주 지지".

Reference label examples (not personalized claims): "갑(甲) · 목(木)", "을(乙) · 목(木)", "병(丙) · 화(火)", "자(子) · 수(水)", "오(午) · 화(火)".

Disclosure: "이 화면의 오행은 전통 분류표의 **이름**입니다. 글자의 개수만으로 기운의 강약이나 길흉을 판단하지 않습니다."

Precision caveat (only when ambiguous): "이 시각은 발표된 절입 분과 겹칩니다. 어느 쪽 명식이 적용되는지 초 단위로 확정할 수 없어 두 후보를 모두 보여드립니다."

Source CTA: "**각 글자의 계산 근거 보기**" → existing native details / factRef panel. If exact applied Jie event not in DTO yet, **do not** claim one particular Jie minute on this chapter.

Prohibited copy examples: "당신은 불기운이 넘칩니다", "물의 기운이 약합니다", "운명의 색", "성격이 강하다", "올해 재물이 들어옵니다", "음양이 불균형하다".

## DOM/data contract blueprint

```text
section[data-chapter="ep3"][data-candidate-index="<i>"]
  h4 "03 · 여덟 글자와 다섯 가지 이름"
  p  one-sentence factual introduction
  table role/year-month-day-hour, two rows (stem/branch)
    td: text glyph + Korean symbolic-element name
    button ("근거 확인") data-fact-ref="preview.candidates[i].year.stem" ...
  p class="non-predictive-note"  no elemental ranking claim
  details  existing source/policy evidence by candidate index
```

If future product cards replace the table, preserve all eight elements and two candidate-index namespaces. Decorative ink/wave/icon is optional; it must never substitute for Korean text labels, accessible focus and factual references.

## Acceptance matrix for the first executable EP3 slice (NOT EXECUTED)

| ID | Browser/test condition | Required result |
| --- | --- | --- |
| `EP3-01` | Standard 2027-02-05 12:00 Gregorian | 8 visible element labels, correct source paths, 1 candidate |
| `EP3-02` | Equivalent lunar 2026-12-29 | same 8 facts; lunar-converter provenance remains separate |
| `EP3-03` | Lichun 2027-02-04 10:46 KST | **16** labels: 8 per candidate, no mixed references |
| `EP3-04` | Change date/time/policy after rendering | old EP3 facts invalidated; no stale async response |
| `EP3-05` | 2028 unsupported birth | no hidden/stale EP3; prior no-result and error state |
| `EP3-06` | Forged story beat source, wrong candidate index or invalid nature | fail closed; no silently fabricated eight-symbol display |
| `EP3-07` | Mobile 320/360/390px | no horizontal scrolling, no clipped labels, enough tap area |
| `EP3-08` | Keyboard and VoiceOver/NVDA | natural reading order, labeled source controls, no information conveyed by color only |
| `EP3-09` | `prefers-reduced-motion`, no web fonts | fully readable; animation optional and user-controlled |
| `EP3-10` | Inspect actual JSON, logs, network, storage | no new DOB telemetry or unintended persisted birth data |

## Copy-review method

Have a Korean reader without saju knowledge answer: (1) Does this prove the person has a strong/weak element? **No**. (2) Why can two charts appear? **Published minute is insufficient for certainty**. (3) Does this use the official 2027 KASA licensed table? **No such claim is made**. (4) Where can I see the source? **The existing evidence panel**. If those answers are not clear, rewrite before release. This is a proposed UX test, not completed user research.

## Dependencies

May implement EP3 from already validated `src/domain/{stems,branches}.ts` and current story facts once a runner/browser returns. Avoid bundling EP4 (school-dependent hidden-stem interpretation) or EP5 (branch raw relations/triads) in the first unverified UI patch. Any new deterministic element lookup beat still requires explicit factRef/source and stable story schema expectations.
