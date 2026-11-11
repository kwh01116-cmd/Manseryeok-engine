# Manseryeok-engine — engine reliability roadmap

## 2026-11-11 current checkpoint — M3 structural evidence implemented; actual2027 selected boundary cohort verified

현재 주력은 **현대 API 명식 → 기존 M2 → 후보별 구조 근거 → 근거형 한국어 설명**이다. 명시적 `m3-structural-evidence-local-v1`/0.1.0과 실제 `kasi:evidence`를 최종 코드 **e3dab282ae781c5385c44aa6d68ff46081781c10**에서 구현했다. 출생 M1과 기존 M2를 요청당 각각 한 번 실행한 뒤 같은 후보의 위치·장간·오행 방향·기존 관계/구성원을 연결한다. `EVIDENCE_ONLY`, 최종 신강약 `NOT_IMPLEMENTED`, 기존 M3 최종 게이트 차단을 유지한다.

| 구분 | 실제 구현·남은 경계 |
| --- | --- |
| M3 구조 근거 |월주/실제 적용 절입, 일간과 정확히 같은 장간과 같은 오행의 다른 장간, 다섯 오행 방향, 장간↔표면 천간의 정확 문자 연결, 기존 모든 지지 쌍/삼합·삼회 구성원과 겹침·부분/결손 보존 |
| 설명/참조 |결정론적 한국어 템플릿, 후보별 evidence→M2fact/member→기둥/규칙/정책/출처 추적; 계산 출처와 명리 규칙 출처 구분; 계절 세력·사령·유효 통근·관계 효력은 미확정 |
| 최종 해석 |점수·가중치·비율·신강약·격국·용신·합화·길흉·사건 예측 미구현; 기존 출처 판본/권리 미확인과7개 null규칙 버전 유지 |
| A2027 보강 코드 |명시적 별도 디렉터리/독립 지문/기존 basepin, 실제 로컬 원문 대조·재파싱, 소한/입춘만 좁은 근거로 발급. 소한은 M7기산에만 사용, 입춘 자료가 있어도2027시점 세운은 현행 시계 정책 밖 |
| A실제 자료 수락 |최초 NETWORK_ERROR/자동 승인 검토의 실행 전 거절 기록을 보존. 이후 같은 제한 재시도가 검토를 통과해 총2시도/1성공, 실제 연간24행과 소한·입춘2이벤트를 별도 비공개 보충으로 수락. 지문 f6a0e6dd…02b7, 원문 c3f44cf2…0dc0. 소한01-05 23:10/입춘02-04 10:46의 KASI·NAO·fixture 표시 분 일치 |
| A실제 선택 검증 |UTC/Asia-Seoul각 기준결손162후보 모두OK/잔여ND0.47975벡터확인→81tail·미선택324+선택324=648제품/M1·기준340후보. 역행170/AMB16불변 비교, 투영대상340검사.5CLI와2코호트 성공 후 비공개wrapper의영문리터럴TEXT assertion실패는보존하고기존결과를읽어receipt재구성했음을명시;제품/API재실행없음 |
| A실제 가상 예시 |2026-12-31 12:00MALE은 보충선택 시 소한2027-01-05 23:10까지7870분/4320모형년→1년9개월25일20시간→명목2028-10-26 08:00.2026-12-31 13:00조회는첫대운전.2027라벨丁未와2027특정시각POLICY_UNRESOLVED를분리 |
| 범위 보존 |기본2026–2027/G0, API출생1989–2026, as-of1989–2026, 순수 명목 산술0001–9999, 수집자료1950–2026을 구분. 역사시/DST·미래 시계·기본 경로·M7투영 정책 확대 없음; G1-P2 NO-GO 유지 |

clean runtime e3dab282에서 전체 **500/500 PASS**, fail/cancel/skip/todo0(기존469유지+A9+B22), M2감사 및 Lab/KASI 실제 Chrome 각각 첫 실행 자연 exit0이었다. 실제 CLI8개+`npm --silent`1개를 실행했다. A의 실제 선택 자료와 B구조 근거의 검증은 별도로 보고한다. 새 Windows checkout의 CRLF 변환을 막는 메타데이터/최종공개검사 SHA **cf8199a95a88f09a97e5302c231f7cff72f2cf4f**는 두 M3 TEXT snapshot에만LF속성을 지정했다. 실행18/A12/소스/테스트JS불변과 Git필터CRLF0/원본bytes일치를 확인했다. cf8199의 집중22/전체500도 자연exit0, fail/cancel/skip/todo0(109727.5183ms)이며 e3의 실제 데이터/브라우저 실행을 소급 바꾸지 않는다.

최종 비공개 UTC·Asia/Seoul 각 47975양력/음력 입력쌍, 95950제품=95950출생 M1, 99598후보의 M3 근거를 검증했다. 근거/설명 참조 1406856/1406856회, 입춘 상관 152쌍을 유지했다. 두 요약 파일은 bytes까지 같고 의미 지문 ed945e2e197463b8ba50cfd5cf626827ceca4afcc676d08f150d0d51e4e5c4b4이 일치했다. 원본/a/b·실행18파일 불변, API·키 없는 실행이다. 추가 호출·음양력 provenance·독립 유한 기대값/기존 M2 연결 검사와 미검증 효과의 단위는 상세 실행 보고서에서 분리한다.

