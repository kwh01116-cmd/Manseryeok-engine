# M7 v0.2 — 명목 교운일·대운 기간·조회 시점 선택 실제 실행

작업/검증일은2026-11-11 KST다. 모든 출생 입력은 실제 개인 기록이 아닌 **명시적 가상 입력**이다. 정책을 조사하는 데 그치지 않고 순수 함수·기존 로컬 연결·실제 JSON/TEXT 명령을 구현했다. 선택 정책으로 얻은 명목 결과이며 측정된 교운 순간·예측값이나 서비스 기본 정책 확정은 아니다.

## 직접 실행한 결과

기존 시간 정책 `KR_API_PUBLISHED_KST_MODERN_1988_POST_DST_V1`, 일주 `CIVIL_MIDNIGHT`, 시주 `SELECTED_DAY_PILLAR`, 기존 기산 `M7-TRADITIONAL-YEAR-STEM-JIE-3D-V01`과 새 `M7-CALENDAR-NOMINAL-YMDH-SEQUENTIAL-CLAMP-V02`를 명시했다. 각10개 순서를 요청했다.

| 출생·명시 방향 규칙용 값 | 원래 M / Y·MO·D·H | 첫 명목 교운일 |2026-11-01 12:00 조회 |
| --- | --- | --- | --- |
|2026-06-01 12:00 MALE |6528 /1·6·4·0 |**2027-12-05 12:00** |BEFORE_FIRST_DA_YUN |
|같은 출생 FEMALE |38351 /8·10·15·22 |**2035-04-17 10:00** |BEFORE_FIRST_DA_YUN |
|1990-06-01 12:00 MALE |6946 /1·7·8·20 |**1992-01-10 08:00** |**제4대운 乙酉**, `[2022-01-10 08:00,2032-01-10 08:00)` |
|같은1990출생 FEMALE |37945 /8·9·12·2 |**1999-03-13 14:00** |제3대운 戊寅, `[2019-03-13 14:00,2029-03-13 14:00)` |

첫2026 입력은 음력2026년4월16일 평달12:00으로도 실행해 명식·투영·설명 의미가 일치했다. 달력 입력·변환 provenance까지 무조건 같은 JSON bytes라고 요구하지 않았다. 원래 유리수6528/4320=68/45와38351/4320도 기존 m7 결과에 그대로 있다.

실제 한국어 TEXT는 “선택한 달력 가산 정책에서 계산한 첫 명목 교운일은 2027-12-05T12:00입니다.”, “조회 시각 2026-11-01T12:00은 이 정책의 제4대운 乙酉 구간 [2022-01-10T08:00, 2032-01-10T08:00)에 속합니다.”와 함께 원래 절입·정수 M·분해·각 가산 단계·전체 기간표 및 fact/rule/policy/source 참조를 출력한다.

같은1990년 MALE 출생으로 첫 대운 전·명목 전환을 직접 실행했다.

| 조회 분 | 결과 |
| --- | --- |
|1989-11-01 12:00 |BEFORE_BIRTH |
|1991-01-01 12:00 |BEFORE_FIRST_DA_YUN; 소운 생성 없음 |
|1992-01-10 07:59 |BEFORE_FIRST_DA_YUN |
|1992-01-10 08:00 /08:01 |제1대운 壬午 |
|2022-01-10 07:59 |제3대운 甲申 |
|2022-01-10 08:00 /08:01 |제4대운 乙酉 |
|2026-11-01, 생성 개수1 |OUTSIDE_GENERATED_RANGE; 마지막 대운 반복 없음 |

실제 API 입춘 **1990-02-04 11:14 / MALE**의 두 상관 후보도 따로 실행했다.

| 원국 후보 | 방향·명목 첫 교운일 |2026-11-01 조회 |
| --- | --- | --- |
|경계 전 |역행 /1999-12-02 21:14 |제3대운 **甲戌**, `[2019-12-02 21:14,2029-12-02 21:14)` |
|경계 후 |순행 /2000-01-04 21:14 |제3대운 **辛巳**, `[2020-01-04 21:14,2030-01-04 21:14)` |

