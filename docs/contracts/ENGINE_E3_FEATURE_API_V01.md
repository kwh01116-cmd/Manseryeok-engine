# E3 원국 격국 조건 엔진 v0.1.0

`ENGINE-PARITY-E3-V01` 선택은 같은 출생 요청으로 계산한 E2 응답에 격국 조건 평가를 연결한다. `e2`는 기존 응답 전체다. `candidates[i].candidateRef`는 `e2.candidates[i].candidateRef`와 같다. 두 응답의 동일 ordinal은 서로 다른 출생 요청을 연결하는 키로 사용할 수 없다.

```powershell
node scripts/engine/e3-cli.mjs --data-pack .private/sprint5-20261115/api-only-pack-review-a --request docs/contracts/examples/engine-e3-request-v1.json
```

Node 22의 예시 입력은 역법·신살·격국 규칙과 선택형 E1을 명시한다. E1을 생략하려면 요청의 `selection.e2.e1` 속성을 제거한다. E1이 필요한 규칙은 해당 등급 조건을 UNKNOWN으로 평가한다. 날짜·자료·시계 문제로 원국을 발급하지 않으면 E2 상태가 `unavailableFeatures.patternRules`에 전달되고 CLI는 코드 2를 반환한다. 유효한 원국의 선택 규칙 평가를 포함한 JSON은 코드 0, 잘못된 정책 번들·파일·입력 계약은 코드 1을 반환한다. [전체 요청 예시](examples/engine-e3-request-v1.json)

## 결과를 읽는 위치

| 경로 | 의미 |
|---|---|
| `e2` | 같은 프로세스에서 기존 계산기가 발급한 원국·후보·기존 분석 |
| `candidates[i].features.patternRules` | 기존 wrapper와 동일한 기능 식별자, 버전, 제공 상태, 결과, JSON Pointer 근거 경로, 제약 코드 |
| `candidates[i].features.patternRules.result.rules` | 성립·방해·구제 규칙별 대상, 적용 범위, 위치와 전파 가능한 조건 및 출처 |
| `…result.competition` | 동시에 고려할 후보와 경로. 상위 상태는 우선순위를 대신 정하지 않는다 |
| `…result.sensitivity` | 사전 고정 E1 등급 모형의 민감도에서 어떤 E3 조건·상태가 달라졌는지 비교 |
| `…result.eokbuDiagnostic` | 기존 억부 후보와 월령의 관측 방향. 억부 순위와 격국 규칙 평가를 별개로 유지 |
| `unavailableFeatures.patternRules` | 원국 이전 단계 실패의 근거·자료·정책 사유 |

`RULE_SATISFIED`는 해당 정책 버전의 전제 및 예외 처리에 부합했다는 뜻이다. `NOT_TRIGGERED`는 평가 가능한 필수 조건이 거짓, `UNRESOLVED`는 결론에 필요한 조건이 미확정, `OUT_OF_SCOPE`는 규칙의 대상이 아님을 뜻한다. 서로 다른 후보나 경로가 겨루는 경우 상위 `COMPETING_RULES`가 각각의 판정을 보존한다. 경쟁이 없는 경우에도 상위 `RULE_SATISFIED`는 방해 규칙을 포함한 규칙 중 하나 이상이 충족됐다는 뜻이다. 성립·방해·구제의 구별은 규칙의 `target`에서 읽는다.

각 `rules[j].paths[k].conditions[l].value`는 TRUE·FALSE·UNKNOWN이다. 규칙 행의 `conditions`는 경로별 값이 갈리면 `VARIES_BY_PATH`를 표시한다. 규칙 또는 경쟁 경로가 남아 있어도 원국과 기존 E2 기능 결과를 조회할 수 있다. 실질 효력의 판단 범위는 각 규칙 문서와 `limitationCodes`를 따른다.

wrapper의 `factRefs`는 E3 응답 루트에 있는 JSON Pointer다. 규칙 아래의 참조는 그 후보에 대한 M2·M3·M4·E1 원래 식별자다. 이 경로는 검산에 쓸 수 있으며 외부 JSON을 발급된 입력으로 바꾸는 인터페이스는 제공하지 않는다. 격국 분석과 억부·조후 결과는 모두 원래 권한 및 적용 범위를 유지한다. [선택 규칙 및 출처](../research/ENGINE_E3_PATTERN_RULES_V01.md)

## 독립 패키지

소스 변경이 없는 고정 커밋에서 Node 22와 저장소에 설치된 고정 TypeScript 버전으로 코드 패키지를 빌드한다. 새 디렉터리 경로를 지정하고 표준 출력의 `manifestSha256`을 운영자가 보관한다.

```powershell
$revision = (git rev-parse HEAD).Trim()
node scripts/engine/build-e3.mjs --source-revision $revision --out ..\.private\engine-e3-code
```

다음 명령에는 Node 22와 로컬 코드·데이터만 필요하다. 서버 전용 데이터팩의 복원 대상은 새 `.private` 경로다. `$pin`에는 별도로 보관한 manifest SHA-256을 넣는다.

```powershell
$code = (Resolve-Path ..\.private\engine-e3-code).Path
$pack = (Resolve-Path .private\sprint5-20261115\api-only-pack-review-a).Path
$pin = '<manifestSha256>'
node "$code\engine.mjs" verify --manifest-sha $pin
node "$code\engine.mjs" restore --manifest-sha $pin --out ..\.private\engine-e3-restored `
  --data-pack $pack --data-out ..\.private\engine-e3-server-data
$restored = (Resolve-Path ..\.private\engine-e3-restored).Path
node "$restored\engine.mjs" run --manifest-sha $pin --data-pack ..\.private\engine-e3-server-data `
  --request "$restored\docs\contracts\examples\engine-e3-request-v1.json"
```

코드 패키지의 manifest는 원본 커밋, E2 하위 패키지, 실행 파일, 문서와 허용 자료팩의 지문을 기록한다. 별도 발급된 서버 데이터팩을 로더에서 확인한다.
