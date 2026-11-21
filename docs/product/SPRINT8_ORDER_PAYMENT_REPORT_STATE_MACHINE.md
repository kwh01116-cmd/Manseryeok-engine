# Sprint 8 주문·결제·생성·환불 상태 계약 v0.1

이 계약은 로컬 가상 주문과 금전 이동 없는 결제 시뮬레이션의 기술 계약이다. 상품 가격·법적 환불 정책·운영 PG 규격을 정한 문서가 아니다. 고정 로드맵의 Sprint 8에 해당하며 실제 베타와 유료 출시는 별도 단계로 유지한다.

구현은 `src/purchase/orderStateV1.ts`, Fake Provider는 `scripts/purchase/fake-payment.mjs`다. 신규 주문은 `mode=TEST`, 고정 테스트 상품 `SAJU-REPORT-TEST-V01`만 받는다. 100 KRW는 검증용 fixture이며 판매 가격은 미정이다. 네 개의 실제 판매 승인 값은 모두 코드 상수 `false`다. 실제 판매 검사는 요청·환경변수를 읽지 않고 항상 `LIVE_SALE_NOT_APPROVED`로 실패한다.

## 서로 독립적인 상태

| 구분 | 상태 | 의미 |
| --- | --- | --- |
| 주문 | READY_FOR_TEST_CHECKOUT → PAYMENT_PENDING → PAYMENT_VERIFIED, 또는 CANCELLED | 생성과 별개의 주문 진행 상태. CREATED는 생성 이력에 남는다 |
| 결제 | NOT_STARTED → PENDING → APPROVED / FAILED / CANCELLED | 승인된 Provider 이벤트가 있어야 APPROVED가 된다 |
| 생성 | NOT_STARTED → QUEUED → GENERATING → VALIDATING → COMPLETED | 저장된 결과 참조까지 확인한 뒤에만 완료한다 |
| 생성 오류 | FAILED_RETRYABLE / FAILED_FINAL | 재시도 가능성과 최종 제공 불가를 구분한다 |
| 환불 | NOT_REQUESTED → REQUESTED → REFUND_PENDING → REFUNDED / REFUND_FAILED | UNDER_REVIEW는 별도 검토를 위한 예약 상태다. 현재의 자동화는 Fake 테스트 정책에 한한다 |
| 접근 | LOCKED / AVAILABLE / REVOKED | 승인 결제·검증 완료·환불 미요청인 결과만 AVAILABLE이다 |

`PAID_REPORT_READY`, 콘텐츠 승인, 운영 결제 승인과 이 상태들을 합치지 않는다. 기존 S7 리포트의 LIMITED/HOLD는 콘텐츠 상태이며 주문의 결제 승인으로 바뀌지 않는다. 적격성 차단 입력은 이 상태 객체를 만들기 전에 서버에서 분리한다.

## 전이와 거절 조건

| 명령·사건 | 필요한 상태 | 결과·거절 |
| --- | --- | --- |
| CHECKOUT | READY 또는 이미 PENDING, 아직 승인되지 않은 결제 | PENDING. 같은 주문의 Provider 참조는 계속 동일하다 |
| 서명 검증된 PAYMENT_APPROVED | 결제 요청 기록과 모든 주문 바인딩 일치 | PAYMENT_VERIFIED / APPROVED. 생성은 아직 NOT_STARTED다 |
| QUEUE | APPROVED, 환불 미요청, 활성 주문, NOT_STARTED | QUEUED. 중복 승인 자체가 중복 작업을 만들지 않도록 서버가 현재 상태를 확인한다 |
| START_GENERATION | QUEUED | 시도 횟수 증가, GENERATING |
| START_VALIDATION | GENERATING | VALIDATING |
| COMPLETE | VALIDATING + 저장된 reportRef | COMPLETED / AVAILABLE. 결제 성공 화면으로는 도달할 수 없다 |
| FAIL_RETRYABLE | QUEUED / GENERATING / VALIDATING | FAILED_RETRYABLE. 이미 3회 시도했다면 FAILED_FINAL |
| FAIL_FINAL | 위와 같은 실행 상태 | FAILED_FINAL. 데이터·정책·claim 오류를 추측 문장으로 보완하지 않는다 |
| RETRY | FAILED_RETRYABLE, 3회 미만 | QUEUED. 결제 요청을 새로 만들지 않는다 |
| RECOVER_INTERRUPTED | GENERATING / VALIDATING | QUEUED. 3회 상한이면 FAILED_FINAL. 실제 lease·프로세스 소유권 검사는 서버가 먼저 수행한다 |
| CANCEL | 환불 완료 전 | CANCELLED. 아직 미승인이면 결제 CANCELLED. 승인 결제라면 환불 REQUESTED 및 접근 REVOKED |
| REQUEST_REFUND | APPROVED, 환불 미완료 | REQUESTED / REVOKED. 대기·실행·재시도 작업은 FAILED_FINAL로 중단한다 |
| BEGIN_REFUND | REQUESTED / UNDER_REVIEW / REFUND_FAILED / REFUND_PENDING | REFUND_PENDING. 실제 법적 승인 절차를 대체하지 않는다 |
| REFUND_APPROVED | REFUND_PENDING 또는 이미 REFUNDED | REFUNDED / CANCELLED / REVOKED |
| REFUND_FAILED | REFUND_PENDING 또는 실패·완료 상태 | REFUND_FAILED, 접근 계속 REVOKED. 뒤늦은 실패 이벤트로 REFUNDED를 되돌리지 않는다 |

