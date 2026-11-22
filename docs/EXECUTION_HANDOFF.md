# Manseryeok-engine — current execution handoff

**엔진 트랙 E5.** 실행 코드 `f288bbfb3a638e2e2817cf3c37767447718532e7`. 선택형 E5는 기존 E3 전체와 격국 v2, 조후 v2, 통관 원국 경로, 목적별 비교를 함께 제공한다. 기존 E1 억부 순위는 그대로다. 실제 격국 성패·통관 효력·최종 용신과 희기 순위는 미결정이다. 배포팀은 `candidates[i].features`의 정책·상태·근거를 참조한다. [실행 계약](contracts/ENGINE_E5_API_V01.md) · [출생·문헌 검증 및 패키지](engineering/ENGINE_E5_EXECUTION_20261122.md)

**엔진 트랙 E4.** 실행 코드 `861674df66cd77c5798db2d8f434599602bba431`. 선택형 개발 비교 도구로 공개 사례 9건과 같은 생시의 정책 차이를 재생할 수 있다. E1 240건의 독립 산술과 E3 276건의 의미 회귀를 통과했다. 상용 강약 두 차이의 원인은 미확정이고, E3 문헌 표본과 프로젝트 조건의 간극을 기록했다. 사용 앱은 E1 점수를 위치별 생조 배분으로, E3 상태를 선택 규칙에 대한 판정으로 읽는다. E4는 런타임 정책을 추가하지 않는다. [도구와 계약](contracts/ENGINE_E4_COMPARISON_HARNESS.md) · [검증과 패키지](engineering/ENGINE_E4_EXECUTION_20261122.md)

**엔진 트랙 E3.** 런타임 검증·독립 패키지 소스 `a4a863feef172f965c00ec82515acea0628e8ec3`. 명시적 E3 선택으로 정관·재격·칠살의 9개 규칙, 적용 범위, 후보별 경로 근거와 E1 탐침 결과를 읽을 수 있다. 독립 Node 22 복원과 전체 검사 1,194/1,194 통과. 상용 강약 공식의 미공개 부분과 실제 성패·구응 효력은 미확정이다. [규칙](research/ENGINE_E3_PATTERN_RULES_V01.md) · [입력 및 결과](contracts/ENGINE_E3_FEATURE_API_V01.md) · [검증과 한계](engineering/ENGINE_E3_EXECUTION_20261122.md)

앱이 E2 응답을 수신할 때 적용할 [JSON Schema v1](contracts/engine-e2-result-v1.schema.json)과 [19개 가상 출생 입력 요약](engineering/ENGINE_E2_EXAMPLES.md)이 있다. 업체가 공개한 원국은 정해·별코드·사주록 3건까지 비교했다.

**엔진 트랙 E2.** 검증 코드 `f80ed4418141b443f0fbdea0e7e87fac07418e6c`. 19개 합성 출생 요청에 대해 원국별 기능 결과와 근거를 한 번에 조회할 수 있다. 다음 개발팀은 `features.<key>.availability`와 결과 자체의 상태를 함께 읽고, 대운 순역·시계·E1을 명시한다. 양인표의 음간 처리와 도화·역마·화개의 기준 지지에 따라 다른 프로그램과 결과가 다를 수 있다. E3에서는 같은 월령 위치의 경합을 출발점으로 실제 효력의 필요조건을 검토한다. [기술 계약과 요청 예시](contracts/ENGINE_E2_FEATURE_API_V01.md) · [실행 기록](engineering/ENGINE_E2_EXECUTION_20261122.md)

**엔진 트랙 · ENGINE-PARITY-TRACK-V1 / E1.** 기존 보고 기준에서 시작한 정책 사전 등록은 `b1a79cd976a704d683d10d7ab3e72ec15c6293aa`, E1 실행 코드는 `063cdc1f1e162a7d3c37c8a0e92ac667f6702bb3`이다. 제품 기본 프로필은 기존 엔진을 호출한다. E1을 선택하면 후보별 강약·억부·조후와 월령 구조를 각각 조회할 수 있다. 일반 원국에서 184/231개가 억부 후보를 냈고 47개는 경계에 남았다. 외부 상용 대조는 업체가 직접 게재한 원국 1개까지다. E2에서는 격국 성립 조건의 적용 범위와 반례를 먼저 검증한다. [정책·기술 검증 기록](engineering/ENGINE_E1_EXECUTION_20261122.md) · [실행 가이드](contracts/ENGINE_E1_API_V01.md) · [고정 코호트·외부 대조](engineering/ENGINE_E1_COMPARISON_20261122.md)

