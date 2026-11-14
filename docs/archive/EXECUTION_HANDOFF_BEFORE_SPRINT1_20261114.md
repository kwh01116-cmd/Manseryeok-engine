# Manseryeok-engine — current execution handoff

**2026-11-14: 제품 전략 D — 자체 계산/검증 유지 + 검토한 OSS 명리 규칙의 선택적 포팅.** 승인 브랜치 agent/kasi-local-1950-2026-20261109만 사용한다. 기존 S1의 엄격한 상대 강약 NO-GO와 새 LEVEL2 휴리스틱 후보는 다른 계약이다. 과거 연구를 성공으로 소급 변경하지 않는다.

- 다섯 실제 저장소를 full SHA로 고정해 코드·수식·테스트·LICENSE·자료 출처를 감사하고100가상 입력을 실행했다. ssaju의 월초 음력 역변환 결함8건, 절입 근사7건 차이, 자시·한중 달력 정책 차이를 분리했다. 역사시10은 우리 기준 미지원/미검증이며 오류가 아니다. 우리90지원입력의97상관후보 집합으로 비교했다.
- 고급 기능폭은 korean_saju가 넓지만 가중강약/용신용억부가100건 중17건 다르고 자동합화·고정수치 성격/외격 판단을 포함한다. 통째로 정답 엔진으로 들여오지 않는다. code MIT와 내장 KASI/6tail 자료의 재배포 근거는 별도이며 후자는 이번에 승인하지 않았다.
- 실제 구현한 PoC: EXPERIMENTAL-WEIGHTED-SUPPORT-LOCAL-NO-TRANSFORMATION-V01/0.1.0. 기존M2장간·위치배점·무근절반·월지충-0.8, 자동합화/亥戊/시각미상보정 제외. 소스산술 참고+MIT고지. 기본진입점·기존CLI는 불변, 명시 옵션의 별도 scripts/experimental/weighted-support.mjs만 실행한다.
- PoC요청당 M1/M2를1회 재사용하고 기존 M3/M4 전체 결과와 새 분류를 병렬 보존한다. 계절B는1원국 아래대안2/점수1, 입춘은2부모/2점수다. 정책id/version/sourceRefs/assumptions/inputFacts/decisionTrace/alternatives/limitations를 출력한다. 점수와 극강/강/중화/약/극약은 선택규칙의 분류이며 실제힘·확률·예측·격국/용신을 확정하지 않는다.

**최종 실행 코드 SHA f17647ac731ded334c778495736aabc85e7e2c07**: Node22.23.3·전체668/668(fail/cancel/skip/todo0), 기존M2감사·Lab/KASI Chromium 첫시도자연0, 실제후보CLI12회/텍스트6전문 검토. 기존650의미유지+새18개. 외부시험은 별도: ssaju21/21,6tail47 selected assert-bridge, pytest/Vitest 전체미실행. 처음컴파일·잘못된합성甲亥·조사기오류와 얕은spread 동결결함의 수정/검증을 기록했다. ec913fb의668성공 후 설명조사를 고친 f176에서 전체를 재실행했다.

두시간대순차 PoC 각90제품=M1/97후보, 기존90C1/M3의미동일. 상류와87점수동일/10정책차이 전부 합화점수삭제 제외로 설명됐으며 정확도비율이 아니다. 의미SHA539b5bd3a18a0593d8134ddbbd537e4ff9b2d11ef1da6936dbeeac00d922cc5c와 summary bytes 동일. native100/직접97 참조계산은 제품호출수와 별도다. 공개100행 요약에는분류만 담고 원DTO·raw해석은 private다.

원본완료2086파일·후보a,b각8·보강5의 고정트리는 불변이다. 기존320source/build 중317개는 byte 동일하고 생성 `.d.ts` 3개는 참조 속성 선언 순서가 달랐다. 이전 소스를 같은 TS로 재빌드해 원 pin을 재현했고 제한적 AST 검사로 속성순서만 의미 동등함을 확인했다. 원 기대 지문과 최초 실패 기록은 변경하지 않았다. 기존 실행 소스/JavaScript는 불변이다. API·키·재수집0/private추적0. 기본2026–2027/G0/G1-P2 NO-GO·API출생1989–2026·역사시/2027조회·기존 M3/M4/M7·전체출시 게이트는 유지한다. M3과거grid약0/추가약8은한날짜라는 한계도 보존한다. source/lock/workflow를 교체하지 않았다. 마지막문서커밋/Push fullHEAD는 delivery receipt와 최종응답에서 구별한다.

다음은 제품로드맵 P1: **현재 LEVEL2 PoC의 제품 정책 채택/기각과 민감도 설명을3–5인일 묶음으로 닫는 것**이다. 이후 M4내격8 구조·M5한목적 후보·공망/한정신살/월운·구조화 리포트의 현대범위엔진22–35인일을 제안한다. 넓은출생범위 역사시확대는 추가5–8인일 기술추정이며 권리/기관대기·UI/LLM/배포는 별도다. 이번에 후속기능이나 공개기본값을 자동구현하지 않았다.

[실제코드감사](research/OSS_ENGINE_AUDIT_20261114.md) · [고정100분류](research/fixtures/OSS_AUDIT_100_RESULT_SUMMARY_20261114.json) · [PoC명령/계약](EXPERIMENTAL_WEIGHTED_SUPPORT_GUIDE.md) · [검증/실패](engineering/OSS_ENGINE_COMPARISON_EXECUTION_20261114.md) · [제품로드맵](ROADMAP.md) · [개발일지](DEVLOG.md) · [직전인수인계 원문](archive/EXECUTION_HANDOFF_BEFORE_OSS_PRODUCT_20261114.md)
