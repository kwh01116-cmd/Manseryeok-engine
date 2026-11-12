# M3 제한적 종합 판단 로컬 v0.1 — 실행 기록

실행 기간2026-11-12~13 KST. 최종 실행 SHA **8a45611b05ab7bfe72a68406430e7f1b2e7661ed**, Node **v22.23.3**. 구현·공개검사·CLI는11월12일, 도구 세션 중단을 확인한 뒤 같은 코드를 유지한 Seoul복구 전수와 최종 증거 수락은11월13일이다. 기존 명식→M2→구조 근거→계절·통근·인성 합 제한을 같은 실행에서 소비하고, 선택 정책의 좁은 결론 또는 구체적 보류를 한국어 리포트까지 제공한다.

## 실제 가상 입력과 첫 리포트

아래는 개인 기록이 아닌 가상 날짜 입력이다. 고전의 인물·사건을 출생일로 보충한 사례가 아니다.

| 실제 실행 입력 | 부모별 실제 연구 결과 |
| --- | --- |
| 양력1996-12-29 00:30 | 부모1: RESOLVED_UNDER_POLICY / WEAK_UNDER_SELECTED_POLICY |
| 음력1996-11-19 평달 00:30 | 부모1: RESOLVED_UNDER_POLICY / WEAK_UNDER_SELECTED_POLICY |
| 양력1996-12-30 00:30 | 부모1: DEFERRED_EFFECT_POLICY_REQUIRED |
| 양력2026-06-01 12:00 | 부모1: OUTSIDE_POLICY_SCOPE |
| 양력1990-01-01 12:00 | 부모1: DEFERRED_EFFECT_POLICY_REQUIRED |
| 양력2004-05-18 12:00 | 부모1: OUTSIDE_POLICY_SCOPE |
| 양력1998-11-20 12:00 | 부모1: DEFERRED_EFFECT_POLICY_REQUIRED |
| 양력2011-04-06 06:00 | 부모1: DEFERRED_EFFECT_POLICY_REQUIRED |
| 양력2016-09-11 16:00 | 부모1: DEFERRED_EFFECT_POLICY_REQUIRED |
| 양력2026-04-17 20:49 | 부모1: DEFERRED_EFFECT_POLICY_REQUIRED → OUTSIDE_POLICY_SCOPE |
| 양력2026-02-04 05:02 | 부모1: OUTSIDE_POLICY_SCOPE / 부모2: DEFERRED_EFFECT_POLICY_REQUIRED |

1996-12-29 00:30의 실제 명식은 **丙子·庚子·庚子·丙子**이며, 음력1996년11월19일 평달의 같은 시각도 의미 결과가 같다. 새 리포트의 판단 본문은 다음과 같다.

> 선택한 폐쇄형 무근·무인 연구 정책에서 신약으로 분류합니다. 휴·수·사 계절 분류와 직접 근·인성의 부재, 관계 제외 조건을 모두 확인한 경우에만 적용하는 프로젝트의 제한적 일반화입니다.
> 일간의 계절 상태는 휴(休)입니다. 구성상 직접 근은 없습니다. 인성은 표면 없음, 장간 없음입니다.
> 표면 비겁: 월간 庚(자체 근 없음). 장간의 동류는 직접 근의 위치에 별도로 보존합니다.
> 반대 방향 검토: 설기 연지 장간 癸·월지 장간 癸·일지 장간 癸 외 1곳 / 소모 없음 / 제어 연간 丙·시간 丙. 존재와 방향만 확인하며 실제 힘의 크기로 해석하지 않습니다.
> 관계 검토: 선택 범위의 표면 오합·지지 쌍·복수 구성원 관계 없음. 중요한 미정: 이 충분조건에서는 근·인성 자체가 없어 해당 효력의 비교를 요구하지 않음.

무근·무인 문맥이 비슷한 2016-09-11 16:00도 **丙申·丁酉·丙申·丙申**이며 고전의 四丙申을 그대로 재현하지 않는다. 다음 보류 본문은 실제 부분 구성원과 위치를 밝힌다.

