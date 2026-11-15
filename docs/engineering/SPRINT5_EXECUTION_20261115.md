# Sprint 5 — API-only 서버 자료와 남은 연도 공백

2026-11-15, **P0/P2/P3 수락 · P1 PARTIAL**. 2027 음력과 마지막 2개 월운 구간은 별도 수집 승인과 자료를 확보하지 못해 완료하지 않았다. 계획·개발 파일럿과 아래 최종 검증을 구분한다.

## 시작 상태와 보호 대상

승인 브랜치 `agent/kasi-local-1950-2026-20261109`, 로컬/직접 원격 `9aa28925a2726b5fc121a319591b801d08b7b5a2`, 시작 작업 트리는 clean이었다. 사용자가 전달한 Sprint4 기준과 일치했다. 이전907/907은 이전 실행 기록이다. 새 기준선은 추적460파일·생성127파일과 원본2086/후보a,b각8/보강5의 독립 지문이다. 비공개 자료·키는 공개하지 않는다.

프로세스 명령줄의 CIM 조회는 접근 거부였고 Get-Process로 기존 Node/Chrome이 여러 개 있음을 확인했다. 소유가 확인되지 않은 프로세스는 종료하지 않는다. 최종 큰 검사는 메모리·시간을 기록하고 두 시간대를 순차 실행한다.

## 작업 순서와 종료 조건

1. **P0:** 허용 API 두 종류의 실제 원문 SHA/정규화 행만으로 서버 자료팩을 만든다. 혼합 비교/보정/운영 파일은 제외하고 새 pin·로더·고지·독립 복원까지 검사한다.
2. **P1:** 현재 원문에 없는2027 일별 음양력/2028 두 경계를 위한13요청·재시도0 계획과 dry-run을 준비한다. 별도 사용자 승인 없이는 키/HTTP에 접근하지 않는다. 응답이 없거나 보류면 PARTIAL을 유지한다.
3. **P2:**1987/1988 API 발표 표준KST와 민간DST·명리 일시 참조를 구분한 별도 정책을 구현한다. gap은 원국 없음, fold는 추가 정보 없으면 UTC 두 대응을 남기고 보류한다. 기존 현대/안정역사 정책은 변경하지 않는다.
4. **P3:** 발급 결과를 재사용하는 버전형 서버 DTO/JSON·TEXT와 Node22 독립 패키지를 연결한다. 자료팩은 서버 내부에 두며 클라이언트에 원 corpus를 반환하지 않는다. 실제 클라우드·공개URL·유료 자원은 만들지 않는다.

## 개발 중 사실과 반례

- 기존 base/source에2027 일별 날짜·2028 태양 API 원문은 없었다. 계획/집중검사와 수집 승인을 분리했다. 기본 dry-run·execute 거절 CLI가 먼저 준비됐고 구체적인13시도 승인 질문을 사용자에게 제시했다. 이것은 수집 실행 기록이 아니다.
- P0는 기존 혼합 attachment를 복사하지 않고1,002 API 응답을 재정규화해 날짜28,124/기본 절기1,848/2027 절기24와 대조했다. 새 팩은 manifest·calendar·sources·원문 엔티티NDJSON·NOTICE의5파일이다. 집중/검토 pin은 별도 계약과 private 영수증에 기록하며 최종 독립 실행은 아래 후속 결과에서 수락한다.
- 당대 도쿄천문대의 중앙표준시 표와1987/1988 API48행 중47행의 표시분이 같고,1988한로는 API10:44/비교표10:45라는1분 차이가 있다. 자료를 자동 교정하지 않는다. DST의1시간 차이와 이 판본/분 차이를 혼동하지 않는다.
- 새 DST 정책은 `jurisdiction=KR`, `timeZone=Asia/Seoul`, `dayHourReference=STANDARD_KST`를 명시해야 한다. 기록 민간시를 표준KST로 바꾸는 것과 일시주 참조를 채택하는 것은 별도 조건이다. 실제 초/진태양시/새 역사연도 지원을 주장하지 않는다.

최종 회귀·독립 실행·실패/수정·정확한 코드 SHA와 원격 HEAD는 검사가 끝난 뒤 이 문서와 DEVLOG에 누적한다.

## 최종 코드에서 실제 수락한 범위

최종 실행 SHA는 **`a0bb716e4a496135c205f7f360179b8735dd219c`**다. Node22.23.3, TypeScript5.8.3과 잠금 의존성을 유지했다. 공개 파일을 고정한 clean 상태에서 아래 검사를 실행했고, 이후에는 비실행 문서만 마감한다. 원격 HEAD는 문서 후속 커밋과 별도 전달 영수증에서 확인한다.

