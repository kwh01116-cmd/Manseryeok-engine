# 선택형 M3 구성상 통근·표면 생조 요소의 자체 근 실행

기존 `kasi:evidence`에 **`--root-policy M3-ROOT-PRESENCE-HIDDEN-SAME-ELEMENT-V01`**을 명시한다. 네 표면 천간이 각각 원국 네 지지의 장간에 같은 오행의 근을 갖는지 판정하고, 일간 기준 표면 인성·비겁에는 그 천간 자신의 근 결과를 연결한다. 기존 계절 옵션은 독립적으로 선택하며 숨은 종합 신강약 공식은 없다.

지원 출생 범위는 양력 환산 **[1989-01-01,2027-01-01)**이다. 시각·기존 시간/일주/시주·M2/M3 정책은 필수다. 원본·후보·supplement는 읽기 전용이며 실행에는 키·네트워크·새 수집이 필요하지 않다. 출생정보와 결과는 기본적으로 stdout에만 출력하고 자동 저장하지 않는다.

## PowerShell 실행

다음 경로는 현재 검증 PC의 실행 예다. 제품 코드에 절대 경로를 넣지 않는다. 다른 PC에서는 검증한 Node22 경로와 로컬 저장소 위치를 바꾼다. 기존 의존성과 잠금 파일을 유지한다.

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
  '--root-policy', 'M3-ROOT-PRESENCE-HIDDEN-SAME-ELEMENT-V01'
)

# 통근만 선택한 가상 양력 입력
& $node .\scripts\kasi\local-m3-evidence.mjs @common `
  --calendar GREGORIAN --date 2026-06-01 --time 12:00 --output text

# 같은 입력에서 계절 판단도 명시적으로 선택
& $node .\scripts\kasi\local-m3-evidence.mjs @common `
  --seasonal-policy M3-SEASONAL-SILI-PRE18-NOMINAL-MINUTES-V02 `
  --calendar GREGORIAN --date 2026-06-01 --time 12:00 --output json

# 같은 출생 날짜의 음력 동등 입력
& $node .\scripts\kasi\local-m3-evidence.mjs @common `
  --seasonal-policy M3-SEASONAL-SILI-PRE18-NOMINAL-MINUTES-V02 `
  --calendar KOREAN_LUNAR --lunar-year 2026 --lunar-month 4 --lunar-day 16 `
  --leap false --time 12:00 --output text

# 같은 원국 아래 계절 대안이 둘인 토왕 시작 표시 분
& $node .\scripts\kasi\local-m3-evidence.mjs @common `
  --seasonal-policy M3-SEASONAL-SILI-PRE18-NOMINAL-MINUTES-V02 `
  --calendar GREGORIAN --date 2026-04-17 --time 20:49 --output text

# 실제 M1 원국 후보가 둘인 입춘 발표 분
& $node .\scripts\kasi\local-m3-evidence.mjs @common `
  --seasonal-policy M3-SEASONAL-SILI-PRE18-NOMINAL-MINUTES-V02 `
  --calendar GREGORIAN --date 2026-02-04 --time 05:02 --output json
