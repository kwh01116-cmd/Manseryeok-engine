# API 데이터 기반 선택형 로컬 명식 — A/B 실행 기록, 2026-11-10 KST

## 완료한 기능과 범위

사용자가 승인한 순서대로 A의2026년 통합을 검증하고, 통과한 뒤 B의1989~2026 프로필을 구현했다. 두 경로 모두 기존 `resolveCoverageCheckedModernKoreanCivilFourPillars`를 호출한다. 새 기둥 계산·수집기·화면을 만들지 않았다. 기본2026~2027 엔진/production/Lab/G0 및 G1-P2 NO-GO는 그대로다.

| 프로필 | 양력 환산 출생 범위 | 실제 실행 상태 |
| --- | --- | --- |
| `kasi-api-2026-local-v1` | `[2026-01-01,2027-01-01)` | A 통과, 선택 실행 가능 |
| `kasi-api-1989-2026-local-v1` | `[1989-01-01,2027-01-01)` | B 통과, 선택 실행 가능 |
| 기존 기본/G0 | `[2026-01-01,2028-01-01)` | 변경 없음 |
| 확보된 원자료/연구 날짜 인덱스 | `[1950-01-01,2027-01-01)` | 데이터 확보·날짜 감사 범위이며 역사 시각 명식 지원 아님 |

양력 또는 음력 연·월·일·윤달 여부, 분 단위 시각과 기존 정책4조합을 명시해 실행한다. 범위는 **변환된 출생 양력 날짜**로 검사한다. 음력1988년 날짜라도 양력1989년이면 가능하며, 음력2026년이라도 관측/출생 범위 밖이면 거절한다. 시각 미상 계약은 추가하지 않았고 시각은 필수다.

## 시작 상태·보존과 고정 지문

현재 승인 브랜치 `agent/kasi-local-1950-2026-20261109`를 재사용했다. 시작 로컬/원격 full HEAD는 `923f5cf0b361c98680a6c9c6658290574712cf43`, 미커밋 변경0이었다. 관련 수집/검사 프로세스 필터 조회에서 기존 작업은 발견되지 않았다. 기반 브랜치로 이동하거나 재구현하지 않았다.

기존 원본 `.private/kasi-local-1950-2026/monthly-xml/`의 export SHA는 `7b5584aca339b85c7e54e953c43b672358bda605a478831b6f260df00472e851`다. 기존 후보 `.private/kasi-research-1950-2026-fe84ab4-a/`, `...-b/`는 사용자가 별도 제공한 **manifest 내용 지문 `8ffadb04c8460969085610162d3d5e8855af9272a8a4be1dbe10123c15f90edf`**로 검증했다. 검증 파일에서 읽은 값을 기대 지문으로 사용하지 않았다. 기존 `research-verify.mjs`의 자체 metadata 의존도 이 고정 기대값으로 고쳤다.

최종 검사에서 원본 전체 트리 SHA는 `82c5a30c679ac743c0c89a0192ce2cf21a42387fd4ad8cbb6847a4db18866567`, 후보a는 `b2a2560d2d6324554e8bacf4f34e5a788cddabe71e99843b3b6dcb6876a89bed`, 후보b는 `b143a6cd766a9d0c0e763f93aba1236db68a29c2a5e71a89647e0371dbca6584`로 전후 불변이었다. 두 후보는 실행 metadata가 달라 전체 디렉터리 지문이 다르지만 고정 manifest/파생 내용은 동일하다.

KASI 인증 요청0건, 키 사용0건, 재수집0건이다. 원문·export·체크포인트·기존 후보를 수정하지 않았다. 새 비공개 산출물은 검사 집계와 실행정보뿐이며 전수 출생 명식/실제 개인 기록을 저장하지 않았다. CLI도 stdout JSON만 반환하고 기본 파일 저장은 없다.

## 계산 경로와 출처 계약

`scripts/kasi/candidate.mjs`로 기존 `loadCandidate`와 관측 날짜 인덱스를 최소 추출했다. 기존 `research.mjs`는 동일 API를 재수출하며 이전 회귀를 유지한다. 새 product CLI는 fixture·Collector·research 모듈에 의존하지 않는다. 파일 누락/지문 오류 때 fallback 없이 실패한다.

