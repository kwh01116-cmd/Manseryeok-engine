# 오픈소스 감사·100사례·선택형 PoC 실행 기록

2026-11-14. [코드 감사·전략](../research/OSS_ENGINE_AUDIT_20261114.md)와 [실행 가이드](../EXPERIMENTAL_WEIGHTED_SUPPORT_GUIDE.md)를 분리한다. 이번은 코드 감사와 실제 동작 비교이며 전통 해석의 외부 정답률·예측 인증이 아니다.

## 정확한 실행 코드

- 시작/원래100사례 기준: `82587ff6f83624686e3759bda0ea506529f03ed4`.
- PoC 최초 코드: `ec913fbee0789d02370c5174a80d4a4149bb2d7b`.
- **최종 코드·CLI·전체 회귀: `f17647ac731ded334c778495736aabc85e7e2c07`.** 원래 계산과 점수는 같고 한국어 조사·영문 계산 항목을 정리한 작은 후속 커밋이다.
- 최종 문서/일지/로드맵 및 Push HEAD는 일반 Push 후 delivery receipt와 최종 응답에서 구별한다. 이후 실행 파일과 입력 지문이 그대로인지 다시 확인한다.

Node22.23.3 SHA `9c9245166b4a8e182e0b797da9c20136117ff24368eaff1fec8343a123c8db0e`, 고정 TS5.8.3·잠금 의존성을 유지했다. Python은 기존3.13.13을 사용했고 설치하지 않았다. 임시 clone·사설 변환 빌드·원본 출력은 전부 `.private/oss-audit-20261114/` 안에 있다.

## 1. 원본 오픈소스 실행

| 엔진 | 실제 실행 | 원 저장소 테스트의 이번 수행 범위 |
| --- | --- | --- |
| ssaju | native100 JSONL,97후보 공급용 hook 준비, 별도8결함 probe | `node --test tests/calculateSaju.test.ts` **21/21**. 소스 무수정 |
| korean_saju | native100, 같은 우리 M1네기둥97, 독립 손계산3 | pytest suite12개는 미설치로 미실행. native실행을 pytest PASS로 세지 않음 |
| manseryeok | private transpile 뒤 공개 API100명식·100변환 | Vitest 미실행, full upstream typecheck도 미실행 |
| korean_lunar_calendar_js | 공개 setter100변환 | Vitest 미실행. constructor 고정 seed100과 시험입력100 내부 setter 호출을 독립200사례로 세지 않음 |
| lunar-javascript | native소스+명시 KST/CST clock bridge100,98실행/한국 윤달2미지원 | EightChar/JieQi/Yun의47개 동기 테스트를 assert bridge로 실행 **47/47**. Jest 전체 suite나 정식 Jest runner 실행은 아님 |

어느 외부 코드도 원본을 수정하거나 원 테스트 기대값을 바꾸지 않았다. 모든100행은 ID/순서/고정 입력 지문을 확인했다. 실행 성공과 명식 일치, 정책 호환과 기능 미지원은 별개다. 각 저장소 version/SHA와 source file/function/line은 감사 보고서에 있다.

## 2. 100사례의 분류

일반40/절입20/자시10/역사시10/음력10/분석10. 공개 입력 SHA `d3049e023f27c7605aecc0219353890282ea244dce9ff3653495cc0948338e09`. 음력10의 비교용 Gregorian 메타데이터만 보강한 private JSONL SHA `978946bf4b6ccae3212fa7c30ee54dfb887dc3170cb65ca5fa2b9c1c58d3d550`다. 두 객체를 바이트 동일하다고 하지 않고 원 입력·정책·순서100개 일치와 native 음력 변환을 따로 검사했다.

우리 M1은100요청 중90지원/역사시10미지원, 실제 호출100회, 지원 원국97후보였다. 처음의 조사 어댑터가 비교 스키마의 `ZI_START_23`을 기존 `ZI_START`로 옮기지 않아4개를 거절한 기록은 남겼다. 어댑터 매핑만 고치고 같은 입력을 다시 실행했다. 제품 계산이나 고정 정책의 오류가 아니다.

| 네 기둥 | 일치 | 정책 차이 | 구현 차이 | 미검증 | 미지원 |
| --- | ---: | ---: | ---: | ---: | ---: |
| ssaju | 77 | 4 | 7 | 10 | 2 |
| korean_saju | 87 | 3 | 0 | 10 | 0 |
| manseryeok | 88 | 2 | 0 | 10 | 0 |
| lunar-javascript | 85 | 3 | 0 | 10 | 2 |
| korean_lunar_calendar_js | 0 | 0 | 0 | 0 | 100 |

ssaju의 양력→음력은78일치/월초의 명백한 계산오류8/한중정책차이2/역사미검증10/미지원2다. 6tail은86일치/정책차이2/역사10/미지원2. 한국 두 converter는 현대90일치/역사10미검증. korean_saju는 G→L결과를 반환하지 않아90일치를 주장하지 않으며 native L→G10개만 일치했다.