연간·월주·방향·기산·기간을 섞거나 첫 후보를 선택하지 않았다. 실제2026 입춘02-04 05:02의 MALE은2035-12-02 11:02 /2036-01-02 23:02로 구분된다. FEMALE은 두 후보 모두 AMBIGUOUS, 첫 날짜/null·기간표/빈 배열·조회/AMBIGUOUS다. 진단0분으로 확정 날짜를 만들지 않는다. 보류 상태 TEXT도 각 후보의 전체10개 간지 순서를 날짜 없이 표시한다.

2026-12-31 12:00 MALE은 다음2027소한이 없어 기존 기산·명목 날짜·표·조회가 NEEDS_DATA다. 순서10개는 그대로 제공한다. 별도로 요청한2027세운 라벨丁未는 가능하며2027세운 시각은 입춘 자료가 없어 NEEDS_DATA다. 기존2027 fixture·재수집으로 보충하지 않았다.

[복사 가능한 Node22 PowerShell 양력·음력·조회 명령과 import 계약](../KASI_LOCAL_LUCK_PROJECTION_GUIDE.md). 실제 전체 JSON/TEXT는 비공개 예시 폴더에만 저장했다.

## 선택 정책과 구현

전통 기산 근거, 다른 소프트웨어 구현, 이번 프로젝트의 달력 선택을 [정책 문서](../research/M7_CALENDAR_PROJECTION_V02.md)에서 분리했다. lunar-python은 고정 **1645ad3b3653635e5cb31b0c6df22b5e4298f8ce** Yun.py/Solar.py를 열어 sect2 분해·순차 호출·clamp 및1582cutover 차이를 확인했다. Temporal 공식 문서/고정 저장소 **e8cc03fc970a65a3359e8870e3b35e687ac94e55**를 읽었다. 외부 라이브러리를 생산 계산기로 설치하거나 실행 수치 대조하지 않았다. 현재 Node22의 Temporal은 undefined이므로 Temporal/polyfill 대조도 미실행이다. 원전 비평 판본·스캔·권리는 계속 미확인이다.

정수 M을4320/360/12와2시간 규칙으로 Y/MO/D/H 분해하고, 실제 기록 양력 분부터 년→월→일→시 순서로 가산한다. 기존 Gregorian day-number와60갑자 검증/순서를 재사용한다. 유효 입력에 대한 년/월 단계만 말일 제한하며 잘못된2월30일을 입력에서 교정하지 않는다. 원래 분수·표시 소수와 가산을 분리하고 자시 effectiveDayDate로 출생 분을 옮기지 않는다.

승인한 비단조 반례도 그대로다. **2026-01-31 12:00, M359→2026-03-02 10:00**, **M360→2026-02-28 12:00**이다. 전체 변환을 연속·단조 물리 시간처럼 해석할 수 없다.2020-02-29 12:37에1년→1개월을 순차 가산하면2021-03-28 12:37이며,13개월 결합 가산의3월29일과 구분한다.

기간 경계는 첫 S에서 직접 +10k년이다. S2000-02-29에서+10년2010-02-28,+20년2020-02-29로 복구되고 전 경계를 반복 가산하지 않는다. 표는 엄격 증가·인접 end/start 일치·비중첩·무결손이다. `[시작,종료)`의 명목 경계 분은 새 구간에 속한다.

| 계약 | 범위 |
| --- | --- |
| 기존 출생 명식 |양력 환산 `[1989-01-01,2027-01-01)`, 시각·기존4정책 필수 |
| 원문/기산 자료 |1950~2026 수집본. 현대 범위와1988말 대설 보조.2027소한/입춘 결손 유지 |
| 순수 명목 날짜 산술·기간 생성 |Gregorian0001-01-01T00:00~9999-12-31T23:59, 안전 정수/범위 초과 거절 |
| 실사용 as-of |`[1989-01-01T00:00,2027-01-01T00:00)`. 그 밖은 POLICY_UNRESOLVED |

미래 명목 기간 생성이 미래 법정시·DST·세운 또는 UTC 순간 인증은 아니다. 원자료 MINUTE·결과 NOMINAL_UNDER_SELECTED_POLICY·정책 아래 결정론을 분리한다. 정확한 초·±30초·확률·신뢰구간을 만들지 않았다.

