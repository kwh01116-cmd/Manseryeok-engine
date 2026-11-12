# 선택형 M3 인성 생조 채택 제한 실행

**작성 중 — 아래 새 실행 예시·검사 상태는 최종 실행 영수증을 받은 뒤 확정한다. 현재 문서만으로 새 코드의 PASS나 원격 전달을 주장하지 않는다.**

기존 `kasi:evidence`에 **`--support-policy M3-RESOURCE-ADJACENT-COMBINATION-HOLD-V01`**과 의존 통근 정책 **`--root-policy M3-ROOT-PRESENCE-HIDDEN-SAME-ELEMENT-V01`**을 모두 명시한다. 표면 정인·편인의 모든 오합 상대를 위치별로 확인하고, 단일 인접 합·무근 조건에서 독립 생조 요소의 자동 채택을 유보할지 판단한다. 무근만으로 인성을 무효로 만들거나 상대가 있다는 이유만으로 삭제하지 않는다.

출생 지원 범위는 기존 양력 환산 **[1989-01-01,2027-01-01)**이다. 시각·시간/일주/시주·M2/M3 정책은 필수다. 계절 정책은 별도 선택이며 이 기능에 필수가 아니다. 키·네트워크·KASI 재수집·2027 supplement를 실행 의존성으로 추가하지 않는다. 출생정보와 결과는 기본 stdout에만 출력한다.

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

## 결과를 읽는 방법

| 조건 | 실제 선택 정책의 결정 | 전체 효력과 구분 |
| --- | --- | --- |
| 표면 인성 대상 없음 | `NOT_APPLICABLE` | 장간 인성 또는 명식 전체의 인성 부재가 아님 |
| 표면 오합 상대 없음 | `NO_HOLD_BY_THIS_RULE` | 무근이어도 이 규칙으로 유보하지 않음. 생조 확정은 아님 |
| 원격·격위·복수 상대 또는 공유 상대 경쟁 | `OUT_OF_SCOPE_INTERACTION` | 관련 위치와 통근 예외를 보존하고 이 정책에서 효과를 결정하지 않음 |
| 단 하나의 인접 타간 상대, 경쟁 없음, 자체 무근 | `SUPPORT_HELD_UNDER_SELECTED_RULE` | 독립 생조 자동 채택만 유보. 원국·인성·근을 삭제하지 않음 |
| 위와 같은 합 조건, 자체 유근 | `ROOTED_COMBINATION_EFFECT_UNRESOLVED` | 통근 예외로 무효를 확정하지 않음. 충분한 생조 역시 확정하지 않음 |

오합은 甲己·乙庚·丙辛·丁壬·戊癸의 짝이다. 연→월→일→시의 고정 순서로 인접을 검사하고 모든 상대를 보존한다. 두 인성이 같은 상대를 향하면 각자의 상대 수가 하나여도 경쟁 조건을 남긴다. 원격/복수/경쟁과 자체 근이 동시에 있으면 범위 밖 상태를 우선하며 통근 예외 사유도 버리지 않는다.

인성은 일간을 생하는 오행이고 오합 짝은 그런 관계가 아니므로, 유효한 인성과 일간 자체의 오합은 없다. 시간 인성에 허구의 인접 상대를 만들지 않는다. 실제 단일 인접 유보/통근 예외 분기는 연간↔월간에서 도달한다. 모든 합을 다루는 범용 효력 판정은 아니다.

## 실행 예시와 합성 정책 사례

**이 절의 새 실행 영수증은 아직 확정 전이다. 아래 내용은 사용자 기대 계약과 독립 리터럴 사례의 예상이며, 최종 실제 CLI 결과로 대조해 갱신한다.**