`CALCULATION_ERROR`는 내부 왕복·유효성 기대를 독립적으로 위반한 결함, `POLICY_DIFFERENCE`는 규칙/달력/시주 관례의 차이, `IMPLEMENTATION_DIFFERENCE`는 같은 절입 계산에서 천문 모형 구현이 다른 경우, `UNVERIFIED`는 기준 부재다. 미지원은 별도다. advanced의 서로 다른 정의는 최초 초안의 IMPLEMENTATION_DIFFERENCE에서 POLICY_DIFFERENCE로 분류를 바로잡았다. 원본 반환값은 바꾸지 않았다.

[공개100행 요약](../research/fixtures/OSS_AUDIT_100_RESULT_SUMMARY_20261114.json) SHA `6d31cbc66f489e635d81dea18923f447c23cabbe58a7b7e3c23db9a068038009`는500엔진 항목의 분류만 담고 출생시각·후보DTO·API출처 원문·해석 prose를 담지 않는다. 원결과는 private JSONL이다. 원래 M4 summary export는 과거 필드명을 읽어 basis/formation을 누락했으므로 C1의 기록된 upstreamCandidateStatus만 비교에 사용했다. 누락은 UNVERIFIED로 남겼고 최종 PoC JSON의 `existing.patternAnalysis`에는 전체 실제 결과를 보존했다.

## 3. 실제 PoC 최종 실행

최종 f17647a에서 UTC→Asia/Seoul을 순차로 실행했다. 각100입력 중 역사10은 현재 출생 범위 밖으로 제외했고, **90제품=M1 90회 / 97후보 점수**를 검사했다. 비교용 upstream97계산은 제품 호출 수와 구분한다. 네 일주/시주 조합은 기존 회귀를 보존하고, 고정100의 자시 입력에서는 실제 native 조합 차이를 별도로 기록했다.

- 기존97명식 후보 집합·90C1전체·90기존 M3종합은 이전 기준의 의미와 같았다.
- 기존 finalStrength=NOT_IMPLEMENTED/G1-P2 미승격, 원래 M3의 좁은 약 판정·범위·보류를 보존했다.
- 97점수 중 상류와87같음/10다름. 10개 모두 합화 점수 삭제를 제외한 차이로 슬롯별 분해했고 미설명 산술 차이는0이다. 원시 사주가 강/약인지의 정답 검사가 아니다.
- local亥 표의 차이는97개에서는 점수 차이를 만들지 않았고, 별도 손계산 합성 입력의1.5↔2.0으로 확인했다.
- 극강3/강29/중화6/약33/극약26은 선택 표본의 정책 결과 분포다.
- B동분은1부모/2계절대안/1점수, 입춘은2부모/2점수다. 다른 후보의 천간·월지·근을 섞지 않았다.
- 두 시간대 summary bytes와 의미 SHA **`539b5bd3a18a0593d8134ddbbd537e4ff9b2d11ef1da6936dbeeac00d922cc5c`**가 같다. old-space256MiB/semi-space4MiB로 실행했으며 전체 출생 전수나 순간 peak/누수 부재 증명은 아니다.

실제 비공개 후보 CLI는 양력6월1일·동등 음력4월16일 평달·1월8일·입춘·B동분·6월7일의 JSON/TEXT **12subprocess**가 모두 자연 종료0/빈stderr였다. root가 TEXT6건 전문을 읽었고 JSON6건의94개 fact/member 참조를 실제 `existing`에서 찾았다. 자동 파일 저장은 제품 기능이 아니라 private 검증 하네스의 명시 출력이다. 네트워크·API키 없이 실행했다.

## 4. 최종 전체 회귀와 개발 중 발견

f17647ac731ded334c778495736aabc85e7e2c07에서 **전체668/668, fail/cancel/skip/todo0**, TAP319,862.9788ms였다. `npm run check`, M2감사, Lab/KASI 실제 Chromium은 첫 시도 자연 종료0이었다. KASI 웹 검사는 합성 upstream의 브라우저 회귀이며 실제 KASI API 수집이 아니다. 기존650개 의미는 유지하고 새 산술/연결/CLI18개를 추가했다. M2의 기존7개 native rule version 미기록·판본/권리 게이트도 그대로다.

ec913fb에서도668/668·브라우저를 통과했지만 전문 검토에서 조사 오류와 영문 rule ID의 가독성을 고쳤다. 계산·정책을 바꾸지 않은 f17647a에서 전체를 다시 실행했다. 과거 성공으로 최종 코드의 성공을 대신하지 않았다.

보존한 실패·검토 항목:

