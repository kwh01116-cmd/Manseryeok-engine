# Sprint 3 — 목적별 M5·공망·월운·사용자 리포트·오프라인 v2

2026-11-14. [사용 가이드](../SPRINT3_PRODUCT_ANALYSIS_GUIDE.md), [M5 정책](../research/M5_LIMITED_PURPOSE_POLICY_V01.md), [공망/월운 정책](../research/GONGMANG_MONTHLY_TIME_AXIS_POLICY_V01.md), [v2 계약](../contracts/OFFLINE_INTEGRATED_ANALYSIS_V2.md), [19기능 행렬](../research/SPRINT3_PRODUCT_FEATURE_MATRIX_20261114.md)을 함께 읽는다.

## 기준선·정확한 실행 SHA

시작 로컬/직접 조회 원격은 `34b4f22b509bebb27c3594c40a61fd8d91ab2d00`, 승인 브랜치 `agent/kasi-local-1950-2026-20261109`, clean/ahead·behind0·0이었다. 다음 네 구현 커밋으로 분리했다: M5 `6fc24ea`, 공망/월운 `e883db8`, 리포트/M4 보강 `320c18c`, 오프라인v2 `10196ab`.

**최종 실행 코드 SHA: `10196ab0acb8ed60774e2d98051ae670548725bf`.** 전체 회귀·브라우저·실제 자료·실제 artifact 복원을 이 코드에서 수행했다. 이후는 문서 변경만 허용했고 최종 문서/원격 HEAD는 전달 영수증·최종 응답에서 별도로 확인한다. Node22.23.3 SHA `9c9245166b4a8e182e0b797da9c20136117ff24368eaff1fec8343a123c8db0e`, TS5.8.3 및 기존 package/lock을 유지했다.

## 실제로 추가된 판단과 계산

M5 `M5-WINTER-WOOD-WARMING-CANDIDATE-V01`/0.1.0은 **겨울 목 일간의 온기 검토 후보** 한 목적이다. 原著의 겨울 목·화 문맥, 徐 주석, OSS 조후 휴리스틱과 이번 PROJECT_POLICY를 구분했다. 甲乙×亥子의4/120기호 조합만 범위에 들어간다. 기존 M3/M2·선택 장간 전체·발급 계절/M4 문맥을 검증한 뒤 화가 전혀 관측되지 않으면 FIRE 후보를, 이미 있으면 충분성 미평가로 HOLD를 반환한다. 무화 후보·유화 보류 모두 고전의 보편 충분조건이 아닌 프로젝트의 제한적 후보 채택 정책이다. 조후 전체·물리적 한난 측정·최종 용신·희기 순위·강약 점수 활용·길흉은 제공하지 않는다.

- 실제 `1992-11-24 00:30` 壬申·辛亥·甲辰·甲子: FIRE 온기 후보.
- 같은 날12:00 壬申·辛亥·甲辰·庚午: 午의丁이 있어 HOLD. 과다/충분/무효라는 판단이 아니다.
- `1992-12-05 16:30` 壬申·辛亥·乙卯·甲申: FIRE 후보. 같은 날12:00 壬午시에는 유화 HOLD.
- `2026-06-01 12:00` 등 다른 일간/월지는 범위 밖 HOLD이며 도움 요소 부재가 아니다.

공망 `M2-DAY-XUN-VOID-BRANCHES-V01`은 M1이 이미 선택한 일주로10일 순을 정하고 짝이 없는 두 지지를 구한다. 원국 네 위치·향후 DA_YUN/SE_YUN/MONTHLY 위치 연결을 제공한다. 독립60일주 리터럴 전체를 대조했다. 壬午는甲戌순/申酉 공망(01-08 원국 대응0), 丙戌는甲申순/午未(01-12 시간午 대응), 입춘己酉 두 부모는 같은寅卯 공망이어도 실제 원국 대응이1/2위치로 다르다. 길흉·지지 삭제·근 소실을 추론하지 않는다.

