# Sprint 8 — 구매부터 재열람까지 실행 기록

2026-11-22 작업. 로컬 TEST 기술 흐름만 수락 대상이다. 기존 S7 콘텐츠 PARTIAL / PAID_REPORT_READY NO-GO, 실제 판매·공개 출시는 계속 차단한다. 실제 고객/전문가 검토는 고정 Sprint9, 출시 승인은10이며 수행하지 않았다.

## 시작과 변경

실제 로컬/직접 원격 `4083e4d6f6a6a105a57614165c51dc275957a82d`, 승인 브랜치 clean에서 시작했다. 전달된 상태와 일치했다. 원본 528추적 파일의 작업 전 raw SHA를 private baseline에 보관했다. 기존 코어·S6/S7·M2~M7·자료 pin과 v4를 변경하지 않는다. 새 purchase 모듈과 선택형 웹 경로, 기존 package의 새 명령만 추가한다. 고정 로드맵은 Sprint8 진행 상태만 바꾼다.

- 한 번의 기존 계산으로 S6 무료 미리보기·S7 영역 적용 여부를 확인하고, 입력 확인과 서명된 TEST 승인 뒤 실제 S7 전체 생성·검증·암호화 저장을 실행한다.
- 주문·결제·생성·환불·접근 상태를 별도로 둔다. 서로 다른 결제/생성 멱등성, 원자적 암호화 상태, 단일 writer, 중단 복구/3회 시도 상한, 저장 직후 재실행의 동일 레코드 재사용을 구현했다.
- 게스트 쿠키·CSRF·소유권과 최종 열람 시 재확인을 적용한다. LIVE 게이트4개는 코드 상수 false이며 요청·환경 값으로 바뀌지 않는다.
- S7 claim/6장 DTO·TEXT를 그대로 렌더링하고 기본 본문에서 긴 ID/manifest를 숨긴다. 기술 상세는 접어서 제공한다. Fake Provider는 실제 PG의 규격이나 운영 준비 완료가 아니다.

## 개발 중 실패·검토

1. Git 읽기 baseline을 Node cwd의 역슬래시 safe.directory로 실행해 소유권 검사에서 실패했다. 명시한 정규 슬래시 repo 경로로 수정했고 Git 설정/자료를 바꾸지 않았다.
2. 저장 factory await 누락, 세션 키 정리 누락, inflight 감소 위치, dispatcher 깨움 경합, 버전 pin 누락·취소 중 저장 orphan·열람 중 권한 철회 경합을 코드 검토로 찾아 보완했다. 오래된 입력·버전 충돌·저장 후 환불을 새 반례로 검사했다.
3. 초기 상태 검사2개는 오류 종류를 잘못 지정한 테스트 표현, HTTP Host 검사는 fetch가 Host를 교체한 전송 도구 문제였다. 상태/접근 기대는 유지하고 실제 transport 및 오류 종류를 고쳤다.
4. 첫 Chromium 검사와 병렬 개발 검사는 보관함 로딩 전 숨겨진 버튼을 눌러 실패했다. 실제 로딩 종료를 기다리게 했다. 다음 실행은 Chrome 네이티브 날짜 아이콘의 `data:` 이미지를 원격 네트워크로 잘못 센 검증기 때문에 실패했다. 로컬 data 이미지와 실제 외부 HTTP를 구분하며 원격 차단은 유지한다.
5. 첫 실제 crash probe는 top-level에서 결과 JSON을 세어 0개라고 실패했다. 기존 저장은 actor별 하위 경로이므로 재귀 계수를 사용해 **새 상태 디렉터리**에서 다시 검사했다. 생성/복구의 기대는 바꾸지 않았다.

## 실제 연결 파일럿

기존17개 가상 입력 + 고정 음력 동등 입력 +1950 미지원=19입력을 UTC/Seoul에서 각각 실제 HTTP 실행했다. 두 환경 각각12개 리포트 생성,141개 loopback 요청, 전체 S7 claim 직접 실행과 일치·생성 전 결제 확인·재전송 멱등성·listener/vault 재시작 재열람을 검사했다. 의미 SHA는 두 환경 모두 `d501deddffa59eb67f6372e9ca10dc836c694183dea48fcd5eb563c83a52e2f1`였다. 이 파일럿은 최종 코드 회귀와 별도다.

실제 자식 서버를 생성 시작/저장 직후 각각 SIGKILL하고 같은 데이터·상태·쿠키로 재실행했다. 두 시나리오 모두 복구 전이1·생성 시도2·최종 결과 파일1·claim4였다. 의도적 중단은 자연 종료 PASS로 세지 않는다. private `crash-receipt.json`과 실패/원 로그를 보존한다.

## 최종 검증

**실행 코드 `ab6cf0ffa4635921556f3a54353565b357185435`**, Node22.23.3/TypeScript5.8.3, 승인 브랜치 clean에서 고정했다. 이후 변경은 실행 결과·인계 문서뿐이다. 최종 원격 HEAD는 일반 Push 뒤 직접 조회한 전달 영수증과 구분한다.

