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

# 이번 작업 공간에 있는 검증용 npm shim이 있으면 중첩 npm도 Node22로 고정한다.
# 아래의 직접 Node CLI는 이 shim이 없어도 실행할 수 있다.
$npmShim = Join-Path (Get-Location) '.private\sili-node22-npm-20261112'
if (Test-Path -LiteralPath (Join-Path $npmShim 'npm.cmd')) {
  $env:PATH = $npmShim + ';' + $env:PATH
}

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

# 己 일간이 실제 토왕 구간에서 土旺인 가상 입력.
& $node .\scripts\kasi\local-m3-evidence.mjs @common `
  --calendar GREGORIAN --date 2026-04-25 --time 12:00 --output text

# 일반 子월의 기존 겨울 火死도 유지한다.
& $node .\scripts\kasi\local-m3-evidence.mjs @common `
  --calendar GREGORIAN --date 1990-01-01 --time 12:00 --output text
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

# 위 비공개 npm shim을 사용하는 이번 작업 공간에서 실제 검증한 npm 명령.
# --silent는 npm 배너를 JSON stdout과 분리한다.
& $node $npmCli run --silent kasi:evidence -- @common `
  --calendar GREGORIAN --date 2026-04-17 --time 20:49 --output json
```

B는 KASI가 별도로 발표한 절기가 아니다. 기준 사립 T의 발표 시각과 선택한 25,920분 차감 규칙에서 유도한다. 같은 B 표시 분의 두 대안은 원래 명식 후보 아래에 있으며 새 월주·연주·여덟 글자를 만들지 않는다. T 표시 분에서는 기존 M1의 전/후 후보를 다시 둘로 곱하지 않는다. 실제 2026 입춘의 己 일간은 丑 전 후보에서 토왕 土旺, 寅 후 후보에서 봄 土死로 구분된다.

고정 Node22로 npm-cli를 시작해도 설치된 `npm.cmd`가 중첩 실행을 다른 Node로 연결할 수 있다. 이번 검증은 비공개 shim으로 이를 통제했다. shim이 없는 환경에서 위 직접 Node CLI를 사용하면 새 패키지·런타임 설치 없이 같은 제품 실행 경로를 선택할 수 있다. 검증용 `node.cmd`의 순차 테스트 설정은 제품의 계절 정책이나 계산 결과를 바꾸지 않는다.

## 실제 실행한 가상 결과

다음은 실행 SHA **99bb1dd2503a490bd13c8fdf861e8e5d83df56c9**의 JSON/TEXT에서 확인한 결과다.

| 입력 | 실제 일간/월지 | 계절 판단 |
| --- | --- | --- |
| 양력2026-06-01 12:00 | 丙/巳 | 여름 火旺 |
| 음력2026-04-16 평달12:00 | 같은 양력2026-06-01, 丙/巳 | 같은 여름 火旺 |
| 양력2026-04-17 20:48 | 辛/辰 | 봄 金囚 |
| 같은 날20:49 | 辛/辰 | parent1개 아래 봄 金囚/토왕 金相, `AMBIGUOUS` |
| 같은 날20:50 | 辛/辰 | 토왕 金相 |
| 양력2026-02-04 05:02 | 己 일간, 己丑/庚寅월 두 후보 | 丑 전 후보 토왕 土旺 /寅 후 후보 봄 土死 |
| 양력2026-06-03 12:00 | 戊/巳 | 여름 土相 |
| 양력2026-04-25 12:00 | 己/辰 | 토왕 土旺 |
| 양력1990-01-01 12:00 | 丙/子 | 겨울 火死 |

일반 출력은 “선택한 사립 전 18일 정책에서 이 출생 시각은 巳월의 여름 구간에 해당합니다. 일간 丙의 오행인 화는 왕(旺)으로 분류됩니다.”다. B 표시 분에서는 경계와 같은 분이라는 이유를 설명하고 같은 원국 아래 두 조건부 분류를 각각 제공한다. 실제4월17일의 일간은 辛이며 순수 함수의 합성 丙 테스트와 구분한다.

