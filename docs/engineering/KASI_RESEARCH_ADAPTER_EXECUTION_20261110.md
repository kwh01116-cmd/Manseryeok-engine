# KASI 완료본 보존·오프라인 연구 어댑터 실행 — 2026-11-09~10 KST

## 범위와 코드

기존 수집 완료본을 재수집하지 않고 읽기 전용으로 감사하고, 별도 비공개 엔진 입력 후보와 실행 가능한 연구 lookup을 만들었다. 기본 엔진/production/Lab/G0에는 연결하지 않았다. 기본 명식 지원 `[2026-01-01,2028-01-01)`, 기존 G0/G1 신뢰 경계와 G1-P2 NO-GO를 유지한다.

작업 시작 HEAD는 `42daf70e06a8a37ea3a02d8b4d7dccf2b4f86e4a`, 미커밋 변경0이었다. 원격 승인 기반 `agent/m1-applied-jie-slice1-20261019`는 `27903fbc53ba15f322b108357368ea4498c15d46`이며 현재 수집 작업 브랜치의 조상임을 SHA로 확인했다. 이미 승인된 파생 작업 브랜치 `agent/kasi-local-1950-2026-20261109`를 재사용한다. 기반 브랜치/main/foundation은 수정하지 않는다.

최종 코드·테스트 SHA: **`fe84ab44ec4cd0efd27fb57c480a2b422d9decbc`**. 선행 구현 `50be84d`, 명시적 예외 목록 `b1b1eb1`, 마지막 브라우저 리소스/회귀 수정 `fe84ab4`다. 이 보고서와 인계 문서는 이후 문서 전용 커밋이다.

구현: `scripts/kasi/research.mjs`, `research-verify.mjs`, `test/kasi-research.test.mjs`, `package.json`의 `kasi:research`. Lab 검사 수명 관리와 정확한 내장 리소스 검사는 `scripts/browser-smoke.mjs`, `browser-request-policy.mjs`, `test/browser-request-policy.test.mjs`에 있다. `src/`와 기존 fixture/Collector는 변경하지 않았다.

## 보존된 완료본과 스냅샷

실제로 확인한 원래 위치는 `.private/kasi-local-1950-2026/monthly-xml/`다. `export.json`은12,063,546바이트, SHA-256 **`7b5584aca339b85c7e54e953c43b672358bda605a478831b6f260df00472e851`**, export/정규화 형식은 `kasi-collector-export-v1` /0.1.2다. 기존 연도 캐시의 허용된 구버전 라벨은 덮어쓰지 않았다.

최종 후보 두 개는 `.private/kasi-research-1950-2026-fe84ab4-a/`, `...-b/`에 별도 생성했다. 예비50be84d/b1b1eb1 스냅샷과 기존 완료본도 유지했다. 새 디렉터리를 배타적으로 생성하며 기존 출력 이름은 EEXIST로 실패한다.

manifest는 export/summary/계획/원문/페이지/연도/표본 파일의 실제 SHA·크기, 입력 트리 지문, 파생 파일 bytes/content 지문, 코드 트리·실행 빌드 지문을 기록한다. 실행시각/HEAD/Node 버전은 별도 metadata다. 원문이 실제 존재하고 receipt SHA와 일치하는지 `Store.load`로 확인하고 `Collector.validateYear`를 요청 불가능한 클라이언트·쓰기 금지 store로 실행했다. export와 원문 재구축 결과 전체가 일치해야 진행한다. 단순 responseSha256 문자열 유무 검사가 아니다.

최종 두 스냅샷의 manifest 내용 지문은 **`8ffadb04c8460969085610162d3d5e8855af9272a8a4be1dbe10123c15f90edf`**, 코드 트리 지문은 `611973d8721fbd038d7b3516cdbac88447334848b939cf45cd27f8b8662df92d`, 실행 빌드 트리 지문은 `d1ced7a0a1bf07d653b4daa9d4028b74b654638ce619195d3689a6f94411e9ed`다. Node net 연결/global fetch 차단 preload와 KASI 키 환경 제거 상태에서 두 번 생성하고 별도 수락 검사를 실행했다. run metadata를 제외한 파생 파일·manifest가 같고 입력 전체 트리도 그대로였다.

## 직접 수행한 전체 기간 감사

| 검사 | 결과 |
| --- | --- |
| 양력 범위·연도 | 1950-01-01~2026-12-31,77년 |
| 고유 날짜·누락/중복/범위 밖 | 28,124일, 각각0 |
| 연간365/366일·연도 간 연결 |77년 전부 통과,76개 연결 |
| 연간24절기 구성·중복·순서 |77년/1,848행 통과 |
| 원문·페이지 receipt | 각각1,001개, 모든 행에 실제 서비스/operation/query/응답 SHA 연결 |
| 원문 solJd 추출 |28,124개, 날짜 차이와 일련번호 차이 연속성 통과; 원래 export 불변 |
| 음력 월·윤달·연도 연결·lunNday |953그룹, 내부 누락0, 관측 초하루952개 |
| 일진60갑자 연속성 |28,124일 통과 |
| 원본 입력 파일 트리 |컴파일 전후 SHA 동일 |

