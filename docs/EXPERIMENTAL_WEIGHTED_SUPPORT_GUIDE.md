# 선택형 가중 생조 점수 PoC

기존 M1→M2→M3/M4 결과를 보존하고 별도 LEVEL 2 점수 정책을 나란히 실행한다. 기본 엔진·Lab·기존 `kasi:chart/evidence/luck`에는 등록하지 않았다. 새 정책을 명시하지 않으면 실행을 거절한다. 제품의 기본 강약·용신이나 객관적 힘/예측 정확도로 채택한 것은 아니다.

정책: `EXPERIMENTAL-WEIGHTED-SUPPORT-LOCAL-NO-TRANSFORMATION-V01` / `0.1.0`.

## 실제 선택한 규칙

- 같은 오행 또는 일간을 생하는 오행을 이 정책의 지원 요소로 분류한다.
- 지지 대표 오행의 가중치는 월3.5/일1.5/연1/시1이다.
- 일간을 제외한 표면 연·월·시 지원 천간은 각1, 기존 M2 장간표의 동오행 근이 없으면0.5다.
- 지원하는 월지에 충 상대가 있으면0.8을 한 번 뺀다. 이것은 **새 정책의 휴리스틱**이며 기존 M2/M3의 실제 근 손상 판정이 아니다.
- 합계0–10, >=8.5극강/>=5.5강/>=4중화/>=2약/나머지극약이다. 정수 tenths로 계산하며 표시 반올림을 역산하지 않는다.
- 상류 korean_saju의 자동 합화에 따른 천간 점수 삭제, 亥의 추가 戊 장간, 시각 미상+1은 채택하지 않았다. 기존 장간표·근 정책을 바꾸지 않는다. 시각과 네 기둥은 필수다.

상류와 같은 정책이라고 표시하지 않는다. [감사·반례](research/OSS_ENGINE_AUDIT_20261114.md), [MIT 고지](../THIRD_PARTY_NOTICES.md)를 함께 읽는다. 원문 전체의 합의·관성 경중·실제 생조 전달·성격/파격·용신·종격·사건 예측은 이 정책의 결과가 아니다.

## PowerShell

이 PC의 고정 Node 경로는 가이드에만 둔다. 다른 PC에서는 `$node`를 해당 Node22로 바꾼다. 후보·고정 지문 검증을 통과해야 하고, 없으면 기존 fixture/외부 서버로 fallback하지 않는다.

```powershell
Set-Location 'C:\Users\Home\Desktop\만세력 엔진\source'
$node = 'C:\Users\Home\Desktop\Manseryeok-KASI-1950-2026-windows-x64\Manseryeok-KASI-1950-2026\runtime\node.exe'
$env:PATH = (Split-Path -Parent $node) + ';' + $env:PATH
& $node 'C:\Program Files\nodejs\node_modules\npm\bin\npm-cli.js' run --silent build

$common = @(
  '--profile', 'kasi-api-1989-2026-local-v1',
  '--candidate', '.private\kasi-research-1950-2026-fe84ab4-a',
  '--manifest-sha', '8ffadb04c8460969085610162d3d5e8855af9272a8a4be1dbe10123c15f90edf',
  '--clock-policy', 'KR_API_PUBLISHED_KST_MODERN_1988_POST_DST_V1',
  '--day-rollover', 'CIVIL_MIDNIGHT',
  '--hour-stem-reference', 'SELECTED_DAY_PILLAR',
  '--experimental-policy', 'EXPERIMENTAL-WEIGHTED-SUPPORT-LOCAL-NO-TRANSFORMATION-V01'
)

# 가상 양력 입력, 한국어 요약
& $node .\scripts\experimental\weighted-support.mjs @common --calendar GREGORIAN --date 2026-06-01 --time 12:00 --output text

# 같은 가상 생일의 음력 평달 입력, JSON
& $node .\scripts\experimental\weighted-support.mjs @common --calendar KOREAN_LUNAR --lunar-year 2026 --lunar-month 4 --lunar-day 16 --leap false --time 12:00 --output json

# 입춘 표시 분: 두 원국 후보, 별도 점수 둘
& $node .\scripts\experimental\weighted-support.mjs @common --calendar GREGORIAN --date 2026-02-04 --time 05:02 --output text

# 토왕 B 표시 분: 원국/점수 하나, 기존 계절 대안 둘
& $node .\scripts\experimental\weighted-support.mjs @common --calendar GREGORIAN --date 2026-04-17 --time 20:49 --output json
```

