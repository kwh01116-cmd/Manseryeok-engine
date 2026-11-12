# Manseryeok-engine — current execution handoff

**Checkpoint: 2026-11-12 KST.** 계절 판단 + 구성상 통근 + 표면 인성/비겁의 자체 근 연결 완료. 실제 효력과 종합 강약은 미완료다. 기본 엔진/G0/G1-P2·최종 M3 해석/출시 게이트는 유지한다.

## 현재 계약

| 계층 | 실제 상태 |
| --- | --- |
| 기본 엔진 / 지원 | 기본2026–2027 불변. API 출생은 양력 환산 [1989-01-01,2027-01-01), 시각·기존 네 일주/시주 정책 필수 |
| 구조 근거 / 기존 계절 | 기존 EVIDENCE_ONLY와 rootCandidates 의미, 계절v0.1/v0.2 불변. B동분은 한 원국 아래 계절 대안, T동분은 기존 M1 후보 |
| 새 통근 선택 | M3-ROOT-PRESENCE-HIDDEN-SAME-ELEMENT-V01/0.1.0. 기존 장간 정책을 재사용해 네 표면 천간 각각과 네 지지의 실제 장간을 검사 |
| 판정 / 위치 | PRESENT_UNDER_POLICY 또는 ABSENT_UNDER_POLICY. 정확 천간/다른 음양의 동오행·기둥/장간 위치·MAIN_QI/OTHER 보존. 누락·변조는 무근이 아닌 거절 |
| 생조 연결 | 연·월·시의 정인/편인·비견/겁재가 자신의 근 결과를 참조. 일간 자신을 지원으로 재추가하거나 인성의 근을 일간에 복사하지 않음 |
| 미평가 | rootEfficacy/rootStrength/supportTransmission NOT_EVALUATED, finalStrength NOT_IMPLEMENTED. 근력·손상/활성·득지/득세·사령·종격·격국·용신·길흉 없음 |

기존 kasi:evidence의 --root-policy로 명시한다. root만 선택하면 kasi-local-m3-evidence-root-v1, 계절과 함께 선택하면 kasi-local-m3-evidence-seasonal-root-v1이다. 새 root/rootExplanation은 별도 계층이며 옵션이 없으면 기존 JSON/TEXT를 유지한다. 제품 요청당 출생 M1과 기존 M2는 각 한 번이다. src/m3/rootPresenceV1.ts와 로컬 조합 함수는 import해 사용할 수 있다.

## 실제 검증

최종 전체·CLI·브라우저·실제 자료 실행 SHA는 **e0439317da9d44ea566bf3a0ad27925e1b9b54f0**다. 이후 전달 변경은 문서뿐이며 실행 파일 불변을 확인한다. Node22.23.3에서 전체559/559(기존538+순수11+어댑터8+CLI2, fail/cancel/skip/todo0), M2감사, Lab/KASI 실제 브라우저가 자연0이었다. 독립120셀은 성립56/불성립64, 정확28/다른음양28이다. 실제CLI23회·9가상사례의 새 통근/계절 요약·상세를 읽었다.

UTC→Seoul각49,799양력/음력 입력쌍은 99,598제품=M1,103,246부모,412,984천간대상,700,520근연결이다. 대상 성립363,982/불성립49,002와 표면 인성/비겁123,656개의 자체 근, 계절 대안104,462개를 다른 단위로 집계했다. 추가241M3제품·2M7출생 호출은 별도다. 두 요약bytes와 양음력/두시간대 의미 지문 e00884aa897826b3ab94e72a525d42e14a097eb2a7040a070b921543b0f4e1b2가 일치했고 두 자식·부모 도구의 자연0을 확인했다. 이는 내부 연결 검사이며 문헌 판본·예측 효력 인증이 아니다.

가상2026-06-01의 丙은 巳丙/세 午丁에 통근하지만 편인甲의 자체 근은 없다.1990-01-01은 일간·비견·편인이 각각 유근,1990-01-09의甲은 무근과 겨울木相을 병렬 표시한다. B동분은 한 원국/통근 아래 두 계절 대안, 입춘은 후보별 서로 다른 근 위치를 유지한다. 신강약으로 합산하지 않는다.

초기 TS오류·기존 [day,day] 참조 오인·재빌드 전 개발 검사 실패,98e8e40의 당시559PASS,검증기 보류 집계 수정과 좁은 파일럿을 삭제하지 않았다. 최종전수는 old192/semi2에서 출력 누적 없이 순차 실행했고 중단·재시도·skip은 없었다. 상세 수치·메모리·실패 원인 한계는 실행 보고서와 DEVLOG에 있다.

## 보존·전달·다음 단계

원문·export·체크포인트·후보a/b·2027보강본의 기존 고정 지문과 네 입력 트리가 불변이며 KASI/키/재수집0이다. 보강본은 통근 제품에 전달하지 않았다. 기존 계절·M7·기본 경로·역사시·2027조회 범위,7개 null규칙 버전·판본/권리 미확인을 유지한다. 원저/서락오 주석·NCC전사 차이를 기록했으며 현재 장간 동오행 정의를 보편적 통근 정답으로 부르지 않는다.

승인 브랜치 agent/kasi-local-1950-2026-20261109에 코드·합성테스트·비밀 없는 문서만 일반Push한다. .private추적0, main/foundation/기반브랜치·force/merge/Actions/배포 금지다. workflow의 push 조건은 foundation뿐이며 변경하지 않는다. 최종 문서HEAD와 독립 조회한 실제 원격HEAD는 최종 응답·전달receipt에서 구분한다.

다음 한 단위는 **제한적 생조 전달 조건 한 가지와 독립 사례**다. 다른 통근 학파·점수·종합 강약·용신·역사시·UI를 자동 구현하지 않는다.

[실행 가이드](KASI_LOCAL_M3_ROOT_GUIDE.md) · [정의·문헌 차이](research/M3_ROOT_PRESENCE_POLICY_V01.md) · [실행·실패 보고](engineering/KASI_M3_ROOT_PRESENCE_EXECUTION_20261112.md) · [DEVLOG](DEVLOG.md) · [이전 인수인계 원문](archive/EXECUTION_HANDOFF_BEFORE_M3_ROOT_PRESENCE_20261112.md)
