# Sprint 2 제품 기능 행렬 — 2026-11-14

**DRAFT — Sprint 2 최종 코드·회귀·실제 CLI 증거를 연결하기 전이다.** 현재 표는 기존 실행 소스와 공개 제품 설명을 대조한 기능 감사다. 상용 만세력이 제공한다고 안내하는 기능과 우리 코드에서 실제 지원하는 범위를 나란히 놓았다. 기능 수나 광고 문구는 정확도·예측 효력의 증거가 아니다.

`PRODUCT_READY`는 명시한 범위의 로컬 기술 기능이 기존 구현·계약·회귀를 갖췄다는 뜻이다. 공개 서비스 출시·데이터 재배포·상업 이용권 승인은 별도 게이트다. `EXPERIMENTAL`은 명시적 선택 연구 정책, `PARTIAL`은 요구 기능의 일부만 구현, `NOT_IMPLEMENTED`는 실행 정책/경로 없음, `BLOCKED`는 별도 외부 조건 때문에 실행/출시할 수 없는 상태다. 표에서 관측 구성과 실제 작용, 후보와 최종 판정을 구별한다.

## 공식 공개 표면

아래 페이지를 **2026-11-14**에 직접 열거나 검색 도구가 반환한 해당 공식 개발자 등록 본문으로 확인했다. 스토어의 개발자 제공 설명은 1차 제품 설명이며 구현 검증 자료가 아니다. 앱을 설치하거나 개인 생일을 전송하지 않았고 유료 화면·백엔드·정책의 재현성은 검사하지 않았다. 이 확인일은 각 페이지의 불변 revision 날짜를 뜻하지 않는다.

