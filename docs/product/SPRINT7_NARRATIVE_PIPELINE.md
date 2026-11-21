# Sprint7 해석·서술 파이프라인 v0.1

```text
기존 출생 요청 → 기존 서버 엔진(출생 M1 재호출 없음)
→ 검증된 원 결과 → 원 S6 projection/report 보존
→ 명시한 해석 정책 → 근거 claim → 닫힌 표현 카탈로그
→ 사실/claim/표현 검수 → 소비자 JSON/TEXT/sections
→ 명시적 로컬 암호화 저장 → 원 버전으로 재열람/재구성
```

## 기본 생성

`src/report/interpretationPolicyV1.ts`는 사전 결정표의 실제 적용 조건과 LIMITED/HOLD를 실행한다. `src/report/narrativePipelineV1.ts`는 여섯 장·요약·반대 문맥을 같은 claim에서 구성한다. `scripts/product/interpreted-report.mjs`는 기존 서버/소비자 어댑터를 재사용한다. 새 계산기·십성/장간표·강약 점수·격 성패/용신·사건 예측을 만들지 않는다.

프로필은 `SAJU-TRADITIONAL-REFLECTION-REPORT-V01`/0.1.0, 해석 resolver0.1.1, 생성기0.1.1, artifact1.0.1이다. 최초 개발본의 일간 포함 오합 문맥 누락을 고친 버전을 구별한다. 선택 정책의 영역별 if/else·LIMITED/HOLD는 변경하지 않았다. 정책 미선택 시 기존 S6 엔트리/출력은 변하지 않는다. 새 엔트리는 모든 옵션을 명시하며 로그·배너를 stdout에 섞지 않는다. 기본 자동 저장은 없다.

첫 문단은 적용 영역의 개수보다 실제 선택된 역할 대비를 먼저 말한다. 이 표시 순서는 힘의 순위가 아니다. 동일 종류의 여러 위치 쌍은 위치를 모두 보여 주고 의미 설명은 한 번만 한다. 장6은 중요한 합/병존/기존 지원 보류를 한 번 모아 설명한다. 복수 원국은 독립 경로, 하나의 원국의 계절 대안은 기존 장2 문맥이다.

## 선택형 표현 인터페이스와 로컬 mock

외부 모델은 연결하지 않았다. `expressionRequest(report)`는 허용 claim/의미/범위/금지 결론/등록된 두 표현을 제공한다. 출생 날짜·원 request·전체 달력 자료·원 projection·저장 키는 보내지 않는다. 파생 명식 정보도 개인정보 맥락일 수 있으므로 이를 익명화라고 부르지 않는다. 미래 실제 외부 전송·유료 호출·키 설정에는 별도 승인이 필요하다.

현 인터페이스는 **등록 표현 선택만 허용하는 닫힌 계약**이다. 임의 자연어 패러프레이즈의 의미를 자동 인증하는 기능은 없다. provider는 block/claim/policy/부모/상태를 그대로 유지하고 STANDARD 또는 REFLECTIVE 표현을 고른다. 실제 LLM의 문장 품질을 검증한 것으로 표시하지 않는다. `approvedExpressionMock`는 네트워크 없이 이 계약만 검사한다.

`composeWithExpressionProvider`의 시도 상한은 명시1–2회, 기본1회, 각 시도 대기 기본1초(설정1ms–10초)다. 이는 새 로컬 표현 계약의 한도이며 기존 검사 timeout을 늘린 것이 아니다. provider 예외/불능, 응답 계약 위반, 대기 중단, claim·사실·정책·상태·안전 위반을 구별한다. 실패한 원 자유 문장은 로그/trace에 저장하지 않고 안전한 코드와 등록 block ID 또는 null만 남긴다.

## 검수와 실패 처리

| 종류 | 실제 처리 |
| --- | --- |
| 원 계산/분류 오류·조작 | 원 S6 projection/report와 재구성 결과를 대조해 거절. 발급 경로에서는 기존 서버 진위·요청도 검증 |
| 없는 claim/다른 부모·정책/상태 승격 | 구조화된 CLAIM/FACT issue로 차단 |
| HOLD의 확정 표현·임의 새 의미 | 원 claim과 등록된 표현 불일치로 차단 |
| 질병·사망/사고·혼인·투자 확정·차별/공포 | 등록 의미 밖이므로 거절. 좁은 어휘 탐지는 추가 분류이며 범용 의미 검증의 근거가 아님 |
| 중복 block·칭찬·조사 의심 | QUALITY issue. 정상 카탈로그의 반복 정의는 모아 서술하고, 사람 간 반복/가독성은 별도 품질 평가 |
| provider 불능·잘못된 응답/중단 | 각각 GENERATOR_UNAVAILABLE/CONTRACT/ABORTED. 상한 뒤 검증된 결정론적 생성으로 fallback |
| 기본 사실·claim 자체 오류 | 표현 재생성으로 우회하지 않고 안전 실패. 유효한 결과를 만들 수 없는 장/입력은 HOLD/제공 불가 유지 |

`auditNarrative`는 현재 허용된 claim과 닫힌 카탈로그를 재구성해 비교한다. 정규식 통과만으로 의미 검증·객관적 성격 정확도·인간 검수를 완료했다고 주장하지 않는다. 정의를 공유하는 리포트들의 반복과 구매 가치는 최종 내용 검토에서 따로 평가한다.

## 저장과 재현

`report-store.mjs`는 생성 경로와 분리된 명시 API다. 원 projection/baseReport·claim·정책/자료/생성기/artifact 버전을 암호화하여 저장하고 재열람 시 다시 검증한다. 검증기는 `validateInterpretedReport`와 `interpretedReportVersions`의 버전 일치를 함께 확인해야 한다. 내용/버전/만료 변경을 같은 idempotency key로 조용히 덮어쓰지 않는다.

운영 회원 인증·권한/결제·실DB·운영 키 보관·자동 만료 sweep은 구현하지 않았다. 보존기간의31일 상한은 로컬 시제품의 기술적 제한이며 법정 정책이 아니다. 실제 고객 정보는 사용하지 않는다.

[문장 계약](SPRINT7_CLAIM_GENERATION_CONTRACT.md) · [저장 계약](SPRINT7_STORAGE_CONTRACT.md) · [실행 가이드](SPRINT7_REPORT_GUIDE.md) · [고정 로드맵](SAJU_ROADMAP_LOCKED_V1_20261115.md)
