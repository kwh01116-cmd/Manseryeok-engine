# Sprint 8 local TEST HTTP 계약 v0.1

`scripts/purchase/web.mjs`, Node 22, loopback `127.0.0.1` 전용이다. 실제 PG·운영 결제 API가 아니다. 모든 응답은 no-store, CSP/self, nosniff, no-referrer를 적용한다. 명시한 Host/Origin만 허용하며 JSON body는 32KiB, 동시 요청은 16개다. query string은 사용하지 않는다. 출생정보와 세션 비밀을 URL에 넣지 않는다.

## 요청과 권한

GET `/api/session`이 HttpOnly/SameSite=Strict 게스트 쿠키와 JSON의 CSRF/만료를 발급한다. JSON에 actor/token/키를 반환하지 않는다. 다른 모든 사용자 API는 이 세션을 확인한다. 변경 요청은 같은 Origin, `X-CSRF-Token`, JSON Content-Type이 필요하다. 로컬 HTTP 쿠키의 Secure 예외·운영 한계는 [보안 계약](SPRINT8_ACCESS_CONTROL_SECURITY.md)을 따른다.

| 경로 | 입력 | 결과 |
| --- | --- | --- |
| POST `/api/reviews` | `{request: 기존 server-analysis-request-v1}` | 원입력 확인용 DTO, 계산 상태, 후보·무료 미리보기, 적격성, 장별/영역별 제한, 만료 |
| POST `/api/reviews/:id/confirm` | `{}` | 해당 게스트의 명시적 입력 확인 |
| POST `/api/orders` | `{reviewId,idempotencyKey,mode:'TEST'}` | 테스트 주문. 미확인·계산 불가·멱등 키 충돌 거절 |
| GET `/api/orders` | 없음 | 현재 게스트 주문 목록. 다른 사용자·출생 원문 없음 |
| GET `/api/orders/:id` | 없음 | 주문/결제/생성/환불/접근 상태와 실제 전이 이력 |
| POST `…/checkout` | `{}` | 서버 fixture 상품·금액·통화의 테스트 결제 대기 |
| POST `…/simulate` | `{action}` | 아래의 로컬 Fake Provider 동작 |
| POST `…/cancel`, `…/retry` | `{}` | 유효 전이만 실행. 재시도 최대 3번의 생성 시도 |
| POST `…/refund`, `…/refund-review` | `{}` | 요청/테스트 검토 단계. 법적 환불 권리 판정 아님 |
| GET `…/report` | 없음 | 검증된 S7 6장 섹션 DTO·TEXT·claim·버전·적격성 |
| DELETE `…/report` | `{}` | 소유자 결과 삭제·권한 회수 |
| POST `/api/provider/events` | 서명된 Fake envelope | HMAC 검증·주문/소유자/상품/금액/통화/provider 비교 뒤 상태 전이 |
| `/api/live/*` | 어떤 입력이든 | 실제 판매 게이트 거절. 요청/환경 플래그로 해제 불가 |

`simulate` action: APPROVE/FAIL/CANCEL/DELAY/REPLAY/BAD_SIGNATURE/REFUND_APPROVE/REFUND_FAIL. DELAY는 승인 없이 대기를 유지하고 나중에 APPROVE를 명시한다. 실제 비동기 PG나 실제 송금이 아니다. REPLAY는 기존 승인 이벤트만 재전송한다. 브라우저가 금액·상품·actor·결제 완료 상태를 보낼 수 없다. Fake envelope는 실제 PG의 webhook 규격으로 소개하지 않는다.

## 입력·생성 경계

달력/연도/윤달/시각/null/시계/자시·시주 정책은 기존 검증기를 그대로 사용한다. DST 추가 오프셋·대운 성별/정책·기준시각·월운 연도도 명시 입력한다. 1950 미지원, 2027 음력 NEEDS_DATA, DST gap/fold 보류는 정상적인 계산 상태이며 테스트 구매로 우회하지 않는다. 원국 후보 둘과 한 원국의 계절 대안 둘을 혼합하지 않는다.

무료 단계는 한 번의 기존 M1 계산과 S6 미리보기, S7 정책의 영역 적용 가능성만 검토한다. S7 전체 문서 생성·검증·저장은 승인된 테스트 결제 뒤 별도 작업에서 수행한다. 두 HTTP 요청은 독립 실행이며 한 요청 안에서 M1을 반복 호출하지 않는다. 입력 확인의 6장 종합은 `POLICY_UNRESOLVED`로 표시하고 최종 생성 검증을 기다린다. HOLD는 유료 적격성이나 신강/중화로 승격하지 않는다.

저장한 입력/후보 문맥·자료 지문·S7 정책/resolver/generator/artifact pin과 생성 결과를 비교한다. 반환 섹션은 S7의 기존 renderer와 동일한 데이터다. 상세 보기만 claim/정책·버전을 제공하며 원본 데이터셋 파일은 제공하지 않는다. 실제 판매는 항상 NOT_FOR_SALE_YET, fullPaidReport=false다.

오류는 `{status:'REJECTED',error:{code,message}}`다. 401 세션, 403 Origin/CSRF/접근/실제 판매, 404 비소유/없는 자료, 409 상태/멱등 충돌, 410 만료, 413 크기, 422 입력/전이/서명, 429 제한, 503 저장/무결성으로 구분한다. 경로·DOB·비밀·자유 예외 문자열을 응답/로그로 내보내지 않는다.
