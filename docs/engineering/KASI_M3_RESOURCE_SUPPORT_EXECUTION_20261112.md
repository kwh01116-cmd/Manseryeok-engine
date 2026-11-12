# M3 인성 생조 채택 제한 v0.1 — 실제 실행 기록

2026-11-12 KST. 실행 코드 SHA **730c1e1b08da6f5862b5dbe90627367658dbc626**, Node **v22.23.3**. 인성의 모든 표면 오합 상대·위치·통근 예외를 검사해 **이 한 규칙에 따른 독립 생조 자동 채택 제한**을 실제로 계산한다. 기존 원국/십성/장간/계절/통근을 삭제하지 않으며 생조 전체 효력은 NOT_EVALUATED, 최종 신강약은 NOT_IMPLEMENTED다.

## 실제로 실행한 한국어 결과

| 가상 입력/구조 | 실제 새 판단 |
| --- | --- |
| 2026-06-01 12:00 / 음력2026-04-16 평달12:00 | 시간甲 편인·무근·짝己 없음 → NO_HOLD_BY_THIS_RULE. 양음력 의미/설명 일치 |
| 2004-05-18 12:00 | 연간甲 정인·무근·월간己만 인접 → SUPPORT_HELD_UNDER_SELECTED_RULE |
| 1998-11-20 12:00 | 연간戊 정인·유근·월간癸만 인접 → ROOTED_COMBINATION_EFFECT_UNRESOLVED |
| 1990-01-01 12:00 / 1989-02-20 12:00 | 각각 시간甲↔연간己 / 연간己↔시간甲의 원격. 자체 근과 예외도 보존한 OUT_OF_SCOPE_INTERACTION |
| 2026-04-17 20:49 | 원국1·합 판단1·계절 대안2. 시간戊 정인 NO_HOLD.20:48/49/50의 원국/근/합 불변 |
| 2026-02-04 05:02 | 입춘 전 부모는 시간丁 편인, 후 부모는 연간丙 정인·시간丁 편인. 부모별 NO_HOLD/자체 근·참조 유지 |
| 1990-01-09 12:00 | 표면 인성 대상 없음 NOT_APPLICABLE. 장간 인성 보존 |

일반 입력의 새 설명 전문:

> 시간 甲(편인)은 선택한 장간 동오행 정책의 자체 근은 없습니다. 표면 오합 상대가 없어 이번 천간합 규칙에 따른 생조 채택 제한은 없습니다.

실제 날짜에서 관측한 채택 유보와 통근 예외:

> 연간 甲(정인)은 선택한 장간 동오행 정책의 자체 근은 없습니다. 유일한 표면 오합 상대 월간 己(인접)와 인접하고 자체 근이 없어, 선택한 규칙에서는 독립적인 생조 요소로 자동 채택하는 것을 유보합니다.

> 연간 戊(정인)은 선택한 장간 동오행 정책의 자체 근이 있습니다. 유일한 표면 오합 상대 월간 癸(인접)와 인접하지만 자체 근의 예외가 있어, 합으로 작용을 없애거나 생조가 충분하다고 확정하지 않습니다.

2004년과1998년 예시는 서로 다른 명식이다. **근만 바꾼 비교**는 별도의 합성 戊午·癸巳·甲午·丙寅 ↔ 戊子·癸巳·甲午·丙寅로 수행했다. 표면 천간·짝·위치를 유지하고 연지만午→子로 바꾸면 월간癸가 채택 유보에서 통근 예외로 바뀐다. 午→申의壬 장간도 선택한 동오행 근 예외다. 합성 네 기둥의 실제 출생 가능성은 주장하지 않는다. 경쟁은 합성 戊午·癸巳·甲午·癸巳에서 두 인성이 연간戊를 공유하는 사례로도 확인했다.

