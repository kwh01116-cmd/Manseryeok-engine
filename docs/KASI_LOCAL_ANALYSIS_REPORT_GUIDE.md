# 선택형 로컬 통합 명식 보고서 실행 가이드

`KASI-LOCAL-INTEGRATED-ANALYSIS-V01` / `0.1.0`은 기존 명식·M2 분류·M3 계절/통근/제한적 종합과 새 내격8 구조를 한국어 보고서로 조합하는 명시 선택 프로필이다. 실험 가중 점수와 M7 대운·세운은 추가로 선택할 때만 연결한다. 출력은 JSON 또는 TEXT이며 실행 중 네트워크·KASI 키·새 수집이 필요하지 않다.

**이 보고서는 저장소 CLI다. Sprint 1 오프라인 artifact의 네 모드에 포함되지 않는다.** 저장소의 고정 의존성과 빌드 산출물, 별도 private 자료가 필요하다. M7 import에 연결된 기존 XML parser까지 새 단독 artifact로 묶었다고 하지 않는다. 기존 chart/explain/evidence/experimental artifact와 기본 CLI는 그대로 둔다.

## 환경과 필수 선택

검증 환경은 Node **22.23.3**, TypeScript **5.8.3**, 기존 package-lock의 의존성이다. 아래는 이 작업 환경의 고정 Node 경로를 사용한다. 저장소를 다른 위치에 둔 경우 `$reportRepo`만 실제 checkout으로 바꾼다. private 자료는 공개 배포물에 들어 있지 않으므로, 이미 검증된 로컬 후보 경로를 지정해야 한다.

```powershell
$reportRepo = 'C:\Users\Home\Desktop\만세력 엔진\source'
$reportNode = 'C:\Users\Home\Desktop\Manseryeok-KASI-1950-2026-windows-x64\Manseryeok-KASI-1950-2026\runtime\node.exe'
$reportData = Join-Path $reportRepo '.private\kasi-research-1950-2026-fe84ab4-a'
$reportPin = '8ffadb04c8460969085610162d3d5e8855af9272a8a4be1dbe10123c15f90edf'
Set-Location -LiteralPath $reportRepo

& $reportNode --version
& $reportNode '.\node_modules\typescript\bin\tsc' --version

# 고정 의존성이 준비된 checkout의 빌드. 설치나 네트워크 요청은 하지 않는다.
& $reportNode '.\node_modules\typescript\bin\tsc' -p tsconfig.json
if ($LASTEXITCODE -ne 0) { throw 'Main TypeScript build failed' }
& $reportNode '.\node_modules\typescript\bin\tsc' -p tsconfig.kasi.json
if ($LASTEXITCODE -ne 0) { throw 'KASI TypeScript build failed' }

$reportCli = Join-Path $reportRepo 'scripts\kasi\local-analysis-report.mjs'
$reportCommon = @(
  '--candidate', $reportData,
  '--manifest-sha', $reportPin,
  '--profile', 'kasi-api-1989-2026-local-v1',
  '--clock-policy', 'KR_API_PUBLISHED_KST_MODERN_1988_POST_DST_V1',
  '--day-rollover', 'CIVIL_MIDNIGHT',
  '--hour-stem-reference', 'SELECTED_DAY_PILLAR',
  '--report-profile', 'KASI-LOCAL-INTEGRATED-ANALYSIS-V01'
)

& $reportNode $reportCli @reportCommon --calendar GREGORIAN --date 2026-01-08 --time 12:00 --output text
& $reportNode $reportCli @reportCommon --calendar GREGORIAN --date 2026-01-08 --time 12:00 --output json
```

`--candidate`와 독립 고정 pin, 명식 프로필·시계·일주 교체·시주 참조·보고서 프로필·달력·시각·출력 형식은 필수다. 입력 파일에서 읽은 기대 지문을 다시 신뢰하지 않는다. 시간 미상은 임의 정오로 채우지 않는다. 아래 정오 사례는 모두 명시적으로 만든 가상 입력이다.