| 검사 | 실제 실행 결과 | 영수증 |
| --- | --- | --- |
| 전체 npm run check | **965/965 PASS**, fail/cancel/skip/todo 0. 기존 907개 검사의 의미 보존. 테스트 파일 순차 실행, timeout/heap 변경·자동 retry 0 | `qa-a0bb716-r1-final.json` |
| M2 감사·브라우저 | CATALOG_CONSISTENT_EVIDENCE_OPEN, 기존 rule version 7개는 null 유지. Lab/KASI 실제 Chromium 자연 종료, exit 0 | 위 QA와 각 log |
| 현대 M1 전수 | UTC/Seoul 각각 49,799 양음력 쌍. baseline/current/API-only 각각 99,598호출·부모 경로 103,246개. 기존 전체 JSON byte 동일. 새 팩은 dataset/profile의 팩 귀속 메타데이터를 별도 검사하고 나머지 모든 계산 필드를 비교 | `modern-full-final-a0bb716-r1-receipt.json` |
| 기존/확장 팩 연결 | 시간대·엔진당 1,655입력: 2027 전 365일×4정책, 12절 전/동분/후×4, 1962–86 대표 25 양음력 쌍, 2027 음력 NEEDS_DATA 1건. 세 엔진과 두 시간대의 계산 의미 동일 | `extended-pack-final-a0bb716-r1-receipt.json` |
| 새 DST 전수 | 시간대당 731일×2시각×4정책=5,848 양음력 쌍, 태양 576쌍(Jie 288/중기 288), 전환 512쌍. M1 진입 13,903=성공 13,414+gap 240+fold 240+오류 8+범위 밖 1. 부모 경로 13,606개·제품 14건·독립 리터럴 7건은 별도 단위 | `../sprint5-history-20261116/dst-final-a0bb716-r1-{UTC,Asia_Seoul}/receipt.json` |
| 서버 독립 v4 | 엔진 payload 96파일·899730bytes와 별도 자료 5파일. 정상 21사례/88CLI, 보류 6사례/14CLI, 입력 5·경로 2·변조 2거절, TZ 42출력쌍 동일. 저장소 밖 Node22 실행 | `.private/sprint5-20261115/final-a0bb716/evidence/receipt.json` |

표의 bare filename은 `.private/sprint5-20261115/` 기준이며, `.private/`로 시작하는 경로는 저장소 기준이다. 내부 연결 검사와 독립 리터럴·공개 원문/법률 자료 확인을 서로 다른 수준으로 유지한다. 수만 회 내부 일치를 명리 정답률·예측 타당성·기관 서명/법률 인증으로 표시하지 않는다.

현대 기존 JSON 스트림은 `902063b03ce3116f63049cdde07e77348dce992cb14c4b54e2c34f7d3a30a213`, API-only/기존 계산 내용은 `1a2e9fb3e3e65e6aec946cb870a5dc0e73b3f9b19b558d77d2decbbd92a694c3`로 두 시간대가 같다. DST 의미 지문은 `90c0a5e7568b9e5d7148cb7845a4ca6a2ce1342f87f0e48b398ec49930171cca`다. 큰 검사는 최대 2종만 병행하고 각 종류의 UTC→Seoul 실행은 순차로 처리했다. modern maxRSS 647984/661736KiB, 확장 732140/672264KiB, DST 649164/651128KiB를 기록했다. 전체 결과 누적·heap 제한 해제·사용자 프로세스 일괄 종료는 없었다.

## 서버 전용 팩과 독립 실행

`KASI-SERVER-API-ONLY-1950-2027-V01`/1.0.0의 독립 content pin은 **`a2bfbf35aff7bb8b11aef277a7be8d5ea5204c786a9142649bec23d27dfd289a`**이다. manifest 원byte SHA는 `293b3d214959588985dc5e073d0e5e9f00b83ec80d4580f75aa3d5acee145c62`다. 실제 5파일의 합계는 25,384,499bytes이며, 1,002응답/29,996정규화 행(날짜 28,124·base 절기 1,848·2027 절기 24)을 포함한다. 출처는 15012679/getLunCalInfo와 15012690/get24DivisionsInfo뿐이다. 파일/응답 SHA·query·가공·행 연결·제외 목록을 manifest/source/raw와 계약에 고정했다.

