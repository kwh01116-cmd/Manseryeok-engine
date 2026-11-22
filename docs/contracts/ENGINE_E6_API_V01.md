# E6 원국과 운의 시점 조회 API

`ENGINE-PARITY-E6-V01/0.1.0` 선택은 불변 원국에 명시 시각의 대운·세운·월운과 관측 관계를 연결한다. 단일 호출은 `AS_OF`, `COMPARE`, `RANGE` 가운데 하나를 선택한다. 출생지 시계는 기존 birth DTO의 정책에서, 조회 시계는 별도 `clockPolicyId`에서 명시한다. 시스템 현재 시각과 호스트 시간대는 조회 기준에 사용하지 않는다.

## 호출

[실행 요청](examples/engine-e6-request-v1.json)은 1992-11-24 00:30의 서울 가상 출생 입력을 2026-03-02 12:00과 03-12 12:00에 비교한다. Node 22와 기존 빌드 결과로 실행한다.

```powershell
node scripts/engine/e6-cli.mjs --data-pack .private/sprint5-20261115/api-only-pack-review-a --request docs/contracts/examples/engine-e6-request-v1.json
```

기존 출생 DTO의 `luckOptions`와 `monthlyOptions`는 E6에서 쓰지 않는다. 대운이 필요하면 `dayun: {traditionalSex, count}`를 따로 지정한다. 입력을 생략하면 대운만 `NEEDS_INPUT`으로 조회된다. 선택형 E1은 기존과 같이 `selection.e5.e3.e2.e1`에서 정한다. [요청 Schema](engine-e6-request-v1.schema.json) · [응답 Schema](engine-e6-result-v1.schema.json)

| 위치 | 제공 결과 |
|---|---|
| `e5` | 같은 출생 입력의 기존 E5 원본. 이전 원국과 분석 정책의 소비 위치 유지 |
| `candidates[i]` | 기존 원국·계절·십성 분류, 목적별 실제 상태와 출처, 각 후보의 시간 조회 |
| `candidates[i].selection` | 현재 모드의 시각·기간별 `timeContextRef` |
| `candidates[i].timeContexts[j]` | 운 발급 또는 보류 상태와 구간, 해당 위치의 십성·십이운성과 관계 |
| `candidates[i].observationSummary` | 선택한 경계 대안 전체에서 관측되는 관계 키와 일부 대안에만 관측되는 키 |
| `candidates[i].comparison` | 두 시점의 양립 가능한 컨텍스트끼리 비교한 변화와 판정 불가 항목 |
| `candidates[i].diagnostics` | E5 통관의 대상·대안·간섭, 조후 적용 범위·기존 요소·선택 상태 |
| `coverage` | 출생 계산, 조회 시계 및 자료, 기능별 정책의 범위 |

신규 projection의 `/e5/…` 참조는 E6 응답을 루트로 해석한다. 내장 E5·E3·E2의 기존 pointer 루트는 각각의 중첩 객체다. 개별 관계의 M2 규칙 ID와 M7 원천 참조는 별도의 근거 ID다. 계산 진입점은 출생 요청과 명시 시각을 받아 내부에서 두 계층을 발급한다. 외부 응답 객체·후보 번호로 발급을 대체할 수 없다.

CLI 종료 0은 제공 가능한 시간 및 원국 결과가 있는 응답이다. 출생 미발급·요청 상한으로 결과 후보가 비면 구조화 응답과 코드 2를, 요청·정책·자료 무결성 오류에는 코드 1을 반환한다. 시간의 일부 자료가 없어도 발급된 원국과 다른 운을 읽을 수 있다.

## 독립 패키지

```powershell
$revision = (git rev-parse HEAD).Trim()
node scripts/engine/build-e6.mjs --source-revision $revision --out ..\.private\engine-e6-code
$code = (Resolve-Path ..\.private\engine-e6-code).Path
$pin = '<빌드 stdout의 manifestSha256>'
$pack = (Resolve-Path .private\sprint5-20261115\api-only-pack-review-a).Path
node "$code\engine.mjs" restore --manifest-sha $pin --out ..\.private\engine-e6-restored --data-pack $pack --data-out ..\.private\engine-e6-data
$restored = (Resolve-Path ..\.private\engine-e6-restored).Path
node "$restored\engine.mjs" run --manifest-sha $pin --data-pack ..\.private\engine-e6-data --request "$restored\docs\contracts\examples\engine-e6-request-v1.json"
```

복원·실행에는 Node 22, 알고 있는 코드 manifest 핀, 승인된 데이터팩 및 요청이 필요하다. 코드와 서버 자료는 별도 저장한다. [시간과 변화분 계약](ENGINE_E6_TIME_AND_DIFF_CONTRACT.md)
