# Sprint 7 로컬 결과 저장 계약 v0.1

이 계약은 가상 사용자·합성 출생정보로 실행하는 **명시적 로컬 저장**이다. 운영 회원 인증·DB·주문·결제권한·고객정보 수집은 구현하지 않는다. [고정 로드맵](SAJU_ROADMAP_LOCKED_V1_20261115.md)의 Sprint 7 결과 저장 범위이며, Sprint 8이나 공개 서비스를 앞당기는 승인이 아니다.

- 모듈: `scripts/product/report-store.mjs`
- 저장 레코드: `saju-local-encrypted-report-store-v1` / `0.1.0`
- 디스크 envelope: `saju-local-encrypted-report-file-v1`
- Node 22 내장 `fs`·`crypto`만 사용한다. 네트워크·npm 설치·외부 DB·LLM 호출은 없다.

## 입력과 발급 경계

`createLocalReportStore({directory,encryptionKey,indexKey,validateReport,now?,maxRecordBytes?})`는 기존에 저장한 결과를 명시적으로 다시 읽을 수 있는 handle을 만든다. 리포트 생성만으로 이 함수를 호출하거나 파일을 자동 저장하지 않는다.

`directory`는 운영자가 선택한 비공개 전용 경로다. `actorId`는 앞단이 인증해 주입하는 불투명한 로컬 사용자 ID다. **클라이언트가 보낸 actorId 문자열만 신뢰해 사용자를 인증하는 기능이 아니다.** 이 모듈에 실제 회원·세션·결제권한 검사는 없다. OS 사용자 권한/Windows ACL도 별도로 운영자가 설정해야 한다. Unix `0700`/`0600` 모드는 Windows ACL 구성을 대신하지 않는다.

`encryptionKey`와 `indexKey`는 서로 다른 32byte `Buffer`로 메모리에 주입한다. 키 파일·환경변수 검색·기본 키·키 로그는 없다. handle은 복사한 키만 보유하며 `close()`가 자체 복사본을 지운다. caller가 가진 키 버퍼는 바꾸지 않는다. 키 보관·복구·회전·운영 secret manager는 이번 구현 범위가 아니다. 키를 잃으면 암호문을 복원할 수 없다.

`validateReport(report,versions)`는 동기 함수로 `true` 또는 throw 계약이다. 저장 전과 복호화한 재열람 때 모두 호출한다. 호출자는 원 projection으로 보고서/claim/서술을 재구성해 대조하는 검증기를 제공해야 한다. 저장 모듈은 임의 JSON의 명리 타당성·API 발급·원천 자료·G0 진위를 인증하지 않는다. validator가 바뀌어 예전 버전을 검증할 수 없으면 자동 승격하지 않고 `REPORT_STORE_REPORT_VALIDATION_FAILED`로 거절한다.

## 레코드와 버전

`put({actorId,idempotencyKey,report,versions,expiresAt})`의 `versions`는 다음 필드를 명시한다.

```text
reportSchema
reportProfile: { id, version }
interpretationPolicies: [{ id, version }]
generatorVersion
artifactVersion
dataVersion
dataFingerprint
```

출생 request를 별도 색인으로 저장하지 않는다. root 파이프라인은 재현에 필요한 원 projection·S6 baseReport·S7 claim/section을 보고서 envelope 안에 넣을 수 있으며 이것도 암호화 대상이다. 해당 metadata와 보고서가 실제로 일치하는지는 주입한 validator가 확인한다. 자료·정책 버전을 단순히 붙였다는 사실만으로 원자료를 검증했다고 하지 않는다.

내부 plaintext 레코드는 schema/recordId/owner/contentTag/createdAt/expiresAt/versions/report를 담는다. 공개 메서드에서 owner token·contentTag를 반환하지 않는다. 외부 파일은 algorithm/IV/auth tag/ciphertext와 파일 schema만 담는다. 출생일·사용자 ID·정책 ID·문장을 평문 파일명이나 파일 본문으로 쓰지 않는다. 암호문 길이·파일 개수·접근 시간 같은 OS metadata는 은닉하지 않는다.

## 저장·재열람·삭제 API

| 호출 | 실제 결과 |
| --- | --- |
| `put(...)` | 첫 저장 `CREATED`; 같은 idempotencyKey·내용·버전·만료일이면 `REUSED`. 기존 recordId/createdAt/expiresAt 유지 |
| 같은 키, 바뀐 내용/버전/만료일 | `REPORT_STORE_IDEMPOTENCY_CONFLICT`. 조용히 덮어쓰거나 보존기간을 연장하지 않음 |
| `get({actorId,recordId})` | `FOUND`와 원 report/versions/저장·만료시각, 없으면 `NOT_FOUND`, 만료면 report 없이 `EXPIRED` |
| `remove({actorId,recordId})` | 본인 레코드를 검증 후 `DELETED`; 이미 없으면 `NOT_FOUND`. 만료 레코드도 명시 삭제 가능 |
| 다른 actor로 get/remove | 해당 actor의 별도 경로만 접근하므로 `NOT_FOUND`. 타인의 내용/시각/버전을 공개하지 않음 |
| 변조·잘못된 복호화 키 | `REPORT_STORE_INTEGRITY_FAILED`; 깨진 내용을 보여 주거나 재생성으로 감추지 않음 |
| 처리 중 `close()` | `REPORT_STORE_BUSY`; 완료 뒤 close는 handle의 키 복사본을 지우고 이후 호출 거절 |

