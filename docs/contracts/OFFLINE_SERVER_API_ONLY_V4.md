# 서버 전용 API-only 독립 실행 계약 v4

schema `manseryeok-offline-server-api-only-engine-v4`, version `0.4.0`. 기존 v1/v2/v3의 기본 entry·DTO·계산 정책을 대체하지 않는 별도 artifact다. 서버 연산에 필요한 원래 분석 모듈을 재사용하고, 기존의 fresh TypeScript emit·고정 XML vendor bundle·MIT 고지 검사를 사용한다.

## 엔진과 데이터 분리

엔진 payload에는 계산 코드, provenance/정책 설명과 parser 고지만 넣는다. 달력 행·API 원문·혼합 candidate·수집 도구·fixture·npm package 폴더는 넣지 않는다. 실제 파일 수·byte·source input hash는 제작 manifest와 실행 기록에서 확인한다.

운영자가 별도로 설치한 [서버 API-only 팩](SERVER_API_ONLY_DATA_PACK_V01.md)5파일만 로드한다. 고정 수락 pin `a2bfbf35aff7bb8b11aef277a7be8d5ea5204c786a9142649bec23d27dfd289a`를 사용하며 실행 요청으로 다른 지문·자료 source·권리를 주입할 수 없다. 기존 혼합 attachment나 원본 archive가 런타임 fallback이 되지 않는다. 자료는 startup에 검증하고 서버 context가 재사용한다.

API-only 팩의 서버 내부 사용은 조건부 허용 범위다. 고객 파일 배포·달력 다운로드 endpoint·앱 전체 공개 출시를 승인하지 않는다. 엔진 artifact와 운영자 전용 달력 팩을 구분하며 데이터 복원은 새 `.private` 경로만 허용한다.

## 요청과 출력

`run.mjs`는 네 옵션을 모두 명시한다. 알 수 없는/중복 옵션,32KiB를 넘는 JSON, 잘못된 schema·정책·프로필·시각을 거절한다.

```powershell
& $node run.mjs --data-pack <operator-private-pack> `
  --request-json '<explicit-server-request-JSON>' --output json --detail summary
```

JSON은 `scripts/server/engine.mjs`가 발급한 `manseryeok-server-analysis-result-v1` DTO다. 불필요한 offline wrapper로 의미를 바꾸지 않는다. TEXT의 summary/detailed는 같은 결과를 사용한다. 명식 계산은 요청당1회이며, 시각 미상 `time:null`은 `NEEDS_BIRTH_TIME`으로 보류하고 정오·자정을 만들어 넣지 않는다. DST 누락/중복 시각, 표시 분의 원국 후보, 자료 부재와 정책 미채택도 각각 보존한다.

stdout에는 결과만 쓴다. 성공은 종료0, 명식 보류는 같은 상태를 출력하고 종료2, 입력/엔진/팩/계산 거절은 출생정보·경로·원 오류를 노출하지 않는 고정 JSON stderr와 종료1이다. 기본 파일 저장·현재 시각 추정·원격 API·외부 LLM 호출은 없다.

## 복원·검증

```powershell
# 저장소에서는 기존 고정 Node22·TypeScript·잠금 의존성으로 제작한다.
& $node scripts/offline/build-v4.mjs --out .private/server-v4/engine
& $node .private/server-v4/engine/verify.mjs --artifact .private/server-v4/engine --data-pack .private/server-data/api-only-v1
& $node .private/server-v4/engine/restore.mjs `
  --artifact .private/server-v4/engine --out <new-outside-engine> `
  --data-pack .private/server-data/api-only-v1 --data-out <new-outside-.private-pack>
```

복원·실행에는 Node22만 필요하다. npm/Git·API키·원본 저장소 import는 필요 없다. 기존/중첩 목적지·symlink·추가 파일·파일/고지/팩 변조를 거절한다. sourceRevision은 기본 commit과 실제 input hashes를 함께 기록하며, dirty pilot과 최종 clean SHA 검증을 구분한다.

공개 검사는 데이터 없는 패키징·재현성·거절 계약을 합성 입력으로 확인한다. 실제 API-only 데이터와 저장소 밖 JSON/TEXT·UTC/Seoul 실행은 별도 비공개 pilot으로 기록한다. 다량 내부 일치 검사를 독립 천문/해석 정답률이나 권리의 법률 인증으로 세지 않는다.
