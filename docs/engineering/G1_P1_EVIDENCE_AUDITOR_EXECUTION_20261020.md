# G1-P1 절기·음력 행별 증거 감사 모듈 — 2026-10-20

**구현 코드 SHA:** [4efa763](https://github.com/kwh01116-cmd/Manseryeok-engine/commit/4efa763edab36b5386a5d51ee2c838e131f90694)

**상태:** REPORT_ONLY_IMPL / TARGETED_NODE_TESTS_PASS / EXACT_REPOSITORY_FULL_CHECK_NOT_RUN / ORIGINAL_ROWS_UNVERIFIED / NO_G0_INTEGRATION.

## 문제와 해결 범위

G0는 서버 자체의 선택된 절기 데이터와 명식 후보의 일관성은 보장하지만, 개별 절기와 음력 월 시작일 각각이 **특정 원본 자료 판본에서 실제로 전사됐음**을 입증하지는 않는다. KASI API 환경 설정 실패를 막는 작업 대신, 인증키가 없는 환경에서 가능한 최소한의 독립 감사 검사를 구현했다.

새 파일은 세 개다.

- **scripts/g1-evidence-audit.mjs**: 별도 감사 manifest와 저장소에 고정된 SHA-256 자료를 읽어 자료 ID, 판본 후보, 지문, 원본 미검증 상태, 각 행 정체성, 특별 경계를 검사한다.
- **test/fixtures/g1-evidence-manifest-2026-2027.json**: 2025년 대설 guard 1건, 2026/27년 절기 48건, 2025/26/27년 음력 시작일 37건의 행 ID를 별도로 기록한다. KASI 페이지 세 개의 생성판본은 후보 메타데이터로만 보존한다. 원본 파일 해시는 null, 원본 행의 확인 상태는 86개 모두 UNVERIFIED_ORIGINAL_ROW, 이용 권리는 UNVERIFIED다.
- **test/g1-evidence-audit.test.mjs**: Node 기본 테스트 러너 기반 정상/조작 검사 9그룹. 기존 npm test glob에 포함된다.

## 주요 반례

절기 시각 1분 변조, 가짜 출처 문자열, KST/MINUTE 표기 격상, guard/2027 말단 절기 누락, 입춘 연도별 행 교환, 알려지지 않은/다른 연도의 생성판본, 근거 없는 외부 원본 해시, 허위 ORIGINAL_ROW_VERIFIED·권리 승인 상태, 2025년 윤6월, 월 크기·음력 자료 corpus ID 변경, 음력 2025년 12월(양력 2026-01-19 시작)과 2026년 12월(양력 2027-01-08 시작)의 판본 오귀속, 잘못된 schema/중복 행 등을 거부한다.

**무엇을 보증하지 않는가:** 일치 결과 REPOSITORY_CONSISTENT_ORIGINAL_ROWS_UNVERIFIED는 사전 고정한 *GitHub 저장소 데이터와 별도 manifest가 서로 일치*한다는 뜻이다. KASI 원본 86건의 직접 대조, 독립 천문 계산, 저작권·상업권 승인, 정부 공식 인증 또는 외부 공격자에 대한 암호학적 증명은 아니다. 이 로직은 기존 G0 계산 경로와 연결하지 않았다.

## 실제 검증 증거

- Node **22.16.0**, 외부 다운로드 불가능한 별도 작업 폴더.
- **node --check** 감사 모듈과 테스트 문법 검사 PASS.
- **node --test** 집중 검사 **9/9 PASS**, 실패·건너뜀 0.
- GitHub 소스에서 수동으로 재구성한 49개 절기·37개 음력 월 자료의 표준 직렬화 SHA-256이 기존 repository pin 두 개 (15363d49…, d0dc8222…)와 각각 정확히 일치하는 것을 확인했다.
- 새 코드/테스트/JSON 원격 파일이 연결된 GitHub에서 존재하고 크기 5943, 5203, 10246글자로 검증되었다.
- **미실행:** 정확한 GitHub checkout에서 npm ci, npm run check(이전 283개 포함), 실제 Chromium 스모크. 환경에서 github.com DNS 조회 실패로 직접 checkout을 할 수 없었다. 새 9개 테스트를 기존 283개와 합쳐서 '전체 292개 통과'라고 주장하면 안 된다.
- API 키 불사용, KASI API 실호출 없음, fixture와 G0/M2/Story UI·지원연도 변경 없음.

## 다음 검증 게이트

1. Codex의 정상 checkout에서 최신 작업 브랜치에 대해 Node 22, npm ci, npm run check, node scripts/browser-smoke.mjs 실행. 결과를 **정확한 코드/문서 SHA**와 함께 별도로 기록한다.
2. 원본 KASI 자료 페이지의 행별 판본·파일 원문 SHA·실제 값·사용 권리를 별도로 검증한다. 원본을 확보하지 못하면 ORIGINAL_ROW_VERIFIED로 승격하지 않는다.
3. 전수가 검증되고 실제 저장소 전체 검사도 통과한 뒤에야 P2(G0 trusted 경계 선택적 통합)를 검토한다. 성급하게 G0 코드를 변경하지 않는다.

참조: [G1-P0 감사](../research/G1_EVENT_MONTH_EDITION_EVIDENCE_AUDIT_20261020.md), [fixture digest 설명](../research/M1_CALENDAR_FIXTURE_DIGEST.md), [권리 검증 게이트](../research/CALENDAR_SOURCE_COMMERCIAL_RIGHTS_GATE_20261018.md).