옵션이 없으면 v0.1 그대로다. 새 결과 schema는 `kasi-local-luck-projection-v02`, `m7`에 기존 발급 결과 전체, `projection`에 새 정책·후보·날짜·표·selection·facts, `explanation`에0.2.0 한국어 템플릿을 둔다. 기존 m7.luck.candidates[i].dayun.calendarProjection과 currentDecade의 unresolved는 v0.1 미선택 계약이고, projection.candidates[i].calendar/selection은 선택 정책의 명목값이다. `baseContractScope=V01_UNPROJECTED_LEGACY_RESULTS_RETAINED`로 구분했다. 물리적 교운 순간은 여전히 확정하지 않는다.

제품 M1은1회다. standalone `projectLocalLuckResult`는 발급 M7을 재사용해 M1을 다시 호출하지 않는다. 원래 후보/자료/지문/정책 연결·불변 투영·같은 실행 receipt를 재사용하며, 외부 JSON의 status/hash만으로 인증하지 않는다. 각 새 설명→fact→baseFact/candidate→rule/policy/API source를 따라갈 수 있다. M2도 명시 선택 시 동일 원국 M1만 사용하며 기간 요소를 다섯 번째 원국 기둥으로 넣지 않는다. 독립 세운과 Cartesian product를 만들지 않는다.

## 정확한 코드와 실제 검사

시작 로컬/원격 **9119973e7adcf329a02e2beff2307761d72ff274**, 승인 브랜치 **agent/kasi-local-1950-2026-20261109**, 미커밋0·관련 기존 검사 프로세스0을 확인했다. 순수 계약/산술 커밋 **3912b2dc800040c66c8bb21f04ad7628cc0ce8b5**, 연결 커밋 **1857dd19ba6353ec055ed550f853573d9a88a5ce**, held TEXT 수정 커밋 **a88f25bde4caba2eeae7165eb97b1343f71566dd**, 별도 HTTP runner 보강이자 **최종 코드·테스트 SHA ebedd7bda54f0ff06273a73ab960897bd216818e**다. 후속 인계/보고 문서는 실행 코드와 분리했다.

Node22.23.3/npm11.12.1/TypeScript5.8.3/Chrome154.0.8037.98과 잠금 의존성을 유지했다.

| 최종 EB에서 실제 수행한 검사 | 결과 |
| --- | --- |
|전체 npm run check|**469/469 PASS**, fail/cancel/skip/todo0,137158.0468ms. 기존443 유지+M7 25+runner1 |
|M7 공개 합성|순수12·연결9·실제CLI4. 독립 리터럴/손계산·순차/윤일·반례·후보/기간/refs·변조/정책/누락/fallback·M1 1회 검사 |
|M2 감사|exit0, 기존4정책/9규칙/12출처/8링크. 판본·권리 verified0/7nativeversion 누락 유지. 감사가 새 M7 등록부를 인증하거나 테스트를 실행한 것은 아님 |
|Lab 실제 Chrome|**첫 실행 자연 exit0**,17:46:54.858Z~17:47:06.047Z. EP0~EP4/M1S4/반응형/AX/보안·native-clock1·소유 프로세스/서버/고유 프로필 정리 |
|KASI 실제 Chrome|**첫 실행 자연 exit0**,17:47:10.517Z~17:47:16.799Z. 합성 upstream/키 제거/24행/다운로드/모바일/AX/지연응답·저장/외부요청 없음 |
|실제 후보 CLI|a88 35개 실제 subprocess + 생산 코드가 동일한 EB 추가4개 모두 exit0·stderr 공백. JSON/TEXT bytes가 정확히 같고 held 후보별10번째 행까지 확인 |
|실제 npm 명령|EB Node22 npm run --silent kasi:luck를 네트워크/키 없이 실행해 exit0·stderr 공백·정상 JSON 전체가 Node 직접 실행과 같은 bytes |

위 표의 검사 실행 시각은2026-11-10 UTC, 사용자 시간대에서는11일 KST다. a88→EB diff는 HTTP 테스트 파일과 DEVLOG뿐이며 생산 관련12파일은 바뀌지 않았다. 실제 CLI 출력 전문을 root/협업 agent가 읽어 일반·전환·복수후보·자료 부족·선택 M2 범위와 근거를 검토했다. 원래 v0.1 정상 JSON은 이전 독립 고정 bytes SHA **c32bb361df182af879074d26cb99cfe121e4b4c9774d0b705d14535840131079**와도 같다.