결과가 완성된 뒤 환불을 요청해도 과거의 생성 완료 이력은 지우지 않는다. 접근 권한을 별도로 철회한다. 로컬 파일의 삭제·보존·백업 처리는 접근 상태와 별개다.

이미 PENDING인 CHECKOUT, 취소 완료 주문의 CANCEL, 기존 환불 요청의 REQUEST_REFUND, 이미 REFUND_PENDING인 BEGIN_REFUND는 상태·이력을 변경하지 않는다. 브라우저 연타로 새로운 환불 시도 번호를 만들지 않는다. REFUND_FAILED 뒤 명시적인 BEGIN_REFUND만 새로운 테스트 환불 시도다.

## 지연·중복·순서 충돌

- 취소 뒤 늦게 승인되면 결제 사실을 보존하고 주문은 CANCELLED로 유지한다. 환불 REQUESTED로 보내며 리포트 작업을 시작하지 않는다.
- 승인 뒤 도착한 결제 실패·취소 이벤트는 승인 사실을 되돌리지 않는다.
- 환불 완료 뒤 재전송된 결제 승인은 결과 접근을 복구하지 않는다.
- 같은 eventId와 같은 정규화 SHA-256은 상태·이력을 바꾸지 않는 재전송이다. 같은 ID의 다른 내용은 `PAYMENT_EVENT_CONFLICT`다.
- eventId가 달라도 이미 승인된 상태에서 다시 승인 이벤트를 받았다는 이유로 새 결과를 만들지 않는다. 서버의 주문 생성 키·작업 키·S7 결과 저장 키도 각각 멱등성을 검사한다.
- Provider 이벤트 128개, 전이 이력 512개를 상한으로 둔다. 상한을 넘으면 실패하며 오래된 재전송 방지 기록을 자동으로 지우지 않는다.

## Fake Provider의 신뢰 경계

Fake Provider는 메모리에 받은 별도의 32바이트 키로 HMAC-SHA256을 계산한다. 로컬 키·공급자 ID·정규화된 payload에 대한 서명을 검증하고 상수 시간 비교를 사용한다. 이 형식은 실제 PG의 webhook이라고 주장하지 않는다.

payload에는 eventId, providerRef, orderId, actorRef, productId, amount, currency, type, issuedAt, schemaVersion이 필요하다. 서명 검증 뒤 순수 상태 함수가 소유자·주문·상품·금액·통화·Provider 참조를 다시 대조한다. 순수 상태 함수 호출 자체는 인증이 아니므로 HTTP body를 곧바로 `applyVerifiedPaymentEvent`에 전달해서는 안 된다. 서버만 검증된 이벤트를 넘긴다.

브라우저 반환 화면, actorId 문자열, 임의 금액, 로컬 스토리지는 결제 증거가 아니다. 서명 키가 노출된 같은 OS 사용자와 악성 운영자는 이 로컬 시제품의 위협 모델 밖이며, 운영 키 관리·DB 동시성·PG 실규격 검토는 출시 전에 필요하다.

## 검증 범위

`test/sprint8-state.test.mjs`는 결제 전 생성 거절, 바인딩·서명 변조, 중복/충돌 이벤트, 취소-승인 경합, 실패 후 재시도, 중단 복구의 시도 상한, 환불 재시도·완료 후 접근 차단, sparse/getter/상태 변조 거절을 검사한다. 실제 서버·저장·브라우저 결과는 별도 Sprint 8 실행 기록에 기재한다. 이 문서의 시나리오가 존재한다는 이유만으로 실행 PASS를 주장하지 않는다.