11개 새 요약 전문·계절 미선택 출력·17개 정상 합성 설명을 실제 읽었고, 채택 유보/통근 예외/입춘의 상세 참조도 검토했다. 금지 단어 정규식만으로 품질을 인증하지 않았다. 인접 문구의 반복은 있으나 의미를 바꾸는 단정은 없었다. 이는 Codex의 텍스트 검토이며 별도 인간 전문가 검토가 아니다. JSON/TEXT·무옵션/기존계절/기존root bytes 비교·npm silent를 포함한 **실제CLI30회**가 모두 종료0/빈stderr였다. 제품 기본 저장은 없으며 검증용 가상 출력만 별도.private에 보존했다.

## 원저·주석·프로젝트 결정표

『子平真詮』의 합/격위/경쟁/본신 합 문맥과 서락오 주석의 통근 예외를 구분했다. 東里 직접 원서버 접속은 timeout/502, 검색 도구가 반환한 본문·교감은 읽었으며 NCC 평주 전사는 직접 읽었다. 스캔·비평 판본·상업 이용권·독립 학파 합의의 인증이 아니다. 정인/편인을 모두 대상으로 삼고 원격·경쟁을 범위 밖으로 두는 것은 프로젝트의 좁은 결정표다. 문헌이 모든 원격 합을 무효로 선언했다고 하지 않는다. 유효한 인성은 일간 자체와 오합할 수 없어 단일 인접 판단은 연↔월에서 도달한다. [정의·출처·차이](../research/M3_RESOURCE_SUPPORT_POLICY_V01.md).

## 구현과 별도로 고정한20사례

resolver 파일이 없던13:11:35 KST에 리터럴 사례를 먼저 작성했다. 초기SHA7abe2f3cf12dfe8373fe971a15b97f3de06640c585b4020781211ac1cc225b36, 실행 전 사용자 결정표 수동 대조로 유근·범위 밖의 예외 사유 두 개를 보강한SHAe7b9385bc2e6544a5b0b821760359a8248eb9b8c50e1335c90bdb884d7ca86f0다. 실행값에 맞춰 expected를 생성/교체하지 않았다. AI 협업자의 수동 대조이며 인간·비평 판본의 독립 검증은 아니다.

| 사례 ID | 리터럴 기대 | 실제 |
| --- | --- | --- |
| no-surface-resource | NOT_APPLICABLE | 일치 |
| hidden-resource-only | NOT_APPLICABLE | 일치 |
| no-partner-unrooted | NO_HOLD_BY_THIS_RULE | 일치 |
| no-partner-rooted | NO_HOLD_BY_THIS_RULE | 일치 |
| adjacent-unrooted-zhengyin | SUPPORT_HELD_UNDER_SELECTED_RULE | 일치 |
| adjacent-rooted-exact-zhengyin | ROOTED_COMBINATION_EFFECT_UNRESOLVED | 일치 |
| adjacent-rooted-other-polarity | ROOTED_COMBINATION_EFFECT_UNRESOLVED | 일치 |
| adjacent-unrooted-pianyin | SUPPORT_HELD_UNDER_SELECTED_RULE | 일치 |
| adjacent-rooted-pianyin | ROOTED_COMBINATION_EFFECT_UNRESOLVED | 일치 |
| year-resource-adjacent-month | SUPPORT_HELD_UNDER_SELECTED_RULE | 일치 |
| remote-unrooted | OUT_OF_SCOPE_INTERACTION | 일치 |
| remote-rooted | OUT_OF_SCOPE_INTERACTION | 일치 |
| multiple-partners-unrooted | OUT_OF_SCOPE_INTERACTION | 일치 |
| multiple-partners-rooted | OUT_OF_SCOPE_INTERACTION | 일치 |
| shared-partner-competition | OUT_OF_SCOPE_INTERACTION / OUT_OF_SCOPE_INTERACTION | 일치 |
| two-resources-different-decisions | SUPPORT_HELD_UNDER_SELECTED_RULE / NO_HOLD_BY_THIS_RULE | 일치 |
| parallel-seasonal-alternatives | SUPPORT_HELD_UNDER_SELECTED_RULE | 일치 |
| reject-cross-candidate-root | 거절 | 거절 확인(공개 단위 검사) |
| reject-missing-resource-root | 거절 | 거절 확인(공개 단위 검사) |
| reject-day-as-resource-combination | 거절 | 거절 확인(공개 단위 검사) |