| ID | 공식 표면 | 확인한 제품 기능 설명 | 이번 확인의 한계 |
| --- | --- | --- | --- |
| F | [포스텔러 만세력 Google Play](https://play.google.com/store/apps/details?id=com.forceteller.sajuAlmanac&hl=ko) · [공식 앱 홈페이지](https://pro.forceteller.com/app/) | 한글/한자, 용어 설명, 전문 이론 선택, 시태양시·야자시/조자시·시간/지역 보정, AI 상담, 명식 관리 | Google Play 갱신 표기2026-08-25. 웹 메인 본문은 JS 안내만 반환해 내부 계산 화면을 본 것으로 세지 않음 |
| C | [만세력 천을귀인 Google Play](https://play.google.com/store/apps/details?id=com.gooddaytoday.mynobleman&hl=ko) · [App Store](https://apps.apple.com/kr/app/id1506536946) | 팔자·야자시, 십신·지장간, 형충회합, 12운성·공망·신살, 대운·세운·월운, 일진, AI용 프롬프트 | 설명이 두 플랫폼에서 확인돼도 서로 독립된 계산 정답 검증은 아님 |
| H | [함사주 만세력 Google Play](https://play.google.com/store/apps/details?id=com.hamsaju.app&hl=ko) | 음력·윤달 입력, 자시 선택, 진태양시 보정, 명식·대세운·신살·공망 | 신규/소규모 여부와 관계없이 기능 명시만 채택. 보정 정확도·연대 범위 미확인 |
| S | [사주온 만세력 Google Play](https://play.google.com/store/apps/details?id=com.sajuon.izumiso&hl=ko) | 오행·신강신약, 격국·월령용사, 용신·희신·기신, 대운·세운·월운 | 격국 수·강약·용신이 우리 정책과 같은 정의라고 추정하지 않음 |
| G | [해공만세력 Google Play](https://play.google.com/store/apps/details?id=com.haegongmanse.app&hl=ko) | 원국·오행분포·격국·조후·강약, 대세월운, 궁합·택일 | 조후라는 기능명이 있다는 증거만 사용. 이론·예외·배점은 공개 설명에서 확인하지 못함 |
| J | [점신 App Store](https://apps.apple.com/kr/app/id960571015) | 사주·신년/오늘 운세, 연애·재물·직업 등 주제 풀이, 궁합·전문가 상담 | 현재2027신년 상품 안내가 우리2027출생 지원을 증명하지 않음 |

## 요청한 19개 기능

시장 열의 링크는 해당 기능을 **제공한다고 명시**한 사례다. 한 서비스의 설명에 없는 기능을 곧 미지원이라고 판정하지 않는다. 우리 열은 README 기능 목록 대신 실행 함수/소스를 기준으로 썼다. 기존 검증의 기준은 [Sprint 1 실행 기록](../engineering/SPRINT1_OFFLINE_M3_EXECUTION_20261114.md)의 최종 실행 코드 `131a0c551a5093e22ea22d6a66b37c31dae058df`이며, 이번 문서만으로 새 Sprint 2 PASS를 주장하지 않는다.

| # | 기능 | 시장의 명시적 제공 예 | 우리 상태 | 실제 구현·지원 범위 | 남은 한계/완료 조건 |
| --- | --- | --- | --- | --- | --- |
| 1 | 원국 8자 | [C](https://play.google.com/store/apps/details?id=com.gooddaytoday.mynobleman&hl=ko) | PRODUCT_READY | [`createLocalChartProfile`](../../scripts/kasi/local-chart.mjs#L52) → [`resolveCoverageCheckedModernKoreanCivilFourPillars`](../../src/calendar/fourPillars.ts#L95). 현대 한국 범위의 연·월·일·시주와 후보를 반환 | 1989–2026·분 시각·명시 정책. 시간 미상/역사시/2027은 해당 프로필 지원 밖 |
| 2 | 음양력·윤달 | [H](https://play.google.com/store/apps/details?id=com.hamsaju.app&hl=ko) | PRODUCT_READY | [`local-chart.mjs`](../../scripts/kasi/local-chart.mjs)의 GREGORIAN/KOREAN_LUNAR 입력과 기존 관측 인덱스 변환·윤달 검증 | 양력 환산 날짜가 출생 지원 범위 안이어야 함. 자료 양끝의 부분 음력 월을 완전 월로 꾸미지 않음 |
| 3 | 절입·자시 | [F](https://play.google.com/store/apps/details?id=com.forceteller.sajuAlmanac&hl=ko), [C](https://play.google.com/store/apps/details?id=com.gooddaytoday.mynobleman&hl=ko) | PRODUCT_READY | [`yearMonthPillars.ts`](../../src/calendar/yearMonthPillars.ts), [`dayRollover.ts`](../../src/calendar/dayRollover.ts), [`dayHourPillars.ts`](../../src/calendar/dayHourPillars.ts). 발표 절입 분의 상관된 후보와 네 일주/시주 정책 조합 | 초 단위 결정·확률·태양시 자동 보정은 제공하지 않음. 다른 자시 관례와 동일하다고 하지 않음 |
| 4 | 오행 분포 | [G](https://play.google.com/store/apps/details?id=com.haegongmanse.app&hl=ko) | PRODUCT_READY | [`local-analysis-report.mjs`](../../scripts/kasi/local-analysis-report.mjs#L110)는 기존 [`STEM_NATURE`](../../src/domain/stems.ts#L18)/[`BRANCH_NATURE`](../../src/domain/branches.ts#L17)로 천간4+지지 대표오행4의 무가중 개수·총8자리·장간 제외 정책을 JSON/TEXT에 표시 | 단순 표면 개수만 지원. 장간 수·계절 가중치·실제 힘·확률/비율·오행 차트와 구별. [`integrated-analysis-report.test.mjs`](../../test/integrated-analysis-report.test.mjs)의 고정 합성 명식은 목1/화6/토0/금0/수1을 독립 리터럴 검사 |
| 5 | 십성 | [C](https://play.google.com/store/apps/details?id=com.gooddaytoday.mynobleman&hl=ko) | PRODUCT_READY | [`tenGod`](../../src/domain/tenGods.ts#L47), [`branchTenGodFacts`](../../src/domain/branchTenGods.ts), M2 표면·장간 분류 및 한국어 설명 | 일간 표면 자신은 일반 십성 해석 슬롯에서 제외. 분류가 성격/직업 예측은 아님 |
| 6 | 지장간 | [C](https://play.google.com/store/apps/details?id=com.gooddaytoday.mynobleman&hl=ko) | PRODUCT_READY | [`hiddenStemsForBranch`](../../src/domain/hiddenStems.ts#L58), M2 `MAIN_QI/OTHER`와 member·rule·source 참조 | 본기는 이름 붙인 속성/표시 순서. 실제 사령일수·강도·비율은 미판정 |
| 7 | 12운성 | [C](https://play.google.com/store/apps/details?id=com.gooddaytoday.mynobleman&hl=ko) | PRODUCT_READY | [`twelveGrowthStage`](../../src/domain/twelveGrowthStages.ts#L46). 양순음역·화토동궁 선택 정책, 한국어 템플릿 | 다른 학파의 봉법/거법 전체나 12신살을 포함한 기능으로 확장하지 않음 |
| 8 | 합·충·형·파·해 | [C](https://play.google.com/store/apps/details?id=com.gooddaytoday.mynobleman&hl=ko) | PRODUCT_READY | [`collectFourPillarBranchRelations`](../../src/domain/branchRelations.ts#L145), [`stemCombinations.ts`](../../src/domain/stemCombinations.ts), [`triadMemberships.ts`](../../src/domain/triadMemberships.ts), [`deriveM3Evidence`](../../src/m3/structuralEvidenceV1.ts#L62). 위치쌍·방향·겹침·부분/완전 구성 보존 | 관계 존재 분류만 지원. 자동 합화·합거·통근 손상·길흉 작용은 미구현 |
| 9 | 신살 | [C](https://play.google.com/store/apps/details?id=com.gooddaytoday.mynobleman&hl=ko) | NOT_IMPLEMENTED | 실행 가능한 신살 resolver/정책 없음. [`getM2PolicyBundle`](../../scripts/kasi/local-chart-facts.mjs)의 지원 정책은 지장간·관계·삼합/삼회·12운성 | 이름/표·기준 지지·연/일 기준·중복 표시의 유한 정책과 사례가 필요. 12운성을 12신살로 세지 않음 |
| 10 | 공망 | [C](https://play.google.com/store/apps/details?id=com.gooddaytoday.mynobleman&hl=ko) | NOT_IMPLEMENTED | 기존 [`sexagenary.ts`](../../src/domain/sexagenary.ts)는 간지 기반 도메인 자료이며 공망 출력 경로는 없음 | 순공 기준·기둥 위치·범위의 정책/DTO·반례·설명을 추가해야 함 |
| 11 | 대운 | [C](https://play.google.com/store/apps/details?id=com.gooddaytoday.mynobleman&hl=ko) | PRODUCT_READY | [`resolveLuckDirection/resolveLuckStart/luckPillarSequence`](../../src/luck/luckV01.ts), [`projectNominalLuckCalendar/selectNominalDaYunAt`](../../src/luck/calendarProjectionV02.ts), [`createLocalLuckProfile`](../../scripts/kasi/local-luck.mjs#L62) + [`createLocalLuckProjectionProfile`](../../scripts/kasi/local-luck-projection.mjs). 순역·절입거리·3일1년 명목 시간축 | 달력 가산은 v0.2 별도 opt-in. 명시한 전통 성별 입력/선택 정책 필수. 명목 기간은 실제 사건 시기/길흉 아님. Sprint 1 네 모드 artifact에는 M7이 포함되지 않음 |
| 12 | 세운 | [C](https://play.google.com/store/apps/details?id=com.gooddaytoday.mynobleman&hl=ko) | PRODUCT_READY | [`annualLuckYearLabel/annualLuckAtMinute`](../../src/luck/luckV01.ts#L177), [`createLocalLuckProfile`](../../scripts/kasi/local-luck.mjs#L62). 순수 연간지와 실제 조회 분의 입춘 조건을 구별 | 표면/장간 십성 연결은 기존 M2. 사건·연애·재물 예측을 뜻하지 않음 |
| 13 | 월운 | [C](https://play.google.com/store/apps/details?id=com.gooddaytoday.mynobleman&hl=ko) | NOT_IMPLEMENTED | [`createLocalLuckProfile`](../../scripts/kasi/local-luck.mjs#L62)의 제품 선택은 대운/세운이며 월운 DTO·조회 정책 없음 | 원국 월주를 월운이라고 부르지 않음. 절입 경계·대세운과의 후보 연결 정책/회귀 필요 |
| 14 | 신강약 | [S](https://play.google.com/store/apps/details?id=com.sajuon.izumiso&hl=ko) | EXPERIMENTAL | [`weightedSupportV1.ts`](../../src/experimental/weightedSupportV1.ts), [`weighted-support.mjs`](../../scripts/experimental/weighted-support.mjs). 고정 배점·임계의 선택형5등급. 별도 [`limitedSynthesisV1.ts`](../../src/m3/limitedSynthesisV1.ts)는 좁은 조건과 보류를 반환 | 기존 M3 `finalStrength=NOT_IMPLEMENTED` 유지. 점수 실험 GO와 기본값 승격 NO-GO를 구별. 상관된 근/대표 오행 재사용을 공개 |
| 15 | 격국 | [S](https://play.google.com/store/apps/details?id=com.sajuon.izumiso&hl=ko), [G](https://play.google.com/store/apps/details?id=com.haegongmanse.app&hl=ko) | PARTIAL | 기존 [`deriveM4ZhengguanStructure`](../../src/m4/zhengguanStructureV1.ts#L86)·[`wealthResourcePositionV1.ts`](../../src/m4/wealthResourcePositionV1.ts), Sprint 2 [`deriveM4InnerPatterns`](../../src/m4/innerPatternsV1.ts). 명시 정책의 내격8 구조 후보와 peer 본기/午 OTHER 보류·경쟁 노출 보존 | 최종 成格·破格·救應, 단독 격 확정·우선순위·변격·외격은 미구현. 월령 기준 요소를 M5 도움 용신으로 바꾸지 않음 |
| 16 | 용신·희신·기신 | [S](https://play.google.com/store/apps/details?id=com.sajuon.izumiso&hl=ko) | NOT_IMPLEMENTED | [`zhengguanStructureV1.ts`](../../src/m4/zhengguanStructureV1.ts)의 효과 보류와 [`local-explain.mjs`](../../scripts/kasi/local-explain.mjs#L24)의 범위 제한. 도움 요소 선정 resolver 없음 | 부족 오행·격국 기준·실험 강약 등급을 추천으로 자동 변환하지 않음. 별도 선택 정책 필요 |
| 17 | 조후 | [G](https://play.google.com/store/apps/details?id=com.haegongmanse.app&hl=ko) | NOT_IMPLEMENTED | [`seasonalStateV2.ts`](../../src/m3/seasonalStateV2.ts)는 계절 분류·경계 대안을 제공하며 조후 처방 경로는 없음 | 계절 존재를 조후용신으로 부르지 않음. 별도 온습/처방 정책과 예외/반례 필요 |
| 18 | 종합풀이 | [F](https://play.google.com/store/apps/details?id=com.forceteller.sajuAlmanac&hl=ko), [J](https://apps.apple.com/kr/app/id960571015) | PARTIAL | [`createLocalAnalysisReportProfile`](../../scripts/kasi/local-analysis-report.mjs#L170)는 기존 M1/M2/M3·내격8·선택 점수/M7을 한국어6섹션과 요약으로 조합. 근거 참조와 미요청/보류 상태 보존. [`v0StoryProjection.ts`](../../src/story/v0StoryProjection.ts)는 별도 교육용 사실 투영 | 전 생애/개인 성향의 종합 해석은 없음. 근거 설명과 제한적 구조 리포트를 전체 사주풀이 완료라고 세지 않음 |
| 19 | 연애·직업·재물 풀이 | [J](https://apps.apple.com/kr/app/id960571015) | NOT_IMPLEMENTED | [`local-explain.mjs`](../../scripts/kasi/local-explain.mjs#L24)가 이 범위를 명시적으로 제외. 주제별 실행 해석/창작 정책 없음 | 財/官 분류를 부·직업·배우자 사건으로 직접 번역하지 않음. 사실·전통 풀이·창작을 구별하는 별도 콘텐츠 계약 필요 |

오프라인 artifact는 [`build.mjs`](../../scripts/offline/build.mjs), [`attach.mjs`](../../scripts/offline/attach.mjs), [`verify.mjs`](../../scripts/offline/verify.mjs), [`restore.mjs`](../../scripts/offline/restore.mjs), [`run.mjs`](../../scripts/offline/run.mjs)로 만들고 검증한다. 이는 위 기능 전부가 artifact에 포함됐다는 뜻은 아니다. Sprint 1 artifact의 chart/explain/evidence/experimental 네 모드는 유지한다. 새 통합 report는 저장소 [`local-analysis-report.mjs`](../../scripts/kasi/local-analysis-report.mjs) CLI이며 **Sprint 1 artifact에 포함하지 않는다**. 고정 Node22·저장소의 고정 의존성·기존 private 데이터로 네트워크/API키 없이 실행한다. M7 import에 연결된 기존 XML parser 의존성까지 이번 runtime bundling 범위를 넓히지 않았다. LLM 상담·궁합·택일·개인 명식 클라우드 저장/관리 서비스는 현재 구현 범위에 없다.

## 기간·시간·데이터 권리의 별도 게이트

| 항목 | 상태 | 제품 기능 상태와 구별해야 하는 이유 |
| --- | --- | --- |
| 1989–2026 현대 한국 출생, 양력 환산 `[1989-01-01,2027-01-01)` | PRODUCT_READY, 명시한 로컬 계산 범위 | 내부 회귀·출처 연결의 수락이며 전수 독립 천문 인증은 아님 |
| 1950–1988 출생 시각 명식 | BLOCKED / UNSUPPORTED | 연구 날짜 인덱스 보유와 역사 법정시/DST·시계 해석 지원은 다름 |
| 2027 출생 | BLOCKED / UNSUPPORTED | 소한·입춘 보강 두 건 또는 타사2027신년 상품은 연간 출생 계약을 넓히지 않음 |
| 시각 미상·역사시·진태양시 자동 보정 | NOT_IMPLEMENTED 또는 해당 입력 UNSUPPORTED | 임의 정오·평균 시각으로 보완하지 않음. 명시한 가상 정오 사례와 구별 |
| KASI 고정 자료 외부 재배포 | BLOCKED / RIGHTS_BLOCKED | private attachment만 허용. 코드 artifact에 자료/전체응답·키를 넣지 않음 |
| 상업 자료 이용권 확정 | BLOCKED / UNKNOWN | 내부 실행·타사의 KASI 언급·기관 공개자료와 이용권 승인은 별개 |
| 현재 loopback preview의 공개 서비스 전환 | BLOCKED | 기존 Host/Origin·요청 제한·CSP·비밀/개인정보·운영 검토와 자료 권리 게이트를 유지 |

## 이번 실제8종의 독립 기대 고정

[`inner-pattern-real-case-contracts-v1.json`](../../test/fixtures/inner-pattern-real-case-contracts-v1.json)은 **새 Sprint 2 resolver를 불러오거나 실행하기 전에** 기존 pinned M1→M2만으로 확인한 가상 날짜·네 기둥·월령 구성·예상 선택을 리터럴로 고정했다. 자료 pin은 기존 `8ffadb04c8460969085610162d3d5e8855af9272a8a4be1dbe10123c15f90edf`다. 원응답·source receipt·실제 M1/M2 DTO는 `.private/sprint2-20261114/`에만 두었다. 실제 인물의 출생 정보는 없다.

| 내격 기준 | 양력 가상 날짜·시각 | 사전 고정 월령 근거 | 정확 표면 노출 |
| --- | --- | --- | --- |
| 食神 | 2026-01-13 12:00 | 丁일간·丑 MAIN己 | 월간 |
| 傷官 | 2026-01-12 12:00 | 丙일간·丑 MAIN己 | 월간 |
| 偏財 | 2026-01-05 12:00 | 己일간·子 MAIN癸 | 없음 |
| 正財 | 2026-01-04 12:00 | 戊일간·子 MAIN癸 | 없음 |
| 七殺 | 2026-01-03 12:00 | 丁일간·子 MAIN癸 | 없음 |
| 正官 | 2026-01-08 12:00 | 壬일간·丑 MAIN己 | 월간 |
| 偏印 | 2026-01-01 12:00 | 乙일간·子 MAIN癸 | 없음 |
| 正印 | 2026-01-06 12:00 | 庚일간·丑 MAIN己 | 월간 |

기본8종은 첫 MAIN 사례를 택한 결과 **2026년1월·子/丑 월에 집중**됐다. 실제8종 연결을 확인하기 위한 표본이며 전체 연대/월령 분포 대표성을 주장하지 않는다. 첫 탐색14요청 후 다양성 조건을 고정한 추가45요청을 수행했고 모두 합쳐59 M1요청에서 멈췄다. 추가 탐색은 2026연간 최대365일과1989 가상 사례를 포함한 유한 계획이었다.

추가 정확 OTHER 사례 네 건은 별도 보류/경쟁 probe로만 보존한다. 食神02-09甲/寅과傷官02-10乙/寅의 peer 본기를 무시해 단독격을 확정하면 안 된다. 偏印02-13戊/寅·正印02-04己/寅에서는 비노출 MAIN의 七殺/正官과 정확 노출 OTHER印을 함께 보존해야 한다. 따라서 다양성이 좋다는 이유로 이 네 건을 명확한 primary8 대표에 끼워 넣지 않았다. 이는 새 resolver 결과에서 기대값을 뽑아 맞춘 것이 아니다.

기본 fixture 최초 고정 SHA256은 `63e7d999cee3d27ffe6b3ff1cf5d3a3f18aa7d9cf2719039843bfdf4d57cb14a`다. **새 resolver와의 실제 비교·JSON/TEXT 전문·최종 SHA·검사 수치는 부모의 Sprint 2 최종 실행 기록에 연결 대기**다. 이 문서 작성/선정 자체를 해당 검사의 PASS로 세지 않는다.
