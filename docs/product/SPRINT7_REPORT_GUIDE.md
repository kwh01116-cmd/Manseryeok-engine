# Sprint7 개인화 전통 해석 시제품 실행

명시적 `SAJU-TRADITIONAL-REFLECTION-REPORT-V01`/0.1.0 선택형 경로다. 기존 S6 CLI는 변경하지 않는다. Node22·기존 고정 의존성·기존 검증 API-only 팩을 사용하며, 키/실시간 KASI/외부 만세력/LLM/결제/공개 배포가 필요하지 않다.

## 실제 CLI

```powershell
$s7Repo = 'C:\Users\Home\Desktop\만세력 엔진\source'
$s7Node = 'C:\Users\Home\Desktop\Manseryeok-KASI-1950-2026-windows-x64\Manseryeok-KASI-1950-2026\runtime\node.exe'
Set-Location -LiteralPath $s7Repo
& $s7Node node_modules/typescript/bin/tsc -p tsconfig.json
if ($LASTEXITCODE -ne 0) { throw 'Main build failed' }
& $s7Node node_modules/typescript/bin/tsc -p tsconfig.kasi.json
if ($LASTEXITCODE -ne 0) { throw 'KASI build failed' }
$s7Request = @{
  schemaVersion = 'manseryeok-server-analysis-request-v1'
  analysisProfileId = 'KASI-SERVER-API-ONLY-ANALYSIS-V01'
  calendarProfileId = 'kasi-api-1989-2026-local-v1'
  jurisdiction = 'KR'; timeZone = 'Asia/Seoul'
  calendar = 'GREGORIAN'; date = '2026-01-08'; time = '12:00'
  policies = @{
    clockPolicyId = 'KR_API_PUBLISHED_KST_MODERN_1988_POST_DST_V1'
    dayRollover = 'CIVIL_MIDNIGHT'; hourStemReference = 'SELECTED_DAY_PILLAR'
  }
} | ConvertTo-Json -Depth 12 -Compress
$s7Common = @(
  '--data-pack', (Join-Path $s7Repo '.private\sprint5-20261115\api-only-pack-review-a'),
  '--request-json', $s7Request,
  '--interpretation-profile', 'SAJU-TRADITIONAL-REFLECTION-REPORT-V01',
  '--audience', 'full', '--voice', 'report', '--detail', 'summary',
  '--generator', 'deterministic'
)
& $s7Node scripts/product/interpreted-report.mjs @s7Common --output text
& $s7Node scripts/product/interpreted-report.mjs @s7Common --output json
& $s7Node scripts/product/interpreted-report.mjs @s7Common --output sections
```

경로는 검증 환경의 예다. 운영자가 실제 Node·checkout·검증 자료의 위치를 지정하며 자료 경로를 고객 요청에 넣지 않는다.

`--generator mock-approved`는 등록된 다른 표현을 로컬 mock으로 고를 뿐 외부 모델을 호출하지 않는다. `--voice dialogue`도 같은 claim을 쓴다. `--audience preview`는 무료 구성 가설의 view이며 인증·유료 권한이 아니다. JSON은 운영자용 전체 근거 모델로, 고객 공개 HTTP의 인가 필터가 아니다.

## import·검증·저장

`loadInterpretedReportService({dataDirectory,profileId})`로 실행 문맥을 한 번 준비한 뒤 `service.calculate(request)`를 호출한다. 이미 발급된 서버 결과가 있다면 `analyzeInterpretedReport(result,{request,profileId})`를 사용하며 M1을 다시 계산하지 않는다. 발급 중 검증은 `validateIssuedInterpretedReport`, 저장 JSON의 내부 재구성 검증은 `validateInterpretedReport`로 구별한다.

저장은 기본 실행에 없다. 별도 `createLocalReportStore` API에 운영자가 관리하는 두 키·actorId·만료·검증기를 명시적으로 주입한다. `validateInterpretedReport(report)`와 `interpretedReportVersions(report)`의 버전 비교를 모두 수행하는 검증기를 사용한다. 저장 키를 이 명령이나 출생 요청·로그에 넣지 않는다. 자세한 계약은 [저장 문서](SPRINT7_STORAGE_CONTRACT.md)에 있다.

1950–61/2027음력·월운 끝2 등 기존 미지원·자료 부족은 그대로다. 역사시 원국 계산과 모든 M3/M5/M7 해석 정책 지원은 별개다. DST gap은 거절하고 fold/입춘/토왕의 불확실성을 보존한다. 새 리포트를 기존 독립v4에 포함했다고 주장하지 않는다. 이번 저장은 가상 사용자·합성 출생정보로 검증하는 로컬 구현이며 운영 인증/DB/결제는 없다.

[정책](SPRINT7_INTERPRETATION_POLICY_V01.md) · [Claim](SPRINT7_CLAIM_GENERATION_CONTRACT.md) · [파이프라인](SPRINT7_NARRATIVE_PIPELINE.md) · [QA](SPRINT7_CONTENT_QA_MATRIX.md) · [실행 기록](../engineering/SPRINT7_EXECUTION_20261121.md)