100개 순서 있는 천간쌍에서 오합10/비해당90·대칭성·잘못된 입력을 검사했고, 별도100개 일간×표면천간의 정인/편인 리터럴20개와 도달 불가능한 본신 합을 확인했다. 출력·설명·후보·요청·정책·누락·중복·sparse 참조, 같은 M2의 발급 후15종 변조와 최초 빈 member참조3종, 생조 확정으로 변조한 문장을 거절했다. 이들은 유한 소프트웨어/연결 검사이며 실제 출생100/20건이나 외부 효력 인증이 아니다.

## 최종 회귀와 실제 비공개 연결

| 검사 | 730c1e1b08da6f5862b5dbe90627367658dbc626에서의 실제 결과 |
| --- | --- |
| 전체 npm run check | **578/578**, fail/cancel/skip/todo0, 403111.5933ms. 기존559 의미 유지+순수10/어댑터7/CLI2 |
| M2감사 | 자연0. 기존7개 null규칙 버전·판본/권리 미확인 유지 |
| Lab 실제 Chrome | 자연0, EP0–EP4/M1/반응형/AX/보안 및 소유 프로세스/고유 프로필 정리 |
| KASI 실제 Chrome | 자연0. 합성 서버 응답 사용, 실제 KASI 호출 아님 |
| 실제CLI |30회 자연0/빈stderr, 네트워크·키·암묵적 현재시각·fixture/supplement fallback 거절 |
| 두 시간대 실제 자료 | UTC→Asia/Seoul 각49,799양음력쌍, 각99,598제품=실측출생M1 |
| 원본 보존 | 원문2086파일·후보a/b각8·보강5파일의 고정 네 트리·export 불변 |

주요 집계는 각 시간대의 같은 코호트이며 두 배의 고유 입력으로 세지 않는다.

| 단위 | 각 시간대 |
| --- | ---: |
| 일별 / 12절입 전·동분·후 / 달력 경계 / 추가B경계 입력쌍 | 13,879 / 5,472 / 28,624 / 1,824 |
| 입력쌍 / 제품·실측M1 / 원국 부모 | 49,799 / 99,598 / 103,246 |
| 표면 인성 대상 / 정인 / 편인 | 62,104 / 31,244 / 30,860 |
| 표면 인성 있음 부모 / 표면 대상 없음 부모 | 50,486 / 52,760 |
| 자체 근 PRESENT / ABSENT | 53,734 / 8,370 |
| 합 상대 연결 / 인접 / 원격 | 12,536 / 4,120 / 8,416 |
| 공유 상대 경쟁 위치 참조 | 1,244 |
| NO_HOLD / OUT_OF_SCOPE / HELD / ROOTED_EXCEPTION | 50,214 / 8,710 / 464 / 2,716 |
| 계절 분류 / B조건부 / 자료 부족 | 102,030 / 1,216 / 0 |

추가279제품/M1은241개의 support검사 부모와159인성을 별도 집계했다(기존root-only38제품은support부모 수에 포함하지 않음). 계절 미선택/v0.1/기존root·요청교대/변조격리 각38, 불량로더2, standalone통근결과 재사용4, B삼분4, 독립M7출생2를 검사했다. M7 비교용 출생 호출은 제품 호출과 분리했다. 기존 v0.1 정책 보류38은 새 인성의 자료 부족이 아니다. M1은 스파이로 호출수를 실측했고 M2는 실행 계약과 소스의 단일 호출을 확인했으며 별도 M2스파이를 주장하지 않는다.

양음력과 두 시간대 의미SHA는 **fe3f2cae973f59dd4c4a1468c85af481c4ccd24e5a4b873c1443467e66440462**, 동일 요약bytes SHA는fbf2417e2eed6334d3f82c70427b29a1ac560b91390f71e5990e78d380fd5583다. 서로 다른 입력의 정당한 날짜 변환 출처 차이는 별도 검사하고 전체DTO bytes 일치를 강요하지 않았다. 두 자식과 순차 부모 도구의 자연0·로그 flush·시작/종료 순서를 확인한 후 별도 비교기도 자연0이었다. 오류/미완료0은 성공한 이 코호트의 검사 집계이며 잘못된 입력을 정상 결과로 채웠다는 뜻이 아니다.

