# API 로컬 명식의 대운·세운 시간축 계산 v0.1

이 명령은 이미 검증한 API 후보와 기존 출생 명식을 사용해 **대운 방향·간지 순서·명목 기산나이, 세운 연도 라벨·입춘 시각 판정**을 출력한다. 좋은 운·나쁜 운이나 개인의 미래 사건을 판정하지 않는다. 기존 `kasi:chart`와 `kasi:explain`은 그대로이며, M7 기능은 새 `kasi:luck` 명령에서 명시적으로 선택한다.

출생 입력 하나에 기존 M1을 한 번 호출한다. 선택한 모든 출생 후보는 같은 실행의 연간·월주·방향·기산 이벤트와 연결한다. 세운 시각 조회는 별도 년 경계 조회로 세며 출생 명식을 다시 계산하지 않는다. M2 기본 설명도 선택적으로 같은 M1 결과에 연결한다.

## 현재 Windows 환경 준비

아래 입력은 모두 **개인 기록이 아닌 가상 입력**이다. 현재 PC의 Node22 실행 파일 경로는 이 가이드에만 있다. 핵심 코드에는 PC 절대 경로를 넣지 않았다. 다른 PC에서는 `$node`와 로컬 후보 위치를 해당 환경으로 바꾼다.

```powershell
Set-Location 'C:\Users\Home\Desktop\만세력 엔진\source'
$node = 'C:\Users\Home\Desktop\Manseryeok-KASI-1950-2026-windows-x64\Manseryeok-KASI-1950-2026\runtime\node.exe'
$candidate = '.private\kasi-research-1950-2026-fe84ab4-a'
$pin = '8ffadb04c8460969085610162d3d5e8855af9272a8a4be1dbe10123c15f90edf'
& $node --version
```

현재 버전은 `v22.23.3`이다. 설치된 잠금 의존성을 유지한다. 코드 변경 후 빌드가 필요하면 같은 Node22로 실행한다.

```powershell
$npmCli = 'C:\Program Files\nodejs\node_modules\npm\bin\npm-cli.js'
$env:PATH = (Split-Path -Parent $node) + ';' + $env:PATH
& $node $npmCli run build
```

`$pin`은 앞서 별도로 고정한 기대 지문이다. 검사할 manifest에서 새 값을 읽어 이 기대값을 바꾸지 않는다. 원문·export·기존 후보a/b는 읽기 전용이며, 자료나 지문이 잘못되면 기존 fixture로 대신하지 않는다. KASI API·키·LLM·외부 생성 서비스가 필요하지 않다.

공통 인자와 전통 방향 규칙용 입력을 분리한다. `MALE`/`FEMALE`은 이번 계산에 사용자가 명시한 전통 규칙용 값이며 이름·계정·문체로 추정하지 않는다. 예시의 선택이 숨은 기본값으로 적용되지 않는다.

```powershell
$common = @(
  '--profile', 'kasi-api-1989-2026-local-v1',
  '--candidate', $candidate,
  '--manifest-sha', $pin,
  '--clock-policy', 'KR_API_PUBLISHED_KST_MODERN_1988_POST_DST_V1',
  '--day-rollover', 'CIVIL_MIDNIGHT',
  '--hour-stem-reference', 'SELECTED_DAY_PILLAR',
  '--luck-profile', 'M7-TRADITIONAL-YEAR-STEM-JIE-3D-V01'
)
$male = @('--dayun', 'true', '--traditional-sex', 'MALE', '--dayun-count', '10')
$female = @('--dayun', 'true', '--traditional-sex', 'FEMALE', '--dayun-count', '10')
```

## 양력·음력의 일반 예시

양력 가상 출생의 대운과2027년 세운 라벨, 명시적2026년 조회 시각을 한국어로 출력한다.

```powershell
& $node .\scripts\kasi\local-luck.mjs @common @male `
  --calendar GREGORIAN --date 2026-06-01 --time 12:00 `
  --seyun-year 2027 --query-minute 2026-06-01T12:00 --output text
```

같은 양력 날짜가 되는 음력2026년4월16일 평달의 JSON:

```powershell
& $node .\scripts\kasi\local-luck.mjs @common @male `
  --calendar KOREAN_LUNAR `
  --lunar-year 2026 --lunar-month 4 --lunar-day 16 --leap false `
  --time 12:00 --seyun-year 2027 `
  --query-minute 2026-06-01T12:00 --output json
```

전통 방향 규칙용 입력만 명시적으로 바꾼 역행 예:

```powershell
& $node .\scripts\kasi\local-luck.mjs @common @female `
  --calendar GREGORIAN --date 2026-06-01 --time 12:00 --output text
