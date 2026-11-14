# Sprint 1 — 오프라인 실행·M3 안정화 실행 기록

2026-11-14. [실행 가이드](../SPRINT1_OFFLINE_GUIDE.md), [지원 행렬](../contracts/offline-support-v1.json), [JSON 계약](../contracts/OFFLINE_ANALYSIS_V1.md)을 함께 읽는다. 이번은 새 격국/용신이나 강약 공식을 추가한 작업이 아니다.

## 기준선과 정확한 SHA

- 시작 로컬/직접 조회 원격: `e2eb267c625cd2fe93501df3301dc5fbcf28b686`. 승인 브랜치 `agent/kasi-local-1950-2026-20261109`, 시작 작업 트리 clean, ahead/behind 0/0.
- 민감도 계약: `d18ee89`.
- 첫 오프라인 코드: `cc237b49dbc45a255e839b08d05c69261e53d41d`.
- **최종 실행 코드·전체 회귀·최종 artifact: `131a0c551a5093e22ea22d6a66b37c31dae058df`.** 이 후속 코드는 성공 DTO/계산을 바꾸지 않고 새 경계의 오류를 안전한 enum으로 구분한다.
- 이후 변경은 가이드·일지·로드맵·인수인계뿐이다. 최종 문서 커밋/원격 HEAD는 delivery receipt와 최종 응답에서 구분한다.

Node22.23.3 SHA `9c9245166b4a8e182e0b797da9c20136117ff24368eaff1fec8343a123c8db0e`, TypeScript5.8.3, 기존 package/lock을 유지했다. 초기 Node PID 목록은 읽었지만 추가 명령행 조회는 Windows 권한 거절이었다. 소유를 모르는 사용자 Node/Chrome 프로세스는 종료하지 않았다.

## A. 완성한 artifact와 내부 자료

| 항목 | 실제 결과 |
| --- | --- |
| 엔진 디렉터리 | `.private/sprint1-20261114/final-131a0c5/engine/` |
| 내부 attachment | 같은 상위의 `data/`; 기존 고정 후보에서 필요한 7파일 + 별도 descriptor |
| 엔진 내용 | payload59파일, 435,278bytes, 별도 `artifact-manifest.json`; 외부 런타임 패키지0·달력 자료0 |
| 엔진 manifest SHA | `ba70f6a6d549cc7f80f899b912ff9586be18eba588a7882a633a110d00bc82bf` |
| attachment descriptor SHA | `a932a68ded1ff76fdaca494652472cc569ce9c5e3f9f4be03a22ab5c50cf5dd5` |
| 데이터 base content pin | `8ffadb04c8460969085610162d3d5e8855af9272a8a4be1dbe10123c15f90edf` |
| 런타임 | Node22 별도 필요. 실행/검사/복원에 npm·TS·node_modules·Git·API키 불필요 |
| 지원 출생 | 양력 환산 `[1989-01-01,2027-01-01)`; 시각·달력·기존 네 정책 조합 명시 |
| 자료 권리 | RIGHTS_BLOCKED / PRIVATE_NO_REDISTRIBUTION. 상업 권리 확정 UNKNOWN |

빌더는 두 기존 tsconfig를 고정 compiler로 **새로 메모리 emit**하고 포함 모듈을 그 출력에서 취한다. 오래된 dist를 현재 소스의 산출물로 포장하지 않는다. 실제 TS/config/모듈 입력 지문과 기준 commit·작업 트리 상태를 따로 기록한다. schema의 SERVICES/sha/canonical/fingerprint는 정확한 기존 컴파일 선언문을 AST로 추출하며 다른 해시 알고리즘을 작성하지 않았다. 전체 수집기·XML 파서·네트워크 모듈·달력 fixture는 런타임에 포함하지 않았다.

자료 attachment는 기존 고정 `loadCandidate`와 현대 coverage 검사를 재사용한다. descriptor의 기대 pin 문자열이나 자기 파일 해시만으로 승인하지 않는다. 복원·attachment는 원본/대상 경로의 중첩·덮어쓰기·symlink를 거절한다. 2027 supplement는 M1/M3 실행의 불필요한 필수 의존성으로 만들지 않았다. M7은 기존 경로를 유지하고 전체 회귀에 포함했으며 이 artifact의 새 mode로 추가하지 않았다.

