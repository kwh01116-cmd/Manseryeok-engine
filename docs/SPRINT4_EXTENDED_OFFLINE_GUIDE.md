# Sprint 4 — 선택형 연도 확장과 독립 실행

기존 Sprint3 기본 프로필과 리포트는 그대로다. 아래 프로필은 명시적으로 선택하는 별도 범위이며, 기본 엔진·G0/G1-P2·공개 출시의 승격이 아니다. [지원 행렬](research/EXTENDED_YEAR_SUPPORT_MATRIX.md), [역사 시계 감사](research/HISTORICAL_CLOCK_1950_1988_COVERAGE_AUDIT.md), [권리 감사](research/KASI_DATA_RIGHTS_DISTRIBUTION_AUDIT_V01.md), [실제 실행 기록](engineering/SPRINT4_EXECUTION_20261115.md)을 함께 읽는다.

## 실행 가능한 범위

| 프로필 | 입력/시계 | 지원·보류 |
| --- | --- | --- |
| `kasi-api-1989-2026-local-v1` | 기존 현대 시계/네 자시 정책 | 기존 JSON/TEXT·M1~M7/M5 결과 유지 |
| `kasi-api-1962-1986-standard-local-v1` | `KR_API_PUBLISHED_KST_HISTORICAL_1962_1986_NO_DST_V1` | 양력 환산1962–1986의 양력/음력·윤달. 표준+09/DST0.1961대설은 guard만 |
| `kasi-api-1989-2027-solar-local-v1` | `KR_API_PUBLISHED_KST_MODERN_1989_2027_NO_DST_V2` | 양력1989–2027.2027음력 대응은 NEEDS_DATA. 현재+09/noDST의 명시 선택이며 미래 법령 인증 아님 |

1950–1961·1987–1988은 새 시각 명식으로 채택하지 않는다.1987/88 DST gap은 NONEXISTENT_TIME, fold는 두 offset의 AMBIGUOUS_TIME으로 진단하며 단일 명식을 만들지 않는다. 다른 미채택 시기는 POLICY_UNRESOLVED 또는 범위 밖이다. 시각 미상·24:00·임의 자정 보충·진태양시 보정은 지원하지 않는다.

2027 양력 원국의 년/월주는 기존 보강 raw의 실제24절기, 일/시주는 기존 Gregorian/60갑자/자시 산술을 사용한다. **음력 관측행이 있는 것처럼 source ID를 만들지 않는다.** JSON은 계산한 양력 날짜를 PROJECT_CALENDAR_IMPLEMENTATION으로 구분하고 음력 대응의 NEEDS_DATA를 남긴다.

월운 V2 `M7-MONTHLY-TWELVE-JIE-PUBLISHED-MINUTE-EXTENDED-2027-V02`를 선택하면2026표12구간,2027표10구간+2자료부족을 제공한다.2028소한/입춘의 검증된 입력이 없어 마지막 두 구간을 추정하지 않는다.2028 웹 예비표는 runtime에 편입하지 않았다. 입춘/12절 표시 분의 전후 상관 후보를 유지한다.

## 리포트의 하위 정책

새 리포트 `KASI-LOCAL-EXTENDED-CALENDAR-ANALYSIS-V01`은 기존 M2·구조적 M3·통근/인성 합 제한·내격8·공망을 재사용한다. 계절은 **명시한 v0.1(토월 보류)**이다. 원래 사립18일 v0.2와 제한 종합/M5의 시계 의존을 소급 확장하지 않아 이 경로에서는 최종 종합과 M5 후보를 보류한다. 이는 M5의 새로운 판단 정책이 아니다. 기존 Sprint3 product 경로의 계절v0.2/M5·대운/세운·명목 교운일은 유지되며 v3의 기존 mode로 실행할 수 있다.

summary/detailed는 같은 구조화 객체·근거를 사용한다. 요약은7섹션이고 상세는 기존 근거·정확한 위치·출처·정책·자료 지문을 제공한다. JSON은 detail 선택과 무관하다. 출생 M1은 요청당1회다. 외부 LLM·새 UI·자동 파일 저장은 없다.

## 내부 artifact 제작

제작에는 기존 고정 Node22·TS5.8.3·설치된 잠금 의존성과 Git이 필요하다. **완성본 실행/복원에는 Node22만 필요**하다. 데이터 없는 엔진과 private attachment를 분리한다. 원본·후보·기존 보강을 수정하지 않는다.

```powershell
$s4Repo = 'C:\Users\Home\Desktop\만세력 엔진\source'
$s4Node = 'C:\Users\Home\Desktop\Manseryeok-KASI-1950-2026-windows-x64\Manseryeok-KASI-1950-2026\runtime\node.exe'
Set-Location -LiteralPath $s4Repo
$s4Engine = Join-Path $s4Repo '.private\sprint4-package-example\engine'
$s4Data = Join-Path $s4Repo '.private\sprint4-package-example\data'
& $s4Node scripts/offline/build-v3.mjs --out $s4Engine
& $s4Node "$s4Engine\attach.mjs" --candidate '.private\kasi-research-1950-2026-fe84ab4-a' --boundary-supplement '.private\kasi-2027-boundary-00379e9-20261111-b' --out $s4Data
& $s4Node "$s4Engine\verify.mjs" --artifact $s4Engine --attachment $s4Data
```

