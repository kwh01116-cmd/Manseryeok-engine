# 비엔진 검증 작업 실행 보고 — 2026-11-07 UTC

## 범위와 기준

사용자는 Cloud API 진단을 보류하고 로컬에서 자료를 제공하기로 했으며, 수면 중 가능한 비엔진 검증 작업의 구현·검사·기록·승인 브랜치 일반 Push를 승인했다. API/키 사용, M1 계산·지원범위, P2, 새 Story/EP5/디자인, 배포·Actions·환경/결제 변경은 제외했다.

시작 로컬·원격 `667f2a98d37f726cfaf7dfd91fd594063d36260f`, 깨끗한 `agent/m1-applied-jie-slice1-20261019`. 원래 초기 `work` 체크아웃은 보존하고 별도 승인 브랜치 복제본에서 진행했다. 필수 문서·현재 코드·기존 Collector/웹·M2 정책 문서를 재확인했다.

## 작업 1 — 로컬 응답 한 장의 오프라인 인수 검사

**문제:** 기존 `validate`는 자체 수집 캐시의 raw/receipt/연간 파일 계약을 검사한다. 사용자가 다른 로컬 프로그램에서 전달한 응답 한 장을 바로 평가하거나, 빈 응답/부분 페이지/날짜만 있는 응답을 별도로 인계하는 경로는 없었다.

**구현:** `scripts/kasi/intake.ts`, `npm run kasi:intake`, 독립 합성 테스트 10개, [사용 가이드](../KASI_LOCAL_INTAKE_GUIDE.md). 기존 `schema.ts`를 재사용하지만 `collector.ts`/transport/키/엔진은 import하지 않는다. 2MB UTF-8 일반 파일 한 장, 명시적 서비스·날짜 범위, 페이지·중복·완전 범위·정밀도 검사를 제공한다. 자동 다음 페이지/파일 병합/원문 수정은 없다.

**보안·판정:** 원문/경로/알 수 없는 field 이름·값/오류 message는 출력하지 않고 유한 열거값과 검증된 필드만 요약한다. 정상/날짜전용/부분/빈 응답/거절을 구분한다. 네트워크 연결을 예외로 막은 자식 프로세스에서 CLI가 정상 동작했고, 합성 자격값·오류 경로·원문 메시지 비노출 및 파일 무변경을 검사했다. 원문은 공유해도 안전하다고 인증하지 않는다. 원문 SHA는 만들지 않으며 정규화된 달력 필드만의 SHA를 사용한다. 모든 출처·권리 상태는 UNVERIFIED, yearComplete/지원/P2 승격은 false다.

**직접 실행자:** 이 Cloud 작업의 Codex. 코드·테스트·가이드 커밋 **`4026bdb7e8c2ae37d3d943726be29539e872e4b4`**에서 다음 검사를 실행했다. 문서 후속 커밋은 새 코드 검사 대상이 아니다.

| 검사 | 결과 |
| --- | --- |
| Node / npm / TypeScript | 22.23.3 / 10.9.9 / 5.8.3 |
| `npm run check` | 종료 0, typecheck/build, **335/335 PASS**, fail/cancel/skip/todo 모두 0 |
| `node scripts/browser-smoke.mjs` | 종료 0, 실제 Chromium 154.0.8037.57, Lab EP0–EP4 PASS |
| `npm run kasi:web:smoke` | 종료 0, 실제 Chromium + synthetic upstream PASS |
| Git status, M1·기존 Collector/웹 diff | 테스트 후 clean; 기존 파일·계산 변경 없음 |

첫 집중 검사 10/10, 전체/브라우저도 첫 실행에 통과했다. 기대값 완화나 실패 은폐 수정은 없었다. 본 작업에서 실제 API 요청은 **0회**. 실제 사용자 응답 파일 검수·Windows 실기·외부 원본/권리 확인은 미실행이다.

실행 로그는 작업 환경 `/tmp/manseryeok-overnight-logs/`에 있다. 아래 지문은 재검토용이며 로그 파일의 영구 호스팅을 보장하지 않는다.

| 로그 | SHA-256 |
| --- | --- |
| `intake-check.log` | `13caebfa3f751fadd3e822ef714866015d04e69eddc056733ece7af6aafbf41c` |
| `intake-kasi-web.log` | `a3e70dccec4f13b2d8c9cac4920e0638b4af23224a82463c0532d0a7da420b8b` |
| `intake-lab.log` | `d7b0874ef489044e8a71d8524b841d0ae1c24681164731f8c546d3bb4e531066` |

## 직전 API 진단과 이번 결정의 구분

같은 Cloud 세션의 앞선 사용자 승인 진단에서는 총 8회 전송 시도, 재시도 0, 성공 0이었다. 최초 1회는 HTTP 400만 확보했고, 이후 7회는 HTTP 400 / 제공자 코드 10 `INVALID_REQUEST_PARAMETER_ERROR`를 확인했다. 마지막 pageNo 없는 2026 절기 요청도 같았다. 로컬 성공은 사용자 보고이며 이 작업이 재현한 사실이 아니다. 키/원문/인증 URL은 이 문서에 기록하지 않는다. 원인이 규명되거나 고쳐진 것으로 표현하지 않고 **사용자 결정에 따라 API 진단 보류**, 로컬 자료 인수 검증으로 전환했다.

## 유지한 게이트

M1 기본 2026–2027, G1 원본 행 0/86·파일 지문 0/3, P2 NO-GO, M2 학교별 정책·원전 비평 미완료, 권리·외부 정확성·배포 게이트를 유지한다. 로컬 파일 구조 PASS는 실 API 성공이나 수집·원본 인증을 증명하지 않는다.