`scripts/kasi/local-chart.mjs`는 연도별24절기와 전년도 대설25이벤트를 선택하고 기존 FULL_24_TERM_YEAR 검사와 계산기를 그대로 호출한다. B에서 선택하는 고유 이벤트는913개다. 음력은 관측 인덱스로 날짜를 얻어 같은 양력 composer에 전달한다. 완전 음력연도 corpus나 연간 TXT provenance 타입으로 강제 변환하지 않았다. API `ganji.year/month`를 사주 연·월주로 대입하지 않는다.

연간 receipt 하나에 여러 절기가 있으므로 source ID는 `KASI_OPENAPI_RESPONSE:<receipt-id>:<date>:<termCode>`로 구분한다. receipt 연결용 sourceRef와 개별 이벤트 식별을 분리해 실제 적용 입춘·경칩이 마지막 연간 이벤트로 덮이지 않게 했다. 결과는 적용 절입의 원래 행·파생 해석·서비스ID/operation/query/응답 SHA, 연주 판별 입춘, 날짜 변환 receipt, profile/dataset/manifest 지문, 정책 ID/버전, 후보와 정밀도를 포함한다. 기존 TXT 출처 ID나 G0 receipt를 붙이지 않는다.

2026년 말 출생 계산에는2027 이벤트가 필요하지 않다. 기존 resolver는 출생 연도의 입춘과 직전 절입을 쓰고 coverage 상한은 문자열 end-exclusive 경계다.2027의 실제 절입은 이 출생 계약의 필수 입력/coverage witness가 아니며, 미래 대운 기산의 다음절입은 별도 기능이다. ZI_START에서2026-12-31의 유효 일주 날짜가2027-01-01이 되어도 출생 지원 범위를 확장하지 않는다.

## 현대 시간 정책

