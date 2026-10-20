# G1 P0 — 절기 이벤트 / 음력 월별 원본·판본 근거 감사 (2026-10-20)

**상태:** \`RESEARCH_AUDIT_COMPLETE / ENGINE_G1_NOT_IMPLEMENTED / NO_NEW_RUNTIME_TEST\`. 실행환경의 KASI API 인증키가 없어도 가능한 **기존 corpus의 판본·근거 점검**. 근거 불충분한 판본을 이벤트에 자동 부여하지 않는다. 이 문서는 코드·API·지원연도를 바꾸지 않는다.

## 1. 검토한 정확한 코드 및 검증의 한계

- 감사 대상 GitHub 작업 브랜치: \`agent/m1-applied-jie-slice1-20261019\`, 감사 시작 HEAD \`d869a79b535a1079ceb9514dd1343afda00b73ce\`.
- 직접 읽은 파일: \`src/calendar/koreaSolarTermFixtures.ts\`, \`src/calendar/koreanLunisolarFixtures.ts\`, \`src/calendar/solarTerms.ts\`, \`src/calendar/koreanLunisolarTypes.ts\`, \`src/validation/trustedKoreanPreview.ts\`, \`scripts/calendar-fixture-digest.mjs\`, \`test/calendar-fixture-digest.test.mjs\`; \`docs/research/SOURCE_REGISTRY.md\`, \`M1_CALENDAR_FIXTURE_DIGEST.md\`, \`M1_LUNISOLAR_FINITE_CONVERTER.md\`, \`CALENDAR_SOURCE_COMMERCIAL_RIGHTS_GATE_20261018.md\`, \`docs/engineering/ENGINE_REASSESSMENT_AND_G0_EXECUTION_20261019.md\`.
- 참고한 공개 KASI 연도별 달력자료: [2025](https://astro.kasi.re.kr/kor/life/post/calendarData?search_year=2025), [2026](https://astro.kasi.re.kr/kor/life/post/calendarData?search_year=2026), [2027](https://astro.kasi.re.kr/kor/life/post/calendarData?search_year=2027). 공개 검색 인덱스에 노출된 페이지 내용에서 연도·자료생성 메타데이터를 대조했다. **웹 브라우저의 전체 원본 페이지 및 TXT 파일을 독립 다운로드·SHA-256 대조하지 못했다.** 2027의 24절기 표는 검색 인덱스에도 노출되지만 이번 연구는 전체 49건을 외부 원본과 행별 재검사한 작업이 아니다.
- **발급받았다고 사용자로부터 들은 15012690 특일 API 키는 사용·열람하지 않았다. 인증된 API 호출은 0건.** PDF/Word의 \`kst\` 명세는 검토됐으나 실서비스 필드·오류 처리는 미검증. 15012679 음양력 API는 별도 접근 자격이다. 환경 설정 실패와 인증키 보안 문제를 엔진의 근거자료와 섞지 않는다.
- GitHub에서 읽은 구현/테스트의 존재와 과거 Codex가 보고한 Node 22 **283/283** 통과는 구별한다. 이번 감사에서는 repository \`npm run check\` 및 Chromium을 **재실행하지 않았다**.

## 2. 49건 태양 절기 provenance 감사

\`KOREA_SOLAR_TERM_EVENTS_2026_2027\`: **2025 DAXUE left guard 1건 + 2026 24건 + 2027 24건 = 49건**. 각 행은 \`term\`, \`displayedDateTime\`, \`timeBasis=KST\`, \`sourcePrecision=MINUTE\`, \`sourceIds=["KR-KASI-CALENDAR-DATA"]\`를 갖는다. **개별 \`SolarTermEvent\`에는 원본 연도별 파일 판본/생성시각/문서 지문이 없다.** 전역 source-ID의 존재 자체는 각 행의 특정 판본을 인증하지 않는다.

| 이벤트 범위 | 현행 값·행 개수 | KASI 연도별 페이지에서 확인한 생성 메타데이터 | 검증 수준 / 열려 있는 것 |
| --- | --- | --- | --- |
| 2025 guard | \`DAXUE 2025-12-07T06:05\` · 1 | \`V1.0a / 2024-05-07 14:23\` | 페이지 메타데이터가 노출됨; 현재 원본 TXT·guard 행의 SHA/해당 판본 직접 확인·상업 재사용 **미완료** |
| 2026 전 절기 | 24행, \`2026-02-04T05:02 LICHUN\` 포함 | \`V1.0a / 2024-07-25 16:57\` | 페이지 메타데이터가 노출됨; 기존 NAOJ 분 단위 대조 24개 보고는 별도 증거; **원본 자료 판본과 24행의 개별 결박 미완료** |
| 2027 전 절기 | 24행, \`2027-02-04T10:46 LICHUN\` 포함 | \`V1.0a / 2026-06-30 12:33\` | 페이지 메타데이터가 노출됨; 기존 NAOJ 24개 대조 보고는 별도 증거; **원본 TXT 지문과 개별 행의 판본 결박 미완료** |

**확인된 내부 SHA-256 fixture pin**: \`15363d490a4d86cf37dd826fcff7aa5425d630276c4d9a79a23a405a94b066c4\`. Canonical JSON tuple 형식은 \`scripts/calendar-fixture-digest.mjs\`에 정의돼 있다. 이 값은 현재 **저장소의 49건 복사본**에 대한 무결성 지문이지 **KASI 원본 TXT 해시**가 아니다. 동일하다고 오인하거나 원본 판본을 인증했다고 주장하면 안 된다.

**절기 원본 vs 공식 공표 차이:** 2026/27 KASA 관보 월력요항 날짜 48개와 KASI 계산표의 날짜 비교는 보고돼 있다. 당시 공식 표는 일 단위 날짜이므로 분 단위 판본 확인은 KASI 자료 및 NAOJ 교차 확인의 영역이다. \`KASA_AUTHORITY_SOURCE_IDS\` 상수는 존재하지만 실제 이벤트의 \`sourceIds\`에 KASA를 넣지 않은 것은 **의도적으로 맞는 경계**다.

## 3. 37건 음력 시작일 provenance 감사

\`KASI_KOREAN_LUNISOLAR_2025_2027\`는 **음력 2025 13개월(윤6월 포함), 2026 12개월, 2027 12개월 = 37개 시작일**. \`sourceEditions\`는 \`2025/2026/2027\` 연도별 생성 시각을 가지고 있지만, \`KoreanLunarMonthRecord\`는 \`lunarYear, lunarMonth, isLeapMonth, gregorianStart, days\`뿐이다. 따라서 월별 원본/생성판본/출처 위치를 독립적으로 결박하는 계약은 없다.

| 음력 연도 | 현행 월 수 | 저장소의 연도별 판본 | 꼭 확인할 경계 |
| --- | ---: | --- | --- |
| 2025 | 13 | \`V1.0a/2024-05-07T14:23\` | 윤6월 \`2025-07-25\`, 음력 2025년 12월 \`2026-01-19\` 시작 |
| 2026 | 12 | \`V1.0a/2024-07-25T16:57\` | 음력 2026년 12월 \`2027-01-08\` 시작 |
| 2027 | 12 | \`V1.0a/2026-06-30T12:33\` | 음력 2027년 12월 \`2027-12-28\` 시작; corpus 말단 \`2028-01-27\` 제외 |

**중요한 설계 반례:** \`gregorianStart.slice(0,4)\`를 사용해 월의 출처 연도를 매기면 **음력 2025년 12월은 2026년판**, **음력 2026년 12월은 2027년판**으로 잘못 연결된다. 출처 판본의 기본 문맥은 **명시된 \`lunarYear\`**이다. 다만 월별 원문 증거 확인 없이 \`sourceEditions[lunarYear]\`를 *자동으로 원본 인증*하는 것은 여전히 잘못이다.

**확인된 내부 SHA-256 fixture pin:** \`d0dc8222af3afa19ee354e9e59b2251b40e0a1083fd9c8377cc0d5b8ce7c80ef\`. 이 값은 내부 37개월과 연도별 \`sourceEditions\` 객체 직렬화 지문이며 외부 KASI 원본 파일 인증이나 실제 음력 역법 정확도의 증명이 아니다.

## 4. G0 vs G1 — 현재 코드에서 확인된 빈틈

- **이미 작동하는 G0:** \`trustedKoreanPreview.ts\`는 서버 측 고정 fixture/manifest와 불변 M1 실행 snapshot·receipt를 묶고, 정확한 사용 절기 이벤트/후보·스키마·정책·source-ID를 검증한 다음 신뢰된 M2 진입점으로 전달한다. 임의 출처 문자열은 **trusted** 경계에서 거절된다. 범용 M2 v2/v3는 별도 trusted input 가정이다.
- **아직 없는 G1:** \`KOREAN_LAB_PREVIEW_CONTEXT.annualCalendarEditions\`는 **음력 corpus의 \`sourceEditions\`를 복사**한다. 이 값이 49개 개별 절기 이벤트가 실제로 같은 판본에서 전사됐다는 증거는 아니다. 태양 이벤트 구조에 \`edition\` 필드 자체가 없고, 월의 개별 증거 경로도 없다. 두 다른 종류의 corpus에 모두 \`KR-KASI-CALENDAR-DATA\`만 쓰는 것 또한 자료 판본의 혼동 위험이다.
- **이미 있는 해시 핀:** 코드를 무단으로 수정하는 행위는 탐지하지만, 같은 논리적으로 잘못된 자료와 지문을 함께 승인하거나 외부의 원본과 불일치할 위험을 해결하지 못한다.
- **외부 API 주의:** 15012690의 \`kst\` 필드를 나중에 실제 호출로 확인하더라도 그 응답의 판본·정밀도·재사용권을 별도로 기록해야 한다. 기존 KASI 연도별 TXT와 API를 같은 원본인 것처럼 취급하지 않는다.

## 5. 다음 구현 G1-P1 계약 — 작고 되돌릴 수 있는 단위

**사전 원칙:** 새 자료를 추측하지 않는다. G1은 외부 원본 증거를 수집·검증한 뒤 현재 corpus를 엄격하게 결박하는 작업이지, 자료가 없다며 현행 Lab를 무조건 중단시키거나 지원 연도를 확대하는 작업이 아니다.

1. **Report-only manifest first:** 태양 49개는 \`(term, KST datetime)\`, 음력 37개는 \`(lunarYear,lunarMonth,isLeapMonth,gregorianStart)\`를 고유한 행 정체성으로 두고, 별도 **versioned evidence manifest**에 \`surface\`, \`page edition\`, \`row evidence location\`, \`precision\`, \`evidence level\`, \`source rights\`를 기록한다. 기존 fixture를 덮어쓰지 말고 manifest 자체를 별도 감사 데이터로 둔다.
2. **보장 수준을 분리:** \`REPOSITORY_ROW_PINNED\`, \`PAGE_EDITION_OBSERVED\`, \`ORIGINAL_ROW_VERIFIED\`, \`INDEPENDENT_COMPARISON_CONFIRMED\`, \`RIGHTS_REVIEWED\`는 서로 다른 상태·증거다. 한 상태가 다른 상태를 자동 의미하지 않는다. \`UNKNOWN\`은 가짜 값 대신 허용되는 *감사 상태*지만, 강한 trusted-original claim으로 자동 승격되어서는 안 된다.
3. **원본 증거 게이트:** 원본 행의 판본 연계, 반올림/표시 분, 시간 기준, 2025 guard, 2026/27 각 24건, 음력 37개월/윤달, 원본 다운로드가 가능한 경우 원본 파일 해시를 별도 확인. KASI 계산 참조와 KASA 공식 관보를 구별한다. 게시물 metadata만 보였으면 원본 TXT digest를 생성했다고 주장하지 않는다.
4. **테스트:** (a) 동일한 \`sourceId\`에 다른 판본을 끼워 넣기, (b) 2026/27 Lichun 행 스왑, (c) 2025 guard의 소실, (d) 2027 연말 터미널 이벤트, (e) 음력/양력 연도 경계의 \`lunarYear\` 와 \`gregorianStart\` 엇갈림, (f) 2025 윤6월, (g) 실제 판본이 없는 임의 \`edition\` 표기, (h) corpus ID / SHA 변조, (i) 다른 실행/후보 교환, (j) 원본 미검증에 \`ORIGINAL_ROW_VERIFIED\` 승격 시도. 기존 G0의 단일 M1 실행과 원본 candidate identity를 유지한다.
5. **진입점 통합은 별도 P2:** P1이 원본 행 증거와 전체 회귀 테스트를 통과하고 각 검증 수준을 명확히 만든 뒤 \`trustedKoreanPreview.ts\`에 선택적으로 바인딩한다. 기존 일반 명식 계산 결과를 변경하는 암묵적 강제 전환은 하지 않는다. 소프트웨어 일치와 상업적 권리 승인은 분리한다.

### 다음 Codex 작업의 최소 승인 범위

- \`G1-P1\`의 **report-only immutable evidence manifest / auditor + 단위·변조 회귀 테스트**까지만 구현.
- 원문 원본 확인이 안 된 행은 \`UNKNOWN\` 또는 \`PAGE_EDITION_OBSERVED\` 수준으로 남기고, 추정된 edition으로 GREEN을 채우지 않는다.
- G0 실행 경로, 2026~2027 런타임 커버리지, M2/UI는 유지. Node 22 \`npm run check\`, 기존 Chromium smoke는 실제 Codex 실행환경에서 돌리고 정확한 코드 SHA 기준 기록.
- 기존 PR/브랜치 규칙과 Actions 0 원칙을 지킨다. 이 채팅에는 인증키가 없으므로 KASI API 호출 성공은 완료 조건에 포함하지 않는다.

## 6. 다음 절차와 승인 기준

- **지금 완료:** 기존 49절기/37개월 + 출처코드/G0 구현을 실제 GitHub에서 감사, 공개 KASI 연간 페이지 판본 메타데이터 확인, 구체적 G1-P1 계약 및 역연도 반례 도출.
- **미완료:** 원본 TXT 전수 재다운로드/지문 확인, 86개 행의 원본·판본 전수 비교, 별도 API 실호출, 새 실행 코드·테스트, 상업 이용권/공개 서비스 승인.
- **다음:** G1-P1 최소 구현 → 원본 문서/판본 증거의 외부 교차확인 → G1-P2 신뢰 경계 선택적 통합 → 2025 단일 인접 연도 연구 → 1989~2024 확대 → 한국 역사 시간 → M2/M3 소스 정책.
- 구현 당시 새 코드가 추가되면 [누적 개발 일지](../DEVLOG.md)에 테스트 환경/실패·반례/정확한 SHA/권리 한계를 누적한다.

> 편집 금지: 사용자 인증키 값·전체 URL, 개발자의 생년월일, 원본 전체 KASI 테이블의 무권한 복제. 공식 KASA 자료의 KOGL 라이선스와 공공데이터포털 API 이용조건은 **서로 다른 법적 객체**다.
