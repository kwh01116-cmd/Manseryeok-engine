# Manseryeok-engine — current execution handoff

**2026-11-15 Sprint 4 한정 확장 완료·일부 목표 미완료.** 승인 브랜치 agent/kasi-local-1950-2026-20261109. 시작 로컬/직접원격701bd90f1b6e8e25358fbb84f4c15c5ba1d8e662, 최종 실행 코드 **`f1ce4ffb24984c1098f593031de44d36fd643260`**. 후속 문서 커밋/원격HEAD는 전달영수증·최종응답에서 구분한다. 직전 인수인계 원문은 [archive](archive/EXECUTION_HANDOFF_BEFORE_SPRINT4_20261115.md)에 byte그대로 보존했다.

- **1962–1986 GO:** 별도 kasi-api-1962-1986-standard-local-v1 / KR_API_PUBLISHED_KST_HISTORICAL_1962_1986_NO_DST_V1. 양음력·윤달/분시각/네자시·기존M2/구조M3/계절v1/통근·인성제한/내격8/공망/요약·상세.1961대설은 guard만이다.1950–61/1987–88은 미채택,1987/88 gap/fold만 진단하고 원국은 만들지 않는다.1950/51자료충돌과1954/1961전환을 현대KST로 덮지 않는다.
- **2027 PARTIAL:** kasi-api-1989-2027-solar-local-v1 / KR_API_PUBLISHED_KST_MODERN_1989_2027_NO_DST_V2. 기존 보강에 이미 있던 API raw24행을 별도연간 pin77da197d…로 수락했다. 양력네기둥은 실제로 계산하되 날짜는 PROJECT Gregorian근거이며 음력관측행을 위조하지 않는다.2027음력 NEEDS_DATA,2028출생 미지원이다. 현재+09/noDST의 명시 선택이며 미래법령 인증이 아니다.
- **월운V2:** M7-MONTHLY-TWELVE-JIE-PUBLISHED-MINUTE-EXTENDED-2027-V02.2026표12완료,2027표10완료+끝2자료부족.2028소한/입춘 수락 자료가 없다.2027입춘10:46의 상관된 두 후보와 분정밀도를 보존한다. oldV1의 ID/범위/결과는 그대로다.
- **새report:** KASI-LOCAL-EXTENDED-CALENDAR-ANALYSIS-V01. summary/detailed같은 구조데이터/7섹션, 요청당M1한번. 기존사립v2·제한종합/M5 시계의존은 확대하지 않아 새경로에서는 보류한다. 기존 Sprint3 product/M7와 M5겨울목 한정정책은 기존v3 legacy mode로 그대로 실행된다. 새M5규칙/계절/통근/M7정책소급변경 없음.
- **권리:** 공식API15012690/15012679 제한없음+원천1001source/날짜28124·절기1848행 계보검사. API-only 계산·캐시·가공·서버 내부 상업사용 VERIFIED_ALLOWED_WITH_CONDITIONS. 기존비교자료가섞인 attachment전체/새API-only공개배포팩 수락은 UNRESOLVED. KASA2유형공고/1유형보도텍스트·TXT·OSS내장표를 합치지 않는다. 기관연락/법률검토는 미수행, 확인질의3개 준비.
- **최종검증:**907/907(fail/cancel/skip/todo0), M2감사 CATALOG_CONSISTENT_EVIDENCE_OPEN, Lab/KASI Chromium 자연0. 현대49,799양음력쌍/TZ baseline/current전체M1JSON동일. 새범위는9131역사날짜+윤달probe/3600절입쌍/1200자시쌍/2027전365일, 제품314부모/TZ·M1진입28700/TZ의 두TZ의미동일. 단위/메모리/실패와원전검증한계는실행기록 참조. 수정전561도성공했으나 입춘TEXT조사오류1곳을고친 뒤 위SHA에서재검사했다.
- **독립v3:**96payload/870574bytes+별도12자료파일. 내부 .private/sprint4-20261115/final-f1ce4ff/engine 및 data. engine 84145cf304099585b59f023fffb64a1d978d1863a3239e8d28a7fd1bd4db604f, attachment 9d2703eeef4d437ebf707ff7f12656fe8543eae1a56ff96a56fd15cc0f5aded5. Node22만으로 외부새경로94성공+별도M7투영2성공/12보류/3입력·2경로거절/42TZ출력쌍동일. Git/npm/원본import/네트워크/키불필요, 새독립M1/credential counter는미계측. PRIVATE_NO_REDISTRIBUTION.
- **보존:**기존생성121은원byte/현재127은QA전후동일. 원본2086/후보a,b각8/보강5·base8ffadb04…/export7b5584ac…/보강f6a0e6dd…불변. private추적·KASI API/키/재수집·Actions·배포/UI/LLM0. 기존M3 grid신약0/추가8한날짜반복·finalStrength/출시/G0/G1-P2 NO-GO 유지.

**미완료를 완료로 표시하지 말 것:**2027음력·12월운전체/2028guard/1950–61·1987–88전체/고객배포·전체공개출시. 다음은API-only최소배포팩과승인된2027음력·2028경계intake,1987/88 DST연결이 우선이다. 소규모M5규칙을자동다음Sprint로하지않는다. 추가수집·기관연락은별도사용자승인필요,이번0건.

[가이드](SPRINT4_EXTENDED_OFFLINE_GUIDE.md) · [실행/실패](engineering/SPRINT4_EXECUTION_20261115.md) · [권리](research/KASI_DATA_RIGHTS_DISTRIBUTION_AUDIT_V01.md) · [연도행렬](research/EXTENDED_YEAR_SUPPORT_MATRIX.md) · [역사시](research/HISTORICAL_CLOCK_1950_1988_COVERAGE_AUDIT.md) · [v3계약](contracts/OFFLINE_EXTENDED_ANALYSIS_V3.md) · [로드맵](ROADMAP.md) · [일지](DEVLOG.md)
