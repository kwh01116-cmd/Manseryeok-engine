# Sprint 3 제품 기능 행렬 — 2026-11-14

검증 코드 `10196ab0acb8ed60774e2d98051ae670548725bf`에서 사용자에게 제공되는 실행 기능을 기준으로 갱신했다. 고정 Node22.23.3·TS5.8.3의 최종 전체 회귀는 **858/858 PASS**, fail/cancel/skip/todo0이다. 과거811개 통과를 현재 검증으로 세지 않았다. 실제 오프라인 복원과 private 연결 검사 범위는 [Sprint 3 실행 기록](../engineering/SPRINT3_PRODUCT_ANALYSIS_EXECUTION_20261114.md)에 분리한다.

`PRODUCT_READY`는 **명시한 현대 한국·정책 범위의 로컬 기술 기능**이 실행·계약·회귀를 갖췄다는 뜻이다. 상업적 공개 가능·달력 자료 재배포권·예측 효력 인증이 아니다. `EXPERIMENTAL`은 명시 선택 휴리스틱, `PARTIAL`은 기능 중 한정 범위만 실행, `NOT_IMPLEMENTED`는 실행 정책/경로 없음이다. `BLOCKED`는 별도 입력·권리·운영 게이트다.

## 시장 비교의 확인 수준

