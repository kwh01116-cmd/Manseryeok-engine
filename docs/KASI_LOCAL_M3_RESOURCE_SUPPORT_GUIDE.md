# 선택형 M3 인성 생조 채택 제한 실행

**출생 입력에서 특정 천간합에 따른 생조 자동 채택 제한을 실제로 계산한다.** 정책은 M3-RESOURCE-ADJACENT-COMBINATION-HOLD-V01/0.1.0이며 의존 통근 M3-ROOT-PRESENCE-HIDDEN-SAME-ELEMENT-V01도 명시한다. 계절은 선택 사항이고 키·네트워크·2027보강본은 제품의 필수 의존성이 아니다. 출생 범위/시각 정책은 기존 [1989-01-01,2027-01-01) 그대로다. 시각을 생략하거나 숨은 학파·정오를 선택하지 않는다.

## PowerShell 명령

아래 Node22 경로는 현재 검증 PC의 실행 예다. 다른 PC에서는 검증한 Node22와 로컬 저장소 경로를 바꾼다. 생산 코드에는 PC별 절대 경로를 넣지 않는다. 설치된 의존성과 lock 파일을 유지한다.

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
  '--m2-profile', 'm2-basic-classification-local-v1',
  '--m3-profile', 'm3-structural-evidence-local-v1',
  '--root-policy', 'M3-ROOT-PRESENCE-HIDDEN-SAME-ELEMENT-V01',
  '--support-policy', 'M3-RESOURCE-ADJACENT-COMBINATION-HOLD-V01'
)

# 가상 양력 입력: 무근 편인이나 이번 합 규칙으로는 제한하지 않는 사례
& $node .\scripts\kasi\local-m3-evidence.mjs @common `
  --calendar GREGORIAN --date 2026-06-01 --time 12:00 --output text

# 같은 출생 날짜의 음력 동등 입력, JSON만 stdout으로 출력
& $node .\scripts\kasi\local-m3-evidence.mjs @common `
  --calendar KOREAN_LUNAR --lunar-year 2026 --lunar-month 4 --lunar-day 16 `
  --leap false --time 12:00 --output json

# 계절 판단을 나란히 선택하되 종합 강약 공식은 적용하지 않음
& $node .\scripts\kasi\local-m3-evidence.mjs @common `
  --seasonal-policy M3-SEASONAL-SILI-PRE18-NOMINAL-MINUTES-V02 `
  --calendar GREGORIAN --date 2026-06-01 --time 12:00 --output text

# 원국 하나 아래 계절 대안만 둘인 토왕 시작 표시 분
& $node .\scripts\kasi\local-m3-evidence.mjs @common `
  --seasonal-policy M3-SEASONAL-SILI-PRE18-NOMINAL-MINUTES-V02 `
  --calendar GREGORIAN --date 2026-04-17 --time 20:49 --output text

# 원래 M1 부모 후보가 둘인 입춘 표시 분
& $node .\scripts\kasi\local-m3-evidence.mjs @common `
  --seasonal-policy M3-SEASONAL-SILI-PRE18-NOMINAL-MINUTES-V02 `
  --calendar GREGORIAN --date 2026-02-04 --time 05:02 --output json
```

기존 npm 진입점도 같은 인자를 받는다. `npm run --silent kasi:evidence -- ...`로 실행하면 JSON stdout에 npm 배너가 섞이지 않는다. 현재 PC에서 중첩 npm이 다른 Node를 호출하면 위 Node22 직접 CLI를 사용한다. 알 수 없는 옵션·정책·범위, 중복 인자·누락 시각, 통근 의존 정책 누락은 명시적 입력 오류다.

## 이 규칙이 새로 결정하는 것

기존 인성/근 목록에 **대상별 전체 표면 오합 상대와 고정 위치, 경쟁, 통근 예외를 반영한 결정**을 추가한다. 짝은甲己·乙庚·丙辛·丁壬·戊癸, 위치는 연→월→일→시다. 모든 상대를 열거한 뒤 범위 밖 조건을 우선한다.

| 조건 | 실제 선택 정책의 결정 |
| --- | --- |
| 연·월·시 표면 정인/편인 없음 | NOT_APPLICABLE. 장간/명식 전체 인성 부재가 아님 |
| 표면 오합 상대 없음 | NO_HOLD_BY_THIS_RULE. 무근이어도 이 규칙으로 유보하지 않음 |
| 원격/격위·복수 상대·공유 상대 경쟁 | OUT_OF_SCOPE_INTERACTION. 위치/상대/통근 예외 사유 모두 보존 |
| 경쟁 없는 유일한 인접 타간 상대·자체 무근 | SUPPORT_HELD_UNDER_SELECTED_RULE. 독립 생조 자동 채택 유보 |
| 같은 단일 인접 조건·자체 유근 | ROOTED_COMBINATION_EFFECT_UNRESOLVED. 통근 예외 때문에 무효/충분한 생조 모두 확정하지 않음 |

유효 인성은 일간 자체와 오합할 수 없어 이 정책의 단일 인접 유보/통근 예외는 실제로 연↔월에서 도달한다. 시간 인성에 허구의 인접 상대를 만들지 않는다. 두 인성이 같은 상대를 공유하면 각자의 상대 수가1이어도 경쟁이다. 다른 요청/후보의 근·누락·변조는 무근으로 채우지 않고 거절한다.

