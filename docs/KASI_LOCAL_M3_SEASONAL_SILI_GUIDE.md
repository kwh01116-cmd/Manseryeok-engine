# 선택형 계절 판단 v0.2 — 사립 전 18일 토왕

기존 `kasi:evidence`에 `--seasonal-policy M3-SEASONAL-SILI-PRE18-NOMINAL-MINUTES-V02`를 명시하면 같은 사주 월 안에서도 앞부분의 계절과 사립 전 18일의 토왕 구간을 구분한다. 이 옵션은 월주나 원국을 바꾸지 않는다. 옵션을 생략한 구조 근거 경로와 기존 [계절 v0.1](KASI_LOCAL_M3_SEASONAL_GUIDE.md)은 유지한다.

이 결과는 선택한 전통 분류와 명목 달력 산술의 결합이다. 최종 신강약·득령·사령·유효 통근·관계 효력·용신·길흉은 제공하지 않는다. 기존 M3 최종 해석/출시 게이트와 기본 엔진/G0/G1-P2 상태도 유지한다.

## 실행 준비

아래는 실제 개인 기록이 아닌 가상 입력이다. 현재 PC 경로는 이 가이드에만 사용하며 생산 코드에 하드코딩하지 않는다. 고정된 Node22와 기존 의존성을 사용한다.

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
  '--seasonal-policy', 'M3-SEASONAL-SILI-PRE18-NOMINAL-MINUTES-V02'
)
```

후보 로더는 위와 같이 별도로 수락된 기대 지문을 받는다. 검사 대상 manifest에서 읽은 값을 기대값으로 대신하지 않는다. 기존 원문·export·체크포인트·후보 a/b·2027 supplement는 읽기 전용이다. 이 출생 범위의 계절 분류에 supplement를 무조건 요구하지 않는다. 실행에는 네트워크·KASI 키·추가 수집이 필요 없다.

## 일반 계절과 양력·음력 동등 입력

```powershell
# 가상 양력. 기존 여름 火旺의 의미를 유지한다.
& $node .\scripts\kasi\local-m3-evidence.mjs @common `
  --calendar GREGORIAN --date 2026-06-01 --time 12:00 --output text

# 같은 가상 출생 날짜의 음력 평달 입력. 변환 출처와 판단 의미를 구분한다.
& $node .\scripts\kasi\local-m3-evidence.mjs @common `
  --calendar KOREAN_LUNAR --lunar-year 2026 --lunar-month 4 --lunar-day 16 `
  --leap false --time 12:00 --output json

# 戊 일간도 일반 여름 구간에서 土相으로 분류한다.
& $node .\scripts\kasi\local-m3-evidence.mjs @common `
  --calendar GREGORIAN --date 2026-06-03 --time 12:00 --output text
```

출생 지원은 양력 환산 `[1989-01-01,2027-01-01)`이며 양력/음력·윤달·HH:mm·네 일주/시주 정책의 기존 계약을 유지한다. 시간 미상에 정오나 자정을 대신 넣지 않는다. 잘못된 인자·프로필·정책·날짜·범위는 오류다.

## 같은 辰월 안의 토왕 시작 경계

입하 발표 시각이 `2026-05-05 20:49`인 문맥에서는 18일을 뺀 명목 경계가 `2026-04-17 20:49`다. 실제 실행은 입력일의 M1 일간을 사용한다. 순수 테스트의 합성 丙 일간을 실제 이날의 일간으로 대입하지 않는다.

```powershell
# B 전 1분: 같은 辰월의 앞부분 봄 구간.
& $node .\scripts\kasi\local-m3-evidence.mjs @common `
  --calendar GREGORIAN --date 2026-04-17 --time 20:48 --output text

# B 표시 분: 원국 후보 아래에서 봄/토왕의 계절 판단만 조건부로 구분.
& $node .\scripts\kasi\local-m3-evidence.mjs @common `
  --calendar GREGORIAN --date 2026-04-17 --time 20:49 --output json

# B 후 1분: 같은 辰월의 토왕 구간.
& $node .\scripts\kasi\local-m3-evidence.mjs @common `
  --calendar GREGORIAN --date 2026-04-17 --time 20:50 --output text

# T인 실제 입춘 표시 분: 기존 M1의 丑/寅 전후 후보 조건을 재사용한다.
& $node .\scripts\kasi\local-m3-evidence.mjs @common `
  --calendar GREGORIAN --date 2026-02-04 --time 05:02 --output text

# npm으로도 실행 가능하다. --silent는 npm 배너를 JSON stdout과 분리한다.
& $node $npmCli run --silent kasi:evidence -- @common `
  --calendar GREGORIAN --date 2026-04-17 --time 20:49 --output json
```

