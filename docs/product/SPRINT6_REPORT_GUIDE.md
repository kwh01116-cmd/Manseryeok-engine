# Sprint 6 소비자 리포트 시제품 실행

프로필은 `SAJU-CONSUMER-EVIDENCE-REPORT-V01` / `0.1.0`이다. 기존 API-only 서버 엔진을 사용하며 새 만세력 계산기·외부 API·LLM·결제·UI·자동 저장을 추가하지 않는다. 이 가이드는 내부 시제품용이고 공개 판매·파일 배포 승인이 아니다.

## Node 22에서 실행

이미 고정 의존성이 준비된 저장소에서 사용한다. 빌드에는 기존 TypeScript5.8.3, 실행에는 Node22와 기존 설치 의존성·검증된 API-only 자료팩이 필요하다. 새 npm 패키지를 설치하거나 키를 설정하지 않는다. 아래 경로는 검증 환경의 예이며 operator가 실제 checkout/Node/자료 위치를 지정한다. 자료 경로는 고객 요청에 포함하지 않는다.

```powershell
$s6Repo = 'C:\Users\Home\Desktop\만세력 엔진\source'
$s6Node = 'C:\Users\Home\Desktop\Manseryeok-KASI-1950-2026-windows-x64\Manseryeok-KASI-1950-2026\runtime\node.exe'
$s6Data = Join-Path $s6Repo '.private\sprint5-20261115\api-only-pack-review-a'
Set-Location -LiteralPath $s6Repo
& $s6Node node_modules/typescript/bin/tsc -p tsconfig.json
if ($LASTEXITCODE -ne 0) { throw 'Main TypeScript build failed' }
& $s6Node node_modules/typescript/bin/tsc -p tsconfig.kasi.json
if ($LASTEXITCODE -ne 0) { throw 'KASI TypeScript build failed' }

$s6Request = @{
  schemaVersion = 'manseryeok-server-analysis-request-v1'
  analysisProfileId = 'KASI-SERVER-API-ONLY-ANALYSIS-V01'
  calendarProfileId = 'kasi-api-1989-2026-local-v1'
  jurisdiction = 'KR'; timeZone = 'Asia/Seoul'
  calendar = 'GREGORIAN'; date = '1992-11-24'; time = '00:30'
  policies = @{
    clockPolicyId = 'KR_API_PUBLISHED_KST_MODERN_1988_POST_DST_V1'
    dayRollover = 'CIVIL_MIDNIGHT'; hourStemReference = 'SELECTED_DAY_PILLAR'
  }
} | ConvertTo-Json -Depth 12 -Compress
$s6Common = @(
  '--data-pack', $s6Data, '--request-json', $s6Request,
  '--report-profile', 'SAJU-CONSUMER-EVIDENCE-REPORT-V01',
  '--audience', 'full', '--voice', 'report', '--detail', 'summary'
)
& $s6Node scripts/product/consumer-report.mjs @s6Common --output text
& $s6Node scripts/product/consumer-report.mjs @s6Common --output json
& $s6Node scripts/product/consumer-report.mjs @s6Common --output sections
```

`--audience preview`는 무료 구성 가설에 해당하는 장·문장을 고른다. `--voice dialogue`는 같은 문장의 speaker를 추가하는 최소 대화 view다. 캐릭터별 새 해석을 생성하지 않는다. `--detail evidence`의 TEXT는 같은 근거 모델을 뒤에 붙인다. 7개 옵션은 명시해야 하며 다른 이름/중복/32KiB 초과 요청을 거절한다. stdout에는 결과만 출력하고 오류는 안전한 phase/code만 stderr에 남긴다.

JSON은 **운영자용 전체 근거 모델**이다. `audience`가 JSON의 유료 정보 필터나 인증을 의미하지 않는다. 고객용 미리보기에는 `sections` 또는 TEXT의 `preview`를 사용한다. 실제 entitlement·결제/저장·개인정보 접근통제는 Sprint8 등 후속 수락 대상이며 이 CLI를 공개 HTTP 서비스로 노출하지 않는다.

## 원 결과를 재사용하는 import

`scripts/product/consumer-report.mjs`의 `loadConsumerReportService({dataDirectory,profileId})`로 문맥을 한 번 준비하고 `service.calculate(request)`를 호출한다. 이미 발급된 서버 결과가 있다면 `analyzeConsumerReport(serverResult,{request,profileId})`를 사용하며 출생 M1을 다시 부르지 않는다. `projectServerReport`는 발급·요청·정책·원 경로를 확인한다.

순수 함수는 `dist/report/consumerReportV1.js`의 `buildConsumerReport`, `validateConsumerReport`, `buildReportSections`, `renderConsumerReport`다. 순수 모델은 projection의 정합성을 검사하며 API/G0 진위 인증을 대신하지 않는다. 저장된 JSON 모델을 검증하려면 원 projection이 필요하다. hash는 암호화·익명화가 아니다.

## 출력·지원 범위

정상 출생 입력도 현재는 `LIMITED_PROVIDABLE`, `fullPaidReport=false`다. 성향/행동·관계/일/재물 장은 HOLD이며 실제 제공 가능한 구조 연결·M5 후보/보류·시간축과 구분한다. 시각 미상·미선택 DST fold는 추가 정보 필요, gap·자료/출생 범위 미지원은 제공 불가로 나눈다. 원국 후보 두 개와 한 원국의 계절 대안 두 개를 섞지 않는다.

1962–86 안정 역사·1987/88 DST·현대·2027 양력 프로필은 기존 서버 계약을 따른다. 출생 원국 지원과 M5/M7의 시계 범위는 다르다. 2027 음력/월운 끝2는 여전히 자료 부족이며 이 Sprint는 13시도 수집 계획을 승인하거나 실행하지 않는다.

**기존 오프라인 v4는 수정하지 않았다.** 이 소비자 시제품이 기존 artifact에 포함됐다고 주장하지 않는다. 새 경로는 저장소 CLI/import이며 기존 독립 엔진과 자료팩의 무결성·실행 회귀를 따로 확인한다.

## 실제 수락 범위

실행 코드 `ba700772c30cf21ee6ba3b3e1383591108c77ca8`에서 전체985/985·M2·Lab/KASI, 신규CLI49회(정상39/입력보류10), 기존v4 JSON/TEXT2회와 UTC/Seoul20출력 쌍을 확인했다. 최초 Lab 종료 실패와 하니스의 DST 표현 검사 실패도 숨기지 않고 [실행 기록](../engineering/SPRINT6_EXECUTION_20261121.md)에 구분했다. 추가 외부 패키지·LLM·API는 사용하지 않는다.

시제품은 **PARTIAL**이며 완전 유료 상품 제공은 **NO-GO**다. 같은 구조 분기의 첫 문단 반복과 아직 많은 전문 용어가 남아 있고 성향/관계/일/재물 장은 HOLD다. 인간 전문가·일반 소비자·구매 가치 검증은 미실행이다. 전체 모델을 HTTP나 유료 서비스로 공개하는 실행 명령은 제공하지 않는다.

[스키마](REPORT_SCHEMA_V01.md) · [문장 계약](REPORT_CLAIM_CONTRACT_V01.md) · [상품 PRD](SPRINT6_SINGLE_REPORT_PRD.md) · [공백 행렬](REPORT_CONTENT_GAP_MATRIX.md) · [서버 계약](../contracts/SERVER_INTEGRATION_DTO_V01.md)