동일 날짜의 [Sprint 2 공식 제품 표면 확인 기록](SPRINT2_PRODUCT_FEATURE_MATRIX_20261114.md#공식-공개-표면)을 재사용한다. 포스텔러·천을귀인·함사주·사주온·해공·점신의 공식 개발자 설명을 근거로 기능명이 안내된다는 사실만 비교했다. 이번 Sprint에서 유료 화면·앱 계산·서버·숨은 정책을 새로 감사한 것은 아니다. 두 스토어에 같은 설명이 있어도 독립적인 정답 검증으로 세지 않는다. 기능명의 일치가 학파 정의·계산 정확도·예측 타당성의 일치를 뜻하지 않는다.

## 19개 기능의 실행 범위

| # | 기능 | 공식 제품 설명 예 | 우리 상태 | 실제 실행 코드·새로 제공하는 정보 | 남은 한계 |
| --- | --- | --- | --- | --- | --- |
| 1 | 원국8자 | [천을귀인](https://play.google.com/store/apps/details?id=com.gooddaytoday.mynobleman&hl=ko) | PRODUCT_READY | [`local-chart.mjs`](../../scripts/kasi/local-chart.mjs), [`fourPillars.ts`](../../src/calendar/fourPillars.ts). 연·월·일·시주와 상관 후보를 기존대로 보존 | 양력 환산1989–2026·분 시각·명시 정책. 역사시/2027 출생 미지원 |
| 2 | 음양력·윤달 | [함사주](https://play.google.com/store/apps/details?id=com.hamsaju.app&hl=ko) | PRODUCT_READY | 기존 관측 인덱스의 GREGORIAN/KOREAN_LUNAR·윤달 입력과 동일 양력 환산. 복원 artifact에서도 의미 일치 확인 | 자료 보유기간과 출생 지원기간을 구별. 환산 날짜가 지원 범위 안이어야 함 |
| 3 | 절입·자시 | [포스텔러](https://play.google.com/store/apps/details?id=com.forceteller.sajuAlmanac&hl=ko) | PRODUCT_READY | [`yearMonthPillars.ts`](../../src/calendar/yearMonthPillars.ts), [`dayRollover.ts`](../../src/calendar/dayRollover.ts), [`dayHourPillars.ts`](../../src/calendar/dayHourPillars.ts). 절입 상관 후보와 네 자시 조합 | 초·확률·진태양시/역사DST 자동 보정 없음 |
| 4 | 오행 분포 | [해공](https://play.google.com/store/apps/details?id=com.haegongmanse.app&hl=ko) | PRODUCT_READY | [`local-analysis-report.mjs`](../../scripts/kasi/local-analysis-report.mjs)와 새 [`local-product-report.mjs`](../../scripts/kasi/local-product-report.mjs)의 같은 표면8자리 단순 집계 | 장간·계절 가중치·실제 힘의 비율이 아님 |
| 5 | 십성 | [천을귀인](https://play.google.com/store/apps/details?id=com.gooddaytoday.mynobleman&hl=ko) | PRODUCT_READY | [`tenGods.ts`](../../src/domain/tenGods.ts), [`branchTenGods.ts`](../../src/domain/branchTenGods.ts). 표면/장간의 위치별 분류와 상세 근거 보존 | 십성을 성격·직업·사건으로 자동 번역하지 않음 |
| 6 | 지장간 | [천을귀인](https://play.google.com/store/apps/details?id=com.gooddaytoday.mynobleman&hl=ko) | PRODUCT_READY | [`hiddenStems.ts`](../../src/domain/hiddenStems.ts)의 동일 장간 정책·MAIN_QI/OTHER·member 참조. M5도 이 완전한 기존 구성을 재사용 | 표시 속성은 사령 일수·강도·비율 아님 |
| 7 | 12운성 | [천을귀인](https://play.google.com/store/apps/details?id=com.gooddaytoday.mynobleman&hl=ko) | PRODUCT_READY | [`twelveGrowthStages.ts`](../../src/domain/twelveGrowthStages.ts). 기존 양순음역·화토동궁 선택 정책과 설명 유지 | 12신살이나 모든 학파를 포함한 기능이 아님 |
| 8 | 합충형파해·삼합/삼회 | [천을귀인](https://play.google.com/store/apps/details?id=com.gooddaytoday.mynobleman&hl=ko) | PRODUCT_READY | [`branchRelations.ts`](../../src/domain/branchRelations.ts), [`stemCombinations.ts`](../../src/domain/stemCombinations.ts), [`triadMemberships.ts`](../../src/domain/triadMemberships.ts). 실제 위치·반복·겹침 보존 | 관계 존재만으로 합화·합거·근 손상·길흉을 확정하지 않음 |
| 9 | 신살 | [천을귀인](https://play.google.com/store/apps/details?id=com.gooddaytoday.mynobleman&hl=ko) | NOT_IMPLEMENTED | 신살 기준/표/중복 처리의 실행 프로필 없음 | 12운성을 신살 구현으로 세지 않음. 별도 유한 정책 필요 |
| 10 | 공망 | [천을귀인](https://play.google.com/store/apps/details?id=com.gooddaytoday.mynobleman&hl=ko) | PRODUCT_READY | **신규** [`gongmangV1.ts`](../../src/domain/gongmangV1.ts). M1 선택 일주의 순과 공망 두 지지, 원국 대응 위치·정책/fact 참조.60갑자 리터럴 검사, product/artifact 출력 | 존재 계산만 지원. 운 지지 대응 함수는 재사용 가능하나 효력·길흉·공망 해소를 평가하지 않음 |
| 11 | 대운 | [천을귀인](https://play.google.com/store/apps/details?id=com.gooddaytoday.mynobleman&hl=ko) | PRODUCT_READY | [`luckV01.ts`](../../src/luck/luckV01.ts), [`calendarProjectionV02.ts`](../../src/luck/calendarProjectionV02.ts). 기존 순역·절입 거리·모형 나이·선택 명목 기간/조회. **v2 artifact product에도 연결** | 명시 정책·방향용 성별값 필수. 미래 결손을 추정하지 않음. 명목 교운일은 실제 측정 교운 순간 아님 |
| 12 | 세운 | [천을귀인](https://play.google.com/store/apps/details?id=com.gooddaytoday.mynobleman&hl=ko) | PRODUCT_READY | [`luckV01.ts`](../../src/luck/luckV01.ts). 연도 간지 라벨과 조회 분의 입춘 판정 분리. **v2 artifact에도 연결** | 시계/자료 범위와 표시 분 대안 보존.2027 연도 라벨 계산과2027시각 지원은 다름 |
| 13 | 월운 | [천을귀인](https://play.google.com/store/apps/details?id=com.gooddaytoday.mynobleman&hl=ko) | PRODUCT_READY | **신규** [`monthlyLuckV1.ts`](../../src/luck/monthlyLuckV1.ts), [`local-monthly-luck.mjs`](../../scripts/kasi/local-monthly-luck.mjs). 기존 M1의12절·연월주 함수를 재사용. 입춘 기준12월표·독립 시각 조회·실제 시작/종료 자료·동분 상관 대안 | 양력 매월1일 기준이 아님. 현대 시계 범위 한정.2026말 구간 자료 결손/2027정책 미확정 보존. 월별 사건은 없음 |
| 14 | 신강약 | [사주온](https://play.google.com/store/apps/details?id=com.sajuon.izumiso&hl=ko) | EXPERIMENTAL | [`weightedSupportV1.ts`](../../src/experimental/weightedSupportV1.ts)의 기존 선택 휴리스틱5등급. 계절·구성상 근·제한적 생조/종합도 기존대로 보존 | 실험 점수 기본 비활성. 전체 M3 `finalStrength=NOT_IMPLEMENTED` 유지. M5의 확정 근거로 쓰지 않음 |
| 15 | 격국 | [사주온](https://play.google.com/store/apps/details?id=com.sajuon.izumiso&hl=ko) | PARTIAL | [`innerPatternsV1.ts`](../../src/m4/innerPatternsV1.ts) 내격8 구조 후보·정확 투출·경쟁/호환 보류. 기존 정관/C1 보존. **고정21사례를12월지·10일간으로 보강** | 성격/파격/구응·최종 단독 취격·변격/외격 미구현. 대표격을 최종 용신으로 쓰지 않음 |
| 16 | 용신·희신·기신 | [사주온](https://play.google.com/store/apps/details?id=com.sajuon.izumiso&hl=ko) | PARTIAL | **신규 제한 기능** [`limitedPurposeV1.ts`](../../src/m5/limitedPurposeV1.ts). 甲乙×亥子의 화 미관측 시 온기 검토 FIRE 후보; 기존 화·범위/자료/조건 미정은 HOLD. 목적·trace·반대/미평가 근거 제공 | 최종 용신·억부/격국 목적 통합·희기 순위 없음. 아래 조후 행과 **동일한 M5 기능**이므로 두 독립 신규 알고리즘으로 세지 않음 |
| 17 | 조후 | [해공](https://play.google.com/store/apps/details?id=com.haegongmanse.app&hl=ko) | PARTIAL | 같은 겨울 목 **한 목적** M5 후보 정책. 고전 겨울 목/화 문맥과 프로젝트 채택 guard를 구별. 기존 왕상휴수사 분류와 별도 결과 | 전월령/전일간의 한난조습·수량·기존 화의 충분성·조후용신 처방은 미구현. 과학적 온도/효력 측정 아님 |
| 18 | 종합풀이 | [포스텔러](https://play.google.com/store/apps/details?id=com.forceteller.sajuAlmanac&hl=ko), [점신](https://apps.apple.com/kr/app/id960571015) | PARTIAL | **신규 사용자 view** [`local-product-report.mjs`](../../scripts/kasi/local-product-report.mjs). 동일 발급 데이터의7섹션 간결 요약+상세 근거. 사주/오행·구조·계절/근·M5·공망·요청 운 정보를 한 경로에서 설명. v2 오프라인 실행 | 사용자 요약에서 없는 판단을 창작하지 않음. 개인 성향/인생 전체풀이·주제별 사건은 없음 |
| 19 | 연애·직업·재물 풀이 | [점신](https://apps.apple.com/kr/app/id960571015) | NOT_IMPLEMENTED | 주제별 전통/창작 콘텐츠의 실행 정책 없음 | 財/官·死/囚·공망을 재물·직업·건강·불운으로 자동 번역하지 않음. LLM/스토리/UI는 추가하지 않음 |

현재19행은 **PRODUCT_READY12 / PARTIAL4 / EXPERIMENTAL1 / NOT_IMPLEMENTED2**다. Sprint2의10/2/1/6과 비교하면 공망·월운이 실행되고, 같은 한정 M5를 반영해 용신/조후 행이 PARTIAL로 바뀌었다. 기능 크기·적용 범위가 다르므로 완성률이나 해석 정확도 퍼센트로 계산하지 않는다.

사용자가 실제로 새로 받는 것은 **한 목적의 후보 또는 구체적 보류**, **선택 일주 기준 공망과 대응 위치**, **12절 기준 월운표/조회**, **동일 근거를 간결하게 읽는 사용자 요약**이다. 새 통합 artifact에서 이 정보와 기존 M1/M2/M3/M4/M7을 원본 저장소·Git/npm·API키·네트워크 없이 실행한다. 이는 런타임 전달 방식의 확대이며 별도 명리 알고리즘 한 개로 중복 집계하지 않는다.

## 실제 검증 범위

- M5: 사전 고정18합성 계약과120천간×월지 eligibility, 기존 화/효력 미정·범위 밖·자료 부족·누락/변조 구분. 원전 예측 정답률 검사 아님.
- 공망:60갑자 전체의 고정 순공 기대와 일주 교체/위치 대응. 기존 일주 산출을 복제하지 않음.
- 월운:12절 전/동분/후·연말/양력월 구분·입춘·2026결손/2027시계 범위, UTC/Seoul 의미 재현. 월별 길흉 검증 아님.
- 통합: 최종 코드에서 저장소 밖 복원 artifact80성공/8오류거절/3경로거절,36시간대 byte 대조·동등 음력 의미 일치·network/key0. summary/detailed가 같은 요약과 근거를 사용함을 확인.
- private 연결: 시간대별228양력/음력 쌍과 추가 probe 총518요청·520원국 부모, M5 후보8/보류512. 월운40독립 조회/시간대는 추가 출생M1이 없음. 전체1036제품 요청의 실제 M1/M2/M3는 각각1036회. 원국 부모·계절 대안·분석 대상 수를 입력 수로 바꾸지 않음.
- 전체 회귀858/858 PASS, M2 감사 `CATALOG_CONSISTENT_EVIDENCE_OPEN`, Lab/KASI 실제 Chromium 각각 자연 종료0. M2 감사는 판본/권리/해석 수락이 아니며 KASI 브라우저는 합성 upstream 회귀다. 실패와 재검사, 실행 SHA와 문서 후속 원격 HEAD는 실행 기록에 보존. 기존49,799쌍 전수는 이번 Sprint에 실행하지 않았으며 층화 연결검사를 전수로 표시하지 않는다.

기존 원본·export·후보 a/b·2027 보강의 고정 지문과 정책 의미를 유지한다. 제품 리포트의 JSON provenance와 same-process 발급 검증은 외부 인증 또는 상업 이용권 승인이 아니다.

## 출시 차단 요소

| 게이트 | 상태 | 남은 최소 조건 |
| --- | --- | --- |
| 1989–2026 현대 한국 로컬 실행 | 명시 범위 기술 GO | 현재 고정 정책/자료와 회귀 유지 |
| 1950–1988 시각 명식 | BLOCKED / UNSUPPORTED | 역사 법정시·DST·발표시계 해석과 독립 경계 검증 |
| 2027이후 출생·조회 | BLOCKED / UNSUPPORTED 또는 POLICY_UNRESOLVED | 연간/음력 자료와 해당 연대 시계 정책을 별도 수락. 두 보강 이벤트로 자동 확대 금지 |
| 달력 자료 상업 이용·외부 재배포 | BLOCKED / RIGHTS_BLOCKED | 권리 조건의 별도 확인·수락. private attachment를 코드와 분리 |
| 현재 loopback→공개 서비스 | BLOCKED | 기존 보안·개인정보·Host/Origin·요청 제한·CSP·권리 게이트 유지 |
| M3 전체 강약·M4성패·최종 용신 | PARTIAL 또는 EXPERIMENTAL | 현재 하위 정책을 전체 정답으로 승격하지 않는 명시적 제품 정의·사례 |
| 해석의 현실 예측 타당성 | 미입증 | 내부 정책 재현/많은 날짜 실행으로 대체하지 않음 |

**COMMERCIAL FEATURE PARITY와 PUBLIC RELEASE는 NO-GO**다. 정교한 표가 있다는 이유로 차단 게이트를 완료 처리하지 않는다.

## 다음 Sprint 우선순위 제안

1. **출시 차단 경로:** 자료 이용·재배포 권리의 담당/수락 조건을 확정하고,1950–1988 역사시 지원을 독립 데이터/정책 작업으로 계획한다. 현재 현대 범위를 자동 확대하지 않는다.
2. **사용자 정보의 다음 한 묶음:** 신살의 명시 기준과 표시 범위를 유한 정책으로 구현할지 결정한다. 현재 M5를 전계절 처방표로 급히 확대하거나 격국 성패를 추정하는 것보다 검증 가능한 기본 정보 공백을 먼저 닫는다.
3. **기존 리포트 제품화:** 같은 JSON/상세 근거를 유지하면서 더 다양한 M5 후보/보류·내격·운 경계의 읽기 검토를 고정 회귀로 유지한다. 새 UI·LLM·개인 사건 생성은 별도 승인/콘텐츠 계약 이후다.

이 표의 목적은 추가 연구량을 늘리는 것이 아니라 이미 실행되는 정보와 출시를 막는 조건을 분리하는 것이다. 이후 범위 선택은 이번 Sprint의 작동 기능과 실제 보류 분포를 기준으로 한다.
