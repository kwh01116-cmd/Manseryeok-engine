# E5 목적별 결과와 비교

한 후보의 `features.purposeComparison.result.assessments`에는 `EOKBU`, `CLIMATE`, `PATTERN`, `TONGGUAN`이 있다. 각 항목은 `purpose, policyId, policyVersion, status, candidates, observedPositions, supportingEvidence, opposingEvidence, unresolvedConditions, sourceRefs, factRefs`를 반환한다. 각 목적의 판정 범위는 다음과 같다.

| 목적 | 후보의 뜻 | 미평가 |
|---|---|---|
| EOKBU | 명시적으로 선택한 E1의 기존 후보와 순서 | E1 보류나 미선택에서는 후보가 비어 있음 |
| CLIMATE | 문헌에서 제한한 계절 문맥의 검토 후보 | 실제 한난조습, 충분성 및 조후 전체 적용 |
| PATTERN | 월령 후보의 선택 규칙상 구조 경로 | 성격·파격·구응의 실제 효력과 격국 취용 결정 |
| TONGGUAN | 원국에서 관측한 극 관계의 매개 경로 | 실제 전달·제어 해소와 통관용신 확정 |

`relations`는 억부–조후, 억부–통관, 조후–통관의 후보 오행 포함 관계를 보고한다. 겹치는 오행이 있으면 `SHARED_CANDIDATE_ELEMENT`, 둘 다 후보가 있고 겹치지 않으면 `DISTINCT_CANDIDATE_ELEMENTS`다. 결과가 없으면 양쪽 원래 상태를 함께 기록한다. 오행 차이만으로 충돌을 판정하지 않는다.

억부 후보와 E1 등급이 모두 있고 조후가 후보를 제시한 경우, 기존 E1의 생조 방향 정의로 조후 후보를 검토한다. 예를 들어 신강에서 조후 후보가 비겁이나 인성의 방향이면 `OPPOSING_BALANCE_DIRECTION`을 표시한다. 억부–격국은 기존 E1이 기록한 월령 기준 오행과의 생극 방향을 넘긴다. 방향 관측의 실제 효력은 미평가이며 억부 순위는 바뀌지 않는다.

현재 조후는 검토 오행이 원국에서 관측되지 않은 경우에만 자동 후보를 낸다. E1 억부와 통관의 자동 후보는 각각 원국의 관측 위치가 필요하다. 따라서 조후와 두 목적의 후보가 같은 오행이라는 결과는 이 정책 조합에서 생기지 않는다. 약한 甲에 조후 수와 억부 목이 나오는 경우처럼 후보 오행이 달라도 일간을 돕는 방향은 일치할 수 있다.

격국의 후보에는 오행 추천 대신 `patternRef`와 `patternType`을 넣는다. `finalUsefulGod`, `favorableUnfavorableRanking`은 각각 `NOT_IMPLEMENTED`를 반환한다. 열린 경쟁 경로와 미확정 여부는 각 기능의 원래 판정과 함께 읽는다. [E5 API](ENGINE_E5_API_V01.md)
