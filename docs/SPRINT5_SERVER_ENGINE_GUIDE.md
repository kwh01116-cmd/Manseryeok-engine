# Sprint 5 — 서버 전용 API-only 엔진 실행

이 경로는 우리의 Node22 서버에서만 자료를 읽고 계산 결과를 반환한다. 고객에게 설치용 달력 데이터팩을 배포하는 승인이나 실제 클라우드 배포가 아니다. [자료팩](contracts/SERVER_API_ONLY_DATA_PACK_V01.md), [서버 DTO](contracts/SERVER_INTEGRATION_DTO_V01.md), [v4 계약](contracts/OFFLINE_SERVER_API_ONLY_V4.md), [실행 기록](engineering/SPRINT5_EXECUTION_20261115.md)을 함께 본다.

## 제작과 독립 복원

제작에는 고정 Node22/TypeScript5.8.3·기존 잠금 의존성·Git이 필요하다. **복원과 실행에는 Node22만 필요**하고 npm/Git/API키/네트워크/원본 저장소 import가 필요 없다. 아래 목적지는 새 경로여야 한다. 출생정보/결과를 기본 파일로 저장하지 않는다.

```powershell
$s5Repo = 'C:\Users\Home\Desktop\만세력 엔진\source'
$s5Node = 'C:\Users\Home\Desktop\Manseryeok-KASI-1950-2026-windows-x64\Manseryeok-KASI-1950-2026\runtime\node.exe'
Set-Location -LiteralPath $s5Repo
$s5Engine = Join-Path $s5Repo '.private\sprint5-example\engine'
$s5Pack = Join-Path $s5Repo '.private\sprint5-20261115\api-only-pack-review-a'
& $s5Node scripts/offline/build-v4.mjs --out $s5Engine
& $s5Node "$s5Engine\verify.mjs" --artifact $s5Engine --data-pack $s5Pack

$s5OsTemp = Join-Path ([Environment]::GetFolderPath('LocalApplicationData')) 'Temp'
$s5Outside = Join-Path $s5OsTemp ('manseryeok-s5-' + [Guid]::NewGuid().ToString('N'))
$s5Restored = Join-Path $s5Outside 'engine'
$s5RestoredPack = Join-Path $s5Outside '.private\api-only-data'
& $s5Node "$s5Engine\restore.mjs" --artifact $s5Engine --out $s5Restored --data-pack $s5Pack --data-out $s5RestoredPack
Set-Location -LiteralPath $s5Outside
& $s5Node "$s5Restored\verify.mjs" --artifact $s5Restored --data-pack $s5RestoredPack
```

자료팩 재제작이 필요한 경우에만 저장소에서 실행한다. 실제 성공 응답을 재사용하며 API를 호출하지 않는다. 원본은 수정하지 않는다.

```powershell
Set-Location -LiteralPath $s5Repo
& $s5Node scripts/server-data/build.mjs --archive '.private/kasi-local-1950-2026/monthly-xml' --candidate '.private/kasi-research-1950-2026-fe84ab4-a' --boundary '.private/kasi-2027-boundary-00379e9-20261111-b' --out '.private/sprint5-example/new-api-only-data'
```

## 실제 요청 형식

아래는 DST의 기록 민간시를 표준KST로 환산해 네 자시 정책을 적용하는 명시적 가상 입력이다. 양력 환산1987-06-01 00:30은 표준1987-05-31 23:30을 일시주 참조로 사용한다. 진태양시 보정이 아니다.

```powershell
$s5Request = @{
  schemaVersion = 'manseryeok-server-analysis-request-v1'
  analysisProfileId = 'KASI-SERVER-API-ONLY-ANALYSIS-V01'
  calendarProfileId = 'kasi-api-1987-1988-dst-local-v1'
  jurisdiction = 'KR'; timeZone = 'Asia/Seoul'
  calendar = 'GREGORIAN'; date = '1987-06-01'; time = '00:30'
  policies = @{
    clockPolicyId = 'KR_API_PUBLISHED_KST_DST_1987_1988_STANDARD_REFERENCE_V1'
    dayRollover = 'CIVIL_MIDNIGHT'; hourStemReference = 'SELECTED_DAY_PILLAR'
    dayHourReference = 'STANDARD_KST'
  }
} | ConvertTo-Json -Depth 10 -Compress
& $s5Node "$s5Restored\run.mjs" --data-pack $s5RestoredPack --request-json $s5Request --output json --detail summary
& $s5Node "$s5Restored\run.mjs" --data-pack $s5RestoredPack --request-json $s5Request --output text --detail summary
```

음력은 `calendar='KOREAN_LUNAR'`, `lunarDate=@{lunarYear=1987;lunarMonth=5;lunarDay=5;leap=$false}` 형태로 쓰고 `date`를 제거한다. 시각 미상은 `time=$null`로 명시한다. 반복 시각1988-10-09 02:30은 추가 정보가 없으면 AMBIGUOUS_TIME이며 원국0이다. 근거 있는 선택이 있으면 policies에 `foldOffsetMinutes=540` 또는600을 주고 원래의 두 시간 대응을 계속 보존한다. 없는 시각1988-05-08 02:30은 NONEXISTENT_TIME이다.

기존 현대 입력은 `calendarProfileId='kasi-api-1989-2026-local-v1'`, clock `KR_API_PUBLISHED_KST_MODERN_1988_POST_DST_V1`을 선택하고 DST 전용 필드를 제거한다. 안정역사와2027양력은 [서버 계약의 범위표](contracts/SERVER_INTEGRATION_DTO_V01.md)를 따른다. M5의 제한적 정책은 현대 프로필에서 실제 실행되고 다른 새 시계 범위에서는 의존 정책을 확대하지 않아 보류한다.

## 2027 결손 수집 계획

```powershell
Set-Location -LiteralPath $s5Repo
& $s5Node scripts/kasi/plan-sprint5-completion.mjs --mode dry-run --output json
```

이 명령은 stdout만 출력하고 키/HTTP에 접근하지 않는다. 실제 수집은 [13시도 계획](research/SPRINT5_MISSING_DATA_COLLECTION_PLAN.md)의 별도 승인이 필요하다. 승인/자료 수락 전에는2027음력과2027월운 끝2구간을 완료로 표시하지 않는다. `--mode execute`는 현재 거절한다.

## 실제 수락본

최종 실행 코드 `a0bb716e4a496135c205f7f360179b8735dd219c`에서 965/965·M2·Lab/KASI·두 시간대 실제 자료·저장소 밖 v4를 검사했다. 실제 엔진은 `.private/sprint5-20261115/final-a0bb716/engine`, 자료는 `.private/sprint5-20261115/api-only-pack-review-a`다. 엔진 manifest SHA는 `c63ce817fd85c6711d72e4b04b2fa700802c2f489187b1cc42ad97859e4383b3`, 자료 content pin은 `a2bfbf35aff7bb8b11aef277a7be8d5ea5204c786a9142649bec23d27dfd289a`이다. 상세 성공/보류/거절 수와 단위는 [실행 기록](engineering/SPRINT5_EXECUTION_20261115.md)에 있다. 이 자료는 서버 내 조건부 사용용이며 고객 파일 배포/공개 서비스는 승인하지 않았다. 2027 음력·월운 마지막 2개 구간은 여전히 자료 미확보 상태다.
