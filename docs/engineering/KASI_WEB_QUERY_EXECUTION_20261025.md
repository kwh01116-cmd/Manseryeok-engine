# KASI 키 입력·JSON 조회 페이지 — 2026-10-25 KST

## 요청과 구현 범위

사용자는 Ubuntu CLI 대신 **웹 페이지에서 일반 인증키를 입력하고 JSON으로 결과를 보는 방법**을 요청했다. 이번 요청은 Collector의 별도 로컬 조회 도구에 대한 승인으로 해석했다. 기존 Story/App/Lab UI 재설계나 공개 배포를 재개한 것이 아니다.

시작 시 로컬·원격 HEAD `f9b0fbb6f1761c74b688d0a514dcb6a3abff06a5`와 깨끗한 작업 트리를 확인했다. 같은 작업 브랜치 `agent/m1-applied-jie-slice1-20261019`를 유지했다. `src/`, 기존 Lab UI/스모크, G0/G1-P1, 계산 fixture와 엔진 지원 연도는 변경하지 않았다.

## 실제 파일과 동작

- `scripts/kasi/web.ts`: loopback 서버. 페이지의 POST에 들어온 공통 키만 사용하며 환경변수 키나 디스크 캐시를 읽지 않는다. query는 한 연도의 절기 24개 또는 1월 음양력 표본으로 제한한다. CLI의 연간/대량 수집을 페이지에서 실행하지 않는다.
- `scripts/kasi/page.html`: password 입력, 연도/자료/요청 형식 선택, JSON 표시와 다운로드. 제출 직후 키 입력란을 비우고 입력 변경 시 요청을 취소/이전 결과와 다운로드를 무효화한다. 렌더링은 textContent, 키는 URL·파일·브라우저 저장소·쿠키·로그에 넣지 않는다.
- `scripts/kasi/collector.ts`: 좁은 storage 계약과 요청별 `EphemeralStore`를 추가하고, probe가 요청된 경우 정규화 행을 포함할 수 있게 했다. 기존 CLI는 기존 Store/기본 probe 응답 계약을 유지한다. 원문·receipt·결과는 웹 요청 메모리에만 있고 서버 요청 완료 후 전역 캐시에 남기지 않는다. 이는 암호학적 메모리 지우기나 브라우저 비밀번호 관리 기능 제어를 뜻하지 않는다.
- `start-kasi-web.cmd`: Windows에서 Node 22.19+ within 22 확인 → 고정 의존성 설치 → 빌드/서버 시작. Windows에서는 브라우저 열기를 시도한다. **프로젝트 전체가 필요**하며 Node 22.23.3을 권장한다. 파일 하나나 HTML만 열면 API 중계 서버가 없다.
- `package.json`: `npm run kasi:web`, `npm run kasi:web:smoke` 추가. 새 의존성/lock 변경 없음.
- `test/kasi-web.test.mjs`, `test/fixtures/kasi-web-synthetic.mjs`, `scripts/kasi/browser-smoke.mjs`: HTTP·보안·합성 응답·실제 Chromium 검사. mock을 실제 KASI 데이터로 표현하지 않는다.

브라우저가 제3자 CORS 프록시로 키를 보내지 않도록 자체 로컬 중계를 사용한다. `127.0.0.1` 바인딩, Host/Origin/페이지 세션 토큰, no-store/CSP/nosniff/no-referrer/frame 제한, 8KB 요청, 한 번에 한 query, 60초 총 deadline, 연결 종료 취소, 기존 제한 재시도/응답 한도/전역 350ms 간격을 적용했다. 인증 오류/외부 URL은 그대로 출력하지 않고 안전한 코드만 반환한다. 공개 호스팅용 서버로 승인된 것이 아니다.

## 검증과 첫 실패 기록

코드 커밋 **`1737e342bc0dc8130c54d7908ac9daf038e1fb55`**, 테스트 커밋 및 최종 검사 SHA **`fbb163334411dbe6d81591123bbe9a5da80f4ca4`**. 이후 문서 SHA는 실행 대상 코드 SHA와 구별한다.

- Node **22.23.3**, npm **10.9.9**, TypeScript **5.8.3**.
- 신규 HTTP 테스트 최초 **5/6 PASS, 1 FAIL**: Node fetch로 임의 Host 헤더를 보내려 했지만 실제 요청에는 URL Host가 사용되어 정상 200이 반환됐다. 제품의 Host 검사를 해제하지 않고 `node:http.request`로 실제 잘못된 Host를 보내도록 테스트를 수정했다. 이후 직접 실행 검사까지 더한 신규 **7/7 PASS**.
- 기존 Collector **26/26 PASS**: storage 추상화가 CLI 저장·재개·오프라인 검증을 깨지 않음을 확인했다.
- 최종 `npm run check`: 엔진/Collector strict typecheck/build **PASS**, **325/325 Node PASS**, fail/cancelled/skipped/todo 각 **0**. 기존 318개의 assertion을 약화/삭제하지 않았다.
- Chromium **154.0.8037.57** `node scripts/kasi/browser-smoke.mjs` **PASS**: 합성 upstream에 대해 키 입력/제출 직후 비움, 실제 JSON 24행 표시·다운로드 파일, 320/360/390px 넘침 없음, 키보드 details/AX, reduced motion, 지연 응답 후 입력 변경 무효화, 브라우저 저장소·쿠키 없음, 외부 브라우저 요청 없음.
- 같은 SHA에서 기존 `node scripts/browser-smoke.mjs` **PASS**: Lab EP0–EP4 회귀 유지.
- 직접 production Node 진입점 `web.js --no-open`을 child process로 실행해 loopback 주소/페이지 HTTP 200을 확인했다. **Windows 배치/자동 브라우저 열기는 실제 Windows에서 실행하지 못해 UNVERIFIED**다. 수동 VoiceOver/NVDA도 미검증이다.
- 실제 자격을 읽거나 인증 KASI API를 호출하지 않았다. **실제 API 요청/성공 0건**; live schema, 월 pagination, 역사적 시간, 원본 판본/이용권 및 G1-P2 상태는 이 작업으로 승격하지 않는다.

## 전달 및 다음 작업

[브라우저·Windows 가이드](../KASI_COLLECTOR_GUIDE.md), DEVLOG, 인수인계와 README에 실행 경로를 안내한다. GitHub 작업 브랜치에 일반 fast-forward Push하며 main/foundation, workflow, 공개 배포는 변경하지 않는다. 실제 워크플로가 foundation 선택 경로 Push만 허용하는지 재확인한다. 문서 커밋/최종 원격 SHA는 Git 이력과 작업 결과에서 확인한다.

사용자 PC에서 프로젝트 ZIP을 풀고 Node 22 설치 후 `start-kasi-web.cmd`를 실행하면 된다. 실행 창을 유지하고 페이지에 키를 직접 입력한다. 다음 검증은 **실제 Windows 실행**과 사용자 승인/네트워크가 있는 환경의 1950/2026 실제 표본 응답이다. 저장소/채팅에 키를 전달하지 않는다. 공개 URL 서비스가 필요하면 별도 보안·배포 범위 결정이 필요하다.
