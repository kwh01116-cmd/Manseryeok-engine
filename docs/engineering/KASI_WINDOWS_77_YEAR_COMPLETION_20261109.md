# Windows KASI 1950~2026 수집 완료 기록

2026-11-09 KST, 실행자 Codex. 사용자가 포털 로그인과 음양력 서비스의 라이선스 동의·활용신청 제출을 승인하고, 최종 확인 후 수집 재개를 요청했다.

## 실제 완료 결과

2026-11-09 22시 48분 KST에 77년 수집과 전수 원문 재검증이 완료됐다. 이후 22시 49분 KST에 별도 `validate` 단계도 추가 API 요청 0회로 완료됐다.

| 항목 | 확인 결과 |
| --- | --- |
| 양력 범위 | 1950-01-01~2026-12-31 |
| 연도 수 | 77 |
| 절기 행 | 1,848 |
| 음양력 일별 행 | 28,124 |
| 원문 파일 / 페이지 receipt | 각각 1,001 |
| 연간 파일 | 77 |
| 제공 시각 24:00 표기 | 1 |
| API가 비워 둔 윤달 월간지 | 816행, `ganji.month=null` |
| 최종 정규화 버전 | 0.1.2 |
| 상태 | COMPLETE |

출력은 로컬 checkout의 `.private/kasi-local-1950-2026/monthly-xml/`에 있다. `export.json`은 12,063,546 bytes이며 SHA-256은 `7b5584aca339b85c7e54e953c43b672358bda605a478831b6f260df00472e851`이다. 원문·receipt·연간 파일과 함께 보존해야 재검증과 재개가 가능하다.

기존 1950년 원문의 SHA `897f540b…`를 복사 후 확인하고 재사용했다. 수집 재개 시 저장된 페이지를 삭제하지 않았다. 이전에 확보한 절기 2페이지, 이번 두 표본 수집의 24페이지, 첫 전체 실행의 20페이지, 수정 후 재개의 955페이지가 합쳐져 1,001페이지가 됐다. 별도의 인증 진단 요청은 이 페이지 수와 구분한다.

## 인증 반영과 실제 응답 결함

포털 최종 확인 후 음양력 1950년 1월 요청이 HTTP200/result00/31행으로 성공했다. 1950·2026 두 연도 전체가 `SAMPLES_READY`를 통과한 뒤 전체 수집을 시작했다.

첫 전체 실행은 1952년 6월의 `GANJI` 검사에서 멈췄다. 저장된 원문 SHA `96a931a42db47d76ff7af5527107242ecabf93a58d2769b9fc6ea2bc5f3f7942`에서 6월22~30일은 `lunLeapmonth=윤`, `lunMonth=05`, `lunWolgeon`이 빈 문자열이었다. 연간지와 일간지는 반환돼 있었다. 이를 잘못된 간지 문자열로 거절하던 기존 수집 계약을 좁게 보완했다.

0.1.2는 윤달에서 실제 문자열 필드가 비어 있을 때만 월간지를 null로 보존한다. 평달의 빈 월간지, 필드 누락·null 입력, 빈 연간지·일간지, 잘못된 문자열은 계속 거절한다. 제공된 정상 월간지 문자열은 윤달에서도 그대로 보존한다. 값의 의미를 추정하거나 다른 달의 값을 채우지 않았다.

0.1.0·0.1.1 캐시는 원문부터 재구축한 데이터·지문·receipt가 버전 라벨 외 동일할 때 읽는다. 이전 파일은 덮어쓰지 않고 검증 결과와 전체 export는 0.1.2를 사용한다. 과거 버전 라벨이 새 null 표현을 주장하면 `LEGACY_YEAR_HAS_NEW_GANJI_NULL`로 거절한다. 원래 24:00의 과거 버전 제한도 유지한다.

## 코드와 검사

수집 동작 수정 커밋은 `d0fc4de5b00d51f43ae7e8f4b9829bbd8afb3e5b`이다. 최종 코드·테스트 커밋은 `9bb92979418b75f5c588d72977d0fff93ad4099b`이며, 두 커밋 사이의 제품 TypeScript는 동일하다. 두 번째 커밋은 Windows에서 기존 검사를 실행할 수 있도록 파일 모드 기대값과 테스트 preload 모듈의 file URL만 보완했다.

실행 환경은 Windows10, Node22.23.3, npm11.12.1, TypeScript5.8.3, Chrome154.0.8037.98이다. Node는 portable 실행 파일을, 의존성은 checkout의 package-lock 기반 `npm ci --no-audit --no-fund`를 사용했다.

- 신규 회귀 5개를 수정 전 실행해 2 PASS/3 FAIL로 GANJI 거절을 재현했다. 초안의 테스트 저장 디렉터리 초기화 누락은 먼저 고쳤다.
- 정규화 수정 후 신규 회귀와 기존24:00 회귀는 14/14 PASS였다. 실제 1952년6월 원문도 네트워크 없이 30행을 재검증했고 null 월간지9행을 확인했다.
- 첫 Windows 전체 검사는 377/380이었다. POSIX 전용600 모드 기대값1개와 Windows 절대경로 `--import` 2개가 실패했다. Node의 Windows 권한 모델을 반영하고 `pathToFileURL`을 사용한 뒤 관련40개가 모두 통과했다. 기존 네트워크 차단·비밀 비노출 검사는 유지했다.
- 최종 `npm run check`는 정확한 커밋 `9bb9297…`에서 **380/380 PASS**, fail/cancel/skip/todo 각0이었다.
- 기존 KASI 웹의 실제 headless Chrome 합성 upstream 검사는 PASS였다. 키 입력란 비우기,24행 JSON, 다운로드, 모바일 폭, 키보드·접근성, 오래된 응답 무효화, 브라우저 저장소 미사용을 검사했다. 이 검사는 합성 API를 사용한다.
- 별도로 실행한 Lab 브라우저 검사는 Windows 임시 Chrome 프로필의 `CrashpadMetrics-active.pma` 정리 중 EBUSY로 종료1이었다. 정리 오류가 앞선 오류를 가릴 수 있고 PASS 출력도 없었으므로 이 실행을 성공으로 계산하지 않았다. 이번 작업은 엔진·Lab UI를 변경하지 않았다.

실행 로그는 비공개 `.private/windows-check-20261109.log`, `windows-check-final-20261109.log`, `windows-portability-focused.log`, `windows-offline-validate-20261109.log`, `windows-kasi-browser-smoke.log`, `windows-lab-browser-smoke.log`에 있다. 작업 폴더의 `diagnostics/collection-verification.json`에는 행 수·범위·파일 수·export 지문을 따로 확인한 결과가 있다. 전체 export와 원문에서 현재 인증키의 인코딩 변형을 검사한 결과 비밀 포함은 검출되지 않았다.

## 검증 경계

COMPLETE는 API 날짜 범위의 구조·완전성 및 로컬 원문 해시 일치를 뜻한다. 제공기관의 서명, 별도 역서 판본과의 독립 대조, 상업 이용권 검토는 별개다. `externalOriginalVerification`과 `rightsReview`는 UNVERIFIED다. 1950년 출생자 명식 지원, 역사적 표준시·DST 해석, 제공24:00의 경계 해석, G1-P2 승격은 이번 수집 완료로 바꾸지 않는다.
