# 선택형 월령 계절 분류 — 왕상휴수사 v0.1

기존 `kasi:evidence` 경로에 `--seasonal-policy M3-SEASONAL-FOUR-SEASONS-EARTH-MONTHS-DEFERRED-V01`을 명시하면, 같은 실행에서 계산한 후보의 일간 오행과 사주 월지로 계절 상태를 분류한다. 옵션을 생략하면 기존 M3 구조 근거 JSON·TEXT를 유지한다. 별도 후보 로더·명식 계산기·제품 화면은 추가하지 않는다.

이 결과는 **계절별 전통 분류**다. 구조적 근거의 `EVIDENCE_ONLY`와 별도 계층이며 최종 신강약은 계속 `NOT_IMPLEMENTED`다. 계절 상태가 `RESOLVED_UNDER_POLICY`여도 기존 M3 해석·출시 게이트, 기본 엔진/G0/G1-P2 NO-GO를 승격하지 않는다.

## 실행 준비

아래는 개인 기록이 아닌 가상 입력이다. Node22와 기존 잠금 의존성을 사용한다. 현재 PC의 경로는 실행 가이드에만 있으며 생산 코드에 하드코딩하지 않는다.

```powershell
Set-Location 'C:\Users\Home\Desktop\만세력 엔진\source'
$node = 'C:\Users\Home\Desktop\Manseryeok-KASI-1950-2026-windows-x64\Manseryeok-KASI-1950-2026\runtime\node.exe'
$npmCli = 'C:\Program Files\nodejs\node_modules\npm\bin\npm-cli.js'
$env:PATH = (Split-Path -Parent $node) + ';' + $env:PATH
& $node $npmCli run build

$common = @(
  '--profile', 'kasi-api-1989-2026-local-v1',
  '--candidate', '.private\kasi-research-1950-2026-fe84ab4-a',
  '--manifest-sha', '8ffadb04c8460969085610162d3d5e8855af9272a8a4be1dbe10123c15f90edf',
  '--clock-policy', 'KR_API_PUBLISHED_KST_MODERN_1988_POST_DST_V1',
  '--day-rollover', 'CIVIL_MIDNIGHT',
  '--hour-stem-reference', 'SELECTED_DAY_PILLAR',
  '--m2-profile', 'm2-basic-classification-local-v1',
  '--m3-profile', 'm3-structural-evidence-local-v1',
  '--seasonal-policy', 'M3-SEASONAL-FOUR-SEASONS-EARTH-MONTHS-DEFERRED-V01'
)
```

검토한 기존 비공개 후보와 위 고정 기대 지문을 사용한다. 검사 대상 manifest에서 읽은 값을 기대 지문으로 대신하지 않는다. 원문·export·체크포인트·후보 a/b·2027 supplement는 읽기 전용이다. 이번 분류는 **2027 supplement 없이** 동작하며 네트워크·KASI 키·추가 수집이 필요 없다.

## 양력·음력과 경계 사례

```powershell
# 가상 양력: 2026-06-01 12:00. 丙/巳는 여름 火旺.
& $node .\scripts\kasi\local-m3-evidence.mjs @common `
  --calendar GREGORIAN --date 2026-06-01 --time 12:00 --output text

# 같은 날짜의 음력 평달 입력. 같은 명식·계절 판단 의미를 JSON으로 확인.
& $node .\scripts\kasi\local-m3-evidence.mjs @common `
  --calendar KOREAN_LUNAR --lunar-year 2026 --lunar-month 4 --lunar-day 16 `
  --leap false --time 12:00 --output json

# 가상 겨울: 丙/子는 火死. 死는 전통 계절 분류 이름이다.
& $node .\scripts\kasi\local-m3-evidence.mjs @common `
  --calendar GREGORIAN --date 1990-01-01 --time 12:00 --output text

# 2026 입춘의 표시 분: 己丑 후보는 보류, 庚寅 후보의 己 일간은 봄 土死.
& $node .\scripts\kasi\local-m3-evidence.mjs @common `
  --calendar GREGORIAN --date 2026-02-04 --time 05:02 --output text

# 토 일간 자체는 보류 사유가 아니다. 가상 戊/巳는 여름 土相.
& $node .\scripts\kasi\local-m3-evidence.mjs @common `
  --calendar GREGORIAN --date 2026-06-03 --time 12:00 --output text

# 사주 월지가 계절말 월인 가상 입력: 이 판단 항목만 보류한다.
& $node .\scripts\kasi\local-m3-evidence.mjs @common `
  --calendar GREGORIAN --date 2026-04-10 --time 12:00 --output json

# npm 출력에 배너를 섞지 않으려면 --silent를 사용한다.
& $node $npmCli run --silent kasi:evidence -- @common `
  --calendar GREGORIAN --date 2026-06-01 --time 12:00 --output json
```

위 분류 기대값과 실제 실행 완료 증거는 구분한다. 최종 실행 보고서가 실제 subprocess·입력별 결과·검사 SHA를 기록한다. 지원 출생 범위는 양력 환산 `[1989-01-01,2027-01-01)`이다. 기존 양력/음력·윤달 구분, HH:mm 필수와 명시적 일주/시주 정책을 유지한다. 시간 미상에 정오를 넣지 않으며 누락·미지원 정책, 잘못된 날짜·범위·인자를 거절한다.

