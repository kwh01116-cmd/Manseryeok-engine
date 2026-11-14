# Sprint 3 — 제품 분석 리포트와 통합 오프라인 artifact

이 가이드는 `KASI-LOCAL-PRODUCT-ANALYSIS-V01` / `0.1.0`과 통합 오프라인 artifact v2의 실행 범위를 설명한다. 기존 명식·M2·M3·내격8·선택 M7 결과에 **겨울 목의 온기 검토 후보, 공망, 절입 기준 월운, 간결한 사용자 리포트**를 연결했다. 전체 용신·격국 성패·사건 예측 기능은 아니다.

기존 [Sprint 1 artifact v1](SPRINT1_OFFLINE_GUIDE.md)과 [Sprint 2 상세 보고서](KASI_LOCAL_ANALYSIS_REPORT_GUIDE.md)는 그대로 유지한다. 새 기능은 별도 `build-v2.mjs`와 명시적 product 프로필을 선택할 때만 실행한다. 실험 강약 점수는 기본 비활성이다.

## 실행 범위와 데이터 권리

| 항목 | 이번 실행 계약 |
| --- | --- |
| 출생 범위 | 양력 환산 `[1989-01-01,2027-01-01)`의 현대 한국 출생. 날짜·분 시각·시계/자시 정책 필수 |
| 음력·윤달 | 기존 관측 인덱스를 사용하며 윤달 여부 필수. 환산 날짜가 위 출생 범위에 있어야 함 |
| 절입 표시 분 | 상관된 전/후 원국 후보를 보존. 초·확률·임의 오차 구간을 만들지 않음 |
| 계절 B 표시 분 | 같은 원국 아래 계절 대안만 유지. M4·통근·공망을 새 원국으로 복제하지 않음 |
| 월운 조회 | 명시한 현대 시계 범위 `[1989-01-01T00:00,2027-01-01T00:00)`. 절입 자료가 부족한 구간은 별도 보류 |
| 1950–1988·2027 출생 | UNSUPPORTED. 연구 날짜 자료·2027 두 경계 보강을 출생 지원으로 확대하지 않음 |
| 역사 법정시·DST·진태양시 | 이 프로필에서 미지원. 이번에 자동 보정이나 범위를 추가하지 않음 |
| 공개 배포·상업 자료 권리 | RIGHTS_BLOCKED / 별도 심사 미해결. 코드 artifact와 비공개 달력 attachment를 구분 |

**코드 artifact에는 달력 자료가 없다.** 별도 수락 자료를 연결하지 않으면 출생 명식을 계산하지 않는다. private attachment를 공개 Git·배포물에 넣지 않는다. 데이터 부재·지문 오류·미지원 입력에서 fixture나 외부 서버로 fallback하지 않는다.

## 실제 제작본과 복원

검증한 코드 SHA는 `10196ab0acb8ed60774e2d98051ae670548725bf`다. 실제 내부 제작본은 다음 두 디렉터리다.

- 엔진: `.private/sprint3-20261114/final-10196ab/engine/`
- 자료: `.private/sprint3-20261114/final-10196ab/data/`

엔진 manifest SHA256은 `23f486686c7ce7a0f0e3bd119135c0d62648a19ae13b884770f4850cc400ad29`, attachment descriptor SHA256은 `a932a68ded1ff76fdaca494652472cc569ce9c5e3f9f4be03a22ab5c50cf5dd5`다. base content 고정 pin은 `8ffadb04c8460969085610162d3d5e8855af9272a8a4be1dbe10123c15f90edf`이며 기존 로더가 독립 기대값으로 검증한다. 파일 지문 일치는 발행기관 서명·이용권 인증이 아니다.

제작에는 고정 Node22.23.3·TypeScript5.8.3과 이미 설치된 잠금 의존성이 필요하다. 빌더는 stale dist를 복사하지 않고 두 tsconfig를 메모리에서 새로 컴파일한다. **완성본 실행·verify·restore에는 Node22만 필요하며 Git·npm 설치·KASI 키·네트워크·원본 저장소 소스 import가 필요 없다.** 기존 XML 파서는 고정된 로컬 bundle과 고지를 포함한다. [v2 계약](contracts/OFFLINE_INTEGRATED_ANALYSIS_V2.md)에 포함 범위와 한계를 기록했다.

아래 경로의 Node는 이 작업 환경의 고정 실행 파일이다. 다른 환경에서는 `$s3Node`를 설치한 Node22 실행 파일로 바꾼다. 새 제작·복원 목적지는 존재하지 않는 경로여야 한다. 기존 작업 디렉터리를 지우거나 덮어쓰지 않는다.