2026 辰월의 실제 S는 청명4월5일03:40, T는 입하5월5일20:49, B는4월17일20:49다. `S+12일`인4월17일03:40과는17시간9분 다르며, 이번 정책은 후자12일 경계를 사용하지 않는다.

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

## 실제 완료한 검증과 남은 범위

같은 clean 실행 SHA **99bb1dd2503a490bd13c8fdf861e8e5d83df56c9**에서 전체 **538/538 PASS**, fail/cancel/skip/todo0이었다. 기존518개를 유지하고 새 순수12·어댑터6·CLI2그룹을 추가했다. 고정 Node22.23.3, 기존 M2감사, Lab·KASI 실제 Chrome154도 통과했다. CLI는 가상9사례의 JSON/TEXT와 무옵션/v0.1/npm 비교까지23회 모두 자연 exit0이었다.

실제 두 시간대는 UTC 종료 뒤 Asia/Seoul을 시작하여 순차 완료했다. **각 시간대당49,799 양력/음력 입력쌍**은 기존47,975쌍과 새 B경계1,824쌍이다. 제품/출생 M1각99,598회, parent103,246개와 계절 대안104,462개를 구분해 집계했다. parent상태는 정상분류102,030·B동분조건부1,216·자료부족0이었다. 자료부족0은 실제 수락 데이터와 생성 grid의 결과이며 잘못되거나 빠진 T를 임의로 채웠다는 뜻이 아니다. 그 반례는 공개 합성 검사에서 별도로 거절/NEEDS_DATA를 확인했다.

일반8월의 v0.1 의미 비교66,518개와 기존 정책이 보류하는 계절말 비교36,728개를 검사했다. 후자에는 추가 B경계의3,648parent가 포함된다. 이전 보류33,080개를 새 모집단의 기대 수로 고정하지 않았다. 두 summary bytes와 양력/음력 의미 지문이 같았고, 의미 지문은 `5367bb120cbd950a4cf040140f44bde63fce0365bf7361dfb299c3b4371d08a8`이다. 원본·후보a/b·supplement4tree와 실행22파일도 불변이었다.

최초 전체 검사는536/538로 실패했고 환경 분리 후 두 실패 파일 전체34/34, Node22 npm/node shim·새 고유 TEMP·순차 파일 실행으로 전체538/538을 확인했다. 최초 실제 UTC 전수도 V8 메모리 할당 실패로 exit134였으며 Seoul을 시작하지 않았다. 제한100쌍 진단과 더 작은 old-space/semi-space 설정을 검토한 뒤 새 경로에서 전체 두 시간대를 한 번 재실행해 통과했다. 최초 실패·진단 helper의 Windows import URL 오류·수정 후 결과를 모두 보존했다. 테스트·기대값·타임아웃·정책·의존성을 바꾸지 않았으며 정확한 실패 원인을 단정하지 않는다.

이전 M7 대량 기간 전용 검사를 이번에 다시 수행했다고 하지 않는다. 기존 M7 공개 회귀를 유지하고 현재 원국의 계절 판단과 성별/as-of/M7선택의 독립성을 검사했다. 무옵션과 v0.1 결과의 의미·대표 bytes는 보존됐고 새 v0.2를 기본 정책으로 올리지 않았다.

스캔·비평 판본·권리·과학적 세력·예측 효력은 미확인이다. 사령·유효 통근·생조/관계의 실제 효과·신강약·격국·용신과 역사시/2027조회 확장은 미구현이며 기존 게이트를 유지한다. 실행·실패·실제 상태분포·지문·정확한 SHA와 재현 조건은 [최종 실행 보고서](engineering/KASI_M3_SEASONAL_SILI_EXECUTION_20261112.md)에 있다. 최종 문서 커밋과 실제 원격 HEAD는 실행 SHA와 구분해 인도 기록에서 확인한다.