1. 초기 Git safe.directory 역슬래시/uv 기본 cache 권한 읽기 실패는 task-private 경로와 프로세스별 경로 정규화로 해결했다. 전역 설정·설치 없음.
2. PoC 첫 컴파일은 Array.isArray 뒤 반환 타입의 TS7053이었다. 명시 반환 타입으로 고쳤고 타입 강제 캐스팅으로 숨기지 않았다.
3. 집중11/12의 실패는 합성 입력 `甲亥`의 잘못된 음양 짝이었다. 같은 목 인성인 유효 `乙亥`로 고치고 손계산72tenths는 그대로 보존했다. 기존 테스트 기대를 바꾼 것이 아니다.
4. 독립 코드 읽기에서 추가 nested caller metadata가 얕은 spread를 통해 함께 동결될 수 있음을 찾았다. 네 primitive 필드만 투영하고 회귀를 추가했다. 기존 M1/M2 코드는 변경하지 않았다.
5. Jest bridge의 첫 시도는 `it` alias 누락으로 중단됐다. alias만 추가한 뒤 원 테스트47개를 다시 실행했다. 공식 전체 Jest 통과라고 부르지 않는다.
6. 공개 요약 투영의 초기 과도한 금지필드 regex, 양음력 input 메타데이터의 바이트동일 강제도 조사기 오류로 남겼다. 명시 whitelist/허용 메타데이터만 분리했고 원결과·예상 수를 맞춰 바꾸지 않았다.
7. 마지막 320파일 지문 검사는 생성된 `.d.ts` 3개에서 실패했다. 원래 기대 지문을 바꾸지 않고 `82587ff`의 소스를 별도 private 디렉터리에서 같은 TS5.8.3으로 재빌드해 원 pin 3개를 모두 재현했다. 실제 차이는 union 순서가 아니라 `sourceRefs/ruleRefs/policyRefs` 속성 선언 순서 6곳이었다. Union-only 정규화 검사는 불통과 기록으로 보존했다. 후속 AST 검사는 고유 이름의 일반 속성 3개 이동만 허용해 타입·modifier·필수 여부와 그 밖의 모든 텍스트가 동일함을 확인했다. 중복 키·메서드·인덱스·오버로드는 없었다. 실행 소스/JavaScript 변경이나 320개 모두의 byte 불변으로 보고하지 않는다.

## 5. 보존과 전달

실제 파일을 다시 해시해 완료본2,086파일/후보a,b각8/2027보강5의 트리가 불변임을 확인한다. 기존 320 source/build 파일 중 **317개는 원래 지문과 같고**, 나머지는 `dist/m3/limitedSynthesisV1.d.ts`, `dist/m3/resourceSupportV1.d.ts`, `dist/m4/wealthResourcePositionV1.d.ts`의 생성 선언 3개다. 이전 소스의 재빌드 지문은 원 pin과 일치하며, 후속 제한적 AST 검사에서 현재 선언은 **속성 순서만 다른 의미 동등한 타입**임을 확인했다. 원 기대값을 현재 값으로 바꾸지 않았다. 기존 실행 소스·JavaScript와 기본 진입점·package/lock·기존 정책·지원 연도·시계·G0/G1-P2는 바꾸지 않았다.

| 지문 | 고정 값 |
| --- | --- |
| base manifest | `8ffadb04c8460969085610162d3d5e8855af9272a8a4be1dbe10123c15f90edf` |
| export | `7b5584aca339b85c7e54e953c43b672358bda605a478831b6f260df00472e851` |
| supplement | `f6a0e6dd2b169b4e758f8d1326942556c59f569af714adcb36e73824c6ef02b7` |

KASI/API키/재수집0, private추적0이다. 클론·원자료·후보·raw해석·전체응답을 Git에 넣지 않는다. 실제 주요 증거:

- `.private/oss-product-poc-qa-f17647a-final-qa-20261114.json` 및 개별 로그/close.
- `.private/oss-audit-20261114/`의 engine audit, runner pin, source manifest, native100/direct97 receipts, defect probes.
- `poc-final-{utc,seoul}/{summary,execution}.json`, `poc-cli-final/receipt.json`, `final-poc-text-and-reference-review.json`.
- `baseline.json`, 최종 보존·Push `final-delivery.json`.
- `old320-differences.json`, union-only 실패 `type-declaration-audit.json`, 별도 속성순서 검증 `type-declaration-property-order-audit.json`(SHA `e4c992d2e99101cf2b164b1e84be06cdb77380ba89b091481f7ed669c529632b`).

원 저장소 pytest/Vitest 전체·독립 스캔/비평판본·인간 명리 전문가·예측 타당성·전체 지원 연도 검증·역사시 gap/fold 검증·자료의 상업 재배포 승인은 **미수행/미확정**이다. 이번 라이선스 확인과 계산 비교를 그 승인으로 부르지 않는다. workflow는 foundation push만 대상임을 최종 diff와 함께 확인하고 승인 브랜치에만 일반 Push한다.