목적지는 새 경로여야 한다. base7파일과 기존 boundary5파일을 각각 하위 디렉터리에 원byte로 복사하고 descriptor만 별도로 만든다. 고정 base `8ffadb04…`, boundary `f6a0e6dd…`, 새연간 `77da197d…` pin을 별도로 검증한다. 원문·manifest 안의 해시를 그 자체의 기대값으로 사용하지 않는다.

```powershell
$s4RestoreRoot = Join-Path ([IO.Path]::GetTempPath()) ('manseryeok-s4-' + [Guid]::NewGuid().ToString('N'))
$s4RestoredEngine = Join-Path $s4RestoreRoot 'engine'
$s4RestoredData = Join-Path $s4RestoreRoot '.private\data'
& $s4Node "$s4Engine\restore.mjs" --artifact $s4Engine --out $s4RestoredEngine --attachment $s4Data --private-data-out $s4RestoredData
& $s4Node "$s4RestoredEngine\verify.mjs" --artifact $s4RestoredEngine --attachment $s4RestoredData
Set-Location -LiteralPath $s4RestoreRoot
$s4Engine = $s4RestoredEngine
$s4Data = $s4RestoredData

$s4Common = @('--mode','extended-product','--attachment',$s4Data,
  '--day-rollover','CIVIL_MIDNIGHT','--hour-stem-reference','SELECTED_DAY_PILLAR',
  '--report-profile','KASI-LOCAL-EXTENDED-CALENDAR-ANALYSIS-V01')
& $s4Node "$s4Engine\run.mjs" @s4Common --profile kasi-api-1962-1986-standard-local-v1 --clock-policy KR_API_PUBLISHED_KST_HISTORICAL_1962_1986_NO_DST_V1 --calendar GREGORIAN --date 1962-06-01 --time 12:00 --detail summary --output text
& $s4Node "$s4Engine\run.mjs" @s4Common --profile kasi-api-1962-1986-standard-local-v1 --clock-policy KR_API_PUBLISHED_KST_HISTORICAL_1962_1986_NO_DST_V1 --calendar KOREAN_LUNAR --lunar-year 1962 --lunar-month 4 --lunar-day 29 --leap false --time 12:00 --detail detailed --output text
& $s4Node "$s4Engine\run.mjs" @s4Common --profile kasi-api-1989-2027-solar-local-v1 --clock-policy KR_API_PUBLISHED_KST_MODERN_1989_2027_NO_DST_V2 --calendar GREGORIAN --date 2027-06-01 --time 12:00 --monthly-policy M7-MONTHLY-TWELVE-JIE-PUBLISHED-MINUTE-EXTENDED-2027-V02 --monthly-year 2026 --detail summary --output json
```

보류는 원상태/사유를 JSON에 남기고 exit2, 잘못된 입력·지문/파일 오류는 안전한 stderr와 exit1로 구분한다. stdout JSON에 배너를 섞지 않는다. source/candidate 경로와 hash override는 wrapper가 고정한다. 원본 저장소 import·fallback fixture·외부 API·키는 필요 없다. [v3 패키지 계약](contracts/OFFLINE_EXTENDED_ANALYSIS_V3.md)에 파일/경로/변조 가드를 기록했다.

## 자료 사용과 배포

API-only 계산·캐싱·가공·서버 내부 상업적 사용은 권리 감사의 조건부 허용 근거가 있다. **이 내부 attachment 전체의 고객 파일 배포는 UNRESOLVED**다. 비공개 자료를 Git/공개 artifact에 넣거나 코드 MIT 고지를 자료 전체 허락으로 바꾸지 않는다. 별도 공고/연간TXT/OSS내장표는 개별 권리다. 공개 출시·배포는 이번 실행 기능 GO와 별개다.

최종 실행 SHA·실제 새범위 사례·기존49,799쌍 재검사 여부·Chromium·실패 및 재검사는 [실행 기록](engineering/SPRINT4_EXECUTION_20261115.md)에서 확인한다.

## 최종 제작본과 실행 근거

최종 실행 SHA `f1ce4ffb24984c1098f593031de44d36fd643260`, 내부 제작본은 `.private/sprint4-20261115/final-f1ce4ff/engine`과 `data`다.96payload/870574bytes, engine manifest `84145cf304099585b59f023fffb64a1d978d1863a3239e8d28a7fd1bd4db604f`, attachment `9d2703eeef4d437ebf707ff7f12656fe8543eae1a56ff96a56fd15cc0f5aded5`를 확인한다.94성공+별도M7투영2·12보류/3입력·2경로거절·42TZ출력쌍동일을 저장소 밖에서실행했다. 전체907/907·M2·Chromium·현대49,799쌍/TZ·새범위 검사는 [실행 기록](engineering/SPRINT4_EXECUTION_20261115.md)에 단위와실패를분리했다.

위 제작 예 대신 이미 만든 내부 제작본을 복원하려면 다음처럼 위치만 지정하고 **위의 restore/verify 블록부터** 실행한다. 이 후 실행에는Git/npm/원본소스가필요없다. 달력자료를공개파일로공유하지않는다.

```powershell
$s4Engine = 'C:\Users\Home\Desktop\만세력 엔진\source\.private\sprint4-20261115\final-f1ce4ff\engine'
$s4Data = 'C:\Users\Home\Desktop\만세력 엔진\source\.private\sprint4-20261115\final-f1ce4ff\data'
```

현대기본모드의M5/대운·세운·명목교운일은그대로이고확장report가해당효력범위를대신승인하지않는다.2027음력과2027월운끝2는완료로표시하지않으며자료수집은별도승인이필요하다.