```

고정 실제 후보에서 위 가상 명식의 월주는癸巳다. MALE이면 순행 첫3개는 **甲午→乙未→丙申**, 다음 망종2026-06-06 00:48까지6528분이다. 기산 산술은6528/4320, 기약분수68/45 모형년이며 표시값은1.511111이다. FEMALE이면 역행 첫3개는 **壬辰→辛卯→庚寅**, 이전 입하2026-05-05 20:49부터38351분,38351/4320 모형년이며 표시값은8.877546이다. 이는 원문 분 표기와 선택한 비례식의 산술이며 실제 교운 날짜가 아니다. 현재 실행 증거와 정확한 SHA는 [최신 인계](EXECUTION_HANDOFF.md)에 연결된 실행 보고서를 따른다.

첫 항목에 월주 자체를 넣지 않는다. 출력 개수는 **1~20**, 이 예시는10개를 명시한다.20개 간지 순서를 나열하는 데 미래200년의 절입을 수집할 필요는 없다. 기산 이벤트와 특정 시각 조회의 데이터 요구는 별개다.

## 입춘 표시 분의 두 후보

실제 API가 발표한 입춘 표시 분에서 두 후보의 방향·순서·기산이 같은 후보 안에서 연결되는지 확인한다.

```powershell
& $node .\scripts\kasi\local-luck.mjs @common @male `
  --calendar GREGORIAN --date 2026-02-04 --time 05:02 `
  --query-minute 2026-02-04T05:02 --output json
& $node .\scripts\kasi\local-luck.mjs @common @female `
  --calendar GREGORIAN --date 2026-02-04 --time 05:02 `
  --query-minute 2026-02-04T05:02 --output text
```

MALE의 경계 전 후보는음년乙을 사용해 역행하고 소한을 향한다. 경계 후 후보는양년丙을 사용해 순행하고 경칩을 향한다. FEMALE이면 경계 전은 순행, 경계 후는 역행이며 둘 다 같은 입춘 표시 분을 향한다. 이 두 기산은 **명목0분 진단값만 보존하고 age=null/AMBIGUOUS**로 남긴다. 정확한0세나 임의1세로 바꾸지 않는다. 순서 결과는 계속 제공한다.

출생 후보와 별도로 요청한 세운 조회도 입춘 표시 분에서는 두 조건부 결과를 유지한다. 조회가 출생과 같은 표시 분이라는 사실만으로 실제 순간이 같다고 선언하지 않는다. 출생 전 조회이면 `BEFORE_BIRTH_REPORTED_MINUTE`를 표시하며 개인 운세 기간으로 설명하지 않는다.

## 연말의 부분 자료 부족

```powershell
& $node .\scripts\kasi\local-luck.mjs @common @male `
  --calendar GREGORIAN --date 2026-12-31 --time 12:00 `
  --seyun-year 2027 --query-minute 2027-02-04T12:00 --output text
```

이 예에서 대운 방향과 간지 순서는 가능하지만 순행 기산은 **2027년 소한이 없어 NEEDS_DATA**다.2027년 연도 라벨丁未는 계산할 수 있고,2027년 특정 시각의 세운 판정은 **2027년 입춘이 없어 NEEDS_DATA**다. JSON의 `missingData`가 연도·절기·기능을 구분한다. 월주 순서, 기산, 세운 시각의 자료 요구를 합쳐 전체 실패로 바꾸지 않는다. 원래 데이터나 manifest를 수정하거나 기존2027 fixture·API 재수집으로 보충하지 않는다.

반대로2026년 말 역행은 이미 있는 대설을 사용할 수 있다.1989년 초 역행은 기존 후보의1988년 말 대설이 보조 이벤트다. 이 한 겨울 이벤트의 채택이1988년 출생/DST 지원을 뜻하지 않는다.

## 세운만 요청하기

2027년이라는 **연도 라벨의 주기 산술**에는 출생정보·성별값·후보 데이터가 필요하지 않다.

```powershell
& $node .\scripts\kasi\local-luck.mjs `
  --luck-profile M7-TRADITIONAL-YEAR-STEM-JIE-3D-V01 `
  --seyun-year 2027 --output json
```

이때 `mode=SEYUN_LABEL_ONLY`, `m1=null`, `provenance=null`이며 M1 호출0회다. 라벨 범위는 정수1~9999다. API가 그 연도의 절입을 제공했다는 뜻이 아니다.

출생과 결합한 **명시적 시각 조회만** 할 때도 전통 성별값은 필요하지 않다.

```powershell
& $node .\scripts\kasi\local-luck.mjs @common `
  --calendar GREGORIAN --date 2026-06-01 --time 12:00 `
  --query-minute 2026-01-01T12:00 --output text
```

2026-01-01은2026 입춘 전이므로 세운은2025라벨乙巳다.1월1일·음력 설을 숨은 경계로 쓰지 않는다. 실제 시각 판정은 선택한 프로필이 제공하는 절입과 검증된 현대 시간 정책 범위에서만 계산한다.1989년보다 이른 조회는 시각 정책을 보류하며,2027년 등 해당 입춘 자료가 없으면 NEEDS_DATA다. 현재 PC 시각을 입력 대신 읽지 않는다.

## 기존 M2 기초 설명도 함께 받기

```powershell
& $node .\scripts\kasi\local-luck.mjs @common @male `
  --calendar GREGORIAN --date 2026-06-01 --time 12:00 `
  --m2-profile m2-basic-classification-local-v1 --output json