```powershell
$s3Repo = 'C:\Users\Home\Desktop\만세력 엔진\source'
$s3Node = 'C:\Users\Home\Desktop\Manseryeok-KASI-1950-2026-windows-x64\Manseryeok-KASI-1950-2026\runtime\node.exe'
Set-Location -LiteralPath $s3Repo
& $s3Node --version

# 이미 완성된 내부 제작본을 검사한다. 아래 명식 실행에는 이 두 경로를 사용한다.
$s3Engine = Join-Path $s3Repo '.private\sprint3-20261114\final-10196ab\engine'
$s3Data = Join-Path $s3Repo '.private\sprint3-20261114\final-10196ab\data'
& $s3Node "$s3Engine\verify.mjs" --artifact $s3Engine --attachment $s3Data

# 재제작할 때만 실행한다. 목적지는 새 디렉터리여야 한다.
$newEngine = Join-Path $s3Repo '.private\sprint3-package-example\engine'
$newData = Join-Path $s3Repo '.private\sprint3-package-example\data'
& $s3Node '.\scripts\offline\build-v2.mjs' --out $newEngine
& $s3Node "$newEngine\attach.mjs" --candidate '.private\kasi-research-1950-2026-fe84ab4-a' --out $newData
& $s3Node "$newEngine\verify.mjs" --artifact $newEngine --attachment $newData
```

원본 XML·export·checkpoint·후보 a/b·2027 supplement는 수정하지 않는다. attachment는 기존 선택7파일과 별도 descriptor이며 원문 전체를 동봉하지 않는다. 2027 supplement는 product 실행의 필수 의존성이 아니다.

다음은 저장소 밖의 새 임시 디렉터리로 복원하는 명령이다. 달력 대상은 그 안의 `.private` 아래에 둔다. 두 복원 경로는 원본과 겹치지 않아야 한다.

```powershell
$s3RestoreRoot = Join-Path ([System.IO.Path]::GetTempPath()) ('manseryeok-sprint3-' + [Guid]::NewGuid().ToString('N'))
$s3RestoredEngine = Join-Path $s3RestoreRoot 'engine'
$s3RestoredData = Join-Path $s3RestoreRoot '.private\data'
& $s3Node "$s3Engine\restore.mjs" --artifact $s3Engine --out $s3RestoredEngine --attachment $s3Data --private-data-out $s3RestoredData
& $s3Node "$s3RestoredEngine\verify.mjs" --artifact $s3RestoredEngine --attachment $s3RestoredData

# 이후에는 복원된 파일만 사용한다. Git/npm 명령이나 저장소 import를 실행하지 않는다.
$s3Engine = $s3RestoredEngine
$s3Data = $s3RestoredData
Set-Location -LiteralPath $s3RestoreRoot
```

## 사용자 요약·상세 근거·JSON

product 프로필과 M5 정책은 각각 명시해야 한다. profile이 기존 계절·통근·인성 제한·내격8·공망 정책을 고정하며, 충돌하는 개별 하위 정책을 받지 않는다. 선택하지 않은 점수·M7·월운을 몰래 추가하지 않는다.

```powershell
$s3Common = @(
  '--mode', 'product',
  '--attachment', $s3Data,
  '--profile', 'kasi-api-1989-2026-local-v1',
  '--clock-policy', 'KR_API_PUBLISHED_KST_MODERN_1988_POST_DST_V1',
  '--day-rollover', 'CIVIL_MIDNIGHT',
  '--hour-stem-reference', 'SELECTED_DAY_PILLAR',
  '--report-profile', 'KASI-LOCAL-PRODUCT-ANALYSIS-V01',
  '--m5-policy', 'M5-WINTER-WOOD-WARMING-CANDIDATE-V01'
)

# 사용자 요약
& $s3Node "$s3Engine\run.mjs" @s3Common --calendar GREGORIAN --date 1992-11-24 --time 00:30 --detail summary --output text

# 같은 분석의 상세 근거. 기존 연구 리포트·장간·관계·참조와 기술 정보를 보존한다.
& $s3Node "$s3Engine\run.mjs" @s3Common --calendar GREGORIAN --date 1992-11-24 --time 00:30 --detail detailed --output text

# JSON은 detail에 관계없이 같은 구조화 분석과 summary/detailed 근거를 담는다.
& $s3Node "$s3Engine\run.mjs" @s3Common --calendar GREGORIAN --date 1992-11-24 --time 00:30 --detail summary --output json

# 위 가상 날짜와 동등한 음력 입력. 양력 --date와 함께 넘기지 않는다.
& $s3Node "$s3Engine\run.mjs" @s3Common --calendar KOREAN_LUNAR --lunar-year 1992 --lunar-month 11 --lunar-day 1 --leap false --time 00:30 --detail summary --output text
```