> 합·지지 관계 또는 지원 요소의 실제 효력이 중요한 조건이어서 판단을 보류합니다. 관계를 지우거나 미정 효과를 0으로 처리하지 않습니다.
> 일간의 계절 상태는 수(囚)입니다. 구성상 직접 근은 없습니다. 인성은 표면 없음, 장간 없음입니다.
> 표면 비겁: 연간 丙(자체 근 없음)·월간 丁(자체 근 없음)·시간 丙(자체 근 없음). 장간의 동류는 직접 근의 위치에 별도로 보존합니다.
> 반대 방향 검토: 설기 연지 장간 戊·일지 장간 戊·시지 장간 戊 / 소모 연지 장간 庚·월지 장간 辛·일지 장간 庚 외 1곳 / 제어 연지 장간 壬·일지 장간 壬·시지 장간 壬. 존재와 방향만 확인하며 실제 힘의 크기로 해석하지 않습니다.
> 관계 검토: 금 삼회 부분 구성원: 연·일·시지 申 / 월지 酉, 戌 미포함. 표시 순서는 효력의 우선순위가 아니며 전체 위치·겹침은 JSON에 보존합니다. 중요한 미정: 합·지지 관계의 작용.

2026-06-01의 火旺은 신강으로 바꾸지 않는다. 1996-12-30의 근·인성과 관계, 2011-04-06의 실제 辰월·인성/관계도 삭제하지 않는다. B표시 분은 원국1 아래 계절 경로2, 입춘표시 분은 원래 부모2로 보존한다. 부모나 계절 대안에 확률을 붙이지 않는다.

## 채택한 규칙과 남긴 범위

프로필 **M3-LIMITED-ABSENT-ROOT-RESOURCE-SYNTHESIS-V01/0.1.0**은 휴·수·사, 일간의 구성상 근 부재, 표면·장간 인성 완전 부재, 표면 비겁의 자체 무근, 설기·소모·제어 중 하나 이상의 위치가 존재하는지 확인한다. 표면 오합·지지 쌍 관계와 서로 다른 두 구성원 이상인 삼합/삼회 조합도 없어야 WEAK_UNDER_SELECTED_POLICY를 낸다. 어느 사례의 날짜나 여덟 글자를 외우는 규칙이 아니다.

이는 徐樂吾 주석의 무근 반례를 좁게 일반화한 **프로젝트의 명시적 충분조건**이다. 원저가 같은 조건식을 직접 제시하거나 모든 학파에 대한 필요충분조건을 증명한 것이 아니다. NCC제6·35절 공개 전사와 원저/주석의 차이를 확인했고, 東里직접502·스캔/비평 판본·권리 미확인을 구별했다. [호환성·출처·충돌·결정표](../research/M3_LIMITED_SYNTHESIS_POLICY_V01.md).

| 고정 하위 정책 | 버전 |
| --- | --- |
| m2-basic-classification-local-v1 | 1 |
| m3-structural-evidence-local-v1 | 0.1.0 |
| M3-SEASONAL-SILI-PRE18-NOMINAL-MINUTES-V02 | 0.2.0 |
| M3-ROOT-PRESENCE-HIDDEN-SAME-ELEMENT-V01 | 0.1.0 |
| M3-RESOURCE-ADJACENT-COMBINATION-HOLD-V01 | 0.1.0 |

자료 부족은 NEEDS_DATA, 왕·상은 이 약 규칙의 범위 밖, 중요한 합·관계는 효력 정책 필요, 근/인성과 반대 구조는 혼재로 보류한다. 조건 미확인은 null/unknownEvidence이며 반대 증거의 false와 구별한다. 보류는 중화·신강·신약 쪽으로 바꾸지 않는다. NO_HOLD는 충분한 생조가 아니고 HELD도 인성 삭제가 아니다. 존재·방향·위치를 힘이나 점수로 바꾸지 않는다.

## resolver와 분리해 고정한 사례

