# API 로컬 명식 → M2 → 한국어 기초 설명

`kasi:explain`은 출생 입력 하나를 기존 API 로컬 명식 계산기에 한 번 전달하고, 같은 실행의 모든 후보를 기존 M2 ChartFacts v3와 한국어 템플릿으로 연결한다. 결과 이름은 **명식 기초 분석/설명**이다. JSON과 TEXT를 stdout으로 출력하며 출생정보·결과 파일을 자동으로 저장하지 않는다. KASI API·키·LLM·외부 생성 서비스는 사용하지 않는다.

기본 엔진의2026~2027 범위와 G0/G1, 기존 `kasi:chart` 명령은 그대로다. 이 명령은 명시적으로 선택하는 로컬 실행 경로다. 시각을 포함한 출생 범위는 `kasi-api-1989-2026-local-v1`에서 양력 환산 `[1989-01-01,2027-01-01)`이다. `kasi-api-2026-local-v1`도 선택할 수 있다.1950~2026 자료 확보가1950년 시각 명식 지원을 뜻하지 않는다.

## 현재 Windows에서 실행

아래 입력은 모두 **개인 기록이 아닌 가상 입력**이다. 현재 PC에서 Node22를 선택하는 준비 명령이다. 다른 PC에서는 실행 파일 경로와 후보 위치만 해당 환경에 맞춘다. 현재 고정 의존성이 설치되어 있어 재설치가 필요 없다. 코드가 바뀌면 같은 Node22 환경에서 `npm run build`를 실행한다.

```powershell
Set-Location 'C:\Users\Home\Desktop\만세력 엔진\source'
$node = 'C:\Users\Home\Desktop\Manseryeok-KASI-1950-2026-windows-x64\Manseryeok-KASI-1950-2026\runtime\node.exe'
$candidate = '.private\kasi-research-1950-2026-fe84ab4-a'
$pin = '8ffadb04c8460969085610162d3d5e8855af9272a8a4be1dbe10123c15f90edf'
& $node --version
```

버전은 `v22.23.3`이다. `$pin`은 별도로 고정해 둔 기대 지문이다. 검사할 manifest에서 새 값을 읽어 이 기대값을 바꾸지 않는다. 후보가 없거나 지문이 다르면 실패하며 기존 fixture로 대체하지 않는다. 원문·export·후보a/b는 읽기 전용이다.

양력 가상 입력의 한국어 TEXT:

```powershell
$common = @(
  '--profile', 'kasi-api-1989-2026-local-v1',
  '--candidate', $candidate,
  '--manifest-sha', $pin,
  '--clock-policy', 'KR_API_PUBLISHED_KST_MODERN_1988_POST_DST_V1',
  '--day-rollover', 'CIVIL_MIDNIGHT',
  '--hour-stem-reference', 'SELECTED_DAY_PILLAR',
  '--m2-profile', 'm2-basic-classification-local-v1'
)
& $node .\scripts\kasi\local-explain.mjs @common `
  --calendar GREGORIAN --date 2026-06-01 --time 12:00 --output text
```

같은 날짜의 음력 입력은2026년4월16일 평달이다. JSON 구조를 검토하려면:

```powershell
& $node .\scripts\kasi\local-explain.mjs @common `
  --calendar KOREAN_LUNAR `
  --lunar-year 2026 --lunar-month 4 --lunar-day 16 --leap false `
  --time 12:00 --output json
```

실제 API 입춘의 발표 분에 해당하는 가상 입력은 두 상관 후보를 유지한다. JSON과 TEXT를 각각 실행한다.

```powershell
& $node .\scripts\kasi\local-explain.mjs @common `
  --calendar GREGORIAN --date 2026-02-04 --time 05:02 --output json
& $node .\scripts\kasi\local-explain.mjs @common `
  --calendar GREGORIAN --date 2026-02-04 --time 05:02 --output text
```

`npm run kasi:explain -- [같은 인자]`도 제공한다. 기계적으로 JSON만 읽을 때는 위 Node 직접 명령을 사용한다. npm 자체의 실행 배너는 계산 결과에 포함되지 않는다. 새 CLI는 정상 실행에서 stdout에 결과만 쓰며, 오류는 입력·비공개 경로를 인용하지 않는 JSON을 stderr에 쓴다. 문법·정책·지문·파일 문제는 exit1, 지원 범위나 음력 날짜 문제는 exit2다.

`--output json|text`, `--m2-profile`과 기존 명식 필수 인자를 모두 지정한다. 알 수 없는 인자·중복 인자·미지원 정책은 거절한다. 시간은 `HH:mm` 필수이며 미상 시각에 정오를 채우지 않는다. 음력은 윤달 여부를 `true` 또는 `false` 문자열로 지정한다. 양력 환산 날짜로 범위를 검사하므로 음력 연도 숫자만으로 허용 여부를 판단하지 않는다.

## 출력과 분류 기준