다음 최소 단계는 **M3 근거에 적용할 해석 정책 하나와 독립 기대사례의 계약 검토**다. 이 결정 전 최종 신강약 게이트를 열거나 점수/격국/용신으로 확대하지 않는다.2027소한/입춘 실제 자료는 취득·독립 pin 수락·선택 코호트 검증을 마쳤고, 명시적 보충/별도pin선택의 좁은 범위를 유지한다. 새 추가 수집·2027 출생/조회 정책 확장은 하지 않는다. 역사시 확장·다른 투영 정책·Story/Astra/최종 UI도 분리한다. [M3실행 가이드](KASI_LOCAL_M3_EVIDENCE_GUIDE.md) · [M3정책](research/M3_EVIDENCE_POLICY_V01.md) · [A보강 가이드](KASI_2027_BOUNDARY_SUPPLEMENT_GUIDE.md) · [A실행 기록](engineering/KASI_2027_BOUNDARY_EXECUTION_20261111.md). 아래 체크포인트는 당시 기록이며 최신 실행 위치는 이 절과 인계 문서를 따른다.


## 2026-11-11 current checkpoint — selectable nominal transition dates and period queries implemented

현재 주력은 **검증된 M7 기산 → 명시적 Gregorian 투영 → 첫 명목 교운일·대운 기간표 → 지정 시점 선택 → 근거형 JSON/한국어 출력**이다. 최종 코드/검사 SHA **ebedd7bda54f0ff06273a73ab960897bd216818e**에서 `kasi:luck`의 새 선택형 옵션을 구현했다. 기존 v0.1 결과는 중첩 `m7`에 보존하고, 새 `projection`에 정책 아래 명목 결과를 둔다. 출생 M1은 요청당1회이며 기존 M2/세운과 후보의 연결을 유지한다.

최종 코드 EB에서 전체 **469/469 PASS**, fail/cancel/skip/todo0이었다. 기존443개를 유지하고 M7 신규25개와 HTTP 준비/종료 회귀1개를 더했다. 기존 M2 감사와 Lab·KASI 실제 Chrome도 각각 첫 실행 자연 exit0이며 소유 브라우저·서버·프로필 정리를 확인했다. a88의 실제 CLI35개와 같은 생산 모듈을 사용하는 최종 EB 추가4개·npm --silent1개가 exit0/stderr 공백이었다. 기존 v0.1 JSON bytes와 새 JSON/TEXT의 재현성도 확인했다.

UTC·Asia/Seoul 두 프로세스가 같은 clean EB/Node22에서 각각47,975입력 묶음·95,950양/음력×성별 쌍·191,900제품=M1 호출·199,196후보를 검증해 자연 exit0이었다. 새 명목 투영191,738/AMBIGUOUS7,296/NEEDS_DATA162후보, 정상 기간1,917,380개를 각각 검사했다. 모든 v0.1 의미를 다시 해시해 이전 고정7c4f…de4eb9와 일치했고 새 투영 의미 b59cd6b0…841915 및 요약 bytes도 두 시간대에서 같다. 전 기간과 집중 as-of255선택·요청 격리/반례의 단위/건수는 실행 보고서에서 분리한다.

| 구분 | 현재 실제 범위·제한 |
| --- | --- |
| 기본 엔진/G0·기존 명식/M2·v0.1 |기본2026~2027과 선택형 API 출생1989~2026 유지. 새 옵션이 없으면 기존 결과/제한 유지 |
| 명목 교운일·기간표 |`M7-CALENDAR-NOMINAL-YMDH-SEQUENTIAL-CLAMP-V02`/0.2.0. M의 정수 Y/MO/D/H를 년→월→일→시 순차 가산·말일 제한, 최초 S에서 직접+10k년, 반개구간 |
| 시점의 대운 선택 |양력 민간시 `[1989-01-01T00:00,2027-01-01T00:00)`에서 명시 날짜/시각 필요. 첫 대운 전·출생 전·표 밖·자료 부족·후보 미확정을 구분 |
| 순수 명목 산술/미래 표 |유효 Gregorian0001~9999의 산술 범위이며 출생·미래 법정시/DST·세운 지원 확대가 아님 |
| 확보 자료/경계 |1950~2026 원본 불변.1988말 대설 보조 유지;2026말 순행의2027소한과2027세운 시각의 입춘은 별도 결손 |
| 열려 있는 한계 |측정된 교운 순간·다른 투영 정책·역사시·판본/권리·G1-P2 NO-GO. 길흉/신강약/격국/용신·최종 서비스 기본 정책 채택 아님 |

**비단조 성질을 보존한다.** 2026-01-31 12:00에서 M359는2026-03-02 10:00, M360은2026-02-28 12:00이다. 연·월 순차 제한과 최초 윤일 기준 직접 가산도 정책에 고정했다. 테스트 통과를 부드러운 물리 시간변환·예측 타당성으로 해석하지 않는다.