20개 구조 사례를 resolver 작성 전 고정했고 SHA1cf60a7898a73c34a1d8c41b9e5d7dd2de344891daf3f5c7b07794447ac58542가 유지됐다. 기대 상태는 약4·혼재4·효력필요9·범위밖3이다. 문헌 구조 예시, 프로젝트 합성 사례, 실제 날짜의 통합 사례를 구분했다. 인간 전문가·독립 학파 검증은 아니다. 아래 실제 열은 전체 고정 사례를 순회한 공개 assertion의 통과이며 별도 문헌 정답률이 아니다.

| 사례 | 사전 리터럴 기대 | 최종 실행 |
| --- | --- | --- |
| literature-four-xin-mao | RESOLVED_UNDER_POLICY / WEAK_UNDER_SELECTED_POLICY | 고정 사례 전체를 실행한 공개 검사 통과 |
| literature-four-bing-shen | RESOLVED_UNDER_POLICY / WEAK_UNDER_SELECTED_POLICY | 고정 사례 전체를 실행한 공개 검사 통과 |
| all-zi-unrooted-visible-peers | RESOLVED_UNDER_POLICY / WEAK_UNDER_SELECTED_POLICY | 고정 사례 전체를 실행한 공개 검사 통과 |
| all-mao-distinct-drain-consume-control | RESOLVED_UNDER_POLICY / WEAK_UNDER_SELECTED_POLICY | 고정 사례 전체를 실행한 공개 검사 통과 |
| declining-season-root-present-no-raw-pair | DEFERRED_MIXED_EVIDENCE | 고정 사례 전체를 실행한 공개 검사 통과 |
| unrooted-visible-resource-not-held | DEFERRED_MIXED_EVIDENCE | 고정 사례 전체를 실행한 공개 검사 통과 |
| hidden-resource-only-prevents-absence-rule | DEFERRED_MIXED_EVIDENCE | 고정 사례 전체를 실행한 공개 검사 통과 |
| hidden-peer-only-not-surface-peer-absence | DEFERRED_MIXED_EVIDENCE | 고정 사례 전체를 실행한 공개 검사 통과 |
| resource-adjacent-held-kept-in-synthesis | DEFERRED_EFFECT_POLICY_REQUIRED | 고정 사례 전체를 실행한 공개 검사 통과 |
| resource-same-pair-rooted-exception | DEFERRED_EFFECT_POLICY_REQUIRED | 고정 사례 전체를 실행한 공개 검사 통과 |
| resource-other-polarity-rooted-exception | DEFERRED_EFFECT_POLICY_REQUIRED | 고정 사례 전체를 실행한 공개 검사 통과 |
| resource-no-hold-unrooted-season-wang | OUTSIDE_POLICY_SCOPE | 고정 사례 전체를 실행한 공개 검사 통과 |
| resource-no-hold-rooted-does-not-prove-strong | OUTSIDE_POLICY_SCOPE | 고정 사례 전체를 실행한 공개 검사 통과 |
| remote-resource-partner-keeps-scope-reason | DEFERRED_EFFECT_POLICY_REQUIRED | 고정 사례 전체를 실행한 공개 검사 통과 |
| shared-resource-partner-competition-not-collapsed | DEFERRED_EFFECT_POLICY_REQUIRED | 고정 사례 전체를 실행한 공개 검사 통과 |
| favourable-xiang-is-not-a-strength-verdict | OUTSIDE_POLICY_SCOPE | 고정 사례 전체를 실행한 공개 검사 통과 |
| same-root-absence-with-raw-branch-interaction | DEFERRED_EFFECT_POLICY_REQUIRED | 고정 사례 전체를 실행한 공개 검사 통과 |
| partial-triad-without-raw-pair-blocks-absence-rule | DEFERRED_EFFECT_POLICY_REQUIRED | 고정 사례 전체를 실행한 공개 검사 통과 |
| visible-five-combination-without-branch-pair | DEFERRED_EFFECT_POLICY_REQUIRED | 고정 사례 전체를 실행한 공개 검사 통과 |
| overlapping-si-shen-relations-not-prioritized-away | DEFERRED_EFFECT_POLICY_REQUIRED | 고정 사례 전체를 실행한 공개 검사 통과 |