**현재 단계 · Sprint 9, 2026-11-22.** 가상 자료용 독자·전문가 평가 환경과 환불 중단 파일 정리를 검증했다. 코드 `668e0fcc4c30dcb8aa39d09204512232c7cc6aed`, 전체 1103/1103 통과. 실제 독자·전문가 각 0명, 실참여 승인 대기. 유료 제공·운영 결제·공개 출시 NO-GO. [연구실 실행](product/SPRINT9_BETA_LOCAL_GUIDE.md) · [검증·실패·측정](engineering/SPRINT9_EXECUTION_20261122.md)

### 이전 Sprint 8 인계 기록

**2026-11-22 Sprint8: 로컬 TEST 구매부터 S7 생성·저장·재열람까지 구현·검증. 실판매는 차단.** 승인 브랜치 `agent/kasi-local-1950-2026-20261109`, 시작 local/directremote `4083e4d6f6a6a105a57614165c51dc275957a82d` clean. 검증 코드 **`ab6cf0ffa4635921556f3a54353565b357185435`**. 후속은 문서뿐이며 마지막 remote는 전달 영수증/최종 답변으로 구분한다. 이전 [handoff 원byte archive](archive/EXECUTION_HANDOFF_BEFORE_SPRINT8_20261122.md)를 보존했다.

