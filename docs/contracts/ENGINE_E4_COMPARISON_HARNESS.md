# E4 엔진 비교 도구와 결과 계약

`E4-ENGINE-COMPARISON-V01/0.1.0`은 개발 감사용이다. 명시한 로컬 데이터팩과 발급된 E3 결과를 사용한다. 비교 사례의 서술·값은 외부 출처를 확인한 사람이 고정한다. 런타임에서 외부 사이트를 읽거나 문자열로부터 생조·격국의 판정을 유추하지 않는다. 외부 네 기둥의 직접 검토는 순수 분류·강약 산술에만 사용한다. 출생 원국이나 E3 근거 객체로 재발급하는 인터페이스는 제공하지 않는다.

## 실행

저장소 루트에서 Node 22 및 기존 빌드 생성물로 실행한다. 각 실행의 JSON은 표준 출력에 한 줄로 나간다.

```powershell
$pack = '.private/sprint5-20261115/api-only-pack-review-a'
node scripts/engine/e4-comparison-cli.mjs --data-pack $pack --corpus test/fixtures/e4-commercial-cases-v1.json
node scripts/engine/e4-comparison-cli.mjs --data-pack $pack --birth-policy-request docs/contracts/examples/engine-e4-birth-policy-request-v1.json
```

`--corpus`는 고정 참조를 재생한다. `--birth-policy-request`는 두 개의 기존 E3 birth DTO를 비교한다. 각각 소스·시각 선택·달력 및 E3 버전을 명시하며 호스트 시간대는 출생지 설정으로 쓰이지 않는다. 입력 내용 해시 `requestSha256`는 줄바꿈을 포함한 실제 입력 파일 바이트를 식별한다. 잘못된 계약·정책·자료는 종료 코드 1을 반환한다. 정상적으로 비교 불가능한 필드는 JSON에 표시한다. [자시 전환 예제](examples/engine-e4-birth-policy-request-v1.json) · [공개 사례 fixture](../../test/fixtures/e4-commercial-cases-v1.json)

## 외부 출처 사례 계약

`engine-comparison-commercial-corpus-v1`의 각 `cases[]`에는 고유 `caseId`, `source`(provider, HTTPS url, checkedAt, referenceKind), `input.pillars`(년월일시 순)와 공개 출생 정보가 있으면 `input.birth`를 둔다. 기존 달력·시계 프로필을 원할 경우 `profileId`와 `policies`로 명시한다. 서울/한국으로 표기된 1989–2026 양력 요청에만 생시 현대 KST 기본 비교를 적용한다. 출처 정보를 확인할 수 없는 레코드에는 `INSUFFICIENT_REFERENCE`가 남는다. 링크는 근거 위치이며 그 링크의 내용은 수동으로 확인한다.

`external`에는 출판물에서 확인한 값만 기록한다. 네 기둥과 구조를 대조할 때 보고한 글자와 현지 계산에서 일치한 후보 하나를 사용한다. 공개 네 기둥만 있으면 역법 비교를 보류하고 그 문자 구조를 검사할 수 있다. 입춘 후보가 여러 개인 경우 일치한 후보가 한 개일 때에도 다른 후보를 보존한다.

- `elements`는 **표면 천간과 지지 대표 오행 8개**의 단순 개수에만 쓴다. 생조 점수, 지장간 배분, 보정 비율은 별개다.
- `visibleTenGods`, `hiddenStems`, `twelveGrowth`는 년월일시 순이며 null인 위치는 집계에서 제외한다. 지장간 배열은 확인한 구성원 집합으로 비교한다. 본기 순서와 실제 효력은 별도 근거가 필요하다.
- `relations`는 공개가 주장한 관계에만 쓰며 외부에 표시되지 않은 관계를 외부 누락으로 세지 않는다. 키 예시는 `STEM_COMBINATION:year:day:乙庚`, `SANHE_PARTIAL:year:month:亥卯`이다.
- `strength`의 `direction`은 출처의 등급을 사람이 명시적으로 매핑한 값이다. 같은 방향과 반대 방향, 내부 경계를 각각 표시한다. 점수는 분모·척도와 함께 보존한다. 수치의 차를 동등 척도 차이로 사용할 수 없다.
- `yongshin`은 선택 목적이 EOKBU로 일치할 때 후보 오행 집합을 확인한다. `pattern`은 월령 구조 후보를 공개한 경우 그 범위만 비교한다. 성립 판정은 월령 후보와 별개의 필드다.
- `externalPolicyKnownFields.differenceEvidence[field]`의 `ref`는 `evidenceRefs`에 등록된 근거로 연결한다. 네 기둥 차이의 정책 귀속에는 공개 기준을 따른 대체 `internalPillars`와 실제 유일한 로컬 계산의 일치가 필요하다.

## 출력

외부 모드는 `engine-e4-comparison-result-v1`의 `totals`를 필드×분류로 집계한다. `cases[]`에 입력, 출처, 내부·확인된 외부 정책, 후보 정렬, `comparableFields`, `matchedFacts`, `differences`, `unresolvedDifferences`, `suspectedDefects`, `evidenceRefs`, `conclusion`이 있다. E1 산출량과 기본·비교 계산이 어긋나면 독립 정수 산술의 비교값도 남긴다.

| 분류 | 의미 |
|---|---|
| MATCH | 정의와 입력이 맞는 관측 범위에서 값이 일치 |
| IMPLEMENTATION_DEFECT | 고정 E1 정책에 대한 독립 정수 계산과 실행이 불일치하거나 같은 로컬 정책·입력이 다른 후보 집합을 재현 |
| POLICY_DIFFERENCE | 필드 수준 근거가 있고 확인된 정책 선택 또는 공개 대안이 관측 차이를 설명 |
| UNEXPLAINED_DISAGREEMENT | 비교한 관측값은 차이가 있고 정확한 원인의 확인 범위가 부족 |
| NOT_COMPARABLE | 목적·평가 범위·원국·기준이 일치하지 않거나 로컬 계산에서 필요한 값이 부재 |
| INSUFFICIENT_REFERENCE | 참고 기록은 있지만 출처·기준·비교 대상이 불충분 |
| NO_REFERENCE | 외부에서 해당 필드를 확인한 값이 없음 |

출생 정책 모드의 `engine-e4-birth-policy-comparison-v1`은 비교 결과의 좌우를 별개 요청으로 보존한다. 같은 양력 환산 생시가 확인된 경우에만 후보 집합을 비교하며 서로 다른 원국의 ordinal이나 증거를 붙여 쓰지 않는다. 원국 안의 계절 대안도 따로 보존한다. 정량·정성 탐침 상세는 [강약 감사](../research/ENGINE_E4_STRENGTH_DISAGREEMENT_AUDIT.md)에 있다.

이 도구는 개발 감사 경로다. 새 서비스용 판단 정책이나 런타임 기능 선택을 노출하지 않는다. 독립 배포 경로는 기존 E3 패키지를 다시 복원해 검증한다.