추가로 B/T/자료 부족과 원저·주석 충돌 범위 계약, 누락·교차 후보·정책·없는 출처·기존 finalStrength 변조를 검사했다. 장간 인성만 있는 경우도 인성 완전 부재로 취급하지 않았다. 근·인성의 존재와 관계 제외 조건이 달라지면 조건/결과도 달라지며, 근 존재·NO_HOLD·계절만으로 결론을 내는 비약을 거절했다.

## 최종 코드의 실행과 비공개 연결

| 검사 | 실제 결과 |
| --- | --- |
| npm run check | **602/602**, fail/cancel/skip/todo0, 492140.7439ms. 기존578+순수15/어댑터7/CLI2 |
| M2감사 | 자연종료0, 기존7개 null규칙 버전·판본/권리 미확인 유지 |
| Lab 실제 Chrome / KASI 실제 Chrome | 모두 자연종료0, 자동 재시도0. KASI브라우저는 합성 upstream 회귀 |
| 실제 가상 CLI | 36개 자식 종료0/빈stderr, 무옵션·기존support bytes 불변, npm silent 포함 |
| 리포트 전문 검토 | 16개, 실제 관계·겹침·후보/B상관 확인. 별도 AI 검토와 root 검토이며 인간 전문가 인증 아님 |
| 실제 비공개 grid | 원래UTC완주 재사용+중단된Seoul만 수동1회복구, 각49,799양음력쌍·99,598제품=99,598실측M1 |

| 집계 단위 | 각 시간대 grid | 각 시간대 추가 사례 |
| --- | ---: | ---: |
| 제품 / 실측 출생M1 | 99,598 / 99,598 | 176 / 176 |
| 원국 부모 / 조건 경로 | 103,246 / 104,462 | 176 / 180 |
| B조건부 부모 / 원래2부모 요청 | 1,216 / 3,648 | 4 / 0 |
| 표면 인성 / 장간 인성 위치 | 62,104 / 176,754 | 113 / 210 |
| 오류 / 미완료 / 입력자료·정책 충돌 | 0 / 0 / 0 | 0 / 0 / 0 |

| 조건 경로의 상태 | grid | 추가 사례 |
| --- | ---: | ---: |
| RESOLVED_UNDER_POLICY | 0 | 8 |
| DEFERRED_MIXED_EVIDENCE | 398 | 0 |
| DEFERRED_EFFECT_POLICY_REQUIRED | 62,178 | 123 |
| OUTSIDE_POLICY_SCOPE | 41,886 | 49 |
| NEEDS_DATA | 0 | 0 |

| 충분조건 미충족 사유 | grid 경로 수 | 추가 경로 수 |
| --- | ---: | ---: |
| DECLINING_SEASON | 41,886 | 49 |
| DAY_ROOT_ABSENT | 92,600 | 153 |
| ALL_RESOURCE_LOCATIONS_ABSENT | 98,768 | 160 |
| VISIBLE_PEERS_ALL_UNROOTED | 45,048 | 95 |
| ADVERSE_DIRECTION_LOCATIONS_PRESENT | 36 | 0 |
| NO_VISIBLE_FIVE_COMBINATION | 48,592 | 56 |
| NO_RAW_BRANCH_PAIR | 99,418 | 166 |
| NO_MULTI_MEMBER_TRIAD | 92,098 | 172 |

사유는 한 경로에 겹칠 수 있어 합계를 판정 경로 분모로 쓰지 않는다. 충돌0은 이 입력의 registry/선택 정책 충돌 미관측이며 문헌 합의·독립 판본 인증이 아니다. NEEDS_DATA와 오류0도 고정 코호트의 관측 결과이며 잘못된 입력을 성공으로 채웠다는 뜻이 아니다. 두 시간대는 같은 코호트의 재현 검사로 두 배의 고유 출생으로 세지 않는다.