기본 출력은 stdout이고 개인 입력·결과를 자동 저장하지 않는다. JSON에는 로그·배너가 없고 오류는 안전한 stderr로 분리한다. `--output text`는 계절 판단 요약을 먼저 보여주고 구조 근거와 참조를 뒤에 둔다.

## 지원 상태와 의미

| 해당 후보의 사주 월지 | 계절 판단 |
| --- | --- |
| 寅·卯 | 봄의 오행별 왕상휴수사 |
| 巳·午 | 여름의 오행별 왕상휴수사 |
| 申·酉 | 가을의 오행별 왕상휴수사 |
| 亥·子 | 겨울의 오행별 왕상휴수사 |
| 辰·未·戌·丑 | `POLICY_UNRESOLVED`, `seasonalState=null`, `EARTH_MONTH_POLICY_NOT_SELECTED` |

네 계절말 월은 입력 결손이나 전체 명식 미지원이 아니다. 월지·장간·적용 절입·다른 구조 근거는 그대로 제공한다. 토 일간 戊·己는 나머지 여덟 월에서 土 열에 따라 정상 분류한다. 예를 들어 寅월 土死와 巳월 土相이다. 월지 대표 오행이 토라는 이유로 네 월을 자동 土旺으로 처리하지 않는다.

양력 월·음력 월·기상 계절을 분류 입력으로 쓰지 않는다. 기존 명식의 해당 후보가 가진 **절입 기준 사주 월지**를 사용한다. 입춘 등 표시 분에서는 두 후보를 분리하며, 한 후보의 판단·일간·월지·출처로 다른 후보의 빈칸을 채우지 않는다.

같은 일간 오행·월지이면 음양이 달라도 같은 계절 분류다. 다른 기둥·장간·지지 관계·성별·대운·세운·조회 시각·교운일 정책은 이 한 분류의 입력이 아니다. 旺·相을 得令이라는 이진 값으로 묶거나 숫자 점수로 바꾸지 않는다. 계절 旺과 십이운성 帝旺도 다른 타입이다.

## 구조화 결과와 재사용

옵션을 선택한 로컬 결과 스키마는 `kasi-local-m3-evidence-seasonal-v1`이다. 기존 `m1`, `facts`, `evidence`, `explanation`은 유지하고 `seasonal`에 후보별 `judgment`와 `explanation`을 추가한다. 출생 M1은 요청당 한 번, M2도 한 번 계산하며 이미 발급된 M3 근거를 계절 판단에 재사용한다.

판단에는 정책·규칙·스키마 버전, 후보 ID, 월지·계절, 오행별 상태와 일간 상태, 적용 절입·계산 자료, 입력 evidence/fact 참조가 있다. 문헌/구현의 `sourceRefs`와 KASI의 `calculationSourceRefs`를 분리한다. 설명은 판단 ID와 같은 후보의 근거를 가리킨다. 지문·ref 자체를 외부 진위 인증으로 표시하지 않는다.

순수 함수는 `src/m3/seasonalStateV1.ts`의 `resolveSeasonalState`, `explainSeasonalState`, 각 검증 함수다. API 원문 진위 인증이나 역법 계산을 수행하지 않는다. 로컬 연결은 `deriveLocalM3SeasonalJudgments`로 같은 프로세스에서 발급한 M3 근거에 한정한다.

기존 구조 근거의 계절 **세력·사령 미해결**과 새 정책의 **유한 계절 분류 완료**는 서로 다른 주장이다. 전자를 소급 수정하거나 새 분류 하나로 전체 M3를 READY로 바꾸지 않는다. 유효 통근·사령 일수·관계 효력·최종 신강약·용신·격국·길흉은 미구현이다.

## 문헌과 검증 경계

[정책·문헌 확인 수준·전사 차이](research/M3_SEASONAL_STATE_POLICY_V01.md)를 따른다. 三命通會 두 전사 표면의 표를 대조했고, 여름 水의 識典 표면 `水因`과 Wikisource `水囚`를 구분해 후자를 채택했다. 두 URL은 같은 원전의 두 표면이며 독립된 두 학파의 합의로 세지 않는다. 子平真詮의 해석 범위 제한은 원페이지 본문 검색 캐시 확인이며 현재 원사이트 직접 응답 실패와 구분한다. 스캔·비평 판본·권리·예측 효력은 인증하지 않는다.

독립 20셀·120조합은 규칙 구현 검사다. 실제 현대 명식 전수 입력은 일간·월지·후보·근거가 올바르게 연결되는지 검사한다. 많은 실제 입력이 통과해도 문헌 해석의 독립 정답이나 전체 명식 강약 인증이 아니다. 이전500/500 통과를 새 코드의 결과로 재사용하지 않으며 실제 검사 수·상태 분포·실패·재검사는 이번 실행 보고서에 별도로 남긴다.