1950–1988 시각 명식, 2027 출생, 역사 DST/진태양시는 이 프로필에서 UNSUPPORTED다. 연구 날짜 자료 보유, 기존 기본 엔진의 별도2026–2027 scope, 보강 두 이벤트를 각각 분리했다. 내부 실행 GO가 자료 재배포·공개 서비스 출시 승인으로 바뀌지 않는다.

## 실제 새 환경 복원과 CLI

최종 artifact를 저장소 **밖의 새로운 임시 디렉터리**에 복원했다. 실행 CWD도 그 디렉터리였다. 키 제거 환경과 network/key/write/source-import/fixture/child-process 차단 가드를 사용했다. 가드의 실제 차단도 공개 probe로 검사했으며 이것을 OS 전체 air gap 인증이라고 부르지는 않는다.

- **CLI104회 = 성공96 + 입력 거절8.** 성공은 JSON48/TEXT48, UTC48/Seoul48이며 시간대 그룹은 순차 실행했다. 각 그룹의 작은 subprocess 동시 실행 수는2였다.
- 성공 mode별 chart36/explain20/evidence20/experimental20이다. 같은 가상 출생을 format/시간대/mode로 반복한 수이며 독립96출생이 아니다.
- 별도 원본 경로 참조 계산24회, 복원/attachment 위험 경로 작업4회 거절을 구분한다.
- 실제 입력: 2026-01-08 12:00, 2026-02-04 05:02, 2026-04-17 20:49, 2026-06-01 12:00과 동등 음력2026-04-16 평달, 6월1일23:30의 네 일주/시주 정책.
- 양음력의 원래 입력 메타데이터는 보존하면서 명식·점수·관측 날짜 의미를 비교했다. UTC/Seoul은 성공48쌍의 출력 bytes까지 같았다.
- 입춘은 원국2/점수2(6.5,3.0), 토왕 B는 원국1/계절대안2/점수1(6.2)이다. 6월1일8.5, 1월8일0은 선택 점수 정책이며 기존 M3를 덮어쓰지 않는다.
- 23:30의 CIVIL_MIDNIGHT는 丙午일/戊子시, ZI_START+SELECTED_DAY_PILLAR는 丁未일/庚子시, ZI_START+CIVIL_DATE_DAY_PILLAR는 丁未일/戊子시로 고정 기대와 대조했다.
- 잘못된 날짜, 1988/2027 범위, 누락 시각, 미지원 시계, pin override, 실험 정책 누락, 알 수 없는 인자는 거절했다. 범위 밖에는 `phase=CALCULATION, code=OUT_OF_PROFILE_COVERAGE`를 보존한다.

실제 stdout96개와 거절 stderr8개는 private `evidence/actual/`, `evidence/rejected/`에 명시적으로 저장했다. 제품의 기본 자동 저장 기능이 아니다. root가 실험 TEXT5개·명식 TEXT2개·기초 설명 TEXT1개 전문을 읽었다. 명식·정책·조건부 후보·근거/한계 표현을 확인했으며 인간 전문가 검토로 표시하지 않는다.

## B. 가중 정책 고정과 중복 감사

`EXPERIMENTAL-WEIGHTED-SUPPORT-LOCAL-NO-TRANSFORMATION-V01 / 0.1.0`과 코어 산술은 변경하지 않았다. 월/일/연/시 대표 지원3.5/1.5/1/1, 비일간 표면 지원1 또는 무근0.5, 지원 월지충−0.8 한 번, 8.5/5.5/4/2 임계값을 고정했다. 자동 합화·장간 직접 배점·근 개수·M4 보너스·시간 미상 보정은 적용하지 않는다.