요약은 사주팔자·일간/표면 오행·대표 구조/공망·계절/근·M5 후보·요청 시간축·남은 판단의 일곱 섹션이다. 기술 ID·manifest·전체 장간을 앞부분에 반복하지 않는다. 상세 TEXT는 **같은 요약 객체**를 먼저 표시하고 기존 연구 보고서와 새 근거를 이어 붙인다. JSON은 기존 base 필드와 그 의미를 보존하고 새 `m5`, `gongmang`, `monthly`, `summary`, `detailed`, `technical`을 별도 계층으로 둔다. 기존 base의 미구현 필드는 그 기존 범위의 제한이며 새 목적 후보를 최종 용신으로 승격시키지 않는다.

stdout에는 결과만 출력한다. 오류는 안전한 stderr enum과 비영 종료로 반환한다. 개인 출생정보나 결과를 기본 파일로 저장하지 않는다. 설명은 결정론적 템플릿이며 외부 LLM을 사용하지 않는다. 출생 M1·M2·M3는 요청당 각각 한 번, M7은 같은 발급 출생 결과를 재사용하며 월운은 독립 달력 조회로 처리한다.

이미 빌드한 저장소에서 같은 제품 어댑터를 직접 실행할 때는 `--mode`/`--attachment` 대신 기존 후보 경로와 독립 pin을 준다. 아래는 artifact 실행과 같은 프로필·M5 선택이다. 저장소 CLI 자체는 저장소 빌드 산출물을 사용하며 독립 패키지 검증과 구별한다.

```powershell
$s3RepoCli = Join-Path $s3Repo 'scripts\kasi\local-product-report.mjs'
$s3RepoCommon = @(
  '--candidate', (Join-Path $s3Repo '.private\kasi-research-1950-2026-fe84ab4-a'),
  '--manifest-sha', '8ffadb04c8460969085610162d3d5e8855af9272a8a4be1dbe10123c15f90edf',
  '--profile', 'kasi-api-1989-2026-local-v1',
  '--clock-policy', 'KR_API_PUBLISHED_KST_MODERN_1988_POST_DST_V1',
  '--day-rollover', 'CIVIL_MIDNIGHT',
  '--hour-stem-reference', 'SELECTED_DAY_PILLAR',
  '--report-profile', 'KASI-LOCAL-PRODUCT-ANALYSIS-V01',
  '--m5-policy', 'M5-WINTER-WOOD-WARMING-CANDIDATE-V01'
)
& $s3Node $s3RepoCli @s3RepoCommon --calendar GREGORIAN --date 1992-11-24 --time 00:30 --detail summary --output text
& $s3Node $s3RepoCli @s3RepoCommon --calendar GREGORIAN --date 1992-11-24 --time 00:30 --detail detailed --output json
```

## M5 후보와 보류를 읽는 법

[M5 정책](research/M5_LIMITED_PURPOSE_POLICY_V01.md)은 《子平真詮》의 겨울 목·화 문맥과 徐 주석을 구별해 확인하고, 아래의 좁은 채택 조건은 `PROJECT_POLICY`로 명시했다. 왕상휴수사 표만으로 조후 충분조건을 만들지 않는다.

| 조건 | 실제 결과 |
| --- | --- |
| 甲·乙 일간 + 절입 월지 亥·子 + 겨울 조건 확인 + 완전한 기존 표면/장간에서 화 미관측 | 화(火)를 온기 **검토 후보**로 표시 |
| 같은 대상 범위지만 화가 이미 존재 | 기존 화의 위치를 보존하고 충분성·실제 작용이 미평가라 자동 채택 HOLD. 과다·불필요 판정 아님 |
| 다른 일간·월지 | 이 목적 범위 밖 HOLD. 도움 요소 전체가 없다는 뜻 아님 |
| 유효한 계절 자료·조건 미확정 | 해당 판단 HOLD. 누락/변조 입력은 별도 거절 |

10천간×12월지 중 기호상 eligibility는 4/120이며 실제 적용률이 아니다. 그 안에서도 화가 있으면 보류한다. 실제 `1992-11-24 00:30`의 壬申·辛亥·甲辰·甲子와 `1992-12-05 16:30`의 壬申·辛亥·乙卯·甲申에서는 화 후보가 나왔다. 첫 날짜의12:00은 시간 庚午의 장간 丁 때문에 HOLD다. 2026-01-08의 壬일간은 목적 범위 밖이다.