주 grid의 약 결론0경로와 추가 코호트의 약8경로를 분리한다. 추가 약8경로는 가상1996-12-29 00:30 **한 날짜**를4정책×양력/음력으로 실행한 결과이며8개 독립 출생 사례가 아니다. 추가 제품은 이 고정 결론 사례와 실제 문헌근접 반례2쌍,38년 교대/재현/변조/기존 결과 비교와 B삼분을 포함한다. 기존 경로 114회의 M1은 위 추가 종합 제품과 별도다. 총 실측 출생M1은 각99,888회이며 M2는 기존 단일 호출 계약/소스와 계수를 검사한 것으로 별도 M2스파이로 부르지 않는다. standalone재사용4회는 M1을 추가 호출하지 않았다.

양음력/두 시간대 의미SHA **6c5cb47a810e09903f8be4723e95b7089bb0b5b52aafe36d5330927448a9e8c1**, 동일 요약bytes SHA **01b0c83cf47d4cf6eb09e845de8e50f60f344d824f786c43cb42b32da310560f**. 입력 달력에 따른 정당한 변환 출처 차이는 별도 확인하고 전체DTO bytes 동일성을 요구하지 않았다. 원래UTC자식의 기록된 종료0과 로그flush, 복구Seoul자식 및 새 복구 부모 도구의 실측 자연종료0·flush·시간순서를 확인했다. 사라진 원driver5372의 자연종료는 확인하지 못했으며 PASS로 쓰지 않는다. 이 전수는 연결·재현 검사이며 새로운 추론의 문헌 타당성·현실 예측 검증을 대신하지 않는다.

## 실패·수정·표현 검토·자원

초기 TS2538은 부모 경계의 unknown 인덱스를 문자열로 검사해 고쳤다. 발급 후 계절 배열 요소와 추가 T출처 배열을 바꾸는 공백, 최초 T출처의 빈 내용/원문 모양 수락을 반례로 재현해 요소 식별·작은 출처 컨테이너 snapshot·원래 발표 이벤트/receipt 정합성을 보강했다. 대량 M2 복사나 검증 생략으로 해결하지 않았다. 첫 집중22개21통과/1실패는 강화된 source/interpreted 계약이 빠진 새 합성 입력을 보완해22/22였으며 고정20개 기대 결정은 바꾸지 않았다.

중간 31a50a079fea1ebe6d352cc1e8e037f7e36f7567에서602/602와CLI36·브라우저가 통과했지만,16개 리포트 전문 검토에서2016년 예시의 실제申酉부분삼회가 본문에 보이지 않는 공백을 찾았다. 이를 마일스톤 완료로 포장하지 않았다. 원래 M2의 관계 위치·겹침·부분/결손과 직접 규칙/출처 참조를 표시하도록 고쳤다. 그 표현 구현의 TS7053/TS7006은 타입 강제 변환 대신 원래 발급 M2의 관계 타입을 읽어 해결했다. 최종 8a45611b05ab7bfe72a68406430e7f1b2e7661ed에서 전체·CLI·브라우저와 두 시간대 증거를 새로 맞췄다.

11월13일 세션 재개 시 tool5372가 Unknown process였고 원driver/Seoul/UTC의 정확한PID가 모두 없음을 읽기 전용으로 확인했다. 원UTC는summary/종료0/flush기록이 있었으나 원Seoul은49,750쌍 진행·메모리 로그 뒤 summary/close/aggregate가 없어 미완료로 보존했다. 같은SHA·자료·old192/semi2에서 **Seoul만 수동1회** 별도 새 경로로 재실행했고 원UTC완주를 재사용했다. 원driver나 중단된Seoul의 종료코드/원인을 추정하지 않았다. 복구 driver 준비 보조는 처음CRLF패턴assert로 쓰기 전에 실패해 정규화한 뒤 성공했으며 제품/기대값은 바꾸지 않았다. 이전 인성 작업의 OOM을 이번 중단 원인으로 가져오지 않는다. skip·무한 자동재시도·일괄 프로세스 종료·timeout 확대는 없었다.