최종 로그는 `.private/m7-v02-runner-fixed-final-check-20261111.log`, `m7-v02-ebedd7b-{audit,lab,web}-20261111.log`다. 실제 예시는 `.private/m7-v02-a88f25b-examples-20261111/` 및 `.private/m7-v02-ebedd7b-final-cli-20261111/`, npm 증거는 `.private/m7-v02-ebedd7b-npm-demo-execution-20261111.json`이다. 공개 합성 검사와 비공개 실제 자료 검사를 구분했다.

### 비공개 실제 전 기간

각 프로세스의 실제 요청/해석 TZ는 UTC/UTC, Asia/Seoul/Asia/Seoul이었다. UTC는2026-11-10T17:48:20.677Z~18:17:42.593Z, 한국 시간대는17:48:23.796Z~18:16:36.210Z(완료는11일 KST)다. 둘 다 자연 exit0, 독립 comparator도 exit0이며 clean EB/실행12파일 지문이 시작·종료 같았다.

| 전 기간 grid — 시간대별 단위 | 실제 수 |
| --- | --- |
|입력 묶음|13,879일 대표시각 +5,472절입 전/표시 분/후(4정책 포함) +28,624달력/자시 =**47,975** |
|달력·명시 성별값 교차|**95,950 G/L×성별 쌍**, **191,900 제품 호출=M1 호출** |
|후보·독립 원래 절입 참조|199,196후보, 각 동일 후보의 연간/월주/방향/선택 절입·정수 M 확인 |
|현재 코드의 투영 상태|PROJECTED_UNDER_POLICY **191,738** /AMBIGUOUS **7,296** /NEEDS_DATA **162** |
|정상 첫 교운일·단계 독립 대조|191,738후보 모두 별도 Gregorian 테스트 참조와 일치 |
|정상 후보별10개 기간표|**1,917,380**기간. 최초 기준 직접 가산·인접 end/start·증가/비중첩·간지/반개구간 검사 |
|첫 교운일 단계의 말일 제한|년 가산306 /월 가산8,364건 |
|원래 API 절입 근거 / 새 fact / 새 설명 refs|462,772 /390,934 /390,934회 |

M1과 기존 M7은 제품 호출당 한 번이며 투영/조회 때문에 다시 호출하지 않았다. 이 grid는 모든 날짜의 대표 시각과 지정 경계 조합이며 모든 가능한 출생 분·초의 전수 인증은 아니다. 전 기간 grid에는 as-of 날짜를 곱하지 않았고 그 카운터는 비어 있다.

집중 조회에서는 기존 발급 M7을 재사용한 **240투영 호출, 추가 M1 0회로254후보를 선택**했다. 별도 짧은 기간표 제품/M1 요청1회에서1후보를 조회해 총255선택이다. RESOLVED_UNDER_POLICY114 /BEFORE_BIRTH35 /BEFORE_FIRST_DA_YUN50 /OUTSIDE_GENERATED_RANGE1 /POLICY_UNRESOLVED40 /AMBIGUOUS10 /NEEDS_DATA5였다. 이 수를 전 기간 투영 상태에 합쳐 성공 수를 부풀리지 않는다.

추가 검사까지 주프로필 제품/M1 진입은 각각192,093회다. 그중 집중 출생 요청37회와 별도 A프로필39회를 구별해 계측했다. 독립 참조 카운터에 포함한 후보199,236개·정상191,772개·기간1,917,720개, AMBIGUOUS7,300/NEEDS_DATA164는 grid 후 추가 사례가 포함된 집계다.38개 연도/정책/프로필 교대와38변조 격리,78 envelope 반례, 잘못된 pin/없는 후보2개를 통과했다.

전 기간 입력의 v0.1 계산·후보·설명 의미를 현재 코드에서 새로 계산한 G/L 지문은 **7c4f209cf4434a6d3ab09daeb2bffd4fd3ae6390b8ab0e88733ee0f2ffde4eb9**이며 이전 고정값과 일치했다. 새 투영 G/L 의미 지문은 **b59cd6b0f00ca7f9fa3ccfee96514f160cf6c73910e4290cecbeb77d82841915**로 같고 두 TZ에서도 같다. 요약 파일 bytes SHA **66651283232f7db70ead0d86e9e035e0e1dc3eb2287493720ffd3f52f104958d**, canonical 내용 SHA **8d3314e0bb3ddae89c756b68c8652f6353a7bdc208fd9836035f60f61a9e24a7**다. 실행 시각·실제 TZ·명령·PID는 별도 execution/launch 정보이며 내용 지문에서 분리했다.