다음 최소 작업은 **2027 소한·입춘 두 이벤트의 별도 최소 자료 보강 검토**다. 각각2026말 기산/2027세운 조회의 다른 요구이며, 이번에 수집하지 않았다. 이 보강이 as-of·출생 지원이나 역사시 확대를 자동 승인하지 않는다. [복사 가능한 실행 명령](KASI_LOCAL_LUCK_PROJECTION_GUIDE.md) · [정책·근거·반례](research/M7_CALENDAR_PROJECTION_V02.md) · [실제 실행/검사/실패 기록](engineering/M7_CALENDAR_PROJECTION_EXECUTION_20261111.md). 아래 체크포인트는 당시 상태이며 최신 위치는 이 절과 인계 문서를 따른다.



## 2026-11-11 current checkpoint — M7 local time-axis calculations implemented

현재 사용자 승인 작업은 **현대 API 명식/후보 → 선택한 M7 정책 → 대운 방향·순서·기산나이 / 세운 → 근거형 JSON·한국어 출력**이다. 코드 **a7cdf8a2d459198a70abe4cd521ea89901b1888a**에서 새 `kasi:luck`를 완성했다. 기존 M1은 요청당1회이며 선택한 M2도 같은 결과를 사용한다. 전체443/443, 기존 M2 감사, KASI 실제 Chrome, 최초 정리 실패를 보존한 뒤 동일 코드1회 재실행한 Lab이 통과했다. 두 독립 UTC/Asia-Seoul 프로세스 각각47,975입력 묶음·95,950양/음력×성별 쌍·191,900제품/M1호출을 통과했다. 요약 bytes와 의미 지문이 같고 원본/후보a/b·실행7파일 지문은 불변이다. 기산은 성공191,738/동분 미확정7,296/자료 부족162후보로 구분한다.

| 구분 | 현재 실제 범위 |
| --- | --- |
| 기본 엔진/G0, 기존 chart/explain |2026~2027 기본 경로와1989~2026 선택형 API 명식/기초 설명 유지 |
| M7 대운 |동일 출생 지원 범위. 명시 MALE/FEMALE·연간 음양·월주 인접1~20항목·12절입 기산 M/4320모형년. 순서와 기산 상태를 분리 |
| 세운 |연도 라벨 정수1~9999는 순수 주기 산술. 시각 판정은 현대 정책과 해당 연도 실제 입춘 자료 필요;2027은 NEEDS_DATA |
| 자료/보조 경계 |확보1950~2026.1988말 대설은1989초 기산용 보조;2026말 순행은2027소한 부족. 출생 범위 확대 아님 |
| 보류 |정확한 달력 교운일·현재 대운은 POLICY_UNRESOLVED. 판본/권리·역사시·G1-P2 NO-GO 유지 |

다음 최소 작업은 **교운일 calendar projection 한 정책의 근거와 월말/윤일 독립 기대값 계약 검토**다.2027소한·입춘은 별도 최소 자료 요구 목록으로 남겼고 이번에 수집하지 않았다. 역사시/DST→1950확장, 심화 해석·Story/대화·Astra 콘셉트는 별도이며 이번에 착수하지 않았다. M7은 간지 배정/기산의 설명 가능한 계산이지 길흉/사건 예측 기능이 아니다. [실행 가이드](KASI_LOCAL_LUCK_GUIDE.md) · [정책10항목](research/M7_LUCK_POLICY_V01.md) · [실제 검증/실패/집계](engineering/KASI_M7_LUCK_EXECUTION_20261110.md). 아래 체크포인트는 당시 상태이며 최신 실행 위치는 이 절과 인계 문서를 따른다.



## 2026-11-10 current checkpoint — modern M1 → M2 → Korean basic explanation implemented

최신 사용자 우선순위는 **현대 API 명식 → 기존 M2 → 근거형 한국어 기초 설명**이다. 코드 **c80233f09108c7196c44dd26579358279ece3731**에서 실제 출생 형식의 가상 입력을 M1 한 번 → 후보별 M2 → 버전형 템플릿 → JSON/TEXT까지 실행했다. 전체419/419, M2 감사, Lab/KASI 실제 Chrome, 실제 비공개 UTC/AsiaSeoul 각47,975 양·음력 입력쌍이 통과했다. 모든13,879일 대표시각과38년 절입/지정경계·4정책 검사이며 외부 독립 인증은 아니다. 두 시간대 요약 bytes와 의미 지문이 같다. 원본/후보 불변·API0·키0이다.

| 위치 | 범위·다음 판단 |
| --- | --- |
| 기본 엔진·G0 |2026~2027 유지, 자동 교체 없음 |
| 선택형 API 명식+M2 기초 설명 |양력 환산 `[1989-01-01,2027-01-01)`, 양력/음력·시각·명시4정책·M2묶음 필수 |
| 데이터 확보 |1950~2026, 역사 시각 명식 지원 아님 |
| 이후 최소 검토 |대운·세운의 계산 정책과 최소 테스트 계약, 이번에 구현하지 않음 |
| 별도 확장 |역사시·DST→1950 시각 명식, 이번에 착수하지 않음 |
| 최종 제품 |심화 해석→Story/대화→별도 Astra 콘셉트·앱 연결, 이번 UI/배포 없음 |