정책 `KR_API_PUBLISHED_KST_MODERN_1988_POST_DST_V1`, 버전1은1989~2026 한국 민간시와1988년12월 대설 guard만 KST 벽시계 분으로 비교한다. [법률3919](https://www.law.go.kr/LSW/lsInfoP.do?lsiSeq=3771), [DST 폐지령12703와 제·개정이유](https://law.go.kr/LSW/lsRvsRsnListP.do?chrClsCd=010202&lsId=004533&lsRvsGubun=all), KASI/IANA 교차 근거와 제한은 [시간 정책 문서](../research/KASI_MODERN_API_CLOCK_POLICY_20261110.md)에 기록했다.

1989년 DST 폐지는5월8일이다. 겨울에는 기존 규칙도 DST0이었고 예정된 그해 여름 시작 전에 폐지됐음을 구별했다.1988 대설은 실제 고정 API 후보의 **1988-12-07 06:34**, DST 종료 뒤12월 이벤트 한 건이며1988년 출생 지원이 아니다. +540분/DST0은 별도 해석 metadata다. 원본 `API_KST_AS_PUBLISHED` / `historicalCivilTime=NOT_RESOLVED`는 그대로이며 UTC 순간을 새로 만들지 않았다.

분 표시에서 기존 `PUBLISHED_MINUTE_AMBIGUOUS`와 입춘 연·월의 상관 후보2개를 유지한다. 임의 초·반올림·태양시·학파·자시 규칙을 추가하지 않았다. 기존 CIVIL_MIDNIGHT/ZI_START × SELECTED_DAY_PILLAR/CIVIL_DATE_DAY_PILLAR 네 조합만 명시 입력한다. 호스트 지역시 Date 파싱은 없다.

## A — 기존2026 fixture와 실제 통합 비교

정확한 A 코드·테스트 SHA는 **`183878fdfc1cecdd1f133eec41d0e7d978c48f00`**다. B를 등록하기 전 전체403/403 및 두 실제 브라우저 검사를 통과한 뒤 범위를 확장했다.

| A 실제 검사 | 범위/결과 |
| --- | --- |
| 매일12시지 대표시각×4정책 |365일,17,520 양력/음력 입력쌍 |
|12절입 전·표시 분·후×4정책 |144쌍 |
| 초하루·월말·연초말·자시4시각×4정책 |576쌍 |
| 전체 |18,240쌍, 의미 비교54,720회, 실제 출처/이벤트 연결73,152회 |
| 날짜 변환/입춘 |기존 음력 fixture365일 일치, 입춘 상관 후보2개를4정책 모두 확인 |

API 양력/API 음력/기존 fixture의 의미 지문은 모두 `eda95e7998b143b92bcd8cfd65c7015b41bd9385ebbc077433463a924f33eddd`다. 기둥·후보관계·정책·유효 날짜·적용 절입명/시각/정밀도는 비교했으며 다른 source/dataset 지문을 같게 만들지 않았다. API 출처는 실제 API receipt, 기존 fixture는 원래 출처를 유지했다. 이는2026 기존 구현/fixture 비교이며 독립 전수 천문 인증은 아니다.

## B — 현대 전 범위·시간대 재현 검사

정확한 최종 코드·테스트 SHA는 **`6d75f24f7006a9dcabd701c410340d5ced7f1c51`**다. 고정 Node22.23.3/npm11.12.1/TS5.8.3/Chrome154.0.8037.98을 사용했다. 아래 UTC와Asia/Seoul 실행은 각각 clean worktree의 같은 SHA·실행 파일 지문으로 수행했다.

| B 실제 검사 | 범위/결과 |
| --- | --- |
| 매일 대표시각12:00 |13,879일, 양력/음력/직접 기존 resolver 대조 |
|38년×12절입×전·표시 분·후×4정책 |5,472쌍, 입춘 상관 후보152건 |
| 양·음력 월 시작/말·연도·자시4시각×4정책 |28,624쌍 |
| 전체 |47,975 양력/음력 입력쌍, 의미 비교143,925회, 실제 출처/이벤트 연결200,002회 |
| 별도 경계/격리 |2026 A/B365일 일치, 윤달14쌍 구분, 잘못된 윤달443건 및 기타 잘못된 입력23건 거절, 연도·프로필 교대38회/반환값 변조 격리39회 |
| 양끝 |음력1988→양력1989 입력 허용,1988/2027 출생 거절,2026말 ZI 익일2정책 통과 |
| UTC/AsiaSeoul |각47,975쌍 PASS, 요약 파일 bytes 동일 |

두 시간대의 API 양력/API 음력/직접 기존 resolver 의미 지문은 모두 **`359d92dd0a5b07bf2fba0d0ac9988580e5d721c931d418410c31b5c5c84b5369`**다. 요약 내용 지문도 **`8ab48d86d3d38c5f431d0440ef389e02708223d3e039b7339d6724945025fde2`**로 동일하다. 실행시각·TZ·명령은 별도 execution에만 있다. 현대38년의 비교는 전 범위 내부 검사/기존 구현 대조다.2026의 fixture 일치를38년 외부 정확성 인증으로 확장하지 않는다.

## 전체·브라우저·오프라인 회귀 증거

- A SHA183878f: `npm run check`403/403, fail/cancel/skip/todo0; Lab/KASI 실제 Chrome 각각 PASS.
- B SHA6d75f24: `npm run check`**408/408**, fail/cancel/skip/todo0; Lab/KASI 실제 Chrome 각각 PASS. 기존390/390은 fe84ab4의 과거 실행으로 보존한다.
- 공개 신규18개는 합성 후보와 실제 CLI subprocess를 쓴다. 독립 pin의 합성 절입 시각 변경이 실제 기둥 경계를 바꾸는 반례, guard 누락, 고정 후보/manifest/source 변조, 파일 누락과 fallback 부재, 출생 범위·시각·4정책·윤달·격리를 검사했다. 네트워크와 fixture/research/Collector import를 막은 상태의 CLI 성공 및 차단기 활성화 자체도 확인했다.
- 공개 CLI는UTC/AsiaSeoul 전체JSON 동일성을 검사했다. 실제 비공개 B도 별도 두 프로세스에서 전수 집계 bytes 동일성을 확인했다. private 검증기는 입력 파일이 없으면 실패하며 공개 전체 검사에 실제 자료 PASS를 섞지 않는다.
- 브라우저는 기존 소유 프로세스 수명 관리와 고유 프로필 정리를 그대로 사용했다. 사용자 Chrome/Node 일괄 종료·캐시 삭제·검사 skip/강제PASS는 없다.

비공개 증거: `.private/kasi-api-stage-a-183878f-20261110/`, `.private/kasi-api-stage-b-6d75f24-utc-20261110/`, `...-seoul-20261110/`, `.private/kasi-api-stage-b-timezone-comparison-20261110.json`. 로그는 `kasi-api-stage-a-check/lab/web-20261110.log`, `kasi-api-stage-b-check/lab/web-20261110.log`, `kasi-api-stage-b-utc/seoul-20261110.log`다. 전수 명식 결과는 저장하지 않았다.

## 실제 명령·예시와 제한

[PowerShell 실행 가이드](../KASI_LOCAL_CHART_GUIDE.md)에 Node22 선택부터 양력/음력 복사 가능한 전체 명령을 제공한다. 가상 양력2026-06-01 12:00과 음력2026-04-16 평달12:00을 실제 고정 후보·네트워크 차단 상태에서 실행하면 둘 다 **OK/DEFINITE, 연丙午·월癸巳·일丙午·시甲午**, 적용 입하2026-05-05 20:49를 반환한다. 명시 정책은 CIVIL_MIDNIGHT/SELECTED_DAY_PILLAR다. 결과에는 실제 API 서비스15012690/15012679의 출처 참조와 고정 manifest를 포함한다.

원본의 윤달 월간지 null816행/28그룹, 황경 null1,392행,1950대한24:00 보류, 양끝 부분 월, 역사 법정시/DST 미해결 상태는 변경하지 않았다.1950 이벤트는 현대 프로필에 선택되지 않으므로 현대 계산을 차단하지 않는다.1988년 출생/DST gap·fold,1950년대 시각 명식, 알 수 없는 출생시각, 초 단위 정확성, 진태양시·새 학파, 대운, 독립 전수 인증·권리·공개 상용 출시는 지원/검증하지 않았다.

실제 실행 불일치는 발견되지 않았다. 코드 검토 중 연간 receipt와 개별 이벤트 ID를 혼동하면 적용 근거가 덮일 수 있음을 발견해 A 수락 전 고쳤고 회귀를 추가했다. CLI 차단기 초안의 이스케이프 오류도 테스트 도구에서 수정했다. 실패를 데이터 기대 지문 변경·fallback·skip으로 숨기지 않았다.

## 전달과 다음 최소 작업

코드 변경은 `candidate.mjs`, `local-chart.mjs`, `local-chart-verify-a.mjs`, `local-chart-verify-b.mjs`, 기존research re-export/verifier와 package 명령, 공개 합성/CLI 테스트다. 문서는 시간 근거·실행 가이드·DEVLOG·ROADMAP·인계·이 보고서다. `src/`, 기본 fixture, `web/`, G0/G1 manifest, workflow, package-lock, .private ignore는 변경하지 않았다. 원문/export/후보/전수 자료는 Git에 추가하지 않는다.

현재 승인 파생 브랜치에 A/B 별도 일반 커밋으로 전달하며 문서 갱신은 후속 커밋이다. workflow는 foundation 전용 push임을 재확인한 뒤 일반 Push하고 실제 원격 HEAD를 별도 확인한다. main/foundation/기반 브랜치·force push·Actions·merge·배포·유료 인프라 변경은 없다.

역사 범위를 넓히기 전 다음 최소 작업은 **1988년 한 해의 DST gap/fold 출생시각을 기존 시간 모듈로 정규화하고 API 발표 KST와 비교하는 별도 연구 통합 테스트**다. 먼저 적용 정책·원문 시계 의미를 닫고, 그 결과 없이1988/1950 시각 명식을 지원으로 표시하지 않는다.
