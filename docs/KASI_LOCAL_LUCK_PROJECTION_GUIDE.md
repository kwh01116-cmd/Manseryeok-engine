# 선택형 M7 v0.2 — 명목 교운일·대운 기간 조회

새 옵션은 기존 M7 v0.1의 방향·순서·절입·기산 유리수·세운 결과를 재사용해 명목 달력 기간표를 만든다. 출생 명식은 요청당 한 번 계산한다. `--calendar-projection`을 생략하면 기존 v0.1 JSON/TEXT와 제한이 유지된다. 새 화면·서버·API·LLM은 없다.

## 복사 가능한 PowerShell 명령

현재 PC의 준비 경로는 이 가이드에만 사용한다. 다른 PC에서는 Node22와 이미 검증한 비공개 후보 위치를 명시한다. 입력 예시는 모두 개인 기록이 아닌 **가상 출생정보**다.

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
  '--luck-profile', 'M7-TRADITIONAL-YEAR-STEM-JIE-3D-V01',
  '--calendar-projection', 'M7-CALENDAR-NOMINAL-YMDH-SEQUENTIAL-CLAMP-V02',
  '--dayun', 'true', '--dayun-count', '10'
)
```

명목 첫 교운일과 기간표만 출력한다. as-of를 생략했다고 현재 PC 시각을 사용하지 않는다.

```powershell
& $node .\scripts\kasi\local-luck.mjs @common `
  --traditional-sex MALE --calendar GREGORIAN `
  --date 2026-06-01 --time 12:00 --output text
& $node .\scripts\kasi\local-luck.mjs @common `
  --traditional-sex FEMALE --calendar GREGORIAN `
  --date 2026-06-01 --time 12:00 --output json
```

같은 날짜가 되는 음력 입력도 기존 관측 날짜 인덱스를 사용한다.

```powershell
& $node .\scripts\kasi\local-luck.mjs @common `
  --traditional-sex MALE --calendar KOREAN_LUNAR `
  --lunar-year 2026 --lunar-month 4 --lunar-day 16 --leap false `
  --time 12:00 --as-of-date 2026-11-01 --as-of-time 12:00 --output json
```

1990년 가상 출생자를2026년 명시적 시각에 조회한다. JSON 대신 `--output text`로 바꿀 수 있다. 원국 M2 기초 설명이 필요하면 기존 명시 옵션 `--m2-profile m2-basic-classification-local-v1`을 덧붙인다.

```powershell
& $node .\scripts\kasi\local-luck.mjs @common `
  --traditional-sex MALE --calendar GREGORIAN `
  --date 1990-06-01 --time 12:00 `
  --as-of-date 2026-11-01 --as-of-time 12:00 --output text
```

입춘 표시 분의 별도 후보와 동분 보류, 연말 자료 부족:

```powershell
& $node .\scripts\kasi\local-luck.mjs @common `
  --traditional-sex MALE --calendar GREGORIAN `
  --date 2026-02-04 --time 05:02 `
  --as-of-date 2026-11-01 --as-of-time 12:00 --output text
& $node .\scripts\kasi\local-luck.mjs @common `
  --traditional-sex FEMALE --calendar GREGORIAN `
  --date 2026-02-04 --time 05:02 `
  --as-of-date 2026-11-01 --as-of-time 12:00 --output json
& $node .\scripts\kasi\local-luck.mjs @common `
  --traditional-sex MALE --calendar GREGORIAN `
  --date 2026-12-31 --time 12:00 `
  --as-of-date 2026-12-31 --as-of-time 12:00 `
  --seyun-year 2027 --query-minute 2027-02-04T12:00 --output text