새 공개 민감도 검사는103개다. **합성 유효 간지쌍 원국47**, 별도 scalar 임계14, 합성 달력12요청/13후보 및 반례/거절을 구별한다. 원국47의 실제 점수·등급·8슬롯·보정·root witness·delta를 private receipt에 남겼다. 각 간지쌍의 유효성을 모든 날짜에서 실현 가능한 완전 명식이라는 주장으로 바꾸지 않는다. scalar8.4 등 계수상 원국에서 나올 수 없는 점수도 분류기 단위 검사로만 사용했다.

산술상 뜻하지 않은 이중 가산/반복 충 감점은 발견하지 않았다. **정책 수준의 상관된 근거 재사용은 존재**한다. 한 장간이 표면 천간3개의 근 조건을 각각 올려 +1.5가 되고, 월지 하나가 대표점수와 두 근 조건을 함께 바꿔3.0→7.5가 되는 반례를 고정했다. 근 witness 개수만 늘면 가산하지 않는다. 정관격 월령 정관의 자동 통근은 M4 구조 사실이며 이 점수의 별도 강도 보너스가 아니다.

같은 원국 시간11:00/12:00/12:01/12:59는8.5로 같았고, 시주가 바뀌는10:59와13:00은8.0이었다. 이는 공개 합성 달력 연결 검사이며 실제 KASI 원문을 새로 검증한 것으로 세지 않는다. 배점·임계값의 안정성/설명 가능성과 실제 근력·생조 효력/예측 타당성을 분리한다. **실험 사용 GO, 기본값 승격 NO-GO**다.

## C. 결과 계약과 기존 호환

새 wrapper는 schemaVersion/mode/data만 추가한다. 원 `data`를 같은 입력의 기존 함수 결과와 JSON 대조했다. 후보·기둥·계산/분석 정책·데이터 버전·입력 근거·trace·미정·제한을 기존 경로에 보존한다. 기본 점수 자동 추가나 스토리 서버/새 프레임워크를 만들지 않았다. 후보 ID는 같은 결과 내 상대 참조이며 serialized refs는 외부 인증이 아니다.

새 경계는 unsupported M1 상태를 하위 어댑터 이전에 보존한다. 실제 발급 contextProfile을 유지하는 얇은 guard로 네 mode의 성공·거절 모두 M1 1회를 스파이 검사했다. M2 재계산·외부 CLI JSON 재입력은 없다. 기존 CLI/공개 계약/기본 프로필·G0·G1-P2·M3 좁은 결론·계절/근/지원/M7은 그대로다.

## D. 빌드 재현성

고정 Node/TS에서 독립 디렉터리 빌드6회·compiler12회 exit0. 현재 입력3회는113출력, 이전82587ff 입력2회는111출력 모두 같은 입력끼리 파일명/bytes/SHA가 같았다. 현재 입력에서 experimental TS 하나를 제외하면 이전111출력과 모두 같았다. 공통 JavaScript 변경0, 기존 d.ts3개 참조 속성순서6곳 차이를 재현했다.

결론은 **컴파일 입력 집합에 따른 결정적 선언 출력 차이**다. 동일 입력 비결정성·환경/버전 차이·실제 타입 의미 변경은 관측되지 않았다. TypeScript 내부 ID/cache 원인까지 확정하지 않았다. 소스 수정은 필요 없었다. 최종131 코드의113출력도 위 현재 프로그램 지문과 전부 같았다. source-order 보조 조사기의 Windows slash 표기 버그는 별도 supplement에서 정정했으며 compiler exits와 원 출력 증거는 변하지 않았다.

## 전체 회귀·실패·수정

최종131에서 **784/784 PASS**, fail/cancel/skip/todo0, TAP327,910.4391ms. 기존668 검사 의미를 유지하고 새116개를 추가했다. M2 감사·Lab/KASI 실제 Chromium은 자연 종료0이었다. KASI 웹 검사는 합성 upstream 회귀이며 실제 API 재수집이 아니다.

보존한 실패와 검토:

1. 첫 결과 계약3/4의 실패는 스파이로 감싼 객체를 실제 issued 계절 context로 넣은 시험 오류였다. 실제 context를 유지해 수정했으며 성공 DTO equality는 그대로다.
2. 민감도 최초96/97은 비지원 己의 root witness를 손계산하면서 寅戊를 빠뜨린 보조 기대 오류였다. 기존 승인 장간표와 대조해2→3만 수정했다. 점수9.0·등급·8슬롯은 처음부터 통과했다. 최종47개 원국은 새 리터럴6개를 보강한 수다.
3. 독립 코드 리뷰에서 stale dist/revision 오인, descriptor pin 자기신뢰, 복원 중첩 경로, attachment 원본 하위 쓰기를 찾아 작은 경계 수정·반례로 닫았다. 원본이나 기대 지문은 변경하지 않았다.
4. 첫 전체 cc237b4는 **776/781, fail5**였다. 검증 runner의 TEMP가 원본 저장소의 `.private` 아래라 새 독립 가드가 artifact 자체를 차단했고 private-only negative도 전제와 달랐다. 원 실패/로그를 보존하고 소스 밖의 새 소유 TEMP로 검증 환경만 수정했다. 가드를 약화하거나 검사를 skip하지 않았다.
5. 별도 요구 보강으로 새 오류를 phase/고정 enum으로 세분화하고, 과거 negative가 stage-A profile 때문에 DATA 검증 전에 멈추던 약점도 modern profile로 고쳤다. 새3검사 뒤131에서 전체를 다시 실행했다. 환경 실패와 오류표시 개선을 같은 원인으로 기록하지 않는다. 자동 재시도·timeout 확대·기존668 기대값 변경은 없었다.

## 보존·전달·판정

완료본2,086/후보a,b각8/보강5의 파일 트리가 기존 고정 값과 같았다. export `7b5584aca339b85c7e54e953c43b672358bda605a478831b6f260df00472e851`, supplement `f6a0e6dd2b169b4e758f8d1326942556c59f569af714adcb36e73824c6ef02b7`도 유지한다. 이전320대상은317개 원 byte 동일+생성선언3개의 이전 순서 차이 그대로이며 Sprint에서 새 타입 차이는0이다. 이전 QA61 파일과 최종 QA76 파일도 보존 확인한다.

- LOCAL OFFLINE ENGINE: **GO** — 명시한 현대 범위·Node22·고정 내부 attachment에서 실제 실행/복원 검증.
- PUBLIC DISTRIBUTION: **NO-GO** — 자료 재배포/상업 심사와 기존 출시 게이트 미수락. 코드 artifact 구조 준비와 구별.
- M3 EXPERIMENTAL POLICY: **GO** — 명시 선택·0.1.0 산술/민감도/근거 표시 범위.
- M3 DEFAULT PROMOTION: **NO-GO** — 사용자 승인 범위 밖이며 점수를 실제 강약 효력으로 검증하지 않음.

KASI 요청·키·재수집·private 추적·배포·LLM·새 UI는0이다. 관련 workflow는 foundation push만 대상으로 유지하며 승인 브랜치에만 일반 Push한다. 독립 천문 전수/예측 정확도·인간 전문가·상업 이용권·새 OS 검증은 이번에 수행하지 않았다.

주요 private 증거는 `.private/sprint1-20261114/`의 qa2-131a0c5-final-qa-20261114.json, 원 qa-cc237b4 실패 로그, sensitivity-{audit.md,receipt.json,test.tap}, build-repro/, final-build-output-verification.json, preservation-{baseline,final}.json과 final-131a0c5/{evidence/receipt.json,final-output-review.json}이다. 최종 delivery.json에서 일반 Push·원격 full SHA·clean·실행 파일 불변을 확인한다.

다음 Sprint 2 권고는 기존 로드맵 P2의 **선택형 M4 내격8 구조 묶음**이다. 이번 실험 점수의 기본값 승격이나 충분조건 연구를 다시 자동 시작하지 않는다. 자료 배포 권리와 넓은 출생 지원 범위의 제품 결정은 별도 출시 장애물로 병행 관리한다. 후속 기능을 이번에 구현하지 않았다.