비공개 결과는 `.private/m7-v02-ebedd7b-{utc,seoul}-20261111/{summary,execution}.json`, 시작 지문은 `.private/m7-v02-ebedd7b-start-20261111.json`, 독립 비교는 `.private/m7-v02-ebedd7b-timezone-comparison-20261111.json`이다. 독립 테스트 참조는 대상 함수로 기대값을 생성하지 않고 별도로 구현한 Gregorian 월 길이·UTC setter 산술이며, 천문 시각·고전·미래 법정시의 독립 인증을 뜻하지 않는다.

내부 연결·정책 아래 독립 달력 참조 검사다. 독립 천문/원전·권리 인증이나 모든 출생 초·모든 학파·미래 법정시의 정확성 인증은 아니다. 실제 비공개 자료가 없는 checkout에서 이 단계까지 PASS라고 표시하면 안 된다. 새로운 API/키 없이 검증한 데이터와 원래 지문을 재사용했다.

### 실패와 수정·중단 기록

첫 집중 검사에서 연결9개는 통과했지만 CLI4개가 ESM 순환 top-level await로exit13이었다. 기존 CLI가 어댑터 import를 기다리고 어댑터가 다시 기존 함수를 import하던 문제를 모듈 평가 후 dispatch하도록 수정했다. 로그를 보존하고13/13 집중 검사를 다시 수행했다.

음수/상한 오류를 확인하는 초안 테스트 하나는 synthetic 이벤트 helper에서 먼저 실패할 수 있었으므로, 유효9998년 입력·M8640을 사용해 실제 투영 함수에서10000년 overflow를 거절하는 반례로 고쳤다. 계산 결과의 기대값을 대상 함수로 다시 만들어 통과시키지 않았다.

초기100벡터/400제품 호출 benchmark와 실제 집중193제품·별도 A39·240no-M1투영/조회는 각각 BENCHMARK_ONLY/FOCUSED_ONLY로 표시했으며 전수 통과가 아니다. 마지막 미세 조정 뒤 추가 대량 실행 대신 최종 고정 코드에서만 전수 검증한다. 월 길이 계산은 정상 흐름에서 예외를 반복하던 부분을 기존 day-number 월초 차이로 바꿨고 입력 검증·source 검사·정책을 생략하지 않았다.

1857dd1에서 전체468·두 브라우저·35CLI를 마친 뒤 전문 검토에서 held TEXT의 “총10개”와 실제3개 표시가 불일치하는 것을 찾았다. JSON/산술은 전체10개였으며 TEXT만 좁게 고쳤다. 두 전수 프로세스는 로그상 각5000벡터/10000쌍/20000투영 시점에 중단했다. 이 수는 마지막 기록일 뿐 정확한 최종 처리 수가 아니며 **전수 PASS가 아니다**. 원래 로그·시작12파일 캡처·취소 receipt를 보존했다. 소유66140/36336을 명령·부모·시작시각으로 확인했으며 Stop-Process NullReference 후 같은 CIM 객체만 종료, 부재/실제exit1을 확인했다. 일반 Node/Chrome은 종료하지 않았다. 새 원국/기산/JSON은 바꾸지 않고 보류 상태 전체 간지를 “명목 기간 미정”으로 표시했다. 기존 테스트 그룹 안에 두 후보의10번째·연말 결손10번째 행을 고정해468개 수를 유지했다.

과거 v0.1 Lab의 정리 실패와 재실행 통과는 과거 기록으로 유지한다. 이번 a88f25b의 전체 검사에서는 기존 HTTP fetch3개가 실패해465/468이었다. 원래 로그를 남겼고 같은 코드의 단독 HTTP6개는 통과해 단일 원인을 확정하지 않았다. stdout 포트가 중간에 끊겨도 준비됐다고 인식할 수 있는 helper 결함은 독립 prefix 반례로 재현했다. test/chart-preview-web.test.mjs만 별도 커밋으로 보강해 완전한 안내 줄과 유효 포트를 기다리고, 소유 자식 종료를 최대5초 기다리며6개 finally에서 await한다. 기존 시작 제한8초·제품 코드·기존6개 검사 그룹의 모든 assertion은 유지했고 회귀1개를 추가해 집중7/7이었다. 최종 전체 수는469다. 이 결함이 최초 fetch3개의 단일 원인이었다고 단정하지 않는다. 새 최종 SHA의 브라우저 결과는 위 최종 검사 표를 따르며 소급해서 과거 오류를 삭제하지 않았다.

