# Manseryeok-engine — current execution handoff

**2026-11-14 Sprint 3 완료: 목적별 M5 후보·공망·월운·사용자 요약·내부 오프라인 v2.** 승인 브랜치 `agent/kasi-local-1950-2026-20261109`. 시작 로컬/원격 `34b4f22b509bebb27c3594c40a61fd8d91ab2d00`, 최종 실행 코드 **`10196ab0acb8ed60774e2d98051ae670548725bf`**. 이후 문서-only 커밋/원격 HEAD는 전달 영수증과 최종 응답에서 분리한다.

- **M5** `M5-WINTER-WOOD-WARMING-CANDIDATE-V01`/0.1.0: 甲乙×亥子의 온기 검토 한 목적. 표면/선택 장간에 화 미관측이면 FIRE 후보, 기존 화가 있으면 충분성 미평가 HOLD, 다른 일간/월지는 범위 밖 HOLD. 고전 겨울 목 문맥과 프로젝트의 채택 guard를 분리했다. 최종 용신·희기 순위·강약 점수 결합은 없다.
- **공망** `M2-DAY-XUN-VOID-BRANCHES-V01`: 선택된 M1 일주와 네 원국 위치를 사용한다.60일주 독립 리터럴 검사. **월운** `M7-MONTHLY-TWELVE-JIE-PUBLISHED-MINUTE-V01`: 12절 간지/기간·연도표·시각 조회를 분리하고 동분 상관 대안을 유지한다.2025표12구간 완비,2026표 끝2구간 NEEDS_DATA,2027시각/표 POLICY_UNRESOLVED. 보강 자료/시계 범위를 자동 확대하지 않았다.
- **리포트** `KASI-LOCAL-PRODUCT-ANALYSIS-V01`: 동일 구조화 데이터의 요약7섹션/상세 근거. M5 정책 필수, 점수/M7/월운은 명시 선택. 기존 S2 리포트와 옵션 없는 기본 경로는 그대로다. M4는12월지·10일간 고정21사례를 추가했으며 resolver/기존 정관·C1/내격 정책은 바꾸지 않았다.
- **오프라인 v2**: engine84payload/776807bytes +별도 private data attachment. 저장소 밖 복원에서 Node22만으로80성공/입력8·경로3거절,36TZ출력쌍 동일. Git/npm/원본소스 import/네트워크/키가 필요 없다. engine manifest `23f486686c7ce7a0f0e3bd119135c0d62648a19ae13b884770f4850cc400ad29`. 자료는 외부 배포 불가. 기존 v1는 helper export2개 외 변경이 없다.
- **최종 검증**: Node22.23.3/TS5.8.3 전체858/858(fail/cancel/skip/todo0), M2 catalog일관/EVIDENCE_OPEN, Lab/KASI Chromium 자연0. 실제259양음력쌍/TZ=518요청·520부모/TZ, 두TZ합1036요청과 별도월운40조회/TZ를 확인했다. M5 후보8/HOLD512는 부모단위/TZ이며 예측 정답률이 아니다. 넓은228쌍의 후보2/유화12/범위밖214를 분리한다. 기존49,799전수/M7 private190만기간은 재실행하지 않았다.
- **실패/보존**: 공개검사 전 preflight하니스 실패와 수정 후 전체 실행, 경로/의미 비교/선언 검사 보조 실패를 일지에 보존했다. 기존320대상은314원byte+과거property순서3+새status union순서3(서로 다른 집합), JavaScript191은 원byte 동일. 새9곳의 고유 문자열 union 순서 외 타입/byte 동일을 별도 증명했고 원pin을 바꾸지 않았다. 새 생성121파일은 최종 전후 동일하다.
- 원본2086/후보a,b각8/보강5 및 base/export/supplement 수락pin 불변. KASI요청/키/재수집/private추적/Actions/배포/UI/LLM0. M3의 과거 grid신약0·추가8한날짜 한계와 `finalStrength=NOT_IMPLEMENTED`, G0/G1-P2·최종 출시 게이트를 유지한다.

- **2026-11-15 재확인**: 같은 요청의 기존 완료본을 새 저장소 밖에 다시 복원해80성공/입력8·경로3거절·36TZ출력쌍 동일을 확인했다.423추적파일/121생성물·원본pin 불변. 전체858/M2/Chromium은 동일코드의 이전 최종 실행 기록이며 오늘 재실행으로 세지 않는다. 새 기능은 추가하지 않았고 문서만 누적했다. 음력CLI는 --lunar-year/--lunar-month/--lunar-day/--leap을 사용한다.

판정: **M5 LIMITED PURPOSE POLICY GO / GONGMANG GO / MONTHLY FORTUNE TIME AXIS GO / USER-FACING REPORT GO / OFFLINE INTEGRATED ARTIFACT GO(내부) / COMMERCIAL FEATURE PARITY NO-GO / PUBLIC RELEASE NO-GO**. 기술 지원 출생범위는 양력 환산1989–2026이다.1950–1988·역사시/DST·2027이후와 자료 상업/재배포권, 전체 조후·신강약·격국 성패·최종 용신·주제별 예측은 미완료다.

다음은 권리/연대 차단을 병행 관리하면서 M5 **동일 목적의 한 유한 범위**와 선택 신살/콘텐츠 계약 중 우선순위를 정한다. 사용자 검토·새 반례·새 버전 없이 기존 후보 guard를 확대하지 않는다. 스토리/UI/LLM·추가 기능은 이번에 자동 착수하지 않았다.

[가이드](SPRINT3_PRODUCT_ANALYSIS_GUIDE.md) · [실행/실패/보존](engineering/SPRINT3_PRODUCT_ANALYSIS_EXECUTION_20261114.md) · [M5 정책](research/M5_LIMITED_PURPOSE_POLICY_V01.md) · [공망/월운](research/GONGMANG_MONTHLY_TIME_AXIS_POLICY_V01.md) · [v2 계약](contracts/OFFLINE_INTEGRATED_ANALYSIS_V2.md) · [19기능 행렬](research/SPRINT3_PRODUCT_FEATURE_MATRIX_20261114.md) · [로드맵](ROADMAP.md) · [일지](DEVLOG.md) · [직전 인수인계 원문](archive/EXECUTION_HANDOFF_BEFORE_SPRINT3_20261114.md)
