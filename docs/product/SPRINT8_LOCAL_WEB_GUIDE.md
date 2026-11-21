# Sprint 8 로컬 웹 실행

가상 입력만 사용하는 **구매 여정 시뮬레이터**다. 실제 판매 가격·PG·실결제·공개 배포는 없다. S7 콘텐츠는 PARTIAL, PAID_REPORT_READY/LIVE_PAYMENT_ALLOWED/PUBLIC_RELEASE는 NO-GO다.

## 저장소에서 시작

Node 22와 고정 의존성이 이미 설치된 작업 폴더에서 실행한다. API-only 데이터팩은 별도로 확보한 서버 비공개 자료이며 Git/브라우저로 배포하지 않는다. 데이터팩 지문은 기존 로더가 외부에 고정한 값으로 검증한다.

```powershell
Set-Location 'C:\Users\Home\Desktop\만세력 엔진\source'
$s8Node = 'C:\Users\Home\Desktop\Manseryeok-KASI-1950-2026-windows-x64\Manseryeok-KASI-1950-2026\runtime\node.exe'
& $s8Node node_modules/typescript/bin/tsc -p tsconfig.json
& $s8Node node_modules/typescript/bin/tsc -p tsconfig.kasi.json
& $s8Node scripts/purchase/web.mjs `
  --data-pack '.private/sprint5-20261115/api-only-pack-review-a' `
  --state-dir '.private/sprint8-local-state' `
  --mode local-test --port 8788
```

로컬 주소: **http://127.0.0.1:8788**. 다른 PC/공개 Host는 허용하지 않는다. 종료는 Ctrl+C. 같은 state-dir과 브라우저 쿠키로 다시 실행하면 주문/결과를 재열람한다. 시크릿 창은 다른 게스트다. 쿠키 삭제·24시간 세션 만료 뒤 로그인 없는 장기 복구는 보장하지 않는다. 재열람은 처음 발급한 세션의 권한으로만 가능하다.

예제 채우기 → 입력/정책 확인 → 무료 미리보기 → 별도 TEST 구매 → 테스트 승인 → 생성/검증 → 리포트 → 보관함 순서다. 실제 판매 버튼은 비활성이고 서버도 거절한다. 환불 요청 뒤 테스트 검토/실패/재시도를 할 수 있으며 요청 시점부터 콘텐츠 접근을 회수한다. 실제 법적 환불 정책을 확정한 것이 아니다.

## 키·보관

state-dir에는 처음 실행할 때 만들어진 **로컬 저장 암호화 키 파일**, 암호화 상태와 결과가 생긴다. KASI/API 키가 아니며 서버만 읽는다. Git 추적/고객 공유/스크린샷에 포함하지 않는다. 키를 잃으면 복구할 수 없다. Windows ACL·운영 비밀 관리·백업/삭제/DB/실제 인증은 별도 준비가 필요하다. 테스트 결과는 7일, 세션은 기본 24시간의 기술상 설정이며 법정 보존기간이 아니다. 명시적 삭제는 현재 파일만 삭제하고 백업/보안 삭제를 보장하지 않는다.

동시에 두 서버가 같은 state-dir을 사용할 수 없다. 죽은 PID가 확인된 writer만 복구한다. 시작 중 강제 종료로 `startup.guard`가 남거나 잠금 내용이 불명확하면 자동 삭제하지 않고 운영자 검토로 실패한다. 기존 자료를 clean/reset/delete로 해결하지 않는다.

## 내부 독립 패키지

```powershell
& $s8Node scripts/purchase/artifact.mjs --out '.private/sprint8-internal-engine'
# BUILT 응답의 manifestSha256를 별도 신뢰 기록에 고정한다.
# 아래 $s8ManifestPin은 그 기록의 값이며 대상 파일에서 읽어 기대값으로 만들지 않는다.
$s8ManifestPin = '<builder 응답에 고정한 SHA-256>'
& $s8Node '.private/sprint8-internal-engine/restore-web.mjs' `
  --manifest-sha $s8ManifestPin --out '<새 복원 엔진 디렉터리>'
& $s8Node '<새 복원 엔진 디렉터리>/run-web.mjs' `
  --manifest-sha $s8ManifestPin --data-pack '<별도로 검증된 API-only 팩>' `
  --state-dir '<엔진과 팩 밖의 비공개 상태 디렉터리>' --mode local-test --port 8788
```

독립 payload는 S7/S8·정적 UI와 고정 vendor만 포함하고 달력/키/고객 상태를 포함하지 않는다. Node 22 이외 npm/Git·원본 저장소 import·외부 서비스 호출이 필요 없다. 파일 추가/누락/변조를 검증한 뒤 서버를 import한다. 배포 승인이나 운영 DB/PG 준비를 뜻하지 않는다. 기존 v4는 그대로 보존하며 v4에 S7/S8가 포함됐다고 하지 않는다.

## 검증

```powershell
& $s8Node --test test/sprint8-state.test.mjs test/sprint8-vault.test.mjs test/sprint8-web.test.mjs test/sprint8-artifact.test.mjs
$env:CHROME_BIN = 'C:\Program Files (x86)\Google\Chrome\Application\chrome.exe'
& $s8Node scripts/purchase/browser-smoke.mjs `
  --data-pack '.private/sprint5-20261115/api-only-pack-review-a' `
  --evidence-dir '.private/sprint8-browser-new-run'
```

실행 영수증·스크린샷은 [실행 기록](../engineering/SPRINT8_EXECUTION_20261122.md)에 구분한다. 공개 테스트는 합성 fixture이고 실제 자료·브라우저 검사는 별도 명령이다. 실행하지 않은 검사를 PASS로 세지 않는다.