## 입력 보존·변경·전달

원본 export SHA **7b5584aca339b85c7e54e953c43b672358bda605a478831b6f260df00472e851**, 독립 고정 manifestContentSha256 **8ffadb04c8460969085610162d3d5e8855af9272a8a4be1dbe10123c15f90edf**를 사용했다. 검사 대상 manifest에서 기대값을 다시 읽어 자기 인증하지 않는다.

두 실제 실행에서 시작/종료 전체 파일 목록의 SHA를 다시 계산해 이전 고정값과 대조했다. 원본 전체트리 **82c5a30c679ac743c0c89a0192ce2cf21a42387fd4ad8cbb6847a4db18866567**, 후보a **b2a2560d2d6324554e8bacf4f34e5a788cddabe71e99843b3b6dcb6876a89bed**, 후보b **b143a6cd766a9d0c0e763f93aba1236db68a29c2a5e71a89647e0371dbca6584** 모두 불변이다. 입력 원문/export/체크포인트/후보를 덮어쓰거나 정규화하지 않았다. 새 집계/실행정보는 별도 비공개 폴더이며 전수 명식은 저장하지 않았다. 시작/종료 코드와 실행12파일 지문이 같고 npm 빌드 뒤에도12개가 같았다. KASI 요청·키·재수집0, 소유 검증 프로세스 잔존0이다.

기존 윤달 월간지 null816/28그룹·황경 null1392·1950대한24:00·양끝 부분 음력 월·역사시 미해결을 보존했다. 기본 엔진2026~2027/G0/G1-P2 NO-GO·기존 M1/M2 의미·기본 출생 지원 범위는 유지한다. 역사시·신강약·격국·용신·길흉·LLM·새 UI·공개 배포는 수행하지 않았다.

새 `src/luck/calendarProjectionV02.ts`, `scripts/kasi/local-luck-projection.mjs`/`local-luck-projection-verify.mjs`, 합성 테스트3개와 기존 HTTP 검사 helper/회귀1개, 기존CLI 선택형 dispatch, 새 정책/실행 가이드와 일지/인계/로드맵만 변경했다. 기존 계산 src·fixtures·web·package/lock·workflow는 그대로다. 공개 변경16개는 src/luck/calendarProjectionV02.ts, scripts/kasi/{local-luck.mjs,local-luck-projection.mjs,local-luck-projection-verify.mjs}, test/{m7-calendar-projection-core.test.mjs,kasi-local-luck-projection.test.mjs,kasi-local-luck-projection-cli.test.mjs,chart-preview-web.test.mjs}, docs/{DEVLOG.md,EXECUTION_HANDOFF.md,ROADMAP.md,KASI_LOCAL_LUCK_GUIDE.md,KASI_LOCAL_LUCK_PROJECTION_GUIDE.md,research/M7_CALENDAR_PROJECTION_V02.md,engineering/M7_CALENDAR_PROJECTION_EXECUTION_20261111.md,archive/EXECUTION_HANDOFF_BEFORE_M7_V02_20261111.md}다. 코드/테스트/문서 커밋을 나눴고 원문/export/후보·실제 전수 결과를 stage하지 않았다. .private ignore를 해제하거나 force-add하지 않았다.

관련 workflow/최종 diff와 실제 예상 원격 HEAD를 확인한 뒤 승인 브랜치에 일반 fast-forward Push한다. foundation-only push workflow라 이 브랜치에서 Actions가 실행되지 않음을 확인한다. main/foundation/기반 브랜치·force·PR merge·Actions·배포는 하지 않는다. 최종 원격 HEAD는 Push 뒤 독립 조회하여 전달한다.

## 다음 최소 작업

**2027 소한과 입춘 두 경계 이벤트를 별도 최소 자료 보강 작업으로 검토**한다. 소한은2026말 순행 기산, 입춘은2027세운 시각 판정의 서로 다른 요구다. 이번에는 재수집하지 않았다. as-of 지원 범위 확대는 이 데이터 보강만으로 자동 승인하지 않고 시간 정책 검토와 분리한다. 서비스 기본 투영 정책 채택도 비단조 성질을 포함해 별도로 판단한다.
