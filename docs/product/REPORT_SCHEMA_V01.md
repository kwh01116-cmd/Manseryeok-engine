# Report Evidence Model v0.1

명식 계산 성공과 유료 리포트 완전 제공을 분리한다. 이 계약은 기존 서버 DTO를 변경하지 않는 별도 선택형 소비자 설명 모델이다. [고정 로드맵](SAJU_ROADMAP_LOCKED_V1_20261115.md)의 Sprint 6 범위이며 가격·결제·저장·공개 출시 계약이 아니다.

- 입력 projection: `saju-consumer-report-input-v1`
- 보고서: `saju-consumer-report-evidence-v1`
- 프로필: `SAJU-CONSUMER-EVIDENCE-REPORT-V01` / `0.1.0`
- 웹/일반·대화 view: `saju-consumer-report-sections-v1`

## 계층과 의미

| 필드 | 실제 내용 | 보증하지 않는 것 |
| --- | --- | --- |
| `inputContext` | 원입력·양력 환산일·시각 정밀도·선택한 명식/시계·자시 정책·DST 대응 | 시각 미상 보충, 장소 추정, 초 단위 출생 순간 |
| `calculationFacts` | 네 기둥·적용 절입·요청한 시간축 등 기존 계산의 projection | 외부 기관 서명·G0 인증 |
| `traditionalClassifications` | 기존 M2의 일간 오행·십성·장간·위치 분류 | 성격·실제 힘·개인 사건 |
| `policyAssessments` | 기존 계절·통근·M4 구조 후보·M5 후보/보류·한정 강약 | 정책의 지원 범위 확대·최종 신강약/용신 |
| `interpretationClaims` | 여러 근거를 연결해 읽는 버전형 문장·범위·상태 | 미구현 성향/관계/직업/재물의 임의 해석 |
| `narrativeSections` | 6개 장, 근거를 가진 claim ID 목록, 무료/유료 구성 가설 | 결제 권한·실제 유료 상품 완성 |
| `unsupportedOrHeldClaims` | 미지원 주제와 부족한 정책, Sprint 7 과제 | HOLD를 중화·무효·부재로 변경 |
| `provenance` | 원 DTO·자료 버전/지문·정책/규칙/출처 목록·검증 범위 | 해시를 암호화나 개인정보 익명화로 취급 |
| `eligibility` | 제한 제공/추가 정보/제공 불가 및 장별 상태 | 원국 성공만으로 전체 유료 제공 승인 |

`CALCULATION_FACT`, `TRADITIONAL_CLASSIFICATION`, `POLICY_ASSESSMENT`는 evidence layer다. 각 문장은 `evidenceLayers`와 `inputPolicyRefs`에 원래 계층·정책 버전을 공개한다. 문장 조합 정책의 버전은 원래 M2 규칙 버전을 대신하지 않는다. 기존 null 버전도 그대로 남긴다.

## 후보·시간·보류

- 원국 후보 ID는 원 발급 후보를 유지하고, 문장/evidence ID에는 요청·정책·자료 지문으로 만든 `contextId`를 붙인다. 다른 요청에도 반복되는 `chart.candidates[0]`만으로 실행 연속성을 증명하지 않는다.
- 입춘의 두 원국은 각자의 월령·장간·정책 평가를 가진다. 토왕 B 분의 계절 대안 두 개는 한 원국 안에 남긴다. 무관한 대안의 곱집합이나 첫 후보 자동 선택은 없다.
- `SUPPORTED`: 선언된 계산/분류가 제공됨. `LIMITED`: 범위가 제한된 구조 연결 설명. `HOLD`: 필요한 효력을 정하지 못함. `UNSUPPORTED`: 현재 기능 범위 밖. `NEEDS_DATA`: 필요한 자료 없음. `POLICY_UNRESOLVED`: 시계·의존 정책 미채택. 수치 0이나 빈 결론으로 대체하지 않는다.
- 시각 미상·DST 미선택 fold·gap·연도/달력 미지원은 기존 서버 상태를 보존한다. 출생 M1을 추가 호출하거나 임의 시각을 넣지 않는다.

## 적격성

| 상태 | 시제품 의미 |
| --- | --- |
| `FULLY_PROVIDABLE` | 예약된 계약 값. 이번 버전에서는 반환하지 않음 |
| `LIMITED_PROVIDABLE` | 원국과 제한된 구조 설명 제공. 성향·주제 장은 보류 |
| `NEEDS_ADDITIONAL_INFORMATION` | 예: 출생 시각 미상, DST 반복 시각의 추가 정보 필요 |
| `NOT_PROVIDABLE` | 예: 없는 벽시계 시각, 현재 자료/출생 범위 미지원 |

현재 모든 출력의 `fullPaidReport=false`, `paymentGate=NO_GO_PROTOTYPE_NOT_FOR_SALE`이다. 개인에게 제공할 수 있는 장의 상태와 상품 전체의 판매 준비는 다른 판단이다. 추가 입력을 요구할 때 성별·시각·정책을 추정하지 않는다.

## 실행·검증 경계

기존 서버 로더를 한 번 준비하고 요청마다 `engine.calculate(request)` 결과를 한 번만 발급받는다. 어댑터가 원 발급 객체·요청·hash·실제 경로를 검증한 뒤 projection을 만든다. TypeScript 순수 모델은 그 projection 안의 후보·위치·근거 연결·주장 정합성을 검증하며 API 원문의 진위를 새로 인증하지 않는다.

입력/결과에 getter·symbol·sparse 배열·잘린 참조·교차 후보·중복·정책 버전 혼입을 허용하지 않는다. 출력은 복사 후 동결하여 호출자의 객체까지 소급 동결하지 않는다. 동일 projection은 동일 모델과 문장으로 재현된다. 직렬화 모델은 원 projection을 함께 제공해야 완전 대조 검증할 수 있다.

JSON은 전체 근거 모델, TEXT는 같은 claim을 선택한 소비자용 설명, sections DTO는 웹/문서가 같은 claim을 배치할 수 있는 표현 계약이다. `preview/full`은 콘텐츠 구성 가설이며 유료 권한 시스템이 아니다. `report/dialogue`는 같은 claim ID·text·factRefs를 유지하며 대화형 view에서 speaker만 추가한다. 캐릭터 UI·외부 LLM·PDF 생성은 구현하지 않는다.

변경 시 schema/profile 버전을 검토한다. 기존 서버·M1~M7·기본 CLI·기존 오프라인 v4의 계약을 소급 변경하지 않는다. [문장 계약](REPORT_CLAIM_CONTRACT_V01.md)과 [콘텐츠 공백](REPORT_CONTENT_GAP_MATRIX.md)을 함께 본다.
