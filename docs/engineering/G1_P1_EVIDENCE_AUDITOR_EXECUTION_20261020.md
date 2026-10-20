# G1-P1 절기·음력 행별 증거 감사 모듈 — 2026-10-20

**구현 코드 SHA:** [4efa763](https://github.com/kwh01116-cmd/Manseryeok-engine/commit/4efa763edab36b5386a5d51ee2c838e131f90694)

**상태:** REPORT_ONLY_IMPL / TARGETED_NODE_TESTS_PASS / EXACT_REPOSITORY_FULL_CHECK_NOT_RUN / ORIGINAL_ROWS_UNVERIFIED / NO_G0_INTEGRATION.

> 위 상태와 아래 초기 실행 기록은 별도 환경에서 작성한 당시 증거다. **2026-10-20 Codex exact-checkout 추가 검증**은 이 문서 마지막에 별도로 기록했다. 최신 결과는 전체 292/292 + 실제 Chromium PASS이며, 원본 행 미검증과 P2 NO-GO는 유지한다.

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

## 2026-10-20 — Codex 실제 저장소 전체 검증 추가 기록

**실행자:** 이 작업의 Codex. **정확한 테스트 대상 SHA:** `9916d6cae8c7fd4ecb2d57818c55a96043d49116` (원격을 새로 fetch한 작업 브랜치 HEAD). P1 구현 커밋 `4efa763edab36b5386a5d51ee2c838e131f90694`를 포함한다. 깨끗한 로컬 작업 트리에서 `agent/m1-applied-jie-slice1-20261019`만 fast-forward한 뒤 실행했다. 새 문서 커밋은 이 검증의 대상 SHA와 구분한다.

| 검사 | 실제 환경 / 실행 | 결과 |
| --- | --- | --- |
| 런타임 | Node **22.23.3**, npm **10.9.9**, TypeScript **5.8.3** | Node 22 확인 |
| 고정 의존성 설치 | Node 22 PATH에서 `npm ci --cache /tmp/manseryeok-npm-cache --no-audit --no-fund` | PASS, 잠금 파일 변경 없음 |
| 전체 검사 | `npm run check` → TypeScript typecheck → build → `node --test test/*.test.mjs` | **292 tests / 292 pass / 0 fail / 0 cancelled / 0 skipped / 0 todo** |
| 실제 Lab 브라우저 | Chromium **154.0.8037.57**, `node scripts/browser-smoke.mjs` | **PASS**, loopback HTTP 및 EP0–EP4 |
| P1 감사 직접 실행 | 실제 빌드된 49개 절기·37개 월 자료 + JSON manifest를 `auditG1EditionEvidence`에 전달 | `REPOSITORY_CONSISTENT_ORIGINAL_ROWS_UNVERIFIED`; 원본 검증 **0**, 권리 `UNVERIFIED` |

전체 292개는 기존 283개에 P1 9개가 포함된 **실제 실행 결과**다. 첫 실행에서 모든 검사가 통과하여 코드/테스트 수정이나 재시도는 필요 없었다. 앞선 별도 환경의 9/9 결과를 더해서 통과를 추정한 것이 아니다.

Chromium은 양력·음력 동등성, 입춘/경칩의 후보·이벤트·factRef 분리, 선택 정책, 잘못된/교환된 응답, 입력 변경/지연 응답 무효화, 320/360/390px, 키보드·AX 및 reduced motion을 검증했다. 수동 VoiceOver/NVDA, 외부 원본 인증·역법/권리 검증을 수행한 것은 아니다. 실제 화면 캡처나 새 UI는 추가하지 않았다.

**보존 범위:** G0, 계산 fixture/manifest, M2, Lab UI, 브라우저 스크립트, 지원 연도(기본 2026–2027), 기존 테스트/검증 기준을 변경하지 않았다. 이번 수정은 검증 기록 문서뿐이다. KASI 인증키를 읽거나 API를 호출하지 않았다.

### G1-P2 판정: NO-GO — 실행 게이트만 해소됨

- **해소:** 정확한 checkout의 설치·빌드·전체 회귀·실제 Chromium 게이트.
- **미해소:** manifest의 **86/86행**이 `UNVERIFIED_ORIGINAL_ROW`, 검증된 원본 행 **0개**, 페이지 후보 3개의 `originalDocumentSha256` 모두 `null`이다. 페이지 생성 메타데이터와 저장소 digest 일치만으로 실제 행의 특정 원본 판본을 인증할 수 없다.
- 따라서 기존 P0/P1의 원본 증거 게이트를 낮추어 G0 trusted 경계에 통합하지 않는다. **P2를 구현하지 않았으며**, report-only P1의 실행 검증 통과를 원본 인증 통과로 승격하지 않는다. 이용 권리 `UNVERIFIED`와 공개 배포 승인은 별도 열린 게이트다.
- 다음은 2025 대설 guard, 2026/27 각 24절기 및 37개월의 실제 원본 위치·판본·값·정밀도·취득 이력을 확보/대조하는 일이다. 허용되는 원본 파일을 확보한 경우 그 지문을 기록하고, 누락/불일치는 미검증으로 남긴 뒤 P2를 재평가한다. 이번 작업은 외부 원본 수집까지 확대하지 않았다.

검증 결과는 [누적 개발 일지](../DEVLOG.md)에 날짜별 추가 기록으로 남기고 인수인계·로드맵의 다음 작업을 갱신한다. 실제 워크플로는 foundation 브랜치의 선택 경로 Push만 트리거하므로 현재 작업 브랜치 문서 Push와 일치하지 않는다. Push 전 재확인하며 Actions 실행·main/foundation 변경·force push·공개 배포는 하지 않는다. 최종 문서 커밋과 원격 HEAD는 Git 이력 및 작업 결과에서 확인한다.