위 검사는 **내부 일관성 검사**다. 실제 원문 지문 일치도 외부 발행기관의 서명·독립 역법 정확성 인증·재배포 허가를 뜻하지 않는다. API evidence profile은 연간 TXT 판본과 분리했다.

## 예외와 지원 범위

`exceptions.json`에 출처 참조를 가진 개별/그룹 목록을 확정한다.

- 월간지 null816행/28그룹은 모두 윤달이다. 평달 null0. 앞뒤 월간지나 사주 월주로 채우지 않는다. API 달력 연·월간지는 절입 기반 사주 연·월주와 별개다.
- 대한 `1950-01-20 24:00`, `AS_REPORTED_2400`1행을 그대로 보존한다. 기존 수집 명세는 제공 표기 보존만 정의하며 익일 전환 근거가 없다. `TIME_NOTATION_REVIEW_REQUIRED`, 계산용 민간시각 null, UTC null이다. 1개 대한 이벤트의 순간 해석과 전체24절기 순간 타임라인은 보류된다. 대한은12절입 월 경계가 아니며 날짜 lookup/일진 대조를 막지 않는다.
- 황경 null1,392행, 제공456행. `sunLongitude`를 채우지 않고 `expectedLongitude`에 규칙에서 유도했음을 표시한다. 누락 시각을 버리지 않는다.
- 절기1,848행 모두 `API_KST_AS_PUBLISHED` / `historicalCivilTime=NOT_RESOLVED`, UTC 생성0. 현대 Asia/Seoul/UTC+9로 역사 출생시를 자동 역투영하지 않는다.
- 첫날은 음력1949-11-13, 마지막은 음력2026-11-23. 양끝 월만 부분 관측이다. 첫 월 시작1949-12-20은 산술 역산이며 API 직접 관측이 아니다. 마지막 월 시작2026-12-09는 직접 관측했으나 말미7일은 미확보다.

연구 날짜 변환은 `[1950-01-01,2027-01-01)` 관측일만 지원한다. 역산 시작일과 말미를 자동 지원하지 않는다. 기존 완전 음력연도 converter의 provenance/완결 계약을 바꾸지 않고, 기존 civil-date/월 키와 기존 converter·일주 계산기·60갑자 배열을 재사용한다. 년주/월주/일주/시주 알고리즘 복제는 없다.

## 기존 자료와 비교

| 비교 대상 | MATCH | MISMATCH | UNSUPPORTED / 제한 |
| --- | ---: | ---: | --- |
| API2026절기 ↔ 기존2026 fixture |24 |0 |발표 날짜·시각 표기 비교, UTC 비교 아님 |
| API2025대설 ↔ 연초 guard |1 |0 |동일 표기 비교 |
| 기존2025~2027 음력 fixture와 날짜 겹침 |702일 |0 |월24개 일치,13개 미지원 |
| 독립 라이브러리0.3.1 기반1999~2000 연구 fixture |708일 |0 |월24개 일치, 해당 겹침만 비교 |
| 기존 날짜 일주 계산기 ↔ API 일진 |28,124일 |0 |날짜 계산기 지원1583~9999 내; 명식 지원 확대 아님 |
| 인덱스 양력↔음력 왕복 |28,124일 |0 |내부 가역성만 의미 |

월 비교는 월 시작·월 길이·윤달 식별을 함께 비교한다. 마지막 부분 월의 reported monthDays 일치는 월 전체의 직접 관측을 뜻하지 않는다. 기존 fixture13개 미지원은 범위 밖 월이며 임의 보완하지 않는다. 공개 합성 테스트는 실제 MISMATCH/UNSUPPORTED/POLICY_UNRESOLVED를 만들어 분류를 검증한다. 원본과 기존 fixture를 자동 수정하지 않았다. 역사 출생시각 포함 명식 검증은 수행하지 않았다.

## 필요한 경계와 정책

추가 요청은0건이다. `boundary-requirements.json`은 관측과 추정/fixture 기반 계획을 구분한다.

1. 부분 월 보완 후보:1949-12-20~31 및2027-01-01~07. 전자는 역산, 후자는 보고된 월 길이에 근거한 계획이다.
2. 음력2026 전체의 종료를 확인하려면 음력12월과 다음 음력 연초의 실제 관측이 더 필요하다. 기존 fixture의 계획상 구간은2027-01-01~02-07,12월 초하루01-08/다음 정월 초하루02-07이다. 이 날짜들을 API 직접 관측으로 표시하지 않는다.
3. 연초 prior-Jie guard는1949대설, 다음 경계 witness는2027소한·입춘, 전체24절기 연결용 추가 witness는 대한이다. 현 Collector 인자 하한1950 때문에1949 수집은 다음 차수의 별도 범위 검토가 필요하다. 이번에 수집기를 수정하지 않는다.
4. API 발표 시계와 각 역사 연도의 법정시/DST 관계,24:00 의미의 독립 근거·버전 정책이 필요하다.

## 실제 검사·실패 기록

