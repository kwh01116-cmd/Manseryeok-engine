# Windows 로컬 KASI 수집 진단 기록

2026-11-09 KST, 실행자 Codex. 로컬 checkout은 작업 브랜치 `agent/kasi-local-1950-2026-20261109`의 `acd3e19d35e693d39c1b293e6de74246f8a74786`이다. 실행 런타임은 기존 portable의 Windows Node v22.23.3이다.

## 직접 확인한 결과

- 기존 1950년 절기 원문과 receipt를 작업 checkout의 `.private/kasi-local-1950-2026/monthly-xml/`에 복사했다. 복사본의 원문 SHA-256은 `897f540be2a72a113cde922ad017c448accb24632d8413edcfed0eeeb60888a2`와 일치했다. 원래 portable 캐시를 읽고 별도의 복사본에서 이어갔다.
- 작업 폴더 바깥에 이미 존재하던 KASI 인증키 파일을 프로세스 내부에서 읽어 기존 `Client`, `Collector`, `runLocal`에 전달했다. 새 키 파일이나 키를 포함한 실행 인자를 만들지 않았다.
- 기본 샌드박스 실행은 1950년 절기 캐시를 재사용한 뒤, 음양력 요청에서 `NETWORK_ERROR`로 끝났다. transport 시도 수는 3회였고 서버 응답은 확보하지 못했다.
- 네트워크 승인 후 같은 `samples` 단계는 1950년 음양력 요청의 `HTTP_ERROR`로 끝났다. 전체 상태는 `FAILED`다.
- 오류 본문을 출력하지 않는 1회 진단에서 음양력 `getLunCalInfo`, 1950년 1월, `ServiceKey` 요청은 HTTP 403, `returnReasonCode=30`, `SERVICE_KEY_IS_NOT_REGISTERED_ERROR`였다.
- 같은 키로 특일 `get24DivisionsInfo`, 1950년 요청은 HTTP 200, `resultCode=00`, 24행이었다. 이 비교 진단 응답은 캐시에 추가하지 않았다.
- 음양력의 키 파라미터 이름만 `serviceKey`로 변경한 1회 비교에서도 HTTP 403, 코드 30이었다. 인증키 값은 교체하지 않았다.
- 기존 Collector로 1950년과 2026년 절기 probe가 모두 `SAMPLE_RESPONSE_VALIDATED`, 각 `minuteRows=24`였다. 1950년의 `published2400Rows=1`, 2026년은 0이었다. 새 요청은 2026년 1회이며 원문과 receipt를 같은 작업 캐시에 저장했다.

위 네트워크 승인 실행에서 확보한 서버 응답은 5회다. 특일 성공 2회, 음양력 실패 3회이며, 이 중 2회는 별도 진단으로 코드 30을 직접 읽었다. 샌드박스의 네트워크 실패 3회는 별도다.

## 현재 판단과 한계

현재 키는 특일 API에서 실제로 동작한다. 음양력 API의 코드 30은 해당 서비스의 활용신청·승인·키 등록 상태를 확인해야 하는 근거다. 계정 상태를 직접 읽기 전에는 미신청, 승인 동기화 지연, 다른 등록 문제 중 하나로 확정하지 않는다. HTTP 파라미터 대소문자만 바꾸는 비교는 같은 오류로 끝났다.

Chrome의 음양력 서비스 페이지에서 로그인으로 이동했다. 아이디·비밀번호와 보안문자 입력이 필요한 상태이며 사용자 로그인 완료를 기다린다. 서비스 승인 현황은 아직 확인하지 못했다. 음양력 표본과 두 연도 전체 수집, 77년 수집·검증·export는 미완료다.

앞선 합성 시험은 Windows ConPTY 입력 payload 시험이었다. 정상 합성 문자열은 통과했고 Ctrl+V 제어문자만 전달한 뒤 Enter, 선행 줄바꿈, 빈 Enter에서는 입력 검증 오류가 재현됐다. native 콘솔의 실제 Ctrl+V/우클릭 동작은 수동 테스트 미완료다. 이번 실제 API 요청은 파일 입력 경로로 수행했다.

브라우저 탭 목록을 확인하는 과정에서 사용자의 기존 탭에 있던 키 포함 URL이 도구 출력에 노출됐다. 이 보고서에는 그 URL이나 키 값을 복사하지 않았다. 후속 탭 확인에서는 인증 쿼리와 키가 포함될 수 있는 제목을 출력 대상에서 제외해야 한다.

## 실행 자료와 코드 식별

작업 폴더의 `diagnostics/run-local-collection.mjs`가 portable의 기존 수집기를 호출한다. `samples`, `collect --allow-bulk`, `validate`, `solar-probes` 단계가 있으며 월 단위 XML 저장 폴더를 고정했다. `diagnostics/diagnose-kasi-response.mjs`는 재시도 없이 HTTP 상태와 허용한 오류 코드만 기록하는 별도 진단이다.

두 진단 스크립트의 `node --check`는 통과했다. repo의 엔진·Collector TypeScript는 수정하지 않았다. 전체 375개 테스트의 이번 로컬 재실행은 미수행이다. 과거 Linux 실행 기록과 이번 Windows 실제 API 결과를 구분한다.

실행한 portable 모듈의 SHA-256은 아래와 같다.

| 파일 | SHA-256 |
| --- | --- |
| local.js | a754481eca0878b880b2ca82f92b212dfcd8fb56cfc976b6e9299d0b37b1313d |
| collector.js | 7682c847932f42356e4c84784961b9995ad4cf36f3b1e5637bef340244a9927e |
| schema.js | 9edc548f8f2f11516932adde9af3391118e0fdaac9ac851d11497d1b0549314e |

다음 단계는 로그인한 포털에서 음양력 서비스 등록 상태를 확인하고 필요한 승인 문제를 해결한 뒤 같은 캐시로 `samples`를 재개하는 것이다. 두 연도 전체 표본 검증이 통과해야 1950~2026 전체 수집 단계로 진행한다. 원본 판본·역법 해석·권리·엔진 지원 범위의 검증 상태는 이번 API 표본 통과로 승격하지 않는다.