B는 KASI가 별도로 발표한 절기가 아니다. 기준 사립 T의 발표 시각과 선택한 25,920분 차감 규칙에서 유도한다. 같은 B 표시 분의 두 대안은 원래 명식 후보 아래에 있으며 새 월주·연주·여덟 글자를 만들지 않는다. T 표시 분에서는 기존 M1의 전/후 후보를 다시 둘로 곱하지 않는다. 실제 2026 입춘의 己 일간은 丑 전 후보에서 토왕 土旺, 寅 후 후보에서 봄 土死로 구분된다.

## 구간과 결과의 의미

| 후보의 월지 | 앞부분 계절 | 월을 끝내는 기준 사립 |
| --- | --- | --- |
| 辰 | 봄 | 해당 辰월 다음 입하 |
| 未 | 여름 | 해당 未월 다음 입추 |
| 戌 | 가을 | 해당 戌월 다음 입동 |
| 丑 | 겨울 | 해당 丑월 다음 입춘 |

기존 후보가 가진 월 시작 절입 S와 실제 시간선의 다음 사립 T를 연결하고 `B=T−25,920분`으로 계산한다. 정상 문맥에서 `S<B<T`를 확인한다. S부터 B 전까지는 앞부분 계절, B 이후 T 전까지는 토왕이다. S/T와 같은 표시 분은 이미 발급된 M1 후보 조건을 이어받는다. 일반 여덟 월은 v0.1과 같은 표를 사용하며 불필요한 다음 사립을 요구하지 않는다.

정확히 필요한 T가 빠졌으면 이 판단만 `NEEDS_DATA`이며 원국·M2·M3 구조 근거는 유지한다. 잘못된 순서·절기·연도·출처, 월 밖의 B, 다른 후보 참조는 명시적으로 거절한다. 내부 결손을 다음 해 사립이나 기존 fixture로 대신하지 않는다. 원문 발표 분의 정밀도를 이어받으며 실제 출생 초·절입 초·확률·±30초를 만들지 않는다.

토왕 행은 木囚·火休·土旺·金相·水死다. 계절 旺은 전체 신강이나 십이운성 帝旺이 아니다. 死·囚도 죽음·질병·수감·불행이라는 개인 예측을 뜻하지 않는다.

## JSON·텍스트·함수 재사용

선택한 결과는 기존 구조 근거와 분리된 후보별 계절 판단을 제공한다. 후보·월지·S/T·유도 B·정책/버전·오행 표·일간 상태·조건부 대안과 evidence/fact/calculation references를 보존한다. 문헌·구현 출처와 KASI 계산 자료의 출처는 구분한다. 판단의 참조와 설명은 같은 parent candidate로 이어진다.

출생 M1은 요청당 한 번이며 이미 발급된 M2/M3를 재사용한다. 순수 구간 판정·상태 분류·한국어 설명 함수는 `src/m3/seasonalStateV2.ts`에서 import할 수 있다. 순수 함수의 구조 검사는 외부 API 진위 인증이 아니며 로컬 어댑터가 같은 실행의 후보/자료 연결을 확인한다.

기본 출력은 stdout이며 출생정보·결과를 자동 저장하지 않는다. JSON에는 배너·진행 로그가 없고 안전한 오류는 stderr로 보낸다. TEXT는 계절 요약을 먼저 보여주고 상세 참조와 기존 구조 근거를 뒤에 둔다.

## 문헌과 실제 검증

[정책·문헌 확인 수준·채택하지 않은 규칙](research/M3_SEASONAL_SILI_PRE18_POLICY_V02.md)을 따른다. 사립 전 18일은 『千里命稿』의 규칙이고 발표 분에서 정확히 25,920분을 빼는 것은 프로젝트가 선택한 구현 관례다. 『三命通會』의 청명 뒤 12일/장간 용사표를 섞지 않으며 『五行大義』의 같은 상태 배열을 같은 토왕 시점의 근거로 쓰지 않는다.

독립 25셀·합성 B/S/T 반례 검사는 규칙 구현 검사다. 기존 47,975 양력/음력 입력쌍과 별도 1989~2026 B 경계 입력은 실제 명식·시간선·참조·설명 연결을 검사한다. 후자를 독립 원전 인증·과학적 세력 측정·출시 승인으로 표현하지 않는다.

**실제 실행 출력·상태별 집계·검사 SHA: 최종 실행 대기.** 이전 518/518이나 v0.1 실제 자료 실행을 이 코드의 새 결과로 가져오지 않는다. 실행 완료 후 실제 코드 SHA, 자연 종료·실패·재검사, UTC→Asia/Seoul 순차 결과와 원본 불변 근거를 연결한다.