지원 출생은 양력 환산 날짜 `[1989-01-01,2027-01-01)`다. 1950–1988 연구 날짜 자료 보유는 역사시 명식 지원이 아니며 2027 보강 두 건도 연간 출생 범위를 넓히지 않는다. 시계는 선택한 현대 한국 법정시 정책이며 진태양시/역사 DST 보정 옵션을 새로 제공하지 않는다.

## 보고서에서 읽을 항목

| 순서 | 섹션 | 실제 지원 범위 |
| --- | --- | --- |
| 1 | 사주와 일간·시간 정책 | 네 기둥, 일간 음양/오행, 적용 절입, 기록 시각/정책·경계 후보 |
| 2 | 표면 오행 8자리와 십성 | 천간4+지지 대표오행4의 무가중 개수·총8자리, 별도 표면/지장간 십성 |
| 3 | 월령 내격8 구조 후보 | 본기 표시 기준·정확 OTHER 투출·경쟁 노출·비후보·정책 보류 |
| 4 | 계절·통근과 M3 판단의 한계 | 기존 계절 대안·구성상 근·좁은 종합과 보류, 선택한 실험 점수 |
| 5 | 선택한 대운·세운 시간축 | 미요청/입력 미정, 또는 기존 M7 기산·순서·선택 달력 가산/조회 |
| 6 | 종합 요약 | 같은 후보·정책 결과에서 만든6문장. 보류를 중화/최종 신강약으로 바꾸지 않음 |

표면 개수는 장간 수·계절 가중치·실제 힘·확률·용신 추천을 뜻하지 않는다. JSON은 `existing`, `innerPatterns`, 선택한 `weighted`, `m7`, `projection`과 항목별 근거 참조를 보존한다. TEXT는 같은 결과를 읽기 쉽게 표시한다. 상세 참조는 추적성이고 외부 진위 인증이 아니다.

입춘의 상관된 두 원국은 각각 보존한다. 토왕 경계 B의 계절 대안은 한 원국 아래에 남으며 새 원국 두 개로 복제하지 않는다. 독립 세운 조회의 두 대안도 출생 후보와 곱해 새 원국 집합을 만들지 않는다. 제품의 출생 M1 계산은 요청당1회이며 M7은 이미 발급된 같은 M1을 읽는다.

## 사전에 고정한 실제 가상 날짜8개

아래는 새 resolver 실행 전에 기존 pinned M1/M2만으로 고정한 [리터럴 계약](../test/fixtures/inner-pattern-real-case-contracts-v1.json)이다. 모두 양력·12:00·위 공통 정책을 사용한다. `primaryPattern`은 프로젝트의 본기 표시 기준이며 최종 취격·成格을 뜻하지 않는다.

| 내격 기준 | 날짜 | 연·월·일·시주 | 월령 근거 | 정확 투출 |
| --- | --- | --- | --- | --- |
| 食神 | 2026-01-13 | 乙巳·己丑·丁亥·丙午 | 丑 MAIN己, 丁일간 | 월간 |
| 傷官 | 2026-01-12 | 乙巳·己丑·丙戌·甲午 | 丑 MAIN己, 丙일간 | 월간 |
| 偏財 | 2026-01-05 | 乙巳·戊子·己卯·庚午 | 子 MAIN癸, 己일간 | 없음 |
| 正財 | 2026-01-04 | 乙巳·戊子·戊寅·戊午 | 子 MAIN癸, 戊일간 | 없음 |
| 七殺 | 2026-01-03 | 乙巳·戊子·丁丑·丙午 | 子 MAIN癸, 丁일간 | 없음 |
| 正官 | 2026-01-08 | 乙巳·己丑·壬午·丙午 | 丑 MAIN己, 壬일간 | 월간 |
| 偏印 | 2026-01-01 | 乙巳·戊子·乙亥·壬午 | 子 MAIN癸, 乙일간 | 없음 |
| 正印 | 2026-01-06 | 乙巳·己丑·庚辰·壬午 | 丑 MAIN己, 庚일간 | 월간 |

