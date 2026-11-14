# 로컬 오프라인 분석 결과 계약 v1

Sprint 1은 기존 DTO를 변경하지 않고 오프라인 실행에만 `{schemaVersion:"manseryeok-offline-result-v1", mode, data}`를 붙인다. `data`는 같은 선택·입력·자료로 기존 로컬 함수를 호출한 결과 전체다. `mode`는 `chart`, `explain`, `evidence`, `experimental` 중 명시한 값이다. 오류는 성공 DTO로 채우지 않는다.

## 소비자가 유지할 최소 경로

`m1`은 chart 모드의 `data` 자체, explain/evidence의 `data.m1`, experimental의 `data.existing.m1`이다. `analysis`는 evidence의 `data`, experimental의 `data.existing`이다.

| 의미 | 기존 경로 | 계약 |
| --- | --- | --- |
| 계산 프로필·버전 | `m1.profile` | 명시적으로 선택한 원래 프로필 전체 보존 |
| 데이터·manifest | `m1.dataset` | `id`, `candidateManifestContentSha256` 및 원래 자료 메타데이터 보존 |
| 입력과 환산 날짜 | `m1.input` | 달력 종류와 `gregorianDate`, 필수 기록 시각 `time`; 자시의 유효 일주 날짜와 구별 |
| 계산 정책 | `m1.policies` | clock/dayRollover/hourStemReference/boundary의 ID·버전 보존 |
| 네 기둥·상관 후보 | `m1.chart.candidates` | 원래 순서와 후보 집합 보존; 표시 분에서 첫 후보를 자동 선택하지 않음 |
| 계산 근거·한계 | `m1.evidence`, `m1.limits` | 적용 절입·날짜 변환 출처와 분 정밀도·권리 미확인 한계 보존 |
| 후보 참조·M2 | `data.facts` 또는 `data.existing.facts` | `candidates[i].id = chart.candidates[i]`; 네 위치 및 fact/rule/source 참조 보존 |
| 분석 정책·상태 | `analysis.provenance`, 각 선택 모듈의 policy/profile/status | 구조 근거, 계절, 통근, 합 제한, 종합·격국을 하나의 확정 상태로 합치지 않음 |
| 미확정 조건 | 각 선택 모듈의 unresolved/limitations·결론별 사유, `analysis.validation` | 미선택은 생략; 미정·범위 밖·자료 부족을 점수0이나 부재로 치환하지 않음 |
| 실험 정책 | `data.policy`, `data.experimental[i]` | policyId/policyVersion/sourceRefs/assumptions/inputFacts/decisionTrace/alternatives/limitations 보존 |

후보 ID와 factRefs는 **해당 결과 안의 상대 참조**이며 전 세계적으로 고유한 출생 ID가 아니다. 다른 요청의 `chart.candidates[0]`와 결합해서는 안 된다. experimental의 `facts...` 참조는 `data.existing`을 기준으로 해석한다. KASI 계산 출처와 명리 규칙 출처는 별개다.

직렬화 JSON은 추적 자료이며 외부 진위 인증이나 새 G0 receipt가 아니다. 현재 same-process 발급 검증은 원래 함수가 담당한다. 파일 지문은 내용 일관성을 확인하며 발행기관 서명·이용권 승인을 의미하지 않는다.

## 선택과 호환성

- 새 wrapper 미사용 시 기존 CLI의 JSON/TEXT는 그대로다.
- `experimental` 모드도 실험 policy ID가 필수다. chart/explain/evidence에 점수를 자동 추가하지 않는다.
- 입춘의 원국 두 후보와 토왕 B의 한 원국 아래 계절 대안을 구별한다. 점수나 격국 구조를 계절 대안 수만큼 복제하지 않는다.
- `finalStrength=NOT_IMPLEMENTED`, G1-P2 NO-GO와 기존 좁은 연구 결론의 의미를 유지한다. 가중 등급을 기존 필드에 덮어쓰지 않는다.
- 향후 스토리 소비자는 계산 사실·선택 정책 판단·창작 문장을 구분해야 한다. 이번에는 스토리 저장·API 서버·UI를 추가하지 않는다.

`test/offline-analysis-contract.test.mjs`는 공개 합성 자료에서 이 최소 경로·직렬화·후보·기본 비활성을 검사한다. 실제 KASI 날짜 정확도나 외부 예측 검증을 대신하지 않는다.
