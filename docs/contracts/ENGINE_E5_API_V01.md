# E5 선택형 목적별 분석 API

`ENGINE-PARITY-E5-V01/0.1.0`은 발급된 E3 전체 응답을 그대로 중첩하고, 같은 원국 후보에 격국 조건 v2, 조후 v2, 통관의 구조 후보와 목적별 비교를 추가한다. 기존 E3 호출은 그대로 사용할 수 있다.

## 단일 호출

실행 입력은 [실제 계산에 사용한 요청](examples/engine-e5-request-v1.json)에 있다. 소스 환경에서는 기존 Node 22 빌드 뒤 실행한다.

```powershell
node scripts/engine/e5-cli.mjs --data-pack .private/sprint5-20261115/api-only-pack-review-a --request docs/contracts/examples/engine-e5-request-v1.json
```

`schemaVersion`은 `manseryeok-engine-e5-request-v1`이다. `birth`는 기존 서버 출생 DTO를 사용한다. `selection`에 E5의 정확한 정책과 버전, 기존 E3 전체 선택을 넣는다. 선택 번들의 `e3.e2.e1`을 생략하면 억부가 `NOT_SELECTED`다. 공통 파일 오류, 정책 오류 또는 외부 후보 객체 입력은 종료 1, 출생 자료·시각으로 원국 미발급은 JSON과 종료 2로 구분한다. 정상 원국 계산에서 일부 기능이 보류돼도 종료 0이다.

## 결과 경로

| JSON 위치 | 읽는 내용 |
|---|---|
| `e3` | 기존 E3 전체. E2·E1 및 기본 M1~M7은 이 응답 안의 기존 위치에서 조회 |
| `candidates[i].features.patternAssessmentV2.result` | 동일 후보의 E3 규칙 상태·격국 관측·경로 가능성·효력 미확정 |
| `candidates[i].features.climateAssessmentV2.result` | 실제 일간·월령, 표면·장간 위치, 온습 후보·보류 및 계절 대안 |
| `candidates[i].features.tongguanAssessment.result` | 상극 쌍과 매개 요소, 경로의 실제 위치 및 경합 조건 |
| `candidates[i].features.purposeComparison.result` | 억부·조후·격국·통관의 독립 결과와 목적 간 비교 |
| `unavailableFeatures` | 원국을 발급하지 못한 경우 기존 자료·시계·입력 보류의 전달 |

각 기능은 E3와 같은 `featureId/availability/policyId/policyVersion/result/factRefs/limitationCodes` wrapper다. wrapper의 `factRefs`는 **E5 응답 루트**의 JSON Pointer다. 내부의 `e3`은 원래 계약을 보존하므로 내부 pointer는 그 객체를 루트로 해석한다. 결과 안의 개별 위치 참조는 원래 M2·M3·M4의 후보 단위 식별자다. 같은 ordinal이나 문자열만으로 다른 요청을 서로 결합할 수 없다. 실행 함수에는 출생 요청을 제공하고 결과물 JSON으로 원국 발급을 대체하는 경로는 두지 않았다.

동분 입춘의 후보는 각각 평가한다. 계절 대안은 원국 ID를 그대로 둔 채 해당 부모 안에 보존한다. [목적별 상태와 판독 규칙](ENGINE_E5_PURPOSE_ASSESSMENT_CONTRACT.md)

묶음 예제의 실제 `candidates[0].features.purposeComparison.result.relations[1]`은 아래처럼 억부와 통관이 검토하는 오행을 따로 돌려준다. `sourceCatalog.climate`에서 조후의 출처 ID를 조회할 수 있다.

```json
{
  "left": "EOKBU",
  "right": "TONGGUAN",
  "status": "DISTINCT_CANDIDATE_ELEMENTS",
  "leftElements": ["WATER", "METAL"],
  "rightElements": ["FIRE"],
  "sharedElements": [],
  "samePurpose": false
}
```

## 독립 실행

빌드는 깨끗한 고정 커밋에서 수행한다. 운영자가 출력된 manifest SHA-256을 코드 패키지와 별도로 보관한다. 복원 데이터 대상 경로에는 기존 내부 이용 계약에 맞게 새 `.private` 디렉터리를 지정한다.

```powershell
$revision = (git rev-parse HEAD).Trim()
node scripts/engine/build-e5.mjs --source-revision $revision --out ..\.private\engine-e5-code
$code = (Resolve-Path ..\.private\engine-e5-code).Path
$pack = (Resolve-Path .private\sprint5-20261115\api-only-pack-review-a).Path
$pin = '<빌드 stdout의 manifestSha256>'
node "$code\engine.mjs" restore --manifest-sha $pin --out ..\.private\engine-e5-restored --data-pack $pack --data-out ..\.private\engine-e5-server-data
$restored = (Resolve-Path ..\.private\engine-e5-restored).Path
node "$restored\engine.mjs" run --manifest-sha $pin --data-pack ..\.private\engine-e5-server-data --request "$restored\docs\contracts\examples\engine-e5-request-v1.json"
```

복원과 실행에는 Node 22, 고정된 코드 패키지와 허용 데이터팩만 필요하다. 하위 E3 manifest의 소스·상태·자료팩 지문도 확인한다. E3와 E5가 같은 발급 모듈을 쓰도록 빌더는 기존 런타임 모듈을 중첩 원본으로 연결한다.