기존380개 PASS는 **9bb92979418b75f5c588d72977d0fff93ad4099b**의 과거 기록이며 [수집 완료 보고서](KASI_WINDOWS_77_YEAR_COMPLETION_20261109.md)에 유지한다.

Codex가 Windows10에서 portable Node22.23.3/npm11.12.1/TypeScript5.8.3/Chrome154.0.8037.98로 최종 **fe84ab44ec4cd0efd27fb57c480a2b422d9decbc**를 직접 검사했다.

| 명령/검사 | 실제 결과 | 비공개 로그 |
| --- | --- | --- |
| `npm run check` |390/390 PASS, fail/cancel/skip/todo0 |`.private/research-check-final-20261110.log` |
| 네트워크 차단 실제 캐시 컴파일2회 + `research-verify.mjs` |PRIVATE_DATA_ACCEPTANCE_PASS, 원본 불변/재현성/28,124왕복 |`.private/research-private-final-20261110.log`, `research-final-a-20261110.log`, `research-final-b-20261110.log` |
| `node scripts/browser-smoke.mjs` |PASS, 내장 시계 SVG1개 지문 확인, 자체 브라우저/서버 종료·프로필 삭제 |`.private/research-lab-final-20261110.log` |
| `node scripts/kasi/browser-smoke.mjs` |합성 upstream 실제 Chrome PASS |`.private/research-kasi-web-final-20261110.log` |

신규 공개 테스트10개는 합성 응답/요청 반례다. 실제 비공개 데이터 검사와 개수를 섞지 않았다. API 서버 요청, 역사시 UTC/시각 포함 명식, TXT 원본 인증, 재배포 검토는 수행하지 않았다.

초기 순수 컴파일/원문 재검증 공개 회귀6개, 확장 후8개를 실행했다. 예외 목록 추가 후 b1b1eb1의 전체 검사는387/388이었다. 실패1개는 합성1950년의 끝 월도 부분 월이라고 잘못 기대한 테스트였다. 합성29일 월에서 첫날 이전12일+365일=13×29일이므로 끝 월은 완전하다. 기대를 그 독립 산술에 맞춰1개 부분 월과 끝 월29일 완료를 모두 검증하도록 고쳤다. 실제 완료본의 부분 월2개는 별도 수락 검사로 유지했다.

이전 Lab 잠금의 실제 파일은 Windows 임시 전용 프로필의 `CrashpadMetrics-active.pma`, 오류는 EBUSY였다. 기존 코드가 child 종료를 기다리지 않았고 startup 실패 때 child 소유권을 잃을 수 있어 정리 오류가 앞선 실패를 가렸다. 새 코드는 spawn 즉시 소유권 보관, CDP 종료와 자체 child 종료 대기, 자체 서버 연결 종료, 고유 프로필의 유한 정리 대기, 원래 오류 보존을 수행한다. PASS는 정리 후에만 출력한다. 사용자 Chrome/Node를 일괄 종료하거나 캐시를 지우지 않았다.

정리 후 드러난 별도 실패는 Windows Chrome 내장 `input[type=time]` 시계 SVG를 외부 요청으로 센 것이었다. [설치 버전 Chromium의 기본 CSS](https://raw.githubusercontent.com/chromium/chromium/154.0.8037.98/third_party/blink/renderer/core/html/resources/html.css)와 [time_icon.svg 원본](https://raw.githubusercontent.com/chromium/chromium/154.0.8037.98/third_party/blink/renderer/core/html/resources/images/time_icon.svg)을 읽었다. 공식 SVG369바이트 SHA `6f2cf0c99091af44641cb27eee6a0f32a56aa85f446f60a9482864f2ade413d4`만, Image/현재 페이지 parser 조건과 함께 별도 검사한다. 임의 data/SVG/HTML/외부 URL은 계속 실패하며 반례 회귀를 추가했다. 초기 탐색도 about:blank에서 Network 관측을 켠 뒤 시작한다. 외부 통신 검사를 skip하거나 임의 data URL을 허용하지 않았다.

원문/export/파생 대량 파일은 계속 `.private/`에 있다. 공개 저장소에는 코드·합성 테스트·이 요약만 반영한다. `.private` ignore 유지, force-add 없음. workflow는 foundation 전용 push이고 현재 작업 브랜치에 해당하지 않음을 Push 전 다시 확인한다. Actions 실행/자동 트리거/merge/deploy는 하지 않는다.

## 실행과 다음 한 단계

[실행 가이드](../KASI_RESEARCH_ADAPTER.md)의 `npm run kasi:research -- ...`와 별도 `research-verify.mjs`로 실행한다. 후보 사용자는 별도 보관한 manifestContentSha256으로 `loadCandidate`를 고정하고 관측 범위 lookup만 호출한다.

다음 최소 통합 단위는 **2026년만 기존 계산기에 API 절기 후보를 명시적으로 주입하는 별도 연구 통합 테스트**다. 기존 fixture 경계 전후 결과와 출처 계약을 비교하고, production/G0 진입점은 그대로 둔다. 재배포·기본 지원 확대·역사시 명식은 별도 판단이다.