JSON은 `schemaVersion=kasi-local-basic-explanation-v1`, `status`, `m1`, `facts`, `explanation`을 담는다. `m1`에는 기존 명식·정책·프로필·dataset·manifest와 API 계산 출처가 남는다. `facts`에는 기존 ChartFacts v3 원본 결과(`genericM2`), 후보별 분류, 규칙·출처 목록이 있다. `explanation`에는 버전 있는 한국어 템플릿과 설명별 `factRefs`, `candidateRef`, `ruleRefs`, `policyRefs`, `sourceRefs`가 있다.

설명에서 fact, 후보·기둥 또는 장간 위치, 규칙·정책과 출처를 따라갈 수 있다. 각 fact의 `sourceRefs`는 M2 규칙 출처를 가리키며, `calculationSourceRefs`는 실제 API 절입·입춘·날짜 대응 자료를 가리킨다. KASI를 십성·지장간·지지 관계 규칙의 출처로 사용하지 않는다.

현재 묶음 `m2-basic-classification-local-v1`, 조합 버전1은 다음 **기존** 정책을 명시적으로 선택한다.

| 대상 | 원래 정책 ID | 원래 규칙 버전 필드 |
| --- | --- | --- |
| 지장간 | `M2-HIDDEN-STEMS-CLASSIC-MEMBERS-MAINQI-V1` | `1.0.0` |
| 십이운성 | `M2-12GROWTH-YANG-FWD-YIN-REV-FIRE-EARTH-V1` | `1.0.0` |
| 지지 쌍 관계 | `M2-BRANCH-RELATIONS-YHZP-PAIRS-LIUPO-2026-V1` | 없음(`null`) |
| 삼합·삼회 구성원 | `M2-TRIAD-FOUR-SANHE-FOUR-SANHUI-MEMBERSHIP-V1` | 없음(`null`) |

지지 쌍5개와 삼합·삼회2개 규칙에는 독립 version 필드가 없다. 정책 ID의V1 또는 새 조합 버전을 그 원래 규칙 버전으로 바꾸지 않는다. 오행·음양·십성의 기존 구현 참조와 위 정책의 문헌 출처 기록도 구분한다. 묶음 선택은 판본·이용권의 승인이 아니다.

오행·음양·십성 및 ChartFacts 조합의 상위 출처 등록부는 이 연결에서 새로 완성하지 않는다. 해당 규칙은 기존 구현의 경로·규칙 ID를 참조하고 `upstreamSourceRegistry=OPEN_NOT_CREATED_BY_THIS_BRIDGE`로 남는다. 문헌 출처가 없는 참조를 KASI나 다른 M2 문헌으로 채워 인증한 것처럼 표시하지 않는다.

지원하는 내용은 네 기둥의 천간·지지 음양·오행, 일간, 일간 기준 천간 십성, 장간별 십성, 선택한 정책의 십이운성, 기존 지지 쌍 관계, 삼합·삼회의 완전·부분 구성원이다. 지지 전체를 십성 하나로 단순화하지 않는다. 지장간의 본기 우선 표시와 장간별 십성을 구분하고, 본기 순서를 수치 세력으로 표현하지 않는다. 관계의 방향·동일 지지의 다른 기둥 위치·중복·겹침을 유지한다.

절입 표시 분의 두 후보는 M1에서 M2와 설명까지 따로 유지한다. 후보를 섞거나 한 후보를 대표로 선택하거나 확률을 부여하지 않는다. 표시 분의 연주·월주는 상관된 두 조합이며 임의4조합을 만들지 않는다. `DEFINITE`는 현재 분 비교 정책 안의 단일 후보라는 뜻이다.

시간 정책은 [현대 API 시계 정책](research/KASI_MODERN_API_CLOCK_POLICY_20261110.md)을 따른다. 기존 `CIVIL_MIDNIGHT|ZI_START`와 `SELECTED_DAY_PILLAR|CIVIL_DATE_DAY_PILLAR`의 네 조합을 유지한다. 묶음 예시가 일주·시주의 숨은 기본값은 아니다. API 원래 시각 표기와 역사시 미해결 표기는 보존한다.

## 앱·서버에서 재사용할 핵심 함수

CLI subprocess를 다시 호출하거나 출력 JSON을 읽어 연결하지 않는다. 검증한 후보를 한 번 로드해 프로필을 재사용하고 요청마다 다음 함수를 호출할 수 있다.

```javascript
import { loadLocalChartProfile } from './scripts/kasi/local-chart.mjs';
import { createLocalExplanationProfile } from './scripts/kasi/local-explain.mjs';

const chartProfile = await loadLocalChartProfile({
  directory: candidateDirectory,
  expectedManifestSha256: independentlyHeldManifestPin,
  profileId: 'kasi-api-1989-2026-local-v1',
});
const explanationProfile = createLocalExplanationProfile(chartProfile, {
  m2ProfileId: 'm2-basic-classification-local-v1',
});
const result = explanationProfile.calculate(explicitBirthRequest);
```