첫 MAIN 사례를 택한 결과2026년1월·子/丑에 집중된 표본이다. 실제8종 연결을 확인하는 사례이며 전체 연대/월령의 분포를 대표하거나 독립 천문 정답을 인증하지 않는다. 경쟁·정확 OTHER·peer 본기·午 OTHER 보류는 별도 고정 계약으로 검증한다. 본기 미투출도 후보일 수 있고, 같은 오행의 다른 음양은 정확 투출이 아니다.

## 음력 입력과 자시 선택

음력에서는 양력 `--date`를 함께 넘기지 않고 음력 연·월·일·윤달 여부를 모두 명시한다. 기존 관측 인덱스로 같은 양력 날짜가 되는 가상 예는 다음과 같다.

```powershell
& $reportNode $reportCli @reportCommon --calendar KOREAN_LUNAR --lunar-year 2026 --lunar-month 4 --lunar-day 16 --leap false --time 12:00 --output text
& $reportNode $reportCli @reportCommon --calendar GREGORIAN --date 2026-06-01 --time 12:00 --output text
```

자시 선택은 공통 인자의 `--day-rollover`를 `CIVIL_MIDNIGHT` 또는 `ZI_START`, `--hour-stem-reference`를 `SELECTED_DAY_PILLAR` 또는 `CIVIL_DATE_DAY_PILLAR`로 지정한다. 네 조합 중 선택한 값을 보고서에 표시한다. 같은 옵션을 중복해서 덧붙이지 말고 공통 배열의 해당 값을 바꾼다.

## 실험 가중 점수 선택

```powershell
& $reportNode $reportCli @reportCommon --calendar GREGORIAN --date 2026-01-08 --time 12:00 --experimental-policy EXPERIMENTAL-WEIGHTED-SUPPORT-LOCAL-NO-TRANSFORMATION-V01 --output text
```

실험 배점/임계는 기존 `0.1.0`을 유지한다. 선택하지 않으면 JSON은 미요청 상태를 보존하고 TEXT는 요청하지 않았다고 표시한다. 실험 점수가 기존 M3의 `finalStrength=NOT_IMPLEMENTED`를 대체하지 않는다. 같은 지지의 대표 점수와 여러 천간의 근 조건은 상관된 입력을 재사용한다. [Sprint 1 정책 범위](SPRINT1_OFFLINE_GUIDE.md)를 함께 읽는다.

## M7 대운·세운과 명목 달력 가산 선택

아래 `MALE`은 가상 예시의 전통 순역 규칙용 명시 입력이다. 사용자의 값을 추정하지 않는다. 개수는1–20이다. 조회에는 시스템 현재 시각을 자동으로 넣지 않으며 조회 날짜/시각을 명시한다.

```powershell
$reportLuck = @(
  '--luck-profile', 'M7-TRADITIONAL-YEAR-STEM-JIE-3D-V01',
  '--dayun', 'true',
  '--traditional-sex', 'MALE',
  '--dayun-count', '3',
  '--seyun-year', '2026',
  '--query-minute', '2026-11-14T12:00',
  '--calendar-projection', 'M7-CALENDAR-NOMINAL-YMDH-SEQUENTIAL-CLAMP-V02',
  '--as-of-date', '2026-11-14',
  '--as-of-time', '12:00'
)
& $reportNode $reportCli @reportCommon --calendar GREGORIAN --date 2026-01-08 --time 12:00 @reportLuck --output text

# 독립 세운만 요청하면 전통 순역 규칙용 성별값이 필요하지 않다.
& $reportNode $reportCli @reportCommon --calendar GREGORIAN --date 2026-01-08 --time 12:00 --luck-profile M7-TRADITIONAL-YEAR-STEM-JIE-3D-V01 --seyun-year 2026 --query-minute 2026-11-14T12:00 --output json
```