1. 가상2026-06-01 12:00의 丙午·癸巳·丙午·甲午는 시간 甲이 편인이고 자체 목근은 없지만 짝 己가 표면에 없다. `NO_HOLD_BY_THIS_RULE`를 기대한다. “무근은 확인되지만 이번 합 규칙의 채택 제한은 없고, 실제 생조 크기는 평가하지 않는다”는 구분이다.
2. 합성 단위 戊午·癸巳·甲午·丙寅에서는 월간 癸 정인의 유일한 표면 상대 戊가 연간에 인접하고 수근은 없다. `SUPPORT_HELD_UNDER_SELECTED_RULE`를 기대한다. 이 네 기둥을 실제 출생 시각으로 검증했다고 하지 않는다.
3. 바로 위 합성 구조의 **연지만 午→子**로 바꾸면 癸의 정확한 수근이 생긴다. 천간·짝·위치는 그대로이며 `ROOTED_COMBINATION_EFFECT_UNRESOLVED`를 기대한다. 午→申의 壬 장간도 기존 동오행 통근 정책에서는 예외의 근이다.
4. 합성 己巳·癸巳·丙午·甲午의 시간 甲과 연간 己는 원격이다. 戊午·癸巳·甲午·癸巳에서는 월·시의 두 인성이 연간 戊를 공유한다. 각각 원격 또는 경쟁을 남기며 `OUT_OF_SCOPE_INTERACTION`을 기대한다.
5. 가상2026-04-17 20:49에서는 부모 원국 하나 아래 계절 대안만 둘이다. 같은 표면 천간·근·오합 판단을 한 번 연결하고 계절 대안 때문에 새 합이나 근을 만들지 않는다.
6. 가상2026입춘02-04 05:02는 실제 M1의 전/후 원국 부모가 둘이다. 각 부모의 인성·근·합 상대·설명을 따로 유지한다. 첫 후보 자동 선택·후보 간 합성·확률은 없다.

실제 날짜를 찾은 정책 사례와 합성 구조 사례는 최종 실행 보고서에서 구분한다. 합성 사례의 독립성은 resolver/helper에서 expected를 만들지 않았다는 의미이며, 별도 인간/비평 판본 검토를 뜻하지 않는다.

## JSON·함수·기존 동작

새 옵션이 없으면 기존 JSON/TEXT 계약을 유지한다. 최종 검증에서 무옵션·계절·통근 옵션의 기존 출력 bytes를 비교할 예정이다. 아직 수행하지 않은 비교를 PASS로 기록하지 않는다. 지원 옵션만 선택한 결과의 schema는 `kasi-local-m3-evidence-support-v1`, 계절까지 선택하면 `kasi-local-m3-evidence-seasonal-support-v1`이다.

`support`·`supportExplanation`을 별도 계층으로 추가하며 기존 `m1`·`facts`·`evidence`·`root`·계절 결과는 유지한다. 후보별 `resources`에는 인성 위치·십성·자체 근·root target 참조·모든 상대/거리/경쟁 위치·새 결정/사유가 남는다. 설명→결정→인성/근/장간·위치 facts→동일 후보로 추적한다. KASI 달력 출처와 전통 명리 규칙·프로젝트 결정표의 출처는 분리한다.

핵심은 `src/m3/resourceSupportV1.ts`의 `deriveM3ResourceSupport`·`explainM3ResourceSupport`·각 validator다. 기존 발급 M3·통근·원래 M2를 받아 후보 연결을 검사한다. 로컬 어댑터는 같은 실행의 발급 객체·원본 후보 지문을 유지하고 요청당 출생 M1을 한 번만 계산한다. 다른 요청/후보의 근, 누락된 root target, 복사·변조된 결과를 무근으로 채우지 않는다.

`totalSupportEfficacy=NOT_EVALUATED`, `finalStrength=NOT_IMPLEMENTED`다. 기존 구조적 `EVIDENCE_ONLY`, 계절/통근의 제한적 판정, M3 최종 해석/출시 게이트는 유지한다. 합화·재극인·지지 근 손상·통관·점수·신강약·격국·용신·길흉은 추가하지 않는다.

문헌의 원저·서락오 주석·전사 확인 수준·프로젝트의 좁은 결정표는 [정책 문서](research/M3_RESOURCE_SUPPORT_POLICY_V01.md)에, 실제 검사 수·상태 분포·실패·정확한 SHA는 [실행 보고서](engineering/KASI_M3_RESOURCE_SUPPORT_EXECUTION_20261112.md)에 기록한다. 다음 최소 작업은 이 고정 사례 묶음을 바탕으로 계절·근·생조 제한·설기/극 근거를 종합하는 **한 가지 좁은 결정표와 대표 명식 검증**이다. 이번 구현에 그 후속 효력 규칙을 포함하지 않는다.
