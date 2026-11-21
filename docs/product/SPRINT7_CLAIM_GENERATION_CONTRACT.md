# Sprint7 해석 claim 계약 v0.1

프로필 `SAJU-TRADITIONAL-REFLECTION-REPORT-V01`/0.1.0은 명시적으로 선택하는 전통적 역할 해석이다. 기존 `saju-consumer-report-evidence-v1`을 고치지 않고 `saju-interpreted-consumer-report-v1`의 `basis.baseReport`에 원byte 의미로 보존한다. 기본 S6 CLI·코어·M3/M4/M5/M7 계약은 그대로다.

## 사실·해석·서술

- `basis.projection`: 원 발급 서버 결과를 기존 어댑터로 투영한 계산/전통 분류/정책 근거다. `basis.baseReport`는 그 projection의 기존 S6 보고서다.
- `basis.existingSupport`: 같은 발급 실행의 기존 인성 합 제한을 복사한다. 후보·자원 위치·자체 근·참조를 확인하고 원래의 닫힌 조건과 일치하는지 검증한다. 이를 새 생조 효력 판단으로 사용하지 않는다.
- `interpretationClaims`: 영역별 명시 정책의 LIMITED/HOLD와 근거·반대 조건·허용 의미다. 원국 후보 하나당 네 영역 한 세트이며 계절 대안 때문에 늘리지 않는다.
- `sections/opening`: 위 claim과 기존 S6 claim만 배치하는 표현 계층이다. 사실이나 새 판단을 덧붙이지 않는다.
- `generation/qa`: 생성 경로·차단 사유·fallback과 검수 범위를 남긴다. 현실 예측 정확도나 인간 검토 여부를 수치화하지 않는다.

## 새 claim 필드

| 필드 | 계약 |
| --- | --- |
| claimId / chartCandidateRef / domain | 요청 문맥과 부모를 식별. domain은 BEHAVIOR/COMMUNICATION/WORK/MONEY |
| interpretationPolicyId / Version | 네 선택 정책 중 실제 적용한 ID/0.1.0 |
| sourceRefs | 역할 비유/원저·주석/PROJECT_POLICY의 해석 출처. 달력 API를 해석 출처로 쓰지 않음 |
| inputSourceRefs / inputFactRefs | 같은 부모의 원 계산/분류 근거. 해석 출처와 구별 |
| supportingConditions | 실제 월령·정확 투출·역할 쌍의 위치·문자·분류 |
| competingConditions | 월령 경쟁·오합 짝·관살/상관관 병존·기존 지원 제한·관계 효력 미평가 |
| interpretationScope / allowedMeaning | 전통적 상징을 자기 점검 관점으로 읽는 정확한 범위 |
| forbiddenConclusions | 성격 진단, 사건/재산/투자/질병 예측, 최종 강약·격 성패·용신, 근력·관계 효력 등 |
| confidenceOrApplicabilityStatus | LIMITED 또는 HOLD. 확률·과학적 신뢰도 아님 |
| decisionCode / narrativeTemplateId | 재현 가능한 실제 분기·표현 버전 |
| unresolvedEffects / unusedAsDeterminant | 실제 전달·근력·효력 미평가, 계절/개수/공망/운 간지를 가중치로 사용하지 않았다는 사실 |

정/편 십성은 원 위치에 그대로 남기고 역할 묶음만 서술 선택에 쓴다. 같은 근·같은 역할 쌍을 여러 영역에서 다시 참조해도 증거의 힘·확률을 더하지 않는다. WORK와 MONEY의 같은 산출/활용 쌍은 재사용임을 본문과 조건에 남긴다.

## 검증 경계

실제 Node 어댑터는 원 서버 발급 객체·요청·정책을 검증한다. 순수 TypeScript는 projection·원 S6 보고서·새 해석을 재구성해 내부 일관성을 대조한다. 임의 JSON·합성 최소 문맥을 API/G0 인증으로 승격하지 않는다. 저장 후 재열람도 원 projection으로 내부 재현을 확인하고, 암호문의 진위·무결성과 원문/외부 기관 인증을 구별한다.

필수 사실·소유 참조·정책·source 누락, sparse/getter·중복·교차 후보·잘못된 십성·위치를 거절한다. 원 인성 제한의 복사 필드는 같은 자원/근 및 기존 오합 helper의 닫힌 조건과 맞아야 한다. `NO_HOLD`는 생조 충분을 뜻하지 않는다. HOLD는 부재·0점·부정적 성격이 아니다.

행동 정책의 월령 호환 보류가 다른 영역의 실제 표면 쌍까지 거짓으로 만들지 않는다. 반대로 쌍 해석을 제공해도 해당 격 후보의 미정을 해소하지 않는다. 입력이 잘못된 것과 지원 범위 안에서 해석을 보류한 것은 다른 결과다.

## 문장의 허용과 금지

허용하는 것은 같은 사실과 정책에서 생성한 사전 등록 STANDARD/REFLECTIVE 표현뿐이다. 자유 문장을 정규식으로 검사해 의미가 증명됐다고 하지 않는다. 임의 성격 형용사·무근거 칭찬·성별 위계·건강/사망·혼인/임신·투자 손익·공포를 이용하는 문장은 허용된 의미에 없다.

상세 claim·반대 조건을 JSON에 남기고 기본 본문에서는 기술 ID를 숨긴다. 소통/활동/자원 선택 소제목과 중요한 반대 문맥을 표시하고, 동일한 정의를 여러 위치 쌍마다 반복하지 않는다. 문체 개선은 새 해석 규칙이 아니다.

[정책/사전 반례](SPRINT7_INTERPRETATION_POLICY_V01.md) · [파이프라인](SPRINT7_NARRATIVE_PIPELINE.md) · [QA](SPRINT7_CONTENT_QA_MATRIX.md) · [저장](SPRINT7_STORAGE_CONTRACT.md)