[실행 가이드](KASI_LOCAL_EXPLANATION_GUIDE.md) · [검사·실패·출처·제한](engineering/KASI_API_M2_EXPLANATION_EXECUTION_20261110.md). 십성·장간·십이운성·관계/구성원 분류와 강약·격국·용신·합화·길흉·예측은 구분한다. 판본·권리 미확인, 상위 원전 등록부 공백, G1-P2 NO-GO는 유지한다. 아래 각 체크포인트의1988DST 다음 단계 표시는 당시 기록이며 최신 주력 순서는 이 절을 따른다.

## 2026-11-10 current checkpoint — selectable local API charts implemented

사용자 승인 순서 A→B를 실제 수행했다. A **183878fdfc1cecdd1f133eec41d0e7d978c48f00**에서2026년 API/기존fixture 통합18,240 양·음력 입력쌍·전체403/403·Lab/KASI 실제 Chrome을 통과한 뒤 B를 등록했다. B **6d75f24f7006a9dcabd701c410340d5ced7f1c51**에서 전체408/408·두 브라우저 PASS, 실제13,879일·47,975쌍 전수 내부/기존resolver 대조를UTC와AsiaSeoul에서 각각 통과했고 집계 bytes가 같았다. 원본과 기존후보는 불변, 추가 KASI 요청0건이다.

| 현재 경로/자료 | 실제 범위/상태 |
| --- | --- |
| 기본 엔진·G0 |2026~2027, 기존계약 유지 |
| 선택형 `kasi-api-2026-local-v1` |2026년 시각 포함 양력/음력 명식 실행 가능 |
| 선택형 `kasi-api-1989-2026-local-v1` |양력 환산 `[1989-01-01,2027-01-01)`, 명시 시각·기존4정책 필수 |
| 확보 데이터·연구 날짜 인덱스 |1950~2026, 역사 시각 명식 지원 아님 |
| 보류 |1988출생 DST gap/fold 연결,1950년대 시각/24:00 해석, 범위 밖 경계, 독립 전수 인증·재배포·G1-P2 |

실행은 [로컬 명식 가이드](KASI_LOCAL_CHART_GUIDE.md), 실제 비교·정책·실패·한계는 [A/B 보고서](engineering/KASI_API_LOCAL_CHART_EXECUTION_20261110.md)를 따른다. 다음 최소 연구 단위는1988년DST gap/fold를 기존 시간모듈로 정규화해 API KST와 비교하는 통합 테스트다. 기본 경로 자동 교체·역사시 확대·Story/배포는 이 완료로 승인되지 않는다. 아래 수집/연구어댑터 체크포인트는 당시 기록이며 현재 상태는 이 표를 따른다.

## 2026-11-10 current checkpoint — collected data preserved, research adapter executed

1950~2026 실제 수집은 완료됐다.77년/절기1,848행/음양력28,124행, 원문·receipt1,001개씩을 로컬 원문부터 오프라인 재검증했다. 코드 **fe84ab44ec4cd0efd27fb57c480a2b422d9decbc**에서 전 기간 연결·예외 목록·관측 범위 날짜 인덱스·출처/지문을 가진 비공개 후보2개가 재현됐다. 추가 KASI 요청0건, 원본 전체 지문 불변. 전체 **390/390**, KASI 웹/Lab 실제 Chrome 각각 PASS. 과거380개 실행 기록은 별도 보존한다. [연구용 실행 가이드](KASI_RESEARCH_ADAPTER.md) · [실행·실패·제한](engineering/KASI_RESEARCH_ADAPTER_EXECUTION_20261110.md).

윤달 월간지 null816행/28그룹,24:00 검토1행, 황경 미제공1,392행, 양끝 부분 월2개를 보존했다. 역사 시간/UTC/권리/TXT 원본 인증과 G1-P2 NO-GO는 열려 있다. 기본 엔진 지원연도와 production/Lab/G0 진입점은 그대로다. 다음 최소 통합 단위는 **2026년만 기존 계산기에 API 절기 후보를 주입하는 별도 연구 통합 테스트**다. 추가 수집을 먼저 반복하지 않는다. 이후 필요 시 boundary-requirements에 근거해1949말/2027초 최소 증거만 별도 검토한다.

아래 수집 준비·미실행 문구는 각 당시의 역사적 계획/실행 기록이며 현재 완료 상태는 위 체크포인트를 따른다.

**2026-11-09 local acquisition update:** user requested a 1950–2026 local collection system. Reused the existing Collector in a Windows x64 portable runner, with 1950/2026 complete-year sample gates, explicit 77year request confirmation, resumable private storage and offline export. Code/test **9ad13051**, **362/362 PASS** plus existing Chromium checks; native Windows/live full-range collection unverified. [Guide](KASI_LOCAL_1950_2026.md). Data acquisition is independent of M1 coverage/P2; neither is promoted. Next local unit is the two sample years with actual approved services; no Cloud live diagnosis or bulk requests were executed in preparation.