```powershell
# 같은 가상 날짜에서 이미 있는 午의 丁을 보존하며 HOLD
& $s3Node "$s3Engine\run.mjs" @s3Common --calendar GREGORIAN --date 1992-11-24 --time 12:00 --detail summary --output text

# 乙 일간의 별도 실제 계산 사례
& $s3Node "$s3Engine\run.mjs" @s3Common --calendar GREGORIAN --date 1992-12-05 --time 16:30 --detail summary --output text
```

이 결과는 화 부족량 측정·화 추가 처방·최종 용신·희기 서열·길흉이 아니다. 억부/격국 목적과 통합하지 않으며 실험 강약 점수를 M5 근거로 쓰지 않는다.

## 공망·월운과 기존 M7

공망 `M2-DAY-XUN-VOID-BRANCHES-V01`은 **M1이 선택한 일주**의 순에서 짝지어지지 않는 두 지지와 원국의 실제 대응 위치를 계산한다. 예를 들어2026-01-08 壬午일주는 甲戌순이며 공망은 申·酉, 원국의 대응 위치는 없다. 공망의 존재를 길흉으로 바꾸거나 원국 지지를 삭제하지 않는다. 일주 교체 정책이 바뀌면 그 선택 일주를 기준으로 다시 계산한다. 대운·세운·월운 지지와 대응시킬 수 있는 순수 데이터 함수는 제공하지만 개인 사건 효력은 미평가다.

월운은 `M7-MONTHLY-TWELVE-JIE-PUBLISHED-MINUTE-V01`을 명시한다. `--monthly-year`는 **해당 연도 입춘부터 다음 입춘까지**의 寅→丑12구간이며 양력1–12월 표가 아니다. `--monthly-query-minute`는 명시한 시각의 독립 월 조회다. 둘 중 하나 또는 둘 다 요청할 수 있으며 현재 시각을 숨은 입력으로 쓰지 않는다.

```powershell
$s3Monthly = @(
  '--monthly-policy', 'M7-MONTHLY-TWELVE-JIE-PUBLISHED-MINUTE-V01',
  '--monthly-year', '2025',
  '--monthly-query-minute', '2026-01-08T12:00'
)
& $s3Node "$s3Engine\run.mjs" @s3Common --calendar GREGORIAN --date 2026-01-08 --time 12:00 @s3Monthly --detail summary --output text
& $s3Node "$s3Engine\run.mjs" @s3Common --calendar GREGORIAN --date 2026-01-08 --time 12:00 @s3Monthly --detail detailed --output text

# 입춘의 두 원국과 별도의 월운 전/후 조건. 서로 Cartesian product로 합치지 않는다.
& $s3Node "$s3Engine\run.mjs" @s3Common --calendar GREGORIAN --date 2026-02-04 --time 05:02 --monthly-policy M7-MONTHLY-TWELVE-JIE-PUBLISHED-MINUTE-V01 --monthly-query-minute 2026-02-04T05:02 --detail summary --output json
```

검증한2025년 표의 실제 명목 분 구간은 다음과 같다. 시작/종료 표시는 반개구간이지만 발표 표시 분의 전/후 미확정 조건을 없애지 않는다.

| 순서 | 월간지 | 시작 절입 | 다음 절입 |
| --- | --- | --- | --- |
| 1 | 戊寅 | 2025-02-03 23:10 | 2025-03-05 17:07 |
| 2 | 己卯 | 2025-03-05 17:07 | 2025-04-04 21:49 |
| 3 | 庚辰 | 2025-04-04 21:49 | 2025-05-05 14:57 |
| 4 | 辛巳 | 2025-05-05 14:57 | 2025-06-05 18:57 |
| 5 | 壬午 | 2025-06-05 18:57 | 2025-07-07 05:05 |
| 6 | 癸未 | 2025-07-07 05:05 | 2025-08-07 14:52 |
| 7 | 甲申 | 2025-08-07 14:52 | 2025-09-07 17:52 |
| 8 | 乙酉 | 2025-09-07 17:52 | 2025-10-08 09:41 |
| 9 | 丙戌 | 2025-10-08 09:41 | 2025-11-07 13:04 |
| 10 | 丁亥 | 2025-11-07 13:04 | 2025-12-07 06:05 |
| 11 | 戊子 | 2025-12-07 06:05 | 2026-01-05 17:23 |
| 12 | 己丑 | 2026-01-05 17:23 | 2026-02-04 05:02 |