```

`baseExplanation`은 기존 원국 M2 분류·설명을 담는다. 대운·세운을 원국의 다섯 번째 기둥으로 끼워 넣지 않는다. 이번 버전은 대운/세운 천간의 십성, 원국과의 기간별 삼합·삼회·합화·강약·종합 길흉을 확장하지 않았다.

## JSON 상태·근거·재사용

JSON은 `schemaVersion=kasi-local-luck-v01`, 원래 `m1`, 선택적인 `baseExplanation`, `luck`, 한국어 `explanation`을 담는다. `luck`에는 프로필/dataset/manifest·시간 정책, 후보별 방향·순서·기산·모형 구간·세운, 선택한 규칙/정책/출처, 개별 fact와 설명 참조가 있다. KASI는 절입/날짜 자료의 출처이고, 명리 방향 규칙의 출처는 별도로 구분한다.

상위 `status=OK`는 출력 가능한 원국과 기능별 결과가 있다는 뜻이다. 반드시 `dayun.start.status`, `seyun.atMinute.status`도 읽는다. 기산 NEEDS_DATA, 동분 AMBIGUOUS, 교운일 POLICY_UNRESOLVED는 서로 다르다. 세운을 함께 요청했는데 대운의 성별값/개수가 잘못됐으면 대운만 INVALID_INPUT으로 남기고 세운을 계속 제공할 수 있다. 대운만 요청한 잘못된 필수값은 계산 전에 거절한다.

기산은 분자/분모 M/4320과 약분값을 모두 유지한다. 표시6자리 HALF_UP은 별도 정책이며 다음 계산에 재사용하지 않는다. 모형 구간은 `[기산+10×(순번−1), 기산+10×순번)`이다. 이것을 실제 달력 날짜·세는나이·현재 대운으로 읽지 않는다. 정확한 교운일과 현재 대운은 달력 가산 정책이 닫히지 않아 POLICY_UNRESOLVED다.

`chart.candidates[i]`는 같은 실행의 `m1.chart.candidates[i]`다. `luck.candidates[i]#...`는 후보의 facts 배열에서 ID로 찾는 사실이다. 설명의 fact/rule/policy/source refs와 계산 자료 refs를 같은 결과의 목록에서 따라갈 수 있다. 발급한 luck facts는 동결되며 외부 JSON의 `status=OK`나 지문 문자열만으로 신뢰된 실행 객체를 재개하지 않는다. 기존 G0 receipt를 만들지 않고 G1-P2 NO-GO도 유지한다.

핵심 함수는 CLI와 분리되어 import할 수 있다.

```javascript
import {loadLocalChartProfile} from './scripts/kasi/local-chart.mjs';
import {createLocalLuckProfile} from './scripts/kasi/local-luck.mjs';
import {M7_LUCK_POLICY_V01, annualLuckYearLabel} from './dist/luck/luckV01.js';

const chart = await loadLocalChartProfile({
  directory: candidateDirectory,
  expectedManifestSha256: independentlyHeldPin,
  profileId: 'kasi-api-1989-2026-local-v1',
});
const profile = createLocalLuckProfile(chart, {luckPolicyId: M7_LUCK_POLICY_V01});
const result = profile.calculate(explicitBirthRequest, {
  dayun: {traditionalSex: 'MALE', count: 10},
  seyun: {yearLabel: 2027, queryMinute: '2026-06-01T12:00'},
});
const pureLabel = annualLuckYearLabel(2027, M7_LUCK_POLICY_V01);
```

이 예시의 `candidateDirectory`, `independentlyHeldPin`, `explicitBirthRequest`는 호출자가 명시하는 값이다. 같은 프로필의 검증된 timeline을 재사용하고 요청마다 대량 원문을 다시 읽거나 CLI JSON을 재파싱해 연결하지 않는다. [정책10항목·전사 출처·별도 구현 관례](research/M7_LUCK_POLICY_V01.md)를 함께 확인한다.

정상 결과는 stdout JSON 또는 TEXT만 출력한다. 오류는 출생정보·비공개 경로를 인용하지 않는 stderr JSON이며 문법/정책/지문 문제는 exit1, 지원하지 않는 출생 입력은 exit2다. 부분적인 자료 부족은 성공 출력 안의 해당 기능 상태로 제공한다. npm 자체 배너도 빼려면 `npm run --silent kasi:luck -- [인자 전체]` 또는 준비 블록의 Node22 npm CLI를 사용한다.

기본 파일 저장·출생정보 로깅·네트워크·API 키·LLM 호출은 없다. 사용자가 직접 stdout을 파일로 리다이렉트한 경우에만 그 출력 파일이 생긴다. 개인 기록을 개발 일지나 Git에 보관하지 않는다. 기본 엔진2026~2027/G0·G1,1950~2026 원본 확보 범위와1989~2026 시각 명식 지원 범위를 유지하며 역사시 확대·UI·공개 배포·예측 해석은 이 명령의 완료 범위가 아니다.