## 실패·수정·자원 기록

1. 첫 빌드는 새 rule/source union 제네릭 추론 TS2345로 종료1. 제네릭 형식을 고쳐 재빌드했다.
2. 집중28검사19통과/9실패: 새 검증기가 기존M2의 두 day파생 사실에 정상적인 [day,day] 위치 참조가 있음을 놓쳤다. #day-hidden-stems/#day-twelve-growth의 정확한 필드·반복만 허용하고 원본/기대값은 바꾸지 않았다. 이후16/16, 원래M2변조 그룹 추가 후17/17이었다.
3. 중간 SHA8080132의 전체는578중577통과/1실패였다. 기존 M7 CLI 자식이 약6MB heap에서 **Committing semi space failed**, 종료134로 결과 assertion 전에 중단했다. 사후 OS 메모리 관측을 남겼지만 누수 배제/정확한 원인 증명으로 부르지 않는다. 같은 M7파일4/4 뒤 소스·기대값·timeout·검사를 바꾸지 않고 새TEMP/고유 shim에서 전체를 **한 번만 수동 재검사**해578/578이었다. 최초 실패 로그를 보존했다. 최종 730c1e1b08da6f5862b5dbe90627367658dbc626의578/578·브라우저·CLI·전수는 이 결과를 재사용하지 않고 다시 실행했다.
4. 첫 비공개 순차 driver는 preload 경로 ENOENT로 **자식 시작 전** 종료1. 보조 경로만 고쳐 새v2출력에서 UTC→Seoul을 시작했다. 중간 Seoul의 의도적 종료는 다음 항목과 구분해 보존했다. 데이터/제품 실패를 합성PASS로 바꾸지 않았다.

5. 중간808의 UTC는 완주했지만, 추가 빈 참조 반례를 발견해 Seoul은28,250쌍에서 소유 자식 하나만 확인해 중단했다. Stop-Process 환경 오류 뒤 같은 PID·생성 시각을 확인한 .NET 종료와 driver종료1/자식4294967295를 기록했다. 기존 구조적 M3에 선택형 최초 M2문맥 검사 helper를 최소 추가하고, 새 인성 모듈에서 최초 빈 참조도 거절했다. 기존 정책·사실·출력은 바꾸지 않았으며 이미 발급한 M3의 문맥을 재사용해 중복 snapshot도 없앴다. 집중17/17과 수정 파일럿1477쌍을 통과한 후 최종 SHA의 두 시간대 전수를 새로 수행했다.

전수는 파일럿 관측 후 old192MiB/semi2MiB를 고정하고 전체 출력을 누적하지 않았다. old192를 고정한 semi2/8 파일럿은 같은 요약bytes였고, 관측상 메모리·시간이 더 낮은 기존semi2를 유지했다(인과적 성능 인증은 아님). 원래 WeakSet/WeakMap과 발급 불변 객체를 재사용했다. 메모리 수치는250입력쌍마다/유휴 구간의 표본이며 절대 순간 peak·전체RSS상한·누수 배제의 증거가 아니다. 중간808 진단의1000 문구 차이는 보존했고 최종 preload 표기는 실제250주기와 일치한다.

utc: 표본 heap최고117754120bytes, RSS최고205725696bytes, OSmaxRSS214124KiB, progress표본199회.

seoul: 표본 heap최고118989192bytes, RSS최고213090304bytes, OSmaxRSS211652KiB, progress표본199회.

## 보존·파일·Git 전달 범위

base manifest8ffadb04c8460969085610162d3d5e8855af9272a8a4be1dbe10123c15f90edf, export7b5584aca339b85c7e54e953c43b672358bda605a478831b6f260df00472e851, 보강내용f6a0e6dd2b169b4e758f8d1326942556c59f569af714adcb36e73824c6ef02b7의 독립 고정 기대값을 사용했다. 검사 대상의 값을 기대값으로 삼지 않았다. 원문/후보/보강본은 읽기전용이며 보강본은 보존 감사에만 읽고 새 제품에는 전달하지 않았다. KASI·키·재수집0, 비공개 데이터의 Git추적0이다.