2026년 표는 마지막 두 구간의2027 소한/입춘 경계가 base에 없어 부분 보류한다. 2026년 말 조회에서는 월간지가 확인돼도 종료 절입이 없어 `PARTIAL`일 수 있다. **2027 시각 조회는 자료 확보와 별개로 현재 검증 시계 범위 밖 `POLICY_UNRESOLVED`**다. 기존 supplement를 몰래 활성화하거나 시계 정책 의미를 넓히지 않는다.

기존 대운·세운·명목 교운일은 기존 opt-in 옵션을 그대로 전달한다. 방향 규칙용 성별값을 추정하지 않는다. 다음은 가상1990년 출생자와 명시 조회의 예다.

```powershell
$s3Luck = @(
  '--luck-profile', 'M7-TRADITIONAL-YEAR-STEM-JIE-3D-V01',
  '--dayun', 'true',
  '--traditional-sex', 'MALE',
  '--dayun-count', '10',
  '--seyun-year', '2026',
  '--query-minute', '2026-01-08T12:00',
  '--calendar-projection', 'M7-CALENDAR-NOMINAL-YMDH-SEQUENTIAL-CLAMP-V02',
  '--as-of-date', '2026-01-08',
  '--as-of-time', '12:00'
)
& $s3Node "$s3Engine\run.mjs" @s3Common --calendar GREGORIAN --date 1990-06-01 --time 12:00 @s3Luck --detail summary --output text
```

실제 계산은 첫 대운 壬午, 첫 명목 교운일1992-01-10 08:00, 지정 조회는 제4대운 乙酉였다. 2026 세운 연도 라벨 丙午와 입춘 전 조회의2025乙巳를 구별한다. 명목 교운일은 선택한 달력 투영의 결과이며 실제 측정 교운 순간이 아니다. 월별 사건·길흉은 제공하지 않는다.

## 실제 검증과 남은 게이트

고정 코드 `10196ab…`의 저장소 밖 복원 artifact에서 **80회 성공, 오류 입력8회 거절, 경로3회 거절**,36개 시간대 byte 대조를 확인했다.12개 product 논리 조건에서 M5는5후보/8보류 부모 경로였으며 이는 요청 수·전체 출생자 적용률과 다르다. 네트워크·키 접근은0, Git/npm은 runtime PATH에 없었고 원본 저장소 import·fallback fixture·운영 파일 쓰기를 막았다. 동등 양력/음력의 의미도 같았다. 별도 계측 영수증은 실제 출생 M1·M2·M3 호출 수와 요청 실패 위치를 구분한다.

최종 private 연결 검사는 각 시간대에228개의 폭넓은 양력/음력 쌍과 추가 probe를 순차 실행했다. 기본228쌍에서 후보2쌍/기존 화 보류12쌍/범위 밖214쌍이었다. 전체 probe를 합치면 시간대별518제품 요청·520원국 부모, M5 후보8/보류512이며 월운40독립 조회는 출생 M1을 추가 실행하지 않았다. 양력/음력 반복·시간 정책·경계 probe를 포함한 연결 집계이며 독립 명리 정답률이 아니다.

고정 코드 `10196ab0acb8ed60774e2d98051ae670548725bf`, Node22.23.3·TS5.8.3에서 전체 **858/858 PASS**, fail/cancel/skip/todo0이다. M2 감사는 `CATALOG_CONSISTENT_EVIDENCE_OPEN`이며 판본/권리 수락을 뜻하지 않는다. Lab·KASI의 실제 Chromium 검사는 각각 자연 종료0으로 통과했다. KASI 브라우저 검사는 합성 upstream을 사용하는 회귀이며 API 재수집이 아니다. 원본/export/후보 a/b/supplement 고정 지문과 기존 JavaScript191파일은 전후 동일했다. 과거811개의 통과를 새 결과로 복사하지 않았다. 테스트 SHA와 후속 문서/원격 HEAD, 최초 preflight 실패 및 수정·재실행은 [Sprint 3 실행 기록](engineering/SPRINT3_PRODUCT_ANALYSIS_EXECUTION_20261114.md)에 따로 기록한다.

지원 범위에서 로컬 기능이 실행된다는 뜻과 공개 서비스 가능성을 구별한다. 1950–1988·2027출생/시계, 달력 데이터의 상업 이용·재배포 권리, 공개 서비스 운영 게이트는 미해결이다. 실험 강약 기본값 승격·M3 전체 해석·격국 성패·최종 용신·G1-P2 NO-GO를 해제하지 않았다. 제품 기능의 전체 상태는 [19항목 행렬](research/SPRINT3_PRODUCT_FEATURE_MATRIX_20261114.md)에서 확인한다.