**Active direction: 2026-10-19 KST.** Engine correctness, provenance, supported coverage, explicit policies and reproducibility take priority until the owner changes direction. EP0–EP4 is **Manseryeok Lab**, an internal calculation/rule verification tool. Preserve its current UI and regression checks. Story App, EP5 UI, characters, webtoon, design concepts and deployment are paused; future product design belongs to a separate Astra task and is not this queue.

Current operational cursor: [EXECUTION_HANDOFF.md](EXECUTION_HANDOFF.md). Stable instructions: [AGENTS.md](../AGENTS.md). Detailed evidence and research gaps: [engine reassessment / G0 report](engineering/ENGINE_REASSESSMENT_AND_G0_EXECUTION_20261019.md).

## 2026-11-07 operational update — offline work first

Second review correction: M2 source ID sets no longer compare delimiter-joined strings. Code **72024d521560826cab001591bfc1019b70ba8a5c** rejects merging two IDs into one `|`-joined claim while retaining order independence. Latest full check **352/352**, standalone M2 audit and Lab Chromium PASS. Source records, runtime rules and open evidence gates are unchanged.

Review correction: monthly intake chronology was missing despite the earlier tests passing. Code **52f4ee61126c7462df05ee7089ddaac879b3c6ea** rejects reversed term dates and accepts reordered valid rows. At that SHA, full check **349/349**, Lab and KASI synthetic-upstream Chromium PASS. Existing Collector schema, calendar engine and source/rights gates are unchanged.

Owner paused Cloud KASI diagnosis and will supply locally obtained data. **Do not resume API calls from historical queue entries below.** Offline single-response intake is implemented at `4026bdb7e8c2ae37d3d943726be29539e872e4b4` (335/335 + both Chromium smokes). A bounded M2 policy/source audit is implemented at `03af44ec34489204a36692e8ca509ae03ad24aaa` (**345/345 + Lab Chromium**, M2 audit CLI PASS): 4 policies/9 rules/12 sources linked; 7 native rule version fields missing, editions/rights unverified. It is not a complete M2 registry. Neither tool adds data to the engine or authenticates sources. Next minimal unit: inspect one locally obtained response with its declared scope; actual data/source/rights qualification remains blocked on evidence. [Intake guide](KASI_LOCAL_INTAKE_GUIDE.md) · [M2 audit](research/M2_POLICY_CATALOG_AUDIT.md) · [execution](engineering/OFFLINE_VALIDATION_EXECUTION_20261107.md).

## 2026-10-25 Collector v0.1 — engine-independent acquisition tool

Common ordinary `KASI_API_KEY` now serves both APIs, with optional per-service overrides and separate utilization approvals. Strict TypeScript CLI (`scripts/kasi/`) now implements probe/collect/validate/export with private atomic checkpoints and hashes, bounded transport, explicit month/daily modes and sample gates. Exact tested SHA `fca4267df7329bd20a91bb9ba6f1290870ef5f02`: **318/318 Node**, TypeScript/build and actual Lab Chromium PASS. Existing G0/G1-P1/data/UI/year support unchanged. Actual keys absent/API host restricted; live 1950/2026 schema/pagination/precision and attached DOCX review remain UNVERIFIED. No authenticated collection or bulk request was executed. Next: live two-year probe, validate complete sample years, then explicitly consider bulk. API output stays a separate evidence surface, not ORIGINAL_ROW_VERIFIED or engine year promotion. G1-P2 remains NO-GO. [Guide](KASI_COLLECTOR_GUIDE.md) · [execution evidence](engineering/KASI_COLLECTOR_V01_EXECUTION_20261025.md).

## 2026-10-20 실행 순서 보강 — KASI API 활용, G1, 출생연도 확대