마감 단계에서 [음양력 API 목록](https://www.data.go.kr/data/15012679/openapi.do)과 [특일 API 목록](https://www.data.go.kr/data/15012690/openapi.do)의 이용허락범위 '제한 없음', [공공데이터포털 정책](https://www.data.go.kr/ugs/selectPortalPolicyView.do)의 제3자 권리 구분을 공개 웹 원문에서 다시 확인했다. 인증 KASI API 호출이나 키 사용은 아니다. 이 메타데이터를 KOGL0이라는 새 라이선스로 자동 변환하지 않으며, API-only 서버 내부 사용의 조건부 수락과 고객 파일 배포 UNRESOLVED를 유지한다.

별도로 두 번 제작한 5파일은 byte 단위로 동일했다. 로더는 검증 대상에서 기대 pin을 읽지 않고 고정 constants를 사용한다. whitelist 위반·중복·sparse·누락·변조·출처 혼입을 거절하며, startup에서 전체 재검증을 마친 불변 문맥을 재사용한다. 별도 AI scalar/XML 대조에서도 1,002응답/29,996행이 같았다. 이를 전문가·기관 인증으로 표시하지 않는다. 더미 frozen 객체를 bind할 수 있었던 개발 결함은 고정 manifest/identity/권리/annual/projection 재검사로 막았다.

최종 v4 artifact manifest SHA는 **`c63ce817fd85c6711d72e4b04b2fa700802c2f489187b1cc42ad97859e4383b3`**, sourceInputs는 97개다. 엔진에는 달력 원문이 없고 자료 5파일을 서버 비공개 경로에 따로 복원한다. 정상/보류/입력 거절·경로/변조 거절, JSON·요약·상세, M5 실제 후보/기존 M7·실험 옵션·월운·DST를 독립 프로세스로 실행했다. 네트워크/키/원본 import/외부 Git/npm과 데이터 쓰기를 차단한 실제 영수증을 수락 근거로 삼는다. v4의 `newIndependentBirthM1OrCredentialCounters=false`이므로, 출생 M1 호출이나 자격증명 읽기를 v4에서 새로 독립 계측했다고 표현하지 않는다. 고객용 파일 재배포나 Cloudflare 리소스/공개 HTTP 배포는 실행하지 않았다.

## 2027의 남은 자료와 승인 상태

2026 월운은 V2에서 12개 구간이 정상이며, 2027은 10개 정상+마지막 2개 NEEDS_DATA다. 마지막 경계는 2028 소한/입춘의 수락된 API 원문이 없어 비워 둔다. 2027 음력도 365일 대응 원문이 없어 NEEDS_DATA다. 웹 예비값/fixture/다른 엔진으로 보충하지 않는다. 현재 공개 웹 표는 원 API의 출처/권리를 대신하지 않는다.

`KASI-SPRINT5-LUNAR-2027-BOUNDARY-2028-13-V01`은 2027 월별 getLunCalInfo 12회+2028 연간 get24DivisionsInfo 1회, 실제 HTTP 총 13시도 이내/재시도 0의 수집 계획이다. final SHA에서도 dry-run을 실행했다. **사용자 추가 승인은 도착하지 않았고 수집·API·키 접근은 0**이다. 현 CLI의 execute는 승인/2028 transport 보완 없이 실행되지 않는다. live collector 실행 연결·새 자료 수락/정책 경계/팩 버전은 승인 후에 필요한 최소 후속 작업이다. 원문 전체를 비공개로 보존하더라도 2028 runtime에는 소한/입춘만 수락하며, 2028 출생을 자동으로 지원하지 않는다.

## 실패·수정·검증하지 않은 것

- 공개 PDF 첫 다운로드는 sandbox 소켓 제한으로 실패했다. 이후 동일한 공개 2URL만 제한적으로 다운로드/렌더했다. 1988 한로의 1분 차이는 유지했다.
- 개발 P0 instrument의 자기 module realpath 차단과 sync throw/assert.rejects 오용은 하니스 문제로 기록했다. 더미 bind/중첩 mutation은 실제 결함으로 고쳤다.
- server의 getter/symbol/숨은 property 거절, 잘못된 대운을 미요청으로 바꾸던 흐름, query-only 월운 보류 전달을 고쳤다. DST generic limits 지적 1건은 실제 override/JSON을 확인한 뒤 AI false positive로 철회하고 기록했다.
- 최초 v4 dirty-a는 동시 소스 편집 때문에 source byte 비교에서 실패했다. dirty-b 파일럿은 별도로 통과했고 최종은 clean a0bb716으로 새로 제작했다. 기대값 완화/skip/이전 실패 삭제는 없었다.
- modern 첫 preflight의 sourceRef 속성 순서에 따른 byte 비교 오류는 canonical 계산 내용 비교로 고쳤다. baseline/current 전체 JSON byte 비교는 그대로 유지했다.
- 최종 QA/modern/확장/DST/v4의 실패·미실행 여부는 각 receipt에 따른다. 1950–61, 2027 음력·월운 12구간 전체, 고객 재배포·Cloudflare/공개 서버·M3 일반 강약/M4 성패/M5 최종 용신은 수락하지 않았다.

## 보존과 제품 판단

원본 2086/후보 a,b 각 8/보강 5파일 및 base/export/annual/새 API 팩 지문이 전후 같다. 기존 생성 127파일은 시작 baseline 원byte 그대로이며, 현재 131파일은 최종 QA 전후 동일하다. 기존 현대/안정 역사/계절·통근·합 제한·M7 기본 규칙은 바뀌지 않았다. G0/G1-P2 NO-GO와 기존 M3 grid 신약 0건/추가 8경로가 한 날짜의 반복이라는 기록을 유지한다. private 추적·KASI API/키/재수집·기관 연락·Actions·배포·UI/LLM은 0이다.

**GO:** API-only 서버 내부 팩/Node22 독립 실행·1987–88 명시 DST 출생/버전형 서버 DTO. **PARTIAL:** 2027 전체, 1950–1988 전체. **UNRESOLVED/배포 NO-GO:** 고객용 데이터 파일 재배포. **NO-GO:** 시중 서비스 전체 기능 동등·공개 상용 출시. P1 미완료를 이유로 P0/P2/P3의 실제 결과를 숨기지 않으며, Sprint5 전체 목표를 완료했다고도 쓰지 않는다.