파일럿으로 메모리를 관측한 뒤 old192MiB/semi2MiB를 고정하고 전체 결과를 누적하지 않았다. WeakMap/불변 객체를 재사용한다. 다음은250쌍 진행/유휴/종료 표본이며 전체RSS상한·절대 순간peak·누수 배제의 증명이 아니다.

utc: heap표본 최고111,491,520bytes / RSS표본 최고169,734,144bytes / OSmaxRSS187,548KiB / 진행표본199회.

seoul: heap표본 최고113,291,000bytes / RSS표본 최고194,711,552bytes / OSmaxRSS201,548KiB / 진행표본199회.

## 보존·변경·전달과 종료 판단

독립 기대 base **8ffadb04c8460969085610162d3d5e8855af9272a8a4be1dbe10123c15f90edf**, export **7b5584aca339b85c7e54e953c43b672358bda605a478831b6f260df00472e851**, supplement **f6a0e6dd2b169b4e758f8d1326942556c59f569af714adcb36e73824c6ef02b7**를 재사용했다. 원문2086파일·후보a/b각8·보강5파일과 기존 체크포인트는 불변이다. 보강본은 보존감사에만 읽고 M3제품에는 전달하지 않았다. KASI·키·재수집0, .private Git추적0이다. 새 근거 출처를 KASI나 연간TXT 원본 출처로 위장하지 않았다.

실행 변경은 다음7개다. 나머지는 짧은 정책·기존 가이드/일지/체크포인트·이 실행보고와 이전 인수인계 보관본이다.

- scripts/kasi/local-m3-evidence.mjs
- scripts/kasi/local-m3-synthesis-verify.mjs
- src/m3/limitedSynthesisV1.ts
- test/fixtures/m3-limited-synthesis-cases.mjs
- test/kasi-local-m3-evidence-cli.test.mjs
- test/kasi-local-m3-synthesis.test.mjs
- test/m3-limited-synthesis-v1.test.mjs

기존 기본2026–2027/G0/G1-P2·출생1989–2026·현대 시계/역사시/2027조회·계절/통근/합 제한/M7을 변경하지 않았다. 원래 finalStrength=NOT_IMPLEMENTED와 전체 M3해석/상용 출시 게이트는 유지하고 별도 연구 결과만 추가했다. 새 옵션이 없으면 기존 결과·설명을 보존한다. 외부 LLM·UI·배포·유료 인프라는 없다.

**이번 제한적 M3 종료 기준은 충족했다.** 일반화된 결론 규칙1개, 비슷하지만 보류하는 반례, 독립 기대·실제 날짜·짧은 한국어 리포트·회귀·보존을 확인했다. 전체 M3의 강약/효력은 미완료이며 신강·중화·근력·관계 효력·격국·용신·길흉을 완료로 쓰지 않는다.

다음은 **B: 현재 제한적 M3를 고정하고 M4의 첫 격국 구조 성립 기능 묶음을 검토**하는 쪽을 제안한다. 사용 가능한 범위와 강약/효력 의존 분기를 구분하고 후자는 보류해야 한다. 약 규칙의 지원 비율을 높이려고 다른 세부 학파를 계속 추가할 필요는 없다. M4정책/출처/독립 사례는 다음 별도 승인에서 정하며 이번에는 구현하지 않았다.

승인 브랜치는 agent/kasi-local-1950-2026-20261109, 시작 HEAD는506d62e93231b60778bc4624f371cb4080b01a69다. 테스트 이후 문서만 커밋하고 실행 파일 지문을 다시 비교한다. 실제 문서커밋/원격 fullHEAD는 최종 응답과 비공개 전달receipt에서 테스트SHA와 구분한다. workflow를 바꾸거나 Actions를 실행하지 않는다. [복사 가능한 명령](../KASI_LOCAL_M3_EVIDENCE_GUIDE.md#2026-11-12--제한적-종합-판단과-첫-분석-리포트) · [정책/사례 계약](../research/M3_LIMITED_SYNTHESIS_POLICY_V01.md) · [DEVLOG](../DEVLOG.md).