## 실제로 실행한 가상 사례

| 가상 입력/구조 | 실제 새 판단 |
| --- | --- |
| 2026-06-01 12:00 / 음력2026-04-16 평달12:00 | 시간甲 편인·무근·짝己 없음 → NO_HOLD_BY_THIS_RULE. 양음력 의미/설명 일치 |
| 2004-05-18 12:00 | 연간甲 정인·무근·월간己만 인접 → SUPPORT_HELD_UNDER_SELECTED_RULE |
| 1998-11-20 12:00 | 연간戊 정인·유근·월간癸만 인접 → ROOTED_COMBINATION_EFFECT_UNRESOLVED |
| 1990-01-01 12:00 / 1989-02-20 12:00 | 각각 시간甲↔연간己 / 연간己↔시간甲의 원격. 자체 근과 예외도 보존한 OUT_OF_SCOPE_INTERACTION |
| 2026-04-17 20:49 | 원국1·합 판단1·계절 대안2. 시간戊 정인 NO_HOLD.20:48/49/50의 원국/근/합 불변 |
| 2026-02-04 05:02 | 입춘 전 부모는 시간丁 편인, 후 부모는 연간丙 정인·시간丁 편인. 부모별 NO_HOLD/자체 근·참조 유지 |
| 1990-01-09 12:00 | 표면 인성 대상 없음 NOT_APPLICABLE. 장간 인성 보존 |

2026-06-01의 실제 새 문장:

> 시간 甲(편인)은 선택한 장간 동오행 정책의 자체 근은 없습니다. 표면 오합 상대가 없어 이번 천간합 규칙에 따른 생조 채택 제한은 없습니다.

실제 날짜의 채택 유보/통근 예외도 같은 명령으로 재현한다:

```powershell
& $node .\scripts\kasi\local-m3-evidence.mjs @common --calendar GREGORIAN --date 2004-05-18 --time 12:00 --output text
& $node .\scripts\kasi\local-m3-evidence.mjs @common --calendar GREGORIAN --date 1998-11-20 --time 12:00 --output json
```

이 두 실제 날짜는 다른 명식이므로 근 하나만 바꾼 대조라고 하지 않는다. 제어된 합성 사례는 戊午·癸巳·甲午·丙寅 ↔ 戊子·癸巳·甲午·丙寅다. 표면 천간/짝/위치를 유지한 채 연지午→子만 바꾸면 월간癸가 채택 유보→통근 예외로 바뀐다. 합성 지지 문맥은 역법상 출생으로 인증하지 않았다. 경쟁 사례 戊午·癸巳·甲午·癸巳는 월·시 인성이 같은 연간戊를 향해 모두 범위 밖이다. 정상17/거절3의 고정 사례를 후속 규칙 회귀 기준으로 보존한다.

## JSON·함수·기존 호환

새 옵션이 없으면 기존 JSON/TEXT를 유지한다. 실제 무옵션 고정SHA f0572052a3eadb118a1c2aab3ae9758550f9d0b80e724ae922c5cfb634b3f075와 기존 계절v0.1/v0.2/root 대표 bytes를 과거 산출물에 대조했다. support만 선택하면 kasi-local-m3-evidence-support-v1, 계절과 함께 선택하면 kasi-local-m3-evidence-seasonal-support-v1이다. support/supportExplanation만 별도 계층에 추가하고 기존 구조·계절·근을 바꾸지 않는다.

핵심 src/m3/resourceSupportV1.ts는 deriveM3ResourceSupport·explainM3ResourceSupport와 validator를 export한다. 이미 발급한 M3·root와 원래M2를 소비하며 로컬 어댑터가 같은 실행의 명식/후보/지문 연결을 검사한다. 제품 출생M1은 요청당1회 실측했고 M2는 기존 단일 호출을 재사용한다. 설명→새 결정→인성/통근/장간 위치·facts→후보·명리 규칙 출처와 KASI계산 출처를 추적한다. 직렬화 ref를 외부 진위 인증으로 표시하지 않는다.

**제한 없음은 생조 확정이 아니고, 채택 유보는 인성 삭제가 아니다.** 유근 예외·원격/경쟁의 효과, 생조 전체 효력·근력·관계 효력은 미평가다. 신강약·점수·용신·길흉은 미구현이며 최종 M3 해석/상용 게이트는 차단 상태다. 장간 인성·대운/세운은 이 표면 인성 결정의 대상에 추가하지 않는다. 합화·재극인·지지근손상도 구현하지 않는다.

실행SHA **730c1e1b08da6f5862b5dbe90627367658dbc626**에서578/578, M2감사·Lab/KASI·CLI30과 두 시간대 각49,799쌍을 확인했다. 첫 전체검사의 기존M7 메모리 할당 실패·별도4/4·같은코드 전체 재검사, 개발 참조 오류·driver시작전 오류를 삭제하지 않았다. source/edition/권리·효력 인증은 아니다. [정의/원저·주석 차이](research/M3_RESOURCE_SUPPORT_POLICY_V01.md) · [실제 집계·실패·정확한SHA](engineering/KASI_M3_RESOURCE_SUPPORT_EXECUTION_20261112.md).