월운 `M7-MONTHLY-TWELVE-JIE-PUBLISHED-MINUTE-V01`은 기존 년·월주 resolver와 issued 이벤트를 재사용한다. 양력 달력 월, 입춘 연도 라벨, 12절 구간, 시각 조회를 분리한다. 2025표는 戊寅→己卯→庚辰→辛巳→壬午→癸未→甲申→乙酉→丙戌→丁亥→戊子→己丑의12구간이고, 실제 첫 경계2025-02-03 23:10/마지막 종료2026-02-04 05:02다. 표시 분 query는 기존 전/후 상관 대안을 유지한다. 2026표의 끝2구간은2027소한/입춘 부족으로 NEEDS_DATA, 2026-12-31 query의庚子는 확인하되 종료는 PARTIAL, 2027 시각/표는 POLICY_UNRESOLVED다. 기존2027 supplement를 암묵 활성화하거나 시계 범위를 넓히지 않았다.

## M4 보강과 사용자 리포트

S2의14집중 검사는 이미26정책 계약을 포함했지만 실제 대표8은1월 子丑에 집중됐다. 이 차이를 구분하고 새 고정21사례로 **12월지·10일간·비1월 여덟 본기·OTHER 정확 투출/경쟁·비후보·비겁 본기·午OTHER 보류**를 포괄했다. 기존 M1/M2만의 관측 후 비교 기대를 고정했고, 공개 검사는 구조 재생/비공개 검사는 실제 양음력 출생 입력으로 나눴다. 기존 M4 resolver·옛29정관격 사례·판단 의미를 바꾸지 않았다.

새 `KASI-LOCAL-PRODUCT-ANALYSIS-V01`은 요약7섹션과 상세를 같은 발급 결과에서 생성한다. M5는 별도 `--m5-policy` 필수, 점수·M7·월운은 명시 선택이다. JSON은 detail 옵션과 무관하게 동일한 구조화 분석이며 `detailed.summary === summary`와 항목별 참조를 검증한다. 요약은 기술ID/해시를 상단에서 제거하고, 실제 남은 조건을 일반 언어로 설명한다. 상세에는 기존 S2 리포트·M5·공망·월운·기술 정보를 보존한다. 기존 base의 M5 미구현 필드는 과거 계약의 범위이고 새 후보를 최종 용신으로 승격하지 않는다.

실제10가상 입력의 JSON/요약/상세를 만들었다. 甲후보/같은 날 유화HOLD/乙후보/정관/정재/식신/비겁 본기/입춘/B/M7 중 root와 별도 AI 검토자가5개 이상 전문을 읽었다. 인간 전문가·독립 학파 인증은 아니다. 생산 출력의 자동 저장·LLM·새UI/서버는 없다. 출생 M1/M2/M3 bridge는 성공 요청당 각각1회이며 M7·월운·두 view는 같은 발급 명식을 재사용한다.

## 최종 오프라인 v2 실행

| 항목 | 실제 최종 결과 |
| --- | --- |
| 코드/기본값 | 별도 v2 entry. v1 네 mode·기본값·가드 유지. 기존 builder는 helper export2키워드만 추가 |
| engine | `.private/sprint3-20261114/final-10196ab/engine/`,84payload/776807bytes, 달력 데이터0 |
| engine manifest SHA | `23f486686c7ce7a0f0e3bd119135c0d62648a19ae13b884770f4850cc400ad29` |
| 별도 private data | 같은 상위 `data/`, 기존 검증7파일과 descriptor. 권리 미수락/재배포 금지 |
| attachment SHA | `a932a68ded1ff76fdaca494652472cc569ce9c5e3f9f4be03a22ab5c50cf5dd5` |
| 실제 복원 | 저장소 밖 소유 OS TEMP,Node22/PATH빈값. Git·npm·키·네트워크·원본 소스 import 없이 실행 |
| 성공/거절 | product12논리조건×JSON/요약/상세×2TZ=72 +기존mode8=80성공; 입력8·경로3거절 |
| 재현 | product36출력쌍 UTC/Seoul byte 동일, 양음력 의미 동일. 첫 최종 실행 PASS/자동재시도0 |
| 독립 계측 | M1 83=성공80+거절 중 진입3, M2 78, M3 bridge76. 별도 repo-reference16계산과 구분 |
| 보안 계측 범위 | 네트워크 시도0·키 환경변수 접근0, nochildproc/no원본import/제품 쓰기차단. 계측 receipt쓰기88은 제품쓰기와 별개. 별도 자격증명파일 읽기 counter까지 측정했다고 하지 않음 |