```

기존 npm 명령도 같은 인자를 받는다. `npm run --silent kasi:evidence -- ...`로 실행하면 npm 배너 없이 JSON을 받을 수 있다. 현재 PC의 설치된 중첩 `npm.cmd`가 다른 Node로 연결되는 환경에서는 위 절대 Node22의 직접 CLI를 사용한다. 임의 정책·중복 옵션·빠진 시간·알 수 없는 인자는 명시적으로 거절한다.

## 판정의 의미

정책 아래 네 지지 중 하나 이상에 대상 천간과 동오행인 **실제 장간**이 있으면 `chartRootPresence=PRESENT_UNDER_POLICY`다. 네 지지를 모두 검사했고 매칭 장간이 없으면 `ABSENT_UNDER_POLICY`다. 장간이나 기둥이 누락된 입력은 ABSENT로 채우지 않고 거절한다.

각 대상에는 네 지지별 성립 여부와 실제 member 연결이 남는다. `EXACT_STEM`은 같은 글자, `SAME_ELEMENT_DIFFERENT_STEM`은 음양이 다른 동오행 천간이다. 연간과 일간이 모두 丙이어도 두 대상 위치를 각각 유지한다. 일지 장간도 검사한다.

`MAIN_QI`/`OTHER`는 기존 장간표의 본기/기타 표시다. 같은 기둥·월지 여부와 함께 위치 속성으로 보존하며 강근/약근·점수·수치 비율로 바꾸지 않는다. 관계가 겹쳐도 근을 삭제하거나 합화 오행으로 바꾸지 않는다.

표면 생조 요약은 연·월·시의 정인/편인·비견/겁재만 대상으로 삼는다. 일간 자신을 추가 비겁으로 세지 않는다. 예를 들어 인성 甲의 목근은 그 甲 자신의 근이며, 화 일간의 직접 화근으로 복사하지 않는다. 인성이 무근이어도 인성의 존재와 생하는 방향은 유지된다. 장간 속 인성·비겁과 나머지 천간의 근 판정도 JSON에 그대로 남는다.

`rootEfficacy`·`rootStrength`는 `NOT_EVALUATED`, `finalStrength`는 `NOT_IMPLEMENTED`다. PRESENT는 유효 강근·신강을 뜻하지 않고 ABSENT는 신약·무력·종격을 뜻하지 않는다. 인성·비겁의 자체 근도 실제 생조 전달량이 아니다. 기존 M3 최종 해석·출시 게이트는 유지한다.

## JSON 계약과 함수 재사용

| 선택 | 결과 계약 |
| --- | --- |
| 통근 옵션 없음 | 기존 무옵션·계절 v0.1/v0.2 JSON/TEXT 유지 |
| 통근만 선택 | `kasi-local-m3-evidence-root-v1` |
| 통근과 계절 함께 선택 | `kasi-local-m3-evidence-seasonal-root-v1` |

기존 `evidence`와 구조 설명은 변경하지 않고 별도 `root`/`rootExplanation`을 추가한다. `root.schemaVersion=m3-root-presence-v1`이며 통근 계층의 상태는 `RESOLVED_UNDER_POLICY`다. 상위 구조 근거 상태 `EVIDENCE_ONLY`와 모순되지 않는다. 실제 성립/불성립 판단은 각 대상·지지의 presence 필드에서 확인한다.

`root.candidates[].targets`는 네 표면 천간을, `supportStems`는 표면 인성·비겁과 자신의 target 참조를 제공한다. 각 match는 부모 후보·대상 위치·지지 위치·실제 장간 member·일치 유형·본기/기타·같은 기둥/월지 여부·관계 evidence refs를 가진다. 설명의 judgment/inputEvidence/inputFact/inputMember refs에서 정책·규칙·계산 출처까지 추적할 수 있다. KASI 계산 자료 출처와 원전/주석/프로젝트 정의 출처는 별도다.

순수 모듈은 `src/m3/rootPresenceV1.ts`다.

- `resolveStemBranchRootPresence(input,{policyId})`: 명시한 장간 정책의 단일 천간/지지 조회.
- `deriveM3RootPresence(evidence,{policyId,m2Facts})`: 발급된 기존 M3와 그 M2 자료에서 네 대상·지원 천간의 근 연결.
- `explainM3RootPresence(result)` / `validateM3RootPresenceExplanation(explanation,result)`: 결정론적 한국어 템플릿과 참조 검증.
- `validateM3RootPresence(result,{evidence,m2Facts})`: 해당 실행에서 발급한 불변 결과와 연결 문맥 검사.

로컬 어댑터는 같은 요청의 M1/M2/M3 발급 결과를 확인하고 이미 계산한 결과를 재사용한다. 통근이나 계절 때문에 출생 M1을 다시 계산하지 않는다. 순수 모듈의 구조·참조 검사가 외부 원본 진위·판본·권리의 인증을 뜻하지는 않는다.

토왕 B 동분에서는 원래 부모 후보 하나와 통근 한 세트를 유지하고 계절 대안만 둘로 둔다. 입춘 T 동분에서는 실제 M1 부모별로 네 기둥과 근을 따로 계산한다. 첫 후보 자동 선택·확률·서로 다른 후보의 근 혼합은 없다.

## 검증 범위와 후속 단계

[정책 문서](research/M3_ROOT_PRESENCE_POLICY_V01.md)는 원저와 서락오 주석·전사 차이, 기존 장간표와 프로젝트의 동오행 일반화를 구분한다. 원전 본문의 음장생 논의를 모든 학파가 공유하는 단일 표라고 쓰지 않는다. 실제 확인하지 않은 스캔·판본·권리·예측 효력은 미확인이다.

120개 독립 리터럴 단위 조합은 이 정의의 구현 검사이며 실제 출생 가능한 완전 명식120개를 뜻하지 않는다. 합성 반례·참조/변조·CLI·실제 비공개 명식의 연결 검사는 서로 구분한다. 최종 실행 건수·SHA·실패·자원 조건과 결과 예시는 [실행 보고서](engineering/KASI_M3_ROOT_PRESENCE_EXECUTION_20261112.md)에 기록한다.

다음 최소 단계는 이 결과를 소비할 제한적 생조·관계 효과 또는 종합 판단의 **한 가지 명시적 규칙과 독립 사례**다. 이번에 근력 점수·사령·유효 통근·합화·용신·신강약을 자동 구현하지 않는다. 기존 계절·M7 정책과 기본 엔진/G0/G1·지원 범위·원본 자료는 유지한다.