JSON stdout에는 배너·진행 로그를 섞지 않는다. 기본 파일 저장·개인 출생정보 로깅·API/LLM 호출은 없다. 실패는 안전한 stderr와 종료1이다. 지원 출생일은 기존 양력 환산 `[1989-01-01,2027-01-01)` 그대로이며 역사시·2027조회 범위를 열지 않는다.

## 실제 실행한 가상 결과

```text
후보 1: 丙午·癸巳·丙午·甲午
선택한 점수 정책의 결과는 ‘극신강’입니다. 점수는 8.5/10입니다.
계산: 연지 1 + 월지 3.5 + 일지 1.5 + 시지 1 + 연간 1 + 월간 0 + 시간 0.5 + 월지 충 보정 0.
기존 M3 경로: OUTSIDE_POLICY_SCOPE. 기존 결과를 이 점수로 덮어쓰지 않습니다.
```

2026-01-08은 이 정책에서0/극약이지만 기존 계절 水旺·구성상 근은 그대로다. 점수 정책이 계절 표와 다른 입력을 쓰는 반례이며 실제 누구의 힘이 약하다는 인증이 아니다. 입춘05:02의 두 원국은6.5/강과3/약, B동분의 한 원국은6.2/강이며 계절 경로가 둘이어도 점수는 하나다.

## import와 결과 계약

- 순수 계산: `src/experimental/weightedSupportV1.ts`의 `scoreWeightedSupport`, `weightedSupportClass`, `validateWeightedSupport`.
- 실행 연결: `scripts/experimental/weighted-support.mjs`의 `createExperimentalWeightedProfile`, `deriveExperimentalWeightedSupport`, `validateExperimentalWeightedResult`, `renderExperimentalWeightedText`.
- 실험 선택은 기존 `M3-LIMITED-ABSENT-ROOT-RESOURCE-SYNTHESIS-V01`과 `M4-ZHENGGUAN-WEALTH-RESOURCE-POSITION-REVIEW-V01`의 기존 공개 묶음을 병렬 비교용으로 호출한다. 하위 정책 선택은 `existing.provenance`와 각 원 결과에 남는다. 개별 하위 옵션은 이 CLI에서 받지 않으며 알 수 없는 인자는 거절한다.
- `existing`는 원래 발급된 결과 전체다. `experimental[]`는 원국 후보별 새 점수·정책 분류다. 같은 요청의 M1은1회이고 점수 함수는 역법을 계산하지 않는다.
- `policyId/policyVersion/sourceRefs/assumptions/inputFacts/decisionTrace/alternatives/limitations`가 있다. `alternatives`는 이 점수 자체의 추가 분기가 없어 빈 배열이며, 원래 후보·계절 대안·다른 정책 결과는 `existing`에 그대로 있다.
- `facts.candidates[i]...` 참조는 `existing`을 기준으로 해석한다. 부모 `chart.candidates[i]`와 같은 인덱스여야 한다. 실제 CLI JSON6건의94참조를 원래 fact/member까지 확인했다.
- 순수 함수 검증은 구조·산술 재현성 검사다. 외부 JSON 출처 인증이 아니다. 로컬 어댑터는 기존 같은 프로세스의 M2/M3 발급·불변 객체를 확인하며 serialized clone을 신뢰하지 않는다.

정책 분류 `BALANCED`도 정의한 점수 구간의 이름이다. 기존 엄격한 M3의 미지원 중화 판정을 소급 구현했다는 뜻이 아니다. 기존 finalStrength/G0/G1-P2 및 출시 게이트를 바꾸지 않는다.

검증 SHA·668회귀·실제97후보·업스트림 차이·실패 기록은 [실행 보고](engineering/OSS_ENGINE_COMPARISON_EXECUTION_20261114.md)에 있다. 이 실험을 제품 기본 정책으로 고정하는 것은 후속 판단이다.
