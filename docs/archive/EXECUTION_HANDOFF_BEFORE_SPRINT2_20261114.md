# Manseryeok-engine — current execution handoff

**2026-11-14 Sprint 1 완료: 현대 로컬 오프라인 실행 GO, 공개 자료 배포 NO-GO.** 승인 브랜치 agent/kasi-local-1950-2026-20261109를 유지한다. 최종 실행 코드 SHA **131a0c551a5093e22ea22d6a66b37c31dae058df**. 이후 문서 커밋/원격 full SHA는 delivery receipt와 최종 응답에서 분리한다.

- 데이터 없는 엔진 artifact59payload파일과 별도 내부 attachment7파일을 만들었다. 실제 경로 `.private/sprint1-20261114/final-131a0c5/{engine,data}`. 엔진 manifest SHA ba70f6a6d549cc7f80f899b912ff9586be18eba588a7882a633a110d00bc82bf. Node22만 있으면 실행/검사/복원에 npm·Git·API키·외부 패키지가 필요 없다.
- runtime은 chart/explain/evidence/experimental 네 mode와 명시 정책만 허용한다. 기존 성공 DTO를 data에 보존하고, 오류는 INPUT/ARTIFACT/DATA/CALCULATION 및 기존 미지원3상태로 구분한다. M1은 요청당1회다. M7은 기존 경로와 회귀를 유지하며 패키지 mode로 추가하지 않았다.
- 출생은 양력 환산 `[1989-01-01,2027-01-01)`와 분 시각 필수, 양력/한국음력·윤달/기존 네 일주·시주 정책이다. 1950–1988 날짜 자료 보유는 시각 지원이 아니며, 2027 두 경계 자료는 출생/조회 범위를 넓히지 않는다. 기본2026–2027·G0/G1-P2 NO-GO·기존 해석/출시 게이트는 유지한다.
- 가중 정책0.1.0의 배점/임계/기존 장간은 변경하지 않았다. 고정 합성 원국47·scalar14·합성 달력12요청/13후보, 새 민감도103검사로 근 공유와 임계 민감도를 확인했다. 같은 지지가 대표 배점과 여러 천간 근 조건에 재사용되는 정책 중첩을 독립 강도 증거로 표시하지 않는다. 실험 GO, 기본값 승격 NO-GO.
- 최종 Node22.23.3·전체784/784(fail/cancel/skip/todo0), M2감사·Lab/KASI Chromium 자연0. 첫 cc237b4의776/781 실패5는 검증 TEMP가 원본 안에 있어 독립 가드에 걸린 기록으로 보존했다. 소스 밖 소유 TEMP로 수정했고 검사/guard/기존668 기대를 약화하지 않았다.
- 최종 artifact를 새 소스 밖 임시 디렉터리에 복원해 **성공96(JSON48/TEXT48)+CLI거절8+위험경로거절4**, 별도 원본참조24를 수행했다. UTC48→Seoul48 순차·양음력 의미/시간대bytes 일치, 입춘2부모·B1부모/계절대안2·23:30 네 정책을 확인했다. actual stdout/stderr는 명시적 private 검증 파일이다.
- 고정 Node/TS의 독립 빌드6회/컴파일12회로 같은 입력의 출력을 재현했다. 현재3회113파일 동일, 이전2회111동일, experimental 제외111은 이전과 동일. 이전 d.ts3개의 속성 순서만 달라지는 결정적 입력 의존이며 비결정성/타입 의미 변경을 관측하지 않았다. 최종113출력도 동일하다.
- 원본2086/후보a,b각8/보강5와 base/export/supplement 지문, 기존 실행 파일은 불변이다. 이전320대상의317원byte+3이전선언순서차이도 그대로다. API·키·재수집·private추적0. M3 과거 grid약0/추가약8이 한 날짜라는 한계와 좁은 정책도 보존한다.

판정: **LOCAL OFFLINE ENGINE GO / PUBLIC DISTRIBUTION NO-GO / M3 EXPERIMENTAL POLICY GO / M3 DEFAULT PROMOTION NO-GO**. 내부 계산 가능과 상업 자료 권리/공개 서비스 출시 승인을 구분한다.

다음 Sprint 2는 기존 P2의 선택형 M4 내격8 구조 묶음을 권고한다. 새 강약 충분조건 연구나 점수 기본값 승격으로 되돌아가지 않는다. 공개 자료 권리와 넓은 출생 범위는 별도 출시 장애물로 관리한다. 후속 M4/M5/UI/스토리/LLM/배포는 이번에 구현하지 않았다.

[실행 가이드](SPRINT1_OFFLINE_GUIDE.md) · [실행/실패/증거](engineering/SPRINT1_OFFLINE_M3_EXECUTION_20261114.md) · [지원 행렬](contracts/offline-support-v1.json) · [JSON 계약](contracts/OFFLINE_ANALYSIS_V1.md) · [로드맵](ROADMAP.md) · [일지](DEVLOG.md) · [직전인수인계 원문](archive/EXECUTION_HANDOFF_BEFORE_SPRINT1_20261114.md)