- **고정 계획:** [SAJU-ROADMAP-V1 / 2026-11-15](product/SAJU_ROADMAP_LOCKED_V1_20261115.md), LOCKED_UNTIL_EXPLICIT_USER_APPROVAL. Sprint8 진행 상태만 바꿨다. Sprint5.1 13HTTP시도/재시도0 수집은 여전히 별도 승인 대기다. Sprint9 실제 사용자/전문가 베타·10 출시를 수행하지 않았다.
- **실제 웹:** `scripts/purchase/web.mjs`→loopback `http://127.0.0.1:8788`, 기존 vanilla UI 재사용. 입력/시계 정책 확인·무료 S6 미리보기/S7 영역 적격성→NOT_FOR_SALE_YET→TEST 주문/승인→실제 S7 생성/검수→6장·claim 상세→암호화 저장/보관함/재열람/취소·환불이다. 생성은 검증한 TEST 승인 뒤 시작한다. 기본 엔진·S6/S7/M3~M7 출력·정책을 변경하지 않았다.
- **판매 게이트:** CONTENT/PAYMENT_INTEGRATION/LEGAL_OPERATIONAL/PUBLIC_LAUNCH_APPROVED 모두 false 상수. `/api/live/*`와 LIVE 주문은 서버 거절한다. body/env/localStorage/성공 화면으로 해제할 수 없다. fixture100KRW는 실제 가격이 아니며 실제 금전 이동/PG/LLM 호출은 없다. S7 상품성 PARTIAL·PAID_REPORT_READY NO-GO 유지다.
- **상태/권한:** 주문·결제·생성·환불·접근을 분리했다. HMAC 검증 Fake 이벤트는 주문/상품/금액/통화/provider/구매자를 대조한다. 독립 멱등키·3회 생성 상한·복구 전이를 적용한다. 서버 발급 HttpOnly/SameSiteStrict 게스트+CSRF/Host/Origin과 소유권을 검증한다. loopback HTTP Secure 예외, 세션24시간/결과7일은 기술 설정이지 운영 인증/법정 보관기간이 아니다.
- **저장/복구:** S7 AES-GCM/HMAC 저장 재사용+새 암호화 원자 vault·단일 writer. 실제 서버를 AFTER_START/AFTER_STORE에 종료하고 재시작해 각각 결과1개로 복구했다. 저장 직후 환불 정상/예외를 보완했지만 두 파일은 DB 트랜잭션이 아니므로 강제 종료+환불의 극단 조합에 orphan 암호화 파일/수동 정리 한계가 남는다. startup.guard 중단은 운영자 검토로 실패한다. Windows ACL·운영 DB/KMS/키 회전·백업/자동 파기·회원/장기 복구는 미완료다.
- **최종 실행:** Node22.23.3/TS5.8.3, **1,079/1,079**(기존1,030+새49, fail/skip/cancel/todo0)·M2·기존Lab/KASI·신규실제Chromium PASS. 신규13화면·320/390/768/desktop·원국2후보/역법 예외·중복/위조·타게스트·환불 실패/재시도를 검사했다. 별도 Chrome 완전 종료→새 프로세스에서도 같은 쿠키/문서 재열람 PASS다.
- **실제 연결:** UTC/Seoul 각각19입력·12문서·141loopback 요청, 의미 SHA `d501deddffa59eb67f6372e9ca10dc836c694183dea48fcd5eb563c83a52e2f1` 동일. S7 직접 실행 claim과 일치한다. 초기 harness 대기/data아이콘/Windows ESM경로/잘못 복사한 SHA의 실패·교정은 [실행기록](engineering/SPRINT8_EXECUTION_20261122.md)에 보존했다.
- **새 독립 패키지:** `scripts/purchase/artifact.mjs`, 별도 S8 schema **116파일/1,167,507바이트 payload**. 외부 고정 manifest pin `5d1f80b2f5712d594b9200882e745f2766e8b351543c992413223ef8ff551815`. 저장소 밖 새 폴더에서 Node22/PATH빈/npm·Git없음/원본import·API키접근·외부통신 차단으로 실제 TEST 웹→S7 6장4claim 실행했다. 자료·키·상태는 engine payload와 분리한다. 기존v4에 새 기능을 넣었다고 하지 않는다. 공개 배포 승인 아님.
- **보존:** 기존4트리2,107/API-only5/v4 97파일·기존 코어/S6/S7·정책/지원연도·고정pin/게이트 보존을 비교한다. 49,799쌍 전수는 이번 재실행하지 않았으며 S5의 과거 기록이다. 해석 정답률·실제 콘텐츠 구매 가치·사람 검토·PG 운영 검증으로 표시하지 않는다.

**판정:** SPRINT8_ENGINEERING/LOCAL_E2E/PAYMENT_SIMULATION/AUTHORIZATION/RECOVERY/REPORT_PERSISTENCE/REFUND_SIMULATION은 로컬 TEST 범위 GO. PAID_REPORT_READY/LIVE_PAYMENT_ALLOWED/PUBLIC_RELEASE NO-GO. 다음 고정 Sprint9에서 실제 사용자 이해도/반복/상품 가치와 전문가의 claim 전제·반대 조건·과장 여부를 검토해야 한다. 이번에 연락/모집/실제 고객 입력은 하지 않았다.

KASI 호출·키 사용·재수집/실결제/외부LLM/Actions/배포/실고객 데이터0. 로컬 저장 암호화 키는 실제 사용했으며 Git 통신·loopback까지 전체 네트워크0이라고 하지 않는다. private추적0, 문서후속diff·workflow분기·직접원격을 확인해 일반Push한다.

[가이드/명령](product/SPRINT8_LOCAL_WEB_GUIDE.md) · [PRD](product/SPRINT8_PURCHASE_JOURNEY_PRD.md) · [상태](product/SPRINT8_ORDER_PAYMENT_REPORT_STATE_MACHINE.md) · [API](product/SPRINT8_SERVER_API_CONTRACT.md) · [보안](product/SPRINT8_ACCESS_CONTROL_SECURITY.md) · [복구](product/SPRINT8_FAILURE_RECOVERY_MATRIX.md) · [실행기록](engineering/SPRINT8_EXECUTION_20261122.md) · [로드맵](ROADMAP.md) · [일지](DEVLOG.md)