서로 다른 store handle의 동시 동일 put은 파일 lock 아래에서 한 번 저장하고 나머지는 같은 결과를 재사용한다. lock 대기는 5ms 간격·100회 상한의 로컬 경합 처리이며 콘텐츠 재생성·네트워크 재시도가 아니다. 비정상 종료로 남은 lock은 `REPORT_STORE_BUSY`로 실패한다. 아직 살아 있는 다른 작업의 lock인지 추정해 삭제하지 않는다. 운영자의 소유 프로세스 확인·복구 절차는 후속 운영 작업이다.

파일 발행은 같은 디렉터리의 임시 암호문을 동기화한 뒤 rename한다. 정상 API의 get/put/remove는 같은 record lock을 사용한다. 불완전·변조 파일을 읽어서 정상 보고서로 반환하지 않는다. 갑작스러운 OS·디스크 손실까지 내구성을 보장하는 운영 DB 트랜잭션은 아니다.

## 무결성과 개인정보 최소화

- 저장 경로와 recordId는 별도 `indexKey`의 HMAC-SHA-256으로 만든다. 생년월일을 SHA-256으로 바꿔 익명화했다고 하지 않는다.
- 내용은 매 저장 시 새 96bit nonce를 사용하는 AES-256-GCM으로 암호화한다. actor 경로 token/recordId/schema를 AAD로 묶어 다른 사용자·파일로 복사해도 검증을 통과하지 못하게 한다.
- 암호화·인증은 정확성/명리 근거 검증과 다르다. 원래 입력·claim·정책 대조는 validator의 역할이다.
- 파일/디렉터리/모든 조상에서 symlink를 거절하고 읽는 파일의 regular-file·inode/dev·hardlink 수·크기를 확인한다. traversal 가능한 actor/record ID를 받지 않는다.
- 디스크 root에 쓰기 권한이 있는 동일 OS 사용자나 관리자에 대한 완전한 격리는 보장하지 않는다. 경로 검사 사이의 적대적 rename을 막는 운영 샌드박스/별도 서비스 계정은 이번 로컬 계약 밖이다.
- 기본 암호화 전 레코드 상한은2MiB이고 operator가1KiB–8MiB 범위에서 명시할 수 있다. base64 overhead에는 별도 파일 상한을 적용한다. getter/symbol/sparse/cycle/비유한 숫자·과도한 깊이를 거절한다.
- 예외에는 안전한 코드만 담고 report·키·actor·경로·출생정보를 로그하지 않는다. 파일 경로·키를 포함하는 원 filesystem/validator 오류를 그대로 전달하지 않는다.

## 보존과 삭제의 한계

`expiresAt`은 millisecond를 포함한 UTC ISO 문자열로 필수 지정한다. 현재 시각보다 미래이며 **최대31일**이어야 한다. 이는 가상 사용자로 로컬 시제품을 검증하는 기술 상한이며 법정 보존기간·실제 사업 정책을 확정한 것이 아니다. 기본 장기 보존·자동 저장은 없다.

만료 이후 get은 내용 반환을 차단한다. 물리 삭제는 명시적 `remove`로 수행하며, 백그라운드 만료 sweep/백업 삭제/OS forensic secure erase는 구현하지 않았다. 호출자가 저장 수명 종료 시 remove를 실행하는 책임을 가진다. 이 구현만으로 실제 고객 개인정보의 보존·삭제 의무를 충족했다고 주장하지 않는다. 영구 삭제가 필요한 서비스에서는 백업·로그·키 수명까지 Sprint 8 운영 계약에서 별도 검토해야 한다.

## 검증 범위

공개 검사는 합성 actor/가짜 birth/가짜 정책·자료 버전만 사용한다. 암호화 재열람·재시작·idempotency·동시 put·버전 변경·validator 재대조·만료·반복 삭제·잘못된 actor/key·tag/owner 변조·traversal/getter/sparse/oversize·symlink/hardlink/stale lock을 검사한다. 이는 로컬 기술 계약 검사이며 독립 보안 감사·운영 인증·법률 검토가 아니다.

최종 코드 SHA의 전체 회귀·실제 S7 보고서 저장/재열람·시간대 검사는 root Sprint 7 실행 기록에서 별도 보고한다. 집중 합성 검사만으로 해당 통합을 PASS로 표시하지 않는다.