**상태: 계획·자료 명세 검토, 미실행.** 사용자는 KASI 특일 OpenAPI 15012690 인증키를 발급받았다고 밝혔다. 제공된 v1.4 가이드(2020년 개정)에는 \`get24DivisionsInfo\`의 \`dateName/locdate/kst/sunLongitude\` 응답 필드가 명시돼 있다. 특히 **\`kst\` 분 단위 시각 후보**가 있으므로 구문서에 근거한 ‘날짜만 제공’ 가정을 폐기한다. 그러나 라이브 호출과 응답 시각/라이선스의 현재 상태는 **UNVERIFIED**. KASI 음양력 15012679와는 별도 API/권한이다. 상세 결정 배경은 [개발 일지](DEVLOG.md)의 2026-10-20 기록 참조.

**분업:** 이 채팅은 문헌·독립 대조·정책·안전/정확도 결정, 키가 등록된 작업 실행환경은 호출·재현 가능한 수집 스크립트·테스트, Codex는 실제 엔진 구현과 GitHub 전달, Astra는 추후 별도 콘셉트/시장 검증. Work 클라우드 환경 변수는 별도 Codex 런타임에 자동 공유된다고 가정하지 않는다.

| 차례 | 독립 산출물 | 구현/검증 허용 조건 | 금지 또는 보류 |
| --- | --- | --- | --- |
| **R0 (첫 실험)** | 15012690 HTTPS/인증/JSON·XML/연도 페이지 처리/실제 \`kst\`·황경 확인, 2019·2026·2027 응답 스키마 및 2026/27 기존 48개 절기 비교 보고서 | 사용권·응답·출처판본을 기록. 노출 가능한 샘플만 저장하고 **키·전체 인증 URL 출력 금지** | 실사용 API 키/환경 없으면 요청 성공 주장 금지, 기본 fixture 수정 금지 |
| **G1 (현행 코드의 다음 안전 단위)** | 2026/27 절기 각 이벤트와 음력 월→출처/판본/정밀도/지문 검증 계약 및 반례 테스트 | 진짜 원본/판본 근거 확인 후 좁게 구현; 미확인 출처는 UNKNOWN/BLOCKED; 기존 G0 1회 M1 계산 불변 | 모든 행을 ‘KASI 공식 판본’으로 일괄 치환하거나 해시 일치=천문학적 진위로 주장 금지 |
| **Y1 (2025 단일 연도)** | 2024 대설 guard, 2025 절기 24개, 2025 연초 음력 공백 보완, 말단 경계·윤달·일주·시각 오라클 | NAOJ/독립 천문 계산 등 다른 생성 계열과 차이 보고; 권리 별도 검토; 전체 Node/Chromium 통과 후 범위 승격 | 1989~2025 전면 확장 일괄 Push 금지 |
| **Y2 (1989~2024 현대 범위)** | 연도별 지원 증거/누락·차이 레지스터, 재현 가능한 fixture 생성기, 경계·음력 oracle | Y1의 검증 게이트를 각 구간에 반복; 1987/88 DST는 현대 1989+와 분리 | 자료가 있다고 무검증으로 지원 선언 금지 |
| **H1 (역사 시간)** | 법령 원본+IANA 버전 비교, 표준시/DST gap/fold와 정책 차이 테스트 | 실제 생년 기록의 민간시와 UTC/태양시 정책을 구별 | 단일 UTC+9 역투영·임의 진태양시 보정 금지 |
| **M2/M3+** | M2 원전/학파별 명시 정책과 독립 사례, M3–M8 소스 게이트/계산 명세 | 학파/원전의 공백 해소 후 좁은 resolver 구현 | 예측 타당성 주장, 자동 신강/용신/길흉 단정 금지 |
| **Integration** | 변하지 않는 버전형 계산·근거 API, 샘플 데이터/오류 계약 | 각 범위의 데이터권리·개인정보·공개 보안/QA 별도 승인 | Story UI/EP5와 Astra 콘셉트 작업을 엔진 작업에서 시작하지 않음 |

**완성도 판정:** 테스트 그린만으로 완료라 하지 않는다. 기능별로 ① 계산 및 반례 테스트 ② 사용 연도/경계 연속성 ③ 독립 대조/불일치 해석 ④ 출처·판본 및 사용 권리 ⑤ 불확실성·정책 표현 ⑥ 안정적 계약을 구분하여 승인한다. **R0는 G1 설계의 실증 자료로 먼저 수행 가능하며, G1 구현은 R0가 준비될 때까지 판본을 지어내지 말고 출처 검토부터 한다.** 1989~2025 연도 확장은 제품 출시 보증이 아니다.


**2026-10-20 priority adjustment:** API setup was blocked by cloud-environment save/publish errors. Owner chose to **pause authenticated R0 API calls** and do independent engine work. **G1-P0 existing-corpus source audit is now completed as documentation only.** The key finding is that 49 solar events carry one KASI source ID but no per-event edition, while the 37 lunar month starts carry only corpus-wide annual \`sourceEditions\`; \`annualCalendarEditions\` in G0 comes from the lunar corpus. See [G1-P0 audit](research/G1_EVENT_MONTH_EDITION_EVIDENCE_AUDIT_20261020.md). Newly checked public indexed KASI pages expose 2025/26/27 V1.0a generation metadata, but no authenticated API, original TXT hash, complete 86-row fresh verification or new \`npm run check\`. **Next step: G1-P1 report-only immutable edition-evidence manifest + tamper tests, keeping unknown rows UNVERIFIED.** Integrating it into G0 is a separate gate. R0 may resume later when the execution environment is operational; it is no longer a blocker for P1 research or scaffolding. This supersedes the immediately preceding “R0 first” operational order only; all release and accuracy gates remain.

**G1-P1 checkpoint 2026-10-20 — exact checkout verified:** the report-only auditor/49-solar + 37-lunar manifest and 9 regression groups were pushed in [4efa763](https://github.com/kwh01116-cmd/Manseryeok-engine/commit/4efa763edab36b5386a5d51ee2c838e131f90694). Earlier reconstructed-data checks are historical evidence. Codex now tested exact work-branch HEAD **`9916d6cae8c7fd4ecb2d57818c55a96043d49116`**: Node 22.23.3 fresh `npm ci`, typecheck/build/full **292/292 Node PASS** (0 fail/cancel/skip/todo), actual Chromium 154.0.8037.57 Lab **PASS**. No execution failure or code repair. **P2 integration = NO-GO:** 0/86 original rows verified, all three original-document SHA values null, rights UNVERIFIED. Software gates passed; original row/edition evidence did not. Next: obtain/verify that evidence before a separate P2 reassessment. No G0/data/UI/coverage change or P2 implementation. [Execution addendum and decision](engineering/G1_P1_EVIDENCE_AUDITOR_EXECUTION_20261020.md).


**G1-E0 source check (2026-10-20, docs-only):** the search-index-visible KASI 2025/2026/2027 annual tables were hand-transcribed independently of repository code and compared with 49 solar + 37 lunar fixture rows: **86/86 matched (no differences)**. Evidence class `PUBLIC_INDEXED_WEB_TABLE_RECONCILED`, *not* `ORIGINAL_ROW_VERIFIED`; original TXT SHA **0/3**, strict original-row proof **0/86**, commercial rights unreviewed. G1-P2 stays **NO-GO**. Before any G1/P2 source promotion, fetch/verify actual KASI TXT for 2025/26/27, pin origin SHA and row/edition locations, and review rights; if unavailable, document failure rather than manufacture checksums. [Read full caveats](research/G1_PUBLIC_KASI_WEB_TABLE_RECONCILIATION_20261020.md).

## Completion criteria

A feature is assessed along separate axes: (1) implemented algorithm and adversarial tests, (2) traceable source/edition and field-level use rights, (3) independent external numerical/textual comparison, (4) finite supported coverage and explicit ambiguity/policies, (5) immutable/reproducible API contracts. Passing tests demonstrates the encoded behavior; it does **not** establish external calendar truth, textual authenticity, scientific predictive validity or commercial permission. No aggregate completion percentage is used.

- **IMPLEMENTED_AND_TESTED:** executable, scoped behavior verified in the exact checkout; external limitations still stated.
- **PARTIALLY_VERIFIED:** working components exist, but required external evidence, coverage or policy gates remain open.
- **RESEARCH_ONLY:** sources/specifications/test-only corpora exist without promotion to the supported runtime.
- **BLOCKED_BY_SOURCE_OR_POLICY:** no executable promotion until the identified source/dispute is resolved.
- **NOT_IMPLEMENTED:** no executable feature; a backlog title is not an implementation.

## Current M1–M8 assessment

| Milestone | Overall status | Actual scope and evidence | Unclosed gate |
| --- | --- | --- | --- |
| M1 modern calendar / Four Pillars | **PARTIALLY_VERIFIED** | 2026–2027 default Gregorian/lunar, explicit day/hour policies, minute Jie trace and correlated candidates; all 48 2026/27 term dates match pinned KASA day witnesses, all 48 minutes match independently transcribed NAOJ tables | Modern lunar independent daily oracle, minute rounding/seconds, per-field source rights, broader years and historical-time integration |
| M2 deterministic facts | **PARTIALLY_VERIFIED** | v1/v2/v3, one named profile each; hidden stems, ten gods, twelve stages, raw pairs and triad membership; 10×12/12×12/12⁴ finite tests | Critical editions, alternate school profiles, four-member earth-group decision and source-policy registry completeness; membership never establishes efficacy |
| M3 strength evidence | **BLOCKED_BY_SOURCE_OR_POLICY** | Decision spec and counterexamples only; no strength resolver | 月令/司令/root/activation/weights/precedence require independently reviewed school-specific rules |
| M4 pattern engine | **BLOCKED_BY_SOURCE_OR_POLICY** | Ordered pattern/topology requirements only; no resolver | Source-edition-specific formation/break/rescue/相神 cases and exception precedence |
| M5 useful-god / climate views | **BLOCKED_BY_SOURCE_OR_POLICY** | Separate structural/balancing/climate/medicine/bridging concepts, no resolver | Critical texts, commentary variants, conflicting recipes, explicitly separate policies |
| M6 follow / transformation | **BLOCKED_BY_SOURCE_OR_POLICY** | Requirements only; no classifier | True/false/disputed structures and activation conditions; raw 合 is insufficient |
| M7 Da-yun / Liu-nian | **RESEARCH_ONLY** | Boundary/arithmetic requirements, no executable start-age/direction/overlay | Direction policy, twelve-Jie definition, proportional age convention, precision and independently published witnesses |
| M8 supplementary / Korean practice | **NOT_IMPLEMENTED** | Backlog requirement only; no executable compatibility/Shen-sha profile | Named Korean sources/practices, editions, exceptions and independent reviewers |

Implemented finite M1/M2 subfeatures and G0 are **IMPLEMENTED_AND_TESTED within their stated scope**, not full milestone completion. Research 2000 is **RESEARCH_ONLY** despite runtime tests. Standalone historical base offsets/1987–88 DST have tests; the combined historical birth calculation is not supported. See the detailed report for file-level evidence.

## Ordered development queue

### 1. M1/M2 trust boundary and data provenance

**G0 completed:** server-selected fixture/manifest/annual-edition context, one M1 execution receipt, exact candidate/source/policy/schema verification and trusted M2 v1/v2/v3 entry points. Generic adapters retain structural-only guarantees. Tested code/test SHA: `0eb277645b7e87915c9dd6d68172a7d0516cce40`, Node 22 full **283/283**. Actual Lab Chromium remains required.

**Next independent unit G1:** versioned event/month-to-edition provenance manifest and repository fingerprint validation for the current corpus; retain event-specific evidence separately from the corpus source union. Link the existing fixture digest pins and edition records without claiming a cryptographic fingerprint authenticates an external publication. No new dates, no astronomical algorithm, no UI. Before implementation, verify the original metadata for each row/year; unresolved metadata stays blocked rather than inferred.

Exit: negative tests for unknown/wrong known source, edition, digest, manifest, corpus and candidate; mutation/serialization behavior specified; no M1 rerun or silent repair. Source rights are a separate gate.

### 2. Modern supported-year expansion and independent calendar comparison

Start with **one adjacent modern year**, provisionally 2025, only after its source packet is qualified. It requires the **2024 Daxue guard**, 2025 full 24 terms, late-2024 lunar boundary through 2025/26, end-exclusive witness and edition/rights review. The current 2025–2027 lunar corpus alone cannot serve January 1–28, 2025 or establish all-year Four Pillars.

Compare with independently published KASA/KASI/NAOJ witnesses at their actual precision and an independently pinned daily lunar oracle. KASI daily lunar API is a candidate only: no authenticated call/source integration exists and it does not supply proven minute-level solar terms. Prefer offline/build-time evidence, not per-user external calls. Consider documented independently licensed ephemerides/time scales only after precision/rounding policy is settled. Record disagreements rather than averaging or substituting sources.

Exit: full-year + guard + lunar wrap, all Jie minute ±1, 23:00/00:00 policies, leap dates/months, independent differentials, fail-closed coverage and full checks. Do not change default coverage while any gate is open. Test-only 2000 stays isolated.

### 3. Korean historical standard time, DST and time policies

Keep civil-time reconstruction separate from Myeongli time choice. Existing base-offset periods begin 1908-04-01; standalone 1987/88 DST rejects gaps/folds, but neither is wired into the modern composer. Research 1950 has a legal-text witness; it is not executable. Remaining 1948–51/1955–60 transitions and pre-1908 records require primary decrees and pinned IANA comparison, not a year-only DST list.

Exit: exact legal transition instants, explicit gap/fold choice, independent UTC/civil tests, source-tagged normalization and no retroactive UTC+9 assumption. Mean/apparent solar time requires independent longitude/equation-of-time methods and explicit policies; no true-solar-time boolean or silent adjustment.

### 4. M2 school-policy and source precision

Audit source/rule/version registry entries and two independently digitized critical editions. Preserve classical vs modern sources, MAIN_QI order vs membership, directed/reciprocal/self 刑 and simultaneous overlaps. Review a second profile only when real sources justify it. Keep 辰戌丑未 four-earth, half-group activation, combination transformation and seasonal hidden-stem weights out of executable facts until separately qualified.

Exit: explicit preconditions/exceptions/disputes, exact per-fact citations, independent table oracles and alternate-policy counterexamples. No strength or auspiciousness inference from raw membership.

### 5. Independent interpretation research (M3 first; M4–M8 remain gated)

Pin source editions/passages and distinguish base text, commentaries and modern/Korean practice. Develop independent positive/negative/counterexample cases before resolver code. Keep 月令, roots, 司令, twelve-growth convention, activation and exception precedence separate. No ad-hoc coefficient model, personality/fortune output or useful-god selection.

Exit: named school profiles, independently reviewed text-to-rule mapping, conflicting cases and refusal semantics. Software adherence to a tradition never establishes real-world predictive validity.

### 6. Stable reusable engine API

After source/policy boundaries stabilize, define immutable versioned DTOs with candidate identity, source/edition, coverage, precision, rule/policy versions, failure reasons and invalidation. Document generic vs trusted entry points. Receipts are in-process capabilities, not serialized signatures. Keep the Lab as a regression consumer. Future Astra product design may consume the verified engine through a separately authorized integration; no current UI migration or public service is scheduled.

## Delivery and current restrictions

Each narrow executable unit: counterexample → implementation → Node 22 TypeScript + full `npm run check` → relevant actual Lab Chromium → independent code/test/doc commits → ordinary fast-forward push only to `agent/m1-applied-jie-slice1-20261019`, after workflow inspection. No Actions, force push, main/foundation update, merge, public deployment, personal-data storage or paid service. Do not implement an unsupported feature merely to fill the roadmap.

The complete previous roadmap is preserved verbatim in [the historical roadmap archive](archive/ROADMAP_BEFORE_ENGINE_FOCUS_20261019.md). Its Story/UI queue and unattended priorities are superseded by this engine-first direction; old test claims remain dated historical evidence.