`calculate`는 기존 M1을 한 번 실행하고 같은 실행의 후보를 M2로 보낸다. `deriveLocalChartFacts`는 현재 프로세스에서 실제 검증된 로컬 계산이 발급한 결과인지와 내용 불변을 검사한다. 임의 JSON의 `status=OK`, 복제·재직렬화된 계산 결과, 다른 입력의 결과를 신뢰하지 않는다. 이 일관성 검사는 외부 출처 인증이나 기존 G0 receipt가 아니다.

발급한 facts는 전체 참조와 내용 검사를 거친 뒤 중첩 객체까지 동결한다. 이후 설명 단계는 같은 프로세스가 발급한 불변 객체임을 확인하므로 요청마다 전체 자료를 다시 읽거나 M1·M2를 재계산하지 않는다. 반환 facts의 직접 변조는 거절되고, 수정한 복제본도 신뢰된 facts가 되지 않는다.

설명 핵심은 `explainChartFacts(facts)`이며 역법을 계산하지 않는다. `validateExplanation(explanation,facts)`는 현재 검증된 facts와 설명의 후보·fact·규칙·정책·출처·템플릿 및 실제 문장을 대조한다. `renderExplanationText(result)`는 동일한 검증 뒤 TEXT를 만든다. 함수는 출생정보를 파일에 저장하지 않는다. JSON은 앱의 출력 계약으로 사용할 수 있지만, 저장한 JSON을 나중에 신뢰된 실행 객체로 재개하는 계약은 없다.

## 검증의 의미와 남은 범위

공개 검사는 합성 후보와 독립 유한 기대값을 사용한다. 대표 전문 snapshot은 [일반 합성 명식](../test/fixtures/kasi-explanation-ordinary-synthetic.txt), [절입 경계 합성 명식](../test/fixtures/kasi-explanation-boundary-synthetic.txt)이며 실제 API 원문이나 개인 기록이 아니다. 실제 비공개 후보의 전 범위 검사는 별도 실행 보고서에 코드 SHA·범위·개수를 기록한다. 기존 M2 함수와의 일치는 연결 일관성 검사이며 독립 원전 정확성 인증이 아니다.

신강약·격국·용신·조후·종격·합화, 관계의 효력·상쇄·길흉, 대운·세운·월운, 새 신살·궁합, 성격·직업·재물·건강·연애 예측은 구현하지 않았다.1988년 출생/DST·1950년 역사시도 이번 범위가 아니다. 원전 판본·권리·외부 검증의 열린 항목, G1-P2 NO-GO와 G0 경계는 그대로다. 공개 API·화면·로그인·결제·배포를 추가하지 않았다.

## 이번에 확인한 실행과 참조 이름공간

코드 SHA **c80233f09108c7196c44dd26579358279ece3731**에서 위 가상 양력/음력 명령과 실제 입춘 JSON/TEXT를 직접 실행했다. 일반 명식은 丙午·癸巳·丙午·甲午이며 양·음력의 분류·설명이 같다. 입춘은 경계 전 乙巳·己丑·己酉·丁卯, 경계 후 丙午·庚寅·己酉·丁卯를 각각 유지한다. [전체 검사·실패·실제 집계](engineering/KASI_API_M2_EXPLANATION_EXECUTION_20261110.md)에419개 전체 검사와 UTC/AsiaSeoul 각47,975입력쌍을 기록했다.

ref는 명시적 이름공간을 사용한다. `chart.candidates[i].role`은 같은 결과의 `m1.chart`(또는 불변 사본 `facts.calculation.chart`)에 있는 기둥이다. `chart.candidates[i]#...`는 후보의 `facts` 배열에서 ID로 찾는 사실이며 JSON 속성 경로가 아니다. 기존 M2의 `preview.candidates[i].role`은 `facts.preview.preview`를 기준으로 읽는다. `genericM2.*`는 `facts.genericM2`, `facts.candidates[i].pillars[j].branchTenGods.members[k]`는 그 결과의 실제 장간 위치다. 어느 후보의 경로인지 끝까지 유지한다.

npm으로 결과 JSON만 읽으려면 부모 npm의 배너도 끈다. 기존 인자 전체를 그대로 넘기는 명령 형태는 `npm run --silent kasi:explain -- [인자 전체]`다. 현재 PC에서 Node22의 npm CLI를 확실히 사용할 때는 다음과 같이 실행한다. 이 PC별 경로는 가이드에만 있으며 핵심 모듈에는 없다.

```powershell
# 위 준비 블록의 $node와 $common을 사용한다.
$npmCli = 'C:\Program Files\nodejs\node_modules\npm\bin\npm-cli.js'
$env:PATH = (Split-Path -Parent $node) + ';' + $env:PATH
& $node $npmCli run --silent kasi:explain -- @common `
  --calendar GREGORIAN --date 2026-06-01 --time 12:00 --output json
```

이 명령은 설치된 고정 TypeScript로 빌드한 뒤 실행한다. 이번 문서 검토에서도 실제 실행해 exit0·stderr 공백이고, 배너 없는 JSON 전체가 Node 직접 실행과 같음을 확인했다. 생성된 JSON을 사용자가 직접 파일로 리다이렉트할 때만 파일이 생긴다. 개인 기록을 개발 로그나 Git에 보관하지 않는다.