full schema를 보존하고 XML import 하나만 기존 고정 MIT bundle로 재연결했다. v1처럼 없는 parse/normalize export를 위조하지 않았다. fxp5.11.2 bundle SHA와 MIT고지8개/설치 lock목록을 기록하되 내장 컴포넌트 버전·entities정확tag 연결·법률승인까지 인증하지 않았다. 기존 M7의 고정 projection import1곳만 v2 한정 allowlist/폐쇄에 포함하고 임의 dynamic import는 계속 거절한다. 자세한 사항은 v2 계약에 있다.

## 최종 검사·집계 단위

전체 `npm run check` **858/858**, fail/cancel/skip/todo0. 기존811 의미 유지와 신규47검사다. M2 감사는 CATALOG_CONSISTENT_EVIDENCE_OPEN(정책4/규칙9/출처12, 원래7규칙 version미상 유지), Lab/KASI 실제 Chromium 모두 자연0이었다. 소스 밖 소유TEMP·파일별 직렬 테스트를 사용했고 timeout 증가/skip/사용자 프로세스 일괄 종료는 없었다.

실제 넓은 격자는1989–2026년×1/4/7/10/11/12월15일00:30의228양음력쌍이다. M5 겨울 목적에 맞게11/12월과 계절 대조를 층화했고, 초기12달 초안은 최종 실행하지 않은 채 기록했다. 여기에 M4 21쌍·실제M5 4쌍·자시4쌍·입춘/B2쌍을 더해 **259쌍/TZ,518제품요청/TZ,520원국부모/TZ**를 검사했다. 두TZ합1036요청에서 실제 M1/M2/M3각1036회다. 별도 월운40조회/TZ는 추가 출생 M1=0이다.

넓은 격자 자체의456응답/TZ는 M5후보4/유화보류24/범위밖428이다. 입력쌍으로는 후보2/유화보류12/범위밖214이며 성공률·예측력·목표비율이 아니다. 추가probe까지의520부모/TZ는 후보8/HOLD512(범위밖484·유화28), M4유형4160판정은 후보520/비후보3638/정책출처보류2다. 입춘두부모·B한부모 아래계절대안2를 별도로 보존한다. 공망 대응은276위치/비대응1804위치이며 위치 개수를 힘 점수로 쓰지 않는다.

두TZ 의미 SHA `33374218079a73e1a361c28dff60fcbf68f222bbbef99e14724c02d41be12c18`가 같다. 실제 결과를 전부 메모리에 쌓지 않고 집계/의미지문을 사용했으며 기본GC·12쌍 batch로 자원을 관찰했다. 작은 파일럿 maxRSS250MiB를 전체 상한으로 주장하지 않았고 UTC전체의 maxRSS는약490MiB였다. Node OS 조회에서 free약3.06GiB/8logical을 확인하고 artifact종료·공유초기컴파일완료 후 range1worker를전체검사와병행했다. UTC/Seoul은 서로 순차다. 기존49,799쌍 전체나 M7 private190만기간·현실 예측/인간 전문가 검증은 이번에 수행하지 않았다.

## 실패와 수정 — 성공과 분리