| 검사 | 실제 결과 |
| --- | --- |
| `npm run check` | **1,079/1,079 PASS**, 기존1,030+신규49. fail/skip/cancel/todo0. 567.8초 |
| M2 감사 | 정상 종료, CATALOG_CONSISTENT_EVIDENCE_OPEN. 기존4정책9규칙12출처의 정합 검사이며 문헌/권리 미해결은 유지 |
| 기존 Lab/KASI Chromium | 둘 다 exit0·소유 브라우저/서버 자연 정리 |
| 신규 실제 Chromium | 최종 코드에서 PASS, 13스크린샷·8예외 미리보기·320/390/768 화면, 6장/4claim·목차·refresh·서버 재시작·타 게스트·환불 실패/재시도 |
| 원본/코드/생성물 | QA 전후 추적파일/생성물·기존4트리2,107파일/기존 export·manifest·workflow 동일. API-only5파일·기존v4 97파일은 이전 고정 영수증과 별도 비교 |
| 최종 코드 실제 HTTP/TZ | UTC/Seoul 각각19입력·12전체문서·141loopback 요청. 두 의미 SHA `d501deddffa59eb67f6372e9ca10dc836c694183dea48fcd5eb563c83a52e2f1`, S7 직접 생성 claim과 동일 |
| 실제 프로세스 중단 | AFTER_START/AFTER_STORE 각각 소유 서버 강제 종료→재시작→복구1·시도2·물리 결과1·claim4 |
| 실제 브라우저 종료 | 동일 임시 프로필로 Chrome PID33592 완전 종료→PID31964 새 실행. HttpOnly 쿠키·같은 리포트 재열람 PASS |
| 저장소 밖 S8 독립 복원 | **116파일** payload, Node22만으로 실제 웹 TEST 주문→S7 6장4claim. PATH비움/npm·Git없음·원본import/키접근/외부통신 차단, live403 |

독립팩 외부 고정 manifest SHA는 `5d1f80b2f5712d594b9200882e745f2766e8b351543c992413223ef8ff551815`다. 저장소 밖 `C:\Users\Home\AppData\Local\Temp\manseryeok-s8-web-fsIis4\engine`에 복원했고 자료/상태는 형제 디렉터리로 분리했다. 달력·키·게스트 상태는 payload에 없다. 검증기/bootstrap 자체는 신뢰하는 배포 경로에서 확보해야 하며 동일 OS 공격자가 전체 실행기와 키를 바꾸는 공격을 SHA 자체가 막는다고 주장하지 않는다.

private 증거: `qa-ab6cf0f-r2-final.json`, `browser-final-ab6cf0f/`의13PNG/영수증, `actual-UTC-final-ab6cf0f/`와`actual-Asia-Seoul-final-ab6cf0f/`, `artifact-ab6cf0f-r2-receipt.json`, `crash-receipt.json`, `browser-restart-receipt.json`는 `.private/sprint8-20261122/` 아래에 보관한다. 추적하지 않는다. 이전 실패 증거는 삭제/덮어쓰지 않았다.

추가 사전 실패: 최종 QA 호출의 SHA 인수를 잘못 복사해 실행 전 멈췄다. Git HEAD를 직접 읽게 고친 r2에서 전체 실행했다. 첫 독립 실행 probe는 Windows 경로를 `--import`에 전달해 ESM 로딩 전에 실패했고 file URL로 고쳐 새 artifact/복원 폴더에서 성공했다. 이 실패들을 PASS나 실제 엔진 실패로 섞지 않는다.

API/키 재수집·외부 LLM·실 PG·Actions·배포·실고객 데이터는0이다. 저장 암호화 키의 실제 사용과 KASI/API 키 사용0은 다르다. 개발 Git 통신·로컬 Chromium/HTTP까지 전체 네트워크0이라고 하지는 않는다. 21st CLI/catalog/review는 설치되어 있지 않아 미실행했으며 새 패키지 없이 기존 tokens/vanilla/CDP를 재사용했다. 사람의 전문가/사용자/운영 보안 검토는 미실행이다.

49,799 양음력 쌍 전수는 S5의 이전 결과로 보존하며 이번엔 재실행하지 않는다. 코어/자료/기존 생성물 불변을 비교하고 S6/S7 원국/claim 대조·전체 회귀·대표 실제 HTTP/TZ·독립 패키지로 변경 영향 범위를 검증한다. 이것은 해석의 외부 정답률·구매 가치·실제 PG 운영 인증이 아니다.

## Sprint9 인계

가상 입력을 익명 테스트 세션으로 열고 제한적/보류 상태, 실제 해석의 이해도·반복·다른 명식의 설명 차이를 검토할 도구를 제공한다. 전문가는 claim의 전제/반대조건/허용 의미를, 사용자는 읽기 흐름과 미리보기·미판매 상태·생성 실패 안내를 검토해야 한다. 실제 검토자 모집/연락/고객 입력/결제는 하지 않았다. 운영 DB·회원 복구·키관리/ACL·백업 삭제·PG·법률·콘텐츠 승인이 남아 있다.

**판정:** SPRINT8_ENGINEERING/LOCAL_E2E/PAYMENT_SIMULATION/AUTHORIZATION/RECOVERY/REPORT_PERSISTENCE/REFUND_SIMULATION은 **로컬 TEST 범위 GO**. PAID_REPORT_READY/LIVE_PAYMENT_ALLOWED/PUBLIC_RELEASE는 **NO-GO**. 고정 Sprint9/10의 수락을 대신하지 않는다.

[실행 가이드](../product/SPRINT8_LOCAL_WEB_GUIDE.md) · [PRD](../product/SPRINT8_PURCHASE_JOURNEY_PRD.md) · [상태](../product/SPRINT8_ORDER_PAYMENT_REPORT_STATE_MACHINE.md) · [API](../product/SPRINT8_SERVER_API_CONTRACT.md) · [보안](../product/SPRINT8_ACCESS_CONTROL_SECURITY.md) · [복구](../product/SPRINT8_FAILURE_RECOVERY_MATRIX.md)