실행 변경은 src/domain/stemCombinations.ts, src/m3/resourceSupportV1.ts, 기존 structuralEvidenceV1.ts의 선택형 최초 입력 검사 helper, 기존 로컬 어댑터, 새support검증기와4개 합성 fixture/테스트 파일이다. 기존 M3 출력·정책은 유지하면서 발급에 사용한 M2가 나중에 바뀌지 않았는지만 새 연결 경로에서 확인한다. 기존 계절/통근/M7·기본2026–2027/G0/G1-P2·출생1989–2026·시간정책·역사시/2027조회 범위를 유지한다. 최종 해석/상용 게이트는 차단 상태다. 정확한 교운일/근력/생조전체/합화·재극인·지지근손상·점수·강약·격국·용신·길흉·새UI·LLM·배포를 추가하지 않았다.

| 실행 파일 | 변경 목적 |
| --- | --- |
| `src/domain/stemCombinations.ts` | 대칭적인 오합 짝 조회 |
| `src/m3/resourceSupportV1.ts` | 전체 상대·위치·경쟁·통근 예외 결정과 설명 |
| `src/m3/structuralEvidenceV1.ts` | 출력은 유지하고 최초 M2 실행 문맥 검사 추가 |
| `scripts/kasi/local-m3-evidence.mjs` | 기존 요청당 한 번의 M1/M2/M3/root 경로에 선택형 연결 |
| `scripts/kasi/local-m3-support-verify.mjs` | 실제 비공개 자료의 스트리밍 전수·참조·계측·보존 검사 |
| `test/fixtures/m3-resource-support-cases.mjs` | 먼저 고정한 독립 리터럴20사례 |
| `test/m3-resource-support-v1.test.mjs` | 유한 표·결정표·변조·설명10그룹 |
| `test/kasi-local-m3-support.test.mjs` | 어댑터·후보·격리7그룹 |
| `test/kasi-local-m3-evidence-cli.test.mjs` | 기존 CLI검사 유지와 새 subprocess2그룹 |

문서8개는 이 실행 보고서, 실행 가이드, `docs/research/M3_RESOURCE_SUPPORT_POLICY_V01.md`, 기존 M3 최종 게이트의 날짜별 제한 승인 기록, DEVLOG·EXECUTION_HANDOFF·ROADMAP, 직전 인수인계의 원문 archive다. 합계17파일이며 실제 Git diff와 전달 전 검사를 함께 확인한다.

작은 코드 커밋 e82cd4b(정책/순수 함수) →8080132(로컬 연결/검증) →730c1e1b08da6f5862b5dbe90627367658dbc626(최초 M2문맥·빈 참조 수정)으로 진행했다. 최종 SHA에서 실행을 다시 맞췄다. 뒤의 기록 변경은 문서뿐이며 실행 파일 전체와 선택32파일 지문 불변을 전달 검사에서 확인한다. 승인 ref는 agent/kasi-local-1950-2026-20261109뿐이고 시작 원격은1f6bbc46886458a64b1bb847b7f3edd46e2c51be다. workflow는 foundation push만 대상으로 하며 변경하지 않았다. 실제 최종 원격 fullHEAD는 최종 응답·비공개 전달receipt에 남긴다. 원문/export/후보/대량 결과는 공개하지 않는다.

[복사 가능한 실행 명령](../KASI_LOCAL_M3_RESOURCE_SUPPORT_GUIDE.md) · [원저/주석/결정표](../research/M3_RESOURCE_SUPPORT_POLICY_V01.md) · [누적 일지](../DEVLOG.md). 다음 한 단위는 고정20사례 위에서 계절·근·생조 제한·설기/극 근거를 종합할 **좁은 결정표와 대표 명식 검증**이며 이번에는 착수하지 않았다.
