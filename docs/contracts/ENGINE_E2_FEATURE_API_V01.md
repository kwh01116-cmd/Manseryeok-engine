# ENGINE-PARITY-TRACK-V1 · E2 기능 투영 v0.1.0

서버에서 원국 하나를 계산하고 같은 출생 요청의 후보별 결과를 읽는다. 기존 서버 DTO는 `existing`에 보관한다. 기존 서버나 E1을 직접 호출하는 소비자에게 E2 선택은 전파되지 않는다.

## 호출

Node 22에서 `scripts/engine/e2.mjs`의 `loadEngineE2({dataDirectory})`를 한 번 호출한 후 `engine.calculate(birth,selection)`을 사용한다. 입력과 정책 ID의 전체 예시는 [실행 요청](examples/engine-e2-request-v1.json)에 있다. 서버 전용 API-only 데이터팩이 별도 필요하다.

```powershell
node scripts/engine/e2-cli.mjs --request docs/contracts/examples/engine-e2-request-v1.json --data-pack .private/sprint5-20261115/api-only-pack-review-a
```

성공한 계산은 종료 코드 0, 지원 범위·자료·벽시계 문제로 원국이 없는 정상 응답은 2와 구조화 JSON, 잘못된 정책·요청·데이터팩은 1이다. `birth`에는 달력, 시계, 자시 선택을 명시한다. 연운·월운 조회일과 전통 대운의 성별·개수는 선택 입력이다. 명목 교운 투영을 요청할 때는 해당 M7 투영 정책도 선택한다. 생략한 정보는 현재 날짜나 임의 성별로 채우지 않는다.

## 읽는 순서

1. `status`, `existing.holds`, `candidates.length`로 원국 산출 가능 여부를 읽는다. 없는 DST 시각과 두 UTC 대응이 있는 시각은 서로 다른 원인이다. 원국이 없으면 `unavailableFeatures`가 각 기능의 사유를 제공한다.
2. 원국이 있으면 `candidates[i].candidateRef`로 부모를 식별하고 `candidates[i].features[key]`를 읽는다. 입춘 분의 원국 후보와 한 원국 안의 계절 대안은 다른 차원이다.
3. 각 기능은 `featureId,availability,policyId,policyVersion,result,factRefs,limitationCodes`를 반환한다. `factRefs`는 이 응답 루트 기준 JSON Pointer다. 상세 결과 안의 기존 식별자와 원국별 fact ID는 원래 모듈 규약을 따른다. ID가 같은 ordinal은 다른 응답을 결합할 키가 아니다.
4. `availability`는 표시·처리 상태다. AVAILABLE은 해당 정책의 계산 가능, PARTIAL은 부분 자료·공동 후보·구조 검토, HOLD는 적용한 규칙의 판단 보류, NEEDS_INPUT은 추가 사용자 입력, NEEDS_DATA는 달력 근거 부족, POLICY_UNRESOLVED는 정책 범위 보류다. INVALID_INPUT은 성립하지 않는 출생 시각, NOT_SELECTED는 선택형 E1 생략을 뜻한다. NOT_IMPLEMENTED는 별도로 열거한 미구현 목적에 사용한다. 계산된 신살의 NOT_PRESENT는 정상 판정이다.
5. `selection.e1`을 생략하면 E1 점수·억부 후보가 제공되지 않는다. 선택시 개인별 근거와 민감도가 동일한 원국에 귀속된다. 지장간의 E1 배분도 이때만 표시한다.

| key | 결과와 해석 범위 |
|---|---|
| chart, elementsTenGods | 네 기둥, 월경계·계절 판단, 기둥별 표면 십성과 오행 |
| hiddenStems | 대표 오행과 본기·기타 장간, 각 십성, 일간 근 일치와 표면 천간 일치 |
| twelveStages | 일간 기준 네 지지와 요청한 운 지지의 십이운성. 신강 점수에 미가산 |
| relations | 위치별 천간 오합, 지지 관계와 삼합·삼회 구성원. 작용은 미평가 |
| gongmang, sinsal | 일주 기준 공망, 선택한 연지·일지 기준 신살과 일간 기준 귀인·양인 |
| daeun, seyun, monthly | 방향·이전/다음 절입·간격·대운열, 선택시 명목 교운 경계, 세운 및 월운. 미완성 구간은 원래 상태를 유지 |
| strength, eokbu | E1 계수로 산출한 등급과 원인별 억부 후보. 경계와 특수 검토는 별도 상태 |
| climate | 기존 M5 겨울 목 온기 목적. 억부와 별도 |
| pattern, patternReview | 기존 내격 8종과 월령 경쟁, 같은 위치를 공유하는 3종 배치의 전제, 정관 세부 검토, 선택시 E1과 격국 월령의 방향 차이 |

`hiddenStems.result[j].members[k].e1Contribution`의 units는 원국 전체 10,000단위 중 해당 위치에 배분된 정수다. 100단위가 정책 점수 1점에 해당한다. 분류 표와 실제 근력은 별도다.

`selection.sinsal.branchReference`는 YEAR, DAY, BOTH 중 하나다. BOTH는 양쪽의 결과를 독립된 행으로 반환한다. 지지 기준은 기준 자리 자체를 제외하고 일간 기준 신살은 네 지지를 모두 검사한다. `unimplementedFeatures`에는 종합 용신, 희기신 순위, 격국·통관 목적 용신의 별도 기능 상태가 있다.