- 기대 선정 하니스가 후보와 대조를 같은 길이로 세어 甲pair만 찾고 중단했다. 원oracle를 보존하고 기존M1/M2로乙2시각을 별도 확인했다. 새M5 출력으로 기대값을 만들지 않았다.
- 제품 집중 첫6/8은 G/L의 정상 provenance 차이를 M5전체 동일로 비교한 오류와 Windows --import raw경로 오류였다. 다음7/8은 provenance 보조 경로를 잘못 읽은 시험 오류였다. 올바른 M1 provenance와 의미 투영·fileURL을 검사한 뒤8/8 통과했으며 생산 규칙/가드는 완화하지 않았다.
- 제품 파일럿의 첫 조사 정규식은 정상 甲은까지 거절했다. 실패를 보존하고 private하니스만 수정한 새label로 통과했다. 범위 파일럿도 preload경로 오류로 제품0회 중단된 첫 로그와 fileURL수정 후12요청 PASS를 분리했다.
- 첫 dirty artifact 빌드는 기존 M7 고정 dynamic import에 막혔다. v2에만 정확 literal1곳을 명시 허용하고 나머지 동적 import를 계속 거절하도록 보완한 뒤 통과했다. v1 가드는 바꾸지 않았다.
- 선언 조사에서 옛 property 검사기를 대상 밖 tuple/ref블록에 적용한 두 보조 실패와 STRICT_PROPERTY_ONLY_NOT_PASS를 남겼다. 새9곳 literal-union 증명은 별도다. 첫 최종QA는 이전 property3파일과 새 union3파일을 같은 집합으로 잘못 연결한 preflight TypeError로 **공개 테스트 전 중단**됐다. 두Map을 분리한 드라이런 후 새 `final-r2` label로 전체를 수행했다. 원실패/runner를 덮지 않았고 제품코드/기대pin은 변경하지 않았다.
- 문서 후 보존 하니스 첫 실행은 `git status` 출력의 선행 공백을 trim한 파서 오류로 파일검사 전 중단됐다. 원 runner를 보존하고 NUL 구분 원출력으로 고친 후423추적파일·121생성물·원본/후보/보강 트리·인수인계 원byte·일지 누적·상대링크46개를 확인했다. 제품 변경이나 공개 회귀 재시도는 아니다.

## 원본·타입·정책 보존과 전달

base content `8ffadb04c8460969085610162d3d5e8855af9272a8a4be1dbe10123c15f90edf`, export `7b5584aca339b85c7e54e953c43b672358bda605a478831b6f260df00472e851`, supplement `f6a0e6dd2b169b4e758f8d1326942556c59f569af714adcb36e73824c6ef02b7` 및 원본2086/후보a,b각8/보강5의 수락 트리를 전후 대조했다. 검사 대상에서 읽은 지문을 기대값으로 쓰지 않았다.

원래320소스/생성대상은 **314원byte+과거property순서3+이번status literal-union순서3**다. 두3파일 집합은 서로 다르다. 기존 JavaScript191개는 모두 원byte 동일하다. 새3개는 S2oldpin 재현/고정TS독립memoryemit 현pin 재현과 **필수status의고유문자열union9곳 순서 외 모든 byte 동일**을 증명했다. 임의 union/type/함수/overload를 정규화하지 않았다. 기존pin을 교체하지 않았다. S2생성115는112byte+새union3, S1QA76은75byte+builder export-only1, OSSQA61은61byte다. builder는두export를 제거하면 기존Git blob과 byte 동일하다. 최종 생성121파일과 실행 입력은 검사 전후 동일했다.

기존 M3의 과거 grid신약0·추가8경로가한날짜 반복인 한계, 기본2026–2027/G0/G1-P2 NO-GO, 기존 M3/M4/M7 정책을 유지했다. 1950–1988·2027이후/역사시·DST 지원은 늘리지 않았다. KASI요청/키/재수집0, UI/LLM/궁합/주제별 사건/상용배포0, private자료Git추적0이다.

증거는 `.private/sprint3-20261114/qa-10196ab-final-r2-final.json`, `product-range-final-10196ab-r1-receipt.json`, `declaration-order-audit.json`, `final-10196ab/evidence/receipt.json`, `final-10196ab/instrumentation-receipt.json` 및실제stdout/요약/상세다. 공개에는 코드·합성기대·짧은정책·검증요약만 반영한다. workflow는foundation브랜치push만 대상으로 승인브랜치와 불일치하며, 최종diff·원격을확인해일반Push만한다.

판정: **M5 LIMITED PURPOSE POLICY GO / GONGMANG GO / MONTHLY FORTUNE TIME AXIS GO / USER-FACING REPORT GO / OFFLINE INTEGRATED ARTIFACT GO / COMMERCIAL FEATURE PARITY NO-GO / PUBLIC RELEASE NO-GO**. 자료 상업/재배포권 미해결과 출생연대 차단을 유지하며, 기능19행의12/4/1/2는 완성률이 아니다. 겨울목 한 기능이 용신/조후 두 행에 겹친다는 점도 분리한다.
