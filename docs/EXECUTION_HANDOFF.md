# Manseryeok-engine — current execution handoff

**2026-11-13 KST: M4 정관격 구조 분석 로컬 v0.1 완료. 실제 성격/파격/구응 효력과 상용 출시는 미완료.** 기존 출생 명식 1회→M2/구조 M3→명시적 M4→후보별 한국어 리포트를 연결했다. 기본 엔진·기존 해석 정책은 바꾸지 않았다.

- 선택: --pattern-profile M4-ZHENGGUAN-MONTH-STRUCTURE-V01 / 0.1.0. 기존 M2/1·구조 M3/0.1.0을 공개된 묶음으로 고정하며 충돌은 M1 전에 거절한다. 계절/root/support/synthesis는 선택 사항이다.
- MAIN_QI 정관은 투출과 별도로 후보, OTHER 정관은 정확 천간 투출 시 후보. 다른 월령 장간의 투출은 경쟁 조건으로 보존한다. 午 OTHER 己 정관의 문헌/장간표 호환만 SOURCE_OR_POLICY_UNRESOLVED다. MAIN을 사령·힘으로 쓰지 않는다.
- 후보 여부, 원국 정관 존재, 재·인·상관·칠살/오합/지지 관계의 구조 관측, 실제 효력은 별도 필드다. geCheng/geBai/jiuYing NOT_IMPLEMENTED. M4 patternBasis는 M5 희용신과 다르다. B계절 대안으로 원국/M4를 늘리지 않고 실제 입춘 부모2는 따로 분석한다.

실행 SHA **32bf5eaca047139b827637a5278432e0bb1ebde1**, 고정 Node 22.23.3: 전체 627/627(fail/cancel/skip/todo 0), M2 감사·Lab/KASI 실제 Chromium 첫 실행 0, CLI 46회 자연 종료 0·빈 stderr, TEXT 15개 전문 검토. resolver 전에 고정한 29기대와 120리터럴 조합, 새 pure 15/adapter 8/CLI 2그룹을 확인했다. 기존 602검사의 의미는 유지했다. 스캔·비평판본·권리·인간 전문가/독립 학파·예측 정확성 인증은 아니다. 일부 조사 표현은 편집 한계로 기록했다.

UTC→Seoul 순차 실행에서 각 3,956입력쌍/7,912제품=M1/9,040부모=M4였다. 후보 1,194/비후보 7,742/호환 보류 104, 경쟁 386, 오류·미완료 0이다. 부가 M4 37요청/39부모와 legacy 8을 합한 실제 M1은 각 7,957회다. 양음력 공통 의미 SHA는 4d9ce2b37ac971baaf0194baa2413f5927eb0fb146ebbdad2531ae5b3fe2beca이며 두 시간대에서 같다. summary 파일 bytes도 같고 그 SHA는 d2299e1fef4416bebb40705707a16219a4fd09ec80140f9e52d9cb42685495af다. 모든 날짜 전수나 원전 외부 정답률 인증이 아니다. old256/semi4·17메모리 표본과 부모/자식 자연 종료 0·flush를 확인했다.

중간 cc10 공개 검사는 627통과했지만 private UTC 추가 legacy 비교가 contextProfile 누락으로 종료 1, Seoul 미시작이었다. 해당 실패를 보존하고 검증기 한 줄 보완 후 32bf에서 전체·브라우저·private·CLI를 새로 맞췄다. 초기 새 테스트 계약 오류와 등록 장간 rule 버전 변조 공백, 합성 2월 5일 기대 오류도 기록했다. skip·무한 재시도·일괄 종료·timeout 확대는 없었다.

완료본 디렉터리 2,086파일/후보 a·b 각 8파일/보강 5파일과 외부 base/export/supplement 지문은 불변이다. 2,086은 캐시·원문·export 등을 포함한 디렉터리 파일 수이며 원문 응답 1,001개와 다르다. 보강본은 보존감사에만 읽었고 제품에 전달하지 않았다. API·키·재수집 0, .private 추적 0이다. 기본 2026~2027/G0/G1-P2 NO-GO, API출생 1989~2026, 역사시·2027조회, 기존 계절·근·인성·M7 및 전체 M3 게이트는 그대로다. 기존 M3의 grid 약 0/추가 약 8은 한 날짜의 4정책×두 달력이라는 한계도 유지한다.

후속 문서 HEAD와 테스트 SHA를 구별한다. 승인ref agent/kasi-local-1950-2026-20261109 외 변경하지 않는다. 유일workflow의 push조건은 foundation뿐이며 최종diff/원격을 다시 확인한 일반Push의 실제fullSHA는 전달receipt/최종응답에서 확인한다.

다음 제안은 **C: 실제 成格/破格/救應을 위한 별도 효력 정책 연구**다. 구조 v0.1은 고정하고 正官 재·인 위치 조건 한 가지의 효력 전제/반례/금지 결론부터 검토한다. 다른 격국·M5/M6·전체강약·새UI·LLM을 이번에 자동 구현하지 않았다.

[가이드](KASI_LOCAL_M4_ZHENGGUAN_GUIDE.md) · [정책·문헌/사례](research/M4_ZHENGGUAN_STRUCTURE_POLICY_V01.md) · [실행·실패·분포](engineering/KASI_M4_ZHENGGUAN_EXECUTION_20261113.md) · [DEVLOG](DEVLOG.md) · [직전 인수인계 원문](archive/EXECUTION_HANDOFF_BEFORE_M4_ZHENGGUAN_20261113.md)
