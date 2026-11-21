# ENGINE-PARITY-TRACK-V1 · E1 엔진 계약

`ENGINE-PARITY-E1-V01 / 0.1.0`은 내부 오프라인 엔진 호출자가 명시적으로 선택한다. 출생 요청은 기존 `manseryeok-server-analysis-request-v1` 그대로다. `selection`은 프로필·버전·강약·억부·내격 ID가 모두 일치해야 한다. 하위 정책을 빠뜨리거나 바꾼 입력을 거절한다. [복사할 수 있는 전체 JSON 입력](examples/engine-e1-request-v1.json)

## 입력과 결과

- [API](../../scripts/engine/e1.mjs)의 `loadEngineE1({dataDirectory})`로 발급받은 엔진의 `calculate(birth,selection)`을 호출한다. 코드에서 명시적으로 `E1_SELECTION`을 넘길 수 있다. 이미 발급된 같은 프로세스의 기존 결과는 `projectEngineE1(existing,selection)`으로 투영한다. 이 경로는 생년월일을 다시 계산하지 않는다. 기존 서버를 직접 쓰는 호출자에게 새 필드를 추가하지 않는다.
- `manseryeok-engine-e1-result-v1.existing`은 기존 요청·달력 정책·데이터팩 버전과 지문·계산·M2~M7·기존 HOLD와 조건부 결과를 보존한다. JSON은 추적할 수 있는 출력이다. 파일에서 읽은 JSON으로 발급 영수증을 복원하지 않는다.
- `candidates[]`는 실제 원국 하나당 한 항목이다. `candidateRef, pillars, pillarFactRefs, strengthAssessment, eokbuCandidate, pattern, climate, seasonalEvidenceRef`를 제공한다. `factReferenceBase`에서 각 `facts.candidates[i]...` 경로를 열 수 있다. 가중 위치마다 발급된 M2의 십성과 장간 멤버, 관계 참조의 부모를 확인한다. M4와 기존 M5에는 같은 M2·M3 문맥의 발급 검사를 적용한다.
- `selection`과 `policyVersions`는 실행 버전을 고정한다. 강약의 단위 100은 사용자 기준 1점이다. 전체 예산은 10,000단위이다. `BORDERLINE`은 미리 정한 경계 구간이다. `SENSITIVE_TO_POLICY`는 공개한 국소 변형에서 강약 **등급**이 한 번이라도 바뀐 경우이다. 후보 순위 전체의 강건성을 인증하지 않는다.
- 억부의 `primary`는 단독 우선 후보가 나올 때만 채운다. 공동 원인이 서로 다른 후보를 지명하면 `candidates`에 함께 남기고 단독 순위는 비운다. `alternatives`에는 각 대안의 원국 관측 수준이 있다. `climateComparison`은 기존 온기 후보·보류·역사시 미발급을 구별한다. `patternHandoff`는 다음 격국 연구를 위한 본기·투출·경쟁 참조다. 격국 목적·통관 목적의 용신, 최종 희기 순위에는 실행 규칙이 없다.
- 출생시각 미상, DST 결손·미해소 중복, 2027 음력 자료 부족 등은 기존 `status`와 `holds`를 유지하며 새 점수를 생성하지 않는다. 표시 분에 연월주가 바뀌면 기존의 상관된 원국 후보를 따로 평가한다. 계절만 다른 토왕 경계는 같은 원국 한 곳을 참조한다. 역사시의 계산 가능 원국에는 같은 E1 구조 평가를 적용하되 기존 M5·M7의 시계 적용 범위는 그대로 따른다.

## 개발 PC에서 JSON 받기

저장소 루트에서 Node 22로 실행한다. `--request`는 위 예시처럼 명시적 달력·시계·자시 정책을 포함한 UTF-8 JSON 파일이다. 표준 출력에는 JSON 1개가 나온다. 정상 계산 종료값은 0, 기존 엔진에 따른 제공 보류는 2, 입력·지문·버전 오류는 1이다. API 키·외부 계산 서버·시간대 추정이 필요하지 않다.

```powershell
$node22 = 'C:\Users\Home\Desktop\Manseryeok-KASI-1950-2026-windows-x64\Manseryeok-KASI-1950-2026\runtime\node.exe'
$pack = '.private/sprint5-20261115/api-only-pack-review-a'
$request = 'docs/contracts/examples/engine-e1-request-v1.json'
& $node22 node_modules/typescript/bin/tsc -p tsconfig.json
& $node22 node_modules/typescript/bin/tsc -p tsconfig.kasi.json
$e1 = & $node22 scripts/engine/e1-cli.mjs --data-pack $pack --request $request | ConvertFrom-Json
$e1.candidates[0].strengthAssessment | Select-Object grade, score, specialReview
$e1.candidates[0].eokbuCandidate | Select-Object status, primary, holdReasons, climateComparison
```

## 독립 실행·복원

빌드는 기존 서버 엔진 v4의 파일을 새 `core/`에 만든 뒤, 고정 TypeScript로 새 E1 코드를 컴파일한다. 공통 모듈은 같은 파일 인스턴스로 연결해 발급 검증을 보존한다. 엔진 안에는 달력 데이터를 넣지 않는다. manifest 외부에서 받은 신뢰 지문으로 파일 집합과 바이트를 확인한다. 전용 API-only 팩은 별도로 검증하고 새 비공개 경로에만 복원할 수 있다. 원본 엔진 파일 및 데이터 디렉터리를 덮어쓰지 않는다.

```powershell
$artifact = '.private/engine-e1-build-' + [Guid]::NewGuid().ToString('N')
$receipt = & $node22 scripts/engine/build-e1.mjs --out $artifact | ConvertFrom-Json
$outside = Join-Path ([IO.Path]::GetTempPath()) ('manseryeok-e1-' + [Guid]::NewGuid().ToString('N'))
$engine = Join-Path $outside 'engine'
$data = Join-Path $outside '.private/pack'
& $node22 "$artifact/engine.mjs" restore --manifest-sha $receipt.manifestSha256 --out $engine --data-pack $pack --data-out $data
& $node22 "$engine/engine.mjs" verify --manifest-sha $receipt.manifestSha256
& $node22 "$engine/engine.mjs" run --manifest-sha $receipt.manifestSha256 --data-pack $data --request "$engine/docs/contracts/examples/engine-e1-request-v1.json"
```

다른 기기에 옮길 때 운영자가 배포 경로와 별도로 고정한 manifest 지문과 신뢰하는 부트스트랩을 사용한다. 위 예시의 임시 경로는 로컬 검증용이다. 고객에게 데이터팩을 배포할 권리와 공개 출시 결정은 별도다.