```

`--as-of-date`와 `--as-of-time`은 둘 다 필요하다. 출생 시각도 기존처럼 필수다. 잘못된 날짜를 말일로 고쳐 받지 않고, 알 수 없는 정책·인자는 거절한다. 대운을 요청하지 않은 순수 세운 경로에 투영 옵션을 붙이지 않는다. 세운은 기존 명령으로 독립 실행할 수 있다.

## 선택한 규칙과 범위

정수 분 M을 Y=floor(M/4320), MO=floor((M mod4320)/360), D=floor((M mod360)/12), H=2×(M mod12)로 분해한다. 출생의 실제 기록 날짜/시각부터 **년→월→일→시** 순서로 더하고 년/월 단계만 유효한 목표 월의 말일로 제한한다. 원래 M/4320 유리수와 단계별 값·clamp 여부를 남긴다. 표시용 소수나 자시 effectiveDayDate를 입력으로 사용하지 않는다.

첫 명목 교운일 S를 기준으로 경계마다 **S+10×k년을 직접** 가산한다. 전 경계에서 다시10년씩 더하지 않는다. 각 구간은 `[시작, 종료)`다. S=2000-02-29라면 +10년은2010-02-28, +20년은2020-02-29로 복구된다.

이 규칙은 단조 변환이 아니다. 출생2026-01-31 12:00에서 M359는2026-03-02 10:00이지만 M360은2026-02-28 12:00이다. 모형 단위와 실제 달력의 월 길이가 달라 생기는 정책 성질이며 값을 보정하지 않는다.

| 구분 | 범위·의미 |
| --- | --- |
| 출생 지원 |양력 환산 `[1989-01-01,2027-01-01)`, 기존4일주/시주 정책 유지 |
| 원문/기산 자료 |1950~2026 확보본, 현대 프로필과1988말 보조 대설 사용.2026말 순행의2027소한 부족은 유지 |
| 순수 명목 산술 |유효한 Gregorian `0001-01-01T00:00`~`9999-12-31T23:59`, 안전 정수·연산 범위 밖 거절 |
| 실사용 as-of 선택 |`[1989-01-01T00:00,2027-01-01T00:00)`의 검토된 현대 민간시. 범위 밖은 POLICY_UNRESOLVED |
| 미래 기간 생성 |가능하지만 미래 법정시·DST·세운이나 정확한 UTC 순간을 인증하지 않음 |

첫 교운일 전은 BEFORE_FIRST_DA_YUN이며 소운을 만들지 않는다. 출생 전은 BEFORE_BIRTH, 구간 내부는 RESOLVED_UNDER_POLICY, 짧게 생성한 기간표 이후는 OUTSIDE_GENERATED_RANGE다. 정확한 명목 시작 분은 새 구간에 포함한다. 데이터 부족은 NEEDS_DATA, 같은 절입 분의 미확정은 AMBIGUOUS로 남기며 날짜를 만들지 않는다. as-of 범위 제한을 먼저 검사하고, 이어 기산 보류 상태, 출생 전, 첫 교운일 전, 구간 선택 순서로 판정한다.

## JSON·근거·import

새 결과는 `schemaVersion=kasi-local-luck-projection-v02`다. `m7`에는 발급된 기존 v0.1 결과 전체를 그대로 둔다. 그 안의 unresolved 필드는 **v0.1이 달력 정책을 선택하지 않았던 계약**이며, 새 선택 정책의 명목 결과는 `projection`에 따로 있다. `projection.baseContractScope=V01_UNPROJECTED_LEGACY_RESULTS_RETAINED`로 이 차이를 명시한다. 실제 물리적 교운 순간이 확정됐다는 뜻은 아니다.

`projection.candidates[i]`는 같은 실행의 `m7.luck.candidates[i]`다. 각 후보의 `calendar`에 분해·단계·첫 교운일·전체 기간표, `selection`에 명시한 as-of 결과가 있다. 입력 구간·원래 유리수·선택 절입·baseFactRefs와 규칙/정책/명리 출처·KASI 자료 출처도 구분한다. 후보를 섞거나 외부 JSON의 status/hash만으로 발급된 객체라고 신뢰하지 않는다. `explanation`의 한국어 템플릿은 이 facts만 소비한다.

```javascript
import {createLocalLuckProjectionProfile, projectLocalLuckResult}
  from './scripts/kasi/local-luck-projection.mjs';
const profile = createLocalLuckProjectionProfile(verifiedLocalChartProfile, {
  luckPolicyId: 'M7-TRADITIONAL-YEAR-STEM-JIE-3D-V01',
  calendarProjectionPolicyId: 'M7-CALENDAR-NOMINAL-YMDH-SEQUENTIAL-CLAMP-V02',
});
const result = profile.calculate(explicitBirthRequest, {
  dayun: {traditionalSex: 'MALE', count: 10},
}, {asOfMinute: '2026-11-01T12:00'});
// 이미 발급된 v0.1 결과로 다른 시각을 조회할 때 M1을 다시 계산하지 않는다.
const anotherQuery = projectLocalLuckResult(result.m7, {
  calendarProjectionPolicyId: 'M7-CALENDAR-NOMINAL-YMDH-SEQUENTIAL-CLAMP-V02',
  asOfMinute: '2026-11-02T12:00',
});
```

정상 JSON/TEXT는 stdout만 사용하고 오류는 안전한 stderr로 분리한다. 출생정보·결과의 기본 파일 저장이나 API 키·네트워크가 필요 없다. npm 실행을 선호하면 준비한 Node22 PATH에서 `npm run --silent kasi:luck -- [같은 전체 인자]`를 사용한다. 원문·export·후보·대량 결과는 Git에 넣지 않는다. [정책 근거·현대 구현 관례·반례](research/M7_CALENDAR_PROJECTION_V02.md), [기존 v0.1 계약](KASI_LOCAL_LUCK_GUIDE.md)을 함께 확인한다.