`--calendar-projection`은 별도 opt-in이다. 선택하지 않으면 기산 모형 나이·간지 순서를 표시하되 명목 달력 교운일/조회 대운을 자동 결정하지 않는다. 가산 결과는 선택 정책의 명목 민간시 기간이며 실제 교운 순간·사건 시기의 인증이 아니다. 조회 범위는 기존 현대 한국 정책을 따른다.

이 report CLI는 `--boundary-supplement` 옵션을 받지 않는다. 기존 base 자료에서 필요한 인접 절입이 없으면 `NEEDS_DATA`로 남긴다. 기존 M7의 별도 supplement 실행 경로와 이 보고서의 지원 범위를 구별한다. 대운 방향 입력이 없거나 유효하지 않으면 대운은 입력 미정으로 보류하고, 함께 요청한 독립 세운은 가능한 범위에서 보존한다. 순수 연도 라벨을 반환할 수 있다는 사실은 해당 연도의 출생 시각이나 세운 조회 자료가 모두 지원된다는 뜻이 아니다.

## 출력·오류·권리의 범위

성공은 `status=REPORT_ONLY`, stdout의 JSON/TEXT와 종료0이다. 미지원 출생은 stderr의 제한된 상태와 종료2, 입력/자료 오류는 안전한 오류 코드와 비영 종료로 구분한다. 거절 때 stdout에 성공 보고서를 쓰지 않으며 예외 전문·입력 생일·로컬 파일 경로를 오류에 넣지 않는다. 개인 입력과 결과를 제품 기능으로 자동 저장하지 않는다.

월령8 구조 선택은 `PROJECT_POLICY`다. peer 본기는 건록/양인이나 여덟 격으로 강제 편입하지 않고, 정확 OTHER가 겹치면 선택 미정을 보존한다. 午 OTHER己의 호환성 보류는 새 정책의 보수적 범위이고 MAIN丁까지 미지원으로 만들지 않는다. 후보의 지원/방해 검토와 생극 방향은 실제 효력·格成·格敗·救應이 아니다. 용신·희신·기신·조후 처방·연애/직업/재물 사건 예측은 제공하지 않는다.

KASI private 자료의 외부 재배포는 `RIGHTS_BLOCKED`, 상업 자료 권리 확정은 `UNKNOWN`을 유지한다. 내부 로컬 실행 가능과 공개 서비스/상용 출시 승인은 별개다. 원응답·키·private attachment를 공개 artifact나 저장소에 추가하지 않는다. 기존 M3 전체 해석·G0/G1-P2·공개 서비스 게이트를 유지한다.

[내격8 정책](research/M4_INNER_PATTERNS_POLICY_V01.md) · [제품19기능 행렬](research/SPRINT2_PRODUCT_FEATURE_MATRIX_20261114.md) · [실행 소스](../scripts/kasi/local-analysis-report.mjs).

최종 실행 코드 **`db26b38b9b40dcefba0ae94d5187daff7ab55656`**에서 전체811/811·M2 감사·Lab/KASI 실제 Chromium 회귀를 통과했다. M2 감사의 상태는 `CATALOG_CONSISTENT_EVIDENCE_OPEN`이며 판본·권리 수락이 아니다. KASI 브라우저 검사는 합성 upstream을 사용한다. 실제 private 자료의26논리 조건을 JSON/TEXT·UTC·Asia/Seoul에서 실행해104성공·별도24거절, 시간대별 출력52쌍 bytes 동일을 확인했다. 대표 양력/음력112쌍+자시4쌍=116쌍/시간대의232요청·256원국 부모·2048유형 판정도 UTC→Asia/Seoul 순차로 일치했다. 이 수치를 독립 출생 수나 외부 예측 정확도로 해석하지 않는다. [검사·실패·실제 CLI와 보존 기록](engineering/SPRINT2_INNER_PATTERNS_REPORT_EXECUTION_20261114.md)에서 정확한 범위를 확인할 수 있다.
